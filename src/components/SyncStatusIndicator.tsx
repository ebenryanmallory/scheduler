import { useState } from 'react'
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  History,
  Loader2
} from 'lucide-react'
import { Button } from './ui/button'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from './ui/tooltip'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from './ui/popover'
import { useGitSync, SyncStatus } from '@/hooks/useGitSync'
import { cn } from '@/lib/utils'
import { SyncHistoryModal } from './SyncHistoryModal'
import { GitConflictDialog } from './GitConflictDialog'

interface StatusConfig {
  icon: React.ReactNode
  label: string
  color: string
  bgColor: string
  animate?: boolean
}

const statusConfig: Record<SyncStatus, StatusConfig> = {
  idle: {
    icon: <Cloud className="h-4 w-4" />,
    label: 'Ready to sync',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
  syncing: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    label: 'Syncing...',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    animate: true
  },
  synced: {
    icon: <Check className="h-4 w-4" />,
    label: 'Synced',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  error: {
    icon: <CloudOff className="h-4 w-4" />,
    label: 'Sync error',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  conflict: {
    icon: <AlertTriangle className="h-4 w-4" />,
    label: 'Conflicts',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30'
  }
}

/**
 * Compact sync status indicator for header
 */
export function SyncStatusBadge() {
  const { state, isOnline, relativeLastSync, syncNow, isLoading } = useGitSync()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [conflictOpen, setConflictOpen] = useState(false)
  
  const config = statusConfig[state.status]
  
  if (!isOnline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">
              <CloudOff className="h-3 w-3" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>You're offline. Changes will sync when reconnected.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button 
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-colors",
              "hover:opacity-80 cursor-pointer",
              config.bgColor,
              config.color
            )}
          >
            {config.icon}
            <span className="hidden sm:inline">{config.label}</span>
            {state.pendingChanges > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-[10px] font-medium">
                {state.pendingChanges}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="end">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Git Sync</h4>
              <span className={cn("text-xs", config.color)}>{config.label}</span>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Last sync:</span>
                <span className="font-medium">{relativeLastSync}</span>
              </div>
              {state.pendingChanges > 0 && (
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="font-medium">{state.pendingChanges} changes</span>
                </div>
              )}
              {state.error && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 rounded text-red-600 dark:text-red-400">
                  {state.error}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => syncNow()}
                disabled={isLoading || state.status === 'syncing'}
                className="flex-1"
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
                Sync Now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setHistoryOpen(true)}
              >
                <History className="h-3 w-3" />
              </Button>
            </div>
            
            {state.status === 'conflict' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConflictOpen(true)}
                className="w-full"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Resolve Conflicts ({state.conflictFiles.length})
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      <SyncHistoryModal open={historyOpen} onOpenChange={setHistoryOpen} />
      <GitConflictDialog open={conflictOpen} onOpenChange={setConflictOpen} />
    </>
  )
}

/**
 * Full sync status indicator with more details
 */
export function SyncStatusIndicator() {
  const { 
    state, 
    isOnline, 
    relativeLastSync, 
    syncNow, 
    isLoading,
    history
  } = useGitSync()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [conflictOpen, setConflictOpen] = useState(false)
  
  const config = statusConfig[state.status]
  const recentLogs = history.slice(0, 3)
  
  return (
    <>
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              config.bgColor,
              config.color
            )}>
              {config.icon}
            </div>
            <div>
              <h3 className="font-medium">Git Sync</h3>
              <p className="text-sm text-muted-foreground">
                {isOnline ? config.label : 'Offline - Waiting for connection'}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncNow()}
            disabled={!isOnline || isLoading || state.status === 'syncing'}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Sync Now
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-2 bg-muted/50 rounded">
            <p className="text-lg font-semibold">{state.pendingChanges}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="p-2 bg-muted/50 rounded">
            <p className="text-lg font-semibold">{state.conflictFiles.length}</p>
            <p className="text-xs text-muted-foreground">Conflicts</p>
          </div>
          <div className="p-2 bg-muted/50 rounded">
            <p className="text-lg font-semibold truncate">{relativeLastSync}</p>
            <p className="text-xs text-muted-foreground">Last Sync</p>
          </div>
        </div>
        
        {/* Error Display */}
        {state.error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          </div>
        )}
        
        {/* Conflict Warning */}
        {state.status === 'conflict' && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {state.conflictFiles.length} file(s) have conflicts
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setConflictOpen(true)}>
                Resolve
              </Button>
            </div>
          </div>
        )}
        
        {/* Recent Activity */}
        {recentLogs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Recent Activity</h4>
              <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
                View All
              </Button>
            </div>
            <div className="space-y-1">
              {recentLogs.map(log => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between text-xs py-1"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      log.status === 'success' && "bg-green-500",
                      log.status === 'error' && "bg-red-500",
                      log.status === 'conflict' && "bg-amber-500"
                    )} />
                    <span className="text-muted-foreground">{log.operation}</span>
                    <span>{log.message}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <SyncHistoryModal open={historyOpen} onOpenChange={setHistoryOpen} />
      <GitConflictDialog open={conflictOpen} onOpenChange={setConflictOpen} />
    </>
  )
}

