# Frontend Capability Setup Guide for Claude Code

> **Purpose**: Maximize Claude Code's ability to produce high-quality frontend UI/UX for Uplift,
> matching or exceeding Lovable-tier output. Work through each section in order.

---

## Table of Contents

1. [Playwright MCP (Browser Vision)](#1-playwright-mcp-browser-vision)
2. [Clerk Auth Bypass for Local Dev](#2-clerk-auth-bypass-for-local-dev)
3. [Reference Material Collection](#3-reference-material-collection)
4. [Frontend Design Standards File](#4-frontend-design-standards-file)
5. [Workflow: How We'll Build Together](#5-workflow-how-well-build-together)
6. [What's Already Set Up (No Action Needed)](#6-whats-already-set-up-no-action-needed)
7. [Optional Power-Ups](#7-optional-power-ups)

---

## 1. Playwright MCP (Browser Vision)

**What it does**: Lets Claude open a real browser, navigate to your app, take screenshots, click elements, and verify layouts visually — the same feedback loop as Lovable's preview.

**Setup** (run from project root):

```bash
claude mcp add playwright -- npx @playwright/mcp@0.0.41
```

> Version 0.0.41 specifically — newer versions have a known bug with Claude Code tool calls.

**Verify** after restarting Claude Code:
- Ask Claude: "Open a browser to localhost:5173"
- A visible Chrome window should appear

**Restart Claude Code** after adding (required to pick up new MCP tools):
```bash
# Exit current session
/exit

# Start new session
claude
```

---

## 2. Clerk Auth Bypass for Local Dev

Since you're waiting on Clerk dev keys from your co-founder, create a temporary bypass so you can still run the app locally and see UI changes.

### Option A: Auth Bypass Component (Recommended)

Create a file at `src/components/DevAuthBypass.tsx`:

```tsx
import { useEffect } from 'react';

/**
 * TEMPORARY: Bypasses Clerk auth check for local UI development.
 * Remove this before any production deploy.
 *
 * Usage: Wrap your app routes with this instead of ClerkProvider
 * when VITE_DEV_BYPASS_AUTH=true in .env.local
 */
export const DevAuthBypass = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    console.warn('[DEV] Auth bypass active — Clerk is disabled');
  }, []);

  return <>{children}</>;
};

export const isDevAuthBypass = () =>
  import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
```

Then in your main App.tsx, conditionally skip ClerkProvider:

```tsx
import { isDevAuthBypass, DevAuthBypass } from './components/DevAuthBypass';

// In the render:
{isDevAuthBypass() ? (
  <DevAuthBypass>{/* routes */}</DevAuthBypass>
) : (
  <ClerkProvider publishableKey={...}>{/* routes */}</ClerkProvider>
)}
```

And in `.env.local`:
```
VITE_DEV_BYPASS_AUTH=true
```

This lets you see and interact with all pages without Clerk keys. Any route that calls `useAuth()` will need a mock — Claude can handle that when you hit it.

### Option B: Just Wait for Keys

If you'd rather not touch auth at all, wait for your co-founder. The Playwright MCP and all other setup steps are independent of auth.

---

## 3. Reference Material Collection

This is the **highest-impact thing you can do** to boost output quality. Claude builds to what it can see.

### 3a. Screenshots of Your Current App (CRITICAL)

Take screenshots of your **production app** (the one users see) and save them in a folder:

```bash
mkdir -p docs/ui-reference/current
```

Capture at minimum:
- [ ] Landing page / hero section
- [ ] Dashboard / main app view after login
- [ ] Any existing activity-related pages (Activity Workshop, Extracurricular Optimizer)
- [ ] Portfolio Insights page (the closest existing "results" page)
- [ ] Navigation bar and sidebar
- [ ] Any modal/dialog examples
- [ ] Mobile view of any page (resize browser to ~375px width)

**Save as**: `docs/ui-reference/current/landing-hero.png`, `dashboard-main.png`, etc.

### 3b. Design Inspiration / Competitor References

If there are apps whose UI/UX you admire or want to draw from, screenshot them:

```bash
mkdir -p docs/ui-reference/inspiration
```

Good sources:
- Competitor college platforms (CollegeVine, Collegeadvisor.com, etc.)
- AI product UIs you like (ChatGPT, Perplexity, Linear, Notion)
- Any Dribbble/Behance shots you've saved
- Specific patterns: "I want cards like this", "I want a progress flow like that"

**Save as**: `docs/ui-reference/inspiration/linear-dashboard.png`, etc.

### 3c. Your Vision Notes

Create a simple text file describing what you want:

```bash
touch docs/ui-reference/VISION.md
```

Answer these questions in it (even rough answers help enormously):

```markdown
# Activity Workshop UI Vision

## Overall Feel
<!-- e.g., "Game-like and vibrant" / "Clean and professional" / "Friendly and approachable" -->

## Key Pages Needed
<!-- List the pages/views the Activity Workshop needs -->
- Activity chat/input page (where students describe their activities)
- Results overview page (after pipeline processes)
- Individual activity deep-dive page
- Activity comparison/portfolio view

## User Flow
<!-- How does a student move through the experience? -->
1. Student arrives at Activity Workshop
2. ...
3. ...

## Must-Have Elements
<!-- Non-negotiable UI elements -->
- Score visualizations
- Before/after description comparisons
- Teaching feedback sections
- Mobile responsive

## Things I Like About Current App
<!-- What to keep -->

## Things I Want to Change
<!-- What to improve -->

## Specific Requests
<!-- e.g., "More whitespace", "Bigger typography", "More animations" -->
```

### Why This Matters

Without reference material, Claude produces generic "good" UI. With screenshots and vision notes, Claude produces UI that **matches your specific aesthetic, continues your design language, and implements your exact vision**. This is the #1 differentiator between generic and great output.

---

## 4. Frontend Design Standards File

Create this file so Claude (in any session) knows your exact design rules:

```bash
touch docs/FRONTEND_STANDARDS.md
```

I've pre-analyzed your codebase. Here's a starting template based on what already exists — **review and adjust to your preferences**:

```markdown
# Uplift Frontend Design Standards

## Design System (Already Established)

### Brand Colors (HSL — defined in src/index.css)
- **Primary**: Purple-Blue (250 70% 60%) — main CTAs, active states, links
- **Secondary**: Cyan (185 80% 55%) — supporting actions, highlights
- **Accent**: Magenta (280 90% 65%) — badges, special callouts
- **Success**: Green (145 70% 55%) — positive scores, completions
- **Warning**: Orange (35 85% 60%) — caution states, medium scores
- **Destructive**: Red (0 84% 60%) — errors, low scores

### Gradients (Use These, Don't Invent New Ones)
- `gradient-primary` — Purple→Magenta (main brand)
- `gradient-secondary` — Cyan→Blue (supporting)
- `gradient-hero` — Purple→Cyan→Magenta (page heroes)
- `gradient-dashboard` — Purple→Cyan (dashboard headers)
- Score gradients: `gradient-score-excellent`, `gradient-score-good`, `gradient-score-average`, `gradient-score-warning`

### Typography
- Font: System font stack (inherited from Tailwind defaults)
- Headings: font-bold or font-semibold
- Body: text-foreground on bg-background
- Muted: text-muted-foreground for secondary text

### Spacing & Layout
- Page max-width: `max-w-7xl` (1280px) for dashboards, `max-w-4xl` (896px) for reading
- Page padding: `px-4 py-8` standard
- Card gaps: `gap-4` (16px) or `gap-6` (24px)
- Border radius: `rounded-lg` (0.75rem) standard, matches --radius

### Elevation & Depth
- 4-level depth system: `depth-layer-1` through `depth-layer-4`
- Shadow utilities: `shadow-soft`, `shadow-medium`, `shadow-strong`, `shadow-glow`, `shadow-game`
- Glass effect: `glass-card` (bg-card/70 backdrop-blur)

## Component Library

### Base (shadcn/ui — 53 components installed)
Full set: accordion, alert, alert-dialog, avatar, badge, breadcrumb, button, calendar, card,
carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu,
form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover,
progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton,
slider, sonner (toast), switch, table, tabs, textarea, toast, toggle, toggle-group, tooltip

### Custom (Uplift-specific)
- **GlowEffect** — Mouse-tracking glow with border glow, spotlight, particles, tilt, magnetism
- **MagicBento** — Bento grid with GSAP particles, spotlight, border glow, tilt effects
- **GradientText** — Animated gradient text with configurable colors and speed
- **ThemedPillButton** — Themed expandable pill buttons (red/green/purple variants)
- **ClickSpark** — Click spark particle effect
- **GradientZap** — Zap-style gradient animation
- **ElectricBorder** — Animated electric border effect
- **StarBorder** — Animated star border for cards

### Animation Libraries
- **GSAP** (gsap) — Complex timeline animations, particle effects, tilt
- **Motion** (motion/framer-motion) — Page transitions, layout animations
- Both are installed and used. Prefer GSAP for complex effects, Motion for simple enter/exit.

## Interaction Patterns

### Cards
- Use `card` class as base (from shadcn)
- Add `hover-lift` for interactive cards
- Add `holo-surface` for premium/featured cards (holographic border)
- Add `GlowEffect` wrapper for magical hover effects

### Scores & Metrics
- Use `metric-value` + `metric-label` classes for score displays
- Color tones: `tone-red`, `tone-yellow`, `tone-green`, `tone-blue`
- Score gradients map to quality: excellent (green), good (blue), average (yellow), warning (orange)

### Page Structure
- Hero section with gradient background → `hero-gradient` + `hero-gradient-fade`
- Content sections with subtle backgrounds → `gradient-section`, `gradient-accent`
- Tabs for multi-section content → shadcn Tabs
- Modals for detail views → shadcn Dialog or Sheet

### Responsive
- Mobile-first with Tailwind breakpoints
- Animations disabled on mobile (MagicBento has built-in mobile detection)
- Grid collapses: 3-col → 2-col → 1-col on smaller screens

## Do's and Don'ts

### Do
- Use existing CSS variables and utility classes from index.css
- Use existing custom components (GlowEffect, MagicBento) for premium feel
- Keep the "game-like vibrant" aesthetic — this is intentional branding
- Use Tabs for organizing related content
- Add subtle animations for state changes

### Don't
- Don't create new color variables — use the existing design system
- Don't use raw hex colors — everything is HSL via CSS variables
- Don't skip mobile responsiveness
- Don't over-animate — one or two effects per view, not everything glowing
- Don't use dark mode styles yet (dark theme exists in CSS but isn't the primary experience)
```

---

## 5. Workflow: How We'll Build Together

Once everything is set up, here's our optimal workflow:

### Session Start
1. You tell me what to build: "Build the Activity Workshop results page"
2. I read the backend data types to understand what data I'm rendering
3. I check your reference screenshots for style matching
4. I propose a layout/approach (quick plan, not a full PLAN.md for UI tweaks)
5. You approve or redirect

### Build Loop
1. I write/edit the component(s)
2. I open the browser via Playwright → navigate to the page → take a screenshot
3. I show you the screenshot (inline in chat)
4. You give feedback: "make the cards wider", "change that color", "add a chart here"
5. I edit → refresh → screenshot → repeat

### Tips for Best Results
- **Be specific with feedback**: "The score should be bigger and use the green gradient" > "make it look better"
- **Share screenshots of things you like**: "Make it look like THIS" is the most powerful instruction
- **One page at a time**: Complete one view before moving to the next
- **Mobile check**: Ask me to resize the browser to mobile (375px) to verify responsive

---

## 6. What's Already Set Up (No Action Needed)

These are already available in your project — Claude will use them automatically:

| Capability | Source |
|---|---|
| 53 shadcn/ui components | `src/components/ui/` |
| 6 custom effect components | GlowEffect, MagicBento, GradientText, ClickSpark, GradientZap, ThemedPillButton |
| Complete design system | `src/index.css` — 50+ CSS variables, 20+ gradients, 15+ utility classes |
| GSAP + Motion animation | Both installed and configured |
| Recharts for data viz | `recharts` package installed |
| 100+ existing portfolio components | `src/components/portfolio/` — rich pattern library to draw from |
| Activity Workshop page shell | `src/pages/ActivityWorkshop.tsx` — exists with mock data |
| 3 Activity Workshop components | `src/components/portfolio/activity-workshop/` |
| Tailwind + PostCSS | Fully configured with animations plugin |

### Existing Component Patterns to Reuse
Claude should study these when building new Activity Workshop components:

- **Score displays**: `src/components/portfolio/impact/ImpactScoreHero.tsx`
- **KPI dashboards**: `src/components/portfolio/impact/KPIDashboard.tsx`
- **Teaching/coaching UI**: `src/components/portfolio/extracurricular/workshop/views/CoachingView.tsx`
- **Analysis views**: `src/components/portfolio/extracurricular/workshop/views/AnalysisView.tsx`
- **Tab layouts**: `src/components/portfolio/extracurricular/ExtracurricularDashboard.tsx`
- **Modal detail views**: `src/components/portfolio/impact/InitiativeModal.tsx`
- **Score badges**: `src/components/portfolio/recognition/RecognitionScoreBadge.tsx`

---

## 7. Optional Power-Ups

### 7a. Figma MCP (If You Get Figma Access Later)

```bash
claude mcp add figma -- npx @anthropic/mcp-figma@latest
```

Would let Claude pull exact designs, spacing, and colors from Figma files.

### 7b. Screenshot Comparison Script

A simple script to quickly capture before/after states:

```bash
# Save in scripts/screenshot.sh
#!/bin/bash
# Usage: ./scripts/screenshot.sh "description"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DESCRIPTION=${1:-"screenshot"}
screencapture -i "docs/ui-reference/captures/${TIMESTAMP}_${DESCRIPTION}.png"
echo "Saved to docs/ui-reference/captures/${TIMESTAMP}_${DESCRIPTION}.png"
```

```bash
chmod +x scripts/screenshot.sh
mkdir -p docs/ui-reference/captures
```

### 7c. Component Storybook (Advanced)

If you want to preview components in isolation without navigating through the full app:

```bash
npm install -D @storybook/react-vite storybook
npx storybook init
```

This is optional — Playwright screenshots of the real app pages are usually enough.

---

## Setup Checklist

Run through this before starting UI work:

- [ ] **Playwright MCP installed**: `claude mcp add playwright -- npx @playwright/mcp@0.0.41`
- [ ] **Claude Code restarted** after MCP install
- [ ] **Dev server running**: `npm run dev` (needs auth bypass OR Clerk dev keys)
- [ ] **Auth bypass OR Clerk dev keys**: One of the two from Section 2
- [ ] **Current app screenshots** saved to `docs/ui-reference/current/`
- [ ] **Inspiration screenshots** saved to `docs/ui-reference/inspiration/` (if any)
- [ ] **Vision notes** written in `docs/ui-reference/VISION.md`
- [ ] **Frontend standards** reviewed in `docs/FRONTEND_STANDARDS.md`

### Priority Order

1. **Playwright MCP** (5 min) — essential for visual feedback loop
2. **Auth bypass** (5 min) — unblocks local dev without Clerk keys
3. **Current app screenshots** (10 min) — highest impact on quality
4. **Vision notes** (15 min) — tells Claude what you want
5. Everything else — nice to have

---

## Quick Reference: What to Tell Claude in a New Session

When you start a new Claude Code session for frontend work, say something like:

> "I'm building the Activity Workshop frontend. Read `docs/FRONTEND_CAPABILITY_SETUP.md` and `docs/FRONTEND_STANDARDS.md` for context. Look at the screenshots in `docs/ui-reference/` for design reference. Start the Playwright browser and let's build [specific page]."

This loads all the context Claude needs to produce consistent, high-quality output from the first iteration.
