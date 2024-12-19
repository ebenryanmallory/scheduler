import { formatTimeToAMPM, addMinutes } from '../utils/timeUtils'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { TaskType } from '../types/task'
import { Checkbox } from './ui/checkbox'
import { cn } from '@/lib/utils'

interface TaskProps extends TaskType {
  onUpdate?: (task: TaskType) => void
  onDelete?: (id: string) => void
}

export function Task({ 
  id, 
  title, 
  scheduledTime, 
  project, 
  completed, 
  description, 
  order,
  persistent,
  onUpdate, 
  onDelete 
}: TaskProps) {
  const getProjectColor = (project: string) => {
    switch (project) {
      case 'Dynamic Momentum':
        return 'bg-purple-100 text-purple-800'
      case 'Motion Storyline':
        return 'bg-emerald-100 text-emerald-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    onUpdate?.({ 
      id, 
      title, 
      scheduledTime, 
      project, 
      completed, 
      description,
      order: order || 0,
      persistent
    })
  }

  const handleCompletedChange = (checked: boolean) => {
    onUpdate?.({
      id,
      title,
      scheduledTime,
      project,
      completed: checked,
      description,
      order: order || 0,
      persistent
    })
  }

  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 shadow-sm p-3",
      completed && "bg-gray-50"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          {persistent && (
            <div className="pt-1">
              <Checkbox 
                checked={completed}
                onCheckedChange={handleCompletedChange}
                id={`task-${id}-completed`}
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className={cn(
              "font-medium",
              completed && "text-gray-400 line-through"
            )}>
              {title}
            </span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs text-gray-600",
                completed && "text-gray-400"
              )}>
                {formatDate(scheduledTime)}
                <span className="mx-1">•</span>
                {formatTimeToAMPM(scheduledTime)}
                <span className="text-gray-400 ml-1">
                  - {formatTimeToAMPM(addMinutes(scheduledTime, 30))}
                </span>
              </span>
              {project && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    `text-xs px-2 py-0.5 ${getProjectColor(project)}`,
                    completed && "opacity-50"
                  )}
                >
                  {project}
                </Badge>
              )}
              {persistent && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs px-2 py-0.5 bg-blue-100 text-blue-800",
                    completed && "opacity-50"
                  )}
                >
                  Persistent
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {(onUpdate || onDelete) && (
          <div className="flex items-center gap-2">
            {onUpdate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleEditClick}
              >
                <Pencil className={cn(
                  "h-4 w-4 text-gray-500 hover:text-blue-600",
                  completed && "opacity-50"
                )} />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onDelete(id)
                }}
              >
                <Trash2 className={cn(
                  "h-4 w-4 text-gray-500 hover:text-red-600",
                  completed && "opacity-50"
                )} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 