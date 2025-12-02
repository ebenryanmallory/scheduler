import { Router, Request, Response } from 'express';
import { DocsService } from '../services/docsService';

const router = Router();
const docsService = new DocsService();

// Get the docs file tree
router.get('/tree', async (_req: Request, res: Response) => {
  try {
    const tree = await docsService.getDocsTree();
    res.json(tree);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch docs tree',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get content of a specific doc file
router.get('/content', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({
        success: false,
        message: 'File path is required'
      });
      return;
    }

    const content = await docsService.getDocContent(filePath);
    res.json({ content });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doc content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get project progress (epics, stories, completion status)
router.get('/progress', async (_req: Request, res: Response) => {
  try {
    const progress = await docsService.getProjectProgress();
    res.json(progress);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

