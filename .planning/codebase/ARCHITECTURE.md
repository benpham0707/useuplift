# Architecture

**Analysis Date:** 2026-02-23

## Pattern Overview

**Overall:** Service-Oriented Layered Architecture with Dual Entry Points (Frontend SPA + Backend API)

**Key Characteristics:**
- React SPA frontend with React Router for client-side routing
- Express.js backend API server on port 8789 serving dual mount paths (`/api/v1` and `/api`)
- Service layer pattern with singleton exports for shared business logic
- Analysis pipelines orchestrated through multi-stage processors
- Clerk for authentication with Supabase for data persistence
- Path aliasing (`@/*`) for clean imports across layers

## Layers

**Presentation Layer (React SPA):**
- Purpose: User interface, routing, and client-side state management
- Location: `src/pages/`, `src/components/`, `src/layouts/`
- Contains: React components, pages, dashboard layouts, workshop UIs
- Depends on: Query layer, hooks, services (via API calls), UI components
- Used by: End users via browser

**Routing Layer:**
- Purpose: Client-side navigation and route protection
- Location: `src/App.tsx`, `src/layouts/DashboardLayout.tsx`
- Contains: Route definitions, auth guards (`RequireVerified`, `RequireTermsAccepted`)
- Depends on: Presentation components, auth hooks
- Used by: React Router BrowserRouter

**Query/Data Fetching Layer:**
- Purpose: Manage API calls and cache state with React Query
- Location: `src/query/`, `src/hooks/`
- Contains: React Query hooks, custom data fetching hooks
- Depends on: API layer (backend), Supabase client
- Used by: Presentation components

**Service Layer (Frontend):**
- Purpose: Client-side business logic, API communication, utilities
- Location: `src/services/api/`, `src/utils/`, `src/lib/`
- Contains: API clients, mappers, client-side utilities
- Depends on: Integration layer
- Used by: Query layer, hooks

**Backend API Layer:**
- Purpose: RESTful API endpoints, request/response handling
- Location: `src/http/server.ts`, `src/http/routes.ts`, `src/http/middleware/`
- Contains: Express app, route handlers, auth middleware, CORS config
- Depends on: Module layer (backend), services
- Used by: Frontend (via HTTP), webhooks

**Module Layer (Backend):**
- Purpose: Feature-specific backend logic (experiences, analytics, assessment)
- Location: `src/modules/`
- Contains: Controllers and business logic for API endpoints
- Depends on: Service layer (backend), integration layer
- Used by: Backend API routes

**Service Layer (Backend):**
- Purpose: Core business logic, AI analysis pipelines, workshops
- Location: `src/services/`
- Contains: Analysis engines, workshop orchestrators, credit management, AI integrations
- Depends on: Core layer, integration layer, external APIs
- Used by: Module layer, API routes

**Core Layer:**
- Purpose: Shared domain logic, rubrics, analysis engines
- Location: `src/core/`
- Contains: Essay analysis engine, rubric definitions, types, generation logic
- Depends on: Integration layer (LLM), utilities
- Used by: Service layer

**Integration Layer:**
- Purpose: External service clients and adapters
- Location: `src/integrations/`, `src/lib/llm/`
- Contains: Supabase client, Anthropic Claude client, Stripe integration
- Depends on: Environment configuration
- Used by: All layers needing external services

**Configuration Layer:**
- Purpose: Environment-based configuration and validation
- Location: `src/config/`, environment variables
- Contains: Clerk config, API keys, feature flags
- Depends on: Environment variables
- Used by: All layers

## Data Flow

**User Authentication Flow:**

1. User visits app → `src/main.tsx` initializes Clerk
2. `<ClerkProvider>` wraps app → provides auth context
3. Route guard (`RequireVerified`) checks authentication status
4. `useAuth` hook provides user object mapped from Clerk to Supabase-compatible shape
5. Protected routes render with authenticated user context

**Essay Analysis Flow (Backend):**

1. Frontend sends essay text to `/api/analyze-entry` via POST
2. `src/http/routes.ts` endpoint receives request
3. Imports `analyzeEntry` from `src/core/analysis/engine.ts`
4. Engine orchestrates multi-stage pipeline:
   - Stage 1: Feature extraction (text analysis)
   - Stage 2: Parallel category scoring (11 rubric dimensions)
   - Stage 3: Conditional deep reflection
   - Stage 4: NQI calculation & flag generation
5. Calls Anthropic Claude API via `src/lib/llm/claude.ts`
6. Returns `AnalysisResult` with report, coaching, authenticity scores
7. Frontend displays results in workshop UI

**Workshop Flow (Common App):**

1. User enters essay draft in `src/pages/WorkshopDemo.tsx`
2. `commonAppWorkshop` service orchestrates stages:
   - Stage 0: Voice excavation (optional)
   - Stage 1A: Conceptual teaching
   - Stage 1B: Haiku diagnosis (fast)
   - Stage 2: Batch issue detection
   - Stage 3: Consolidated coaching with college-specific context
3. Each stage uses prompt caching for 74% cost reduction
4. College research (2,500+ tokens) sent in full with every request
5. Results rendered progressively in teaching unit cards

**Portfolio Analysis Flow:**

1. User completes application wizard in `src/components/application/`
2. Data saved to Supabase via `src/integrations/supabase/client.ts`
3. Backend fetches portfolio via `src/services/portfolio/portfolioScannerService.ts`
4. Multi-stage analysis:
   - Stage 1: Holistic portfolio analysis
   - Stage 2: Dimensional scoring (9 dimensions)
   - Stage 3: Synthesis engine
   - Stage 4: Strategic guidance generation
5. Results stored in Supabase, displayed in dashboard

**State Management:**
- React Query for server state (API data, caching, refetching)
- Clerk for auth state (user, session)
- React Context for cross-cutting concerns (fraud tracking)
- Local component state for UI interactions

## Key Abstractions

**Service Pattern:**
- Purpose: Encapsulate business logic with singleton exports
- Examples: `src/services/credits/creditsService.ts`, `src/services/orchestrator/index.ts`
- Pattern: Export class + singleton instance for convenient imports

**Analysis Engine:**
- Purpose: Orchestrate multi-stage AI analysis pipelines
- Examples: `src/core/analysis/engine.ts`, `src/services/orchestrator/essayOrchestrator.ts`
- Pattern: Stage-based pipeline with feature extraction → scoring → synthesis

**Workshop Orchestrator:**
- Purpose: Manage multi-stage teaching/coaching flows
- Examples: `src/services/commonAppWorkshop/`, `src/services/narrativeWorkshop/`
- Pattern: Progressive stages with caching, each stage builds on previous

**Rubric System:**
- Purpose: Define scoring dimensions and weights for essay evaluation
- Examples: `src/core/rubrics/v1.0.0/`, `src/services/commonAppWorkshop/rubrics/`
- Pattern: Versioned rubric definitions with 11 weighted categories

**Mapper/Transformer:**
- Purpose: Convert between data shapes (API ↔ UI, Supabase ↔ domain models)
- Examples: `src/services/api/holisticMapper.ts`, `src/services/portfolio/utils/dataTransformer.ts`
- Pattern: Pure functions that transform data structures

## Entry Points

**Frontend SPA:**
- Location: `src/main.tsx`
- Triggers: User navigates to application URL
- Responsibilities: Initialize React app, mount Clerk auth provider, configure React Query, render router

**Backend API Server:**
- Location: `src/http/server.ts`
- Triggers: Node process started via `npm run server`
- Responsibilities: Initialize Express app, configure CORS, mount routes at `/api/v1` and `/api`, bind to port 8789

**Application Router:**
- Location: `src/App.tsx`
- Triggers: Rendered by `src/main.tsx`
- Responsibilities: Define all routes (public, protected, dashboard), wrap with auth guards, provide query client

**Dashboard Layout:**
- Location: `src/layouts/DashboardLayout.tsx`
- Triggers: Protected routes under dashboard (e.g., `/portfolio-scanner`, `/piq-workshop`)
- Responsibilities: Left sidebar navigation, authenticated app shell, outlet for nested routes

## Error Handling

**Strategy:** Multi-layer error handling with graceful degradation and fallbacks

**Patterns:**
- API routes use try-catch with 500 status + error message response
- Analysis engine has 3 fallback paths: (1) quick depth heuristic, (2) no API key fallback, (3) API error fallback
- Frontend uses React Query error boundaries and `.catch()` handlers
- Configuration errors shown via `ConfigError` component before app initialization
- Supabase client validates env vars and logs critical errors
- Heuristic scoring used when Claude API unavailable (preserves all 11 rubric dimensions)

## Cross-Cutting Concerns

**Logging:**
- Backend: `console.log` and `console.error` with prefixed tags (e.g., `[CORS]`, `[analyze-academics]`)
- Frontend: Browser console for client-side events
- Security events logged via `logSecurityEvent` in `src/http/security/`

**Validation:**
- TypeScript type checking across all layers (strict mode disabled for compatibility)
- Zod schemas in `src/schemas/` for runtime validation
- Request body validation in API routes before processing
- Supabase RLS policies enforce data access rules

**Authentication:**
- Clerk handles auth UI, session management, JWT tokens
- `requireAuth` middleware in `src/http/middleware/auth.ts` validates tokens on protected endpoints
- Frontend uses `useAuth` hook to access user context
- Dev mode bypass available with `ALLOW_DEV_AUTH=true` flag

---

*Architecture analysis: 2026-02-23*
