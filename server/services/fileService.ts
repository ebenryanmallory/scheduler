import fs from 'fs/promises'
import path from 'path'

export class FileService {
  private basePath: string = './src/docs' // Base directory for markdown files

  async createFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath)
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    
    // Write file
    await fs.writeFile(fullPath, content, 'utf-8')
  }

  async updateFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath)
    await fs.writeFile(fullPath, content, 'utf-8')
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath)
    await fs.unlink(fullPath)
  }

  async readFile(filePath: string): Promise<string> {
    const fullPath = path.join(this.basePath, filePath)
    return fs.readFile(fullPath, 'utf-8')
  }
} 