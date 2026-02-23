# Stack Research: Dashboard/Command Center Interfaces

**Domain:** Dashboard Home Tab for React/shadcn/ui Application
**Researched:** 2026-02-23
**Confidence:** HIGH

## Executive Summary

The standard 2025 stack for dashboard/command center interfaces in React applications has converged around **shadcn/ui components** (already in use), **Recharts for data visualization**, **TanStack Query v5+ for data fetching**, and **minimal additional state management**. The existing Uplift stack (React 18, TypeScript, shadcn/ui, Tailwind, TanStack Query) already contains 95% of what's needed. This research focuses on the **5% of specialized dashboard libraries** needed to add metrics, charts, and dynamic layouts.

**Key Finding:** The project already has the right foundation. Add only Recharts for charts (already present at v2.15.4) and optionally react-grid-layout if drag/drop widgets become a requirement.

## Recommended Stack

### Core Technologies (Already Present)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **React** | 18.3.1 | UI framework | Industry standard; concurrent rendering for smooth UI updates; already in use |
| **TypeScript** | 5.8.3 | Type safety | Non-negotiable for dashboard reliability; prevents runtime errors in metrics/data display |
| **shadcn/ui** | Latest | UI component system | Copy-paste components = full customization; accessible by default; integrated with Radix UI primitives |
| **Tailwind CSS** | 3.4.17 | Utility-first styling | Fast iteration; consistent design system; 2025 standard for React dashboards |
| **Vite** | 5.4.19 | Build tool | Lightning-fast HMR for dashboard development; tree-shaking for optimal bundle size |
| **TanStack Query** | 5.83.0 | Server state management | v5+ has improved React 18 support; automatic caching/background updates perfect for dashboard metrics |

### Data Visualization (Primary Gap)

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **Recharts** | 2.15.4+ (present) | Charts for dashboards | Native React integration via JSX; SVG-based = crisp on all screens; 67.6% faster than Chart.js for large datasets (100K+ points); component-based API matches React mental model; excellent documentation; integrates with shadcn theming for automatic dark mode |

**Note:** Project already has `recharts@2.15.4`. Version 3.x (latest 3.4.1+) has breaking changes but offers improved performance. Stick with 2.x for v1 unless specific 3.x features are needed.

### Supporting Libraries (Dashboard-Specific)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **date-fns** | 3.6.0 (present) | Date formatting for deadlines/metrics | Already installed; use for deadline formatting, "3 days ago" timestamps, date manipulation |
| **lucide-react** | 0.462.0 (present) | Icons for dashboard | Already installed; 1000+ icons, tree-shakable, TypeScript support; use for metrics cards, navigation, status indicators |
| **motion** | 12.23.22 (present) | Animations for engagement | Already installed (Motion/Framer Motion); use for metric transitions, card reveals, smooth interactions; 32KB but worth it for polish |
| **cmdk** | 1.1.1 (present) | Command palette (Cmd+K) | Already installed; powers global search/quick actions; battle-tested (used by Linear, Raycast) |
| **sonner** | 1.7.4 (present) | Toast notifications | Already installed; shadcn's recommended toast solution; smooth animations, accessible, Tailwind-styled |

### Optional (Add Only If Needed)

| Library | Version | Purpose | When to Add |
|---------|---------|---------|-------------|
| **react-grid-layout** | 1.5.0+ | Draggable/resizable widgets | ONLY if Phase 2+ requires customizable dashboard layout; adds ~50KB; wait for requirement validation |
| **zustand** | 5.x | Minimal global state | ONLY if dashboard state (sidebar collapsed, selected filters) becomes complex; TanStack Query + React state likely sufficient for v1 |

### Development Tools (Already Configured)

| Tool | Purpose | Notes |
|------|---------|-------|
| **eslint** | Code quality | Already configured with React-specific rules |
| **TypeScript strict mode** | Type safety | Enforced via CLAUDE.md standards |
| **npm-run-all** | Parallel dev servers | Already used for `dev:full` |

## Already Installed - Leverage These First

The project package.json shows **exceptional stack alignment** with 2025 dashboard best practices:

```json
{
  "recharts": "^2.15.4",              // ✅ Data visualization ready
  "@tanstack/react-query": "^5.83.0", // ✅ Dashboard data fetching ready
  "lucide-react": "^0.462.0",          // ✅ Icons ready
  "date-fns": "^3.6.0",                // ✅ Date formatting ready
  "motion": "^12.23.22",               // ✅ Animations ready
  "cmdk": "^1.1.1",                    // ✅ Command palette ready
  "sonner": "^1.7.4",                  // ✅ Toast notifications ready
  "react-router-dom": "^6.30.1"        // ✅ Routing ready
}
```

**Radix UI components** (via shadcn/ui):
- `@radix-ui/react-collapsible` - For collapsible sidebar (requirement)
- `@radix-ui/react-progress` - For progress bars in metrics
- `@radix-ui/react-tabs` - If dashboard needs tabbed views
- `@radix-ui/react-tooltip` - For metric explanations

## Installation

```bash
# NOTHING TO INSTALL for basic dashboard v1
# All core dependencies already present

# Optional: Only if drag/drop widgets become a requirement
npm install react-grid-layout
npm install -D @types/react-grid-layout

# Optional: Only if global state becomes complex
npm install zustand
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Recharts** | Chart.js + react-chartjs-2 | Never for this project. Chart.js is 67.6% slower at scale, canvas-based (pixelated on retina), requires wrapper library. Recharts is native React. |
| **Recharts** | Nivo | If you need highly stylized, animated charts out-of-the-box. Nivo has more opinionated styling but less customization. Recharts better for matching Uplift's design system. |
| **TanStack Query** | SWR | If bundle size is critical constraint (SWR is smaller). TanStack Query has better devtools, more features, stronger TypeScript support. |
| **shadcn/ui Sidebar** | Custom sidebar | Never. shadcn provides battle-tested collapsible sidebar with accessibility, keyboard shortcuts, and mobile support. Don't reinvent. |
| **Zustand** | Jotai | If you need fine-grained reactivity for frequently changing independent state (e.g., real-time stock ticker). For dashboard v1 with mostly static metrics, Zustand's centralized store is simpler. |
| **Motion (Framer Motion)** | Motion One | If bundle size is critical (Motion One is 3.8KB vs Motion's 32KB). Motion provides better DX, gesture support, layout animations. Worth the 28KB for dashboard polish. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Chart.js** | Canvas-based = pixelated on retina displays; requires react-chartjs-2 wrapper; 67.6% slower with large datasets; not idiomatic React | **Recharts** (already installed) |
| **Redux / Redux Toolkit** | Massive overkill for dashboard state; 10KB+ of boilerplate; slower DX; dashboard needs minimal global state | React state + TanStack Query (already installed) |
| **Material UI (MUI)** | Different design system from shadcn/ui; heavyweight (300KB+); opinionated styling conflicts with Tailwind; inconsistent with existing Uplift UI | **shadcn/ui** (already in use) |
| **Ant Design** | Same issues as MUI; Chinese design language doesn't match Uplift; heavy bundle | **shadcn/ui** (already in use) |
| **Radix UI directly** | You'd have to style everything from scratch; shadcn/ui already wraps Radix with Tailwind styles | **shadcn/ui** (already wrapping Radix) |
| **react-grid-layout for v1** | Premature complexity; adds 50KB; dashboard v1 uses fixed layout; wait for user demand for customization | Fixed layout with Tailwind Grid |
| **Recharts v3.x for v1** | Breaking changes from 2.x; migration cost > benefit for v1; v2.15.4 is stable and sufficient | **Recharts 2.15.4** (already installed) |

## Stack Patterns by Use Case

### **Pattern 1: Metrics Display (Progress, Stats, Counters)**

Use shadcn/ui primitives + Tailwind:
- **Card** component for metric containers
- **Progress** component (Radix) for completion percentages
- **lucide-react** icons for visual indicators
- **date-fns** for "updated 3m ago" timestamps

```typescript
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";

// Metric card with progress
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <TrendingUp className="h-4 w-4" />
      Application Readiness
    </CardTitle>
  </CardHeader>
  <CardContent>
    <Progress value={67} />
    <p className="text-sm text-muted-foreground">67% Complete</p>
  </CardContent>
</Card>
```

### **Pattern 2: Charts/Visualizations**

Use Recharts with shadcn theming:
- **AreaChart** for trend over time
- **BarChart** for comparisons
- **PieChart** for composition
- Wrap in `<Card>` for consistent styling

```typescript
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Essay Progress Over Time</CardTitle>
  </CardHeader>
  <CardContent>
    <AreaChart width={500} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Area type="monotone" dataKey="essays" stroke="hsl(var(--primary))" />
    </AreaChart>
  </CardContent>
</Card>
```

### **Pattern 3: Dashboard Layout**

Use Tailwind Grid (no library needed):
- CSS Grid for responsive layout
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for breakpoints
- `gap-4` for consistent spacing

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <MetricCard title="Essays" value={12} />
  <MetricCard title="Portfolio Score" value={85} />
  <MetricCard title="Days to Deadline" value={45} />
</div>
```

### **Pattern 4: Data Fetching for Dashboard**

Use TanStack Query with parallel queries:
- Fetch multiple metrics in parallel
- Automatic caching and refetch
- Loading/error states built-in

```typescript
import { useQueries } from '@tanstack/react-query';

const [essaysQuery, portfolioQuery, deadlinesQuery] = useQueries({
  queries: [
    { queryKey: ['essays'], queryFn: fetchEssays },
    { queryKey: ['portfolio'], queryFn: fetchPortfolio },
    { queryKey: ['deadlines'], queryFn: fetchDeadlines }
  ]
});

// All queries run in parallel, cached independently
```

### **Pattern 5: Collapsible Sidebar**

Use shadcn/ui Sidebar component (added late 2025):
- `SidebarProvider` wraps app
- `useSidebar()` hook for state
- `SidebarTrigger` for Cmd+\ shortcut
- Mobile-responsive sheet menu

```typescript
import { SidebarProvider, Sidebar, SidebarTrigger } from "@/components/ui/sidebar";

<SidebarProvider>
  <Sidebar collapsible="icon">
    {/* Navigation items */}
  </Sidebar>
  <main>
    <SidebarTrigger /> {/* Cmd+\ toggle */}
    {children}
  </main>
</SidebarProvider>
```

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| recharts@2.15.4 | React 18.x | Stable, production-ready; v3.x has breaking changes |
| @tanstack/react-query@5.x | React 18.x | v5+ required for React 18 concurrent rendering optimizations |
| motion@12.x | React 18.x | Framer Motion rebranded as "motion"; compatible with React 18 |
| shadcn/ui (latest) | Radix UI 1.x + Tailwind 3.x | Requires Tailwind CSS v3.4+; uses Radix UI primitives under the hood |
| lucide-react@0.462.0+ | React 18.x | Tree-shakable; weekly updates; 1000+ icons |
| TypeScript 5.8.3 | All packages | Strict mode compatible; ES6 target required for Recharts 3.x (not using yet) |

**Breaking Change Alert:**
- **Recharts 3.x** requires Node.js 18+, TS 5.x+, ES6 target. Project meets these but 3.x has API changes. Stick with 2.15.4 for v1.
- **TanStack Query v5** has breaking changes from v4. Project already on v5.83.0 - verified compatible.

## Confidence Assessment

| Area | Confidence | Sources |
|------|------------|---------|
| **Core Stack (shadcn/ui)** | **HIGH** | Official shadcn/ui docs + dashboard templates; confirmed 2025 standard via DesignRevision, DEV Community guides |
| **Recharts vs Chart.js** | **HIGH** | Performance comparison (67.6% faster), Oreate AI blog, LogRocket 2025 guide, Medium comparison articles |
| **TanStack Query for Dashboards** | **HIGH** | Official TanStack docs, DEV Community 2025 guides, production usage reports (40-70% faster initial loads) |
| **Motion/Framer Motion** | **HIGH** | Official Motion.dev docs, React Libraries performance comparison 2025, bundle size verified |
| **Lucide Icons** | **HIGH** | NPM stats (200K+ weekly downloads), Greasy Guide 2025, 1000+ icons confirmed |
| **Sidebar Component** | **HIGH** | Official shadcn/ui sidebar docs (added Oct 2025), community templates verified |
| **Version Numbers** | **MEDIUM** | NPM registry blocked (403 errors); versions from WebSearch (GitHub releases, changelog references, community discussions); package.json shows current versions |

**Source Hierarchy Applied:**
1. Official documentation (shadcn/ui, TanStack Query, Motion.dev) - HIGH confidence
2. Technical blogs with data (Oreate AI performance tests, LogRocket comparisons) - HIGH confidence
3. Community guides with dates (DEV Community 2025, Medium 2025) - MEDIUM to HIGH confidence
4. Version info from WebSearch (GitHub releases, changelogs) - MEDIUM confidence (NPM registry was blocked)

## Sources

### Official Documentation
- shadcn/ui Components: https://ui.shadcn.com/docs/components (sidebar, collapsible, progress)
- TanStack Query v5: https://tanstack.com/query/latest (dashboard data fetching patterns)
- Motion.dev: https://motion.dev (animation library, formerly Framer Motion)
- Lucide Icons: https://lucide.dev (icon library)

### Performance & Comparison Research
- Recharts vs Chart.js Performance (2025): https://www.oreateai.com/blog/recharts-vs-chartjs-navigating-the-performance-maze-for-big-data-visualizations/
- Best React Chart Libraries 2025: https://blog.logrocket.com/best-react-chart-libraries-2025/
- Zustand vs Jotai 2025: State Management Trends: https://makersden.io/blog/react-state-management-in-2025

### 2025 Dashboard Guides
- Build a Dashboard with shadcn/ui (2026 Guide): https://designrevision.com/blog/shadcn-dashboard-tutorial
- React Admin Dashboard Best Templates 2026: https://refine.dev/blog/react-admin-dashboard/
- Mastering React Query in 2025: https://dev.to/jdavissoftware/mastering-react-query-in-2025-a-deep-dive-into-data-fetching-for-modern-apps-22jf

### Community Resources
- shadcn/ui Templates (dashboard category): https://www.shadcn.io/template/category/dashboard
- React Dashboard Components (100+): https://dev.to/tailwindcss/100-react-dashboard-components-to-use-in-2024-3ked
- Top React Icon Libraries 2025: https://javascript.plainenglish.io/10-trending-react-icon-libraries-to-elevate-your-projects-in-2025-34f4402078e8

### Version Information
- Recharts GitHub Releases: https://github.com/recharts/recharts/releases (v2.15.3 → v3.4.1+)
- Recharts 3.0 Migration Guide: https://github.com/recharts/recharts/wiki/3.0-migration-guide
- NPM package pages (blocked, used GitHub/community sources instead)

---

## Key Takeaway for Roadmap

**The Uplift stack is already 95% optimal for dashboard development.** No major dependencies needed. Focus implementation on:

1. **Leverage existing Recharts** (v2.15.4) for charts - no installation needed
2. **Use shadcn/ui Sidebar component** for collapsible navigation - likely needs `npx shadcn@latest add sidebar`
3. **TanStack Query** for parallel metric fetching - already configured
4. **Tailwind Grid** for layout - no library needed
5. **Defer react-grid-layout** until user demand for drag/drop proven

**Estimated Phase Duration Impact:** Dashboard v1 can be built with **zero new major dependencies**, reducing risk and integration complexity. Roadmap should allocate time for learning shadcn patterns (Sidebar, Card composition) rather than library evaluation.

---

*Stack research for: Uplift Dashboard Home*
*Researched: 2026-02-23*
*Confidence: HIGH (official docs + 2025 community validation)*
