import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Fuse, { IFuseOptions } from 'fuse.js';
import { TaskType, TaskFilters, TaskStatus, TaskPriority, DateRangeFilter } from '@/types/task';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  dateRange: 'all',
};

// Fuse.js options for fuzzy search
const FUSE_OPTIONS: IFuseOptions<TaskType> = {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'description', weight: 0.3 },
    { name: 'tags', weight: 0.2 },
  ],
  threshold: 0.4, // Lower = more strict, higher = more fuzzy
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

const DEBOUNCE_DELAY = 200; // ms

// Helper to get task status from completed boolean for backwards compatibility
function getTaskStatus(task: TaskType): TaskStatus {
  if (task.status) return task.status;
  return task.completed ? 'completed' : 'pending';
}

// Helper to get task priority with default
function getTaskPriority(task: TaskType): TaskPriority {
  return task.priority || 'medium';
}

interface UseTaskSearchOptions {
  tasks: TaskType[];
  initialFilters?: Partial<TaskFilters>;
}

interface UseTaskSearchResult {
  filteredTasks: TaskType[];
  filters: TaskFilters;
  setSearch: (search: string) => void;
  setStatus: (status: TaskStatus | 'all') => void;
  setPriority: (priority: TaskPriority | 'all') => void;
  setDateRange: (dateRange: DateRangeFilter) => void;
  setCustomDateRange: (start: Date | undefined, end: Date | undefined) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export function useTaskSearch({ tasks, initialFilters }: UseTaskSearchOptions): UseTaskSearchResult {
  const [filters, setFilters] = useState<TaskFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Create Fuse instance when tasks change
  const fuse = useMemo(() => new Fuse(tasks, FUSE_OPTIONS), [tasks]);

  // Filter tasks based on all criteria
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Apply fuzzy search if search term exists
    if (debouncedSearch.trim()) {
      const searchResults = fuse.search(debouncedSearch.trim());
      result = searchResults.map(r => r.item);
    }

    // Filter by status (archived tasks hidden by default)
    if (filters.status !== 'all') {
      result = result.filter(task => getTaskStatus(task) === filters.status);
    } else {
      // When "all" is selected, still hide archived unless explicitly included
      result = result.filter(task => getTaskStatus(task) !== 'archived');
    }

    // Filter by priority
    if (filters.priority !== 'all') {
      result = result.filter(task => getTaskPriority(task) === filters.priority);
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let dateInterval: { start: Date; end: Date } | null = null;

      switch (filters.dateRange) {
        case 'today':
          dateInterval = { start: startOfDay(now), end: endOfDay(now) };
          break;
        case 'this-week':
          dateInterval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
          break;
        case 'this-month':
          dateInterval = { start: startOfMonth(now), end: endOfMonth(now) };
          break;
        case 'custom':
          if (filters.customDateStart && filters.customDateEnd) {
            dateInterval = {
              start: startOfDay(filters.customDateStart),
              end: endOfDay(filters.customDateEnd),
            };
          }
          break;
      }

      if (dateInterval) {
        result = result.filter(task => {
          const taskDate = new Date(task.date);
          return isWithinInterval(taskDate, dateInterval!);
        });
      }
    }

    return result;
  }, [tasks, debouncedSearch, filters.status, filters.priority, filters.dateRange, filters.customDateStart, filters.customDateEnd, fuse]);

  // Setters
  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const setStatus = useCallback((status: TaskStatus | 'all') => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  const setPriority = useCallback((priority: TaskPriority | 'all') => {
    setFilters(prev => ({ ...prev, priority }));
  }, []);

  const setDateRange = useCallback((dateRange: DateRangeFilter) => {
    setFilters(prev => ({ ...prev, dateRange }));
  }, []);

  const setCustomDateRange = useCallback((start: Date | undefined, end: Date | undefined) => {
    setFilters(prev => ({
      ...prev,
      dateRange: 'custom',
      customDateStart: start,
      customDateEnd: end,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.status !== 'all' ||
      filters.priority !== 'all' ||
      filters.dateRange !== 'all'
    );
  }, [filters]);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    filteredTasks,
    filters,
    setSearch,
    setStatus,
    setPriority,
    setDateRange,
    setCustomDateRange,
    clearFilters,
    hasActiveFilters,
    searchInputRef,
  };
}

