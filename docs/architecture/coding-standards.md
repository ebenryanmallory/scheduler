# Coding Standards

## Core Standards
- **Languages & Runtimes:** TypeScript 5.x, Node 20.x
- **Style & Linting:** ESLint + Prettier (Standard config)
- **Test Organization:** `__tests__` directories or `.test.ts` alongside files.

## Critical Rules
- **No Direct DOM Manipulation:** Always use React refs.
- **Type Safety:** No `any`. Use `unknown` if necessary and narrow types.
- **State Immutability:** Always treat state as immutable (Zustand handles this, but be careful with nested objects).
- **Secure Secrets:** Never commit `.env` files.

---
