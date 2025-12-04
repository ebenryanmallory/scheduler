import express, { Request, Response } from 'express';
import cors from 'cors';
import { TaskService } from './services/taskService';
import { IdeaService } from './services/ideaService';
import dotenv from 'dotenv';
import projectRoutes from './routes/projects'
import docsRoutes from './routes/docs'
import syncRoutes from './routes/sync'
import { gitSyncService } from './services/gitSyncService'
dotenv.config();

const app = express();
const taskService = new TaskService();
const ideaService = new IdeaService();

app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/api/tasks', async (req: Request, res: Response) => {
  try {
    const dateStr = req.query.date as string;
    const date = dateStr ? new Date(dateStr) : new Date();
    const tasks = await taskService.getTasksByDate(date);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : 'Unknown error');
  }
});

app.post('/api/tasks', async (req: Request, res: Response) => {
  try {
    const task = req.body;
    await taskService.createTask(task);
    
    // Schedule Git commit
    gitSyncService.scheduleCommit({
      type: 'add',
      entity: 'task',
      title: task.title || 'New task'
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Task created',
      task: task 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create task',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const updatedTask = req.body;
    
    await taskService.updateTask(taskId, updatedTask);
    
    // Schedule Git commit
    gitSyncService.scheduleCommit({
      type: 'update',
      entity: 'task',
      title: updatedTask.title || taskId
    });
    
    res.json({ 
      success: true, 
      message: 'Task updated',
      task: updatedTask 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update task',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await taskService.deleteTask(id);
    
    // Schedule Git commit
    gitSyncService.scheduleCommit({
      type: 'delete',
      entity: 'task',
      title: id
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Task deleted',
      taskId: id 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete task',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/ideas', async (_req: Request, res: Response) => {
  try {
    const ideas = await ideaService.getAllIdeas();
    res.status(200).json(ideas);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ideas',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/ideas', async (req: Request, res: Response) => {
  try {
    const idea = req.body;
    const newIdea = await ideaService.createIdea(idea);
    
    // Schedule Git commit
    gitSyncService.scheduleCommit({
      type: 'add',
      entity: 'idea',
      title: idea.title || 'New idea'
    });
    
    res.status(201).json({
      success: true,
      message: 'Idea created',
      idea: newIdea
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create idea',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/ideas/reorder', async (req: Request, res: Response) => {
  try {
    const ideas = req.body;
    await ideaService.reorderIdeas(ideas);
    
    // Schedule Git commit
    gitSyncService.scheduleCommit({
      type: 'update',
      entity: 'idea',
      title: `Reordered ${ideas.length} ideas`
    });
    
    res.json({
      success: true,
      message: 'Ideas reordered'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reorder ideas',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/ideas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await ideaService.updateIdea(id, updates);
    
    // Schedule Git commit
    gitSyncService.scheduleCommit({
      type: 'update',
      entity: 'idea',
      title: updates.title || id
    });
    
    res.json({
      success: true,
      message: 'Idea updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update idea',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/ideas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await ideaService.deleteIdea(id);
    
    // Schedule Git commit
    gitSyncService.scheduleCommit({
      type: 'delete',
      entity: 'idea',
      title: id
    });
    
    res.json({
      success: true,
      message: 'Idea deleted',
      ideaId: id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete idea',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.use('/api/projects', projectRoutes)
app.use('/api/docs', docsRoutes)
app.use('/api/sync', syncRoutes)

// Initialize Git sync service
gitSyncService.initialize().then((success: boolean) => {
  if (success) {
    console.log('Git sync service initialized');
  } else {
    console.log('Git sync service initialization failed - Git features disabled');
  }
});

// Health check endpoint for connectivity detection
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.head('/api/health', (_req: Request, res: Response) => {
  res.status(200).end();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Task server running on port ${PORT}`);
}); 