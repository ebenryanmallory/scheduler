import { useMemo, useEffect, useState, useCallback } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { useTimerStore } from '@/store/timerStore';
import { useProjectStore } from '@/store/projectStore';
import { TaskType } from '@/types/task';
import {
  DailyTimeStats,
  ProjectTimeBreakdown,
  WeeklyTimeEntry,
  TimeHistoryEntry,
  TimeAnalytics,
  DateRangeOption,
} from '@/types/analytics';

// Helper to get start of day
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper to check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Helper to get day label (Mon, Tue, etc.)
function getDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// Helper to format date as ISO date string (YYYY-MM-DD)
function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Convert minutes to milliseconds
function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

/**
 * Calculate daily statistics from tasks
 */
function calculateDailyStats(tasks: TaskType[], today: Date): DailyTimeStats {
  const todayStart = startOfDay(today);
  
  const todayTasks = tasks.filter((task) => {
    const taskDate = new Date(task.date);
    return isSameDay(taskDate, todayStart);
  });

  let totalTrackedMs = 0;
  let estimatedMs = 0;
  let taskCount = 0;

  for (const task of todayTasks) {
    // Add actual duration if tracked
    if (task.actualDuration !== undefined && task.actualDuration > 0) {
      totalTrackedMs += minutesToMs(task.actualDuration);
      taskCount++;
    } else if (task.timeTracking?.accumulatedMs) {
      // Use accumulated time if timer was used but not completed
      totalTrackedMs += task.timeTracking.accumulatedMs;
      taskCount++;
    }

    // Add estimated duration if set
    if (task.estimatedDuration !== undefined && task.estimatedDuration > 0) {
      estimatedMs += minutesToMs(task.estimatedDuration);
    }
  }

  // Calculate variance (actual - estimated)
  const variance = totalTrackedMs - estimatedMs;

  // Calculate accuracy percentage
  // 100 = perfect estimation, decreases as variance increases
  let accuracy = 100;
  if (estimatedMs > 0) {
    const variancePercent = Math.abs(variance / estimatedMs) * 100;
    accuracy = Math.max(0, 100 - variancePercent);
  } else if (totalTrackedMs > 0) {
    // If no estimate but has tracked time, accuracy is 0
    accuracy = 0;
  }

  return {
    totalTrackedMs,
    estimatedMs,
    variance,
    accuracy: Math.round(accuracy),
    taskCount,
  };
}

/**
 * Calculate time breakdown by project
 */
function calculateProjectBreakdown(
  tasks: TaskType[],
  today: Date,
  getProjectColor: (name: string) => string
): ProjectTimeBreakdown[] {
  const todayStart = startOfDay(today);
  
  const todayTasks = tasks.filter((task) => {
    const taskDate = new Date(task.date);
    return isSameDay(taskDate, todayStart);
  });

  // Group by project
  const projectMap = new Map<string, number>();
  let totalMs = 0;

  for (const task of todayTasks) {
    let trackedMs = 0;
    
    if (task.actualDuration !== undefined && task.actualDuration > 0) {
      trackedMs = minutesToMs(task.actualDuration);
    } else if (task.timeTracking?.accumulatedMs) {
      trackedMs = task.timeTracking.accumulatedMs;
    }

    if (trackedMs > 0) {
      const projectName = task.project || 'No Project';
      const current = projectMap.get(projectName) || 0;
      projectMap.set(projectName, current + trackedMs);
      totalMs += trackedMs;
    }
  }

  // Convert to array and calculate percentages
  const breakdown: ProjectTimeBreakdown[] = [];
  
  for (const [projectName, trackedMs] of projectMap.entries()) {
    breakdown.push({
      projectName,
      projectColor: getProjectColor(projectName),
      trackedMs,
      percentage: totalMs > 0 ? Math.round((trackedMs / totalMs) * 100) : 0,
    });
  }

  // Sort by time tracked descending
  breakdown.sort((a, b) => b.trackedMs - a.trackedMs);

  return breakdown;
}

/**
 * Get weekly history (last 7 days)
 */
function getWeeklyHistory(tasks: TaskType[]): WeeklyTimeEntry[] {
  const today = new Date();
  const history: WeeklyTimeEntry[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayStart = startOfDay(date);

    const dayTasks = tasks.filter((task) => {
      const taskDate = new Date(task.date);
      return isSameDay(taskDate, dayStart);
    });

    let trackedMs = 0;
    let estimatedMs = 0;

    for (const task of dayTasks) {
      if (task.actualDuration !== undefined && task.actualDuration > 0) {
        trackedMs += minutesToMs(task.actualDuration);
      } else if (task.timeTracking?.accumulatedMs) {
        trackedMs += task.timeTracking.accumulatedMs;
      }

      if (task.estimatedDuration !== undefined && task.estimatedDuration > 0) {
        estimatedMs += minutesToMs(task.estimatedDuration);
      }
    }

    history.push({
      date: formatDateISO(date),
      dayLabel: getDayLabel(date),
      trackedMs,
      estimatedMs,
    });
  }

  return history;
}

/**
 * Get detailed time tracking history for all tasks
 */
function getTimeHistory(
  tasks: TaskType[],
  getProjectColor: (name: string) => string,
  dateRange: DateRangeOption
): TimeHistoryEntry[] {
  const history: TimeHistoryEntry[] = [];
  const today = new Date();

  // Filter tasks based on date range
  let filteredTasks = tasks;
  if (dateRange !== 'all') {
    const cutoffDate = new Date(today);
    if (dateRange === 'today') {
      cutoffDate.setDate(cutoffDate.getDate() - 1);
    } else if (dateRange === 'week') {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else if (dateRange === 'month') {
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    }
    
    filteredTasks = tasks.filter((task) => {
      const taskDate = new Date(task.date);
      return taskDate >= cutoffDate;
    });
  }

  for (const task of filteredTasks) {
    // Include tasks with time tracking history
    if (task.timeTracking?.history && task.timeTracking.history.length > 0) {
      for (const entry of task.timeTracking.history) {
        history.push({
          taskId: task.id,
          taskTitle: task.title,
          projectName: task.project,
          projectColor: task.project ? getProjectColor(task.project) : undefined,
          date: formatDateISO(new Date(entry.startedAt)),
          durationMs: entry.durationMs,
          startedAt: entry.startedAt,
          endedAt: entry.endedAt,
        });
      }
    } else if (task.actualDuration && task.actualDuration > 0) {
      // Fallback for tasks with actualDuration but no detailed history
      history.push({
        taskId: task.id,
        taskTitle: task.title,
        projectName: task.project,
        projectColor: task.project ? getProjectColor(task.project) : undefined,
        date: formatDateISO(new Date(task.date)),
        durationMs: minutesToMs(task.actualDuration),
        startedAt: new Date(task.date).toISOString(),
      });
    }
  }

  // Sort by date descending (most recent first)
  history.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return history;
}

/**
 * Format milliseconds to human-readable string (e.g., "2h 30m")
 */
export function formatDuration(ms: number): string {
  if (ms < 0) ms = Math.abs(ms);
  
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }
  
  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * Format milliseconds to HH:MM format
 */
export function formatTimeHHMM(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

interface UseTimeAnalyticsOptions {
  /** Date range filter for history view */
  historyDateRange?: DateRangeOption;
}

interface UseTimeAnalyticsReturn extends TimeAnalytics {
  /** Whether analytics are being calculated */
  isLoading: boolean;
  /** Last update timestamp */
  lastUpdated: Date;
  /** Force recalculation */
  refresh: () => void;
}

/**
 * Hook for calculating time tracking analytics
 * Subscribes to timer store for real-time updates
 */
export function useTimeAnalytics(
  options: UseTimeAnalyticsOptions = {}
): UseTimeAnalyticsReturn {
  const { historyDateRange = 'week' } = options;
  
  const { tasks } = useTaskStore();
  const { activeTaskId } = useTimerStore();
  const { getProjectColor } = useProjectStore();
  
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Force refresh function
  const refresh = useCallback(() => {
    setUpdateTrigger((prev) => prev + 1);
    setLastUpdated(new Date());
  }, []);

  // Subscribe to timer changes for real-time updates
  // Debounced to prevent excessive recalculations
  useEffect(() => {
    if (activeTaskId) {
      // Update every 30 seconds when timer is running
      const interval = setInterval(() => {
        setLastUpdated(new Date());
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [activeTaskId]);

  // Update when timer state changes
  useEffect(() => {
    setLastUpdated(new Date());
  }, [activeTaskId]);

  // Memoized daily stats
  const dailyStats = useMemo(() => {
    return calculateDailyStats(tasks, new Date());
  }, [tasks, updateTrigger, lastUpdated]);

  // Memoized project breakdown
  const projectBreakdown = useMemo(() => {
    return calculateProjectBreakdown(tasks, new Date(), getProjectColor);
  }, [tasks, getProjectColor, updateTrigger, lastUpdated]);

  // Memoized weekly history
  const weeklyHistory = useMemo(() => {
    return getWeeklyHistory(tasks);
  }, [tasks, updateTrigger]);

  // Memoized time history
  const timeHistory = useMemo(() => {
    return getTimeHistory(tasks, getProjectColor, historyDateRange);
  }, [tasks, getProjectColor, historyDateRange, updateTrigger]);

  return {
    dailyStats,
    projectBreakdown,
    weeklyHistory,
    timeHistory,
    isLoading: false,
    lastUpdated,
    refresh,
  };
}

