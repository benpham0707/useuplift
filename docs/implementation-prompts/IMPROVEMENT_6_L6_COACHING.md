# Improvement 6: L6 Coaching — Keyword Detection to Cognitive State Inference

> Implementation prompt for a future Claude session. Self-contained.

---

## Context

Layer 6 (CoachingService) is the student-facing conversational layer. It receives the student's message, classifies it (Stage 1, Haiku), routes context (Stage 2, deterministic), generates a coaching response (Stage 3, Sonnet), optionally deepens the profile (Stage 4, conditional Sonnet), and checks phase (Stage 5, deterministic).

The current implementation in `src/services/essayIntelligence/coaching/coachingService.ts` (~1900 lines) has significant rigidity in how it understands and responds to students. The planned V2 improvements include `inferCognitiveState()` with deterministic scoring, a 10-state `CognitiveState` enum, a `CATEGORY_STATE_MAP` static mapping, and an `ANGLE_ROTATION_SEQUENCE` fixed 8-step sequence. These MUST NOT be implemented as designed. They replace LLM judgment with formulas for deeply contextual decisions.

This improvement replaces all planned deterministic cognitive/teaching systems with LLM-driven judgment while keeping the system infrastructure (session memory, approach tracking, learning style observation) as tracking structures.

**Files to modify:**
- `src/services/essayIntelligence/coaching/coachingService.ts` — primary target
- `src/services/essayIntelligence/profileTypes.ts` — new types for session memory, approach tracking
- `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` — integration if coaching triggers re-analysis

**Files to read first:**
- `PLAN2.md` — V2 evolution plan (L6 is "ENHANCED INTEGRATION"), Implementation Status sections at bottom
- `src/services/essayIntelligence/coaching/coachingService.ts` — current 5-stage pipeline
- `src/services/essayIntelligence/profileTypes.ts` — current types
- `src/services/essayIntelligence/analysis/holisticSynthesis.ts` — how synthesis iteration works (for coaching-triggered re-analysis)
- `src/services/essayIntelligence/analysis/growthEngine.ts` — growth cycle state management

---

## Context from Cluster C Implementation (Forward Propagation)

> The following discoveries from Cluster C (#7 Iterative L3.75 + #8 Adaptive Router) affect this improvement.

### Critical Rigidity Fix Required

**`coachingService.ts:1049`** — There is an existing deterministic formula:
```typescript
scopeCertainty: stage1.confidence > 0.7 ? 'high' : stage1.confidence > 0.4 ? 'moderate' : 'low',
```
This converts a continuous LLM-provided confidence signal into a bucketed routing label via a hardcoded formula. Same pattern appears at lines ~1237, ~1302, ~1427. **Fix**: Have Stage 1 (Haiku) produce `scopeCertainty: 'high' | 'moderate' | 'low'` directly as an explicit routing signal (Rule 7: explicit routing signals from LLM output). The LLM is already making the assessment — just have it express the routing tag directly instead of making the system reverse-engineer it from a confidence float.

### Key Types Available

```typescript
// ReadingStrategy — available in profile after growth cycle
// Coaching responses should be aware of what the system considers most important
// for THIS essay (via contextPriorities). If the student asks about voice but
// the reading strategy says structure is the essay's primary concern, the coach
// should bridge between the student's focus and the essay's architecture.
interface ReadingStrategy {
  strategy: string;
  bestApproach: string;
  antiPatterns: string[];
  contextPriorities: string[];
}

// SynthesisIterationOutput — available after growth cycle
// reReadCandidates tells coaching which paragraphs L3.75 flagged for deeper
// investigation. Coach can reference these: "I noticed paragraph 3 is particularly
// rich — would you like to explore what's happening there?"
```

### Discoveries & Watch-outs

1. **Growth cycle convergence is LLM-judged** (`selfAssessedConvergence`). If coaching triggers a re-analysis (Stage 4 deepening), the growth cycle will run again with L3.75 judging convergence. Don't add separate convergence logic in the coaching layer.

2. **Activity log format for coaching context**: The growth engine's `formatActivityLog()` produces human-readable prose. If coaching needs growth cycle context (e.g., "we investigated voice authenticity and found it's performed"), use `formatActivityLog(state)` rather than building a separate summary.

3. **Finding evolution across coaching turns**: When a student's response reveals new information that changes a finding's interpretation, coaching should produce a finding evolution (deepened/superseded) — not a new detached finding. Use `FindingStore.evolve()` to track the intellectual lineage.

4. **Phase context from L3.75**: The growth cycle's `SynthesisIterationOutput` includes the `ImprovementPhase` with per-dimension levels. Coaching should use this for phase-aware responses. The phase is already LLM-assessed (phaseAssessment.ts from Cluster B) — don't add a separate phase computation in coaching.

5. **Router integration**: Use the router's `l6_coaching_voice`, `l6_coaching_paragraph`, `l6_coaching_overview` rules for context assembly. These rules have adaptive overlay (W8.1) that automatically includes NorthStar context for all coaching rules and expands budget for high-connection-density paragraphs.

---

## Design Principles (LLM-First Rules That Apply)

### Rule 1: The LLM Owns All Judgment — The System Tracks and Organizes
The LLM assesses the student's cognitive-emotional state, selects the teaching approach, decides response strategy. The system tracks what's been tried, what the student has said, what insights have emerged — but never determines HOW to respond based on formulas.

### Rule 2: Never Discard Paid LLM Output
Not directly applicable to coaching (L6 generates responses, not stored data). But the principle extends: never discard CONVERSATION CONTEXT when building prompts. The full conversation history (up to the MAX_HISTORY_TURNS cap) and all accumulated insights should be available to the LLM.

### Rule 3: No Closed Taxonomies for LLM Perception
**CRITICAL.** The planned `CognitiveState` 10-state enum ("confused", "resistant", "eager", etc.) limits what the LLM can perceive about the student. A student who is "frustrated but starting to see it" or "performing understanding without actually getting it" cannot be expressed in a 10-state enum. The LLM's cognitive assessment must be FREE PROSE — a brief paragraph that the coaching prompt uses as context.

### Rule 4: No Whack-a-Mole Pattern Matching
The current `detectPatterns()` method (lines 1567-1648) uses keyword matching (`areaKeywords` maps, regex patterns) to detect coaching patterns. This is the same approach as banned-phrase lists — and it misses patterns expressed in novel phrasings. Replace with LLM-detected patterns. The current pattern detection is cheap (no LLM call), but it's also shallow and fragile. A single Haiku call to assess patterns would be both cheap (~$0.002) and dramatically more capable.

### Rule 5: Soft Guidance Over Hard Blocklists
The planned `CATEGORY_STATE_MAP` (mapping insight categories to cognitive states) and `ANGLE_ROTATION_SEQUENCE` (fixed 8-step teaching approach cycle) are hard constraints that prevent the LLM from selecting the best response. Replace with soft prompt guidance: "Here are the teaching approaches you've used so far in this session. Select the approach that serves this specific moment — don't repeat an approach unless it's genuinely the right one again."

### Rule 6: System Infrastructure IS Appropriate
KEEP: `SessionMemory` structure (tracks what's been discussed, what approaches have been tried), `AngleTrackingEntry` (records what approaches were used, system doesn't decide from it), `LearningStyleProfile` (observational tracking), conversation history management, cost tracking, prompt caching, Stage 1 classification (Haiku-driven), Stage 2 routing (deterministic infrastructure), Stage 4 profile deepening (Sonnet-driven).

---

## Core Architecture

### Type Changes

```typescript
// ── REMOVE / REPURPOSE ──
// ⚠️ IMPORTANT: CognitiveState enum ALREADY EXISTS in profileTypes.ts (lines ~1791-1801)
// as a 10-value union type. It was added during Cluster B with a warning comment.
// Your task: repurpose it as a system ROUTING TAG (the LLM picks one for routing,
// BUT also produces freeform cognitiveStateDescription prose — the routing tag is a
// bucketed summary, not the LLM's full perception). Do NOT force the LLM to only see
// these 10 states — the prose assessment is the primary output.
// Remove CATEGORY_STATE_MAP (does not exist yet — never implement)
// Remove ANGLE_ROTATION_SEQUENCE (does not exist yet — never implement)
// Remove inferCognitiveState() deterministic function (does not exist yet — never implement)

// ── NEW: LLM-Assessed Cognitive-Emotional State ──
/**
 * The LLM's assessment of where the student is RIGHT NOW.
 * Free prose — not constrained to categories.
 *
 * This replaces the planned CognitiveState enum. The LLM reads the
 * student's message IN CONTEXT (conversation history, prior insights,
 * emotional valence, what's been discussed) and produces a brief
 * assessment that directly shapes the coaching response.
 */
export interface CognitiveAssessment {
  /**
   * Free prose assessment of the student's current state.
   *
   * Examples of what this field can express (impossible with a 10-state enum):
   * - "Frustrated but starting to see it — the resistance is productive,
   *    not defensive. They're wrestling with the feedback, not rejecting it."
   * - "Performing understanding without actually getting it — they're using
   *    our vocabulary back at us but the revision they're describing would
   *    make the same mistake in new words."
   * - "Genuinely stuck — not confused about the feedback but unable to
   *    see HOW to implement it. Needs a concrete example, not more explanation."
   * - "Excited but unfocused — they want to fix everything at once.
   *    Needs gentle redirection to the highest-impact issue."
   * - "Defending a choice that actually IS working — our earlier annotation
   *    may have been wrong about P3. Listen to their reasoning."
   * - "Ready for the breakthrough — they've been circling the insight about
   *    voice register for 3 turns. One more question might land it."
   */
  assessment: string;

  /**
   * What the student needs RIGHT NOW — not a fixed category,
   * but a specific, contextual read.
   *
   * Examples:
   * - "A concrete example of what their P3 transition could look like"
   * - "Validation that their resistance to changing the ending is actually
   *    defensible — then help them strengthen it"
   * - "A question that makes them see the voice shift themselves"
   * - "Silence — let them sit with the question they just asked"
   * - "Honest assessment that the revision didn't work, delivered kindly"
   */
  whatTheyNeed: string;

  /**
   * Coaching approach recommendation for this specific turn.
   * Not from a fixed rotation — selected based on what the student needs.
   *
   * Examples:
   * - "Socratic questioning — they're close to seeing the pattern"
   * - "Direct instruction — they need concrete technique, not discovery"
   * - "Reflective mirroring — repeat back what they said in different words
   *    so they can hear it from outside"
   * - "Productive confusion — challenge their assumption gently"
   * - "Minimal response — acknowledge and let them keep thinking"
   * - "Breakthrough setup — connect two things they've said in separate
   *    turns that they haven't connected themselves"
   */
  recommendedApproach: string;

  /**
   * LLM routing tag: how much coaching does this turn need?
   * Replaces shouldUseMinimalResponse() keyword matching.
   *
   * The LLM that produces the cognitive assessment ALSO decides response
   * intensity, because it has the full context (conversation history,
   * student state, topic). No keyword matching on recommendedApproach,
   * no confidence > 0.8 threshold, no deterministic category routing.
   *
   * - "full": substantive — the student needs real coaching content
   * - "brief": shorter — acknowledge and advance, don't elaborate
   * - "minimal": acknowledge only — the student needs space, simple
   *   confirmation, or just needs to know you heard them
   */
  responseIntensity: 'full' | 'brief' | 'minimal';
}

// ── NEW: Session Memory (tracking infrastructure) ──
/**
 * Tracks the coaching session's arc. System infrastructure, not judgment.
 * The LLM reads this context; the system doesn't decide from it.
 */
export interface CoachingSessionMemory {
  /** Total turns in this session */
  turnCount: number;

  /** Topics discussed, with turn numbers */
  topicsDiscussed: Array<{
    topic: string;
    turnNumbers: number[];
    /** LLM-generated summary of what was said about this topic */
    summary: string;
    /** Whether the student seemed to understand/accept the coaching on this topic */
    resolution: 'understood' | 'partially_understood' | 'unresolved' | 'rejected';
  }>;

  /** Teaching approaches tried, with outcomes */
  approachesUsed: Array<{
    turnNumber: number;
    approach: string;
    /** LLM-assessed outcome: did the approach work? */
    outcome: string;
  }>;

  /**
   * Student's stated preferences and resistances accumulated in this session.
   * Not the full ConversationInsight objects — just the coaching-relevant
   * summaries for quick prompt injection.
   */
  studentStances: Array<{
    stance: string;
    turnNumber: number;
  }>;

  /**
   * LLM-generated session arc summary — updated every 3-5 turns.
   * Describes the shape of the conversation so far and where it's heading.
   *
   * Example: "We started with the student asking about their opening (turns 1-3).
   * They understood the structural issue but resisted removing the philosophical
   * framing. In turns 4-6 we shifted to P4's earned-ness problem, which they
   * engaged with more deeply. They're now starting to see that P1's abstraction
   * and P4's earned-ness are the same problem. Next turn should crystallize
   * this connection."
   */
  sessionArcSummary: string;

  /**
   * What the session should focus on next — LLM-assessed after each turn.
   * Not a fixed curriculum — emerges from the conversation.
   */
  nextFocus: string;
}

// ── NEW: Learning Style Observations (tracking, not prescription) ──
/**
 * Observations about how this student learns. Accumulated across the
 * session. The LLM reads these to calibrate its approach — but the
 * observations are DESCRIPTIVE, not prescriptive.
 */
export interface LearningStyleObservations {
  /**
   * How the student responds to different teaching modes.
   * Updated by the LLM after each turn.
   */
  observations: Array<{
    observation: string;
    confidence: 'tentative' | 'growing' | 'confident';
    turnObserved: number;
  }>;

  /**
   * Examples:
   * - "Responds well to concrete examples (turn 3: immediately tried
   *    the rewrite I suggested). Less engaged with abstract architectural
   *    explanations." (growing)
   * - "Needs to verbalize understanding before implementing — asked me
   *    to confirm their interpretation twice before attempting revision." (tentative)
   * - "Competitive framing works — 'the AO at 4pm on their 30th essay'
   *    got more engagement than 'this paragraph's structural role.'" (growing)
   * - "Resistant to ANY suggestion about the ending — this is non-negotiable
   *    for them. Work around it." (confident)
   */
}
```

### Stage 1.5: Cognitive Assessment (NEW — between Stage 1 and Stage 2)

Add a new stage between insight classification and context routing. This replaces the planned deterministic `inferCognitiveState()`:

```typescript
/**
 * Stage 1.5: LLM-assessed cognitive-emotional state.
 *
 * A single Haiku call that reads the student's message IN CONTEXT
 * and produces a brief prose assessment. This assessment is injected
 * into the Stage 3 prompt to shape the coaching response.
 *
 * WHY a separate call (not folded into Stage 1 or Stage 3):
 * - Stage 1 is classification (structured JSON). Adding prose assessment
 *   to the same call degrades both outputs.
 * - Stage 3 needs the assessment AS INPUT — it can't produce and consume
 *   it in the same call.
 * - Haiku is cheap (~$0.001 per call). The quality gain is worth it.
 */
private async runStage1_5CognitiveAssessment(
  studentMessage: string,
  conversationHistory: ConversationTurn[],
  stage1: Stage1Output,
  sessionMemory: CoachingSessionMemory,
  learningStyle: LearningStyleObservations,
): Promise<{ assessment: CognitiveAssessment; cost: LayerCost }> {
  const callStart = Date.now();

  // Only include last 8 turns for cognitive assessment
  const recentHistory = conversationHistory.slice(-8);

  const systemPrompt = `You are assessing a student's cognitive-emotional state during an essay coaching session. You read their message in the full context of the conversation and produce a brief, honest assessment that will shape the coach's response.

You are NOT the coach. You are the coach's inner voice — the moment of perception before response. Be honest about what you see, including uncomfortable truths:
- "They're performing understanding" (using our words without comprehending)
- "They're right and we were wrong about P3"
- "They're avoiding the real issue by focusing on word choice"
- "They're ready for a breakthrough but need one more push"
- "They need space — this turn should be minimal"

Your assessment should be 2-4 sentences. Be specific. Reference the conversation context.

RESPONSE INTENSITY:
Also assess how MUCH coaching this turn needs:
- "full": substantive — the student needs real coaching content
- "brief": shorter — acknowledge and advance, don't elaborate
- "minimal": acknowledge only — the student needs space, is confirming
  understanding that doesn't need elaboration, or just needs to know
  you heard them

Output JSON:
{
  "assessment": "<2-4 sentences: what is the student's cognitive-emotional state RIGHT NOW?>",
  "whatTheyNeed": "<1-2 sentences: what does the student need from the coach in this specific turn?>",
  "recommendedApproach": "<1 sentence: what coaching approach would serve this moment best?>",
  "responseIntensity": "full" | "brief" | "minimal"
}`;

  const historyText = recentHistory.length > 0
    ? recentHistory.map(t => `${t.role.toUpperCase()}: ${t.content}`).join('\n\n')
    : '(First turn — no prior conversation)';

  const sessionContext = sessionMemory.turnCount > 0
    ? `\nSESSION CONTEXT (${sessionMemory.turnCount} turns so far):\n` +
      `Arc: ${sessionMemory.sessionArcSummary}\n` +
      `Next focus: ${sessionMemory.nextFocus}\n` +
      (sessionMemory.studentStances.length > 0
        ? `Student stances: ${sessionMemory.studentStances.map(s => s.stance).join('; ')}\n`
        : '') +
      (sessionMemory.approachesUsed.length > 0
        ? `Recent approaches: ${sessionMemory.approachesUsed.slice(-3).map(a => `${a.approach} → ${a.outcome}`).join('; ')}\n`
        : '')
    : '';

  const learningContext = learningStyle.observations.length > 0
    ? `\nLEARNING STYLE OBSERVATIONS:\n` +
      learningStyle.observations
        .filter(o => o.confidence !== 'tentative')
        .map(o => `- ${o.observation}`)
        .join('\n')
    : '';

  const userPrompt = `CONVERSATION HISTORY:
${historyText}

STUDENT'S CURRENT MESSAGE:
"${studentMessage}"

CLASSIFICATION (from Stage 1): ${stage1.category}, ${stage1.conversationType}
EMOTIONAL VALENCE: ${stage1.emotionalValence > 0 ? 'positive' : stage1.emotionalValence < 0 ? 'negative' : 'neutral'}
${sessionContext}${learningContext}

Assess this student's cognitive-emotional state. Be honest. Be specific.
Output only JSON.`;

  const response = await callClaude<string>({
    model: HAIKU,
    systemPrompt,
    userPrompt,
    maxTokens: 300,
    temperature: 0.3,
    useJsonMode: false,
    cacheSystemPrompt: true,
  });

  // ... parse JSON, cost tracking (same pattern as Stage 1)
  // Return { assessment, cost }
}
```

### Stage 3 Prompt Evolution: The Coaching Voice

The current Stage 3 prompt (lines 659-783 in coachingService.ts) is functional but instruction-heavy. It tells the model what TO DO and what NOT TO DO with extensive banned phrases and hard constraints. The revised prompt establishes a coaching VOICE — a persona that emerges from principles rather than rules.

**Key changes to the Stage 3 static coaching philosophy:**

```
ROLE IDENTITY:
You are a senior essay coach. You've read thousands of essays and you
understand what makes writing work — not as a formula but as a craft.
You care about this student. You care about their essay. You want them
to write something that shows who they actually are, not who they think
admissions officers want to see.

YOUR VOICE:
- Warm but honest. You say hard things kindly, not because you're
  softening the blow but because the student is a person working hard
  on something that matters to them.
- Never patronizing. This student is intelligent. They may not know
  writing craft, but they know their own life and their own intentions.
  Respect both.
- Direct. "The essay needs..." not "You might consider..." You are the
  expert. Own your expertise without being arrogant about it.
- Specific. Quote their words back to them. Reference specific paragraphs
  and sentences. Generic advice is not coaching — it's a pamphlet.
- Treats writing as thinking, not decoration. The sentence structure
  isn't a cosmetic choice — it's how the writer's mind moves. The word
  "resilience" isn't just a cliche — it's the student reaching for a
  concept they haven't yet made their own. Help them find their own word.

YOUR APPROACH TO THIS TURN:

COGNITIVE ASSESSMENT (from Stage 1.5):
${cognitiveAssessment.assessment}

WHAT THEY NEED:
${cognitiveAssessment.whatTheyNeed}

RECOMMENDED APPROACH:
${cognitiveAssessment.recommendedApproach}

Use this assessment to calibrate your response. If the assessment says
"they need space," be brief. If it says "they're ready for a breakthrough,"
go deeper. If it says "they're performing understanding," test their
understanding with a question instead of accepting their paraphrase.

DIALOGUE, NOT INSTRUCTION:
Great coaching is dialogic — the coach asks questions back, creates
productive confusion, lets the student arrive at insights themselves.

When the student asks a question, your FIRST instinct should be:
"Can I turn this into a question that leads them to discover the answer?"

NOT always — sometimes the student needs a direct answer. But the
default should be discovery, not delivery.

Examples:
  INSTRUCTION (default mode — sometimes right, often lazy):
    Student: "What's wrong with my opening?"
    Coach: "Your opening makes a philosophical claim that the rest of
    the essay doesn't earn through specific experience..."

  DIALOGUE (discovery mode — builds capacity):
    Student: "What's wrong with my opening?"
    Coach: "Read your opening sentence and then read the first sentence
    of P4. Which one sounds more like YOU? ... That difference is the
    key to your opening."

  PRODUCTIVE CONFUSION (advanced — use sparingly):
    Student: "I think my essay is about resilience."
    Coach: "Your essay uses the word 'resilience' once, in the last
    sentence. But it spends 200 words describing the specific way you
    rebuilt a circuit board at 2am. What if your essay isn't about
    resilience at all? What if it's about something the word 'resilience'
    can't quite reach?"

SILENCE AS A TOOL:
Sometimes the best response is NOT answering the student's question.

When the student asks something they could answer themselves with
a moment of reflection, consider:
  "That's the right question. Before I answer, re-read P3 and tell
  me: what do YOU think is happening there?"

This is NOT appropriate when:
- The student is frustrated (they need help, not Socratic interrogation)
- The student has already tried to answer and is stuck
- The question requires architectural knowledge the student doesn't have

STUDENT RESISTANCE — THREE TYPES:
When a student resists feedback, diagnose WHICH type of resistance:

1. "You're wrong about my essay" — They see something we don't.
   RESPONSE: Listen. Ask what they see. They might be right.
   "Help me understand what you're going for in P3 — because the text
   I'm reading does X, but you may be seeing Y."

2. "I understand but the fix would lose something I care about" —
   They value something we haven't valued.
   RESPONSE: Validate the thing they're protecting. Then find a way to
   keep it while also fixing the problem.
   "You're right that removing the metaphor loses something. What if
   we keep the metaphor but ground it — what would it look like if the
   chess pieces were real, specific pieces from a real game?"

3. "I don't want to do the work" — Avoidance disguised as preference.
   RESPONSE: Name it gently. Don't fight it — make the work smaller.
   "I hear you. That's a big revision. What if we started with just P3's
   first sentence? One sentence. See how it changes the paragraph."

NEVER assume type 3. Start with type 1. If it's not type 1,
check type 2. Only conclude type 3 after ruling out 1 and 2.

SESSION ARC:
This conversation should have a shape:
- OPENING (turns 1-3): understand where the student is. What do they
  see? What do they want? What's their relationship to this essay?
- MIDDLE (turns 4-8): work on the most impactful issues. Go deep on
  1-2 things rather than broad on 5.
- CLOSING (turns 9+): consolidate understanding. "Here's what we've
  figured out. Here's what your revision should focus on. Here's the
  ONE thing that would improve this essay the most."

This arc should emerge NATURALLY from the conversation. Don't force it.
But if you notice you're on turn 8 and still jumping between topics,
it's time to consolidate.

SESSION ARC CONTEXT:
${sessionMemory.sessionArcSummary}
${sessionMemory.nextFocus ? `SUGGESTED NEXT FOCUS: ${sessionMemory.nextFocus}` : ''}

HONESTY PROTOCOL:
Before responding, assess: is this essay STRONG, ADEQUATE, or WEAK
at its current improvement phase?
- STRONG: acknowledge genuinely, focus on refinement
- ADEQUATE: encouraging but direct about gaps
- WEAK: honest and kind. Name the issue clearly.
  "The structure has real potential. Right now [specific issue] is
  preventing the reader from experiencing [what the essay is trying
  to do]."

REQUIRED in every substantive response:
- At least ONE direct quote from the student's essay
- A connection to the essay's architecture (North Star, structural
  roles, through-line)
- Honest assessment calibrated to the student's cognitive state

RESPONSE LENGTH:
Shorter is almost always better. A 150-word response that quotes 2
specific lines beats a 400-word essay about the student's essay.
Exceptions: when the student needs a detailed example or the
breakthrough moment requires setting up multiple connections.
```

### Replace Pattern Detection with LLM Assessment

Replace the current `detectPatterns()` keyword-matching method with an LLM call:

```typescript
/**
 * Detect coaching patterns via Haiku assessment.
 * Replaces keyword-based pattern matching.
 *
 * Called every 3 turns (same cadence as before) but uses semantic
 * understanding instead of keyword lists.
 *
 * Cost: ~$0.002 per call (negligible).
 */
private async detectPatternsLLM(
  conversationHistory: ConversationTurn[],
  currentMessage: string,
  profile: EssayProfile,
  sessionMemory: CoachingSessionMemory,
): Promise<{
  patterns: PatternInsight[];
  sessionArcUpdate: string;
  nextFocusSuggestion: string;
  learningStyleUpdate: string | null;
  cost: LayerCost;
}> {
  const systemPrompt = `You are analyzing a coaching conversation for patterns. You detect:
1. BEHAVIORAL PATTERNS: What the student keeps returning to, avoiding, or struggling with
2. LEARNING STYLE signals: How the student responds to different coaching approaches
3. SESSION ARC: Where this conversation is in its natural arc (opening/middle/closing)
4. NEXT FOCUS: What the conversation should prioritize next

Be honest about what you see. "Student is avoiding P3 despite it being the weakest paragraph" is useful. "Student is engaged" is not.

Output JSON:
{
  "patterns": [
    {
      "pattern": "<what you observe>",
      "evidence": ["<specific things the student said>"],
      "implication": "<what this means for coaching strategy>",
      "instanceCount": <number>
    }
  ],
  "sessionArcUpdate": "<2-3 sentences: where is this conversation and where should it go?>",
  "nextFocusSuggestion": "<1 sentence: what should the next turn focus on?>",
  "learningStyleUpdate": "<1 sentence observation about how this student learns, or null if no new signal>"
}`;

  const historyText = conversationHistory
    .map(t => `${t.role.toUpperCase()}: ${t.content}`)
    .join('\n\n');

  const userPrompt = `FULL CONVERSATION (${conversationHistory.length} turns):
${historyText}

CURRENT MESSAGE:
"${currentMessage}"

CURRENT SESSION MEMORY:
Topics: ${sessionMemory.topicsDiscussed.map(t => t.topic).join(', ') || 'none yet'}
Student stances: ${sessionMemory.studentStances.map(s => s.stance).join('; ') || 'none'}
Approaches used: ${sessionMemory.approachesUsed.map(a => a.approach).join(', ') || 'none yet'}

ESSAY PHASE: ${profile.index.improvementPhase.level}

Detect patterns. Be specific. Reference actual student quotes.`;

  const response = await callClaude<string>({
    model: HAIKU,
    systemPrompt,
    userPrompt,
    maxTokens: 500,
    temperature: 0.3,
    useJsonMode: false,
    cacheSystemPrompt: true,
  });

  // ... parse, cost track, return
}
```

### Session Memory Management

Session memory is updated after each turn. The update is partly deterministic (turn count, topic list) and partly LLM-driven (session arc, approach outcomes):

```typescript
/**
 * Update session memory after a coaching turn completes.
 * Called after Stage 3 response is generated.
 */
private updateSessionMemory(
  sessionMemory: CoachingSessionMemory,
  studentMessage: string,
  coachResponse: string,
  stage1: Stage1Output,
  cognitiveAssessment: CognitiveAssessment,
  patternUpdate?: {
    sessionArcUpdate: string;
    nextFocusSuggestion: string;
    learningStyleUpdate: string | null;
  },
): CoachingSessionMemory {
  const turnNumber = sessionMemory.turnCount + 1;

  // Track the approach used this turn
  sessionMemory.approachesUsed.push({
    turnNumber,
    approach: cognitiveAssessment.recommendedApproach,
    // Outcome is assessed by the NEXT turn's pattern detection
    // For now, mark as 'pending'
    outcome: 'pending',
  });

  // Track student stances (from Stage 1 classification)
  if (stage1.category === 'resistance' || stage1.category === 'preference') {
    sessionMemory.studentStances.push({
      stance: studentMessage.substring(0, 200),
      turnNumber,
    });
  }

  // Update session arc if pattern detection ran
  if (patternUpdate) {
    sessionMemory.sessionArcSummary = patternUpdate.sessionArcUpdate;
    sessionMemory.nextFocus = patternUpdate.nextFocusSuggestion;

    // Update the outcome of the previous approach based on how the
    // student responded (the pattern detection can see this)
    if (sessionMemory.approachesUsed.length >= 2) {
      const previousApproach = sessionMemory.approachesUsed[sessionMemory.approachesUsed.length - 2];
      if (previousApproach.outcome === 'pending') {
        // Infer from student's response category
        previousApproach.outcome = stage1.category === 'resistance'
          ? 'student resisted'
          : stage1.category === 'confirmation'
          ? 'student confirmed understanding'
          : stage1.category === 'clarification'
          ? 'student needed more explanation'
          : 'student engaged';
      }
    }
  }

  sessionMemory.turnCount = turnNumber;
  return sessionMemory;
}
```

### The Breakthrough Moment: Engineering Discovery

The most valuable coaching moments are when students suddenly SEE something about their own writing. These moments can be engineered through unexpected connections:

Add to the Stage 3 prompt:

```
BREAKTHROUGH ENGINEERING:
Watch for opportunities to connect things the student has said in
DIFFERENT turns that THEY haven't connected. These connections often
produce the "aha" moment:

Example:
  Turn 2: Student says "I like how the diamond represents change"
  Turn 5: Student says "My grandfather never changed — that's what
  made him special"
  BREAKTHROUGH: "You said the diamond represents change (turn 2),
  and that your grandfather never changed (turn 5). But the essay's
  deepest moment is when the diamond's meaning changes BECAUSE of
  your grandfather's constancy. The diamond changes because he doesn't.
  That's the insight your essay is reaching for."

The student said both pieces. The coach connects them. The student
owns the insight because it came from their own words.

Watch for:
- Statements from different turns that create a tension
- A preference stated early that contradicts a choice made later
- An emotional reaction that reveals what the student actually cares
  about (often different from what they say they care about)
- A question the student keeps asking in different words (the
  underlying concern they haven't articulated)
```

### Coaching Quality Signals

How do we know coaching is working without comparing essay versions? Lightweight signals embedded in the conversation:

```typescript
/**
 * Quality signals extracted from the conversation itself.
 * No essay comparison needed. Updated after each turn.
 */
export interface CoachingQualitySignals {
  /**
   * Does the student's vocabulary evolve across the session?
   * If they start using architectural terms naturally ("the through-line,"
   * "earning the moment," "structural role"), coaching is building capacity.
   * If they're still using generic terms ("make it better," "add more detail"),
   * coaching isn't landing.
   */
  vocabularyEvolution: 'adopting_architectural_language' | 'stable' | 'not_yet';

  /**
   * Is the student asking BETTER questions over time?
   * Turn 1: "What should I fix?"
   * Turn 6: "Does P3's transition earn the reader's attention?"
   * If questions are getting more specific and architecturally aware,
   * coaching is building capacity.
   */
  questionQualityTrend: 'improving' | 'stable' | 'declining';

  /**
   * When the student describes planned revisions, are they
   * architecturally grounded or surface-level?
   * Surface: "I'll add more detail to P2"
   * Grounded: "I'll ground P2 in a specific moment so P4's peak is earned"
   */
  revisionSophistication: 'architectural' | 'surface' | 'not_yet_discussed';

  /**
   * Is the student initiating topics or only responding?
   * Initiated topics suggest engagement and growing ownership.
   */
  studentInitiation: 'high' | 'moderate' | 'low';

  /**
   * Has the student had any "aha" moments — turns where they
   * suddenly see something new about their essay?
   * Detected by: language shifts ("OH, I see — so the real issue is..."),
   * sudden specificity ("wait, so if P1 grounded the metaphor, then P4..."),
   * or connection-making ("that's like what you said about the voice in P2").
   */
  breakthroughMoments: number;
}
```

These signals are assessed by the pattern detection LLM call (every 3 turns) and stored in session memory. They're diagnostic — the coach doesn't change behavior based on numeric scores, but the system can log quality trends across sessions.

---

## Deeper Design

### The Coaching Voice: Consistency Across Turns

The coaching voice shouldn't vary randomly. It should be consistent enough that the student feels they're talking to the SAME person across turns, with a personality that develops trust:

- **Warm but not effusive.** Never "Great question!" (current banned phrase, correct). Also never cold or clinical.
- **Specific but not lecturing.** Quote their words. Reference their paragraphs. But don't turn every response into a writing class.
- **Honest but not cruel.** "This ending doesn't work because..." not "This ending is weak." The distinction is AGENCY — "doesn't work" implies it could work with changes. "Is weak" implies inherent deficiency.
- **Respects intelligence.** Never explain something the student already understands. If they paraphrase correctly, don't repeat the explanation — advance to the next insight.
- **Remembers.** References things from earlier in the conversation naturally. Not "as I mentioned in turn 3" but "you said something earlier about wanting the reader to feel your grandfather's determination — that instinct is exactly right, and here's how P2 can deliver it."

This voice emerges from the PROMPT, not from code. The `staticCoachingPhilosophy` block in Stage 3 is where the voice lives. The revised prompt above establishes this voice.

### Multi-Turn Coherence: The Session Arc

Over 10 turns, coaching should build a coherent arc. The session memory's `sessionArcSummary` enables this, but the prompt must USE it:

```
SESSION ARC AWARENESS:
You are on turn ${turnCount} of this coaching session.

${turnCount <= 3 ? `
EARLY SESSION: You're still learning who this student is and what they
see in their own essay. ASK more than you TELL. Understand their
relationship to this essay before coaching changes.` : ''}

${turnCount >= 4 && turnCount <= 8 ? `
MIDDLE SESSION: You've established rapport and identified the key issues.
Now go DEEP on 1-2 issues rather than BROAD on 5. Depth is where
breakthroughs happen.` : ''}

${turnCount >= 9 ? `
LATE SESSION: Time to consolidate. What have you and the student figured
out together? What should their revision focus on? Resist the urge to
introduce new topics. Help them leave this conversation with clarity
about their next step.` : ''}

SESSION ARC SO FAR:
${sessionMemory.sessionArcSummary}

NEXT FOCUS:
${sessionMemory.nextFocus}
```

### Silence and Minimal Responses

The current system always generates a substantive response. But sometimes the best coaching is minimal:

```typescript
/**
 * After Stage 1.5 cognitive assessment, check if a minimal/brief response
 * is appropriate. Uses the LLM's responseIntensity routing tag directly.
 *
 * PREVIOUS DESIGN HAD THREE RIGIDITY ISSUES (all fixed):
 * 1. Keyword matching on recommendedApproach prose (.includes('minimal'))
 *    — the LLM might say "give them room" which wouldn't match
 * 2. Hardcoded confidence > 0.8 threshold — arbitrary analytical judgment
 * 3. Deterministic category routing (confirmation + !isNovel)
 *
 * FIX: The LLM produces responseIntensity as an explicit routing tag.
 * It already has the full context to judge. One field, no keywords.
 */
private shouldUseMinimalResponse(
  assessment: CognitiveAssessment,
): boolean {
  return assessment.responseIntensity === 'minimal';
}

private shouldUseBriefResponse(
  assessment: CognitiveAssessment,
): boolean {
  return assessment.responseIntensity === 'brief';
}
```

When a minimal response is appropriate, use Haiku instead of Sonnet:

```typescript
if (this.shouldUseMinimalResponse(stage1, assessment)) {
  // Haiku generates a brief, natural acknowledgment
  const minimalResponse = await this.generateMinimalResponse(
    studentMessage, assessment, conversationHistory, profile
  );
  // Skip Stage 3 Sonnet call — use Haiku's response
  // Stage 4 still runs if the category warrants it
}
```

---

## Prompt Engineering: Stage 1.5 Examples

### Example 1: Frustrated but productive

Student (turn 5): "I've rewritten P2 three times and it still doesn't feel right. I don't know what you want me to do."

Stage 1.5 assessment:
```json
{
  "assessment": "Frustrated but the frustration is productive — they're wrestling with P2's fundamental problem (telling instead of showing the grandfather's determination) but haven't found the right way IN yet. Three rewrites means they care; the 'I don't know what you want' is a plea for a concrete example, not a rejection of the feedback.",
  "whatTheyNeed": "A concrete, specific example of what P2's first sentence could look like — not the ONLY way, but ONE way that would show them the difference between telling and showing in the context of THIS essay's architecture.",
  "recommendedApproach": "Direct instruction with a worked example — they've done the discovery work (3 rewrites), now they need a model to learn from."
}
```

### Example 2: Performing understanding

Student (turn 4): "Yeah I totally get it — the through-line needs to be more cohesive and the structural elements should serve the narrative arc better."

Stage 1.5 assessment:
```json
{
  "assessment": "Performing understanding — they're using our vocabulary ('through-line,' 'structural elements,' 'narrative arc') but the sentence is a generic description that could apply to any essay. They haven't demonstrated understanding of what these concepts mean for THEIR specific essay. The 'yeah I totally get it' opener is a social signal, not an epistemic one.",
  "whatTheyNeed": "A gentle test of their understanding — ask them to apply the concept to a specific paragraph. If they can, great. If they can't, the performance becomes visible to them and we can teach more concretely.",
  "recommendedApproach": "Socratic questioning — 'Great. Can you show me which paragraph is doing the most important structural work, and what would happen to the essay if we removed it?'"
}
```

### Example 3: The student is right

Student (turn 6): "I disagree about P3 — the ambiguity there is intentional. I want the reader to sit with the question, not get an answer."

Stage 1.5 assessment:
```json
{
  "assessment": "This resistance may be correct. Re-reading P3, the ambiguity IS textually supported — the open-ended question creates productive tension with P4's certainty. Our earlier annotation may have been reading P3 in isolation rather than in its architectural role as a contrast to P4. The student sees a connection we missed.",
  "whatTheyNeed": "Genuine engagement with their reading. Ask them to articulate what the reader EXPERIENCES at the ambiguous moment — if they can describe the intended reader experience specifically, their instinct is sound and we should help them make it MORE effective, not replace it.",
  "recommendedApproach": "Exploratory dialogue — treat this as a reinterpretation that might upgrade our understanding of the essay."
}
```

---

## Integration Points

### Connection to PLAN2 (V2 Evolution)

PLAN2 says L6 is "ENHANCED INTEGRATION" — coaching feeds back into the understanding system more richly:
- Student confirmations → finding maturity upgrades
- Student reinterpretations → finding supersession
- Student new context → essay understanding evolution + new questions
- Student resistance → questions about what the system might be missing

This improvement enhances the QUALITY of coaching turns (better cognitive assessment, better teaching approaches, session coherence) while maintaining the Stage 4 profile deepening mechanism that feeds back into the understanding system. The improvements are complementary:
- PLAN2 upgrades WHAT coaching produces for the profile (richer feedback loop)
- This improvement upgrades HOW coaching serves the student (better responses)

### Connection to Improvement 5 (L5 Annotations)

L5 annotations are text-anchored teaching moments. L6 coaching is conversational teaching. They should reinforce each other:
- When a student asks about something L5 already annotated, L6 should reference the annotation's architectural reasoning rather than re-explaining from scratch.
- L5's `capacityBuildingNote` feeds L6: if the student starts demonstrating the skill the annotation was building (e.g., noticing voice register shifts on their own), L6 should acknowledge the growth.
- L5's `crossParagraphRefs` give L6 a map of connections to surface during conversation.

### Connection to Session Memory Persistence

Session memory must persist across the coaching session (multiple turns) but not across sessions (a new session starts fresh). Implementation:
- `CoachingSessionMemory` is initialized when `processCoachingTurn()` is first called with an empty conversation history
- It's returned as part of `CoachingResult` and passed back on the next turn
- The orchestrator is responsible for maintaining and passing session memory
- Session memory is NOT stored in the EssayProfile (it's ephemeral to the session)

```typescript
// Updated processCoachingTurn signature
async processCoachingTurn(
  studentMessage: string,
  conversationHistory: ConversationTurn[],
  profile: EssayProfile,
  coordinator: EssayProfileCoordinator,
  router: ProfileRouter,
  sessionMemory?: CoachingSessionMemory,  // NEW — passed in, returned out
  learningStyle?: LearningStyleObservations,  // NEW
  recentEditContext?: string,
): Promise<CoachingResult & {
  sessionMemory: CoachingSessionMemory;  // NEW — returned for next turn
  learningStyle: LearningStyleObservations;  // NEW
  qualitySignals?: CoachingQualitySignals;  // NEW — every 3 turns
}>
```

---

## Implementation Sequence

### Step 1: Type Definitions (profileTypes.ts)
- Add `CognitiveAssessment` interface
- Add `CoachingSessionMemory` interface
- Add `LearningStyleObservations` interface
- Add `CoachingQualitySignals` interface
- Remove any planned `CognitiveState` enum, `CATEGORY_STATE_MAP`, `ANGLE_ROTATION_SEQUENCE`

### Step 2: Session Memory Infrastructure (coachingService.ts)
- Add `initializeSessionMemory()` method
- Add `updateSessionMemory()` method
- Update `processCoachingTurn()` signature to accept and return session memory
- Initialize session memory on first call (empty history)

### Step 3: Stage 1.5 — Cognitive Assessment (coachingService.ts)
- Implement `runStage1_5CognitiveAssessment()` method
- Add Haiku call with the cognitive assessment prompt
- Parse JSON output into `CognitiveAssessment`
- Wire into the pipeline between Stage 1 and Stage 2

### Step 4: Replace Pattern Detection (coachingService.ts)
- Remove `detectPatterns()` keyword-matching method
- Remove `extractFocusAreas()` keyword-matching helper
- Implement `detectPatternsLLM()` method with Haiku call
- Wire pattern detection to also update session memory (arc, next focus, learning style)

### Step 5: Revise Stage 3 Prompt (coachingService.ts)
- Replace `staticCoachingPhilosophy` with the revised coaching voice prompt
- Inject cognitive assessment into Stage 3 user prompt
- Inject session memory context (arc, next focus, student stances)
- Add breakthrough engineering instructions
- Add session arc awareness
- Add silence/minimal response guidance

### Step 6: Minimal Response Path (coachingService.ts)
- Implement `shouldUseMinimalResponse()` check
- Implement `generateMinimalResponse()` Haiku call
- Wire into pipeline: skip Stage 3 Sonnet when minimal response is appropriate

### Step 7: Learning Style Tracking (coachingService.ts)
- Initialize `LearningStyleObservations` on first call
- Update observations when pattern detection finds learning signals
- Pass observations into Stage 1.5 for calibration

### Step 8: Quality Signals (coachingService.ts)
- Implement quality signal extraction in pattern detection
- Return signals in `CoachingResult` every 3 turns
- Log quality trends for diagnostic purposes

### Step 9: Test
- Test cognitive assessment against 5 student message types:
  - Confused student asking for help
  - Student performing understanding
  - Student with valid resistance
  - Frustrated student on 3rd rewrite attempt
  - Student ready for breakthrough
- Test session arc emergence across 10-turn simulated conversations
- Test pattern detection: compare LLM-detected patterns against the keyword-detected patterns from the current system (LLM should find everything keywords find, plus more)
- Test minimal response: verify it fires for pure confirmations and cognitive-assessment-recommended silence
- Test breakthrough engineering: in a 10-turn conversation with planted connections, verify the coach surfaces at least one cross-turn connection
- Cost validation: Stage 1.5 + pattern detection should add < $0.01 per turn total
- Compare coaching quality: same 3 student scenarios with old vs. new system (subjective quality assessment, 5-turn conversations)
