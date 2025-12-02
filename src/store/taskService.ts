import { TaskType } from "@/types/task"
import { fetchWithRetry, withRetry } from "@/services/retryService"

const API_URL = 'http://localhost:3001/api'

export const taskService = {
  /**
   * Fetch tasks with automatic retry (AC3, AC8)
   */
  async fetchTasks(date: Date): Promise<TaskType[]> {
    const response = await fetchWithRetry(
      `${API_URL}/tasks?date=${date.toISOString()}`
    )
    return response.json()
  },

  /**
   * Create task - single attempt (mutations shouldn't auto-retry to avoid duplicates)
   */
  async createTask(task: TaskType, date: Date): Promise<TaskType> {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...task,
        date: date.toISOString(),
      }),
    })

    if (!response.ok) {
      const error = new Error('Failed to create task') as Error & { status: number }
      error.status = response.status
      throw error
    }
    return response.json()
  },

  /**
   * Update task - single attempt (mutations shouldn't auto-retry)
   */
  async updateTask(task: TaskType): Promise<void> {
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      const error = new Error(`Failed to update task`) as Error & { status: number }
      error.status = response.status
      throw error
    }
  },

  /**
   * Delete task - single attempt (mutations shouldn't auto-retry)
   */
  async deleteTask(taskId: string): Promise<void> {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = new Error('Failed to delete task') as Error & { status: number }
      error.status = response.status
      throw error
    }
  },

  /**
   * Reorder tasks with retry for individual updates
   */
  async reorderTasks(tasks: TaskType[]): Promise<void> {
    const tasksWithOrder = tasks.map((task, index) => ({
      ...task,
      order: index
    }))

    await Promise.all(tasksWithOrder.map(task => 
      withRetry(async () => {
        const response = await fetch(`${API_URL}/tasks/${task.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ order: task.order }),
        })
        if (!response.ok) {
          const error = new Error('Failed to reorder task') as Error & { status: number }
          error.status = response.status
          throw error
        }
      }, { maxAttempts: 2 })
    ))
  }
} 