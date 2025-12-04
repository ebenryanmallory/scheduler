# BMAD Workflow Guide: From Story to Feature Completion

This guide outlines the standard operating procedure for implementing features using the BMAD system, starting from a ready-to-code state.

## Phase 1: The Development Loop (Per Story)

Repeat this cycle for each story in `docs/stories/`.

### 1. Pre-Implementation (QA & Planning)
Before writing code, assess risks and plan tests.
*   **Command**: `@qa *risk docs/stories/{story-name}.md`
    *   *Output*: Risk assessment in `docs/qa/assessments/`
*   **Command**: `@qa *design docs/stories/{story-name}.md`
    *   *Output*: Test strategy and cases.

### 2. Implementation (Dev)
The Dev agent writes the code and tests.
*   **Command**: `@dev Implement {story-name}`
    *   *Context*: Provide the story file and relevant architecture docs.
    *   *Action*: Dev writes code, unit tests, and verifies functionality.

### 3. Mid-Development Check (QA)
Ensure requirements are being met during coding.
*   **Command**: `@qa *trace docs/stories/{story-name}.md`
    *   *Action*: Verifies test coverage against acceptance criteria.
*   **Command**: `@qa *nfr docs/stories/{story-name}.md`
    *   *Action*: Checks non-functional requirements (performance, security).

### 4. Code Review & Quality Gate (QA)
Final verification before marking "Done".
*   **Command**: `@qa *review docs/stories/{story-name}.md`
    *   *Action*: Comprehensive code review and refactoring suggestions.
*   **Command**: `@qa *gate docs/stories/{story-name}.md`
    *   *Output*: Generates a Quality Gate file (PASS/FAIL).

### 5. Finalization
*   **Action**: Commit changes to Git.
*   **Action**: Move story file to `docs/stories/completed/` (optional organization).

---

## Phase 2: Epic Progression

Once all stories in an Epic (e.g., Epic 1) are complete:

1.  **Integration Test**: Run full suite to ensure no regressions between stories.
    *   `npm run test` / `npm run test:e2e`
2.  **Update Docs**: If implementation diverged from plan, update `docs/architecture.md`.
3.  **Next Epic**:
    *   Review `docs/prd/epic-{n}.md`.
    *   Shard stories for the next epic into `docs/stories/` (using `@sm` or manual).
    *   Repeat Phase 1.

---

## Quick Reference Commands

| Agent | Command | Purpose |
| :--- | :--- | :--- |
| **Dev** | `@dev` | Write code, fix bugs, run tests |
| **QA** | `@qa *risk` | Assess risks before starting |
| **QA** | `@qa *design` | Create test plan |
| **QA** | `@qa *review` | Review code and quality |
| **Scrum Master** | `@sm` | Draft new stories from Epics |
| **Product Owner** | `@po` | Clarify requirements |

## Current Status
*   **Completed Epic**: Epic 1 (Foundation & Quick Wins) ✅
    *   Story 1.1: Smart Notifications - PASS (85)
    *   Story 1.2: Task Search & Filter - PASS (82)
    *   Story 1.3: Dark Mode - PASS (95)
    *   Story 1.4: Error Handling - PASS (92)
*   **Completed Epic**: Epic 2 (Core Productivity Features) ✅
    *   Story 2.1: Time Tracking Foundation - PASS (85) ✅
    *   Story 2.2: Time Tracking Analytics Widget - PASS (85) ✅
    *   Story 2.3: Drag and Drop Scheduling - PASS (88) ✅
    *   Story 2.4: Recurring Tasks and Templates - PASS (82) ✅
    *   Story 2.5: Quick Stats Widget - PASS (85) ✅
*   **Completed Epic**: Epic 3 (Mobile & Offline Excellence) ✅
    *   Story 3.1: Mobile-Optimized Layouts - PASS (82) ✅
    *   Story 3.2: Offline Support and PWA - PASS (82) ✅
    *   Story 3.3: Enhanced Git Sync - PASS (92) ✅ (improved with unit tests)
*   **Next Step**: Begin Epic 4 (Analytics & Intelligence) or integration testing
