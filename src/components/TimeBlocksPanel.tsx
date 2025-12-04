/**
 * TimeBlocksPanel Component
 * Renders the schedule with time blocks that support drag-and-drop
 */

import { useState } from 'react'
import { ScheduleActivity, ScheduleActivities } from '../types/schedule'
import { scheduleActivities } from '../data/scheduleActivities'
import { TimeBlockDetails } from './TimeBlockDetails'
import { NestedTimeBlocks } from './NestedTimeBlocks'
import { TimeBlockDropZone } from './TimeBlockDropZone'
import { ChevronDown, ChevronRight } from "lucide-react"
import { 
  formatTimeToAMPM, 
  addMinutes, 
  isWorkday,
  generateTimeBlocks,
  createScheduledTime,
  getTimeStringFromISO
} from '../utils/timeUtils'
import { TaskType } from '@/types/task'
import { useProjectStore } from '@/store/projectStore'

interface TimeBlocksPanelProps {
  selectedDate: Date | null
  onAddTask: (blockIndex: number, scheduledTime: string) => void
  tasks: TaskType[]
}

function TimeBlocksPanel({ selectedDate, onAddTask, tasks }: TimeBlocksPanelProps) {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null)
  const { getDisplayProjects } = useProjectStore()

  const timeBlocks = generateTimeBlocks()
  const projects = getDisplayProjects()

  // Helper to check if a time falls within a duration block
  const isWithinDurationBlock = (scheduledTime: string): boolean => {
    if (!selectedDate) return false
    
    for (const [blockTime, activity] of Object.entries(scheduleActivities as ScheduleActivities)) {
      if (activity.duration) {
        const blockScheduledTime = createScheduledTime(selectedDate, blockTime)
        const blockEndTime = addMinutes(blockScheduledTime, activity.duration)
        if (scheduledTime > blockScheduledTime && scheduledTime < blockEndTime) {
          return true
        }
      }
    }
    return false
  }

  // Get activity for a specific time block
  const getActivityForBlock = (scheduledTime: string): ScheduleActivity | null => {
    if (!selectedDate || !isWorkday(selectedDate)) return null
    const timeString = getTimeStringFromISO(scheduledTime)
    const activity = scheduleActivities[timeString] as ScheduleActivity | undefined
    
    // If this is a 4-hour focus block, update the activity name with the project
    if (activity && activity.duration === 240) {
      const isMorningBlock = timeString === "08:00"
      const project = projects[isMorningBlock ? 0 : 1] // Morning project is first, afternoon is second
      
      if (project) {
        return {
          ...activity,
          activity: `Focus Work - ${project.title}`
        }
      }
    }
    
    return activity || null
  }

  // Get task scheduled for a specific time
  const getTaskForTime = (scheduledTime: string): TaskType | undefined => {
    return tasks.find(t => t.scheduledTime === scheduledTime)
  }

  if (!selectedDate) return null

  return (
    <div className="w-full sm:max-w-96 rounded-md border p-3 sm:p-4">
      <h2 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
        {selectedDate.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })}
      </h2>

      {!isWorkday(selectedDate) ? (
        <p className="text-muted-foreground text-sm">No schedule available for Mondays and Fridays</p>
      ) : (
        <div className="space-y-2 sm:space-y-2">
          {timeBlocks.map(({ time: scheduledTime }) => {
            const activity = getActivityForBlock(scheduledTime)
            const isSelected = selectedBlock === scheduledTime
            const task = getTaskForTime(scheduledTime)
            
            // Skip blocks that are within a longer duration block
            if (isWithinDurationBlock(scheduledTime)) {
              return null
            }

            const isExpandable = activity?.duration && activity.duration > 30
            const hasTask = !!task

            return (
              <TimeBlockDropZone
                key={scheduledTime}
                timeBlockId={scheduledTime}
                hasExistingTask={hasTask}
                disabled={!!isExpandable} // Disable drop on expandable blocks - users should drop in nested slots
              >
                <div>
                  <div 
                    onClick={() => {
                      setSelectedBlock(isSelected ? null : scheduledTime)
                      if (isExpandable) {
                        setExpandedBlock(expandedBlock === scheduledTime ? null : scheduledTime)
                      }
                    }}
                    className={`
                      p-3 sm:p-3 border rounded-lg cursor-pointer transition-colors
                      min-h-[48px] sm:min-h-0
                      ${activity ? 'bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900' : 'hover:bg-muted'}
                      ${isSelected ? 'ring-2 ring-primary' : ''}
                      ${isExpandable ? 'border-l-4 border-l-primary' : ''}
                    `}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm sm:text-sm">
                        {formatTimeToAMPM(scheduledTime)}
                        {activity?.duration && activity.duration > 30 && (
                          ` - ${formatTimeToAMPM(addMinutes(scheduledTime, activity.duration))}`
                        )}
                      </span>
                      {isExpandable && (
                        <span className="text-xs text-primary p-1">
                          {expandedBlock === scheduledTime ? (
                            <ChevronDown className="h-5 w-5 sm:h-4 sm:w-4" />
                          ) : (
                            <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
                          )}
                        </span>
                      )}
                    </div>
                    {activity && (
                      <div className="mt-1">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          {activity.activity}
                        </p>
                        {activity.duration && (
                          <p className="text-xs text-muted-foreground">
                            Duration: {activity.duration} minutes
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Show scheduled task (for non-expandable blocks) */}
                    {!isExpandable && task && (
                      <div className="mt-2 p-2 bg-background/50 rounded border border-border">
                        <span className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {expandedBlock === scheduledTime && isExpandable && activity && (
                    <NestedTimeBlocks
                      startTime={scheduledTime}
                      duration={activity.duration || 0}
                      onAddTask={onAddTask}
                      timeBlocks={timeBlocks}
                      tasks={tasks}
                      parentActivity={activity}
                    />
                  )}

                  {isSelected && activity && (
                    <TimeBlockDetails
                      time={scheduledTime}
                      activity={activity}
                    />
                  )}
                </div>
              </TimeBlockDropZone>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TimeBlocksPanel
