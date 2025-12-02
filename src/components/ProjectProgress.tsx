import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Loader2, AlertCircle, Trophy, Rocket, Sparkles } from 'lucide-react'

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

const statusConfig = {
  completed: { 
    icon: CheckCircle2, 
    color: 'text-emerald-500', 
    bg: 'bg-emerald-500/10',
    label: 'Completed'
  },
  'in-progress': { 
    icon: Loader2, 
    color: 'text-amber-500', 
    bg: 'bg-amber-500/10',
    label: 'In Progress'
  },
  pending: { 
    icon: Circle, 
    color: 'text-stone-400', 
    bg: 'bg-stone-400/10',
    label: 'Pending'
  },
  blocked: { 
    icon: AlertCircle, 
    color: 'text-red-500', 
    bg: 'bg-red-500/10',
    label: 'Blocked'
  }
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
    <div className={`rounded-xl border transition-all duration-300 ${
      isCurrent 
        ? 'border-amber-300 bg-gradient-to-br from-amber-50/80 to-orange-50/80 shadow-lg shadow-amber-100/50' 
        : isComplete
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/50'
          : 'border-stone-200 bg-white/50 opacity-75'
    }`}>
      {/* Epic Header */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
          isComplete 
            ? 'bg-emerald-500 text-white' 
            : isCurrent 
              ? 'bg-amber-500 text-white'
              : 'bg-stone-200 text-stone-500'
        }`}>
          {isComplete ? <Trophy className="w-5 h-5" /> : epic.id}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold truncate ${
              isCurrent ? 'text-amber-900' : isComplete ? 'text-emerald-800' : 'text-stone-600'
            }`}>
              {epic.title}
            </h3>
            {isCurrent && (
              <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-amber-200 text-amber-800 rounded-full flex items-center gap-1">
                <Rocket className="w-3 h-3" />
                Active
              </span>
            )}
            {isComplete && (
              <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-emerald-200 text-emerald-800 rounded-full">
                Complete
              </span>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isComplete 
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                    : 'bg-gradient-to-r from-amber-400 to-orange-400'
                }`}
                style={{ width: `${epic.percentComplete}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${
              isComplete ? 'text-emerald-600' : 'text-stone-500'
            }`}>
              {epic.completedCount}/{epic.totalCount}
            </span>
          </div>
        </div>
        
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-stone-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-stone-400 flex-shrink-0" />
        )}
      </button>
      
      {/* Stories List */}
      {isExpanded && epic.stories.length > 0 && (
        <div className="px-4 pb-4 pt-0">
          <div className="border-t border-stone-200/60 pt-3 space-y-1">
            {epic.stories.map((story) => {
              const config = statusConfig[story.status]
              const Icon = config.icon
              
              return (
                <button
                  key={story.id}
                  onClick={() => onStoryClick?.(epic.id, story.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-white/50 ${config.bg}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${config.color} ${
                    story.status === 'in-progress' ? 'animate-spin' : ''
                  }`} />
                  <span className="flex-1 text-sm text-stone-700 truncate">
                    <span className="font-medium text-stone-500">{story.id}</span>
                    <span className="mx-1.5 text-stone-300">·</span>
                    {story.title}
                  </span>
                  {story.hasGate && (
                    <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                      story.gateStatus === 'PASS' 
                        ? 'bg-emerald-100 text-emerald-700'
                        : story.gateStatus === 'FAIL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-stone-100 text-stone-600'
                    }`}>
                      {story.gateStatus || 'QA'}
                    </span>
                  )}
                </button>
              )
            })}
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!data || data.epics.length === 0) {
    return (
      <div className="text-center py-8 text-stone-500">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-amber-400" />
        <p>No epics found in project</p>
      </div>
    )
  }

  // Compact view for widget
  if (compact) {
    return (
      <div className="space-y-3">
        {/* Overall Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-full transition-all duration-700"
                style={{ width: `${data.overallPercent}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-semibold text-stone-700">
            {data.overallPercent}%
          </span>
        </div>
        
        {/* Mini epic indicators */}
        <div className="flex gap-1">
          {data.epics.map((epic) => (
            <div 
              key={epic.id}
              className={`flex-1 h-2 rounded-full ${
                epic.percentComplete === 100 
                  ? 'bg-emerald-400' 
                  : epic.id === data.currentEpic
                    ? 'bg-amber-400'
                    : epic.percentComplete > 0
                      ? 'bg-amber-200'
                      : 'bg-stone-200'
              }`}
              title={`Epic ${epic.id}: ${epic.title} (${epic.percentComplete}%)`}
            />
          ))}
        </div>
        
        <p className="text-xs text-stone-500">
          {data.completedStories} of {data.totalStories} stories complete
          {data.currentEpic && ` · Epic ${data.currentEpic} active`}
        </p>
      </div>
    )
  }

  // Full view for modal
  return (
    <div className="space-y-6">
      {/* Overall Progress Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Project Progress
            </h2>
            <p className="text-stone-400 text-sm mt-1">
              {data.completedStories} of {data.totalStories} stories completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
              {data.overallPercent}%
            </div>
            <p className="text-stone-400 text-xs">Overall</p>
          </div>
        </div>
        
        {/* Overall progress bar */}
        <div className="h-4 bg-stone-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-full transition-all duration-700 relative"
            style={{ width: `${data.overallPercent}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
          </div>
        </div>
        
        {/* Epic progress mini indicators */}
        <div className="flex gap-2 mt-4">
          {data.epics.map((epic) => (
            <div key={epic.id} className="flex-1 text-center">
              <div className={`h-1.5 rounded-full mb-1 ${
                epic.percentComplete === 100 
                  ? 'bg-emerald-400' 
                  : epic.id === data.currentEpic
                    ? 'bg-amber-400'
                    : epic.percentComplete > 0
                      ? 'bg-amber-400/50'
                      : 'bg-stone-600'
              }`} />
              <span className={`text-xs ${
                epic.id === data.currentEpic ? 'text-amber-300' : 'text-stone-500'
              }`}>
                E{epic.id}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Epic Cards */}
      <div className="space-y-3">
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

