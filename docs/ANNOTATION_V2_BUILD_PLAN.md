# Annotation V2 Build Plan

> **Status (2026-04-19): Engine PARKED.** The Wave α–γ engine landed in `src/components/annotation-v2-engine/` (86 files, 19K lines, tsc clean). It was then parked rather than swapped into production, because the existing `/annotation-v2-demo` UI is the canonical visual design. Future wiring will adapt the engine's hooks + types into the existing UI, not replace it. See `src/components/annotation-v2-engine/ADAPTER_GUIDE.md` for the resumption plan.
>
> **Authoritative plan for building the Uplift inline annotation editor against Wave 1–3 UX specs (Phases 4–11).** Agents reference this document plus their assigned phase spec. Do not deviate from decisions here without updating this file first.

## Scope & Positioning

- **Route:** `/annotation-v2-demo` (already routed in `src/App.tsx` as lazy import, rendered outside ClerkProvider via AuthFreeRoutes).
- **Demo posture:** Fully mocked against a single sample essay profile. No real `/api/essay-intelligence` wiring in Phase 1 of the build. Real backend hookup is a follow-up phase once the UX is stable.
- **Editor:** TipTap (ProseMirror-based) with a decoration plugin for non-destructive annotation overlays. No destructive mutation of student text.
- **Target devices:** Desktop first (1280+ wide), mobile adaptation is a dedicated workstream (M) that lands after desktop stabilizes.

## Directory Layout (new code lives here)

```
src/components/annotation-v2-new/
├── tokens.ts                # Workstream A — source of truth for colors, easings, typography
├── workshop.css             # Workstream A — CSS variables + keyframes
├── types/                   # Workstream L — shared type contracts
│   ├── profile.ts           # EssayProfile, SentenceAnalysis, L3 Understanding, L5 Annotation
│   ├── navigation.ts        # SmartOrder, NavStack
│   └── tier.ts              # Tier union + meta
├── fixtures/
│   └── sampleProfile.ts     # Workstream L — 40-sentence essay with all 6 tiers represented
├── editor/                  # Workstream B — TipTap integration
│   ├── AnnotationEditor.tsx
│   ├── decorations.ts       # tier underlines (wavy critical, solid, shimmer masterful)
│   ├── paragraphTint.ts     # paragraph-level bg saturation
│   ├── gutter.ts            # role labels + dots
│   └── softLock.ts          # read-only mode during analysis
├── panel/                   # Workstream E + F + G
│   ├── PanelShell.tsx       # 40% right, glass, 3 modes, 180ms crossfade
│   ├── InsightCard.tsx      # Phase 8 invariant shape
│   ├── ProfileCard.tsx      # Phase 8 Profile tab content
│   ├── RewriteCard.tsx      # Phase 9 collapsed-toggle + copy-only
│   ├── OverviewCard.tsx     # Phase 5 default state
│   └── CrossRefPill.tsx     # inline click-commit jump pills
├── loading/                 # Workstream C — Phase 4
│   ├── VaporScan.tsx
│   ├── LayerRibbon.tsx
│   └── useLoadingState.ts   # SSE or mock ticker
├── bloom/                   # Workstream D — Phase 5
│   ├── useBloomChoreography.ts
│   ├── StrengthsWave.tsx
│   └── CriticalWave.tsx
├── nav/                     # Workstream H — Phase 10
│   ├── useSmartOrder.ts
│   ├── ProgressBar.tsx      # 3px tier-gradient
│   ├── NavButtons.tsx
│   ├── NavStack.ts          # 3-deep jump-back
│   └── EndOfReview.tsx
├── list/                    # Workstream I — Phase 11
│   ├── ListView.tsx
│   ├── Minimap.tsx          # 6-8px right-edge stripe
│   ├── TierHistogram.tsx
│   └── FilterChips.tsx
├── click/                   # Workstream J — Phase 7
│   ├── ClickManager.tsx     # ring-first content-second, 180ms
│   ├── useRapidClick.ts     # 40ms coalesce, latest-wins
│   ├── SageEmptyState.tsx   # "Working as intended"
│   └── HoverTooltip.tsx     # 300ms delay
├── orientation/             # Workstream K — Phase 6
│   ├── hints.ts             # 5-hint registry
│   ├── StartHereChip.tsx
│   ├── TierKeyPopover.tsx   # inside filter menu
│   └── KeyboardHint.tsx     # panel footer after first close
└── mobile/                  # Workstream M (last)
    ├── BottomSheet.tsx
    ├── SwipeNav.tsx
    └── MobileList.tsx
```

**Legacy:** Existing `src/components/annotation-v2/` is preserved untouched during the build. At integration time we rename `annotation-v2` → `annotation-v2-legacy/` and `annotation-v2-new` → `annotation-v2`. No files deleted until integration is verified.

## Workstream Dependency Graph

```
Wave α (parallel blockers):
  A (tokens) ────────┐
  L (types+fixture) ─┤
  B (TipTap editor) ─┘
                     │
                     ▼
Wave β (parallel after α):
  E (panel shell) ────────────┐
                              │
                              ▼
  C (loading) ──── D (bloom) ──── F (insight) ──── H (nav) ──── I (list) ──── J (click)
                                      │
                                      ▼
                                  G (rewrite)
                     │
                     ▼
Wave γ (serial):
  K (orientation) → Integration → Testing

Wave δ:
  M (mobile)
```

## Shared Contracts (set by Wave α)

### Tier tokens (Workstream A)

All tier colors exposed as CSS variables. TypeScript re-exports via `tokens.ts`:

```ts
export type Tier =
  | 'CRITICAL'      // red,    <40, wavy underline
  | 'NEEDS_WORK'    // amber,  40-54, solid underline
  | 'FUNCTIONAL'    // sage,   55-75, NO underline (visual silence)
  | 'STRONG'        // green,  76-85, solid underline
  | 'EXCEPTIONAL'   // teal,   86-95, solid underline
  | 'MASTERFUL';    // purple, 96-100, shimmer underline

export const TIER_CSS_VAR: Record<Tier, string> = {
  CRITICAL:    '--anno-critical',
  NEEDS_WORK:  '--anno-needs-work',
  FUNCTIONAL:  '--anno-functional',
  STRONG:      '--anno-strong',
  EXCEPTIONAL: '--anno-exceptional',
  MASTERFUL:   '--anno-masterful',
};

export const EASING = {
  underlineBloom: 'cubic-bezier(0.22, 1, 0.36, 1)',   // ease-out-quart
  panelSlide:     'cubic-bezier(0.16, 1, 0.3, 1)',    // ease-out-expo
  contentCrossfade: 'cubic-bezier(0.4, 0, 0.2, 1)',
  pulse:          'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

export const DURATION = {
  panelSlide: 250,
  contentCrossfade: 180,
  ringFadeIn: 120,
  mousedownPulse: 60,
  underlineBloom: 160,
  strengthsWaveTotal: 900,
  criticalWaveTotal: 900,
  autoSelectPulse: 400,
} as const;
```

### Profile shape (Workstream L)

```ts
export interface EssayProfile {
  essayId: string;
  paragraphs: Paragraph[];
  sentences: SentenceProfile[];
  holisticSynthesis: HolisticSynthesis;  // L3.75
  northStar: NorthStar;                   // L4
  annotations: Annotation[];              // L5 (0..N per sentence)
  improvementPhase: 'Foundation' | 'Architecture' | 'Craft' | 'Polish' | 'Distinction';
}

export interface SentenceProfile {
  id: string;                  // e.g. 'p3s2'
  paragraphIndex: number;
  indexWithinParagraph: number;
  text: string;
  startOffset: number;
  endOffset: number;
  tier: Tier;
  effectiveness: number;       // 0-100 from L3.5
  understanding: Understanding; // L3
  strengths: string[];          // L3.5
  weaknesses: string[];         // L3.5
  annotationIds: string[];      // references into annotations[]
  inboundRefs: string[];        // sentence IDs that reference this one (for centrality weight)
}

export interface Annotation {  // L5 teaching feedback
  id: string;
  sentenceId: string;
  type: 'growth' | 'strength' | 'structural' | 'teaching';
  priority: 0 | 1 | 2 | 3 | 4 | 5;
  critique: string;             // 2-4 sentences, quotes student text
  whyItMatters: string;         // 1 sentence, ties to North Star
  strengths: string[];          // 1-2 items, always present
  rewrite?: RewriteSuggestion;  // Phase 9 rules — CRITICAL/NEEDS_WORK almost always, others rarely
  crossRefs: CrossRef[];        // sentence IDs this insight references
}

export interface RewriteSuggestion {
  text: string;
  registerMatch: 'high' | 'medium' | 'low';  // how closely it matches voice
  divergenceDimension: string;                 // e.g. "specificity", "rhythm"
  variantCount: 1 | 2;                         // 2 max per Phase 9
}
```

### SSE / loading state (Workstream L + C)

For the mock demo, `useLoadingState` returns a scripted timeline (8–20s total, 7 layer events). Shape matches what a real SSE stream would emit:

```ts
export type LayerEvent =
  | { type: 'layer_start'; layer: LayerName; t: number }
  | { type: 'layer_complete'; layer: LayerName; t: number }
  | { type: 'paragraph_tints_ready'; t: number }  // at L3.5 completion
  | { type: 'reveal_ready'; t: number };          // at L5 completion → Phase 5 hand-off
```

## Constraints Enforced Across All Workstreams

1. **No emojis** in any UI string.
2. **No aggregate scores, percentages, letter grades** anywhere in the product (Phase 5/6/11 rule).
3. **CSS vars only** for tier colors — no hardcoded hex outside `tokens.ts`.
4. **motion/react** for named animations (no raw `transition:` CSS for choreographed phases).
5. **prefers-reduced-motion** collapse for every animation — specified in each phase spec.
6. **Accessibility:** every named interaction must be keyboard-reachable; live regions for Phase 4 progress and Phase 5 bloom end.
7. **TypeScript strict mode** — no `any`, no `@ts-ignore`, no `@ts-expect-error` without a justification comment.
8. **Every phase-spec decision implemented gets a code comment** citing the spec §section (e.g. `// Phase 8 §2.3 — critique first, why-it-matters second`).

## Integration Plan

1. Wave α lands on `main` as one PR: `feat(annotation-v2): foundation (tokens + types + editor)`.
2. Wave β workstreams each get their own PR (6 PRs parallel) — each is self-contained with a demo route at `/annotation-v2-demo/phase-N`.
3. Wave γ integration PR wires everything into the main `/annotation-v2-demo` route, replacing the legacy page; legacy moves to `annotation-v2-legacy/`.
4. Wave δ (mobile) is its own PR.

## Open Questions (resolved)

- **Real API or mock-only?** → Mock-only for now. Backend wiring is a follow-up after UX stabilizes.
- **Preserve or replace existing `annotation-v2/`?** → Replace. Build parallel, integrate, legacy. Current 5-type model (`feedback/voice/connection/craft/thematic`) is incompatible with the 6-tier effectiveness system the specs target.
- **TipTap vs ProseMirror-raw?** → TipTap. Adds `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`. Decoration plugin uses ProseMirror primitives directly.
- **Demo essay scope:** → One 40-sentence fixture covering all 6 tiers, all L3/L3.5/L3.75/L5 fields populated. Shipped in Workstream L.
