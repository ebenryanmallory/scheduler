/**
 * useDragDropSchedule Hook
 * Manages drag-and-drop state for scheduling tasks into time blocks
 * Supports cross-container dragging (task list -> time blocks)
 */

import { useState, useCallback, useMemo } from 'react'
import { 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent,
  DragCancelEvent,
  UniqueIdentifier,
  CollisionDetection,
  rectIntersection,
  pointerWithin,
} from '@dnd-kit/core'
import { TaskType } from '@/types/task'
import { getTimeStringFromISO } from '@/utils/timeUtils'

export type DragSource = 'task-list' | 'time-block'
export type DropTarget = 'task-list' | 'time-block' | null

export interface DragState {
  /** Currently dragged task */
  activeTask: TaskType | null
  /** ID of the active draggable */
  activeId: UniqueIdentifier | null
  /** Where the drag started */
  dragSource: DragSource | null
  /** Current drop target during drag-over */
  overTarget: DropTarget
  /** Target time block ID if hovering over a time block */
  overTimeBlockId: string | null
  /** Whether we're in a valid drop zone */
  isValidDrop: boolean
  /** Calculated drop time (HH:mm format) */
  dropTime: string | null
}

export interface DragDropScheduleOptions {
  tasks: TaskType[]
  onTaskSchedule: (taskId: string, scheduledTime: string) => Promise<void>
  onTaskUnschedule: (taskId: string) => Promise<void>
  onReorder: (tasks: TaskType[]) => Promise<void>
}

export interface UseDragDropScheduleReturn {
  dragState: DragState
  handlers: {
    onDragStart: (event: DragStartEvent) => void
    onDragOver: (event: DragOverEvent) => void
    onDragEnd: (event: DragEndEvent) => void
    onDragCancel: (event: DragCancelEvent) => void
  }
  collisionDetection: CollisionDetection
  /** Check if task is being dragged */
  isDragging: (taskId: string) => boolean
  /** Get the task being dragged */
  getActiveTask: () => TaskType | null
}

const INITIAL_STATE: DragState = {
  activeTask: null,
  activeId: null,
  dragSource: null,
  overTarget: null,
  overTimeBlockId: null,
  isValidDrop: false,
  dropTime: null,
}

/**
 * Custom collision detection that prioritizes time block drop zones
 * Falls back to pointer-within for general areas, then rect intersection
 */
const createScheduleCollisionDetection = (): CollisionDetection => {
  return (args) => {
    // First try pointer-within (more precise for drop zones)
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      // Prioritize time-block drop zones
      const timeBlockCollision = pointerCollisions.find(
        c => String(c.id).startsWith('time-block-')
      )
      if (timeBlockCollision) {
        return [timeBlockCollision]
      }
      return pointerCollisions
    }
    
    // Fall back to rect intersection
    return rectIntersection(args)
  }
}

export function useDragDropSchedule({
  tasks,
  onTaskSchedule,
  onTaskUnschedule,
  onReorder,
}: DragDropScheduleOptions): UseDragDropScheduleReturn {
  const [dragState, setDragState] = useState<DragState>(INITIAL_STATE)
  
  const collisionDetection = useMemo(() => createScheduleCollisionDetection(), [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const taskId = String(active.id)
    const task = tasks.find(t => t.id === taskId)
    
    if (!task) return

    // Determine drag source - if task has scheduledTime, it's from time block
    const dragSource: DragSource = task.scheduledTime ? 'time-block' : 'task-list'
    
    setDragState({
      activeTask: task,
      activeId: active.id,
      dragSource,
      overTarget: null,
      overTimeBlockId: null,
      isValidDrop: false,
      dropTime: null,
    })
  }, [tasks])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event
    
    if (!over) {
      setDragState(prev => ({
        ...prev,
        overTarget: null,
        overTimeBlockId: null,
        isValidDrop: false,
        dropTime: null,
      }))
      return
    }

    const overId = String(over.id)
    
    // Check if hovering over a time block drop zone
    if (overId.startsWith('time-block-')) {
      // Extract time from the drop zone ID (format: time-block-{ISO_TIME})
      const timeBlockTime = overId.replace('time-block-', '')
      const dropTime = getTimeStringFromISO(timeBlockTime)
      
      setDragState(prev => ({
        ...prev,
        overTarget: 'time-block',
        overTimeBlockId: overId,
        isValidDrop: true,
        dropTime,
      }))
    } else if (overId.startsWith('task-list-')) {
      // Dragging over task list area
      setDragState(prev => ({
        ...prev,
        overTarget: 'task-list',
        overTimeBlockId: null,
        isValidDrop: true,
        dropTime: null,
      }))
    } else {
      // Might be hovering over another task (for reordering)
      const overTask = tasks.find(t => t.id === overId)
      if (overTask) {
        setDragState(prev => ({
          ...prev,
          overTarget: 'task-list',
          overTimeBlockId: null,
          isValidDrop: true,
          dropTime: null,
        }))
      }
    }
  }, [tasks])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    const state = dragState
    
    // Reset state first
    setDragState(INITIAL_STATE)
    
    if (!over || !state.activeTask) return

    const overId = String(over.id)
    const taskId = String(active.id)

    try {
      // Dropped on a time block
      if (overId.startsWith('time-block-')) {
        const timeBlockTime = overId.replace('time-block-', '')
        await onTaskSchedule(taskId, timeBlockTime)
      } 
      // Dropped on task list (unschedule or reorder)
      else if (overId.startsWith('task-list-') || overId === 'task-list-drop-zone') {
        // If task was scheduled, unschedule it
        if (state.activeTask.scheduledTime) {
          await onTaskUnschedule(taskId)
        }
      }
      // Dropped on another task (reorder within list)
      else {
        const overTask = tasks.find(t => t.id === overId)
        if (overTask && active.id !== over.id) {
          const allTasks = [...tasks]
          const oldIndex = allTasks.findIndex(t => t.id === taskId)
          const newIndex = allTasks.findIndex(t => t.id === overId)
          
          if (oldIndex !== -1 && newIndex !== -1) {
            const [movedTask] = allTasks.splice(oldIndex, 1)
            allTasks.splice(newIndex, 0, movedTask)
            await onReorder(allTasks)
          }
        }
      }
    } catch (error) {
      console.error('Error handling drag end:', error)
      // Error will be handled by the store/service layer
    }
  }, [dragState, tasks, onTaskSchedule, onTaskUnschedule, onReorder])

  const handleDragCancel = useCallback(() => {
    setDragState(INITIAL_STATE)
  }, [])

  const isDragging = useCallback((taskId: string) => {
    return dragState.activeId === taskId
  }, [dragState.activeId])

  const getActiveTask = useCallback(() => {
    return dragState.activeTask
  }, [dragState.activeTask])

  return {
    dragState,
    handlers: {
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
      onDragCancel: handleDragCancel,
    },
    collisionDetection,
    isDragging,
    getActiveTask,
  }
}

