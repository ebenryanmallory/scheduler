export interface Project {
  id: string
  title: string
  color: string
  order: number
}

// Default project data for when no markdown data is available
export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'project-1',
    title: 'Project One',
    color: 'bg-gray-100 text-gray-800',
    order: 0
  },
  {
    id: 'project-2',
    title: 'Project Two',
    color: 'bg-gray-100 text-gray-800',
    order: 1
  }
] 