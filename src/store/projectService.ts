import { Project } from '@/types/project'

const API_URL = 'http://localhost:3001/api'

export const projectService = {
  async fetchProjects(): Promise<Project[]> {
    const response = await fetch(`${API_URL}/projects`)
    if (!response.ok) {
      throw new Error('Failed to fetch projects')
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
    return response.json()
  }
} 