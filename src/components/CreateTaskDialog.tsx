import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"
import { TaskType } from "@/types/task"
import { CreateTaskDialogProps, ProjectName } from "@/types/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatTimeToAMPM, addMinutes, createScheduledTime, getTimeStringFromISO } from "@/utils/timeUtils"
import { PROJECTS } from '@/config/projects'
import { Checkbox } from "@/components/ui/checkbox"

function CreateTaskDialog({ 
  open, 
  onOpenChange, 
  selectedDate, 
  selectedTimeBlock,
  onTaskCreate,
  selectedTime 
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("")
  const [project, setProject] = useState<ProjectName | "">("")
  const [persistent, setPersistent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate || !selectedTime) return

    const formattedTime = selectedTime.includes('T') 
      ? getTimeStringFromISO(selectedTime)
      : selectedTime

    console.log('Debug values:', {
      selectedDate,
      selectedTime,
      formattedTime,
      result: createScheduledTime(selectedDate, formattedTime)
    });

    const [hours, minutes] = formattedTime.split(':').map(Number)
    const taskDateTime = new Date(selectedDate)
    taskDateTime.setHours(hours, minutes)
    
    const newTask: TaskType = {
      id: crypto.randomUUID(),
      title,
      scheduledTime: createScheduledTime(selectedDate, formattedTime),
      completed: false,
      description: '',
      project: project || undefined,
      persistent
    }
    
    onTaskCreate(newTask)
    setTitle("")
    setProject("")
    setPersistent(false)
    onOpenChange(false)
  }

  const displayTime = selectedTime ? (
    `${formatTimeToAMPM(selectedTime)} - ${formatTimeToAMPM(addMinutes(selectedTime, 30))}`
  ) : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <p className="text-sm text-gray-500 mb-2">
              {selectedDate?.toLocaleDateString('en-US', { 
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
              {PROJECTS.map(({ name }) => (
                <SelectItem key={name} value={name}>
                  {name}
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