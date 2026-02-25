# Agent Coordination

> **Shared context file for Claude (backend) and Gemini (frontend).**
> Both agents should read this at the start of every session and update it when they finish work.

---

## Agent Ownership

| Domain | Agent | Files |
|--------|-------|-------|
| Backend, API routes, services | **Claude** | `src/http/`, `src/services/`, `src/core/`, `src/lib/llm/` |
| Frontend, UI, pages, components | **Gemini** | `src/components/`, `src/pages/`, `src/hooks/`, `src/layouts/`, `src/App.tsx` |
| Shared types | **Both** (coordinate via this file) | `src/types/api-contracts.ts` |
| Database schema | **Claude** | `supabase/migrations/` |
| Supabase client usage | **Gemini** | `src/integrations/supabase/client.ts` |

---

## API Contracts (Source of Truth)

> Define shared request/response types here. Both agents build to these contracts.
> Move finalized types to `src/types/api-contracts.ts` when ready.

### Existing Endpoints (already implemented)

The backend (Express on port 8789) is proxied via Vite at `/api/*`.

Refer to `src/http/routes.ts` for the full list of current endpoints.

### Requested Endpoints (frontend needs, backend hasn't built yet)

_None currently._

### Requested UI Changes (backend needs, frontend hasn't built yet)

_None currently._

---

## Current Tasks

### Claude (Backend)
- _No active cross-agent task_

### Gemini (Frontend)
- _No active cross-agent task_

---

## Recent Changes Log

> When you complete work that the other agent needs to know about, log it here.

| Date | Agent | Summary |
|------|-------|---------|
| _yyyy-mm-dd_ | _Claude/Gemini_ | _What changed and what the other agent needs to know_ |

---

## Blockers & Questions

> If one agent is blocked waiting on the other, document it here.

_None currently._

---

## Conventions

1. **API response shape**: Always `{ success: boolean, data?: T, error?: string }`
2. **Auth**: Clerk tokens passed via `Authorization: Bearer <token>` header
3. **IDs**: All database IDs are UUIDs. User IDs are Clerk IDs (TEXT, not UUID).
4. **Dates**: ISO 8601 strings in API responses
5. **Errors**: Backend returns appropriate HTTP status codes + error message in response body
