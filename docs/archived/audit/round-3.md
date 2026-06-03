# Round 3 Audit — D-1.11 Steps 2-15 + Phase 1 → Phase 2 readiness

> Phase-boundary audit (per §4: deeper than 3-commit cadence). Scope:
> verify round-1/2 closures (T2.6 + §3.C/§3.D/§5.A/§5.B/§6.A) at HEAD;
> audit D-1.11's full implementation (Steps 2-15 across 6 commits);
> determine Phase 2 entry readiness.
>
> Round-1 baseline: `docs/audit/round-1.md` (commit `d21e6e3`).
> Round-2 baseline: `docs/audit/round-2.md` (commit `ebe80bc`).

---

## §1 — Round metadata

- **Round number:** 3
- **Audit date:** 2026-04-28
- **HEAD at audit start:** `6b9c922`
- **Prior-round HEAD:** `ebe80bc`
- **Commits since round-2 (8 deliverable + 1 closure commit):**
  - `63617ac` — round-1 closure C: T2.6 (tautological 100-iteration test)
  - `4b958dc` — D-1.11 Steps 2-3: appendCarryForwardDecision + pruneRecentDecisions mutators (test-first)
  - `550cf09` — D-1.11 Steps 4-5: synthesizeCarryForwardSummary pure helper (test-first)
  - `96635ce` — D-1.11 Steps 6-12: 5 decision-point append-site wirings (DP-1..DP-4) + safe-append helper
  - `a37b6a1` — D-1.11 Step 13: amend commitIterationRecord
  - `1a61888` — D-1.11 Step 14: integration scenarios for decision-point append + synthesis
  - `bcc5be6` — D-1.11 Step 15: telemetry buffer essay-keyed (closes Step 0 deferral)
  - `6b9c922` — round-2 closures: bufferKey delimiter harmonization, status flip, spec reconciliation, stale test description
- **Audit method:** 3 parallel investigation agents (closure verification;
  D-1.11 Steps 2-15 deep audit; Phase 2 readiness check). Auditor
  independently verified the new ESLint mis-prefix finding by reading
  `eslint.config.js` plugin registration vs disable-directive
  prefixes.

---

## §2 — Round-1 / Round-2 closures verified

All 6 closure items verified CLOSED at HEAD `6b9c922`.

| ID | Status | Evidence |
|---|---|---|
| **T2.6** — tautological 100-iteration test (round-1 §5.B) | **CLOSED, exemplary** | `tests/unit/taught-move-builder.test.ts:284-315` — JSON round-trip via `JSON.stringify`/`JSON.parse` produces structurally-identical reference-distinct objects; strict `expect(ids1).toEqual(ids2)` and `expect(new Set(ids1).size).toBe(annotations.length)`. Plus secondary purity test at `:317-334` with two reference-distinct literals (`expect(a1).not.toBe(a2)`) and strict ID equality assertion. |
| **§3.C** — bufferKey JSDoc delimiter | **CLOSED** (delimiter changed) | `taughtMoveBuilder.ts:217-219` and `iterationTelemetry.ts:46-49` — both files now use **U+001F (ASCII Unit Separator)**, not the prior NUL. JSDoc at `taughtMoveBuilder.ts:201-216` and `iterationTelemetry.ts:26-46` cross-reference each other and explicitly call out U+001F + harmonization rationale. Hex-verified by `od -c`. |
| **§3.D** — telemetry buffer essay-keying (Step 15) | **CLOSED** | `iterationTelemetry.ts:46-49` applies the same compound-key fix. All 5 entry-points validate essayId non-empty (`emitIterationEvent` at `:85-88`, `emitStepStart` at `:115-123`, `emitStepSuccess`/`emitStepFailure` derive essayId from `inFlight.essayId` at `:183, 222`). Cross-essay isolation test at `tests/integration/phase0-types-migrations.test.ts:192-218`. |
| **§5.A** — emitMoveDropped framing | **CLOSED** | `priorAnnotationsBuilder.ts:255-285` — Builder kept `IterationTelemetryEvent.status` enum stable (`'started' \| 'succeeded' \| 'failed'` at `profileTypes.ts:5361`) and reframed the drop as `status: 'failed'` with rationale documented at `:261-272` ("drop IS a degradation from the audit-trail's perspective"). Second of round-2's two acceptable resolutions. |
| **§5.B** — stale `it()` description | **CLOSED** | `tests/integration/d1-10-iteration-bracket.test.ts:164` — string now reads `'rejects negative currentIteration via validateAndNormalizeIterationLedger'`. |
| **§6.A** — D-1.11 spec reconciliation | **CLOSED** | `L5_IMPLEMENTATION_PLAN.md:632-705` — explicit "Audit-driven scope expansion (2026-04-28)" subsection enumerates 5 decision points DP-1..DP-5 with deferral notes for DP-3c/DP-5; "15-step audit-driven implementation" with per-step contracts; effort revised to 6-8h. Aligns with the 8-commit chain. |

**Verdict on closures:** 6/6 verified. The Builder's spec reconciliation
at `6b9c922` is exemplary — the D-1.11 expansion is now first-class
documented in the spec, with per-step contracts and explicit deferrals
named. Pattern to repeat for future audit-driven expansions.

---

## §3 — D-1.11 Steps 2-15 implementation audit

### 3.A — Spec contract conformance (5 DPs vs spec's 4)

The original spec at `L5_IMPLEMENTATION_PLAN.md:638` named four decision
points; the post-expansion spec at `:632-672` authorizes FIVE (DP-1
through DP-5) with two explicitly DEFERRED:

| DP | Spec name | Builder wired? | Site |
|---|---|---|---|
| DP-1 | mode-selection | YES | `analysisOrchestrator.ts:533-540` + `reanalysisOrchestrator.ts:1075-1097` |
| DP-2 | per-paragraph priorAnnotations | YES | `analysisOrchestrator.ts:1113-1140` |
| DP-3a | walk findingEvolutions | YES | `analysisOrchestrator.ts:651-675` |
| DP-3b | synthesis findingEvolutions | YES | `analysisOrchestrator.ts:740-761` |
| DP-3c | focused-mode findingEvolutions | DEFERRED per spec | (focused-mode doesn't go through analyzeEssay) |
| DP-4 | delta synthesis | YES | `analysisOrchestrator.ts:1044-1068` |
| DP-5 | focused-mode holistic-carry | DEFERRED per spec | (same reason) |

Builder added zero unauthorized DPs. The spec's deferrals are honest
(focused-mode runs in a different orchestrator that this deliverable
deliberately doesn't touch). DP-3a/DP-3b are a sub-split of the spec's
"finding maturity refresh" — defensible, the producers are distinct.

### 3.B — Mutator + synthesizer + safe-append correctness

**`appendCarryForwardDecision`** (`essayProfileManager.ts:1184-1252`):
- Validates: missing iterationLedger, decision missing/non-object,
  iteration mismatch (with diagnostic naming both claimed+actual
  iterations), itemKey type+empty+>200 chars, decision enum,
  arbitrationMechanism enum, rationale type, costSavedIfCarry +
  costSpentIfRederive finite-number checks. All throw fail-fast.
- Tests at `iteration-ledger-accessor.test.ts:379-619` exercise 12
  cases for append + 8 for prune covering happy-path, all-enum-values,
  validation, append-only invariant.

**`pruneRecentDecisions`** (`:1279-1297`):
- Iteration-NUMBER window semantics (correct interpretation of "last 5
  iterations"): retains decisions where `d.iteration >= currentIteration
  - keepLastN + 1`. Preserves order. Handles `keepLastN=0` (drops all).
  Throws on negative or non-integer keepLastN.

**`synthesizeCarryForwardSummary`** (`carryForwardSynthesis.ts:51-104`):
- Pure function (no input mutation, fresh object per call). Filters by
  `d.iteration === iteration` strictly. Switch over the 3 enums with
  `default: break` for silent drop on out-of-enum (validation lives in
  appendCarryForwardDecision, not the synthesizer — appropriate).
- Multi-bucket conflict surfaces in BOTH output arrays (audit signal,
  not silent mask).
- 15 test cases at `tests/unit/carry-forward-synthesis.test.ts`.

**`safeAppendCarryForwardDecision`** (`carryForwardSynthesis.ts:138-170`):
- The charter-sanctioned swallow site per no-fallback §8. Catches
  errors from appendCarryForwardDecision; emits structured
  `iterationTelemetry` event with `step: 'carryForward.decision_append_failure'`,
  `status: 'failed'`, `code: 'carry_forward_decision_append_failure'`,
  context object naming `itemKey, decisionType, attemptedIteration,
  actualCurrentIteration`. Does NOT abort iteration.
- Documentation explicitly cites no-fallback §8 and the
  audit-trail-vs-analysis-correctness tradeoff. Swallow scope is tight
  (only validation throws are caught; not other errors).

### 3.C — Step 13 commitIterationRecord amendment

`analysisOrchestrator.ts` at HEAD:
- `:2024-2029` — D-1.10's `{ carried: [], rederived: [], refreshed: [] }`
  stub replaced with `synthesizeCarryForwardSummary(profile.iterationLedger.recentDecisions, iter)`.
- `:2053` — `escalationLevel: input.focusedEscalationLevel ?? 0`
  replaces D-1.10's hardcoded `0`.
- `:1976-2003` — `editScope.structural.added/removed` derived from
  iterating `brief.netChanges[]` and counting by `changeType`. Real
  counts, not boolean→0/1 stubs.
- `:2104-2105` — `pruneRecentDecisions(profile, 5)` runs AFTER
  successful checkpoint at `:2087`. Caller invariant satisfied.

### 3.D — `[MED]` New finding F-DP1.A: `focusedEscalationLevel` dead-wired on producer side

- **Consumer side** (CORRECT, Step 13): `analysisOrchestrator.ts:2053`
  reads `input.focusedEscalationLevel ?? 0`.
- **Producer side** (DEAD): `reanalysisOrchestrator.ts:703-721`
  (`triggerReanalysis` building `pipelineInput`) does NOT thread
  `focusedEscalationLevel` from `focusedResult.escalationLevel`.
  `runComprehensiveMode` (line 1244ff) which calls `triggerReanalysis()`
  after focused→comprehensive escalation has access to
  `focusedResult.escalationLevel` and never passes it through.
  `grep -rn focusedEscalationLevel src/` returns ONLY the type
  declaration, the doc-comment, and the consumer — zero producers.
- **Why this matters.** Step 1's JSDoc at `analysisOrchestrator.ts:284-300`
  explicitly named the producer: "`reanalysisOrchestrator.triggerReanalysis()`
  reads from `focusedResult.escalationLevel` when re-analysis ran
  focused-mode." That promise is unkept. `IterationRecord.escalationLevel`
  will always be `0` in production, even when focused→comprehensive
  escalation fires. This is the SAME dead-wire shape Round 1 caught
  pre-D-1.10 (5 dead wires); the lesson hasn't fully landed.
  D-4.11 escalation calibration depends on this counter being honest.
- **Recommended fix.** In `runComprehensiveMode`, store
  `focusedResult?.escalationLevel` on a transient instance field
  `lastFocusedEscalationLevel` (mirrors existing `lastModeSelectionDecision`
  pattern). In `triggerReanalysis`, thread it:
  `focusedEscalationLevel: this.lastFocusedEscalationLevel ?? undefined`,
  then clear post-call. Add a unit/integration test asserting the wire.

### 3.E — `[MED]` New finding F-Q4.A: DP-1..DP-4 wirings have no end-to-end test coverage

- **Site.** All 6 scenarios + bonus in `tests/integration/d1-11-decisions.test.ts`
  (322 lines) construct decisions BY HAND via direct
  `appendCarryForwardDecision` calls. Zero scenarios drive
  `analyzeEssay()` or `triggerReanalysis()` to verify DP-1..DP-4 fire
  at the right call sites with the right payload shapes.
- **Why this matters.** The actual decision-point wirings
  (`analysisOrchestrator.ts:535, 665, 751, 1058, 1128`) are unverified
  at runtime. A typo in one of the DP call sites (wrong itemKey scheme,
  wrong decision enum, wrong iteration value) would silently produce a
  wrong-but-shape-valid `carryForwardSummary` that no test catches.
  The Step 13 commit message asserts call-site ordering by line
  number — that needs to be promoted into a runtime test.
- **Recommended fix.** Naturally lands at D-1.15 (mock-LLM full iter
  1→2 integration test). Ensure the iter-2 assertion checks
  `recentDecisions[]` contains expected entries from each of the 5 DPs:
  DP-1 mode_selection, DP-2 `L5.P{i}.annotations`, DP-3a `findingId`,
  DP-3b `findingId`, DP-4 section name. Make this a hard assertion in
  the D-1.15 spec.

### 3.F — `[LOW]` Cost stubs (costSavedIfCarry, costSpentIfRederive) are zeros on 4 of 5 DPs

DP-4 alone (`analysisOrchestrator.ts:1058`) has real cost attribution
(`deltaResult.cost / Math.max(1, affectedSections.length)`). DP-1, DP-2,
DP-3a, DP-3b all use `costSavedIfCarry: 0, costSpentIfRederive: 0`
with explicit comments deferring to D-4.11 baseline-cost reference
table. Documented stub, intentional. NOT a regression. No fix needed
in D-1.11; D-4.11 spec should call out that 4 of 5 DPs ship with zero
cost stubs requiring baseline reference table.

### 3.G — Verified-correct in D-1.11

- Mutator validation surface (8 throw conditions, all named in tests).
- pruneRecentDecisions iteration-NUMBER window semantics.
- Synthesizer purity (no input mutation, fresh object per call) +
  insertion-ordered Set dedup + multi-bucket-conflict surface.
- safeAppend tight swallow scope + honest documentation.
- DP-1 ordering: append AFTER `incrementIteration` so iteration
  validator passes.
- DP-1 producer-instance-field-clear-after-consume pattern.
- DP-2 itemKey scheme `L5.P${idx}.annotations` and currentIteration
  (not -1) usage.
- DP-3a/b enum mapping (`superseded`→`'rederive'`, others→
  `'partial_refresh'`) with `'llm_judgment'` arbitrationMechanism.
- DP-4 real cost attribution + `'comprehensive_rule'` arbitrationMechanism.
- Step 13 ordering: synthesis BEFORE record construction; prune
  AFTER successful checkpoint.
- editScope counts derived from real iteration over `brief.netChanges[]`.
- No new no-fallback violations across all six commits (only 1 new
  charter-sanctioned catch).
- Type-check clean (`npx tsc --noEmit`).
- Test count grew 233 → 262 (+29 D-1.11 tests).
- Cost ledger stable at $0.5110 (pure-text deliverable).
- Step 15 essay-keyed buffer fix consistently applied to all 5 safeAppend
  call sites.

---

## §4 — `[MED]` New finding: ESLint `no-silent-fallback` disables silently inert

- **Plugin registration** (`eslint.config.js`):
  ```javascript
  plugins: {
    "react-hooks": reactHooks,
    "react-refresh": reactRefresh,
    // Phase 0 D-0.12 — local plugin for the no-fallback charter.
    "local": { rules: { "no-silent-fallback": noSilentFallback } },
  },
  rules: {
    ...
    "local/no-silent-fallback": "warn",
  },
  ```
  The rule is registered as **`local/no-silent-fallback`**.
- **Disable directives** (added in `045fffa` round-1 closure A):
  - `priorAnnotationsBuilder.ts:565`: `// eslint-disable-next-line no-silent-fallback -- ...`
  - `priorAnnotationsBuilder.ts:598`: same bare prefix
  - `analysisOrchestrator.ts:421`: same bare prefix

  All three use bare `no-silent-fallback`, NOT `local/no-silent-fallback`.
- **Effect.** ESLint reports `Definition for rule 'no-silent-fallback'
  was not found` for each disable comment AND the actual `local/no-silent-fallback`
  rule continues to warn on the same lines. The disable directives are
  silently inert.
- **Why this matters.** Round-1 §4.G demanded these disables to
  document mode-selection sites. Round-2 §2 verified the comments
  were ADDED but did not run ESLint to verify the directive is active.
  Functionally the code is correct (the `??` defaults are documented
  mode-selection patterns); the audit-trail is misleading because
  ESLint still flags the lines and the disables don't suppress them.
- **Recommended fix.** Edit the 3 disable comments at the cited
  file:lines to use `local/no-silent-fallback`. One-line change per
  site. Verify by running ESLint locally.

---

## §5 — Phase 1 → Phase 2 readiness

### 5.A — Phase 2 dependency graph: ALL DEPS IN PLACE

Phase 2's type-level dependencies are all present at HEAD `6b9c922`:
- D-2.1 QuestionQueueManager extension — `profileTypes.ts:5639-5645`
  (UnderstandingQuestion source union with 'analysis_specifics_gap'),
  `:5656-5662` (status union extension), `:5689-5729` (DigContext 10
  fields). `analysis/questionQueueManager.ts` exists.
- D-2.2 sequentialDeepWalk — exists.
- D-2.3 L3.5 prompt extension — schema fields at `profileTypes.ts:4038`
  (contradictionFlags) + `:4063` (essayStrengthSignatures).
- D-2.4 holisticSynthesis.ts — exists.
- D-2.5 L4 northStar — exists (assumed).
- D-2.6 findingStore — exists.

No type-level gaps blocking Phase 2 work mechanically.

### 5.B — Phase 1 INCOMPLETE — D-1.12 through D-1.18 unstarted

| Deliverable | Spec | Status |
|---|---|---|
| **D-1.12** Halt-on-error pass on orchestrators | `:643` | **NOT STARTED**. Round-1 §4.E HIGH/PRE-EXISTING (AO First Read swallow at `analysisOrchestrator.ts:425-430`) is still open. ~15 ESLint warnings on legacy fallback patterns. |
| **D-1.13** TaughtMove ID stability property test (`tests/property/taughtMoveIdStability.ts`) | `:655` | **NOT LANDED**. `tests/property/` directory does not exist. Unit test at `tests/unit/taught-move-builder.test.ts:53-94` covers determinism informally but is not at the spec'd path. |
| **D-1.14** IterationLedger append-only invariant test (`tests/property/iterationLedgerAppendOnly.ts`) | `:665` | **NOT LANDED**. File does not exist. |
| **D-1.15** Mock-LLM full iter 1→2 integration test (`tests/integration/phase1-iteration-ledger.ts`) | `:675` | **NOT LANDED**. File does not exist. Closest existing test (`tests/integration/d1-10-iteration-bracket.test.ts`) is seam-level. |
| **D-1.16** Failure-injection test (`tests/integration/phase1-failure-injection.ts`) | `:685` | **NOT LANDED**. File does not exist. No checkpoint-failure scenario anywhere (T2.8 still open). |
| **D-1.17** Phase 1 cross-phase integrity audit (`docs/audit/phase-1-integrity-audit.md`) | `:698` | **NOT LANDED**. The auditor's round-1/round-2/round-3 reports do not substitute for the Builder's spec'd D-1.17 deliverable. |
| **D-1.18** Phase 1 cumulative cost-ledger check | `:708` | **NOT PERFORMED**. No formal entry in `BUILD_COST_LEDGER.md`. Spec at `:708` says `Blocks: Phase 2 entry`. |

### 5.C — Spec drift remediation status

Round-1 §3 flagged 4 spec-drift items; round-2 closure `6b9c922`
addressed only ONE.

| Item | Status |
|---|---|
| D-1.1 currentIteration default (round-1 §3.B) | **STALE** — `L5_IMPLEMENTATION_PLAN.md:457` still says `currentIteration = 1` on create |
| D-1.2 ID format (round-1 §3.C) | **STALE** — `:470` still says `M-{iter}-{para}-{sequenceInParagraph}` |
| D-1.3 Haiku → Sonnet (round-1 §3.A) | **STALE** — `:477,501,503` still say "Haiku call" |
| D-1.10 REVISIT hedge (round-1 §3.D) | **STALE** — REVISIT comment at `:619` not removed |
| D-1.11 audit-driven step expansion (round-2 §6.A) | **FIXED** in `6b9c922` |

### 5.D — Locked decisions still honored

- Q1 Resolution A (no mandated redirection): HONORED. `comprehensiveBaselineCost`
  JSDoc at `profileTypes.ts:5258-5267` explicitly cites R-1 Resolution A.
- Q4 0.7 floor: HONORED. `landingDetector.ts:54` declares the constant;
  downgrade logic at `:143, :357` strict-less-than.
- Q-A continuous chat / Q-B analysis-driven dig: untouched in Phase 1
  (Phase 3 territory).

### 5.E — Cost ledger

Cumulative `$0.5110` of `$9` hard halt (Option A) or `$24` (Option B).
Well within. D-1.11 added zero (pure-text). Per-call rows from D-1.5
calibration are unattributed in the ledger's deliverable column (only
the summary rows carry the tag) — minor ledger-hygiene gap but not a
charter violation.

### 5.F — Phase 2 entry verdict: NO-GO

Per the dependency graph: Phase 1 is materially incomplete. D-1.18
spec at `:708` says explicitly: "Blocks: Phase 2 entry."

**Material blockers:**
1. **Tier 1 round-1/2 (D-1.5 calibration)** — STILL BLOCKED on Tue's
   accept-or-rerun decision. Landing-detector prompt is PROVISIONAL.
2. **D-1.12** — round-1 §4.E HIGH/PRE-EXISTING AO First Read swallow
   open. ~15 ESLint warnings on pre-existing fallback patterns the
   no-fallback charter targets.
3. **D-1.13–D-1.16** — property tests + mock-LLM integration test +
   failure-injection test not landed. Phase 1's correctness rests on
   seam-level tests; orchestrator-driven path has zero E2E coverage.
4. **D-1.17** — Phase 1 spec-required audit doc not landed. (The
   auditor's round-1/2/3 are catch-up audits, not the spec's D-1.17
   Builder-authored deliverable.)
5. **D-1.18** — formal cost-ledger check not performed.
6. **F-DP1.A** (this round, MED) — `focusedEscalationLevel` producer
   dead-wired. D-4.11 calibration depends on this.
7. **§5.C STALE** — 4 of 5 round-1/2 spec-drift items still unfixed.
8. **§4 ESLint mis-prefix** (this round, MED) — round-1 §4.G disables
   are silently inert.

**Conditional path to GO** (estimated 1–3 working days plus Tue's
D-1.5 ruling):

A. Tue rules on T1.1/T1.2/T1.3 (D-1.5 calibration discipline) — accept
   the v0.5.0-round5 prompt or commission a re-run on a held-out set.

B. Builder lands D-1.12 (closes round-1 §4.E + ESLint warnings),
   D-1.13/D-1.14 (property tests at spec'd paths in `tests/property/`),
   D-1.15 (real `analyzeEssay`-driven integration test, closes
   round-1 §5.C + F-Q4.A; assert recentDecisions[] populated by all
   5 DPs), D-1.16 (failure-injection including checkpoint throw,
   closes round-1 §5.D + T2.8), D-1.17 (phase-1-integrity-audit.md),
   D-1.18 (formal ledger check).

C. F-DP1.A producer-side wire-up + tests.

D. Spec drift batch — single commit reconciling D-1.1/D-1.2/D-1.3
   currentIteration, ID format, Haiku→Sonnet; remove D-1.10 REVISIT
   hedge.

E. Three ESLint disable directives re-prefixed to `local/no-silent-fallback`.

**Soft-conditional partial path** (Tue may accept risk to start
typed-only Phase 2 work in parallel): begin D-2.1 (QuestionQueueManager
extension — pure type/code, no LLM) while Phase 1 completes. Do **not**
start D-2.2–D-2.6 (prompt extensions) until Phase 1 closes — prompt
revision discipline requires a stable foundation, and Phase 2's
prompt-extension work is where bugs cascade.

---

## §6 — Open items rolled forward

| ID | Source | Status as of round-3 | Notes |
|---|---|---|---|
| T1.1, T1.2, T1.3 | round-1 | OPEN, BLOCKED on Tue | D-1.5 calibration accept-or-rerun |
| T1.4 §4.A/B/C/D | round-1 | CLOSED at round-2 | |
| T1.5 | round-1 | CLOSED at round-2 | |
| T2.1 spec reconciliation batch | round-1 | OPEN — 4 of 5 STALE (only D-1.11 fixed) | §5.C |
| T2.2 D-1.9 invariant enforcement | round-1 | OPEN | Defer to D-1.12 |
| T2.3 D-1.12 AO First Read | round-1 | OPEN — D-1.12 not started | §5.B blocker |
| T2.4 §4.F | round-1 | CLOSED at round-2 | |
| T2.5 §4.G | round-1 | CLOSED at round-2 (but see §4 — directives mis-prefixed) | NEW MED §4 |
| T2.6 | round-1 | CLOSED at round-3 | §2 |
| T2.7 D-1.10 orchestrator-driven test | round-1 | OPEN — folded into D-1.15 | §5.B blocker |
| T2.8 D-1.10 checkpoint-failure scenario | round-1 | OPEN — folded into D-1.16 | §5.B blocker |
| T2.9 D-1.10 expansion ack | round-1 | OPEN, BLOCKED on Tue | |
| T2.10 identify 2 skipped tests | round-1 | OPEN — vitest now reports 262/264; same 2 skipped, still unidentified | |
| T3.1 D-1.4 variants saved | round-1 | OPEN | Tier 3 |
| T3.3 l5AnnotationToTaughtMove validation | round-1 | OPEN | Tier 3 |
| T3.5 D-0.12 ESLint blind-spot patches | round-1 | OPEN, deferred to D-3.15 | |
| Round-2 §3.C bufferKey | round-2 | CLOSED at round-3 | |
| Round-2 §3.D telemetry buffer essay-keying | round-2 | CLOSED at round-3 | |
| Round-2 §5.A emitMoveDropped framing | round-2 | CLOSED at round-3 | |
| Round-2 §5.B stale it() description | round-2 | CLOSED at round-3 | |
| Round-2 §6.A spec reconciliation | round-2 | CLOSED at round-3 (D-1.11 only) | broader spec drift §5.C |
| **F-DP1.A** focusedEscalationLevel producer dead-wire | **round-3** | **OPEN, MED** | §3.D |
| **F-Q4.A** DP-1..4 wirings no E2E test coverage | **round-3** | **OPEN, MED** | §3.E folded into D-1.15 |
| **F-LOW** DP cost stubs | **round-3** | OPEN, LOW | §3.F deferred to D-4.11 |
| **§4 ESLint mis-prefix** | **round-3** | **OPEN, MED** | §4 |

**Closure rate:** 11 of 22 round-1 items closed. Round-2 added 4 new
items, 4 closed at round-3. Round-3 added 4 new items (3 MED, 1 LOW).
Net open: ~15 items, of which 7 are Phase 2 blockers (D-1.12–D-1.18 +
3 D-1.5 Tier-1) plus this round's 3 new MEDs.

---

## §7 — Recommended actions (round-3)

### Tier 1 — must close before Phase 2 entry

1. **Tue D-1.5 ruling** (T1.1/T1.2/T1.3) — accept-or-rerun.
2. **Builder D-1.12 → D-1.18** — six deliverables. Per spec dependency
   graph, this is the sequence Phase 1 needs to formally close.
3. **§4 ESLint mis-prefix** — three one-line edits. Re-prefix
   `no-silent-fallback` → `local/no-silent-fallback` at:
   - `src/services/essayIntelligence/analysis/priorAnnotationsBuilder.ts:565`
   - `src/services/essayIntelligence/analysis/priorAnnotationsBuilder.ts:598`
   - `src/services/essayIntelligence/analysis/analysisOrchestrator.ts:421`
4. **§3.D F-DP1.A** — wire `focusedEscalationLevel` producer in
   `reanalysisOrchestrator.runComprehensiveMode` + thread through
   `triggerReanalysis`. Add unit/integration test.

### Tier 2 — should close before Phase 2 → Phase 3 boundary

5. **§5.C spec drift batch** — single commit reconciling D-1.1, D-1.2,
   D-1.3 spec text; remove D-1.10 REVISIT hedge.
6. **§3.E F-Q4.A** — at D-1.15 implementation, assert
   `recentDecisions[]` contains entries from all 5 DPs after iter 2.
7. Round-1 Tier 2 items still open: T2.10 (identify 2 skipped tests),
   T2.9 (D-1.10 expansion ack — Tue).

### Tier 3 — cleanup

8. **§3.F LOW** — at D-4.11 spec, document that 4 of 5 DPs ship with
   zero cost stubs requiring baseline reference table.
9. Round-1 Tier 3: T3.1, T3.3, T3.5.

---

## §8 — Confidence on this round

### Verified directly
- All 6 round-1/2 closures by re-reading file:lines at HEAD `6b9c922`.
- bufferKey delimiter is now U+001F (verified by `od -c`).
- ESLint plugin registration: `local/no-silent-fallback`; disable
  directives use bare `no-silent-fallback`. Confirmed via
  `git show 6b9c922:eslint.config.js`.
- `focusedEscalationLevel` producer side: `grep -rn focusedEscalationLevel
  src/` returns only declaration + doc + consumer; no producer.
- D-1.11 commit chain alignment with the 15-step expansion in spec.

### Confidence on D-1.11 audit
The Builder's discipline is materially mature:
- Test-first ordering on Steps 2-3 and Steps 4-5 (tests committed BEFORE
  implementation in the `git show` order).
- charter-sanctioned swallow at `safeAppendCarryForwardDecision` is
  honestly documented and tightly scoped.
- Step 13 ordering (synthesis BEFORE record construction; prune AFTER
  successful checkpoint) is correct.
- Spec reconciliation at `6b9c922` is exemplary — first-class
  documentation of the 15-step audit-driven expansion.

The two MED findings (F-DP1.A producer dead-wire, F-Q4.A no E2E test
coverage) are the same DEAD-WIRE pattern that round-1 caught
pre-D-1.10. The Builder's pre-D-1.11 5-agent audit caught the
incoming dead wires (telemetry buffer, etc.) but did not catch
F-DP1.A on the Step 13 amendment side. Worth surfacing as a recurring
audit-pattern.

### Did not verify
- The Builder's claimed "5-agent pre-D-1.11 audit" actually ran
  (no repo trail; take at face value).
- Whether vitest 262/264 + 2 skipped is reproducible locally — Builder
  claim accepted.
- Whether `npx eslint .` actually produces the predicted "rule not
  found" messages — predicted by reading the plugin registration vs
  disable-directive prefix mismatch; running ESLint locally would
  confirm.

### Phase 2 entry verdict confidence: HIGH

NO-GO is supported by the spec's explicit `D-1.18 → Blocks: Phase 2
entry`, the seven unstarted Phase 1 deliverables (D-1.12 through
D-1.18), and the BLOCKED Tier-1 round-1 items pending Tue's ruling.

---

> **End of Round 3 audit.** Phase 1 is materially incomplete; Phase 2
> entry is NO-GO. The Builder's discipline on D-1.11's audit-driven
> expansion is exemplary, but the dead-wire pattern recurred at
> F-DP1.A — a recurring audit theme worth tracking.
>
> Next wake at next 3-commit cadence or any major closure (D-1.12,
> D-1.15, D-1.17 likely the next material milestones).
