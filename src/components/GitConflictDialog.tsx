import { useState, useMemo } from 'react'
import { AlertTriangle, Check, X, Edit3, ArrowLeft, ArrowRight } from 'lucide-react'
import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle,
  ResponsiveDialogDescription
} from './ui/responsive-dialog'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { useGitSync } from '@/hooks/useGitSync'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface GitConflictDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Dialog for resolving Git merge conflicts
 */
export function GitConflictDialog({ open, onOpenChange }: GitConflictDialogProps) {
  const { conflicts, resolveConflict, isLoading, state } = useGitSync()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [mergedContent, setMergedContent] = useState('')
  const [resolvedFiles, setResolvedFiles] = useState<Set<string>>(new Set())
  
  const currentConflict = conflicts[currentIndex]
  const hasNext = currentIndex < conflicts.length - 1
  const hasPrev = currentIndex > 0

  // Initialize merged content when conflict changes
  useMemo(() => {
    if (currentConflict) {
      // Start with local content as base for merge
      setMergedContent(currentConflict.localContent)
    }
  }, [currentConflict])

  const handleResolve = async (resolution: 'local' | 'remote' | 'merge') => {
    if (!currentConflict) return

    const result = await resolveConflict(
      currentConflict.file,
      resolution,
      resolution === 'merge' ? mergedContent : undefined
    )

    if (result.success) {
      setResolvedFiles(prev => new Set([...prev, currentConflict.file]))
      toast.success(`Resolved: ${currentConflict.file}`)
      
      // Move to next conflict or close if done
      if (hasNext) {
        setCurrentIndex(prev => prev + 1)
        setEditMode(false)
      } else if (state.conflictFiles.length === 0) {
        onOpenChange(false)
        toast.success('All conflicts resolved!')
      }
    } else {
      toast.error(result.error || 'Failed to resolve conflict')
    }
  }

  if (!currentConflict && conflicts.length === 0) {
    return (
      <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent className="sm:max-w-[400px]">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Check className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">No Conflicts</h3>
            <p className="text-sm text-muted-foreground mt-2">
              All merge conflicts have been resolved.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Close
            </Button>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    )
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Git Merge Conflict ({currentIndex + 1} of {conflicts.length})
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            File: <code className="text-xs bg-muted px-1 py-0.5 rounded">{currentConflict?.file}</code>
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {currentConflict && (
          <div className="space-y-4">
            {/* Navigation */}
            {conflicts.length > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCurrentIndex(prev => prev - 1)
                    setEditMode(false)
                  }}
                  disabled={!hasPrev}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                {/* Progress dots */}
                <div className="flex items-center gap-1">
                  {conflicts.map((c, i) => (
                    <button
                      key={c.file}
                      onClick={() => {
                        setCurrentIndex(i)
                        setEditMode(false)
                      }}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        resolvedFiles.has(c.file)
                          ? 'bg-green-500'
                          : i === currentIndex
                            ? 'bg-primary'
                            : 'bg-muted hover:bg-muted-foreground/30'
                      )}
                    />
                  ))}
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCurrentIndex(prev => prev + 1)
                    setEditMode(false)
                  }}
                  disabled={!hasNext}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Diff View or Edit Mode */}
            {editMode ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Edit Merged Content</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditMode(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
                <textarea
                  value={mergedContent}
                  onChange={(e) => setMergedContent(e.target.value)}
                  className="w-full h-[300px] p-3 font-mono text-xs bg-muted rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button 
                  onClick={() => handleResolve('merge')}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save Merged Version
                </Button>
              </div>
            ) : (
              <>
                {/* Side-by-side comparison */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Local Version */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      Your Changes (Local)
                    </h4>
                    <ScrollArea className="h-[200px]">
                      <pre className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                        {currentConflict.localContent || '(empty)'}
                      </pre>
                    </ScrollArea>
                  </div>

                  {/* Remote Version */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      Server Version (Remote)
                    </h4>
                    <ScrollArea className="h-[200px]">
                      <pre className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                        {currentConflict.remoteContent || '(empty)'}
                      </pre>
                    </ScrollArea>
                  </div>
                </div>

                {/* Diff highlights */}
                <DiffHighlights 
                  local={currentConflict.localContent} 
                  remote={currentConflict.remoteContent}
                />

                {/* Resolution Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleResolve('local')}
                    disabled={isLoading}
                    className="flex flex-col items-center py-4 h-auto"
                  >
                    <span className="w-3 h-3 rounded-full bg-blue-500 mb-2" />
                    <span className="text-xs">Keep Local</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleResolve('remote')}
                    disabled={isLoading}
                    className="flex flex-col items-center py-4 h-auto"
                  >
                    <span className="w-3 h-3 rounded-full bg-green-500 mb-2" />
                    <span className="text-xs">Keep Remote</span>
                  </Button>
                  
                  <Button
                    onClick={() => setEditMode(true)}
                    disabled={isLoading}
                    className="flex flex-col items-center py-4 h-auto"
                  >
                    <Edit3 className="h-4 w-4 mb-2" />
                    <span className="text-xs">Merge Manually</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

/**
 * Show simple diff highlights between local and remote
 */
function DiffHighlights({ local, remote }: { local: string; remote: string }) {
  // Simple line-by-line diff
  const localLines = local.split('\n')
  const remoteLines = remote.split('\n')
  
  const changes: { type: 'added' | 'removed' | 'modified'; line: number }[] = []
  
  const maxLines = Math.max(localLines.length, remoteLines.length)
  for (let i = 0; i < maxLines; i++) {
    if (localLines[i] !== remoteLines[i]) {
      if (!localLines[i]) {
        changes.push({ type: 'added', line: i + 1 })
      } else if (!remoteLines[i]) {
        changes.push({ type: 'removed', line: i + 1 })
      } else {
        changes.push({ type: 'modified', line: i + 1 })
      }
    }
  }

  if (changes.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        No visible differences
      </p>
    )
  }

  // Show summary of changes
  const added = changes.filter(c => c.type === 'added').length
  const removed = changes.filter(c => c.type === 'removed').length
  const modified = changes.filter(c => c.type === 'modified').length

  return (
    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground py-2 bg-muted/50 rounded">
      {added > 0 && (
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
          +{added} added
        </span>
      )}
      {removed > 0 && (
        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
          -{removed} removed
        </span>
      )}
      {modified > 0 && (
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          ~{modified} modified
        </span>
      )}
    </div>
  )
}

