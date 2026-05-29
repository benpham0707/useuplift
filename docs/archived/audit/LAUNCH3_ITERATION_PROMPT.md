# Launch 3 Iteration Prompt — Deep Audit Fix List

> **Paste this into the build chat.** This is the complete, prioritized fix list from a 4-agent deep audit of Launch 3's 5,683 lines across 5 files. Every issue has exact line numbers and concrete fixes.

---

## Context

You previously delivered Launch 3 of the Essay Intelligence System — 5 files totaling 5,683 lines:

| File | Lines | Role |
|------|-------|------|
| `src/services/essayIntelligence/analysis/editUnderstandingService.ts` | 1,235 | Edit diff → understanding pipeline |
| `src/services/essayIntelligence/versionTracker.ts` | 831 | Version lifecycle + staleness tracking |
| `src/services/essayIntelligence/coaching/coachingService.ts` | 1,382 | L6 conversational coaching |
| `src/services/essayIntelligence/analysis/focusedAnalyzer.ts` | 1,373 | Focused/escalation analysis |
| `src/services/essayIntelligence/analysis/reanalysisOrchestrator.ts` | 867 | Top-level lifecycle coordinator |

A 4-agent deep audit found **19 critical**, **15 moderate**, and **14 low** issues. Fix ALL critical and moderate issues. Fix low issues where trivial.

---

## TIER 1: INTEGRATION CONTRACT UNIFICATION (Blocking — nothing works without these)

The reanalysisOrchestrator has ALL peer imports commented out and replaced with local stubs. **Every single stub has at least one field name or type mismatch with the real implementation.** These must ALL be fixed before Launch 4 integration.

### FIX 1.1: Unify `ReanalysisBrief` — ONE definition, THREE locations use it

**Problem:** Three incompatible `ReanalysisBrief` interfaces exist:

1. `deepAnnotationService.ts:157-166` — `{changeSummary, editedParagraphs[], studentIntent, structuralSignificance}`
2. `versionTracker.ts:27-54` — `{netChanges[], structural, studentIntent?, staleAreas[], summaryForPrompt}`
3. `focusedAnalyzer.ts:111-122` — `{editedParagraphIndex, editedSentenceIndex, affectedConnectionIds, conversationContext?, previousAnalysis?}`

The orchestrator imports from `deepAnnotationService` but the real VersionTracker generates the `versionTracker.ts` shape. None are compatible.

**Fix:** Create ONE canonical `ReanalysisBrief` in `profileTypes.ts` that serves all three use cases. The versionTracker shape is the richest — start from that and add any fields the other two need:

```typescript
// profileTypes.ts — THE canonical definition
export interface ReanalysisBrief {
  // From versionTracker (accumulated change summary)
  netChanges: Array<{
    location: { paragraph: number; sentence?: number };
    oldText: string;
    newText: string;
    significance: string;
    changeType: string;
    appearsToHaveReverted?: boolean;
  }>;
  structural: {
    paragraphsChanged: number;
    hasReordering: boolean;
    hasInsertions: boolean;
    hasDeletions: boolean;
    changeScope: 'sentence' | 'paragraph' | 'multi_paragraph' | 'essay_level';
  };
  studentIntent?: string;
  staleAreas: string[];
  summaryForPrompt: string;

  // From focusedAnalyzer (per-edit surgical context)
  editedParagraphIndex?: number;
  editedSentenceIndex?: number;
  affectedConnectionIds?: string[];

  // From deepAnnotationService (L5-friendly summary)
  changeSummary?: string;
  editedParagraphs?: number[];
  structuralSignificance?: string;
}
```

Delete the local definitions from all three files. Import from `profileTypes.ts` everywhere.

### FIX 1.2: Fix `createVersionTracker()` factory signature

**Problem:** Orchestrator stub (line 154-156) calls `createVersionTracker(essayLength, profile)`. Real factory (`versionTracker.ts:826-830`) takes `createVersionTracker(baselineText: string)`.

**Fix:** Update orchestrator call site (line 331) to:
```typescript
const baselineText = profile.paragraphs.map(p => p.text).join('\n\n');
this.versionTracker = createVersionTracker(baselineText);
```

### FIX 1.3: Fix `shouldTriggerReanalysis()` return type

**Problem:** Stub returns `{should: boolean, reason: string}`. Real returns `{shouldTrigger: boolean, reason: string, urgency: 'low'|'medium'|'high'}`.

**Fix:** Update ALL call sites in orchestrator to use `shouldTrigger` instead of `should`. Use `urgency` to modulate debounce timing (high urgency = shorter debounce).

### FIX 1.4: Fix `CoachingResult` shape

**Problem:** 4 mismatches:
- `extractedInsight` → should be `insightExtracted`
- `cost: number` → should be `cost: LayerCost[]`
- `costBreakdown?: LayerCost[]` → doesn't exist on real type
- Missing `totalCost: number`, `profileDeepened: boolean`, `routingRuleUsed: string`

**Fix:** Update the stub type and all call sites:
```typescript
// Use real shape:
totalCost += coachingResult.totalCost;  // NOT .cost
costBreakdown.push(...coachingResult.cost);  // cost IS the breakdown
if (coachingResult.insightExtracted) { ... }  // NOT extractedInsight
```

### FIX 1.5: Fix `EditUnderstandingResult` cost type

**Problem:** Stub has `cost: number`. Real has `cost: LayerCost` (single object, not number).

**Fix:** `totalCost += editResult.cost.cost;` and push the LayerCost to breakdown: `costBreakdown.push(editResult.cost);`

### FIX 1.6: Fix `FocusedAnalysisResult` shape

**Problem:** 3 mismatches:
- `cost: number` → real is `cost: LayerCost[]` with separate `totalCost: number`
- `escalatedToComprehensive?: boolean` → real uses `mode === 'escalated_to_comprehensive'`
- Missing rich fields: `understandingDelta`, `analysisDelta`, `phaseUpdate`, `escalationLevel`

**Fix:** Update orchestrator to use real shape. Check `focusedResult.mode === 'escalated_to_comprehensive'` instead of boolean. Use `focusedResult.totalCost` for cost. Apply `focusedResult.phaseUpdate` and `focusedResult.understandingDelta`/`analysisDelta` to the profile.

### FIX 1.7: Wire `analyzeEssay()` to actually USE the ReanalysisBrief

**Problem:** `analysisOrchestrator.ts:700-706` accepts `_reanalysisBrief` parameter but ignores it (underscore-prefixed).

**Fix:** Forward the brief into the analysis pipeline. At minimum, pass `summaryForPrompt` into the L3 walk and L3.5 analysis prompts as additional context about what changed and why re-analysis was triggered.

### FIX 1.8: Remove ALL stubs, enable real imports

**Problem:** Lines 47-223 in reanalysisOrchestrator.ts are commented-out real imports + local stubs with wrong interfaces.

**Fix:** After fixing 1.1-1.7, uncomment the real imports (lines 47-55), delete ALL stubs (lines 57-223), and verify compilation. Run `npx tsc --noEmit` to catch any remaining mismatches.

---

## TIER 2: CRITICAL ALGORITHM & LOGIC FIXES

### FIX 2.0: Fix `collectCurrentAnalyses` field name mismatches (focusedAnalyzer.ts:1165-1205) — PHASE COMPUTATION SILENTLY RETURNS `distinction` FOR ALL ESSAYS

**Problem:** `collectCurrentAnalyses` reads from `para.analysis` (typed `ParagraphAnalysis`) but accesses WRONG field names:
- `para.analysis.paragraphEffectiveness` → real field is `effectiveness`
- `para.analysis.sentenceAnalyses` → DOES NOT EXIST on `ParagraphAnalysis`
- `para.analysis.paragraphVerdict` → real field is `verdict`
- `para.analysis.holisticAnalysisEvolution` → DOES NOT EXIST on `ParagraphAnalysis`

This means `paragraphEffectiveness` is always `undefined`. When added to the delta (`undefined + delta = NaN`), all paragraph scores become `NaN`. In `deriveImprovementPhase`, `NaN < 55` is `false`, `NaN < 68` is `false`, etc. — the phase ALWAYS falls through to `distinction` regardless of actual essay quality.

**Fix:**
1. Map `ParagraphAnalysis` fields correctly: use `para.analysis.effectiveness` (not `paragraphEffectiveness`), `para.analysis.verdict` (not `paragraphVerdict`)
2. For `sentenceAnalyses`: pull from `para.sentences.map(s => s.analysis)` on the `ParagraphProfile`
3. For `holisticAnalysisEvolution`: this doesn't exist per-paragraph — remove or pull from the holistic synthesis layer
4. Add a NaN guard: `if (isNaN(score)) throw new Error('Phase computation received NaN — field mapping broken')`

**Impact:** Without this fix, every focused analysis reports the essay is at `distinction` phase, and feedback zooms to the wrong level.

### FIX 2.0b: Fix Level 2/3 escalation results being discarded (focusedAnalyzer.ts:939-946, 973-982)

**Problem:** The Level 2 `walkEssay()` call at line 939-946 and the Level 3 `synthesize()` call at line 973-982 both DISCARD their return values. The re-walk and holistic refresh execute but their outputs are never applied to the profile, and their costs are never tracked.

**Fix:**
1. Capture the walkEssay result: `const walkResult = await walkEssay(...);`
2. Track cost: `costs.push(...walkResult.cost);`
3. Apply walk outputs to the understanding delta or surface in the result
4. Same for synthesize: capture, track cost, apply synthesis to holistic sections

### FIX 2.1: Fix escalation ladder dead code (focusedAnalyzer.ts:928-998)

**Problem:** The escalation "ladder" is actually a one-shot decision tree. Level 2 checks `if (beyondParagraph)` at line 952 INSIDE the `else if (!beyondParagraph)` branch — this is always false. Same for Level 3 checking `if (holisticShift)` at line 988 inside `else if (!holisticShift)`.

**Fix:** After executing the Level 2 re-walk, RE-EVALUATE `beyondParagraph` and `holisticShift` from the NEW delta results. Same for Level 3:

```typescript
// Level 2 block:
const reWalkResult = await this.reWalkParagraph(...);
// Re-evaluate ripple flags from reWalkResult
const newBeyondParagraph = reWalkResult.beyondParagraph;
if (newBeyondParagraph) {
  // Upgrade to Level 3
  ...
}
```

### FIX 2.2: Fix `buildMinimalStructuralMap()` invalid cast (focusedAnalyzer.ts:1129-1150)

**Problem:** Returns `{ paragraphCount, wordCount, sentenceCount, paragraphs }` cast as `StructuralCartography` via `as unknown as`. The real `StructuralCartography` has `paragraphRoles`, `arcType`, `transitions`, `centralTheme`, etc. — completely different fields.

**Fix:** Either:
- (A) Build a real minimal StructuralCartography from the profile data (profile has paragraphRoles in L2 output), OR
- (B) Change `walkEssay` to accept a lightweight structural context instead of requiring full StructuralCartography for Level 2 escalation, OR
- (C) Pull the L2 structural cartography from the profile instead of building a minimal one

Option (C) is simplest — the profile already has L2 results stored. Use `profile.structural` if it exists.

### FIX 2.3: Fix Stage 4 output discarded in coaching (coachingService.ts:994-1113)

**Problem:** Stage 4 Sonnet calls for `reinterpretation` (lines 994-1021) and `new_context` (lines 1091-1113) parse the LLM output into a `CONFIRMED/SUPERSEDED/TENSIONED` trichotomy, then DISCARD it. The `ConversationInsight` is built entirely from Stage 1 Haiku metadata. The profile never deepens from coaching.

**Fix:** Use the Stage 4 LLM output to:
1. If CONFIRMED — increase `confidence` on the affected profile observations
2. If SUPERSEDED — queue a profile update that replaces the affected understanding
3. If TENSIONED — record the tension in `holisticSynthesis.narrativeComplexity` for L3.75 to resolve
Actually apply these to the profile via the coordinator.

### FIX 2.4: Fix `inline_edit_sentence` routing without sentenceIndex (coachingService.ts:499-505)

**Problem:** When the student sends a message that the router classifies as `inline_edit_sentence`, the code routes to inline editing but never provides `sentenceIndex`. This always targets sentence 0.

**Fix:** Extract the sentence reference from the student message. The Haiku classification in Stage 1 should also output `targetSentence` (paragraph, sentence index). Add this to the classification output schema and use it for routing.

### FIX 2.5: Fix StalenessSnapshot type mismatch (editUnderstandingService.ts:1086-1096)

**Problem:** Passes `profile.index.stalenessSnapshot` (which contains string arrays like `string[]`) where the router expects `StalenessSnapshot` (which has numeric counts).

**Fix:** Transform the snapshot before passing:
```typescript
const snapshot: StalenessSnapshot = {
  paragraphsStale: profile.index.stalenessSnapshot?.paragraphs?.length ?? 0,
  connectionsStale: profile.index.stalenessSnapshot?.connections?.length ?? 0,
  holisticStale: profile.index.stalenessSnapshot?.holistic?.length ?? 0,
};
```
Or update the type contract so both sides agree on the shape.

### FIX 2.6: Fix paragraph alignment hash collision (editUnderstandingService.ts:220-240)

**Problem:** Hash→index Map overwrites on duplicate paragraphs. If P2 and P5 have identical text, the Map only remembers P5's index, and P2 will be incorrectly marked as deleted.

**Fix:** Use `Map<string, number[]>` (hash → array of indices). When matching, prefer positional proximity:
```typescript
const oldHashes = new Map<string, number[]>();
for (let i = 0; i < oldParagraphs.length; i++) {
  const hash = hashParagraph(oldParagraphs[i]);
  if (!oldHashes.has(hash)) oldHashes.set(hash, []);
  oldHashes.get(hash)!.push(i);
}
```

### FIX 2.7: Fix positional pairing on middle insertions (editUnderstandingService.ts:278-285)

**Problem:** After partitioning paragraphs into unchanged/changed sets, changed paragraphs are paired positionally (old change #1 ↔ new change #1). If a paragraph was INSERTED in the middle, this misaligns all subsequent pairings.

**Fix:** Use sequence alignment (Levenshtein/LCS) instead of positional pairing:
```typescript
// LCS-based alignment — identify the longest common subsequence of unchanged paragraphs,
// then everything between LCS matches is a changed region that can be diffed independently
```

### FIX 2.8: Enable Stage 1 caching in coaching (coachingService.ts:346)

**Problem:** `cacheSystemPrompt: false` on the Haiku classification call. This is a high-frequency call (every student message) that wastes caching opportunity.

**Fix:** Change to `cacheSystemPrompt: true`. The system prompt for Stage 1 classification is static and should be cached.

---

## TIER 3: MODERATE FIXES

### FIX 3.1: Sync `deriveImprovementPhase()` between focusedAnalyzer and analysisPass

**Problem:** focusedAnalyzer.ts:1257-1365 has shortened `focusAreas` and `deferredAreas` vs analysisPass.ts:621-732. Multiple missing items: 'Memorability factors', 'Structural balance', 'Voice refinement', 'Rhetorical precision', 'Transition smoothing', 'The sentence an AO would quote'.

**Fix:** Extract `deriveImprovementPhase()` into a shared utility function in `profileTypes.ts` or a new `phaseComputation.ts`. Both files import from the same source. Single source of truth.

### FIX 3.2: Fix `identifyChangedSentence()` for multi-location edits (focusedAnalyzer.ts:1074-1109)

**Problem:** Returns only the FIRST changed sentence. Multi-location edits (e.g., find-and-replace) lose coverage.

**Fix:** Return ALL changed sentences as an array. Update `runFocusedAnalysis` to iterate over them or pick the most impactful one.

### FIX 3.3: Add `targeted_holistic_refresh` to `selectAnalysisMode` rules (focusedAnalyzer.ts:638-691)

**Problem:** The scope recommendation `'targeted_holistic_refresh'` falls through to focused mode. Per spec, it should trigger comprehensive mode.

**Fix:** Add rule between current rules 5 and 6:
```typescript
// Rule 5.5: Holistic refresh scope → comprehensive
if (understanding.scopeRecommendation.scope === 'targeted_holistic_refresh') {
  return 'comprehensive';
}
```

### FIX 3.4: Fix debounce promise leak (reanalysisOrchestrator.ts:403-427)

**Problem:** When a new debounced call cancels the previous timer, the old Promise is never resolved/rejected. Caller hangs forever.

**Fix:** Store the reject function alongside the timer. When cancelling, reject the old promise with a `DebounceSupersededError`:
```typescript
if (this.debounceTimers.has(key)) {
  clearTimeout(this.debounceTimers.get(key)!.timer);
  this.debounceTimers.get(key)!.reject(new DebounceSupersededError());
}
this.debounceTimers.set(key, { timer, resolve, reject });
```

### FIX 3.5: Fix concurrency race condition (reanalysisOrchestrator.ts:374-391)

**Problem:** Between `isProcessing = false` (line 379) and the drain call at line 387, another `processEdit` can enter and see `isProcessing === false`, causing two concurrent processing runs.

**Fix:** Use a proper async mutex or set `isProcessing = true` BEFORE the drain call:
```typescript
finally {
  if (this.pendingEdit) {
    const pending = this.pendingEdit;
    this.pendingEdit = null;
    // Don't set isProcessing = false — keep it true for the drain
    this.processEdit(pending.oldText, pending.newText, pending.context)
      .then(pending.resolve).catch(pending.reject)
      .finally(() => { this.isProcessing = false; });
  } else {
    this.isProcessing = false;
  }
}
```

### FIX 3.6: Fix `computeChangeScope()` never returning 'sentence' (versionTracker.ts:247-257)

**Problem:** Returns 'sentence' only when `totalEdits === 0` (no changes). Real sentence-level changes return 'paragraph'.

**Fix:**
```typescript
if (totalEdits === 0) return 'sentence'; // no-op
if (totalEdits === 1 && uniqueParas === 1) return 'sentence'; // single sentence edit
if (uniqueParas >= 4) return 'essay_level';
if (uniqueParas >= 2) return 'multi_paragraph';
return 'paragraph';
```

### FIX 3.7: Fix error swallowing in coaching turn (reanalysisOrchestrator.ts:505-514)

**Problem:** Returns hardcoded "I encountered an error" string — violates CLAUDE.md "no degraded fallbacks" principle.

**Fix:** Return a proper error result:
```typescript
return {
  success: false,
  error: msg,
  response: null,
  profileDeepened: false,
  totalCost,
  costBreakdown,
};
```
Update `CoachingTurnResult` type to include `success: boolean` and `error?: string`.

### FIX 3.8: Fix Stage 3 caching (coachingService.ts:660-672)

**Problem:** Profile context is placed in the cached block. Since the profile changes after every edit/coaching turn, this invalidates the cache on every call.

**Fix:** Move profile context to the non-cached third block. Keep only static coaching instructions in the cached system prompt.

### FIX 3.9: Fix Stage 3 token limit and temperature (coachingService.ts:670-672)

**Problem:** `maxTokens: 1024` may be too tight for substantive coaching. `temperature: 0.7` may be too high for constraint compliance.

**Fix:** `maxTokens: 2048` and `temperature: 0.4`. Coaching responses need to be substantive but precise.

### FIX 3.10: Fix `essayVersion` field using layer number (coachingService.ts:787,839)

**Problem:** `essayVersion` is populated with `lastUpdatedLayer` (a layer number like 3 or 5), not an actual version number.

**Fix:** Accept `versionNumber` as a parameter from the orchestrator (which has the VersionTracker) and use that.

### FIX 3.11: Fix pattern detection — log but never store/use (coachingService.ts:1139-1214)

**Problem:** Pattern detection at end of coaching identifies student patterns (confusion, breakthrough, resistance) but only logs them. Never stored, never used for adaptive coaching.

**Fix:** Return detected patterns in the `CoachingResult`. Store in VersionTracker as light-touch adjustments. Use patterns to modulate future Stage 3 coaching tone.

### FIX 3.12: Fix net-change significance inaccuracy (versionTracker.ts:574-603)

**Problem:** Uses LAST edit's significance for net-change significance. If edit 1 is "transformative" (A→B) and edit 2 is "minor" (B→C), net significance is "minor" even though A→C may be transformative.

**Fix:** Use MAX significance across all edits in the group:
```typescript
const maxSignificance = group.changes.reduce((max, c) =>
  SIGNIFICANCE_ORDER[c.significance] > SIGNIFICANCE_ORDER[max] ? c.significance : max,
  'trivial'
);
```

### FIX 3.13: Add session cleanup (reanalysisOrchestrator.ts)

**Problem:** No `destroy()`/`cleanup()` method. Abandoned sessions leak debounce timers and large profile data.

**Fix:** Add `destroy()` that clears all timers, rejects pending promises, and nulls references:
```typescript
destroy(): void {
  for (const [key, entry] of this.debounceTimers) {
    clearTimeout(entry.timer);
    entry.reject?.(new Error('Session destroyed'));
  }
  this.debounceTimers.clear();
  if (this.pendingEdit) {
    this.pendingEdit.reject(new Error('Session destroyed'));
    this.pendingEdit = null;
  }
}
```

### FIX 3.14: Fix StalenessAccumulator Set serialization (versionTracker.ts:97-105)

**Problem:** `Set<string>` serializes to `{}` in JSON. Future persistence will lose data.

**Fix:** Use arrays internally, or add `toJSON()` method:
```typescript
toJSON() {
  return {
    paragraphs: [...this.paragraphs],
    connections: [...this.connections],
    holistic: [...this.holistic],
  };
}
```

### FIX 3.15: Fix Stage 1 taxonomy case mismatch (coachingService.ts:411)

**Problem:** The Haiku classification prompt uses UPPERCASE taxonomy names but JSON validation expects lowercase.

**Fix:** Normalize the LLM output: `category = raw.category?.toLowerCase()`. Or specify lowercase in the prompt examples.

---

## TIER 4: LOW-PRIORITY FIXES (fix where trivial)

### FIX 4.1: Fix sentence splitter for abbreviations (editUnderstandingService.ts:137)

`split(/(?<=[.!?])\s+/)` fails on "Dr.", "U.S.", "3.8 GPA". Use a smarter splitter that handles common abbreviations or reuse the L2 sentence splitter from the pipeline.

### FIX 4.2: Add LLM output validation for changeType/significance enums (editUnderstandingService.ts:1170,1179)

Validate that LLM-returned `changeType` and `significance` values are from the expected enum set. Default to 'unknown'/'moderate' if not recognized.

### FIX 4.3: Remove unused `overlapRatio()` function (editUnderstandingService.ts:153)

Defined but never called. Either wire it into sentence alignment (Fix 2.7) or delete it.

### FIX 4.4: Remove unused import `SentenceUnderstanding` (focusedAnalyzer.ts:25)

### FIX 4.5: Wire unused `_coordinator` parameter (focusedAnalyzer.ts:708)

The focused analysis computes deltas but never applies them to the profile. Either apply them inside `runFocusedAnalysis` or document that the caller is responsible.

### FIX 4.6: Fix `Readonly<EssayProfile>` casts in orchestrator (lines 448, 549, 642, 692, 730)

`as EssayProfile` strips Readonly. Use `Readonly<EssayProfile>` or update downstream to accept readonly.

### FIX 4.7: Fix synthetic `essayId` in re-analysis (reanalysisOrchestrator.ts:557)

`essayId: \`reanalysis_${Date.now()}\`` should use the actual essay ID. Pass it through from the session initialization.

### FIX 4.8: Remove emoji from prompt text (versionTracker.ts:809)

Replace `⚑` with plain text "[FLAG]" or just remove it.

### FIX 4.9: Add overflow protection for 100+ edits (versionTracker.ts)

Cap `netChanges` in the brief to the 20 most significant changes. Add a `truncated: boolean` flag.

### FIX 4.10: Fix holistic section inference from free-text (editUnderstandingService.ts:734-778)

Brittle keyword matching. Consider having the LLM output the holistic section key directly instead of inferring from free-text.

---

## Implementation Order

Execute in this exact order to minimize cascading rework:

1. **FIX 1.1** — Canonical ReanalysisBrief in profileTypes.ts (everything depends on this)
2. **FIX 3.1** — Extract shared `deriveImprovementPhase` (prevents duplication)
3. **FIXES 1.2-1.8** — All orchestrator integration fixes (bulk — do together)
4. **FIXES 2.1-2.8** — All critical algorithm/logic fixes
5. **FIXES 3.2-3.15** — All moderate fixes
6. **FIXES 4.1-4.10** — Low-priority cleanup

**Verification after each tier:** Run `npx tsc --noEmit` to confirm zero type errors.

---

## Quality Gates

After ALL fixes are applied:

- [ ] `npx tsc --noEmit` — zero errors
- [ ] ALL stubs deleted, ALL real imports enabled in reanalysisOrchestrator.ts
- [ ] ReanalysisBrief has ONE definition in profileTypes.ts
- [ ] `deriveImprovementPhase` has ONE implementation shared by both files
- [ ] Escalation ladder can actually escalate (Level 2→3→4)
- [ ] Stage 4 coaching output is applied to the profile
- [ ] Cost tracking uses `LayerCost` objects throughout (no `cost: number` on result types)
- [ ] No `as unknown as` casts remain
- [ ] Debounce properly rejects superseded promises
- [ ] Concurrency queue has no race window
- [ ] Session cleanup exists and is called

---

## Summary Stats

| Severity | Count | Theme |
|----------|-------|-------|
| Critical | 21 | Integration contracts (10), algorithm bugs (7), wasted LLM output (2), type mismatches (2) |
| Moderate | 17 | Phase drift, multi-edit coverage, concurrency, caching, error handling, cleanup, discarded results |
| Low | 10 | Validation, unused code, cosmetics |

**The single most dangerous bug:** FIX 2.0 — `collectCurrentAnalyses` reads wrong field names from `ParagraphAnalysis`, causing ALL paragraph scores to be `NaN`. This makes `deriveImprovementPhase` ALWAYS return `distinction` regardless of actual essay quality. Every focused analysis will tell the student they're at the highest phase.

**The most pervasive pattern:** Every orchestrator stub defines `cost: number` while every real service uses `cost: LayerCost` or `cost: LayerCost[]`. ALL cost tracking will produce NaN when real services are connected. Fix 1.4-1.6 address this systematically.

**The most impactful design fix:** FIX 2.3 (Stage 4 output applied to profile). Without this, coaching with the LLM is a one-way street — the student talks to the system but the system never learns from the conversation. This is the core value proposition of L6.

### FIX 3.16: Add calibration anchors for all EditChangeType values (focusedAnalyzer.ts)

**Problem:** The focused analysis prompt has calibration anchors for `word_refinement` (+3 to +8) and `meaning_evolution` (+5 to +15) but NONE for `content_expansion`, `structural_reorganization`, `tone_shift`, or `addition/deletion`. The LLM defaults to the word_refinement range for unlisted types, potentially underscoring significant changes.

**Fix:** Add anchors for all 6 change types in the FOCUSED_ANALYSIS_SYSTEM_PROMPT.
