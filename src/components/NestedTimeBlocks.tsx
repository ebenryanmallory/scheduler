import { Button } from '@/components/ui/button'
import { formatTimeToAMPM, addMinutes } from '@/utils/timeUtils'
import { TaskType } from "@/types/task"
import { Badge } from '@/components/ui/badge'
import { getProjectColor } from '@/config/projects'
import { NestedTimeBlocksProps } from '@/types/timeBlock'

export function NestedTimeBlocks({ 
  startTime, 
  duration, 
  onAddTask, 
  timeBlocks,
  parentActivity,
  tasks = []
}: NestedTimeBlocksProps) {
  const handleAddTask = (currentTime: string) => {
    try {
      const blockIndex = timeBlocks.findIndex(b => b?.time === currentTime)
      if (blockIndex !== -1) {
        onAddTask(blockIndex, currentTime)
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

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
                <span className="text-sm font-medium text-blue-600">
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
    const task = tasks?.find(t => t?.time === currentTime)
    blocks.push(renderTimeBlock(currentTime, description, task))
    currentTime = addMinutes(currentTime, 30)
    slotIndex++
  }
  
  return <div className="space-y-1">{blocks}</div>
} 