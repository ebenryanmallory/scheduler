import { FileService } from './fileService'
import path from 'path'

interface Idea {
  id: string
  title: string
  description?: string
  project?: string
  createdAt: string
  order?: number
}

export class IdeaService {
  private fileService: FileService
  private readonly ideasFile = 'ideas.md'

  constructor() {
    this.fileService = new FileService()
  }

  async getAllIdeas(): Promise<Idea[]> {
    try {
      const content = await this.fileService.readFile(this.ideasFile)
      return this.parseIdeasMarkdown(content)
    } catch (error) {
      // If file doesn't exist yet, create it and return empty array
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await this.fileService.createFile(this.ideasFile, '')
        return []
      }
      throw error
    }
  }

  async createIdea(idea: Omit<Idea, 'id' | 'createdAt'>): Promise<Idea> {
    const ideas = await this.getAllIdeas()
    const newIdea: Idea = {
      id: crypto.randomUUID(),
      title: idea.title,
      description: idea.description,
      project: idea.project,
      createdAt: new Date().toISOString(),
      order: ideas.length
    }

    ideas.push(newIdea)
    await this.saveIdeas(ideas)
    
    // Return the complete idea object so frontend can update state immediately
    return newIdea
  }

  async updateIdea(id: string, updates: Partial<Idea>): Promise<void> {
    const ideas = await this.getAllIdeas()
    const index = ideas.findIndex(idea => idea.id === id)
    
    if (index === -1) {
      throw new Error('Idea not found')
    }

    ideas[index] = { ...ideas[index], ...updates }
    await this.saveIdeas(ideas)
  }

  async deleteIdea(id: string): Promise<void> {
    const ideas = await this.getAllIdeas()
    const filteredIdeas = ideas.filter(idea => idea.id !== id)
    
    if (filteredIdeas.length === ideas.length) {
      throw new Error('Idea not found')
    }

    await this.saveIdeas(filteredIdeas)
  }

  async reorderIdeas(reorderedIdeas: Idea[]): Promise<void> {
    const ideas = await this.getAllIdeas()
    
    // Verify all ideas exist
    const allIdsExist = reorderedIdeas.every(({ id }) => 
      ideas.some(idea => idea.id === id)
    )
    
    if (!allIdsExist) {
      throw new Error('Invalid idea order - some ideas not found')
    }

    // Update order while preserving other properties
    const updatedIdeas = reorderedIdeas.map((reorderedIdea, index) => ({
      ...ideas.find(idea => idea.id === reorderedIdea.id)!,
      order: index
    }))

    await this.saveIdeas(updatedIdeas)
  }

  private generateIdeaMarkdown(idea: Idea): string {
    const frontMatter = [
      '---',
      `id: ${idea.id}`,
      `title: ${idea.title}`,
      `createdAt: ${idea.createdAt}`,
      idea.project ? `project: ${idea.project}` : 'project: ',
      `order: ${idea.order ?? 0}`,
      '---'
    ].join('\n')

    return `${frontMatter}\n\n${idea.description || ''}`
  }

  private parseIdeasMarkdown(content: string): Idea[] {
    if (!content.trim()) {
      return []
    }

    const ideaSections = content.split('\n\n---\n\n')
    return ideaSections
      .filter(section => section.trim())
      .map(section => {
        const normalizedSection = section.replace(/\r\n/g, '\n').trim()
        const frontMatterRegex = /^---\s*([\s\S]*?)\s*---\s*([\s\S]*)?$/
        const match = normalizedSection.match(frontMatterRegex)
        
        if (!match) {
          console.error('Failed to parse idea section:', normalizedSection)
          throw new Error('Invalid idea markdown format')
        }

        const [, frontMatter, description = ''] = match
        const metadata: Record<string, string> = {}

        frontMatter
          .split('\n')
          .filter(line => line.trim())
          .forEach(line => {
            const [key, ...valueParts] = line.split(':')
            if (key && valueParts.length >= 0) {
              metadata[key.trim()] = valueParts.join(':').trim()
            }
          })

        return {
          id: metadata.id,
          title: metadata.title,
          description: description.trim() || undefined,
          project: metadata.project || undefined,
          createdAt: metadata.createdAt,
          order: metadata.order ? parseInt(metadata.order, 10) : undefined
        }
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  private async saveIdeas(ideas: Idea[]): Promise<void> {
    const content = ideas
      .map(idea => this.generateIdeaMarkdown(idea))
      .join('\n\n---\n\n')
    
    await this.fileService.createFile(this.ideasFile, content)
  }
} 