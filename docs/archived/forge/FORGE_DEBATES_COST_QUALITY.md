# Forge Debates: Essay Intelligence V2 — Cost & Quality Optimization
**Date**: 2026-03-18 | **Pipeline**: Gap Analysis -> Agent A (Direct Path) + Agent B (Rethink Path) -> Reality Checker

---

## GAP-1: Edit Processing JSON Parsing Broken

### Agent A (Direct)
Replace `parseJsonDefensive()` with `parseLlmJsonOutput()` from shared parser. Delete local parser function. 4 code changes.

### Agent B (Rethink)
Enable `useJsonMode: true` on the Sonnet call at line 1275. This makes `callClaude` parse internally — pre-parsed object arrives, no parsing chain needed. Also swap to shared parser as safety net.

### Verification Findings
- **parseJsonDefensive** exists at `editUnderstandingService.ts:1051-1085` — confirmed local 4-level parser
- **useJsonMode: false** confirmed at line 1275
- **parseLlmJsonOutput** at `llmJsonParser.ts:31` — confirmed handles pre-parsed objects at line 35
- **callClaude useJsonMode** at `claude.ts:534-577` — confirmed 4-level internal parsing with truncation repair (jsonrepair, regex extraction, `repairTruncatedJSON`)
- The `callClaude` internal parser at line 569 includes `repairTruncatedJSON()` which the local parser LACKS — this handles maxTokens truncation, a real failure mode

### Decision: HYBRID
Agent B's `useJsonMode: true` is the primary fix because it unlocks `repairTruncatedJSON()` which `parseJsonDefensive` doesn't have. Agent A's consolidation on shared parser provides the safety net. Both together: `useJsonMode: true` gets the pre-parsed object, `parseLlmJsonOutput()` handles any edge cases, local parser deleted.

---

## GAP-2: Escalation Ladder Skips Level 3

### Agent A (Direct)
Merge the `else if (!holisticShift)` and `else` branches so Level 3 always runs first.

### Agent B (Rethink)
Replace boolean `rippleFlags` with confidence spectrum (0-1 floats). Threshold-based escalation.

### Verification Findings
- **Escalation code** at `focusedAnalyzer.ts:1099-1220` — carefully traced all 4 branches
- **Level 1** (line 1104): `!beyondSentence` — sentence-only, no ripple. Correct.
- **Level 2** (line 1109): `!beyondParagraph` — beyond sentence, not beyond paragraph. Correct.
- **Level 3** (line 1161): `!holisticShift` — beyond paragraph, not holistic. Correct.
- **Level 4** (line 1215): `else` — holistic shift. Correct.
- **Level 2->3 upgrade** (lines 1149-1152, 1222-1265): When Level 2 re-walk reveals cross-paragraph ripple, upgrades to Level 3 AND runs holistic synthesis. Has `synthesisCompleted` guard. Correct.
- **The actual bug**: When Level 3 fires DIRECTLY (beyondParagraph=true from the initial delta), the edited paragraph is NOT re-walked. Level 2's re-walk is skipped because the condition jumps past it. But the paragraph still has OLD walk output from the original analysis. Holistic synthesis runs on stale walk data.
- Agent A's merge would break the escalation model — Level 3 IS a distinct state from Level 4
- Agent B's confidence spectrum is massive over-engineering — the 4 boolean states correctly model the escalation space

### Decision: REFINED
Neither agent found the actual bug. The fix is adding a paragraph re-walk at the START of the Level 3 direct-entry branch, before holistic synthesis runs. This is a surgical 15-line addition.

---

## GAP-3: Silent Failure in Focused Analyzer

### Agent A (Direct)
Add `error?: string` field to `FocusedAnalysisResult`. Populate in catch block.

### Agent B (Rethink)
Add Haiku repair call. Add `failureInfo` field with step, error, rawOutputLength, haikuRepairAttempted.

### Verification Findings
- **FocusedAnalysisResult** at `focusedAnalyzer.ts:126-151` — confirmed no `error` field
- `understandingDelta: null` at line 142 is ambiguous — could be LLM failure OR genuine no-change
- Catch blocks at ~875 and ~1065 log errors but continue silently
- Callers in `reanalysisOrchestrator.ts:933` have no way to distinguish failure from no-change
- **HAIKU constant** confirmed available in focusedAnalyzer at line 36 (imported from claude.ts)
- Haiku repair is cheap (~$0.001) and potentially recoverable — the raw text often has salvageable JSON

### Decision: HYBRID
Agent A's simple `error` field for visibility, plus Agent B's Haiku repair for self-healing. The full `failureInfo` object is over-specified — `error?: string` + `haikuRepairAttempted?: boolean` suffices.

---

## GAP-4: Stage 4a Sonnet -> Haiku

### Agent A (Direct)
Single line change: `model: SONNET` -> `model: HAIKU` at line 2068.

### Agent B (Rethink)
Haiku triage (classify if context needs Sonnet) + conditional Sonnet.

### Verification Findings
- **Line 2070**: confirmed `model: SONNET` for new_context Stage 4
- **The call's purpose** (lines 2045-2066): integrate new context into understanding, identify affected sections, produce integration notes, accumulate context narrative. This requires reasoning about how new information changes holistic understanding.
- **Haiku quality for this task**: Haiku can classify ("does this need deeper analysis?") but cannot reliably produce the `affectedSections` and `integrationNotes` that Sonnet produces. Switching all calls to Haiku would degrade quality.
- **Triage feasibility**: Many new_context messages are trivial ("I meant my mom, not dad", "the internship was in summer"). Haiku can accurately classify these as not needing Sonnet.
- **Cost: $0.03-0.05 per Sonnet call vs $0.001 for Haiku triage**

### Decision: RETHINK
Agent B's triage approach is correct — preserve Sonnet quality for meaningful context while using Haiku to gate trivial messages. Agent A's blanket downgrade would lose quality.

---

## GAP-5: L3.75 SHARED_PREAMBLE Billed Twice

### Agent A (Direct)
Skip — $0.001 savings not worth core API changes.

### Agent B (Rethink)
Make system prompts identical by moving phase schemas to user prompt.

### Verification Findings
- **SHARED_PREAMBLE** at `holisticSynthesis.ts:238-268` — 30 lines, ~270 tokens
- **Phase A system prompt** (line 274): `${SHARED_PREAMBLE}` + Phase A schema (~600 tokens)
- **Phase B system prompt** (line 447): `${SHARED_PREAMBLE}` + Phase B schema (~500 tokens)
- The system prompts differ by ~1100 tokens (Phase A schema vs Phase B schema). Cache key misses on Phase B.
- **Savings**: 270 tokens * $0.30/M = $0.000081 per analysis pass
- Agent B's approach would work but adds complexity to the prompt structure for $0.0001

### Decision: DIRECT (skip)
$0.0001 does not justify touching the caching architecture.

---

## GAP-6: L3.5 Static Calibration Example

### Agent A (Direct)
Remove BAD/GOOD example, replace with procedural instructions.

### Agent B (Rethink)
Replace with meta-instruction (2 lines).

### Verification Findings
- **Lines 413-414**: BAD/GOOD calibration pair
- **BAD** (line 413): "This essay has some strong and some weak moments. I will use the full scoring range." — 17 words
- **GOOD** (line 414): "This essay's craft ceiling is P4S2's 'I couldn't pick up my violin without my stomach clenching' — embodied, precise..." — 71 words, references specific P4S2 text and P0S1 text
- **These are NOT static essay examples** — they are meta-calibration examples teaching the LLM what essay-specific calibration LOOKS LIKE. The P4S2/P0S1 references are illustrative.
- **The scoring calibration examples** at lines 326-336 (38/52/72/88 scores) are the actual essay-level anchors and serve a different purpose.
- Both sets are pedagogically necessary. ~90 tokens at $0.0001 per call.

### Decision: RETHINK (no change)
Agent B correctly identified these as meta-calibration examples that teach the calibration PROCESS, not static scoring anchors.

---

## GAP-7: Deep Dive Library Duplication

### Agent A (Direct)
Add placeholder markers (`{{SHARED_OUTPUT_FORMAT}}`), `renderSystemPrompt()` substitutes at call time.

### Agent B (Rethink)
Create `UNIFIED_DEEP_DIVE_SYSTEM_PROMPT`, move template-specific instructions to `investigationInstructions` field.

### Verification Findings
- **SHARED_OUTPUT_FORMAT** appears 21 times in deepDivePromptLibrary.ts (1 definition + 20 usages)
- **UNDERSTANDING_ONLY_BLOCK** appears in many template systemPrompts
- Each template's `systemPrompt` = shared blocks + domain-specific investigation instructions (~200-400 tokens unique per template)
- **Agent A's approach**: templates still have DIFFERENT system prompts after substitution. No cache hits.
- **Agent B's approach**: all templates share the SAME system prompt. Domain instructions move to user prompt. Cache hits across template dispatches.
- **Cache savings**: ~1500-2000 tokens of system prompt * $0.30/M = ~$0.0005 per cache hit. Over 3-5 deep dives per growth cycle: $0.002-0.005 savings.

### Decision: RETHINK
Agent B's approach achieves the actual goal (cross-template cache hits). Agent A's approach only reduces memory footprint.

---

## GAP-8: No Per-Round Cost Tracking

### Agent A (Direct)
Add `editCost?: number` and `analysisMode?: string` to `VersionRecord`.

### Agent B (Rethink)
Add `RoundCostRecord` interface with round, mode, totalCost, breakdown, escalationLevel, cacheHitRate. Track in `ProfileIndex.costHistory[]` + `totalSessionCost`.

### Verification Findings
- **VersionRecord** at `profileTypes.ts:1351-1389` — confirmed no cost fields
- **editHistory: VersionRecord[]** at line 1705 — array of version records on the profile
- **FocusedAnalysisResult** at `focusedAnalyzer.ts:126-151` — already has `totalCost` and `escalationLevel`
- **editCost derivation**: `focusedResult.totalCost` or comprehensive pipeline cost — both available at VersionRecord creation time
- **Agent B's additions**: `costHistory[]` on ProfileIndex would duplicate data derivable from `editHistory[].editCost`. `cacheHitRate` would require changes to `callClaude` return types. `totalSessionCost` is a simple reduce.

### Decision: HYBRID
Agent A's minimal 2-field approach plus `escalationLevel` from the existing type. No new interfaces. Agent B's full tracking infrastructure is over-engineered.

---

## GAP-9: Session Events Unbounded

### Agent A (Direct)
After push, if >50 events: keep 3 oldest + 10 newest + all significance>0.8.

### Agent B (Rethink)
`evictLowSignificanceEvents()` helper: cap at 100, protect last 10, evict lowest-significance from remainder.

### Verification Findings
- **SessionEvent** at `profileTypes.ts:2089-2102` — has `turn`, `kind`, `summary`, `significance`, `paragraphRefs`, `findingRefs`
- **events.push** at `coachingService.ts:2630` — unbounded push
- **retrieveRelevantEvents** at line 2658 — already filters to 12 events for prompt injection, BUT full array is still stored/serialized
- **Cap choice**: 50 (Agent A) vs 100 (Agent B). Most coaching sessions are 10-30 turns. Cap of 50 could evict events in extended sessions. 80 is a better balance.
- **Protection strategy**: Both agents protect recent events and high-significance. Agent A also protects oldest (session establishment context), which is valuable.

### Decision: HYBRID
Agent A's protection strategy (oldest + newest + significant) with cap of 80 (between A's 50 and B's 100). Clean implementation without while loops.

---

## GAP-10: L3 Walk Examples

### Agent A (Direct)
Reduce from 5 to 3 examples, save ~200 tokens.

### Agent B (Rethink)
No change — re-counted and found 11 examples across 5 categories, all pedagogically necessary.

### Verification Findings
- **Lines 190-199**: 3 STRUCTURAL/ARCHITECTURAL upgrade pairs = 6 examples showing the upgrade pattern
- **Lines 234-238**: 1 GOOD connection investigation + 1 BAD investigation = 2 examples
- **Lines 223-226**: 1 back-propagation example (before/after)
- **Line 261**: 1 index convention example (P2S3 -> paragraph:1, sentence:2)
- **Total**: 11 examples across 5 categories (upgrade, connection, back-prop, grounding, indexing)
- The upgrade examples are the CORE teaching tool — they demonstrate the structural-to-architectural quality bar that defines L3 output quality
- **System prompt is cached** across all paragraph calls, so cost is amortized: ~200 tokens / N paragraphs per walk

### Decision: RETHINK (no change)
Agent B's re-count is correct. Agent A's proposal was based on incorrect counting.

---

## GAP-11: L5 readingStrategy Caching

### Agent A (Direct)
Move just `readingStrategy` from `buildSystemPrompt()` to `buildSharedContext()`.

### Agent B (Rethink)
Move ALL essay-specific content out of system prompt. System prompt becomes one of 5 phase-level templates.

### Verification Findings
- **buildSystemPrompt** at `deepAnnotationService.ts:515-643` — essay-specific content:
  - Lines 520-533: readingStrategy section (essay-specific)
  - Line 562: `phase.reasoning` (essay-specific — reasoning is per-essay, not per-phase)
  - Line 563: `phase.focusAreas` (essay-specific — focus areas differ by essay analysis results)
  - Line 564: `phase.deferredAreas` (essay-specific)
  - Line 565: `phase.coachingLens` (essay-specific)
- **Lines 536-560**: Phase-independent instructions (annotation philosophy, teaching modes, phase LEVEL name). These could be one of 5 templates.
- **Agent A's scope**: Moving only readingStrategy still leaves phase reasoning/focus/deferred/lens in the system prompt. System prompt remains essay-specific. No cross-essay cache hits.
- **Agent B's scope**: Moving ALL essay-specific content. System prompt = phase-level template. Cross-essay cache hits when two essays share the same phase level.
- **Risk check**: The phase `description` at line 560 comes from `PHASE_GUIDANCE[phase.level]`, which IS phase-level (not essay-specific). This can stay in the system prompt.

### Decision: RETHINK
Agent B correctly identified the full scope. Moving only readingStrategy (Agent A) defeats the purpose.

---

## Key Insights

1. **The escalation ladder bug was misdiagnosed by both agents.** Neither recognized that Level 3 direct entry skips the paragraph re-walk that Level 2 provides. The fix is surgical — 15 lines, not a model redesign.

2. **useJsonMode: true is the real fix for GAP-1.** The `callClaude` internal parser includes `repairTruncatedJSON()` which handles maxTokens truncation — a failure mode the local `parseJsonDefensive` cannot handle. This is why useJsonMode is more than a "style preference."

3. **Agent B's "no change" calls on Gaps 6 and 10 were correct.** Both required re-counting/re-reading the actual code rather than trusting the gap descriptions. The gap descriptions mischaracterized the examples as "static" when they are "meta-instructional."

4. **Cost optimization has diminishing returns beyond Item 4.** The Haiku triage for new_context (Item 4) saves ~$0.025/call and is the highest-ROI change. All other cost items save <$0.005 each. The quality/reliability fixes (Items 1-3) are more impactful than the cost items.

5. **Agent B consistently over-engineered.** Confidence spectrums, full RoundCostRecord interfaces, comprehensive cost tracking infrastructure — all valid ideas for a larger system, but the incremental value over simpler solutions is low and the implementation cost is high.
