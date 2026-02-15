

## Clone PIQ Workshop Layout for Activity Workshop

### Current State
The Activity Workshop page (`src/pages/ActivityWorkshop.tsx`) is 20 lines of code that just renders a portfolio overview card with mock data. It has no editor, no split-pane layout, no carousel, no chat, and no analysis UI.

The PIQ Workshop (`src/pages/PIQWorkshop.tsx`) is a 2,272-line fully-featured workshop with:
- Sticky carousel navigation (PIQCarouselNav) with dot indicators
- Hero section with NQI score card, analysis loading state, and overview
- Two-column split pane: Editor + Rubric (left) / AI Coach Chat (right)
- Version history, autosave, local recovery
- Credits system integration
- Full backend analysis pipeline

### Plan

**Phase 1: Create Activity Carousel Nav** (new file)

Create `src/components/portfolio/activity-workshop/ActivityCarouselNav.tsx` -- a clone of `PIQCarouselNav.tsx` adapted for activities instead of PIQ prompts:
- Instead of 8 PIQ prompts, iterate over the activities from mock data (`stage3.orderedActivities`)
- Each item shows: activity title + tier badge (T1 gold, T2 blue, T3 green, T4 gray)
- Same chevron arrows, pipe separators, dropdown popover, and dot indicators
- Blue/indigo color scheme instead of purple (per the design system)

**Phase 2: Rewrite ActivityWorkshop.tsx** (complete rewrite)

Clone the structure of `PIQWorkshop.tsx` into `ActivityWorkshop.tsx`, adapting for activities:

| PIQ Workshop Feature | Activity Workshop Equivalent |
|---|---|
| `PIQCarouselNav` (8 PIQ prompts) | `ActivityCarouselNav` (N activities from mock data) |
| Essay editor (`EditorView`) | Same `EditorView` for 150-char activity description |
| NQI score card | Activity score card (from `scoring.activityScores[]`) |
| 12-Dimension rubric | Activity-specific analysis (tier, strengths, improvements) |
| `ContextualWorkshopChat` mode="piq" | `ContextualWorkshopChat` mode="extracurricular" |
| `SaveStatusIndicator` / autosave | Same components, reused directly |
| Version history drawer | Same component, reused directly |
| Credits check before analysis | Same pattern, reused directly |

The page will use mock data initially (no backend wiring), with analysis results and scores pre-populated from `MOCK_DATA` rather than calling an API.

**Phase 3: Wire Up Routing** (minor edit)

The route `/activity-workshop/:sessionId` already exists in `App.tsx` -- no changes needed.

### Files to Create/Modify

| File | Action |
|---|---|
| `src/components/portfolio/activity-workshop/ActivityCarouselNav.tsx` | Create -- clone of PIQCarouselNav for activities |
| `src/pages/ActivityWorkshop.tsx` | Rewrite -- clone PIQ Workshop layout with activity data |

### What Gets Kept

The existing activity workshop components (`ActivityPortfolioOverview.tsx`, `ActivityMetricTile.tsx`, `ActivityInsightsPanel.tsx`, `mockData.ts`) remain untouched. The overview can be integrated into the hero section later, but this phase focuses on getting the exact PIQ Workshop shell working with activity data.

### What It Will Look Like

```text
+----------------------------------------------------------+
|  < Machine Learning Research (T2) >    [Save Status]      |  sticky carousel
|       * * * * *                                           |  (blue/indigo theme)
+---------------------------+------------------------------+
| [Edit] [Insights]         |                              |
|                           |   AI Coach Chat              |
| Activity description      |   (ContextualWorkshopChat    |
| editor (150 chars)        |    mode="extracurricular")   |
|                           |                              |
| Activity Analysis         |   Sticky right pane          |
| - Tier badge              |                              |
| - Strengths/improvements  |                              |
| - Score breakdown         |                              |
+---------------------------+------------------------------+
```

### Technical Notes

- The rewrite uses mock data throughout with clear comments marking all hard-coded values
- Authentication, autosave, and version history will be stubbed (no-op) since there is no activity-specific database table yet
- The `ContextualWorkshopChat` component already supports `mode="extracurricular"` so the AI coach works immediately
- Color scheme uses blue/indigo gradients (`from-blue-600 to-indigo-600`) instead of purple, per the activity workshop design system
