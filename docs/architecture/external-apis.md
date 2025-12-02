# External APIs

## Google Calendar API

- **Purpose:** Sync tasks with Google Calendar events.
- **Authentication:** OAuth 2.0
- **Key Endpoints Used:**
    - `GET /events` - Fetch events
    - `POST /events` - Create event from task
- **Integration Notes:** Need to handle token refresh and rate limiting.

## OpenAI API (Optional - Phase 4)

- **Purpose:** AI suggestions for scheduling.
- **Authentication:** API Key
- **Key Endpoints Used:**
    - `POST /v1/chat/completions` - Generate schedule suggestions
- **Integration Notes:** strictly server-side to protect API keys.

---
