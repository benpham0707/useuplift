# Prompt 6: Loading States, Mobile & Polish

> Attach [00-context.md](./00-context.md) with this prompt.

**Prev**: [05 — AI Coach](./05-ai-coach.md) | **Next**: —

---

Add loading states, error handling, mobile responsiveness, and final polish to the Activity Workshop page built in [Prompts 01-05](./01-overview-display.md).

## Loading States

The AI pipeline takes ~5-10 minutes. Show meaningful progress:

1. **Stage progress indicator** that updates as the pipeline runs (stages from `stage3.pipelineCost` — [see type](./00-context.md#stage-3--synthesis)):
   - "Detecting your story..." (Stage 0, ~20s)
   - "Analyzing your activities..." (Stage 1, ~4-5 min)
   - "Generating teaching insights..." (Stage 2, ~2-3 min)
   - "Synthesizing your portfolio..." (Stage 3, ~1-2 min)

2. **Animated score placeholders** — slot-machine style number cycling while waiting for scores. Reuse `RandomizingScore` component — [see props in context](./00-context.md#score--loading-components)

3. **Skeleton loading** for metric tiles and teaching panels

## Error & Empty States

- **Scoring unavailable**: `scoring` field may be `undefined` ([see note in context](./00-context.md#scoring-optional--may-be-undefined)). Show a simple placeholder — don't break anything else
- **Pipeline failure**: Error card with a retry button
- **No activities entered**: Friendly empty state encouraging them to add their first activity
- **Quick encouragement activities**: Show just the celebration card from `stage2.quickEncouragements`, not the full insights tab

## Mobile

- Overview metric tiles ([Prompt 01](./01-overview-display.md)): 2 columns instead of 5
- Split pane ([Prompt 02](./02-split-pane-layout.md)): stack vertically — left pane full width, AI coach via floating button → bottom drawer
- Activity carousel: horizontal scroll with touch support
- Before/after comparisons ([Prompt 04](./04-insights-tab.md)): stack vertically
- Tab toggle: full width at top of left pane

## Navigation

- Clicking activity in carousel switches all content smoothly
- Smooth scroll transitions
- Section IDs for deep linking

## Footer

Small, minimal (data from `stage3.pipelineCost`):
- "Powered by Uplift v4.3 | Analysis: $0.93"
- Collapsible per-stage cost breakdown

## Style

- Blue/indigo primary (distinct from purple PIQ and cyan Portfolio sections)
- Consistent with existing shadcn/ui patterns — [see available components in context](./00-context.md#ui-primitives-shadcnui--all-available)
- Dark mode fully supported
- Smooth transitions (200ms)
