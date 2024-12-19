import { useState } from 'react'
import { ScheduleActivity } from '../types/schedule'
import { scheduleActivities } from '../data/scheduleActivities'
import { TimeBlockDetails } from './TimeBlockDetails'
import { NestedTimeBlocks } from './NestedTimeBlocks'
import { 
  formatTimeToAMPM, 
  addMinutes, 
  isWeekday, 
  generateTimeBlocks,
  createScheduledTime,
  getTimeStringFromISO
} from '../utils/timeUtils'
import { TaskType } from '@/types/task'

interface TimeBlocksPanelProps {
  selectedDate: Date | null
  onAddTask: (blockIndex: number, scheduledTime: string) => void
  tasks: TaskType[]
}

function TimeBlocksPanel({ selectedDate, onAddTask, tasks }: TimeBlocksPanelProps) {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null)

  const timeBlocks = generateTimeBlocks()

  // Helper to check if a time falls within a duration block
  const isWithinDurationBlock = (scheduledTime: string): boolean => {
    if (!selectedDate) return false
    
    for (const [blockTime, activity] of Object.entries(scheduleActivities)) {
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
    if (!selectedDate || !isWeekday(selectedDate)) return null
    const timeString = getTimeStringFromISO(scheduledTime)
    return scheduleActivities[timeString] || null
  }

  if (!selectedDate) return null

  return (
    <div className="max-w-96 rounded-md border p-4">
      <h2 className="font-semibold mb-4">
        {selectedDate.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })}
      </h2>

      {!isWeekday(selectedDate) ? (
        <p className="text-gray-500 text-sm">No schedule available for weekends</p>
      ) : (
        <div className="space-y-2">
          {timeBlocks.map(({ time: scheduledTime }) => {
            const activity = getActivityForBlock(scheduledTime)
            const isSelected = selectedBlock === scheduledTime
            
            // Skip blocks that are within a longer duration block
            if (isWithinDurationBlock(scheduledTime)) {
              return null
            }

            const isExpandable = activity?.duration && activity.duration > 30

            return (
              <div key={scheduledTime}>
                <div 
                  onClick={() => {
                    setSelectedBlock(isSelected ? null : scheduledTime)
                    if (isExpandable) {
                      setExpandedBlock(expandedBlock === scheduledTime ? null : scheduledTime)
                    }
                  }}
                  className={`p-3 border rounded-lg cursor-pointer
                    ${activity ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
                    ${isSelected ? 'ring-2 ring-blue-400' : ''}
                    ${isExpandable ? 'border-l-4 border-l-blue-400' : ''}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">
                      {formatTimeToAMPM(scheduledTime)}
                      {activity?.duration > 30 && (
                        ` - ${formatTimeToAMPM(addMinutes(scheduledTime, activity.duration))}`
                      )}
                    </span>
                    {isExpandable && (
                      <span className="text-xs text-blue-600">
                        {expandedBlock === scheduledTime ? '▼' : '▶'}
                      </span>
                    )}
                  </div>
                  {activity && (
                    <div className="mt-1">
                      <p className="text-sm font-medium text-blue-800">
                        {activity.activity}
                      </p>
                      {activity.duration && (
                        <p className="text-xs text-gray-600">
                          Duration: {activity.duration} minutes
                        </p>
                      )}
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
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TimeBlocksPanel 