import type { TaskType } from "./task"

export interface ScheduleViewProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onTimeBlockSelect: (block: number | undefined) => void
}

export interface DialogState {
  isEditOpen: boolean
  taskToEdit: TaskType | null
  selectedTimeBlock: number
  selectedTime: string | undefined
}

export interface ActivitySlot {
  description: string
}

export interface Action {
  type: string
  message: string
  channels?: string[]
  service?: string
  action?: string
  mode?: string
}

export interface ScheduleActivity {
  activity: string
  duration?: number
  tag?: string
  slots?: ActivitySlot[]
  actions?: Action[]
}

export interface ScheduleActivities {
  [time: string]: ScheduleActivity
}