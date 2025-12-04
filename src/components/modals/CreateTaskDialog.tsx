import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle 
} from "@/components/ui/responsive-dialog"
import { useState } from "react"
import { TaskType } from "@/types/task"
import { CreateTaskDialogProps, ProjectName } from "@/types/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatTimeToAMPM, createScheduledTime, getTimeStringFromISO } from "@/utils/timeUtils"
import { Checkbox } from "@/components/ui/checkbox"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { RecurrenceSelector } from "@/components/RecurrenceSelector"
import { RecurrenceConfig, TaskTemplate } from "@/types/recurrence"
import { configToRRuleString } from "@/lib/recurrence"
import { TemplateLibrary } from "@/components/TemplateLibrary"
import { FileText } from "lucide-react"

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
  const [estimatedDuration, setEstimatedDuration] = useState("")
  const [recurrence, setRecurrence] = useState<RecurrenceConfig | null>(null)
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false)

  // Use store date as fallback
  const effectiveDate = selectedDate || storeDate

  // Apply template values to form
  const applyTemplate = (template: TaskTemplate) => {
    if (template.taskDefaults.title) setTitle(template.taskDefaults.title)
    if (template.taskDefaults.project) setProject(template.taskDefaults.project as ProjectName)
    if (template.taskDefaults.persistent !== undefined) setPersistent(template.taskDefaults.persistent)
    if (template.taskDefaults.estimatedDuration) setEstimatedDuration(template.taskDefaults.estimatedDuration.toString())
    if (template.taskDefaults.recurrence) setRecurrence(template.taskDefaults.recurrence)
  }

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
        date: effectiveDate,
        completed: false,
        description: '',
        project: project || undefined,
        persistent,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration, 10) : undefined,
        timeTracking: {
          status: 'not_started',
          accumulatedMs: 0,
          history: []
        },
        // Add recurrence if configured
        recurrence: recurrence && recurrence.interval > 0 ? {
          rruleString: configToRRuleString(recurrence, effectiveDate),
          isInstance: false,
        } : undefined,
      }
      
      await addTask(newTask)
      setTitle("")
      setProject("")
      setPersistent(false)
      setEstimatedDuration("")
      setRecurrence(null)
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
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center justify-between">
            <span>Create New Task</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTemplateLibraryOpen(true)}
              className="ml-2 min-h-[44px] sm:min-h-0"
            >
              <FileText className="h-4 w-4 mr-1" />
              Templates
            </Button>
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {effectiveDate?.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Time: {displayTime}
            </p>
          </div>
          
          <Input 
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)} 
            required
            className="min-h-[44px] sm:min-h-0"
          />
          
          <Select value={project} onValueChange={(value) => setProject(value as ProjectName)}>
            <SelectTrigger className="min-h-[44px] sm:min-h-0">
              <SelectValue placeholder="Select project (optional)" />
            </SelectTrigger>
            <SelectContent>
              {availableProjects.map((project) => (
                <SelectItem key={project.id} value={project.title} className="min-h-[44px] sm:min-h-0">
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div>
            <Input
              type="number"
              placeholder="Estimated duration (minutes)"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              min={1}
              className="min-h-[44px] sm:min-h-0"
            />
          </div>

          {/* Recurrence selector (AC1, AC2) */}
          <RecurrenceSelector
            value={recurrence}
            onChange={(newRecurrence) => {
              setRecurrence(newRecurrence)
              // If recurrence is set, uncheck persistent
              if (newRecurrence && newRecurrence.interval > 0) {
                setPersistent(false)
              }
            }}
            startDate={effectiveDate ?? undefined}
            disabled={persistent}
          />
          
          <div className="flex items-center space-x-2 min-h-[44px] sm:min-h-0">
            <Checkbox 
              id="persistent"
              checked={persistent}
              onCheckedChange={(checked) => {
                setPersistent(checked as boolean)
                // If persistent is checked, clear recurrence
                if (checked) {
                  setRecurrence(null)
                }
              }}
              className="h-5 w-5 sm:h-4 sm:w-4"
            />
            <label 
              htmlFor="persistent" 
              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Make task persistent (shows on all days until completed)
            </label>
          </div>
          
          <Button type="submit" className="w-full min-h-[48px] sm:w-auto sm:min-h-0">
            Create Task
          </Button>
        </form>

        {/* Template Library Dialog */}
        <TemplateLibrary
          open={templateLibraryOpen}
          onOpenChange={setTemplateLibraryOpen}
          onSelectTemplate={applyTemplate}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

export default CreateTaskDialog 