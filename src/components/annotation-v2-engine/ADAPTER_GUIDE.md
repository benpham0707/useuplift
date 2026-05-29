# Annotation V2 Engine — Adapter Guide

> **Status: PARKED.** This directory holds 19K lines of Phase 4–11 spec-implemented logic. It does not run against your live UI yet. When you're ready to wire real backend output into the Essay Workshop at `/annotation-v2-demo`, this guide is the starting point.

---

## TL;DR — What's in here, what you'd use, what you'd skip

| Folder | Contents | Adoption recommendation |
|---|---|---|
| `tokens.ts` + `workshop.css` | 6-tier color CSS vars, easings as `[x1,y1,x2,y2]` tuples, typography scale, glass morphism tokens | **Adopt.** UI-agnostic. You likely overlap these with your own tokens — pick whichever set has better values. |
| `types/profile.ts`, `types/navigation.ts` | `EssayProfile`, `SentenceProfile`, `Annotation`, `CrossRef`, `RewriteSuggestion`, `HolisticSynthesis`, `NorthStar`, `NavStackEntry`, `FilterState`, `ViewedState`, `LayerEvent` | **Adopt.** These type shapes are stable and map to real L3/L3.5/L3.75/L4/L5 pipeline output. Use them as the canonical contract between backend and your UI. |
| `fixtures/sampleProfile.ts` | 709-word hand-authored robotics essay, 40 sentences, 17 annotations, 5 cross-refs, full L3/L3.5/L3.75/L5 fields populated | **Adopt as test fixture.** Useful for Storybook / offline dev / visual regression regardless of final UI. |
| `fixtures/loadingScript.ts` | Mock SSE timeline (full 18s path + fast-path ~2.5s) | **Adopt.** Matches the shape real SSE endpoint will emit. Swap with real stream factory at wire time. |
| `editor/` | TipTap + ProseMirror decoration plugin, paragraph tint layer, tier underline layer (wavy/solid/shimmer), gutter, soft-lock, sentenceMapping | **Adopt if you switch to TipTap.** If your existing editor stays contenteditable / custom, reuse `sentenceMapping.ts` logic for offset↔id lookup but skip the rest. |
| `loading/` (useLoadingState + VaporScan + LayerRibbon + CancelButton) | Hook + 3 render components | **Hook yes, components no.** `useLoadingState()` is UI-agnostic — feed its state into your own loading UI. The render components encode specific visual decisions that likely don't match your design. |
| `bloom/` (useBloomChoreography + useAutoSelectStrongest + HeaderNarrative + StartHereChip) | Hook + 2 render components | **Hook yes, components discretionary.** `useBloomChoreography()` emits phase booleans your UI consumes. Header narrative + chip are small enough to rebuild against your design language. |
| `panel/` (PanelShell, PanelHeader, PanelTabs, InsightCard, ProfileCard, RewriteCard, CrossRefPill, SageEmptyState, Breadcrumb, OverviewCard + hooks) | Full panel surface | **Hooks yes, most components reference-only.** `usePanelMode`, `useNavStack`, `useInsightDwell`, `useClipboardCopy` are stateless logic. The .tsx components visually differ from your Coach/Insights/Portrait/Roadmap tabs — you'd rebuild the render layer. |
| `nav/` (useSmartOrder, useNavigation, useViewedState, useNewnessBadge, useKeyboardShortcuts, ProgressBar, NavButtons, EndOfReview) | Nav logic + render components | **Hooks yes.** The Smart Order algorithm (tier × structural × centrality × spatial smoothing) is the hardest single piece to re-derive — adopt wholesale. ProgressBar/NavButtons are small; rebuild visually to match your design. |
| `list/` (ListView, Minimap, TierHistogram, FilterChips, TierKeyPopover, ProseCallout + hooks) | List/map view | **Hooks yes, components reference-only.** `useListFilter` + `useTierCounts` are pure logic. List/Minimap/Histogram render layer should match your visual system. |
| `click/` (ClickManager + useRapidClick + useClickTimeline + useHoverTooltip + useDeselection + SentenceRing + HoverTooltip) | Click orchestration | **Hooks yes, components mostly no.** `useRapidClick` (40ms coalesce), `useClickTimeline` (ms-by-ms phase state), `useHoverTooltip` (300ms delay) are all the ms-precision decisions you don't want to re-derive. Render the ring + tooltip in your style. |
| `orientation/` (useOrientation + useHintQueue + useInactivityTimer + useScreenReaderOrientation + AmbientHint + KeyboardShortcutFooter + hintsRegistry) | 5-hint registry + 12s chip clock + keyboard footer + SR path | **Hooks yes, AmbientHint/Footer rebuild.** Hint registry strings + trigger conditions are content-level decisions — adopt the registry, render in your style. |

---

## Architecture principle

```
┌─────────────────────────────────────────────────────────────┐
│ YOUR UI (src/pages/AnnotationV2Demo.tsx + annotation-v2/)   │
│                                                              │
│  Essay Workshop, Coach, Insights, Portrait, Roadmap tabs    │
│  ↑ Renders state                     ↓ Calls hooks          │
└─────────────────────────────────────────────────────────────┘
                       │           │
                       │           │  State + callbacks
                       │           │
┌─────────────────────────────────────────────────────────────┐
│ ENGINE (src/components/annotation-v2-engine/)                │
│                                                              │
│  Hooks      — useLoadingState, useBloomChoreography,         │
│               useSmartOrder, useViewedState, useNavigation,  │
│               usePanelMode, useNavStack, useInsightDwell,    │
│               useClipboardCopy, useOrientation,              │
│               useRapidClick, useClickTimeline, useListFilter │
│                                                              │
│  Types      — EssayProfile, SentenceProfile, Annotation,     │
│               CrossRef, RewriteSuggestion, HolisticSynthesis │
│                                                              │
│  Fixtures   — sampleProfile, createMockLoadingStream         │
│                                                              │
│  Tokens     — Tier, TIER_CSS_VAR, TIER_META, EASING,         │
│               DURATION, TYPOGRAPHY, GLASS, Z_LAYER           │
└─────────────────────────────────────────────────────────────┘
                              │
                              │  Shape-compatible
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (src/services/essayIntelligence/ — real pipeline)    │
│                                                              │
│  L1 → L2 → L2.5 → L3 → L3.75 → L3.5 → L4 → L5 → L6           │
│  Emits SSE events + final EssayProfile                       │
└─────────────────────────────────────────────────────────────┘
```

Engine hooks consume `EssayProfile`. When wiring, a tiny adapter fetches from the real pipeline and produces an `EssayProfile`-shaped object. UI stays on its side, consumes hook outputs.

---

## Wiring checklist (in priority order)

### 1. Lock the backend→engine adapter first
- [ ] Add `src/services/essayIntelligence/adapters/toEssayProfile.ts` that maps real pipeline output to the engine's `EssayProfile` shape
- [ ] Add `src/services/essayIntelligence/adapters/sseToLayerEvents.ts` that converts real SSE stream to engine's `LayerEvent` shape
- [ ] Unit-test both adapters with a captured real pipeline response (+fixture)

### 2. Wire the loading experience first
- [ ] Import `useLoadingState({ createStream: sseAdapterFactory })` in the Workshop route
- [ ] Render YOUR UI's loading state from the hook's `status`, `caption`, `paragraphTintsReady`, `revealReady` fields
- [ ] Keep existing `MockEssayData` flow alongside so loading state is additive, not replacement

### 3. Wire the reveal + tier display
- [ ] Once `revealReady` fires, swap `MockEssayData` for real `EssayProfile` from the adapter
- [ ] Map `MockAnnotation.severity` (critical/important/suggestion/strength) to `Tier` (CRITICAL/NEEDS_WORK/FUNCTIONAL/STRONG/EXCEPTIONAL/MASTERFUL) via effectiveness score — the mapping is in `tokens.ts` TIER_META ranges
- [ ] Point your highlight renderer at `SentenceProfile.tier` + `TIER_CSS_VAR[tier]` so color stays tokenized
- [ ] Optional: adopt `useBloomChoreography` to drive the two-wave reveal animation through your existing editor

### 4. Wire the Insights tab to real annotations
- [ ] Render from `EssayProfile.annotations` (array) instead of `MOCK_ESSAY_DATA.annotations`
- [ ] Use the same `InsightCard` visual shell you have today; just populate it from `Annotation.{type, critique, whyItMatters, strengths, rewrite, crossRefs}`
- [ ] Feed `useSmartOrder({ profile })` → `useNavigation()` to power the Coach's recommended-order flow

### 5. Wire progress + viewed state
- [ ] `useViewedState({ essayId, totalCount })` gives you the per-sentence ledger
- [ ] Tie it to `panel.insightsRead` via the reconciliation effect documented in `useViewedState.ts`
- [ ] Your UI decides how to visualize (you already have a progress circle "81" in the header — feed it `reviewedCount / totalCount`)

### 6. Wire rewrite safety rail
- [ ] `useClipboardCopy({ text: rewrite.text, delayMs: 4000 })` enforces the 4s anti-paste window
- [ ] Render your own toast styling; hook drives the state

### 7. Orientation hints (last, and only if you want them)
- [ ] `useOrientation({ bloomInteractive, insightsReadCount, panelMode, ... })` emits `activeHint`
- [ ] Render hints in your visual language; skip entirely if you decide the student doesn't need them

---

## Type compatibility bridge you'll need to write

Your existing mock model (`src/components/annotation-v2/mockData.ts`) uses:
- `AnnotationSeverity = 'critical' | 'important' | 'suggestion' | 'strength'`
- `HighlightType = 'feedback' | 'voice' | 'connection' | 'craft' | 'thematic'`
- `TeachingMode = 'awareness' | 'consequence' | 'connection' | 'action'`

Engine uses:
- `Tier = 'CRITICAL' | 'NEEDS_WORK' | 'FUNCTIONAL' | 'STRONG' | 'EXCEPTIONAL' | 'MASTERFUL'`
- `Annotation.type = 'growth' | 'strength' | 'structural' | 'teaching'`

These are different taxonomies, not incompatible ones. You'll either:
- **(A) Keep your severity model** and add `effectiveness: number` + `tier: Tier` fields to `MockAnnotation` so both coexist. Cheap. Preserves your UI logic.
- **(B) Replace severity with tier** end-to-end. Cleaner long-term but touches every render path. Higher cost.

Recommendation: **(A) now, (B) eventually.** The Tier model is spec-grounded and will tell you more than severity when real L3.5 effectiveness scores land.

---

## Sub-demo routes (reference, not production)

These exist at `/annotation-v2-demo/{foundation, loading, panel, bloom, insight, list, click, rewrite, nav, orientation}` and each exercises one engine surface in isolation. Useful to:
- **Eyeball specific behaviors** before adopting a hook (e.g., see what `useSmartOrder` ordering looks like on the sample fixture)
- **Regression-test** individual pieces when adapting
- **Copy code patterns** for your own integration

Remove them when you're done referencing — they're pure dev affordance, no production value.

---

## Known open items (parked)

These were flagged during Wave β development and never fully resolved:

1. **Anti-paste toast duration: 4s (spec) vs 8s (shipped).** G chose 8s. Product call.
2. **MASTERFUL sentences have no annotations in the fixture** → SageEmptyState fires on auto-select. Real pipeline decides whether to generate teaching on MASTERFUL or leave them silent.
3. **Content-editable rewrite surface (Phase 9 §2.4)** — inline-edit-before-copy feature not implemented. ~150-200 lines when you want it.
4. **ECRM font** referenced in `TYPOGRAPHY.families.serif` — no `@font-face` declared. Drop to Source Serif 4 fallback or procure the font.
5. **PanelShell ESC restore-prior-insight** — routes to overview today, not back to the prior insight when ESC-ing from list mode. Small H+E patch.
6. **`1/2/3` keyboard filter shortcuts** wired in nav hook but list view doesn't consume them — lift state and connect.
7. **Real SSE endpoint** — everything goes through `createMockLoadingStream`. Swap at wire time.
8. **Content-editable paste handling** for rewrite surface (when that ships).

---

## What to tell a future engineer (or future-you)

> "The engine in `annotation-v2-engine/` is a parked logic layer. It's not rendered by any production route. The types, hooks, and fixtures are ready to drive a real essay-analysis experience; the `.tsx` render components are reference-only and almost certainly replaced at integration. Start from this doc, pick a surface to wire (loading is the safest first), write an adapter from the real `essayIntelligence` pipeline to `EssayProfile`, then consume hooks from your UI. Budget an afternoon per surface for the hook wiring and a day per surface for the adapter + UI integration."

That's the whole package.
