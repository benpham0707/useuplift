

## Activity Workshop — Extracurricular Portfolio Overview Section

### Overview

Build a new page at `/activity-workshop/:sessionId` with the top "portfolio at a glance" hero section. This mirrors the PortfolioScanner hero pattern: gradient background, 5 clickable metric tiles, expandable insights panel, story pitch, context badges, and narrative threads. All data is mock, matching the `ActivityWorkshopPipelineResult` type from the context doc.

---

### Files to Create

**1. `src/pages/ActivityWorkshop.tsx`**
- New page component registered at `/activity-workshop/:sessionId`
- Imports and renders `ActivityPortfolioOverview`
- Uses `useParams` for sessionId
- Minimal shell: full-width layout, no sidebar needed initially

**2. `src/components/portfolio/activity-workshop/ActivityPortfolioOverview.tsx`**
- The main hero section component (self-contained)
- Accepts the full `ActivityWorkshopPipelineResult` as a prop
- Sections (top to bottom):
  - **Header**: "Activity Workshop" title with blue/indigo gradient, archetype badge ("innovator"), confidence bar
  - **Harvard Scale gauge**: Large circular SVG gauge showing 3/6 with "Competitive" label, score-based glow (reuses `getScoreStyles` pattern from PortfolioScanner)
  - **5 Metric Tiles** (2-col mobile, 5-col desktop):
    1. Harvard Scale (3/6)
    2. Coherence (78/100)
    3. Avg Activity Score (7.2/10)
    4. Avg Description Score (5.8/10)
    5. Spike Maturity (emerging)
  - Each tile uses `GradientText` for the score value with tone-based colors (same `toneToColors` pattern)
  - Clicking a tile opens/closes an **insights panel** below (same toggle pattern as PortfolioScanner `handleMetricClick`)
  - **Tier Distribution bar**: Visual horizontal bar showing T1=0, T2=2, T3=2, T4=1 with gold/blue/green/gray colors
  - **Context Badges**: "First-Gen", "Works 20 hrs/week", "Rural" as badges
  - **Story Pitch card**: Prominent blockquote-style card with the 2-sentence pitch from `finalNarrative.story.pitch`
  - **Narrative Threads**: 3 thread cards showing thread name, linked activities, and synergy strength
  - **Top Elevations**: 2 elevation cards showing activity relationships (e.g., grocery -> research [transformative])
  - **Recommended Activity Order**: Numbered list with rank, activity title, reason
  - **Action Plan accordion**: 3 sections (Do Now, Next Months, Long-Term) using Collapsible

**3. `src/components/portfolio/activity-workshop/ActivityMetricTile.tsx`**
- Reusable metric tile component
- Props: `label`, `value`, `maxValue`, `suffix?`, `onClick`, `isSelected`, `ref`
- Uses `GradientText` with tone-based colors
- Hover/selected state styling matching PortfolioScanner `holo-surface` pattern but with blue/indigo theming

**4. `src/components/portfolio/activity-workshop/ActivityInsightsPanel.tsx`**
- Expandable panel that shows detail for the selected metric
- Harvard Scale detail: explanation, what would improve it
- Coherence detail: primary theme, thread breakdown
- Activity Score detail: breakdown of scoring dimensions
- Description Score detail: breakdown of description dimensions
- Spike detail: area, maturity, related activities

**5. `src/components/portfolio/activity-workshop/mockData.ts`**
- All hard-coded mock data matching `ActivityWorkshopPipelineResult`
- Comment at the top: `// HARD-CODED MOCK DATA: Sample ActivityWorkshopPipelineResult representing a first-gen student's portfolio analysis. Replace with real API data when the pipeline endpoint is wired up.`
- Uses the E2E sample values from the prompt (Harvard 3, coherence 78, innovator archetype, etc.)

### Files to Modify

**6. `src/App.tsx`**
- Add route: `<Route path="/activity-workshop/:sessionId" element={<ActivityWorkshop />} />`
- Add lazy import for `ActivityWorkshop`

---

### Design Details

- **Color scheme**: Blue/indigo primary (`from-blue-600 to-indigo-600` gradients), distinct from purple PIQ and cyan Portfolio
- **Tier colors**: Gold (`amber-500`) = Tier 1, Blue (`blue-500`) = Tier 2, Green (`green-500`) = Tier 3, Gray (`gray-400`) = Tier 4
- **Score glow**: Reuse the `getScoreStyles` logic from PortfolioScanner (hue shifts from red -> amber -> green -> blue based on score)
- **Metric tone mapping**: Same `toneToColors` function adapted for 1-6 Harvard Scale and 0-100 coherence
- **Context badges**: `Badge variant="secondary"` with relevant icons (GraduationCap for first-gen, Clock for work hours, MapPin for rural)
- **Story pitch**: Large card with left border accent, italic quote styling, `text-lg` font
- **Narrative threads**: Cards with colored left border based on `strength` (strong=green, emerging=amber, weak=gray)
- **Dark mode**: All colors use Tailwind `dark:` variants
- **Responsive**: 1-col mobile stacking, 2-col tablet, full desktop layout

### Component Hierarchy

```text
ActivityWorkshop (page)
  +-- ActivityPortfolioOverview
       +-- Header (title + archetype badge + confidence)
       +-- Harvard Scale Gauge (SVG circle)
       +-- Metric Tiles Grid (5 tiles)
       |    +-- ActivityMetricTile x5
       +-- ActivityInsightsPanel (collapsible, below tiles)
       +-- Tier Distribution Bar
       +-- Context Badges Row
       +-- Story Pitch Card
       +-- Narrative Threads (3 cards)
       +-- Elevations (2 cards)
       +-- Recommended Order (numbered list)
       +-- Action Plan (3 collapsible sections)
```

### Mock Data Values (from E2E sample)

| Field | Value |
|-------|-------|
| Harvard Scale | 3/6 ("Competitive") |
| Confidence | 78% |
| Archetype | "innovator" |
| Coherence | 78/100 |
| Spike | "Computer Science & Educational Leadership" (emerging) |
| Tier Mix | T1=0, T2=2, T3=2, T4=1 |
| Avg Activity Score | ~7.2 |
| Avg Description Score | ~5.8 |
| Context | First-gen, Works 20 hrs/week, Rural |
| Activities | 5 (research, cs-club, farm, grocery, tutoring) |

