# Description Tab Redesign — Context & Implementation Brief

> **Purpose**: Redesign the Activity Workshop's Description tab so the original and suggested descriptions are shown in a single unified component for intuitive side-by-side comparison, instead of separate cards stacked far apart.

---

## The Problem

The current `DescriptionOptimization` component renders the original and optimized descriptions as **completely separate card components** stacked vertically with visual gaps. This makes it impractical to:

1. **Compare differences** — the user has to scroll between two cards and mentally diff them
2. **Understand what changed** — changes are listed in a *third* separate collapsible section
3. **Choose between alternatives** — `descriptionAlternatives` and `suggestedRewrite` are rendered as additional separate cards even further down the page

The user's eye has to jump between 3-5 disconnected UI regions to understand one simple thing: "what did you change and why?"

---

## The Goal

Create a **unified comparison component** where:
- The original and suggested text appear **within the same visual container**
- Differences are **inline-visible** (not hidden in a separate section)
- It's **immediately intuitive** which is the original and which is the suggestion
- Comparing them is **natural and effortless** — like reading a before/after in the same paragraph
- Alternatives and scoring-based rewrites are accessible from the same context (not buried below)

---

## Current Architecture

### File: `src/components/portfolio/activity-workshop/sections/DescriptionOptimization.tsx` (726 lines)

**What it renders (top to bottom):**

1. **"Your Current Description"** card — original text with highlighted issue spans, char bar
2. **"Optimized Version"** card — green-tinted card with optimized text, copy button, char bar
3. **"What We Changed"** — collapsible list of `{ change, reason }` pairs
4. **"Issues & Improvements"** — expandable issue items with priority, why-it-matters, how-to-fix, before→after examples, expert quotes
5. **"Alternative Versions"** — blue-tinted cards for `descriptionAlternatives[]`
6. **"Scoring-Based Rewrite"** — purple-tinted card for `suggestedRewrite`
7. **"Score Improvement Projection"** — projected score with improving components

### Props shape:
```typescript
interface DescriptionOptimizationProps {
  optimization: {
    original: string;          // User's current description
    optimized: string;         // AI-optimized version
    originalCharCount: number; // Typically 50-120 chars
    optimizedCharCount: number;// Typically 130-150 chars
    changes: Array<{ change: string; reason: string }>;
  };
  improvementTeaching?: ImprovementIssue[];  // Teaching issues with references
  accentColor: string;
  descriptionAlternatives?: string[];        // 0-3 alternative versions
  suggestedRewrite?: string;                 // From scoring service
  scoreProjection?: {
    projectedScore: number;
    improvingComponents: string[];
    rationale: string;
  } | null;
}
```

### Key data characteristics:
- **Descriptions are SHORT** — 150 character limit (Common App activity description)
- **Original is typically 50-120 chars**, optimized is typically 130-150 chars
- **Changes are usually 3-5 items** (e.g., "Added accuracy metric (87%)")
- **Issues are usually 2-4 items** with priority (high/medium/low)
- **Alternatives are 0-3** additional rewrite options
- **suggestedRewrite** comes from a different service (scoring) than the main optimized version

### Parent: `InsightDetailView.tsx`
Renders `DescriptionOptimization` inside a tabbed panel (Celebration | Strengths | **Description** | Next Steps | Transform). The Description tab content area has `p-4` padding and is inside a scrollable `overflow-y-auto` container.

### Existing sub-components (reuse these):
- `CharacterBar` — compact progress bar showing char count vs 150 limit
- `CopyButton` — clipboard copy with "Copied!" feedback
- `HighlightedText` — renders text with colored highlight spans linked to issues
- `IssueItem` — expandable accordion for each improvement issue
- `buildHighlightSegments()` — parsing engine for issue-reference highlighting

---

## Design Direction

### Recommended approach: **Inline Diff Card**

A single card that shows both versions stacked tightly with inline change indicators:

```
┌──────────────────────────────────────────────────────┐
│  Description Comparison                    [Copy ▾]  │
│──────────────────────────────────────────────────────│
│                                                      │
│  CURRENT  (87/150 chars)                             │
│  ┌────────────────────────────────────────────────┐  │
│  │ Developed machine learning model to analyze    │  │
│  │ healthcare access gaps in rural communities.   │  │
│  │ Submitted paper to regional conference.        │  │
│  └────────────────────────────────────────────────┘  │
│          ↓  5 changes applied                        │
│  SUGGESTED  (148/150 chars)                   [Copy] │
│  ┌────────────────────────────────────────────────┐  │
│  │ Developed NLP model (87% accuracy) analyzing   │  │
│  │ 12 rural healthcare systems, identifying 3     │  │
│  │ critical service gaps affecting 15,000+        │  │
│  │ residents; paper submitted to IEEE regional    │  │
│  │ conference.                                    │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [What Changed ▾]  — expandable inline               │
│                                                      │
│  ┌ If alternatives exist: ─────────────────────────┐ │
│  │  ◉ Optimized  ○ Alt 1  ○ Alt 2  ○ Scoring      │ │
│  │  (radio/pill selector to swap the "suggested")  │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Key design principles:
1. **Same card, same visual context** — no scrolling between separate components
2. **Clear visual hierarchy** — current = muted/neutral, suggested = slightly emphasized
3. **Minimal labels** — "CURRENT" and "SUGGESTED" in tiny uppercase, not full card headers
4. **Transition indicator** — subtle arrow or divider with change count between the two
5. **Copy on the suggested** — primary action is copying the improved version
6. **Inline alternatives** — if alternatives exist, use a pill/radio selector to swap which version appears in the "suggested" slot (not separate cards for each)
7. **Char bars inline** — show char count next to the label, not as a separate bar below

### Alternative approach: **Side-by-side** (if viewport allows)
For wider viewports, a two-column layout within the same card could work:

```
┌─────────────────────┬─────────────────────────────┐
│  CURRENT            │  SUGGESTED           [Copy] │
│  87/150 chars       │  148/150 chars              │
│                     │                             │
│  Developed machine  │  Developed NLP model        │
│  learning model to  │  (87% accuracy) analyzing   │
│  analyze...         │  12 rural healthcare...     │
│                     │                             │
│  ▪▪▪▪▪▪░░░░░░░░░  │  ▪▪▪▪▪▪▪▪▪▪▪▪▪▪░░        │
└─────────────────────┴─────────────────────────────┘
```

Given descriptions are very short (150 chars), this could work cleanly. Use responsive: side-by-side on `md+`, stacked on mobile.

---

## Implementation Plan

### Step 1: Refactor the unified card
- Combine the "Your Current Description" and "Optimized Version" sections into a **single `<div>` with one border/card wrapper**
- Current description: muted background, smaller text or slightly faded
- Suggested description: normal emphasis, slightly highlighted background
- Add a compact transition indicator between them (arrow + "N changes" badge)
- Move `CopyButton` to the suggested section only (that's what users want to copy)

### Step 2: Alternative version selector
- If `descriptionAlternatives` or `suggestedRewrite` exist, render a compact **pill/radio group** that lets users switch which version shows in the "suggested" slot
- Options: "Optimized" (default) | "Alt 1" | "Alt 2" | "Scoring" (if suggestedRewrite exists)
- This replaces the 3-4 separate card sections with one interactive selector

### Step 3: Keep Issues section separate but linked
- The "Issues & Improvements" section below the comparison card stays as-is (it's already well-designed)
- The highlighted text in the "current" description still links to issues via `scrollToIssue`
- The "What We Changed" list can move to a compact expandable inside the unified card

### Step 4: Score projection
- Keep the score projection at the bottom — it's already compact and well-placed

---

## Files to Modify

| File | What changes |
|------|-------------|
| `src/components/portfolio/activity-workshop/sections/DescriptionOptimization.tsx` | Main redesign — merge the two card sections into one unified comparison component |

No other files need changes — the props interface stays the same, the parent (`InsightDetailView`) passes the same data.

---

## Mock Data Examples (for testing)

### Research activity:
```
Original: "Developed machine learning model to analyze healthcare access gaps in rural communities. Submitted paper to regional conference."
(87 chars → would show as well under limit)

Optimized: "Developed NLP model (87% accuracy) analyzing 12 rural healthcare systems, identifying 3 critical service gaps affecting 15,000+ residents; paper submitted to IEEE regional conference."
(148 chars → nearly at limit)

Changes: 5 items (added accuracy, added scope, added impact numbers, etc.)
```

### CS Club activity:
```
Original: "Founded and lead school computer science club, teaching coding skills to students interested in technology."
(~107 chars)

Optimized: "Founded CS club (0→32 members, 2 yrs); designed 8-module curriculum teaching Python/web dev to first-gen students; hosted 3 community hackathons."
(144 chars)
```

---

## Chrome DevTools MCP Available

The `chrome-devtools` MCP server is configured (26 tools) and the Vite dev server runs on `http://localhost:5173`. Use it to:
1. Navigate to the Activity Workshop page
2. Click into any activity → go to the Description tab
3. Take screenshots before/after the redesign
4. Inspect DOM structure and computed styles

If the MCP shows "connected" but tools aren't available, the session may need a restart (`/mcp` → select chrome-devtools → Reconnect, or start a fresh conversation).

The Playwright MCP is also available as a Local MCP.

---

## Quality Checklist

- [ ] Original and suggested are in the **same card** — no visual separation
- [ ] It's immediately obvious which is current vs suggested (labels, color, emphasis)
- [ ] Character counts visible for both
- [ ] Copy button on suggested version
- [ ] Highlighted spans in original still link to issue items below
- [ ] Alternatives (if present) swap into the suggested slot via selector — no separate cards
- [ ] "What We Changed" is inline/collapsible within the card, not a separate section
- [ ] Mobile responsive — stacks cleanly on narrow viewports
- [ ] No regressions: component still works when `descriptionAlternatives` is empty, when `suggestedRewrite` is null, when `improvementTeaching` is empty
- [ ] TypeScript strict — no `any` types
- [ ] Existing `DescriptionOptimizationProps` interface unchanged (backwards compatible)
