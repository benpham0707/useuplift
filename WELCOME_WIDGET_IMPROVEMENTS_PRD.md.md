# PRD: Welcome + Profile Progress Widget — Design Improvements

## Overview

The Welcome + Profile Progress widget is functional but needs design and layout refinements. This PRD describes specific changes to make the widget feel cohesive, compact, and motivating. This is a refinement pass — do NOT rebuild from scratch. Modify the existing component.

## Important: Codebase Discovery

Before making any changes, read the existing Welcome + Profile Progress widget component and the `useProfileCompletion` hook (or whatever it's currently named) to understand the current implementation. Also read the dashboard page to understand how the widget is placed. Do not assume file names — explore `src/components/` and `src/hooks/` to find them.

---

## Change 1: Side-by-Side Layout (Greeting Left, Ring Right)

**Problem:** The greeting, ring, and CTA are stacked vertically, creating a tall widget with wasted horizontal space. The ring floats in the center with empty space on both sides.

**Fix:** Restructure the widget into a horizontal layout.

**New layout structure:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Good evening, Ben!              ┌──────────┐       │
│  Thu, Mar 19, 2026               │          │       │
│                                  │   20%    │       │
│  ● Quick Start  ✓                │          │       │
│  ○ Activities                    └──────────┘       │
│  ○ Academic Details              Profile Complete    │
│  ○ Interest Deep-Dive            1 of 5 done        │
│  ○ Goals & Constraints                              │
│                                                     │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                     │
│  Up next: Activities & Experience                   │
│  Add your activities to unlock portfolio analysis   │
│                                 Complete Now · ~10 min → │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Implementation:**
- Top section: Use `flex` with `justify-between` — left column for greeting + section checklist, right column for ring + label
- Left column takes roughly 55-60% width, right column 40-45%
- On mobile (below 640px): stack vertically — greeting on top, ring below, then checklist, then CTA. But on desktop/tablet the side-by-side layout should hold.
- Below the top section: a subtle separator (1px border or light gray line with some vertical margin), then the CTA section

---

## Change 2: Add Section Progress Checklist

**Problem:** "1 of 5 sections done" gives no indication of which section is done or what the remaining sections are. The student can't see the full journey.

**Fix:** Add a compact vertical checklist below the greeting showing all sections with their completion status.

**Design:**
- Each section is a single row: status icon + section name
- Completed sections: filled circle (or checkmark) in green/brand color + section name with normal weight
- Incomplete sections: empty circle outline in muted gray + section name in muted/secondary text color
- The next recommended section (highest priority incomplete) should be visually highlighted — slightly bolder text or a subtle accent color on the circle to indicate "this is next"
- Font size: small (12-13px / `text-xs` or `text-sm` in Tailwind) — this checklist should be compact, not dominate the widget
- Spacing: tight — maybe 4-6px gap between rows. This is a glanceable status list, not a detailed breakdown.

**Section labels (use whatever labels the hook currently returns, but aim for these):**
- Quick Start
- Activities & Experience
- Academic Details
- Interest Deep-Dive
- Goals & Constraints

If the hook currently tracks a 6th section (Personality & Work Style), include it. Match whatever the hook returns.

---

## Change 3: Unify the CTA Into the Same Card

**Problem:** The CTA area currently renders as a separate card below the main widget, making it feel detached.

**Fix:** Pull the CTA inside the same card component as the greeting and ring.

**Design:**
- Add a subtle horizontal divider (light gray border or `border-t` in Tailwind) between the top section (greeting + ring) and the CTA section
- The divider should have vertical breathing room — `my-4` or similar
- CTA section layout: left-aligned text with the button right-aligned, or text above button
- Section name in semibold, description below in secondary text color
- Button: "Complete Now · ~10 min →" — combine the time estimate INTO the button or immediately next to it, not floating separately
- If all sections are complete, replace the entire CTA area with a subtle success message: "Your profile is complete — all recommendations are fully personalized." with a small checkmark or sparkle icon. Keep it understated, not a party.

---

## Change 4: Polish the Progress Ring

**Problem:** The gray background track is heavy and the percentage text doesn't command enough attention.

**Fix:**

- **Lighten the track:** The unfilled portion of the ring should be a very light gray — close to the card background, not a mid-gray. Something like `#E5E7EB` in light mode or equivalent Tailwind gray-200.
- **Percentage text:** Make the number bolder and slightly larger. It should be the most prominent element in the ring. Use `text-3xl` or `text-4xl` with `font-bold`. The "%" symbol can be smaller (`text-lg`) and lighter weight next to it.
- **Ring size:** The ring can be slightly smaller than it currently is since it's now sharing horizontal space with the greeting. Aim for around 100-120px diameter.
- **Animation:** If it doesn't already animate on mount, add a CSS transition that fills the ring from 0 to the actual percentage over ~800ms with an ease-out curve. This is done via transitioning `stroke-dashoffset`.
- **"Profile Complete" and "1 of 5 done" labels:** These sit below the ring, center-aligned. Keep them compact — `text-sm` for "Profile Complete" in secondary text, `text-xs` for the count.

---

## Change 5: Responsive Behavior

**Mobile (below 640px):**
- Stack everything vertically: greeting → ring (centered) → section checklist → divider → CTA
- Ring can be slightly smaller on mobile (~90-100px)
- Full-width CTA button

**Tablet and Desktop (640px+):**
- Side-by-side: greeting + checklist on left, ring on right
- CTA section below with divider, text left / button right

Use Tailwind responsive prefixes (`sm:`, `md:`) to handle this. Don't create separate mobile/desktop components.

---

## What NOT to Change

- Don't change the `useProfileCompletion` hook logic (section definitions, weights, priority order) — that's working correctly
- Don't change how data is fetched from Supabase
- Don't change the routing/navigation when CTA is clicked
- Don't restructure the dashboard layout or move other widgets
- Don't add new features (quests, XP, etc.) — this is a visual refinement only

---

## Acceptance Criteria

1. Greeting and ring are side-by-side on desktop, stacked on mobile
2. Section checklist is visible showing all sections with complete/incomplete status
3. The next recommended section is visually distinguishable in the checklist
4. CTA is inside the same card as the rest of the widget, separated by a subtle divider
5. Time estimate is inline with or adjacent to the button, not floating separately
6. Ring track is lighter, percentage text is bolder/larger
7. Ring animates on mount
8. 100% completion shows a clean success state replacing the CTA area
9. Widget takes up noticeably less vertical space than before on desktop
10. All existing functionality (correct percentage, correct next section, navigation) still works