import { IdeaType } from "@/types/idea"
import { withRetry } from "@/services/retryService"
import { authFetch } from "@/services/authFetch"

const API_URL = '/api'

export const ideaService = {
  async fetchIdeas(): Promise<IdeaType[]> {
    const response = await withRetry(() =>
      authFetch(`${API_URL}/ideas`).then(res => {
        if (!res.ok) {
          const error = new Error(`HTTP ${res.status}`) as Error & { status: number }
          error.status = res.status
          throw error
        }
        return res
      })
    )
    return response.json()
  },

  async createIdea(idea: Omit<IdeaType, 'createdAt'>): Promise<IdeaType> {
    const response = await authFetch(`${API_URL}/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(idea),
    })
    if (!response.ok) throw new Error('Failed to create idea')
    return response.json()
  },

  async updateIdea(id: string, idea: Partial<IdeaType>): Promise<void> {
    const response = await authFetch(`${API_URL}/ideas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(idea),
    })
    if (!response.ok) throw new Error('Failed to update idea')
  },

  async deleteIdea(id: string): Promise<void> {
    const response = await authFetch(`${API_URL}/ideas/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Failed to delete idea')
  },

  async reorderIdeas(ideas: IdeaType[]): Promise<void> {
    const response = await authFetch(`${API_URL}/ideas/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ideas),
    })
    if (!response.ok) throw new Error('Failed to reorder ideas')
  },
}
