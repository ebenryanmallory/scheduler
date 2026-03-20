import type { Task, Idea, Project } from '../types'

// ─── Tasks ────────────────────────────────────────────────────────────────────

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    scheduledTime: (row.scheduledTime as string) || undefined,
    completed: row.completed === 1,
    description: (row.description as string) || '',
    project: (row.project as string) || undefined,
    order: (row.order as number) ?? 0,
    persistent: row.persistent === 1,
    status: (row.status as string) || 'pending',
    priority: (row.priority as string) || 'medium',
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    estimatedDuration: (row.estimatedDuration as number) || undefined,
    timeTracking: row.timeTracking ? JSON.parse(row.timeTracking as string) : undefined,
    recurrence: row.recurrence ? JSON.parse(row.recurrence as string) : undefined,
  }
}

export async function getTasksByDate(db: D1Database, userId: string, date: string): Promise<Task[]> {
  const result = await db
    .prepare(
      `SELECT * FROM tasks
       WHERE user_id = ?
         AND (date(scheduledTime) = date(?) OR (persistent = 1 AND completed = 0))
       ORDER BY "order" ASC`
    )
    .bind(userId, date)
    .all()
  return (result.results as Record<string, unknown>[]).map(rowToTask)
}

export async function createTask(db: D1Database, userId: string, task: Task): Promise<void> {
  await db
    .prepare(
      `INSERT INTO tasks (id, user_id, title, scheduledTime, completed, description, project, "order", persistent, status, priority, tags, estimatedDuration, timeTracking, recurrence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      task.id,
      userId,
      task.title,
      task.scheduledTime ?? null,
      task.completed ? 1 : 0,
      task.description ?? '',
      task.project ?? '',
      task.order ?? 0,
      task.persistent ? 1 : 0,
      task.status ?? 'pending',
      task.priority ?? 'medium',
      JSON.stringify(task.tags ?? []),
      task.estimatedDuration ?? null,
      JSON.stringify(task.timeTracking ?? {}),
      JSON.stringify(task.recurrence ?? {})
    )
    .run()
}

export async function updateTask(db: D1Database, userId: string, id: string, updates: Partial<Task>): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title) }
  if (updates.scheduledTime !== undefined) { fields.push('scheduledTime = ?'); values.push(updates.scheduledTime) }
  if (updates.completed !== undefined) { fields.push('completed = ?'); values.push(updates.completed ? 1 : 0) }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description) }
  if (updates.project !== undefined) { fields.push('project = ?'); values.push(updates.project) }
  if (updates.order !== undefined) { fields.push('"order" = ?'); values.push(updates.order) }
  if (updates.persistent !== undefined) { fields.push('persistent = ?'); values.push(updates.persistent ? 1 : 0) }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status) }
  if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority) }
  if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)) }
  if (updates.estimatedDuration !== undefined) { fields.push('estimatedDuration = ?'); values.push(updates.estimatedDuration) }
  if (updates.timeTracking !== undefined) { fields.push('timeTracking = ?'); values.push(JSON.stringify(updates.timeTracking)) }
  if (updates.recurrence !== undefined) { fields.push('recurrence = ?'); values.push(JSON.stringify(updates.recurrence)) }

  if (fields.length === 0) return

  values.push(userId, id)
  await db
    .prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE user_id = ? AND id = ?`)
    .bind(...values)
    .run()
}

export async function deleteTask(db: D1Database, userId: string, id: string): Promise<void> {
  await db.prepare('DELETE FROM tasks WHERE user_id = ? AND id = ?').bind(userId, id).run()
}

// ─── Ideas ────────────────────────────────────────────────────────────────────

function rowToIdea(row: Record<string, unknown>): Idea {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || undefined,
    project: (row.project as string) || undefined,
    createdAt: row.createdAt as string,
    order: (row.order as number) ?? 0,
  }
}

export async function getAllIdeas(db: D1Database, userId: string): Promise<Idea[]> {
  const result = await db
    .prepare('SELECT * FROM ideas WHERE user_id = ? ORDER BY "order" ASC')
    .bind(userId)
    .all()
  return (result.results as Record<string, unknown>[]).map(rowToIdea)
}

export async function createIdea(db: D1Database, userId: string, idea: Idea): Promise<void> {
  await db
    .prepare(
      'INSERT INTO ideas (id, user_id, title, description, project, createdAt, "order") VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(idea.id, userId, idea.title, idea.description ?? '', idea.project ?? '', idea.createdAt, idea.order ?? 0)
    .run()
}

export async function updateIdea(db: D1Database, userId: string, id: string, updates: Partial<Idea>): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title) }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description) }
  if (updates.project !== undefined) { fields.push('project = ?'); values.push(updates.project) }
  if (updates.order !== undefined) { fields.push('"order" = ?'); values.push(updates.order) }

  if (fields.length === 0) return

  values.push(userId, id)
  await db
    .prepare(`UPDATE ideas SET ${fields.join(', ')} WHERE user_id = ? AND id = ?`)
    .bind(...values)
    .run()
}

export async function deleteIdea(db: D1Database, userId: string, id: string): Promise<void> {
  await db.prepare('DELETE FROM ideas WHERE user_id = ? AND id = ?').bind(userId, id).run()
}

export async function reorderIdeas(db: D1Database, userId: string, ideas: Idea[]): Promise<void> {
  const stmts = ideas.map((idea, i) =>
    db.prepare('UPDATE ideas SET "order" = ? WHERE user_id = ? AND id = ?').bind(i, userId, idea.id)
  )
  await db.batch(stmts)
}

// ─── Projects ─────────────────────────────────────────────────────────────────

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    title: row.title as string,
    color: row.color as string,
    order: (row.order as number) ?? 0,
  }
}

export async function getAllProjects(db: D1Database, userId: string): Promise<Project[]> {
  const result = await db
    .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY "order" ASC')
    .bind(userId)
    .all()
  return (result.results as Record<string, unknown>[]).map(rowToProject)
}

export async function createProject(db: D1Database, userId: string, project: Project): Promise<void> {
  await db
    .prepare('INSERT INTO projects (id, user_id, title, color, "order") VALUES (?, ?, ?, ?, ?)')
    .bind(project.id, userId, project.title, project.color, project.order ?? 0)
    .run()
}

export async function updateProject(
  db: D1Database,
  userId: string,
  id: string,
  updates: Partial<Project>
): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title) }
  if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color) }
  if (updates.order !== undefined) { fields.push('"order" = ?'); values.push(updates.order) }

  if (fields.length === 0) return

  values.push(userId, id)
  await db
    .prepare(`UPDATE projects SET ${fields.join(', ')} WHERE user_id = ? AND id = ?`)
    .bind(...values)
    .run()
}

export async function deleteProject(db: D1Database, userId: string, id: string): Promise<void> {
  await db.prepare('DELETE FROM projects WHERE user_id = ? AND id = ?').bind(userId, id).run()
}
