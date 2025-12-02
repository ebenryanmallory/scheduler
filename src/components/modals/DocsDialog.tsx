import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, ArrowLeft, LayoutDashboard, Files, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import ProjectProgress, { ProjectProgressData } from '../ProjectProgress'

interface DocFile {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: DocFile[]
}

interface DocsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ViewMode = 'progress' | 'files'

function FileTreeItem({ 
  item, 
  onSelect, 
  selectedPath,
  depth = 0 
}: { 
  item: DocFile
  onSelect: (path: string) => void
  selectedPath: string | null
  depth?: number
}) {
  const [isExpanded, setIsExpanded] = useState(depth === 0)
  const isSelected = selectedPath === item.path
  const isFolder = item.type === 'folder'

  const handleClick = () => {
    if (isFolder) {
      setIsExpanded(!isExpanded)
    } else {
      onSelect(item.path)
    }
  }

  // Format display name
  const displayName = item.name
    .replace('.md', '')
    .replace(/-/g, ' ')
    .replace(/^\d+\.?\d*\s*/, '') // Remove leading numbers like "1.1" or "1"

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm rounded-md transition-colors hover:bg-amber-100/50 ${
          isSelected ? 'bg-amber-200/70 text-amber-900 font-medium' : 'text-stone-700'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-amber-700 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-amber-700 flex-shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-amber-600 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-amber-600 flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-4" />
            <FileText className="h-4 w-4 text-stone-500 flex-shrink-0" />
          </>
        )}
        <span className="truncate capitalize">{displayName}</span>
      </button>
      
      {isFolder && isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              onSelect={onSelect}
              selectedPath={selectedPath}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function DocsDialog({ open, onOpenChange }: DocsDialogProps) {
  const [docsTree, setDocsTree] = useState<DocFile[]>([])
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('progress')
  const [progressData, setProgressData] = useState<ProjectProgressData | null>(null)
  const [isProgressLoading, setIsProgressLoading] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  // Filter out completed folders when showCompleted is false
  const filteredDocsTree = useMemo(() => {
    const filterCompleted = (items: DocFile[]): DocFile[] => {
      return items
        .filter(item => {
          // Filter out folders named "completed"
          if (item.type === 'folder' && item.name.toLowerCase() === 'completed') {
            return showCompleted
          }
          return true
        })
        .map(item => {
          // Recursively filter children
          if (item.type === 'folder' && item.children) {
            return {
              ...item,
              children: filterCompleted(item.children)
            }
          }
          return item
        })
    }
    return filterCompleted(docsTree)
  }, [docsTree, showCompleted])

  // Count completed items
  const completedItemsCount = useMemo(() => {
    const countFiles = (folder: DocFile): number => {
      let fileCount = 0
      if (folder.children) {
        for (const child of folder.children) {
          if (child.type === 'file') {
            fileCount++
          } else if (child.type === 'folder') {
            fileCount += countFiles(child)
          }
        }
      }
      return fileCount
    }
    
    const countInCompleted = (items: DocFile[]): number => {
      let count = 0
      for (const item of items) {
        if (item.type === 'folder' && item.name.toLowerCase() === 'completed') {
          count += countFiles(item)
        } else if (item.type === 'folder' && item.children) {
          count += countInCompleted(item.children)
        }
      }
      return count
    }
    
    return countInCompleted(docsTree)
  }, [docsTree])

  // Fetch docs tree and progress when dialog opens
  useEffect(() => {
    if (open) {
      fetchDocsTree()
      fetchProgress()
    }
  }, [open])

  const fetchProgress = async () => {
    setIsProgressLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/docs/progress')
      const data = await response.json()
      setProgressData(data)
    } catch (err) {
      console.error('Failed to fetch progress:', err)
    } finally {
      setIsProgressLoading(false)
    }
  }

  // Navigate to a story file when clicked from progress view
  const handleStoryClick = (epicId: number, storyId: string) => {
    // Find the story file in the tree
    const storyPath = `stories/story-${storyId}` // Will try to find this pattern
    const completedPath = `stories/completed/story-${storyId}`
    
    // Switch to files view and try to select the story
    setViewMode('files')
    
    // Try completed path first, then pending
    const tryPath = async (path: string): Promise<boolean> => {
      try {
        const response = await fetch(`http://localhost:3001/api/docs/content?path=${encodeURIComponent(path + '.md')}`)
        if (response.ok) {
          setSelectedPath(path + '.md')
          return true
        }
      } catch {}
      return false
    }

    // Attempt to find and open the story file
    tryPath(completedPath).then(found => {
      if (!found) {
        // Try finding by searching tree for matching story ID
        const findStoryPath = (items: DocFile[]): string | null => {
          for (const item of items) {
            if (item.type === 'file' && item.name.includes(`story-${storyId}`)) {
              return item.path
            }
            if (item.children) {
              const found = findStoryPath(item.children)
              if (found) return found
            }
          }
          return null
        }
        const foundPath = findStoryPath(docsTree)
        if (foundPath) {
          setSelectedPath(foundPath)
        }
      }
    })
  }

  // Fetch content when a file is selected
  useEffect(() => {
    if (selectedPath) {
      fetchDocContent(selectedPath)
    }
  }, [selectedPath])

  const fetchDocsTree = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/docs/tree')
      const data = await response.json()
      setDocsTree(data)
    } catch (err) {
      console.error('Failed to fetch docs tree:', err)
      setError('Failed to load documentation structure')
    }
  }

  const fetchDocContent = async (path: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`http://localhost:3001/api/docs/content?path=${encodeURIComponent(path)}`)
      const data = await response.json()
      setContent(data.content)
    } catch (err) {
      console.error('Failed to fetch doc content:', err)
      setError('Failed to load document')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setSelectedPath(null)
    setContent('')
  }

  const selectedFileName = selectedPath 
    ? selectedPath.split('/').pop()?.replace('.md', '').replace(/-/g, ' ') 
    : null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[85vh] p-0 gap-0 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-amber-200/50 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-amber-200/50 bg-white/40 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-stone-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              BMAD Spec-Driven Development
            </DialogTitle>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-stone-100/80 rounded-lg p-1">
              <button
                onClick={() => setViewMode('progress')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'progress'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Progress
              </button>
              <button
                onClick={() => setViewMode('files')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'files'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Files className="h-4 w-4" />
                Files
              </button>
            </div>
          </div>
        </DialogHeader>
        
        {viewMode === 'progress' ? (
          /* Progress View */
          <div className="flex-1 overflow-y-auto p-6">
            <ProjectProgress 
              data={progressData} 
              isLoading={isProgressLoading}
              onStoryClick={handleStoryClick}
            />
          </div>
        ) : (
          /* Files View */
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - File Tree */}
            <div className="w-72 border-r border-amber-200/50 bg-white/30 backdrop-blur-sm overflow-y-auto flex-shrink-0">
              <div className="p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3 px-2">
                  Files
                </h3>
                
                {/* Show/Hide Completed Toggle */}
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className={`w-full mb-3 flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-sm ${
                    showCompleted
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {showCompleted ? (
                    <Eye className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <EyeOff className="h-4 w-4 flex-shrink-0" />
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium">
                      {showCompleted ? 'Showing Completed' : 'Completed Hidden'}
                    </div>
                    <div className="text-xs opacity-75">
                      {showCompleted 
                        ? 'Click to hide finished stories' 
                        : completedItemsCount > 0 
                          ? `${completedItemsCount} finished ${completedItemsCount === 1 ? 'story' : 'stories'} hidden`
                          : 'No completed stories yet'
                      }
                    </div>
                  </div>
                  {completedItemsCount > 0 && (
                    <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${
                      showCompleted 
                        ? 'bg-emerald-200 text-emerald-800' 
                        : 'bg-stone-200 text-stone-600'
                    }`}>
                      <CheckCircle2 className="h-3 w-3" />
                      {completedItemsCount}
                    </span>
                  )}
                </button>
                
                {filteredDocsTree.length > 0 ? (
                  <nav className="space-y-0.5">
                    {filteredDocsTree.map((item) => (
                      <FileTreeItem
                        key={item.path}
                        item={item}
                        onSelect={setSelectedPath}
                        selectedPath={selectedPath}
                      />
                    ))}
                  </nav>
                ) : (
                  <p className="text-sm text-stone-500 px-2">Loading...</p>
                )}
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-white/50">
              {selectedPath ? (
                <div className="h-full flex flex-col">
                  {/* Document Header */}
                  <div className="px-6 py-3 border-b border-amber-200/30 bg-white/40 flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedPath(null)
                        setContent('')
                      }}
                      className="text-stone-600 hover:text-stone-800 hover:bg-amber-100/50"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <span className="text-stone-400">|</span>
                    <span className="text-sm font-medium text-stone-700 capitalize">
                      {selectedFileName}
                    </span>
                    <span className="text-xs text-stone-400 ml-auto">
                      {selectedPath}
                    </span>
                  </div>
                  
                  {/* Markdown Content */}
                  <div className="flex-1 overflow-y-auto px-8 py-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-pulse text-stone-500">Loading document...</div>
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-red-500">{error}</div>
                      </div>
                    ) : (
                      <article className="prose prose-stone prose-headings:text-stone-800 prose-a:text-amber-700 prose-a:no-underline hover:prose-a:underline prose-code:bg-amber-100/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-amber-800 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-stone-900 prose-pre:text-stone-100 prose-blockquote:border-l-amber-500 prose-blockquote:bg-amber-50/50 prose-blockquote:py-1 prose-blockquote:not-italic max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {content}
                        </ReactMarkdown>
                      </article>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-stone-500 px-8">
                  <div className="w-24 h-24 rounded-full bg-amber-100/50 flex items-center justify-center mb-6">
                    <FileText className="h-12 w-12 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-700 mb-2">
                    Select a spec document
                  </h3>
                  <p className="text-center text-stone-500 max-w-md">
                    Choose a markdown file from the sidebar to view its contents. 
                    Browse through folders to find PRDs, epics, user stories, and architecture documents for the multi-agent SDL workflow.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

