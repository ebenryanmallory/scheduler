import { FileService } from './fileService'
import path from 'path'

interface Project {
  id: string
  title: string
  color: string
  order: number
}

export class ProjectService {
  private fileService: FileService
  private readonly projectsFile = 'projects.md'

  constructor() {
    this.fileService = new FileService()
  }

  async getProjects(): Promise<Project[]> {
    try {
      const content = await this.fileService.readFile(this.projectsFile)
      return this.parseProjectsMarkdown(content)
    } catch (error) {
      // If file doesn't exist yet, create it and return empty array
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await this.fileService.createFile(this.projectsFile, '')
        return []
      }
      throw error
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const projects = await this.getProjects()
    const index = projects.findIndex(project => project.id === id)
    
    if (index === -1) return null

    projects[index] = { ...projects[index], ...updates }
    await this.saveProjects(projects)
    return projects[index]
  }

  async reorderProjects(reorderedProjects: Project[]): Promise<Project[]> {
    const projects = await this.getProjects()
    
    // Verify all projects exist
    const allIdsExist = reorderedProjects.every(({ id }) => 
      projects.some(project => project.id === id)
    )
    
    if (!allIdsExist) {
      throw new Error('Invalid project order - some projects not found')
    }

    // Update order while preserving other properties
    const updatedProjects = reorderedProjects.map((reorderedProject, index) => ({
      ...projects.find(project => project.id === reorderedProject.id)!,
      order: index
    }))

    await this.saveProjects(updatedProjects)
    return updatedProjects
  }

  private generateProjectMarkdown(project: Project): string {
    return [
      '---',
      `id: ${project.id}`,
      `title: ${project.title}`,
      `color: ${project.color}`,
      `order: ${project.order}`,
      '---'
    ].join('\n')
  }

  private parseProjectsMarkdown(content: string): Project[] {
    // Split on '---' and filter out empty sections
    const sections = content.split('---').filter(Boolean)
    
    return sections
      .map(section => {
        const lines = section.trim().split('\n')
        const metadata: Record<string, string> = {}

        lines.forEach(line => {
          const [key, ...valueParts] = line.split(':')
          if (key && valueParts.length > 0) {
            metadata[key.trim()] = valueParts.join(':').trim()
          }
        })

        return {
          id: metadata.id,
          title: metadata.title,
          color: metadata.color,
          order: metadata.order ? parseInt(metadata.order, 10) : 0
        }
      })
      .filter(project => project.id && project.title) // Filter out any invalid projects
      .sort((a, b) => a.order - b.order)
  }

  private async saveProjects(projects: Project[]): Promise<void> {
    const content = projects
      .sort((a, b) => a.order - b.order)
      .map(project => this.generateProjectMarkdown(project))
      .join('\n\n')
    
    await this.fileService.createFile(this.projectsFile, content)
  }
} 