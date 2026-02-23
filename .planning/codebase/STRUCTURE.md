# Codebase Structure

**Analysis Date:** 2026-02-23

## Directory Layout

```
uplift-final-final-18698-62030/
├── src/                          # Source code root
│   ├── app/                      # App-specific modules (experiences API)
│   ├── assets/                   # Static assets (images, fonts)
│   ├── components/               # React components (UI, dashboard, portfolio, workshop)
│   ├── config/                   # Configuration (Clerk setup)
│   ├── core/                     # Core domain logic (analysis, rubrics, types)
│   ├── data/                     # Static data (Common App colleges, supplemental types)
│   ├── hooks/                    # React hooks (useAuth, useFraudTracking, etc.)
│   ├── http/                     # Backend server (Express routes, middleware, webhooks)
│   ├── integrations/             # External service clients (Supabase)
│   ├── layouts/                  # Layout components (DashboardLayout)
│   ├── lib/                      # Libraries (LLM clients)
│   ├── modules/                  # Backend feature modules (analytics, assessment, experiences, personal)
│   ├── pages/                    # React pages (routing destinations)
│   ├── query/                    # React Query hooks
│   ├── schemas/                  # Validation schemas (Zod)
│   ├── services/                 # Business logic services (workshops, analysis, credits)
│   ├── supabase/                 # Supabase type definitions
│   ├── utils/                    # Utility functions
│   ├── App.tsx                   # Root app component (routing)
│   ├── main.tsx                  # Frontend entry point
│   └── index.css                 # Global styles
├── supabase/                     # Supabase project (migrations)
├── tests/                        # Test files (85+ tests)
├── .planning/                    # Planning documents (codebase analysis)
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
└── tailwind.config.ts            # Tailwind CSS configuration
```

## Directory Purposes

**src/components/:**
- Purpose: Reusable React components organized by domain
- Contains: UI primitives (`ui/`), dashboard components, portfolio visualization, workshop interfaces, application wizard
- Key files: `src/components/ui/` (shadcn/ui components), `src/components/dashboard/AppSidebar.tsx`, `src/components/portfolio/extracurricular/`

**src/services/:**
- Purpose: Business logic organized by feature domain
- Contains: AI analysis pipelines, workshop orchestrators, credit management, API clients
- Key subdirectories:
  - `orchestrator/` - Essay analysis orchestration
  - `commonAppWorkshop/` - Multi-stage Common App workshop (5 stages)
  - `narrativeWorkshop/` - Narrative deep dive workshop (stages 2-5)
  - `portfolioStrategy/` - Portfolio analysis with academic/activity workshops
  - `credits/` - Credit management and billing
  - `piqWorkshop/` - Personal Insight Question workshop
  - `api/` - Frontend API clients and mappers

**src/core/:**
- Purpose: Domain-agnostic core logic and definitions
- Contains: Analysis engine, rubric definitions (v1.0.0), essay types, generation logic
- Key files: `src/core/analysis/engine.ts`, `src/core/rubrics/v1.0.0/`, `src/core/types/`

**src/http/:**
- Purpose: Backend API server infrastructure
- Contains: Express server, route definitions, middleware (auth), webhooks (Clerk, Stripe), security utilities
- Key files: `src/http/server.ts`, `src/http/routes.ts`, `src/http/middleware/auth.ts`

**src/pages/:**
- Purpose: Top-level route components
- Contains: Landing pages, authenticated pages, workshop pages, settings
- Key files: `src/pages/Index.tsx` (landing), `src/pages/PortfolioScanner.tsx`, `src/pages/PIQWorkshop.tsx`

**src/modules/:**
- Purpose: Backend feature modules (controller layer)
- Contains: Experiences CRUD, analytics (portfolio strength), assessment completion, personal info
- Key files: `src/modules/experiences/controller.ts`, `src/modules/analytics/portfolio.ts`

**src/integrations/:**
- Purpose: External service integrations
- Contains: Supabase client with typed database schema
- Key files: `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`

**src/hooks/:**
- Purpose: Shared React hooks
- Contains: Authentication hook, fraud tracking, custom data fetching hooks
- Key files: `src/hooks/useAuth.tsx`, `src/hooks/useFraudTracking.tsx`

**src/lib/:**
- Purpose: Third-party library wrappers and clients
- Contains: LLM client abstraction (Claude)
- Key files: `src/lib/llm/claude.ts`

**src/data/:**
- Purpose: Static data used across the application
- Contains: Common App college list, supplemental essay types
- Key files: `src/data/commonAppColleges.ts`, `src/data/commonAppSupplementalTypes.ts`

**src/layouts/:**
- Purpose: Layout components for consistent page structure
- Contains: Dashboard layout with left sidebar
- Key files: `src/layouts/DashboardLayout.tsx`

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Frontend React app initialization with Clerk provider
- `src/http/server.ts`: Backend Express server on port 8789
- `src/App.tsx`: React Router with all route definitions

**Configuration:**
- `src/config/clerk.ts`: Clerk authentication configuration
- `tsconfig.json`: TypeScript compiler options (path aliases `@/*`)
- `vite.config.ts`: Vite dev server and build config
- `.env.local` (not committed): Environment variables (API keys, Supabase URL)

**Core Logic:**
- `src/core/analysis/engine.ts`: Multi-stage essay analysis orchestrator
- `src/core/rubrics/v1.0.0/weights.ts`: 11-dimension rubric with weights
- `src/services/orchestrator/essayOrchestrator.ts`: Full essay analysis pipeline
- `src/services/credits/creditsService.ts`: Credit management and atomic deduction

**API Routes:**
- `src/http/routes.ts`: All backend API endpoints
- `/api/analyze-entry`: Experience entry analysis (11-dimension rubric)
- `/api/analyze-academics`: Academic history analysis with red flags
- `/api/billing/*`: Stripe checkout and webhooks
- `/api/experiences`: CRUD for student activities

**Testing:**
- `tests/`: E2E and integration tests (85+ test files)
- `tests/test-comprehensive-e2e.ts`: Full system test

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `DashboardLayout.tsx`, `ExtracurricularModal.tsx`)
- Services/utilities: `camelCase.ts` (e.g., `creditsService.ts`, `holisticMapper.ts`)
- Types: `camelCase.ts` or `types.ts` (e.g., `experience.ts`, `collegeResearch.ts`)
- Index files: `index.ts` for barrel exports

**Directories:**
- Feature directories: `camelCase` (e.g., `commonAppWorkshop`, `portfolioStrategy`)
- Component directories: `camelCase` or `PascalCase` (e.g., `dashboard`, `portfolio/extracurricular`)
- Stage-based: `stageN_description` (e.g., `stage1_holistic`, `stage2_dimensions`)

**Variables:**
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `RUBRIC_VERSION`, `SUPABASE_URL`)
- Functions: `camelCase` (e.g., `analyzeEntry`, `calculateNQI`)
- React components: `PascalCase` (e.g., `PortfolioScanner`, `WorkshopDemo`)

**Types:**
- Interfaces: `PascalCase` (e.g., `AnalysisReport`, `StudentProfile`)
- Type aliases: `PascalCase` (e.g., `PIQPromptType`, `UCCampus`)

## Where to Add New Code

**New Workshop Type:**
- Primary code: `src/services/{workshopName}Workshop/`
- Create stages: `src/services/{workshopName}Workshop/stage{N}_{description}/`
- Types: `src/services/{workshopName}Workshop/types.ts`
- Orchestrator: `src/services/{workshopName}Workshop/index.ts`
- Frontend UI: `src/pages/{WorkshopName}Workshop.tsx`
- Add route: `src/App.tsx` (under authenticated routes)

**New API Endpoint:**
- Route handler: `src/http/routes.ts` (add route with `r.post()` or `r.get()`)
- Business logic: `src/modules/{feature}/` or `src/services/{feature}/`
- Middleware: `src/http/middleware/` if cross-cutting concern
- Tests: `tests/test-{feature}-{description}.ts`

**New React Component:**
- Shared UI: `src/components/ui/{ComponentName}.tsx`
- Dashboard component: `src/components/dashboard/{ComponentName}.tsx`
- Portfolio component: `src/components/portfolio/{ComponentName}.tsx`
- Page component: `src/pages/{PageName}.tsx`

**New Analysis Feature:**
- Core analysis: `src/core/analysis/{featureName}/`
- Rubric updates: `src/core/rubrics/v1.0.0/` (or new version)
- Service integration: `src/services/orchestrator/` or dedicated service
- Types: `src/core/types/{featureName}.ts`

**New Data Source:**
- Static data: `src/data/{dataName}.ts`
- Academic research: `src/services/portfolioStrategy/data/`
- College-specific: `src/services/commonAppWorkshop/data/`

**Utilities:**
- Shared helpers: `src/utils/{utilityName}.ts`
- LLM utilities: `src/lib/llm/{utilityName}.ts`
- Service-specific utils: `src/services/{serviceName}/utils/`

**New Page/Route:**
- Page component: `src/pages/{PageName}.tsx`
- Add route: `src/App.tsx` (public or under `<RequireVerified>`)
- Link in navigation: `src/components/dashboard/AppSidebar.tsx` if dashboard page

## Special Directories

**src/services/portfolioStrategy/:**
- Purpose: Comprehensive portfolio analysis system with academic and activity workshops
- Generated: No (hand-written with extensive academic research data)
- Committed: Yes
- Subdirectories:
  - `data/` - Academic research (AP courses, majors, college expectations)
  - `services/academicWorkshop/` - Academic history analysis
  - `services/activityWorkshop/` - Activity profile analysis (3-stage pipeline)
  - `engines/` - Analysis engines
  - `orchestrators/` - Multi-service orchestration

**src/services/commonAppWorkshop/data/:**
- Purpose: College-specific research data (2,500+ tokens per college)
- Generated: No (curated from admissions essays and college websites)
- Committed: Yes
- Contains: `stanfordResearch.ts`, `yaleResearch.ts`, etc. with full research context

**node_modules/:**
- Purpose: NPM dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in `.gitignore`)

**dist/:**
- Purpose: Vite build output
- Generated: Yes (via `npm run build`)
- Committed: No (in `.gitignore`)

**.planning/:**
- Purpose: Project planning and codebase documentation
- Generated: Via GSD commands
- Committed: Yes
- Contains: `codebase/` (architecture analysis), phase plans

**tests/:**
- Purpose: Integration and E2E test suite
- Generated: No (hand-written)
- Committed: Yes
- Contains: 85+ test files with cost tracking

**supabase/migrations/:**
- Purpose: Database schema migrations
- Generated: Via `supabase db diff`
- Committed: Yes
- Contains: SQL migration files (timestamped)

---

*Structure analysis: 2026-02-23*
