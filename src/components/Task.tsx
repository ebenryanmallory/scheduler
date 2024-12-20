import { formatTimeToAMPM, addMinutes } from '../utils/timeUtils'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { TaskType } from '../types/task'
import { Checkbox } from './ui/checkbox'
import { cn } from '@/lib/utils'
import { taskService } from '@/services/taskService'
import { useState, useEffect } from 'react'

type TaskProps = TaskType & {
  onEdit?: (task: TaskType) => void
  onUpdate?: (task: TaskType) => void
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
  onEdit,
  onUpdate
}: TaskProps) {
  const [isChecked, setIsChecked] = useState(completed);

  useEffect(() => {
    if (isChecked !== completed) {
      handleCompletedChange(isChecked);
    }
  }, [isChecked]);

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
    
    if (!onEdit) return;

    const taskData = {
        id,
        title,
        scheduledTime,
        project,
        completed,
        description,
        order: order || 0,
        persistent
    }
    onEdit(taskData)
  }

  const handleCompletedChange = async (checked: boolean) => {
    try {
      const updatedTask = {
        id,
        title,
        scheduledTime,
        project,
        completed: checked,
        description,
        order: order || 0,
        persistent
      }
      
      if (onUpdate) {
        onUpdate(updatedTask)
      } else {
        await taskService.updateTask(updatedTask)
      }

      // Send email notification when task is completed
      if (checked) {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: 'ebenryanmallory@proton.me',
            subject: 'Task Complete!',
            content: `You have completed task "${title}" (ID: ${id})`
          })
        })
      }
    } catch (error) {
      console.error('Failed to update task completion:', error)
    }
  }

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    try {
      await taskService.deleteTask(id)
    } catch (error) {
      console.error('Failed to delete task:', error)
      // TODO: Add error handling UI
    }
  }

  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 shadow-sm p-3",
      isChecked && "bg-gray-50"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          {persistent && (
            <div className="pt-1" >
              <Checkbox 
                checked={isChecked}
                onCheckedChange={(checked) => setIsChecked(checked === true)}
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className={cn(
              "font-medium",
              isChecked && "text-gray-400 line-through"
            )}>
              {title}
            </span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs text-gray-600",
                isChecked && "text-gray-400"
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
                    isChecked && "opacity-50"
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
                    isChecked && "opacity-50"
                  )}
                >
                  Goal
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleEditClick}
            >
              <Pencil className={cn(
                "h-4 w-4 text-gray-500 hover:text-blue-600",
                isChecked && "opacity-50"
              )} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleDeleteClick}
          >
            <Trash2 className={cn(
              "h-4 w-4 text-gray-500 hover:text-red-600",
              isChecked && "opacity-50"
            )} />
          </Button>
        </div>
      </div>
    </div>
  )
} 