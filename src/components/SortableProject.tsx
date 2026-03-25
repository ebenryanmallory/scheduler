import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2, Palette, MoreHorizontal } from "lucide-react"
import { Project } from "@/types/project"
import { useProjectStore } from "@/store/projectStore"
import { useState } from "react"
import { Input } from "./ui/input"

const COLOR_OPTIONS = [
  { bg: 'bg-pink-100', text: 'text-gray-700', label: 'Pastel Pink' },
  { bg: 'bg-blue-100', text: 'text-slate-600', label: 'Pastel Blue' },
  { bg: 'bg-purple-100', text: 'text-slate-600', label: 'Pastel Purple' },
  { bg: 'bg-orange-100', text: 'text-blue-700', label: 'Pastel Orange' },
  { bg: 'bg-teal-100', text: 'text-pink-800', label: 'Pastel Teal' },
  { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Gray' },
]

interface SortableProjectProps extends Project {}

export function SortableProject({ id, title, color }: SortableProjectProps) {
  const { deleteProject, editProject } = useProjectStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(title)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [showActions, setShowActions] = useState(false)
  
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
      className={`group flex items-center justify-between p-2 rounded-md ${color} hover:bg-opacity-90 transition-all relative text-gray-700`}
    >
      {isEditing ? (
        <Input
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 mr-2 text-gray-900"
          autoFocus
        />
      ) : (
        <span className="text-sm font-medium text-gray-700">{title}</span>
      )}
      <div className="flex items-center gap-2 text-gray-600">
        <div className={`flex items-center gap-1 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button
            onClick={handleEdit}
            className="p-1 hover:bg-gray-200/70 rounded-md transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1 hover:bg-gray-200/70 rounded-md transition-colors"
          >
            <Palette className="h-4 w-4" />
          </button>
          {confirmingDelete ? (
            <>
              <span className="text-xs text-gray-600 mr-1">Delete?</span>
              <button
                onClick={() => { deleteProject(id); setConfirmingDelete(false) }}
                className="px-2 py-0.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => { setConfirmingDelete(false); setShowActions(false) }}
                className="px-2 py-0.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
              >
                No
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="p-1 hover:bg-gray-200/70 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Mobile toggle — hidden on desktop via md:hidden */}
        <button
          onClick={() => { setShowActions(v => !v); setConfirmingDelete(false); setShowColorPicker(false) }}
          className="md:hidden p-1 hover:bg-gray-200/70 rounded-md transition-colors"
          aria-label={showActions ? 'Hide actions' : 'Show actions'}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <button
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      {showColorPicker && (
        <div className="absolute right-0 top-full mt-1 p-2 bg-white rounded-md shadow-lg border border-gray-200 z-10">
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
                      ? 'border-gray-800 scale-105'
                      : 'border-transparent hover:border-gray-400'
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