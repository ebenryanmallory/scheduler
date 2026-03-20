import { TaskType } from "@/types/task"
import { withRetry } from "@/services/retryService"
import { authFetch } from "@/services/authFetch"

const API_URL = '/api'

export const taskService = {
  async fetchTasks(date: Date): Promise<TaskType[]> {
    const response = await withRetry(() =>
      authFetch(`${API_URL}/tasks?date=${date.toISOString()}`).then(res => {
        if (!res.ok) {
          const error = new Error(`HTTP ${res.status}`) as Error & { status: number }
          error.status = res.status
          throw error
        }
        return res
      })
    )
    return response.json()
  },

  async createTask(task: TaskType, date: Date): Promise<TaskType> {
    const response = await authFetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, date: date.toISOString() }),
    })
    if (!response.ok) {
      const error = new Error('Failed to create task') as Error & { status: number }
      error.status = response.status
      throw error
    }
    return response.json()
  },

  async updateTask(task: TaskType): Promise<void> {
    const response = await authFetch(`${API_URL}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    })
    if (!response.ok) {
      const error = new Error('Failed to update task') as Error & { status: number }
      error.status = response.status
      throw error
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    const response = await authFetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = new Error('Failed to delete task') as Error & { status: number }
      error.status = response.status
      throw error
    }
  },

  async reorderTasks(tasks: TaskType[]): Promise<void> {
    const tasksWithOrder = tasks.map((task, index) => ({ ...task, order: index }))
    await Promise.all(
      tasksWithOrder.map(task =>
        withRetry(async () => {
          const response = await authFetch(`${API_URL}/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: task.order }),
          })
          if (!response.ok) {
            const error = new Error('Failed to reorder task') as Error & { status: number }
            error.status = response.status
            throw error
          }
        }, { maxAttempts: 2 })
      )
    )
  },
}
