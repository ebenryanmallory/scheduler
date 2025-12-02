import { readdir, readFile, stat } from 'fs/promises';
import path from 'path';
import * as yaml from 'js-yaml';

interface DocFile {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: DocFile[];
}

interface StoryProgress {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  hasGate: boolean;
  gateStatus?: 'PASS' | 'FAIL' | 'PENDING';
}

interface EpicProgress {
  id: number;
  title: string;
  description: string;
  stories: StoryProgress[];
  completedCount: number;
  totalCount: number;
  percentComplete: number;
}

export interface ProjectProgress {
  epics: EpicProgress[];
  totalStories: number;
  completedStories: number;
  overallPercent: number;
  currentEpic: number;
  lastUpdated: string;
}

export class DocsService {
  private docsPath: string;

  constructor() {
    this.docsPath = path.join(process.cwd(), 'docs');
  }

  async getDocsTree(): Promise<DocFile[]> {
    return this.scanDirectory(this.docsPath, '');
  }

  private async scanDirectory(dirPath: string, relativePath: string): Promise<DocFile[]> {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const files: DocFile[] = [];

    for (const entry of entries) {
      const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        const children = await this.scanDirectory(
          path.join(dirPath, entry.name),
          entryRelativePath
        );
        // Only include folders that have .md files
        if (children.length > 0) {
          files.push({
            name: entry.name,
            path: entryRelativePath,
            type: 'folder',
            children
          });
        }
      } else if (entry.name.endsWith('.md')) {
        files.push({
          name: entry.name,
          path: entryRelativePath,
          type: 'file'
        });
      }
    }

    // BMAD-aware sort: order items by workflow importance, then by type/name
    const getPriority = (item: DocFile): number => {
      const name = item.name.toLowerCase();
      const isRoot = relativePath === '';

      // Top-level (docs/ root) ordering by BMAD importance
      if (isRoot) {
        // Single source of truth PRD file
        if (item.type === 'file' && name === 'prd.md') return 0;

        // Core BMAD folders in workflow order
        if (item.type === 'folder' && name === 'prd') return 1;          // product requirements + epics
        if (item.type === 'folder' && name === 'stories') return 2;      // user stories / execution detail
        if (item.type === 'folder' && name === 'architecture') return 3; // solution design
        if (item.type === 'folder' && name === 'qa') return 4;           // quality gates & assessments

        // Any other top-level markdown files
        if (item.type === 'file') return 10;
        // Any other folders
        if (item.type === 'folder') return 11;
      }

      // Inside the PRD folder, keep core overview docs first
      if (relativePath === 'prd') {
        if (item.type === 'file') {
          if (name === 'requirements.md') return 0;
          if (name === 'goals-and-background-context.md') return 1;
          if (name === 'epic-list.md') return 2;
          if (name.startsWith('epic-')) return 3;
          if (name === 'user-interface-design-goals.md') return 4;
          if (name === 'technical-assumptions.md') return 5;
          if (name === 'next-steps.md') return 6;
        }
      }

      // Inside QA, surface assessments before other content
      if (relativePath === 'qa') {
        if (item.type === 'folder' && name === 'assessments') return 0;
        if (item.type === 'folder' && name === 'gates') return 1;
      }

      // Default weighting: folders before files, then alpha
      return item.type === 'folder' ? 100 : 200;
    };

    return files.sort((a, b) => {
      const priorityDiff = getPriority(a) - getPriority(b);
      if (priorityDiff !== 0) return priorityDiff;

      // Within the same priority, keep folders before files, then alphabetical
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  async getDocContent(filePath: string): Promise<string> {
    // Prevent directory traversal attacks
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(this.docsPath, normalizedPath);
    
    // Ensure the path is within docs directory
    if (!fullPath.startsWith(this.docsPath)) {
      throw new Error('Invalid file path');
    }

    // Verify it's a .md file
    if (!fullPath.endsWith('.md')) {
      throw new Error('Only markdown files are allowed');
    }

    const content = await readFile(fullPath, 'utf-8');
    return content;
  }

  async getProjectProgress(): Promise<ProjectProgress> {
    const epics: EpicProgress[] = [];
    
    // Parse epic files from prd folder
    const prdPath = path.join(this.docsPath, 'prd');
    const epicListPath = path.join(prdPath, 'epic-list.md');
    
    try {
      // Get all epic files
      const prdEntries = await readdir(prdPath, { withFileTypes: true });
      const epicFiles = prdEntries
        .filter(e => e.isFile() && e.name.match(/^epic-\d+-.*\.md$/))
        .sort((a, b) => {
          const numA = parseInt(a.name.match(/epic-(\d+)/)?.[1] || '0');
          const numB = parseInt(b.name.match(/epic-(\d+)/)?.[1] || '0');
          return numA - numB;
        });

      // Get completed stories
      const completedStories = await this.getCompletedStoryIds();
      
      // Get QA gates status
      const gateStatuses = await this.getGateStatuses();
      
      // Get in-progress stories (files in stories/ but not in completed/)
      const pendingStories = await this.getPendingStoryIds();

      // Parse each epic file
      for (const epicFile of epicFiles) {
        const epicContent = await readFile(path.join(prdPath, epicFile.name), 'utf-8');
        const epicId = parseInt(epicFile.name.match(/epic-(\d+)/)?.[1] || '0');
        
        // Extract epic title from first heading
        const titleMatch = epicContent.match(/^#\s+Epic\s+\d+:\s+(.+)$/m);
        const epicTitle = titleMatch?.[1] || `Epic ${epicId}`;
        
        // Extract description (first paragraph after title)
        const descMatch = epicContent.match(/^#[^\n]+\n+\*\*Goal\*\*:\s*([^\n]+)/m);
        const description = descMatch?.[1] || '';
        
        // Extract stories from this epic (## Story X.Y: pattern)
        const storyMatches = epicContent.matchAll(/^##\s+Story\s+(\d+\.\d+):\s+(.+)$/gm);
        const stories: StoryProgress[] = [];
        
        for (const match of storyMatches) {
          const storyId = match[1];
          const storyTitle = match[2];
          
          const isCompleted = completedStories.has(storyId);
          const isPending = pendingStories.has(storyId);
          const gateStatus = gateStatuses.get(storyId);
          
          let status: StoryProgress['status'] = 'pending';
          if (isCompleted) {
            status = 'completed';
          } else if (gateStatus === 'FAIL') {
            status = 'blocked';
          } else if (isPending) {
            // Check if story file has "Status: In Development" or similar
            status = await this.getStoryStatus(storyId) || 'pending';
          }
          
          stories.push({
            id: storyId,
            title: storyTitle,
            status,
            hasGate: gateStatus !== undefined,
            gateStatus
          });
        }
        
        const completedCount = stories.filter(s => s.status === 'completed').length;
        
        epics.push({
          id: epicId,
          title: epicTitle,
          description,
          stories,
          completedCount,
          totalCount: stories.length,
          percentComplete: stories.length > 0 ? Math.round((completedCount / stories.length) * 100) : 0
        });
      }
    } catch (error) {
      console.error('Error parsing epics:', error);
    }

    const totalStories = epics.reduce((sum, e) => sum + e.totalCount, 0);
    const completedStories = epics.reduce((sum, e) => sum + e.completedCount, 0);
    
    // Current epic is the first non-complete epic
    const currentEpic = epics.find(e => e.percentComplete < 100)?.id || epics[epics.length - 1]?.id || 1;

    return {
      epics,
      totalStories,
      completedStories,
      overallPercent: totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0,
      currentEpic,
      lastUpdated: new Date().toISOString()
    };
  }

  private async getCompletedStoryIds(): Promise<Set<string>> {
    const completedPath = path.join(this.docsPath, 'stories', 'completed');
    const completed = new Set<string>();
    
    try {
      const entries = await readdir(completedPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          // Extract story ID from filename like "story-1.1-smart-notifications.md"
          const match = entry.name.match(/story-(\d+\.\d+)/);
          if (match) {
            completed.add(match[1]);
          }
        }
      }
    } catch (error) {
      // Completed folder may not exist yet
    }
    
    return completed;
  }

  private async getPendingStoryIds(): Promise<Set<string>> {
    const storiesPath = path.join(this.docsPath, 'stories');
    const pending = new Set<string>();
    
    try {
      const entries = await readdir(storiesPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          const match = entry.name.match(/story-(\d+\.\d+)/);
          if (match) {
            pending.add(match[1]);
          }
        }
      }
    } catch (error) {
      // Stories folder may not exist
    }
    
    return pending;
  }

  private async getGateStatuses(): Promise<Map<string, 'PASS' | 'FAIL' | 'PENDING'>> {
    const gatesPath = path.join(this.docsPath, 'qa', 'gates');
    const gates = new Map<string, 'PASS' | 'FAIL' | 'PENDING'>();
    
    try {
      const entries = await readdir(gatesPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml'))) {
          // Extract story ID from filename like "1.1-smart-notifications.yml"
          const match = entry.name.match(/^(\d+\.\d+)/);
          if (match) {
            try {
              const content = await readFile(path.join(gatesPath, entry.name), 'utf-8');
              const gateData = yaml.load(content) as { gate?: string };
              if (gateData?.gate === 'PASS') {
                gates.set(match[1], 'PASS');
              } else if (gateData?.gate === 'FAIL') {
                gates.set(match[1], 'FAIL');
              } else {
                gates.set(match[1], 'PENDING');
              }
            } catch (parseError) {
              console.error(`Failed to parse gate file ${entry.name}:`, parseError);
            }
          }
        }
      }
    } catch (error) {
      // Gates folder may not exist
    }
    
    return gates;
  }

  private async getStoryStatus(storyId: string): Promise<StoryProgress['status'] | null> {
    const storiesPath = path.join(this.docsPath, 'stories');
    
    try {
      const entries = await readdir(storiesPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.includes(`story-${storyId}`)) {
          const content = await readFile(path.join(storiesPath, entry.name), 'utf-8');
          
          // Check for status indicators in the file
          const statusMatch = content.match(/\*\*Status\*\*:\s*(.+)/i);
          if (statusMatch) {
            const status = statusMatch[1].toLowerCase().trim();
            if (status.includes('development') || status.includes('progress')) {
              return 'in-progress';
            } else if (status.includes('complete') || status.includes('done')) {
              return 'completed';
            } else if (status.includes('block') || status.includes('hold')) {
              return 'blocked';
            }
          }
          return 'pending';
        }
      }
    } catch (error) {
      // Story file not found
    }
    
    return null;
  }
}

