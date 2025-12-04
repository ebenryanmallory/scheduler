import { useState } from 'react'
import { ChevronDown, ChevronRight, Check, Circle, Loader2 } from 'lucide-react'

interface StoryProgress {
  id: string
  title: string
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
  hasGate: boolean
  gateStatus?: 'PASS' | 'FAIL' | 'PENDING'
}

interface EpicProgress {
  id: number
  title: string
  description: string
  stories: StoryProgress[]
  completedCount: number
  totalCount: number
  percentComplete: number
}

export interface ProjectProgressData {
  epics: EpicProgress[]
  totalStories: number
  completedStories: number
  overallPercent: number
  currentEpic: number
  lastUpdated: string
}

interface ProjectProgressProps {
  data: ProjectProgressData | null
  isLoading?: boolean
  compact?: boolean
  onStoryClick?: (epicId: number, storyId: string) => void
}

function EpicCard({ 
  epic, 
  isCurrent,
  onStoryClick 
}: { 
  epic: EpicProgress
  isCurrent: boolean
  onStoryClick?: (epicId: number, storyId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(isCurrent)
  const isComplete = epic.percentComplete === 100
  
  return (
    <div className={`rounded-lg border bg-card transition-colors ${
      isCurrent ? 'border-border ring-1 ring-muted' : 'border-border'
    }`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center gap-3 text-left"
      >
        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
          isComplete 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' 
            : isCurrent 
              ? 'bg-muted text-foreground'
              : 'bg-muted text-muted-foreground'
        }`}>
          {isComplete ? <Check className="w-4 h-4" /> : epic.id}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-medium truncate ${
              isComplete ? 'text-muted-foreground' : 'text-foreground'
            }`}>
              {epic.title}
            </h3>
            {isCurrent && !isComplete && (
              <span className="flex-shrink-0 text-xs text-muted-foreground">
                active
              </span>
            )}
          </div>
          
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isComplete 
                    ? 'bg-emerald-500 dark:bg-emerald-600'
                    : 'bg-foreground/30'
                }`}
                style={{ width: `${epic.percentComplete}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {epic.completedCount}/{epic.totalCount}
            </span>
          </div>
        </div>
        
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      
      {isExpanded && epic.stories.length > 0 && (
        <div className="px-3 pb-3">
          <div className="border-t border-border pt-2 space-y-0.5">
            {epic.stories.map((story) => (
              <button
                key={story.id}
                onClick={() => onStoryClick?.(epic.id, story.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors hover:bg-muted/50"
              >
                {story.status === 'completed' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
                ) : story.status === 'in-progress' ? (
                  <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin flex-shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                )}
                <span className={`flex-1 text-xs truncate ${
                  story.status === 'completed' ? 'text-muted-foreground' : 'text-foreground'
                }`}>
                  {story.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProjectProgress({ 
  data, 
  isLoading, 
  compact = false,
  onStoryClick 
}: ProjectProgressProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data || data.epics.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No progress data available
      </div>
    )
  }

  // Compact view for widget
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-foreground/40 rounded-full transition-all duration-500"
              style={{ width: `${data.overallPercent}%` }}
            />
          </div>
        </div>
        
        <div className="flex gap-1">
          {data.epics.map((epic) => (
            <div 
              key={epic.id}
              className={`flex-1 h-1 rounded-full ${
                epic.percentComplete === 100 
                  ? 'bg-emerald-500 dark:bg-emerald-600' 
                  : epic.id === data.currentEpic
                    ? 'bg-foreground/30'
                    : epic.percentComplete > 0
                      ? 'bg-foreground/20'
                      : 'bg-muted'
              }`}
              title={`Epic ${epic.id}: ${epic.title}`}
            />
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground">
          {data.completedStories} of {data.totalStories} stories
        </p>
      </div>
    )
  }

  // Full view for modal
  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="p-4 rounded-lg bg-muted/50">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {data.completedStories} of {data.totalStories} stories
          </span>
          <span className="text-lg font-semibold tabular-nums">
            {data.overallPercent}%
          </span>
        </div>
        
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-foreground/40 rounded-full transition-all duration-500"
            style={{ width: `${data.overallPercent}%` }}
          />
        </div>
      </div>
      
      {/* Epic Cards */}
      <div className="space-y-2">
        {data.epics.map((epic) => (
          <EpicCard 
            key={epic.id}
            epic={epic}
            isCurrent={epic.id === data.currentEpic}
            onStoryClick={onStoryClick}
          />
        ))}
      </div>
    </div>
  )
}
