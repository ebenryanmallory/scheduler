import { FileService } from './fileService'
import path from 'path'
import fs from 'fs/promises'

interface Task {
  id: string
  title: string
  scheduledTime: string
  completed: boolean
  description: string
  project?: string
  order?: number
  persistent?: boolean
}

export class TaskService {
  private fileService: FileService

  constructor() {
    this.fileService = new FileService()
  }

  async listFiles(): Promise<string[]> {
    const files = await fs.readdir(path.join(process.cwd(), './src/docs'))
    // Only return files that match our task file pattern (UUID.md)
    return files.filter(file => {
      // Match files that are UUID.md format
      // UUID pattern: 8-4-4-4-12 hex digits
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.md$/i
      return uuidPattern.test(file)
    })
  }

  async createTask(task: Task): Promise<void> {
    const fileName = `${task.id}.md`
    const content = this.generateMarkdown(task)
    await this.fileService.createFile(fileName, content)
  }

  async getTasksByDate(targetDate: Date): Promise<Task[]> {
    try {
      const files = await this.listFiles()
      const tasks: Task[] = []

      for (const file of files) {
        const content = await this.fileService.readFile(file)
        const task = this.parseMarkdown(content)
        
        const taskDate = new Date(task.scheduledTime)
        if (this.isSameDay(taskDate, targetDate) || (task.persistent && !task.completed)) {
          tasks.push(task)
        }
      }

      return tasks.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order
        }
        return 0
      })
    } catch (error) {
      console.error('Failed to read tasks:', error)
      return []
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const fileName = `${taskId}.md`
    const content = await this.fileService.readFile(fileName)
    const task = this.parseMarkdown(content)
    const updatedTask = { ...task, ...updates }
    const updatedContent = this.generateMarkdown(updatedTask)
    await this.fileService.updateFile(fileName, updatedContent)
  }

  async deleteTask(taskId: string): Promise<void> {
    const fileName = `${taskId}.md`
    await this.fileService.deleteFile(fileName)
  }

  private generateMarkdown(task: Task): string {
    const frontMatter = [
        `---`,
        `id: ${task.id}`,
        `title: ${task.title}`,
        `scheduledTime: ${task.scheduledTime}`,
        ...(task.persistent ? [`completed: ${task.completed}`] : []),
        `project: ${task.project || ''}`,
        `order: ${task.order !== undefined ? task.order : 0}`,
        `persistent: ${task.persistent || false}`,
        `---`
    ].join('\n')

    return `${frontMatter}\n\n${task.description}`
  }

  private parseMarkdown(content: string): Task {
    const normalizedContent = content.replace(/\r\n/g, '\n').trim()
    
    const frontMatterRegex = /^---\s*([\s\S]*?)\s*---\s*([\s\S]*)?$/
    const match = normalizedContent.match(frontMatterRegex)
    
    if (!match) {
      // Add more detailed error information
      console.error('Failed to parse markdown. Content:', normalizedContent)
      throw new Error('Invalid markdown format')
  }

  const [, frontMatter, description = ''] = match
  const metadata: Record<string, string> = {}
    
    frontMatter.split('\n')
    .filter(line => line.trim())
    .forEach(line => {
        const [key, ...valueParts] = line.split(':')
        if (key && valueParts.length > 0) {
            // Join value parts back together in case the value contained colons
            metadata[key.trim()] = valueParts.join(':').trim()
        }
    })

    return {
      id: metadata.id,
      title: metadata.title,
      scheduledTime: metadata.scheduledTime || '',
      completed: metadata.completed ? metadata.completed === 'true' : false,
      description: description.trim(),
      project: metadata.project || undefined,
      order: metadata.order ? parseInt(metadata.order, 10) : undefined,
      persistent: metadata.persistent === 'true'
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  async reorderTasks(tasks: Task[]): Promise<void> {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      const updates = { ...task, order: i }
      await this.updateTask(task.id, updates)
    }
  }
} 