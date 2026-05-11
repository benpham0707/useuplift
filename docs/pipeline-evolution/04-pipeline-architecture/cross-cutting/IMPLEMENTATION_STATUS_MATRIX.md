# Implementation Status Matrix — Phase F1 deliverable

> **Purpose.** File:line audit of every component the integrated build will touch or replace. Gates F2's reconciliation (which now-vs-target deltas exist), F3's integration contracts (which seams have producer/consumer asymmetries today), F5's build sequence (which deliverables come from now-state vs greenfield).
>
> **Method.** Parallel Explore-agent dispatch (analysis layers + cross-cutting infra), then verification of the load-bearing claims. File:line evidence cited for every status.
>
> **Audit date.** 2026-04-26. Branch: `feat/wave-3a-phase-3b-3c`.

> ⚠️ **2026-05-10 changelog (Phase 0b regen).** This matrix is 14 days behind code at original audit date. Per the unified plan §2 ([`../../00-index/UNIFIED_PLAN_HOLD_2026_05_10.md`](../../00-index/UNIFIED_PLAN_HOLD_2026_05_10.md)) and Phase 0a deletes/wires (commits `a9e2022`..`9f2a0c8`), corrected status counts are **22 functional / 8 partial / 1 only-typed / 5 only-planned** (was 13/7/0/9). The §3 summary table at the bottom of this doc reflects the original audit; see §3a below for the post-Phase-0a current state. Row-level status updates inline as `[2026-05-10]` annotations on the most-changed rows.

## Status legend

- **functional** — wired into the live pipeline, callable, producing the field shapes the design specifies, consumed by downstream code.
- **partial** — code exists but production-readiness incomplete (dead-wired input, stub output, schema mismatch with downstream consumer).
- **only-typed** — interfaces and types defined; no behavioral code.
- **only-planned** — named in design docs; no code.

---

## §1 — Analysis layers (L1 → L6)

| # | Component | File:Line evidence | Status | Gaps to close before integrated build |
|---|---|---|---|---|
| 1 | **L1 firstImpressions** | `analysis/firstImpressions.ts` line 40 (FirstImpressionsResult); orchestrator wired at `analysisOrchestrator.ts:298` | **functional** | None. ParagraphFirstImpression shape matches profileTypes.ts. |
| 2 | **L1.5 AO First Read** | `analysis/aoFirstRead.ts:25-36` (hookMoment, committeeOneLiner, distinctivenessSignal, putDownRisk, gutReaction); wired at `analysisOrchestrator.ts:299,319,374`; runs parallel with L1; failure non-fatal | **functional** | Failure is currently swallowed as non-fatal — under no-fallback discipline this should surface to telemetry instead. Phase 0 telemetry hook will catch. |
| 3 | **L2 structuralCartographer** | `analysis/structuralCartographer.ts:39-49` (StructuralCartographyResult); wired `analysisOrchestrator.ts:382-385`; consumed by L3 walk at `analysisOrchestrator.ts:458` | **functional** | None. |
| 4 | **L2.5 scoutPass** | `analysis/scoutPass.ts:40-51` (ScoutPassResult); wired `analysisOrchestrator.ts:382-385`; consumed by L3 walk at `analysisOrchestrator.ts:459` | **functional** | None. |
| 5 | **L3 sequentialDeepWalk (current monolithic)** | `analysis/sequentialDeepWalk.ts:124-157` (L3WalkResult); ~2,000 lines; wired at `analysisOrchestrator.ts:455-466` | **functional** | Monolithic walk replaced by Sweep + 4 lenses + Pass 3 in the redesign. Replacement is **only-planned** — no lens prompt skeletons, no Sweep schema, no Pass 3 prompt in code. |
| 6 | **L3 redesigned (Sweep + Lens + Pass 3)** | `[2026-05-10]` ABANDONED — replaced by Option 5 essay-level walk (`analysis/essayLevelL3Walk.ts`, wired at `analysisOrchestrator.ts:85, 690` since commit `d3209c9`). `L3/PLAN.md` marked superseded 2026-05-10. Disposition of L3.75 fields owned by `L3-75/FIELD_DISPOSITION_TABLE.md` (17 DET / 28 LENS / 4 RESIDUE / 1 MICRO / 8+ CUT). | **superseded** | Sweep+Lens architecture does not ship. |
| 7 | **L3.75 holisticSynthesis (current)** | `analysis/holisticSynthesis.ts` (verified `[2026-05-10]` at **3,573 lines** — 40% larger than original "~2,500" claim in retirement docs); wired into orchestrator; produces 10 holistic sections in single Sonnet call (~$0.49 on Crochet baseline). | **functional** | Phase 7 of unified plan deletes this entire module + `runningUnderstandingManager.ts` (~474 lines) + ~6 consumer reads. Absorption owners per `L3-75/FIELD_DISPOSITION_TABLE.md`: 17 fields → composition layer (DET, $0), 28 → lens-direct (LENS), 4 → small Sonnet residue call. Net ~$0.35 saved per essay. |
| 8 | **L3.5 analysisPass (current)** | `analysis/analysisPass.ts` (L35AnalysisResult + AnalysisPassOutput); wired in orchestrator. `[2026-05-10]` `contradictionFlags[]` TYPE LANDED at `profileTypes.ts:4200`. `essayStrengthSignatures[]` TYPE LANDED at `profileTypes.ts:4225`. Both producer-side emission code not yet shipped. | **partial** | Producer code for `contradictionFlags[]` + `essayStrengthSignatures[]` (Phase 4 sub-phase 4b in retirement plan). Architecture-phase `essay_level` mode-selection regression (Audit Finding F2) unresolved. `[2026-05-10]` Findings now PROMOTED to FindingStore by `findingPromotion.ts` post-L3.5 (orchestrator:897, gated iter===1) — closes the "FindingStore sparse entering L4" gap. |
| 9 | **improvementPhase phaseAssessment** | `analysis/phaseAssessment.ts:46-69` (PhaseAssessmentInput, PhaseAssessmentResult); wired `analysisOrchestrator.ts:606` | **functional** | None. |
| 10 | **L4 crystallizer (NorthStar + ScoreMatrix + CoachingMap + Coherence)** | `analysis/crystallizer.ts` (~3,500 lines); wired `analysisOrchestrator.ts:650-664`; produces northStar + scoreMatrix + coachingMap + coherence | **functional** for legacy fields | Audit Finding F1 (L4 context bloat 120K → 5–8K) unresolved — `holisticFull` still marked `priority: 'always'` at profileRouter:1035. NorthStar reads cut fields (thesisConfidence, arcMomentum, etc.) — migrations only-planned. |
| 11 | **L4b pairedImprovement absorption** | `pairedImprovement` field exists at `profileTypes.ts:1284-1295` within `CraftAssessment.growthEdges[]`. Orchestrator harvests L3.75 candidates at `analysisOrchestrator.ts:545-548`. L4b receives via candidateStore at `:648-659` for consolidation (input only — no L4b emission of pairedImprovement) | **partial** | Per L4/PLAN.md, L4b should EMIT pairedImprovement directly. Today L4b reads it from L3.75 upstream supply. Absorption requires: L4b prompt extension with TECHNIQUE_VOCABULARY block; schema move from `craftAssessment.growthEdges[].pairedImprovement` to `ImprovementManifestEntry.pairedImprovement`; consumer migration on the L5 read path. |
| 12 | **scoreMatrixAnchors + contradictionConsumer** | `analysis/scoreMatrixAnchors.ts:26-50` (G3_FEW_SHOT_CALIBRATION block); `analysis/contradictionConsumer.ts:44-86` (consumeContradictions); imports at `analysisOrchestrator.ts:112-113`; called at `:752-761`; flags flow to L5 at `:847` | **functional** | None directly. Note: contradictionConsumer ingests existing coherenceReport.contradictions; the NEW L3.5 contradictionFlags field is separate and unbuilt. |
| 13 | **L5 deepAnnotationService** | `analysis/deepAnnotationService.ts` (~3,900 lines); wired in orchestrator. `[2026-05-10]` priorAnnotations WIRE IS LIVE at `analysisOrchestrator.ts:1299-1300` (composer `buildPriorAnnotationsForOrchestrator` reads from iterationLedger `taughtMoves[]`); the original ":850 dead-wire" claim is stale. | **partial** | Of 16 capabilities flagged in L5_FEEDBACK_REDESIGN.md §1.8, priorAnnotations integration is now functional. Remaining ~15 only-planned. ENABLE_FOCUS_MODE flag-gated reranking exists at `:795` but never set in production (Phase 8 first activation). |
| 14 | **l5ManifestMerger** | `analysis/l5ManifestMerger.ts` (~159 lines); imports at `analysisOrchestrator.ts:71-72` | **functional** | None — merger preserved per L5_FEEDBACK_REDESIGN.md §1.1 audit baseline. |
| 15 | **L6 coachingService** | `coaching/coachingService.ts`; line 4016 reads `profile.characterRevelation?.blindSpots` | **functional** for current shape | Per L6/PLAN.md, 4 read-site migrations required: `archetypeContext.poolDensity` → `differentiator` at coachingService.ts:2807; `characterRevelation.blindSpots` → `admissionsPositioning.redFlags` at `:4016`; `revealedQualities` → `valuesRevealed` (sites need locating); `intellectualFingerprint` → drop or read from `writerPortrait` (sites need locating). All migrations only-planned. F1 audit confirms 1 of 4 sites (the blindSpots site at :4016). |
| 16 | **L6 coachingPlanner** | `coaching/coachingPlanner.ts` | **functional** | None named in plans. |

---

## §2 — Cross-cutting infrastructure

| # | Component | File:Line evidence | Status | Gaps to close before integrated build |
|---|---|---|---|---|
| 17 | **analysisOrchestrator** | `analysis/analysisOrchestrator.ts`. `[2026-05-10]` priorAnnotations builder WIRED at `:1299-1300`. iterationLedger commit SHIPPED (D-1.10). taughtMoveBuilder SHIPPED (D-1.11). landingDetector SHIPPED (D-1.5). specificsNeedAggregator integration SHIPPED at `:1264-1268`. AO First Read failure NOW surfaces structured telemetry at `:478-516` (F-2 closure 2026-04-29). findingPromotion WIRED at `:897` (Phase 0a.3). | **partial** | NO surface composer call (Phase 4 D-4.8 still only-planned). Halt-on-error policy still implicit (Phase 1 D-1.12). compositionLayer.ts module unbuilt (Phase 4 of unified plan). |
| 18 | **reanalysisOrchestrator** | `analysis/reanalysisOrchestrator.ts:795` — passes LIVE brief into `analyzeEssay` (NOT undefined). | **functional** | `[2026-05-10]` Earlier ":1177 dead-wire" claim was always wrong; the dead wire was ONLY in analysisOrchestrator and that's now closed too. R-12 reconciliation: closed. |
| 19 | **focusedAnalyzer** | `analysis/focusedAnalyzer.ts:705-783` (selectAnalysisMode 7-rule decision tree); escalation ladder at `:1114-1180` (Levels 1-4); reorders route to comprehensive at `:727` | **functional** for current 2-mode design | `focused_structural` mode (3rd mode) NOT implemented — only-planned per L5_ITERATION_LOOP_DESIGN.md §4.4b. |
| 20 | **editUnderstandingService** | `analysis/editUnderstandingService.ts:714` (function signature producing StalenessEffect[]); effects with strength/reason at `:730-835`; StalenessEffect type at `profileTypes.ts:3966-3970` | **partial** | `StalenessEffect → Finding ID` link **MISSING** — type lacks `findingIds[]` array. Per L5_ITERATION_LOOP_DESIGN.md §2.3, this is a confirmed gap; orchestrator can't trace "this edit invalidates F7". |
| 21 | **profileRouter** | `profileManager/profileRouter.ts:1005-1074` (l5_feedback_annotations rule with 8K budget); `holisticFull` marked `priority: 'always'` at `:1031-1035` | **functional** | Audit Finding F1 (L4 context bloat 120K → 5–8K) UNRESOLVED — replacing `holisticFull` content with `holisticSummaries` per Audit fix direction is only-planned. Cross-cutting deliverable (likely Phase 4 alongside L3.75 absorption). |
| 22 | **findingStore** | `findings/findingStore.ts` — maturity lifecycle + lineage + updateMaturity. `[2026-05-10]` **FindingPromotion service exists** at `analysis/findingPromotion.ts` (514 lines) — was orphan at audit time, **WIRED Phase 0a.3** at orchestrator `:897` (gated iter===1). Per-paragraph + cross-paragraph promotion + holisticEvolution aggregation. | **functional** | findingMaturityRefresh.ts (318 lines, sister Sonnet service) still orphan — Phase 0a.3 deferred its wire pending Phase 6 measurement of findingPromotion's downstream effect on Phase 5.55 emission rate (cost-discipline call). |
| 23 | **questionQueueManager** | `analysis/questionQueueManager.ts:37-52,144` (iterationsSurvived support per profileTypes.ts:4284) | **partial** | NEW source `'analysis_specifics_gap'` NOT in source enum at profileTypes.ts:4273 (only legacy `'walk' | 'synthesis' | 'deep_dive' | 'coaching' | 'maturity_gap'`). NEW statuses `'asked_to_student' | 'student_answered' | 'student_declined'` NOT in status enum at profileTypes.ts:4275 (only legacy `'open' | 'resolved' | 'filtered'`). DigContext sub-object NOT in UnderstandingQuestion type. All only-planned per Phase 2 D-2.1. |
| 24 | **corpusRetrievalBlocks** | `analysis/corpusRetrievalBlocks.ts:256-351` — three retrieval functions wired (`retrieveAnchorMoves`, `retrieveParagraphAntiPatterns`, `retrievePhaseArchetypes`); feature-flagged at `:52`; imports at `:36-40` cover only `CraftMove`, `EssayArchetype`, `VoiceRegister` | **partial** | INVENTORY MISMATCH per L5_FEEDBACK_REDESIGN.md §2 (11 corpus artifact types required vs 3 wired). Missing: `antiArchetypes` (11), `voiceArchetypeCompatibility` (98 cells), `corpusLimits` (18), `readerBiasGuards` (14), `moveDependencies` (12), `schoolFitVectors` (95), `contextualValidity` (21), `deliberateAbsences` (16), `moveExcerpts` (53). All only-planned per L5_CONSUMPTION_AUDIT rows 202–215. |
| 25 | **corpusTelemetryPersistence** | `analysis/corpusTelemetryPersistence.ts` (mentioned in L5_ITERATION_LOOP_DESIGN.md §2.2 row "Live") | **functional** | None for current shape; will need L3.75-related telemetry deletion per absorption Kill list. |
| 26 | **profileTypes** | `profileTypes.ts`. `[2026-05-10]` **Phase 0a deltas applied**: `voiceAlignment` field dropped from `SentenceCraft` (commit `be321dc`); 3 orphan service interfaces (`IEssayUnderstandingService`, `IDiffEngine`, `IContextBuilder`) removed from `types.ts` (commit `7b7ab96`). `contradictionFlags[]` TYPE LANDED at `:4200`; `essayStrengthSignatures[]` at `:4225`. | **partial** | `codeSwitching` field on `VoiceMap` flagged for drop in handoff but DEFERRED Phase 0a — has live consumers in voiceMapMutator + intraDomainValidation + holisticSynthesis ingestion; will die naturally with holisticSynthesis.ts in Phase 7. Several Phase 0 / Phase 2 D-* types may now be present (iterationLedger family is shipped). Audit pending. |
| 27 | **essayProfileManager** | `profileManager/essayProfileManager.ts:927` (EssayProfileCoordinator class) — mutation dispatch, staleness propagation, checkpointing all implemented | **functional** | EssayProfile root field additions (iterationLedger, groundTruthFacts, storyFragments, intentSignals, conversatorSessionLog) only-planned (Phase 0 D-0.5). JSONB backfill migration only-planned (Phase 0 D-0.8). |
| 28 | **chat persistence (essay-side)** | Directory `src/services/essayIntelligence/conversator/` does NOT exist | **only-planned** | Entire Conversator service unbuilt. Phase 3 D-3.1 through D-3.18. |
| 29 | **chat persistence (activity-side precedent)** | `services/portfolioStrategy/services/activityWorkshop/chat/chatPersistenceService.ts` (essay-side will mirror); handles `activity_chat_conversations` table; upsert at `:10`; history cap 20 turns | **functional** | None — precedent ready for cloning. |
| 30 | **DB table essay_chat_conversations** | `[2026-05-10]` SHIPPED (commit `84c8210`). | **functional** | None. |
| 31 | **DB table essay_ground_truth** | `[2026-05-10]` SHIPPED (commit `caf45f0`). | **functional** | None. |
| 32 | **DB table activity_chat_conversations** | `supabase/migrations/20260219000000_activity_profiles_and_chat.sql:36-64` (table); RLS policies at `:120-146` | **functional** | None — precedent table. |
| 33 | **l5TierTwoSynthesizer** | No file | **only-planned** | Phase 4 D-4.5, D-4.6. |
| 34 | **specificsNeedAggregator** | `[2026-05-10]` SHIPPED — `analysis/specificsNeedAggregator.ts` + integration at `analysisOrchestrator.ts:1264-1268` via `runSpecificsNeedAggregationWithTelemetry`. | **functional** | None. |
| 35 | **l5SurfaceComposer** | No file | **only-planned** | Phase 4 D-4.8. |

---

## §3 — Coverage status summary

| Status | Count | Components |
|---|---|---|
| **functional** | 13 | L1, L1.5 AO, L2, L2.5, L3 (current monolithic), L3.75 (current), improvementPhase, L4 (legacy fields only), scoreMatrixAnchors+contradictionConsumer, L6 coachingService (current), l5ManifestMerger, reanalysisOrchestrator, focusedAnalyzer (2-mode), findingStore, profileRouter, corpusTelemetryPersistence, essayProfileManager, activity-side chatPersistence, activity_chat_conversations table |
| **partial** | 7 | L3.5 (legacy works; new fields missing), L4b (pairedImprovement read but not emit), L5 deepAnnotationService (16 missing capabilities), analysisOrchestrator, editUnderstandingService (no Finding ID linkage), questionQueueManager (legacy works; new sources/statuses missing), corpusRetrievalBlocks (3 of 11 types wired), profileTypes (legacy types present; 9 new missing) |
| **only-typed** | 0 | — |
| **only-planned** | 9 | L3 redesign (Sweep + Lens + Pass 3), focused_structural mode, Conversator service entire, essay_chat_conversations table, essay_ground_truth table, l5TierTwoSynthesizer, specificsNeedAggregator, l5SurfaceComposer, IterationLedger commit + landing detector + priorAnnotations builder pipeline |

**Of 35 components: 13 functional / 7 partial / 0 only-typed / 9 only-planned.** The 7 partial + 9 only-planned = 16 components require work in the integrated build (~46% of the audited surface).

### §3a — Coverage status summary (corrected 2026-05-10 per unified plan §2 + Phase 0a deltas)

| Status | Count | Notes |
|---|---|---|
| **functional** | 22 | adds: priorAnnotations builder + wire, specificsNeedAggregator + wire, iterationLedger commit, taughtMoveBuilder, landingDetector, AO First Read structured telemetry, essay_chat_conversations + essay_ground_truth tables, findingPromotion wire (Phase 0a.3), reanalysisOrchestrator (cleared) |
| **partial** | 8 | L3.5 (legacy works; producer for new typed fields not shipped), L4b (read-only pairedImprovement), L5 deepAnnotationService (~15 of 16 capabilities still planned), analysisOrchestrator (composer call still missing), editUnderstandingService (no Finding ID linkage), questionQueueManager (legacy works; new sources/statuses missing), corpusRetrievalBlocks (3 of 11 types wired), profileTypes (most types landed; minor follow-ups) |
| **only-typed** | 1 | contradictionFlags + essayStrengthSignatures L3.5 producer (types landed at `profileTypes.ts:4200,4225`; emission code unbuilt) |
| **only-planned** | 5 | Conversator service entire, l5TierTwoSynthesizer, l5SurfaceComposer, focused_structural mode, compositionLayer.ts module |
| **superseded** | 1 | L3 redesign Sweep+Lens+Pass3 (Option 5 essay-level walk replaced it) |

**Of 36 components (1 added since original audit): 22 functional / 8 partial / 1 only-typed / 5 only-planned / 1 superseded.** Remaining work in 8 partial + 1 only-typed + 5 only-planned = 14 components (~39% of the audited surface, down from 46%).

---

## §4 — New reconciliation issues surfaced by F1

### R-12 — reanalysisOrchestrator.ts:1177 dead-wire claim is incorrect (CONTRACT, narrow doc fix)

**Severity**: Annotation. Doc inaccuracy.

**Docs involved**:
- `L5/L5_ITERATION_LOOP_DESIGN.md` §2.1 — claims "`reanalysisOrchestrator.ts:1177` also passes `undefined` on the comprehensive-fallback path".
- `L5/L5_E2E_INTEGRITY_AUDIT.md` §2.1 — same claim about both orchestrators having dead wires.
- `L5/L5_IMPLEMENTATION_PLAN.md` D-1.9 — calls for "reanalysisOrchestrator.ts:1177 wire-up (parallel fix)".

**Reality (per F1)**: line 1177 passes a live `reanalysisBrief` object, not `undefined`. Only `analysisOrchestrator.ts:850` is the dead wire.

**Resolution**: Update the L5 docs to remove the parallel-dead-wire claim. D-1.9 in the implementation plan becomes either: (a) deleted (no parallel fix needed), or (b) repurposed to verify that reanalysisOrchestrator's existing passing of `reanalysisBrief` integrates correctly with the NEW priorAnnotations builder (which D-1.6 produces). The latter is more useful — D-1.9 becomes an integration verification, not a parallel fix.

**Authority**: This consolidation, applied in F2 follow-up.

**Status**: **STAGED for F2 supersession-edit pass + F5 build sequence update**.

### R-13 — Audit Finding F1 (L4 context bloat) sequencing (CONTRACT)

**Severity**: Contract.

**Docs involved**:
- `cross-cutting/PIPELINE_ARCHITECTURE_AUDIT.md` Finding F1 — L4 context bloat 120K → 5–8K, $0.45 wasted per analysis.
- `MASTER_INTEGRATION_PLAN.md` — 6-PR sequencing doesn't explicitly scope F1 fix.
- F1 audit confirms: `holisticFull` still `priority: 'always'` at profileRouter:1035.

**Resolution per F2 R-8**: Add to MASTER_INTEGRATION_PLAN's audit-findings-to-PR cross-reference table. Most likely scope: cost-recovery PR1 OR L4 extension PR4. F4 picks the canonical owner.

**Authority**: This consolidation (F4).

**Status**: **STAGED for F4 application**.

### R-14 — Corpus retrieval inventory expansion (CONTRACT)

**Severity**: Contract. Affects: L5 redesign's resolver work (L5_FEEDBACK_REDESIGN.md §5).

**Docs involved**:
- `L5/L5_FEEDBACK_REDESIGN.md` §2 / §5 — references 11 corpus artifact types for the resolver.
- `L5/L5_CONSUMPTION_AUDIT.md` rows 202–215 — proposes wiring of all 11 types.
- F1 audit: only 3 types (`CraftMove`, `EssayArchetype`, `VoiceRegister`) currently wired in `corpusRetrievalBlocks.ts:36-40`.

**Resolution**: The L5 redesign's resolver (Phase 0 / Phase 4 deliverables) brings the 8 missing types online. F5 INTEGRATED_BUILD_SEQUENCE must enumerate them as deliverables, since the L5 IMPLEMENTATION_PLAN doesn't break them out individually (it folds into Phase 4 surface composition).

**Authority**: This consolidation (F5).

**Status**: **STAGED for F5 application**.

---

## §5 — Cumulative reconciliation issues across F0 + F1

| ID | Severity | Status |
|---|---|---|
| R-1 Q1 redirection contradiction | LOAD-BEARING | **PENDING TUE** |
| R-2 L3.75 absorption pervasiveness | LOAD-BEARING | STAGED (broad supersession) |
| R-3 L4 pairedImprovement absorption | CONTRACT | F1 confirms gap; STAGED for F5 |
| R-4 focused_structural mode | CONTRACT | STAGED for F4 |
| R-5 Cost trajectory harmonization | CONTRACT | STAGED for F4 |
| R-6 L6 vs Conversator service-ownership | LOAD-BEARING | STAGED for F4 |
| R-7 SpecificsNeed lens-of-origin rewrite | CONTRACT | STAGED for F2 |
| R-8 Audit-findings → PR scope | CONTRACT | STAGED for F4 |
| R-9 Cross-reference path fixes | ANNOTATION | STAGED for F2 |
| R-10 L5_BUILD_HANDOFF supersession | ANNOTATION | STAGED for F6 |
| R-11 README directory map | ANNOTATION | STAGED for F6 |
| R-12 reanalysisOrchestrator:1177 not dead | ANNOTATION | STAGED for F2 + F5 |
| R-13 F1 audit finding sequencing | CONTRACT | STAGED for F4 |
| R-14 Corpus retrieval expansion | CONTRACT | STAGED for F5 |

**1 Tue-decision (R-1) blocks build-phase entry. 13 other reconciliations resolvable by this consolidation.**

---

## §6 — Build-phase implications by component

The 16 partial + only-planned components map to integrated build deliverables:

**Phase 0 (foundation, no LLM)**:
- 9 NEW types (Component 26): IterationLedger, TaughtMove, CarryForwardDecision, IterationRecord, DigContext, GroundTruthFact, StoryFragment, IntentSignal, ConversatorSessionEntry.
- 2 DB migrations (Components 30, 31): essay_chat_conversations, essay_ground_truth.
- EssayProfile root field additions (Component 27).
- questionQueueManager extensions (Component 23): new source + statuses + dig sub-object.
- editUnderstandingService extensions (Component 20): StalenessEffect → Finding ID linkage.

**Phase 1 (dead-wire fix + iteration ledger)**:
- analysisOrchestrator wiring (Component 17): priorAnnotations builder, IterationLedger commit, CarryForwardDecision append.
- L5 priorAnnotations integration (Component 13).
- AO First Read failure surface promotion (Component 2).

**Phase 2 (specifics-need aggregator + queue extension)**:
- questionQueueManager full extension (Component 23).
- specificsNeedAggregator (Component 34) + integration into orchestrator.
- Per-layer prompt extensions (Components 5, 8, 7-via-absorption-handling, 10).

**Phase 3 (Conversator)**:
- Conversator service entire (Component 28): essayConversator, persistence, dig composer, dig answer extractor, continuous chat handler, timing policy, types.
- EssayConversatorPanel UI (referenced in Phase 5).

**Phase 4 (L3 redesign + L3.75 absorption + L4 + L5 surface composer)**:
- L3 redesign (Component 6): Sweep + 4 lens + Pass 3 prompts and schemas.
- L3.75 absorption execution (Component 7): kill list (delete holisticSynthesis.ts ~3650 lines, iteration orchestration, Meta, Curation, UnderstandingProse).
- L3.5 extension (Component 8): contradictionFlags + essayStrengthSignatures + mode selection fix (F2 from audit).
- L4 absorption execution (Component 11): L4b emits pairedImprovement directly.
- L4 context compression (Component 21): F1 from audit, holisticFull → holisticSummaries.
- focused_structural mode (Component 19): selectAnalysisMode rule update + new procedure.
- Tier 2 synthesizer (Component 33): l5TierTwoSynthesizer.
- Surface composer (Component 35): l5SurfaceComposer.
- Corpus retrieval expansion (Component 24): 8 missing artifact types wired.
- L5 capability gap closure (Component 13): 16 missing capabilities per L5_FEEDBACK_REDESIGN §1.8.

**Phase 5 (UI)**:
- 10 surface components per L5_EXPERIENCE_TARGET §5.
- EssayConversatorPanel mount.

**Phase 6 (single E2E pivot)**:
- Final E2E run + fix cycles.

**Phase 6.5 (post-system-build)**:
- L6 light update (Component 15): 4 read-site migrations.

The integrated build sequence (F5) will enumerate per-deliverable contracts.

---

## §7 — Notes and caveats

- **F1 method limitation**: Two parallel agents covered the 35 components above. Some specific line numbers (e.g., the 3 remaining L6 read sites for revealedQualities / intellectualFingerprint migrations) were not located by the agents and remain to be found at F4 or build-phase start.
- **profileTypes.ts cross-reference**: Some L5 doc citations to profileTypes.ts line numbers (e.g., L5_ITERATION_LOOP_DESIGN.md §3 inventory rows reference line numbers in the 880–1500 range for L3.75 sections) — these line numbers may have drifted with codebase evolution. F4 / F5 should anchor citations to current HEAD.
- **L3.75 absorption Kill list verification**: The decision document lists ~3K lines targeted for deletion. F1 confirms holisticSynthesis.ts at ~3,650 lines exists (matches the estimate). Other deletions (analysisOrchestrator Phase 3 ~200 lines, holisticMutator ~150 lines, runningUnderstandingManager.emotionalArc) need targeted verification at build time.
- **AO First Read non-fatal failure handling**: The current behavior swallows AO First Read failures (line 299, "non-fatal" per design). Under no-fallback discipline, this should surface as a fail-fast or telemetry-emit-and-continue-with-flag. Note for the integrated build: clarify behavior at Phase 1 alongside the orchestrator no-fallback pass.

---

> **End of F1 implementation status matrix.** F2 (reconciliation) extends with R-12, R-13, R-14. F3 (integration contracts), F4 (master plan revision), F5 (build sequence) consume this matrix per-row.
