import { useEffect, useState, useCallback } from 'react'
import { Wifi, WifiOff, CloudOff, RefreshCw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { syncService } from '@/services/syncService'
import { Button } from './ui/button'
import toast from 'react-hot-toast'

interface OfflineIndicatorProps {
  className?: string
}

/**
 * Offline Indicator Component
 * Shows connection status and pending sync count
 */
export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const { isOnline, isChecking, pendingCount, checkConnection } = useOnlineStatus()
  const [isSyncing, setIsSyncing] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  const handleSync = useCallback(async () => {
    if (isSyncing || !isOnline) return
    
    setIsSyncing(true)
    try {
      const result = await syncService.sync()
      
      if (result.success) {
        toast.success(`Synced ${result.synced} changes`)
      } else if (result.conflicts.length > 0) {
        toast.error(`${result.conflicts.length} conflicts need resolution`)
      } else {
        toast.error(`Failed to sync ${result.failed} changes`)
      }
    } catch (error) {
      toast.error('Sync failed. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, isOnline])

  // Show banner when going offline or coming back online with pending changes
  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true)
      setWasOffline(true)
    } else if (wasOffline && pendingCount > 0) {
      // Just came back online with pending changes
      setShowBanner(true)
      // Auto-sync after coming back online
      handleSync()
    } else if (wasOffline && pendingCount === 0) {
      // All synced, hide banner after a delay
      const timer = setTimeout(() => {
        setShowBanner(false)
        setWasOffline(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, pendingCount, wasOffline, handleSync])

  // Don't show anything if online with no pending changes and wasn't recently offline
  if (isOnline && pendingCount === 0 && !showBanner) {
    return null
  }

  return (
    <>
      {/* Compact indicator in header */}
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium transition-all',
          isOnline 
            ? pendingCount > 0 
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          className
        )}
      >
        {isOnline ? (
          pendingCount > 0 ? (
            <>
              <CloudOff className="h-3.5 w-3.5" />
              <span>{pendingCount} pending</span>
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Synced</span>
            </>
          )
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5" />
            <span>Offline</span>
          </>
        )}
      </div>

      {/* Full banner when offline or syncing */}
      {showBanner && (
        <div
          className={cn(
            'fixed top-0 left-0 right-0 z-[100] px-4 py-2',
            'flex items-center justify-center gap-3',
            'text-sm font-medium',
            'safe-area-top',
            isOnline
              ? 'bg-amber-500 text-white'
              : 'bg-red-500 text-white'
          )}
        >
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              <span>
                {isSyncing 
                  ? 'Syncing changes...' 
                  : pendingCount > 0 
                    ? `${pendingCount} changes to sync`
                    : 'All changes synced!'
                }
              </span>
              {pendingCount > 0 && !isSyncing && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSync}
                  className="h-6 px-2 text-xs"
                >
                  <RefreshCw className={cn('h-3 w-3 mr-1', isSyncing && 'animate-spin')} />
                  Sync Now
                </Button>
              )}
              {pendingCount === 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowBanner(false)}
                  className="h-6 px-2 text-xs"
                >
                  Dismiss
                </Button>
              )}
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>You're offline. Changes will sync when connected.</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={checkConnection}
                disabled={isChecking}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className={cn('h-3 w-3 mr-1', isChecking && 'animate-spin')} />
                Retry
              </Button>
            </>
          )}
        </div>
      )}
    </>
  )
}

/**
 * Simple offline badge for header
 */
export function OfflineBadge({ className }: { className?: string }) {
  const { isOnline, pendingCount } = useOnlineStatus()

  if (isOnline && pendingCount === 0) return null

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
        isOnline
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        className
      )}
    >
      {isOnline ? (
        <>
          <RefreshCw className="h-3 w-3" />
          {pendingCount}
        </>
      ) : (
        <WifiOff className="h-3 w-3" />
      )}
    </div>
  )
}

