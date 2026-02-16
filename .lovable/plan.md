

## Remove PIQ Carousel Header and 12-Dimension Analysis

### What Gets Removed

**1. Sticky PIQ Carousel Header** (lines 1475-1513)
The entire sticky header bar containing:
- `PIQCarouselNav` component (the prompt switcher with 8 PIQ dots)
- `SaveStatusIndicator` and sign-in warning
- The backdrop-blur bar itself

**2. NQI Score Card / Hero Section** (lines 1517-1860)
The full "Narrative Quality Index" card above the two-column layout, including:
- The analyzing spinner with "Analyzing Your PIQ Essay"
- NQI score display with Strong/Needs Work/Critical counts
- Dimension navigation buttons
- Essay Overview text
- Issues Resolved progress bar

**3. 12-Dimension Analysis Section** (lines 1899-1943)
The entire bottom-left section containing:
- "12-Dimension Analysis" gradient header
- `RubricDimensionCard` list (or the empty-state placeholder)

### What Stays

- The editor (`EditorView`) in the left column
- The AI chat (`ContextualWorkshopChat`) in the right column
- Version history drawers and modals
- Local recovery banner
- All state, hooks, and handler functions (unused ones can be cleaned up later)
- The background gradient

### Result

A clean two-column layout: editor on the left, AI chat on the right -- no PIQ navigation, no NQI scoring, no rubric cards. This gives you a blank canvas to layer in activity-specific UI.

### Technical Details

| Location | Lines | What |
|----------|-------|------|
| `src/pages/ActivityWorkshop.tsx` | 1475-1513 | Remove sticky header with PIQCarouselNav |
| `src/pages/ActivityWorkshop.tsx` | 1516-1860 | Remove NQI score card / hero section |
| `src/pages/ActivityWorkshop.tsx` | 1899-1943 | Remove 12-Dimension Analysis section + header |

All changes are in a single file. The imports and state variables for these removed sections will remain (dead code) but won't cause errors -- they can be cleaned up in a future pass.

