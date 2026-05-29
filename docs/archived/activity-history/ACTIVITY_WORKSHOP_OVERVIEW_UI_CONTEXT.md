# Activity Workshop Overview — UI/UX Context for Lovable

> This document maps every backend output field to its exact location in the Overview UI.
> The overview shows portfolio-level insights — NOT individual activity analysis cards.

---

## What This Page Is

After a student submits their extracurricular activities (up to 10), our AI analyzes them. The results page has two parts:
1. **Overview section** (THIS — how activities work together as a portfolio)
2. **Individual activity cards** (separate, not covered here)

---

## Navigation Structure

**Score Dashboard** — always pinned at top, above everything
**Below the dashboard** — 4 tabs:

| Tab | Name | Default |
|-----|------|---------|
| 1 | **Overview** | Selected on load |
| 2 | **Your Story** | — |
| 3 | **Your Edge** | — |
| 4 | **Action Plan** | — |

Each tab scrolls independently. Score dashboard stays visible when switching tabs.

---

## Score Dashboard (Always Pinned)

Five score cards in a horizontal row. Each card shows a score (1-10) and a label.

| Card | Label | Source Field | What It Measures |
|------|-------|-------------|------------------|
| 1 | Activity Strength | `scoringRubric.breakdown.tierDistribution.score` | Quality distribution (Tier 1-4) |
| 2 | Spike Depth | `scoringRubric.breakdown.spikeDetection.score` | Focused area of exceptional depth |
| 3 | Story Coherence | `scoringRubric.breakdown.coherence.score` | Do activities tell a unified story? |
| 4 | Major Fit | `scoringRubric.breakdown.majorAlignment.score` | Alignment with intended major |
| 5 | Description Quality | `scoringRubric.breakdown.presentationQuality.score` | How well descriptions are written |

**Interaction:** Clicking a score card opens a detail panel (like Image 2 in current template) showing:
- **Rationale**: `scoringRubric.breakdown.[dimension].rationale` (the full explanation paragraph)
- **Related improvements**: Filtered from `scoringRubric.prioritizedRecommendations[]` where the recommendation text relates to that dimension

**Score color coding:** Green (8+), Teal/Blue (6-7.9), Yellow/Amber (4-5.9), Red (<4)

---

## Tab 1: Overview (Default View)

This is what the student sees first. It's the "executive summary" of everything.

### Hero Area (top of tab)

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| Overall Score | `scoringRubric.overallScore.total` | Large number badge, e.g. "7.8 / 10" |
| Harvard Scale | `synthesis.finalAssessment.harvardScale` | Label badge, e.g. "Harvard 3 — Good (Top 15%)" |
| Strength Level | `synthesis.finalAssessment.overallStrength` | Colored badge: "Competitive" / "Strong" / etc. |

Layout: Score on the left, Harvard Scale + Strength as badges next to it.

### Portfolio Narrative (below hero)

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| "PORTFOLIO NARRATIVE" label | — | Section header |
| Story pitch | `narrative.story.pitch` | 2-3 sentence paragraph, main text |
| Edit/Regenerate controls | — | Pencil icon + "Regenerate" button (right side) |

This is the student's "elevator pitch" — the most important paragraph in the overview.

### Three Quick Insight Cards (row of 3 below narrative)

| Card | Label | Source Field | Content |
|------|-------|-------------|---------|
| Left | "YOUR SPIKE" | `narrative.spike.primarySpike.area` | Spike area name (e.g. "CS with Social Impact") |
| Center | "WHAT THEY'LL REMEMBER" | `narrative.positioning.memorableElement` | One sentence about what's memorable |
| Right | "#1 PRIORITY" | `synthesis.actionPlan.immediate[0].action` | Top action item text |

Each card should have left/right arrows to cycle through variants:
- YOUR SPIKE: cycle through `supportingElements` as secondary info
- WHAT THEY'LL REMEMBER: cycle through `positioning.differentiators[]`
- \#1 PRIORITY: cycle through `synthesis.actionPlan.immediate[]`

### Key Strengths & Gaps (below insight cards)

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| Key Strengths | `scoringRubric.keyStrengths[]` | Green-tinted list items (3-5 bullets) |
| Key Gaps | `scoringRubric.keyGaps[]` | Amber-tinted list items, framed as "opportunities" |

Display side-by-side on desktop, stacked on mobile. Use encouraging language — "Opportunities to Strengthen" not "Weaknesses".

### Strategic Direction (bottom of tab)

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| Current State | `teachingSummary.currentState` | Short paragraph |
| Strategic Direction | `teachingSummary.strategicDirection` | Short paragraph |
| Coaching Pitch | `teachingSummary.twoSentencePitch` | Emphasized/quoted paragraph |

This is the "coach's summary" — what should you focus on overall.

---

## Tab 2: Your Story

This tab goes deep into HOW the student's activities connect into a narrative.

### Your Unique Angle (top of tab)

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| "What Makes You Unique" | `narrative.story.uniqueAngle` | Paragraph |
| "Why It Matters" | `narrative.story.whyItMatters` | Paragraph |
| Character Traits | `narrative.story.emergentTraits[]` | Row of colored tag chips (e.g. "Resilient", "Innovative") |

### Narrative Threads (collapsible section, default expanded)

2-4 thread cards. Each card shows:

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| Thread Name | `narrative.threads[i].name` | Card title (e.g. "Building Access Where None Exists") |
| Connected Activities | `narrative.threads[i].activityIds[]` | Row of small activity name tags/chips |
| How They Connect | `narrative.threads[i].synergy` | Paragraph explaining the synergy |
| Why It Matters | `narrative.threads[i].admissionsValue` | Smaller text below synergy |

### Activity Elevations (collapsible section, default collapsed)

3-5 elevation pairs. Each shows:

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| Pair visual | `narrative.elevations[i].elevatingActivityId` → `elevatedActivityId` | "Research → CS Club" with arrow |
| Strength badge | `narrative.elevations[i].strength` | Colored badge: transformative (purple), strong (green), moderate (blue), subtle (gray) |
| How it works | `narrative.elevations[i].mechanism` | Paragraph |

### Spike Deep Dive (collapsible section, default collapsed)

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| Spike Area | `narrative.spike.primarySpike.area` | Large text header |
| Depth Evidence | `narrative.spike.primarySpike.depth` | Paragraph |
| What Makes It Stand Out | `narrative.spike.primarySpike.distinctiveness` | Paragraph |
| Supporting Activities | `narrative.spike.supportingElements[]` | List: activity name + how it supports |
| Complementary Breadth | `narrative.spike.complementaryBreadth[]` | Cards: breadth area + activities + why it matters |

### Coherence (collapsible section, default collapsed)

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| Coherence Score | `narrative.coherence.score` | Visual ring/bar out of 100 |
| Assessment Label | `narrative.coherence.assessment` | Badge (e.g. "Strong") |
| What Ties It Together | `narrative.coherence.unifyingElement` | Paragraph |
| Outlier Activities | `narrative.coherence.outliers[]` | Each shows activity name + how to integrate |

---

## Tab 3: Your Edge

This tab covers competitive positioning and school fit.

### What Sets You Apart (top of tab)

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| Differentiators | `narrative.positioning.differentiators[]` | Card list or bullet list |
| Strengths | `narrative.positioning.strengths[]` | Card list or bullet list |
| Memorable Element | `narrative.positioning.memorableElement` | Highlighted/quoted text |
| School Types That Fit | `narrative.positioning.schoolFit[]` | Row of tag chips |

### School Fit Cards (only when target schools were provided)

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| School Name | `synthesis.schoolFitSummary[i].school` | Card header (e.g. "MIT") |
| Fit Level | `synthesis.schoolFitSummary[i].fitLevel` | Colored badge: excellent (green), good (blue), moderate (yellow), challenging (red) |
| Key Strengths | `synthesis.schoolFitSummary[i].keyStrengths[]` | Green bullet list |
| Key Concerns | `synthesis.schoolFitSummary[i].keyConcerns[]` | Amber bullet list |

### Gaps & Opportunities (collapsible, default collapsed)

Framed positively — "Where You Can Grow", NOT "Weaknesses".

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| Gap | `narrative.gaps[i].gap` | Title text |
| How You're Already Addressing It | `narrative.gaps[i].existingMitigation` | Paragraph |
| Positive Framing | `narrative.gaps[i].positiveFraming` | Emphasized paragraph |
| Fixable in Description? | `narrative.gaps[i].addressableThroughDescription` | Small tag: "Can improve in descriptions" or hidden |

---

## Tab 4: Action Plan

This tab tells the student exactly what to do.

### Action Plan (top of tab, main content)

Three sub-sections within this tab (collapsible, all default expanded):

**"Do Now" section:**

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| Action | `synthesis.actionPlan.immediate[i].action` | Bold action title |
| Why | `synthesis.actionPlan.immediate[i].impact` | Paragraph explaining impact |
| Connected Activity | `synthesis.actionPlan.immediate[i].activityId` | Small activity tag (optional) |

**"Next 1-3 Months" section:**

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| Action | `synthesis.actionPlan.shortTerm[i].action` | Bold action title |
| Why | `synthesis.actionPlan.shortTerm[i].impact` | Paragraph |
| Deadline | `synthesis.actionPlan.shortTerm[i].deadline` | Small deadline tag (optional) |
| Connected Activity | `synthesis.actionPlan.shortTerm[i].activityId` | Small activity tag (optional) |

**"Long-term" section:**

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| Action | `synthesis.actionPlan.longTerm[i].action` | Bold action title |
| Why | `synthesis.actionPlan.longTerm[i].impact` | Paragraph |
| Connected Activity | `synthesis.actionPlan.longTerm[i].activityId` | Small activity tag (optional) |

### Recommended Activity Order (collapsible section below action plan)

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| Rank Number | `synthesis.orderedActivities[i].rank` | Large number (1-10) |
| Activity Name | `synthesis.orderedActivities[i].activityTitle` | Title text |
| Why This Position | `synthesis.orderedActivities[i].reason` | Paragraph |
| Optimized Description | `synthesis.orderedActivities[i].finalDescription` | Monospace/code-style text block |
| Character Count | `synthesis.orderedActivities[i].characterCount` | Small label: "139/150 chars" |

### Closing Message (always visible at bottom of this tab)

| UI Element | Source Field | Display |
|-----------|-------------|---------|
| Celebration | `synthesis.finalMessage.celebration` | Warm paragraph |
| Key Takeaway | `synthesis.finalMessage.keyTakeaway` | Highlighted/bold text |
| Closing | `synthesis.finalMessage.closing` | Final encouraging sentence |

---

## Design System

- **Gradient background**: purple → blue → teal (keep from current template)
- **Score colors**: Green (#10B981 for 8+), Teal (#06B6D4 for 6-7.9), Amber (#F59E0B for 4-5.9), Red (#EF4444 for <4)
- **Card style**: Glassmorphism — semi-transparent white with backdrop blur, subtle border
- **Typography**: Score numbers large and bold (green), section headers uppercase and small, body text regular
- **Tags/Chips**: Rounded pills with colored backgrounds (match activity categories)
- **Collapsible sections**: Chevron icon, smooth expand/collapse animation
- **Mobile**: All rows stack vertically, tabs become horizontally scrollable

---

## Example Data (for prototyping)

```
Overall Score: 7.8/10
Harvard Scale: 4 (Average — Top 40%)
Strength: "competitive"

Dimension Scores:
  Activity Strength: 6.2
  Spike Depth: 7.0
  Story Coherence: 7.8
  Major Fit: 8.1
  Description Quality: 5.5

Story Pitch: "This student built a CS club from scratch in a school with zero STEM infrastructure while working 20 hours weekly at a grocery store, then leveraged that self-taught foundation to land remote ML research analyzing rural healthcare access—turning personal experience with resource scarcity into technical expertise that addresses it."

Spike: "Computer Science with Social Impact Focus"
Coherence: 78/100, "strong"
Memorable Element: "First-gen student who turns resource scarcity into technical solutions"

Threads:
  1. "Building Access Where None Exists" — cs-club, research, tutoring
  2. "Responsibility Under Constraint" — grocery, farm, cs-club, research
  3. "Self-Directed Technical Growth" — cs-club, research, farm

Elevations:
  grocery → research [transformative]
  research → cs-club [strong]
  farm → research [strong]

Key Strengths:
  - Pioneer initiative in zero-resource environment
  - Clear CS spike with social impact angle
  - Authentic first-gen narrative

Key Gaps:
  - Limited external recognition/awards
  - Some activities feel disconnected from spike

Immediate Actions:
  1. Quantify CS Club impact with specific metrics
  2. Clarify research role and output
  3. Document tutoring outcomes with grade data

Ordered Activities:
  1. CS Club (most impactful)
  2. ML Research
  3. Math & Science Tutor
  4. Family Farm Work
  5. Grocery Store Associate
```

---

## What to Avoid

- Don't show raw field names — use friendly display labels
- Don't show metadata (timestamps, model names, costs, tokens)
- Don't show confidence percentages — use qualitative labels ("Strong", "Competitive")
- Don't overwhelm — collapsible sections, progressive disclosure
- Don't make gaps feel negative — always frame as opportunities
- Don't duplicate: if story pitch is in Tab 1, don't repeat it in Tab 2
