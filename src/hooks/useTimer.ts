import { useState, useEffect, useRef, useCallback } from 'react';
import { TimeTrackingState, TimeTrackingEntry } from '@/types/task';

const TIMER_STORAGE_KEY = 'scheduler_active_timer';

interface TimerStorageState {
  taskId: string;
  timeTracking: TimeTrackingState;
  savedAt: string; // ISO timestamp when state was saved
}

interface UseTimerOptions {
  taskId: string;
  initialState?: TimeTrackingState;
  onStateChange?: (state: TimeTrackingState) => void;
}

interface UseTimerReturn {
  elapsedMs: number;
  isRunning: boolean;
  isPaused: boolean;
  status: TimeTrackingState['status'];
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => TimeTrackingState;
  reset: () => void;
  formatTime: (ms: number) => string;
}

/**
 * Format milliseconds to HH:MM:SS string
 */
export function formatTimeHHMMSS(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Convert milliseconds to minutes (rounded)
 */
export function msToMinutes(ms: number): number {
  return Math.round(ms / 60000);
}

/**
 * Custom hook for task time tracking with Web Worker support
 * Persists state to localStorage for page refresh resilience
 */
export function useTimer({ taskId, initialState, onStateChange }: UseTimerOptions): UseTimerReturn {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timeTracking, setTimeTracking] = useState<TimeTrackingState>(() => {
    return initialState ?? {
      status: 'not_started',
      accumulatedMs: 0,
      history: []
    };
  });
  
  const workerRef = useRef<Worker | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // Check if Web Workers are supported
  const supportsWorker = typeof Worker !== 'undefined';
  
  /**
   * Save timer state to localStorage
   */
  const saveToStorage = useCallback((state: TimeTrackingState) => {
    try {
      const storageState: TimerStorageState = {
        taskId,
        timeTracking: state,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(storageState));
    } catch (e) {
      console.warn('Failed to save timer state to localStorage:', e);
    }
  }, [taskId]);
  
  /**
   * Clear timer state from localStorage
   */
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear timer state from localStorage:', e);
    }
  }, []);
  
  /**
   * Restore timer state from localStorage on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TIMER_STORAGE_KEY);
      if (!stored) return;
      
      const storageState: TimerStorageState = JSON.parse(stored);
      
      // Only restore if it's for this task
      if (storageState.taskId !== taskId) return;
      
      const { timeTracking: storedTracking, savedAt } = storageState;
      
      // If timer was running when saved, calculate elapsed time since save
      if (storedTracking.status === 'in_progress' && storedTracking.startedAt) {
        const savedAtTime = new Date(savedAt).getTime();
        const now = Date.now();
        const timeSinceSave = now - savedAtTime;
        
        // Add time since save to accumulated time
        const updatedTracking: TimeTrackingState = {
          ...storedTracking,
          accumulatedMs: storedTracking.accumulatedMs + timeSinceSave,
          startedAt: new Date().toISOString() // Reset start time to now
        };
        
        setTimeTracking(updatedTracking);
        setElapsedMs(updatedTracking.accumulatedMs);
        
        // Auto-resume the timer
        startTimerInternal(updatedTracking.accumulatedMs);
      } else {
        // Just restore the state without resuming
        setTimeTracking(storedTracking);
        setElapsedMs(storedTracking.accumulatedMs);
      }
    } catch (e) {
      console.warn('Failed to restore timer state from localStorage:', e);
    }
  }, [taskId]);
  
  /**
   * Notify parent of state changes
   */
  useEffect(() => {
    onStateChange?.(timeTracking);
  }, [timeTracking, onStateChange]);
  
  /**
   * Initialize Web Worker
   */
  useEffect(() => {
    if (supportsWorker) {
      try {
        workerRef.current = new Worker(
          new URL('../workers/timerWorker.ts', import.meta.url),
          { type: 'module' }
        );
        
        workerRef.current.onmessage = (event) => {
          if (event.data.type === 'tick') {
            setElapsedMs(event.data.elapsedMs);
          }
        };
      } catch (e) {
        console.warn('Failed to initialize Web Worker, using fallback:', e);
      }
    }
    
    return () => {
      // Cleanup
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, [supportsWorker]);
  
  /**
   * Internal function to start timer ticking
   */
  const startTimerInternal = useCallback((accumulatedMs: number) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'start', accumulatedMs });
    } else {
      // Fallback to setInterval
      startTimeRef.current = performance.now();
      
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
      
      fallbackIntervalRef.current = setInterval(() => {
        const elapsed = accumulatedMs + (performance.now() - startTimeRef.current);
        setElapsedMs(elapsed);
      }, 1000);
      
      // Immediate tick
      setElapsedMs(accumulatedMs);
    }
  }, []);
  
  /**
   * Stop timer ticking
   */
  const stopTimerInternal = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' });
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);
  
  /**
   * Start the timer
   */
  const start = useCallback(() => {
    const now = new Date().toISOString();
    const newState: TimeTrackingState = {
      status: 'in_progress',
      startedAt: now,
      accumulatedMs: 0,
      history: []
    };
    
    setTimeTracking(newState);
    setElapsedMs(0);
    saveToStorage(newState);
    startTimerInternal(0);
  }, [saveToStorage, startTimerInternal]);
  
  /**
   * Pause the timer
   */
  const pause = useCallback(() => {
    stopTimerInternal();
    
    const now = new Date().toISOString();
    const sessionMs = timeTracking.startedAt 
      ? Date.now() - new Date(timeTracking.startedAt).getTime()
      : 0;
    
    const newAccumulated = timeTracking.accumulatedMs + sessionMs;
    
    const newState: TimeTrackingState = {
      ...timeTracking,
      status: 'paused',
      pausedAt: now,
      accumulatedMs: newAccumulated,
      startedAt: undefined
    };
    
    setTimeTracking(newState);
    setElapsedMs(newAccumulated);
    saveToStorage(newState);
  }, [timeTracking, stopTimerInternal, saveToStorage]);
  
  /**
   * Resume the timer
   */
  const resume = useCallback(() => {
    const now = new Date().toISOString();
    const newState: TimeTrackingState = {
      ...timeTracking,
      status: 'in_progress',
      startedAt: now,
      pausedAt: undefined
    };
    
    setTimeTracking(newState);
    saveToStorage(newState);
    startTimerInternal(timeTracking.accumulatedMs);
  }, [timeTracking, saveToStorage, startTimerInternal]);
  
  /**
   * Stop the timer and return final state
   */
  const stop = useCallback((): TimeTrackingState => {
    stopTimerInternal();
    
    const now = new Date().toISOString();
    const sessionMs = timeTracking.startedAt 
      ? Date.now() - new Date(timeTracking.startedAt).getTime()
      : 0;
    
    const finalAccumulated = timeTracking.accumulatedMs + sessionMs;
    
    // Create history entry for this session
    const newEntry: TimeTrackingEntry = {
      startedAt: timeTracking.startedAt || now,
      endedAt: now,
      durationMs: sessionMs
    };
    
    const newState: TimeTrackingState = {
      status: 'completed',
      accumulatedMs: finalAccumulated,
      history: [...timeTracking.history, newEntry],
      startedAt: undefined,
      pausedAt: undefined
    };
    
    setTimeTracking(newState);
    setElapsedMs(finalAccumulated);
    clearStorage(); // Clear storage when stopped
    
    return newState;
  }, [timeTracking, stopTimerInternal, clearStorage]);
  
  /**
   * Reset the timer
   */
  const reset = useCallback(() => {
    stopTimerInternal();
    
    const newState: TimeTrackingState = {
      status: 'not_started',
      accumulatedMs: 0,
      history: []
    };
    
    setTimeTracking(newState);
    setElapsedMs(0);
    clearStorage();
  }, [stopTimerInternal, clearStorage]);
  
  return {
    elapsedMs,
    isRunning: timeTracking.status === 'in_progress',
    isPaused: timeTracking.status === 'paused',
    status: timeTracking.status,
    start,
    pause,
    resume,
    stop,
    reset,
    formatTime: formatTimeHHMMSS
  };
}





