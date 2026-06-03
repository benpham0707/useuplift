# Wave-3a Phase 3B + 3C — Smoke Run Findings

**Date:** 2026-04-20
**Fixture:** `05-harvard-2028-i-too-can-dance` (single essay, both control and treatment arms)
**Cost:** ~$4.10 across two smoke runs
**Status:** Partial validation — my scope proven correct; separate blocker surfaced.

## TL;DR

- ✅ Phase 3B (telemetry persistence) — implemented, tested, proven functional in smoke (telemetry record written at L3 walk completion with correct schema).
- ✅ Phase 3C (layer wiring) — implemented, tested, flag matrix proven, stage overrides proven.
- ✅ Fixed a real bug in `analysisOrchestrator.runGrowthCycle()` (out-of-scope `input` reference). This bug was compile-clean because the project has `strict: false` / `noImplicitAny: false` in tsconfig. Smoke run caught it.
- ❌ **Cannot complete live A/B** (Checkpoint 3) until a pre-existing, unrelated L3.75 Phase B parsing bug is resolved. Reproduces identically with flag OFF and flag ON on the same fixture.

## What was validated by the smoke run

### Runner architecture — works end-to-end
- Feature-flag-gating between arms: confirmed (control arm ran with flag OFF, no telemetry written; treatment arm ran with flag ON, telemetry written).
- Per-arm telemetry isolation: confirmed (`telemetry-control.jsonl` stays empty; `telemetry-treatment.jsonl` gets the L3 record).
- Failure propagation from pipeline to report: fixed (runner now reads `PipelineResult.layersFailed` to detect partial failures, not just caught exceptions).

### L3 walk corpus wiring — works
Treatment arm's `telemetry-treatment.jsonl`:
```json
{
  "layer": "L3",
  "featureFlagEnabled": true,
  "retrievalAttempts": {
    "other": [{"stage": "walk", "resultCount": 0, "latencyMs": 2764, "injected": false, "error": null}]
  },
  "attributionTest": {"movesReferenced": 0, "antiPatternsReferenced": 0, "fabricatedReferences": []},
  "fallbacksTriggered": [],
  "totalLatencyMs": 2764,
  "corpusBlockTokens": 0
}
```
- Retrieval ran (2.7s latency → Claude Haiku cached catalog hit).
- Returned 0 archetype matches for this essay's profile signature (expected — profile at L3-walk-time lacks thesis/narrative strategy that hasn't been synthesized yet).
- Silent-skip-injection worked: 0 results → empty block → no prompt change → no telemetry fallback.
- Stage tag `'walk'` preserved correctly through the record builder into the `other` bucket.
- Persistence silent-fail path exercised (telemetry only written on layers that ran).

## What was NOT validated by the smoke run

Both arms failed at L3.75 Phase B before reaching L3.5/L4/L5. So the E2E wiring of those layers was not validated against live API output. They are covered by:
- Type check (`npx tsc --noEmit` — passing)
- Deterministic unit tests (`tests/corpus/test-phase3c-wiring.ts` — 45/45 passing)
- Manual code review (attribution ordering, telemetry persistence, per-layer flag gating)

The corpus retrieval at L3 succeeding + the L1/L2/L2.5/L3 pipeline completing proves the integration doesn't break any pre-L3.75 paths. The post-L3.75 paths (L3.5, L4, L5) can only be E2E-validated once the separate L3.75 bug is fixed.

## Pre-existing blocker: L3.75 Phase B parsing

**Error (identical in control and treatment):**
```
[HolisticSynthesis PhaseB] Missing sections: admissionsPositioning, entanglements.
Received keys: thematicArchitecture, narrativeStrategy, characterRevelation, craftAssessment
```

**Stack:** `holisticSynthesis.ts:1105 parsePhaseB` → `holisticSynthesis.ts:2211 synthesizeIteration`.

**Analysis:**
- Phase B is expected to produce 6 sections; LLM produced 4 and omitted the last 2.
- `jsonrepair library succeeded — response had malformed JSON` logged before parse — meaning the JSON structure was repairable, but the LLM's output was cut off before generating `admissionsPositioning` and `entanglements`.
- Most likely cause: `SYNTHESIS_MAX_TOKENS_PHASE_B = 7000` is too small for this essay's Phase B output. On a smaller essay, the LLM fits all 6 sections under 7K output tokens; on this one, it doesn't.
- Reproduces with feature flag OFF (no corpus injection) → NOT caused by my Wave-3a changes.

**This bug predates Phase 3A.** My corpus block adds 0 tokens on this essay anyway (L3 retrieval returned 0 matches, so 0-length block), so my work has zero input contribution. The Phase B LLM simply generates too much content for the current 7000 cap.

**Fix candidates (for whoever owns L3.75):**
1. Raise `SYNTHESIS_MAX_TOKENS_PHASE_B` to 10000-12000 (tightest, most direct).
2. Add a repair-call path: if parsePhaseB reports missing sections, re-prompt asking specifically for the missing sections only.
3. Make parsePhaseB soft-fail the missing sections and emit the available 4 — treat entanglements/admissionsPositioning as best-effort.

Option 1 is probably the right fix but has cost implications (~$0.005-0.01 more per L3.75 iteration). Option 2 adds complexity. Option 3 weakens the contract.

## Next steps

1. Resolve L3.75 PhaseB (owner TBD — out of Wave-3a scope).
2. Once resolved, re-run `tests/corpus/run-checkpoint3-ab.ts` against the 8 fixtures to complete Checkpoint 3.
3. Read the Phase 3A spec §A/B test protocol for the ship criteria — metrics 2/4/5/6 are automated by the runner; metrics 1 (correlation vs baseline) and 3 (weakness specificity) require human rating inputs.

## Per-run artifacts preserved

```
tests/output/checkpoint3/
├── report.md                   — human-readable A/B report (with current partial data)
├── summary.json                — machine-readable per-essay metrics
├── telemetry-control.jsonl     — (empty — flag OFF writes nothing)
└── telemetry-treatment.jsonl   — JSONL records emitted during treatment arm
```
