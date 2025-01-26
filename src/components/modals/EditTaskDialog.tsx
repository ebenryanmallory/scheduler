import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Checkbox } from "@/components/ui/checkbox"
import { EditTaskDialogProps } from '@/types/editTaskDialog'
import { ProjectName, useProjectStore } from '@/store/projectStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
  onTaskUpdate,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [project, setProject] = useState<ProjectName | undefined>(task.project)
  const [scheduledTime, setScheduledTime] = useState(task.scheduledTime)
  const [persistent, setPersistent] = useState(task.persistent || false)
  
  const { getDisplayProjects } = useProjectStore()
  const projects = getDisplayProjects();
  // Reset state when dialog closes or task changes
  useEffect(() => {
    if (open) {
      setTitle(task.title)
      setDescription(task.description)
      setProject(task.project)
      setScheduledTime(task.scheduledTime)
      setPersistent(task.persistent || false)
    }
  }, [open, task])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedTask = {
      id: task.id,
      title,
      description,
      project,
      scheduledTime,
      persistent,
      completed: task.completed,
      date: task.date
    }
    onTaskUpdate(updatedTask)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          {!persistent && (
            <div>
              <Input
                type="datetime-local"
                value={scheduledTime?.slice(0, 16) || ''}
                onChange={(e) => setScheduledTime(new Date(e.target.value).toISOString())}
              />
            </div>
          )}
          <div>
            <Select 
              value={project || "no-project"} 
              onValueChange={(value) => setProject(value === "no-project" ? undefined : value as ProjectName)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-project">No Project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.title}>
                    {p.title}
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
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="persistent-edit"
              checked={persistent}
              onCheckedChange={(checked: boolean) => setPersistent(checked)}
            />
            <label 
              htmlFor="persistent-edit" 
              className="text-sm text-gray-700 cursor-pointer"
            >
              Make task persistent (shows on all days until completed)
            </label>
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