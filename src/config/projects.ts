import { ProjectName } from '@/types/dialog'

export interface ProjectConfig {
  name: ProjectName
  color: {
    background: string
    text: string
  }
}

export const PROJECTS: ProjectConfig[] = [
  {
    name: "Dynamic Momentum",
    color: {
      background: "bg-purple-100",
      text: "text-purple-800"
    }
  },
  {
    name: "Motion Storyline",
    color: {
      background: "bg-emerald-100",
      text: "text-emerald-800"
    }
  }
] as const

export const getProjectColor = (project: string | undefined) => {
  const projectConfig = PROJECTS.find(p => p.name === project)
  return projectConfig?.color ?? {
    background: "bg-gray-100",
    text: "text-gray-800"
  }
} 