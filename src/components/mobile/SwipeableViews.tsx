import { ReactNode, useState, useCallback, useRef } from 'react'
import { useSwipeable, SwipeEventData } from 'react-swipeable'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface SwipeableViewsProps {
  children: ReactNode[]
  currentIndex: number
  onIndexChange: (index: number) => void
  /** Minimum swipe velocity to trigger transition */
  velocityThreshold?: number
  /** Minimum swipe distance (percentage of container width) */
  distanceThreshold?: number
  className?: string
  /** Disable swipe gestures */
  disabled?: boolean
}

/**
 * Container for swipeable views on mobile
 * Allows swiping left/right to navigate between views
 */
export function SwipeableViews({
  children,
  currentIndex,
  onIndexChange,
  velocityThreshold = 0.3,
  distanceThreshold = 0.25,
  className,
  disabled = false,
}: SwipeableViewsProps) {
  const isMobile = useIsMobile()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [offset, setOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const totalViews = children.length
  const canSwipeLeft = currentIndex < totalViews - 1
  const canSwipeRight = currentIndex > 0

  const handleSwiping = useCallback((eventData: SwipeEventData) => {
    if (disabled || !isMobile) return

    const { deltaX } = eventData
    
    // Limit drag to valid directions
    if (deltaX > 0 && !canSwipeRight) {
      // Rubber band effect when at start
      setOffset(deltaX * 0.3)
    } else if (deltaX < 0 && !canSwipeLeft) {
      // Rubber band effect when at end
      setOffset(deltaX * 0.3)
    } else {
      setOffset(deltaX)
    }
  }, [disabled, isMobile, canSwipeLeft, canSwipeRight])

  const handleSwiped = useCallback((eventData: SwipeEventData) => {
    if (disabled || !isMobile) return

    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth
    const { deltaX, velocity } = eventData
    const percentMoved = Math.abs(deltaX) / containerWidth

    setOffset(0)
    setIsAnimating(true)
    
    // Check if swipe should trigger navigation
    const shouldNavigate = 
      percentMoved > distanceThreshold || 
      velocity > velocityThreshold

    if (shouldNavigate) {
      if (deltaX > 0 && canSwipeRight) {
        onIndexChange(currentIndex - 1)
      } else if (deltaX < 0 && canSwipeLeft) {
        onIndexChange(currentIndex + 1)
      }
    }

    // Reset animation flag after transition
    setTimeout(() => setIsAnimating(false), 300)
  }, [disabled, isMobile, currentIndex, onIndexChange, canSwipeLeft, canSwipeRight, distanceThreshold, velocityThreshold])

  const swipeHandlers = useSwipeable({
    onSwiping: handleSwiping,
    onSwiped: handleSwiped,
    trackMouse: false,
    trackTouch: true,
    delta: 10,
    preventScrollOnSwipe: true,
  })

  // On desktop, just render current view
  if (!isMobile) {
    return <div className={className}>{children[currentIndex]}</div>
  }

  // Destructure ref from swipeHandlers to avoid duplication
  const { ref: swipeRef, ...swipeProps } = swipeHandlers

  // Merge refs from swipeHandlers and containerRef
  const mergedRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
    // swipeRef is a callback ref
    if (typeof swipeRef === 'function') {
      swipeRef(node)
    }
  }, [swipeRef])

  return (
    <div 
      ref={mergedRef}
      {...swipeProps}
      className={cn('overflow-hidden touch-pan-y', className)}
    >
      <div
        className={cn(
          'flex',
          isAnimating && 'transition-transform duration-300 ease-out'
        )}
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% + ${offset}px))`,
          width: `${totalViews * 100}%`,
        }}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className="flex-shrink-0"
            style={{ width: `${100 / totalViews}%` }}
            aria-hidden={index !== currentIndex}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Indicator dots for swipeable views
 */
interface SwipeIndicatorProps {
  totalViews: number
  currentIndex: number
  onDotClick?: (index: number) => void
  className?: string
}

export function SwipeIndicator({ 
  totalViews, 
  currentIndex, 
  onDotClick,
  className 
}: SwipeIndicatorProps) {
  return (
    <div 
      className={cn('flex items-center justify-center gap-2', className)}
      role="tablist"
    >
      {Array.from({ length: totalViews }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick?.(index)}
          className={cn(
            'h-2 rounded-full transition-all duration-200',
            // Min touch target achieved through padding
            'p-2 -m-2',
            index === currentIndex 
              ? 'w-6 bg-primary' 
              : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
          )}
          role="tab"
          aria-selected={index === currentIndex}
          aria-label={`View ${index + 1}`}
        />
      ))}
    </div>
  )
}

