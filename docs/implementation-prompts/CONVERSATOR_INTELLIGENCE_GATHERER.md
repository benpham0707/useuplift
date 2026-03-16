# Prompt: The Conversator as Intelligence Gatherer

> **Purpose**: Build the conversational system that extracts what automated analysis cannot — student intent, personal meaning, contextual background, and creative direction — and feeds it into the Essay Intelligence profile as first-class data that shapes all downstream understanding, analysis, and feedback.

---

## The Core Insight

The observation elimination audit revealed a fundamental design flaw: **we were guessing what students intend**. The `inferredIntents` array tried to divine authorial strategy from text alone — an epistemologically suspect act. Intent is subjective, personal, and often invisible from the text surface. A sentence that reads as "establishing setting" might be the student's attempt to "create emotional distance before a revelation." Only the student knows.

The fix isn't better inference. It's **asking**. The Conversator becomes our primary intelligence-gathering mechanism for everything the system can't derive from text analysis alone. This isn't a nice-to-have chat feature — it's a structural component of the analysis pipeline, as essential as the walk or holistic synthesis.

---

## What The Conversator Gathers (That Analysis Cannot)

### 1. Student Intent (Replaces `inferredIntents`)

**What we're replacing**: The L3 walk's `inferredIntents: ObservationEntry[]` — system-guessed authorial strategy per sentence.

**What we're building**: A student-declared intent model where the student tells us what they're trying to do, and the system integrates this as ground truth (with tension detection when intent contradicts text effect).

**How it works in conversation**:
- The Conversator asks targeted questions about specific passages: *"In your second paragraph, you shift from describing the lab to talking about your grandmother. What were you going for with that transition?"*
- Student responds: *"I wanted to show that my interest in science isn't just academic — it's tied to watching her fight cancer."*
- This response becomes a `DeclaredIntent` entry anchored to P2, stored in the profile, and visible to ALL downstream layers.

**What the system does with declared intent**:
- L3.5 Analysis sees declared intent alongside observed function → can evaluate whether the TEXT achieves what the student WANTS (the gap between intent and effect is the most valuable feedback signal)
- L5 Feedback can say: *"You want this transition to connect science to your grandmother's experience, but the shift feels abrupt because there's no bridging image. Consider..."*
- L6 Coaching can track whether edits are closing the intent-effect gap

**Critical design rule**: Declared intent is NOT automatically "correct." If a student says "I meant this to be funny" but the text reads as somber, the system flags TENSION — it doesn't blindly accept the intent or dismiss it. Both the student's intent AND the system's reading coexist. The gap IS the insight.

### 2. Personal Context & Background

**What analysis misses**: Why the student chose this topic. What the experience meant to them. What they're afraid of revealing. What they think admissions officers want to hear vs. what's actually true.

**What the Conversator extracts**:
- **Emotional relationship to topic**: *"How do you feel about this experience now, looking back?"* → reveals whether the essay's emotional register matches the student's actual feelings
- **Unwritten context**: *"Is there anything about this situation you deliberately left out of the essay?"* → reveals self-censorship, which is often the most interesting material
- **Authenticity signals**: *"When you describe the moment you decided to change your approach — did that really happen that way, or is that how you wish it happened?"* → separates genuine reflection from performance
- **Audience awareness**: *"Who are you imagining reading this?"* → reveals whether they're writing for themselves, for an AO, for a parent, etc.

**Storage**: `PersonalContext` entries in the profile, tagged with durability (`essay_durable` for topic-specific context, `student_durable` for identity-level context that persists across essays).

### 3. Creative Direction & Preferences

**What analysis misses**: The student's aesthetic sensibility. Whether they WANT to write lyrical prose or prefer direct, clean sentences. Whether a stylistic choice is intentional or accidental.

**What the Conversator extracts**:
- **Voice preferences**: *"Do you prefer the way this paragraph sounds, or do you feel like you're forcing a style?"* → distinguishes authentic voice from performed voice
- **Structural choices**: *"You chose to start with the ending and work backwards. What made you want to structure it that way?"* → reveals whether structure is deliberate or default
- **Revision priorities**: *"If you could only fix one thing about this essay, what would it be?"* → reveals what the student already knows is wrong (often more accurate than analysis)

### 4. Essay-Specific Knowledge

**What analysis misses**: Domain expertise that makes the essay's content choices legible.
- A student writing about competitive debate may use technical terms that read as jargon to the system but are precise to the community
- A student writing about a cultural practice may use metaphors that are conventional in their tradition but novel to a Western reader
- A student writing about a research project may compress methodology that the system flags as unclear but is standard in their field

**What the Conversator extracts**: Enough domain context to calibrate analysis. Not a full tutorial — just enough to distinguish intentional precision from accidental obscurity.

---

## Architecture: How The Conversator Feeds The Profile

### New Type: `StudentDeclaredData`

```typescript
interface StudentDeclaredData {
  // Replaces inferredIntents entirely
  declaredIntents: DeclaredIntent[];

  // Personal context that shapes analysis calibration
  personalContext: PersonalContextEntry[];

  // Creative direction and preferences
  creativeDirection: CreativeDirectionEntry[];

  // Domain knowledge that calibrates analysis
  domainContext: DomainContextEntry[];

  // Questions the system still wants answered
  openQuestions: ConversatorQuestion[];
}

interface DeclaredIntent {
  id: string;
  scope: IntentScope;  // paragraph, sentence, sentence_group, essay_level
  studentStatement: string;  // Their exact words
  synthesizedIntent: string;  // System's clean summary of what they mean
  textAlignment: 'aligned' | 'tensioned' | 'contradicted' | 'unverifiable';
  alignmentDetail: string;  // How intent relates to what the text actually does
  confidence: number;  // How confident the student seemed (from conversation cues)
  source: {
    conversationTurnId: string;
    extractedAt: string;  // ISO timestamp
    extractionMethod: 'direct_question' | 'volunteered' | 'inferred_from_edit' | 'inferred_from_reaction';
  };
  supersedes?: string;  // ID of prior declared intent this replaces
  durability: 'draft_durable' | 'essay_durable';
}

interface IntentScope {
  type: 'sentence' | 'sentence_group' | 'paragraph' | 'cross_paragraph' | 'essay_level';
  paragraph?: number;
  sentences?: number[];
  paragraphs?: number[];
}

interface PersonalContextEntry {
  id: string;
  category: 'emotional_relationship' | 'unwritten_context' | 'authenticity_signal' | 'audience_awareness' | 'life_context' | 'revision_history';
  content: string;  // What the student revealed
  scope?: IntentScope;  // Where it's relevant (null = essay-wide)
  analysisImplication: string;  // How this should change analysis calibration
  source: { conversationTurnId: string; extractedAt: string };
  durability: 'draft_durable' | 'essay_durable' | 'student_durable';
}

interface CreativeDirectionEntry {
  id: string;
  dimension: 'voice' | 'structure' | 'tone' | 'pacing' | 'imagery' | 'specificity' | 'emotional_register';
  preference: string;  // What they want
  currentAlignment: 'achieving' | 'partially' | 'not_yet' | 'unknown';
  alignmentDetail: string;
  source: { conversationTurnId: string; extractedAt: string };
  durability: 'draft_durable' | 'essay_durable';
}

interface DomainContextEntry {
  id: string;
  domain: string;  // e.g., "competitive debate", "Hmong cultural practices", "synthetic biology"
  knowledge: string;  // What the system needs to know
  calibrationEffect: string;  // How this changes analysis (e.g., "terms X and Y are precise, not jargon")
  scope?: IntentScope;
  source: { conversationTurnId: string; extractedAt: string };
  durability: 'essay_durable';
}
```

### New Type: `ConversatorQuestion`

The system generates questions it wants the Conversator to ask. These come from analysis gaps, tension points, and understanding holes.

```typescript
interface ConversatorQuestion {
  id: string;
  question: string;  // The actual question to ask
  rationale: string;  // Why the system wants this answered (internal, not shown to student)
  priority: 'critical' | 'high' | 'medium' | 'low';
  scope?: IntentScope;  // Where in the essay this relates to

  // What generated this question
  source: 'walk_gap' | 'tension_detected' | 'analysis_uncertainty' | 'coaching_probe' | 'edit_ambiguity' | 'holistic_gap';
  sourceDetail: string;  // e.g., "P3 function unclear — could be scene-setting or foreshadowing"

  // Lifecycle
  status: 'pending' | 'asked' | 'answered' | 'withdrawn';
  answeredBy?: string;  // DeclaredIntent or PersonalContext ID that resolved this
  askedInTurn?: string;  // conversation turn ID when asked

  // Timing guidance
  askWhen: 'next_opportunity' | 'when_discussing_paragraph' | 'when_student_raises_topic' | 'only_if_student_stalls';
}
```

### Question Generation: Where Questions Come From

Questions are generated at specific pipeline moments — NOT as a separate pass, but as a natural byproduct of analysis:

1. **L3 Walk** → When the walk encounters a sentence whose function is ambiguous (confidence < 0.7 on primaryFunction), it generates a question: *"What were you going for in this sentence?"*

2. **L3.75 Holistic Synthesis** → When synthesizing voice/emotion/narrative and finding gaps or contradictions, generates questions: *"Your voice shifts dramatically between P2 and P3 — is that intentional?"*

3. **L3.5 Analysis Pass** → When scoring reveals a large gap between quality and apparent effort (high craft but low impact, or vice versa), generates questions: *"This paragraph is beautifully written but doesn't seem to advance your main point. What role does it play for you?"*

4. **L4 Crystallizer** → When findings contradict each other or when a hypothesis can't be confirmed without student input: *"The essay seems to argue X in P1 but Y in P4. Are you aware of this tension?"*

5. **Edit Detection** → When a student makes an edit that the system can't interpret: *"You removed the detail about your father's reaction. Was that because it wasn't important, or because it was too personal?"*

6. **Coaching Turns** → When the student says something that opens a new line of inquiry: *"You mentioned feeling conflicted about this. Can you say more about what the conflict is?"*

### How Questions Reach The Student

The Conversator doesn't dump questions. It weaves them into natural conversation:

**Priority-based insertion**: Critical questions get asked directly. Low-priority questions wait for natural openings.

**Context-sensitive timing**: A question about P3 gets asked when the conversation is already discussing P3, not as a non-sequitur.

**Conversation-aware phrasing**: The raw question *"What is the intended function of the transition in P2S4?"* becomes *"I noticed the moment where you shift from the lab to your grandmother. That feels like a really important pivot — what were you hoping the reader would feel in that transition?"*

**Batching and prioritization**: If 8 questions are pending, the Conversator selects the 1-2 most valuable for the current conversation context. Others wait.

**Organic extraction**: Sometimes the best way to get an answer isn't to ask a question — it's to make an observation that invites the student to elaborate. *"The ending feels very different from the opening — almost like two different writers."* Student: *"Yeah, I wrote the ending first and then built up to it."* → This answers a pending structural-intent question without ever asking it.

---

## Pipeline Integration: How Declared Data Flows

### Into L3.5 Analysis

The analysis pass currently sees observation arrays as context. With the new model:

```
SENTENCE UNDERSTANDING FOR P2S4:
  Primary Function: Transitions from technical description to personal narrative
  Significance: pivotal

  STUDENT-DECLARED INTENT: "I wanted to show that my interest in science
  isn't just academic — it's tied to watching her fight cancer."

  ALIGNMENT: tensioned — The transition is abrupt; the connection between
  lab work and grandmother isn't made explicit in the text. The student's
  intent is clear but the text doesn't yet achieve it.

  Findings:
  [F3] The transition lacks a bridging image or conceptual link (developing)
  [F7] The emotional register shifts without preparation (confirmed)
```

The analysis now has the MOST VALUABLE signal possible: the gap between what the student WANTS and what the text DOES. This is infinitely better than guessing intent and then guessing whether the text achieves the guessed intent.

### Into L5 Feedback

Feedback becomes surgical:

```
Before (guessing intent):
  "The transition in P2 could be smoother. Consider adding a connecting sentence."

After (knowing intent):
  "You want this moment to reveal that science is personal for you, not just
  academic. Right now the reader has to make that leap themselves because
  there's nothing in the text connecting the lab equipment to your grandmother's
  diagnosis. What if the lab detail you chose was one that specifically echoes
  something from her treatment?"
```

### Into L6 Coaching (Reinterpretation)

The precision supersession pipeline is replaced entirely. Instead of:
1. System guesses intent → stores as `inferredIntents`
2. Student says "I meant X" → system evaluates whether X supersedes its guess
3. Complex label-matching to surgically replace guessed intents

We get:
1. System asks student what they intended (or student volunteers it)
2. Declared intent stored as ground truth
3. Analysis evaluates text AGAINST declared intent
4. If student later says "Actually I meant Y," the declared intent is superseded (simple ID-based replacement, no label gymnastics)

### Into the Connection Graph

Declared intent enriches connections:

```
Connection C7: P1S3 → P4S2
  Description: "Opening image of the empty chair reappears as the chair at her bedside"
  Student-declared: "I wanted the chair to be the thread that holds the whole essay together"
  Analysis: The recurrence works but the emotional loading of the chair isn't
  consistent — in P1 it's neutral furniture, in P4 it's charged with grief.
  The student's intent suggests P1 should plant more emotional seeds.
```

---

## Conversator Intelligence-Gathering Modes

### Mode 1: Initial Discovery (First Conversation)

**Trigger**: Student has submitted an essay, system has run initial analysis (L1-L3.75), and the student opens the chat for the first time.

**Goal**: Extract foundational context before the student sees any feedback. This is the "intake interview."

**Strategy**:
- Open with genuine curiosity about the essay, not analysis: *"Tell me about this essay. What's the story behind it?"*
- Let the student lead — their unprompted framing reveals priorities
- Follow up on emotional cues: *"You said 'it was complicated.' What was complicated about it?"*
- Ask about the writing process: *"How did you decide to start with that moment?"*
- Surface 2-3 high-priority questions from the analysis pipeline
- Close with: *"Is there anything about this essay that you're worried about, or anything you really want to make sure comes through?"*

**Output**: 3-8 `DeclaredIntent` entries, 2-4 `PersonalContext` entries, 1-2 `CreativeDirection` entries. Pipeline re-runs L3.5 analysis with declared data before showing feedback.

### Mode 2: Annotation-Triggered (Inline Chat)

**Trigger**: Student clicks on an annotation or highlighted passage and opens the inline chat.

**Goal**: Deepen understanding of a specific passage. The conversation is anchored to a location.

**Strategy**:
- Context: system knows exactly which passage, what the analysis says, what questions are pending for this location
- Open with the most valuable pending question for this location
- If no pending question, ask about intent: *"What were you going for here?"*
- If the student is confused by feedback, explain the gap between intent and effect
- If the student disagrees with analysis, treat as reinterpretation — gather their reading, flag tension

**Output**: 1-3 `DeclaredIntent` entries scoped to this passage, possible `CreativeDirection` entries.

### Mode 3: Edit-Triggered (Post-Revision)

**Trigger**: Student has made edits and the system has detected changes.

**Goal**: Understand WHY the student made these changes. Did they respond to feedback? Did they have their own idea? Did they misunderstand the feedback?

**Strategy**:
- Reference the specific changes: *"I see you rewrote the ending. What prompted that?"*
- If changes align with feedback: confirm and deepen — *"That's exactly what that feedback was pointing at. Do you feel like it works better now?"*
- If changes contradict feedback: explore — *"Interesting — you went a different direction than the feedback suggested. Tell me more about why."*
- If changes introduce new problems: flag gently via question — *"The new version is stronger in [X], but I'm curious about [Y]. Was that a deliberate trade-off?"*

**Output**: Updated `DeclaredIntent` entries (superseding prior where relevant), possible new `PersonalContext` entries about revision process.

### Mode 4: Proactive Dig (System-Initiated)

**Trigger**: System has high-priority unanswered questions that are blocking analysis quality.

**Goal**: Get specific answers to specific questions without making the student feel interrogated.

**Strategy**:
- Frame questions as observations that invite elaboration, not as interrogation
- Cluster related questions (don't rapid-fire unrelated questions)
- Read the student's engagement level — if they're terse, back off and try later
- If a question gets a thin answer, try a different angle rather than pushing

**Output**: Answers to pending `ConversatorQuestion` entries, converted to appropriate declared data types.

---

## Question Queue Management

### The Question Queue

A persistent, priority-sorted queue of questions the system wants answered. Maintained on the profile.

```typescript
interface QuestionQueue {
  questions: ConversatorQuestion[];

  // Analytics
  totalGenerated: number;
  totalAnswered: number;
  totalWithdrawn: number;  // Questions that became irrelevant

  // Conversation integration
  lastAskedTurnId: string | null;
  questionCooldown: number;  // Min turns between system-initiated questions (default: 2)
}
```

### Queue Lifecycle

1. **Generation**: Analysis layers produce questions as byproducts (see "Where Questions Come From" above)
2. **Deduplication**: New questions are checked against existing questions and declared data. If a question is already answered by existing declared intent, it's marked `withdrawn`.
3. **Prioritization**: Questions are sorted by priority × recency × relevance-to-current-conversation
4. **Selection**: When the Conversator has a natural opening, it pulls the top question from the queue that fits the current conversation context.
5. **Asking**: Question status → `asked`, `askedInTurn` recorded. The Conversator phrases the question conversationally.
6. **Resolution**: When the student's response generates a `DeclaredIntent` or `PersonalContext` entry that addresses the question, status → `answered`, `answeredBy` linked.
7. **Withdrawal**: Questions can be withdrawn when: the student's edits make them irrelevant, re-analysis resolves the ambiguity, or the question has been pending for too long (configurable threshold, default: 10 conversation turns).

### Question Priority Calibration

| Priority | Criteria | Example |
|----------|----------|---------|
| **critical** | Analysis cannot proceed meaningfully without this | "The essay's central argument is unclear — is it about resilience or about community?" |
| **high** | Analysis is significantly degraded without this | "P3's function could be scene-setting or foreshadowing — changes downstream scores" |
| **medium** | Would improve analysis quality but not blocking | "The voice shift in P4 — intentional stylistic choice or drift?" |
| **low** | Enrichment question — nice to have | "You mention your grandfather briefly. Is there more context there?" |

---

## Integration With Existing Systems

### Replacing `inferredIntents` In The Pipeline

**Phase 1 (Immediate — Additive)**:
1. Add `StudentDeclaredData` to `EssayProfile`
2. Add `QuestionQueue` to `EssayProfile`
3. Modify L3.5 analysis prompt to include declared intents alongside observed functions
4. Modify L5 feedback prompt to reference declared intents
5. Modify L6 coaching to read/write declared data
6. Add question generation hooks to L3, L3.75, L3.5, L4
7. `inferredIntents` continues to exist but is NO LONGER PRODUCED by the walk. The bridge populates it from `declaredIntents` for backward compatibility.

**Phase 2 (Migration)**:
1. Migrate coaching precision-supersession from `inferredIntents` label-matching to `DeclaredIntent` ID-based supersession
2. Migrate focused analyzer delta referencing to include declared intents
3. Remove `inferredIntents` from `SentenceUnderstanding` type (breaking change — all consumers already mapped in audit)

**Phase 3 (Removal)**:
1. Remove observation bridge code from `sequentialDeepWalk.ts`
2. Remove `inferredIntents` and `narrativeContributions` from `SentenceUnderstanding`
3. Clean up `sentenceMutator.ts` cascade methods (replace with declared-data-aware methods)
4. Remove backward-compat bridge from all consumers

### Modifying The Walk (L3)

The walk no longer tries to infer intent. Its prompt changes from:

```
For each sentence, provide:
- observedFunctions: What the sentence DOES (factual)
- inferredIntents: What the writer is TRYING to achieve (interpretive)  ← REMOVED
- narrativeContributions: How the sentence advances the narrative      ← ABSORBED into findings
```

To:

```
For each sentence, provide:
- primaryFunction: What the sentence DOES in the essay's architecture (one line)
- significance: pivotal | contributing | transitional
- findings: Observations worth investigating further

If student-declared intent exists for this sentence, note whether the text's
observed function ALIGNS with, is TENSIONED against, or CONTRADICTS the declared intent.
Do NOT guess intent. If no declared intent exists, leave the alignment field null.
```

### Modifying The Analysis Pass (L3.5)

The analysis pass gains the most valuable signal in the system: the intent-effect gap.

```
ANALYSIS CONTEXT FOR P2S4:

Observed Function: Transitions from technical description to personal narrative
Significance: pivotal

STUDENT-DECLARED INTENT: "I wanted to show that my interest in science
isn't just academic — it's tied to watching her grandmother fight cancer."

YOUR TASK: Evaluate how effectively the TEXT achieves the STUDENT'S STATED INTENT.
The gap between what they want and what the text does is the primary feedback signal.

- If aligned: note WHY it works (so feedback can reinforce the technique)
- If tensioned: note specifically WHAT in the text creates the gap (so feedback is surgical)
- If contradicted: note whether the student should revise the text or revise their intent
```

### Modifying L5 Feedback

Feedback becomes intent-aware:

```
When generating feedback for sentences with declared intent:
- Reference the student's own words: "You said you wanted to [X]..."
- Ground in specific text: "But the sentence currently does [Y]..."
- Bridge the gap: "To close that gap, consider [specific technique]..."
- Never assume you know better than the student what they want.
  If you think their intent is misguided, flag it as a TENSION, don't override it.
```

### Modifying L6 Coaching

The coaching service's reinterpretation pipeline simplifies dramatically:

**Before**: Gather `inferredIntents` → show as [U] labels → Sonnet evaluates → label-based supersession → surgical array manipulation

**After**: Read `declaredIntents` → student says "actually I meant Y" → create new `DeclaredIntent` that supersedes the old one by ID → done. No label matching, no snapshot/restore, no blunt-then-precise replacement.

---

## Conversation Design: The Conversator's Voice

### Principles

1. **Genuine curiosity, not interrogation**: The Conversator is interested in the student's thinking, not checking boxes.
2. **Student leads, system follows**: The Conversator doesn't have a script. It has a queue of questions and a sense of what's most valuable, but the conversation follows the student's energy.
3. **Reflect back, don't prescribe**: *"It sounds like you're saying..."* not *"What you should mean is..."*
4. **Earn the right to ask hard questions**: Start with easy, open questions. Build rapport. THEN ask about authenticity, self-censorship, emotional truth.
5. **Never make the student feel judged**: The Conversator is an ally, not an evaluator. Even when surfacing tension between intent and effect, frame it as discovery, not criticism.
6. **Know when to stop**: If the student doesn't want to answer a question, respect that. Mark the question as `withdrawn` with reason `student_declined`. The information is probably important, but trust matters more.

### Anti-Patterns

- **Don't ask what you already know**: If the analysis clearly shows the essay is about resilience, don't ask "What is your essay about?" Ask something the system genuinely doesn't know.
- **Don't ask leading questions**: *"Don't you think the ending would be stronger if..."* is coaching, not gathering. Wrong mode.
- **Don't front-load questions**: The first message should be warm and open, not "I have 6 questions for you."
- **Don't ignore what the student says**: If the student volunteers information, CAPTURE IT even if it doesn't match a pending question. Volunteered information is the highest-signal data.
- **Don't be mechanical**: Vary question types. Mix direct questions, observations-that-invite-response, and reflective statements.

---

## Cost Model

### LLM Calls Per Intelligence-Gathering Turn

| Stage | Model | Purpose | Tokens (est.) |
|-------|-------|---------|---------------|
| Intent Classification | Haiku | Classify student message, extract declared data | ~500 in, ~200 out |
| Question Selection | None (logic) | Pick best question from queue for context | 0 |
| Response Generation | Sonnet | Generate conversational response + weave in question | ~2000 in, ~400 out |
| Data Extraction | Haiku | Parse student response into typed declared data | ~800 in, ~300 out |

**Per-turn cost**: ~$0.005–0.01

**Compared to current**: The coaching service already uses Haiku + Sonnet per turn. Intelligence gathering adds one Haiku extraction call (~$0.001). Marginal cost is negligible.

### ROI

Every piece of declared data improves analysis precision, which improves feedback quality, which improves student outcomes. The alternative — guessing intent — costs the same LLM tokens but produces worse results. The Conversator is strictly more efficient: same token budget, better data, because the data comes from the source of truth (the student).

---

## Success Metrics

1. **Intent coverage**: % of essay sentences with declared intent (target: 60%+ for actively coached essays)
2. **Question resolution rate**: % of generated questions that get answered (target: 70%+)
3. **Intent-effect gap detection**: % of feedback that references a specific gap between declared intent and text effect (target: 80%+ for sentences with declared intent)
4. **Precision supersession success**: % of student reinterpretations handled by simple ID-based supersession vs. fallback (target: 95%+ — no more blunt replace)
5. **Student engagement**: Average conversation length and voluntary information density (more volunteered info = higher trust = better data)
