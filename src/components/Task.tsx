import { TaskType } from "@/types/task"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Checkbox } from "./ui/checkbox"
import { Pencil, Trash2, Repeat } from "lucide-react"
import { useProjectStore } from '@/store/projectStore'
import { useMemo } from 'react'
import { isRecurring, isRecurringInstance, describeRecurrence } from '@/lib/recurrence'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface TaskProps extends TaskType {
  onTaskUpdate?: (task: TaskType) => void
  onEdit?: (task: TaskType) => void
  onDelete?: (id: string) => void
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
  recurrence,
  onTaskUpdate,
  onEdit,
  onDelete,
}: TaskProps) {
  const { getProjectColor } = useProjectStore()

  // Check if task is recurring (AC11)
  const hasRecurrence = isRecurring(recurrence)
  const isInstance = isRecurringInstance(recurrence)
  const recurrenceDescription = recurrence?.rruleString
    ? describeRecurrence(recurrence.rruleString)
    : ''

  // Build the full task object for updates - memoized to prevent infinite loops
  const fullTask = useMemo((): TaskType => ({
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
    recurrence
  }), [id, title, description, project, date, completed, scheduledTime, persistent, timeBlock, time, recurrence])

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={completed}
            onCheckedChange={(checked) => 
              onTaskUpdate?.({ 
                ...fullTask,
                completed: checked as boolean
              })
            }
          />
          <span className={`font-medium text-sm truncate ${completed ? 'line-through text-muted-foreground' : ''}`}>
            {title}
          </span>
          {/* Recurring indicator (AC11) */}
          {hasRecurrence && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`flex-shrink-0 ${isInstance ? 'text-muted-foreground' : 'text-primary'}`}>
                    <Repeat className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {isInstance ? 'Part of series: ' : ''}
                    {recurrenceDescription || 'Recurring task'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onEdit?.(fullTask)}
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
      
    </div>
  )
} 