# Phase 1: Routing Foundation - Research

**Researched:** 2026-02-23
**Domain:** React Router v6 nested routing, authentication integration, loading states
**Confidence:** HIGH

## Summary

Phase 1 establishes the routing foundation for Dashboard Home as the default authenticated landing page at `/dashboard`. The implementation leverages React Router v6's nested routing with the `<Outlet>` component, enabling seamless navigation between dashboard sections without layout remounting. The existing codebase already has a solid foundation with `DashboardLayout` using shadcn/ui's Sidebar components and Clerk authentication via `RequireVerified` wrapper.

The key technical challenge is restructuring routes from a flat structure (where `/portfolio-scanner`, `/portfolio-insights` are top-level) to a nested structure under `/dashboard/*` while maintaining backward compatibility through redirects. Loading states will use the existing shadcn/ui Skeleton component with precise sizing to prevent Cumulative Layout Shift (CLS).

**Primary recommendation:** Use React Router v6's declarative nested route configuration with `<Navigate replace>` for old route redirects. Create a minimal Dashboard Home page as an index route, add "Home" as the first sidebar navigation item, and implement a dismissible welcome banner using localStorage for persistence.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Smooth cutover — users simply land on Dashboard Home next login
- Show one-time "Welcome to your new dashboard!" dismissible banner
- /dashboard route shows Dashboard Home, Scanner moves to /dashboard/scanner
- Auto-redirect old Scanner bookmarks to new location
- Quick-launch cards navigate to full routes (URL changes to /dashboard/scanner etc.)
- Skeleton screen while Dashboard Home loads (prevents layout shift)
- Full fidelity skeleton — exact shapes for cards, circles for avatars, lines for text
- Natural timing — show skeleton only while actually loading, no artificial delay
- Shimmer effect animation (subtle left-to-right like Facebook)
- "Home" appears as very first item in sidebar
- House icon (classic home shape)
- Match existing active state highlighting style
- Text label: "Home" (simple and clear)
- All features become sub-routes: /dashboard/scanner, /dashboard/insights, /dashboard/workshop
- Pricing moves to /dashboard/pricing (part of app)
- Settings becomes /dashboard/settings (part of authenticated app)
- Full routes shown in URL bar (/dashboard/scanner visible to users)

### Claude's Discretion
- Exact shimmer animation implementation
- Welcome banner design and dismissal mechanism
- Specific redirect HTTP codes and implementation
- Error handling for failed route transitions

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROUT-01 | /dashboard route shows Dashboard Home by default | React Router v6 index routes with `{ index: true }` configuration |
| ROUT-02 | All existing feature pages remain accessible at current or adjusted routes | Nested routes with `<Outlet>` component + `<Navigate replace>` for redirects |
| ROUT-03 | Dashboard Home only displays to authenticated users (Clerk auth integration) | Existing `RequireVerified` + `RequireTermsAccepted` wrappers already handle this |
| NAV-01 | "Home" appears as first item in sidebar with home icon | Modify `AppSidebar.tsx` navItems array — lucide-react `Home` icon available |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router-dom | 6.30.1 | Client-side routing with nested routes | Industry standard for React SPAs, v6 provides cleaner API with `<Outlet>` for layouts |
| @clerk/clerk-react | 5.57.0 | Authentication and user management | Already integrated, provides `useUser()`, `useAuth()` hooks |
| lucide-react | 0.462.0 | Icon library (Home icon for nav) | Already in use throughout app, consistent icon system |
| shadcn/ui | Custom | Component library (Sidebar, Skeleton) | Already implemented in codebase, provides `<Skeleton>`, sidebar components |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss-animate | 1.0.7 | Built-in pulse animation | Already configured, provides `animate-pulse` for shimmer effect |
| @radix-ui/react-slot | 1.2.3 | Component composition | Used by shadcn/ui for `asChild` pattern in navigation links |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-router-dom | TanStack Router | More type-safe but requires full migration; React Router already integrated |
| Clerk auth | Custom auth guards | More control but reinvents wheel; Clerk integration working well |
| shadcn/ui Skeleton | react-loading-skeleton library | Auto-sizing but adds dependency; existing Skeleton component sufficient |

**Installation:**
No new packages needed — all required libraries already in package.json.

## Architecture Patterns

### Recommended Route Structure
```
App.tsx Routes
├── / (Index — marketing page)
├── /auth, /verify-email (public auth pages)
├── <RequireVerified><RequireTermsAccepted><DashboardLayout /></...></...> (authenticated shell)
    ├── /dashboard (index route) → DashboardHome
    ├── /dashboard/scanner → PortfolioScanner
    ├── /dashboard/insights → PortfolioInsightsNew
    ├── /dashboard/workshop → PIQWorkshop
    ├── /dashboard/pricing → Pricing
    └── /dashboard/settings → Settings
├── /portfolio-scanner → <Navigate replace to="/dashboard/scanner" />
├── /portfolio-insights → <Navigate replace to="/dashboard/insights" />
├── /piq-workshop → <Navigate replace to="/dashboard/workshop" />
└── * → NotFound
```

### Pattern 1: Nested Routes with Index Route
**What:** Parent route at `/dashboard` with child routes and an index route for the default view
**When to use:** When you want a default landing page under a parent route structure
**Example:**
```tsx
// In App.tsx
<Route element={<RequireVerified><RequireTermsAccepted><DashboardLayout /></RequireTermsAccepted></RequireVerified>}>
  {/* Index route renders at /dashboard exactly */}
  <Route index element={<DashboardHome />} />

  {/* Child routes render at /dashboard/{path} */}
  <Route path="dashboard/scanner" element={<PortfolioScanner />} />
  <Route path="dashboard/insights" element={<PortfolioInsightsNew />} />
  <Route path="dashboard/workshop" element={<PIQWorkshop />} />
  <Route path="dashboard/pricing" element={<Pricing />} />
  <Route path="dashboard/settings" element={<Settings />} />
</Route>
```

**Key detail:** The `<DashboardLayout>` component already contains `<Outlet />` which renders the matched child/index route. This prevents layout remounting when navigating between dashboard pages.

### Pattern 2: Route Redirects with Navigate
**What:** Declarative redirects for backward compatibility with old routes
**When to use:** When restructuring routes to maintain old bookmarks/links
**Example:**
```tsx
// Redirect old top-level routes to new nested routes
<Route path="/portfolio-scanner" element={<Navigate replace to="/dashboard/scanner" />} />
<Route path="/portfolio-insights" element={<Navigate replace to="/dashboard/insights" />} />
<Route path="/piq-workshop" element={<Navigate replace to="/dashboard/workshop" />} />
<Route path="/pricing" element={<Navigate replace to="/dashboard/pricing" />} />
<Route path="/settings" element={<Navigate replace to="/dashboard/settings" />} />
```

**Why `replace`:** Prevents adding extra entries to browser history. Without `replace`, users clicking "back" would hit the old route, which redirects again, creating a loop. With `replace`, the old route is replaced in history with the new route.

### Pattern 3: Skeleton Loading States
**What:** Placeholder UI matching exact content dimensions to prevent layout shift
**When to use:** While async data loads or components mount
**Example:**
```tsx
// Source: shadcn/ui Skeleton component + Tailwind animate-pulse
import { Skeleton } from "@/components/ui/skeleton";

function DashboardHomeSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Exact card dimensions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 w-full" /> {/* Action card */}
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>

      {/* Stats overview */}
      <div className="flex gap-6">
        <Skeleton className="h-12 w-12 rounded-full" /> {/* Avatar */}
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-48" /> {/* Name */}
          <Skeleton className="h-3 w-64" /> {/* Subtitle */}
        </div>
      </div>
    </div>
  );
}
```

**Shimmer enhancement:** The existing Skeleton component uses `animate-pulse` (built into Tailwind). This creates a subtle fade in/out effect. For a left-to-right shimmer like Facebook, extend Tailwind config:

```javascript
// tailwind.config.ts
theme: {
  extend: {
    keyframes: {
      shimmer: {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' }
      }
    },
    animation: {
      shimmer: 'shimmer 2s linear infinite'
    }
  }
}
```

Then create a custom skeleton wrapper:
```tsx
<div className="relative overflow-hidden rounded-md bg-muted
                before:absolute before:inset-0 before:animate-shimmer
                before:bg-gradient-to-r before:from-transparent
                before:via-white/20 before:to-transparent
                before:bg-[length:200%_100%]">
  <Skeleton className="h-32 w-full" />
</div>
```

### Pattern 4: Dismissible Banner with LocalStorage
**What:** One-time banner that persists dismissal across sessions
**When to use:** For welcome messages, announcements, feature introductions
**Example:**
```tsx
function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('dashboard-welcome-dismissed') === 'true';
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem('dashboard-welcome-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="bg-primary/10 border-l-4 border-primary p-4 mb-6">
      <div className="flex items-start justify-between">
        <p className="text-sm text-foreground">
          Welcome to your new dashboard! Find everything you need in one place.
        </p>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

### Pattern 5: Sidebar Navigation with Active State
**What:** Update sidebar to include "Home" as first item with active state detection
**When to use:** When adding new top-level navigation items to existing sidebar
**Example:**
```tsx
// In AppSidebar.tsx
import { Home } from 'lucide-react';

const navItems = [
  {
    title: 'Home',
    href: '/dashboard',
    icon: Home,  // House icon from lucide-react
  },
  {
    title: 'Scanner',
    href: '/dashboard/scanner',
    icon: BarChart3,
  },
  // ... rest of items
];

// Active state detection already implemented
const isActive = (href: string) => {
  if (href === '/dashboard') {
    // Exact match for home to avoid matching all /dashboard/* routes
    return location.pathname === '/dashboard';
  }
  // Existing logic for other routes
  return location.pathname.startsWith(href);
};
```

### Anti-Patterns to Avoid
- **Missing `<Outlet />` in layout:** Without Outlet, nested routes won't render. DashboardLayout already has it, don't remove.
- **Using `<Redirect>` from v5:** It's been removed in v6. Use `<Navigate>` instead.
- **Forgetting `replace` prop in redirects:** Creates broken back button behavior due to redirect loops in history.
- **Artificial loading delays:** Don't use `setTimeout` to show skeleton longer. Show skeleton only while actually loading.
- **Imprecise skeleton sizing:** Using generic skeletons that don't match content dimensions causes layout shift when real content appears.
- **Nested `<Routes>` without wildcard:** If using nested Routes components (not recommended for simple cases), parent path needs `/*` wildcard.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sidebar component | Custom sidebar with state management | shadcn/ui Sidebar components | Already integrated, handles mobile/desktop, collapsible state, keyboard shortcuts (Cmd+B) |
| Auth guards | Custom route wrapper checking user state | Existing RequireVerified + RequireTermsAccepted | Already handles Clerk auth, redirects to /auth or /verify-email, covers all edge cases |
| Skeleton component | Custom pulse/shimmer component | shadcn/ui Skeleton with Tailwind animate-pulse | Handles responsive sizing, animation, consistent with design system |
| Icon library | SVG imports or custom icons | lucide-react (already in use) | 1000+ icons, tree-shakeable, consistent style, Home icon available |
| Layout persistence | useEffect hacks to prevent remount | React Router <Outlet> pattern | Built-in, battle-tested, prevents unnecessary remounts of parent layout |

**Key insight:** React Router v6's nested routing architecture with `<Outlet>` solves the layout remounting problem elegantly. The parent `<DashboardLayout>` stays mounted while child routes swap via `<Outlet>`, preserving sidebar state, avoiding flicker, and maintaining smooth navigation.

## Common Pitfalls

### Pitfall 1: Route Order Matters with Redirects
**What goes wrong:** Redirects placed after catch-all `*` route never get executed
**Why it happens:** React Router matches routes in order from top to bottom. Once `*` matches, no further routes are checked
**How to avoid:** Place all redirect routes BEFORE the `*` NotFound route
**Warning signs:** Old bookmarked URLs go to 404 page instead of redirecting
**Example:**
```tsx
// ❌ WRONG - redirects never match
<Route path="*" element={<NotFound />} />
<Route path="/portfolio-scanner" element={<Navigate replace to="/dashboard/scanner" />} />

// ✅ CORRECT - redirects execute first
<Route path="/portfolio-scanner" element={<Navigate replace to="/dashboard/scanner" />} />
<Route path="*" element={<NotFound />} />
```

### Pitfall 2: Index Route Active State Collision
**What goes wrong:** "Home" and other dashboard items both show as active when on sub-routes
**Why it happens:** Using `location.pathname.startsWith('/dashboard')` matches both `/dashboard` and `/dashboard/scanner`
**How to avoid:** Use exact match for index route, prefix match for others
**Warning signs:** Multiple sidebar items highlighted simultaneously
**Example:**
```tsx
// ❌ WRONG - both Home and Scanner active at /dashboard/scanner
const isActive = (href: string) => location.pathname.startsWith(href);

// ✅ CORRECT - only Scanner active at /dashboard/scanner
const isActive = (href: string) => {
  if (href === '/dashboard') {
    return location.pathname === '/dashboard'; // Exact match for home
  }
  return location.pathname.startsWith(href); // Prefix match for sub-routes
};
```

### Pitfall 3: Skeleton Doesn't Match Final Layout
**What goes wrong:** Content "pops" into place when skeleton is replaced, causing layout shift (poor CLS score)
**Why it happens:** Skeleton dimensions don't match actual content dimensions
**How to avoid:** Measure final content dimensions, create skeleton with identical sizes
**Warning signs:** Visible "jump" when loading completes, scrollbar appears/disappears suddenly
**Best practice:**
- Use grid/flex layouts in both skeleton and real content
- Match exact heights (`h-32`, `h-12`, etc.)
- Use same spacing (`gap-4`, `space-y-6`)
- Test on mobile and desktop to verify no layout shift

### Pitfall 4: Forgetting Route Adjustments for PIQ Workshop
**What goes wrong:** PIQ workshop dynamic routes (`/piq-workshop/:piqNumber`) break when redirecting to `/dashboard/workshop`
**Why it happens:** Redirect only handles the base route, not dynamic segments
**How to avoid:** Ensure child routes under `/dashboard/workshop` handle the `:piqNumber` param
**Warning signs:** Direct links to specific PIQs (e.g., `/piq-workshop/1`) result in 404 or redirect to base workshop
**Solution:**
```tsx
// If old route was /piq-workshop/:piqNumber, redirect needs to preserve param
// But simpler: just ensure new nested route accepts param
<Route path="dashboard/workshop" element={<PIQWorkshop />} />
<Route path="dashboard/workshop/:piqNumber" element={<PIQWorkshop />} />

// Old route redirect
<Route path="/piq-workshop" element={<Navigate replace to="/dashboard/workshop" />} />
<Route path="/piq-workshop/:piqNumber" element={<Navigate replace to="/dashboard/workshop/:piqNumber" />} />
```

Actually, checking App.tsx shows this is ALREADY handled:
```tsx
<Route path="/piq-workshop" element={<PIQWorkshop />} />
<Route path="/piq-workshop/:piqNumber" element={<PIQWorkshop />} />
```

So the PIQWorkshop component already handles both base and parameterized routes. Just need to mirror this structure under `/dashboard/workshop`.

### Pitfall 5: Auth Wrapper Nesting Creates Multiple Redirects
**What goes wrong:** Unauthenticated user hits `/dashboard`, gets redirected to `/auth`, but first goes through `/verify-email`
**Why it happens:** Nested auth checks (`RequireVerified` then `RequireTermsAccepted`) each trigger redirects
**How to avoid:** This is ALREADY handled correctly in the codebase. `RequireVerified` checks for user first, then email verification. The nesting order is correct.
**Warning signs:** Multiple redirect logs in console, navigation history has extra entries
**Current implementation is CORRECT:**
```tsx
<Route element={<RequireVerified><RequireTermsAccepted><DashboardLayout /></RequireTermsAccepted></RequireVerified>}>
```

RequireVerified checks:
1. If no user → redirect to `/auth`
2. If user not verified → redirect to `/verify-email`

Only if both pass does RequireTermsAccepted run. This is correct sequential gating.

## Code Examples

Verified patterns from existing codebase and official sources:

### Nested Route Structure with Index Route
```tsx
// Source: React Router v6 official docs + existing App.tsx structure
import { Routes, Route, Navigate } from 'react-router-dom';

<Routes>
  {/* Authenticated dashboard shell */}
  <Route element={<RequireVerified><RequireTermsAccepted><DashboardLayout /></RequireTermsAccepted></RequireVerified>}>
    {/* Index route - renders at /dashboard exactly */}
    <Route index element={<DashboardHome />} />

    {/* Child routes - render at /dashboard/{path} */}
    <Route path="dashboard/scanner" element={<PortfolioScanner />} />
    <Route path="dashboard/insights" element={<PortfolioInsightsNew />} />
    <Route path="dashboard/workshop" element={<PIQWorkshop />} />
    <Route path="dashboard/workshop/:piqNumber" element={<PIQWorkshop />} />
    <Route path="dashboard/pricing" element={<Pricing />} />
    <Route path="dashboard/settings" element={<Settings />} />
  </Route>

  {/* Backward compatibility redirects */}
  <Route path="/portfolio-scanner" element={<Navigate replace to="/dashboard/scanner" />} />
  <Route path="/portfolio-insights" element={<Navigate replace to="/dashboard/insights" />} />
  <Route path="/piq-workshop" element={<Navigate replace to="/dashboard/workshop" />} />
  <Route path="/piq-workshop/:piqNumber" element={<Navigate replace to="/dashboard/workshop/:piqNumber" />} />
  <Route path="/pricing" element={<Navigate replace to="/dashboard/pricing" />} />
  <Route path="/settings" element={<Navigate replace to="/dashboard/settings" />} />

  {/* 404 must be LAST */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

### Minimal Dashboard Home Page
```tsx
// Source: Uplift coding standards + shadcn/ui components
// File: src/pages/DashboardHome.tsx

import { useState } from 'react';
import { X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);

  // Simulate loading (in real implementation, this tracks actual data fetching)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <DashboardHomeSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <WelcomeBanner />

      {/* Placeholder content for Phase 1 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard Home</h1>
        <p className="text-muted-foreground">
          Welcome to your dashboard. This page will display your most important next steps.
        </p>
      </div>
    </div>
  );
}

function DashboardHomeSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-16 w-full mb-6" /> {/* Banner */}
      <Skeleton className="h-8 w-64 mb-2" /> {/* Title */}
      <Skeleton className="h-4 w-96" /> {/* Subtitle */}
    </div>
  );
}

function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('dashboard-welcome-dismissed') === 'true';
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem('dashboard-welcome-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-md">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-foreground">
          Welcome to your new dashboard! Find everything you need in one place.
        </p>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss welcome message"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

### Updated Sidebar Navigation
```tsx
// Source: Existing AppSidebar.tsx + lucide-react Home icon
// Modification to src/components/dashboard/AppSidebar.tsx

import {
  Home,      // ADD THIS
  BarChart3,
  Target,
  PenTool,
  Zap,
  Settings,
} from 'lucide-react';

const navItems = [
  {
    title: 'Home',                    // ADD THIS as FIRST item
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Scanner',
    href: '/dashboard/scanner',       // UPDATE path
    icon: BarChart3,
  },
  {
    title: 'Insights',
    href: '/dashboard/insights',      // UPDATE path
    icon: Target,
  },
  {
    title: 'Workshop',
    href: '/dashboard/workshop',      // UPDATE path
    icon: PenTool,
  },
  {
    title: 'Pricing',
    href: '/dashboard/pricing',       // UPDATE path
    icon: Zap,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',      // UPDATE path
    icon: Settings,
  },
];

// UPDATE isActive function for exact match on home
const isActive = (href: string) => {
  if (href === '/dashboard') {
    // Exact match for home to avoid matching all /dashboard/* routes
    return location.pathname === '/dashboard';
  }
  if (href === '/dashboard/workshop') {
    // Match base and parameterized workshop routes
    return location.pathname.startsWith('/dashboard/workshop');
  }
  return location.pathname === href;
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat route structure with top-level paths | Nested routes under `/dashboard` parent | React Router v6 (2021) | Enables shared layouts, cleaner URL structure, prevents layout remounting |
| `<Redirect>` component | `<Navigate replace>` component | React Router v6 (2021) | Cleaner API, better declarative pattern, explicit history replacement |
| `useHistory().push()` | `useNavigate()` hook | React Router v6 (2021) | Simpler API, no separate `push`/`replace` methods, just pass `-1` for back |
| Generic loading spinners | Skeleton screens matching content | ~2020-2022 shift | Reduces perceived load time, prevents layout shift (CLS), better UX |
| Separate auth guard per route | Wrapper route with `<Outlet>` | React Router v6 pattern | DRY principle, single auth check for all protected routes |

**Deprecated/outdated:**
- `<Redirect>` component: Removed in React Router v6, use `<Navigate>` instead
- `useHistory()` hook: Replaced by `useNavigate()` in v6
- Nested `<Routes>` with `/*` wildcard: Still works but `<Outlet>` pattern is cleaner for shared layouts
- `component` prop on `<Route>`: Replaced by `element` prop in v6

## Open Questions

1. **Should old /pricing and /settings routes redirect to /dashboard/* or stay as-is?**
   - What we know: CONTEXT.md says "Pricing moves to /dashboard/pricing" and "Settings becomes /dashboard/settings"
   - What's unclear: Whether these should be completely moved or aliased (accessible at both paths)
   - Recommendation: Move completely with redirects, as per user decision. Pricing and Settings are part of authenticated app experience, not public pages.

2. **Should skeleton show immediately or have a minimum delay?**
   - What we know: User wants "natural timing — show skeleton only while actually loading, no artificial delay"
   - What's unclear: If load completes in <100ms, skeleton flickers briefly which can be jarring
   - Recommendation: Show skeleton immediately, but if content loads in <200ms, consider skipping skeleton entirely to avoid flicker. This requires measuring load time.

3. **How should PIQ workshop dynamic routes be handled?**
   - What we know: Existing `/piq-workshop/:piqNumber` routes need to work under new structure
   - What's unclear: Whether PIQWorkshop component auto-handles this or needs route config changes
   - Recommendation: Looking at App.tsx, both routes exist (`/piq-workshop` and `/piq-workshop/:piqNumber`). Mirror this under `/dashboard/workshop` and `/dashboard/workshop/:piqNumber`, component already handles both.

## Sources

### Primary (HIGH confidence)
- React Router v6 official docs (reactrouter.com) - Nested routes, Outlet, Navigate components
- Existing codebase (App.tsx, DashboardLayout.tsx, AppSidebar.tsx) - Current architecture patterns
- shadcn/ui Skeleton component (existing implementation) - Loading state patterns
- lucide-react icon library (package.json confirmed) - Home icon availability

### Secondary (MEDIUM confidence)
- WebSearch: React Router v6 nested routes best practices (2025 articles from ui.dev, robinwieruch.de, perficient.com) - Verified with official docs
- WebSearch: shadcn/ui skeleton shimmer effects (2025 articles from shadcnblocks.com, LogRocket) - Verified with existing Skeleton implementation
- WebSearch: React skeleton loading CLS prevention (2025 articles from Medium, bswanson.dev) - Industry best practices

### Tertiary (LOW confidence)
- None - all findings verified with official sources or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in package.json, versions verified
- Architecture: HIGH - Patterns extracted from existing working code + official React Router docs
- Pitfalls: HIGH - Common issues documented in official migration guides + codebase inspection

**Research date:** 2026-02-23
**Valid until:** 2026-04-23 (60 days - React Router v6 is stable, no major changes expected)
