# Activity Workshop Pipeline v4.3 — Implementation Swarm Prompt

> **Purpose:** This document is the complete implementation prompt for a Claude Code Agent Teams swarm session.
> **How to use:** Start Claude Code with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude`, then paste this entire document.
> **Source:** `docs/ACTIVITY_WORKSHOP_AUDIT_PLAN.md` — 45+ findings from three independent deep audits.

---

## CONTEXT

You are implementing fixes for the Activity Workshop Pipeline v4.3 in the Uplift codebase. This is a 5-stage AI pipeline that analyzes college application extracurricular activities. The pipeline lives in:

```
src/services/portfolioStrategy/services/activityWorkshop/
├── activityWorkshopService.ts          # Main orchestrator (787 lines)
├── stages/
│   ├── stage0StoryDetectionService.ts  # Haiku story detection
│   ├── stage1ContextAwareAnalysisService.ts  # Parallel analysis + scoring
│   ├── stage2ConditionalTeachingService.ts   # Parallel teaching (~2500 lines)
│   ├── stage3PortfolioSynthesisService.ts    # Haiku synthesis
│   └── portfolioNarrativeService.ts          # Final narrative
├── scoring/
│   ├── scoringOrchestrator.ts          # Master scoring pipeline
│   ├── descriptionScoringService.ts    # 5-dimension description scoring
│   ├── activityScoringService.ts       # 5-component activity scoring
│   ├── portfolioScoringService.ts      # Portfolio + Harvard scale
│   ├── activityTeachingLayerService.ts # Teaching transformations
│   ├── scoringCacheService.ts          # Per-activity caching
│   └── types.ts                        # Scoring types
├── expertCounselorKnowledgeBase.ts     # Expert guidance data
├── expertSystemPrompts.ts              # System prompt templates
├── knowledgeAssemblyService.ts         # Knowledge context builder
└── types.ts                            # Pipeline types
```

**Full audit plan:** `docs/ACTIVITY_WORKSHOP_AUDIT_PLAN.md`
**Pipeline context doc:** `docs/ACTIVITY_WORKSHOP_PIPELINE_CONTEXT.md`

**CRITICAL RULES:**
1. Run `npx tsc --noEmit` after every file change — zero TypeScript errors allowed
2. Never change types without updating all consumers
3. Preserve ALL existing behavior unless explicitly changing it
4. Test each phase independently with `npx tsx tests/test-full-pipeline-e2e-output.ts`
5. `classification.detectedCategory` NOT `classification.category` — this was a previous critical bug fix
6. Method ordering: check `family/caregiv/farm` BEFORE `work/employ/job` for compound categories
7. `StoryContext` fields: `primaryTheme` not `centralTheme`, `secondaryThemes` not `coreStrengths`

---

## TEAMMATE 1: Critical Bug Fixes + Reliability

**You are the reliability engineer.** Your job is to fix the critical bugs and reliability issues that could cause data corruption or crashes.

### Task 1.1: Fix Stage 2 Singleton Race Condition (C1)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/stages/stage2ConditionalTeachingService.ts`

**Problem:** `_accumulatedCost` (line 90) and `_accumulatedTokens` (line 91) are singleton instance variables. Concurrent calls to `teach()` corrupt each other's data.

**Changes:**
1. **Do NOT remove** the instance variables yet (they're read in other places). Instead, modify the `teach()` method to use local accumulators:

```typescript
// In teach() method, REPLACE lines 117-119:
// OLD:
this._accumulatedCost = 0;
this._accumulatedTokens = { input: 0, output: 0 };

// NEW:
// Create local accumulators for this invocation
const localCost = { value: 0 };
const localTokens = { input: 0, output: 0 };
// Also reset instance vars for backward compatibility
this._accumulatedCost = 0;
this._accumulatedTokens = { input: 0, output: 0 };
```

2. **Modify `trackUsage`** to accept an optional local tracker parameter:
```typescript
// MODIFY trackUsage (around line 93):
private trackUsage(
  usage: { input_tokens?: number; output_tokens?: number } | undefined,
  localCost?: { value: number },
  localTokens?: { input: number; output: number }
): void {
  if (!usage) return;
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;

  // Update local trackers if provided
  if (localCost) localCost.value += cost;
  if (localTokens) {
    localTokens.input += inputTokens;
    localTokens.output += outputTokens;
  }

  // Also update instance vars for backward compat
  this._accumulatedCost += cost;
  this._accumulatedTokens.input += inputTokens;
  this._accumulatedTokens.output += outputTokens;
}
```

3. **Pass local trackers** to all `trackUsage` calls within `teach()` — search for every `this.trackUsage(` call in `processSingleActivity`, `generateQuickEncouragement`, and the scoring teaching section. Pass `localCost, localTokens` as additional args.

4. **Use local trackers** in the metadata at the end of `teach()`:
```typescript
// In the result object (around line 378-383):
teachingMetadata: {
  generatedAt: new Date().toISOString(),
  modelUsed: this.MODEL,
  tokensUsed: { ...localTokens },  // Use local, not instance
  cost: localCost.value,            // Use local, not instance
  activitiesTaught: teachingDelivered.length,
  activitiesSkipped: skippedActivities.length,
},
```

### Task 1.2: Fix Batch Score Count Mismatch (C2)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/scoring/scoringOrchestrator.ts`

**After the description scoring batch loop (around line 327), add validation:**
```typescript
// After line 327 (after the for loop that fills descriptionScores from batch):
const missingDescs = descToScore.filter(d => !descriptionScores[d.index]);
if (missingDescs.length > 0) {
  console.error(`[ScoringOrchestrator] ${missingDescs.length}/${descToScore.length} description scores missing after batch`);
  return {
    success: false,
    error: `Description scoring returned incomplete results: ${descResult.scores?.length || 0}/${descToScore.length} scores`,
  };
}
```

**After the activity scoring batch loop (around line 396), add the same validation:**
```typescript
const missingActs = actToScore.filter(d => !activityScores[d.index]);
if (missingActs.length > 0) {
  console.error(`[ScoringOrchestrator] ${missingActs.length}/${actToScore.length} activity scores missing after batch`);
  return {
    success: false,
    error: `Activity scoring returned incomplete results: ${actResult.scores?.length || 0}/${actToScore.length} scores`,
  };
}
```

### Task 1.3: Remove Dead `generateSimplifiedTeaching` Method (C3)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/stages/stage2ConditionalTeachingService.ts`

Delete the entire `generateSimplifiedTeaching` method (lines ~559-641). Search for any callers first — there should be none.

### Task 1.4: Fix Promise.all Sub-Batch Fragility (R1)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/stages/stage1ContextAwareAnalysisService.ts`

**Replace the inner Promise.all for sub-batches (around lines 106-120):**

```typescript
// OLD (around line 106-120):
const [subBatchResults, scoringResult] = await Promise.all([
  Promise.all(
    chunks.map((chunk, i) => {
      // ... sub-batch call
      return batchActivityAnalysisService.analyzeSubBatch(subInput, profilerResult);
    })
  ),
  this.runScoring(input),
]);

// NEW:
const [subBatchSettled, scoringResult] = await Promise.all([
  Promise.allSettled(
    chunks.map((chunk, i) => {
      // ... keep existing sub-batch setup code ...
      return batchActivityAnalysisService.analyzeSubBatch(subInput, profilerResult);
    })
  ),
  this.runScoring(input),
]);

// Extract successful sub-batch results
const subBatchResults = subBatchSettled
  .filter((r): r is PromiseFulfilledResult<typeof r extends PromiseFulfilledResult<infer T> ? T : never> => r.status === 'fulfilled')
  .map(r => r.value);

const failedBatches = subBatchSettled.filter(r => r.status === 'rejected');
if (failedBatches.length > 0) {
  console.warn(`[Stage1] ${failedBatches.length}/${chunks.length} sub-batches failed`);
  for (const failed of failedBatches) {
    if (failed.status === 'rejected') {
      console.error(`[Stage1] Sub-batch failure:`, failed.reason);
    }
  }
}

// Fail completely only if ALL sub-batches failed
if (subBatchResults.length === 0) {
  throw new Error(`All ${chunks.length} sub-batches failed`);
}
```

**IMPORTANT:** The existing code after this point expects `subBatchResults` to be an array of sub-batch results. The refactored version produces the same shape (array of results) but may have fewer entries. Make sure the merge logic downstream handles partial results (it likely already does since it iterates over whatever results are available).

### Task 1.5: Fix Greedy JSON Regex (R2)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/scoring/activityTeachingLayerService.ts`

**Find line ~728 (the `parseTeachingResponse` method):**
```typescript
// OLD:
const jsonMatch = content.match(/\{[\s\S]*\}/);

// NEW: Use parseClaudeJSON if available, otherwise use last-match approach
```

Check if `parseClaudeJSON` is importable from `../../../commonAppWorkshop/utils/jsonParser`. If yes:
```typescript
import { parseClaudeJSON } from '../../../commonAppWorkshop/utils/jsonParser';
// ... in parseTeachingResponse:
const parsed = parseClaudeJSON(content);
```

If not easily importable, replace the regex:
```typescript
// Extract last complete JSON object (most reliable for LLM responses)
let depth = 0;
let start = -1;
let lastValidJson = '';
for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') {
    if (depth === 0) start = i;
    depth++;
  } else if (content[i] === '}') {
    depth--;
    if (depth === 0 && start >= 0) {
      lastValidJson = content.substring(start, i + 1);
    }
  }
}
const jsonMatch = lastValidJson ? [lastValidJson] : null;
```

### Task 1.6: Fix Hard Truncation (R3)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/scoring/activityTeachingLayerService.ts`

**Find `validateRewrites` method (around line ~837-847). Replace the truncation logic:**

```typescript
// OLD:
transformation.rewrite.suggested = transformation.rewrite.suggested.substring(0, charLimit - 3) + '...';

// NEW:
const text = transformation.rewrite.suggested;
const truncated = text.substring(0, charLimit);
// Try to cut at sentence boundary
const lastSentenceEnd = Math.max(
  truncated.lastIndexOf('. '),
  truncated.lastIndexOf('! '),
  truncated.lastIndexOf('; ')
);
if (lastSentenceEnd > charLimit * 0.6) {
  transformation.rewrite.suggested = truncated.substring(0, lastSentenceEnd + 1);
} else {
  // Fall back to word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  transformation.rewrite.suggested = lastSpace > charLimit * 0.5
    ? truncated.substring(0, lastSpace)
    : truncated.substring(0, charLimit - 3) + '...';
}
transformation.rewrite.characterCount = transformation.rewrite.suggested.length;
```

### Verification:
After all changes, run:
```bash
npx tsc --noEmit
```
Ensure zero errors.

---

## TEAMMATE 2: Performance & Parallelization

**You are the performance engineer.** Your job is to parallelize independent operations and remove bottlenecks.

### Task 2.1: Parallelize Description + Activity Scoring (P1)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/scoring/scoringOrchestrator.ts`

**Current structure (around lines 276-399):**
```
Step 1: Description scoring (lines 276-337) — sequential
Step 2: Activity scoring (lines 338-399) — sequential after Step 1
Step 3: Portfolio scoring (lines 400+) — needs both Step 1 and 2
```

**Refactor:** Extract the cache-check + scoring logic for descriptions and activities into helper methods, then run them in parallel:

1. **Create two helper methods:**
```typescript
private async scoreDescriptionsWithCache(
  descriptionInputs: Array<{ id: string; input: DescriptionScoringInput }>,
  sessionId: string,
  enableCache: boolean,
  forceFresh: boolean
): Promise<{ scores: DescriptionScore[]; tokensUsed?: object; cacheResults: Map<string, boolean> }> {
  // Move lines 276-337 (Step 1) here
  // Return { scores: descriptionScores, tokensUsed, cacheResults: descriptionCacheResults }
}

private async scoreActivitiesWithCache(
  activityInputs: Array<{ id: string; input: ActivityScoringInput }>,
  input: ScoringInput,
  sessionId: string,
  enableCache: boolean,
  forceFresh: boolean
): Promise<{ scores: ActivityScore[]; tokensUsed?: object; cacheResults: Map<string, boolean> }> {
  // Move lines 338-399 (Step 2) here
  // Return { scores: activityScores, tokensUsed, cacheResults: activityCacheResults }
}
```

2. **Replace the sequential calls with Promise.all:**
```typescript
// REPLACE Steps 1 and 2 with:
console.log(`[ScoringOrchestrator] Scoring descriptions and activities in parallel...`);
const parallelStart = Date.now();

const [descResult, actResult] = await Promise.all([
  this.scoreDescriptionsWithCache(descriptionInputs, sessionId, enableCache, forceFresh),
  this.scoreActivitiesWithCache(activityInputs, input, sessionId, enableCache, forceFresh),
]);

// Check for failures
if (!descResult) return { success: false, error: 'Description scoring failed' };
if (!actResult) return { success: false, error: 'Activity scoring failed' };

const descriptionScores = descResult.scores;
const activityScores = actResult.scores;

// Merge cache results and token usage
const descriptionCacheResults = descResult.cacheResults;
const activityCacheResults = actResult.cacheResults;
if (descResult.tokensUsed) tokensUsed.descriptionScoring = descResult.tokensUsed;
if (actResult.tokensUsed) tokensUsed.activityScoring = actResult.tokensUsed;

timing.descriptionScoringMs = Date.now() - parallelStart; // Combined timing
timing.activityScoringMs = 0; // Ran in parallel, not meaningful separately

console.log(`[ScoringOrchestrator] Parallel scoring complete in ${Date.now() - parallelStart}ms`);
```

3. **Continue with Step 3 (Portfolio Scoring) as before** — it already expects both score arrays.

### Task 2.2: Parallelize Stage 3 + Final Narrative (P2)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/activityWorkshopService.ts`

**Find Stage 3 and Narrative calls (around lines 451-488).** They should currently look like:
```typescript
// Stage 3
const synthesisResult = await stage3.synthesize(...);
// ... cost tracking ...

// Final Narrative
const narrativeResult = await portfolioNarrativeService.analyzePortfolio(...);
// ... cost tracking ...
```

**Replace with:**
```typescript
// Stage 3 + Final Narrative — run in parallel (independent inputs)
console.log(`[ActivityWorkshop v4.3] Running Stage 3 + Narrative in parallel...`);
const parallelStart = Date.now();

const [synthesisResult, narrativeResult] = await Promise.all([
  (async () => {
    try {
      const result = await stage3.synthesize(input, storyContext, analysisContext, teachingContext);
      return { success: true, result };
    } catch (error) {
      console.error('[Pipeline] Stage 3 failed:', error);
      return { success: false, result: null };
    }
  })(),
  (async () => {
    try {
      const result = await portfolioNarrativeService.analyzePortfolio(input, storyContext, analysisContext, teachingContext);
      return { success: true, result };
    } catch (error) {
      console.error('[Pipeline] Narrative failed:', error);
      return { success: false, result: null };
    }
  })(),
]);

console.log(`[Pipeline] Stage 3 + Narrative parallel complete in ${Date.now() - parallelStart}ms`);

// Extract results — handle partial failures
const synthesisContext = synthesisResult.success ? synthesisResult.result : /* fallback */;
const finalNarrative = narrativeResult.success ? narrativeResult.result : undefined;

// Update cost tracking from both
if (synthesisResult.success && synthesisResult.result) {
  pipelineCost.total += synthesisResult.result.metadata?.cost || 0;
}
// ... narrative cost ...
```

**IMPORTANT:** Ensure existing cost tracking and logging still works. The `pipelineCost` variable needs to accumulate costs from both parallel paths.

### Task 2.3: Standardize Model Versions (S1)

**Files to change:**
1. `scoring/activityScoringService.ts` — Find the model constant (around line 396 and 455). Change:
   ```typescript
   // OLD: 'claude-sonnet-4-20250514'
   // NEW: 'claude-sonnet-4-5-20250929'
   ```

2. `scoring/portfolioScoringService.ts` — Find model constant (around line 339). Same change.

3. `scoring/activityTeachingLayerService.ts` — Find model constant. Same change.

**Verify** that `descriptionScoringService.ts` already uses `'claude-sonnet-4-5-20250929'` (it should).

### Verification:
```bash
npx tsc --noEmit
```

---

## TEAMMATE 3: Architecture & Dead Code Cleanup

**You are the architect.** Your job is to remove dead code, fix version strings, and clean up the codebase.

### Task 3.1: Remove Dead v3.0 Code + USE_4_STAGE_PIPELINE Flag (E1)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/activityWorkshopService.ts`

1. **Remove imports** at lines 67-69 (the legacy batch services):
   ```typescript
   // DELETE these imports:
   import { batchActivityAnalysisService } from './batchActivityAnalysisService';
   import { batchActivityTeachingService } from './batchActivityTeachingService';
   ```

2. **Remove the flag** at line 78:
   ```typescript
   // DELETE:
   const USE_4_STAGE_PIPELINE = true;
   ```

3. **Remove dead `else` branches** at:
   - Lines ~605-626 (in `analyzePortfolio` — the v3.0 fallback)
   - Lines ~651-653 (in `runAnalysis`)
   - Lines ~716-718 (in `runTeaching`)

   In each case, remove the `if (USE_4_STAGE_PIPELINE)` check and keep ONLY the code that was inside the `if` block. The code becomes unconditional.

4. **Verify** no other references to `USE_4_STAGE_PIPELINE` remain:
   ```bash
   grep -r "USE_4_STAGE_PIPELINE" src/
   ```

### Task 3.2: Fix Version String Inconsistencies (E3)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/activityWorkshopService.ts`

1. **Line 2** (header comment): Change "v4.2 PIPELINE" → "v4.3 PIPELINE"
2. **Line 75**: Change `const VERSION = '4.2.0'` → `const VERSION = '4.3.0'`
3. **Line 525**: Change `version: '4.3.0'` → `version: VERSION` (use the constant)
4. **Verify** line 600 already uses `version: VERSION`

### Task 3.3: Remove Dead `generateBatchTeaching` Method (E2)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/stages/stage2ConditionalTeachingService.ts`

**NOTE:** Teammate 1 may have already done this as part of C3. If `generateSimplifiedTeaching` is already removed, check if `generateBatchTeaching` (a DIFFERENT method, starting around line 404) still exists. This is the old batch teaching method from pre-v4.2 that is never called from `teach()`.

Search for calls:
```bash
grep -n "generateBatchTeaching" src/services/portfolioStrategy/services/activityWorkshop/stages/stage2ConditionalTeachingService.ts
```

If it's only defined (not called), delete the entire method.

### Task 3.4: Remove Nonexistent Property Access (R6)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/stages/stage1ContextAwareAnalysisService.ts`

**Find line ~203:**
```typescript
// OLD:
const analysisTier = analysisActivity.classification?.tier || analysisActivity.tier;

// NEW:
const analysisTier = analysisActivity.classification?.tier;
```

### Task 3.5: Fix Missing Comma in Portfolio Scoring Template (S3)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/scoring/portfolioScoringService.ts`

**Find around line 206:**
```typescript
// OLD (missing comma):
"storyLine": "<2-3 sentence story your portfolio tells>"
"twoSentencePitch": "..."

// NEW (add comma):
"storyLine": "<2-3 sentence story your portfolio tells>",
"twoSentencePitch": "..."
```

### Task 3.6: Remove Duplicate Type Definitions (E5)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/stages/portfolioNarrativeService.ts`

Check if `NarrativeElevation`, `NarrativeThread`, `SpikePresentation`, `GapFraming`, and `PortfolioNarrative` are defined in BOTH this file and `../types.ts`.

If yes: Remove the definitions from `portfolioNarrativeService.ts` and add imports from `../types`:
```typescript
import { NarrativeElevation, NarrativeThread, SpikePresentation, GapFraming, PortfolioNarrative } from '../types';
```

**IMPORTANT:** Only do this if the type definitions are identical. If they differ, reconcile them first.

### Verification:
```bash
npx tsc --noEmit
```

---

## TEAMMATE 4: Cost Tracking & Observability

**You are the observability engineer.** Your job is to wire actual costs into the pipeline output and fix cost tracking gaps.

### Task 4.1: Wire Actual Costs into Pipeline Return (O1)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/activityWorkshopService.ts`

**Find `createCostTracking()` function (around lines 131-148).** This uses hardcoded formulas.

**Replace the cost tracking creation in `runPipeline()` (around line 524-530):**

Instead of using `createCostTracking(input.activities.length)`, build cost tracking from actual stage data:

```typescript
// After all stages complete, build actual cost tracking:
const stage0Cost = stageResult.stage0?.metadata?.cost || 0;
const stage1Cost = stageResult.stage1?.analysisMetadata?.cost || 0; // NOTE: currently understated, see O2
const stage2Cost = stageResult.stage2?.teachingMetadata?.cost || 0;
const stage3Cost = stageResult.stage3?.metadata?.cost || 0;
const narrativeCost = /* from narrative result metadata */ 0;
const scoringCost = stageResult.stage1?.scoring?.cost || 0; // if available

const actualTotalCost = stage0Cost + stage1Cost + stage2Cost + stage3Cost + narrativeCost + scoringCost;

// Use actual costs when available, fall back to estimates
const costTracking: CostTracking = {
  analysisCost: stage0Cost + stage1Cost + scoringCost,
  teachingCost: stage2Cost + stage3Cost + narrativeCost,
  totalCost: actualTotalCost > 0 ? actualTotalCost : createCostTracking(input.activities.length).totalCost,
  tokensUsed: {
    analysis: {
      input: (stageResult.stage0?.metadata?.tokensUsed?.input || 0) +
             (stageResult.stage1?.analysisMetadata?.tokensUsed?.input || 0),
      output: (stageResult.stage0?.metadata?.tokensUsed?.output || 0) +
              (stageResult.stage1?.analysisMetadata?.tokensUsed?.output || 0),
    },
    teaching: {
      input: stageResult.stage2?.teachingMetadata?.tokensUsed?.input || 0,
      output: stageResult.stage2?.teachingMetadata?.tokensUsed?.output || 0,
    },
  },
};
```

**NOTE:** Read the actual pipeline result structure carefully. The exact field paths may differ — check `types.ts` for the `StoryContext.metadata`, `AnalysisContext.analysisMetadata`, `TeachingContext.teachingMetadata`, and `SynthesisContext.metadata` shapes.

### Task 4.2: Improve Stage 1 Cost Tracking (O2)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/stages/stage1ContextAwareAnalysisService.ts`

**Problem:** `_lastUsage` (line 71) only stores the story adjustment call. The expensive sub-batch and scoring calls aren't tracked.

**Fix:**

1. **Replace `_lastUsage` with an accumulator:**
```typescript
// OLD (line 71):
private _lastUsage: { input_tokens: number; output_tokens: number } | undefined;

// NEW:
private _accumulatedUsage: { input_tokens: number; output_tokens: number } = { input_tokens: 0, output_tokens: 0 };
```

2. **Reset at the start of `analyze()`:**
```typescript
// At the beginning of analyze():
this._accumulatedUsage = { input_tokens: 0, output_tokens: 0 };
```

3. **Accumulate from the story adjustment call (around line 295):**
```typescript
// OLD:
this._lastUsage = response.usage;

// NEW:
if (response.usage) {
  this._accumulatedUsage.input_tokens += response.usage.input_tokens || 0;
  this._accumulatedUsage.output_tokens += response.usage.output_tokens || 0;
}
```

4. **Accumulate from scoring result** if it provides usage data. Check what `scoringResult` returns — if it has a `tokensUsed` field, add it:
```typescript
// After scoring completes (around line 194):
if (scoringResult?.tokensUsed) {
  // Aggregate all scoring token usage
  for (const [key, usage] of Object.entries(scoringResult.tokensUsed)) {
    if (usage && typeof usage === 'object') {
      this._accumulatedUsage.input_tokens += (usage as any).input_tokens || 0;
      this._accumulatedUsage.output_tokens += (usage as any).output_tokens || 0;
    }
  }
}
```

5. **Update metadata output (around lines 224-228):**
```typescript
// Use accumulated usage:
analysisMetadata: {
  tokensUsed: {
    input: this._accumulatedUsage.input_tokens,
    output: this._accumulatedUsage.output_tokens,
  },
  cost: this.calculateCost(this._accumulatedUsage),
```

**NOTE:** Sub-batch costs may not be directly accessible from Stage 1 since they're handled by `batchActivityAnalysisService`. If `analyzeSubBatch()` returns usage data, accumulate it too. If not, at minimum the scoring + story adjustment costs will be captured, which is a significant improvement over the current situation.

### Task 4.3: Fix Stage 2 Timeout Formula (P4)

**File:** `src/services/portfolioStrategy/services/activityWorkshop/stages/stage2ConditionalTeachingService.ts`

**Find the timeout calculation in `generateBatchTeaching` or `processSingleActivity`.** The old formula is:
```typescript
const timeoutMs = depth === 'deep'
  ? 180000 + (activityIds.length * 60000)
  : 120000 + (activityIds.length * 30000);
```

Since activities now run individually in parallel (not as a batch), the timeout should be per-activity:
```typescript
const timeoutMs = depth === 'deep' ? 90000 : 60000; // 90s or 60s per activity
```

**BUT** verify this is in the right method. If this timeout is only in the dead `generateBatchTeaching` (which Teammate 3 removes), no change needed.

### Verification:
```bash
npx tsc --noEmit
```

---

## FINAL VERIFICATION (All Teammates)

After all teammates complete:

1. **TypeScript check:**
   ```bash
   npx tsc --noEmit
   ```
   Must pass with zero errors.

2. **E2E test** (costs ~$0.36-0.53, takes ~5-10 min):
   ```bash
   ANTHROPIC_API_KEY="..." npx tsx tests/test-full-pipeline-e2e-output.ts
   ```
   Verify the pipeline completes successfully.

3. **Verify no regressions:**
   - Pipeline result structure unchanged
   - All existing fields still populated
   - Scoring data still flows through correctly
   - Teaching output quality maintained

4. **Check for parallelization correctness:**
   - Stage 3 and Narrative outputs should be identical to sequential execution
   - Description + Activity scoring should produce same results
   - Cost tracking should now show actual (not estimated) values

---

## APPENDIX: Key Type References

### AnalysisContext.scoring (populated in Stage 1)
```typescript
scoring?: {
  portfolioRubric: PortfolioScoreRubric;
  activityScoresById: Record<string, ActivityScoreRubric>;
  scoringComplete: boolean;
}
```

### TeachingContext.teachingMetadata
```typescript
teachingMetadata: {
  generatedAt: string;
  modelUsed: string;
  tokensUsed: { input: number; output: number };
  cost: number;
  activitiesTaught: number;
  activitiesSkipped: number;
}
```

### CostTracking (returned by orchestrator)
```typescript
interface CostTracking {
  analysisCost: number;
  teachingCost: number;
  totalCost: number;
  tokensUsed: {
    analysis: { input: number; output: number };
    teaching: { input: number; output: number };
  };
}
```

---

*Generated from Activity Workshop Audit Plan: `docs/ACTIVITY_WORKSHOP_AUDIT_PLAN.md`*
*Total changes: ~45 findings across 4 teammates, 13 files, ~700 lines changed/removed*
