# Activity Workshop Frontend — Session Handoff

> **Purpose**: Complete context for any new Claude Code session working on the Activity Workshop
> frontend UI/UX. Read this first, then reference the linked documents for deep dives.
>
> **Created**: Feb 20, 2026 | **Last Updated**: Feb 20, 2026

---

## What Was Accomplished This Session

### 1. Local Dev Environment — FULLY WORKING

- **`.env.local`** created with Clerk dev keys (`pk_test_` / `sk_test_`)
- **Clerk config validated**: Console shows `[Clerk Config] ✅ Configuration is valid for development`
- **Vite dev server** runs on `http://localhost:8080` (NOT 5173)
- **Backend proxy**: Vite proxies `/api` requests to Express on port 8789
- **Start command**: `npm run dev` (frontend only) or `npm run dev:full` (frontend + backend)

### 2. Playwright MCP — WORKING (with animation fix)

Playwright MCP is installed and can navigate, interact with, and screenshot the app.

**Critical fix for screenshots**: The landing page has heavy GSAP particle animations and
infinite CSS animations that cause Playwright's screenshot to timeout (5s limit). The fix
is to inject this CSS before every screenshot:

```javascript
await page.evaluate(() => {
  const style = document.createElement('style');
  style.id = 'playwright-no-animations';
  style.textContent = `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
      scroll-behavior: auto !important;
    }
    .holo-surface::after { animation: none !important; }
    .holo-sheen::after { animation: none !important; }
    canvas { display: none !important; }
  `;
  document.head.appendChild(style);
});
```

**Do this after every `browser_navigate` call, before taking screenshots.**

### 3. Design Standards Document — CREATED

**File**: `docs/FRONTEND_STANDARDS.md`

Key principles established:
- **Quality bar**: Linear, Vercel, Stripe, Notion level — not vibecoded
- **Restraint over flash**: GlowEffect/holo/particles = landing page only, not app views
- **No hardcoded colors**: Everything through CSS token system in `src/index.css`
- **One hero animation per page max**
- **Component size cap**: 250 lines, extract sub-components beyond that
- **Generous whitespace**: "Start with `p-6`, not `p-3`. Add space until it breathes."
- **Spotify/Discord energy level**: Bold, engaging, personality without childishness
- Full color system, typography scale, spacing rules, component patterns, animation rules

### 4. UI/UX Vision Document — CREATED

**File**: `docs/ui-reference/VISION.md`

Complete product vision for the Activity Workshop frontend, including:
- Target user profile (high schoolers, short attention span, anxiety-driven)
- The "unlock pattern" (muted example → vibrant input form → real results)
- Score system (X/100 + college tier context calibrated to intended major)
- All page architecture and tab structure
- Activity input form fields (mirrors Common App)
- The fabrication edit guardrail pattern for AI-generated suggestions
- User flows (first-time, returning, quick-test)
- Emotional design moments
- Technical integration notes

### 5. Frontend Capability Setup Guide — PRE-EXISTING

**File**: `docs/FRONTEND_CAPABILITY_SETUP.md`

Original setup guide with Playwright install instructions, reference material collection
guidance, workflow description, and component library inventory. Still valid as reference.

---

## Key Product Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Core flow** | Form → Results | Students fill in activities, submit, see dashboard |
| **Emotional goal** | "Gets me like my counselor doesn't" | Deep personalization over generic feedback |
| **Energy level** | Spotify/Discord | Bold, engaging, not plain/dull, not cartoonish |
| **First impression** | Muted example + vibrant input | Show value before asking for work |
| **Locked state visual** | Muted/desaturated (60% grayscale) | Input form is only full-color element |
| **Score format** | X/100 + college tier context | "78/100 — Competitive for UC system CS programs" |
| **Tier calibration** | Based on student's intended major | Deeply personalized, not generic |
| **Input fields** | Mirror Common App | Familiar format for students already working on apps |
| **Minimum to analyze** | 1 activity | Low barrier, progressive encouragement for more |
| **Activity display** | Ranked by strength (#1 to #10) | Click to expand full analysis |
| **Action plan** | Before/after + priority tags | With fabrication edit guardrails |
| **Edit in place** | Yes, with guardrails | Fabricated sections highlighted, must edit before accept |
| **Chat availability** | During input AND results | Collapsible right panel, contextual help |
| **Results layout** | Tabs (Overview, Story, Edge, Action Plan) | Score dashboard pinned above tabs |
| **Persistence** | Save & return (Clerk auth) | Auto-save, come back later with everything intact |
| **Sharing** | PDF export + share link | Both for different use cases |
| **Implementation plan** | Skip formal plan, use build order | UI work benefits from flexibility, not rigid specs |

---

## The Fabrication Edit Pattern (Important UX Innovation)

When the AI generates improved activity descriptions:

- **If student chatted about the activity** → AI uses real details → student can accept directly
- **If student didn't chat** → AI fabricates example details as inspiration → those sections are
  visually highlighted → student MUST edit highlighted sections before "Accept" button enables

This prevents students from accidentally submitting AI-fabricated content in college applications.

UI requirements:
- Highlighted background/inline styling on fabricated text sections
- Sections become editable on click
- Highlight clears once student modifies the text
- "Accept" button disabled until all fabricated sections are edited
- Clear label: "Highlighted sections contain example details. Edit with YOUR real experiences."

---

## Suggested Build Order

No formal implementation plan — use this as a flexible sequence:

1. **Score dashboard component** — hero score (X/100) + 5 dimension tiles + college tier label
2. **Locked example showcase** — muted/desaturated treatment of a pre-built example result
3. **Activity input form** — Common App mirror fields, the vibrant interactive element
4. **Tab structure** — Overview | Your Story | Your Edge | Action Plan
5. **Tab content** — one tab at a time, starting with Overview
6. **Individual activity cards** — ranked list with expand/collapse
7. **Chat panel** — collapsible right panel
8. **Before/after + fabrication guardrails** — the edit-in-place pattern
9. **Transitions** — muted→unlocked animation, loading→results reveal
10. **PDF export + share link** — output features

Each piece gets visually iterated via Playwright screenshots + Tue's feedback.

---

## Current State of Activity Workshop

### Existing Files

```
src/pages/ActivityWorkshop.tsx                    — Page shell, uses mock data
src/components/portfolio/activity-workshop/
  ├── ActivityPortfolioOverview.tsx                — Main results component (~350 lines, needs split)
  ├── ActivityInsightsPanel.tsx                    — Tooltip-style detail panel
  ├── ActivityMetricTile.tsx                       — Individual score tile (best component)
  └── mockData.ts                                 — Sample pipeline output data
```

### Route

```
/activity-workshop/:sessionId    — requires a sessionId param (use /activity-workshop/demo for dev)
```

### Backend Pipeline Output Type

The results UI renders `ActivityWorkshopResult` from the existing pipeline:
- `scoringRubric` — overall + dimension scores, breakdowns, recommendations
- `activityAnalyses[]` — per-activity analysis, tier, description feedback
- `narrativeSynthesis` — story threads, portfolio narrative, spike detection
- `actionPlan` — prioritized recommendations with before/after descriptions

### What Needs to Be Built (vs. what exists)

| Component | Status |
|-----------|--------|
| Score dashboard (X/100 + tier) | **New** — current uses Harvard Scale 1-6, needs redesign |
| Locked example showcase | **New** — the muted/desaturated pre-built example |
| Activity input form | **New** — doesn't exist yet |
| Tab structure | **New** — current page is a single scroll |
| Overview tab | **Partial** — `ActivityPortfolioOverview.tsx` has content but needs redesign |
| Story tab | **New** |
| Edge tab | **New** |
| Action Plan tab | **New** — current has collapsible sections, needs before/after pattern |
| Chat panel | **New** for this page — chat system exists in backend |
| Fabrication guardrails | **New** |
| PDF export | **New** |
| Share link | **New** |

---

## Key Reference Files

### Must-Read Before Building

| File | What It Contains |
|------|-----------------|
| `docs/ui-reference/VISION.md` | Complete product vision, UX patterns, user flows |
| `docs/FRONTEND_STANDARDS.md` | Design quality bar, color system, typography, components, anti-patterns |
| `docs/FRONTEND_CAPABILITY_SETUP.md` | Setup guide, existing component inventory, workflow |
| `docs/ACTIVITY_WORKSHOP_OVERVIEW_UI_CONTEXT.md` | Backend data → UI mapping for overview section |
| `CLAUDE.md` | Development standards, architecture, code patterns |

### Existing Design System

| File | What It Contains |
|------|-----------------|
| `src/index.css` | Full CSS variable system — colors, gradients, shadows, animations, utilities |
| `tailwind.config.ts` | Tailwind extensions — custom colors, keyframes, animations |
| `src/components/ui/` | 53 shadcn/ui components (do not modify) |

### Existing Components to Study/Reuse

| Component | Why |
|-----------|-----|
| `src/components/portfolio/activity-workshop/ActivityMetricTile.tsx` | Best-composed component in codebase. Three-layer selection state. |
| `src/components/portfolio/activity-workshop/ActivityInsightsPanel.tsx` | Tooltip arrow positioning pattern |
| `src/components/landing/HeroSection.tsx` | Well-choreographed framer-motion stagger animation |
| `src/components/portfolio/impact/ImpactScoreHero.tsx` | Score circle gauge pattern |
| `src/components/portfolio/impact/KPIDashboard.tsx` | Clean container component pattern |

### Backend Integration

| File | What It Contains |
|------|-----------------|
| `src/services/portfolioStrategy/services/activityWorkshop/` | Full pipeline (60 files) |
| `src/services/portfolioStrategy/services/activityWorkshop/chat/` | Chat system for activity advisor |

---

## Tech Stack Quick Reference

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite (port 8080), TypeScript strict |
| UI Components | shadcn/ui (53 components), Tailwind CSS |
| Custom Effects | GlowEffect, MagicBento, GradientText (landing page only) |
| Animation | framer-motion (app views), GSAP (landing page only) |
| Charts | Recharts |
| Auth | Clerk (`@clerk/clerk-react`) |
| State | React Query (`@tanstack/react-query`) |
| Routing | React Router DOM |
| Backend | Express.js (port 8789), proxied via Vite |
| Database | Supabase PostgreSQL (project: `zclaplpkuvxkrdwsgrul`) |
| AI | Anthropic Claude (Sonnet for quality, Haiku for speed) |

---

## How to Start a New Session

Paste this at the start of a new Claude Code chat:

> I'm building the Activity Workshop frontend. Read these files for full context:
> 1. `docs/ACTIVITY_WORKSHOP_FRONTEND_HANDOFF.md` (this file — start here)
> 2. `docs/ui-reference/VISION.md` (product vision)
> 3. `docs/FRONTEND_STANDARDS.md` (design quality rules)
>
> Dev server should be running at localhost:8080. Use Playwright to navigate and screenshot.
> Remember to inject the animation-disable CSS before taking screenshots.
>
> Let's build [specific component/page].

---

## Environment Checklist (Verify at Session Start)

- [ ] Dev server running: `npm run dev` → `http://localhost:8080`
- [ ] Playwright MCP connected (test with `browser_navigate`)
- [ ] `.env.local` has Clerk dev keys (app should load without config errors)
- [ ] Backend running if needed: `npm run server` (port 8789) — or use `npm run dev:full`

---

*This document captures the complete context from the Feb 20, 2026 setup session.
Everything needed to continue building is either here or in the linked files.*
