/**
 * TimeBlockDropZone Component
 * Droppable area for scheduling tasks into time blocks (AC2, AC4, AC5, AC7)
 */

import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TimeBlockDropZoneProps {
  /** ISO timestamp or time string for this time block */
  timeBlockId: string
  /** Child content to render inside the drop zone */
  children: ReactNode
  /** Whether this time block already has tasks */
  hasExistingTask?: boolean
  /** Whether drops are disabled for this time block */
  disabled?: boolean
  /** Optional className for styling */
  className?: string
}

export function TimeBlockDropZone({
  timeBlockId,
  children,
  hasExistingTask = false,
  disabled = false,
  className,
}: TimeBlockDropZoneProps) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: `time-block-${timeBlockId}`,
    disabled,
    data: {
      type: 'time-block',
      timeBlockId,
      accepts: ['task'],
    },
  })

  // Determine visual state
  const isDragActive = !!active
  const isValidTarget = isDragActive && !disabled
  const isHovering = isOver && isValidTarget

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative transition-all duration-150 rounded-md',
        // Base state - subtle dashed border when drag is active
        isDragActive && !isHovering && 'ring-1 ring-dashed ring-muted-foreground/30',
        // Hover state - highlight drop zone
        isHovering && 'ring-2 ring-primary bg-primary/5',
        // Invalid drop zone
        isDragActive && disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      data-dropzone="time-block"
      data-time-block-id={timeBlockId}
      data-is-over={isOver}
    >
      {children}
      
      {/* Drop indicator overlay */}
      {isHovering && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/5 rounded-md animate-pulse" />
          {!hasExistingTask && (
            <div className="relative z-10 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full shadow-sm">
              Drop to schedule
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * TimeBlockDropIndicator - Visual indicator showing where task will be placed
 */
interface TimeBlockDropIndicatorProps {
  isVisible: boolean
  time?: string
}

export function TimeBlockDropIndicator({ isVisible, time }: TimeBlockDropIndicatorProps) {
  if (!isVisible) return null

  return (
    <div className="absolute left-0 right-0 h-1 bg-primary rounded-full transform -translate-y-1/2 z-20">
      {time && (
        <span className="absolute left-0 -top-5 text-xs font-medium text-primary bg-background px-1 rounded">
          {time}
        </span>
      )}
    </div>
  )
}

export default TimeBlockDropZone

