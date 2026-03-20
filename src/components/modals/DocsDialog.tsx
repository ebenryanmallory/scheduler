import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  ArrowLeft,
  Upload,
  Trash2,
} from 'lucide-react'
import { authFetch } from '@/services/authFetch'

interface DocFile {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: DocFile[]
}

interface DocsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function FileTreeItem({
  item,
  onSelect,
  onDelete,
  selectedPath,
  depth = 0,
}: {
  item: DocFile
  onSelect: (path: string) => void
  onDelete: (path: string) => void
  selectedPath: string | null
  depth?: number
}) {
  const [isExpanded, setIsExpanded] = useState(depth === 0)
  const isSelected = selectedPath === item.path
  const isFolder = item.type === 'directory'

  const displayName = item.name.replace('.md', '').replace(/-/g, ' ')

  return (
    <div>
      <div
        className={`w-full flex items-center gap-1 px-2 py-1.5 text-left text-sm rounded-md transition-colors group ${
          isSelected ? 'bg-amber-200/70 text-amber-900 font-medium' : 'text-stone-700 hover:bg-amber-100/50'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <button
          onClick={() => (isFolder ? setIsExpanded(!isExpanded) : onSelect(item.path))}
          className="flex items-center gap-2 flex-1 min-w-0"
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
              <span className="w-4 flex-shrink-0" />
              <FileText className="h-4 w-4 text-stone-500 flex-shrink-0" />
            </>
          )}
          <span className="truncate capitalize">{displayName}</span>
        </button>

        {!isFolder && (
          <button
            onClick={() => onDelete(item.path)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-500 transition-all flex-shrink-0"
            title="Delete file"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isFolder && isExpanded && item.children && (
        <div>
          {item.children.map(child => (
            <FileTreeItem
              key={child.path}
              item={child}
              onSelect={onSelect}
              onDelete={onDelete}
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
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      fetchDocsTree()
    }
  }, [open])

  useEffect(() => {
    if (selectedPath) {
      fetchDocContent(selectedPath)
    }
  }, [selectedPath])

  const fetchDocsTree = async () => {
    try {
      const response = await authFetch('/api/docs/tree')
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
      const response = await authFetch(`/api/docs/content?path=${encodeURIComponent(path)}`)
      const data = await response.json()
      setContent(data.content)
    } catch (err) {
      console.error('Failed to fetch doc content:', err)
      setError('Failed to load document')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const markdownFiles = files.filter(f => f.name.endsWith('.md'))
    if (markdownFiles.length === 0) {
      setError('Only .md files are supported')
      return
    }

    setIsUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      for (const file of markdownFiles) {
        // Use webkitRelativePath if available (folder upload) otherwise just name
        const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
        formData.append(relativePath, file)
      }

      const response = await authFetch('/api/docs/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')
      await fetchDocsTree()
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload files')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (path: string) => {
    if (!confirm(`Delete ${path}?`)) return
    try {
      await authFetch(`/api/docs?path=${encodeURIComponent(path)}`, { method: 'DELETE' })
      if (selectedPath === path) {
        setSelectedPath(null)
        setContent('')
      }
      await fetchDocsTree()
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete file')
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setSelectedPath(null)
    setContent('')
    setError(null)
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
              Docs
            </DialogTitle>

            {/* Upload button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md"
                multiple
                // @ts-expect-error webkitdirectory is not in TS types
                webkitdirectory=""
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - File Tree */}
          <div className="w-72 border-r border-amber-200/50 bg-white/30 backdrop-blur-sm overflow-y-auto flex-shrink-0">
            <div className="p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3 px-2">
                Files
              </h3>

              {docsTree.length > 0 ? (
                <nav className="space-y-0.5">
                  {docsTree.map(item => (
                    <FileTreeItem
                      key={item.path}
                      item={item}
                      onSelect={setSelectedPath}
                      onDelete={handleDelete}
                      selectedPath={selectedPath}
                    />
                  ))}
                </nav>
              ) : (
                <div className="px-2 text-sm text-stone-500 space-y-1">
                  <p>No files yet.</p>
                  <p>Upload .md files or folders to get started.</p>
                </div>
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
                  <span className="text-sm font-medium text-stone-700 capitalize">{selectedFileName}</span>
                  <span className="text-xs text-stone-400 ml-auto">{selectedPath}</span>
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
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </article>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-500 px-8">
                <div className="w-24 h-24 rounded-full bg-amber-100/50 flex items-center justify-center mb-6">
                  <FileText className="h-12 w-12 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold text-stone-700 mb-2">Your Markdown Docs</h3>
                <p className="text-center text-stone-500 max-w-md">
                  Upload .md files or entire folders using the button above. Select any file from the sidebar to read it.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
