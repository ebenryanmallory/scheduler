import { useMemo, useCallback, useEffect } from 'react'
import ScheduleView from './components/ScheduleView'
import CreateTaskDialog from './components/modals/CreateTaskDialog'
import { NotificationSettings } from './components/NotificationSettings'
import { NotificationBanner } from './components/NotificationBanner'
import { useNotifications } from './hooks/useNotifications'
import { ThemeProvider } from './context/ThemeContext'
import { ThemeToggle } from './components/ThemeToggle'
import { ErrorBoundary } from './components/ErrorBoundary'
import TimeAnalyticsWidget from './components/TimeAnalyticsWidget'
import QuickStatsWidget from './components/QuickStatsWidget'
import packageJson from '../package.json'
import { TaskType } from './types/task'
import { Toaster, toast } from 'react-hot-toast';
import { useTaskStore } from './store/taskStore'
import { errorService } from './services/errorService'
import { useIsMobile } from './hooks/useMediaQuery'
import { 
  MobileBottomNav, 
  HamburgerMenu, 
  useMobileNavigation,
  SwipeableViews,
  MobileView,
  CollapsibleSection
} from './components/mobile'
import IdeasWidget from './components/IdeasWidget'
import ProjectsWidget from './components/ProjectsWidget'
import DocsWidget from './components/DocsWidget'
import { Menu } from 'lucide-react'
import { OfflineBadge, OfflineIndicator } from './components/OfflineIndicator'
import { InstallPrompt } from './components/InstallPrompt'
import { initializeOfflineDb } from './services/offlineDb'
import { SyncStatusBadge } from './components/SyncStatusIndicator'

function AppContent() {
  const { 
    selectedDate,
    isCreateDialogOpen,
    selectedTimeBlock,
    setSelectedDate,
    setCreateDialogOpen,
    setSelectedTimeBlock,
    addTask,
  } = useTaskStore()

  // Initialize notification system
  useNotifications();

  // Initialize offline database
  useEffect(() => {
    initializeOfflineDb().catch(console.error)
  }, [])

  // Mobile navigation
  const { currentView, menuOpen, setMenuOpen, handleViewChange } = useMobileNavigation()
  const isMobile = useIsMobile()

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    const fullName = packageJson.author?.name || 'User'
    const firstName = fullName.split(' ')[0]
    
    // Shorter greeting on mobile
    if (isMobile) {
      return hour < 12 ? `Good Morning, ${firstName}` : `Good Afternoon, ${firstName}`
    }
    
    return hour < 12 
      ? `Good Morning, ${firstName}. It is time to get it done.` 
      : `Good Afternoon, ${firstName}. It is time to get it done.`
  }, [isMobile])

  const handleTaskCreate = async (task: TaskType) => {
    try {
      if (!selectedDate) return;
      await addTask(task);
      toast.success('Task created successfully');
    } catch (error) {
      // Use errorService for user-friendly messages (AC2 & AC9)
      const userMessage = errorService.getUserMessage(error);
      toast.error(userMessage);
    }
  };

  // Map mobile views to swipeable indices
  const viewToIndex: Record<MobileView, number> = {
    'schedule': 0,
    'tasks': 0,  // Same view
    'analytics': 1,
    'more': 0
  }

  const handleSwipeIndexChange = useCallback((index: number) => {
    const indexToView: MobileView[] = ['schedule', 'analytics']
    handleViewChange(indexToView[index] || 'schedule')
  }, [handleViewChange])

  // Mobile content views
  const renderMobileContent = () => {
    if (currentView === 'analytics') {
      return (
        <div className="space-y-4">
          <QuickStatsWidget />
          <TimeAnalyticsWidget />
        </div>
      )
    }

    // Schedule/Tasks view (default)
    return (
      <div className="space-y-4">
        <ScheduleView 
          selectedDate={selectedDate}
          onDateSelect={(date: Date) => setSelectedDate(date)}
          onTimeBlockSelect={setSelectedTimeBlock}
        />
        
        {/* Collapsible widgets on mobile */}
        <CollapsibleSection 
          title="Ideas" 
          storageKey="mobile-ideas"
          autoCollapseOnMobile
        >
          <IdeasWidget />
        </CollapsibleSection>
        
        <CollapsibleSection 
          title="Projects" 
          storageKey="mobile-projects"
          autoCollapseOnMobile
        >
          <ProjectsWidget />
        </CollapsibleSection>
        
        <CollapsibleSection 
          title="Docs" 
          storageKey="mobile-docs"
          autoCollapseOnMobile
        >
          <DocsWidget />
        </CollapsibleSection>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NotificationBanner />
      
      {/* Header - responsive */}
      <header className="w-full bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 py-3 sm:py-4 md:py-8 border-b border-border safe-area-top">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-8">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-900 to-gray-800 dark:from-purple-300 dark:to-gray-200 bg-clip-text text-transparent truncate">
              {greeting}
            </h1>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Git sync status */}
              <SyncStatusBadge />
              
              {/* Offline status badge */}
              <OfflineBadge />
              
              {/* Desktop controls */}
              {!isMobile && (
                <>
                  <ThemeToggle />
                  <NotificationSettings />
                </>
              )}
              
              {/* Mobile menu button */}
              {isMobile && (
                <button
                  onClick={() => setMenuOpen(true)}
                  className="p-2 hover:bg-muted rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content - responsive */}
      <main className="mx-auto max-w-7xl px-3 sm:px-4 md:px-8 py-3 sm:py-4 md:py-8">
        {isMobile ? (
          // Mobile: swipeable views
          <SwipeableViews
            currentIndex={viewToIndex[currentView]}
            onIndexChange={handleSwipeIndexChange}
            className="min-h-[calc(100vh-180px)]"
          >
            {/* View 1: Schedule + Tasks */}
            <div className="px-1">
              {renderMobileContent()}
            </div>
            
            {/* View 2: Analytics */}
            <div className="px-1 space-y-4">
              <QuickStatsWidget />
              <TimeAnalyticsWidget />
            </div>
          </SwipeableViews>
        ) : (
          // Desktop: standard layout
          <div className="mx-auto max-w-7xl">
            <ScheduleView 
              selectedDate={selectedDate}
              onDateSelect={(date: Date) => setSelectedDate(date)}
              onTimeBlockSelect={setSelectedTimeBlock}
            />

            {/* Analytics Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
              <QuickStatsWidget />
              <TimeAnalyticsWidget />
            </div>
          </div>
        )}

        <CreateTaskDialog 
          open={isCreateDialogOpen} 
          onOpenChange={setCreateDialogOpen}
          selectedDate={selectedDate}
          selectedTimeBlock={selectedTimeBlock}
          selectedTime={selectedTimeBlock ? selectedTimeBlock.toString() : null}
          onTaskCreate={handleTaskCreate}
        />
      </main>

      {/* Mobile navigation */}
      {isMobile && (
        <>
          <MobileBottomNav
            currentView={currentView}
            onViewChange={handleViewChange}
          />
          <HamburgerMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
          />
        </>
      )}

      {/* Offline indicator banner */}
      <OfflineIndicator />

      {/* PWA Install prompt */}
      <InstallPrompt />

      <Toaster 
        position={isMobile ? "top-center" : "bottom-right"}
        toastOptions={{
          duration: 4000,
          className: 'bg-card text-card-foreground border border-border',
        }}
      />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
