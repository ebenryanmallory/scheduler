/**
 * NotificationSettings Component
 * 
 * Implements:
 * - AC5: Allow users to customize notification timing
 * - AC8: Handle permission denial with clear messaging
 */

import { useEffect, useState } from 'react';
import { Bell, BellOff, Settings, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  notificationService,
  NotificationPermissionStatus,
} from '@/services/notificationService';
import {
  useSettingsStore,
  NOTIFICATION_TIMING_OPTIONS,
} from '@/store/settingsStore';

export function NotificationSettings() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>(
    notificationService.getPermissionStatus()
  );
  const [isOpen, setIsOpen] = useState(false);

  const {
    notifications,
    setNotificationsEnabled,
    setNotificationTiming,
    setSoundEnabled,
  } = useSettingsStore();

  // Update permission status on mount and when popup opens
  useEffect(() => {
    setPermissionStatus(notificationService.getPermissionStatus());
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const status = await notificationService.requestPermission();
    setPermissionStatus(status);
    if (status === 'granted') {
      setNotificationsEnabled(true);
    }
  };

  const handleTimingChange = (minutes: number, checked: boolean) => {
    const newTiming = checked
      ? [...notifications.timingMinutes, minutes].sort((a, b) => b - a)
      : notifications.timingMinutes.filter((m) => m !== minutes);
    setNotificationTiming(newTiming);
  };

  const isPermissionGranted = permissionStatus === 'granted';
  const isPermissionDenied = permissionStatus === 'denied';
  const canRequestPermission = permissionStatus === 'default';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notification settings"
        >
          {notifications.enabled && isPermissionGranted ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          {isPermissionDenied && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h4 className="font-medium">Notification Settings</h4>
          </div>

          {/* Permission Status */}
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="text-muted-foreground">
              {notificationService.getPermissionMessage(permissionStatus)}
            </p>
            {canRequestPermission && (
              <Button
                onClick={handleRequestPermission}
                size="sm"
                className="mt-2 w-full"
              >
                Enable Notifications
              </Button>
            )}
          </div>

          {/* Enable/Disable Toggle */}
          {isPermissionGranted && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-enabled" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </Label>
                <Checkbox
                  id="notifications-enabled"
                  checked={notifications.enabled}
                  onCheckedChange={(checked) => setNotificationsEnabled(checked === true)}
                />
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-enabled" className="flex items-center gap-2">
                  {notifications.soundEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                  Sound
                </Label>
                <Checkbox
                  id="sound-enabled"
                  checked={notifications.soundEnabled}
                  onCheckedChange={(checked) => setSoundEnabled(checked === true)}
                />
              </div>

              {/* Timing Options */}
              {notifications.enabled && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Remind me:</Label>
                  <div className="space-y-2">
                    {NOTIFICATION_TIMING_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`timing-${option.value}`}
                          checked={notifications.timingMinutes.includes(option.value)}
                          onCheckedChange={(checked) =>
                            handleTimingChange(option.value, checked === true)
                          }
                        />
                        <Label
                          htmlFor={`timing-${option.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Test Notification Button */}
          {isPermissionGranted && notifications.enabled && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                notificationService.show('Test Notification', {
                  body: 'Notifications are working correctly!',
                });
              }}
            >
              Send Test Notification
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

