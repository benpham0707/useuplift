# Uplift Dashboard Home

## What This Is

A new Dashboard Home tab for the Uplift college admissions platform that serves as the central hub when students log in. This dashboard provides at-a-glance application status, AI-powered next best actions, upcoming deadlines, and quick access to all Uplift features — answering "What should I do right now?", "Am I on track?", and "What's coming up?" in 2 seconds.

## Core Value

Students see their most important next step and application status immediately upon login, reducing decision paralysis and keeping them on track for deadlines.

## Requirements

### Validated

<!-- Existing features from the codebase that remain unchanged -->

- ✓ Scanner page for essay analysis — existing
- ✓ Insights page for application analytics — existing
- ✓ Workshop pages for essay writing — existing
- ✓ Pricing page — existing
- ✓ Settings page — existing
- ✓ Clerk authentication system — existing
- ✓ Supabase data persistence — existing
- ✓ React Router client-side routing — existing
- ✓ shadcn/ui component system — existing

### Active

<!-- New Dashboard Home features to build -->

- [ ] Dashboard Home becomes default landing page after login
- [ ] AI-powered "Next Best Action" section with 1-3 prioritized action cards
- [ ] Progress/status zone with readiness percentage, streak counter, and portfolio score
- [ ] Upcoming deadlines list (3-5 items) with color-coded urgency
- [ ] Quick-launch cards for Scanner, Workshop, and other features
- [ ] "Home" added as first sidebar item with home icon
- [ ] Collapsible sidebar with Cmd+\ shortcut or toggle button
- [ ] All existing pages remain accessible at current or adjusted routes
- [ ] Desktop-optimized layout using existing shadcn/ui components

### Out of Scope

- Mobile responsive layout — desktop-first for v1
- Real AI-powered recommendations — using mocked data initially
- Google Calendar integration — manual deadlines for now
- Deadline scraping from college websites — manual entry for v1
- Modifying any existing feature pages — they remain untouched
- New backend APIs — using existing data where possible, mocked otherwise
- User onboarding flow changes — focusing on logged-in experience

## Context

Uplift is an established AI-powered college application platform with multiple mature features (Scanner, Insights, Workshop). Students currently land on the Scanner page when they log in, but this doesn't give them a clear sense of their overall progress or what to focus on next. The Dashboard Home solves this by creating a hub-and-spoke architecture where students start at a central dashboard and navigate out to specific features as needed.

The platform already has:
- React 18 SPA with React Router for client-side routing
- Express.js backend API on port 8789
- Clerk for authentication with Supabase for data storage
- shadcn/ui components with Tailwind CSS
- Existing dashboard layout structure at `src/layouts/DashboardLayout.tsx`
- Service-oriented architecture with clear separation of concerns

## Constraints

- **Tech Stack**: Must use existing React/TypeScript/shadcn/ui stack — no new frameworks
- **Authentication**: Must work with existing Clerk auth and RequireVerified guards
- **Visual Identity**: Maintain Uplift's existing gradients, colors, and cloud logo
- **Data Sources**: v1 uses mocked data for AI recommendations and some metrics
- **Routing**: Preserve all existing routes, add new /dashboard default route
- **Desktop-First**: Optimize for desktop screens, mobile adaptation is v2

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hub-and-spoke architecture | Students need a central starting point to orient themselves | — Pending |
| Mocked data for v1 | Faster to market, can validate UX before investing in AI integration | — Pending |
| Keep all existing pages unchanged | Minimize risk, preserve working features | — Pending |
| Desktop-first approach | Most college applications are completed on desktop/laptop | — Pending |
| Collapsible sidebar | Support future focus modes and give users more screen real estate | — Pending |

---
*Last updated: 2026-02-23 after initialization*