import { TaskType } from './task'
import { ScheduleActivity } from './schedule'

export interface TimeBlock {
  time: string
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

export interface ParentActivity {
  tag?: string
  slots?: ActivitySlot[]
  actions?: Action[]
}

export interface NestedTimeBlocksProps {
  startTime: string
  duration: number
  onAddTask: (blockIndex: number, time: string) => void
  onUpdateTask?: (id: string, updates: Partial<TaskType>) => Promise<void>
  timeBlocks: TimeBlock[]
  parentActivity?: ScheduleActivity
  tasks: TaskType[]
}