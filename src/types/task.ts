import { ProjectName } from "@/store/projectStore"
import { RecurrenceRule } from "./recurrence"

export type TaskStatus = 'pending' | 'completed' | 'archived';
export type TaskPriority = 'high' | 'medium' | 'low';

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
  /** Recurrence rule for recurring tasks */
  recurrence?: RecurrenceRule;
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