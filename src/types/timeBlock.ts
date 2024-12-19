import { TaskType } from './task'

export interface TimeBlock {
  time: string
}

export interface ActivitySlot {
  description: string
}

export interface ParentActivity {
  tag: string
  slots: ActivitySlot[]
}

export interface NestedTimeBlocksProps {
  startTime: string
  duration: number
  onAddTask: (blockIndex: number, time: string) => void
  timeBlocks: TimeBlock[]
  parentActivity?: ParentActivity
  tasks: TaskType[]
} 