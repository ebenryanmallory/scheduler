import { create } from 'zustand'
import type { TaskType } from '../types/task'
import { taskService } from './taskService'
import { errorService } from '@/services/errorService'

interface TaskState {
  tasks: TaskType[]
  selectedDate: Date | null
  selectedTimeBlock: number | undefined
  isCreateDialogOpen: boolean
  isLoading: boolean
  error: string | null
  selectedTime: string | undefined
  setTasks: (tasks: TaskType[]) => void
  fetchTasks: (date: Date) => Promise<void>
  addTask: (task: TaskType) => Promise<void>
  updateTask: (taskId: string, updates: Partial<TaskType>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  reorderTasks: (tasks: TaskType[]) => Promise<void>
  setSelectedDate: (date: Date | null) => void
  setSelectedTimeBlock: (block: number | undefined) => void
  setCreateDialogOpen: (isOpen: boolean) => void
  setError: (error: string | null) => void
  setSelectedTime: (time: string | undefined) => void
  clearError: () => void
  retryLastFetch: () => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedDate: null,
  selectedTimeBlock: undefined,
  isCreateDialogOpen: false,
  isLoading: false,
  error: null,
  selectedTime: undefined,
  
  setTasks: (tasks) => set({ tasks }),
  
  fetchTasks: async (date: Date) => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskService.fetchTasks(date);
      set({ tasks, isLoading: false });
    } catch (error) {
      // Use errorService for user-friendly messages (AC2, AC9)
      set({ error: errorService.getUserMessage(error), isLoading: false });
    }
  },

  addTask: async (task: TaskType) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const { selectedDate, selectedTime } = state;
      
      if (!selectedDate || !selectedTime) {
        throw new Error('Missing required date/time for task creation');
      }
      
      const newTask = await taskService.createTask(task, selectedDate);
      
      set((currentState) => ({
        tasks: [...currentState.tasks, newTask],
        isLoading: false,
        isCreateDialogOpen: false,
        selectedTime: undefined,
        selectedDate: null
      }));
    } catch (error) {
      set({ error: errorService.getUserMessage(error), isLoading: false });
      throw error; // Re-throw for toast handling
    }
  },

  updateTask: async (taskId: string, updates: Partial<TaskType>) => {
    set({ isLoading: true, error: null });
    try {
      const currentTask = get().tasks.find(task => task.id === taskId);
      if (!currentTask) throw new Error('Task not found');
      
      const updatedTask = { ...currentTask, ...updates };
      await taskService.updateTask(updatedTask);
      
      set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? updatedTask : task
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: errorService.getUserMessage(error), isLoading: false });
      throw error;
    }
  },

  deleteTask: async (taskId: string) => {
    set({ isLoading: true, error: null });
    try {
      await taskService.deleteTask(taskId);
      set((state) => ({
        tasks: state.tasks.filter(task => task.id !== taskId),
        isLoading: false
      }));
    } catch (error) {
      set({ error: errorService.getUserMessage(error), isLoading: false });
      throw error;
    }
  },

  reorderTasks: async (tasks: TaskType[]) => {
    set({ isLoading: true, error: null });
    try {
      await taskService.reorderTasks(tasks);
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ error: errorService.getUserMessage(error), isLoading: false });
    }
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedTimeBlock: (block) => set({ selectedTimeBlock: block }),
  setCreateDialogOpen: (isOpen) => set({ isCreateDialogOpen: isOpen }),
  setError: (error) => set({ error }),
  setSelectedTime: (time) => set({ selectedTime: time }),
  clearError: () => set({ error: null }),
  
  // AC10: Manual retry option
  retryLastFetch: async () => {
    const state = get();
    if (state.selectedDate) {
      await get().fetchTasks(state.selectedDate);
    }
  }
})) 