import { useMemo, useEffect, useState, useCallback } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { useTimeAnalytics } from './useTimeAnalytics';
import { TaskType } from '@/types/task';
import {
  DailyProgress,
  StreakData,
  FocusBreakdown,
  ProductivityScore,
  QuickStats,
  Milestone,
  MilestoneType,
  PersistedStreakData,
  PersistedMilestones,
} from '@/types/stats';

const STREAK_STORAGE_KEY = 'scheduler_streak_data';
const MILESTONES_STORAGE_KEY = 'scheduler_milestones';

// Helper to get start of day in local timezone
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

// Format date as YYYY-MM-DD string for consistent comparison
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convert minutes to milliseconds
function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

/**
 * Calculate daily progress (completed vs total tasks)
 */
function calculateDailyProgress(tasks: TaskType[]): DailyProgress {
  const today = startOfDay(new Date());
  
  const todayTasks = tasks.filter((task) => {
    const taskDate = new Date(task.date);
    return isSameDay(taskDate, today);
  });

  const completed = todayTasks.filter((t) => t.completed).length;
  const total = todayTasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

/**
 * Calculate streak data (consecutive days with completed tasks)
 */
function calculateStreak(tasks: TaskType[]): StreakData {
  const today = new Date();
  const todayKey = formatDateKey(today);
  
  // Group tasks by date and track which dates have completions
  const completionsByDate = new Map<string, boolean>();
  
  for (const task of tasks) {
    const dateKey = formatDateKey(new Date(task.date));
    if (task.completed) {
      completionsByDate.set(dateKey, true);
    } else if (!completionsByDate.has(dateKey)) {
      completionsByDate.set(dateKey, false);
    }
  }

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date(today);
  
  // Check if today has any tasks - if yes, include today in streak check
  // If today has tasks but none completed, streak is 0
  // If today has no tasks yet, check from yesterday
  const todayHasTasks = completionsByDate.has(todayKey);
  const todayHasCompletions = completionsByDate.get(todayKey) === true;
  
  if (todayHasTasks && !todayHasCompletions) {
    // Today has tasks but none completed - streak is 0
    currentStreak = 0;
  } else {
    // Either today is complete or we start from yesterday
    if (!todayHasTasks) {
      // No tasks today - start checking from yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Count consecutive days with completions
    while (true) {
      const dateKey = formatDateKey(checkDate);
      
      if (completionsByDate.get(dateKey) === true) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (completionsByDate.has(dateKey)) {
        // Date exists but no completions - streak broken
        break;
      } else {
        // No data for this date - streak broken
        break;
      }
      
      // Safety limit to prevent infinite loops
      if (currentStreak > 1000) break;
    }
  }

  // Load persisted longest streak
  let longestStreak = currentStreak;
  try {
    const stored = localStorage.getItem(STREAK_STORAGE_KEY);
    if (stored) {
      const data: PersistedStreakData = JSON.parse(stored);
      longestStreak = Math.max(currentStreak, data.longestStreak || 0);
    }
  } catch {
    // Ignore localStorage errors
  }

  // Find last active date
  let lastActiveDate = todayKey;
  if (todayHasCompletions) {
    lastActiveDate = todayKey;
  } else {
    // Find most recent date with completions
    const sortedDates = Array.from(completionsByDate.entries())
      .filter(([, hasCompletion]) => hasCompletion)
      .map(([date]) => date)
      .sort()
      .reverse();
    
    if (sortedDates.length > 0) {
      lastActiveDate = sortedDates[0];
    }
  }

  // Persist updated streak data
  try {
    const persistData: PersistedStreakData = {
      currentStreak,
      longestStreak,
      lastActiveDate,
      lastCalculatedDate: todayKey,
    };
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(persistData));
  } catch {
    // Ignore localStorage errors
  }

  return {
    currentStreak,
    longestStreak,
    lastActiveDate,
  };
}

/**
 * Calculate focus time breakdown
 * Focus = tracked time, Break = estimated untracked time (8h workday assumption)
 */
function calculateFocusBreakdown(tasks: TaskType[]): FocusBreakdown {
  const today = startOfDay(new Date());
  
  const todayTasks = tasks.filter((task) => {
    const taskDate = new Date(task.date);
    return isSameDay(taskDate, today);
  });

  let focusTimeMs = 0;
  
  for (const task of todayTasks) {
    if (task.actualDuration !== undefined && task.actualDuration > 0) {
      focusTimeMs += minutesToMs(task.actualDuration);
    } else if (task.timeTracking?.accumulatedMs) {
      focusTimeMs += task.timeTracking.accumulatedMs;
    }
  }

  // Assume 8-hour workday, break = untracked time
  const workdayMs = 8 * 60 * 60 * 1000; // 8 hours
  const breakTimeMs = Math.max(0, workdayMs - focusTimeMs);
  
  // Calculate ratio (if no tracked time, ratio is 0)
  const totalTime = focusTimeMs + breakTimeMs;
  const ratio = totalTime > 0 ? focusTimeMs / totalTime : 0;

  return {
    focusTimeMs,
    breakTimeMs,
    ratio,
  };
}

/**
 * Calculate productivity score based on completion rate, time accuracy, and streak
 */
function calculateProductivityScore(
  dailyProgress: DailyProgress,
  timeAccuracy: number, // 0-100 from TimeAnalytics
  streakDays: number
): ProductivityScore {
  // Weights
  const completionWeight = 0.5;
  const accuracyWeight = 0.3;
  const streakWeight = 0.2;

  // Completion rate (0-100)
  const completionRate = dailyProgress.percentage;
  const completionContribution = (completionRate / 100) * completionWeight * 100;

  // Time accuracy (0-100)
  const accuracyContribution = (timeAccuracy / 100) * accuracyWeight * 100;

  // Streak bonus: +1 point per day, max 20 points contribution
  const streakBonus = Math.min(streakDays, 20) / 20;
  const streakContribution = streakBonus * streakWeight * 100;

  // Total score
  const score = Math.round(
    Math.min(100, Math.max(0, completionContribution + accuracyContribution + streakContribution))
  );

  return {
    score,
    factors: {
      completionRate: Math.round(completionContribution),
      timeAccuracy: Math.round(accuracyContribution),
      consistencyBonus: Math.round(streakContribution),
    },
  };
}

/**
 * Check for new milestones
 */
function checkMilestones(
  dailyProgress: DailyProgress,
  streak: StreakData,
  prevProgress: DailyProgress | null
): Milestone[] {
  const newMilestones: Milestone[] = [];
  const now = new Date().toISOString();
  
  // Load seen milestones
  let seenMilestones: MilestoneType[] = [];
  let lastStreakChecked = 0;
  
  try {
    const stored = localStorage.getItem(MILESTONES_STORAGE_KEY);
    if (stored) {
      const data: PersistedMilestones = JSON.parse(stored);
      seenMilestones = data.seenMilestones || [];
      lastStreakChecked = data.lastStreakChecked || 0;
    }
  } catch {
    // Ignore errors
  }

  const addMilestone = (type: MilestoneType, title: string, emoji: string, message: string) => {
    if (!seenMilestones.includes(type)) {
      newMilestones.push({ type, title, emoji, message, achievedAt: now });
      seenMilestones.push(type);
    }
  };

  // Check: First task completed today
  if (dailyProgress.completed >= 1 && (prevProgress === null || prevProgress.completed === 0)) {
    // Don't spam this - only show once per session
    if (!seenMilestones.includes('first_task')) {
      addMilestone('first_task', 'First Task!', '🎯', 'Great start to the day!');
    }
  }

  // Check: All tasks completed
  if (dailyProgress.total > 0 && dailyProgress.completed === dailyProgress.total) {
    if (!seenMilestones.includes('all_complete')) {
      addMilestone('all_complete', 'All Done!', '✅', 'You completed everything for today!');
    }
  }

  // Check: Streak milestones (only trigger when streak increases)
  if (streak.currentStreak > lastStreakChecked) {
    const streakMilestones: { days: number; type: MilestoneType; title: string; emoji: string; message: string }[] = [
      { days: 7, type: 'streak_7', title: 'One Week!', emoji: '🔥', message: 'One week strong!' },
      { days: 14, type: 'streak_14', title: 'Two Weeks!', emoji: '🔥', message: 'Two weeks of consistency!' },
      { days: 30, type: 'streak_30', title: 'Monthly Master!', emoji: '🏆', message: '30 days of dedication!' },
      { days: 60, type: 'streak_60', title: 'Two Months!', emoji: '⭐', message: '60 days of excellence!' },
      { days: 90, type: 'streak_90', title: 'Quarter Champion!', emoji: '🌟', message: '90 days - unstoppable!' },
      { days: 100, type: 'streak_100', title: 'Century Club!', emoji: '💯', message: '100 days! Legendary!' },
      { days: 365, type: 'streak_365', title: 'Year of Wins!', emoji: '👑', message: 'A full year! Incredible!' },
    ];

    for (const milestone of streakMilestones) {
      if (streak.currentStreak >= milestone.days && lastStreakChecked < milestone.days) {
        addMilestone(milestone.type, milestone.title, milestone.emoji, milestone.message);
      }
    }
  }

  // Persist updated milestones
  try {
    const persistData: PersistedMilestones = {
      seenMilestones,
      lastStreakChecked: streak.currentStreak,
      weeklyCompletions: [], // TODO: Implement perfect week tracking
    };
    localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(persistData));
  } catch {
    // Ignore errors
  }

  return newMilestones;
}

/**
 * Clear seen milestones (for daily reset)
 */
function clearDailyMilestones(): void {
  try {
    const stored = localStorage.getItem(MILESTONES_STORAGE_KEY);
    if (stored) {
      const data: PersistedMilestones = JSON.parse(stored);
      // Keep streak milestones, clear daily ones
      data.seenMilestones = data.seenMilestones.filter(
        (m) => m.startsWith('streak_') || m === 'perfect_week'
      );
      localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // Ignore errors
  }
}

interface UseQuickStatsReturn extends QuickStats {
  /** Force recalculation */
  refresh: () => void;
  /** Clear daily milestones (call on new day) */
  clearDailyMilestones: () => void;
}

/**
 * Hook for calculating quick stats with real-time updates
 */
export function useQuickStats(): UseQuickStatsReturn {
  const { tasks } = useTaskStore();
  const { dailyStats } = useTimeAnalytics();
  
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [prevProgress, setPrevProgress] = useState<DailyProgress | null>(null);

  // Force refresh function
  const refresh = useCallback(() => {
    setUpdateTrigger((prev) => prev + 1);
  }, []);

  // Check for day change and clear daily milestones
  useEffect(() => {
    const checkDayChange = () => {
      try {
        const stored = localStorage.getItem(MILESTONES_STORAGE_KEY);
        if (stored) {
          const data: PersistedMilestones = JSON.parse(stored);
          // If we have data from a previous day, clear daily milestones
          // This is a simple check - could be more robust
          if (data.seenMilestones.includes('first_task') || data.seenMilestones.includes('all_complete')) {
            // Clear on component mount (assume new session = new day check)
            clearDailyMilestones();
          }
        }
      } catch {
        // Ignore errors
      }
    };
    
    checkDayChange();
  }, []);

  // Memoized daily progress
  const dailyProgress = useMemo(() => {
    return calculateDailyProgress(tasks);
  }, [tasks, updateTrigger]);

  // Memoized streak data
  const streak = useMemo(() => {
    return calculateStreak(tasks);
  }, [tasks, updateTrigger]);

  // Memoized focus breakdown
  const focusBreakdown = useMemo(() => {
    return calculateFocusBreakdown(tasks);
  }, [tasks, updateTrigger]);

  // Memoized productivity score
  const productivityScore = useMemo(() => {
    return calculateProductivityScore(dailyProgress, dailyStats.accuracy, streak.currentStreak);
  }, [dailyProgress, dailyStats.accuracy, streak.currentStreak, updateTrigger]);

  // Check for new milestones
  const newMilestones = useMemo(() => {
    const milestones = checkMilestones(dailyProgress, streak, prevProgress);
    return milestones;
  }, [dailyProgress, streak, prevProgress, updateTrigger]);

  // Update previous progress for milestone detection
  useEffect(() => {
    setPrevProgress(dailyProgress);
  }, [dailyProgress.completed, dailyProgress.total]);

  return {
    dailyProgress,
    streak,
    focusBreakdown,
    productivityScore,
    newMilestones,
    refresh,
    clearDailyMilestones,
  };
}

/**
 * Get motivational message based on productivity score
 */
export function getMotivationalMessage(score: number): { message: string; emoji: string } {
  if (score >= 90) {
    return { message: 'Outstanding!', emoji: '🌟' };
  }
  if (score >= 70) {
    return { message: 'Great work!', emoji: '💪' };
  }
  if (score >= 50) {
    return { message: 'Keep going!', emoji: '📈' };
  }
  return { message: "You've got this!", emoji: '🚀' };
}

/**
 * Get progress color based on percentage
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 75) {
    return 'text-emerald-500 dark:text-emerald-400';
  }
  if (percentage >= 50) {
    return 'text-amber-500 dark:text-amber-400';
  }
  return 'text-red-500 dark:text-red-400';
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 70) {
    return 'text-emerald-500 dark:text-emerald-400';
  }
  if (score >= 40) {
    return 'text-amber-500 dark:text-amber-400';
  }
  return 'text-red-500 dark:text-red-400';
}

