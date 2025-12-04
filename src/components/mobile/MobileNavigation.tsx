import { useState, useCallback } from 'react'
import { 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  Lightbulb,
  FolderKanban,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useTheme } from '@/context/ThemeContext'

export type MobileView = 'schedule' | 'tasks' | 'analytics' | 'more'

interface MobileNavigationProps {
  currentView: MobileView
  onViewChange: (view: MobileView) => void
  className?: string
}

interface NavItem {
  id: MobileView
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { id: 'schedule', label: 'Today', icon: <Calendar className="h-5 w-5" /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="h-5 w-5" /> },
  { id: 'analytics', label: 'Stats', icon: <BarChart3 className="h-5 w-5" /> },
  { id: 'more', label: 'More', icon: <Menu className="h-5 w-5" /> },
]

/**
 * Mobile bottom navigation bar
 * Follows iOS/Android native patterns with 44px+ touch targets
 */
export function MobileBottomNav({ currentView, onViewChange, className }: MobileNavigationProps) {
  const isMobile = useIsMobile()

  if (!isMobile) return null

  return (
    <nav 
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background/95 backdrop-blur-md border-t border-border',
        'safe-area-bottom',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'flex flex-col items-center justify-center py-2 px-4 flex-1',
              // Minimum 44px touch target
              'min-h-[56px] min-w-[64px]',
              'transition-colors duration-150',
              currentView === item.id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-current={currentView === item.id ? 'page' : undefined}
          >
            {item.icon}
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

/**
 * Hamburger menu with slide-out drawer for additional options
 */
interface HamburgerMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HamburgerMenu({ open, onOpenChange }: HamburgerMenuProps) {
  const { theme, setTheme } = useTheme()

  // TODO: Wire up navigation actions to scroll to respective sections
  const menuItems = [
    { icon: <Lightbulb className="h-5 w-5" />, label: 'Ideas', action: () => { /* TODO: Scroll to Ideas section */ } },
    { icon: <FolderKanban className="h-5 w-5" />, label: 'Projects', action: () => { /* TODO: Scroll to Projects section */ } },
    { icon: <FileText className="h-5 w-5" />, label: 'Docs', action: () => { /* TODO: Scroll to Docs section */ } },
    { icon: <Bell className="h-5 w-5" />, label: 'Notifications', action: () => { /* TODO: Open notification settings */ } },
    { 
      icon: theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />, 
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode', 
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark')
    },
  ]

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-72 bg-background z-50',
          'transform transition-transform duration-300 ease-out',
          'border-l border-border shadow-xl',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-lg">Menu</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-muted rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.action()
                onOpenChange(false)
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
                'hover:bg-muted transition-colors',
                'min-h-[48px] text-left'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}

/**
 * Hook to manage mobile navigation state
 */
export function useMobileNavigation() {
  const [currentView, setCurrentView] = useState<MobileView>('schedule')
  const [menuOpen, setMenuOpen] = useState(false)
  
  const handleViewChange = useCallback((view: MobileView) => {
    if (view === 'more') {
      setMenuOpen(true)
    } else {
      setCurrentView(view)
    }
  }, [])

  return {
    currentView,
    setCurrentView,
    menuOpen,
    setMenuOpen,
    handleViewChange,
  }
}

