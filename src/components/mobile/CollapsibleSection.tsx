import { useState, useEffect, useRef, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  storageKey?: string
  icon?: ReactNode
  className?: string
  headerClassName?: string
  onToggle?: (isOpen: boolean) => void
  /** Auto-collapse on mobile - useful for less important sections */
  autoCollapseOnMobile?: boolean
}

/**
 * Collapsible section with smooth animation
 * Persists collapse state to localStorage if storageKey is provided
 */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  storageKey,
  icon,
  className,
  headerClassName,
  onToggle,
  autoCollapseOnMobile = false,
}: CollapsibleSectionProps) {
  // Initialize from localStorage if available
  const getInitialState = () => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`collapsible-${storageKey}`)
      if (stored !== null) {
        return stored === 'true'
      }
    }
    
    // Auto-collapse on mobile for secondary sections
    if (autoCollapseOnMobile && typeof window !== 'undefined') {
      return window.innerWidth >= 640
    }
    
    return defaultOpen
  }

  const [isOpen, setIsOpen] = useState(getInitialState)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined)

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContentHeight(entry.contentRect.height)
        }
      })
      
      resizeObserver.observe(contentRef.current)
      return () => resizeObserver.disconnect()
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`collapsible-${storageKey}`, String(isOpen))
    }
  }, [isOpen, storageKey])

  const toggleOpen = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      <button
        onClick={toggleOpen}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left',
          'hover:bg-muted/50 transition-colors rounded-t-lg',
          // Larger touch target on mobile (min 44px)
          'min-h-[44px] sm:min-h-0',
          !isOpen && 'rounded-b-lg',
          headerClassName
        )}
        aria-expanded={isOpen}
        aria-controls={`collapsible-content-${storageKey || title}`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      
      <div
        id={`collapsible-content-${storageKey || title}`}
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          height: isOpen ? contentHeight : 0,
          opacity: isOpen ? 1 : 0,
        }}
        aria-hidden={!isOpen}
      >
        <div ref={contentRef} className="p-4 pt-0">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Expand/Collapse All toggle button
 */
interface ExpandCollapseAllProps {
  sections: string[]
  className?: string
}

export function ExpandCollapseAll({ sections, className }: ExpandCollapseAllProps) {
  const [allExpanded, setAllExpanded] = useState(true)

  const toggleAll = () => {
    const newState = !allExpanded
    sections.forEach((key) => {
      localStorage.setItem(`collapsible-${key}`, String(newState))
    })
    setAllExpanded(newState)
    // Force re-render by dispatching storage event
    window.dispatchEvent(new Event('storage'))
  }

  return (
    <button
      onClick={toggleAll}
      className={cn(
        'text-sm text-muted-foreground hover:text-foreground transition-colors',
        'min-h-[44px] px-2 sm:min-h-0',
        className
      )}
    >
      {allExpanded ? 'Collapse All' : 'Expand All'}
    </button>
  )
}

