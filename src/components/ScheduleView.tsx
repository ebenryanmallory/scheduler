import { useState, useEffect, useMemo, useCallback } from "react"
import { useTaskStore } from '../store/taskStore'
import TimeBlocksPanel from './TimeBlocksPanel'
import { TaskList } from "./TaskList"
import CreateTaskDialog from './modals/CreateTaskDialog'
import { EditTaskDialog } from './modals/EditTaskDialog'
import CalendarWidget from './CalendarWidget'
import IdeasWidget from './IdeasWidget'
import ProjectsWidget from './ProjectsWidget'
import DocsWidget from './DocsWidget'
import { ErrorFallback } from './ErrorBoundary'
import { DragDropScheduleProvider } from './DragDropScheduleProvider'
import type { ScheduleViewProps, DialogState } from "@/types/schedule"
import type { TaskType } from "@/types/task"
import { getTimeStringFromISO } from "@/utils/timeUtils"
import { useIsMobile, useIsDesktop } from "@/hooks/useMediaQuery"
import { CollapsibleSection } from './mobile/CollapsibleSection'

function ScheduleView({ selectedDate, onDateSelect }: ScheduleViewProps) {
  const defaultDate = useMemo(() => selectedDate || new Date(), [selectedDate])
  const isMobile = useIsMobile()
  const isDesktop = useIsDesktop()

  const { 
    tasks,
    isCreateDialogOpen,
    isLoading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    setCreateDialogOpen,
    selectedTime,
    setSelectedTime,
    setSelectedDate,
    clearError,
    retryLastFetch
  } = useTaskStore()

  // Dialog-related state
  const [{ isEditOpen, taskToEdit }, setDialogState] = 
    useState<DialogState>({
      isEditOpen: false,
      taskToEdit: null,
      selectedTimeBlock: 0,
      selectedTime: undefined
    })

  useEffect(() => {
    setSelectedDate(defaultDate)
    fetchTasks(defaultDate)
  }, [defaultDate, fetchTasks, setSelectedDate])

  const handleAddTask = (_blockIndex: number, time: string) => {
    setSelectedTime(getTimeStringFromISO(time))
    setSelectedDate(defaultDate)
    setCreateDialogOpen(true)
  }

  // Memoize callbacks to prevent infinite re-render loops
  const handleTaskUpdate = useCallback((task: TaskType) => {
    updateTask(task.id, task)
  }, [updateTask])

  const handleTaskEdit = useCallback((task: TaskType) => {
    setDialogState(prev => ({ ...prev, taskToEdit: task, isEditOpen: true }))
  }, [])

  // Loading state
  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    )
  }

  // Error state with retry (AC5, AC10)
  if (error && tasks.length === 0) {
    return (
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <CalendarWidget 
            selected={defaultDate}
            onSelect={(newDate) => newDate && onDateSelect(newDate)}
          />
        </div>
        <div className="flex-1">
          <ErrorFallback
            error={new Error(error)}
            title="Failed to load tasks"
            message={error}
            onReset={() => {
              clearError();
              retryLastFetch();
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <DragDropScheduleProvider tasks={tasks}>
      {/* Mobile: stacked vertical layout */}
      {isMobile ? (
        <div className="flex flex-col gap-4">
          {/* Calendar always visible on mobile */}
          <CalendarWidget 
            selected={defaultDate}
            onSelect={(newDate) => newDate && onDateSelect(newDate)}
          />

          {/* Time Blocks - collapsible on mobile */}
          <CollapsibleSection 
            title="Schedule" 
            storageKey="mobile-schedule"
            defaultOpen={true}
          >
            <TimeBlocksPanel 
              selectedDate={defaultDate}
              onAddTask={handleAddTask}
              tasks={tasks}
            />
          </CollapsibleSection>

          {/* Task List */}
          <CollapsibleSection 
            title={`Tasks (${tasks.length})`}
            storageKey="mobile-tasks"
            defaultOpen={true}
          >
            <TaskList
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
              onEdit={handleTaskEdit}
              onDelete={deleteTask}
            />
          </CollapsibleSection>

          <CreateTaskDialog
            open={isCreateDialogOpen}
            onOpenChange={setCreateDialogOpen}
            selectedDate={defaultDate}
            selectedTime={selectedTime || ''}
            onTaskCreate={addTask}
          />

          {taskToEdit && (
            <EditTaskDialog
              open={isEditOpen}
              onOpenChange={(open) => setDialogState(prev => ({ ...prev, isEditOpen: open }))}
              task={taskToEdit}
              onTaskUpdate={handleTaskUpdate}
            />
          )}
        </div>
      ) : (
        /* Tablet/Desktop: side-by-side layout */
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left sidebar - Calendar and widgets */}
          <div className="flex flex-col gap-4 w-full lg:w-auto lg:min-w-[280px]">
            <CalendarWidget 
              selected={defaultDate}
              onSelect={(newDate) => newDate && onDateSelect(newDate)}
            />
            {isDesktop && (
              <>
                <IdeasWidget />
                <ProjectsWidget />
                <DocsWidget />
              </>
            )}
          </div>

          {/* Middle - Time Blocks */}
          <TimeBlocksPanel 
            selectedDate={defaultDate}
            onAddTask={handleAddTask}
            tasks={tasks}
          />

          {/* Right - Task List */}
          <div className="flex-1 min-w-0">
            <TaskList
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
              onEdit={handleTaskEdit}
              onDelete={deleteTask}
            />
          </div>

          <CreateTaskDialog
            open={isCreateDialogOpen}
            onOpenChange={setCreateDialogOpen}
            selectedDate={defaultDate}
            selectedTime={selectedTime || ''}
            onTaskCreate={addTask}
          />

          {taskToEdit && (
            <EditTaskDialog
              open={isEditOpen}
              onOpenChange={(open) => setDialogState(prev => ({ ...prev, isEditOpen: open }))}
              task={taskToEdit}
              onTaskUpdate={handleTaskUpdate}
            />
          )}
        </div>
      )}
    </DragDropScheduleProvider>
  )
}

export default ScheduleView
