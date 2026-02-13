# Prompt 6: Loading States, Mobile, Polish

> Attach `00-context.md` with this prompt.

---

Add loading states, error handling, mobile responsiveness, and final polish to the Activity Workshop page.

## Loading States

The AI pipeline takes ~5-10 minutes. Show progress:

1. **Stage progress indicator** that updates as pipeline runs:
   - "Detecting your story..." (Stage 0, ~20s)
   - "Analyzing your activities..." (Stage 1, ~4-5 min)
   - "Generating teaching insights..." (Stage 2, ~2-3 min)
   - "Synthesizing your portfolio..." (Stage 3, ~1-2 min)

2. **Animated score placeholders** — reuse `RandomizingScore` from `src/components/portfolio/piq/workshop/RandomizingScore.tsx` (slot-machine number cycling while waiting)

3. **Skeleton loading** for metric tiles and teaching panels

## Error & Empty States

- **Scoring unavailable**: If `scoring` is undefined, show "Scoring not available" placeholder — don't break anything else
- **Pipeline failure**: Error card with retry button
- **No activities entered**: Empty state encouraging them to add their first extracurricular
- **Quick encouragement activities**: Show just the celebration card, not the full insights tab

## Mobile

- Overview metric tiles: 2 columns instead of 5
- Split pane: Stacks vertically — left pane full width, AI coach via floating button → bottom drawer
- Activity carousel: Horizontal scroll with touch
- Before/After comparisons: Stack vertically
- Tab toggle: Full width at top of left pane

## Navigation

- Clicking activity in carousel → switches all content smoothly
- Smooth scroll transitions
- Section IDs for deep linking

## Footer

Small, minimal:
- "Powered by Uplift v4.3 | Analysis: $0.93"
- Collapsible per-stage cost breakdown

## Style

- Blue/indigo primary (distinct from purple PIQ and cyan Portfolio)
- Consistent with existing shadcn/ui patterns
- Dark mode fully supported
- Smooth transitions (200ms)
