import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Task } from "./Task"
import { TaskType } from "@/types/task"
import { GripVertical } from "lucide-react"

interface SortableTaskProps extends TaskType {
  onUpdate?: (task: TaskType) => void
  onDelete?: (id: string) => void
}

export function SortableTask(props: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="flex items-center gap-2"
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-move p-2"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      <div className="flex-1">
        <Task {...props} />
      </div>
    </div>
  )
} 