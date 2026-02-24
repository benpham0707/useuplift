# Roadmap: Uplift Dashboard Home

## Overview

Transform Uplift from a feature-first landing experience (Scanner on login) to a hub-and-spoke architecture where students land on a Dashboard Home that answers "What should I do right now?" in 2 seconds. This roadmap delivers a desktop-optimized dashboard that displays AI-powered next actions, application readiness status, upcoming deadlines, and quick-launch cards for all features. The journey moves from routing foundation (making dashboard accessible) through UI component build (visual dashboard structure) to data integration (connecting mocked/real sources) and finally polish (testing, accessibility, performance). All existing features remain untouched — this purely adds a new central hub.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Routing Foundation** - Make Dashboard Home accessible as default landing page (completed 2026-02-24)
- [ ] **Phase 2: Core Dashboard UI** - Build visual components for next actions, status, deadlines, quick-launch
- [ ] **Phase 3: Data & State** - Connect components to real data sources and implement state management
- [ ] **Phase 4: Polish & Integration** - Test, optimize performance, validate accessibility, verify flows

## Phase Details

### Phase 1: Routing Foundation
**Goal**: Dashboard Home is accessible at /dashboard as the default landing page for authenticated users
**Depends on**: Nothing (first phase)
**Requirements**: ROUT-01, ROUT-02, ROUT-03, NAV-01
**Success Criteria** (what must be TRUE):
  1. User lands on Dashboard Home page automatically after Clerk login
  2. /dashboard route displays skeleton dashboard page without errors
  3. "Home" navigation item appears as first sidebar entry with home icon
  4. User can navigate from Dashboard Home to Scanner/Workshop/Insights and back without layout remount
  5. Unauthenticated users are redirected to login (Clerk auth integration verified)
**Plans**: 1 plan

Plans:
- [ ] 01-01-PLAN.md — Create Dashboard Home page, restructure routes to nested /dashboard structure, add Home navigation

### Phase 2: Core Dashboard UI
**Goal**: Dashboard Home displays all visual components with proper layout and responsive design
**Depends on**: Phase 1
**Requirements**: DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, NAV-04, NAV-05, UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. User sees "Next Best Action" card with 1-3 prioritized recommendations (mocked initially)
  2. User sees status overview with readiness percentage, streak counter, and portfolio score
  3. User sees upcoming deadlines list (3-5 items) with color-coded urgency (red=overdue, amber=this week, green=upcoming)
  4. User sees quick-launch cards for Scanner, Workshop, Insights showing last activity and mini progress
  5. Dashboard layout uses shadcn/ui components and maintains Uplift visual identity (gradients, colors, cloud logo)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Data & State
**Goal**: Dashboard components fetch and display real/mocked data with proper state management
**Depends on**: Phase 2
**Requirements**: NAV-02, NAV-03, DASH-01, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. Next Best Action recommendations reflect user's actual state (essays completed, deadlines approaching, profile gaps)
  2. Status metrics pull from Supabase (readiness calculated from essays/profile/portfolio, streak from activity log, portfolio score from existing service)
  3. Deadlines display real data from database or structured mock data matching production schema
  4. User can collapse/expand sidebar with Cmd+\ keyboard shortcut or toggle button (state persists in localStorage)
  5. Loading states display while data fetches, empty states show helpful guidance for new users
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Polish & Integration
**Goal**: Dashboard Home is production-ready with verified performance, accessibility, and integration
**Depends on**: Phase 3
**Requirements**: (Cross-cutting validation of all previous requirements)
**Success Criteria** (what must be TRUE):
  1. User can navigate all routes (Home → Scanner → Workshop → Insights → Settings → back to Home) without errors
  2. Dashboard renders in under 50 React re-renders per interaction (verified with React DevTools Profiler)
  3. Keyboard shortcuts work without conflicts (Cmd+\ tested with screen reader active)
  4. Empty user account (0 essays, no activity) displays helpful empty states instead of errors
  5. Layout remains stable during data load (no visible content shift measured with slow network throttling)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Routing Foundation | 0/1 | Complete    | 2026-02-24 |
| 2. Core Dashboard UI | 0/TBD | Not started | - |
| 3. Data & State | 0/TBD | Not started | - |
| 4. Polish & Integration | 0/TBD | Not started | - |
