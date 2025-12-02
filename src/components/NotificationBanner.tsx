/**
 * NotificationBanner Component
 * 
 * Shows a dismissible banner when notifications are blocked or need enabling.
 * Implements AC8: Handle permission denial gracefully with clear messaging.
 */

import { useEffect, useState } from 'react';
import { X, Bell, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  notificationService,
  NotificationPermissionStatus,
} from '@/services/notificationService';

const DISMISSED_KEY = 'notification_banner_dismissed';

export function NotificationBanner() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>(
    notificationService.getPermissionStatus()
  );
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(DISMISSED_KEY) === 'true';
  });

  useEffect(() => {
    // Re-check permission status periodically
    const interval = setInterval(() => {
      const newStatus = notificationService.getPermissionStatus();
      if (newStatus !== permissionStatus) {
        setPermissionStatus(newStatus);
        // Reset dismissed state if permission changes
        if (newStatus === 'granted') {
          localStorage.removeItem(DISMISSED_KEY);
          setIsDismissed(false);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [permissionStatus]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  const handleRequestPermission = async () => {
    const status = await notificationService.requestPermission();
    setPermissionStatus(status);
  };

  // Don't show if granted, unsupported, or dismissed
  if (
    permissionStatus === 'granted' ||
    permissionStatus === 'unsupported' ||
    isDismissed
  ) {
    return null;
  }

  const isDenied = permissionStatus === 'denied';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 text-sm ${
        isDenied
          ? 'bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800'
          : 'bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800'
      }`}
      role="alert"
    >
      {isDenied ? (
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
      ) : (
        <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
      )}

      <p className={`flex-1 ${isDenied ? 'text-amber-800 dark:text-amber-200' : 'text-blue-800 dark:text-blue-200'}`}>
        {isDenied ? (
          <>
            <strong>Notifications are blocked.</strong> To enable task reminders,
            click the lock icon in your browser's address bar and allow notifications.
          </>
        ) : (
          <>
            <strong>Stay on track!</strong> Enable notifications to receive reminders
            before your scheduled tasks.
          </>
        )}
      </p>

      {!isDenied && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleRequestPermission}
          className="shrink-0"
        >
          Enable
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={handleDismiss}
        aria-label="Dismiss notification banner"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

