/**
 * RecurrenceEditDialog Component (AC4)
 * Modal to choose edit scope for recurring tasks
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
import { Repeat, CalendarDays, CalendarRange, Calendar } from 'lucide-react'

export type EditScope = 'this' | 'this_and_future' | 'all'

interface RecurrenceEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (scope: EditScope) => void
  taskTitle: string
}

export function RecurrenceEditDialog({
  open,
  onOpenChange,
  onSelect,
  taskTitle,
}: RecurrenceEditDialogProps) {
  const handleSelect = (scope: EditScope) => {
    onSelect(scope)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Edit Recurring Task
          </DialogTitle>
          <DialogDescription>
            "{taskTitle}" is part of a recurring series. What would you like to edit?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4"
            onClick={() => handleSelect('this')}
          >
            <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
            <div className="text-left">
              <div className="font-medium">This occurrence only</div>
              <div className="text-xs text-muted-foreground">
                Edit just this one instance
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4"
            onClick={() => handleSelect('this_and_future')}
          >
            <CalendarRange className="h-5 w-5 mr-3 text-muted-foreground" />
            <div className="text-left">
              <div className="font-medium">This and future occurrences</div>
              <div className="text-xs text-muted-foreground">
                Split the series and edit from this point forward
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4"
            onClick={() => handleSelect('all')}
          >
            <CalendarDays className="h-5 w-5 mr-3 text-muted-foreground" />
            <div className="text-left">
              <div className="font-medium">All occurrences</div>
              <div className="text-xs text-muted-foreground">
                Update the entire series
              </div>
            </div>
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

export default RecurrenceEditDialog

