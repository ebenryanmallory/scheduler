import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { useProjectStore } from '@/store/projectStore'
import type { ProjectName } from "@/store/projectStore"
import { IdeaType } from "@/types/idea"

interface EditIdeaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  idea: IdeaType
  onIdeaUpdate: (idea: IdeaType) => void
}

export function EditIdeaDialog({
  open,
  onOpenChange,
  idea,
  onIdeaUpdate,
}: EditIdeaDialogProps) {
  const { getDisplayProjects } = useProjectStore()
  const [title, setTitle] = useState(idea.title)
  const [description, setDescription] = useState(idea.description || '')
  const [project, setProject] = useState<ProjectName | "">(idea.project || '')

  useEffect(() => {
    setTitle(idea.title)
    setDescription(idea.description || '')
    setProject(idea.project || '')
  }, [idea])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedIdea: IdeaType = {
      ...idea,
      title,
      description: description || undefined,
      project: project || undefined,
    }
    onIdeaUpdate(updatedIdea)
    onOpenChange(false)
  }

  const availableProjects = getDisplayProjects()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Idea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Idea title"
            />
          </div>
          <div>
            <Select value={project} onValueChange={(value) => setProject(value as ProjectName)}>
              <SelectTrigger>
                <SelectValue placeholder="Select project (optional)" />
              </SelectTrigger>
              <SelectContent>
                {availableProjects.map((project) => (
                  <SelectItem key={project.id} value={project.title}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
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
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}