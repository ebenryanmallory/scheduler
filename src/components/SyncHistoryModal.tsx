import { 
  GitCommit, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw
} from 'lucide-react'
import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle,
  ResponsiveDialogDescription
} from './ui/responsive-dialog'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { useGitSync, SyncLogEntry } from '@/hooks/useGitSync'
import { cn } from '@/lib/utils'

interface SyncHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const operationConfig: Record<SyncLogEntry['operation'], { 
  icon: React.ReactNode
  label: string
  color: string 
}> = {
  commit: {
    icon: <GitCommit className="h-4 w-4" />,
    label: 'Commit',
    color: 'text-purple-600 dark:text-purple-400'
  },
  push: {
    icon: <Upload className="h-4 w-4" />,
    label: 'Push',
    color: 'text-blue-600 dark:text-blue-400'
  },
  pull: {
    icon: <Download className="h-4 w-4" />,
    label: 'Pull',
    color: 'text-cyan-600 dark:text-cyan-400'
  },
  resolve: {
    icon: <CheckCircle className="h-4 w-4" />,
    label: 'Resolve',
    color: 'text-green-600 dark:text-green-400'
  }
}

const statusConfig: Record<SyncLogEntry['status'], {
  icon: React.ReactNode
  color: string
  bgColor: string
}> = {
  success: {
    icon: <CheckCircle className="h-3 w-3" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  error: {
    icon: <XCircle className="h-3 w-3" />,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  conflict: {
    icon: <AlertTriangle className="h-3 w-3" />,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30'
  }
}

/**
 * Modal showing sync history/log
 */
export function SyncHistoryModal({ open, onOpenChange }: SyncHistoryModalProps) {
  const { history, refreshHistory, isLoading } = useGitSync()

  const formatTimestamp = (timestamp: string): { date: string; time: string } => {
    const d = new Date(timestamp)
    return {
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Group entries by date
  const groupedHistory = history.reduce((groups, entry) => {
    const dateKey = new Date(entry.timestamp).toLocaleDateString()
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(entry)
    return groups
  }, {} as Record<string, SyncLogEntry[]>)

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[500px]">
        <ResponsiveDialogHeader>
          <div className="flex items-center justify-between">
            <ResponsiveDialogTitle className="flex items-center gap-2">
              <GitCommit className="h-5 w-5" />
              Sync History
            </ResponsiveDialogTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={refreshHistory}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
          <ResponsiveDialogDescription>
            Recent Git sync operations (last 50 entries)
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <GitCommit className="h-8 w-8 mb-2 opacity-50" />
              <p>No sync history yet</p>
              <p className="text-xs">Changes will appear here after syncing</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedHistory).map(([date, entries]) => (
                <div key={date} className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground sticky top-0 bg-background py-1">
                    {date === new Date().toLocaleDateString() ? 'Today' : date}
                  </h3>
                  
                  <div className="space-y-2">
                    {entries.map((entry) => {
                      const opConfig = operationConfig[entry.operation]
                      const statConfig = statusConfig[entry.status]
                      const { time } = formatTimestamp(entry.timestamp)
                      
                      return (
                        <div 
                          key={entry.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          {/* Operation Icon */}
                          <div className={cn("mt-0.5", opConfig.color)}>
                            {opConfig.icon}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {opConfig.label}
                              </span>
                              <span className={cn(
                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                                statConfig.bgColor,
                                statConfig.color
                              )}>
                                {statConfig.icon}
                                {entry.status}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {entry.message}
                            </p>
                            
                            {entry.details && (
                              <p className="text-xs text-muted-foreground/70 truncate">
                                {entry.details}
                              </p>
                            )}
                            
                            {entry.commitHash && (
                              <p className="text-xs font-mono text-muted-foreground/70">
                                {entry.commitHash.slice(0, 7)}
                              </p>
                            )}
                          </div>
                          
                          {/* Time */}
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {time}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

