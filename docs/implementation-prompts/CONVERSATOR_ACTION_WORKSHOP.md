# Prompt: The Conversator as Action Workshop

> **Purpose**: Build the conversational system that turns the Essay Intelligence pipeline's findings, understanding, and analysis into real student changes — by helping students understand what the system found, workshop their edits collaboratively, and track their progression. This is the OUTPUT side of the Conversator: where system intelligence becomes student action.

---

## The Core Problem

The Essay Intelligence pipeline produces extraordinary depth of analysis: findings with evidence chains, holistic synthesis across 10 dimensions, connection graphs, phase-aware feedback, North Star architectural roles. But analysis sitting in a profile is worthless. It only creates value when students:

1. **Understand** what the system found (not just read the annotation — actually grasp WHY it matters)
2. **Decide** what to do about it (not every finding needs action — students need help prioritizing)
3. **Execute** changes that address the finding without creating new problems
4. **Verify** that their changes actually closed the gap
5. **Learn** transferable skills they can apply to future writing

The current system's coaching layer (L6) handles some of this, but it operates as a general-purpose chat. There's no structured workflow for moving from "here's what the analysis found" to "here's what you changed and why it's better." The Conversator's Action Workshop mode fills this gap.

---

## What The Conversator Offloads From The Pipeline

### 1. Finding Explanation & Contextualization

**Currently**: L5 annotations are generated per paragraph, phase-filtered, and presented as text. If the student doesn't understand an annotation, they have no recourse except re-reading it.

**Offload to Conversator**: When a student clicks on a finding or annotation and says "I don't get this" or "why does this matter," the Conversator:
- Reads the finding's evidence chain (what text triggered it, what connections it relates to)
- Explains it in the student's language (not literary analysis jargon)
- Grounds it in the student's declared intent: *"You said you wanted to show growth. This finding is saying that the reader can't see the growth yet because both paragraphs describe you the same way."*
- Offers a concrete example of what "fixing" this would look like (without writing it for them)

**Why this is better than automated annotation**: Explanation is interactive. The system can't know what the student doesn't understand until they tell it. A static annotation either over-explains (boring) or under-explains (confusing). The Conversator adapts in real-time.

### 2. Edit Workshopping (The Revision Companion)

**Currently**: Student reads feedback → makes edits alone → re-submits → system re-analyzes → new feedback. The gap between "read feedback" and "make good edits" is where students struggle most, and the system is absent.

**Offload to Conversator**: The Conversator becomes a revision companion that helps students think through edits BEFORE committing them:

**Pre-edit brainstorming**:
- Student says: *"I want to fix the transition in paragraph 2 but I don't know how"*
- Conversator knows: the declared intent for P2, the findings about P2, the connections P2 has to other paragraphs, the phase-level guidance
- Conversator responds: *"Let's think about what that transition needs to do. You want to connect the lab to your grandmother [declared intent]. Right now the reader goes from pipettes to 'my grandmother was diagnosed' with nothing in between [finding F3]. What if we think about what object or sensation is in BOTH scenes? Something in the lab that also exists in the hospital?"*
- Student: *"The smell. The lab has that chemical smell and so does the hospital."*
- Conversator: *"That's really strong — smell is one of the most emotionally immediate senses. Try writing a sentence that puts that smell in the lab paragraph, almost casually. Then when you get to the hospital, the reader will already have that sensory bridge."*

**Mid-edit feedback**:
- Student types a new sentence and asks: *"Does this work?"*
- Conversator evaluates against declared intent + findings + connections: *"The smell detail works perfectly as a bridge. But 'the acrid scent of formaldehyde reminded me of hospitals' is telling the reader the connection instead of letting them feel it. What if you just described the smell without naming the hospital? Let the reader make the connection when they get to the grandmother paragraph."*

**Post-edit verification**:
- After student commits the edit, the system runs focused re-analysis
- Conversator reports: *"The intent-effect gap for that transition closed — the finding about abrupt transition is now superseded. But the re-analysis flagged something new: the smell detail in P2 is strong, but you used 'pungent' twice in three sentences. Quick fix."*

### 3. Priority Coaching (What To Fix First)

**Currently**: Students see all annotations at once (filtered by phase, but still potentially 10-15 items). They don't know which one to tackle first, which ones are related, or which will have the biggest impact.

**Offload to Conversator**: The Conversator helps students build a revision plan:

- *"Looking at everything the analysis found, here's what I'd focus on first: the connection between your opening and closing is the structural backbone of this essay [North Star], but right now it's implicit. If you strengthen that, three other findings will probably resolve themselves because they're all downstream of that same issue."*
- Shows the dependency graph: *"Fixing F3 [transition] will probably also address F7 [emotional preparation] and partially address F12 [arc momentum]. So let's start there."*
- Tracks progress: *"You've addressed 3 of the 5 foundation-level findings. The remaining two are about clarity in P4 and the ending. Want to tackle P4 next?"*

### 4. Teaching Transferable Skills

**Currently**: Feedback tells students what to fix in THIS essay. It doesn't teach them skills they can apply to FUTURE writing.

**Offload to Conversator**: When a student fixes a finding, the Conversator surfaces the transferable principle:

- *"What you just did — using a sensory detail to bridge two scenes — is a technique called 'sensory threading.' It works any time you need to connect two moments that are emotionally related but physically separate. You could use it in your supplemental essays too."*
- NOT a lecture. One sentence. Only when the student just experienced the technique working.
- Stored as a `CapacityBuildingMoment` on the profile, visible to future coaching turns.

### 5. Emotional Support & Motivation

**Currently**: The system delivers analysis objectively. But students are emotionally invested in their essays. Hearing "this transition is abrupt" when they spent two hours on it can be demoralizing.

**Offload to Conversator**: The Conversator reads emotional signals and adapts:

- If the student seems overwhelmed: *"I know this is a lot of feedback. But here's the thing — the analysis also found [3 genuine strengths]. Your voice in P3 is really distinctive, and the story you're telling matters. We're just making the container worthy of the content."*
- If the student seems resistant: Don't push. Ask: *"You seem like you disagree with that finding. Tell me what you think is happening in that paragraph."* → This is intelligence gathering mode, not action mode. Switch modes fluidly.
- If the student seems stuck: *"Let's try something different. Instead of revising, just tell me out loud what you WANT that paragraph to do. Don't worry about the words yet."* → Captures declared intent, which unblocks the revision.

---

## Architecture: The Action Workshop System

### Session State: `WorkshopSession`

```typescript
interface WorkshopSession {
  id: string;
  essayId: string;
  profileSnapshotVersion: number;  // Profile version at session start

  // Current focus
  activeFocus: WorkshopFocus | null;
  focusHistory: WorkshopFocus[];

  // Revision tracking
  revisionPlan: RevisionPlan | null;
  completedActions: CompletedAction[];

  // Learning moments
  capacityMoments: CapacityBuildingMoment[];

  // Session arc
  sessionPhase: 'orientation' | 'planning' | 'workshopping' | 'reviewing' | 'wrapping_up';
  turnCount: number;
  studentEnergy: 'high' | 'medium' | 'low' | 'frustrated';  // LLM-assessed per turn
}

interface WorkshopFocus {
  type: 'finding' | 'annotation' | 'paragraph' | 'connection' | 'holistic_dimension' | 'student_chosen';
  findingId?: string;
  annotationId?: string;
  paragraphIndex?: number;
  connectionId?: string;
  dimension?: string;
  description: string;  // Human-readable description of what we're working on

  // What the student is trying to do here
  declaredIntentId?: string;  // Link to student's declared intent for this area
  goalStatement?: string;  // What would "done" look like for this focus

  // Status
  status: 'exploring' | 'brainstorming' | 'drafting' | 'evaluating' | 'resolved' | 'deferred';
  resolution?: string;  // What happened (if resolved or deferred)
}

interface RevisionPlan {
  items: RevisionPlanItem[];
  strategy: string;  // LLM-generated summary of approach
  estimatedImpact: string;  // What resolving all items would achieve
  createdAt: string;
  lastUpdated: string;
}

interface RevisionPlanItem {
  id: string;
  findingIds: string[];  // Findings this addresses
  description: string;  // What to do
  rationale: string;  // Why this matters (grounded in North Star)
  dependsOn: string[];  // Other item IDs that should be done first
  estimatedDifficulty: 'quick_fix' | 'moderate' | 'significant_rework' | 'structural_change';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAction?: string;  // CompletedAction ID
}

interface CompletedAction {
  id: string;
  planItemId?: string;  // Link to revision plan item (if from plan)
  focusId: string;  // WorkshopFocus this was part of
  description: string;  // What the student did
  editSummary: string;  // Brief description of text changes
  findingsAddressed: string[];  // Finding IDs that were resolved
  findingsCreated: string[];  // New finding IDs from re-analysis
  intentEffectGapBefore: string;  // Gap before the edit
  intentEffectGapAfter: string;  // Gap after (null = closed)
  timestamp: string;
}

interface CapacityBuildingMoment {
  id: string;
  technique: string;  // Name of the technique (e.g., "sensory threading")
  principle: string;  // One-sentence transferable principle
  context: string;  // What the student was doing when they learned this
  actionId: string;  // CompletedAction where this emerged
  transferability: string;  // Where else this technique applies
  timestamp: string;
}
```

### Workshop Conversation Pipeline

Each turn in the Action Workshop runs through a specialized pipeline:

```
Student Message
  ↓
[Stage 1: Mode Detection] (Haiku)
  ├─ What is the student doing?
  │   ├─ asking_for_explanation — "What does this mean?"
  │   ├─ seeking_direction — "What should I fix first?"
  │   ├─ brainstorming — "How could I fix this?"
  │   ├─ proposing_edit — "What if I changed it to..."
  │   ├─ requesting_evaluation — "Does this work?"
  │   ├─ expressing_frustration — "I've tried everything"
  │   ├─ celebrating_progress — "I think this is better!"
  │   ├─ changing_focus — "Let's work on something else"
  │   ├─ requesting_overview — "How am I doing overall?"
  │   └─ volunteering_information — (switch to Intelligence Gatherer mode)
  │
  └─ Also extracts: emotional state, engagement level, cognitive load
  ↓
[Stage 2: Context Assembly] (Logic — no LLM)
  ├─ Current WorkshopFocus → relevant findings, connections, analysis
  ├─ Student's declared intents for the current scope
  ├─ Revision plan status (what's done, what's next)
  ├─ Recent conversation turns (for continuity)
  ├─ Phase-level guidance (what's appropriate to surface now)
  └─ Pending ConversatorQuestions (intelligence gathering opportunities)
  ↓
[Stage 3: Response Generation] (Sonnet)
  ├─ Mode-aware response (explanation vs brainstorming vs evaluation — different tones)
  ├─ Grounded in analysis (every claim cites a finding or text)
  ├─ References declared intent (when available)
  ├─ May include: question from queue (if natural opening)
  ├─ May include: revision plan update (if progress was made)
  ├─ May include: capacity building note (if technique was demonstrated)
  └─ Adapts to student energy (shorter if frustrated, celebratory if breakthrough)
  ↓
[Stage 4: State Update] (Haiku + Logic)
  ├─ Update WorkshopFocus status
  ├─ Update RevisionPlan if items completed
  ├─ Record CompletedAction if edit was evaluated
  ├─ Extract any volunteered declared data (switch to Gatherer momentarily)
  ├─ Update student energy assessment
  └─ Check: should we suggest changing focus? (if stuck > 3 turns on same issue)
```

---

## Mode-Specific Behaviors

### Explanation Mode

**Trigger**: Student asks "What does this mean?" or clicks on annotation and says "I don't understand."

**The Conversator's job**: Translate analysis into student language.

**Grounding hierarchy** (what to reference, in order):
1. The student's own declared intent for this area (most relevant framing)
2. The specific text the finding cites (concrete, not abstract)
3. The connection to the essay's North Star (why it matters architecturally)
4. A concrete example of the phenomenon (from the essay itself, not hypothetical)

**Anti-patterns**:
- Don't repeat the annotation verbatim — the student already read it
- Don't use literary analysis terminology without defining it
- Don't explain everything at once — answer the specific confusion
- Don't be defensive about the analysis — if the student doesn't agree, switch to intelligence gathering

**Example exchange**:
```
Student: "It says 'the emotional register shifts without preparation' — what does that mean?"

Conversator: "In your essay, paragraph 2 is pretty calm and observational — you're
describing the lab, the equipment, your routine. Then paragraph 3 opens with 'When
she was diagnosed, everything stopped.' That's a huge emotional jump — from neutral
to devastating — with no bridge. The reader doesn't have time to emotionally
prepare for that shift, so it can feel jarring instead of powerful.

Think of it like a movie: if a scene cuts from a sunny park to a funeral with no
transition, the audience gets whiplash. Your essay is doing something similar here."
```

### Direction Mode

**Trigger**: Student asks "What should I work on?" or seems lost after reading feedback.

**The Conversator's job**: Build or present a revision plan, prioritized by impact.

**Prioritization logic**:
1. **Foundation-level findings first** (structural issues that cascade)
2. **Findings with the most downstream connections** (fix one, resolve many)
3. **Findings where the intent-effect gap is largest** (most impactful improvements)
4. **Student's own priorities** (if they said "I really want to fix the ending," start there even if analysis says P2 is more important)

**How revision plans are built**:
- Sonnet reads: all active findings, their relationships (buildsOn, relatedTo), connection graph, improvement phase, student declared intents
- Produces: ordered list of revision items with dependency awareness
- The Conversator presents this as a conversation, not a bulleted list: *"I'd start with the connection between your opening and closing — that's the structural backbone. Once that's solid, three other issues will probably resolve themselves..."*

**Revision plan is a living document**: As the student completes items, the plan updates. New findings from re-analysis get slotted in. Items can be reordered based on what the student discovers during revision.

### Brainstorming Mode

**Trigger**: Student knows what to fix but not how. "How can I make this transition smoother?"

**The Conversator's job**: Generate options, not answers. Help the student think, not think for them.

**Strategy**:
1. **Reflect the problem back**: *"So the challenge is connecting the lab scene to your grandmother without it feeling forced."*
2. **Name the technique category**: *"There are a few ways to bridge disconnected scenes — sensory overlap, thematic echo, or direct reflection."*
3. **Ask a generative question**: *"What's something that exists in both the lab and the hospital? Something you could see, hear, smell, or feel in both places?"*
4. **Let the student generate the idea**: The best revision ideas come from the student. They know their story. They just need a framework for thinking about craft.
5. **Validate and refine**: Once the student has an idea, help them sharpen it: *"The smell detail is perfect. Now, where in the lab paragraph would you introduce it? Early, as scene-setting? Or right at the end, as the last thing before the transition?"*

**Anti-patterns**:
- Don't write the sentence for them (unless they explicitly ask for an example)
- Don't offer more than 3 options (decision fatigue)
- Don't default to the most "literary" option — match the student's voice
- Don't dismiss ideas that don't match the system's analysis — explore them first

### Evaluation Mode

**Trigger**: Student has written new text and asks "Is this better?" or submits an edit.

**The Conversator's job**: Honest, specific, encouraging evaluation.

**Process**:
1. Run focused re-analysis on the edited passage (or wait for system to complete it)
2. Compare: finding status before vs after, intent-effect gap before vs after
3. Deliver honest verdict:
   - If better: *"Yes — the smell detail creates exactly the kind of bridge the analysis was looking for. Finding F3 [abrupt transition] is now resolved."*
   - If partially better: *"The bridge is working, but 'pungent' appears twice in three sentences, which dulls the impact. Quick fix — vary the descriptor."*
   - If not better: *"I can see what you're going for, but this version introduces a new issue: [specific]. The original transition was [problem], and this one is [different problem]. Want to try a different approach?"*
   - If sideways: *"Interesting — this is different, not necessarily better or worse. It changes the tone from [X] to [Y]. Is that what you wanted?"*

4. Update revision plan: mark items as completed, note new findings
5. If a technique was demonstrated, surface capacity building moment

**Critical rule**: Never say "great job!" when the edit didn't improve things. Students can tell when praise is performative. Honest, specific feedback builds trust. Dishonest encouragement erodes it.

### Overview Mode

**Trigger**: Student asks "How am I doing?" or "How much better is this draft?"

**The Conversator's job**: Provide a meaningful progress snapshot.

**What to show**:
- **Finding resolution**: "You've addressed 7 of 12 active findings. 3 were resolved, 2 improved to 'developing', 2 superseded by better solutions."
- **Phase progression**: "Your essay started at Foundation phase. After these revisions, the structure is solid enough that we're now at Architecture phase — the big-picture issues are handled, and we can focus on how paragraphs serve specific roles."
- **Intent-effect alignment**: "For the 4 passages where you told me what you wanted to achieve, 3 are now well-aligned. The P4 passage still has a gap between your intent [X] and the text's effect [Y]."
- **Strengths discovered**: "Something I want to highlight: your voice in paragraphs 3 and 5 is genuinely distinctive. The analysis flagged these as strengths even before your revisions, and they've gotten stronger."
- **Next focus**: "Based on where things stand, the highest-impact next step would be [X]."

**Anti-pattern**: Don't turn this into a grade or score. The student doesn't need a number. They need a sense of trajectory — are things getting better, and what's the next most valuable action?

---

## Seamless Mode Switching

The Conversator doesn't ask "which mode would you like?" It detects the student's need and switches fluidly.

### Intelligence Gathering ↔ Action Workshop

These modes interleave constantly:

```
[Workshop] Student: "I want to fix the transition in P2"
[Workshop] Conversator: "Let's think about what that transition needs to do."
[→ Gather] Conversator: "What were you hoping the reader would feel at that moment?"
[Gather]   Student: "I wanted them to realize my science interest is personal"
[→ Workshop] Conversator: "Okay, so the bridge needs to carry that emotional
             realization. Right now it's just a scene cut. What if..."
```

The Conversator doesn't announce mode switches. It just asks the right question at the right time.

### Within Workshop Modes

```
[Direction] Student: "What should I work on?"
[Direction] Conversator: "Start with the opening-closing connection."
[→ Explain] Student: "Why is that the most important?"
[Explain]   Conversator: "Because your essay's architecture depends on..."
[→ Brainstorm] Student: "Okay, how do I strengthen it?"
[Brainstorm] Conversator: "What connects your opening moment to your closing one?"
[→ Evaluate] Student: "I added this sentence — does it work?"
[Evaluate]  Conversator: "Yes, that creates a strong echo. Finding F1 is resolved."
[→ Direction] Conversator: "Next, let's look at P3's emotional preparation..."
```

---

## Integration With The Inline Annotation UX

### Annotation → Conversation Bridge

When a student interacts with an inline annotation, the Conversator has full context:

```typescript
interface AnnotationChatContext {
  // The annotation they clicked on
  annotation: L5Annotation;

  // The finding(s) behind this annotation
  relatedFindings: Finding[];

  // The sentence/paragraph understanding
  understanding: SentenceUnderstanding | ParagraphUnderstanding;

  // Student's declared intent for this location (if any)
  declaredIntent: DeclaredIntent | null;

  // Pending questions for this location
  pendingQuestions: ConversatorQuestion[];

  // Connections involving this location
  connections: Connection[];

  // Current improvement phase
  phase: ImprovementPhase;

  // Workshop session state (if in active workshop)
  workshopFocus: WorkshopFocus | null;
}
```

The inline chat panel receives this context automatically. The student doesn't need to explain what they're looking at.

### Edit-In-Place → Workshop Loop

When the student edits text directly in the inline editor:

1. **Edit detected** → System runs focused re-analysis (via `editUnderstandingService` + `focusedAnalyzer`)
2. **Re-analysis complete** → Conversator receives delta (what findings changed, what new findings emerged)
3. **Conversator evaluates** → Compares against the student's declared intent for this passage
4. **Conversator responds** → In the inline chat, with specific feedback about the edit's impact
5. **Annotations update** → Inline annotations refresh to reflect new analysis state
6. **Workshop state updates** → Revision plan items marked complete/updated

This creates a tight feedback loop: edit → instant evaluation → next suggestion → edit again. The student never leaves the essay.

### Multi-Location Awareness

When the student fixes something in P2, the Conversator checks:
- Did this change affect connections to other paragraphs?
- Did findings in other paragraphs change status?
- Did the holistic synthesis shift?

If so: *"By the way, your change to P2 actually resolved an issue in P4 too — the transition there now has the sensory bridge it was missing. Two birds with one stone."*

This teaches students that essays are interconnected systems, not collections of independent paragraphs.

---

## Process Migration: What Moves From Pipeline To Conversator

### Migrated Processes

| Process | Currently | Moves To | Why |
|---------|-----------|----------|-----|
| **Intent inference** | L3 walk guesses `inferredIntents` | Conversator asks student | Student knows their intent; system doesn't |
| **Finding explanation** | L5 annotation text (static) | Conversator explains interactively | Students have different confusion points |
| **Revision prioritization** | Phase filtering (automated) | Conversator builds revision plan with student | Student priorities matter; automated ordering misses context |
| **Edit evaluation** | Re-analysis produces new scores | Conversator interprets re-analysis for student | Raw finding deltas aren't actionable without interpretation |
| **Technique teaching** | L5 `capacityBuildingNote` (static) | Conversator surfaces at moment of learning | Timing matters — teach when the student just experienced it |
| **Emotional calibration** | None | Conversator reads emotional state | System can't see frustration/excitement in text edits |
| **Authenticity probing** | L3.75 holistic synthesis guesses | Conversator asks directly | "Is this how it really happened?" can only be asked, not inferred |
| **Domain context** | None | Conversator gathers background | System can't know that "GFP" isn't jargon in a biology context |
| **Voice preference** | Analysis assumes current voice is intentional | Conversator asks | Student may be performing a voice they don't like |

### NOT Migrated (Stays In Pipeline)

| Process | Why It Stays |
|---------|-------------|
| **Structural analysis** (L2) | Objective — paragraph roles, transitions, word counts |
| **Connection detection** (L2.5, L3) | Text-based pattern recognition — doesn't need student input |
| **Function observation** (L3 walk) | What the text DOES is observable; what the student MEANS requires asking |
| **Holistic synthesis** (L3.75) | Synthesizing voice/emotion/narrative from text is the system's strength |
| **Effectiveness scoring** (L3.5) | Evaluative judgment grounded in text evidence — system competence |
| **Finding crystallization** (L4) | Pattern recognition across layers — system competence |
| **Phase detection** | Formula-like assessment from analysis results — system competence |

### The Principle

**Migrate to the Conversator when**: The information is subjective, personal, requires student context, or involves emotional/motivational support.

**Keep in the pipeline when**: The information is derivable from text analysis, requires cross-paragraph pattern recognition, or benefits from consistent evaluation standards.

---

## The Workshop Prompt (Sonnet Stage 3)

This is the core prompt that generates the Conversator's workshop responses.

```
You are the student's revision companion for their college application essay.
You have deep understanding of this essay from multiple analytical layers,
and you know what the student is trying to achieve from their own words.

YOUR ROLE: Help the student turn analytical insights into real improvements.
You are NOT an editor — you don't write for them. You are a thinking partner
who helps them see possibilities, understand problems, and develop solutions.

CURRENT WORKSHOP STATE:
{workshopSession — focus, plan status, completed actions, student energy}

STUDENT'S ESSAY:
{current essay text with paragraph/sentence indices}

ANALYSIS CONTEXT:
{phase-filtered findings, connections, holistic summary — assembled by ProfileRouter}

STUDENT'S DECLARED INTENTS:
{all DeclaredIntent entries, showing what the student wants each part to do}

INTENT-EFFECT ALIGNMENT:
{for each declared intent, the current alignment status with specific gaps}

CONVERSATION HISTORY:
{recent turns for continuity}

STUDENT'S MESSAGE:
{current message}

DETECTED MODE: {mode from Stage 1}
STUDENT ENERGY: {energy level from Stage 1}

RESPONSE GUIDELINES:

1. GROUND EVERYTHING IN TEXT
   - Never make abstract claims. Quote specific sentences.
   - When citing a finding, show the evidence: "In line X, the word 'always'
     creates absolute certainty that you undercut two sentences later."

2. REFERENCE DECLARED INTENT
   - When the student has told you what they want, use their words:
     "You said you wanted this to feel like a revelation. Right now it reads
     more like a report because..."
   - The gap between intent and effect is your primary teaching tool.

3. HELP THEM THINK, DON'T THINK FOR THEM
   - Ask generative questions: "What connects these two moments for YOU?"
   - Offer frameworks, not solutions: "There are a few ways to bridge scenes..."
   - Let them generate ideas first. Refine after.

4. MATCH THEIR ENERGY
   - If frustrated: shorter responses, acknowledge the difficulty, offer a small win
   - If excited: match enthusiasm, build on their momentum
   - If confused: slow down, use simpler language, one concept at a time
   - If stuck: change the approach — try a different angle, or step back to brainstorm

5. TRACK PROGRESS NATURALLY
   - When they complete something, acknowledge it: "That resolves the transition issue."
   - When new issues emerge, frame them as forward progress: "Now that the structure
     is solid, we can focus on fine-tuning..."
   - Never make progress feel overwhelming. One thing at a time.

6. TEACH AT THE MOMENT OF LEARNING
   - When they successfully apply a technique, name it briefly (one sentence)
   - Connect it to future applicability: "This works for any time you need to..."
   - Don't lecture. The experience IS the lesson.

7. KNOW WHEN TO SWITCH MODES
   - If they volunteer personal information → switch to intelligence gathering
   - If they ask "what should I fix next?" → switch to direction mode
   - If they say "I don't understand" → switch to explanation mode
   - Mode switches should be invisible to the student.

8. BE HONEST
   - If an edit didn't help, say so kindly but clearly.
   - If you don't know the best approach, say so: "I'm not sure which
     direction would work best here. Let's try [A] and see how it feels."
   - Never perform enthusiasm you don't have evidence for.

OUTPUT FORMAT:
Return your response as natural conversation. No headers, no bullet lists
(unless the student specifically asks for a list). Write like you're talking
to them across a table, not presenting a report.

If this turn should update the workshop state, include a JSON block at the end
(hidden from student) with state updates:
{
  "focusUpdate": { ... } | null,
  "planUpdate": { ... } | null,
  "completedAction": { ... } | null,
  "capacityMoment": { ... } | null,
  "declaredDataExtracted": { ... } | null,
  "questionsResolved": ["Q1", "Q3"] | null,
  "suggestedNextFocus": "..." | null
}
```

---

## The Combined System: Intelligence Gathering + Action Workshop

### Unified Conversator Architecture

The Conversator is ONE system with two modes that interleave seamlessly:

```
                    ┌─────────────────────────┐
                    │     CONVERSATOR          │
                    │                          │
  Student Message → │  [Mode Detection]        │
                    │       │                  │
                    │  ┌────┴────┐             │
                    │  │         │             │
                    │  ▼         ▼             │
                    │ GATHER    WORKSHOP       │
                    │ (input)   (output)       │
                    │  │         │             │
                    │  │    ┌────┴────────┐    │
                    │  │    │ explain     │    │
                    │  │    │ direct      │    │
                    │  │    │ brainstorm  │    │
                    │  │    │ evaluate    │    │
                    │  │    │ overview    │    │
                    │  │    └─────────────┘    │
                    │  │         │             │
                    │  └────┬────┘             │
                    │       │                  │
                    │  [Context Assembly]      │
                    │       │                  │
                    │  [Response Generation]   │
                    │       │                  │
                    │  [State Update]          │
                    │       │                  │
                    └───────┼──────────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │  ESSAY PROFILE   │
                    │                  │
                    │ DeclaredIntents  │ ← from Gather
                    │ PersonalContext  │ ← from Gather
                    │ CreativeDir      │ ← from Gather
                    │ DomainContext    │ ← from Gather
                    │ QuestionQueue   │ ← generated by pipeline, consumed by Gather
                    │                  │
                    │ WorkshopSession  │ ← from Workshop
                    │ RevisionPlan    │ ← from Workshop
                    │ CompletedActions │ ← from Workshop
                    │ CapacityMoments │ ← from Workshop
                    │                  │
                    │ Findings ←───────── pipeline produces, Workshop interprets
                    │ Connections ←─────── pipeline produces, Workshop teaches
                    │ Analysis ←────────── pipeline produces, Workshop explains
                    │ Holistic ←────────── pipeline produces, Workshop contextualizes
                    └──────────────────┘
```

### Data Flow Summary

**INTO the profile (Gathering)**:
- Student tells us intent → `DeclaredIntent` → shapes L3.5/L5/L6
- Student reveals context → `PersonalContext` → calibrates analysis
- Student expresses preferences → `CreativeDirection` → respects autonomy
- Student explains domain → `DomainContext` → prevents false positives

**OUT OF the profile (Workshop)**:
- Findings → explained and prioritized by Conversator
- Analysis → interpreted for the student's specific situation
- Connections → taught as architectural principles
- Phase → presented as progress, not judgment

**LOOP**:
- Student makes edit → system re-analyzes → Conversator evaluates → student makes next edit
- Each loop enriches the profile (new declared data, resolved questions) AND produces student progress (resolved findings, closed intent-effect gaps)

---

## Implementation Phases

### Phase 1: Foundation (Additive — No Breaking Changes)

**New types**: `StudentDeclaredData`, `ConversatorQuestion`, `QuestionQueue`, `WorkshopSession`, `RevisionPlan`, `CompletedAction`, `CapacityBuildingMoment` on `EssayProfile`

**New service**: `ConversatorService` (replaces/wraps `CoachingService`)
- Unified mode detection (gather vs workshop, sub-modes within workshop)
- Question queue management
- Workshop session state management
- Delegates to existing `CoachingService` for Sonnet response generation (reuses Stage 3 prompt engineering)

**Pipeline modifications**:
- L3 walk: Add question generation hooks (emit `ConversatorQuestion` when confidence < 0.7)
- L3.75 holistic: Add question generation for gaps/contradictions
- L3.5 analysis: Include `DeclaredIntent` in prompt context (alongside `primaryFunction`)
- L5 feedback: Reference `DeclaredIntent` when available

**Frontend**:
- Inline chat panel (anchored to annotations/paragraphs)
- Global chat panel (for overview/direction conversations)
- Workshop state display (current focus, plan progress)

### Phase 2: Migration (Replace inferredIntents)

- Walk stops producing `inferredIntents` (already done in Phase 0/1 of observation elimination)
- Bridge code generates `inferredIntents` from `DeclaredIntent` entries for backward compat
- Coaching precision-supersession rewired to use `DeclaredIntent` ID-based supersession
- `focusedAnalyzer` delta referencing includes declared intents

### Phase 3: Cleanup (Remove Legacy)

- Remove `inferredIntents` from `SentenceUnderstanding`
- Remove `narrativeContributions` from `SentenceUnderstanding`
- Remove observation bridge from `sequentialDeepWalk.ts`
- Remove `sentenceMutator` cascade methods (`updateInferredIntents`, `correctInferredIntent`, `enrichNarrativeContext`, `clarifyObservation`)
- Clean up all backward-compat bridge code

---

## Success Metrics

### Gathering Effectiveness
1. **Intent coverage**: 60%+ of essay sentences have declared intent (for coached essays)
2. **Question resolution**: 70%+ of pipeline-generated questions get answered
3. **Context density**: Average 5+ personal context entries per coached essay
4. **Volunteer rate**: 40%+ of declared data comes from student volunteering (not direct questions)

### Workshop Effectiveness
1. **Finding resolution**: 60%+ of active findings addressed per workshop session
2. **Intent-effect gap closure**: 70%+ of tensioned intents move to aligned after revision
3. **Phase progression**: 80%+ of essays advance at least one phase level after workshop
4. **Technique retention**: Students reference learned techniques in subsequent essays (tracked via `CapacityBuildingMoment`)
5. **Session completion**: 70%+ of workshop sessions reach `wrapping_up` phase (not abandoned mid-brainstorm)

### Student Experience
1. **Engagement**: Average 8+ turns per workshop session
2. **Return rate**: 70%+ of students return for a second workshop session
3. **Edit confidence**: Students make edits faster in later sessions (learning is transferring)
4. **Trust signals**: Students volunteer information without being asked (indicates comfort)
