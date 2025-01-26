import { IdeaType } from "@/types/idea"

const API_URL = 'http://localhost:3001/api'

export const ideaService = {
  async fetchIdeas(): Promise<IdeaType[]> {
    const response = await fetch(`${API_URL}/ideas`)
    if (!response.ok) {
      throw new Error('Failed to fetch ideas')
    }
    return response.json()
  },

  async createIdea(idea: Omit<IdeaType, 'id' | 'createdAt'>): Promise<IdeaType> {
    const response = await fetch(`${API_URL}/ideas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(idea),
    })

    if (!response.ok) {
      throw new Error('Failed to create idea')
    }
    return response.json()
  },

  async updateIdea(id: string, idea: Partial<IdeaType>): Promise<void> {
    const response = await fetch(`${API_URL}/ideas/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(idea),
    })

    if (!response.ok) {
      throw new Error('Failed to update idea')
    }
  },

  async deleteIdea(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/ideas/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete idea')
    }
  },

  async reorderIdeas(ideas: IdeaType[]): Promise<void> {
    const response = await fetch(`${API_URL}/ideas/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ideas),
    })

    if (!response.ok) {
      throw new Error('Failed to reorder ideas')
    }
  }
} 