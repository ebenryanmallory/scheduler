/**
 * Settings Store - Manages notification preferences and app settings
 * 
 * Implements:
 * - AC5: Customizable notification timing
 * - AC7: Persist preferences in localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotificationSettings {
  enabled: boolean;
  timingMinutes: number[];  // Minutes before task to notify [15, 5, 0]
  soundEnabled: boolean;
}

export interface SettingsState {
  notifications: NotificationSettings;
  
  // Actions
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationTiming: (timingMinutes: number[]) => void;
  setSoundEnabled: (enabled: boolean) => void;
  resetNotificationSettings: () => void;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  timingMinutes: [15, 5, 0],  // Default: 15 min, 5 min, and at start
  soundEnabled: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifications: DEFAULT_NOTIFICATION_SETTINGS,

      setNotificationsEnabled: (enabled) =>
        set((state) => ({
          notifications: { ...state.notifications, enabled },
        })),

      setNotificationTiming: (timingMinutes) =>
        set((state) => ({
          notifications: { ...state.notifications, timingMinutes },
        })),

      setSoundEnabled: (soundEnabled) =>
        set((state) => ({
          notifications: { ...state.notifications, soundEnabled },
        })),

      resetNotificationSettings: () =>
        set({ notifications: DEFAULT_NOTIFICATION_SETTINGS }),
    }),
    {
      name: 'scheduler-settings',  // localStorage key
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);

// Available timing options for the UI
export const NOTIFICATION_TIMING_OPTIONS = [
  { value: 30, label: '30 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 5, label: '5 minutes before' },
  { value: 1, label: '1 minute before' },
  { value: 0, label: 'At start time' },
];

