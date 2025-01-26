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
  updateProject: (id: string, project: Partial<Project>) => Promise<void>
  reorderProjects: (projects: Project[]) => Promise<void>
  getDisplayProjects: () => Project[]
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [...DEFAULT_CONFIGS],
  defaultProjects: [...DEFAULT_CONFIGS],
  isLoading: false,
  error: null,

  getProjectColor: (projectName: string) => {
    const { projects, defaultProjects } = get()
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

  updateProject: async (id: string, project: Partial<Project>) => {
    try {
      const updatedProject = await projectService.updateProject(id, project)
      set((state) => ({
        projects: state.projects.map((p) => 
          p.id === updatedProject.id ? updatedProject : p
        )
      }))
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
  }
})) 