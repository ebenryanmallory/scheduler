export interface TaskType {
  id: string
  title: string
  scheduledTime: string  // ISO string for the task's scheduled time
  completed: boolean
  description: string
  project?: string
  order?: number
  persistent?: boolean
} 