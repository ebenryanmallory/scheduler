import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

interface TimerStore {
  /** Currently active timer task ID, null if no timer running */
  activeTaskId: string | null;
  /** Title of the active task (for display purposes) */
  activeTaskTitle: string | null;
  /** Timestamp when the active timer started */
  activeTimerStartedAt: string | null;
  
  /**
   * Attempt to set a task as the active timer
   * Returns true if successful, false if another timer is running
   */
  setActiveTimer: (taskId: string, taskTitle: string) => boolean;
  
  /**
   * Clear the active timer (called when timer is stopped)
   */
  clearActiveTimer: () => void;
  
  /**
   * Check if a specific task has the active timer
   */
  isActiveTimer: (taskId: string) => boolean;
  
  /**
   * Check if any timer is currently active
   */
  hasActiveTimer: () => boolean;
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      activeTaskId: null,
      activeTaskTitle: null,
      activeTimerStartedAt: null,
      
      setActiveTimer: (taskId: string, taskTitle: string) => {
        const state = get();
        
        // Check if another timer is already running (AC9, AC10)
        if (state.activeTaskId && state.activeTaskId !== taskId) {
          // Show warning toast (AC10)
          toast.error(`Timer Already Running\nStop the timer on "${state.activeTaskTitle}" first.`, {
            duration: 4000,
            icon: '⚠️'
          });
          return false;
        }
        
        // Set this task as the active timer
        set({
          activeTaskId: taskId,
          activeTaskTitle: taskTitle,
          activeTimerStartedAt: new Date().toISOString()
        });
        
        return true;
      },
      
      clearActiveTimer: () => {
        set({
          activeTaskId: null,
          activeTaskTitle: null,
          activeTimerStartedAt: null
        });
      },
      
      isActiveTimer: (taskId: string) => {
        return get().activeTaskId === taskId;
      },
      
      hasActiveTimer: () => {
        return get().activeTaskId !== null;
      }
    }),
    {
      name: 'scheduler_timer_store',
      partialize: (state) => ({
        activeTaskId: state.activeTaskId,
        activeTaskTitle: state.activeTaskTitle,
        activeTimerStartedAt: state.activeTimerStartedAt
      })
    }
  )
);

