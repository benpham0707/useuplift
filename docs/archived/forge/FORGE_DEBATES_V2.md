# Forge Debates V2: Reality Check & Synthesis Record

## Agent A ("Direct Path") Summary

Agent A proposes 7 independent enrichments to the coaching pipeline, each adding minimal infrastructure:

- **GAP-1**: Replace `buildFindingCoachingContext` with focus-scoped finding selection using Stage 1's `focusProbabilities` + `dimensionFocus`. Also surfaces structural roles, intent bridge, entanglements. Cap at 8 findings.
- **GAP-2**: Store `lastEditUnderstanding` on `ReanalysisOrchestrator`, build rich edit context string from `EditUnderstanding` fields, pass to coaching. Consume-once pattern.
- **GAP-3**: New `SessionEvent[]` type replacing three deprecated arrays. Smart retrieval via `retrieveRelevantEvents()` (recency + paragraph overlap + finding overlap + significance). Cap at 12 events.
- **GAP-4**: New `studentDeclaredContext: string` field on `EssayProfile`. Accumulated by Stage 4 new_context handler via new `contextAccumulation` field on Sonnet output.
- **GAP-5**: Static ~400-token `CRAFT_TECHNIQUE_VOCABULARY` constant appended to system prompt. 15 named techniques.
- **GAP-6**: Static ~400-token `PEDAGOGICAL_CALIBRATION_RULES` constant appended to system prompt. Conditional teaching heuristics.
- **GAP-7**: New `sessionJournal: string` on `CoachingSessionMemory`. Accumulated via Pattern Detection's new `sessionJournalEntry` output field. Capped at 2000 chars.

**Agent A Principles**: Structured storage for cross-session value. New types where needed. Each gap independent.

## Agent B ("Rethink Path") Summary

Agent B proposes fewer, combined changes with a "no new fields on EssayProfile" principle:

- **GAP-1**: Move finding selection INTO Stage 2's return value as `scopedFindingContext: string`. Multi-layer merge. Cap at 7.
- **GAP-2 + GAP-6 Combined**: Change `recentEditContext` from string to `{ summary, editUnderstanding? }` + add ~400-token combined "EDIT RESPONSE PROTOCOL + PEDAGOGICAL CALIBRATION" to system prompt.
- **GAP-3 + GAP-7 Combined**: Replace all 5 `CoachingSessionMemory` fields with `sessionIntelligence: string` (prose, ~600 tokens) + `recentApproaches[]` (capped at 5) + `recentStances[]` (capped at 5). No SessionEvent type. Pattern Detection produces `sessionIntelligence` directly.
- **GAP-4**: No new field. Fix retrieval of existing `conversationInsights` to respect `durability` field. `selectCoachingInsights()` function.
- **GAP-5**: Phase-gated technique injection (~200 tokens) into existing phase blocks (lines 997-1005). 3-5 techniques per phase.

**Agent B Principles**: "No new fields on EssayProfile." Better USE of existing fields. Prose-first for LLM consumption. Combine related gaps.

---

## Verification Findings

### Agent A Findings

**A-GAP1-1** | Severity: **broken**
Agent A's code references `r.paragraphIndex` on `StructuralRole`:
```typescript
profile.northStar.structuralRolesMap.filter(r => focusParagraphs.includes(r.paragraphIndex))
```
But the actual type (profileTypes.ts:993-1002) is:
```typescript
interface StructuralRole {
  paragraphs: number[];  // NOT paragraphIndex
  role: string;
  significance: string;
  weight: StructuralWeight;
}
```
**Fix**: Change to `r.paragraphs.some(p => focusParagraphs.includes(p))` and adjust `.map(r => ...)` to use `r.paragraphs` not `r.paragraphIndex`.

**A-GAP1-2** | Severity: **broken**
Agent A's code references `e.locations` (plural) on `CrossDimensionEntanglement`:
```typescript
profile.entanglements.filter(e => e.locations.some(loc => focusParagraphs.includes(loc.paragraph)))
```
But the actual type (profileTypes.ts:870-885) is:
```typescript
interface CrossDimensionEntanglement {
  location: ParagraphLocation;  // SINGULAR, not locations[]
  ...
}
```
**Fix**: Change to `focusParagraphs.includes(e.location.paragraph)`.

**A-GAP1-3** | Severity: **weak**
The `COACHING_VALUE_ORDER` import is needed at the call site in `buildFindingCoachingContext` but Agent A's code uses it without showing the import. It's already imported at the top of `findingContextBuilder.ts` but would need to be imported in `coachingService.ts` as well.
**Fix**: Add import of `COACHING_VALUE_ORDER` from `../findings/findingStore`.

**A-GAP2-1** | Severity: **incomplete**
Agent A references `reanalysisOrchestrator.ts:~769` for storing `lastEditUnderstanding`, but the exact location and the shape of `editOutput` needs verification. The `processEdit()` calls `editUnderstandingService.understandEdit()` which returns `EditUnderstandingOutput`. Agent A needs to access `.understanding` from that output. The type `EditUnderstandingOutput` (profileTypes.ts:3370) wraps `EditUnderstanding`. Plausible but needs exact line verification at implementation time.

**A-GAP3-1** | Severity: **weak**
The `significanceMap` in `updateSessionMemory` is deterministic, which Agent A acknowledges. The map assigns fixed scores (reinterpretation: 0.9, clarification: 0.3) but these are retrieval signals, not quality judgments. Acceptable per LLM-first design (Rule 6) since the LLM still decides what to do with retrieved events.

**A-GAP3-2** | Severity: **incomplete**
The backward-compatibility code maintaining deprecated arrays alongside the new `events[]` array means the `CoachingSessionMemory` object grows for a transition period. Agent A doesn't specify when to remove the deprecated fields. Acceptable for initial implementation.

**A-GAP4-1** | Severity: **weak**
Agent A adds `studentDeclaredContext: string` to `EssayProfile`. This is a persistent field that grows linearly. For cross-session value (user's stated goal), this is appropriate. But it adds to the already large `EssayProfile` type.

**A-GAP4-2** | Severity: **incomplete**
Agent A's Stage 4 prompt modification for `contextAccumulation` needs to be precise about where in the existing new_context prompt the field is added. The prompt at lines 1663-1683 would need the JSON output spec extended. Plausible but exact prompt integration not fully specified.

**A-GAP5-1** | Severity: **weak**
400 tokens for the craft vocabulary is always injected regardless of phase. At foundation phase, the prompt already says "don't use craft vocabulary yet" but the vocabulary is still in the system prompt. This is a minor inconsistency since the LLM can follow the phase instruction, but it wastes ~400 cached tokens for foundation students.

**A-GAP7-1** | Severity: **weak**
The journal front-trimming heuristic (`indexOf('[T', 100)`) could fail if early entries don't use the `[T...]` format. The Pattern Detection LLM might not always produce entries in this exact format.
**Fix**: Use a more robust trim strategy or enforce the format in the prompt.

### Agent B Findings

**B-GAP1-1** | Severity: **incomplete**
Agent B proposes moving finding selection INTO Stage 2's return value, but Stage 2 (`runStage2ContextRouting`, line 773) is explicitly "no LLM — pure logic." Adding finding context assembly into Stage 2 changes its scope from routing to context building. The existing function returns `{ routingRule, routingRequest }` and the `routingRequest` is consumed by `router.assembleContext()`. Adding `scopedFindingContext: string` to the return value is technically clean but conceptually blurs the stage boundary.

**B-GAP2-1** | Severity: **weak**
Combining GAP-2 (edit intelligence) with GAP-6 (pedagogical rules) into a single system prompt section conflates two independent concerns. Edit response protocol and pedagogical calibration serve different purposes and may need to evolve independently.

**B-GAP3-1** | Severity: **broken** (for cross-session future)
Replacing all structured session memory with a single `sessionIntelligence` prose string eliminates the ability to do relevance-based retrieval. The user specifically said "Store structured, retrieve smart, present fluid." A prose string is "store fluid, retrieve all, present fluid" — no filtering, no cross-session intelligence, no paragraph-based retrieval. This directly contradicts the user's stated vision.

**B-GAP3-2** | Severity: **weak**
The `recentApproaches[]` and `recentStances[]` buffers (capped at 5) are simpler than Agent A's SessionEvent but lose the ability to correlate approaches with paragraphs and findings.

**B-GAP4-1** | Severity: **incomplete**
Agent B's "fix retrieval of existing conversationInsights to respect durability" is sound but may not fully solve the problem. The current code (line 1214) takes `slice(-5)` regardless of durability. A `selectCoachingInsights()` function that prioritizes durable insights is better than FIFO. However, it doesn't solve the synthesis problem: 8 individual `ConversationInsight` records with raw `sourceText` strings are less useful to the LLM than a synthesized prose narrative. The student's raw message "I wrote this about my grandfather's watch" is less useful than the accumulated context "The essay is about a grandfather's watch that originally belonged to the grandmother, representing intergenerational connection."

**B-GAP5-1** | Severity: **weak**
Phase-gated technique injection (~200 tokens) is more token-efficient than Agent A's static ~400 tokens. However, injecting techniques into the existing phase blocks (lines 997-1005) creates longer conditional strings and makes the phase blocks harder to read/maintain.

---

## Synthesis Decisions

### GAP-1: Scoped Findings — **HYBRID (A-base with fixes)**
Agent A's approach is cleaner: modify the existing `buildFindingCoachingContext` method with Stage 1 signals. Agent B's approach of moving finding selection into Stage 2 blurs stage boundaries. However, Agent A's code has two type bugs (StructuralRole.paragraphIndex, entanglement.locations) that must be fixed. Take A's algorithm, fix the type errors, keep the enrichment of structural roles/entanglements/intent bridge.

### GAP-2: Edit Intelligence — **DIRECT (A)**
Agent A's approach is simpler and more modular: store `lastEditUnderstanding` on the orchestrator, build rich context string, pass through. Agent B's combination with GAP-6 conflates concerns. The consume-once pattern is clean.

### GAP-3 + GAP-7: Session Events / Journal — **HYBRID (A-structure, B-simplicity)**
This is the critical decision. Agent A's `SessionEvent[]` with smart retrieval aligns with the user's "store structured, retrieve smart, present fluid" vision. Agent B's prose-only approach is simpler but kills cross-session value. The hybrid: use Agent A's `SessionEvent[]` type and `retrieveRelevantEvents()` retrieval, but merge GAP-7's journal INTO the event system (each Pattern Detection run produces a journal-style summary event with high significance). No separate `sessionJournal` field — the journal IS the sequence of high-significance events serialized chronologically.

### GAP-4: Declared Context — **HYBRID (A-field, B-retrieval)**
Agent A's `studentDeclaredContext` string on `EssayProfile` is the right persistent store for cross-session value. But Agent B's insight that existing `conversationInsights` with `durability` fields are underutilized is valid. The hybrid: add `studentDeclaredContext` (A), AND fix `buildProfileContextText` to respect durability when selecting conversation insights (B). The `studentDeclaredContext` string provides synthesized prose; the durability-aware insight selection provides the raw evidence.

### GAP-5: Craft Vocabulary — **REFINED (B-approach, A-scope)**
Agent B's phase-gated approach (~200 tokens) is more token-efficient and contextually appropriate. But the technique list from Agent A is better curated for college essays. The refined approach: phase-gated injection using A's technique definitions, but only injecting the 5-7 most relevant techniques per phase rather than all 15.

### GAP-6: Pedagogical Intelligence — **DIRECT (A)**
Agent A's separate `PEDAGOGICAL_CALIBRATION_RULES` constant is cleaner than Agent B's combination with edit response protocol. The rules are general teaching heuristics, not edit-specific. Keep them as an independent, cached system prompt section.

### Execution Order
1. GAP-5 + GAP-6 (independent, string constants)
2. GAP-3+7 (type + logic, SessionEvent + smart retrieval)
3. GAP-1 (depends on focus paragraph extraction pattern from GAP-3)
4. GAP-2 (independent, orchestrator change)
5. GAP-4 (type + Stage 4 modification)
