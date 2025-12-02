# Epic 2: Core Productivity Features

**Goal**: Implement the core features that transform the scheduler from a basic task manager into a powerful productivity tool. This epic adds time tracking to measure actual vs. planned time, drag & drop for intuitive rescheduling, recurring tasks to reduce repetitive work, and quick stats to provide daily motivation and insights.

## Story 2.1: Time Tracking Foundation

As a **productivity-focused user**,
I want **to track actual time spent on tasks**,
so that **I can compare it against my estimates and improve my planning accuracy**.

### Acceptance Criteria

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

## Story 2.2: Time Tracking Analytics Widget

As a **user tracking my time**,
I want **to see time tracking summaries and insights**,
so that **I can understand my productivity patterns and time estimation accuracy**.

### Acceptance Criteria

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

## Story 2.3: Drag and Drop Task Scheduling

As a **user managing my schedule**,
I want **to drag tasks between time blocks**,
so that **I can quickly reschedule without opening edit dialogs**.

### Acceptance Criteria

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

## Story 2.4: Recurring Tasks and Templates

As a **user with repetitive tasks**,
I want **to create recurring tasks and templates**,
so that **I don't have to manually create the same tasks every day/week/month**.

### Acceptance Criteria

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

## Story 2.5: Quick Stats Widget

As a **user seeking daily motivation**,
I want **to see my daily progress and streaks**,
so that **I stay motivated and aware of my productivity**.

### Acceptance Criteria

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
