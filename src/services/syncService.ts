import { offlineQueue } from './offlineQueue'
import { offlineStorage } from './offlineStorage'
import { QueuedOperation } from './offlineDb'
import type { TaskType } from '@/types/task'

const API_URL = '/api'

export interface SyncResult {
  success: boolean
  synced: number
  failed: number
  conflicts: ConflictInfo[]
}

export interface ConflictInfo {
  operation: QueuedOperation
  localData: unknown
  serverData: unknown
  resolution?: 'local' | 'server' | 'merge'
}

/**
 * Sync Service
 * Handles synchronization of offline changes with the server
 */
export const syncService = {
  /**
   * Check if sync is needed
   */
  async needsSync(): Promise<boolean> {
    const count = await offlineQueue.getPendingCount()
    return count > 0
  },

  /**
   * Perform full sync of pending operations
   */
  async sync(): Promise<SyncResult> {
    console.log('[SyncService] Starting sync...')
    
    // First, consolidate operations to minimize requests
    await offlineQueue.consolidate()
    
    const pending = await offlineQueue.getPending()
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: []
    }

    if (pending.length === 0) {
      console.log('[SyncService] No pending operations')
      await offlineStorage.updateSyncMeta('success', 0)
      return result
    }

    console.log(`[SyncService] Processing ${pending.length} pending operations`)

    for (const operation of pending) {
      try {
        const syncResult = await this.processOperation(operation)
        
        if (syncResult.conflict) {
          result.conflicts.push(syncResult.conflict)
          result.failed++
        } else if (syncResult.success) {
          await offlineQueue.markSynced(operation.id!)
          result.synced++
        } else {
          await offlineQueue.incrementRetry(operation.id!, syncResult.error)
          result.failed++
          
          // Stop if we've failed too many times
          if (operation.retryCount >= 3) {
            console.error(`[SyncService] Operation ${operation.id} failed after 3 retries`)
          }
        }
      } catch (error) {
        console.error(`[SyncService] Error processing operation ${operation.id}:`, error)
        await offlineQueue.incrementRetry(operation.id!, String(error))
        result.failed++
      }
    }

    // Cleanup synced operations
    await offlineQueue.clearSynced()

    // Update sync metadata
    const remainingCount = await offlineQueue.getPendingCount()
    await offlineStorage.updateSyncMeta(
      result.failed > 0 ? 'partial' : 'success',
      remainingCount
    )

    result.success = result.failed === 0
    console.log(`[SyncService] Sync complete: ${result.synced} synced, ${result.failed} failed`)
    
    return result
  },

  /**
   * Process a single operation
   */
  async processOperation(operation: QueuedOperation): Promise<{
    success: boolean
    error?: string
    conflict?: ConflictInfo
  }> {
    const { type, entity, entityId, payload } = operation

    try {
      switch (entity) {
        case 'task':
          return await this.syncTask(type, entityId, payload as TaskType)
        case 'project':
          return await this.syncProject(type, entityId, payload)
        case 'idea':
          return await this.syncIdea(type, entityId, payload)
        default:
          return { success: false, error: `Unknown entity type: ${entity}` }
      }
    } catch (error) {
      if (error instanceof Response && error.status === 409) {
        // Conflict detected
        const serverData = await error.json()
        return {
          success: false,
          conflict: {
            operation,
            localData: payload,
            serverData
          }
        }
      }
      throw error
    }
  },

  /**
   * Sync a task operation
   */
  async syncTask(
    type: QueuedOperation['type'],
    taskId: string,
    payload: TaskType
  ): Promise<{ success: boolean; error?: string; conflict?: ConflictInfo }> {
    let response: Response

    switch (type) {
      case 'create':
        response = await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        break

      case 'update':
        // First check for conflicts (simple timestamp-based)
        const serverTask = await this.fetchServerTask(taskId)
        if (serverTask && payload.scheduledTime) {
          // Compare timestamps - if server is newer, we have a conflict
          const serverTime = new Date(serverTask.scheduledTime || 0).getTime()
          const localTime = new Date(payload.scheduledTime).getTime()
          
          // This is a simplified conflict check - in production you'd use a proper version field
          if (serverTime > localTime) {
            return {
              success: false,
              conflict: {
                operation: { type, entity: 'task', entityId: taskId, payload } as QueuedOperation,
                localData: payload,
                serverData: serverTask
              }
            }
          }
        }

        response = await fetch(`${API_URL}/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        break

      case 'delete':
        response = await fetch(`${API_URL}/tasks/${taskId}`, {
          method: 'DELETE'
        })
        break

      default:
        return { success: false, error: `Unknown operation type: ${type}` }
    }

    if (!response.ok) {
      return { success: false, error: `Server returned ${response.status}` }
    }

    // Update local cache after successful sync
    if (type === 'delete') {
      await offlineStorage.deleteTask(taskId)
    } else {
      const savedTask = type === 'create' ? await response.json() : payload
      await offlineStorage.saveTask(savedTask, false)
    }

    return { success: true }
  },

  /**
   * Fetch a task from the server for conflict detection
   */
  async fetchServerTask(taskId: string): Promise<TaskType | null> {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`)
      if (response.ok) {
        return response.json()
      }
      return null
    } catch {
      return null
    }
  },

  /**
   * Sync a project operation
   */
  async syncProject(
    type: QueuedOperation['type'],
    projectId: string,
    payload: unknown
  ): Promise<{ success: boolean; error?: string }> {
    let response: Response

    switch (type) {
      case 'create':
        response = await fetch(`${API_URL}/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        break
      case 'update':
        response = await fetch(`${API_URL}/projects/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        break
      case 'delete':
        response = await fetch(`${API_URL}/projects/${projectId}`, {
          method: 'DELETE'
        })
        break
      default:
        return { success: false, error: `Unknown operation type: ${type}` }
    }

    return { success: response.ok, error: response.ok ? undefined : `Status ${response.status}` }
  },

  /**
   * Sync an idea operation
   */
  async syncIdea(
    type: QueuedOperation['type'],
    ideaId: string,
    payload: unknown
  ): Promise<{ success: boolean; error?: string }> {
    let response: Response

    switch (type) {
      case 'create':
        response = await fetch(`${API_URL}/ideas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        break
      case 'update':
        response = await fetch(`${API_URL}/ideas/${ideaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        break
      case 'delete':
        response = await fetch(`${API_URL}/ideas/${ideaId}`, {
          method: 'DELETE'
        })
        break
      default:
        return { success: false, error: `Unknown operation type: ${type}` }
    }

    return { success: response.ok, error: response.ok ? undefined : `Status ${response.status}` }
  },

  /**
   * Resolve a conflict with user's choice
   */
  async resolveConflict(
    conflict: ConflictInfo,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: unknown
  ): Promise<boolean> {
    const { operation } = conflict

    try {
      if (resolution === 'server') {
        // Discard local changes, use server data
        await offlineQueue.remove(operation.id!)
        // Update local cache with server data
        if (operation.entity === 'task') {
          await offlineStorage.saveTask(conflict.serverData as TaskType, false)
        }
        return true
      }

      if (resolution === 'local') {
        // Force push local changes
        const response = await fetch(`${API_URL}/${operation.entity}s/${operation.entityId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'X-Force-Update': 'true' // Server should handle this header
          },
          body: JSON.stringify(operation.payload)
        })
        
        if (response.ok) {
          await offlineQueue.markSynced(operation.id!)
          return true
        }
        return false
      }

      if (resolution === 'merge' && mergedData) {
        // Push merged data
        const response = await fetch(`${API_URL}/${operation.entity}s/${operation.entityId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mergedData)
        })
        
        if (response.ok) {
          await offlineQueue.markSynced(operation.id!)
          if (operation.entity === 'task') {
            await offlineStorage.saveTask(mergedData as TaskType, false)
          }
          return true
        }
        return false
      }

      return false
    } catch (error) {
      console.error('[SyncService] Error resolving conflict:', error)
      return false
    }
  }
}

