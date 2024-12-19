import { FileService } from './fileService'
import path from 'path'
import fs from 'fs/promises'

interface Task {
  id: string
  title: string
  time: string
  completed: boolean
  date: string
  description: string
  project?: string
  order?: number
}

export class TaskService {
  private fileService: FileService

  constructor() {
    this.fileService = new FileService()
  }

  async listFiles(): Promise<string[]> {
    const files = await fs.readdir(path.join(process.cwd(), './src/docs'))
    return files.filter(file => file.endsWith('.md'))
  }

  async createTask(task: Task): Promise<void> {
    const fileName = `${task.id}.md`
    const content = this.generateMarkdown(task)
    await this.fileService.createFile(fileName, content)
  }

  async getTasksByDate(date: Date): Promise<Task[]> {
    try {
      const files = await this.listFiles()
      const tasks: Task[] = []

      for (const file of files) {
        const content = await this.fileService.readFile(file)
        const task = this.parseMarkdown(content)
        
        if (task.date) {
          const taskDate = new Date(task.date)
          if (this.isSameDay(taskDate, date)) {
            tasks.push(task)
          }
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
    return `---
id: ${task.id}
title: ${task.title}
time: ${task.time}
completed: ${task.completed}
date: ${task.date}
project: ${task.project || ''}
order: ${task.order !== undefined ? task.order : 0}
---

${task.description}
`
  }

  private parseMarkdown(content: string): Task {
    const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
    const match = content.match(frontMatterRegex)
    
    if (!match) {
      throw new Error('Invalid markdown format')
    }

    const [, frontMatter, description] = match
    const metadata: Record<string, string> = {}
    
    frontMatter.split('\n').forEach(line => {
      const [key, value] = line.split(': ')
      if (key && value) {
        metadata[key.trim()] = value.trim()
      }
    })

    return {
      id: metadata.id,
      title: metadata.title,
      time: metadata.time || '',
      completed: metadata.completed === 'true',
      date: metadata.date || '',
      description: description.trim(),
      project: metadata.project || undefined,
      order: metadata.order ? parseInt(metadata.order, 10) : undefined
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