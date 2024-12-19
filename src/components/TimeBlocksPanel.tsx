import { useState } from 'react'
import { TimeBlock, ScheduleActivity } from '../types/schedule'
import { scheduleActivities } from '../data/scheduleActivities'
import { TimeBlockDetails } from './TimeBlockDetails'
import { NestedTimeBlocks } from './NestedTimeBlocks'
import { 
  formatTimeToAMPM, 
  addMinutes, 
  isWeekday, 
  generateTimeBlocks 
} from '../utils/timeUtils'

interface TimeBlocksPanelProps {
  selectedDate: Date | null
  onAddTask: (blockIndex: number) => void
}

function TimeBlocksPanel({ selectedDate, onAddTask }: TimeBlocksPanelProps) {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null)

  const timeBlocks = generateTimeBlocks()

  // Helper to check if a time falls within a duration block
  const isWithinDurationBlock = (time: string): boolean => {
    for (const [blockTime, activity] of Object.entries(scheduleActivities)) {
      if (activity.duration) {
        const blockEnd = addMinutes(blockTime, activity.duration)
        if (time > blockTime && time < blockEnd) {
          return true
        }
      }
    }
    return false
  }

  // Get activity for a specific time block
  const getActivityForBlock = (time: string): ScheduleActivity | null => {
    if (!selectedDate || !isWeekday(selectedDate)) return null
    return scheduleActivities[time] || null
  }

  if (!selectedDate) return null

  return (
    <div className="w-96 border-l border-gray-200 p-4 overflow-y-auto max-h-screen">
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
          {timeBlocks.map((block, index) => {
            const activity = getActivityForBlock(block.time)
            const isSelected = selectedBlock === block.time
            
            // Skip blocks that are within a longer duration block
            if (isWithinDurationBlock(block.time)) {
              return null
            }

            const isExpandable = activity?.duration && activity.duration > 30

            return (
              <div key={block.time}>
                <div 
                  onClick={() => {
                    setSelectedBlock(isSelected ? null : block.time)
                    if (isExpandable) {
                      setExpandedBlock(expandedBlock === block.time ? null : block.time)
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
                      {formatTimeToAMPM(block.time)}
                      {activity?.duration > 30 && 
                        ` - ${formatTimeToAMPM(addMinutes(block.time, activity.duration))}`
                      }
                    </span>
                    {isExpandable && (
                      <span className="text-xs text-blue-600">
                        {expandedBlock === block.time ? '▼' : '▶'}
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

                {/* Show nested blocks for expanded long-duration activities */}
                {expandedBlock === block.time && isExpandable && activity && (
                  <NestedTimeBlocks
                    startTime={block.time}
                    duration={activity.duration}
                    onAddTask={onAddTask}
                    timeBlocks={timeBlocks}
                  />
                )}

                {/* Show details panel for selected block */}
                {isSelected && activity && (
                  <TimeBlockDetails
                    time={block.time}
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