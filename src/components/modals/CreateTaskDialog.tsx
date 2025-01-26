import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"
import { TaskType } from "@/types/task"
import { CreateTaskDialogProps, ProjectName } from "@/types/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatTimeToAMPM, addMinutes, createScheduledTime, getTimeStringFromISO } from "@/utils/timeUtils"
import { Checkbox } from "@/components/ui/checkbox"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"

function CreateTaskDialog({ 
  open, 
  onOpenChange, 
  selectedDate,
  selectedTime 
}: CreateTaskDialogProps) {
  const { addTask, selectedDate: storeDate } = useTaskStore()
  const { getDisplayProjects } = useProjectStore()
  const [title, setTitle] = useState("")
  const [project, setProject] = useState<ProjectName | "">("")
  const [persistent, setPersistent] = useState(false)

  // Use store date as fallback
  const effectiveDate = selectedDate || storeDate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!effectiveDate || !selectedTime) return

    try {
      // Format the time consistently using the same logic as display time
      const formattedTime = selectedTime.includes('T') 
        ? getTimeStringFromISO(selectedTime)
        : selectedTime.includes(':') 
          ? selectedTime 
          : `${selectedTime.padStart(2, '0')}:00`

      const newTask: TaskType = {
        id: crypto.randomUUID(),
        title,
        scheduledTime: createScheduledTime(effectiveDate, formattedTime),
        completed: false,
        description: '',
        project: project || undefined,
        persistent
      }
      
      await addTask(newTask)
      setTitle("")
      setProject("")
      setPersistent(false)
      onOpenChange(false)
    } catch (error) {
      // Keep this error log for production error handling
      console.error('Failed to create task:', error)
    }
  }

  // Format display time safely
  const displayTime = selectedTime ? (() => {
    try {
      if (!selectedTime) return ''
      
      // Get start time in HH:mm format
      const startTime = selectedTime.includes('T') 
        ? getTimeStringFromISO(selectedTime)
        : selectedTime.includes(':') 
          ? selectedTime 
          : `${selectedTime.padStart(2, '0')}:00`
      
      // Calculate end time
      const [hours, minutes] = startTime.split(':').map(Number)
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('Invalid time format')
      }
      
      const endDate = new Date()
      endDate.setHours(hours, minutes + 30)
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
      
      return `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`
    } catch (error) {
      return ''
    }
  })() : ''

  const availableProjects = getDisplayProjects()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <p className="text-sm text-gray-500 mb-2">
              {effectiveDate?.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
            <p className="text-sm text-gray-500">
              Time: {displayTime}
            </p>
          </div>
          
          <Input 
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)} 
            required
          />
          
          <Select value={project} onValueChange={(value) => setProject(value as ProjectName)}>
            <SelectTrigger>
              <SelectValue placeholder="Select project (optional)" />
            </SelectTrigger>
            <SelectContent>
              {availableProjects.map((project) => (
                <SelectItem key={project.id} value={project.title}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="persistent"
              checked={persistent}
              onCheckedChange={(checked) => setPersistent(checked as boolean)}
            />
            <label 
              htmlFor="persistent" 
              className="text-sm text-gray-700 cursor-pointer"
            >
              Make task persistent (shows on all days until completed)
            </label>
          </div>
          
          <Button type="submit">
            Create Task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTaskDialog 