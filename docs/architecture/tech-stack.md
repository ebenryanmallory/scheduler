# Tech Stack

## Cloud Infrastructure

- **Provider:** Vercel (Frontend) + Railway/Render (Backend) OR Self-Hosted (User preference for local-first)
- **Key Services:** Node.js Runtime
- **Deployment Regions:** User's local machine (primary) or Cloud (optional)

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Language** | TypeScript | 5.x | Primary development language | Strong typing, shared types between FE/BE, excellent tooling |
| **Runtime** | Node.js | 20.x (LTS) | JavaScript runtime | Stable, performant, wide ecosystem |
| **Frontend Framework** | React | 18.x | UI Library | Component-based, rich ecosystem, existing project choice |
| **Build Tool** | Vite | 5.x | Bundler | Fast dev server, optimized builds, existing project choice |
| **State Management** | Zustand | 4.x | Client State | Simple, lightweight, supports persistence, existing choice |
| **Backend Framework** | Express | 4.x | API Server | Minimalist, flexible, easy to set up for file ops |
| **UI Component Lib** | shadcn/ui | Latest | UI Components | Accessible, customizable, modern look (Radix UI based) |
| **Styling** | TailwindCSS | 3.x | CSS Framework | Utility-first, rapid development, dark mode support |
| **PWA** | vite-plugin-pwa | Latest | Offline capabilities | Easy integration with Vite for service workers |
| **Local DB** | idb | Latest | Client-side storage | Promise-based wrapper for IndexedDB |
| **Testing** | Vitest | Latest | Unit/Integration Testing | Fast, Vite-native, Jest-compatible |
| **E2E Testing** | Playwright | Latest | End-to-End Testing | Reliable browser automation for critical flows |
| **Git Ops** | simple-git | Latest | Server-side Git operations | programmatic control of git commands |

---
