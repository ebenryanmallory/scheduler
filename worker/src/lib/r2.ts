export interface DocFile {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: DocFile[]
}

/** List all docs for a user and return as a nested file tree */
export async function listUserDocs(bucket: R2Bucket, userId: string): Promise<DocFile[]> {
  const prefix = `${userId}/`
  const listed = await bucket.list({ prefix })

  const paths = listed.objects.map(obj => obj.key.slice(prefix.length))
  return buildTree(paths)
}

function buildTree(paths: string[]): DocFile[] {
  const root: DocFile[] = []
  const dirMap = new Map<string, DocFile>()

  for (const filePath of paths) {
    const parts = filePath.split('/')
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const currentPath = parts.slice(0, i + 1).join('/')
      const isFile = i === parts.length - 1

      if (isFile) {
        current.push({ name: part, path: currentPath, type: 'file' })
      } else {
        let dir = dirMap.get(currentPath)
        if (!dir) {
          dir = { name: part, path: currentPath, type: 'directory', children: [] }
          dirMap.set(currentPath, dir)
          current.push(dir)
        }
        current = dir.children!
      }
    }
  }

  return root
}

/** Get the raw content of a single doc file */
export async function getDocContent(bucket: R2Bucket, userId: string, filePath: string): Promise<string | null> {
  const key = `${userId}/${filePath}`
  const obj = await bucket.get(key)
  if (!obj) return null
  return obj.text()
}

/** Store a doc file */
export async function putDoc(bucket: R2Bucket, userId: string, filePath: string, content: string): Promise<void> {
  const key = `${userId}/${filePath}`
  await bucket.put(key, content, {
    httpMetadata: { contentType: 'text/markdown; charset=utf-8' },
  })
}

/** Delete a doc file */
export async function deleteDoc(bucket: R2Bucket, userId: string, filePath: string): Promise<void> {
  const key = `${userId}/${filePath}`
  await bucket.delete(key)
}
