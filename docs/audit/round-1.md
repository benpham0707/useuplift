# Round 1 Audit — Phase 0 + Phase 1 (D-0.1 → D-1.10)

> Catch-up audit run from a fresh Auditor chat (separate from the Builder
> chat). The Round-0 hand-audit findings were the seed; every claim here
> was re-verified from primary sources (committed code, committed specs,
> committed tests, BUILD_COST_LEDGER) — Round-0's "verified-correct"
> claims were not trusted, and Round-0's open findings are tracked
> through the open-items table in §11.

---

## §1 — Round metadata

- **Round number:** 1 (catch-up audit)
- **Audit date:** 2026-04-28
- **HEAD at audit start:** `1b60e01` (`feat/integrated-pipeline-build`)
- **Deliverables covered:**
  - Phase 0: D-0.1 → D-0.19 (every deliverable landed; Builder's self-audit at
    `docs/audit/phase-0-integrity-audit.md` re-verified independently).
  - Phase 1: D-1.1 → D-1.10 (D-1.9 marked SUBSUMED; D-1.10 just landed
    at HEAD, with audit-driven scope expansion at `a6d4485`).
- **Audit method:** 5 parallel investigation agents (D-1.1+1.2 spec
  conformance, D-1.3+1.4+1.5 prompt + calibration, D-1.6+1.7+1.8 chain +
  D-1.9 subsumption check, no-fallback grep + ESLint blind spots, D-1.10
  + cumulative state + forward-compat). Auditor independently verified
  every HIGH and the most consequential MED findings against
  `git show <sha>:<path>` and grep.
- **Prior-round HEAD reference:** there is no committed Round-0
  baseline at `docs/audit/round-0-baseline.md`. The Round-0 hand-audit
  findings reside in the prompting context that opened this Auditor
  session; this round treats Round-0 as a SEED for what to look for,
  not as authoritative truth. Where Round-0 is referenced below, the
  Round-1 verification stands or falls on its own evidence.

---

## §2 — Verified-correct (per deliverable)

Items independently re-verified at HEAD `1b60e01`. File:line evidence
inline; only the Phase 1 highlights and the most consequential Phase 0
re-verifications are listed (Phase 0's full checklist already lives in
`phase-0-integrity-audit.md` and that audit doc was re-walked with no
fresh disagreements except the items in §3 / §4).

### Phase 0 — re-verified
- **D-0.1 IterationLedger types** match `L5_ITERATION_LOOP_DESIGN.md`
  §7.1 verbatim. The `events?` amendment to `IterationRecord` is
  documented in `iterationTelemetry.ts` and in profileTypes.ts JSDoc.
- **D-0.10 cost ledger.** `BUILD_COST_LEDGER.md` cumulative is
  **$0.5110 of $9 hard halt** (Option A) — well under cap. Sums verified:
  the printed cumulative column equals the running sum of `cost_usd`
  values at every row. No unattributed entries.
- **D-0.12 ESLint rule** correctly excludes `console.error` from the
  `^emit/` allowlist — re-read the rule at `eslint-rules/no-silent-fallback.js`
  lines 60–94 and confirmed `console.error` will be flagged in catch
  blocks (not a Round-0 blind spot in the direction Round-0 predicted —
  see §5.E for the actual blind spots).
- **D-0.18 / D-0.19** Phase-0 self-audit + integration test gate land;
  the integration test (`tests/integration/phase0-types-migrations.test.ts`)
  exercises the round-trip path.

### Phase 1 — re-verified

- **D-1.1 accessor + mutator + validator** wired to two
  `essayProfileManager.fromCheckpoint` call sites
  (`essayProfileManager.ts:1524`, `:1527` of HEAD `1b60e01`); structure
  validation at `assertIterationLedgerOnLoad` `essayProfileManager.ts:1054-1075`
  fail-fasts with diagnostics naming the corrupt field. `getCurrentIteration`
  at `:1008-1018` and `incrementIteration` at `:1093-1135` honor the
  spec (with the divergence on create-time default flagged in §3).
- **D-1.3 / D-1.4 schema validator + Q4 confidence floor.**
  `landingDetector.ts:54` sets `ADDRESSED_CONFIDENCE_FLOOR = 0.7`; the
  enforcement at `:358-366` is strict-less-than, with the boundary at
  0.7 staying `addressed` (test at `tests/unit/landing-detector.test.ts:109-118`
  locks the boundary in). Schema validator at `landingDetector.ts:275-342`
  is airtight: every field, every enum, finite numeric on confidence,
  [0,1] range, non-empty reasoning, signalsUsed array + non-empty +
  every entry in enum. The structured-output enforcement is exemplary.
- **D-1.6 priorAnnotations builder.** Iteration filter
  `taughtAtIteration === currentIteration - 1` at
  `priorAnnotationsBuilder.ts:167-170`. Iter 1 returns `undefined`
  (`:163-165`). `addressedByEdit: landing.status === 'addressed'`
  strict at `:223`. Detector failure rethrown with structured cause
  (`:309-318`). Sequential `for...of` (no `Promise.allSettled`).
- **D-1.7 index remap.** `paragraphRemapBuilder.ts` covers all spec
  edge cases: phase-1 hash-equal pairing (`:134-166`), phase-2 overlap
  >0.30 (`:207-225`), phase-3/4 disambiguated drops (`:232-245`),
  phase-5b cross-validation against `diff.structural.paragraphsRemoved`
  added at `:257-280` by the `09a0c74` audit-fix commit. `tests/unit/paragraph-remap-builder.test.ts`
  fixtures cover identity / swap / cyclic / inserts / deletes /
  modified / multi-edit / duplicate-positional / empty / ambiguous /
  cross-validation throws (F1–F19).
- **D-1.8 orchestrator wire-up.** Hard-coded `undefined` at the
  former `:850` is replaced by `buildPriorAnnotationsForOrchestrator(...)`
  at `analysisOrchestrator.ts:970-976` of HEAD `1b60e01`; passed as
  `priorAnnotations` to `deepAnnotationService.generateAnnotations(...)`
  at `:978-987`. Builder failure flows through the surrounding Phase-6
  try/catch (no swallow). Caller-override-precedence test at
  `tests/integration/d1-8-prior-annotations-wireup.test.ts:406-446`.
- **D-1.9 subsumption claim VERIFIED-CLOSED.**
  `grep -rn "generateAnnotations" src/ --include="*.ts"` returns exactly
  one production callsite: `analysisOrchestrator.ts:978`. Comments,
  type-only imports, and method definitions accounted for (separately).
  `reanalysisOrchestrator.ts:1177` is `let totalCost = totalCostSoFar;`
  (the spec's old line numbers were stale). `focusedAnalyzer.ts` has
  zero references to `deepAnnotationService` or `generateAnnotations`.
  D-1.9 can stand as no-op deliverable; the subsumption claim is not a
  Builder hand-wave. **However**, the locked architectural invariant
  ("future code that adds a NEW L5 callsite must go through the
  composer") is not enforced in any way — see §3.E.
- **D-1.10 dead-wire claim VERIFIED.** All 5 Phase-1 dead wires named
  in the audit-driven scope expansion at `a6d4485` were genuinely
  orphan at parent commit `1b60e01^`: zero `incrementIteration` callers,
  zero `bufferTaughtMoves` callers, zero `flushEventsForIteration`
  callers, zero `iterations.push` writes, and `reanalysisOrchestrator`'s
  `analyzeEssay` call took no `priorIterationLedger` argument
  (silently reset on every reanalysis). The expansion is factually
  justified, not scope creep.
- **D-1.10 implementation conformance — 5/5 closed correctly.**
  Entry increment at `analysisOrchestrator.ts:478`; L5 buffer at
  `:1014-1024`; commit at `:1187-1196` (success path) and `:2076-2086`
  (partial-result path); re-analysis ledger continuity threaded through
  PipelineInput (`reanalysisOrchestrator` ~line 684 captures ledger
  before `analyzeEssay`); atomic-commit semantics implemented at
  `commitIterationRecord` (`:1782-1905`) — buffers cleared ONLY after
  successful checkpoint write (`:1891-1893`).

---

## §3 — Spec/code deviations

### 3.A — `[HIGH]` D-1.5 model policy: spec says Haiku, code uses Sonnet, spec doc not updated

- **Spec quotes** (`L5_IMPLEMENTATION_PLAN.md`):
  - `:477` — "### D-1.3 — Landing detector skeleton (Haiku call + structured output validation)"
  - `:501` — "Single Haiku call per (TaughtMove, iteration). Structured output enforced via Anthropic SDK's tool-use or JSON-mode."
  - `:503` — "Failure surface: Haiku call failure → throw"
  - `:62` and `:108` — both name Haiku in cost-allocation table and DAG.
- **Code** (`landingDetector.ts:51`):
  `export const LANDING_DETECTOR_MODEL = 'claude-sonnet-4-5-20250929';`
  with header comment at `:14-21` invoking "Tue's 2026-04-27 model
  policy" (no link, no doc reference, no commit citation outside this
  file).
- **Cost arithmetic.** Sonnet ~$0.012/call vs Haiku ~$0.0008/call ≈ 15× more
  per call. D-1.5 calibration spent $0.5110 across 50 Sonnet calls;
  Haiku would have been ~$0.034. Within the $0.50–$1.00 D-1.5 budget,
  but the budget allocation in the spec was sized for Haiku, so the
  latitude was eaten by the swap.
- **Why this matters.** The model policy may well be authorized in
  spirit by Tue's 2026-04-27 directive, but the implementation plan is
  the source-of-truth and per the build handoff §10 contract changes
  must be reflected in the plan. Right now we have an authoritative
  spec saying Haiku and code saying Sonnet — a future auditor or
  re-implementer will not know which is correct. At runtime the landing
  detector fires once per TaughtMove per iteration; on a busy session
  the 15× delta compounds and warrants explicit accounting.
- **Recommended fix.**
  1. Edit `L5_IMPLEMENTATION_PLAN.md:477,501,503,62,108` to read Sonnet
     (or "model per Tue's 2026-04-27 policy, see `landingDetector.ts`
     header"). One-line PR.
  2. Add an explicit "Model Policy 2026-04-27" subsection to
     `L5_IMPLEMENTATION_PLAN.md` (or a top-level doc) documenting the
     directive's authority, rule statement, and pre-existing-Haiku
     exemption rules. Right now the policy lives only in
     `landingDetector.ts:14-21` and the `d3fc031` commit message —
     fragile.
  3. Add a one-row entry to the cost-allocation table reflecting per-call
     Sonnet pricing for the landing detector.

### 3.B — `[MED]` D-1.1 currentIteration default — spec says 1, code sets 0; not reconciled in the spec doc

- **Spec** (`L5_IMPLEMENTATION_PLAN.md:457`): "On profile create,
  `iterationLedger.currentIteration = 1`."
- **Code** (`essayProfileManager.ts:961` at HEAD `1b60e01`):
  `currentIteration: 0,`
- **Builder's reconciliation.** Source comment at
  `essayProfileManager.ts:956-959` (commit `f6f61c0`) acknowledges the
  divergence: "Resolves the small contract divergence between D-0.5
  ('currentIteration = 0 at create') and D-1.1's prose (...= 1) —
  D-0.5's create-time default of 0 is correct; the first
  incrementIteration() call at orchestrator entry takes it to 1." Test
  at `tests/unit/iteration-ledger-accessor.test.ts:38-46` locks code
  behavior (asserts 0 on fresh profile).
- **Why this matters.** The code is right; the spec is wrong. A future
  reader looking at the spec sees "create → 1" and either (a) loses
  trust in either spec or code, or (b) "fixes" the code to match the
  spec, breaking incrementIteration's semantics. The justification
  lives only in a source-code comment; the spec doc was not updated.
- **Recommended fix.** Edit `L5_IMPLEMENTATION_PLAN.md:457` to:
  "On profile create, `iterationLedger.currentIteration = 0`. The first
  `incrementIteration(profile, triggeredBy)` call at orchestrator entry
  (D-1.10) takes it to 1, marking the start of iteration 1."

### 3.C — `[MED]` D-1.2 ID format — spec literal not honored, divergence not in spec doc, "deterministic" justification misleading

- **Spec** (`L5_IMPLEMENTATION_PLAN.md:470`): "Stable ID format:
  `M-{iteration}-{paragraphIndex}-{sequenceInParagraph}`."
- **Code** (`taughtMoveBuilder.ts:79`): `M-${iteration}-${annotation.location.paragraphIndex}-${annotation.id}`
- **Builder's justification** (commit `360937e` message + source comment
  at `taughtMoveBuilder.ts:24-31`): claims `annotation.id` is "stable
  across runs (deterministic from inputs); unique within (iteration,
  paragraphIndex) because L5Annotation.id is unique within an
  L5AnnotationResult."
- **Misleading-justification evidence.** L5Annotation.id is assigned
  by `crypto.randomUUID()` at `deepAnnotationService.ts:2034` (the
  SOLE assignment site for the field). Two runs of the same essay
  analysis produce DIFFERENT L5Annotation.id values and therefore
  different TaughtMove ids. The Builder's "deterministic from inputs"
  claim is false at the L5Annotation level.
- **Operational impact (tempering the severity).** In production the
  iteration loop persists each iteration's TaughtMoves in
  `iterationLedger.taughtMoves[]`; iteration N+1 reads them by reference
  from the persisted ledger, not by regenerating. So the cross-iteration
  carry-forward mechanism does NOT depend on the across-runs
  determinism the Builder claimed. D-1.13's literal spec ("for any
  given (L5Annotation, iteration) pair, generateTaughtMoveId(annotation,
  iteration) produces the same id regardless of context, time, or call
  order") is satisfied because `generateTaughtMoveId` is a pure string
  concat over its inputs. **MED, not HIGH** — the operational guarantee
  is intact; what's broken is the commit-message claim and the spec
  doc's literal format prescription.
- **Recommended fix.**
  1. Update `L5_IMPLEMENTATION_PLAN.md:470` to record the actual format
     used: `M-{iteration}-{paragraphIndex}-{annotation.id}`.
  2. Edit the source comment at `taughtMoveBuilder.ts:24-44` to remove
     the "stable across runs (deterministic from inputs)" claim and
     replace with an accurate description: "`annotation.id` is stable
     for the lifetime of an L5AnnotationResult (assigned via
     `crypto.randomUUID()` at parse time and immutable thereafter).
     Cross-iteration carry-forward does NOT regenerate annotations;
     iteration N+1 reads persisted TaughtMoves from
     `iterationLedger.taughtMoves[]` whose ids were fixed at iteration
     N's L5 emission."
  3. If across-runs determinism IS desired (e.g., for replay/debug
     workflows), replace `crypto.randomUUID()` at
     `deepAnnotationService.ts:2034` with a deterministic content-based
     hash. This is a separate decision; not blocking unless the replay
     property is wanted.

### 3.D — `[LOW]` D-1.10 "L5-buffer swallow" — spec REVISIT hedge stale; code halts but spec text was not updated

- **Spec** (`L5_IMPLEMENTATION_PLAN.md` D-1.10 §"Failure surface"):
  "L5-buffer call failure → swallowed at the buffer level (the buffer
  is best-effort; a transient buffer failure is not worth halting an
  entire iteration over). [REVISIT during D-1.10 implementation: this
  may need to halt instead per the no-fallback charter; test will
  tell.]"
- **Code** (`analysisOrchestrator.ts:1009-1013` at HEAD `1b60e01`):
  comment "The throw routes through the surrounding try/catch at
  Phase 6 → buildPartialResult per the no-fallback charter (Q9 in the
  D-1.10 plan)" — i.e., halts.
- **Why this matters.** Builder made the right call (halt, per
  no-fallback charter), but the spec doc was not updated to reflect
  the resolved decision. A stale "REVISIT" with conflicting code is
  doc-as-source-of-truth drift.
- **Recommended fix.** Edit the D-1.10 §"Failure surface" bullet to:
  "L5-buffer call failure → throws (programmer-error invariants only).
  Routes through Phase 6 catch → buildPartialResult per the no-fallback
  charter. RESOLVED 2026-04-28 implementation (was REVISIT in spec)."

### 3.E — `[LOW]` D-1.9 architectural invariant ("only one L5 callsite") asserted but not enforced

- **Spec** (`L5_IMPLEMENTATION_PLAN.md:587`): "there is exactly ONE L5
  callsite, and it goes through `buildPriorAnnotationsForOrchestrator`
  (the D-1.8 composer). Future code that adds a NEW L5 callsite without
  going through the composer must be rejected at code review — the
  composer is the single source of truth for priorAnnotations."
- **Enforcement reality.** Verified there is ONE callsite at
  `analysisOrchestrator.ts:978` of HEAD `1b60e01`. The architectural
  invariant ("future callsites must use the composer") is asserted in
  prose but not enforced in code — no ESLint rule, no test that grep's
  for additional callsites and fails CI, no comment-marker on
  `deepAnnotationService.generateAnnotations` itself flagging the
  invariant.
- **Why this matters.** A future contributor adding (e.g.) a
  `focusedAnalyzer` L5 surface, or a Conversator-driven mid-session
  re-emission, would not see the invariant. The "rejected at code
  review" expectation is fragile across long timelines.
- **Recommended fix.** Add a top-of-file comment at
  `deepAnnotationService.ts` near the `generateAnnotations` export
  declaring the invariant, AND extend D-0.12's ESLint rule (or add a
  separate rule) that flags any direct `deepAnnotationService.generateAnnotations`
  callsite outside `analysisOrchestrator.ts`. Optional but
  inexpensive — D-1.12 is the natural place to fold this in.

---

## §4 — No-fallback violations

### 4.A — `[HIGH]` `essayProfileManager.fromCheckpoint` silent backfill of D-0.5 fields without telemetry

- **Code** (`essayProfileManager.ts` at HEAD `1b60e01`, lines 1527–1541):
  ```typescript
  if (!profile.groundTruthFacts) { profile.groundTruthFacts = []; }
  if (!profile.storyFragments)   { profile.storyFragments = []; }
  if (!profile.intentSignals)    { profile.intentSignals = []; }
  if (!profile.conversatorSessionLog) { profile.conversatorSessionLog = []; }
  ```
- **Why this matters.** Charter §8 rule 5 forbids "graceful degradation
  paths that turn bugs into invisible drift." A profile loading without
  these required D-0.5 fields IS a degradation; the four backfills are
  completely silent (no log, no event, no `extra` flag). An audit
  reading the iteration's events post-load cannot distinguish a clean
  re-hydration from a profile that was silently backfilled and is
  therefore not carrying real Conversator state forward.
- **Recommended fix.** At each of the four `if (!profile.X)` sites,
  emit an `iterationTelemetry` event with `status: 'failed'`,
  `step: 'profile.fromCheckpoint.legacyBackfill.<field>'`,
  `error: { code: 'legacy_backfill', message: ... }`. The same site
  already emits a structured warning + telemetry event for missing
  `iterationLedger`; replicate that pattern across all four
  Conversator-state fields.

### 4.B — `[HIGH]` `essayProfileManager.fromCheckpoint` legacy iterationLedger hydration emits as `status: 'succeeded'`

- **Code** (`essayProfileManager.ts:1503-1513` at HEAD `1b60e01`):
  ```typescript
  emitIterationEvent({
    iteration: 0,
    step: 'profile.fromCheckpoint.legacyHydration',
    status: 'succeeded',
    timestamp: new Date().toISOString(),
    error: undefined,
  });
  ```
- **Why this matters.** The hydration is a *recoverable degradation*,
  not a success. Tagging it `'succeeded'` means any failure-counting
  telemetry query post-iteration will not see this event — the
  degradation IS visible, but only to readers who explicitly look for
  the `legacyHydration` step name. A future ledger-health dashboard
  that counts `status: 'failed'` events to surface drift will miss
  every legacy-hydrated profile.
- **Recommended fix.** Change `status: 'succeeded'` to `status: 'failed'`
  with `error: { code: 'legacy_hydration', message: 'iterationLedger
  missing on loaded profile; hydrated with defaults', context: { essayId } }`.
  This makes the degradation count in failure telemetry without
  changing the substantive recovery behavior.

### 4.C — `[HIGH]` `analysisOrchestrator.buildPartialResult` secondary-commit catch uses `console.error` only

- **Code** (`analysisOrchestrator.ts:2086-2093` at HEAD `1b60e01`,
  inside `buildPartialResult`):
  ```typescript
  } catch (commitErr) {
    console.error(
      `[Orchestrator] D-1.10: partial-result iteration commit ALSO failed (...)`,
      commitErr instanceof Error ? commitErr.message : String(commitErr),
    );
    // Buffers stay populated for forensic recovery (Step 6 design).
  }
  ```
- **Why this matters.** Charter §8 rule 2: "No catch blocks without
  re-throw OR explicit telemetry emit + caller halt." `buildPartialResult`'s
  contract is "always returns a PipelineResult, never throws" — that
  defends the no-rethrow. But the only surface for the secondary
  failure is `console.error`, which is NOT captured by the structured
  iterationTelemetry buffer. The secondary-commit failure is invisible
  to any downstream consumer that reads the iteration's structured
  events — a real audit blind spot. ESLint rule D-0.12 will flag this
  catch (`console.error`'s callee `error` does not match `^emit/`).
- **Recommended fix.** Inside the catch, BEFORE the `console.error`,
  call `emitIterationEvent({ iteration: getCurrentIteration(coordinator.getProfile()), step: 'iteration_commit_secondary_failure', status: 'failed', error: { message: ..., code: 'partial_result_commit_failure' }, timestamp: new Date().toISOString() })`.
  Preserves the no-throw contract, surfaces the failure auditably.

### 4.D — `[HIGH]` `priorAnnotationsBuilder.composer` falls back to `priorAnnotations: undefined` on missing snapshot with `console.log` only

- **Code** (`priorAnnotationsBuilder.ts:696-707`):
  ```typescript
  if (priorEssayText === undefined) {
    console.log(
      `[priorAnnotationsBuilder.composer] iter=${currentIteration}: prior-iteration snapshot ` +
        `unavailable (likely pre-D-1.10 ledger or cold start); threading priorAnnotations=undefined`,
    );
    return undefined;
  }
  ```
- **Why this matters.** On `currentIteration ≥ 2`, the absence of a
  prior snapshot IS a recoverable degradation: the system cannot
  compute landing detection on prior moves and silently skips. The
  doc-comment at `:639-644` defends this as "structural absence, not
  silent fallback" — but in practice, downstream consumers reading
  iteration telemetry will not know that priorAnnotations was
  unavailable. After D-1.10 fully wires the snapshot writer, a missing
  snapshot at iter ≥ 2 is a real corruption signal that should be loud.
  Right now it is recorded only as a stdout line.
- **Recommended fix.** Replace the `console.log` with
  `emitIterationEvent({ iteration: currentIteration, step:
  'priorAnnotations.composer.snapshotUnavailable', status: 'failed',
  error: { code: 'prior_snapshot_unavailable', context: {
  currentIteration } }, timestamp: ... })`. The iter ≤ 1 branch at
  `:689-693` is structural (no degradation) and may stay as-is or emit
  with `status: 'succeeded'`.

### 4.E — `[HIGH/PRE-EXISTING]` AO First Read `Promise.allSettled` swallows rejection with `console.warn`

- **Code** (`analysisOrchestrator.ts:425-430`):
  ```typescript
  } else {
    console.warn(
      `[Orchestrator] AO First Read failed (non-fatal): ` +
      `${aoSettled.reason instanceof Error ? aoSettled.reason.message : String(aoSettled.reason)}`,
    );
  }
  ```
- **Why this matters.** The build handoff §8 explicitly names this site:
  "AO First Read's current 'non-fatal swallow' pattern (orchestrator.ts:299)
  MUST change — under no-fallback discipline, AO First Read failures
  surface to telemetry and the iteration continues with an explicit
  'AO First Read unavailable' flag on the profile, NOT a silent no-op."
  Phase 1 D-1.12 explicitly covers this. Pre-existing — Phase 1 work
  did not introduce it but did not fix it either.
- **Recommended fix.** D-1.12 scope when that ticket runs: emit
  `emitIterationEvent({ iteration: 1, step: 'aoFirstRead', status:
  'failed', error: ... })` AND add an `aoFirstReadAvailable: false`
  flag on the profile so downstream layers know.

### 4.F — `[MED]` D-1.7 drop-decision telemetry uses `console.log` instead of structured emit

- **Code** (`priorAnnotationsBuilder.ts:244-257`, function
  `emitMoveDropped`):
  ```typescript
  console.log(
    '[priorAnnotationsBuilder] move-dropped',
    JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
  );
  ```
- **Spec** (`L5_IMPLEMENTATION_PLAN.md:561`): "Drop decision (when
  remap is ambiguous) is logged to telemetry but not an error."
- **Why this matters.** Drops survive only as stdout lines. They do
  NOT appear in `flushEventsForIteration(...)` output, so post-iteration
  audits, D-6.11 telemetry deep inspection, and D-1.10's
  `IterationRecord.events[]` will be missing every drop record. A
  misattributed-or-dropped move becomes invisible — exactly the audit
  hole the spec wanted to close. The function-level comment at
  `priorAnnotationsBuilder.ts:240-243` defends "Distinct from the
  iteration's event ledger because a drop is neither a 'started' nor
  'succeeded' / 'failed' step; it's a deliberate skip" — that's a
  category argument, but the spec said "logged to telemetry," and
  telemetry IS the iteration event ledger, not stdout.
- **Recommended fix.** Replace the `console.log` body of `emitMoveDropped`
  at `priorAnnotationsBuilder.ts:253` with `emitIterationEvent({
  iteration: payload.currentIteration, step: 'priorAnnotations.move_dropped',
  status: 'succeeded', extra: payload, timestamp: new Date().toISOString() })`
  (or add a new `'skipped'` status to `IterationTelemetryEvent` if a
  category fits better). Keep the `[priorAnnotationsBuilder]` prefix
  in the `extra.source` field so existing test spies can be migrated.

### 4.G — `[MED]` ESLint rule false positives in mode-selection sites (annotate or tune)

- **Sites** (would warn under D-0.12's `^(orchestrate|analyze|generate|build)/`
  heuristic):
  - `priorAnnotationsBuilder.ts:549` —
    `significance = editSignificance ?? 'transformative';` inside
    `buildPerParagraphEdits`.
  - `priorAnnotationsBuilder.ts:581` —
    `significance = editSignificance ?? mechanicalSignificance(changeRatio);`
    same function.
  - `analysisOrchestrator.ts:129` —
    `const triggeredBy: IterationRecord['triggeredBy'] = input.triggeredBy ?? 'first_pass';`
    inside `analyzeEssay`.
- **Disposition.** All three are documented mode-selection patterns
  (use paid LLM judgment if available, else mechanical default), not
  silent degradations. Acceptable per charter §8. But ESLint will warn
  in CI; reviewer will need to disposition each.
- **Recommended fix.** Add `// eslint-disable-next-line no-silent-fallback -- mode-selection: <reason>`
  comments on all three lines. Or, when D-0.12's rule is tuned in a
  future deliverable, add an explicit allow-list mechanism so the rule
  can distinguish.

---

## §5 — Theatrical or weak tests

### 5.A — `[HIGH]` `iteration-ledger-accessor.test.ts` §6 legacy hydration test exercises ZERO production code

- **Site** (`tests/unit/iteration-ledger-accessor.test.ts:192-232` at
  HEAD `1b60e01`).
- **Self-admitted shortcut comment** at `:192-196`:
  ```typescript
  // We exercise the warning path by directly reproducing what
  // fromCheckpoint does on a missing iterationLedger. Full
  // fromCheckpoint scaffolding (CheckpointStore mocks) is heavier
  // than this contract requires; the warning + emit pattern is what matters.
  ```
- **Test body** at `:207-216` calls `console.warn(...)` and
  `emitIterationEvent(...)` directly with hardcoded strings. Nowhere
  does the test import or invoke `EssayProfileCoordinator.fromCheckpoint`.
  Lines `:218-225` then assert `warnSpy` was called and the telemetry
  buffer contains the event the test ITSELF emitted.
- **Why this matters.** Textbook theatrical pattern — the test
  asserts on a side effect the test itself produced. Anyone could
  rename, delete, or break the legacy-hydration block in
  `essayProfileManager.ts:1503-1513` and this test would still pass.
  D-1.1's contract explicitly requires "Unit tests covering: fresh
  profile, legacy profile, corrupt iterationLedger" — the legacy-profile
  case is unmet. The comment explicitly justifies the shortcut, meaning
  the author was aware of the gap and chose convenience over verification.
- **Recommended fix.** Replace `:192-232` body. Construct an
  EssayProfile literal with `iterationLedger = undefined`, call
  `EssayProfileCoordinator.fromCheckpoint(...)` on a stubbed
  `CheckpointStore` that returns the legacy-shaped profile, then
  assert (a) the returned `profile.iterationLedger.currentIteration === 0`
  and sub-arrays are empty, (b) `console.warn` was called with the
  actual production message, (c) the telemetry event was emitted with
  `step === 'profile.fromCheckpoint.legacyHydration'`, AND apply the
  4.B fix so the assertion can check `status === 'failed'` (or
  whatever state the fix lands at).

### 5.B — `[MED]` `taught-move-builder.test.ts` 100-iteration property check is a tautology

- **Site** (`tests/unit/taught-move-builder.test.ts:234-256` at commit
  `360937e`).
- **Setup** at `:236-247`: `const annotations: L5Annotation[] =
  Array.from({length: 100}, (_, i) => makeAnnotation({...random...}))`
  built ONCE.
- **Two-pass invocation** at `:250-251`:
  ```typescript
  const ids1 = annotations.map((a) => generateTaughtMoveId(a, iter));
  const ids2 = annotations.map((a) => generateTaughtMoveId(a, iter));
  ```
  Both `.map`s iterate the same array of object references.
  `generateTaughtMoveId` at `taughtMoveBuilder.ts:55-79` is pure string
  concatenation with no side effects.
- **Why this matters.** The test claims "stable IDs across two passes"
  but the only way `ids1 !== ids2` would be if `generateTaughtMoveId`
  had hidden state — which it does not, by construction. A 1-line
  implementation passes trivially. It does NOT prove what D-1.2's
  commit message claims (re-generation stability) and does NOT lay a
  foundation for D-1.13's real property test. Round-0 framing
  ("doesn't actually vary inputs") was slightly inaccurate — the
  inputs DO vary across the 100 annotations — but the two PASSES use
  identical references, so the determinism check is between f(x) and
  f(x), not f(x1) and f(x2) where x1 ≡ x2 by construction.
- **Recommended fix.** Either (a) delete this property test since
  D-1.13 in `tests/property/` is the real deliverable, or (b)
  restructure to: snapshot the annotations as JSON, re-deserialize
  into a second array, and verify `generateTaughtMoveId` yields
  identical strings. That actually exercises the "same L5Annotation
  shape across runs" semantic.

### 5.C — `[MED]` D-1.10 "integration test" is seam-level only — bypasses orchestrator commit path

- **Site** (`tests/integration/d1-10-iteration-bracket.test.ts`,
  commit `1b60e01`).
- **Coverage gap.** Test scenarios 5–8 manually push to ledger and
  call individual primitives (`incrementIteration`, `bufferTaughtMoves`,
  `flushTaughtMovesForIteration`, `coordinator.checkpoint`) instead of
  driving `analyzeEssay()` end-to-end. Test file comment at line ~374
  acknowledges: "We test the editScope shape directly here because
  exercising the orchestrator's commitIterationRecord requires a full
  pipeline run."
- **Why this matters.** The seam-level test proves each individual
  primitive works. It does NOT prove `analysisOrchestrator.commitIterationRecord`
  at `:1782-1905` wires those primitives correctly inside the success
  path or partial-result path. A typo, missed argument, or off-by-one
  in `commitIterationRecord` would not be caught. The commit message
  claims "wired and tested end-to-end at the seam level" — that's the
  honest framing, but the file name implies integration coverage that
  doesn't exist.
- **Recommended fix.** Add at least ONE scenario that drives
  `analyzeEssay()` with the D-0.11 mock-LLM stack and asserts
  post-call ledger shape including `snapshotText === input.essayText`,
  `iterations.length === 1`, `events` populated, `taughtMoves` flushed.
  D-1.15 (Mock-LLM integration test for full iter 1→2 flow) is the
  natural home — D-1.15 may close this gap when it lands.

### 5.D — `[MED]` D-1.10 has zero coverage for the checkpoint-failure throw path

- **Site.** No scenario in `tests/integration/d1-10-iteration-bracket.test.ts`
  uses a stub `CheckpointStore` that rejects. The test uses
  `InMemoryCheckpointStore` exclusively (line 68), which never throws.
- **Code** (`analysisOrchestrator.ts:1873-1889`): the success-path
  `commitIterationRecord` throws `PipelineError.wrap('iteration_commit', ...)`
  on checkpoint failure, leaves buffers intact for forensic recovery.
- **Why this matters.** The atomic-commit semantics are the
  load-bearing differentiator between D-1.10's design and a naive "push
  and pray." Zero coverage of (a) the throw fires, (b) the wrapped
  error carries the right layer/context, (c) the in-memory ledger has
  the record after the failed persist, (d) the transient buffers are
  NOT cleared. All four guarantees are unverified.
- **Recommended fix.** Add a Scenario 9 using a stub `CheckpointStore`
  whose `save()` rejects, drive `commitIterationRecord` either directly
  or via `analyzeEssay`, assert the four guarantees above. Cost: zero
  (no LLM).

### 5.E — `[LOW]` D-1.4 comparison-pass variants not preserved as artifacts

- **Site.** `landingDetector.RATIONALE.md:111-150` documents Round 3
  as "two Plan agents in parallel, each drafting an alternative full
  system prompt." The variants are summarized in 4-5 bullets each;
  neither variant's full text is preserved in the repo.
- **Spec** (`L5_IMPLEMENTATION_PLAN.md:519`): "Round 3: comparison
  pass. Draft a second variant of the prompt (different phrasing,
  different ordering, different anchor examples). Read both side-by-side.
  Pick the one that produces cleaner, more grounded outputs in the
  imagined cases. Document why in the RATIONALE.md."
- **Why this matters.** Without the variants in the repo, the
  comparison-pass claim is unfalsifiable. Process gap, not correctness
  gap.
- **Recommended fix.** Save the two variants as
  `prompts/landingDetector.variant-A.draft.md` /
  `landingDetector.variant-B.draft.md` (or a single
  `landingDetector.round3-comparison.md` containing both bodies).
  One-shot doc commit; no code change.

---

## §6 — Known bugs

None at this round. The HIGH-severity items in §3 / §4 / §5 are
discipline / surface gaps, not functional bugs producing wrong outputs.

---

## §7 — Calibration honest assessment (D-1.5)

### 7.A — `[HIGH]` Run-cap discipline VIOLATED — 5 calibration runs against the spec's 2-run cap; no escalation artifact

- **Spec verbatim** (`L5_IMPLEMENTATION_PLAN.md:537`): "Do not run the
  calibration check more than 2 times mid-build (cost cap). If the
  second run still disagrees, halt and escalate to Tue with the prompt
  + outputs + what's failing."
- **Ledger evidence** (`BUILD_COST_LEDGER.md` rows tagged
  `D-1.5 calibration summary`):
  - Run #2: 2026-04-27T12:15:07Z — 3/5 pass, $0.0432.
  - Run #3: 2026-04-27T12:55:08Z — 5/5 pass, $0.0586 (prompt v0.4.0-round4).
  - Run #4: 2026-04-27T12:57:13Z — 9/10 pass, $0.1185 (10 cases).
  - Run #5: 2026-04-27T13:33:30Z — 9/10 pass, $0.1241 (Round 5 prompt).
  - Run #6: 2026-04-27T14:40:04Z — 10/10 pass, $0.1230 (after Case 8 redesign).
- **Commit-message trail.** `d06a07f` says "Per D-1.5 contract: ≤2
  calibration runs mid-build. Both consumed. Halting + escalating to
  Tue per spec." That was correct compliance. `14be5bf` then runs 4
  more times, citing "per Tue's directive: deepen rather than re-teach"
  — but no commit, doc, or escalation artifact between `d06a07f` and
  `14be5bf` records Tue's reply, the alternatives, or the override
  rationale. The only mention of "Tue's directive" is in the commit
  message itself. `landingDetector.RATIONALE.md:215` retroactively
  documents Round 5 as "Per the Round 4 instruction... this was the
  model correctly following the prompt — Case 8's design was at fault,
  not the prompt." Post-hoc, not the §9 escalation artifact the spec
  prescribes.
- **Why this matters.** The 2-run cap is a discipline mechanism — three
  failed runs in a row is the canary that the prompt design has a
  deeper problem than another revision can fix, and Tue (not the
  Builder) decides whether to keep iterating. Run #4 (9/10 on extended
  cases) and Run #5 (9/10, different failing case) are exactly the
  disagreement signal the cap is designed to surface to Tue. Spending
  was within dollar budget ($0.5110 / $9.00) — but the discipline is
  not "stay under $9", it is "after 2 runs, escalate." This is the
  audit's escalation-worthy finding (per the audit charter §11 rule
  5: "Calibration discipline violation that wasn't caught at the
  time").

### 7.B — `[HIGH]` Train-test contamination: ~30–40% of calibration cases overlap prompt anchor cases (verbatim or near-verbatim)

- **Direct evidence from the calibration doc itself.** The committed
  `landingDetector.calibration.md` rationale for `case-2-clear-unaddressed-synonym`
  literally reads: "**Anchor Case 2 from the prompt**." Similarly for
  Case 3 — the prompt's RATIONALE.md:197 says Anchor Case 3 was added
  to the prompt because Round 3 failed it ("The original Case 3 from
  D-1.5 calibration ('particularly around choices people make') is now
  in the prompt as Anchor Case 3"). The case was then "passed" in the
  next calibration run.
- **Anchor → calibration overlap mapping (auditor count):**
  | Calibration case | Prompt anchor source | Overlap |
  |---|---|---|
  | case-2-clear-unaddressed-synonym ("deeply meaningful" → "profoundly significant") | ANCHOR 2 (`landingDetector.prompt.ts:141-146`, same text verbatim) | VERBATIM |
  | case-3-ambiguous-partial ("complexities of modern identity") | ANCHOR 3 (`prompt.ts:148-154`, added in Round 4 specifically to fix this case) | VERBATIM, directional |
  | case-4-changed-target (chess→food bank) | ANCHOR 4 (`prompt.ts:156-161`, same scenario shape) | HIGH |
  | case-1-clear-addressed | ANCHOR 1 patterns (substantive engagement) | MEDIUM |
  | case-7-rewrite-that-addresses | inverse of case-4 / chess-club anchor | MEDIUM |
  | cases 5, 6, 8, 9, 10 | no overlap | NONE |
  | Net contamination | ~3/10 verbatim + 2/10 medium = 30–40% | |
- **Why this matters.** A calibration that "passes" by recognizing
  text the prompt told it to recognize tells us nothing about
  generalization. The most damaging contamination is Case 3 — added to
  the prompt because Run #3 failed it, then "passed" by Run #4 against
  the calibration. That's calibrating the test to the model, not the
  model to a held-out test. Round-0's prediction of contamination
  (5/10 estimate) is approximately correct.
- **Recommended fix.**
  1. Add a held-out test set (5+ cases drawn from real essays, NOT from
     the prompt's anchors, NOT designed by the same author) and run it
     ONCE before declaring D-1.5 closed. Document in
     `tests/calibration/landing-detector/holdout.ts` and the result in
     `landingDetector.calibration.md`.
  2. Annotate each calibration case in `landingDetector.calibration.md`
     with its anchor-overlap status so the 10/10 number's denominator
     is honest to a future reader.
  3. Going forward (Phase 2 D-2.9, Phase 3 D-3.9, Phase 4 D-4a.9 / D-4d.3):
     pre-commit calibration cases BEFORE drafting the prompt, and gate
     prompt revisions on held-out outputs.

### 7.C — `[HIGH]` Case 8 redesigned mid-flight to make it pass

- **Commit message trail** (`14be5bf` body): "Run #5 ($0.1241): 9/10.
  Case 6 now passes. Case 8 reclassified — model read parallel-edit...
  Case 8 was poorly designed as Branch 1 test (genuinely Branch 2
  material). Case 8 redesigned as cosmetic-only edit (tense polish:
  'realized' → 'had realized'; targeted phrase untouched) —
  unambiguously Branch 1. Run #6 ($0.1230): 10/10 pass."
- **Repo state.** `tests/calibration/landing-detector/run.ts:298-327`
  has the redesigned Case 8 (cosmetic tense polish). The original
  parallel-edit Case 8 is gone — no preserved record in the repo
  outside the commit message paraphrase. `landingDetector.RATIONALE.md:215-217`
  confirms "Case 8's design was at fault, not the prompt."
- **Why this matters.** Calibrating the test to make it pass is the
  canonical anti-pattern of validation. The correct response to a
  failing case "because the case was poorly designed" is to leave it
  in place as documented limitation, OR add the fixed case ALONGSIDE
  the original (now expected to be `partially_addressed`) — never to
  silently overwrite. The Round-0 prediction "case-8 reshaped between
  run 6 and run 7" is confirmed (off by one run-number, exact pattern).
- **Recommended fix.**
  1. Restore the original Case 8 (parallel-edit version) into the
     calibration runner as `case-8a`, with `expected.status:
     'partially_addressed'` (the model's actual call) plus a comment
     explaining why the original Branch 1 framing was wrong. The
     cosmetic-tense version stays as `case-8b`.
  2. Document in `landingDetector.calibration.md` that Case 8 was
     redesigned mid-calibration, with a link to the diff or commit-message
     paraphrase.
  3. Add a calibration-discipline rule to `L5_IMPLEMENTATION_PLAN.md`:
     cases may be ADDED across runs to expand coverage but never
     SILENTLY MODIFIED to make them pass. Modifications must be
     additive (`case → caseA + caseB`).

### 7.D — Calibration verdict

The 10/10 headline is real (Run #6 produced status + confidence-band +
signals matches on all 10 cases) but its denominator is not what the
spec wanted. With ~30–40% contamination from in-prompt anchors and one
case redesigned mid-flight, the 10/10 should be read as "the prompt
correctly classifies cases that include several it was specifically
written to handle." Generalization to held-out essays is unverified.

**Trustworthiness on a fresh set: LOW–MED.** The Q4 0.7 floor
enforcement, schema validation, and asymmetric-tolerance bias are
exemplary engineering; the calibration discipline gap is in *what
empirical test was run*, not whether the engineering is sound. The
prompt itself may well perform fine on held-out cases — but we don't
know yet. **Recommendation: hold the v0.5.0-round5 prompt as
PROVISIONAL pending a held-out validation set.**

---

## §8 — Forward-compatibility risks

### 8.A — L3.75 absorption atomic-deletion risk

- **Holisticsynthesis.ts size:** **3,128 lines** (verified via wc on
  HEAD `1b60e01`). 10 importers; concentrated call-sites at
  `analysisOrchestrator.ts` (2), `focusedAnalyzer.ts` (3),
  `reanalysisOrchestrator.ts` (1), plus internal-utility callers.
- **Sub-phase 4a's plan** is a single-day deletion (`D-4a.10`,
  ~3,650 lines). With ~6 active call sites across 4 services flipping
  in lockstep, the atomic deletion is non-trivial — Round-0's
  "atomic-not-gradual risk" is valid.
- **Recommended path.** When Phase 4a opens, plan as a 2–3 day
  deliverable with: (a) a tagged commit before deletion (rollback
  point), (b) freeze on holisticSynthesis-touching commits during
  cutover, (c) parallel-run validation against the 3,128-line
  implementation on at least one fixture before deletion lands. This
  is consistent with `L3-75/L3_ABSORBS_L3_75.md` decision #14, but the
  spec doesn't yet allocate the 2–3 day window — current Phase 4a
  effort estimate is "1–2 hours mechanical."

### 8.B — D-1.11 stub values observable in iter ≥ 2

- D-1.10 currently emits `carryForwardSummary: { carried: [],
  rederived: [], refreshed: [] }` and zero numeric stubs for
  `escalationLevel` / `comprehensiveBaselineCost` / `carryForwardSavings`
  — the Builder explicitly documents this as "honestly emit empty
  arrays" pending D-1.11 (`analysisOrchestrator.ts:1843-1851`).
- **Why this matters.** Until D-1.11 lands, downstream consumers and
  test scaffolds may misinterpret the empty values as "no carry-forward
  happened" rather than "D-1.11 hasn't shipped yet." Doc/consumer-contract
  concern only — not blocking.
- **Recommended action.** When D-1.11 lands, the integration test
  should explicitly assert that the post-D-1.11 ledger has non-empty
  `carryForwardSummary` on iter ≥ 2 with at least one carried/rederived/refreshed
  entry. Tracked here so it doesn't get forgotten.

### 8.C — D-1.9 architectural invariant relies on review discipline

- See §3.E. The "ONE L5 callsite forever, must go through the composer"
  invariant is critical to Phase 2+ correctness. It's enforced only by
  prose in `L5_IMPLEMENTATION_PLAN.md`. A future Conversator-driven
  re-emission, a D-3.x integration, or a D-4d.x redesign could add a
  second callsite without anyone noticing. Recommend adding a CI grep
  + ESLint or test guard at D-1.12 implementation time.

### 8.D — Type scaffolds vs Phase 4 consumers — no gaps surfaced this round

Phase 0's type scaffolds (D-0.15 L3 redesign, D-0.16 L3.5 ext, D-0.17
L4b ext, D-0.1 iteration types, D-0.4 conversator, D-0.3 ground-truth
trio, D-0.2 dig context, D-0.14 StalenessEffect.findingIds[]) were
cross-referenced against the L3 redesign PLAN, L3-75 absorption spec,
L4 PLAN, and L5 governing docs. No structural gaps surfaced — fields
named in the consumer specs are present in the scaffold types. Some
fields are minimally scaffolded (per LLM-first Rule 3) and will need
to be filled out in Phase 4 sub-phases — that's by design.

---

## §9 — Process discipline violations

### 9.A — D-1.5 calibration cap: covered in §7.A. Process discipline GAP, escalation-worthy.

### 9.B — D-1.3 model policy: covered in §3.A. Spec doc not updated to reflect Tue's 2026-04-27 directive (whether or not the directive itself was authorized).

### 9.C — D-1.10 spec expansion was unilateral by Builder

- **Site.** Commit `a6d4485` ("docs(essay-intelligence): expand D-1.10
  scope to close 5 Phase-1 dead wires") landed BEFORE the implementation
  commit `1b60e01`. The expansion grew effort estimate from "3-4 hours"
  to "8-12 hours" (3× scope increase). Sole author Winpham; no
  co-authored Tue-review marker; no separate ratification commit.
- **Per build handoff §10.** "Contract changes (any deliverable's
  'Contract' section requires updating INTEGRATED_BUILD_SEQUENCE.md +
  escalating)." The expansion is materially a Contract change.
- **Disposition.** The dead wires are real (verified §2 / Phase 1
  re-verified). The expansion was substantively justified. But the
  process — Builder self-audits, self-expands, self-implements — is a
  pattern that becomes far more dangerous in Phase 4a's L3.75
  absorption (~3,650 lines) where unilateral scope creep is harder to
  reverse.
- **Recommended fix.** Tue should explicitly ack the D-1.10 expansion
  retroactively (a single message: "Acked — D-1.10 expansion was
  justified, scope is locked"). Going forward, the Auditor will flag
  any deliverable where the implementation commit's diffstat exceeds
  the spec's effort estimate by >50% without a separate ratification
  commit.

### 9.D — D-1.4 prompt-revision documentation — variants summarized but not preserved

Covered in §5.E. Round 3 comparison-pass variants live only in
RATIONALE.md prose, not as separate draft files.

### 9.E — D-1.10 commit's "210/212 pass + 2 pre-existing skipped" claim is unaudited

- Commit `1b60e01` body: "210/212 vitest pass + 2 pre-existing skipped,
  typecheck clean."
- **Disposition.** Pre-existing skips are typically safe, but the
  iteration-loop landing is the wrong moment to be vague about test
  inventory. If either skipped test touches `taughtMoveBuilder`,
  `iterationTelemetry`, or the orchestrator's iteration commit, the
  "tested" claim has a hole.
- **Recommended fix.** Builder edits the next commit message body
  (or BUILD_COST_LEDGER.md) to name the 2 skipped tests with a
  one-line "neither touches D-1.10 surface area" justification.

---

## §10 — Cumulative-state coherence

- **BUILD_COST_LEDGER cumulative spend:** $0.5110 of $9 hard halt
  (Option A) or $24 (Option B). Well under cap. Cumulative column at
  every row equals running sum of `cost_usd` values. No unattributed
  entries; every API call has either a generic input/output token row
  or a per-deliverable `D-1.5 calibration summary` row.
- **Type-scaffold compatibility.** `IterationLedger` (profileTypes.ts:5148),
  `IterationRecord` (:5198), `GroundTruthFact` (:5504), `StoryFragment`
  (:5539), `IntentSignal` (:5573), `DigContext` (:5663), and
  `StalenessEffect.findingIds[]` (:4154) all in place. `CheckpointReason`
  includes `'after_iteration_commit'` (:476) per D-1.10's add. No
  type-vs-consumer drift surfaced.
- **Four locked decisions honored in new code:**
  - Q1 / Resolution A (no mandated redirection): code at
    `analysisOrchestrator.ts:1850` sets `carryForwardSavings: 0` with
    JSDoc "Audit-only — informs cost-trajectory monitoring, NOT
    redirection." No redirection mechanism. ✓
  - Q4 (0.7 floor): enforced strictly with boundary tests at
    `landingDetector.ts:54,358-366` + `landing-detector.test.ts:109-118`. ✓
  - Q-A (continuous chat): no Phase 1 conflict. ✓
  - Q-B (analysis-driven dig origination): no Phase 1 conflict. ✓
- **D-0.12 ESLint rule blind spots (synthetic violations identified):**
  - **Aliased `Promise.allSettled`** (`const settle =
    Promise.allSettled.bind(Promise); await settle([...])`) — rule's
    matcher requires literal `Promise.allSettled` callee; aliased
    binding slips through. SLIPS.
  - **Function-name allowlist too narrow** — rule recognizes only
    `^(orchestrate|analyze|generate|build)/`. Functions like
    `detectLanding`, `composePrior...`, `validateLedger`,
    `commitIteration`, `processEdit`, `flushFor...`, `applyDiff`,
    `walkDocument` are critical paths that slip the heuristic. SLIPS
    in any future rename. (Real-code site: `priorAnnotationsBuilder.ts:549`
    is currently caught only because `buildPerParagraphEdits` matches
    `^build`. A rename to `composePerParagraphEdits` would silently
    unflag it.)
  - **`void promise` fire-and-forget** — `void persistThing()` makes
    promise rejection unhandled; no rule matcher for `UnaryExpression(operator='void')`
    operand returning a Promise. SLIPS.
  - **Optional-chain swallow** — `obj?.method()` returns `undefined`
    when `obj` is null, hiding the absence. No rule matcher. SLIPS.
  - **NOT a blind spot (verified)**: `console.error` followed by
    non-throw — rule's `containsEmitCall` correctly excludes
    `console.error` because callee leaf-name is `'error'` not matching
    `^emit/`. The 5 catch-block sites in `claude.ts` (lines 62, 433,
    661, 667, 859) WILL all be flagged.
  - **NOT a blind spot (verified)**: nested catches in try/catch
    chains — ESLint's visitor pattern recurses into nested catches.
  - **False-positive direction**: aliased-`emit*`-imports
    (`import { emitStepFailure as logFail }`) — rule sees calleeName
    `logFail`, doesn't match `^emit/`, fires false positive on
    charter-compliant code.
- **Disposition of 5 ESLint warnings on `claude.ts`:** All real,
  pre-existing no-fallback violations (lines 62, 433, 661, 667, 859 —
  the line at 672 throws, so it does not flag). Pre-Phase-0; out of
  Phase 0/1 scope. Recommend a Phase 3 D-3.15 / library-code
  no-fallback pass; `claude.ts` is upstream of every LLM call.

---

## §11 — Open items from prior rounds

The Round-0 hand-audit findings (per the prompting context that opened
this Auditor session) are tracked here. Status as of this round:

| Round-0 finding | Round-1 verification | Status |
|---|---|---|
| D-1.1 prose says `currentIteration = 1` on create; code sets 0 | Re-verified: spec at `L5_IMPLEMENTATION_PLAN.md:457` still says 1; code at `essayProfileManager.ts:961` sets 0; reconciliation in source comment only. | **OPEN** (§3.B) |
| D-1.2 ID format spec says `sequenceInParagraph`, code uses `annotation.id` | Re-verified: spec at `:470` unchanged; code at `taughtMoveBuilder.ts:79` unchanged. Builder's "deterministic" justification proven misleading because L5Annotation.id is `crypto.randomUUID()`. | **OPEN** (§3.C) |
| D-1.7 telemetry channel: code uses `console.log` instead of structured emit | Re-verified at `priorAnnotationsBuilder.ts:244-257`; `console.log` confirmed; structured `iterationTelemetry` channel exists but is bypassed. | **OPEN** (§4.F) |
| `iteration-ledger-accessor.test.ts` legacy hydration test exercises zero production code | Re-verified at `tests/unit/iteration-ledger-accessor.test.ts:192-232`; theatrical pattern confirmed (test calls console.warn + emitIterationEvent by hand). | **OPEN** (§5.A) |
| `iteration-ledger-accessor.test.ts` ID-stability property test doesn't actually vary inputs | Mostly re-verified at `tests/unit/taught-move-builder.test.ts:234-256`. Round-0's framing ("doesn't vary inputs") was slightly off — inputs DO vary across the 100 annotations, but the two PASSES use the same in-memory references, so the determinism check is between f(x) and f(x). Tautology, not "non-varying inputs." | **OPEN, refined** (§5.B) |
| D-1.5 calibration cases overlap prompt anchors at 5/10 ratio (train-test contamination) | Re-verified by direct read: ~3/10 verbatim + 2/10 medium overlap = 30–40%, with the most damaging case (Case 3) added to the prompt to fix the case it later "passed." Round-0 estimate was approximately correct; the directional teach-to-the-test on Case 3 is the worst single instance. | **OPEN** (§7.B) |
| D-1.5 5 calibration runs vs 2-run cap, no escalation | Re-verified by ledger walk (`BUILD_COST_LEDGER.md` rows): 5 evaluation runs at 12:15Z, 12:55Z, 12:57Z, 13:33Z, 14:40Z. No escalation artifact between Run #2's halt and Round 4's resume. "Tue's directive" mentioned only in commit message. | **OPEN** (§7.A, escalation-worthy) |
| D-1.5 case-8 reshaped between runs to make it pass | Re-verified: original parallel-edit Case 8 replaced by cosmetic-tense-polish version between Run #5 and Run #6; no preserved record in repo of original case body. (Round-0 said "between run 6 and run 7" — off by one; the redesign was between Run #5 and Run #6.) | **OPEN** (§7.C) |
| `computeChangeRatioForParagraph` placeholder dead code at `priorAnnotationsBuilder.ts:437-454` | Re-verified: function still exists; zero callers; comment "kept as a placeholder for the signature; the actual ratio computation lives inline in buildPerParagraphEdits below." | **OPEN, LOW** (recommend deletion in next D-1.x cleanup commit) |
| L3.75 absorption atomic-deletion risk | Re-confirmed: holisticSynthesis.ts is 3,128 lines, 10 importers, ~6 active call sites. Phase 4a effort estimate of "1–2 hours mechanical" understates the lockstep-cutover risk. | **OPEN** (§8.A; tracked into Phase 4a planning) |

---

## §12 — Recommended actions (punch-list, prioritized)

### Tier 1 — must close before Phase 1 → Phase 2 boundary

1. **§7.A** — Surface D-1.5 run-cap discipline gap to Tue. Confirm
   whether Round 4/5 work was authorized; if so, codify the
   authorization in `landingDetector.RATIONALE.md` as an explicit
   "ESCALATION OUTCOME" block. **Escalation-worthy.**
2. **§7.B** — Add held-out calibration set (5+ cases drawn from real
   essays, not from the prompt's anchors) and run once. Document the
   result in `landingDetector.calibration.md`. Until then, treat
   v0.5.0-round5 prompt as PROVISIONAL.
3. **§7.C** — Restore original Case 8 (parallel-edit version) into the
   calibration runner as `case-8a` with `expected.status:
   'partially_addressed'`; document the redesign history in
   `landingDetector.calibration.md`.
4. **§4.A / §4.B / §4.C / §4.D** — Convert the 4 silent-degradation
   sites (`fromCheckpoint` two sites, `buildPartialResult` secondary
   catch, `priorAnnotationsBuilder.composer` snapshot-unavailable) to
   structured `emitIterationEvent` calls. Charter §8 violations.
5. **§5.A** — Replace the theatrical legacy-hydration test at
   `iteration-ledger-accessor.test.ts:192-232` with a real
   `fromCheckpoint` exercise.

### Tier 2 — should close before Phase 1 → Phase 2 boundary

6. **§3.A** — Update `L5_IMPLEMENTATION_PLAN.md:477,501,503,62,108`
   to reflect Sonnet (or "model per Tue's 2026-04-27 policy"). Add a
   "Model Policy" subsection. Update cost-allocation table.
7. **§3.B** — Edit `L5_IMPLEMENTATION_PLAN.md:457` to record
   `currentIteration = 0` on create.
8. **§3.C** — Edit `L5_IMPLEMENTATION_PLAN.md:470` to record actual
   `M-{iter}-{para}-{annotation.id}` format; rewrite the source
   comment at `taughtMoveBuilder.ts:24-44` to remove the
   "deterministic from inputs" claim.
9. **§3.D** — Edit `L5_IMPLEMENTATION_PLAN.md` D-1.10 §"Failure
   surface" to record the resolved decision (halt, not swallow).
10. **§3.E** — Add invariant comment at top of
    `deepAnnotationService.ts` near `generateAnnotations` export, and
    extend D-0.12 ESLint rule (or add a separate rule) to flag any
    `deepAnnotationService.generateAnnotations` callsite outside
    `analysisOrchestrator.ts`. Natural fold into D-1.12.
11. **§4.E** — D-1.12 scope (already planned): convert AO First Read
    `Promise.allSettled` swallow to telemetry emit + `aoFirstReadAvailable: false`
    flag.
12. **§4.F** — Replace `priorAnnotationsBuilder.ts:253` `console.log`
    with `emitIterationEvent`; migrate test spies at
    `tests/unit/prior-annotations-builder.test.ts` accordingly.
13. **§4.G** — Add `// eslint-disable-next-line no-silent-fallback`
    comments with rationale on the three documented mode-selection
    sites (`priorAnnotationsBuilder.ts:549,581`,
    `analysisOrchestrator.ts:129`).
14. **§5.B** — Either delete the tautological 100-iteration property
    test at `taught-move-builder.test.ts:234-256`, or restructure to
    JSON-snapshot + re-deserialize.
15. **§5.C / §5.D** — Add D-1.10 integration scenarios driving
    `analyzeEssay` end-to-end (D-1.15 scope) AND a checkpoint-failure
    scenario covering the atomic-commit throw path.
16. **§9.C** — Tue explicit retroactive ack of D-1.10 expansion.
    One-message commit, codify "expansion was justified, scope locked"
    so future audits have the trail.
17. **§9.E** — Builder names the 2 skipped tests in next commit body.

### Tier 3 — cleanup, defer if needed

18. **§5.E** — Save D-1.4 Round 3 comparison-pass variants as
    artifacts (`prompts/landingDetector.variant-A.draft.md` /
    `variant-B.draft.md`).
19. **Round-0 dead code** — Delete `computeChangeRatioForParagraph`
    placeholder at `priorAnnotationsBuilder.ts:437-454`.
20. **§3.A/3.B/3.C/3.D** — these reconciliations are Tier 2, but if
    bandwidth is tight, the spec drift can be batched into a single
    "Phase 1 spec reconciliation" commit before Phase 2 opens.
21. **D-0.12 rule blind spot patches** — Address the four real blind
    spots (aliased `allSettled`, narrow function-name allowlist,
    `void promise`, optional-chain swallow). Not blocking; track into
    a Phase 3 D-3.15 / library-code no-fallback pass when `claude.ts`
    is in scope.

---

## §13 — Confidence on this round

### What I verified directly
- D-1.5 ledger run-count and sums (read every committed `BUILD_COST_LEDGER`
  row; counted 5 evaluation runs).
- L5Annotation.id assignment (read `deepAnnotationService.ts:2034`
  directly via `git show 1b60e01`).
- Theatrical legacy-hydration test (read full body at
  `iteration-ledger-accessor.test.ts:192-232` directly).
- Calibration contamination — read `landingDetector.calibration.md`
  rationale text; the doc itself names "Anchor Case 2 from the prompt"
  as a calibration case rationale, which is a self-admission.
- D-1.9 subsumption — `grep -rn "generateAnnotations" src/`; one
  production callsite confirmed.
- ESLint rule blind spots — read the rule's AST matchers at
  `eslint-rules/no-silent-fallback.js:60-94` directly; identified
  matchers that fire (catch w/o emit-or-throw, `console.error`
  excluded correctly) and patterns that slip (aliased `Promise.allSettled`,
  narrow function-name allowlist, `void promise`, optional-chain).

### What I have lower confidence on
- The 30–40% contamination ratio in §7.B is auditor-counted by reading
  the `landingDetector.prompt.ts` anchors and the calibration cases
  side-by-side. Reasonable people could count differently — the
  VERBATIM matches (Cases 2, 3) are unambiguous; the MEDIUM/HIGH
  ratings are judgment calls. Builder may dispute the count; the
  finding stands on the verbatim cases alone.
- The "no-fallback violations" §4 are real but require Tue/Builder
  judgment on whether each rises to charter §8 violation. I marked
  them HIGH; reasonable readers could downgrade to MED if the
  category-argument defenses ("structural absence, not silent
  fallback") are accepted.
- D-1.10 was just landed at HEAD; the integration test (Tier 2 item
  15) gap is structural — the seam test exists, the orchestrator-driven
  test does not. D-1.15 (full iter 1→2 mock-LLM integration test)
  hasn't been written yet, so this gap is more of a "deliverable not
  yet covered" than "deliverable covered theatrically."

### What I did not verify (out of scope for this round)
- Phase 0's D-0.6 / D-0.7 RLS policy correctness (security-architect
  agent did this in the Builder's audit; I deferred).
- Phase 0's D-0.8 migration MVCC race correctness (database-best-practices
  agent did this; I deferred).
- The exact wording of every ESLint warning when the rule runs against
  the live tree — I read the rule's AST and identified what it WOULD
  flag, but didn't actually run `npx eslint`.
- Whether the production cost of Sonnet-vs-Haiku for landing detector
  at runtime scale will exceed Phase 6 E2E budget — that calibration
  is at Phase 6.

### Dispatched parallel investigation
- 5 parallel agents covered: D-1.1+1.2 spec conformance, D-1.3+1.4+1.5
  prompt + calibration, D-1.6+1.7+1.8 + D-1.9 subsumption, no-fallback
  + ESLint blind spots, D-1.10 + cumulative state. Auditor independently
  re-verified every HIGH and most MED findings against committed code.

---

> **End of Round 1 audit.** Next round triggers at the next 3-commit
> cadence or Phase 1 → Phase 2 boundary, whichever first.
>
> Open items: 13 from prior + this round (counted in §11 + new HIGH/MED
> in §3 / §4 / §5 / §7 / §9). Recommend the Builder close Tier 1 (5
> items) before Phase 2 entry, Tier 2 (12 items) before Phase 2 → Phase
> 3 boundary, Tier 3 (4 items) at convenience.
>
> The most consequential single finding is §7 (D-1.5 calibration
> discipline + contamination + case redesign) — the 10/10 calibration
> headline cannot be read as an unbiased validation result, and the
> run-cap was overshot 3 runs without an escalation artifact. Surface
> to Tue for accept-or-rerun decision.
