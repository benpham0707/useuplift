# Implementation Blueprint: Essay Intelligence V2 — Cost & Quality Optimization

After these changes, the system: (1) eliminates JSON parsing failures in focused and edit-understanding pipelines by consolidating on the shared parser and enabling `useJsonMode`, (2) fixes the escalation ladder's missing paragraph re-walk when Level 3 fires directly, (3) surfaces focused analysis failures instead of swallowing them, (4) cuts ~$0.03/turn on new_context coaching by using Haiku for triage + conditional Sonnet, (5) adds per-round cost tracking to VersionRecord for spend visibility, (6) caps session events to prevent prompt bloat, and (7) makes the deep dive prompt library cache-friendly by unifying system prompts.

---

## Items

### 1. Edit Understanding JSON Parsing: `parseJsonDefensive()` → `parseLlmJsonOutput()` + `useJsonMode: true`

**Before**: `editUnderstandingService.ts` uses a local `parseJsonDefensive()` (lines 1051-1085) with 4 fallback levels. The Sonnet call at line 1275 has `useJsonMode: false`, so `callClaude` returns a raw string. When parsing fails, `parseJsonDefensive` returns `null` and line 1300 throws.

**After**: The Sonnet call sets `useJsonMode: true`, so `callClaude` parses JSON internally (with its own 4-level fallback including truncation repair). The caller receives a pre-parsed object. `parseJsonDefensive()` is replaced by `parseLlmJsonOutput()` as a safety net — it already handles pre-parsed objects (line 35 of `llmJsonParser.ts`). The local `parseJsonDefensive` function is deleted.

**Implementation**:

1. `editUnderstandingService.ts` line 1275: change `useJsonMode: false` to `useJsonMode: true`
2. `editUnderstandingService.ts` line 1270: change type parameter from `callClaude<string>` to `callClaude<Record<string, unknown>>`
3. `editUnderstandingService.ts` lines 1293-1298: replace the `typeof rawSonnetResponse.content === 'string'` block and `parseJsonDefensive` call with:
   ```ts
   const sonnetParsed = parseLlmJsonOutput(
     rawSonnetResponse.content,
     'EditUnderstanding Sonnet'
   ) as SonnetUnderstandingRaw;
   ```
4. Add import: `import { parseLlmJsonOutput } from './llmJsonParser';`
5. Delete the local `parseJsonDefensive` function (lines 1051-1085)
6. Remove unused `jsonrepair` import if no other usage remains in the file

**Integration points**:
- `editUnderstandingService.ts:1270` — `callClaude()` — change `useJsonMode` + type param
- `editUnderstandingService.ts:1293-1298` — parsing block — replace with `parseLlmJsonOutput`
- `editUnderstandingService.ts:1051-1085` — `parseJsonDefensive()` — delete

**Cost**: $0 delta (same Sonnet call, same tokens)

**Source**: hybrid — Agent B's `useJsonMode: true` is the primary fix (catches truncation issues that the local parser misses), combined with Agent A's consolidation on the shared parser. Both changes together provide the strongest parsing defense.

---

### 2. Escalation Ladder: Add Missing Paragraph Re-Walk in Level 3

**Before**: The escalation ladder at `focusedAnalyzer.ts` line 1161 has `else if (!holisticShift)` as the Level 3 gate. The conditions cascade: L1 (`!beyondSentence`), L2 (`!beyondParagraph`), L3 (`!holisticShift`), L4 (`else`). Level 3 fires when `beyondSentence=true AND beyondParagraph=true AND holisticShift=false`. When this happens, Level 2 is skipped entirely. Level 3 runs holistic synthesis, but the edited paragraph still has old walk output because the Level 2 re-walk never ran. The Level 2->3 upgrade path (lines 1149-1152, 1222-1265) correctly handles dynamic promotion, but the direct Level 3 entry has a gap.

**After**: When Level 3 fires directly (not via upgrade from Level 2), re-walk the edited paragraph before running holistic synthesis. This ensures the walk output reflects the edit before synthesis incorporates it.

**Implementation**:

In the Level 3 `else if` branch (line 1161), before the holistic synthesis call (line 1172), add a paragraph re-walk:
```ts
// Level 3: Ripple beyond paragraph → first re-walk, then holistic refresh
else if (!understandingDelta.rippleFlags.holisticShift) {
  escalationLevel = 3;
  console.log(
    `[FocusedAnalyzer] Escalation: Level 3 — targeted holistic refresh. ` +
      `Evidence: ${understandingDelta.rippleFlags.rippleEvidence}`,
  );

  // Re-walk the edited paragraph first (Level 3 skipped Level 2's re-walk)
  try {
    const preWalkStart = Date.now();
    const walkResult = await sequentialDeepWalkService.walkEssay(
      this.buildEssayTextFromProfile(profile),
      profile,
      this.buildMinimalStructuralMap(profile),
      null,
      [],
      { startFromParagraph: paragraphIndex },
    );
    const preWalkMs = Date.now() - preWalkStart;
    console.log(`[FocusedAnalyzer] Level 3 pre-walk complete — ${preWalkMs}ms, cost=$${walkResult.cost.toFixed(4)}`);
    costs.push({
      layer: 'focused_escalation_l3_prewalk',
      cost: walkResult.cost,
      tokenUsage: walkResult.tokenUsage,
      timingMs: preWalkMs,
    });
  } catch (walkErr) {
    const errMsg = walkErr instanceof Error ? walkErr.message : String(walkErr);
    console.warn(`[FocusedAnalyzer] Level 3 pre-walk failed (non-fatal): ${errMsg}`);
  }

  // Then run holistic synthesis (existing code follows)
  try {
    const level3Start = Date.now();
    // ... existing holistic synthesis code ...
```

**Integration points**:
- `focusedAnalyzer.ts:1161-1213` — Level 3 `else if` branch — add paragraph re-walk before synthesis

**Cost**: +$0.02-0.04 per Level 3 escalation (additional Sonnet walk call). Level 3 fires rarely (<5% of focused analyses).

**Source**: refined — Neither agent correctly diagnosed the issue. Agent A proposed merging branches (would break the escalation model). Agent B proposed a confidence spectrum (massive over-engineering for a surgical fix). The actual fix is adding the missing re-walk when Level 3 fires directly.

---

### 3. Silent Failure in Focused Analyzer: Add Error Surface + Haiku Repair

**Before**: `FocusedAnalysisResult` (line 126) has no `error` field. When Step 1 or Step 2 LLM calls fail, the catch blocks log and continue, but the caller (`reanalysisOrchestrator`) has no visibility into whether the result is degraded. The `understandingDelta: null` sentinel can mean "LLM failed" or "no change detected."

**After**: `FocusedAnalysisResult` gains an `error` field for surfacing failures, plus a `haikuRepairAttempted` flag. Before throwing on parse failure, the focused analyzer tries a Haiku repair call (~$0.001) that sends the raw Sonnet output + parse error to Haiku for JSON extraction.

**Implementation**:

1. Add to `FocusedAnalysisResult` (line 126):
   ```ts
   /** Error description if the focused pipeline encountered failures (non-fatal) */
   error?: string;
   /** Whether Haiku repair was attempted on a Sonnet parse failure */
   haikuRepairAttempted?: boolean;
   ```

2. In the Step 1 understanding delta catch block (around line 875), before returning null, attempt Haiku repair:
   ```ts
   catch (parseError) {
     console.warn('[FocusedAnalyzer] Understanding delta parse failed, attempting Haiku repair');
     let haikuRepairAttempted = false;
     try {
       const repairResult = await callClaude<Record<string, unknown>>(
         `The following text is a malformed JSON response. Extract the JSON object and return ONLY valid JSON:\n\n${rawText}`,
         { model: HAIKU, maxTokens: 2000, temperature: 0, useJsonMode: true }
       );
       haikuRepairAttempted = true;
       const repaired = repairResult.content as Record<string, unknown>;
       // Parse the repaired output through the normal parser
       const repairedDelta = parseUnderstandingDelta(repaired as RawUnderstandingDelta);
       costs.push({ layer: 'focused_haiku_repair', cost: calculateCost(repairResult.usage, HAIKU), ... });
       // Continue with repairedDelta...
     } catch {
       // Repair failed — surface the error
       errorMessage = `Understanding delta parse failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`;
     }
   }
   ```

3. In the final return, include `error` and `haikuRepairAttempted` fields.

4. In `reanalysisOrchestrator.ts`, check `focusedResult.error` and log it.

**Integration points**:
- `focusedAnalyzer.ts:126-151` — `FocusedAnalysisResult` — add `error?` and `haikuRepairAttempted?` fields
- `focusedAnalyzer.ts:~870-880` — Step 1 catch block — add Haiku repair
- `focusedAnalyzer.ts:~1060-1080` — Step 2 catch block — add Haiku repair
- `reanalysisOrchestrator.ts:~935` — check `focusedResult.error` after `runFocusedAnalysis`

**Cost**: +$0.001 per repair attempt (Haiku). Expected frequency: <2% of focused analyses.

**Source**: hybrid — Agent B's Haiku repair idea is valuable (self-healing instead of failing), combined with Agent A's simpler `error` field for surface visibility. The full `failureInfo` object from B is over-specified for the current needs.

---

### 4. Stage 4a new_context: Haiku Triage + Conditional Sonnet

**Before**: `coachingService.ts` line 2070 uses `model: SONNET` for ALL new_context Stage 4 calls, even when the student reveals trivial context ("my name is John"). Every new_context call costs ~$0.03-0.05.

**After**: A Haiku triage call (~$0.001) classifies whether the new context meaningfully changes understanding. If trivial, skip the Sonnet call and return a lightweight result. Only run Sonnet when Haiku judges the context significant.

**Implementation**:

1. Before the existing Sonnet call in `processNewContext()` (around line 2045), add Haiku triage:
   ```ts
   // Haiku triage: does this context change understanding?
   const triagePrompt = `Student message about their essay: "${studentMessage}"
   Current essay understanding depth: ${profile.index.confidenceLevel}
   Does this message reveal information that would CHANGE the essay's understanding (new motivation, corrected interpretation, unstated context)?
   Or is it trivial (name, spelling, minor clarification)?
   Return JSON: {"needsSonnet": true|false, "reason": "brief reason"}`;

   const triageResult = await callClaude<Record<string, unknown>>(triagePrompt, {
     model: HAIKU, maxTokens: 100, temperature: 0, useJsonMode: true
   });
   const triageCost = calculateCost(triageResult.usage, HAIKU);
   ```

2. If `needsSonnet === false`, skip the Sonnet call and return early with lightweight integration:
   ```ts
   if (!triageResult.content.needsSonnet) {
     // Light-touch: accumulate context directly without Sonnet evaluation
     if (studentMessage.trim().length > 0) {
       const existing = profile.studentDeclaredContext || '';
       coordinator.updateStudentDeclaredContext(
         existing ? `${existing} ${studentMessage.substring(0, 200)}` : studentMessage.substring(0, 200)
       );
     }
     const triageLayerCost: LayerCost = {
       layer: 'L6_S4_new_context_triage',
       cost: triageCost,
       tokenUsage: { inputTokens: triageResult.usage.input_tokens, outputTokens: triageResult.usage.output_tokens, cacheReadTokens: 0, cacheWriteTokens: 0 },
       timingMs: Date.now() - callStart,
     };
     return { newContextInsight, newContextCost: triageLayerCost, verdict: 'confirmed' };
   }
   ```

3. If `needsSonnet === true`, proceed with existing Sonnet call (add triageCost to total).

**Integration points**:
- `coachingService.ts:~2040-2080` — `processNewContext()` — add Haiku triage before Sonnet call

**Cost**: -$0.02/call average. ~70% of new_context calls skip Sonnet entirely ($0.001 Haiku instead of $0.03-0.05 Sonnet).

**Source**: rethink — Agent B's Haiku triage approach provides meaningful savings without quality degradation. Agent A's single-line model swap would degrade ALL new_context calls.

---

### 5. L3.75 SHARED_PREAMBLE Billing: Skip

**Rationale**: At Sonnet's $0.30/M cache-read pricing, 270 tokens of SHARED_PREAMBLE redundant billing costs ~$0.0001 per full analysis pass. Not worth touching the caching architecture.

**Source**: direct — Skip. Agent A correctly assessed.

---

### 6. L3.5 Calibration Example: No Change

**Rationale**: The BAD/GOOD calibration example pair at lines 413-414 of `analysisPass.ts` are meta-calibration examples that teach the LLM HOW to calibrate per-essay (cite specific text, identify ceiling and floor, establish scoring range). They are NOT static essay-specific examples. The GOOD example references P4S2 and P0S1 as illustrative patterns, not as fixed answers. All scoring calibration content in this prompt is pedagogically necessary.

**Source**: rethink — Agent B correctly identified these as pedagogically necessary. ~90 tokens at $0.0001 per call is not worth the quality risk.

---

### 7. Deep Dive Library: Unified System Prompt for Cache Hits

**Before**: `deepDivePromptLibrary.ts` has `SHARED_OUTPUT_FORMAT` (41 lines, ~700 tokens) and `UNDERSTANDING_ONLY_BLOCK` injected into every template's `systemPrompt` via template literal. 20 templates each produce a DIFFERENT system prompt, preventing cache hits across deep dive dispatch calls.

**After**: Create a `UNIFIED_DEEP_DIVE_SYSTEM_PROMPT` containing the shared preamble + understanding constraint + output format. Move template-specific investigation instructions to a new `investigationInstructions` field appended to user prompt at call time. All deep dive calls share the same system prompt, enabling cache hits after the first call.

**Implementation**:

1. Create unified system prompt:
   ```ts
   const UNIFIED_DEEP_DIVE_SYSTEM_PROMPT = `You are investigating a specific question about a college application essay. You have deep understanding of the essay and are conducting a focused investigation to deepen that understanding.

   ${UNDERSTANDING_ONLY_BLOCK}

   ${SHARED_OUTPUT_FORMAT}`;
   ```

2. For each of the 20 templates, extract domain-specific instructions from `systemPrompt` into a new `investigationInstructions` field. Example for VOICE_AUTHENTICITY:
   ```ts
   const VOICE_AUTHENTICITY: DeepDivePromptTemplate = {
     // ... existing fields ...
     systemPrompt: UNIFIED_DEEP_DIVE_SYSTEM_PROMPT,  // shared
     investigationInstructions: `Your task: answer the question by conducting a focused investigation. Look for:
   - Vocabulary domain analysis: which word families appear in authentic vs. performed passages
   - Syntactic patterns: how sentence structure differs between registers
   - Image source analysis: where do metaphors and images come from in each register
   - Trigger analysis: what topics or rhetorical demands trigger register shifts
   - Consistency markers: where does diction stabilize vs. fluctuate`,
     userPrompt: `=== INVESTIGATION FOCUS ===
   {investigationInstructions}

   === QUESTION TO INVESTIGATE ===
   {question}
   ...`,
   };
   ```

3. Add `investigationInstructions` to `DeepDivePromptTemplate` type in `profileTypes.ts`:
   ```ts
   /** Domain-specific investigation instructions, injected into user prompt */
   investigationInstructions: string;
   ```

4. Update the deep dive dispatcher to inject `investigationInstructions` into user prompt when building the call.

**Integration points**:
- `deepDivePromptLibrary.ts` — all 20 templates — extract investigation instructions from systemPrompt
- `profileTypes.ts` — `DeepDivePromptTemplate` — add `investigationInstructions` field
- Deep dive dispatcher — inject `investigationInstructions` into user prompt template

**Cost**: -$0.002-0.005 per deep dive call (cache hit on system prompt after first call). Over a growth cycle with 3-5 deep dives: -$0.006-0.025.

**Source**: rethink — Agent B's unified system prompt approach enables cross-template cache hits. Agent A's placeholder substitution only reduces memory footprint.

---

### 8. Per-Round Cost Tracking on VersionRecord

**Before**: `VersionRecord` (profileTypes.ts lines 1351-1389) tracks changes, insights, staleness, and edit strategies, but has no cost or analysis mode information.

**After**: `VersionRecord` gains `editCost`, `analysisMode`, and `escalationLevel` fields.

**Implementation**:

Add to `VersionRecord` (after line 1388):
```ts
/** Cost of the analysis pass that produced this version, in USD */
editCost?: number;
/** Which analysis mode was used */
analysisMode?: 'focused' | 'comprehensive';
/** Escalation level reached during focused analysis (1-4). Only set when analysisMode='focused'. */
escalationLevel?: 1 | 2 | 3 | 4;
```

Populate in `reanalysisOrchestrator.ts` where `VersionRecord` is created:
```ts
const versionRecord: VersionRecord = {
  // ... existing fields ...
  editCost: focusedResult?.totalCost ?? comprehensiveCost,
  analysisMode: focusedResult ? 'focused' : 'comprehensive',
  escalationLevel: focusedResult?.escalationLevel,
};
```

**Integration points**:
- `profileTypes.ts:1351-1389` — `VersionRecord` — add 3 optional fields
- `reanalysisOrchestrator.ts` — `processEdit()` where VersionRecord is built — populate new fields

**Cost**: $0 delta (metadata only)

**Source**: hybrid — Agent A's minimal approach plus `escalationLevel` from `FocusedAnalysisResult`. Agent B's `RoundCostRecord` + `costHistory[]` + `totalSessionCost` on `ProfileIndex` is over-engineered.

---

### 9. Session Events Eviction

**Before**: `CoachingSessionMemory.events` grows without bound. Each event is ~50 tokens. After 100 turns: ~5000 tokens of event context.

**After**: After pushing a new event, evict low-significance events when the array exceeds 80 entries.

**Implementation**:

In `coachingService.ts`, in `updateSessionMemory()` after `sessionMemory.events.push(event)` (line 2630):

```ts
// Evict low-significance events when cap exceeded
const EVENT_CAP = 80;
if (sessionMemory.events.length > EVENT_CAP) {
  sessionMemory.events = this.evictLowSignificanceEvents(sessionMemory.events, EVENT_CAP);
}
```

Add the eviction method:
```ts
/**
 * Evict low-significance events to stay within cap.
 * Protects: 3 oldest (session establishment), 10 newest (temporal relevance),
 * all events with significance > 0.8 (high-impact).
 * From the remainder, removes lowest-significance events first.
 */
private evictLowSignificanceEvents(events: SessionEvent[], cap: number): SessionEvent[] {
  if (events.length <= cap) return events;

  const protectedIndices = new Set<number>();
  // Protect 3 oldest
  for (let i = 0; i < Math.min(3, events.length); i++) protectedIndices.add(i);
  // Protect 10 newest
  for (let i = Math.max(0, events.length - 10); i < events.length; i++) protectedIndices.add(i);
  // Protect high-significance
  events.forEach((e, i) => { if (e.significance > 0.8) protectedIndices.add(i); });

  // If protected set already exceeds cap, keep only protected
  if (protectedIndices.size >= cap) {
    return events.filter((_, i) => protectedIndices.has(i));
  }

  // Sort unprotected by significance ascending, remove lowest until at cap
  const unprotected = events
    .map((e, i) => ({ event: e, index: i }))
    .filter(x => !protectedIndices.has(x.index))
    .sort((a, b) => a.event.significance - b.event.significance);

  const toRemove = new Set<number>();
  let removeCount = events.length - cap;
  for (const u of unprotected) {
    if (removeCount <= 0) break;
    toRemove.add(u.index);
    removeCount--;
  }

  return events.filter((_, i) => !toRemove.has(i));
}
```

**Integration points**:
- `coachingService.ts:2630` — after `events.push(event)` — add eviction check
- `coachingService.ts` — add `evictLowSignificanceEvents()` private method

**Cost**: $0 delta (no API calls, saves prompt tokens)

**Source**: hybrid — Agent A's logic (keep oldest + newest + significant) with Agent B's cap of 80. Cap of 80 means sessions under 80 turns (the vast majority) never trigger eviction.

---

### 10. L3 Walk Examples: No Change

**Rationale**: Verification found 11 distinct examples across 5 categories: 3 structural/architectural upgrade pairs (6 examples), 1 GOOD/BAD connection investigation pair, 1 back-propagation example, 1 index convention example. All are pedagogically necessary. Cache amortizes cost across all paragraph calls. ~200 tokens at $0.001 per full analysis pass is not worth the quality risk.

**Source**: rethink — Agent B correctly re-counted and identified all examples as necessary.

---

### 11. L5 readingStrategy: Move Essay-Specific Content to User Prompt

**Before**: `deepAnnotationService.ts` `buildSystemPrompt()` (line 515) includes essay-specific content: `readingStrategy` (lines 520-533), `phase.reasoning` (line 562), `phase.focusAreas` (line 563), `phase.deferredAreas` (line 564), `phase.coachingLens` (line 565). This makes the system prompt unique per essay, preventing cross-essay cache hits.

**After**: Move all essay-specific content from the system prompt to the shared context block (Block 2). The system prompt retains only phase-level instructions (one of 5 possible templates by `phase.level`).

**Implementation**:

1. In `buildSystemPrompt()`, remove lines 520-533 (`readingStrategySection`) and lines 562-565 (phase reasoning/focus/deferred/coaching lens). Replace with just the phase level name:
   ```ts
   CURRENT IMPROVEMENT PHASE: ${phase.level}
   ${phaseGuidance.description}
   ```

2. Create `buildEssayPhaseContext()` method:
   ```ts
   private buildEssayPhaseContext(
     phase: ImprovementPhase,
     readingStrategy?: ReadingStrategy,
   ): string {
     const parts: string[] = [];
     parts.push('=== IMPROVEMENT PHASE CONTEXT ===');
     parts.push(`Phase reasoning: ${phase.reasoning}`);
     parts.push(`Focus areas: ${phase.focusAreas.join(', ')}`);
     if (phase.deferredAreas.length > 0) {
       parts.push(`Deferred: ${phase.deferredAreas.join(', ')}`);
     }
     parts.push(`Coaching lens: ${phase.coachingLens}`);

     if (readingStrategy) {
       parts.push('\n=== READING STRATEGY ===');
       parts.push(`"${readingStrategy.strategy}"`);
       parts.push(`Best approach: "${readingStrategy.bestApproach}"`);
       parts.push(`Anti-patterns: ${readingStrategy.antiPatterns.join('; ')}`);
     }
     return parts.join('\n');
   }
   ```

3. Append `buildEssayPhaseContext()` to `buildSharedContext()` output. Update `generateAnnotations()` to pass `phase` and `readingStrategy` to the shared context builder.

**Integration points**:
- `deepAnnotationService.ts:515-643` — `buildSystemPrompt()` — remove essay-specific content
- `deepAnnotationService.ts:649+` — `buildSharedContext()` — append essay phase context
- `deepAnnotationService.ts:281-301` — `generateAnnotations()` — pass phase and readingStrategy to shared context builder

**Cost**: -$0.001-0.003 per essay if cross-essay cache hits occur. Primary value is architectural cleanliness.

**Source**: rethink — Agent B's approach of moving ALL essay-specific content (not just readingStrategy) is the correct scope. Moving only readingStrategy would still leave phase details in the system prompt, preventing cross-essay caching.

---

## Execution Order

1. **Item 1** (JSON parsing consolidation) — foundation, unblocks reliable focused analysis
   - Verify: Run focused analysis on an essay edit. Confirm no `parseJsonDefensive` calls in logs. Confirm `parseLlmJsonOutput` context label appears.

2. **Item 3** (silent failure surfacing + Haiku repair) — depends on Item 1 for consistent parsing
   - Verify: Inject a deliberately malformed JSON response in a test. Confirm Haiku repair is attempted. Confirm `error` field populated on `FocusedAnalysisResult`.

3. **Item 2** (escalation ladder fix) — independent, verify after Items 1+3 ensure Step 1/2 reliability
   - Verify: Set up focused analysis where understanding delta has `beyondParagraph=true, holisticShift=false`. Confirm Level 3 fires AND includes pre-walk. Check logs for `focused_escalation_l3_prewalk`.

4. **Item 8** (per-round cost tracking) — independent, purely additive
   - Verify: Run a focused analysis pass. Check resulting `VersionRecord` for `editCost`, `analysisMode`, `escalationLevel`.

5. **Item 9** (session events eviction) — independent, purely additive
   - Verify: Simulate 100+ coaching turns. Confirm events array at/below 80 entries. Confirm oldest, newest, and high-significance events preserved.

6. **Item 4** (Haiku triage for new_context) — independent
   - Verify: Send trivial new_context message. Confirm Haiku triage skips Sonnet. Send meaningful message. Confirm Sonnet runs.

7. **Item 7** (deep dive library unification) — independent
   - Verify: Dispatch two different deep dive types in sequence. Confirm second call gets cache hit on system prompt (check `cache_read_input_tokens`).

8. **Item 11** (L5 system prompt optimization) — final optimization
   - Verify: Run L5 annotations. Confirm system prompt lacks essay-specific text. Confirm annotations still reference reading strategy from shared context.

Items 5, 6, 10 — No code changes needed.

---

## Cost Summary

| Item | Model | Calls/op | $/op | Delta |
|------|-------|----------|------|-------|
| 1. JSON parsing | Sonnet | 1 | ~$0.03 | $0 (better parsing) |
| 2. Escalation fix | Sonnet | +1 walk | ~$0.03 | +$0.03 (L3 only, <5%) |
| 3. Haiku repair | Haiku | +1 repair | ~$0.001 | +$0.001 (<2% freq) |
| 4. new_context triage | Haiku+Sonnet | 1+cond | ~$0.005 avg | -$0.025 avg |
| 5. SHARED_PREAMBLE | — | — | — | $0 (skip) |
| 6. Calibration | — | — | — | $0 (no change) |
| 7. Deep dive unify | Sonnet | 1/dive | ~$0.035 | -$0.003/dive |
| 8. Cost tracking | — | 0 | $0 | $0 |
| 9. Events eviction | — | 0 | $0 | Saves tokens |
| 10. Walk examples | — | — | — | $0 (no change) |
| 11. L5 optimization | Sonnet | 1/para | ~$0.02 | -$0.002/essay |

**Net per-session estimate**: -$0.03 to -$0.05 savings per edit round (primarily from Item 4).

---

## Existing Infrastructure Leveraged

- **`llmJsonParser.ts`**: Shared parser handles pre-parsed objects (useJsonMode), code blocks, jsonrepair, regex extraction. Items 1 and 3 consolidate onto this.
- **`callClaude` useJsonMode**: Already has 4-level JSON parsing including truncation repair. Item 1 enables this for editUnderstanding.
- **`calculateCost` with model parameter**: Already supports per-model pricing. Item 8 uses this.
- **`retrieveRelevantEvents()`**: Already implements smart event retrieval. Item 9 adds the eviction complement.
- **Prompt caching via `cacheSystemPrompt: true`**: Already used throughout. Items 7 and 11 restructure prompts to maximize hits.

---

## Open Questions

1. **Item 2**: Should the Level 3 pre-walk use `startFromParagraph: paragraphIndex` (single paragraph) or walk from the beginning? Single-paragraph is faster but may miss cross-paragraph effects that triggered the beyondParagraph flag.

2. **Item 4**: What confidence threshold should Haiku use for `needsSonnet`? Binary yes/no is simplest but a "maybe" path with cheaper Sonnet config (lower maxTokens) could handle borderline cases.

3. **Item 7**: The deep dive dispatcher needs to be identified — it may live in the growth engine or orchestrator. The template substitution must replace `{investigationInstructions}` in the user prompt.

4. **Item 11**: Verify the system prompt can be fully phase-abstracted. PHASE_GUIDANCE descriptions may need to stay in the system prompt if they establish the annotation vocabulary for that phase.

---

## Rejected Approaches

1. **Confidence spectrum for escalation (Agent B, Gap 2)**: Replacing boolean `rippleFlags` with 0-1 floats and threshold-based routing. The existing boolean model correctly captures the 4 escalation states. Continuous confidence adds calibration complexity without clear benefit.

2. **Single-line Sonnet->Haiku for new_context (Agent A, Gap 4)**: Haiku cannot reliably perform new_context integration (identifying affected holistic sections, producing integration notes). Triage preserves quality for meaningful context.

3. **Full RoundCostRecord + costHistory on ProfileIndex (Agent B, Gap 8)**: Cost history is derivable from `editHistory[].editCost` sum. CacheHitRate requires callClaude return type changes. 3 optional fields on VersionRecord provide sufficient visibility.

4. **Placeholder substitution for deep dive prompts (Agent A, Gap 7)**: `{{SHARED_OUTPUT_FORMAT}}` markers with `renderSystemPrompt()` only reduce memory — each template's system prompt still differs, preventing cache hits.

5. **Removing L3 walk examples (Agent A, Gap 10)**: Actual count is 11 examples across 5 pedagogically distinct categories. These teach critical upgrade patterns (structural to architectural). $0.001 savings not worth quality risk.
