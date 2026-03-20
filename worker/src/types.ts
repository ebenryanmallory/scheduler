export interface Env {
  DB: D1Database
  DOCS_BUCKET: R2Bucket
  ASSETS: Fetcher
  CLERK_SECRET_KEY: string
  CLERK_PUBLISHABLE_KEY: string
}

export interface Task {
  id: string
  user_id?: string
  title: string
  scheduledTime?: string
  completed: boolean
  description?: string
  project?: string
  order: number
  persistent: boolean
  status?: string
  priority?: string
  tags?: string[]
  estimatedDuration?: number
  timeTracking?: Record<string, unknown>
  recurrence?: Record<string, unknown>
}

export interface Idea {
  id: string
  user_id?: string
  title: string
  description?: string
  project?: string
  createdAt: string
  order: number
}

export interface Project {
  id: string
  user_id?: string
  title: string
  color: string
  order: number
}
