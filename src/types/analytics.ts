/** Daily time tracking statistics */
export interface DailyTimeStats {
  /** Total time tracked today in milliseconds */
  totalTrackedMs: number;
  /** Total estimated time for today's tasks in milliseconds */
  estimatedMs: number;
  /** Variance = actual - estimated (positive = over, negative = under) */
  variance: number;
  /** Accuracy percentage (100 = perfect, lower = worse estimation) */
  accuracy: number;
  /** Number of tasks with time tracking today */
  taskCount: number;
}

/** Time breakdown for a single project */
export interface ProjectTimeBreakdown {
  /** Project name or "No Project" for unassigned */
  projectName: string;
  /** Project color class (e.g., "bg-purple-100 text-purple-800") */
  projectColor: string;
  /** Total time tracked for this project in milliseconds */
  trackedMs: number;
  /** Percentage of total time */
  percentage: number;
}

/** Single entry in weekly history */
export interface WeeklyTimeEntry {
  /** Date string (ISO format) */
  date: string;
  /** Day label (Mon, Tue, etc.) */
  dayLabel: string;
  /** Total time tracked that day in milliseconds */
  trackedMs: number;
  /** Total estimated time for that day in milliseconds */
  estimatedMs: number;
}

/** Time tracking history entry for detailed view */
export interface TimeHistoryEntry {
  /** Task ID */
  taskId: string;
  /** Task title */
  taskTitle: string;
  /** Project name (if any) */
  projectName?: string;
  /** Project color */
  projectColor?: string;
  /** Date of the tracking session */
  date: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Session start time */
  startedAt: string;
  /** Session end time */
  endedAt?: string;
}

/** Aggregated analytics data structure */
export interface TimeAnalytics {
  /** Today's statistics */
  dailyStats: DailyTimeStats;
  /** Breakdown by project */
  projectBreakdown: ProjectTimeBreakdown[];
  /** Weekly history (last 7 days) */
  weeklyHistory: WeeklyTimeEntry[];
  /** Detailed time history for all tracked tasks */
  timeHistory: TimeHistoryEntry[];
}

/** Date filter options for history view */
export type DateRangeOption = 'today' | 'week' | 'month' | 'all';

