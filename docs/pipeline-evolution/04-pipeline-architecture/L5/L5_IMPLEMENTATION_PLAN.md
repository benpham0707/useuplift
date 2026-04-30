# L5 Implementation Plan — Maximum-Quality Sequential Build

> **The single canonical build plan.** Read cover-to-cover before writing the first line of code. Every deliverable is sequenced; every deliverable has a contract; every contract is honored at integration. The plan is the contract the implementer executes against; the five governing docs (`L5_REDESIGN_INDEX.md`, `L5_EXPERIENCE_TARGET.md`, `L5_ITERATION_LOOP_DESIGN.md`, `L5_E2E_INTEGRITY_AUDIT.md`, `L5_CONSUMPTION_AUDIT.md`) are referenced from this plan but not re-derived during build.
>
> **The standing charter — the only line that gets repeated three times in this plan because it is the soul of the build.** This build has unlimited time. Unlimited tokens per response. Unlimited revision cycles. Unlimited agent and swarm dispatches. Unlimited thinking time per deliverable. The single hard constraint is the **$10 absolute API cap across the entire build, including the final E2E run and any fix-cycle re-runs**. Everything else exists to support quality. Every component, from the smallest type field to the largest orchestrator, is built with focus, care, and revision until it lands at the level the design deserves. Do not optimize for anything except quality of result. Do not ship a deliverable that is "good enough" when more revision would make it right. Take the time. Spawn the agents. Revise until landing. The system Tue described over days of design work is what gets built — at the level the design deserves.
>
> **Total scope.** ~95 deliverables across six build phases plus a final E2E validation pivot. Estimated ~12–16 weeks of focused engineering. Total expected build-phase API spend: ≤$10.

---

## 0. Preconditions and standing operational charter

### 0.1 Doc readiness — confirmed

- ✓ `L5_REDESIGN_INDEX.md` written.
- ✓ `L5_FEEDBACK_REDESIGN.md` carries `[SUPERSEDED]` markers at all seven affected sections (§3.2, §3.6, §5.2, §6.1, §7.2, §11.6, plus inline overrides referenced from §3.4).
- ✓ `L5_CONSUMPTION_AUDIT.md` revised with §A1 (carry-forward classification per audit row), §A2 (proposed-consumer rewire to experience-target surfaces), §A3 (twenty new rows for IterationLedger / TaughtMove / DigContext / GroundTruthFact / StoryFragment / IntentSignal / IterationRecord types + DB schema), §A4 (how the build phase reads the audit per phase).
- ✓ All four user-decisions locked in writing:
  - **Q1 = 20%** redirection fraction (iteration design §11 Q1).
  - **Q4 = 0.7** landing-detector confidence floor (iteration design §11 Q4).
  - **Q-A = continuous chat surface always available; analysis-initiated dig questions fire at specific moments** (after first feedback, between iterations, when the student is stuck).
  - **Q-B = analysis-driven dig.** The analysis layers produce structured signals naming exactly what specifics they need; the Conversator is the targeted inquiry agent that asks for those specifics, captures answers, structures them, feeds them back.

### 0.2 Stance commitments — locked in

- ✓ **Full Phase 0–5 build target.** No partial ship; the experience target's ten surfaces, the seven teaching moves per focus point, the divergent-path multiplicity, the analysis-driven dig with continuous chat, the selective carry-forward — all of it ships together. Anything less is not the system Tue described.
- ✓ **No A/B against v1.** v1 already has runs and tests; re-running them is double-spend. The validation is one full E2E test of the new system on a single representative essay.
- ✓ **No reruns / no loops.** If the E2E run fails mid-pipeline at a step, the pipeline halts at that step. Diagnose at source, fix at source, re-run from the broken step using persisted upstream outputs (not from step 1). No retries that swallow errors. No silent fallbacks.
- ✓ **$10 absolute API cap across the entire build.** Allocated below. Build cost ledger maintained at every API call. Halt at $9 to reassess.
- ✓ **Tue review at the system level after the final E2E run.** Not at every prompt during build. Mid-build escalations to Tue are rare and reserved for ambiguities the design docs don't resolve, not for routine prompt validation.

### 0.3 The standing operational charter — repeated for emphasis

This build has **unlimited time, unlimited tokens per response, unlimited revision cycles, unlimited agent and swarm dispatches, unlimited thinking time per deliverable**. The implementer is not optimizing for speed of execution. The implementer is optimizing for **quality of every deliverable, from smallest to largest**.

What this licenses, concretely:

**Agent and swarm dispatch.** When a deliverable benefits from parallel investigation (codebase reads across multiple layers, design-decision exploration, code review against the no-fallback checklist), spawn agents. Spawn many. Spawn an Explore agent per layer when reading the inheritance of a refactor. Spawn a Plan agent for thorny design decisions inside a deliverable. Spawn a code-review-style agent for the no-fallback enforcement pass on every orchestration deliverable. Spawn a security-architect agent for any deliverable that touches RLS or auth boundaries. Spawn whatever agents the deliverable benefits from. The cost is in implementer focus to coordinate them; that is exactly what the implementer is here for.

**Continuous revision until quality lands.** Three rounds per prompt is the *minimum*, not the maximum. If the third round still has a sentence that leads the student or a structure that fights the contract, do round four. Do round eight. Do round twelve. Land it. Same for code: if the second pass through a function still has a control flow that hides a failure surface, refactor again. The deliverable is done when it is *right*, not when it is "shipped."

**Long-form thinking per deliverable.** No deliverable ships in the first draft. Every type definition gets read against the design contract twice before commit. Every test case gets read against "what could go wrong here" once before commit. Every function gets read against the no-fallback checklist once before commit. Every prompt gets the three-round revision protocol (§9) at minimum, with additional rounds when needed. The pace is **think first, write second, review third, revise fourth, commit fifth, integrate sixth**.

**Cross-phase audits as full-context investigations.** Between phases, before advancing, the implementer rereads every governing doc that gates the next phase, checks every audit row that the just-completed phase touched, walks the dependency graph fully, runs the integrity check against drift. This is hours of work per audit. That is the right cost. The audits catch design-vs-build drift before it compounds.

**Token-unconstrained reasoning.** The implementer is not minimizing tokens per response or per agent prompt. They are maximizing care per deliverable. A long, file-and-line-grounded answer that cites the design contract section beats a terse answer every time. Long agent prompts that brief the agent fully on the deliverable's contract beat short prompts that the agent has to interpret.

**Continuous test-running.** The mock-based integration tests run after every meaningful code change, not just at deliverable end. `npx tsc --noEmit` runs after every type change. The test suite runs continuously. Failures surface immediately; nothing accumulates. CI will catch lapses, but the implementer's local discipline prevents lapses from existing.

**The deliverable is done when it is right.** Not when it is "shipped." Not when it "passes tests." Not when it is "good enough." When it is right — meaning: the contract is honored verbatim, the failure surface is single-owner-with-visible-failure, the code reads cleanly, the tests cover edge cases, the documentation explains *why* the deliverable is shaped the way it is, and the deliverable composes correctly with everything before it in the dependency graph.

This charter applies to every deliverable in this plan. It applies to types as much as to orchestrators. It applies to the Conversator's dig-question composer prompt as much as to the L3.75 targeted-refresh prompt. It applies to the Phase 0 telemetry hook scaffolding as much as to the Phase 6 final E2E run. **Every component gets full focus and effort.**

### 0.4 The $10 API cap allocation

Reserved spend, hard-allocated at plan time:

| Bucket | Amount | Purpose |
|---|---|---|
| **Final E2E run** | $1.30 | One full first-pass run on a representative essay (~$1.00) + one focused-mode iteration on the same essay (~$0.30). The pivot moment of the entire build. |
| **Final E2E fix-cycle re-runs** | $2.20 | ~7 fix-cycle re-runs at ~$0.30 each. Re-runs from broken step using persisted upstream output, not from step 1. Hard halt at the cap. |
| **Phase 1 — Landing detector calibration** | $0.50–$1.00 | One small fixture run (~3–5 known cases at Haiku pricing). Validates asymmetric tolerance + confidence floor. |
| **Phase 2 — Specifics-need emission sanity** | $0.50–$1.00 | One run on one fixture essay (Sonnet at usual layer cost, partial). Validates per-layer extension prompts emit on the right triggers. |
| **Phase 3 — Conversator dig + extractor sanity** | $1.50–$2.00 | One dig question composed, one realistic simulated student answer extracted. Validates non-leading composition + parallel structured-answer extraction. |
| **Phase 4 — L3.75 targeted-refresh contamination check** | $1.00–$1.50 | One run with section mask flagging 2 of 10 sections. Validates unflagged sections come back unchanged. |
| **Phase 4 — Tier 2 synthesis non-repetition smoke** | $0.50–$1.00 | One run on a fixture iterationLedger with deliberately-repetitive prior taughtMoves. Validates non-repetition contract holds in practice. |
| **Slack** | $0.30–$1.50 | Buffer. Not allocated; consumed only for unforeseen need with cost-ledger justification. |

**Total mid-build API spend target: ~$4.00–$6.50. Total final E2E + fix cycles: ~$3.50. Total cap: $10.**

If a mid-build touchpoint runs over its allocation, halt and reassess before spending. If cumulative mid-build spend approaches $7 before all targeted touchpoints have been validated, halt and reassess. If the final E2E reveals issues consuming fix-cycle budget faster than ~$0.30/cycle, halt before cycle 6 and ask whether the build has unmet readiness conditions.

The cost-budget memory's $5/run cap stays honored — no individual run exceeds $5; the aggregate is across many small disciplined runs each ≤$2.

### 0.5 Code-side preconditions

- Branch from `feat/wave-3a-phase-3b-3c` (current working branch) into `feat/l5-redesign-build` for the redesign work. All deliverables land in this branch; merge to main only after E2E run passes Tue review.
- Working dev environment: `npx tsc --noEmit` clean on baseline before D-0.1; existing tests pass.
- A `BUILD_COST_LEDGER.md` file is created at the build branch root in Phase 0; every API call records cost, model, prompt, fixture, output-quality-note. Ledger is the audit trail for the $10 cap.

---

## 1. The dependency graph — the spine

Each node is a deliverable ID. Each edge is "blocks." The graph is the canonical execution order. Read it once at the start; consult whenever a deliverable's order is in question.

```
PHASE 0 — TYPES + MIGRATIONS + TELEMETRY (no LLM cost)
  D-0.1   IterationLedger + TaughtMove + CarryForwardDecision + IterationRecord types
  D-0.2   UnderstandingQuestion source + status + DigContext extensions
  D-0.3   GroundTruthFact + StoryFragment + IntentSignal types
  D-0.4   ConversatorSessionEntry type
  D-0.5   EssayProfile root field additions
  D-0.6   Migration: essay_chat_conversations table
  D-0.7   Migration: essay_ground_truth table
  D-0.8   Migration: EssayProfile JSONB field additions + backfill
  D-0.9   Telemetry hook scaffolding (per-step event emitter)
  D-0.10  BUILD_COST_LEDGER.md scaffold + cost-recording utilities
  D-0.11  Mock-LLM testing framework (deterministic-output fixtures, error-injection helpers)
  D-0.12  No-fallback ESLint rule (custom rule: warn on Promise.allSettled without explicit-error pattern)
  D-0.13  Test-coverage tooling configured (target: 100% line coverage on new code, every error path exercised)
  D-0.14  Phase 0 cross-phase integrity audit
  D-0.15  Phase 0 integration test (types compile, migrations apply, telemetry emits, mocks work, lint clean, coverage verified)

PHASE 1 — DEAD-WIRE FIX + ITERATION LEDGER
  D-1.1   IterationLedger constructor + accessor on EssayProfile load
  D-1.2   taughtMoves[] append at L5 call end
  D-1.3   Landing detector skeleton (Haiku call + structured output validation)
  D-1.4   Landing detector prompt (3+ rounds: contract, adversarial-thinking, comparison)
  D-1.5   Landing detector calibration check (mid-build API touchpoint #1, ~$0.50–$1.00)
  D-1.6   priorAnnotations builder (taughtMoves → Map<paragraph, ctx>)
  D-1.7   priorAnnotations builder index-remap on structural reorder (F7 mitigation)
  D-1.8   analysisOrchestrator.ts:850 wire-up (priorAnnotations populated)
  D-1.9   reanalysisOrchestrator.ts:1177 wire-up (parallel fix)  — SUBSUMED BY D-1.8 (2026-04-28; no parallel callsite exists)
  D-1.10  Iteration lifecycle bracket (5-piece: entry-increment + L5-buffer + end-commit + snapshot + re-analysis ledger continuity) — scope expanded 2026-04-28 to close 5 dead wires
  D-1.11  CarryForwardDecision append at orchestrator decision points
  D-1.12  Halt-on-error orchestration policy applied (full code-review pass)
  D-1.13  TaughtMove ID stability property test
  D-1.14  IterationLedger append-only invariant test
  D-1.15  Mock-LLM integration test (full iteration 1→2 flow with mocked layer responses)
  D-1.16  Failure-injection test (every error boundary in orchestrator throws + surfaces correctly)
  D-1.17  Phase 1 cross-phase integrity audit
  D-1.18  Phase 1 cumulative cost-ledger check

PHASE 2 — SPECIFICSNEED AGGREGATOR + QUEUE EXTENSION
  D-2.1   QuestionQueueManager extension (new source + statuses + dig sub-object handling)
  D-2.2   L3 walk prompt extension (3+ rounds; emit specifics-need from raisesQuestions[])
  D-2.3   L3.5 analysis prompt extension (3+ rounds; emit on low-confidence sentences)
  D-2.4   L3.75 holistic prompt extension (3+ rounds; emit from gaps[], redFlags[], etc.)
  D-2.5   L4 northStar prompt extension (3+ rounds; emit on hypothesis-confidence)
  D-2.6   FindingStore stuck-hypothesis emission path (3+ rounds)
  D-2.7   specificsNeedAggregator.ts (deterministic, dedup logic, schema-validate emissions)
  D-2.8   Aggregator integration into analysisOrchestrator
  D-2.9   Specifics-need emission sanity check (mid-build API touchpoint #2, ~$0.50–$1.00)
  D-2.10  Queue persistence concurrency test (simulated concurrent reads/writes)
  D-2.11  Aggregator dedup property test (idempotency under repeated invocation)
  D-2.12  Mock-LLM integration test (multi-layer emission, queue accumulation, persistence across iteration)
  D-2.13  Phase 2 cross-phase integrity audit
  D-2.14  Phase 2 cumulative cost-ledger check

PHASE 3 — CONVERSATOR
  D-3.1   Conversator service skeleton (essayConversator.ts, sub-files)
  D-3.2   conversatorPersistence.ts (modeled on activity-side precedent)
  D-3.3   Chat intent classifier (Haiku, six routes)
  D-3.4   Chat intent classifier prompt (3+ rounds: contract, adversarial, confusion-matrix)
  D-3.5   digQuestionComposer.ts (Sonnet, framing + non-leading)
  D-3.6   Dig-question composer prompt (3+ rounds: contract, adversarial, comparison)
  D-3.7   digAnswerExtractor.ts (Sonnet, parallel factual?/narrative?/intent?)
  D-3.8   Dig-answer extractor prompt (3+ rounds: contract, adversarial, comparison)
  D-3.9   Conversator dig + extractor sanity check (mid-build API touchpoint #3, ~$1.50–$2.00)
  D-3.10  continuousChatHandler.ts (six route handlers)
  D-3.11  Per-route prompts × 6 (3+ rounds each)
  D-3.12  conversatorTimingPolicy.ts (pure logic, when to fire dig)
  D-3.13  EssayConversatorPanel UI component (continuous chat surface)
  D-3.14  Conversator-to-analysis feedback wiring (groundTruth/story/intent flow into next iteration prompts)
  D-3.15  Halt-on-error orchestration policy applied (full code-review pass, Conversator scope)
  D-3.16  Mock-LLM integration test (full dig E2E with simulated student answer, all six chat routes)
  D-3.17  Failure-injection test (every Conversator error boundary)
  D-3.18  Phase 3 cross-phase integrity audit
  D-3.19  Phase 3 cumulative cost-ledger check

PHASE 4 — L3.75 TARGETED-REFRESH + TIER 2 SYNTHESIS + SURFACE COMPOSER
  D-4.1   L3.75 targeted-refresh prompt variant + section-mask handling
  D-4.2   L3.75 targeted-refresh prompt (3+ rounds: contract, adversarial, comparison)
  D-4.3   L3.75 targeted-refresh contamination check (mid-build API touchpoint #4, ~$1.00–$1.50)
  D-4.4   Section-invalidation flag computation in editUnderstandingService
  D-4.5   l5TierTwoSynthesizer.ts (Tier 2 Sonnet call)
  D-4.6   Tier 2 synthesis prompt (3+ rounds: contract, adversarial, comparison)
  D-4.7   Tier 2 non-repetition smoke (mid-build API touchpoint #5, ~$0.50–$1.00)
  D-4.8   l5SurfaceComposer.ts (composes the 10 surfaces)
  D-4.9   Cross-iteration synthesis (Haiku, iteration ≥ 3, reads taughtMoves chain)
  D-4.10  Cross-iteration synthesis prompt (3+ rounds)
  D-4.11  Budget redirection mechanism (20% fraction, deeper-treatment allocator)
  D-4.12  Cost trajectory test (5-iteration mock simulation matches design's cost predictions)
  D-4.13  Mock-LLM integration test (full L3.75 + Tier 2 + surface composer flow)
  D-4.14  Phase 4 cross-phase integrity audit
  D-4.15  Phase 4 cumulative cost-ledger check

PHASE 5 — UI SURFACES (frontend, no LLM cost)
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
  D-5.12  Visual regression tests (snapshot per surface against fixture-derived data)
  D-5.13  Accessibility audit per surface
  D-5.14  Non-negotiables verification per surface (zero internal-state leak, zero verdict language, zero convergence pressure surfaced — read every rendered surface, verify)
  D-5.15  Phase 5 cross-phase integrity audit
  D-5.16  Phase 5 readiness audit (full system pre-E2E gate)

PHASE 6 — SINGLE E2E VALIDATION RUN (the pivot)
  D-6.1   Pick representative essay + capture as fixture
  D-6.2   Pre-E2E readiness audit (final review against all governing docs and integration tests)
  D-6.3   E2E run iteration 1 (~$1.00, full pipeline, comprehensive mode)
  D-6.4   Inspection moment 1 (surfaces rendered, contracts hold, all 8 non-negotiables verified)
  D-6.5   Conversator dig + simulated student answer
  D-6.6   Inspection moment 2 (extraction captured intent)
  D-6.7   E2E run iteration 2 (~$0.30, focused mode, after small edit)
  D-6.8   Inspection moment 3 (carry-forward correct, no repetition, structured answer surfaced)
  D-6.9   IterationLedger telemetry deep inspection
  D-6.10  Inspection moment 4 (telemetry well-formed, redirection fired, cost trajectory matches design)
  D-6.11  Tue review at the system level — the iteration that calibrates the build
  D-6.12  Fix-cycle deliverables (one per Tue review note; each ≤$0.30 re-run if API needed)
```

The graph is the spine. Detail follows.

---

## 2. Phase 0 — Types + Migrations + Telemetry (1.5–3 days, no LLM cost)

**Goal.** Schema-level support for everything that follows. No user-facing changes; no LLM behavior changes. All subsequent phases depend on this foundation.

### D-0.1 — IterationLedger + TaughtMove + CarryForwardDecision + IterationRecord types

- **Type:** TypeScript type definitions.
- **File:** `src/services/essayIntelligence/profileTypes.ts` (extend at end of file).
- **Depends on:** none.
- **Blocks:** D-1.1, D-1.2, D-1.3, D-1.10, D-1.11, all subsequent phases.
- **Contract:** Exact types as specified in `L5_ITERATION_LOOP_DESIGN.md` §7.1. Verbatim — no field additions, no field removals, no semantic changes from the spec.
- **Behavior spec:** Type definitions only. No runtime behavior. `npx tsc --noEmit` passes. JSDoc comments per field naming the design-doc section the field comes from.
- **Failure surface:** Type errors at compile. Caught by D-0.15.
- **Validation:** Type-check passes; audit rows 251–258 reference these types correctly.
- **Revision discipline:** read the iteration design §7.1 type spec, write the types, read again against the spec, refactor if any drift, commit. No ambiguous fields ship; every field has a JSDoc comment naming what populates it and what reads it (per audit §A3).
- **Effort:** 2–4 hours.

### D-0.2 — UnderstandingQuestion source + status + DigContext extensions

- **Type:** Type extension.
- **File:** `src/services/essayIntelligence/profileTypes.ts:4261` (existing UnderstandingQuestion).
- **Depends on:** none.
- **Blocks:** D-2.1.
- **Contract:**
  - Add `'analysis_specifics_gap'` to `UnderstandingQuestion.source` literal union.
  - Add `'asked_to_student' | 'student_answered' | 'student_declined'` to `UnderstandingQuestion.status` literal union.
  - Add `dig?: DigContext` field to UnderstandingQuestion (per `L5_E2E_INTEGRITY_AUDIT.md` §3.1).
  - DigContext type defined inline or in sibling file with full field set per E2E audit §3.1: `whyAsked`, `expectedAnswerShape`, `consumers[]`, `populates[]`, `framingSeed`, `askedAt?`, `conversatorMessageId?`, `studentAnswerRaw?`, `structuredAnswer?`, `extractionPending?`. All ten fields.
- **Behavior spec:** Type extensions only. Existing `QuestionQueueManager` continues to compile.
- **Validation:** Type-check passes.
- **Revision discipline:** verify the existing queue manager's type usage is unaffected; verify the existing 5 sources still work; verify the existing 3 statuses still work; verify the new fields are additive only.
- **Effort:** 1–2 hours.

### D-0.3 — GroundTruthFact + StoryFragment + IntentSignal types

- **Type:** Type definitions.
- **File:** `src/services/essayIntelligence/profileTypes.ts` or new `conversator/types.ts` (decide based on what the implementer judges cleanest; a new file under conversator/ is fine since the types are conversator-adjacent).
- **Depends on:** none.
- **Blocks:** D-3.1, D-3.7, D-0.5.
- **Contract:** Exact types per `L5_E2E_INTEGRITY_AUDIT.md` §4.5. All three types. Each with full field set.
- **Behavior spec:** Type definitions only. JSDoc comments per field.
- **Validation:** Type-check passes.
- **Effort:** 1–2 hours.

### D-0.4 — ConversatorSessionEntry type

- **Type:** Type definition.
- **File:** `src/services/essayIntelligence/conversator/types.ts`.
- **Depends on:** none.
- **Blocks:** D-0.5, D-3.2.
- **Contract:** Type for chat session entries: `id: string`, `timestamp: string` (ISO), `sender: 'student' | 'system'`, `messageContent: string`, `digQuestionId?: string`, `focusItemRef?: string` (id of focus item the message references if any), `route?: ChatRoute` (which route the classifier picked, populated only for system responses), `structuredAnswerRef?: string` (id of GroundTruthFact / StoryFragment / IntentSignal record this message captured if any).
- **Validation:** Type-check passes.
- **Effort:** 30 minutes.

### D-0.5 — EssayProfile root field additions

- **Type:** Type extension.
- **File:** `src/services/essayIntelligence/profileTypes.ts` (EssayProfile interface).
- **Depends on:** D-0.1, D-0.3, D-0.4.
- **Blocks:** D-1.1, D-3.1, D-0.8.
- **Contract:** Add to EssayProfile root: `iterationLedger: IterationLedger`, `groundTruthFacts: GroundTruthFact[]`, `storyFragments: StoryFragment[]`, `intentSignals: IntentSignal[]`, `conversatorSessionLog: ConversatorSessionEntry[]`. All required (initialize to defaults on profile create).
- **Behavior spec:** Type definitions; defaults documented in JSDoc (empty arrays; iterationLedger with currentIteration=0, all sub-arrays empty).
- **Validation:** Type-check passes; existing essayProfileManager.ts updates to initialize defaults on profile creation.
- **Revision discipline:** trace every `EssayProfile` consumer in the existing codebase via grep + agent dispatch (Explore agent on a thoroughness=very thorough setting); verify none of the new required fields breaks an existing access pattern; if any does, list and address before commit.
- **Effort:** 2–4 hours including the trace.

### D-0.6 — Migration: `essay_chat_conversations` table

- **Type:** Supabase migration + RLS policy.
- **File:** `supabase/migrations/<timestamp>_essay_chat_conversations.sql`.
- **Depends on:** none.
- **Blocks:** D-3.2, D-0.15.
- **Contract:** Schema mirrors `activity_chat_conversations` per `L5_E2E_INTEGRITY_AUDIT.md` §4.6. Columns: `id (uuid pk default gen_random_uuid())`, `profile_id (text fk to profiles.user_id)`, `essay_id (text fk to essays.id)`, `conversation_state (jsonb default '{}'::jsonb)`, `phase (text default 'foundation')`, `total_turns (int default 0)`, `is_active (bool default true)`, `token_usage (jsonb default '{}'::jsonb)`, `created_at (timestamptz default now())`, `updated_at (timestamptz default now())`. Indexes on `(profile_id, essay_id)`, `(profile_id, is_active)`. RLS enabled with policies matching the activity-side pattern: server-side admin client writes via service role; reads gated by Clerk-auth middleware ensuring user owns the profile.
- **Behavior spec:** Schema only. Empty table on creation. RLS prevents direct client access from non-server contexts.
- **Failure surface:** Migration fails on apply → caught by D-0.15. RLS policy mismatch → caught at integration test against a non-admin client.
- **Validation:** Migration applies cleanly on a Supabase branch via `supabase db push` against a test branch. Insert + select round-trip works under admin client. Direct client query (with anon role) is denied.
- **Revision discipline:** spawn a security-architect agent to review the RLS policies before commit; absorb feedback; commit only when the policies are right.
- **Effort:** 3–5 hours.

### D-0.7 — Migration: `essay_ground_truth` table

- **Type:** Supabase migration + RLS policy.
- **File:** `supabase/migrations/<timestamp>_essay_ground_truth.sql`.
- **Depends on:** none.
- **Blocks:** D-3.7, D-3.13, D-0.15.
- **Contract:** Columns: `id (uuid pk)`, `profile_id (text fk)`, `essay_id (text)`, `record_type (text check in ('fact','fragment','intent'))`, `record_data (jsonb)`, `dig_question_id (text)`, `applies_to_paragraph (int)`, `applies_to_sentence (int)`, `confidence (text)`, `captured_at (timestamptz default now())`. Index on `(profile_id, essay_id, record_type)`, `(dig_question_id)`. RLS as above.
- **Validation:** Migration applies; insert + select round-trip works.
- **Revision discipline:** same security-architect review as D-0.6.
- **Effort:** 2–3 hours.

### D-0.8 — Migration: EssayProfile JSONB field additions + backfill

- **Type:** Supabase migration + TS-side serializer update + backfill SQL.
- **File:** `supabase/migrations/<timestamp>_essay_profile_iteration_ledger.sql` + serializer code in `essayProfileManager.ts`.
- **Depends on:** D-0.5.
- **Blocks:** D-1.1, D-0.15.
- **Contract:** EssayProfile JSONB blob gains `iterationLedger`, `groundTruthFacts`, `storyFragments`, `intentSignals`, `conversatorSessionLog` fields. The migration includes a backfill: every existing profile row gets the default empty fields added to its JSONB blob via an idempotent `UPDATE` with appropriate `WHERE` clauses (only update rows missing the keys).
- **Behavior spec:** Existing profiles load successfully with the new fields populated to defaults. New profiles save with the fields.
- **Failure surface:** Existing profile load fails after migration → halt and rollback. The migration must be tested against a *copy* of staging data before merging to main.
- **Validation:** Existing profile reads through the new schema; round-trip save preserves the new fields; migration is idempotent (running twice doesn't double-apply).
- **Revision discipline:** the backfill SQL is the hard part; spawn an Explore agent to identify every profile-state-touching code path and confirm the backfill doesn't break any of them; spawn a database-best-practices agent (using the Supabase Postgres skill) to review the migration SQL for performance and idempotency.
- **Effort:** 4–6 hours.

### D-0.9 — Telemetry hook scaffolding

- **Type:** Service.
- **File:** `src/services/essayIntelligence/telemetry/iterationTelemetry.ts` (new file).
- **Depends on:** D-0.1.
- **Blocks:** every subsequent deliverable that orchestrates a step.
- **Contract:**
  ```ts
  interface IterationTelemetryEvent {
    iteration: number;
    step: string;
    paragraphIndex?: number;
    status: 'started' | 'succeeded' | 'failed';
    error?: { message: string; code?: string; context?: Record<string, unknown> };
    cost?: number;
    tokenUsage?: { inputTokens: number; outputTokens: number; cacheReadTokens?: number; cacheWriteTokens?: number };
    durationMs?: number;
    model?: string;
    timestamp: string;
  }

  export function emitIterationEvent(event: IterationTelemetryEvent): void;
  export function emitStepStart(iteration: number, step: string, context?: Record<string, unknown>): { stepId: string };
  export function emitStepSuccess(stepId: string, output?: { cost?: number; tokenUsage?: ... }): void;
  export function emitStepFailure(stepId: string, error: Error, context?: Record<string, unknown>): void;
  ```
  Emit-side writes structured events to `iterationLedger.iterations[currentIteration].events[]` AND to a structured console log with prefix `[IterationTelemetry]` for tail-able local dev.
- **Behavior spec:** Pure event emission. No retries. No fallback. If emit throws, the calling code halts (no swallowed errors).
- **Failure surface:** Emit failure surfaces immediately to caller.
- **Validation:** Unit test: emitting an event populates the ledger and the console log; emitting a failure surfaces to a configurable telemetry sink.
- **Revision discipline:** the API has to feel right; if it doesn't, refactor before any consumer wires through it. Cost: refactoring the API after 50 call sites is expensive; refactoring it before any call site is free.
- **Effort:** 4–6 hours.

### D-0.10 — `BUILD_COST_LEDGER.md` scaffold + cost-recording utilities

- **Type:** Documentation file + utility function.
- **File:** `BUILD_COST_LEDGER.md` at branch root + `src/services/essayIntelligence/telemetry/buildCostLedger.ts`.
- **Depends on:** D-0.9.
- **Blocks:** every API-touching deliverable.
- **Contract:**
  - `BUILD_COST_LEDGER.md` is a markdown table tracking every API call: deliverable id, date, model, prompt name, fixture used, input tokens, output tokens, cost USD, output quality note, cumulative spend.
  - The utility function is called by the LLM adapter (`src/lib/llm/claude.ts` or wherever the calls go through) on every call. It auto-appends to the ledger file AND emits a telemetry event.
  - Hard halt at $9 cumulative (warn at $7, halt at $9). The halt mechanism throws a structured error preventing the next API call.
- **Behavior spec:** Every API call records in the ledger. The cumulative cost gate is enforced at the LLM call boundary, not at the deliverable boundary (so even a runaway test can't blow the cap).
- **Failure surface:** Halt at $9 throws `BuildCostCapExceededError` with cumulative + last-call context. Caller halts the deliverable.
- **Validation:** Mock LLM call records correctly in ledger; cumulative is monotonically increasing; halt fires at $9.
- **Revision discipline:** test the halt mechanism end-to-end before any real API call.
- **Effort:** 3–4 hours.

### D-0.11 — Mock-LLM testing framework

- **Type:** Test infrastructure.
- **File:** `tests/test-helpers/mockLlm.ts` + `tests/fixtures/llm-outputs/` directory of canned outputs derived from existing on-disk fixtures.
- **Depends on:** D-0.9.
- **Blocks:** every Phase 1+ integration test.
- **Contract:**
  - `mockLlmCall(promptName: string, fixtureKey: string): Promise<MockLlmResponse>` — looks up a deterministic response by (prompt name, fixture key).
  - `mockLlmFailure(promptName: string, errorKind: 'timeout' | 'parse_error' | 'rate_limit' | 'malformed_output'): Promise<never>` — throws a specific failure to test error paths.
  - The fixture directory contains mock outputs derived from existing on-disk fixtures (`tests/output/checkpoint3/`, `tests/calibration/top-tier-reference/`) — so the mocks return realistic structured outputs, not synthetic ones.
  - The framework supports per-test configuration of which prompt → which response → which failure mode.
- **Behavior spec:** Mocks behave deterministically; tests are reproducible; no API spend during testing.
- **Validation:** A self-test of the mock framework: spin up a mock, assert it returns the expected response, assert it throws the expected error.
- **Revision discipline:** the existing fixtures are real LLM output from past paid runs; treat them as ground truth. Don't fabricate new mock outputs; derive from existing.
- **Effort:** 6–8 hours including fixture extraction.

### D-0.12 — No-fallback ESLint rule

- **Type:** Custom ESLint rule.
- **File:** `eslint-rules/no-silent-fallback.js` + `.eslintrc` updates.
- **Depends on:** none.
- **Blocks:** every subsequent code-review pass.
- **Contract:** Custom rule that flags:
  - `Promise.allSettled` calls without explicit per-result error handling (look for the `.filter(r => r.status === 'rejected')` follow-up; if missing, warn).
  - try/catch blocks where the catch body neither re-throws nor calls a telemetry emit function.
  - `?? defaultValue` patterns in critical paths (heuristic: any function whose name starts with `orchestrate`, `analyze`, `generate`, `build`).
- **Behavior spec:** ESLint warnings (not errors initially) for review during code-review pass; promotes to errors after Phase 1 stabilizes.
- **Validation:** rule fires correctly on synthetic test cases; doesn't fire on the legitimate-pattern cases (e.g., `Promise.allSettled` with explicit error filtering is fine).
- **Effort:** 4–5 hours.

### D-0.13 — Test-coverage tooling configured

- **Type:** Tooling.
- **File:** `package.json` script + `vitest.config.ts` or equivalent coverage config.
- **Depends on:** none.
- **Blocks:** every test deliverable.
- **Contract:** Coverage tool (vitest's c8 or sibling) configured with target: 100% line coverage on new code in `src/services/essayIntelligence/conversator/`, `src/services/essayIntelligence/telemetry/`, and any new file added during the build. Existing-code coverage is informational only (don't gate on it).
- **Behavior spec:** `npm run test:coverage` produces a report; new files covered at 100%.
- **Validation:** CI integrates the coverage report; PRs failing the threshold are visible.
- **Effort:** 2–3 hours.

### D-0.14 — Phase 0 cross-phase integrity audit

- **Type:** Documentation deliverable + checklist run.
- **File:** `docs/audit/phase-0-integrity-audit.md`.
- **Depends on:** D-0.1 through D-0.13.
- **Blocks:** D-0.15.
- **Contract:** Re-read every governing doc that gates Phase 1; verify Phase 0's deliverables honor every type contract from `L5_ITERATION_LOOP_DESIGN.md` §7.1, every schema contract from `L5_E2E_INTEGRITY_AUDIT.md` §4.6, every audit row 251–270 in `L5_CONSUMPTION_AUDIT.md` §A3. Walk the dependency graph; check every Phase 0 → Phase 1 edge has a corresponding type or migration in place.
- **Behavior spec:** Audit doc lists every governing-doc claim against the deliverable that satisfies it; gaps are flagged and addressed before D-0.15.
- **Validation:** the audit doc is the validation; Tue does not review Phase 0 audits but they exist in the repo for reference.
- **Revision discipline:** spawn an agent (general-purpose) to read the governing docs and the deliverables in parallel and produce the gap list; absorb the gaps before the next phase.
- **Effort:** 3–5 hours.

### D-0.15 — Phase 0 integration test (Phase 0 → Phase 1 gate)

- **Type:** Integration test.
- **File:** `tests/integration/phase0-types-migrations.ts`.
- **Depends on:** D-0.1 through D-0.14.
- **Blocks:** Phase 1 entry.
- **Contract:**
  1. `npx tsc --noEmit` passes against the full repo.
  2. Migrations applied cleanly to a Supabase test branch (use `supabase db push` against a branch).
  3. Round-trip: create essay profile → verify default empty `iterationLedger`, `groundTruthFacts`, etc. → save → reload → fields persist; modify each new field → save → reload → modifications persist.
  4. Telemetry hook emits structurally valid events; events appear in the ledger.
  5. Mock-LLM framework returns deterministic responses; throws errors correctly.
  6. `BUILD_COST_LEDGER.md` is initialized; cost-recording utility writes a sample entry.
  7. ESLint custom rule fires on synthetic test cases.
  8. Test coverage is 100% on new files.
- **Behavior spec:** All eight checks pass. Any failure halts Phase 1 entry.
- **Failure surface:** Each sub-check produces a structured error report; halt on first failure; fix at source; re-run from broken sub-check.
- **Validation:** This deliverable IS the validation; gates Phase 1.
- **Effort:** 4–6 hours.

**Phase 0 totals: 1.5–3 days. No LLM cost. Phase 1 cannot start until D-0.15 passes.**

---

## 3. Phase 1 — Dead-wire fix + Iteration Ledger (5–8 days)

**Goal.** The iteration loop's center starts working. Iteration N's L5 reads what iteration N-1 taught with landing status. Visible improvement: no more verbatim repetition across iterations.

> *Reminder: this build has unlimited time, unlimited tokens, unlimited revision cycles, unlimited agent dispatches. The single hard constraint is the $10 cap. Every component, from smallest to largest, gets full focus and effort.*

### D-1.1 — IterationLedger constructor + accessor on EssayProfile load

- **Type:** Service extension.
- **File:** `src/services/essayIntelligence/profileManager/essayProfileManager.ts`.
- **Depends on:** D-0.1, D-0.5, D-0.8.
- **Blocks:** D-1.2, D-1.10, D-1.11.
- **Contract:** On profile load, ensure `iterationLedger` is populated; if the loaded JSONB is missing the field (legacy profile pre-migration), initialize with defaults and log a structured warning to telemetry. On profile create, `iterationLedger.currentIteration = 1`. Provide an explicit `getCurrentIteration(profile: EssayProfile): number` accessor and `incrementIteration(profile: EssayProfile, triggeredBy: 'first_pass' | 'edit' | 'student_request'): void` mutator.
- **Behavior spec:** Load any profile, then access `profile.iterationLedger` — never null. Increment `currentIteration` only at iteration trigger (not at load).
- **Failure surface:** Load failure on a corrupt iterationLedger → fail-fast with diagnostic naming the corrupt field. Increment without reason → throw.
- **Validation:** Unit tests covering: fresh profile, legacy profile, corrupt iterationLedger, increment with each trigger reason.
- **Revision discipline:** trace every existing profile-load call site (Explore agent thoroughness=very thorough) and confirm the new accessor is wired; if any call site bypasses the accessor and reads `iterationLedger` directly, decide whether to migrate to the accessor or keep direct access (document why).
- **Effort:** 3–5 hours.

### D-1.2 — `taughtMoves[]` append at L5 call end

- **Type:** Service extension.
- **File:** `src/services/essayIntelligence/analysis/deepAnnotationService.ts` (post-call hook) + `analysisOrchestrator.ts` (commit point).
- **Depends on:** D-1.1.
- **Blocks:** D-1.3, D-1.6, D-4.9.
- **Contract:** After `deepAnnotationService.generateAnnotations()` returns its `L5AnnotationResult`, transform each `L5Annotation` into a `TaughtMove` per the type at D-0.1. Stable ID format: `M-{iteration}-{paragraphIndex}-{annotation.id}`. *(Spec amendment 2026-04-29 — original spec text said `{sequenceInParagraph}`; the implementation uses `annotation.id` because a per-paragraph sequence counter is non-deterministic across runs (annotation generation order is not guaranteed stable). `L5Annotation.id` is itself stable and unique within an `L5AnnotationResult`, satisfying both "stable across runs" (D-1.13) and "unique within (iteration, paragraphIndex)". Rationale lives at `taughtMoveBuilder.ts:24-31`.)* Append to a transient buffer (the `iterationLedger.taughtMoves[]` commit happens at orchestrator end via D-1.10, not in deepAnnotationService directly — keeps the L5 call pure).
- **Behavior spec:** After every L5 generation in a fresh-or-iteration run, the relevant TaughtMoves are queued for commit. `landing` field is null at this stage (populated next iteration by landing detector).
- **Failure surface:** TaughtMove construction throws on missing required L5Annotation fields → fail-fast; iteration halts before commit.
- **Validation:** Mock-LLM unit test: feed a fixture L5AnnotationResult, assert the buffered TaughtMoves match the expected shape. Property test: TaughtMove ID stability — same L5Annotation in two runs produces the same TaughtMove ID (deterministic) (D-1.13).
- **Revision discipline:** the ID format is load-bearing for cross-iteration carry-forward; verify it's stable under all the L5Annotation shapes that exist in the existing codebase (Explore agent reads existing L5AnnotationResult fixtures, lists every shape, confirms ID generation handles all of them).
- **Effort:** 4–6 hours.

### D-1.3 — Landing detector skeleton (Sonnet call + structured output validation)

- **Type:** Service.
- **File:** `src/services/essayIntelligence/analysis/landingDetector.ts` (new).
- **Depends on:** D-1.2.
- **Blocks:** D-1.5, D-1.6, D-3.14, D-4.9.
- **Contract:**
  ```ts
  interface LandingDetectorInput {
    priorTaughtMove: TaughtMove;
    edit: { oldText: string; newText: string; significance: 'minor' | 'moderate' | 'significant' | 'transformative' };
    newAnalysisAtLocation?: { symptomFlagged: boolean; reasoning?: string };
    chatBehavior?: { engaged: boolean; mood: 'curious' | 'frustrated' | 'dismissive' | 'neutral'; raw?: string };
  }

  interface LandingDetectorOutput {
    status: 'addressed' | 'partially_addressed' | 'unaddressed' | 'changed_target';
    confidence: number; // 0-1
    reasoning: string;
    signalsUsed: Array<'edit_vs_critique' | 'redetection' | 'chat_behavior'>;
  }

  export async function detectLanding(input: LandingDetectorInput): Promise<LandingDetectorOutput>;
  ```
  Single Sonnet call per (TaughtMove, iteration). *(Spec amendment 2026-04-29 — original spec text said "Haiku"; implementation uses `claude-sonnet-4-5-20250929` per Tue's 2026-04-27 model policy: new build-phase sites use Sonnet when single-call cost stays under $0.10 OR when judgment matters. Landing detection weighs three signals into a 4-way classification — narrow taxonomy but the weighting is judgment, not pattern-matching. Per-call cost ≈ $0.0019 on a typical payload, well under the $0.10 ceiling. Cost budget at D-1.5 below is unchanged in absolute dollars; if anything Sonnet's per-call cost is comparable to Haiku at this token volume.)* Structured output enforced via Anthropic SDK's tool-use or JSON-mode. **Confidence floor 0.7 to count as `addressed`; below → `partially_addressed`.** Per Q4 confirmation.
- **Behavior spec:** LLM-judged combiner reads all three signals; outputs structured shape.
- **Failure surface:** Sonnet call failure → throw; caller halts. JSON parse failure → throw with raw output in error context. Confidence < 0 or > 1 → throw schema-validation error.
- **Validation:** Mock-LLM unit test for the orchestration; the prompt's quality is validated at D-1.5 (mid-build API touchpoint).
- **Revision discipline:** the structured-output validation has to be airtight — schema mismatch is one of the easiest LLM bugs to ship and one of the hardest to debug post-hoc.
- **Effort:** 5–7 hours.

### D-1.4 — Landing detector prompt (3+ rounds)

- **Type:** Prompt deliverable.
- **File:** `src/services/essayIntelligence/analysis/prompts/landingDetector.prompt.ts` + `landingDetector.RATIONALE.md`.
- **Depends on:** D-1.3 contract.
- **Blocks:** D-1.5.
- **Contract:** Prompt body per `L5_ITERATION_LOOP_DESIGN.md` §5.2. Structured output specification matching the LandingDetectorOutput type. Asymmetric tolerance language baked in (per §5.3 of the iteration design — bias toward not-skipping uncertain landings; partial_addressed default below 0.7 confidence).
- **Revision protocol — three rounds at minimum, more if needed:**
  1. **Round 1: contract pass.** Draft against the design contract. Verify structured output shape matches type. Verify required fields present. Verify the prompt names the four `status` enum values explicitly. Verify the prompt instructs the LLM to weigh A/B/C signals and report `signalsUsed`. Verify confidence-floor language present.
  2. **Round 2: adversarial-thinking pass.** Imagine adversarial inputs without running them: a `partially_addressed` case with low confidence — does the prompt's instruction set produce `partially_addressed` or hallucinate `addressed`? An edit that addresses the location but misses the critique's intent — does the prompt distinguish? Signal A says addressed but signal B says still flagged — which wins, and is the prompt clear about that? Walk through ~5–7 imagined cases on paper; refine the prompt for each weakness.
  3. **Round 3: comparison pass.** Draft a second variant of the prompt (different phrasing, different ordering, different anchor examples). Read both side-by-side. Pick the one that produces cleaner, more grounded outputs in the imagined cases. Document why in the RATIONALE.md.
  4. **Additional rounds if quality isn't landing.** Don't ship a prompt that merely passes round 3 if it could be sharper. The prompt is done when reading it, you can answer "what would this LLM produce on input X?" with high confidence and no ambiguity.
- **Validation:** RATIONALE.md is the artifact; mid-build API touchpoint at D-1.5 is the empirical check.
- **Effort:** 4–8 hours (varies based on revision rounds; budget for more, not less).

### D-1.5 — Landing detector calibration check (mid-build API touchpoint #1)

- **Type:** Targeted API validation.
- **Cost budget:** $0.50–$1.00 from the $10 cap.
- **Depends on:** D-1.3, D-1.4.
- **Blocks:** D-1.6.
- **Contract:** Prepare ~3–5 known cases:
  1. A clear `addressed` case (TaughtMove from a prior fixture; an edit that obviously addresses the critique).
  2. A clear `unaddressed` case (TaughtMove and an edit that clearly doesn't engage the critique).
  3. An ambiguous case (edit moves toward the critique but doesn't fully land).
  4. A `changed_target` case (edit transforms the location enough that the critique doesn't apply).
  5. A low-confidence case (edit that's hard to judge — should produce `partially_addressed` with confidence < 0.7).
- Run the landing detector on each. Inspect outputs. Compare against the implementer's intuition of the expected status.
- **Behavior spec:** All five cases produce status outputs that match expectation. Confidence values are in plausible ranges. Reasoning text grounds in the edit and the critique.
- **Failure surface:** If outputs disagree with expectation, the prompt is wrong — return to D-1.4 round 4. **Do not run the calibration check more than 2 times mid-build** (cost cap). If the second run still disagrees, halt and escalate to Tue with the prompt + outputs + what's failing.
- **Output:** `landingDetector.calibration.md` recording the 5 cases, their inputs, the outputs, and the implementer's assessment. The cost is recorded in `BUILD_COST_LEDGER.md`.
- **Effort:** 3–5 hours.

### D-1.6 — `priorAnnotations` builder (taughtMoves → Map<paragraph, ctx>)

- **Type:** Service.
- **File:** `src/services/essayIntelligence/analysis/priorAnnotationsBuilder.ts` (new).
- **Depends on:** D-1.2, D-1.3.
- **Blocks:** D-1.7, D-1.8.
- **Contract:** Per `L5_ITERATION_LOOP_DESIGN.md` §7.5 pseudo-flow. Reads `iterationLedger.taughtMoves[]` filtered to `taughtAtIteration === currentIteration - 1`. For each, runs landing detector. Groups by `paragraphIndex`. Returns `Map<number, PriorAnnotationContext>` matching the existing type at `profileTypes.ts:4839–4848`. *(Spec amendment 2026-04-29 — original line range 4613–4622 was correct at spec authoring time but drifted with file growth; the type itself is unchanged.)*
- **Behavior spec:** On iteration 1, returns `undefined` (no priors). On iteration ≥ 2, returns a populated Map; each PriorAnnotationContext includes the original annotation summary and the `addressedByEdit: boolean` derived from landing.status (`'addressed'` → true; everything else → false).
- **Failure surface:** Landing detector failure on any move → throw with structured context naming the move id; orchestrator halts. Index-remap on structural reorder is D-1.7.
- **Validation:** Mock-LLM unit test feeding mock landing-detector responses; asserting the Map structure matches expected.
- **Effort:** 4–6 hours.

### D-1.7 — priorAnnotations builder index-remap on structural reorder (F7 mitigation)

- **Type:** Service extension.
- **File:** `priorAnnotationsBuilder.ts`.
- **Depends on:** D-1.6.
- **Blocks:** D-1.8.
- **Contract:** On structural reorder (paragraphs reordered, added, removed), the builder applies index remapping from `editUnderstandingService.diff.paragraphChanges[]` before constructing the Map. If the remapping is ambiguous (paragraph deleted), the move is dropped from priorAnnotations rather than misattributed; the underlying Finding (if any) carries the durable claim instead.
- **Behavior spec:** A reorder edit (P2↔P3) produces a correctly-keyed priorAnnotations Map (the iter-1 P3 moves go to iter-2 P2's slot). A delete (paragraph removed) drops associated moves from the Map but doesn't error. A insert (paragraph added) leaves the Map's existing entries unchanged but doesn't error.
- **Failure surface:** Remap function error → throw; orchestrator halts. Drop decision (when remap is ambiguous) emits a structured telemetry event with `status:'failed'` and a `move_dropped` code (per round-2 audit LOW-1 — drops are visible in the audit trail, not silent). The drop is not an iteration-fatal error; the orchestrator continues with a reduced priorAnnotations map. *(Spec amendment 2026-04-29 — original spec text said "logged but not an error"; round-2 audit deliberately strengthened this to a status:'failed' event so the audit trail captures the drop site.)*
- **Validation:** Synthetic fixtures simulating each edit type (reorder, insert, delete, multi-paragraph) — assert the remapped Map for each.
- **Revision discipline:** the index remapping is the part of the system that's hardest to debug post-hoc. Test extensively with synthetic cases. Spawn a Plan agent to enumerate every edge case.
- **Effort:** 5–7 hours.

### D-1.8 — `analysisOrchestrator.ts:891` wire-up (priorAnnotations populated)

- **Type:** Service extension.
- **File:** `src/services/essayIntelligence/analysis/analysisOrchestrator.ts`.
- **Depends on:** D-1.6, D-1.7.
- **Blocks:** D-1.10, D-1.12, D-1.15.
- **Contract:** Replace the hard-coded `undefined` at line 891 with a call to `priorAnnotationsBuilder.build(profile, currentIteration)`. *(Spec amendment 2026-04-29 — original line was 850 at spec authoring time but the call site moved to 891 by the time D-1.8 landed; D-1.9's closure note already cites line 891.)*
- **Behavior spec:** L5 generation in iteration ≥ 2 receives populated priorAnnotations Map. The L5 prompt at deepAnnotationService.ts:1402–1416 already consumes this correctly.
- **Failure surface:** Builder failure → orchestrator halts.
- **Validation:** Mock-LLM integration test asserts the L5 call's argument list contains a populated Map on iteration 2.
- **Effort:** 1–2 hours.

### D-1.9 — `reanalysisOrchestrator.ts:1177` wire-up (parallel fix) — **SUBSUMED BY D-1.8**

- **Status (resolved 2026-04-28):** No-op deliverable. Pre-flight investigation confirmed that **only one `deepAnnotationService.generateAnnotations` callsite exists in the entire codebase** — `analysisOrchestrator.ts:891`, wired in D-1.8. The "parallel fix" the original spec described does not exist.
- **Evidence (gathered 2026-04-28):**
  1. Three independent greps (call expression, named imports, runtime symbol) found exactly one callsite. Only `analysisOrchestrator.ts` has a runtime import of `deepAnnotationService`; everything else (`l5ManifestMerger.ts`, `taughtMoveBuilder.ts`) imports types only.
  2. `reanalysisOrchestrator.ts:1177` is `totalCost += reanalysisResult.totalCost;` inside `processEditAndMaybeReanalyze` — not an L5 callsite. The line numbers in the original spec referred to an older revision.
  3. The re-analysis path already benefits from D-1.8: `reanalysisOrchestrator.triggerReanalysis()` calls `analyzeEssay(pipelineInput, brief)`, which routes through the wired callsite at `analysisOrchestrator.ts:891`. D-1.8 made this stronger by also threading `priorEssayText` (from `versionTracker.getActiveVersion().baselineText`) and `editSignificance` (from `lastEditUnderstanding.significance`) into `pipelineInput`, so the composer receives the LLM-judged signals instead of falling back to mechanical derivation.
  4. `focusedAnalyzer.ts` does its own targeted-Sonnet analysis-delta calls but never invokes `deepAnnotationService.generateAnnotations` — no parallel L5 surface there either.
  5. The `L5_E2E_INTEGRITY_AUDIT.md §2.1` cited by the original spec only lists `analysisOrchestrator.ts:850` as the dead-wire site; it does NOT mention a parallel site at `reanalysisOrchestrator`. The spec's "(per E2E audit §2.1, both orchestrators have the dead wire)" was inaccurate to what's actually in the audit.
- **Architectural invariant (locked):** there is exactly ONE L5 callsite, and it goes through `buildPriorAnnotationsForOrchestrator` (the D-1.8 composer). Future code that adds a NEW L5 callsite without going through the composer must be rejected at code review — the composer is the single source of truth for priorAnnotations.
- **Defensive coverage:** the D-1.8 integration test (`tests/integration/d1-8-prior-annotations-wireup.test.ts`) tests the composer's contract directly. If a future change adds a parallel callsite, the regression will surface as the new callsite either (a) lacks the `priorAnnotations` argument or (b) constructs it without the composer's invariants — both would fail review.
- **Downstream:** D-1.12 and D-1.15 (which the original spec said were blocked by D-1.9) are unblocked because D-1.8 covers the surface they need.
- **Effort:** 0 hours (deliverable closed).

### D-1.10 — Iteration lifecycle bracket: entry-increment, L5-output buffering, end-commit, snapshot, ledger continuity

- **Type:** Service extension (multi-piece — the iteration lifecycle is wired here as a single unit so producer/consumer pairs activate together; the spec's original literal scope was insufficient and would have left D-1.8 and prior deliverables inert in production).
- **Files:** `analysisOrchestrator.ts` (entry + L5-buffer + end-commit), `reanalysisOrchestrator.ts` (PipelineInput threading), `essayProfileManager.ts` (createNew accepts optional priorLedger seed; getCurrentIterationRecord helper if needed).
- **Depends on:** D-1.1, D-1.2, D-0.9, D-1.8.
- **Blocks:** D-4.11 (budget redirection reads from this), D-1.15 (integration test).

**Audit-driven scope expansion (2026-04-28).** Pre-flight investigation surfaced FIVE dead wires across D-1.1, D-1.2, D-0.9, and D-1.8 — every Phase 1 producer's intended write site was deferred to a future deliverable and never landed. The iteration loop cannot function end-to-end without all five being closed. They share a single touch site (orchestrator entry/end) and share a transactional commit, so they belong in one deliverable. The five pieces:

1. **Entry: increment iteration counter.** `incrementIteration(profile, triggeredBy)` at orchestrator entry — closes Dead Wire #1 (D-1.1's writer was orphaned). `triggeredBy: 'first_pass' | 'edit' | 'student_request'` — direct `analyzeEssay` defaults to `'first_pass'`; `reanalysisOrchestrator` threads `'edit'` or `'student_request'`. Profile arrives with `currentIteration: 0` (fresh) or `N` (resumed); increment makes it `1` or `N+1`.

2. **Mid-Phase 6: buffer L5-output TaughtMoves.** After `deepAnnotationService.generateAnnotations` returns its `L5AnnotationResult`, transform via `l5AnnotationsToTaughtMoves(annotations, currentIteration)` and call `bufferTaughtMoves(currentIteration, transformedMoves)` — closes Dead Wire #2 (D-1.2's transient buffer producer was orphaned). The buffer holds moves until end-commit.

3. **End: commit IterationRecord + flush taughtMoves + flush telemetry + populate snapshotText.** At orchestrator end (after costs tallied, before return), construct an `IterationRecord` with: `iteration: currentIteration`, `triggeredBy`, `editScope?` (when re-analysis), `carryForwardSummary` (D-1.11 will populate richly; first pass uses empty stubs), `costBreakdown` from costTracker, `comprehensiveBaselineCost: 0` for first pass, `escalationLevel: 0`, `rationale: ''`, `startedAt/finishedAt`, `events: flushEventsForIteration(currentIteration)`, **`snapshotText: profile.essayText`**. Push onto `iterationLedger.iterations[]`. Append flushed buffer to `iterationLedger.taughtMoves[]`. Clear both buffers (taughtMoves + telemetry) AFTER successful checkpoint write — closes Dead Wires #2 (consumer side), #4 (telemetry flush), #5 (`iterations[]` write), and activates D-1.8's `snapshotText` consumer.

4. **Re-analysis ledger continuity.** `reanalysisOrchestrator.triggerReanalysis()` currently calls `analyzeEssay(pipelineInput)` which calls `EssayProfileCoordinator.createNew(...)` → resets `iterationLedger` to `{currentIteration: 0, iterations: [], taughtMoves: [], recentDecisions: []}`. **The prior history is silently discarded.** Fix: extend `PipelineInput` with `priorIterationLedger?: IterationLedger`. When supplied, `createNew` uses it as the seed for the new coordinator's profile. `reanalysisOrchestrator` reads `this.coordinator.getProfile().iterationLedger` and threads it forward — closes Dead Wire #3.

5. **Atomic commit semantics.** "Transactional with profile save" interpretation: write all updates (currentIteration, iterations[], taughtMoves[], recentDecisions[]) to the in-memory profile FIRST via the coordinator's mutation path; THEN `await this.safeCheckpoint(coordinator, 'after_iteration_commit')`. If checkpoint throws, the in-memory state is in an invariant-valid post-commit shape (the ledger has the new entry), but the persistence didn't happen. The orchestrator throws with structured context so the caller sees "iteration N did not persist; rerun" — this matches the spec's "Both commits transactional with profile save (atomic — either both succeed or neither does)" interpretation. We do NOT roll back the in-memory state on checkpoint failure (a) because there's no clean rollback primitive in EssayProfileCoordinator and (b) because the next run's checkpoint write will overwrite anyway.

**Behavior spec (post-D-1.10):** After every iteration:
- `iterationLedger.currentIteration` increments by 1.
- `iterationLedger.iterations[]` grows by 1 (containing the new IterationRecord with snapshotText, events, costBreakdown, etc.).
- `iterationLedger.taughtMoves[]` grows by `count of L5 annotations` (or 0 if L5 was skipped).
- D-1.8's composer transitions from "always returns undefined" to "returns populated Map on iter ≥ 2 with prior taughtMoves." This is the inflection point where the iteration loop becomes functional.

**Failure surface:**
- `incrementIteration` validation throw at entry → orchestrator halts before any layer runs; surfaces "iteration N could not start; profile state corrupt."
- L5-buffer call failure → swallowed at the buffer level (the buffer is best-effort; a transient buffer failure is not worth halting an entire iteration over). [REVISIT during D-1.10 implementation: this may need to halt instead per the no-fallback charter; test will tell.]
- End-commit construction error (malformed IterationRecord) → throw fail-fast.
- Checkpoint write failure → throw with structured "iteration N did not persist; rerun" context. In-memory ledger remains in post-commit shape; rerun on the same profile will succeed if the underlying storage issue is resolved.

**Validation:**
- Integration test runs iteration 1 (first-pass via `analyzeEssay`) and asserts post-iteration ledger has `currentIteration: 1`, `iterations.length: 1`, `iterations[0].snapshotText === essayText`, `iterations[0].events` populated from telemetry.
- Integration test runs iteration 2 (re-analysis via `reanalysisOrchestrator`) on the post-iter-1 profile; asserts `currentIteration: 2`, `iterations.length: 2`, prior `iterations[0]` preserved, `taughtMoves[]` accumulated across both iterations, D-1.8's composer received populated priorAnnotations on iter 2.
- Property: ledger append-only invariant (every iteration only adds to arrays, never rewrites existing entries) — D-1.14's territory but provable here.

**Revision discipline:** the iteration lifecycle is the foundation of every subsequent deliverable (D-1.11 carry-forward decisions, D-1.12 halt-on-error pass, D-1.15 integration test). A bug here cascades. Spawn a Plan agent to enumerate every entry/exit edge case (cold start, resumed re-analysis with stale ledger, missing L5 result, L5 skipped, partial-result early returns from buildPartialResult). The plan should enumerate where in the orchestrator each step lands (line numbers) before any code is written.

**Effort:** 8–12 hours including the integration test. Up from spec's literal 3–4 because the literal scope was insufficient.

### D-1.11 — CarryForwardDecision append at orchestrator decision points

- **Type:** Service extension (multi-piece — the decision-point producer wiring + the synthesis bridge that closes the consumer dead-wire are both required for the audit data to be load-bearing within Phase 1; see scope expansion below).
- **Files:** `analysisOrchestrator.ts`, `focusedAnalyzer.ts`, `reanalysisOrchestrator.ts`, `essayProfileManager.ts` (mutators), `analysis/carryForwardSynthesis.ts` (new).
- **Depends on:** D-1.1, D-1.10, D-1.8.
- **Blocks:** D-4.11.

**Audit-driven scope expansion (2026-04-28).** Pre-D-1.11 audit surfaced
that `recentDecisions[]` had ZERO downstream readers — without an in-build
consumer, D-1.11 would land inert (same dead-wire shape as D-1.1's
`incrementIteration` pre-D-1.10). The expansion makes `commitIterationRecord`
itself the primary consumer (synthesizes `IterationRecord.carryForwardSummary`
from filtered decisions) so the audit data is load-bearing within Phase 1
rather than write-only until D-4.11. The expansion also surfaced a 5th
decision point the original spec missed (DP-5: focused-mode preserves all
10 holistic sections — the BIG carry-forward win that makes focused-mode's
cost story honest).

**Contract:** Append a `CarryForwardDecision` entry to
`iterationLedger.recentDecisions[]` at every orchestrator decision point.
Original spec named four (mode selection, per-paragraph re-derive vs carry,
finding maturity refresh, L3.75 section invalidation); the audit added a
fifth (DP-5: focused-mode holistic-carry). At iteration end, synthesize
`IterationRecord.carryForwardSummary` from the iteration's decisions and
prune `recentDecisions[]` to the last 5 iterations.

Five decision points (DP-1 through DP-5):
- DP-1 mode-selection (`reanalysisOrchestrator.processEditAndMaybeReanalyze`
  threads through PipelineInput.modeSelectionDecision; analyzeEssay appends
  AFTER incrementIteration so the iteration validator passes)
- DP-2 per-paragraph priorAnnotations (analysisOrchestrator Phase 6)
- DP-3a walk findingEvolutions (analysisOrchestrator after L3 walk)
- DP-3b synthesis findingEvolutions (analysisOrchestrator after L3.75)
- DP-4 delta synthesis (analysisOrchestrator W5.4a block)
- DP-5 focused-mode holistic-carry — DEFERRED to a future focused-mode
  iteration commit deliverable; focused-mode doesn't go through analyzeEssay
  so has no IterationRecord to attach decisions to.
- DP-3c focused-mode findingEvolutions — same deferral.

15-step audit-driven implementation: Step 0 (essay-keyed taughtMove buffer)
+ Step 1 (type prep) + Steps 2-3 (ledger mutators with test-first) + Steps
4-5 (synthesizer pure helper) + Steps 6-12 (4 decision-point wirings +
safe-append helper) + Step 13 (commitIterationRecord amendment) + Step 14
(integration test scenarios A-F) + Step 15 (essay-keyed telemetry buffer).
Supporting work bundled across 8 commits.

**Behavior spec (post-D-1.11):**
- Every iteration's recentDecisions[] reflects that iteration's actual
  decisions with rationale (until pruned).
- IterationRecord.carryForwardSummary contains the rolled-up
  carried/rederived/refreshed buckets synthesized from the decisions.
- `safeAppendCarryForwardDecision` swallows append-time validation throws
  with structured telemetry (the ONE charter-sanctioned swallow site;
  audit-trail bugs MUST NOT abort analysis).

**Failure surface:**
- `appendCarryForwardDecision` validation throw (iteration mismatch,
  missing fields, enum violations) → caller's safe-append helper logs +
  emits structured telemetry + returns false; analysis continues.
- Synthesis at commit-time: pure function over already-validated decisions;
  out-of-enum decision values silently dropped (caller's responsibility
  to validate at append time, not synthesizer's).

**Validation:** Integration test asserts recentDecisions populated and
carryForwardSummary synthesized correctly after iteration 2 across 6
scenarios (A: empty first-pass, B: focused/comprehensive arbitration,
C: per-paragraph carry, D: pruning, E: validation throw, F: walk
findingEvolution). Plus `safeAppendCarryForwardDecision` failure-swallow
unit tests.

**Effort:** 6–8 hours (audit-driven scope; up from spec's literal "3-4
hours mostly call-site additions" because the audit added the synthesis
bridge as a Phase-1 consumer to avoid the dead-wire pattern). Round 2
audit ratified the expansion 2026-04-28.

### D-1.12 — Halt-on-error orchestration policy applied (full code-review pass)

- **Type:** Code-review pass.
- **File:** `analysisOrchestrator.ts`, `reanalysisOrchestrator.ts`.
- **Depends on:** D-1.8 (D-1.9 subsumed; see its closure note).
- **Blocks:** D-1.16, D-1.17.
- **Contract:** Audit every `Promise.allSettled` and try/catch in both orchestrators. Any pattern that swallows errors and continues silently is rewritten to halt and surface the error with structured context.
- **Behavior spec:** No silent errors. Every layer call's failure halts the iteration with a diagnostic naming the layer + paragraph + error.
- **Validation:** ESLint custom rule (D-0.12) clean against the orchestrators. Manual review confirms every catch surfaces to telemetry.
- **Revision discipline:** spawn a code-review-style agent (general-purpose with explicit "no-fallback enforcement" charter) to read both orchestrators against the no-fallback checklist; absorb every flag.
- **Effort:** 4–6 hours including agent dispatch and absorption.

### D-1.13 — TaughtMove ID stability property test

- **Type:** Property test.
- **File:** `tests/property/taughtMoveIdStability.ts`.
- **Depends on:** D-1.2.
- **Blocks:** D-1.15.
- **Contract:** Property test battery asserting that for any given `(L5Annotation, iteration)` pair, `generateTaughtMoveId(annotation, iteration)` produces the same id regardless of context, time, or call order. *(Spec amendment 2026-04-29 — landed implementation expanded the original one-line contract into 8 orthogonal properties after parallel three-agent review; the expansion was audit-driven, not scope creep. Each property is justified inline in the test file.)*
- **Validation:** 8 properties × 1000 randomized shapes each (100 for the Symbol-cache check). Deterministic LCG seed (`0xD1130001`) so failures are reproducible at a specific commit hash.
  1. **Determinism** — repeated calls on the same `(annotation, iteration)` return the same id (back-to-back, no interleaving).
  2. **Reference-independence** — JSON round-trip yields a reference-distinct annotation whose id equals the original (catches WeakMap/Object.is/=== identity caches; does NOT catch Symbol-keyed caches — see Property 8).
  3. **Iteration sensitivity** — distinct iterations on the same annotation produce distinct ids.
  4. **Paragraph-index sensitivity** — distinct `paragraphIndex` (with same id, iteration) produces distinct ids.
  5. **Annotation-id sensitivity** — distinct `annotation.id` (with same paragraphIndex, iteration) produces distinct ids.
  6. **Field-only dependence** — mutating any field other than `id` or `location.paragraphIndex` leaves the id unchanged. Walks `Object.keys(annotation)` and throws on unhandled field shapes so future L5Annotation fields fail loud rather than silently slipping through.
  7. **Call-order independence** — interleaved/Fisher-Yates-shuffled call order produces the same ids as canonical order (catches stateful "last-call cache" or cross-call buffer pollution that Property 1's repetition would not catch).
  8. **Symbol-keyed cache resistance** — attaching/mutating a Symbol-keyed property on the SAME annotation reference does not affect the id (covers a bug class Property 2's JSON round-trip silently misses, since round-tripping strips Symbols).
- **Effort:** 2 hours (original); +1 hour for the audit-driven expansion at landing.

### D-1.14 — IterationLedger append-only invariant test

- **Type:** Property test.
- **File:** `tests/property/iterationLedgerAppendOnly.ts`.
- **Depends on:** D-1.10.
- **Blocks:** D-1.15.
- **Contract:** Property test asserting that across any sequence of iteration commits, no entry in `iterationLedger.iterations[]` or `iterationLedger.taughtMoves[]` is ever overwritten or removed (only appended). Mutation of an existing entry via the public API throws.
- **Carve-out (ratified D-1.15.0, 2026-04-29):** the `taughtMoves[i].landing` field is permitted exactly one post-commit transition: `undefined → populated` by the landing detector on the iteration after teaching. Any other landing mutation (`populated → mutated`, `populated → undefined`) is forbidden. `IterationRecord` array remains fully append-only — no carve-outs. See `tests/property/iterationLedgerAppendOnly.ts` top-of-file comment for ratification context. The carve-out is enforced by `assertTaughtMoveAppendOnlyWithLandingCarveOut` in Properties 1 and 5.
- **Validation:** Test simulates 100 iteration commits; asserts append-only with carve-out semantics.
- **Effort:** 2 hours (original); +1 hour for the D-1.15.0 carve-out helper + Property 5 self-test.

### D-1.15 — Mock-LLM integration test (full iteration 1→2 flow)

- **Type:** Integration test.
- **File:** `tests/integration/phase1-iteration-ledger.ts`.
- **Depends on:** D-1.10, D-1.11, D-1.13, D-1.14.
- **Blocks:** D-1.16.
- **Contract:** Use mock-LLM framework (D-0.11). Load a test essay; run iteration 1 with mocked layer responses; assert ledger state. Apply a small edit; run iteration 2 with mocked responses; assert priorAnnotations populated correctly, taughtMoves landed with `landing.status` populated, recentDecisions reflects iteration 2's decisions. Repeat for: structural reorder edit, paragraph delete, paragraph insert, multi-paragraph cascade.
- **Implementation deviations (D-1.15.7 audit closure 2026-04-30, ratified by Tue's standing autonomous-build authorization):**
  - D-0.11 (`mockLlmCall` framework) deliberately bypassed in favor of function-level `vi.mock` at the layer boundary. D-0.11's value-add is prompt-string → response-fixture lookup with parser robustness; D-1.15's contract is ledger-state assertions, not parser robustness. D-1.16's failure-injection test will use D-0.11's `mockLlmFailure` directly. Rationale at `tests/fixtures/d1-15/scenarios.ts` C-1 audit closure header.
  - Iter-1 setup uses direct seam primitives (`createInitialProfile + incrementIteration + bufferTaughtMoves + flushTaughtMovesForIteration + iterations.push`) rather than driving `analyzeEssay` through 8+ layer mocks. D-1.10's tests already proved the seam primitives compose correctly; driving the full pipeline on iter-1 would add no diagnostic value at the iter-2 boundary D-1.15 actually tests. Rationale at `tests/fixtures/d1-15/iter1Setup.ts` lines 8-44.
  - Iter-2 tests at the `buildPriorAnnotationsForOrchestrator` integration spine (NOT through `processEdit`). All five scenarios trigger comprehensive mode because Rule 1 of `FocusedAnalyzer.selectAnalysisMode` forces it for `confidenceLevel='initial'` fresh profiles. The contracts D-1.15 actually asserts (priorAnnotations Map, landing population via D-1.6.5, iter-2 commit shape, recentDecisions) all live at the builder seam. Rationale at `tests/integration/phase1-iteration-ledger.ts` top-of-file architectural decision block.
- **Validation:** All scenarios pass. 71 sub-cases across 5 scenarios + 30 harness smoke tests = 101 D-1.15 sub-cases. typecheck clean. Zero API spend.
- **Effort:** 5–8 hours (original); actual ~14 hours including discovery of F-01/F-02/F-03/F-04/F-08/F-09 dead wires (closed in prerequisite deliverables D-1.6.5 / D-1.6.6 / D-1.16-prefix before D-1.15.1 could land honestly), three-agent ratification audits per commit, and the consolidator audit pass at D-1.15.7. The discovery+remediation work is in scope but not in the spec's original effort estimate.

### D-1.16 — Failure-injection test (every error boundary)

- **Type:** Failure-injection test.
- **File:** `tests/integration/phase1-failure-injection.ts`.
- **Depends on:** D-1.12, D-1.15.
- **Blocks:** D-1.17.
- **Contract:** For every error-throwing path in the orchestrator and the priorAnnotations builder, mock-inject the error and verify:
  1. The error surfaces to telemetry with structured context.
  2. The orchestrator halts (does not continue past the failure).
  3. The error message includes enough information to diagnose at source (layer name, paragraph index, input identifier).
- **Validation:** All paths covered; all assertions pass.
- **Effort:** 4–6 hours.

### D-1.17 — Phase 1 cross-phase integrity audit

- **Type:** Audit.
- **File:** `docs/audit/phase-1-integrity-audit.md`.
- **Depends on:** D-1.16.
- **Blocks:** D-1.18.
- **Contract:** Re-read iteration design §3, §4, §5, §7; verify Phase 1 deliverables honor every contract. Walk the dependency graph; check every Phase 1 → Phase 2 edge has a corresponding deliverable in place. List any drift.
- **Validation:** the audit doc is the validation.
- **Effort:** 3–5 hours.

### D-1.18 — Phase 1 cumulative cost-ledger check

- **Type:** Cost audit.
- **File:** `BUILD_COST_LEDGER.md` review.
- **Depends on:** D-1.17.
- **Blocks:** Phase 2 entry.
- **Contract:** Sum the cumulative API spend through Phase 1. Should be ≤$1.00 (only D-1.5 is API-touching). If higher, halt and reassess. If lower, fine.
- **Validation:** Cumulative spend recorded; under the $1.00 mid-Phase-1 threshold.
- **Effort:** 30 minutes.

**Phase 1 totals: 5–8 days. LLM cost: $0.50–$1.00 (D-1.5 only).**

**Phase 1 outcome:** the dead wire is alive. Iteration 2's L5 reads iteration 1's taughtMoves with landing status. Verbatim repetition is structurally prevented. Mock-LLM integration tests prove the orchestration handles every iteration scenario correctly.

---

## 4. Phase 2 — SpecificsNeed aggregator + Queue extension (4–6 days)

**Goal.** The SpecificsNeed queue accumulates per-layer signals naming what the system needs from the student. Not yet surfaced (Conversator is Phase 3).

> *Reminder: continuous revision until quality lands. Three-round prompt revision is a minimum, not a maximum.*

### D-2.1 — QuestionQueueManager extension (new source + statuses + dig sub-object handling)

- **File:** `src/services/essayIntelligence/analysis/questionQueueManager.ts`.
- **Depends on:** D-0.2.
- **Blocks:** D-2.2 through D-2.6, D-2.7.
- **Contract:** Handle the new source `'analysis_specifics_gap'` and the three new statuses. Add a `getOpenAnalysisGapQuestions(): UnderstandingQuestion[]` accessor. Add status-transition methods: `markAskedToStudent(id, conversatorMessageId)`, `markStudentAnswered(id, structuredAnswer)`, `markStudentDeclined(id, reason)`. Each transition is validated (illegal transitions throw — e.g., can't go from `'resolved'` to `'asked_to_student'`).
- **Behavior spec:** Existing queue behavior preserved; new source/statuses queryable; transitions enforced.
- **Validation:** Unit tests for every status transition (legal and illegal); existing queue tests still pass.
- **Effort:** 3–4 hours.

### D-2.2 — L3 walk prompt extension (3+ rounds; emit specifics-need from raisesQuestions[])

- **File:** `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` (prompt body).
- **Depends on:** D-2.1.
- **Blocks:** D-2.7.
- **Contract:** Extend the walk prompt: "if a Finding's `deepeningPotential` cannot be advanced by re-reading the text alone, and the student's lived experience would resolve it, emit a specifics-need entry naming the question, the expected answer shape, and why this matters." Output schema extended with `specificsNeedEmissions: SpecificsNeedEmission[]`.
- **Revision protocol — three rounds at minimum.** Same as D-1.4; written self-validation only, no API.
- **Validation:** Mock-LLM unit test with a fixture walk output containing emissions; assert aggregator picks them up.
- **Effort:** 4–6 hours.

### D-2.3 — L3.5 analysis prompt extension (3+ rounds; emit on low-confidence sentences)

- Same shape as D-2.2.
- **Effort:** 4–6 hours.

### D-2.4 — L3.75 holistic prompt extension (3+ rounds; emit from gaps[], redFlags[], etc.)

- **Contract:** Extend the holistic prompt for emissions across multiple contributors (`momentEarnednessMap.gaps`, `intentBridge.alignments` mismatches, `voiceIdentity.authenticVsPerformed` flagged "performed", `admissionsPositioning.redFlags`). Each contributor's emission shape documented in the prompt.
- **Revision protocol:** three rounds. The L3.75 prompt is large; the extensions must integrate cleanly with the existing prompt without bloating it.
- **Effort:** 6–8 hours.

### D-2.5 — L4 northStar prompt extension (3+ rounds; emit on hypothesis-confidence)

- **Effort:** 3–5 hours.

### D-2.6 — FindingStore stuck-hypothesis emission path (3+ rounds)

- **Contract:** Per `L5_E2E_INTEGRITY_AUDIT.md` §3.2 (Findings contributor). On hypothesis-stuck findings (≥ 2 iterations alive), emit a specifics-need entry. Implementation: extend the existing maturity-refresh Haiku call's prompt OR add a small separate Haiku call (decide based on prompt complexity; default extend).
- **Effort:** 4–5 hours.

### D-2.7 — `specificsNeedAggregator.ts`

- **File:** `src/services/essayIntelligence/analysis/specificsNeedAggregator.ts` (new).
- **Depends on:** D-2.2 through D-2.6.
- **Blocks:** D-2.8.
- **Contract:** Pure deterministic. Inputs: per-layer specifics-need emissions. Outputs: deduplicated UnderstandingQuestion[] entries with source `'analysis_specifics_gap'`. Dedup logic: by `(anchorParagraph, expectedAnswerShape, framingSeed-similarity)`. New entries get fresh IDs; existing open queue questions matching new emissions get `iterationsSurvived++`. Schema-validate every emission; malformed → throw with layer + index context.
- **Validation:** Unit tests + property test for dedup idempotency (D-2.11).
- **Effort:** 5–7 hours.

### D-2.8 — Aggregator integration into analysisOrchestrator

- **Effort:** 2 hours.

### D-2.9 — Specifics-need emission sanity check (mid-build API touchpoint #2)

- **Cost budget:** $0.50–$1.00.
- **Contract:** One run on one fixture essay (use one of the existing `tests/output/checkpoint3/` essays). Inspect: does each non-trivial layer emit ≥1 specifics-need entry? Does the aggregator dedup correctly? Are the entries grounded in actual gaps?
- **Validation:** Manual inspection of the queue post-run.
- **Failure surface:** If any layer is silent when it should emit (e.g., L3.75's gaps[] are populated but no emission appears), the prompt extension is wrong — return to D-2.4 round 4. Do not run the sanity check more than 2 times. If second run still silent, halt and escalate.
- **Effort:** 3–4 hours.

### D-2.10 — Queue persistence concurrency test

- **File:** `tests/integration/queue-persistence-concurrency.ts`.
- **Contract:** Simulate concurrent reads and writes to the queue (multiple iterations triggering near-simultaneously); assert queue integrity.
- **Effort:** 3–4 hours.

### D-2.11 — Aggregator dedup property test

- **Contract:** Property test: running the aggregator twice on the same emissions doesn't double the queue.
- **Effort:** 2 hours.

### D-2.12 — Mock-LLM integration test (multi-layer emission, queue accumulation, persistence)

- **Effort:** 5–6 hours.

### D-2.13 — Phase 2 cross-phase integrity audit

- **Effort:** 3–5 hours.

### D-2.14 — Phase 2 cumulative cost-ledger check

- **Cumulative target:** ≤$2.00 through end of Phase 2.

**Phase 2 totals: 4–6 days. Cumulative LLM cost: ≤$2.00.**

---

## 5. Phase 3 — Conversator (8–12 days, the most prompt-heavy phase)

**Goal.** Continuous chat surface live. Dig questions fire. Answers captured and structured. Ground-truth/story-fragments/intent-signals persist.

> *Reminder: this is the phase with the most prompts. Each prompt gets 3+ rounds of revision. The Conversator is the medium through which the seven teaching moves reach the student; it cannot ship "good enough."*

### D-3.1 — Conversator service skeleton

- **File:** `src/services/essayIntelligence/conversator/essayConversator.ts` + sub-files.
- **Effort:** 5–7 hours.

### D-3.2 — `conversatorPersistence.ts`

- **Effort:** 4–6 hours.

### D-3.3 — Chat intent classifier (Haiku, six routes)

- **Effort:** 3–5 hours code (prompt is D-3.4).

### D-3.4 — Chat intent classifier prompt (3+ rounds)

- **Per-prompt revision protocol:** three rounds + confusion-matrix exercise (imagine ~20 fixture student messages, route each on paper, verify the prompt's instructions produce the expected route for each).
- **Effort:** 4–6 hours.

### D-3.5 — `digQuestionComposer.ts`

- **Effort:** 4–5 hours.

### D-3.6 — Dig-question composer prompt (3+ rounds; non-leading critical)

- **Per-prompt revision protocol:** three rounds. Critical: non-leading. Round 2 (adversarial) has the implementer imagine ~10 dig contexts and write the question themselves, then run the prompt on paper for the same contexts, and compare. The prompt's questions should be *better than* the implementer's manual version (or at least equivalently good); if they're worse, refine.
- **Effort:** 6–10 hours.

### D-3.7 — `digAnswerExtractor.ts`

- **Effort:** 4–6 hours.

### D-3.8 — Dig-answer extractor prompt (3+ rounds; parallel extraction)

- **Per-prompt revision protocol:** three rounds. Critical: parallel extraction (single answer can produce factual + narrative + intent simultaneously). Round 2 has the implementer imagine ~8 student answers of varying shapes (terse factual, verbose narrative, ambiguous, off-topic, contradicts essay, etc.) and trace what the extractor should produce for each.
- **Effort:** 6–10 hours.

### D-3.9 — Conversator dig + extractor sanity check (mid-build API touchpoint #3)

- **Cost budget:** $1.50–$2.00.
- **Contract:** Two API runs. (a) Compose one dig question from a fixture queue entry; assert the composed question is anchored to a specific moment in the essay, doesn't suggest an answer, asks for the expected answer shape, sounds curious not transactional. (b) Extract one realistic simulated student answer; assert it produces the right structured shape (typically all three sub-objects for a rich answer, or a subset for a focused answer).
- **Validation:** Manual inspection.
- **Failure surface:** If composition leads or extraction fails to capture parallel structures, return to prompt round 4. Hard cap at 2 runs.
- **Effort:** 4–5 hours.

### D-3.10 — `continuousChatHandler.ts` (six route handlers)

- **Effort:** 6–8 hours.

### D-3.11 — Per-route prompts × 6 (3+ rounds each)

- **Effort:** 12–18 hours total (~2–3 hours per route × 6 routes; each gets full three-round revision).

### D-3.12 — `conversatorTimingPolicy.ts` (pure logic)

- **Effort:** 3–4 hours.

### D-3.13 — EssayConversatorPanel UI component

- **Effort:** 8–12 hours (full component including session log rendering, message input, dig-question rendering, the eight non-negotiables verified).

### D-3.14 — Conversator-to-analysis feedback wiring

- **Contract:** Per `L5_E2E_INTEGRITY_AUDIT.md` §5. Inject `groundTruthFacts`, `storyFragments`, `intentSignals` as cached prompt blocks into L1/L3/L3.5/L3.75/L4/L5 prompts in subsequent iterations.
- **Effort:** 5–7 hours.

### D-3.15 — Halt-on-error orchestration policy applied (Conversator scope)

- **Effort:** 3–4 hours including agent dispatch.

### D-3.16 — Mock-LLM integration test (full dig E2E with simulated student answer)

- **Effort:** 6–8 hours.

### D-3.17 — Failure-injection test (every Conversator error boundary)

- **Effort:** 4–6 hours.

### D-3.18 — Phase 3 cross-phase integrity audit

- **Effort:** 4–6 hours.

### D-3.19 — Phase 3 cumulative cost-ledger check

- **Cumulative target:** ≤$4.00 through end of Phase 3.

**Phase 3 totals: 8–12 days. Cumulative LLM cost: ≤$4.00.**

---

## 6. Phase 4 — L3.75 targeted-refresh + Tier 2 synthesis + Surface composer (7–10 days)

**Goal.** Cost optimization lands; experience-target surfaces composed.

### D-4.1 — Lens-targeted re-run mechanism

> **[SUPERSEDED — was: "L3.75 targeted-refresh prompt variant + section-mask handling". Re-mapped per F2 R-2 (Phase 0 D-0.18). Post-absorption, no L3.75 layer exists to refresh.]**

- **Type:** Service.
- **File:** new `src/services/essayIntelligence/analysis/l3/lensTargetedRerun.ts`.
- **Contract:** Per-lens invalidation flags + selective lens re-runs + optional Pass 3 re-run. The "single Sonnet call with section masks" mechanism is REMOVED. Voice / Meaning / Story / Admissions lenses each have an invalidation flag; editUnderstandingService computes which lenses are invalidated by an edit (D-4.4). Only flagged lenses re-run. Pass 3 re-runs only if a re-run lens contributes to a Pass 3 cross-dimension field.
- **Effort:** 6–10 hours (this is the canonical replacement of the legacy L3.75 mechanism).

### D-4.2 — Per-lens prompt instructions for re-run mode (3+ rounds; most consequential prompt set)

> **[SUPERSEDED prose retained for context: was "L3.75 targeted-refresh prompt (3+ rounds)" — re-mapped per F2 R-2. Post-absorption: each lens prompt (D-4a.2 / D-4a.3 / D-4a.4 / D-4a.5) gains re-run-mode instructions that read priorLensOutput + describe what changed since the prior iteration's emission.]**

- **Per-prompt revision protocol:** three rounds at minimum, **expect to do more**. Critical: each lens's re-run instructions must instruct the LLM NOT to re-derive what hasn't changed (preserving carry-forward) while also reading the changed paragraphs with full attention. Round 2 (adversarial) imagines ~10 edit-scope configurations (1 paragraph changed, 3 changed, reorder-only, etc.) and traces whether the prompt would correctly carry vs re-derive.
- **Effort:** 8–14 hours across the 4 lens prompts (incremental on top of D-4a.2–D-4a.5).

### D-4.3 — Lens-mask honoring contamination check (mid-build API touchpoint #4)

> **[SUPERSEDED — was: "L3.75 targeted-refresh contamination check". Re-mapped per F2 R-2.]**

- **Cost budget:** $1.00–$1.50.
- **Contract:** One run with only Voice lens flagged invalid; Meaning / Story / Admissions / Pass 3 carried. Diff the carried lens outputs against the prior iteration's; assert byte-for-byte equal. The Voice lens output should regenerate cleanly (with depth) and replace prior Voice fields. Cost is the Voice lens Sonnet call (~$0.06–$0.10).
- **Validation:** Diff comparison on carried fields; manual inspection of regenerated Voice output.
- **Failure surface:** If carried lenses come back changed, the lens-mask honoring is contaminated — return to D-4.2 round 4. Hard cap at 2 runs.
- **Effort:** 4–5 hours.

### D-4.4 — Section-invalidation flag computation in editUnderstandingService

- **Effort:** 5–6 hours.

### D-4.5 — `l5TierTwoSynthesizer.ts`

- **Effort:** 4–6 hours.

### D-4.6 — Tier 2 synthesis prompt (3+ rounds)

- **Per-prompt revision protocol:** three rounds + adversarial focus on non-repetition contract enforcement, multiplicity contract enforcement, deferred-surface re-cast. The prompt instructs the LLM to produce qualitativeSummary lede + focus surface + deferred + cross-iteration synthesis (when applicable).
- **Effort:** 10–14 hours.

### D-4.7 — Tier 2 non-repetition smoke (mid-build API touchpoint #5)

- **Cost budget:** $0.50–$1.00.
- **Contract:** One run with a fixture iterationLedger containing deliberately-repetitive prior taughtMoves. Assert the Tier 2 output's focus surface and deferred items don't re-teach addressed moves.
- **Failure surface:** If repetition leaks, return to D-4.6 round 4. Hard cap at 2 runs.
- **Effort:** 3–4 hours.

### D-4.8 — `l5SurfaceComposer.ts`

- **Contract:** Pure deterministic. Composes the ten experience-target surfaces from Tier 2 output + supporting data per audit §A2 surface map.
- **Effort:** 8–10 hours.

### D-4.9 — Cross-iteration synthesis (Haiku, iteration ≥ 3)

- **Effort:** 4 hours.

### D-4.10 — Cross-iteration synthesis prompt (3+ rounds)

- **Effort:** 4–6 hours.

### D-4.11 — ~~Budget redirection mechanism~~ DELETED per Tue's R-1 Resolution A (2026-04-26)

> **[DELETED — was: "Budget redirection mechanism (20% fraction, deeper-treatment allocator)". Tue selected Resolution A on 2026-04-26: "If it was retired let's not use it. Retirement was the right decision." See [`cross-cutting/CONSOLIDATION_FINAL_REVIEW.md`](../cross-cutting/CONSOLIDATION_FINAL_REVIEW.md) §7 TQ-1.]**
>
> **Replacement contract:** No mandated redirection fraction. The carry-forward already delivers the quality booster for free (iteration N's L5 receives priorAnnotations + matured findings — structurally deeper than iter-1 cold pass at no extra cost per `L5_ITERATION_LOOP_DESIGN.md` §1). Saved budget is genuine savings; extra spend is triggered by the existing escalation ladder (§6.4) Levels 1–4, NEVER scheduled.
>
> **What replaces this deliverable's work**: D-4.12 (cost trajectory test) verifies the predicted cost trajectory holds without redirection. D-1.10 / D-1.11 wire IterationRecord.escalationLevel + comprehensiveBaselineCost / carryForwardSavings (per D-0.1) so the audit trail captures the actual escalation pattern.
>
> - **Effort to delete:** 0 hours (no code was written; deliverable removed from build sequence).

### D-4.12 — Cost trajectory test

- **File:** `tests/integration/cost-trajectory-simulation.ts`.
- **Contract:** Mock-LLM 5-iteration simulation per iteration design's cost trajectory table. Assert per-layer per-iteration costs match the design's predictions within ±20%. (Mock costs derive from actual fixture token counts.)
- **Effort:** 4–5 hours.

### D-4.13 — Mock-LLM integration test (full L3.75 + Tier 2 + surface composer flow)

- **Effort:** 7–10 hours.

### D-4.14 — Phase 4 cross-phase integrity audit

- **Effort:** 4–6 hours.

### D-4.15 — Phase 4 cumulative cost-ledger check

- **Cumulative target:** ≤$6.50 through end of Phase 4.

**Phase 4 totals: 7–10 days. Cumulative LLM cost: ≤$6.50.**

---

## 7. Phase 5 — UI Surfaces (frontend, 7–10 days, no LLM cost)

**Goal.** End-to-end student experience visible.

### D-5.1 through D-5.9 — Surface components

- One component per surface per `L5_EXPERIENCE_TARGET.md` §5. Each ~6–10 hours including design, implementation, snapshot tests, accessibility audit, non-negotiables verification.
- **Total effort: 50–80 hours.**

### D-5.10 — EssayConversatorPanel integration into editor view

- **Contract:** Q1 placement decision (right rail / bottom drawer / floating) — implementer picks default, Tue confirms in review. Default: right rail per E2E audit §9 Q1.
- **Effort:** 6–8 hours.

### D-5.11 — UI route + page assembly

- **Effort:** 6–8 hours.

### D-5.12 — Visual regression tests (snapshot per surface)

- **Effort:** 4–6 hours.

### D-5.13 — Accessibility audit per surface

- **Effort:** 4–6 hours.

### D-5.14 — Non-negotiables verification per surface

- **Contract:** Read every rendered surface; verify:
  1. Zero internal-state leak (no PROVISIONAL markers, no corpusUnanchored flags, no model confidence levels exposed).
  2. Zero verdict language (no "good," "bad," "should," "fix," "wrong" in lead positions).
  3. Zero convergence pressure surfaced (Move 6 multiplicity actually surfaces 2–4 paths; the system isn't picking one as "best").
  4. Zero generic teaching (every surface anchored to specific essay text).
  5. Zero unmotivated suggestions (every focus item has Move 1 (why) and Move 7 (contribution) explicit).
  6. Zero suggestion without internalization path (every focus item has Move 3 (how the student applies elsewhere)).
  7. Zero repetition (within session and across iterations).
  8. Zero amnesia across iterations (TaughtMove.landing surfaces correctly in iteration ≥ 2).
- **Validation:** checklist signed off per surface.
- **Effort:** 6–8 hours.

### D-5.15 — Phase 5 cross-phase integrity audit

- **Effort:** 4–6 hours.

### D-5.16 — Phase 5 readiness audit (full system pre-E2E gate)

- **Type:** Comprehensive non-API readiness review.
- **File:** `docs/audit/pre-e2e-readiness-audit.md`.
- **Contract:**
  1. Every governing doc re-read; every contract verified against the deliverable that satisfies it.
  2. Every deliverable's mock-based integration test passes.
  3. Every deliverable's failure-injection test passes.
  4. Every audit row's verdict is honored by the corresponding code.
  5. ESLint custom rule clean across all new code.
  6. 100% line coverage on new code; every error path exercised.
  7. No orchestration deliverable has a `Promise.allSettled` without explicit error handling.
  8. Every prompt has a rationale doc.
  9. Every mid-build API touchpoint has its calibration result archived.
  10. Cumulative cost ledger ≤$6.50; final E2E budget reserved.
- **Behavior spec:** All 10 checks pass. The bar to authorize the final E2E API spend is high.
- **Failure surface:** any check failing halts E2E. Address at source. Re-run readiness.
- **Effort:** 8–12 hours of careful review.

**Phase 5 totals: 7–10 days. No LLM cost. Cumulative LLM cost still ≤$6.50.**

---

## 8. Phase 6 — Single E2E validation run (~$1.30 + ~$2.20 fix-cycle reserve; 1 day + Tue review + follow-up cycles)

**Goal.** Tue reviews the integrated output. The iteration that calibrates the entire build begins here.

### D-6.1 — Pick representative essay + capture as fixture

- Pick one realistic essay (multi-paragraph PIQ-style, foundation-or-architecture phase to exercise the full surface set). Capture as test fixture for reproducibility.
- **Effort:** 1 hour.

### D-6.2 — Pre-E2E readiness audit

- Final review against D-5.16 plus a fresh pass of every governing doc against every deliverable. The E2E run is authorized ONLY after this.
- **Effort:** 4–6 hours.

### D-6.3 — E2E run iteration 1 (~$1.00)

- Full pipeline (comprehensive mode); no prior state. Halts on any error.
- **Failure surface:** Step-level failures halt and surface. Diagnose at source. Fix at source. Re-run from broken step using persisted upstream output (each re-run ~$0.30 from the fix-cycle reserve).

### D-6.4 — Inspection moment 1

- Implementer reads rendered surfaces. Confirms all eight non-negotiables. Output: implementer's notes + the rendered surfaces archived.

### D-6.5 — Conversator dig + simulated student answer

- Conversator surfaces a high-priority queue question. Implementer types a realistic answer. Extractor runs.

### D-6.6 — Inspection moment 2

- Confirms extraction captured intent.

### D-6.7 — E2E run iteration 2 (~$0.30)

- Implementer applies a small edit; submits. Focused-mode pipeline runs end-to-end; landing detector active; targeted-refresh L3.75; Tier 2 re-composes.

### D-6.8 — Inspection moment 3

- Confirms: progress strip names earned items; landing detection correct; no repeated addressed moves; structured answer surfaces in relevant prompt block.

### D-6.9 — IterationLedger telemetry deep inspection

- Inspect the full ledger; cost trajectory; redirection allocation; carry-forward decisions; landing detector confidence distribution; chat intent classifier route distribution.

### D-6.10 — Inspection moment 4

- Confirms: telemetry well-formed; redirection fired correctly; ledger records the iteration's actual decisions. Cost trajectory matches design predictions.

### D-6.11 — Tue review at the system level

- Implementer prepares a comprehensive review packet:
  - The rendered surfaces from both iterations (screenshots + structured data).
  - The Conversator dig question + student answer + structured extraction.
  - The iteration ledger telemetry (cost trajectory, decisions, redirected budget).
  - The per-prompt outputs that landed in the surfaces (lede, focus surface, voice anchor, etc.).
  - The mid-build API touchpoint calibration results.
  - The non-negotiables verification.
- Tue reads the integrated output; reviews against the experience target's eight non-negotiables and the iteration design's contracts; surfaces what works, what doesn't, what to iterate.
- Output: Tue's notes; the implementer addresses each note as a follow-up deliverable.
- **Effort:** Tue review session (4–8 hours of focused review by Tue; can span multiple sessions).

### D-6.12 — Fix-cycle deliverables

- One per Tue review note. Typically prompt iteration, surface composition tweaks, or specific code fixes — *not* architectural redesign (architectural changes go through a fresh design pass).
- API spend per cycle: ~$0.30 if a re-run is needed; many cycles will be code-only (no API).
- **Hard halt at $9 cumulative.** If approaching, halt and reassess with Tue.
- **Effort:** depends on Tue's notes; budget 3–7 days.

**Phase 6 totals: 1 day E2E + Tue review session + 3–7 days fix-cycles. Total API spend: $1.30 base + up to $2.20 fix-cycles = ~$3.50 reserved budget consumed.**

**Cumulative LLM cost ceiling: $10. Likely actual: $7–9.**

---

## 9. The prompt revision protocol (three rounds at minimum)

Every prompt deliverable in this plan honors this protocol. Three rounds is the floor; more rounds happen as needed until the prompt lands.

### Round 1 — Contract pass

1. Read the design contract for the prompt (the section of the governing doc that names what the prompt has to do).
2. Draft the prompt against the contract verbatim. Every required field of the structured output is named. Every constraint (non-leading, non-repetition, etc.) is explicit.
3. Self-review: read the prompt; verify it would produce the structured output shape; verify it would honor the constraints; verify it grounds the LLM in the input shape it'll receive.

### Round 2 — Adversarial-thinking pass

1. Imagine 5–10 adversarial input cases. Examples for the landing detector: clear `addressed`, clear `unaddressed`, ambiguous, `changed_target`, low-confidence, signal-A-says-yes-signal-B-says-no, structural-target-shift.
2. For each imagined case, trace on paper what the prompt would produce. Does the output match the expected status / shape?
3. For every case where the prompt would produce wrong output, refine the prompt's instructions or examples.
4. Repeat until the prompt handles every imagined adversarial case.

### Round 3 — Comparison pass

1. Draft a second variant of the prompt with different phrasing, ordering, or anchor examples.
2. Read both variants side-by-side against the imagined adversarial inputs from Round 2.
3. Pick the variant that produces cleaner outputs. Document the rationale in `<promptName>.RATIONALE.md`.

### Additional rounds

If after Round 3 the prompt still has weaknesses (a sentence that leads, a constraint that's too soft, an output schema that's ambiguous), do Round 4. Do Round 5. Land the prompt.

### Per-prompt artifacts on commit

- The prompt itself (committed as `prompts/<name>.prompt.ts` or inline in the calling service).
- `<name>.RATIONALE.md` — what the prompt is trying to do, what alternatives were considered, why this version won, what failure modes it's designed against.
- `<name>.fixtures.md` — the canonical input examples (drawn from existing on-disk fixtures) and the accepted outputs (mock outputs derived from the fixtures or, post-mid-build-API-touchpoint, real outputs archived).

### Prompts subject to mid-build API touchpoints

Five prompts get a small empirical check during build (the targeted touchpoints in §0.4): landing detector (D-1.5), specifics-need emissions (D-2.9), Conversator dig + extractor (D-3.9), L3.75 targeted-refresh (D-4.3), Tier 2 non-repetition (D-4.7). Every other prompt is purely written-self-review during build, validated empirically only at the final E2E.

---

## 10. Mock-LLM testing protocol

Every integration test in every phase uses mock-LLM. The framework (D-0.11) provides:

- **Deterministic mock outputs** derived from existing on-disk fixtures (`tests/output/checkpoint3/`, `tests/calibration/top-tier-reference/`). Realistic shapes; not synthetic.
- **Error injection** at the call boundary (`mockLlmFailure(promptName, errorKind)`).
- **Per-test configuration** — which prompt → which response → which failure mode.

### Mock-LLM testing principles

- **Test orchestration logic, not LLM behavior.** The mocks return what we expect the LLM to produce; the test asserts the system handles those outputs correctly.
- **Test every error path.** For every layer call, write a test that mock-injects each plausible error (timeout, rate limit, malformed output, parse error) and asserts the failure surfaces as designed.
- **Test boundary conditions.** Empty inputs, null inputs, max-size inputs, malformed inputs.
- **Test idempotency** for deterministic operations (the priorAnnotations builder, the SpecificsNeed aggregator, the surface composer).
- **Test concurrency** for shared state (the queue, the iteration ledger).

### When mock-LLM is insufficient

The five mid-build API touchpoints. Mock-LLM cannot validate prompt output quality; only running the LLM can. The touchpoints are the targeted moments where empirical validation is worth the API spend.

The final E2E run. Mock-LLM cannot validate that the integrated system produces the experience the design promised; only running the full pipeline against a real essay can.

---

## 11. Cross-phase integrity audits (the protocol)

Run after every phase, before advancing:

1. **Re-read every governing doc that gates the next phase.** For Phase 2: re-read iteration design §3 (carry-forward inventory), §4 (per-layer policies), §7 (state types). For Phase 3: re-read E2E audit §3 (SpecificsNeed signal), §4 (Conversator design), §5 (feedback loop).
2. **Check every audit row this phase touched.** Did the phase's deliverables honor the row's verdict? Did any row get missed?
3. **Walk the dependency graph fully.** Are all Phase N → Phase N+1 edges satisfied?
4. **Code-coverage assessment.** 100% on new code in this phase?
5. **No-fallback ESLint rule clean** across the phase's new code?
6. **Cumulative cost-ledger check.** Spend within the per-phase target?
7. **Pre-mortem.** Write out: "what could go wrong with this phase that I didn't think of?" Address each.

The audit is documented in `docs/audit/phase-N-integrity-audit.md`. Each phase's audit is committed to the build branch.

---

## 12. Cross-cutting concerns

These run through every deliverable. Honored as code-review criteria; violation is grounds for not merging the PR.

### 12.1 No-fallback stance enforcement

Every PR includes an explicit answer to "what is this code's failure surface, and where does the failure surface to?" The ESLint custom rule (D-0.12) catches structural violations; manual review catches semantic ones. If the answer is "it falls back to Y," the PR doesn't merge until the fallback is removed.

### 12.2 Carry-forward declarations

Every deliverable that touches profile state declares its carry-forward behavior in the PR description. Per audit §A1 mapping. Deliverables that change carry-forward defaults require explicit justification.

### 12.3 Build cost ledger

`BUILD_COST_LEDGER.md` is a single source of truth for the $10 cap. Every API call records. Hard halt at $9; warn at $7. End-of-phase checks confirm spend within target.

### 12.4 Tue-review escalation rule

Mid-build, the implementer escalates to Tue ONLY when:
- A prompt isn't landing despite Round 4+ (rare).
- A deliverable's contract has an ambiguity the design docs don't resolve.
- A failure-surface decision has ≥2 reasonable answers and the choice affects student experience.
- The cumulative cost ledger is approaching $9 mid-build.

Otherwise the implementer proceeds. Tue's full review is at Phase 6.

### 12.5 Halt-on-error code-review checklist (per orchestration deliverable)

- [ ] No `Promise.allSettled` without explicit per-result error handling that surfaces to telemetry and halts upstream.
- [ ] No catch blocks without re-throw OR explicit telemetry emit + caller halt.
- [ ] No `?? defaultValue` in critical paths where the default papers over a missing required field.
- [ ] Every LLM call has structured-context error wrapping.
- [ ] Every error message includes enough context to diagnose at source (layer name, paragraph index, input identifier).

### 12.6 Continuous test-running

After every code change: `npx tsc --noEmit` + relevant test files. Failures surface immediately; nothing accumulates.

### 12.7 Agent and swarm dispatch

Wherever a deliverable benefits from parallel investigation: spawn agents. Examples:

- Phase 0 D-0.5: Explore agent thoroughness=very thorough on every existing EssayProfile consumer.
- Phase 0 D-0.6, D-0.7: security-architect agent on the RLS policies.
- Phase 0 D-0.8: Database-best-practices agent (Supabase Postgres skill) on the migration SQL.
- Phase 1 D-1.7: Plan agent enumerating every edge case for index remapping.
- Phase 1 D-1.12, Phase 3 D-3.15: code-review-style general-purpose agent on no-fallback enforcement.
- Phase 4 D-4.2: parallel Plan agents drafting variant prompts for the comparison pass.

Swarms (multi-agent teams) can be useful for large parallelizable investigations; use sparingly and only when a single agent would be insufficient.

---

## 13. Phase budgets and gates

| Phase | Time | LLM cost | Cumulative cost | Gate to next phase |
|---|---|---|---|---|
| Phase 0 | 1.5–3 days | $0 | $0 | D-0.15 passes |
| Phase 1 | 5–8 days | $0.50–$1.00 | ≤$1.00 | D-1.18 passes |
| Phase 2 | 4–6 days | $0.50–$1.00 | ≤$2.00 | D-2.14 passes |
| Phase 3 | 8–12 days | $1.50–$2.00 | ≤$4.00 | D-3.19 passes |
| Phase 4 | 7–10 days | $1.50–$2.50 | ≤$6.50 | D-4.15 passes |
| Phase 5 | 7–10 days | $0 | ≤$6.50 | D-5.16 passes |
| Phase 6 | 1 day + Tue review + 3–7 days fix | $1.30 + ≤$2.20 | ≤$10 | Tue review approval |

**Total: 33–50 days of focused engineering ≈ 12–16 weeks of calendar time. Total LLM cost: ≤$10.**

---

## 14. The standing charter, repeated for emphasis (third time)

> This build has unlimited time, unlimited tokens per response, unlimited revision cycles, unlimited agent and swarm dispatches, unlimited thinking time per deliverable. The single hard constraint is the $10 absolute API cap. Every component, from the smallest type field to the largest orchestrator, is built with focus, care, and revision until it lands at the level the design deserves. Do not optimize for anything except quality of result. Do not ship a deliverable that is "good enough" when more revision would make it right. Take the time. Spawn the agents. Revise until landing. The system Tue described over days of design work is what gets built — at the level the design deserves.

---

## 15. Open product calls (not blocking; tagged to gating phase)

| Question | Gating phase | Default to use if Tue silent |
|---|---|---|
| Conversator panel UI placement | Phase 5 | Right rail |
| Dig question first-fire timing | Phase 3 | After-orient (wait until student finishes reading focus surface) |
| Queue size cap | Phase 2 | Trust auto-promotion, soft cap at 30 visible |
| Ground-truth-fact contradicts essay UI affordance | Phase 5 | Inline in focus surface AND chat hint |
| Conversator session log horizon | Phase 3 | 50 turns inline, full log in DB |
| Stuck-student idle threshold | Phase 3 | 3 minutes |
| Continuous chat → focused-analysis re-trigger allowed | Phase 3 | No (respond from existing analysis); revisit post-launch |

---

## 16. What this plan does NOT cover

- Architectural redesign. The design is done; the plan executes.
- Backwards compatibility for existing essay profiles in production beyond the migration backfills (D-0.8). Re-running existing students' essays through the new system is a separate post-launch decision.
- The relationship between the redesigned L5 and existing workshop services. Workshop integration is post-launch.
- Performance optimization beyond the iteration design's redirection mechanism.
- Marketing or user-onboarding changes.

---

## 17. The implementer's contract

The plan is a contract between the design and the build. Honor it:

1. **Execute deliverables in the dependency-graph order.** Don't skip ahead. If a phase's integration test isn't passing, the next phase doesn't start.
2. **Honor every deliverable's contract verbatim.** If you find the contract is wrong, escalate to Tue with the alternative; don't silently change it.
3. **Apply the no-fallback stance ruthlessly.** Code-review every PR against §12.5's checklist.
4. **Record build cost honestly** in `BUILD_COST_LEDGER.md`. Halt at the cap.
5. **Revise prompts until they land**, not until they pass round 3.
6. **Run tests continuously**; don't accumulate failures.
7. **Spawn agents whenever they help quality**; the cost is implementer focus, which is what implementer focus is for.
8. **Cross-phase audits are non-optional.** No phase advances without one.
9. **Ship the system Tue described** — not what's easier to ship, not what existing UI components support, not what the redesign doc said before the experience target overrode it. The contract is the experience target's ten surfaces, the seven teaching moves, the non-repetition contract, the divergent-path multiplicity, the analysis-driven dig, the selective carry-forward, the eight non-negotiables.

When Phase 6 lands and Tue's review session ends with iteration items, **that's the iteration that calibrates the entire build**. Everything before it is the build that earns the right to that review.

Begin with D-0.1.
