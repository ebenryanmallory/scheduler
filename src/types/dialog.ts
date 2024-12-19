import { TaskType } from './task'

export type ProjectName = 'Dynamic Momentum' | 'Motion Storyline'

export interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date | null
  selectedTimeBlock?: number
  selectedTime: string | null  // HH:mm format, will be converted to ISO in component
  onTaskCreate: (task: TaskType) => void
}

export interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: TaskType
  onTaskUpdate: (taskId: string, updates: Partial<TaskType>) => void
}