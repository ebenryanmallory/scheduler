# Scheduler App Frontend Architecture Document

<!-- Powered by BMAD™ Core -->

## Template and Framework Selection

This project uses an existing codebase ("Brownfield") built with **React**, **Vite**, and **TypeScript**. It utilizes **shadcn/ui** for the component library and **Zustand** for state management. The architecture described below builds upon these foundations to add offline capabilities and advanced features.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-01 | 1.0 | Initial Frontend Architecture created | BMAD Architect Agent |

---

## Frontend Tech Stack

| Category | Technology | Version | Purpose | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Framework** | React | 18.x | UI Library | Existing choice, component-based, rich ecosystem |
| **UI Library** | shadcn/ui | Latest | Component Library | Accessible, customizable, modern look (Radix UI based) |
| **State Management** | Zustand | 4.x | Client State | Simple, lightweight, supports persistence, existing choice |
| **Routing** | React Router | 6.x | Navigation | Standard routing solution for React |
| **Build Tool** | Vite | 5.x | Bundler | Fast dev server, optimized builds |
| **Styling** | TailwindCSS | 3.x | CSS Framework | Utility-first, rapid development, dark mode support |
| **Testing** | Vitest | Latest | Unit/Integration | Fast, Vite-native, Jest-compatible |
| **E2E Testing** | Playwright | Latest | E2E Testing | Reliable browser automation |
| **Offline Storage** | idb | Latest | IndexedDB Wrapper | Promise-based wrapper for IndexedDB operations |
| **PWA** | vite-plugin-pwa | Latest | Service Worker | Easy PWA integration with Vite |
| **Drag & Drop** | @dnd-kit/core | Latest | Drag and Drop | Modern, accessible, lightweight DnD library |
| **Charts** | Recharts | Latest | Data Visualization | Composable, React-native charting library |

---

## Project Structure

```text
src/
├── assets/                 # Static assets (images, fonts)
├── components/             # Shared components
│   ├── ui/                 # shadcn/ui primitive components (Button, Input, etc.)
│   ├── layout/             # Layout components (Header, Sidebar, MobileNav)
│   ├── features/           # Feature-specific components
│   │   ├── tasks/          # Task-related components (TaskList, TaskItem)
│   │   └── calendar/       # Calendar & TimeBlock components
│   └── common/             # Common utilities (ErrorBoundary, Loading)
├── hooks/                  # Custom React hooks
│   ├── use-sync.ts         # Sync logic hook
│   ├── use-offline.ts      # Offline status hook
│   └── ...
├── lib/                    # Utility functions and configurations
│   ├── api.ts              # API client configuration
│   ├── db.ts               # IndexedDB configuration
│   └── utils.ts            # Helper functions
├── pages/                  # Route components
│   ├── Dashboard.tsx
│   ├── Settings.tsx
│   └── ...
├── services/               # Business logic and API services
│   ├── taskService.ts
│   ├── syncService.ts
│   ├── notificationService.ts
│   └── ...
├── store/                  # Zustand stores
│   ├── useTaskStore.ts
│   ├── useSettingsStore.ts
│   └── useUIStore.ts
├── types/                  # TypeScript type definitions
├── App.tsx                 # Root component
└── main.tsx                # Entry point
```

---

## Component Standards

### Component Template

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface TaskItemProps extends React.HTMLAttributes<divElement> {
  task: Task
  onComplete: (id: string) => void
}

export function TaskItem({ 
  task, 
  onComplete, 
  className, 
  ...props 
}: TaskItemProps) {
  return (
    <div 
      className={cn("flex items-center justify-between p-4 border rounded-lg", className)} 
      {...props}
    >
      <span className="font-medium">{task.title}</span>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onComplete(task.id)}
      >
        Complete
      </Button>
    </div>
  )
}
```

### Naming Conventions

- **Components:** PascalCase (e.g., `TaskItem.tsx`, `UserProfile.tsx`)
- **Hooks:** camelCase, prefixed with `use` (e.g., `useTaskStore.ts`, `useWindowSize.ts`)
- **Stores:** camelCase, prefixed with `use` and suffixed with `Store` (e.g., `useTaskStore.ts`)
- **Services:** camelCase, suffixed with `Service` (e.g., `taskService.ts`, `apiService.ts`)
- **Types:** PascalCase (e.g., `Task`, `User`, `ApiResponse`)

---

## State Management

### Store Structure

We use **Zustand** for global state management. Stores are split by domain to keep them manageable.

```text
store/
├── useTaskStore.ts       # Tasks, projects, and time blocks
├── useSettingsStore.ts   # User preferences (theme, notifications)
├── useUIStore.ts         # UI state (modals, sidebars, loading states)
└── useSyncStore.ts       # Sync status and queue
```

### State Template (Task Store with Persistence)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task } from '@/types'

interface TaskState {
  tasks: Task[]
  isLoading: boolean
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      isLoading: false,
      addTask: (task) => set((state) => ({ 
        tasks: [...state.tasks, task] 
      })),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) => 
          t.id === id ? { ...t, ...updates } : t
        ),
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),
    }),
    {
      name: 'scheduler-task-storage', // unique name
      partialize: (state) => ({ tasks: state.tasks }), // only persist tasks
    }
  )
)
```

---

## Sync Strategy (Offline-First)

The application uses an **Optimistic UI** approach with a **Sync Queue**.

1.  **Action:** User performs an action (e.g., creates a task).
2.  **Optimistic Update:** The UI updates immediately via Zustand store.
3.  **Local Persistence:** The change is saved to IndexedDB/localStorage.
4.  **Sync Queue:** The action is added to a persistent `SyncQueue` in IndexedDB.
5.  **Background Sync:**
    -   The `SyncService` monitors the queue and network status.
    -   If online, it processes the queue items sequentially (FIFO).
    -   It sends requests to the backend API.
    -   On success, the item is removed from the queue.
    -   On failure (network error), it retries with exponential backoff.
    -   On failure (logic error/conflict), it triggers a conflict resolution flow.

### Sync Service Template

```typescript
// services/syncService.ts (Simplified)

interface SyncItem {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: 'TASK' | 'PROJECT'
  payload: any
  timestamp: number
  retryCount: number
}

export const syncService = {
  queue: [] as SyncItem[],
  
  async addToQueue(item: Omit<SyncItem, 'id' | 'timestamp' | 'retryCount'>) {
    const syncItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0
    }
    // Save to IndexedDB
    await db.syncQueue.add(syncItem)
    this.processQueue()
  },

  async processQueue() {
    if (!navigator.onLine) return
    
    const items = await db.syncQueue.getAll()
    for (const item of items) {
      try {
        await api.post('/sync', item)
        await db.syncQueue.delete(item.id)
      } catch (error) {
        // Handle retry logic
      }
    }
  }
}
```

---

## API Integration

### API Client Configuration

```typescript
import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error)
  }
)
```

---

## Routing

### Route Configuration

```typescript
import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Analytics } from '@/pages/Analytics'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'analytics',
        element: <Analytics />,
      },
      {
        path: 'settings',
        element: <Settings />, // Lazy load this
      },
    ],
  },
])
```

---

## Styling Guidelines

### Styling Approach

We use **TailwindCSS** with **shadcn/ui**.
-   Use utility classes for layout, spacing, and typography.
-   Use `cn()` utility for conditional class merging.
-   Use CSS variables for theming (colors, radius) defined in `index.css`.

### Global Theme Variables

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode values ... */
  }
}
```

---

## Testing Requirements

### Component Test Template

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TaskItem } from './TaskItem'

describe('TaskItem', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    status: 'todo',
    // ... other props
  }
  const mockOnComplete = vi.fn()

  it('renders task title', () => {
    render(<TaskItem task={mockTask} onComplete={mockOnComplete} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('calls onComplete when button clicked', () => {
    render(<TaskItem task={mockTask} onComplete={mockOnComplete} />)
    fireEvent.click(screen.getByText('Complete'))
    expect(mockOnComplete).toHaveBeenCalledWith('1')
  })
})
```

---

## Frontend Developer Standards

### Critical Coding Rules

1.  **Accessibility First:** Always use semantic HTML and ARIA attributes where necessary. Ensure keyboard navigability.
2.  **Optimistic UI:** Always update the UI *before* waiting for the API response for better perceived performance. Handle rollback on error.
3.  **Mobile Responsiveness:** Test all features on mobile breakpoints. Use `hidden md:block` patterns for responsive layouts.
4.  **No Direct DOM Manipulation:** Use Refs.
5.  **Type Safety:** Avoid `any`. Define interfaces for all props and API responses.
6.  **Component Composition:** Prefer composition over prop drilling. Use slots/children.
7.  **Performance:** Memoize expensive calculations (`useMemo`) and callbacks (`useCallback`) passed to children. Lazy load routes.

### Quick Reference

-   **Start Dev Server:** `npm run dev`
-   **Run Tests:** `npm run test`
-   **Build:** `npm run build`
-   **Lint:** `npm run lint`
-   **New Component:** Create in `src/components/features/[feature]/[Name].tsx`
-   **New Store:** Create in `src/store/use[Name]Store.ts`
