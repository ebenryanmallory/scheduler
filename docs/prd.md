# Scheduler App Enhancement Product Requirements Document (PRD)

<!-- Powered by BMAD™ Core -->

## Goals and Background Context

### Goals

- Enhance the calendar-driven task organizer to support recurring tasks, time tracking, and intelligent scheduling
- Improve mobile responsiveness and offline capabilities for on-the-go productivity
- Implement smart notifications to maximize deep work sessions
- Maintain the unique markdown-based storage with Git sync as a competitive advantage

### Background Context

The Scheduler App is a calendar-driven task organizer designed for founders managing multiple startups who need to maximize productivity through structured time blocking. The current MVP provides basic task management with time blocks, projects, and ideas, but lacks critical features for sustained productivity such as recurring tasks, time tracking, and mobile optimization.

This PRD outlines enhancements to transform the scheduler from a basic task organizer into a comprehensive productivity system. The improvements are organized into 3 epics, prioritizing high-impact foundational features first. The app's unique selling point—markdown-based storage with Git sync—will be preserved and enhanced with better conflict resolution and multi-device support.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-01 | 1.0 | Initial PRD created from scheduler improvements analysis | BMAD PM Agent |

---

## Requirements

### Functional Requirements

**FR1**: The system shall support recurring tasks with configurable frequencies (daily, weekly, monthly, custom)

**FR2**: The system shall track actual time spent versus planned time for all tasks

**FR3**: The system shall provide progressive notifications (15 min before, 5 min before, at task time) for scheduled tasks

**FR4**: The system shall allow users to drag and drop tasks between time blocks to reschedule

**FR5**: The system shall support task dependencies and relationships, showing visual indicators for task chains

**FR6**: The system shall provide a search interface with fuzzy matching across task titles and descriptions

**FR7**: The system shall allow filtering tasks by status, priority, date range, and custom tags

**FR8**: The system shall support task templates for common activities (e.g., "Deep Work Session")

**FR9**: The system shall export tasks and schedules to CSV, JSON, and iCal formats

**FR10**: The system shall support offline operation with automatic sync when connectivity is restored

**FR11**: The system shall automatically commit and push changes to Git repository with conflict resolution UI

**FR12**: The system shall support custom keyboard shortcuts for all major operations

**FR13**: The system shall allow color-coding and tagging of tasks for visual organization

**FR14**: The system shall archive completed tasks with ability to view and restore from archive

**FR15**: The system shall provide quick stats widget showing daily progress and weekly streaks

**FR16**: The system shall provide a command palette (Cmd/K) for quick access to all features

**FR17**: The system shall support undo/redo functionality for all task operations

**FR18**: The system shall provide bulk operations (complete all, delete multiple, reschedule batch)

### Non-Functional Requirements

**NFR1**: The application must be fully responsive and optimized for mobile devices (iOS and Android)

**NFR2**: The application must support offline operation with data persistence in IndexedDB

**NFR3**: The application must implement dark mode with smooth transitions and system preference detection

**NFR4**: All API operations must include retry logic with exponential backoff

**NFR5**: The application must maintain 80%+ test coverage with unit, integration, and E2E tests

**NFR6**: Page load time must not exceed 2 seconds on 3G connections

**NFR7**: The application must be installable as a Progressive Web App (PWA)

**NFR8**: All user-facing errors must display clear, actionable error messages

**NFR9**: The application must support keyboard navigation for accessibility (WCAG AA compliance)

**NFR10**: Git sync operations must be debounced to batch changes and minimize commits

**NFR11**: Analytics calculations must be cached to prevent performance degradation

**NFR12**: The application must handle concurrent edits across multiple devices with conflict resolution

**NFR13**: All sensitive data (API keys, OAuth tokens) must be stored securely and never exposed to client

**NFR14**: The application bundle size must not exceed 500KB (gzipped) for initial load

**NFR15**: All animations and transitions must respect user's reduced motion preferences

---

## User Interface Design Goals

### Overall UX Vision

The Scheduler App should provide a clean, distraction-free interface that helps users focus on their current task while maintaining awareness of their overall schedule. The design should feel modern and premium, with smooth animations and thoughtful micro-interactions. The interface should adapt seamlessly between desktop and mobile, with touch-friendly controls and gesture support on mobile devices.

### Key Interaction Paradigms

- **Drag and Drop**: Primary method for rescheduling tasks between time blocks
- **Quick Add**: Keyboard shortcut (Cmd/Ctrl + N) to add tasks from anywhere
- **Command Palette**: Cmd/K to access all features without leaving keyboard
- **Swipe Gestures**: Mobile-specific gestures for navigation and task actions
- **Progressive Disclosure**: Show essential information by default, reveal details on demand

### Core Screens and Views

1. **Main Dashboard** - Calendar view with time blocks and task list
2. **Task Detail Modal** - Full task editing with all fields and options
3. **Settings Page** - Preferences and account settings
4. **Archive View** - Historical completed tasks with search and filter
5. **Projects View** - Project-level overview with progress
6. **Ideas Parking Lot** - Quick capture and organization of future ideas

### Accessibility

WCAG AA compliance required, including:
- Keyboard navigation for all interactive elements
- Screen reader support with proper ARIA labels
- Sufficient color contrast ratios
- Respect for reduced motion preferences
- Focus indicators for all interactive elements

### Branding

Modern, clean aesthetic with emphasis on productivity and focus:
- Primary color: Blue (#3B82F6) for trust and focus
- Accent colors: Green (#10B981) for success, Amber (#F59E0B) for warnings
- Typography: Inter for UI, Fira Code for monospace elements
- Smooth transitions and micro-animations for premium feel
- Dark mode as first-class citizen, not an afterthought

### Target Device and Platforms

Web Responsive (desktop and mobile browsers), with PWA installation support for iOS, Android, and desktop platforms. Mobile-optimized layouts with touch-friendly controls and gesture support.

---

## Technical Assumptions

### Repository Structure

**Monorepo** - The existing structure with frontend (React + Vite) and backend (Express) in a single repository will be maintained.

### Service Architecture

**Monolith** - The current Express backend will be enhanced with additional API endpoints.

**Rationale**: The current architecture is appropriate for the project scale and remains monolithic for simplicity.

### Testing Requirements

**Full Testing Pyramid** - Implement unit tests for stores and services, integration tests for API endpoints, and E2E tests for critical user flows. Target 80% code coverage.

**Rationale**: Given the complexity of offline sync, time tracking, and multi-device support, comprehensive testing is essential to prevent regressions and data loss.

### Additional Technical Assumptions and Requests

- **Frontend**: Continue using React 18, TypeScript, Zustand for state management, shadcn/ui for components
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: TailwindCSS with dark mode support via class strategy
- **PWA**: Leverage existing vite-plugin-pwa configuration, enhance with offline queue and background sync
- **Storage**: IndexedDB for offline data, localStorage for user preferences
- **Git Integration**: Server-side Git operations using simple-git or similar library
- **Notifications**: Web Notifications API for browser notifications
- **Testing**: Vitest for unit tests, Playwright for E2E tests
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Deployment**: Current deployment strategy to be maintained (details TBD)

---

## Epic List

**Epic 1: Foundation & Quick Wins** - Establish core infrastructure improvements including smart notifications, search/filter, dark mode, and error handling to improve daily usability and reliability

**Epic 2: Core Productivity Features** - Implement time tracking, drag & drop scheduling, recurring tasks, and quick stats to significantly enhance productivity workflows

**Epic 3: Mobile & Offline Excellence** - Optimize mobile responsiveness, implement full offline support with PWA capabilities, and enhance Git sync for reliable multi-device usage

---

## Epic 1: Foundation & Quick Wins

**Goal**: Establish foundational improvements that enhance daily usability and reliability. This epic delivers immediate value through smart notifications, powerful search capabilities, dark mode support, and robust error handling. These features require minimal dependencies and provide high impact for users while setting the stage for more complex features in later epics.

### Story 1.1: Smart Notifications System

As a **busy founder**,
I want **progressive notifications for my scheduled tasks**,
so that **I never miss important time blocks and can prepare for upcoming tasks**.

#### Acceptance Criteria

1. The system shall request notification permissions on first app load
2. The system shall send notifications 15 minutes before a task starts
3. The system shall send notifications 5 minutes before a task starts
4. The system shall send notifications at the exact task start time
5. The system shall allow users to customize notification timing in settings
6. The system shall parse and execute notification actions from schedule.json
7. The system shall persist notification preferences in localStorage
8. The system shall handle notification permission denial gracefully with clear messaging
9. The system shall work across Chrome, Firefox, Safari, and Edge browsers
10. The system shall not send duplicate notifications for the same task

### Story 1.2: Task Search and Filter

As a **user with many tasks**,
I want **to quickly search and filter my tasks**,
so that **I can find specific tasks without scrolling through long lists**.

#### Acceptance Criteria

1. The system shall provide a search input that filters tasks in real-time
2. The search shall match against task titles, descriptions, and tags
3. The system shall support fuzzy matching for typo tolerance
4. The system shall provide filter dropdowns for status (pending, completed, archived)
5. The system shall provide filter dropdowns for priority (high, medium, low)
6. The system shall provide filter dropdowns for date range (today, this week, this month, custom)
7. The system shall allow combining multiple filters simultaneously
8. The system shall provide a "clear all filters" button
9. The system shall persist search/filter state in URL parameters for sharing
10. The system shall provide keyboard shortcut (Cmd/Ctrl + F) to focus search input
11. The search input shall debounce user input to prevent excessive re-renders

### Story 1.3: Dark Mode Implementation

As a **user who works in different lighting conditions**,
I want **a dark mode toggle**,
so that **I can reduce eye strain during evening work sessions**.

#### Acceptance Criteria

1. The system shall provide a theme toggle button in the header
2. The system shall implement a dark color palette with proper contrast ratios (WCAG AA)
3. The system shall persist theme preference in localStorage
4. The system shall detect and apply system theme preference on first load
5. The system shall apply smooth transitions when switching themes (0.2s duration)
6. The system shall update all components to support both light and dark modes
7. The system shall update all shadcn/ui components for dark mode compatibility
8. The system shall provide a theme context accessible throughout the app
9. The system shall update the theme meta tag for mobile browser chrome
10. The theme toggle shall be keyboard accessible with proper focus indicators

### Story 1.4: Enhanced Error Handling

As a **user performing critical operations**,
I want **clear error messages and automatic retry logic**,
so that **I don't lose data due to temporary failures and understand what went wrong**.

#### Acceptance Criteria

1. The system shall implement React Error Boundaries to catch rendering errors
2. The system shall display user-friendly error messages (not technical stack traces)
3. The system shall implement retry logic with exponential backoff for all API calls
4. The system shall show toast notifications for all operation results (success, error, info)
5. The system shall provide a fallback UI when error boundaries catch errors
6. The system shall log errors to console in development mode
7. The system shall implement error logging service for production error tracking
8. The system shall retry failed operations up to 3 times before showing error
9. The system shall provide actionable error messages (e.g., "Check your internet connection")
10. The system shall allow users to manually retry failed operations

---

## Epic 2: Core Productivity Features

**Goal**: Implement the core features that transform the scheduler from a basic task manager into a powerful productivity tool. This epic adds time tracking to measure actual vs. planned time, drag & drop for intuitive rescheduling, recurring tasks to reduce repetitive work, and quick stats to provide daily motivation and insights.

### Story 2.1: Time Tracking Foundation

As a **productivity-focused user**,
I want **to track actual time spent on tasks**,
so that **I can compare it against my estimates and improve my planning accuracy**.

#### Acceptance Criteria

1. The Task type shall include fields for estimated duration, actual duration, start time, and end time
2. Each task shall display a timer component with start, pause, and stop buttons
3. The timer shall continue running even if the page is refreshed
4. The timer state shall be persisted to the server every 30 seconds
5. The system shall calculate actual duration automatically when timer is stopped
6. The system shall allow manual time entry for tasks completed without timer
7. The system shall display time tracking status (not started, in progress, completed)
8. The timer shall use Web Workers for accurate timing independent of main thread
9. The system shall prevent multiple timers running simultaneously
10. The system shall show a warning if user tries to start a new timer while one is running

### Story 2.2: Time Tracking Analytics Widget

As a **user tracking my time**,
I want **to see time tracking summaries and insights**,
so that **I can understand my productivity patterns and time estimation accuracy**.

#### Acceptance Criteria

1. The system shall provide a time tracking widget on the main dashboard
2. The widget shall show total time tracked today
3. The widget shall show estimated vs. actual time variance for today
4. The widget shall show a breakdown of time by project or category
5. The widget shall display time estimation accuracy percentage
6. The widget shall show a weekly time tracking history chart
7. The widget shall be collapsible to save screen space
8. The widget shall update in real-time as timers run
9. The widget shall allow clicking through to detailed time tracking history
10. The widget shall cache calculations to prevent performance issues

### Story 2.3: Drag and Drop Task Scheduling

As a **user managing my schedule**,
I want **to drag tasks between time blocks**,
so that **I can quickly reschedule without opening edit dialogs**.

#### Acceptance Criteria

1. The system shall allow dragging tasks from the task list to time blocks
2. The system shall allow dragging tasks between different time blocks
3. The system shall provide visual feedback during drag operations (ghost element)
4. The system shall update task start time when dropped into a new time block
5. The system shall snap tasks to time block boundaries
6. The system shall allow resizing tasks to adjust duration visually
7. The system shall prevent dropping tasks into invalid time blocks
8. The system shall support touch-based drag and drop on mobile devices
9. The system shall provide undo functionality for drag operations
10. The system shall persist drag changes to the server immediately
11. The system shall show a confirmation for significant time changes (>1 hour)

### Story 2.4: Recurring Tasks and Templates

As a **user with repetitive tasks**,
I want **to create recurring tasks and templates**,
so that **I don't have to manually create the same tasks every day/week/month**.

#### Acceptance Criteria

1. The task creation dialog shall include recurrence options (daily, weekly, monthly, custom)
2. The system shall support custom recurrence patterns (e.g., "every 2 weeks on Monday and Friday")
3. The system shall auto-generate recurring task instances up to 3 months in advance
4. The system shall provide "edit instance" vs "edit series" options for recurring tasks
5. The system shall allow deleting a single instance or the entire series
6. The system shall provide a task template library accessible from task creation
7. The system shall import templates from schedule.json automatically
8. The system shall allow users to create custom templates from existing tasks
9. The system shall allow sharing templates between users (export/import)
10. The system shall use RRule library for recurrence logic
11. The system shall show visual indicators for recurring tasks in the UI

### Story 2.5: Quick Stats Widget

As a **user seeking daily motivation**,
I want **to see my daily progress and streaks**,
so that **I stay motivated and aware of my productivity**.

#### Acceptance Criteria

1. The system shall display a quick stats widget on the main dashboard
2. The widget shall show tasks completed vs. total tasks for today
3. The widget shall display a weekly streak counter (consecutive days with completed tasks)
4. The widget shall show focus time vs. break time for today
5. The widget shall display a productivity score based on completion rate and time accuracy
6. The widget shall be collapsible to save screen space
7. The widget shall update in real-time as tasks are completed
8. The widget shall use charts (progress rings or bars) for visual appeal
9. The widget shall allow clicking through to detailed analytics
10. The widget shall celebrate milestones (e.g., "7-day streak!")

---

## Epic 3: Mobile & Offline Excellence

**Goal**: Make the scheduler reliable and usable anywhere, on any device. This epic optimizes the mobile experience with responsive layouts and touch-friendly controls, implements full offline support with automatic sync, and enhances Git sync for seamless multi-device usage with conflict resolution.

### Story 3.1: Mobile-Optimized Layouts

As a **mobile user**,
I want **a responsive interface optimized for small screens**,
so that **I can manage my tasks effectively on my phone**.

#### Acceptance Criteria

1. All components shall be responsive with breakpoints for mobile, tablet, and desktop
2. The mobile layout shall use collapsible sections to maximize screen space
3. Time block selection shall be touch-friendly with larger tap targets (minimum 44x44px)
4. The system shall implement bottom sheet modals for mobile instead of centered modals
5. The system shall provide a mobile navigation menu (hamburger or bottom nav)
6. The system shall implement swipe gestures for navigation (swipe left/right between views)
7. The system shall use mobile-first CSS approach with Tailwind utilities
8. The system shall test on iOS Safari, Android Chrome, and various screen sizes
9. The system shall hide non-essential UI elements on mobile to reduce clutter
10. The system shall support landscape and portrait orientations
11. The system shall prevent horizontal scrolling on mobile devices

### Story 3.2: Offline Support and PWA

As a **user in areas with poor connectivity**,
I want **the app to work offline**,
so that **I can continue managing tasks without internet access**.

#### Acceptance Criteria

1. The system shall configure service worker with appropriate caching strategies
2. The system shall cache all static assets (JS, CSS, images) for offline use
3. The system shall persist task data in IndexedDB for offline access
4. The system shall queue all create/update/delete operations when offline
5. The system shall automatically sync queued operations when connectivity is restored
6. The system shall display an offline indicator in the UI when disconnected
7. The system shall handle conflicts when syncing offline changes
8. The system shall provide an install prompt for PWA on supported browsers
9. The system shall implement background sync API for reliable syncing
10. The system shall cache API responses with appropriate expiration times
11. The system shall test offline functionality thoroughly across browsers

### Story 3.3: Enhanced Git Sync

As a **user working across multiple devices**,
I want **automatic Git sync with conflict resolution**,
so that **my tasks stay synchronized without manual intervention**.

#### Acceptance Criteria

1. The system shall automatically commit task changes to Git repository
2. The system shall debounce commits to batch changes (wait 30 seconds after last change)
3. The system shall automatically push commits to remote repository
4. The system shall display sync status indicator (synced, syncing, error)
5. The system shall show last sync timestamp in the UI
6. The system shall provide a manual sync button for immediate syncing
7. The system shall implement conflict resolution UI when merge conflicts occur
8. The system shall show diff view for conflicting changes
9. The system shall allow users to choose "keep local", "keep remote", or "merge manually"
10. The system shall maintain a sync history/log accessible to users
11. The system shall handle Git authentication securely on the server
12. The system shall retry failed push operations with exponential backoff

---

## Checklist Results Report

*This section will be populated after running the PM checklist to validate the PRD completeness and quality.*

---

## Next Steps

### UX Expert Prompt

Please review this PRD and create a comprehensive Front-End Specification document that details the user interface design, component architecture, and user experience flows for all features outlined in the three epics. Focus on mobile-first responsive design, accessibility (WCAG AA), and the dark mode implementation.

### Architect Prompt

Please review this PRD and create a comprehensive Architecture Document that details the technical implementation approach, data models, API endpoints, service architecture, and infrastructure requirements for all features outlined in the three epics. Pay special attention to offline sync, Git integration, and the testing strategy.
