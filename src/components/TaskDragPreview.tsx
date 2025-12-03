/**
 * TaskDragPreview Component
 * Renders the ghost/overlay element during drag operations (AC3)
 */

import { TaskType } from '@/types/task'
import { Badge } from './ui/badge'
import { useProjectStore } from '@/store/projectStore'
import { GripVertical, Clock } from 'lucide-react'

interface TaskDragPreviewProps {
  task: TaskType
  dropTime?: string | null
  isOverTimeBlock?: boolean
}

export function TaskDragPreview({ 
  task, 
  dropTime, 
  isOverTimeBlock 
}: TaskDragPreviewProps) {
  const { getProjectColor } = useProjectStore()
  const projectColor = task.project ? getProjectColor(task.project) : null

  return (
    <div 
      className={`
        flex items-center gap-2 p-3 rounded-lg border-2 shadow-lg 
        bg-card text-card-foreground min-w-[200px] max-w-[300px]
        transition-all duration-150
        ${isOverTimeBlock 
          ? 'border-primary ring-2 ring-primary/30 scale-[1.02]' 
          : 'border-border'
        }
      `}
      style={{ cursor: 'grabbing' }}
    >
      <GripVertical className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          {task.project && projectColor && (
            <Badge variant="secondary" className={`${projectColor} text-xs`}>
              {task.project}
            </Badge>
          )}
          
          {task.estimatedDuration && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.estimatedDuration}m
            </span>
          )}
        </div>
      </div>

      {/* Show target time when hovering over time block */}
      {isOverTimeBlock && dropTime && (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs font-medium text-primary">
          <Clock className="h-3 w-3" />
          {formatTimePreview(dropTime)}
        </div>
      )}
    </div>
  )
}

function formatTimePreview(time: string): string {
  try {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  } catch {
    return time
  }
}

export default TaskDragPreview

