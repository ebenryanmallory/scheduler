import { TaskType } from "@/types/task"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Checkbox } from "./ui/checkbox"
import { Pencil, Trash2 } from "lucide-react"
import { useProjectStore } from '@/store/projectStore'

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
  onTaskUpdate,
  onEdit,
  onDelete 
}: TaskProps) {
  const { getProjectColor } = useProjectStore()

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={completed}
            onCheckedChange={(checked) => 
              onTaskUpdate?.({ 
                id, 
                title, 
                description, 
                project,
                date,
                completed: checked as boolean,
                scheduledTime,
                persistent,
                timeBlock,
                time
              })
            }
          />
          <span className={`font-medium text-sm truncate ${completed ? 'line-through text-muted-foreground' : ''}`}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onEdit?.({ 
              id, 
              title, 
              description, 
              project,
              date,
              completed,
              scheduledTime,
              persistent,
              timeBlock,
              time
            })}
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