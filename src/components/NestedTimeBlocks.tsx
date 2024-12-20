import { Button } from '@/components/ui/button'
import { formatTimeToAMPM, addMinutes } from '@/utils/timeUtils'
import { TaskType } from "@/types/task"
import { Badge } from '@/components/ui/badge'
import { getProjectColor } from '@/config/projects'
import { NestedTimeBlocksProps } from '@/types/timeBlock'
import { Checkbox } from '@/components/ui/checkbox'

export function NestedTimeBlocks({ 
  startTime, 
  duration, 
  onAddTask,
  onUpdateTask,
  timeBlocks,
  parentActivity,
  tasks = []
}: NestedTimeBlocksProps) {
  const handleAddTask = (currentTime: string) => {
    try {
      const blockIndex = timeBlocks.findIndex(b => b?.time === currentTime)
      if (blockIndex !== -1) {
        onAddTask(blockIndex, currentTime)
      } else {
        console.error('No matching time block found for:', currentTime)
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const handleCompletedChange = async (task: TaskType, completed: boolean) => {
    try {
      if (onUpdateTask) {
        await onUpdateTask(task.id, { ...task, completed });
      }

      if (completed && task.project) {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: 'ebenryanmallory@proton.me',
            subject: `Project Milestone Completed: ${task.project}`,
            content: `
              <h1>Project Milestone Completed! 🎉</h1>
              <p>A significant task has been completed in the ${task.project} project:</p>
              <ul>
                <li><strong>Task:</strong> ${task.title}</li>
                <li><strong>Project:</strong> ${task.project}</li>
                <li><strong>Time:</strong> ${formatTimeToAMPM(task.scheduledTime)}</li>
                ${task.description ? `<li><strong>Description:</strong> ${task.description}</li>` : ''}
              </ul>
              <p>Keep up the great work!</p>
            `
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send email notification');
        }
      }
    } catch (error) {
      console.error('Error handling task completion:', error);
    }
  };

  const renderTimeBlock = (currentTime: string, description: string, task?: TaskType) => {
    const projectColors = task?.project ? getProjectColor(task.project) : null
    
    return (
      <div 
        key={currentTime}
        className="ml-4 p-2 border-l border-blue-200 hover:bg-blue-50"
        data-parent-activity={parentActivity?.tag || ''}
      >
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div>
              <span className="text-xs text-gray-600">{formatTimeToAMPM(currentTime)}</span>
              <span className="text-xs text-gray-400 ml-2">
                - {formatTimeToAMPM(addMinutes(currentTime, 30))}
              </span>
            </div>
            {description && (
              <span className="text-sm text-gray-700 mt-1">{description}</span>
            )}
            {task?.title && (
              <div className="flex items-center gap-2 mt-1">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) => 
                    handleCompletedChange(task, checked as boolean)
                  }
                  className="mr-2"
                />
                <span className={`text-sm font-medium text-blue-600 ${
                  task.completed ? 'line-through text-gray-400' : ''
                }`}>
                  {task.title}
                </span>
                {task.project && projectColors && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs px-2 py-0.5 ${projectColors.background} ${projectColors.text}`}
                  >
                    {task.project}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!task && timeBlocks && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 px-2 text-xs hover:bg-blue-100 hover:text-blue-700"
                onClick={(e) => {
                  e.stopPropagation()
                  const timeBlock = timeBlocks.find(b => b?.time === currentTime)
                  if (!timeBlock) {
                    console.error(`Time block not found for time: ${currentTime}`)
                    return
                  }
                  handleAddTask(currentTime)
                }}
              >
                Add Task
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const blocks = []
  let currentTime = startTime
  let slotIndex = 0
  const endTime = addMinutes(startTime, duration)

  while (currentTime < endTime) {
    const description = parentActivity?.slots?.[slotIndex]?.description || ''
    const task = tasks?.find(t => t?.scheduledTime === currentTime)
    blocks.push(renderTimeBlock(currentTime, description, task))
    currentTime = addMinutes(currentTime, 30)
    slotIndex++
  }
  
  return <div className="space-y-1">{blocks}</div>
} 