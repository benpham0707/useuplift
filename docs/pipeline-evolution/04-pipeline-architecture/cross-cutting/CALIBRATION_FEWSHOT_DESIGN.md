# Calibration Few-Shot Design

> **Stage 1.C** of [`CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md`](../../00-index/CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md).
> **Decision locked**: D7 — all three scoring layers (L3.5 + L4 + L5).
> **Date**: 2026-05-24. **Author**: Claude (review session walkthrough).

---

## 1. Problem

Per `WRITING_SYSTEM_DEEP_RESEARCH_SYNTHESIS.md` P4: **~70% of scoring prompts have zero calibration few-shot examples**. This is the *#1 cause* of mid-band miscalibration — the LLM bunches scores in the 65–75 functional band because it has no anchored exemplars telling it what 80 looks like vs 90 vs 95.

53 anchored `MOVE_EXCERPTS` already exist in the corpus (`L5_FEEDBACK_REDESIGN.md §5`; `IMPLEMENTATION_STATUS_MATRIX.md` Row 24). They are not consulted by any scoring layer today.

## 2. Goal

Inject static anchored exemplars into the three scoring prompts so the LLM has concrete band anchors when assigning scores. Acceptance: post-intervention, within-paragraph score variance is no longer clustered (std dev should *increase* meaningfully — clustering at 65–75 is the symptom of the absent anchors).

## 3. Scope (3 layers)

| Layer | Prompt site | What gets calibrated |
|---|---|---|
| L3.5 sentence effectiveness | `analysisPass.ts` system or shared cached block | Per-sentence 0-100 `effectiveness` scoring |
| L4 ScoreMatrix paragraph | `crystallizer.ts` ScoreMatrix call (`L4_UNIFIED_CACHE` path — Mode B) | Per-paragraph 0-100 effectiveness + verdict |
| L5 annotation tier reasoning | `deepAnnotationService.ts` per-paragraph prompt | The 6-tier visual band classification (CRITICAL → MASTERFUL) when L5 assigns sentence anchors |

L3.75 holistic synthesis is **not** in scope — it doesn't emit numeric scores in the same calibrated sense (writerPortrait, themes, etc. are categorical). Phase 7 absorbs L3.75 anyway.

L6 coaching is **not** in scope — it's delivery, not scoring.

## 4. Approach — static exemplar block, cached

A single shared exemplar block per scoring scale, injected at the top of the relevant user-prompt structure with `cacheBreakpoint: true` (mirrors L4 unified-cache pattern). Same block byte-identical across all calls per scale, so the cache hits after the first paragraph.

```
CALIBRATION EXEMPLARS — read these before assigning any score.

These are anchored examples from the corpus. The score in the
header is the calibrated truth from the L5_FEEDBACK_REDESIGN
exemplar set. Calibrate your own assignments against the bands
these exemplars define.

—————
SCORE 95 (exceptional) — {exemplar prose, 60-120 words}
WHY 95 not 90: {one sentence}
WHY 95 not 100: {one sentence}

SCORE 80 (strong) — {exemplar prose}
WHY 80 not 85: {one sentence}
WHY 80 not 75: {one sentence}

SCORE 70 (functional, middle of the load-bearing band) — {exemplar prose}
WHY 70 not 75: {one sentence}
WHY 70 not 65: {one sentence}

SCORE 55 (functional, low edge) — {exemplar prose}
WHY 55 not 60: {one sentence}
WHY 55 not 50: {one sentence}

SCORE 35 (critical) — {exemplar prose}
WHY 35 not 40: {one sentence}
WHY 35 not 30: {one sentence}
—————

When scoring, ask: "is this passage closer to the 70 anchor or the
80 anchor?" Pick the closer anchor's band and adjust ±5 within it.
Avoid bunching at 65-75 unless the passage genuinely sits there.
```

Five anchors per scale × ~80-120 words each + WHY lines = ~600-1000 tokens cached per scoring layer.

## 5. Exemplar selection rules

Per layer, the 5 anchors come from:

**L3.5 sentence effectiveness** — single-sentence exemplars from `MOVE_EXCERPTS` filtered to short-form moves (transitions, sentence rewrites, openings). Each anchor is a *sentence*, scored against its surrounding paragraph context.

**L4 ScoreMatrix paragraph** — paragraph-length exemplars from `MOVE_EXCERPTS` filtered to paragraph-scope moves (paragraph rewrites, structural moves). Each anchor is a paragraph in context.

**L5 annotation tier reasoning** — sentence exemplars *plus* the 6-tier band label. Reuses the L3.5 set, just re-tagged with tier (`<40 critical`, `40-54 needs_work`, etc. per `sentenceTier.ts`).

Selection priority: pick exemplars that **disagree visibly** with adjacent bands. The point is to anchor the boundaries (where the LLM struggles), not to show middle-of-band cases.

## 6. Where the block lives in each prompt

| Layer | Insertion point | Cache lever |
|---|---|---|
| L3.5 `analysisPass.ts` | New `userPromptBlocks` entry **before** the per-paragraph prompt. System prompt unchanged. | `cacheBreakpoint: true` on the exemplar block |
| L4 ScoreMatrix (unified-cache, Mode B) | Appended to `buildL4UnifiedSharedPrefix()` so the existing cached prefix grows; same `cacheBreakpoint: true` already in place at `crystallizer.ts:?` | Existing breakpoint |
| L5 `deepAnnotationService.ts` | Appended to the existing `sharedContext` block (line 2015, already `cacheBreakpoint: true`) | Existing breakpoint |

Pattern is consistent: leverage existing cache breakpoints; don't create new round-trips.

## 7. Cost impact

| Layer | Block size (est) | First-call cache_write | Subsequent calls cache_read | Per-essay marginal cost |
|---|---|---|---|---|
| L3.5 | ~800 tokens | +$0.003 | $0.00 (cached) | +$0.003 / essay |
| L4 unified-cache | ~900 tokens | +$0.0034 (rolls into shared prefix) | $0.00 | +$0.0034 / essay |
| L5 | ~700 tokens | +$0.0026 | $0.00 (cached across N paragraphs) | +$0.0026 / essay |
| **Total per cold-start** | | | | **~+$0.009 / essay** |

Well under the audit's $0.02–0.04 estimate — caching makes the cost negligible.

## 8. Risks

**R1 — Anchoring bias.** Exemplars can pull all scores toward themselves. Mitigation: cover the full band (35/55/70/80/95 — not just the middle). Pick exemplars that visibly *disagree* with adjacent bands so the LLM internalizes the distance, not the centroid.

**R2 — Drift over essay types.** A "70" in a Common App personal statement isn't a "70" in a PIQ. Mitigation: parametrize the exemplar block by `EssayType` if the regen shows drift. Start single-set, fork if needed.

**R3 — Exemplar quality.** If the 53 anchored exemplars are themselves miscalibrated, we propagate the error. Mitigation: spot-check 5 exemplars per scale against Tue's gut-check before shipping. Reject any that read off-anchor.

**R4 — Cache prefix instability.** If we accidentally make the exemplar block dynamic (different across calls), cache reads stay zero. Mitigation: hard-code the exemplar block as a module-level constant string. No template substitution, no dynamic ordering.

## 9. Acceptance gate (Phase 6 regen)

- **Cache reads non-zero** on L4 calls 2+3 and L5 paragraph calls 2+N (proves the block is stable).
- **Within-paragraph std dev increases** vs the May 5 baseline (proves the anchors broke the clustering). Target: paragraph sentence-score std dev ≥ 8 (was ~4-5 in clustered runs).
- **Score distribution flattens across the 0-100 range** — at least 5% of sentences score <55 or >85 (was <2% in clustered runs).
- **Manual spot check** on 5 fixture sentences: score moves toward anchor agreement, not random scatter.

Negative gates (auto-rollback signal):
- Avg score shifts >5 points in either direction (whole-pipeline drift).
- Phase B output growth >15% from the additional prompt context.

## 10. Implementation notes (for Stage 2)

- Module: `src/services/essayIntelligence/analysis/calibrationExemplars.ts` (new). Exports per-scale constant strings (`L35_SENTENCE_EXEMPLARS`, `L4_PARAGRAPH_EXEMPLARS`, `L5_TIER_EXEMPLARS`).
- Exemplar source: read `MOVE_EXCERPTS` from existing corpus folder (file path TBD during implementation — `corpusRetrievalBlocks.ts` should know). At build time, select the 5 anchors per scale and inline as constants. No runtime retrieval — that's a Phase 8 corpus-master concern.
- No new types. No schema changes.
- Ships unflagged (additive cached prompt growth, no behavior change to existing consumers).

## 11. Migration / rollback

- Pure additive — no schema, no API. Rollback = revert the commit.
- Cache stays warm on rollback because the per-call hash changes; this is a one-cold-start cost not a permanent disruption.

## 12. Open question for Tue (Stage 2 gate)

Do exemplars get parametrized by `EssayType` from day 1 (3 sets × 3 scales = 9 exemplar blocks), or single-set with EssayType fork deferred to a later iteration?

Recommendation: single-set first. The intra-band calibration win is biggest; EssayType drift is a second-order issue. If Phase 6 regen shows the drift, fork.

---

## CORRECTIONS — appended 2026-05-24 (HEAD verification)

Pre-implementation HEAD grep found 2 of the 3 scoped layers already shipped. The same `verify-subagent-claims-at-head` failure mode that caught the audit's C1/C2 errors applies here too — the design was written reading the cost-recovery audit, not HEAD.

### CAL-C1 — L3.5 sentence-effectiveness calibration: ALREADY SHIPPED
- **Design claim**: §3 lists L3.5 as a target; §6 proposes inserting an exemplar block "before the per-paragraph prompt" via `userPromptBlocks`.
- **Reality at HEAD**: `analysisPass.ts:469-498` already contains a full anchor block — SCORE 38/52/72/88/78 with WHY explanations + the inter-essay tier distribution table at `:571+`. This is what the design proposes, already present in the system prompt.
- **Note**: `scoreMatrixAnchors.ts:15` explicitly cites these anchors as "the gold standard" that L4's anchor block models itself on. The design author appears to have missed this even while quoting the codebase.

### CAL-C2 — L4 ScoreMatrix paragraph calibration: ALREADY SHIPPED
- **Design claim**: §3 lists L4 ScoreMatrix as a target; §6 proposes appending exemplars to `buildL4UnifiedSharedPrefix()`.
- **Reality at HEAD**: `src/services/essayIntelligence/analysis/scoreMatrixAnchors.ts` (69 lines, Port G3) exports `buildScoreMatrixAnchorsBlock()` with 3 paragraph-level exemplars (A/B/C) spanning the 0-100 range across all 4 ScoreMatrix dimensions (structural/voice/emotional/thematic). Injected at `crystallizer.ts:552, 1169, 1566` in all three L4 system-prompt builders. Block-versioned via `withPromptBlockVersion(..., 'G3_FEW_SHOT_CALIBRATION')`.

### CAL-C3 — L5 annotation tier reasoning: DESIGN-vs-CODE MISMATCH
- **Design claim**: §3 says L5 calibrates "the 6-tier visual band classification (CRITICAL → MASTERFUL) when L5 assigns sentence anchors"; §5 says "reuses the L3.5 set, just re-tagged with tier."
- **Reality at HEAD**: L5 does NOT emit any 0-100 score or tier. `deepAnnotationService.ts:945` computes `tier: effectivenessToTier(a.effectiveness)` *deterministically post-call* from L3.5's `effectiveness` field. L5's emitted fields are `priority` (1-5), `confidence` (0-1), `teachingMode`, span text — none correspond to the 0-100 scale the design proposes anchoring.
- **Conclusion**: No L5 code site to wire calibration anchors against. Either (a) redefine "L5 calibration" to target a different field (e.g., `priority` 1-5), or (b) drop the L5 piece — the deterministic tier inheritance from L3.5 means L3.5's already-shipped anchors propagate.

### Net delta after corrections
The design's "+$0.009/essay" cost target is moot — L3.5 + L4 anchor blocks are already in the cached prompts. Cache benefit is live (subject to Phase 6 regen confirmation, same C1/C2 dynamic as the audit). **Stage 2 Item 1 effectively closes with zero code changes.**

### Lesson (same as audit C1/C2)
Sub-agent design proposals must verify against HEAD before being treated as work-to-do. The "no guessing" rule applies to planning artifacts.

