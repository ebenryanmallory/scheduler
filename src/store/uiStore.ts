import { create } from 'zustand'

interface UIState {
  isEditDialogOpen: boolean
  taskToEdit: string | null
  setEditDialogOpen: (isOpen: boolean) => void
  setTaskToEdit: (taskId: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  isEditDialogOpen: false,
  taskToEdit: null,
  setEditDialogOpen: (isOpen) => set({ isEditDialogOpen: isOpen }),
  setTaskToEdit: (taskId) => set({ taskToEdit: taskId })
})) 