"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function TimePicker({ date, setDate }: TimePickerProps) {
  const minuteItems = []
  for (let i = 0; i < 60; i += 5) {
    minuteItems.push(i.toString().padStart(2, "0"))
  }

  const hourItems = []
  for (let i = 0; i < 24; i++) {
    hourItems.push(i.toString().padStart(2, "0"))
  }

  const handleHourChange = (hour: string) => {
    if (!date) return

    const newDate = new Date(date)
    newDate.setHours(parseInt(hour))
    setDate(newDate)
  }

  const handleMinuteChange = (minute: string) => {
    if (!date) return

    const newDate = new Date(date)
    newDate.setMinutes(parseInt(minute))
    setDate(newDate)
  }

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1.5">
        <Label htmlFor="hours">Hours</Label>
        <Select
          value={date?.getHours().toString().padStart(2, "0")}
          onValueChange={handleHourChange}
        >
          <SelectTrigger id="hours" className="w-[110px]">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent position="popper">
            {hourItems.map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="minutes">Minutes</Label>
        <Select
          value={date?.getMinutes().toString().padStart(2, "0")}
          onValueChange={handleMinuteChange}
        >
          <SelectTrigger id="minutes" className="w-[110px]">
            <SelectValue placeholder="Minute" />
          </SelectTrigger>
          <SelectContent position="popper">
            {minuteItems.map((minute) => (
              <SelectItem key={minute} value={minute}>
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex h-10 items-center">
        <Clock className="ml-2 h-4 w-4" />
      </div>
    </div>
  )
} 