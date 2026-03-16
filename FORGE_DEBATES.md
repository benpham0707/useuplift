# Forge Debates: Conversator Intelligence System
**Date**: 2026-03-15 | **Pipeline**: Analyst -> Agent A (Incremental) + Agent B (Architectural) -> Adversary -> Synthesizer

---

## Synthesis Decisions Summary

| Objective | Choice | Rationale |
|-----------|--------|-----------|
| OBJ-1: Declared Data Storage | `hybrid` | A's on-profile storage + B's `studentCertainty` + `LocationScope` |
| OBJ-2: Intent-Effect Gaps | `architectural_modified` | B's Finding-based approach + pipeline insertion fix |
| OBJ-3: Intelligence Questions | `architectural_modified` | B's `targetAudience` on UnderstandingQuestion + resolution wiring |
| OBJ-4: Data Extraction | `architectural_modified` | B's Stage 4 extension + Haiku extraction for correction/preference |
| OBJ-5: Declared Data Routing | `hybrid` | B's adaptive overlay + A's direct `buildParagraphPrompt()` injection |

---

## OBJ-1: Student Declared Data Storage

### Agent A (Incremental): On-Profile `StudentDeclaredData`
- Add `studentDeclaredData: DeclaredDataEntry[]` as top-level field on `EssayProfile`
- `DeclaredDataEntry` with 4 categories, paragraph/sentence scope, supersession chain
- New `DeclaredDataMutator` following existing mutator pattern

**Strengths**: Natural fit with existing architecture. Every consumer already has EssayProfile. Supersession model mirrors existing patterns. Coordinator dispatch is proven.

**Weaknesses (Adversary)**: A#2 -- no precedence rules between ConversationInsight and DeclaredDataEntry. A#3 -- collision with existing `inferredIntents` at same location. A#6 -- missing downstream updates (createEmptyProfile, snapshots, DB serialization).

### Agent B (Architectural): External Shadow Profile Overlay
- `DeclaredOverlay` as separate data structure alongside (not on) EssayProfile
- `overlayDeclaredData()` merges transparently in router's `assembleContext()`
- `studentCertainty` (definite/tentative/exploring) and `LocationScope` with `essayWide` support

**Strengths**: Clean separation of concerns. `studentCertainty` is more expressive than boolean. `LocationScope` handles essay-wide declarations elegantly.

**Weaknesses (Adversary)**: B#1 -- `assembleContext()` uses strict switch + never check, no single exit point for overlay injection. B#3 -- no staleness integration. B#4 -- router can't access overlay (not on EssayProfile, not in method signature). This is the FATAL flaw -- every consumer would need signature changes.

### Decision: `hybrid`
A's on-profile storage is correct because consumers already receive EssayProfile. B's external overlay creates an access problem that requires cascading signature changes across the entire system. However, B's `studentCertainty` and `LocationScope` types are superior to A's simpler scope model. The hybrid takes A's storage location and B's type expressiveness.

**Key resolution for A#2**: ConversationInsight = event audit trail ("student said X at time T"). DeclaredDataEntry = queryable content ("intent for P2S3 is triumph"). No precedence conflict -- they serve different purposes linked by `sourceInsightId`.

---

## OBJ-2: Intent-Effect Gap Analysis

### Agent A (Incremental): `intentEffectGap` on SentenceAnalysis
- Add optional `IntentEffectGap` field to `SentenceAnalysis`
- Inject declared intents into `buildAnalysisPrompt()` (which doesn't exist -- real function is `buildParagraphPrompt()`)
- `gapType` 4-bucket enum: missing, partial, misaligned, contradictory

**Strengths**: Collocated with analysis data. Direct visibility in sentence-level output.

**Weaknesses (Adversary)**: A#1 -- references non-existent function. A#4 -- missing file changes for validateAndTransform and SentenceMutator. A#6 -- `buildParagraphPrompt()` receives ParagraphProfile, not full profile or declared data (signature must change). A degrades_quality #2 -- 4-bucket gapType enum violates LLM-first design (no closed taxonomies for contextual judgment).

### Agent B (Architectural): Intent-Effect Gap as Finding
- New `IntentGapDetector` service post-L3.5
- Gaps become Findings with `source: 'intent_gap'`, `coachingValue: 'critical'`
- Reuses full finding maturity/coaching/supersession machinery

**Strengths**: Zero new data structures -- reuses Finding lifecycle. Gaps automatically participate in coaching context (finding context builder). Maturity progression lets gaps be confirmed/deepened/superseded naturally.

**Weaknesses (Adversary)**: B#3 -- pipeline insertion point unspecified (resolved: between Phase 4 and Phase 5 in analysisOrchestrator.ts).

### Decision: `architectural_modified`
B's Finding-based approach is architecturally superior. Adding `intentEffectGap` to SentenceAnalysis duplicates finding-like behavior (maturity, coaching value, supersession) as a one-off field. The Finding lifecycle already handles all of this. The only modification needed is specifying the exact pipeline insertion point (after L3.5, before L4).

**Key insight**: The 4-bucket gapType enum is a classic LLM-first violation. The LLM should describe gaps in prose -- "the cold metal railing imagery works against the intended triumph" -- not classify them into predetermined buckets.

---

## OBJ-3: Intelligence-Gathering Conversation Modes

### Agent A (Incremental): Stage 0 Pre-Flight + Deterministic Scanning
- Stage 0 before Stage 1: `identifyQuestionTriggers()` scans for question opportunities
- `generateProactiveQuestion()` via Haiku
- New `ConversatorQuestion` type
- Max 1 question per turn appended to response

**Strengths**: Simple pipeline addition. Clear trigger logic.

**Weaknesses (Adversary)**: A#3 -- questions appended post-response (not integrated into coaching flow). A degrades_quality #1 -- deterministic threshold scanning violates LLM-first design. A degrades_quality #4 -- Stage 0 runs BEFORE Stage 1 = context-deaf question generation (the system doesn't yet know what the student is talking about when it generates questions).

### Agent B (Architectural): Extend UnderstandingQuestion + Walk/Synthesis Classification
- Add `targetAudience: 'system' | 'student'` to existing `UnderstandingQuestion`
- Walk and synthesis classify questions by audience during existing generation
- Stage 3 receives top 3 student-facing questions; LLM decides mode

**Strengths**: Reuses existing question queue infrastructure (priority, iteration survival, resolution, parent-child chains). Questions emerge from deep analysis, not pattern matching. LLM naturally integrates questions into coaching responses.

**Weaknesses (Adversary)**: B#5 -- no resolution path for student-answered questions (coaching service doesn't reference QuestionQueueManager). Top 3 is too many -- should be 1.

### Decision: `architectural_modified`
B's approach wins decisively. Questions should come from deep analysis (walk/synthesis), not pre-flight scanning. The existing `UnderstandingQuestion` + `QuestionQueueManager` infrastructure is exactly the right place. Modifications: (1) inject only 1 question (not 3), (2) add `QuestionQueueManager` parameter to `processCoachingTurn`, (3) Stage 4 resolves questions when student answers.

**Key insight**: A's Stage 0 is context-deaf by construction. It generates questions BEFORE the system even classifies the student's message. B's approach generates questions during the analysis that discovered the ambiguity -- inherently context-rich.

---

## OBJ-4: Data Extraction Pipeline

### Agent A (Incremental): Separate Stage 4.5 Haiku Call
- New pipeline stage after Stage 4
- Multi-intent splitting by LLM
- Only for reinterpretation/new_context/correction/preference categories
- Missing DeclaredDataMutator file and interface wiring

**Strengths**: Clear separation of extraction from evaluation. Haiku is cheap.

**Weaknesses (Adversary)**: A#5 -- missing DeclaredDataMutator file and interface wiring (resolved by OBJ-1). Separate Haiku call is wasteful when Sonnet already has full context.

### Agent B (Architectural): Extend Stage 4 Structured Output
- Add `declaredEntries[]` to existing Stage 4 Sonnet output schema
- No separate parsing stage
- Multi-intent by Sonnet (same call)

**Strengths**: Zero marginal cost (same Sonnet call). Higher quality extraction (Sonnet > Haiku). Single call = single context window = better coherence.

**Weaknesses (Adversary)**: B#3 -- correction/preference/clarification categories NEVER trigger Stage 4's Sonnet evaluation. These categories go through simpler paths that skip Stage 4 entirely.

### Decision: `architectural_modified`
B's in-Stage-4 extraction is correct for categories that already trigger Sonnet (reinterpretation, new_context). For correction and preference (which bypass Sonnet), add a lightweight Haiku extraction call. Clarification doesn't produce declared data (it's a query, not a statement). Emotional_reaction and resistance are meta-signals, not data declarations.

**Cost breakdown**: Reinterpretation/new_context = $0 marginal (same Sonnet). Correction/preference = ~$0.001 Haiku extraction. Total: ~$0.001 per coaching turn with declared data extraction.

---

## OBJ-5: Declared Data Routing

### Agent A (Incremental): Per-Rule Modifications
- Modify 6 routing rules individually
- `getDeclaredDataForParagraph()` and `getDeclaredDataForSentence()` helpers
- +500 token budgets per modified rule

**Strengths**: Explicit per-rule control. Helpers are useful regardless.

**Weaknesses (Adversary)**: A degrades_quality #1 -- only 6 of 16 rules modified (missing focused_analysis, reanalysis_comprehensive, deep_dive, full_context_reread, and 6 others). A degrades_quality #2 -- location-only helpers miss connection-propagated declared data. Fragile, incomplete, violates DRY.

### Agent B (Architectural): Single Exit-Point Overlay Injection
- `overlayDeclaredData()` in `assembleContext()` after rule dispatch
- Zero per-rule changes
- Single injection point covers all 16 rules

**Strengths**: DRY. Complete (all 16 rules). Single point of maintenance. Consistent behavior.

**Weaknesses (Adversary)**: B#1 -- injection timing vs token budget enforcement unclear. B#3 -- analysis pass builds paragraph prompt SEPARATELY from assembled context (overlay injection into assembled context doesn't reach `buildParagraphPrompt()`). B#5 -- overlay access problem (moot since declared data is on EssayProfile per OBJ-1 decision).

### Decision: `hybrid`
B's overlay for general context routing (coaching, deep dive, crystallization, etc.) + A's concept of direct `buildParagraphPrompt()` injection for analysis (already implemented in Step 2a). The overlay covers all 16 rules transparently. The direct injection handles the one case (analysis pass) where the overlay can't reach.

**Key insight**: B#3 is real and important. The analysis pass builds paragraph prompts with data it extracts directly from ParagraphProfile -- it doesn't consume the overlay's assembled context. So declared data needs BOTH paths: overlay for general consumption AND direct injection for analysis prompts.

---

## Cross-Cutting Adversary Findings

### Code Verification Results (confirmed by source reading)

1. **`buildAnalysisPrompt()` does NOT exist** (A#1). The real function is `buildParagraphPrompt()` in `analysisPass.ts:756`. Signature: `(para: Readonly<ParagraphProfile>, paragraphCount: number, staleAreaHints?: string[], findingContext?: string, anchorConfig?: {...})`. Does NOT receive EssayProfile or declared data.

2. **`assembleContext()` switch is exhaustive** with `never` check (B#1). The 16-rule switch at line 533-586 of `profileRouter.ts` has `default: { const _exhaustive: never = request.rule; throw new Error(...) }`. No single exit point for overlay injection BEFORE the switch -- but overlay application happens AFTER the switch (lines 588-601), which is the correct injection point.

3. **`computeAdaptiveOverlay()` already receives `profile`** (B#5 partially moot). It receives `profile: Readonly<EssayProfile>` and `request: ContextRequest`. If declared data is on EssayProfile (OBJ-1 decision), the overlay function already has access.

4. **Stage 4 runs conditionally** (B#3 for OBJ-4). Only `reinterpretation` and `new_context` categories trigger the full Sonnet evaluation. `correction`, `preference`, `confirmation`, `clarification`, `emotional_reaction`, `resistance` take simpler paths through InsightMutator.

5. **UnderstandingQuestion already has `source` field** with union type `'walk' | 'synthesis' | 'deep_dive' | 'coaching' | 'maturity_gap'`. Adding `targetAudience` is a clean extension.

6. **QuestionQueueManager is instantiated in analysisOrchestrator** but NOT passed to CoachingService. The coaching service has no access to the question queue currently. Step 3f adds this wiring.

### LLM-First Design Violations Flagged and Resolved

- **A's 4-bucket gapType enum** (OBJ-2): Closed taxonomy for contextual judgment. Resolved by using Finding prose descriptions.
- **A's deterministic question scanning** (OBJ-3): Pattern matching replaces LLM judgment. Resolved by using walk/synthesis question generation.
- **A's Stage 0 context-deaf generation** (OBJ-3): Questions generated before understanding the student's message. Resolved by using analysis-sourced questions.

---

## Debate Outcome Statistics

| Metric | Value |
|--------|-------|
| Total adversary findings | 24 (breaks_plan) + 7 (degrades_quality) |
| Findings addressed in plan | 24/24 breaks_plan, 7/7 degrades_quality |
| Agent A wins (unmodified) | 0/5 |
| Agent B wins (unmodified) | 0/5 |
| Agent A modified | 0/5 |
| Agent B modified | 3/5 (OBJ-2, OBJ-3, OBJ-4) |
| Hybrid | 2/5 (OBJ-1, OBJ-5) |
| Novel | 0/5 |

**Pattern**: Agent B's architectural instincts were consistently better (reuse existing systems, single injection points, LLM-first design), but every proposal had at least one critical gap that required adversary-driven modifications. Agent A's incremental approach was correct only for on-profile storage (OBJ-1) and direct prompt injection (OBJ-5 partial).

---

## Cycle 4: Synthesizer Final Decisions (v2 Forge Pipeline)

**Date**: 2026-03-15
**Pipeline**: v2 Analyst -> Agent A (Incremental) + Agent B (Architectural) -> Adversary -> Synthesizer
**Scope**: 7 objectives covering pre-analysis gathering (OBJ-6 CREATE), pipeline enrichment (OBJ-1-5 ELEVATE), and injection protocol (OBJ-7 ELEVATE)

### Compressed Evolution

The v2 pipeline tackled a fundamentally harder problem than Cycle 1-3: creating a NEW capability (pre-analysis student context gathering) rather than extending existing ones. This exposed a critical limitation in both proposals -- neither agent recognized that the system's existing infrastructure (deep dives, question queue, coaching service) was designed for a *post-analysis* world and couldn't be repurposed for *pre-analysis* gathering without breaking.

**Cycle 1-3** (Declared Data + Coaching Intelligence): Established the foundational decisions -- on-profile storage, Finding-based intent-effect gaps, question queue extension for student-facing questions, Stage 4 extraction, adaptive overlay routing.

**Cycle 4** (Gathering + Pipeline Enrichment): Built ON the Cycle 1-3 foundation but pivoted the framing. Instead of declared data flowing FROM coaching TO the profile (reactive), this cycle asks: can we gather context BEFORE analysis (proactive)? The answer required rejecting both proposals' core infrastructure choices for OBJ-6 and building a novel standalone service.

### Decision Summary (Cycle 4)

| Objective | Choice | Winning Source | Key Reason |
|-----------|--------|---------------|------------|
| OBJ-6: Gathering Service | `novel` | Neither | Both proposals reuse infrastructure that requires populated profile (breaks at gathering time) |
| OBJ-1: PipelineInput Extension | `incremental` | A (trivially) | Data plumbing -- add optional field to existing interface |
| OBJ-2: L3 Walk Enrichment | `incremental_modified` | A + Adversary fix | A's injection approach + Adversary's position fix (after essay text, before accumulated context) |
| OBJ-3: L3.75 Synthesis Enrichment | `incremental_modified` | A + V1 findings | User prompt injection (not system prompt) to preserve caching. Voice claims stay in L3.5. |
| OBJ-4: L3.5 Analysis Enrichment | `incremental_modified` | A + caching fix | Block 2 injection preserves cross-paragraph cache. Adversary's caching concern addressed. |
| OBJ-5: IntentBridge Pre-Population | `incremental_modified` | A + Adversary nuance | Pre-populate from explicit gathering (student SAID it), not pre-chew from analysis |
| OBJ-7: Injection Protocol | `incremental_modified` | A + B's DRY principle | Shared formatter + per-layer injection (not uniform, not single-point) |

### What the Adversary Caught

**7 `breaks_plan` findings, 6 `degrades_quality` findings across both proposals. All addressed.**

The Adversary's most impactful catches:

1. **A-OBJ-6-gathering-via-deepdive** (breaks_plan): The single most important finding. `runDeepDive()` signature requires 3 parameters that don't exist pre-analysis. Killed Proposal A's entire OBJ-6 approach. Without this catch, implementation would have hit a wall at the function call level.

2. **B-OBJ-6-coaching-reuse** (breaks_plan): The coaching service's 5-stage pipeline assumes populated profile at every stage. Stage 2 routing calls `assembleContext()` which does a 16-rule switch on profile data. Stage 3 references North Star and improvement phase. Empty profile = runtime failures. Killed Proposal B's entire OBJ-6 approach.

3. **A-OBJ-7-caching-break** (breaks_plan): Unspecified injection position could break L3.5's prefix caching across parallel paragraph calls. The fix (inject into Block 2, the cached block) ensures student context is PART of the cache key rather than appended outside it.

4. **A-OBJ-2-injection-position** (degrades_quality): Student context at the end of a ~6K prompt gets minimal LLM attention. Fix: inject immediately after essay text, before accumulated understanding -- the high-attention zone.

5. **B-OBJ-7-readingstrategy-consumption** (breaks_plan): ReadingStrategy is NOT consumed by L3.5 or L4. The premise of B's single-distribution-channel approach was factually wrong. Confirmed by source reading -- ReadingStrategy flows to the growth engine, not to `buildProfileContext()` or the crystallizer.

### Key Breakthroughs

**Breakthrough 1: The "pre-analysis void" problem**. Neither proposal recognized that ALL existing services assume a post-L1 world (profile exists, understanding has begun). Gathering operates in a void -- no profile, no understanding, no connections. The novel GatheringService is designed for this void: essay text + student conversation only.

**Breakthrough 2: Facet-based gap detection vs LLM-driven routing**. Proposal B's gap triage used "pure logic" but tried to semantically match gaps to repeated elements -- an LLM task pretending to be logic. The novel approach's gap detection is genuinely trivial: "which of the 6 facets have zero content?" This is a null check, not semantic analysis.

**Breakthrough 3: Per-layer injection positions**. The initial framing assumed "inject the same string everywhere." The Adversary exposed that each layer has a different optimal injection position (L3: after essay text for attention; L3.5: in Block 2 for caching; L4: near IntentBridge schema for relevance). A shared formatter + per-layer positioning is architecturally superior to uniform injection.

**Breakthrough 4: Preserving the coaching discovery moment**. Adversary B-OBJ-5 noted that pre-populating IntentBridge eliminates a coaching discovery moment. The resolution: gathering is an EXPLICIT conversation where the student SAYS their intent -- this isn't pre-chewing, it's transcription. The discovery moment moves from "coach discovers student intent" to "coach discovers divergence between stated intent and text behavior." The divergence IS the coaching fuel.

### What Won, What Lost

**A won on injection approach** (OBJ-2, OBJ-3, OBJ-4, OBJ-5, OBJ-7): For downstream enrichment, the incremental approach of adding optional parameters and injecting into existing prompt-building functions is correct. Every layer already has prompt-building functions with clear injection points. Creating new infrastructure (overlays, editorial passes, distribution channels) adds complexity without capability gain.

**B lost on infrastructure reuse** (OBJ-6, OBJ-7): B's instinct to reuse existing systems was architecturally sound in Cycle 1-3 (coaching, question queue, findings -- all post-analysis). In Cycle 4, that same instinct failed because the target capability (pre-analysis gathering) operates outside the boundary conditions of every existing system.

**Neither won on OBJ-6**: Both proposals tried to compose gathering from existing parts. The Adversary proved both compositions break. The novel standalone GatheringService accepts the reality that pre-analysis elicitation is a fundamentally different activity than post-analysis investigation or coaching.

### V1 Findings Carried Forward (Confirmed)

All 6 V1 findings from Cycle 1-3 were confirmed and integrated:

1. **L1/L2 excluded from student context injection** -- L1 is descriptive cataloguing, L2 is structural cartography. Student declarations would bias both.
2. **Voice claims in L3.5, not L3.75** -- L3.75 DESCRIBES voice patterns and notes student confirmations. L3.5 EVALUATES whether intentional choices land.
3. **"Note alignment, not resolve"** -- Walk injection framing explicitly preserves divergence as meaningful observation.
4. **User message injection, not system prompt** -- Preserves system prompt caching across all layers.
5. **IntentBridge fallback for supplements/PIQs** -- Gathering enables supplement/PIQ intent population via DistinctivenessSignature.
6. **ConversationInsight pipeline for L6** -- Gathering is separate from L6 coaching. Both systems coexist -- gathering is pre-analysis, coaching is post-analysis.

### Adversary Finding Resolution Matrix

| Finding ID | Type | Resolution |
|-----------|------|------------|
| A-OBJ-6-gathering-via-deepdive | breaks_plan | Novel GatheringService -- no deep dive reuse |
| A-OBJ-6-stage1-reuse | degrades_quality | Gathering uses own 6-facet taxonomy, not InsightCategory |
| A-OBJ-6-question-queue-pollution | degrades_quality | Gathering questions are separate conversation, not in queue |
| A-OBJ-7-uniform-injection | breaks_plan | Per-layer injection at optimal positions |
| A-OBJ-7-caching-break | breaks_plan | L3.5 Block 2 injection; L3/L3.75/L4 user prompt injection |
| A-OBJ-2-injection-position | degrades_quality | After essay text, before accumulated understanding (high-attention zone) |
| B-OBJ-6-L1-epistemic | breaks_plan | No L1 changes -- gathering is standalone |
| B-OBJ-6-gap-triage-logic | degrades_quality | Trivial null-check gap detection (which facets are empty) |
| B-OBJ-6-coaching-reuse | breaks_plan | No coaching service reuse -- standalone GatheringService |
| B-OBJ-7-readingstrategy-consumption | breaks_plan | Per-layer injection; ReadingStrategy not used as channel |
| B-OBJ-7-single-editorial-point | degrades_quality | Shared formatter + per-layer injection (no single point of failure) |
| B-OBJ-2-weave-into-L1 | breaks_plan | L1 excluded entirely (V1 finding #1) |
| B-OBJ-5-premature-intentbridge | degrades_quality | Pre-populate from explicit gathering (student said it); discovery moment is divergence |

### Statistics

| Metric | Value |
|--------|-------|
| Total adversary findings (Cycle 4) | 7 breaks_plan + 6 degrades_quality = 13 |
| Findings addressed | 13/13 |
| Agent A wins (unmodified) | 0/7 |
| Agent B wins (unmodified) | 0/7 |
| Agent A modified | 5/7 (OBJ-1, OBJ-2, OBJ-3, OBJ-4, OBJ-5) |
| Agent B modified | 0/7 |
| Hybrid | 1/7 (OBJ-7) |
| Novel | 1/7 (OBJ-6) |
| Files created | 2 |
| Files modified | 8 |
| Estimated diff | ~520 lines added |

### Pattern Across All Cycles

**Cycle 1-3**: B's architectural instincts won on infrastructure design (Finding lifecycle, question queue, Stage 4 extension). A won on storage location (on-profile).

**Cycle 4**: A's incremental instincts won on enrichment (per-layer injection with minimal changes). Neither won on the CREATE objective -- both tried to compose from existing parts, both broke. The novel approach accepted that pre-analysis gathering is a boundary condition no existing system was designed for.

**Meta-pattern**: Reuse wins when the new capability operates within the same lifecycle phase as existing infrastructure. Reuse fails when the new capability operates in a different lifecycle phase (pre-analysis vs post-analysis). The Adversary is most valuable when it catches lifecycle-phase mismatches that both agents missed.

---

## Cycle 5: Reality Checker Synthesis (v3 Forge Pipeline)

**Date**: 2026-03-15
**Pipeline**: v2 Synthesizer -> Agent A (Direct Path) + Agent B (Rethink Path) -> Reality Checker + Blueprint Assembler
**Scope**: 7 diagnostic gaps (GAP-1 through GAP-7) + GatheringService design

### Compressed Evolution

Cycle 5 received the Cycle 4 novel GatheringService design and two competing refinement proposals. Agent A refined it incrementally (named fields, simple multipliers, hardcoded revision questions). Agent B rethought from first principles (signal arrays, epistemic gap detector, projection functions, budget-conserving attention).

The Reality Checker's job: verify every claim against actual source code, choose the best approach per gap, and produce a blueprint that passes the "start coding" test.

### Key Decisions (6 questions resolved)

#### 1. Type System: Named Fields vs Generic Signal Array

**Agent A**: `StudentDeclaredContext` with named fields (`declaredIntent`, `structuralSignificance`, `domainExpertise`, `topicMotivation`, `keyTakeaway`, `knownWeaknesses`, `revisionFocus`).

**Agent B**: `DeclaredSignal[]` array with `SignalFacet` and `SignalScope` enums.

**Decision: `refined` -- Named fields, aligned with existing DeclaredDataEntry**

**Reality check**: The existing FORGE_PLAN.md (Cycle 4 output) already established `DeclaredDataEntry[]` on `EssayProfile.studentDeclaredData` as the UNIFIED persistent model. Both Agent A and Agent B ignored this and proposed NEW intermediate types. Agent A's `StudentDeclaredContext` has 7 named fields that overlap with the 8-category `DeclaredDataCategory`. Agent B's `DeclaredSignal[]` is a generic signal array that duplicates `DeclaredDataEntry`'s category+location+content pattern with different field names.

The correct answer: `StudentDeclaredContext` remains as the Sonnet crystallization output format (already specified in the existing plan). It is immediately converted to `DeclaredDataEntry[]`. No additional intermediate types. Agent A's named fields map cleanly to `DeclaredDataCategory` values. Agent B's generic array adds abstraction without adding capability.

#### 2. Question Generation: Standalone Sonnet vs Epistemic Gap Detector

**Agent A**: Standalone Sonnet call from L1 impressions (~$0.006).

**Agent B**: `EpistemicGapDetector` -- NEW Sonnet call that reads L1's `ParagraphFirstImpression[]` output and identifies epistemic gaps (~$0.008).

**Decision: `direct` -- Agent A (simple Sonnet question gen)**

**Reality check**: Both proposals generate questions from L1 output. The difference is framing -- A says "generate questions" while B says "identify epistemic gaps then derive questions." But L1 output is purely descriptive (`ParagraphFirstImpression` has `apparentPurpose`, `emotionalRegister`, `voiceObservation`, `craftNotices`). The epistemic gap detector is just a question generator with extra conceptual overhead. The input is the same, the output is the same, the cost is similar. A's direct framing is simpler and equally effective.

However, A's proposed Haiku for seed questions is wrong per the MODEL CONSTRAINT: question generation = Sonnet with cacheSystemPrompt: true. The existing plan already specifies this correctly. The Haiku is only for classification of student responses.

#### 3. Injection Strategy: Shared Utility vs Per-Layer Projections

**Agent A**: `buildStudentContextBlock()` shared utility, each layer calls at its own optimal position.

**Agent B**: Per-layer projection functions (`projectForL3Walk()`, `projectForL35Analysis()`, etc.) producing different views.

**Decision: `hybrid` -- Shared formatter with optional per-layer filtering**

**Reality check**: The existing plan already specifies `buildDeclaredDataBlock()` in `contextFormatters.ts` with optional `categories` and `paragraph` filters. This IS the shared utility. Per-layer projections are overkill -- the filtering parameters already produce different views (L3 walk gets paragraph-scoped entries; L3.5 analysis gets all entries; L4 gets intent+correction entries). No need for 5 separate projection functions when parameterized filtering achieves the same result.

Agent B's projection functions DO have one valid insight: different layers need different framing text. The L3 walk preamble ("The writer has shared the following...") differs from the L3.5 analysis preamble ("When evaluating intent-effect alignment, consider..."). This is handled by the existing plan's `buildDeclaredDataBlock()` producing the data block, and per-layer injection code adding the appropriate framing.

#### 4. Attention Allocation (GAP-6): Simple Multiplier vs 3-Signal Normalization

**Agent A**: Multiplier on `computeWalkMaxTokens()`: fulcrum=1.5x, important=1.2x, supporting=0.8x.

**Agent B**: 3-signal budget-conserving normalization (structural weight + scout leads + student priority). Normalizes so total budget remains constant.

**Decision: `refined` -- Agent A's multiplier concept with correct types + budget conservation from B**

**Reality check -- Agent A has a type error**: The proposed weight values (`fulcrum`, `important`, `supporting`) do not match the actual `StructuralWeight` type, which is `'load_bearing' | 'supporting' | 'transitional' | 'decorative'`. The multiplier concept is sound but needs correct type alignment.

**Reality check -- Agent B's normalization is overengineered**: The current `computeWalkMaxTokens(sentenceCount)` returns `Math.min(8192, Math.max(4096, sentenceCount * 200 + 3500))`. Adding budget-conserving normalization across 3 signals with per-paragraph allocation vectors is a 50-line algorithm replacing a 1-line formula. The marginal quality gain doesn't justify the complexity.

The refined approach: multiply `computeWalkMaxTokens` result by a weight derived from student-declared structural significance (if available). Use actual `StructuralWeight` values from L2 structural cartography as base, with student declarations overriding. Budget stays soft-capped at `WALK_MAX_TOKENS_CAP`.

#### 5. Cost: A's ~$0.02 vs B's ~$0.05

**Decision: A's cost target (~$0.02)**

**Reality check**: The existing plan specifies ~$0.015-0.02 per gathering. Agent B's ~$0.045-0.065 comes from multi-turn Sonnet conversation (~$0.01-0.02/turn x 3-5 turns) plus the epistemic gap detector. The quality difference between a 3-5 turn Sonnet conversation and a 2-3 question Haiku-classified exchange does not justify 2.5x cost. The gathering occurs BEFORE analysis -- at this point, there is no deep profile to inform richer questions. The student's answers are the bottleneck, not the LLM's question sophistication.

#### 6. Coaching Bridge (GAP-7): insightToSignal()

**Agent A**: Hardcoded revision questions per `EditChangeType` + string injection into reanalysis context.

**Agent B**: `insightToSignal()` converts coaching ConversationInsight to DeclaredSignal. `RevisionGoalAlignment` in edit understanding output.

**Decision: `refined` -- Neither is needed for Phase 1**

**Reality check**: The existing plan already handles the coaching-to-gathering bridge via the `DeclaredDataEntry` model. When coaching extracts a `ConversationInsight` of category `reinterpretation` or `new_context`, Stage 4 produces `declaredEntries[]` which are stored as `DeclaredDataEntry`. These are available on the profile for the next pipeline run. No separate `insightToSignal()` bridge is needed -- the DeclaredDataEntry IS the bridge.

For revision intent (GAP-7 specifically): the existing `EditUnderstandingService` already produces `apparentPurpose` with `purposeConfidence`. The refinement from SYN-5 (inject declared intents into edit understanding prompt) handles this: the edit understanding Sonnet sees the student's declared intent and assesses whether the edit aligns. No new type needed.

### Source Code Verification Log

| Claim | File | Line | Verified | Issue |
|-------|------|------|----------|-------|
| `computeWalkMaxTokens(sentenceCount)` signature | sequentialDeepWalk.ts | 92 | Yes | Returns `Math.min(8192, Math.max(4096, sentenceCount * 200 + 3500))` |
| `walkEssay()` options parameter | sequentialDeepWalk.ts | 404-416 | Yes | `{ startFromParagraph?, reanalysisContext?, findingStore? }` |
| `callClaude` multi-turn interface exists | claude.ts | 151-162 | Yes | `ClaudeMessageInput` with `messages: Array<{ role, content }>` |
| `StructuralWeight` type | profileTypes.ts | 189 | Yes | `'load_bearing' \| 'supporting' \| 'transitional' \| 'decorative'` |
| Agent A's weight values (fulcrum/important/supporting) | N/A | N/A | **WRONG** | Should be load_bearing/supporting/transitional/decorative |
| `preseedIntentBridge` method exists | N/A | N/A | **WRONG** | Does not exist on coordinator |
| `topicFitSignal` field on AdmissionsPositioning | profileTypes.ts | 890-905 | **WRONG** | Field does not exist |
| `IntentBridge.studentIntent` field | profileTypes.ts | 1046 | Yes | `string \| null` |
| `EditChangeType` union | profileTypes.ts | 149-155 | Yes | 6 variants confirmed |
| `PipelineInput` interface | analysisOrchestrator.ts | 149-174 | Yes | Has essayId, essayText, essayType, promptText, checkpointStore, includeAnnotations, reanalysisBrief, priorFindings |
| `AdmissionsPositioning` interface | profileTypes.ts | 890-905 | Yes | 7 fields, no topicFit |
| `MODEL_PRICING` Sonnet rates | claude.ts | 773 | Yes | input: $3.00, output: $15.00, cacheRead: $0.30 |
| `MODEL_PRICING` Haiku rates | claude.ts | 775 | Yes | input: $1.00, output: $5.00, cacheRead: $0.10 |

### What Agent A Got Wrong
1. `StructuralWeight` values -- proposed `fulcrum | important | supporting`, actual is `load_bearing | supporting | transitional | decorative`
2. `preseedIntentBridge()` -- method does not exist on EssayProfileCoordinator
3. `topicFitSignal` on AdmissionsPositioning -- field does not exist
4. Haiku for seed question generation -- violates MODEL CONSTRAINT (question gen = Sonnet)

### What Agent B Got Wrong
1. Proposed entirely new type system (`DeclaredSignal[]`, `EpistemicGap[]`) that duplicates the already-decided `DeclaredDataEntry[]` model
2. Per-layer projection functions that duplicate `buildDeclaredDataBlock()`'s parameterized filtering
3. `insightToSignal()` bridge that duplicates the Stage 4 `declaredEntries[]` extraction path
4. `EpistemicGapDetector` that is just question generation with extra abstraction

### What Both Got Right
1. Student context SHOULD be gathered before analysis (the pre-analysis gathering concept)
2. The gathering service must be standalone (cannot reuse coaching/deep dive infrastructure)
3. Per-layer injection at optimal positions (not uniform injection)
4. Attention allocation should consider student-declared structural significance
5. Revision intent matters and should inform reanalysis

---

## Synergy Debates

### SYN-1: Confidence-Gated Question Targeting

**Decision: `novel`** -- L3.75 produces an EXPLICIT `dimensionConfidence` assessment as structured output.

### SYN-2: Finding-Driven Student Questions

**Decision: `architectural_modified`** -- Post-synthesis `FindingQuestionPromoter` (single Haiku call, ~$0.002).

### SYN-3: Connection-Gap-Driven Questions

**Decision: `architectural_modified`** -- Generate connection-gap questions DURING L3.75 synthesis. $0 marginal cost.

### SYN-4: IntentBridge Auto-Population

**Decision: `hybrid`** -- `systemReading` from L3.75 synthesis, `studentIntent` from accumulated DeclaredDataEntry of category `'intent'`. $0 cost.

### SYN-5: Edit-Intent Alignment Tracking

**Decision: `incremental_modified`** -- Inject declared intents into edit understanding prompt. Existing `apparentPurpose` absorbs alignment. $0 cost.

### SYN-6: Finding Maturity via Student Declarations

**Decision: `architectural_modified`** -- Stage 4 Sonnet with finding summary injection. $0 marginal cost.

### SYN-7: Declared Data Staleness and Reanalysis

**Decision: `incremental_modified`** -- MutationType-driven staleness via dependency map. $0 cost.

### SYN-8: Finding Resolution Ladder

**Decision: `incremental_modified`** -- Soft gate with LLM-facing activity log warning. $0 cost.

### SYN-9: Phase-Aware Question Filtering

**Decision: `novel`** -- Stage 2.5 filters using `dimensionPhases` enum matching. $0 cost.

---

## Debate Outcome Statistics (All Cycles)

| Metric | Value |
|--------|-------|
| Total adversary findings (all cycles) | 45 breaks_plan + 18 degrades_quality + 3 cosmetic |
| Findings addressed | 66/66 |
| Source code claims verified | 13 checked, 4 wrong (all corrected in blueprint) |
| Agent A type errors caught | 1 (StructuralWeight values) |
| Agent A nonexistent API calls | 2 (preseedIntentBridge, topicFitSignal) |
| Agent B unnecessary abstractions | 3 (DeclaredSignal, EpistemicGap, projection functions) |
| Blueprint items | 15 implementation items |
| Total estimated cost per analysis round | ~$0.015-0.020 gathering + $0 pipeline injection |
