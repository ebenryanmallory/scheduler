import { ReactNode } from 'react'
import { Drawer } from 'vaul'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useResponsiveModal } from '@/hooks/useResponsiveModal'
import { cn } from '@/lib/utils'

interface ResponsiveDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  /** Optional description for accessibility */
  description?: string
  /** Custom class for the content container */
  className?: string
}

/**
 * Responsive modal component that renders as:
 * - Bottom sheet (drawer) on mobile devices
 * - Centered dialog on tablet/desktop
 * 
 * Uses vaul for the bottom sheet implementation with swipe-to-dismiss
 */
export function ResponsiveDrawer({
  open,
  onOpenChange,
  title,
  children,
  description,
  className,
}: ResponsiveDrawerProps) {
  const { modalType } = useResponsiveModal()

  if (modalType === 'drawer') {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-background rounded-t-[10px]',
              'flex flex-col',
              'max-h-[96vh]',
              'safe-area-bottom',
              className
            )}
            aria-describedby={description ? 'drawer-description' : undefined}
          >
            {/* Drag handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mt-4 mb-2" />
            
            <Drawer.Title className="px-4 pb-2 text-lg font-semibold">
              {title}
            </Drawer.Title>
            
            {description && (
              <Drawer.Description id="drawer-description" className="sr-only">
                {description}
              </Drawer.Description>
            )}

            <div className="flex-1 overflow-auto px-4 pb-8">
              {children}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    )
  }

  // Desktop: regular dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Simple bottom sheet for confirmations and quick actions
 */
interface QuickActionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function QuickActionSheet({ open, onOpenChange, children }: QuickActionSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'bg-background rounded-t-[10px]',
            'safe-area-bottom'
          )}
        >
          {/* Drag handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mt-4 mb-4" />
          
          <div className="px-4 pb-8">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

