import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Checkbox } from "@/components/ui/checkbox"
import { EditTaskDialogProps } from '@/types/editTaskDialog'

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
  onTaskUpdate,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [project, setProject] = useState(task.project || '')
  const [scheduledTime, setScheduledTime] = useState(task.scheduledTime)
  const [persistent, setPersistent] = useState(task.persistent || false)

  // Reset state when dialog closes or task changes
  useEffect(() => {
    if (open) {
      setTitle(task.title)
      setDescription(task.description)
      setProject(task.project || '')
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
      project: project || undefined,
      scheduledTime,
      persistent,
      completed: task.completed
    }
    onTaskUpdate(updatedTask)
    onOpenChange(false)
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
              value={scheduledTime.slice(0, 16)} // Format datetime for input
              onChange={(e) => setScheduledTime(new Date(e.target.value).toISOString())}
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