/**
 * Recurrence Utility Library (AC10)
 * Wrapper around RRule library for recurring task logic
 */

import { RRule, Weekday as RRuleWeekday } from 'rrule';
import {
  RecurrenceConfig,
  RecurrenceRule,
  Weekday,
  WEEKDAY_REVERSE_MAP,
} from '@/types/recurrence';

/** Default months to generate instances in advance */
const DEFAULT_MONTHS_AHEAD = 3;

/**
 * Convert our Weekday type to RRule Weekday
 */
function toRRuleWeekday(weekday: Weekday): RRuleWeekday {
  const dayMap: Record<Weekday, RRuleWeekday> = {
    'MO': RRule.MO,
    'TU': RRule.TU,
    'WE': RRule.WE,
    'TH': RRule.TH,
    'FR': RRule.FR,
    'SA': RRule.SA,
    'SU': RRule.SU,
  };
  return dayMap[weekday];
}

/**
 * Convert RRule frequency number to our frequency type
 */
function fromRRuleFrequency(freq: number): RecurrenceConfig['frequency'] {
  switch (freq) {
    case RRule.DAILY: return 'daily';
    case RRule.WEEKLY: return 'weekly';
    case RRule.MONTHLY: return 'monthly';
    case RRule.YEARLY: return 'yearly';
    default: return 'custom';
  }
}

/**
 * Create an RRule from our RecurrenceConfig
 */
export function createRRule(
  config: RecurrenceConfig,
  startDate: Date = new Date()
): RRule {
  // Map frequency to RRule constant
  const freqMap: Record<string, number> = {
    'daily': RRule.DAILY,
    'weekly': RRule.WEEKLY,
    'monthly': RRule.MONTHLY,
    'yearly': RRule.YEARLY,
    'custom': RRule.WEEKLY, // Custom defaults to weekly
  };

  const options: Partial<ConstructorParameters<typeof RRule>[0]> = {
    freq: freqMap[config.frequency] ?? RRule.DAILY,
    interval: config.interval || 1,
    dtstart: startDate,
  };

  // Add weekday constraints for weekly recurrence
  if (config.byWeekday && config.byWeekday.length > 0) {
    options.byweekday = config.byWeekday.map(toRRuleWeekday);
  }

  // Add month day for monthly recurrence
  if (config.byMonthDay && config.frequency === 'monthly') {
    options.bymonthday = [config.byMonthDay];
  }

  // Handle end conditions
  if (config.endType === 'count' && config.count) {
    options.count = config.count;
  } else if (config.endType === 'until' && config.until) {
    options.until = new Date(config.until);
  }

  return new RRule(options);
}

/**
 * Parse an RRule string back to our RecurrenceConfig
 */
export function parseRRuleString(rruleString: string): RecurrenceConfig | null {
  try {
    const rule = RRule.fromString(rruleString);
    const options = rule.origOptions;

    const config: RecurrenceConfig = {
      frequency: fromRRuleFrequency(options.freq ?? RRule.DAILY),
      interval: options.interval ?? 1,
      endType: 'never',
    };

    // Parse weekdays
    if (options.byweekday) {
      const weekdays = Array.isArray(options.byweekday) 
        ? options.byweekday 
        : [options.byweekday];
      config.byWeekday = weekdays.map((wd) => {
        if (typeof wd === 'number') {
          return WEEKDAY_REVERSE_MAP[wd];
        }
        // RRuleWeekday object has weekday property
        return WEEKDAY_REVERSE_MAP[(wd as { weekday: number }).weekday];
      }).filter(Boolean) as Weekday[];
    }

    // Parse month day
    if (options.bymonthday) {
      const days = Array.isArray(options.bymonthday) 
        ? options.bymonthday 
        : [options.bymonthday];
      config.byMonthDay = days[0];
    }

    // Parse end condition
    if (options.count) {
      config.endType = 'count';
      config.count = options.count;
    } else if (options.until) {
      config.endType = 'until';
      config.until = options.until.toISOString();
    }

    return config;
  } catch (error) {
    console.error('Failed to parse RRule string:', error);
    return null;
  }
}

/**
 * Get the next N occurrences from a rule
 */
export function getNextOccurrences(
  rruleString: string,
  count: number = 5,
  afterDate: Date = new Date()
): Date[] {
  try {
    const rule = RRule.fromString(rruleString);
    return rule.after(afterDate, true) 
      ? rule.between(afterDate, getDateMonthsAhead(DEFAULT_MONTHS_AHEAD), true).slice(0, count)
      : [];
  } catch (error) {
    console.error('Failed to get occurrences:', error);
    return [];
  }
}

/**
 * Get all occurrences within a date range
 */
export function getOccurrencesInRange(
  rruleString: string,
  startDate: Date,
  endDate: Date,
  exdates: string[] = []
): Date[] {
  try {
    const rule = RRule.fromString(rruleString);
    const occurrences = rule.between(startDate, endDate, true);
    
    // Filter out exception dates
    if (exdates.length > 0) {
      const exdateSet = new Set(exdates.map(d => d.split('T')[0]));
      return occurrences.filter(date => {
        const dateStr = date.toISOString().split('T')[0];
        return !exdateSet.has(dateStr);
      });
    }
    
    return occurrences;
  } catch (error) {
    console.error('Failed to get occurrences in range:', error);
    return [];
  }
}

/**
 * Generate recurring task instances from a master task
 */
export function generateRecurringInstances<T extends { 
  id: string; 
  date: string;
  recurrence?: RecurrenceRule;
}>(
  masterTask: T,
  endDate: Date = getDateMonthsAhead(DEFAULT_MONTHS_AHEAD)
): Array<T & { recurrence: RecurrenceRule }> {
  if (!masterTask.recurrence?.rruleString) {
    return [];
  }

  const startDate = new Date(masterTask.date);
  const occurrences = getOccurrencesInRange(
    masterTask.recurrence.rruleString,
    startDate,
    endDate,
    masterTask.recurrence.exdates
  );

  return occurrences.map((date) => {
    const instanceDate = date.toISOString().split('T')[0];
    const instanceId = `${masterTask.id}-${instanceDate}`;
    
    return {
      ...masterTask,
      id: instanceId,
      date: instanceDate,
      recurrence: {
        rruleString: masterTask.recurrence!.rruleString,
        parentSeriesId: masterTask.id,
        isInstance: true,
        instanceDate,
        exdates: masterTask.recurrence!.exdates,
      },
    };
  });
}

/**
 * Create an RRule string from config
 */
export function configToRRuleString(
  config: RecurrenceConfig,
  startDate: Date = new Date()
): string {
  const rule = createRRule(config, startDate);
  return rule.toString();
}

/**
 * Get a human-readable description of a recurrence pattern
 */
export function describeRecurrence(rruleString: string): string {
  try {
    const rule = RRule.fromString(rruleString);
    return rule.toText();
  } catch (error) {
    return 'Custom recurrence';
  }
}

/**
 * Check if a recurrence rule is valid
 */
export function isValidRecurrence(config: RecurrenceConfig): boolean {
  if (config.interval < 1) return false;
  if (config.frequency === 'weekly' && (!config.byWeekday || config.byWeekday.length === 0)) {
    return false;
  }
  if (config.endType === 'count' && (!config.count || config.count < 1)) {
    return false;
  }
  if (config.endType === 'until' && !config.until) {
    return false;
  }
  return true;
}

/**
 * Add an exception date to a recurrence rule
 */
export function addExceptionDate(
  recurrence: RecurrenceRule,
  exceptionDate: string
): RecurrenceRule {
  const exdates = recurrence.exdates || [];
  const dateStr = exceptionDate.split('T')[0];
  
  if (!exdates.includes(dateStr)) {
    return {
      ...recurrence,
      exdates: [...exdates, dateStr],
    };
  }
  return recurrence;
}

/**
 * Get a date N months ahead
 */
function getDateMonthsAhead(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
}

/**
 * Check if a task is a recurring master (not an instance)
 */
export function isRecurringMaster(recurrence?: RecurrenceRule): boolean {
  return !!recurrence?.rruleString && !recurrence.isInstance;
}

/**
 * Check if a task is a recurring instance
 */
export function isRecurringInstance(recurrence?: RecurrenceRule): boolean {
  return !!recurrence?.isInstance;
}

/**
 * Check if a task has any recurrence (master or instance)
 */
export function isRecurring(recurrence?: RecurrenceRule): boolean {
  return !!recurrence?.rruleString || !!recurrence?.isInstance;
}

