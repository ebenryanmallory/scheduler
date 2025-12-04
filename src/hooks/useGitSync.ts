import { useState, useEffect, useCallback, useRef } from 'react'
import { useOnlineStatus } from './useOnlineStatus'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'conflict'

export interface SyncLogEntry {
  id: string
  timestamp: string
  operation: 'commit' | 'push' | 'pull' | 'resolve'
  status: 'success' | 'error' | 'conflict'
  message: string
  details?: string
  commitHash?: string
}

export interface SyncState {
  status: SyncStatus
  lastSyncTime: string | null
  pendingChanges: number
  error: string | null
  conflictFiles: string[]
}

export interface GitConflict {
  file: string
  localContent: string
  remoteContent: string
  baseContent?: string
}

const API_URL = '/api/sync'

const initialState: SyncState = {
  status: 'idle',
  lastSyncTime: null,
  pendingChanges: 0,
  error: null,
  conflictFiles: []
}

/**
 * Hook for managing Git sync state and operations
 */
export function useGitSync() {
  const [state, setState] = useState<SyncState>(initialState)
  const [history, setHistory] = useState<SyncLogEntry[]>([])
  const [conflicts, setConflicts] = useState<GitConflict[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const { isOnline } = useOnlineStatus()

  // Connect to SSE for real-time updates
  useEffect(() => {
    if (!isOnline) {
      return
    }

    const connectSSE = () => {
      eventSourceRef.current = new EventSource(`${API_URL}/events`)
      
      eventSourceRef.current.onmessage = (event) => {
        try {
          const newState: SyncState = JSON.parse(event.data)
          setState(newState)
          
          // If conflicts detected, fetch conflict details
          if (newState.status === 'conflict' && newState.conflictFiles.length > 0) {
            fetchConflicts()
          }
        } catch (e) {
          console.error('[useGitSync] Failed to parse SSE message:', e)
        }
      }
      
      eventSourceRef.current.onerror = () => {
        console.log('[useGitSync] SSE connection error, reconnecting...')
        eventSourceRef.current?.close()
        // Reconnect after a delay
        setTimeout(connectSSE, 5000)
      }
    }

    connectSSE()
    
    // Initial data fetch
    fetchStatus()
    fetchHistory()
    
    return () => {
      eventSourceRef.current?.close()
    }
  }, [isOnline])

  // Fetch current status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/status`)
      if (response.ok) {
        const data = await response.json()
        setState(data)
      }
    } catch (error) {
      console.error('[useGitSync] Failed to fetch status:', error)
    }
  }, [])

  // Fetch sync history
  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/history`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (error) {
      console.error('[useGitSync] Failed to fetch history:', error)
    }
  }, [])

  // Fetch conflict details
  const fetchConflicts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/conflicts`)
      if (response.ok) {
        const data = await response.json()
        setConflicts(data)
      }
    } catch (error) {
      console.error('[useGitSync] Failed to fetch conflicts:', error)
    }
  }, [])

  // Trigger immediate sync
  const syncNow = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!isOnline) {
      return { success: false, error: 'You are offline' }
    }
    
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/now`, { method: 'POST' })
      const data = await response.json()
      
      if (data.state) {
        setState(data.state)
      }
      
      // Refresh history after sync
      fetchHistory()
      
      return { success: data.success, error: data.message }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed'
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [isOnline, fetchHistory])

  // Schedule a commit (after task changes)
  const scheduleCommit = useCallback(async (change: {
    type: 'add' | 'update' | 'delete'
    entity: string
    title: string
  }) => {
    if (!isOnline) {
      console.log('[useGitSync] Offline, cannot schedule commit')
      return
    }
    
    try {
      await fetch(`${API_URL}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(change)
      })
    } catch (error) {
      console.error('[useGitSync] Failed to schedule commit:', error)
    }
  }, [isOnline])

  // Resolve a conflict
  const resolveConflict = useCallback(async (
    file: string,
    resolution: 'local' | 'remote' | 'merge',
    mergedContent?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file, resolution, mergedContent })
      })
      
      const data = await response.json()
      
      if (data.state) {
        setState(data.state)
      }
      
      // Refresh conflicts list
      if (data.success) {
        fetchConflicts()
        fetchHistory()
      }
      
      return { success: data.success, error: data.message }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve conflict'
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [fetchConflicts, fetchHistory])

  // Cancel pending sync
  const cancelPending = useCallback(async () => {
    try {
      await fetch(`${API_URL}/cancel`, { method: 'POST' })
    } catch (error) {
      console.error('[useGitSync] Failed to cancel pending sync:', error)
    }
  }, [])

  // Format relative time
  const getRelativeTime = useCallback((timestamp: string | null): string => {
    if (!timestamp) return 'Never'
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    
    if (diffSec < 60) return 'Just now'
    if (diffMin < 60) return `${diffMin} min ago`
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString()
  }, [])

  return {
    // State
    state,
    history,
    conflicts,
    isLoading,
    isOnline,
    
    // Computed
    relativeLastSync: getRelativeTime(state.lastSyncTime),
    hasConflicts: state.conflictFiles.length > 0,
    hasPendingChanges: state.pendingChanges > 0,
    
    // Actions
    syncNow,
    scheduleCommit,
    resolveConflict,
    cancelPending,
    refreshHistory: fetchHistory,
    refreshStatus: fetchStatus
  }
}

