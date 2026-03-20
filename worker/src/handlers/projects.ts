import { json, error } from '../lib/response'
import * as db from '../lib/d1'
import type { Env, Project } from '../types'

export async function handleProjects(request: Request, env: Env, userId: string, url: URL): Promise<Response> {
  const method = request.method
  const idMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/)
  const projectId = idMatch?.[1]
  const isReorder = url.pathname === '/api/projects/reorder'

  if (method === 'GET' && !projectId) {
    const projects = await db.getAllProjects(env.DB, userId)
    return json(projects)
  }

  if (method === 'POST' && isReorder) {
    const newOrder = (await request.json()) as Array<{ id: string; order: number }>
    const stmts = newOrder.map(p =>
      env.DB.prepare('UPDATE projects SET "order" = ? WHERE user_id = ? AND id = ?').bind(p.order, userId, p.id)
    )
    await env.DB.batch(stmts)
    return json(newOrder)
  }

  if (method === 'POST' && projectId) {
    const project = (await request.json()) as Project
    project.id = projectId
    await db.createProject(env.DB, userId, project)
    return json(project)
  }

  if (method === 'PATCH' && projectId) {
    const updates = (await request.json()) as Partial<Project>
    await db.updateProject(env.DB, userId, projectId, updates)
    const projects = await db.getAllProjects(env.DB, userId)
    const updated = projects.find(p => p.id === projectId)
    if (!updated) return error('Project not found', 404)
    return json(updated)
  }

  if (method === 'DELETE' && projectId) {
    await db.deleteProject(env.DB, userId, projectId)
    return new Response(null, { status: 204 })
  }

  return error('Not found', 404)
}
