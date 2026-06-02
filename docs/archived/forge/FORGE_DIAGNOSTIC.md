# Conversator Diagnostic Report

> **Version**: v1 | **Date**: 2026-03-15
> **Purpose**: Map current L6 coaching reality, quantify quality gaps, inventory reusable infrastructure, and establish hard constraints for the Conversator multi-system architecture.
> **Standard**: Every section passes the "start coding" test — an engineer can begin implementing from any section without asking "but how exactly?"

---

## Section 1: Current Reality Map

### 1.1 Full Coaching Interaction Path (Stage-by-Stage)

The coaching pipeline lives in a single file: `src/services/essayIntelligence/coaching/coachingService.ts` (2600+ lines). Entry point: `CoachingService.processCoachingTurn()`.

```
processCoachingTurn(studentMessage, conversationHistory, profile, coordinator, router, recentEditContext?, editStrategyContext?, sessionMemory?, learningStyle?)
```

**Stage 1: Insight Extraction (Haiku, ~$0.001)**

- File: `coachingService.ts:453-767`
- Function: `runStage1InsightExtraction()`
- Model: `claude-haiku-4-5-20251001`, temperature 0.2, maxTokens 512
- System prompt: ~3400 chars of static category taxonomy (cached via `cacheSystemPrompt: true`)
- User prompt: paragraph count + last 6 conversation turns + edit context + student message
- Output: `Stage1Output` with 13 fields:
  - `category`: one of 8 InsightCategory values
  - `cognitiveState`: one of 10 CognitiveState values
  - `scopeCertainty`: 'high' | 'moderate' | 'low'
  - `focusProbabilities`: `Record<string, number>` (e.g., `{ P1: 0.3, P2: 0.6 }`)
  - `dimensionFocus`: string[] (voice, narrative, etc.)
  - `conversationType`: coaching_question | revision_discussion | meta_conversation | general_inquiry
  - `targetParagraphIndex` / `targetSentenceIndex`: 0-based indices or null
  - `emotionalValence`, `confidence`, `isExplicit`, `isNovel`, `recentEditAware`, `preferenceDurability`
- Quality control: 4-level defensive JSON parsing (direct → strip markdown → regex extract → jsonrepair)

**Stage 1.5: Cognitive Assessment (Haiku, ~$0.001)**

- File: `coachingService.ts:1960-2094`
- Function: `runStage1_5CognitiveAssessment()`
- Model: Haiku, temperature 0.3, maxTokens 300
- Input context: last 8 conversation turns + Stage 1 classification + session memory + learning style observations
- Output: `CognitiveAssessment` with 4 fields:
  - `assessment`: 2-4 sentence free prose (e.g., "They're performing understanding without actually getting it...")
  - `whatTheyNeed`: specific contextual read ("A concrete example of what their P3 transition could look like")
  - `recommendedApproach`: ("Socratic questioning — they're close to seeing the pattern")
  - `responseIntensity`: 'full' | 'brief' | 'minimal'
- This is the key routing decision: `minimal` routes to Haiku Stage 3, `full`/`brief` routes to Sonnet Stage 3.

**Stage 2: Context Routing (NO LLM)**

- File: `coachingService.ts:773-849`
- Function: `runStage2ContextRouting()`
- Logic: Pure deterministic routing based on Stage 1 output
- Routing decision tree:
  1. `recentEditAware && recentEditContext && maxProb > 0.5` → `inline_edit_sentence`
  2. `dimensionFocus.includes('voice')` or voice-related preference → `l6_coaching_voice`
  3. `maxProb > 0.5` (focused on specific paragraph) → `l6_coaching_paragraph`
  4. Else → `l6_coaching_overview`
- Builds `ContextRequest` with `rule`, `paragraphIndex`, `sentenceIndex`, `searchTags`, `tokenBudget: 8000`
- Calls `router.assembleContext(profile, routingRequest)` → `AssembledProfileContext`

**Token budgets per coaching route** (from `profileRouter.ts:200-203`):
- `l6_coaching_voice`: 8000 tokens
- `l6_coaching_paragraph`: 6000 tokens
- `l6_coaching_overview`: 4000 tokens
- `inline_edit_sentence`: 8000 tokens

**Pre-Stage 3: Pattern Detection (Haiku, conditional, ~$0.003)**

- File: `coachingService.ts:1801-1940`
- Function: `detectPatternsLLM()`
- Triggers: when `conversationHistory.length >= 3` (lowered from 5)
- Model: Haiku, temperature 0.3, maxTokens 600
- Output: behavioral patterns, session arc update, next focus suggestion, learning style update, quality signals
- Runs BEFORE Stage 3 so patterns influence the coaching response
- Also retroactively assesses outcome of the previous turn's approach

**Stage 3: Coaching Response (Sonnet for full/brief, Haiku for minimal)**

- File: `coachingService.ts:856-1168`
- Function: `runStage3CoachingResponse()` (Sonnet path) or `generateMinimalResponse()` (Haiku path)
- **The most important prompt in the system.** Two blocks:

Block 1 — Static coaching philosophy (CACHED, ~1020 lines, ~4500 chars):
- Role identity: "senior essay coach" voice definition
- Banned phrases (sycophancy detection)
- Dialogue-first pedagogy (discovery mode vs instruction mode vs productive confusion)
- Silence as a tool (when to NOT answer)
- Student resistance taxonomy (3 types: you're wrong / I'd lose something / avoidance)
- Correction protocol (acknowledge immediately, recalibrate)
- Breakthrough engineering (connect student's own cross-turn statements)
- Honesty protocol (STRONG / ADEQUATE / WEAK assessment)
- Phase-aware coaching (Foundation → Architecture → Craft → Polish → Distinction)
- Response length guidance (shorter is better)
- Anti-repetition rules

Block 2 — User prompt (DYNAMIC, includes):
- `buildProfileContextText()`: North Star summary, structural roles, critical concerns, assembled profile sections, recent conversation insights
- Full essay text (all paragraphs as `P1: ...`, `P2: ...`)
- Finding context (top 5 active findings by coaching value)
- Conversation history (last 12 turns)
- Current student message
- Edit context + edit strategy context
- Stage 1 classification
- Cognitive assessment from Stage 1.5
- Session arc context (early/middle/late)
- Confusion escalation context (if applicable)
- Pattern insights
- Anti-repetition context
- Improvement phase + coaching lens + readiness + deferred areas

Model config: Sonnet, temperature 0.4, maxTokens 2048, `cacheSystemPrompt: true`

**Stage 4: Profile Deepening (conditional Sonnet)**

- File: `coachingService.ts:1229-1636`
- Function: `runStage4ProfileDeepening()`
- Triggers for Sonnet call: `reinterpretation` or `new_context` categories
- No LLM for: `confirmation`, `correction`, `preference`, `emotional_reaction`, `resistance`, `clarification`
- Reinterpretation path: Sonnet evaluates student's alternative reading against findings → classifies each finding as confirmed/superseded/tensioned → applies finding supersession via FindingStore → reverse-propagates to sentence-level understanding
- New context path: Sonnet integrates background information → identifies affected sections
- Returns: `stage4Verdict` ('confirmed' | 'superseded' | 'tensioned' | 'none')

**Stage 5: Phase Check (no LLM, diagnostic only)**

- File: `coachingService.ts:1748-1786`
- Function: `runStage5PhaseCheck()`
- Pure diagnostic: logs readiness state, warns if 3+ high-impact insights in last 30 minutes suggest phase staleness
- Phase transitions happen via L3.5 re-analysis, NOT coaching turns

### 1.2 Profile Context Assembly Detail

The `ProfileRouter` (2910 lines, `profileRouter.ts`) assembles context per routing rule:

**`l6_coaching_voice`** (budget: 8000 tokens):
- ALWAYS: ProfileIndex + VoiceIdentity + VoiceMap
- TARGETED: voice-tagged sentences with understanding/analysis
- Task priorities: voiceIdentity=10, voiceMap=10, emotionalTopography=6, craftAssessment=6

**`l6_coaching_paragraph`** (budget: 6000 tokens):
- ALWAYS: ProfileIndex + target paragraph full (understanding + analysis + all sentences)
- ALWAYS: compact voice context, thematic context, through-line context, structural role
- CONNECTION-DRIVEN: connected paragraphs' specific sentences with full detail
- PROXIMITY: adjacent paragraph digests
- Adaptive overlay: always prioritizes NorthStar + throughLine

**`l6_coaching_overview`** (budget: 4000 tokens):
- ALWAYS: ProfileIndex + ALL holistic sections (voice, emotion, theme, narrative, character, craft, entanglements, admissions)
- ALWAYS: North Star
- Paragraph digests only (no sentence detail)

**`inline_edit_sentence`** (budget: 8000 tokens):
- ALWAYS: ProfileIndex + target sentence understanding/analysis + paragraph craft profile
- CONNECTION-DRIVEN: connected sentences
- VoiceMap (full)

### 1.3 How Findings Are Used in Coaching

Findings are injected into Stage 3 via `buildFindingCoachingContext()` (line 2360):

```typescript
private buildFindingCoachingContext(coordinator: EssayProfileCoordinator): string {
  const findingStore = coordinator.getFindingStore();
  const active = findingStore.getActiveSortedByCoachingValue();
  if (active.length === 0) return '';

  const findingContext = buildFindingContext(findingStore, {
    maxActiveFindings: 5,
    includeSuperseded: false,
    includeEvidence: true,
    includeLineage: false,
    includeDeepeningPotential: false,
  });

  return `\n\n=== KEY FINDINGS (reference by [F] label when discussing relevant topics) ===\n` +
    findingContext;
}
```

The prompt says "reference by [F] label when discussing relevant topics" — this is a soft suggestion, not a systematic coaching strategy. The model MAY reference findings. It often doesn't, because:

1. Findings are injected as a separate section, not woven into the routing-rule-specific context
2. The coaching philosophy prompt doesn't instruct the coach to BUILD on findings
3. There's no mechanism to prioritize findings that are most relevant to the student's current question
4. The 5-finding limit is global, not scoped to the student's focus area

### 1.4 Edit-Aware Coaching

When the student has recently edited their essay:
- `recentEditContext` string is injected into Stage 1 and Stage 3 prompts
- `editStrategyContext` (from version tracker) includes abandoned approaches
- Stage 2 routing: if `recentEditAware && maxProb > 0.5`, routes to `inline_edit_sentence`
- The anti-repetition section warns against suggesting abandoned approaches

**What's missing**: No way for the coach to reference WHAT CHANGED vs. what stayed the same. The `EditUnderstanding` service produces rich significance/purpose/impact analysis, but this is consumed by the re-analysis pipeline, NOT by the coaching service. The coach sees "the student just edited" but not "the student changed the metaphor from diamond to glass, which affects the through-line."

### 1.5 Emotional/Pedagogical Calibration

**What exists:**
- CognitiveAssessment (Stage 1.5): free prose assessment of student state → injected into Stage 3
- Confusion escalation (W6.2): `confusionTrackers` Map tracks per-topic confusion count → escalation instructions injected into Stage 3 at levels 2+ (different angle), 3 (break down), 4+ (acknowledge difficulty)
- Session arc awareness: early (ask > tell), middle (go deep), late (consolidate)
- Pattern detection: behavioral patterns with evidence → injected into Stage 3

**What's missing:**
- No pedagogical SEQUENCING. The system doesn't track what the student has LEARNED. It tracks what was DISCUSSED (topicsDiscussed), but "we talked about voice shifts" ≠ "the student understands voice shifts."
- No capability model. There's nowhere to record "student learned the sensory threading technique" or "student can now identify show-vs-tell independently."
- No zone of proximal development calculation. The improvement phase (Foundation→Architecture→Craft→Polish→Distinction) is a coarse filter on feedback granularity. But within Foundation, there's no sense of "this student is ready to learn about paragraph roles because they already understand essay-level thesis."

### 1.6 Session State: What It Tracks vs. What It Should Track

**Currently tracked (CoachingSessionMemory):**
| Field | Type | Purpose |
|-------|------|---------|
| `turnCount` | number | Session length |
| `topicsDiscussed` | `Array<{topic, turnNumbers, summary, resolution}>` | What was covered |
| `approachesUsed` | `Array<{turnNumber, approach, outcome}>` | Teaching approaches tried |
| `studentStances` | `Array<{stance, turnNumber}>` | Preferences and resistances |
| `sessionArcSummary` | string | LLM narrative of session shape |
| `nextFocus` | string | What to focus on next |

**Currently tracked (LearningStyleObservations):**
| Field | Type | Purpose |
|-------|------|---------|
| `observations` | `Array<{observation, confidence, turnObserved}>` | How student learns |

**Currently tracked (CoachingQualitySignals):**
| Field | Type | Purpose |
|-------|------|---------|
| `vocabularyEvolution` | enum | Are they adopting architectural language? |
| `questionQualityTrend` | enum | Are questions getting better? |
| `revisionSophistication` | enum | Are planned revisions architectural? |
| `studentInitiation` | enum | Is the student driving? |
| `breakthroughMoments` | number | Count of "aha" moments |

**NOT tracked (needed for Conversator):**
| Missing | Why It Matters |
|---------|---------------|
| Techniques taught | Can't reference "the sensory threading technique you learned 3 turns ago" |
| Skill competencies | Can't assess readiness for next-level coaching |
| Workshop state | No brainstorm→draft→evaluate cycle tracking |
| Revision companion state | No tracking of which edits the student is working on right now |
| Cross-essay student model | Each essay starts from zero context |
| Interaction mode | System doesn't distinguish "I want you to brainstorm with me" from "critique this sentence" |
| Craft technique inventory | System has no knowledge of specific techniques to teach |

---

## Section 2: Quality Gaps (Prioritized by Impact)

### GAP-1: No Craft Expertise Layer

**Current State**: The Stage 3 prompt tells the coach to "be specific" and "quote their words back" — but provides no technical craft vocabulary, no technique library, no pattern knowledge. The LLM improvises craft advice from its general training.

**Target State**: A deep writing craft engine that knows specific techniques by name, can teach them with examples, and can recommend the right technique for the right problem.

**Concrete before/after:**

CURRENT (at its worst):
```
Student: "I don't know how to fix the transition in paragraph 2"
Coach: "The transition between your lab scene and the hospital scene feels abrupt
because there's no bridging element. Consider adding a sensory detail or thematic
connection that links the two environments."
```

TARGET:
```
Student: "I don't know how to fix the transition in paragraph 2"
Coach: "Let's think about what that transition needs to do. You want to connect
the lab to your grandmother — right now the reader goes from 'I adjusted the
pipette' to 'My grandmother was diagnosed' with nothing between them.

Here's a technique that works for bridging physically separate scenes: find
something that exists in BOTH places. Not something abstract — something your
senses would register. What's in a chemistry lab that's also in a hospital?"

[Student answers: "The smell"]

Coach: "That's exactly it — smell is the most emotionally immediate sense, and
it exists in both environments without you having to explain the connection. Try
writing one sentence that puts that smell in the lab scene, almost casually. When
the reader gets to the hospital paragraph, the sensory echo creates the bridge
automatically.

This technique — using a shared sensory detail to bridge separate scenes — is
called sensory threading. It works any time you're connecting moments that are
physically separate but emotionally linked."
```

**Root cause**: Missing infrastructure. The Stage 3 system prompt is ~1000 lines of coaching PHILOSOPHY but zero lines of craft TECHNIQUE. The model knows general writing advice from training, but doesn't have access to a curated library of admissions-essay-specific techniques with names, examples, and applicability conditions.

**Impact**: The difference between "consider adding a sensory detail" (generic) and teaching the student a named, reusable technique (capacity-building). This is the #1 gap between current output and the target quality bar.

**Existing infrastructure that helps**:
- VoiceMap with 5-dimensional tracking → rich input for voice-specific craft advice
- MomentEarnednessMap with mechanisms/gaps → directly identifies WHERE craft techniques are needed
- CraftAssessment with strengthSignatures/growthEdges → identifies WHICH craft areas need attention
- Connection graph → identifies structural craft opportunities (where connections are weak)

**Implementation complexity**: HIGH. Requires: (1) technique library data structure, (2) technique-selection LLM prompt, (3) technique-to-profile matching, (4) separate Sonnet call with craft-specific system prompt.

---

### GAP-2: No Pedagogical Sequencing / Capability Tracking

**Current State**: Session memory tracks `topicsDiscussed` and `approachesUsed`, but not what the student LEARNED. The system doesn't know that "we taught sensory threading in turn 4" or "the student can now identify show-vs-tell independently."

**Target State**: A teaching engine that tracks student capabilities, sequences instruction based on prerequisites, and references prior learnings.

**Concrete before/after:**

CURRENT:
```
Turn 4 coach: "Consider using a sensory detail to bridge these scenes."
Turn 8 coach: "The transition could benefit from a concrete detail shared between
both settings — something the reader can see or hear in both places."
```
(Repeating the same advice because there's no record it was already taught)

TARGET:
```
Turn 4 coach: [Teaches sensory threading technique]
Turn 8 coach: "Remember the sensory threading you used for the lab-to-hospital
transition? The same principle applies here — P4 to P5 needs a bridge too. But
this time, instead of smell, think about what SOUND exists in both places. You've
already proven you can do this."
```

**Root cause**: Missing data structure. `CoachingSessionMemory.topicsDiscussed` records topics, not capabilities. There's no `techniquesTaught: Array<{ technique: string; turnNumber: number; studentDemonstrated: boolean }>` field.

**Impact**: Without capability tracking, the system teaches the same thing twice (wasted turns) and can't build on prior instruction (no scaffolding). The student feels like they're starting over each turn.

**Existing infrastructure that helps**:
- `LearningStyleObservations` → already tracks HOW the student learns, can be extended for WHAT
- `CoachingQualitySignals.revisionSophistication` → partial capability signal
- `PatternInsight` → meta-observations that could track learned techniques
- `ImprovementPhase.dimensionPhases[]` → per-dimension phase tracking, could be extended to per-capability

**Implementation complexity**: MEDIUM. New type on session state + LLM extraction at end of each turn.

---

### GAP-3: No Workshop Interaction Model

**Current State**: Every interaction follows the same pattern: student asks question → system responds. There's no structured interaction mode for brainstorming, drafting, evaluating, or iterating.

**Target State**: Multiple interaction modes — brainstorm (divergent exploration), draft-workshop (sentence-level crafting), evaluate (comparative reading), and revise-together (real-time revision companioning).

**Concrete before/after:**

CURRENT:
```
Student: "Help me brainstorm a different opening"
Coach: "Your current opening makes a philosophical claim. Consider starting with
a specific moment instead — maybe the pawnshop scene where you first saw the
diamond. Starting in media res would ground the reader immediately."
```
(Single response, done. No iterative exploration.)

TARGET:
```
Student: "Help me brainstorm a different opening"
Coach: [Enters BRAINSTORM mode]
"Let me give you three different entry points to consider. I want you to react
to each one — not whether it's 'good' but whether it FEELS like you. Ready?

1. Start in the pawnshop: 'The fluorescent light caught the stone's face as I
   turned it—' (puts the reader in the scene)
2. Start with the question: 'I didn't know what my grandfather left me until—'
   (pulls the reader forward)
3. Start with the contrast: 'The essay prompt said 650 words. My grandfather's
   entire estate fit in an envelope.' (sets up the scale mismatch)

Which one makes you FEEL something? Don't think about which is 'best.'"
```

**Root cause**: Missing mode awareness in the routing system. Stage 2 routes to 4 rules based on focus area (`voice`, `paragraph`, `overview`, `inline_edit`). None of these represent interaction MODE. "Help me brainstorm" and "What's wrong with my opening" both route to `l6_coaching_paragraph` if they focus on P1.

**Impact**: The system treats every turn as a coaching Q&A. It can't enter a multi-turn workshop mode where turns build on each other toward a specific creative output.

**Existing infrastructure that helps**:
- `conversationType` in Stage 1 output (coaching_question / revision_discussion / meta_conversation / general_inquiry) — this is the closest signal, but too coarse
- `nextFocus` in session memory → could be extended to include mode
- `EssayTrajectory.plausiblePaths[]` → natural source for brainstorm alternatives
- `DistinctivenessSignature` → what to preserve during brainstorming

**Implementation complexity**: HIGH. Requires: (1) mode detection in Stage 1 or Stage 2, (2) mode-specific prompt templates, (3) mode-specific session state, (4) mode transition logic, (5) mode-specific output formats.

---

### GAP-4: Finding-Coaching Disconnect

**Current State**: FindingStore contains rich, graduated findings (hypothesis→developing→confirmed→deepened) with coaching values (critical/high/medium/contextual/diagnostic), evidence, deepening potential, and relationships. But the coaching service uses them minimally:

```typescript
// coachingService.ts:2360-2376
buildFindingCoachingContext(coordinator: EssayProfileCoordinator): string {
  // Takes top 5 by coaching value, globally (not scoped to student's focus)
  // Injects as text block with "reference by [F] label when discussing relevant topics"
}
```

**Target State**: Findings drive coaching focus. The system identifies which findings are most relevant to the student's current question, presents them as coaching opportunities, and tracks which findings have been discussed/addressed.

**Concrete before/after:**

CURRENT:
```
=== KEY FINDINGS ===
F1 [confirmed/critical] P2: Voice shifts from reflective to performative mid-paragraph
F2 [developing/high] P1S3: Diamond metaphor introduced abstractly without grounding
F3 [confirmed/high] P3-P4: Transition relies on temporal marker without sensory bridge
F4 [hypothesis/medium] P5: Closing resolves too neatly given the complexity established
F5 [developing/contextual] P1S1: Opening sentence length creates pace mismatch

(Coach MAY reference these. Often doesn't. Never prioritizes by relevance to current question.)
```

TARGET:
```
Student asks about P3-P4 transition →
System identifies F3 as directly relevant (P3-P4, confirmed, high coaching value) →
System also pulls F1 (voice shift in P2 may affect transition quality) via connection graph →
Coach response is GROUNDED in these findings:

"Let's look at what's happening at the P3-P4 boundary. [F3] The transition currently
relies on 'Three months later' — a temporal marker that tells the reader time passed
but doesn't help them FEEL the shift. And there's a related issue: [F1] your voice
in P2 shifts from your natural reflective tone to something more performative right
before this transition, which means the reader is already slightly unmoored by the
time they hit P4..."
```

**Root cause**: The finding injection is (a) global not scoped, (b) text-block not structured, (c) softly suggested not required. The coaching philosophy prompt mentions findings once ("reference by [F] label") but doesn't build the coaching strategy around them.

**Impact**: The most expensive analysis output (findings are produced by Sonnet during walk, deep dives, and crystallization — costing $0.15-0.50) is underutilized in the cheapest, highest-frequency interaction (coaching turns at $0.03).

**Existing infrastructure that helps**:
- `FindingStore.getByScope(paragraph)` → scoped finding retrieval exists
- `FindingStore.getDeepDiveCandidates()` → high-value findings with deepening potential
- `FindingStore.getDepthTrees()` → finding relationships and depth chains
- `buildAnnotationFindingContext()` → paragraph-scoped finding formatting already exists
- Connection graph → finding-to-finding relationships via shared connections

**Implementation complexity**: LOW-MEDIUM. Mostly prompt engineering + scoped finding retrieval. No new data structures needed.

---

### GAP-5: No Revision Companioning

**Current State**: When the student edits their essay, the `editUnderstandingService.ts` produces a rich `EditUnderstanding` (significance, change type, apparent purpose, profile impact, scope recommendation). But this is consumed by the RE-ANALYSIS pipeline, not the coaching service. The coach sees only:

- `recentEditContext`: a brief text summary injected via `editStrategyContext`
- `editStrategyContext`: abandoned approaches from version tracker

The coach never sees the nuanced "this edit strengthened the voice but broke a thematic connection."

**Target State**: Revision companioning where the coach recognizes what the student tried, what it accomplished, and what it may have broken — in real-time.

**Concrete before/after:**

CURRENT:
```
[Student edits P3, changing the metaphor from "diamond" to "glass"]
Coach: "I see you've made some changes to paragraph 3. How can I help?"
```

TARGET:
```
[Student edits P3]
Coach: "I see you changed the diamond to glass. That's interesting — glass is
more fragile, more transparent. It shifts the metaphor from 'pressure creates
beauty' to something like 'clarity is delicate.' But check P1S3 where you wrote
'faceted as any gem' — that phrase still assumes diamond. And the title 'Under
Pressure' might need rethinking too.

The glass metaphor is actually more aligned with what you told me earlier about
wanting to show vulnerability. Want to explore what the essay looks like if we
commit fully to glass?"
```

**Root cause**: The `EditUnderstanding` service output flows to `reanalysisOrchestrator.ts`, not to `coachingService.ts`. No pipe exists between edit understanding and coaching context.

**Impact**: Students revise alone. They make changes, then ask the coach "does this work?" instead of the coach being an active companion in the revision process.

**Existing infrastructure that helps**:
- `EditUnderstandingService` (1417 lines) produces rich `EditUnderstanding` with `apparentPurpose`, `profileImpact`, `scopeRecommendation` → just needs to be piped to coaching
- `VersionRecord.approaches[]` and `editStrategy` → editing journey context
- Connection graph → can identify which connections are broken by an edit
- `editStrategyContext` parameter already exists on `processCoachingTurn` → just underutilized

**Implementation complexity**: MEDIUM. The analysis exists. Need: (1) pipe EditUnderstanding to coaching, (2) format it for the coaching prompt, (3) teach the coach to use it.

---

### GAP-6: No Cross-Essay Intelligence

**Current State**: Each essay starts from zero. `EssayProfile` has no reference to other essays by the same student. `CoachingSessionMemory` is per-session, not per-student.

**Target State**: The system knows "this student tends to use abstract openings across all their essays" and "they learned sensory threading on their Common App — can apply it to their Stanford supplement."

**Root cause**: `EssayProfile` is per-essay. No student-level profile exists. `ConversationInsight.durability = 'student_durable'` is defined in the type system but has no cross-essay persistence mechanism.

**Impact**: A student writing 8+ supplemental essays gets treated as a brand-new writer every time. Techniques taught on one essay can't be referenced on another.

**Existing infrastructure that helps**:
- `ConversationInsight.durability = 'student_durable'` type already exists
- `preferences` with `preferenceDurability = 'general'` → designed for cross-essay persistence
- `characterRevelation.revealedQualities`, `writerPortrait`, `intellectualFingerprint` → student-level data that should persist

**Implementation complexity**: HIGH. Requires student-level profile store, cross-essay insight persistence, portfolio-aware context assembly.

---

### GAP-7: Limited Mode Awareness

**Current State**: Stage 1 produces `conversationType` with 4 values (coaching_question, revision_discussion, meta_conversation, general_inquiry). Stage 2 routes based on FOCUS AREA (which paragraph/dimension), not INTERACTION MODE (what kind of help the student wants).

**Target State**: System recognizes at least 6 distinct interaction modes:
1. **Coaching** (current default) — "What's wrong with X?"
2. **Brainstorm** — "Help me think about alternatives for X"
3. **Draft Workshop** — "Help me write the sentence that does X"
4. **Evaluate** — "Which version is better, A or B?"
5. **Revision Companion** — "I'm working on changing X, guide me"
6. **Emotional Support** — "I'm overwhelmed / stuck / frustrated"
7. **Gathering** — "Let me tell you about..."  (from FORGE_PLAN.md)

**Root cause**: Stage 2 routing is entirely about WHERE in the essay (paragraph/voice/overview), never about HOW to interact.

**Impact**: "Help me brainstorm" and "What's wrong with my opening" both produce the same kind of response — an analytical coaching response. The system has one interaction gear.

**Implementation complexity**: MEDIUM. Mode detection can be added to Stage 1 or Stage 1.5. Mode-specific behavior requires prompt variants, not new infrastructure.

---

### GAP-8: No Voice Preservation

**Current State**: VoiceIdentity and VoiceMap provide deep voice analysis. But the coaching prompt doesn't systematically prevent the coach from suggesting changes that override the student's authentic voice. The prompt says "Respect both [intelligence and intentions]" but doesn't provide the voice profile to the coach in a way that creates a protective boundary.

**Target State**: The coach knows what the student's voice IS and actively protects it during suggestions.

**Concrete before/after:**

CURRENT:
```
Student: "How can I make the ending stronger?"
Coach: "Try ending with a powerful declaration: 'In that moment, I understood
that true strength comes from vulnerability.'"
(Generic strong-ending advice that sounds nothing like this student)
```

TARGET:
```
Student: "How can I make the ending stronger?"
Coach: "Your voice throughout this essay is understated — you show things without
naming them. That's your strength. So your ending shouldn't be a declaration.
What if the last sentence did what P2S3 does — just described what happened, and
let the reader feel the weight? Something that stays in your register: quiet,
observational, the meaning between the lines."
```

**Root cause**: Voice context IS assembled for `l6_coaching_voice` routing rule, but for `l6_coaching_paragraph` and `l6_coaching_overview`, voice is a compact summary (signature + register + distinctive patterns). The coach doesn't have enough voice data to protect it systematically when routing to non-voice rules.

**Impact**: The coach may inadvertently suggest changes that make the essay sound more "polished" but less like the student. This is an AO red flag.

**Existing infrastructure that helps**:
- VoiceIdentity.authenticVsPerformed → exactly the data needed for voice protection
- VoiceMap.shifts[].intentionality → knows which shifts are intentional
- VoiceMap.codeSwitching → cultural voice patterns to protect
- Already assembled for `l6_coaching_voice` route

**Implementation complexity**: LOW. Include voice protection context in all coaching routes, not just voice-specific.

---

### GAP-9: No Interaction Mode Transition Management

**Current State**: Every turn is treated independently. There's no concept of "we're in the middle of a brainstorming session" or "we were workshopping P3S2 and the student went on a tangent."

**Target State**: Mode transitions are tracked and managed. The system knows when to gently redirect ("We were working on your P3 transition — want to finish that before we move to voice?") and when to follow the student's lead.

**Root cause**: No mode state. `CoachingSessionMemory` tracks topics and approaches but not the current interaction mode.

**Impact**: Multi-turn workshops dissolve because the system doesn't remember "we're in the middle of brainstorming alternatives for the opening." Every turn is a fresh start.

**Implementation complexity**: LOW-MEDIUM. Mode field on session state + transition detection logic.

---

### GAP-10: EssayUnderstanding Prose Not Used in Coaching

**Current State**: `EssayUnderstanding.prose` is a rich, 300-700 word synthesized narrative ("the system's developing understanding of the WHOLE essay... reads like expert literary analysis"). But `buildProfileContextText()` doesn't include it. The coaching prompt gets the structured holistic sections but not the synthesized narrative.

**Target State**: The coach has access to the rich prose understanding to ground its responses in a holistic reading.

**Root cause**: `buildProfileContextText()` (line 1173) assembles: North Star summary, critical concerns, assembled sections, recent insights. It doesn't include `profile.essayUnderstanding.prose`.

**Impact**: The coach has the structured data but not the narrative synthesis. It has to reconstruct the holistic reading from structured sections rather than having it pre-synthesized.

**Existing infrastructure**: `EssayUnderstanding` already exists and is populated. Just needs to be included in the coaching context.

**Implementation complexity**: TRIVIAL. Add `essayUnderstanding.prose` to `buildProfileContextText()`.

---

## Section 3: Infrastructure Inventory

### 3.1 Profile Coordinator (`essayProfileManager.ts`, 2805 lines)

**Key function signatures for Conversator:**

```typescript
// Apply conversation insight → dispatches to InsightMutator
applyConversationInsight(insight: ConversationInsight): void
// insight: { id, timestamp, sourceText, category, emotionalValence, studentConfidence,
//            explicitness, scopeCertainty, novelty, scope, durability, essayVersion,
//            partiallySupersedes? }

// Store pattern insights (meta-observations about coaching process)
addPatternInsight(pattern: PatternInsight): void
// pattern: { id, pattern, evidence[], implication, firstObservedAt, lastObservedAt, instanceCount }

// Update improvement phase (phase transitions)
updateImprovementPhase(phase: ImprovementPhase): void

// Access finding lifecycle
getFindingStore(): FindingStore

// Direct sentence understanding update (used by reinterpretation reverse-propagation)
applySentenceUnderstandingDirect(paragraphIndex: number, sentenceIndex: number,
  partial: Partial<SentenceUnderstanding>): void
```

**Cost per call**: 0 (no LLM — pure data management)
**Reuse potential**: HIGH — the Conversator will use all of these as-is.
**Adaptations needed**: May need new methods for capability tracking and mode state if those are added to the profile.

### 3.2 Profile Router (`profileRouter.ts`, 2910 lines)

**Key function signatures:**

```typescript
// Assemble context for any routing rule
assembleContext(profile: EssayProfile, request: ContextRequest): AssembledProfileContext
// request: { rule, paragraphIndex?, sentenceIndex?, searchTags?, tokenBudget?,
//            editContext?, requiredContext?, contextPriorities? }
// returns: { sections: ProfileSection[], estimatedTokens, appliedRule, droppedSections }

// Declared context system for custom needs
assembleDeclaredContext(profile: EssayProfile, request: DeclaredContextRequest): AssembledProfileContext
// request: { purpose, required: ContextSectionSpec[], desired: ContextSectionSpec[],
//            tokenBudget, readingStrategy?, analysisFocus? }
```

**Cost per call**: 0 (no LLM)
**Reuse potential**: HIGH — the Conversator will need new routing rules but can use the existing infrastructure.
**Adaptations needed**: New routing rules for craft-workshop, brainstorm, and revision-companion modes. The `DeclaredContextRequest` system is designed for exactly this extensibility.

### 3.3 FindingStore (`findingStore.ts`, 460 lines)

**Key function signatures:**

```typescript
getActive(): Finding[]
getActiveSortedByCoachingValue(): Finding[]
getByScope(paragraph: number): Finding[]
getByCoachingValue(value: FindingCoachingValue): Finding[]
getByDimension(dimension: string): Finding[]
getDeepDiveCandidates(): Finding[]
getDepthTrees(): Array<{ root: Finding; descendants: Finding[] }>
getSupersessionChain(id: string): Finding[]
updateMaturity(id, newMaturity, reasoning, trigger, supersedes?): void
updateCoachingValue(id, value): void
toContextSummary(): string
```

**Cost per call**: 0 (no LLM)
**Reuse potential**: HIGH — rich querying API that the Conversator's craft engine should use to identify coaching opportunities.
**Adaptations needed**: May want a `getByCoachingOpportunity()` method that combines scope + coaching value + deepening potential.

### 3.4 FindingContextBuilder (`findingContextBuilder.ts`, 362 lines)

**Key function signatures:**

```typescript
buildFindingContext(store, options?): string
// options: { maxActiveFindings?, includeSuperseded?, includeEvidence?,
//            includeLineage?, includeDeepeningPotential?, scopeFilter?, minCoachingValue? }

buildCompactFindingContext(store): string
buildParagraphFindingContext(store, paragraphIndex): string
buildAnnotationFindingContext(store, paragraphIndex): string
deriveSentenceParticipation(paragraph, sentence, store): { findingRefs, significance, tags, primaryFunction }
```

**Cost per call**: 0
**Reuse potential**: HIGH for craft engine — `buildParagraphFindingContext()` and `deriveSentenceParticipation()` are exactly what the craft engine needs for targeted coaching.
**Adaptations needed**: May need a new `buildCraftOpportunityContext()` that formats findings as actionable craft challenges.

### 3.5 InsightMutator (`insightMutator.ts`, 380 lines)

**Key function signatures:**

```typescript
applyInsight(profile, insight): MutationType[]
markPartiallySuperseded(profile, insightId, supersededBy): void
getInsightsByCategory(profile, category): ConversationInsight[]
invalidateEphemeralInsights(profile, editedLocations): void
addPatternInsight(profile, pattern): void
validate(profile): string[]
```

**Cost per call**: 0
**Reuse potential**: HIGH — all insight application flows through this.
**Adaptations needed**: The Conversator may need new insight categories beyond the current 8 (e.g., `technique_learned`, `mode_request`, `brainstorm_preference`). Currently the 8-category taxonomy is hardcoded as a union type.

### 3.6 EditUnderstandingService (`editUnderstandingService.ts`, 1417 lines)

**Key function signature:**

```typescript
async analyzeEdit(profile, oldText, newText, editDiff, router): Promise<EditUnderstandingResult>
// Returns: { output: EditUnderstandingOutput, cost: LayerCost, trivialFilter: { wasFiltered, reason? } }
// EditUnderstandingOutput includes: significance, changeType, apparentPurpose, profileImpact,
//   scopeRecommendation, stalenessEffects[]
```

**Cost per call**: ~$0.001 (Haiku filter) + ~$0.02-0.05 (Sonnet understanding, when non-trivial)
**Reuse potential**: MEDIUM — the revision companion mode needs access to EditUnderstanding output, but currently it only flows to the re-analysis pipeline.
**Adaptations needed**: Pipe the output to coaching service for revision companion mode. The data format is already suitable.

### 3.7 LLM Call Infrastructure (`claude.ts`, 808 lines)

**Key function signatures:**

```typescript
async callClaude<T>(input: string | ClaudeMessageInput | ClaudeSimpleInput,
  options?: ClaudeCallOptions): Promise<ClaudeResponse<T>>
// ClaudeSimpleInput: { model, systemPrompt, userPrompt, maxTokens, temperature,
//                      useJsonMode, cacheSystemPrompt?, timeoutMs? }

async callClaudeWithRetry<T>(input, options?, maxRetries?): Promise<ClaudeResponse<T>>
async callClaudeWithFallback<T>(input, options?): Promise<ClaudeResponse<T> | null>

function calculateCost(usage: ClaudeResponse['usage'], model?: string): number
```

**Pricing constants** (from `claude.ts`):
- Sonnet (`claude-sonnet-4-5-20250929`): $3.00 input, $15.00 output, $0.30 cache read, $3.75 cache write per MTok
- Haiku (`claude-haiku-4-5-20251001`): $1.00 input, $5.00 output, $0.10 cache read, $1.25 cache write per MTok

**Reuse potential**: DIRECT — all Conversator LLM calls will use `callClaude()` with `cacheSystemPrompt: true`.
**Adaptations needed**: None.

### 3.8 Connection Graph (`connectionGraph.ts` + profile types)

**Already on the profile:**
```typescript
profile.connections.all: Connection[]        // All connections with status tracking
profile.connections.graphSummary: string      // LLM prose about connection architecture
profile.connections.structuralIslands: number[] // Paragraphs with no connections
profile.index.connectionGraph: Array<{...}>  // Compact routing view
```

**Reuse potential**: HIGH — the craft engine should use connection data to identify structural craft opportunities. If a connection is `strengthCategory: 'tentative'`, that's a craft teaching opportunity ("how to strengthen this connection").

### 3.9 Version Tracker / Snapshot System

**Already available:**
```typescript
profile.editHistory: VersionRecord[]    // Per-version change logs with intent annotations
// VersionRecord includes: version, snapshotText, analyzedAt, changes[],
//   insightsSinceLastVersion, lightTouchAdjustments, approaches?, editStrategy?
```

**Reuse potential**: MEDIUM — revision companion needs edit history context.

---

## Section 4: Constraints & Principles

### 4.1 Hard Constraints (from CLAUDE.md)

1. **No `any` types** without documentation. Full TypeScript strict mode.
2. **No silent failures**. Every function that can fail must handle failures explicitly.
3. **No degraded fallbacks**. If a service fails, return a clear error. Never return hardcoded results.
4. **Quality over cost for AI calls**. Full prompts, no compression. Use prompt caching.
5. **Haiku for diagnosis, Sonnet for teaching**. Speed where it matters, quality where it counts.
6. **Atomic credit deduction**. Prevent race conditions in billing.
7. **Full data preservation**. Never compress or truncate research data.
8. **Test-driven development**. Write tests alongside implementation.
9. **Never push to main**. All changes through feature branches and PRs.

### 4.2 LLM-First Design Rules (from feedback_llm-first-design.md)

| Rule | Constraint for Conversator |
|------|---------------------------|
| Rule 1: LLM owns judgment, system tracks | The craft engine selects techniques, not a deterministic algorithm. The system stores which techniques were taught. |
| Rule 2: Never discard paid output | Every Sonnet call's output must be stored and reusable. If the craft engine analyzes a sentence, that analysis persists. |
| Rule 3: No closed taxonomies for LLM perception | Interaction modes should be soft routing hints, not rigid categories. The LLM should be able to blend modes. |
| Rule 4: No regex quality enforcement | Don't validate coaching output against regex patterns for "quality." |
| Rule 5: Soft guidance over hard blocklists | Technique suggestions should be weighted preferences, not rigid restrictions. |
| Rule 6: System infrastructure for bookkeeping | Track capability, mode state, technique history — but let the LLM decide what to do with them. |

### 4.3 Layer Separation (Understanding / Analysis / Feedback)

The profile enforces strict layer separation:
- **Understanding** (descriptive): what the essay IS — `SentenceUnderstanding`, holistic sections
- **Analysis** (evaluative): how well it works — `SentenceAnalysis`, paragraph effectiveness
- **Feedback** (prescriptive): what to do about it — EPHEMERAL, generated fresh per context

The Conversator must maintain this separation. The craft engine produces FEEDBACK (ephemeral techniques/suggestions). It reads from understanding and analysis but doesn't modify them. Profile modifications happen through the existing mutator system.

### 4.4 Cost Constraints

**Hard ceiling**: $0.06 per coaching turn.

**Current baseline** (from code analysis):
| Stage | Model | Typical Cost |
|-------|-------|-------------|
| S1 Insight Extraction | Haiku | ~$0.001 |
| S1.5 Cognitive Assessment | Haiku | ~$0.001 |
| Pattern Detection (conditional) | Haiku | ~$0.003 |
| S3 Coaching Response (full) | Sonnet | ~$0.015-0.025 |
| S3 Coaching Response (minimal) | Haiku | ~$0.001 |
| S4 Profile Deepening (conditional) | Sonnet | ~$0.010-0.015 |
| **Total (typical full turn)** | | **~$0.025-0.035** |

**Budget for Conversator additions**: $0.06 - $0.035 = ~$0.025 available.

At Sonnet pricing (~$0.02 per call with cached system prompt), that's approximately ONE additional Sonnet call per turn. Two additional Haiku calls would cost ~$0.004, leaving room for one Sonnet + two Haiku additions.

**Implication**: The Conversator cannot add multiple Sonnet calls per turn. It must be architecturally efficient:
- Craft expertise selection should be built into the Stage 3 prompt (not a separate call)
- OR use a dedicated craft call that REPLACES the current Stage 3 (not in addition to it)
- Technique selection can use Haiku (~$0.001)
- Capability tracking can be deterministic (no LLM)

### 4.5 What's Working Well (MUST NOT Regress)

1. **Stage 1 insight extraction**: Reliable 8-category classification with probabilistic scope. 4-level defensive parsing handles edge cases.

2. **Stage 1.5 cognitive assessment**: Free-prose assessment produces nuanced, actionable reads ("they're performing understanding"). The `responseIntensity` routing (full/brief/minimal) saves money and improves quality.

3. **Confusion escalation ladder**: Per-topic confusion tracking with progressive approaches (different angle → break down → acknowledge difficulty) is effective and cheap.

4. **Prompt caching architecture**: Static coaching philosophy is cached (~$0.30/MTok instead of $3.00/MTok for Sonnet reads). This MUST be maintained — any new system prompts should follow the same static-cached / dynamic-user split.

5. **Anti-repetition context**: When the student returns to a topic, prior coach responses are summarized and injected with "DO NOT rephrase these points." This prevents the most common coaching quality failure.

6. **Session arc awareness**: Early/middle/late session calibration ("ask more than tell" early, "consolidate" late) produces natural conversation flow.

7. **Phase-aware coaching**: The improvement phase (Foundation→Distinction) correctly scopes feedback without being overly rigid. The coaching lens is LLM-generated prose, not a deterministic filter.

8. **Finding-based reinterpretation**: Stage 4 reinterpretation evaluation correctly supersedes findings via FindingStore and reverse-propagates to sentence understanding. This is well-engineered and should not be modified.

9. **Edit strategy context**: Tracking abandoned approaches and injecting "do NOT suggest these again" prevents frustrating repetition during revision cycles.

10. **Profile router's DeclaredContextRequest**: The extensibility mechanism for custom context needs is exactly what the Conversator needs. It supports required/desired sections with priority ordering, token budgets, and reading strategies.
