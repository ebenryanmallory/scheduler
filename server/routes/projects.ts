import express from 'express'
import { ProjectService } from '../services/projectService'

const router = express.Router()
const projectService = new ProjectService()

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await projectService.getProjects()
    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// Reorder projects
router.post('/reorder', async (req, res) => {
  try {
    const newOrder = req.body

    if (!Array.isArray(newOrder)) {
      console.error('Invalid request body:', newOrder) // Debug log
      return res.status(400).json({ error: 'Invalid request - expected array of projects' })
    }

    // Validate each project in the array
    if (!newOrder.every(project => 
      typeof project === 'object' && 
      project !== null && 
      typeof project.id === 'string' &&
      typeof project.order === 'number'
    )) {
      console.error('Invalid project data in array:', newOrder) // Debug log
      return res.status(400).json({ error: 'Invalid project data in array' })
    }

    await projectService.reorderProjects(newOrder)

    // Return the reordered array directly
    res.json(newOrder)
  } catch (error) {
    console.error('Error in reorder endpoint:', error) // Debug log
    res.status(500).json({ error: 'Failed to reorder projects' })
  }
})

// Create a new project
router.post('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const project = req.body
    const createdProject = await projectService.createProject(id, project)
    res.json(createdProject)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' })
  }
})

// Update a project
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const updatedProject = await projectService.updateProject(id, updates)
    
    if (!updatedProject) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    res.json(updatedProject)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' })
  }
})

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await projectService.deleteProject(id)
    res.status(204).send() // 204 No Content is appropriate for successful deletion
  } catch (error) {
    if ((error as Error).message === 'Project not found') {
      return res.status(404).json({ error: 'Project not found' })
    }
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

export default router 