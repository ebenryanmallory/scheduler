import { json } from '../lib/response'

const SYNCED_STATE = {
  status: 'synced',
  lastSyncTime: null as string | null,
  pendingChanges: 0,
  error: null,
  conflictFiles: [],
  isAutoSyncEnabled: false,
}

export async function handleSync(request: Request, url: URL): Promise<Response> {
  const path = url.pathname

  if (path === '/api/sync/status') {
    return json({ ...SYNCED_STATE, lastSyncTime: new Date().toISOString() })
  }

  if (path === '/api/sync/history') {
    return json([])
  }

  if (path === '/api/sync/now' && request.method === 'POST') {
    return json({ success: true, message: 'Data is saved in Cloudflare D1' })
  }

  if (path === '/api/sync/commit' && request.method === 'POST') {
    return json({ success: true })
  }

  if (path === '/api/sync/cancel' && request.method === 'POST') {
    return json({ success: true })
  }

  if (path === '/api/sync/events') {
    // SSE stream: send one synced event then keepalive
    const encoder = new TextEncoder()
    const syncedEvent = `data: ${JSON.stringify({ ...SYNCED_STATE, lastSyncTime: new Date().toISOString() })}\n\n`

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
    const writer = writable.getWriter()

    // Write initial event then close (CF Workers don't support long-running streams easily)
    writer.write(encoder.encode(syncedEvent)).then(() => writer.close())

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  return json({ error: 'Not found' }, 404)
}
