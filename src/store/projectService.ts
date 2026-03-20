import { Project } from '@/types/project'
import { withRetry } from "@/services/retryService"
import { authFetch } from "@/services/authFetch"

const API_URL = '/api'

export const projectService = {
  async fetchProjects(): Promise<Project[]> {
    const response = await withRetry(() =>
      authFetch(`${API_URL}/projects`).then(res => {
        if (!res.ok) {
          const error = new Error(`HTTP ${res.status}`) as Error & { status: number }
          error.status = res.status
          throw error
        }
        return res
      })
    )
    const data = await response.json()
    if (!Array.isArray(data)) {
      console.error('API returned non-array data:', data)
      return []
    }
    return data
  },

  async createProject(id: string, project: Partial<Project>): Promise<Project> {
    const response = await authFetch(`${API_URL}/projects/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    })
    if (!response.ok) throw new Error('Failed to create project')
    return response.json()
  },

  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    const response = await authFetch(`${API_URL}/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    })
    if (!response.ok) throw new Error('Failed to update project')
    return response.json()
  },

  async reorderProjects(projects: Project[]): Promise<Project[]> {
    if (!Array.isArray(projects)) throw new Error('Invalid projects data for reordering')
    const response = await authFetch(`${API_URL}/projects/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projects),
    })
    if (!response.ok) throw new Error('Failed to reorder projects')
    const data = await response.json()
    if (!Array.isArray(data)) throw new Error('Invalid response from reorder API')
    return data
  },

  async deleteProject(id: string): Promise<void> {
    const response = await authFetch(`${API_URL}/projects/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Failed to delete project')
  },
}
