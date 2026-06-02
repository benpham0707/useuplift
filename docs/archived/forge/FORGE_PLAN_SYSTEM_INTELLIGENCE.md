# FORGE PLAN: System Intelligence Gaps — Final Blueprint

> Adjudicated from Agent A (Direct Path) vs Agent B (Rethink Path)
> See: FORGE_DEBATES_SYSTEM_INTELLIGENCE.md for full reasoning
> Date: 2026-03-19

---

## Overview

5 coaching intelligence gaps, resolved into 3 implementation units:

| Unit | Gaps Covered | New LLM Calls | Files Modified |
|------|-------------|----------------|----------------|
| U1: Student Theory | GAPs 1, 4, 5 | 1 Haiku / 5 turns | 3 files |
| U2: Resistance Escalation | GAP 3 | 0 | 3 files |
| U3: Inner Voice | GAP 2 | 0 | 2 files |

**Total cost impact**: ~$0.003/turn average (Haiku synthesis amortized over 5 turns).
**Dependency order**: U3 first (smallest, unblocks richer session events), then U2, then U1.

---

## Unit 1: Student Theory (GAPs 1 + 4 + 5)

### Problem
The coaching system has no persistent model of WHO the student is as a person across turns. `studentDeclaredContext` accumulates concrete FACTS ("piano teacher Mrs. Chen") but not PERSONHOOD ("learns through concrete examples, protective of emotional authenticity, avoids direct vulnerability"). Each turn, Sonnet rebuilds its understanding from scratch.

### Solution
A periodic Haiku synthesis (every 5 turns) that reads the conversation so far and produces a structured `StudentTheory` — the coach's evolving hypothesis about who this student is. Between syntheses, Sonnet contributes incremental observations via a new `portraitUpdate` sidecar field.

### Type Definition

```typescript
// In profileTypes.ts

/**
 * The coach's evolving hypothesis about who this student is.
 * NOT analysis of the essay — analysis of the PERSON writing it.
 * Synthesized every 5 turns by Haiku, with inter-synthesis updates
 * from the Sonnet sidecar's portraitUpdate field.
 *
 * Design principle: descriptive, not prescriptive. The theory
 * describes what the coach OBSERVES. The Stage 3 Sonnet decides
 * what to DO with these observations.
 */
export interface StudentTheory {
  /**
   * Who this person is — beyond what the essay reveals.
   * 2-4 sentences. The coach's empathetic read of the student.
   * Example: "A precise, analytical thinker who processes emotions
   * through intellectual frameworks. Struggles to write from the body
   * rather than the mind. The essay's best moments happen when they
   * forget to be careful."
   */
  personhood: string;

  /**
   * What the student is protecting — topics, phrasings, or approaches
   * they've resisted changing. Each entry is a specific thing, not
   * a category. These are HONORED, not overcome.
   * Example: ["the ending where she addresses her grandmother directly",
   *           "the word 'resilience' in P4 — they know it's cliche but it's their word"]
   */
  protectedValues: string[];

  /**
   * Hypotheses about what the student can't see about their own essay.
   * These are HYPOTHESES — the coach may be wrong.
   * Example: ["May not realize P2-P3 voice shift reads as two different writers",
   *           "Thinks the essay is about piano but it's actually about perfectionism"]
   */
  blindSpotHypotheses: string[];

  /**
   * Tensions between what the student says and what the essay does,
   * or between different things the student has said.
   * Example: ["Says they want the essay to feel 'natural' but their revisions
   *           add more formal language", "Wants to show growth but protects the
   *           ending that suggests nothing changed"]
   */
  tensions: string[];

  /**
   * The student's relationship to this essay — why it matters to them,
   * what they're trying to prove, what they're afraid of.
   * 1-3 sentences.
   */
  essayRelationship: string;

  /**
   * Cross-layer observations — connections between essay-level analysis
   * and conversation behavior that neither layer alone can see.
   * Example: ["CharacterRevelation says the essay avoids vulnerability,
   *           and in coaching the student deflects emotional questions with humor"]
   */
  crossLayerPatterns: string[];

  /** Turn number when this theory was last synthesized */
  lastSynthesizedAtTurn: number;

  /** Raw inter-synthesis observations from Sonnet sidecar (cleared on synthesis) */
  pendingObservations: string[];
}
```

### Changes

#### File 1: `src/services/essayIntelligence/profileTypes.ts`

1. Add `StudentTheory` interface (above).
2. Add `studentTheory?: StudentTheory` field to `CoachingSessionMemory` interface.

#### File 2: `src/services/essayIntelligence/coaching/coachingService.ts`

**Sidecar extension** (1 new field):

3. Add `portraitUpdate` to `CoachingSidecar` interface:
```typescript
/** Inter-synthesis portrait observation — what did this turn reveal about
 *  who this student IS? null if nothing new. 1 sentence max. */
portraitUpdate: string | null;
```

4. Add to `SIDECAR_INSTRUCTIONS` constant — append to the JSON schema description:
```
,"portraitUpdate":"<1-sentence observation about who this student IS as a person — their relationship to writing, their emotional patterns, what they protect — based on THIS turn only. null if nothing new revealed.>"
```

5. Update `defaultSidecar()` to include `portraitUpdate: null`.
6. Update `validateSidecar()` to extract `portraitUpdate`.

**Post-processing** (accumulate portrait observations):

7. After the sidecar post-processing block (after line ~799), add:
```typescript
// Accumulate portrait observations for next theory synthesis
if (sidecar.portraitUpdate && memory.studentTheory) {
  memory.studentTheory.pendingObservations.push(sidecar.portraitUpdate);
}
```

**Periodic synthesis** (new private method):

8. Add `synthesizeStudentTheory()` method:
```typescript
/**
 * Synthesize a StudentTheory from the conversation so far.
 * Runs every 5 turns via Haiku. Reads: conversation history,
 * accumulated portrait observations, essay profile (for cross-layer),
 * and the previous theory (for continuity).
 */
private async synthesizeStudentTheory(
  conversationHistory: ConversationTurn[],
  profile: EssayProfile,
  memory: CoachingSessionMemory,
): Promise<{ theory: StudentTheory; cost: LayerCost }>
```

Prompt design:
- System: "You are synthesizing everything the coaching system knows about this student AS A PERSON — not their essay, but who they are when they write."
- Input: last 12 turns of conversation, pending portrait observations, previous theory (if any), `characterRevelation.blindSpots` and `admissionsPositioning.redFlags` from profile (for cross-layer)
- Output: JSON matching `StudentTheory` fields
- Model: Haiku, maxTokens: 500, temperature: 0.3

9. Call `synthesizeStudentTheory()` when `memory.turnCount % 5 === 0 && memory.turnCount > 0`, just before `runStage3CoachingResponse()`. Store result on `memory.studentTheory`. Clear `pendingObservations`.

**Prompt injection** (Block 3 addition):

10. In the user prompt construction (around line 1734), inject the student theory:
```typescript
const studentTheorySection = memory.studentTheory
  ? `\n\n=== WHO THIS STUDENT IS (your evolving read — use this to personalize your approach) ===\n` +
    `${memory.studentTheory.personhood}\n` +
    (memory.studentTheory.protectedValues.length > 0
      ? `PROTECTED (do not suggest changing): ${memory.studentTheory.protectedValues.join('; ')}\n` : '') +
    (memory.studentTheory.tensions.length > 0
      ? `TENSIONS: ${memory.studentTheory.tensions.join('; ')}\n` : '') +
    (memory.studentTheory.blindSpotHypotheses.length > 0
      ? `HYPOTHESES (you may be wrong): ${memory.studentTheory.blindSpotHypotheses.join('; ')}\n` : '') +
    (memory.studentTheory.essayRelationship ? `THEIR RELATIONSHIP TO THIS ESSAY: ${memory.studentTheory.essayRelationship}\n` : '') +
    (memory.studentTheory.crossLayerPatterns.length > 0
      ? `CROSS-LAYER: ${memory.studentTheory.crossLayerPatterns.join('; ')}` : '')
  : '';
```

11. Insert `${studentTheorySection}` in the user prompt, after the session arc section and before the escalation section.

#### File 3: `src/services/essayIntelligence/profileManager/essayProfileManager.ts`

12. No changes needed for Phase 1. The student theory lives on `CoachingSessionMemory` (ephemeral to the session). Phase 2 could persist it to the EssayProfile for cross-session continuity.

### Not Doing (Phase 2)
- Feeding StudentTheory back to L3.75 on re-analysis (crosses analysis pipeline boundary)
- Persisting StudentTheory on EssayProfile for cross-session use
- Injecting StudentTheory into Stage 4 deepening prompts

---

## Unit 2: Resistance Escalation (GAP 3)

### Problem
When a student resists feedback, the system has NO memory of the resistance beyond a single `essay_durable` conversation insight. If the student resists the same suggestion 3 times, the coach may repeat it a 4th time. The confusion tracker has a 4-level escalation ladder; resistance has nothing.

### Solution
Clone the confusion tracker infrastructure for resistance. Key differences:
- Richer key strategy: `${dimensionFocus}:P${focusParagraph}` (e.g., "voice:P1") instead of dimension-only
- Behavioral escalation levels that change POSTURE, not just approach
- Triggers on sidecar `category === 'resistance'` OR `cognitiveState` starts with `'resistant_to'`

### Type Definition

```typescript
// In profileTypes.ts

/**
 * Tracks repeated resistance to specific coaching suggestions.
 * Parallel to TopicConfusionTracker but with posture-based escalation.
 *
 * Escalation levels change the coach's BEHAVIORAL POSTURE, not just technique:
 * 0 = no resistance
 * 1 = noted — record the resistance, no special handling
 * 2 = reframe — ask what they're protecting before offering alternatives
 * 3 = name_pattern — explicitly name the pattern of resistance
 * 4 = honor_and_wait — stop suggesting changes to this area entirely
 */
export interface TopicResistanceTracker {
  /** Key format: "${dimensionFocus}:P${paragraphIndex}" or "${dimensionFocus}:essay" */
  topic: string;
  /** What specific suggestion(s) were rejected */
  rejectedSuggestions: string[];
  /** Number of resistance instances */
  instanceCount: number;
  /** Current escalation level (0-4) */
  escalationLevel: 0 | 1 | 2 | 3 | 4;
  /** Turn numbers where resistance was detected */
  resistanceTurns: number[];
}
```

### Changes

#### File 1: `src/services/essayIntelligence/profileTypes.ts`

1. Add `TopicResistanceTracker` interface (above).

#### File 2: `src/services/essayIntelligence/coaching/coachingService.ts`

**State management**:

2. Add instance field parallel to `confusionTrackers`:
```typescript
private resistanceTrackers: Map<string, TopicResistanceTracker> = new Map();
```

**Update logic** (new method):

3. Add `updateResistanceTracking()`:
```typescript
/**
 * Track resistance per topic. Triggered by sidecar category === 'resistance'
 * or cognitiveState starting with 'resistant_to'.
 * Resets (decrements) when the student engages positively on the same topic.
 */
private updateResistanceTracking(
  stage1: Stage1Output,
  turnNumber: number,
  sessionJournalEntry: string | null,
): void
```

- Derive topic key from `${dimensionFocus[0] ?? 'general'}:${focusParagraphs.length > 0 ? 'P' + (focusParagraphs[0] + 1) : 'essay'}`
- Increment on resistance; decrement (not delete) on positive engagement
- Journal entry becomes the `rejectedSuggestions` entry (best available description of what was rejected)

4. Call `updateResistanceTracking()` after `updateConfusionTracking()` (after line 806).

**Escalation context** (new method):

5. Add `buildResistanceEscalationContext()`:
```typescript
/**
 * Build resistance escalation context for injection into Stage 3 user prompt.
 * Only produces content when resistance level >= 2.
 *
 * The escalation levels change BEHAVIORAL POSTURE:
 * Level 2 — Reframe: ask what they're protecting
 * Level 3 — Name the pattern: "I notice you're protective of..."
 * Level 4 — Honor and wait: stop suggesting changes to this area
 */
private buildResistanceEscalationContext(stage1: Stage1Output): string
```

Escalation text:
- **Level 2**: `"The student rejected a suggestion about [topic]. Before offering alternatives, ask what they're protecting. Their resistance may be protecting the best part of the essay."`
- **Level 3**: `"The student has resisted [N] suggestions about [topic]. This is a pattern — name it gently: 'I notice you're protective of [aspect]. That instinct might be exactly right.' If they're right to protect it, help them strengthen it. If they're wrong, they need to discover that themselves."`
- **Level 4**: `"The student has deep conviction about [topic]. STOP suggesting changes to this area. If they bring it up, listen and validate. Your job is NOT to overcome this resistance — it's to help them do what they're trying to do. Only revisit if they specifically ask."`

6. Call `buildResistanceEscalationContext()` in the user prompt construction, immediately after `buildEscalationContext()` (line 1731). Inject into the user prompt alongside the confusion escalation section.

#### File 3: `src/services/essayIntelligence/profileTypes.ts` (already modified above)

No additional changes beyond the type definition.

### Not Doing
- Mode switch that replaces cached Block 1 content (architecturally broken — Block 1 is cached)
- Consecutive engagement tracking for exit conditions (over-engineering for Phase 1)
- `ResistanceState` on `CoachingSessionMemory` (the tracker map is sufficient)

---

## Unit 3: Inner Voice (GAP 2)

### Problem
The `CognitiveAssessment` is constructed from sidecar data with hollow values:
```typescript
assessment: `Student is ${sidecar.cognitiveState}`,  // Just echoes the enum
whatTheyNeed: sidecar.needsDeepening
  ? 'Profile understanding needs updating based on student input'
  : 'Continue coaching at current trajectory',  // Binary, useless
recommendedApproach: sidecar.category === 'resistance'
  ? 'Listen first — ask what they are protecting'
  : sidecar.category === 'reinterpretation'
  ? 'Build from student\'s reading — they may be right'
  : 'Continue current approach',  // 3-way ternary, nearly always "Continue"
```

This flows into `SessionEvent.summary` (line 2933) which becomes the session journal. The session journal is injected into future turns' prompts (line 1722-1728). The result: the journal reads "Continue current approach -- student engaged" for nearly every turn, providing zero signal to the coaching LLM.

### Solution
A single new sidecar field `innerVoice` that captures the coach's honest internal assessment. Not 3 separate fields (overweight) — one prose field that naturally includes assessment + need + approach.

### Changes

#### File 1: `src/services/essayIntelligence/coaching/coachingService.ts`

**Sidecar extension**:

1. Add `innerVoice` to `CoachingSidecar` interface:
```typescript
/** The coach's honest inner assessment — what you see but wouldn't say out loud.
 *  2-3 sentences. Be specific and honest. null only on first turn. */
innerVoice: string | null;
```

2. Add to `SIDECAR_INSTRUCTIONS` constant — append to the JSON schema:
```
,"innerVoice":"<Your honest inner read of this student RIGHT NOW — 2-3 sentences. What do you see that you wouldn't say out loud? Are they performing understanding? Ready for a breakthrough? Avoiding the real issue? Wrestling productively? Be specific: reference what they said, not abstract categories. null only if this is the very first turn.>"
```

3. Update `defaultSidecar()` to include `innerVoice: null`.
4. Update `validateSidecar()` to extract `innerVoice`.

**CognitiveAssessment construction** (replace hollow values):

5. Replace the hollow construction at line 765-776:
```typescript
const cognitiveAssessment: CognitiveAssessment = {
  assessment: sidecar.innerVoice
    ?? `Student is ${sidecar.cognitiveState}`,
  whatTheyNeed: sidecar.innerVoice
    ? (sidecar.needsDeepening
      ? 'Profile understanding needs updating — student revealed new context or reinterpreted meaning'
      : 'Continue coaching informed by inner voice assessment')
    : (sidecar.needsDeepening
      ? 'Profile understanding needs updating based on student input'
      : 'Continue coaching at current trajectory'),
  recommendedApproach: sidecar.innerVoice
    ? `Informed by: ${sidecar.innerVoice.split('.')[0]}`
    : (sidecar.category === 'resistance'
      ? 'Listen first — ask what they are protecting'
      : sidecar.category === 'reinterpretation'
      ? "Build from student's reading — they may be right"
      : 'Continue current approach'),
  responseIntensity: sidecar.responseIntensity,
};
```

The key change: `cognitiveAssessment.assessment` now contains the Sonnet's actual inner read, which flows into `SessionEvent.summary` (line 2933) and from there into the session journal context for future turns.

#### File 2: `src/services/essayIntelligence/profileTypes.ts`

No changes needed — `CognitiveAssessment` interface already has the right shape. The hollow VALUES were the problem, not the type.

### Not Doing
- 3 separate sidecar fields (`cognitiveAssessmentProse`, `whatTheyNeed`, `recommendedApproachProse`) — overweight
- Dismissing the problem entirely (Agent B) — the session journal is degraded
- Separate Haiku call for cognitive assessment (the old Stage 1.5 approach, already eliminated)

---

## Implementation Order

```
U3 (Inner Voice)           — smallest, self-contained, unblocks richer session events
  └── U2 (Resistance)      — uses sidecar data, benefits from richer events
       └── U1 (Student Theory) — most complex, benefits from both U2 and U3 data
```

**U3 estimated scope**: ~30 lines changed across 1 file (coachingService.ts only)
**U2 estimated scope**: ~120 lines added across 2 files (coachingService.ts + profileTypes.ts)
**U1 estimated scope**: ~200 lines added across 2 files (coachingService.ts + profileTypes.ts)

**Total**: ~350 lines, 2 files, 1 new Haiku call per 5 turns, 2 new sidecar fields.

---

## Token Budget Impact

Current sidecar instruction: ~200 tokens (11-field JSON schema)
After changes: ~300 tokens (13-field JSON schema — `portraitUpdate` + `innerVoice`)

Current sidecar output: ~150 tokens per turn
After changes: ~220 tokens per turn (2 new nullable prose fields)

Student Theory synthesis: ~800 input + 500 output tokens via Haiku every 5 turns = ~$0.0004

Student Theory injection into user prompt: ~200 tokens (when populated)

**Net prompt growth**: ~170 tokens/turn (sidecar instructions + output + theory injection amortized)
**Net cost growth**: ~$0.003/turn average (dominated by the Haiku synthesis amortization)

---

## Test Strategy

### U3 Tests
- Verify `innerVoice` is parsed from sidecar output
- Verify `SessionEvent.summary` contains the inner voice content (not "Continue current approach")
- Verify session journal in future turns reflects the richer assessment

### U2 Tests
- Verify resistance tracked when `category === 'resistance'`
- Verify resistance tracked when `cognitiveState === 'resistant_to_specific'`
- Verify escalation levels increment correctly
- Verify Level 4 escalation text includes "STOP suggesting changes"
- Verify resistance decrements (not deletes) on positive engagement
- Verify escalation context only appears at level >= 2

### U1 Tests
- Verify synthesis runs at turn 5, 10, 15 (not turn 1)
- Verify `pendingObservations` accumulate between syntheses
- Verify `pendingObservations` clear after synthesis
- Verify theory injection appears in user prompt
- Verify `protectedValues` from theory align with resistance tracker data
- E2E: 12-turn coaching session verifying theory evolution across 2 synthesis cycles
