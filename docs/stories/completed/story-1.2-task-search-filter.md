# Story 1.2: Task Search and Filter

**Epic**: Foundation & Quick Wins
**Status**: Complete
**Priority**: High
**Completed**: 2025-12-02

## User Story

As a **user with many tasks**,
I want **to quickly search and filter my tasks**,
so that **I can find specific tasks without scrolling through long lists**.

## Acceptance Criteria

1. The system shall provide a search input that filters tasks in real-time
2. The search shall match against task titles, descriptions, and tags
3. The system shall support fuzzy matching for typo tolerance
4. The system shall provide filter dropdowns for status (pending, completed, archived)
5. The system shall provide filter dropdowns for priority (high, medium, low)
6. The system shall provide filter dropdowns for date range (today, this week, this month, custom)
7. The system shall allow combining multiple filters simultaneously
8. The system shall provide a "clear all filters" button
9. The system shall persist search/filter state in URL parameters for sharing
10. The system shall provide keyboard shortcut (Cmd/Ctrl + K) to focus search input
11. The search input shall debounce user input to prevent excessive re-renders

## Technical Notes

- Use `fuse.js` or simple regex for client-side search
- Implement filtering logic in `useTaskStore` selectors or a dedicated hook
- Use `useSearchParams` from `react-router-dom` to sync state with URL
- Create reusable `FilterDropdown` component using shadcn/ui `Select` or `DropdownMenu`

## QA Notes

- Test search with various keywords and typos
- Test all filter combinations
- Test URL persistence (refresh page, share link)
- Test keyboard shortcuts

## PO Clarifications (2025-12-02)

**Status Field:**
- Use `status: 'pending' | 'completed' | 'archived'` enum
- Migrate existing `completed` boolean: `completed ? 'completed' : 'pending'`
- Keep `completed` boolean temporarily for backward compatibility

**Priority Default:**
- Default priority for new/existing tasks: `'medium'`

**Keyboard Shortcut:**
- Use `Cmd/Ctrl + K` (not F) - aligns with FR23 command palette and industry convention
- AC10 updated to reflect this

**Archived Tasks:**
- Hidden by default (not shown in main task list)
- Visible when status filter includes 'archived' or "Show All"
- Can be "restored" by changing status back to 'pending'
- Should appear visually distinct when shown
