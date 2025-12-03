import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  TrendingUp,
  BarChart3,
  History,
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
  if (variance <= 0) {
    // On track or ahead
    return 'text-emerald-600 dark:text-emerald-400';
  }
  
  if (estimatedMs === 0) {
    return 'text-muted-foreground';
  }
  
  const overPercent = (variance / estimatedMs) * 100;
  
  if (overPercent <= 20) {
    // Slightly over
    return 'text-amber-600 dark:text-amber-400';
  }
  
  // Significantly over
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get accuracy color based on percentage
 */
function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) {
    return 'text-emerald-600 dark:text-emerald-400';
  }
  if (accuracy >= 60) {
    return 'text-amber-600 dark:text-amber-400';
  }
  return 'text-red-600 dark:text-red-400';
}

/**
 * Time Analytics Widget Component
 * Displays time tracking summaries and insights
 */
function TimeAnalyticsWidget() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
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
    1 // Prevent division by zero
  );

  // Top 5 projects + overflow count
  const displayProjects = projectBreakdown.slice(0, 5);
  const overflowCount = Math.max(0, projectBreakdown.length - 5);

  return (
    <>
      <div className="w-full bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/50 hover:from-indigo-100 hover:to-violet-100 dark:hover:from-indigo-950/70 dark:hover:to-violet-950/70 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-foreground">Time Analytics</h3>
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
        </button>

        {/* Content */}
        {!isCollapsed && (
          <div className="p-4 space-y-5">
            {/* Daily Stats Section */}
            <div className="grid grid-cols-3 gap-4">
              {/* Today's Time */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Today
                  </span>
                </div>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {formatTimeHHMM(dailyStats.totalTrackedMs)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {dailyStats.taskCount} task{dailyStats.taskCount !== 1 ? 's' : ''} tracked
                </div>
              </div>

              {/* Variance */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Variance
                  </span>
                </div>
                <div
                  className={`text-2xl font-bold tabular-nums ${getVarianceColor(
                    dailyStats.variance,
                    dailyStats.estimatedMs
                  )}`}
                >
                  {dailyStats.variance >= 0 ? '+' : ''}
                  {formatDuration(dailyStats.variance)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Est: {formatDuration(dailyStats.estimatedMs)}
                </div>
              </div>

              {/* Accuracy */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Accuracy
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`text-2xl font-bold tabular-nums ${getAccuracyColor(
                      dailyStats.accuracy
                    )}`}
                  >
                    {dailyStats.accuracy}%
                  </div>
                  {/* Mini progress ring */}
                  <div className="relative w-8 h-8">
                    <svg className="w-8 h-8 transform -rotate-90">
                      <circle
                        cx="16"
                        cy="16"
                        r="12"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-slate-200 dark:text-slate-700"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="12"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${(dailyStats.accuracy / 100) * 75.4} 75.4`}
                        strokeLinecap="round"
                        className={getAccuracyColor(dailyStats.accuracy)}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Breakdown */}
            {displayProjects.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Time by Project
                </h4>
                <div className="space-y-2">
                  {displayProjects.map((project) => (
                    <div key={project.projectName} className="flex items-center gap-3">
                      {/* Project color indicator */}
                      <div
                        className={`w-3 h-3 rounded-full ${
                          project.projectColor?.split(' ')[0] || 'bg-slate-400'
                        }`}
                      />
                      {/* Project name */}
                      <span className="flex-1 text-sm text-foreground truncate">
                        {project.projectName}
                      </span>
                      {/* Time */}
                      <span className="text-sm font-medium text-foreground tabular-nums">
                        {formatDuration(project.trackedMs)}
                      </span>
                      {/* Percentage bar */}
                      <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            project.projectColor?.split(' ')[0] || 'bg-indigo-500'
                          }`}
                          style={{ width: `${project.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {project.percentage}%
                      </span>
                    </div>
                  ))}
                  {overflowCount > 0 && (
                    <p className="text-xs text-muted-foreground pl-6">
                      +{overflowCount} more project{overflowCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Weekly History Chart */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Weekly Overview
              </h4>
              <div className="flex items-end gap-1 h-24">
                {weeklyHistory.map((day, index) => {
                  const trackedHeight = (day.trackedMs / maxWeeklyMs) * 100;
                  const estimatedHeight = (day.estimatedMs / maxWeeklyMs) * 100;
                  const isToday = index === weeklyHistory.length - 1;

                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-1 group"
                    >
                      {/* Bars container */}
                      <div className="relative w-full h-20 flex items-end justify-center gap-0.5">
                        {/* Estimated bar (background) */}
                        <div
                          className="w-2 bg-slate-200 dark:bg-slate-700 rounded-t transition-all group-hover:bg-slate-300 dark:group-hover:bg-slate-600"
                          style={{ height: `${Math.max(estimatedHeight, 2)}%` }}
                          title={`Estimated: ${formatDuration(day.estimatedMs)}`}
                        />
                        {/* Tracked bar (foreground) */}
                        <div
                          className={`w-2 rounded-t transition-all ${
                            isToday
                              ? 'bg-gradient-to-t from-indigo-500 to-violet-500'
                              : 'bg-indigo-400 dark:bg-indigo-500'
                          }`}
                          style={{ height: `${Math.max(trackedHeight, day.trackedMs > 0 ? 2 : 0)}%` }}
                          title={`Tracked: ${formatDuration(day.trackedMs)}`}
                        />
                      </div>
                      {/* Day label */}
                      <span
                        className={`text-xs ${
                          isToday
                            ? 'font-semibold text-indigo-600 dark:text-indigo-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {day.dayLabel}
                      </span>
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 px-2 py-1 bg-popover border border-border rounded shadow-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div className="font-medium">{day.date}</div>
                        <div className="text-indigo-600 dark:text-indigo-400">
                          Tracked: {formatDuration(day.trackedMs)}
                        </div>
                        <div className="text-muted-foreground">
                          Estimated: {formatDuration(day.estimatedMs)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-indigo-500" />
                  <span>Tracked</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" />
                  <span>Estimated</span>
                </div>
              </div>
            </div>

            {/* View Details Link */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
            >
              <History className="w-4 h-4" />
              View Detailed History
            </button>
          </div>
        )}

        {/* Collapsed summary */}
        {isCollapsed && (
          <div className="px-4 py-2 flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Today:</span>
            <span className="font-semibold tabular-nums">
              {formatTimeHHMM(dailyStats.totalTrackedMs)}
            </span>
            <span className="text-muted-foreground">•</span>
            <span
              className={`font-medium tabular-nums ${getAccuracyColor(dailyStats.accuracy)}`}
            >
              {dailyStats.accuracy}% accuracy
            </span>
          </div>
        )}
      </div>

      {/* History Modal */}
      <TimeHistoryModal open={isHistoryOpen} onOpenChange={setIsHistoryOpen} />
    </>
  );
}

export default TimeAnalyticsWidget;

