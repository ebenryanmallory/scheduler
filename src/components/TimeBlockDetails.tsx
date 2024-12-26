import { formatTimeToAMPM, addMinutes } from '../utils/timeUtils'
import { ScheduleActivity } from '../types/schedule'

interface TimeBlockDetailsProps {
  time: string
  activity: ScheduleActivity
}

export function TimeBlockDetails({ time, activity }: TimeBlockDetailsProps) {
  return (
    <div className="mt-2 p-3 bg-white border rounded-lg">
      <div className="text-xs text-gray-600">
        <span>{formatTimeToAMPM(time)}</span>
        <span className="text-gray-400 ml-2">
          - {formatTimeToAMPM(addMinutes(time, activity.duration || 30))}
        </span>
      </div>
      
      <h3 className="font-medium mt-1">{activity.activity}</h3>
      
      {activity.duration && (
        <p className="text-sm text-gray-600 mt-1">
          Duration: {activity.duration} minutes
        </p>
      )}
      
      {activity.description && (
        <p className="text-sm mt-2">{activity.description}</p>
      )}

      {activity.slots && activity.slots.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Time Slots:</h4>
          <ul className="space-y-1">
            {activity.slots.map((slot, index) => (
              <li key={index} className="text-sm text-gray-600">
                {slot.description || `Slot ${index + 1}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activity.actions && activity.actions.length > 0 && (
        <div className="mt-3">
          <ul className="space-y-1">
            {activity.actions.map((action, index) => (
              <li key={index} className="text-sm text-gray-400 italic">
                {action.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 