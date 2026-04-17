# Round 7 Hardening — Execution Plan

**Version:** 1.0 — 2026-04-17
**Branch strategy:** P0 single PR `fix/round7-hardening-p0` → main; P1 three sub-PRs in parallel with Round 8 design.
**Source diagnosis:** [docs/ROUND_7_COMPREHENSIVE_AUDIT.md](./ROUND_7_COMPREHENSIVE_AUDIT.md) (2026-04-17, 8-domain agent sweep).
**Round 8 contract:** [docs/ROUND_8_DESIGN_CONTRACT.md](./ROUND_8_DESIGN_CONTRACT.md).
**Signal protocol (Round 9+):** [docs/SIGNAL_REGISTRATION_PROTOCOL.md](./SIGNAL_REGISTRATION_PROTOCOL.md).

---

## 0 — Framing

The audit's central thesis: Round 7a/7b/7c each passed its own local gate, but the pipeline has adopted **silent-failure coping strategies** (try/catch log-and-continue, disabled retry, fire-and-forget persistence, source-regex "integration" tests) as compensation for unstable primitives. Round 8 would compound, not resolve, those patterns.

This plan has two jobs:

1. **Fix the foundation.** Restore CLAUDE.md §2 ("no silent failures"), §1.4 ("atomic credit deduction"), and §3 ("retry with backoff") as enforced invariants — not aspirations.
2. **Install discipline.** Every post-Round-7 change lands behind CI, behind coordinator write methods, and behind a signal-registration protocol that makes drift impossible to introduce accidentally.

The plan has no implementation work in this session. Deliverables are three docs + this execution plan. Implementation begins in a subsequent session after approval.

---

## 1 — Disagreements with the prompt's P0 framing

The prompt elevates six items from audit priority. I agree with all six, but flag four sequencing/scope observations that should shape execution:

### 1.1 P0-6 (CI) is a **precondition**, not a P0 task

CI must exist **before** the other P0 work merges; otherwise the other P0 fixes ship behind the same enforcement gap they're meant to close. Executed as task-zero of the P0 PR (commit 1), then all other tasks follow.

### 1.2 P0-5 (integration tests) should be written **first**, not last

TDD inverts the natural ordering. Write runtime-behavior integration tests as the first code commits (they will fail against current code). Each subsequent P0 fix un-skips or passes additional assertions. This prevents a pattern where tests get written after the fact to match whatever behavior landed.

**Revised P0 order inside the single PR:**
```
Commit 1: CI workflow + npm test script (P0-6)
Commit 2: Runtime integration test scaffolding (P0-5) — assertions target intended behavior, .skip() on not-yet-fixed items
Commit 3: Retry default + tests (P0-2) — simplest, lowest blast radius
Commit 4: essayId plumbing + DB round-trip test (P0-1)
Commit 5: Credits deduction on /respond (P0-3)
Commit 6: Haiku routing wire-up OR deletion + acknowledgment path (P0-4)
Commit 7: Un-skip all P0-5 assertions; verify suite green
```

### 1.3 P0-3 (credits) and P0-4 (Haiku) have a real dependency

P0-3 requires **model-aware pricing**. If P0-4 lands first, credits can budget `$0.002` for Haiku turns; if P0-3 ships first, it must budget conservatively at Sonnet rates (`~$0.04`/turn ceiling), penalizing all users until P0-4 lands. Order above (P0-3 → P0-4) is still correct because **zero-deduction is a doctrine violation today** and we should stop the bleed. P0-4 follows immediately with a patch to the debit helper to use actual cost (not estimated).

### 1.4 P0-4 decision: **wire the existing methods, do not delete**

The audit gives us a choice. Recommendation: wire `runStage1InsightExtraction` + `generateMinimalResponse`. Reasons:

- The methods exist, are tested in isolation via the edge-protocol suite, and encode real prompt engineering work.
- Deletion plus rebuild adds 2-3 dev-days vs 0.5-1 dev-day to wire.
- Round 8 planner will reuse the classifier to route minimal vs substantive turns. Rebuilding twice is wasteful.

If wire-up surfaces bugs beyond straightforward plumbing, escalate to "rebuild" in a follow-up commit; do not block the PR.

---

## 2 — P0 PR Scope: "Round 7 Hardening: P0 Foundation"

**Target:** 4–5 dev-days (3 agents working in parallel where the commit order allows).
**Branch:** `fix/round7-hardening-p0`
**PR title:** `fix: Round 7 hardening — P0 foundation (persistence + retry + credits + routing + CI + runtime tests)`
**Base:** `main`
**Merge gate:** CI green, 2 reviewers, cost-budget test green.

### 2.1 Task roster

| # | ID | Title | Files | Effort | Owner |
|---|----|-------|-------|--------|-------|
| C1 | P0-6 | CI workflow + test script | `.github/workflows/ci.yml`, `package.json` | 0.25d | CI-agent |
| C2 | P0-5 | Runtime integration test scaffolding | `tests/unit/analytical-deepening-integration.test.ts`, `tests/unit/strategic-intelligence-integration.test.ts`, new `tests/integration/orchestrator-runtime.test.ts` | 1.0d | Test-agent |
| C3 | P0-2 | LLM retry default + unit + injection test | `src/lib/llm/claude.ts:810-855`, `tests/unit/llm-retry.test.ts` (new) | 0.5d | LLM-agent |
| C4 | P0-1 | essayId plumbing + DB round-trip test | `essayProfileManager.ts:2617-2640` + `createNew` + `fromCheckpoint` + all construction call sites, `supabaseCheckpointStore.ts`, `tests/integration/profile-persistence.test.ts` (new) | 1.0d | Persistence-agent |
| C5 | P0-3 | Atomic credits deduction on `/respond` | `src/http/essayCoachingRoutes.ts:457-497`, `src/services/credits/creditsService.ts`, `tests/integration/credits-concurrency.test.ts` (new) | 1.0d | Billing-agent |
| C6 | P0-4 | Wire Haiku minimal-turn routing | `src/services/essayIntelligence/coaching/coachingService.ts:1545-1620, 3600-3800`, `tests/unit/coaching-haiku-minimal.test.ts` (new) | 0.75d | Coach-agent |
| C7 | P0-5 | Un-skip integration tests | same files as C2 | 0.25d | Test-agent |

**Parallelism:** C1 is a dependency for all. C2 can start in parallel with C3 (Test-agent scaffolds while LLM-agent does retry). C4, C5, C6 are mutually independent and run in parallel after C2 lands. C7 is the closer.

**Agent team composition (per CLAUDE.md §SWARM):**
```
Lead              — owns PR, integration, review, merge
├── CI-agent       — C1
├── Test-agent     — C2, C7
├── LLM-agent      — C3
├── Persistence-agent — C4
├── Billing-agent  — C5
└── Coach-agent    — C6
```

6 specialists ≤ 8-teammate cap. Each has one domain; handoffs happen at PR-review boundaries.

### 2.2 Task details — C1: CI workflow + test script

**File: `.github/workflows/ci.yml` (new)**
```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
jobs:
  typecheck-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm test
    timeout-minutes: 15
```

**File: `package.json`**
```json
"scripts": {
  ...
  "test": "tsx tests/unit/run-all.ts",
  "test:integration": "tsx tests/integration/run-all.ts"
}
```

Integration tests (C2, C4, C5) run in a separate job (`integration`) that depends on `typecheck-and-test` green, because they require a Postgres service container:

```yaml
  integration:
    needs: typecheck-and-test
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_PASSWORD: postgres }
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
    env:
      SUPABASE_URL: http://localhost:54321
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_TEST_KEY }}
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_TEST_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx supabase db push --db-url postgresql://postgres:postgres@localhost:5432/postgres
      - run: npm run test:integration
    timeout-minutes: 25
```

**Acceptance:** Opening this PR against a fresh `main` must make GH Actions run the workflow. Red blocks merge.

**Risks:** `supabase db push` in CI requires service role key secret and may flake on migration ordering (Round 7a had four hotfixes). Mitigation: integration job is allowed to be separate-required-check; migration failure surfaces immediately.

### 2.3 Task details — C2: Runtime integration tests (scaffolding)

**Replace source-regex pins with runtime behavior.**

**New file: `tests/integration/orchestrator-runtime.test.ts`**

Pattern (illustrative, agent implements):
```ts
import { AnalysisOrchestrator } from '@/services/essayIntelligence/analysis/analysisOrchestrator';
import { mockCallClaude, assertCalledWith } from '../utils/llm-mocks';

test('M10-runtime: runAOFirstRead is called with populated enrichment (post-distance)', async () => {
  const llm = mockCallClaude()
    .onL1(() => FIXTURE_L1)
    .onL3(paraIdx => FIXTURE_L3[paraIdx])
    .onL35(() => FIXTURE_L35_WITH_CLAIM_MAP)
    .onL4(() => FIXTURE_L4)
    .onAO(enrichment => {
      // Runtime assertion: AO is called AFTER L3.5 populated claimEarnednessMap
      assert(enrichment.claimEarnednessMap, 'AO must receive populated claim map');
      assert(enrichment.rhetoricalInventory, 'AO must receive populated rhetorical inventory');
      assert(enrichment.archetypeDistance, 'AO must receive archetype distance profile');
      return FIXTURE_AO;
    });

  const orchestrator = new AnalysisOrchestrator({ llm });
  const profile = await orchestrator.analyzeEssay(FIXTURE_INPUT);
  assert(profile.aoFirstRead, 'aoFirstRead must land on profile');
  assert(profile.claimEarnednessMap, 'claim map must land on profile');
});
```

**Delete from `strategic-intelligence-integration.test.ts`:** the M10 regex block at lines 452–514. Replace in-place with runtime assertions using the mocked-LLM pattern, OR move those assertions to the new `orchestrator-runtime.test.ts` and leave only pure-code unit tests in `strategic-intelligence-integration.test.ts`. Recommendation: move; keep `strategic-intelligence-integration.test.ts` limited to pure-code distance-math + prompt-rendering tests (the things that file's name suggests).

**Same treatment for `analytical-deepening-integration.test.ts:355-360`.**

**Acceptance:** A rename of the `enrichment` field to `enr` with empty fields **fails** the new test (because the runtime mock asserts on field population). A source-regex pass that adds the field name but leaves fields empty also fails. Demonstrated via PR commentary showing both scenarios tested locally.

**Initial `.skip`:** C2 lands with assertions targeting intended post-fix behavior. Assertions that require C3/C4/C5/C6 complete are marked `.skip` with a `// unskip: C4` comment. C7 removes all skips.

### 2.4 Task details — C3: LLM retry

**File: `src/lib/llm/claude.ts:810-855`**

Change default: `maxRetries = 3`, backoff `1s → 2s → 4s` + jitter (already implemented; change is the default).

Add a second change: **all essay-intelligence call sites use `callClaudeWithRetry`** — not raw `callClaude`. Migration audit (grep `callClaude(` in `src/services/essayIntelligence/` and `src/lib/llm/`) produces the call-site inventory; swap each. Leaf helpers (`callClaude` itself) remain exported for tests that need precise control.

**Unit test (`tests/unit/llm-retry.test.ts`):**
- Mocked Anthropic 429 on attempt 1, success on attempt 2 → retry helper returns success, logs one warning.
- Mocked 400 (non-retryable) → throws immediately, no retry.
- Mocked 429 × 3 → throws `ClaudeAPIError` with exhausted-retries marker.
- Mocked 529 (overloaded) on attempt 1, success on 2 → retry helper returns success.

**Integration test (in `tests/integration/orchestrator-runtime.test.ts`):**
- Inject 429 into L3 walk P4 of 7, success on retry → pipeline completes end-to-end with cost tracked correctly (retry doesn't double-charge the student).

**Acceptance:** Default `maxRetries = 3`. All `src/services/essayIntelligence/**` LLM call sites use `callClaudeWithRetry`. Unit suite green. Integration mid-pipeline 429 resolves on retry.

**Risk:** Retry doubling the cost ceiling. Mitigation: cost budget test in integration suite verifies `totalAnalysisCost ≤ expected * 1.2` (allowing one retry per layer).

### 2.5 Task details — C4: essayId plumbing

**This is the single most consequential fix.** Every signal landed in 7a/7b/7c rides inside a JSONB blob that fails silently to persist because `essayId` is the empty string, which fails the UUID NOT NULL constraint, which the try/catch swallows.

**Changes:**

1. **`EssayProfileCoordinator.createNew(essayId: string, essayType, ...)`** — make `essayId` a **required constructor parameter**, not a post-construction setter. Same for `fromCheckpoint(essayId, checkpoint)`.
2. **`CheckpointMetadata.essayId`** — remove the `= ''` default at `essayProfileManager.ts:2630`. Read from the instance field.
3. **All construction call sites** — thread essayId in. Grep `createNew\(` + `fromCheckpoint\(` across `src/services/essayIntelligence/**`, `src/http/**`, and `tests/**`. Every caller must provide it. This is intentional — the compiler will enforce coverage.
4. **`SupabaseCheckpointStore.save`** — remove the silent try/catch; surface errors via a `Result<void, PersistError>` return type. Caller (coordinator `checkpoint()`) logs the error AND throws so the orchestrator knows persistence failed.

**D4-M7 bonus (related):** `essayProfileManager.ts:1797-1801` — `aoFirstRead = null` direct mutation. Replace with `this.applyAOFirstRead(null, { reason: 'staleness_reset' })`. Coordinator method bumps `writeVersion`, records mutation, validates. (This is technically P1-coordinator-discipline; bundling here because the call site is adjacent and review will want both fixed at once. If scope creeps, defer to the P1 Coordinator PR.)

**Integration test (`tests/integration/profile-persistence.test.ts`):**

```
1. Spin up Postgres service container + apply migrations
2. Create coordinator with real essayId (UUID)
3. Run mocked-LLM pipeline end-to-end (L1..L5 + AO)
4. Assert: SELECT profile_cache FROM essay_understanding WHERE essay_id = $1 returns non-null row
5. Spawn a second coordinator via fromCheckpoint(essayId)
6. Deep-equal the reloaded profile against the saved one for all 7 Round-7 signals:
   - revisionHistory
   - revisionIntelligence
   - voiceEvolution
   - claimEarnednessMap
   - rhetoricalInventory
   - archetypeDistanceProfile
   - aoFirstRead.archetypePositioning
7. Simulate server restart by tearing down coordinator and re-`fromCheckpoint`-ing
8. Repeat deep-equal assertion — survives restart
```

**Acceptance:** All 7 signals persist. Deep-equal passes pre- and post-restart. A deliberate regression (remove essayId from `createNew`) breaks compilation. A deliberate regression (re-add `essayId: ''` default) breaks the test.

**Risk:** Changing a required constructor signature ripples through ~15 call sites. Mitigation: persistence-agent grep-audits first, documents the call-site map in the PR description. If any call site lacks an essayId in its local scope, that's a genuine design flaw surfacing — flag to lead before inventing a placeholder.

### 2.6 Task details — C5: Credits deduction on `/respond`

**File: `src/http/essayCoachingRoutes.ts:457-497`**

Add pre-call balance check + atomic post-call debit. Both inside the same DB transaction (no race window).

**Sketch (billing-agent implements against existing `creditsService.ts`):**
```ts
const tx = await supabase.rpc('begin_tx'); // or use Postgres advisory lock keyed on userId
try {
  const balance = await creditsService.getBalance(profileId, { tx });
  const estimatedCost = estimateCoachTurnCost({ profile, studentMessage }); // cents
  if (balance < estimatedCost) {
    await tx.rollback();
    return res.status(402).json({ success: false, error: 'insufficient_credits', balance, required: estimatedCost });
  }
  // Reserve the budget (soft-lock) — prevents concurrent-request double-spend
  await creditsService.reserveBudget(profileId, estimatedCost, { tx });

  // Run the turn OUTSIDE the transaction (LLM call is slow; holding tx open = lock contention)
  await tx.commit();

  const result = await session.orchestrator.processCoachingTurn(...);

  // Atomic debit for actual cost (cents), release the reservation
  await creditsService.debit(profileId, { actualCostCents: Math.round(result.totalCost * 100), reservedCents: estimatedCost });
} catch (err) {
  // Compensating release of reservation on error path
  await creditsService.releaseReservation(profileId, estimatedCost);
  throw err;
}
```

**Model-aware estimate:**
- Until C6 lands: `estimateCoachTurnCost` returns Sonnet-ceiling (~$0.04 / 4¢) for every turn.
- After C6 lands: classifier-first. If classifier decides minimal → Haiku budget (~$0.002 / 0.2¢ rounded to 1¢). Else Sonnet budget.

**Integration test (`tests/integration/credits-concurrency.test.ts`):**
- Two concurrent `/respond` calls from same user with balance = exactly one turn's cost.
- Assert: exactly one succeeds, one returns 402. Final balance = 0 (no double-spend, no negative).

**Unit test:** Mock `debit` to throw post-LLM-call → reservation must release, balance must end unchanged.

**Acceptance:** Concurrency test green. Zero-balance user gets 402 before LLM call. A cost-tracked happy path correctly deducts.

**Risk:** Supabase RLS on `credit_transactions` and advisory-lock contention. Mitigation: use pg_advisory_xact_lock keyed on hash(profileId) inside a single RPC — standard pattern, used elsewhere in `creditsService.ts`.

### 2.7 Task details — C6: Haiku minimal-turn routing

**Decision (see §1.4 above):** Wire existing orphan methods. Delete fallback only if wire-up reveals unfixable staleness.

**Files:**
- `src/services/essayIntelligence/coaching/coachingService.ts` — line 1552 (`runStage1InsightExtraction`), 3608 (`runStage1_5CognitiveAssessment`), 3751 (`generateMinimalResponse`).
- Integration point: `processCoachingTurn` (the Sonnet entry point). Today it runs directly into Sonnet; after wire-up it:
  1. Runs `runStage1InsightExtraction` (Haiku, ~$0.001)
  2. If `stage1.category === 'confirmation'` AND `stage1.requiresSubstantiveResponse === false` AND message length < 30 chars → `generateMinimalResponse` (Haiku, ~$0.001), total turn cost ~$0.002.
  3. Else → existing Sonnet path. `stage1` flows in as context (no re-classification).

**Decision criteria for minimal path** (to be encoded as `classifyAsMinimal`):
- Student message ≤ 30 chars raw
- Category ∈ { confirmation, clarification } with low reinterpretation signal
- No prior-turn pushback active (checked via `sessionMemory.edgeProtocolState`)
- Improvement phase not `foundation` (foundation phase needs scaffolding even on short messages)

**Unit test (`tests/unit/coaching-haiku-minimal.test.ts`):**
- "ok thanks" → routes Haiku, mocked cost < $0.002, response < 30 tokens.
- "can you rewrite P3?" (substantive but short) → routes Sonnet.
- "Hm interesting" at T1 (foundation phase) → routes Sonnet (scaffolding required).
- Sonnet remains default for reinterpretation/new_context categories regardless of length.

**Acceptance:** Minimal turn round-trips Haiku-only. Sonnet turns unchanged. C5's estimator now returns Haiku budget when classifier agrees; credits test runs green under minimal-turn fixture.

**Risk:** Classifier false-positives send substantive turns to Haiku → low-quality response. Mitigation: conservative `classifyAsMinimal` (false by default); post-ship, metric on Haiku-chosen-turn thumbs-down rate. Rollback flag: `ENABLE_HAIKU_MINIMAL_PATH` env var, default `true`, flip to `false` if quality regresses.

### 2.8 PR merge gate

Definition of done:
- [ ] `.github/workflows/ci.yml` passes on the PR itself
- [ ] `npm test` green
- [ ] `npm run test:integration` green (Supabase round-trip, credits concurrency, orchestrator runtime)
- [ ] `npx tsc --noEmit` clean
- [ ] All `.skip` from C2 scaffolding removed
- [ ] Cost-budget test shows comprehensive run stays in ±20% of pre-PR baseline
- [ ] PR description includes call-site map for `createNew`/`fromCheckpoint` diff
- [ ] Two human reviewers

---

## 3 — P1 Sub-PRs (parallel with Round 8 design)

**Target:** 8-10 dev-days total across three sub-PRs.
**Branches:**
- `fix/coordinator-discipline` (Coord-PR)
- `fix/coach-reliability` (Coach-PR)
- `fix/lifecycle-integrity` (Lifecycle-PR)

All three branch from `main` after P0 PR merges. They are **mutually independent** and can run in parallel as long as their agents don't stomp each other's files.

**File-ownership partition** (prevents merge conflicts):
| Sub-PR | Owns (primary edit rights) |
|--------|---------------------------|
| Coord-PR | `essayProfileManager.ts` (coordinator methods), `analysisOrchestrator.ts` write sites, `sequentialDeepWalk.ts` write sites, `crossDomainValidation.ts` |
| Coach-PR | `essayCoachingRoutes.ts` (response shape + persist), `coachingService.ts` (memory compression) — NOT the coordinator |
| Lifecycle-PR | `reanalysisOrchestrator.ts`, `focusedAnalyzer.ts`, `holisticSynthesis.ts` delta paths, `editUnderstandingService.ts` |

Coordinator method names (added in Coord-PR) are consumed by Coach-PR and Lifecycle-PR. Define signatures first (PR0 in the Coord branch) so the other PRs can open against a stable API.

### 3.1 Sub-PR A — "Coordinator discipline" (fix/coordinator-discipline)

**Rationale:** Round 8 will add `revisionPlan` to the profile. Under current discipline (three HIGH findings of direct mutation + one MED), Round 8 inherits the split-brain bug unless discipline lands first.

**Scope:**

| Audit finding | Fix |
|---------------|-----|
| D1-H1 (walk direct mutation) | Add `applyWalkOutput(output, { essayType })` to coordinator. Route all `sequentialDeepWalk.applyWalkOutputToProfile` calls through it. Unify connection-ID scheme (use coordinator's counter-based IDs; drop `conn_l3_${Date.now()}`). |
| D1-H2 (walk error-path mutation bypasses checkpoint) | Add `markParagraphSkipped(index, reason)` to coordinator. Replace direct `profile.walkSkipped` writes. Checkpoint before throwing. |
| D1-H3 (AO + manifest `as X` casts) | Add `applyAOFirstRead(aoResult, { source })` and `applyImprovementManifest(manifest)` to coordinator. Delete every `(profile as { aoFirstRead?: ... }).aoFirstRead = ...` cast-write. |
| D1-H4 (misleading runL2 contract) | Fix docstring OR add null-return path; pick one and make it actually true. |
| D4-M7 (aoFirstRead = null direct mutation) | Use new `applyAOFirstRead(null, { reason: 'stale' })`. |

**Additive enforcement:**

- **Build-time lint:** Add a grep-based CI check (`scripts/check-coordinator-discipline.sh`) that fails CI if any `src/services/essayIntelligence/**/*.ts` file **outside** `profileManager/` contains `profile.X = ` patterns for whitelisted fields (`aoFirstRead`, `improvementManifest`, `walkSkipped`, `claimEarnednessMap`, `rhetoricalInventory`, `archetypeDistanceProfile`, `revisionPlan`). The coordinator is the only exempt directory.

- **Audit hook:** Each coordinator method records to `mutationHistory[]` with `{ method, writeVersion, timestamp, reason }`. Cheap, JSON-serializable. Consumed by lifecycle debugging and by Round 8's plan-regen-trigger logic.

**Tests:**
- Unit: each new coordinator method increments `writeVersion`, records mutation, rejects invalid payloads.
- Integration: existing orchestrator-runtime test re-runs; `writeVersion` increments as expected across layer transitions.
- CI-lint: `scripts/check-coordinator-discipline.sh` included in CI workflow.

**Effort:** ~3 dev-days (touches many files but each change is mechanical).

### 3.2 Sub-PR B — "Coach reliability" (fix/coach-reliability)

**Scope:**

| Audit finding | Fix |
|---------------|-----|
| D6-H3 | Graceful error envelope. No raw SDK errors to client. Classify errors into `{ insufficient_credits, transient_upstream, invalid_input, internal }` → client-safe message map. 500 only for `internal`; 402/429/400 otherwise. |
| D6-H4 | `await saveCoachingState(...)` (currently fire-and-forget). Surface failure in response envelope — caller can distinguish "turn succeeded, state persist failed" from "turn failed." |
| D6-H5 | Session memory compression. When `events.length > 20`, collapse older turns into a summary block via Haiku (~$0.003). Keep last 8 turns verbatim; older turns become `{ summary, turnCount, spanStart, spanEnd }`. |
| D6-M1 (bonus, light) | Wire `forbiddenPatterns.lintCoachingResponse` into a post-hoc telemetry logger (non-blocking). Measures violation rate. Not a gate; informational. |

**Tests:**
- `/respond` when credits service throws → response is 402, not 500. Error body does not contain SDK-specific strings.
- `saveCoachingState` failure → response envelope includes `warnings: ['state_persist_failed']`. Next `/respond` reloads from Supabase (even if local in-memory is stale).
- 25-turn session: compression fires at turn 21, summary replaces turns 1-13, total prompt tokens stays < 12k.

**Effort:** ~2 dev-days.

### 3.3 Sub-PR C — "Lifecycle integrity" (fix/lifecycle-integrity)

**Scope:**

| Audit finding | Fix |
|---------------|-----|
| D5-H1 | Manifest rebuild on comprehensive-deferred path in `reanalysisOrchestrator.ts:1207-1228`. Before rebuild, remap stale paragraph indices (post-edit paragraph shifts). |
| D5-H2 | Escalated-to-comprehensive cleanup in `reanalysisOrchestrator.ts:1261-1274`. On throw, coordinator must rollback focused deltas to the pre-focused snapshot. Use `writeVersion` as rollback anchor. |
| D5-H3 | Mid-comprehensive throw in `:685-689`. Same rollback semantics; leave coordinator in pre-analysis state with an explicit `analysisFailed: true` marker for next-session detection. |
| D5-H4 | `fromCheckpoint` rebuild post-reanalysis (`:699-713`) preserves in-flight focused deltas. Reanalysis should merge INTO the fresh coordinator, not replace. |
| D5-H5 | L3.75 blank-state bug in `focusedAnalyzer.ts:1195-1201, 1254-1260`. Seed `holisticEvolution` with the existing profile's holistic state before synthesis. Synthesis mutates, never overwrites-with-blank. |

**Tests:**
- Integration: transformative single-para edit mid-pipeline → Level 2 ladder → escalation to Level 3 → mid-comprehensive inject throw → coordinator post-throw state equals pre-edit state deep-equal.
- Integration: edit → reanalysis → reload from checkpoint → focused deltas present.
- Unit: L3.75 called with blank `holisticEvolution` → existing profile sections preserved; no field becomes `undefined`.

**Effort:** ~3 dev-days.

### 3.4 Items explicitly deferred (not in any P1 PR)

The prompt names "items 7-15" from the audit P1 list. I include 7, 8, 10, 11 across the three PRs above. The following land in **P2** (separate effort, post-Round-8):

- P1-item-9 (D6-H5 compression) — **included in Coach-PR** (listed as P1 in audit, ship in this wave).
- P1-item-12 (D4-H4 SHA function consolidation + size guard) — **bundle into Coord-PR** as a 0.5-day addon; low risk, high value.
- P1-item-13 (D7-H2 L3.75 prose-synth caching) — P2. Narrow cost fix; no architectural stake. Can ship as its own tiny PR alongside Round 8.
- P1-item-14 (DB migration + RLS isolation tests) — **partially included** via P0-6's CI integration job. Full RLS isolation test suite is a dedicated effort; P2.
- P1-item-15 (merge 3 coach sections → 1 DIAGNOSTIC SNAPSHOT) — **explicitly part of Round 8** (prompt-compression is in the contract). Not a separate P1 PR.

---

## 4 — Sequencing & critical path

```
Day 0          ─ Approval on this plan ──────────────────────────────┐
                                                                      │
Day 1          ─ P0 PR open                                           │
  Commit 1-2   ─ CI + test scaffolding (C1, C2) ────┐                 │
                                                     │                 │
Day 2-3        ─ C3, C4, C5, C6 in parallel          │  Round 8       │
                                                     │  design doc    │
Day 4          ─ C7 un-skip, PR review               │  review        │
                                                     │                 │
Day 5          ─ P0 PR merges ──────────────────────┘                 │
                                                                      │
Day 6-10       ─ P1 PRs in parallel ────────────────────────┐         │
  Coord-PR       (3d)                                        │         │
  Coach-PR       (2d)                                        │         │
  Lifecycle-PR   (3d)                                        │         │
                                                             │         │
Day 10-11      ─ P1 PRs merge                                │         │
                                                             │         │
Day 11+        ─ Round 8 implementation begins ─────────────┘         │
                                                                      │
                 (contract approved Day 4 ─────────────────────────────┘)
```

**Critical path length:** 11 dev-days assuming 3 agents working concurrently on P0 + Round 8 design reviewer on lead, then 3 agents working concurrently on P1.

---

## 5 — Standing Invariants (apply to all PRs above AND Round 8+)

These are not TODOs; they are **rules that must hold at merge time** of any essay-intelligence PR from this point forward.

1. **No silent failures.** Every `catch` block either re-throws, surfaces to a telemetry channel, or returns a typed error envelope. `catch { console.error(); continue; }` is explicitly banned in new code. Existing instances identified in the audit must be fixed in their respective PRs.

2. **Coordinator-only profile writes.** All mutations to fields listed in the CI-lint whitelist go through `EssayProfileCoordinator` methods. Direct `profile.X = ` writes in `src/services/essayIntelligence/**/*.ts` outside `profileManager/` fail CI.

3. **Signals are capability, not inventory** — see [docs/SIGNAL_REGISTRATION_PROTOCOL.md](./SIGNAL_REGISTRATION_PROTOCOL.md). Every new signal added from Round 8 onward must register via `registerSignal()` with a documented consumer beyond "Sonnet reads it in the prompt."

4. **Persistence is proven, not assumed.** New persisted fields require a Supabase-round-trip integration test. Unit tests with mocked stores do not satisfy this invariant.

5. **Cost-per-turn is budgeted and measured.** New call paths ship with a cost-budget test. Round 8 planner call ≤ $0.15. Minimal coach turns (Haiku) ≤ $0.002. Comprehensive pipeline ≤ $2.00 (current budget; tighten with Round 8 cache work).

6. **Retry is enabled.** New call sites use `callClaudeWithRetry`, not raw `callClaude`. Raw `callClaude` remains exported for test instrumentation only.

---

## 6 — Open questions (resolve before P0 PR opens)

1. **C4 acceptance test — live Supabase or service-container?** Recommendation: service-container (reproducible in CI, no secrets exposure). Live-Supabase `supabase start` works locally during development but flakes in CI.
2. **C5 advisory-lock key strategy.** `hash(profileId)` ok for single-row contention; verify no cross-user collisions at advisory-lock table scale.
3. **C6 `classifyAsMinimal` sensitivity.** First-pass thresholds are conservative; tune post-ship via response-quality metric.
4. **P1 Coord-PR lint script.** Decide between grep (fast, noisy) vs. TypeScript AST walk (precise, slower). Recommendation: AST walk via `ts-morph`; slight slower but catches disguised patterns like `Object.assign(profile, { aoFirstRead: ... })`.

---

*This plan is the prescription. The audit was the diagnosis. Implementation is a separate session.*
