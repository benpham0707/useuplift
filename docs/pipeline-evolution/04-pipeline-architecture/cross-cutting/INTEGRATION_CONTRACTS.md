# Integration Contracts — Phase F3 deliverable

> **Purpose.** Seam-by-seam audit of producer/consumer contracts at every layer-to-layer boundary. Per seam: producer-emit, consumer-read, symmetry status, carry-forward classification, failure surface, current implementation status, gaps to close before integrated build.
>
> **Method.** Cross-references `MASTER_PLAN_READING_NOTES.md` (F0), `IMPLEMENTATION_STATUS_MATRIX.md` (F1), `L5_AND_MASTER_RECONCILIATION.md` (F2). Uses L5_CONSUMPTION_AUDIT.md's 270-row field-level inventory as the L5-input field source. Builds lighter inventories for the seams that don't yet have one.
>
> **Authority.** This consolidation. Applied at F4 (already integrated into MASTER_INTEGRATION_PLAN v2 §10 cross-layer commitments) and F5 (drives per-deliverable contracts in INTEGRATED_BUILD_SEQUENCE.md).

---

## §0 — How to read

Per seam, the table columns:

- **Seam** — producer → consumer.
- **Producer-emit** — what producer writes.
- **Consumer-read** — what consumer reads.
- **Symmetry** — `symmetric` (matches), `sub-slice` (consumer reads strict subset of producer-emit; deliberate), `gap` (consumer expects something producer doesn't produce).
- **Carry-forward** — default classification per L5_ITERATION_LOOP_DESIGN §3 / L5_CONSUMPTION_AUDIT §A1.
- **Failure surface at seam** — what happens when producer fails or consumer can't process.
- **Implementation status** — per F1 audit.
- **Gap → integrated build** — work needed.

Seams ordered by pipeline flow (L1 → L6 + cross-cutting).

---

## §1 — L1 / L1.5 → L2 / L3 seams

### S-1.1: L1 firstImpressions → L2 structuralCartographer

| Field | Producer | Consumer | Symmetry | Carry-forward | Failure surface | Status | Gap |
|---|---|---|---|---|---|---|---|
| `ParagraphFirstImpression.apparentPurpose` | L1 firstImpressions.ts:40 | structuralCartographer.ts:140 | symmetric | carry-with-validity-test (per-paragraph) | L1 throw → orchestrator halt; consumer gracefully reads carried L1 if unchanged paragraph | functional | None |
| `ParagraphFirstImpression.emotionalRegister` | L1 | L2 ctx + L3.75 emotionalTopography (post-absorption: Story lens) | sub-slice | carry-with-validity-test | as above | functional | Note: post-absorption, the L3.75 consumer is replaced by Story lens consumer. F2 R-2 |
| `ParagraphFirstImpression.craftNotices[]` | L1 | structuralCartographer.ts:146 + L3 walk + L3.75 craftAssessment (post-absorption: Voice + Meaning + Story lenses) | sub-slice | carry-with-validity-test | as above | functional | Lens-of-origin update post-absorption |

### S-1.2: L1.5 AO First Read → L5/L6 (via profile.aoFirstRead)
- Producer: aoFirstRead.ts:25-36 (hookMoment, committeeOneLiner, distinctivenessSignal, putDownRisk, gutReaction).
- Consumer: L5 deepAnnotationService (current); L6 coachingService (current); L5 lede surface (per EXPERIENCE_TARGET §5.1).
- Symmetry: symmetric.
- Carry-forward: carry across iterations (admissions read is slow-changing).
- Failure surface: **CURRENTLY non-fatal swallow at analysisOrchestrator.ts:299** — under no-fallback discipline this needs telemetry-emit-and-continue-with-flag. Phase 1 deliverable D-1.12 covers.
- Status: functional with failure-handling gap.
- Gap: integrated build Phase 1 — promote AO First Read failure handling to telemetry-surfaced per no-fallback charter.

### S-1.3: L1 ProfileIndex → profileRouter routing
- Producer: L1 (ProfileIndex.essayLength + confidenceLevel + topicTags + paragraphDigest[]).
- Consumer: profileRouter every routing decision; budget allocation.
- Symmetry: symmetric.
- Carry-forward: re-derive each iteration (cheap, deterministic).
- Status: functional.
- Gap: None.

---

## §2 — L2 → L3 / L3.75 seams

### S-2.1: L2 StructuralCartography → L3 walk + L3.75 (post-absorption: Story lens primarily)

| Field | Producer | Consumer (today) | Consumer (post-absorption) | Symmetry | Carry-forward | Status | Gap |
|---|---|---|---|---|---|---|---|
| `paragraphRoles[]` | L2 types.ts:129 | L3 walk context | L3 Sweep + Story lens | symmetric | carry-with-validity-test (invalidate on structural reorder) | functional | Story lens prompt needs paragraphRoles handling — Phase 4 sub-phase 4a |
| `arcType + arcConfidence + arcVerification` | L2 types.ts:138-141 | L3.75 narrativeStrategy.arcType + L4 northStar | Story lens narrativeStrategy + L4 northStar | symmetric | carry unless reorder | functional today; lens-of-origin post-absorption | Lens-of-origin update |
| `transitions[] + centralTheme + themeProgression` | L2 types.ts:144-153 | L3.75 narrativeStrategy + thematicArchitecture | Story + Meaning lenses | sub-slice (transitions to Story; centralTheme to Meaning) | carry-with-validity-test | functional today | Lens routing rule needed |
| `thematicGaps[] + flatSpots[]` | L2 types.ts:154-158 | coaching identification (informal) | L3 Pass 2 Meaning lens for thematicGaps; L3.5 for flatSpots; L5 Tier 2 ranking input | gap → rewire | re-derive on multi-paragraph edit | partial — informal consumption | Phase 4 sub-phase 4b L3.5 extension formalizes flatSpots; Meaning lens prompt formalizes thematicGaps |

### S-2.2: L2.5 ConnectionScoutOutput → L3 walk

| Field | Producer | Consumer | Symmetry | Carry-forward | Status | Gap |
|---|---|---|---|---|---|---|
| `repeatedElements[] + tonalShifts[] + structuralEchoes[]` | L2.5 scoutPass.ts:40-51 | L3 walk per-paragraph investigation | symmetric | re-derive on any non-trivial paragraph edit (forward-looking signals) | functional | Post L3 redesign: L3 Pass 1 Sweep consumes; lens deep reads use as upstream signal too |

---

## §3 — L3 → L3.75 (current) seams [SUPERSEDED post-absorption]

> **[NOTE — these seams are superseded by L3 internal seams (§4) post-absorption. Documented here for current-state baseline.]**

### S-3.1: L3 walk → L3.75 holisticSynthesis (current state)
- Producer: L3 sequentialDeepWalk.ts emits walkOutputs[].sentenceUnderstandings[], walkOutputs[].paragraphUnderstanding, holisticEvolution snapshots, newConnections, newFindings, findingEvolutions.
- Consumer: L3.75 holisticSynthesis.ts consumes all of the above for 10-section synthesis.
- Symmetry: symmetric.
- Carry-forward: per-paragraph for understanding; re-derive holistic synthesis per the 4-signal conditional.
- Status: functional today.
- Gap: SUPERSEDED post-absorption. Replaced by S-4.x lens internal seams.

---

## §4 — L3 internal seams (POST-ABSORPTION, post-redesign)

### S-4.1: L3 Sweep → L3 Pass 2 lens deep reads (parallel)
- Producer: L3 Pass 1 Sweep emits sentenceUnderstanding, paragraph roles, connection graph, archetype + confidence, phaseEstimate, lensDispatch scores (1-5 per lens with rationale).
- Consumer: 4 lenses (Voice / Meaning / Story / Admissions), each consumes Sweep output + essay text + (optional) ExperienceProfile + (optional) research block.
- Symmetry: each lens reads sub-slice of Sweep relevant to its dimension. Symmetric on lensDispatch (each lens reads its own dispatch score).
- Carry-forward: bookkeeping (Sweep's outputs flow to lenses; deterministic).
- Failure surface: Sweep failure → orchestrator halt. Lens dispatch < threshold → lens skipped (this is a routing decision, not a fallback).
- Status: only-planned.
- Gap: F5 deliverables — Sweep schema, lensDispatch threshold, per-lens dispatch handling.

### S-4.2: L3 Pass 2 lens emissions → profile holistic-profile fields (DIRECT WRITE)
The lens-direct-emission contract is the load-bearing change post-absorption:

| Lens | Emits to profile field | Consumer of that field |
|---|---|---|
| Voice | `voiceIdentity.signature, .primaryRegister, .evolution, .authenticVsPerformed[], .voiceMarkers[], .voiceWeaknesses[], .registerShifts[]` + `voiceMap.{register,vocabularyFingerprint,sentenceRhythm,perspectiveDistance,tonalDisposition,stabilityRegions,shifts}` + `craftAssessment.sentenceRhythmProse, .wordPatterns` | L3.5 patternMatches; L4 northStar voice-stakes; L5 voice anchor surface (per EXPERIENCE_TARGET §5.6) |
| Meaning | `thematicArchitecture.centralThesis, .thesisEvolution, .threads[], .subtext, .contradictions[]` + `craftAssessment.imageSystem` + `meaningGaps[]` (consumed by L3.5) + `valueArchitecture` | L3.5; L4 northStar through-line; L5 Move 7 contribution framing |
| Story | `narrativeStrategy.primaryStrategy (with rationale merged), .pivotPoints[], .turningPoint, .pacingAnalysis, .structuralChoices[], .arcType` + `craftAssessment.pacingShape` + `peakMoments + stakesLadder (feed Pass 3 earnedness)` + `emotionalTopography.peakMoments[] + .emotionalProgression[]` | L4 northStar trajectory; L5 stakes framing |
| Admissions | `admissionsPositioning.tellabilitySummary, .distinctivenessFactors[], .institutionalFit, .redFlags[] (each MUST carry fix), .memorability, .aoTakeaway, .archetypeContext.{archetype,differentiator}` + `characterSignals` (feed Pass 3 writerPortrait) | L4 northStar distinctiveness; L5 lede + admissions framing; L6 institutional-fit guidance |

- Symmetry: symmetric (lens emits exactly the field; no synthesis transformation in the middle).
- Carry-forward: per-lens validity tests. Voice lens carries unless register-shift detector flags drift on changed paragraphs. Meaning lens re-derives on structural edits or thesis-anchor edits. Story lens re-derives on reorder or pivot/turning-point edits. Admissions lens carries unless significance ≥ transformative.
- Failure surface: lens failure → orchestrator halt (no fallback to "missing lens output"). Per L5_E2E_INTEGRITY_AUDIT §1.3 step 11 (post R-2 rewrite): "lens-targeted re-run mechanism; selective lens re-runs; NO fallback to per-section calls within a single call."
- Status: only-planned (entire L3 redesign).
- Gap: F5 deliverables — 4 lens schemas, 4 lens prompts (each 3+ rounds revision), profile-write semantics (atomicity, schema validation), lens dispatch behavior.

### S-4.3: L3 Pass 2 lens outputs → L3 Pass 3 cross-dimension synthesis
- Producer: all 4 lens outputs (or however many ran per dispatch) + Sweep + essay text.
- Consumer: Pass 3 single Sonnet call.
- Pass 3 output: 4 cross-dimension fields (writerPortrait, entanglements ≤3, emotionalTopography.arcTrajectory, momentEarnednessMap.moments[].mechanisms) + optional 5th (connectionGraphSummary).
- Symmetry: Pass 3 reads all lens outputs; emits new fields the lenses can't produce alone.
- Carry-forward: re-derive on multi-paragraph edits OR if any lens that contributed to a Pass 3 field re-ran.
- Failure surface: Pass 3 failure → orchestrator halt. Per L3-75/L3_ABSORBS_L3_75.md decision #1: anti-drift commitment, Pass 3 stays one call, four fields, no iteration.
- Status: only-planned.
- Gap: F5 deliverables — Pass 3 prompt (3+ rounds revision), Pass 3 output schema, Pass 3 dispatch behavior under partial lens execution.

### S-4.4: L3 internal back-propagation (priorSentenceUpdates)
- Producer: L3 walk priorSentenceUpdates[] (back-prop from later paragraph re-walks to earlier sentences).
- Consumer: sentenceMutator (replaces existing arrays).
- Symmetry: symmetric (supersession mechanic).
- Carry-forward: bookkeeping.
- Status: functional.
- Gap: None.

### S-4.5: L3 → FindingStore (lens-direct emission per absorption decision #3)
- Producer: each lens writes findings directly via `findingStore.add()`.
- Consumer: FindingStore maturity lifecycle; downstream layers query by ID.
- Symmetry: symmetric.
- Carry-forward: per-Finding maturity validity check.
- Status: only-planned (lens emission). Today L3.75 promotes walk findings.
- Gap: F5 — each lens prompt instructed to emit findings with stable IDs + raisesQuestions + coachingValue + maturity.

---

## §5 — L3 → L3.5 seams (post-absorption)

### S-5.1: L3 lens outputs + Sweep + Pass 3 → L3.5 analysisPass

L3.5 consumes the full holistic profile (lens emissions + Pass 3) — the read paths are essentially the same as today's L3.75 reads, with field-rename migrations:

| Field | Reading site (today, then post-absorption) | Status | Gap |
|---|---|---|---|
| `voiceIdentity.*` | analysisPass.ts (existing reads) | functional | Lens-of-origin update, no read change |
| `thesisConfidence` | analysisPass.ts:942 | functional today | DROP per absorption — sub-phase 4b |
| `craftAssessment.sentencePatterns` (numeric) | analysisPass.ts:957 + deepAnnotationService.ts:1119 | functional today | RENAME to `sentenceRhythmProse` (Voice lens) — sub-phase 4b |
| `arcMomentum` | (various) | functional today | DROP per absorption — sub-phase 4b |
| `intellectualFingerprint` | (various) | functional today | DROP per absorption (merged into writerPortrait) — sub-phase 4b |
| `revealedQualities` | (various) | functional today | RENAME/MERGE to `valuesRevealed` per absorption — sub-phase 4b |
| `blindSpots` | (various) | functional today | DROP per absorption Decision A — sub-phase 4b |

### S-5.2: L3.5 emits NEW fields (post-absorption)

| Field | Producer | Consumer | Symmetry | Status | Gap |
|---|---|---|---|---|---|
| `contradictionFlags[]` | L3.5 prompt extension (per L3-5/PLAN.md) | L4 (resolves in score reasoning) + L6 (surfaces in coaching) | symmetric | only-planned | F5 sub-phase 4b deliverable |
| `essayStrengthSignatures[]` | L3.5 essay-level (migrated from L3.75) | L4 northStar distinctiveness; L5 Tier 2 protectedStrengths input | symmetric | only-planned | F5 sub-phase 4b deliverable |

Calibration targets: contradictionFlags rate 5–30%; strengthSignatures count 4–10. Outside ranges = prompt re-tune.

### S-5.3: improvementPhase → L3.5 + L4 + L5
- Producer: phaseAssessment.ts:46-69 emits PhaseAssessmentResult with level + focusAreas + deferredAreas + dimensionPhases + coachingLens + nearBoundary + transition.
- Consumer: L3.5 routing; L4 ranking weights; L5 coachingLens injection (deepAnnotationService.ts:494 PHASE_GUIDANCE).
- Symmetry: symmetric.
- Carry-forward: re-derive every iteration (the phase IS a lens, not a derivation).
- Status: functional.
- Gap: None.

---

## §6 — L3.5 → L4 seams

### S-6.1: L3.5 paragraphAnalysis + sentenceAnalyses → L4 NorthStar + ScoreMatrix + CoachingMap + Coherence

| Field | Producer | Consumer | Symmetry | Carry-forward | Status | Gap |
|---|---|---|---|---|---|---|
| `paragraphAnalysis.effectiveness` | L3.5 profileTypes.ts:816 | L4 scoreMatrix per-paragraph + phaseAssessment | symmetric | carry unchanged paragraphs; re-derive changed | functional | None |
| `sentenceAnalyses[].patternMatches[] + .symptomType` | L3.5 (Wave-1b) | L4 + L5 Tier 0 resolver hydrates patternId | gap (resolver doesn't yet exist at L5) | bundled | partial | F5 sub-phase 4d Tier 0 resolver wires resolvePATTERN |
| `contradictionFlags[]` (NEW) | L3.5 (post sub-phase 4b) | L4 (resolves in score reasoning) | symmetric | re-derive each iteration | only-planned | F5 sub-phase 4b |
| `essayStrengthSignatures[]` (NEW) | L3.5 (post sub-phase 4b) | L4 northStar distinctiveness; L5 Tier 2 | symmetric | re-derive each iteration | only-planned | F5 sub-phase 4b |
| `essayAuthenticityTier` (Port B3) | L3.5 anchor paragraph only | L5 Tier 2 → qualitativeSummary.authenticityTier | sub-slice (anchor only) | bundled | partial | F5 — L5 Tier 2 must handle null on non-anchor |
| `narrativeQualityIndex` | L3.5 anchor only | L5 Tier 2 → score accordion bandAnchor | sub-slice | bundled | partial | F5 — same |

### S-6.2: improvementPhase → L4 (ranking weights)
- Producer: improvementPhase.
- Consumer: L4 prompt instruction for phase-conditioned ranking.
- Symmetry: symmetric.
- Status: functional.
- Gap: None.

---

## §7 — L4 → L5 seams

### S-7.1: L4 northStar + scoreMatrix + coachingMap + coherence → L5

L5 is the most signal-dependent layer. L5_CONSUMPTION_AUDIT.md rows 149–178 enumerate L4 → L5 contracts.

Key rows:

| Field | Producer | Consumer at L5 | Symmetry | Status | Gap |
|---|---|---|---|---|---|
| `northStar.activeScale` | L4 profileTypes.ts:1378 | profileRouter L5 ctx | symmetric | functional | None |
| `northStar.throughLineMap (centralElement + journey[])` | L4 profileTypes.ts:1386,1427-1439 | L5 holistic context (profileRouter); Move 7 contribution framing | symmetric | functional | None |
| `northStar.structuralRolesMap[].weight` | L4 profileTypes.ts:1455 | L5 feedback annotations + Tier 2 ranking weight | symmetric | functional | F5 sub-phase 4d formalizes Tier 2 weighting |
| `northStar.distinctivenessSignature.articulation` | L4 profileTypes.ts:1488 | L5 holistic context + Tier 2 lede + Distinction-phase content | symmetric | functional | None |
| `northStar.intentBridge.alignments[]` | L4 profileTypes.ts:1504-1508 | L6 coaching (alignments fuel) — note: NOT L5 | symmetric | functional | None |
| `scoreMatrix.paragraphs[].scores.*` | L4 (paragraphScoreEntry) | L5 feedback annotations + Tier 2 score accordion trajectory | symmetric | functional | F5 sub-phase 4d formalizes Tier 2 score reframing |
| `coachingMap.transformativeInsight.insight` | L4 profileTypes.ts:2605 | L5 deepAnnotationService.ts:518-523 + Tier 2 → qualitativeSummary.lede | symmetric | functional | F5 sub-phase 4d formalizes lede composition |
| `coachingMap.priorities[]` | L4 profileTypes.ts:2611-2634 | L5 ranked source for top-3 (now sized by essay per EXPERIENCE_TARGET §7.1) | symmetric | functional | F5 sub-phase 4d removes hard top-3 cap |
| `coachingMap.priorities[].pairedImprovement` (NEW post-absorption: emitted by L4b directly) | L4b (post sub-phase 4c) | L5 Tier 1 prompt + Tier 2 + manifest merger | partial: L4b currently reads from upstream candidateStore; doesn't EMIT directly. Per F1 R-3 | partial | F5 sub-phase 4c — L4b prompt extended with TECHNIQUE_VOCABULARY block; emits pairedImprovement |
| `coachingMap.protectedStrengths[]` | L4 profileTypes.ts:2636-2640 | L5 + L6 + Tier 2 → "do not damage" guards | symmetric | functional | None |
| `coherenceReport.contradictions[]` | L4 contradictionConsumer | L5 (flagged for L6 investigation, not for L5 to resolve) + Tier 2 | sub-slice | functional | None |

### S-7.2: NEW seam — IterationLedger.taughtMoves → L5 priorAnnotations builder
- Producer: IterationLedger.taughtMoves[] (Phase 1 commits).
- Consumer: priorAnnotationsBuilder (Phase 1 D-1.6).
- Symmetry: symmetric.
- Carry-forward: bookkeeping (ledger persists indefinitely).
- Failure surface: builder failure throws; orchestrator halts.
- Status: only-planned (taughtMoves type doesn't exist; builder doesn't exist).
- Gap: F5 — Phase 0 D-0.1 (types) + Phase 1 D-1.2 (taughtMoves append at L5 call end) + Phase 1 D-1.6 (priorAnnotations builder) + Phase 1 D-1.8 (analysisOrchestrator.ts:850 wire-up).

### S-7.3: NEW seam — landing detector inputs/outputs
- Producer: landingDetector (Phase 1 D-1.3) reads (priorTaughtMove, edit diff, newAnalysisAtLocation, chatBehavior).
- Consumer: priorAnnotationsBuilder uses landing.status to set addressedByEdit boolean on PriorAnnotationContext.
- Symmetry: symmetric.
- Carry-forward: bookkeeping (TaughtMove.landing populated next iteration).
- Status: only-planned.
- Gap: F5 — Phase 1 D-1.3 + D-1.4 + D-1.5 (calibration touchpoint).

---

## §8 — L5 → L6 + manifest seams

### S-8.1: L5 surfaces → render
- Producer: l5SurfaceComposer.ts (Phase 4 sub-phase 4d).
- Consumer: 10 UI surface components (Phase 5).
- Symmetry: per-surface input contract per EXPERIENCE_TARGET §5.
- Carry-forward: surfaces compose from carry-forward state + fresh L5 output.
- Status: only-planned (surface composer + UI components).
- Gap: F5 Phase 4 sub-phase 4d + Phase 5 entire.

### S-8.2: L5 manifest entries → L6 reads
- Producer: l5ManifestMerger.ts (current); post-redesign: l5_v2_to_manifest adapter (per L5_FEEDBACK_REDESIGN.md §10.5).
- Consumer: L6 coachingService reads manifest items.
- Symmetry: symmetric.
- Carry-forward: manifest persists.
- Status: functional today.
- Gap: F5 — adapter ensures field parity (essaySpecificDemo, demonstration, technique, stakes, wordEconomyCut). Note: pairedImprovement field migration per S-7.1 affects this seam.

### S-8.3: L5 → Conversator (continuous chat surface)
- Producer: L5 surfaces (focus surface, lede, voice anchor, etc.) provide context Conversator chat handler reads.
- Consumer: Conversator continuousChatHandler.ts.
- Symmetry: Conversator reads everything L5 emits + iteration ledger context.
- Carry-forward: Conversator session log persists; surfaces re-compose per iteration.
- Status: only-planned.
- Gap: F5 Phase 3 entire.

---

## §9 — Conversator ↔ analysis seams (BIDIRECTIONAL)

### S-9.1: SpecificsNeed → Conversator dig firing
- Producer: specificsNeedAggregator (Phase 2 D-2.7) emits UnderstandingQuestion entries with source `'analysis_specifics_gap'` and DigContext sub-object.
- Consumer: conversatorTimingPolicy reads queue + selects question per Q-A timing rules; digQuestionComposer composes student-facing framing.
- Symmetry: symmetric (DigContext.framingSeed ↔ Conversator's composed framing).
- Carry-forward: queue persistent across iterations.
- Status: only-planned.
- Gap: F5 Phase 2 + Phase 3.

### S-9.2: Conversator dig answers → analysis layers next iteration
- Producer: digAnswerExtractor (Phase 3 D-3.7) produces GroundTruthFact / StoryFragment / IntentSignal records.
- Consumer: per Conversator-to-analysis feedback wiring (Phase 3 D-3.14):
  - `GroundTruthFact[]` → L1/L3/L3.5/L5 prompt blocks (cached); L5 fabrication-guard (Tier 3).
  - `StoryFragment[]` → L3 Pass 2 Story lens + L3 Pass 3 momentEarnednessMap synthesis; L5 Move 6 multiplicity paths.
  - `IntentSignal[]` → L4 northStar.intentBridge alignment; coaching map's framing.
- Symmetry: symmetric on shape; analysis layers consume per-record.
- Carry-forward: durable across iterations; supersede only on explicit student correction.
- Failure surface: ground truth captured but never consumed → telemetry surfaces "fact #X not consumed by any layer in iteration N+1". Conflict between fact and essay → L5 fabrication-guard surfaces to student inline (per L5_E2E_INTEGRITY_AUDIT §5.4).
- Status: only-planned.
- Gap: F5 Phase 3 D-3.14 (the wiring) + per-layer prompt extensions accepting GroundTruthFact / StoryFragment / IntentSignal blocks.

---

## §10 — IterationLedger → all layers seams

### S-10.1: IterationLedger.currentIteration → all orchestration
- Producer: incremented at iteration start by orchestrator (Phase 1 D-1.1).
- Consumer: focusedAnalyzer mode-selection (`if iteration > 1, prefer focused`); priorAnnotations builder; L5 prompt iteration context; UI iteration display per Q6.
- Status: only-planned.
- Gap: F5 Phase 1 D-1.1.

### S-10.2: IterationLedger.taughtMoves[] → cross-iteration context
Per S-7.2.

### S-10.3: IterationLedger.iterations[] (audit records) → telemetry / calibration
- Producer: orchestrator commits IterationRecord at iteration end (Phase 1 D-1.10).
- Consumer: calibration dashboard, cost-trajectory analysis, post-launch tuning.
- Status: only-planned.
- Gap: F5 Phase 1 D-1.10.

### S-10.4: CarryForwardDecision[] → audit / regression detection
- Producer: orchestrator carry-forward decision points (Phase 1 D-1.11).
- Consumer: audit (recentDecisions[]), per-iteration cost-vs-baseline regression detection.
- Status: only-planned.
- Gap: F5 Phase 1 D-1.11.

---

## §11 — Re-analysis lifecycle → orchestrator seams

### S-11.1: editUnderstandingService → focusedAnalyzer.selectAnalysisMode
- Producer: editUnderstandingService.ts:714 emits StalenessEffect[] + diff.paragraphChanges[].
- Consumer: focusedAnalyzer.selectAnalysisMode (current 7 rules; post-R-4 expanded with `focused_structural`).
- Symmetry: gap — StalenessEffect lacks Finding ID linkage (per F1, profileTypes.ts:3966-3970 type missing findingIds[]).
- Carry-forward: per-iteration.
- Status: partial (selectAnalysisMode functional for 2-mode design; `focused_structural` only-planned; StalenessEffect→Finding ID linkage missing).
- Gap: F5 Phase 0 (StalenessEffect type extension with findingIds[]) + Phase 4 sub-phase 4e (`focused_structural` mode).

### S-11.2: focused vs comprehensive vs focused_structural mode → layer re-run rules
Per RE_ANALYSIS_LIFECYCLE_DESIGN.md §7 layer re-run rules summary table (post-R-2 absorption + R-4 focused_structural integration). 3 columns: comprehensive (content) | comprehensive (structural) | focused_structural | focused (no ripple) | focused (with ripple).
- Status: 2-mode functional; 3rd mode only-planned.
- Gap: F5 sub-phase 4e + RE_ANALYSIS_LIFECYCLE_DESIGN doc revision (lands as part of F2 absorption rewrite).

---

## §12 — Slicing contract (profileRouter)

### S-12.1: profileRouter slicing → per-layer prompt
- Producer: profileRouter (per-layer rule with budget, included/excluded fields, priority levels).
- Consumer: each layer's prompt builder.
- Symmetry: symmetric per-rule.
- Carry-forward: bookkeeping (deterministic routing).
- Status: functional.
- Gap: F1 Audit F1 — `holisticFull` priority `'always'` at profileRouter:1035 means L4 receives 120K tokens of context. Replace with `holisticSummaries`. F5 sub-phase 4c (L4 context compression deliverable).

---

## §13 — Profile persistence seams

### S-13.1: EssayProfile JSONB → DB
- Producer: essayProfileManager checkpointing.
- Consumer: DB writes; subsequent loads.
- Symmetry: symmetric.
- Status: functional today; new fields (iterationLedger, groundTruthFacts, storyFragments, intentSignals, conversatorSessionLog) require migration (F5 Phase 0 D-0.8 backfill).
- Gap: Phase 0 migration.

### S-13.2: essay_chat_conversations + essay_ground_truth tables
- Producer: Conversator (Phase 3) writes.
- Consumer: Conversator reads; analysis layers read ground truth from JSONB or via Conversator service.
- Status: only-planned (tables don't exist).
- Gap: F5 Phase 0 D-0.6 + D-0.7.

---

## §14 — Per-seam summary

| Seam group | Total seams | Functional | Partial | Only-planned |
|---|---|---|---|---|
| L1/L1.5 → L2/L3 | 3 | 3 | 0 | 0 |
| L2 → L3/L3.75 | 3 | 3 | 0 | 0 |
| L3 → L3.75 (current) | 1 | 1 (superseded by §4) | 0 | 0 |
| L3 internal (post-absorption) | 5 | 0 | 0 | 5 |
| L3 → L3.5 | 2 | 1 (today's reads) | 0 | 1 (NEW fields) |
| improvementPhase → L4+L5 | 1 | 1 | 0 | 0 |
| L3.5 → L4 | 6 | 3 | 2 | 1 |
| L4 → L5 | 12 | 9 | 1 | 2 |
| L5 → L6/manifest | 3 | 1 | 0 | 2 |
| Conversator ↔ analysis | 2 | 0 | 0 | 2 |
| IterationLedger → all | 4 | 0 | 0 | 4 |
| Re-analysis lifecycle → orchestrator | 2 | 1 | 1 | 0 |
| profileRouter slicing | 1 | 1 (with F1 fix needed) | 0 | 0 |
| Profile persistence | 2 | 1 | 0 | 1 |
| **Total** | **47** | **24** | **4** | **19** |

47 seams audited. 19 are only-planned (entirely new infrastructure: L3 lens internals, IterationLedger, Conversator seams, NEW DB tables). 4 partial (today's L3.5/L4 partial reads needing extension). 24 functional today.

---

## §15 — Gaps surfacing for F5 deliverables

This audit consolidates seam-level gaps that F5's INTEGRATED_BUILD_SEQUENCE.md must enumerate as deliverables:

1. **Phase 0 types**: 9 NEW types per F1 Component 26 (IterationLedger, TaughtMove, CarryForwardDecision, IterationRecord, DigContext, GroundTruthFact, StoryFragment, IntentSignal, ConversatorSessionEntry) + StalenessEffect.findingIds[] extension + UnderstandingQuestion source/status extensions.
2. **Phase 0 migrations**: essay_chat_conversations + essay_ground_truth + EssayProfile JSONB backfill.
3. **Phase 1 wiring**: priorAnnotations builder + landing detector + IterationLedger commit + CarryForwardDecision append + halt-on-error + AO First Read failure surface promotion.
4. **Phase 2 SpecificsNeed**: aggregator + per-layer prompt extensions (L3 walk + L3.5 + per-lens for L3.75-absorbed contributors + L4 northStar + FindingStore).
5. **Phase 3 Conversator**: full service + persistence + 4 prompts (composer, extractor, chat handler, router) + Conversator-to-analysis wiring.
6. **Phase 4 L3 redesign**: Sweep schema + 4 lens schemas + Pass 3 prompt + lens prompts (each 3+ rounds) + lens-direct profile-write semantics + Pass 3 anti-drift enforcement.
7. **Phase 4 L3.75 deletion**: holisticSynthesis.ts deletion + iteration orchestration deletion + holisticMutator deletion + corpusTelemetryPersistence L3.75 cleanup + EssayPortrait UI render-from-fields.
8. **Phase 4 L3.5 extension**: contradictionFlags emission + essayStrengthSignatures emission + mode-selection fix (Audit F2) + cut-field read removals.
9. **Phase 4 L4 absorption + F1 fix**: L4b pairedImprovement direct emission (TECHNIQUE_VOCABULARY block) + ImprovementManifestEntry schema migration + NorthStar context compression (Audit F1: holisticFull → holisticSummaries) + cut-field read removals.
10. **Phase 4 corpus expansion**: 8 missing artifact types wired (antiArchetypes, voiceArchetypeCompatibility, corpusLimits, readerBiasGuards, moveDependencies, schoolFitVectors, contextualValidity, deliberateAbsences, moveExcerpts).
11. **Phase 4 focused_structural mode**: selectAnalysisMode rule update + focused_structural procedure + RE_ANALYSIS_LIFECYCLE_DESIGN doc revision.
12. **Phase 4 L5 surface composer + Tier 2**: l5TierTwoSynthesizer + l5SurfaceComposer + 16 missing capabilities per L5_FEEDBACK_REDESIGN §1.8.
13. **Phase 5 UI**: 10 surface components + EssayConversatorPanel mount + visual regression + accessibility + non-negotiables verification.
14. **Phase 6 E2E pivot**: full E2E run + Tue review + fix-cycles.
15. **Phase 6.5 L6 light update**: 4 read-site migrations.

---

> **End of integration contracts audit.** F5 INTEGRATED_BUILD_SEQUENCE.md enumerates the per-deliverable contracts using these seam-level gaps as the canonical work breakdown.
