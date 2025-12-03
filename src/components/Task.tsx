import { TaskType, TimeTrackingState } from "@/types/task"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Checkbox } from "./ui/checkbox"
import { Pencil, Trash2, Timer } from "lucide-react"
import { useProjectStore } from '@/store/projectStore'
import { TaskTimer } from './TaskTimer'
import { useState } from 'react'

interface TaskProps extends TaskType {
  onTaskUpdate?: (task: TaskType) => void
  onEdit?: (task: TaskType) => void
  onDelete?: (id: string) => void
  showTimer?: boolean
}

export function Task({ 
  id, 
  title, 
  description, 
  project,
  date,
  completed,
  scheduledTime,
  persistent,
  timeBlock,
  time,
  estimatedDuration,
  actualDuration,
  timeTracking,
  onTaskUpdate,
  onEdit,
  onDelete,
  showTimer = false
}: TaskProps) {
  const { getProjectColor } = useProjectStore()
  const [timerExpanded, setTimerExpanded] = useState(false)

  // Build the full task object for updates
  const getFullTask = (): TaskType => ({
    id,
    title,
    description,
    project,
    date,
    completed,
    scheduledTime,
    persistent,
    timeBlock,
    time,
    estimatedDuration,
    actualDuration,
    timeTracking
  })

  // Handle time tracking updates
  const handleTimeUpdate = (newTimeTracking: TimeTrackingState, newActualDuration: number) => {
    onTaskUpdate?.({
      ...getFullTask(),
      timeTracking: newTimeTracking,
      actualDuration: newActualDuration
    })
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={completed}
            onCheckedChange={(checked) => 
              onTaskUpdate?.({ 
                ...getFullTask(),
                completed: checked as boolean
              })
            }
          />
          <span className={`font-medium text-sm truncate ${completed ? 'line-through text-muted-foreground' : ''}`}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Timer Toggle Button */}
          {showTimer && (
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 transition-opacity ${timerExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              onClick={() => setTimerExpanded(!timerExpanded)}
              title={timerExpanded ? 'Hide timer' : 'Show timer'}
            >
              <Timer className={`h-4 w-4 ${timerExpanded ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onEdit?.(getFullTask())}
          >
            <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete?.(id)}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
      {project && (
        <div className="flex gap-2 mt-1 ml-8">
          <Badge 
            variant="secondary"
            className={getProjectColor(project)}
          >
            {project}
          </Badge>
        </div>
      )}
      
      {/* Timer Component */}
      {showTimer && timerExpanded && (
        <div className="ml-8 mt-2">
          <TaskTimer
            task={getFullTask()}
            onTimeUpdate={handleTimeUpdate}
          />
        </div>
      )}
    </div>
  )
} 