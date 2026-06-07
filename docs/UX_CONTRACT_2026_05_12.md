# UX Contract — Inline Annotation Surface (locked 2026-05-12)

> **Scope.** Locks the production direction for the inline-annotation UX so the backend
> team can finalize the wire from `deepAnnotationService` → student-facing surface.
> Locked artifacts: visual spine, anchor granularity, interaction model,
> `L5Annotation` field-consumption table, six-section composition, state model.
>
> **Out of scope.** Backend prompt changes, new pipeline fields, schema migrations.
> Backend should not change to chase this contract; gaps are surfaced as open
> questions, not requirements.

---

## TL;DR

- **Visual spine wins:** the `AnnotationV2Demo.tsx` shell — split layout, left contentEditable
  essay with gutter pills + colored underlines, right tabbed panel (Coach | Insights |
  Profile | Roadmap). Already named production by `annotation-v2-engine/PARKED.md`.
- **Architecture wins:** the `annotation-v2-engine/` hooks + types (already parked-but-adopted)
  drive state and ordering. The `.tsx` render layer of the engine stays reference-only.
- **Interaction model wins:** three layers. **Inline mark** (always-on, low-noise) →
  **hover/click popup as preview + nav hub** (Track A's strongest move) → **right panel
  as the teaching surface** for 250–375 token annotations. Popup never carries the full
  teaching frame — it's the routing artifact.
- **Six-section composition wins:** `committeeOneLiner` + `aoReaction` live in the
  Workshop header as a collapsible "AO Read" strip; `annotatedEssay` IS the editor;
  `revisionPriorities` populates the Roadmap tab; `structuralMap` lives in paragraph
  role badges + a Roadmap subsection; `overallAssessment` lives in the Profile tab,
  gated until ≥2 insights have been read.
- **20–30 annotation density holds with bloom-staged reveal.** Without bloom, gutter
  becomes a wall. The engine's `useBloomChoreography` is non-negotiable.

---

## 1. Demo Audit (the inventory the synthesis is built from)

Eleven demo files exist at `src/pages/AnnotationV2*Demo.tsx`. They fall into two
camps, **not 11 alternatives** — one is a polished consumer demo, the rest are
**workstream verification harnesses** for an engineered logic layer that has been
deliberately parked behind `annotation-v2-engine/`. The user's "13 demos" framing
overstates the parallelism: most of these compose, they don't compete.

| Demo | Camp | UX move it explores | Strongest move | Weakest move | Need it serves |
|---|---|---|---|---|---|
| `AnnotationV2Demo.tsx` (1320 lines) | **Production** (Track A) | Split shell w/ inline underlines + gutter pills + 4s dwell-warmed hover popup + tabbed right panel | 6-tier popup hierarchy (type/title/quote/insight/connection/actions) reads as a true nav hub; the popup IS the routing decision surface | Popup carries ~1-3 sentences of `insight`, won't hold 250-375 token teaching; high-density (25 annotations across 6 paragraphs) hover spam likely | Premium feel + nav from inline → panel |
| `Editor_Foundation_Demo` | **Engine harness (B)** | TipTap-based editor foundation, 6-tier bloom, paragraph tint phases, soft-lock | Six tiers (CRITICAL/NEEDS_WORK/FUNCTIONAL/STRONG/EXCEPTIONAL/MASTERFUL) give granular tier display that 3-tier severity can't; sentence-anchored decoration plugin | TipTap dependency a big commit; raw demo is purely visual scaffolding | Stable spans across edits, named tier semantics |
| `Loading_Demo` (C) | **Engine harness** | 7-layer loading orchestrator (vapor scan + layer ribbon + cancel) | `paragraphTintsReady` + `revealReady` signal split — pre-bloom tinted essay reads as "the system has thoughts forming" without overwhelming | Specific visual choices (vapor scan) probably don't match Track A's chrome | Trust-building during 18s analysis wait |
| `Panel_Shell_Demo` (E) | **Engine harness** | PanelShell with three modes: overview / insight / list | Three-mode panel is the right primitive for 20-30 annotation density — overview to orient, insight to teach, list to filter | Visually utilitarian; rebuild in production design language | Density management without overwhelm |
| `Bloom_Demo` (D) | **Engine harness** | Bloom choreography — `paragraph_tints_ready` → `reveal_ready` → "Start here" chip routes to top-priority critical sentence | Two-wave reveal (strengths first, then growth) builds reader confidence before the work begins; "Start here" chip removes the cold-start "where do I begin with 25 annotations" problem | Header narrative copy may feel preachy at production scale | Onboarding through 20-30 annotations |
| `Insight_Demo` (F) | **Engine harness** | `InsightCard` six-section invariant + cross-ref pills + nav stack + breadcrumbs + 1200ms dwell to mark-read | Six-section invariant matches L5Annotation's rich teaching frame 1:1; cross-ref pills + nav stack are exactly the affordance `crossParagraphAnnotations` needs | SageEmptyState for MASTERFUL sentences is a "we found nothing to teach" empty state — could feel anticlimactic without softening copy | Surface the full 250-375 token teaching frame |
| `List_Demo` (I) | **Engine harness** | Filterable/sortable/groupable annotation list + minimap stripe at editor right edge | Minimap is a sneaky-good move — gives 25 annotations a spatial map without cluttering the prose; filter chips compose with AND | Three groupings (paragraph/tier/type) may be one too many for first-time use | Density triage |
| `Click_Demo` (J) | **Engine harness** | ClickManager — rapid-click latest-wins (40ms coalesce), 300ms hover→tooltip, ESC to overview, click-outside deselect | Latest-wins prevents click-storm jitter — feels production-grade; ESC + click-outside are the two affordances that make 25-annotation review survivable | The ring + tooltip are mechanically necessary but visually busy | Resilient interaction at scale |
| `Rewrite_Demo` (G) | **Engine harness** | RewriteCard with 4s desktop / 6s mobile copy-delay, anti-paste toast, register-match metadata | The 4s copy-delay is *the* pedagogical move — forces the student to read the rewrite before pasting; anti-paste toast catches the "I just want to copy" reflex | Adds friction students will resent if not framed right; register-match metadata (high/medium/low) is engine-specific (not in L5) | "Wisdom over speed" — teach revision, don't just deliver it |
| `Nav_Demo` (H) | **Engine harness** | useSmartOrder (tier × structural × centrality × spatial) → progress bar + Next/Prev + Tab/↑↓/ESC/L shortcuts + end-of-review morph | Smart-order is the answer to "in what order should the student read 25 annotations" — purely deterministic; keyboard shortcuts make power-user review fast | Some essays may not benefit from a single linear order; needs an "explore freely" exit | Linearize the queue + measure progress |
| `Orientation_Demo` (K) | **Engine harness** | 5-hint registry + 12s inactivity chip pulse + first-close keyboard footer + SR announcement path | Demarcates first-time vs returning-user UX; 12s pulse is the inactivity nudge calibrated to the bloom completion window | 5 hints risks feeling like a tutorial overlay if not gated tightly | First-time onboarding without modals |

**Key audit conclusion.** Track A's `AnnotationV2Demo` and Tracks B–K are **not in
competition.** Track A is a UI shell using mock data; Tracks B–K are a parked
logic engine designed to wrap that shell at integration. `ADAPTER_GUIDE.md`
already names the wiring path: adopt engine hooks, adopt types, rebuild render
in Track A's visual language. The 11 demos are one production architecture in
two assembly stages, not 11 directions.

---

## 2. Production Direction

### 2.1 One-paragraph description

**A two-pane essay workshop.** The student reads their essay in a clean
contentEditable column on the left. As the analysis pipeline finishes, the
essay **blooms**: paragraph tints surface structural roles, sentence-level
underlines (tier-colored) fade in, gutter pills appear in the left margin one
per annotation. The student can read the essay first (overview mode, no
annotation focus), or accept the bloom's "Start here" chip → focuses the
highest-priority critical sentence. Hovering or clicking a gutter pill (or
underlined span) opens a **preview popup** anchored above the span — the
popup is a navigation hub, not a teaching surface. It shows annotation
type, title, ~2-sentence summary, and routes the student to the right
panel's appropriate tab for the full teaching frame. The right panel
exposes four tabs: **Coach** (chat, L6 conversation surface — already
production), **Insights** (annotation review queue with smart-order
navigation + filter/sort/list view), **Profile** (essay portrait + structural
map, gated until ≥2 insights read), **Roadmap** (revision priorities +
protected strengths). The Workshop header carries a collapsible "AO Read"
strip with the committee one-liner and AO gut reaction. The student moves
through annotations via smart-order Next/Prev (Tab + ↑↓), with a progress
bar in the panel header; cross-paragraph annotations push a breadcrumb so
the student can navigate the connection and return. Rewrites copy with a
4s anti-paste delay and a register-match note, so the student reads the
rewrite before applying it.

### 2.2 ASCII sketch

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Workshop Header                                                                │
│ [Logo] Essay Workshop  •  Common App  •  315/650 words  •  [PHASE: Craft]     │
│       [⭕ EQI 81]  [💡 22 insights]  [🛡 Deep]  [▾ AO Read]                    │
│ ───────────────────────────────────────────────────────────────────────────── │
│ AO Read (collapsed by default):                                                │
│ "The translator essay — immigrant family medical story w/ a systems thinking  │
│  angle. Restraint earned the close." Pool: moderate. Put-down risk: low.      │
├───────────────────────────────────────────────┬───────────────────────────────┤
│  ESSAY EDITOR (left, 55%)                     │  RIGHT PANEL (45%)            │
│                                                │  [Coach][Insights][Profile][Roadmap] │
│   [CommonAppPromptSelector ▾]                  │  ───────────────────────────  │
│                                                │  ▸ INSIGHTS MODE              │
│  ● ┃ The fluorescent lights of the hospital   │  ┌─────────────────────────┐  │
│    ┃ waiting room ̲h̲u̲m̲m̲e̲d̲ ̲a̲ ̲f̲r̲e̲q̲u̲e̲n̲c̲y̲ that      │  │ 4 / 22  ▓▓▓░░░░░░░ 18% │  │
│    ┃ matched the tremor in my hands.          │  │                         │  │
│                                                │  │ Sensory precision       │  │
│  ● ┃ My mother had always been the translator │  │ grounds the reader       │  │
│  ● ┃ — n̲o̲t̲ ̲j̲u̲s̲t̲ ̲o̲f̲ ̲M̲a̲n̲d̲a̲r̲i̲n̲ ̲t̲o̲ ̲E̲n̲g̲l̲i̲s̲h̲    │  │ ── STRENGTH · P1 ──     │  │
│    ┃ but of worlds.                            │  │ "The fluorescent…hands" │  │
│                                                │  │                         │  │
│  ↑ pop:                                        │  │ Earned detail. Specific │  │
│  ┌────── Coaching · IMPORTANT · P4 ──────┐    │  │ enough to feel real     │  │
│  │ Thesis statement is too on-the-nose   │    │  │ without over-explaining.│  │
│  │ "Understanding isn't just linguistic…"│    │  │                         │  │
│  │ Reads as essayistic — breaks scene voice│  │ Why it matters: Opens you │  │
│  │ [Discuss in Coach →]   [Ask Coach 💬]│    │  │ in scene. The reader is  │  │
│  └─────────────────────────────────────────┘  │  │ already inside the moment│  │
│                                                │  │ before any claim lands. │  │
│  ● ┃ So I became the translator. Not of       │  │                         │  │
│    ┃ language, but of consequence.            │  │ ── Connects to ──       │  │
│                                                │  │ [P8: "something steadier"]│  │
│  ●●┃ This is where I discovered that ╲╲╲╲╲   │  │                         │  │
│    ┃ understanding isn't just linguistic.    │  │ [← Prev]  [Next →]      │  │
│                                                │  └─────────────────────────┘  │
│  ⌷ ← Minimap (right margin of editor):       │                               │
│       red dot, amber, green dot per          │                               │
│       sentence; hover = highlight in prose   │                               │
└───────────────────────────────────────────────┴───────────────────────────────┘
       gutter pills (●●)            tier-colored underlines (̲ ̲ ̲ ̲ ̲)
       one per annotation           red/amber/green per L5 priority+type
```

### 2.3 Critical decisions

| Decision | Resolution | Rationale |
|---|---|---|
| **Anchor granularity** | **Sentence**, with optional sub-sentence visual span via `spanText`. Paragraph-level anchors live on paragraph headers, not in prose. | L5 produces `sentenceIndex` + `spanText`; sentence is the right semantic unit; word-level too noisy at density. |
| **Annotation display** | **Three-layer.** Inline underline (always-on, tier-colored) → hover/click popup (preview + nav hub, ≤90 words) → right panel insight card (full 250-375 token teaching). Popups never carry the rewrite, the rationale, the stakes, the northStarConnection — those need a stable surface. | 25 popups can't sustain 25 × 300 tokens. Density forces a panel. |
| **Clustering** | **Three modes** in panel: **overview** (no annotation in focus, just summary), **insight** (one annotation), **list** (all annotations, filter/sort). Gutter pills cluster horizontally when ≥2 share a line (already implemented in AnnotationV2Demo). | `usePanelMode` from engine. Three modes survive density. |
| **Reading mode vs review mode** | **Bloom choreography** is the seam. Pre-bloom: essay reads as plain prose. Post-bloom (`reveal_ready`): underlines + gutter + "Start here" chip appear. Student decides whether to read straight through or accept the chip. | Engine's `useBloomChoreography` already encodes this. Don't reinvent. |
| **Interaction verb** | **READ + TWEAK + APPLY** (amended 2026-05-20 by §8 Q3). The RewriteCard is a contentEditable "workshop" where the student can tweak the rewrite to match their voice. Apply button (delay-gated per Q2 dynamic formula) replaces the anchor span in-place. The student's own contentEditable essay surface still accepts free typing as before. | Pedagogical: revision is still the student's work — the tweak step is the engagement signal, and the delay-gated Apply click is the explicit consent. Apply removes the manual-paste tax once consent has been established. **Replaces the earlier "copy-only" lock**, which is now considered too friction-heavy for a workshop iteration loop. |
| **Rewrite copy-delay** | **Dynamic** (Q2, 2026-05-20): `delay = max(3s, words/5 + 1s)` desktop; ×1.5 on mobile. Applied to the Apply button (the workshop's primary action). | Pedagogically calibrated to rewrite length — a 5-word rewrite gets 3s, a 25-word rewrite gets 6s. Replaces the fixed 4s/6s/8s candidates. |
| **Progress / state** | **UI-side, sessionStorage-backed** for the active session. `useViewedState` keeps a per-sentence ledger of which annotations the student dwelled on for ≥1.2s. Cross-session persistence is a backend concern *only if* re-analysis needs the carry-forward — see open questions. | Track-only-what-you-need. Most reviewing is one-sitting. |
| **6-section composition** | See §3 below — explicit mapping table. | The 6 sections aren't separate screens; they're surfaces of one workshop. |
| **Bloom is non-negotiable** | If `revealReady` never fires (fast path or test mode), the editor renders pre-bloom (no underlines, no gutter), with a "Reveal annotations" button. Students never get a wall of 25 underlines without a moment of breath. | A 25-annotation cold reveal is jarring; bloom is calibration. |

---

## 3. Six-Section Composition: How `StudentAnalysisDocument` Surfaces

The 6 sections are not 6 tabs. They're 6 surfaces of one workshop. This mapping
is the answer to "how do non-annotation sections compose with the inline
annotations."

| Section | Surface | Visibility | Notes |
|---|---|---|---|
| **1. committeeOneLiner** (≤30 words) | Workshop header, **collapsible strip** at top of editor pane | **Default visibility = putDownRisk-aware (Q7, 2026-05-20)**: expanded when `aoReaction.putDownRisk ∈ {'low','moderate'}`; collapsed when `'high'`. Foundation phase: collapsed regardless of risk (Q5). Last user choice persisted per `(essayId, version)`. | Single line of italic prose. Sets the AO frame before the student starts. Default protects vulnerable moments — student can always expand manually. |
| **2. aoReaction** (gutReaction + putDownRisk + hookMoment + archetype + archetypeFrequency) | Same collapsible strip (§1 expands into this) | Per row 1 above | One disclosure region. The risk badge (put-down risk: high/moderate/low) lives in the header bar at all times. |
| **3. annotatedEssay** (paragraphs + inlineAnnotations) | **Left editor pane** | Always | This IS the editor. Each `AnnotatedParagraph` is the source of underlines + gutter pills. |
| **4. revisionPriorities** (rank, title, whyItMatters, craftTechnique, impact) | **Roadmap tab** (right panel, tab 4) | Tab visible always; deep-link from any annotation that ties to a priority | `priorityRef` on each annotation jumps to the Roadmap row. |
| **5. structuralMap** (paragraphIndex, role, effectiveness, weight) | **Two places**: paragraph role badges in the left editor margin AND a "Structural Map" subsection in the **Roadmap** tab (collapsible block, sentence-effectiveness heat strip) | Badges always; subsection one click in | The badge is the inline answer; the subsection is the bird's-eye view. |
| **6. overallAssessment** (phase, strengths, centralIdea, distinctiveness, writerPortrait) | **Profile tab** (right panel, tab 3) | **Gate one-time per essay (Q8, 2026-05-20)**: first-ever access gated until `insightsRead ≥ 2`. Once unlocked for an essay, stays unlocked forever — re-analyses do NOT re-lock. On first unlock, surface confirmation: "Full view unlocked — you've earned the bigger picture." Tracked via `localStorage["uplift:profileUnlocked"] = Set<essayId>`. | The "you've earned the bigger picture" moment. Replaced the engine's per-session gate (which would have re-locked on every re-analysis, punishing iteration). |

Composition rule: **the annotations never leave the editor.** The other five
sections layer around them. The Workshop header is the AO-frame (§1+§2),
paragraph badges + Roadmap subsection are the structural lens (§5), the
Roadmap tab is the action list (§4), and the Profile tab is the earned
reflection (§6).

---

## 4. `L5Annotation` Field Consumption Table

This is the contract with backend. Backend produces `L5Annotation` per the
shape at `src/services/essayIntelligence/analysis/deepAnnotationService.ts:130-280`.
The UI consumes each field as below.

### 4.1 Fields the UI consumes

| `L5Annotation` field | Where it appears in UI | How it's rendered | Notes |
|---|---|---|---|
| `id` | All surfaces | Stable key for React, deep-link target, viewed-state ledger key | Required, non-null. |
| `location.paragraphIndex` | Editor + panel | Routes annotation to the right `AnnotatedParagraph`; jump target | Required, 0-indexed. |
| `location.sentenceIndex` | Editor + popup + panel | Anchors gutter pill to the sentence's line-rect; null → paragraph-level annotation, gutter pill renders at paragraph top | Nullable. Null is valid for `essayLevelAnnotations` (see §5). |
| `location.spanText` | Editor underline | The exact text span gets the colored underline (tier-driven). Falls back to full sentence when null. | Nullable. When null, the underline covers the whole sentence. |
| `type` (`L5AnnotationType`) | Popup tier-badge, list view group-by | **6-tier system (Q1, 2026-05-20)**: combines `type` + per-sentence effectiveness (new L3.5 field) → CRITICAL (<40, wavy red) / NEEDS_WORK (40-54, solid amber) / FUNCTIONAL (55-75, **no underline / visual silence**) / STRONG (76-85, solid green) / EXCEPTIONAL (86-95, solid teal) / MASTERFUL (96-100, shimmer purple). Backend's 4-type taxonomy stays for `type` field; effectiveness drives the visual tier. | Replaces the original 3-tier UI-side derivation. Backend dependency: L3.5 per-sentence effectiveness scoring is a v1 requirement (§11.6 — second backend ask). |
| `teachingMode` (`'awareness' \| 'consequence' \| 'connection' \| 'action'`) | Popup metadata row, insight card mode chip | Drives the chip icon + label ("Try this…" / "Notice…" / etc.) | Required, never null. Drives whether `rewriteExample` is expected. |
| `teachingIntent` (free-text) | Insight card subtitle / tooltip on mode chip | Plain-text caption beneath the title in the insight card | The teaching mode is the routing taxonomy; teachingIntent is the human label. |
| `content` | Insight card body (primary teaching paragraph), popup `insight` (truncated to ~140 chars w/ "…") | Rich prose — flows through 250-375 token slot in insight card | The hero field. |
| `teachingRationale` | Insight card "Why it matters" subsection | Plain prose | Always shown when present. |
| `northStarConnection` | Insight card "Connects to" sidebar | Italic prose with arc/structural framing | When non-empty + non-trivial. UI suppresses when text < 12 chars or matches generic placeholder pattern. |
| `stakes` | Insight card AO-frame block ("If unaddressed: …") | Soft callout, slate-tinted card | Null is valid (pure strengths); UI just omits the block. |
| `priority` (1-5) | Smart-order ranking + gutter pill saturation (1 = brightest) + list sort | Priority 1 always shows with strongest visual weight; smart-order ties broken by structural role | Required. |
| `phase` (`ImprovementPhaseLevel`) | Phase pill in workshop header (per essay) + list filter | Engine's `useSmartOrder` weights by phase | The essay's phase comes from `L5AnnotationResult.phase`, not per-annotation; but per-annotation phase is used to filter "deferred" annotations the student can choose to see. |
| `rewriteExample` | Insight card **RewriteCard** subcomponent | RewriteCard renders the rewrite with 4s copy-delay (engine's `useClipboardCopy`) and anti-paste toast | Required for `teachingMode === 'action'` (already enforced by backend's GAP-6 hardening). UI surfaces a warning if action arrives without one. |
| `wordEconomyCut` | Below RewriteCard, "Cut to make room" inline note | Plain text with `P{n}S{n}` parsed → click jumps to the cut location | Null is valid. UI omits the inline note when null. |
| `antiPatternExample` | Insight card "What to avoid" callout, monospace-quoted | Renders the exact 5-12 word phrase as the anti-pattern label | Null is valid. Renders only when present. |
| `transferablePrinciple` | Insight card footer chip ("SUMMARY-TO-SCENE" / "COLD OPEN" / etc.) | Small named-technique pill | Null is valid. Pill is omitted when null. |
| `confidence` | Insight card debug overlay (dev only) + influences list-view ordering tie-breaking | Suppressed from student view; visible to internal staff via `?debug=annotations` | Not user-facing in v1. |
| `crossParagraphRefs` (number[]) | Insight card "Connects to" pills | Each entry renders as a clickable pill that pushes nav stack and routes to that paragraph's primary annotation | Drives the cross-ref experience. See §5. |
| `capacityBuildingNote` | Insight card "What this teaches you" footer | Plain prose, italicized | Null is valid. Omitted when null. |

### 4.2 Fields the UI ignores (for v1 production wire)

These fields are produced by backend but UI does not render them in v1. **No
backend change requested** — they may still be produced for non-UI consumers
(telemetry, calibration, future surfaces, internal review).

| Field | Why ignored in v1 |
|---|---|
| `groundingQuality` (`'grounded' \| 'weakly_grounded' \| 'ungrounded'`) | Diagnostic signal for backend calibration; not a student-facing concept. Could later gate a "this annotation may be soft" badge but not v1. |
| `teachingIntent` when redundant with `teachingMode` | When teachingIntent paraphrases teachingMode's intent label, UI suppresses the subtitle to avoid double-labeling. (Diff detected at render time.) |
| Annotation-level `confidence` (in v1) | Surfacing per-annotation confidence to students is a credibility hit when low. Held back behind dev flag. |

### 4.3 Surfaces the UI **needs but L5 doesn't currently emit** (open questions, not requirements)

| UI surface | What it would need | Workaround for v1 |
|---|---|---|
| Rewrite metadata (`registerMatch`, `divergenceDimension`, `variantCount`) | The engine's `RewriteCard` expects these to render the "register: medium · divergence: rhythm" metadata row | Render RewriteCard without the metadata row in v1. Worth surfacing to backend later if rewrite metadata is judged valuable. |
| ~~Multiple rewrite variants~~ | ~~Engine supports `variantCount` 1-2 with "Another way" disclosure~~ | **RESOLVED 2026-05-24 by §4.4 below.** Essay-level rewrite generator emits `draftVariants[]` with 2-3 drafts per gap. Engine's "Another way" disclosure becomes a 3-tab UI on RewriteCard. |
| ~~Sentence-level effectiveness score (0-100)~~ | ~~Drives engine's tier display (CRITICAL → MASTERFUL) and structural-map effectiveness strip~~ | **RESOLVED 2026-05-20 by §8 Q1.** Per-sentence effectiveness is now a v1 backend requirement (L3.5 wire-through). Tier display ships at 6-tier from day one. See §11.6 backend asks. |

### 4.4 Essay-level rewrite generator output (added 2026-05-24)

> **Scope.** L5 grows a new essay-level method `generateEssayLevelRewrites()`
> alongside the existing per-paragraph fan-out. The method takes the L4
> Coaching Map + L3.75 Moment Earnedness Map + style profile and emits
> **growth annotations with multi-draft rewrites in the writer's own voice**,
> **preservation annotations** for protected strengths, and a single
> **reframe annotation** carrying the transformative insight.
>
> **Why this is a §4 amendment.** §4.1 documents `rewriteExample` as a
> single string. The essay-level generator emits an array of typed draft
> variants. This section is the contract for those new fields. The
> `rewriteExample` single-string field is preserved as back-compat (mirrors
> `draftVariants[0].text`) so existing renderers keep working without
> changes.

#### 4.4.1 Backend-emitted, UI-v2-renders fields

| Field | Type | UI rendering target | Notes |
|---|---|---|---|
| `growthAnnotations[].draftVariants` | `RewriteDraft[]` (length 2–3) | RewriteCard becomes a 3-tab UI ("Minimal" / "Scene" / "Insight") | Each tab carries its own draft text, anti-pattern, and voice-preservation note. Default-selected tab: `minimal` for action-mode annotations. |
| `RewriteDraft.text` | `string` | Tab body (contentEditable workshop per §2 critical decisions) | Honors the 4s/6s copy-delay + Apply button per §2 amended 2026-05-20. |
| `RewriteDraft.intensityLevel` | `'minimal' \| 'scene' \| 'insight'` | Tab label | Drives the 3-tab labeling. |
| `RewriteDraft.wordDelta` | `number` | Metadata row below tab body (`+30 words` / `−5 words`) | The metadata row was previously deferred per §4.3; now backend emits, UI surfaces. |
| `RewriteDraft.voicePreservationNotes` | `string` | Accordion below tab body: "What this preserves from your voice" | Pedagogical lift — student sees WHY the draft works in their voice. Cites specific styleProfile fields used. |
| `RewriteDraft.antiPattern.{text, whyItFails}` | `{text: string, whyItFails: string}` | Callout below the voice-preservation accordion: "What to avoid" | Richer than §4.1's single-string `antiPatternExample` — now a structured object. Existing string field stays for back-compat. |
| `RewriteDraft.wordEconomyCut` | `{location, quote, wordsRemoved, reason}` \| `null` | "Cut to make room" inline note (already in §4.1) | Now structured. Renders with click-to-jump if the location is in the visible essay. |
| `growthAnnotations[].rewriteExample` | `string` | Existing single-string field (back-compat) | Mirrors `draftVariants[0].text`. Existing renderers continue to work without code changes. |
| `growthAnnotations[].fallbackReason` | `'zero_drafts_after_retry'` \| `null` | When non-null, UI hides the RewriteCard and shows: "We couldn't draft this — discuss in Coach." | Q6c fallback path: gap is surfaced in awareness mode (no draft) when rewriter failed. |
| `preservationAnnotations[].weakeningAntiPattern` | `string` | Callout on insight card: "How this could be weakened" | New surface — a real version someone might "improve" this into, with what would be lost. |
| `preservationAnnotations[].technique` | `string` | Named-technique pill at the bottom of the insight card | E.g., "misdirection opening", "temporal compression". Maps to the existing `transferablePrinciple` chip slot. |
| `reframeAnnotation.insight` + `whyThisTransforms` | `string` × 2 | "Key Insight" panel at top of Insights tab (already rendered today via `data.roadmap.transformativeInsight`) | Backend emission becomes the canonical source. |

#### 4.4.2 The 3-tab RewriteCard (UI v2)

Visual sketch:

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚡ Try this rewrite                                              │
│ ─────────────────────────────────────────────────────────────── │
│ [ Minimal ] [ Scene ] [ Insight ]    ← intensityLevel tabs      │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Then one afternoon the hook stopped fighting me — not      │ │
│  │ because I'd changed my grip, but because my hands had      │ │
│  │ finally stopped expecting it to be hard.                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│   +30 words · matches your magical metaphor system             │
│                                                                 │
│   ▸ What this preserves from your voice                        │
│     · Uses em-dash pivot (your P0/P1 signature)                │
│     · Physical verb echoes P3's "wrenched" / "disobeyed"       │
│                                                                 │
│   ▸ What to avoid                                              │
│     "After months of practice, I finally got the hang of it."  │
│     Tells without showing; loses the magical register.         │
│                                                                 │
│   [ Apply ]  (4s delay, calibrated to word count)              │
└─────────────────────────────────────────────────────────────────┘
```

Tabs switch instantly (drafts are pre-loaded, not LLM-fetched). The
Apply delay-gate per §2 amended 2026-05-20 fires per-draft based on the
draft's word count. Switching tabs resets the delay.

#### 4.4.3 Composition with §11 iteration loop

When the student re-analyzes (per §11.2 Stage 2):
- The backend reads `EssayProfile.priorRewriteDigest[]` — the digest of
  the last run's drafts the student saw.
- `wasApplied` is inferred via substring match on the current essay
  text vs. each prior draft.
- The rewriter is told to (i) not re-emit any draft text byte-identical
  to a prior draft, (ii) build on the student's chosen direction for
  applied drafts, (iii) try a different approach for rejected drafts.
- The Resolved drawer (§11.4) surfaces "Resolved by your edit" when a
  prior draft matched in the current essay text.

No frontend signal required for `wasApplied` — backend infers from
essay text diff. The iteration loop's `localStorage` ledger remains
the source of truth for student-visible state (read/dismissed/etc.),
but it doesn't need to round-trip to backend for the rewriter to know
what was tried.

---

## 5. Cross-Paragraph & Essay-Level Annotation Handling

Backend emits three arrays in `L5AnnotationResult`:

1. `paragraphAnnotations[].annotations[]` — anchored to a single paragraph
2. `crossParagraphAnnotations[]` — anchor sentence in one paragraph, `crossParagraphRefs` lists others
3. `essayLevelAnnotations[]` — no specific paragraph anchor; about the whole essay

### 5.1 Cross-paragraph annotations

**Primary surface = the anchor sentence's gutter pill in the editor.** The pill
gets a distinct visual marker (cyan dotted underline pattern, already implemented
in AnnotationV2Demo's `connection` highlight type) so the student sees this is a
linking annotation, not just a local note.

When opened in the insight card, the `crossParagraphRefs[]` array renders as
clickable pills. Clicking pushes a `NavStackEntry` (engine's `useNavStack`)
and routes the panel to the target paragraph's primary annotation. A
breadcrumb appears in the panel header showing the navigation path. ESC or
breadcrumb-click pops back to the origin annotation.

The `connectionLabel` for the cross-ref pill is **derived UI-side** from
`teachingIntent` (short form) — backend doesn't need to emit it separately.

### 5.2 Essay-level annotations

**Primary surface = Roadmap tab.** Essay-level annotations don't fit the
inline model — they're about the essay, not a span. They render as a
dedicated section in the Roadmap tab labeled "Essay-Level Observations,"
above the revision priorities list.

Each essay-level annotation also gets a **subtle indicator in the workshop
header chip** — e.g., "22 insights · 3 essay-level" — so the student knows
they exist. The 6-tier color (Q1) of the indicator follows the highest-priority
essay-level annotation.

**Not in the gutter.** Putting them in the gutter would force a fake anchor
choice that misrepresents the annotation's actual scope.

**Roadmap default-on-post-analysis-landing (Q6, 2026-05-20).** When priority-1
essay-level annotations exist on a freshly-completed analysis, the workshop
opens with **Roadmap** as the default tab (overriding the always-Coach
default). One-shot only — fires on the post-analysis landing right after
re-analysis completes. Tracked via `localStorage["uplift:seenP1EssayLevel"]
= Set<(essayId, analysisVersion)>`. After student dismisses or navigates
away from Roadmap, subsequent reopens default to Coach (consistency restored
long-term). All other cases (no priority-1 essay-level, or already-seen):
Coach default.

---

## 6. Interaction State Model

### 6.1 UI-only state (sessionStorage-backed via engine hooks)

| State | Owner | Behavior |
|---|---|---|
| `selectedAnnotationId` | `usePanelMode` (engine) | Currently focused annotation; drives the insight card render |
| `panelMode: 'overview' \| 'insight' \| 'list'` | `usePanelMode` | Which panel mode is active |
| `insightsRead: Set<string>` | `usePanelMode` + `useInsightDwell` (1200ms dwell threshold) | The set of annotation IDs the student has dwelled on long enough to count as "read." Gates Profile tab at ≥2. |
| `viewedState` | `useViewedState` (sessionStorage) | Per-(essayId, annotationId) ledger of view events with close reasons (advance / dismiss / next / esc) |
| `navStack` | `useNavStack` (in-memory, max depth 3) | Cross-ref navigation history; drives breadcrumb |
| `smartOrder` | `useSmartOrder` (derived from profile) | The deterministic Next/Prev queue |
| `filterState` | `useListFilter` | List-view filter chips (critical/unreviewed/strengths) — AND-composed |
| Applied/dismissed (per annotation) | **UI-only** ledger in `viewedState` | The student "applies" by pressing Copy on a RewriteCard → state recorded. Dismiss is implicit via `close reason: 'dismiss'`. |

### 6.2 What is NOT carried forward to backend

By default, the entire interaction state above is **ephemeral per session**.
The backend's `ReanalysisBrief` already carries `priorAnnotationContext` for
re-analysis — that handles supersession across iterations. The UI does
not need to push viewed/applied/dismissed state into the backend for v1.

**Exception (deferred):** if/when re-analysis wants to know which annotations
the student explicitly engaged with vs ignored, the UI can flush a summary
to a new backend endpoint. That's a future scope question — see open
questions.

### 6.3 What IS carried forward (no UI work needed)

`L5Annotation` is **ephemeral** per backend design — it's regenerated on every
re-analysis. The carry-forward of substance (the actual annotations) is the
backend's job through `priorAnnotationContext`. UI doesn't store anything
durable about specific annotations across runs.

---

## 7. Phase-Aware UX Rules

The locked annotation density target (20-30 per essay) is **the target at
architecture/craft/polish/distinction phases.** Foundation phase essays
intentionally surface fewer annotations (3-5 per backend's `PHASE_GUIDANCE`
in `deepAnnotationService.ts:86`).

The UI honors this asymmetry:

| Phase | Annotation count expectation | UI adjustments |
|---|---|---|
| **foundation** | 3-5 | No bloom delay; reveal immediately. No "Start here" chip — too few to need it. Minimap hidden (not enough data to map). List view defaults to a single group (paragraph) with no filter chips. Workshop header carries an explicit "Foundation phase — focus is structure, not polish" caption. **Progressive disclosure (Q5, 2026-05-20):** all 4 tabs present, but **Profile + Roadmap tabs dim/de-emphasized** (still clickable, just visually quiet); **Coach is the default surface** at workshop open; **AO Read strip collapsed by default** regardless of `putDownRisk` (overrides Q7 default for Foundation). One layout across all phases, calibrated by emphasis. |
| **architecture** | 4-7 | Full bloom. "Start here" chip shows. Minimap shows. Filter chips visible but unset. |
| **craft** | 6-10 | Same as architecture; list-view defaults to sort:priority. |
| **polish** | 8-14 | Same as craft; gutter pill density increases per paragraph. |
| **distinction** | 3-6 | Same as foundation chrome (few annotations) but tier visualization stays full (each annotation is rare/precious). |

Phase comes from `L5AnnotationResult.phase` (not per-annotation). The Workshop
header's phase pill drives all the conditional chrome above.

**Phase is a filter, not a gate.** A student in `craft` phase still sees
`foundation`-phase deferred annotations if backend emits them; they're shown
with reduced visual weight (the engine's existing "deferred" `opacity: 0.3`
underline treatment from AnnotationV2Demo line 895).

---

## 8. Open Questions — Resolution Log

All 10 questions resolved 2026-05-19 (Q4, Q9 via §11 ripple) through
2026-05-20 (Q1, Q2, Q3, Q5, Q6, Q7, Q8, Q10 walked one-by-one). Captured
here for traceability; each resolution is integrated into the body of
§2.3 / §3 / §4 / §5.2 / §7 above.

| # | Question | Resolution |
|---|---|---|
| 1 | 6-tier vs 3-tier color system | **6-tier in v1.** Take on L3.5 per-sentence effectiveness scoring as a v1 backend requirement. Second §11/§8 backend ask alongside `phaseTransitionLine` (§11.5.1). Tiers: CRITICAL/NEEDS_WORK/FUNCTIONAL (visual silence, no underline)/STRONG/EXCEPTIONAL/MASTERFUL. Removes the 3-tier fallback option from §4.3. |
| 2 | Rewrite copy-delay duration | **Dynamic formula.** `delay = max(3s, words/5 + 1s)` desktop; ×1.5 on mobile. 5-word rewrite → 3s desktop / 4.5s mobile. 25-word rewrite → 6s desktop / 9s mobile. Replaces fixed-time candidates. |
| 3 | In-place edit vs copy-only for rewrites | **Rewrite Workshop with Apply.** RewriteCard is a contentEditable workshop where student can tweak the rewrite. Q2 dynamic delay gates the Apply button. Apply replaces the anchor span in-place. No secondary Copy affordance. Tweak step + delay-gated Apply click together establish consent. Replaces the "READ + COMPARE + COPY" lock in §2.3. |
| 4 | Cross-session viewed state persistence | **RESOLVED 2026-05-19 via §11.1 amendment.** Cross-session persistence is ON: viewed/applied/dismissed/resolved state moves from `sessionStorage` to `localStorage` keyed by `(essayId, version)`. Iteration loop requires durability. |
| 5 | Foundation-phase annotation surfacing | **Progressive disclosure within full chrome.** All 4 tabs present at every phase, but Profile + Roadmap dim/de-emphasized at Foundation; Coach is the default surface; AO Read collapsed by default at Foundation (overrides Q7 default). One layout, calibrated emphasis — no "stripped-down" mode. |
| 6 | Roadmap as default tab when essay-level annotations exist | **Roadmap default on post-analysis landing when priority-1 essay-level exists.** One-shot switch immediately after analysis when a critical essay-level concern exists. Tracked via `localStorage["uplift:seenP1EssayLevel"] = Set<(essayId, analysisVersion)>`. After student dismisses or navigates away, subsequent reopens default to Coach. All other cases default to Coach. |
| 7 | AO Read strip default visibility | **`putDownRisk`-aware default.** Expanded when `aoReaction.putDownRisk ∈ {'low', 'moderate'}`; collapsed when `'high'`. Foundation phase: collapsed regardless (Q5). Last user choice persisted per `(essayId, version)` — default only applies on first encounter. |
| 8 | Profile tab gate (`insightsRead ≥ 2`) | **Keep gate, one-time per essay.** First-ever Profile access for an essay gated until `insightsRead ≥ 2`. Once unlocked, stays unlocked forever for that essay — re-analyses do NOT re-lock. On unlock, surface confirmation: "Full view unlocked — you've earned the bigger picture." Tracked via `localStorage["uplift:profileUnlocked"] = Set<essayId>`. |
| 9 | Bloom choreography for re-analysis runs | **RESOLVED 2026-05-19 via §11.2 Stage 3.** Differential bloom: only changed/new/resolved annotations animate on re-analysis; unchanged stay still. Replaces both "full bloom every time" and "instant reveal" options. |
| 10 | `highlightType` (5 stroke patterns) keep or drop | **Drop entirely.** 6-tier color + 6-tier stroke (Q1) does all the inline work. Insight kind surfaced only in panel via `teachingMode` chip + `transferablePrinciple` pill (already in §4). Filter-by-kind is the Insights list-view's job. Conflict with Q1's stroke usage made re-introduction infeasible. |

---

## 9. Backend Gaps Noted (informational — no backend change requested)

These are observations from this audit. **The contract above does not
depend on backend producing any of these.** Listed so the backend team is
aware if a future surface wants them.

1. **Per-sentence effectiveness score (0-100).** Engine 6-tier system
   needs this. Currently UI uses derived 3-tier from L5 priority + type.
2. **Rewrite metadata: `registerMatch`, `divergenceDimension`,
   `variantCount`.** Engine RewriteCard expects these. v1 renders rewrite
   without the metadata row.
3. **Multiple rewrite variants per annotation.** Engine supports 1-2;
   L5 emits one.
4. **Sentence-level annotation effectiveness** (vs paragraph-level).
   L5 has `sentenceIndex` but it's an anchor, not a score.
5. **`connectionLabel` for cross-refs.** Currently derived UI-side from
   `teachingIntent`. Could be backend-emitted as a clean short string,
   but UI can ship without it.

---

## 10. What the backend team picks up from this

If a backend engineer reads only this doc, they should leave knowing:

1. **The student-facing UI consumes `L5Annotation` as-is.** No new fields
   are required for v1.
2. **The three annotation arrays** (paragraphAnnotations, crossParagraphAnnotations,
   essayLevelAnnotations) all flow into the same UI but to different surfaces
   — §5 specifies which.
3. **`StudentAnalysisDocument`** (the 6-section type at
   `src/services/essayIntelligence/presentation/types.ts`) is what `renderAnalysisForStudent`
   produces; v1 UI maps each section as in §3. If new sections appear
   in that document, this contract needs an update.
4. **Re-analysis carry-forward** is via `ReanalysisBrief` + `priorAnnotationContext`
   on the backend side. UI does not push viewed/applied/dismissed back
   to backend in v1.
5. **The engine adapter** (per `annotation-v2-engine/ADAPTER_GUIDE.md` §1)
   is the integration seam. Backend's job is to expose pipeline output in
   the `EssayProfile` shape OR provide enough surface for a thin adapter
   at `src/services/essayIntelligence/adapters/toEssayProfile.ts` to do
   the mapping.

---

## 11. The Iteration Loop — Student Revision UX (appended 2026-05-14)

> **Scope.** §1–§10 lock the FIRST READ. This section locks what the
> student experiences from the **second analysis onward** — the revision
> loop that turns the workshop from a one-shot critique into a real
> iteration partner. Same posture as the rest of this doc: no backend
> changes required for v1; gaps surfaced as open questions, not
> requirements.
>
> **Why this is its own section.** The first read is one moment. The
> iteration loop is the *product* — students don't pay for a critique,
> they pay to watch their essay get better. Without this section, every
> re-analysis after the first one looks identical to the first one, which
> wastes the most emotionally valuable moments the system can produce.

### 11.1 TL;DR

- **The loop has 8 stages:** rest → edit → trigger → load → diff-reveal
  → resolution → carryforward → return. Each is a distinct UX surface;
  most are absent from §1–§10.
- **Differential bloom wins.** Only annotations that *changed* (new,
  resolved, modified) animate on re-analysis. Unchanged annotations
  stay still. Progress is signaled by what doesn't move.
- **Resolved annotations become a real surface,** not a silent
  disappearance. The Roadmap tab gains a "Resolved" subsection with the
  prior critique + the student's revised sentence side-by-side. Recency-
  ordered (recent 10 + "Earlier in this essay" expand). Earned history
  is the loop's emotional payoff. Label: "Resolved by your edit · Xd ago".
- **Trigger is hybrid + cost-aware.** Explicit "Analyze again" button +
  contextual nudge fires when ANY of: (a) student pressed Copy on a
  RewriteCard since last analysis, (b) ≥2 anchored spans with
  substantive edit (>5 token delta each), (c) 60s post-edit dwell.
  Button surfaces credits (paid) or remaining free quota (free); UI
  calls `selectAnalysisMode()` predictively so the credit estimate
  reflects focused (~3) vs comprehensive (~15).
- **Phase-up is a moment, and the copy is backend-generated.** Crossing
  Foundation → Architecture (or any phase boundary) earns a single
  full-bleed celebratory beat, 6s auto-dismiss, dismissable via ESC /
  click-outside / [Got it]. Copy is LLM-generated per essay, referencing
  the essay's specific moves — **first §11 backend dependency**
  (`phaseTransitionLine: string \| null` on `L5AnnotationResult`). UI
  registry is the fallback floor only.
- **IDs are NOT stable across runs** (verified —
  `deepAnnotationService.ts:2070` mints fresh UUIDs every L5 call). UI
  owns a soft matcher to compute same/new/resolved. No backend change
  requested for matching itself.
- **Migration animation is viewport-aware.** Slide if destination
  visible; fade-and-reappear with pulse if offscreen.
- **Cross-session state persists.** This is a hard amendment to §6.1 +
  §8 Q4: iteration is multi-session, so viewed/applied/dismissed/
  resolved state moves from `sessionStorage` to `localStorage`-backed
  with `(essayId, version)` keying.
- **Welcome-back is tiered by gap:** nothing under 4h, brief
  "Last analyzed Xh ago" header chip for 4-24h, full welcome-back strip
  for ≥24h.

### 11.2 The 8 Stages

| # | Stage | Decision | Rationale |
|---|---|---|---|
| **0** | **Rest state.** Student has read N of M annotations; some applied via copy, some dismissed. Workshop is steady. | Cross-session persistence is **on** (localStorage, keyed by `essayId`). Welcome-back strip on return (§11.2 Stage 8). | Iteration is multi-session by definition. Without persistence, every session is a cold start and the loop never accumulates emotional weight. **Amends §6.1 default and resolves §8 Q4 toward "persist".** |
| **1** | **Edit begins.** Student types in the contentEditable. The moment a sentence is modified, its annotations are stale — anchored to text that no longer exists. | **Grey-out on edit.** When any token inside an anchor span is modified, the gutter pill desaturates to ~30% opacity and the underline fades to dotted-slate; popup hover shows a "Edited since analysis" caption. Annotation content stays accessible but visually demoted. | Honest, low-cost signal. Sharp pills lie about drifting text; instant deletion punishes typing. Grey-out is the "I don't know what to think yet" vibe — the right epistemic posture. |
| **2** | **Decision to re-analyze.** | **Hybrid + cost-aware trigger.** Explicit "Analyze again" button in the workshop header is always available. Nudge fires when ANY of: (a) student pressed Copy on a RewriteCard since last analysis, (b) ≥2 anchored spans with substantive edit (>5 token delta each), (c) 60s post-edit dwell. Button shows credits + ETA on paid (`[↻ Re-analyze · ~3 credits · 3s]`) or remaining free quota + ETA on free (`[↻ Re-analyze · 2 of 5 free left · 3s]`). UI calls `selectAnalysisMode()` predictively to choose focused (~3 credits) vs comprehensive (~15 credits). Default free quota: 5 re-analyses per essay before paywall. | Auto-debounce burns credits without consent. Pure-explicit lets students forget they edited and feel "stuck." The Copy-fired trigger catches the highest-signal failure mode (student applies a rewrite and walks away). Cost transparency trains the loop economy honestly and avoids billing surprise. |
| **3** | **Loading on re-analysis.** Fast path is ~2.5s (vs first analysis ~18s). | **Differential bloom.** Unchanged annotations stay exactly where they are. Greyed-out annotations either: (a) restore to full saturation if carryforward, (b) fade out + check-fly to the Resolved drawer if resolved, (c) crossfade their content if modified. Net-new annotations bloom in with a brief gutter-pulse + "NEW" chip. **The whole essay does NOT re-bloom.** | The single biggest moment of the loop. Full re-bloom every time feels like ceremony for ceremony's sake; instant reveal is disrespectful of the work the system just did. Differential bloom turns iteration into a visible reward — progress is signaled by what doesn't move. |
| **4** | **Resolution.** An annotation whose teaching the student addressed (typically by applying a rewrite). | **Real Resolved drawer.** Inline moment first: gutter pill becomes a ✓ in tier color, fades over ~2s, flies up-right toward the Roadmap tab badge (subtle motion). Then archived: Roadmap tab gains a "Resolved" subsection (collapsible, default-collapsed), each entry shows **old critique + student's revised sentence side-by-side** with the resolution timestamp. Counter on the Roadmap tab badge: "4 resolved." | Without Resolved, every re-analysis just shows another list. With Resolved, the student has *earned history* — they can scroll their own progress. This is the loop's emotional payoff and the surface the workshop needs to feel like a partner instead of a critic. |
| **5** | **Net-new annotations.** Annotations that didn't exist last run but appear now (rewrite opened a new question, new sentence written, etc.). | **NEW chip + sort-to-top.** Gutter pill carries a small "NEW" chip on first session post-emergence; chip fades after first view. Smart-order ranking pins net-new annotations to the top of the Insights queue for the first review pass. | NEW deserves different visual weight than carryforward — it's the system *reacting* to the student's edits, which is precisely the moment of trust-earning. Sort-to-top means the student sees "what I changed" → "what the system now sees" in one motion. |
| **6** | **Carryforward.** Annotations that survived re-analysis (same paragraph, same sentence, same teaching point). Since IDs aren't stable, UI computes the match. | **UI-side soft matcher** (no backend change): primary key = `(location.paragraphIndex, location.sentenceIndex, type)`; tiebreak = `teachingMode` match, then `content` cosine similarity ≥0.75 OR shared `teachingIntent` first-12-words. If matched → reuse prior gutter-pill position + viewed-state + applied/dismissed ledger entries. If not matched on first key but matched on content-similarity at a *different* sentenceIndex → treat as **migrated** (sentence-anchor moved); animate the gutter pill slide to the new line over ~400ms. | IDs are `crypto.randomUUID()` per run (verified `deepAnnotationService.ts:2070`). Backend's `PriorAnnotationContext` (verified `profileTypes.ts:4994`) gives the LLM context but is not a UI-consumable diff. A small matcher in `annotation-v2-engine/diff/` handles this in <100 lines. Lossy edge cases (same sentence, restructured critique) fall through to "treat as new + old resolves" — acceptable, names the gap honestly. |
| **7** | **Phase progression.** Essay crosses a phase boundary (Foundation→Architecture, Architecture→Craft, etc.). | **Celebratory phase-up beat.** Single full-bleed moment after differential bloom completes (≥250ms after `revealReady` so it doesn't compete). Centered card: `[phase-icon] You moved from {prev} to {next}` + a single italic line **backend-generated per essay** (e.g. "The translator essay's bones hold now — the scenes carry their own weight. What's left is the voice in those scenes."). Phase pill in workshop header animates color-shift simultaneously. Dismiss = ESC, click-outside, [Got it] button, or auto-dismiss at 6s. Shown **once per phase crossing** (localStorage flag `phasesCrossed: Set<phase>`). **Multi-phase edge case:** if a single re-analysis crosses 2+ phases (e.g., F→C in one big rewrite), show ONE beat at the highest phase reached; italic line drawn from that phase. | This is the **macro** progress signal across many revisions. Foundation → Distinction is the arc the entire product walks students through. Silent morph hides the arc; inline toast undersells it. The full-bleed beat is the only moment in the entire workshop that demands the student's full attention — reserve it for the moment that earns it. Backend-generated copy makes the moment land meaningfully instead of feeling generic. |
| **8** | **Cross-session return.** Student closes laptop, comes back hours/days later. | **Tiered greeting by gap.** **<4h gap:** nothing — student has perfect context. **4-24h gap:** brief inline chip in the workshop header (`Last analyzed 6h ago`), non-intrusive, no CTAs. **≥24h gap:** full welcome-back strip (above the AO Read strip, below the Workshop header). Single line: `Last analyzed {time-ago} · {X read · Y applied · Z resolved} · Phase: {current}`. CTAs: `[Continue reading →]` (default, smart-order resume) or `[Re-analyze]` (if essay was edited externally — checks dirty flag). Strip auto-dismisses after first interaction or after 30s. | Cheapest re-engagement primitive in the product. Tiering matches the actual signal — context decay is a function of time. Power-iteration users (open/close 5x/day) get clean workshops; cross-session returners get oriented; same-day returners get a quiet acknowledgment. |

### 11.3 The Diff Matcher (UI-side)

Lives at (proposed path) `src/components/annotation-v2-engine/diff/annotationDiffer.ts`. Pure
function, no React. Input: two `L5Annotation[]` arrays (prior + current). Output:

```ts
interface AnnotationDiff {
  carryforward: Array<{ prior: L5Annotation; current: L5Annotation; }>;
  resolved:     L5Annotation[];   // present prior, absent current
  new:          L5Annotation[];   // absent prior, present current
  modified:     Array<{ prior: L5Annotation; current: L5Annotation; reason: 'content' | 'rewrite' | 'priority'; }>;
  migrated:     Array<{ prior: L5Annotation; current: L5Annotation; }>; // matched at different sentenceIndex
}
```

Match algorithm (in order, first hit wins per current annotation):

1. **Exact slot match:** `(paragraphIndex, sentenceIndex, type, teachingMode)` identical → carryforward. If `content` Jaccard or cosine similarity < 0.6 → flag as `modified` (reason: `content`).
2. **Slot match w/o teachingMode:** same `(paragraphIndex, sentenceIndex, type)` but `teachingMode` differs → `modified` (reason: `priority`).
3. **Content match at different slot:** `teachingIntent` first-12-word match + same `type` + same `paragraphIndex` (different sentence) → `migrated`. Animate gutter slide.
4. **Cross-paragraph fallback:** same `teachingIntent` first-12-words + same `type`, anywhere → `migrated`. Animate gutter cross-fly.
5. **Unmatched prior:** `resolved`.
6. **Unmatched current:** `new`.

**Confidence threshold.** Tunable constant `MATCH_CONFIDENCE = 0.75`. Below threshold treat as `new + resolved` pair (split). Telemetry-log mismatch rate; if mismatch rate >15% in production, escalate to backend ID-stability ask.

### 11.4 Resolved Drawer Spec

Lives in Roadmap tab as a collapsible subsection above "Essay-Level Observations":

```
Roadmap
├── [Revision Priorities]   (5 items, ranked)
├── [Structural Map]        (collapsible)
├── ─────────────────────
├── Resolved · 14           (collapsible, default collapsed)
│   ├── P3S2 · NEEDS_WORK
│   │   ┌─────────────────────────────────────┐
│   │   │ THEN: "Then I learned the value..." │
│   │   │ Critique: Reads as moral lesson;    │
│   │   │ breaks scene voice.                 │
│   │   ├─────────────────────────────────────┤
│   │   │ NOW: "I unwound the wires by hand." │
│   │   │ Resolved by your edit · 2 days ago  │
│   │   └─────────────────────────────────────┘
│   ├── P5S1 · CRITICAL
│   ...                                              ← 10 most recent shown
│   ├── ─────────────────────
│   └── [▾ Earlier in this essay (4 more)]          ← expand for older
└── [Essay-Level Observations]
```

**Ordering: recency, descending.** Show most recent 10 by default; older entries collapse into "Earlier in this essay (N more)" expand. Reason for this over phase-grouping: not all students progress phase-wise — a student stuck in Foundation for 20 iterations would get one bloated group with no narrative advantage. Recency degrades better across all engagement patterns.

**Label uniform across triggers.** All resolutions show "Resolved by your edit · {time-ago}" regardless of whether the trigger was `rewrite_applied`, `edit_addressed`, or `manually_marked`. The slight overclaim for the `rewrite_applied` case (where the student copied the system's rewrite) is acceptable — the student still chose to apply it and integrate it into their essay; that's editorial agency. Differentiated copy was rejected as over-engineering for a label that lives in a collapsed drawer.

Persistence keying: `localStorage["uplift:resolved:{essayId}"] = Resolution[]`.

```ts
interface Resolution {
  resolvedAt: number;        // epoch ms
  prior: L5Annotation;       // the full annotation as it last was
  revisedSentenceText: string; // student's actual text at resolution time
  trigger: 'rewrite_applied' | 'edit_addressed' | 'manually_marked';
  phaseAtResolution: ImprovementPhaseLevel; // captured for future analytics + potential v2 phase-grouped option; NOT rendered in v1 drawer
}
```

Resolution is **inferred** by the diff matcher (Stage 6: prior present + current absent = resolved). The `revisedSentenceText` is captured from the current essay state at the moment the diff is computed. `trigger` is inferred: if the student pressed Copy on this annotation's RewriteCard before re-analysis → `rewrite_applied`; if they edited the anchor span but never pressed Copy → `edit_addressed`; if they used a (future) explicit "mark resolved" gesture → `manually_marked`.

### 11.5 Phase-Up Beat Spec

Triggers when `L5AnnotationResult.phase` on the new run differs from the prior run, AND `phasesCrossed` localStorage flag doesn't already contain the new phase.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                          [phase-icon]                            │
│                                                                  │
│              You moved from Architecture to Craft                │
│                                                                  │
│         "The translator essay's bones hold now — the             │
│          scenes carry their own weight. What's left              │
│          is the voice in those scenes."                          │
│                                                                  │
│                       [Got it]     [ESC]                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- **Italic line is backend-emitted per essay** (see §11.5.1 below). UI registry is the **fallback only** if `phaseTransitionLine` arrives null or empty (network failure, LLM hiccup, prior-phase unknown).
- Animation: scale-in 240ms ease-out-expo + 60% backdrop fade. Out: fade 180ms.
- Z-index above panel and editor; below modals (which we don't have).
- Side effect: phase pill in workshop header runs a color-shift animation simultaneously (same 240ms).
- Auto-dismiss: **6s** (polite). ESC, click-outside, [Got it] dismiss instantly.
- Phase pill remains in new color for the rest of the session.
- **Multi-phase crossing edge case:** if a single re-analysis crosses 2+ phases (rare but possible for massive rewrites, e.g., F→C), show ONE beat at the highest phase reached. `phaseTransitionLine` is generated for that highest target. `phasesCrossed` localStorage adds **all** crossed phases so intermediate beats won't fire later.

#### 11.5.1 Backend Dependency: `phaseTransitionLine`

**This is the one backend ask §11 takes on.** It is small and amortizes into the existing re-analysis cost (no extra LLM call, no extra latency).

```ts
interface L5AnnotationResult {
  // ... existing fields ...

  /**
   * §11 iteration loop: celebratory copy for the phase-up beat.
   *
   * Populated when `phase` on this result differs from the prior run's
   * phase (which the analysis pipeline already has via
   * `PriorAnnotationContext`). LLM-generated 1-2 sentence line that
   * references the essay's specific moves and the meaning of the
   * crossing for THIS essay.
   *
   * Null on first-ever analysis (no prior to compare).
   * Null when phase unchanged from prior run.
   *
   * Tone: italic, single beat, referenced to the essay's content.
   * Length: 15-40 words.
   * No metrics, no scores, no second-person commands.
   */
  phaseTransitionLine: string | null;
}
```

**Prompt sketch** (backend's call): Given prior phase, new phase, essay text, and the highest-priority growth that's now resolved + the highest-priority growth that remains, generate 1-2 sentences celebrating the crossing in a way only this essay would deserve. Italic register, no clichés ("Great job!", "Way to go!"), no aggregate scoring language.

**Fallback (UI registry)** still lives at `src/components/annotation-v2-engine/phaseIntent.ts` and ships with the contract. Renders when `phaseTransitionLine` is null/empty:

```ts
export const PHASE_TRANSITION_FALLBACK: Record<ImprovementPhaseLevel, string> = {
  foundation: '', // never crossed *into* foundation
  architecture: 'The shape is taking hold. Now we build the load-bearing scenes.',
  craft: 'The bones hold. Now we tune the voice.',
  polish: 'Voice is yours now. The remaining work is precision.',
  distinction: "You're past the rubric. What we work on now is what makes the piece yours alone.",
};
```

The fallback is the safety net for production reliability, not the production posture.

### 11.6 Backend Gaps Noted

**One v1 backend requirement** (newly taken on, see §11.5.1):
`phaseTransitionLine: string | null` on `L5AnnotationResult`. This is the
only backend change §11 requires.

The remaining items below are **informational only** — the contract does
not depend on backend producing any of them.

1. **Stable annotation IDs across runs.** Currently `crypto.randomUUID()`. If backend later content-hashes (e.g., `id = sha1(paragraphIndex + sentenceIndex + type + content-stem)`), the UI-side matcher (§11.3) can collapse to direct ID comparison and remove ~80% of its logic. Worth a backend conversation if matcher mismatch rate >15% in production.
2. **Explicit resolution signal.** Backend could emit `resolvedFromPriorAnnotationId: string | null` per current annotation when its `PriorAnnotationContext.addressedByEdit === true`. Would eliminate ambiguity in the `rewrite_applied` vs `edit_addressed` trigger inference.
3. **Snapshot integration.** The `Snapshot` system (`profileTypes.ts:5022+`) exists and could power richer Resolved drawer entries — show the full prior-iteration essay context next to the resolution. v1 ships with `revisedSentenceText` only; snapshot wire-through is a v2 enhancement.

### 11.7 Open Questions — Resolution Log

All 8 questions resolved 2026-05-19 by Tue. Captured here for traceability;
each resolution is integrated into the body of §11.2 / §11.3 / §11.4 / §11.5
above.

| # | Question | Resolution |
|---|---|---|
| 11-a | Nudge threshold for hybrid trigger | **Refined trigger.** Nudge fires when ANY of: (a) Copy-fired on a RewriteCard since last analysis, (b) ≥2 anchored spans with substantive edit (>5 token delta each), (c) 60s post-edit dwell. Copy-fired added because it is the highest-signal moment of the loop. |
| 11-b | Auto-dismiss duration for phase-up beat | **6s polite auto-dismiss.** ESC, click-outside, and [Got it] dismiss instantly. **Multi-phase edge:** if a single re-analysis crosses 2+ phases, show ONE beat at the highest phase reached. |
| 11-c | Resolved attribution copy tone | **Light emotional, uniform.** "Resolved by your edit · {time-ago}" across all triggers (`rewrite_applied`, `edit_addressed`, `manually_marked`). The slight overclaim on `rewrite_applied` is acceptable — student chose to apply and integrate the rewrite. |
| 11-d | Phase-transition copy origin | **Backend-emitted in v1.** `phaseTransitionLine: string \| null` added to `L5AnnotationResult` (§11.5.1). UI registry is fallback floor only. First and only §11 backend requirement. |
| 11-e | Cost surfacing on the re-analyze button | **Cost-aware, full surfacing.** Billing model: paid tier = per-analysis credit cost, free tier = limited quota (default 5 per essay). Button surfaces credits + ETA (paid) or remaining quota + ETA (free). UI calls `selectAnalysisMode()` predictively for accurate credit estimate. |
| 11-f | Migration animation aggressiveness | **Viewport-aware.** Slide if both old + new gutter pill positions are in the visible viewport. Fade-and-reappear with 200ms gentle pulse on appearance if destination requires scrolling. Telemetry-log migration-classification rate; revisit if matcher classifies >30% of re-analyses as migrated. |
| 11-g | Resolved drawer retention policy | **Recency-collapsed.** Show most recent 10 + "Earlier in this essay (N more)" expand. Rejected phase-grouping because not all students progress phase-wise (a student stuck in Foundation for 20 iterations would get one bloated group with no narrative value). `phaseAtResolution` still captured on each `Resolution` for future analytics / potential v2 alternative grouping. |
| 11-h | Welcome-back strip throttle | **Tiered by gap.** <4h: nothing. 4-24h: brief inline chip in workshop header ("Last analyzed Xh ago"), no CTAs. ≥24h: full welcome-back strip with counts, phase, and Continue/Re-analyze CTAs. Matches actual context-decay signal. |

---

## Authority

- **Locked by:** Tue Pham + Claude (this session)
- **Locked dates:** 2026-05-12 (§1–§10), 2026-05-14 (§11 iteration loop initial draft), 2026-05-19 (§11.7 open questions all resolved; §11.5.1 backend ask added; §8 Q4 + Q9 closed via §11 ripple), 2026-05-20 (§8 Q1, Q2, Q3, Q5, Q6, Q7, Q8, Q10 all resolved)
- **Locked artifacts:**
  - Production direction: AnnotationV2Demo.tsx visual spine + annotation-v2-engine hooks
  - 6-section composition mapping (§3)
  - L5Annotation field consumption table (§4)
  - Cross-paragraph / essay-level handling (§5)
  - UI-side state model (§6) — **amended by §11.1: cross-session persistence is ON, overrides §6.1 sessionStorage default**
  - Phase-aware UX rules (§7) — **amended by §8 Q5: Foundation row adds progressive-disclosure rules**
  - **§8 open questions** — all 10 resolved (see §8 resolution log)
  - **Student revision iteration loop (§11)** — 8 stages, diff matcher, Resolved drawer, phase-up beat
  - **Iteration loop open questions (§11.7 11-a through 11-h)** — all 8 resolved 2026-05-19
- **§11 + §8 backend dependencies (taken on across this contract):**
  1. `phaseTransitionLine: string | null` on `L5AnnotationResult` (§11.5.1) — celebratory copy for phase-up beat
  2. **Per-sentence effectiveness scores** from L3.5, exposed on `L5AnnotationResult` (§8 Q1) — drives 6-tier UI
- **Backend handoff doc:** [`docs/BACKEND_HANDOFF_2026_05_21.md`](./BACKEND_HANDOFF_2026_05_21.md) — full spec for the two asks above (field shapes, prompt extensions, integration sequence, calibration windows, telemetry, test plan).
- **What's not locked yet:** nothing in the contract — all open questions across §8 and §11.7 are resolved. The contract is the input for backend Phase 2 wire and frontend integration.

This document is the input for backend's Phase 2 wire. Re-open it only if
the L5Annotation shape changes, if the 6-section composition shifts, or
if iteration-loop assumptions in §11 (stable IDs, fast-path latency,
phase-transition signaling, free-tier quota model) prove wrong in
implementation.
