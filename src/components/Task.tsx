import { formatTimeToAMPM, addMinutes } from '../utils/timeUtils'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { TaskType } from '../types/task'

interface TaskProps extends TaskType {
  onUpdate?: (task: TaskType) => void
  onDelete?: (id: string) => void
}

export function Task({ id, title, time, project, date, completed, description, order, onUpdate, onDelete }: TaskProps) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
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
      time, 
      project, 
      date, 
      completed, 
      description,
      order: order || 0 
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              {formatDate(time)}
              <span className="mx-1">•</span>
              {formatTimeToAMPM(time)}
              <span className="text-gray-400 ml-1">
                - {formatTimeToAMPM(addMinutes(new Date(time).toISOString(), 30))}
              </span>
            </span>
            {project && (
              <Badge 
                variant="secondary" 
                className={`text-xs px-2 py-0.5 ${getProjectColor(project)}`}
              >
                {project}
              </Badge>
            )}
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
                <Pencil className="h-4 w-4 text-gray-500 hover:text-blue-600" />
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
                <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 