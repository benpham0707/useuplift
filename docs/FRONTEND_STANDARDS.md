# Uplift Frontend Design Standards

> **Purpose**: This document governs all frontend UI/UX work. Every component, page, and interaction
> must meet these standards. The goal is **production-grade quality** — the level of Linear, Vercel,
> Stripe, and Notion. Not vibecoded. Not generic. Thoughtful, intentional, polished.
>
> **Auto-referenced** by Claude in every frontend session.

---

## Design Philosophy

### The Bar We're Setting

We are building for students making one of the biggest decisions of their lives. The UI must
communicate: **"This tool is serious, capable, and worth trusting."** Not through flashiness —
through clarity, craftsmanship, and attention to detail.

**Our north-star apps:**
- **Linear** — Information density without clutter. Every pixel earns its place.
- **Vercel** — Clean typography, generous whitespace, subtle depth.
- **Stripe** — Data visualization that teaches. Complex info made simple.
- **Notion** — Warm neutrals, readable at every size, feels handcrafted.
- **Arc Browser** — Tasteful color, smooth transitions, personality without noise.

### Core Principles

1. **Clarity over decoration.** Every visual element must serve comprehension. If removing
   something doesn't reduce understanding, remove it.

2. **Hierarchy is everything.** The user's eye should follow a clear path: most important → least
   important. Use size, weight, color, and spacing to create this path — not borders, boxes, and
   outlines everywhere.

3. **Restraint with effects.** One animation per view transition. One glow effect per page (if any).
   The best interfaces feel calm even when presenting complex data.

4. **Whitespace is a feature.** Generous padding and margins signal confidence and quality. Cramped
   layouts signal "we didn't think about this." When in doubt, add more space.

5. **Consistency compounds.** A mediocre pattern used consistently looks better than a great pattern
   used inconsistently. Follow existing conventions. Don't invent new ones unless the existing
   pattern is demonstrably wrong.

6. **Mobile is not an afterthought.** Every component must work at 375px. Design mobile-first,
   then enhance for desktop. Never the reverse.

---

## Color System

### Semantic Tokens (USE THESE — defined in `src/index.css`)

All colors are HSL via CSS custom properties. **Never use raw hex, rgb, or Tailwind color names
(blue-500, etc.) directly.** Always go through the token system.

| Token | Tailwind Class | Purpose |
|-------|---------------|---------|
| `--background` | `bg-background` | Page background |
| `--foreground` | `text-foreground` | Primary text |
| `--card` | `bg-card` | Card backgrounds |
| `--card-foreground` | `text-card-foreground` | Text on cards |
| `--muted` | `bg-muted` | Subtle backgrounds (chips, pills, code blocks) |
| `--muted-foreground` | `text-muted-foreground` | Secondary/supporting text |
| `--primary` | `bg-primary`, `text-primary` | Brand purple — CTAs, active states, links |
| `--primary-light` | `text-primary-light` | Lighter purple for hover/focus states |
| `--primary-dark` | `text-primary-dark` | Darker purple for pressed states |
| `--secondary` | `bg-secondary`, `text-secondary` | Cyan — secondary actions, supporting highlights |
| `--accent` | `bg-accent` | Magenta — badges, special callouts |
| `--destructive` | `bg-destructive` | Red — errors, deletions, low scores |
| `--success` | HSL via `--success` | Green — positive scores, completions |
| `--warning` | HSL via `--warning` | Orange — caution, medium scores |
| `--border` | `border-border` | Default borders |

### Score Colors (Standardized)

| Score Range | Token | Gradient Class | Use For |
|-------------|-------|----------------|---------|
| 8-10 | `--success` | `gradient-score-excellent` | Excellent/outstanding |
| 6-7.9 | `--secondary` | `gradient-score-good` | Good/strong |
| 4-5.9 | `--warning` | `gradient-score-average` | Average/developing |
| 0-3.9 | `--destructive` | `gradient-score-warning` | Needs work/weak |

### Color Rules

```
DO:
  bg-card, text-foreground, text-muted-foreground, border-border
  bg-primary, text-primary-foreground
  hsl(var(--primary) / 0.1)  — for tinted backgrounds

DON'T:
  bg-blue-500, text-violet-600, #3b82f6, rgb(99, 102, 241)
  bg-amber-50/50 text-amber-900  — hardcoded light-mode only colors
```

**Exception**: Score tier colors (green/amber/red) may use Tailwind names when they represent
universal semantic meaning (green=good, red=bad) AND are paired with `dark:` variants.

### Gradients (Existing — Don't Invent New Ones)

| Class | Use For |
|-------|---------|
| `gradient-primary` | Purple → Magenta. Primary brand surfaces. |
| `gradient-secondary` | Cyan → Blue. Supporting surfaces. |
| `gradient-hero` | Purple → Cyan → Magenta. Hero sections only. |
| `gradient-section` | Very subtle. Section background tinting. |
| `gradient-dashboard` | Purple → Cyan. Dashboard headers. |
| `gradient-score-*` | Score displays. Mapped to quality tiers. |

**Gradient usage rule**: Maximum 2 gradient surfaces visible at any time. Gradient on gradient
creates visual noise. If the page header uses a gradient, cards below should be flat `bg-card`.

---

## Typography

### Scale

| Element | Classes | Usage |
|---------|---------|-------|
| Page title | `text-3xl md:text-4xl font-bold tracking-tight` | One per page, top of content |
| Section heading | `text-xl md:text-2xl font-semibold` | Major content divisions |
| Card heading | `text-base font-semibold text-foreground` | Card titles |
| Body | `text-sm text-foreground leading-relaxed` | Primary content |
| Supporting | `text-sm text-muted-foreground` | Descriptions, secondary info |
| Micro label | `text-xs font-medium text-muted-foreground uppercase tracking-wider` | Category tags, KPI labels |
| Caption | `text-xs text-muted-foreground` | Timestamps, footnotes |
| Score value | `text-2xl font-bold` or `text-3xl font-bold` | Numeric scores, KPIs |
| Score denom | `text-sm text-muted-foreground` | "/10", "/100" next to scores |

### Typography Rules

1. **One `font-bold` heading per visual section.** If everything is bold, nothing is bold.
2. **Use `tracking-tight` on large text** (2xl+). Use `tracking-wider` only on `uppercase` micro-labels.
3. **Line length**: Body text should never exceed `max-w-prose` (65ch) or `max-w-2xl`. Long lines
   kill readability.
4. **Font mono for data**: Use `font-mono` or `tabular-nums` for numeric scores and data tables
   so columns align properly.
5. **No `text-[10px]` or arbitrary sizes.** If the Tailwind scale doesn't have it, the text is
   probably too small. Minimum readable size is `text-xs` (12px).
6. **GradientText** usage: Reserved for hero-level score displays and page titles. Not for body
   text, labels, or descriptions. One GradientText instance per view maximum.

---

## Spacing & Layout

### Page Structure

```
<div className="min-h-screen bg-background">
  {/* Optional: page header/hero with gradient */}
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
    {/* Page content */}
  </div>
</div>
```

| Layout Type | Max Width | Use For |
|-------------|-----------|---------|
| Dashboard | `max-w-7xl` (1280px) | Multi-column data displays |
| Content page | `max-w-6xl` (1152px) | Standard app pages |
| Reading | `max-w-4xl` (896px) | Text-heavy content, workshops |
| Narrow focus | `max-w-2xl` (672px) | Forms, single-focus views |

### Spacing Scale

| Context | Gap/Padding | When |
|---------|-------------|------|
| Between page sections | `space-y-10 md:space-y-16` | Major content blocks |
| Between cards in a grid | `gap-4 md:gap-6` | Card grids, KPI rows |
| Card internal padding | `p-5 md:p-6` | Standard cards |
| Between elements in a card | `space-y-3` or `space-y-4` | Card content stacking |
| Tight grouping | `space-y-1` or `gap-2` | Label + value pairs |

### Grid Patterns

```tsx
// KPI/metric row: always collapse gracefully
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

// Two-column content: stack on mobile
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

// Sidebar + main: stack on mobile
<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

// Bento-style: 12-column grid for complex layouts
<div className="grid grid-cols-12 gap-4">
```

---

## Component Patterns

### Cards

The primary content container. Every card should follow this baseline:

```tsx
// Standard card
<div className="bg-card rounded-lg border border-border p-5 md:p-6">
  {/* content */}
</div>

// Interactive card (clickable)
<div className="bg-card rounded-lg border border-border p-5 md:p-6
                transition-all duration-200
                hover:border-primary/30 hover:shadow-soft
                cursor-pointer">
  {/* content */}
</div>

// Elevated card (featured/important)
<div className="bg-card rounded-lg border border-border p-5 md:p-6
                depth-layer-2">
  {/* content */}
</div>

// Glass card (over gradient backgrounds)
<div className="bg-card/80 backdrop-blur-sm rounded-lg
                border border-border/50 p-5 md:p-6">
  {/* content */}
</div>
```

**Card rules:**
- Cards do not nest inside cards. If you need sub-grouping, use a subtle `bg-muted/50 rounded-md p-3`.
- Maximum depth-layer for cards is `depth-layer-2`. Reserve `depth-layer-3`+ for modals/overlays.
- Card hover effects: pick ONE of `hover-lift`, `hover:border-primary/30`, or `hover:shadow-soft`.
  Never combine all three.

### Accent Border Cards (for lists of insights/narratives)

```tsx
// Left-accent card — great for narrative items, recommendations, insights
<div className="bg-card rounded-lg border border-border border-l-4
                border-l-primary p-4">
  <h4 className="text-sm font-semibold text-foreground mb-1">Title</h4>
  <p className="text-sm text-muted-foreground">Description...</p>
</div>
```

Use the left border color to encode meaning:
- `border-l-primary` — general/neutral
- `border-l-green-500 dark:border-l-green-400` — strength/positive
- `border-l-amber-500 dark:border-l-amber-400` — opportunity/warning
- `border-l-destructive` — critical/needs attention

### Score Displays

```tsx
// Large hero score (one per page max)
<div className="flex flex-col items-center">
  <span className="text-4xl font-bold tabular-nums">7.8</span>
  <span className="text-sm text-muted-foreground">/10</span>
  <span className="text-xs font-medium text-muted-foreground mt-1">Overall Score</span>
</div>

// Inline metric tile (for KPI rows)
<div className="bg-card rounded-lg border border-border p-4">
  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
    Label
  </span>
  <div className="flex items-baseline gap-1 mt-1">
    <span className="text-2xl font-bold tabular-nums">8.2</span>
    <span className="text-sm text-muted-foreground">/10</span>
  </div>
</div>
```

### Buttons

Use shadcn/ui `<Button>` exclusively. Available variants:

| Variant | Use For |
|---------|---------|
| `default` | Primary actions (submit, continue, analyze) |
| `secondary` | Secondary actions (cancel, back) |
| `outline` | Tertiary actions (edit, settings) |
| `ghost` | Inline/contextual actions (within cards, toolbars) |
| `destructive` | Destructive actions (delete, remove) |
| `link` | Navigation actions styled as links |

**Button rules:**
- One primary (default variant) button per view/section. Multiple primaries = no hierarchy.
- Icons in buttons: 16px (`w-4 h-4`), placed before label with `gap-2`.
- Loading state: Use `disabled` + spinner icon. Never leave a button looking clickable during
  async operations.

### Tabs

Use shadcn `<Tabs>` for multi-section content. Standard pattern:

```tsx
<Tabs defaultValue="overview" className="w-full">
  <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
    <TabsTrigger value="overview"
      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary
                 data-[state=active]:bg-transparent px-4 pb-3">
      Overview
    </TabsTrigger>
    {/* more triggers */}
  </TabsList>
  <TabsContent value="overview" className="mt-6">
    {/* content */}
  </TabsContent>
</Tabs>
```

**Tab rules:**
- Maximum 5 tabs. More than 5 = rethink the information architecture.
- Tab labels: 1-2 words. No icons in tabs unless the label alone is ambiguous.
- Tab content should not scroll independently — the whole page scrolls.

---

## Animation & Motion

### Philosophy

Animation should **explain** — it tells the user where something came from, where it went, and
what just changed. It should never be decoration.

### Approved Patterns

| Pattern | Library | Duration | Use For |
|---------|---------|----------|---------|
| Page enter | `framer-motion` | 300-500ms | Initial content reveal on mount |
| Stagger children | `framer-motion` | 50-100ms delay per item | Lists, card grids |
| Score gauge fill | CSS `transition` | 700-1000ms | SVG stroke, progress bars |
| Card hover | CSS `transition` | 150-200ms | Border, shadow, translate changes |
| Expand/collapse | CSS `transition` | 200-300ms | Accordions, panels |
| Tab switch | None (instant) | 0ms | Tab content changes should be instant |

### Stagger Pattern (Standard)

```tsx
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

<motion.div variants={container} initial="hidden" animate="show">
  {items.map(i => (
    <motion.div key={i.id} variants={item}>...</motion.div>
  ))}
</motion.div>
```

### Animation Rules

1. **No animation on scroll.** Scroll-triggered animations are disorienting and slow. Content
   should be visible when the user scrolls to it, not hidden behind a reveal.
2. **No looping animations in app views.** Pulsing, floating, orbiting elements are distracting
   during focused work. Exception: loading spinners.
3. **`prefers-reduced-motion`**: All animations must respect this. Framer-motion does this
   automatically. For CSS animations, add `@media (prefers-reduced-motion: reduce)` overrides.
4. **Maximum 1 "hero" animation per page.** The score gauge can animate on fill. The card grid
   can stagger in. Pick one, not both.
5. **GSAP**: Reserve for the landing page and marketing materials only. App views should use
   framer-motion or CSS transitions exclusively — they are simpler to maintain and reason about.
6. **GlowEffect / holo-surface / particle effects**: Landing page and premium showcase surfaces
   only. Never in day-to-day app views where students are working. These effects compete with
   the content for attention.

---

## Interaction Design

### Hover States

Every interactive element must have a visible hover state. The user should never wonder "can I
click this?"

```
Buttons:   opacity change (built into shadcn)
Cards:     border-color shift OR subtle shadow increase (not both + lift)
Links:     underline or color shift
Icons:     opacity or color shift
Tabs:      background tint or border emphasis
```

### Focus States

All interactive elements must have visible focus rings for keyboard navigation:

```tsx
// Built into shadcn — don't override unless necessary
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
focus-visible:ring-offset-2
```

### Loading States

```tsx
// Skeleton for content loading
<div className="space-y-3">
  <Skeleton className="h-8 w-48" />       {/* heading */}
  <Skeleton className="h-4 w-full" />     {/* text line */}
  <Skeleton className="h-4 w-3/4" />      {/* shorter text line */}
</div>

// Inline spinner for async actions
<Button disabled>
  <Loader2 className="w-4 h-4 animate-spin mr-2" />
  Analyzing...
</Button>
```

### Empty States

Every view that can be empty must have a designed empty state:

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
    <IconName className="w-6 h-6 text-muted-foreground" />
  </div>
  <h3 className="text-base font-semibold text-foreground mb-1">No activities yet</h3>
  <p className="text-sm text-muted-foreground max-w-sm mb-4">
    Add your first extracurricular activity to get started with your portfolio analysis.
  </p>
  <Button>Add Activity</Button>
</div>
```

---

## Data Visualization

### Charts (Recharts)

```tsx
// Standard chart colors — use CSS custom properties
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
];

// Chart container — always set a fixed aspect ratio
<div className="w-full aspect-[16/9]">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      {/* ... */}
    </BarChart>
  </ResponsiveContainer>
</div>
```

### Chart Rules

1. **Label everything.** Every axis, every bar, every data point should be identifiable without
   hovering. Tooltips are a bonus, not a crutch.
2. **Start bar charts at 0.** Don't truncate Y-axes to exaggerate differences.
3. **Maximum 5-6 colors per chart.** Beyond that, the chart is unreadable.
4. **Use the score color scale** for any chart that represents quality/performance.
5. **Prefer horizontal bars** for categorical data with long labels (activity names, etc.).

### Progress Indicators

```tsx
// Simple progress bar
<div className="w-full bg-muted rounded-full h-2">
  <div
    className="h-full rounded-full bg-primary transition-all duration-700"
    style={{ width: `${percentage}%` }}
  />
</div>

// Segmented progress (for multi-step flows)
<div className="flex gap-1">
  {steps.map((step, i) => (
    <div
      key={i}
      className={cn(
        "h-1.5 flex-1 rounded-full transition-colors duration-300",
        i <= currentStep ? "bg-primary" : "bg-muted"
      )}
    />
  ))}
</div>
```

---

## Responsive Design

### Breakpoint Strategy

| Breakpoint | Width | Target |
|------------|-------|--------|
| Default | 0-639px | Phone portrait |
| `sm` | 640px+ | Phone landscape / small tablet |
| `md` | 768px+ | Tablet portrait |
| `lg` | 1024px+ | Tablet landscape / small laptop |
| `xl` | 1280px+ | Desktop |
| `2xl` | 1536px+ | Large desktop |

### Responsive Rules

1. **Test at 375px (iPhone SE), 768px (iPad), and 1440px (desktop).** These three cover 90% of
   real usage.
2. **Grid collapse order**: 5-col → 3-col → 2-col → 1-col. Never show a 5-column grid on mobile.
3. **Hide non-essential content on mobile** with `hidden md:block`. Don't just shrink everything.
4. **Touch targets**: Minimum 44x44px for all tappable elements on mobile (this is Apple's HIG).
5. **No horizontal scroll** except for deliberately designed carousels.
6. **Font sizes don't need to change much.** A `text-sm` that's readable on desktop is readable
   on mobile. Don't scale typography — scale layout and spacing.

---

## Component Architecture

### File Organization

```
src/components/
├── ui/                    # shadcn/ui primitives (don't modify these)
├── portfolio/
│   └── activity-workshop/ # Activity Workshop specific
│       ├── overview/      # Overview tab components
│       ├── story/         # Story tab components
│       ├── edge/          # Edge tab components
│       ├── action-plan/   # Action Plan tab components
│       └── shared/        # Shared across tabs (score tiles, badges)
├── landing/               # Landing page sections
└── layouts/               # Page layout wrappers
```

### Component Size Limits

- **Under 150 lines**: Ideal. Easy to read, test, and modify.
- **150-250 lines**: Acceptable for complex views. Look for extraction opportunities.
- **Over 250 lines**: Must be split. Extract sub-components into the same directory.

### Composition Patterns

```tsx
// GOOD: Small, focused components composed together
<ActivityOverview data={data}>
  <ScoreDashboard scores={data.scores} />
  <TierDistribution tiers={data.tiers} />
  <NarrativeThreads threads={data.threads} />
  <ActionPlan recommendations={data.recommendations} />
</ActivityOverview>

// BAD: One monolithic component rendering everything
<ActivityOverview data={data} />  // 400+ lines internally
```

### Props Design

```tsx
// GOOD: Specific, typed props
interface ScoreTileProps {
  label: string;
  value: number;
  maxValue: number;
  variant: 'excellent' | 'good' | 'average' | 'warning';
  onClick?: () => void;
}

// BAD: Passing the entire data object
interface ScoreTileProps {
  data: ActivityWorkshopResult;  // component reaches deep into object
}
```

---

## Existing Component Library

### shadcn/ui (53 components — use these, don't rebuild)

Accordion, Alert, AlertDialog, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel,
Chart, Checkbox, Collapsible, Command, ContextMenu, Dialog, Drawer, DropdownMenu, Form,
HoverCard, Input, InputOTP, Label, Menubar, NavigationMenu, Pagination, Popover, Progress,
RadioGroup, Resizable, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner,
Switch, Table, Tabs, Textarea, Toast, Toggle, ToggleGroup, Tooltip

### Custom Components (use sparingly, app-views only where appropriate)

| Component | What It Does | Where to Use |
|-----------|-------------|--------------|
| `GradientText` | Animated gradient on text | Hero scores, page titles only |
| `GlowEffect` | Mouse-tracking border glow | Landing page, premium showcases |
| `MagicBento` | GSAP-powered bento grid | Landing page only |
| `ClickSpark` | Click particle effect | Already global — don't add more |

### Recommended Patterns from Existing Code

| Pattern | Source File | What's Good About It |
|---------|-----------|---------------------|
| Metric tile with glow selection | `ActivityMetricTile.tsx` | Three-layer active state (border + ring + shadow) |
| Tooltip arrow positioning | `ActivityInsightsPanel.tsx` | Diamond-rotated div with calculated left offset |
| Staggered hero animation | `HeroSection.tsx` | Well-choreographed framer-motion sequence |
| Label micro-typography | Throughout | `text-xs font-medium uppercase tracking-wider text-muted-foreground` |
| Glass cards over gradients | `ActivityPortfolioOverview.tsx` | `bg-card/80 backdrop-blur-sm border-border/50` |
| Left-accent insight cards | `ActivityPortfolioOverview.tsx` | `border-l-4 border-l-{color}` for categorized items |

---

## Anti-Patterns (Don't Do These)

### Visual

- **Rainbow gradients** — More than 2 colors in a gradient reads as "tech demo", not "professional tool"
- **Stacking effects** — GlowEffect + holo-surface + particles on the same element
- **Glow/shine on everything** — Reserve for 1-2 hero elements per page
- **Arbitrary pixel values** — `text-[10px]`, `w-[137px]`, `gap-[7px]`. Use the Tailwind scale.
- **Hardcoded light-mode colors** — `bg-amber-50 text-amber-900` without `dark:` variants

### Structural

- **Props drilling** — More than 2 levels of passing props down = use context or composition
- **Inline styles** — Except for dynamic values (CSS custom properties, calculated positions)
- **className string concatenation** — Use `cn()` from `@/lib/utils` for conditional classes
- **Unused imports/dead code** — Remove it. Don't comment it out "for later."

### Animation

- **Looping animations in work views** — Pulsing, floating, orbiting. Students are trying to focus.
- **Scroll-triggered reveals** — Content should be visible when scrolled to, immediately.
- **3+ second animations** — If it takes longer than 1 second, it's a wait, not an animation.
- **Animating layout shifts** — Never animate width/height of elements that cause reflow.

---

## Quality Checklist

Before any component is considered done:

- [ ] Works at 375px, 768px, and 1440px without horizontal scroll
- [ ] All text is readable (no text smaller than 12px / `text-xs`)
- [ ] Interactive elements have visible hover and focus states
- [ ] Colors use design tokens, not hardcoded values
- [ ] Maximum one bold/hero animation per view
- [ ] Empty state is designed (if the component can be empty)
- [ ] Loading state exists (if the component fetches data)
- [ ] Component is under 250 lines (split if over)
- [ ] No Tailwind JIT purge risks (no dynamic class string assembly)
- [ ] `cn()` used for conditional classes, not ternary + string concat
- [ ] Whitespace feels generous, not cramped
- [ ] Visual hierarchy is clear — you can tell what's most important at a glance

---

## Quick Decision Guide

**"Should I add an animation here?"**
→ Does it explain a state change? Yes → add it. No → skip it.

**"Should I use GlowEffect / holo-surface?"**
→ Is this the landing page? Yes → maybe. Is this an app view? No → skip it.

**"Which shadow/elevation should I use?"**
→ `depth-layer-1` for most cards. `depth-layer-2` for featured/important cards.
`shadow-soft` for hover states. `depth-layer-3+` for modals only.

**"Should I use a gradient background?"**
→ Is there already a gradient visible on screen? Skip it. Is this a hero section with no
other gradients? Go for it.

**"How much padding should this have?"**
→ More than you think. Start with `p-6`, not `p-3`. Add space until it breathes.

---

*This document is the source of truth for frontend quality. When in doubt, choose the simpler,
cleaner, more restrained option. The best design is the one the user doesn't notice because
it just works.*
