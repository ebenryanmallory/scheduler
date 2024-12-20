export interface TaskType {
  id: string
  title: string
  scheduledTime: string
  completed: boolean
  description: string
  project?: string
  order?: number
  persistent?: boolean
} 