/**
 * NotificationService - Handles browser notifications for scheduled tasks
 * 
 * Implements:
 * - AC1: Permission request on first load
 * - AC8: Graceful handling of permission denial
 * - AC9: Cross-browser support via feature detection
 * - AC10: Duplicate prevention
 * 
 * Risk Mitigations:
 * - TECH-001: Feature detection for cross-browser support
 * - TECH-002: Uses polling approach instead of long setTimeout
 * - OPS-001: Tracks sent notifications to prevent duplicates
 */

import type { TaskType } from '@/types/task';
import type { Action, ScheduleActivity } from '@/types/schedule';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface NotificationPreferences {
  enabled: boolean;
  timingMinutes: number[];  // e.g., [15, 5, 0] for 15min, 5min, and start
  soundEnabled: boolean;
}

export interface ScheduledNotification {
  taskId: string;
  taskTitle: string;
  scheduledTime: Date;
  notificationTime: Date;
  minutesBefore: number;
  message?: string;
}

const STORAGE_KEY_PERMISSION_REQUESTED = 'notification_permission_requested';
const STORAGE_KEY_SENT_NOTIFICATIONS = 'notification_sent_ids';
const NOTIFICATION_TOLERANCE_MS = 60000; // 60 second tolerance window

class NotificationService {
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private scheduledNotifications: ScheduledNotification[] = [];
  private sentNotificationIds: Set<string> = new Set();

  constructor() {
    this.loadSentNotifications();
  }

  /**
   * Check if the Notifications API is supported
   * TECH-001 mitigation: Feature detection
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermissionStatus {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    return Notification.permission as NotificationPermissionStatus;
  }

  /**
   * Check if permission has been requested before
   */
  hasRequestedPermission(): boolean {
    return localStorage.getItem(STORAGE_KEY_PERMISSION_REQUESTED) === 'true';
  }

  /**
   * Request notification permission
   * AC1: Request on first load
   * AC8: Handle denial gracefully
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    // Mark that we've requested permission
    localStorage.setItem(STORAGE_KEY_PERMISSION_REQUESTED, 'true');

    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationPermissionStatus;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a notification
   * AC9: Works across browsers via standard API
   */
  show(title: string, options?: NotificationOptions): Notification | null {
    if (!this.isSupported() || this.getPermissionStatus() !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        ...options,
      });

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Generate unique notification key for duplicate detection
   * AC10: Prevent duplicates
   */
  private generateNotificationKey(taskId: string, minutesBefore: number, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    return `${taskId}-${minutesBefore}-${dateStr}`;
  }

  /**
   * Check if notification was already sent
   * OPS-001 mitigation: Duplicate detection
   */
  private wasNotificationSent(key: string): boolean {
    return this.sentNotificationIds.has(key);
  }

  /**
   * Mark notification as sent
   */
  private markNotificationSent(key: string): void {
    this.sentNotificationIds.add(key);
    this.saveSentNotifications();
  }

  /**
   * Load sent notifications from localStorage
   */
  private loadSentNotifications(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SENT_NOTIFICATIONS);
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        this.sentNotificationIds = new Set(ids);
      }
    } catch {
      this.sentNotificationIds = new Set();
    }
  }

  /**
   * Save sent notifications to localStorage
   */
  private saveSentNotifications(): void {
    try {
      // Only keep last 1000 entries to prevent storage bloat
      const ids = Array.from(this.sentNotificationIds).slice(-1000);
      localStorage.setItem(STORAGE_KEY_SENT_NOTIFICATIONS, JSON.stringify(ids));
    } catch (error) {
      console.error('Error saving sent notifications:', error);
    }
  }

  /**
   * Clear old notification tracking (for dates in the past)
   */
  clearOldNotifications(currentDate: Date): void {
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const newIds = Array.from(this.sentNotificationIds).filter(id => {
      const datePart = id.split('-').slice(-1)[0];
      return datePart >= currentDateStr;
    });
    this.sentNotificationIds = new Set(newIds);
    this.saveSentNotifications();
  }

  /**
   * Calculate notification time from task time
   * AC2, AC3, AC4: Calculate notification times
   * TECH-002 mitigation: Precise time calculation
   */
  calculateNotificationTime(taskTime: Date, minutesBefore: number): Date {
    return new Date(taskTime.getTime() - minutesBefore * 60 * 1000);
  }

  /**
   * Parse time string (HH:MM) to Date for today
   */
  parseTimeToDate(timeStr: string, date: Date): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  /**
   * Schedule notifications for a list of tasks
   * AC2, AC3, AC4: Send notifications at configured times
   */
  scheduleForTasks(
    tasks: TaskType[], 
    date: Date, 
    timingMinutes: number[]
  ): void {
    this.scheduledNotifications = [];

    for (const task of tasks) {
      if (!task.scheduledTime || task.completed) continue;

      const taskTime = this.parseTimeToDate(task.scheduledTime, date);
      
      for (const minutesBefore of timingMinutes) {
        const notificationTime = this.calculateNotificationTime(taskTime, minutesBefore);
        
        // Only schedule future notifications
        if (notificationTime.getTime() > Date.now()) {
          this.scheduledNotifications.push({
            taskId: task.id,
            taskTitle: task.title,
            scheduledTime: taskTime,
            notificationTime,
            minutesBefore,
          });
        }
      }
    }
  }

  /**
   * Schedule notifications for schedule activities
   * AC6: Parse and execute notification actions from schedule
   */
  scheduleForActivities(
    activities: Record<string, ScheduleActivity>,
    date: Date,
    timingMinutes: number[]
  ): void {
    for (const [timeStr, activity] of Object.entries(activities)) {
      const activityTime = this.parseTimeToDate(timeStr, date);
      const activityId = `activity-${timeStr}`;

      // Schedule at configured timing intervals
      for (const minutesBefore of timingMinutes) {
        const notificationTime = this.calculateNotificationTime(activityTime, minutesBefore);
        
        if (notificationTime.getTime() > Date.now()) {
          // Find the reminder action message if available
          const reminderAction = activity.actions?.find(
            (a: Action) => a.type === 'reminder' || a.type === 'alarm'
          );
          
          this.scheduledNotifications.push({
            taskId: activityId,
            taskTitle: activity.activity,
            scheduledTime: activityTime,
            notificationTime,
            minutesBefore,
            message: reminderAction?.message,
          });
        }
      }
    }
  }

  /**
   * Start polling for notifications
   * TECH-002 mitigation: Polling instead of long setTimeout
   */
  startPolling(checkIntervalMs: number = 30000): void {
    if (this.pollingInterval) {
      this.stopPolling();
    }

    // Check immediately
    this.checkAndSendNotifications();

    // Then check every interval
    this.pollingInterval = setInterval(() => {
      this.checkAndSendNotifications();
    }, checkIntervalMs);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Check scheduled notifications and send if due
   */
  private checkAndSendNotifications(): void {
    const now = Date.now();

    for (const scheduled of this.scheduledNotifications) {
      const timeDiff = scheduled.notificationTime.getTime() - now;
      
      // Check if within tolerance window (due now or slightly overdue)
      if (timeDiff <= 0 && timeDiff > -NOTIFICATION_TOLERANCE_MS) {
        const key = this.generateNotificationKey(
          scheduled.taskId,
          scheduled.minutesBefore,
          scheduled.scheduledTime
        );

        // AC10: Check for duplicates
        if (!this.wasNotificationSent(key)) {
          this.sendScheduledNotification(scheduled);
          this.markNotificationSent(key);
        }
      }
    }

    // Clean up past notifications
    this.scheduledNotifications = this.scheduledNotifications.filter(
      n => n.notificationTime.getTime() > now - NOTIFICATION_TOLERANCE_MS
    );
  }

  /**
   * Send a scheduled notification
   */
  private sendScheduledNotification(scheduled: ScheduledNotification): void {
    let title: string;
    let body: string;

    if (scheduled.minutesBefore === 0) {
      title = `⏰ Starting Now: ${scheduled.taskTitle}`;
      body = scheduled.message || 'Your scheduled task is starting now!';
    } else {
      title = `🔔 ${scheduled.minutesBefore} minutes: ${scheduled.taskTitle}`;
      body = scheduled.message || `Starting at ${this.formatTime(scheduled.scheduledTime)}`;
    }

    this.show(title, {
      body,
      tag: scheduled.taskId, // Prevents duplicate system notifications
    });
  }

  /**
   * Format time for display
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Get user-friendly message for permission status
   * AC8: Clear messaging for permission states
   */
  getPermissionMessage(status: NotificationPermissionStatus): string {
    switch (status) {
      case 'granted':
        return 'Notifications are enabled. You\'ll receive reminders for your tasks.';
      case 'denied':
        return 'Notifications are blocked. To enable, click the lock icon in your browser\'s address bar and allow notifications.';
      case 'default':
        return 'Enable notifications to receive reminders for your upcoming tasks.';
      case 'unsupported':
        return 'Your browser doesn\'t support notifications. Try using Chrome, Firefox, Safari, or Edge.';
      default:
        return 'Unable to determine notification status.';
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

