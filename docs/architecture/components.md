# Components

## Frontend Components

**Responsibility:** Handle user interaction, display data, manage local state.

**Key Interfaces:**
- `TaskService` (Client-side adapter)
- `SyncService`

**Dependencies:** Backend API, IndexedDB

**Technology Stack:** React, Zustand, React Router

## Backend API Service

**Responsibility:** Handle file system operations, Git sync, and external API calls.

**Key Interfaces:**
- `GET /api/tasks`
- `POST /api/tasks`
- `POST /api/sync`

**Dependencies:** File System, Git

**Technology Stack:** Express, simple-git

## Notification Service

**Responsibility:** Manage local and push notifications.

**Key Interfaces:**
- `scheduleNotification(task)`
- `cancelNotification(taskId)`

**Dependencies:** Browser Notification API

**Technology Stack:** Web Notifications API

## Sync Engine

**Responsibility:** Handle bidirectional synchronization between Client (IndexedDB) and Server (File System).

**Key Interfaces:**
- `syncQueue()`
- `resolveConflict()`

**Dependencies:** Backend API, IndexedDB

**Technology Stack:** Custom logic + Service Worker

---
