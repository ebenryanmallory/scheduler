/**
 * useDragHistory Hook
 * Tracks drag operations for undo functionality (AC9)
 * Stores up to 5 previous task states for reverting
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { TaskType } from '@/types/task'
import toast from 'react-hot-toast'

export interface DragOperation {
  taskId: string
  taskTitle: string
  previousState: {
    scheduledTime?: string
    timeBlock?: number
  }
  newState: {
    scheduledTime?: string
    timeBlock?: number
  }
  timestamp: number
}

const MAX_HISTORY_SIZE = 5
const UNDO_TOAST_DURATION = 5000

export interface UseDragHistoryOptions {
  onUndo: (taskId: string, previousState: Partial<TaskType>) => Promise<void>
}

export interface UseDragHistoryReturn {
  /** Record a drag operation for potential undo */
  recordOperation: (
    task: TaskType, 
    newScheduledTime: string | undefined,
    newTimeBlock: number | undefined
  ) => void
  /** Undo the last drag operation */
  undoLast: () => Promise<void>
  /** Check if undo is available */
  canUndo: boolean
  /** History of drag operations */
  history: DragOperation[]
  /** Clear all history */
  clearHistory: () => void
}

export function useDragHistory({ onUndo }: UseDragHistoryOptions): UseDragHistoryReturn {
  const [history, setHistory] = useState<DragOperation[]>([])
  const toastIdRef = useRef<string | null>(null)

  // Dismiss any existing undo toast when history changes
  useEffect(() => {
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current)
      }
    }
  }, [])

  const recordOperation = useCallback((
    task: TaskType,
    newScheduledTime: string | undefined,
    newTimeBlock: number | undefined
  ) => {
    const operation: DragOperation = {
      taskId: task.id,
      taskTitle: task.title,
      previousState: {
        scheduledTime: task.scheduledTime,
        timeBlock: task.timeBlock,
      },
      newState: {
        scheduledTime: newScheduledTime,
        timeBlock: newTimeBlock,
      },
      timestamp: Date.now(),
    }

    setHistory(prev => {
      const newHistory = [operation, ...prev].slice(0, MAX_HISTORY_SIZE)
      return newHistory
    })

    // Dismiss previous toast if exists
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
    }

    // Show undo toast (AC9)
    const toastId = toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm">
            {newScheduledTime 
              ? `Scheduled "${task.title.slice(0, 20)}${task.title.length > 20 ? '...' : ''}"`
              : `Unscheduled "${task.title.slice(0, 20)}${task.title.length > 20 ? '...' : ''}"`
            }
          </span>
          <button
            className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            onClick={() => {
              toast.dismiss(t.id)
              undoLastInternal()
            }}
          >
            Undo
          </button>
        </div>
      ),
      {
        duration: UNDO_TOAST_DURATION,
        icon: '📋',
      }
    )
    toastIdRef.current = toastId
  }, [])

  const undoLastInternal = useCallback(async () => {
    const [lastOperation, ...rest] = history
    
    if (!lastOperation) return

    try {
      await onUndo(lastOperation.taskId, lastOperation.previousState)
      setHistory(rest)
      toast.success(`Reverted "${lastOperation.taskTitle.slice(0, 20)}${lastOperation.taskTitle.length > 20 ? '...' : ''}"`, {
        duration: 2000,
        icon: '↩️',
      })
    } catch (error) {
      console.error('Failed to undo:', error)
      toast.error('Failed to undo. Please try again.')
    }
  }, [history, onUndo])

  const undoLast = useCallback(async () => {
    // Dismiss the undo toast first
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }
    await undoLastInternal()
  }, [undoLastInternal])

  const clearHistory = useCallback(() => {
    setHistory([])
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }
  }, [])

  // Keyboard shortcut for undo (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        // Only handle if we have history and not in an input field
        if (history.length > 0) {
          const target = event.target as HTMLElement
          if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
            event.preventDefault()
            undoLast()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [history.length, undoLast])

  return {
    recordOperation,
    undoLast,
    canUndo: history.length > 0,
    history,
    clearHistory,
  }
}

