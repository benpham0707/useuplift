# Pitfalls Research

**Domain:** Dashboard/Command Center Home Pages for Existing Applications
**Researched:** 2026-02-23
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Missing `<Outlet />` in Layout Routes

**What goes wrong:**
Child routes (Scanner, Workshop, Insights pages) fail to render when navigating from the dashboard home. The sidebar shows the navigation, but clicking links results in blank content areas. This is THE most common React Router layout integration mistake.

**Why it happens:**
Developers create a DashboardLayout component with sidebar navigation but forget that React Router v6 requires an explicit `<Outlet />` component to render nested child routes. Unlike older routing patterns, the framework doesn't automatically insert child content.

**How to avoid:**
```typescript
// ✅ CORRECT: DashboardLayout.tsx must include <Outlet />
import { Outlet } from 'react-router-dom';

function DashboardLayout() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="content">
        <Outlet /> {/* Child routes render here */}
      </main>
    </div>
  );
}
```

**Warning signs:**
- Routes are defined correctly but pages don't render
- URL changes but content doesn't update
- Console shows no errors but screen stays blank
- Navigation highlights correct item but nothing displays

**Phase to address:**
Phase 1 (Routing & Layout Foundation) — verify routing structure with test navigation before building UI components.

---

### Pitfall 2: Information Overload on Dashboard Home

**What goes wrong:**
Dashboard becomes a "data dumping ground" with too many widgets, metrics, charts, and action cards. Users experience analysis paralysis instead of clarity. Every metric seems equally important, making nothing actually important. Loading takes 20+ seconds, users stop checking the dashboard.

**Why it happens:**
Teams think "more information = more value" and try to surface everything possible. Product managers from different teams all want their features highlighted. No one wants to make the hard call about what NOT to show.

**How to avoid:**
- **Strict widget limit**: Maximum 6-8 primary information zones on initial view
- **Hierarchy through size**: Most important metric gets 2x the visual weight
- **Progressive disclosure**: "View details" links instead of cramming data
- **User testing**: If user can't identify the most important action in 2 seconds, redesign
- **For Uplift**: "Next Best Action" gets hero placement, secondary metrics (streak, portfolio score) are supporting, not competing

**Warning signs:**
- Scroll required to see all dashboard content on standard laptop (1366x768)
- More than 3 competing calls-to-action
- Users asking "what should I focus on?"
- Average time on dashboard page > 30 seconds without action

**Phase to address:**
Phase 2 (Dashboard UI Components) — establish visual hierarchy and information architecture BEFORE building widgets.

---

### Pitfall 3: Desktop-First Design Technical Debt

**What goes wrong:**
Building desktop-first with intention to "add mobile later" creates bloated CSS, poor performance on mobile, and a mobile experience that feels like an afterthought. When mobile is finally added, it requires significant refactoring, not just CSS media queries.

**Why it happens:**
"Most college applications are completed on desktop" becomes justification to skip mobile. Teams underestimate the effort required to retrofit responsive design. Desktop layout patterns (multi-column dashboards, hover states, large click targets) don't translate to mobile without fundamental redesign.

**How to avoid:**
Even if shipping desktop-first:
- **Test at mobile viewport during development** (not just before launch)
- **Use responsive units** (rem, %, vw) instead of fixed pixels from day one
- **Avoid desktop-only patterns**: Hover-required interactions, tiny click targets (< 44px), 3+ column layouts
- **Budget mobile time**: If v2 will include mobile, reserve 40% of current effort for that work
- **For Uplift**: Use shadcn/ui components with mobile-friendly defaults, test at 375px width even if not shipping mobile

**Warning signs:**
- Fixed pixel widths on major layout containers
- Hover states with no touch alternative
- Multi-column grids with no fallback stacking
- "We'll make it responsive later" in planning docs

**Phase to address:**
Phase 2 (Dashboard UI Components) — establish responsive foundations during initial component build, even if mobile launch is deferred.

---

### Pitfall 4: Prop Drilling and Poor State Management for Sidebar

**What goes wrong:**
Sidebar collapsed state, active route highlighting, and navigation state get passed through 4-5 component layers via props. Code becomes unmaintainable. Adding a new feature that needs sidebar state requires touching 6 files. Performance suffers from unnecessary re-renders across the entire tree.

**Why it happens:**
Developers know about Context but think "it's just one piece of state, props are fine." Then they add another prop for active route. Then another for keyboard shortcut handling. By the time it's painful, refactoring feels too expensive.

**How to avoid:**
- **Use Context from the start** for sidebar state (collapsed, active route, keyboard shortcuts)
- **Single source of truth**: Don't duplicate collapsed state in localStorage AND component state
- **Leverage useLocation**: React Router's useLocation hook eliminates manual active route tracking
- **For Uplift**: Create `SidebarContext` in Phase 1, even though it feels like overkill for "just collapsed state"

```typescript
// ✅ CORRECT: Sidebar state via Context
const SidebarContext = createContext<{
  collapsed: boolean;
  toggle: () => void;
}>({ collapsed: false, toggle: () => {} });

function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem('sidebar-collapsed') === 'true'
  );

  const toggle = useCallback(() => {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}
```

**Warning signs:**
- Components receiving props they don't use (just passing through)
- Need to trace state through 3+ files to debug issue
- Adding new sidebar feature requires touching > 3 files
- re-renders visible in React DevTools for components that don't need updates

**Phase to address:**
Phase 1 (Routing & Layout Foundation) — establish state management patterns before building UI.

---

### Pitfall 5: Mocked Data That Can't Be Swapped for Real Data

**What goes wrong:**
v1 ships with mocked "Next Best Action" recommendations. When v2 tries to integrate real AI recommendations, the component structure doesn't support dynamic data. Hardcoded values are scattered across components. The mock-to-production migration requires a rewrite, not a configuration change.

**Why it happens:**
Mocking is treated as a shortcut rather than a deliberate abstraction. Developers inline mock data in components because "we'll remember where it is." Data structures in mocks don't match the shape of real API responses. No clear boundary between data layer and presentation layer.

**How to avoid:**
- **Service abstraction from day one**: Create `NextBestActionService` that returns mocked data in v1, real data in v2
- **Match production data shape**: If real API returns `{ actions: [...], confidence: number }`, mock should too
- **Single mock file**: All mocked data in `src/mocks/dashboardData.ts`, not scattered across components
- **Feature flags**: Use environment variable to toggle mock vs. real: `const useRealData = import.meta.env.VITE_USE_REAL_RECOMMENDATIONS === 'true'`
- **For Uplift**: Create service layer even though v1 doesn't call backend — makes v2 migration a config change

```typescript
// ✅ CORRECT: Swappable data source
// src/services/nextBestAction/index.ts
interface NextBestActionService {
  getRecommendations(userId: string): Promise<ActionRecommendation[]>;
}

class MockNextBestActionService implements NextBestActionService {
  async getRecommendations(userId: string) {
    return MOCK_ACTIONS; // Matches real API response shape
  }
}

class RealNextBestActionService implements NextBestActionService {
  async getRecommendations(userId: string) {
    const res = await fetch(`/api/recommendations/${userId}`);
    return res.json();
  }
}

export const nextBestActionService: NextBestActionService =
  import.meta.env.VITE_USE_REAL_RECOMMENDATIONS === 'true'
    ? new RealNextBestActionService()
    : new MockNextBestActionService();
```

**Warning signs:**
- Mock data defined inline in component files
- No clear interface/contract for data shape
- Comments like "// TODO: replace with API call"
- Different mock data shapes in different components
- No environment variable for toggling data source

**Phase to address:**
Phase 3 (Data Integration) — establish service abstraction before building UI that consumes data.

---

### Pitfall 6: Skeleton States That Cause Layout Shift

**What goes wrong:**
Dashboard loads with skeleton placeholders, then actual content arrives and the entire layout jumps. "Next Best Action" card shifts down 100px because skeleton was 200px tall but real content is 300px. Cumulative Layout Shift (CLS) score tanks. Users lose their place.

**Why it happens:**
Skeleton dimensions don't match final content dimensions. Developers build skeleton based on "expected" content, but edge cases (long titles, 3 action cards instead of 1) weren't considered. Images/charts load without reserved space.

**How to avoid:**
- **Fixed skeleton dimensions**: Skeleton should match the maximum possible content size, not average
- **Reserve space for dynamic content**: If action cards can be 1-3 items, skeleton reserves space for 3
- **Test with edge cases**: Long essay titles, 10-digit numbers, missing data states
- **Use min-height**: Set min-height on containers so they don't collapse while loading
- **For Uplift**: Test skeletons with longest essay title in database (150 characters), not typical 30-character titles

**Warning signs:**
- Visible "jump" when content loads
- Chrome DevTools shows CLS > 0.1
- Skeleton disappears but content doesn't appear for 100ms+ (blank flash)
- Layout shift most noticeable on slow network throttling

**Phase to address:**
Phase 3 (Data Integration) — implement loading states with layout shift testing during development.

---

### Pitfall 7: Clerk Authentication Route Guards Missing

**What goes wrong:**
Dashboard home page is accessible to unauthenticated users via direct URL navigation. Partial page renders before redirect to login. User data fetching throws errors because no authenticated context. Confusing flicker of dashboard → login screen on page load.

**Why it happens:**
Developers add dashboard route but forget to wrap it with authentication guard. Existing pages use `<RequireVerified>` component, but new dashboard route skips this pattern. React Router configuration allows public access by default with Clerk.

**How to avoid:**
- **Explicit route protection**: All dashboard routes must use `<Protect>` or similar guard
- **Consistent with existing patterns**: Uplift uses `<RequireVerified>`, dashboard must too
- **Test unauthenticated access**: Manual test — open dashboard URL in incognito window
- **Protected by default**: Configure route matcher so dashboard/* requires auth
- **For Uplift**: Wrap entire DashboardLayout with `<RequireVerified>`, not individual child routes

```typescript
// ✅ CORRECT: Dashboard routes protected at layout level
<Route element={<RequireVerified />}>
  <Route element={<DashboardLayout />}>
    <Route index element={<DashboardHome />} />
    <Route path="scanner" element={<ScannerPage />} />
    <Route path="workshop" element={<WorkshopPage />} />
  </Route>
</Route>
```

**Warning signs:**
- Dashboard flickers before redirecting to login
- Console errors about missing user data on dashboard load
- Dashboard route accessible in incognito mode
- Different auth pattern than existing pages

**Phase to address:**
Phase 1 (Routing & Layout Foundation) — verify authentication integration before building dashboard UI.

---

### Pitfall 8: Massive Re-renders from Unstable Prop References

**What goes wrong:**
Every keystroke in a (future) search filter re-renders all dashboard widgets, even widgets unaffected by the filter. Dashboard feels sluggish. React DevTools Profiler shows 200+ component renders per interaction. Performance degrades as dashboard complexity grows.

**Why it happens:**
Dashboard components receive new object/array references on every parent render. Inline functions (`onClick={() => handleClick()}`) and inline objects (`style={{ marginTop: 10 }}`) defeat React.memo optimizations. Parent state changes trigger full dashboard tree re-render.

**How to avoid:**
- **Stable references**: Wrap handlers in `useCallback`, objects in `useMemo`
- **Component composition over prop optimization**: Expensive components as children prop, not via state
- **Don't over-memoize**: Profile before adding useMemo — sorting 50 items doesn't need memoization
- **Measure first**: React DevTools Profiler identifies actual problems, don't guess
- **For Uplift**: Dashboard home likely low-interaction in v1 (mostly static cards), but establish patterns for v2 filters

```typescript
// ❌ WRONG: New references on every render
function DashboardHome() {
  const filters = { region: 'US', period: '2024' }; // New object each render
  return <MetricsCard filters={filters} onClick={() => navigate('/details')} />;
}

// ✅ CORRECT: Stable references
function DashboardHome() {
  const filters = useMemo(() => ({ region: 'US', period: '2024' }), []);
  const handleClick = useCallback(() => navigate('/details'), [navigate]);
  return <MetricsCard filters={filters} onClick={handleClick} />;
}
```

**Warning signs:**
- Typing in input field causes unrelated components to flash
- React DevTools Profiler shows high "render count" for components
- Dashboard UI feels sluggish on lower-end devices
- Components wrapped in React.memo still re-rendering unnecessarily

**Phase to address:**
Phase 2 (Dashboard UI Components) — establish performance patterns early, but don't over-optimize until Phase 4 (Testing & Polish).

---

## Moderate Pitfalls

### Pitfall 9: No Fallback for Missing User Data

**What goes wrong:**
New users land on dashboard with no essays, no workshops completed, no metrics. Dashboard shows empty states but they're not helpful ("You have 0 essays" instead of "Ready to analyze your first essay?"). User doesn't know what action to take.

**Why it happens:**
Dashboards are designed around "power users" with existing data. Empty states are an afterthought. No product thinking about first-run experience.

**How to avoid:**
- **Design empty states first**: Before building data-populated widgets, design the zero-data state
- **Actionable empty states**: "Analyze your first essay" with CTA button, not just "No essays yet"
- **Progressive onboarding**: First visit shows different layout than returning user
- **For Uplift**: New user dashboard emphasizes Scanner quick-launch, returning user shows metrics

**Warning signs:**
- Empty state is just `{essays.length === 0 ? 'No essays' : <EssayList />}`
- Test with fresh account shows unhelpful or confusing dashboard
- No clear CTA for new users

**Phase to address:**
Phase 2 (Dashboard UI Components) — design empty states alongside populated states.

---

### Pitfall 10: Deadline List Without Prioritization Logic

**What goes wrong:**
"Upcoming Deadlines" shows 20 deadlines in chronological order. User scrolls to find the relevant ones. Deadlines 2 years away appear with same urgency as deadlines in 2 days. List becomes noise instead of signal.

**Why it happens:**
Simple sort by date is easy to implement. Product doesn't think through "what makes a deadline urgent?" until users complain.

**How to avoid:**
- **Color-coded urgency**: Red (<7 days), yellow (7-30 days), neutral (>30 days)
- **Smart filtering**: Only show next 3-5 deadlines, not all 20
- **Relative time display**: "In 3 days" instead of "March 15, 2026"
- **For Uplift**: v1 shows max 5 deadlines, sorted by date, with color coding

**Warning signs:**
- All deadlines look equally important visually
- User has to read entire list to find urgent items
- List shows deadlines 6+ months away while current deadlines buried

**Phase to address:**
Phase 2 (Dashboard UI Components) — implement prioritization logic during deadline component build.

---

### Pitfall 11: Keyboard Shortcut (Cmd+\) Conflicts

**What goes wrong:**
Dashboard implements Cmd+\ to toggle sidebar, but this conflicts with existing Uplift keyboard shortcuts, browser defaults, or accessibility tools. Users accidentally collapse sidebar when trying to use other features.

**Why it happens:**
Keyboard shortcut is chosen without auditing existing shortcuts in the application. No testing with screen readers or accessibility tools that use keyboard navigation.

**How to avoid:**
- **Audit existing shortcuts**: Check if Cmd+\ is used elsewhere in Uplift
- **Use standard patterns**: Cmd+B is more common for sidebar toggle (VS Code, Notion)
- **Make it discoverable**: Tooltip on collapse button shows the shortcut
- **Allow customization**: Advanced users can remap shortcuts (v2 feature)
- **For Uplift**: Verify Cmd+\ doesn't conflict with Scanner, Workshop, or browser tools

**Warning signs:**
- Same shortcut triggers multiple actions
- Screen reader users report unexpected behavior
- User testing shows confusion about shortcut behavior

**Phase to address:**
Phase 2 (Dashboard UI Components) — test keyboard shortcuts during sidebar build, before shipping.

---

### Pitfall 12: "Next Best Action" Without Context or Explanation

**What goes wrong:**
Dashboard shows "Complete your Common App essay" as next best action. User already completed it. Or user hasn't started profile, so Common App advice is premature. Recommendations feel robotic and irrelevant.

**Why it happens:**
v1 uses simple rule-based mocking (if no essays, suggest Scanner). No consideration of user journey stage, existing work, or prerequisites.

**How to avoid:**
- **Even mocked data needs logic**: Check user state before showing recommendation
- **Explain the "why"**: "Complete your Common App essay — applications open in 30 days"
- **Dismissible recommendations**: User can hide irrelevant suggestions
- **For Uplift**: v1 checks if user has essays before recommending Scanner, checks workshop progress before suggesting next stage

**Warning signs:**
- Recommendations ignore user's actual state
- No explanation for why action is recommended
- Users complain recommendations feel "off"

**Phase to address:**
Phase 3 (Data Integration) — implement recommendation logic that considers user context.

---

## Minor Pitfalls

### Pitfall 13: Sidebar Active State Not Synced with URL

**What goes wrong:**
User navigates to /dashboard/scanner, but sidebar highlights "Home" as active. Or user clicks Scanner in sidebar, sidebar highlights Scanner, but a browser back/forward breaks the highlighting.

**Why it happens:**
Active state managed in component state instead of derived from URL. Manual state updates miss edge cases like browser navigation.

**How to avoid:**
- **Use useLocation**: Active state derived from `location.pathname`, not manual tracking
- **For Uplift**: Sidebar reads `useLocation()` to determine active item, no separate state

```typescript
// ✅ CORRECT: Active state from URL
const location = useLocation();
const isActive = (path: string) => location.pathname === path;

<NavItem to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
  Home
</NavItem>
```

**Warning signs:**
- Active state wrong after browser back/forward
- Active highlighting doesn't match URL
- Manual state updates scattered across components

**Phase to address:**
Phase 1 (Routing & Layout Foundation) — use useLocation from the start.

---

### Pitfall 14: Inconsistent shadcn/ui Component Variants

**What goes wrong:**
Dashboard home uses `<Button variant="default">` but existing Scanner page uses `variant="primary"`. Cards use different padding. Typography styles don't match. Dashboard feels like a different app.

**Why it happens:**
Dashboard built in isolation without referencing existing page styles. shadcn/ui provides many variants, developer picks different ones than existing codebase.

**How to avoid:**
- **Style guide audit**: Before building dashboard, document which shadcn variants are used in existing pages
- **Reuse existing patterns**: If Scanner uses `variant="outline"` for secondary actions, dashboard should too
- **For Uplift**: Check Scanner, Workshop, Insights pages for Button, Card, Badge variants before building dashboard components

**Warning signs:**
- Visual inconsistency between dashboard and other pages
- Button styles look different
- Code review catches variant mismatches

**Phase to address:**
Phase 2 (Dashboard UI Components) — establish style consistency during component build.

---

### Pitfall 15: Lack of Loading State During Route Transitions

**What goes wrong:**
User clicks "Scanner" in sidebar. URL changes but page content doesn't update for 500ms. Feels broken or frozen.

**Why it happens:**
No loading indicator during route transitions. React Suspense not configured for route-level code splitting.

**How to avoid:**
- **Route-level Suspense**: Wrap routes in Suspense boundary with loading fallback
- **Navigation feedback**: Active nav item highlights immediately, content area shows skeleton
- **For Uplift**: DashboardLayout shows loading state in content area during transitions

**Warning signs:**
- Clicking navigation feels unresponsive
- No visual feedback during route change
- Users click multiple times thinking navigation failed

**Phase to address:**
Phase 1 (Routing & Layout Foundation) — add loading states during initial routing setup.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline mock data in components | Faster initial build | v2 migration requires component rewrites | **Never** — always abstract to service layer |
| Fixed pixel widths for layout | Easier to match designs exactly | Mobile implementation requires full refactor | **Never** — use responsive units from day 1 |
| Prop drilling instead of Context | "It's just one prop" | Unmanageable when sidebar needs 5 pieces of state | **Never** for dashboard layouts — Context from start |
| Skip empty state designs | Ship dashboard faster | New users see broken/confusing interface | **Never** — empty states are first-run UX |
| Copy-paste components instead of extracting shared | Faster per-widget build | 5 similar MetricCard components to maintain | **Acceptable** if <3 variants, extract if >3 |
| Skip keyboard shortcut testing | Ship feature this sprint | Accessibility and power user complaints post-launch | **Never** — takes 10 minutes to test |
| Static/mocked "Next Best Action" | v1 ships without AI integration complexity | Users expect dynamic recommendations immediately | **Acceptable** if clearly communicated as v1 limitation |
| Desktop-only optimization | Smaller initial scope | 40% additional effort to add mobile in v2 | **Acceptable** with explicit v2 plan and test at mobile viewport |

## Integration Gotchas

Common mistakes when connecting dashboard to existing Uplift infrastructure.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Clerk authentication | Dashboard route not wrapped in `<RequireVerified>` | Wrap DashboardLayout at route level, consistent with existing pages |
| React Router | Forgetting `<Outlet />` in DashboardLayout | Include Outlet in every layout component with child routes |
| Supabase data | Fetching all user essays on every dashboard render | Fetch once, cache in Context, or use SWR/React Query |
| shadcn/ui components | Using different variants than existing pages | Audit Scanner/Workshop/Insights for variant patterns first |
| Existing route structure | Dashboard home at `/dashboard` conflicts with existing routes | Verify no existing `/dashboard` route, or nest under `/app/dashboard` |
| localStorage persistence | Sidebar state in localStorage conflicts with other stored state | Namespace keys: `uplift.sidebar.collapsed`, not just `collapsed` |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering entire dashboard on every interaction | Sluggish UI, especially on typing | Component composition, stable prop references, selective memoization | >5 interactive widgets on dashboard |
| Loading all user data on dashboard mount | Slow initial load (>3s), high Supabase query costs | Lazy load non-critical widgets, paginate large lists | User has >50 essays or >20 workshops |
| No skeleton states / loading indicators | Blank screen for 2+ seconds, poor perceived performance | Skeleton loaders matching final content dimensions | Slow network or large dataset |
| Unstable object/function props breaking React.memo | Memoized components still re-rendering constantly | useMemo for object props, useCallback for functions | Dashboard has >10 memoized components |
| Large bundle from importing all dashboard widgets upfront | Long initial JavaScript download, slow TTI | Code split dashboard widgets with dynamic imports | Dashboard has >6 widget types |
| No virtualization for long lists (deadlines, essays) | Janky scroll, high DOM node count (>1000) | react-window or react-virtualized for lists >50 items | User has >50 deadlines or essays to display |

## UX Pitfalls

Common user experience mistakes in dashboard interfaces.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| All widgets look equally important (no visual hierarchy) | Analysis paralysis, users don't know where to focus | "Next Best Action" 2x size of secondary metrics, use color for urgency |
| Empty states are unhelpful ("No data") | New users confused, don't know what to do next | Actionable empty states: "Analyze your first essay" with CTA button |
| Too many deadlines shown (10+ items) | Important deadlines buried in noise | Max 5 deadlines, color-coded urgency, "View all" link for rest |
| No explanation for "Next Best Action" recommendation | Feels arbitrary, users ignore it | Include context: "Applications open in 30 days" |
| Sidebar collapsed state not persisted | User collapses sidebar, refreshes page, sidebar expanded again — frustrating | Persist in localStorage, restore on load |
| Dashboard home doesn't provide value over Scanner as landing page | Users manually navigate to Scanner every time, dashboard ignored | Test with real users: "What's your next step?" answerable in 2 seconds |
| Metrics without context (score with no benchmark) | User sees "65% readiness" but doesn't know if that's good/bad | Show peer average, target benchmark, or trend (up/down from last week) |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Routing**: Dashboard routes defined, but missing `<Outlet />` in DashboardLayout → child routes don't render
- [ ] **Authentication**: Dashboard page renders, but not wrapped in `<RequireVerified>` → accessible to unauthenticated users
- [ ] **Sidebar state**: Collapse/expand works, but state not persisted in localStorage → resets on refresh
- [ ] **Active nav highlighting**: Highlights on click, but breaks on browser back/forward → not using useLocation
- [ ] **Loading states**: Components built, but no skeleton states during data load → blank screen flash
- [ ] **Empty states**: Dashboard shows data, but no design for new users with zero essays → confusing first-run
- [ ] **Responsive units**: Layout looks good on 1920px screen, but uses fixed pixels → breaks at different viewport sizes
- [ ] **Keyboard shortcuts**: Cmd+\ implemented, but not tested with screen readers → accessibility issues
- [ ] **Mock data abstraction**: Dashboard uses mock data, but inline in components → v2 migration requires rewrites
- [ ] **Error boundaries**: Dashboard works with good data, but crashes on API errors → no error handling
- [ ] **Performance**: Dashboard fast with 5 widgets, but re-renders entire tree on interactions → will degrade with more complexity

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Missing `<Outlet />` in layout | **LOW** | Add `<Outlet />` to DashboardLayout, test navigation — 5 min fix |
| Desktop-only with fixed pixels | **HIGH** | Refactor all layout components to use rem/%, add media queries, test at 4+ viewports — 2-3 days |
| Inline mock data across components | **MEDIUM** | Extract to service layer, update all components to use service, test — 1 day |
| Prop drilling for sidebar state | **MEDIUM** | Create SidebarContext, refactor components to use useContext, remove prop passing — 1 day |
| No empty states designed | **LOW** | Design and implement empty states for each widget type, test with new user account — 4 hours |
| Unstable prop references causing re-renders | **MEDIUM** | Identify with React Profiler, add useMemo/useCallback strategically, verify with profiler — 1 day |
| Authentication not enforced | **LOW** | Wrap routes with `<RequireVerified>`, test in incognito — 30 min |
| Skeleton dimensions don't match content | **LOW** | Test with edge cases (long titles, max items), adjust skeleton heights — 2 hours |
| Inconsistent shadcn variants | **LOW** | Audit existing pages, update dashboard components to match — 2 hours |
| Information overload | **MEDIUM** | User research to prioritize, remove 50% of widgets, establish hierarchy — 2 days (includes user testing) |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Missing `<Outlet />` in layout | Phase 1: Routing & Layout | Navigate to Scanner from dashboard — content renders |
| Authentication not enforced | Phase 1: Routing & Layout | Open dashboard in incognito — redirects to login |
| Prop drilling for sidebar state | Phase 1: Routing & Layout | Sidebar toggle works, check code — no prop drilling through >2 levels |
| Desktop-first pixel widths | Phase 2: Dashboard UI | Resize browser to 375px — layout doesn't break (even if not pretty) |
| Information overload | Phase 2: Dashboard UI | User test: identify most important action in <2 seconds |
| No empty states | Phase 2: Dashboard UI | Test with new account (0 essays) — helpful empty states render |
| Inline mock data | Phase 3: Data Integration | Mock data in `src/mocks/`, not in component files |
| Skeleton layout shift | Phase 3: Data Integration | Slow network throttling — no visible jump when content loads |
| No loading states | Phase 3: Data Integration | Navigate between routes — loading indicators appear |
| Massive re-renders | Phase 4: Testing & Polish | React DevTools Profiler — <50 renders per interaction |
| Inconsistent shadcn variants | Phase 4: Testing & Polish | Visual QA — dashboard buttons/cards match Scanner/Workshop styles |
| Keyboard shortcut conflicts | Phase 4: Testing & Polish | Test Cmd+\ with screen reader active — no conflicts |

## Sources

**Dashboard Design Mistakes & Best Practices:**
- Metabase: "Top 5 Dashboard Fails" - https://www.metabase.com/blog/top-5-dashboard-fails
- Domo: "Top 10 Dashboard Design Mistakes" - https://www.domo.com/learn/article/top-10-dashboard-design-mistakes-and-what-to-do-about-them
- UXPin: "Effective Dashboard Design Principles for 2025" - https://www.uxpin.com/studio/blog/dashboard-design-principles/
- Databox: "Bad Dashboard Examples" - https://databox.com/bad-dashboard-examples
- NN/g: "Skeleton Screens 101" - https://www.nngroup.com/articles/skeleton-screens/

**React Router & Layout Integration:**
- Clerk Docs: "React Router Quickstart" - https://clerk.com/docs/react-router/getting-started/quickstart
- Medium: "React Router Common Mistakes and How to Avoid Them" - https://medium.com/@rowsana/react-router-common-mistakes-and-how-to-avoid-them-bc110a6dedfe
- GitHub: "React Router Issue #7301 - Layout Route Path Issues" - https://github.com/remix-run/react-router/issues/7301

**React Performance & Re-renders:**
- Medium: "React Rendering Bottleneck: How I Cut Re-renders by 60%" - https://medium.com/@sosohappy/react-rendering-bottleneck-how-i-cut-re-renders-by-60-in-a-complex-dashboard-ed14d5891c72
- Kent C. Dodds: "One Simple Trick to Optimize React Re-renders" - https://kentcdodds.com/blog/optimize-react-re-renders
- DebugBear: "Optimizing React Performance By Preventing Unnecessary Re-renders" - https://www.debugbear.com/blog/react-rerenders
- BootstrapDash: "What's Slowing Down Your React Dashboard?" - https://www.bootstrapdash.com/blog/react-dashboard-performance

**State Management & Sidebar Patterns:**
- DeveloperWay: "React State Management in 2025: What You Actually Need" - https://www.developerway.com/posts/react-state-management-2025
- DEV Community: "Building a Collapsible Admin Sidebar with React Router + useLocation" - https://dev.to/cristiansifuentes/building-a-collapsible-admin-sidebar-with-react-router-uselocation-pro-patterns-7im
- shadcn/ui: "Sidebar Component Documentation" - https://ui.shadcn.com/docs/components/radix/sidebar

**Desktop-First vs Mobile-First:**
- IshaD: "The State Of Mobile First and Desktop First" - https://ishadeed.com/article/the-state-of-mobile-first-and-desktop-first/
- Softermii: "Mobile First vs Desktop First" - https://www.softermii.com/blog/web-development-mobile-first-or-desktop-first

**Technical Debt & Migration:**
- Medium: "BI Dashboards are Creating a Technical Debt Black Hole" - https://medium.com/@LoriLu/bi-dashboards-are-creating-a-technical-debt-black-hole-31be41ee96f
- ThoughtSpot: "Managing Technical Debt: Going from 12 BI Tools to 1" - https://www.thoughtspot.com/blog/managing-technical-debt-business-intelligence

**shadcn/ui Performance:**
- Medium: "Building a Shadcn Dashboard: What Works, What Breaks, and What to Watch Out For" - https://medium.com/codetodeploy/building-a-shadcn-dashboard-what-works-what-breaks-and-what-to-watch-out-for-26053fb32bbd
- DesignRevision: "Build a Dashboard with shadcn/ui: Complete Guide (2026)" - https://designrevision.com/blog/shadcn-dashboard-tutorial

**Authentication & Protected Routes:**
- Clerk Docs: "Protect Component Reference" - https://clerk.com/docs/react-router/reference/components/control/protect
- DEV Community: "Securing Node.js Express APIs with Clerk and React" - https://dev.to/clerk/securing-nodejs-express-apis-with-clerk-and-react-ook

**Next Best Action & Recommendation Systems:**
- Ambiata: "Next-Best-Action Recommendation" - https://ambiata.com/blog/2020-09-21-next-best-action-concepts/
- Salesforce: "Analyze Next Best Action Usage with Recommendation Metrics" - https://help.salesforce.com/s/articleView?id=release-notes.rn_forcecom_nba_metrics.htm

**UI Anti-Patterns:**
- UI-Patterns: "User Interface Anti-Patterns" - https://ui-patterns.com/blog/User-Interface-AntiPatterns
- ICS: "Anti-Patterns of User Experience Design" - https://www.ics.com/blog/anti-patterns-user-experience-design
- Pencil & Paper: "UX Pattern Analysis: Data Dashboards" - https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards

---
*Pitfalls research for: Dashboard/Command Center Home Pages for Existing Applications*
*Researched: 2026-02-23*
*Confidence: HIGH — verified through official documentation (Clerk, React Router, shadcn/ui), performance case studies, and established UX research (NN/g, ICS)*
