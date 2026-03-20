import { json, error } from '../lib/response'
import * as db from '../lib/d1'
import type { Env, Task } from '../types'

export async function handleTasks(request: Request, env: Env, userId: string, url: URL): Promise<Response> {
  const method = request.method
  const idMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/)
  const taskId = idMatch?.[1]

  if (method === 'GET' && !taskId) {
    const dateStr = url.searchParams.get('date') ?? new Date().toISOString()
    const tasks = await db.getTasksByDate(env.DB, userId, dateStr)
    return json(tasks)
  }

  if (method === 'POST' && !taskId) {
    const task = (await request.json()) as Task
    await db.createTask(env.DB, userId, task)
    return json({ success: true, message: 'Task created', task }, 201)
  }

  if (method === 'PUT' && taskId) {
    const updates = (await request.json()) as Partial<Task>
    await db.updateTask(env.DB, userId, taskId, updates)
    return json({ success: true, message: 'Task updated', task: updates })
  }

  if (method === 'DELETE' && taskId) {
    await db.deleteTask(env.DB, userId, taskId)
    return json({ success: true, message: 'Task deleted', taskId })
  }

  return error('Not found', 404)
}
