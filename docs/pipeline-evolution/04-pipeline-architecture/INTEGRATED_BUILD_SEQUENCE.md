# Integrated Build Sequence — Phase F5 deliverable

> **The executable spine.** Every deliverable across every workstream (L3 redesign, L3.75 absorption execution, L3.5 extension, L4 absorption + Audit F1 fix, L5 redesign, Conversator, focused_structural mode, corpus retrieval expansion, UI surfaces, L6 light update) sequenced with contracts, behavior specs, failure surfaces, validation paths, dependency/blocks links, effort estimates.
>
> **Inheritance**. Inherits the L5_IMPLEMENTATION_PLAN.md's spine and structure verbatim where applicable. Extends with deliverables for the workstreams the L5-only plan didn't cover. The L5 plan's Phase 0–6 + standing operational charter + revision protocol + halt-on-failure policy carry forward.
>
> **Status**: `draft v1` (consolidation phase F5). Build phase executes against this spine after Tue's F7 sign-off.
> **Total scope**: ~150 deliverables across Phase 0–6.5. Estimated 12–18 weeks of focused engineering.
> **Total expected build-phase API spend**: pending Tue's TQ-2 cap selection ($10 hold or $25 expanded). This document sizes the per-phase allocations against the $25 proposal; halts at $9 of the $10 if Tue picks Option A.

---

## §0 — Standing operational charter (workspace-wide)

The L5 build's standing charter expands to the entire integrated build. Repeated three times because the message has to land. This is the soul of the build.

**This build has unlimited time, unlimited tokens per response, unlimited revision cycles, unlimited agent and swarm dispatches, unlimited thinking time per deliverable.** The single hard constraint is the **API cost cap** (TQ-2 selection) across the entire build. Everything else exists to support quality.

Every component, from the smallest type field to the largest orchestrator, gets built with focus, care, and revision until it lands at the level the design deserves. Do not optimize for anything except quality of result. Do not ship a deliverable that is "good enough" when more revision would make it right. Take the time. Spawn the agents. Revise until landing.

The system Tue described over weeks of design work — and the master integration plan's vision — is what gets built, at the level it deserves.

### What the charter licenses

- **Agent / swarm dispatch.** Spawn agents for parallel investigation. Many. Per-layer Explore agents during phase audits. Plan agents for thorny design decisions. code-review-style agents for the no-fallback enforcement pass on every orchestration deliverable. security-architect agents for RLS / auth boundaries. Whatever the deliverable benefits from.
- **Continuous revision until quality lands.** Three rounds per prompt is the *minimum*, not the maximum. Round 4. Round 8. Round 12. The prompt is done when it is *right*.
- **Long-form thinking per deliverable.** No deliverable ships in the first draft. Type definitions get read against the design contract twice before commit. Test cases get read against "what could go wrong here" once. Functions get read against the no-fallback checklist once.
- **Token-unconstrained reasoning.** Long, file-and-line-grounded answers that cite design-contract sections beat terse answers.
- **Continuous test-running.** `npx tsc --noEmit` after every type change; mock-based integration tests after every meaningful code change.
- **Cross-phase audits as full-context investigations.** Between phases, before advancing, the implementer rereads every governing doc that gates the next phase, checks every audit row, walks the dependency graph fully. Hours per audit. Right cost.
- **The deliverable is done when it is right.** Not "shipped." Not "passes tests." Not "good enough." When it is right.

### No-fallback discipline

Single-owner-with-visible-failure across every deliverable. Practical rules:

1. No `Promise.allSettled` without explicit per-result error handling that surfaces to telemetry and halts upstream.
2. No catch blocks without re-throw OR explicit telemetry emit + caller halt.
3. No `?? defaultValue` in critical paths.
4. No retry-with-canned-fallback patterns. LLM call fails → throw with structured context. Student sees honest error with retry-button.
5. Comprehensive-mode escalation is NOT a fallback — it's a routing decision.

Every PR includes: **"What is this code's failure surface, and where does the failure surface to?"** If the answer is "it falls back to Y," the PR doesn't merge until removed.

### Build cost discipline

Every API call records in `BUILD_COST_LEDGER.md` (created in D-0.10). Cost-recording utility auto-appends. Hard halt at $9 (warn at $7) for Option A; halt at $24 (warn at $20) for Option B (TQ-2). Mid-build escalations only when prompts aren't landing despite Round 4+ or contracts have ambiguity the docs don't resolve.

### Tue review cadence

System-level review at Phase 6 after the final E2E run. Mid-build escalations are rare. Tue reviews this F5 + F4 + F2 outputs at F7 before the build chat opens.

---

## §1 — The dependency graph (the spine)

```
PHASE 0 — TYPES + MIGRATIONS + TELEMETRY (no LLM cost; 2–4 days)
  D-0.1   IterationLedger + TaughtMove + CarryForwardDecision + IterationRecord types
  D-0.2   UnderstandingQuestion source + status + DigContext extensions
  D-0.3   GroundTruthFact + StoryFragment + IntentSignal types
  D-0.4   ConversatorSessionEntry type
  D-0.5   EssayProfile root field additions
  D-0.6   Migration: essay_chat_conversations table
  D-0.7   Migration: essay_ground_truth table
  D-0.8   Migration: EssayProfile JSONB field additions + backfill
  D-0.9   Telemetry hook scaffolding
  D-0.10  BUILD_COST_LEDGER.md scaffold + cost-recording utilities
  D-0.11  Mock-LLM testing framework
  D-0.12  No-fallback ESLint rule
  D-0.13  Test-coverage tooling configured
  D-0.14  StalenessEffect.findingIds[] extension (per F1 R-12 + iteration design §2.3)
  D-0.15  L3 redesign type scaffolding (Sweep output schema, Lens output schemas × 4, Pass 3 output schema)
  D-0.16  L3.5 extension type scaffolding (contradictionFlags + essayStrengthSignatures schemas)
  D-0.17  L4b extension type scaffolding (ImprovementManifestEntry.pairedImprovement schema)
  D-0.18  Phase 0 cross-phase integrity audit
  D-0.19  Phase 0 integration test (Phase 0 → Phase 1 gate)

PHASE 1 — DEAD-WIRE FIX + ITERATION LEDGER (5–8 days)
  D-1.1   IterationLedger constructor + accessor on EssayProfile load
  D-1.2   taughtMoves[] append at L5 call end
  D-1.3   Landing detector skeleton (Haiku + structured output validation)
  D-1.4   Landing detector prompt (3+ rounds)
  D-1.5   Landing detector calibration check (mid-build API touchpoint #1, ~$0.50–$1.00)
  D-1.6   priorAnnotations builder (taughtMoves → Map<paragraph, ctx>)
  D-1.7   priorAnnotations builder index-remap on structural reorder (F7 mitigation)
  D-1.8   analysisOrchestrator.ts:850 wire-up
  D-1.9   reanalysisOrchestrator.ts:1177 verification + integration (per F1 R-12 — line is NOT a parallel dead wire; D-1.9 verifies builder integrates with the live brief)
  D-1.10  IterationLedger.iterations[] commit at orchestrator end
  D-1.11  CarryForwardDecision append at orchestrator decision points
  D-1.12  Halt-on-error orchestration policy applied (full code-review pass; AO First Read failure surface promotion included)
  D-1.13  TaughtMove ID stability property test
  D-1.14  IterationLedger append-only invariant test
  D-1.15  Mock-LLM integration test (full iter 1→2 flow)
  D-1.16  Failure-injection test (every error boundary)
  D-1.17  Phase 1 cross-phase integrity audit
  D-1.18  Phase 1 cumulative cost-ledger check

PHASE 2 — SPECIFICSNEED AGGREGATOR + QUEUE EXTENSION (4–6 days)
  D-2.1   QuestionQueueManager extension (new source + statuses + dig sub-object)
  D-2.2   L3 walk prompt extension (3+ rounds; emit specifics-need from raisesQuestions[])
  D-2.3   L3.5 analysis prompt extension (3+ rounds; emit on low-confidence sentences)
  D-2.4   L3.75 holistic prompt extension (3+ rounds; emit from gaps[], redFlags[], etc.) — INTERIM until sub-phase 4a; post-absorption replaced by per-lens emission contributors
  D-2.5   L4 northStar prompt extension (3+ rounds; emit on hypothesis-confidence)
  D-2.6   FindingStore stuck-hypothesis emission path (3+ rounds)
  D-2.7   specificsNeedAggregator.ts (deterministic, dedup logic, schema-validate emissions)
  D-2.8   Aggregator integration into analysisOrchestrator
  D-2.9   Specifics-need emission sanity check (mid-build API touchpoint #2, ~$0.50–$1.00)
  D-2.10  Queue persistence concurrency test
  D-2.11  Aggregator dedup property test
  D-2.12  Mock-LLM integration test (multi-layer emission, queue accumulation, persistence)
  D-2.13  Phase 2 cross-phase integrity audit
  D-2.14  Phase 2 cumulative cost-ledger check

PHASE 3 — CONVERSATOR (8–12 days)
  D-3.1   Conversator service skeleton (essayConversator.ts, sub-files)
  D-3.2   conversatorPersistence.ts (modeled on activity-side precedent)
  D-3.3   Chat intent classifier (Haiku, six routes)
  D-3.4   Chat intent classifier prompt (3+ rounds)
  D-3.5   digQuestionComposer.ts (Sonnet, framing + non-leading)
  D-3.6   Dig-question composer prompt (3+ rounds)
  D-3.7   digAnswerExtractor.ts (Sonnet, parallel factual/narrative/intent)
  D-3.8   Dig-answer extractor prompt (3+ rounds)
  D-3.9   Conversator dig + extractor sanity check (mid-build API touchpoint #3, ~$1.50–$2.00)
  D-3.10  continuousChatHandler.ts (six route handlers)
  D-3.11  Per-route prompts × 6 (3+ rounds each)
  D-3.12  conversatorTimingPolicy.ts (pure logic)
  D-3.13  EssayConversatorPanel UI component (Phase 5 sequencing — listed here for ownership)
  D-3.14  Conversator-to-analysis feedback wiring (groundTruth/story/intent into next iteration)
  D-3.15  Halt-on-error orchestration policy applied (Conversator scope)
  D-3.16  Mock-LLM integration test (full dig E2E + all six chat routes)
  D-3.17  Failure-injection test (every Conversator error boundary)
  D-3.18  Phase 3 cross-phase integrity audit
  D-3.19  Phase 3 cumulative cost-ledger check

PHASE 4 — THE BIG PHASE (14–21 days)
  ─── Sub-phase 4a: L3 redesign + L3.75 absorption execution ───
  D-4a.1  L3 Sweep prompt (3+ rounds, sentenceUnderstanding + paragraph roles + connections + archetype + lensDispatch)
  D-4a.2  L3 Voice lens prompt (3+ rounds; emits voiceIdentity + voiceMap + voice-craft fields directly)
  D-4a.3  L3 Meaning lens prompt (3+ rounds; emits thematicArchitecture + craftAssessment.imageSystem + meaningGaps + valueArchitecture)
  D-4a.4  L3 Story lens prompt (3+ rounds; emits narrativeStrategy + craftAssessment.pacingShape + emotionalTopography contributors)
  D-4a.5  L3 Admissions lens prompt (3+ rounds; emits admissionsPositioning + characterSignals)
  D-4a.6  L3 Pass 3 prompt (3+ rounds; emits writerPortrait + entanglements ≤3 + emotionalTopography.arcTrajectory + momentEarnednessMap.moments[].mechanisms)
  D-4a.7  Lens dispatch logic (lensDispatch scores + threshold + parallel orchestration)
  D-4a.8  Profile-write semantics for lens emissions (atomicity + schema validation)
  D-4a.9  L3.75 absorption contamination check (mid-build API touchpoint #4, ~$1.00–$1.50)
  D-4a.10 holisticSynthesis.ts deletion (~3,650 lines)
  D-4a.11 analysisOrchestrator L3.75 phase deletion (~200 lines lines 520-567 + iteration orchestration)
  D-4a.12 holisticMutator.ts deletion (~150 lines)
  D-4a.13 corpusTelemetryPersistence L3.75 cleanup
  D-4a.14 Consumer migrations (~6 sites): analysisPass:942 (drop thesisConfidence read), :957 + deepAnnotationService:1119 (sentencePatterns rename), deepAnnotationService:1129 (portfolioPosition→aoTakeaway), coachingService:2807 (poolDensity→differentiator), readinessScoring:74,153 (thesisConfidence gate replacement), diffEngine:115 (thesisConfidence delta replacement)
  D-4a.15 EssayPortrait UI render-from-fields (replace UnderstandingProse with composed render of voiceIdentity.signature + thematicArchitecture.centralThesis + writerPortrait + tellabilitySummary + narrativeStrategy.primaryStrategy)
  D-4a.16 Lens-targeted re-run mechanism (per-lens invalidation flags + selective lens re-runs + optional Pass 3 re-run; replaces L3.75 targeted-refresh)
  D-4a.17 SpecificsNeed contributor migration (post-absorption per-lens emission per F2 R-7)

  ─── Sub-phase 4b: L3.5 extension ───
  D-4b.1  L3.5 prompt extension — contradictionFlags emission (3+ rounds; calibration target 5–30%)
  D-4b.2  L3.5 prompt extension — essayStrengthSignatures emission (3+ rounds; cap 5–8, calibration target 4–10)
  D-4b.3  L3.5 mode-selection rule update (Audit F2 fix: architecture phase gets per-paragraph mode)
  D-4b.4  L3.5 cut-field read removals (~5 sites: thesisConfidence, sentencePatterns rename, arcMomentum, intellectualFingerprint, revealedQualities)
  D-4b.5  L3.5 contradictionFlags integration test (calibration empirical)

  ─── Sub-phase 4c: L4 absorption + Audit F1 fix ───
  D-4c.1  L4b prompt extension — TECHNIQUE_VOCABULARY block + pairedImprovement direct emission (3+ rounds)
  D-4c.2  ImprovementManifestEntry schema migration (pairedImprovement field added)
  D-4c.3  L4b prompt verification — pairedImprovement output cap (+2-3K tokens) honored
  D-4c.4  NorthStar prompt update — cut-field read removals + lens-of-origin annotations
  D-4c.5  ScoreMatrix prompt update — same cut-field migrations
  D-4c.6  L4 context compression (Audit F1 fix): profileRouter `holisticFull` priority `'always'` → `'high'` with content compressed to summaries (replace `holisticFull` with `holisticSummaries` per audit fix direction)
  D-4c.7  L4 context compression integration test (verify L4 input tokens drop from ~120K to ~5-8K on fixture)
  D-4c.8  L5 read of pairedImprovement migration (from L3.75 candidateStore path to L4b emit path)

  ─── Sub-phase 4d: L5 surface composer + Tier 2 synthesizer + L5 capability gap closure ───
  D-4d.1  l5TierTwoSynthesizer.ts (Tier 2 Sonnet call, focus surface + lede + deferred composition)
  D-4d.2  Tier 2 synthesis prompt (3+ rounds; non-repetition contract + multiplicity Move 6 enforcement)
  D-4d.3  Tier 2 non-repetition smoke (mid-build API touchpoint #5, ~$0.50–$1.00)
  D-4d.4  l5SurfaceComposer.ts (composes 10 surfaces per EXPERIENCE_TARGET §5)
  D-4d.5  L5 Tier 0 resolver — resolveMOVE function
  D-4d.6  L5 Tier 0 resolver — resolveAP function (anti-archetype hydration with transplantPath teaching)
  D-4d.7  L5 Tier 0 resolver — resolvePATTERN function (patternId + full template hydration from src/services/piq/issuePatterns.ts)
  D-4d.8  L5 Tier 0 resolver — resolveF function (Finding lineage hydration with maturity filter)
  D-4d.9  L5 Tier 1 prompt extension — multiplicity Move 6 (2–4 substantively different paths per focus point)
  D-4d.10 L5 Tier 1 prompt extension — voice profile injection (cached block from voiceIdentity + voiceMap)
  D-4d.11 L5 Tier 3 Haiku quality check (bias-guard diagnostic per readerBiasGuards)
  D-4d.12 L5 fabrication-guard at Tier 3 (groundTruthFacts conflict detection)
  D-4d.13 Inline-editor command shape (replace-phrase, etc. per WRITING_IMPROVEMENT_ROADMAP:701-721)
  D-4d.14 Cross-iteration synthesis (Haiku, iteration ≥ 3, reads taughtMoves chain)
  D-4d.15 Cross-iteration synthesis prompt (3+ rounds)
  D-4d.16 Cost trajectory test (5-iteration mock matches design's predictions)
  D-4d.17 Mock-LLM integration test (full L5 surfaces + Tier 0/1/2/3 flow)

  ─── Sub-phase 4e: focused_structural mode + corpus retrieval expansion ───
  D-4e.1  selectAnalysisMode rule update — add focused_structural between focused and comprehensive (per F2 R-4)
  D-4e.2  focused_structural procedure implementation (index remap + selective re-derive + carry voice/character/craft/L1)
  D-4e.3  RE_ANALYSIS_LIFECYCLE_DESIGN.md doc revision (apply R-2 absorption + R-4 focused_structural)
  D-4e.4  Corpus retrieval expansion: antiArchetypes (11 entries) wired into corpusRetrievalBlocks
  D-4e.5  Corpus retrieval expansion: voiceArchetypeCompatibility (98 cells) wired
  D-4e.6  Corpus retrieval expansion: corpusLimits (18 conditions) wired
  D-4e.7  Corpus retrieval expansion: readerBiasGuards (14 guards) wired
  D-4e.8  Corpus retrieval expansion: moveDependencies (12 entries) wired
  D-4e.9  Corpus retrieval expansion: schoolFitVectors (95 records / 15 schools) wired
  D-4e.10 Corpus retrieval expansion: contextualValidity (21 patterns) wired
  D-4e.11 Corpus retrieval expansion: deliberateAbsences (16 entries) wired
  D-4e.12 Corpus retrieval expansion: moveExcerpts (53 entries) wired with anchorLevel filter

  ─── Sub-phase 4f: Phase 4 audit + cost check ───
  D-4f.1  Phase 4 cross-phase integrity audit
  D-4f.2  Phase 4 cumulative cost-ledger check

PHASE 5 — UI SURFACES (frontend, no LLM cost; 5–8 days)
  D-5.1   Lede surface component
  D-5.2   Progress strip component (iteration ≥ 2)
  D-5.3   Focus card component (with Move 6 multiplicity rendering)
  D-5.4   Connection map component (standing surface)
  D-5.5   Voice anchor component (standing surface)
  D-5.6   Score accordion component (collapsed by default)
  D-5.7   Deferred surface component (re-cast as "not this revision")
  D-5.8   Iteration response surface component
  D-5.9   "Different shape" architectural multiplicity drawer
  D-5.10  EssayConversatorPanel integration into editor view
  D-5.11  UI route + page assembly
  D-5.12  Visual regression tests (snapshot per surface)
  D-5.13  Accessibility audit per surface
  D-5.14  Non-negotiables verification per surface (zero internal-state leak, zero verdict language, zero convergence pressure surfaced)
  D-5.15  Phase 5 cross-phase integrity audit
  D-5.16  Phase 5 readiness audit (full system pre-E2E gate)

PHASE 6 — SINGLE E2E VALIDATION RUN (the pivot; 3–7 days)
  D-6.1   Pick representative essay + capture as fixture
  D-6.2   Pre-E2E readiness audit
  D-6.3   E2E run iteration 1 (~$1.00, full pipeline, comprehensive mode)
  D-6.4   Inspection moment 1 (surfaces rendered, contracts hold, all 8 non-negotiables verified)
  D-6.5   Conversator dig + simulated student answer
  D-6.6   Inspection moment 2 (extraction captured intent)
  D-6.7   E2E run iteration 2 (~$0.30, focused mode, after small edit)
  D-6.8   Inspection moment 3 (carry-forward correct, no repetition, structured answer surfaced)
  D-6.9   E2E run iteration 3 (~$0.40, focused_structural mode after reorder; verifies the new mode end-to-end)
  D-6.10  Inspection moment 4 (focused_structural carry-forward correct, index remap applied, lens re-runs selective)
  D-6.11  IterationLedger telemetry deep inspection
  D-6.12  Inspection moment 5 (telemetry well-formed, redirection per Q1-resolution, cost trajectory matches design)
  D-6.13  Tue review at the system level — the iteration that calibrates the build
  D-6.14  Fix-cycle deliverables (one per Tue review note; each ≤$0.30 re-run if API needed)

PHASE 6.5 — L6 LIGHT UPDATE (post-system-build; 1–2 days)
  D-6.5.1 coachingService.ts:2807 read migration: poolDensity → differentiator
  D-6.5.2 coachingService.ts:4016 read migration: blindSpots → admissionsPositioning.redFlags (per F1 audit confirmed site)
  D-6.5.3 coachingService.ts revealedQualities → valuesRevealed migration (sites locating + replacing)
  D-6.5.4 coachingService.ts intellectualFingerprint → drop or read from writerPortrait migration
  D-6.5.5 L6 verification on fixture — coaching output quality preserved
```

The graph is the spine. Detail per-phase follows.

---

## §2 — Phase 0 — Types + Migrations + Telemetry (2–4 days, no LLM cost)

**Goal**: schema-level support for everything. Phase 0 → Phase 1 gate gates everything that follows.

The L5_IMPLEMENTATION_PLAN's Phase 0 (15 deliverables) carries forward verbatim. Integrated build adds 4 deliverables for the per-layer schemas:

### D-0.14 — StalenessEffect.findingIds[] extension (NEW)
- **Type**: Type extension.
- **File**: `src/services/essayIntelligence/profileTypes.ts:3966-3970` (StalenessEffect type).
- **Depends on**: none.
- **Blocks**: D-1.6 (priorAnnotations builder uses Finding linkage), D-4e.2 (focused_structural needs Finding-lineage tracking through reorders).
- **Contract**: Add `findingIds?: string[]` field to StalenessEffect. Per F2 R-12 + F1 audit + iteration design §2.3 gap. Allows orchestrator to know "this edit invalidates F7" via explicit linkage.
- **Validation**: type-check passes; existing StalenessEffect callers continue to work (field optional).
- **Effort**: 1 hour.

### D-0.15 — L3 redesign type scaffolding (NEW)
- **Type**: Type definitions.
- **File**: new `src/services/essayIntelligence/analysis/l3/types.ts`.
- **Depends on**: D-0.1, D-0.5.
- **Blocks**: all D-4a.x (L3 prompt deliverables).
- **Contract**: Define Sweep output schema (sentenceUnderstanding[], paragraph roles, connections, archetype + confidence, phaseEstimate, lensDispatch scores). Define 4 lens output schemas (one per Voice/Meaning/Story/Admissions, with the field set per L3-75/L3_ABSORBS_L3_75.md "Lens ownership of holistic-profile fields"). Define Pass 3 output schema (4 cross-dimension fields).
- **Validation**: types compile; downstream consumers (L3.5, L4) can reference these without changes (field shapes match what L3.75 emits today).
- **Revision discipline**: read L3-75/L3_ABSORBS_L3_75.md carefully; verify every field mentioned in the lens-emission spec lands in the type. Spawn an Explore agent to cross-reference today's profileTypes.ts L3.75 sub-types against the new lens schemas.
- **Effort**: 4–6 hours.

### D-0.16 — L3.5 extension type scaffolding (NEW)
- **Type**: Type extension.
- **File**: `src/services/essayIntelligence/analysis/analysisPass.ts` AnalysisPassOutput interface.
- **Depends on**: D-0.1.
- **Blocks**: D-4b.1, D-4b.2.
- **Contract**: Add to AnalysisPassOutput: `contradictionFlags: Array<{lens1, lens2, location, claim, evidence}>` per L3-5/PLAN.md schema. Add `essayStrengthSignatures: Array<{quality, evidence, paragraphs[]}>` (or place on a new `essayLevelAnalysis` field — pick during this deliverable based on cleanest fit).
- **Validation**: types compile; existing AnalysisPassOutput consumers handle empty arrays gracefully.
- **Effort**: 2 hours.

### D-0.17 — L4b extension type scaffolding (NEW)
- **Type**: Type extension.
- **File**: `src/services/essayIntelligence/analysis/crystallizer.ts` ImprovementManifestEntry interface.
- **Depends on**: D-0.1.
- **Blocks**: D-4c.1, D-4c.2.
- **Contract**: Add `pairedImprovement: { technique, directive, architecturalReason, demonstrationSketch, expectedImpact }` to ImprovementManifestEntry per L4/PLAN.md.
- **Validation**: types compile; existing manifest entries handle the new field.
- **Effort**: 1 hour.

(Other Phase 0 deliverables D-0.1 through D-0.13 inherited verbatim from L5_IMPLEMENTATION_PLAN.md §2.)

**Phase 0 totals**: ~20 deliverables. ~2–4 days. No LLM cost.

---

## §3 — Phase 1 — Dead-wire fix + Iteration Ledger (5–8 days)

Inherited verbatim from L5_IMPLEMENTATION_PLAN.md §3 with one modification:

### D-1.9 modification (per F1 R-12)

**Original L5-only**: "reanalysisOrchestrator.ts:1177 wire-up (parallel fix)".

**Integrated build**: F1 audit shows line 1177 is NOT a parallel dead wire — it passes a live `reanalysisBrief`. The deliverable becomes **integration verification**:

- **D-1.9 (revised)**: reanalysisOrchestrator.ts:1177 priorAnnotations integration verification.
- **Contract**: Wire the priorAnnotations builder into reanalysisOrchestrator's iter-2+ path. Verify the existing `reanalysisBrief` mechanism composes correctly with the new builder's Map. Mock-LLM test simulating reanalysis with priorAnnotations populated.
- **Effort**: 1–2 hours (less than the original D-1.9 which assumed a parallel dead wire).

**Phase 1 totals**: 18 deliverables (same count as L5-only). 5–8 days. ~$0.50–$1.00 LLM cost (D-1.5 calibration only).

---

## §4 — Phase 2 — SpecificsNeed Aggregator + Queue Extension (4–6 days)

Inherited from L5_IMPLEMENTATION_PLAN.md §4 with note:

D-2.4 (L3.75 holistic prompt extension) is **INTERIM**. Once Phase 4 sub-phase 4a executes the L3.75 absorption, D-2.4's L3.75-side emissions are replaced by D-4a.17 per-lens emission contributors. The integrated build executes Phase 2 first (fast prompt extensions on the live L3.75) to start accumulating SpecificsNeed entries, then absorbs in Phase 4.

**Phase 2 totals**: 14 deliverables. 4–6 days. ~$0.50–$1.00 LLM cost.

---

## §5 — Phase 3 — Conversator (8–12 days)

Inherited verbatim from L5_IMPLEMENTATION_PLAN.md §5. ~19 deliverables. 8–12 days. ~$1.50–$2.00 LLM cost.

---

## §6 — Phase 4 — The big phase (14–21 days)

Phase 4 is the largest and most architecturally consequential. Sub-phase ordering matters: 4a → 4b → 4c → 4d, with 4e parallelizable to 4d.

### Sub-phase 4a — L3 redesign + L3.75 absorption execution (8–12 days)

The core architectural pivot. Per L3-75/L3_ABSORBS_L3_75.md authoritative spec.

#### D-4a.1 — L3 Sweep prompt
- **Type**: Prompt deliverable (3+ rounds).
- **File**: `src/services/essayIntelligence/analysis/l3/sweepPrompt.ts`.
- **Depends on**: D-0.15.
- **Blocks**: D-4a.7 (lens dispatch logic reads sweep's lensDispatch scores).
- **Contract**: Sonnet single call. Output per Sweep schema (sentenceUnderstanding[], paragraph roles, connection graph, archetype + confidence, phaseEstimate, lensDispatch scores 1-5 per lens with rationale).
- **Cost target**: ~$0.10–$0.15 per essay.
- **Output cap**: ≤ 3K tokens (per L3/PLAN.md verification gate).
- **Discipline directives**: descriptive only; no judgment vocabulary; citation required (every claim cites paragraph/sentence).
- **Revision protocol**: 3+ rounds — contract pass, adversarial pass, comparison pass, additional rounds if quality not landing.
- **Effort**: 6–10 hours.

#### D-4a.2 — L3 Voice lens prompt
- **Type**: Prompt deliverable (3+ rounds).
- **File**: `src/services/essayIntelligence/analysis/l3/voiceLensPrompt.ts`.
- **Depends on**: D-0.15, D-4a.1.
- **Blocks**: D-4a.10 (deletion of holisticSynthesis can only land after lens-direct emission verified).
- **Contract**: Sonnet single call. Inputs: Sweep output + essay text + (optional) ExperienceProfile + (optional) research block. Outputs: voiceIdentity (signature + primaryRegister + evolution + authenticVsPerformed[] + voiceMarkers[] + voiceWeaknesses[] + registerShifts[]) + voiceMap (5-dimension structure: register, vocabularyFingerprint, sentenceRhythm, perspectiveDistance, tonalDisposition; stabilityRegions; shifts with intentionality) + craftAssessment.sentenceRhythmProse + craftAssessment.wordPatterns. **Lens emits these fields DIRECTLY into the holistic-profile schema — no synthesis transformation.**
- **Cost target**: ~$0.06–$0.10 per essay.
- **Output cap**: ≤ 4K tokens (per L3/PLAN.md verification gate).
- **Cap discipline**: voiceIdentity ~800 tokens; voiceMap ~1.5K; craft prose ~600; signals/markers ~500.
- **Discipline directives**: descriptive only; no `blindSpots[]` emission anywhere (Decision A: cut entirely).
- **Revision protocol**: 3+ rounds.
- **Risk mitigation**: per L3-75 risk #1 — if attention overruns at 3-4K output, splitting into spatial-only + narrative-distillation calls is the documented fallback (NOT a pre-emptive split; only if telemetry shows quality degradation post-launch).
- **Effort**: 8–12 hours (likely the biggest lens prompt due to multi-section emission).

#### D-4a.3 — L3 Meaning lens prompt
- **Type**: Prompt deliverable (3+ rounds).
- **File**: `src/services/essayIntelligence/analysis/l3/meaningLensPrompt.ts`.
- **Contract**: Sonnet single call. Outputs thematicArchitecture (centralThesis + thesisEvolution + threads[] + subtext + contradictions[]) + craftAssessment.imageSystem + meaningGaps[] + valueArchitecture.
- **Cost target**: ~$0.06–$0.10.
- **Output cap**: ≤ 4K tokens.
- **Effort**: 6–10 hours.

#### D-4a.4 — L3 Story lens prompt
- **Type**: Prompt deliverable (3+ rounds).
- **File**: `src/services/essayIntelligence/analysis/l3/storyLensPrompt.ts`.
- **Contract**: Sonnet single call. Outputs narrativeStrategy (primaryStrategy with rationale merged + pivotPoints[] + turningPoint + pacingAnalysis + structuralChoices[] + arcType) + craftAssessment.pacingShape + peakMoments + stakesLadder + emotionalTopography.peakMoments[] + emotionalProgression[].
- **Cost target**: ~$0.06–$0.10.
- **Output cap**: ≤ 4K tokens.
- **Effort**: 6–10 hours.

#### D-4a.5 — L3 Admissions lens prompt
- **Type**: Prompt deliverable (3+ rounds).
- **File**: `src/services/essayIntelligence/analysis/l3/admissionsLensPrompt.ts`.
- **Contract**: Sonnet single call. Outputs admissionsPositioning (tellabilitySummary + distinctivenessFactors[] + institutionalFit + redFlags[] each MUST carry fix + memorability + aoTakeaway + archetypeContext.archetype + differentiator) + characterSignals (values + qualities feeding Pass 3 writerPortrait).
- **Cost target**: ~$0.06–$0.10.
- **Output cap**: ≤ 4K tokens.
- **Effort**: 6–10 hours.

#### D-4a.6 — L3 Pass 3 prompt
- **Type**: Prompt deliverable (3+ rounds).
- **File**: `src/services/essayIntelligence/analysis/l3/pass3Prompt.ts`.
- **Depends on**: D-4a.2, D-4a.3, D-4a.4, D-4a.5.
- **Contract**: Sonnet single call. Inputs: all 4 lens outputs (or however many ran per dispatch) + Sweep + essay text. Outputs: 4 cross-dimension fields:
  1. `characterRevelation.writerPortrait` — lunch-with paragraph cross-pulling Voice + Meaning + Admissions.
  2. `entanglements[]` — locations where ≥2 lens observations converge meaningfully. Cap 3.
  3. `emotionalTopography.arcTrajectory` — prose binding Story arc + Voice tonal + Meaning stakes.
  4. `momentEarnednessMap.moments[].mechanisms[]` — backward-traces each peak moment.
  5. (Optional 5th) `connectionGraphSummary` — topology prose.
- **Cost target**: ~$0.08.
- **Output cap**: 3-4K tokens.
- **Hard rule**: descriptive only; no judgment vocabulary. Inheritance discipline: every Pass 3 field traces to named lens outputs in its inputs. If a field cannot be produced from lens inputs, that's a lens gap — fix the lens prompt.
- **Anti-drift commitment**: Pass 3 stays one call, four fields, no iteration. Forever. Documented in the prompt's RATIONALE.md.
- **Effort**: 6–10 hours.

#### D-4a.7 — Lens dispatch logic
- **Type**: Service.
- **File**: `src/services/essayIntelligence/analysis/l3/lensDispatcher.ts`.
- **Contract**: Reads Sweep's lensDispatch scores. Orchestrates parallel lens calls (2-4 lenses based on dispatch). Phase-gated cap of 4. If a lens scores below threshold, skip (this is a routing decision, not a fallback).
- **Validation**: mock-LLM tests with various dispatch score distributions.
- **Effort**: 4–6 hours.

#### D-4a.8 — Profile-write semantics
- **Type**: Service + spec.
- **File**: `src/services/essayIntelligence/profileManager/lensWriteSemantics.ts`.
- **Contract**: Defines how lens emissions write to profile fields atomically. Schema validation per emission. Conflict policy if two lenses claim to emit the same field (shouldn't happen given the lens ownership map, but if it does, throw with structured context).
- **Validation**: property tests asserting no two lenses overlap on writes.
- **Effort**: 4–6 hours.

#### D-4a.9 — L3.75 absorption contamination check (mid-build API touchpoint #4)
- **Type**: Targeted API validation.
- **Cost budget**: $1.00–$1.50.
- **Contract**: Run new L3 (Sweep + 4 lenses + Pass 3) end-to-end on fixture 05. Compare lens emissions against today's L3.75 outputs for the same fixture (using existing fixtures at tests/output/checkpoint3/). Verify:
  - Each lens emits the field set per its ownership row in L3-75/L3_ABSORBS_L3_75.md.
  - Lens emissions are descriptive (no judgment vocabulary).
  - Pass 3 emits exactly 4 fields, no more.
  - Total L3 cost ≤ $0.40 per essay (vs current ~$0.50–0.70 L3 + L3.75 combined).
- **Failure surface**: if any lens emits a forbidden field or misses a required field, return to relevant lens-prompt deliverable (round 4+).
- **Effort**: 4–6 hours including fixture comparison.

#### D-4a.10 — holisticSynthesis.ts deletion
- **Type**: Code deletion.
- **File**: `src/services/essayIntelligence/analysis/holisticSynthesis.ts` (~3,650 lines).
- **Depends on**: D-4a.9 (verification before deletion).
- **Contract**: Delete entire file. Update imports across the codebase.
- **Rollback**: tagged commit before deletion per L3-75/L3_ABSORBS_L3_75.md decision #14.
- **Effort**: 1–2 hours (mechanical).

#### D-4a.11 — analysisOrchestrator L3.75 phase deletion
- **File**: `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` lines 520-567 (Phase 3 L3.75 growth cycle).
- **Effort**: 2–3 hours.

#### D-4a.12 — holisticMutator.ts deletion
- **File**: `src/services/essayIntelligence/profileManager/mutators/holisticMutator.ts` (~150 lines if exists; verify file path).
- **Effort**: 1–2 hours.

#### D-4a.13 — corpusTelemetryPersistence L3.75 cleanup
- **File**: `src/services/essayIntelligence/analysis/corpusTelemetryPersistence.ts`.
- **Contract**: Remove L3.75-specific telemetry calls; replace convergence telemetry (Phase A2) with L3-Pass-3 single-call cost telemetry.
- **Effort**: 2–3 hours.

#### D-4a.14 — Consumer migrations (~6 sites)
- **Files**: 
  - `analysisPass.ts:942` — drop `thesisConfidence` read.
  - `analysisPass.ts:957` + `deepAnnotationService.ts:1119` — `craftAssessment.sentencePatterns` rename to distributed lens-owned prose fields (sentenceRhythmProse, wordPatterns).
  - `deepAnnotationService.ts:1129` — read `aoTakeaway` instead of `portfolioPosition`.
  - `coachingService.ts:2807` — read `archetypeContext.differentiator` instead of `poolDensity`.
  - `readinessScoring.ts:74,153` — replace `thesisConfidence` gate with `centralThesis presence + threads.length >= 3`.
  - `diffEngine.ts:115` — replace `thesisConfidence` delta with `centralThesis` string-diff + `primaryStrategy` string-diff.
- **Validation**: existing consumers don't break; mock-LLM integration tests pass.
- **Effort**: 4–6 hours all sites.

#### D-4a.15 — EssayPortrait UI render-from-fields
- **File**: `src/components/EssayPortrait.tsx` or wherever the portrait component lives.
- **Contract**: Render portrait composing voiceIdentity.signature + thematicArchitecture.centralThesis + writerPortrait (Pass 3) + tellabilitySummary (Admissions lens) + narrativeStrategy.primaryStrategy. Replace any UnderstandingProse-driven render path with field composition.
- **Effort**: 3–5 hours.

#### D-4a.16 — Lens-targeted re-run mechanism
- **File**: `src/services/essayIntelligence/analysis/l3/lensTargetedRerun.ts`.
- **Contract**: Replaces L3.75 targeted-refresh per F2 R-2. Per-lens invalidation flags + selective lens re-runs + optional Pass 3 re-run. Section-level mask alternative is REMOVED per absorption decision.
- **Validation**: integration test simulating various edit scopes (voice-only edit → Voice lens re-runs only; thematic edit → Meaning lens re-runs; reorder → multiple lenses + Pass 3).
- **Effort**: 6–10 hours.

#### D-4a.17 — SpecificsNeed contributor migration (post-absorption)
- **File**: per-lens prompt extensions (extends D-4a.2, D-4a.3, D-4a.4, D-4a.5, D-4a.6).
- **Contract**: Each lens prompt extended with specifics-need emission instruction per F2 R-7 contributor table. Voice lens: emit on voiceIdentity.authenticVsPerformed[] flagged "performed". Meaning lens: emit on meaningGaps[]. Story lens: emit on emotionalTopography contributors. Admissions lens: emit on admissionsPositioning.redFlags[]. Pass 3: emit on momentEarnednessMap.moments[].gaps[].
- **Validation**: integration test verifying specifics-need entries flow through aggregator with correct lens-of-origin attribution.
- **Effort**: 4–6 hours (prompt extensions per lens).

**Sub-phase 4a totals**: 17 deliverables. 8–12 days. ~$1.00–$1.50 LLM cost (touchpoint #4).

### Sub-phase 4b — L3.5 extension (3–5 days)

#### D-4b.1 — L3.5 contradictionFlags emission
- **Type**: Prompt deliverable (3+ rounds).
- **File**: `src/services/essayIntelligence/analysis/analysisPass.ts` prompt body.
- **Depends on**: D-0.16, D-4a.9.
- **Contract**: Extend L3.5 prompt: "emit a flag ONLY when ≥2 lenses make claims at the same location that cannot both be true. Do not flag complementary observations." Calibration target 5–30%.
- **Effort**: 4–6 hours.

#### D-4b.2 — L3.5 essayStrengthSignatures emission
- **Type**: Prompt deliverable (3+ rounds).
- **Contract**: Extend L3.5 prompt: "emit 5–8 essay-level strength signatures. Each must name a DISTINCT craft technique with NEW evidence." Cap 5–8.
- **Effort**: 4–6 hours.

#### D-4b.3 — L3.5 mode-selection rule update (Audit F2 fix)
- **File**: `analysisPass.ts` mode-selection logic.
- **Contract**: Per Audit Finding F2: foundation phase → essay_level (1 call). Architecture phase → per_paragraph (7+ calls). Craft + Polish + Distinction → per_paragraph.
- **Effort**: 2–3 hours.

#### D-4b.4 — L3.5 cut-field read removals
- **File**: `analysisPass.ts:942` + `:957`.
- **Contract**: Drop reads of cut fields per absorption.
- **Effort**: 1 hour.

#### D-4b.5 — L3.5 contradictionFlags integration test
- **Contract**: Empirical calibration check on fixture mix; verify 5–30% emission rate.
- **Effort**: 2–3 hours.

**Sub-phase 4b totals**: 5 deliverables. 3–5 days. No LLM cost (calibration check uses fixture LLM outputs from prior runs).

### Sub-phase 4c — L4 absorption + Audit F1 fix (3–5 days)

Per L4/PLAN.md.

#### D-4c.1 — L4b prompt extension
- **Type**: Prompt deliverable (3+ rounds).
- **File**: L4 crystallizer.ts L4b prompt.
- **Depends on**: D-0.17.
- **Contract**: Extend L4b prompt with TECHNIQUE_VOCABULARY block; "for every priority entry, generate the pairedImprovement payload (technique + directive + architecturalReason + demonstrationSketch + expectedImpact)." Output cap raised by ~2-3K tokens.
- **Effort**: 6–10 hours.

#### D-4c.2 — ImprovementManifestEntry schema migration
- **Effort**: 2 hours.

#### D-4c.3 — L4b output cap verification
- **Effort**: 1 hour.

#### D-4c.4 — NorthStar prompt cut-field migrations
- **Effort**: 3–5 hours.

#### D-4c.5 — ScoreMatrix prompt cut-field migrations
- **Effort**: 2–3 hours.

#### D-4c.6 — L4 context compression (Audit F1 fix)
- **File**: `src/services/essayIntelligence/contextBuilder.ts` (ProfileRouter.assembleL4Crystallization). 
- **Contract**: Replace `holisticFull` (full 10 sections content) with `holisticSummaries` (headline from each section). Each holistic section already HAS a summary field — voiceIdentity.signature, thematicArchitecture.centralThesis, etc.
- **Validation**: input tokens drop from ~120K to ~5-8K on fixture.
- **Effort**: 4–6 hours.

#### D-4c.7 — L4 context compression integration test
- **Effort**: 2 hours.

#### D-4c.8 — L5 read of pairedImprovement migration
- **File**: deepAnnotationService.ts wherever pairedImprovement is read (currently from L3.75 candidateStore path).
- **Contract**: Migrate L5 reads to L4b ImprovementManifestEntry path.
- **Effort**: 2–3 hours.

**Sub-phase 4c totals**: 8 deliverables. 3–5 days. No LLM cost.

### Sub-phase 4d — L5 surface composer + Tier 2 + capability gap closure (5–8 days)

Inherits L5_IMPLEMENTATION_PLAN.md Phase 4 deliverables (D-4.1 through D-4.13 of the L5-only plan) with R-1 (Q1 redirection) consideration:

**Note on D-4.11 of L5-only plan ("Budget redirection mechanism, 20% fraction, deeper-treatment allocator")**: pending Tue's TQ-1 adjudication of R-1.
- **If Resolution A** (retire the mechanism): D-4.11 is deleted. Replaced by D-4d.16 (cost trajectory test) which verifies the existing escalation ladder produces the iteration loop design's predicted cost trajectory without redirection.
- **If Resolution B** (20% holds): D-4.11 stays as in L5-only plan.

Otherwise, the deliverables track the L5-only plan with renumbering (D-4d.1 through D-4d.17).

**Sub-phase 4d totals**: ~17 deliverables. 5–8 days. ~$0.50–$1.00 LLM cost (D-4d.3 Tier 2 non-repetition smoke = touchpoint #5).

### Sub-phase 4e — focused_structural mode + corpus retrieval expansion (4–6 days)

#### D-4e.1 — selectAnalysisMode rule update
- **File**: `focusedAnalyzer.ts:705-783`.
- **Contract**: Add 3rd mode `focused_structural` per F2 R-4. Rules:
  - Rule 3 (current: structural change → comprehensive): split into "structural change WITHOUT alongside transformative content edits → focused_structural" and "structural change WITH transformative rewrites → comprehensive".
  - Rule 4 (sentence count change → comprehensive): unchanged.
- **Effort**: 3–4 hours.

#### D-4e.2 — focused_structural procedure
- **File**: `focusedAnalyzer.ts` new procedure.
- **Contract**: Per L5_ITERATION_LOOP_DESIGN §4.4b. Re-derive structural reads (L2 cartography, narrativeStrategy + thematicArchitecture + momentEarnedness contributors via Story+Meaning lens, northStar.throughLineMap + structuralRolesMap, scoreMatrix.crossParagraphPatterns, coachingMap, cross-paragraph L5). Carry voice/character/craft/L1/unchanged-paragraph reads with index re-keying via editUnderstandingService.diff.paragraphChanges[]. Cost target ~$0.40-0.50.
- **Effort**: 8–12 hours.

#### D-4e.3 — RE_ANALYSIS_LIFECYCLE_DESIGN.md doc revision
- **Contract**: Apply F2 R-2 (absorption supersession) + R-4 (focused_structural integration) to the doc. New 3-mode decision tree. Per-lens invalidation rules replace per-section L3.75 rules.
- **Effort**: 4–6 hours.

#### D-4e.4 through D-4e.12 — Corpus retrieval expansion (8 missing types)
- **File**: `corpusRetrievalBlocks.ts` + per-corpus-asset wiring.
- **Contract per type**: Wire retrieval glue (Haiku) for the asset; integrate into L3.5 + L5 prompt blocks per L5_FEEDBACK_REDESIGN.md §2 + §5; verify telemetry.
- **Per-type effort**: 2–4 hours each.
- **Total effort**: 24–36 hours across 8 types.

**Sub-phase 4e totals**: 12 deliverables. 4–6 days. No additional LLM cost (uses Phase 4 touchpoints).

### Sub-phase 4f — Phase 4 audit + cost check

#### D-4f.1 — Phase 4 cross-phase integrity audit
- **Contract**: Re-read every governing doc that gates Phase 5; verify Phase 4 honored every contract. Walk dependency graph; check every Phase 4 → Phase 5 edge has a corresponding deliverable in place.
- **Effort**: 4–6 hours.

#### D-4f.2 — Phase 4 cumulative cost-ledger check
- **Cumulative target**: ≤$5 for Option A ($10 cap) or ≤$8 for Option B ($25 cap) at end of Phase 4.
- **Effort**: 30 minutes.

**Phase 4 totals (all sub-phases)**: ~62 deliverables. 14–21 days. ~$1.50–$2.50 LLM cost (touchpoints #4 + #5).

---

## §7 — Phase 5 — UI Surfaces (5–8 days, frontend)

Inherited verbatim from L5_IMPLEMENTATION_PLAN.md §7. 16 deliverables. 5–8 days. No LLM cost.

---

## §8 — Phase 6 — Single E2E Validation Run (3–7 days)

Inherited from L5_IMPLEMENTATION_PLAN.md §8 with one extension: D-6.9, D-6.10 add a third E2E iteration testing the new `focused_structural` mode after a reorder edit.

**Phase 6 totals**: 14 deliverables (vs 12 in L5-only plan). 3–7 days. ~$3.50 LLM cost ($1.30 E2E iter-1 + $0.30 iter-2 + $0.40 iter-3 focused_structural + $1.50–$2.50 fix-cycle re-runs).

---

## §9 — Phase 6.5 — L6 Light Update (post-system-build, 1–2 days)

5 deliverables per L6/PLAN.md. 1–2 days. No LLM cost.

---

## §10 — API cost cap allocation (pending TQ-2 selection)

### Option A: $10 cap (L5-only baseline, tightened)

| Bucket | Amount | Purpose |
|---|---|---|
| Phase 1 — landing detector calibration | $0.50–$1.00 | Touchpoint #1 |
| Phase 2 — specifics-need emission sanity | $0.50–$1.00 | Touchpoint #2 |
| Phase 3 — Conversator dig + extractor sanity | $1.50–$2.00 | Touchpoint #3 |
| Phase 4 — L3.75 absorption contamination | $1.00–$1.50 | Touchpoint #4 |
| Phase 4 — Tier 2 non-repetition smoke | $0.50–$1.00 | Touchpoint #5 |
| Final E2E (3 iterations) + fix-cycles | $3.50 | Phase 6 |
| Slack | $0.50–$1.50 | Buffer |
| **Total** | **$10** | Hard halt at $9 |

**Tight against the $10 cap.** Tue may need to defer the Phase 4 corpus retrieval expansion verification (no API cost on the deliverables themselves; verification at Phase 6 E2E).

### Option B: $25 cap (recommended for integrated build)

| Bucket | Amount | Purpose |
|---|---|---|
| Phase 1 — landing detector calibration | $1.00 | Touchpoint #1 |
| Phase 2 — specifics-need emission sanity | $1.00 | Touchpoint #2 |
| Phase 3 — Conversator dig + extractor sanity | $2.00 | Touchpoint #3 |
| Phase 4a — L3.75 absorption contamination | $2.00 | Touchpoint #4 (more headroom for lens-by-lens verification) |
| Phase 4d — Tier 2 non-repetition smoke | $1.00 | Touchpoint #5 |
| Phase 4e — focused_structural mode validation | $1.00 | NEW touchpoint #6 (verify mode produces correct carry-forward on a reorder fixture) |
| Phase 4e — corpus retrieval expansion smoke | $1.00 | NEW touchpoint #7 (verify 8 new corpus types retrieve correctly) |
| Phase 4 — L3.5 contradictionFlags calibration | $1.00 | NEW touchpoint #8 (empirical calibration of 5–30% emission rate) |
| Phase 4 — L4 context compression verification | $0.50 | NEW touchpoint #9 (verify 120K → 5-8K reduction holds) |
| Final E2E (3 iterations including focused_structural) + fix-cycles | $4.50 | Phase 6 (more iterations than L5-only's 2) |
| Slack | $10.00 | Buffer for unforeseen mid-build escalations |
| **Total** | **$25** | Hard halt at $24, warn at $20 |

**Recommended.** Per F4 §11 TQ-2.

---

## §11 — Cross-cutting concerns

### Branch
`feat/integrated-pipeline-build` (replaces L5-only's `feat/l5-redesign-build`). Branched from `feat/wave-3a-phase-3b-3c` at build start.

### Testing strategy
- Mock-LLM-based integration tests (D-0.11) cover every iteration scenario.
- Failure-injection tests cover every error boundary (D-1.16, D-3.17, etc.).
- Property tests for invariants (TaughtMove ID stability D-1.13, IterationLedger append-only D-1.14, Aggregator dedup D-2.11).
- Cross-phase integrity audits at every phase boundary.
- Single E2E validation run at Phase 6 — the integrated test of the entire system.

### Halt-on-failure policy
If the E2E run fails mid-pipeline at a step, the pipeline halts at that step. Diagnose at source, fix at source, re-run from the broken step using persisted upstream outputs (not from step 1). No retries that swallow errors.

### Continuous test-running
After every code change: `npx tsc --noEmit` + relevant test files. Failures surface immediately; nothing accumulates.

### Agent dispatch licensing
Per the standing charter, spawn agents wherever a deliverable benefits. Specifically named in the L5-only plan §12.7 + extended for integrated build: parallel Explore agents for the Phase 0 EssayProfile consumer trace; security-architect agents for the new tables' RLS policies; database-best-practices agents for the migration SQL; Plan agents for thorny lens-prompt design decisions; code-review-style agents for no-fallback enforcement.

### Continuous revision
Three rounds per prompt is the *minimum*, not the maximum. The deliverable is done when it is *right*, not when it has been "shipped."

### Tue review at the system level
Not at every prompt during build. Mid-build escalations to Tue are rare (TQ-1 adjudication aside). Tue's full review is at Phase 6 after the final E2E run.

---

## §12 — Boundary of authority during build

### Implementer changes unilaterally:
- Prompt prose (within the three-round-or-more revision protocol).
- Code structure (file organization, function boundaries, naming) within the deliverable contract.
- Test approach within the contract.
- Mock-LLM fixture choice for a given test.
- Agent dispatch decisions.
- Implementation-detail decisions inside a deliverable.
- Order of work within a phase (as long as dependency-graph order is honored).

### Requires Tue:
- Architectural deviations from the design.
- Contract changes (any deliverable's "Contract" section requires updating this plan + escalating).
- Anything that touches the experience target's eight non-negotiables.
- Anything that would shift cost > $0.50 in any single deliverable beyond the allocated budget.
- Changes to the four locked user-decisions (R-1 already pending; Q4, Q-A, Q-B stable).
- Cuts to deliverables.
- Adding deliverables not in the plan.

---

## §13 — Phase totals summary

| Phase | Deliverables | Days | LLM cost (Option B) |
|---|---|---|---|
| Phase 0 | ~20 | 2–4 | $0 |
| Phase 1 | 18 | 5–8 | ~$1.00 |
| Phase 2 | 14 | 4–6 | ~$1.00 |
| Phase 3 | 19 | 8–12 | ~$2.00 |
| Phase 4 (4a–4f) | ~62 | 14–21 | ~$8.50 (5 touchpoints) |
| Phase 5 | 16 | 5–8 | $0 |
| Phase 6 | 14 | 3–7 | ~$4.50 |
| Phase 6.5 | 5 | 1–2 | $0 |
| **Total** | **~168** | **42–68** | **~$17 + $8 slack = $25 cap** |

(Slight discrepancy with §1 spine count of ~150 reflects Phase 4 sub-phase enumeration here; per-phase totals above are consistent.)

---

## §14 — Build-phase entry conditions

Before the build chat opens against this plan, the following must be in place:

1. **F0–F4 + this F5 deliverable land** (already written or in progress).
2. **F6 INTEGRATED_BUILD_HANDOFF_PROMPT.md** lands.
3. **F7 CONSOLIDATION_FINAL_REVIEW.md** captures Tue's TQ-1 (Q1 redirection adjudication), TQ-2 (cost cap selection), TQ-3 (branch name), TQ-4 (Q4/Q-A/Q-B reaffirmation).
4. **Tue signs off** on the foundation per F7.
5. **The build chat opens** against `INTEGRATED_BUILD_HANDOFF_PROMPT.md` with full reading order per F4 §13.

---

> **End of integrated build sequence.** The build chat's first deliverable is D-0.1 (IterationLedger types). The build chat's last deliverable before Tue review is D-6.13 (Tue review at the system level). After Tue review, fix-cycles + Phase 6.5 close out the build.
