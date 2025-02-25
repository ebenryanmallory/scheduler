import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, X } from "lucide-react"
import { IdeaType } from "@/types/idea"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { useProjectStore } from '@/store/projectStore'

interface SortableIdeaProps extends IdeaType {
  onUpdate?: (idea: IdeaType) => void
  onDelete?: (id: string) => void
}

export function SortableIdea({ id, title, description, project, createdAt, onUpdate, onDelete }: SortableIdeaProps) {
  const { getProjectColor } = useProjectStore()
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate({ id, title, description, project, createdAt })
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleUpdate}
            className="text-left hover:text-primary transition-colors"
          >
            <h4 className="font-medium text-sm truncate">{title}</h4>
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete?.(id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground truncate max-w-[250px] overflow-hidden text-ellipsis">{description}</p>
        )}
        {project && (
          <div className="flex gap-2 mt-1">
            <Badge 
              variant="secondary"
              className={getProjectColor(project.toString())}
            >
              {project.toString()}
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
} 