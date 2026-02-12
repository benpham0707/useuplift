# Technical Optimization Swarm — Activity Workshop Pipeline Efficiency

> **Goal**: Achieve higher-quality outputs with the same or fewer resources by implementing prompt caching, robust JSON parsing, parallelism optimizations, and scoring validation enforcement.
>
> **Context**: Output quality prompt engineering (Rounds 1-2) is complete. Architecture is clean. This round targets **technical efficiency**: token reduction, parsing reliability, data integrity, and scoring accuracy enforcement. Every fix is code-level — no prompt-only changes.

---

## HOW TO RUN

```bash
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude
```

Then paste the teammate sections below. Teammates run independently — no dependencies between them.

---

## TEAMMATE 1: Token Efficiency — Prompt Caching & System Prompt Deduplication

**You are a token efficiency specialist.** Your job is to implement Anthropic prompt caching in the `callClaude` function and enable it across all Activity Workshop LLM calls with stable system prompts. This is the single highest-impact optimization — it can reduce token costs by 40-60%.

### Background

The Anthropic API supports prompt caching via `cache_control: { type: 'ephemeral' }` on system message blocks. When enabled, identical system prompts across sequential calls are cached server-side, and cached input tokens are billed at 90% discount. The Activity Workshop makes 12-21 LLM calls per portfolio, many sharing identical system prompts (e.g., all Stage 2 teaching calls share the same expert system prompt). Currently **zero** calls use caching.

The `callClaude` function (`src/lib/llm/claude.ts`) has `cacheSystemPrompt: boolean` on the `ClaudeSimpleInput` interface (line 200) and `ClaudeCallOptions` interface (line 108), but the parameter is **never read** — it's dead code. The request is built at line 279-285 without any `cache_control` headers.

### Files You Own
- `src/lib/llm/claude.ts` (372 lines) — Core LLM client
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage0StoryDetectionService.ts` (467 lines)
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage1ContextAwareAnalysisService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage2ConditionalTeachingService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/activityScoringService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/descriptionScoringService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/portfolioScoringService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/activityTeachingLayerService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/stages/portfolioNarrativeService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage3PortfolioSynthesisService.ts`

### Fix IDs and Exact Changes

#### T1-1: Implement `cacheSystemPrompt` in `callClaude` (claude.ts)

The parameter exists on the interface but is dead code. Wire it into the actual API request.

**In the Simple Object branch (lines 243-258)**, extract `cacheSystemPrompt`:
```typescript
const cacheSystemPrompt = input.cacheSystemPrompt ?? false;
```

**In the String-based branch (lines 259-275)**, extract it:
```typescript
const cacheSystemPrompt = opts.cacheSystemPrompt ?? false;
```

**In the request building section (lines 279-285)**, change the system parameter to use `cache_control` when caching is enabled:
```typescript
// Build system parameter — use cache_control when caching is requested
let systemForRequest: string | Anthropic.Messages.TextBlockParam[] | undefined;
if (systemParam && cacheSystemPrompt) {
  systemForRequest = [
    {
      type: 'text' as const,
      text: systemParam,
      cache_control: { type: 'ephemeral' as const },
    },
  ];
} else {
  systemForRequest = systemParam;
}

const requestParams: Anthropic.Messages.MessageCreateParams = {
  model,
  max_tokens: maxTokens,
  temperature,
  messages,
  ...(systemForRequest ? { system: systemForRequest } : {}),
};
```

Also add `cacheSystemPrompt` extraction for the Message-based branch if not already there. The key insight: the Anthropic API `system` parameter accepts either a `string` or an array of `TextBlockParam` objects — the array form supports `cache_control`.

**IMPORTANT**: After implementing, add a log line:
```typescript
if (cacheSystemPrompt && systemParam) {
  console.log(`[Claude] Prompt caching enabled for ${model} call (system prompt: ${systemParam.length} chars)`);
}
```

#### T1-2: Enable caching on Stage 2 teaching calls (stage2ConditionalTeachingService.ts)

Stage 2 makes 10+ individual teaching calls per portfolio, all sharing the same system prompt built by `getTeachingSystemPrompt()` (lines 704-761). This is the biggest caching win.

Find ALL `callClaude` calls in this file and add `cacheSystemPrompt: true` to each one. There are at least 3 call sites:

1. **Single activity teaching** (~line 519-531): The `callClaude` call with `systemPrompt` and `userPrompt`. Add `cacheSystemPrompt: true`.

2. **Quick encouragements** (~line 1949-1969): The `callClaude` call with inline system prompt. Add `cacheSystemPrompt: true`.

3. Any other `callClaude` calls in this file — search for all instances and add caching to all that use a stable system prompt.

#### T1-3: Enable caching on Stage 1 analysis call (stage1ContextAwareAnalysisService.ts)

Find the `callClaude` call in the `analyze()` method. The system prompt is the same for every portfolio. Add `cacheSystemPrompt: true`.

#### T1-4: Enable caching on all scoring service calls

In each of these files, find the `callClaude` call(s) and add `cacheSystemPrompt: true`:

- **activityScoringService.ts** — The batch scoring call uses a large rubric system prompt (~3,800 tokens). Adding caching here saves the most per call.
- **descriptionScoringService.ts** — Same: large rubric system prompt, called once per batch.
- **portfolioScoringService.ts** — Portfolio-level scoring with stable system prompt.
- **activityTeachingLayerService.ts** — Scoring teaching layer calls.

#### T1-5: Enable caching on Stage 0, Stage 3, and Narrative

- **stage0StoryDetectionService.ts** (~line 59): Add `cacheSystemPrompt: true` to the Haiku story detection call.
- **stage3PortfolioSynthesisService.ts**: Add `cacheSystemPrompt: true` to the synthesis call.
- **portfolioNarrativeService.ts**: Add `cacheSystemPrompt: true` to the narrative call.

### Verification

After all changes:
1. Run `npx tsc --noEmit` — zero errors
2. Grep for `callClaude` in the activityWorkshop directory and verify EVERY call has `cacheSystemPrompt: true`
3. Verify `claude.ts` correctly builds the `cache_control` block

### Expected Impact
- **Token cost reduction**: 40-60% on cached system prompts (Anthropic bills cached input at 10% of normal rate)
- **Latency reduction**: ~100-200ms per call (cached prompts skip tokenization)
- **Zero quality impact**: Output is identical — only billing changes

---

## TEAMMATE 2: Parsing Robustness — Replace Raw JSON.parse with parseClaudeJSON

**You are a reliability engineer.** Your job is to replace every raw `JSON.parse` call that parses LLM output with the robust `parseClaudeJSON` utility throughout the Activity Workshop pipeline. This prevents crashes from malformed JSON (trailing commas, unescaped newlines, markdown wrapping).

### Background

The codebase has a battle-tested JSON parser at `src/services/commonAppWorkshop/utils/jsonParser.ts` that implements a 4-tier fallback strategy:
1. Direct `JSON.parse` (fast path)
2. Manual repairs (trailing commas, comments, unquoted properties, single quotes, newlines, control characters)
3. `jsonrepair` library (comprehensive structural repair)
4. Combined manual + jsonrepair (nuclear option)

**4 files** already use it: `stage2ConditionalTeachingService.ts`, `stage3PortfolioSynthesisService.ts`, `portfolioNarrativeService.ts`, `batchActivityAnalysisService.ts`.

**10 files** still use raw `JSON.parse` on LLM responses and are vulnerable to crashes.

### Files You Own
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage0StoryDetectionService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage1ContextAwareAnalysisService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/activityScoringService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/descriptionScoringService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/portfolioScoringService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/activityTeachingLayerService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/activityTeachingService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/chat/dynamicConversationEngine.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/chat/responseExtractor.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/profile/profileDescriptionGenerator.ts`

### Fix IDs and Exact Changes

#### T2-1: stage0StoryDetectionService.ts (line 254)

Add import at top of file:
```typescript
import { parseClaudeJSON } from '@/services/commonAppWorkshop/utils/jsonParser';
```

In `parseStoryResponse()` method (~line 254), replace:
```typescript
const parsed = JSON.parse(jsonStr);
```
with:
```typescript
const parsed = parseClaudeJSON<any>(jsonStr, 'Stage0-StoryDetection');
```

Also remove the manual markdown code block extraction above it (lines 248-252) — `parseClaudeJSON` already handles markdown-wrapped JSON internally. The entire try block can be simplified to:
```typescript
try {
  const parsed = parseClaudeJSON<any>(response, 'Stage0-StoryDetection');
  // ... rest of validation unchanged
```

#### T2-2: stage1ContextAwareAnalysisService.ts (line 518)

Add import:
```typescript
import { parseClaudeJSON } from '@/services/commonAppWorkshop/utils/jsonParser';
```

Find the JSON parsing section in the story adjustments parser (~line 518) and replace `JSON.parse` with `parseClaudeJSON`. Look for the pattern:
```typescript
const parsed = JSON.parse(jsonStr);
```
Replace with:
```typescript
const parsed = parseClaudeJSON<any>(jsonStr, 'Stage1-StoryAdjustments');
```

Same as T2-1 — if there's manual markdown extraction before the parse, remove it since `parseClaudeJSON` handles that.

#### T2-3: activityScoringService.ts (lines 511, 526)

Add import:
```typescript
import { parseClaudeJSON } from '@/services/commonAppWorkshop/utils/jsonParser';
```

This file has TWO `JSON.parse` call sites for LLM responses:

1. **`parseBatchScoreResponse()`** (line 526): Replace:
```typescript
const data = JSON.parse(jsonStr);
```
with:
```typescript
const data = parseClaudeJSON<any>(jsonStr, 'ActivityScoring-Batch');
```

2. **Second parse site** (line 511): If this is another LLM response parse, replace similarly. If it's the markdown extraction followed by parse, simplify by removing the extraction and using `parseClaudeJSON` directly on the raw response.

#### T2-4: descriptionScoringService.ts (lines 657, 676)

Add import:
```typescript
import { parseClaudeJSON } from '@/services/commonAppWorkshop/utils/jsonParser';
```

Find both `JSON.parse` call sites and replace with `parseClaudeJSON`. These are likely in `parseBatchResponse()` or similar methods. Replace each:
```typescript
const data = JSON.parse(jsonStr);
```
with:
```typescript
const data = parseClaudeJSON<any>(jsonStr, 'DescriptionScoring-Batch');
```

#### T2-5: portfolioScoringService.ts (line 386)

Add import and replace:
```typescript
const data = JSON.parse(jsonStr);
```
with:
```typescript
const data = parseClaudeJSON<any>(jsonStr, 'PortfolioScoring');
```

#### T2-6: activityTeachingLayerService.ts (line 747)

Add import and replace:
```typescript
const parsed = JSON.parse(jsonStr);
```
with:
```typescript
const parsed = parseClaudeJSON<any>(jsonStr, 'ScoringTeaching-SpikeReinforcement');
```

#### T2-7: activityTeachingService.ts (line 352)

This file has a partial manual repair implementation. Replace the entire custom JSON repair logic with `parseClaudeJSON` which does everything it does and more. Add import and replace the entire try/catch JSON parsing block with a single `parseClaudeJSON` call.

#### T2-8: dynamicConversationEngine.ts (line 858)

Add import and replace `JSON.parse` with:
```typescript
const parsed = parseClaudeJSON<any>(response, 'DynamicConversation');
```

#### T2-9: responseExtractor.ts (line 346)

Add import and replace:
```typescript
const parsed = parseClaudeJSON<any>(responseText, 'ResponseExtractor');
```

#### T2-10: profileDescriptionGenerator.ts (line 503)

Add import and replace:
```typescript
const parsed = parseClaudeJSON<any>(responseText, 'ProfileDescriptionGenerator');
```

### Verification

1. Run `npx tsc --noEmit` — zero errors
2. Search the entire `activityWorkshop/` directory for raw `JSON.parse` calls. The ONLY remaining `JSON.parse` should be in `conversationManager.ts` (lines 78 and 417) which uses `JSON.parse(JSON.stringify(...))` for deep cloning — NOT for LLM response parsing.
3. Verify all new imports resolve correctly.

### Expected Impact
- **Eliminates ~5-10% of pipeline failures** caused by malformed JSON from Claude
- **Zero latency impact** — `parseClaudeJSON` tries direct `JSON.parse` first (fast path), only falls back to repair when needed
- **Better error logging** — Each call site gets a descriptive context label for debugging

---

## TEAMMATE 3: Scoring Validation — Enforce Score-Data Consistency

**You are a scoring calibration engineer.** Your job is to add code-level validation that enforces consistency between scores, tiers, and Harvard ratings. Currently, scores are validated individually (clamped to ranges, weights recalculated) but cross-field consistency is NOT enforced.

### Background

**What's already validated (good):**
- Component scores clamped to 0-10 ranges
- Weighted totals recalculated from components (never trust LLM's total)
- Tier values constrained to [1,2,3,4]
- Harvard rating constrained to [1-6]
- Description dimension scores capped at individual maxes (2.5, 2.0, 1.5)
- Recognition level enum validation

**What's NOT validated (problems):**
- A Tier 1 activity could score 3/10 (should be 7+)
- Harvard 1 rating with portfolio score 4.5 (should be 8.5+)
- "Leadership" scored for solo activities with no team/followers
- All batch scores can cluster at 5-6 despite score spread prompt instructions
- Fallback data is indistinguishable from real LLM data

### Files You Own
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/activityScoringService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/portfolioScoringService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/scoringOrchestrator.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/descriptionScoringService.ts`

### Fix IDs and Exact Changes

#### T3-1: Tier-Score Consistency Enforcement (activityScoringService.ts)

After the `normalizeScoreData()` method completes and returns the normalized score object (around line 766), add a post-validation step that enforces tier-total consistency.

Add a new private method `enforceTierScoreConsistency`:
```typescript
/**
 * T3-1: Enforce that tier and total score are consistent.
 * Tier 1 activities MUST score at least 7.0. Tier 4 MUST score below 4.0.
 * If inconsistent, adjust the tier (not the score) since score is calculated from validated components.
 */
private enforceTierScoreConsistency(score: ActivityScore): ActivityScore {
  const total = score.actScore.activityScore.total;
  const currentTier = score.actScore.activityScore.breakdown.tierAssessment.tier;

  // Define expected tier ranges based on total score
  let expectedTier: 1 | 2 | 3 | 4;
  if (total >= 7.0) expectedTier = 1;
  else if (total >= 5.0) expectedTier = 2;
  else if (total >= 3.0) expectedTier = 3;
  else expectedTier = 4;

  // Allow 1 tier of deviation (LLM might have good reasons)
  // But flag 2+ tier mismatches
  const deviation = Math.abs(currentTier - expectedTier);
  if (deviation >= 2) {
    console.warn(
      `[ActivityScoringService] T3-1: Tier-score mismatch for "${score.actScore.title}": ` +
      `Tier ${currentTier} with score ${total}/10 (expected Tier ${expectedTier}). Adjusting tier.`
    );
    score.actScore.activityScore.breakdown.tierAssessment.tier = expectedTier;
    score.actScore.activityScore.breakdown.tierAssessment.rationale +=
      ` [Auto-corrected from Tier ${currentTier} to Tier ${expectedTier} for score consistency]`;
  }

  return score;
}
```

Call this method in `parseBatchScoreResponse()` after `normalizeScoreData()` returns each score, before pushing to the array.

#### T3-2: Harvard Rating-Score Consistency (portfolioScoringService.ts)

After the Harvard scale normalization (lines 419-427), add validation that the rating matches the portfolio score.

Find the section where `harvardRating` is set and the portfolio total is calculated. After both are available, add:

```typescript
// T3-2: Validate Harvard rating against portfolio score
const portfolioTotal = /* the calculated portfolio total score */;
let adjustedHarvardRating = harvardRating;

// Define expected rating bands (from R2-3 calibration)
if (portfolioTotal >= 8.5 && harvardRating > 2) {
  adjustedHarvardRating = 1 as 1 | 2 | 3 | 4 | 5 | 6;
  console.warn(`[PortfolioScoring] T3-2: Harvard ${harvardRating} with score ${portfolioTotal} → adjusted to 1`);
} else if (portfolioTotal >= 7.0 && harvardRating > 3) {
  adjustedHarvardRating = 2 as 1 | 2 | 3 | 4 | 5 | 6;
  console.warn(`[PortfolioScoring] T3-2: Harvard ${harvardRating} with score ${portfolioTotal} → adjusted to 2`);
} else if (portfolioTotal < 4.0 && harvardRating < 4) {
  adjustedHarvardRating = 5 as 1 | 2 | 3 | 4 | 5 | 6;
  console.warn(`[PortfolioScoring] T3-2: Harvard ${harvardRating} with score ${portfolioTotal} → adjusted to 5`);
}
```

Use `adjustedHarvardRating` in the `HarvardScaleAssessment` object. If adjusted, append to the rationale: `[Auto-calibrated from Harvard ${original} to ${adjusted} based on portfolio score ${total}]`.

#### T3-3: Leadership Applicability Validation (activityScoringService.ts)

In the `normalizeScoreData()` method, the leadership component (lines 623-658) checks `c.isApplicable` from the LLM but doesn't validate it against the activity data.

After the leadership component normalization, add a validation check using the activity's role/description:

```typescript
// T3-3: Validate leadership applicability against activity data
// If the activity description and role suggest solo/individual work, leadership should be N/A
const activityTitle = scoreData.title?.toLowerCase() || '';
const activityRole = scoreData.role?.toLowerCase() || '';
const soloIndicators = ['independent', 'self-taught', 'personal project', 'solo', 'individual'];
const teamIndicators = ['president', 'captain', 'leader', 'founder', 'director', 'head', 'coordinator', 'manager', 'team'];

const isSoloActivity = soloIndicators.some(s => activityTitle.includes(s) || activityRole.includes(s));
const hasTeamRole = teamIndicators.some(t => activityTitle.includes(t) || activityRole.includes(t));

if (isSoloActivity && !hasTeamRole && normalizedBreakdown.leadershipImpact.score > 5) {
  console.warn(`[ActivityScoringService] T3-3: High leadership score (${normalizedBreakdown.leadershipImpact.score}) for solo activity "${scoreData.title}". Capping at 5.`);
  normalizedBreakdown.leadershipImpact.score = 5;
  normalizedBreakdown.leadershipImpact.weightedScore = Number((5 * weights.leadership).toFixed(2));
  normalizedBreakdown.leadershipImpact.rationale += ' [Capped: solo activity]';
}
```

Note: The `scoreData` here needs to include the activity's title and role. Check if `normalizeScoreData` receives this information — if not, pass it through from the batch parse method.

#### T3-4: Score Spread Enforcement (activityScoringService.ts)

After the batch scoring response is fully parsed (in `parseBatchScoreResponse()`, after the loop that builds the `scores` array), add post-processing to enforce score spread:

```typescript
// T3-4: Enforce score spread — batch scores must use reasonable range
if (scores.length >= 3) {
  const totals = scores.map(s => s.actScore.activityScore.total);
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  const range = max - min;

  if (range < 2.0) {
    console.warn(
      `[ActivityScoringService] T3-4: Score clustering detected. Range: ${min.toFixed(1)}-${max.toFixed(1)} (${range.toFixed(1)} spread). ` +
      `Expected at least 2.0 spread for ${scores.length} activities.`
    );
    // Don't auto-correct scores (too risky), but log for monitoring
    // Future: re-call LLM with explicit spread requirement
  }
}
```

This is a monitoring-only fix for now. The warn logs will help us understand how often clustering happens and whether the R2-5 prompt fix is sufficient.

#### T3-5: Scoring Orchestrator ID-Based Safety (scoringOrchestrator.ts)

The orchestrator maps batch results by array index (lines 520-530, 613-623). Add an ID-verification safety check after index-based mapping.

After the index-based mapping loop for description scoring (~line 530), add:
```typescript
// T3-5: Verify ID consistency after index-based mapping
if (score.id && descriptionInputs[index].id && score.id !== descriptionInputs[index].id) {
  console.error(
    `[ScoringOrchestrator] T3-5: ID MISMATCH in description scoring! ` +
    `Expected "${descriptionInputs[index].id}" but got "${score.id}" at index ${j}. ` +
    `Results may be misaligned.`
  );
}
```

Add the same check for activity scoring (~line 623):
```typescript
if (score.actScore?.activityId && activityInputs[index].id &&
    score.actScore.activityId !== activityInputs[index].id) {
  console.error(
    `[ScoringOrchestrator] T3-5: ID MISMATCH in activity scoring! ` +
    `Expected "${activityInputs[index].id}" but got "${score.actScore.activityId}" at index ${j}. ` +
    `Results may be misaligned.`
  );
}
```

Check what fields the score objects actually have (`id`, `activityId`, `actScore.activityId`, etc.) by reading the types. The key is: IF the LLM returns an ID field in its response, verify it matches the expected input ID. This is a monitoring/alerting check — it doesn't fix mismatches but makes them visible.

#### T3-6: Fallback Data Metadata Flag (activityScoringService.ts, descriptionScoringService.ts, portfolioScoringService.ts)

When scoring services fall back to heuristic scores (parse failure, API error), the fallback data should be distinguishable from real LLM-scored data.

In each scoring service, find the fallback/default score generation methods and add a metadata field:

```typescript
// In fallback score objects, add:
_metadata: {
  source: 'fallback' as const,
  reason: 'LLM response parse failure' | 'API error' | 'timeout',
  timestamp: new Date().toISOString(),
}
```

If the existing type doesn't have a `_metadata` field, add it as optional to the relevant types:
```typescript
interface ActivityScore {
  // ... existing fields ...
  _metadata?: {
    source: 'llm' | 'fallback';
    reason?: string;
    timestamp: string;
  };
}
```

For LLM-sourced scores, set `_metadata: { source: 'llm', timestamp: new Date().toISOString() }`.

This lets downstream consumers (Stage 3 synthesis, narrative) know when they're working with estimated vs real data and adjust their confidence accordingly.

### Verification

1. Run `npx tsc --noEmit` — zero errors
2. For T3-6, verify the new `_metadata` type is added correctly and doesn't break existing consumers (search for all places these types are used)
3. The T3-4 monitoring logs will start producing data on the next E2E test run

### Expected Impact
- **T3-1**: Prevents ~5% of cases where tier and score diverge by 2+ tiers
- **T3-2**: Prevents Harvard rating from contradicting the portfolio score
- **T3-3**: Prevents inflated leadership scores for individual activities
- **T3-4**: Monitoring data for future score spread enforcement
- **T3-5**: Early detection of LLM result reordering/dropping
- **T3-6**: Enables smart fallback-aware downstream processing

---

## TEAMMATE 4: Pipeline Parallelism & Conditional Execution

**You are a pipeline optimization engineer.** Your job is to find parallelism opportunities and conditional execution paths that reduce wall-clock time without sacrificing output quality.

### Background

Current pipeline timing (10-activity portfolio, ~$0.425):
```
Stage 0 (Haiku)  ──── 2-3s
Stage 1 (Sonnet) ──── 8-12s (analysis + story adjustments)
Stage 2 (Sonnet) ──── 40-60s (10 individual teaching calls, sequential)
Stage 3 (Haiku)  ──┐
                    ├── parallel ── 8-12s
Narrative (Sonnet)─┘
```

**Total wall-clock: ~75-100s**

Stage 3 and Narrative already run in parallel. The biggest bottleneck is Stage 2's sequential per-activity teaching calls.

### Files You Own
- `src/services/portfolioStrategy/services/activityWorkshop/activityWorkshopService.ts` (main orchestrator)
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage2ConditionalTeachingService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/scoringOrchestrator.ts`

### Fix IDs and Exact Changes

#### T4-1: Parallelize Stage 2 Quick Encouragements + Portfolio Teaching (stage2ConditionalTeachingService.ts)

In the `teach()` method, find where quick encouragements and portfolio-level teaching are generated. These two are INDEPENDENT of each other — quick encouragements need only the activity data + story context, while portfolio teaching needs the analysis context.

If they're currently sequential, wrap them in `Promise.all()`:

```typescript
// T4-1: Parallelize independent teaching streams
const [quickEncouragements, portfolioTeaching] = await Promise.all([
  this.generateQuickEncouragements(strongActivities, storyContext, input),
  this.generatePortfolioTeaching(input, storyContext, analysisContext),
]);
```

Read the actual method flow to identify exactly which calls are independent. The key criterion: two calls are parallelizable if neither's input depends on the other's output.

**IMPORTANT**: Do NOT parallelize calls that share mutable state or depend on each other's results.

#### T4-2: Sub-Batch Stage 2 Teaching Calls (stage2ConditionalTeachingService.ts)

Currently, 10 activities are taught sequentially (one `callClaude` call per activity). This can be partially parallelized with controlled concurrency to avoid rate limits.

Find the loop that iterates over activities and calls `callClaude` for each one. Replace sequential execution with a concurrency-limited parallel approach:

```typescript
// T4-2: Process teaching calls with concurrency limit of 3
private async processWithConcurrency<T>(
  items: T[],
  processor: (item: T) => Promise<any>,
  concurrencyLimit: number = 3
): Promise<any[]> {
  const results: any[] = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrencyLimit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await processor(items[index]);
    }
  });

  await Promise.all(workers);
  return results;
}
```

Then use it:
```typescript
// Replace sequential loop:
// for (const activity of activitiesToTeach) { await this.teachSingle(activity); }

// With concurrent processing:
const teachingResults = await this.processWithConcurrency(
  activitiesToTeach,
  (activity) => this.teachSingleActivity(activity, storyContext, analysisContext, knowledgeContexts, depth),
  3 // Max 3 concurrent calls — prevents rate limiting
);
```

The concurrency limit of 3 is conservative. Sonnet rate limits are generous for paid API, but we don't want to trigger them. 3 concurrent calls means ~40-60s teaching time drops to ~15-25s.

**CRITICAL**: Ensure that all shared state is read-only during parallel execution. The teaching calls should NOT modify any shared mutable state.

#### T4-3: Conditional Scoring Teaching (scoringOrchestrator.ts or activityWorkshopService.ts)

The scoring teaching layer (`activityTeachingLayerService.ts`) runs on ALL portfolios, but strong portfolios (average activity score > 7.0) don't benefit much from scoring-level teaching. Make it conditional:

Find where the scoring teaching layer is invoked. Add a conditional check:

```typescript
// T4-3: Skip scoring teaching for strong portfolios
const avgActivityScore = activityScores.reduce((sum, s) => sum + s.actScore.activityScore.total, 0) / activityScores.length;

let scoringTeaching;
if (avgActivityScore < 7.0) {
  scoringTeaching = await activityTeachingLayerService.generateTeaching(scoringResults);
  console.log(`[Pipeline] Scoring teaching generated (avg score: ${avgActivityScore.toFixed(1)})`);
} else {
  scoringTeaching = null; // Strong portfolio — skip teaching layer
  console.log(`[Pipeline] Scoring teaching SKIPPED — strong portfolio (avg score: ${avgActivityScore.toFixed(1)})`);
}
```

Verify that downstream consumers handle `null` scoring teaching gracefully. If not, provide an empty/default object.

#### T4-4: Stage 1 Story Adjustments Sub-Batching (stage1ContextAwareAnalysisService.ts)

Read the Stage 1 analysis flow. If story adjustments are generated per-activity sequentially, consider batching them into a single LLM call (if not already batched) or parallelizing with concurrency limit.

**Only implement this if** the current flow processes adjustments one-by-one. If they're already batched in a single LLM call, skip this fix.

### Verification

1. Run `npx tsc --noEmit` — zero errors
2. For T4-2, verify the concurrent worker pool maintains correct index mapping (results[index] matches items[index])
3. For T4-3, verify downstream consumers handle null scoring teaching
4. Run the E2E test to verify pipeline still produces correct output

### Expected Impact
- **T4-1**: Saves 2-3 seconds (parallel encouragements + portfolio teaching)
- **T4-2**: Saves 25-35 seconds (3x throughput on teaching calls) — **BIGGEST win**
- **T4-3**: Saves 3-5 seconds + 1 LLM call for strong portfolios
- **T4-4**: Saves 3-5 seconds if adjustments were sequential

**Total expected wall-clock reduction: 30-45 seconds (40-50% faster)**

---

## CROSS-CUTTING VERIFICATION

After ALL teammates complete:

1. **TypeScript**: `npx tsc --noEmit` — zero errors
2. **Import resolution**: All new `parseClaudeJSON` imports resolve correctly
3. **Cost tracking**: Verify that prompt caching doesn't break the existing `response.usage` cost calculation in each stage (cached tokens appear in `cache_read_input_tokens` field)
4. **E2E test**: Run `ANTHROPIC_API_KEY="..." npx tsx tests/test-full-pipeline-e2e-output.ts` to verify:
   - Output quality unchanged or improved
   - Token usage reduced (check console logs)
   - Wall-clock time reduced
   - No new errors or fallbacks

---

## SUMMARY TABLE

| Fix ID | File(s) | Type | Impact |
|--------|---------|------|--------|
| T1-1 | claude.ts | Prompt caching implementation | 40-60% token cost reduction |
| T1-2 | stage2ConditionalTeachingService.ts | Enable caching | Biggest per-file savings |
| T1-3 | stage1ContextAwareAnalysisService.ts | Enable caching | System prompt cached |
| T1-4 | 4 scoring services | Enable caching | Rubric prompts cached |
| T1-5 | stage0, stage3, narrative | Enable caching | All remaining calls |
| T2-1 | stage0StoryDetectionService.ts | Robust JSON parsing | Prevents Haiku parse crashes |
| T2-2 | stage1ContextAwareAnalysisService.ts | Robust JSON parsing | Prevents Sonnet parse crashes |
| T2-3 | activityScoringService.ts | Robust JSON parsing | Prevents scoring parse crashes |
| T2-4 | descriptionScoringService.ts | Robust JSON parsing | Prevents scoring parse crashes |
| T2-5 | portfolioScoringService.ts | Robust JSON parsing | Prevents scoring parse crashes |
| T2-6 | activityTeachingLayerService.ts | Robust JSON parsing | Prevents teaching parse crashes |
| T2-7 | activityTeachingService.ts | Robust JSON parsing | Replaces partial repair code |
| T2-8 | dynamicConversationEngine.ts | Robust JSON parsing | Prevents chat parse crashes |
| T2-9 | responseExtractor.ts | Robust JSON parsing | Prevents extraction crashes |
| T2-10 | profileDescriptionGenerator.ts | Robust JSON parsing | Prevents profile crashes |
| T3-1 | activityScoringService.ts | Tier-score consistency | Prevents tier/score mismatch |
| T3-2 | portfolioScoringService.ts | Harvard-score consistency | Prevents Harvard/score mismatch |
| T3-3 | activityScoringService.ts | Leadership validation | Prevents solo-activity inflation |
| T3-4 | activityScoringService.ts | Score spread monitoring | Data for future enforcement |
| T3-5 | scoringOrchestrator.ts | ID mismatch detection | Early warning for data misalignment |
| T3-6 | 3 scoring services + types | Fallback metadata | Distinguishes real vs fallback data |
| T4-1 | stage2ConditionalTeachingService.ts | Parallel encouragements | Saves 2-3s |
| T4-2 | stage2ConditionalTeachingService.ts | Concurrent teaching | Saves 25-35s (biggest win) |
| T4-3 | scoringOrchestrator.ts | Conditional teaching | Saves 3-5s for strong portfolios |
| T4-4 | stage1ContextAwareAnalysisService.ts | Story adjustment batching | Saves 3-5s if sequential |

**Total: 25 fixes across 4 teammates**
- Token cost: 40-60% reduction via prompt caching
- Reliability: 10 files upgraded from raw JSON.parse to robust parser
- Accuracy: 6 scoring validation improvements
- Speed: 30-45 second wall-clock time reduction (40-50% faster)
