/**
 * ScheduleConfirmDialog Component
 * Confirmation modal for significant time changes (>1 hour) (AC11)
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Clock, ArrowRight, AlertTriangle } from 'lucide-react'

interface ScheduleConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel: () => void
  taskTitle: string
  previousTime?: string | null
  newTime: string
  timeDifferenceMinutes: number
}

export function ScheduleConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  taskTitle,
  previousTime,
  newTime,
  timeDifferenceMinutes,
}: ScheduleConfirmDialogProps) {
  const hours = Math.floor(Math.abs(timeDifferenceMinutes) / 60)
  const minutes = Math.abs(timeDifferenceMinutes) % 60
  const isSignificantChange = Math.abs(timeDifferenceMinutes) >= 60

  const formatTime = (time: string | null | undefined): string => {
    if (!time) return 'Unscheduled'
    try {
      // Handle ISO string
      if (time.includes('T')) {
        const date = new Date(time)
        const hours = date.getHours()
        const mins = date.getMinutes()
        const period = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12
        return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
      }
      // Handle HH:mm format
      const [h, m] = time.split(':').map(Number)
      const period = h >= 12 ? 'PM' : 'AM'
      const displayHours = h % 12 || 12
      return `${displayHours}:${m.toString().padStart(2, '0')} ${period}`
    } catch {
      return time
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSignificantChange && (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            Confirm Schedule Change
          </DialogTitle>
          <DialogDescription>
            You're about to make a significant change to your schedule.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {/* Task title */}
          <div className="text-sm">
            <span className="text-muted-foreground">Task:</span>
            <span className="ml-2 font-medium">{taskTitle}</span>
          </div>

          {/* Time change visualization */}
          <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">From</div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatTime(previousTime)}</span>
              </div>
            </div>
            
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">To</div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">{formatTime(newTime)}</span>
              </div>
            </div>
          </div>

          {/* Time difference */}
          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              {previousTime 
                ? `This is a ${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ` : ''}${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''} ${timeDifferenceMinutes > 0 ? 'later' : 'earlier'}`
                : 'This task was previously unscheduled'
              }
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Confirm Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ScheduleConfirmDialog

