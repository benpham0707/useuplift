# Implement Conversator V2: Rich Context Coaching Pipeline

You are the **Lead Engineer** for implementing the Conversator V2 system. You have the complete implementation blueprint at `docs/archived/forge/FORGE_PLAN_CONVERSATOR_V2.md` and the design debates at `docs/archived/forge/FORGE_DEBATES_V2.md`. Your job is to orchestrate a multi-wave agent swarm that implements all 6 items to the highest quality standard.

## EXECUTION MODEL

You run **7 waves** of parallel agent teams. Each wave has a specific purpose, and the next wave only starts after the current wave's quality gate passes. You are the Lead — you plan, delegate, coordinate, and verify. You do NOT implement code yourself except for small integration fixes between waves.

**Wave overview:**
1. Foundation (types + constants)
2. Core Logic (algorithms + methods)
3. Integration (wire into pipeline)
4. Functional Verification (does it select the right things?)
5. **Substantive Quality** (are the prompts, structures, and interconnections actually GOOD?)
6. **Quality-Driven Refinement** (fix everything Waves 4+5 found)
7. Final Verification (trace test, completeness, commit)

**Before starting**: Read `docs/archived/forge/FORGE_PLAN_CONVERSATOR_V2.md` completely. Read `docs/archived/forge/FORGE_DEBATES_V2.md`. Read `CLAUDE.md` for development standards. Read the LLM-first design principles at `.claude/projects/*/memory/feedback_llm-first-design.md`. Understand the full vision before delegating anything.

---

## WAVE 1: FOUNDATION (Types + Constants)

**Goal**: Lay all type foundations and string constants. After this wave, `npx tsc --noEmit` passes with zero errors. No logic changes — just types and constants that downstream waves depend on.

### Agent 1A: SessionEvent Type + CoachingSessionMemory Extension
**File**: `src/services/essayIntelligence/profileTypes.ts`
**Task**:
1. Read the FULL `docs/archived/forge/FORGE_PLAN_CONVERSATOR_V2.md` Item 3 type definitions
2. Read the EXISTING `CoachingSessionMemory` interface (line ~2082) in `profileTypes.ts`
3. Add the `SessionEvent` interface exactly as specified in the blueprint
4. Extend `CoachingSessionMemory` with `events: SessionEvent[]` field
5. Mark `topicsDiscussed`, `approachesUsed`, `studentStances` as `@deprecated` with JSDoc comments
6. Do NOT remove deprecated fields yet — backward compatibility
7. Verify: `npx tsc --noEmit` passes

**Rules**: Read existing code FIRST. Match existing code style (indentation, comment style, export patterns). Do not modify any other interfaces. Do not add fields not specified in the blueprint.

### Agent 1B: EssayProfile Extension + Coordinator Method
**Files**: `src/services/essayIntelligence/profileTypes.ts`, `src/services/essayIntelligence/profileManager/essayProfileManager.ts`
**Task**:
1. Read `docs/archived/forge/FORGE_PLAN_CONVERSATOR_V2.md` Item 6 type definitions
2. Read the EXISTING `EssayProfile` interface in `profileTypes.ts`
3. Add `studentDeclaredContext: string` field to `EssayProfile` (after `conversationInsights`, before metadata sections)
4. Add `updateStudentDeclaredContext(context: string): void` method to `EssayProfileCoordinator` in `essayProfileManager.ts`
5. Find where `EssayProfile` is initialized (search for `createEmptyProfile` or equivalent) and add `studentDeclaredContext: ''`
6. Verify: `npx tsc --noEmit` passes

**Rules**: Read existing code FIRST. Check all places where EssayProfile is constructed or spread-copied. Ensure the new field appears in ALL construction paths.

### Agent 1C: System Prompt Constants (Craft Vocabulary + Pedagogical Rules)
**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Task**:
1. Read `docs/archived/forge/FORGE_PLAN_CONVERSATOR_V2.md` Items 1 and 2 completely
2. Read the EXISTING `staticCoachingPhilosophy` in `coachingService.ts` (lines ~873-1019)
3. Read how `phase` is accessed (line ~869: `const phase = profile.index.improvementPhase`)
4. Add `getCraftVocabularyForPhase(phase: ImprovementPhaseLevel): string` function near line 57 (after existing constants), exactly as specified in blueprint Item 1
5. Add `PEDAGOGICAL_CALIBRATION_RULES` constant exactly as specified in blueprint Item 2
6. Append both to `staticCoachingPhilosophy` at line ~1019: `...your response.` + getCraftVocabularyForPhase(phase.level) + PEDAGOGICAL_CALIBRATION_RULES;`
7. Verify: `npx tsc --noEmit` passes. The `ImprovementPhaseLevel` type must be imported if not already.

**Rules**: Read the FULL existing system prompt before touching it. The system prompt is cached — your changes APPEND to the end, they do NOT restructure existing content. Verify `phase.level` is available in scope where you concatenate.

### WAVE 1 QUALITY GATE
After all 3 agents complete:
1. Run `npx tsc --noEmit` — must pass with zero errors
2. Grep for all `SessionEvent` references — should exist only in profileTypes.ts and coachingService.ts imports
3. Grep for `studentDeclaredContext` — should exist in profileTypes.ts, essayProfileManager.ts, and profile initialization
4. Read the modified `staticCoachingPhilosophy` end — verify craft vocab + pedagogy rules append correctly
5. Verify no unintended changes to other code (check `git diff --stat`)

**If quality gate fails**: Fix issues yourself (small integration fixes) before proceeding to Wave 2.

---

## WAVE 2: CORE LOGIC (Algorithms + Methods)

**Goal**: Implement all new private methods and algorithmic logic. After this wave, all new functions exist and compile, but they are not yet wired into the pipeline.

### Agent 2A: Session Event — Update + Retrieval + Serialization
**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Task**:
1. Read `docs/archived/forge/FORGE_PLAN_CONVERSATOR_V2.md` Item 3 completely — the `updateSessionMemory`, `retrieveRelevantEvents`, and `serializeEventsForPrompt` sections
2. Read the EXISTING `updateSessionMemory` method (line ~2196) and `initializeSessionMemory` (line ~2171)
3. Rewrite `updateSessionMemory` to produce `SessionEvent` entries as specified in the blueprint. KEEP the deprecated array pushes for backward compatibility during transition.
4. Rewrite `initializeSessionMemory` to include `events: []`
5. Add `retrieveRelevantEvents()` private method — the smart retrieval algorithm with recency + paragraph overlap + finding overlap + significance scoring
6. Add `serializeEventsForPrompt()` private method — formats selected events as prose
7. Verify: `npx tsc --noEmit` passes

**Critical**: The `significanceMap` in `updateSessionMemory` assigns retrieval weights — these are RETRIEVAL SIGNALS, not quality judgments. The LLM (Pattern Detection) will assess true significance later. This is explicitly permitted by LLM-first Rule 6 (infrastructure heuristics for retrieval ranking).

**Critical**: `SessionEvent.kind` must be `string`, NOT an enum or union type. The `kind` values in the code (`reinterpretation:voice`, `resistance`, `journal`) are examples, not an exhaustive list.

### Agent 2B: Scoped Finding Selection
**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Task**:
1. Read `docs/archived/forge/FORGE_PLAN_CONVERSATOR_V2.md` Item 4 completely — the `buildFindingCoachingContext` rewrite
2. Read the EXISTING `buildFindingCoachingContext` method (line ~2360)
3. Read the `FindingStore` API — verify `getByScope(paragraphIndex)`, `getByDimension(dim)`, `getActiveSortedByCoachingValue()` exist
4. Read `CrossDimensionEntanglement` type — verify it uses `location: ParagraphLocation` (SINGULAR, not `locations[]`)
5. Read `StructuralRole` type — verify it uses `paragraphs: number[]` (PLURAL, not `paragraphIndex`)
6. Rewrite `buildFindingCoachingContext` with the new signature `(coordinator, stage1, profile)` as specified
7. Implement three-tier selection: paragraph-scoped → essay-level → dimension-matched
8. Implement supplementary profile context: structural roles, intent bridge, entanglements
9. Add necessary imports: `COACHING_VALUE_ORDER` from `../findings/findingStore`, `Finding` from `../profileTypes`
10. Verify: `npx tsc --noEmit` passes

**Critical TYPE VERIFICATION** (these bugs were caught in the forge debates):
- `StructuralRole.paragraphs` is `number[]` — use `.some(p => focusParagraphs.includes(p))`, NOT `.paragraphIndex`
- `CrossDimensionEntanglement.location` is singular `ParagraphLocation` — use `.location.paragraph`, NOT `.locations`
- `COACHING_VALUE_ORDER` must be exported from findingStore.ts — verify it's exported, add export if not

### Agent 2C: Edit Intelligence Builder
**Files**: `src/services/essayIntelligence/analysis/reanalysisOrchestrator.ts` (or wherever the ReanalysisOrchestrator lives)
**Task**:
1. Read `docs/archived/forge/FORGE_PLAN_CONVERSATOR_V2.md` Item 5 completely
2. Find the `ReanalysisOrchestrator` class — search for it, read its `processEdit` and `processCoachingTurn` methods
3. Add `private lastEditUnderstanding: EditUnderstanding | null = null;` field
4. In `processEdit` (or `processEditInternal`), after the edit understanding call succeeds, store: `this.lastEditUnderstanding = editOutput.understanding;`
5. Add `buildRichEditContext(fallbackSummary?: string): string | undefined` private method as specified
6. In `processCoachingTurn`, where `recentEditSummary` is passed to the coaching service, replace with `this.buildRichEditContext(recentEditSummary)`
7. Verify: `npx tsc --noEmit` passes

**Critical**: This is a consume-once pattern. `buildRichEditContext` clears `lastEditUnderstanding` after building the context string. This prevents stale edit context from leaking into future turns.

### Agent 2D: Declared Data — Insight Selection + Stage 4 Output Extension
**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Task**:
1. Read `docs/archived/forge/FORGE_PLAN_CONVERSATOR_V2.md` Item 6 completely — Steps 2-5
2. Read the EXISTING `Stage4NewContextOutput` type (line ~192 or in the types)
3. Extend `Stage4NewContextOutput` with `contextAccumulation: string` field
4. Add `selectCoachingInsights(insights, budget)` private method — durability-aware selection
5. Read the EXISTING `ConversationInsight.durability` type — verify the durability values (`student_durable`, `essay_durable`, etc.)
6. In the Stage 4 `new_context` handler, after the Sonnet call succeeds, add accumulation logic that appends `contextAccumulation` to `profile.studentDeclaredContext` via `coordinator.updateStudentDeclaredContext()`
7. Verify: `npx tsc --noEmit` passes

**Critical**: The `contextAccumulation` field must be added to the Stage 4 new_context Sonnet prompt's JSON output spec. Read the EXISTING prompt carefully before modifying it. Add the field to the expected output schema with a clear instruction.

### WAVE 2 QUALITY GATE
After all 4 agents complete:
1. Run `npx tsc --noEmit` — must pass with zero errors
2. Read each new method and verify it matches the blueprint specification
3. Verify `retrieveRelevantEvents` has the 4-tier selection: recent + paragraph overlap + finding overlap + high significance
4. Verify `buildFindingCoachingContext` uses correct type access patterns (`.paragraphs`, `.location.paragraph`)
5. Verify `buildRichEditContext` includes: changeType, apparentPurpose, connectionImpact, holisticImpact
6. Verify `selectCoachingInsights` prioritizes durable insights over FIFO
7. Check `git diff --stat` — only expected files should be modified

**If quality gate fails**: Fix issues yourself before proceeding to Wave 3.

---

## WAVE 3: INTEGRATION (Wire Everything Into the Pipeline)

**Goal**: Connect all the new methods into the actual coaching pipeline. After this wave, the enrichments are live — Stage 3 receives all new context blocks, Pattern Detection emits events and journal entries, Stage 4 extracts declared data.

### Agent 3A: Stage 3 Prompt Assembly — Inject All New Context Blocks
**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Task**:
1. Read `docs/archived/forge/FORGE_PLAN_CONVERSATOR_V2.md` Items 3, 4, and 6 — the Stage 3 injection sections
2. Read the EXISTING Stage 3 user prompt assembly in `runStage3CoachingResponse` (lines ~1111-1139)
3. Make these changes to the Stage 3 user prompt:

   a. **Scoped findings**: Update the call at line ~1099 from `this.buildFindingCoachingContext(coordinator)` to `this.buildFindingCoachingContext(coordinator, stage1, profile)`

   b. **Session journal**: After the `sessionArcSection` construction (line ~1093), build journal section from high-significance events:
   ```
   const journalEvents = sessionMemory.events.filter(e => e.kind === 'journal').slice(-5);
   const journalSection = journalEvents.length > 0 ? '\n\nSESSION JOURNAL:\n' + journalEvents.map(e => e.summary).join(' ') : '';
   ```
   Add `${journalSection}` to the user prompt after `${sessionArcSection}`

   c. **Student declared context**: In `buildProfileContextText()` (line ~1219), after conversation insights injection, add:
   ```
   if (profile.studentDeclaredContext) {
     parts.push('STUDENT-DECLARED CONTEXT:\n' + profile.studentDeclaredContext);
   }
   ```

   d. **Durability-aware insight selection**: Replace `profile.conversationInsights.slice(-5)` at line ~1214 with `this.selectCoachingInsights(profile.conversationInsights, 8)`

4. Verify the Stage 3 user prompt block order is sensible — new blocks should be near related existing blocks
5. Verify: `npx tsc --noEmit` passes

**Critical**: Do NOT restructure the existing prompt blocks. INSERT new blocks between existing ones. The order should be: profile context (with declared data) → essay text → findings (now scoped) → conversation → student message → edit context → stage1 → cognitive → session arc + journal → rest.

### Agent 3B: Pattern Detection — Event Emission + Journal
**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Task**:
1. Read `docs/archived/forge/FORGE_PLAN_CONVERSATOR_V2.md` Item 3 — the Pattern Detection sections
2. Read the EXISTING `detectPatternsLLM` method (line ~1801) — read the FULL system prompt and output schema
3. Make these changes:

   a. **Extend output schema**: Add `sessionJournalEntry` to the JSON output spec in the system prompt:
   ```
   "sessionJournalEntry": "<1-2 sentences summarizing the last 3 turns: what was discussed, what shifted, what the student understood or resisted>"
   ```

   b. **Extend return type**: Add `sessionJournalEntry: string | null` to the return type

   c. **Parse journal entry**: In success parsing, extract `sessionJournalEntry` from the Haiku response

   d. **Fallback**: In error/fallback paths, set `sessionJournalEntry: null`

   e. **Create journal event**: After `memory.sessionArcSummary = patternResult.sessionArcUpdate;` (line ~322), add:
   ```
   if (patternResult.sessionJournalEntry) {
     memory.events.push({
       turn: memory.turnCount, kind: 'journal',
       summary: patternResult.sessionJournalEntry,
       significance: 0.95, paragraphRefs: [], findingRefs: [],
     });
   }
   ```

   f. **Replace array serialization**: Replace the Pattern Detection user prompt serialization (lines ~1858-1861) that dumps `topicsDiscussed`, `studentStances`, `approachesUsed` with:
   ```
   SESSION EVENTS (${sessionMemory.events.length} total):
   ${this.serializeEventsForPrompt(this.retrieveRelevantEvents(sessionMemory.events, [], []))}
   ```

4. Verify: `npx tsc --noEmit` passes

**Critical**: Read the FULL existing Pattern Detection prompt before modifying. Your changes ADD to the output schema — they do NOT restructure the existing prompt. The `sessionJournalEntry` is a NEW field alongside existing ones (`patterns`, `sessionArcUpdate`, etc.).

### Agent 3C: Stage 1.5 + Stage 4 Prompt Updates
**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Task**:
1. Read `docs/archived/forge/FORGE_PLAN_CONVERSATOR_V2.md` Items 3 and 6

2. **Stage 1.5 update**: In `runStage1_5CognitiveAssessment` (line ~1960), find where session memory is serialized into the prompt (lines ~2003-2011). Replace the old array serialization with event-based context:
   ```
   const sessionContext = sessionMemory.turnCount > 0
     ? '\nSESSION CONTEXT:\nArc: ' + sessionMemory.sessionArcSummary + '\nNext: ' + sessionMemory.nextFocus + '\n' +
       this.serializeEventsForPrompt(this.retrieveRelevantEvents(sessionMemory.events, [], []).slice(-5))
     : '';
   ```

3. **Stage 4 new_context prompt**: In `runNewContextDeepening` (line ~1642), find the Sonnet prompt's JSON output spec. Add `contextAccumulation` to it:
   ```
   "contextAccumulation": "1-2 sentence summary of what the student just revealed. Focus on facts and intent, not analysis. Include specifics."
   ```
   Read the FULL existing prompt before modifying — add to the existing JSON schema, don't restructure.

4. **Stage 4 new_context handler**: In the `case 'new_context'` block (line ~1314), after the Sonnet call succeeds and the response is parsed, add:
   ```
   if (parsed?.contextAccumulation) {
     const existing = profile.studentDeclaredContext || '';
     const newCtx = existing ? existing + ' ' + parsed.contextAccumulation : parsed.contextAccumulation;
     coordinator.updateStudentDeclaredContext(newCtx);
   }
   ```

5. Verify: `npx tsc --noEmit` passes

### WAVE 3 QUALITY GATE
After all 3 agents complete:
1. Run `npx tsc --noEmit` — must pass with zero errors
2. **Trace the full data flow manually**:
   - Student message → Stage 1 → Stage 1.5 (now uses events) → Stage 2 → Pattern Detection (now emits events + journal) → Stage 3 (now receives: scoped findings + journal + declared context + durability-aware insights) → Stage 4 (now extracts contextAccumulation) → updateSessionMemory (now produces events)
3. **Verify prompt injection order**: Read the assembled Stage 3 user prompt code and list every `${...}` variable in order. Confirm new blocks are in sensible positions.
4. **Verify Pattern Detection**: Read the modified prompt. Confirm `sessionJournalEntry` is in the output schema. Confirm the old array serialization is replaced with event serialization.
5. **Verify Stage 4**: Read the modified new_context prompt. Confirm `contextAccumulation` is in the output schema.
6. Check `git diff --stat` — verify only expected files modified

**If quality gate fails**: Fix issues yourself before proceeding to Wave 4.

---

## WAVE 4: FUNCTIONAL QUALITY VERIFICATION

**Goal**: Verify the implementation achieves the FUNCTIONAL quality targets from the blueprint. Not "does it compile" — "does it produce the right output."

### Agent 4A: Session Event Quality Audit
**Task**:
1. Read the implemented `updateSessionMemory` method
2. Trace through 5 representative student messages and verify the SessionEvent produced for each:
   - "Can you help me understand the feedback on paragraph 3?" → event with paragraphRefs: [2], kind containing 'clarification' or similar
   - "No, I meant it as irony" → event with kind containing 'correction' or 'reinterpretation', significance >= 0.8
   - "I wrote this the day my grandfather died" → event captured (via Stage 4 new_context path, not updateSessionMemory)
   - "What if I moved the hospital scene to the beginning?" → general structural question
   - *silence after an edit* → edit context captured via Item 5, not via session events

3. Trace `retrieveRelevantEvents` with a 20-event log:
   - Current focus: P3 → should retrieve P3-related events + recent 3 + high-significance
   - Current focus: overview → should retrieve recent 3 + high-significance
   - Verify the cap at 12 events works

4. Report: For each scenario, document what the system produces and whether it matches the blueprint's vision. Flag any gaps.

### Agent 4B: Scoped Finding Quality Audit
**Task**:
1. Read the implemented `buildFindingCoachingContext`
2. Create a representative scenario with 15 findings across 5 paragraphs:
   - 3 findings about P1 (voice critical, structure high, emotion medium)
   - 2 findings about P2 (narrative high, craft medium)
   - 3 findings about P3 (structure critical, voice high, theme medium)
   - 2 findings cross-paragraph P2+P4 (narrative high, thematic medium)
   - 3 findings essay-level (theme critical, admissions high, character medium)
   - 2 findings about P5 (craft critical, emotion high)

3. Trace through 3 queries:
   - Student asks about P3 → should get: P3 findings (3) + essay-level (3) + cross-paragraph touching P3 (0) + dimension-matched = ~6 findings. NOT the P1 voice or P5 craft findings.
   - Student asks general question → should get global top 5 by coaching value
   - Student asks about voice → should get all voice-dimension findings regardless of paragraph + essay-level

4. Verify supplementary profile context: structural roles show weight for focus paragraphs, intent bridge divergences surface, entanglements for focus paragraphs appear.

5. Report: Document what the system selects for each scenario vs what it SHOULD select per the blueprint.

### Agent 4C: LLM-First Design Compliance Audit
**Task**:
1. Read ALL code changes across all modified files
2. Read the LLM-first design principles at `.claude/projects/*/memory/feedback_llm-first-design.md`
3. Check for violations:
   - Any new closed enums or union types used for LLM perception? (`SessionEvent.kind` must be `string`)
   - Any deterministic scoring formulas for contextual judgments? (The `significanceMap` is a retrieval signal, which is permitted — but are there others?)
   - Any switch statements routing on LLM-produced labels?
   - Any keyword matching or regex on LLM prose?
   - Any discarding of paid LLM output? (Edit intelligence must surface the FULL EditUnderstanding)
4. Report: List any violations with file, line, and severity.

### Agent 4D: Token Budget Verification
**Task**:
1. Read the Stage 3 prompt assembly code
2. Estimate total Stage 3 prompt tokens at:
   - Turn 1 (no history, no events, no declared context)
   - Turn 10 (12 turns history, ~10 events, possibly declared context)
   - Turn 20 (12 turns history, ~20 events → 12 selected, declared context)
   - Turn 30 (12 turns history, ~30 events → 12 selected, declared context)
3. For each turn count, list every context block with estimated token count
4. Verify total stays within ~10,000 tokens at all turn counts
5. Compare to the CURRENT system's token usage at the same turn counts (from the research: ~7800 at turn 5, ~9800 at turn 20 with NO budget enforcement)
6. Report: Token budget table showing the new system stays bounded

### WAVE 4 QUALITY GATE
After all 4 agents complete:
1. Review all 4 reports
2. Identify any CRITICAL findings (functional quality failures)
3. List all issues — these feed into Wave 5 (substantive quality) and Wave 6 (fixes)

---

## WAVE 5: SUBSTANTIVE QUALITY — THE REAL QUALITY CHECK

**Goal**: This is the wave that determines whether the system is actually GOOD, not just correct. Waves 1-4 verified "does it work?" This wave verifies "is it well-built? Does the structure serve the intelligence, or constrain it? Are the prompts crafted to get the best LLM output? Does the interconnection between components create genuine compound value?"

**This wave spawns 5 specialized quality agents.** Each one attacks the implementation from a different angle. They read ALL modified code and evaluate against the system's VISION, not just the blueprint's checklist.

### Agent 5A: Prompt Quality Architect
**Task**: Evaluate every prompt modification for LLM output quality.

This is NOT "does the prompt have the right fields." This is "will this prompt actually produce excellent coaching responses?"

1. **Read the FULL modified `staticCoachingPhilosophy`** — the entire system prompt including craft vocabulary and pedagogical rules.
   - Does it read as a coherent coaching philosophy, or as a Frankenstein of bolted-on appendices?
   - Do the craft technique definitions teach Sonnet WHEN to use each technique, or just define terms?
   - Do the pedagogical rules create genuine teaching intelligence, or are they rigid "if X then Y" rules that will produce mechanical responses?
   - Is there instruction interference? (e.g., "ONE concept per turn" vs a findings section listing 8 findings — does the prompt create a contradiction?)
   - Read it as if YOU were a writing coach receiving this briefing. Would it make you a better coach?

2. **Read the Pattern Detection prompt modification** (sessionJournalEntry addition).
   - Does the journal entry instruction give Haiku enough context to produce genuinely useful session narratives?
   - Will the journal entries read as insightful coaching notes, or as mechanical "Student discussed X, then Y" logs?
   - Is the instruction specific enough about WHAT makes a good journal entry? (What happened + what shifted + what it means for next steps)
   - Simulate: if Haiku produces "Student asked about P3 transition. Coach explained. Student seemed to understand." — is that useful to Stage 3 Sonnet? What would a GREAT journal entry look like instead?

3. **Read the Stage 4 new_context prompt modification** (contextAccumulation addition).
   - Does the instruction guide Sonnet to produce a useful prose accumulation, or will it produce bland summaries?
   - Will accumulated entries read as a coherent narrative over 10+ turns, or as a list of disconnected facts?
   - Does the instruction tell Sonnet to SYNTHESIZE with existing context, or just APPEND?
   - Simulate: After 5 new_context turns, will `studentDeclaredContext` read like "This student wrote about their grandfather's watch, which was originally their grandmother's. The watch stopped the day the grandfather died. The student wants MIT to see their engineering curiosity through the lens of fixing things that are broken." — or will it read like "Student mentioned watch. Student said grandmother owned it. Student said it stopped. Student wants MIT."

4. **Read the edit intelligence serialization** (`buildRichEditContext`).
   - Does the serialized text give Stage 3 Sonnet enough context to produce edit-aware coaching?
   - Is the format optimized for LLM comprehension? (prose > JSON for LLM reading)
   - Does it include the WHY (apparentPurpose) prominently, not buried after metadata?
   - Simulate: Sonnet reads "Change type: meaning_evolution (significant). Apparent purpose: 'Replacing abstract opening with grounded scene' (confidence: 0.82)." — will it produce a response that acknowledges the student's INTENT, or just the CHANGE?

5. **Produce concrete recommendations**: For each prompt that needs improvement, write the SPECIFIC changes needed. Not "make it better" — show what the prompt should say differently and WHY.

**Output format**: For each prompt evaluated, produce:
```
PROMPT: [which prompt]
CURRENT QUALITY: [1-10 with specific reasoning]
WILL IT PRODUCE: [simulate what the LLM will actually output given this prompt]
SHOULD PRODUCE: [what excellent output looks like]
GAP: [specific gap between will-produce and should-produce]
FIX: [exact change needed, with reasoning]
```

### Agent 5B: Structure-Serves-Intelligence Auditor
**Task**: Evaluate whether the data structures and retrieval mechanisms actually SERVE the intelligence system, or whether they introduce rigidity traps.

1. **SessionEvent structure audit**:
   - `kind: string` is correctly open. But is `significance: number` a rigidity trap? The `significanceMap` assigns fixed scores: `reinterpretation: 0.9, clarification: 0.3`. Does this create a false hierarchy? A clarification that reveals the student finally understands a critical concept IS significant. A reinterpretation that's just word-level IS not.
   - Are `paragraphRefs` and `findingRefs` sufficient retrieval indexes? What about technique refs, emotional state, or thematic connections? Would the system miss important events because they don't have the right index?
   - Does the event structure capture enough NUANCE for cross-session value? When loading events from a previous session, will "T5 [reinterpretation:voice] Socratic questioning — student confused_about_feedback" actually help the next session's coach? Or is it too compressed to be useful?
   - **Test this**: Write 10 realistic session events. Then pretend you're loading them in a NEW session about a DIFFERENT essay. Which ones are actually useful? Which are noise?

2. **Retrieval algorithm audit**:
   - `retrieveRelevantEvents` uses 4 tiers: recent + paragraph overlap + finding overlap + high significance. Is this the RIGHT signal hierarchy?
   - Scenario: Student worked on P3 for 8 turns (many P3 events). Now asks about P1 for the first time. The retrieval will flood with P3 events (paragraph overlap) even though P1 context is what's needed. Does the algorithm handle this correctly?
   - Scenario: Student had a breakthrough about voice in turn 5. It's now turn 25. The breakthrough event has significance 0.95 but is 20 turns old. Is it still retrieved? Should it be?
   - Scenario: The most important event is a JOURNAL entry from turn 9 that says "Student struggles with showing vs telling — understands the concept but can't execute." This has no paragraphRefs. Will it be retrieved when the student is working on P4? Only if significance > 0.8. Is that reliable?
   - **For each failure scenario**: Propose a fix that maintains the "structured retrieval" principle without adding rigidity.

3. **Scoped finding selection audit**:
   - Three-tier selection (paragraph + essay-level + dimension). Is this actually better than "give the LLM ALL active findings and let it pick"?
   - With 8 findings max, are we artificially constraining what the coach can reference? What if finding F12 about P5 is deeply relevant to a P3 question because of a cross-essay connection?
   - Does the supplementary profile context (structural roles, entanglements, intent bridge) integrate naturally with the findings, or does it feel like a separate context dump?
   - **Test this**: Construct a realistic scenario where the scoped selection MISSES a critical finding. How would you fix it without going back to global top-5?

4. **Declared data structure audit**:
   - `studentDeclaredContext` is a growing prose string. At what length does it become HARMFUL? (Too much context = attention dilution)
   - Is there a decay mechanism? If the student corrects earlier context ("actually the watch belonged to my father, not grandfather"), does the old text persist alongside the correction?
   - Should declared context have any structure at all (e.g., key-value pairs for school, major, backstory) or is pure prose actually better for LLM consumption?

5. **Produce a "Rigidity Report"**: For each structure/algorithm, rate:
   - FLEXIBILITY: Can the LLM's natural perception flow through this structure, or does the structure constrain what can be captured? (1-10)
   - RETRIEVAL VALUE: Does the structure actually help surface the RIGHT context at the RIGHT time? (1-10)
   - CROSS-SESSION VALUE: Will this structure be useful across sessions/essays, or is it session-local noise? (1-10)
   - SCALABILITY: At turn 50, at essay 5, at 100 events — does this still work? (1-10)

### Agent 5C: Interconnection & Compound Value Auditor
**Task**: Evaluate whether the 6 items create genuine compound value (each making the others better) or are they 6 independent features that happen to share a file.

1. **Map the actual data flow between items**:
   - Do session events inform finding selection? (They should — if the student has been working on P3 for 5 turns, the finding selection should know this)
   - Does declared data influence edit intelligence interpretation? (It should — if the student said "I'm replacing the diamond intentionally," the edit intelligence should reference this)
   - Do the craft vocabulary and pedagogical rules reference the other context blocks? (They should — "ONE concept per turn" should interact with how many findings are in the context)
   - Does the journal entry creation have access to declared data? (It should — "Student explored the family connection behind the watch metaphor" is better than "Student discussed P3")

2. **Identify MISSING connections** that would create compound value:
   - Session events → finding retrieval: When `retrieveRelevantEvents` selects events, do the `findingRefs` on those events influence which findings `buildFindingCoachingContext` selects? (They should — if recent events reference F7, F7 should be boosted in finding selection)
   - Declared data → event significance: When a student declares backstory, should related events get a significance boost? (Maybe — "Student discussed P3 transition" becomes more significant when we know P3 is about the grandfather's watch)
   - Edit intelligence → session events: When an edit is processed, should it create a session event? (Yes — but does it currently? The blueprint has events created by `updateSessionMemory` using Stage 1 output, but edits might arrive without a Stage 1 classification)
   - Craft vocabulary → findings: When findings reference a specific technique ("P3 uses earned revelation"), does the craft vocabulary help the coach explain it? (Only if the finding's dimension maps to the right technique — is this connection explicit?)

3. **Evaluate "narrative coherence"** across the context blocks:
   - When Stage 3 Sonnet reads the full assembled prompt, does it feel like ONE coherent briefing or SEVEN separate appendices?
   - Read the Stage 3 user prompt block order. Does the information flow naturally? Does each block build on the previous one?
   - Simulate: You are Sonnet. You read: profile context → declared context → essay text → scoped findings → conversation → student message → edit intelligence → cognitive assessment → session arc + journal. Does this give you a clear, progressive understanding of the student's situation? Or do you feel context-switched between blocks?

4. **Identify the "synergy failures"** — where the architecture PREVENTS compound value:
   - The `significanceMap` is deterministic. It assigns `reinterpretation: 0.9` regardless of context. A Pattern Detection Haiku that could say "this reinterpretation is trivial" can't override the fixed score. Is there a path for the LLM to influence event significance?
   - `selectCoachingInsights` and `retrieveRelevantEvents` operate independently. They don't share context. Could they be connected? (e.g., if a durable insight mentions P3, related P3 events should be boosted)
   - `buildRichEditContext` is a consume-once pattern that clears `lastEditUnderstanding`. This means the edit intelligence is available for exactly ONE coaching turn. If the student responds to the edit-aware coaching and the coach needs to reference the edit on turn 2, the intelligence is gone. Should the edit create a session event so the knowledge persists?

5. **Produce compound value recommendations**: For each missing connection, specify:
   - What connects to what
   - How it creates compound value (not just "more data" but "information that makes other information more useful")
   - Implementation cost (zero-cost if it's a context assembly change, non-zero if it requires new logic)
   - Risk of over-connection (when does interconnection become spaghetti?)

### Agent 5D: Session Simulation — 20-Turn Coaching Conversation
**Task**: Simulate a realistic 20-turn coaching session and evaluate the QUALITY of context assembly at 5 checkpoints.

1. **Build a realistic scenario**:
   - Essay: 5-paragraph Common App essay about a student who fixes old radios with their grandfather. The essay is at "architecture" phase.
   - 15 active findings across paragraphs (mix of voice, structure, craft, narrative)
   - Student declared context: "Writing for MIT. The radio repair is a metaphor for problem-solving."
   - Intent bridge: student intent = "showing how I think through problems" vs system reading = "nostalgia for grandfather relationship"

2. **Simulate 20 turns** (you construct the student messages and trace what the system produces):

   Turn 1: "What should I work on first?"
   Turn 3: "Can you help me with the opening?"
   Turn 5: "I tried rewriting P1 to start in the workshop instead of at school"
   Turn 8: "No, the radio isn't just about my grandfather. It's about how I approach problems."
   Turn 10: "What if I added a scene where I'm debugging code and it parallels fixing the radio?"
   Turn 13: "I moved the code scene to P3 and it feels choppy"
   Turn 15: "The transition from the radio to the code — I want it to feel like the same kind of thinking"
   Turn 18: "Is the essay ready? Or does it still need work?"
   Turn 20: "Can you read it as an MIT admissions officer would?"

3. **At turns 1, 5, 10, 15, and 20**, document:
   - What session events exist in the log
   - What `retrieveRelevantEvents` would select given the current focus
   - What `buildFindingCoachingContext` would select
   - What `studentDeclaredContext` contains
   - What the full Stage 3 context assembly looks like (every block, approximate tokens)
   - **MOST IMPORTANTLY**: Read the assembled context AS IF YOU WERE SONNET. Would this context enable you to produce an EXCELLENT coaching response? What's missing? What's noise? What would you wish you had?

4. **Evaluate the SESSION ARC**:
   - Does the journal capture the REAL story of this session? (Student discovered the radio-coding parallel, struggled with transition, resolved it through sensory threading)
   - Or does it capture mechanical summaries? ("Student discussed P1. Student edited P1. Student discussed P3.")
   - At turn 20, can the coach reference turn 5's breakthrough naturally? ("Remember when you rewrote the opening to start in the workshop? That instinct was right — the same approach works for the transition.")

5. **Evaluate CROSS-SESSION value**:
   - If this student starts a NEW session for their "Why MIT" supplement, which session events from THIS session would be useful?
   - Does the event structure capture them well enough to be useful in a different essay context?
   - Would `studentDeclaredContext` ("Writing for MIT. The radio repair is a metaphor for problem-solving.") be useful for the supplement? Or does it need essay-specific vs student-level separation?

**Output format**: For each checkpoint (turns 1, 5, 10, 15, 20):
```
TURN N: "[student message]"
CONTEXT ASSEMBLY: [list every block with tokens]
SONNET WOULD PRODUCE: [what kind of response this context enables]
IDEAL RESPONSE REQUIRES: [what context would be needed for the BEST possible response]
GAP: [what's missing or noisy]
FIX: [specific implementation change]
```

### Agent 5E: Adversarial Edge Case Attacker
**Task**: Try to BREAK the implementation by finding edge cases where the structure fails, the retrieval misses, or the interconnection produces bad results.

1. **Retrieval failure scenarios**:
   - Student discusses P1 for 15 turns, then asks about P5 for the first time. All events are P1-related. Does the coach have ANY P5 context? (The events won't help, but the findings should — verify the finding selection provides P5 findings even when events don't)
   - Student volunteers 12 pieces of context across 20 turns. Does `studentDeclaredContext` become so long that it dilutes attention from the actual essay?
   - Pattern Detection fails to emit `sessionJournalEntry` for 5 consecutive cycles. What happens? (The journal events stop, but per-turn events continue — is that enough?)

2. **Context pollution scenarios**:
   - Student says "I hate this paragraph" (emotional_reaction). The event has significance 0.6 and no paragraphRefs (because Stage 1 might not extract a focus paragraph from emotional messages). Does this low-signal event pollute the retrieval?
   - 30 turns of small edits, each producing an event. The event log is dominated by minor events. Do the 3-4 important events (breakthroughs, reinterpretations) get drowned out?
   - The student corrects themselves: "Actually, I'm not applying to MIT anymore, it's Stanford." Does the old "MIT" context in `studentDeclaredContext` create confusion?

3. **Prompt coherence failures**:
   - At architecture phase, craft vocabulary is empty (by design). But a finding says "P3 uses earned revelation effectively." The coach can't name the technique because it's not in the vocabulary at this phase. Is this a problem?
   - The pedagogical rules say "ONE concept per turn." But the scoped findings section shows 8 findings, the journal mentions 3 topics, and the edit intelligence references a connection impact. Does the prompt create a mandate to discuss ONE thing while providing context about 12 things?
   - The declared context says "Student wants to show problem-solving." The intent bridge says "System reads nostalgia." The findings reference both. Does the coach have clear enough guidance to navigate this tension?

4. **Decay and staleness**:
   - Turn 30: 30 events in the log. retrieveRelevantEvents selects 12. The other 18 are gone from the prompt. A student says "Remember when we talked about that thing early on?" — can the coach find it?
   - The student makes a major edit that invalidates 5 findings. Those findings are superseded in the FindingStore. But the session events still reference them (`findingRefs: ['F3', 'F7']`). Does the retrieval surface stale event references?
   - `studentDeclaredContext` grows to 500 tokens. At what point should it be summarized/compressed? Is there a mechanism for that?

5. **Produce an Edge Case Report**: For each failure found, rate:
   - LIKELIHOOD: How often will this actually happen? (rare/occasional/common)
   - SEVERITY: If it happens, how bad is the coaching response? (minor degradation/noticeable/harmful)
   - FIX COMPLEXITY: How hard to fix? (trivial/moderate/significant)
   - RECOMMENDED ACTION: fix now / fix later / accept as limitation

### WAVE 5 QUALITY GATE
After all 5 agents complete:
1. Compile all findings into a single prioritized list
2. Classify each as: MUST FIX (blocks the vision), SHOULD FIX (meaningfully improves quality), NICE TO FIX (polish), ACCEPT (acknowledged limitation)
3. Count MUST FIX items — if > 0, Wave 6 fixes them
4. Estimate total fix effort — if significant, Wave 6 may need multiple agents

---

## WAVE 6: QUALITY-DRIVEN REFINEMENT

**Goal**: Fix everything identified in Waves 4 and 5. This is where the implementation goes from "correct" to "excellent."

### Agent 6A: Fix All MUST FIX Issues
**Task**:
1. Read all Wave 4 and Wave 5 reports
2. Fix every MUST FIX issue, in priority order
3. For prompt quality issues: rewrite the prompt sections as recommended by Agent 5A
4. For structure/retrieval issues: modify algorithms as recommended by Agent 5B
5. For interconnection issues: add missing data flows as recommended by Agent 5C
6. For edge cases: add handling for MUST FIX edge cases from Agent 5E
7. Verify: `npx tsc --noEmit` passes after all fixes

### Agent 6B: Fix All SHOULD FIX Issues
**Task**:
1. Read all Wave 5 reports
2. Fix every SHOULD FIX issue
3. Pay special attention to:
   - Prompt improvements that make the LLM produce noticeably better output
   - Missing interconnections that create compound value at zero cost
   - Retrieval improvements that prevent common failure scenarios
4. Verify: `npx tsc --noEmit` passes after all fixes

### Agent 6C: Prompt Refinement Pass
**Task**: Based on Agent 5A's prompt quality report, do a dedicated refinement of ALL prompts:
1. Rewrite the craft vocabulary entries to include WHEN to use each technique (not just definitions)
2. Refine the pedagogical rules to be genuinely adaptive (not mechanical if/then)
3. Refine the Pattern Detection journal entry instruction to produce coaching-quality narratives
4. Refine the Stage 4 contextAccumulation instruction to produce synthesized prose, not fact lists
5. Refine the edit intelligence serialization to lead with PURPOSE and INTENT, not metadata
6. Read each prompt aloud. Does it sound like coaching wisdom or like engineering specifications?
7. Verify: `npx tsc --noEmit` passes

### WAVE 6 QUALITY GATE
1. Run `npx tsc --noEmit` — zero errors
2. Re-run Agent 5D's simulation mentally at turns 10 and 20 — does the context assembly NOW produce excellent coaching context?
3. Check that no MUST FIX items remain open
4. Verify prompt coherence: read the full Stage 3 system prompt end-to-end, verify it reads as one document

---

## WAVE 7: FINAL VERIFICATION + SHIP

**Goal**: Comprehensive final check. Write the trace test. Verify everything. Commit.

### Agent 7A: End-to-End Trace Test
**Task**:
1. Read ALL modified files
2. Write a comprehensive trace test at `tests/test-conversator-v2-trace.ts` that:
   - Creates a mock EssayProfile with realistic data (5 paragraphs, findings, entanglements, structural roles, intent bridge)
   - Creates a mock CoachingSessionMemory
   - Simulates a 5-turn coaching session by calling the key functions in sequence:
     - `initializeSessionMemory()` → verify events: []
     - `updateSessionMemory()` with mock stage1/cognitive outputs → verify SessionEvent created
     - `retrieveRelevantEvents()` with various focus params → verify correct selection
     - `buildFindingCoachingContext()` with focus paragraphs → verify scoped selection
     - `selectCoachingInsights()` with mixed durability insights → verify durable always included
     - `serializeEventsForPrompt()` → verify prose output
   - Does NOT make actual LLM calls — tests the logic layer only
   - Uses console.log to show exactly what each function produces
3. Run the test: `npx tsx tests/test-conversator-v2-trace.ts`
4. Report: test output showing what each function produces

### Agent 7B: Integration Completeness Review
**Task**:
1. Read ALL code changes (git diff) across every modified file
2. Verify completeness checklist:
   - [ ] `SessionEvent` type defined and exported
   - [ ] `CoachingSessionMemory.events` field exists
   - [ ] `initializeSessionMemory` includes `events: []`
   - [ ] `updateSessionMemory` creates SessionEvent per turn
   - [ ] `retrieveRelevantEvents` implements 4-tier selection
   - [ ] Pattern Detection emits `sessionJournalEntry`
   - [ ] Journal entries become high-significance events
   - [ ] Pattern Detection user prompt uses events instead of deprecated arrays
   - [ ] Stage 1.5 user prompt uses events
   - [ ] `buildFindingCoachingContext` accepts stage1 + profile
   - [ ] Finding selection uses paragraph scope + dimension matching
   - [ ] Structural roles, intent bridge, entanglements surfaced
   - [ ] `getCraftVocabularyForPhase` exists and is phase-gated
   - [ ] `PEDAGOGICAL_CALIBRATION_RULES` exists and is appended
   - [ ] `staticCoachingPhilosophy` ends with craft vocab + pedagogy
   - [ ] `buildRichEditContext` exists on ReanalysisOrchestrator
   - [ ] `lastEditUnderstanding` stored after edit, consumed once
   - [ ] `studentDeclaredContext` field on EssayProfile
   - [ ] Stage 4 new_context extracts `contextAccumulation`
   - [ ] `selectCoachingInsights` respects durability
   - [ ] `buildProfileContextText` injects accumulated declared context
   - [ ] Stage 3 prompt includes journal section
   - [ ] All new fields have defaults (backward compatible)
   - [ ] All prompts read as coaching wisdom, not engineering specs
   - [ ] Context blocks flow coherently in Stage 3 assembly
   - [ ] Edit intelligence creates a session event for cross-turn persistence
3. Report: checklist with pass/fail for each item

### WAVE 7 QUALITY GATE (FINAL)
1. Run `npx tsc --noEmit` — zero errors
2. Run the trace test — all functions produce expected output
3. Review integration completeness — all items pass
4. Review git diff — only expected files modified, no debug artifacts
5. Verify the VISION: "Store structured, retrieve smart, present fluid" — events are structured, retrieval is relevance-scored, Stage 3 presentation is prose
6. Read the full Stage 3 system prompt end-to-end — it should read as a single coherent coaching philosophy document
7. Read 3 sample event → retrieval → serialization traces — the presented context should feel like a coaching briefing, not a data dump

**If quality gate fails**: Return to Wave 6 with the new issues. Repeat until all gates pass.

---

## LEAD ENGINEER RESPONSIBILITIES

Between waves, YOU (the Lead) must:
1. **Merge conflicts**: If multiple agents modified the same file, resolve conflicts thoughtfully
2. **Run quality gates**: Execute all verification steps yourself
3. **Fix small issues**: If a gate fails on a minor issue (missing import, typo), fix it yourself rather than spawning another agent
4. **Track progress**: Maintain a running status of what's done and what's pending
5. **Make judgment calls**: If an agent's implementation diverges from the blueprint in a way that's BETTER, accept it. If it diverges in a way that's WORSE, reject it and specify what needs to change.

## CRITICAL RULES FOR ALL AGENTS

1. **Read before writing.** Every agent MUST read the existing code in the files they'll modify BEFORE making changes. Understand what's there.
2. **Match existing style.** Indentation, comment format, export patterns, naming conventions — match what exists.
3. **No over-engineering.** If the blueprint says "add a string field," add a string field. Don't add a service, a utility class, and a factory.
4. **No under-engineering.** If the blueprint says "three-tier selection with paragraph + essay-level + dimension," implement all three tiers. Don't simplify to "just take top 5."
5. **Verify types.** Before using any type field (like `StructuralRole.paragraphs` or `CrossDimensionEntanglement.location`), READ THE ACTUAL TYPE DEFINITION. The forge debates caught two type bugs — there may be more.
6. **LLM-first design.** `SessionEvent.kind` is `string`. No closed enums for LLM perception. No deterministic scoring formulas for contextual judgments. The LLM owns judgment; the system tracks.
7. **Backward compatible.** All new fields default to empty. Existing sessions with no enrichment data must work identically.
8. **One logical change per agent.** Each agent makes ONE coherent set of changes. Don't fix unrelated issues.
9. **Leave the codebase better than you found it.** But only in files you're already modifying. Don't refactor neighboring code.

## START

Begin with Wave 1. Read the blueprint, spawn the agents, run the quality gate, then proceed to Wave 2. Take your time. The quality of this implementation determines whether the coaching system achieves its potential.
