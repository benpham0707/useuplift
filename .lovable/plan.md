

## Replace Hero Section with Score Dashboard + Tabbed Overview

### Overview

Remove the entire Portfolio Scanner hero clone (metric tiles, portfolio overview card, insight cards, collapsible insights panel, and all associated state/helpers) and replace it with a purpose-built Activity Workshop overview consisting of a Score Dashboard and a 4-tab interface. Only the Overview tab will be fully built; the other 3 tabs will show descriptive placeholders.

### What Gets Removed

**State variables** (lines 207-342): All `hero*` state, refs, mock data, and helper functions:
- `heroSelectedMetric`, `isHeroInsightsOpen`, `heroNarrativeIndex`, `isEditingHeroNarrative`, `heroNarrativeDraft`, `heroNarratives`, `heroUnifyIndex`, `heroProofIndex`, `heroSequenceIndex`, `heroCarrotLeft`
- `heroMetricRefs`, `heroInsightsPanelRef`, `heroOverviewRef`
- `heroMockData`, `heroOverallScore`, `heroStorageKey`
- Functions: `getHoloToneClass`, `toneToColors`, `getHeroMetricTheme`, `handleHeroMetricClick`, `getHeroDisplayValue`, `generateHeroNarrativeVariant`, `persistHeroNarratives`
- Both `useEffect` hooks (narrative init + carrot position)

**Render block** (lines 1618-1906): The entire hero gradient section with metric tiles, portfolio overview card, insight carousels, and collapsible insights panel.

**Unused imports**: `Progress`, `GradientText`, `Collapsible`, `CollapsibleContent` (if not used elsewhere in the file).

### What Gets Added

**1. Score Dashboard** (pinned above tabs, inside the gradient section)

5 glassmorphism cards in a responsive row:

| Card | Score | Rationale (on click) |
|------|-------|---------------------|
| Activity Strength | 7.2 | "Your activities show solid involvement but could benefit from deeper leadership roles and more quantifiable outcomes. Focus on demonstrating initiative rather than just participation." |
| Spike Depth | 8.1 | "Strong concentration in CS with a clear progression from self-teaching to research. The CS Club founding demonstrates initiative. Deepen by publishing work or competing." |
| Story Coherence | 7.8 | "Your activities connect well around a theme of building access from scratch. The thread from personal experience to technical solutions is compelling. Tighten by making the grocery/farm jobs explicitly support the narrative." |
| Major Fit | 6.5 | "CS intent is clear from club and research, but admissions wants to see breadth of intellectual curiosity beyond one domain. A humanities or social science pursuit would strengthen this." |
| Description Quality | 7.4 | "Descriptions are functional but could be more impactful. Lead with outcomes and numbers rather than role descriptions. Every character should earn its place in the 150-char limit." |

Score color coding:
- Green (text-green-500): 8.0+
- Teal (text-teal-500): 6.0-7.9
- Amber (text-amber-500): 4.0-5.9
- Red (text-red-500): below 4.0

Click behavior: accordion-style, one card at a time. Smooth expand/collapse using CSS `transition-all duration-300` with `max-height` and `opacity` animation.

**2. Tab Bar** (4 tabs below score dashboard)

Using the existing Radix `Tabs` component. Labels: "Overview", "Your Story", "Your Edge", "Action Plan" (full name, not truncated).

Placeholder tabs (Your Story, Your Edge, Action Plan) show a descriptive message:
- Your Story: "Your Story -- How your activities weave into a compelling narrative. Coming soon."
- Your Edge: "Your Edge -- Your competitive positioning and school fit analysis. Coming soon."
- Action Plan: "Action Plan -- Exactly what to do next, prioritized by impact. Coming soon."

**3. Overview Tab Content**

**Hero area**: 
- Large overall score badge "7.8 / 10" on the left in a glassmorphism container
- "Harvard Scale 4 -- Average (Top 40%)" badge (corrected from the earlier "Good/Top 15%" error)
- "Competitive" colored pill (teal/blue)

**Portfolio Narrative**:
- "PORTFOLIO NARRATIVE" uppercase label
- Story pitch text (the full CS club sample paragraph from the prompt)
- Pencil edit icon, "Regenerate" button, left/right arrows for variant cycling
- 3 hard-coded variants to cycle through

**Three Quick Insight Cards** in a row:
- "YOUR SPIKE": "CS with Social Impact" + left/right arrows
- "WHAT THEY'LL REMEMBER": "First-gen student who turns resource scarcity into technical solutions" + arrows
- "#1 PRIORITY": "Quantify CS Club impact with specific metrics" + arrows

**Key Strengths and Opportunities** side-by-side panels:
- Left panel "Key Strengths" with green left-border accent:
  - Pioneer initiative in zero-resource environment
  - Clear CS spike with social impact angle  
  - Authentic first-gen narrative
- Right panel "Opportunities to Strengthen" with amber left-border accent:
  - Limited external recognition
  - Some activities feel disconnected from spike
- Stacks vertically on mobile (grid-cols-1 md:grid-cols-2)

**Strategic Direction** at bottom:
- "Current State" paragraph
- "Strategic Direction" paragraph
- "Coaching Pitch" as a visually distinct quoted block: subtle background, left border accent (blue/primary), italic text with quotation marks styling. Uses a blockquote-style card rather than plain paragraph to create the "coach talking to you" feel.

### New State Variables

```text
activeTab              -- string, default "overview"
expandedScoreCard      -- number | null, index of expanded card (null = all collapsed)
narrativeVariantIndex  -- number, default 0
isEditingNarrative     -- boolean
narrativeDraft         -- string
spikeIndex             -- number, carousel index for spike card
memorableIndex         -- number, carousel index for memorable card
priorityIndex          -- number, carousel index for priority card
```

### New Helper

`getScoreColor(score: number)` -- returns tailwind class string based on thresholds (green 8+, teal 6-7.9, amber 4-5.9, red below 4).

### New Imports

`Tabs, TabsList, TabsTrigger, TabsContent` from `@/components/ui/tabs` (already installed).

### What Stays the Same

- The two-column workspace below (EditorView + ContextualWorkshopChat) is completely untouched
- All editor state, autosave, version history, chat, credits logic remain
- The background gradient div remains
- All existing imports that are still used remain

### Technical Details

| Area | Detail |
|------|--------|
| File modified | `src/pages/ActivityWorkshop.tsx` only |
| Lines removed | ~135 lines of hero state/helpers (207-342), ~290 lines of hero render (1618-1906) |
| Lines added | ~8 state vars, 1 helper, ~250 lines of new render |
| All sample data | Hard-coded with `// ---- Hard-coded mock data ...` comment blocks per project conventions |
| Score card animation | `transition-all duration-300` on expand/collapse with `overflow-hidden` |
| Harvard Scale | Correctly labeled: "Harvard 4 -- Average (Top 40%)" |
| Tab labels | Full names: "Overview", "Your Story", "Your Edge", "Action Plan" |
| Placeholder tabs | Descriptive one-liner + "Coming soon" |
| Coaching Pitch | Blockquote-style card with left border accent and italic styling |
| Mobile responsive | Score cards wrap 2-col on small screens, strength/opportunity panels stack vertically |

