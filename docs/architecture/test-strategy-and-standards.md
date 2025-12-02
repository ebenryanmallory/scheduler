# Test Strategy and Standards

## Testing Philosophy
- **Approach:** Test-After (feature first, then test) for UI, TDD for complex logic (recurrence, sync).
- **Coverage Goals:** 80% overall.
- **Test Pyramid:** Heavy on Unit/Integration, light on E2E.

## Test Types and Organization
- **Unit Tests:** Vitest. Test individual functions, hooks, and utility classes.
- **Integration Tests:** Vitest + React Testing Library. Test component interactions and store updates.
- **E2E Tests:** Playwright. Test critical flows (Create Task, Sync, Offline mode).

---
