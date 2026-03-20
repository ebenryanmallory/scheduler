/**
 * One-time migration script: reads existing markdown files from src/docs/
 * and generates a seed.sql file for Cloudflare D1.
 *
 * Usage:
 *   tsx scripts/migrate-to-d1.ts [USER_ID]
 *
 * If USER_ID is provided, rows will be inserted with that user_id.
 * Otherwise a placeholder 'REPLACE_WITH_CLERK_USER_ID' is used.
 *
 * After running:
 *   wrangler d1 execute scheduler-db --file=seed.sql --remote
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DOCS_DIR = path.join(ROOT, 'src', 'docs')

const USER_ID = process.argv[2] ?? 'REPLACE_WITH_CLERK_USER_ID'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeSql(val: string | null | undefined): string {
  if (val == null) return 'NULL'
  return `'${String(val).replace(/'/g, "''")}'`
}

function parseFrontmatter(content: string): Record<string, string> & { _body: string } {
  const normalized = content.replace(/\r\n/g, '\n').trim()
  const match = normalized.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)?$/)
  if (!match) return { _body: normalized }

  const [, fm, body = ''] = match
  const meta: Record<string, string> = {}

  fm.split('\n')
    .filter(l => l.trim())
    .forEach(line => {
      const colonIdx = line.indexOf(':')
      if (colonIdx < 0) return
      const key = line.slice(0, colonIdx).trim()
      const val = line.slice(colonIdx + 1).trim()
      meta[key] = val
    })

  return { ...meta, _body: body.trim() }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

function migrateTask(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const meta = parseFrontmatter(content)

    const id = meta.id
    if (!id) return null

    const title = meta.title ?? 'Untitled'
    const scheduledTime = meta.scheduledTime ?? null
    const completed = meta.completed === 'true' ? 1 : 0
    const description = meta._body ?? ''
    const project = meta.project ?? ''
    const order = parseInt(meta.order ?? '0', 10) || 0
    const persistent = meta.persistent === 'true' ? 1 : 0

    return `INSERT OR IGNORE INTO tasks (id, user_id, title, scheduledTime, completed, description, project, "order", persistent, status, priority, tags, timeTracking, recurrence)
VALUES (${escapeSql(id)}, ${escapeSql(USER_ID)}, ${escapeSql(title)}, ${escapeSql(scheduledTime)}, ${completed}, ${escapeSql(description)}, ${escapeSql(project)}, ${order}, ${persistent}, 'pending', 'medium', '[]', '{}', '{}');`
  } catch (err) {
    console.error(`Failed to parse task file ${filePath}:`, err)
    return null
  }
}

// Split a file containing multiple ---...--- frontmatter blocks into sections.
// Each section is the raw text of one block (including its trailing body if any).
function splitFrontmatterBlocks(content: string): string[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: string[] = []
  let i = 0

  while (i < lines.length) {
    // Find the opening ---
    while (i < lines.length && lines[i].trim() !== '---') i++
    if (i >= lines.length) break
    const start = i
    i++ // skip opening ---

    // Find the closing ---
    while (i < lines.length && lines[i].trim() !== '---') i++
    if (i >= lines.length) break
    i++ // skip closing ---

    // Collect optional body lines until next --- or EOF
    const bodyLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '---') {
      bodyLines.push(lines[i])
      i++
    }

    // Reconstruct as a parseable frontmatter string
    const blockLines = lines.slice(start, start + (i - start - bodyLines.length))
    const body = bodyLines.join('\n').trim()
    blocks.push(blockLines.join('\n') + (body ? '\n' + body : ''))
  }

  return blocks
}

// ─── Ideas ────────────────────────────────────────────────────────────────────

function migrateIdeas(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    if (!content.trim()) return []

    const sections = splitFrontmatterBlocks(content)
    const inserts: string[] = []

    sections.forEach(section => {
      const meta = parseFrontmatter(section)
      const id = meta.id
      if (!id) return

      const title = meta.title ?? 'Untitled'
      const description = meta._body ?? ''
      const project = meta.project ?? ''
      const createdAt = meta.createdAt ?? new Date().toISOString()
      const order = parseInt(meta.order ?? '0', 10) || 0

      inserts.push(
        `INSERT OR IGNORE INTO ideas (id, user_id, title, description, project, createdAt, "order")
VALUES (${escapeSql(id)}, ${escapeSql(USER_ID)}, ${escapeSql(title)}, ${escapeSql(description)}, ${escapeSql(project)}, ${escapeSql(createdAt)}, ${order});`
      )
    })

    return inserts
  } catch (err) {
    console.error('Failed to parse ideas.md:', err)
    return []
  }
}

// ─── Projects ─────────────────────────────────────────────────────────────────

function migrateProjects(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    if (!content.trim()) return []

    const sections = splitFrontmatterBlocks(content)
    const inserts: string[] = []

    sections.forEach(section => {
      const meta = parseFrontmatter(section)
      const id = meta.id
      if (!id) return

      const title = meta.title ?? 'Untitled'
      const color = meta.color ?? 'bg-gray-100 text-gray-800'
      const order = parseInt(meta.order ?? '0', 10) || 0

      inserts.push(
        `INSERT OR IGNORE INTO projects (id, user_id, title, color, "order")
VALUES (${escapeSql(id)}, ${escapeSql(USER_ID)}, ${escapeSql(title)}, ${escapeSql(color)}, ${order});`
      )
    })

    return inserts
  } catch (err) {
    console.error('Failed to parse projects.md:', err)
    return []
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`Migrating data for user_id: ${USER_ID}`)

const statements: string[] = []
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.md$/i

let taskCount = 0
const files = fs.readdirSync(DOCS_DIR)
for (const file of files) {
  if (!uuidPattern.test(file)) continue
  const sql = migrateTask(path.join(DOCS_DIR, file))
  if (sql) {
    statements.push(sql)
    taskCount++
  }
}
console.log(`  Tasks: ${taskCount}`)

const ideasFile = path.join(DOCS_DIR, 'ideas.md')
let ideaCount = 0
if (fs.existsSync(ideasFile)) {
  const ideaSqls = migrateIdeas(ideasFile)
  statements.push(...ideaSqls)
  ideaCount = ideaSqls.length
}
console.log(`  Ideas: ${ideaCount}`)

const projectsFile = path.join(DOCS_DIR, 'projects.md')
let projectCount = 0
if (fs.existsSync(projectsFile)) {
  const projectSqls = migrateProjects(projectsFile)
  statements.push(...projectSqls)
  projectCount = projectSqls.length
}
console.log(`  Projects: ${projectCount}`)

const outputPath = path.join(ROOT, 'seed.sql')
fs.writeFileSync(outputPath, statements.join('\n\n') + '\n')
console.log(`\n✅ Generated seed.sql with ${statements.length} statements`)
console.log(`\nNext steps:`)
console.log(`  1. Review seed.sql`)
console.log(`  2. wrangler d1 execute scheduler-db --file=seed.sql --remote`)
if (USER_ID === 'REPLACE_WITH_CLERK_USER_ID') {
  console.log(`  3. After creating your Clerk account, update user_id:`)
  console.log(`     wrangler d1 execute scheduler-db --remote --command "UPDATE tasks SET user_id='your_clerk_user_id' WHERE user_id='REPLACE_WITH_CLERK_USER_ID'"`)
}
