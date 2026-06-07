# Master Integration Plan — L1 → L6 Pipeline Iteration (v2)

> **The canonical horizontal master view.** What every layer becomes after the integrated iteration lands, how the layers compose, what depends on what, what blocks what, and how the integrated build ships against this foundation. Reconciles all 14 reconciliation issues surfaced in F0+F1 of the master-plan consolidation. References the per-layer PLANs and the L5 doc-set as authoritative for layer-internal contracts; this doc owns the cross-layer story.
>
> **Status**: `v2 — consolidation pass complete`. Supersedes draft v1 (preserved at `MASTER_INTEGRATION_PLAN__draft_v1_archive.md`).
> **Last updated**: 2026-04-26 (foundation phase F4 of master-plan consolidation).
> **Foundation phase artifacts referenced**:
> - `cross-cutting/MASTER_PLAN_READING_NOTES.md` (F0)
> - `cross-cutting/IMPLEMENTATION_STATUS_MATRIX.md` (F1)
> - `cross-cutting/L5_AND_MASTER_RECONCILIATION.md` (F2)
> - `cross-cutting/INTEGRATION_CONTRACTS.md` (F3, forthcoming)
> - `INTEGRATED_BUILD_SEQUENCE.md` (F5, forthcoming)
> - `INTEGRATED_BUILD_HANDOFF_PROMPT.md` (F6, forthcoming)
> - `cross-cutting/CONSOLIDATION_FINAL_REVIEW.md` (F7, forthcoming)

---

## §1 — North star

The integrated pipeline produces:

1. **Premium-grade understanding** (the level a $500/hr admissions consultant would offer) at typical round-1 cost ≤$2.00/essay.
2. **Zero fabrication** in writer-facing surfaces — every rewrite, every coaching turn, every annotation grounded in either student ground truth (Conversator) or corpus exemplars (RAG) or essay-text citation.
3. **Selective iteration** — re-analysis is incremental. Carry-forward is selective. Cost compounds down across rounds: Round 1 typical $1.00–$2.00; Round N selective re-analysis $0.05–$0.30 per iteration depending on edit type.
4. **Single ownership per concern** — every field has one writer, every layer has one job. Redundancy and theatre eliminated. Per the L3.75 absorption decision (2026-04-25 APPROVED), L3 lenses + Pass 3 produce all dimension-organized + cross-dimension fields directly; no L3.75 layer remains.
5. **No fallbacks** — single-owner-with-visible-failure across every step. No parallel mechanisms covering each other. No UI affordances dimming what the system couldn't ground. No canned fallbacks masking call failures.
6. **Selective carry-forward as quality booster + cost optimizer** — iteration N reads the essay with N iterations of accumulated understanding; depth is free (it's structured input), savings are genuine (not redirected via a forced fraction).

These are the principles the integrated build optimizes for.

---

## §2 — The integrated pipeline shape (target state)

```
Essay text (+ optional ExperienceProfile from Conversator if iter ≥ 2)
    │
    ▼
L1   (Haiku, ~$0.005)            firstImpressions per paragraph
L1.5 (Haiku, ~$0.002)            AO First Read (parallel; failure surfaces to telemetry)
L2   (Sonnet, ~$0.04)            Structural cartography
L2.5 (Sonnet/Haiku, ~$0.02)      Connection scout
    │
    ▼
L3 PASS 1 — Sweep                One Sonnet call (~$0.10–$0.15)
                                 sentenceUnderstanding, paragraph roles, connections,
                                 archetype + confidence, phaseEstimate, lensDispatch scores
L3 PASS 2 — Lens deep reads      2–4 parallel Sonnet calls (per lensDispatch)
                                 Story / Meaning / Voice / Admissions
                                 Each lens emits canonical holistic-profile fields
                                 DIRECTLY (no L3.75 synthesis transformation)
                                 (Conversator + RAG inject at lens user prompts via
                                  cached blocks)
                                 ~$0.06–$0.10/lens; parallel wall-time ~5s
L3 PASS 3 — Cross-dimension      One Sonnet call, bounded ~$0.08
                                 4 outputs: writerPortrait, entanglements (≤3),
                                 emotionalTopography.arcTrajectory,
                                 momentEarnednessMap.moments[].mechanisms
                                 Optional 5th: connectionGraphSummary
                                 NO iteration. NO Meta. NO Curation. (Anti-drift.)
    │
    ▼
L3.5 — Judgment                  Per-paragraph + essay-level scoring
                                 NEW: contradictionFlags[] (cross-lens consistency)
                                 NEW: essayStrengthSignatures[] (migrated from L3.75)
                                 Mode selection: per-paragraph for architecture+, essay-level
                                 for foundation only (Audit F2 fix)
                                 (RAG retrieves anti-archetypes + move-fits)
    │
    ▼
L4a NorthStar                    Architecture-of-meaning crystallization (5 dimensions)
                                 Reads compressed holistic context (Audit F1 fix:
                                 holisticSummaries not holisticFull)
L4a ScoreMatrix                  Rubric scoring with corpus anchoring
L4b Manifest                     Improvement priorities
                                 NEW: pairedImprovement payload emitted directly by L4b
                                 (migrated from L3.75 craftAssessment.growthEdges)
                                 ImprovementManifestEntry.pairedImprovement is the home
    │
    ▼
SpecificsNeed aggregation        Per-layer signals collected into specificsNeedQueue
                                 (extension of UnderstandingQuestion with new source
                                  'analysis_specifics_gap' + new statuses)
                                 Contributors per lens (post-absorption):
                                 - L3 walk: newFindings with deepeningPotential
                                 - Voice lens: voiceIdentity.authenticVsPerformed flagged
                                 - Meaning lens: meaningGaps[]
                                 - Story lens: emotionalTopography contributors
                                 - Admissions lens: redFlags[] needing context
                                 - L3 Pass 3: momentEarnednessMap.moments[].gaps[]
                                 - L3.5: low-confidence sentence analyses
                                 - L4: northStar hypothesis-confidence fields,
                                       intentBridge.alignments mismatches
                                 - FindingStore: hypothesis-stuck findings (≥2 iter)
    │
    ▼
L5 — Annotation + Rewrite        Per-paragraph + cross-paragraph feedback
                                 Tier 0 resolver: [MOVE-#], [AP-#], [PATTERN-#], [F-#]
                                 Tier 1: per-paragraph Sonnet × N (with priorAnnotations
                                         from taughtMoves ledger when iter ≥ 2)
                                 Tier 2: synthesis Sonnet (lede + focus surface +
                                         deferred + non-repetition contract)
                                 Tier 3: Haiku quality check (bias-guard diagnostic)
                                 Surfaces composed per L5_EXPERIENCE_TARGET §5:
                                 lede / progress strip / focus surface (with Move 6
                                 multiplicity) / connection map / voice anchor /
                                 score accordion / deferred surface / iteration response /
                                 Conversator panel / different-shape drawer
                                 Selective carry-forward across iterations
                                 (Conversator ground-truth substrate prevents fabrication)
                                 (RAG corpus citations anchor teaching)
                                 7 teaching moves per focus point; non-repetition contract
    │
    ▼
Conversator                      Continuous chat surface (always available per Q-A)
                                 Dig-question firing (per Q-B analysis-driven; timing
                                 policy: after first feedback / between iterations /
                                 when stuck)
                                 Continuous chat handler (Haiku/Sonnet routed)
                                 Dig answer extractor (structures into GroundTruthFact /
                                 StoryFragment / IntentSignal)
    │
    ▼
L6 — Coaching                    Phase-aware conversational layer
                                 Reads finalized profile + new field shape
                                 (4 read-site migrations: poolDensity→differentiator,
                                 blindSpots→redFlags, revealedQualities→valuesRevealed,
                                 intellectualFingerprint→writerPortrait)
                                 Coaching map's pairedImprovement now read from
                                 L4b ImprovementManifestEntry directly
```

**Removed entirely** (per L3.75 absorption Decision B): L3.75 as discrete layer. iter_1 / Meta / Curation / Reread orchestration. UnderstandingProse synthesis. `characterRevelation.blindSpots[]` field (Decision A: cut entirely; redFlags is the single home). `craftAssessment.strengthSignatures` at L3.75 (migrated to L3.5 essay-level). `craftAssessment.growthEdges[].pairedImprovement` (migrated to L4b). Several deprecated fields per cuts list at `L3-75/L3_ABSORBS_L3_75.md` "Cuts honored at lens-emission time".

---

## §3 — Per-layer status snapshot (post-F1)

| Layer | Plan / decision doc | Status (F1 audit) | Authoritative doc |
|---|---|---|---|
| L1 firstImpressions | (no redesign) | functional | — |
| L1.5 AO First Read | (no redesign) | functional (failure handling: non-fatal swallow → integrated build promotes to telemetry-emit) | — |
| L2 structuralCartographer | (no redesign) | functional | — |
| L2.5 scoutPass | (no redesign) | functional | — |
| **L3 (current monolithic)** | Replaced by Sweep + Lens + Pass 3 | functional today; replacement only-planned | [`L3/PLAN.md`](./L3/PLAN.md) |
| **L3 redesigned** | Sweep (1) + Voice/Meaning/Story/Admissions lenses (parallel) + Pass 3 (1) | only-planned | [`L3/PLAN.md`](./L3/PLAN.md), [`L3-75/L3_ABSORBS_L3_75.md`](./L3-75/L3_ABSORBS_L3_75.md) |
| **L3.75 (current)** | Retired by absorption (Decision B APPROVED 2026-04-25) | functional today; absorption only-planned. Kill list: holisticSynthesis.ts (~3650 lines) + iteration orchestration (~200 lines in analysisOrchestrator) + holisticMutator.ts (~150 lines) + corpusTelemetryPersistence L3.75 calls | [`L3-75/L3_ABSORBS_L3_75.md`](./L3-75/L3_ABSORBS_L3_75.md) |
| **L3.5** | Extension — adds contradictionFlags + essayStrengthSignatures + mode selection fix (Audit F2) + 4 cut-field read removals | functional for legacy fields; new fields only-planned | [`L3-5/PLAN.md`](./L3-5/PLAN.md) |
| **L4a NorthStar + ScoreMatrix** | NorthStar concept stable (`ESSAY_NORTH_STAR_DESIGN.md` — line 69 needs supersession update per R-2). Field-rename migrations (~6 cut fields). Audit F1 fix (holisticFull → holisticSummaries) | functional for legacy; F1 + cuts only-planned | [`L4/PLAN.md`](./L4/PLAN.md), [`L4/ESSAY_NORTH_STAR_DESIGN.md`](./L4/ESSAY_NORTH_STAR_DESIGN.md) |
| **L4b Manifest** | Extension — absorbs pairedImprovement payload directly (TECHNIQUE_VOCABULARY block in prompt; emit to ImprovementManifestEntry) | partial (pairedImprovement field exists at profileTypes.ts:1284-1295 within CraftAssessment.growthEdges; L4b reads via candidateStore but does NOT yet emit directly) | [`L4/PLAN.md`](./L4/PLAN.md) |
| **L5** | Deep redesign — 7 teaching moves per focus point, non-repetition contract, divergent-path multiplicity, selective carry-forward, no fabrication, 10 student-facing surfaces | partial (deepAnnotationService functional; 16 missing capabilities per L5_FEEDBACK_REDESIGN §1.8; priorAnnotations dead-wired at orchestrator:850) | [`L5/L5_REDESIGN_INDEX.md`](./L5/L5_REDESIGN_INDEX.md) and the 5 governing docs + IMPLEMENTATION_PLAN |
| **Conversator** | NEW essay-intelligence service at `src/services/essayIntelligence/conversator/` — sibling to L5 and L6, NOT L6 itself. Owns continuous chat + dig firing + dig answer extraction. (Distinct from activity-side chat persistence which is the precedent.) | only-planned (directory does not exist) | [`L5/L5_E2E_INTEGRITY_AUDIT.md`](./L5/L5_E2E_INTEGRITY_AUDIT.md) §4 |
| **L6** | Light update — 4 read-site migrations only (poolDensity→differentiator, blindSpots→redFlags, revealedQualities→valuesRevealed, intellectualFingerprint→writerPortrait or drop). Phase-aware coaching architecture preserved. NOT iteration-aware (the iteration-loop reads of taughtMoves ledger are owned by the Conversator, not L6) | functional for current shape; 4 migrations only-planned | [`L6/PLAN.md`](./L6/PLAN.md) |

External integrations:

| Workstream | Design doc | Injects into |
|---|---|---|
| 02 Conversator (cross-essay analysis-side ground-truth design from 2026-04-24) | [`02-conversator-ground-truth/CONVERSATOR_ANALYSIS_GROUND_TRUTH_DESIGN.md`](../02-conversator-ground-truth/CONVERSATOR_ANALYSIS_GROUND_TRUTH_DESIGN.md) | L3 lens user prompts (ExperienceProfile cached block); L5 rewrite paths (groundTruthFacts injection); voice profile import |
| 03 RAG (per-layer corpus retrieval design from 2026-04-24) | [`03-intelligent-rag/INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md`](../03-intelligent-rag/INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md) | L3 lens user prompts (archetype context block at Sweep + Voice + Admissions); L3.5 (move-fits + anti-archetypes); L5 (move citations + corpus exemplars). Currently 3 of 11 corpus types wired (CraftMove, EssayArchetype, VoiceRegister); 8 missing per F1 R-14 |

---

## §4 — Cross-cutting infrastructure (target state)

These primitives carry across layers and span iteration boundaries:

### 4.1 IterationLedger
- **Type**: New top-level state on EssayProfile per L5_ITERATION_LOOP_DESIGN §7.1.
- **Sub-state**: `currentIteration` (counter), `iterations[]` (append-only IterationRecord per iteration), `taughtMoves[]` (append-only ledger of every L5 annotation ever delivered, with the narrow D-1.15.0 carve-out: `landing` field permitted exactly one `undefined → populated` transition by the landing detector on the next iteration; all other mutations forbidden — see `L5_IMPLEMENTATION_PLAN.md` §D-1.14), `recentDecisions[]` (CarryForwardDecision append, pruned to last 5 iterations).
- **Producers**: analysisOrchestrator (commits at iteration end), Phase 1 priorAnnotations builder (reads taughtMoves), landing detector (Haiku call populating TaughtMove.landing).
- **Consumers**: priorAnnotations builder (the dead-wire fix), the L5 prompt's `addressedByEdit` block, the Conversator continuous-chat handler (cross-iteration coaching context), audit/calibration tooling.
- **Persistence**: same checkpoint as profile; JSONB on EssayProfile.

### 4.2 SpecificsNeed signal + queue extension
- **Type**: Extension of existing UnderstandingQuestion. New source `'analysis_specifics_gap'`. New statuses `'asked_to_student' | 'student_answered' | 'student_declined'`. New `dig?: DigContext` sub-object.
- **Per-layer contributors** (post-absorption — see R-7 of L5_AND_MASTER_RECONCILIATION):
  - L3 walk (Sweep): newFindings[] with deepeningPotential + raisesQuestions[].
  - L3 Pass 2 — Voice lens: voiceIdentity.authenticVsPerformed[] flagged "performed".
  - L3 Pass 2 — Meaning lens: meaningGaps[].
  - L3 Pass 2 — Story lens: contributes to Pass 3's emotionalTopography + momentEarnedness.
  - L3 Pass 2 — Admissions lens: admissionsPositioning.redFlags[].
  - L3 Pass 3: momentEarnednessMap.moments[].gaps[].
  - L3.5: low-confidence sentence analyses.
  - L4 northStar: confidence === 'hypothesis' fields; intentBridge.alignments mismatches.
  - FindingStore: maturity === 'hypothesis' AND iterationsAlive ≥ 2.
- **Consumer**: Conversator dig firing + analysis layers in next iteration (consume the structuredAnswer).

### 4.3 Conversator-side carry-forward state
- **Types**: `GroundTruthFact[]`, `StoryFragment[]`, `IntentSignal[]`, `ConversatorSessionEntry[]` on EssayProfile root.
- **Producers**: Conversator answer extractor (per dig question answered).
- **Consumers**: L1/L3/L3.5/L5 prompt blocks (cached per fact); L3 Pass 2 Story lens (story fragments enrich momentEarnedness); L4 northStar (intentBridge alignment); L5 fabrication-guard (Tier 3); Conversator continuous-chat handler.
- **Persistence**: durable across sessions. Two new DB tables: `essay_chat_conversations` (mirrors `activity_chat_conversations` precedent), `essay_ground_truth`.

### 4.4 Re-analysis lifecycle (3-mode, post-`focused_structural` integration)
Per `cross-cutting/RE_ANALYSIS_LIFECYCLE_DESIGN.md` (with R-4 update): `selectAnalysisMode()` selects from 3 modes — `comprehensive | focused_structural | focused`.

- **comprehensive**: structural reorder/insert/delete WITH transformative paragraph rewrites alongside, OR multi-paragraph (>2) significant rewrites, OR confidence-level < 'deep'. Full pipeline re-run with carry-forward at L1 + unchanged-paragraph L3 + unchanged-paragraph L3.5.
- **focused_structural** (NEW per L5_ITERATION_LOOP_DESIGN §4.4b): structural reorder/insert/delete WITHOUT alongside transformative content edits. Re-derive structural reads (L2 cartography, narrativeStrategy + thematicArchitecture + momentEarnedness contributors via Story+Meaning lens, northStar.throughLineMap + structuralRolesMap, scoreMatrix.crossParagraphPatterns, coachingMap, cross-paragraph L5). Carry voice/character/craft/L1/unchanged-paragraph reads with index re-keying via editUnderstandingService.diff.paragraphChanges[]. Cost ~$0.40–0.50 vs $1.12 comprehensive.
- **focused**: minor edit (textChangeRatio < 0.30 per paragraph) + deep+ confidence. Single sentence/word focused update with escalation ladder Levels 1–4.

Escalation ladder Levels 1–4 (per L5_ITERATION_LOOP_DESIGN §6.4) handles ripple beyond initial focus scope.

**L3.75 absorption affects this lifecycle**: per R-2, the "L3.75 holistic re-run rules" (RE_ANALYSIS_LIFECYCLE_DESIGN §2) become "lens-targeted re-run rules". Per-section invalidation maps to per-lens invalidation. The "L3.75 single Sonnet call with section masks" mechanism is REPLACED by selective lens re-runs + optional Pass 3 re-run. NO single-call section-mask alternative.

### 4.5 Carry-forward inventory (40 rows)
Per L5_ITERATION_LOOP_DESIGN §3 (with R-2 lens-attribution rewrite). Each item carries a default decision: `carry | carry-with-validity-test | re-derive | re-derive-each-iter | static-asset | bookkeeping`.

### 4.6 Landing detection
Single Haiku call per (TaughtMove, iteration). Inputs: edit-vs-critique signal A, re-detection signal B, chat-behavior signal C (when Conversator wired). LLM-judged combiner (NOT formula). Confidence floor 0.7 to count as `addressed`; below → `partially_addressed`. Asymmetric tolerance: prefer-not-to-repeat over prefer-to-cover.

### 4.7 Build cost ledger (`BUILD_COST_LEDGER.md`)
Per Phase 0 D-0.10 of L5_IMPLEMENTATION_PLAN. Auto-appended on every API call. Hard halt at $9 cumulative (warn at $7) to enforce the API cap. The cap for the integrated build extends beyond the L5-only $10 cap — see §11 Tue decisions.

---

## §5 — The four locked user-decisions (with R-1 caveat)

| Q | Topic | Locked answer | Source | Reconciliation status |
|---|---|---|---|---|
| Q1 | Redirection fraction | **CONTESTED — see R-1** | INDEX/E2E audit/build handoff lock at 20%; iteration loop design §1 retires the mechanism explicitly | **PENDING TUE adjudication** |
| Q4 | Landing-detector confidence floor | **0.7** to count as `addressed`; below → `partially_addressed` | L5_ITERATION_LOOP_DESIGN.md §11 Q4; user confirmed | Stable |
| Q-A | Conversator availability | **Continuous chat surface, always available**; analysis-initiated dig questions fire at specific moments (after first feedback / between iterations / when student is stuck) | This session series 2026-04-26 | Stable |
| Q-B | Specifics dig origination | **Analysis-driven (B1).** Analysis layers produce structured signals naming what they need; Conversator is targeted inquiry agent that asks for those specifics, captures answers, structures them, feeds them back. The Conversator's flexibility lives in *how* to ask (non-leading), *when* to fire (timing), *how to handle nuance* — not in deciding *what* to ask | This session series 2026-04-26 | Stable |

**R-1 detail**: The L5 INDEX, E2E audit, build handoff, and consolidation handoff prompt all assert Q1 = 20% redirection fraction. The L5_ITERATION_LOOP_DESIGN §1 explicitly retires this mechanism with reasoning ("No mandated redirection fraction. ... Saved budget is genuine savings, not a slush fund."), citing user correction "we don't need to force findings or a certain amount." Two reasonable resolutions: (A) retirement is correct, locked-decisions table updates; (B) 20% lock holds, iteration design's §1 retirement is the over-correction. **Tue must adjudicate before build phase opens.** This is the primary blocking question for F7 sign-off. See `cross-cutting/L5_AND_MASTER_RECONCILIATION.md` §R-1 for full detail.

---

## §6 — Standing charter (workspace-wide discipline)

The L5 build's standing charter expands to the entire integrated build. Key principles:

- **Quality bar**: every component, from smallest type field to largest orchestrator, gets full focus, care, and revision until it lands at the level the design deserves. Three-round prompt revision is a minimum, not a maximum. The deliverable is done when it is *right*, not when it is "shipped."
- **No fallbacks**: single-owner-with-visible-failure across every step. No parallel mechanisms covering each other. No UI affordances dimming what the system couldn't ground. No canned fallbacks masking call failures. Comprehensive-mode escalation in `selectAnalysisMode()` is NOT a fallback — it's a routing decision.
- **Agent / swarm dispatch**: spawn agents wherever a deliverable benefits from parallel investigation. Prefer multi-agent swarms for large parallelizable investigations.
- **Continuous test-running**: `npx tsc --noEmit` after every type change; mock-based integration tests after every meaningful code change; failures surface immediately.
- **Cross-phase audits**: between phases, before advancing, the implementer rereads every governing doc that gates the next phase, checks every audit row that the just-completed phase touched, walks the dependency graph fully.
- **Build cost discipline**: per the API cap (see §11). Every call recorded in BUILD_COST_LEDGER.md. Hard halt at the cap.
- **System-level Tue review**: not at every prompt during build. Mid-build escalations to Tue are rare and reserved for ambiguities the design docs don't resolve, prompts that aren't landing despite Round 4+, contract changes, or cumulative spend approaching the cap. Tue's full review is at Phase 6 after the final E2E run.

These principles are **non-negotiable** across the integrated build.

---

## §7 — Audit findings → PR scope cross-reference

Per R-8 + R-13. The 26 findings in `cross-cutting/PIPELINE_ARCHITECTURE_AUDIT.md` map to the integrated build PRs:

| Audit finding | Severity | Integrated build location |
|---|---|---|
| F1 — L4 context bloat (120K → 5–8K) | HIGH | Phase 4 (alongside L3.75 absorption execution): profileRouter `holisticFull` priority `'always'` → `'high'` with content compressed to summaries. F1 audit confirms holisticFull is still `'always'` at profileRouter:1035 |
| F2 — L3.5 mode selection cheaped out for architecture phase | CRITICAL | L3.5 extension (Phase 4 — coupled with new fields): mode-selection rule update so architecture phase gets per-paragraph mode |
| F3 — Re-reads confirmatory not discovery | MEDIUM | L3.75 absorption deletes Reread orchestration entirely. Structurally resolved |
| F5 — Understanding prose synthesis failed silently | HIGH | L3.75 absorption deletes UnderstandingProse. EssayPortrait UI renders from structured fields. Structurally resolved |
| F6 — Only 2 findings for 7-paragraph essay | HIGH | L3.75 absorption: lenses emit findings directly via findingStore.add(). L3.5 contradictionFlags adds detection. L4b absorbed pairedImprovement increases coaching density |
| F7 — L2 slow for input size | LOW | (Out of integrated build scope; tracked in audit-followup) |
| F8 — 55 connections mostly trivial | MEDIUM | (Out of integrated build scope; investigate at L2.5 prompt level) |
| F9 — Budget system overridden | MEDIUM | F1 fix addresses primary instance. Broader budget-enforcement is iteration-loop telemetry territory |
| F10 — Quality grading 68/100 overall | HIGH | Holistic improvement target across the whole integrated build. Measured against L5_EXPERIENCE_TARGET §8 non-negotiables |
| F11 — Profile intelligence ~60% unused in coaching | CRITICAL | L5 redesign Tier 0 resolver (citation hydration) + Tier 2 synthesis (focus surface) closes this |
| F12 — Coaching collapses T6–T9 | CRITICAL | Conversator's continuous-chat handler design (per L5_E2E_INTEGRITY_AUDIT §4.7) replaces today's deflection-handling logic |
| F13 — Named craft techniques never deploy | HIGH | L5 Tier 0 resolveMOVE + Tier 1 prompt instruction to name techniques in ALL-CAPS |
| F14 — Zero student-written prose coached | HIGH | Conversator continuous-chat handler engages with student-written prose; L5 inline editor commands per L5_FEEDBACK_REDESIGN §1.8 |
| F15 — Admissions intelligence vanishes after T1 | HIGH | L5 admissions positioning citations across surfaces; archetypeContext.differentiator threaded through every surface |
| F16 — Coach overrides student agency | MEDIUM | Conversator continuous-chat handler responds at granularity question deserves; non-leading prompt rules |
| F17 — One-insight-per-turn rule violated | MEDIUM | L5 non-repetition contract enforced at composition + Tier 3 Haiku self-check |
| F18 — System describes when should prescribe (95/5 ratio) | CRITICAL | L5 redesign's entire architectural shift toward prescriptive layer |
| F19 — 5–6 insights repeated ~50 times | HIGH | L5 non-repetition contract |
| F20 — Before/after examples are highest value but barely appear | CRITICAL | L5 Move 6 multiplicity (2–4 paths per focus point) + Tier 1 rewrite generation |
| F21 — System reads intention into incidental choices | MEDIUM | L5_EXPERIENCE_TARGET §8 non-negotiable #1 (zero generic teaching) + non-leading prompt discipline |
| F22 — Most powerful artifacts hidden from student | CRITICAL | L5_EXPERIENCE_TARGET §5 ten surfaces — every artifact has a surface |
| F23 — No post-session deliverable | HIGH | L5 surfaces persist; iteration response surface (§5.9); IterationLedger telemetry visible to student per Q6 of EXPERIENCE_TARGET §10 |
| F24 — Coaching voice breaks under stress | HIGH | Conversator continuous-chat handler with non-leading + warmth-first prompts |
| F25 — Responses too long for 17-year-old | MEDIUM | Conversator chat router (Haiku for clarifications, Sonnet for substantive); L5 surfaces designed for one-card-at-a-time pacing |
| F26 — No student writing during session | HIGH | Conversator dig questions elicit student-written content; L5 inline editor commands; iteration response loop incentivizes student rewrites |

**Coverage summary**: 24 of 26 audit findings are scoped into the integrated build. F7 + F8 deferred (low-priority; investigate later).

---

## §8 — Sequencing — what ships in what order

The integrated build is **6 build phases** (Phase 0–5) plus a **single E2E validation pivot (Phase 6)** plus a **light L6 update post-pivot**. The sequencing inherits the L5_IMPLEMENTATION_PLAN's Phase 0–6 spine and extends with deliverables for the per-layer workstreams that the L5-only plan didn't cover.

| Phase | Focus | Deliverable count (target) | LLM cost | Duration |
|---|---|---|---|---|
| **Phase 0** | Types + migrations + telemetry. Foundation for everything that follows. No LLM cost. | ~15 (L5-only plan) + ~5 (cross-cutting types for L3 lens schemas, L3.5 new fields, L4b paired schema) = ~20 | $0 | 1.5–3 days |
| **Phase 1** | Dead-wire fix + iteration ledger. The iteration loop's center starts working. | ~18 (L5-only plan) | ~$0.50–$1.00 (landing detector calibration) | 5–8 days |
| **Phase 2** | SpecificsNeed aggregator + queue extension. Per-layer prompt extensions. | ~14 (L5-only plan) — extended with lens-of-origin contributor wiring (per R-7) | ~$0.50–$1.00 (specifics-need emission sanity) | 4–6 days |
| **Phase 3** | Conversator service entire (continuous chat + dig firing + dig answer extraction). The most prompt-heavy phase. | ~19 (L5-only plan) | ~$1.50–$2.00 (Conversator dig + extractor sanity) | 8–12 days |
| **Phase 4** | L3 redesign (Sweep + Lens + Pass 3) + L3.75 absorption execution + L3.5 extension + L4 absorption execution + L4 context compression (Audit F1) + L5 surface composer + Tier 2 synthesizer. The largest phase. | ~15 (L5-only plan) extended with L3 redesign deliverables (~10) + L3.75 deletion deliverables (~5) + L3.5 extension (~5) + L4 absorption (~3) + L4 F1 fix (~2) + corpus retrieval expansion (~5 for the 8 missing types per R-14) = ~45 | ~$1.50–$2.50 (L3.75 absorption / lens contamination check + Tier 2 non-repetition smoke) | 14–21 days |
| **Phase 5** | UI surfaces. 10 components per L5_EXPERIENCE_TARGET §5. EssayConversatorPanel mount. | ~16 | $0 (frontend) | 5–8 days |
| **Phase 6** | Single E2E validation pivot. One iter-1 + one iter-2 focused-mode run on a representative essay. Tue review. Fix-cycle re-runs. | 12 | ~$3.50 ($1.30 E2E + $2.20 fix-cycles) | 3–7 days (variable) |
| **Phase 6.5** | L6 light update — 4 read-site migrations. | ~5 | $0 | 1–2 days |

**Total integrated build deliverables**: ~150 (vs ~95 in L5-only). **Total integrated build duration**: ~12–18 weeks of focused engineering (vs ~12–16 in L5-only). **Total integrated build cost**: dependent on Tue's cap selection (see §11).

The detailed deliverable contracts land in F5's `INTEGRATED_BUILD_SEQUENCE.md`.

---

## §9 — Dependency graph

```
                    ┌──────────────────────────────────────┐
                    │ Phase 0 — types + migrations + telem │
                    │ (foundation; no user-facing changes) │
                    └──────────────────┬───────────────────┘
                                       │
                                       ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ Phase 1 — Dead-wire fix + iteration ledger                   │
   │ priorAnnotations builder, taughtMoves append, landing        │
   │ detector, IterationLedger commit, halt-on-error policy       │
   └─────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ Phase 2 — SpecificsNeed aggregator + queue extension         │
   │ Per-layer prompt extensions (L3 walk, L3.5, L4 northStar,    │
   │ FindingStore). Lens-of-origin contributor wiring (post-R-7). │
   └─────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ Phase 3 — Conversator                                        │
   │ Continuous chat + dig firing + dig answer extraction +       │
   │ persistence (essay_chat_conversations + essay_ground_truth). │
   │ Conversator-to-analysis feedback loop.                       │
   └─────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ Phase 4 — The big phase (15–21 days)                         │
   │                                                              │
   │ Sub-phase 4a: L3 redesign + L3.75 absorption                 │
   │   - Sweep + 4 lens schemas + Pass 3 prompt and schema        │
   │   - Lens emissions of holistic-profile fields (direct)       │
   │   - Delete holisticSynthesis.ts + iteration orchestration    │
   │   - Consumer renames (~6 sites)                              │
   │   - Index updates: §A1 carry-forward classification per      │
   │     lens-of-origin (post-R-2 audit rewrite)                  │
   │                                                              │
   │ Sub-phase 4b: L3.5 extension                                 │
   │   - contradictionFlags[] + essayStrengthSignatures[]         │
   │   - Mode-selection fix (Audit F2)                            │
   │   - Cut-field read removals (~6 sites)                       │
   │                                                              │
   │ Sub-phase 4c: L4 absorption execution                        │
   │   - L4b emits pairedImprovement directly                     │
   │   - NorthStar prompt update against new profile shape        │
   │   - L4 context compression (Audit F1)                        │
   │                                                              │
   │ Sub-phase 4d: L5 surface composer + Tier 2 synthesizer       │
   │   - l5TierTwoSynthesizer.ts                                  │
   │   - l5SurfaceComposer.ts (10 surfaces)                       │
   │   - Lens-targeted re-run mechanism (replaces L3.75           │
   │     targeted refresh per R-2)                                │
   │   - 16 missing capabilities per L5_FEEDBACK_REDESIGN §1.8    │
   │   - Corpus retrieval 8-type expansion (per R-14)             │
   │                                                              │
   │ Sub-phase 4e: focused_structural mode                         │
   │   - selectAnalysisMode rule update                           │
   │   - Procedure for handling structural reorders cheaply       │
   └─────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ Phase 5 — UI surfaces                                        │
   │ 10 surface components + EssayConversatorPanel mount + visual │
   │ regression tests + accessibility audit + non-negotiables     │
   │ verification.                                                │
   └─────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ Phase 6 — Single E2E validation pivot                        │
   │ One iter-1 (~$1.00) + one iter-2 focused (~$0.30). Tue       │
   │ review. Fix-cycle re-runs.                                   │
   └─────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ Phase 6.5 — L6 light update                                  │
   │ 4 read-site migrations (poolDensity→differentiator,          │
   │ blindSpots→redFlags, revealedQualities→valuesRevealed,       │
   │ intellectualFingerprint→writerPortrait or drop).             │
   └──────────────────────────────────────────────────────────────┘
```

**Parallelism notes**:
- Phases 0–3 are largely sequential (each phase depends on the previous).
- Phase 4's sub-phases 4a/4b/4c/4d/4e have internal dependencies (4a → 4b → 4c → 4d, with 4e parallelizable to 4d). 4a is the biggest sub-phase.
- Phase 5 (UI) can begin in parallel with Phase 4 once Phase 0 + 3 (Conversator types) are done — frontend designers can work against schemas before backends finish.
- Phase 6 is the synchronization point: all backend phases must be complete.
- Phase 6.5 is post-system-build; can be a small follow-on PR.

---

## §10 — Cross-layer commitments (the contracts)

These agreements span layers; they get updated as PRs land. The detailed seam-by-seam audit lives in `cross-cutting/INTEGRATION_CONTRACTS.md` (F3 deliverable, forthcoming).

### Profile schema (post-integration)
- L3 lens emissions own canonical holistic-profile fields. Voice lens owns voiceIdentity + voiceMap + voice-craft. Meaning lens owns thematicArchitecture + craftAssessment.imageSystem + meaningGaps. Story lens owns narrativeStrategy + craftAssessment.pacingShape + emotionalTopography contributors. Admissions lens owns admissionsPositioning + characterSignals.
- L3 Pass 3 owns 4 cross-dimension fields: writerPortrait + entanglements (≤3) + emotionalTopography.arcTrajectory + momentEarnednessMap.moments[].mechanisms.
- L3.5 essay-level owns `strengthSignatures[]` + `contradictionFlags[]`.
- L4b ImprovementManifestEntry owns `pairedImprovement` payload directly.
- `characterRevelation.blindSpots[]` cut entirely; `admissionsPositioning.redFlags[]` is the single home (each entry MUST carry a `fix` field).
- IterationLedger / TaughtMove / CarryForwardDecision / IterationRecord on EssayProfile root.
- DigContext sub-object on UnderstandingQuestion (when source = `'analysis_specifics_gap'`).
- GroundTruthFact[] / StoryFragment[] / IntentSignal[] / ConversatorSessionEntry[] on EssayProfile root.

### Cache block ordering (per layer's user prompt)
```
[essay_text + L1 + L2 + scout_header (cached)]
[ExperienceProfile (cached, if 02 wired and iter ≥ 2)]
[research_block (cached, if 03 wired)]
[GroundTruthFact + StoryFragment + IntentSignal blocks (cached, if iter ≥ 2)]
[per-paragraph or per-lens specific content (uncached)]
```
Order is invariant across all layers. New cached blocks must extend in this order, not insert in the middle.

### Discipline directives (every prompt)
- **Descriptive only** at L1, L2, L2.5, L3 (Sweep + lenses + Pass 3). No "weak", "strong", "effective", "would benefit from" vocabulary.
- **Judgment vocabulary** lives at L3.5, L4, L5.
- **Citation required** at L3+. Every claim cites paragraph or sentence number.
- **Inheritance discipline**: lens emits its dimension; never re-derives what Sweep already produced.
- **Cap discipline**: each list-valued field has hard ceilings (threads ≤ 5, redFlags ≤ 4 with fix, distinctivenessFactors ≤ 5, entanglements ≤ 3 in Pass 3, etc).
- **Non-repetition** (L5 specifically): no two pieces of guidance carry the same teaching weight; extends across iteration turns via TaughtMove.landing lifecycle.
- **No fallbacks** (every layer): single owner, visible failure, no canned defaults.
- **No `blindSpots[]` emission anywhere**: redFlags is the canonical home.

### Cost discipline
- **Per-essay round-1 cost**: typical $1.00 (foundation phase, 5-paragraph) to $2.00 (polish phase, 10-paragraph craft-heavy).
- **Round-N selective re-analysis cost**:
  - Word-level focused: ~$0.05.
  - Paragraph rewrite focused: ~$0.20.
  - Structural reorder via `focused_structural`: ~$0.30.
  - Comprehensive re-run: ~$1.00.
- **Cumulative session cost** (5 typical iterations): $1.40–$2.50.
- **Test runs on single fixture** (fixture 05 default); multi-fixture only if regression class detected.

(R-5 harmonization applied: the per-edge-case extreme of $0.04 per polish iteration in RE_ANALYSIS_LIFECYCLE_DESIGN remains valid as a quote; the typical-case range above is the canonical master-plan cost discipline.)

### Failure surface
- Every step has one owner, one input contract, one output contract, one failure surface.
- No swallowed errors. AO First Read's "non-fatal" pattern (current code) becomes "telemetry-emit-and-continue-with-flag" under no-fallback discipline.
- LLM call failure → throw with structured context. The student sees an honest error with retry-button; the system does not silently respond with a placeholder.

---

## §11 — Open questions for Tue (require sign-off before build phase opens)

| # | Question | Affects | Recommendation |
|---|---|---|---|
| **TQ-1** | **R-1 — Q1 redirection-fraction adjudication.** L5 docs lock Q1 = 20%; iteration loop design retires the mechanism. Which holds? | Iteration loop core mechanism, L5 implementation plan D-4.11, INDEX/E2E audit/handoff locked-decisions tables | Recommend Resolution A (iteration design's retirement is correct; locked-decisions table updates accordingly). The iteration design's reasoning is sound and traces to documented user correction. |
| **TQ-2** | **Integrated build cost cap selection.** L5-only plan caps at $10. Integrated build covers more workstreams (L3 redesign, L3.5/L4 extensions, L3.75 absorption execution, corpus 8-type expansion, all in addition to L5). Two options: (A) hold $10 cap with tighter per-phase allocations across more workstreams; (B) expand cap proportionally to cover larger scope. | Build phase entry; per-phase mid-build API touchpoint allocations; final E2E + fix-cycle budget | Recommend Option B with a proposed cap of **$25** ($1.30 final E2E + $2.20 fix-cycles + $5.50–7.50 mid-build API touchpoints across more workstreams + slack buffer). The L5-only $10 cap was tight; the integrated build's expanded scope (L3 redesign mid-build calibration, L3.75 absorption verification, corpus 8-type wiring smoke, plus the original L5 mid-build touchpoints) genuinely needs more headroom. |
| **TQ-3** | Build phase branch name. | Branch + PR target. | Recommend `feat/integrated-pipeline-build` (replaces L5-only's proposed `feat/l5-redesign-build`). |
| **TQ-4** | Confirm 4 locked decisions Q4, Q-A, Q-B remain stable. (Q1 covered by TQ-1.) | Build phase entry. | Recommend reaffirm. |

These are the only Tue-decisions blocking integrated build phase entry. All other reconciliations are resolved by this consolidation.

---

## §12 — What this plan does NOT cover (out of scope)

- Annotation V2 UI work (separate `ANNOTATION_V2_BUILD_PLAN.md` in `docs/`). Phase 5 of the integrated build references the 10 surfaces; their visual rendering is the V2 UI work's domain.
- Workshop integration (`commonAppWorkshop`, `narrativeWorkshop`, `activityWorkshop`, etc.) beyond what L5/L6 touches. Integrated build is essay-intelligence pipeline only.
- Conversator internals beyond essay-side (the 02 workstream design covers cross-essay analysis-side ground-truth; this plan integrates that design at the L3 lens prompt + L5 rewrite path injection seams only).
- Corpus / taxonomy data work (lives in 03 RAG workstream design).
- Frontend rendering beyond Phase 5 (EssayPortrait UI gets a small update post-L3.75-absorption to render from structured fields; nothing else here).

These are tracked elsewhere or out of band. This workspace is the L1–L6 essay-intelligence pipeline iteration only.

---

## §13 — Reading order for the integrated build session

For the build-phase chat that opens against this workspace:

1. **`README.md`** — workspace map.
2. **This `MASTER_INTEGRATION_PLAN.md`** — horizontal master view (you're reading it).
3. **`cross-cutting/MASTER_PLAN_READING_NOTES.md`** — per-doc reading notes (F0 deliverable).
4. **`cross-cutting/IMPLEMENTATION_STATUS_MATRIX.md`** — file:line audit of what's built vs what's not (F1 deliverable).
5. **`cross-cutting/L5_AND_MASTER_RECONCILIATION.md`** — 14 reconciliation issues + applied edits (F2 deliverable).
6. **`cross-cutting/INTEGRATION_CONTRACTS.md`** — seam-by-seam producer/consumer audit (F3 deliverable, forthcoming).
7. **`cross-cutting/PIPELINE_ARCHITECTURE_AUDIT.md`** — reference (Apr 2026 baseline; many findings now scoped per §7).
8. **`cross-cutting/RE_ANALYSIS_LIFECYCLE_DESIGN.md`** — re-analysis lifecycle (with R-2 absorption + R-4 focused_structural updates per F2).
9. **Per-layer PLANs in canonical order**:
   - `L3/PLAN.md` (Sweep + Lens + Pass 3)
   - `L3-75/L3_ABSORBS_L3_75.md` (absorption decision, authoritative)
   - `L3-5/PLAN.md` (extension)
   - `L4/PLAN.md` + `L4/ESSAY_NORTH_STAR_DESIGN.md`
   - `L6/PLAN.md`
10. **L5 docs** in canonical order per `L5/L5_REDESIGN_INDEX.md`:
   - L5_EXPERIENCE_TARGET.md
   - L5_ITERATION_LOOP_DESIGN.md (with Q1/R-1 reconciliation note in mind)
   - L5_E2E_INTEGRITY_AUDIT.md
   - L5_CONSUMPTION_AUDIT.md (with R-2 absorption layer-of-origin annotations)
   - L5_FEEDBACK_REDESIGN.md (with 7 SUPERSEDED markers)
11. **`L5/L5_IMPLEMENTATION_PLAN.md`** — the L5-only build plan (extended by INTEGRATED_BUILD_SEQUENCE.md per F5).
12. **`INTEGRATED_BUILD_SEQUENCE.md`** — the executable spine (F5 deliverable, forthcoming).
13. **`INTEGRATED_BUILD_HANDOFF_PROMPT.md`** — the build-phase entry prompt (F6 deliverable, forthcoming).
14. **`cross-cutting/CONSOLIDATION_FINAL_REVIEW.md`** — F7 sign-off review with TQ-1 through TQ-4 outcomes.
15. **`CLAUDE.md`** at repo root — development standards.
16. **User memory** at `/Users/tuepham/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/` — durable user-feedback (especially `feedback_llm-first-design.md`, `feedback_architecture_migrations.md`, `feedback_planning_preferences.md`, `feedback_cost_budget.md`).

Total reading time: ~12–18 hours of focused reading. The integrated build session reads these before the first deliverable lands.

---

## §14 — Summary of revisions vs draft v1

The original draft v1 of MASTER_INTEGRATION_PLAN.md (preserved at `MASTER_INTEGRATION_PLAN__draft_v1_archive.md`) was written 2026-04-26 before the L5 docs matured to their current depth. This v2:

- **Adds**: cross-cutting infrastructure section (§4), four user-decisions table (§5), standing charter (§6), audit-findings → PR scope (§7), Phase 0–6.5 sequencing detail (§8), updated dependency graph (§9), expanded cross-layer commitments (§10), four open Tue questions (§11), reading order for build session (§13).
- **Updates**: pipeline shape (§2) reflects L3.75 absorption + Conversator service ownership + new schema additions; per-layer status (§3) reflects F1 audit findings; cost discipline (§10) harmonized per R-5.
- **Resolves** (or surfaces for Tue): all 14 reconciliation issues from F2.
- **Total length**: ~600 lines (vs 220 in v1) — the larger size reflects integrating 14 reconciliations + cross-cutting infra + audit-findings cross-reference + reading order. Still smaller than the F4 target of 1,500–2,500 because the per-layer detail lives in the per-layer PLANs and the deeper L5 docs; this doc owns the cross-layer story without redundancy.

---

> **End of MASTER_INTEGRATION_PLAN v2.** F5 (INTEGRATED_BUILD_SEQUENCE.md) executes against this. F6 (INTEGRATED_BUILD_HANDOFF_PROMPT.md) opens the build chat against this. F7 (CONSOLIDATION_FINAL_REVIEW.md) is Tue's sign-off review against this. **TQ-1 (Q1 adjudication) and TQ-2 (cost cap selection) require Tue input before the build phase opens.**
