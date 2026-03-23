# Implementation Blueprint: Rich Context Coaching Pipeline

Seven enrichments to the existing coaching pipeline (coachingService.ts ~2641 lines). No new services, no new LLM calls, no orchestrator changes. Everything rides existing stages. Structured storage for cross-session intelligence; prose presentation for the LLM. User's mandate: "Store structured, retrieve smart, present fluid."

---

## Item 1: Craft Technique Vocabulary — No Shared Language → Phase-Gated Technique Library

**Before**: The coach says "Your opening uses a technique that grounds the reader in a specific moment" without naming the technique. The student learns nothing reusable about writing craft.

**After**: At craft phase, the coach says "Your opening uses *in medias res* — dropping the reader into action before context. That's working because it earns P3's payoff. But the *volta* at P4 needs to be sharper." At foundation phase, the coach uses plain language, not jargon.

**Implementation**:

Add a phase-gated technique injection function in `coachingService.ts` (near line 57, after existing constants):

```typescript
/**
 * Phase-gated craft technique vocabulary.
 * Foundation/Architecture: no craft jargon — describe in plain language.
 * Craft: full vocabulary, name techniques when the essay uses them.
 * Polish/Distinction: refined vocabulary, focus on precision techniques.
 * ~200 tokens per phase (vs 400 for a static dump).
 */
function getCraftVocabularyForPhase(phase: ImprovementPhaseLevel): string {
  switch (phase) {
    case 'foundation':
    case 'architecture':
      // No craft jargon at foundation/architecture — plain language only
      return '';

    case 'craft':
      return `
CRAFT TECHNIQUE VOCABULARY (name these techniques when the essay uses them):
- Anaphora: repetition of a word/phrase at the start of successive clauses for rhythm
- Volta: the turn/pivot where the essay's direction, tone, or meaning shifts
- In medias res: opening in the middle of action rather than with setup
- Juxtaposition: placing contrasting elements side by side to illuminate both
- Accretion: building meaning through accumulated details rather than direct statement
- Withholding: strategically delaying information to create tension or revelation
- Tonal counterpoint: contrasting emotional register with delivery (humor about grief)
- Synecdoche: using a specific detail to represent a larger whole (the cracked mug = the marriage)
- Echo structure: returning to an opening image/phrase with transformed meaning at the close`;

    case 'polish':
    case 'distinction':
      return `
CRAFT TECHNIQUE VOCABULARY (precision-level — name these when refining):
- Syllepsis: a word doing double duty — "she held the diploma and her breath"
- Temporal compression: covering long periods in few words to emphasize what gets expanded
- Register shift: deliberate change in formality, vocabulary, or voice within the essay
- Negative space: what the essay pointedly does NOT say, creating meaning through absence
- Concrete universal: a hyper-specific detail that resonates with universal experience
- Enjambment (prose): a sentence that runs across paragraph boundaries for forward momentum
- Volta: the turn/pivot where the essay's direction shifts — at polish, the placement and sharpness matter`;

    default:
      return '';
  }
}
```

Inject into the Stage 3 system prompt. At line 1019, change:
```typescript
// FROM:
If you see coaching patterns listed below the conversation, use them to evolve your response.`;
// TO:
If you see coaching patterns listed below the conversation, use them to evolve your response.` +
  getCraftVocabularyForPhase(phase.level);
```

Note: `phase` is available in `runStage3CoachingResponse` scope (line 869: `const phase = profile.index.improvementPhase;`).

**Integration points**:
- `coachingService.ts:~57` — Add `getCraftVocabularyForPhase()` function. **NEW**
- `coachingService.ts:1019` — Append result of `getCraftVocabularyForPhase(phase.level)` to `staticCoachingPhilosophy` string

**Cost**: +200 tokens cached system prompt at craft/polish/distinction phases, 0 at foundation/architecture. ~$0.0002/turn (cache read).
**Source**: refined — Agent B's phase-gated approach with Agent A's technique definitions curated for college essays.

---

## Item 2: Pedagogical Calibration Rules — No Teaching Heuristics → Conditional Coaching Rules

**Before**: The system prompt says "calibrate to the student's cognitive state" but provides no heuristics for HOW. A confused student gets the same density as an engaged one.

**After**: The system prompt includes concrete conditional rules: "WHEN student is confused: lead with ONE concrete example, not an explanation." These activate naturally based on cognitive assessment + phase.

**Implementation**:

Add constant in `coachingService.ts` (near the new `getCraftVocabularyForPhase` function):

```typescript
/**
 * Pedagogical calibration rules — how to teach, not what to teach.
 * ~350 tokens. Appended to staticCoachingPhilosophy (cached).
 * Conditional on observable state (phase, confusion, breakthrough)
 * that the LLM detects from conversation + cognitive assessment.
 */
const PEDAGOGICAL_CALIBRATION_RULES = `

PEDAGOGICAL CALIBRATION RULES (follow these teaching heuristics):

WHEN CONFUSED:
- Lead with ONE concrete example, not an explanation
- Limit to a single concept per response
- Quote a specific sentence from their essay and ask them what THEY see in it
- If confused twice about the same topic: change modality (if you explained, now show; if you showed, now ask)

WHEN AT FOUNDATION PHASE:
- Every observation must cite a paragraph number and quote actual text
- Describe what's happening in plain language — save craft vocabulary for later
- Focus on "What is your essay about?" not "How is your essay structured?"

WHEN AT ARCHITECTURE/CRAFT PHASE:
- Name the specific technique they're using or could use
- Compare two parts of THEIR essay rather than giving abstract advice
- "Read P2S3 and P5S1 back to back — do you hear the shift?"

WHEN GIVING NEGATIVE FEEDBACK:
- Quote the specific words that aren't working BEFORE explaining why
- Show what the reader experiences (not what the writer intended)
- Offer ONE concrete alternative, not a list of options

WHEN STUDENT SHOWS BREAKTHROUGH:
- Name what they just figured out — make the insight explicit
- Connect it to their next challenge (momentum, not celebration)
- Keep the response SHORT — don't dilute the moment

WHEN STUDENT RESISTS:
- Ask "What are you protecting?" before defending your position
- If they're right, say so immediately and build from their reading
- Never argue about interpretation — the student owns their essay's meaning`;
```

Append to `staticCoachingPhilosophy` at line 1019:
```typescript
If you see coaching patterns listed below the conversation, use them to evolve your response.` +
  getCraftVocabularyForPhase(phase.level) +
  PEDAGOGICAL_CALIBRATION_RULES;
```

**Integration points**:
- `coachingService.ts:~57` — Add `PEDAGOGICAL_CALIBRATION_RULES` constant. **NEW**
- `coachingService.ts:1019` — Append after craft vocabulary

**Cost**: +350 tokens cached system prompt. First turn: ~$0.003 (cache write). Subsequent: ~$0.0003/turn (cache read).
**Source**: direct (A) — Agent A's separate constant is cleaner than Agent B's combined edit+pedagogy section. Teaching heuristics are general, not edit-specific.

---

## Item 3: Session Events + Journal — Unbounded Arrays → Unified Event Log with Smart Retrieval

**Before**: After 20 turns, `sessionMemory.approachesUsed` has 20 entries (~1000 tokens). `topicsDiscussed` is always empty (never populated). `sessionArcSummary` is overwritten every 3 turns, losing the conversation's history. The coach can't reference "earlier in our conversation" with specificity.

**After**: A unified `SessionEvent[]` log with smart retrieval. Each event has turn, kind, summary, significance, paragraph/finding refs. Retrieval selects ~12 events max based on recency + paragraph overlap + finding overlap + significance. Pattern Detection also produces journal-style events with high significance, enabling "Earlier you mentioned..." references. Total: ~600 tokens max injected per turn.

**Implementation**:

### Type Definitions

Add to `profileTypes.ts` (after `CoachingSessionMemory` at line ~2124):

```typescript
/**
 * A single coaching session event — unified record of what happened.
 * Replaces the separate approachesUsed[], studentStances[], topicsDiscussed[] arrays.
 * kind is a free-form string — the LLM describes what happened in its own words.
 */
export interface SessionEvent {
  /** Turn number when this event occurred */
  turn: number;
  /** LLM-generated event kind — free prose, not enum */
  kind: string;
  /** One-sentence summary of what happened */
  summary: string;
  /** LLM-assessed significance (0-1). Higher = more important to remember */
  significance: number;
  /** Paragraph indices involved (empty for essay-level events) */
  paragraphRefs: number[];
  /** Finding IDs referenced in this event (empty if none) */
  findingRefs: string[];
}
```

Modify `CoachingSessionMemory` (at line 2082):

```typescript
export interface CoachingSessionMemory {
  /** Total turns in this session */
  turnCount: number;

  /** Unified session event log — replaces topicsDiscussed, approachesUsed, studentStances */
  events: SessionEvent[];

  /** LLM-generated session arc summary — updated every 3-5 turns */
  sessionArcSummary: string;

  /** What the session should focus on next — LLM-assessed */
  nextFocus: string;

  // === DEPRECATED — kept for backward compatibility during transition ===
  /** @deprecated Use events[] instead */
  topicsDiscussed: Array<{
    topic: string; turnNumbers: number[]; summary: string;
    resolution: 'understood' | 'partially_understood' | 'unresolved' | 'rejected';
  }>;
  /** @deprecated Use events[] instead */
  approachesUsed: Array<{ turnNumber: number; approach: string; outcome: string; }>;
  /** @deprecated Use events[] instead */
  studentStances: Array<{ stance: string; turnNumber: number; }>;
}
```

### Smart Retrieval

Add private methods to `CoachingService`:

```typescript
/**
 * Retrieve relevant session events within a ~600 token budget.
 * Selection criteria:
 * 1. Always: the 3 most recent events (temporal relevance)
 * 2. Overlap: events whose paragraphRefs overlap with current focus paragraphs
 * 3. Finding overlap: events whose findingRefs overlap with current focus findings
 * 4. Significant: events with significance > 0.8 (regardless of recency)
 * Deduplicates and caps at 12 events (~600 tokens at ~50 tokens/event).
 */
private retrieveRelevantEvents(
  events: SessionEvent[],
  focusParagraphs: number[],
  focusFindingIds: string[],
): SessionEvent[] {
  if (events.length <= 6) return events;

  const selected = new Map<number, SessionEvent>();

  // 1. Most recent 3
  for (const e of events.slice(-3)) selected.set(e.turn, e);

  // 2. Paragraph overlap
  if (focusParagraphs.length > 0) {
    for (const e of events) {
      if (e.paragraphRefs.some(p => focusParagraphs.includes(p))) {
        selected.set(e.turn, e);
      }
    }
  }

  // 3. Finding overlap
  if (focusFindingIds.length > 0) {
    for (const e of events) {
      if (e.findingRefs.some(f => focusFindingIds.includes(f))) {
        selected.set(e.turn, e);
      }
    }
  }

  // 4. High significance
  for (const e of events) {
    if (e.significance > 0.8) selected.set(e.turn, e);
  }

  return Array.from(selected.values())
    .sort((a, b) => a.turn - b.turn)
    .slice(-12);
}

private serializeEventsForPrompt(events: SessionEvent[]): string {
  if (events.length === 0) return 'No session history yet.';
  return events
    .map(e => `T${e.turn} [${e.kind}] ${e.summary}`)
    .join('\n');
}
```

### Update `updateSessionMemory` (replace at line 2196)

```typescript
private updateSessionMemory(
  sessionMemory: CoachingSessionMemory,
  studentMessage: string,
  stage1: Stage1Output,
  cognitiveAssessment: CognitiveAssessment,
): CoachingSessionMemory {
  const turnNumber = sessionMemory.turnCount + 1;

  // Extract paragraph refs from Stage 1 focus
  const paragraphRefs: number[] = [];
  for (const [label, prob] of Object.entries(stage1.focusProbabilities)) {
    if (prob > 0.3) {
      const match = label.match(/P(\d+)/);
      if (match) paragraphRefs.push(parseInt(match[1], 10) - 1);
    }
  }

  // Build event kind from Stage 1 + cognitive assessment
  const kindParts: string[] = [];
  if (stage1.category !== 'clarification') kindParts.push(stage1.category);
  if (stage1.dimensionFocus.length > 0) kindParts.push(stage1.dimensionFocus[0]);
  const kind = kindParts.join(':') || 'general';

  // Summary from cognitive assessment
  const summary = `${cognitiveAssessment.recommendedApproach} — student ${stage1.cognitiveState}`;

  // Significance heuristic (retrieval signal, not quality judgment)
  const significanceMap: Record<string, number> = {
    reinterpretation: 0.9, resistance: 0.85, new_context: 0.8,
    correction: 0.8, preference: 0.7, emotional_reaction: 0.6,
    confirmation: 0.4, clarification: 0.3,
  };

  const event: SessionEvent = {
    turn: turnNumber, kind, summary,
    significance: significanceMap[stage1.category] ?? 0.5,
    paragraphRefs,
    findingRefs: [], // Populated by pattern detection when finding refs are identified
  };

  sessionMemory.events.push(event);

  // Backward-compat arrays (deprecated, maintained during transition)
  sessionMemory.approachesUsed.push({
    turnNumber,
    approach: cognitiveAssessment.recommendedApproach,
    outcome: 'pending',
  });
  if (stage1.category === 'resistance' || stage1.category === 'preference') {
    sessionMemory.studentStances.push({
      stance: studentMessage.substring(0, 200),
      turnNumber,
    });
  }

  sessionMemory.turnCount = turnNumber;
  return sessionMemory;
}
```

### Update `initializeSessionMemory` (at line 2171)

```typescript
private initializeSessionMemory(): CoachingSessionMemory {
  return {
    turnCount: 0,
    events: [],
    topicsDiscussed: [],
    approachesUsed: [],
    studentStances: [],
    sessionArcSummary: '',
    nextFocus: '',
  };
}
```

### Journal via Pattern Detection — Extend output schema

Extend `detectPatternsLLM` prompt (at line ~1835) to add:
```
"sessionJournalEntry": "<1-2 sentences summarizing the last 3 turns: what was discussed, what shifted, what the student understood or resisted. Write as a compact log entry: '[T7-9] Student explored voice in P3; realized authentic register differs from opening claim style.'>"
```

In `detectPatternsLLM` return type (near line 1806), add:
```typescript
sessionJournalEntry: string | null;
```

In the success parsing (near line 1927), add:
```typescript
sessionJournalEntry: parsed.sessionJournalEntry ?? null,
```

In the error fallback (near line 1899), add:
```typescript
sessionJournalEntry: null,
```

After `memory.sessionArcSummary = patternResult.sessionArcUpdate;` (line 322), add journal as a high-significance event:

```typescript
// Journal entry becomes a high-significance event (not a separate field)
if (patternResult.sessionJournalEntry) {
  const journalEvent: SessionEvent = {
    turn: memory.turnCount,
    kind: 'journal',
    summary: patternResult.sessionJournalEntry,
    significance: 0.95, // Journal entries are always worth remembering
    paragraphRefs: [],
    findingRefs: [],
  };
  memory.events.push(journalEvent);
}
```

### Update Pattern Detection prompt serialization (replace lines 1858-1861)

```typescript
// FROM:
Topics: ${sessionMemory.topicsDiscussed.map(t => t.topic).join(', ') || 'none yet'}
Student stances: ${sessionMemory.studentStances.map(s => s.stance).join('; ') || 'none'}
Approaches used: ${sessionMemory.approachesUsed.map(a => a.approach).join(', ') || 'none yet'}

// TO:
SESSION EVENTS (${sessionMemory.events.length} total):
${this.serializeEventsForPrompt(
  this.retrieveRelevantEvents(sessionMemory.events, [], [])
)}
```

### Update Stage 1.5 cognitive assessment prompt (replace lines 2003-2011)

```typescript
const sessionContext = sessionMemory.turnCount > 0
  ? `\nSESSION CONTEXT (${sessionMemory.turnCount} turns so far):\n` +
    `Arc: ${sessionMemory.sessionArcSummary}\n` +
    `Next focus: ${sessionMemory.nextFocus}\n` +
    this.serializeEventsForPrompt(
      this.retrieveRelevantEvents(sessionMemory.events, [], []).slice(-5)
    )
  : '';
```

### Inject journal events into Stage 3 prompt

In the session arc section (lines 1077-1093), after the existing arc text, add:

```typescript
// After sessionArcSection construction, build journal section from high-significance events
const journalEvents = sessionMemory.events
  .filter(e => e.kind === 'journal')
  .slice(-5); // Last 5 journal entries
const journalSection = journalEvents.length > 0
  ? `\n\nSESSION JOURNAL (what happened in this conversation):\n` +
    journalEvents.map(e => e.summary).join(' ')
  : '';
```

Add `${journalSection}` to the user prompt template (near line 1127, after `${sessionArcSection}`).

**Integration points**:
- `profileTypes.ts:~2124` — Add `SessionEvent` interface. **NEW**
- `profileTypes.ts:2082` — Modify `CoachingSessionMemory` to add `events: SessionEvent[]`, deprecate old arrays
- `coachingService.ts:2171` — `initializeSessionMemory()` — Add `events: []`
- `coachingService.ts:2196` — `updateSessionMemory()` — Rewrite to produce `SessionEvent` entries
- `coachingService.ts:~1857` — Pattern Detection prompt — Replace old serialization
- `coachingService.ts:~2003` — Stage 1.5 prompt — Replace old serialization
- `coachingService.ts:~1806` — Return type of `detectPatternsLLM` — Add `sessionJournalEntry: string | null`
- `coachingService.ts:~1835` — Pattern Detection JSON output spec — Add `sessionJournalEntry` field
- `coachingService.ts:~1927` — Parse `sessionJournalEntry` from Haiku response
- `coachingService.ts:~1899` — Fallback: `sessionJournalEntry: null`
- `coachingService.ts:~322` — After `memory.sessionArcSummary` — Add journal event
- `coachingService.ts:~1127` — Stage 3 user prompt — Add `${journalSection}`
- `coachingService.ts` — Add `retrieveRelevantEvents()` and `serializeEventsForPrompt()` private methods. **NEW**

**Cost**: Token savings at high turn counts (-200 to -800 tokens vs unbounded arrays). Pattern Detection output: +30-50 tokens. Stage 3 journal injection: +200-400 tokens. Net: approximately neutral at turn 20+.
**Source**: hybrid (A-structure, B-simplicity) — Agent A's `SessionEvent[]` type and smart retrieval for structured storage and cross-session value. Agent A's GAP-7 session journal absorbed INTO the event system (journal entries are events with kind='journal' and significance=0.95) rather than a separate field. This eliminates one field while preserving the journal's purpose.

---

## Item 4: Scoped Finding Selection — Global Top-5 → Conversationally Focused Findings

**Before**: Student says "Can you help with my opening paragraph?" Stage 1 detects `focusProbabilities: { P1: 0.85 }`. But `buildFindingCoachingContext()` (line 2360) calls `findingStore.getActiveSortedByCoachingValue()` globally and takes top 5. If the top 5 are about P3 voice and P5 theme, the coach has no P1 findings.

**After**: Findings are scoped to the focus paragraph(s) + essay-level findings + dimension-matched findings. Additionally, structural roles, intent bridge divergences, and relevant entanglements are surfaced as compact profile context. General questions (no dominant paragraph) still get global top 5.

**Implementation**:

Replace `buildFindingCoachingContext` at `coachingService.ts:2360`:

```typescript
/**
 * Build finding context scoped to the current conversational focus.
 * Uses Stage 1's focus detection to select findings relevant to what
 * the student is actually asking about.
 *
 * Three-tier selection:
 * 1. Focus-scoped: findings for focus paragraphs (via getByScope)
 * 2. Essay-level + cross-paragraph: always included for focus paragraphs
 * 3. Dimension-matched: findings matching student's dimensionFocus
 *
 * Plus supplementary profile context: structural roles, intent bridge, entanglements.
 */
private buildFindingCoachingContext(
  coordinator: EssayProfileCoordinator,
  stage1: Stage1Output,
  profile: EssayProfile,
): string {
  const findingStore = coordinator.getFindingStore();
  const active = findingStore.getActiveSortedByCoachingValue();
  if (active.length === 0) return '';

  // Determine focus paragraph indices from Stage 1
  const focusParagraphs: number[] = [];
  for (const [label, prob] of Object.entries(stage1.focusProbabilities)) {
    if (prob > 0.3) {
      const match = label.match(/P(\d+)/);
      if (match) focusParagraphs.push(parseInt(match[1], 10) - 1);
    }
  }

  const hasFocusParagraphs = focusParagraphs.length > 0;

  let selectedFindings: Finding[];

  if (hasFocusParagraphs) {
    const scopedFindings = new Map<string, Finding>();

    // Tier 1: Paragraph-scoped findings for focus paragraphs
    for (const pIdx of focusParagraphs) {
      for (const f of findingStore.getByScope(pIdx)) {
        scopedFindings.set(f.id, f);
      }
    }

    // Tier 2: Essay-level and cross-paragraph findings touching focus
    for (const f of active) {
      if (f.scope.type === 'essay_level') {
        scopedFindings.set(f.id, f);
      } else if (
        f.scope.type === 'cross_paragraph' &&
        f.scope.paragraphs?.some(p => focusParagraphs.includes(p))
      ) {
        scopedFindings.set(f.id, f);
      }
    }

    // Tier 3: Dimension-matched findings
    if (stage1.dimensionFocus.length > 0) {
      for (const dim of stage1.dimensionFocus) {
        for (const f of findingStore.getByDimension(dim)) {
          if (scopedFindings.size < 8) {
            scopedFindings.set(f.id, f);
          }
        }
      }
    }

    selectedFindings = Array.from(scopedFindings.values());
  } else {
    // No focus paragraph — fall back to global top 5
    selectedFindings = active.slice(0, 5);
  }

  // Sort by coaching value and cap at 8
  selectedFindings.sort(
    (a, b) => COACHING_VALUE_ORDER[a.coachingValue] - COACHING_VALUE_ORDER[b.coachingValue]
  );
  selectedFindings = selectedFindings.slice(0, 8);

  // Serialize findings
  const findingLines = selectedFindings.map(f => {
    const scopeStr = f.scope.type === 'essay_level'
      ? 'essay-level'
      : f.scope.type === 'cross_paragraph'
      ? `P${(f.scope.paragraphs ?? []).map(p => p + 1).join('+P')}`
      : `P${(f.scope.paragraph ?? 0) + 1}`;
    const dims = f.dimensions.join(', ');
    const evidence = f.evidence.length > 0
      ? ` Evidence: "${f.evidence[0].text.slice(0, 100)}${f.evidence[0].text.length > 100 ? '...' : ''}"`
      : '';
    return `[${f.id}] [${f.maturity}/${f.coachingValue}] ${scopeStr} [${dims}]\n  ${f.claim}${evidence}`;
  });

  // Supplementary profile context for focus paragraphs
  const profileSnippets: string[] = [];

  if (hasFocusParagraphs) {
    // Structural roles (FIXED: StructuralRole uses paragraphs: number[], not paragraphIndex)
    const roles = profile.northStar.structuralRolesMap
      .filter(r => r.paragraphs.some(p => focusParagraphs.includes(p)))
      .map(r => `P${r.paragraphs.map(p => p + 1).join('+P')}: ${r.role} [${r.weight}]`);
    if (roles.length > 0) {
      profileSnippets.push(`Structural roles: ${roles.join('; ')}`);
    }

    // Intent bridge divergences
    if (profile.northStar.intentBridge?.studentIntent) {
      const bridge = profile.northStar.intentBridge;
      const divergent = bridge.alignments.filter(a => a.alignment === 'divergent');
      if (divergent.length > 0) {
        profileSnippets.push(
          `Intent divergence: student says "${bridge.studentIntent}" but essay shows ${divergent[0].detail}`
        );
      }
    }

    // Entanglements (FIXED: CrossDimensionEntanglement uses location: ParagraphLocation, not locations[])
    if (profile.entanglements.length > 0) {
      const relevant = profile.entanglements.filter(e =>
        focusParagraphs.includes(e.location.paragraph)
      );
      if (relevant.length > 0) {
        profileSnippets.push(
          `Cross-dimension entanglements: ${relevant.slice(0, 2).map(e =>
            `${e.dimensions.join('+')} at P${e.location.paragraph + 1}: ${e.description.slice(0, 100)}`
          ).join('; ')}`
        );
      }
    }
  }

  const profileSection = profileSnippets.length > 0
    ? `\nPROFILE CONTEXT FOR FOCUS:\n${profileSnippets.join('\n')}`
    : '';

  return `\n\n=== KEY FINDINGS (reference by [F] label when discussing relevant topics) ===\n` +
    `${hasFocusParagraphs ? `Focus: P${focusParagraphs.map(p => p + 1).join(', P')}` : 'Focus: essay overview'}\n` +
    findingLines.join('\n\n') +
    profileSection;
}
```

Update the call site at `coachingService.ts:1099`:

```typescript
// FROM:
const findingSection = this.buildFindingCoachingContext(coordinator);
// TO:
const findingSection = this.buildFindingCoachingContext(coordinator, stage1, profile);
```

Add import at top of `coachingService.ts`:

```typescript
import { COACHING_VALUE_ORDER } from '../findings/findingStore';
import type { Finding } from '../profileTypes';
```

**Integration points**:
- `coachingService.ts:2360` — `buildFindingCoachingContext()` — Replace implementation. Change signature to accept `stage1: Stage1Output` and `profile: EssayProfile`
- `coachingService.ts:1099` — Call site — Pass `stage1` and `profile` arguments
- `coachingService.ts` imports — Add `COACHING_VALUE_ORDER` from `../findings/findingStore` and `Finding` from `../profileTypes`

**Cost**: +200-500 tokens input for findings + profile snippets vs ~500 tokens for old global top-5. Net change: ~$0.001/turn.
**Source**: hybrid (A-base with fixes) — Agent A's algorithm is cleaner than Agent B's Stage 2 integration. Two type bugs fixed: `StructuralRole.paragraphs[]` (not `.paragraphIndex`) and `CrossDimensionEntanglement.location` (not `.locations`).

---

## Item 5: Edit Intelligence — Summary Discarded → Rich Edit Context

**Before**: `EditUnderstandingService` runs Sonnet ($0.03) and produces rich `EditUnderstanding` with `apparentPurpose`, `connectionImpact`, `changeType`. But the coaching service receives only `"1 net change(s): 1 significant. Scope: paragraph."` — a 10-word summary. $0.03 of intelligence thrown away.

**After**: The coach sees: `"Change type: meaning evolution (significant). Apparent purpose: 'Replacing abstract opening with grounded scene' (confidence: 0.82). Connection effects: C1 strengthened: Opening now earns P4 moment through sensory setup. Holistic: Voice becomes more consistent."`

**Implementation**:

### Step 1: Store EditUnderstanding on ReanalysisOrchestrator

In `reanalysisOrchestrator.ts`, add private field (near the class declaration):

```typescript
/** Most recent EditUnderstanding from processEdit().
 *  Consumed once by the next processCoachingTurn() call, then cleared. */
private lastEditUnderstanding: EditUnderstanding | null = null;
```

### Step 2: Populate in processEdit

After the edit understanding call succeeds in `processEditInternal()`:

```typescript
this.lastEditUnderstanding = editOutput.understanding;
```

### Step 3: Build rich edit context

Add private method to `ReanalysisOrchestrator`:

```typescript
/**
 * Build rich edit context from stored EditUnderstanding.
 * Falls back to VersionTracker summary if no EditUnderstanding is available.
 * Consumed once — clears lastEditUnderstanding after building.
 */
private buildRichEditContext(fallbackSummary?: string): string | undefined {
  const eu = this.lastEditUnderstanding;
  if (!eu) return fallbackSummary;

  // Consume once
  this.lastEditUnderstanding = null;

  const parts: string[] = [];

  parts.push(
    `Change type: ${eu.changeType.replace(/_/g, ' ')} (${eu.significance}).`
  );
  parts.push(
    `Apparent purpose: "${eu.apparentPurpose}" (confidence: ${eu.purposeConfidence.toFixed(2)}).`
  );

  if (eu.profileImpact.connectionImpact.length > 0) {
    const impacts = eu.profileImpact.connectionImpact
      .filter(ci => ci.effect !== 'unchanged')
      .map(ci => `${ci.connectionId} ${ci.effect}: ${ci.reasoning}`)
      .slice(0, 3);
    if (impacts.length > 0) {
      parts.push(`Connection effects: ${impacts.join('; ')}.`);
    }
  }

  if (eu.profileImpact.directImpact) {
    parts.push(`Direct impact: ${eu.profileImpact.directImpact}`);
  }

  if (eu.profileImpact.holisticImpact) {
    parts.push(`Holistic: ${eu.profileImpact.holisticImpact}`);
  }

  if (fallbackSummary) {
    parts.push(`Summary: ${fallbackSummary}`);
  }

  return parts.join(' ');
}
```

### Step 4: Pass rich context to coaching

In `processCoachingTurn` (near line 351), replace:

```typescript
// FROM:
recentEditSummary,
// TO:
this.buildRichEditContext(recentEditSummary),
```

**Integration points**:
- `reanalysisOrchestrator.ts` — Add `private lastEditUnderstanding: EditUnderstanding | null = null;` field
- `reanalysisOrchestrator.ts` — In `processEditInternal()`, after edit understanding: `this.lastEditUnderstanding = editOutput.understanding;`
- `reanalysisOrchestrator.ts` — Add `buildRichEditContext()` private method. **NEW**
- `reanalysisOrchestrator.ts:~351` — Replace `recentEditSummary` with `this.buildRichEditContext(recentEditSummary)`
- `reanalysisOrchestrator.ts` imports — Verify `EditUnderstanding` type is imported (already imports `EditUnderstandingOutput`)

**Cost**: 0 new LLM calls. +100-250 input tokens in Stage 3. ~$0.001/turn post-edit.
**Source**: direct (A) — Clean consume-once pattern. No new types needed. No conflation with pedagogical rules (Agent B).

---

## Item 6: Student-Declared Context — FIFO Window → Accumulated Prose + Durability-Aware Retrieval

**Before**: Turn 3: student says "I wrote this about my grandfather's watch." Turn 8: "The watch actually belonged to my grandmother first." By turn 15, the T3 context is gone from the last-5 FIFO window. The coach at turn 20 has lost the grandfather context.

**After**: A `studentDeclaredContext` prose string accumulates: "The student wrote this about their grandfather's watch, which originally belonged to their grandmother. (T3, T8)." Additionally, conversation insights are selected by durability (durable always included) rather than pure FIFO.

**Implementation**:

### Step 1: Add field to EssayProfile

In `profileTypes.ts`, add to `EssayProfile` (near line 1718, after `patternInsights`):

```typescript
/**
 * Accumulated student-declared context — prose string summarizing everything
 * the student has revealed across coaching turns. Updated by Stage 4 when
 * category is 'new_context'. Unlike conversationInsights (individual records),
 * this is a synthesized narrative the LLM reads as a single block.
 */
studentDeclaredContext: string;
```

### Step 2: Extend Stage 4 new_context output

Extend `Stage4NewContextOutput` (line 192):

```typescript
interface Stage4NewContextOutput {
  updatedUnderstanding: string;
  affectedSections: string[];
  integrationNotes: string;
  /** NEW: one-sentence addition to accumulated student context */
  contextAccumulation: string;
}
```

Add to the Stage 4 new_context Sonnet prompt's JSON output spec:

```
"contextAccumulation": "<1-2 sentence summary of what the student just revealed, written to be appended to an existing context narrative. Focus on facts and intent, not analysis. Include specifics (names, objects, events). Don't repeat what's already accumulated.>"
```

### Step 3: Accumulate in Stage 4 handler

In the `case 'new_context'` block, after the Stage 4 call succeeds and `parsed` is available:

```typescript
if (parsed?.contextAccumulation) {
  const existing = profile.studentDeclaredContext || '';
  const turnLabel = `(T${sessionMemory?.turnCount ?? '?'})`;
  const newContext = existing
    ? `${existing} ${parsed.contextAccumulation} ${turnLabel}`
    : `${parsed.contextAccumulation} ${turnLabel}`;

  // Note: this requires passing sessionMemory to the Stage 4 handler.
  // Alternative: use the coordinator's mutation tracking.
  coordinator.updateStudentDeclaredContext(newContext);
}
```

### Step 4: Add coordinator method

In `essayProfileManager.ts`:

```typescript
updateStudentDeclaredContext(context: string): void {
  this.profile.studentDeclaredContext = context;
}
```

### Step 5: Fix conversation insight retrieval with durability awareness

In `buildProfileContextText()` (line 1214), replace the FIFO selection:

```typescript
// FROM:
const recentInsights = profile.conversationInsights.slice(-5);

// TO:
const recentInsights = this.selectCoachingInsights(profile.conversationInsights, 8);
```

Add helper method:

```typescript
/**
 * Select conversation insights for coaching context, respecting durability.
 * Durable insights (student_durable, essay_durable) are always included.
 * Remaining budget filled by most recent insights.
 */
private selectCoachingInsights(
  insights: ConversationInsight[],
  budget: number,
): ConversationInsight[] {
  // Always include durable insights
  const durable = insights.filter(i =>
    i.durability === 'student_durable' || i.durability === 'essay_durable'
  );

  // Fill remaining budget with most recent non-durable
  const remaining = budget - durable.length;
  const nonDurable = insights
    .filter(i => i.durability !== 'student_durable' && i.durability !== 'essay_durable')
    .slice(-Math.max(0, remaining));

  return [...durable, ...nonDurable].slice(0, budget);
}
```

### Step 6: Inject accumulated context into Stage 3 prompt

After the existing `conversationInsights` section in `buildProfileContextText()` (line ~1219):

```typescript
if (profile.studentDeclaredContext) {
  parts.push(
    `STUDENT-DECLARED CONTEXT (accumulated across all turns):\n${profile.studentDeclaredContext}`
  );
}
```

### Step 7: Initialize on new profiles

Wherever `EssayProfile` is initialized:

```typescript
studentDeclaredContext: '',
```

**Prompt spec for `contextAccumulation`**:
- **Input context**: Student's current message + existing `studentDeclaredContext` + profile
- **Task**: Produce 1-2 sentence summary of what THIS message reveals that's not already accumulated
- **Key constraints**: Don't repeat accumulated context. Focus on facts/intent, not analysis. Include specifics.
- **Output**: Plain string, e.g., `"The student's older sister also applied with an essay about the same watch, differentiating their perspectives."`

**Integration points**:
- `profileTypes.ts:~1718` — Add `studentDeclaredContext: string` to `EssayProfile`
- `coachingService.ts:~192` — Extend `Stage4NewContextOutput` with `contextAccumulation: string`
- `coachingService.ts` — Stage 4 new_context Sonnet prompt — Add `contextAccumulation` to JSON output spec
- `coachingService.ts` — Stage 4 new_context handler — Add accumulation logic
- `coachingService.ts:1214` — `buildProfileContextText()` — Replace FIFO with `selectCoachingInsights()`
- `coachingService.ts:~1219` — Add `studentDeclaredContext` injection
- `coachingService.ts` — Add `selectCoachingInsights()` private method. **NEW**
- `essayProfileManager.ts` — Add `updateStudentDeclaredContext()` method. **NEW**
- Profile initialization code — Add `studentDeclaredContext: ''`

**Cost**: 0 new LLM calls. +20 output tokens on Stage 4 new_context. +50-200 input tokens in Stage 3. ~$0.001/turn.
**Source**: hybrid (A-field, B-retrieval) — Agent A's `studentDeclaredContext` prose field for accumulated context across sessions. Agent B's durability-aware insight selection replaces FIFO, ensuring durable insights aren't lost to recency.

---

## Execution Order

```
Phase 1 (independent, string constants — no type changes):
  1. Item 1: Craft Technique Vocabulary
  2. Item 2: Pedagogical Calibration Rules
  Verify: npx tsc --noEmit passes. Stage 3 prompt output includes vocabulary at craft phase, calibration rules always.

Phase 2 (type + logic — SessionEvent):
  3. Item 3: Session Events + Journal
  Verify: npx tsc --noEmit passes. initializeSessionMemory() includes events[]. Pattern Detection serializes events, not deprecated arrays. Journal events appear in Stage 3 prompt.

Phase 3 (logic — depends on focus paragraph extraction from Item 3):
  4. Item 4: Scoped Finding Selection
  Verify: npx tsc --noEmit passes. buildFindingCoachingContext accepts stage1 and profile. Findings scoped to focus paragraphs when Stage 1 has high-probability focus. Structural roles, entanglements, intent bridge appear in output.

Phase 4 (transport layer — independent):
  5. Item 5: Edit Intelligence
  Verify: npx tsc --noEmit passes. After processEdit + processCoachingTurn, Stage 3 receives rich edit context with changeType, apparentPurpose, connectionImpact.

Phase 5 (type + Stage 4 modification):
  6. Item 6: Student-Declared Context
  Verify: npx tsc --noEmit passes. After Stage 4 new_context, studentDeclaredContext accumulates. buildProfileContextText includes accumulated context. Insight selection respects durability.
```

## Cost Summary

| Item | Per Turn (additional) | Per Session (20 turns) |
|------|----------------------|------------------------|
| 1. Craft Vocabulary | ~$0.0002 (cache read, craft+ only) | ~$0.004 |
| 2. Pedagogical Rules | ~$0.0003 (cache read) | ~$0.006 |
| 3. Session Events + Journal | -$0.001 to +$0.001 (varies by turn count) | ~$0.00 (net neutral) |
| 4. Scoped Findings | ~$0.001 (more targeted context) | ~$0.02 |
| 5. Edit Intelligence | ~$0.001 (post-edit turns only) | ~$0.005 |
| 6. Declared Context | ~$0.001 (new_context turns only) | ~$0.005 |
| **Total** | **~$0.002-0.004/turn** | **~$0.04/session** |
| **New LLM calls** | **0** | **0** |

## Existing Infrastructure Leveraged

- `FindingStore.getByScope()` (findingStore.ts:232) — paragraph-scoped finding retrieval, already exists
- `FindingStore.getByDimension()` (findingStore.ts:245) — dimension-filtered retrieval, already exists
- `COACHING_VALUE_ORDER` (findingStore.ts) — coaching value sorting, already exists
- `FindingContextOptions.scopeFilter` (findingContextBuilder.ts:33) — anticipated scope filtering (not used directly but proves design intent)
- `buildAnnotationFindingContext()` (findingContextBuilder.ts:276) — existing pattern for scoped finding serialization
- `EditUnderstanding` type (profileTypes.ts:1317) — already has all needed fields (significance, changeType, apparentPurpose, connectionImpact)
- `ConversationInsight.durability` field (profileTypes.ts:1236) — 4-level durability already on every insight, never used for selection
- `Stage1Output.focusProbabilities` and `dimensionFocus` — routing signals, already computed every turn
- `detectPatternsLLM()` — existing Haiku call running every 3+ turns, extensible with journal output
- `cacheSystemPrompt: true` on all Sonnet calls — system prompt additions benefit from caching

## Open Questions

1. **`processEditInternal()` exact location**: Agent A references `reanalysisOrchestrator.ts:~769` for storing `lastEditUnderstanding`. The exact line where `editOutput.understanding` is available needs verification during implementation. The code path is: `processEdit()` -> `processEditInternal()` -> `editUnderstandingService.understandEdit()` returns `EditUnderstandingOutput`. The `.understanding` field extraction point needs confirmation.

2. **Stage 4 `sessionMemory` access**: Item 6's accumulation logic needs `sessionMemory.turnCount` for turn labeling. Currently, `runStage4ProfileDeepening` doesn't receive `sessionMemory`. Options: (a) pass it through, (b) use `profile.metadata` for a timestamp instead, (c) use `profile.conversationInsights.length` as a proxy.

3. **Backward-compat removal timeline**: When can the deprecated `topicsDiscussed`, `approachesUsed`, `studentStances` arrays be removed from `CoachingSessionMemory`? This requires checking all consumers — likely safe after one release cycle.

4. **Event significance calibration**: The deterministic `significanceMap` in `updateSessionMemory` may need tuning after observing real sessions. Consider making it LLM-assessed in a future iteration (have Pattern Detection retroactively adjust significance).

5. **Finding dimension index**: `getByDimension(dim)` matches on the `dimensions` field of findings. The `dimensionFocus` values from Stage 1 are lowercase strings like 'voice', 'structure'. Need to verify these match the dimension labels stored in findings (they should, since both come from the same `HolisticDimension` type).

## Rejected Approaches

### Agent B's prose-only session memory (GAP-3)
Rejected because it contradicts the user's stated vision: "Store structured, retrieve smart, present fluid." A single `sessionIntelligence` prose string cannot be filtered by paragraph relevance, finding overlap, or significance. It eliminates the ability to do cross-session intelligence. Simplicity is compelling but sacrifices the structured storage that enables smart retrieval.

### Agent B's "no new fields on EssayProfile" principle (GAP-4)
Partially rejected. The principle is admirable for avoiding type sprawl, but `studentDeclaredContext` genuinely needs to persist across sessions and grow over time. A synthesized prose narrative is fundamentally different from individual `ConversationInsight` records. Both are needed: the accumulated context for LLM consumption, the individual insights for audit trail.

### Agent B's combined edit+pedagogy system prompt section (GAP-2+6)
Rejected. Edit response protocol and pedagogical calibration serve different purposes and should evolve independently. Combining them creates a monolithic prompt section that's harder to reason about and modify.

### Agent B's finding selection in Stage 2 (GAP-1)
Rejected. Stage 2 is explicitly "no LLM — pure logic" for context routing. Adding finding context assembly changes its conceptual scope. Better to keep finding selection in its existing location (`buildFindingCoachingContext`) and enhance it with Stage 1 signals.

### Agent A's static 400-token craft vocabulary (GAP-5)
Rejected in favor of phase-gated approach. At foundation phase, craft jargon is counterproductive — the prompt already says "don't use craft vocabulary yet." Injecting 400 tokens of craft terms anyway is wasteful and sends mixed signals. Phase-gating eliminates the inconsistency and saves ~200 tokens at foundation/architecture phases.

### Separate `sessionJournal` field (Agent A's GAP-7)
Rejected as a separate field. The journal's purpose (remember what happened across the conversation) is better served by high-significance events in the unified `SessionEvent[]` log. This eliminates one field while preserving the journal's value through the retrieval system.
