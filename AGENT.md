# AGENT.md - Scheduler Project Guide

## Commands
- **Build**: `npm run build` - Compiles TypeScript server and builds frontend
- **Dev**: `npm run dev` - Starts development server with frontend (Vite) and backend (tsx watch)
- **Lint**: `npm run lint` - Runs ESLint on all files
- **Server**: `npm run server` - Runs production server
- **Preview**: `npm run preview` - Preview built frontend

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui components
- **Backend**: Express.js server with TypeScript, file-based data persistence (JSON)
- **State**: Zustand for client state management
- **UI**: shadcn/ui component library with Radix UI primitives
- **Key Features**: Task scheduling, calendar integration, drag-and-drop, ideas/projects management

## Code Style
- **Imports**: Use `@/` path alias for src imports, React imports first, then third-party, then local
- **Types**: Strict TypeScript, interfaces over types, explicit return types for functions
- **Components**: PascalCase, default exports, functional components with hooks
- **Styling**: Tailwind CSS with CSS variables, responsive design with sm/md/lg breakpoints
- **Naming**: camelCase for variables/functions, PascalCase for components, UPPER_CASE for constants
- **Error Handling**: Try-catch blocks with toast notifications, structured API responses with success/error
- **File Structure**: Components in `/components`, UI primitives in `/components/ui`, types in `/types`
