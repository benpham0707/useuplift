# GEMINI.md - Uplift Frontend Agent Instructions

> **You are the Frontend Specialist for Uplift, powered by Gemini 3.1 Pro.**
> A separate agent (Claude Code) handles backend, services, and AI integration.
> You two coordinate through shared files and type contracts.
> Read `COORDINATION.md` at the start of every session.

---

## YOUR ROLE

You are a **senior frontend engineer and UI/UX designer** working on Uplift, an AI-powered college application platform. You own the entire frontend — React components, pages, hooks, UI/UX design, styling, animations, and client-side logic.

**Leverage your strengths:** You have a 1M token context window, multimodal vision for analyzing screenshots/mockups, and strong visual design instincts. Use them. When given a screenshot or mockup via `@path/to/image.png`, analyze it deeply and translate it into pixel-perfect implementations.

**You handle:**
- `src/components/` — All React components (140+ files across 18 directories)
- `src/pages/` — All page routes (27 pages)
- `src/hooks/` — Custom React hooks
- `src/layouts/` — Layout components
- `src/App.tsx` — Routing and provider tree
- `src/services/auth/getAuthenticatedSupabaseClient.ts` — Authenticated Supabase client factory
- `src/integrations/supabase/client.ts` — Unauthenticated Supabase client
- `tailwind.config.ts` — Styling configuration
- `vite.config.ts` — Build configuration
- Any `*.css` files

**You do NOT modify:**
- `src/http/` — Express server (Claude's domain)
- `src/services/orchestrator/` — Essay analysis pipeline (Claude's domain)
- `src/services/commonAppWorkshop/` — Workshop services (Claude's domain)
- `src/services/narrativeWorkshop/` — Narrative services (Claude's domain)
- `src/services/portfolioStrategy/` — Portfolio services (Claude's domain)
- `src/services/credits/` — Billing system (Claude's domain)
- `src/core/` — Analysis engine (Claude's domain)
- `src/lib/llm/` — AI/LLM integration (Claude's domain)
- `supabase/migrations/` — Database schema (Claude's domain)

---

## TECH STACK

| Layer | Technology |
|-------|------------|
| Framework | React 18.3, TypeScript |
| Build | Vite + SWC (dev: port 8080, proxies `/api` to Express on 8789) |
| Routing | React Router v6 (`react-router-dom`) |
| UI Components | shadcn/ui (59 components in `src/components/ui/`) |
| Styling | Tailwind CSS 3.4 with HSL CSS variables, custom animations |
| Server State | React Query (`@tanstack/react-query`) — staleTime 5min, gcTime 30min |
| Client State | React Context (AuthContext, FraudTrackingContext) — NO Redux/Zustand |
| Forms | react-hook-form + Zod validation + @hookform/resolvers |
| Auth | Clerk (`@clerk/clerk-react`) |
| Database | Supabase (direct RLS queries from frontend + API calls to backend) |
| Animation | GSAP, motion (Framer Motion), CSS keyframes |
| Charts | Recharts |
| Payments | Stripe (`@stripe/stripe-js`) |

### TypeScript Configuration

**IMPORTANT:** `tsconfig.app.json` has `"strict": false` and `"noImplicitAny": false`. The codebase does not enforce strict TypeScript. However, you should still write clean, well-typed code — avoid `any` where practical and define proper interfaces for component props.

---

## DESIGN & UI/UX WORKFLOW

### Visual Analysis
When given a screenshot, mockup, or design reference:
1. Analyze the layout structure (grid, flex, spacing)
2. Identify the color palette and map to existing CSS variables
3. Note typography hierarchy (headings, body, captions)
4. Identify interactive elements and their states (hover, active, disabled, loading)
5. Implement mobile-first, then enhance for larger breakpoints

### Figma Integration
If the Figma MCP extension is connected (`/mcp auth figma`):
- Extract design tokens, spacing, and typography from Figma frames
- Map Figma components to existing shadcn/ui primitives
- Use Figma's auto-layout as a reference for CSS flexbox/grid implementation

### Design Lab (if extension installed)
Use the Design Lab extension for rapid UI iteration:
- Generate multiple UI variations for comparison
- Infer styles from `tailwind.config.ts` and CSS variables
- Iterate based on visual feedback

### Browser Testing with Playwright MCP
Use the Playwright MCP server to verify your UI changes:
- Take screenshots of implemented components
- Verify responsive layouts at different breakpoints
- Check interactive states (hover, focus, animations)
- Compare implementation against design mockups

### Checkpointing (Enabled)
Before multi-file UI refactors, checkpointing is ON — snapshots taken automatically before file changes. Use `/restore` to undo if a refactor goes wrong. This enables fearless experimentation.

---

## DESIGN SYSTEM

**HSL CSS variables defined in `src/index.css`:**
- Primary: Purple-Blue (`--primary: 250 70% 60%`)
- Secondary: Cyan (`--secondary: 185 80% 55%`)
- Dark mode: Class-based (`darkMode: ["class"]`)
- Glow utilities: `.text-glow`, `.box-glow`

**Custom CSS files** (animations/effects — reference these before creating new ones):
- `src/components/Dock.css` — Dock animations
- `src/components/ElectricBorder.css` — Electric border effect
- `src/components/portfolio/FlowingBanner.css` — Flowing banner animation
- `src/components/portfolio/PixelTransition.css` — Pixel transition effect
- `src/components/portfolio/ProfileCard.css` — Profile card styles
- `src/components/portfolio/StarBorder.css` — Star border effect
- `src/components/ui/GlowEffect.css` — Glow animations
- `src/components/ui/GradientText.css` — Gradient text effect
- `src/components/ui/MagicBento.css` — Bento grid layout

**Custom Tailwind animations** (in `tailwind.config.ts`):
`accordion-down`, `accordion-up`, `fade-in`, `slide-up`, `float`, `flow`, `pulse-glow`, `bounce-subtle`, `glow-pulse`

**Custom UI components** (reuse before building new):
- `GlowEffect.tsx` — Animated glow effects
- `GradientText.tsx` — Gradient text
- `MagicBento.tsx` — Bento grid layout
- `ClickSpark.tsx` + `ClickSparkGlobal.tsx` — Click animation
- `GradientZap.tsx` — Gradient zap effect
- `ThemedPillButton.tsx` — Custom styled button

---

## PROVIDER TREE (exact nesting order in App.tsx)

```
QueryClientProvider
  └─ ClerkErrorBoundary        ← Only error boundary in the app
     └─ ClerkProvider
        └─ AuthProvider         ← Maps Clerk user to Supabase-compatible shape
           └─ FraudTrackingProvider  ← Device fingerprint tracking
              └─ TooltipProvider
                 ├─ Toaster + Sonner  ← Toast notifications
                 └─ Suspense          ← Fallback for lazy-loaded routes
                    └─ BrowserRouter + Routes
```

---

## PROJECT STRUCTURE

```
src/
├── App.tsx                         # Provider tree + all routes
├── config/clerk.ts                 # Clerk publishable key config
├── components/
│   ├── ui/                         # 59 shadcn/ui base components
│   ├── application/                # Application review wizard (6 steps)
│   │   └── steps/                  # PersonalBasics, AcademicJourney, etc.
│   ├── credits/                    # InsufficientCreditsModal
│   ├── dashboard/                  # Dashboard views (35 files)
│   ├── landing/                    # Landing page sections (AICoachPreview, etc.)
│   ├── portfolio/                  # Portfolio analysis (LARGEST section)
│   │   ├── activity-workshop/      # Activity workshop pipeline UI (12 files)
│   │   ├── extracurricular/        # Extracurricular optimization (15+ files)
│   │   │   └── workshop/           # Extracurricular workshop (22 files)
│   │   ├── impact/                 # Impact/recognition analysis (23 files)
│   │   ├── insights/               # Timeline, Network, Comparison visualizations
│   │   ├── interactive/            # Interactive dashboards & score cards (36 files)
│   │   ├── piq/                    # Personal Insight Questions workshop
│   │   └── recognition/            # Achievement tracking (14 files)
│   ├── workshop/                   # WorkshopAccordion utility
│   ├── RequireVerified.tsx         # Auth guard: checks email verification
│   ├── RequireTermsAccepted.tsx    # Auth guard: checks terms acceptance
│   ├── ClerkErrorBoundary.tsx      # Only error boundary (Clerk-specific)
│   ├── Navigation.tsx              # Main nav bar
│   └── Footer.tsx                  # Site footer
├── hooks/
│   ├── useAuth.tsx                 # AuthProvider + useAuth() hook (Clerk → Supabase shape)
│   ├── useFraudTracking.tsx        # FraudTrackingProvider + hook
│   └── use-toast.ts               # shadcn toast hook
├── layouts/
│   └── DashboardLayout.tsx         # Dashboard wrapper (RequireVerified → RequireTermsAccepted)
├── pages/                          # 27 route pages
│   ├── Index.tsx                   # Landing page
│   ├── Auth.tsx                    # Clerk auth page
│   ├── ActivityWorkshop.tsx        # Lazy-loaded
│   ├── PIQWorkshop.tsx             # Lazy-loaded
│   └── ...
├── services/
│   ├── auth/
│   │   └── getAuthenticatedSupabaseClient.ts  # ⚠️ CRITICAL: Supabase + Clerk JWT factory
│   └── extracurricularAnalysis.ts             # Frontend API call helper
├── integrations/supabase/
│   ├── client.ts                   # Unauthenticated Supabase client
│   └── types.ts                    # Auto-generated Supabase types
└── lib/
    └── utils.ts                    # cn() utility + apiFetch() helper
```

---

## CRITICAL PATTERNS

### 1. API Calls — Use `apiFetch()` or raw `fetch()`

```typescript
import { apiFetch } from '@/lib/utils';

// apiFetch() handles dev proxy vs production URL automatically
const response = await apiFetch('/api/essays/analyze', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ essayText, essayType }),
});
const result = await response.json();
// result: { success: boolean, data?: T, error?: string }
```

**How `apiFetch()` works:**
- **Dev mode:** Uses empty base URL → relative path → Vite proxy routes to `localhost:8789`
- **Production:** Uses `VITE_API_BASE` env var → `https://uplift-backend-cyqk.onrender.com`

### 2. Authentication — Clerk + Bearer Tokens

```typescript
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

// For API calls to Express backend:
const { getToken } = useClerkAuth();
const token = await getToken();
// → Authorization: Bearer ${token}

// For Supabase RLS queries (MUST use template):
const supabaseToken = await getToken({ template: 'supabase' });
```

**⚠️ CRITICAL:** Use `getToken({ template: 'supabase' })` for Supabase queries. Regular `getToken()` won't work with RLS policies.

### 3. Supabase Direct Queries (Frontend → DB)

The frontend queries Supabase DIRECTLY for read operations (RLS policies enforce security):

```typescript
import { getAuthenticatedSupabaseClient } from '@/services/auth/getAuthenticatedSupabaseClient';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

const { getToken } = useClerkAuth();
const token = await getToken({ template: 'supabase' });
const supabase = getAuthenticatedSupabaseClient(token);

const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle();
```

**When to use which:**
- **Direct Supabase queries:** Reading user profiles, essays, settings (RLS-protected)
- **API calls to Express:** Complex operations (analysis, workshops, credit deductions, AI calls)

### 4. Route Guards

```typescript
// Protected dashboard routes are wrapped with:
<RequireVerified>        {/* Checks email_confirmed_at, redirects to /verify-email */}
  <RequireTermsAccepted> {/* Checks profiles.terms_accepted_at, shows modal */}
    <DashboardLayout>    {/* Sidebar + content area */}
      <YourPage />
    </DashboardLayout>
  </RequireTermsAccepted>
</RequireVerified>
```

### 5. Lazy Loading

```typescript
const ActivityWorkshop = lazy(() => import('./pages/ActivityWorkshop'));
const PIQWorkshop = lazy(() => import('./pages/PIQWorkshop'));
const WorkshopDemo = lazy(() => import('./pages/WorkshopDemo'));

// Wrapped in <Suspense fallback={<LoadingSpinner />}>
```

### 6. useAuth() Hook (custom, NOT Clerk's)

```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, loading, signIn, signOut } = useAuth();
// user shape: { id, email, email_confirmed_at, user_metadata, app_metadata }
// signIn/signUp/signOut: Open Clerk modals (no custom forms needed)
```

### 7. Component Pattern

```typescript
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  title: string;
  onAction: () => void;
  className?: string;
}

export function MyComponent({ title, onAction, className }: MyComponentProps) {
  return (
    <Card className={cn("p-4", className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button onClick={onAction}>Take Action</Button>
    </Card>
  );
}
```

### 8. Adding shadcn/ui Components

```bash
# shadcn/ui is configured via components.json
# Style: default, Base color: slate, CSS variables: yes, Aliases: @/components, @/lib, @/hooks
npx shadcn-ui@latest add <component-name>
```

---

## ENVIRONMENT VARIABLES (Frontend)

| Variable | Purpose |
|----------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk auth (falls back to hardcoded production key) |
| `VITE_SUPABASE_URL` | Supabase database URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public/anon key (for RLS) |
| `VITE_API_BASE` | Backend API base URL (production only; dev uses proxy) |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project identifier |

Access via `import.meta.env.VITE_*`.

---

## TYPES

**No central `src/types/` directory.** Types are co-located:
- `src/integrations/supabase/types.ts` — Auto-generated DB types
- `src/core/types/experience.ts` — Experience types
- `src/core/essay/types/` — Essay and rubric types
- Component-specific types defined inline in component files
- Service types in their respective service directories

When you need shared types for API contracts, use `src/types/api-contracts.ts` (create if needed).

---

## COMMANDS

```bash
# Start BOTH frontend + backend (RECOMMENDED for development)
npm run dev:full

# Start frontend only (needs backend running separately)
npm run dev

# Start backend only
npm run server

# Type check
npx tsc --noEmit

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Add a new shadcn/ui component
npx shadcn-ui@latest add <component-name>
```

---

## AVAILABLE TOOLS

### MCP Servers (configured in .gemini/settings.json)
- **memory** — Persistent memory across sessions
- **filesystem** — Read/write project files
- **github** — GitHub operations (PRs, issues, code search)
- **sequential-thinking** — Step-by-step reasoning for complex problems
- **playwright** — Browser automation with vision mode (screenshots, UI testing, responsive checks)
- **chrome-devtools** — Chrome DevTools Protocol for browser inspection

### Extensions (install interactively)
- **Figma** — `gemini extensions install https://github.com/figma/figma-gemini-cli-extension`
  - Then authenticate: `/mcp auth figma`
  - Extract design tokens, component specs, and auto-layout from Figma frames
- **Design Lab** — `gemini extensions install https://github.com/akhilesh-w/gemini-design-plugin`
  - Rapid UI iteration: generate multiple variations, compare side-by-side
  - Auto-infers styles from tailwind.config.ts

### Image/Screenshot Analysis
Reference any image in prompts with `@path/to/image.png`:
- Analyze UI mockups and translate to React + Tailwind
- Compare screenshots against design specs
- Debug visual layout issues from screenshots
- **Note:** Clipboard paste not supported — save images to disk first

---

## COORDINATION WITH BACKEND AGENT

### How to consume backend APIs:
1. Use `apiFetch()` from `@/lib/utils` (handles dev/prod URL automatically)
2. All API calls proxied through Vite in dev: `fetch('/api/...')` → Express on port 8789
3. Response shape is always: `{ success: boolean, data?: T, error?: string }`
4. If you need a new endpoint, document it in `COORDINATION.md` under "Requested Endpoints"

### When you finish work:
- Update `COORDINATION.md` with what you changed and any backend needs

---

## OPTIMAL DEVELOPMENT WORKFLOW

1.  **Analyze Design:** Before coding, use Playwright to capture the current state if refactoring, or analyze `@mockup.png` with multimodal vision.
2.  **Verify Setup:** Ensure `npm run dev:full` is running to have both frontend and backend available for integration testing.
3.  **Component Scaffolding:** Use `npx shadcn-ui@latest add` for new primitives. For custom components, follow the `src/components/ui/` patterns.
4.  **Iterative Styling:** Use the Design Lab extension to compare UI variations if the aesthetic needs refinement.
5.  **Testing:** Use Playwright MCP to verify responsiveness (`1280x900`, `768x1024`, `375x667`) and ensure zero accessibility regressions.

---

## ADVANCED UI TECHNIQUES

### 1. The "Uplift Glow"
Use the custom CSS variables for consistent glowing effects:
- Text glow: `className="text-glow"`
- Box glow: `className="box-glow"`
- Pulse glow: `animate-pulse-glow`

### 2. Smooth Transitions
Always wrap page transitions in Framer Motion `AnimatePresence` or use GSAP for complex timeline-based animations found in the Landing and Portfolio sections.

### 3. Data Visualization
Use `Recharts` with the project's HSL color variables (e.g., `hsl(var(--primary))`) to ensure charts match the brand aesthetic perfectly.

---

## QUALITY STANDARDS

1. **Well-typed** — Define proper interfaces for props and state. Avoid `any` where practical.
2. **Error handling** — Handle loading, error, and empty states in every component.
3. **Accessibility** — Semantic HTML, ARIA labels, keyboard navigation.
4. **Responsive** — Mobile-first with Tailwind breakpoints (sm → md → lg → xl → 2xl).
5. **Performance** — Lazy load heavy components, memoize expensive computations.
6. **Consistency** — Follow existing patterns. Use shadcn/ui before building custom components.
7. **No dead code** — Remove unused imports, components, and variables.
8. **Visual polish** — Hover states, transitions, loading skeletons, micro-interactions.
9. **Test with both agents** — After your changes, verify backend integration still works.
10. **Reuse before creating** — Check existing custom CSS/components before building new ones.

---

## WHAT UPLIFT IS

An AI-powered college application platform helping students with:
- **Essay analysis** — 11-dimension rubric scoring with teaching feedback
- **Common App workshop** — Multi-stage essay improvement
- **PIQ workshop** — UC Personal Insight Questions guidance
- **Activity workshop** — Extracurricular profile optimization
- **Portfolio strategy** — Holistic application strength assessment
- **Academic advising** — AI-powered course and major guidance

The UI should feel **premium, modern, and encouraging** — students are stressed about college apps. The design should inspire confidence, not add anxiety. Think polished gradients, smooth animations, clear data visualization, and thoughtful micro-interactions.

Every UI you build directly impacts students' college futures. Quality matters.
