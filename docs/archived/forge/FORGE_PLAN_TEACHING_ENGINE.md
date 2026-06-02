# FORGE_PLAN_TEACHING_ENGINE.md — Pedagogical Teaching Engine Blueprint

**Date**: 2026-03-15
**Pipeline**: Full Forge (Deep Research -> Diagnostic -> Design A + B -> Reality Check -> Blueprint)
**Status**: FINAL — passes the "start coding" test
**System**: System 2 of the Conversator architecture

---

## Executive Summary

The Pedagogical Teaching Engine wraps craft expertise in pedagogically sound delivery. It answers: given everything the system knows about this essay and this student, **what should we teach next, and how?**

This is NOT a new LLM call. It is a **reorganization of existing prompt infrastructure** plus **3 new data structures** on `CoachingSessionMemory` and `EssayProfile`, plus **~600 tokens of new prompt text** in the Stage 3 system prompt. Total cost impact: **$0.000-0.002 per turn** (within the $0.025 remaining budget).

The engine operates through 7 mechanisms, all integrated into the existing 5-stage coaching pipeline:

| Mechanism | Where It Lives | New LLM Calls | New Types |
|-----------|---------------|---------------|-----------|
| Capability Model | `CoachingSessionMemory` extension | 0 | `TeachingRecord[]` |
| Pedagogical Sequencing | Stage 3 prompt injection | 0 | `PedagogicalPriority` (computed) |
| Skill Transfer | Pattern detection Haiku extension | 0 | `TransferredSkill[]` |
| Priority Intelligence | `buildFindingCoachingContext` rewrite | 0 | None (reuses Finding) |
| Emotional Calibration | Stage 1.5 + Stage 3 prompt | 0 | None (extends CognitiveAssessment prompt) |
| Learning Style Integration | Stage 3 prompt injection | 0 | None (uses existing LearningStyleObservations) |
| Cross-Session Persistence | `coaching_preferences` DB column | 0 | `StudentTeachingProfile` |

---

## Part 1: Deep Research Findings

### 1.1 What Already Exists (Reusable Infrastructure)

**Stage 1.5 CognitiveAssessment** (`coachingService.ts:1960-2094`) already produces:
- `assessment`: free prose reading of student's cognitive-emotional state
- `whatTheyNeed`: specific contextual recommendation
- `recommendedApproach`: coaching approach for this turn (Socratic, direct instruction, reflective mirroring, minimal)
- `responseIntensity`: full / brief / minimal

This is the system's existing "teaching method selector." The Teaching Engine extends it, not replaces it.

**Pattern Detection Haiku** (`coachingService.ts:1801-1940`) already produces:
- Behavioral patterns with evidence and coaching implications
- Session arc update (where the conversation is heading)
- Next focus suggestion
- Learning style observations (how the student responds to different approaches)
- Quality signals (vocabulary evolution, question quality, revision sophistication)
- `demonstratedCapabilities: string[]` (from FORGE_PLAN_CONVERSATOR.md ITEM 2, pending implementation)

This call runs every turn after turn 3. It already sees the full conversation. Adding teaching-specific extraction fields is trivial.

**CoachingSessionMemory** (`profileTypes.ts:2082-2124`) already tracks:
- `topicsDiscussed[]` with resolution status
- `approachesUsed[]` with outcomes
- `studentStances[]` (resistances and preferences)
- `sessionArcSummary` and `nextFocus`
- `demonstratedCapabilities: string[]` (from FORGE_PLAN_CONVERSATOR ITEM 2)
- `sessionMode: string` (from FORGE_PLAN_CONVERSATOR ITEM 3)

**FindingStore** (`findingStore.ts`) provides:
- `getActiveSortedByCoachingValue()` — findings ranked by coaching importance
- `getByScope(paragraph)` — paragraph-scoped findings
- `getDeepDiveCandidates()` — findings with deepening potential
- `getDepthTrees()` — finding dependency chains
- `getByDimension(dimension)` — dimension-scoped findings

**ImprovementPhase** (`profileTypes.ts:1404-1453`) provides:
- `level`: foundation / architecture / craft / polish / distinction
- `dimensionPhases[]`: per-dimension phase with coaching approach
- `coachingLens`: 2-4 sentence coaching directive
- `focusAreas[]` and `deferredAreas[]`
- `nearBoundary`: whether phase could shift soon

**LearningStyleObservations** (`profileTypes.ts:2131-2141`) tracks:
- `observations[]` with confidence levels (tentative / growing / confident)

### 1.2 What's Missing (The Teaching Gap)

After reading 2640 lines of `coachingService.ts`, 2400+ lines of `profileTypes.ts`, and the full diagnostic:

1. **No teaching history.** The system tracks what was DISCUSSED (`topicsDiscussed`) but not what was TAUGHT. "We discussed voice shifts" is not the same as "we taught the student to identify voice shifts, they tried it, and demonstrated they can do it."

2. **No pedagogical sequencing.** Findings are injected by `coachingValue` (critical > high > medium), which is ANALYTICAL importance, not PEDAGOGICAL impact. A critical finding about structural coherence may be the wrong thing to teach a student who hasn't yet grasped paragraph-level function.

3. **No skill transfer tracking.** When a student successfully applies a technique, nobody records "this student now knows sensory threading." The next turn starts from scratch.

4. **No zone-of-proximal-development calculation.** `ImprovementPhase` gives a coarse 5-level filter. But within "foundation," there's no sense of "this student understands essay-level thesis but not paragraph roles."

5. **No emotional modulation of teaching decisions.** `CognitiveAssessment` produces emotional reads but the Stage 3 prompt doesn't tell Sonnet HOW to use them for teaching decisions (when to push, when to celebrate, when to back off on new findings).

6. **No explicit teach/coach split.** The system prompt has examples of "instruction" vs "dialogue" vs "productive confusion" (lines 913-931), but no mechanism to decide which mode based on the student's capability level for the current topic.

---

## Part 2: Diagnostic — Current Teaching Quality

### Before/After: Teaching History Gap

**CURRENT (Turn 4 teaches, Turn 8 forgets):**
```
Turn 4 Coach: "Consider using a sensory detail to bridge these scenes —
something that exists in both the lab and the hospital."

Turn 8 Coach: "The transition could benefit from a concrete detail shared
between both settings — something the reader can see or hear in both places."
```
The coach re-teaches the same concept because there's no record it was already taught.

**TARGET (Turn 4 teaches, Turn 8 builds):**
```
Turn 4 Coach: [Teaches sensory threading technique with guided discovery]

Turn 8 Coach: "Remember the sensory threading you used for the lab-to-hospital
transition? The same principle applies here — P4 to P5 needs a bridge too.
But this time, instead of smell, think about what SOUND exists in both
places. You've already proven you can do this."
```

### Before/After: Pedagogical Sequencing Gap

**CURRENT (Analytical priority = finding order):**
```
Finding injection: F1 [critical] structural coherence, F2 [high] voice shift,
F3 [high] transition, F4 [medium] closing resolution, F5 [contextual] pace

Student asks about transitions → Coach discusses F3 but also tries to address
F1 (structural coherence) because it's "critical" — overwhelming the student
with the hardest problem first.
```

**TARGET (Pedagogical priority = learnability order):**
```
Student asks about transitions → Teaching Engine computes:
- F3 (transition) is CONCRETE, BOUNDED, teaches transferable skill → do first
- F3 partially addresses F1 (fixing transition improves structural coherence)
- F2 (voice shift) has PREREQUISITE: student must understand paragraph roles first
- F4 (closing) is UNBOUNDED until F1 is addressed

Coach focuses on F3, names the technique when student succeeds, then suggests
F1 as the natural next step: "Now that you've bridged P2-P3, let's look at
whether the whole arc builds toward your ending the way that bridge built
toward your grandmother's story."
```

### Before/After: Emotional Calibration Gap

**CURRENT (same intensity regardless of state):**
```
Student (overwhelmed): "There's just so much to fix..."
Coach: "Let's focus on the three most important areas: the structural
coherence between P1-P4, the voice shift in P2, and the unearned
emotional peak in P3."
```
(Responds to overwhelm with... more analysis.)

**TARGET (teaching modulates to emotional state):**
```
Student (overwhelmed): "There's just so much to fix..."
Coach: "Let's slow down. You've already made the transition in P2 work —
that took real skill. Right now, I want to focus on ONE thing: the smell
detail you added? That same technique can fix the P4-P5 boundary too.
One sentence. That's all."
```
(Recognizes overwhelm → cites recent success → proposes a single bounded task → uses a technique the student already knows.)

---

## Part 3: Design A (Direct Path) — Prompt-First

### Thesis
Everything the Teaching Engine needs to do can be accomplished through prompt engineering in the existing Stage 3 prompt + extending the pattern detection Haiku's output schema. No new LLM calls, no new routing rules, no new pipeline stages.

### Mechanism
1. Add `TeachingRecord[]` to `CoachingSessionMemory` — a flat list of what was taught, whether demonstrated, and whether named as a transferable skill.
2. Add `~400 tokens` of "PEDAGOGICAL INTELLIGENCE" section to the Stage 3 system prompt (cached).
3. Extend the pattern detection Haiku schema to extract `teachingUpdates` (what the student demonstrated this turn).
4. Rewrite `buildFindingCoachingContext()` to sort findings by pedagogical priority, not coaching value.
5. Add emotional calibration directives to Stage 3 prompt conditioned on `CognitiveAssessment`.

### Strengths
- Zero new LLM calls
- Minimal type changes (~30 lines)
- Leverages Sonnet's inherent pedagogical reasoning
- Easy to test: run coaching turns, compare output quality

### Weaknesses
- Places heavy burden on Sonnet to follow complex instructions
- Pedagogical sequencing is implicit (prompt-guided, not algorithmic)
- No formal prerequisite graph — relies on LLM judgment
- Skill transfer naming is prompt-suggested, not tracked

---

## Part 4: Design B (Rethink Path) — Structured Capability Graph

### Thesis
Teaching requires a formal model of student capability. LLM judgment alone cannot consistently sequence instruction or track prerequisites. A lightweight capability graph with ~15 nodes (matching craft techniques) and explicit prerequisite edges enables deterministic sequencing that the LLM then expresses naturally.

### Mechanism
1. Define `CapabilityNode` type with prerequisite edges.
2. Define `StudentCapabilityState` type tracking each node's status (unknown / introduced / practiced / demonstrated).
3. Pre-define 15 capability nodes matching craft techniques + structural skills.
4. Add a new Haiku call (~$0.001) after Stage 3 to assess capability transitions.
5. Compute "next teachable" via topological sort of undemonstrated capabilities filtered by satisfied prerequisites.
6. Inject computed priority into Stage 3 as structured data.

### Strengths
- Formal prerequisite tracking prevents teaching voice modulation before voice awareness
- Deterministic "what to teach next" algorithm
- Clean capability progression visualization for UI
- Cross-session persistence is straightforward (serialize the graph)

### Weaknesses
- Closed taxonomy of 15 capabilities violates LLM-first design (Rule: "No closed taxonomies for LLM perception")
- New Haiku call adds ~$0.001/turn and ~200ms latency
- Capability graph is a maintenance burden (must be updated when craft techniques change)
- Over-engineers what is fundamentally a judgment call — is this student ready for voice modulation? That depends on context only the LLM has.

---

## Part 5: Reality Check

### Verification Against Real Code

**RC-1: Stage 3 system prompt capacity**
- The static coaching philosophy (`staticCoachingPhilosophy`, lines 873-1019) is ~4500 chars / ~1500 tokens.
- It's cached via `cacheSystemPrompt: true` (line 1151).
- FORGE_PLAN_CONVERSATOR ITEM 1 adds ~400 tokens of craft technique vocabulary.
- Adding ~400 tokens of pedagogical intelligence brings total to ~2300 tokens.
- Anthropic cache block minimum is 1024 tokens. At 2300 tokens, this is well within cache efficiency.
- **Verdict**: 400 tokens of pedagogical directives fits cleanly in the cached system prompt.

**RC-2: Pattern detection schema extensibility**
- The pattern detection Haiku call (lines 1817-1876) already produces 5 JSON fields.
- FORGE_PLAN_CONVERSATOR adds `demonstratedCapabilities` and `sessionMode`.
- Adding `teachingUpdates` (what was taught/demonstrated this turn) is one more field.
- Haiku handles 7-8 field JSON schemas reliably at temperature 0.3.
- **Verdict**: Schema extension is safe. Risk is low.

**RC-3: Finding context builder extensibility**
- `buildFindingCoachingContext()` (lines 2360-2376) calls `buildFindingContext()` from `findingContextBuilder.ts`.
- The builder accepts options including `scopeFilter` and `minCoachingValue`.
- FORGE_PLAN_CONVERSATOR ITEM 4 already rewrites this to be routing-rule-aware.
- Adding pedagogical priority sorting is a natural extension of that rewrite.
- **Verdict**: Finding sorting by pedagogical priority fits into the existing rewrite.

**RC-4: CognitiveAssessment prompt extensibility**
- Stage 1.5 (lines 1960-2094) produces free prose assessment via Haiku.
- The system prompt (line 1972) is ~800 chars.
- Adding emotional calibration directives (~100 chars) to the user prompt is trivial.
- **Verdict**: No issue.

**RC-5: Cross-session persistence**
- FORGE_PLAN_CONVERSATOR ITEM 6 (GAP-6) proposes a `coaching_preferences` JSONB column on the `profiles` DB table.
- The Teaching Engine's cross-session data (demonstrated capabilities, teaching history) can be stored alongside coaching preferences in this same column.
- **Verdict**: Use the same persistence mechanism.

**RC-6: Capability graph (Design B) vs LLM-first design**
- `feedback_llm-first-design.md` Rule 3: "No closed taxonomies for LLM perception."
- A fixed 15-node capability graph IS a closed taxonomy.
- The existing system deliberately uses free-text descriptions everywhere: `CognitiveAssessment.assessment` is prose, `PatternInsight.implication` is prose, `ImprovementPhase.coachingLens` is prose.
- **Verdict**: Design B violates LLM-first design principles. Reject the capability graph.

### Forced-Choice Synthesis

| Mechanism | Choice | Rationale |
|-----------|--------|-----------|
| Capability Model | **A modified** | Free-text `TeachingRecord[]` (not Design B's closed graph). LLM extracts, system stores. |
| Pedagogical Sequencing | **A modified** | Prompt-guided with structured finding context. Not Design B's topological sort. |
| Skill Transfer | **A** | Extend pattern detection Haiku. No new call. |
| Priority Intelligence | **A** | Rewrite finding context builder with pedagogical scoring. |
| Emotional Calibration | **A** | Prompt directives in Stage 3 system prompt + Stage 1.5. |
| Learning Style Integration | **A** | Inject growing/confident observations into Stage 3 with teaching directives. |
| Cross-Session Persistence | **A** | Use FORGE_PLAN_CONVERSATOR GAP-6 persistence mechanism. |

**Key decision**: Design B's capability graph is rejected because it violates LLM-first design. The Teaching Engine trusts the LLM to make pedagogical judgments (what to teach next, how to teach it) while the system provides structured context (what was taught before, what the student has demonstrated, which findings are most learnable). This mirrors the existing architecture where `CognitiveAssessment` is LLM prose that drives system routing, not a deterministic state machine.

---

## Part 6: Implementation Blueprint

### 6.1 Capability Model — Type Definitions

**File**: `src/services/essayIntelligence/profileTypes.ts`
**Location**: After `CoachingSessionMemory` interface (line 2124)

```typescript
/**
 * TeachingRecord — tracks a single teaching event in the session.
 *
 * This is NOT a capability graph node. It's a free-text record of
 * what was taught, whether the student demonstrated understanding,
 * and whether the principle was named for transfer.
 *
 * The LLM (pattern detection Haiku) populates these. The system
 * stores them and injects them into Stage 3 so Sonnet can reference
 * prior teaching without re-teaching.
 *
 * Design: LLM-first (Rule 1). Free text, not a taxonomy.
 */
export interface TeachingRecord {
  /** What was taught — free text description of the concept/technique.
   *  e.g., "sensory threading for scene transitions",
   *        "identifying show-vs-tell patterns",
   *        "paragraph role awareness" */
  concept: string;

  /** Turn number when this was first introduced */
  introducedAtTurn: number;

  /** The teaching approach used (from CognitiveAssessment.recommendedApproach).
   *  e.g., "Socratic questioning", "direct instruction with example",
   *        "guided discovery through the student's own text" */
  approachUsed: string;

  /** Whether the student has DEMONSTRATED understanding — not just
   *  acknowledged it. "Yes that makes sense" is NOT demonstration.
   *  "I see — so the smell in the lab could bridge to the hospital" IS.
   *
   *  LLM-assessed via pattern detection Haiku. */
  demonstrated: boolean;

  /** Turn number when demonstration was observed (null if not yet) */
  demonstratedAtTurn: number | null;

  /** Whether the transferable principle was explicitly named.
   *  e.g., "What you just did is called sensory threading."
   *  Only set to true when the coach actually names it in a response.
   *  LLM-assessed via pattern detection Haiku. */
  principleNamed: boolean;

  /** The named principle, if principleNamed is true.
   *  e.g., "Sensory threading — using a shared sensory detail to bridge
   *         physically separate but emotionally linked scenes." */
  namedPrinciple: string | null;

  /** Related finding IDs that this teaching addresses */
  relatedFindings: string[];
}

/**
 * StudentTeachingProfile — cross-session teaching intelligence.
 * Persisted in the `coaching_preferences` JSONB column on `profiles` table
 * alongside other cross-essay preferences.
 *
 * Populated at session end. Read at session start. Enables the system to
 * say "you learned sensory threading on your Common App — same principle
 * applies here."
 */
export interface StudentTeachingProfile {
  /** Techniques the student has demonstrated across any essay */
  demonstratedTechniques: Array<{
    technique: string;
    /** Which essay it was demonstrated on */
    essayContext: string;
    /** When it was first demonstrated */
    demonstratedAt: string;
  }>;

  /** Teaching approaches that work well for this student.
   *  Populated from LearningStyleObservations that reach 'confident' level. */
  effectiveApproaches: string[];

  /** Teaching approaches that don't work for this student.
   *  Populated from approachesUsed where outcome includes negative signals. */
  ineffectiveApproaches: string[];

  /** Recurring patterns across essays.
   *  e.g., "tends to tell rather than show at emotional peaks",
   *        "strong opening instinct, weak transitions" */
  recurringPatterns: string[];

  /** Last updated */
  lastUpdated: string;
}
```

**File**: `src/services/essayIntelligence/profileTypes.ts`
**Location**: `CoachingSessionMemory` interface (line 2082), add after `nextFocus`:

```typescript
export interface CoachingSessionMemory {
  // ... existing fields ...

  /**
   * Teaching history for this session — what concepts/techniques were
   * taught, whether demonstrated, whether principle was named.
   *
   * Populated by the pattern detection Haiku (every turn after turn 3).
   * Injected into Stage 3 so Sonnet can build on prior teaching.
   *
   * This replaces the anti-repetition role of topicsDiscussed for
   * teaching-specific content. topicsDiscussed tracks DISCUSSION topics.
   * teachingHistory tracks TEACHING events.
   */
  teachingHistory: TeachingRecord[];

  /**
   * The pedagogically optimal next teaching focus — LLM-assessed.
   * Not the most important finding — the most LEARNABLE one given
   * what the student has demonstrated so far.
   *
   * Free text. Updated by pattern detection Haiku alongside nextFocus.
   * nextFocus = what to DISCUSS next (conversation topic).
   * nextTeachingFocus = what to TEACH next (pedagogical target).
   */
  nextTeachingFocus: string;

  // Note: demonstratedCapabilities (from FORGE_PLAN_CONVERSATOR ITEM 2)
  // and sessionMode (from ITEM 3) are also added here by that blueprint.
  // teachingHistory is complementary — demonstratedCapabilities tracks
  // WHAT the student can do, teachingHistory tracks HOW they learned it.
}
```

### 6.2 Teaching History Tracking — Pattern Detection Extension

**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Location**: `detectPatternsLLM` system prompt (line 1817)

Add to the JSON schema in the system prompt, after `qualitySignals`:

```
  "teachingUpdates": {
    "newTeaching": [
      {
        "concept": "<what was taught this turn — null if no new teaching>",
        "approachUsed": "<how it was taught>",
        "relatedFindings": ["F1"]
      }
    ],
    "demonstrationObserved": [
      {
        "concept": "<concept from prior teaching that the student just DEMONSTRATED>",
        "evidence": "<what the student said/did that shows understanding>"
      }
    ],
    "principleNamed": [
      {
        "concept": "<concept that the coach named as a transferable principle>",
        "principle": "<the named principle>"
      }
    ]
  },
  "nextTeachingFocus": "<1 sentence: what concept/technique should the coach teach NEXT, considering what the student has already demonstrated?>"
```

**Location**: Parse the new fields (after line 1931):

```typescript
// After qualitySignals parse:
const teachingUpdates = parsed.teachingUpdates ?? {
  newTeaching: [], demonstrationObserved: [], principleNamed: []
};
const nextTeachingFocus: string = parsed.nextTeachingFocus ?? '';
```

**Location**: Return in result (extend the return type and object):

```typescript
// Add to return type:
teachingUpdates: typeof teachingUpdates;
nextTeachingFocus: string;
```

**Location**: Update session memory after pattern detection (around line 322, after `memory.nextFocus = ...`):

```typescript
// Update teaching history
memory.nextTeachingFocus = patternResult.nextTeachingFocus || memory.nextTeachingFocus || '';

// Record new teaching events
for (const nt of patternResult.teachingUpdates.newTeaching) {
  if (nt.concept) {
    memory.teachingHistory.push({
      concept: nt.concept,
      introducedAtTurn: memory.turnCount + 1,
      approachUsed: nt.approachUsed || cognitiveAssessment.recommendedApproach,
      demonstrated: false,
      demonstratedAtTurn: null,
      principleNamed: false,
      namedPrinciple: null,
      relatedFindings: nt.relatedFindings ?? [],
    });
  }
}

// Mark demonstrations
for (const demo of patternResult.teachingUpdates.demonstrationObserved) {
  const record = memory.teachingHistory.find(t =>
    t.concept.toLowerCase().includes(demo.concept.toLowerCase()) ||
    demo.concept.toLowerCase().includes(t.concept.toLowerCase())
  );
  if (record && !record.demonstrated) {
    record.demonstrated = true;
    record.demonstratedAtTurn = memory.turnCount + 1;
  }
}

// Mark principle naming
for (const pn of patternResult.teachingUpdates.principleNamed) {
  const record = memory.teachingHistory.find(t =>
    t.concept.toLowerCase().includes(pn.concept.toLowerCase()) ||
    pn.concept.toLowerCase().includes(t.concept.toLowerCase())
  );
  if (record && !record.principleNamed) {
    record.principleNamed = true;
    record.namedPrinciple = pn.principle;
  }
}
```

**Location**: `initializeSessionMemory` (line 2171), add:

```typescript
teachingHistory: [],
nextTeachingFocus: '',
```

**Cost**: Zero additional LLM calls. The pattern detection Haiku (line 1868) already runs. Adding `teachingUpdates` and `nextTeachingFocus` adds ~80 output tokens = ~$0.0004/turn.

### 6.3 Pedagogical Sequencing — Stage 3 System Prompt

**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Location**: Append to `staticCoachingPhilosophy` (after COACHING PATTERNS section, before closing backtick — after FORGE_PLAN_CONVERSATOR ITEM 1's craft vocabulary)

**Exact text to append** (~400 tokens):

```typescript
// Append after the craft technique vocabulary:

`

PEDAGOGICAL INTELLIGENCE:
You are not just a writing coach — you are a TEACHER. The difference:
a coach responds to what the student asks. A teacher decides what the
student NEEDS to learn next, and creates the conditions for learning.

SEQUENCING RULES:
1. START WITH WINNABLE PROBLEMS. The first thing you teach should be
   concrete, bounded, and produce visible improvement. If the student
   succeeds, they trust you. If they fail on the first attempt, they
   disengage.

2. RESPECT PREREQUISITES. Don't teach voice modulation to a student who
   hasn't yet grasped what voice IS. Don't teach structural revision to
   a student who can't identify their paragraph roles. Go in order:
   awareness → identification → application → refinement → transfer.

3. ONE THING PER TURN. If you have 5 issues to address, pick the ONE
   that is most learnable right now. A student who deeply learns one
   thing is better than a student who superficially encounters five.

4. BUILD ON DEMONSTRATED CAPABILITIES. If the student has already shown
   they can do X, use X as a foundation: "You know how you [X]? The
   same principle applies to [Y], but with [difference]."

5. NAME THE PRINCIPLE — BUT ONLY AFTER SUCCESS. When the student
   successfully applies a technique, name it in ONE sentence:
   "What you just did is called [technique name] — [when to use it]."
   Never name a principle before the student has experienced it working.
   Transfer happens through experience, then naming, not the reverse.

TEACH/COACH SPLIT:
- TEACH when the student doesn't yet have the concept: provide the
  framework, give a concrete example from their essay, guide discovery.
- COACH when the student has the concept but hasn't applied it: ask
  questions, point at specific text, let them work through it.
- CELEBRATE when the student succeeds: name what they did, name the
  principle, connect it to their essay's architecture.

EMOTIONAL CALIBRATION FOR TEACHING:
- OVERWHELMED → Don't add findings. Cite their recent success. Propose
  ONE bounded task using a technique they already know.
- FRUSTRATED → Validate the difficulty. Reframe the problem as smaller.
  "Let's forget about the whole transition. Just write ONE sentence that
  puts the smell in the lab scene."
- SEEKING VALIDATION → Give honest, specific validation with evidence.
  Then gently advance: "The smell detail works. Now notice what happens
  if you remove 'reminded me of' and just describe the smell."
- RESISTANT → Don't push. Ask what they see. They might be right.
  Type 1 resistance (you're wrong) → listen. Type 2 (I'd lose something)
  → protect what they value. Type 3 (avoidance) → make the task smaller.
- BREAKTHROUGH → Celebrate specifically. Name the technique. Connect to
  architecture. Then suggest where else it applies.
- ENGAGED → Push deeper. Raise the bar. Introduce the NEXT prerequisite.`
```

**Why this goes in the system prompt (cached)**: These are stable pedagogical principles that don't change turn-to-turn. Caching saves ~$0.0012 per turn after the first. The principles are universal across all students and essays.

**Token impact**: ~400 tokens added to cached system prompt. With FORGE_PLAN_CONVERSATOR ITEM 1's ~400 tokens, total system prompt grows from ~1500 to ~2300 tokens. Still well within cache efficiency.

### 6.4 Pedagogical Sequencing — Stage 3 User Prompt Injection

**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Location**: In `runStage3CoachingResponse()`, after the session arc section (around line 1093), add a teaching history section:

```typescript
// ── Teaching History Context ──
const teachingHistorySection = sessionMemory.teachingHistory.length > 0
  ? `\n\n=== TEACHING HISTORY (what you've taught this student) ===\n` +
    sessionMemory.teachingHistory.map(t => {
      const status = t.demonstrated
        ? `DEMONSTRATED (turn ${t.demonstratedAtTurn})`
        : `introduced (turn ${t.introducedAtTurn}) — NOT YET DEMONSTRATED`;
      const named = t.principleNamed ? ` [named: "${t.namedPrinciple}"]` : '';
      return `- ${t.concept}: ${status}${named}`;
    }).join('\n') +
    (sessionMemory.nextTeachingFocus
      ? `\n\nNEXT TEACHING TARGET: ${sessionMemory.nextTeachingFocus}`
      : '') +
    `\n\nBuild on demonstrated capabilities. Don't re-teach what they've shown they understand. ` +
    `If they demonstrate a new capability this turn, NAME the principle in one sentence.`
  : '';
```

Then add `${teachingHistorySection}` to the user prompt assembly (line 1131 area), after `${sessionArcSection}`.

**Token impact**: ~50-150 tokens per turn (dynamic, grows with teaching history). Since this is in the user prompt (not cached), it costs ~$0.0002-0.0005/turn at Sonnet input pricing.

### 6.5 Priority Intelligence — Pedagogical Finding Ranking

**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Location**: Extend `buildFindingCoachingContext()` (line 2360)

The FORGE_PLAN_CONVERSATOR ITEM 4 already rewrites this method to accept `stage1` and `routingRule`. The Teaching Engine adds pedagogical priority scoring within that rewrite.

**Algorithm** — `computePedagogicalPriority(finding, teachingHistory, phase)`:

```typescript
/**
 * Compute pedagogical priority for a finding.
 *
 * This is NOT the coaching value (analytical importance).
 * It's the LEARNABILITY score — how teachable is this finding
 * to THIS student at THIS moment?
 *
 * Lower score = higher priority (teach first).
 *
 * Factors (in order of weight):
 * 1. Concreteness: bounded tasks over open-ended ones
 * 2. Prerequisite satisfaction: can the student attempt this?
 * 3. Cascade potential: does fixing this partially resolve others?
 * 4. Success visibility: will the student see improvement?
 * 5. Skill transferability: does this teach a reusable technique?
 * 6. Phase alignment: is this appropriate for the current phase?
 * 7. Emotional safety: how risky is this for student engagement?
 */
function computePedagogicalPriority(
  finding: Finding,
  teachingHistory: TeachingRecord[],
  phase: ImprovementPhase,
  allFindings: Finding[],
): number {
  let score = 50; // Neutral baseline

  // Factor 1: Concreteness (bounded scope = lower score = higher priority)
  if (finding.scope.type === 'sentence' || finding.scope.type === 'word') {
    score -= 15; // Sentence/word-level findings are concrete, bounded
  } else if (finding.scope.type === 'paragraph') {
    score -= 10;
  } else if (finding.scope.type === 'cross_paragraph') {
    score += 5; // Cross-paragraph is harder to act on
  } else if (finding.scope.type === 'essay_level') {
    score += 15; // Essay-level is most abstract
  }

  // Factor 2: Prerequisite satisfaction
  // If a related concept has been demonstrated, this builds on known skills
  const hasRelatedDemonstration = teachingHistory.some(t =>
    t.demonstrated && finding.dimensions.some(d =>
      t.concept.toLowerCase().includes(d)
    )
  );
  if (hasRelatedDemonstration) {
    score -= 10; // Student has foundation for this
  }

  // Factor 3: Cascade potential (findings that other findings build on)
  const dependentCount = allFindings.filter(f =>
    f.buildsOn.includes(finding.id) || f.relatedTo.includes(finding.id)
  ).length;
  score -= dependentCount * 3; // More dependents = fix this first

  // Factor 4: Success visibility (confirmed/deepened findings have clear evidence)
  if (finding.maturity === 'confirmed' || finding.maturity === 'deepened') {
    score -= 5; // Clear evidence means student can see improvement
  }

  // Factor 5: Phase alignment
  const findingDimensionsInFocus = finding.dimensions.filter(d =>
    phase.focusAreas.some(fa => fa.toLowerCase().includes(d))
  );
  if (findingDimensionsInFocus.length > 0) {
    score -= 8; // In-phase findings are more appropriate
  }
  const findingInDeferred = finding.dimensions.some(d =>
    phase.deferredAreas.some(da => da.toLowerCase().includes(d))
  );
  if (findingInDeferred) {
    score += 20; // Deferred-phase findings should wait
  }

  // Factor 6: Coaching value (analytical importance as tiebreaker)
  const coachingValueBonus: Record<string, number> = {
    critical: -5, high: -3, medium: 0, contextual: 3, diagnostic: 5
  };
  score += coachingValueBonus[finding.coachingValue] ?? 0;

  return score;
}
```

**Integration**: In the rewritten `buildFindingCoachingContext()`, after filtering findings by scope/route (from FORGE_PLAN_CONVERSATOR ITEM 4), sort by pedagogical priority before selecting the top N:

```typescript
// After scope filtering:
const sorted = scopedFindings.sort((a, b) =>
  computePedagogicalPriority(a, sessionMemory.teachingHistory, phase, active) -
  computePedagogicalPriority(b, sessionMemory.teachingHistory, phase, active)
);
const topFindings = sorted.slice(0, maxFindings);
```

**Note**: The `buildFindingCoachingContext` method needs `sessionMemory` and `phase` parameters. These are already available in `runStage3CoachingResponse()` where the method is called (line 1099). The signature change:

```typescript
private buildFindingCoachingContext(
  coordinator: EssayProfileCoordinator,
  stage1: Stage1Output,
  routingRule: RoutingRule,
  sessionMemory: CoachingSessionMemory,  // NEW
  phase: ImprovementPhase,               // NEW
): string
```

### 6.6 Skill Transfer Mechanism

Skill transfer happens in three steps, all within existing infrastructure:

**Step 1: Teaching Event** (Sonnet Stage 3)
The system prompt's PEDAGOGICAL INTELLIGENCE section instructs Sonnet to teach concepts through guided discovery. The teaching event is recorded by the pattern detection Haiku on the next turn (section 6.2).

**Step 2: Demonstration Detection** (Haiku pattern detection)
When the pattern detection Haiku sees the student applying a previously taught concept, it records a `demonstrationObserved` entry. The teaching history updates (section 6.2).

**Step 3: Principle Naming** (Sonnet Stage 3)
The system prompt instructs: "When the student successfully applies a technique, NAME it in one sentence." The pattern detection Haiku on the next turn records `principleNamed`. The teaching history updates.

**Cross-Session Transfer** (session end):
At session end, `teachingHistory` records where `demonstrated === true` are extracted and added to `StudentTeachingProfile.demonstratedTechniques`. This persists in the `coaching_preferences` JSONB column (from FORGE_PLAN_CONVERSATOR GAP-6).

At the start of a new session (for any essay by the same student), `StudentTeachingProfile.demonstratedTechniques` is injected into the Stage 3 prompt:

```typescript
const crossSessionSection = studentTeachingProfile.demonstratedTechniques.length > 0
  ? `\n\n=== STUDENT CAPABILITIES (from prior sessions) ===\n` +
    studentTeachingProfile.demonstratedTechniques
      .map(t => `- ${t.technique} (demonstrated on ${t.essayContext})`)
      .join('\n') +
    `\nYou can reference these as known skills: "Remember [technique] from your [essay]? Same principle applies here."`
  : '';
```

**Cost**: Zero new LLM calls. Cross-session data is ~50-100 tokens per session.

### 6.7 Emotional Calibration — Stage 1.5 Enhancement

**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Location**: `runStage1_5CognitiveAssessment` user prompt (line 2023)

Add after the existing `CLASSIFICATION (from Stage 1)` line:

```typescript
// Add teaching context to Stage 1.5 so it can calibrate for teaching moments:
${sessionMemory.teachingHistory.length > 0
  ? `\nTEACHING CONTEXT: Student has been taught ${sessionMemory.teachingHistory.length} concepts. ` +
    `${sessionMemory.teachingHistory.filter(t => t.demonstrated).length} demonstrated. ` +
    `If the student is demonstrating a previously taught concept, your assessment should note this ` +
    `(it's a celebration/naming opportunity, not a teaching moment).`
  : ''}
```

This gives Stage 1.5 the context to distinguish between:
- Student applying a taught concept (celebration → `responseIntensity: 'brief'`)
- Student struggling with a taught concept (needs different approach → `recommendedApproach: 'concrete example'`)
- Student ready for new teaching (engaged + demonstrated prior skills → `recommendedApproach: 'guided discovery'`)

**Cost**: ~30 tokens added to Stage 1.5 user prompt. Haiku input pricing: ~$0.00003/turn.

### 6.8 Learning Style Integration — Stage 3 Prompt

**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Location**: In `runStage3CoachingResponse()`, add after the cognitive assessment section (line 1074):

```typescript
// ── Learning Style Teaching Directives ──
const learningStyleDirective = (() => {
  const confidentObs = style.observations.filter(o => o.confidence === 'confident');
  const growingObs = style.observations.filter(o => o.confidence === 'growing');
  if (confidentObs.length === 0 && growingObs.length === 0) return '';

  const directives: string[] = [];
  for (const obs of [...confidentObs, ...growingObs]) {
    const o = obs.observation.toLowerCase();
    // Map learning style observations to teaching directives
    if (o.includes('example') || o.includes('concrete') || o.includes('specific')) {
      directives.push('Lead with specific examples from their essay before explaining principles.');
    }
    if (o.includes('why') || o.includes('reason') || o.includes('understand')) {
      directives.push('Explain WHY before HOW — this student needs the rationale first.');
    }
    if (o.includes('discover') || o.includes('question') || o.includes('socratic')) {
      directives.push('Use guided questions — this student learns through discovery, not instruction.');
    }
    if (o.includes('direct') || o.includes('tell') || o.includes('instruction')) {
      directives.push('Be direct — this student prefers explicit instruction over Socratic method.');
    }
  }

  if (directives.length === 0) return '';
  const unique = [...new Set(directives)];
  return `\n\n=== LEARNING STYLE (observed) ===\n${unique.join('\n')}`;
})();
```

Then add `${learningStyleDirective}` to the user prompt assembly.

**Why this is deterministic mapping, not LLM judgment**: The learning style observations are already LLM-produced (by the pattern detection Haiku). The mapping from observation to teaching directive is a simple system-level translation that ensures the Stage 3 Sonnet consistently applies what the system has learned about the student. This is infrastructure (Rule 6: "system infrastructure for bookkeeping"), not judgment.

**Cost**: ~20-50 tokens per turn (conditional, only when observations exist).

### 6.9 Cross-Session Persistence

**File**: `supabase/migrations/NNNN_coaching_preferences.sql`
(Same migration as FORGE_PLAN_CONVERSATOR GAP-6)

The `coaching_preferences` JSONB column stores:

```typescript
interface CoachingPreferences {
  // From FORGE_PLAN_CONVERSATOR GAP-6:
  generalPreferences: Array<{
    category: string;
    content: string;
    source: string;
    timestamp: string;
  }>;

  // Teaching Engine addition:
  teachingProfile: StudentTeachingProfile;
}
```

**Population**: At session end (when the coaching session closes), extract from `CoachingSessionMemory`:

```typescript
// At session end:
async function persistTeachingProfile(
  userId: string,
  sessionMemory: CoachingSessionMemory,
  essayContext: string,
): Promise<void> {
  // Read existing profile
  const existing = await getCoachingPreferences(userId);
  const profile = existing?.teachingProfile ?? {
    demonstratedTechniques: [],
    effectiveApproaches: [],
    ineffectiveApproaches: [],
    recurringPatterns: [],
    lastUpdated: '',
  };

  // Add newly demonstrated techniques
  for (const record of sessionMemory.teachingHistory) {
    if (record.demonstrated && record.namedPrinciple) {
      const alreadyKnown = profile.demonstratedTechniques.some(t =>
        t.technique.toLowerCase() === record.namedPrinciple!.toLowerCase()
      );
      if (!alreadyKnown) {
        profile.demonstratedTechniques.push({
          technique: record.namedPrinciple,
          essayContext,
          demonstratedAt: new Date().toISOString(),
        });
      }
    }
  }

  // Extract effective/ineffective approaches from session
  const approaches = sessionMemory.approachesUsed;
  for (const a of approaches) {
    if (a.outcome.includes('confirmed understanding') || a.outcome.includes('student engaged')) {
      if (!profile.effectiveApproaches.includes(a.approach)) {
        profile.effectiveApproaches.push(a.approach);
      }
    }
    if (a.outcome.includes('resisted') || a.outcome.includes('more explanation')) {
      if (!profile.ineffectiveApproaches.includes(a.approach)) {
        profile.ineffectiveApproaches.push(a.approach);
      }
    }
  }

  profile.lastUpdated = new Date().toISOString();

  await updateCoachingPreferences(userId, { ...existing, teachingProfile: profile });
}
```

**Cost**: Zero LLM calls. Pure DB operations at session boundaries.

### 6.10 Integration Spec — Exact Changes

| File | Change | Lines Affected |
|------|--------|---------------|
| `profileTypes.ts` | Add `TeachingRecord` interface | +40 lines after line 2124 |
| `profileTypes.ts` | Add `StudentTeachingProfile` interface | +35 lines after TeachingRecord |
| `profileTypes.ts` | Add `teachingHistory` + `nextTeachingFocus` to `CoachingSessionMemory` | +20 lines at line 2124 |
| `coachingService.ts` | Extend `detectPatternsLLM` schema with `teachingUpdates` + `nextTeachingFocus` | ~15 lines in system prompt (line 1827) |
| `coachingService.ts` | Parse teaching fields in pattern detection result | ~30 lines after line 1931 |
| `coachingService.ts` | Update teaching history in session memory | ~40 lines after line 322 |
| `coachingService.ts` | Add `teachingHistory` + `nextTeachingFocus` to `initializeSessionMemory` | +2 lines at line 2171 |
| `coachingService.ts` | Add PEDAGOGICAL INTELLIGENCE to `staticCoachingPhilosophy` | ~400 tokens after craft vocabulary |
| `coachingService.ts` | Add teaching history section to Stage 3 user prompt | ~15 lines after line 1093 |
| `coachingService.ts` | Extend `buildFindingCoachingContext` with pedagogical priority | ~60 lines (extend CONVERSATOR ITEM 4 rewrite) |
| `coachingService.ts` | Add `computePedagogicalPriority` helper function | ~50 lines (new private method) |
| `coachingService.ts` | Add teaching context to Stage 1.5 user prompt | ~5 lines at line 2023 |
| `coachingService.ts` | Add learning style directives to Stage 3 | ~25 lines after line 1074 |

**Total new code**: ~360 lines across 2 files.
**Total new LLM calls**: 0.
**Total new types**: 2 interfaces (`TeachingRecord`, `StudentTeachingProfile`).

### 6.11 Cost Model

| Component | Per-Turn Cost | Source |
|-----------|--------------|--------|
| Pattern detection schema extension | +$0.0004 | ~80 extra output tokens at Haiku pricing |
| Teaching history in Stage 3 user prompt | +$0.0002-0.0005 | ~50-150 input tokens at Sonnet pricing |
| Teaching context in Stage 1.5 | +$0.00003 | ~30 input tokens at Haiku pricing |
| Pedagogical system prompt (cached) | +$0.0000 | Free after first turn (cache read) |
| Learning style directives | +$0.0001 | ~20-50 tokens at Sonnet pricing |
| **Total per turn** | **+$0.0007-0.001** | Well within $0.025 remaining budget |

First-turn cache write for extended system prompt: ~$0.001 (one-time per session).

### 6.12 Before/After Examples for Each Mechanism

#### Capability Model + Teaching History

**BEFORE** (no teaching history):
```
Turn 4: "Consider using a sensory detail to bridge these scenes."
Turn 8: "The transition could benefit from a shared concrete detail."
```

**AFTER** (teaching history injected):
```
TEACHING HISTORY in Stage 3 context:
- sensory threading for transitions: DEMONSTRATED (turn 5)
  [named: "Sensory threading — shared sensory detail bridging
  physically separate but emotionally linked scenes."]

Turn 8 Sonnet response:
"Remember the sensory threading you used for the lab-to-hospital
transition? P4 to P5 needs the same kind of bridge. But this time,
instead of smell, think about what SOUND exists in both places."
```

#### Pedagogical Sequencing

**BEFORE** (sorted by coaching value):
```
Findings injected:
F1 [critical] essay-level structural coherence
F2 [high] P2 voice shift
F3 [high] P3-P4 transition
```

**AFTER** (sorted by pedagogical priority):
```
Findings injected (pedagogical priority):
F3 [high, priority=22] P3-P4 transition
  ← concrete, bounded, teaches transferable skill, cascade potential
F2 [high, priority=35] P2 voice shift
  ← paragraph-scoped, prerequisite: voice awareness
F1 [critical, priority=48] structural coherence
  ← essay-level, abstract, requires all other fixes first
```

#### Emotional Calibration

**BEFORE** (CognitiveAssessment without teaching context):
```
Assessment: "Student seems overwhelmed by the volume of feedback."
WhatTheyNeed: "Reassurance and a concrete starting point."
```

**AFTER** (with teaching context):
```
TEACHING CONTEXT: Student has been taught 2 concepts. 1 demonstrated.

Assessment: "Student is overwhelmed but has already proven they can
apply sensory threading. Build on that success — propose one bounded
task using a technique they already know."
WhatTheyNeed: "Reference their P2 success, then suggest applying
the same technique to the P4-P5 boundary. One sentence. That's all."
```

#### Skill Transfer

**BEFORE** (no skill naming):
```
Turn 5: Student successfully adds smell detail to bridge scenes.
Coach: "Good — that works much better."
```

**AFTER** (skill transfer):
```
Turn 5: Student adds smell detail.
Coach: "That's it — the formaldehyde detail puts the reader in the
lab so when the hospital arrives, the sensory echo creates the bridge
automatically. What you just did is called sensory threading — using
a shared physical detail to connect moments that are separated in time
but linked by feeling. Use it whenever you need to bridge scenes."

[Pattern detection Haiku records:
  principleNamed: { concept: "sensory threading",
    principle: "Using a shared physical detail to connect moments
    separated in time but linked by feeling" }
]
```

---

## Part 7: Execution Order

### Phase 1: Types (no behavior change)
1. Add `TeachingRecord` and `StudentTeachingProfile` interfaces to `profileTypes.ts`
2. Add `teachingHistory` and `nextTeachingFocus` to `CoachingSessionMemory`
3. Update `initializeSessionMemory()` in `coachingService.ts`
4. **Verify**: `npx tsc --noEmit` passes

### Phase 2: Pattern Detection Extension (teaching tracking begins)
5. Extend `detectPatternsLLM` system prompt with `teachingUpdates` + `nextTeachingFocus`
6. Parse new fields in pattern detection result handler
7. Add teaching history update logic after pattern detection
8. **Verify**: Run coaching test with 5+ turns, verify teaching records populate in session memory

### Phase 3: Stage 3 Prompt Enhancement (teaching quality improves)
9. Add PEDAGOGICAL INTELLIGENCE section to `staticCoachingPhilosophy`
10. Add teaching history section to Stage 3 user prompt
11. Add learning style directives to Stage 3 user prompt
12. **Verify**: Run coaching test, compare response quality for re-teaching scenarios

### Phase 4: Finding Priority (pedagogical sequencing)
13. Add `computePedagogicalPriority` helper function
14. Extend `buildFindingCoachingContext` with pedagogical sorting (within CONVERSATOR ITEM 4 rewrite)
15. **Verify**: Log finding injection order before/after, confirm pedagogical ordering

### Phase 5: Emotional Calibration (teaching sensitivity)
16. Add teaching context to Stage 1.5 cognitive assessment prompt
17. **Verify**: Run coaching test with overwhelmed/frustrated student messages, compare calibration

### Phase 6: Cross-Session Persistence (learning accumulation)
18. Add `StudentTeachingProfile` persistence in `coaching_preferences` column (CONVERSATOR GAP-6 dependency)
19. Add cross-session injection to Stage 3 user prompt at session start
20. **Verify**: Run two sessions on same user, verify second session references first session's teachings

---

## Part 8: Debates — Key Decisions and Rejected Alternatives

### Debate 1: Capability Graph vs Free-Text Teaching Records

**Design B proposed**: A formal 15-node capability graph with prerequisite edges. Topological sort computes "next teachable" deterministically.

**Rejected because**:
1. **Violates LLM-first design** (Rule 3: "No closed taxonomies for LLM perception"). A fixed 15-node graph constrains what the system can teach to predetermined categories. The existing system's power comes from free-text perception — the LLM notices things that no taxonomy anticipates.
2. **Maintenance burden**. When a new craft technique emerges from usage patterns, someone must manually add a node and wire prerequisite edges. Free-text records auto-extend.
3. **False precision**. Is "voice awareness" a prerequisite for "voice modulation"? It depends on the student and the essay. A student writing about code-switching may understand voice modulation intuitively without formal "voice awareness." The LLM handles this nuance; a prerequisite graph cannot.
4. **The existing system already handles ZPD implicitly**. `ImprovementPhase.dimensionPhases[]` gives per-dimension phase assessment. `CognitiveAssessment.recommendedApproach` adapts per-turn. Adding a parallel system creates conflict, not precision.

**Adopted instead**: `TeachingRecord[]` with free-text `concept` field. The LLM decides what to teach and when to name it. The system stores what was taught and whether it was demonstrated. Pedagogical sequencing uses the teaching history as input to the Stage 3 prompt, letting Sonnet make the nuanced sequencing decision.

### Debate 2: Separate Pedagogical Sequencing LLM Call vs Prompt Injection

**Considered**: A separate Haiku call between Stage 2 (routing) and Stage 3 (response) that reads findings + teaching history + phase and produces a structured "pedagogical plan" with ordered teaching objectives.

**Rejected because**:
1. **Latency**. Adds ~200-400ms to every coaching turn. Stage 3 already takes 2-5 seconds. Users notice.
2. **Cost**. Haiku at ~$0.001/call is cheap, but the budget is $0.025/turn total and already committed.
3. **Information loss**. A separate call cannot access the full essay text, conversation history, and assembled profile context that Stage 3 sees. Its sequencing decisions would be based on less context than Sonnet's inline decisions.
4. **Sonnet is already a good teacher**. The Stage 3 prompt is 1000+ lines of coaching philosophy. With pedagogical principles added and teaching history injected, Sonnet makes excellent pedagogical decisions inline. A separate "sequencing brain" second-guesses Sonnet with less information.

**Adopted instead**: Pedagogical principles in the cached system prompt (stable guidance) + teaching history and finding priority in the dynamic user prompt (per-turn context). Sonnet sequences inline.

### Debate 3: Deterministic vs LLM-Driven Finding Priority

**Considered (Design A pure)**: Sort findings entirely by prompt guidance — let Sonnet pick which finding to focus on based on its own judgment.

**Considered (Design B pure)**: Sort findings entirely by a deterministic algorithm with 7 weighted factors.

**Adopted (hybrid)**: Deterministic `computePedagogicalPriority()` sorts findings for INJECTION ORDER into the prompt. But Sonnet decides which finding(s) to actually TEACH. The deterministic sort ensures the most learnable findings are most visible to Sonnet. Sonnet decides based on the full conversation context what to actually focus on.

This matches the existing pattern: the ProfileRouter deterministically assembles context (what Sonnet sees), but Sonnet decides how to use that context (what Sonnet says).

### Debate 4: Skill Transfer via Explicit Step vs Organic Prompt Instruction

**Considered**: A separate Stage 3.5 that runs after the coaching response, extracts any named principles, and records them as formal skill transfers.

**Rejected because**:
1. Post-response extraction cannot influence the response itself.
2. The system prompt already instructs Sonnet to name principles after demonstration.
3. The pattern detection Haiku already runs on the NEXT turn and can detect whether a principle was named.
4. A separate step adds complexity for no quality gain — the "name the principle" instruction in the system prompt is sufficient.

**Adopted instead**: Skill transfer is a prompt instruction (Stage 3 system prompt: "NAME the principle in one sentence") + retrospective detection (pattern detection Haiku records `principleNamed`). The system stores what was named; the prompt ensures it happens.

### Debate 5: Where to Store Cross-Session Teaching Data

**Option A**: Separate `student_teaching_profiles` DB table.
**Option B**: In the `coaching_preferences` JSONB column (from FORGE_PLAN_CONVERSATOR GAP-6).
**Option C**: On `EssayProfile` with cross-essay linking.

**Adopted: Option B** because:
1. GAP-6 already creates the column and persistence mechanism.
2. Teaching profile is naturally part of "coaching preferences" — it's how the system should coach this student.
3. A separate table adds migration, CRUD, and integration overhead for data that's inherently JSON-shaped and small (~1-5KB).
4. Option C would require cross-profile linking that doesn't exist and is a much larger scope.

### Debate 6: How Granular Should TeachingRecord Be?

**Considered (fine-grained)**: Track individual technique applications at the sentence level: "student applied sensory threading to P2S4 at turn 5."

**Considered (coarse-grained)**: Track only named principles: "student knows sensory threading."

**Adopted (medium-grained)**: Track teaching EVENTS (concept + approach + demonstration + principle naming) without specifying exact text locations. Rationale:
1. The LLM doesn't need sentence-level precision — it has the full conversation history.
2. Sentence-level tracking creates staleness problems when the essay is edited.
3. Principle-level tracking is too coarse — it loses the teaching approach and demonstration evidence.
4. Event-level tracking gives the LLM enough context to build on prior teaching without over-specifying.

---

## Appendix A: Interaction With Other Forge Plans

### FORGE_PLAN.md (GatheringService + Pipeline Injection)
- **No conflict**. The Teaching Engine operates within L6 coaching. The GatheringService operates pre-analysis. They share the `StudentDeclaredData` on EssayProfile but don't modify each other's data structures.
- **Synergy**: `DeclaredDataEntry` from gathering provides intent context that the Teaching Engine uses for pedagogical grounding: "You said you wanted to show growth. Let me teach you how paragraphs can build a growth arc."

### FORGE_PLAN_CONVERSATOR.md (Conversator Blueprint)
- **Dependencies**: Teaching Engine depends on ITEM 2 (`demonstratedCapabilities`), ITEM 3 (`sessionMode`), ITEM 4 (routing-rule-aware finding injection), and GAP-6 (cross-session persistence). These should be implemented first.
- **Ordering**: CONVERSATOR ITEMs 1-6 → Teaching Engine Phases 1-6.
- **No conflicts**: Teaching Engine adds fields alongside CONVERSATOR fields on the same types. The system prompt additions are additive (CONVERSATOR adds craft vocabulary, Teaching Engine adds pedagogical intelligence — they complement each other).

### Action Workshop (CONVERSATOR_ACTION_WORKSHOP.md)
- **The Teaching Engine IS the pedagogical core of the Action Workshop.** The Action Workshop describes WHAT the system should do (explain findings, workshop revisions, track progress). The Teaching Engine describes HOW to do it pedagogically (sequence by learnability, track capability, name principles, calibrate emotionally).
- **The `WorkshopSession` type from the Action Workshop can use `TeachingRecord[]` as its learning moment tracking mechanism.** The `CapacityBuildingMoment` interface from the Action Workshop is conceptually the same as `TeachingRecord` with `principleNamed === true`.

## Appendix B: Test Strategy

### Unit Tests

1. **`computePedagogicalPriority` tests**: Verify that sentence-scoped findings rank higher than essay-level findings, that demonstrated prerequisites lower the score, and that deferred-phase findings rank lowest.

2. **`TeachingRecord` lifecycle tests**: Create records, mark as demonstrated, mark as principle-named. Verify serialization/deserialization roundtrip.

3. **Learning style directive mapping tests**: Verify that specific observation patterns produce the correct directives.

### Integration Tests (with LLM)

4. **Teaching history injection test**: Run 5-turn coaching conversation. Verify that turn 4+ responses reference concepts taught in earlier turns (not re-teaching).

5. **Pedagogical sequencing test**: Create a profile with 5 findings spanning sentence, paragraph, and essay scope. Run a coaching turn. Verify that findings are injected in pedagogical priority order (not coaching value order).

6. **Skill transfer test**: Run a coaching conversation where the student applies a taught technique. Verify pattern detection records the demonstration and principle naming.

7. **Emotional calibration test**: Run coaching turns with overwhelmed/frustrated cognitive states. Verify responses cite recent successes and propose bounded tasks.

8. **Anti-regression test**: Ensure the Stage 3 system prompt still passes all existing coaching quality tests after adding PEDAGOGICAL INTELLIGENCE section.

**Cost per test**: ~$0.10-0.25 per integration test (5-8 LLM calls at Sonnet + Haiku pricing). Total test suite: ~$1.50.
