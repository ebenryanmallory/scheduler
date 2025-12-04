import { useState } from 'react'
import { AlertTriangle, ArrowRight, Check } from 'lucide-react'
import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle 
} from './ui/responsive-dialog'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { ConflictInfo, syncService } from '@/services/syncService'
import type { TaskType } from '@/types/task'

interface ConflictResolutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conflicts: ConflictInfo[]
  onResolved: () => void
}

/**
 * Dialog for resolving sync conflicts
 */
export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflicts,
  onResolved
}: ConflictResolutionDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isResolving, setIsResolving] = useState(false)
  const [resolved, setResolved] = useState<Set<number>>(new Set())

  const currentConflict = conflicts[currentIndex]
  const hasMore = currentIndex < conflicts.length - 1

  const handleResolve = async (resolution: 'local' | 'server' | 'merge') => {
    if (!currentConflict) return

    setIsResolving(true)
    try {
      const success = await syncService.resolveConflict(
        currentConflict,
        resolution,
        resolution === 'merge' ? mergeTasks(currentConflict) : undefined
      )

      if (success) {
        setResolved(prev => new Set([...prev, currentIndex]))
        
        if (hasMore) {
          setCurrentIndex(prev => prev + 1)
        } else {
          // All conflicts resolved
          onResolved()
          onOpenChange(false)
        }
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
    } finally {
      setIsResolving(false)
    }
  }

  if (!currentConflict) return null

  const localTask = currentConflict.localData as TaskType
  const serverTask = currentConflict.serverData as TaskType

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[500px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Sync Conflict ({currentIndex + 1} of {conflicts.length})
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This task was modified both offline and on the server. Choose which version to keep:
          </p>

          {/* Comparison View */}
          <div className="grid grid-cols-2 gap-4">
            {/* Local Version */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Your Changes
              </h4>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 text-sm space-y-1">
                <p className="font-medium">{localTask.title}</p>
                {localTask.scheduledTime && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(localTask.scheduledTime).toLocaleString()}
                  </p>
                )}
                {localTask.completed !== undefined && (
                  <p className="text-xs">
                    Status: {localTask.completed ? 'Completed' : 'Pending'}
                  </p>
                )}
              </div>
            </div>

            {/* Server Version */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Server Version
              </h4>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-sm space-y-1">
                <p className="font-medium">{serverTask.title}</p>
                {serverTask.scheduledTime && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(serverTask.scheduledTime).toLocaleString()}
                  </p>
                )}
                {serverTask.completed !== undefined && (
                  <p className="text-xs">
                    Status: {serverTask.completed ? 'Completed' : 'Pending'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Differences Highlight */}
          <DifferencesList local={localTask} server={serverTask} />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => handleResolve('local')}
              disabled={isResolving}
              className="flex-1 min-h-[44px]"
            >
              Keep My Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => handleResolve('server')}
              disabled={isResolving}
              className="flex-1 min-h-[44px]"
            >
              Use Server Version
            </Button>
            <Button
              onClick={() => handleResolve('merge')}
              disabled={isResolving}
              className="flex-1 min-h-[44px]"
            >
              <Check className="h-4 w-4 mr-1" />
              Merge Both
            </Button>
          </div>

          {/* Progress indicator */}
          {conflicts.length > 1 && (
            <div className="flex items-center justify-center gap-1 pt-2">
              {conflicts.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    resolved.has(i)
                      ? 'bg-green-500'
                      : i === currentIndex
                        ? 'bg-primary'
                        : 'bg-muted'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

/**
 * Component to show differences between local and server versions
 */
function DifferencesList({ local, server }: { local: TaskType; server: TaskType }) {
  const differences: { field: string; local: string; server: string }[] = []

  if (local.title !== server.title) {
    differences.push({ field: 'Title', local: local.title, server: server.title })
  }
  if (local.completed !== server.completed) {
    differences.push({
      field: 'Status',
      local: local.completed ? 'Completed' : 'Pending',
      server: server.completed ? 'Completed' : 'Pending'
    })
  }
  if (local.scheduledTime !== server.scheduledTime) {
    differences.push({
      field: 'Scheduled',
      local: local.scheduledTime ? new Date(local.scheduledTime).toLocaleString() : 'Not set',
      server: server.scheduledTime ? new Date(server.scheduledTime).toLocaleString() : 'Not set'
    })
  }
  if (local.project !== server.project) {
    differences.push({
      field: 'Project',
      local: local.project || 'None',
      server: server.project || 'None'
    })
  }

  if (differences.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        No visible differences detected
      </p>
    )
  }

  return (
    <div className="text-xs space-y-1">
      <h4 className="font-medium text-muted-foreground">Differences:</h4>
      {differences.map((diff, i) => (
        <div key={i} className="flex items-center gap-2 py-1">
          <span className="text-muted-foreground w-20">{diff.field}:</span>
          <span className="text-blue-600 dark:text-blue-400 truncate flex-1">{diff.local}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-green-600 dark:text-green-400 truncate flex-1">{diff.server}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Merge two task versions, preferring non-null values and latest timestamps
 */
function mergeTasks(conflict: ConflictInfo): TaskType {
  const local = conflict.localData as TaskType
  const server = conflict.serverData as TaskType

  return {
    ...server,
    ...local,
    // Prefer completed if either is completed
    completed: local.completed || server.completed,
    // Prefer the latest scheduled time
    scheduledTime: (local.scheduledTime && server.scheduledTime)
      ? new Date(local.scheduledTime) > new Date(server.scheduledTime)
        ? local.scheduledTime
        : server.scheduledTime
      : local.scheduledTime || server.scheduledTime,
    // Keep server ID
    id: server.id || local.id
  }
}

