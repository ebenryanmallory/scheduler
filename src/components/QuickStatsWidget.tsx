import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Flame,
} from 'lucide-react';
import { useQuickStats, getMotivationalMessage, getProgressColor, getScoreColor } from '@/hooks/useQuickStats';
import { formatDuration } from '@/hooks/useTimeAnalytics';
import toast from 'react-hot-toast';

const COLLAPSE_STORAGE_KEY = 'scheduler_quickstats_collapsed';

/**
 * Quick Stats Widget Component
 * Displays daily progress, streak, focus time, and productivity score
 */
function QuickStatsWidget() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const {
    dailyProgress,
    streak,
    focusBreakdown,
    productivityScore,
    newMilestones,
  } = useQuickStats();

  // Persist collapse state
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(isCollapsed));
    } catch {
      // Ignore localStorage errors
    }
  }, [isCollapsed]);

  // Show milestone toasts
  useEffect(() => {
    if (newMilestones.length > 0) {
      const milestone = newMilestones[newMilestones.length - 1];
      toast.success(
        <div className="flex items-center gap-2">
          <span className="text-2xl">{milestone.emoji}</span>
          <div>
            <div className="font-semibold">{milestone.title}</div>
            <div className="text-sm text-muted-foreground">{milestone.message}</div>
          </div>
        </div>,
        {
          duration: 5000,
          id: `milestone-${milestone.type}`,
        }
      );
    }
  }, [newMilestones]);

  const focusPercentage = Math.round(focusBreakdown.ratio * 100);
  const { message, emoji } = getMotivationalMessage(productivityScore.score);

  return (
    <div className="w-full bg-card border rounded-lg overflow-hidden">
      {/* Header - touch-friendly */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors min-h-[48px] sm:min-h-0"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Quick Stats</h3>
          {streak.currentStreak >= 3 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="w-3 h-3 text-amber-500" />
              {streak.currentStreak}
            </span>
          )}
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Daily Progress */}
            <div className="rounded-lg p-3 bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">Progress</div>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-semibold tabular-nums ${getProgressColor(dailyProgress.percentage)}`}>
                  {dailyProgress.completed}/{dailyProgress.total}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    dailyProgress.percentage >= 80 
                      ? 'bg-emerald-500' 
                      : dailyProgress.percentage >= 50 
                        ? 'bg-foreground/40' 
                        : 'bg-foreground/30'
                  }`}
                  style={{ width: `${dailyProgress.percentage}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {dailyProgress.percentage}% complete
              </div>
            </div>

            {/* Streak */}
            <div className="rounded-lg p-3 bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">Streak</div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold tabular-nums">
                  {streak.currentStreak}
                </span>
                <span className="text-sm text-muted-foreground">
                  {streak.currentStreak === 1 ? 'day' : 'days'}
                </span>
                {streak.currentStreak >= 3 && (
                  <Flame className="w-4 h-4 text-amber-500 ml-1" />
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Best: {streak.longestStreak} days
              </div>
            </div>

            {/* Tracked Time */}
            <div className="rounded-lg p-3 bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">Tracked</div>
              <div className="text-xl font-semibold tabular-nums">
                {formatDuration(focusBreakdown.focusTimeMs)}
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-foreground/30 rounded-full transition-all"
                  style={{ width: `${Math.min(focusPercentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {focusPercentage}% of 8h goal
              </div>
            </div>

            {/* Productivity Score */}
            <div className="rounded-lg p-3 bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">Score</div>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-semibold tabular-nums ${getScoreColor(productivityScore.score)}`}>
                  {productivityScore.score}
                </span>
                <span className="text-muted-foreground text-sm">/100</span>
                <span className="text-lg ml-auto">{emoji}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {message}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed summary */}
      {isCollapsed && (
        <div className="px-4 py-2 flex items-center gap-4 text-sm border-t">
          <span className="text-muted-foreground">Today:</span>
          <span className={`font-medium tabular-nums ${getProgressColor(dailyProgress.percentage)}`}>
            {dailyProgress.completed}/{dailyProgress.total}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium tabular-nums">
              {streak.currentStreak}
            </span>
          </span>
          <span className="text-muted-foreground">·</span>
          <span className={`font-medium tabular-nums ${getScoreColor(productivityScore.score)}`}>
            {productivityScore.score}pts
          </span>
        </div>
      )}
    </div>
  );
}

export default QuickStatsWidget;
