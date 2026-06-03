# PLAN2: The Understanding Revolution

> **Evolution of the Essay Intelligence System from observation-accumulation to genuine understanding-growth.**
> Builds on PLAN.md (the existing 8-layer architecture). Does NOT replace it — evolves the walk's output, the profile's structure, and the growth mechanism while preserving the layer separation, caching strategy, and downstream pipeline.

---

## Philosophy: What "Understanding" Actually Means

The current system produces **observations** — 129 flat `ObservationEntry` objects per essay, each a single sentence with a confidence score and an evidence quote. This is *cataloguing*, not understanding. A great writing teacher doesn't catalog; they develop a **mental model** that deepens with every read, every conversation, every student edit.

Understanding has levels. The system should be capable of reaching the deepest levels, even if it doesn't always get there on the first pass:

### The Understanding Hierarchy

**Level 1 — Technique Identification** (what the current system often produces):
> "This sentence uses concrete imagery to ground the reader."

**Level 2 — Contextual Function** (what the current system sometimes reaches):
> "The sensory registers chosen (leather, fluorescent light, cold counter) construct a world organized around physical transactions."

**Level 3 — Architectural Comprehension** (what the walk prompt aims for but the output format constrains):
> "The specific sensory registers construct a world organized around physical transactions — establishing that this narrator understands value through what can be touched, weighed, and appraised. When the grandmother's story arrives as pure oral narrative, it disrupts this sensory framework: memory cannot be held under a jeweler's loupe. The clash between P1's epistemology (value = measurable) and P3's epistemology (value = inherited story) IS the essay's central tension."

**Level 4 — Epistemological Insight** (what the system should reach with depth passes):
> "The essay defines understanding as physical encounter — to know value is to hold it, weigh it, see it under light. The grandmother's story doesn't just add information; it challenges the essay's entire way of knowing. This is why the diamond's meaning can transform: the object stays the same, but the framework for understanding it shifts from commercial to familial to personal. The essay's argument IS about how frameworks shape what we can see."

**Level 5 — Meta-Awareness** (what the system should reach with deep dives):
> "The essay's commitment to physical knowing creates an ironic tension with the college essay form itself, which demands reflective abstraction. The writer's voice is most authentic in concrete moments and most generic in philosophical ones — the essay is unknowingly performing the very constraint it describes. The form constrains the writer to reflection, but their native mode is making."

**Level 6 — Coaching Synthesis** (what understanding enables for feedback):
> "If the student could become aware that their essay PERFORMS its own thesis — the college essay format constraining them into a mode that isn't native, forcing creative adaptation — the revision almost writes itself. The meta-awareness IS the essay's deepest available insight, and it's hiding in plain sight."

**The current system maxes out at Level 2-3. We're building a system capable of Level 5-6.** Not because every essay needs Level 6 analysis, but because the ARCHITECTURE must never be the ceiling. The essay is the ceiling. Our system should be able to go as deep as any essay warrants.

---

## The Growth Engine: Questions Drive Depth

The fundamental shift: **from producing observations to developing understanding through questions.**

### How a Great Reader's Understanding Grows

**Read 1 (Initial Walk):** Build a coherent mental model. Notice what's interesting. Form hypotheses. Identify what you DON'T KNOW YET.

*"This essay claims constraint enables creativity. Is that claim earned through specific experience, or always philosophical assertion? Watching for that."*

**Read 2 (Targeted Deep Dives):** Go back to flagged areas with focused investigation.

*"Traced the abstraction pattern across all 7 paragraphs. The writer retreats to philosophy every time they approach a moment of specific experience. P4S3 ('users smile') is the only concrete moment in 650 words — and even that retreats to 'reaffirmed my belief' within the same sentence."*

**Read 3 (After student conversation):** Student reveals intent, confirming or challenging the reading.

*"Student says they want to show versatility. But the text argues for synthesis — 'I noticed parallels' makes coding depend on music. The text and intent diverge. That divergence is the coaching opportunity."*

**Read 4 (After student edits):** Compare old vs. new understanding. See what the student learned.

*"P1 now opens with a specific compositional moment instead of philosophy. The constraint-creativity idea is grounded in experience for the first time. But the new opening makes P3's compressed Chopin reference feel even more rushed — the essay now has ONE concrete moment but needs TWO to earn its bridge."*

### The Four Growth Mechanisms

**1. The Question Queue** — Every growth step produces understanding + unanswered questions. The questions are PERSISTENT — they survive across runs, accumulate priority, and drive where the system invests next. Understanding is mature when no high-priority questions remain.

```
Initial walk questions:
  Q1: "Is the constraint-creativity claim ever earned through specific experience?" [HIGH]
  Q2: "What is the relationship between the Chopin reference and the AI DJ project?" [MEDIUM]
  Q3: "Why does the voice shift from kinesthetic to abstract in P0?" [MEDIUM]

After walk completes:
  Q1: PARTIALLY ANSWERED — "P4S3's 'users smile' partially earns it, but only through external validation"
  Q1a: NEW — "Does the writer have a moment of internal recognition, not just external?" [HIGH]
  Q2: ANSWERED — "The Chopin reference is setup for the music-coding bridge, but compressed"
  Q3: UNANSWERED — flagged for deep dive

After deep dive on Q3:
  Q3: ANSWERED — "The shift is performed, not intentional. The writer's native register is kinesthetic;
       the abstract register is their 'essay-writing voice.'"
  Q3a: NEW — "Could leaning into the kinesthetic register transform the entire essay's authenticity?" [HIGH]
```

**2. Maturity Tracking** — Findings have maturity levels: `hypothesis → developing → confirmed → deepened`. The system can see where understanding is tentative and target those areas. A finding that remains at "hypothesis" after three passes should either be investigated or acknowledged as genuinely ambiguous.

**3. Coherence Checks** — After each growth step, the system checks: does my understanding contradict itself? Contradictions are not errors — they're DEEPENING OPPORTUNITIES. "The walk says the essay argues for synthesis, but the student says versatility" → investigate the divergence, produce deeper understanding of both the text and the student's relationship to it.

**4. Diminishing Returns** — Track how much each growth step adds. Deep dives that produce nothing new → that area is mature. Re-analysis that changes nothing beyond the edit → the architecture is stable. Coaching that aligns with existing understanding → the system's reading is confirmed. These signals tell the system when to stop investing AND when understanding has genuinely reached depth.

### The Question Queue: Implementation Spec

```typescript
interface UnderstandingQuestion {
  id: string;
  question: string;
  /** What this question is really asking about */
  dimension: 'earned-ness' | 'voice' | 'epistemology' | 'structure' | 'intent'
    | 'craft' | 'identity' | 'connection' | 'admissions' | 'meta';
  /** Where in the essay this question originates */
  scope: {
    paragraph?: number;
    sentences?: number[];
    crossParagraph?: number[];  // for questions that span the essay
    essayLevel?: boolean;       // for meta-questions about the whole essay
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** What answering this question would unlock */
  expectedYield: string;
  /** Current status */
  status: 'open' | 'partially_answered' | 'answered' | 'unanswerable';
  /** If answered, what the answer revealed */
  answer?: string;
  /** Which growth step answered it */
  answeredBy?: 'walk' | 'deep_dive' | 'coaching' | 'edit_reanalysis';
  /** Child questions spawned from this one */
  spawnedQuestions: string[];  // IDs
  /** When raised */
  raisedDuring: string;  // 'walk_p3' | 'deep_dive_voice' | 'coaching_turn_4'
}
```

---

## Profile Architecture Evolution

### The Core Shift: From Observation Arrays to Understanding Prose + Findings

**Current structure (what we're evolving FROM):**
```
SentenceUnderstanding {
  observedFunctions: ObservationEntry[]     // flat: { observation, confidence, evidence }
  inferredIntents: ObservationEntry[]        // same shape, different bucket
  narrativeContributions: ObservationEntry[] // same shape, different bucket
  rhetoricalFunctions: string[]
  paragraphContribution: string
  craft: SentenceCraft
  significantChoices: { word, significance }[]
  connectionRefs: string[]
  tags: string[]
}
```

**New structure (what we're evolving TO):**

The understanding lives at THREE resolutions, each serving a different purpose:

### Resolution 1: Essay-Level Understanding (the mental model)

```typescript
interface EssayUnderstanding {
  /**
   * Rich prose: the system's developing understanding of the WHOLE essay.
   * This is the primary output — everything else derives from it.
   *
   * Grows with each pass: initial walk → deep dives → coaching → edits.
   * Should read like expert literary analysis — not a list of observations
   * but a coherent argument about what this essay is and how it works.
   *
   * Example (initial, ~300 words):
   * "This essay presents a constraint-creativity framework as its epistemology..."
   *
   * Example (after deep dives, ~500 words):
   * "This essay presents a constraint-creativity framework as its epistemology,
   *  but the framework is stated rather than earned. The writer knows the
   *  conclusion (constraints enable creativity) without having dramatized the
   *  discovery. The one moment of concrete evidence — 'users smile' in P4 —
   *  relies on external validation rather than internal recognition, suggesting
   *  the writer understands the principle intellectually but hasn't located
   *  the personal experience that would make it emotionally true..."
   *
   * Example (after coaching reveals intent, ~700 words):
   * "...The student describes their goal as 'showing versatility' — music AND
   *  coding as separate strengths. But the text argues for synthesis: 'I noticed
   *  parallels' makes coding dependent on musical thinking. This divergence
   *  between intent and text is the coaching opportunity: the synthesis reading
   *  is stronger than the versatility reading, but the student needs to choose..."
   */
  prose: string;

  /**
   * The essay's central tension — what drives it, whether the writer knows it or not.
   * NOT the thesis (what the essay argues) but the tension (what makes it interesting).
   *
   * Updated as understanding deepens. May shift dramatically after coaching
   * reveals intent that diverges from text.
   */
  centralTension: string;

  /**
   * Confirmed insights — things the system is confident about.
   * These persist across runs unless explicitly superseded.
   */
  confirmedInsights: string[];

  /**
   * Hypotheses — tentative readings that need more evidence.
   * May be confirmed, superseded, or acknowledged as ambiguous.
   */
  activeHypotheses: string[];

  /**
   * Questions the system hasn't answered yet.
   * The engine of growth — persistent across runs.
   */
  questionQueue: UnderstandingQuestion[];

  /**
   * Understanding maturity — how deep has the system gone?
   * Computed from question queue state + finding maturities + coherence.
   */
  maturity: 'initial' | 'developing' | 'deep' | 'comprehensive' | 'exhaustive';

  /**
   * Understanding growth log — tracks how understanding evolved.
   * Each entry: what changed, why, what triggered it.
   */
  growthLog: Array<{
    timestamp: string;
    trigger: 'walk' | 'deep_dive' | 'coaching' | 'edit' | 'coherence_check';
    whatChanged: string;
    previousUnderstanding?: string;  // for tracking evolution
  }>;
}
```

### Resolution 2: Paragraph-Level Understanding (the reading)

```typescript
interface ParagraphReading {
  /**
   * Rich prose: what this paragraph does, how it works, what's interesting.
   * Length varies by significance — a pivotal paragraph gets 300-400 words,
   * a transitional paragraph gets 50-100 words.
   *
   * NOT a template ("This paragraph establishes... introduces... demonstrates...").
   * A genuine reading: what the paragraph reveals about the essay's meaning-making,
   * what choices the writer made and what those choices show, what's working
   * and what's not (descriptively — HOW it works, not WHETHER it works well).
   *
   * Example for a pivotal paragraph:
   * "This paragraph is the essay's fulcrum. The writer introduces the AI DJ
   *  project not as a technical achievement but as a proof of concept for
   *  the constraint-creativity thesis: the AI must interpret 'subtle cues'
   *  (a constraint) to generate emotionally resonant music (the creative
   *  output). The single concrete moment — 'Seeing users smile' — is the
   *  essay's strongest evidence because it shows the principle working in
   *  the world, not just in the writer's head. But even here, the writer
   *  retreats: 'reaffirmed my belief in the connection between technology
   *  and human emotion' translates a specific human moment into a generic
   *  philosophical claim. The paragraph knows what to show but not how to
   *  let the showing speak for itself."
   *
   * Example for a transitional paragraph:
   * "This paragraph bridges music and coding through explicit parallel
   *  ('Just as I used notes and chords to compose, I could use code to
   *  create'). The parallel is grammatical — the sentence structure argues
   *  equivalence — but not demonstrated. It's the essay's structural pivot
   *  but its weakest intellectual moment: assertion replaces evidence."
   */
  reading: string;

  /**
   * How significant this paragraph is in the essay's architecture.
   * Determines how much analytical depth it warrants.
   */
  significance: 'pivotal' | 'substantial' | 'contributing' | 'transitional';

  /**
   * Emotional register — how this paragraph FEELS, described precisely.
   * Not "positive" or "reflective" but "quiet intellectual satisfaction
   * shading into performed wonder."
   */
  emotionalRegister: string;

  /**
   * Key craft observations — only the ones that matter.
   * NOT a forced checklist. Only note craft when it reveals something
   * about the essay's meaning-making.
   */
  craftNotes: string | null;
}
```

### Resolution 3: Findings (the structured index)

Findings are the **structured, referenceable units** that downstream systems use. They derive from the understanding prose — each one points into the prose, carries evidence, and has a scope.

```typescript
interface Finding {
  id: string;

  /**
   * The insight itself — a claim about the essay.
   * Can be about a word, a sentence, a sentence group, a paragraph,
   * a cross-paragraph pattern, or the whole essay.
   *
   * Examples at different granularities:
   * - Word: "'danced' imports performance vocabulary, signaling the writer sees
   *          music as inherently public — creation for an audience, not for self"
   * - Sentence group: "S1-S2 move from passive reception ('captivated') to active
   *                    creation ('could weave'), enacting the essay's maker-epistemology"
   * - Cross-paragraph: "The constraint-creativity framework stated in P0 is demonstrated
   *                     in P1 (chord progressions), extended in P3 (music→coding), and
   *                     proved in P4 (AI DJ) — but never tested or complicated"
   * - Essay-level: "The essay's native register is kinesthetic-concrete but it defaults
   *                 to philosophical-abstract in opening and closing, creating an
   *                 authenticity gap the writer hasn't recognized"
   */
  claim: string;

  /**
   * The scope of this finding — what part of the essay it's about.
   * Natural granularity: not forced into sentence buckets.
   */
  scope: {
    type: 'word' | 'sentence' | 'sentence_group' | 'paragraph' | 'cross_paragraph' | 'essay_level';
    paragraph?: number;
    sentences?: number[];
    paragraphs?: number[];  // for cross-paragraph findings
    /** The specific text this finding is about */
    textEvidence: Array<{
      text: string;  // quoted from essay
      location: { paragraph: number; sentence?: number };
    }>;
  };

  /**
   * How mature this finding is — drives growth decisions.
   * hypothesis: initial observation, needs investigation
   * developing: some supporting evidence, not yet confirmed
   * confirmed: strong evidence from multiple sources (walk + deep dive, or walk + coaching)
   * deepened: confirmed AND extended (connected to broader understanding, implications drawn)
   * superseded: replaced by a deeper or corrected finding
   */
  maturity: 'hypothesis' | 'developing' | 'confirmed' | 'deepened' | 'superseded';

  /**
   * How useful this finding is for coaching the student.
   * critical: directly actionable, would significantly improve the essay
   * high: important context for coaching decisions
   * medium: enriches understanding but not directly actionable
   * contextual: background — informs the reading but not a coaching target
   * diagnostic: helps the system understand the essay but irrelevant to student
   */
  coachingValue: 'critical' | 'high' | 'medium' | 'contextual' | 'diagnostic';

  /**
   * What dimension(s) of understanding this finding belongs to.
   * Used for routing and for identifying coverage gaps.
   */
  dimensions: HolisticDimension[];

  /**
   * Findings this one builds on.
   * Creates a natural tree of depth — but the tree is EMERGENT,
   * not forced by a schema.
   */
  buildsOn: string[];  // finding IDs

  /**
   * Findings this one connects to (lateral, not depth).
   */
  relatedTo: string[];  // finding IDs

  /**
   * If superseded, what replaced it.
   */
  supersededBy?: string;  // finding ID

  /**
   * What discovered this finding.
   */
  source: 'walk' | 'deep_dive' | 'coaching' | 'edit_reanalysis' | 'coherence_check';

  /**
   * What investigating this finding further might reveal.
   * null if fully explored. Used by dispatch to select deep dives.
   */
  deepeningPotential: string | null;

  /**
   * Questions this finding raises.
   */
  raisesQuestions: string[];  // question IDs
}
```

### The Sentence Participation Index (derived, not primary)

We still need per-sentence reference for L3.5 scoring, L5 annotations, and coaching routing. But instead of being the PRIMARY output (forced observation arrays), it's DERIVED from findings:

```typescript
interface SentenceParticipation {
  /** Which findings reference this sentence */
  findingRefs: string[];  // finding IDs

  /** Overall significance of this sentence in the essay's architecture */
  significance: 'pivotal' | 'contributing' | 'transitional' | 'unremarkable';

  /** Semantic tags for routing (same as current) */
  tags: string[];

  /** Connection references (same as current) */
  connectionRefs: string[];

  /**
   * Quick-reference: what this sentence primarily does.
   * Derived from the findings that reference it.
   * One sentence, not three separate observation arrays.
   */
  primaryFunction: string;
}
```

This gives L3.5 what it needs to score (it sees the findings about this sentence + the paragraph reading + the essay understanding) without forcing the walk to produce shallow observations for every sentence. Sentences that are unremarkable simply have fewer finding references and a "transitional" significance tag. Sentences that are pivotal have multiple finding references at deep maturity levels.

---

## The Upgraded Sequential Deep Walk

### What Changes

| Aspect | Current | Upgraded |
|--------|---------|---------|
| **Output per paragraph** | Forced `SentenceUnderstanding` for every sentence + `ParagraphUnderstanding` (5 fields) | Rich paragraph reading (prose) + findings at natural granularity + questions |
| **Granularity** | Always sentence-by-sentence | Natural — some sentences get deep treatment, others get mentioned in paragraph reading |
| **Holistic understanding** | 4 sparse incremental fields, full synthesis deferred to L3.75 | Evolving essay-level understanding that grows with EACH paragraph call |
| **Growth mechanism** | None — same depth on re-run | Question-driven: each call answers prior questions, raises new ones |
| **Back-propagation** | Rewrites earlier sentence observation arrays | Deepens findings about earlier text, may shift maturity levels |
| **What the prompt asks for** | "Fill this JSON schema with observations" | "Read this paragraph. What does it reveal? What don't you understand yet?" |

### Walk Output Per Paragraph Call

```typescript
interface WalkParagraphOutput {
  /** Rich reading of this paragraph — NOT a template, a genuine reading */
  paragraphReading: ParagraphReading;

  /**
   * Key findings — at whatever granularity is natural.
   * May be about one word, one sentence, a sentence group,
   * or a pattern visible from this paragraph.
   *
   * CRITICAL: only findings that are INTERESTING and MEANINGFUL.
   * Not "P2S1 uses a simile" but "P2's simile reframes composition
   * from world-creation to problem-solving, revealing what the essay
   * believes about creativity: it's not unconstrained imagination
   * but puzzle-solving in service of expression."
   *
   * A transition paragraph might produce 0-1 findings.
   * A pivotal paragraph might produce 3-5.
   * The walk decides based on what's actually there.
   */
  findings: Finding[];

  /**
   * Back-propagation: findings about EARLIER text that this paragraph
   * changes or deepens. Uses the finding system — may update maturity,
   * supersede, or add new findings about earlier passages.
   */
  retrospectiveFindings: Array<{
    /** Target: which earlier text this is about */
    targetScope: { paragraph: number; sentences?: number[] };
    /** What changed in understanding of that text */
    finding: Finding;
    /** If this supersedes an existing finding */
    supersedes?: string;  // existing finding ID
  }>;

  /**
   * Evolving essay understanding — how the mental model has changed.
   * Only include fields that actually changed.
   */
  essayUnderstandingUpdate: {
    /** If this paragraph changed the overall reading */
    proseAddition?: string;
    /** If this paragraph answered a question */
    answeredQuestions?: Array<{ questionId: string; answer: string }>;
    /** If this paragraph raised new questions */
    newQuestions?: UnderstandingQuestion[];
    /** If a hypothesis was confirmed or superseded */
    hypothesisUpdates?: Array<{
      hypothesis: string;
      newStatus: 'confirmed' | 'superseded' | 'complicated';
      evidence: string;
    }>;
    /** Central tension — only if this paragraph changes it */
    centralTensionUpdate?: string;
  };

  /**
   * Areas this paragraph flagged for post-walk deep investigation.
   * Not a fixed set of analyzers — driven by what was actually found.
   */
  deepDiveFlags: Array<{
    question: string;
    scope: { paragraphs: number[]; sentences?: number[] };
    expectedYield: string;
    /** Suggested deep dive prompt type — the walk recommends what to investigate */
    suggestedPromptType: string;
  }>;
}
```

### Walk System Prompt Evolution

The system prompt shifts from "fill this schema" to "understand this paragraph":

```
You are developing a genuine understanding of this essay — the kind a great
writing teacher builds across careful reads. Not observations, not technique
identification, but a READING: a coherent interpretation of what this essay
is doing, why it works or doesn't, and what it reveals about the writer.

=== UNDERSTANDING LEVELS ===

You should aim for the deepest level the text supports:

LEVEL 1 (insufficient): Technique identification
  "This sentence uses concrete imagery."

LEVEL 2 (minimum): Contextual function
  "The sensory registers chosen construct a world organized around physical
  transactions."

LEVEL 3 (expected): Architectural comprehension
  "The specific sensory registers construct a world where value = measurable.
  When the grandmother's story introduces value-as-memory, it disrupts this
  framework. The clash IS the essay's central tension."

LEVEL 4 (excellent): Epistemological insight
  "The essay defines understanding as physical encounter. The grandmother's
  story doesn't just add information — it challenges the essay's entire way
  of knowing. This is why the diamond can transform: same object, shifted
  framework."

LEVEL 5 (exceptional): Meta-awareness
  "The essay's commitment to physical knowing creates ironic tension with the
  college essay form, which demands reflective abstraction. The writer's voice
  is most authentic in concrete moments and most generic in philosophical ones.
  The essay unknowingly performs the constraint it describes."

Don't force higher levels on text that doesn't support them. A transition
paragraph may only warrant Level 2. But a pivotal paragraph should be pushed
toward Level 4-5 if the text supports it.

=== YOUR TASK ===

Read this paragraph in context of everything you understand so far about
this essay. Produce:

1. A READING of this paragraph (not a list of observations — a coherent
   interpretation of what it does and reveals)

2. KEY FINDINGS at natural granularity — only things that are interesting
   and meaningful. Quantity varies: 0-1 for unremarkable paragraphs,
   3-5 for pivotal ones.

3. What this paragraph CHANGES about your understanding of earlier text
   or the essay as a whole.

4. What QUESTIONS this paragraph raises that you can't answer yet.

5. What needs DEEPER INVESTIGATION after the walk completes.

=== WHAT MAKES A FINDING MEANINGFUL ===

A finding is meaningful if it would change how you coach this student OR
how you understand the essay's architecture of meaning. If removing a
finding would change nothing about coaching or understanding, it's not
meaningful — don't include it.

BAD finding (observation): "P2S1 uses a simile comparing composition
to puzzle-solving."

GOOD finding (understanding): "P2's puzzle simile reframes composition
from P0's 'create worlds through sound' (unconstrained imagination) to
structured problem-solving. This is the moment the essay shifts from
romantic to analytical epistemology — and it's significant because the
rest of the essay operates in analytical mode. The romantic voice of P0
was performed; the analytical voice of P2 is native."

=== QUESTIONS ===

Questions are the ENGINE of growth. Ask what you genuinely don't know yet:

BAD question: "What techniques are used in this paragraph?"
GOOD question: "The writer claims constraint enables creativity but
retreats to abstraction every time they approach a specific moment.
Is this a structural habit (they don't know how to write concrete
scenes) or a protective choice (the real moment feels too vulnerable
to share)?"

=== EVIDENCE GROUNDING ===

Every finding must cite specific text. But evidence isn't just quotes —
it's also ABSENCES. "The essay never shows a specific moment of
constraint becoming generative" is evidence of a gap, and it's as
important as any quoted phrase.
```

### Walk Context Accumulation (Upgraded)

Each paragraph call now receives:

**Block 1 (Cached system prompt):** As above — defines understanding levels, finding quality, question quality.

**Block 2 (Cached essay + accumulated understanding):**
- Full essay text with [P1]..[PN] markers (same as current)
- **Essay-level understanding prose** (growing — 100 words after P1, 500 words after P7)
- **Confirmed insights + active hypotheses** (growing list)
- **Question queue** with status (open/answered/partially answered)
- **All findings so far** with maturity levels
- L2 structural roles and L2.5 scout leads (same as current)

**Block 3 (Non-cached paragraph-specific):**
- Target paragraph text
- L1 first impressions for this paragraph
- Relevant connections from scout
- **Specific questions to investigate** — from prior paragraph calls or initial setup
- Re-analysis context if applicable

The key difference: the accumulated understanding isn't a structured JSON dump of 129 observations. It's the growing essay-level reading + findings. This is SMALLER (fewer tokens) and MORE INFORMATION-DENSE than the current format.

---

## Post-Walk Deep Dives: Targeted Depth, Not Fixed Analyzers

After the walk completes, the system has:
- A rich essay-level understanding
- Per-paragraph readings
- 15-25 findings at various maturity levels
- 3-8 unanswered questions
- 2-5 deep dive flags

The **dispatch system** selects 2-4 deep dives based on:

1. **Question priority** — critical and high questions first
2. **Finding maturity gaps** — areas where understanding is still at hypothesis
3. **Dimension coverage** — has every dimension been touched? (voice, emotion, epistemology, structure, craft, identity, admissions)
4. **Coaching value** — will this deep dive produce actionable coaching insight?
5. **Budget** — each deep dive costs ~$0.03-0.08 (single focused Sonnet call)
6. **Diminishing returns** — skip if prior deep dives on similar questions produced nothing new

### Deep Dive Prompt Library: Specialized, Not Generalist

**Design principle:** A prompt that tries to investigate voice AND identity AND craft produces shallow results on all three. A prompt that does ONE thing with 100% focus produces expert-level output on that one thing. Each deep dive prompt is a SPECIALIST — narrowly scoped, deeply focused. The dispatch system combines specialists based on what the essay actually needs.

Each prompt is also CHEAPER than a generalist would be (smaller, more focused output) and HIGHER QUALITY (no attention splitting).

Organized by domain. ~20 prompts total. Most essays use 3-6 per analysis pass.

```typescript
const DEEP_DIVE_PROMPTS: Record<string, DeepDivePromptTemplate> = {

  // ════════════════════════════════════════════════════════════
  // VOICE DOMAIN — how the writer sounds
  // ════════════════════════════════════════════════════════════

  /**
   * Where is the voice genuine vs performed?
   * ONLY investigates authenticity. Doesn't map register or rhythm.
   * Dispatched when: walk notices register shifts or "essay-writing voice" vs natural voice.
   */
  voice_authenticity: {
    focus: `Identify where the writer's voice is GENUINE (this is how they actually
      think and speak) vs PERFORMED (this is their "college essay voice"). Quote
      specific phrases from each mode. What triggers the shift? What would happen
      if the performed passages adopted the genuine register? What does the
      writer's authentic voice reveal that their performed voice hides?`,
    requiredContext: ['essay_understanding', 'essay_text'],
    typicalCost: 0.03,
  },

  /**
   * Maps vocabulary domains across the essay.
   * ONLY tracks word families and register geography. Doesn't assess quality.
   * Dispatched when: walk notices vocabulary shifts between domains (technical,
   * kinesthetic, abstract, emotional, etc.)
   */
  vocabulary_domain_map: {
    focus: `Map the vocabulary domains in this essay — which word families appear
      where? (e.g., kinesthetic words in P0-P1, technical words in P4-P5,
      philosophical words in P0/P6). For each domain: list specific words,
      mark their locations, identify where domains collide or blend. What does
      the geography of vocabulary reveal about how the writer relates to
      different parts of their experience?`,
    requiredContext: ['essay_understanding', 'essay_text'],
    typicalCost: 0.03,
  },

  /**
   * Analyzes sentence rhythm and what it reveals about meaning.
   * ONLY looks at rhythm patterns. Doesn't touch voice register or vocabulary.
   * Dispatched when: walk notices rhythm monotony or a standout rhythmic moment.
   */
  rhythm_meaning: {
    focus: `Analyze sentence rhythm patterns across the essay. Where does rhythm
      SUPPORT meaning (short declarative that halts momentum at a turning point)?
      Where does rhythm CONTRADICT meaning (complex compound sentence describing
      something simple)? Where is rhythm monotonous (same clause structure
      repeated without variation)? What would changing the rhythm at key moments
      do to the essay's effect?`,
    requiredContext: ['essay_understanding', 'essay_text'],
    typicalCost: 0.03,
  },

  // ════════════════════════════════════════════════════════════
  // EMOTIONAL DOMAIN — how feeling is conveyed
  // ════════════════════════════════════════════════════════════

  /**
   * Traces how a specific emotional moment is earned or unearned.
   * ONLY traces earning mechanisms for ONE moment. Doesn't survey all emotions.
   * Dispatched when: walk identifies an emotional claim that feels unmoored.
   */
  emotion_earning_trace: {
    focus: `For this specific emotional moment: trace BACKWARD through the essay.
      What earlier passages set it up? Through what mechanism (sensory grounding,
      stakes establishment, character revelation, emotional buildup)? Map each
      earning arrow. Then identify what is MISSING — what setup would make this
      moment land? Be specific: not "needs more buildup" but "needs a moment
      in P2 where the writer physically FELT the constraint before understanding
      it intellectually."`,
    requiredContext: ['essay_understanding', 'findings', 'target_moment'],
    typicalCost: 0.03,
  },

  /**
   * Maps where emotion is shown through concrete detail vs told through abstract assertion.
   * ONLY the show/tell distinction. Doesn't assess voice or craft.
   * Dispatched when: walk notices the essay TELLING emotions it should SHOW.
   */
  show_vs_tell_map: {
    focus: `For each emotional claim in the essay: is it SHOWN (embodied in
      sensory detail, physical action, specific scene) or TOLD (asserted in
      abstract language)? Quote the specific text. For each "told" moment:
      what concrete detail COULD replace the abstraction? What sensory register
      would ground it? Be specific: not "add more detail" but "replace
      'reaffirmed my belief' with a description of what the writer's body
      did when they saw the user smile."`,
    requiredContext: ['essay_understanding', 'essay_text'],
    typicalCost: 0.03,
  },

  /**
   * Detects emotional undertones — what the essay feels but doesn't say.
   * ONLY investigates subtext and implied emotion. Doesn't touch surface emotion.
   * Dispatched when: walk senses something beneath the surface content.
   */
  emotional_subtext: {
    focus: `What emotions does this essay FEEL but never explicitly name? Read
      between the lines. What anxieties, desires, fears, or hopes are present
      in the writer's choices — their word selection, what they emphasize,
      what they skip over, what they return to? The subtext often reveals
      more about the writer than the surface content. Quote specific moments
      where subtext is strongest.`,
    requiredContext: ['essay_understanding', 'essay_text'],
    typicalCost: 0.03,
  },

  // ════════════════════════════════════════════════════════════
  // THEMATIC / INTELLECTUAL DOMAIN — what the essay argues
  // ════════════════════════════════════════════════════════════

  /**
   * Traces how a specific intellectual claim is earned or merely asserted.
   * ONLY traces ONE claim. Doesn't survey all themes.
   * Dispatched when: walk identifies a central claim that's stated but not demonstrated.
   */
  claim_earning_trace: {
    focus: `For this specific intellectual claim: is it DEMONSTRATED through
      specific experience or ASSERTED through philosophical language? Trace
      the evidence: where does the essay show this claim in action? Where
      does it only describe the claim? What specific moment would transform
      assertion into demonstration? Map the gap between "the writer believes X"
      and "the essay proves X."`,
    requiredContext: ['essay_understanding', 'findings', 'target_claim'],
    typicalCost: 0.03,
  },

  /**
   * Examines the essay's epistemology — how it defines "understanding."
   * ONLY investigates the theory of knowledge. Doesn't touch craft or structure.
   * Dispatched when: walk senses a deeper framework beneath the surface argument.
   */
  epistemology: {
    focus: `How does this essay define "understanding"? Through making? Observing?
      Reflecting? Suffering? Connecting? What is the writer's theory of how
      knowledge works — and do they know they have one? Does the essay's FORM
      support or contradict this epistemology? (e.g., a maker-epistemology
      constrained by a reflective essay form.) What does the tension between
      the writer's natural mode of knowing and the essay's demanded mode reveal?`,
    requiredContext: ['essay_understanding', 'essay_text'],
    typicalCost: 0.04,
  },

  /**
   * Identifies productive tensions and contradictions within the essay.
   * ONLY investigates internal tensions. Doesn't assess quality.
   * Dispatched when: walk notices the essay arguing against itself or
   * containing unresolved contradictions.
   */
  tension_excavation: {
    focus: `What tensions exist within this essay — places where the text argues
      against itself, where two commitments pull in opposite directions, where
      the writer's claim and their evidence don't align? For each tension:
      is it PRODUCTIVE (drives the essay's meaning) or ACCIDENTAL (undermines it)?
      Could any accidental tension become productive if the writer became aware
      of it? Quote the specific text on both sides of each tension.`,
    requiredContext: ['essay_understanding', 'findings'],
    typicalCost: 0.03,
  },

  /**
   * Reads the essay's subtext — what it implies without stating.
   * ONLY investigates implication. Doesn't touch surface content.
   * Dispatched when: walk senses the essay carries meaning beneath its literal content.
   */
  subtext_reader: {
    focus: `What does this essay communicate WITHOUT saying it directly? What
      assumptions does the writer make visible through their choices? What
      does the structure itself argue (e.g., a circular structure arguing
      for return, a fragmented structure arguing for complexity)? What would
      an attentive reader understand about this writer that the writer hasn't
      explicitly stated? Quote moments where subtext is richest.`,
    requiredContext: ['essay_understanding', 'essay_text'],
    typicalCost: 0.03,
  },

  // ════════════════════════════════════════════════════════════
  // NARRATIVE / STRUCTURE DOMAIN — how the essay moves
  // ════════════════════════════════════════════════════════════

  /**
   * Identifies compressed scenes — experiences summarized rather than shown.
   * ONLY identifies compression and expansion potential. Doesn't assess quality.
   * Dispatched when: walk notices key experiences described in summary rather than scene.
   */
  scene_potential: {
    focus: `Where does the writer SUMMARIZE an experience that could be a SCENE?
      For each compressed moment: what specific details would the scene need?
      What sensory registers should be activated? What would the reader
      experience that they currently miss? Rank compressions by TRANSFORMATION
      POTENTIAL — which expansion would most change the essay's impact? Focus
      on the ONE or TWO expansions that would do the most work.`,
    requiredContext: ['essay_understanding', 'findings'],
    typicalCost: 0.03,
  },

  /**
   * Tests whether each paragraph earns its place in the essay's architecture.
   * ONLY investigates structural necessity. Doesn't assess craft or voice.
   * Dispatched when: walk suspects redundancy or structural bloat.
   */
  structural_necessity: {
    focus: `For each paragraph: what would the essay LOSE if this paragraph
      were removed? If the answer is "nothing the reader doesn't already know,"
      the paragraph is structurally redundant. If the answer is "a crucial step
      in the argument," it's load-bearing. For redundant paragraphs: what could
      replace them? For load-bearing paragraphs: are they doing their structural
      job efficiently, or spending words on the wrong things?`,
    requiredContext: ['essay_understanding', 'paragraph_readings'],
    typicalCost: 0.03,
  },

  /**
   * Maps where the essay repeats itself vs. deepens.
   * ONLY identifies repetition patterns. Doesn't fix them.
   * Dispatched when: walk notices the same idea restated across paragraphs.
   */
  redundancy_vs_deepening: {
    focus: `Trace every recurrence of a theme, claim, or image across the essay.
      For each recurrence: does it DEEPEN (add new dimension, complicate, evolve)
      or REPEAT (restate the same thing in different words)? Quote both instances.
      Map the ratio: how much of the essay's length is genuine deepening vs
      restated territory? Where could repetition become deepening with revision?`,
    requiredContext: ['essay_understanding', 'essay_text'],
    typicalCost: 0.03,
  },

  // ════════════════════════════════════════════════════════════
  // IDENTITY / CHARACTER DOMAIN — who the writer reveals themselves to be
  // ════════════════════════════════════════════════════════════

  /**
   * Excavates the writer's intellectual fingerprint — how they THINK.
   * ONLY investigates thinking patterns. Doesn't touch emotion or voice.
   * Dispatched when: walk has enough text to see patterns in how the writer reasons.
   */
  intellectual_fingerprint: {
    focus: `How does this writer THINK? What kinds of connections do they
      naturally make (analogy? cause-effect? classification? narrative?)?
      When they encounter complexity, do they simplify or embrace it? Do they
      reason through examples or through principles? What does their thinking
      pattern reveal about how they'd approach college academics? Quote
      specific moments that reveal thinking style.`,
    requiredContext: ['essay_understanding', 'essay_text'],
    typicalCost: 0.03,
  },

  /**
   * Identifies writer blind spots — what the essay can't see about itself.
   * ONLY investigates blind spots. Doesn't suggest fixes.
   * Dispatched when: walk senses the writer is unaware of something the text reveals.
   */
  blind_spot_detection: {
    focus: `What can this writer NOT SEE about their own essay? Where do they
      think they're saying one thing but the text communicates another? What
      assumptions do they make that the text reveals but they haven't examined?
      What self-image does the essay project vs. what self-image does the text
      actually construct? Be precise: quote the moment where the blind spot
      is visible and explain what the writer would see if they could step outside
      their own perspective.`,
    requiredContext: ['essay_understanding', 'paragraph_readings'],
    typicalCost: 0.03,
  },

  /**
   * Maps what values the essay reveals through action, not declaration.
   * ONLY investigates revealed vs. stated values. Doesn't touch craft.
   * Dispatched when: walk notices a gap between what the writer claims to value
   * and what the essay's choices reveal.
   */
  values_revealed: {
    focus: `What does this writer VALUE — not what they SAY they value, but what
      their essay's choices reveal? Where do they spend the most words? What
      moments do they return to? What do they skip over? What's the gap between
      declared values ("I believe in creativity and connection") and revealed
      values (the essay spends 70% on technical process)? Quote the evidence
      for revealed values.`,
    requiredContext: ['essay_understanding', 'essay_text'],
    typicalCost: 0.03,
  },

  // ════════════════════════════════════════════════════════════
  // CRAFT DOMAIN — word and sentence level patterns
  // ════════════════════════════════════════════════════════════

  /**
   * Traces how a specific image or metaphor works across the essay.
   * ONLY traces ONE image system. Doesn't survey all craft.
   * Dispatched when: walk identifies a recurring image that seems to carry meaning.
   */
  image_system_trace: {
    focus: `Trace this specific image/metaphor through the entire essay. Where
      does it appear? How does its meaning change at each appearance? What
      vocabulary domain does it activate? Does it transform, deepen, or just
      repeat? If it transforms: what does the transformation itself argue?
      Quote every appearance and map the meaning journey.`,
    requiredContext: ['essay_understanding', 'essay_text', 'target_image'],
    typicalCost: 0.03,
  },

  /**
   * Analyzes word-level precision — where words are chosen carefully vs. defaulted to.
   * ONLY investigates word choice. Doesn't touch structure or rhythm.
   * Dispatched when: walk notices the essay defaulting to generic language in key moments.
   */
  word_precision: {
    focus: `Identify the 5-8 most important word CHOICES in this essay — moments
      where a different word would change the meaning. For each: what does THIS
      word do that alternatives wouldn't? Then identify 5-8 moments of word
      DEFAULT — where the writer reached for a generic or cliched word instead
      of the precise one. For each default: what word SHOULD be there? What
      would precision unlock?`,
    requiredContext: ['essay_understanding', 'essay_text'],
    typicalCost: 0.03,
  },

  // ════════════════════════════════════════════════════════════
  // ADMISSIONS DOMAIN — how an AO reads this
  // ════════════════════════════════════════════════════════════

  /**
   * Simulates how an AO at 4pm on their 30th essay actually reads this.
   * ONLY the AO perspective. Doesn't assess craft or suggest fixes.
   * Dispatched when: walk is complete and system needs admissions context.
   */
  ao_reading_simulation: {
    focus: `Read this essay as an admissions officer on their 30th essay at 4pm.
      What grabs attention in the first 3 sentences? Where do they start
      skimming? What would they highlight to discuss in committee? What's
      the one sentence they'd quote? What's the 10-second summary they'd
      give a colleague? What type of student does this essay position —
      and is that positioning intentional or accidental? Would they remember
      this essay tomorrow?`,
    requiredContext: ['essay_understanding', 'essay_text'],
    typicalCost: 0.03,
  },

  /**
   * Tests whether this essay is interchangeable with others.
   * ONLY investigates distinctiveness. Doesn't suggest fixes.
   * Dispatched when: walk senses the essay could be about anyone.
   */
  distinctiveness_test: {
    focus: `If you changed the writer's name and specific nouns (piano → guitar,
      coding → painting), would this essay still be recognizably about THIS
      person? What makes it non-interchangeable — or what fails to? Where
      is the essay most ITSELF (only this person could have written this)
      and where is it most GENERIC (any applicant could have written this)?
      Quote specific moments at both extremes.`,
    requiredContext: ['essay_understanding', 'essay_text'],
    typicalCost: 0.03,
  },

  // ════════════════════════════════════════════════════════════
  // META DOMAIN — how the essay relates to its own form
  // ════════════════════════════════════════════════════════════

  /**
   * Investigates the gap between what the text does and what the writer intends.
   * ONLY investigates intent-text divergence. Requires coaching context.
   * Dispatched when: coaching reveals student intent that diverges from text.
   */
  intent_text_gap: {
    focus: `The writer says their goal is [STUDENT_INTENT]. The text does
      [SYSTEM_READING]. Map exactly where these diverge. For each divergence:
      is the text's reading actually stronger than the student's intent?
      Or does the intent reveal something the text should be doing but isn't?
      The goal is not to "fix" the gap but to help the student see it —
      because seeing the gap IS the revision insight.`,
    requiredContext: ['essay_understanding', 'conversation_insights', 'target_gap'],
    typicalCost: 0.03,
  },

  /**
   * Examines whether the essay's form supports or contradicts its content.
   * ONLY investigates form-content relationship. Doesn't suggest structural changes.
   * Dispatched when: walk senses the essay's structure working against its argument.
   */
  form_content_alignment: {
    focus: `Does this essay's FORM support its CONTENT? Is a chronological essay
      telling a story that would be better served by reflection? Is a reflective
      essay about a kinesthetic experience that would land better as scene?
      Does the essay's register match its subject? What does the form itself
      ARGUE — and does that argument align with the content's argument?
      Where does form serve content beautifully, and where does it fight it?`,
    requiredContext: ['essay_understanding', 'paragraph_readings'],
    typicalCost: 0.03,
  },

  // ════════════════════════════════════════════════════════════
  // UTILITY — general-purpose deepening
  // ════════════════════════════════════════════════════════════

  /**
   * Takes a specific hypothesis-level finding and investigates it.
   * ONLY deepens ONE finding. Doesn't survey.
   * Dispatched when: a specific finding needs evidence or extension.
   */
  finding_deepener: {
    focus: `You have one specific finding that needs deeper investigation.
      If it's a hypothesis: gather evidence for or against it across the
      full text. If it's developing: test it — does it hold up under scrutiny?
      If it's confirmed: extend it — what are the implications? What does it
      connect to? What coaching opportunity does it create? Push this ONE
      finding to its deepest available level.`,
    requiredContext: ['essay_understanding', 'target_finding'],
    typicalCost: 0.02,
  },

  /**
   * Full-context re-read of a specific paragraph with complete essay understanding.
   * The walk read this paragraph without knowing how the essay ends.
   * Now re-read it knowing everything.
   * Dispatched when: L3.75 identifies paragraphs where full context changes the reading.
   */
  full_context_reread: {
    focus: `Re-read this paragraph with the COMPLETE essay understanding.
      The walk read it without knowing how the essay ends — what do you
      see now that the walk couldn't? How does knowing the full arc change
      the reading of this paragraph's choices? What was invisible on first
      read that is now obvious? What findings should be updated?`,
    requiredContext: ['essay_understanding', 'all_findings', 'target_paragraph'],
    typicalCost: 0.03,
  },
};
```

### Why ~20 Specialized Prompts, Not 7 Generalists

**The bandwidth argument:** A generalist prompt like `identity_excavation` that investigates "how the writer THINKS, what they VALUE, what they ASSUME, and what they cannot see" is splitting attention 4 ways. Each investigation gets ~25% of cognitive budget. The output is shallow across all four.

Split into three specialists:
- `intellectual_fingerprint` — 100% on thinking patterns → expert-level output
- `values_revealed` — 100% on revealed vs stated values → expert-level output
- `blind_spot_detection` — 100% on what the writer can't see → expert-level output

Each produces deeper results AND costs less (smaller, focused output). Three calls at $0.03 = $0.09 total. But you only RUN the ones the essay needs — most essays trigger 3-6 deep dives from the full library of ~20.

**The extensibility argument:** New prompt types can be added without changing any existing code. Need a `cultural_context_reader` for multilingual essays? Add it. Need a `humor_mechanics` analyzer for comedic essays? Add it. The dispatch system just needs to know when to trigger it (question dimension match + scope match).

### Deep Dive Output

Each deep dive produces:
- **Deepened or new findings** — fed back into the finding store
- **Answered questions** — update the question queue
- **New questions** — may spawn further investigation
- **Understanding evolution** — prose additions to the essay-level understanding

### Dispatch Algorithm

The dispatch now uses L3.75's curated question queue (with prompt recommendations) as its PRIMARY input, supplemented by dimension coverage and finding maturity analysis.

```typescript
function selectDeepDives(
  curatedQuestions: QuestionCurationOutput,
  findings: Finding[],
  dimensionState: Record<UnderstandingDimension, DimensionDepth>,
  rewardHistory: StepReward[],
  budget: number,
  maxDives: number = 6,
): DeepDiveRequest[] {
  const candidates: ScoredCandidate[] = [];

  // 1. L3.75-curated questions (PRIMARY signal — already quality-filtered and prompt-matched)
  for (const cq of curatedQuestions.curatedQueue) {
    const q = cq.question;
    candidates.push({
      question: q.question,
      promptType: cq.recommendedPrompt,
      promptRationale: cq.promptRationale,
      score: priorityScore(q.priority) + yieldScore(q.expectedYield),
      cost: DEEP_DIVE_PROMPTS[cq.recommendedPrompt].typicalCost,
      source: 'curated_question',
    });
  }

  // 2. Dimension coverage gaps (from per-dimension understanding state)
  for (const [dim, depth] of Object.entries(dimensionState)) {
    if (depth.level === 'unexplored' || depth.level === 'noticed') {
      const promptType = DIMENSION_TO_PROMPT[dim as UnderstandingDimension];
      if (promptType && !candidates.some(c => c.promptType === promptType)) {
        candidates.push({
          question: `${dim} dimension at '${depth.level}' — needs investigation`,
          promptType,
          score: depth.level === 'unexplored' ? 0.7 : 0.4,
          cost: DEEP_DIVE_PROMPTS[promptType].typicalCost,
          source: 'dimension_gap',
        });
      }
    }
  }

  // 3. Hypothesis findings needing evidence
  for (const f of findings) {
    if (f.maturity === 'hypothesis' && f.coachingValue !== 'diagnostic') {
      // Skip if a curated question already targets this finding
      const alreadyTargeted = candidates.some(c =>
        c.source === 'curated_question' && c.question.includes(f.claim.slice(0, 40))
      );
      if (!alreadyTargeted) {
        candidates.push({
          question: `Investigate hypothesis: ${f.claim}`,
          promptType: 'finding_deepener',
          score: coachingValueScore(f.coachingValue) * 0.5,
          cost: 0.02,
          source: 'hypothesis_finding',
        });
      }
    }
  }

  // 4. Check for diminishing returns — if last 2 deep dives had low reward, raise bar
  const recentRewards = rewardHistory.slice(-2);
  const diminishingReturns = recentRewards.length >= 2 &&
    recentRewards.every(r => r.reward < CONVERGENCE_THRESHOLD);
  const minScore = diminishingReturns ? 0.6 : 0.3;

  // Sort by score, apply budget + score threshold
  candidates
    .filter(c => c.score >= minScore)
    .sort((a, b) => b.score - a.score);

  const selected: DeepDiveRequest[] = [];
  let remaining = budget;
  for (const c of candidates) {
    if (selected.length >= maxDives) break;
    if (c.cost > remaining) continue;
    // Avoid running two prompts from the same domain back-to-back
    // (diversity in investigation > depth in one area)
    selected.push(c);
    remaining -= c.cost;
  }

  return selected;
}

/**
 * Dimension → default prompt mapping.
 * Used when a dimension is 'unexplored' or 'noticed' and no specific question targets it.
 * L3.75's curated questions override this — these are fallback coverage prompts.
 */
const DIMENSION_TO_PROMPT: Record<UnderstandingDimension, string> = {
  voice: 'voice_authenticity',
  theme: 'tension_excavation',
  narrative: 'structural_necessity',
  emotion: 'show_vs_tell_map',
  character: 'intellectual_fingerprint',
  craft: 'word_precision',
  epistemology: 'epistemology',
  admissions: 'ao_reading_simulation',
  absence: 'scene_potential',
  coherence: 'redundancy_vs_deepening',
};
```

---

## Layer-by-Layer Upgrade Map

### L1 (First Impressions) — Minimal Change
L1 stays as-is: Haiku quick scan producing per-paragraph impressions. These become the "scaffold" that the walk uses as starting points. No structural change needed.

### L2 (Structural Cartography) — Minimal Change
L2 stays as-is: paragraph roles, arc, transitions. Feeds structural context to the walk.

### L2.5 (Connection Scout) — Minimal Change
L2.5 stays as-is: surface-level cross-paragraph connection leads for the walk to investigate.

### L3 (Sequential Deep Walk) — MAJOR UPGRADE
The core of this plan. Walk output shifts from observation arrays to:
- Rich paragraph readings (prose)
- Findings at natural granularity
- Evolving essay-level understanding
- Question queue

Prompt shifts from "fill this schema" to "develop understanding."
Back-propagation shifts from observation array replacement to finding updates.

### L3.75 (Holistic Synthesis) — ROLE CHANGE + QUESTION CURATION

Currently: synthesizes 10 holistic sections from scratch by reading ALL walk output.
New role: **validates, deepens, and curates questions** for targeted investigation.

The walk now produces a growing essay-level understanding throughout its paragraph calls. L3.75 doesn't synthesize from scratch — it reads the walk's understanding and:
1. Validates it against the simultaneous full-text view (the walk read sequentially; L3.75 sees everything at once)
2. Fills gaps the sequential read couldn't see (cross-essay patterns that aren't visible paragraph-by-paragraph)
3. Challenges or complicates the walk's hypotheses
4. Produces the finalized holistic sections (voice, emotion, theme, etc.) — these are STILL produced, but now they're grounded in the walk's rich understanding rather than derived from flat observation arrays
5. **Curates the question queue** — the critical new responsibility

The holistic sections remain structured (VoiceIdentity, EmotionalTopography, etc.) because downstream systems need them. But they're now derived from DEEPER source material.

#### Why Question Curation Lives in L3.75 (Not a Separate Layer)

Questions emerge from two natural perspectives already in the pipeline:
- **During the walk** — each paragraph raises questions sequentially ("This claim in P2 — will it be earned later?")
- **After the walk in L3.75** — the full-context view raises questions the sequential read couldn't see

A separate "questioning layer" would add cost without adding a perspective. L3.75 ALREADY reads the complete walk output with simultaneous full-text view — that's exactly the right vantage point for question curation.

L3.75's question responsibilities:

**1. Quality filter on walk questions:**
The walk produces 3-8 questions per essay. Some are genuine mysteries ("Is the abstraction pattern a protective choice or a skill gap?"). Others are just unfinished walk work ("What techniques appear in P5?" — answerable by re-reading, not by investigation). L3.75 filters:
- **Keep:** Questions that require investigation BEYOND the text itself (intent, deeper patterns, meta-awareness)
- **Answer:** Questions that the full-context view can now resolve (the walk asked "will the constraint claim be earned?" and L3.75 can see the full arc)
- **Discard:** Questions that are generic or could be answered by re-reading more carefully

**2. Cross-essay questions the walk can't ask:**
The walk reads paragraph-by-paragraph. Some questions only become visible with the simultaneous view:
- "The voice shifts from kinesthetic to abstract three separate times — is this intentional or a habit?"
- "P0 and P6 use nearly identical vocabulary but P0 feels genuine and P6 feels performed — why?"
- "The essay's structure mirrors the musical form it describes (theme/variation/resolution) — is the writer aware of this?"

**3. Question prioritization for dispatch:**
L3.75 sees which questions would most deepen understanding AND most improve coaching. It ranks the final question queue by:
- **Would answering this change how we coach?** (critical priority)
- **Would answering this deepen the essay-level understanding?** (high priority)
- **Would answering this fill a dimension gap?** (medium priority)
- **Is this interesting but not actionable?** (low priority — investigate only if budget allows)

**4. Deep dive recommendations:**
L3.75 maps each curated question to the most appropriate deep dive prompt from the library. Not a fixed mapping — L3.75 reads the question's scope and dimension and recommends the specialist prompt that would best investigate it.

```typescript
// L3.75 produces this alongside holistic sections:
interface QuestionCurationOutput {
  /** Walk questions that L3.75 answered with full-context view */
  resolvedQuestions: Array<{
    questionId: string;
    answer: string;
    evidence: string;
  }>;

  /** Walk questions kept + new questions L3.75 raised */
  curatedQueue: Array<{
    question: UnderstandingQuestion;
    /** Which deep dive prompt would best investigate this */
    recommendedPrompt: string;
    /** Why this prompt (not just dimension matching — reading-strategy-aware) */
    promptRationale: string;
  }>;

  /** Walk questions filtered out (with reason, for transparency) */
  filteredQuestions: Array<{
    questionId: string;
    filterReason: 'answerable_by_rereading' | 'too_generic' | 'already_covered_by_findings';
  }>;
}

### L3.5 (Analysis Pass) — MODERATE UPGRADE
Currently references `[U1], [U2]` observation labels.
New approach: references findings by ID + has access to paragraph readings + essay understanding.

L3.5 no longer scores based on a bag of sentence observations. It scores based on:
- The paragraph's reading (how the understanding interprets this paragraph)
- The findings relevant to this paragraph (with maturity and coaching value)
- The essay-level understanding (how this paragraph serves the whole)

This gives MUCH better scoring context. The analysis pass can now say: "P1 scores 45 because, as the reading identifies, it promises sensory experience but delivers philosophy — the opening image is performed rather than felt, and the constraint-creativity framework is stated without being earned through the kind of specific experience that P4 later demonstrates is possible."

### L4 (Crystallizer) — MODERATE UPGRADE
North Star construction is enriched by the deeper understanding. The through-line map can now trace not just where an element appears but how its MEANING transforms — because the walk's findings track meaning at Level 3-5, not just technique at Level 1-2.

Score matrix calibration is more precise because L3.5 had better context.

Coherence report can now check coherence between the walk's essay-level understanding, the holistic sections, and the North Star — three levels of interpretation that should align.

### L5 (Deep Annotation) — MODERATE UPGRADE
Annotations are generated from findings + essay understanding instead of from observation arrays. This produces annotations that explain WHY something matters in the essay's architecture, not just WHAT technique is present.

### L6 (Coaching) — ENHANCED INTEGRATION
Coaching conversations now feed back into the understanding system more richly:
- Student confirmations → finding maturity upgrades (hypothesis → confirmed)
- Student reinterpretations → finding supersession + new findings
- Student new context → essay understanding evolution + new questions
- Student resistance → questions about what the system might be missing

The question queue is the bridge: coaching produces questions that the next analysis pass can investigate.

### Re-Analysis — COMPOUND GROWTH
This is where the revolution pays off:

**Current re-analysis:** Re-runs the walk, produces roughly the same observations.
**New re-analysis:** The walk receives its OWN PRIOR UNDERSTANDING as context.

The prompt literally says: "Here is what you understood last time. The student has changed [X]. How does this change your understanding? What new questions does it raise? What findings are superseded? Don't re-observe — deepen."

This is how understanding compounds:
- Pass 1: Walk produces initial reading + findings + questions ($0.40)
- Pass 1 deep dives: 3 targeted investigations, answers 4 questions, raises 2 new ones ($0.12)
- Coaching turn: Student reveals intent. 2 questions answered, 1 new question ($0.02)
- Student edits P1: Re-walk P1 with prior understanding context. 1 finding superseded, 2 deepened ($0.04)
- Pass 2 deep dive: Investigates how P1 edit changes earned-ness architecture ($0.04)
- Total: Understanding has grown through 5 growth events. Question queue tracks what's known, what's tentative, what's still open. Findings have maturity levels showing depth of understanding. The essay-level prose has evolved from 300 words to 700+ words of genuine literary analysis.

---

## The Deep Dive Dispatch: When and What

### First Analysis (comprehensive)
- Walk: all paragraphs ($0.30-0.50)
- Post-walk deep dives: 2-4 based on walk findings ($0.08-0.20)
- L3.75 validation: 1 call ($0.03-0.05)
- Total understanding cost: $0.41-0.75

### After Coaching (on demand)
- High-value insights (reinterpretation, new context): may trigger 1 deep dive ($0.03-0.05)
- Most coaching turns: no deep dive needed (understanding is sufficient)

### After Edits (mode-selected)
- Focused edit (word/sentence change): re-walk 1 paragraph with prior understanding ($0.04-0.08)
- Structural edit: selective re-walk + 1 deep dive on structural implications ($0.08-0.15)
- Major rewrite: comprehensive re-walk (but with prior understanding as context) ($0.20-0.40)

### Growth Budget
- First analysis: up to $1.00 for understanding (walk + deep dives + L3.75)
- Re-analysis budget: $0.03-0.15 per edit cycle
- Coaching deepening: $0.01-0.05 per turn
- Total across 5 rounds: $1.50-2.00 (vs current ~$1.50 that produces the SAME depth every time)

---

## Quality Gates: How We Know It's Working

### Understanding Quality Rubric

**Prose Depth Test:** Read the essay-level understanding prose. Does it read like a literary scholar's analysis or like a list of observations disguised as prose? Score 1-5:
1. Observations listed in paragraph form ("The essay uses imagery. It also uses parallel structure.")
2. Functions described ("The imagery grounds the reader. The parallel structure connects music and coding.")
3. Architecture comprehended ("The imagery constructs a physical-transaction world that the grandmother's story disrupts.")
4. Epistemology identified ("The essay defines understanding as physical encounter.")
5. Meta-awareness achieved ("The essay unknowingly performs the constraint it describes.")

**Gate:** Average prose depth ≥ 3.0 across paragraphs, with at least one passage reaching 4+.

### Finding Quality Rubric

**Depth Test:** Do findings reach beyond function to architecture? Score each finding:
- Level 1: Technique identification ("uses imagery")
- Level 2: Contextual function ("imagery constructs a transaction world")
- Level 3: Architectural comprehension ("the transaction world enables the meaning-shift when memory is introduced")
- Level 4+: Epistemological or meta-level insight

**Gate:** ≥50% of findings at Level 3+. ≥20% at Level 4+.

### Growth Test

**Compound Growth:** After 3 growth steps (walk → deep dive → coaching), is the understanding measurably deeper?
- Question queue progress: ≥60% of initial questions answered or spawned deeper questions
- Finding maturity: ≥40% of findings at "confirmed" or "deepened"
- Essay understanding prose: 50%+ longer AND qualitatively deeper (not just more words)

**Gate:** All three metrics met.

### Anti-Regression Tests

- **Piano essay:** understanding should identify the unearned constraint-creativity claim AND the abstraction-vs-embodiment pattern AND the voice inauthenticity in philosophical register
- **Excellent essay:** understanding should identify what makes it distinctive, not just what it does well
- **Weak essay:** understanding should identify structural problems through the meaning they fail to make, not just through technique absence

---

## Implementation Phases

### Phase 1: Walk Output Format (3-5 days)
**Goal:** The walk produces understanding prose + findings + questions instead of observation arrays.

1. Define new types (`EssayUnderstanding`, `ParagraphReading`, `Finding`, `UnderstandingQuestion`, `SentenceParticipation`)
2. Write new walk system prompt (understanding levels, finding quality, question quality)
3. Implement walk output parser (prose + findings + questions from LLM JSON)
4. Build sentence participation index derivation (from findings → per-sentence refs)
5. Run against piano essay, compare output quality to current system
6. **Compatibility shim:** generate legacy `SentenceUnderstanding` from findings for L3.5/L5/L6 until they're upgraded

**Risk:** LLM might produce shallow prose if the prompt isn't calibrated well. Mitigate with iterative prompt tuning against 3 test essays.

### Phase 2: Deep Dive Mechanism (2-3 days)
**Goal:** Post-walk targeted investigations that deepen understanding.

1. Implement deep dive prompt library (5-7 templates)
2. Implement dispatch algorithm (question priority + coverage + budget)
3. Build deep dive runner (instantiate prompt with walk context + target question)
4. Build finding integration (merge deep dive findings into main finding store, update maturities)
5. Build question queue management (answer tracking, child question spawning)
6. Test: walk + 3 deep dives should produce measurably deeper understanding than walk alone

### Phase 3: L3.75 Role Change (1-2 days)
**Goal:** L3.75 validates and deepens walk understanding instead of synthesizing from scratch.

1. Update L3.75 prompt: receives walk's essay understanding + findings as input (not raw observations)
2. L3.75 checks coherence between walk's reading and full-text view
3. L3.75 fills holistic sections (voice, emotion, etc.) grounded in walk's understanding
4. Test: L3.75 output should be consistent with walk's understanding AND add cross-essay insights the sequential read missed

### Phase 4: L3.5 Upgrade (2-3 days)
**Goal:** Analysis pass scores based on understanding prose + findings, not observation labels.

1. Update L3.5 prompt: receives paragraph reading + relevant findings + essay understanding
2. Scoring references findings by ID instead of `[U1]` observation labels
3. Test: scoring quality should improve (because context is richer)
4. Remove compatibility shim from Phase 1

### Phase 5: Growth Compound (2-3 days)
**Goal:** Re-analysis and coaching produce genuine understanding growth.

1. Update re-analysis to pass prior understanding as context
2. Walk prompt for re-analysis: "Here's what you understood. What changed?"
3. Coaching insight integration: finding maturity updates, question queue updates
4. Test: 3 growth steps (walk → deep dive → coaching) produce measurably deeper understanding
5. Test: re-analysis after edit produces understanding that builds on (not repeats) prior pass

### Phase 6: Quality Calibration (2-3 days)
**Goal:** System consistently reaches Level 3+ understanding with Level 4-5 on pivotal moments.

1. Run against 5 diverse essays (strong/weak/creative/conventional/short)
2. Score against quality rubric (prose depth, finding quality, growth test)
3. Iterate prompts based on where understanding is shallow
4. Establish baseline metrics for ongoing quality monitoring

### Phase 7: Profile Type Migration (1-2 days)
**Goal:** Clean removal of legacy types, final type system.

1. Remove `ObservationEntry` arrays from sentence understanding
2. Remove legacy `SentenceUnderstanding` type
3. Update `ParagraphProfile` to use new `ParagraphReading`
4. Add `EssayUnderstanding` to `EssayProfile` as primary understanding layer
5. Update all downstream consumers (annotations, coaching, scoring)

**Total estimated implementation: 13-21 days across phases.**
Each phase produces working, testable output. No big-bang migration.

---

## What This Enables (The Payoff)

### For the Student
- Coaching grounded in genuine understanding, not observations
- Feedback that addresses the essay's MEANING, not just its techniques
- A system that grows smarter about THEIR essay with every interaction
- Insights they wouldn't get from a human tutor reading for 5 minutes — because the system has done the equivalent of 3 careful reads with focused investigation

### For the System
- Understanding that COMPOUNDS instead of repeating
- A question-driven growth engine that never stagnates
- Natural-granularity analysis (not forced sentence-by-sentence)
- Deep dives triggered by what's actually interesting, not by fixed analyzer lists
- Clear maturity tracking that shows where understanding is deep and where it's shallow

### For Quality
- Prose-based understanding eliminates the "129 shallow observations" problem
- Finding maturity prevents the system from presenting hypotheses as confirmed
- The question queue ensures the system always knows what it doesn't know
- Coherence checks catch contradictions between understanding levels
- Growth metrics prove the system is actually deepening, not just accumulating

---

## Formal Convergence & Self-Improvement (From AutoResearch-RL — arxiv 2603.07300)

> **Research integration**: The AutoResearch-RL paper describes an RL agent that iteratively improves neural architectures by accumulating experimental trajectories and computing convergence via reward signals. Three ideas transfer directly to our understanding system. Others (PPO policy updates, neural architecture search mechanics) don't apply.

### 1. Formal Convergence via Reward Signal

PLAN2 says "diminishing returns" signals completion. That's too vague — the system needs to MEASURE convergence, not sense it. The paper provides the mechanism: compute a scalar reward after each growth step, stop when reward drops below threshold.

#### Understanding Reward Function

```typescript
interface StepReward {
  /** Which growth step this measures */
  step: string;  // 'walk_P3', 'deep_dive_2', 'coaching_turn_5'

  // Raw metrics
  questionsResolved: number;
  questionsRaised: number;
  findingsAdded: number;
  findingsDeepened: number;     // existing findings that gained maturity
  findingsSuperseded: number;   // earlier findings corrected by deeper understanding
  dimensionMovements: number;   // how many dimensions gained a depth level

  /** Composite reward — weighted sum of the above */
  reward: number;
}

/**
 * Compute reward for a growth step.
 *
 * High reward = significant depth gained.
 * Low reward = surface-level additions, diminishing returns.
 * Negative reward = step wasted budget (nothing new, no depth, no corrections).
 */
function computeStepReward(delta: GrowthStepDelta): number {
  const weights = {
    questionResolved: 3.0,      // answering questions is the highest-value activity
    findingDeepened: 2.0,        // deepening > discovering (compounding!)
    findingSuperseded: 2.5,      // correcting earlier understanding = genuine growth
    findingAdded: 1.0,           // new findings have value but less than deepening
    dimensionMovement: 1.5,      // reaching a new depth level in any dimension
    questionRaised: 0.5,         // new questions have slight positive value (show engagement)
  };

  return (
    delta.questionsResolved * weights.questionResolved +
    delta.findingsDeepened * weights.findingDeepened +
    delta.findingsSuperseded * weights.findingSuperseded +
    delta.findingsAdded * weights.findingAdded +
    delta.dimensionMovements * weights.dimensionMovement +
    delta.questionsRaised * weights.questionRaised
  );
}
```

#### Convergence Algorithm

```
CONVERGENCE_THRESHOLD = 2.0      // minimum reward for a step to be "worth it"
CONSECUTIVE_LOW_STEPS = 2         // stop after N consecutive below-threshold steps

After each growth step (deep dive, coaching-triggered re-analysis):
  1. Compute reward for this step
  2. Append to reward history
  3. Check:
     CONVERGED if:
       a. Last 2 consecutive rewards < CONVERGENCE_THRESHOLD
       b. OR: no critical questions remain AND last reward < 4.0
       c. OR: budget exhausted

     NOT CONVERGED if:
       a. Critical questions remain AND budget available
       b. OR: any dimension at 'unexplored' or 'noticed' AND budget available

  4. If converged → proceed to Analysis Pass (L3.5)
     If not → dispatch next deep dive from question queue
```

This gives the system a **formal stopping criterion** — not "run 3 deep dives because that's the plan" but "run dives until understanding gains plateau." Some essays converge in 1 dive (simple narrative, clear voice). Others need 4+ (complex, layered, many tensions).

### 2. Per-Dimension Understanding State (MDP State)

The paper formalizes the agent's state as measurable properties. PLAN2's maturity tracking is per-finding, but the system also needs per-DIMENSION depth tracking. Without it, the system can't detect asymmetries like "voice is deeply understood but epistemology is only noticed."

```typescript
type UnderstandingDimension =
  | 'voice'          // how the writer sounds, where authentic vs performed
  | 'theme'          // what the essay argues, its conceptual architecture
  | 'narrative'      // how the story moves, its structural logic
  | 'emotion'        // how feeling is conveyed, earned vs asserted
  | 'character'      // who the writer reveals themselves to be
  | 'craft'          // word/sentence-level patterns and choices
  | 'epistemology'   // how the essay knows what it claims
  | 'admissions'     // how an AO reads this, what it positions
  | 'absence'        // what's NOT here that should be
  | 'coherence';     // how the essay's parts serve its whole

interface DimensionDepth {
  level: 'unexplored' | 'noticed' | 'understood' | 'deeply_understood';
  /** Number of findings touching this dimension */
  findingCount: number;
  /** Highest maturity of any finding in this dimension */
  highestMaturity: FindingMaturity;
  /** Last growth step that updated this dimension */
  lastUpdated: string;
}

interface UnderstandingState {
  dimensions: Record<UnderstandingDimension, DimensionDepth>;
  rewardHistory: StepReward[];
  isConverged: boolean;
  convergenceReason?: 'reward_plateau' | 'questions_exhausted' | 'budget_exhausted';
  /** What % of essay text has been cited as evidence in findings */
  textEngagementRatio: number;
}
```

**How dimension tracking improves dispatch**: The deep dive dispatch algorithm (already in PLAN2) gains a new signal. Before selecting a deep dive, check dimension coverage. If `epistemology` is at `'noticed'` while everything else is `'understood'`, the dispatch should prioritize an epistemological investigation — even if no specific question targets it. This catches systematic blind spots the question queue alone might miss.

**Dimension depth transition rules**:
- `unexplored → noticed`: first finding touches this dimension
- `noticed → understood`: 2+ findings at 'developing' or higher in this dimension
- `understood → deeply_understood`: 3+ findings at 'confirmed' or 'deepened', AND at least one finding at Level 4+ (epistemological or deeper)

### 3. Reading Strategy as Evolving Meta-State

The paper's agent learns a POLICY — not just what the problem looks like, but what kinds of modifications are effective for THIS problem. The walk equivalent: developing a meta-understanding of HOW to read this specific essay, separate from WHAT the essay says.

**What a Reading Strategy contains**:

```typescript
interface ReadingStrategy {
  /**
   * Meta-understanding of how to read this specific essay.
   * Evolves across growth steps. Informs deep dives and re-analysis.
   *
   * Example:
   * "This essay rewards attention to vocabulary domain shifts — the transitions
   *  between technical, kinesthetic, and reflective registers are where meaning
   *  is made. The writer's craft is strongest in procedural descriptions and
   *  weakest in emotional disclosure. Cross-paragraph connections are dense
   *  in P0-P3 (music domain) but sparse in P3-P4 (music→coding bridge).
   *  The essay's implicit argument (making-as-knowing) is more interesting
   *  than its explicit argument (constraint enables creativity)."
   */
  strategy: string;

  /**
   * What reading approach yields the deepest understanding of this essay?
   * Informs deep dive prompt selection and re-analysis focus.
   */
  bestApproach: string;

  /**
   * What this essay is NOT — to prevent the system from forcing irrelevant
   * frameworks onto the text.
   * Example: "This is NOT a trauma essay, NOT a diversity essay, NOT a
   *  leadership essay. It's an intellectual-identity essay that happens
   *  to involve music and coding."
   */
  antiPatterns: string[];
}
```

**When Reading Strategy is produced**: After the walk completes (added to L3.75's deepening pass). Updated after coaching reveals student intent.

**How Reading Strategy improves the system**:
- **Deep dives** use it to focus: "Given that this essay rewards attention to vocabulary shifts, trace the vocabulary domains across all paragraphs" vs. a generic "analyze the voice."
- **Re-analysis** uses it to prioritize: "This essay's implicit argument matters more than its explicit claim. When the student edits P3, check whether the edit strengthens the implicit argument."
- **Coaching** uses it to set expectations: "The writer's authentic voice is procedural. Don't push for emotional disclosure — push for deeper procedural specificity."
- **Prevents misreading**: antiPatterns stop the system from applying stock frameworks that don't fit.

### 4. Adaptive Pass Count (Not Fixed Pipeline)

PLAN2 implies: walk → 2-4 deep dives → L3.75 → L3.5. The paper says: let convergence determine the number.

**Updated pipeline with adaptive stopping**:

```
Phase 0: Fast Foundation (L1, L2, L2.5)         — always runs
Phase 1: Walk (L3 — paragraph by paragraph)      — always runs
Phase 2: Full-Context Deepening (L3.75 adapted)   — always runs
          → produces Reading Strategy
          → convergence check #1
Phase 3: Deep Dives (question-driven)             — 0 to 6, adaptive
          → convergence check after each dive
          → stop when converged OR budget exhausted
Phase 4: Analysis Pass (L3.5)                     — always runs
Phase 5: Crystallization + Feedback (L4, L5)      — always runs
```

**Typical pass counts by essay type**:

| Essay Type | Walk | Deepening | Deep Dives | Total Understanding Cost |
|------------|------|-----------|------------|-------------------------|
| Simple narrative, clear voice | full | 1 | 0-1 | $0.35-0.50 |
| Standard essay, some depth | full | 1 | 2-3 | $0.50-0.70 |
| Complex, layered, many tensions | full | 1 | 3-5 | $0.65-0.90 |
| Exceptional/unusual essay | full | 1 | 4-6 | $0.80-1.10 |

The system spends proportionally to the essay's depth — simple essays don't waste budget, complex ones get the attention they warrant.

### 5. Full-Context Re-Read (Distinct from L3.75)

L3.75 currently validates the walk's understanding from a simultaneous view. But there's a distinct operation the paper suggests: a complete RE-READ of key paragraphs with the full understanding document as context.

**When the walk reads P1, it doesn't know how the essay ends.** The full-context re-read takes the final understanding and re-reads P1 (and other key paragraphs) knowing the full arc. This is where the deepest insights emerge:

> "Now that I know the seven-notes motif IS the essay's central argument, I can see that P1's opening line isn't just scene-setting — it's planting the constraint-possibility paradox that drives the entire essay. But P1 plants it as received wisdom ('from the moment...') rather than as discovery, which is why the essay's central claim feels unearned by PN."

**This is NOT another full walk**. It's 1-2 targeted re-reads of the paragraphs where full-essay context changes the reading most. The deepening pass (L3.75) identifies which paragraphs to re-read:

```typescript
interface DeepeningPassOutput {
  /** Deepened essay understanding */
  updatedUnderstanding: string;

  /** Reading strategy (new) */
  readingStrategy: ReadingStrategy;

  /** Which paragraphs would benefit from re-reading with full context */
  reReadCandidates: Array<{
    paragraph: number;
    reason: string;  // "Full-essay context changes the reading of P1 because..."
    expectedDepthGain: 'significant' | 'moderate';
  }>;

  /** Holistic sections (kept — voice, emotion, theme, etc.) */
  holisticSections: HolisticSynthesisOutput;
}
```

If `reReadCandidates` has entries with `'significant'` expected depth gain, the system does a targeted re-read before proceeding to deep dives. This is the paper's "second iteration" — but targeted, not exhaustive.

---

## Principles (Non-Negotiable)

1. **The essay is the ceiling, not the architecture.** The system should be able to go as deep as any essay warrants. If the architecture limits depth, the architecture is wrong.

2. **Understanding is prose, not data.** The primary output is a coherent reading, not a bag of observations. Structured data is derived from understanding, not the other way around.

3. **Questions drive growth.** Every analysis step produces questions. Unanswered questions drive the next step. Understanding is mature when questions are exhausted.

4. **Natural granularity.** Some sentences are unremarkable. Some are the essay's intellectual core. The system decides what deserves attention based on what's actually there.

5. **Never settle for observation when understanding is possible.** "This sentence uses imagery" is never acceptable output. "This imagery constructs a physical-transaction world that the grandmother's story will disrupt" is the minimum.

6. **Compound, don't repeat.** Every re-analysis must build on prior understanding. The system should never produce the same insight twice.

7. **The three-layer separation is sacred.** Understanding (what IS) → Analysis (how WELL) → Feedback (what to DO). This plan upgrades understanding. Analysis and feedback benefit from deeper understanding but maintain their separation.

8. **Convergence is measured, not sensed.** Every growth step produces a quantifiable reward signal. The system stops when convergence is proven — not when it runs out of things to try. (From AutoResearch-RL: "the agent accumulates a growing trajectory of experiment outcomes and uses them to inform subsequent proposals.")

9. **Learn how to read, not just what it says.** The Reading Strategy evolves separately from the understanding content. The system learns WHAT this specific essay rewards attention to — vocabulary shifts, procedural voice, absence patterns — and uses that meta-knowledge to read more intelligently on subsequent passes.

---

## Implementation Status

### Cluster A: Finding Lifecycle (#1) + Bidirectional Connections (#3) — COMPLETE

**Implemented**: March 2026

**Files created**:
- `src/services/essayIntelligence/findings/findingStore.ts` (461 lines) — Pure CRUD + graph ops, append-only
- `src/services/essayIntelligence/findings/findingContextBuilder.ts` (362 lines) — Token-aware LLM context serialization
- `src/services/essayIntelligence/findings/index.ts` — Barrel export
- `src/services/essayIntelligence/connections/connectionGraph.ts` (415 lines) — Bidirectional graph + structural analysis
- `src/services/essayIntelligence/connections/connectionContextBuilder.ts` (164 lines) — Graph context serialization
- `src/services/essayIntelligence/connections/index.ts` — Barrel export
- `tests/test-finding-lifecycle.ts` (885 lines, 134 assertions)
- `tests/test-connection-graph.ts` (419 lines, 72 assertions)

**Types added to `profileTypes.ts`**:
- `Finding`, `FindingMaturity`, `FindingCoachingValue`, `FindingSource`, `FindingScope`, `FindingEvidence`, `FindingLineageEntry` (lines 1842-2018)
- `Connection`, `ConnectionEndpoint`, `ConnectionRoutingTag`, `ConnectionStrengthCategory`, `ConnectionDirectionality`, `ConnectionSource` (lines 217-273)

**Files modified**:
- `src/services/essayIntelligence/profileTypes.ts` — Finding + Connection V2 type definitions
- `src/services/essayIntelligence/profileManager/mutators/connectionMutator.ts` — V2 connection CRUD with bidirectional detection, scout lead conversion, validation
- `src/services/essayIntelligence/profileManager/profileRouter.ts` — Connection-driven context assembly, adaptive token budgeting, task priority reweighting

**Key design decisions that diverged from or refined the plan**:

1. **Two separate graph managers**: `FindingStore` (standalone, for findings) and `ConnectionGraph` (standalone, for connections) are independent of the profile. `ConnectionMutator` is the profile integration layer. This separation lets the finding store be used in contexts where no full profile exists (e.g., unit tests, coaching session with partial data).

2. **Strength-only-upgrade on duplicate**: When a duplicate connection is found (same endpoints), strength only upgrades, never downgrades. This prevents a later layer (e.g., Haiku scout re-run) from weakening a connection that a Sonnet walk confirmed.

3. **Reverse supersession chain follows `buildsOn`**: `getReverseSupersessionChain` walks backward through `buildsOn[0]` (primary parent), not through `supersededBy`. This traces the intellectual lineage from initial hypothesis to final depth, which is different from the supersession chain (which traces replacement).

4. **Orphaned depth trees accepted**: When F1 is superseded and F5 `buildsOn: ['F1']`, F5 is not a root in `getDepthTrees()` because its `buildsOn` is non-empty. This means some active findings are unreachable from depth tree roots. This is by design — depth trees show rootless findings, not the complete graph. The supersession chain API serves the evolution-tracking use case.

5. **ConnectionMutator vs ConnectionGraph ID schemes**: `ConnectionMutator` uses `conn_{timestamp}_{counter}` IDs (for profile persistence). `ConnectionGraph` uses `C1, C2, ...` IDs (for standalone analysis). The graph's `fromArray` method handles either scheme.

**Rigidity audit result**: Clean. All judgment is LLM-assigned. System handles bookkeeping only. No closed taxonomies for perception, no post-hoc quality filtering, no deterministic scoring formulas.

**Test verification**: 134 + 72 = 206 assertions passing. Type check clean.

---

### Cluster B Implementation Status (#2 Scoring Validation + #9 Continuous Phase + #4 Contradiction Mining)

**Implemented: 2026-03-13**

**Files created**:
- `src/services/essayIntelligence/analysis/phaseAssessment.ts` (~466 lines) — LLM-assessed per-dimension phase detection (replaces deterministic `computeImprovementPhase`)
- `src/services/essayIntelligence/analysis/contradictionConsumer.ts` (~203 lines) — Routes programmatic contradictions by severity → findings / annotation flags / logs
- `src/services/essayIntelligence/analysis/llmJsonParser.ts` — Shared robust JSON extraction from LLM responses

**Files substantially modified**:
- `src/services/essayIntelligence/analysis/analysisPass.ts` — Anchor-then-parallel scoring with anti-clustering, per-sentence confidence, essay-specific calibration forcing function, finding context integration
- `src/services/essayIntelligence/analysis/crystallizer.ts` — W3.3 anti-clustering protocol (forced ranking, within-paragraph 15pt minimum, cross-paragraph 20pt minimum), essay-type-aware scoring calibration, coherence report with LLM-detected contradictions
- `src/services/essayIntelligence/profileManager/validation/crossDomainValidation.ts` — W4.2 programmatic contradiction detection (4 checks: understanding-vs-analysis, voicemap-vs-identity, structural-weight-vs-scores, earnedness-vs-effectiveness)
- `src/services/essayIntelligence/profileTypes.ts` — ProgrammaticContradiction, ContradictionInvestigation, DeltaSynthesisRequest/Output, CognitiveState, ImprovementPhase (with dimensionPhases, coachingLens, transition), SentenceAnalysisConfidence types

**Types added to `profileTypes.ts`**:
- `ProgrammaticContradiction` (lines 1726-1736) — evidence-backed contradictions from programmatic checks
- `ContradictionInvestigation` (lines 1741-1748) — action routing for contradictions
- `DeltaSynthesisRequest/Output` (lines 1765-1780) — for Cluster C growth cycle integration
- `CognitiveState` (lines 1791-1801) — routing hint for L6 coaching (Cluster D)
- `ImprovementPhase` extended with: `dimensionPhases`, `coachingLens`, `transition`, `nearBoundary`, `legacyReadiness`
- `SentenceAnalysisConfidence` — per-sentence confidence with reasoning

**Key design decisions that diverged from or refined the plan**:

1. **Anchor-then-parallel scoring (not single-pass)**: The anti-clustering mechanism uses a two-phase approach: score one architecturally significant paragraph first (the anchor), then score all remaining paragraphs in parallel with anchor context injected. This provides essay-specific calibration without requiring an expensive single-call-per-essay approach. Anchor selection priority: turning point > fulcrum/pivot role > pivot density > most sentences > fallback.

2. **Two-tier contradiction detection (programmatic + LLM)**: Programmatic checks run deterministically and cheaply (no LLM calls) catching explicit contradictions (earned language + low scores, voice inconsistency, structural weight mismatch). The Crystallizer's LLM call independently hunts for subtler contradictions. Together they provide comprehensive coverage. Programmatic contradictions start at `developing` maturity (not `confirmed`) to respect the finding lifecycle — growth cycle should validate.

3. **Distribution diagnostics are pure bookkeeping**: Score stdev/range/clustering are computed AFTER all scoring completes and logged for monitoring. They NEVER override, adjust, or trigger re-scoring. This is strict Rule 6 compliance.

4. **Phase assessment is a single Sonnet call, not a formula**: `assessPhase()` sees all paragraph scores + holistic context and produces qualitative per-dimension assessment. The LLM selects which dimensions matter (3-6 of 8), assigns per-dimension levels, and generates a coaching lens. The old deterministic `computeImprovementPhase()` with hard thresholds and fuzzy zones has been fully removed.

5. **Confidence is diagnostic, not corrective**: Low confidence on a sentence score is flagged as a teaching opportunity (ambiguity IS the insight), not as a signal to re-score. High-confidence clustering + low range suggests genuine uniformity rather than lazy scoring.

6. **Essay-type-aware calibration exists at two layers**: L3.5 analysis pass gets essay-type context implicitly through the profile. L4 crystallizer gets explicit type-specific calibration guidance (supplement expectations differ from personal statement). Phase assessment gets type-specific notes on how phase expectations scale with essay length.

**Rigidity audit results (post-checkpoint, deep dive)**:

Fixes applied:
- Fixed: EARNED/UNEARNED pre-computed label in profile context → now shows mechanism count without judgment (LLM-first Rule 1)
- Fixed: Programmatic contradiction findings started at `confirmed` maturity → now start at `developing` (respects finding lifecycle)
- Fixed: `mapContradictionTypeToDimensions()` was too narrow → broadened dimension mapping with documentation that these are initial routing hints
- Fixed: Notable contradictions were annotation-flag-only (ephemeral) → now also create hypothesis-maturity findings for growth cycle validation
- Fixed: Phase assessment prompt lacked dimension divergence forcing function → added mandatory divergence check
- Flagged: `CognitiveState` enum in profileTypes.ts → added warning comment for Cluster D that LLM should describe state freely
- Added: Essay-type-specific phase expectations to phaseAssessment prompt
- Documented: `blockingCount >= 3` in analysisOrchestrator.ts is operational heuristic (Crystallizer's `isCoherent` is the LLM signal; count is severity calibration). Should be replaced by LLM-assessed confidence when growth cycle is implemented.

Classified as NOT violations (after deep review):
- `escalationLevel < 4` in focusedAnalyzer.ts → operational optimization ("don't apply incremental deltas before comprehensive rebuild")
- `escalationLevel < 2` in coachingService.ts → context assembly threshold ("don't add ESCALATION warnings for first-time confusion")
- Distribution diagnostics thresholds in analysisPass.ts → diagnostic logging only, never override scores
- Anti-clustering thresholds in crystallizer.ts → diagnostic logging only

**Scenario trace findings (design limitations, not bugs)**:

1. **Anti-clustering is purely prompt-based with no enforcement feedback loop.** Anchor selection uses structural signals (turning point, pivot density, sentence count) — never quality. If the anchor paragraph is mediocre, it sets a mediocre baseline. Distribution diagnostics detect clustering but never trigger re-scoring. This is the correct LLM-first design: solve quality at the prompt layer. If clustering persists after strong prompting, the solution is prompt iteration, not deterministic correction.

2. **Per-dimension phase divergence relies on LLM inference from holistic aggregates.** L3.5 produces one `effectiveness` number per sentence (not per-dimension). The phase assessment LLM infers dimension-specific quality from holistic sections (voice identity, narrative strategy, etc.) + single-dimension paragraph scores. Added a "DIMENSION DIVERGENCE CHECK" forcing function to the prompt to make the LLM explicitly consider whether dimensions should be at different levels.

3. **Notable contradictions were ephemeral.** Only blocking contradictions (effectiveness < 30) created findings. Notable ones (30-50) were annotation flags only — text strings that vanish after one L5 call. Fixed: notable contradictions now also create hypothesis-maturity findings in the finding store, giving the growth cycle material to validate.

**Forward propagation verification (all future prompts)**:

IMPROVEMENT_5 (L5 Annotations):
- Correctly identifies PHASE_TARGETS constant for removal ✓
- Correctly identifies annotation trimming code for removal ✓
- AnnotationType enum renames are PROPOSED changes (from `strength_acknowledgment` → `strength` etc.) — expected
- New type proposals (AnnotationDensityDiagnostic, PriorAnnotationContext) are future additions — expected

IMPROVEMENT_6 (L6 Coaching):
- ⚠️ CognitiveState enum already EXISTS in profileTypes.ts (10 values) — the prompt says to avoid this. Added warning comment to type definition. Cluster D implementer must repurpose as routing hint, not LLM perception constraint.
- coachingService.ts line count slightly off (~2133 lines vs "~1900" in prompt) — immaterial
- inferCognitiveState(), CATEGORY_STATE_MAP, ANGLE_ROTATION_SEQUENCE don't exist in code — prompt correctly states these are planned-but-not-built

IMPROVEMENT_10 (Version Branching):
- EssaySnapshot type doesn't exist yet — expected (future Cluster D)
- `src/services/essayIntelligence/versioning/` directory doesn't exist yet — expected
- Snapshot understanding structure proposes a compact object that serializes across multiple profile sections — implementer should note the mapping

**Test verification**: Type check clean (all 7 modified files). No runtime tests written yet for Cluster B specifically (Cluster B scoring + phase + contradiction consumers are exercised through the full pipeline tests).

### Revised Improvement #4: Active Contradiction Mining — Implementation (2026-03-13)

**What changed from the earlier crystallizer code:**

The crystallizer already had a two-pass architecture (primary Sonnet + adversarial Haiku) and all supporting infrastructure (merge logic, coaching map, North Star evolution, type definitions). The Revised Improvement #4 upgraded the adversarial pass from a generic 5-probe check to the spec's detailed LLM-first adversarial strategy.

**Changes made:**

1. **Adversarial prompt upgraded** (`crystallizer.ts` — `runAdversarialPass()`):
   Replaced the generic 5-probe adversarial prompt with the spec's detailed 5-probe strategy:
   - PROBE 1: Understanding vs. Scoring — per-paragraph function-vs-execution comparison
   - PROBE 2: Holistic Claims vs. Evidence — trace the BOLDEST claim to paragraph-level support
   - PROBE 3: North Star Irreplaceability — 3 sub-tests (distinctiveness, structural role quality, through-line meaning transformation)
   - PROBE 4: Productive Tensions — essay-internal complexity that analysis hasn't surfaced, described as OPEN QUESTIONS
   - PROBE 5: Coaching Map Quality — is the transformative insight genuinely transformative?

2. **Finding context injected** (`crystallizer.ts`):
   The adversarial pass now receives `buildFindingContext(store, { includeSuperseded: true, includeEvidence: true })` — full finding history with evidence. The prompt explicitly guides the adversarial LLM to probe finding↔score tensions, supersession instability, and shallow depth threads.

3. **Connection graph context injected** (`crystallizer.ts`):
   The adversarial pass now receives `buildHolisticConnectionContext(graph, totalParagraphs)` — structural islands, hubs, and adjacency. The prompt guides probing of connection strength vs. understanding claims.

4. **`nature` field added** (`profileTypes.ts` — `CoherenceIssue`, `crystallizer.ts` — `AdversarialContradictionOutput`):
   Free-text tension description. Separate from `suggestedResolution` (how to fix) and `routingCategory` (system routing). The LLM describes what the tension IS without category constraints.

5. **`overallCoherence` changed to boolean** (`AdversarialContradictionOutput`):
   Adversarial assessment now produces a boolean `overallCoherence`, merged with the primary report's `isCoherent` — if EITHER says incoherent, merged report is incoherent.

6. **Orchestrator updated** (`analysisOrchestrator.ts`):
   L4 call site now passes `FindingStore` (from `coordinator.getFindingStore()`) and `ConnectionGraph` (from `ConnectionGraph.fromArray(profile.connections.all)`) to the crystallizer. Both are optional for backward compatibility.

7. **North Star failure logging** (`crystallizer.ts`):
   When the adversarial pass determines the North Star fails the irreplaceability test, the reasoning is logged. The North Star is NOT re-created — a mediocre North Star is still better than none. The failure assessment is stored in `coherenceReport.northStarAssessment` so re-crystallization can produce a more emergent North Star.

**Design decisions:**
- `nature` is carried through to `CoherenceIssue` as an optional field. `suggestedResolution` is populated from `likelyResolution` or `nature` as fallback for backward compatibility with existing consumers.
- `validateAdversarialOutput()` now fully normalizes all fields to typed values (no more `string` for severity/routingCategory). Falls back to `'notable'` for severity and `'depth_signal'` for routing category on unrecognized values.
- Finding context and connection context are empty strings when the stores are empty/absent — the adversarial prompt handles this gracefully (the context sections are simply omitted from the user prompt).

---

### Cluster C Implementation Status (#7 Iterative L3.75 + #8 Adaptive Router)

**Implemented: 2026-03-13**

**Files created**:
- `src/services/essayIntelligence/analysis/growthEngine.ts` (~267 lines) — State management, budget tracking, deep dive dispatch, finding merge. Pure infrastructure (Rule 6).
- `src/services/essayIntelligence/analysis/deepDiveRunner.ts` (~607 lines) — Executes single deep dive investigations via prompt templates. Sonnet calls with JSON mode.
- `src/services/essayIntelligence/analysis/deepDivePromptLibrary.ts` (~1000+ lines) — ~20 specialized investigation templates organized by domain (Voice×2, Emotion×2, Theme×2, Narrative×2, Character×2, Craft×2, Admissions×2, Meta×3, Cross-cutting×1).
- `src/services/essayIntelligence/profileManager/routerTypes.ts` (~199 lines) — Declared context system types, ContextRelevanceTracker, InMemoryRelevanceTracker.

**Files substantially modified**:
- `src/services/essayIntelligence/analysis/holisticSynthesis.ts` — V2 iteration system: `synthesizeIteration()` with 3-call pipeline (Phase A+B parallel → Phase Meta → Question Curation). Meta prompt produces walkDisagreements, readingStrategy, reReadCandidates, selfAssessedConvergence. Curation prompt resolves/filters/curates questions with quality-level enforcement (Level 1-5 hierarchy).
- `src/services/essayIntelligence/profileManager/profileRouter.ts` — W8.1 adaptive overlay system (multi-dimensional connection detection, coaching NorthStar priority), W8.2 adaptive token budgeting (per-rule base + density scaling + overlay override + hard cap 16K), W8.3 task priority reweighting (per-rule section weights with prefix-based matching for dynamic section names), `assembleDeepDive()` rule, `assembleL375SynthesisIteration()` rule, `assembleDeclaredContext()` for generic declared context requests, ReadingStrategy-aware context priority ordering.
- `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` — `runGrowthCycle()` method: iterative loop (synthesize → check convergence → run re-reads → dispatch deep dives → merge findings → repeat). Convergence via L3.75's `selfAssessedConvergence` (primary), budget exhaustion (secondary), iteration cap (safety).
- `src/services/essayIntelligence/profileTypes.ts` — Growth cycle types: `GrowthCycleState`, `GrowthStepRecord`, `ReadingStrategy`, `QuestionCurationOutput`, `SynthesisIterationOutput`, `DeepDiveRequest`, `DeepDiveResult`, `DeepDivePromptTemplate`, `UnderstandingQuestion` (with source/status), `DeltaSynthesisRequest`/`DeltaSynthesisOutput` (for targeted re-synthesis).

**Key design decisions that diverged from or refined the plan**:

1. **Three-call iteration, not two**: Each growth iteration runs Phase A+B (parallel) → Phase Meta → Question Curation as three sequential steps. Meta and curation are separate calls because they need different context shapes: meta needs the just-produced synthesis to validate against the walk, curation needs the reading strategy from meta to guide question prioritization. This costs ~$0.02 more per iteration but dramatically improves question quality.

2. **Deep dive runner bypasses the profile router intentionally**: `runDeepDive()` builds its own context via template-specific `requiredContext` fields and always provides full connection graph + all paragraph understanding. The router's `assembleDeepDive()` rule exists for future consumers that need router-style context assembly. Rationale: deep dive templates have template-specific placeholders ({essayText}, {synthesis}, {readingStrategy}) that don't map cleanly to the router's ProfileSection model.

3. **Question quality hierarchy is prompt-enforced, not code-enforced**: The curation prompt defines 5 quality levels (Surface → Functional → Architectural → Epistemological → Meta-Awareness) with examples of each. The system never filters questions by level — the LLM does that. The code only filters structurally invalid output (empty question text, empty prompt type).

4. **ReadingStrategy as LLM-produced routing signal (Rule 7)**: The reading strategy includes `contextPriorities: string[]` — an explicit routing signal that the router uses to reorder sections. The LLM produces this alongside its prose strategy description. The system routes on the tagged field, not keyword-matching on the prose.

5. **Activity log as raw context, not weighted reward**: The growth engine formats the activity log as human-readable prose for the LLM's convergence assessment. No reward formulas, no weighted metrics. The LLM sees "resolved 3 questions, raised 2 new questions, deepened 1 finding" and makes its own judgment about whether that constitutes progress.

6. **First-iteration convergence guard**: L3.75 convergence is only trusted after `state.iteration >= 1`. This ensures at least one full growth cycle (synthesis + meta + curation + deep dives) before the system stops. On first iteration, L3.75 hasn't seen any deep dive results yet — converging immediately would skip the growth engine entirely. After iteration 1, if L3.75 converges on the first synthesis of iteration 1 (before deep dives run), the system trusts that judgment — L3.75 has seen the first cycle's results and determined no further investigation is needed.

**Rigidity audit results (post-checkpoint)**:

Fixes applied:
- Fixed: `newFindings.slice(0, 10)` in holisticSynthesis.ts buildIterationContext() — trimming findings shown to L3.75 in subsequent iterations. Now shows ALL findings. (LLM-first Rule 2: never discard paid output)
- Fixed: `active.slice(0, 15)` in holisticSynthesis.ts buildCurationUserPrompt() — trimming findings shown to curation LLM. Now shows ALL active findings. (LLM-first Rule 2)
- Fixed: `reReadCandidates.slice(0, 2)` in analysisOrchestrator.ts runGrowthCycle() — hard cap on re-reads discarding LLM-curated candidates. Now respects L3.75's full ordering; budget check alone controls when to stop. (LLM-first Rule 2)
- Documented: Deep dive runner's intentional bypass of profile router in deepDiveRunner.ts header comment.

Classified as NOT violations (after deep review):
- Token budget formulas in profileRouter.ts (density scaling, per-rule budgets) → infrastructure (Rule 6)
- TaskPriorityWeights in profileRouter.ts → section ordering within priority tier, not inclusion/exclusion
- Confidence guidance thresholds in meta prompt → soft guidance (prompt-level), LLM produces explicit routing tags
- `state.iteration >= 1` guard → operational (ensures at least one full growth cycle)
- `MAX_ITERATIONS=8`, `GROWTH_BUDGET_CEILING=$0.60`, `MIN_BUDGET_FOR_STEP=$0.03` → operational backstops
- Finding deduplication by claim+scope key in growthEngine.ts → structural identity check, not quality judgment

**Forward propagation to Cluster D**:
- `coachingService.ts:1049`: `scopeCertainty: stage1.confidence > 0.7 ? 'high' : ...` is a deterministic formula converting LLM confidence to routing tag. Should have the LLM produce `scopeCertainty` directly as an explicit routing signal (Rule 7).
- Deep dive results produce `DeepDiveResult.findings` with `FindingScope.textEvidence` — L5 annotations should reference these findings by ID for grounded teaching.
- `ReadingStrategy.contextPriorities` is available to all downstream consumers — coaching and annotation prompts should receive it for adaptive context.
- `SynthesisIterationOutput.reReadCandidates` has `expectedDepthGain: 'significant' | 'moderate'` — coaching can reference which paragraphs the system flagged for re-reading.

**Test verification**: Type check clean. No runtime tests for Cluster C growth cycle specifically (exercised through full pipeline integration tests).

---

### Cluster D Implementation Status (#5 L5 Annotations + #6 L6 Coaching + #10 Version Branching)

**Implemented: 2026-03-13**

**Files created**:
- `src/services/essayIntelligence/coaching/coachingService.ts` (~2670 lines) — 5-stage coaching pipeline: Stage 1 (Haiku insight extraction), Stage 1.5 (Haiku cognitive assessment), Stage 2 (deterministic routing), Stage 3 (Sonnet coaching response), Stage 4 (conditional Sonnet deepening), Stage 5 (phase check diagnostic)
- `src/services/essayIntelligence/versioning/snapshotManager.ts` (~267 lines) — Snapshot CRUD + comparison caching, max 5 snapshots, max 2 nesting levels
- `src/services/essayIntelligence/versioning/snapshotComparator.ts` (~345 lines) — LLM-driven understanding comparison (single Sonnet call per comparison, cached)
- `src/services/essayIntelligence/versioning/snapshotTrigger.ts` (~177 lines) — Auto-snapshot detection ($0 cost, heuristic-based: major rewrite >40%, structural change, growth milestones)
- `src/services/essayIntelligence/versioning/index.ts` — Barrel exports

**Files substantially modified**:
- `src/services/essayIntelligence/analysis/deepAnnotationService.ts` (~1600 lines) — V2 rewrite: teaching-focused annotations with 4 teaching modes (awareness/consequence/connection/action), teaching test forcing function, North Star grounding, cross-paragraph annotations, finding [F] label integration, observation [U] label integration, no annotation caps (Rule 2), density diagnostics as signal
- `src/services/essayIntelligence/versionTracker.ts` (~1161 lines) — Edit tracking, staleness accumulation, reanalysis trigger evaluation, approach tracking (W9.1), edit strategy detection (W9.2), cross-version approach context (W9.3), net-change computation with reversion detection
- `src/services/essayIntelligence/profileTypes.ts` — L5Annotation, L5AnnotationType, L5TeachingMode, AnnotationDensityDiagnostic, PriorAnnotationContext, CognitiveAssessment, CoachingSessionMemory, LearningStyleObservations, CoachingQualitySignals, EssaySnapshot, SnapshotSource, SnapshotUnderstanding, SnapshotComparison, EditApproach, EditStrategyPattern, VersionRecord (extended with approaches/editStrategy)

**Key design decisions**:

1. **Stage 1.5 is a separate LLM call, not folded into Stage 1 or Stage 3**: Classification (JSON) and perception (prose) degrade when combined in one call. Stage 1 produces structured routing signals. Stage 1.5 produces a prose assessment injected into Stage 3. Cost: ~$0.001 per turn (negligible). This pattern (routing-call → perception-call → generation-call) could be applied to other multi-step prompts.

2. **Session memory is ephemeral, not persisted in profile**: `CoachingSessionMemory` (turnCount, topicsDiscussed, approachesUsed, studentStances, sessionArcSummary, nextFocus) lives for the duration of a coaching session. Pattern insights and learning style observations detected within the session ARE persisted via the coordinator. This separation prevents profile pollution while still enabling cross-turn coaching intelligence.

3. **Confusion escalation uses per-topic tracking with approach rotation**: `TopicConfusionTracker` maps topic → (instanceCount, escalationLevel, approachesTried). Level 2: "different angle", Level 3: "break it down", Level 4+: "acknowledge difficulty + ask what's confusing." Escalation context is injected as soft guidance into the Stage 3 prompt — not as a hard constraint on what the coach can say.

4. **Snapshot comparison is understanding-based, not text-based**: The comparison prompt asks "what does each version understand differently?" not "what words changed?" This aligns with the system's value proposition — the comparison reveals trade-offs in understanding, not just diff hunks.

5. **Version tracker's approach tracking is heuristic**: Word similarity (Jaccard) detects partial reversions when text becomes >20% more similar to baseline. This is infrastructure (Rule 6) — it provides context about the student's editing journey. The LLM still makes all judgment calls about what the editing pattern means.

6. **Anti-repetition context uses keyword matching (classified acceptable)**: `extractFocusAreas()` uses a keyword map to detect topic overlap for anti-repetition injection. This is a routing heuristic — worst case is false negatives (anti-repetition not injected), which degrades gracefully. Not a quality judgment.

**Rigidity audit results (post-checkpoint)**:

Fixes applied:
- Fixed: `snapshotComparator.ts` — `.slice(0, 15)` for findings and `.slice(0, 10)` for connections trimming context shown to comparison LLM. Now shows ALL non-superseded findings and active connections. (Rule 2: never discard paid output / Trap #3: trimming via context window)
- Fixed: `coachingService.ts` — `observations.length >= 8` cap in `gatherTargetedObservations()` removed. Stage 4 reinterpretation LLM now sees ALL observations for the scope. (Rule 2 / Trap #3)
- Fixed: `coachingService.ts` — `assignDurability()` used regex `generalPreferenceSignals` to detect if preference is general or essay-specific. Now uses LLM-produced `preferenceDurability` routing signal from Stage 1 output. (Rule 4: no keyword matching for analytical judgment → Rule 7: explicit routing tags)

Classified as NOT violations (after deep review):
- `CognitiveState` enum (10 values) in Stage 1 → routing taxonomy, not perception constraint. Real cognitive perception lives in Stage 1.5's free prose assessment. System routes on the tagged field. (Rule 3 / Rule 7 compliant)
- `InsightCategory` (8 values) → well-defined mutually exclusive routing categories with extensive disambiguation. Full perception in Stage 3/1.5 prose. (Rule 3 compliant)
- `L5AnnotationType` (4 values) → routing taxonomy. Real intent in free-text `teachingIntent`. (Rule 3 compliant)
- `mapNumericValence()` → normalizes continuous LLM output to categorical tag. Bookkeeping normalization of already-LLM-produced data. (Rule 6)
- `detectEditStrategy()` → heuristic label injected as prompt context. LLM sees it as a hint, not a constraint. (Rule 6)
- `shouldTriggerReanalysis()` thresholds → operational guardrails for when to spend money on re-analysis. (Rule 6)
- `MAJOR_REWRITE_THRESHOLD = 0.4` in snapshotTrigger → operational heuristic for auto-snapshot. (Rule 6)
- `MAX_HISTORY_TURNS = 12` → operational token budget for conversation context. (Rule 6)
- `PATTERN_DETECTION_MIN_TURNS = 3` → operational threshold for when pattern detection is meaningful. (Rule 6)
- `northStarConnection.trim().length < 10` filter in deepAnnotationService → referential integrity check (annotation must have meaningful structural grounding). The prompt already requires this; the filter catches LLM failures. (Rule 6 border)
- `extractFocusAreas()` keyword map → routing heuristic for anti-repetition context injection. Worst case = false negative (no anti-repetition context), not false positive deletion. (Acceptable routing)
- Session arc sections (EARLY/MIDDLE/LATE by turn count) → soft prompt guidance, not hard constraint. (Rule 5 compliant)
- Escalation level descriptions → soft guidance injected into Stage 3 prompt. LLM can deviate. (Rule 5 compliant)

**Scenario trace results**:

1. **L5 finding-grounded annotations**: Traced "Finding F3 about decorative metaphor in P2." `buildParagraphPrompt()` calls `buildAnnotationFindingContext(findingStore, para.index)` — injects per-paragraph finding context with [F] labels. The teaching test prompt ("could the student see this by re-reading?") is a strong cognitive forcing function. Gap CLOSED.

2. **L6 cognitive state disambiguation**: Traced "I don't get what you mean about voice shifting." Stage 1 classifies as `confused_about_feedback` (not `curious_deeper` or `confused_about_concept`). Stage 1.5 produces prose assessment. Escalation tracker increments topic confusion count. Stage 3 receives cognitive assessment + escalation context. Gap CLOSED.

3. **Version snapshot comparison**: Traced understanding-based comparison. SnapshotComparator sends full essay text + understanding + findings + connections for both versions. LLM produces paragraph deltas, structural delta, finding delta, and coaching implications. Gap CLOSED (MVP scope — no branch switching by design).

**Test verification**: Type check clean after all rigidity fixes.

---

### All Clusters Complete — Final Consolidation Notes

**Overall architecture**:
- **14 files** in core analysis pipeline
- **4 files** in coaching module
- **4 files** in versioning module
- **~12,000 lines** of new/substantially modified code across 4 clusters
- **All 6 LLM-first design rules** enforced across every module

**The most persistent anti-pattern**: Context window trimming (`.slice(0, N)` on findings, connections, observations). Found and fixed in Clusters C and D. This pattern is natural for engineers managing token budgets but violates Rule 2 (never discard paid LLM output). Future code reviews should grep for `.slice(0,` in any file that builds LLM prompts.

**The most valuable pattern discovered**: Stage 1.5 (separate perception call). Classification and perception degrade when combined. A cheap Haiku call (~$0.001) that produces a 2-4 sentence prose assessment transforms the quality of the downstream Sonnet coaching response. This pattern should be considered for any multi-step pipeline where the generation call needs nuanced context about the input.
