# Activity Workshop Pipeline v4.3 — Comprehensive Audit & Refactor Plan

> **Date:** 2026-02-10
> **Status:** AWAITING APPROVAL
> **Scope:** Fix all 45+ audit findings across the Activity Workshop pipeline: scoring, teaching, reliability, performance, and architecture. This document synthesizes findings from three independent deep audits — reliability/bugs, output quality/scoring calibration, and performance/architecture.
> **Cost Impact:** -$0.02-0.05/run (from parallelization + dead code removal + model standardization)
> **Latency Impact:** -10-20s (from parallelizing desc+activity scoring and Stage 3+Narrative)

---

## TABLE OF CONTENTS

1. [Critical Bugs (Fix Before Next Deploy)](#phase-1-critical-bugs)
2. [Scoring Calibration & Data Integrity](#phase-2-scoring-calibration--data-integrity)
3. [Reliability & Error Handling](#phase-3-reliability--error-handling)
4. [Performance & Parallelization](#phase-4-performance--parallelization)
5. [Output Quality & Teaching Depth](#phase-5-output-quality--teaching-depth)
6. [Architecture & Dead Code Cleanup](#phase-6-architecture--dead-code-cleanup)
7. [Cost Tracking & Observability](#phase-7-cost-tracking--observability)
8. [Implementation Priority Matrix](#implementation-priority-matrix)

---

## PHASE 1: CRITICAL BUGS

### C1. Singleton Race Condition on Stage 2 Cost Accumulators
**Severity:** CRITICAL | **File:** `stage2ConditionalTeachingService.ts:90-91,117-119`

**Problem:** `_accumulatedCost` and `_accumulatedTokens` are instance-level mutable state on a singleton service. If two users trigger the pipeline concurrently:
1. User A starts `teach()` → resets accumulators to 0
2. User B starts `teach()` → resets accumulators to 0 again, losing User A's partial data
3. Both users' `trackUsage()` calls mutate the same fields → interleaved results

At line 118-119, the reset creates a new `{ input: 0, output: 0 }` object. Any async `trackUsage` callback holding a reference to the OLD object writes to abandoned memory.

**Fix:** Replace instance-level accumulators with per-invocation local variables:
```typescript
async teach(input, storyContext, analysisContext): Promise<TeachingContext> {
  // Local accumulators — no singleton state
  const costTracker = { cost: 0, tokens: { input: 0, output: 0 } };
  // Pass costTracker to all sub-methods instead of using this._accumulated*
}
```

**Impact if not fixed:** Corrupted cost/token data for concurrent users. Teaching metadata reports wrong costs. No data loss on pipeline output, but billing and monitoring are unreliable.

---

### C2. Batch Score Count Mismatch Silently Propagates `undefined`
**Severity:** CRITICAL | **File:** `scoringOrchestrator.ts:318-321,382-385`

**Problem:** When LLM returns fewer scores than activities sent (e.g., 8 scores for 10 activities), the orchestrator at lines 318-321 iterates `descToScore.length` and indexes `descResult.scores[j]`. If `j >= descResult.scores.length`, the result is `undefined`, silently written into `descriptionScores[index]`.

Downstream, `portfolioScoringService` accesses `.totalScore` and `.breakdown` on these entries → NPE or NaN propagation into portfolio scoring, Harvard scale, and teaching.

**Fix:** Validate batch results immediately after the loop:
```typescript
const missing = descToScore.filter(d => !descriptionScores[d.index]);
if (missing.length > 0) {
  console.error(`[ScoringOrch] ${missing.length} description scores missing`);
  return { success: false, error: `Description scoring returned ${descResult.scores.length}/${descToScore.length} scores` };
}
```

**Impact if not fixed:** NPE or NaN scores propagate to portfolio scoring → invalid Harvard scale → wrong tier assignments shown to students.

---

### C3. Dead Code with Unresolvable Variable — `generateSimplifiedTeaching`
**Severity:** CRITICAL (latent) | **File:** `stage2ConditionalTeachingService.ts:559-641`

**Problem:** `generateSimplifiedTeaching()` at line 634 references `expertContext`, but this variable is NOT a parameter of the method and NOT declared in its scope. The method is currently dead code (never called), so no runtime crash occurs. TypeScript doesn't flag it because `noImplicitAny: false` treats it as implicit `any`.

If anyone re-enables this as a fallback path, it will throw `ReferenceError: expertContext is not defined`.

**Fix:** Remove the entire dead method. The individual fallback chain in `processSingleActivity()` handles retries adequately.

---

## PHASE 2: SCORING CALIBRATION & DATA INTEGRITY

### S1. Model Version Inconsistency Across Scoring Services
**Severity:** HIGH | **Files:** Multiple scoring services

**Problem:** Scoring uses a mix of model versions:
| Service | Model | Version |
|---------|-------|---------|
| `descriptionScoringService.ts` | `claude-sonnet-4-5-20250929` | Sonnet 4.5 |
| `activityScoringService.ts` | `claude-sonnet-4-20250514` | Sonnet 4.0 |
| `portfolioScoringService.ts` | `claude-sonnet-4-20250514` | Sonnet 4.0 |
| `activityTeachingLayerService.ts` | `claude-sonnet-4-20250514` | Sonnet 4.0 |
| `stage1ContextAwareAnalysisService.ts` | `claude-sonnet-4-5-20250929` | Sonnet 4.5 |
| `stage2ConditionalTeachingService.ts` | `claude-sonnet-4-5-20250929` | Sonnet 4.5 |

Description scores (Sonnet 4.5) are combined with activity scores (Sonnet 4.0) at 30%/70% weighting. If models score differently (more generous or strict), the combined score has systematic bias. This is also likely a root cause of the tier reconciliation issue (P6).

**Fix:** Standardize all scoring services to `claude-sonnet-4-5-20250929`. Update:
- `activityScoringService.ts` lines 396, 455
- `portfolioScoringService.ts` line 339
- `activityTeachingLayerService.ts` model constant

---

### S2. UX Doc Weight Inconsistencies vs Code
**Severity:** HIGH | **File:** `docs/ACTIVITY_SCORING_USER_EXPERIENCE.md`

**Problem:** The UX documentation uses WRONG weights for examples:

| Component | Code Weight (Standard) | UX Doc Examples | Difference |
|-----------|----------------------|-----------------|------------|
| Leadership | 12.5% | 20% | +7.5% |
| Commitment | 17.5% | 10% | -7.5% |

Solo activity weights in UX doc: `35/30/20/15` vs code: `34.3/28.6/17.1/20.0`.

The USAMO example (line 46-50) uses 35%/30%/20%/15%, while code enforces 34.3%/28.6%/17.1%/20.0%. The Debate example shows Leadership weighted at 1.0 (8×12.5%) in the table but 1.6 in the sum. All three example activities (Debate, Environmental Club, NHS) show wrong weights.

**Fix:** Regenerate all UX doc examples using actual code weights. Verify weighted sums are arithmetically correct.

---

### S3. Portfolio Scoring JSON Template Has Missing Comma
**Severity:** MEDIUM | **File:** `portfolioScoringService.ts:206-207`

**Problem:** In the JSON template:
```json
"storyLine": "<2-3 sentence story>"
"twoSentencePitch": "<description>"
```
Missing comma after line 206's closing quote. If LLM copies the template literally, this causes a JSON parse failure.

**Fix:** Add the comma: `"storyLine": "<...>",`

---

### S4. `diagnosticFlags` Requested in Prompt but Not in Types
**Severity:** MEDIUM | **File:** `descriptionScoringService.ts:447-453`

**Problem:** Description scoring prompt requests `diagnosticFlags` in JSON output, but `DescriptionScore` type (types.ts lines 105-123) has no such field. `normalizeScoreData` at line 700 silently drops it. LLM wastes tokens generating data that's discarded.

**Fix:** Either add `diagnosticFlags` to the type and capture it, or remove the field from the prompt to save tokens.

---

### S5. "Remove vs. Never Remove" Contradictory Guidance
**Severity:** MEDIUM | **Files:** Multiple

**Problem:**
- `activityTeachingLayerService.ts:397`: "NEVER tell a student to remove or minimize an activity."
- `expertSystemPrompts.ts:319-325`: "THE REMOVE-TO-IMPROVE TEST" — tells LLM to recommend removal
- `expertCounselorKnowledgeBase.ts:1019-1033`: Full "removeToImprove" guidance with "whenToRemove" criteria

The scoring teaching layer forbids removal, but expert prompts in Stage 2 teaching recommend it. Both are in the same pipeline.

**Fix:** Choose one policy and enforce consistently. Recommendation: Allow "remove to improve" guidance ONLY in Stage 3 synthesis (portfolio-level advice), never in per-activity teaching (Stage 2). A student asked to remove an activity they're proud of feels attacked.

---

### S6. Merge Step (Step 7) Has Overly Narrow Conditions
**Severity:** MEDIUM | **File:** `stage2ConditionalTeachingService.ts:346-349`

**Problem:** Scoring rewrite replaces Stage 2 rewrite ONLY when ALL conditions are met:
(a) scoringRewrite exists, (b) scoringRewrite ≤ charLimit, (c) scoringRewrite ≠ original, (d) Stage 2 rewrite > charLimit.

This means: if Stage 2 produces a WITHIN-LIMIT rewrite and scoring produces a BETTER within-limit rewrite, the scoring rewrite is discarded. The better rewrite never reaches the student.

**Fix:** Add a quality comparison when both are within limit. Prefer the scoring rewrite when it has better specificity scores or more concrete metrics.

---

## PHASE 3: RELIABILITY & ERROR HANDLING

### R1. Promise.all Sub-Batches — One Failure Crashes All of Stage 1
**Severity:** HIGH | **File:** `stage1ContextAwareAnalysisService.ts:106-120`

**Problem:** Inner `Promise.all` for sub-batches has no per-chunk error handling. If ONE sub-batch fails (LLM timeout), the entire Stage 1 fails — losing results from successful sub-batches AND completed scoring.

The scoring path has its own try/catch (returns `null` on failure), so it's isolated. But sub-batches are not.

**Fix:** Use `Promise.allSettled` for inner sub-batch promises:
```typescript
const subBatchSettled = await Promise.allSettled(
  chunks.map((chunk, i) => batchActivityAnalysisService.analyzeSubBatch(subInput, profilerResult))
);
const successful = subBatchSettled.filter(r => r.status === 'fulfilled').map(r => r.value);
const failed = subBatchSettled.filter(r => r.status === 'rejected');
if (failed.length > 0) {
  console.warn(`[Stage1] ${failed.length}/${chunks.length} sub-batches failed`);
}
// Continue with partial results if ≥50% succeeded
```

---

### R2. Greedy JSON Regex in Teaching Layer Parser
**Severity:** HIGH | **File:** `activityTeachingLayerService.ts:728`

**Problem:** `content.match(/\{[\s\S]*\}/)` is greedy — matches from FIRST `{` to LAST `}` in the entire response. If LLM includes preamble text with curly braces before the JSON, this captures garbage.

Other services use `parseClaudeJSON()` which has robust extraction. The teaching layer does not.

**Fix:** Replace with `parseClaudeJSON()` (already in the codebase) or use balanced-brace matching.

---

### R3. Hard Truncation Produces Incoherent Rewrite Text
**Severity:** HIGH | **File:** `activityTeachingLayerService.ts:837-847`

**Problem:** `transformation.rewrite.suggested.substring(0, charLimit - 3) + '...'` can cut mid-word, producing text like `"Led team of 12 to bui..."` shown to students as a "suggested rewrite."

**Fix:** Truncate at sentence or word boundary:
```typescript
const truncated = text.substring(0, charLimit - 3);
const lastSentenceEnd = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('!'));
return lastSentenceEnd > charLimit * 0.6
  ? truncated.substring(0, lastSentenceEnd + 1)
  : truncated.substring(0, truncated.lastIndexOf(' ')) + '...';
```

---

### R4. Stage 2 Object Reference Mutation on Async Token Accumulator
**Severity:** MEDIUM | **File:** `stage2ConditionalTeachingService.ts:91,118-119`

**Problem:** At line 118-119, reset creates a new `{ input: 0, output: 0 }` object. Any async `trackUsage` callback holding a reference to the OLD object writes to abandoned memory — token count is lost.

**Fix:** Subsumed by C1 — use local accumulators per invocation.

---

### R5. Sparse Array Holes from Cache-Miss Indexing
**Severity:** MEDIUM | **File:** `scoringOrchestrator.ts:279-327`

**Problem:** `descriptionScores[]` and `activityScores[]` are initialized as empty arrays, then populated at specific indices from cache hits and batch results. Holes between filled indices are `undefined`.

**Fix:** Pre-initialize arrays: `new Array(count).fill(undefined)`, then validate no holes remain after population.

---

### R6. `analysisActivity.tier` — Nonexistent Property Access
**Severity:** MEDIUM | **File:** `stage1ContextAwareAnalysisService.ts:203`

**Problem:** `const analysisTier = analysisActivity.classification?.tier || analysisActivity.tier;` — `ActivityAnalysis` has no top-level `tier` property. The fallback is always `undefined`, working by accident.

**Fix:** Remove dead fallback: `const analysisTier = analysisActivity.classification?.tier;`

---

### R7. `SynthesisContext.scoringSummary` Defined but Never Populated
**Severity:** MEDIUM | **File:** `types.ts`, `stage3PortfolioSynthesisService.ts`

**Problem:** `SynthesisContext` type defines optional `scoringSummary` field. Stage 3 never populates it. Downstream consumers always see `undefined`.

**Fix:** Either populate from `AnalysisContext.scoring` data passed to Stage 3, or remove the dead type field.

---

### R8. Unvalidated LLM `activityTransformations` in Teaching Layer
**Severity:** LOW | **File:** `activityTeachingLayerService.ts:744-748`

**Problem:** `parsed.activityTransformations` is taken directly from JSON-parsed LLM output with no per-field validation. Malformed objects (missing `activityId`, `rewrite.suggested`) cause downstream NPEs.

**Fix:** Add normalization pass similar to `normalizeStrategicPriorities`.

---

## PHASE 4: PERFORMANCE & PARALLELIZATION

### P1. Parallelize Description + Activity Scoring (HIGHEST ROI)
**Severity:** HIGH | **File:** `scoringOrchestrator.ts:276-399`
**Estimated improvement:** -5-10s latency

**Problem:** Description scoring (Step 1) runs sequentially before Activity scoring (Step 2). These are completely independent — description scoring evaluates craft quality while activity scoring evaluates inherent quality. Only Portfolio scoring (Step 3) needs both.

**Current:** `Description (~5-10s) → Activity (~5-10s) → Portfolio (~5-10s)`
**Proposed:** `[Description + Activity parallel] (~5-10s) → Portfolio (~5-10s)`

**Fix:**
```typescript
// Replace sequential Steps 1-2 with:
const [descriptionScores, activityScores] = await Promise.all([
  this.scoreDescriptions(descriptionInputs, ...),
  this.scoreActivities(activityInputs, ...)
]);
// Then continue with Step 3 (portfolio) as before
```

---

### P2. Parallelize Stage 3 + Final Narrative
**Severity:** HIGH | **File:** `activityWorkshopService.ts:451-488`
**Estimated improvement:** -3-5s latency

**Problem:** Stage 3 (Haiku, ~3-5s) and Final Narrative (Sonnet, ~8-15s) run sequentially. Both consume `(input, storyContext, analysisContext, teachingContext)` and neither depends on the other's output.

**Fix:**
```typescript
const [stage3Result, narrativeResult] = await Promise.all([
  stage3Service.synthesize(input, storyContext, analysisContext, teachingContext),
  portfolioNarrativeService.analyzePortfolio(input, storyContext, analysisContext, teachingContext)
]);
```

---

### P3. Quick Encouragements Can Overlap with Deep Teaching
**Severity:** MEDIUM | **File:** `stage2ConditionalTeachingService.ts:243-253`
**Estimated improvement:** ~3-5s latency

**Problem:** Quick encouragements (Step 3) wait until all deep+medium teaching (Step 2) completes. They're independent of deep teaching results.

**Fix:** Start quick encouragements in parallel with Step 2 teaching calls.

---

### P4. Stage 2 Timeouts Designed for Batch, Not Individual Calls
**Severity:** MEDIUM | **File:** `stage2ConditionalTeachingService.ts`

**Problem:** Timeout formula `180000 + (activityIds.length * 60000)` = 3-8 minutes per "batch". But individual activities now run in parallel via `processSingleActivity()`, each a single LLM call that should complete in 30-60s.

**Fix:** Set per-activity timeout of 90s, not batch-based formula.

---

### P5. Description Scoring System Prompt Is ~7000 Tokens
**Severity:** MEDIUM | **File:** `descriptionScoringService.ts:102-463`

**Problem:** System prompt includes full rubric, 3 calibration examples, 7 activity-type format guides (~200 lines). Sent every call. At ~$0.021 just for the system prompt at Sonnet pricing.

**Fix:**
1. Ensure prompt caching is enabled (system prompt is static per platform)
2. Trim activity-type format guides to only relevant categories detected in the portfolio
3. Reduce calibration examples from 3 to 2

---

## PHASE 5: OUTPUT QUALITY & TEACHING DEPTH

### Q1. Description Scoring System Prompt Could Be More Calibrated
**Severity:** MEDIUM | **Files:** `descriptionScoringService.ts`

**Problem:** The 7 activity-type format guides include examples for all categories (STEM Research, Athletics, Arts, etc.) even when a student's portfolio only contains 2-3 categories. This wastes tokens and potentially confuses the model.

**Fix:** Detect activity categories from the input, inject only relevant format guides. This both saves tokens and focuses the model's attention.

---

### Q2. Teaching Quality Validation Exists But Isn't Enforced
**Severity:** MEDIUM | **File:** `stage2ConditionalTeachingService.ts:2475-2526`

**Problem:** `validateKnowledgeApplication()` is defined (checks Sara Harberson references, benchmark usage, before/after examples, celebrations) but its return value is never used to trigger re-generation or flagging. It's purely diagnostic.

**Fix:** Use validation results to:
1. Flag low-quality teachings in the output metadata
2. Optionally trigger a retry with a more explicit prompt for the worst offenders
3. At minimum, log validation failures at WARN level for monitoring

---

### Q3. Expert Context Assembly Called 3 Times with Identical Inputs
**Severity:** LOW | **Files:** `stage1:402`, `stage2:142`, `stage2:419`

**Problem:** `assembleExpertContext()` is called with virtually identical parameters in Stage 1 and Stage 2 (and again in dead code at Stage 2 line 419). It's a heuristic function (no API cost), but represents unnecessary computation and code confusion.

**Fix:** Compute once in Stage 1, pass through to Stage 2 via the pipeline handoff. Remove the call at line 419 (dead code, see E2).

---

## PHASE 6: ARCHITECTURE & DEAD CODE CLEANUP

### E1. Legacy v3.0 Batch Services + `USE_4_STAGE_PIPELINE` Flag
**Severity:** HIGH | **File:** `activityWorkshopService.ts`

**Problem:**
- Lines 67-69: Imports `batchActivityAnalysisService` and `batchActivityTeachingService` (legacy v3.0)
- Line 78: `const USE_4_STAGE_PIPELINE = true;` — hardcoded, never changes
- Lines 605-626, 651-653, 716-718: Dead `else` branches that can never execute

**Fix:** Remove the flag, legacy imports, and all dead branches. ~250+ lines of dead code.

---

### E2. Dead `generateBatchTeaching()` Method (~100+ lines)
**Severity:** HIGH | **File:** `stage2ConditionalTeachingService.ts:404-500+`

**Problem:** Leftover from pre-v4.2 batch teaching approach. Redundantly calls `assembleExpertContext()`, builds knowledge contexts already done elsewhere. Never called from `teach()`.

**Fix:** Delete the entire method.

---

### E3. Version String Inconsistencies (4 Different Values)
**Severity:** HIGH | **File:** `activityWorkshopService.ts`

**Problem:**
- Line 2 header: "v4.2 PIPELINE"
- Line 75: `const VERSION = '4.2.0'`
- Line 380 log: "[ActivityWorkshop v4.3]"
- Line 525 result: `version: '4.3.0'`

**Fix:** `const VERSION = '4.3.0'` and reference it everywhere.

---

### E4. Legacy Type Conversion Functions (~140 lines)
**Severity:** MEDIUM | **File:** `activityWorkshopService.ts:206-360`

**Problem:** `convertToLegacyAnalysis()` and `convertToLegacyTeaching()` convert v4.0 outputs to v3.0 types. `convertToLegacyAnalysis` is essentially a no-op (types extend). These feed the `analysis` and `teaching` fields in pipeline result.

**Fix:** Audit frontend usage. If `stage1`/`stage2` are consumed directly, remove legacy conversion.

---

### E5. Duplicate Type Definitions Across Files
**Severity:** LOW | **Files:** `types.ts`, `portfolioNarrativeService.ts`

**Problem:** `NarrativeElevation`, `NarrativeThread`, `SpikePresentation`, `GapFraming`, `PortfolioNarrative` defined in both files.

**Fix:** Remove duplicates from `portfolioNarrativeService.ts`, import from `types.ts`.

---

### E6. `callClaude` Calling Convention Inconsistency
**Severity:** LOW | **Files:** Various

**Problem:** Two calling conventions used: object style `callClaude({ model, systemPrompt, userPrompt })` vs positional style `callClaude(prompt, { model, systemPrompt })`.

**Fix:** Standardize on object style across all files.

---

## PHASE 7: COST TRACKING & OBSERVABILITY

### O1. Pipeline Returns Hardcoded Cost Estimates, Not Actual Costs
**Severity:** HIGH | **File:** `activityWorkshopService.ts:131-148,603`

**Problem:** `createCostTracking()` uses static formulas based on activity count. The actual token usage from Stages 0-3 and scoring is never aggregated into returned cost data. Users/billing see estimated costs that diverge from actual API spend.

The pipeline already HAS real cost data:
- Stage 2: `_accumulatedCost`
- Scoring: `tokensUsed` per call
- Stage 0/3: response usage

None flows into cost tracking.

**Fix:** After pipeline completes, aggregate actual usage:
```typescript
costTracking: {
  analysisCost: stage0Cost + stage1Cost + scoringCost,
  teachingCost: stage2Cost + narrativeCost,
  totalCost: sum_of_all,
  tokensUsed: { analysis: {...}, teaching: {...} }
}
```

---

### O2. Stage 1 Cost Tracking Only Captures Story Adjustment Call
**Severity:** HIGH | **File:** `stage1ContextAwareAnalysisService.ts:71,224-228,295`

**Problem:** Stage 1 makes 5+ LLM calls (profiler, N sub-batches, 3 scoring calls, story adjustment), but `_lastUsage` only stores the story adjustment call. Cost reports understate Stage 1 by an order of magnitude (~$0.005 reported vs ~$0.10-0.20 actual).

**Fix:** Accumulate usage from all LLM calls. Create per-invocation cost tracker (consistent with C1 fix pattern).

---

## IMPLEMENTATION PRIORITY MATRIX

### Tier 1: Fix Before Next Deploy (Day 1)
| ID | Finding | Est. Lines Changed | Risk |
|----|---------|-------------------|------|
| C1 | Stage 2 singleton race condition | ~30 | Corrupted cost data |
| C2 | Batch score count mismatch | ~15 | NPE / NaN propagation |
| C3 | Dead code with unresolvable variable | ~80 (delete) | Latent crash |
| R1 | Promise.all sub-batches one-failure-crashes-all | ~20 | Stage 1 fragility |

### Tier 2: High-Impact Improvements (Day 2-3)
| ID | Finding | Est. Lines Changed | Benefit |
|----|---------|-------------------|---------|
| P1 | Parallelize desc+activity scoring | ~25 | -5-10s latency |
| P2 | Parallelize Stage 3 + Narrative | ~15 | -3-5s latency |
| S1 | Standardize model versions to Sonnet 4.5 | ~8 | Scoring consistency |
| E1 | Remove dead v3.0 code + USE_4_STAGE_PIPELINE | ~250 (delete) | Code clarity |
| E2 | Remove dead generateBatchTeaching() | ~100 (delete) | Code clarity |
| E3 | Fix version string inconsistencies | ~5 | Correctness |
| R2 | Fix greedy JSON regex in teaching layer | ~10 | Parse reliability |
| R3 | Sentence-boundary truncation for rewrites | ~15 | Output quality |

### Tier 3: Quality & Calibration (Day 4-5)
| ID | Finding | Est. Lines Changed | Benefit |
|----|---------|-------------------|---------|
| S2 | Fix UX doc weight inconsistencies | ~60 | Documentation accuracy |
| S3 | Fix missing comma in portfolio scoring template | ~1 | JSON reliability |
| S4 | Handle diagnosticFlags (add to type or remove from prompt) | ~10 | Token savings |
| S5 | Resolve remove-vs-never-remove contradiction | ~20 | Consistent guidance |
| S6 | Expand merge step conditions for within-limit rewrites | ~20 | Better rewrites |
| O1 | Wire actual costs into pipeline return | ~40 | Cost visibility |
| O2 | Stage 1 cost tracking across all LLM calls | ~30 | Cost accuracy |

### Tier 4: Cleanup & Polish (Day 6+)
| ID | Finding | Est. Lines Changed | Benefit |
|----|---------|-------------------|---------|
| R4 | (Subsumed by C1) | — | — |
| R5 | Pre-initialize sparse arrays | ~10 | Defensive coding |
| R6 | Remove dead property access | ~3 | Code clarity |
| R7 | Populate or remove scoringSummary | ~15 | Type cleanliness |
| R8 | Validate LLM activityTransformations | ~25 | Parse safety |
| P3 | Parallel quick encouragements | ~10 | Minor latency |
| P4 | Fix Stage 2 timeout formula | ~5 | Appropriate timeouts |
| P5 | Trim description scoring prompt | ~30 | Token savings |
| Q1 | Category-filtered format guides | ~40 | Token savings |
| Q2 | Enforce teaching quality validation | ~25 | Quality monitoring |
| Q3 | Expert context computed once, passed through | ~15 | CPU savings |
| E4 | Audit + remove legacy type conversion | ~140 (delete) | Code reduction |
| E5 | Remove duplicate type definitions | ~30 (delete) | DRY |
| E6 | Standardize callClaude convention | ~20 | Consistency |

---

## CRITICAL PATH ANALYSIS

### Current Pipeline Timing (10 activities):
```
Stage 0:     ~2-3s (Haiku)
Stage 1:     max(sub-batches ~20-30s, scoring ~15-25s) + story adj ~5-8s = ~30-43s
Stage 2:     parallel teaching ~15-30s + quick enc ~3-5s + scoring teaching ~10-15s = ~28-50s
Stage 3:     ~3-5s (Haiku)
Narrative:   ~8-15s (Sonnet)
TOTAL:       ~71-116s → real-world ~5-7 min (API queueing overhead)
```

### After Parallelization Fixes (P1, P2):
```
Stage 0:     ~2-3s
Stage 1:     max(sub-batches ~20-30s, max(desc, act) ~5-10s + port ~5-10s) + story ~5-8s = ~30-38s
Stage 2:     parallel teaching ~15-30s + max(quick enc, scoring teaching) ~10-15s = ~25-45s
[Stage 3 + Narrative in parallel]:  max(~3-5s, ~8-15s) = ~8-15s
THEORETICAL: ~65-101s → real-world ~4.5-6 min
SAVINGS:     ~10-20s reduction
```

---

## AFFECTED FILES SUMMARY

| File | Changes | Findings |
|------|---------|----------|
| `activityWorkshopService.ts` | Heavy | E1, E3, E4, O1 |
| `stage1ContextAwareAnalysisService.ts` | Medium | R1, R6, O2, Q3 |
| `stage2ConditionalTeachingService.ts` | Heavy | C1, C3, E2, R4, S6, P3, P4, Q2 |
| `stage3PortfolioSynthesisService.ts` | Light | R7 |
| `scoringOrchestrator.ts` | Medium | C2, P1, R5 |
| `descriptionScoringService.ts` | Light | S4, P5, Q1 |
| `activityScoringService.ts` | Light | S1 (model update) |
| `portfolioScoringService.ts` | Light | S1 (model update), S3 |
| `activityTeachingLayerService.ts` | Medium | R2, R3, R8, S1 |
| `types.ts` | Light | R7, S4 |
| `expertSystemPrompts.ts` | Light | S5 |
| `portfolioNarrativeService.ts` | Light | E5 |
| `docs/ACTIVITY_SCORING_USER_EXPERIENCE.md` | Medium | S2 |

---

## TESTING STRATEGY

### Existing Tests
- `tests/test-full-pipeline-e2e-output.ts` — Full pipeline E2E (~$0.36-0.53, ~5-10 min)
- Verify before/after each phase

### New Tests Needed
1. **Concurrent race condition test** (C1): Two simultaneous `teach()` calls, verify independent cost tracking
2. **Partial batch score test** (C2): Mock LLM returning fewer scores than requested, verify graceful failure
3. **Sub-batch partial failure test** (R1): Mock one sub-batch timeout, verify other results preserved
4. **Parallelization regression test** (P1, P2): Verify output is identical before/after parallelization
5. **Rewrite truncation test** (R3): Test boundary cases for sentence-boundary truncation

---

*This audit synthesizes findings from three independent deep reviews: reliability/bugs, output quality/scoring calibration, and performance/architecture. Total findings: 45+ across 7 phases.*
