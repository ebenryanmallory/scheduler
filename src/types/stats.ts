/** Daily task completion progress */
export interface DailyProgress {
  /** Number of completed tasks today */
  completed: number;
  /** Total number of tasks today */
  total: number;
  /** Completion percentage (0-100) */
  percentage: number;
}

/** Streak tracking data */
export interface StreakData {
  /** Current consecutive days with completed tasks */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** Last date with completed tasks (YYYY-MM-DD) */
  lastActiveDate: string;
}

/** Focus vs break time breakdown */
export interface FocusBreakdown {
  /** Total focus/tracked time in milliseconds */
  focusTimeMs: number;
  /** Estimated untracked time in milliseconds */
  breakTimeMs: number;
  /** Focus ratio (0-1): focus / (focus + break) */
  ratio: number;
}

/** Productivity score with breakdown */
export interface ProductivityScore {
  /** Overall score (0-100) */
  score: number;
  /** Score breakdown factors */
  factors: {
    /** Completion rate contribution (0-50) */
    completionRate: number;
    /** Time accuracy contribution (0-30) */
    timeAccuracy: number;
    /** Streak bonus contribution (0-20) */
    consistencyBonus: number;
  };
}

/** Milestone types for celebrations */
export type MilestoneType = 
  | 'first_task'
  | 'all_complete'
  | 'streak_7'
  | 'streak_14'
  | 'streak_30'
  | 'streak_60'
  | 'streak_90'
  | 'streak_100'
  | 'streak_365'
  | 'perfect_week';

/** Milestone celebration data */
export interface Milestone {
  /** Milestone type identifier */
  type: MilestoneType;
  /** Display title */
  title: string;
  /** Emoji icon */
  emoji: string;
  /** Celebratory message */
  message: string;
  /** When the milestone was achieved */
  achievedAt: string;
}

/** Aggregated quick stats */
export interface QuickStats {
  dailyProgress: DailyProgress;
  streak: StreakData;
  focusBreakdown: FocusBreakdown;
  productivityScore: ProductivityScore;
  /** Recently triggered milestones */
  newMilestones: Milestone[];
}

/** Persisted streak data in localStorage */
export interface PersistedStreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  /** Last calculated date to detect day changes */
  lastCalculatedDate: string;
}

/** Persisted milestones in localStorage */
export interface PersistedMilestones {
  /** Set of seen milestone types to avoid re-triggering */
  seenMilestones: MilestoneType[];
  /** Last streak value when milestones were checked */
  lastStreakChecked: number;
  /** Last completion rate for perfect week tracking */
  weeklyCompletions: { date: string; rate: number }[];
}

