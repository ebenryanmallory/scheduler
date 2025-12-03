import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { useTimer, formatTimeHHMMSS, msToMinutes } from '@/hooks/useTimer';
import { useTimerStore } from '@/store/timerStore';
import { TimeTrackingState, TaskType } from '@/types/task';
import { cn } from '@/lib/utils';

const AUTO_SAVE_INTERVAL_MS = 30000; // 30 seconds (AC4)

interface TaskTimerProps {
  task: TaskType;
  onTimeUpdate?: (timeTracking: TimeTrackingState, actualDuration: number) => void;
  compact?: boolean;
}

/**
 * Timer component for task time tracking
 * Displays timer controls (start/pause/resume/stop), elapsed time,
 * status badge, and manual time entry option
 */
export function TaskTimer({ task, onTimeUpdate, compact = false }: TaskTimerProps) {
  const [manualMinutes, setManualMinutes] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  const { setActiveTimer, clearActiveTimer, isActiveTimer, hasActiveTimer } = useTimerStore();
  
  const lastSaveRef = useRef<number>(Date.now());
  
  const handleStateChange = useCallback((state: TimeTrackingState) => {
    const actualDuration = msToMinutes(state.accumulatedMs);
    onTimeUpdate?.(state, actualDuration);
  }, [onTimeUpdate]);
  
  const {
    elapsedMs,
    isRunning,
    isPaused,
    status,
    timeTracking: currentTimeTracking,
    start,
    pause,
    resume,
    stop,
    formatTime
  } = useTimer({
    taskId: task.id,
    initialState: task.timeTracking,
    onStateChange: handleStateChange
  });
  
  // Sync with global timer store
  useEffect(() => {
    if (isRunning && !isActiveTimer(task.id)) {
      // Timer was restored from localStorage, update global store
      setActiveTimer(task.id, task.title);
    }
  }, [isRunning, task.id, task.title, isActiveTimer, setActiveTimer]);
  
  // Auto-save to server every 30 seconds while running (AC4)
  useEffect(() => {
    if (!isRunning) return;
    
    const saveInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastSaveRef.current >= AUTO_SAVE_INTERVAL_MS) {
        lastSaveRef.current = now;
        // Use hook's current state (not stale prop) to ensure correct startedAt after pause/resume
        const currentState: TimeTrackingState = {
          status: 'in_progress',
          startedAt: currentTimeTracking.startedAt,
          accumulatedMs: elapsedMs,
          history: currentTimeTracking.history
        };
        const actualDuration = msToMinutes(elapsedMs);
        onTimeUpdate?.(currentState, actualDuration);
      }
    }, AUTO_SAVE_INTERVAL_MS);
    
    return () => clearInterval(saveInterval);
  }, [isRunning, elapsedMs, currentTimeTracking, onTimeUpdate]);
  
  const handleStart = useCallback(() => {
    // Check if we can start (no other timer running)
    if (setActiveTimer(task.id, task.title)) {
      start();
    }
  }, [task.id, task.title, setActiveTimer, start]);
  
  const handlePause = useCallback(() => {
    pause();
  }, [pause]);
  
  const handleResume = useCallback(() => {
    // Re-check if we can resume
    if (setActiveTimer(task.id, task.title)) {
      resume();
    }
  }, [task.id, task.title, setActiveTimer, resume]);
  
  const handleStop = useCallback(() => {
    const finalState = stop();
    clearActiveTimer();
    
    // Calculate and report actual duration
    const actualDuration = msToMinutes(finalState.accumulatedMs);
    onTimeUpdate?.(finalState, actualDuration);
  }, [stop, clearActiveTimer, onTimeUpdate]);
  
  const handleManualEntry = useCallback(() => {
    const minutes = parseInt(manualMinutes, 10);
    if (isNaN(minutes) || minutes <= 0) return;
    
    const manualMs = minutes * 60 * 1000;
    const now = new Date().toISOString();
    
    const newState: TimeTrackingState = {
      status: 'completed',
      accumulatedMs: (task.timeTracking?.accumulatedMs || 0) + manualMs,
      history: [
        ...(task.timeTracking?.history || []),
        {
          startedAt: now,
          endedAt: now,
          durationMs: manualMs
        }
      ]
    };
    
    onTimeUpdate?.(newState, msToMinutes(newState.accumulatedMs));
    setManualMinutes('');
    setShowManualEntry(false);
  }, [manualMinutes, task.timeTracking, onTimeUpdate]);
  
  // Get status badge variant and label
  const getStatusBadge = () => {
    switch (status) {
      case 'in_progress':
        return { variant: 'default' as const, label: 'In Progress', className: 'bg-green-500 hover:bg-green-600' };
      case 'paused':
        return { variant: 'secondary' as const, label: 'Paused', className: 'bg-yellow-500 hover:bg-yellow-600 text-black' };
      case 'completed':
        return { variant: 'outline' as const, label: 'Completed', className: 'border-green-500 text-green-600' };
      default:
        return { variant: 'outline' as const, label: 'Not Started', className: '' };
    }
  };
  
  const statusBadge = getStatusBadge();
  const displayTime = formatTime(elapsedMs);
  const isThisTimerActive = isActiveTimer(task.id);
  const anotherTimerRunning = hasActiveTimer() && !isThisTimerActive;
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={statusBadge.variant} className={cn('text-xs', statusBadge.className)}>
          {statusBadge.label}
        </Badge>
        {(isRunning || isPaused || status === 'completed') && (
          <span className="text-xs font-mono text-muted-foreground">
            {displayTime}
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-2 mt-2 p-2 rounded-md bg-muted/50 dark:bg-muted/20">
      {/* Timer Display and Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-lg tabular-nums">
            {displayTime}
          </span>
          <Badge variant={statusBadge.variant} className={cn('text-xs', statusBadge.className)}>
            {statusBadge.label}
          </Badge>
        </div>
        
        {/* Estimated duration display */}
        {task.estimatedDuration && (
          <span className="text-xs text-muted-foreground">
            Est: {task.estimatedDuration}m
          </span>
        )}
      </div>
      
      {/* Timer Controls */}
      <div className="flex items-center gap-1">
        {status === 'not_started' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStart}
            disabled={anotherTimerRunning}
            className="h-7 px-2 text-xs"
          >
            <Play className="h-3 w-3 mr-1" />
            Start
          </Button>
        )}
        
        {isRunning && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePause}
              className="h-7 px-2 text-xs"
            >
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStop}
              className="h-7 px-2 text-xs"
            >
              <Square className="h-3 w-3 mr-1" />
              Stop
            </Button>
          </>
        )}
        
        {isPaused && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResume}
              disabled={anotherTimerRunning}
              className="h-7 px-2 text-xs"
            >
              <Play className="h-3 w-3 mr-1" />
              Resume
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStop}
              className="h-7 px-2 text-xs"
            >
              <Square className="h-3 w-3 mr-1" />
              Stop
            </Button>
          </>
        )}
        
        {status === 'completed' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStart}
            disabled={anotherTimerRunning}
            className="h-7 px-2 text-xs"
          >
            <Play className="h-3 w-3 mr-1" />
            Restart
          </Button>
        )}
        
        {/* Manual Entry Toggle */}
        {(status === 'not_started' || status === 'completed') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="h-7 px-2 text-xs ml-auto"
          >
            + Log Time
          </Button>
        )}
      </div>
      
      {/* Manual Time Entry (AC6) */}
      {showManualEntry && (
        <div className="flex items-center gap-2 mt-1">
          <Input
            type="number"
            placeholder="Minutes"
            value={manualMinutes}
            onChange={(e) => setManualMinutes(e.target.value)}
            className="h-7 w-20 text-xs"
            min={1}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualEntry}
            disabled={!manualMinutes || parseInt(manualMinutes) <= 0}
            className="h-7 px-2 text-xs"
          >
            Log
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowManualEntry(false)}
            className="h-7 px-2 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}
      
      {/* Actual Duration Summary */}
      {status === 'completed' && task.actualDuration && task.actualDuration > 0 && (
        <div className="text-xs text-muted-foreground mt-1">
          Total tracked: {task.actualDuration}m
          {task.estimatedDuration && (
            <span className={cn(
              'ml-2',
              task.actualDuration > task.estimatedDuration ? 'text-red-500' : 'text-green-500'
            )}>
              ({task.actualDuration > task.estimatedDuration ? '+' : ''}{task.actualDuration - task.estimatedDuration}m vs estimate)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

