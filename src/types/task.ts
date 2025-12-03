import { ProjectName } from "@/store/projectStore"

export type TaskStatus = 'pending' | 'completed' | 'archived';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TimeTrackingStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';

/** A single time tracking session entry */
export interface TimeTrackingEntry {
  startedAt: string;  // ISO timestamp
  endedAt?: string;   // ISO timestamp
  durationMs: number; // Duration of this session in milliseconds
}

/** Time tracking state for a task */
export interface TimeTrackingState {
  status: TimeTrackingStatus;
  startedAt?: string;       // ISO timestamp when current session started
  pausedAt?: string;        // ISO timestamp when paused (if paused)
  accumulatedMs: number;    // Total milliseconds accumulated from previous sessions
  history: TimeTrackingEntry[];
}

export interface TaskType {
  id: string;
  title: string;
  description?: string;
  date: Date;
  timeBlock?: number;
  time?: string;
  project?: ProjectName;
  persistent?: boolean;
  /** @deprecated Use status instead */
  completed?: boolean;
  scheduledTime?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  /** Estimated duration in minutes */
  estimatedDuration?: number;
  /** Actual duration in minutes (calculated from time tracking) */
  actualDuration?: number;
  /** Time tracking state */
  timeTracking?: TimeTrackingState;
}

// Filter types for task search
export type DateRangeFilter = 'all' | 'today' | 'this-week' | 'this-month' | 'custom';

export interface TaskFilters {
  search: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  dateRange: DateRangeFilter;
  customDateStart?: Date;
  customDateEnd?: Date;
} 