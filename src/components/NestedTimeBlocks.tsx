import { Button } from '@/components/ui/button'
import { formatTimeToAMPM, addMinutes, getTimeStringFromISO } from '@/utils/timeUtils'
import { TaskType } from "@/types/task"
import { Badge } from '@/components/ui/badge'
import { useProjectStore } from '@/store/projectStore'
import { NestedTimeBlocksProps } from '@/types/timeBlock'
import { Checkbox } from '@/components/ui/checkbox'
import { useTaskStore } from '@/store/taskStore'

export function NestedTimeBlocks({ 
  startTime, 
  duration, 
  timeBlocks,
  parentActivity,
  tasks = []
}: NestedTimeBlocksProps) {
  const { updateTask, setCreateDialogOpen, setSelectedTimeBlock, setSelectedTime } = useTaskStore()
  const { getProjectColor } = useProjectStore()

  const handleAddTask = (currentTime: string) => {
    try {
      const blockIndex = timeBlocks.findIndex(b => b?.time === currentTime)
      if (blockIndex !== -1) {
        // Convert ISO string to HH:mm format for the store
        const formattedTime = getTimeStringFromISO(currentTime)
        
        setSelectedTimeBlock(blockIndex)
        setSelectedTime(formattedTime)
        setCreateDialogOpen(true)
      } else {
        console.error('No matching time block found for:', currentTime)
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const handleCompletedChange = async (task: TaskType, completed: boolean) => {
    try {
      await updateTask(task.id, { ...task, completed });

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
    const projectColor = task?.project ? getProjectColor(task.project) : null
    
    return (
      <div 
        key={currentTime}
        className="ml-4 p-2 border-l border-primary/30 hover:bg-muted"
        data-parent-activity={parentActivity?.tag || ''}
      >
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div>
              <span className="text-xs text-muted-foreground">{formatTimeToAMPM(currentTime)}</span>
              <span className="text-xs text-muted-foreground/60 ml-2">
                - {formatTimeToAMPM(addMinutes(currentTime, 30))}
              </span>
            </div>
            {description && (
              <span className="text-sm text-foreground/80 mt-1">{description}</span>
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
                <span className={`text-sm font-medium text-primary ${
                  task.completed ? 'line-through text-muted-foreground' : ''
                }`}>
                  {task.title}
                </span>
                {task.project && projectColor && (
                  <Badge 
                    variant="secondary" 
                    className={projectColor}
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
                className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
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