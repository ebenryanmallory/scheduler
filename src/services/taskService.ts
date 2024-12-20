import { TaskType } from "@/types/task"

const API_URL = 'http://localhost:3001/api'

export const taskService = {
  async fetchTasks(date: Date): Promise<TaskType[]> {
    const response = await fetch(
      `${API_URL}/tasks?date=${date.toISOString()}`
    )
    if (!response.ok) {
      throw new Error('Failed to fetch tasks')
    }
    return response.json()
  },

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
      throw new Error('Failed to create task')
    }
    return response.json()
  },

  async updateTask(task: TaskType): Promise<TaskType> {
    const response = await fetch(`${API_URL}/tasks/${task.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Server error response:', errorText)
      throw new Error('Failed to update task')
    }

    return response.json()
  },

  async deleteTask(taskId: string): Promise<void> {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete task')
    }
  },

  async reorderTasks(tasks: TaskType[]): Promise<void> {
    const tasksWithOrder = tasks.map((task, index) => ({
      ...task,
      order: index
    }))

    await Promise.all(tasksWithOrder.map(task => 
      fetch(`${API_URL}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: task.order }),
      })
    ))
  }
} 