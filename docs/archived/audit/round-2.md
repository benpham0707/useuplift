# Round 2 Audit — Closure verification + D-1.11 Step 0/Step 1

> 3-commit cadence audit. Scope: verify Builder's claimed closures of
> nine round-1 findings (T1.4 ×4, T1.5, T2.4, T2.5, T3.2, T3.4) and
> audit D-1.11 Step 0 (essay-keyed TaughtMove buffer) + Step 1
> (HOLISTIC_SECTION_KEYS + PipelineInput.focusedEscalationLevel).
>
> Round-1 baseline: `docs/audit/round-1.md` committed at `d21e6e3`.

---

## §1 — Round metadata

- **Round number:** 2
- **Audit date:** 2026-04-28
- **HEAD at audit start:** `ea05348`
- **Prior-round HEAD:** `d21e6e3` (Round 1 commit)
- **Commits since last audit:**
  - `91b315c` — D-1.11 Step 0 (essay-key TaughtMove buffer)
  - `c1b2c44` — D-1.11 Step 1 (HOLISTIC_SECTION_KEYS + escalation field)
  - `045fffa` — round-1 closure commit A (claims T1.4, T2.4, T2.5, T3.2, T3.4)
  - `ea05348` — round-1 closure commit B (claims T1.5)
- **Audit method:** 1 focused investigator agent verified all 9 closures
  + D-1.11 Step 0/Step 1; Auditor independently hex-dumped the
  `bufferKey` delimiter (the new HIGH-impact claim) and confirmed.

---

## §2 — Round-1 closures verified

All 9 closures verified CLOSED at HEAD `ea05348`. File:line evidence:

| Round-1 ID | Status | Evidence |
|---|---|---|
| **T1.4 §4.A** — 4 legacy-backfill emits | **CLOSED** | `essayProfileManager.ts:1554-1586` — each of the 4 branches emits `step:'profile.fromCheckpoint.legacyBackfill.<field>'`, `status:'failed'`, `error.code:'legacy_backfill'`. Behavior unchanged (still assigns `[]`); emit is purely additive. Test at `tests/unit/iteration-ledger-accessor.test.ts:296-356` exercises all 4 events. |
| **T1.4 §4.B** — iterationLedger hydration severity | **CLOSED** | `essayProfileManager.ts:1508-1521` — emit is `status:'failed'` with `error.code:'legacy_hydration'`; warn message + default-fill behavior preserved. Test asserts `status==='failed'` at `iteration-ledger-accessor.test.ts:282-286`. |
| **T1.4 §4.C** — buildPartialResult secondary-commit catch | **CLOSED** | `analysisOrchestrator.ts:2117-2137` — `emitIterationEvent` fires BEFORE `console.error`; `step:'iteration_commit_secondary_failure'`, `status:'failed'`, `code:'partial_result_commit_failure'`, context carries `triggeredBy/layersCompleted/layersFailed`. No-throw contract preserved. |
| **T1.4 §4.D** — composer snapshot-unavailable | **CLOSED** | `priorAnnotationsBuilder.ts:683-700` first-pass branch emits `status:'succeeded'` (`priorAnnotations.composer.firstPassShortCircuit` — structural, not degradation). Lines 707-727 iter≥2 missing-snapshot branch emits `status:'failed'`, `code:'prior_snapshot_unavailable'`. Console.log retained for tail visibility. |
| **T2.4 §4.F** — D-1.7 emitMoveDropped | **CLOSED** (with framing caveat) | `priorAnnotationsBuilder.ts:245-279` — replaced `console.log` with `emitIterationEvent`. `status:'succeeded'` (the drop IS successful execution of the deliberate-skip path; reason carried in `error.code`). `paragraphIndex` set to `oldParagraphIndex`. Caveat: `'succeeded'` framing for a drop is defensible but unusual — see §5.A LOW finding. |
| **T2.5 §4.G** — eslint-disable mode-selection | **CLOSED** | `priorAnnotationsBuilder.ts:540` (transformative for dropped paragraphs, cites D-1.8 "Significance source"), `:576` (mechanical fallback for kept paragraphs, cites D-1.8), `analysisOrchestrator.ts:400` (`input.triggeredBy ?? 'first_pass'`, cites cold direct-call structural default). Each is `eslint-disable-next-line` only and names the locked design decision. |
| **T3.2** — dead placeholder deletion | **CLOSED** | `priorAnnotationsBuilder.ts:446-452` — `computeChangeRatioForParagraph` body deleted, replaced with closure note. `git grep computeChangeRatioForParagraph` returns only the comment block. |
| **T3.4** — rename `assertIterationLedgerOnLoad` → `validateAndNormalizeIterationLedger` | **CLOSED** (with cosmetic nit) | `essayProfileManager.ts:1149` — renamed. All 5 src/ + 9 test/ callsites updated. Nit at `tests/integration/d1-10-iteration-bracket.test.ts:164` — `it()` description string still names the old function. See §5.B LOW. |
| **T1.5** — theatrical legacy-hydration test | **CLOSED, exemplary** | `tests/unit/iteration-ledger-accessor.test.ts:191-352` — TWO new tests. Test 1 deletes `iterationLedger` via `delete (legacyProfile as unknown as Record<string,unknown>).iterationLedger`, then calls real `EssayProfileCoordinator.fromCheckpoint`. Asserts hydrated default ledger shape, real production warn message (with `essayId` interpolated), and telemetry event with `status:'failed'` + `code:'legacy_hydration'`. Test 2 strips all 4 legacy-backfill targets and asserts each event fires. Both run real production code. |

**Verdict on closures:** All 9 verified. The T1.5 closure is exemplary
— the new test materially replaces theatrical assertion patterns with
production-path exercise. T2.4 closure has a framing caveat (§5.A) but
is functionally complete.

---

## §3 — D-1.11 Step 0 audit (`91b315c`) — essay-keyed TaughtMove buffer

### 3.A — Latent corruption claim VERIFIED real

The Builder's "Apr-28 5-agent pre-D-1.11 audit" surfaced a latent
corruption: TaughtMove buffer keyed by iteration alone, two essays at
iter=1 in the same process would cross-pollute.

Verified by reading old buffer at `git show d21e6e3:src/services/essayIntelligence/analysis/taughtMoveBuilder.ts:184`:
- `Map<number, TaughtMove[]>` keyed by iteration alone. ✓
- `flushTaughtMovesForIteration(iter)` returns `taughtMoveBuffer.get(iteration)?.slice() ?? []` — non-destructive. ✓
- `clearTaughtMovesForIteration` only ever called from
  `analysisOrchestrator.ts` post-commit per essay; with two essays
  running iter=1 concurrently, both `bufferTaughtMoves(1, ...)` calls
  push into the same bucket and both flushes return the merged set. ✓

The framing is accurate. Not actively triggering today (one
`ReanalysisOrchestrator` per essay, single-essay-at-a-time runtime),
but defense-in-depth before any future shared-worker refactor silently
corrupts data is the right call.

### 3.B — Compound-key fix correctness

`taughtMoveBuilder.ts:208-210` defines
`bufferKey(essayId, iteration)`:
```typescript
function bufferKey(essayId: string, iteration: number): string {
  return `${essayId}<DELIM>${iteration}`;
}
```
- Validators correctly require `essayId` (throws on empty/non-string at
  `:226-230`).
- Type-level: `flushTaughtMovesForIteration:254` and
  `clearTaughtMovesForIteration:266` both require `essayId: string` —
  TypeScript prevents accidental drop-back to single-arg form.
- Callsites threaded:
  `analysisOrchestrator.ts:1024 bufferTaughtMoves(input.essayId, currentIter, taughtMoves)`,
  `:1809 flushTaughtMovesForIteration(input.essayId, iter)`,
  `:1902 clearTaughtMovesForIteration(input.essayId, iter)`. `git grep`
  shows no remaining unkeyed callsites.
- Regression test at `taught-move-builder.test.ts:247-271` creates
  ESSAY_A and ESSAY_B at iter=1, buffers a distinct move into each,
  asserts each flush returns ONLY its own move (length 1, distinct
  `annotationId`s), and explicitly asserts that clearing one does NOT
  affect the other. Strong test — catches future regressions to shared
  keys.

### 3.C — `[MED]` New finding — bufferKey JSDoc misrepresents the delimiter byte

- **Code** (`taughtMoveBuilder.ts:202-206`):
  ```
   * Compound key for the transient buffer. We use a string concatenation
   * with a delimiter unlikely to appear in essayIds (`<NUL>` is reserved
   * for type-level seg separation). Map<bufferKey, TaughtMove[]>.
  ```
  The delimiter is rendered visually inside backticks. **Hex-dump
  evidence (auditor-verified via `od -c` at offset 0x411 of the
  committed file):**
  ```
  ...e   s   s   a   y   I   d   s       (   `   \0   `       i   s ...
  ```
  The actual byte between the backticks is `\0` (literal NUL, 0x00),
  not a printable character.
- **Why this matters.** UUIDs from Supabase cannot contain NUL, so the
  collision risk is functionally zero in production. But the JSDoc
  misrepresents the chosen byte: a future reader rendering this in
  most IDEs/diff tools will see backticks with empty / placeholder
  content and form a false mental model of what the delimiter is.
  Tooling layers that string-truncate on NUL (rare — C-string interop,
  some logging adapters) could appear to "lose" the iteration suffix.
- **Recommended fix.** Either (a) update the JSDoc to name "U+0000
  NUL" explicitly with reasoning ("chosen because UUIDs from Supabase
  cannot contain NUL bytes; impossible-in-key delimiter"), OR (b)
  switch the delimiter to a printable invalid-in-UUID character like
  `:` or `|` and update the JSDoc to match. Either is fine; current
  state is misleading.

### 3.D — Telemetry buffer same-shape vulnerability honestly deferred

`iterationTelemetry.ts:32-58` contains an explicit ⚠️ block naming:
- Same-shape vulnerability acknowledged.
- IMPACT: audit-only, NOT load-bearing for next iteration's analysis.
- RUNTIME ASSUMPTION: one ReanalysisOrchestrator per essay,
  single-essay-at-a-time.
- DEFERRED FIX: rekey by essayId, lands "as its own focused commit
  before D-1.11 Step 14 (integration test) so the test can cover the
  concurrent-essay path."

Honest framing — names what step closes it. Severity LOW today,
defense-in-depth.

### 3.E — Step 0 not in spec — process discipline issue

See §6.A. `git show 91b315c -- docs/` returns empty;
`L5_IMPLEMENTATION_PLAN.md` was not amended to insert "Step 0" before
the listed D-1.11 contract. The 5-agent audit's findings (compound
key, escalation field, holistic-section-keys, telemetry deferral,
focused-mode holistic-carry DP-5) are described only in commit
messages.

---

## §4 — D-1.11 Step 1 audit (`c1b2c44`)

### 4.A — `HOLISTIC_SECTION_KEYS` const

`profileTypes.ts:251-262` — 10 keys exactly matching the
`HolisticSectionType` union at `:228-240`:
- voice_identity, voice_map, emotional_topography, moment_earnedness_map,
  thematic_architecture, narrative_strategy, character_revelation,
  craft_assessment, cross_dimension_entanglements, admissions_positioning.
- Declared `readonly HolisticSectionType[]` + `Object.freeze(...)` +
  trailing `as const`. Mutation prevented at type-check, runtime, and
  literal-narrow levels.
- JSDoc honestly notes "TypeScript type union and runtime array MUST
  stay in sync" — no compile-time `assertSatisfies` enforces this; a
  future lint rule TODO is named.

### 4.B — `PipelineInput.focusedEscalationLevel`

`analysisOrchestrator.ts:301`:
```typescript
focusedEscalationLevel?: 0 | 1 | 2 | 3 | 4;
```
- Optional, default-undefined (field absent on first-pass per JSDoc).
- JSDoc at `:284-300` names producer
  (`reanalysisOrchestrator.triggerReanalysis()` reading
  `focusedResult.escalationLevel`) and consumer (`commitIterationRecord`
  D-1.11 amendment, lands in Step 13).
- Names the levels per `L5_ITERATION_LOOP_DESIGN.md` §6.4.
- Consumer is still stubbed at `:1880` — `escalationLevel: 0, // D-1.11+
  scope (focusedAnalyzer mode-selection wires this)`. The new field is
  currently a dead read, intentional per Builder's commit message. No
  misleading wiring (the stub doesn't read the field and falsely claim
  to honor it).

### 4.C — Verdict

Both type contracts are clean and audit-honest. The `as const` +
`Object.freeze` defense-in-depth on `HOLISTIC_SECTION_KEYS` is good.
Deferring the consumer wire-up to Step 13 is honest scope discipline
(stub doesn't pretend to consume the new field).

---

## §5 — Other findings (this round)

### 5.A — `[LOW]` `emitMoveDropped` uses `status:'succeeded'` for a drop

- **Site.** `priorAnnotationsBuilder.ts:245-279` (T2.4 closure).
- **Builder's framing.** "The drop IS successful execution of the
  deliberate-skip path; the `error.code` carries the drop reason as
  structured metadata for audit filtering."
- **Disposition.** Defensible but unusual. If `IterationTelemetryEvent.status`
  admitted a `'skipped'` value, that would map cleaner. Current framing
  is documented; not a regression. No change requested.
- **Recommended fix (optional).** Future enhancement: extend
  `IterationTelemetryEvent.status` enum with `'skipped'` and migrate
  `emitMoveDropped` to use it. Defer until D-1.12 or whenever the
  status-enum surface is naturally edited.

### 5.B — `[LOW]` Stale `it()` description in d1-10-iteration-bracket.test.ts

- **Site.** `tests/integration/d1-10-iteration-bracket.test.ts:164`.
- **Issue.** Test description still names the old function
  `assertIterationLedgerOnLoad` after the T3.4 rename to
  `validateAndNormalizeIterationLedger`.
- **Disposition.** Cosmetic. Function call inside the test is via
  `createInitialProfile`, not the renamed function directly — test
  still passes. Just rename the description string.

---

## §6 — Process discipline

### 6.A — `[MED]` D-1.11 audit-driven step expansion not reconciled in spec

- **Spec** (`L5_IMPLEMENTATION_PLAN.md:632-641`): D-1.11 listed as
  "3-4 hours, mostly call-site additions."
- **Reality.** Builder ran a 5-agent pre-D-1.11 audit that surfaced 5
  audit-driven additions (compound-key fix, escalation field threading,
  HOLISTIC_SECTION_KEYS array, telemetry buffer deferral, DP-5
  focused-mode holistic-carry decision-point). Two committed so far
  (Step 0 and Step 1); ~12 more steps planned (incl. Step 14 integration
  test).
- **Why this matters.** This is the SAME pattern as round-1 §9.C
  (D-1.10 unilateral spec expansion). Auditor-found additions to the
  spec are legitimate — the Builder is doing the right thing
  technically — but the spec doc is now out of sync with the build
  history. A future auditor reading "3-4 hours, mostly callsite
  additions" cannot reconcile with a 14-step build.
- **Recommended fix.** Same as round-1 §9.C remediation: insert an
  audit-driven sub-deliverable section in
  `L5_IMPLEMENTATION_PLAN.md:632` listing Steps 0/1/.../14 with
  per-step contracts. One-shot doc commit; no code change. Tue should
  retroactively ack the expansion (a single message would suffice).

### 6.B — Closure commits cite the audit findings explicitly

The Builder's two closure commits (`045fffa`, `ea05348`) are exemplary
in commit hygiene. Each cites the round-1 finding ID it closes (T1.4,
T1.5, etc.) and includes `[round-1 audit §X.Y / TN.M closure]`
markers in source-comment changes. This makes future auditing cheap.
Recommended pattern for future closure commits.

---

## §7 — Cumulative-state coherence

- **Cost ledger.** `BUILD_COST_LEDGER.md` cumulative is unchanged at
  **$0.5110 of $9 hard halt**. All 4 commits this round are pure-text
  / type-only / test additions — zero API spend. Cap discipline intact.
- **Type-scaffold compatibility.** `HOLISTIC_SECTION_KEYS` matches the
  `HolisticSectionType` union; `PipelineInput.focusedEscalationLevel`
  is properly literal-typed (`0 | 1 | 2 | 3 | 4`). No type/consumer
  drift surfaced.
- **Locked decisions honored.** Q1 / Q4 / Q-A / Q-B status unchanged
  from round-1. The new code in this round (compound-key fix, type
  contracts) doesn't touch any of the four decisions.

---

## §8 — Open items rolled forward

| Round-1 ID | Status as of round-2 | Notes |
|---|---|---|
| T1.1 — D-1.5 cap escalation paper trail | **OPEN, BLOCKED on Tue** | Awaiting accept-or-rerun decision. |
| T1.2 — D-1.5 held-out validation set | **OPEN, BLOCKED on Tue / not run** | v0.5.0-round5 prompt is PROVISIONAL until held-out cases run. |
| T1.3 — D-1.5 Case 8 history restoration | **OPEN** | Original parallel-edit Case 8 not yet restored as `case-8a`. |
| T1.4 §4.A/B/C/D — silent degradation telemetry | **CLOSED** | Verified §2. |
| T1.5 — theatrical legacy-hydration test | **CLOSED** | Verified §2; exemplary fix. |
| T2.1 — spec reconciliation batch | **OPEN** | Currentiteration default, ID format, model policy, REVISIT hedge — none updated yet. |
| T2.2 — D-1.9 architectural invariant enforcement | **OPEN** | Comment + ESLint guard not yet added. |
| T2.3 — D-1.12 AO First Read | **OPEN** | D-1.12 hasn't started. |
| T2.4 — D-1.7 drop telemetry | **CLOSED** | Verified §2. |
| T2.5 — eslint-disable mode-selection | **CLOSED** | Verified §2. |
| T2.6 — tautological property test | **OPEN** | `taught-move-builder.test.ts:234-256` not yet restructured. |
| T2.7 — D-1.10 orchestrator-driven integration scenario | **OPEN** | D-1.15 territory; not yet landed. |
| T2.8 — D-1.10 checkpoint-failure scenario | **OPEN** | Same. |
| T2.9 — D-1.10 spec expansion ack | **OPEN, BLOCKED on Tue** | |
| T2.10 — identify the 2 skipped tests | **OPEN** | Vitest now reports 212/214 + 2 skipped — same 2; still unidentified. |
| T3.1 — D-1.4 variants saved | **OPEN** | |
| T3.2 — dead placeholder deletion | **CLOSED** | Verified §2. |
| T3.3 — l5AnnotationToTaughtMove validation | **OPEN** | |
| T3.4 — rename `assertIterationLedgerOnLoad` | **CLOSED** | Verified §2; cosmetic nit at §5.B. |
| T3.5 — D-0.12 ESLint blind-spot patches | **OPEN, deferred to D-3.15** | |

**Round-1 closure rate:** 9 of 22 closed. Tier 1 (must-close-before-Phase-2)
items remaining: T1.1, T1.2, T1.3 — all gated on Tue's D-1.5 ruling.
Tier 2 + Tier 3 work continues in parallel.

**New round-2 items:**
- §3.C bufferKey JSDoc misrepresents delimiter byte (MED)
- §6.A D-1.11 spec expansion not reconciled (MED)
- §5.A `emitMoveDropped` `'succeeded'` framing (LOW)
- §5.B stale `it()` description in d1-10 test (LOW)

---

## §9 — Recommended actions (round-2)

### Tier 1 — same as round-1 Tier 1 (still BLOCKED on Tue D-1.5 ruling)

1. **T1.1 / T1.2 / T1.3** — D-1.5 calibration discipline + held-out set
   + Case 8 restoration. **Surface: §1 Tue ruling needed.**

### Tier 2 — close before Phase 2 → Phase 3 boundary

2. **§3.C** — Update `bufferKey` JSDoc at
   `taughtMoveBuilder.ts:202-206` to name "U+0000 NUL" explicitly,
   OR switch delimiter to a printable invalid-in-UUID character like
   `:` or `|`.
3. **§6.A** — Reconcile `L5_IMPLEMENTATION_PLAN.md:632` to reflect
   D-1.11's audit-driven step expansion. Insert sub-deliverable
   section listing Steps 0/1/.../14 with per-step contracts.
4. Round-1 Tier 2 items still open: **T2.1, T2.2, T2.3, T2.6, T2.7,
   T2.8, T2.10**. (T2.4, T2.5, T2.9 closed or blocked.)

### Tier 3 — cleanup

5. **§5.A** — Optional: extend `IterationTelemetryEvent.status` enum
   with `'skipped'` for a more honest mapping of `emitMoveDropped`.
6. **§5.B** — Rename stale `it()` description string at
   `d1-10-iteration-bracket.test.ts:164`.
7. Round-1 Tier 3 items still open: **T3.1, T3.3, T3.5**.

---

## §10 — Confidence on this round

### Verified directly
- All 9 round-1 closures by re-reading the cited file:lines at HEAD
  `ea05348`.
- bufferKey delimiter byte via `od -c` hex-dump (offset 0x411 of
  `taughtMoveBuilder.ts` shows literal `\0`).
- D-1.11 dead-wire claim: read old buffer at
  `git show d21e6e3:src/services/essayIntelligence/analysis/taughtMoveBuilder.ts`
  to confirm the OLD shape was iter-keyed.
- HOLISTIC_SECTION_KEYS / focusedEscalationLevel field types via direct
  read of `c1b2c44`.

### Confidence on D-1.11 step splitup
The Builder's "5-agent pre-D-1.11 audit" pattern is mature discipline
— surfaces latent issues before they ship. Step 0's compound-key fix
is materially correct; Step 1's type contracts are clean. The only
issue is doc reconciliation (§6.A); the engineering is sound.

### Did not verify
- Whether the Builder's claimed "5-agent pre-D-1.11 audit" actually
  ran 5 agents (not visible in repo). Disposition: take Builder at
  face value; the surfaced findings are real.
- Whether `vitest run` still reports 212/214 + 2 skipped (Builder
  claim) vs reality. Probability of regression in a test-only commit
  is low.

---

> **End of Round 2 audit.** Closures verified at high integrity. The
> Builder's discipline is improving — closure commits cite finding IDs,
> source comments tag closures inline. D-1.11's audit-driven step
> expansion repeats the round-1 §9.C pattern (unilateral spec
> expansion, materially justified) and warrants the same retroactive
> ack from Tue plus a doc reconciliation commit.
>
> **Most consequential finding this round:** the bufferKey JSDoc
> misrepresents its delimiter byte (§3.C). Functional impact nil
> today; mental-model risk for future readers and tooling-layer risk
> on string truncators. Easy fix.
>
> Next wake at next 3-commit cadence or Phase 1 → Phase 2 boundary,
> whichever first.
