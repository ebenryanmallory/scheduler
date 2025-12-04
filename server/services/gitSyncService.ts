import { simpleGit, SimpleGit, StatusResult, PullResult } from 'simple-git'
import path from 'path'
import fs from 'fs/promises'

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

export interface ConflictInfo {
  file: string
  localContent: string
  remoteContent: string
  baseContent?: string
}

interface ChangeInfo {
  type: 'add' | 'update' | 'delete'
  entity: string
  title: string
}

/**
 * GitSyncService handles automatic Git synchronization with debouncing and conflict resolution
 */
export class GitSyncService {
  private git: SimpleGit
  private repoPath: string
  private syncLog: SyncLogEntry[] = []
  private maxLogEntries = 50
  
  // Git configuration
  private branch: string
  private remote: string
  
  // Debounce settings
  private commitTimeout: NodeJS.Timeout | null = null
  private debounceMs = 30000 // 30 seconds
  private pendingChanges: ChangeInfo[] = []
  
  // Retry settings
  private maxRetries = 5
  private retryCount = 0
  private baseRetryDelay = 1000 // 1 second
  
  // State
  private currentState: SyncState = {
    status: 'idle',
    lastSyncTime: null,
    pendingChanges: 0,
    error: null,
    conflictFiles: []
  }
  
  // Event listeners for real-time updates
  private listeners: Set<(state: SyncState) => void> = new Set()

  constructor(repoPath?: string) {
    this.repoPath = repoPath || process.cwd()
    this.git = simpleGit(this.repoPath)
    
    // Configure branch and remote from environment variables
    this.branch = process.env.GIT_SYNC_BRANCH || 'main'
    this.remote = process.env.GIT_SYNC_REMOTE || 'origin'
    
    console.log(`[GitSync] Configured for ${this.remote}/${this.branch}`)
  }

  /**
   * Initialize the service and check Git status
   */
  async initialize(): Promise<boolean> {
    try {
      const isRepo = await this.git.checkIsRepo()
      if (!isRepo) {
        console.log('[GitSync] Not a Git repository, initializing...')
        await this.git.init()
      }
      
      // Check remote configuration
      const remotes = await this.git.getRemotes(true)
      if (remotes.length === 0) {
        console.log('[GitSync] No remote configured. Push operations will fail.')
      }
      
      await this.updatePendingCount()
      return true
    } catch (error) {
      console.error('[GitSync] Initialization failed:', error)
      return false
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener)
    // Immediately notify with current state
    listener(this.currentState)
    // Return unsubscribe function
    return () => this.listeners.delete(listener)
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentState))
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<SyncState>): void {
    this.currentState = { ...this.currentState, ...updates }
    this.notifyListeners()
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.currentState }
  }

  /**
   * Get sync history log
   */
  getHistory(): SyncLogEntry[] {
    return [...this.syncLog]
  }

  /**
   * Schedule a commit with debounce
   */
  scheduleCommit(change: ChangeInfo): void {
    this.pendingChanges.push(change)
    this.updateState({ pendingChanges: this.pendingChanges.length })
    
    // Clear existing timeout
    if (this.commitTimeout) {
      clearTimeout(this.commitTimeout)
    }
    
    // Schedule new commit
    this.commitTimeout = setTimeout(async () => {
      await this.performCommitAndPush()
    }, this.debounceMs)
    
    console.log(`[GitSync] Commit scheduled in ${this.debounceMs / 1000}s. Pending: ${this.pendingChanges.length}`)
  }

  /**
   * Force immediate sync (manual trigger)
   */
  async syncNow(): Promise<{ success: boolean; error?: string }> {
    if (this.commitTimeout) {
      clearTimeout(this.commitTimeout)
      this.commitTimeout = null
    }
    
    return this.performCommitAndPush()
  }

  /**
   * Perform commit and push with conflict handling
   */
  private async performCommitAndPush(): Promise<{ success: boolean; error?: string }> {
    if (this.currentState.status === 'syncing') {
      return { success: false, error: 'Sync already in progress' }
    }

    this.updateState({ status: 'syncing', error: null })
    this.retryCount = 0

    try {
      // Check for changes
      const status = await this.git.status()
      
      if (!this.hasChanges(status)) {
        console.log('[GitSync] No changes to commit')
        this.updateState({
          status: 'synced',
          lastSyncTime: new Date().toISOString(),
          pendingChanges: 0
        })
        this.pendingChanges = []
        return { success: true }
      }

      // Stage all changes
      await this.git.add('.')
      
      // Generate commit message
      const commitMessage = this.generateCommitMessage()
      
      // Commit
      const commitResult = await this.git.commit(commitMessage)
      
      this.addLogEntry({
        operation: 'commit',
        status: 'success',
        message: commitMessage,
        commitHash: commitResult.commit
      })

      // Pull before push (to handle remote changes)
      const pullResult = await this.pullWithConflictCheck()
      
      if (!pullResult.success) {
        if (pullResult.conflicts) {
          return { success: false, error: 'Merge conflicts detected' }
        }
        return { success: false, error: pullResult.error }
      }

      // Push with retry
      const pushResult = await this.pushWithRetry()
      
      if (pushResult.success) {
        this.updateState({
          status: 'synced',
          lastSyncTime: new Date().toISOString(),
          pendingChanges: 0,
          error: null,
          conflictFiles: []
        })
        this.pendingChanges = []
        
        this.addLogEntry({
          operation: 'push',
          status: 'success',
          message: 'Changes pushed to remote'
        })
        
        return { success: true }
      }

      return { success: false, error: pushResult.error }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[GitSync] Sync failed:', errorMessage)
      
      this.updateState({
        status: 'error',
        error: errorMessage
      })
      
      this.addLogEntry({
        operation: 'push',
        status: 'error',
        message: 'Sync failed',
        details: errorMessage
      })
      
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Pull from remote with conflict detection
   */
  private async pullWithConflictCheck(): Promise<{ 
    success: boolean
    error?: string
    conflicts?: string[]
  }> {
    try {
      // Check if remote exists
      const remotes = await this.git.getRemotes()
      if (remotes.length === 0) {
        console.log('[GitSync] No remote configured, skipping pull')
        return { success: true }
      }

      // Fetch first to check for conflicts
      await this.git.fetch()
      
      // Check if we're behind
      const status = await this.git.status()
      if (status.behind === 0) {
        return { success: true }
      }

      // Pull with merge
      const pullResult: PullResult = await this.git.pull(this.remote, this.branch, { '--no-rebase': null })
      
      this.addLogEntry({
        operation: 'pull',
        status: 'success',
        message: `Pulled ${pullResult.summary.changes} changes`
      })
      
      return { success: true }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Check for merge conflicts
      if (errorMessage.includes('CONFLICT') || errorMessage.includes('Merge conflict')) {
        const status = await this.git.status()
        const conflicts = status.conflicted
        
        this.updateState({
          status: 'conflict',
          conflictFiles: conflicts
        })
        
        this.addLogEntry({
          operation: 'pull',
          status: 'conflict',
          message: 'Merge conflicts detected',
          details: conflicts.join(', ')
        })
        
        return { success: false, conflicts }
      }
      
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Push with exponential backoff retry
   */
  private async pushWithRetry(): Promise<{ success: boolean; error?: string }> {
    while (this.retryCount < this.maxRetries) {
      try {
        // Check if remote exists
        const remotes = await this.git.getRemotes()
        if (remotes.length === 0) {
          console.log('[GitSync] No remote configured, skipping push')
          return { success: true }
        }

        await this.git.push(this.remote, this.branch)
        return { success: true }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.retryCount++
        
        // Check if error is non-retryable
        if (errorMessage.includes('authentication') || 
            errorMessage.includes('permission') ||
            errorMessage.includes('non-fast-forward')) {
          return { success: false, error: errorMessage }
        }
        
        if (this.retryCount < this.maxRetries) {
          const delay = this.baseRetryDelay * Math.pow(2, this.retryCount - 1)
          console.log(`[GitSync] Push failed, retrying in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`)
          await this.delay(delay)
        } else {
          return { success: false, error: `Push failed after ${this.maxRetries} retries: ${errorMessage}` }
        }
      }
    }
    
    return { success: false, error: 'Max retries exceeded' }
  }

  /**
   * Get conflict details for resolution
   */
  async getConflicts(): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = []
    
    try {
      const status = await this.git.status()
      
      for (const file of status.conflicted) {
        const filePath = path.join(this.repoPath, file)
        const content = await fs.readFile(filePath, 'utf-8')
        
        // Parse conflict markers
        const parsed = this.parseConflictMarkers(content)
        conflicts.push({
          file,
          localContent: parsed.local,
          remoteContent: parsed.remote,
          baseContent: parsed.base
        })
      }
    } catch (error) {
      console.error('[GitSync] Failed to get conflicts:', error)
    }
    
    return conflicts
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(
    file: string, 
    resolution: 'local' | 'remote' | 'merge',
    mergedContent?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const filePath = path.join(this.repoPath, file)
      
      if (resolution === 'local') {
        // Use git checkout --ours
        await this.git.raw(['checkout', '--ours', file])
      } else if (resolution === 'remote') {
        // Use git checkout --theirs
        await this.git.raw(['checkout', '--theirs', file])
      } else if (resolution === 'merge' && mergedContent) {
        // Write merged content
        await fs.writeFile(filePath, mergedContent, 'utf-8')
      }
      
      // Stage the resolved file
      await this.git.add(file)
      
      // Check if all conflicts are resolved
      const status = await this.git.status()
      
      if (status.conflicted.length === 0) {
        // All conflicts resolved, commit the merge
        await this.git.commit('Resolve merge conflicts')
        
        this.updateState({
          status: 'idle',
          conflictFiles: []
        })
        
        this.addLogEntry({
          operation: 'resolve',
          status: 'success',
          message: 'All conflicts resolved'
        })
        
        // Try to push again
        return this.pushWithRetry()
      } else {
        this.updateState({ conflictFiles: status.conflicted })
      }
      
      return { success: true }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Parse Git conflict markers from file content
   */
  private parseConflictMarkers(content: string): {
    local: string
    remote: string
    base?: string
  } {
    // Pattern for conflict markers
    const conflictPattern = /<<<<<<< (HEAD|[\w/]+)\n([\s\S]*?)(?:\|\|\|\|\|\|\| [\w/]+\n([\s\S]*?))?=======\n([\s\S]*?)>>>>>>> ([\w/]+)/g
    
    let local = ''
    let remote = ''
    let base = ''
    
    const match = conflictPattern.exec(content)
    if (match) {
      local = match[2]?.trim() || ''
      base = match[3]?.trim() || ''
      remote = match[4]?.trim() || ''
    } else {
      // No conflict markers found, return full content
      local = content
      remote = content
    }
    
    return { local, remote, base: base || undefined }
  }

  /**
   * Generate commit message from pending changes
   */
  private generateCommitMessage(): string {
    if (this.pendingChanges.length === 0) {
      return 'Auto-sync: Update scheduler data'
    }
    
    if (this.pendingChanges.length === 1) {
      const change = this.pendingChanges[0]
      const verb = change.type === 'add' ? 'Add' : change.type === 'delete' ? 'Delete' : 'Update'
      return `feat(${change.entity}): ${verb} "${change.title}"\n\nAutomated commit by Scheduler App`
    }
    
    const summary = `Batch update: ${this.pendingChanges.length} changes`
    const details = this.pendingChanges
      .slice(0, 10) // Limit to first 10 for readability
      .map(c => `- ${c.type} ${c.entity}: ${c.title}`)
      .join('\n')
    
    return `feat(sync): ${summary}\n\n${details}\n\nAutomated commit by Scheduler App`
  }

  /**
   * Check if there are uncommitted changes
   */
  private hasChanges(status: StatusResult): boolean {
    return (
      status.modified.length > 0 ||
      status.created.length > 0 ||
      status.deleted.length > 0 ||
      status.not_added.length > 0
    )
  }

  /**
   * Update pending changes count from Git status
   */
  private async updatePendingCount(): Promise<void> {
    try {
      const status = await this.git.status()
      const count = 
        status.modified.length + 
        status.created.length + 
        status.deleted.length +
        status.not_added.length
      
      this.updateState({ pendingChanges: count })
    } catch (error) {
      console.error('[GitSync] Failed to update pending count:', error)
    }
  }

  /**
   * Add entry to sync log
   */
  private addLogEntry(entry: Omit<SyncLogEntry, 'id' | 'timestamp'>): void {
    const logEntry: SyncLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...entry
    }
    
    this.syncLog.unshift(logEntry)
    
    // Keep only max entries
    if (this.syncLog.length > this.maxLogEntries) {
      this.syncLog = this.syncLog.slice(0, this.maxLogEntries)
    }
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cancel any pending sync operation
   */
  cancelPending(): void {
    if (this.commitTimeout) {
      clearTimeout(this.commitTimeout)
      this.commitTimeout = null
    }
  }
}

// Singleton instance
export const gitSyncService = new GitSyncService()

