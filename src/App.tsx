import { useState, useMemo } from 'react'
import ScheduleView from './components/Calendar'
import CreateTaskDialog from './components/CreateTaskDialog'
import packageJson from '../package.json'

function App() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<number | null>(null)

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    const fullName = packageJson.author?.name || 'User'
    const firstName = fullName.split(' ')[0]
    return hour < 12 
      ? `Good Morning, ${firstName}. It is time to get it done.` 
      : `Good Afternoon, ${firstName}. It is time to get it done.`
  }, [])

  // Handler for adding tasks at specific time blocks
  const handleAddTask = (blockIndex: number) => {
    setSelectedTimeBlock(blockIndex)
    setIsCreateDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold">{greeting}</h1>
          </div>
        </header>

        <div>
          <ScheduleView onDateSelect={setSelectedDate} />
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
