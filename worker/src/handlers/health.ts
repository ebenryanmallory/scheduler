export function handleHealth(request: Request): Response {
  if (request.method === 'HEAD') {
    return new Response(null, { status: 200 })
  }
  return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
