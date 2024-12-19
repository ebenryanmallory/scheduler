import { TaskType } from './task'

export interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date | null
  selectedTimeBlock: number
  onTaskCreate: (task: TaskType) => void
  selectedTime: string
}

export type ProjectName = 'Dynamic Momentum' | 'Motion Storyline' 