import { useMemo } from 'react'
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

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    const fullName = packageJson.author?.name || 'User'
    const firstName = fullName.split(' ')[0]
    return hour < 12 
      ? `Good Morning, ${firstName}. It is time to get it done.` 
      : `Good Afternoon, ${firstName}. It is time to get it done.`
  }, [])

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

  return (
    <div className="min-h-screen bg-background">
      <NotificationBanner />
      <header className="w-full bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 py-4 sm:py-8 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-900 to-gray-800 dark:from-purple-300 dark:to-gray-200 bg-clip-text text-transparent">
              {greeting}
            </h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationSettings />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-4 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-4 sm:py-8">
          <div>
            <ScheduleView 
              selectedDate={selectedDate}
              onDateSelect={(date: Date) => setSelectedDate(date)}
              onTimeBlockSelect={setSelectedTimeBlock}
            />
          </div>

          <CreateTaskDialog 
            open={isCreateDialogOpen} 
            onOpenChange={setCreateDialogOpen}
            selectedDate={selectedDate}
            selectedTimeBlock={selectedTimeBlock}
            selectedTime={selectedTimeBlock ? selectedTimeBlock.toString() : null}
            onTaskCreate={handleTaskCreate}
          />

          {/* Analytics Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
            <QuickStatsWidget />
            <TimeAnalyticsWidget />
          </div>
        </div>
      </main>

      <Toaster 
        position="bottom-right"
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
