import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'pwa-install-dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * PWA Install Prompt Component
 * Shows an install banner when the app can be installed
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISSED_KEY)
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10)
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return // Still within dismiss period
      }
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(isIOSDevice)

    // Listen for install prompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Show iOS prompt after a delay if on iOS and not installed
    if (isIOSDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 5000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setShowPrompt(false)
      }
    } catch (error) {
      console.error('Install prompt error:', error)
    }
    
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem(DISMISSED_KEY, Date.now().toString())
  }

  if (isInstalled || !showPrompt) return null

  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50',
        'bg-card border border-border rounded-lg shadow-lg',
        'animate-in slide-in-from-bottom-4 duration-300'
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install App</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isIOS 
                ? 'Add to Home Screen for the best experience'
                : 'Install for quick access and offline support'
              }
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-muted rounded min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 -mt-2"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <p>To install on iOS:</p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Tap the Share button <span className="inline-block">⬆️</span></li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" to confirm</li>
            </ol>
          </div>
        ) : (
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="flex-1 min-h-[44px]"
            >
              Not Now
            </Button>
            <Button
              size="sm"
              onClick={handleInstall}
              className="flex-1 min-h-[44px]"
            >
              <Download className="h-4 w-4 mr-1" />
              Install
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Hook to check if app is installed as PWA
 */
export function useIsInstalled(): boolean {
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches)
  }, [])

  return isInstalled
}

