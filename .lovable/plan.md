

## Visual Hierarchy Overhaul for Overview Tab

### Overview

Rework the Overview tab's visual design in `src/pages/ActivityWorkshop.tsx` to create clear visual hierarchy differentiation between sections. All changes are render-only and mock data adjustments -- no new components or files needed.

### Changes

**1. Score Dashboard -- Full-width expansion panel with caret**

Current: Each card has its own small rationale box expanding underneath it.
New: Cards are buttons only (no individual expand). A single full-width panel renders below the entire 5-card grid when one is selected. The panel includes:
- A small CSS triangle/caret pointing up, positioned horizontally at the center of the active card
- The dimension name as a bold title
- The rationale paragraph
- 2-3 improvement bullet points (added to the `scoreCards` mock data as an `improvements` string array)

The caret position will be calculated using refs on each card button. The panel uses `transition-all duration-300` for smooth open/close.

The `useEffect` for caret positioning will fire on both `expandedScoreCard` changes AND window resize events, with a resize event listener and proper cleanup on unmount.

Mock data update -- Add `improvements` array to each score card:
- Activity Strength: ["Take on a named leadership role in at least one activity", "Add specific numbers to every description (members recruited, events organized)", "Document outcomes, not just participation"]
- Spike Depth: ["Submit research to a student journal or conference", "Enter a CS competition (USACO, hackathon)", "Create a public artifact (GitHub repo, app, blog)"]
- Story Coherence: ["Rewrite grocery job description to connect to your CS mission", "Frame farm work as problem-solving under constraint", "Add a bridge sentence connecting each activity to your core theme"]
- Major Fit: ["Frame research and tutoring as directly supporting your CS trajectory", "Add technical specifics that connect each activity to your intended major", "Highlight how non-CS activities developed transferable skills (systems thinking, leadership)"]
- Description Quality: ["Lead every description with the strongest outcome", "Use specific metrics in at least 3 of 5 descriptions", "Cut filler words -- every character of the 150 limit should earn its place"]

**2. Hero area -- Score as centerpiece**

Current: Score is `text-4xl` in a modest glass card, badges sit next to it at equal size.
New:
- Score container becomes a larger frosted rounded-square with `text-6xl md:text-7xl` for the number
- Layout changes to a vertical stack: large score on top, badges underneath in a row
- Harvard Scale and Competitive badges get smaller text (`text-xs`)
- The whole hero area is centered, not left-aligned

**3. Portfolio Narrative -- Blockquote style, not a card**

Current: Glass card container with prominent edit/regenerate buttons.
New:
- Remove the `rounded-xl border bg-white/10` card wrapper
- Replace with a `border-l-4 border-l-blue-400/50` left accent and light padding
- Text size increases to `text-base` (from `text-sm`)
- Controls (edit, arrows, regenerate) shrink: smaller icons (`h-3 w-3`), more transparent, grouped in a subtle row
- "PORTFOLIO NARRATIVE" label stays but the overall feel is flowing text, not a data box

**4. Quick Insight Cards -- Spotlight treatment**

Current: Same `bg-white/10` as everything else.
New:
- Background changes to `bg-white/20 backdrop-blur-2xl` for more frosted/darker look
- Add icons to each card header:
  - YOUR SPIKE: `Target` icon (from lucide)
  - WHAT THEY'LL REMEMBER: `Lightbulb` icon (from lucide)
  - #1 PRIORITY: `Flag` icon (from lucide)
- Content text gets `font-semibold` for the main value
- Slightly thicker border: `border-white/35`

**5. Key Strengths and Opportunities -- Stronger borders, tighter layout**

Current: `border-l-4 border-l-green-500/60` with `p-5`.
New:
- Green border: `border-l-4 border-l-green-500` (full opacity, 4px solid)
- Amber border: `border-l-4 border-l-amber-500` (full opacity)
- Reduce padding to `p-3 px-4`
- Reduce bullet spacing from `space-y-2` to `space-y-1.5`
- These are compact quick-scan lists

**6. Strategic Direction -- Coaching Pitch first**

Current: Current State -> Direction -> Coaching Pitch (at bottom).
New: Reorder to Coaching Pitch (top) -> Current State -> Strategic Direction.
- Coaching Pitch gets a subtle purple-tinted background (`bg-purple-500/10`) and a quote icon or quotation marks styling
- Current State and Strategic Direction paragraphs become slightly smaller text

**7. General spacing reduction**

- Outer `space-y-6` on the TabsContent changes to `space-y-4`
- `mt-6` on TabsContent changes to `mt-4`
- `py-12` on the outer container reduces to `py-8`

### New Imports

Add `Target`, `Lightbulb`, `Flag` from lucide-react (add to existing import line).

### New Refs and State

- `scoreCardRefs = useRef<(HTMLButtonElement | null)[]>([])` for card position measurement
- `scoreContainerRef = useRef<HTMLDivElement>(null)` for relative positioning
- `caretLeftPx` state for triangle horizontal position

### Caret useEffect

Recalculates caret position when `expandedScoreCard` changes. Also attaches a `window.addEventListener('resize', recalc)` with `removeEventListener` cleanup on unmount. This ensures the triangle stays aligned if the browser is resized while a panel is open.

### What Stays the Same

- All state variables and interactivity (click to expand, carousel cycling, edit mode)
- Tab bar styling and placeholder tabs
- Two-column workspace below

### Technical Details

| Area | Detail |
|------|--------|
| File | `src/pages/ActivityWorkshop.tsx` only |
| Mock data change | Add `improvements: string[]` to each scoreCard object |
| New refs | `scoreCardRefs`, `scoreContainerRef` for caret positioning |
| New state | `caretLeftPx: number` for triangle position |
| New useEffect | Recalculate caret on `expandedScoreCard` change + window resize listener with cleanup |
| New imports | `Target`, `Lightbulb`, `Flag` from lucide-react |
| Major Fit improvements | Corrected to focus on strengthening CS alignment, not diversifying away from it |

