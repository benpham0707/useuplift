# Phase 1: Routing Foundation - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Dashboard Home is accessible at /dashboard as the default landing page for authenticated users. Establishes routing infrastructure, navigation integration, and initial loading experience. Creating actual dashboard widgets and data connections are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Route Transition Behavior
- Smooth cutover — users simply land on Dashboard Home next login
- Show one-time "Welcome to your new dashboard!" dismissible banner
- /dashboard route shows Dashboard Home, Scanner moves to /dashboard/scanner
- Auto-redirect old Scanner bookmarks to new location
- Quick-launch cards navigate to full routes (URL changes to /dashboard/scanner etc.)

### Loading Experience
- Skeleton screen while Dashboard Home loads (prevents layout shift)
- Full fidelity skeleton — exact shapes for cards, circles for avatars, lines for text
- Natural timing — show skeleton only while actually loading, no artificial delay
- Shimmer effect animation (subtle left-to-right like Facebook)

### Navigation Integration
- "Home" appears as very first item in sidebar
- House icon (classic home shape)
- Match existing active state highlighting style
- Text label: "Home" (simple and clear)

### Existing Route Handling
- All features become sub-routes: /dashboard/scanner, /dashboard/insights, /dashboard/workshop
- Pricing moves to /dashboard/pricing (part of app)
- Settings becomes /dashboard/settings (part of authenticated app)
- Full routes shown in URL bar (/dashboard/scanner visible to users)

### Claude's Discretion
- Exact shimmer animation implementation
- Welcome banner design and dismissal mechanism
- Specific redirect HTTP codes and implementation
- Error handling for failed route transitions

</decisions>

<specifics>
## Specific Ideas

- "Welcome to your new dashboard!" banner should be friendly and dismissible
- Shimmer effect like Facebook's loading placeholders
- Keep navigation simple with just "Home" label, not "Dashboard Home"
- All routes nested under /dashboard for consistency

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-routing-foundation*
*Context gathered: 2026-02-23*