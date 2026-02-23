# Project Research Summary

**Project:** Dashboard Home / Command Center for Uplift
**Domain:** Dashboard interface for college application platform
**Researched:** 2026-02-23
**Confidence:** HIGH

## Executive Summary

Dashboard home pages in 2025 have evolved into intelligent command centers that answer "What should I do right now?" in under 3 seconds. For Uplift's college application platform, research reveals a remarkably well-aligned existing stack (React 18, TypeScript, shadcn/ui, TanStack Query, Recharts) that already contains 95% of what's needed. The primary technical challenge is not technology selection but rather architectural integration: properly connecting the new dashboard home page to the existing React Router nested layout structure while maintaining authentication boundaries and sidebar state management.

The recommended approach leverages existing patterns from Uplift's codebase. Dashboard home becomes the hub in a hub-and-spoke architecture, where users land to orient themselves ("Where am I?", "What's next?") before navigating to deep-work features (Scanner, Workshop, Insights). Key features include: (1) AI-powered Next Best Action recommendations (heuristic-based for v1, not ML), (2) Readiness percentage score for at-a-glance status, (3) color-coded deadline list with urgency indicators, (4) quick-launch cards for one-click feature access, and (5) collapsible sidebar with keyboard shortcuts. The existing shadcn/ui sidebar component, Clerk authentication, and TanStack Query configuration handle the heavy lifting.

Critical risks center on React Router integration pitfalls: missing `<Outlet />` in DashboardLayout will break child route rendering, unenforced authentication allows unauthenticated access, prop drilling for sidebar state creates maintenance nightmares, and inline mocked data prevents v2 migration to real AI recommendations. Prevention requires disciplined adherence to established patterns: use Context for sidebar state from day one, abstract mock data to service layer, derive active navigation from `useLocation()` not manual state, and test with empty user profiles to validate onboarding experience. Desktop-first optimization is acceptable for v1, but responsive units (rem, %) must be used from the start to avoid costly mobile refactoring later.

## Key Findings

### Recommended Stack

The Uplift stack is already 95% optimal for dashboard development. All core dependencies exist: React 18.3.1 for UI, TypeScript 5.8.3 for type safety, shadcn/ui for component system, Tailwind CSS 3.4.17 for styling, Vite 5.4.19 for fast dev builds, and TanStack Query 5.83.0 for server state management. The only specialized dashboard library needed is Recharts 2.15.4 for charts/visualizations — already installed. Supporting libraries (date-fns for deadline formatting, lucide-react for icons, motion for animations, cmdk for command palette, sonner for toasts) are all present and configured.

**Core technologies:**
- **React 18 + TypeScript**: Industry standard with concurrent rendering for smooth dashboard updates — non-negotiable for reliability
- **shadcn/ui**: Copy-paste component system with full customization, Radix UI primitives for accessibility, Sidebar component with collapsible support and keyboard shortcuts
- **TanStack Query v5**: Automatic caching and background updates perfect for dashboard metrics, parallel query fetching, React 18 optimizations
- **Recharts 2.15.4**: SVG-based charts (crisp on all screens), 67.6% faster than Chart.js for large datasets, native React integration via JSX, integrates with shadcn theming for automatic dark mode
- **Tailwind CSS Grid**: No library needed for dashboard layout — responsive grid with breakpoints, consistent spacing, zero runtime cost

**Critical decision: No new major dependencies needed.** Defer react-grid-layout (drag/drop widgets) until proven user demand. Defer Recharts 3.x migration (breaking changes) until v2. Avoid Redux/MUI/Ant Design (massive overkill, design system conflicts).

### Expected Features

Dashboard home pages have well-established table stakes that users expect and differentiators that create competitive advantage. For college applications specifically, students need deadline awareness, progress visibility, and guided next actions to reduce decision paralysis.

**Must have (table stakes):**
- **Status Overview Zone** — High-level readiness %, portfolio score, current phase visible within 3 seconds (F-pattern layout, critical info top-left)
- **Upcoming Deadlines List** — 3-5 items with color-coded urgency (red < 3 days, yellow 3-7 days, green > 7 days), includes date + task + time remaining
- **Quick Launch Cards** — One-click access to Scanner, Workshop, Insights, Portfolio without sidebar hunting (card-based grid, 2:1 aspect ratio, icons + brief descriptions)
- **Collapsible Sidebar with Shortcuts** — Cmd+\ or [ toggle, icons-only collapsed state, smooth animation, responsive touch-friendly
- **Clear Navigation Structure** — Sidebar with logical grouping, active state highlighting, consistent icon usage, "Home" as first item
- **Real-Time Data Updates** — Live information from Supabase via TanStack Query, loading states, empty states, error states all designed
- **Accessible Design (WCAG 2.2)** — Keyboard navigation, ARIA labels, color + icon/pattern (never color alone), screen reader compatible

**Should have (competitive):**
- **AI-Powered "Next Best Action"** — Context-aware recommendations (1-3 action cards) that answer "What should I do right now?" — reduces decision paralysis, considers user profile + deadline proximity + incomplete work (heuristic rules for v1, ML for v2)
- **Readiness Percentage Score** — Single composite metric from essays completed + deadlines met + profile completeness + portfolio strength — visual progress bar/ring
- **Streak Counter with Safeguards** — Drives daily engagement through loss aversion (2.3x more likely to return with 7+ day streak), includes "Jokers" repair mechanism (50 credits to fix missed day), milestone celebrations (7, 30, 100 days) — but defer to v1.x after validating core value prop
- **Progress Milestones with Celebrations** — Confetti animations at key moments (first essay done, 50% ready), personalized messages, badges — dopamine hits increase completion rates
- **Period Comparison Analytics** — "How am I doing vs. last month?" with week-over-week, month-over-month variance highlighting — requires time-series data storage

**Defer (v2+):**
- **Mobile-Responsive Optimization** — Desktop-first validated, then touch-friendly targets (44x44px), off-canvas sidebar, PWA with offline support
- **Role-Based Dashboard Views** — Different personas (junior exploring vs. senior applying) see different priorities — requires user segmentation logic
- **OAuth Calendar Sync** — Google/Apple/Outlook integration is high complexity, v1 can export .ics files, two-way sync deferred
- **Real AI Model for Recommendations** — Train on user behavior data (what actions led to successful applications), personalized recommendations replace heuristics

**Anti-features to explicitly avoid:**
- **Real-time everything** — Overengineering, adds complexity/cost/battery drain; real-time only where it matters (deadline changes, essay analysis status)
- **Infinite customization** — Decision paralysis, testing nightmare; provide 2-3 sensible presets, section toggle on/off (not drag-and-drop)
- **Social features / Leaderboards** — Public comparison increases anxiety in high-stress college apps; use private progress tracking, personal bests, milestone celebrations (no public rankings)
- **Maximalist data display** — Cognitive overload from 17 metrics; limit to 3-5 key metrics on home, drill-down for detail, progressive disclosure pattern
- **Streaks without safety nets** — Broken streaks cause user churn; include Jokers/repair mechanism, weekend exclusions, tie to actual goal achievement (not just DAUs)

### Architecture Approach

The standard 2025 architecture for dashboard interfaces uses nested React Router routes with persistent layouts. DashboardLayout provides the shell (sidebar + header) and child routes render in an `<Outlet />` without remounting the parent. This pattern is already implemented in Uplift's codebase — the dashboard home page slots into this existing structure as an index route. The architectural challenge is not designing from scratch but rather correctly integrating into established patterns while avoiding common pitfalls (missing Outlet, prop drilling, authentication gaps).

**Major components:**
1. **SidebarProvider** — Manages sidebar open/closed state, collapse state, keyboard shortcuts via Context API (shadcn/ui component provides this, don't rebuild)
2. **DashboardLayout** — Root layout wrapper that connects sidebar and content via `<Outlet />`, wraps all dashboard routes at route level (existing component, just add index route)
3. **DashboardHome page** — New hub page composed of independent widget components (NextActionCard, ProgressSection, DeadlinesList, QuickLaunchGrid), each widget manages own data fetching via TanStack Query hooks
4. **Widget components** — Self-contained card-based components that encapsulate data fetching, state, and UI (progressive disclosure pattern: hero section with Next Action, supporting metrics in middle, detailed tools at bottom)
5. **useDashboardData hook** — Custom hook wrapping TanStack Query for dashboard metrics (user profile, readiness score, streak, recent activity, deadlines), fetches in parallel with automatic caching and deduplication

**Key patterns:**
- Widget/card-based composition for independent, reusable components
- Hybrid state management (TanStack Query for server data, Context for UI state, localStorage for persistence)
- Progressive disclosure with stratified layout (top-to-bottom priority matching F-pattern eye scanning)
- Service abstraction for mock data (makes v2 migration a config change, not rewrite)

### Critical Pitfalls

Research identified 15 common dashboard integration pitfalls across three severity levels. The top 5 critical pitfalls account for 80% of dashboard project failures and must be prevented during Phase 1-2 implementation.

1. **Missing `<Outlet />` in Layout Routes** — Child routes fail to render when navigating from dashboard. URL changes but content doesn't update. This is THE most common React Router layout integration mistake. **Prevention:** Verify DashboardLayout includes `<Outlet />` in main content area during Phase 1 routing setup.

2. **Information Overload on Dashboard Home** — Dashboard becomes data dumping ground with too many widgets. Users experience analysis paralysis instead of clarity. **Prevention:** Strict 6-8 widget limit, establish visual hierarchy (Next Action gets 2x size), user test "identify most important action in 2 seconds".

3. **Desktop-First Design Technical Debt** — Building desktop-first with fixed pixels creates mobile refactoring nightmare. Mobile becomes 40% additional effort later. **Prevention:** Use responsive units (rem, %, vw) from day one, test at 375px width even if not shipping mobile v1.

4. **Prop Drilling and Poor State Management for Sidebar** — Sidebar collapsed state passed through 4-5 component layers. Code becomes unmaintainable, performance suffers. **Prevention:** Use Context from the start for sidebar state (shadcn/ui SidebarProvider handles this), leverage useLocation for active route tracking.

5. **Mocked Data That Can't Be Swapped for Real Data** — v1 ships with hardcoded mock recommendations, v2 migration requires component rewrites. **Prevention:** Service abstraction from day one (`NextBestActionService` returns mocked data in v1, real data in v2), match production data shape in mocks.

## Implications for Roadmap

Based on research, the optimal implementation order follows dependency chains discovered in architecture and pitfalls research. The suggested 4-phase structure balances incremental progress with verification gates to prevent costly rework.

### Phase 1: Routing & Layout Foundation

**Rationale:** All features depend on correct route structure and layout shell. Must establish this foundation and verify routing integration before building UI components. Missing `<Outlet />` or unenforced authentication discovered in Phase 3 requires full rework.

**Delivers:**
- `/dashboard` route added to App.tsx as index route under DashboardLayout
- "Home" navigation item in AppSidebar (first position with home icon)
- Skeleton DashboardHome page component rendering in outlet
- Authentication verified via `<RequireVerified>` wrapper
- Navigation flow tested: Home → Scanner → Home works without layout re-mount

**Addresses:**
- Table stakes: Clear navigation structure, Home in sidebar
- Architecture: Nested routes with persistent layouts pattern
- Critical pitfall #1: Missing Outlet verified by test navigation
- Critical pitfall #7: Authentication enforced at layout level

**Avoids:**
- Missing `<Outlet />` in DashboardLayout (test catch before UI build)
- Authentication bypass (verify RequireVerified wrapper)
- Route configuration errors (validate nested structure)

**Estimated effort:** 1-2 hours

**Research flag:** NO — Well-documented React Router patterns, existing Uplift implementation to follow

---

### Phase 2: Dashboard UI Components

**Rationale:** With routing verified, build UI components following established visual hierarchy (hero → metrics → tools). Establish responsive foundations and component patterns even though mobile launch is deferred. Build widgets independently following widget/card-based composition pattern.

**Delivers:**
- **NextActionCard** — Hero section with primary CTA (heuristic-based recommendation for v1)
- **ProgressSection** — Readiness %, streak counter (mocked initially), portfolio score
- **DeadlinesList** — 3-5 upcoming deadlines with color-coded urgency (red/yellow/green)
- **QuickLaunchGrid** — Feature shortcuts to Scanner, Workshop, Insights, Portfolio
- Responsive layout using Tailwind Grid (desktop-optimized, mobile-stacks)
- Empty states designed and implemented for new users (0 essays)
- shadcn/ui component variants audited for consistency with existing pages

**Addresses:**
- Must-haves: Status overview zone, deadlines list, quick launch cards, collapsible sidebar
- Differentiators: AI Next Best Action (v1 heuristics), readiness score
- Critical pitfall #2: Information overload prevented by 4-widget limit + visual hierarchy
- Critical pitfall #3: Desktop-first debt prevented by responsive units from day one
- Moderate pitfall #9: Empty states designed alongside populated states
- Minor pitfall #14: shadcn variant consistency verified

**Uses:**
- shadcn/ui: Card, Progress, Collapsible components
- Tailwind CSS: Grid layout, responsive breakpoints, utility classes
- lucide-react: Icons for navigation and metrics
- date-fns: Deadline formatting ("in 3 days")

**Implements:**
- Widget/card-based composition pattern
- Progressive disclosure with stratified layout
- F-pattern information hierarchy

**Estimated effort:** 3-4 hours

**Research flag:** NO — Standard shadcn/ui component patterns, existing Scanner/Workshop pages provide style reference

---

### Phase 3: Data Integration

**Rationale:** With UI built, connect to real data sources while maintaining clean abstraction for v2 evolution. Mock data must be structured for easy migration to real AI recommendations. Implement loading states and error boundaries discovered as common failure points in pitfalls research.

**Delivers:**
- **useDashboardData hook** — TanStack Query hooks for user profile, essays, deadlines (parallel fetching with caching)
- **Service abstraction layer** — `NextBestActionService` with mock implementation, swappable via feature flag
- **Mock data file** — `src/mocks/dashboardData.ts` with production-shaped data
- **Loading states** — Skeleton loaders matching final content dimensions (prevent layout shift)
- **Empty states** — Tested with new account (0 essays, 0 workshops)
- **Error boundaries** — Graceful fallback for API failures
- **Sidebar state persistence** — localStorage with `uplift.sidebar.collapsed` namespace

**Addresses:**
- Critical pitfall #4: Sidebar state via Context (shadcn SidebarProvider), not prop drilling
- Critical pitfall #5: Service abstraction makes v2 migration a config change
- Critical pitfall #6: Skeleton dimensions match max content size, tested with edge cases
- Moderate pitfall #12: Next Best Action checks user state before recommendation
- Minor pitfall #13: Active nav state derived from useLocation, not manual tracking

**Uses:**
- TanStack Query v5: useQuery for parallel fetching, queryKey with user ID, staleTime: 5min
- Supabase: Direct queries via Supabase client for profiles, essays, deadlines
- localStorage: Sidebar collapsed preference with namespaced key

**Implements:**
- Hybrid state management (TanStack Query for server, Context for UI)
- Service abstraction for mock data
- Stable prop references (useCallback, useMemo) where needed

**Estimated effort:** 2-3 hours

**Research flag:** NO — TanStack Query patterns established in existing Uplift codebase, Supabase schema documented

---

### Phase 4: Testing & Polish

**Rationale:** Integration reveals edge cases missed during isolated component development. Performance profiling identifies re-render bottlenecks before they impact users. Accessibility testing catches keyboard shortcut conflicts and screen reader issues.

**Delivers:**
- Navigation flow testing (all routes accessible from dashboard)
- Performance profiling with React DevTools Profiler (<50 renders per interaction)
- Empty state testing with fresh account
- Authentication testing in incognito mode
- Keyboard shortcut testing (Cmd+\ with screen reader active)
- Layout shift testing (slow network throttling, no visible jump)
- Cross-browser testing (Chrome, Safari, Firefox)
- Responsive breakpoint testing (375px, 768px, 1024px, 1920px)

**Addresses:**
- Critical pitfall #8: Re-render performance verified with Profiler
- Moderate pitfall #10: Deadline prioritization logic tested (max 5 shown, color-coded)
- Moderate pitfall #11: Keyboard shortcut conflicts checked
- Minor pitfall #15: Route transition loading states verified

**Implements:**
- Test with edge cases: longest essay title (150 chars), max deadlines (5 items), new user (0 essays)
- Performance optimization: Identify actual bottlenecks with Profiler, add memoization strategically (not premature)
- Accessibility verification: Keyboard navigation, ARIA labels, color contrast

**Estimated effort:** 1-2 hours

**Research flag:** NO — Standard React testing patterns, existing test infrastructure in Uplift

---

### Phase Ordering Rationale

1. **Foundation before features** — Phase 1 establishes route structure that all widgets depend on. Missing Outlet discovered in Phase 3 requires full rework. Verify routing FIRST.

2. **UI before data** — Phase 2 builds components with mocked data. Separating UI from data allows parallel work (can mock indefinitely while backend evolves) and forces clean component/data boundaries.

3. **Integration after isolation** — Phase 3 connects real data after UI is stable. Service abstraction layer makes v2 migration to real AI a config change, not component rewrites.

4. **Polish after functionality** — Phase 4 finds edge cases through integration testing. Performance profiling identifies actual bottlenecks (not premature optimization).

**Dependency chain:**
```
Phase 1 (Routing) → Phase 2 (UI Components) → Phase 3 (Data) → Phase 4 (Testing)
                 ↓                        ↓
          All phases depend on      Widgets depend on
          correct route structure   routing foundation
```

**How this avoids pitfalls:**
- Phase 1 catches missing Outlet (pitfall #1), authentication gaps (pitfall #7)
- Phase 2 prevents information overload (pitfall #2), establishes responsive foundations (pitfall #3)
- Phase 3 prevents prop drilling (pitfall #4), mocked data migration problems (pitfall #5), layout shift (pitfall #6)
- Phase 4 catches re-render performance (pitfall #8), keyboard conflicts (pitfall #11), integration bugs

**Total estimated effort:** 7-11 hours across 4 phases

### Research Flags

Phases with standard patterns (skip research-phase):
- **Phase 1 (Routing & Layout):** React Router nested routes are well-documented, existing Uplift DashboardLayout provides working reference implementation
- **Phase 2 (UI Components):** shadcn/ui component patterns established, existing Scanner/Workshop pages show style conventions
- **Phase 3 (Data Integration):** TanStack Query usage documented in existing Uplift services (orchestrator, portfolioStrategy), Supabase schema known
- **Phase 4 (Testing & Polish):** Standard React testing patterns, existing test infrastructure (tests/ directory with 85+ tests)

**No phases require /gsd:research-phase.** All necessary patterns documented in research files or exist in current codebase.

**Future phases that WOULD need research:**
- **Streak Counter with Jokers** (v1.x deferred feature) — Gamification psychology, repair mechanism UX patterns, behavioral science research required
- **Real AI Recommendation Model** (v2) — ML training pipeline, recommendation engine architecture, Anthropic Claude integration for contextual recommendations
- **OAuth Calendar Integration** (v2) — Google Calendar API, Apple iCloud API, OAuth flow patterns, two-way sync architecture
- **Mobile PWA** (v2) — Progressive Web App patterns, offline sync, service workers, mobile-first responsive design

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Official shadcn/ui docs, TanStack Query docs, Recharts performance data (67.6% faster than Chart.js), package.json verification shows all dependencies already installed |
| Features | **HIGH** | Multiple authoritative sources (Salesforce Einstein for Next Best Action, Plotline/Growth Engineering for streaks, NN/g for skeleton states), consistent patterns across education platforms (Canvas LMS, Common App) |
| Architecture | **HIGH** | Official React Router docs for nested routes/Outlet, shadcn/ui Dashboard tutorial, existing Uplift DashboardLayout implementation verified in codebase |
| Pitfalls | **HIGH** | Verified through official documentation (Clerk auth, React Router issues on GitHub), performance case studies (Medium re-render analysis), established UX research (NN/g, ICS anti-patterns) |

**Overall confidence:** **HIGH**

The research benefits from exceptional alignment between industry best practices and Uplift's existing stack. 95% of required technologies are already installed and configured. The architectural patterns (nested routes, widget composition, TanStack Query) are well-documented and proven in production. Pitfall research is grounded in official documentation and real-world case studies rather than speculation.

### Gaps to Address

1. **Readiness percentage calculation logic** — Research confirms users expect composite readiness scores, but exact calculation not defined. **Resolution:** Define during Phase 3 data integration based on available metrics (essays completed / total needed, portfolio strength 0-100, profile completeness %). Can start with simple formula: `(essayCount * 0.4) + (portfolioScore * 0.3) + (profileComplete * 0.3)` and iterate based on user feedback.

2. **Deadline data source for v1** — Research shows users need deadlines, but Uplift doesn't currently store deadline entities. **Resolution:** Phase 3 uses mock deadline array for v1 validation. Add deadline database table + manual entry UI in v1.x after core dashboard proves valuable. Defer scraping/API integration to v2.

3. **Streak tracking implementation details** — Research validates streaks drive 2.3x engagement with safety nets (Jokers), but daily login detection logic not specified. **Resolution:** Defer streak counter to v1.x (not critical for v1 launch). When implemented, track `last_activity_date` in profiles table, compute streak on load, implement Joker mechanism as credit purchase (50 credits to repair broken streak).

4. **Mobile breakpoint strategy** — Research recommends testing at mobile viewport even for desktop-first, but doesn't specify exact breakpoints. **Resolution:** Use Tailwind's default breakpoints (sm: 640px, md: 768px, lg: 1024px) which match shadcn/ui expectations. Test at 375px (iPhone SE), 768px (iPad), 1024px (laptop), 1920px (desktop) during Phase 4.

5. **Keyboard shortcut conflicts** — Research warns Cmd+\ may conflict, but Uplift shortcut audit not performed. **Resolution:** During Phase 2 sidebar implementation, verify Cmd+\ doesn't conflict with Scanner, Workshop, or browser developer tools. Consider alternative Cmd+B (VS Code convention) if conflicts found. Document shortcut in tooltip.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- React Router v6 Documentation — Nested routes, Outlet component, layout patterns
- shadcn/ui Components — Sidebar, Collapsible, Card, Progress components
- shadcn/ui Dashboard Tutorial — Component hierarchy, layout structure
- TanStack Query v5 Documentation — useQuery, parallel fetching, caching strategies
- Clerk Authentication — React Router integration, Protect component
- Motion (Framer Motion) Documentation — Animation library API
- Lucide Icons Documentation — Icon library, tree-shaking

**Technical Research:**
- Oreate AI: "Recharts vs Chart.js Performance" — 67.6% faster at scale, SVG vs canvas comparison
- LogRocket: "Best React Chart Libraries 2025" — Recharts vs Nivo vs Chart.js
- PatternFly: "Dashboard Design Guidelines" — Information hierarchy, card patterns

### Secondary (MEDIUM confidence)

**Dashboard Best Practices:**
- resolution.de, Medium (Carlos Smith), DesignRush — Dashboard design principles, 3-second rule
- UX Collective, Adam Fard, Pencil & Paper — Progressive disclosure, card UI patterns
- Educate-me.co, Bold BI, ConexED — Student dashboard features, deadline tracking, real-time updates

**Gamification & Engagement:**
- Plotline, Growth Engineering, Trophy.so — Streak psychology, 2.3x engagement with 7+ day streaks, safety nets (Jokers), loss aversion, milestone celebrations

**Performance & State Management:**
- Medium: "React Rendering Bottleneck: 60% Re-render Reduction"
- Kent C. Dodds: "Optimize React Re-renders"
- DeveloperWay: "React State Management in 2025"

**Pitfalls Research:**
- Metabase: "Top 5 Dashboard Fails"
- Domo: "Top 10 Dashboard Design Mistakes"
- NN/g: "Skeleton Screens 101"
- Medium: "React Router Common Mistakes"
- UI-Patterns: "User Interface Anti-Patterns"

### Tertiary (Uplift Codebase — HIGH confidence)

**Existing Implementation:**
- src/layouts/DashboardLayout.tsx — Current layout with sidebar structure
- src/components/dashboard/AppSidebar.tsx — Navigation implementation
- src/App.tsx (lines 38-47) — TanStack Query configuration
- src/App.tsx (lines 100-107) — React Router nested route structure
- package.json — Verified versions of all dependencies

---

*Research completed: 2026-02-23*
*Ready for roadmap: YES*
