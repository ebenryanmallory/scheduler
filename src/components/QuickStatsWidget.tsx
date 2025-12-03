import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Zap,
  Flame,
  Clock,
  Trophy,
  Target,
} from 'lucide-react';
import { useQuickStats, getMotivationalMessage, getProgressColor, getScoreColor } from '@/hooks/useQuickStats';
import { formatDuration } from '@/hooks/useTimeAnalytics';
import toast from 'react-hot-toast';

const COLLAPSE_STORAGE_KEY = 'scheduler_quickstats_collapsed';

/**
 * SVG Progress Ring Component
 */
function ProgressRing({
  percentage,
  size = 64,
  strokeWidth = 6,
  className = '',
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-500 ease-out ${getProgressColor(percentage)}`}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-bold tabular-nums ${getProgressColor(percentage)}`}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}

/**
 * Score Gauge Component
 */
function ScoreGauge({ score }: { score: number }) {
  const { message, emoji } = getMotivationalMessage(score);
  
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className={`text-3xl font-bold tabular-nums ${getScoreColor(score)}`}>
          {score}
        </div>
        <div className="text-xs text-muted-foreground text-center">/100</div>
      </div>
      <div className="flex flex-col">
        <span className="text-lg">{emoji}</span>
        <span className="text-xs text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}

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
      // Show only the most significant milestone to avoid spam
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

  // Focus bar percentage
  const focusPercentage = Math.round(focusBreakdown.ratio * 100);

  return (
    <div className="w-full bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-950/70 dark:hover:to-orange-950/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-foreground">Quick Stats</h3>
          {streak.currentStreak >= 3 && (
            <span className="flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
              <Flame className="w-3 h-3" />
              {streak.currentStreak}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Daily Progress Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Today's Progress
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-2xl font-bold ${getProgressColor(dailyProgress.percentage)}`}>
                    {dailyProgress.completed}/{dailyProgress.total}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    tasks completed
                  </div>
                </div>
                <ProgressRing percentage={dailyProgress.percentage} size={56} strokeWidth={5} />
              </div>
            </div>

            {/* Streak Counter Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800/50">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Streak
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {streak.currentStreak}
                  </span>
                  <span className="text-sm text-amber-600/70 dark:text-amber-400/70">
                    {streak.currentStreak === 1 ? 'day' : 'days'}
                  </span>
                </div>
                {streak.currentStreak > 0 && (
                  <Flame className="w-8 h-8 text-amber-500 animate-pulse" />
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Best: {streak.longestStreak} days
              </div>
            </div>

            {/* Focus Time Card */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-lg p-4 border border-violet-200 dark:border-violet-800/50">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tracked Time
                </span>
              </div>
              <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                {formatDuration(focusBreakdown.focusTimeMs)}
              </div>
              {/* Focus bar */}
              <div className="mt-2">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${focusPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{focusPercentage}% of day</span>
                  <span>8h goal</span>
                </div>
              </div>
            </div>

            {/* Productivity Score Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800/50">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Productivity
                </span>
              </div>
              <ScoreGauge score={productivityScore.score} />
              {/* Score breakdown on hover */}
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Completion</span>
                  <span className="tabular-nums">{productivityScore.factors.completionRate}pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Accuracy</span>
                  <span className="tabular-nums">{productivityScore.factors.timeAccuracy}pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Streak</span>
                  <span className="tabular-nums">{productivityScore.factors.consistencyBonus}pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed summary */}
      {isCollapsed && (
        <div className="px-4 py-2 flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Today:</span>
          <span className={`font-semibold tabular-nums ${getProgressColor(dailyProgress.percentage)}`}>
            {dailyProgress.completed}/{dailyProgress.total}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
              {streak.currentStreak}
            </span>
          </span>
          <span className="text-muted-foreground">•</span>
          <span className={`font-semibold tabular-nums ${getScoreColor(productivityScore.score)}`}>
            {productivityScore.score}pts
          </span>
        </div>
      )}
    </div>
  );
}

export default QuickStatsWidget;

