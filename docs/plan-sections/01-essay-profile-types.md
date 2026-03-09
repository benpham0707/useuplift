## The EssayProfile: Multi-Resolution Semantic Map

The EssayProfile is the central data structure. It maps the essay at EVERY granularity level — from the holistic thesis down to individual word choices. It grows through every layer without repetition. RAG + smart context routing means size is never a constraint.

This section defines every type in the system. It is the authoritative specification — if the code and this section disagree, fix the code.

### Profile Structure

```
EssayProfile
├── PROFILE INDEX (compact table of contents — always loaded)
│   ├── essayLength: { paragraphs, sentences, words }
│   ├── confidenceLevel: 'initial' | 'developing' | 'deep' | 'comprehensive'
│   ├── topicTags: ["identity", "family", "diamond_metaphor", ...]
│   ├── paragraphDigest: per-paragraph one-liner + tags + flags
│   ├── sectionTokenCounts: { voiceIdentity: 180, thematicArchitecture: 340, ... }
│   ├── connectionGraph: which paragraphs/sentences link to which
│   ├── northStarSummary: through-line + structural significance flags
│   └── stalenessSnapshot: which sections are stale and at what depth
│
├── HOLISTIC UNDERSTANDING (essay-level)
│   ├── Voice Identity
│   │   ├── signature, register, distinctive patterns
│   │   ├── evolution through the essay
│   │   └── authentic vs. performed moments
│   ├── Voice Map (the WHERE and HOW of voice — five dimensions)
│   │   ├── register, vocabulary fingerprint, sentence rhythm, perspective/distance
│   │   ├── tonal disposition (humor, irony, earnestness, irreverence, solemnity)
│   │   ├── stability/shift annotations at specific passages
│   │   ├── intentionality assessment with confidence level per shift
│   │   └── code-switching events (language, trigger, cultural function)
│   ├── Emotional Topography
│   │   ├── arc trajectory, peak moments
│   │   ├── undertones (felt but not said)
│   │   └── progression (how emotion shifts paragraph to paragraph)
│   ├── Moment Earned-ness Map (backward-tracing network)
│   │   ├── per significant moment: emotional, intellectual, humorous
│   │   ├── mechanism types: sensory grounding, emotional setup, stakes,
│   │   │   character revelation, thematic preparation,
│   │   │   intellectual scaffolding, comedic/subversive setup
│   │   └── sparseness = unearned (diagnosis, not score)
│   ├── Thematic Architecture
│   │   ├── central thesis + how it emerges/crystallizes
│   │   ├── threads with paragraph spans
│   │   ├── subtext (implied but never stated)
│   │   └── productive contradictions/tensions
│   ├── Narrative Strategy
│   │   ├── primary strategy + WHY it serves this story
│   │   ├── pivot points, pacing analysis
│   │   └── structural choices and their effects
│   ├── Character Revelation
│   │   ├── who is this writer (the person behind the words)
│   │   ├── values revealed (shown, not told)
│   │   ├── growth arc, intellectual fingerprint
│   │   └── blind spots they might not see
│   ├── Craft Assessment
│   │   ├── strength signatures with evidence
│   │   ├── growth edges with reasoning
│   │   ├── image/metaphor system
│   │   └── sentence-level and word-level patterns
│   ├── Cross-Dimension Entanglements
│   │   ├── moments where 2+ dimensions intersect meaningfully
│   │   ├── "P2S3's voice shift IS the thematic pivot"
│   │   └── evidence layer that feeds distinctiveness signature
│   └── Admissions Positioning
│       ├── tellability summary (30-second AO pitch)
│       ├── distinctiveness factors
│       ├── institutional fit signals
│       ├── red flags, memorability assessment
│       └── how this essay positions within a portfolio
│
├── NORTH STAR (architecture of meaning — replaces EssayDNA)
│   ├── Through-Line Map: central element's journey (surface, submerge, transform, resolve)
│   ├── Structural Roles Map: what each section IS in the architecture
│   ├── Trajectory & Potential: where the essay could go (MULTIPLE plausible paths)
│   ├── Distinctiveness Signature: what makes this essay non-interchangeable
│   └── Intent Bridge: student's understanding alongside system's
│   (Scaled by essay length: supplements=2 dims, PIQs=3, personal statements=5)
│
├── PARAGRAPH MAP (per-paragraph)
│   ├── paragraph[0]
│   │   ├── Role & Function
│   │   │   ├── what this paragraph DOES in the essay
│   │   │   ├── what it's TRYING to achieve
│   │   │   ├── how well it achieves it
│   │   │   └── what it contributes that no other paragraph does
│   │   ├── Narrative Contribution
│   │   │   ├── how it advances the thesis
│   │   │   ├── how it serves the emotional arc
│   │   │   ├── thematic threads it carries
│   │   │   └── connections to other paragraphs (callbacks, contrasts, escalations)
│   │   ├── Craft Profile
│   │   │   ├── sentence rhythm pattern and its effect
│   │   │   ├── image/metaphor usage
│   │   │   ├── voice consistency with rest of essay
│   │   │   └── standout craft moments + weaknesses
│   │   ├── Emotional Register
│   │   │   ├── dominant emotion, depth, authenticity
│   │   │   ├── show vs tell assessment
│   │   │   └── strongest emotional moment
│   │   ├── tags: ["opening", "scene", "diamond_metaphor", "voice:reflective"]
│   │   └── sentences[] (see SENTENCE MAP below)
│   ├── paragraph[1] ...
│   └── paragraph[N] ...
│
├── SENTENCE MAP (per-sentence, nested under paragraphs)
│   ├── sentence[0]
│   │   ├── UNDERSTANDING (descriptive — what the essay IS)
│   │   │   ├── observedFunctions: MULTI-OBSERVATION (a sentence can do multiple things)
│   │   │   │   e.g., ["Grounds reader in scene", "Introduces central symbol"]
│   │   │   ├── inferredIntents: MULTI-OBSERVATION (writer may have multiple goals)
│   │   │   ├── rhetoricalFunctions: ["scene-setting", "symbol-introduction"]
│   │   │   ├── narrativeContributions: MULTI-OBSERVATION (can advance arc + carry thread + set up callback)
│   │   │   ├── paragraphContribution: how it serves THIS paragraph's goal
│   │   │   ├── Craft: rhythm, voice alignment, techniques[]
│   │   │   ├── Notable Words/Phrases: [{word, significance}]  (no isStrength — evaluation is analysis layer)
│   │   │   ├── connectionRefs: ["conn_001"] (IDs into central store)
│   │   │   └── tags: ["metaphor:diamond", "theme:imperfection"]
│   │   ├── ANALYSIS (evaluative — how well it's working)
│   │   │   ├── effectiveness: score + reasoning
│   │   │   ├── strengths: MULTI-OBSERVATION (multiple things can work well)
│   │   │   ├── weaknesses: MULTI-OBSERVATION (multiple issues can exist)
│   │   │   ├── isStrength / isProblem flags
│   │   │   └── priorityForImprovement: 0-5
│   │   └── FEEDBACK (prescriptive — NOT STORED, generated fresh per context)
│   │       ├── prescriptiveRole: what it SHOULD do (depends on teaching moment)
│   │       ├── suggestions: concrete improvements (depends on student's focus)
│   │       └── rewriteExample (depends on coaching context)
│   ├── sentence[1] ...
│   └── sentence[M] ...
│
├── CROSS-ESSAY CONNECTIONS (centralized — single source of truth)
│   ├── connections.all[]: each connection stored ONCE with unique ID
│   │   Sentences reference by ID (connectionRefs), never embed descriptions
│   ├── Image/Metaphor Recurrences
│   ├── Narrative Arc Map (which sentences play which arc role)
│   └── Redundancies & Gaps
│
├── EDIT UNDERSTANDING (version tracking + change comprehension)
│   ├── editHistory: accumulated diffs between analysis points
│   ├── versionRecords: snapshots with intent annotations
│   └── pendingChanges: edits awaiting next re-analysis
│
├── CONVERSATION INSIGHTS (L6-sourced student revelations)
│   ├── essayInsights: essay-scoped insights with durability levels
│   ├── patternInsights: meta-observations about coaching patterns
│   └── (student-durable insights live at user level, not here)
│
└── PROFILE METADATA
    ├── confidenceLevel: 'initial' | 'developing' | 'deep' | 'comprehensive'
    ├── lastUpdatedLayer: number
    ├── paragraphsCovered: number[]
    ├── conversationInsightsCount: number
    └── totalAnalysisCost: number
```

---

### Profile Index: Smart Labeling & Context Routing

The Profile Index is a compact (~250-350 token) table of contents that is ALWAYS loaded into every API call. It tells the AI what understanding EXISTS without requiring it to read the full profile. The AI then requests only the sections it needs.

The key addition over the original design is a North Star summary and staleness tracking. The North Star summary gives every downstream consumer (L5 annotations, L6 coaching, edit understanding) access to structural significance without loading the full North Star. The staleness snapshot tells the Profile Router which sections need refreshing, so it can make smarter loading decisions.

```typescript
interface ProfileIndex {
  // ── ESSAY SUMMARY ──
  essayLength: { paragraphs: number; sentences: number; words: number };
  confidenceLevel: 'initial' | 'developing' | 'deep' | 'comprehensive';

  // ── TOPIC TAGS (semantic labels for fast lookup) ──
  /** Global topics present in the essay */
  essayTopics: string[];  // ["identity", "family", "imperfection", "self-worth"]

  // ── PARAGRAPH DIGEST (one-liner per paragraph — scannable) ──
  paragraphDigest: Array<{
    index: number;
    roleSummary: string;         // "Opening scene: pawnshop with grandmother's ring"
    tags: string[];              // ["opening", "scene", "diamond_metaphor", "voice:reflective"]
    themes: string[];            // Which thematic threads this paragraph carries
    sentenceCount: number;
    hasStrengths: boolean;       // Quick flag: does this paragraph have standout moments?
    hasWeaknesses: boolean;      // Quick flag: does this paragraph need work?
    connectionCount: number;     // How many cross-paragraph connections
    improvementPriority: number; // 0 (fine) to 5 (urgent)
  }>;

  // ── SECTION SIZES (for token budgeting) ──
  /** Approximate token count per profile section */
  sectionTokens: {
    voiceIdentity: number;
    voiceMap: number;
    emotionalTopography: number;
    momentEarnednessMap: number;
    thematicArchitecture: number;
    narrativeStrategy: number;
    characterRevelation: number;
    craftAssessment: number;
    entanglements: number;
    admissionsPositioning: number;
    northStar: number;
    connections: number;
    paragraphs: number[];        // Token count per paragraph's full profile
  };

  // ── CONNECTION GRAPH (which paragraphs/sentences link to each other) ──
  connectionGraph: Array<{
    from: [number, number];      // [paragraph, sentence]
    to: [number, number];
    type: string;                // "callback", "echo", "contrast", "setup→payoff"
  }>;

  // ── NORTH STAR SUMMARY (structural significance without full North Star) ──
  /** Compact representation of the North Star's key insights. Gives every
      downstream consumer access to structural significance for ~30-50 tokens. */
  northStarSummary: {
    /** One-sentence through-line: what threads through the essay and how it transforms */
    throughLineSummary: string | null;
    // "The diamond's meaning transforms from commodity → inheritance → identity"

    /** Per-paragraph structural role (from North Star's structural roles map) */
    structuralRoles: Array<{
      paragraphIndex: number;
      role: string;              // "frame_of_risk", "value_system", "fulcrum", "resolution"
      significance: 'load_bearing' | 'supporting' | 'transitional';
    }>;

    /** Whether the North Star is populated and at what confidence */
    maturity: 'absent' | 'sketch' | 'emerging' | 'full';
  };

  // ── STALENESS TRACKING (which sections need refreshing) ──
  /** Lightweight map of which profile sections are stale relative to recent changes.
      The Profile Router uses this to include stale sections in the next relevant LLM call
      for re-synthesis. See Profile Growth Rules for staleness depth limits. */
  staleness: {
    /** Sections with strong staleness (direct change — must be refreshed) */
    strongStale: string[];       // ["voiceMap", "emotionalTopography", "paragraph_2"]
    /** Sections with moderate staleness (1-hop connection — should be refreshed) */
    moderateStale: string[];     // ["thematicArchitecture", "paragraph_4"]
    /** Sections with weak staleness (2-hop — informational only, low priority) */
    weakStale: string[];         // ["admissionsPositioning"]
    /** Timestamp of the most recent change that caused staleness */
    lastChangeAt: string | null;
  };

  // ── ACTIVE CONCERNS (what needs attention) ──
  activeConcerns: Array<{
    location: [number, number | null];  // [paragraph, sentence or null for paragraph-level]
    concern: string;                     // One-line summary
    severity: 'critical' | 'significant' | 'minor';
  }>;

  // ── IMPROVEMENT PHASE (computed from analysis, drives feedback zoom) ──
  /** Determines the FEEDBACK zoom level. Understanding + Analysis always comprehensive.
      Feedback gets more surgical as the essay improves. Re-computed after every re-analysis. */
  improvementPhase: ImprovementPhase;

  // ── ANALYSIS MODE STATE (tracks how deep the profile is for mode selection) ──
  /** Number of full analysis passes completed (drives comprehensive→focused transition) */
  fullAnalysisCount: number;
  /** Timestamp of last comprehensive analysis */
  lastComprehensiveAt: string | null;
}

/**
 * Improvement Phase — drives progressive precision in feedback.
 * Understanding + Analysis always evaluate everything at every level.
 * The phase determines what FEEDBACK surfaces to the student right now.
 *
 * Computed from L3.5 analysis results. Stored in ProfileIndex so every
 * subsequent call (L5 annotations, L6 coaching) knows the zoom level.
 * Re-computed after every re-analysis (phase can shift up OR down).
 */
type ImprovementPhase = {
  level: 'foundation' | 'architecture' | 'craft' | 'polish' | 'distinction';
  reasoning: string;           // Why this phase was chosen
  focusAreas: string[];        // Specific things to address at this level
  deferredAreas: string[];     // Things that exist but aren't worth surfacing yet
  /** Rough percentage of essay that's "solid" at each granularity */
  readiness: {
    essayLevel: number;        // 0-100: thesis, arc, voice coherence
    paragraphLevel: number;    // 0-100: paragraphs pulling weight
    sentenceLevel: number;     // 0-100: sentences effective
    wordLevel: number;         // 0-100: word choices precise
  };
};
```

**How it works in every API call:**

1. **Profile Index always loaded** (~250-350 tokens). The AI sees what exists, what's tagged, what's connected, what's structurally significant, and what's stale.
2. **AI determines what's relevant** based on the current task/question.
3. **Only relevant sections loaded** — e.g., for a question about the opening, load P0's sentence map + its connections + `thematicArchitecture` (to explain theme setup). Skip P3-P5 details.
4. **Tags enable fast routing** — "What about my metaphor?" -> find tags containing "metaphor" -> load those paragraphs/sentences.
5. **North Star summary enables significance-aware decisions** — the AI knows P4 is the fulcrum without loading the full North Star.
6. **Staleness tracking informs re-synthesis** — the Profile Router can piggyback stale section refreshes onto the next relevant LLM call.
7. **Token budget respected** — `sectionTokens` tells the router how much each section costs. Stay within the call's budget.

**This applies to ALL API calls across the entire system**, not just Layer 3:
- Layer 3 deep walk: load holistic sections + prior paragraphs (summarized, not full detail) + current paragraph (full detail)
- Layer 3.75 holistic synthesis: load all sentence-level understanding + North Star sketch (if available)
- Layer 4 crystallization: load holistic sections + paragraph digests (from index, not full sentence maps)
- Layer 5 annotations: load full profile (annotations need everything)
- Layer 6 coaching: index -> focus detection -> selective load
- Edit understanding: load changed sentence's profile + North Star structural roles + connections
- Any future service that touches essays: always index-first, then selective load

---

### Voice Map: Five-Dimensional Tracking Without Scores

The original `voiceIdentity` section captured voice as a summary — signature, register, distinctive patterns, evolution, and a `consistencyScore: number`. The consistency score is eliminated. Voice is too multidimensional for a single scalar, and any number would require justification that the system cannot provide without sounding arbitrary.

The Voice Map replaces the consistency score with something far more useful: a five-dimensional map of voice stability and shift, annotated with intentionality assessments, that points to specific passages. It sits alongside `voiceIdentity` (which retains the holistic voice description) as a structured companion that gives the system spatial awareness of WHERE voice lives and HOW it moves.

**Why five dimensions, not four:** The original four dimensions (register, vocabulary fingerprint, sentence rhythm, perspective/distance) miss some of the most distinctive voice qualities in admissions essays: humor, irony, self-awareness, irreverence. A student who writes with deadpan humor has a fundamentally different voice from one who writes with earnest sincerity, even if their register, vocabulary, rhythm, and perspective are identical. Tonal disposition is the fifth dimension.

**Why code-switching is tracked explicitly:** In a diverse applicant pool, multilingual code-switching is one of the strongest signals of authentic voice. A student who drops into Spanish when quoting their grandmother is making a voice choice that carries cultural weight. The system must distinguish this from unintentional register drift — code-switching is almost always intentional, and its cultural function is part of the essay's meaning, not a consistency problem.

```typescript
/**
 * The Voice Map: five-dimensional tracking of voice across the essay.
 *
 * NOT a replacement for voiceIdentity — voiceIdentity describes WHAT the voice is
 * (holistic summary). The Voice Map describes WHERE the voice is and HOW it moves
 * (structured spatial map). They complement each other:
 * - voiceIdentity: "This writer uses a sensory-concrete register with a reflective
 *   undercurrent, oscillating between pawnshop-transaction language and inheritance language."
 * - voiceMap: "Register is concrete-sensory in P1 (stability), shifts to intimate-reflective
 *   at P2 boundary (intentional, aligns with emotional turn), returns to concrete-with-
 *   new-meaning at P5 (intentional, bracket closure)."
 */
interface VoiceMap {
  // ── THE FIVE DIMENSIONS (essay-level baseline + per-passage observations) ──

  /**
   * Register: formality and distance.
   * The most audible dimension — readers feel register shifts even when they
   * cannot name them. Tracked as a baseline with passage-level observations.
   */
  register: {
    /** The essay's dominant register */
    baseline: string;          // "sensory-concrete with reflective undercurrent"
    /** Per-passage observations where register is notable or shifts */
    observations: VoiceObservation[];
  };

  /**
   * Vocabulary Fingerprint: recurring word families, Latinate-vs-Anglo ratio,
   * domain-specific vocabulary. Maps to thematic architecture — vocabulary
   * domains often mirror the essay's conceptual domains.
   *
   * Example: the diamond essay uses pawnshop language (karat, loupe, counter),
   * family language (grandmother, ring, love), and valuation language (worth,
   * dollars, value). These vocabulary domains ARE the essay's thematic architecture
   * expressed through word choice — a cross-dimension entanglement.
   */
  vocabularyFingerprint: {
    /** The essay's dominant word families */
    baseline: string;          // "oscillates between transaction domain and inheritance domain"
    /** Specific vocabulary domains identified */
    domains: Array<{
      domain: string;          // "pawnshop/transaction", "family/inheritance"
      exampleWords: string[];  // ["karat", "loupe", "forty dollars"]
      paragraphs: number[];    // Where this domain appears
    }>;
    observations: VoiceObservation[];
  };

  /**
   * Sentence Rhythm: cadence patterns. Short declaratives for action, long
   * clause-heavy sentences for reflection. Two writers with identical vocabulary
   * and register still sound different if their rhythms differ.
   */
  sentenceRhythm: {
    baseline: string;          // "varies — punchy declaratives in scenes, flowing clauses in reflection"
    observations: VoiceObservation[];
  };

  /**
   * Perspective and Distance: how close the narrator stands to the events.
   * Present-tense immediacy vs past-tense reflection. In-the-moment vs
   * looking-back. The diamond essay oscillates between these, and the
   * oscillation itself is a deliberate voice choice.
   */
  perspectiveDistance: {
    baseline: string;          // "primarily past-tense reflective with present-tense intrusions at emotional peaks"
    observations: VoiceObservation[];
  };

  /**
   * Tonal Disposition: the emotional coloring of the narrator's stance.
   * Not the CONTENT's emotion (that's emotional topography) but HOW the
   * writer positions themselves toward the content.
   *
   * This dimension catches what the other four miss: a student who writes
   * about loss with deadpan humor has a different voice from one who writes
   * about loss with earnest gravity, even if register/vocabulary/rhythm/
   * perspective are identical.
   *
   * [Added per review S4 — without this dimension, the system cannot
   * distinguish ironic detachment from earnest engagement.]
   */
  tonalDisposition: {
    baseline: string;          // "earnest with occasional self-aware humor"
    /** Dominant tonal qualities detected across the essay */
    dominantQualities: TonalQuality[];
    observations: VoiceObservation[];
  };

  // ── VOICE SHIFTS (where voice changes — the map's core navigation data) ──

  /**
   * Recorded shifts in any voice dimension. Each shift is annotated with
   * an intentionality assessment (the critical distinction) and confidence level.
   *
   * Intentional variation has three hallmarks:
   * 1. Aligns with structural boundaries (paragraph break, scene change)
   * 2. Serves an identifiable purpose in another dimension (emotional, thematic, narrative)
   * 3. Commits fully to the new voice rather than wavering
   *
   * Unintentional inconsistency has the opposite pattern: happens mid-paragraph,
   * serves no discernible purpose, and often oscillates rather than committing.
   */
  shifts: VoiceShift[];

  // ── CODE-SWITCHING (multilingual voice moves — special case of intentional variation) ──

  /**
   * Explicit code-switching events — moments where the writer shifts languages
   * or registers in a culturally-rooted way. Tracked separately because
   * code-switching carries cultural weight that generic "voice shift" notation
   * cannot capture.
   *
   * [Added per review S4 — code-switching is one of the strongest signals
   * of authentic voice in a diverse applicant pool.]
   */
  codeSwitching: CodeSwitchEvent[];
}

/** A single observation about voice at a specific location in the essay */
interface VoiceObservation {
  /** Which passage this observation covers */
  location: {
    paragraph: number;
    sentenceRange?: [number, number];   // Optional — null for paragraph-level
  };
  /** What the voice is doing at this location */
  observation: string;
  /** Which dimension(s) this observation primarily concerns */
  dimensions: VoiceDimension[];
}

/** The five voice dimensions */
type VoiceDimension = 'register' | 'vocabulary' | 'rhythm' | 'perspective' | 'tonal_disposition';

/** Tonal quality — the emotional coloring of the narrator's stance */
type TonalQuality =
  | 'humor'
  | 'irony'
  | 'earnestness'
  | 'irreverence'
  | 'solemnity'
  | 'self_awareness'
  | 'detachment'
  | 'tenderness'
  | 'defiance';

/**
 * A recorded voice shift — where one or more voice dimensions change.
 * The intentionality assessment is the map's most critical annotation:
 * it determines whether the shift is a strength (intentional variation
 * serving the narrative) or a weakness (unintentional drift the student
 * should be aware of).
 */
interface VoiceShift {
  /** Where the shift occurs — paragraph boundary or mid-paragraph */
  location: {
    paragraph: number;
    sentence?: number;          // Omitted if at paragraph boundary
    boundary: 'paragraph_boundary' | 'mid_paragraph' | 'sentence_boundary';
  };
  /** Which dimensions shift */
  dimensions: VoiceDimension[];
  /** Description of the shift */
  fromDescription: string;      // "sensory-concrete, transactional vocabulary"
  toDescription: string;        // "intimate-reflective, inheritance vocabulary"

  /**
   * Intentionality assessment — the critical distinction.
   *
   * [Includes confidence per review M4]: below 0.6, the system should
   * present the shift as a question to the student ("I notice your voice
   * shifts here — was that a deliberate choice?") rather than asserting
   * intentionality or flagging inconsistency.
   */
  intentionality: {
    assessment: 'intentional' | 'unintentional' | 'ambiguous';
    /** 0-1. Below 0.6 = present as question to student, not assertion */
    confidence: number;
    /** WHY the system believes this is intentional or not */
    reasoning: string;
    // "Aligns with paragraph boundary and emotional turn from transactional
    // to reflective. The shift is clean — full commitment to new register.
    // Serves the thematic move from market-value to felt-value."
  };

  /** What the shift serves (for intentional shifts) */
  servesFunction?: string;      // "emotional transition", "thematic pivot", "bracket closure"
  /** Cross-dimension entanglement reference (if this shift IS a thematic/emotional move) */
  entanglementRef?: string;     // ID into entanglements array
}

/**
 * A code-switching event — a language or register shift with cultural roots.
 *
 * Example: A student writing in English who drops into Spanish when quoting
 * their grandmother: 'Mija, las cosas imperfectas son las mas bonitas.'
 * This is not a voice inconsistency — it's an intentional move that carries
 * cultural meaning the English-only essay cannot express.
 */
interface CodeSwitchEvent {
  location: { paragraph: number; sentence: number };
  /** The language or register being switched to */
  language: string;             // "Spanish", "AAVE", "formal Mandarin"
  /** What triggered the switch — usually a contextual or emotional trigger */
  trigger: string;              // "quoting grandmother", "moment of high emotion"
  /** The cultural function the switch serves */
  culturalFunction: string;     // "preserving the grandmother's actual words carries
                                //  authenticity that English translation would flatten"
  /** Text of the code-switched passage */
  text: string;
}
```

**How Voice Map integrates with Voice Identity:**

Voice Identity remains the holistic summary — the essay's voice described in prose. It answers "what does this writer sound like?" The Voice Map answers "where does the voice live and how does it move?" They are complementary, not redundant:

| Question | Answered By |
|----------|------------|
| "What does this writer's voice sound like?" | `voiceIdentity.signature` |
| "How does the voice change through the essay?" | `voiceIdentity.evolution` + `voiceMap.shifts[]` |
| "Is the shift in P3 intentional?" | `voiceMap.shifts[]` (with confidence + reasoning) |
| "Where does the writer use humor?" | `voiceMap.tonalDisposition.observations[]` |
| "Is this student's voice authentic?" | `voiceIdentity.authenticVsPerformed` + `voiceMap` (authentic voice shows consistent fingerprint with intentional variation) |
| "Does this student sound the same across essays?" (portfolio) | Compare `voiceMap` baselines across essays |

**Updated `voiceIdentity` type (consistency score removed, voice map reference added):**

```typescript
interface VoiceIdentity {
  /** One-paragraph description of the writer's voice */
  signature: string;
  /** Primary register */
  register: string;
  /** What makes this voice distinctive */
  distinctivePatterns: string[];
  /** How voice evolves through the essay — narrative of voice movement */
  evolution: string;
  /** Moments that feel genuinely the writer's vs. moments that feel performed */
  authenticVsPerformed: Array<{
    location: [number, number];    // [paragraph, sentence]
    assessment: 'authentic' | 'performed';
    reasoning: string;
  }>;

  // REMOVED: consistencyScore: number — replaced by voiceMap
  // The voice map provides spatial, dimensional tracking of voice stability
  // and shift. A single number cannot capture "consistent register but
  // shifting vocabulary" or "stable rhythm with one intentional disruption."
}
```

---

### Moment Earned-ness Map: Backward-Tracing Network

The original `emotionalTopography` section included `isEarned: boolean` on emotional moments. This is replaced with a far richer structure: a backward-tracing network that maps HOW each significant moment is earned through specific narrative mechanisms pointing to earlier passages.

**Why "moment" and not just "emotional":** Strong essays don't only have emotional arcs. They have intellectual arcs (paradigm shifts, realizations that reframe everything preceding them), humorous arcs (comedic builds where the payoff lands because of setup), and subversive arcs (expectations established and then deliberately broken). All of these follow the same earned-ness logic: the payoff works because earlier passages did specific narrative work. Restricting earned-ness to emotions misses half of what makes essays effective.

A student who writes "I realized that my obsession with perfect scores was actually my way of controlling the one thing my parents' divorce couldn't touch" — that's an intellectual moment, not an emotional one. But it is EARNED by the same mechanism: prior passages must have established the obsession, shown its costs, revealed the divorce context, and built toward the moment where the student connects these threads. If the realization appears in paragraph 4 with no prior setup, it feels unearned regardless of its intellectual truth.

**The earned-ness map is a DIAGNOSIS tool, not a score.** It doesn't rate earned-ness on a scale. It traces the network of supporting passages for each significant moment. A dense network (many arrows converging) means the moment is well-earned. A sparse network (few or no arrows) means the moment is unearned — and the sparseness itself tells the student exactly what is missing.

```typescript
/**
 * Moment Earned-ness Map — backward-tracing network for significant moments.
 *
 * For each significant moment in the essay (emotional, intellectual, humorous),
 * traces backward through the narrative to identify the specific earlier passages
 * that make it work (or the specific gaps that make it fall flat).
 *
 * This is NOT stored in emotionalTopography. It is its own section in the holistic
 * profile because it covers emotional, intellectual, and humorous moments — and
 * because its graph-like structure (arrows from payoff to setup) is fundamentally
 * different from the linear progression that emotionalTopography describes.
 *
 * [Generalized from emotional-only per review S5. Added intellectual scaffolding
 * and comedic/subversive setup as mechanism types.]
 */
interface MomentEarnednessMap {
  /**
   * Each significant moment in the essay, with its backward-tracing network.
   * "Significant" is determined by L3.75 holistic synthesis — moments where
   * the essay's meaning crystallizes, emotional stakes peak, humor lands,
   * or intellectual frameworks shift.
   */
  moments: EarnedMoment[];

  /**
   * Essay-level summary of earned-ness patterns.
   * NOT a score — a structural observation about the essay's setup-payoff architecture.
   */
  structuralObservation: string;
  // "The essay's emotional and intellectual moments are well-supported by P1-P2's
  // sensory grounding and P3's character development. P4's humor is less earned —
  // the comedic register appears without prior setup, making the shift feel abrupt."
}

/**
 * A single significant moment with its earned-ness network.
 */
interface EarnedMoment {
  /** Where the moment occurs */
  location: { paragraph: number; sentence: number };

  /** What kind of moment this is */
  momentType: 'emotional' | 'intellectual' | 'humorous' | 'subversive';

  /** Description of the moment */
  description: string;
  // "P4S3: the decision to take the ring back — relief mixed with defiance, high intensity"
  // "P3S5: the realization that perfectionism was a control mechanism — paradigm shift"
  // "P4S1: the deadpan 'I asked the pawnbroker if he took Venmo' — comedic deflection"

  /** The emotion, idea, or effect the moment carries */
  payload: string;
  // "relief mixed with defiance"
  // "paradigm-shifting self-awareness"
  // "humor that cuts tension while revealing character"

  /**
   * The narrative mechanisms that earn this moment — specific earlier passages
   * that contribute to the reader's willingness to feel/accept this moment.
   *
   * Each mechanism points to a specific earlier passage and describes its
   * contribution. The DENSITY of this array is the diagnosis: many mechanisms
   * converging = well-earned. Few mechanisms = unearned.
   */
  mechanisms: EarningMechanism[];

  /**
   * What is MISSING when the moment is unearned.
   * Populated when the mechanisms array is sparse — identifies the gap
   * that makes the moment feel abrupt or told-rather-than-shown.
   *
   * This is not a score. It is a diagnosis that directly informs what
   * the student needs to ADD to earn this moment.
   */
  gaps: string[];
  // ["No prior passage established emotional proximity to the grandmother.
  //  The reader was told about the relationship but never shown it."]
  // ["The comedic register appears for the first time at this moment —
  //  the reader has no preparation for humor, so the shift feels jarring."]
}

/**
 * A single earning mechanism — a specific earlier passage that contributes
 * to a significant moment's impact.
 *
 * Mechanism types cover the full range of how essays build toward payoffs:
 * emotional, intellectual, and comedic/subversive.
 */
interface EarningMechanism {
  /** The type of narrative work this passage does for the moment */
  type: EarningMechanismType;

  /** Where the earning passage is */
  location: { paragraph: number; sentence?: number; sentenceRange?: [number, number] };

  /** How this passage contributes to the moment's impact */
  contribution: string;
  // "P1S1-3: pawnshop described through fluorescent lights, magnifying glass.
  //  The reader can SEE the place, so the stakes in P4 feel concrete."
  // "P3S2: the narrator's habit of cataloging flaws in beautiful things.
  //  P4's defiance is earned because we already know this person struggles
  //  with valuing imperfect things."

  /** Connection reference if this mechanism corresponds to a tracked connection */
  connectionRef?: string;       // ID into connections.all[]
}

/**
 * Types of narrative mechanisms that earn significant moments.
 *
 * The original five (sensory grounding, emotional setup, stakes establishment,
 * character revelation, thematic preparation) cover emotional payoffs.
 * Two additions cover intellectual and humorous payoffs:
 *
 * - Intellectual scaffolding: prior reasoning that makes a realization feel
 *   inevitable rather than asserted. "I'd always thought X... then Y happened...
 *   and suddenly X looked completely different."
 *
 * - Comedic/subversive setup: expectations established that the payoff subverts.
 *   The humor works because the reader expected one thing and got another —
 *   but only if the expectation was properly established first.
 *
 * [Added per review S5]
 */
type EarningMechanismType =
  | 'sensory_grounding'         // Physical details that made the situation feel real
  | 'emotional_setup'           // Earlier emotional moments that built toward this one
  | 'stakes_establishment'      // Moments that defined what could be lost
  | 'character_revelation'      // Earlier moments revealing who this person is
  | 'thematic_preparation'      // Earlier thematic work giving the moment meaning
  | 'intellectual_scaffolding'  // Prior reasoning that makes a realization inevitable
  | 'comedic_subversive_setup'; // Expectations established that the payoff subverts

```

**Updated `emotionalTopography` type (isEarned removed, earned-ness map reference added):**

The emotional topography retains its original purpose: mapping the essay's emotional arc, peaks, undertones, and progression. What it no longer does is judge earned-ness with a boolean flag. That judgment now lives in the moment earned-ness map, which traces the MECHANISM of earned-ness through a backward-tracing network.

```typescript
interface EmotionalTopography {
  /** The essay's emotional arc — how emotion moves from opening to close */
  arcTrajectory: string;
  /** Peak emotional moments — WHAT and WHERE */
  peakMoments: Array<{
    location: [number, number];
    emotion: string;
    intensity: 'low' | 'moderate' | 'high' | 'peak';
    // REMOVED: isEarned: boolean — see momentEarnednessMap for earned-ness analysis
  }>;
  /** Undertones — emotions felt but not stated */
  undertones: string[];
  /** How emotion shifts paragraph to paragraph */
  emotionalProgression: Array<{
    paragraph: number;
    register: string;           // "anxious anticipation", "tender nostalgia"
    shift: string;              // How it differs from the previous paragraph
  }>;
  /** Show vs tell assessment — where emotions are embodied vs asserted */
  showVsTell: Array<{
    location: [number, number];
    assessment: 'shown' | 'told' | 'mixed';
    detail: string;
  }>;
}
```

**How earned-ness map and emotional topography complement each other:**

| Question | Answered By |
|----------|------------|
| "What emotions appear in the essay?" | `emotionalTopography.peakMoments` + `emotionalProgression` |
| "How does emotion move through the essay?" | `emotionalTopography.arcTrajectory` + `emotionalProgression` |
| "Is P4's emotional climax earned?" | `momentEarnednessMap.moments[]` (the backward-tracing network for P4's moment) |
| "What's missing that would make P4 land harder?" | `momentEarnednessMap.moments[].gaps[]` |
| "Where does the essay tell rather than show?" | `emotionalTopography.showVsTell[]` |
| "Is P3's intellectual realization earned?" | `momentEarnednessMap.moments[]` (not in emotionalTopography at all — intellectual moments have their own earned-ness tracking) |

---

### Essay North Star: Architecture of Meaning (Replaces EssayDNA)

The North Star is the system's understanding of how an essay **means** — not what it says or how well, but the architecture by which individual moments compose into a unified act of self-revelation. It is the conductor's interpretive markings — not the notes, but how they relate to create the symphony.

**This is NOT a summary.** A summary is a lossy compression — everything in it exists more deeply elsewhere in the profile. The North Star is an emergent property that no individual profile section contains. You cannot derive it by compressing the profile; you can only produce it by synthesizing across the complete understanding. If you deleted the North Star, you would lose an interpretive synthesis that requires re-reading the entire profile holistically to reconstruct. If you deleted a summary, you could regenerate it trivially.

**Why it replaces EssayDNA:** The old EssayDNA was a ~500-token compressed identity — essentially a business card. It answered "what is this essay about?" The North Star answers "how does this essay MEAN?" This transformation changes every downstream consumer: annotations gain structural significance awareness, edit interpretation gains fulcrum detection, coaching gains trajectory guidance, and portfolio strategy gains meaning-architecture composition.

**Scaled by essay length:** Not every essay needs five dimensions. A 150-word "Why This School" supplement doesn't have a through-line that "surfaces, submerges, transforms, and resolves." Applying the full North Star to a supplement produces over-interpretation and wastes tokens. The scaling rule:

| Essay Type | Word Range | North Star Dimensions | Rationale |
|------------|-----------|----------------------|-----------|
| **Supplements** | <250 words | 2: Structural Role + Distinctiveness | Short essays serve a specific portfolio function. What IS this essay in the portfolio, and what makes it non-interchangeable? |
| **PIQs** | ~350 words | 3: + Trajectory | PIQs have enough structure for trajectory (where the essay could go) but not enough for a full through-line map or intent bridge |
| **Personal Statements** | ~650 words | 5: Full North Star | Full architecture of meaning — through-line, roles, trajectory, distinctiveness, intent bridge |

```typescript
/**
 * Essay North Star — the architecture of meaning.
 *
 * Five conceptual dimensions that together describe HOW the essay means,
 * not what it says or how well. Built progressively through layers:
 * - After L1: rough hypotheses
 * - After L2 + L2.5: structural skeleton
 * - After L3: real connections (through-line, structural roles emerge)
 * - After L3.75: full architecture (trajectory, distinctiveness crystallize)
 * - After L6: architecture + student voice (intent bridge populated)
 *
 * L4 Crystallization is where the North Star is articulated as a coherent
 * artifact. The earlier layers provide raw material; L4 synthesizes.
 *
 * Scaled by essay length — supplements get 2 dimensions, PIQs get 3,
 * personal statements get all 5. [Per review C4]
 */
interface EssayNorthStar {
  /** Which dimensions are active for this essay (driven by essay length) */
  activeScale: 'supplement' | 'piq' | 'personal_statement';

  // ── DIMENSION 1: THROUGH-LINE MAP ──
  // (personal statements only — null for supplements and PIQs)

  /**
   * Traces the essay's central element — image, question, tension, metaphor —
   * where it surfaces, submerges, transforms, and resolves.
   *
   * CRITICAL DISTINCTION from connection graph [per review S6]:
   * - Connection graph = raw DATA: "these sentences are linked, here's the type"
   *   (P1S1 → P5S4, type: setup→payoff)
   * - Through-line map = INTERPRETATION: "the diamond's MEANING transforms from
   *   commodity → inheritance → identity across these links"
   *
   * L4 crystallization READS the connection graph and sentence understanding
   * to PRODUCE the through-line map as a higher-order synthesis. The through-line
   * is a computed view, not redundant storage.
   */
  throughLineMap: ThroughLineMap | null;

  // ── DIMENSION 2: STRUCTURAL ROLES MAP ──
  // (all essay types)

  /**
   * What each section IS in the architecture of meaning — not its topic or
   * rhetorical function (the paragraph understanding already has that), but
   * its structural necessity.
   *
   * The pawnshop scene isn't "the opening" — it's the essay's FRAME OF RISK.
   * Without the risk of loss, nothing else has stakes. This matters because
   * significance-awareness changes everything: editing the fulcrum should be
   * treated with far more care than editing a transitional sentence.
   */
  structuralRolesMap: StructuralRole[];

  // ── DIMENSION 3: TRAJECTORY & POTENTIAL ──
  // (PIQs and personal statements — null for supplements)

  /**
   * Where the essay IS and where it could GO — capturing not just the current
   * state but the unrealized connections and possible deepenings.
   *
   * ALWAYS presents MULTIPLE PLAUSIBLE PATHS [per review S9], not one
   * prescription. The North Star reads the essay's own momentum — it does
   * NOT impose an external ideal.
   *
   * "The essay could resolve through X (most supported by current text), or
   * through Y (if the student wants to emphasize Z)."
   *
   * This makes trajectory a student decision tool, not an LLM prescription.
   * The LLM's training data likely favors resolution-based arcs — presenting
   * multiple paths prevents it from projecting that preference onto intentionally
   * open-ended essays.
   */
  trajectory: EssayTrajectory | null;

  // ── DIMENSION 4: DISTINCTIVENESS SIGNATURE ──
  // (all essay types)

  /**
   * What makes this essay NON-INTERCHANGEABLE — the specific combination of
   * experience, structural choice, and voice that could not have been written
   * by anyone else.
   *
   * NOT "this essay is about family and imperfection" (topic label, describes
   * thousands of essays). Instead: "uses pawnshop economics to dramatize the
   * gap between market value and inherited worth. The student's voice oscillates
   * between transaction language and inheritance language, and that oscillation
   * IS the essay's argument."
   *
   * READS FROM entanglements [per review S7]: entanglements are the evidence
   * layer (specific, located: "P2S3's voice shift IS the thematic pivot").
   * Distinctiveness is the synthesis layer (global, interpretive: "the oscillation
   * between transaction and inheritance language IS the argument").
   *
   * Staleness cascades from entanglements → distinctiveness, not the reverse.
   * When entanglements change, distinctiveness may need re-synthesis. When
   * distinctiveness is re-articulated, entanglements are unaffected.
   */
  distinctivenessSignature: DistinctivenessSignature;

  // ── DIMENSION 5: INTENT BRIDGE ──
  // (personal statements only — null for supplements and PIQs)

  /**
   * Holds the student's stated understanding alongside the system's understanding.
   * The divergence itself is valuable coaching fuel.
   *
   * A student who says "I just thought it was a good story" when the essay is
   * doing sophisticated thematic work — that gap is a coaching opportunity,
   * not a problem.
   *
   * Populated primarily through L6 conversation. Before L6, this is null or
   * hypothesis-level.
   */
  intentBridge: IntentBridge | null;

  // ── METADATA ──

  /** Confidence level of the North Star overall */
  confidence: 'hypothesis' | 'emerging' | 'full' | 'student_confirmed';
  /** Which layer last updated the North Star */
  lastUpdatedBy: string;        // "L1", "L2", "L3", "L3.75", "L4", "L6"
}

/**
 * Through-Line Map — traces the essay's central element through the narrative.
 */
interface ThroughLineMap {
  /** The central element being traced */
  centralElement: string;       // "the cloudy diamond"
  /** What kind of element it is */
  elementType: 'image' | 'question' | 'tension' | 'metaphor' | 'relationship' | 'idea';
  /** The transformation the element undergoes — the MEANING journey */
  transformation: string;
  // "commodity → inheritance → identity"

  /** Where the element surfaces, submerges, transforms across the essay */
  journey: Array<{
    location: { paragraph: number; sentence?: number };
    /** What the element means at this point in the journey */
    meaningAtPoint: string;
    // "physical object in transactional setting" → "symbol of deliberate choice"
    // → "test of whether the student understands what was chosen"
    /** What narrative move happens to the element here */
    narrativeMove: 'introduction' | 'development' | 'submersion' | 'resurfacing'
      | 'transformation' | 'resolution' | 'complication' | 'echo';
  }>;

  /** Connection references from the connection graph that constitute this through-line */
  connectionRefs: string[];     // IDs into connections.all[] — the raw data this interprets
}

/**
 * Structural Role — what a section IS in the architecture of meaning.
 */
interface StructuralRole {
  /** Which paragraph(s) this role covers */
  paragraphs: number[];         // Often 1, but can span multiple (e.g., [0, 1] for a two-paragraph opening)
  /** The structural role */
  role: string;                 // "frame_of_risk", "value_system", "fulcrum", "resolution", "bridge"
  /** WHY this role matters to the essay's architecture */
  significance: string;
  // "Without the risk of loss established in the pawnshop, the grandfather's
  // choice has no stakes, the near-selling has no weight, and the closing
  // revelation has no tension to resolve."
  /** How load-bearing this section is — determines edit sensitivity */
  weight: 'load_bearing' | 'supporting' | 'transitional' | 'decorative';
}

/**
 * Essay Trajectory — where the essay IS and where it COULD go.
 *
 * Always presents multiple plausible paths. The most-supported path is marked
 * but others are presented as genuine alternatives, not afterthoughts.
 */
interface EssayTrajectory {
  /** Current state assessment — what the essay has established so far */
  currentState: string;
  // "The essay has established pawnshop stakes and grandfather's backstory.
  // The near-selling scene exists but hasn't fully earned its emotional weight."

  /**
   * Multiple plausible paths the essay could take from here.
   * ALWAYS plural [per review S9]. The student decides, the system maps options.
   */
  plausiblePaths: Array<{
    /** Description of this trajectory */
    description: string;
    // "Deepen the near-selling scene to make the temptation of forty dollars feel
    // genuinely real, then let the closing revelation emerge from the contrast
    // between market and felt value."
    /** How much the current text supports this path (not how "good" it would be) */
    textSupport: 'strong' | 'moderate' | 'speculative';
    /** What would need to change or be added to realize this path */
    requirements: string[];
  }>;

  /** Unrealized connections — things the text contains that could be threaded more deeply */
  unrealizedConnections: Array<{
    description: string;
    // "P2 mentions the grandfather holding the ring up to the light — this image
    // could thread forward to the closing if the student describes light passing
    // through the diamond's cloudiness."
    locations: Array<[number, number]>;   // Paragraph, sentence pairs
  }>;
}

/**
 * Distinctiveness Signature — what makes this essay non-interchangeable.
 */
interface DistinctivenessSignature {
  /** The core distinctiveness articulation — one paragraph, not a label */
  articulation: string;
  // "This essay uses the specific economics of a pawnshop — a place where
  // sentimental value is converted to market value — to dramatize the gap
  // between how the world prices things and how a family values them. The
  // student's voice, which oscillates between the concrete language of
  // transactions ('fourteen karat,' 'forty dollars') and the abstract
  // language of inheritance ('what he chose for her'), creates a tension
  // that IS the essay's argument."

  /** The entanglement references this distinctiveness draws from */
  entanglementRefs: string[];   // IDs into entanglements array
  // [Per review S7]: entanglements are evidence, distinctiveness is synthesis.
  // This field makes the dependency explicit and traceable.

  /** What makes it non-interchangeable — specific, not categorical */
  nonInterchangeableFactors: string[];
  // ["Pawnshop setting provides unique economic framing for a family-values essay"]
  // ["Voice oscillation between transaction and inheritance IS the argument"]
  // ["Diamond's cloudiness — a literal flaw — becomes the organizing image"]
}

/**
 * Intent Bridge — student's stated understanding alongside the system's.
 */
interface IntentBridge {
  /** What the student says the essay is about / trying to do */
  studentIntent: string | null;
  /** What the system reads the essay as doing */
  systemReading: string;
  /** How they align or diverge — the divergence is coaching fuel */
  alignments: Array<{
    aspect: string;             // "central theme", "essay's argument", "emotional arc"
    alignment: 'confirmed' | 'partial' | 'divergent' | 'student_unaware';
    detail: string;
    // confirmed: "Student says 'it's about choosing imperfect things' — matches system reading."
    // divergent: "Student says 'it's about my grandmother's ring' — system reads it as
    //            being about the student's relationship to inherited value systems."
    // student_unaware: "Student says 'I just thought it was a good story' — the essay
    //                   is doing sophisticated thematic work the student hasn't named."
  }>;
  /** Session insights that informed the bridge — traceable to specific conversations */
  sourceInsightIds: string[];
}
```

**How the North Star is built (progressive crystallization):**

| After Layer | Quality | What It Looks Like |
|-------------|---------|-------------------|
| L1 (Haiku) | Rough hypotheses | "Recurring diamond image. Possible bracket structure. Transactional opening." |
| L2 + L2.5 | Structural skeleton | "Bracket essay, recurring diamond, tonal arc from transactional to reflective." |
| L3 (Walk) | Real connections | "P1 is frame of risk. Grandfather story transforms diamond from object to symbol. Near-selling is fulcrum." |
| L3.75 (Synthesis) | Full architecture | Complete through-line map, structural roles, trajectory, distinctiveness. The conductor's score. |
| L6 (Conversation) | Architecture + student voice | Intent Bridge populated, trajectory may shift based on student-revealed context. |

L4 Crystallization is where the North Star is articulated as a coherent artifact — the earlier layers provide raw material, L4 synthesizes. This is why L4 must be a Sonnet call, not extraction: the North Star requires synthesis that doesn't exist in any individual profile section.

**How the North Star is used (4 scenarios):**

**Annotations**: Without North Star -> "Consider showing your grandfather's values through action." With North Star -> "Your grandfather's values need to be FELT before paragraph 4, where you almost trade them away. Right now we're told he chose the diamond — we don't experience the weight. What if we SAW the moment he chose it? The reader needs to carry that choice so when you almost sell the ring, we feel what's at stake."

**Edit Interpretation**: Student changes "decided" to "couldn't" in P4. Without North Star -> minor word swap. With North Star -> P4 is the fulcrum. "Decided" = rational choice aligned with values. "Couldn't" = overcome by attachment they don't understand. This is a shift in the essay's entire theory of agency. The edit understanding pipeline knows to check whether the trajectory has shifted.

**Portfolio Strategy**: Five essays, each with its own North Star. The portfolio intelligence reads all five: "Across these essays, the student repeatedly explores the gap between how the world measures value and how they've learned to measure it. Each essay illuminates a different facet. The portfolio's collective argument is a coherent philosophy of value."

**Coaching**: Student asks "what should I work on?" Without North Star -> "Paragraph 2 has the lowest score." With North Star -> "Your turning point depends on the reader FEELING your grandfather's values. Paragraph 2 tells us about them but we don't feel them. Strengthening P2 makes your entire climax land harder."

---

### Cross-Dimension Entanglements

The seven holistic dimensions (voice, emotion, theme, narrative, character, craft, admissions) are not independent columns in a spreadsheet — they are a web. Voice informs how we interpret theme. Structure enables (or breaks) emotional progression. Craft choices reveal character. The holistic profile captures each dimension well, but it does not capture the INTERSECTIONS — the moments where understanding one dimension requires understanding another.

Cross-dimension entanglements are the eighth holistic section. They record moments where two or more dimensions intersect meaningfully in a way that neither dimension's section alone can capture.

**Why this matters:** "P2S3's voice shift from concrete to reflective IS the thematic pivot from transaction to value." This is not a voice observation (it is more than a voice shift). It is not a theme observation (it is more than a thematic transition). It is an entanglement — a moment where voice does thematic work, and understanding the theme requires understanding the voice choice. These entanglements are what make the system's understanding feel "deep" rather than "categorized."

**Relationship to distinctiveness signature:** Entanglements are the evidence layer (specific, located). The distinctiveness signature in the North Star is the synthesis layer (global, interpretive). L4 reads entanglements as input when producing the distinctiveness signature. Staleness cascades from entanglements to distinctiveness, not the reverse.

```typescript
/**
 * Cross-Dimension Entanglements — moments where 2+ dimensions intersect.
 *
 * Sits as the 8th holistic section (alongside voice, emotion, theme, narrative,
 * character, craft, admissions). Stored in `essay_holistic_sections` with
 * section_type = 'cross_dimension_entanglements'.
 *
 * These are NOT redundant with the individual dimension sections. Each dimension
 * section describes what that dimension does in isolation. Entanglements describe
 * what happens at the INTERSECTION — where voice IS thematic work, where structure
 * ENABLES emotion, where craft REVEALS character.
 *
 * [Per review S7]: Entanglements are evidence that the distinctiveness signature
 * synthesizes from. The dependency is one-directional.
 */
interface CrossDimensionEntanglement {
  /** Unique ID for reference from other sections (e.g., distinctiveness signature) */
  id: string;

  /** The dimensions that intersect at this moment */
  dimensions: HolisticDimension[];
  // e.g., ['voice', 'theme'] or ['structure', 'emotion', 'character']

  /** Where in the essay this entanglement occurs */
  location: {
    paragraph: number;
    sentence?: number;
    sentenceRange?: [number, number];
  };

  /** Description of the entanglement — what happens at the intersection */
  description: string;
  // "P2S3's voice shift from concrete to reflective IS the thematic pivot
  // from transaction to value. The voice change isn't merely accompanying the
  // thematic move — it IS the thematic move. The reader experiences the shift
  // from market-thinking to felt-value THROUGH the change in register, not
  // alongside it."

  /** Which dimension sections this entanglement should be cross-referenced in */
  crossRefs: HolisticDimension[];
  // Stored centrally, but the Profile Router can include this entanglement
  // when loading either referenced dimension section.
}

type HolisticDimension =
  | 'voice'
  | 'emotion'
  | 'theme'
  | 'narrative'
  | 'character'
  | 'craft'
  | 'admissions'
  | 'structure';
```

---

### Conversation Insight System: Types

The Conversation Insight system is the bridge between the student's inner world and the system's analytical model. L6 is the only layer where information flows INWARD — the student tells us something the text alone could never reveal. When a student says "actually, the diamond is about my grandfather — he always said flawed things are more interesting," that statement is authoritative in a way no inference can be. It doesn't just update a field; it can reshape the entire profile's understanding.

The system treats every student utterance as a potential signal — not just explicit revelations, but hesitations, corrections, patterns of what they keep returning to and what they avoid.

```typescript
/**
 * Conversation Insight — a single piece of understanding extracted from
 * a student's message during L6 coaching.
 *
 * The taxonomy is layered, not flat. Primary category drives mechanical
 * behavior (what the Profile Manager does). Secondary attributes drive
 * nuanced response (how the coach adapts). New categories can be added
 * to either layer without restructuring the other.
 */
interface ConversationInsight {
  /** Unique ID */
  id: string;

  /** When extracted */
  timestamp: string;

  /** The student's original words that produced this insight */
  sourceText: string;

  // ── PRIMARY CATEGORY (drives Profile Manager action) ──

  /**
   * 8 primary categories. Each maps to specific Profile Manager behavior:
   *
   * - confirmation: boosts confidence in existing understanding
   * - reinterpretation: replaces inferredIntents, triggers cascade check
   * - new_context: adds new understanding
   * - correction: negates something the system said, lowers confidence in related inferences
   * - preference: records stylistic preference
   * - clarification: refines existing understanding
   * - emotional_reaction: carries signal about the student's relationship to their own writing
   * - resistance: asserts artistic intent — the system should probe for the reason
   */
  category: InsightCategory;

  // ── SECONDARY ATTRIBUTES (modulates nuance) ──

  /**
   * Emotional valence of the insight. A reinterpretation delivered with
   * strong emotion ("no, that's not what I meant at ALL") should be treated
   * differently from a casual one ("oh, I guess it's more about...").
   */
  emotionalValence: 'positive' | 'negative' | 'neutral' | 'mixed';

  /**
   * How confident the student seems in what they're saying.
   * "I know exactly what I meant" vs "I think maybe..."
   */
  studentConfidence: 'high' | 'moderate' | 'low' | 'uncertain';

  /**
   * How explicitly the insight was stated.
   * "I meant this sentence to be about loss" = explicit.
   * The student keeps circling back to P3 without naming why = implicit.
   */
  explicitness: 'explicit' | 'implicit' | 'inferred';

  /**
   * How certain we are about the scope of this insight.
   * "I like the ending" — high probability of last paragraph, moderate
   * for last 2-3 sentences. Scope certainty captures this ambiguity.
   */
  scopeCertainty: 'high' | 'moderate' | 'low';

  /**
   * How novel this insight is relative to existing understanding.
   * A confirmation of something the system already strongly believes
   * has low novelty. A correction that contradicts a high-confidence
   * reading has high novelty.
   */
  novelty: 'high' | 'moderate' | 'low';

  // ── SCOPE (probability distribution, not point estimate) ──

  /**
   * Scope as a probability distribution across the essay's hierarchy.
   * "I like the ending" might be:
   *   essay: 0.1, paragraphs: [{index: 4, probability: 0.7}],
   *   sentences: [{paragraph: 4, sentence: 3, probability: 0.5},
   *               {paragraph: 4, sentence: 4, probability: 0.4}]
   *
   * Multi-scope insights are supported — "I wrote the first and last
   * paragraphs together" creates connections between two paragraphs.
   */
  scope: InsightScope;

  // ── SUPERSESSION ──

  /**
   * Partial supersession support. "Yes, it's about imperfection, but
   * specifically how imperfection makes things MORE valuable" — the core
   * insight (imperfection) is confirmed while the framing (negative vs
   * positive) is revised.
   *
   * When non-null, points to the insight being partially superseded.
   * The original is marked as partially superseded, preserving confirmed portions.
   */
  partiallySupersedes?: {
    insightId: string;
    confirmedPortion: string;   // What from the original is still valid
    revisedPortion: string;     // What changed
  };

  // ── DURABILITY ──

  /**
   * How long this insight survives changes to the essay.
   *
   * - ephemeral: tied to specific text, invalidated by edits to that text.
   *   "I chose 'stumbled' deliberately"
   * - draft_durable: survives minor edits, invalidated by structural rewrites.
   *   "This paragraph is about my relationship with control"
   * - essay_durable: persists as long as this essay is being worked on.
   *   "This essay is about inherited value systems"
   * - student_durable: persists across ALL essays.
   *   "I'm a perfectionist and that's part of what I'm writing about"
   *
   * Student-durable insights are COPIED to the user-level `student_insights`
   * table, not just stored here. The re-analysis brief pulls from both stores.
   */
  durability: 'ephemeral' | 'draft_durable' | 'essay_durable' | 'student_durable';

  /** Which essay version this insight was generated against */
  essayVersion: number;
}

type InsightCategory =
  | 'confirmation'
  | 'reinterpretation'
  | 'new_context'
  | 'correction'
  | 'preference'
  | 'clarification'
  | 'emotional_reaction'
  | 'resistance';

/**
 * Scope as a probability distribution across the essay's hierarchy.
 * Supports multi-scope insights (e.g., connecting two paragraphs).
 */
interface InsightScope {
  /** Probability this insight applies to the entire essay */
  essayProbability: number;
  /** Paragraph-level probabilities */
  paragraphs: Array<{ index: number; probability: number }>;
  /** Sentence-level probabilities */
  sentences: Array<{ paragraph: number; sentence: number; probability: number }>;
}

/**
 * Pattern-Level Meta-Insight — observations about the coaching process,
 * not the essay. Stored separately so they inform coaching strategy
 * without polluting the essay profile.
 *
 * Examples:
 * - "Student keeps circling back to P3 — may indicate unresolved concern"
 * - "Student agrees with feedback but never implements changes in this area"
 * - "Student becomes more engaged when discussing voice than when discussing structure"
 */
interface PatternInsight {
  id: string;
  pattern: string;              // Description of the observed pattern
  evidence: string[];           // Specific instances that constitute the pattern
  implication: string;          // What this means for coaching strategy
  firstObservedAt: string;
  lastObservedAt: string;
  instanceCount: number;
}
```

---

### Edit Understanding: Types

The Edit Understanding system bridges between raw text diffs and profile-level comprehension. It replaces both the old Edit Diff (1B) and Impact Classification (1D) with an LLM-powered pipeline that understands what edits MEAN, not just what characters changed.

```typescript
/**
 * EditDiff — the mechanical pre-processing output. What physically changed
 * between two versions of the essay, structured hierarchically.
 *
 * This step IS mechanical — it produces the raw textual diff that the LLM
 * will then interpret. No judgment, no significance assessment.
 */
interface EditDiff {
  /** Essay-level structural changes */
  structural: {
    paragraphsAdded: number[];
    paragraphsRemoved: number[];
    paragraphsReordered: boolean;
    /** Net change in paragraph count */
    paragraphDelta: number;
  };

  /** Per-paragraph changes */
  paragraphChanges: Array<{
    paragraphIndex: number;
    /** Whether this paragraph existed before or is new */
    changeType: 'modified' | 'added' | 'removed';
    /** Sentence-level changes within this paragraph */
    sentenceChanges: Array<{
      sentenceIndex: number;
      changeType: 'modified' | 'added' | 'removed' | 'unchanged';
      oldText?: string;
      newText?: string;
      /** Word-level diff within changed sentences */
      wordDiff?: Array<{
        type: 'added' | 'removed' | 'unchanged';
        text: string;
      }>;
    }>;
  }>;

  /** Summary statistics */
  stats: {
    totalSentencesChanged: number;
    totalWordsChanged: number;
    changeRatio: number;        // 0-1: fraction of essay text that changed
  };
}

/**
 * EditUnderstanding — the Sonnet call output. The LLM's nuanced reading
 * of what the edit means in the context of the essay's profile.
 *
 * This is the core intelligence step. The LLM receives the raw diff
 * alongside the relevant profile context and produces a reading that
 * no amount of string comparison could achieve.
 */
interface EditUnderstanding {
  /**
   * How significant is this change?
   * Not just "7% of words changed" but "this single word changes the
   * sentence's meaning from active agency to passive compulsion."
   */
  significance: 'minor' | 'moderate' | 'significant' | 'transformative';
  significanceReasoning: string;

  /**
   * What kind of change is this? Classified with nuance that syntactic
   * analysis cannot achieve.
   */
  changeType: EditChangeType;

  /**
   * What is the apparent purpose? The LLM infers likely intent.
   * This inference is TENTATIVE — it can be confirmed or corrected
   * by the Conversational Edit Workshop.
   */
  apparentPurpose: string;
  purposeConfidence: number;    // 0-1

  /**
   * How this change maps to the profile — which sections are affected
   * and how. The LLM traces implications with awareness of the essay's
   * meaning architecture.
   */
  profileImpact: {
    /** The changed sentence's own understanding and analysis always need updating */
    directImpact: string;
    /** Does this change alter, strengthen, weaken, or break connections? */
    connectionImpact: Array<{
      connectionId: string;
      effect: 'altered' | 'strengthened' | 'weakened' | 'broken' | 'unchanged';
      reasoning: string;
    }>;
    /** Does this change affect the paragraph's role or contribution? */
    paragraphImpact: string | null;
    /** Does this change ripple into holistic sections or North Star? */
    holisticImpact: string | null;
  };

  /**
   * Recommended analysis scope — how much re-analysis is warranted.
   * The LLM's recommendation comes with reasoning, which the system
   * logs for the double-check loop and future calibration.
   */
  scopeRecommendation: {
    scope: 'sentence_update' | 'paragraph_reanalysis' | 'targeted_holistic_refresh' | 'comprehensive';
    reasoning: string;
    /** Specific sections/paragraphs to refresh (for targeted scopes) */
    targets?: string[];
  };
}

type EditChangeType =
  | 'word_refinement'           // Same meaning, better word
  | 'meaning_evolution'         // Sentence now communicates something different
  | 'tonal_voice_shift'         // Same content, different register
  | 'content_expansion'         // New information added
  | 'content_reduction'         // Information removed
  | 'structural_reorganization'; // Paragraphs moved, split, merged

/**
 * VersionRecord — accumulated changes between two analysis points.
 * This is NOT a rollback backup (that's essay_version_snapshots). This is
 * a running change log with intent annotations from conversations.
 */
interface VersionRecord {
  /** Version identifier (incremented at each analysis checkpoint) */
  version: number;
  /** Essay text at this version's analysis checkpoint */
  snapshotText: string;
  /** Timestamp of the analysis checkpoint */
  analyzedAt: string;

  /** All changes that occurred between the previous version and this one */
  changes: Array<{
    timestamp: string;
    /** Where the change occurred */
    location: { paragraph: number; sentence?: number };
    /** Old and new text */
    oldText: string;
    newText: string;
    /** Edit understanding (from the Edit Understanding pipeline) */
    understanding?: EditUnderstanding;
    /** Student's stated intent — from Conversational Edit Workshop (Pathway 1) */
    intentAnnotation?: string;
    // "I felt like the old ending was too abrupt — I want the reader to sit
    // with the image."
  }>;

  /** Conversation insights collected since the previous version */
  insightsSinceLastVersion: string[];   // Insight IDs

  /** Light-touch adjustments applied during this version */
  lightTouchAdjustments: Array<{
    field: string;
    adjustment: string;
    source: 'conversation' | 'edit_workshop';
  }>;
}
```

---

### The EssayProfile Root Type

With all sub-types defined, here is the complete root type. This is the structure that the Profile Manager mutates, the Profile Router selectively loads, and every layer produces or consumes.

```typescript
/**
 * EssayProfile — the complete multi-resolution semantic map of an essay.
 *
 * Organized into four resolution levels:
 * 1. Holistic (essay-level understanding + analysis)
 * 2. North Star (architecture of meaning — emergent synthesis)
 * 3. Paragraph (per-paragraph understanding + analysis)
 * 4. Sentence (per-sentence understanding + analysis, nested under paragraphs)
 *
 * Plus cross-cutting structures:
 * - Connections (centralized, single source of truth)
 * - Cross-dimension entanglements (the 8th holistic section)
 * - Voice map (five-dimensional spatial tracking)
 * - Moment earned-ness map (backward-tracing network)
 * - Edit understanding (version tracking + change comprehension)
 * - Conversation insights (L6-sourced student revelations)
 *
 * The profile separates three layers that must never be confused:
 * - Understanding (descriptive): what the essay IS — persistent, deepens every layer
 * - Analysis (evaluative): how well it works — persistent, refined over time
 * - Feedback (prescriptive): what to do about it — EPHEMERAL, generated fresh per context
 */
interface EssayProfile {
  // ── PROFILE INDEX (always loaded — ~250-350 tokens) ──
  index: ProfileIndex;

  // ── HOLISTIC UNDERSTANDING (essay-level — 8 sections) ──

  /** Voice description — WHAT the voice sounds like (holistic summary) */
  voiceIdentity: VoiceIdentity;

  /** Voice map — WHERE the voice lives and HOW it moves (structured spatial map) */
  voiceMap: VoiceMap;

  /** Emotional arc, peaks, undertones, progression */
  emotionalTopography: EmotionalTopography;

  /** Backward-tracing network for significant moments (emotional, intellectual, humorous) */
  momentEarnednessMap: MomentEarnednessMap;

  /** Central thesis, threads, subtext, contradictions */
  thematicArchitecture: ThematicArchitecture;

  /** Primary strategy, pivot points, pacing, structural choices */
  narrativeStrategy: NarrativeStrategy;

  /** Who the writer is — values, growth arc, intellectual fingerprint, blind spots */
  characterRevelation: CharacterRevelation;

  /** Strength signatures, growth edges, image system, patterns */
  craftAssessment: CraftAssessment;

  /** Moments where 2+ dimensions intersect meaningfully */
  entanglements: CrossDimensionEntanglement[];

  /** AO pitch, distinctiveness, institutional fit, red flags, memorability */
  admissionsPositioning: AdmissionsPositioning;

  // ── NORTH STAR (architecture of meaning — replaces EssayDNA) ──

  /** How the essay MEANS — through-line, structural roles, trajectory,
      distinctiveness, intent bridge. Scaled by essay length. */
  northStar: EssayNorthStar;

  // ── PARAGRAPH MAP (per-paragraph understanding + analysis) ──
  paragraphs: ParagraphProfile[];

  // ── CROSS-ESSAY CONNECTIONS (centralized — single source of truth) ──
  connections: ProfileConnections;

  // ── EDIT UNDERSTANDING (version tracking + change comprehension) ──
  editHistory: VersionRecord[];

  // ── CONVERSATION INSIGHTS (L6-sourced student revelations) ──
  conversationInsights: ConversationInsight[];
  patternInsights: PatternInsight[];

  // ── PROFILE METADATA ──
  metadata: {
    confidenceLevel: 'initial' | 'developing' | 'deep' | 'comprehensive';
    lastUpdatedLayer: number;
    paragraphsCovered: number[];
    conversationInsightsCount: number;
    totalAnalysisCost: number;
    /** Timestamp of profile creation */
    createdAt: string;
    /** Timestamp of last mutation */
    lastMutatedAt: string;
    /** Whether this was migrated from the legacy system (needs re-analysis for new structures) */
    legacyProfile: boolean;
  };
}
```

---

### Bidirectional Profile Updates (No Separate Retrospective Pass)

When the deep walk analyzes paragraph 3 and discovers that P1's opening sentence established what turns out to be the essay's central metaphor, this understanding flows BACKWARD immediately:

**L3 Understanding Walk: Each Sonnet call produces UNDERSTANDING ONLY:**

```typescript
interface UnderstandingWalkOutput {
  // ═══ THIS PARAGRAPH'S UNDERSTANDING (no evaluation, no judgment) ═══
  /** What every sentence IS doing, how things connect, what the writer intends.
      The LLM's ONLY job is deep comprehension. No "is this good?" thinking. */
  paragraphUnderstanding: ParagraphUnderstanding;
  // Contains: role, function, narrativeContribution, emotionalRegister, craftProfile
  // AND per-sentence: observedFunctions, inferredIntents, narrativeContributions,
  //   rhetoricalFunctions, significantChoices, connectionRefs, tags

  // ═══ HOLISTIC UNDERSTANDING EVOLUTION (only fields that changed) ═══
  /** Essay-level understanding that evolved from reading this paragraph.
      Complete new values (supersession), not diffs.
      NOTE: This captures INCREMENTAL holistic shifts during the walk.
      The FULL holistic profile (all 8 sections including entanglements) is
      populated by the Holistic Synthesis step AFTER the walk completes —
      see Layer 3.75. */
  holisticEvolution: {
    centralThesis?: string;
    thesisConfidence?: number;
    voiceSignature?: string;
    arcMomentum?: string;
    // Only populated fields are updated. Omitted = unchanged.
  };

  // ═══ PRIOR SENTENCE UNDERSTANDING UPDATES ═══
  /** When this paragraph revealed something new about a PRIOR sentence's
      PURPOSE or MEANING (understanding only — not evaluation). */
  priorSentenceUpdates: Array<{
    paragraph: number;
    sentence: number;
    observedFunctions?: ObservationEntry[];   // REPLACE entire array
    inferredIntents?: ObservationEntry[];     // REPLACE entire array
    narrativeContributions?: ObservationEntry[]; // REPLACE entire array
    newTags?: string[];                       // ADD (deduplicated)
  }>;

  // ═══ NEW CONNECTIONS ═══
  /** Cross-paragraph links discovered. Each gets a unique ID. */
  newConnections: Array<{
    from: [number, number];
    to: [number, number];
    type: string;
    description: string;
  }>;
}
```

**L3.5 Analysis Pass: Each Sonnet call produces ANALYSIS ONLY (separate API call):**

```typescript
interface AnalysisPassOutput {
  paragraphIndex: number;

  // ═══ PER-SENTENCE ANALYSIS (evaluation with COMPLETE understanding) ═══
  /** The LLM sees the ENTIRE understanding profile — every paragraph, every
      connection, every theme. It evaluates HOW WELL each sentence works
      in the context of the COMPLETE essay, not just what it's seen so far. */
  sentenceAnalyses: Array<{
    sentenceIndex: number;
    effectiveness: number;              // 0-100
    effectivenessReasoning: string;     // WHY — references understanding observations
    strengths: ObservationEntry[];      // MULTIPLE things can work well
    weaknesses: ObservationEntry[];     // MULTIPLE issues can exist
    isStrength: boolean;
    isProblem: boolean;
    priorityForImprovement: number;     // 0-5
  }>;

  // ═══ PARAGRAPH-LEVEL ANALYSIS ═══
  paragraphEffectiveness: number;
  paragraphVerdict: string;

  // ═══ HOLISTIC ANALYSIS EVOLUTION ═══
  /** Essay-level evaluative insights that emerged from analyzing this paragraph. */
  holisticAnalysisEvolution: {
    strengthSignatures?: Array<{ quality: string; evidence: string; paragraphs: number[] }>;
    growthEdges?: Array<{ quality: string; description: string; paragraphs: number[] }>;
    aoTakeaway?: string;                // Admissions read (evaluative, not descriptive)
  };
}
```

**Why separate API calls are the strongest anti-repetition defense:**

- **L3 call literally CANNOT evaluate** — its output schema has no effectiveness/strengths/weaknesses fields. The prompt says "understand, don't judge." The output type enforces it.
- **L3.5 call literally CANNOT re-describe** — its input already HAS the complete understanding profile. The prompt says "evaluate, don't redescribe. Reference understanding observations by their content."
- **L5 call literally CANNOT store feedback** — its output goes to annotations, not the profile.

Cross-contamination is structurally impossible because Understanding, Analysis, and Feedback are separate prompts, separate outputs, separate calls. This is stronger than any in-call prompt rule.

**The same subject may naturally appear in multiple fields — but only when genuinely relevant:**

The diamond metaphor might appear in `observedFunctions` (what P1S1 does with it), `thematicArchitecture.threads` (the imperfection theme it carries), `connections.all[]` (how it links P1 to P5), and `tags` (metaphor:diamond). These represent different types of understanding about the same subject — each says something DIFFERENT. But this happens ORGANICALLY as the system encounters the diamond in different contexts, not because it mechanically fills every angle. If the diamond's craft technique aspect is already deeply understood, a later call doesn't re-observe it — it focuses on what's NEW or SHALLOW instead.

**How the two-pass architecture works in practice:**

**L3 Understanding Walk (sequential, understanding only):**

- **P1 understanding**: No prior context. Sonnet outputs `paragraphUnderstanding` for P1 — `observedFunctions` and `inferredIntents` are first-read impressions. No `priorSentenceUpdates` (nothing prior). Profile: initial.
- **P2 understanding**: Sonnet outputs `paragraphUnderstanding` for P2. In `newConnections`: `{from: [1,0], to: [0,2], type: "thread_continuation"}`. In `holisticEvolution`: `{centralThesis: "emerging theme of..."}`. Profile Manager adds connection, adds ref IDs to both sentences. Profile: developing.
- **P3 understanding**: In `priorSentenceUpdates`: P1S1's `observedFunctions` REPLACED with deeper array: `[{observation: "Grounds reader in physical action that becomes the essay's central metaphor"}, {observation: "Introduces the cloudy diamond as imperfection-with-value"}]`. Profile: developing.
- **P5 (final) understanding**: P1S1's `observedFunctions` REPLACED again — now sees the full arc. Profile understanding: deep.

**L3.75 Holistic Synthesis (single Sonnet call — all 8 sections):**

- Reads complete sentence-level understanding. Synthesizes ALL holistic sections: voice identity, voice map, emotional topography, moment earned-ness map, thematic architecture, narrative strategy, character revelation, craft assessment, cross-dimension entanglements, admissions positioning.
- North Star gains structural roles and through-line sketch from this synthesis.

**L3.5 Analysis Pass (parallel, evaluation with complete understanding):**

- **All 5 paragraphs analyzed in parallel** — each Sonnet call receives the COMPLETE understanding profile (including holistic sections from L3.75)
- **P1 analysis** sees that P5 pays off P1's opening — evaluates P1's setup as EFFECTIVE (would have scored lower with partial context)
- **P3 analysis** sees that P3 carries the thematic pivot — evaluates it against the full arc, not just P1-P3
- **Each call's output**: per-sentence `effectiveness`, `strengths[]`, `weaknesses[]`, `priorityForImprovement`

**Result**: Understanding is as deep as it can be (sequential walk with back-propagation). Analysis is as accurate as it can be (parallel evaluation with complete context). Neither layer contaminated the other. Feedback will be generated fresh in L5/L6.

The **Profile Manager** (`essayProfileManager.ts`) processes outputs from both passes:

**After each L3 Understanding Walk call:**
1. Store `paragraphUnderstanding` as the paragraph's understanding entry (replaces any previous)
2. Apply `priorSentenceUpdates` — understanding field replacements (supersession)
3. Add `newConnections` to `connections.all[]`, add ref IDs to endpoint sentences
4. Merge `holisticEvolution` — understanding-level holistic changes
5. Recompute Profile Index (tags, connection graph, section token counts, staleness)
6. Checkpoint the updated profile

**After L3.75 Holistic Synthesis:**
1. Store all 8 holistic sections (supersession — each section fully replaced)
2. Store voice map and moment earned-ness map (granular update for these complex structures — see Profile Growth Rules)
3. Update North Star sketch (structural roles, through-line hypotheses)
4. Recompute Profile Index (north star summary, section token counts)
5. Clear strong staleness on holistic sections

**After each L3.5 Analysis Pass call:**
1. Store `sentenceAnalyses` as each sentence's analysis entry
2. Update holistic analysis sections (strengthsFound, weaknessesFound, craftAssessment)
3. Recompute Profile Index (hasStrengths, hasWeaknesses, improvementPriority flags)
4. No back-propagation needed — analysis sees complete understanding already

### Sentence-Level Intent Distinction

Every sentence in the profile separates Understanding from Analysis from Feedback. Within the Understanding layer, the observed/inferred distinction captures two different perspectives:

| Layer.Field | What it means | Example |
|-------------|---------------|---------|
| **Understanding**.`observedFunctions` | What the sentence IS doing — can be MULTIPLE things (factual observation) | `[{observation: "Grounds reader in pawnshop scene through physical action", confidence: 0.9}, {observation: "Introduces the diamond as the essay's central symbol", confidence: 0.8}]` |
| **Understanding**.`inferredIntents` | What the writer is TRYING to achieve (interpretive) | `[{observation: "Creating physical stakes before emotional ones"}]` |
| **Analysis**.`strengths` | What's working well (evaluative) | `[{observation: "Concrete detail creates immediate sensory engagement"}]` |
| **Analysis**.`weaknesses` | What could be stronger (evaluative) | `[{observation: "The emotional register is flat — physical action without felt tension"}]` |
| **Feedback** *(ephemeral)* | What to DO about it (prescriptive — generated fresh, not stored) | "This opening grounds the reader beautifully. Consider letting us feel the narrator's heartbeat alongside the physical action." |

**Why multi-observation matters**: A sentence can simultaneously ground the reader, introduce a metaphor, and set up a callback. Single-string fields force you to pick one or compress all three into a vague summary. Multi-observation arrays preserve each distinct observation with its own confidence and evidence. The supersession model still works — back-propagation replaces the ENTIRE array with a deeper set of observations.

**Why separating Feedback from Understanding+Analysis matters**: Without separation, a field like `whatWorks: "The concrete detail grounds the reader, which effectively establishes the scene and should be preserved"` mixes all three layers. The Understanding layer says WHAT (grounds, establishes), the Analysis layer says HOW WELL (effectively), and the Feedback layer says WHAT TO DO (preserve). Mixing them creates stale feedback that conflicts with fresh contextual coaching.

The `inferredIntents` field gets refined in Layer 6 when the student reveals their actual thinking — confirmed, corrected, or deepened. Feedback is never stored — always generated fresh from Understanding + Analysis + current teaching context.

### Profile Growth Rules

1. **L1 seeds**: Every section gets initial Understanding observations. Sentence purposes are first-impression guesses. Voice gets initial register detection. Profile Index created with initial tags and paragraph digests. Analysis layer stays `null` — L1 is purely descriptive, all evaluation deferred to L3.5. North Star: rough hypotheses (if any central element is noticed). Voice map: baseline register only. Earned-ness map: empty (requires holistic synthesis).
2. **L2 deepens**: Structural understanding overlaid. Paragraph roles gain structural context. Profile Index updated with structural tags. North Star: structural skeleton emerges.
3. **L2.5 scouts connections**: Cross-paragraph surface connections detected (repeated elements, tonal shifts, structural echoes). Gives L3 forward-looking leads it can't discover sequentially. North Star: scout data feeds through-line hypotheses.
4. **L3 transforms**: The core deepening. Each Sonnet call produces DEEP sentence-level Understanding (multi-observation) with back-propagations to prior paragraphs. By the final paragraph, EVERY sentence (including P1's) has been deeply understood in context of the whole. Understanding ONLY — no evaluation. North Star: real connections discovered (through-line emerges, structural roles crystallize).
4.5. **L3.75 synthesizes holistic understanding**: Single Sonnet call reads all sentence-level understanding and synthesizes all 8 holistic sections (voice identity, voice map, emotional topography, moment earned-ness map, thematic architecture, narrative strategy, character revelation, craft assessment) plus cross-dimension entanglements and admissions positioning. Sees EVERYTHING — produces holistic sections informed by the complete picture. North Star: full architecture (trajectory, distinctiveness crystallize). Voice map: all five dimensions populated with shifts and intentionality assessments. Earned-ness map: backward-tracing networks built for each significant moment.
4.75. **L3.5 evaluates**: With COMPLETE understanding (sentence-level + holistic + North Star sketch), parallel Sonnet calls evaluate every paragraph. Analysis (effectiveness, strengths, weaknesses) stored as separate layer. P1's analysis sees P5's payoff AND the full holistic context.
4.9. **Improvement Phase computed**: `detectImprovementPhase()` analyzes the L3.5 results to classify the essay's current improvement phase (Foundation -> Architecture -> Craft -> Polish -> Distinction). Stored in `ProfileIndex.improvementPhase`. This determines the FEEDBACK zoom level — what gets surfaced to the student.
5. **L4 crystallizes**: North Star fully articulated (replaces EssayDNA). Full profile preserved for RAG. Profile Index finalized with North Star summary.
6. **L5 generates phase-aware Feedback**: Using complete Understanding + Analysis + the current improvement phase + North Star structural significance, generates contextual annotations at the appropriate zoom level (prescriptive layer — not stored in profile, delivered as annotation output). Foundation phase: 2-3 essay-level observations. Polish phase: 8-12 word-level annotations. Annotations are significance-aware: the fulcrum gets more careful treatment than a transitional sentence.
7. **L6 continues**: Phase-aware coaching — coach responds at the current zoom level. Student fixes thesis -> re-analyze -> phase shifts Foundation -> Architecture -> next coaching turn zooms in. Feedback generated fresh per turn. Profile confidence rises to "comprehensive." Conversation insights extracted and stored with durability levels. Intent Bridge populated. Voice map intentionality assessments confirmed or corrected.
8. **Re-analysis adapts**: `selectAnalysisMode()` chooses Comprehensive (structural/major changes) or Focused (surgical edits against deep profile). Focused mode leverages existing profile depth — 1-2 targeted Sonnet calls instead of full re-walk. The escalation ladder handles edge cases where small changes have large ripple effects. The re-analysis brief includes North Star structural roles for the changed areas.

**Supersession model for complex structures (voice map + earned-ness map):**

Unlike simple supersession fields (where the entire value is replaced), the voice map and moment earned-ness map support GRANULAR updates. The Profile Manager handles these through two principles:

- **Structural integrity on mutation**: When a paragraph is edited and re-analyzed, voice map entries and earned-ness arrows pointing to that paragraph are flagged for the next synthesis pass to confirm or update. They are not deleted (the edit might not have changed the relevant aspects).

- **Granular updates without full replacement**: Add a new voice shift entry, update an existing entry's intentionality assessment, remove an entry no longer supported by the text. Add a new earning mechanism arrow, update a moment's gaps field, remove a moment whose text was deleted. After each update, the manager validates that internal references remain consistent (no arrows pointing to deleted paragraphs, no shift entries referencing removed passages).

**Staleness depth limits [per review S1]:**

In well-connected essays, changing one sentence can cascade staleness through many connections. Without limits, 10 edits can flag the majority of the profile as stale — defeating the purpose of focused re-analysis. The staleness propagation follows depth limits:

| Staleness Depth | Strength | Re-analysis trigger? | Example |
|----------------|----------|---------------------|---------|
| **Direct** (the changed sentence itself) | Strong | Yes — immediate update warranted | Student rewrites P4S3 -> P4S3's understanding and analysis are stale |
| **1-hop** (sentences directly connected to the changed sentence) | Moderate | Included in targeted refresh | P4S3 connects to P1S1 -> P1S1's understanding is moderately stale |
| **2-hop** (sentences connected to 1-hop sentences) | Weak | Informational only — not a trigger | P1S1 connects to P5S4 -> P5S4 is weakly stale (low priority) |

Re-analysis suggestions trigger on strong-staleness count, not total staleness. This prevents the students who benefit most from the system (strong, well-connected essays making craft-level revisions) from hitting degradation fastest.

**Non-repetition invariant**: Each layer adds NEW understanding. If L1 said "this sentence grounds the reader," L3 doesn't repeat that — it says "this grounding sentence establishes the physical space that becomes the essay's central metaphor, connecting to the closing image in P5S3." Each layer references and builds on prior layers, never duplicates. Understanding and Analysis are separate concerns that CANNOT repeat each other because they answer different questions (WHAT vs HOW WELL). The voice map and earned-ness map add entirely new dimensions of understanding (spatial voice tracking, backward-tracing mechanism networks) that don't overlap with any existing holistic section.
