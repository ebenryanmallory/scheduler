import { getUserId } from './lib/auth'
import { cors, error } from './lib/response'
import { handleTasks } from './handlers/tasks'
import { handleIdeas } from './handlers/ideas'
import { handleProjects } from './handlers/projects'
import { handleDocs } from './handlers/docs'
import { handleSync } from './handlers/sync'
import { handleHealth } from './handlers/health'
import type { Env } from './types'

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ['/api/health', '/api/sync/events', '/api/sync/status']

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return cors()
    }

    // API routing
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url)
    }

    // Static assets (Vite build + SPA fallback)
    return env.ASSETS.fetch(request)
  },
}

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  try {
    // Public routes skip auth
    if (PUBLIC_ROUTES.some(p => url.pathname.startsWith(p))) {
      if (url.pathname.startsWith('/api/health')) return handleHealth(request)
      if (url.pathname.startsWith('/api/sync')) return handleSync(request, url)
    }

    // Resolve userId for protected routes
    let userId: string | null = null

    if (url.pathname.startsWith('/api/sync')) {
      return handleSync(request, url)
    }

    userId = await getUserId(request, env)
    if (!userId) {
      return error('Unauthorized', 401)
    }

    if (url.pathname.startsWith('/api/tasks')) {
      return handleTasks(request, env, userId, url)
    }

    if (url.pathname.startsWith('/api/ideas')) {
      return handleIdeas(request, env, userId, url)
    }

    if (url.pathname.startsWith('/api/projects')) {
      return handleProjects(request, env, userId, url)
    }

    if (url.pathname.startsWith('/api/docs')) {
      return handleDocs(request, env, userId, url)
    }

    return error('Not found', 404)
  } catch (err) {
    console.error('Worker error:', err)
    return error(err instanceof Error ? err.message : 'Internal server error', 500)
  }
}
