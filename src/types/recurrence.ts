/**
 * Recurrence Types for Story 2.4
 * Defines data structures for recurring tasks and templates
 */

/** Recurrence frequency options */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

/** Days of the week for weekly recurrence */
export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

/** End condition for recurrence */
export type RecurrenceEndType = 'never' | 'count' | 'until';

/** Recurrence rule configuration (used for UI) */
export interface RecurrenceConfig {
  /** Frequency preset or 'custom' */
  frequency: RecurrenceFrequency;
  /** Interval (every N days/weeks/etc.) */
  interval: number;
  /** Days of week for weekly recurrence */
  byWeekday?: Weekday[];
  /** Day of month for monthly recurrence (1-31) */
  byMonthDay?: number;
  /** End condition type */
  endType: RecurrenceEndType;
  /** Number of occurrences (if endType is 'count') */
  count?: number;
  /** End date (if endType is 'until') */
  until?: string;
}

/** Recurrence rule stored on task */
export interface RecurrenceRule {
  /** RRule serialized string (RFC 5545 format) */
  rruleString: string;
  /** ID of the parent/master task in the series */
  parentSeriesId?: string;
  /** True if this is a generated instance, false if it's the master */
  isInstance: boolean;
  /** The specific date this instance represents (YYYY-MM-DD) */
  instanceDate?: string;
  /** Exception dates that were deleted from the series */
  exdates?: string[];
}

/** Task template for quick task creation */
export interface TaskTemplate {
  /** Unique identifier */
  id: string;
  /** Template name for display */
  name: string;
  /** Optional description */
  description?: string;
  /** Default values for task creation */
  taskDefaults: {
    title?: string;
    description?: string;
    project?: string;
    estimatedDuration?: number;
    persistent?: boolean;
    scheduledTime?: string;
    recurrence?: RecurrenceConfig;
  };
  /** True if this is a built-in template from schedule.json */
  isBuiltIn: boolean;
  /** ISO timestamp when created */
  createdAt: string;
  /** Category for organization */
  category?: string;
}

/** Template export format for sharing */
export interface TemplateExport {
  version: string;
  exportedAt: string;
  templates: TaskTemplate[];
}

/** Recurrence preset option for UI */
export interface RecurrencePreset {
  label: string;
  value: RecurrenceFrequency;
  config: Partial<RecurrenceConfig>;
  description?: string;
}

/** Default recurrence presets */
export const RECURRENCE_PRESETS: RecurrencePreset[] = [
  {
    label: 'None',
    value: 'daily',
    config: { frequency: 'daily', interval: 0 },
    description: 'One-time task',
  },
  {
    label: 'Daily',
    value: 'daily',
    config: { frequency: 'daily', interval: 1, endType: 'never' },
    description: 'Every day',
  },
  {
    label: 'Weekdays',
    value: 'weekly',
    config: { 
      frequency: 'weekly', 
      interval: 1, 
      byWeekday: ['MO', 'TU', 'WE', 'TH', 'FR'],
      endType: 'never' 
    },
    description: 'Monday to Friday',
  },
  {
    label: 'Weekly',
    value: 'weekly',
    config: { frequency: 'weekly', interval: 1, endType: 'never' },
    description: 'Same day each week',
  },
  {
    label: 'Bi-weekly',
    value: 'weekly',
    config: { frequency: 'weekly', interval: 2, endType: 'never' },
    description: 'Every two weeks',
  },
  {
    label: 'Monthly',
    value: 'monthly',
    config: { frequency: 'monthly', interval: 1, endType: 'never' },
    description: 'Same day each month',
  },
  {
    label: 'Custom',
    value: 'custom',
    config: { frequency: 'custom', interval: 1, endType: 'never' },
    description: 'Build your own pattern',
  },
];

/** Map RRule weekday constants to our Weekday type */
export const WEEKDAY_MAP: Record<Weekday, number> = {
  'MO': 0,
  'TU': 1,
  'WE': 2,
  'TH': 3,
  'FR': 4,
  'SA': 5,
  'SU': 6,
};

/** Reverse map from number to Weekday */
export const WEEKDAY_REVERSE_MAP: Record<number, Weekday> = {
  0: 'MO',
  1: 'TU',
  2: 'WE',
  3: 'TH',
  4: 'FR',
  5: 'SA',
  6: 'SU',
};

/** Weekday display names */
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  'MO': 'Mon',
  'TU': 'Tue',
  'WE': 'Wed',
  'TH': 'Thu',
  'FR': 'Fri',
  'SA': 'Sat',
  'SU': 'Sun',
};

