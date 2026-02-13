# Prompt 2: Activity Carousel + Split-Pane Workshop Layout

> Attach `00-context.md` with this prompt.

---

Below the portfolio overview we just built, add the main workshop area. This replicates our PIQ Workshop layout exactly.

## What to Copy

Our `src/pages/PIQWorkshop.tsx` has this structure:
1. **Sticky carousel nav** at top — cycles through PIQ prompts
2. **Two-column split pane** below:
   - Left: Essay editor + rubric dimensions
   - Right: AI coach chat (sticky, stays visible while left scrolls)

We want the identical layout, adapted for extracurricular activities:
1. **Sticky activity carousel** — cycles through the student's activities
2. **Two-column split pane:**
   - Left: **Tab toggle** between "Edit" (description editor) and "Insights" (AI teaching)
   - Right: **AI coach chat** (reuse `ContextualWorkshopChat` component)

## Activity Carousel

Adapt `PIQCarouselNav` (at `src/components/portfolio/piq/workshop/PIQCarouselNav.tsx`). Instead of PIQ prompts, show activities:

```
[◀] | Machine Learning Research (T2) | [▶]
[●][●][●][●][●]  ← dot indicators for 5 activities
```

Each carousel item shows: activity title + tier badge (T1 gold, T2 blue, T3 green, T4 gray) + teaching depth (deep/medium/quick icon).

Ordered by the recommended Common App order from `stage3.orderedActivities`:
1. Machine Learning Research — Tier 2, deep
2. CS Club Founder — Tier 2, quick (already strong)
3. Family Farm Work — Tier 3, deep
4. Grocery Store Associate — Tier 3, medium
5. Math & Science Tutor — Tier 4, deep

## Left Pane Tab Toggle

Two tabs at the top of the left pane:
- **"Edit"** — Where they see and edit their extracurricular description
- **"Insights"** — Where they see all the AI analysis and teaching

Tab state persists when switching activities. Switching activities updates the content in whichever tab is active.

## Right Pane — AI Coach

Reuse `ContextualWorkshopChat` from `src/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat.tsx`. Set `mode="extracurricular"`. Pass:
- The current activity data
- The full analysis/teaching results for context
- Student context (target schools, major, constraints)

When the student switches activities via carousel, the coach's context updates.

## Layout

```
┌──────────────────────────────────────────────────┐
│  ◀  Machine Learning Research (T2 🔵)  ▶         │  sticky carousel
│      ● ● ● ● ●                                   │
├────────────────────────┬─────────────────────────┤
│  [Edit] [Insights]     │                         │
│                        │     AI Coach Chat       │
│  (tab content here     │     (sticky, scrolls    │
│   — built in next      │      with viewport)     │
│   prompts)             │                         │
│                        │                         │
└────────────────────────┴─────────────────────────┘
```

Mobile: Stack vertically. Coach accessible via floating button → bottom drawer.
