import Dexie, { Table } from 'dexie'
import type { TaskType } from '@/types/task'

/**
 * Queued operation for offline sync
 */
export interface QueuedOperation {
  id?: number
  type: 'create' | 'update' | 'delete'
  entity: 'task' | 'project' | 'idea' | 'template'
  entityId: string
  payload: unknown
  timestamp: string
  synced: boolean
  retryCount: number
  error?: string
}

/**
 * Cached task for offline storage
 */
export interface CachedTask extends TaskType {
  _cachedAt: string
  _dirty: boolean
}

/**
 * Cached project for offline storage
 */
export interface CachedProject {
  id: string
  title: string
  description?: string
  color?: string
  order: number
  _cachedAt: string
  _dirty: boolean
}

/**
 * Cached idea for offline storage
 */
export interface CachedIdea {
  id: string
  content: string
  createdAt: string
  priority: number
  _cachedAt: string
  _dirty: boolean
}

/**
 * Sync metadata
 */
export interface SyncMeta {
  id: string // 'lastSync'
  timestamp: string
  status: 'success' | 'error' | 'partial'
  pendingCount: number
}

/**
 * Scheduler IndexedDB Database
 * Uses Dexie for IndexedDB abstraction
 */
class SchedulerDB extends Dexie {
  tasks!: Table<CachedTask>
  projects!: Table<CachedProject>
  ideas!: Table<CachedIdea>
  operations!: Table<QueuedOperation>
  syncMeta!: Table<SyncMeta>

  constructor() {
    super('scheduler-offline')
    
    // Define schema
    // Version 1: Initial schema
    this.version(1).stores({
      tasks: 'id, date, project, completed, scheduledTime, _dirty',
      projects: 'id, order, _dirty',
      ideas: 'id, priority, createdAt, _dirty',
      operations: '++id, type, entity, entityId, timestamp, synced',
      syncMeta: 'id'
    })
  }
}

// Singleton database instance
export const db = new SchedulerDB()

/**
 * Initialize database and handle any migrations
 */
export async function initializeOfflineDb(): Promise<void> {
  try {
    await db.open()
    console.log('[OfflineDB] Database initialized successfully')
  } catch (error) {
    console.error('[OfflineDB] Failed to initialize database:', error)
    throw error
  }
}

/**
 * Clear all cached data (useful for logout or reset)
 */
export async function clearOfflineData(): Promise<void> {
  await db.transaction('rw', [db.tasks, db.projects, db.ideas, db.operations, db.syncMeta], async () => {
    await db.tasks.clear()
    await db.projects.clear()
    await db.ideas.clear()
    await db.operations.clear()
    await db.syncMeta.clear()
  })
  console.log('[OfflineDB] All offline data cleared')
}

/**
 * Get database storage estimate
 */
export async function getStorageEstimate(): Promise<{ used: number; quota: number } | null> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0
    }
  }
  return null
}

