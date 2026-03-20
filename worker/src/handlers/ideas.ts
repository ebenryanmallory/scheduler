import { json, error } from '../lib/response'
import * as db from '../lib/d1'
import type { Env, Idea } from '../types'

export async function handleIdeas(request: Request, env: Env, userId: string, url: URL): Promise<Response> {
  const method = request.method
  const idMatch = url.pathname.match(/^\/api\/ideas\/([^/]+)$/)
  const ideaId = idMatch?.[1]
  const isReorder = url.pathname === '/api/ideas/reorder'

  if (method === 'GET' && !ideaId) {
    const ideas = await db.getAllIdeas(env.DB, userId)
    return json(ideas)
  }

  if (method === 'POST' && !ideaId) {
    const idea = (await request.json()) as Idea
    if (!idea.createdAt) idea.createdAt = new Date().toISOString()
    await db.createIdea(env.DB, userId, idea)
    return json({ success: true, message: 'Idea created', idea }, 201)
  }

  if (method === 'PUT' && isReorder) {
    const ideas = (await request.json()) as Idea[]
    await db.reorderIdeas(env.DB, userId, ideas)
    return json({ success: true, message: 'Ideas reordered' })
  }

  if (method === 'PUT' && ideaId) {
    const updates = (await request.json()) as Partial<Idea>
    await db.updateIdea(env.DB, userId, ideaId, updates)
    return json({ success: true, message: 'Idea updated' })
  }

  if (method === 'DELETE' && ideaId) {
    await db.deleteIdea(env.DB, userId, ideaId)
    return json({ success: true, message: 'Idea deleted', ideaId })
  }

  return error('Not found', 404)
}
