import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Task } from "./Task"
import { TaskType } from "@/types/task"
import { GripVertical } from "lucide-react"

interface SortableTaskProps extends TaskType {
  onTaskUpdate?: (taskId: string, updates: Partial<TaskType>) => void
  onEdit?: (task: TaskType) => void
  onDelete?: (id: string) => void
}

export function SortableTask(props: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleTaskUpdate = props.onTaskUpdate 
    ? (task: TaskType) => props.onTaskUpdate!(task.id, task)
    : undefined

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex-1">
        <Task {...props} onTaskUpdate={handleTaskUpdate} />
      </div>
    </div>
  )
} 