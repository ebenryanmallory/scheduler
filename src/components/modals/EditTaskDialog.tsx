import { useState, useEffect } from 'react'
import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle 
} from '../ui/responsive-dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { EditTaskDialogProps } from '@/types/editTaskDialog'
import { ProjectName, useProjectStore } from '@/store/projectStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { formatTimeHHMMSS } from '@/hooks/useTimer'
import { RecurrenceSelector } from '@/components/RecurrenceSelector'
import { RecurrenceConfig } from '@/types/recurrence'
import { configToRRuleString, parseRRuleString, isRecurring, isRecurringInstance } from '@/lib/recurrence'
import { Badge } from '../ui/badge'
import { Repeat } from 'lucide-react'

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
  onTaskUpdate,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [project, setProject] = useState<ProjectName | undefined>(task.project)
  const [scheduledTime, setScheduledTime] = useState(task.scheduledTime)
  const [persistent, setPersistent] = useState(task.persistent || false)
  const [estimatedDuration, setEstimatedDuration] = useState(task.estimatedDuration?.toString() || '')
  const [manualActualDuration, setManualActualDuration] = useState(task.actualDuration?.toString() || '')
  const [recurrence, setRecurrence] = useState<RecurrenceConfig | null>(() => {
    if (task.recurrence?.rruleString) {
      return parseRRuleString(task.recurrence.rruleString)
    }
    return null
  })
  
  const { getDisplayProjects } = useProjectStore()
  const projects = getDisplayProjects();
  
  // Check if this is a recurring task instance
  const isInstance = isRecurringInstance(task.recurrence)
  const hasRecurrence = isRecurring(task.recurrence)
  
  // Reset state when dialog closes or task changes
  useEffect(() => {
    if (open) {
      setTitle(task.title)
      setDescription(task.description)
      setProject(task.project)
      setScheduledTime(task.scheduledTime)
      setPersistent(task.persistent || false)
      setEstimatedDuration(task.estimatedDuration?.toString() || '')
      setManualActualDuration(task.actualDuration?.toString() || '')
      setRecurrence(task.recurrence?.rruleString ? parseRRuleString(task.recurrence.rruleString) : null)
    }
  }, [open, task])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedTask = {
      id: task.id,
      title,
      description,
      project,
      scheduledTime,
      persistent,
      completed: task.completed,
      date: task.date,
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration, 10) : undefined,
      actualDuration: manualActualDuration ? parseInt(manualActualDuration, 10) : task.actualDuration,
      timeTracking: task.timeTracking,
      // Handle recurrence - preserve instance relationship if editing instance
      recurrence: isInstance 
        ? task.recurrence // Keep instance relationship
        : recurrence && recurrence.interval > 0 
          ? {
              rruleString: configToRRuleString(recurrence, task.date instanceof Date ? task.date : new Date(task.date)),
              isInstance: false,
            }
          : undefined,
    }
    onTaskUpdate(updatedTask)
    onOpenChange(false)
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[425px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            Edit Task
            {hasRecurrence && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Repeat className="h-3 w-3" />
                {isInstance ? 'Instance' : 'Series'}
              </Badge>
            )}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-h-[44px] sm:min-h-0"
            />
          </div>
          {!persistent && (
            <div>
              <Input
                type="datetime-local"
                value={scheduledTime?.slice(0, 16) || ''}
                onChange={(e) => setScheduledTime(new Date(e.target.value).toISOString())}
                className="min-h-[44px] sm:min-h-0"
              />
            </div>
          )}
          <div>
            <Select 
              value={project || "no-project"} 
              onValueChange={(value) => setProject(value === "no-project" ? undefined : value as ProjectName)}
            >
              <SelectTrigger className="min-h-[44px] sm:min-h-0">
                <SelectValue placeholder="Select a project (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-project" className="min-h-[44px] sm:min-h-0">No Project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.title} className="min-h-[44px] sm:min-h-0">
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          
          {/* Time Tracking Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="estimated-duration" className="text-xs text-muted-foreground">
                Estimated (minutes)
              </Label>
              <Input
                id="estimated-duration"
                type="number"
                placeholder="Est. minutes"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                min={1}
                className="min-h-[44px] sm:min-h-0"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="actual-duration" className="text-xs text-muted-foreground">
                Actual (minutes)
              </Label>
              <Input
                id="actual-duration"
                type="number"
                placeholder="Actual minutes"
                value={manualActualDuration}
                onChange={(e) => setManualActualDuration(e.target.value)}
                min={0}
                className="min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>
          
          {/* Recurrence selector - only show if not editing an instance */}
          {!isInstance && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Recurrence</Label>
              <RecurrenceSelector
                value={recurrence}
                onChange={setRecurrence}
                startDate={task.date instanceof Date ? task.date : new Date(task.date)}
              />
            </div>
          )}
          
          {/* Show info for instances */}
          {isInstance && (
            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                <span>Part of recurring series</span>
              </div>
              <p className="mt-1 text-xs">
                Editing this instance only. To edit the series, edit the original task.
              </p>
            </div>
          )}

          {/* Time Tracking History Display */}
          {task.timeTracking && task.timeTracking.history.length > 0 && (
            <div className="text-xs text-muted-foreground space-y-1">
              <Label className="text-xs">Time Tracking History</Label>
              <div className="max-h-24 overflow-y-auto space-y-1 p-2 bg-muted/50 rounded">
                {task.timeTracking.history.map((entry, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{new Date(entry.startedAt).toLocaleDateString()}</span>
                    <span className="font-mono">{formatTimeHHMMSS(entry.durationMs)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-medium pt-1 border-t">
                  <span>Total</span>
                  <span className="font-mono">{formatTimeHHMMSS(task.timeTracking.accumulatedMs)}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2 min-h-[44px] sm:min-h-0">
            <Checkbox 
              id="persistent-edit"
              checked={persistent}
              onCheckedChange={(checked: boolean) => setPersistent(checked)}
              className="h-5 w-5 sm:h-4 sm:w-4"
            />
            <label 
              htmlFor="persistent-edit" 
              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Make task persistent (shows on all days until completed)
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-h-[48px] sm:min-h-0"
            >
              Cancel
            </Button>
            <Button type="submit" className="min-h-[48px] sm:min-h-0">
              Save Changes
            </Button>
          </div>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
} 