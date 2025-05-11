import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2, Palette } from "lucide-react"
import { Project } from "@/types/project"
import { useProjectStore } from "@/store/projectStore"
import { useState } from "react"
import { Input } from "./ui/input"

const COLOR_OPTIONS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Blue' },
  { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Purple' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Emerald' },
  { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Rose' },
  { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Amber' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Cyan' },
]

interface SortableProjectProps extends Project {}

export function SortableProject({ id, title, color }: SortableProjectProps) {
  const { deleteProject, editProject } = useProjectStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(title)
  const [showColorPicker, setShowColorPicker] = useState(false)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    editProject({ id, title: editedTitle, color, order: 0 })
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditedTitle(title)
    }
  }

  const handleColorSelect = (newColor: string) => {
    editProject({ id, title, color: newColor, order: 0 })
    setShowColorPicker(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between p-2 rounded-md ${color} hover:bg-opacity-90 transition-all relative`}
    >
      {isEditing ? (
        <Input
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 mr-2"
          autoFocus
        />
      ) : (
        <span className="text-sm font-medium">{title}</span>
      )}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="p-1 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Palette className="h-4 w-4" />
          </button>
          <button
            onClick={() => deleteProject(id)}
            className="p-1 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <button
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      {showColorPicker && (
        <div className="absolute right-0 top-full mt-1 p-2 bg-white rounded-md shadow-lg border z-10">
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((colorOption) => {
              const colorClass = `${colorOption.bg} ${colorOption.text}`
              return (
                <button
                  key={colorOption.label}
                  type="button"
                  onClick={() => handleColorSelect(colorClass)}
                  className={`w-8 h-8 rounded-md border-2 transition-all ${
                    color === colorClass
                      ? 'border-gray-900 scale-105'
                      : 'border-transparent hover:border-gray-300'
                  } ${colorOption.bg}`}
                  title={colorOption.label}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
} 