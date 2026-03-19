# FORGE_PLAN.md -- Final Implementation Blueprint (13 Gaps)

> **Version**: v1 (Reality-Checked)
> **Date**: 2026-03-18
> **Status**: FINAL -- passes the "start coding" test
> **Verification**: Every code path, type, and prompt traced against real codebase

---

## DEPENDENCY CHAIN & IMPLEMENTATION ORDER

```
Phase 0 — CRITICAL BUGS + quick wins (parallel, ~4 hrs):
  GAP-14  (Activity Major Alignment)  -- CRITICAL bug: Robotics ≠ irrelevant to ME
  GAP-15  (Coaching Length Directive)  -- complement GAP-1 with prompt-level word limits
  GAP-20  (Resistance → Brief)        -- map resistance states to brief intensity
  GAP-9   (False Precision)           -- effectiveness bands utility
  GAP-7   (Emotional Cues)            -- activity workshop, isolated
  GAP-11  (School Context)            -- activity workshop, isolated

Phase 1 — Essay Intelligence foundation (parallel, ~6 hrs):
  GAP-18  (Observation Quality Filter) -- L3 walk: 129→30-45 observations
  GAP-19  (Voice Intentionality)       -- quality-level-aware calibration in L3.75
  GAP-21  (Scope Inflation + Red Flags) -- add 3 structural red flag patterns to L3.75
  GAP-4   (AO First Read)             -- new file + orchestrator wiring
  GAP-5   (Person Portrait)           -- L3.75 prompt: lunch framing
  GAP-10  (Archetype)                 -- L3.75 type + prompt, feeds GAP-8

Phase 2 — Scoring & Phase (depends on Phase 1, ~2 hrs):
  GAP-17  (Scoring Calibration)       -- widen effective scoring range (implement FIRST)
  GAP-3   (Phase Detector)            -- phaseAssessment.ts narrative calibration
  GAP-8   (Scoring Bias)              -- analysisPass.ts admissions criteria (implement AFTER 17)

Phase 3 — Coaching layer (depends on Phase 2, ~3 hrs):
  GAP-1   (Response Intensity)        -- coachingService.ts maxTokens wiring
  GAP-2   (Learning Style)            -- coachingService.ts sidecar + accumulation
  GAP-6   (Strategic Thread)          -- coachingService.ts strategic question + staleness

Phase 4 — Cross-cutting (depends on modules existing, ~3 hrs):
  GAP-16  (PIQ Ceiling Recognition)   -- reduce suggestions for 85+ PIQs
  GAP-12  (PIQ Portfolio)             -- embedded portfolio context
  GAP-13  (Cross-Module Bridge)       -- new bridge file, all modules
```

---

## GAP-9: False Precision (Score Presentation)

**Decision**: Agent A -- effectiveness bands
**Files**: New utility (suggest `src/services/essayIntelligence/analysis/effectivenessBands.ts`)
**Risk**: Low
**Effort**: ~30 min

### What to Build

A `toEffectivenessBand()` utility function that maps 0-100 scores to named bands for user-facing display. Internal scoring remains 0-100.

### Type Definition

```typescript
// src/services/essayIntelligence/analysis/effectivenessBands.ts

export type EffectivenessBand =
  | 'masterful'     // 96-100
  | 'exceptional'   // 86-95
  | 'strong'        // 76-85
  | 'functional'    // 55-75
  | 'developing'    // 40-54
  | 'problematic';  // 0-39

export interface EffectivenessBandResult {
  band: EffectivenessBand;
  label: string;          // "Strong" (title case for display)
  description: string;    // "Does its job with distinction"
  range: [number, number]; // [76, 85]
}

export function toEffectivenessBand(score: number): EffectivenessBandResult;
```

### Implementation

Map ranges from the existing calibration table in `analysisPass.ts` lines 315-322:

| Score | Band | Label | Description |
|-------|------|-------|-------------|
| 96-100 | masterful | Masterful | Would make an AO pause and re-read |
| 86-95 | exceptional | Exceptional | Memorable after reading 50 essays |
| 76-85 | strong | Strong | Does its job with distinction |
| 55-75 | functional | Functional | Competent but not memorable |
| 40-54 | developing | Developing | Gets the point across with issues |
| 0-39 | problematic | Problematic | Actively harms the essay |

### Consumer Sites
- Frontend components displaying sentence/paragraph scores
- Any coaching response that references scores to students
- The utility is a pure function -- no LLM calls, no side effects

### Test
Unit test: input scores at boundaries (0, 39, 40, 54, 55, 75, 76, 85, 86, 95, 96, 100) map to correct bands. Edge cases: NaN -> problematic, negative -> problematic, >100 -> masterful.

---

## GAP-7: Emotional Cues (Activity Workshop)

**Decision**: Hybrid (A's softened ban + B's translation table)
**Files**: `src/services/portfolioStrategy/services/activityWorkshop/chat/dynamicConversationEngine.ts`, `src/services/portfolioStrategy/services/activityWorkshop/chat/questionGenerator.ts`
**Risk**: Low
**Effort**: ~45 min

### Change 1: Soften the ban in dynamicConversationEngine.ts

**File**: `dynamicConversationEngine.ts`
**Location**: Lines 574-578 (the "DON'T ASK ABOUT" section in `buildSystemPrompt()`)

**Current**:
```
DON'T ASK ABOUT:
- "What was hardest/most challenging?" (struggles don't make impressive descriptions)
- "What obstacles/barriers did you face?" (same problem - focuses on difficulty, not achievement)
- "How did you feel?" (vague, doesn't translate to concrete descriptions)
- Generic struggles, difficulties, or challenges
```

**Replace with**:
```
DON'T INITIATE QUESTIONS ABOUT:
- "What was hardest/most challenging?" (struggles don't make impressive descriptions)
- "What obstacles/barriers did you face?" (same problem - focuses on difficulty, not achievement)
- "How did you feel?" (vague, doesn't translate to concrete descriptions)
- Generic struggles, difficulties, or challenges

WHEN A STUDENT VOLUNTEERS EMOTIONAL CONTEXT (they bring it up, you don't ask):
Emotion is EVIDENCE OF STAKES. Translate it into description-worthy content:
- "terrified/nervous" -> the stakes were high enough to feel personal risk -> ask about WHAT was at risk
- "proud/excited" -> the outcome mattered to them personally -> ask about the specific outcome
- "frustrated/angry" -> they cared enough to push through -> ask about what they DID about it
- "passionate/obsessed" -> sustained deep engagement -> ask about hours, duration, depth
- "overwhelmed" -> the scope was significant -> ask about scale and what they managed

Example: Student says "I was so nervous presenting to the board"
BAD follow-up: "How did you handle that nervousness?"
GOOD follow-up: "Presenting to a board — how many people were you presenting to, and what were you asking them to approve?"
The emotion tells you the stakes were real. Now get the FACTS that prove it.
```

### Change 2: Add follow-up template in questionGenerator.ts

**File**: `questionGenerator.ts`
**Location**: After line 305 (after `short_response` in `FOLLOW_UP_TEMPLATES`)

**Add**:
```typescript
mentioned_emotion: [
  "That sounds like the stakes were real. What specifically was on the line?",
  "When you felt that way, what were you in the middle of? Walk me through the specifics.",
  "That emotion tells me you cared deeply about this. What was the concrete outcome?",
],
```

### Test
Manual: provide an activity description, then in conversation say "I was really nervous about presenting." Verify the response probes for FACTS (who, how many, what outcome) rather than FEELINGS.

---

## GAP-11: School/Competition Context (Activity Workshop)

**Decision**: Hybrid (A's templates + B's advocacy framing)
**Files**: `src/services/portfolioStrategy/services/activityWorkshop/chat/questionGenerator.ts`
**Risk**: Low
**Effort**: ~30 min

### What to Add

New question templates in `QUESTION_TEMPLATES` after the existing `connections.characterTraits` block (line ~274). These are framed as advocacy (building the student's case), not data collection.

```typescript
// CONTEXT - Competitive Environment (builds the case for impressiveness)
'facts.context.schoolSize': {
  questions: [
    "How big is your school? That helps me understand the scale of what you did.",
    "How many students are at your school — roughly?",
  ],
  category: 'numeric_ask',
  phase: 'fact_gathering',
  priority: 'medium',
},
'facts.context.competitionLevel': {
  questions: [
    "Was there a selection process to get this role, or did you create it yourself?",
    "How many people applied or tried out? That selectivity makes your role more impressive.",
    "Were you chosen for this — and if so, from how many candidates?",
  ],
  category: 'specific_probe',
  phase: 'fact_gathering',
  priority: 'high',
},
'facts.context.fieldSelectivity': {
  questions: [
    "In your field, how competitive is this level of achievement?",
    "How does what you accomplished compare to others at your level?",
    "Is this the kind of thing most students can do, or is it rare?",
  ],
  category: 'specific_probe',
  phase: 'fact_gathering',
  priority: 'medium',
},
```

### Test
Run the question generator with an activity profile that has leadership signals but no context fields populated. Verify the context templates appear as candidates.

---

## GAP-4: AO First Read Simulation

**Decision**: Agent A -- new Haiku call, parallel with L1
**Files**: New file `src/services/essayIntelligence/analysis/aoFirstRead.ts`, modify `src/services/essayIntelligence/analysis/analysisOrchestrator.ts`, add type to `profileTypes.ts`
**Risk**: Medium (new pipeline stage)
**Effort**: ~2 hours

### Type Definition

Add to `profileTypes.ts`:

```typescript
/**
 * AOFirstRead -- the naive gut reaction of an admissions officer
 * reading this essay for the first time under attention fatigue.
 *
 * Produced by a Haiku call PARALLEL with L1. The value is the naive
 * reaction BEFORE deep understanding -- something L3.75's admissionsPositioning
 * cannot replicate because it knows too much.
 */
export interface AOFirstRead {
  /** Where in the first paragraph (if anywhere) the AO's attention locks in */
  hookMoment: string | null;
  /** One sentence the AO would say to a colleague: "This is the essay about..." */
  committeeOneLiner: string;
  /** What makes this essay NOT just another [topic] essay -- or null if it IS just another one */
  distinctivenessSignal: string | null;
  /** Risk of being put down after paragraph 1: high / moderate / low */
  putDownRisk: 'high' | 'moderate' | 'low';
  /** Gut reaction reasoning: 2-3 sentences of honest AO internal monologue */
  gutReaction: string;
}
```

### New File: aoFirstRead.ts

```typescript
// src/services/essayIntelligence/analysis/aoFirstRead.ts

const HAIKU = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You are an admissions officer at a selective university. It's 4:15pm. You've read 29 essays today. You have a stack of 14 more. You're experienced, fair, but TIRED.

You are about to read essay #30. Give your HONEST gut reaction.

You are NOT analyzing this essay deeply. You are reading it ONCE, the way a real AO reads -- scanning for a hook, forming a quick impression, deciding whether to lean forward or start skimming.

Output JSON:
{
  "hookMoment": "<quote the specific phrase/image in paragraph 1 that made you keep reading, or null if nothing grabbed you>",
  "committeeOneLiner": "<one sentence you'd say to your colleague: 'This is the essay about...' -- what sticks?>",
  "distinctivenessSignal": "<what makes this NOT just another [topic] essay, or null if you've read this essay 50 times before>",
  "putDownRisk": "<high|moderate|low> -- how likely are you to start skimming by paragraph 2?",
  "gutReaction": "<2-3 sentences of honest internal monologue as you read. Be real. 'Another sports injury essay...' or 'Okay the pawnshop detail is specific, I'm paying attention...'>"
}`;

export interface AOFirstReadResult {
  firstRead: AOFirstRead;
  cost: number;
  tokenUsage: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number };
  timingMs: number;
}

export async function runAOFirstRead(essayText: string): Promise<AOFirstReadResult>;
```

### Implementation Notes
- Single Haiku call, `maxTokens: 400`, `temperature: 0.5` (slightly higher for authentic voice)
- `cacheSystemPrompt: true` (system prompt is static)
- User prompt is just the essay text: `"Read this essay:\n\n${essayText}"`
- Validate output: coerce `putDownRisk` to valid enum, default `hookMoment`/`distinctivenessSignal` to null
- On failure: return a degraded result with `putDownRisk: 'moderate'` and generic `gutReaction`

### Orchestrator Wiring

**File**: `analysisOrchestrator.ts`
**Location**: After L1 call starts (line ~273), add AOFirstRead in parallel

```typescript
// PHASE 1: Foundation (L1 + AOFirstRead parallel → L2 + L2.5 parallel)
const [l1Result, aoFirstReadResult] = await Promise.allSettled([
  firstImpressionsService.analyze(input.essayText),
  runAOFirstRead(input.essayText),
]);
```

Store the `AOFirstRead` result on the profile (add `aoFirstRead?: AOFirstRead` to `EssayProfile`). Available to:
- L3.75 holistic synthesis (as input context -- "the naive AO reaction was...")
- L6 coaching (the coach can reference "an AO reading this would...")
- L3.5 scoring (as calibration context for the anchor paragraph)

### Cost
~$0.003 per essay. Zero additional latency (parallel with L1).

### Test
Run against a strong essay and a weak essay. Verify:
- Strong: low putDownRisk, non-null hookMoment and distinctivenessSignal
- Weak: high putDownRisk, generic committeeOneLiner

---

## GAP-5: Person Portrait (Human Behind the Essay)

**Decision**: Agent B -- lunch framing with examples
**Files**: `src/services/essayIntelligence/analysis/holisticSynthesis.ts`
**Risk**: Low
**Effort**: ~20 min

### Prompt Change

**File**: `holisticSynthesis.ts`
**Location**: Line 487 (the `writerPortrait` field in the L3.75 JSON schema)

**Current**:
```
"writerPortrait": "<who is this writer -- the person behind the words, not the essay>"
```

**Replace with**:
```
"writerPortrait": "<who would you want to have lunch with after reading this? Describe the PERSON — their energy, what they'd talk about, how they see the world. NOT their essay topics or writing ability.

WRONG: 'A thoughtful writer who uses vivid imagery to explore themes of identity and belonging.'
WRONG: 'The author demonstrates strong emotional intelligence through their narrative choices.'
RIGHT: 'Someone who notices small things others miss — the kind of person who'd stop mid-sentence because they saw something out the window that reminded them of their grandmother's kitchen. Probably argues with their friends about whether something counts as art. Almost certainly has strong opinions about food.'
RIGHT: 'The person who stays late not because they have to but because they got curious about something adjacent. Laughs at their own failures with genuine amusement, not performance. Would probably talk your ear off about water quality data if you let them.'>"
```

### Why This Works
The "lunch" framing forces the LLM to describe a PERSON, not a writer. The WRONG/RIGHT examples explicitly prohibit essay analysis language. The result feeds into `characterRevelation.writerPortrait` which is used by coaching and admissions positioning.

### Test
Run L3.75 against an essay. Verify the writerPortrait describes a person you could picture having lunch with, not an abstract analysis of writing technique.

---

## GAP-10: Essay Archetype Classification

**Decision**: Hybrid (A's profile field + B's scoring calibration)
**Files**: `profileTypes.ts`, `holisticSynthesis.ts`, `analysisPass.ts`
**Risk**: Medium
**Effort**: ~1.5 hours

### Type Addition

**File**: `profileTypes.ts`
**Location**: After `aoTakeaway` field on `AdmissionsPositioning` (line 904)

**Add**:
```typescript
/** Archetype classification -- what essay "type" this falls into from an AO's pattern-matching perspective */
archetypeContext?: {
  /** The archetype name: "sports injury comeback", "immigrant identity", "service trip revelation", etc. */
  archetype: string;
  /** How common this archetype is in the applicant pool */
  poolDensity: 'saturated' | 'common' | 'moderate' | 'uncommon' | 'rare';
  /** What (if anything) makes THIS essay's execution non-generic within the archetype */
  differentiator: string | null;
};
```

### L3.75 Prompt Addition

**File**: `holisticSynthesis.ts`
**Location**: After `aoTakeaway` in the admissionsPositioning JSON schema (line ~522)

**Add to schema**:
```
"archetypeContext": {
  "archetype": "<name the essay archetype an AO would mentally file this under — e.g., 'sports injury comeback', 'immigrant identity', 'service trip revelation', 'music as metaphor', 'death of a grandparent', 'leadership through adversity'. Be honest about the archetype even if the essay is good.>",
  "poolDensity": "<saturated|common|moderate|uncommon|rare> — how many essays in a typical applicant pool of 500 match this archetype?",
  "differentiator": "<what makes THIS essay's execution non-generic within the archetype, or null if the execution is also generic>"
}
```

### L3.5 Scoring Calibration

**File**: `analysisPass.ts`
**Location**: After the calibration examples (around line 337), add a new calibration note

**Add**:
```
ARCHETYPE CALIBRATION:
If the holistic context identifies a saturated or common archetype with a null differentiator,
the essay must earn its scores through EXECUTION, not topic. A "sports injury comeback" essay
with generic execution ("I learned perseverance") should score 10-15 points lower on sentences
that rely on the archetype's expected beats rather than earning moments through specific detail.
A saturated archetype with brilliant execution can still score 85+, but generic sentences within
a saturated archetype rarely deserve above 55.
```

### Orchestrator Wiring
The archetype is produced by L3.75 and stored on the profile. L3.5 receives the full profile (including archetype) as part of its understanding context. No explicit wiring needed beyond the prompt addition -- the existing context assembly already passes the holistic profile to L3.5.

### Test
Run against a "sports injury" essay with generic execution. Verify:
- L3.75 outputs `archetype: "sports injury comeback"`, `poolDensity: "saturated"`
- L3.5 scores generic "I learned perseverance" sentences lower (~50-55) than specific detail sentences (~70+)

---

## GAP-3: Phase Detector (Narrative Essay Calibration)

**Decision**: Hybrid (A's data surfacing + B's reframe)
**Files**: `src/services/essayIntelligence/analysis/phaseAssessment.ts`
**Risk**: Low
**Effort**: ~30 min

### Change 1: Surface narrative data in buildHolisticDigest()

**File**: `phaseAssessment.ts`
**Location**: Lines 215-222 (the `narrativeStrategy` section of `buildHolisticDigest()`)

**Current**:
```typescript
if (profile.narrativeStrategy) {
  const ns = profile.narrativeStrategy;
  if (ns.arcMomentum) lines.push(`  Arc momentum: ${ns.arcMomentum}`);
  if (Array.isArray(ns.pivotPoints)) {
    lines.push(`  Pivot points: ${ns.pivotPoints.length}`);
  }
  if (ns.turningPoint != null) lines.push(`  Turning point: present`);
}
```

**Replace with**:
```typescript
if (profile.narrativeStrategy) {
  const ns = profile.narrativeStrategy;
  if (ns.arcType) lines.push(`  Narrative arc: ${ns.arcType}`);
  if (ns.primaryStrategy) lines.push(`  Strategy: ${ns.primaryStrategy}`);
  if (ns.arcMomentum) lines.push(`  Arc momentum: ${ns.arcMomentum}`);
  if (Array.isArray(ns.pivotPoints)) {
    lines.push(`  Pivot points: ${ns.pivotPoints.length}`);
  }
  if (ns.turningPoint != null) lines.push(`  Turning point: present`);
}
```

### Change 2: Add narrative calibration to phase system prompt

**File**: `phaseAssessment.ts`
**Location**: After line 116 (the dimension divergence check), before "COACHING LENS:"

**Add**:
```
NARRATIVE ESSAY CALIBRATION:
For narrative essays (reflective, montage, bracket, lyrical arcs), "thesis" manifests as an emergent theme or revelation, not an explicit statement. A narrative essay at ARCHITECTURE phase may have a powerful through-line but no stated thesis -- this is intentional, not a weakness. Judge narrative essays by their arc coherence, earned moments, and thematic resonance rather than thesis clarity. When the holistic context shows a narrative arc type, recalibrate your thesis expectations accordingly.
```

### Why Both Changes Together
The data surfacing ensures the LLM sees the narrative arc type. The calibration note tells it what to do with that information. Without both, the LLM either lacks the data (change 1 alone) or lacks the instruction (change 2 alone).

### Test
Run phase assessment on a narrative essay with strong arc but no explicit thesis. Verify it does NOT default to foundation/architecture solely due to low thesis confidence.

---

## GAP-8: Scoring Bias (Admissions Relevance in Craft Scores)

**Decision**: Agent A -- integrated admissions criteria
**Files**: `src/services/essayIntelligence/analysis/analysisPass.ts`
**Risk**: Medium (changes scoring behavior)
**Effort**: ~45 min

### Change 1: Add admissions criteria to evaluation method

**File**: `analysisPass.ts`
**Location**: Lines 358-364 (the evaluation criteria list)

**Current**:
```
3. **Reason about effectiveness** -- HOW WELL does this sentence achieve its stated purpose? Consider:
   - Specificity vs. vagueness
   - Show vs. tell
   - Voice authenticity vs. performed voice
   - Structural contribution vs. filler
   - Earned emotional moments vs. asserted emotions
   - Memorable craft vs. generic competence
```

**Replace with**:
```
3. **Reason about effectiveness** -- HOW WELL does this sentence achieve its stated purpose? Consider:
   - Specificity vs. vagueness
   - Show vs. tell
   - Voice authenticity vs. performed voice
   - Structural contribution vs. filler
   - Earned emotional moments vs. asserted emotions
   - Memorable craft vs. generic competence
   - Admissions resonance: does this sentence reveal something about the student that would matter to an AO? A sentence can be well-crafted but reveal nothing, or plainly written but deeply revealing
   - Revelation density: how much of the student's character, values, or thinking does this sentence surface per word?

ADMISSIONS-CRAFT INTEGRATION:
This is a college admissions essay, not a literary exercise. When craft quality and admissions value conflict, admissions value carries MORE weight. A plainly-written sentence that reveals a genuine, specific moment of the student's character ("My GPA dropped from 3.9 to 2.1 the semester my parents divorced") is MORE effective than a beautifully crafted sentence that reveals nothing new about the student. Score accordingly.
```

### Change 2: Add admissions calibration example

**File**: `analysisPass.ts`
**Location**: After the score 88 example (around line 337), add:

```
SCORE 78: "My GPA dropped from 3.9 to 2.1 the semester my parents divorced."
WHY 78: No craft technique — the sentence is plain. But the specificity is devastating: exact numbers (3.9 to 2.1), exact trigger (parents' divorce), exact timeframe (one semester). An AO reads this and UNDERSTANDS something irreplaceable about this student's trajectory. The admissions revelation density is very high despite modest craft. Not 86+ because the sentence could be more architecturally integrated into the essay's structure.
```

### What NOT to Change
- Do NOT add new fields to `SentenceAnalysis`. The LLM already has `effectivenessReasoning` which is free-form. Admissions considerations will naturally appear there.
- Do NOT add post-hoc scoring adjustments. The LLM integrates admissions natively during its reasoning process.

### Test
Run L3.5 on an essay with a plain but deeply revealing sentence. Verify it scores higher (~75-85) than a beautifully crafted but generic sentence (~55-65).

---

## GAP-1: Response Intensity (Coaching Length Control)

**Decision**: Hybrid (A's memory + Stage 1.5 signal)
**Files**: `src/services/essayIntelligence/profileTypes.ts`, `src/services/essayIntelligence/coaching/coachingService.ts`
**Risk**: Low
**Effort**: ~1 hour

### Type Change

**File**: `profileTypes.ts`
**Location**: After `nextFocus` in `CoachingSessionMemory` (line 2146)

**Add**:
```typescript
/**
 * The response intensity from the PREVIOUS turn's sidecar output.
 * Used as a consistency signal alongside Stage 1.5's intensity assessment.
 * null on first turn.
 */
lastResponseIntensity?: 'full' | 'brief' | 'minimal' | null;
```

### Wiring: Use Stage 1.5 intensity for maxTokens

**File**: `coachingService.ts`
**Location**: After the Stage 1.5 call returns (around line 2450+) and before the Stage 3 Sonnet call (line 1482-1492)

The Stage 1.5 call at line 2357 already returns `responseIntensity` in its output. The implementation should:

1. Extract `intensity` from the Stage 1.5 result (already parsed)
2. Map intensity to maxTokens:
   - `full` -> 2200 (current default)
   - `brief` -> 1200
   - `minimal` -> 600
3. Pass the dynamic maxTokens to the Stage 3 `callClaude()` call at line 1487

**Current** (line 1487):
```typescript
maxTokens: 2200,
```

**Replace with** (pseudocode -- actual variable name depends on where 1.5 result is accessible):
```typescript
maxTokens: intensityToMaxTokens(stage1_5Intensity),
```

Where:
```typescript
function intensityToMaxTokens(intensity: 'full' | 'brief' | 'minimal'): number {
  switch (intensity) {
    case 'full': return 2200;
    case 'brief': return 1200;
    case 'minimal': return 600;
  }
}
```

### Wiring: Store sidecar intensity in session memory

After parsing the sidecar from Stage 3's response (where `responseIntensity` is extracted), store it:

```typescript
memory.lastResponseIntensity = sidecar.responseIntensity;
```

This is available on the next turn for consistency checking but is NOT the primary signal (Stage 1.5 is).

### Important Implementation Detail
The Stage 1.5 call currently runs INSIDE `processCoachingTurn`. Its result needs to be accessible at the point where `maxTokens` is set for Stage 3. Trace the call flow:
- Stage 1.5 runs at line ~2357 (private method)
- Stage 3 Sonnet call at line ~1482 (inside the main flow)
- The `stage1_5Intensity` must flow from the Stage 1.5 result to the Stage 3 call site

### Test
Send a short confirmation message ("Yeah, I see what you mean"). Verify:
- Stage 1.5 returns `minimal` intensity
- Stage 3 maxTokens is set to 600
- Coach response is short (acknowledgment, not lecture)

---

## GAP-2: Learning Style Accumulation

**Decision**: Refined (complete existing wiring)
**Files**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Risk**: Low
**Effort**: ~45 min

### Change 1: Add learningStyleUpdate to sidecar

**File**: `coachingService.ts`
**Location**: Line 167 (the `SIDECAR_INSTRUCTIONS` constant, sidecar JSON schema)

**Current sidecar JSON** (line 167):
```
{"category":"...","cognitiveState":"...","focusParagraphs":[...],"dimensionFocus":[...],"responseIntensity":"...","sessionJournalEntry":"...","contextAccumulation":"...","needsDeepening":...,"deepeningReason":"..."}
```

**Add field**:
```
"learningStyleUpdate":"<1-sentence observation about how this student learns based on THIS turn's interaction, or null. Examples: 'Responds better to specific text comparisons than abstract descriptions', 'Needs to see the problem demonstrated before accepting the fix', 'Engages deeply when connecting essay craft to their personal experience'>"
```

### Change 2: Accumulate from sidecar on every turn

After parsing the sidecar (in the sidecar extraction logic), when `sidecar.learningStyleUpdate` is non-null:

```typescript
if (sidecar.learningStyleUpdate) {
  // Cap at 8 observations, evict oldest tentative first
  if (style.observations.length >= 8) {
    const tentativeIdx = style.observations.findIndex(o => o.confidence === 'tentative');
    if (tentativeIdx >= 0) {
      style.observations.splice(tentativeIdx, 1);
    } else {
      style.observations.shift(); // evict oldest
    }
  }
  style.observations.push({
    observation: sidecar.learningStyleUpdate,
    confidence: 'tentative',
    turnObserved: memory.turnCount + 1,
  });
}
```

### Change 3: Promote confidence over time

In the existing pattern detection (every 3+ turns, line ~2195), when `learningStyleUpdate` is non-null from pattern detection, check if it confirms an existing tentative observation. If so, promote to 'growing'. If a 'growing' observation is confirmed again, promote to 'confident'.

This logic already partially exists -- the pattern detection `learningStyleUpdate` field was designed for this. The gap is that the sidecar provides turn-by-turn signal to ACCUMULATE, while pattern detection provides periodic CONFIRMATION.

### Test
Run a 5-turn coaching session. Verify:
- Turn 1: sidecar produces learningStyleUpdate -> added as tentative
- Turn 3: pattern detection confirms -> promoted to growing
- Turn 6: further confirmation -> promoted to confident
- Never exceeds 8 observations

---

## GAP-6: Strategic Thread (Persistent Coaching Direction)

**Decision**: Agent B -- strategic question + staleness
**Files**: `src/services/essayIntelligence/profileTypes.ts`, `src/services/essayIntelligence/coaching/coachingService.ts`
**Risk**: Low-Medium
**Effort**: ~1 hour

### Type Changes

**File**: `profileTypes.ts`
**Location**: `CoachingSessionMemory` (line 2108)

**Replace** `nextFocus` (line 2142-2146):
```typescript
/**
 * What the session should focus on next -- LLM-assessed after each turn.
 * Not a fixed curriculum -- emerges from the conversation.
 */
nextFocus: string;
```

**With**:
```typescript
/**
 * Strategic question driving the session -- a curiosity, not a topic label.
 * Example: "Does the student hear the voice shift between P2 and P3?"
 * LLM-assessed after each turn. Naturally infiltrates coaching responses.
 * @deprecated nextFocus still populated for backward compat; strategicQuestion is preferred.
 */
nextFocus: string;

/**
 * The strategic question that should guide the next coaching response.
 * A QUESTION, not a topic. Example: "Can the student explain why P4 matters
 * to their overall argument?" Questions naturally infiltrate responses better
 * than topic directives like "focus on voice."
 */
strategicQuestion: string;

/**
 * How many consecutive turns the strategicQuestion has remained unchanged.
 * Reset to 0 when strategicQuestion is updated by pattern detection.
 * At 4+, pattern detection includes a gentle escalation note.
 */
questionStaleness: number;
```

### Session Memory Initialization

**File**: `coachingService.ts`
**Location**: `initializeSessionMemory()` (line 2565)

Add:
```typescript
strategicQuestion: '',
questionStaleness: 0,
```

### Injection into Stage 3 prompt

**File**: `coachingService.ts`
**Location**: Session arc section (line 1434-1450)

In the MIDDLE SESSION and LATE SESSION blocks, replace:
```
${sessionMemory.nextFocus ? `SUGGESTED NEXT FOCUS: ${sessionMemory.nextFocus}` : ''}
```

With:
```
${sessionMemory.strategicQuestion ? `STRATEGIC QUESTION (let this guide your response): ${sessionMemory.strategicQuestion}` : (sessionMemory.nextFocus ? `SUGGESTED NEXT FOCUS: ${sessionMemory.nextFocus}` : '')}
${sessionMemory.questionStaleness >= 4 ? `NOTE: This question has been the strategic thread for ${sessionMemory.questionStaleness} turns without the student engaging it directly. Consider weaving it in more gently, or assessing whether it's still the right question.` : ''}
```

### Pattern Detection Update

**File**: `coachingService.ts`
**Location**: Pattern detection output schema (line ~2220)

Add to the JSON schema:
```
"strategicQuestionUpdate": "<a QUESTION (not a topic) that should drive the next coaching response. Must be specific to this essay and this student's current position. Example: 'Can the student feel the difference between P2's authentic voice and P3's performed voice?' Set to null if the current strategic question is still the right one.>"
```

After pattern detection parses, if `strategicQuestionUpdate` is non-null:
```typescript
memory.strategicQuestion = parsed.strategicQuestionUpdate;
memory.questionStaleness = 0;
```
Else:
```typescript
memory.questionStaleness += 1;
```

### Test
Run a 6-turn session. Verify:
- Turn 2: pattern detection sets a specific question ("Does the student...")
- Turns 3-5: question remains, staleness increments
- Turn 6: if student engages the question, pattern detection updates it. If not, staleness note appears in prompt.

---

## GAP-12: PIQ Portfolio Synthesis

**Decision**: Agent B -- embedded portfolio context
**Files**: PIQ analysis service (the main prompt builder for PIQ analysis)
**Risk**: Low
**Effort**: ~1 hour

### Design

When analyzing the Nth PIQ (N >= 2), inject a portfolio context section into the analysis prompt. The section contains `quickSummary` and key dimension highlights from prior PIQ results.

### What to Build

1. A function `buildPIQPortfolioContext(priorResults: PIQWorkshopResult[]): string` that assembles a prompt section:

```typescript
function buildPIQPortfolioContext(priorResults: PIQWorkshopResult[]): string {
  if (priorResults.length === 0) return '';

  const lines: string[] = [
    '=== PIQ PORTFOLIO CONTEXT ===',
    `This student has already written ${priorResults.length} other PIQ(s).`,
    '',
  ];

  for (let i = 0; i < priorResults.length; i++) {
    const r = priorResults[i];
    lines.push(`PIQ ${i + 1}: ${r.quickSummary}`);

    // Extract top dimensions that scored well
    const strongDims = r.dimensions
      .filter(d => d.status === 'good' || d.status === 'excellent')
      .map(d => d.name)
      .slice(0, 3);
    if (strongDims.length > 0) {
      lines.push(`  Strong dimensions: ${strongDims.join(', ')}`);
    }

    // Extract main issues
    const topIssueNames = r.topIssues.slice(0, 2).map(i => i.title);
    if (topIssueNames.length > 0) {
      lines.push(`  Key issues: ${topIssueNames.join(', ')}`);
    }
    lines.push('');
  }

  lines.push('PORTFOLIO DIRECTIVE: This PIQ should reveal DIFFERENT dimensions of this student than their other PIQs. If their prior PIQs already demonstrate leadership and initiative, this one should show a different facet -- creativity, vulnerability, intellectual curiosity, community connection, etc. Evaluate this PIQ in the context of what the PORTFOLIO needs, not just what this individual PIQ achieves.');

  return lines.join('\n');
}
```

2. Inject this into the PIQ analysis prompt when `priorResults` is provided as an optional parameter.

### Caller Responsibility
The HTTP route handler or PIQ orchestrator must pass prior `PIQWorkshopResult[]` when available. This requires the caller to store/retrieve prior results -- likely from the database or session state. The bridge function itself is pure (string in, string out).

### Test
Analyze a 2nd PIQ with prior result showing strong leadership. Verify the analysis flags when the 2nd PIQ also focuses on leadership ("portfolio overlap -- consider showing a different dimension").

---

## GAP-13: Cross-Module Bridge

**Decision**: Agent B -- prose narrative bridge
**Files**: New file `src/services/studentNarrativeBridge.ts`
**Risk**: Low
**Effort**: ~1 hour

### What to Build

A pure function that assembles available cross-module context into a prose string. No LLM calls. Decoupled -- modules don't know about each other's types.

```typescript
// src/services/studentNarrativeBridge.ts

/**
 * Assembles available cross-module context into a prose string
 * for injection into any module's prompts.
 *
 * Pure function. No LLM calls. Each input is optional.
 * Modules produce strings; this bridge consumes them.
 */

export interface StudentModuleOutputs {
  /** From essay intelligence: quickSummary or coaching lens */
  essayIntelligence?: {
    coachingLens?: string;      // from ImprovementPhase
    writerPortrait?: string;    // from CharacterRevelation
    revealedQualities?: string[]; // from CharacterRevelation
  };
  /** From activity workshop: profile summary */
  activityProfiles?: Array<{
    title: string;
    tier: number;
    keyStrengths: string[];
  }>;
  /** From PIQ workshop: prior PIQ summaries */
  piqSummaries?: string[];
  /** From academic advisor: academic context */
  academicContext?: {
    gpaContext?: string;
    courseLoadSummary?: string;
    majorDirection?: string;
  };
}

export function assembleStudentContext(outputs: StudentModuleOutputs): string {
  const sections: string[] = [];

  if (outputs.essayIntelligence) {
    const ei = outputs.essayIntelligence;
    const parts: string[] = [];
    if (ei.writerPortrait) parts.push(`This student: ${ei.writerPortrait}`);
    if (ei.revealedQualities?.length) parts.push(`Qualities shown in writing: ${ei.revealedQualities.join(', ')}`);
    if (ei.coachingLens) parts.push(`Current coaching approach: ${ei.coachingLens}`);
    if (parts.length > 0) sections.push(parts.join('. '));
  }

  if (outputs.activityProfiles?.length) {
    const summary = outputs.activityProfiles
      .map(a => `${a.title} (Tier ${a.tier}): ${a.keyStrengths.slice(0, 2).join(', ')}`)
      .join('; ');
    sections.push(`Activities: ${summary}`);
  }

  if (outputs.piqSummaries?.length) {
    sections.push(`PIQ insights: ${outputs.piqSummaries.join('. ')}`);
  }

  if (outputs.academicContext) {
    const ac = outputs.academicContext;
    const parts: string[] = [];
    if (ac.majorDirection) parts.push(`Intended direction: ${ac.majorDirection}`);
    if (ac.gpaContext) parts.push(ac.gpaContext);
    if (ac.courseLoadSummary) parts.push(ac.courseLoadSummary);
    if (parts.length > 0) sections.push(parts.join('. '));
  }

  if (sections.length === 0) return '';

  return `=== STUDENT CONTEXT (from other modules) ===\n${sections.join('\n')}\n===`;
}
```

### Consumer Pattern
Each module that wants cross-module context adds an optional `studentContext?: string` parameter to its prompt builder. The caller assembles the context via `assembleStudentContext()` and passes it if available.

### Test
Call `assembleStudentContext()` with partial data (only activity profiles). Verify it produces a clean string with no undefined/null artifacts. Call with empty object -- verify it returns empty string.

---

## GAP-14: Activity Major Alignment Bug (CRITICAL)

**Decision**: Diagnostic + fix
**Files**: Activity scoring pipeline (where activity is classified into a domain before `majorAlignmentMatrix.ts` lookup)
**Risk**: Low (bug fix)
**Effort**: ~2-4 hours (diagnosis + fix)

### The Problem

The audit found that a Robotics Club President applying for Mechanical Engineering was classified as `relevantToMajor: false`. The `majorAlignmentMatrix.ts` correctly maps STEM_COMPETITION and CODING_ENGINEERING domains to Engineering as "critical" relevance (boostFactor 0.85-0.95). The bug is UPSTREAM: the activity is being classified into the wrong domain (or domain classification is failing entirely).

### Diagnostic Steps

1. Trace the scoring pipeline for Robotics Club President:
   - Where does domain classification happen? (likely in `activityScoringService.ts` or the LLM scoring prompt)
   - What domain does "Robotics Club" get mapped to?
   - Is it falling through to a default/generic domain?

2. Check `majorAlignmentMatrix.ts`'s `getMajorAlignment()` (line 1470-1494):
   - What happens when the domain is not in the matrix?
   - Does the fallback return `unrelated` (0.0)?

3. Check the `connections.majorAlignment` field on ActivityProfile:
   - Is the LLM-populated `relevantToMajor` boolean being set by conversation extraction or by the scoring pipeline?
   - If by conversation extraction: the LLM might be making a bad judgment call
   - If by scoring pipeline: the domain→major lookup is failing

### Fix Approach

The fix depends on the diagnostic. Most likely scenarios:

**Scenario A**: Activity classified into wrong domain (e.g., "GENERAL_LEADERSHIP" instead of "STEM_COMPETITION"). Fix: improve domain classification prompt or add keyword boosting for STEM terms.

**Scenario B**: Domain lookup fallback returns `unrelated`. Fix: change fallback from `{relevance: 'unrelated', boostFactor: 0}` to `{relevance: 'supporting', boostFactor: 0.2}` with a flag that it's a default.

**Scenario C**: The `relevantToMajor` boolean is set by conversation extraction LLM, not the matrix. Fix: wire the matrix lookup result INTO the profile's `connections.majorAlignment` field, overriding the conversational LLM's judgment with the structured lookup.

### Test
Score a Robotics Club activity for a Mechanical Engineering applicant. Verify `relevantToMajor: true` and `boostFactor >= 0.85`.

---

## GAP-15: Coaching Response Length Prompt Directive

**Decision**: Complement GAP-1's maxTokens with explicit prompt instruction
**Files**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Risk**: Low
**Effort**: ~15 min

### The Problem

GAP-1 reduces maxTokens based on Stage 1.5 intensity (600/1200/2200). But maxTokens is a ceiling, not an instruction. The model will still produce 500 tokens of coaching within a 600-token window. The prompt itself needs to say "write 1-3 sentences."

### Implementation

In `coachingService.ts`, where the user prompt is assembled (around line 1465-1478), append an intensity directive BEFORE the "Respond to the student's message" instruction:

```
// Build this based on the Stage 1.5 intensity result:
const intensityDirective = {
  full: '', // no additional constraint — existing "shorter is better" guidance applies
  brief: `\n\nRESPONSE LENGTH: BRIEF. 3-6 sentences maximum. Acknowledge their point, add ONE new observation or connection, suggest next step. Do NOT elaborate beyond what is needed.`,
  minimal: `\n\nRESPONSE LENGTH: MINIMAL. 1-3 sentences maximum. Acknowledge what they said. Advance the conversation with a question or a redirect. Nothing more.`,
}[stage1_5Intensity];
```

This works WITH GAP-1's maxTokens reduction. Both signals together: the prompt says "1-3 sentences" AND the window caps at 600 tokens.

### Test
Send "ok that makes sense" → verify response is 1-3 sentences (not a paragraph that acknowledges then re-explains).

---

## GAP-16: PIQ Ceiling Recognition ("Leave It Alone" Mode)

**Decision**: Reduce suggestion volume for high-scoring PIQs
**Files**: PIQ analysis service (wherever the teaching/suggestion generation happens)
**Risk**: Low
**Effort**: ~1 hour

### The Problem

The audit found: "The system risks over-coaching excellent work and making it worse." A PIQ scoring 90+ needs 1-2 micro-polish suggestions, not a full 13-dimension improvement plan. Over-coaching strong work is the fastest way to lose credibility with good writers.

### Implementation

Add a ceiling-recognition gate to the PIQ analysis pipeline. After Phase 17 (initial scoring) but before Phase 19 (teaching layer):

```typescript
// In the PIQ analysis orchestration, after initial scoring:
const overallScore = phase17Result.overallScore;

if (overallScore >= 85) {
  // Ceiling mode: dramatically reduce suggestion volume
  const ceilingConfig = {
    maxWorkshopItems: overallScore >= 92 ? 1 : 2,
    maxSeverity: 'minor' as const,  // no "critical" or "major" suggestions for strong PIQs
    ceilingNote: overallScore >= 92
      ? 'This PIQ is exceptional. The suggestions below are micro-polish only — the essay works as-is.'
      : 'This PIQ is strong. Focus on the 1-2 suggestions that would make it memorable, not just good.',
  };

  // Filter workshop items to only minor suggestions
  phase17Result.workshopItems = phase17Result.workshopItems
    .filter(item => item.severity === 'minor' || item.severity === 'suggestion')
    .slice(0, ceilingConfig.maxWorkshopItems);

  // Add ceiling note to the result
  phase17Result.ceilingNote = ceilingConfig.ceilingNote;
}
```

### Test
Run PIQ analysis on the "elite translator" PIQ (golden dataset). Verify:
- Score 85+ → max 2 suggestions, all minor severity
- Score 92+ → max 1 suggestion with "exceptional" ceiling note

---

## GAP-17: Scoring Calibration Widening

**Decision**: Add inter-essay calibration to L3.5 prompt
**Files**: `src/services/essayIntelligence/analysis/analysisPass.ts`
**Risk**: Medium (shifts score distributions)
**Effort**: ~30 min

### The Problem

The audit found an 11.4-point mean gap between a mediocre essay (59.1) and a strong essay (70.5). LLM variance is 8-15 points. The distributions overlap. The anti-clustering rules enforce INTRA-essay spread (20pt min between best/worst in a paragraph) but not INTER-essay spread.

### Implementation

In `buildSystemPrompt()` (analysisPass.ts), add to the pre-scoring calibration section (after line 414):

```
INTER-ESSAY CALIBRATION (prevents score compression):
The FULL 0-100 range must be used meaningfully:
- A WEAK essay (cliche-heavy, no specificity, no voice) should AVERAGE 40-50
- A MEDIOCRE essay (some specificity, some voice, structural issues) should AVERAGE 50-60
- A COMPETENT essay (solid structure, some distinction) should AVERAGE 60-70
- A STRONG essay (specific, voiced, architecturally sound) should AVERAGE 70-80
- An EXCEPTIONAL essay (unforgettable, every sentence earns its place) should AVERAGE 80-90

If you find yourself scoring most sentences in the 55-75 range, you are COMPRESSING.
Step back and ask: "Is this essay mediocre, competent, or strong?" Then ensure your
paragraph average lands in the corresponding band above.
```

### Test
Run L3.5 on the piano essay (mediocre) and health clinic essay (strong). Verify:
- Piano essay mean drops from ~59 to ~50-55
- Health clinic essay mean rises from ~70 to ~75-80
- Gap widens from 11.4 to 20+ points

---

## GAP-18: L3 Observation Quality Filter (Signal-to-Noise)

**Decision**: Add utility filter + prompt-level quality instruction
**Files**: `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts`
**Risk**: Medium (reduces output volume)
**Effort**: ~2-3 hours

### The Problem

The L3 walk produces 129 observations for a 7-paragraph essay. ~70% are obvious or redundant (parallel syntax noted for the 15th time, the same cross-paragraph connection flagged from both endpoints). Elite counselor's notes would fit half a page. The system should produce only observations that contribute to deep understanding.

### Root Cause

The observation count is EMERGENT from:
1. Mandatory 1-5 findings per paragraph (correct — keep)
2. Three observation fields per sentence (observedFunctions, inferredIntents, narrativeContributions) each accepting multiple entries
3. Rich evidence arrays on each finding
4. Back-propagations creating additional entries

The prompt asks for quality but the schema allows unlimited quantity per field.

### Implementation: Two-Part Fix

**Part 1: Prompt-level quality filter** (in sequentialDeepWalk.ts system prompt, after the novelty-driven growth section):

```
OBSERVATION ECONOMY:
Every observation must pass this test: "Would a competent English teacher already know this?"
If YES — do NOT produce the observation. It wastes the student's and coach's attention.
If NO — produce it with evidence.

Examples of observations to SKIP:
- "Uses parallel syntax" (obvious structural observation)
- "Transitions from one topic to another" (descriptive of any essay)
- "The sentence functions as a topic sentence" (basic compositional observation)

Examples of observations to PRODUCE:
- "The parallel syntax between P1S2 and P5S1 creates an echo that the reader might not consciously notice but that gives the essay structural coherence" (non-obvious architectural connection)
- "The narrator's voice shifts from received philosophical language to physical specificity exactly once — in P4S3 — and that moment is the essay's emotional pivot" (cross-paragraph insight a teacher would miss)

QUANTITY GUIDANCE:
- A transitional paragraph needs 1-2 observations (its function + one insight)
- A contributing paragraph needs 3-5 observations (what it does + how it serves the arc)
- A pivotal paragraph needs 5-8 observations (architectural significance + specific craft)
- An entire 7-paragraph essay should produce 25-40 total observations, not 100+
```

**Part 2: Post-processing deduplication** (in the walk output validation):

```typescript
// After all paragraphs are walked, deduplicate cross-paragraph observations:
function deduplicateObservations(paragraphs: ParagraphUnderstanding[]): ParagraphUnderstanding[] {
  const seenObservations = new Set<string>();

  for (const para of paragraphs) {
    for (const sentence of para.sentences) {
      // For each observation field, filter to unique observations
      for (const field of ['observedFunctions', 'inferredIntents', 'narrativeContributions'] as const) {
        if (sentence[field]) {
          sentence[field] = sentence[field].filter(obs => {
            // Normalize: lowercase, remove quotes, trim
            const normalized = obs.observation.toLowerCase().replace(/['"]/g, '').trim();
            // Check for near-duplicate (first 50 chars match)
            const key = normalized.substring(0, 50);
            if (seenObservations.has(key)) return false;
            seenObservations.add(key);
            return true;
          });
        }
      }
    }
  }

  return paragraphs;
}
```

### Expected Impact
- Current: ~129 observations for 7-paragraph essay
- Target: ~30-45 observations (25-40 from prompt + dedup removes remaining overlaps)
- Each surviving observation should be non-obvious and architecturally significant

### Test
Run L3 on the piano essay. Count observations. Verify:
- Total < 50
- Zero observations that a competent English teacher would already know
- All architectural observations (cross-paragraph connections, fulfilled/unfulfilled promises) survive
- Obvious observations (parallel syntax, topic sentences, tense shifts) are absent

---

## GAP-19: Voice Shift Intentionality Over-Attribution

**Decision**: Quality-level-aware calibration in L3.75 voice map prompt
**Files**: `src/services/essayIntelligence/analysis/holisticSynthesis.ts`
**Risk**: Low
**Effort**: ~30 min

### The Problem

The audit found that 4/5 voice shifts were marked "intentional" for a mediocre piano essay. The L3.75 prompt already says "assessment should follow FROM the reasoning" and "below 0.6 confidence, present as question" — but the LLM defaults to "intentional" because it attributes craft sophistication to all writers by default. A 17-year-old who shifts from lyrical to analytical register mid-paragraph is almost certainly losing control of their voice, not deploying a deliberate rhetorical strategy.

### Root Cause

The prompt has no quality-level calibration. It treats a mediocre essay the same as a polished one. An elite writing professor would say: "In a strong essay, most voice shifts are intentional. In a mediocre essay, most are accidental."

### Implementation

**File**: `holisticSynthesis.ts`
**Location**: After the existing voice map quality standards (lines 416-424), add:

```
INTENTIONALITY CALIBRATION BY ESSAY QUALITY:

CRITICAL: Your default assessment should be calibrated to the essay's overall quality level.
- In a STRONG essay (most sentences are specific, voiced, architecturally sound): voice shifts are more likely intentional. The writer has demonstrated craft control elsewhere.
- In a FUNCTIONAL essay (competent but generic): voice shifts are more likely UNINTENTIONAL or AMBIGUOUS. The writer may not have the craft awareness to deploy register shifts deliberately. Default to "ambiguous" unless you have STRONG textual evidence of intentional deployment (e.g., a structural marker like an em-dash, a paragraph break aligned with a thematic pivot, or explicit setup language).
- In a DEVELOPING essay (vague, telling-heavy): voice shifts are almost certainly unintentional. Default to "unintentional" unless the evidence is overwhelming.

The essay's quality level is visible in the understanding context you received. Use the paragraph verdicts and overall arc assessment to calibrate your prior.

Example of WRONG intentionality assessment for a mediocre essay:
"intentional (0.75) — The shift from sensory to abstract vocabulary enacts the paragraph's epistemological argument."
WHY WRONG: A 17-year-old writing a mediocre essay is not "enacting an epistemological argument." They shifted registers because they ran out of sensory vocabulary and defaulted to abstract language. The shift IS observable, but attributing intent to it flatters the writer and misleads the coaching.

Example of RIGHT intentionality assessment for the same essay:
"ambiguous (0.45) — The register shifts from sensory ('fingers danced') to abstract ('analytical thinking') at the em-dash. The em-dash suggests structural awareness, but the abstract vocabulary reads more like the writer defaulting to a formal register they associate with 'smart writing' than deliberately deploying conceptual language. The shift may be unintentional — the writer may not hear the register change."
```

### Why This Matters for Coaching

The coaching system uses voice shift intentionality to decide whether to praise a craft choice or flag a loss of control. If a shift is "intentional," the coach says "nice — that register change works." If it's "unintentional," the coach says "do you hear how your voice changes here? Is that what you want?" Getting this wrong means the coach validates accidental craft choices, reinforcing bad habits.

### Test
Run L3.75 on the piano essay (mediocre). Verify:
- At least 2/5 shifts are "ambiguous" or "unintentional" (currently 4/5 are "intentional")
- Confidence scores for "intentional" assessments are backed by specific textual evidence, not inferred sophistication
- The P5 shift (to pure abstraction) should be "ambiguous" or "unintentional" (currently "ambiguous" — should stay)

---

## GAP-20: Coaching Resistance → Shorter Responses

**Decision**: Map resistance cognitive states to brief intensity
**Files**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Risk**: Low
**Effort**: ~30 min

### The Problem

The audit found: "The coach escalates directness (good) but also escalates response length (bad). T6 is 418 words. T7 is 512 words. T8 is 607 words. Each time the student deflects, the coach lectures MORE. An elite human coach would do the opposite."

When a student is resistant, they need a SHORT, direct question — not a longer lecture. The current system detects resistance correctly (cognitive state: resistant_to_specific, resistant_to_general) but responds with MORE words because nothing maps resistance to brief/minimal intensity.

### Implementation

This is a wiring fix that connects to GAP-1 (response intensity) and GAP-15 (length directive).

**File**: `coachingService.ts`
**Location**: Where Stage 1.5 intensity is extracted and passed to Stage 3

After extracting `responseIntensity` from Stage 1.5, add an override for resistance states:

```typescript
// After Stage 1.5 returns cognitiveAssessment:
let effectiveIntensity = cognitiveAssessment.responseIntensity;

// Override: resistance should produce BRIEF responses, not full lectures
if (
  cognitiveAssessment.cognitiveState === 'resistant_to_specific' ||
  cognitiveAssessment.cognitiveState === 'resistant_to_general'
) {
  effectiveIntensity = 'brief';
}

// Override: overwhelmed should produce MINIMAL responses
if (cognitiveAssessment.cognitiveState === 'overwhelmed') {
  effectiveIntensity = 'minimal';
}
```

This feeds into GAP-1's maxTokens mapping (brief=1200) and GAP-15's prompt directive ("3-6 sentences maximum").

### Why This Works

When a student is resistant, the elite coach move is: name the pattern in 1-2 sentences, ask a direct question, then STOP. "I notice you've asked about the rewrite three times without sharing it. What's holding you back?" (25 words). The 1200-token window + "3-6 sentences" directive + the existing resistance-specific coaching philosophy should produce this naturally.

### Test
Send a message that triggers resistant_to_specific (e.g., "just tell me if the opening is good enough"). Verify:
- maxTokens = 1200
- Prompt says "3-6 sentences maximum"
- Response is short and direct, not a lecture

---

## GAP-21: Scope Inflation Pattern Detection

**Decision**: Add to L3.75 admissionsPositioning as a red flag
**Files**: `src/services/essayIntelligence/analysis/holisticSynthesis.ts`
**Risk**: Low
**Effort**: ~20 min

### The Problem

The audit found: "'Create worlds through sound' (P0) → 'create projects' (P3) → 'make a meaningful difference' (P6). Claims get bigger, evidence gets thinner. The system notes individual gaps but never identifies this as a structural pattern."

Scope inflation is a common pattern in mediocre essays: the language gets grander as the essay progresses, but the supporting detail gets vaguer. AOs notice this — it signals a student who is reaching for significance rather than earning it.

### Implementation

**File**: `holisticSynthesis.ts`
**Location**: In the Phase B system prompt, the `admissionsPositioning.redFlags` field description (around line 520)

**Current**:
```
"redFlags": ["<anything an admissions reader would notice or question — describe WHAT it is, not whether it is a problem>"],
```

**Add to the quality standards section** (after line 425, in the section that guides redFlags):

```
RED FLAG PATTERNS TO CHECK:
- SCOPE INFLATION: Do claims get bigger while evidence gets thinner? "I changed my community" in the conclusion when the essay shows a single tutoring session. If the scale of claimed impact GROWS across paragraphs while the specificity of evidence SHRINKS, flag this as: "Scope inflation: language escalates from [specific early claim] to [broad late claim] without proportional evidence."
- PEOPLE ABSENCE: Does the essay mention zero named individuals? An essay about growth with no teachers, mentors, teammates, or family members is a red flag — it suggests the student either lacks meaningful relationships or doesn't know how to write about them. Flag as: "No named individuals appear in the essay."
- SOLO CREDIT for TEAM WORK: Does the essay use "I" exclusively for something that likely involved collaboration? "I developed an AI DJ" for what was probably a team project. Flag as: "Solo credit language for likely collaborative work — [specific claim]."
```

### Why This Matters

These three red flag patterns (scope inflation, people absence, solo credit) were the top 3 things the audit said an elite counselor catches in the first 30 seconds but the system never flags. Adding them to the L3.75 red flag detection costs zero — it's prompt guidance for a field that already exists.

### Test
Run L3.75 on the piano essay. Verify redFlags includes:
- Scope inflation (P0 "create worlds" → P7 "meaningful difference")
- No named individuals (zero people appear)
- Solo credit ("I developed an AI DJ" when it was a team hackathon entry — though L3.75 may not know this without coaching context)

---

## IMPLEMENTATION COST SUMMARY

| Gap | New Files | New LLM Calls | Prompt Token Impact | Type Changes | Effort |
|-----|-----------|---------------|---------------------|--------------|--------|
| 14 | 0 | 0 | 0 | 0 (bug fix) | 2-4 hr |
| 15 | 0 | 0 | +30 tokens (user prompt) | 0 | 15 min |
| 9 | 1 utility | 0 | 0 | 1 type + function | 30 min |
| 7 | 0 | 0 | +200 tokens (system) | 0 | 45 min |
| 11 | 0 | 0 | 0 (templates) | 0 | 30 min |
| 18 | 0 | 0 | +150 tokens (walk prompt) | 0 | 2-3 hr |
| 4 | 1 service | 1 Haiku ($0.003) | 0 | 1 interface | 2 hr |
| 5 | 0 | 0 | +80 tokens (L3.75) | 0 | 20 min |
| 10 | 0 | 0 | +100 tokens (L3.75) + +80 (L3.5) | 1 field | 1.5 hr |
| 17 | 0 | 0 | +100 tokens (system) | 0 | 30 min |
| 3 | 0 | 0 | +80 tokens (system) | 0 | 30 min |
| 8 | 0 | 0 | +200 tokens (system) | 0 | 45 min |
| 16 | 0 | 0 | 0 | 0 | 1 hr |
| 1 | 0 | 0 | 0 | 1 field | 1 hr |
| 2 | 0 | 0 | +30 tokens (sidecar) | 0 | 45 min |
| 6 | 0 | 0 | +50 tokens (session arc) | 2 fields | 1 hr |
| 12 | 0 | 0 | +100-200 tokens (per PIQ) | 0 | 1 hr |
| 13 | 1 bridge | 0 | 0 | 1 interface | 1 hr |
| 19 | 0 | 0 | +200 tokens (L3.75) | 0 | 30 min |
| 20 | 0 | 0 | 0 | 0 | 30 min |
| 21 | 0 | 0 | +100 tokens (L3.75) | 0 | 20 min |
| **TOTAL** | **3 files** | **1 Haiku** | **~+1500 tokens** | **~8 additions** | **~19.5 hr** |

### Per-Essay Cost Impact
- New: 1 Haiku call at ~$0.003
- Prompt inflation: ~1200 tokens across all prompts = ~$0.004 additional input cost (Sonnet pricing)
- L3 observation reduction: saves ~$0.05-0.10 in output tokens (fewer observations = fewer output tokens)
- **Net incremental cost per essay: ~$0.00** (observation savings offset prompt inflation + new call)
- Quality improvement is essentially FREE in cost terms

---

## RISK REGISTER

| Risk | Impact | Mitigation |
|------|--------|------------|
| GAP-18 observation reduction too aggressive — loses genuine insights | High | Run L3 before/after on 3 essays, manually compare. Keep architectural cross-paragraph insights. |
| GAP-17 calibration widening + GAP-8 admissions criteria together shift scores unpredictably | High | Implement GAP-17 first, validate distributions, THEN add GAP-8. Never both at once. |
| GAP-14 major alignment fix has deeper root cause than expected | Medium | Diagnostic steps in plan. If domain classification is LLM-based, fix may require prompt change + test suite. |
| GAP-10 archetype penalty too aggressive | Medium | Start with "10-15 points lower" as guidance, not hard rule; LLM calibrates |
| GAP-4 AOFirstRead Haiku fails | Low | Graceful degradation: skip and continue pipeline, log warning |
| GAP-1 maxTokens=600 too short for some minimal turns | Low | Floor at 600, sidecar still fits; if Sonnet needs more it won't hit 600 for minimal |
| GAP-6 strategicQuestion stale forever | Low | Staleness counter + pattern detection re-evaluation provides escalation path |
| GAP-16 ceiling recognition too aggressive — misses real issues in strong PIQs | Low | Only filter to minor severity, don't eliminate all suggestions. Ceiling note frames as polish, not critique. |

---

## QUALITY GATES

Before considering any gap "done":

1. **Type check passes**: `npx tsc --noEmit` with zero errors
2. **Prompt spec complete**: every prompt change has before/after text in this doc
3. **Test exists**: at least one test scenario per gap
4. **No regression**: existing tests still pass
5. **Cost verified**: run 1 end-to-end and verify cost is within +$0.01 of baseline

---

## NOTES FOR IMPLEMENTER

1. **GAP-14 (major alignment) is the most urgent fix.** A student seeing their primary activity classified as "irrelevant to major" will lose trust in the entire system. Diagnose first: trace the activity through domain classification → major lookup. The matrix data is correct; the bug is upstream.

2. **GAP-15 + GAP-1 work together.** GAP-15 (prompt directive) tells the model "write 1-3 sentences." GAP-1 (maxTokens) constrains the ceiling. Implement GAP-15 first (15 min), then GAP-1 (1 hr). Both together are much more effective than either alone.

3. **GAP-18 (observation compression) is the highest-risk change.** Reducing L3 output from 129 to 30-45 observations could lose genuine insights if the quality filter is too aggressive. Run before/after on 3 essays and manually verify that cross-paragraph architectural insights survive while obvious syntax observations are eliminated. Iterate the prompt until the balance is right.

4. **GAP-17 (scoring calibration) and GAP-8 (admissions criteria) must be sequenced.** Implement GAP-17 first and validate the new score distributions. THEN add GAP-8. Doing both simultaneously makes it impossible to diagnose which change caused any distribution shift.

5. **GAP-6 has a backward compat concern.** Existing sessions have `nextFocus` populated. The `strategicQuestion` field is new and will be empty for existing sessions. The prompt injection uses a fallback: if `strategicQuestion` is empty, use `nextFocus`. Pattern detection will populate `strategicQuestion` on the next cycle.

6. **GAP-10's archetype feeds into GAP-8.** Implement GAP-10 first so that L3.5 has archetype context available when the scoring calibration from GAP-8 references it.

7. **GAP-4 is the only new file that touches the analysis pipeline.** Wire into `analysisOrchestrator.ts` with `Promise.allSettled` (not `Promise.all`) so a Haiku failure doesn't crash the pipeline.

8. **GAP-13 is standalone.** The bridge file can be implemented and tested in isolation. Wiring it into each module's prompt builder is a separate step that can happen incrementally.

9. **GAP-16 (PIQ ceiling) should be validated against the golden dataset.** The "elite translator" PIQ should score 85+ and trigger ceiling mode. Verify it gets max 2 suggestions, all minor severity.
