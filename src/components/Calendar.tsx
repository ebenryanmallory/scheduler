import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { TaskType } from "@/types/task"
import { taskService } from "@/services/taskService"

import TimeBlocksPanel from './TimeBlocksPanel'
import { TaskList } from "./TaskList"
import CreateTaskDialog from './CreateTaskDialog'
import { EditTaskDialog } from './EditTaskDialog'

interface TaskState {
  tasks: TaskType[]
  taskToEdit: TaskType | null
}

interface DialogState {
  isCreateOpen: boolean
  isEditOpen: boolean
  selectedTimeBlock: number
  selectedTime: string | undefined
}

function ScheduleView() {
  const [date, setDate] = useState<Date>(new Date())
  
  // Task-related state
  const [{ tasks, taskToEdit }, setTaskState] = useState<TaskState>({
    tasks: [],
    taskToEdit: null
  })

  // Dialog-related state
  const [{ isCreateOpen, isEditOpen, selectedTimeBlock, selectedTime }, setDialogState] = 
    useState<DialogState>({
      isCreateOpen: false,
      isEditOpen: false,
      selectedTimeBlock: 0,
      selectedTime: undefined
    })

  useEffect(() => {
    loadTasks(date)
  }, [date])

  const loadTasks = async (date: Date) => {
    try {
      const tasks = await taskService.fetchTasks(date)
      setTaskState(prev => ({ ...prev, tasks }))
    } catch (error) {
      console.error('Failed to load tasks:', error)
      // TODO: Add error handling UI
    }
  }

  const handleAddTask = (blockIndex: number, time: string) => {
    setDialogState(prev => ({
      ...prev,
      selectedTimeBlock: blockIndex,
      selectedTime: time,
      isCreateOpen: true
    }))
  }

  const handleEditTask = (task: TaskType) => {
    setTaskState(prev => {
        return { ...prev, taskToEdit: task }
    })
    setDialogState(prev => {
        return { ...prev, isEditOpen: true }
    })
  }

  // CRUD Operations
  const handleTaskCreate = async (task: TaskType) => {
    try {
      await taskService.createTask(task, date)
      await loadTasks(date)
    } catch (error) {
      console.error('Failed to create task:', error)
      // TODO: Add error handling UI
    }
  }

  const handleTaskUpdate = async (updatedTask: TaskType) => {
    try {
      await taskService.updateTask(updatedTask)
      await loadTasks(date)
    } catch (error) {
      console.error('Failed to update task:', error)
      // TODO: Add error handling UI
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    console.log('Deleting task:', taskId)
    try {
      await taskService.deleteTask(taskId)
      await loadTasks(date)
    } catch (error) {
      console.error('Failed to delete task:', error)
      // TODO: Add error handling UI
    }
  }

  const handleTasksReorder = async (reorderedTasks: TaskType[]) => {
    setTaskState(prev => ({ ...prev, tasks: reorderedTasks }))
    try {
      await taskService.reorderTasks(reorderedTasks)
    } catch (error) {
      console.error('Failed to save task order:', error)
      // TODO: Add error handling UI
    }
  }

  return (
    <div className="flex flex-row gap-4">
      <div className="rounded-md border">
        <Calendar 
          mode="single"
          selected={date}
          onSelect={(newDate) => newDate && setDate(newDate)}
          className="p-2"
        />
      </div>

      <TimeBlocksPanel 
        selectedDate={date}
        onAddTask={handleAddTask}
        tasks={tasks}
      />

      <TaskList
        tasks={tasks}
        onTasksReorder={handleTasksReorder}
        onTaskUpdate={handleTaskUpdate}
        onEdit={handleEditTask}
        onDelete={handleTaskDelete}
      />

      <CreateTaskDialog
        open={isCreateOpen}
        onOpenChange={(open) => setDialogState(prev => ({ ...prev, isCreateOpen: open }))}
        selectedDate={date}
        selectedTimeBlock={selectedTimeBlock}
        selectedTime={selectedTime || ''}
        onTaskCreate={handleTaskCreate}
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
  )
}

export default ScheduleView 