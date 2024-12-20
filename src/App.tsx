import { useState, useMemo } from 'react'
import ScheduleView from './components/Calendar'
import CreateTaskDialog from './components/CreateTaskDialog'
import packageJson from '../package.json'
import type { ScheduleViewProps } from './types/schedule'

function App() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<number | undefined>(undefined)

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    const fullName = packageJson.author?.name || 'User'
    const firstName = fullName.split(' ')[0]
    return hour < 12 
      ? `Good Morning, ${firstName}. It is time to get it done.` 
      : `Good Afternoon, ${firstName}. It is time to get it done.`
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 py-8">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r to-blue-900 from-purple-900 bg-clip-text text-transparent">
              {greeting}
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-8 py-8">
        <div>
          <ScheduleView 
            selectedDate={selectedDate}
            onDateSelect={(date: Date) => setSelectedDate(date)} 
          />
        </div>

        <CreateTaskDialog 
          open={isCreateDialogOpen} 
          onOpenChange={setIsCreateDialogOpen}
          selectedDate={selectedDate}
          selectedTimeBlock={selectedTimeBlock}
        />
      </div>
    </div>
  )
}

export default App
