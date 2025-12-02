/**
 * useNotifications Hook
 * 
 * Manages the notification lifecycle including:
 * - AC1: Requesting permission on first load
 * - AC2, AC3, AC4: Scheduling notifications at configured intervals
 * - AC6: Parsing schedule activity actions
 * 
 * Risk Mitigations:
 * - TECH-002: Uses polling instead of setTimeout
 */

import { useEffect, useRef } from 'react';
import { notificationService } from '@/services/notificationService';
import { useSettingsStore } from '@/store/settingsStore';
import { useTaskStore } from '@/store/taskStore';
import { scheduleActivities } from '@/data/scheduleActivities';

export function useNotifications() {
  const { notifications } = useSettingsStore();
  const { tasks, selectedDate } = useTaskStore();
  const hasRequestedPermission = useRef(false);

  // Request permission on first load (AC1)
  useEffect(() => {
    if (hasRequestedPermission.current) return;
    
    const status = notificationService.getPermissionStatus();
    
    // Only auto-request if never requested before and browser supports it
    if (
      status === 'default' &&
      !notificationService.hasRequestedPermission() &&
      notificationService.isSupported()
    ) {
      // Delay the permission request slightly to not be intrusive
      const timer = setTimeout(() => {
        notificationService.requestPermission();
      }, 3000);
      
      hasRequestedPermission.current = true;
      return () => clearTimeout(timer);
    }
    
    hasRequestedPermission.current = true;
  }, []);

  // Schedule notifications when tasks or settings change
  useEffect(() => {
    const status = notificationService.getPermissionStatus();
    
    // Don't schedule if notifications are disabled or permission not granted
    if (!notifications.enabled || status !== 'granted' || !selectedDate) {
      notificationService.stopPolling();
      return;
    }

    // Clear old notification tracking
    notificationService.clearOldNotifications(selectedDate);

    // Schedule notifications for tasks (AC2, AC3, AC4)
    notificationService.scheduleForTasks(
      tasks,
      selectedDate,
      notifications.timingMinutes
    );

    // Schedule notifications for schedule activities (AC6)
    notificationService.scheduleForActivities(
      scheduleActivities,
      selectedDate,
      notifications.timingMinutes
    );

    // Start polling
    notificationService.startPolling(30000); // Check every 30 seconds

    return () => {
      notificationService.stopPolling();
    };
  }, [tasks, selectedDate, notifications.enabled, notifications.timingMinutes]);

  return {
    isSupported: notificationService.isSupported(),
    permissionStatus: notificationService.getPermissionStatus(),
  };
}

