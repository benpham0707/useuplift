# Architecture Research: Dashboard/Command Center Interfaces

**Domain:** Dashboard home page integration with React Router SPA
**Researched:** 2026-02-23
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Provider Layer                          │
│  (QueryClient, Auth, Theme, Toaster)                         │
├─────────────────────────────────────────────────────────────┤
│                   React Router <Routes>                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Protected Route Wrapper                   │  │
│  │        (RequireVerified + DashboardLayout)             │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ SidebarProvider                                  │  │  │
│  │  │  ┌──────────┐  ┌──────────────────────────────┐ │  │  │
│  │  │  │ Sidebar  │  │ SidebarInset                 │ │  │  │
│  │  │  │          │  │  ┌──────────────────────┐    │ │  │  │
│  │  │  │ -Header  │  │  │ DashboardHeader      │    │ │  │  │
│  │  │  │ -Nav     │  │  └──────────────────────┘    │ │  │  │
│  │  │  │ -Footer  │  │  ┌──────────────────────┐    │ │  │  │
│  │  │  │          │  │  │ <Outlet />           │    │ │  │  │
│  │  │  │          │  │  │ (Child Routes)       │    │ │  │  │
│  │  │  │          │  │  └──────────────────────┘    │ │  │  │
│  │  │  └──────────┘  └──────────────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                         Page Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Dashboard │  │ Scanner  │  │ Workshop │  │Settings  │    │
│  │   Home   │  │   Page   │  │   Page   │  │   Page   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Current Uplift Implementation |
|-----------|----------------|-------------------------------|
| **SidebarProvider** | Manages sidebar open/closed state, collapse state, keyboard shortcuts | shadcn/ui `<SidebarProvider>` with internal context |
| **AppSidebar** | Navigation menu, branding, user info, credits display | Custom component in `src/components/dashboard/` |
| **SidebarInset** | Content container that adjusts to sidebar state | shadcn/ui `<SidebarInset>` with responsive margins |
| **DashboardHeader** | Sticky header with sidebar toggle, breadcrumbs (optional) | Minimal header with `<SidebarTrigger>` only |
| **DashboardLayout** | Root layout wrapper connecting sidebar and content via `<Outlet>` | `src/layouts/DashboardLayout.tsx` wraps protected routes |
| **Page Components** | Feature-specific UI rendered in outlet (Scanner, Insights, Workshop) | Individual files in `src/pages/` |

## Recommended Project Structure

```
src/
├── layouts/
│   └── DashboardLayout.tsx       # Layout wrapper with Sidebar + Outlet
├── components/
│   ├── dashboard/
│   │   ├── AppSidebar.tsx        # Navigation sidebar
│   │   ├── DashboardHeader.tsx   # Sticky header with trigger
│   │   └── home/                 # NEW: Dashboard Home components
│   │       ├── NextActionCard.tsx       # Action recommendation widget
│   │       ├── ProgressSection.tsx      # Readiness % + streaks
│   │       ├── DeadlinesList.tsx        # Upcoming deadlines widget
│   │       └── QuickLaunchGrid.tsx      # Feature shortcuts
│   └── ui/
│       ├── sidebar.tsx           # shadcn/ui sidebar primitives
│       ├── card.tsx              # Widget containers
│       └── [other shadcn components]
├── pages/
│   ├── DashboardHome.tsx         # NEW: Main dashboard landing page
│   ├── PortfolioScanner.tsx     # Existing feature page
│   ├── PortfolioInsightsNew.tsx # Existing feature page
│   └── [other pages]
├── hooks/
│   ├── useAuth.ts                # Clerk authentication
│   ├── useDashboardData.ts       # NEW: Dashboard metrics hook
│   └── [other hooks]
└── App.tsx                        # Route configuration
```

### Structure Rationale

- **`layouts/`**: Persistent layout wrappers that define page structure. DashboardLayout provides sidebar + header shell.
- **`components/dashboard/`**: Dashboard-specific components. Separating `home/` subdirectory keeps dashboard home widgets organized.
- **`pages/`**: Top-level route components. Each page is a complete view that renders in the `<Outlet>`.
- **shadcn/ui pattern**: Copy-paste components into `components/ui/` for full control. Zero runtime dependencies.

## Architectural Patterns

### Pattern 1: Nested Routes with Persistent Layouts

**What:** Parent route defines layout shell (sidebar, header), child routes render in `<Outlet>` without remounting the parent.

**When to use:** Dashboards, admin panels, any app with consistent navigation chrome across multiple pages.

**Trade-offs:**
- **Pro:** Layout persists during navigation (no sidebar re-render), excellent UX
- **Pro:** DRY - navigation defined once, shared across all dashboard pages
- **Con:** Route configuration must be nested correctly or layout won't apply

**Example:**
```typescript
// App.tsx route configuration
<Route element={<RequireVerified><DashboardLayout /></RequireVerified>}>
  <Route path="/dashboard" element={<DashboardHome />} />      {/* NEW */}
  <Route path="/portfolio-scanner" element={<PortfolioScanner />} />
  <Route path="/portfolio-insights" element={<PortfolioInsights />} />
  <Route path="/settings" element={<Settings />} />
</Route>

// DashboardLayout.tsx
export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1">
          <Outlet />  {/* Child pages render here */}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

### Pattern 2: Widget/Card-Based Dashboard Composition

**What:** Dashboard home page composed of independent, reusable card widgets. Each widget encapsulates its own data fetching, state, and UI.

**When to use:** Dashboard home pages, analytics views, overview screens with multiple data sources.

**Trade-offs:**
- **Pro:** Widgets are independent - can be reordered, added, or removed easily
- **Pro:** Easy to test in isolation
- **Con:** Data fetching happens in parallel per-widget (may need coordination for related data)
- **Con:** Without layout constraints, can become visually inconsistent

**Example:**
```typescript
// DashboardHome.tsx
export default function DashboardHome() {
  return (
    <div className="container py-6 space-y-6">
      {/* Hero section with primary action */}
      <NextActionCard />

      {/* Two-column layout for secondary info */}
      <div className="grid gap-6 md:grid-cols-2">
        <ProgressSection />
        <DeadlinesList />
      </div>

      {/* Quick launch cards */}
      <QuickLaunchGrid />
    </div>
  );
}
```

### Pattern 3: Hybrid State Management (Server + Client)

**What:** Use React Query (TanStack Query) for server data, useState/Context for UI state, lightweight stores (Zustand) for shared client state.

**When to use:** Modern React apps with mix of server-fetched data (user profile, credits, deadlines) and local UI state (sidebar collapsed, theme).

**Trade-offs:**
- **Pro:** Each state type uses optimal tool - React Query handles caching/invalidation, Context avoids prop drilling
- **Pro:** Fewer re-renders - React Query only updates subscribed components
- **Con:** More moving parts - team must understand when to use each tool

**Example:**
```typescript
// hooks/useDashboardData.ts
export function useDashboardData() {
  const { user } = useAuth();

  // Server data via React Query (with caching)
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchUserProfile(user!.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Derived metrics
  const readinessScore = profile?.readiness_score ?? 0;
  const streak = profile?.current_streak ?? 0;

  return { readinessScore, streak };
}

// Component usage
function ProgressSection() {
  const { readinessScore, streak } = useDashboardData();
  return <Card>...</Card>;
}
```

### Pattern 4: Collapsible Sidebar with Context

**What:** Sidebar collapse state managed by Context, accessible to header toggle and sidebar itself. Keyboard shortcut (Cmd+\) supported.

**When to use:** Desktop-first dashboards where users benefit from more screen real estate for content.

**Trade-offs:**
- **Pro:** Smooth user experience - state persists across navigation
- **Pro:** Keyboard power users can toggle without mouse
- **Con:** Adds complexity vs. always-expanded sidebar

**Example:**
```typescript
// shadcn/ui SidebarProvider handles this internally
<SidebarProvider>  {/* Manages open/closed state + keyboard shortcuts */}
  <AppSidebar />
  <SidebarInset>  {/* Adjusts margin based on sidebar state */}
    <DashboardHeader />
    <main>
      <Outlet />
    </main>
  </SidebarInset>
</SidebarProvider>

// Header toggle button
function DashboardHeader() {
  return (
    <header>
      <SidebarTrigger />  {/* Accesses context, toggles state */}
    </header>
  );
}
```

### Pattern 5: Progressive Disclosure with Stratified Layout

**What:** Dashboard arranges content top-to-bottom by priority: high-level overview at top (Next Action), supporting metrics in middle (Progress, Deadlines), detailed tools at bottom (Quick Launch).

**When to use:** Information-dense dashboards where users need to scan quickly for most important info.

**Trade-offs:**
- **Pro:** Matches natural eye-scanning patterns (F-pattern for LTR languages)
- **Pro:** Reduces cognitive load - critical info seen first
- **Con:** Less important content may be overlooked if "below the fold"

## Data Flow

### Request Flow (Widget Data Fetching)

```
[User lands on Dashboard Home]
    ↓
[DashboardHome page mounts]
    ↓
[Widget components mount in parallel]
    ↓
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ NextActionCard          │ ProgressSection         │ DeadlinesList           │
│   ↓ useQuery            │   ↓ useQuery            │   ↓ useQuery            │
│ [TanStack Query]        │ [TanStack Query]        │ [TanStack Query]        │
│   ↓ (check cache)       │   ↓ (check cache)       │   ↓ (check cache)       │
│   ↓ (if stale)          │   ↓ (if stale)          │   ↓ (if stale)          │
│ [Supabase API call]     │ [Supabase API call]     │ [Supabase API call]     │
│   ↓                     │   ↓                     │   ↓                     │
│ [Update cache]          │ [Update cache]          │ [Update cache]          │
│   ↓                     │   ↓                     │   ↓                     │
│ [Render with data]      │ [Render with data]      │ [Render with data]      │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

**Key insight:** Widgets fetch data independently. React Query handles deduplication if multiple widgets request same data (e.g., user profile).

### State Management Flow

```
[UI State - Sidebar Collapsed]
    ↓ (lives in SidebarProvider Context)
[SidebarTrigger button] → [useSidebar hook] → [Update context] → [Re-render Sidebar + SidebarInset]

[Server State - User Credits]
    ↓ (fetched via React Query)
[Supabase profiles table] → [useQuery in AppSidebar] → [Cache in QueryClient] → [Display in footer]
    ↓ (when updated)
[Backend deducts credit] → [Invalidate query] → [Refetch] → [UI updates]
```

### Key Data Flows

1. **Initial Page Load:** Router resolves `/dashboard` → DashboardLayout mounts → Sidebar/Header render → DashboardHome mounts in Outlet → Widgets fetch data in parallel
2. **Navigation:** User clicks "Scanner" in sidebar → React Router changes route → DashboardLayout stays mounted → Only Outlet content swaps to PortfolioScanner
3. **Credit Update:** User submits essay → Backend deducts credit → Emits `credits:updated` event → Sidebar's useEffect refetches credits → Footer updates

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current architecture sufficient. Widgets fetch directly from Supabase, React Query caches per-session. |
| 1k-10k users | Add Redis caching layer for frequently accessed data (user profiles, deadline templates). Consider route-based code splitting for dashboard pages. |
| 10k-100k users | Move to server-side data aggregation for dashboard metrics (pre-compute readiness scores). Implement WebSocket for real-time credit updates instead of polling. |
| 100k+ users | Separate dashboard backend service with dedicated API for analytics. Consider CDN for static dashboard assets. Implement progressive loading for deadline lists (virtualization). |

### Scaling Priorities

1. **First bottleneck:** React Query cache prevents redundant API calls, but Supabase direct queries may slow down. **Fix:** Add backend API layer that aggregates dashboard data (single endpoint returns all dashboard metrics instead of 3-5 separate queries).

2. **Second bottleneck:** Dashboard home with many widgets may have slow initial render. **Fix:** Implement Suspense boundaries per widget with skeleton loaders. Use `React.lazy()` for below-fold widgets (Quick Launch cards).

## Anti-Patterns to Avoid

### Anti-Pattern 1: Prop Drilling Through Layout

**What people do:** Pass dashboard data through DashboardLayout → DashboardHeader → child components via props.

**Why it's wrong:** Layout becomes tightly coupled to dashboard page data. Can't reuse layout for other pages (Scanner, Insights) that don't need that data.

**Do this instead:** Use React Query hooks in components that need data. Layout remains data-agnostic, just provides structure.

```typescript
// ❌ WRONG
<DashboardLayout userData={userData} credits={credits}>
  <DashboardHome />
</DashboardLayout>

// ✅ CORRECT
<DashboardLayout>  {/* No data props */}
  <DashboardHome />  {/* Fetches own data via hooks */}
</DashboardLayout>
```

### Anti-Pattern 2: Single Monolithic Dashboard Component

**What people do:** Put all dashboard content in one massive component with nested divs and inline data fetching.

**Why it's wrong:** Impossible to test widgets independently. Hard to reorder/remove sections. Single component re-renders when any data changes.

**Do this instead:** Break into widget components with clear boundaries. Each widget manages own data.

```typescript
// ❌ WRONG
function DashboardHome() {
  const [profile, setProfile] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  // ...300 lines of mixed logic and JSX

  return <div>{/* massive nested structure */}</div>;
}

// ✅ CORRECT
function DashboardHome() {
  return (
    <div className="space-y-6">
      <NextActionCard />      {/* Self-contained */}
      <ProgressSection />     {/* Self-contained */}
      <DeadlinesList />       {/* Self-contained */}
    </div>
  );
}
```

### Anti-Pattern 3: Bypassing React Router for Navigation

**What people do:** Use `window.location.href = '/scanner'` or manual history manipulation for sidebar clicks.

**Why it's wrong:** Breaks React Router's optimistic UI updates. Causes full page reload. Loses client-side routing benefits.

**Do this instead:** Use `<Link>` from `react-router-dom` for all navigation. React Router handles route changes without reloads.

```typescript
// ❌ WRONG
<button onClick={() => window.location.href = '/scanner'}>Scanner</button>

// ✅ CORRECT
<Link to="/scanner">Scanner</Link>
```

### Anti-Pattern 4: Index Route Without `index` Prop

**What people do:** Define `/dashboard` as a separate sibling route outside the nested structure, trying to make it the default.

**Why it's wrong:** DashboardLayout won't wrap the dashboard home. Must duplicate layout or navigate outside the shell.

**Do this instead:** Use `index` route inside nested structure. Index routes render at parent's path.

```typescript
// ❌ WRONG
<Route path="/dashboard" element={<DashboardHome />} />  {/* No layout */}
<Route element={<DashboardLayout />}>
  <Route path="/scanner" element={<Scanner />} />
</Route>

// ✅ CORRECT
<Route element={<DashboardLayout />}>
  <Route index path="/dashboard" element={<DashboardHome />} />  {/* Has layout */}
  <Route path="/scanner" element={<Scanner />} />
</Route>
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase | React Query with `supabase.from('table').select()` | Use `useQuery` for reads, `useMutation` for writes. Query keys include user ID for per-user caching. |
| Clerk Auth | `useAuth()` hook + `RequireVerified` wrapper | User object available in all dashboard components. Protected routes wrap DashboardLayout. |
| Stripe | Direct API calls from backend, frontend displays credits | Credits stored in Supabase profiles table. Frontend reads, backend writes. |
| Anthropic Claude | Not used in dashboard home | Dashboard shows results of AI analyses, doesn't call Claude directly. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| DashboardLayout ↔ Page Components | React Router `<Outlet>` | One-way: Layout provides shell, pages render inside. Pages don't access layout state. |
| Sidebar ↔ Header | Shared SidebarProvider context | Both components access collapse state via `useSidebar()` hook. |
| Widget ↔ Widget | No direct communication | Widgets are independent. If coordination needed, lift state to parent or use shared React Query cache. |
| Page ↔ Backend | React Query + Supabase client | Pages use `useQuery` to fetch, `useMutation` to update. React Query handles caching/invalidation. |

## Build Order Recommendations

Based on dependencies and architectural patterns, implement in this sequence:

### Phase 1: Route & Layout Foundation (1-2 hours)
1. Add `/dashboard` route to App.tsx as index route under DashboardLayout
2. Create skeleton DashboardHome page component
3. Add "Home" nav item to AppSidebar (first position with home icon)
4. Verify routing works: clicking Home → dashboard loads, sidebar persists

**Why first:** Establishes structure that all widgets depend on. Verifies React Router integration.

### Phase 2: Data Layer (1-2 hours)
1. Create `hooks/useDashboardData.ts` with React Query hooks for:
   - User profile (readiness score, streak)
   - Recent essays/analyses
   - Upcoming deadlines (mocked for v1)
2. Add placeholder data generators for v1 (no backend changes)
3. Test hooks in isolation (console.log in DashboardHome)

**Why second:** Widgets depend on data hooks. Building data layer first means widgets can focus on UI.

### Phase 3: Core Widgets (2-3 hours)
1. **NextActionCard** - Hero section with primary CTA
2. **ProgressSection** - Readiness %, streak counter, portfolio score
3. **DeadlinesList** - 3-5 upcoming deadlines with urgency colors

Build top-to-bottom following stratified layout pattern. Each widget is self-contained.

**Why third:** These widgets provide core value. Users immediately see status and next action.

### Phase 4: Supporting Widgets (1-2 hours)
1. **QuickLaunchGrid** - Cards linking to Scanner, Workshop, Insights, Settings
2. Polish responsive layout (grid → stack on small screens)
3. Add skeleton loaders for loading states

**Why fourth:** Quick launch is useful but not critical. Can be deferred if time-constrained.

### Phase 5: Integration & Polish (1-2 hours)
1. Connect credit deductions to refetch dashboard data (invalidate queries)
2. Add Suspense boundaries with fallbacks
3. Test navigation flow (Home → Feature → Home)
4. Performance check (React DevTools Profiler)

**Why last:** Integration reveals edge cases. Polish improves UX but doesn't block functionality.

### Total Estimated Effort: 6-10 hours

**Critical path:** Phase 1 → Phase 2 → Phase 3 (core widgets). Phases 4-5 are enhancements.

## Uplift-Specific Considerations

### Existing Architecture Strengths

- **shadcn/ui sidebar**: Already collapsible, keyboard shortcut supported, responsive (drawer on mobile). Don't rebuild this.
- **React Query configured**: `staleTime: 5min`, `gcTime: 30min`, retry logic already set. Dashboard widgets automatically benefit.
- **Protected routes working**: `RequireVerified` wrapper ensures only authenticated users see dashboard. Don't bypass this.
- **Credit system events**: `credits:updated` event already emitted. Dashboard can listen and refetch.

### Integration with Existing Pages

Dashboard Home becomes the **hub** in hub-and-spoke:
- **Hub (new):** Dashboard Home - "Where am I? What's next?"
- **Spokes (existing):** Scanner, Insights, Workshop, Settings - deep work tools

Current flow: User logs in → lands on Scanner (first sidebar item).
**New flow:** User logs in → lands on Dashboard Home → clicks Scanner when ready.

**Migration strategy:** Add Home as first sidebar item. Users discover it naturally. No forced redirect (avoids disorientation).

### Data Sources for Dashboard Home

| Widget | Data Source | Current Status |
|--------|-------------|----------------|
| Next Action | Mocked rules-based logic | v1: Hardcoded priority (e.g., "if essays.length === 0, suggest Scanner") |
| Readiness % | Supabase profiles table | Need to add column or compute from essays + portfolio |
| Streak | Supabase profiles table | Need to add streak tracking (could use existing essay timestamps) |
| Portfolio Score | Existing in profiles? | Verify if this is stored from portfolio-insights |
| Deadlines | Mocked array | v1: Static list, v2: user-entered + scraped |
| Recent Activity | essays table sorted by created_at | Existing data, just query latest 5 |

**No backend API needed for v1** - can query Supabase directly via React Query. Consider backend aggregation in Phase 2.

## Sources

### High Confidence (Official Docs + Context7)
- React Router official docs: Outlet component, nested routes, layout patterns - https://reactrouter.com/start/framework/routing
- shadcn/ui Dashboard Layout documentation - https://mui.com/toolpad/core/react-dashboard-layout/
- shadcn/ui Dashboard tutorial with component hierarchy - https://designrevision.com/blog/shadcn-dashboard-tutorial

### Medium Confidence (Industry Articles, 2026)
- React architecture patterns 2026 - https://www.bacancytechnology.com/blog/react-architecture-patterns-and-best-practices
- State management patterns (React Query, Zustand, Jotai) - https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns
- Dashboard design patterns (widget layouts, progressive disclosure) - https://www.patternfly.org/patterns/dashboard/design-guidelines/
- React Router integration best practices - https://strapi.io/blog/react-routing-guide

### Uplift Codebase (High Confidence)
- Existing DashboardLayout implementation: `src/layouts/DashboardLayout.tsx`
- Current routing structure: `src/App.tsx` (lines 100-107)
- AppSidebar navigation: `src/components/dashboard/AppSidebar.tsx`
- React Query configuration: `src/App.tsx` (lines 38-47)

---

*Architecture research complete. Patterns verified against official documentation and current Uplift codebase. Build order optimized for dependencies. Ready for roadmap phase planning.*
