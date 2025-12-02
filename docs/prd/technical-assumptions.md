# Technical Assumptions

## Repository Structure

**Monorepo** - The existing structure with frontend (React + Vite) and backend (Express) in a single repository will be maintained.

## Service Architecture

**Monolith with Serverless Functions** - The current Express backend will be enhanced with additional API endpoints. Consider migrating compute-intensive operations (AI suggestions, analytics) to serverless functions for scalability.

**Rationale**: The current architecture is appropriate for the project scale. Serverless functions can be added incrementally for specific features without full microservices migration.

## Testing Requirements

**Full Testing Pyramid** - Implement unit tests for stores and services, integration tests for API endpoints, and E2E tests for critical user flows. Target 80% code coverage.

**Rationale**: Given the complexity of offline sync, time tracking, and multi-device support, comprehensive testing is essential to prevent regressions and data loss.

## Additional Technical Assumptions and Requests

- **Frontend**: Continue using React 18, TypeScript, Zustand for state management, shadcn/ui for components
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: TailwindCSS with dark mode support via class strategy
- **PWA**: Leverage existing vite-plugin-pwa configuration, enhance with offline queue and background sync
- **Storage**: IndexedDB for offline data, localStorage for user preferences
- **Git Integration**: Server-side Git operations using simple-git or similar library
- **Calendar APIs**: Google Calendar API and Microsoft Graph API for calendar integrations
- **AI Integration**: OpenAI API or Anthropic Claude for AI-powered suggestions (optional, Phase 4)
- **Analytics**: Client-side analytics with recharts or chart.js for visualization
- **Notifications**: Web Notifications API for browser notifications
- **Testing**: Vitest for unit tests, Playwright for E2E tests
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Deployment**: Current deployment strategy to be maintained (details TBD)

---
