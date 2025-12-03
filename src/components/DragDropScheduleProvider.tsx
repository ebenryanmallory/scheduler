/**
 * DragDropScheduleProvider Component
 * Unified DndContext wrapper for drag-and-drop scheduling (AC1, AC2, AC3)
 * Handles cross-container dragging between task list and time blocks
 */

import { ReactNode, useState, useCallback, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  TouchSensor,
  MouseSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { TaskType } from '@/types/task'
import { useTaskStore } from '@/store/taskStore'
import { useDragDropSchedule } from '@/hooks/useDragDropSchedule'
import { useDragHistory } from '@/hooks/useDragHistory'
import { TaskDragPreview } from './TaskDragPreview'
import { ScheduleConfirmDialog } from './modals/ScheduleConfirmDialog'
import { getTimeStringFromISO } from '@/utils/timeUtils'
import toast from 'react-hot-toast'

interface DragDropScheduleProviderProps {
  children: ReactNode
  tasks: TaskType[]
}

interface PendingSchedule {
  taskId: string
  taskTitle: string
  previousTime: string | undefined
  newTime: string
  timeDifferenceMinutes: number
}

export function DragDropScheduleProvider({
  children,
  tasks,
}: DragDropScheduleProviderProps) {
  const { updateTask, reorderTasks } = useTaskStore()
  const [pendingSchedule, setPendingSchedule] = useState<PendingSchedule | null>(null)

  // Configure sensors for mouse, touch (AC8), and keyboard
  const mouseSensor = useSensor(MouseSensor, {
    // Require mouse to move 8px before activating (prevents accidental drags)
    activationConstraint: {
      distance: 8,
    },
  })

  const touchSensor = useSensor(TouchSensor, {
    // Touch requires 200ms delay to differentiate from scroll (AC8)
    activationConstraint: {
      delay: 200,
      tolerance: 8,
    },
  })

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })

  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor)

  // Handle undo (AC9) - must be declared before callbacks that use it
  const handleUndo = useCallback(async (taskId: string, previousState: Partial<TaskType>) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    await updateTask(taskId, {
      ...task,
      ...previousState,
    })
  }, [tasks, updateTask])

  // Drag history for undo functionality (AC9) - declare early so callbacks can use it
  const dragHistory = useDragHistory({ onUndo: handleUndo })
  
  // Use ref to access recordOperation in callbacks without stale closure issues
  const recordOperationRef = useRef(dragHistory.recordOperation)
  recordOperationRef.current = dragHistory.recordOperation

  // Execute the actual schedule change
  const executeScheduleChange = useCallback(async (
    task: TaskType, 
    scheduledTimeISO: string
  ) => {
    try {
      // Record for undo
      recordOperationRef.current(task, scheduledTimeISO, undefined)

      // Update task with new scheduled time (AC10 - persist immediately)
      await updateTask(task.id, {
        ...task,
        scheduledTime: scheduledTimeISO,
      })

      const timeString = getTimeStringFromISO(scheduledTimeISO)
      toast.success(`Scheduled "${task.title.slice(0, 20)}${task.title.length > 20 ? '...' : ''}" at ${formatTimeForToast(timeString)}`)
    } catch (error) {
      console.error('Failed to schedule task:', error)
      toast.error('Failed to schedule task. Please try again.')
    }
  }, [updateTask])

  // Handle task scheduling
  const handleTaskSchedule = useCallback(async (taskId: string, scheduledTimeISO: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Calculate time difference for confirmation dialog (AC11)
    const newTimeString = getTimeStringFromISO(scheduledTimeISO)
    let timeDifferenceMinutes = 0

    if (task.scheduledTime) {
      const prevTimeString = getTimeStringFromISO(task.scheduledTime)
      const [prevHours, prevMinutes] = prevTimeString.split(':').map(Number)
      const [newHours, newMinutes] = newTimeString.split(':').map(Number)
      
      const prevTotalMinutes = prevHours * 60 + prevMinutes
      const newTotalMinutes = newHours * 60 + newMinutes
      timeDifferenceMinutes = newTotalMinutes - prevTotalMinutes
    } else {
      // If previously unscheduled, consider it a significant change
      timeDifferenceMinutes = 120 // Treat as > 1 hour to show confirmation
    }

    // If change is > 1 hour, show confirmation dialog (AC11)
    if (Math.abs(timeDifferenceMinutes) >= 60) {
      setPendingSchedule({
        taskId,
        taskTitle: task.title,
        previousTime: task.scheduledTime,
        newTime: scheduledTimeISO,
        timeDifferenceMinutes,
      })
      return
    }

    // Proceed with schedule update
    await executeScheduleChange(task, scheduledTimeISO)
  }, [tasks, executeScheduleChange])

  // Handle confirmation dialog
  const handleConfirmSchedule = useCallback(async () => {
    if (!pendingSchedule) return

    const task = tasks.find(t => t.id === pendingSchedule.taskId)
    if (!task) {
      setPendingSchedule(null)
      return
    }

    await executeScheduleChange(task, pendingSchedule.newTime)
    setPendingSchedule(null)
  }, [pendingSchedule, tasks, executeScheduleChange])

  const handleCancelSchedule = useCallback(() => {
    setPendingSchedule(null)
  }, [])

  // Handle task unscheduling (dropping back to task list)
  const handleTaskUnschedule = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    try {
      // Record for undo
      recordOperationRef.current(task, undefined, undefined)

      // Remove scheduled time (AC10 - persist immediately)
      await updateTask(taskId, {
        ...task,
        scheduledTime: undefined,
        timeBlock: undefined,
      })

      toast.success(`Unscheduled "${task.title.slice(0, 20)}${task.title.length > 20 ? '...' : ''}"`)
    } catch (error) {
      console.error('Failed to unschedule task:', error)
      toast.error('Failed to unschedule task. Please try again.')
    }
  }, [tasks, updateTask])

  // Handle task reordering
  const handleReorder = useCallback(async (reorderedTasks: TaskType[]) => {
    await reorderTasks(reorderedTasks)
  }, [reorderTasks])

  // Drag and drop state management
  const {
    dragState,
    handlers,
    collisionDetection,
    getActiveTask,
  } = useDragDropSchedule({
    tasks,
    onTaskSchedule: handleTaskSchedule,
    onTaskUnschedule: handleTaskUnschedule,
    onReorder: handleReorder,
  })

  const activeTask = getActiveTask()

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handlers.onDragStart}
      onDragOver={handlers.onDragOver}
      onDragEnd={handlers.onDragEnd}
      onDragCancel={handlers.onDragCancel}
      modifiers={[restrictToWindowEdges]}
    >
      {children}

      {/* Drag overlay (AC3) */}
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeTask && (
          <TaskDragPreview 
            task={activeTask}
            dropTime={dragState.dropTime}
            isOverTimeBlock={dragState.overTarget === 'time-block'}
          />
        )}
      </DragOverlay>

      {/* Confirmation dialog (AC11) */}
      <ScheduleConfirmDialog
        open={pendingSchedule !== null}
        onOpenChange={(open) => !open && handleCancelSchedule()}
        onConfirm={handleConfirmSchedule}
        onCancel={handleCancelSchedule}
        taskTitle={pendingSchedule?.taskTitle ?? ''}
        previousTime={pendingSchedule?.previousTime}
        newTime={pendingSchedule?.newTime ?? ''}
        timeDifferenceMinutes={pendingSchedule?.timeDifferenceMinutes ?? 0}
      />
    </DndContext>
  )
}

function formatTimeForToast(time: string): string {
  try {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  } catch {
    return time
  }
}

export default DragDropScheduleProvider
