export interface TimeBlock {
  time: string
  activity?: string
  duration?: number
  actions?: ScheduleAction[]
}

export interface ScheduleAction {
  type: string
  message: string
  channels?: string[]
  service?: string
  action?: string
  mode?: string
}

export interface ActivitySlot {
  description: string
}

export interface ScheduleActivity {
  activity: string
  duration?: number
  actions?: ScheduleAction[]
  tag?: string
  slots?: ActivitySlot[]
  description?: string
}

export type ScheduleActivities = Record<string, ScheduleActivity> 