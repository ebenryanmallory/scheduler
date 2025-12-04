import { db, CachedTask, CachedProject, CachedIdea } from './offlineDb'
import type { TaskType } from '@/types/task'

/**
 * Offline Storage Service
 * Provides CRUD operations for offline data persistence
 */
export const offlineStorage = {
  // ==================== TASKS ====================
  
  /**
   * Get all cached tasks, optionally filtered by date
   */
  async getTasks(date?: Date): Promise<CachedTask[]> {
    if (date) {
      const dateStr = date.toISOString().split('T')[0]
      return db.tasks
        .filter(task => {
          const taskDate = new Date(task.date).toISOString().split('T')[0]
          return taskDate === dateStr || Boolean(task.persistent)
        })
        .toArray()
    }
    return db.tasks.toArray()
  },

  /**
   * Get a single task by ID
   */
  async getTask(id: string): Promise<CachedTask | undefined> {
    return db.tasks.get(id)
  },

  /**
   * Save a task to offline storage
   */
  async saveTask(task: TaskType, dirty = false): Promise<void> {
    const cachedTask: CachedTask = {
      ...task,
      _cachedAt: new Date().toISOString(),
      _dirty: dirty
    }
    await db.tasks.put(cachedTask)
  },

  /**
   * Save multiple tasks (for bulk sync)
   */
  async saveTasks(tasks: TaskType[], dirty = false): Promise<void> {
    const cachedTasks: CachedTask[] = tasks.map(task => ({
      ...task,
      _cachedAt: new Date().toISOString(),
      _dirty: dirty
    }))
    await db.tasks.bulkPut(cachedTasks)
  },

  /**
   * Delete a task from offline storage
   */
  async deleteTask(id: string): Promise<void> {
    await db.tasks.delete(id)
  },

  /**
   * Get all dirty (unsynced) tasks
   */
  async getDirtyTasks(): Promise<CachedTask[]> {
    return db.tasks.where('_dirty').equals(true).toArray()
  },

  /**
   * Mark a task as synced (not dirty)
   */
  async markTaskSynced(id: string): Promise<void> {
    await db.tasks.update(id, { _dirty: false })
  },

  // ==================== PROJECTS ====================

  /**
   * Get all cached projects
   */
  async getProjects(): Promise<CachedProject[]> {
    return db.projects.orderBy('order').toArray()
  },

  /**
   * Save a project to offline storage
   */
  async saveProject(project: CachedProject): Promise<void> {
    await db.projects.put(project)
  },

  /**
   * Save multiple projects
   */
  async saveProjects(projects: CachedProject[]): Promise<void> {
    await db.projects.bulkPut(projects)
  },

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    await db.projects.delete(id)
  },

  // ==================== IDEAS ====================

  /**
   * Get all cached ideas
   */
  async getIdeas(): Promise<CachedIdea[]> {
    return db.ideas.orderBy('priority').toArray()
  },

  /**
   * Save an idea to offline storage
   */
  async saveIdea(idea: CachedIdea): Promise<void> {
    await db.ideas.put(idea)
  },

  /**
   * Save multiple ideas
   */
  async saveIdeas(ideas: CachedIdea[]): Promise<void> {
    await db.ideas.bulkPut(ideas)
  },

  /**
   * Delete an idea
   */
  async deleteIdea(id: string): Promise<void> {
    await db.ideas.delete(id)
  },

  // ==================== SYNC METADATA ====================

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime(): Promise<string | null> {
    const meta = await db.syncMeta.get('lastSync')
    return meta?.timestamp || null
  },

  /**
   * Update last sync metadata
   */
  async updateSyncMeta(status: 'success' | 'error' | 'partial', pendingCount: number): Promise<void> {
    await db.syncMeta.put({
      id: 'lastSync',
      timestamp: new Date().toISOString(),
      status,
      pendingCount
    })
  },

  /**
   * Get sync metadata
   */
  async getSyncMeta() {
    return db.syncMeta.get('lastSync')
  }
}

