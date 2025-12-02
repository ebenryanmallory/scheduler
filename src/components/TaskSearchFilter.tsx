import { Search, X, Filter } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { TaskFilters, TaskStatus, TaskPriority, DateRangeFilter } from '@/types/task';
import { cn } from '@/lib/utils';

interface TaskSearchFilterProps {
  filters: TaskFilters;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: TaskStatus | 'all') => void;
  onPriorityChange: (priority: TaskPriority | 'all') => void;
  onDateRangeChange: (dateRange: DateRangeFilter) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  searchInputRef: React.RefObject<HTMLInputElement>;
  resultCount?: number;
  totalCount?: number;
}

const STATUS_OPTIONS: Array<{ value: TaskStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

const PRIORITY_OPTIONS: Array<{ value: TaskPriority | 'all'; label: string }> = [
  { value: 'all', label: 'All Priority' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const DATE_RANGE_OPTIONS: Array<{ value: DateRangeFilter; label: string }> = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
];

export function TaskSearchFilter({
  filters,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onDateRangeChange,
  onClearFilters,
  hasActiveFilters,
  searchInputRef,
  resultCount,
  totalCount,
}: TaskSearchFilterProps) {
  const activeFilterCount = [
    filters.status !== 'all',
    filters.priority !== 'all',
    filters.dateRange !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search tasks... (⌘K)"
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-sm">Filters:</span>
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => onStatusChange(value as TaskStatus | 'all')}
        >
          <SelectTrigger className={cn(
            "w-[130px] h-8 text-sm",
            filters.status !== 'all' && "border-primary"
          )}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={filters.priority}
          onValueChange={(value) => onPriorityChange(value as TaskPriority | 'all')}
        >
          <SelectTrigger className={cn(
            "w-[130px] h-8 text-sm",
            filters.priority !== 'all' && "border-primary"
          )}>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.value !== 'all' && (
                    <span className={cn(
                      "h-2 w-2 rounded-full",
                      option.value === 'high' && "bg-red-500",
                      option.value === 'medium' && "bg-yellow-500",
                      option.value === 'low' && "bg-green-500"
                    )} />
                  )}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Select
          value={filters.dateRange}
          onValueChange={(value) => onDateRangeChange(value as DateRangeFilter)}
        >
          <SelectTrigger className={cn(
            "w-[130px] h-8 text-sm",
            filters.dateRange !== 'all' && "border-primary"
          )}>
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}

        {/* Active Filter Count Badge */}
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="h-6">
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </Badge>
        )}
      </div>

      {/* Results Count */}
      {(filters.search || hasActiveFilters) && resultCount !== undefined && totalCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          Showing {resultCount} of {totalCount} task{totalCount !== 1 ? 's' : ''}
          {filters.search && (
            <span> matching "<span className="font-medium">{filters.search}</span>"</span>
          )}
        </div>
      )}
    </div>
  );
}

