# Security

## Input Validation
- **Validation Library:** `zod`
- **Validation Location:** API Controllers (Backend) and Form Inputs (Frontend).
- **Required Rules:** Validate all request bodies and query params against Zod schemas.

## Authentication & Authorization
- **Auth Method:** Simple Token/Password for local, OAuth for Google/Outlook.
- **Session Management:** JWT or Session Cookies.

## Secrets Management
- **Development:** `.env` file (gitignored).
- **Code Requirements:** Access via `process.env` only.

---
