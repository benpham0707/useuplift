# Forge Debates: Conversator as Intelligence Gatherer
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

The v2 pipeline tackled a fundamentally harder problem than Cycle 1-3: creating a NEW capability (pre-analysis student context gathering) rather than extending existing ones. This exposed a critical limitation in both proposals — neither agent recognized that the system's existing infrastructure (deep dives, question queue, coaching service) was designed for a *post-analysis* world and couldn't be repurposed for *pre-analysis* gathering without breaking.

**Cycle 1-3** (Declared Data + Coaching Intelligence): Established the foundational decisions — on-profile storage, Finding-based intent-effect gaps, question queue extension for student-facing questions, Stage 4 extraction, adaptive overlay routing.

**Cycle 4** (Gathering + Pipeline Enrichment): Built ON the Cycle 1-3 foundation but pivoted the framing. Instead of declared data flowing FROM coaching TO the profile (reactive), this cycle asks: can we gather context BEFORE analysis (proactive)? The answer required rejecting both proposals' core infrastructure choices for OBJ-6 and building a novel standalone service.

### Decision Summary (Cycle 4)

| Objective | Choice | Winning Source | Key Reason |
|-----------|--------|---------------|------------|
| OBJ-6: Gathering Service | `novel` | Neither | Both proposals reuse infrastructure that requires populated profile (breaks at gathering time) |
| OBJ-1: PipelineInput Extension | `incremental` | A (trivially) | Data plumbing — add optional field to existing interface |
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

4. **A-OBJ-2-injection-position** (degrades_quality): Student context at the end of a ~6K prompt gets minimal LLM attention. Fix: inject immediately after essay text, before accumulated understanding — the high-attention zone.

5. **B-OBJ-7-readingstrategy-consumption** (breaks_plan): ReadingStrategy is NOT consumed by L3.5 or L4. The premise of B's single-distribution-channel approach was factually wrong. Confirmed by source reading — ReadingStrategy flows to the growth engine, not to `buildProfileContext()` or the crystallizer.

### Key Breakthroughs

**Breakthrough 1: The "pre-analysis void" problem**. Neither proposal recognized that ALL existing services assume a post-L1 world (profile exists, understanding has begun). Gathering operates in a void — no profile, no understanding, no connections. The novel GatheringService is designed for this void: essay text + student conversation only.

**Breakthrough 2: Facet-based gap detection vs LLM-driven routing**. Proposal B's gap triage used "pure logic" but tried to semantically match gaps to repeated elements — an LLM task pretending to be logic. The novel approach's gap detection is genuinely trivial: "which of the 6 facets have zero content?" This is a null check, not semantic analysis.

**Breakthrough 3: Per-layer injection positions**. The initial framing assumed "inject the same string everywhere." The Adversary exposed that each layer has a different optimal injection position (L3: after essay text for attention; L3.5: in Block 2 for caching; L4: near IntentBridge schema for relevance). A shared formatter + per-layer positioning is architecturally superior to uniform injection.

**Breakthrough 4: Preserving the coaching discovery moment**. Adversary B-OBJ-5 noted that pre-populating IntentBridge eliminates a coaching discovery moment. The resolution: gathering is an EXPLICIT conversation where the student SAYS their intent — this isn't pre-chewing, it's transcription. The discovery moment moves from "coach discovers student intent" to "coach discovers divergence between stated intent and text behavior." The divergence IS the coaching fuel.

### What Won, What Lost

**A won on injection approach** (OBJ-2, OBJ-3, OBJ-4, OBJ-5, OBJ-7): For downstream enrichment, the incremental approach of adding optional parameters and injecting into existing prompt-building functions is correct. Every layer already has prompt-building functions with clear injection points. Creating new infrastructure (overlays, editorial passes, distribution channels) adds complexity without capability gain.

**B lost on infrastructure reuse** (OBJ-6, OBJ-7): B's instinct to reuse existing systems was architecturally sound in Cycle 1-3 (coaching, question queue, findings — all post-analysis). In Cycle 4, that same instinct failed because the target capability (pre-analysis gathering) operates outside the boundary conditions of every existing system.

**Neither won on OBJ-6**: Both proposals tried to compose gathering from existing parts. The Adversary proved both compositions break. The novel standalone GatheringService accepts the reality that pre-analysis elicitation is a fundamentally different activity than post-analysis investigation or coaching.

### V1 Findings Carried Forward (Confirmed)

All 6 V1 findings from Cycle 1-3 were confirmed and integrated:

1. **L1/L2 excluded from student context injection** — L1 is descriptive cataloguing, L2 is structural cartography. Student declarations would bias both.
2. **Voice claims in L3.5, not L3.75** — L3.75 DESCRIBES voice patterns and notes student confirmations. L3.5 EVALUATES whether intentional choices land.
3. **"Note alignment, not resolve"** — Walk injection framing explicitly preserves divergence as meaningful observation.
4. **User message injection, not system prompt** — Preserves system prompt caching across all layers.
5. **IntentBridge fallback for supplements/PIQs** — Gathering enables supplement/PIQ intent population via DistinctivenessSignature.
6. **ConversationInsight pipeline for L6** — Gathering is separate from L6 coaching. Both systems coexist — gathering is pre-analysis, coaching is post-analysis.

### Adversary Finding Resolution Matrix

| Finding ID | Type | Resolution |
|-----------|------|------------|
| A-OBJ-6-gathering-via-deepdive | breaks_plan | Novel GatheringService — no deep dive reuse |
| A-OBJ-6-stage1-reuse | degrades_quality | Gathering uses own 6-facet taxonomy, not InsightCategory |
| A-OBJ-6-question-queue-pollution | degrades_quality | Gathering questions are separate conversation, not in queue |
| A-OBJ-7-uniform-injection | breaks_plan | Per-layer injection at optimal positions |
| A-OBJ-7-caching-break | breaks_plan | L3.5 Block 2 injection; L3/L3.75/L4 user prompt injection |
| A-OBJ-2-injection-position | degrades_quality | After essay text, before accumulated understanding (high-attention zone) |
| B-OBJ-6-L1-epistemic | breaks_plan | No L1 changes — gathering is standalone |
| B-OBJ-6-gap-triage-logic | degrades_quality | Trivial null-check gap detection (which facets are empty) |
| B-OBJ-6-coaching-reuse | breaks_plan | No coaching service reuse — standalone GatheringService |
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

**Cycle 4**: A's incremental instincts won on enrichment (per-layer injection with minimal changes). Neither won on the CREATE objective — both tried to compose from existing parts, both broke. The novel approach accepted that pre-analysis gathering is a boundary condition no existing system was designed for.

**Meta-pattern**: Reuse wins when the new capability operates within the same lifecycle phase as existing infrastructure. Reuse fails when the new capability operates in a different lifecycle phase (pre-analysis vs post-analysis). The Adversary is most valuable when it catches lifecycle-phase mismatches that both agents missed.

---

## Synergy Debates

### SYN-1: Confidence-Gated Question Targeting

**Agent A**: Build a `ConfidenceMap` type aggregating 6 signals (finding maturity distribution, connection density, holistic section completeness, question resolution rate, deep dive coverage, student confirmation count) into a per-dimension confidence score. Use in Stage 2.5 for tie-breaking.

**Agent B**: Inject a "confidence landscape" section into L3.75's prompt showing the raw signal summary. L3.75 uses it implicitly.

**Adversary critique**: A's ConfidenceMap is unbuildable as a pure function. The 6 signals are heterogeneous (counts, ratios, booleans, prose assessments) — there is no principled way to aggregate them into a single numeric score without a formula, and any formula is a closed taxonomy for contextual judgment (violates LLM-first Rule 1). B's prompt injection is cosmetic — L3.75 already receives every one of those 6 signals in its existing context (finding summary, connection graph, holistic sections, question queue, deep dive results, conversation insights). Injecting a "summary" adds tokens without adding information.

**Decision: `novel`**
Neither approach creates new capability. The novel approach: L3.75 produces an EXPLICIT `dimensionConfidence` assessment as structured output. This transforms implicit knowledge (L3.75 already knows which dimensions are well-understood) into a queryable artifact that Stage 2.5 can consume directly. The LLM produces the confidence map, solving A's aggregation problem. The explicit output creates consumable structure, solving B's cosmetic problem.

---

### SYN-2: Finding-Driven Student Questions

**Agent A**: `promoteFindingQuestionsToStudent()` runs in the growth cycle. Adds `relatedFindingId` to questions. Stage 4 resolves questions and advances finding maturity.

**Agent B**: Combined "Uncertainty Harvester" with SYN-3. Single Haiku scans ALL profile uncertainty (findings + connections + gaps) to produce student questions.

**Adversary critique**: A has two breaks: (1) `relatedFindingId` requires modifying the output schema of all ~20 deep dive prompt templates (the prompts that generate questions don't know about finding IDs — the finding lifecycle is separate from the question lifecycle). (2) `confirmation` category in Stage 1 classification skips Stage 4's Sonnet evaluation, blocking the maturity advancement path for the most common student response type. B degrades quality: the unified Haiku needs calibration examples for finding vs. connection uncertainty (different patterns), and re-runs every coaching turn without caching.

**Decision: `architectural_modified`**
A's core insight is correct — findings with `deepeningPotential` that need student input are the highest-value question candidates. But the `relatedFindingId` approach is wrong because it requires changing question-producing systems (deep dive templates) to know about finding IDs. Instead: a post-synthesis `FindingQuestionPromoter` (single Haiku call, ~$0.002) scans eligible findings and generates student-facing questions. The finding reference is encoded in `expectedInsight` as prose, not as a foreign key. Stage 4 confirmation handling works because finding-driven questions are designed to elicit substantive responses (`new_context` or `reinterpretation`), not bare confirmations.

---

### SYN-3: Connection-Gap-Driven Questions

**Agent A**: `generateConnectionGapQuestions()` runs after L3.75. Adds `relatedConnectionId` to questions. Stage 4 promotes connections.

**Agent B**: Covered under unified Uncertainty Harvester (same issues as SYN-2B).

**Adversary critique**: A's `relatedConnectionId` is lost in L3.75 curation — the `QuestionCurationOutput` schema doesn't preserve connection references. Also, running AFTER L3.75 means the questions miss curation (L3.75 can't filter/prioritize questions it hasn't seen). B's unified harvester loses the type distinction between "resolve a finding" and "confirm a connection" — different resolution actions needed downstream.

**Decision: `architectural_modified`**
Generate connection-gap questions DURING L3.75 synthesis, not after. L3.75 already identifies connection gaps (it produces `connectionGraphSummary` mentioning isolated paragraphs and tentative connections). Extending the output schema to include `connectionGapQuestions` makes this implicit knowledge explicit. Questions are tagged `targetAudience: 'student'` and enter the persistent queue. No `relatedConnectionId` needed — the question text naturally references the connection ("What is the relationship between your opening scene and the reflection in P4?"). $0 marginal cost.

---

### SYN-4: IntentBridge Auto-Population

**Agent A**: After 3+ DeclaredDataEntries, Haiku synthesizes them into `studentIntent`. Uses `updateIntentBridge()`.

**Agent B**: Ask the student directly as the first coaching question.

**Adversary critique**: A overwrites `systemReading` with Haiku output — destructive, since `systemReading` should reflect the system's independent analysis, not a Haiku summary. Also, no `personal_statement` scale guard (supplements/PIQs shouldn't have intent bridges auto-populated). B fails when `intentBridge` itself is null (null reference). Also, vague student answers ("I want it to be good") populate permanently, degrading the bridge's value.

**Decision: `hybrid`**
`systemReading` is populated by L3.75 synthesis (propagated from `thematicArchitecture.centralThesis`), not Haiku — no destructive overwrite. `studentIntent` is synthesized from accumulated `DeclaredDataEntry` of category `'intent'` — simple concatenation, no LLM call. Vague answers are handled by the supersession model (`studentCertainty: 'exploring'` entries are weighted lower). Scale guard added for personal_statement only. $0 cost.

---

### SYN-5: Edit-Intent Alignment Tracking

**Agent A**: Add `intentAlignment` field to `EditUnderstanding`. Inject declared intents into edit Sonnet prompt.

**Agent B**: Re-run IntentGapDetector after every edit, diff gap findings.

**Adversary critique**: A overloads the edit understanding Sonnet with a new field that has no consumer. B can't work — IntentGapDetector requires full L3.5 analysis output, which doesn't exist per-edit. Also, B doesn't supersede old gap findings, creating accumulation.

**Decision: `incremental_modified`**
A's concept is correct (inject declared intents into edit understanding) but the new `intentAlignment` field is unnecessary. Instead, inject declared intents as context and let the existing `apparentPurpose` prose field absorb the alignment assessment. `apparentPurpose` is already consumed by VersionTracker and coaching — no consumer gap. $0 marginal cost.

---

### SYN-6: Finding Maturity via Student Declarations

**Agent A**: Auto-advance finding maturity in `DeclaredDataMutator.applyDeclaredEntry()`.

**Agent B**: Stage 4 LLM explicitly evaluates confirmation/supersession of findings.

**Adversary critique**: A has two breaks: (1) DeclaredDataMutator has no FindingStore access — mutators operate on EssayProfile fields, FindingStore is a separate manager with its own API. Cross-cutting architectural boundary. (2) Auto-advancement can't distinguish confirm from refute — "I wasn't being ironic" should supersede F3, not confirm it. B is cosmetically correct — the Stage 4 `confirmedFindings`/`supersededFindings` machinery already exists but is under-utilized because the Sonnet doesn't see a useful finding summary.

**Decision: `architectural_modified`**
B's approach, enhanced with finding summary injection. Stage 4 Sonnet receives `ProfileIndex.findingSummary.topFindings` (~100 tokens). The existing `confirmedFindings`/`supersededFindings` output arrays are wired to FindingStore maturity transitions. The LLM distinguishes confirm vs. refute naturally. FindingStore wired into coaching service (same pattern as QuestionQueueManager wiring from OBJ-3). $0 marginal cost.

---

### SYN-7: Declared Data Staleness and Reanalysis

**Agent A**: New `MutationTypes` for declared data. Staleness dependency map entries. VersionTracker threshold.

**Agent B**: Combined with SYN-8 as "Intelligence Budget" — allocate reanalysis budget across declared data, finding resolution, and connection strengthening pools.

**Adversary critique**: A's VersionTracker doesn't track declared data — it tracks text edits. Wrong abstraction. Staleness targets need concrete specification (which holistic sections, which paragraph indices). B has two breaks: no ROI metric defined for budget allocation, and budget starvation across pools when one pool consumes disproportionately.

**Decision: `incremental_modified`**
A's concept (MutationType-driven staleness) is correct, but routed through the staleness dependency map, NOT VersionTracker. Two new MutationTypes (`declared_intent_applied`, `declared_context_applied`) with concrete staleness targets: intent entries mark affected paragraph analysis + intent bridge as stale; context entries mark affected paragraph understanding + relevant holistic sections as stale. Reanalysis is governed by existing growth cycle budget ($0.60), not a separate intelligence budget. $0 cost.

---

### SYN-8: Finding Resolution Ladder

**Agent A**: `iterationsSurvived >= 2` gate piggybacks on existing growth cycle. Prevents premature finding maturity advancement.

**Agent B**: Covered under Intelligence Budget (same breaks as SYN-7B).

**Adversary critique**: A is mostly cosmetic — existing auto-promotion at 3 iterations already escalates priority for stuck questions. B has no defined gain metric, making the escalation ladder emergent rather than designed.

**Decision: `incremental_modified`**
The adversary is right that existing auto-promotion handles priority. But priority (attention signal) and maturity (truth signal) are different dimensions. The ladder adds a SOFT gate: FindingStore logs a warning when hypothesis findings are advanced to developing with < 2 iterationsSurvived. The warning appears in the activity log for L3.75 to see. L3.75 prompt guidance reinforces the gate ("hypothesis findings surviving fewer than 2 iterations should not advance without strong evidence"). LLM-first compliant — the system signals, the LLM decides. $0 cost.

---

### SYN-9: Phase-Aware Question Filtering

**Agent A**: Cross-reference `focusAreas`/`deferredAreas` in Stage 2.5 sort.

**Agent B**: `relevantPhases` on questions, assigned by LLM at generation time.

**Adversary critique**: A's `focusAreas` is prose ("sentence-level craft in paragraphs 2-4 needs attention"); dimensions are enums (`'craft'`, `'voice'`). String matching between these taxonomies is unreliable and fragile. B fails because the phase is unknown when questions are generated — the walk (which generates questions) runs before phase assessment (which runs after L3.5 analysis).

**Decision: `novel`**
Neither recognized that Stage 2.5 is the correct filter point. By the time Stage 2.5 selects a question for the student, BOTH the question queue AND the improvement phase exist. The filter uses `dimensionPhases` (enum-based, matchable against question `dimensions`) to check phase compatibility. Questions targeting dimensions 2+ levels above the current phase are deprioritized, not discarded. If no phase-appropriate question exists, Stage 2.5 skips intelligence-gathering for that turn. $0 cost.

---

## Synergy Debate Outcome Statistics

| Metric | Value |
|--------|-------|
| Total adversary findings | 14 (breaks_plan) + 5 (degrades_quality) + 3 (cosmetic) |
| Findings addressed in plan | 14/14 breaks_plan, 5/5 degrades_quality, 3/3 cosmetic |
| Agent A wins (unmodified) | 0/9 |
| Agent B wins (unmodified) | 0/9 |
| Agent A modified (incremental_modified) | 2/9 (SYN-5, SYN-7) |
| Agent B modified (architectural_modified) | 3/9 (SYN-2, SYN-3, SYN-6) |
| Hybrid | 1/9 (SYN-4) |
| Novel | 2/9 (SYN-1, SYN-9) |
| Incremental modified (A concept) | 1/9 (SYN-8) |

**Synergy patterns**:
1. **LLM-first violations are the top failure mode**: SYN-1A (formula aggregation), SYN-8B (gain metric), SYN-9A (string matching) — all attempt deterministic computation where LLM judgment is needed.
2. **Timing matters more than approach**: SYN-3 and SYN-9 failed because proposals placed the operation at the wrong pipeline stage. Correct timing (DURING L3.75 for SYN-3, AT Stage 2.5 for SYN-9) eliminated the core problems.
3. **Existing machinery is under-utilized**: SYN-6 (Stage 4 confirmedFindings exists but has no finding context), SYN-8 (auto-promotion exists but conflates priority with maturity), SYN-5 (apparentPurpose exists but doesn't see declared intents). The cheapest synergies enrich existing outputs rather than creating new ones.
4. **$0 marginal cost dominates**: 7 of 9 synergy objectives are $0 marginal cost — they add output fields to existing LLM calls or use pure infrastructure. Only SYN-2 requires a new LLM call (~$0.002). Total synergy cost: ~$0.002-0.005 per round.
