import { create } from 'zustand'
import { IdeaType } from '@/types/idea'
import { ideaService } from './ideaService'

interface IdeaStore {
  ideas: IdeaType[]
  isLoading: boolean
  error: string | null
  fetchIdeas: () => Promise<void>
  addIdea: (idea: Omit<IdeaType, 'id' | 'createdAt'>) => Promise<void>
  updateIdea: (id: string, idea: Partial<IdeaType>) => Promise<void>
  deleteIdea: (id: string) => Promise<void>
  reorderIdeas: (ideas: IdeaType[]) => Promise<void>
}

export const useIdeaStore = create<IdeaStore>((set, get) => ({
  ideas: [],
  isLoading: false,
  error: null,

  fetchIdeas: async () => {
    set({ isLoading: true, error: null })
    try {
      const ideas = await ideaService.fetchIdeas()
      set({ ideas, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  addIdea: async (idea) => {
    set({ isLoading: true, error: null })
    
    try {
      // Create the idea on the server
      await ideaService.createIdea(idea)
      
      // Refresh the entire ideas list from the server to ensure sync
      await get().fetchIdeas()
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false
      })
    }
  },

  updateIdea: async (id, updatedIdea) => {
    set({ isLoading: true, error: null })
    try {
      await ideaService.updateIdea(id, updatedIdea)
      set(state => ({
        ideas: state.ideas.map(idea => 
          idea.id === id ? { ...idea, ...updatedIdea } : idea
        ),
        isLoading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  deleteIdea: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await ideaService.deleteIdea(id)
      set(state => ({
        ideas: state.ideas.filter(idea => idea.id !== id),
        isLoading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  reorderIdeas: async (ideas) => {
    set({ isLoading: true, error: null })
    try {
      await ideaService.reorderIdeas(ideas)
      set({ ideas, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  }
})) 