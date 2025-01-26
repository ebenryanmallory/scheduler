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

// Reorder projects
router.post('/reorder', async (req, res) => {
  try {
    const newOrder = req.body
    const reorderedProjects = await projectService.reorderProjects(newOrder)
    res.json(reorderedProjects)
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder projects' })
  }
})

export default router 