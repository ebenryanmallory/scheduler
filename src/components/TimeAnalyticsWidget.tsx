import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { Button } from './ui/button';
import { useTimeAnalytics, formatDuration, formatTimeHHMM } from '@/hooks/useTimeAnalytics';
import { useTimerStore } from '@/store/timerStore';
import TimeHistoryModal from './modals/TimeHistoryModal';

const COLLAPSE_STORAGE_KEY = 'scheduler_analytics_collapsed';

/**
 * Get variance color based on how much actual exceeds estimated
 */
function getVarianceColor(variance: number, estimatedMs: number): string {
  if (variance <= 0) return 'text-emerald-600 dark:text-emerald-500';
  if (estimatedMs === 0) return 'text-muted-foreground';
  const overPercent = (variance / estimatedMs) * 100;
  if (overPercent <= 20) return 'text-amber-600 dark:text-amber-500';
  return 'text-red-600 dark:text-red-500';
}

/**
 * Get accuracy color based on percentage
 */
function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'text-emerald-600 dark:text-emerald-500';
  if (accuracy >= 60) return 'text-amber-600 dark:text-amber-500';
  return 'text-red-600 dark:text-red-500';
}

/**
 * Time Analytics Widget Component
 * Displays time tracking summaries and insights
 */
function TimeAnalyticsWidget() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
      // Default to collapsed (true) if no stored value exists
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { activeTaskId } = useTimerStore();
  
  const {
    dailyStats,
    projectBreakdown,
    weeklyHistory,
    refresh,
  } = useTimeAnalytics();

  // Persist collapse state
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(isCollapsed));
    } catch {
      // Ignore localStorage errors
    }
  }, [isCollapsed]);

  // Calculate max value for weekly chart scaling
  const maxWeeklyMs = Math.max(
    ...weeklyHistory.map((day) => Math.max(day.trackedMs, day.estimatedMs)),
    1
  );

  // Top 5 projects + overflow count
  const displayProjects = projectBreakdown.slice(0, 5);
  const overflowCount = Math.max(0, projectBreakdown.length - 5);

  return (
    <>
      <div className="w-full bg-card border rounded-lg overflow-hidden">
        {/* Header - touch-friendly */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsCollapsed(!isCollapsed)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsCollapsed(!isCollapsed);
            }
          }}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer min-h-[48px] sm:min-h-0"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Time Analytics</h3>
            {activeTaskId && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                refresh();
              }}
              title="Refresh analytics"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="p-4 pt-0 space-y-4">
            {/* Daily Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Today's Time */}
              <div className="rounded-lg p-3 bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">Today</div>
                <div className="text-xl font-semibold tabular-nums">
                  {formatTimeHHMM(dailyStats.totalTrackedMs)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {dailyStats.taskCount} task{dailyStats.taskCount !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Variance */}
              <div className="rounded-lg p-3 bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">Variance</div>
                <div
                  className={`text-xl font-semibold tabular-nums ${getVarianceColor(
                    dailyStats.variance,
                    dailyStats.estimatedMs
                  )}`}
                >
                  {dailyStats.variance >= 0 ? '+' : ''}
                  {formatDuration(dailyStats.variance)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Est: {formatDuration(dailyStats.estimatedMs)}
                </div>
              </div>

              {/* Accuracy */}
              <div className="rounded-lg p-3 bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">Accuracy</div>
                <div
                  className={`text-xl font-semibold tabular-nums ${getAccuracyColor(
                    dailyStats.accuracy
                  )}`}
                >
                  {dailyStats.accuracy}%
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dailyStats.accuracy >= 80 
                        ? 'bg-emerald-500' 
                        : dailyStats.accuracy >= 60 
                          ? 'bg-amber-500' 
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(dailyStats.accuracy, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Project Breakdown */}
            {displayProjects.length > 0 && (
              <div>
                <h4 className="text-sm text-muted-foreground mb-2">
                  By Project
                </h4>
                <div className="space-y-2">
                  {displayProjects.map((project) => (
                    <div key={project.projectName} className="flex items-center gap-2">
                      <span className="flex-1 text-sm truncate">
                        {project.projectName}
                      </span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {formatDuration(project.trackedMs)}
                      </span>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground/30 rounded-full"
                          style={{ width: `${project.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {overflowCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      +{overflowCount} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Weekly History Chart */}
            <div>
              <h4 className="text-sm text-muted-foreground mb-2">
                This Week
              </h4>
              <div className="flex items-end gap-1 h-16">
                {weeklyHistory.map((day, index) => {
                  const trackedHeight = (day.trackedMs / maxWeeklyMs) * 100;
                  const estimatedHeight = (day.estimatedMs / maxWeeklyMs) * 100;
                  const isToday = index === weeklyHistory.length - 1;

                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-1 group"
                    >
                      <div className="relative w-full h-12 flex items-end justify-center gap-0.5">
                        <div
                          className="w-2 bg-muted rounded-t"
                          style={{ height: `${Math.max(estimatedHeight, 2)}%` }}
                          title={`Estimated: ${formatDuration(day.estimatedMs)}`}
                        />
                        <div
                          className={`w-2 rounded-t ${
                            isToday ? 'bg-foreground/50' : 'bg-foreground/30'
                          }`}
                          style={{ height: `${Math.max(trackedHeight, day.trackedMs > 0 ? 2 : 0)}%` }}
                          title={`Tracked: ${formatDuration(day.trackedMs)}`}
                        />
                      </div>
                      <span
                        className={`text-xs ${
                          isToday ? 'font-medium text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {day.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded bg-foreground/40" />
                  <span>Tracked</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded bg-muted" />
                  <span>Estimated</span>
                </div>
              </div>
            </div>

            {/* View Details Link */}
            <Button
              variant="outline"
              onClick={() => setIsHistoryOpen(true)}
              className="w-full min-h-[44px] sm:min-h-0"
            >
              View History
            </Button>
          </div>
        )}

        {/* Collapsed summary */}
        {isCollapsed && (
          <div className="px-4 py-2 flex items-center gap-4 text-sm border-t">
            <span className="text-muted-foreground">Today:</span>
            <span className="font-medium tabular-nums">
              {formatTimeHHMM(dailyStats.totalTrackedMs)}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className={`font-medium tabular-nums ${getAccuracyColor(dailyStats.accuracy)}`}>
              {dailyStats.accuracy}% accuracy
            </span>
          </div>
        )}
      </div>

      <TimeHistoryModal open={isHistoryOpen} onOpenChange={setIsHistoryOpen} />
    </>
  );
}

export default TimeAnalyticsWidget;
