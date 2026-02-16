

## Plan: Exact Clone of PIQ Workshop into Activity Workshop

### What This Does

Replace the current `src/pages/ActivityWorkshop.tsx` (432 lines of adapted code that "looks terrible") with a **verbatim copy** of `src/pages/PIQWorkshop.tsx` (2,272 lines). No adaptations, no color changes, no renaming — just a straight copy.

### Why

The current Activity Workshop attempted to adapt the PIQ Workshop's layout but diverged significantly in structure, styling, and functionality. Rather than trying to fix the adapted version, we start from an exact copy of the working PIQ Workshop and make incremental changes from there.

### What Changes

| File | Action |
|------|--------|
| `src/pages/ActivityWorkshop.tsx` | **Complete rewrite** — replace with exact copy of `PIQWorkshop.tsx` |

### What Stays the Same

- All imports, state, hooks, handlers, and JSX from `PIQWorkshop.tsx` are copied as-is
- The PIQ carousel nav, NQI score card, 12-dimension rubric, editor, chat — everything identical
- The only change: the component is named `ActivityWorkshop` instead of `PIQWorkshop`, and the route param uses `sessionId` (existing route) while the PIQ-specific `piqNumber` param still works as-is since it defaults to `piq1`

### What This Means

When you visit `/activity-workshop/:sessionId`, you will see the **exact same page** as the PIQ Workshop — same purple gradients, same PIQ carousel with 8 prompts, same NQI score card, same editor, same chat in PIQ mode. It will be functionally identical.

From there, you can tell me exactly what to change one piece at a time (swap carousel for activities, change colors, switch chat mode, etc.).

### Technical Notes

- The file will have `// @ts-nocheck` at the top (same as PIQ Workshop) since it has many integration points
- All PIQ-specific imports (PIQCarouselNav, UC_PIQ_PROMPTS, analyzePIQEntry, piqDatabaseService, usePIQEssay, etc.) are kept as-is
- The existing `ActivityCarouselNav.tsx` component remains available but won't be used until you decide to swap it in
- Authentication, autosave, version history, credits — all work identically since they use the same services

