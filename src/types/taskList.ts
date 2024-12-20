import { TaskType } from "./task"

export interface TaskListProps {
  tasks: TaskType[]
  onTasksReorder: (tasks: TaskType[]) => void
  onUpdate?: (task: TaskType) => void
  onEdit?: (task: TaskType) => void
  onDelete?: (id: string) => void
}

export interface ProjectGroup {
  name: string
  persistentTasks: TaskType[]
  regularTasks: TaskType[]
} 