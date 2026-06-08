# D-1.12 — Halt-on-Error Orchestration Policy Audit

**Date:** 2026-04-29
**Branch:** `feat/integrated-pipeline-build` at HEAD `3e7c34e` (pre-remediation)
**Spec:** `L5_IMPLEMENTATION_PLAN.md` §D-1.12 — "Audit every Promise.allSettled and try/catch in both orchestrators. Any pattern that swallows errors and continues silently is rewritten to halt and surface the error with structured context."
**Methodology:** Four parallel general-purpose code-review agents. Three enumerated catch sites in `analysisOrchestrator.ts`, `reanalysisOrchestrator.ts`, `focusedAnalyzer.ts` (handoff added the third file beyond the spec's literal two). The fourth investigated cross-cutting halt-policy concerns (partial-result envelope, `PipelineError.wrap`, per-layer halt consistency, `mode: 'deferred'` overloading, telemetry coverage, "non-fatal" comment audit, ESLint rule evasion).

---

## 1. Classification taxonomy

Every catch / failure-handling site falls into exactly one of:

- **(a) Re-throws** — catch logs/emits then `throw error` or `throw new Error(...)`. The orchestrator halts cleanly. Reference site: `landingDetector.ts:193-205`.
- **(b) F-2 closure template** — catch emits structured `iterationTelemetry` with `status:'failed'` + pushes to `layersFailed[]` + continues with semantically-correct null/empty state where every consumer null-guards. Reference site: `analysisOrchestrator.ts:476-514` (post-F-2 closure).
- **(c) Charter-sanctioned swallow** — the ONE site (`carryForwardSynthesis.ts:safeAppendCarryForwardDecision`) where an audit-trail bug is worse to abort over than skip. Recorded as a deliberate carve-out in the no-fallback charter §8. Plus, by structural analogy, the parser ladder in `focusedAnalyzer.ts:parseJson` (5 nested catches that fall through to a terminal throw at line 288).
- **(d) VIOLATION** — silent fallback returning fake/hardcoded data, log-only without telemetry, banned phrase "graceful degradation," or any catch that masks an error without proper surfacing.

---

## 2. Per-file enumeration summary

### `analysisOrchestrator.ts` (3176 lines, 23 catch sites + 1 `Promise.allSettled` rejection branch)

| Classification | Count | Sites |
|---|---|---|
| (a) Re-throws | 2 | manifest_projection outer (#10), commitIterationRecord checkpoint (#16) |
| (b) F-2 template | 6 + AO First Read | L2/L2.5, L3, L3.75, L3.5, L4, L5 layer catches (all wrapped via `buildLayerError` + `buildPartialResult`); AO First Read post-F-2 closure |
| (c) Charter-sanctioned | 1 | buildPartialResult secondary commit (emits telemetry, preserves no-throw contract — documented per D-1.10 §"Failure-surface design" Q4) |
| (d) Violations | **15** | Phase 5.5 contradiction consumption, Phase 5.75 W5.4a delta synthesis, L5→manifest merge, runGrowthCycle understanding-prose synth, runGrowthCycle re-read step, runGrowthCycle per-finding store add, runGrowthCycle per-connection direct push, runGrowthCycle outer re-read loop, **`safeCheckpoint` (8 call sites!)**, HowlerPass + Howler carry-forward, loadPriorVoiceProfile, persistDerivedVoice, computeAndWritePiqPromptType, computeAndWriteAiRiskSignal |

### `reanalysisOrchestrator.ts` (~1320 lines, 18 catch sites)

| Classification | Count | Sites |
|---|---|---|
| (a) Re-throws | 3 | processEdit finally-only, triggerReanalysis pipeline-call, runEditProcessing edit-understanding |
| (b) F-2 template | 1 (partial) | processCoachingTurn returns `{success:false, error:msg}` but no `iterationTelemetry` emission |
| (c) Charter-sanctioned | 0 | (the safeAppend lives in carryForwardSynthesis.ts, not here) |
| (d) Violations | **14** | including 4 CRITICAL state-corruption / fake-result sites |

**The four CRITICAL `reanalysisOrchestrator.ts` violations:**

1. **Row 9 (line 771-789, post-pipeline coordinator-rebuild):** `EssayProfileCoordinator.fromCheckpoint(...)` failure logs "(CRITICAL)" then **returns the post-reanalysis result while leaving `this.coordinator` pointing at the pre-reanalysis state**. The result the caller receives no longer matches `getProfile()`. Comment literally says "the coordinator is now stale. But we still return the result." Invariant violation between returned data and orchestrator state.

2. **Row 10 (line 790-810, closeVersion catch):** Synthesizes a **fake `VersionRecord` with `version: 0`, empty arrays, current timestamp** when `versionTracker.closeVersion` throws. Comment: "Synthesize a minimal version record so we can still return a result." This is exactly "fake/hardcoded results returned" per CLAUDE.md "no degraded fallbacks." Downstream consumers cannot distinguish version=0 (real) from version=0 (synthesized).

3. **Row 16 (line 1140-1228, runFocusedMode outer catch):** On `focusedAnalyzer.runFocusedAnalysis()` throw, returns `{ mode: 'deferred', reanalysisTriggered: false, ... }` — same shape as the legitimate "deferred-by-trigger-policy" branch at line 1248-1261. **Caller cannot distinguish "policy chose to defer" from "analyzer crashed."** No telemetry, no `layersFailed`, no `error` field on `EditProcessResult`. Textbook §1a violation: "adding a try/catch that swallows the error."

4. **Row 18 (line 1270-1312, runComprehensiveMode escalation tail):** On `triggerReanalysis(focusedResult?.escalationLevel)` throw (the F-1 wire-up call site), returns `{ mode: 'comprehensive', reanalysisTriggered: false, ... }` — shape-indistinguishable from the legitimate deferred-but-recommended branch. Same caller-visibility gap as Row 16.

### `focusedAnalyzer.ts` (1870 lines, 19 catch sites)

| Classification | Count | Sites |
|---|---|---|
| (a) Re-throws | 0 | — |
| (b) F-2 template | 0 | — |
| (c) Charter-sanctioned | 5 | parseJson defensive ladder (lines 248/257/266/277/282 → terminal throw at 288) |
| (d) Violations | **14** | Step 1 outer (#8), Step 2 analysis (#9), Level 2 re-walk (#10), Level 3 holistic refresh (#11), L2→L3 upgrade synthesis (#12), snapshot IIFE (#13), apply understanding delta (#14), snapshot restore inside #14 (#15), apply analysis delta (#16), snapshot restore inside #16 (#17), Step 4 phase recompute (#18), W5.4c delta synthesis (#19), finding-evolution loop (#6), new-findings loop (#7) |

**The P0 focusedAnalyzer violations (escalation-ladder lying about success):**

- **Row 8 (line 822-983, Step 1 outer):** Hardcodes `escalationLevel: 1` on failure (semantically "no ripple") with no failure flag. **F-1 just wired this field through `reanalysisOrchestrator → PipelineInput.focusedEscalationLevel → IterationRecord.escalationLevel`**. The IterationRecord audit trail therefore receives a hardcoded `1` indistinguishable from a real "no escalation needed" outcome. Round-3 audit had already flagged escalationLevel as a dead wire; F-1 closed the producer→consumer wire; this catch UNDOES F-1's correctness by feeding the wire a misleading value.
- **Rows 10 / 11 / 12 (lines 1131-1273):** When a re-walk or synthesis call fails, `escalationLevel` is **left at the value the success path would have set** with no failure flag. Same audit-trail-corruption shape.
- **Row 9 (line 1027-1085):** Step 2 catch returns `analysisDelta: null, escalationLevel: 1`. Caller can't distinguish "Step 2 LLM call failed" from "no understanding changes detected, skipped Step 2."

---

## 3. Cross-cutting findings

### 3a. `essayCoachingRoutes.ts:413` — partial-result consumer boundary violation (CRITICAL)

The HTTP cold-start handler reads `result.profile` after `analyzeEssay(...)` **without checking `result.completedAllLayers` or `result.layersFailed`**. A partial result silently flows into a `ReanalysisOrchestrator` constructor + `processCoachingTurn`. When L1 was fatal, the placeholder profile carries no `iterationLedger`, no `findingStore`, no `northStar` — coaching runs against a near-empty profile and surfaces garbage to the user.

Repo-wide grep: `completedAllLayers` / `layersFailed` have **ZERO consumers outside `analysisOrchestrator.ts` itself**. No caller in the codebase respects the partial-vs-full discriminator. This is the F-2 pattern recurring at the API boundary.

### 3b. `mode: 'deferred'` semantic overloading (HIGH)

`EditProcessResult.mode === 'deferred'` is overloaded between (i) the legitimate "version tracker policy says defer" path (reanalysisOrchestrator.ts:1248-1261), (ii) Row 16 silent crash (focused analyzer threw), and (iii) the implicit deferral when `reanalysisTriggered: false`. Three semantically-distinct conditions, one return shape. Consumer cannot route differently on each.

### 3c. ESLint rule evasion (`eslint-rules/no-silent-fallback.js`) (MED)

The rule has three known evasions:
- **Pattern 2** (catch without throw or `emit*`) accepts ANY `emit*`-prefixed callee anywhere in the body. A success-path `emitStepStart` accidentally inside a catch silences the warning even though no FAILURE telemetry was emitted.
- **Pattern 3** (`??` defaults in functions whose name starts with `orchestrate|analyze|generate|build`) misses the most fallback-prone surfaces: `runFocusedAnalysis`, `triggerReanalysis`, `processEdit*`, `runComprehensiveMode`. None start with the four prefixes — yet they produce 14+ of the violations enumerated above.
- **Severity is `warn`**, not `error`. Even when it fires, nothing blocks merge.

### 3d. Telemetry coverage gaps

~30 catch sites across the three files have `console.error/warn` only with NO `emitIterationEvent`/`emitStepFailure`. The F-2 closure pattern was applied to AO First Read; D-1.12 closes the rest in priority order.

### 3e. `PipelineError.wrap` — compliant

`errors.ts:217-223`. Preserves the inner Error in `inner`, adds `layer` attribution, optional context prefix. `Error.captureStackTrace` is called. Used at `analysisOrchestrator.ts:1326` and `:2130` — both re-throw rather than swallow. No issue.

### 3f. Per-layer halt consistency — compliant for the eight pipeline-defining layers

Every fatal layer (L1, L2, L2.5, L3, L3.75, L3.5, L4, L5) halts via `buildPartialResult`. AO First Read is the only non-fatal layer and post-F-2 emits telemetry + `layersFailed.push`. Halt-on-error is consistent for the spine.

---

## 4. Findings rolled up by severity

### CRITICAL (5)

| # | Site | Pattern |
|---|---|---|
| C1 | `reanalysisOrchestrator.ts:771` (Row 9) | Coordinator-rebuild swallow → orchestrator state diverges from returned result |
| C2 | `reanalysisOrchestrator.ts:790` (Row 10) | Synthetic VersionRecord with `version:0` → fake-success placeholder |
| C3 | `reanalysisOrchestrator.ts:1140-1228` (Row 16) | Focused-mode silent crash → `mode:'deferred'` indistinguishable from policy defer |
| C4 | `reanalysisOrchestrator.ts:1270-1312` (Row 18) | Comprehensive-mode silent crash → `mode:'comprehensive', reanalysisTriggered:false` indistinguishable from policy defer |
| C5 | `essayCoachingRoutes.ts:413` | Partial-result consumed without `completedAllLayers` guard at HTTP boundary |

### HIGH (9)

| # | Site | Pattern |
|---|---|---|
| H1 | `focusedAnalyzer.ts:984` (Row 8) | Step 1 outer catch hardcodes `escalationLevel: 1` — feeds F-1 wire misleadingly |
| H2 | `focusedAnalyzer.ts:1086` (Row 9) | Step 2 catch returns `analysisDelta: null, escalationLevel: 1` indistinguishable from "no changes" |
| H3 | `focusedAnalyzer.ts:1169/1223/1273` (Rows 10/11/12) | Re-walk + holistic refresh + L2→L3 upgrade catches leave `escalationLevel` at success-path value |
| H4 | `analysisOrchestrator.ts:1955-1962` (`safeCheckpoint`) | Catches `coordinator.checkpoint()` failures across 8 call sites; persistence-failure invisible to telemetry/ledger |
| H5 | `analysisOrchestrator.ts:1029` (Phase 5.5 Contradiction Consumption) | Failure means contradictions detected by L4 are NOT consumed into FindingStore + annotation flags NOT generated |
| H6 | `analysisOrchestrator.ts:1111` (Phase 5.75 W5.4a Delta Synthesis) | Blocking-contradiction resolution failure invisible |
| H7 | `reanalysisOrchestrator.ts:529` (Row 5) | Delta-synth on coaching supersession leaves holistic profile stale silently |
| H8 | `reanalysisOrchestrator.ts:670` (Row 7) | Prior-findings extraction failure → walk runs with `priorFindings = []` (zero cross-iteration continuity) |
| H9 | `reanalysisOrchestrator.ts:1030 + :1069` (Rows 13 + 14) | Edit understanding never applied + edit never recorded → ledger continuity broken |
| H10 | `analysisOrchestrator.ts:1683-1713` | "should not happen" direct-push fallback bypasses ConnectionMutator integrity layer |

### MED (8)

| # | Site | Pattern |
|---|---|---|
| M1 | `analysisOrchestrator.ts:1299` (#9 L5→manifest merge) | $0.50 of L5 output silently dropped from manifest |
| M2 | `analysisOrchestrator.ts:1579` (#11 understanding-prose synth) | `essayUnderstanding` stays at prior value silently |
| M3 | `analysisOrchestrator.ts:1729` (#14 re-read step) | Multiple consecutive re-read failures invisible |
| M4 | `analysisOrchestrator.ts:2725 + 2830` (#18+#19 Howler) | Quality-floor pass + carry-forward both swallow |
| M5 | `reanalysisOrchestrator.ts:485 + :518` (Rows 3/4) | Insight + per-pattern recording log-only swallow |
| M6 | `reanalysisOrchestrator.ts:646` (Row 6) | Pre-reanalysis checkpoint loss — recovery affordance silently disabled |
| M7 | `reanalysisOrchestrator.ts:1083-1087` (Row 15) | Mode-selection defaults silently to 'focused' on rules-engine throw |
| M8 | `reanalysisOrchestrator.ts:1162-1167` (Row 17) | Improvement phase silently fails to update; coaching downstream sees stale phase |
| M9 | `focusedAnalyzer.ts:919, 974` (Rows 6/7) | Per-iteration finding/evolution drops invisible (no count) |
| M10 | `focusedAnalyzer.ts:1402, 1471` (Rows 14/16) | Delta-application failure logged-only; profile state may not reflect deltas |
| M11 | `focusedAnalyzer.ts:1311, 1417, 1486` (Rows 13/15/17) | Snapshot creation + restore failures fully swallowed |
| M12 | `focusedAnalyzer.ts:1524` (Row 18) | Phase recompute "non-fatal" → stale phase silently persisted; phase drives feedback zoom per L1K |

### LOW (multiple)

Documented "non-fatal-by-design" optional enrichment paths whose failure cannot break downstream consumers: `loadPriorVoiceProfile`, `persistDerivedVoice`, `computeAndWritePiqPromptType`, `computeAndWriteAiRiskSignal` — feature-flagged opt-in, no degraded-data write. Charter-aligned in spirit. The per-finding-store and per-connection-direct-push catches (#12/#13 in analysisOrchestrator) inside loops are belt-and-suspenders against bad LLM IDs — acceptable. `shouldSuggestReanalysis` (Row 11 reanalysisOrchestrator) is informational-only.

---

## 5. Remediation roadmap

This audit identifies the violations; the remediation lands in subsequent commits on the same branch. Sequenced by severity + dependency:

### Commit A — CRITICAL fixes (this session)
- **C1**: rethrow on `fromCheckpoint` failure with `PipelineError.wrap('coordinator_rebuild', ...)`. Stale-coordinator state is unrecoverable; halt is the only honest signal.
- **C2**: rethrow on `closeVersion` failure with telemetry. The version record is part of the audit trail; faking version=0 corrupts cross-iteration continuity.
- **C3 + C4**: introduce explicit failure shape on `EditProcessResult`. Add a `deferReason: 'policy_defer' | 'focused_failed' | 'comprehensive_failed'` discriminator and an `error?: { layer, message }` field. Failure paths populate them; policy paths set `deferReason: 'policy_defer'`. `mode` semantics preserved.
- **C5**: add a `completedAllLayers` guard at `essayCoachingRoutes.ts:413`. On partial result, throw a 503 with structured `layersFailed` info — no garbage profile flows downstream.

### Commit B — focusedAnalyzer escalation-ladder (this session)
- **H1, H2, H3**: replace silent escalationLevel hardcoding with structured failure flag on `FocusedAnalysisResult`. Add `escalationLevelFailed: boolean` + `failedAt?: 'step1' | 'step2' | 'level2_rewalk' | 'level3_synthesis' | 'l2_to_l3_upgrade'`. Orchestrator's F-1 consumer reads the flag and refuses to commit a misleading IterationRecord.escalationLevel.

### Commit C — analysisOrchestrator HIGH (this session)
- **H4**: `safeCheckpoint` emits `emitIterationEvent({step: 'checkpoint', status: 'failed', ...})` for parity with F-2. Decision still defers (checkpoint is non-load-bearing within a single run, per D-1.10) but the audit trail captures the failure.
- **H5, H6**: Phase 5.5 + Phase 5.75 catches add F-2-shaped telemetry emit + `layersFailed.push`. Continue semantics preserved for now (these are explicitly downstream-optional); future D-1.X may upgrade to fatal.
- **H10**: direct-push fallback at `runGrowthCycle` line 1683-1713 throws instead of warns. The "should not happen in normal pipeline" guard becomes a hard fail.

### Commit D (deferred, surfaced for Tue) — discriminated-union upgrade
- Larger refactor: convert `PipelineResult`, `EditProcessResult`, `FocusedAnalysisResult` to TypeScript discriminated unions. Compiler-enforced consumer correctness instead of comment-driven discipline. Recommend Tue's call before implementing.

### Commit E (deferred) — ESLint rule hardening
- Tighten Pattern 2 to require `emitStepFailure`/`emitIterationEvent` with `status: 'failed'` payload (not just any `emit*`).
- Extend Pattern 3 prefix list to include `run|trigger|process|reanalyze|focused`.
- Promote rule severity from `warn` to `error` once the gap list above is closed.
- Add Pattern 4 flagging `mode: 'deferred'`-style literal-discriminator returns inside a catch without an attached error field.

### Deferred to D-1.16 (failure-injection test suite)
- All MED + remaining HIGH violations get fix-and-test pairs landed inside D-1.16's scope, since D-1.16 will exercise every error boundary.

---

## 6. Verification baseline (pre-remediation)

- `npx tsc --noEmit` clean
- `npx vitest run`: 277 passed | 2 skipped (15 test files)
- ESLint rule `no-silent-fallback` is currently `warn`-severity and known to evade three patterns above

After Commits A+B+C: tests must remain ≥ 277 passing; new failure-injection tests are out of scope (D-1.16) but additional unit / integration tests may be added inline where they don't bloat the commit.

---

## 7. Verdict

**The orchestrators are partially compliant with the halt-on-error charter.** The eight pipeline-defining layers in `analysisOrchestrator.ts` halt cleanly via `buildPartialResult` — that spine is sound. **The non-spine catches (35+ across the three files) are net violations**: log-only swallows, hardcoded fallback values feeding load-bearing fields (escalationLevel), state-divergence catches that silently corrupt orchestrator invariants, and a partial-result consumer at the HTTP boundary that doesn't check the partial-vs-full discriminator. Closing the 5 CRITICAL + 9 HIGH violations enumerated above brings Phase 1's halt-on-error policy in line with the charter and unblocks D-1.16's failure-injection test suite.
