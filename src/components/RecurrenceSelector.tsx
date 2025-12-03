/**
 * RecurrenceSelector Component (AC1, AC2)
 * UI for configuring task recurrence patterns
 */

import { useState, useEffect, useMemo } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Calendar } from './ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'
import { CalendarIcon, Repeat, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  RecurrenceConfig,
  RecurrenceFrequency,
  Weekday,
  RECURRENCE_PRESETS,
  WEEKDAY_LABELS,
} from '@/types/recurrence'
import {
  configToRRuleString,
  getNextOccurrences,
  isValidRecurrence,
  describeRecurrence,
} from '@/lib/recurrence'

interface RecurrenceSelectorProps {
  /** Current recurrence config */
  value?: RecurrenceConfig | null
  /** Callback when recurrence changes */
  onChange: (config: RecurrenceConfig | null) => void
  /** Start date for the recurrence (task date) */
  startDate?: Date
  /** Whether the selector is disabled */
  disabled?: boolean
}

const ALL_WEEKDAYS: Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

export function RecurrenceSelector({
  value,
  onChange,
  startDate = new Date(),
  disabled = false,
}: RecurrenceSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCustomBuilder, setShowCustomBuilder] = useState(false)
  
  // Local state for building custom recurrence
  const [config, setConfig] = useState<RecurrenceConfig>(() => 
    value ?? {
      frequency: 'daily',
      interval: 1,
      endType: 'never',
    }
  )

  // Sync external value changes
  useEffect(() => {
    if (value) {
      setConfig(value)
      setShowCustomBuilder(value.frequency === 'custom')
    }
  }, [value])

  // Selected preset
  const selectedPreset = useMemo(() => {
    if (!value || value.interval === 0) return 'none'
    if (value.frequency === 'custom') return 'custom'
    
    // Try to match a preset
    const match = RECURRENCE_PRESETS.find(preset => {
      if (preset.config.frequency !== value.frequency) return false
      if (preset.config.interval !== value.interval) return false
      if (preset.config.byWeekday?.length !== value.byWeekday?.length) return false
      return true
    })
    
    return match?.label.toLowerCase() ?? 'custom'
  }, [value])

  // Generate preview of next occurrences
  const nextOccurrences = useMemo(() => {
    if (!value || value.interval === 0) return []
    try {
      const rruleString = configToRRuleString(value, startDate)
      return getNextOccurrences(rruleString, 3, startDate)
    } catch {
      return []
    }
  }, [value, startDate])

  // Handle preset selection
  const handlePresetChange = (presetLabel: string) => {
    if (presetLabel === 'none') {
      onChange(null)
      setShowCustomBuilder(false)
      return
    }

    if (presetLabel === 'custom') {
      setShowCustomBuilder(true)
      const customConfig: RecurrenceConfig = {
        frequency: 'weekly',
        interval: 1,
        byWeekday: [ALL_WEEKDAYS[startDate.getDay() === 0 ? 6 : startDate.getDay() - 1]],
        endType: 'never',
      }
      setConfig(customConfig)
      onChange(customConfig)
      return
    }

    const preset = RECURRENCE_PRESETS.find(p => p.label.toLowerCase() === presetLabel)
    if (preset) {
      const newConfig: RecurrenceConfig = {
        ...preset.config,
        frequency: preset.config.frequency ?? 'daily',
        interval: preset.config.interval ?? 1,
        endType: preset.config.endType ?? 'never',
      }
      setConfig(newConfig)
      onChange(newConfig)
      setShowCustomBuilder(false)
    }
  }

  // Update custom config
  const updateConfig = (updates: Partial<RecurrenceConfig>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    if (isValidRecurrence(newConfig)) {
      onChange(newConfig)
    }
  }

  // Toggle weekday
  const toggleWeekday = (weekday: Weekday) => {
    const current = config.byWeekday ?? []
    const newWeekdays = current.includes(weekday)
      ? current.filter(w => w !== weekday)
      : [...current, weekday]
    updateConfig({ byWeekday: newWeekdays })
  }

  return (
    <div className="space-y-3">
      {/* Collapsed view - just a button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            <span>
              {!value || value.interval === 0
                ? 'Does not repeat'
                : selectedPreset === 'custom'
                ? describeRecurrence(configToRRuleString(value, startDate))
                : RECURRENCE_PRESETS.find(p => p.label.toLowerCase() === selectedPreset)?.label ?? 'Custom'}
            </span>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          {/* Preset selector */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              type="button"
              variant={selectedPreset === 'none' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange('none')}
            >
              None
            </Button>
            <Button
              type="button"
              variant={selectedPreset === 'daily' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange('daily')}
            >
              Daily
            </Button>
            <Button
              type="button"
              variant={selectedPreset === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange('weekly')}
            >
              Weekly
            </Button>
            <Button
              type="button"
              variant={selectedPreset === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange('monthly')}
            >
              Monthly
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={selectedPreset === 'weekdays' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange('weekdays')}
              className="flex-1"
            >
              Weekdays
            </Button>
            <Button
              type="button"
              variant={selectedPreset === 'bi-weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange('bi-weekly')}
              className="flex-1"
            >
              Bi-weekly
            </Button>
            <Button
              type="button"
              variant={showCustomBuilder ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange('custom')}
              className="flex-1"
            >
              Custom
            </Button>
          </div>

          {/* Custom builder */}
          {showCustomBuilder && (
            <div className="space-y-4 pt-4 border-t">
              {/* Frequency and interval */}
              <div className="flex items-center gap-2">
                <Label className="text-sm">Every</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={config.interval}
                  onChange={(e) => updateConfig({ interval: parseInt(e.target.value) || 1 })}
                  className="w-16"
                />
                <Select
                  value={config.frequency}
                  onValueChange={(v) => updateConfig({ frequency: v as RecurrenceFrequency })}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">day(s)</SelectItem>
                    <SelectItem value="weekly">week(s)</SelectItem>
                    <SelectItem value="monthly">month(s)</SelectItem>
                    <SelectItem value="yearly">year(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Weekday selector for weekly */}
              {(config.frequency === 'weekly' || config.frequency === 'custom') && (
                <div className="space-y-2">
                  <Label className="text-sm">On days</Label>
                  <div className="flex gap-1">
                    {ALL_WEEKDAYS.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant={(config.byWeekday ?? []).includes(day) ? 'default' : 'outline'}
                        size="sm"
                        className="w-10 h-10 p-0"
                        onClick={() => toggleWeekday(day)}
                      >
                        {WEEKDAY_LABELS[day]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Day of month for monthly */}
              {config.frequency === 'monthly' && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm">On day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={config.byMonthDay ?? startDate.getDate()}
                    onChange={(e) => updateConfig({ byMonthDay: parseInt(e.target.value) || 1 })}
                    className="w-16"
                  />
                  <span className="text-sm text-muted-foreground">of the month</span>
                </div>
              )}

              {/* End condition */}
              <div className="space-y-2">
                <Label className="text-sm">Ends</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={config.endType === 'never'}
                      onCheckedChange={() => updateConfig({ endType: 'never', count: undefined, until: undefined })}
                    />
                    <span className="text-sm">Never</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={config.endType === 'count'}
                      onCheckedChange={() => updateConfig({ endType: 'count', count: 10, until: undefined })}
                    />
                    <span className="text-sm">After</span>
                    {config.endType === 'count' && (
                      <>
                        <Input
                          type="number"
                          min={1}
                          max={999}
                          value={config.count ?? 10}
                          onChange={(e) => updateConfig({ count: parseInt(e.target.value) || 1 })}
                          className="w-16"
                        />
                        <span className="text-sm">occurrences</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={config.endType === 'until'}
                      onCheckedChange={() => {
                        const untilDate = new Date()
                        untilDate.setMonth(untilDate.getMonth() + 3)
                        updateConfig({ 
                          endType: 'until', 
                          until: untilDate.toISOString(),
                          count: undefined 
                        })
                      }}
                    />
                    <span className="text-sm">On</span>
                    {config.endType === 'until' && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              'justify-start text-left font-normal',
                              !config.until && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {config.until
                              ? format(new Date(config.until), 'PPP')
                              : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={config.until ? new Date(config.until) : undefined}
                            onSelect={(date) => date && updateConfig({ until: date.toISOString() })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview next occurrences */}
          {nextOccurrences.length > 0 && (
            <div className="pt-3 border-t">
              <Label className="text-sm text-muted-foreground">Next occurrences:</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {nextOccurrences.map((date, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                  >
                    {format(date, 'EEE, MMM d')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RecurrenceSelector

