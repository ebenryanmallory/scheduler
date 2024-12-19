import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Task as TaskType } from "@/types/task"
import { Task } from "@/components/Task"
import TimeBlocksPanel from './TimeBlocksPanel'
import CreateTaskDialog from './CreateTaskDialog'
import { TaskList } from "./TaskList"
import EditTaskDialog from './EditTaskDialog'

function ScheduleView() {
  const [date, setDate] = useState<Date>(new Date())
  const [tasks, setTasks] = useState<TaskType[]>([])
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [selectedTimeBlock, setSelectedTimeBlock] = useState(0)
  const [selectedTime, setSelectedTime] = useState<string>()
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<TaskType | null>(null)
  const apiUrl = 'http://localhost:3001/api'

  useEffect(() => {
    if (date) {
      loadTasks(date)
    }
  }, [date])

  const loadTasks = async (date: Date) => {
    try {
      const response = await fetch(
        `${apiUrl}/tasks?date=${date.toISOString()}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const tasks = await response.json()
      setTasks(tasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
      // TODO: Add error handling UI
    }
  }

  const handleAddTask = (blockIndex: number, time: string) => {
    setSelectedTimeBlock(blockIndex)
    setSelectedTime(time)
    setIsCreateTaskOpen(true)
  }

  const handleTaskCreate = async (task: TaskType) => {
    try {
      const response = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...task,
          date: date.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create task')
      }

      // Reload tasks to ensure we have the latest data
      await loadTasks(date)
    } catch (error) {
      console.error('Failed to create task:', error)
      // TODO: Add error handling UI
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<TaskType>) => {
    try {
      const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      // Reload tasks to ensure we have the latest data
      await loadTasks(date)
      setIsEditTaskOpen(false)
      setTaskToEdit(null)
    } catch (error) {
      console.error('Failed to update task:', error)
      // TODO: Add error handling UI
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    try {
      const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      // Reload tasks to ensure we have the latest data
      await loadTasks(date)
    } catch (error) {
      console.error('Failed to delete task:', error)
      // TODO: Add error handling UI
    }
  }

  const handleTasksReorder = async (reorderedTasks: TaskType[]) => {
    // Add order field to each task based on new position
    const tasksWithOrder = reorderedTasks.map((task, index) => ({
      ...task,
      order: index
    }))
    
    setTasks(tasksWithOrder)
    
    try {
      // Update each task with its new order
      await Promise.all(tasksWithOrder.map(task => 
        fetch(`${apiUrl}/tasks/${task.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ order: task.order }),
        })
      ))
    } catch (error) {
      console.error('Failed to save task order:', error)
      // You might want to show an error toast here
    }
  }

  const handleEditTask = (task: TaskType) => {
    setTaskToEdit(task)
    setIsEditTaskOpen(true)
  }

  return (
    <div className="flex flex-row gap-4">
      <Calendar 
        mode="single"
        selected={date}
        onSelect={(newDate) => newDate && setDate(newDate)}
        className="rounded-md border"
      />
      
      <TaskList
        tasks={tasks}
        onTasksReorder={handleTasksReorder}
        onUpdate={handleEditTask}
        onDelete={handleTaskDelete}
      />

      <TimeBlocksPanel 
        selectedDate={date}
        onAddTask={handleAddTask}
        tasks={tasks}
      />

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        selectedDate={date}
        selectedTimeBlock={selectedTimeBlock}
        selectedTime={selectedTime}
        onTaskCreate={handleTaskCreate}
      />

      {taskToEdit && (
        <EditTaskDialog
          open={isEditTaskOpen}
          onOpenChange={setIsEditTaskOpen}
          task={taskToEdit}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </div>
  )
}

export default ScheduleView 