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

function ScheduleView({ selectedDate, onDateSelect, onTimeBlockSelect }: ScheduleViewProps) {
  const defaultDate = useMemo(() => selectedDate || new Date(), [selectedDate])

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
  const [{ isEditOpen, taskToEdit, selectedTimeBlock: dialogSelectedTimeBlock, selectedTime: dialogSelectedTime }, setDialogState] = 
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

  const handleAddTask = (blockIndex: number, time: string) => {
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
      <div className="flex flex-row gap-4">
        <div className="flex flex-col gap-4">
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
      <div className="flex flex-row gap-4">
        <div className="flex flex-col gap-4">
          <CalendarWidget 
            selected={defaultDate}
            onSelect={(newDate) => newDate && onDateSelect(newDate)}
          />
          <IdeasWidget />
          <ProjectsWidget />
          <DocsWidget />
        </div>

        <TimeBlocksPanel 
          selectedDate={defaultDate}
          onAddTask={handleAddTask}
          tasks={tasks}
        />

        <TaskList
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onEdit={handleTaskEdit}
          onDelete={deleteTask}
        />

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
    </DragDropScheduleProvider>
  )
}

export default ScheduleView
