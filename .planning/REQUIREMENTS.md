# Requirements: Uplift Dashboard Home

**Defined:** 2026-02-23
**Core Value:** Students see their most important next step and application status immediately upon login, reducing decision paralysis and keeping them on track for deadlines.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Dashboard

- [ ] **DASH-01**: User lands on Dashboard Home as default page after login
- [ ] **DASH-02**: Dashboard Home displays AI-powered "Next Best Action" section with 1-3 action cards (mocked data)
- [ ] **DASH-03**: Dashboard Home shows status overview zone with readiness percentage
- [ ] **DASH-04**: Dashboard Home shows streak counter for consecutive days of activity
- [ ] **DASH-05**: Dashboard Home shows Portfolio Scanner score with trend indicator
- [ ] **DASH-06**: Dashboard Home displays upcoming deadlines list with 3-5 items
- [ ] **DASH-07**: Deadlines show color-coded urgency (red=overdue, amber=this week, green=upcoming)

### Navigation

- [ ] **NAV-01**: "Home" appears as first item in sidebar with home icon
- [ ] **NAV-02**: Sidebar supports collapsible state with Cmd+\ keyboard shortcut
- [ ] **NAV-03**: Sidebar supports collapsible state with toggle button
- [ ] **NAV-04**: Dashboard Home displays quick-launch cards for major features (Scanner, Workshop, etc.)
- [ ] **NAV-05**: Quick-launch cards show feature name, last activity timestamp, and mini progress indicator

### Routing

- [ ] **ROUT-01**: /dashboard route shows Dashboard Home by default
- [ ] **ROUT-02**: All existing feature pages remain accessible at current or adjusted routes
- [ ] **ROUT-03**: Dashboard Home only displays to authenticated users (Clerk auth integration)

### UI/UX

- [ ] **UI-01**: Dashboard Home uses existing shadcn/ui components for consistency
- [ ] **UI-02**: Dashboard Home maintains Uplift visual identity (gradients, colors, cloud logo)
- [ ] **UI-03**: Dashboard Home is optimized for desktop screens (responsive layout)
- [ ] **UI-04**: All data displays appropriate loading states while fetching
- [ ] **UI-05**: Empty states display helpful messages for new users

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Intelligence

- **INT-01**: Next Best Actions powered by real AI model analyzing user data
- **INT-02**: Recommendations update in real-time based on user activity
- **INT-03**: Machine learning model trains on user interaction patterns

### Calendar

- **CAL-01**: Deadlines sync with Google Calendar integration
- **CAL-02**: Deadlines scraped automatically from college websites
- **CAL-03**: Calendar shows full month/week view within dashboard
- **CAL-04**: User can add custom deadlines and events

### Mobile

- **MOB-01**: Dashboard Home fully responsive on mobile devices
- **MOB-02**: Touch-optimized interactions for widgets and cards
- **MOB-03**: Progressive Web App (PWA) capabilities for offline access

### Analytics

- **ANAL-01**: Period comparison analytics (week-over-week, month-over-month)
- **ANAL-02**: Detailed progress insights with drill-down capabilities
- **ANAL-03**: Export reports as PDF or CSV

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Modifying existing feature pages | Risk to working features, maintain stability |
| New backend APIs | Using existing data + mocked recommendations for v1 |
| Social features/leaderboards | College apps are high-stress, avoid comparison anxiety |
| Drag-and-drop customization | Complexity without clear value, most users never customize |
| Real-time everything | Overengineering for v1, static refresh sufficient |
| Mobile-first design | College apps primarily desktop, mobile is v2 |
| User onboarding flow changes | Focus on logged-in dashboard experience |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DASH-01 | Phase 3 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| DASH-04 | Phase 2 | Pending |
| DASH-05 | Phase 2 | Pending |
| DASH-06 | Phase 2 | Pending |
| DASH-07 | Phase 2 | Pending |
| NAV-01 | Phase 1 | Pending |
| NAV-02 | Phase 3 | Pending |
| NAV-03 | Phase 3 | Pending |
| NAV-04 | Phase 2 | Pending |
| NAV-05 | Phase 2 | Pending |
| ROUT-01 | Phase 1 | Pending |
| ROUT-02 | Phase 1 | Pending |
| ROUT-03 | Phase 1 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| UI-03 | Phase 2 | Pending |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-02-23*
*Last updated: 2026-02-23 after roadmap creation*
