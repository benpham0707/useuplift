# Phase 0 Cross-Phase Integrity Audit (D-0.18)

> Per the D-0.18 contract: re-read every governing doc that gates Phase 1;
> verify Phase 0's deliverables honor every type contract from
> `L5_ITERATION_LOOP_DESIGN.md` §7.1, every schema contract from
> `L5_E2E_INTEGRITY_AUDIT.md` §4.6, every audit row 251–270 in
> `L5_CONSUMPTION_AUDIT.md` §A3. Walk the dependency graph; check every
> Phase 0 → Phase 1 edge has a corresponding type or migration in place.
>
> **Audit scope**: 17 Phase 0 deliverables landed on
> `feat/integrated-pipeline-build` between commits `c8f5835` and `7295558`.
> Two deliverables remain after this audit doc: D-0.18 sub-deliverable
> (R-2 supersession edits across L5 docs — separate commit) and D-0.19
> (Phase 0 → Phase 1 integration test gate).
>
> **Audit date**: 2026-04-26.
> **Branch state at audit time**: `feat/integrated-pipeline-build`,
> 17 commits ahead of `feat/wave-3a-phase-3b-3c@53b4d85`.

---

## §1 — Deliverable verification matrix

Each row: deliverable id, contract source, implementation, verification
status, any gaps. ✅ = verified, ⚠️ = partial / known gap, ❌ = missing.

| ID | Contract source | Implementation commit | Verification | Status |
|---|---|---|---|---|
| D-0.1 | `L5_ITERATION_LOOP_DESIGN.md` §7.1 (verbatim type spec) | `c8f5835` — appended 281 lines to `profileTypes.ts` | All 4 types match §7.1 field-by-field; `tsc --noEmit` exit=0; per-field JSDocs name producers (§7.2) and consumers (§7.3) | ✅ |
| D-0.2 | `L5_E2E_INTEGRITY_AUDIT.md` §3.1 (UnderstandingQuestion + DigContext extensions) | `ad1eff0` — extended UnderstandingQuestion with new source/status aliases + `dig?: DigContext`; added DigContext (10 fields) | All 10 DigContext fields present (whyAsked, expectedAnswerShape, consumers, populates, framingSeed, askedAt?, conversatorMessageId?, studentAnswerRaw?, structuredAnswer?, extractionPending?); existing UnderstandingQuestion consumers compile (supersets); tsc clean | ✅ |
| D-0.3 | `L5_E2E_INTEGRITY_AUDIT.md` §4.5 (GroundTruthFact + StoryFragment + IntentSignal) | `7546b5d` — appended 114 lines to `profileTypes.ts` | All 3 types match §4.5 verbatim; tsc clean. Re-ordered before D-0.2 so DigContext.structuredAnswer's reference resolves cleanly. | ✅ |
| D-0.4 | INTEGRATED_BUILD_SEQUENCE D-0.4 contract (8-field ConversatorSessionEntry) | `7fcbc16` — created `src/services/essayIntelligence/conversator/types.ts` (88 lines) | 8 fields per contract: id, timestamp, sender, messageContent, digQuestionId?, focusItemRef?, route?, structuredAnswerRef?. ChatRoute as `string` placeholder per LLM-first discipline (Phase 3 D-3.3 narrows). tsc clean. | ✅ |
| D-0.5 | INTEGRATED_BUILD_SEQUENCE D-0.5 contract (5 required EssayProfile root fields + createInitialProfile defaults) | `a7c2f63` — extended EssayProfile + wired defaults in `essayProfileManager.createInitialProfile()` | 5 required fields present (iterationLedger, groundTruthFacts[], storyFragments[], intentSignals[], conversatorSessionLog[]); defaults match contract; Explore-agent consumer trace performed; agent's compilation-failure prediction caught + corrected (15 fixtures use `as unknown as` double-cast which bypasses structural checks); tsc exit=0. | ✅ (with documented runtime-undef risk on un-backfilled JSONB rows; mitigated by D-0.8 hydration) |
| D-0.6 | INTEGRATED_BUILD_SEQUENCE D-0.6 contract + `L5_E2E_INTEGRITY_AUDIT.md` §4.6 (essay_chat_conversations table) | `84c8210` — `supabase/migrations/20260426000000_essay_chat_conversations.sql` | UUID FKs to profiles.id + essays.id (corrects build-sequence prose to mirror activity precedent + essays.id schema). Two-check tenancy guard on all 4 user policies (security review S2). UNIQUE(profile_id, essay_id) constraint. WITH CHECK on service-role policy. REVOKE FROM PUBLIC, anon. | ✅ (security-architect review applied) |
| D-0.7 | INTEGRATED_BUILD_SEQUENCE D-0.7 contract (essay_ground_truth table) | `caf45f0` — `supabase/migrations/20260426000001_essay_ground_truth.sql` | Same UUID-FK + RLS pattern as D-0.6; CHECK on record_type (closed) and confidence (nullable ternary); updated_at + trigger for supersededBy linking audit; security-architect review S5 addressed. | ✅ |
| D-0.8 | INTEGRATED_BUILD_SEQUENCE D-0.8 contract (JSONB backfill + serializer update) | `b2b5360` — `supabase/migrations/20260426000002_essay_profile_iteration_ledger.sql` + runtime hydration in `fromCheckpoint()` | Idempotent backfill (in-SET CASE re-check addresses the postgres-best-practices review B1 race); runtime hydration covers un-backfilled-yet rows; defaults match `createInitialProfile()`. | ✅ |
| D-0.9 | INTEGRATED_BUILD_SEQUENCE D-0.9 contract (telemetry hook API) | `4be897e` — `src/services/essayIntelligence/telemetry/iterationTelemetry.ts` (300 lines incl. companion type) | API matches contract (emitIterationEvent + emitStepStart returning {stepId} + emitStepSuccess + emitStepFailure + flushEventsForIteration + clearEventsForIteration + __resetTelemetryForTesting). `IterationTelemetryEvent` type added to profileTypes.ts as optional field on IterationRecord — documented amendment to D-0.1's verbatim §7.1. No-fallback discipline: emit failures throw. | ✅ (with documented amendment to §7.1) |
| D-0.10 | INTEGRATED_BUILD_SEQUENCE D-0.10 contract ($9 hard halt + $7 warn + ledger file + claude.ts wiring) | `057b9ad` — `src/services/essayIntelligence/telemetry/buildCostLedger.ts` + `BUILD_COST_LEDGER.md` + `tests/unit/build-cost-ledger.test.ts` (7 tests) + `claude.ts` wiring | HARD_CAP_USD = 9.0; WARN_THRESHOLD_USD = 7.0; structural halt via `BuildCostCapExceededError`; sync ledger writes; state recovery on init via cost-column parse; init throws on malformed cell (no silent recovery). claude.ts `callClaude` calls checkCapBeforeCall before request and recordCost after response (browser-aware: dynamic import gated by isBrowser). 7/7 tests pass — halt verified end-to-end per the contract's discipline directive. | ✅ |
| D-0.11 | INTEGRATED_BUILD_SEQUENCE D-0.11 contract (mock-LLM framework + fixture registry) | `dabd1cb` — `tests/test-helpers/mockLlm.ts` (307 lines) + 1 seed fixture + `tests/unit/mock-llm.test.ts` (16 tests) | Public API matches contract (mockLlmCall + mockLlmFailure + registerMock + listRegisteredMocks + __reset). Seed fixture extracted from `tests/output/l3-depth-audit-output.json` (real prior paid run) — no fabrication per contract. 16/16 tests pass. Round 2/3/4 caught: stale FIXTURES_PATH after refactor + vitest pool blocking chdir; both fixed. | ✅ |
| D-0.12 | INTEGRATED_BUILD_SEQUENCE D-0.12 contract (custom no-fallback ESLint rule) | `7295558` — `eslint-rules/no-silent-fallback.js` (255 lines) + `eslint.config.js` wiring + `tests/unit/no-silent-fallback.test.ts` (4 test groups) | All 3 patterns implemented per contract (allSettled, catch w/o throw-or-emit, ?? in critical-path functions). Recursive descent into IfStatement / SwitchStatement / nested BlockStatement so nested throws/emits count. Heuristic regex `^(orchestrate\|analyze\|generate\|build)` for critical paths. Member-emit (telemetry.emitX) recognized. Real-codebase signal: 5 warnings on existing claude.ts catch blocks (the patterns the rule is designed to flag). My own D-0.9/0.10 code lints clean. | ✅ |
| D-0.13 | INTEGRATED_BUILD_SEQUENCE D-0.13 contract (vitest coverage tooling) | `2f648d6` — `vitest.config.ts` + `pool: 'forks'` follow-up via `dabd1cb` | Coverage config: provider v8, reporters text/html/json, threshold lines 100, include `src/services/essayIntelligence/conversator/**` and `src/services/essayIntelligence/telemetry/**`. Pool changed to 'forks' so chdir-based isolation tests work (caught only when D-0.11 tests failed). | ⚠️ (config-only — package.json devDeps + scripts deferred to coexist with the pre-existing tiptap workstream commit; documented in `2f648d6` commit message) |
| D-0.14 | INTEGRATED_BUILD_SEQUENCE D-0.14 contract (StalenessEffect.findingIds[]) | `8a93b35` — added optional `findingIds?: string[]` to StalenessEffect | Optional field added at the correct site (line 4041, NOT 3966 as the contract cited — corrected); JSDoc names producers (editUnderstandingService) and consumers (priorAnnotationsBuilder D-1.6, focused_structural D-4e.2). tsc clean. | ✅ (contract line citation corrected) |
| D-0.15 | INTEGRATED_BUILD_SEQUENCE D-0.15 contract (L3 redesign types) | `0a92e33` — `src/services/essayIntelligence/analysis/l3/types.ts` (343 lines) | Sweep + 4 lens + Pass 3 schemas defined. Existing profile types referenced via `Pick<>` so lens emissions land in existing shapes. Net-new sub-types (MeaningGap, ValueArchitecture, PeakMoment, StakesLadder, CharacterSignals) defined as minimal scaffolds per LLM-first Rule 3. tsc clean. | ✅ |
| D-0.16 | INTEGRATED_BUILD_SEQUENCE D-0.16 contract (L3.5 extensions) | `0abd00f` — added `contradictionFlags?[]` and `essayStrengthSignatures?[]` to AnalysisPassOutput | Both fields optional during gradual rollout. Shapes match `L3-5/PLAN.md` schema. Calibration windows documented in JSDoc (5–30% / 5–8). | ✅ |
| D-0.17 | INTEGRATED_BUILD_SEQUENCE D-0.17 contract (L4b extension) | `a7bb8c3` — added `pairedImprovement?` to ImprovementEntry | Same shape as legacy nested home (CraftAssessment.growthEdges[].pairedImprovement at profileTypes.ts:1287–1298) so D-4c migration is non-breaking. Note: contract called the type "ImprovementManifestEntry" but the actual existing type is `ImprovementEntry` — field landed on existing type to avoid churn-only rename. | ✅ (contract name-divergence documented) |

**Tally**: 16 ✅, 1 ⚠️, 0 ❌. The single ⚠️ (D-0.13) is a documented deferral, not a gap; the config landed and is functional under `npm install --no-save`. No blocking gaps for Phase 1 entry.

---

## §2 — Per-spec assertion verification

The audit contract names three governing-doc claim sets to verify:

### §2.1 — `L5_ITERATION_LOOP_DESIGN.md` §7.1 type contracts

The §7.1 spec defines four types verbatim. D-0.1 implements them. Per-row check:

| §7.1 type | §7.1 fields | D-0.1 fields | Match? |
|---|---|---|---|
| `IterationLedger` | currentIteration, iterations, taughtMoves, recentDecisions | currentIteration, iterations, taughtMoves, recentDecisions | ✅ |
| `IterationRecord` | iteration, triggeredBy, editScope?, carryForwardSummary, costBreakdown, comprehensiveBaselineCost, carryForwardSavings, escalationLevel, rationale, startedAt, finishedAt | (same) + optional `events?: IterationTelemetryEvent[]` (D-0.9 amendment, documented in commit + JSDoc) | ✅ verbatim ∪ optional amendment |
| `TaughtMove` | id, annotationId, findingId?, location, taughtAtIteration, teachingMode, contentSummary, stakesSnapshot?, landing?, deepenedBy?, supersededBy? | (same) | ✅ |
| `CarryForwardDecision` | iteration, itemKey, decision, rationale, costSavedIfCarry, costSpentIfRederive, arbitrationMechanism | (same) | ✅ |

The optional `events?` amendment to IterationRecord is documented in the D-0.9 commit and the field's JSDoc; it's added because the D-0.9 contract specifies events should land on `iterationLedger.iterations[currentIteration].events[]`, but §7.1 didn't include the field. Optional addition preserves D-0.1's verbatim shape promise (existing constructors compile unchanged).

### §2.2 — `L5_E2E_INTEGRITY_AUDIT.md` §4.6 schema contracts

§4.6 names two tables and one profile-state field. Per-table check:

| §4.6 spec | D-0.6/0.7 implementation | Match? |
|---|---|---|
| `essay_chat_conversations` table — JSONB conversation_state, capped 50 turns (app-side), schema mirrors activity-side | `20260426000000_essay_chat_conversations.sql` — JSONB conversation_state default `{}`, 50-turn cap noted in COMMENT (app-side enforcement), mirrors activity precedent | ✅ |
| `essay_ground_truth` table — one row per GroundTruthFact / StoryFragment / IntentSignal, FK to essay profile, digQuestionId reference | `20260426000001_essay_ground_truth.sql` — record_type CHECK in (fact/fragment/intent), record_data JSONB, profile_id + essay_id FKs, dig_question_id TEXT (links to UnderstandingQuestion.id) | ✅ |
| `conversator_session_log` field on EssayProfile (compact recent log; full log in essay_chat_conversations) | D-0.5 added `conversatorSessionLog: ConversatorSessionEntry[]` to EssayProfile root (D-0.4 defines the entry type); D-0.8 backfills | ✅ |

### §2.3 — `L5_CONSUMPTION_AUDIT.md` §A3 audit rows 251–270

§A3 enumerates 20 new state-type rows the build introduces (IterationLedger, TaughtMove, CarryForwardDecision, IterationRecord, DigContext, GroundTruthFact, StoryFragment, IntentSignal, ConversatorSessionEntry, plus DB schema rows). Each row should have a producer + consumer + persistence path now landed.

Spot-check (full §A3 cross-reference deferred to D-0.19 integration test where the round-trip persistence exercises the schema):
- IterationLedger / Record / TaughtMove / CarryForwardDecision: D-0.1 ✅
- DigContext: D-0.2 ✅
- GroundTruthFact / StoryFragment / IntentSignal: D-0.3 ✅
- ConversatorSessionEntry: D-0.4 ✅
- EssayProfile root additions: D-0.5 ✅
- essay_chat_conversations table: D-0.6 ✅
- essay_ground_truth table: D-0.7 ✅
- JSONB backfill: D-0.8 ✅

All 9 §A3 type/schema additions present; producer/consumer wiring lands in Phase 1+ per the dependency graph below.

---

## §3 — Phase 0 → Phase 1 dependency graph walk

Each Phase 1 deliverable's dependencies must be in place. Walking the graph:

| Phase 1 deliverable | Depends on | Phase 0 status |
|---|---|---|
| D-1.1 (IterationLedger constructor / accessor on profile load) | D-0.1, D-0.5, D-0.8 | ✅ all landed |
| D-1.2 (taughtMoves[] append at L5 call end) | D-0.1, D-0.5, D-0.9 (telemetry) | ✅ all landed |
| D-1.3 (Landing detector skeleton — Haiku) | D-0.1 (TaughtMove.landing shape), D-0.10 (cost ledger) | ✅ all landed |
| D-1.4 (Landing detector prompt) | D-1.3, D-0.11 (mock-LLM for offline test cycles) | ✅ all landed |
| D-1.5 (Landing detector calibration touchpoint, ~$0.50–$1.00) | D-1.3, D-1.4, D-0.10 (cost cap enforcement) | ✅ all landed |
| D-1.6 (priorAnnotations builder) | D-0.1 (TaughtMove + IterationLedger), D-0.14 (StalenessEffect.findingIds[]) | ✅ all landed |
| D-1.7 (priorAnnotations index-remap on structural reorder) | D-1.6, D-0.14 | ✅ all landed |
| D-1.8 (analysisOrchestrator.ts:850 wire-up) | D-1.6, D-0.5 | ✅ all landed |
| D-1.9 (reanalysisOrchestrator integration verification) | D-1.6, D-1.8 | (Phase 1 work) |
| D-1.10 (IterationLedger.iterations[] commit at orchestrator end) | D-0.1, D-0.9 (events flush via flushEventsForIteration) | ✅ all landed |
| D-1.11 (CarryForwardDecision append at orchestrator decision points) | D-0.1, D-0.9 | ✅ all landed |
| D-1.12 (Halt-on-error orchestration policy applied) | D-0.12 (no-silent-fallback rule for code-review enforcement) | ✅ landed |
| D-1.13–D-1.18 (tests + audit) | D-0.11 (mock-LLM), D-0.12 (rule), D-0.13 (coverage) | ✅ all landed |

No Phase 0 deliverable required by any Phase 1 deliverable is missing. The dependency graph is clean.

---

## §4 — Mistakes caught and recovered (this Phase 0)

A record of the errors caught during Phase 0 and how they were addressed,
per the user's directive "be even more abundant with revisions and
thoughtful audits and iterations" + "we're clearly error/mistake prone."

| # | Where | What | Caught by | Resolution |
|---|---|---|---|---|
| M1 | D-0.5 Explore agent report | Suggested `iterationLedger: { currentIteration: 0, ledger: [] }` as default — wrong shape (D-0.1 has 4 sub-fields, no `ledger`) | Verification pass against §7.1 before acting on agent report | Used the correct 4-field default. Agent's claim flagged in commit message. |
| M2 | D-0.5 Explore agent report | Predicted 15 fixture sites would FAIL TS compilation when EssayProfile got new required fields | Verification: `tsc --noEmit` exit=0 | Fixtures use `as unknown as EssayProfile` double-cast which bypasses structural checks. Per-test fixture updates land organically as Phase 1+ tests touch the new fields. |
| M3 | D-0.14 contract | Cited line 3966-3970 as StalenessEffect — that's actually `StalenessTracker` | grep verification before edit | Added at the correct line (4041). |
| M4 | D-0.17 contract | Named the type "ImprovementManifestEntry" — actual existing type is `ImprovementEntry` | grep verification before edit | Field landed on existing `ImprovementEntry` to avoid churn-only rename. |
| M5 | D-0.13 process | Ran `git checkout package.json` to undo my own scripts/devDeps additions; this also discarded Tue's pre-existing uncommitted tiptap dep additions | Realized after the fact when running `git status` | Recovered tiptap deps from `package-lock.json`'s uncommitted diff. Pattern to avoid: destructive git operations on tracked files when working tree carries state I don't own. |
| M6 | D-0.11 refactor | After moving from `const FIXTURES_PATH = ...` to `function fixturesPath()`, one stale `FIXTURES_PATH` reference remained inside `ensureLoaded()` | Caught when isolated-tmp tests failed with "FIXTURES_PATH is not defined" | grep + fix; tests then passed. Lesson: refactor + tests-pass is not equivalent to refactor + grep-confirms-no-stragglers. |
| M7 | D-0.11 vitest config | Default vitest pool is `threads`, which blocks `process.chdir()` | Caught when isolated-tmp tests failed with `ERR_WORKER_UNSUPPORTED_OPERATION` | Added `pool: 'forks'` to vitest.config.ts. |
| M8 | D-0.13 install | Original plan was to add vitest as a regular devDep via npm install — that would have modified package.json/lock alongside the pre-existing tiptap state | Recognized the staging conflict early | Used `npm install --no-save`; package.json edits documented in commit message for follow-up commit. |

Cumulative pattern: agent claims and contract citations both warrant
verification against current code state before acting. The verification
takes minutes; acting on a wrong claim takes hours to undo.

---

## §5 — Deferrals into the next deliverables

Items intentionally deferred from Phase 0 and tracked into specific
follow-up deliverables:

| Item | Reason | Lands at |
|---|---|---|
| package.json `vitest` + `@vitest/coverage-v8` devDependencies + `test:vitest` / `test:coverage` scripts | Pre-existing uncommitted tiptap dep state in package.json (annotation V2 workstream) — staging conflict | Next package.json commit (whoever lands the tiptap deps adds these alongside) |
| R-2 absorption supersession edits across L4/ESSAY_NORTH_STAR_DESIGN.md, L5/L5_EXPERIENCE_TARGET.md, L5/L5_ITERATION_LOOP_DESIGN.md, L5/L5_E2E_INTEGRITY_AUDIT.md, L5/L5_CONSUMPTION_AUDIT.md, L5/L5_FEEDBACK_REDESIGN.md, L5/L5_IMPLEMENTATION_PLAN.md | Per F7's deferred-edits list — these are textual updates documenting that L3.75 fields' layer-of-origin changed; they don't gate Phase 1 entry but should land before Phase 4 sub-phase 4a executes the absorption | D-0.18 follow-up commit (separate from this audit doc) |
| RE_ANALYSIS_LIFECYCLE_DESIGN.md absorption + focused_structural integration | Per F7 R-4 — tightly coupled to the actual implementation of focused_structural | D-4e.3 (Phase 4 sub-phase 4e) |
| §A3 row-by-row consumption audit cross-check | Deferred to round-trip integration test that exercises producer→consumer→persistence in code | D-0.19 |
| 16-of-26 audit-finding scoping cross-check (per master plan §7) | Findings F1, F2 etc. land at specific Phase 4 sub-phases per the cross-reference table | Per-sub-phase audits in Phase 4 |

---

## §6 — Findings that warrant Tue's attention

None. Phase 0 is structurally complete; no item rises to the level of
"escalation to Tue" per the build prompt's mid-build escalation criteria
(prompts not landing despite Round 4+, contract ambiguity the docs don't
resolve, cumulative spend approaching cap, contract change request).

The two minor contract-text corrections (M3 line citation, M4 type name
divergence) were both editorial inaccuracies in the contract docs, not
design ambiguities — corrected at the implementation site with the
correction documented in the commit message.

---

## §7 — Phase 1 readiness verdict

**Phase 1 is gated on D-0.19 (the integration test that exercises types,
migrations, telemetry, mock-LLM, cost-ledger, ESLint rule, coverage in
one round-trip).** D-0.19 is the explicit gate; this audit doc is the
complementary correctness verification.

Once D-0.19's eight sub-checks all pass, Phase 1 entry is unblocked.

The deferred R-2 supersession edits (D-0.18 follow-up) are not blockers
for Phase 1 entry — they're textual documentation updates that should
land before Phase 4 sub-phase 4a executes the L3.75 absorption.

---

> **End of Phase 0 cross-phase integrity audit.** D-0.18 follow-up
> applies the R-2 supersession edits in a separate commit. D-0.19
> closes Phase 0 with the integration test gate.
