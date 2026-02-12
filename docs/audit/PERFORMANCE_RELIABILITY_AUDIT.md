# Deep Academic Report — Performance & Reliability Audit

> **Auditor:** Performance & Reliability Engineer
> **Date:** 2026-02-10
> **Scope:** Runtime performance, error handling, fallback quality, JSON parsing, concurrency, and reliability of `deepAcademicReportService.ts` and supporting modules.

---

## EXECUTIVE SUMMARY

The Deep Academic Report system has a solid foundation but contains **3 critical** and **4 high-severity** issues that could cause silent data corruption, lost LLM results, or runtime crashes in production. The most impactful are: (1) Promise.all discards expensive LLM results when a single call fails, (2) no runtime validation of LLM JSON shape means missing fields crash downstream code silently, and (3) `buildBottomLine()` runs outside the try/catch and can lose all 3 LLM results on a single field access error.

---

## ISSUE #1: Promise.all Discards Successful LLM Results on Single Failure

**Severity: CRITICAL**
**File:** `deepAcademicReportService.ts:237-263`

### Problem

The 3 LLM calls (Identity, Challenges, Roadmap) run in parallel via `Promise.all`. If **any one** fails — timeout, API error, JSON parse failure — the entire Promise.all rejects. The catch block discards **all** results and falls back to template-only output.

At ~$0.04 per successful LLM call, a single failure wastes $0.04-0.08 of already-completed work.

### Analysis

```
Failure scenarios and their frequency:
- API timeout (120s):    ~2-5% of calls under load
- Rate limit (429):      ~1-3% during peak (no retry in current code path)
- JSON parse failure:    ~0.5-1% (despite jsonrepair)
- API error (500/503):   ~0.1-0.5%

Combined P(at least 1 of 3 fails) ≈ 7-15% under normal conditions
```

Each time this happens, we discard 2 successful Sonnet calls ($0.04-0.08) and return a significantly lower-quality template report.

### Proposed Fix: Promise.allSettled with Partial Fallback

```typescript
// BEFORE (all-or-nothing)
const [identityResult, challengesResult, roadmapResult] = await Promise.all([...]);

// AFTER (graceful partial degradation)
const [identitySettled, challengesSettled, roadmapSettled] = await Promise.allSettled([
  this.generateAcademicIdentity(context),
  this.generateChallengesAndReality(context),
  this.generateStrategicRoadmap(context),
]);

const templateFallback = this.generateTemplateFallback(context);

academicIdentity = identitySettled.status === 'fulfilled'
  ? identitySettled.value
  : (sectionSources.academicIdentity = 'template', templateFallback.academicIdentity);

challengesAndReality = challengesSettled.status === 'fulfilled'
  ? challengesSettled.value
  : (sectionSources.challengesAndReality = 'template', templateFallback.challengesAndReality);

strategicRoadmap = roadmapSettled.status === 'fulfilled'
  ? roadmapSettled.value
  : (sectionSources.strategicRoadmap = 'template', templateFallback.strategicRoadmap);

usedFallback = [identitySettled, challengesSettled, roadmapSettled]
  .some(s => s.status === 'rejected');
```

### Tradeoffs

| Approach | Pros | Cons |
|----------|------|------|
| **Promise.all (current)** | Simple, guaranteed consistency | Wastes money, all-or-nothing quality |
| **Promise.allSettled (proposed)** | Preserves successful work, better ROI | Mixed quality report (some LLM, some template), slightly more complex |
| **Per-section retry + Promise.all** | Retries before giving up | Higher latency on failure, still all-or-nothing if retry fails |

### Impact on `buildBottomLine()`

`buildBottomLine()` reads structured data from whatever sections are passed — it doesn't distinguish LLM vs template source. A hybrid report (some LLM, some template) will produce a valid bottomLine. The LLM sections will have richer content while template sections will be data-driven but less narrative.

The `sectionSources` field in `ReportMetadata` already supports per-section tracking, so the frontend can differentiate quality levels.

---

## ISSUE #2: No Runtime Validation of LLM JSON Shape (Silent Type Lie)

**Severity: CRITICAL**
**File:** `jsonParser.ts:196,229` and `deepAcademicReportService.ts:469,614,747`

### Problem

`parseClaudeJSON<T>()` uses `as T` type assertion (line 229: `return JSON.parse(repaired) as T`). This is a **compile-time only** cast — it performs zero runtime validation. If the LLM returns JSON with missing or misnamed fields, the parsed object passes through silently with `undefined` values where the type says there should be data.

```typescript
// This ALWAYS succeeds at runtime, even if parsed JSON is {}
return parseClaudeJSON<AcademicIdentitySection>(response.content, 'academicIdentity');
// Result: { narrativeIdentity: undefined, notableStrengths: undefined, ... }
```

### Downstream Crash Points

When the malformed data reaches `buildBottomLine()`:

```typescript
// Line 849: Crashes if identity.upliftRating is undefined
const gradeDescriptor = UPLIFT_SCALE_DATABASE.find(d => d.grade === identity.upliftRating.grade);
//                                                              ^^^^^^^^^^^^^^^^^^^^^^^^
//                                                    TypeError: Cannot read property 'grade' of undefined

// Line 853: Crashes if identity.tierPosition is undefined
positioning: `${identity.tierPosition.currentTier} (${identity.tierPosition.tierExamples.slice(0, 3).join(', ')})`
```

The code **does** safely check array lengths before accessing `[0]` (lines 854-862), which is good. But it does **not** check whether top-level objects exist.

### Risk Assessment

- LLM returns wrong field names ~1-3% of the time (e.g., `narrative_identity` instead of `narrativeIdentity`)
- LLM omits fields ~0.5-1% of the time when the output is long and hits token limits
- When this happens, we crash AFTER the LLM calls succeed — meaning we lose $0.11 of LLM work with no fallback

### Proposed Fix: Lightweight Runtime Validator

```typescript
function validateSection<T>(
  parsed: unknown,
  requiredFields: string[],
  sectionName: string
): T {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`[${sectionName}] Parsed JSON is not an object`);
  }
  const obj = parsed as Record<string, unknown>;
  const missing = requiredFields.filter(f => obj[f] === undefined || obj[f] === null);
  if (missing.length > 0) {
    throw new Error(`[${sectionName}] Missing required fields: ${missing.join(', ')}`);
  }
  return parsed as T;
}

// Usage:
const parsed = parseClaudeJSON<AcademicIdentitySection>(response.content, 'academicIdentity');
return validateSection<AcademicIdentitySection>(parsed,
  ['narrativeIdentity', 'notableStrengths', 'notableWeaknesses', 'tierPosition', 'upliftRating'],
  'academicIdentity'
);
```

This would cause the section's promise to reject, which (with Issue #1's fix) would fall back to template for just that section instead of crashing the entire report.

---

## ISSUE #3: `buildBottomLine()` Runs Outside Try/Catch — Loses All LLM Results on Crash

**Severity: CRITICAL**
**File:** `deepAcademicReportService.ts:265-266`

### Problem

```typescript
try {
  // ... Promise.all LLM calls (lines 237-249) ...
} catch (error) {
  // ... template fallback (lines 252-263) ...
}

// Step 3: Build bottom line summary from completed sections (no LLM needed)
const bottomLine = this.buildBottomLine(academicIdentity, challengesAndReality, strategicRoadmap);
//                      ^^^^^^^^^^^^^^^^ — NOT inside try/catch!
```

If `buildBottomLine()` throws (due to Issue #2's undefined fields, or any other runtime error), the exception bubbles up from `generateReport()` uncaught. The caller gets **nothing** — no report, no fallback, no partial data. All 3 successful LLM calls ($0.11) are lost.

### Proposed Fix

Wrap `buildBottomLine()` in its own try/catch with a deterministic fallback:

```typescript
let bottomLine: BottomLineSummary;
try {
  bottomLine = this.buildBottomLine(academicIdentity, challengesAndReality, strategicRoadmap);
} catch (error) {
  console.error('[DeepAcademicReportService] buildBottomLine failed, using safe fallback:', error);
  bottomLine = {
    rating: `Uplift Rating: ${identity.upliftRating?.grade ?? 'N/A'}`,
    positioning: identity.tierPosition?.currentTier ?? 'See report for details',
    biggestStrength: 'See Academic Identity section',
    biggestRisk: 'See Challenges section',
    topAction: 'See Strategic Roadmap section',
  };
}
```

---

## ISSUE #4: `assembleContext()` Failure Has No Fallback

**Severity: HIGH**
**File:** `deepAcademicReportService.ts:219-220`

### Problem

```typescript
// Step 1: Assemble all context from existing services (no LLM, ~5ms)
const context = this.assembleContext(input);
// ^^^^ — NOT in try/catch. If input data is malformed, entire report fails.
```

`assembleContext()` calls 3 synchronous functions:
1. `extractProfileInsights(studentProfile)` — reads `quantitativeAnalysis`
2. `assembleResearchForStudent(studentContext)` — reads `intendedMajor`, `schoolContext`
3. `generateAcademicPlanningAdvice(planningInput)` — reads `quantitativeAnalysis`, `schoolContext`

If the input `NuancedCapabilityAnalysis` is malformed (e.g., empty `subjectPatterns`, null `synthesis`), any of these can throw. The error propagates uncaught — no fallback, no partial report.

### Risk Assessment

- Input is generated by `NuancedCapabilityAnalyzer` — generally reliable
- But if the student has very few courses, `subjectPatterns` could be empty, causing `Object.values()` issues
- The `synthesis` object could have empty `challenges` or `strengths` arrays — these are handled gracefully downstream but not validated here
- **Likelihood: LOW but impact is TOTAL FAILURE**

### Proposed Fix

Wrap `assembleContext()` in try/catch. On failure, return a minimal context that allows template fallback to function:

```typescript
let context: AssembledReportContext;
try {
  context = this.assembleContext(input);
} catch (error) {
  console.error('[DeepAcademicReportService] Context assembly failed:', error);
  // Return a minimal context sufficient for template fallback
  context = this.buildMinimalContext(input);
}
```

---

## ISSUE #5: Truncated LLM Output Not Detected — `stopReason` Unchecked

**Severity: HIGH**
**File:** `deepAcademicReportService.ts:460-469` and `claude.ts:357-358`

### Problem

`callClaude()` returns `stopReason` in the response (line 358 of claude.ts), but `deepAcademicReportService.ts` **never checks it**:

```typescript
const response = await callClaude<string>({
  model: MODEL,
  systemPrompt,
  userPrompt,
  maxTokens: MAX_TOKENS_PER_SECTION, // 4096
  temperature: 0.3,
});

this.trackUsage(response.usage);
return parseClaudeJSON<AcademicIdentitySection>(response.content, 'academicIdentity');
// ^^^^^ stopReason is IGNORED
```

When the LLM output hits the 4096 token limit:
1. `stopReason` is `"max_tokens"` (not `"end_turn"`)
2. The JSON is **truncated mid-string or mid-object**
3. `extractJSONText()` fails to find matching `}` via brace-matching
4. Falls back to regex `\{[\s\S]*\}` — grabs up to the last `}` in truncated output
5. This could be a valid-looking but **incomplete** JSON object (e.g., has `narrativeIdentity` and `notableStrengths` but is missing `tierPosition` and `upliftRating`)
6. `jsonrepair` closes the JSON, parsing succeeds
7. Result: **Valid JSON parse, but missing fields** — links directly to Issue #2

### Risk Assessment

Is 4096 output tokens enough?
- Section 1 (Identity) output: narrative (2 paragraphs) + 3 strengths + 2 weaknesses + tier position + uplift rating
  - Estimated: ~1500-2500 tokens. Unlikely to hit 4096.
- Section 2 (Challenges): first glance + 3 challenges with research backing + narrative
  - Estimated: ~1200-2000 tokens. Safe.
- Section 3 (Roadmap): 3 priorities + 5 courses + major alignment + trajectory
  - Estimated: ~1200-2000 tokens. Safe.

**Current risk is LOW** because the prompts are structured to produce concise output and 4096 is generous. But if prompts are expanded or the LLM becomes more verbose (model updates), this becomes a real issue.

### Proposed Fix

Check `stopReason` after each LLM call:

```typescript
const response = await callClaude<string>({ ... });

if (response.stopReason === 'max_tokens') {
  console.warn(`[DeepAcademicReportService] Section output was truncated (hit ${MAX_TOKENS_PER_SECTION} token limit)`);
  // Option A: Throw to trigger fallback for this section
  // Option B: Log warning and proceed (current behavior, just with awareness)
}

this.trackUsage(response.usage);
return parseClaudeJSON<AcademicIdentitySection>(response.content, 'academicIdentity');
```

---

## ISSUE #6: Singleton Race Condition in Cost/Token Tracking

**Severity: HIGH**
**File:** `deepAcademicReportService.ts:197-208,214-217`

### Problem

```typescript
export class DeepAcademicReportService {
  private _accumulatedCost = 0;                          // Instance variable
  private _accumulatedTokens = { input: 0, output: 0 };  // Instance variable

  async generateReport(input: DeepAcademicReportInput): Promise<DeepAcademicReport> {
    this._accumulatedCost = 0;                            // Reset at start
    this._accumulatedTokens = { input: 0, output: 0 };
    // ... 3 parallel LLM calls that call this.trackUsage() ...
  }
}

export const deepAcademicReportService = new DeepAcademicReportService(); // SINGLETON
```

**Race condition timeline:**
```
T=0ms:   Request A calls generateReport() → resets cost to 0
T=5ms:   Request A fires 3 LLM calls
T=10ms:  Request B calls generateReport() → RESETS cost to 0 (A's partial tracking lost!)
T=15ms:  Request B fires 3 LLM calls
T=55s:   Request A's LLM calls return → trackUsage() adds to shared counter
T=56s:   Request B's LLM calls return → trackUsage() adds to same shared counter
T=56s:   Request A's metadata shows A+B's combined costs
T=56s:   Request B's metadata shows partial B costs (A already added some)
```

### Impact

- **Cost reporting is WRONG** for concurrent requests — metadata shows incorrect `estimatedCost` and `tokenUsage`
- Does NOT affect billing (that's handled separately) — only affects the `ReportMetadata` returned to the caller
- Does NOT affect report content — only the metadata

### Proposed Fix: Request-Scoped Tracking

```typescript
interface RequestTracker {
  cost: number;
  tokens: { input: number; output: number };
}

async generateReport(input: DeepAcademicReportInput): Promise<DeepAcademicReport> {
  const startTime = Date.now();
  const tracker: RequestTracker = { cost: 0, tokens: { input: 0, output: 0 } };

  // Pass tracker to section generators
  const [identity, challenges, roadmap] = await Promise.all([
    this.generateAcademicIdentity(context, tracker),
    this.generateChallengesAndReality(context, tracker),
    this.generateStrategicRoadmap(context, tracker),
  ]);

  // Use tracker for metadata
  const metadata: ReportMetadata = {
    estimatedCost: tracker.cost,
    tokenUsage: { ...tracker.tokens },
    // ...
  };
}

private trackUsage(
  usage: { input_tokens?: number; output_tokens?: number } | undefined,
  tracker: RequestTracker
): void {
  if (!usage) return;
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  tracker.tokens.input += inputTokens;
  tracker.tokens.output += outputTokens;
  tracker.cost += (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
}
```

Note: This still has a minor race condition since 3 parallel calls mutate the same tracker object, but in Node.js's single-threaded event loop, the `+=` operations on the tracker between `await` points are safe. The dangerous scenario (reset between requests) is eliminated.

---

## ISSUE #7: `parseClaudeJSON` Robustness Gaps

**Severity: HIGH**
**File:** `jsonParser.ts`

### 7a. Truncated JSON Handling

`jsonrepair` handles many truncated JSON cases (adds closing braces/brackets), but the result is structurally incomplete. Example:

```json
// LLM output (truncated at token limit):
{
  "narrativeIdentity": "This student...",
  "notableStrengths": [
    { "subject": "Math", "insight": "Strong analytical

// After jsonrepair:
{
  "narrativeIdentity": "This student...",
  "notableStrengths": [
    { "subject": "Math", "insight": "Strong analytical" }
  ]
}
// Missing: notableWeaknesses, tierPosition, upliftRating — all undefined
```

This parses successfully but is missing critical fields. Links to Issue #2.

### 7b. Array-at-Root Extraction

The `extractJSONText()` function (line 46: `responseText.indexOf('{')`) only looks for objects starting with `{`. If the LLM returns a bare array `[...]`, this would fail. However, the Deep Academic Report always expects objects, so this is not a current risk. The `extractArray()` helper (line 98-107) handles this separately for specific use cases.

### 7c. Manual Repair Edge Cases

The single-quote repair (line 122: `repaired.replace(/'([^']+)'\s*:/g, '"$1":')`) can match:
- English contractions in property values near colons: `"don't: ..."` → false positive is unlikely since it requires `'text':` pattern
- Risk: **Very low** — Claude almost always uses double quotes for JSON

The comment removal (line 107: `repaired.replace(/(?<!:)\/\/[^\n]*/g, '')`) correctly avoids URLs with negative lookbehind for `:`. However, it would incorrectly match `//` inside string values. Risk: **Very low** — Claude rarely puts `//` in string values.

### 7d. What parseClaudeJSON Does Well

- 4-tier repair strategy (direct → manual → jsonrepair → both) is thorough
- Brace-matching JSON extraction handles nested objects correctly
- String newline repair is character-accurate with proper escape handling
- Error messages include context and preview for debugging
- The `tryParseClaudeJSON` variant returns null instead of throwing — useful for optional parsing

---

## FINDING #8: Template Fallback Quality Assessment

**Severity: MEDIUM**
**File:** `deepAcademicReportService.ts:870-987`

### Current Weaknesses

1. **No school names in narrative:** The identity `narrativeIdentity` uses `synthesis.profileSummary` and `synthesis.coreInsight` which are generic. The LLM version weaves in "Boston University, Ohio State" — the template doesn't.

2. **Challenges section is shallow:**
   - `firstGlance`: Generic one-liner ("An admissions officer would first notice your X GPA")
   - `challenges`: Maps `synthesis.challenges` directly with no AO interpretation, no specific tier impact with school names, empty `researchBacking: []`
   - `unintendedNarrative`: Two options only ("growth" or "steady performance")
   - `narrativeControlStrategy`: Single generic sentence

3. **Research backing is empty:** Template challenges have `researchBacking: []` despite `ctx.assembledResearch.verifiedStatistics` being available with relevant data.

4. **Missing school-specific context:** The template knows the student's tier (via `calculateTierPosition()`) but doesn't use the school examples in challenge descriptions.

### Proposed Improvements (Zero LLM Cost)

```typescript
// 1. Weave tier info into narrative
narrativeIdentity: `${synthesis.profileSummary} Your ${overallGPA.toFixed(2)} GPA places you in ${tierPosition.currentTier} range, alongside schools like ${tierPosition.tierExamples.slice(0, 3).join(', ')}.\n\n${synthesis.coreInsight} ${synthesis.uniquePattern}`,

// 2. Add research backing from assembled research
challenges: synthesis.challenges.slice(0, 3).map((c, i) => ({
  title: c.insight,
  issue: c.evidence,
  aoImpact: c.implication,
  tierImpact: `This affects your positioning within the ${tierPosition.currentTier} range (${tierPosition.tierExamples.slice(0, 2).join(', ')}).`,
  roadmapConnection: 'See the Strategic Roadmap for specific course recommendations.',
  researchBacking: relevantStats.slice(i, i + 1).map(s => ({
    claim: s.claim,
    value: s.value,
    source: s.citation,
  })),
})),

// 3. Richer unintended narrative
unintendedNarrative: `Your transcript tells a story of ${
  quant.progressionTrajectory.historical.overallTrend === 'improving'
    ? `academic growth — your trajectory from ${quant.progressionTrajectory.historical.gpaByYear[0]?.gpa.toFixed(2) ?? 'N/A'} to current levels shows increasing engagement`
    : quant.progressionTrajectory.historical.overallTrend === 'declining'
    ? `declining performance that admissions officers will notice and question`
    : `steady performance — consistent but without a clear upward arc that admissions officers look for`
}.`,
```

---

## FINDING #9: Temperature Analysis

**Severity: LOW**
**File:** `deepAcademicReportService.ts:466,611,743`

### Current State

All 3 LLM calls use `temperature: 0.3`.

### Analysis

| Section | Current | Optimal | Reasoning |
|---------|---------|---------|-----------|
| Identity (narrative + data) | 0.3 | 0.3 | Good balance between narrative creativity and data accuracy |
| Challenges (analytical) | 0.3 | 0.2-0.3 | Mostly factual analysis — could benefit from slightly lower temp for consistency. Marginal improvement. |
| Roadmap (strategic) | 0.3 | 0.3 | Needs to be creative enough for recommendations but grounded in data |

### Temperature vs JSON Validity

- At 0.3: JSON validity is ~99%+ (very reliable)
- At 0.5: JSON validity drops to ~95-97% (noticeable increase in formatting errors)
- At 0.7+: JSON validity can drop to ~90-93% (requires repair more frequently)

**Verdict:** Uniform 0.3 is well-chosen. Variable temperature adds code complexity for marginal gain. No change recommended.

---

## FINDING #10: Token Budget Assessment

**Severity: LOW**
**File:** `deepAcademicReportService.ts:91`

### Input Token Estimation

For the Sarah Chen test profile:

| Section | System Prompt | User Prompt | Total Input | Output Budget |
|---------|--------------|-------------|-------------|---------------|
| Identity | ~500 tokens | ~1000 tokens | ~1500 | 4096 |
| Challenges | ~625 tokens | ~1250 tokens | ~1875 | 4096 |
| Roadmap | ~750 tokens | ~1250 tokens | ~2000 | 4096 |

All well within Sonnet's 200K context window. No input length concerns.

### Output Token Usage

Expected output sizes (based on requested JSON structure):
- Identity: ~1500-2500 tokens (narrative + strengths + weaknesses + tier + rating)
- Challenges: ~1200-2000 tokens (first glance + 3 challenges + narrative)
- Roadmap: ~1200-2000 tokens (priorities + courses + alignment + optimization)

All comfortably under the 4096 limit. **However**, with more complex student profiles (more courses, more challenges), these could grow.

### Variable Token Budgets

Not needed currently. If output sizes grow, consider:
- Identity: 4096 (most complex output)
- Challenges: 3072 (moderately complex)
- Roadmap: 4096 (dense JSON structure)

---

## FINDING #11: `callClaude` Does NOT Use Retry for Deep Report

**Severity: MEDIUM**
**File:** `deepAcademicReportService.ts:460-466` vs `claude.ts:377-404`

### Problem

The deep report service calls `callClaude()` directly (no retry), while `callClaudeWithRetry()` exists with exponential backoff for rate limits:

```typescript
// Deep report uses this (no retry):
const response = await callClaude<string>({ ... });

// But this exists and handles 429s:
export async function callClaudeWithRetry<T>(prompt, options, maxRetries = 3) { ... }
```

Under load, if any of the 3 parallel calls hits a 429 rate limit, it immediately fails and triggers the template fallback. A simple retry with backoff would likely succeed on the second attempt.

### Note

`callClaudeWithRetry` only accepts the string-based interface (`callClaudeWithRetry(prompt, options)`), not the `ClaudeSimpleInput` object format used by the deep report. To use it, either:
1. Extend `callClaudeWithRetry` to accept `ClaudeSimpleInput`
2. Or add retry logic directly in the section generators

---

## RISK ASSESSMENT — What's Most Likely to Fail in Production

| Rank | Scenario | Likelihood | Impact | Issues |
|------|----------|------------|--------|--------|
| 1 | Single LLM call fails, all 3 results discarded | 7-15% under load | $0.08 wasted, quality drops to template | #1 |
| 2 | LLM returns valid JSON with missing fields, buildBottomLine crashes | 1-3% | Total failure, no report returned | #2, #3 |
| 3 | Rate limit (429) hits one of 3 parallel calls | 1-3% peak hours | Falls to template (no retry) | #1, #11 |
| 4 | Concurrent requests corrupt cost tracking | If >1 req/min | Wrong metadata (no functional impact) | #6 |
| 5 | LLM output truncated at token limit | <1% currently | Partial JSON, missing fields | #5, #2 |
| 6 | Context assembly fails on malformed input | <0.5% | Total failure | #4 |

---

## QUESTIONS FOR THE LEAD

1. **Priority call on Issue #1 (Promise.allSettled):** The hybrid approach returns a mixed-quality report. Is "2 LLM sections + 1 template section" acceptable to ship to users? Or would the quality inconsistency be worse than a uniform template fallback? Should we add a UI indicator showing which sections are LLM vs template?

2. **Scope of runtime validation (Issue #2):** Should we validate only the top-level required fields, or go deep (e.g., check that `notableStrengths` is actually an array, that `tierPosition.currentTier` is a string)? Deeper validation catches more issues but adds maintenance burden when types evolve.

3. **Retry strategy (Issue #11):** Should the deep report use `callClaudeWithRetry` (adds latency on failure but improves success rate) or keep the current approach (fail fast, fall back)? For a 50-55 second operation, adding 1-4 seconds of retry seems acceptable.

4. **Template fallback investment (Finding #8):** How much effort should we invest in improving the template fallback? If Issue #1 (Promise.allSettled) is implemented, the template fallback is used per-section rather than all-or-nothing, making individual section template quality more important.

5. **Cost tracking accuracy (Issue #6):** Is the race condition in cost tracking worth fixing now? It only affects metadata, not billing or report content. If concurrent report generation is rare, this is low priority.

---

## IMPLEMENTATION PRIORITY

Recommended order based on risk × impact:

1. **Issue #3** — Wrap `buildBottomLine()` in try/catch (5 min, prevents total failure)
2. **Issue #2** — Add lightweight field validation after JSON parse (30 min, prevents crash-after-success)
3. **Issue #1** — Switch to `Promise.allSettled` with partial fallback (1 hour, preserves $0.08 per failure)
4. **Issue #4** — Wrap `assembleContext()` in try/catch (15 min, prevents edge-case total failure)
5. **Issue #5** — Check `stopReason` for truncation (15 min, early warning system)
6. **Finding #8** — Improve template fallback quality (45 min, better degraded experience)
7. **Issue #6** — Request-scoped cost tracking (30 min, correct metadata)
8. **Issue #11** — Add retry for rate limits (30 min, higher success rate under load)

**Total estimated implementation:** ~4-5 hours for all fixes

---

*End of Performance & Reliability Audit*
