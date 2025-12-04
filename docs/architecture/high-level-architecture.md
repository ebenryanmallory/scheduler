# High Level Architecture

## Technical Summary

The Scheduler App follows a **Monolithic Client-Server Architecture** with a heavy emphasis on **Local-First** principles. The frontend is a Progressive Web App (PWA) built with React and Vite, capable of offline operation using IndexedDB. The backend is a lightweight Express server that primarily handles file system operations (reading/writing markdown/JSON), Git synchronization, and external API integrations. The system uses a **Repository Pattern** to abstract data access, allowing the frontend to switch between local IndexedDB (offline) and API calls (online) seamlessly.

## High Level Overview

1.  **Architectural Style**: **Local-First Monolith**. The application logic resides primarily in the client (Thick Client), with the server acting as a synchronization gateway and integration point for external services.
2.  **Repository Structure**: **Monorepo**. Both frontend and backend reside in the same repository for easier code sharing (types) and coordinated deployments.
3.  **Service Architecture**: **Monolith**. A single Express server handles all API requests. The core remains monolithic for simplicity.
4.  **Data Flow**:
    -   **Read**: Frontend checks local cache (IndexedDB/Zustand) -> fetches from Server if stale -> Server reads from File System.
    -   **Write**: Frontend updates local cache (Optimistic UI) -> queues sync to Server -> Server writes to File System -> Server commits to Git.
5.  **Key Decisions**:
    -   **Markdown as Database**: Preserving the existing file-based storage allows users to edit data with any text editor and leverages Git for version history.
    -   **Offline-First**: Critical for mobile usage; requires robust sync logic.

## High Level Project Diagram

```mermaid
graph TD
    User[User] -->|Interacts| PWA[React PWA Frontend]
    
    subgraph Client Device
        PWA -->|Read/Write| IDB[(IndexedDB)]
        PWA -->|State Mgmt| Store[Zustand Store]
        PWA -->|Background Sync| SW[Service Worker]
    end
    
    PWA -- REST API --> Server[Express Backend]
    
    subgraph Server
        Server -->|File I/O| FS[File System]
        Server -->|Git Ops| Git[Git Service]
        Server -->|Auth| Auth[Auth Middleware]
    end
    
    FS <-->|Version Control| Repo[(Git Repository)]
```

## Architectural and Design Patterns

- **Repository Pattern:** Abstract data access logic on both client and server.
    - _Rationale:_ Allows the frontend to swap between local storage and API calls transparently, and allows the server to swap between file system and potentially a real DB in the future if needed.
- **Optimistic UI Updates:** Update the UI immediately upon user action, then sync in background.
    - _Rationale:_ Essential for a responsive feel, especially with the "Local-First" requirement.
- **Command Pattern:** Encapsulate all data-modifying operations (create task, update status) as commands.
    - _Rationale:_ Facilitates "Undo/Redo" functionality and offline command queueing.
- **Observer Pattern:** Use for the Notification System and Sync Status updates.
    - _Rationale:_ Decouples the event source (e.g., timer finished) from the reaction (show notification).

---
