import { TaskType } from './task'

export interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: TaskType
  onTaskUpdate: (taskId: string, updates: Partial<TaskType>) => void
  onSubmit: (updatedTask: TaskType) => void
} 