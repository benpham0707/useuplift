# L5 Top-N Ranker — Design

> **Status**: design + implementation in flight on `fix/warm-edit-completedalllayers`.
> **Owns**: hitting the 20–30 L5Annotation/essay lock (`CURRENT_STATE.md` L5) from a larger candidate pool, without discarding paid LLM output (`feedback_llm-first-design.md` Rule 2).
> **Promoted**: load-bearing for Phase 5 per lock commit `b32534b` (2026-05-12).
> **Doesn't own**: candidate generation prompting (already in `deepAnnotationService.ts`), corpus retrieval, technique tagging.

---

## Problem

The lock target is 20–30 deep L5 annotations per essay, ~250–375 tokens each, covering ≥3 of 4 `teachingMode`s with ≥1 ACTION+rewriteExample per paragraph. Current `deepAnnotationService.ts` has:

- **Soft per-paragraph guidance only** (3–5 / 4–7 / 6–10 / 8–14 / 3–6 by phase) — `PHASE_GUIDANCE` at `:82–117`. The LLM decides count.
- **No essay-level cap or floor.** `deduplicateAndPrioritize` explicitly states "NO cap. NO slice" (`:2171`, `:2192`) — correct per Rule 2, but means we have no mechanism to surface a curated 20–30.
- **No diversity gate** on `teachingMode` or per-paragraph ACTION coverage.
- **No way to over-generate then trim.** Today's output is whatever the LLM happens to emit; on a 7-paragraph essay in Architecture phase that's ~14 + essay-level + cross-paragraph ≈ 18–24, often under the 20 floor.

## What this changes

One new pass — `rankAndSurfaceAnnotations()` — invoked once after dedup + cross-paragraph merge. Adds:

1. **`L5Annotation.surfaced: boolean`** — default `true`. Annotations beyond Top-N flip to `false`. Nothing is deleted; the field gates the student-facing render. The full pool stays in the profile for carry-forward (`taughtMoves` ledger) and for telemetry.
2. **`L5AnnotationResult.surfacedCount: number`** — count of `surfaced=true` annotations across all three buckets.
3. **Selection algorithm** — deterministic, no LLM call:
   - Sort the combined pool by `priority` (LLM-assigned, 1=highest) ascending, then `confidence` descending.
   - **Floor pass 1 — per-paragraph ACTION coverage.** For each paragraph that has ≥1 ACTION-mode annotation with `rewriteExample` in the pool, mark the highest-priority such annotation as a required surface.
   - **Floor pass 2 — teachingMode diversity.** If the required surface set covers <3 distinct `teachingMode`s and the pool contains other modes, mark the highest-priority annotation of each missing mode as required, up to 3 distinct modes.
   - **Fill pass.** Greedy in priority order, append non-required annotations until the surfaced set reaches 30 or the pool is exhausted.
   - **Floor target.** If surfaced set < 20 after the fill, surface everything (better to show all than to hide good annotations).
4. **Diagnostic log** — when surfaced count lands outside [20, 30] for an essay >300 words, log a single line so Phase 6 verification regen can spot calibration drift.

## What this explicitly does not do

- **No new LLM call.** Pure post-processing on already-emitted annotations.
- **No quality formula beyond LLM signals.** The LLM-judged `priority` and `confidence` carry the ranking; the deterministic layer only enforces the lock's structural floors. (Per `feedback_llm-first-design.md` rule "no deterministic formulas for contextual decisions" — `priority`/`confidence` are the LLM's contextual judgment.)
- **No deletion.** Rule 2 stands. Unsurfaced annotations remain in the result for the iteration ledger.
- **No per-paragraph cap.** A paragraph that legitimately needs 5 annotations gets all 5 surfaced if priority orders them inside the top 30. Density is signal, per the existing comments at `:2173–2179`.
- **No change to PHASE_GUIDANCE numbers.** Today's soft counts × 7 paragraphs already yield ~25–60 candidates in Architecture/Craft/Polish phases — sufficient candidate pool for the ranker to pick 20–30 from. Foundation/Distinction may under-generate (~10–15 candidates); the ranker surfaces all of them and the < 20 diagnostic fires. Tuning PHASE_GUIDANCE upward to ensure ≥30 candidate-pool in every phase is deferred to a separate change if Phase 6 verification shows the under-emission is real.

## Files modified

| File | Change |
|---|---|
| `src/services/essayIntelligence/analysis/deepAnnotationService.ts` | Add `surfaced` field to `L5Annotation`, `surfacedCount` to `L5AnnotationResult`, new private `rankAndSurfaceAnnotations()`, wire-call after cross-paragraph merge (`:753`). |
| `tests/test-l5-topn-ranker.ts` | New unit test. Synthesizes 50 mixed annotations across 5 paragraphs, runs ranker, asserts: 20 ≤ surfaced ≤ 30, ≥3 distinct `teachingMode`s, each paragraph with an ACTION+rewrite pool member has it surfaced, all rest still in result with `surfaced=false`. Zero LLM cost. |

## Feature flag

None. The ranker runs always; the `surfaced` flag is additive. Consumers that ignore the flag see the full set (back-compat). The student-facing render layer (`presentation/renderAnalysisForStudent.ts`) reads `surfaced` and renders only the surfaced subset — that wire lands in Phase 2.

## Risks

- **Diversity floor over-promotes weak modes.** If only one CONNECTION annotation exists in the pool and its priority is 5, the diversity gate still promotes it ahead of higher-priority AWARENESS annotations. Mitigation: the gate only fires when needed (already <3 modes in required set); the promoted CONNECTION's priority + confidence are logged for Phase 6 review.
- **Per-paragraph ACTION floor can crowd out essay-level.** A 10-paragraph essay with one ACTION per paragraph already eats 10 of the 30 slots. Mitigation: this is the lock — the lock prioritizes ACTION coverage. If essay-level/cross-paragraph compression hurts, surface that to Tue as a relock candidate.
- **`priority` reliability.** The LLM's `priority` field has not been independently calibrated. Phase 6 verification will reveal whether the LLM uses the full 1–5 range or clusters at 2–3. If it clusters, swap `confidence` to primary sort key.

## Validation path

- **tsc clean.** `npx tsc --noEmit`.
- **Unit test green.** `npx tsx tests/test-l5-topn-ranker.ts` (synthetic input, no API).
- **Phase 6 verification regen.** When Tue approves the bundled regen, the run report must show: surfaced count in [20, 30] for the Crochet baseline; ≥3 distinct `teachingMode`s; each paragraph with ACTION-pool coverage has surfaced ACTION+rewrite; full pool count > surfaced count (proves nothing was deleted).
