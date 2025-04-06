import { useState, useMemo } from 'react'
import ScheduleView from './components/ScheduleView'
import CreateTaskDialog from './components/modals/CreateTaskDialog'
import packageJson from '../package.json'
import { Task as TaskType } from './types/task'
import { Toaster, toast } from 'react-hot-toast';
import { useTaskStore } from './store/taskStore'

function App() {
  const { 
    selectedDate,
    isCreateDialogOpen,
    selectedTimeBlock,
    setSelectedDate,
    setCreateDialogOpen,
    setSelectedTimeBlock,
    addTask,
    fetchTasks
  } = useTaskStore()

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
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 py-4 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-900 to-gray-800 bg-clip-text text-transparent">
              {greeting}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-4 sm:py-8">
        <div className="mx-auto max-w-7xl px-8 py-8">
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
        </div>
      </main>

      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  )
}

export default App
