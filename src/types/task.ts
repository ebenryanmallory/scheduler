export interface TaskType {
  id: string
  title: string
  time: string
  date: string
  completed: boolean
  description: string
  project?: string
  order?: number
} 