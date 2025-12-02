# Error Handling Strategy

## General Approach
- **Error Model:** Standardized JSON error response for API.
- **Exception Hierarchy:** Base `AppError` class with `statusCode` and `code`.
- **Error Propagation:** Catch at controller level -> Pass to global error handler middleware.

## Logging Standards
- **Library:** `winston` (Backend), `console` (Frontend - Dev only)
- **Format:** JSON in production, pretty print in dev.
- **Levels:** error, warn, info, debug.

---
