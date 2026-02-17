

## Compact Overview Tab — Merge Hero into Score Dashboard

### Overview

Eliminate the separate hero section entirely by merging the overall score into the score dashboard row, then tighten all spacing throughout the Overview tab to achieve news-article density.

### Changes

**1. Merge overall score into score dashboard row (lines 1559-1578)**

Remove the entire hero area block (lines 1630-1644). Instead, add a 6th card at the LEFT of the score dashboard grid — the "OVERALL" card:
- Grid changes from `grid-cols-2 md:grid-cols-5` to `grid-cols-2 md:grid-cols-6`
- The OVERALL card is slightly wider: use `md:col-span-1` but with internal styling that makes the score larger (`text-4xl` vs `text-3xl` for the others) and the label "OVERALL" underneath
- Score shows "7.8" in green, same color logic as other cards
- Below the OVERALL card (outside the button, as two small badges stacked beneath it): Harvard Scale badge and Competitive pill, both in `text-[10px]` tiny text
- The OVERALL card is NOT clickable for expansion (no rationale panel) — it's display-only. Alternatively it could be clickable but just show a summary. Simpler: make it non-expandable, just visual.
- The `expandedScoreCard` index mapping stays the same (0-4 for the 5 dimension cards); the OVERALL card is rendered separately before the `.map()` loop

Implementation approach: Wrap the grid in a structure where the first cell is the OVERALL card (rendered manually) and the remaining 5 come from the `scoreCards.map()`. The expansion panel caret logic stays unchanged since it only references indices 0-4.

**2. Delete hero area block (lines 1630-1644)**

Remove entirely — the centered score + badges block. This saves ~15 lines and a full visual section.

**3. Tighten narrative section (lines 1647-1686)**

- Change `py-2` to `py-1` on the narrative container
- The `mb-2` on the header row stays (it's already small)

**4. Shrink insight cards (lines 1688-1734)**

- Change `p-4` to `p-3` on all three insight cards
- Change `mb-2` to `mb-1` on the header rows inside each card

**5. Reduce overall section gaps**

- Line 1628: `space-y-4` on TabsContent changes to `space-y-3`
- Line 1555: outer `py-8` changes to `py-6`
- Line 1555: outer `space-y-4` changes to `space-y-3`

**6. Compact Strategic Direction (lines 1766-1788)**

- Change `p-5` to `p-3 px-4` on the outer container
- Change `space-y-3` to `space-y-2` inside
- Change coaching pitch inner `p-4` to `p-3`
- Change `mb-2` to `mb-1` on the coaching pitch label
- Change `mb-1` to `mb-0.5` on Current State and Strategic Direction labels

### What Gets Removed

- The entire hero area block (lines 1630-1644): the centered `flex-col items-center` div with the large score, Harvard badge, and Competitive pill

### What Stays the Same

- Score dashboard expansion panel with caret (unchanged logic)
- Tab bar
- All carousel/edit interactivity
- Portfolio narrative content and controls
- Strengths/Opportunities panels
- Two-column workspace below

### Technical Details

| Area | Detail |
|------|--------|
| File | `src/pages/ActivityWorkshop.tsx` only |
| Grid change | `grid-cols-2 md:grid-cols-5` becomes `grid-cols-3 md:grid-cols-6` (3 cols on mobile to fit OVERALL + 2 per row cleanly) |
| OVERALL card | Rendered before the `.map()`, not part of `scoreCards` array, not expandable |
| Harvard/Competitive badges | Rendered as tiny text below the OVERALL card, outside the button element |
| Caret refs | No change — indices 0-4 still map to the 5 dimension cards via `scoreCardRefs` |
| Spacing reductions | `py-8` to `py-6`, `space-y-4` to `space-y-3`, insight `p-4` to `p-3`, strategic direction `p-5` to `p-3 px-4` |
| Lines removed | ~15 (hero block) |
| Lines modified | ~20 (spacing class changes + grid restructure) |

