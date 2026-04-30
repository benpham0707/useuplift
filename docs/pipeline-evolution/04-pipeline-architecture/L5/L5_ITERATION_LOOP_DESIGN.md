# L5 Iteration Loop Design — Selective Carry-Forward as Quality Booster *and* Cost Optimizer

> **Plan only.** No code. The output of this document is the contract that the build phase will execute against. File:line citations throughout are anchored against `feat/wave-3a-phase-3b-3c` HEAD as of 2026-04-26.
>
> **[NOTE — L3.75 absorption applies (Phase 0 D-0.18 R-2 supersession). Per [`L3-75/L3_ABSORBS_L3_75.md`](../L3-75/L3_ABSORBS_L3_75.md) (APPROVED 2026-04-25), the L3.75 layer is being retired. Specific re-mappings within this doc:]**
>
> - **§3 (carry-forward inventory) rows 11–19 (the "L3.75 sections")**: each row's "L3.75 [field]" entry re-maps to its lens-of-origin (Voice / Meaning / Story / Admissions) per [`cross-cutting/L5_AND_MASTER_RECONCILIATION.md`](../cross-cutting/L5_AND_MASTER_RECONCILIATION.md) §R-2 re-mapping table. The carry-forward semantics stay; the layer name changes.
> - **§4.5 (per-section L3.75 policy, "10 sections with per-section invalidator")**: re-maps to "per-lens policy (4 lenses + Pass 3) with per-lens invalidator". The "single Sonnet call with section masks" mechanism is REMOVED — replaced by selective lens re-runs + optional Pass 3 re-run. NO single-call section-mask alternative.
> - **§10 F1 (voice-section refresh as backstop)**: re-maps to "Voice lens re-run as backstop trigger". The detector that flags drift on changed paragraphs now triggers a Voice lens re-run, not a "voice section" of L3.75.
> - **§11 Q1 (redirection fraction)**: superseded by Tue's R-1 Resolution A (2026-04-26). The retirement statement in §1 is authoritative. No mandated redirection fraction; extra spend is triggered by the escalation ladder per §6.4 + §9.
> - **§11 Q5 (L3.75 prompt-mask architecture)**: retired alongside the absorption. Lens-targeted re-run mechanism (per-lens invalidation flags + selective lens re-runs + optional Pass 3 re-run) is the canonical replacement. See Phase 4 D-4a.16 for the implementation deliverable.

---

## 1. The user's framing, restated

The iteration loop is **not** stateless re-analysis-with-a-brief, and **not** stateful "remember everything." It is **selective carry-forward**:

- Carry forward only what was **effective** (teaching that the student's edit actually landed against), what is **best** (highest-confidence durable reads — voice signature, north star through-line, mature findings), and what the system **needs to be efficient** (expensive priors that re-derivation would only reproduce: voiceMap, structural cartography on unchanged paragraphs, finding lineage, corpus retrievals).
- **Drop** teaching that didn't land, findings that have been superseded, holistic sections whose source paragraphs were edited, and anything where re-derivation produces a *better* read than the carry-forward.

The carry-forward rule has **two simultaneous, non-negotiable load-bearing purposes**:

1. **Quality booster and deepener.** Iteration N reads the essay with N iterations of accumulated understanding — voice has been studied across drafts, findings have matured through evidence, the same teaching has been tested for landing — not from cold start. The system gets *more* like a great human reader, not less.
2. **Cost and resource optimization.** The quality-deepener emerges *from the carry-forward itself*: when iteration N re-walks a changed paragraph, the walk reads it against the carry-forward context of every other paragraph and the prior `taughtMoves` for that location — a richer read than iteration 1 produced cold. That depth is **free** (it's just structured input), not bought with redirected budget. Saved budget is genuine savings, not a slush fund. Extra spend happens **only when a specific edit demonstrably demands it** — and that's exactly what the escalation ladder (§6.4) already encodes: ripples beyond paragraph trigger Level 3, contradictions trigger comprehensive, etc. No mandated redirection fraction.

A pure cost-cut design that produces shallower iteration-N output than iteration-1 fails the thesis. The redesign mandate: the carry-forward *itself* delivers the quality booster (by giving iteration N a fully-mapped accumulated context the cold iteration 1 lacked), and the cost half emerges as the natural consequence of not re-deriving what's still valid.

---

## 2. Codebase reality — what carry-forward exists today

### 2.1 The Tier 0 fact: the L5 carry-forward wire is built but feeds `undefined`

L5's `generateAnnotations` accepts a `priorAnnotations?: Map<number, PriorAnnotationContext>` parameter (deepAnnotationService.ts:481). The prompt **already** consumes it with explicit "ADDRESSED" / "STILL RELEVANT" framing:

```text
PRIOR ANNOTATIONS (from before the student's edit):
  [ADDRESSED] (action) Your opening tells, doesn't show...

If an annotation was ADDRESSED by the edit:
- Acknowledge the improvement briefly.
- Surface any NEW concerns the edit may have introduced.

If an annotation is STILL RELEVANT:
- Don't repeat it verbatim. Either deepen it ... or reference it briefly and move to what's changed.
```
(deepAnnotationService.ts:1402–1416)

The single L5 call site in the orchestrator passes `undefined`:

```text
deepAnnotationService.generateAnnotations(
  profileForAnnotations as EssayProfile,
  input.reanalysisBrief,
  contradictionAnnotationFlags,
  findingStoreForL5.size > 0 ? findingStoreForL5 : undefined,
  growthReadingStrategy,
  undefined, // priorAnnotations  ← DEAD WIRE
  candidateStoreForL5,
  input.essayId,
);
```
(analysisOrchestrator.ts:850)

`reanalysisOrchestrator.ts:1177` also passes `undefined` on the comprehensive-fallback path. The `PriorAnnotationContext` type — `{ priorAnnotations: Array<{ content; type; teachingMode; addressedByEdit: boolean }> }` — is fully defined at profileTypes.ts:4613–4622, and `addressedByEdit: boolean` is the exact "did teaching land" signal the design needs. **Nothing in the codebase populates this Map.** No `.set()` call exists in `analysisOrchestrator.ts`, `reanalysisOrchestrator.ts`, `focusedAnalyzer.ts`, or `deepAnnotationService.ts` itself. The infrastructure was built and shelved.

### 2.2 What does carry forward today (the working parts)

| Primitive | Status | Citation |
|---|---|---|
| **`ReanalysisBrief`** (edit summary, structural scope, staleAreas, conversationContext) | ✓ Fully implemented | profileTypes.ts:4187–4251; reanalysisOrchestrator.ts:1155–1177 |
| **`Finding` maturity lifecycle** — `hypothesis → developing → confirmed → deepened → superseded` | ✓ Fully implemented; the only mature carry-forward primitive | profileTypes.ts:3356–3361; findings/findingStore.ts:26–33, 70, 124–188 |
| **Finding `supersededBy` / `supersessionReason` / `lineage[]`** | ✓ Wired | profileTypes.ts:3486, 3492, 3514 |
| **`StalenessEffect`** with target ∈ `holistic_understanding | paragraph_understanding | paragraph_analysis | voice_map | connection | finding | finding_maturity | effectiveness_score` | ✓ Produced; ⚠ not linked back to specific Findings by ID | editUnderstandingService.ts:71–81; profileTypes.ts:140–180 |
| **`focusedAnalyzer.selectAnalysisMode()`** — 7-rule decision tree (`comprehensive` vs `focused`) | ✓ Live | focusedAnalyzer.ts:705–783 |
| **Escalation ladder**: Micro → Paragraph → Holistic → Comprehensive | ✓ Live | focusedAnalyzer.ts:1013–1118 (escalation to comprehensive at :1042; targeted holistic refresh at :1050+) |
| **`UnderstandingQuestion.iterationsSurvived: number`** + `mergeCuratedOutput(..., iteration)` | ✓ Live in growth engine | profileTypes.ts:4284; questionQueueManager.ts:78 |
| **`GrowthCycleState.iteration: number`** + `SynthesisIterationOutput.iteration` | ✓ Live (L3.75-internal only) | growthEngine.ts:85; profileTypes.ts:4327 |
| **`VersionRecord` + `editSequence: number`** | ✓ Live | versionTracker.ts:85, 800, 834; profileTypes.ts:2351 |
| **`ImprovementCandidate.materialized` status** (carries which moves L5 has rewritten) | ✓ Live | profileTypes.ts (ImprovementCandidateStore) |
| **3-block prompt cache** at L5 (system+phase / shared digest / per-paragraph) | ✓ Live; saves ~30–40% on multi-paragraph essays | deepAnnotationService.ts:1830–1850 |
| **`corpusTelemetryPersistence`** — corpus retrievals persist across iterations | ✓ Live | analysis/corpusTelemetryPersistence.ts |

### 2.3 What does **not** carry forward today (the gaps)

| Primitive | Status | Note |
|---|---|---|
| **Global iteration counter on `EssayProfile` / `ProfileIndex`** | ✗ Missing | Only `fullAnalysisCount` (profileTypes.ts:1918–2080) and `lastComprehensiveAt`. No `currentIteration`, `currentEditRound`. |
| **`taughtMoves` ledger** (which prior critiques have been delivered, in which iteration, with what landing status) | ✗ Aspirational only | Present in PLAN2.md and the memory; absent in code. |
| **"Did this edit address this annotation?" detector** | ✗ Missing | The `addressedByEdit` field exists on the type (profileTypes.ts:4621); no producer code. |
| **`StalenessEffect → Finding ID` link** | ✗ Missing | StalenessEffect.target = `'finding'` is a category; no `findingIds[]` array. The orchestrator has no way to know "this edit invalidates F7." |
| **Per-section L3.75 staleness** | ✗ Missing | The single Sonnet call regenerates all 10 holistic sections atomically; no section-level invalidation. |
| **L5 prior-annotations population logic** | ✗ Missing | See §2.1 — the wire is there, the producer is not. |
| **Per-iteration cost/savings/redirection accounting** | ✗ Missing | Each iteration's cost is computed in isolation; no ledger compares "cost of iteration N" vs. "savings vs. comprehensive baseline" or tracks where saved budget got spent. |

### 2.4 The cost-acceleration claim, sourced

Two slightly different numbers appear:

- `focusedAnalyzer.ts:15–16` (file header comment): *"Cost acceleration: Round 1 ~$0.75 → Round 5 ~$0.03 (focused pipeline = 10x cheaper)"*.
- `PLAN.md:6955, 7019`: *"Round 1 ~$0.75 (full pipeline, no prior knowledge) to Round 5 ~$0.03 (focused, zoomed, informed) — a 25x reduction."*

Both endpoints agree ($0.75 → $0.03). The compounding multiplier (10x vs 25x) is a derivation choice. Per-layer baseline costs (from `docs/L5_CONSUMPTION_AUDIT.md`'s cost table at lines 15–28):

| Layer | Model | Cost/essay (5-para) |
|---|---|---|
| L1 firstImpressions | Haiku | ~$0.02 |
| L2 structuralCartographer | Sonnet | ~$0.04 |
| L2.5 scoutPass | Haiku | ~$0.02 |
| L3 sequentialDeepWalk | Sonnet × paragraphs | ~$0.30 |
| L3.75 holisticSynthesis (10 sections, single call) | Sonnet | ~$0.10 |
| L3.5 analysisPass | Sonnet × paragraphs | ~$0.08 |
| improvementPhase | Sonnet | ~$0.025 |
| L4 (northStar + scoreMatrix + coachingMap + coherence) | Sonnet | ~$0.15 aggregate |
| L5 deepAnnotation | Sonnet × paragraphs + cross-para | ~$0.10–$0.50 |
| **Round-1 baseline (foundation/architecture)** | — | **~$0.85–$1.05** |

The "Round-1 ~$0.75" figure assumes a small essay (~5 paragraphs) and the foundation/architecture phase L5 (~$0.10) rather than craft/distinction L5 ($0.30+). Both numbers anchor the cost trajectory in §8.

### 2.5 Verdict on the existing infrastructure

The carry-forward architecture is **half-built and unwired**. The hard primitives — Finding maturity, supersession, staleness classification, focused/comprehensive mode selection, escalation ladders, prompt-cache structure — are sound and load-bearing. What's missing is:

1. The **producer** for `priorAnnotations` (the dead wire is the smoking gun).
2. A **landing detector** ("did this edit address this critique?").
3. A **TaughtMoves ledger** that names the iteration loop in code instead of by convention.
4. A **per-section L3.75 invalidation** instead of all-or-nothing.
5. A **finer-grained focused mode for structural edits** — today's `selectAnalysisMode()` routes any reorder/insert/delete to full comprehensive (focusedAnalyzer.ts:730), which is too coarse. A paragraph reorder doesn't invalidate voice profile, character revelation, or most findings; it invalidates structural reads. Focused mode should handle structural edits with a wider invalidation set, not blow up to full pipeline.

The redesign closes those five gaps. It does not re-architect the working machinery.

---

## 3. The carry-forward inventory

Each row names a meaningful carry-forward unit. Columns: **Default** (carry vs. re-derive), **Validity test** (what condition invalidates the item given a diff), **Quality test** (signal that the item is still effective/best, vs. mediocre and worth re-deriving), **Cost-to-re-derive**, **Cost-of-staleness** (qualitative).

| # | Layer | Item | Default | Validity test | Quality test | Re-derive cost | Cost of staleness |
|---|---|---|---|---|---|---|---|
| 1 | L1 | Per-paragraph `ParagraphFirstImpression` (apparentPurpose, emotionalRegister, voiceObservation, craftNotices, sentence-level descriptive notes) — profileTypes.ts:3531–3550 | **Carry per paragraph; re-run only on changed paragraphs** | Paragraph text changed at sentence level | LLM verifies fresh impression matches carry-forward register/purpose; mismatch → re-walk | ~$0.02/essay (Haiku, parallel) | Low — purely descriptive; downstream layers re-read |
| 2 | L1 | `ProfileIndex.essayLength`, `confidenceLevel`, `topicTags`, `paragraphDigest[]` — profileTypes.ts:1920–1938 | **Re-derive each iteration** | Always recomputed from current state | Cheap, deterministic | ~$0 | High — used everywhere for routing |
| 3 | L2 | `StructuralCartography` (paragraphRoles, arcType, transitions, centralTheme, themeProgression, thematicGaps, flatSpots) — types.ts:129–158 | **Carry full unless `structural.paragraphsReordered`/added/removed** | `focusedAnalyzer.ts:730` rules; OR significance≥transformative on >2 paragraphs | Arc confidence drift between fresh sample and carry-forward | ~$0.04 (Sonnet, single) | High — L3 walk depends on it |
| 4 | L2.5 | `ConnectionScoutOutput` (repeatedElements, tonalShifts, structuralEchoes) — profileTypes.ts:3570–3585 | **Re-run on any non-trivial paragraph edit** | Edit in any paragraph (forward-looking leads change with text) | Whether new candidates emerge that weren't in carry-forward | ~$0.02 (Haiku) | Medium — drives walk investigation depth |
| 5 | L3 | `paragraphUnderstanding` for **unchanged** paragraphs | **Carry** | Paragraph diff = none | — | $0 | Zero |
| 6 | L3 | `paragraphUnderstanding` for **changed** paragraphs | **Re-walk** | Paragraph diff ≥ minor | LLM novelty check ("does the fresh walk surface anything the carry-forward missed?") | ~$0.06/paragraph (Sonnet) | Critical — the spine of every downstream layer |
| 7 | L3 | `holisticEvolution` per-paragraph snapshot (centralThesis, thesisConfidence, voiceSignature, arcMomentum) — profileTypes.ts:3616–3621 | **Re-derive from carry-forward + new walk steps** | Always | — | Bundled with re-walk cost | Medium — re-analysis delta cues |
| 8 | L3 | `priorSentenceUpdates[]` back-prop (already supersession-based) — profileTypes.ts:3630–3639 | **Apply, then carry** | StoreSupersession trumps; lineage append-only | — | $0 (bookkeeping) | Low |
| 9 | L3 | `newConnections[]` and connection graph | **Carry; mark superseded if endpoints invalidated** | Either endpoint paragraph changed | Connection significance still observable in fresh walk | $0 (carried via supersession) | Medium |
| 10 | L3 | `newFindings[]` (the FindingStore additions, see #20–22) | **Carry as Finding records, route through Finding lifecycle** | Per-finding evidence anchors | — | $0 | See #20–22 |
| 11 | L3.75 | `voiceIdentity` (signature, register, distinctivePatterns, evolution, authenticVsPerformed, registerShifts, voiceMarkers, voiceWeaknesses) — profileTypes.ts:876–949 | **Carry across iterations** | Haiku register-shift detector compares prior signature to fresh paragraph reads on changed paragraphs; flag "register drift" | LLM judgment (LLM-first) | Targeted refresh: ~$0.005 (Haiku detector) → escalate to ~$0.02 (Sonnet voice section refresh) on positive | Medium — voice is slow-changing; stale voice profile under-targets coaching |
| 12 | L3.75 | `voiceMap` (vocabularyFingerprint, sentenceRhythm, perspectiveDistance, tonalDisposition, stabilityRegions, shifts) — profileTypes.ts:970–987 | **Carry; refresh shifts on changed paragraphs only** | Per-shift: shift's anchor paragraph changed | — | ~$0.02 (Sonnet, partial) | Low — currently dead in many fields per L5_CONSUMPTION_AUDIT.md |
| 13 | L3.75 | `emotionalTopography` (arcTrajectory, peakMoments, undertones, emotionalProgression, showVsTell, authenticityAssessment) — profileTypes.ts:1099–1122 | **Re-derive on edit to peakMoments-anchor paragraphs; otherwise carry** | Peak-moment anchor paragraph touched | Trajectory shift between carry-forward and fresh sample | ~$0.02 (Sonnet, partial section) | Medium — drives stakes framing |
| 14 | L3.75 | `momentEarnednessMap.moments[]` (mechanisms, gaps, structuralObservation) — profileTypes.ts:1140–1170 | **Re-derive on edit to moment-anchor paragraphs** | Anchor paragraph touched OR mechanism gap directly addressed | LLM judgment of mechanism still load-bearing | ~$0.02 (Sonnet, partial) | Medium-high — gaps are coaching gold |
| 15 | L3.75 | `thematicArchitecture` (centralThesis, thesisConfidence, thesisEvolution, threads, subtext, contradictions) — profileTypes.ts:1193–1208 | **Re-derive on structural edits or thesis-anchor paragraph edits** | Reorder OR thesis-anchor paragraph touched | Thesis confidence drift | ~$0.02 (Sonnet, partial) | High — drives north star |
| 16 | L3.75 | `narrativeStrategy` (primaryStrategy, pivotPoints, pacingAnalysis, structuralChoices, arcType, arcMomentum, turningPoint) — profileTypes.ts:1216–1234 | **Re-derive on reorder or pivot/turning edits** | structural reorder OR turningPoint paragraph edited | Arc momentum drift | ~$0.02 (Sonnet, partial) | High — drives L4 northStar |
| 17 | L3.75 | `characterRevelation` (writerPortrait, valuesRevealed, growthArc, blindSpots, intellectualFingerprint, revealedQualities) — profileTypes.ts:1242–1257 | **Carry; refresh on substantial revelation-bearing edits** | LLM judgment on whether the edit reveals new character | — | ~$0.015 (Sonnet, partial) | Medium — character is slow-changing |
| 18 | L3.75 | `craftAssessment` (strengthSignatures, growthEdges, imageSystem, sentencePatterns, wordPatterns) — profileTypes.ts:1265–1302 | **Re-derive on craft-targeted edits (polish/distinction phase)** | Edit in polish/distinction phase OR craft-pattern-bearing paragraph | Strength persistence; growthEdges still hold | ~$0.02 (Sonnet, partial) | Medium |
| 19 | L3.75 | `admissionsPositioning` (tellabilitySummary, distinctivenessFactors, institutionalFit, redFlags, archetypeContext) — profileTypes.ts:1337–1351 | **Carry; refresh on substantial repositioning edits** | Significance ≥ transformative OR archetype-bearing edit | LLM judgment | ~$0.015 (Sonnet, partial) | Medium |
| 20 | L3.5 | `paragraphAnalysis` (effectiveness, verdict, strengthSignatures, growthEdges, sentence-level effectiveness/strengths/weaknesses/priorityForImprovement) for **unchanged** paragraphs — profileTypes.ts:816–826, 695–730 | **Carry** | Paragraph diff = none | — | $0 | Zero |
| 21 | L3.5 | `paragraphAnalysis` for **changed** paragraphs | **Re-derive** | Paragraph touched | Score consistency vs carry-forward (drift > threshold = legitimate change) | ~$0.016/paragraph (Sonnet) | Critical |
| 22 | L3.5 | `confidence` triple (level + reasoning + sensitivityNote) — profileTypes.ts:3786–3793 | **Re-derive with paragraph analysis (sentence-level)** | Sentence touched | — | bundled with #21 | Low for `reasoning` (per L5_CONSUMPTION_AUDIT.md verdict: cut prose, keep enum) |
| 23 | improvementPhase | `level`, `focusAreas`, `deferredAreas`, `dimensionPhases`, `coachingLens`, `nearBoundary`, `transition` — profileTypes.ts:1859–1906 | **Re-derive every iteration** (the phase IS a lens, not a derivation) | Always | LLM produces with reasoning | ~$0.025 (Sonnet) | Critical — drives L5 prompt zoom |
| 24 | L4 | `northStar` (activeScale, throughLineMap, structuralRolesMap, trajectory, distinctivenessSignature, intentBridge, confidence, evolution) — profileTypes.ts:1376–1508 | **Carry unless arc/turning-point edit OR reorder** | structural reorder OR turningPoint paragraph edit OR arcMomentum-bearing edit | confidence drift; evolution coherence | ~$0.05 (Sonnet, partial) | Critical — drives all coaching |
| 25 | L4 | `scoreMatrix` per-paragraph entries — profileTypes.ts:2497 | **Carry unchanged paragraphs; re-derive changed** | Per-paragraph diff | — | included in L4 ~$0.05 | High |
| 26 | L4 | `scoreMatrix.crossParagraphPatterns[]` — profileTypes.ts:2499 | **Re-derive on multi-paragraph edits** | structural OR ≥2 changed paragraphs | — | included in L4 | High |
| 27 | L4 | `coachingMap` (transformativeInsight, priorities, protectedStrengths, emergentPatterns, scoreTensions) — profileTypes.ts:2602–2663 | **Re-derive every iteration** (it consolidates current state for L5) | Always | — | ~$0.05 | Critical |
| 28 | L4 | `coherenceReport` (contradictions, isCoherent, northStarAssessment) — profileTypes.ts:2552–2562 | **Re-derive every iteration** (cheap, Haiku adversarial) | Always | — | ~$0.005 (Haiku) | Medium |
| 29 | L5 | `priorAnnotations` Map (the dead-wire fix) — profileTypes.ts:4613 | **Materialize from prior `L5AnnotationResult` for every iteration > 1** | Always | — | ~$0 (lookup + map build) | Critical — the loop's main carry-forward unit |
| 30 | L5 | Annotation generation per **unchanged** paragraph | **Carry-forward as `priorAnnotations`; do not re-emit unless coachingMap.priorities has reshuffled OR a Finding affecting this paragraph matured** | Paragraph diff = none AND no priority shift AND no finding maturity change | — | $0 | Medium — but stale priorities feel like the system isn't watching |
| 31 | L5 | Annotation generation per **changed** paragraph | **Always re-derive; pass priorAnnotations for context** | Paragraph touched | — | ~$0.02–0.05/paragraph (Sonnet, cached system+phase+digest) | Critical — this is the iteration's deliverable |
| 32 | L5 | Cross-paragraph synthesis call — deepAnnotationService.ts:728–753 | **Re-derive on multi-paragraph edits OR priorities reshuffle; otherwise skip** | structural OR ≥2 changed paragraphs OR coachingMap.priorities top-3 shifted | — | ~$0.01 (Sonnet) | Medium — patterns no single paragraph can see |
| 33 | FindingStore | Findings whose evidence anchors (profileTypes.ts:3508) are in **unchanged** paragraphs | **Carry; maintain maturity** | Anchor paragraphs untouched | Lineage coherence | $0 | Zero |
| 34 | FindingStore | Findings whose evidence anchors are in **changed** paragraphs | **Maturity refresh via Haiku validity check; possibly supersede** | Anchor in changed paragraph OR `StalenessEffect.target = 'finding'` | LLM judgment of whether claim still holds against fresh text | ~$0.005/finding (Haiku) | Medium — stale findings teach against text that no longer exists |
| 35 | UnderstandingQuestion queue | `iterationsSurvived`-tracked questions — profileTypes.ts:4284 | **Carry; convergence-driven pruning** | Question answered OR superseded | — | $0 | Low |
| 36 | ImprovementCandidateStore | Candidates not yet materialized — orchestrator harvests | **Carry; mark obsolete when target sentence changed substantially** | Anchor sentence diff ≥ moderate | — | $0 | Low |
| 37 | corpus | `corpusTelemetryPersistence` retrievals (corpusTelemetryPersistence.ts) | **Carry across iterations (already persisted)** | — | — | $0 | Zero — the corpus is static |
| 38 | edit-time | `reanalysisBrief` — profileTypes.ts:4187 | **Build fresh each iteration** (it IS the diff) | Always | — | ~$0.02 (editUnderstanding LLM call) | n/a — input, not state |
| 39 | NEW | **`TaughtMove` ledger** — append-only record of every L5 annotation delivered, with iteration index, paragraph, finding link, content summary, and `landingStatus` (see §5) | **Append-only across iterations; carry indefinitely** | — | — | $0 | Critical — without it, "did teaching land" can't be computed |
| 40 | NEW | **`LandingStatus` per (TaughtMove, post-edit-iteration)** — `'addressed' | 'partially_addressed' | 'unaddressed' | 'changed_target' | 'pending'` | **Compute via Sonnet once per affected move per iteration; persist on TaughtMove** *(Spec amendment 2026-04-29 — was Haiku; landed implementation uses Sonnet per Tue's 2026-04-27 model policy.)* | Move's anchor paragraph touched OR student message references move | LLM judgment with reasoning | ~$0.0019/move (Sonnet, ~250 in / 80 out tokens) | Critical for the loop's central decision |

**40 rows.** The table covers L1 through L5 plus the cross-cutting carry-forward primitives (Findings, candidates, queue, ledger). New rows (#39, #40) are the loop's central additions; everything else is policy on existing primitives.

---

## 4. Per-layer policies

This section names the actual decision per layer, not just inventory. Each policy answers: *given a focused-mode iteration, what does this layer do?*

### 4.1 L1 — First Impressions

Carry per-paragraph; re-run Haiku only on changed paragraphs (significance ≥ minor). The unchanged-paragraph carry-forward is unconditional — L1 is descriptive, not judgmental, and re-derivation has no quality benefit. **Quality booster:** The carried L1 carries the iteration-1 register read; if iteration N's edit lands a register shift, the new L1 captures it cleanly while neighbors anchor stability. **Cost:** ~$0.004 per essay if 1 paragraph touched; vs $0.02 baseline.

### 4.2 L2 — Structural Cartography

Carry full unless one of: paragraphs reordered, added, or removed (rule 3 in `focusedAnalyzer.selectAnalysisMode()`, focusedAnalyzer.ts:730), or significance = transformative on >2 paragraphs (rule 5). On single-paragraph rewrite: keep carry-forward, but re-validate `paragraphRoles[]` for the changed paragraph through the L2 prompt's role-classification head only (~$0.01, partial). **Cost:** $0–$0.04.

### 4.3 L2.5 — Connection Scout

Re-run Haiku on **any** edit that touched paragraph text (the scout's job is forward-looking surface signals, and those move with text). The scout's signals feed the L3 walk; carrying stale signals means L3 misses the lead the edit just opened. ~$0.02 every focused-mode iteration. **Quality booster:** the scout is the cheapest "what's new in this draft?" detector and worth running fresh.

### 4.4 L3 — Sequential Deep Walk

The most consequential per-layer decision. Two-tier policy:

**Tier A — unchanged paragraphs carry their `paragraphUnderstanding` and `sentenceUnderstandings` directly.** Validity: the paragraph diff is empty. Quality test: none needed (the source text didn't change). Cost: $0.

**Tier B — changed paragraphs re-walk.** Validity: the paragraph diff is ≥ minor. The walk receives the **prior `paragraphUnderstanding` for this paragraph as input context**, not a discard. The walk's first instruction in iteration N is *"Here is what was understood last iteration; here is the edited text; what does the edit reveal that the prior understanding missed, contradicted, or deepened?"* This is the **novelty-driven growth** principle from `essay-intelligence-v2.md` applied to iteration: depth comes from concrete contrast, not from re-judging the same text.

Cross-paragraph carry-forward concern: when paragraph 3 changes but paragraph 4 doesn't, paragraph 4's `holisticEvolution` snapshot was taken with old-paragraph-3 in scope. The walk on paragraph 3 will produce a fresh snapshot; paragraph 4's snapshot is now technically stale but its *understanding* isn't. Resolution: keep paragraph 4's `paragraphUnderstanding`; recompute `holisticEvolution` from the updated walk chain after the edit. The understanding is the durable read; evolution is a derived snapshot. Cost: ~$0.06 per changed paragraph.

### 4.4b Structural edits in focused mode (the fine-grain fix)

Today's `selectAnalysisMode()` (focusedAnalyzer.ts:705–783) routes any paragraph reorder/insert/delete to full comprehensive — rules 3 and 4 (focusedAnalyzer.ts:730, 734). This is the right *safety* default but the wrong *cost* default: a reorder genuinely invalidates structural reads (L2 cartography, narrativeStrategy, throughLineMap, scoreMatrix.crossParagraphPatterns, coachingMap) but does **not** invalidate voice profile, character revelation, most L1 descriptive notes, most findings whose anchors remained internally intact, or most prior L5 annotations.

The redesign adds a third mode — `focused_structural` — between `focused` and `comprehensive`. It fires when the only invalidator is structural reorder/insert/delete (no transformative paragraph rewrites alongside). Behavior:

- **Re-derive (structural reads):** L2 cartography, narrativeStrategy, thematicArchitecture (if reorder reshuffles thesis position), L4 northStar.throughLineMap and structuralRolesMap, scoreMatrix.crossParagraphPatterns, coachingMap.
- **Carry (durable reads):** voiceIdentity, voiceMap, characterRevelation, craftAssessment, L1 firstImpressions per paragraph (re-key indices to new positions; the descriptive content is the paragraph's, not the position's), unchanged paragraphs' L3 understanding and L3.5 analysis.
- **Index remapping:** the `priorAnnotations` builder (§7.5) and Finding evidence anchors (profileTypes.ts:3508 `location.paragraph`) get remapped through `editUnderstandingService.diff.paragraphChanges[]`. A move on old-P3 that is now-P2 is keyed to P2 in the new Map, not dropped.
- **Findings:** identity preserved across reorder; `lineage[]` gets a "paragraph index remapped P3→P2" entry. Maturity unchanged unless the structural change broke the claim.
- **Cost target:** ~$0.40–0.50 (vs $1.12 comprehensive), driven mainly by L2 + targeted L3.75 + L4 + cross-paragraph L5.

This is the single biggest cost lever after L3.75 sectioning: structural edits are common in mid-draft revision and shouldn't pay full-pipeline price.

### 4.5 L3.75 — Holistic Synthesis (per-section policy)

This is the layer where "section-by-section carry-forward" pays the most. The 10 sections inside the single Sonnet call have very different staleness profiles:

| Section | Carry default | Invalidator |
|---|---|---|
| `voiceIdentity` | **Carry** | Haiku register-shift detector flags drift on changed paragraphs |
| `voiceMap` | **Carry**, refresh shifts on changed paragraphs only | Per-shift anchor paragraph touched |
| `emotionalTopography` | **Carry**, refresh trajectory on peak-moment edits | Peak-moment anchor paragraph touched |
| `momentEarnednessMap` | **Re-derive** if any moment-anchor paragraph touched | Anchor change |
| `thematicArchitecture` | **Re-derive** on structural edits or thesis-anchor edits | Reorder OR thesis-anchor change |
| `narrativeStrategy` | **Re-derive** on reorder OR turningPoint/pivotPoint edits | Reorder OR pivot edit |
| `characterRevelation` | **Carry** (slow-changing) | Substantial revelation-bearing edit (LLM judges) |
| `craftAssessment` | **Re-derive** in polish/distinction phase OR craft-pattern paragraph edit | Phase + edit conjunction |
| `entanglements` | **Re-derive** on multi-paragraph edits | ≥2 paragraphs |
| `admissionsPositioning` | **Carry**, refresh redFlags/archetypeContext on substantial repositioning | Significance ≥ transformative |

**Implementation note:** today the L3.75 call regenerates all 10 sections atomically (single Sonnet, ~$0.10). The redesign requires **two L3.75 prompt variants**:

1. **Targeted refresh prompt** (the iteration default): receives carry-forward synthesis + diff + per-section invalidation flags. Instructed: "Update only the flagged sections; the others are validated. Return the same shape, with the unflagged sections copied from the prior synthesis verbatim." Cost: ~$0.04 (smaller output, same input frame).
2. **Full regen prompt** (used for first-pass and comprehensive-mode escalation): the current behavior. ~$0.10.

This is the single biggest cost lever in the loop, because L3.75 is one Sonnet call with 10 sections of variable staleness. If 2 of 10 sections invalidate, the targeted-refresh saves ~$0.06 per iteration, and that saved budget has somewhere to go (§9).

### 4.6 L3.5 — Analysis Pass

Carry unchanged paragraphs' `paragraphAnalysis` directly (#20). Re-derive changed paragraphs (#21). The `confidence` triple comes with the paragraph re-derivation. Per L5_CONSUMPTION_AUDIT.md row 116, the `confidence.reasoning` prose is unread — drop it from output to save tokens (this is independent of carry-forward but compounds the iteration savings). ~$0.016/changed paragraph.

### 4.7 improvementPhase

**Re-derive every iteration. Cheap; the phase is a lens, not a derivation, and the iteration's whole job often is to detect a phase transition.** Pass prior phase as input context so `transition.priorLevel` and `transition.isGenuineShift` populate correctly (the type already supports this — profileTypes.ts:1897–1899). Cost: $0.025.

### 4.8 L4 — North Star

Carry unless: structural reorder OR turningPoint paragraph edit OR arcMomentum-bearing edit. The carry preserves `confidence`, `evolution`, `lastUpdatedBy` (which serves as the audit trail of carry-forward decisions). On invalidation: re-derive with carry-forward as input ("the prior north star was X; the edit was Y; does the through-line still hold or has it shifted?"). ~$0.05 amortized.

### 4.9 L4 — Score Matrix + Coaching Map + Coherence

- **scoreMatrix per-paragraph:** carry unchanged, re-derive changed. **crossParagraphPatterns:** re-derive on multi-paragraph edits. ~$0.02–$0.05.
- **coachingMap:** **re-derive every iteration** (#27). It IS the consolidated reading L5 will execute against — recomputing it cheaply is the price of admission for L5 surgical mode. ~$0.05.
- **coherenceReport:** **re-derive every iteration** (Haiku, ~$0.005). Catches contradictions introduced by the edit.

### 4.10 L5 — Deep Annotation

**The center of the loop.** Three concerns:

**(a) `priorAnnotations` population (the dead-wire fix).** Before the L5 call, the orchestrator constructs `Map<paragraphIndex, PriorAnnotationContext>` from the prior `L5AnnotationResult` (now persisted to a checkpoint, see §7). Each entry includes `addressedByEdit` computed by the landing detector (§5). The L5 prompt at deepAnnotationService.ts:1402–1416 already consumes this — the wire just needs feeding.

**(b) Per-paragraph generation.** Re-derive for changed paragraphs always; for unchanged paragraphs, **only re-emit if a Finding affecting that paragraph matured OR `coachingMap.priorities` reshuffled OR a higher-rank annotation in the priorAnnotations was marked `unaddressed`**. The default is silence. This is the corollary of the user's framing rule: re-teaching landed lessons is the named failure mode; not re-teaching unchanged paragraphs is the *required* default. ~$0.02–$0.05/paragraph.

**(c) Cross-paragraph synthesis.** Re-derive on multi-paragraph edits or priorities reshuffle; skip otherwise. ~$0.01.

**Key behavior change vs today:** L5 is currently always run on every paragraph (deepAnnotationService.ts:566–594, `Promise.allSettled` over all paragraphs in batches of 2). The redesigned loop runs L5 on a *subset* of paragraphs each iteration after the first, anchored on edit + priority shift + maturity. The 3-block prompt cache (deepAnnotationService.ts:1830–1850) already amortizes the system+phase+shared-digest blocks across paragraphs in a single iteration; the cache survives within an iteration even if fewer paragraph calls are made.

### 4.11 FindingStore

The maturity lifecycle (#33–34) is *the* mature carry-forward mechanism. The redesign extends it minimally:

- On every iteration: identify Findings whose evidence anchors (profileTypes.ts:3508 — `textEvidence: Array<{ text; location: { paragraph; sentence? } }>`) are in changed paragraphs. Run a Haiku validity check ("does this claim still hold against the new text?") against each. Outcomes:
  - **holds** → maturity unchanged (or `developing → confirmed` if a new draft confirms the claim).
  - **deepens** → `confirmed → deepened`, with the new evidence appended to `lineage[]`.
  - **superseded** → mark `supersededBy` with the new finding ID; set `supersessionReason`.
- The Haiku call costs ~$0.005/finding. With ~10–20 findings per essay (per the post-L3 typical store size) and ~3–5 affected by an average edit, this is ~$0.015–$0.025/iteration.

### 4.12 UnderstandingQuestion queue

Carry-forward is the queue's design intent (`iterationsSurvived: number`, profileTypes.ts:4284). No changes. Convergence-driven pruning continues to apply per `essay-intelligence-v2.md` and PLAN2.md.

---

## 5. Landing detection — the heart of the loop

The carry-forward decision for L5 annotations (and for `taughtMoves` more generally) **depends on knowing what landed**. This is the single hardest LLM-judgment call in the system.

### 5.1 The three signals

**Signal A — Edit-vs-critique LLM judgment.** A Sonnet call reads: *(Spec amendment 2026-04-29 — design doc originally said Haiku; landed implementation uses `claude-sonnet-4-5-20250929` per Tue's 2026-04-27 model policy. Signal weighting in landing detection is judgment, not pattern-matching. Per-call cost ≈ $0.0019, well under the $0.10 build-phase ceiling.)*
- The prior annotation's `content`, `teachingMode`, `stakes`, `rewriteExample` (if any), `location`.
- The diff for that location (old text → new text), drawn from `editUnderstandingService` output.

…and produces `{ landingStatus: 'addressed' | 'partially_addressed' | 'unaddressed' | 'changed_target', reasoning, confidence }`. The LLM owns the judgment (LLM-first, per `feedback_llm-first-design.md` Rule 1). No regex, no keyword detection — the LLM reads the edit against the critique's intent.

**Signal B — Re-detection failure.** After the L3.5 fresh analysis runs on the changed paragraph, check whether the same problem (same `symptomType`, similar `evidence`, similar `priorityForImprovement`) is detected at the same location. If the prior annotation was carrying Finding F7's claim, and F7's anchor was at P1S2, and the new analysis at P1S2 doesn't surface F7's symptom: that's a positive landing signal. Re-detection failure ≠ false negative; it means the critique is no longer warranted by the text. Implementation: the Finding maturity refresh in §4.11 produces this signal as a side effect.

**Signal C — Chat behavior signal.** From the L6 / Conversator session log: did the student engage with the critique, dismiss it, or move on? Engagement followed by editing in the right direction is positive. Dismissal followed by no edit is mixed. Asking a clarifying question is "still pending." This signal is **noisy** and should be a *tiebreaker*, not a primary input. (If the Conversator seam isn't yet wired, the field is `null` and the combiner uses A+B only.)

### 5.2 The combiner — LLM, not formula

Per `feedback_llm-first-design.md` Rule 1, **the combiner is itself an LLM judgment**. The Sonnet call that computes Signal A receives B and C as additional inputs in the same prompt:

```text
You are judging whether a student's edit landed against a prior critique.

Prior critique:
  Mode: {teachingMode}
  Content: {content}
  Stakes: {stakes}
  Located at: P{para}.S{sent}, span: "{spanText}"
  Suggested rewrite: "{rewriteExample}"

The edit:
  Old: "{oldText}"
  New: "{newText}"
  Significance: {significance}

Re-analysis re-detection (signal B):
  At the same location, the new analysis says: {newAnalysisAtLocation}
  (was the same symptom flagged again? what changed?)

Conversator signal (signal C, may be null):
  Student's chat behavior on this critique: {chatBehavior}

Produce: { landingStatus, reasoning, confidence }
- 'addressed' = the edit changed the text in a way that resolves the critique's intent.
- 'partially_addressed' = the edit moved in the right direction but the critique's full point isn't yet met.
- 'unaddressed' = the edit didn't engage the critique (or engaged but missed).
- 'changed_target' = the edit transformed the location enough that the prior critique no longer applies (the target moved); a fresh critique is needed.
```

No deterministic AND/OR over signals. The LLM weighs them. Cost: ~$0.002–$0.005/move/iteration.

### 5.3 The false-positive / false-negative tolerance

The user's framing names *repetition* as the failure mode the system must avoid. So the tolerance is asymmetric:

- **Better to skip an unlanded lesson than to re-teach a landed one.** A false-positive landing detection (the system thinks it landed when it didn't) costs the student a missed teaching beat; the next iteration may resurface it via fresh analysis if the underlying issue persists. A false-negative landing detection (the system thinks it didn't land when it did) costs the student the user-named failure mode: the system feels like it isn't watching, repeats critiques verbatim, breaks trust.
- **Default behavior on `partially_addressed`:** acknowledge the progress, deepen rather than repeat. Never copy the prior critique into the new annotation set. The L5 prompt at deepAnnotationService.ts:1402–1416 already enforces this; the redesign's job is to make sure that wire is fed.
- **Default behavior on `unaddressed`:** re-teach **with a different angle**, not verbatim. The prior `content` becomes input to the new annotation prompt with explicit guidance: "this critique is unaddressed; produce a fresh framing of the same teaching, not a repeat."
- **Default behavior on `changed_target`:** suppress the prior annotation entirely; let the fresh analysis carry the new state.

The bias is **prefer-not-to-repeat over prefer-to-cover**, locked in by prompt and by the priorAnnotations passing rule. This is also why a confidence floor on the landing detector is set high (e.g., `confidence ≥ 0.7` to count as `addressed`); below that, the system treats as `partially_addressed` and deepens rather than skips. Deepening is safer than skipping when uncertainty is real.

---

## 6. Read arbitration — carry-forward vs. fresh

After iteration N, two reads coexist for unchanged paragraphs:
- **carry-forward:** the prior pipeline's understanding/analysis/holistic-section-slice.
- **fresh:** what the pipeline would say *now* if it ran from scratch on the changed paragraphs and re-synthesized the holistic from there.

The system picks per-item:

### 6.1 Default policy

- **Unchanged paragraphs:** carry-forward wins. No fresh read is computed; the carry-forward IS the read. (Computing a fresh read just to compare costs Sonnet money for no quality gain — see §4.4 Tier A.)
- **Substantively changed paragraphs:** fresh wins. The carry-forward is passed *as input context* to the fresh read (see §4.4 Tier B), not as a competitor.
- **Lightly touched paragraphs (significance = minor, <5 words changed):** carry-forward wins, but the L5 step optionally re-derives if the touched span is a `protectedStrengths` anchor or a `coachingMap.priorities` top-3 anchor. In those cases, the change is small but the read needs to be current.
- **Unchanged paragraphs whose surrounding context changed (the seam):** see §6.2 below.

### 6.2 The seam

A paragraph that didn't change but whose neighbors changed — the seam case the user named — is the actual hard call. Two sub-cases:

**Sub-case A: structural neighbors changed (reorder/insert/delete).** This is comprehensive-mode territory by `selectAnalysisMode()` rules 3–4 (focusedAnalyzer.ts:730–739). The whole pipeline re-derives; carry-forward is preserved only at the L1 descriptive layer and as input context to the re-walk. The seam is resolved by going wide.

**Sub-case B: a neighbor's content changed but structure didn't.** The unchanged paragraph's `paragraphUnderstanding` is *still valid* — its sentences didn't change — but `holisticEvolution` snapshots taken at this paragraph during the walk are now stale (they reflect the pre-edit context). Resolution: the walk in iteration N processes the changed paragraphs in original order, and as side effect produces fresh `holisticEvolution` snapshots that propagate forward. Unchanged paragraphs' understanding stays; their *holisticEvolution snapshot* is updated by the walk's natural state-passing (no extra LLM call). This is already how the walk works; it just needs the iteration loop not to re-walk the unchanged paragraphs.

### 6.3 The arbitration mechanism

For most items, validity tests resolve the call deterministically (the validity columns in §3 are tests, not LLM judgments):
- Paragraph touched? Re-derive.
- Structural reorder? Comprehensive.
- Finding evidence anchor in changed paragraph? Maturity refresh.

For the few cases where the test is ambiguous — e.g., is this register-shift signal strong enough to invalidate the voice profile? — the **arbitration is an LLM judgment** (per Rule 1). Cheap escalation: a Haiku call reads (carry-forward state, fresh sample) and produces `{ verdict: 'carry' | 'rederive', reasoning }`. ~$0.005 per ambiguous decision.

### 6.4 The escalation ladder

Already implemented in code (focusedAnalyzer.ts:1013–1118) and worth preserving:

| Level | Trigger | Action | Cost |
|---|---|---|---|
| **0 — accept carry-forward** | Validity tests pass on all relevant items | Done. | $0 |
| **1 — micro** | `rippleFlags.beyondSentence === false` | Apply deltas locally on changed sentence(s); other paragraph state unchanged | ~$0.02 |
| **2 — paragraph** | ripples beyond sentence but not paragraph | Re-do paragraph-level analysis (L3.5) | ~$0.04 |
| **3 — holistic** | ripples beyond paragraph | Targeted L3.75 refresh (per §4.5 — only invalidated sections) + L4 update | ~$0.06 |
| **4 — comprehensive** | Level 3 deltas exceed threshold; OR `selectAnalysisMode()` rules 3–5 fire | Full pipeline (the today-default) | ~$0.85 |

The ladder fires in order and stops at the first level that contains the change. The redesign extends Level 3 with the per-section L3.75 policy (§4.5) — currently the holistic refresh at focusedAnalyzer.ts:1050 calls `holisticSynthesisService.synthesizeUnderstandingProse` against the full synthesis; the redesign passes section-level invalidation flags so only the affected sections regenerate.

---

## 7. The state object — `IterationLedger`

The carry-forward design requires named state that isn't currently on the profile root. This section types it.

### 7.1 `IterationLedger` — the new top-level state on `EssayProfile`

```ts
interface IterationLedger {
  /** Monotonically increasing iteration counter. Iteration 1 = first-pass. */
  currentIteration: number;
  /** Append-only record of every iteration's cost and decisions. */
  iterations: IterationRecord[];
  /** Append-only ledger of every L5 annotation ever delivered, with landing status. */
  taughtMoves: TaughtMove[];
  /** Per-iteration carry-forward decisions for diagnostic/audit. Pruned after 5 iterations. */
  recentDecisions: CarryForwardDecision[];
}

interface IterationRecord {
  iteration: number;
  triggeredBy: 'first_pass' | 'edit' | 'student_request';
  editScope?: {
    paragraphsChanged: number[];
    significance: 'minor' | 'moderate' | 'significant' | 'transformative';
    changeTypes: EditChangeType[];
    structural: { reordered: boolean; added: number; removed: number };
  };
  /** What the orchestrator decided to re-derive vs carry. Item-keyed. */
  carryForwardSummary: {
    carried: string[];   // e.g., ['voiceMap', 'P1.understanding', 'F3', 'F5']
    rederived: string[]; // e.g., ['P3.understanding', 'P3.analysis', 'thematicArchitecture']
    refreshed: string[]; // partial refreshes, e.g., ['L5.P3.annotations', 'F7.maturity']
  };
  /** Cost actually spent this iteration. Per-layer breakdown. */
  costBreakdown: Record<string, number>;
  /** Cost a comprehensive baseline would have spent. Audit-only — informs cost-trajectory monitoring, not redirection. */
  comprehensiveBaselineCost: number;
  /** comprehensiveBaselineCost - sum(costBreakdown). Genuine savings, not a slush fund. */
  carryForwardSavings: number;
  /** Whether escalation fired this iteration, and to which level (1–4). For auditing escalation calibration. */
  escalationLevel: 0 | 1 | 2 | 3 | 4;
  /** Free-text rationale for any ambiguous decisions (LLM-generated). */
  rationale: string;
  startedAt: string;
  finishedAt: string;
}

interface TaughtMove {
  /** Stable ID, e.g., `M-{iteration}-{paragraph}-{seq}`. */
  id: string;
  /** L5Annotation.id at time of generation. */
  annotationId: string;
  /** Optional Finding link (the durable claim this move teaches against). */
  findingId?: string;
  /** Where the move was anchored. */
  location: { paragraphIndex: number; sentenceIndex?: number; spanText?: string };
  /** When delivered. */
  taughtAtIteration: number;
  /** Mode and content snapshot for landing detection input. */
  teachingMode: 'awareness' | 'consequence' | 'connection' | 'action';
  contentSummary: string;             // 1-2 sentences; full annotation in checkpoint
  stakesSnapshot?: string;
  /** Landing status, set on the iteration AFTER delivery. */
  landing?: {
    status: 'addressed' | 'partially_addressed' | 'unaddressed' | 'changed_target' | 'pending';
    detectedAtIteration: number;
    confidence: number;             // 0-1
    reasoning: string;
    signalsUsed: Array<'edit_vs_critique' | 'redetection' | 'chat_behavior'>;
  };
  // [D-1.6.6 closure 2026-04-30] `deepenedBy?: string[]` and
  // `supersededBy?: string` were removed from the runtime type — they
  // had zero producers and zero consumers in src/services/essayIntelligence/
  // (Phase 1 dead-wire audit findings F-02, F-03). The fields will be
  // re-added when a future deliverable lands a producer (mutator + write
  // site) AND a consumer (the code that reads the chain) in the same
  // commit. Don't grow a new dead wire. Note: `Finding.supersededBy` and
  // `ImprovementCandidate.supersededBy` ARE wired and remain.
}

interface CarryForwardDecision {
  iteration: number;
  itemKey: string;                    // e.g., 'voiceMap.signature' | 'F7' | 'P3.analysis'
  decision: 'carry' | 'rederive' | 'partial_refresh';
  rationale: string;
  costSavedIfCarry: number;           // baseline re-derive cost
  costSpentIfRederive: number;        // 0 if carried
  arbitrationMechanism: 'validity_test' | 'llm_judgment' | 'comprehensive_rule';
}
```

### 7.2 What populates each field

- `currentIteration`: incremented at the **start** of every iteration by the orchestrator (analysisOrchestrator.ts entry; reanalysisOrchestrator.ts re-analysis entry).
- `iterations[]`: pushed at iteration end by the orchestrator after all costs are tallied. The `iterations[N-1]` entry is the iteration's audit record.
- `taughtMoves[]`: appended at L5 end, one entry per emitted `L5Annotation`. The `landing` field is **null at delivery**, populated by the landing detector on the *next* iteration (since landing is observed only after the student's response edit).
- `recentDecisions[]`: appended at every carry-forward decision point in the orchestrator (per-paragraph, per-Finding, per-L3.75-section, etc.). Pruned to the last 5 iterations on iteration end.

### 7.3 What reads each field

- `currentIteration`: the `priorAnnotations` builder (§7.5) reads the full taughtMoves history; the L5 prompt's iteration context; the focused analyzer's mode-selection (`if iteration > 1, prefer focused`).
- `taughtMoves[]`: the **landing detector** (Sonnet call in §5; spec amendment 2026-04-29) reads `taughtMoves` for the prior iteration to compute landing status; the L5 priorAnnotations builder reads them to build the `Map<paragraph, PriorAnnotationContext>`.
- `carryForwardSummary`: the redesigned L3.75 targeted-refresh prompt reads the `rederived` list as section-invalidation flags.
- `escalationLevel` + `comprehensiveBaselineCost` + `costBreakdown`: audit only. Used to detect calibration drift in validity tests (e.g., persistent over-escalation on small edits).

### 7.4 Pruning rules

- `currentIteration`: never pruned.
- `iterations[]`: kept indefinitely; one record is small (~500 bytes). 50 iterations = ~25KB; not a memory concern.
- `taughtMoves[]`: kept indefinitely; the cross-iteration narrative ("you've been working on opening hooks across iterations 1–3") needs the full history. Storage: ~1KB per move × ~5 moves/iteration × 20 iterations = ~100KB; acceptable.
- `recentDecisions[]`: pruned to last 5 iterations because they're dense and only audit-relevant short-term.

### 7.5 The `priorAnnotations` builder (the dead-wire fix)

Pseudo-flow at the orchestrator before the L5 call (replacing the `undefined` at analysisOrchestrator.ts:850):

```text
1. If currentIteration === 1: priorAnnotations = undefined. (No history.)
2. Else: read taughtMoves[] where taughtAtIteration === currentIteration - 1.
3. For each prior move:
   a. Run landing detector (§5) → get landingStatus, addressedByEdit (boolean).
   b. Persist back to taughtMoves[move].landing.
4. Group prior moves by paragraphIndex.
5. For each paragraph, build PriorAnnotationContext { priorAnnotations: [{ content, type, teachingMode, addressedByEdit }, ...] }.
6. Pass the Map to deepAnnotationService.generateAnnotations.
```

The L5 prompt at deepAnnotationService.ts:1402–1416 already handles `addressedByEdit` correctly. The only new code is the builder.

---

## 8. Cost trajectory — 5-iteration breakdown

A representative 5-iteration trajectory for a 5-paragraph PIQ-style essay. Costs in USD per iteration. Sonnet ~$3/MTok input, ~$15/MTok output; Haiku ~$0.25/MTok input, ~$1.25/MTok output (per L5_CONSUMPTION_AUDIT.md baselines).

The iteration scenarios:
- **Iter 1**: full first pass (cold).
- **Iter 2**: 1-sentence edit in P3 → focused mode, Level 1–2 escalation.
- **Iter 3**: paragraph rewrite in P3 → focused mode, Level 2–3 escalation.
- **Iter 4**: structural reorder of P2 ↔ P3 → **`focused_structural` mode** (§4.4b), not full comprehensive.
- **Iter 5**: final polish, 3 word swaps in P5 → focused mode, Level 1.

| Layer | Iter 1 | Iter 2 (1-sent edit P3) | Iter 3 (P3 rewrite) | Iter 4 (P2↔P3 reorder) | Iter 5 (3 word swaps P5) |
|---|---|---|---|---|---|
| L1 firstImpressions | $0.020 | $0.004 | $0.004 | $0 (carry, re-key indices) | $0.004 |
| L2 cartography | $0.040 | $0 | $0 | $0.040 (re-derive: structural) | $0 |
| L2.5 scout | $0.020 | $0.020 | $0.020 | $0.020 | $0.020 |
| L3 walk | $0.300 | $0.060 (P3 only) | $0.060 (P3 only) | $0 (no paragraph text changed) | $0.060 (P5 only) |
| L3.75 holistic | $0.100 | $0.020 (1 section) | $0.040 (2–3 sections) | $0.040 (re-derive narrative + thematic + momentEarnedness; carry voice/character/craft) | $0.020 (1 section) |
| L3.5 analysis | $0.080 | $0.016 (P3) | $0.016 (P3) | $0 (no text changed) | $0.016 (P5) |
| improvementPhase | $0.025 | $0.025 | $0.025 | $0.025 | $0.025 |
| L4 NS+SM+CM+CR | $0.150 | $0.060 | $0.080 | $0.110 (NS throughLineMap re-derive, SM crossParagraphPatterns re-derive, CM full, CR Haiku) | $0.060 |
| L5 deepAnnotation | $0.300 | $0.050 (P3 + priorAnnotations) | $0.060 (P3 + cross-para) | $0.060 (cross-para re-derive on remapped indices; per-paragraph mostly carry as priorAnnotations with index remap) | $0.040 (P5) |
| FindingStore Haiku validity | $0 | varies (LLM judges) | varies | varies (lineage entry for index remap; no claim-revalidation needed unless reorder broke a claim) | varies |
| Edit understanding | $0 | $0.020 | $0.020 | $0.020 | $0.020 |
| Landing detector (§5) | $0 | $0.010 | $0.012 | $0.010 (priors carry through remap) | $0.010 |
| **Total** | **~$1.035** | **~$0.285** | **~$0.337** | **~$0.325** | **~$0.275** |
| **% of comprehensive baseline ($1.035)** | 100% | 28% | 33% | 31% | 27% |

Notes:
- Iter 1's $1.035 includes craft-phase L5 ($0.30); foundation-phase L5 (~$0.10) yields ~$0.835. PLAN.md's $0.75 figure assumes the lower end.
- **Iter 4 is the key correction.** Today's `selectAnalysisMode()` routes reorders to comprehensive (~$1.12). The `focused_structural` mode (§4.4b) re-derives only the structural reads (L2, narrativeStrategy/thematicArchitecture/momentEarnedness sections of L3.75, northStar.throughLineMap, scoreMatrix.crossParagraphPatterns, coachingMap, cross-para L5) and carries the rest with index remapping. ~$0.325 vs ~$1.12 — a ~$0.80 saving on a common edit type.
- Trajectory: **$1.035 → $0.275** ≈ **3.8x reduction** by iteration 5. Less than PLAN.md's stated 25x, but PLAN.md's number assumes a polish iteration where almost everything caches and only a single sentence-level L5 call fires; achievable on the smallest edits but not the typical case.
- No redirection. Saved budget is genuine savings, not a slush fund.
- The quality booster lives in *what iteration N's L5 call sees*: priorAnnotations on the changed paragraph + carry-forward context from every other paragraph + matured findings. That's structurally deeper than iteration 1's cold read at no extra cost.

---

## 9. Where extra spend happens (and where it doesn't)

The earlier draft of this doc proposed redirecting a fraction of savings into "deeper treatment" — deep-dive sub-calls, authenticity post-checks, cross-iteration synthesis passes. **That mechanism is cut.** Reasons:

1. **The carry-forward already delivers the quality booster.** Iteration N's L5 call on the changed paragraph receives `priorAnnotations` (with landing status), the carry-forward context of every unchanged paragraph, and matured findings. That's a structurally deeper read than iteration 1's cold pass — for free.
2. **A mandated redirection fraction violates "no quotas" (LLM-first Rule 2).** Spending a fixed % of savings every iteration is a hard rule the LLM doesn't need; the escalation ladder already authorizes spend when the edit demonstrably warrants it.
3. **It would force findings or analyses where none are warranted.** Tue's correction: "we don't need to force findings or a certain amount." Right — extra spend should be *triggered by the edit*, not *scheduled*.

**Extra spend happens, but only when something concrete triggers it.** All of these are already in the design:

| Trigger | Extra spend | Mechanism |
|---|---|---|
| Ripple beyond paragraph detected by focused analyzer | Targeted L3.75 refresh of affected sections (~$0.02–0.06) | Existing escalation ladder Level 3 (focusedAnalyzer.ts:1013–1118) |
| Coherence report flags new contradiction | Re-run thematicArchitecture / narrativeStrategy section | Targeted L3.75 |
| Landing detector returns `changed_target` on a voice-tagged prior move | Voice section refresh (~$0.02) | Targeted L3.75 |
| Finding's anchor in changed paragraph + Haiku validity check uncertain | Sonnet judgment on the claim (~$0.01–0.02) | Maturity refresh escalation |
| Significance ≥ transformative on >2 paragraphs | Comprehensive mode | `selectAnalysisMode()` rule 5 |

The IterationLedger records actual spend per layer; if a pattern of unnecessary escalation emerges (e.g., the coherence report flags spurious contradictions every iteration), it's visible in audit and the prompts get re-tuned. No quota; no redirection; no slush fund.

---

## 10. Failure modes

Each row names a way the design breaks; each row prescribes the mitigation.

| # | Failure mode | What happens | Mitigation |
|---|---|---|---|
| F1 | **Stale carry-forward held under the validity test's radar.** Student edits P3, the validity test on `voiceIdentity` says "single-sentence change, no register shift" → carry. But the edit was actually a register pivot the detector missed. Iteration N teaches against an outdated voice profile. | Persistent under-targeting of voice critiques. | (a) The voice register-shift detector is itself an LLM (Haiku, §4.5), not a regex — LLM-first means it can flex on novel cases. (b) The landing detector (§5) catches downstream: if a voice-tagged prior move is repeatedly `unaddressed` across iterations, that's a signal the carry-forward voice profile may be stale, and the next iteration's voice check escalates to Sonnet. (c) The IterationLedger makes drift visible in audit; persistent voice-tagged unaddressed moves trigger a one-off refresh on next iteration. **No scheduled cadence; the trigger is the signal, not the calendar.** |
| F2 | **False-positive landing detection** — system thinks the edit landed when it didn't. | Iteration N skips re-teaching; student gets less help than they need. | (a) Asymmetric tolerance favors not skipping uncertain landings (§5.3 confidence floor). (b) Re-detection signal B is structural — if the new analysis still flags the symptom, that overrides Signal A's "addressed" verdict. The combiner LLM is given both. (c) Even on `addressed`, the L5 prompt is instructed to *acknowledge* the improvement, which still surfaces the topic in a way the student can engage with if they disagree. |
| F3 | **False-negative landing detection** — system thinks it didn't land when it did. | Iteration N re-teaches; the user-named failure mode (repetition / "system isn't watching") triggers. | (a) Confidence-weighted: low-confidence `unaddressed` defaults to `partially_addressed` (deepen, don't repeat). (b) The prompt explicitly forbids verbatim repetition (deepAnnotationService.ts:1411 already enforces). (c) Conversator signal C (when wired) lets the student's own engagement override a false negative. |
| F4 | **Cascade invalidation that the change classifier misses.** Student edits one word in P3; the word was a thematic anchor; the validity test says "single-word change, minor" → carry holistic synthesis. But the edit invalidated `thematicArchitecture.centralThesis`. | Iteration N teaches against a dead thesis. | (a) `editUnderstandingService` already has `StalenessEffect` with target `'holistic_understanding' | 'finding'` and gives the LLM authority to mark broad effects on small edits (LLM-first). (b) The escalation ladder (Level 3) catches: if L3.5 fresh analysis surfaces a contradiction with the carried thesis, the coherenceReport flags it and the orchestrator escalates. (c) The Finding maturity refresh catches: if a thematic Finding's anchor is in the changed sentence, its claim gets revalidated via Haiku. |
| F5 | **Selective carry-forward holds the wrong read on the seam.** P2 changed; P3 unchanged but its meaning depends on P2's now-different setup. P3's `paragraphUnderstanding` carries; iteration N reads P3 with the old setup in mind. | Iteration N misunderstands P3. | (a) The walk's holisticEvolution snapshot propagates forward — when P2 re-walks, the walk's running-context updates; P3's *holisticEvolution* snapshot re-derives from the new running-context (no LLM call needed; it's the walk's own state). (b) If a paragraph's understanding is genuinely seam-affected (rare — usually structure changes warrant comprehensive mode), Level 3 escalation catches the contradiction in coherenceReport. |
| F6 | **TaughtMoves ledger drift.** Annotation IDs aren't stable across iterations (today they're regenerated each call); the ledger's links break. | Landing detection can't find the prior move it's testing. | The redesign requires `L5Annotation.id` to be stable per (paragraph, sentenceIndex, spanText, teachingMode) — already the case at deepAnnotationService.ts:132 (id format). The ledger keys on `(annotationId, taughtAtIteration)`, not on regenerated IDs. |
| F7 | **`priorAnnotations` Map keyed wrong.** The Map is `Map<number, PriorAnnotationContext>` (paragraph index). On structural edits where paragraphs are reordered, the indices shift; the Map points the wrong annotations at the wrong paragraphs. | Iteration N tells the L5 prompt that P3's prior critiques apply to paragraph 3 — but that paragraph is now P2. | (a) On structural edits, mode selector routes to comprehensive (focusedAnalyzer.ts:730 already does this), and the comprehensive path **does not pass priorAnnotations** (or passes them keyed against the *new* indices, which the editUnderstandingService.diff produces). The redesign requires the priorAnnotations builder to apply the index remapping from `editUnderstandingService.diff.paragraphChanges[]` before constructing the Map. (b) If the index remapping is ambiguous (paragraph deleted, replaced), the move is dropped from priorAnnotations rather than misattributed; the underlying Finding (if any) carries the durable claim. |
| F8 | **Escalation cascades on a small edit.** A 1-sentence edit triggers Level 1 → Level 2 → Level 3 → comprehensive in succession because each level's output reveals more ripple than the validity test predicted. | Iteration projected as cheap actually costs near-baseline. | (a) The escalation ladder caps at comprehensive — there's no runaway. (b) The IterationLedger records actual vs. predicted spend; persistent over-escalation on small edits is a calibration signal for re-tuning the validity tests. (c) Per `feedback_cost_budget.md`, any iteration projecting >$5 halts and asks. |
| F9 | **Maturity churn on findings whose anchors moved within a paragraph.** Student rewrites a sentence; F7's anchor was that sentence; the Haiku validity check sees fresh text and either supersedes F7 prematurely or drifts its maturity. | Findings flutter unstably between iterations. | (a) The Haiku check is given the prior claim AND the lineage; it's instructed to prefer maturity stability unless the claim is clearly contradicted. (b) The `lineage[]` append-only structure (profileTypes.ts:3514) makes flutter visible in audit; flutter detection is straightforward. (c) Per `feedback_llm-first-design.md` Rule 6, system bookkeeping (lineage, supersession) is appropriate; the LLM owns the substantive judgment. |
| F10 | **The L5 priorAnnotations wire feeds non-existent annotations after a session restart.** TaughtMoves persists in the IterationLedger on the profile; if the profile is loaded mid-session and the ledger is incomplete, the priorAnnotations builder sees gaps. | Iteration N's L5 doesn't know about iteration N-1's moves. | The IterationLedger persists in the same checkpoint as the rest of the profile (profileTypes.ts checkpoint contract). The redesign requires `L5AnnotationResult` to also persist (today it's ephemeral per deepAnnotationService.ts:4–5; the ledger upgrade requires a checkpointed copy). The ephemerality of the working `L5AnnotationResult` is preserved; it's the **TaughtMoves derived from it** that persist. |
| F11 | **Re-derive winning over carry-forward when carry was correct.** Quality-test thresholds set too aggressive; the system re-derives stable items, eating savings without quality benefit. | Cost trajectory regresses toward baseline; redirection budget shrinks. | (a) Default to carry-forward; re-derive requires a *positive* invalidation signal, not just "could be re-derived." (b) Quality tests are themselves LLM judgments at low confidence — the LLM has to actually find drift, not merely admit it could exist. (c) The IterationLedger's per-iteration cost vs baseline graph makes regression visible quickly; if iter 2's spend climbs above 50% of baseline on a small edit, that's a calibration failure to investigate. |

---

## 11. Open questions for Tue

Real product calls; not solvable in the design doc alone.

1. **`focused_structural` mode — scope of carry on reorder.** §4.4b proposes carrying voiceIdentity, characterRevelation, craftAssessment, L1, and unchanged paragraphs' L3/L3.5 understanding through reorders, and re-deriving only structural reads. Is this the right partition, or are there cases where, e.g., character revelation legitimately shifts when paragraphs swap order (because revelation timing changes)? Tighter partition saves more cost; wider partition is safer.

2. **Conversator (Signal C) wiring timeline.** The landing detector works with Signals A+B alone; Signal C improves accuracy on borderline cases. Is the Conversator session-log seam in scope for this build, or do we ship Signals A+B only and add C as a Wave-2 enhancement?

3. **Confidence floor for landing detector.** Proposed: confidence ≥ 0.7 to count as `addressed`; below that, treat as `partially_addressed`. Tighter floor (0.85) reduces false-positive landings (F2) at the cost of more false-negatives (F3). Where does the asymmetric tolerance sit?

4. **TaughtMove storage horizon.** Proposed: keep indefinitely. For a long-running essay session (many drafts over weeks), this could grow to ~hundreds of moves. Is there a soft cap, or do we trust the storage cost?

5. **L3.75 targeted-refresh prompt — section masks.** The redesigned L3.75 takes per-section invalidation flags. Should the prompt run a **single Sonnet call** with section masks (all sections in one prompt, only flagged ones regenerate), or **one Sonnet call per invalidated section**? The first is cheaper input (one shared digest) but harder for the LLM to handle; the second is simpler per-call but pays the digest cost N times. Default recommendation: single-call-with-masks per LLM-first.

6. **Iteration counter visibility.** Should `IterationLedger.currentIteration` be surfaced to the student UI ("iteration 4 of your essay"), or is this internal-only? Surfacing creates a cleaner mental model; not surfacing keeps the loop invisible.

7. **Comprehensive-mode baseline alignment.** §8's $1.035 baseline doesn't match PLAN.md's $0.75 exactly because the table includes craft-phase L5. Harmonize numbers across docs, or accept the order-of-magnitude agreement?

---

> **End of design.** Build phase executes against this contract. The dead wire at `analysisOrchestrator.ts:850` is the first deliverable: feed `priorAnnotations` from a `TaughtMoves`-backed builder, and the loop's center starts working. Everything else in this document is the structure that the wire fix deserves around it.
