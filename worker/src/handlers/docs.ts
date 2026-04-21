import { json, error } from '../lib/response'
import * as r2 from '../lib/r2'
import type { Env } from '../types'

export async function handleDocs(request: Request, env: Env, userId: string, url: URL): Promise<Response> {
  const method = request.method
  const path = url.pathname

  // GET /api/docs/tree
  if (method === 'GET' && path === '/api/docs/tree') {
    const tree = await r2.listUserDocs(env.DOCS_BUCKET, userId)
    return json(tree)
  }

  // GET /api/docs/content?path=foo/bar.md
  if (method === 'GET' && path === '/api/docs/content') {
    const filePath = url.searchParams.get('path')
    if (!filePath) return error('File path is required', 400)

    const content = await r2.getDocContent(env.DOCS_BUCKET, userId, filePath)
    if (content === null) return error('File not found', 404)
    return json({ content })
  }

  // GET /api/docs/progress — returns empty since we no longer parse BMAD stories
  if (method === 'GET' && path === '/api/docs/progress') {
    return json({ epics: [], totalStories: 0, completedStories: 0 })
  }

  // POST /api/docs/upload — multipart form with one or more .md files
  if (method === 'POST' && path === '/api/docs/upload') {
    const formData = await request.formData()
    const uploaded: string[] = []

    for (const [fieldName, value] of formData.entries()) {
      if (typeof value === 'object' && 'text' in value) {
        const file = value as File
        if (!file.name.endsWith('.md')) continue

        // Use the field name as the relative path if it contains slashes, otherwise just the filename
        const relativePath = fieldName.includes('/') ? fieldName : file.name
        const content = await file.text()
        await r2.putDoc(env.DOCS_BUCKET, userId, relativePath, content)
        uploaded.push(relativePath)
      }
    }

    return json({ success: true, uploaded }, 201)
  }

  // DELETE /api/docs?path=foo/bar.md  (works for files and folders)
  if (method === 'DELETE') {
    const filePath = url.searchParams.get('path')
    if (!filePath) return error('File path is required', 400)

    const isFolder = !filePath.endsWith('.md')
    if (isFolder) {
      await r2.deleteFolderDocs(env.DOCS_BUCKET, userId, filePath)
    } else {
      await r2.deleteDoc(env.DOCS_BUCKET, userId, filePath)
    }
    return json({ success: true, message: isFolder ? 'Folder deleted' : 'Doc deleted' })
  }

  return error('Not found', 404)
}
