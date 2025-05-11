import { Project } from '@/types/project'

const API_URL = 'http://localhost:3001/api'

export const projectService = {
  async fetchProjects(): Promise<Project[]> {
    const response = await fetch(`${API_URL}/projects`)
    if (!response.ok) {
      throw new Error('Failed to fetch projects')
    }
    const data = await response.json()
    if (!Array.isArray(data)) {
      console.error('API returned non-array data:', data)
      return []
    }
    return data
  },

  async createProject(id: string, project: Partial<Project>): Promise<Project> {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    })

    if (!response.ok) {
      throw new Error('Failed to create project')
    }
    return response.json()
  },

  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    })

    if (!response.ok) {
      throw new Error('Failed to update project')
    }
    return response.json()
  },

  async reorderProjects(projects: Project[]): Promise<Project[]> {
    if (!Array.isArray(projects)) {
      console.error('Invalid projects data for reordering:', projects)
      throw new Error('Invalid projects data for reordering')
    }

    const response = await fetch(`${API_URL}/projects/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projects),
    })

    if (!response.ok) {
      throw new Error('Failed to reorder projects')
    }
    const data = await response.json()
    if (!Array.isArray(data)) {
      console.error('API returned non-array data after reordering:', data)
      throw new Error('Invalid response from reorder API')
    }
    return data
  },

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete project')
    }
  }
} 