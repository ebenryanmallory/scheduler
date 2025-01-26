import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { useProjectStore, type ProjectName } from '@/store/projectStore'
import { IdeaType } from "@/types/idea"

interface CreateIdeaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onIdeaCreate: (idea: Omit<IdeaType, 'id' | 'createdAt'>) => void
}

export function CreateIdeaDialog({
  open,
  onOpenChange,
  onIdeaCreate,
}: CreateIdeaDialogProps) {
  const { getDisplayProjects } = useProjectStore()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [project, setProject] = useState<ProjectName | "">("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onIdeaCreate({
      title,
      description: description || undefined,
      project: project || undefined,
    })

    setTitle("")
    setDescription("")
    setProject("")
    onOpenChange(false)
  }

  const availableProjects = getDisplayProjects()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Idea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Idea title"
              required
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
            <Button type="submit">Create Idea</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateIdeaDialog 