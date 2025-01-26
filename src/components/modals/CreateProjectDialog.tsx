import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { useProjectStore } from "@/store/projectStore"
import type { Project } from "@/types/project"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const { projects, updateProject } = useProjectStore()
  const [title, setTitle] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newProject: Partial<Project> = {
      title,
      color: 'bg-gray-100 text-gray-800', // Default color
      order: projects.length, // Add to end of list
    }

    // Generate an ID based on the title
    const id = title.toLowerCase().replace(/\s+/g, '-')
    await updateProject(id, newProject)

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