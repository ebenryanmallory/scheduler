import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Calendar, Clock, Folder } from 'lucide-react';
import { useTimeAnalytics, formatDuration } from '@/hooks/useTimeAnalytics';
import { DateRangeOption, TimeHistoryEntry } from '@/types/analytics';

interface TimeHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Format timestamp to readable time (e.g., "2:30 PM")
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date to readable format (e.g., "Dec 3, 2025")
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Group history entries by date
 */
function groupByDate(entries: TimeHistoryEntry[]): Map<string, TimeHistoryEntry[]> {
  const grouped = new Map<string, TimeHistoryEntry[]>();
  
  for (const entry of entries) {
    const existing = grouped.get(entry.date) || [];
    existing.push(entry);
    grouped.set(entry.date, existing);
  }
  
  return grouped;
}

/**
 * Export time history to CSV
 */
function exportToCSV(entries: TimeHistoryEntry[]): void {
  const headers = ['Date', 'Task', 'Project', 'Duration (minutes)', 'Start Time', 'End Time'];
  
  const rows = entries.map((entry) => [
    entry.date,
    `"${entry.taskTitle.replace(/"/g, '""')}"`, // Escape quotes
    entry.projectName || '',
    Math.round(entry.durationMs / 60000).toString(),
    entry.startedAt ? formatTime(entry.startedAt) : '',
    entry.endedAt ? formatTime(entry.endedAt) : '',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `time-tracking-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function TimeHistoryModal({ open, onOpenChange }: TimeHistoryModalProps) {
  const [dateRange, setDateRange] = useState<DateRangeOption>('week');
  
  const { timeHistory } = useTimeAnalytics({ historyDateRange: dateRange });
  
  // Group entries by date for display
  const groupedHistory = useMemo(() => groupByDate(timeHistory), [timeHistory]);
  
  // Calculate total time
  const totalMs = useMemo(
    () => timeHistory.reduce((sum, entry) => sum + entry.durationMs, 0),
    [timeHistory]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Time Tracking History
          </DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 py-2 border-b border-border">
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeOption)}>
              <SelectTrigger className="w-36">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            <span className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{formatDuration(totalMs)}</span>
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(timeHistory)}
            disabled={timeHistory.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-4">
          {timeHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">No time tracking history found</p>
              <p className="text-xs mt-1">
                Start a timer on a task to begin tracking
              </p>
            </div>
          ) : (
            Array.from(groupedHistory.entries()).map(([date, entries]) => {
              const dayTotal = entries.reduce((sum, e) => sum + e.durationMs, 0);
              
              return (
                <div key={date} className="space-y-2">
                  {/* Date header */}
                  <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur py-1">
                    <h4 className="text-sm font-semibold text-foreground">
                      {formatDate(date)}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(dayTotal)}
                    </span>
                  </div>
                  
                  {/* Entries for this date */}
                  <div className="space-y-1.5 pl-2 border-l-2 border-indigo-200 dark:border-indigo-800">
                    {entries.map((entry, idx) => (
                      <div
                        key={`${entry.taskId}-${idx}`}
                        className="group flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        {/* Time indicator */}
                        <div className="flex flex-col items-center text-xs text-muted-foreground min-w-[60px]">
                          <span>{entry.startedAt ? formatTime(entry.startedAt) : '—'}</span>
                          {entry.endedAt && (
                            <>
                              <div className="w-px h-2 bg-slate-300 dark:bg-slate-700 my-0.5" />
                              <span>{formatTime(entry.endedAt)}</span>
                            </>
                          )}
                        </div>
                        
                        {/* Task info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {entry.taskTitle}
                          </p>
                          {entry.projectName && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Folder className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {entry.projectName}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Duration */}
                        <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {formatDuration(entry.durationMs)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TimeHistoryModal;

