import { TaskType } from "./task"

export interface TaskListProps {
  tasks: TaskType[]
  onTaskUpdate: (task: TaskType) => void
  onEdit: (task: TaskType) => void
  onDelete: (id: string) => void
}

export interface ProjectGroup {
  name: string
  persistentTasks: TaskType[]
  regularTasks: TaskType[]
} 