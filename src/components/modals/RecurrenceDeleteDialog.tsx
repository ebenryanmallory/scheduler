/**
 * RecurrenceDeleteDialog Component (AC5)
 * Modal to choose delete scope for recurring tasks
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
import { Trash2, CalendarDays, CalendarRange, Calendar, AlertTriangle } from 'lucide-react'

export type DeleteScope = 'this' | 'this_and_future' | 'all'

interface RecurrenceDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (scope: DeleteScope) => void
  taskTitle: string
  /** Number of future occurrences that will be affected */
  futureCount?: number
}

export function RecurrenceDeleteDialog({
  open,
  onOpenChange,
  onSelect,
  taskTitle,
  futureCount = 0,
}: RecurrenceDeleteDialogProps) {
  const handleSelect = (scope: DeleteScope) => {
    onSelect(scope)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Recurring Task
          </DialogTitle>
          <DialogDescription>
            "{taskTitle}" is part of a recurring series. What would you like to delete?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 hover:border-destructive hover:text-destructive"
            onClick={() => handleSelect('this')}
          >
            <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
            <div className="text-left">
              <div className="font-medium">This occurrence only</div>
              <div className="text-xs text-muted-foreground">
                Remove just this one instance (others will remain)
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 hover:border-destructive hover:text-destructive"
            onClick={() => handleSelect('this_and_future')}
          >
            <CalendarRange className="h-5 w-5 mr-3 text-muted-foreground" />
            <div className="text-left">
              <div className="font-medium">This and future occurrences</div>
              <div className="text-xs text-muted-foreground">
                End the series from this point
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 hover:border-destructive hover:text-destructive"
            onClick={() => handleSelect('all')}
          >
            <CalendarDays className="h-5 w-5 mr-3 text-muted-foreground" />
            <div className="text-left flex-1">
              <div className="font-medium">All occurrences</div>
              <div className="text-xs text-muted-foreground">
                Delete the entire series
              </div>
            </div>
            {futureCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-1 rounded">
                <AlertTriangle className="h-3 w-3" />
                {futureCount} tasks
              </div>
            )}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RecurrenceDeleteDialog

