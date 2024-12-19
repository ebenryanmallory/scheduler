import express, { Request, Response } from 'express';
import cors from 'cors';
import { TaskService } from './services/taskService';

const app = express();
const taskService = new TaskService();

app.use(cors());
app.use(express.json());

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
    res.status(201).send('Task created');
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : 'Unknown error');
  }
});

app.put('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await taskService.updateTask(id, updates);
    res.status(200).send('Task updated');
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : 'Unknown error');
  }
});

app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await taskService.deleteTask(id);
    res.status(200).send('Task deleted');
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : 'Unknown error');
  }
});

app.listen(3001, () => {
  console.log('Task server running on port 3001');
}); 