import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { useProjectStore } from "@/store/projectStore"
import type { Project } from "@/types/project"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const COLOR_OPTIONS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Blue' },
  { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Purple' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Emerald' },
  { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Rose' },
  { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Amber' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Cyan' },
]

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const { projects, createProject } = useProjectStore()
  const [title, setTitle] = useState("")
  const [selectedColor, setSelectedColor] = useState(() => {
    // Randomly select a default color when component mounts
    const randomIndex = Math.floor(Math.random() * COLOR_OPTIONS.length)
    const color = COLOR_OPTIONS[randomIndex]
    return `${color.bg} ${color.text}`
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle("")
      // Randomly select a new color when dialog opens
      const randomIndex = Math.floor(Math.random() * COLOR_OPTIONS.length)
      const color = COLOR_OPTIONS[randomIndex]
      setSelectedColor(`${color.bg} ${color.text}`)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newProject: Partial<Project> = {
      title,
      color: selectedColor,
      order: projects.length, // Add to end of list
    }

    // Generate an ID based on the title
    const id = title.toLowerCase().replace(/\s+/g, '-')
    await createProject(id, newProject)

    setTitle("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Project title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Project Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((color) => {
                const colorClass = `${color.bg} ${color.text}`
                return (
                  <button
                    key={color.label}
                    type="button"
                    onClick={() => setSelectedColor(colorClass)}
                    className={`w-8 h-8 rounded-md border-2 transition-all ${
                      selectedColor === colorClass
                        ? 'border-gray-900 scale-105'
                        : 'border-transparent hover:border-gray-300'
                    } ${color.bg}`}
                    title={color.label}
                  />
                )
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateProjectDialog