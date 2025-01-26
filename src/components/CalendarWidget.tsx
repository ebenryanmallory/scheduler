import { Calendar } from "@/components/ui/calendar"

interface CalendarWidgetProps {
  selected: Date
  onSelect: (date: Date | undefined) => void
}

function CalendarWidget({ selected, onSelect }: CalendarWidgetProps) {
  return (
    <div className="rounded-md border">
      <Calendar 
        mode="single"
        selected={selected}
        onSelect={onSelect}
        className="p-2"
      />
    </div>
  )
}

export default CalendarWidget 