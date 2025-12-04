import { Router, Request, Response } from 'express'
import { gitSyncService, SyncState, ConflictInfo } from '../services/gitSyncService'

const router = Router()

// Store SSE clients for real-time updates
const sseClients: Set<Response> = new Set()

/**
 * SSE endpoint for real-time sync status updates
 * GET /api/sync/events
 */
router.get('/events', (req: Request, res: Response) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  // Add client to set
  sseClients.add(res)
  
  // Send initial state
  const state = gitSyncService.getState()
  res.write(`data: ${JSON.stringify(state)}\n\n`)
  
  // Subscribe to state changes
  const unsubscribe = gitSyncService.subscribe((newState: SyncState) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(newState)}\n\n`)
    }
  })
  
  // Handle client disconnect
  req.on('close', () => {
    sseClients.delete(res)
    unsubscribe()
  })
})

/**
 * Get current sync status
 * GET /api/sync/status
 */
router.get('/status', (_req: Request, res: Response) => {
  try {
    const state = gitSyncService.getState()
    res.json(state)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * Get sync history
 * GET /api/sync/history
 */
router.get('/history', (_req: Request, res: Response) => {
  try {
    const history = gitSyncService.getHistory()
    res.json(history)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get sync history',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * Trigger immediate sync
 * POST /api/sync/now
 */
router.post('/now', async (_req: Request, res: Response) => {
  try {
    const result = await gitSyncService.syncNow()
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Sync completed successfully',
        state: gitSyncService.getState()
      })
    } else {
      res.status(422).json({
        success: false,
        message: result.error || 'Sync failed',
        state: gitSyncService.getState()
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to sync',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * Schedule a commit (called after task changes)
 * POST /api/sync/commit
 */
router.post('/commit', (req: Request, res: Response) => {
  try {
    const { type, entity, title } = req.body
    
    gitSyncService.scheduleCommit({
      type: type || 'update',
      entity: entity || 'task',
      title: title || 'Unknown'
    })
    
    res.json({
      success: true,
      message: 'Commit scheduled',
      state: gitSyncService.getState()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to schedule commit',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * Get conflicts for resolution
 * GET /api/sync/conflicts
 */
router.get('/conflicts', async (_req: Request, res: Response) => {
  try {
    const conflicts = await gitSyncService.getConflicts()
    res.json(conflicts)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get conflicts',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * Resolve a conflict
 * POST /api/sync/resolve
 */
router.post('/resolve', async (req: Request, res: Response) => {
  try {
    const { file, resolution, mergedContent } = req.body as {
      file: string
      resolution: 'local' | 'remote' | 'merge'
      mergedContent?: string
    }
    
    if (!file || !resolution) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: file and resolution'
      })
      return
    }
    
    if (resolution === 'merge' && !mergedContent) {
      res.status(400).json({
        success: false,
        message: 'mergedContent is required when resolution is "merge"'
      })
      return
    }
    
    const result = await gitSyncService.resolveConflict(file, resolution, mergedContent)
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Conflict resolved',
        state: gitSyncService.getState()
      })
    } else {
      res.status(422).json({
        success: false,
        message: result.error || 'Failed to resolve conflict',
        state: gitSyncService.getState()
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to resolve conflict',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * Cancel pending sync
 * POST /api/sync/cancel
 */
router.post('/cancel', (_req: Request, res: Response) => {
  try {
    gitSyncService.cancelPending()
    res.json({
      success: true,
      message: 'Pending sync cancelled',
      state: gitSyncService.getState()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel sync',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

export default router

