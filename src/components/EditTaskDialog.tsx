import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { TaskType } from '@/types/task'

interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: TaskType
  onTaskUpdate: (taskId: string, updates: Partial<TaskType>) => void
}

export default function EditTaskDialog({
  open,
  onOpenChange,
  task,
  onTaskUpdate,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [project, setProject] = useState(task.project || '')
  const [time, setTime] = useState(task.time)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onTaskUpdate(task.id, {
      title,
      description,
      project: project || undefined,
      time,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
          <div>
            <Input
              type="datetime-local"
              value={time.slice(0, 16)} // Format datetime for input
              onChange={(e) => setTime(new Date(e.target.value).toISOString())}
            />
          </div>
          <div>
            <Input
              placeholder="Project (optional)"
              value={project}
              onChange={(e) => setProject(e.target.value)}
            />
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