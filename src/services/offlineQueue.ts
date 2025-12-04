import { db, QueuedOperation } from './offlineDb'

/**
 * Offline Queue Service
 * Manages pending operations when offline for later sync
 */
export const offlineQueue = {
  /**
   * Add an operation to the queue
   */
  async enqueue(
    type: QueuedOperation['type'],
    entity: QueuedOperation['entity'],
    entityId: string,
    payload: unknown
  ): Promise<number> {
    const operation: Omit<QueuedOperation, 'id'> = {
      type,
      entity,
      entityId,
      payload,
      timestamp: new Date().toISOString(),
      synced: false,
      retryCount: 0
    }
    
    const id = await db.operations.add(operation as QueuedOperation)
    console.log(`[OfflineQueue] Enqueued ${type} ${entity}:${entityId}`, id)
    return id as number
  },

  /**
   * Get all pending (unsynced) operations in order
   */
  async getPending(): Promise<QueuedOperation[]> {
    return db.operations
      .where('synced')
      .equals(false)
      .sortBy('timestamp')
  },

  /**
   * Get count of pending operations
   */
  async getPendingCount(): Promise<number> {
    return db.operations.where('synced').equals(false).count()
  },

  /**
   * Mark an operation as synced
   */
  async markSynced(id: number): Promise<void> {
    await db.operations.update(id, { synced: true })
  },

  /**
   * Increment retry count and optionally store error
   */
  async incrementRetry(id: number, error?: string): Promise<void> {
    const op = await db.operations.get(id)
    if (op) {
      await db.operations.update(id, { 
        retryCount: op.retryCount + 1,
        error
      })
    }
  },

  /**
   * Remove a synced operation (cleanup)
   */
  async remove(id: number): Promise<void> {
    await db.operations.delete(id)
  },

  /**
   * Remove all synced operations (cleanup after successful sync)
   */
  async clearSynced(): Promise<void> {
    await db.operations.where('synced').equals(true).delete()
    console.log('[OfflineQueue] Cleared synced operations')
  },

  /**
   * Get operations for a specific entity (for conflict detection)
   */
  async getOperationsForEntity(entity: string, entityId: string): Promise<QueuedOperation[]> {
    return db.operations
      .where('entityId')
      .equals(entityId)
      .and(op => op.entity === entity && !op.synced)
      .toArray()
  },

  /**
   * Check if there's a pending delete for an entity
   */
  async hasPendingDelete(entity: string, entityId: string): Promise<boolean> {
    const ops = await this.getOperationsForEntity(entity, entityId)
    return ops.some(op => op.type === 'delete')
  },

  /**
   * Consolidate operations for the same entity
   * E.g., create + update = create with latest data
   * E.g., create + delete = no-op
   */
  async consolidate(): Promise<void> {
    const pending = await this.getPending()
    
    // Group by entity+entityId
    const grouped = new Map<string, QueuedOperation[]>()
    for (const op of pending) {
      const key = `${op.entity}:${op.entityId}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(op)
    }

    // Consolidate each group
    for (const [key, ops] of grouped) {
      if (ops.length <= 1) continue

      // Sort by timestamp
      ops.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

      const hasCreate = ops.some(op => op.type === 'create')
      const hasDelete = ops.some(op => op.type === 'delete')

      if (hasCreate && hasDelete) {
        // Created and deleted offline - remove all operations
        for (const op of ops) {
          await this.remove(op.id!)
        }
        console.log(`[OfflineQueue] Consolidated ${key}: create+delete = no-op`)
      } else if (hasCreate) {
        // Keep only the create with latest payload
        const latestUpdate = ops.filter(op => op.type === 'update').pop()
        const create = ops.find(op => op.type === 'create')!
        
        if (latestUpdate) {
          // Merge latest update into create
          await db.operations.update(create.id!, {
            payload: { ...create.payload as object, ...latestUpdate.payload as object }
          })
          // Remove update operations
          for (const op of ops.filter(o => o.type === 'update')) {
            await this.remove(op.id!)
          }
          console.log(`[OfflineQueue] Consolidated ${key}: create+updates = merged create`)
        }
      } else {
        // Multiple updates - keep only the latest
        const updates = ops.filter(op => op.type === 'update')
        if (updates.length > 1) {
          // Keep the last one (latest), remove the rest
          updates.pop() // Remove from array but keep in DB
          for (const op of updates) {
            await this.remove(op.id!)
          }
          console.log(`[OfflineQueue] Consolidated ${key}: multiple updates = latest update`)
        }
      }
    }
  }
}

