

## Clone Portfolio Scanner Hero Section into Activity Workshop

### What Gets Added

The entire hero overview section from the Portfolio Scanner will be cloned verbatim into `src/pages/ActivityWorkshop.tsx`, placed above the existing two-column editor/chat grid. This includes:

1. **Hero gradient container** with the "Portfolio Dashboard" header, subtitle, and preview mode badge
2. **Profile Completion bar** (progress indicator with percentage)
3. **Five Key Metric tiles** (Impact & Leadership, Academic Performance, Intellectual Curiosity, Storytelling, Character & Community) with animated gradient text and click-to-expand behavior
4. **Portfolio Overview card** (narrative summary, editable portfolio narrative with carousel, and the three insight cards: Unify, Make Proof Visible, Sequence)
5. **Collapsible Insights panel** that expands when a metric tile is clicked, showing dimension-specific insights with a carrot indicator

### What Changes

All changes are in a single file: `src/pages/ActivityWorkshop.tsx`

**New state variables** needed to support the hero:
- `selectedMetric`, `isInsightsOpen` -- metric tile click behavior
- `narrativeIndex`, `isEditingNarrative`, `narrativeDraft`, `narratives` -- narrative carousel
- `unifyIndex`, `proofIndex`, `sequenceIndex` -- insight card carousels
- `carrotLeft` -- carrot position for insights panel
- `overallProgress` -- profile completion percentage
- Mock rubric scores and overall score (hard-coded, matching Portfolio Scanner preview values)
- Refs: `metricRefs`, `insightsPanelRef`, `overviewRef`

**New imports**: `Collapsible`, `CollapsibleContent`, `Textarea`, `CardHeader`, `CardTitle`, `CardContent`, plus additional lucide icons (`Pencil`, `Check`, `ChevronLeft`, `ChevronRight`, `Sparkles`, etc.)

**New helper functions** copied from Portfolio Scanner:
- `getHoloToneClass()` / `toneToColors()` -- color mapping by score
- `getMetricTheme()` -- gradient CSS for metric themes
- `handleMetricClick()` -- toggle insights panel
- `generateNarrativeVariant()` -- narrative text generation
- `persistNarratives()` -- localStorage persistence

**Layout change**: The hero section is inserted between the background gradient div and the two-column grid container, spanning full width above both columns.

### What Stays the Same

- The two-column layout (EditorView left, ContextualWorkshopChat right) is untouched
- All existing state, version history, autosave, and chat logic remains
- The "Coming Soon" banner is NOT copied (it's Portfolio Scanner-specific)

### Technical Details

| Area | Detail |
|------|--------|
| File | `src/pages/ActivityWorkshop.tsx` |
| Insert location | After the background gradient div (line 1473), before the grid container (line 1474) |
| Mock data | Hard-coded scores (impact: 8.2, academic: 8.1, curiosity: 7.6, story: 7.8, character: 7.3, progress: 67%) with comment annotation per project conventions |
| New state vars | ~12 new useState calls + 3 useRef calls |
| New helpers | ~6 functions cloned from PortfolioScanner |
| CSS dependencies | Uses existing `hero-gradient`, `holo-surface`, `holo-sheen`, `elev-strong`, `elev-hover`, `text-hero-contrast` classes already in the project |

This gives you an exact replica of the Portfolio Scanner overview as a starting point, ready to be customized for activity-specific metrics in subsequent iterations.
