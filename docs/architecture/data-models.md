# Data Models

## Task

**Purpose:** Represents a single unit of work or todo item.

**Key Attributes:**
- `id`: string - UUID
- `title`: string - Task description
- `status`: enum - 'todo', 'in-progress', 'done', 'archived'
- `priority`: enum - 'high', 'medium', 'low'
- `dueDate`: ISO8601 string - Optional due date
- `estimatedDuration`: number - Minutes
- `actualDuration`: number - Minutes (tracked)
- `tags`: string[] - Array of tag strings
- `recurrence`: object - Recurrence rules (frequency, interval, end date)
- `projectId`: string - Reference to parent project

**Relationships:**
- Belongs to one Project (optional)
- Can have multiple TimeBlocks (via schedule)

## TimeBlock

**Purpose:** Represents a scheduled slot in the calendar.

**Key Attributes:**
- `id`: string - UUID
- `startTime`: string - HH:mm format
- `endTime`: string - HH:mm format
- `label`: string - Description of the block (e.g., "Deep Work")
- `type`: enum - 'focus', 'meeting', 'break', 'admin'
- `taskId`: string - Optional reference to a specific task

**Relationships:**
- Can contain one Task

## Project

**Purpose:** Groups related tasks together.

**Key Attributes:**
- `id`: string - UUID
- `name`: string - Project name
- `color`: string - Hex color code
- `status`: enum - 'active', 'completed', 'archived'

**Relationships:**
- Has many Tasks

---
