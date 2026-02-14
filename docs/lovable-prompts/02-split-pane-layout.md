# Prompt 2: Activity Carousel + Split-Pane Workshop Layout

> Attach [00-context.md](./00-context.md) with this prompt.

**Prev**: [01 — Overview Display](./01-overview-display.md) | **Next**: [03 — Edit Tab](./03-edit-tab.md)

---

Below the portfolio overview from [Prompt 01](./01-overview-display.md), build the main workshop area where students work on individual activities one at a time.

## What to Replicate

Our PIQ Workshop (`src/pages/PIQWorkshop.tsx`) already has this exact pattern — [see component details in context](./00-context.md#workshop-layout-replicate-for-activity-workshop):

1. **Sticky carousel** at top — cycles through items one at a time
2. **Two-column split pane** below:
   - Left: Content area (scrollable)
   - Right: AI coach chat (sticky, stays visible while left pane scrolls)

We want this identical layout, adapted for extracurricular activities instead of essay prompts.

## Activity Carousel
> Data source: `stage3.orderedActivities` for order, `stage1.activities[id].classification.tier` for tier, `stage1.teachingCandidates` for depth — [see types in context](./00-context.md#stage-3--synthesis)

Adapt our existing `PIQCarouselNav` component — [see props in context](./00-context.md#workshop-layout-replicate-for-activity-workshop):

```
[◀] Machine Learning Research (T2 🔵) [▶]
         ● ● ● ● ●  ← 5 activities
```

Each carousel item shows: activity title + tier badge (T1 gold, T2 blue, T3 green, T4 gray) + teaching depth indicator (deep/medium/quick).

Activities appear in the AI's recommended Common App order from `stage3.orderedActivities`.

## Left Pane — Tab Toggle

Two tabs at the top of the left pane:
- **"Edit"** — Where students edit their activity description (built in [Prompt 03](./03-edit-tab.md))
- **"Insights"** — Where they see all AI analysis and teaching (built in [Prompt 04](./04-insights-tab.md))

Tab state persists when switching activities. Switching activities updates content in whichever tab is active.

## Right Pane — AI Coach
> [See component details and props in context](./00-context.md#ai-coach-chat-reuse-directly)

Reuse our existing `ContextualWorkshopChat` component (`src/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat.tsx`). It already supports extracurricular mode — set `mode="extracurricular"`.

The coach receives the current activity's analysis as context so it can answer questions like "Why is my research only Tier 2?" More details in [Prompt 05](./05-ai-coach.md).

When the student switches activities via carousel, the coach's context updates but conversation history stays.

## Mobile

Stack vertically — left pane full width, AI coach accessible via floating button that opens a bottom drawer.

## Layout

```
┌──────────────────────────────────────────────────┐
│  ◀  Machine Learning Research (T2 🔵)  ▶         │  sticky carousel
│      ● ● ● ● ●                                   │
├────────────────────────┬─────────────────────────┤
│  [Edit] [Insights]     │                         │
│                        │     AI Coach Chat       │
│  (tab content —        │     (sticky, scrolls    │
│   see prompts 03/04)   │      with viewport)     │
│                        │                         │
└────────────────────────┴─────────────────────────┘
```
