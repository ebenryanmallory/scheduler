/**
 * Template Store (AC6, AC7, AC8, AC9)
 * Zustand store for managing task templates
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TaskTemplate, TemplateExport } from '@/types/recurrence'
import { TaskType } from '@/types/task'

interface TemplateState {
  templates: TaskTemplate[]
  isLoading: boolean
  error: string | null
}

interface TemplateActions {
  // CRUD operations
  addTemplate: (template: Omit<TaskTemplate, 'id' | 'createdAt'>) => void
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => void
  deleteTemplate: (id: string) => void
  
  // Create from task (AC8)
  createTemplateFromTask: (task: TaskType, name: string) => void
  
  // Import/Export (AC9)
  exportTemplates: (templateIds?: string[]) => TemplateExport
  importTemplates: (data: TemplateExport) => { imported: number; skipped: number }
  
  // Built-in templates (AC7)
  loadBuiltInTemplates: () => void
  
  // Utility
  getTemplateById: (id: string) => TaskTemplate | undefined
  getTemplatesByCategory: (category: string) => TaskTemplate[]
  clearError: () => void
}

type TemplateStore = TemplateState & TemplateActions

// Built-in templates derived from common schedule patterns (AC7)
const BUILT_IN_TEMPLATES: Omit<TaskTemplate, 'id' | 'createdAt'>[] = [
  {
    name: 'Morning Routine',
    description: 'Daily morning tasks to start your day right',
    taskDefaults: {
      title: 'Morning Routine',
      estimatedDuration: 60,
      scheduledTime: '07:00',
      recurrence: {
        frequency: 'daily',
        interval: 1,
        endType: 'never',
      },
    },
    isBuiltIn: true,
    category: 'Routines',
  },
  {
    name: 'Exercise Session',
    description: 'Regular workout or physical activity',
    taskDefaults: {
      title: 'Exercise',
      estimatedDuration: 45,
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        byWeekday: ['MO', 'WE', 'FR'],
        endType: 'never',
      },
    },
    isBuiltIn: true,
    category: 'Health',
  },
  {
    name: 'Weekly Review',
    description: 'End-of-week reflection and planning',
    taskDefaults: {
      title: 'Weekly Review',
      estimatedDuration: 30,
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        byWeekday: ['FR'],
        endType: 'never',
      },
    },
    isBuiltIn: true,
    category: 'Productivity',
  },
  {
    name: 'Daily Standup',
    description: 'Team standup or daily planning meeting',
    taskDefaults: {
      title: 'Daily Standup',
      estimatedDuration: 15,
      scheduledTime: '09:00',
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        byWeekday: ['MO', 'TU', 'WE', 'TH', 'FR'],
        endType: 'never',
      },
    },
    isBuiltIn: true,
    category: 'Work',
  },
  {
    name: 'Deep Work Block',
    description: 'Focused work without interruptions',
    taskDefaults: {
      title: 'Deep Work',
      estimatedDuration: 120,
      description: 'No meetings, no distractions. Focus on important work.',
    },
    isBuiltIn: true,
    category: 'Productivity',
  },
  {
    name: 'Email Processing',
    description: 'Batch process and respond to emails',
    taskDefaults: {
      title: 'Process Emails',
      estimatedDuration: 30,
      recurrence: {
        frequency: 'daily',
        interval: 1,
        endType: 'never',
      },
    },
    isBuiltIn: true,
    category: 'Work',
  },
  {
    name: 'Learning Time',
    description: 'Dedicated time for learning and skill development',
    taskDefaults: {
      title: 'Learning Session',
      estimatedDuration: 60,
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        byWeekday: ['TU', 'TH'],
        endType: 'never',
      },
    },
    isBuiltIn: true,
    category: 'Growth',
  },
  {
    name: 'Break',
    description: 'Short break to recharge',
    taskDefaults: {
      title: 'Break',
      estimatedDuration: 15,
    },
    isBuiltIn: true,
    category: 'Health',
  },
]

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      templates: [],
      isLoading: false,
      error: null,

      addTemplate: (template) => {
        const newTemplate: TaskTemplate = {
          ...template,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }))
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }))
      },

      deleteTemplate: (id) => {
        const template = get().templates.find((t) => t.id === id)
        if (template?.isBuiltIn) {
          set({ error: 'Cannot delete built-in templates' })
          return
        }
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }))
      },

      createTemplateFromTask: (task, name) => {
        const template: Omit<TaskTemplate, 'id' | 'createdAt'> = {
          name,
          description: task.description,
          taskDefaults: {
            title: task.title,
            description: task.description,
            project: task.project,
            estimatedDuration: task.estimatedDuration,
            persistent: task.persistent,
          },
          isBuiltIn: false,
          category: task.project || 'Custom',
        }
        get().addTemplate(template)
      },

      exportTemplates: (templateIds) => {
        const templates = templateIds
          ? get().templates.filter((t) => templateIds.includes(t.id))
          : get().templates.filter((t) => !t.isBuiltIn)

        return {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          templates,
        }
      },

      importTemplates: (data) => {
        if (data.version !== '1.0') {
          set({ error: 'Unsupported template export version' })
          return { imported: 0, skipped: 0 }
        }

        const existingNames = new Set(get().templates.map((t) => t.name))
        let imported = 0
        let skipped = 0

        data.templates.forEach((template) => {
          if (existingNames.has(template.name)) {
            skipped++
            return
          }

          get().addTemplate({
            ...template,
            isBuiltIn: false, // Never import as built-in
          })
          imported++
        })

        return { imported, skipped }
      },

      loadBuiltInTemplates: () => {
        const existingBuiltIn = get().templates.filter((t) => t.isBuiltIn)
        if (existingBuiltIn.length > 0) {
          return // Already loaded
        }

        const builtInTemplates = BUILT_IN_TEMPLATES.map((t) => ({
          ...t,
          id: `builtin-${t.name.toLowerCase().replace(/\s+/g, '-')}`,
          createdAt: new Date().toISOString(),
        }))

        set((state) => ({
          templates: [...builtInTemplates, ...state.templates],
        }))
      },

      getTemplateById: (id) => {
        return get().templates.find((t) => t.id === id)
      },

      getTemplatesByCategory: (category) => {
        return get().templates.filter((t) => t.category === category)
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'scheduler_templates',
      partialize: (state) => ({
        templates: state.templates,
      }),
    }
  )
)

// Initialize built-in templates on first load
if (typeof window !== 'undefined') {
  // Defer to next tick to ensure store is initialized
  setTimeout(() => {
    useTemplateStore.getState().loadBuiltInTemplates()
  }, 0)
}

