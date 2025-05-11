import { create } from 'zustand'
import { Project } from '@/types/project'
import { projectService } from './projectService'

// Define project keys as constants
export const PROJECT_KEYS = {
  MORNING_PROJECT: "Morning Project",
  AFTERNOON_PROJECT: "Afternoon Project"
} as const

export type ProjectName = typeof PROJECT_KEYS[keyof typeof PROJECT_KEYS]

// Default configurations that will be used when no markdown data is available
const DEFAULT_CONFIGS: Project[] = [
  {
    id: 'morning-project',
    title: PROJECT_KEYS.MORNING_PROJECT,
    color: 'bg-purple-100 text-purple-800',
    order: 0
  },
  {
    id: 'afternoon-project',
    title: PROJECT_KEYS.AFTERNOON_PROJECT,
    color: 'bg-emerald-100 text-emerald-800',
    order: 1
  }
]

interface ProjectStore {
  projects: Project[]
  isLoading: boolean
  error: string | null
  defaultProjects: Project[]
  getProjectColor: (projectName: string) => string
  fetchProjects: () => Promise<void>
  createProject: (id: string, project: Partial<Project>) => Promise<void>
  updateProject: (id: string, project: Partial<Project>) => Promise<void>
  reorderProjects: (projects: Project[]) => Promise<void>
  getDisplayProjects: () => Project[]
  deleteProject: (id: string) => Promise<void>
  editProject: (project: Project) => Promise<void>
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [...DEFAULT_CONFIGS],
  defaultProjects: [...DEFAULT_CONFIGS],
  isLoading: false,
  error: null,

  getProjectColor: (projectName: string) => {
    const state = get()
    const projects = Array.isArray(state.projects) ? state.projects : []
    const defaultProjects = Array.isArray(state.defaultProjects) ? state.defaultProjects : []
    
    const project = [...projects, ...defaultProjects].find(
      p => p.title === projectName
    )
    return project?.color ?? 'bg-gray-100 text-gray-800'
  },

  getDisplayProjects: () => {
    const { projects, isLoading, error, defaultProjects } = get()
    
    if (isLoading || error) {
      return defaultProjects
    }

    // Return all projects sorted by order
    return [...projects].sort((a, b) => a.order - b.order)
  },

  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const projects = await projectService.fetchProjects()
      set({ projects, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  createProject: async (id: string, project: Partial<Project>) => {
    try {
      const createdProject = await projectService.createProject(id, project)
      set((state) => ({
        projects: [...state.projects, createdProject]
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  updateProject: async (id: string, project: Partial<Project>) => {
    try {
      const updatedProject = await projectService.updateProject(id, project)
      set((state) => {
        // Check if the project already exists
        const existingProjectIndex = state.projects.findIndex(p => p.id === updatedProject.id)
        
        if (existingProjectIndex >= 0) {
          // Update existing project
          return {
            projects: state.projects.map((p) => 
              p.id === updatedProject.id ? updatedProject : p
            )
          }
        } else {
          // Add new project
          return {
            projects: [...state.projects, updatedProject]
          }
        }
      })
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  reorderProjects: async (projects: Project[]) => {
    try {
      const reorderedProjects = await projectService.reorderProjects(projects)
      set({ projects: reorderedProjects })
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  deleteProject: async (id: string) => {
    try {
      await projectService.deleteProject(id)
      set((state) => ({
        projects: state.projects.filter(p => p.id !== id)
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  editProject: async (project: Project) => {
    try {
      await projectService.updateProject(project.id, project)
      // Fetch fresh projects after update to ensure we have latest data
      const updatedProjects = await projectService.fetchProjects()
      set({ projects: updatedProjects })
    } catch (error) {
      set({ error: (error as Error).message })
    }
  }
})) 