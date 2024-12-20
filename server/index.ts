import express, { Request, Response } from 'express';
import cors from 'cors';
import { TaskService } from './services/taskService';
import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const taskService = new TaskService();
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL;

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

app.post('/api/send-email', async (req: Request, res: Response) => {
  try {
    const { to, subject, content } = req.body;

    if (!to || !subject || !content) {
      return res.status(400).send('Missing required fields: to, subject, and content are required.');
    }

    const data = await resend.emails.send({
      from: FROM_EMAIL || 'no-reply@example.com',
      to,
      subject,
      html: content,
    });

    res.status(200).json({ message: 'Email sent successfully', data });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send(error instanceof Error ? error.message : 'Failed to send email');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Task server running on port ${PORT}`);
}); 