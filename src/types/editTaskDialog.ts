import { TaskType } from './task'

export interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: TaskType
  onTaskUpdate: (task: TaskType) => void
} 