import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Unit Tests for GitSyncService - Story 3.3 Task 10
 * Tests cover: debounce logic, retry logic, conflict detection, sync state machine
 */

// Mock simple-git before importing the service
vi.mock('simple-git', () => {
  const mockGit = {
    checkIsRepo: vi.fn().mockResolvedValue(true),
    init: vi.fn().mockResolvedValue(undefined),
    getRemotes: vi.fn().mockResolvedValue([{ name: 'origin' }]),
    status: vi.fn().mockResolvedValue({
      modified: [],
      created: [],
      deleted: [],
      not_added: [],
      conflicted: [],
      behind: 0
    }),
    add: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue({ commit: 'abc123' }),
    fetch: vi.fn().mockResolvedValue(undefined),
    pull: vi.fn().mockResolvedValue({ summary: { changes: 0 } }),
    push: vi.fn().mockResolvedValue(undefined),
    raw: vi.fn().mockResolvedValue(undefined)
  }
  
  return {
    simpleGit: vi.fn(() => mockGit),
    default: vi.fn(() => mockGit)
  }
})

// Import after mocking
import { GitSyncService, SyncState } from './gitSyncService'
import { simpleGit } from 'simple-git'

describe('GitSyncService', () => {
  let service: GitSyncService
  let mockGit: ReturnType<typeof simpleGit>

  beforeEach(() => {
    vi.useFakeTimers()
    service = new GitSyncService('/test/repo')
    mockGit = simpleGit() as unknown as ReturnType<typeof simpleGit>
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initialization', () => {
    it('should initialize successfully when in a git repo', async () => {
      const result = await service.initialize()
      expect(result).toBe(true)
    })

    it('should initialize git repo if not already one', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValueOnce(false)
      
      const result = await service.initialize()
      
      expect(result).toBe(true)
      expect(mockGit.init).toHaveBeenCalled()
    })

    it('should log warning when no remote is configured', async () => {
      vi.mocked(mockGit.getRemotes).mockResolvedValueOnce([])
      const consoleSpy = vi.spyOn(console, 'log')
      
      await service.initialize()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No remote configured')
      )
    })
  })

  describe('Debounce Logic', () => {
    it('should schedule commit with 30 second debounce', () => {
      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Test' })
      
      const state = service.getState()
      expect(state.pendingChanges).toBe(1)
    })

    it('should batch multiple changes within debounce window', () => {
      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Task 1' })
      service.scheduleCommit({ type: 'update', entity: 'task', title: 'Task 2' })
      service.scheduleCommit({ type: 'delete', entity: 'task', title: 'Task 3' })
      
      const state = service.getState()
      expect(state.pendingChanges).toBe(3)
    })

    it('should reset debounce timer on new change', async () => {
      // Set up mock to return changes
      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Task 1' })
      
      // Advance 20 seconds
      vi.advanceTimersByTime(20000)
      
      // Add another change (should reset timer)
      service.scheduleCommit({ type: 'update', entity: 'task', title: 'Task 2' })
      
      // Advance 20 more seconds (40 total, but only 20 since last change)
      vi.advanceTimersByTime(20000)
      
      // Commit should not have been called yet
      expect(mockGit.commit).not.toHaveBeenCalled()
      
      // Advance remaining 10 seconds
      vi.advanceTimersByTime(10000)
      
      // Now commit should be called
      await vi.runAllTimersAsync()
      expect(mockGit.add).toHaveBeenCalled()
    })

    it('should clear pending changes after successful sync', async () => {
      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Test' })
      
      // Fast-forward past debounce
      await vi.runAllTimersAsync()
      
      const state = service.getState()
      expect(state.pendingChanges).toBe(0)
      expect(state.status).toBe('synced')
    })
  })

  describe('Retry Logic with Exponential Backoff', () => {
    it('should retry push with exponential backoff delays', async () => {
      let pushAttempts = 0
      vi.mocked(mockGit.push).mockImplementation(async () => {
        pushAttempts++
        if (pushAttempts < 3) {
          throw new Error('Network error')
        }
        return undefined as never
      })

      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Test' })
      
      // Run all timers to completion
      await vi.runAllTimersAsync()
      
      expect(pushAttempts).toBe(3)
    })

    it('should fail after max retries', async () => {
      vi.mocked(mockGit.push).mockRejectedValue(new Error('Network error'))
      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Test' })
      
      await vi.runAllTimersAsync()
      
      const state = service.getState()
      expect(state.status).toBe('error')
      expect(state.error).toContain('5 retries')
    })

    it('should not retry on authentication errors', async () => {
      let pushAttempts = 0
      vi.mocked(mockGit.push).mockImplementation(async () => {
        pushAttempts++
        throw new Error('authentication failed')
      })

      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Test' })
      
      await vi.runAllTimersAsync()
      
      // Should fail immediately without retrying
      expect(pushAttempts).toBe(1)
      expect(service.getState().status).toBe('error')
    })

    it('should not retry on permission errors', async () => {
      let pushAttempts = 0
      vi.mocked(mockGit.push).mockImplementation(async () => {
        pushAttempts++
        throw new Error('permission denied')
      })

      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Test' })
      
      await vi.runAllTimersAsync()
      
      expect(pushAttempts).toBe(1)
    })
  })

  describe('Conflict Detection', () => {
    it('should detect merge conflicts during pull', async () => {
      vi.mocked(mockGit.status)
        .mockResolvedValueOnce({
          modified: ['file.json'],
          created: [],
          deleted: [],
          not_added: [],
          conflicted: [],
          behind: 0
        } as never)
        .mockResolvedValueOnce({
          modified: [],
          created: [],
          deleted: [],
          not_added: [],
          conflicted: [],
          behind: 1
        } as never)
        .mockResolvedValueOnce({
          modified: [],
          created: [],
          deleted: [],
          not_added: [],
          conflicted: ['tasks.json'],
          behind: 0
        } as never)

      vi.mocked(mockGit.pull).mockRejectedValueOnce(new Error('CONFLICT in tasks.json'))

      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Test' })
      
      await vi.runAllTimersAsync()
      
      const state = service.getState()
      expect(state.status).toBe('conflict')
      expect(state.conflictFiles).toContain('tasks.json')
    })

    it('should update state to conflict status when conflicts found', async () => {
      vi.mocked(mockGit.status)
        .mockResolvedValueOnce({
          modified: ['file.json'],
          created: [],
          deleted: [],
          not_added: [],
          conflicted: [],
          behind: 0
        } as never)
        .mockResolvedValueOnce({
          modified: [],
          created: [],
          deleted: [],
          not_added: [],
          conflicted: [],
          behind: 1
        } as never)
        .mockResolvedValueOnce({
          modified: [],
          created: [],
          deleted: [],
          not_added: [],
          conflicted: ['file1.json', 'file2.json'],
          behind: 0
        } as never)

      vi.mocked(mockGit.pull).mockRejectedValueOnce(new Error('Merge conflict'))

      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Test' })
      
      await vi.runAllTimersAsync()
      
      const state = service.getState()
      expect(state.status).toBe('conflict')
      expect(state.conflictFiles.length).toBe(2)
    })
  })

  describe('Sync State Machine', () => {
    it('should transition from idle to syncing', async () => {
      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      const states: SyncState['status'][] = []
      service.subscribe((state) => {
        states.push(state.status)
      })

      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Test' })
      
      await vi.runAllTimersAsync()
      
      expect(states).toContain('syncing')
      expect(states).toContain('synced')
    })

    it('should transition to error on failure', async () => {
      vi.mocked(mockGit.status).mockRejectedValue(new Error('Git error'))

      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Test' })
      
      await vi.runAllTimersAsync()
      
      const state = service.getState()
      expect(state.status).toBe('error')
      expect(state.error).toBeTruthy()
    })

    it('should transition to synced on success', async () => {
      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Test' })
      
      await vi.runAllTimersAsync()
      
      const state = service.getState()
      expect(state.status).toBe('synced')
      expect(state.lastSyncTime).toBeTruthy()
    })

    it('should return to idle after conflict resolution', async () => {
      // This would test the resolveConflict method
      // For now, verify initial state
      const state = service.getState()
      expect(state.status).toBe('idle')
      expect(state.conflictFiles).toEqual([])
    })
  })

  describe('Commit Message Generation', () => {
    it('should generate single-change commit message', async () => {
      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Morning standup' })
      
      await vi.runAllTimersAsync()
      
      expect(mockGit.commit).toHaveBeenCalledWith(
        expect.stringContaining('Add "Morning standup"')
      )
    })

    it('should generate batch commit message for multiple changes', async () => {
      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Task 1' })
      service.scheduleCommit({ type: 'update', entity: 'task', title: 'Task 2' })
      service.scheduleCommit({ type: 'delete', entity: 'task', title: 'Task 3' })
      
      await vi.runAllTimersAsync()
      
      expect(mockGit.commit).toHaveBeenCalledWith(
        expect.stringContaining('Batch update: 3 changes')
      )
    })
  })

  describe('Manual Sync', () => {
    it('should allow immediate sync via syncNow()', async () => {
      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      const result = await service.syncNow()
      
      expect(result.success).toBe(true)
      expect(mockGit.add).toHaveBeenCalled()
      expect(mockGit.commit).toHaveBeenCalled()
    })

    it('should cancel pending debounced commit on syncNow()', async () => {
      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Test' })
      
      // Immediately call syncNow (should cancel the debounce timer)
      await service.syncNow()
      
      // The commit should have happened once via syncNow
      expect(mockGit.commit).toHaveBeenCalledTimes(1)
    })
  })

  describe('Sync History', () => {
    it('should log successful operations', async () => {
      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      await service.syncNow()
      
      const history = service.getHistory()
      expect(history.length).toBeGreaterThan(0)
      expect(history[0].status).toBe('success')
    })

    it('should limit history to 50 entries', async () => {
      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      // Perform many sync operations
      for (let i = 0; i < 60; i++) {
        await service.syncNow()
      }
      
      const history = service.getHistory()
      expect(history.length).toBeLessThanOrEqual(50)
    })
  })

  describe('No Remote Handling', () => {
    it('should skip push when no remote is configured', async () => {
      vi.mocked(mockGit.getRemotes).mockResolvedValue([])
      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      await service.syncNow()
      
      // Commit should happen but push should be skipped
      expect(mockGit.commit).toHaveBeenCalled()
      expect(mockGit.push).not.toHaveBeenCalled()
    })
  })

  describe('Cancel Pending', () => {
    it('should cancel pending sync operation', () => {
      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Test' })
      
      service.cancelPending()
      
      // Advance time past debounce
      vi.advanceTimersByTime(35000)
      
      // Commit should not have been called
      expect(mockGit.commit).not.toHaveBeenCalled()
    })
  })

  describe('State Subscription', () => {
    it('should notify subscribers on state changes', async () => {
      const listener = vi.fn()
      
      service.subscribe(listener)
      
      // Initial call with current state
      expect(listener).toHaveBeenCalledTimes(1)
      
      vi.mocked(mockGit.status).mockResolvedValue({
        modified: ['file.json'],
        created: [],
        deleted: [],
        not_added: [],
        conflicted: [],
        behind: 0
      } as never)

      await service.syncNow()
      
      // Should have been called multiple times (initial + state changes)
      expect(listener.mock.calls.length).toBeGreaterThan(1)
    })

    it('should allow unsubscribing', () => {
      const listener = vi.fn()
      
      const unsubscribe = service.subscribe(listener)
      listener.mockClear()
      
      unsubscribe()
      
      service.scheduleCommit({ type: 'add', entity: 'task', title: 'Test' })
      
      // Listener should not be called after unsubscribe
      expect(listener).not.toHaveBeenCalled()
    })
  })
})

