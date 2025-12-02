# Epic 3: Mobile & Offline Excellence

**Goal**: Make the scheduler reliable and usable anywhere, on any device. This epic optimizes the mobile experience with responsive layouts and touch-friendly controls, implements full offline support with automatic sync, and enhances Git sync for seamless multi-device usage with conflict resolution.

## Story 3.1: Mobile-Optimized Layouts

As a **mobile user**,
I want **a responsive interface optimized for small screens**,
so that **I can manage my tasks effectively on my phone**.

### Acceptance Criteria

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

## Story 3.2: Offline Support and PWA

As a **user in areas with poor connectivity**,
I want **the app to work offline**,
so that **I can continue managing tasks without internet access**.

### Acceptance Criteria

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

## Story 3.3: Enhanced Git Sync

As a **user working across multiple devices**,
I want **automatic Git sync with conflict resolution**,
so that **my tasks stay synchronized without manual intervention**.

### Acceptance Criteria

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
