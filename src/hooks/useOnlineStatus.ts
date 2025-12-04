import { useState, useEffect, useCallback, useRef } from 'react'
import { offlineQueue } from '@/services/offlineQueue'

interface OnlineStatusReturn {
  isOnline: boolean
  isChecking: boolean
  pendingCount: number
  lastChecked: Date | null
  checkConnection: () => Promise<boolean>
}

/**
 * Hook to detect online/offline status
 * Uses navigator.onLine + actual connectivity check
 */
export function useOnlineStatus(): OnlineStatusReturn {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [isChecking, setIsChecking] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Perform actual connectivity check by pinging the API
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsChecking(true)
    try {
      // Try to fetch a lightweight endpoint
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store'
      })
      
      clearTimeout(timeoutId)
      const online = response.ok
      setIsOnline(online)
      setLastChecked(new Date())
      return online
    } catch {
      // Network error or timeout - we're offline
      setIsOnline(false)
      setLastChecked(new Date())
      return false
    } finally {
      setIsChecking(false)
    }
  }, [])

  /**
   * Update pending operation count
   */
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await offlineQueue.getPendingCount()
      setPendingCount(count)
    } catch {
      // IndexedDB might not be available
    }
  }, [])

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Double-check with actual request
      checkConnection()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    if (navigator.onLine) {
      checkConnection()
    }

    // Periodic connectivity check when online
    checkIntervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        checkConnection()
      }
      updatePendingCount()
    }, 30000) // Check every 30 seconds

    // Initial pending count
    updatePendingCount()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [checkConnection, updatePendingCount])

  // Update pending count when coming back online
  useEffect(() => {
    if (isOnline) {
      updatePendingCount()
    }
  }, [isOnline, updatePendingCount])

  return {
    isOnline,
    isChecking,
    pendingCount,
    lastChecked,
    checkConnection
  }
}

/**
 * Simple hook that just returns online status boolean
 */
export function useIsOnline(): boolean {
  const { isOnline } = useOnlineStatus()
  return isOnline
}

