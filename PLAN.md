# Essay Intelligence System — Implementation Plan

> This is the authoritative plan for Uplift's essay analysis engine.
> Replaces the old `docs/ANNOTATION_PIPELINE_MASTER_PLAN.md` (deleted).

---

## Vision

Build the deepest possible understanding of every college application essay — down to every word and sentence. A **multi-resolution semantic map** that understands not just WHAT the essay says, but WHY every sentence exists, what it's trying to achieve, how it serves the narrative, and how each word choice contributes to the whole.

Understanding compounds through an 8-layer bottom-up accumulation architecture. Every paragraph gets its own dedicated Sonnet analysis. The system builds a living **EssayProfile** — a complete map of the essay at every granularity level (essay → paragraph → sentence → word/phrase) that only grows deeper, never repeats, and is structured for RAG partial retrieval.

**Budget**: Up to $2 per essay for full deep understanding. Quality first, cost second.

**Core insight**: The profile separates three layers that must never be confused. **Understanding** (descriptive: what the essay IS, what each sentence does, how things connect) and **Analysis** (evaluative: how well it works, what's strong/weak) are persistent and deepen with every layer. **Feedback** (prescriptive: what to do about it) is ephemeral — generated fresh per context (annotations, coaching) from Understanding + Analysis, never stored. Like a literary scholar's close reading: you build understanding paragraph by paragraph, evaluate as understanding deepens, and give feedback only when asked and only from a position of complete comprehension.

**No heuristics, no deterministic shortcuts for judgment**: Every quality judgment comes from an LLM call. Heuristics are unreliable, lack nuance, and do more harm than good. Basic text parsing (splitting paragraphs, counting words) is fine — but all EVALUATION goes through Haiku or Sonnet.

---

## Architecture: 8-Layer Bottom-Up Accumulation

```
Layer 1: FIRST IMPRESSIONS (Haiku, parallel per-paragraph, ~$0.01-0.02)
   Per-paragraph + per-sentence Haiku: voice register, emotional tone,
   apparent intent, craft observations, sentence purposes, notable word choices
   -> Seeds the EssayProfile Understanding layer at every granularity
                    |
Layer 2: STRUCTURAL CARTOGRAPHY (Sonnet, ~$0.02-0.03)
   Bird's-eye structural map: paragraph roles, arc, transitions, theme
   Reads L1 profile, deepens structural understanding
   -> Profile gains structural layer
                    |
Layer 2.5: CONNECTION SCOUT (Haiku, ~$0.005, parallel with L2)
   Sees ALL paragraphs simultaneously — detects cross-paragraph surface connections
   Repeated words/phrases, tonal shifts, structural echoes
   -> Gives L3 forward-looking connection leads it can't discover sequentially
                    |
Layer 3: UNDERSTANDING WALK (Sonnet x N paragraphs, ~$0.20-0.40) THE CORE
   UNDERSTANDING ONLY — no evaluation, no judgment, just deep comprehension.
   P1 -> P2 (with P1's understanding) -> P3 (with P1+P2) -> ... -> PN
   Each call: sentence-level deep mapping + word/phrase significance
            + connections + BIDIRECTIONAL back-propagation
   Profile compounds: thesis crystallizes, voice sharpens, connections multiply,
   sentence purposes clarify, word choices gain context
   All cognitive resources on WHAT IS, freed from "is this good?"
   -> Understanding layer reaches "deep" confidence level
                    |
Layer 3.75: HOLISTIC SYNTHESIS (Sonnet x 1, ~$0.02-0.04)
   Reads complete sentence-level understanding, synthesizes ALL holistic sections:
   voice identity, emotional topography, thematic architecture, narrative strategy,
   character revelation, craft assessment, admissions positioning
   -> Holistic profile fully populated (not just the 4 incremental fields from walk)
                    |
Layer 3.5: ANALYSIS PASS (Sonnet x N paragraphs parallel, ~$0.08-0.15)
   EVALUATION with COMPLETE understanding. All paragraphs analyzed in PARALLEL
   because understanding is already complete — no sequential dependency.
   Each call receives: full understanding profile + essay text + target paragraph
   Key advantage: P1's analysis sees the COMPLETE picture including P5's payoff.
   Cannot misjudge P1's opening as "mediocre" when it sets up P5's callback.
   -> Analysis layer populated for every sentence and paragraph
                    |
Layer 4 + 5: CRYSTALLIZATION + PHASE-AWARE FEEDBACK (parallel, Sonnet x 2, ~$0.04-0.08)
   L4: North Star (architecture of meaning — 5 dimensions) + ParagraphScoreMatrix
       Full profile preserved separately for RAG
   L5: PHASE-AWARE FEEDBACK — ImprovementPhase determines zoom level:
       Foundation→essay-level, Architecture→paragraph-level,
       Craft→sentence-level, Polish→word-level, Distinction→memorability
                    |
Layer 6: CONVERSATION-DRIVEN DEEPENING (ongoing, ~$0.01-0.02/turn)
   Smart context routing via Profile Index: loads only relevant profile slices
   Phase-aware coaching: responds at current improvement phase zoom level
   Student responses deepen Understanding (intent confirmed) and Analysis (re-evaluated)
   Feedback generated FRESH every turn from current Understanding + Analysis
   -> Profile reaches "comprehensive" confidence level
                    |
RE-ANALYSIS: ADAPTIVE MODE SELECTION
   Comprehensive mode: structural edits, major rewrites, early stages (~$0.15-0.50)
   Focused mode: surgical edits against deep profile (~$0.02-0.10)
   Escalation ladder: word → paragraph → section → comprehensive
   System gets FASTER, CHEAPER, MORE PRECISE with each round
```

**Total first pass**: ~$0.52-1.00 | **Re-analysis (comprehensive)**: ~$0.15-0.35 | **Re-analysis (focused)**: ~$0.02-0.10 | **Per conversation turn**: ~$0.01-0.02

**Why three separate API layers (Understanding → Analysis → Feedback) produce better results:**

| Concern | Combined call | Separate layers |
|---------|--------------|-----------------|
| **Cognitive focus** | LLM splits attention between "what IS this?" and "is this GOOD?" — both suffer | Each call focuses 100% on one question — deeper on each |
| **Context for evaluation** | P1 is evaluated with only P1-P3 context (P4-P5 not yet seen) | P1 is evaluated with COMPLETE essay understanding — sees P5's payoff |
| **Output quality** | Evaluation bleeds into description ("this effectively grounds...") — layers contaminate | Clean separation: understanding describes, analysis evaluates, feedback prescribes |
| **Back-propagation** | Back-props must update both understanding AND analysis simultaneously | Understanding walk only back-props understanding. Analysis pass sees the final understanding. |
| **Parallelization** | Sequential (P1→P2→...→PN) — each depends on the prior | Understanding: sequential. Analysis: ALL PARALLEL (no inter-paragraph dependency). Feedback: parallel. |
| **Cost** | ~$0.20-0.40 for combined | ~$0.28-0.55 for separated (~40% more, but each layer is higher quality) |

---

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

---

## Anti-Repetition Architecture

Repetition is the #1 threat to this system. A bloated profile wastes tokens, inflates costs, confuses the AI, and degrades output quality. This section defines the rules that prevent it at every level.

### The Three Repetition Problems

| Problem | Example | Without prevention |
|---------|---------|-------------------|
| **Profile bloat** | L1 says "sensory detail", L3-P1 says "grounds reader", L3-P3 backprop says "central metaphor", L3-P5 backprop says "organizing symbol" — all about P1S1 | 4 entries describing the same sentence at increasing depth. 3 are stale. |
| **Connection duplication** | P1S1 stores `echoesOrCallbacks → P3S4` and P3S4 stores `referencedBy ← P1S1` | Same connection described twice. Load both = redundant. |
| **Granularity overlap** | `craftAssessment.imageSystem: "diamond metaphor"` + `thematicArchitecture.threads[0]: "imperfection, introduced at P1S1"` + `P1S1.narrativeContribution: "establishes central metaphor"` | Three entries saying the same thing at different zoom levels. |

### Solution 1: Supersession Model (Profile Bloat)

**The profile stores CURRENT understanding, not the history of understanding.**

Every updatable field in the profile follows one of two patterns:

**Supersession fields** (entire value REPLACED — latest understanding wins):
- Understanding: `observedFunctions`, `inferredIntents`, `narrativeContributions` (entire `ObservationEntry[]` array replaced)
- Understanding: `paragraphContribution`, `rhythmContribution`, `voiceAlignment` (single strings replaced)
- Analysis: `effectiveness`, `effectivenessReasoning`, `strengths`, `weaknesses` (entire arrays/values replaced)
- Holistic: `centralThesis`, `voiceSignature`, `aoTakeaway`
- Any field that describes "what something IS" or "how well it works"

**Collection fields** (grow over time — new entries ADDED, duplicates prevented):
- `tags[]`, `connectionRefs[]`, `techniques[]`, `strengthsFound[]`, `weaknessesFound[]`
- `voiceDrifts[]`, `pivotPoints[]`, `threads[]`
- Any field that tracks discrete additive items

**The rule**: Back-propagation on P1S1 **REPLACES** the entire `observedFunctions` array, not appends to it. Later paragraphs have more context = deeper understanding = the new array IS the better one. Multi-observation doesn't mean additive over time — it means CONCURRENT observations at any one point in time.

**Concrete example — P1S1's `observedFunctions` through the walk:**

```
After L1:       [{observation: "Describes the diamond being slid across the pawnshop counter",
                  confidence: 0.7}]

After L3-P1:    REPLACED → [
                  {observation: "Grounds reader in a specific moment of risk through physical action",
                   confidence: 0.85, evidence: "slid... across the counter"},
                  {observation: "Establishes the pawnshop as the essay's opening world",
                   confidence: 0.8, evidence: "fluorescent lights, magnifying lamp"}
                ]

After L3-P3:    REPLACED → [
                  {observation: "Grounds reader in physical action that becomes the essay's central metaphor",
                   confidence: 0.9, evidence: "sliding = letting go, counter = threshold"},
                  {observation: "Introduces the cloudy diamond as imperfection-with-value",
                   confidence: 0.9, evidence: "cloudy diamond + grandfather's choice"}
                ]

After L3-P5:    REPLACED → [
                  {observation: "Opens the essay's metaphor arc — the physical act of sliding the ring
                   becomes the organizing image for the writer's relationship to imperfection",
                   confidence: 0.95, evidence: "P5S4 closes with same diamond, same light, transformed meaning"},
                  {observation: "Establishes the transactional frame (pawnshop = trading value for money)
                   that the essay ultimately rejects",
                   confidence: 0.85, evidence: "could have taken the forty dollars — took the ring back"}
                ]
// NOTE: These are CONCURRENT observations at one point in time, NOT a history.
// The entire array is replaced on each back-propagation update (supersession).
```

At any point, the profile has the current ARRAY of observations — each a distinct thing the sentence does, not a history of evolving understanding. The entire array is replaced on each update. No bloat.

**What about the evolution narrative?** Separate dedicated fields handle that:
- `thematicArchitecture.thesisEvolution` — how the thesis emerges across paragraphs
- `voiceIdentity.evolution` — how voice changes through the essay
- `emotionalTopography.emotionalProgression` — how emotion shifts

These are ABOUT evolution (additive, each paragraph adds a data point). They're fundamentally different from summary fields that describe a current state.

**Profile Manager implementation (layer-aware, separate passes):**

```typescript
// ── AFTER L3 UNDERSTANDING WALK (per paragraph) ──
function applyUnderstandingUpdate(profile: EssayProfile, update: PriorSentenceUpdate): void {
  const sentence = profile.paragraphs[update.paragraph].sentences[update.sentence];

  // UNDERSTANDING LAYER ONLY — supersession (entire array/value replaced)
  if (update.observedFunctions) {
    sentence.understanding.observedFunctions = update.observedFunctions;  // REPLACE entire array
  }
  if (update.inferredIntents) {
    sentence.understanding.inferredIntents = update.inferredIntents;      // REPLACE entire array
  }
  if (update.narrativeContributions) {
    sentence.understanding.narrativeContributions = update.narrativeContributions;  // REPLACE
  }

  // COLLECTION FIELDS — additive (deduplicated)
  if (update.newTags) {
    for (const tag of update.newTags) {
      if (!sentence.understanding.tags.includes(tag)) {
        sentence.understanding.tags.push(tag);
      }
    }
  }

  // NO analysis updates here — that's a separate pass (L3.5)
  // NO feedback — never stored
}

// ── AFTER L3.5 ANALYSIS PASS (per paragraph) ──
function applyAnalysisPassResult(profile: EssayProfile, result: AnalysisPassOutput): void {
  const paragraph = profile.paragraphs[result.paragraphIndex];

  // Store paragraph-level analysis
  paragraph.analysis = {
    effectiveness: result.paragraphEffectiveness,
    verdict: result.paragraphVerdict,
  };

  // Store sentence-level analysis
  for (const sa of result.sentenceAnalyses) {
    paragraph.sentences[sa.sentenceIndex].analysis = {
      effectiveness: sa.effectiveness,
      effectivenessReasoning: sa.effectivenessReasoning,
      strengths: sa.strengths,
      weaknesses: sa.weaknesses,
      isStrength: sa.isStrength,
      isProblem: sa.isProblem,
      priorityForImprovement: sa.priorityForImprovement,
    };
  }

  // Update holistic analysis
  if (result.holisticAnalysisEvolution.strengthSignatures) {
    profile.craftAssessment.strengthSignatures = result.holisticAnalysisEvolution.strengthSignatures;
  }

  // Recompute Profile Index flags (hasStrengths, hasWeaknesses, improvementPriority)
  recomputeIndexAnalysisFlags(profile.index, paragraph);
}
```

### Solution 2: Single Source of Truth (Connection Duplication)

Each type of cross-cutting information has ONE canonical home. Sentences carry only lightweight references — IDs and tags — not embedded copies.

**Canonical locations:**

| Information | Stored In (ONE place) | Sentences Carry |
|-------------|----------------------|-----------------|
| Cross-paragraph connections | `connections.all[]` with unique IDs | `understanding.connectionRefs: ["conn_001"]` |
| Thematic threads | `thematicArchitecture.threads[]` | `understanding.tags: ["theme:imperfection"]` |
| Image recurrences | `connections.imageRecurrences[]` | `understanding.tags: ["image:diamond"]` |
| Voice drifts | `voiceIdentity.voiceDrifts[]` | `understanding.tags: ["voice:shift"]` |
| Strengths | `strengthsFound[]` | `analysis.isStrength: true` (flag only) |
| Weaknesses | `weaknessesFound[]` | `analysis.isProblem: true` (flag only) |
| Feedback/suggestions | NOWHERE — ephemeral | Generated fresh in L5 annotations / L6 coaching |

**Connection storage — WRONG vs RIGHT:**

```typescript
// WRONG: Connection embedded on BOTH endpoints
p1s1.echoesOrCallbacks = [{
  targetParagraph: 2, targetSentence: 3,
  connectionType: "metaphor_escalation",
  description: "P3S4 escalates the diamond metaphor..."  // FULL DESCRIPTION
}];
p3s4.referencedBy = [{
  sourceParagraph: 0, sourceSentence: 0,
  connectionType: "metaphor_escalation",
  description: "Escalates the diamond metaphor from P1S1..."  // SAME INFO, REPHRASED
}];
// Result: Same connection described twice. Load both = waste.

// RIGHT: Connection stored ONCE centrally, referenced by ID
profile.connections.all = [{
  id: "conn_001",
  from: [0, 0],   // P1S1
  to: [2, 3],     // P3S4
  type: "metaphor_escalation",
  description: "P3S4 escalates the diamond metaphor introduced in P1S1"
}];
p1s1.connectionRefs = ["conn_001"];  // Lightweight reference
p3s4.connectionRefs = ["conn_001"];  // Same reference
// Result: ONE description. Profile Router resolves when needed.
```

**This eliminates the `echoesOrCallbacks` and `referencedBy` arrays on sentences entirely.** Sentences just have `connectionRefs: string[]` — an array of connection IDs. The Profile Router resolves these when building context for a prompt.

Similarly, sentences don't embed thematic thread descriptions. They just carry `tags: ["theme:imperfection"]`. The full thread description lives in `thematicArchitecture.threads[]`.

### Solution 3: Hierarchical Context Assembly (Granularity Overlap)

The holistic sections (voice, themes, craft, etc.) are SUMMARIES of the specific sentence/paragraph observations. They exist at a different zoom level. When the Profile Router assembles context for a prompt, it picks the RIGHT zoom level for the task — never both.

**The rule: Holistic sections provide breadth. Specific sections provide depth. Load one or the other for any given topic, not both.**

| Task | Load for "diamond metaphor" topic | Skip |
|------|-----------------------------------|------|
| "Help me with P1S1" | P1S1's full profile + resolved connections | `craftAssessment.imageSystem` (says the same thing, less specific) |
| "Tell me about my essay's themes" | `thematicArchitecture` (breadth) | Individual sentence `narrativeContribution` fields (too granular) |
| "How does my essay hold together?" | `connections.all[]` + `narrativeStrategy` | Individual sentence profiles |
| "Overview of my essay" | All holistic sections | Sentence-level details |

**The Profile Router enforces this automatically:**

```typescript
function assembleContext(profile: EssayProfile, task: RouterTask): string {
  const sections: string[] = [];

  // Always: Profile Index (compact overview)
  sections.push(renderIndex(profile.index));

  // For specific sentence/paragraph tasks:
  if (task.specificity === 'sentence' || task.specificity === 'paragraph') {
    // Load the specific target at FULL detail
    sections.push(renderParagraphFull(profile.paragraphs[task.paragraph]));
    // Resolve and include relevant connections
    sections.push(renderConnections(profile.connections, task.paragraph));
    // For OTHER paragraphs: digest only (from index)
    // DO NOT also load holistic sections that summarize the same info
  }

  // For holistic tasks:
  if (task.specificity === 'essay') {
    // Load holistic sections (breadth)
    sections.push(renderHolisticSections(profile));
    // For paragraphs: digests only (from index)
    // DO NOT also load individual sentence profiles
  }

  return sections.join('\n\n');
}
```

**What if a task needs BOTH breadth and depth?** Example: "How does P1S1 fit into the overall theme?" The router loads:
1. P1S1's full sentence profile (depth for the target)
2. `thematicArchitecture` (breadth for themes) — BUT with a note: "The thematic architecture below summarizes themes across the essay. P1S1's specific contribution is in its profile above."
3. Connections involving P1S1 (specific cross-references)

The prompt explicitly tells the LLM that specific profiles are the DETAILED versions of holistic summaries. Don't treat them as separate facts.

### Solution 4: Multi-Layer Defense (Separate Calls + Angle-Specific Observations + Prompt Guidance)

Anti-repetition must NEVER come at the cost of depth. The system should capture EVERYTHING it sees — the defense is in HOW observations are organized, not in limiting WHAT gets captured.

**Defense Layer A: Separate API Calls (Primary — Structural)**

The most powerful anti-repetition mechanism: **Understanding, Analysis, and Feedback are separate API calls.** Each call focuses 100% on ONE question, making cross-contamination structurally impossible.

- **L3 Understanding Walk**: Sonnet focuses entirely on "What IS this sentence doing? How does it connect? What is the writer trying to achieve?" No evaluation, no judgment. All cognitive resources on comprehension.
- **L3.5 Analysis Pass**: With COMPLETE understanding as input, Sonnet focuses entirely on "How WELL is this working? What's strong? What's weak?" No need to also figure out WHAT things are — that's already done.
- **L5 Feedback**: With complete Understanding + Analysis as input, Sonnet focuses entirely on "What should the student DO?" Generated fresh per context, never stored.

**Why this is the strongest defense**: The LLM literally CANNOT mix "what is" with "how well" because they're different API calls with different prompts and different output schemas. No amount of prompt engineering in a single call achieves the same separation that separate calls enforce.

**Defense Layer B: Novelty-Driven Growth with Quality Controls**

The system grows through **novelty**, not depth-chasing. Each L3 call asks: "What does THIS paragraph reveal that wasn't already understood?" — a concrete comparison between what the LLM already knows (loaded profile) and what it now sees (new paragraph). This is fundamentally more reliable than asking the LLM to score abstract "depth" or inspect content volume.

**Three quality controls prevent the profile from growing in wrong directions:**

**B1. Evidence-Grounded Prompting (cognitive forcing function)**

Every `ObservationEntry` must include an `evidence` field citing specific text. This forces the LLM to reason FROM the essay, not hallucinate connections. We do NOT build programmatic substring validation — it's brittle (paraphrased citations fail) and the cost-benefit is poor. The evidence field's value is in making the LLM THINK with evidence, not in our ability to verify it programmatically.

```
Every observation must cite specific text from the essay.
Wrong: {observation: "Establishes the central metaphor", evidence: ""}
Right: {observation: "Establishes the cloudy diamond as imperfection-with-value",
        evidence: "cloudy diamond + 'She won't love me for the diamond'"}
```

**B2. Utility-Filtered Prompting (relevance gate)**

The profile should only contain observations that would change how you **understand or teach** this essay. This filters noise without suppressing depth:

```
Only output observations that would change how you understand or teach this essay.
- "P1S1 has 12 words" — wouldn't change understanding or teaching. Skip.
- "P1S1 establishes a metaphor that pays off in P5" — changes how you
  understand P1 and how you'd teach revision. Include.
- "P2S3 uses alliteration" — only include if the alliteration does meaningful
  craft work, not if it's incidental.
- "P2S3's rhythm mirrors P1S1" — changes understanding of craft sophistication.
  Include even if not directly actionable.
```

**B3. Supersession Self-Correction (trust later context)**

Later paragraphs have MORE context and are MORE reliable. When P5 back-propagates a new understanding of P1S1, it supersedes (replaces) the earlier reading. This is almost always correct — P5 has read the entire essay, P1's original walk only saw P1.

No confidence-gated back-propagation, no tentative storage. LLM confidence scores are poorly calibrated — building infrastructure on them creates complexity without reliability. For short essays (~5 paragraphs), the window for compounding errors is small, and correct later readings naturally fix earlier mistakes.

**B4. L4 Coherence Check (natural quality gate)**

When L4 crystallization synthesizes the North Star from the complete profile, contradictions surface naturally. If the profile says "the thesis is self-worth" in one place and "imperfection-with-value" in another, the crystallizer can't produce a coherent North Star. Flag contradictions for review. No extra infrastructure needed — crystallization REQUIRES coherence, so it's a free quality gate.

**The novelty-driven prompt framing:**

```
Here is what we understand so far about this essay. Now read paragraph 3.

Your job: What does P3 reveal that we didn't already know?
- New understanding about P3's own sentences (always)
- Changed understanding about PRIOR sentences (back-propagation — only if
  P3 genuinely changes what we understood about them)
- New connections between P3 and prior paragraphs
- Evolution of holistic understanding (thesis, voice, themes — only what shifted)

If P3 confirms what's already understood, don't restate it.
If P3 deepens or changes it, output the new understanding.

Every observation must cite evidence from the text.
Only output observations that would change how you understand or teach
this essay. If it's technically true but wouldn't affect teaching, skip it.
```

**Why novelty-driven is more reliable than depth-inspection:**

| Depth-inspection (old) | Novelty-driven (current) |
|------------------------|--------------------------|
| "Is the existing understanding deep enough?" — abstract, subjective | "What's new given what you already know?" — concrete comparison |
| LLM must judge depth from content volume (verbose ≠ deep, compact ≠ shallow) | LLM compares two states — what it knew vs what it now sees |
| Risk: misjudges depth → over-fills or under-fills | Risk: minimal — comparison is a natural LLM strength |
| P1 walk produces same volume as P5 walk | P1 walk: everything is new → rich output. P5 walk: mostly established → focused output. Natural growth curve. |

**Defense Layer C: Prompt Rules (reinforces structural + novelty defenses)**

```
UNDERSTANDING WALK RULES:
1. Your ONLY job is to understand WHAT IS. Do not evaluate quality.
   Wrong: "This sentence effectively grounds the reader" (evaluation leaked)
   Right: "This sentence grounds the reader in the pawnshop through physical action"

2. NOVELTY ONLY. The profile context shows what's already understood.
   - If P3 confirms what's already known about P1S1, don't restate it.
   - If P3 changes or deepens what's known about P1S1, output the new
     understanding via priorSentenceUpdates (supersession).
   - Ask yourself: "Would someone reading the existing profile ALREADY
     know this?" If yes, skip it.

3. EVIDENCE REQUIRED. Every observation must cite specific text.
   Back-propagations must cite evidence from BOTH the current paragraph
   (what triggered the update) AND the target sentence (what's being
   reinterpreted).

4. UTILITY FILTER. Only output observations that would change how you
   understand or teach this essay. Technically-true-but-useless observations
   are noise. A simple transition sentence might have 1 observedFunction.
   A thematic pivot might have 4. Proportional to genuine significance.

5. Connections go in newConnections[]. Tag both endpoints. If the connection
   is already in the profile from a prior walk step, don't re-discover it.

6. Prioritize DEPTH over BREADTH. If this paragraph is clearly a voice shift,
   go deep on voice understanding. Don't spread thin across all dimensions
   just to fill fields.

ANALYSIS PASS RULES:
1. Your ONLY job is to evaluate HOW WELL. The understanding profile tells you
   WHAT each sentence does. You evaluate how effectively it does it.

2. Reference understanding observations, don't redescribe.
   Wrong: "The sentence grounds the reader in physical action, which is effective"
   Right: "The grounding function (see observedFunctions[0]) lands effectively
          because the physical detail creates immediate sensory engagement"

3. Multiple strengths/weaknesses per sentence ARE FINE when genuine. A sentence
   can have a strong metaphor AND a weak rhythm. But don't manufacture weaknesses
   for the sake of balance — if a sentence just works, say so.

4. EVIDENCE REQUIRED for strengths and weaknesses too. Don't just say
   "the metaphor is effective" — cite the specific text and explain WHY.
```

**How the LLM knows what's already been said:**

The LLM receives selectively-loaded profile context via the Profile Router. The novelty-driven framing means it:
1. Sees the CURRENT state of understanding (what's been established)
2. Compares against what THIS paragraph reveals (what's genuinely new)
3. Outputs only the DELTA — new understanding, changed understanding, new connections

**The Profile Manager's job is layer-specific storage:**

After L3 Understanding Walk (per paragraph):
1. Store `paragraphProfile.understanding` as the paragraph's understanding entry
2. Apply `priorSentenceUpdates` — understanding field replacements (supersession)
3. Add `newConnections` to `connections.all[]`, add ref IDs to endpoint sentences
4. Merge `holisticEvolution` — understanding-level holistic changes
5. Recompute Profile Index

After L3.5 Analysis Pass (per paragraph):
1. Store `paragraphAnalysis` — effectiveness, strengths, weaknesses for each sentence
2. Update holistic analysis sections (craftAssessment, strengthsFound, weaknessesFound)
3. No back-propagation needed — analysis sees the complete understanding already

### Three-Layer Sentence Profile: Understanding / Analysis / Feedback

Every sentence in the profile separates three fundamentally different types of information. This prevents the most common form of cross-contamination: mixing "what IS" with "how WELL" with "what to DO."

| Layer | Question it answers | Update cadence | Stored? |
|-------|-------------------|---------------|---------|
| **Understanding** | What IS this sentence doing? How does it fit? | Deepens every layer (L1→L3→L6) — supersession model | YES — persistent, grows deeper |
| **Analysis** | How WELL is it working? What's strong/weak? | Crystallizes during L3, refined by L6 | YES — persistent, refined over time |
| **Feedback** | What should the student DO about it? | Generated FRESH per context (L5 annotations, L6 coaching) | NO — ephemeral, context-dependent |

**Why Feedback is ephemeral**: The right suggestion depends on WHEN and WHY it's being given. In annotations, feedback is inline and concise. In coaching, it's conversational and depends on what the student asked. In overview mode, it's high-level prioritization. Storing feedback would create stale suggestions that conflict with contextually-appropriate fresh feedback — the worst kind of repetition.

**Multi-observation fields**: Where a sentence genuinely does MULTIPLE things, the profile captures ALL of them as separate entries. But this is ORGANIC, not mechanical — a simple transition sentence might have 1 observedFunction while a thematic pivot has 4. The LLM sees the actual profile content and can judge where understanding is thin, prioritizing deepening THAT rather than uniformly filling every field. Supersession replaces the ENTIRE array on update.

### Updated SentenceDeepAnalysis (Three Layers + Multi-Observation)

```typescript
interface SentenceDeepAnalysis {
  index: number;
  text: string;

  // ═══════════════════════════════════════════════════════════════
  // LAYER 1: UNDERSTANDING (descriptive — what the essay IS)
  // Deepened every layer. Supersession: entire sub-object replaced.
  // ═══════════════════════════════════════════════════════════════
  understanding: {
    // PURPOSE & INTENT (3-way distinction)
    /** What this sentence IS doing — can be MULTIPLE things */
    observedFunctions: ObservationEntry[];
    // e.g., [
    //   { observation: "Grounds the reader in the pawnshop scene", confidence: 0.9, evidence: "concrete sensory detail" },
    //   { observation: "Introduces the diamond as the essay's central symbol", confidence: 0.8, evidence: "ring + cloudy diamond" }
    // ]

    /** What the writer is TRYING to achieve */
    inferredIntents: ObservationEntry[];
    // e.g., [
    //   { observation: "Creating physical stakes before emotional ones", confidence: 0.85, evidence: "action precedes reflection" }
    // ]

    /** Rhetorical function(s) in the paragraph */
    rhetoricalFunctions: string[];  // ["scene-setting", "symbol-introduction"] — can be multiple

    /** How it serves the essay's larger narrative */
    narrativeContributions: ObservationEntry[];
    // Multiple: a sentence can advance the arc AND carry a thematic thread AND set up a callback

    /** How it serves THIS paragraph's goal */
    paragraphContribution: string;  // Usually one primary contribution — single string OK

    // CRAFT OBSERVATIONS (descriptive, not evaluative)
    rhythmContribution: string;     // How this sentence's rhythm serves the passage
    voiceAlignment: string;         // Consistent with essay voice, or drift?
    techniques: string[];           // COLLECTION — "concrete detail", "metaphor", etc.

    // WORD/PHRASE SIGNIFICANCE (COLLECTION — grows, deduplicated by wordOrPhrase)
    significantChoices: Array<{
      wordOrPhrase: string;         // Dedup key — only ONE entry per word/phrase
      significance: string;         // REPLACED if the same word is re-evaluated
      // NOTE: No isStrength/alternative — those are evaluative judgments (analysis layer).
      // Understanding describes WHAT the choice does. Analysis judges WHETHER it works.
    }>;

    // CONNECTIONS (reference-based — no embedded descriptions)
    connectionRefs: string[];       // IDs into profile.connections.all[]

    // TAGS (for Profile Index routing — lightweight, deduplicated)
    tags: string[];                 // ["metaphor:diamond", "theme:imperfection", "voice:shift"]
  };

  // ═══════════════════════════════════════════════════════════════
  // LAYER 2: ANALYSIS (evaluative — how well it's working)
  // Crystallizes during L3, refined by L6 conversation.
  // ═══════════════════════════════════════════════════════════════
  analysis: {
    /** Overall effectiveness at achieving its purpose(s) */
    effectiveness: number;          // 0-100
    effectivenessReasoning: string; // WHY this score — reasoning, not just a number

    /** What's working — can be MULTIPLE strengths */
    strengths: ObservationEntry[];
    // e.g., [
    //   { observation: "The physical action creates immediate stakes", confidence: 0.9, evidence: "slid... across the counter" },
    //   { observation: "Specific detail (14 karat, cloudy) grounds abstract theme", confidence: 0.85, evidence: "Mr. Chen's practiced fingers" }
    // ]

    /** What could be stronger — can be MULTIPLE weaknesses */
    weaknesses: ObservationEntry[];

    /** Flags */
    isStrength: boolean;            // This sentence is a standout strength
    isProblem: boolean;             // This sentence has significant issues
    priorityForImprovement: number; // 0 (fine) to 5 (urgent)
  };

  // ═══════════════════════════════════════════════════════════════
  // LAYER 3: FEEDBACK (prescriptive — what to do about it)
  // NOT STORED in the profile. Generated fresh per context.
  // Appears in L5 annotation output and L6 coaching turns.
  // ═══════════════════════════════════════════════════════════════
  // feedback: {
  //   prescriptiveRole: string;    // What it SHOULD be doing for max impact
  //   suggestions: string[];       // Concrete improvements
  //   rewriteExample: string;      // Example rewrite if needed
  // }
  // ^^^ This lives in AnnotationOutput / CoachingOutput, NOT in the profile.
  // Generated from understanding + analysis + current teaching context.
}

/** A single observation with confidence and evidence — supports multi-observation fields */
interface ObservationEntry {
  observation: string;
  confidence: number;              // 0-1: how certain is this reading?
  evidence: string;                // What in the text supports this?
}
```

**Why this prevents cross-layer repetition:**

Without separation, a single `whatWorks: string` might say "The concrete detail grounds the reader, which effectively establishes the scene and should be preserved." That mixes understanding (what it does), analysis (how well), and feedback (preserve it) in one field. Three layers force clean boundaries:
- Understanding: "Grounds the reader through concrete sensory detail" (WHAT)
- Analysis: `effectiveness: 82, strengths: [{observation: "Concrete detail creates immediacy"}]` (HOW WELL)
- Feedback (generated live): "This is one of your strongest opening moves — the physical detail does important work. Keep it." (WHAT TO DO)

No repetition possible because each layer answers a fundamentally different question.

### Updated EssayProfile Connections (centralized, no duplication)

```typescript
interface ProfileConnections {
  /** ALL cross-sentence/paragraph connections — the SINGLE canonical store */
  all: Array<{
    id: string;                   // Unique ID: "conn_001", "conn_002", etc.
    from: [number, number];       // [paragraph, sentence]
    to: [number, number];         // [paragraph, sentence]
    type: string;                 // "callback", "echo", "contrast", "setup→payoff", "escalation"
    description: string;          // ONE description of this connection
    discoveredAt: number;         // Which paragraph's analysis discovered this
  }>;

  /** Thematic thread map — threads stored in thematicArchitecture, this is just
      the sentence-level index. Sentences carry tags, not thread descriptions. */
  // REMOVED — lives in thematicArchitecture.threads[].appearances already

  /** Image/metaphor recurrences */
  imageRecurrences: Array<{
    image: string;
    appearances: Array<[number, number]>;  // [paragraph, sentence] pairs
  }>;

  /** Narrative arc map — which sentences play which arc role */
  narrativeArcMap: Array<{
    sentence: [number, number];
    arcRole: string;              // "inciting_incident", "rising_action", "climax", "resolution"
  }>;

  /** Redundancies — content that overlaps across paragraphs */
  redundancies: Array<{
    paragraphs: number[];
    overlappingContent: string;
  }>;
}
```

### Anti-Repetition Summary

| Layer | What it produces | How repetition is prevented |
|-------|------------------|---------------------------|
| L1 (Haiku) | First impressions — seeds all summary fields | These are the INITIAL values. Everything that follows REPLACES them. |
| L2 (Sonnet) | Structural map | Paragraph roles REPLACE L1's `apparentPurpose`. No duplication. |
| L3-PN (Sonnet) | `UnderstandingWalkOutput` — Understanding ONLY | Understanding only (observedFunctions, inferredIntents, connections). NO evaluation, NO Feedback. Prior sentence updates are array replacements (supersession). Connections in `newConnections` only. |
| L3.75 (Sonnet x 1) | `HolisticSynthesisOutput` — Essay-level understanding | Synthesizes all 10 holistic section types from complete sentence understanding. Single call with full context. Populates voice map, earned-ness map, entanglements, and sections the walk can't (character, admissions, craft patterns). |
| L3.5 (Sonnet, parallel) | `AnalysisPassOutput` — Analysis ONLY | Evaluation with COMPLETE understanding (sentence + holistic). References understanding observations via labels, doesn't re-describe. All paragraphs analyzed in parallel (no sequential dependency). |
| L4 (Sonnet) | North Star | Architecture of meaning crystallized from Understanding + Analysis. 5 dimensions scaled by essay type. |
| L5 (Sonnet) | Annotation Feedback | Feedback (prescriptive layer) generated FRESH from Understanding + Analysis. Not stored in profile. Ephemeral and context-appropriate. |
| L6 (ongoing) | Coaching Feedback + profile deepening | Fresh Feedback generated per turn (not stored). Understanding's `inferredIntents` REPLACED with student-confirmed intent. Analysis refined. |
| Profile Router | Context assembly for ALL API calls | Loads holistic OR specific for each topic, never both. Connection refs resolved without duplication. Token budgets enforced. LLM sees CURRENT state, produces CURRENT understanding. |
| Profile Manager | Diff-based application (not dedup) | Stores Understanding + Analysis layers. Applies field replacements via supersession. Adds connections + ref IDs. Merges holistic changes. Recomputes index. No deduplication needed — structured output prevents it. |
| Three-Layer Separation | Understanding / Analysis / Feedback | Understanding (WHAT IS) and Analysis (HOW WELL) stored in profile. Feedback (WHAT TO DO) generated fresh per context in L5/L6. Cross-layer repetition structurally impossible — each answers a different question. |
| Novelty-Driven Growth | "What's NEW given what you already know?" | LLM compares prior profile state vs what this paragraph reveals. Outputs only the delta. Natural growth curve — early paragraphs produce rich output, later paragraphs produce focused output. |
| Evidence Grounding | Every observation must cite text | Forces LLM to reason FROM the essay. Prevents hallucinated connections and fabricated patterns. Cognitive forcing function, not programmatic validation. |
| Utility Filtering | "Would this change understanding or teaching?" | Filters noise (technically-true-but-useless observations) without suppressing depth. Observations proportional to genuine significance. |
| L4 Coherence Check | Crystallization surfaces contradictions | If the profile contradicts itself, North Star can't be coherently crystallized. Free quality gate — no extra infrastructure. |
| Prompt Rules | Novelty + evidence + utility enforcement | Reinforces structural defenses at prompt level. Secondary defense, not primary. Prompt tuning expected (test 3E). |
| Multi-Observation Fields | `ObservationEntry[]` arrays (organic) | Observations proportional to genuine complexity — simple sentences get 1, pivots get 4. Not mechanically filled. Supersession replaces the ENTIRE array. |
| Progressive Precision | ImprovementPhase in ProfileIndex | Feedback zooms from essay-level to word-level as the essay improves. Understanding + Analysis always comprehensive. Only FEEDBACK is phase-filtered. Phase re-computed after every re-analysis. |
| Analysis Modes | Comprehensive vs Focused | First pass + structural edits = comprehensive. Later sentence/word edits = focused (1-2 targeted calls against existing profile). Escalation ladder prevents missed ripples. Profile depth is LEVERAGED, not rebuilt. |

---

## Layer-by-Layer Specification

### Layer 1: First Impressions (Haiku, parallel)

**Replaces the old deterministic Layer 1.** All quality judgment moves to Haiku. Basic text parsing (paragraph splitting, word/sentence counting) remains as pre-processing.

**New file**: `src/services/essayIntelligence/analysis/firstImpressions.ts`

Single Haiku call per paragraph (all paragraphs in parallel). Each call receives:
- The full essay text (for context)
- The target paragraph text
- Basic metrics (word count, sentence count — factual, not judgmental)

Each call produces:
```typescript
interface ParagraphFirstImpression {
  paragraphIndex: number;

  // Paragraph-level
  apparentPurpose: string;        // What this paragraph seems to be doing
  emotionalRegister: string;      // "anxious", "determined", "reflective"
  voiceObservation: string;       // Initial voice/tone read
  craftNotices: string[];         // 2-3 things that stand out about the writing
  tags: string[];                 // Semantic labels for Profile Index

  // Sentence-level (every sentence mapped)
  sentences: Array<{
    index: number;
    text: string;
    apparentPurpose: string;      // First-impression purpose guess
    rhetoricalFunction: string;   // "scene-setting", "claim", "evidence", "reflection", "pivot"
    toneShift: boolean;           // Does tone change at this sentence?
    notableElements: string[];    // Words/phrases/techniques that stand out
    tags: string[];               // Per-sentence semantic labels
  }>;

  // Word/phrase level (DESCRIPTIVE ONLY — no strength/weakness judgment)
  notablePhrases: Array<{
    phrase: string;
    sentenceIndex: number;        // Which sentence contains this phrase
    significance: string;         // Why this phrase stands out (descriptive, not evaluative)
  }>;
  // NOTE: No weakSpots or isStrength fields. L1 is purely descriptive (understanding layer).
  // All quality judgment (what's strong, what's weak) is deferred to L3.5 Analysis Pass.
  // This matches the Understanding → Analysis separation: L1 NOTICES things, L3.5 JUDGES them.
}
```

**Cost**: ~$0.001-0.002 per paragraph x ~5 paragraphs = ~$0.005-0.01 total
**Why Haiku**: This is first-impression pattern recognition — Haiku excels at this. Sonnet's depth isn't needed yet; it'll do the deep work in Layer 3.

**After L1**: Profile Index is created with initial paragraph digests, topic tags, and sentence counts.

### Layer 2: Structural Cartography (Sonnet)

**File**: `src/services/essayIntelligence/analysis/structuralCartographer.ts` (exists, upgrade from Haiku to Sonnet)

Receives: Full essay text + Layer 1 first impressions + Profile Index
Produces: `StructuralCartography` (existing type — paragraph roles, arc, transitions, theme)

**Key change**: Uses Sonnet (was Haiku). The structural map is the reading guide for every Layer 3 call — a wrong theme or misclassified role propagates through the entire deep walk.

**After L2**: Profile Index updated with structural tags on each paragraph digest.

### Layer 2.5: Connection Scout (Haiku, parallel with L2)

**New file**: `src/services/essayIntelligence/analysis/scoutPass.ts`

Single Haiku call that does something L3 genuinely CANNOT do efficiently: **cross-paragraph surface-level connection detection across the entire essay at once.** L3 walks sequentially and can only see backward. The scout sees the entire essay simultaneously and can identify forward connections (P1 word echoed in P5) that L3 wouldn't discover until P5's walk.

**What it does**: Scans ALL paragraphs for repeated words/phrases, image recurrences, tonal shifts, and structural echoes. Produces a lightweight connection map that L3 can use as investigation leads — not conclusions. L3 Sonnet decides whether the scout's leads are real connections or coincidences.

**What it does NOT do**: Interpret meaning, judge quality, or pre-chew analysis. It's a pattern-matching pass, not a comprehension pass. "The word 'diamond' appears in P1, P3, and P5" — that's the scout's job. "The diamond is the essay's central metaphor" — that's L3's job.

```typescript
interface ConnectionScout {
  /** Repeated words/phrases across paragraphs — potential connection leads */
  repeatedElements: Array<{
    element: string;              // "diamond", "cloudy", "light"
    appearances: Array<{
      paragraph: number;
      sentence: number;
      context: string;            // Brief surrounding text
    }>;
  }>;

  /** Tonal shifts between paragraphs — potential structural signals */
  tonalShifts: Array<{
    fromParagraph: number;
    toParagraph: number;
    shift: string;                // "reflective → urgent", "narrative → analytical"
  }>;

  /** Structural echoes — paragraphs that mirror each other's form */
  structuralEchoes: Array<{
    paragraphs: number[];
    pattern: string;              // "both open with dialogue", "both use single-sentence closers"
  }>;
}
```

**Why this earns its place**: L3's sequential walk discovers P1→P3 connections when it reaches P3, but can't discover P1→P5 connections until P5. The scout gives L3 a heads-up: "the word 'diamond' reappears in P5" — so when L3 walks P1, it can note "this element may recur later" without waiting. This is especially valuable for callback/echo detection in bracket-structure essays.

### Type Escalation: How Understanding Deepens Through Layers

The Essay Intelligence System uses **progressive type enrichment** — each layer produces observations at a complexity level matching its LLM model and available context:

| Layer | Model | Output Complexity | Example Field |
|-------|-------|-------------------|---------------|
| L1 | Haiku | Simple strings | `apparentPurpose: string` |
| L2 | Sonnet | Structural roles | `role: string, significance: string` |
| L2.5 | Haiku | Categorized leads | `repeatedElements[], tonalShifts[], structuralEchoes[]` |
| L3 | Sonnet | Evidence-grounded multi-observation | `observedFunctions: ObservationEntry[]` |
| L3.75 | Sonnet | Full holistic synthesis | Complete `VoiceIdentity`, `EmotionalTopography`, etc. |
| L3.5 | Sonnet | Scored evaluation | `effectiveness: number, strengths: ObservationEntry[]` |

**Why this matters for supersession**: L3's richer output naturally REPLACES L1's simpler output through the SentenceMutator's supersession semantics. The Profile Manager doesn't need special handling — when L3 writes `observedFunctions: ObservationEntry[]` to a sentence, it overwrites L1's simpler `apparentPurpose: string` that was temporarily stored there. Each layer's output type is designed for that layer's LLM model capability and available context level.

**Design constraint**: Layer output types are INPUT types (what the LLM produces). Profile types are STORAGE types (what persists). The Profile Manager's mutators handle the mapping between them. For L3.75 specifically, the output types ARE the storage types — no transformation needed (see Design Decision: "LLM output IS the profile data").

### Layer 3: Understanding Walk (Sonnet x N, sequential) — THE CORE

**File**: `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` (exists, needs enrichment)

**UNDERSTANDING ONLY.** No evaluation, no judgment, no "is this good?" — all cognitive resources go to comprehending WHAT IS. Each paragraph gets a dedicated Sonnet call that:
1. Deeply comprehends the paragraph from every angle
2. Maps every sentence: observed functions, inferred intents, narrative contributions, craft observations, word significance
3. Identifies cross-paragraph connections with everything seen so far
4. **Back-propagates** understanding updates to prior sentences
5. Deepens holistic understanding (thesis, voice, themes, character)
6. Updates the Profile Index with new tags, connections

**What it does NOT do**: Evaluate effectiveness. Score quality. Identify strengths/weaknesses. Say "this is good" or "this could be stronger." Those are for L3.5.

**Why this separation produces deeper understanding**: When a single call tries to understand AND evaluate, the LLM rushes through comprehension to get to the "useful" part (evaluation). Separating them gives understanding 100% of cognitive resources. The LLM can notice things it wouldn't notice if it were simultaneously trying to judge them.

**Selective Profile Injection** (critical for managing prompt size):

The full profile can be 5000+ tokens by paragraph 5. Every L3 call uses **index-guided selective loading**:

- **Always included**: Profile Index (~200-300 tokens) + holistic understanding sections (~400-600 tokens)
- **Current paragraph**: Full L1 impressions + scout connection leads involving this paragraph
- **Adjacent paragraphs** (N-1, N-2): Full sentence understanding maps (for connection detection)
- **Earlier paragraphs**: Only paragraph digest from Profile Index (not full sentence maps)
- **Specific sentences from earlier**: Loaded if the Profile Index's connection graph suggests relevance

This keeps each L3 call's profile context to ~1500-2500 tokens regardless of essay length.

**L3 Output per paragraph** (understanding only — see full `UnderstandingWalkOutput` in Bidirectional Profile Updates):

```typescript
// Per-sentence understanding (NO analysis, NO feedback):
interface SentenceUnderstanding {
  index: number;
  text: string;

  // WHAT this sentence IS doing — multi-observation
  observedFunctions: ObservationEntry[];      // MULTI: sentence can do multiple things
  inferredIntents: ObservationEntry[];         // MULTI: writer may have multiple goals
  rhetoricalFunctions: string[];              // MULTI: can serve multiple rhetorical roles
  narrativeContributions: ObservationEntry[]; // MULTI: can advance arc + thread + callback
  paragraphContribution: string;

  // CRAFT OBSERVATIONS (descriptive — what IS the rhythm, NOT is it good)
  rhythmContribution: string;
  voiceAlignment: string;
  techniques: string[];
  significantChoices: Array<{ wordOrPhrase: string; significance: string }>;
  // NOTE: No isStrength/alternative here — those are evaluative (analysis layer).
  // L3 describes WHAT the word choice does. L3.5 judges WHETHER it works.

  // CONNECTIONS + TAGS
  connectionRefs: string[];
  tags: string[];
}
```


### Layer 3.75: Holistic Synthesis (Sonnet x 1) — FULL ESSAY-LEVEL UNDERSTANDING

**New file**: `src/services/essayIntelligence/analysis/holisticSynthesis.ts` (~250 lines)

**The gap this fills**: During the L3 walk, `holisticEvolution` captures incremental shifts (thesis crystallizing, voice signature emerging) — but only 4 fields. The full holistic profile has 7 major sections with dozens of fields: emotional topography (arc, undertones, authenticity), character revelation (values, growth arc, blind spots), craft assessment (sentence patterns, image system), admissions positioning (tellability, distinctiveness, red flags), etc. Nothing in the current architecture populates these comprehensively.

**Three new responsibilities** beyond the original synthesis:

1. **Voice Map population.** L3.75 sees the complete sentence-level understanding — every paragraph, every sentence, every connection. It maps register, vocabulary fingerprint, sentence rhythm, perspective/distance, and tonal disposition (humor, irony, earnestness, irreverence, solemnity — per review S4) across the entire essay. It identifies stability regions and shift points. For each shift, it assesses intentionality — does this shift align with a structural boundary? Does it serve an identifiable purpose in another dimension? Does it commit fully to the new register or oscillate? Intentionality assessments carry a confidence level (0-1). Below 0.6, the system should present the shift as a question to the student, not a conclusion (per review M4).

2. **Moment Earned-ness Map.** L3.75 traces backward from each significant moment — emotional peaks, intellectual realizations, humorous payoffs (per review S5, not just emotions) — to identify the narrative mechanisms that earn it. For each moment, it builds the arrow network: which earlier passages contribute through sensory grounding, emotional setup, stakes establishment, character revelation, thematic preparation, intellectual scaffolding, or comedic/subversive setup. When a moment is unearned, the map identifies the specific gap: "P3S5 claims devastation but no prior passage established emotional proximity to the object." The arrow network IS the diagnosis — sparse arrows mean unearned moments, dense arrows mean earned ones.

3. **Cross-Dimension Entanglements.** L3.75 identifies moments where 2+ dimensions intersect meaningfully: "P2S3's voice shift from concrete to reflective IS the thematic pivot from transaction to value." Entanglements are stored as a separate section (the 8th holistic section, per review C1), not inside individual dimension sections. They are the evidence layer — specific, located, with precise paragraph/sentence references. L4's distinctiveness signature will synthesize across these entanglements to produce the global interpretive reading (per review S7).

**Input**: Profile Index + all paragraph understanding maps + all connections + ALL populated holistic sections accumulated during the walk (as a starting point, not the final answer) + scout connection leads + conditional North Star summary (nice-to-have, from prior analysis round if available).

**Prompt structure** (3-block caching):
- **Block 1** (static, cached forever): System instructions — role as holistic synthesizer, output schema, voice map dimensions, earned-ness mechanism types, entanglement detection guidance, examples of intentional vs unintentional voice shifts.
- **Block 2** (essay-specific, cached across L3.75 + L3.5 if sequential): Full essay text + complete sentence-level understanding maps for all paragraphs + connection graph + scout connection leads.
- **Block 3** (call-specific, not cached): The incremental `holisticEvolution` accumulation from the walk as a starting scaffold. Prompt: "Synthesize the complete holistic profile from the ground up. The walk's incremental observations are a starting point — confirm, deepen, or correct them using the full understanding."

**Output**:
```typescript
interface HolisticSynthesisOutput {
  voiceIdentity: {
    signature: string;
    register: string;
    distinctivePatterns: string[];
    evolution: string;
    authenticMoments: Array<{ paragraph: number; sentence: number; moment: string }>;
    voiceDrifts: Array<{ paragraph: number; from: string; to: string }>;
    // consistencyScore REMOVED — replaced by voiceMap
  };
  voiceMap: {
    dimensions: {
      register: Array<{ paragraphs: number[]; level: string }>;
      vocabularyFingerprint: Array<{ domain: string; examples: string[]; paragraphs: number[] }>;
      sentenceRhythm: Array<{ paragraphs: number[]; pattern: string }>;
      perspectiveDistance: Array<{ paragraphs: number[]; stance: string }>;
      tonalDisposition: Array<{ paragraphs: number[]; tone: string }>;  // humor, irony, earnestness, etc.
    };
    stabilityRegions: Array<{ paragraphs: number[]; voiceCharacter: string }>;
    shiftPoints: Array<{
      location: { paragraph: number; sentence: number };
      from: string;
      to: string;
      intentional: boolean;
      intentionalityConfidence: number;       // 0-1. Below 0.6 → present as question
      intentionalityReasoning: string;        // WHY the system thinks intentional/unintentional
      servesOtherDimension: string | null;    // e.g. "emotional transition", "thematic pivot"
      codeSwitching: { language: string; trigger: string; culturalFunction: string } | null;
    }>;
  };
  emotionalTopography: {
    arc: string;
    peakMoments: Array<{ paragraph: number; sentence: number; moment: string; intensity: number }>;
    undertones: string[];
    authenticityAssessment: string;
    emotionalProgression: Array<{ paragraph: number; register: string; depth: number }>;
    // isEarned REMOVED — replaced by earnednessMap
  };
  earnednessMap: {
    moments: Array<{
      location: { paragraph: number; sentence: number };
      momentType: 'emotional' | 'intellectual' | 'humorous' | 'subversive';
      description: string;
      intensity: number;
      arrows: Array<{
        source: { paragraph: number; sentence: number };
        mechanism: 'sensory_grounding' | 'emotional_setup' | 'stakes_establishment'
          | 'character_revelation' | 'thematic_preparation'
          | 'intellectual_scaffolding' | 'comedic_setup';
        contribution: string;           // What this source passage contributes
      }>;
      earned: boolean;                  // Derived: arrows.length >= threshold for momentType
      gap: string | null;               // If unearned: what is missing
    }>;
  };
  thematicArchitecture: {
    centralThesis: string;
    thesisConfidence: number;
    thesisEvolution: string;
    threads: Array<{
      thread: string;
      introducedAt: { paragraph: number; sentence: number };
      appearances: Array<{ paragraph: number; sentence: number }>;
      strength: 'dominant' | 'supporting' | 'hinted' | 'dropped';
    }>;
    subtext: string;
    contradictions: string[];
  };
  narrativeStrategy: {
    primaryStrategy: string;
    whyThisStructure: string;
    pivotPoints: Array<{ paragraph: number; sentence: number; description: string }>;
    pacingAnalysis: string;
    arcType: string;
    arcMomentum: 'building' | 'sustaining' | 'releasing' | 'stalling';
    turningPoint: { paragraph: number; sentence: number } | null;
  };
  characterRevelation: {
    whoIsThisWriter: string;
    valuesRevealed: string[];
    growthArc: string;
    blindSpots: string[];
    intellectualFingerprint: string;
    revealedQualities: string[];
  };
  craftAssessment: {
    sentenceLevelPatterns: string;
    wordChoiceProfile: string;
    imageSystem: string;
    // NOTE: strengthSignatures and growthEdges populated by L3.5 analysis, not here
  };
  admissionsPositioning: {
    tellabilitySummary: string;
    distinctivenessFactors: string[];
    institutionalFit: string;
    redFlags: string[];
    memorabilityAssessment: string;
    aoTakeaway: string;
  };
  crossDimensionEntanglements: Array<{
    dimensions: string[];               // e.g. ["voice", "theme"] or ["structure", "emotion", "character"]
    location: { paragraph: number; sentence: number };
    description: string;                // "P2S3's voice shift from concrete to reflective IS the thematic pivot"
    significance: 'foundational' | 'supporting' | 'subtle';
  }>;
}
```

**North Star preparation**: L3.75 produces the raw material L4 will synthesize. The thematic architecture's thread map, the connection graph's cross-paragraph links, the voice map's shift points, the earned-ness map's arrow network, the entanglements — L3.75 sees them all with the complete sentence-level understanding as evidence. L4's job is not to repeat this work but to synthesize across it, finding the architecture of meaning that no individual section articulates.

**Why a separate call instead of expanding `holisticEvolution`**: The walk's job is paragraph-level deep understanding with back-propagation. Asking it to ALSO synthesize essay-level voice maps, earned-ness networks, and cross-dimension entanglements splits its cognitive focus. A dedicated synthesis call reads all the sentence-level work and THINKS holistically — the same principle behind separating L3 and L3.5.

**Why this produces better holistic sections**: During the walk, the LLM only sees P1-P3 when synthesizing after P3's walk step. The holistic synthesis sees EVERYTHING — every sentence's purpose, every connection, the complete narrative arc. Its earned-ness map traces arrows from P5's payoff back to P1's setup. Its voice map identifies intentional variation because it sees both the shift and the structural reason for it. Its entanglements identify voice-theme intersections because it holds both dimensions simultaneously.

**Cost**: ~$0.03-0.05 (single Sonnet call with prompt-cached understanding profile, larger output than before due to voice map + earned-ness map)
**Timing**: Runs AFTER L3 walk completes, BEFORE L3.5 analysis pass. L3.5 analysis then has both complete sentence-level understanding AND complete holistic understanding (including voice map and earned-ness map) as context.

---

### Layer 4: Crystallization (Sonnet x 1) — NORTH STAR + SCORING + COHERENCE

**File**: `src/services/essayIntelligence/analysis/crystallizer.ts` (exists, needs substantial rewrite)

**This layer's purpose**: Synthesize the complete profile into three artifacts that no earlier layer produces — the Essay North Star (architecture of meaning), the Paragraph Score Matrix (per-paragraph multi-dimensional evaluation), and the Coherence Report (contradiction detection). L4 reads across ALL holistic sections, the connection graph, paragraph digests, the voice map, the earned-ness map, and entanglements to produce understanding that transcends any individual section.

**What the North Star IS**: The system's understanding of how an essay **means** — not what it says, not how well it says it, but the architecture by which individual moments compose into a unified act of self-revelation. Think of a conductor studying a symphony score: the conductor doesn't need the notes (sentence-level understanding) or tuning assessment (analysis layer). The conductor needs the interpretive vision — the first movement's theme reappears inverted in the fourth, and that inversion IS the emotional argument. The North Star is this kind of knowledge.

**What the North Star is NOT**: A summary. A summary is lossy compression — everything in it exists more deeply elsewhere. The North Star is an emergent property. The through-line map doesn't exist in the sentence-level understanding. The structural roles map doesn't exist in the paragraph analysis. You cannot derive the North Star by compressing; you can only produce it by synthesizing. If you deleted it, you would lose an interpretive synthesis that requires re-reading the entire profile holistically.

**North Star vs ProfileIndex**: The ProfileIndex is for machines — routing, token estimation, selective loading. The North Star is for meaning — it tells downstream consumers WHY a paragraph matters, not just WHAT it contains. Both exist. They serve different purposes.

**Input**: Profile Index + all holistic sections (voice identity, voice map, emotional topography, earned-ness map, thematic architecture, narrative strategy, character revelation, craft assessment, admissions positioning, cross-dimension entanglements) + paragraph digests from Profile Index (NOT full sentence maps — they're in the profile, not needed for crystallization) + connection graph summary.

**Prompt structure** (3-block caching):
- **Block 1** (static, cached forever): System instructions — role as crystallizer, North Star dimensions with guidance (through-line traces meaning transformation not just appearance, structural roles identify necessity not topic, trajectory presents MULTIPLE plausible paths), scoring rubric for paragraph matrix, coherence checking rules. Includes examples of good vs bad North Star output (summary-like = bad, architecture-of-meaning = good).
- **Block 2** (essay-specific, cached): Full essay text + holistic synthesis output + paragraph digests + connection graph summary + voice map + earned-ness map + entanglements.
- **Block 3** (call-specific, not cached): "Crystallize the North Star, score each paragraph, and report any contradictions found in the profile."

**Scaled by essay type** (per review C4):
- **Supplements** (<250 words): Two dimensions — structural roles map (what this essay does in the portfolio) + distinctiveness signature. No through-line (too short for submersion/transformation). No trajectory (the essay is too focused). Intent bridge populated by L6 if conversation happens.
- **PIQs** (~350 words): Three dimensions — add through-line map. PIQs are long enough for a central element to surface, develop, and resolve.
- **Personal statements** (~650 words): Full five dimensions.

**Output**:
```typescript
interface CrystallizationOutput {
  northStar: EssayNorthStar;
  paragraphScoreMatrix: ParagraphScoreMatrix;
  coherenceReport: CoherenceReport;
}

interface EssayNorthStar {
  /** How many dimensions are populated depends on essay type */
  essayType: 'supplement' | 'piq' | 'personal_statement';

  /** Traces the central element's journey: where it surfaces, submerges, transforms, resolves.
   *  NOT "diamond appears in P1, P3, P5" (connection graph does that).
   *  IS "the diamond's MEANING transforms from commodity → inheritance → identity." */
  throughLineMap: {
    centralElement: string;
    journey: Array<{
      paragraph: number;
      sentence: number;
      meaningAtThisPoint: string;
      transformation: string | null;      // How meaning changed from previous appearance
    }>;
    overallArc: string;                   // The meaning transformation as a single statement
  } | null;                               // null for supplements

  /** What each section IS in the architecture of meaning — structural necessity, not topic.
   *  The pawnshop scene isn't "the opening" — it's the essay's frame of risk. */
  structuralRolesMap: Array<{
    paragraph: number;
    structuralRole: string;               // "frame of risk", "value system establishment", "fulcrum"
    whyNecessary: string;                 // What breaks if this section is removed
    significanceLevel: 'load-bearing' | 'connective' | 'fulcrum' | 'decorative';
  }>;

  /** Where the essay IS and where it COULD go. MULTIPLE plausible paths (per review S9).
   *  For works in progress: what the essay's momentum demands.
   *  For finished essays: what the strongest version of what's here looks like. */
  trajectory: {
    currentState: string;                 // Where the essay is now
    plausiblePaths: Array<{
      path: string;                       // "Resolve through direct confrontation with inherited values"
      supportLevel: 'strong' | 'moderate' | 'speculative';
      evidenceFromText: string;           // What in the current text supports this path
    }>;
    unrealizedConnections: Array<{        // Connections the student hasn't discovered yet
      description: string;
      paragraphs: number[];
    }>;
  } | null;                               // null for supplements

  /** What makes THIS essay non-interchangeable — the specific combination of experience,
   *  structural choice, and voice that could not have been written by anyone else.
   *  NOT "about family and imperfection" (describes thousands of essays).
   *  IS "uses pawnshop economics to dramatize the gap between market and inherited value." */
  distinctivenessSignature: {
    whatMakesItUnique: string;
    voiceContribution: string;            // How voice specifically contributes to distinctiveness
    structuralContribution: string;       // How structural choices contribute
    experienceContribution: string;       // How the specific experience contributes
  };

  /** Student's stated understanding alongside the system's. Populated by L6 conversation.
   *  Divergences are coaching opportunities, not problems. */
  intentBridge: {
    studentStatedIntent: string | null;   // null until L6 conversation
    systemReading: string;
    alignments: string[];                 // Where student and system agree
    divergences: string[];                // Where they differ — coaching fuel
    confirmedInsights: string[];          // Student confirmed the system's reading
  };

  /** Confidence and metadata */
  confidence: 'hypothesis' | 'emerging' | 'deep' | 'comprehensive';
  tokenEstimate: number;                  // For selective loading decisions
}

interface ParagraphScoreMatrix {
  paragraphs: Array<{
    index: number;
    scores: {
      effectiveness: number;              // 0-100, from L3.5 analysis
      structuralContribution: number;     // 0-100, how well it fulfills its structural role
      voiceConsistency: number;           // 0-100, relative to essay's dominant voice
      emotionalContribution: number;      // 0-100, emotional depth and earned-ness
      thematicRelevance: number;          // 0-100, contribution to through-line/themes
    };
    verdict: string;                      // Single-sentence assessment
    priorityForImprovement: number;       // 1-5, informed by structural role significance
  }>;
  crossParagraphPatterns: string[];       // "Emotional intensity builds linearly — consider a dip before climax"
  prioritizedImprovements: Array<{
    paragraph: number;
    improvement: string;
    whyThisMatters: string;               // References North Star structural roles
    expectedImpact: 'transformative' | 'significant' | 'incremental';
  }>;
}

interface CoherenceReport {
  contradictions: Array<{
    sectionA: string;                     // e.g. "thematicArchitecture.centralThesis"
    claimA: string;
    sectionB: string;
    claimB: string;
    severity: 'blocking' | 'notable' | 'minor';
    suggestedResolution: string;
  }>;
  isCoherent: boolean;                    // false if any blocking contradictions
}
```

**Token budget** (per review M1): The North Star should be ~500-800 tokens when fully populated (personal statement with all 5 dimensions). Supplements: ~200-300 tokens. PIQs: ~300-500 tokens. The ParagraphScoreMatrix and CoherenceReport add ~200-400 tokens. Total L4 output: ~700-1200 tokens.

**Selective loading rules for consumers**:
- **L5 annotations**: Through-line map + structural roles map (needed for "local symptom → structural consequence" transformation)
- **L6 coaching**: Through-line map + structural roles + intent bridge (needed for phase-aware coaching with significance awareness)
- **Edit interpretation**: Structural roles map only (needed to assess edit significance based on structural position)
- **Portfolio strategy**: Full North Star (needed for cross-essay composition)
- **Re-analysis brief**: Structural roles map + trajectory (per review C3 — what is structurally significant about the changed areas)

**The FULL EssayProfile is preserved separately** — the North Star is a lens into it, not a replacement. The North Star articulates something that NO individual profile section contains. It sees across the thematic architecture, the connection graph, the structural roles, and the character revelation, and articulates the single integrated understanding that ties them together.

**Cost**: ~$0.03-0.05 (single Sonnet call, prompt-cached holistic sections)
**Timing**: Runs AFTER L3.5 analysis pass completes (needs paragraph effectiveness scores for the score matrix). Runs in parallel with L5 if North Star is not yet needed — but L5 benefits significantly from North Star context, so sequential (L4 → L5) is preferred when budget allows.

---

### Layer 5: Deep Annotations (Sonnet, parallel) — PHASE-AWARE FEEDBACK WITH NORTH STAR CONTEXT

**File**: `src/services/essayIntelligence/analysis/deepAnnotationService.ts` (exists, needs update)

**Input**: Profile Index (including `improvementPhase`) + full profile (Understanding + Analysis layers) + Essay North Star (structural roles map + through-line map)

This is where the **Feedback layer** is generated — NOT stored in the profile, delivered as annotation output. The annotations read the complete Understanding + Analysis AND the North Star to generate contextually appropriate suggestions **at the current improvement phase zoom level** with **structural significance awareness**.

**The North Star transformation**: Without the North Star, L5 looks at a paragraph and sees a local symptom: "telling rather than showing the grandfather's value system" → "Consider showing your grandfather's values through a specific action." With the North Star's structural roles map, L5 knows that this paragraph's structural role is to establish the value system that the fulcrum (paragraph 4) will test the student against. The annotation becomes: "Your grandfather's values need to be FELT by the reader before paragraph 4, where you almost trade them away. Right now we're told he chose the cloudy diamond — but we don't experience the weight of that choice. What if we SAW the moment he chose it? The reader needs to carry his choice in their body so that when you almost sell the ring, we feel what's at stake." The difference: the first addresses a local symptom, the second addresses the same symptom in terms of its structural consequences for the essay's architecture.

**Re-analysis brief integration**: When L5 runs during re-analysis (not first-time analysis), it receives the re-analysis brief alongside its normal inputs. The brief contains:
1. What changed (paragraph and sentence-level diffs)
2. Why it changed (student's stated intents from conversations, or "No conversation context")
3. Tentative assessments (light-touch adjustments, staleness flags)
4. **Structural significance** (per review C3): What is structurally important about the changed areas, populated from the North Star's structural roles map. "The changed sentence is in the fulcrum paragraph" or "This edit is in a transitional section with no through-line involvement."

This context allows L5 to generate annotations that acknowledge the student's intent ("You mentioned wanting the transition to feel less abrupt — here's how the new version works in that direction, and here's what it could still do to serve the essay's emotional arc").

**Phase-aware annotation generation**: The annotation prompt receives `improvementPhase` from the ProfileIndex and focuses feedback accordingly:

| Phase | Annotation Count | Focus | What's Surfaced |
|-------|-----------------|-------|-----------------|
| Foundation | 2-3 | Essay-level | Thesis clarity, arc coherence, structural problems |
| Architecture | 3-5 | Paragraph-level | Paragraph roles, transitions, pacing, show vs tell |
| Craft | 5-8 | Sentence-level | Sentence effectiveness, rhythm, opening/closing craft |
| Polish | 8-12 | Word/phrase-level | Specific word choices, image precision, verb strength |
| Distinction | 3-5 | Memorability | Voice uniqueness, what makes this unforgettable, the 1% |

**The key principle**: Analysis ALWAYS evaluates everything at every level. The improvement phase acts as a **filter** on which analysis findings become feedback. The system knows about the word-level issues in Foundation phase — it just doesn't surface them until the big-picture issues are resolved.

**Prompt structure** (3-block caching):
- **Block 1** (static, cached forever): System instructions — role as annotation generator, phase-aware feedback rules, output schema, examples of North-Star-informed annotations vs generic annotations.
- **Block 2** (essay-specific, cached across all parallel L5 calls): Full essay text + complete understanding profile + analysis results + North Star (structural roles + through-line map) + re-analysis brief (if re-analysis).
- **Block 3** (call-specific, not cached): Target paragraph to annotate + improvement phase context:

```
IMPROVEMENT PHASE: ${phase.level}
Focus areas: ${phase.focusAreas.join(', ')}
Deferred areas: ${phase.deferredAreas.join(', ')}

NORTH STAR CONTEXT:
This paragraph's structural role: ${northStar.structuralRolesMap[paragraphIndex].structuralRole}
Significance: ${northStar.structuralRolesMap[paragraphIndex].significanceLevel}
Through-line involvement: ${throughLineInvolvement || 'None'}

Generate annotations ONLY for issues at the current phase level.
Frame each annotation in terms of its STRUCTURAL consequence — not just "fix this"
but "fix this because of what it means for the essay's architecture."

${phase.level === 'foundation' ? 'Focus on 2-3 essay-level observations. Do NOT surface sentence-level or word-level issues — those will be addressed after the foundation is solid.' : ''}
${phase.level === 'craft' ? 'Paragraphs are pulling weight. Focus on 5-8 sentence-level improvements. Be specific — cite the sentence, explain why it underperforms in its structural context, show a rewrite.' : ''}
${phase.level === 'distinction' ? 'This essay is polished. Focus on what will make an admissions officer REMEMBER this essay. The 1% that separates good from unforgettable.' : ''}
```

**Output**:
```typescript
interface AnnotationFeedback {
  /** Prescriptive: what the sentence SHOULD be doing in the essay's architecture */
  prescriptiveRole: string;
  /** Concrete improvement suggestions — framed with structural consequence */
  suggestions: string[];
  /** Example rewrite if needed */
  rewriteExample: string | null;
  /** Teaching framing — WHY this matters to the essay's architecture (not just "do this") */
  teachingRationale: string;
  /** Which improvement phase this annotation targets */
  phaseRelevance: ImprovementPhase['level'];
  /** Structural role context from North Star */
  structuralContext: string | null;
}
```

**Why feedback isn't stored**: If we stored P1S1's annotation feedback as `prescriptiveRole: "Ground the reader more deeply in physical sensation"`, and then the student asks the coach "How should I improve my opening?", the coach would either repeat the stored feedback (redundant) or generate fresh feedback that contradicts it (confusing). By keeping feedback ephemeral, every annotation and coaching turn generates feedback fresh from Understanding + Analysis + North Star, appropriate to the current context and improvement phase.

**Cost**: ~$0.02-0.03 per paragraph x 5 paragraphs = ~$0.08-0.15 (parallel, fast)
**Prompt caching**: Essay + understanding profile + North Star cached → ~75% input token savings across parallel calls
**Timing**: Runs AFTER L4 crystallization completes (needs North Star context). All paragraphs annotated in PARALLEL since all context is complete.

---

### Layer 6: Conversation-Driven Deepening (ongoing) — INSIGHT EXTRACTION + PHASE-AWARE COACHING + PROFILE DEEPENING

**File**: `src/services/essayIntelligence/coachingService.ts` (to be built, ~400 lines)

**This layer's purpose**: L6 is the only layer where information flows INWARD — the student tells us something the text alone could never reveal. Every other layer reads the essay and builds understanding outward. When a student says "actually, the diamond is about my grandfather — he always said flawed things are more interesting," that statement is authoritative in a way no inference can be. L6 extracts these insights, deepens the profile, and generates phase-aware coaching responses with structural significance awareness.

**Input (always loaded)**: Profile Index (including `improvementPhase`), North Star. Relevant profile sections loaded based on focus detection.

**The L6 Pipeline** has five stages per student message:

**Stage 1 — Insight Extraction + Focus Detection (Haiku, single call)**

Every student message is classified in a single Haiku call that produces two outputs simultaneously (per review S2):

*Output A — Insight Classification* (8 primary categories):
- **Confirmation** — "Yes, that's exactly what I meant" → boosts confidence in existing understanding
- **Reinterpretation** — "Actually, it's more about my grandfather" → replaces inferredIntents, triggers cascade check
- **New context** — "I also volunteer at a food bank" → adds new understanding
- **Correction** — "No, that sentence isn't about fear" → negates existing understanding, lowers confidence
- **Preference** — "I like the shorter version better" → records stylistic preference
- **Clarification** — "What I meant was..." → refines existing understanding
- **Emotional reaction** — "That paragraph makes me cringe" → signal about the student's relationship to their own writing
- **Resistance** — "I know the transition is abrupt, but I want it that way" → artistic intent assertion, probe for reasoning

Secondary attributes (modulate nuance): emotional valence (-1 to 1), confidence level (0-1), explicitness (explicit/implicit/ambiguous), scope certainty (0-1), novelty (novel/refinement/repetition). A single statement is captured as "reinterpretation, with strong emotional investment, high confidence, affecting essay-level understanding."

*Output B — Focus Detection* (what the student is asking about):
- Which paragraph(s)/sentence(s) are relevant
- What dimension(s) the question touches (voice, structure, emotion, theme, etc.)
- Whether this is a coaching question, a revision discussion, or a meta-conversation

*Scope detection*: Treated as a probability distribution, not a point estimate. "I like the ending" has high probability for the last paragraph, moderate for the last 2-3 sentences. Resolution comes from immediate context (did the coach just ask about a specific sentence?) and natural follow-up probing. Multi-scope insights are supported — "I wrote the first and last paragraphs together" creates a cross-paragraph connection.

**Stage 2 — Context Routing (Profile Router, no LLM call)**

Based on focus detection output, the Profile Router selects relevant profile sections:
- Always: Profile Index + North Star (structural roles relevant to the focused area)
- If coaching question: Understanding + Analysis for focused paragraph(s) + relevant holistic sections
- If revision discussion: Focused paragraph understanding + earned-ness map arrows involving that paragraph + voice map entries for that area
- If meta-conversation: Conversation insight history + improvement phase context
- Connection-guided loading: If the focused sentence has connections to other sentences, load those sentences' understanding too

**Stage 3 — Coaching Response Generation (Sonnet)**

Generates a phase-aware coaching response with full structural significance awareness:

```
The student is in the ${phase.level} improvement phase.
${phase.reasoning}

NORTH STAR CONTEXT:
${relevantNorthStarSections}

When they ask for general improvement advice, focus on: ${phase.focusAreas.join(', ')}.
Acknowledge but defer: ${phase.deferredAreas.join(', ')}.

If they specifically ask about a deferred area (e.g., word choice in Foundation phase),
give a brief, honest answer but redirect to what matters most right now.
Frame improvement advice in terms of structural consequence — not just "fix this"
but "fix this because of how it serves the essay's architecture."
```

Phase-aware zoom:
- Foundation phase student asks "how do I improve?" → coach focuses on thesis and structure, NOT word choice
- Craft phase student asks "how do I improve?" → coach focuses on specific sentence rewrites
- Polish phase student asks about a word → coach gives deep word-level guidance because that's WHERE the student is
- The coach can acknowledge lower-level issues exist ("Your word choices are mostly strong — we'll fine-tune those once the paragraph structure is solid") without diving into them. Motivating, not dismissive.

**Stage 4 — Profile Deepening (conditional, category-dependent)**

Each insight category maps to specific Profile Manager behavior:

| Category | Model | Profile Action |
|----------|-------|---------------|
| Confirmation | Haiku (or none) | Boost confidence on targeted understanding. No structural change. |
| Reinterpretation | Sonnet | Replace `inferredIntents` on targeted sentences. Trigger cascade check — may invalidate related holistic sections, earned-ness arrows, entanglements. Flag stale sections for next synthesis pass. |
| New context | Sonnet | Add new understanding. May affect narrative strategy, character revelation, North Star trajectory. |
| Correction | Haiku | Negate targeted understanding, lower confidence on related inferences. |
| Preference | None | Record in conversation insights. Inform future coaching tone. |
| Clarification | Haiku | Refine targeted understanding without replacing it. |
| Emotional reaction | Haiku | Record as meta-insight. May inform earned-ness map (student feels cringe → possible inauthenticity signal). |
| Resistance | Haiku | Record artistic intent. Suppress the system's suggestion on that element. Probe for reasoning in next coaching turn. |

**Partial supersession**: Insights can partially update prior insights. "Yes, it's about imperfection, but specifically how imperfection makes things MORE valuable" — the core insight (imperfection) is confirmed while the framing (negative vs positive) is revised. The system marks the original as partially superseded, preserving confirmed portions.

**Pattern detection**: Over a session, meta-insights emerge from sequences of statements. A student who keeps returning to paragraph 3 but never mentions paragraph 2. A student who agrees with feedback but never implements it. These patterns are stored separately so they inform coaching strategy without polluting the essay profile.

**Stage 5 — Phase Re-check (conditional)**

If a `reinterpretation` or `new_context` insight changes the analysis landscape enough to shift the improvement phase (e.g., student reveals the thesis is actually about X, which resolves the "unclear thesis" concern → Foundation → Architecture), update `improvementPhase` in ProfileIndex. Subsequent coaching turns use the new zoom level.

**Cross-session durability**: Each insight gets a durability level inferred from scope and category:
- **Ephemeral** — tied to specific text, invalidated by edits ("I chose 'stumbled' deliberately")
- **Draft-durable** — survives minor edits, invalidated by structural rewrites
- **Essay-durable** — persists as long as this essay is being worked on
- **Student-durable** — persists across all essays ("I'm a perfectionist and that's part of what I'm writing about")

Student-durable insights are stored in a separate `student_insights` table (per review C1), not in the essay-specific conversation insights. The re-analysis brief pulls from both essay-level and student-level insight stores.

**Portfolio intent** (per review M7): When a student references another essay ("I want my Common App to complement my Stanford supplement"), the insight is categorized as `portfolio_intent` and routed to the portfolio intelligence layer. L6 does not resolve cross-essay questions itself — it captures the signal and routes it.

**Integration with Conversational Edit Workshop**: When the student edits during conversation (Pathway 1 from the version-based re-analysis design), insight extraction captures both what they SAID and what they DID. The edit understanding pipeline feeds L6 its reading of the change, and the coach can respond: "I noticed you changed 'decided' to 'couldn't' — that shifts the moment from a rational choice to something deeper. Tell me more about what you're going for." The student's response becomes an insight that enriches both the version record and the essay profile.

**Prompt structure** (3-block caching):
- **Block 1** (static, cached across entire coaching session): System instructions — coaching philosophy, phase-aware zoom rules, insight extraction taxonomy, North Star usage guidance, examples of good coaching responses at each phase.
- **Block 2** (session-specific, cached across turns within session): Essay text + Profile Index + North Star + relevant profile sections (updated by Profile Router each turn). Profile sections are re-rendered when the focus shifts to a different area.
- **Block 3** (turn-specific, not cached): Conversation history (last 8-12 messages for continuity) + current student message + Haiku's focus detection and insight classification output.

**Output per turn**:
```typescript
interface CoachingTurnOutput {
  /** The coaching response to display to the student */
  response: string;

  /** Extracted insight, if the student revealed something new */
  insight: {
    category: 'confirmation' | 'reinterpretation' | 'new_context' | 'correction'
      | 'preference' | 'clarification' | 'emotional_reaction' | 'resistance';
    content: string;
    scope: {
      paragraphs: number[];
      sentences: number[];
      holistic: boolean;                  // Affects essay-level understanding
    };
    scopeCertainty: number;               // 0-1
    secondaryAttributes: {
      emotionalValence: number;           // -1 to 1
      confidence: number;                 // 0-1
      explicitness: 'explicit' | 'implicit' | 'ambiguous';
      novelty: 'novel' | 'refinement' | 'repetition';
    };
    durability: 'ephemeral' | 'draft_durable' | 'essay_durable' | 'student_durable';
    supersedes: string | null;            // ID of prior insight this partially/fully replaces
  } | null;

  /** Profile update instructions for the Profile Manager */
  profileUpdates: Array<{
    target: string;                       // e.g. "paragraphs[2].sentences[3].understanding.inferredIntents"
    action: 'replace' | 'boost_confidence' | 'lower_confidence' | 'add' | 'flag_stale';
    value: unknown;
    cascadeCheck: boolean;                // Should the Profile Manager check for downstream staleness?
  }> | null;

  /** Focus detection result (for logging and Profile Router) */
  focusDetection: {
    paragraphs: number[];
    sentences: number[];
    dimensions: string[];
    conversationType: 'coaching' | 'revision' | 'meta';
  };

  /** Pattern detection, if a meta-insight emerged from the conversation sequence */
  patternDetection: {
    pattern: string;
    evidence: string;
    coachingImplication: string;
  } | null;
}
```

**Cost per turn**: ~$0.01-0.03 total
- Haiku focus detection + insight classification: ~$0.001-0.003 (single call, small prompt)
- Sonnet coaching response: ~$0.01-0.02 (prompt-cached essay + profile, only conversation history is new)
- Sonnet profile deepening (for reinterpretation/new_context only): ~$0.01-0.02 (only runs when insight requires Sonnet-level updating)
- Most turns: Haiku classification + Sonnet response = ~$0.01-0.02. Profile deepening is occasional.

**Cost per session** (estimated 15-25 turns): ~$0.15-0.50, depending on how many reinterpretation/new_context insights trigger Sonnet profile updates. Prompt caching across turns provides ~60-70% savings on the essay + profile context.


---

## Selective Profile Injection: Universal Context Routing

**Every API call in the system** uses the same pattern:

```
1. Load Profile Index (~200-300 tokens, always)
2. Determine relevance based on task/question
3. Load only relevant profile sections
4. Include index in prompt so AI knows what else EXISTS
5. AI can request additional sections if needed
```

### Routing Rules by Call Type

**Primary routing signal: connection graph.** The Profile Index's `connectionGraph` tracks which paragraphs/sentences link to each other. When loading context for any call, **connected paragraphs get full detail** regardless of proximity. Proximity is the FALLBACK for paragraphs without established connections.

**Why connection-driven > proximity-driven:** If P1 and P4 share a metaphor but P2/P3 don't, P4's walk needs P1's full understanding — not just its digest. Static proximity rules ("load N-1 and N-2 full") miss this. The connection graph captures the essay's actual semantic structure.

| Call Type | Always Loaded | Connection-Driven | Proximity Fallback | Skipped |
|-----------|---------------|-------------------|-------------------|---------|
| **L3 understanding (P3)** | Index, holistic understanding, scout leads | Full understanding for paragraphs with connections to P3 | P2 full understanding, P0-P1 digest | P4+ (not yet analyzed), ALL analysis |
| **L3.5 analysis (P3)** | Index, FULL understanding profile | All paragraph understanding (prompt-cached) | — | Prior analysis (fresh evaluation) |
| **L4 crystallization** | Index, holistic understanding + analysis | — | Paragraph digests, strength/weakness map | Full sentence maps |
| **L5 feedback/annotations** | Index, holistic understanding + analysis | All paragraph understanding + analysis | — | — |
| **L6 coaching (voice Q)** | Index, voiceIdentity | Understanding + analysis for voice-tagged sentences | — | Unrelated paragraphs |
| **L6 coaching (P2 Q)** | Index, P2 full understanding + analysis | P2's connections' target sentences (full detail) | Adjacent paragraph digests | Other paragraph details |
| **L6 coaching (overview)** | Index, all holistic sections | — | Paragraph digests | Full sentence maps |
| **Inline edit (P3S2)** | Index, P3S2 understanding + analysis | All sentences connected to P3S2 (full detail) | P3 craft profile | Other paragraphs |
| **Re-analysis (comprehensive)** | Index, changed paragraph full | Connected paragraphs' full detail | Adjacent digests | Unchanged unconnected paragraphs |
| **Focused understanding (P2S4)** | Index, P2S4 full understanding | Connected sentences' understanding, P2 paragraph understanding | P2 craft/voice holistic | Other paragraphs' sentences |
| **Focused analysis (P2S4)** | Index, P2S4 updated understanding + previous analysis | Connected sentences' analysis | P2 paragraph analysis | Other paragraphs |
| **Impact classification** | Index, paragraph digests for changed paragraphs, staleness snapshot | Connection graph entries (connected paragraph digests) | Adjacent paragraph digests | Full sentence maps, holistic sections |

### How Tags Enable Fast Routing

When a coaching question mentions "metaphor" or "diamond":
1. Profile Index scanned for tags containing "metaphor" or "diamond"
2. Matching paragraphs/sentences identified: P0S1 (`metaphor:diamond`), P3S4 (`metaphor:diamond`), P5S4 (`metaphor:diamond`)
3. Those specific sentences loaded (not entire paragraphs)
4. `connections.imageRecurrences` loaded for the diamond image
5. `thematicArchitecture` loaded for the imperfection theme

Total: ~400-600 tokens of precisely relevant context, instead of 4000+ tokens of full profile.



---

## Profile Manager Architecture

## 1. Architecture: Coordinator + Domain Mutators

A single monolithic Profile Manager that handles sentence understanding, holistic synthesis, connection creation, voice map entries, earned-ness arrows, and North Star updates would become a god object within a month. The fix (from review S8): split into a thin coordinator that orchestrates, and focused domain mutators that own their slice of the profile.

### The Coordinator (`essayProfileManager.ts`)

The EssayProfileCoordinator is deliberately thin. It is a dispatch hub, not a domain expert.

**What it does:**
- Owns the optimistic concurrency write lock (single `writeVersion` counter, incremented on every mutation)
- Dispatches mutations to the correct domain mutator(s) based on which layer is calling
- Manages cross-domain staleness propagation via a declared dependency map (see Section 3)
- Triggers ProfileIndex recomputation after every mutation
- Handles checkpointing at pipeline boundaries
- Validates cross-domain consistency (delegates intra-domain validation to each mutator)

**What it does NOT do:**
- Contain any domain-specific mutation logic (no sentence parsing, no connection deduplication, no holistic section merging)
- Import database modules or know how persistence works
- Make LLM calls or contain any AI logic
- Decide what content belongs in any profile section

**Why mutable in-place**: During the L3 understanding walk, the coordinator processes 5+ mutations in 30-45 seconds (one per paragraph, each with back-propagations and new connections). Creating immutable copies on each mutation would be wasteful — the profile is a single-writer, single-reader data structure during the pipeline. The coordinator is the sole writer. Safety comes through exclusive ownership, not copying.

**Why the coordinator does not own persistence**: Testability. In tests, the checkpoint store is a no-op or an in-memory buffer. In production, the orchestrator provides a callback that writes to Supabase. The coordinator never imports database modules.

### The 8 Domain Mutators

Each mutator owns one slice of the EssayProfile. It validates its own domain's internal referential integrity. The coordinator validates cross-domain consistency.

| Mutator | Domain | What It Owns |
|---------|--------|-------------|
| `SentenceMutator` | Sentence-level understanding and analysis | `observedFunctions`, `inferredIntents`, `narrativeContributions`, word significance, tags, back-propagation from later paragraphs. Supersession model: entire arrays replaced, not appended. |
| `ParagraphMutator` | Paragraph-level understanding, analysis, role | Paragraph role, effectiveness score, emotional register, craft profile, structural bookkeeping (sentence counts, index boundaries). |
| `HolisticMutator` | 8 of 10 holistic section types | Voice identity, emotional topography, thematic architecture, narrative strategy, character revelation, craft assessment, admissions positioning, AND cross-dimension entanglements. (The remaining 2 section types — voice_map and earnedness_map — are owned by their dedicated mutators below.) Supports both incremental merge (during L3 walk) and full supersession (during L3.75). |
| `ConnectionMutator` | Connection creation, removal, updates | `connections.all[]`, `imageRecurrences`, `narrativeArcMap`, `redundancies`. Manages `connectionRefs` on sentences (coordinated with SentenceMutator). Ensures unique connection IDs and valid endpoints. |
| `VoiceMapMutator` | Voice shift entries and stability regions | Voice map entries across 5 dimensions (register, vocabulary fingerprint, sentence rhythm, perspective/distance, tonal disposition). Intentionality assessments with confidence levels. Stability region annotations. |
| `EarnednessMutator` | Earned-ness arrow creation, removal, typing | Backward-trace arrows from emotional/intellectual peaks to supporting earlier passages. Mechanism typing (sensory grounding, emotional setup, stakes establishment, character revelation, thematic preparation). Gap identification for unearned moments. |
| `NorthStarMutator` | North Star updates | Through-line map, structural roles, trajectory, distinctiveness signature, intent bridge. Typically only written during L4 crystallization; rarely updated afterward except through conversation insights. |
| `InsightMutator` | Conversation insight storage | Insight creation from L6 conversation. Categorization (confirmation, reinterpretation, new context, correction, preference, clarification, emotional reaction, resistance). Partial supersession support. Durability management (ephemeral, draft-durable, essay-durable, student-durable). Pattern detection metadata. |

**Intra-domain validation examples** (each mutator enforces these on its own writes):
- `SentenceMutator` ensures sentence indices are in range of the actual paragraph.
- `ConnectionMutator` ensures connection IDs are unique and both endpoints exist.
- `EarnednessMutator` ensures backward-trace arrows point to valid paragraph/sentence locations.
- `VoiceMapMutator` ensures shift points reference valid paragraph boundaries.
- `InsightMutator` ensures insights reference valid profile locations and that superseded insights are properly linked.

### Coordinator Class Definition

```typescript
class EssayProfileCoordinator {
  private profile: EssayProfile;
  private writeVersion: number;
  private stalenessTracker: StalenessTracker;
  private checkpointStore: CheckpointStore;
  private circuitBreaker: CircuitBreakerState;

  // ── Domain mutators ──
  private sentence: SentenceMutator;
  private paragraph: ParagraphMutator;
  private holistic: HolisticMutator;
  private connection: ConnectionMutator;
  private voiceMap: VoiceMapMutator;
  private earnedness: EarnednessMutator;
  private northStar: NorthStarMutator;
  private insight: InsightMutator;

  // ═══ LAYER-SPECIFIC ENTRY POINTS ═══
  // Each layer calls exactly ONE method. The coordinator routes internally.

  /** L1: Seed the profile from first impressions */
  applyFirstImpressions(impressions: ParagraphFirstImpression[]): void;

  /** L2: Apply structural cartography */
  applyStructuralCartography(cartography: StructuralCartography): void;

  /** L2.5: Apply connection scout leads */
  applyScoutLeads(scout: ConnectionScout): void;

  /** L3: Apply one paragraph's understanding walk output */
  applyUnderstandingWalkStep(output: UnderstandingWalkOutput): void;

  /** L3.75: Apply holistic synthesis (replaces all 7+1 holistic sections) */
  applyHolisticSynthesis(synthesis: HolisticSynthesisOutput): void;

  /** L3.5: Apply one paragraph's analysis pass output */
  applyAnalysisPassResult(result: AnalysisPassOutput): void;

  /** L4: Apply North Star crystallization */
  applyNorthStar(northStar: NorthStarOutput): void;

  /** L6: Apply a conversation insight */
  applyConversationInsight(insight: ConversationInsight): void;

  /** Edit pipeline: Apply light-touch profile updates from editing (see Section 7) */
  applyLightTouchUpdate(update: LightTouchUpdate): void;

  /** Edit pipeline: Apply edit understanding from re-analysis */
  applyEditUnderstanding(output: EditUnderstandingOutput): void;

  // ═══ QUERY METHODS (read-only) ═══

  /** Get current profile (read-only snapshot for rendering) */
  getProfile(): Readonly<EssayProfile>;

  /** Get current staleness state */
  getStalenessState(): StalenessSnapshot;

  /** Compute readiness scores */
  computeReadiness(): ReadinessScores;

  /** Run quick validation (referential integrity) */
  validateQuick(): ValidationResult;

  /** Run full validation (semantic coherence — expensive) */
  validateFull(): ValidationResult;

  /** Get staleness report for external consumers */
  getStalenessReport(): StalenessReport;

  // ═══ LIFECYCLE ═══

  /** Checkpoint to storage (calls CheckpointStore callback) */
  checkpoint(reason: CheckpointReason): void;

  /** Recompute the ProfileIndex (runs after every mutation) */
  private recomputeIndex(): void;

  /** Propagate staleness across domains (runs after mutations that touch cross-domain concerns) */
  private propagateStaleness(trigger: StalenessTrigger): void;
}
```

### Initialization

The factory function `createInitialProfile()` produces a properly shaped EssayProfile from raw essay text. No builder pattern, no complex constructor — a plain data object ready for L1 to populate.

```typescript
function createInitialProfile(input: {
  essayText: string;
  paragraphTexts: string[];
  sentenceTexts: string[][];     // sentenceTexts[paragraphIdx][sentenceIdx]
  metadata: {
    essayType: 'common_app' | 'supplement' | 'piq';
    wordCount: number;
    promptText?: string;
  };
}): EssayProfile {
  // Creates:
  // - ProfileIndex with essayLength, empty paragraphDigest stubs, all zeros
  // - Empty holistic sections (all string fields = '', all arrays = [])
  // - Paragraph map with sentence stubs (text populated, understanding/analysis = null)
  // - Empty connections store
  // - Empty voice map, earned-ness map, North Star
  // - Metadata: confidenceLevel = 'initial', lastUpdatedLayer = 0
  //
  // No LLM calls. No complex logic. Just data shaping.
}
```

The initial profile is ~2KB. Every field has a defined empty state. L1 first impressions populate the first real content. The factory function is the ONLY way to create an EssayProfile — no other code path should construct one from scratch.

### Mutation Routing: How `applyUnderstandingWalkStep` Works Internally

This is the most complex entry point — it touches 3 mutators and the coordinator's own bookkeeping.

1. **SentenceMutator**: Store `paragraphUnderstanding` as the paragraph's understanding entry. For each `priorSentenceUpdate`, replace the target sentence's understanding fields (supersession — entire `observedFunctions` array replaced, not appended).

2. **ConnectionMutator**: Add `newConnections` to `connections.all[]` with unique IDs. Add connection ref IDs to endpoint sentences (coordinated with SentenceMutator). Validate no duplicate connection IDs.

3. **HolisticMutator**: Merge `holisticEvolution` fields — only fields that are present in the output. Omitted fields are unchanged. This is the incremental holistic update during the walk; the full holistic profile comes from L3.75.

4. **Coordinator**: Recompute Profile Index (paragraph digests, connection graph, topic tags). Propagate staleness for any back-propagated sentences (their connections and earned-ness arrows may be affected). Checkpoint if at a pipeline boundary.

### Integration with Each Pipeline Layer

How the coordinator is called at each pipeline stage:

| Layer | Coordinator Method | What Happens Inside |
|-------|-------------------|-------------------|
| L1 | `applyFirstImpressions()` | SentenceMutator populates sentence stubs with first-impression understanding. ParagraphMutator sets initial paragraph roles. Index recomputed with initial tags and digests. |
| L2 | `applyStructuralCartography()` | ParagraphMutator updates paragraph roles with structural context (supersession). HolisticMutator seeds narrative strategy. Index updated with structural tags. |
| L2.5 | `applyScoutLeads()` | ConnectionMutator creates provisional connections (low-confidence leads for L3). SentenceMutator adds scout-tag refs. |
| L3 (per paragraph) | `applyUnderstandingWalkStep()` | SentenceMutator stores paragraph understanding + applies back-propagations. ConnectionMutator adds new connections. HolisticMutator merges holistic evolution. Staleness propagated for back-propagated sentences. Index recomputed. |
| L3.75 | `applyHolisticSynthesis()` | HolisticMutator replaces ALL 7+1 holistic sections (full supersession). VoiceMapMutator populated with full voice map. EarnednessMutator populated with earned-ness arrow network. This is the first time holistic sections are comprehensively populated. Index section token counts recomputed. **Checkpoint.** |
| L3.5 (per paragraph, parallel) | `applyAnalysisPassResult()` | SentenceMutator stores analysis for each sentence. ParagraphMutator stores paragraph effectiveness. HolisticMutator updates craft assessment strength signatures. Index hasStrengths/hasWeaknesses flags updated. Readiness scores recomputed after all paragraphs complete. **Checkpoint.** |
| L4 | `applyNorthStar()` | NorthStarMutator stores the five dimensions. Index finalized. **Checkpoint.** |
| L6 | `applyConversationInsight()` | InsightMutator categorizes and stores the insight. Depending on category: SentenceMutator may update inferred intents (confirmation/reinterpretation), ConnectionMutator may add/modify connections (new context), VoiceMapMutator may update intentionality (preference/correction). Staleness propagated. |
| Edit (light-touch) | `applyLightTouchUpdate()` | Per-sentence row-level updates. Text references updated. Staleness markers applied. No profile-level lock. See Section 7. |
| Edit (re-analysis) | `applyEditUnderstanding()` | Pre-mutation snapshot taken. Understanding/analysis mutations applied through normal mutator paths. Profile-level optimistic lock used. |

---

## 2. Staleness Tracking System

When the VoiceMapMutator adds a new voice shift entry at paragraph 3, the coordinator needs to know: which other sections might now be out of date? This is the staleness tracking system — a combination of a declared dependency map (Section 3), depth-bounded propagation, and per-element tracking with timestamps.

### Core Types

```typescript
interface StalenessTracker {
  /** All currently stale entries, keyed by a location string (e.g., 'p2.s3', 'holistic.voice_identity') */
  entries: Map<string, StalenessEntry>;

  /** Mark an element as stale */
  markStale(target: StalenessTarget, strength: StalenessStrength, reason: string, trigger: MutationType): void;

  /** Clear staleness for an element (after it's been refreshed) */
  clearStaleness(target: StalenessTarget): void;

  /** Clear all staleness of a given strength or weaker */
  clearByStrength(maxStrength: StalenessStrength): void;

  /** Get all strong-stale entries (for re-analysis suggestion logic) */
  getStrongStaleCount(): number;

  /** Get staleness snapshot (for Profile Router — decides what to include in LLM calls) */
  getSnapshot(): StalenessSnapshot;

  /** Get full report (for external consumers — UI, debugging) */
  getReport(): StalenessReport;
}

interface StalenessEntry {
  target: StalenessTarget;
  strength: StalenessStrength;
  reason: string;
  /** When this staleness was recorded */
  markedAt: number;
  /** Which mutation caused this staleness */
  triggeredBy: MutationType;
  /** Propagation depth: 0 = the changed element itself, 1 = direct connection, 2 = two-hop */
  depth: 0 | 1 | 2;
}

type StalenessStrength = 'strong' | 'moderate' | 'weak';

type StalenessTarget =
  | { type: 'holistic'; section: HolisticSectionType }
  | { type: 'paragraph'; index: number }
  | { type: 'sentence'; paragraph: number; sentence: number }
  | { type: 'connections'; connectionIds: string[] }
  | { type: 'north_star' }
  | { type: 'entanglements' };

type HolisticSectionType =
  | 'voice_identity'
  | 'emotional_topography'
  | 'thematic_architecture'
  | 'narrative_strategy'
  | 'character_revelation'
  | 'craft_assessment'
  | 'admissions_positioning'
  | 'cross_dimension_entanglements';

interface StalenessSnapshot {
  strongCount: number;
  moderateCount: number;
  weakCount: number;
  /** Strong-stale entries, for the Profile Router to prioritize in context assembly */
  strongEntries: StalenessEntry[];
  /** Moderate-stale entries, for inclusion when token budget allows */
  moderateEntries: StalenessEntry[];
}

interface StalenessReport {
  /** Full snapshot */
  snapshot: StalenessSnapshot;
  /** Weak entries (included for completeness, not actionable) */
  weakEntries: StalenessEntry[];
  /** Whether re-analysis is suggested (strong count >= 3) */
  reanalysisSuggested: boolean;
  /** Total staleness by domain */
  byDomain: Record<string, { strong: number; moderate: number; weak: number }>;
  /** When staleness was last cleared (by layer or checkpoint) */
  lastClearedAt: number | null;
}
```

### Staleness Depth Limits (review S1)

In well-connected essays, staleness can cascade: changing one sentence marks 3-5 connected sentences stale, each with their own connections. After 10 edits, the majority of the profile could be flagged stale — defeating the purpose of focused mode. The fix: three tiers of staleness with bounded propagation.

| Depth | Strength | Meaning | Propagation Rule |
|-------|----------|---------|-----------------|
| 0 — the changed element itself | **strong** | Must be refreshed before use in any LLM call | Always marked |
| 1 — directly connected elements | **moderate** | Include in next relevant LLM call for potential update | Marked only for elements with direct connections or dependency map entries |
| 2 — two-hop connections | **weak** | Logged for information; does not trigger refresh | Logged but NOT propagated further. No depth-3 staleness exists. |

**Re-analysis suggestions trigger on strong-staleness count**, not total staleness. When 3+ sentences have strong staleness, the system suggests re-analysis. Moderate staleness accumulates silently — the next L3.75 or L3.5 pass will pick it up naturally. Weak staleness is purely informational and never triggers any action.

**Example cascade**: Student edits P3S2. Staleness propagation:
1. **Depth 0 (strong)**: P3S2 understanding + analysis marked stale. Paragraph P3 digest marked stale.
2. **Depth 1 (moderate)**: Connections involving P3S2 (say, conn_007 linking P3S2 to P1S4). The other endpoint P1S4 marked moderate-stale. Earned-ness arrows pointing to P3S2 marked moderate-stale. Holistic sections per dependency map (emotional_topography, thematic_architecture) marked moderate-stale.
3. **Depth 2 (weak)**: Connections involving P1S4 (say, conn_003 linking P1S4 to P5S1). P5S1 marked weak-stale. **Propagation stops here.** Connections involving P5S1 are NOT traversed.

### Session Boundary Handling (review M3)

If the student leaves mid-flow-state with a high engagement threshold (many rapid edits accumulating moderate staleness) and returns the next day in reflective mode, the accumulated staleness context is wrong — the student is in a different cognitive state.

**Rules at session boundary:**
- **Reset engagement threshold**: The staleness accumulation counter (how many moderate-stale entries before suggesting re-analysis) resets to default. The student's editing rhythm restarts.
- **Preserve version record**: The actual staleness entries survive across sessions. Strong staleness from the previous session is still strong. What resets is the behavioral threshold for *suggesting* re-analysis, not the staleness data itself.
- **Session boundary detection**: Defined as 30+ minutes of inactivity. The coordinator checks `Date.now() - lastMutationTimestamp` on the next mutation. If > 30 minutes, reset the engagement threshold.

```typescript
interface SessionBoundaryState {
  /** Timestamp of the last mutation */
  lastMutationAt: number;
  /** Current engagement threshold — number of strong-stale entries before suggesting re-analysis */
  reanalysisThreshold: number;
  /** Default threshold (restored at session boundary) */
  defaultThreshold: 3;
  /** Whether the current session is the first since profile creation */
  isFirstSession: boolean;
}
```

---

## 3. Dependency Map (Cross-Domain Propagation)

The dependency map is a **static configuration object**, not a dynamic graph. It encodes architectural knowledge about the EssayProfile's internal relationships. When a new holistic section is added, one entry in the map covers it. The coordinator reads the map after every mutation and marks targets as stale — it never computes staleness dynamically.

### Types

```typescript
/**
 * Declares which mutations affect which profile sections.
 * The coordinator reads this to propagate staleness after every mutation.
 *
 * Key: the type of mutation that occurred.
 * Value: the sections that may now be stale, with staleness strength.
 */
type StalenessDependencyMap = Record<MutationType, StalenessEffect[]>;

type MutationType =
  | 'sentence_understanding_updated'
  | 'sentence_analysis_updated'
  | 'paragraph_role_updated'
  | 'holistic_section_updated'
  | 'connection_added'
  | 'connection_removed'
  | 'voice_shift_added'
  | 'voice_shift_removed'
  | 'voice_intentionality_updated'
  | 'earnedness_arrow_added'
  | 'earnedness_arrow_removed'
  | 'north_star_updated'
  | 'conversation_insight_applied';

interface StalenessEffect {
  /** Which section is affected */
  target: StalenessTarget;
  /** How strongly this mutation affects the target */
  strength: StalenessStrength;
  /** Human-readable reason (for debugging and logging) */
  reason: string;
}
```

### Dependency Declarations

The complete map. Each row reads: "When [mutation] occurs, mark [target] as [strength]-stale because [reason]."

**Voice Map changes affect:**

| Mutation | Stale Target | Strength | Reason |
|----------|-------------|----------|--------|
| Voice shift added at P(n) | `emotional_topography` | moderate | Voice shift may coincide with emotional transition |
| | `thematic_architecture` | moderate | Voice shift may carry thematic weight |
| | `craft_assessment` | moderate | New craft pattern detected |
| | `cross_dimension_entanglements` | strong | Voice-theme or voice-emotion entanglement may exist |
| Voice shift removed | Same targets | moderate | Entanglement that depended on this shift may be invalid |
| Voice intentionality updated | `admissions_positioning` | weak | Intentional voice choices affect memorability assessment |

**Sentence understanding changes affect:**

| Mutation | Stale Target | Strength | Reason |
|----------|-------------|----------|--------|
| Sentence understanding updated (P(n)S(m)) | Paragraph P(n) digest | strong | Paragraph summary needs refresh |
| | Connections involving P(n)S(m) | moderate | Connection descriptions may need updating |
| | Earned-ness arrows pointing to P(n)S(m) | moderate | Arrow mechanisms may have changed |
| | `voice_identity` | weak | Voice signature evidence may have shifted |

**Connection changes affect:**

| Mutation | Stale Target | Strength | Reason |
|----------|-------------|----------|--------|
| Connection added (P(a)S(b) to P(c)S(d)) | `narrative_strategy` | moderate | New connection may reveal arc structure |
| | `thematic_architecture` | moderate | Connection may carry thematic thread |
| | `cross_dimension_entanglements` | moderate | New entanglement possible between connected elements |
| Connection removed | Same targets | moderate | Structural understanding may need revision |

**Earned-ness arrow changes affect:**

| Mutation | Stale Target | Strength | Reason |
|----------|-------------|----------|--------|
| Earned-ness arrow added (P(a) earns P(b)) | `character_revelation` | moderate | Earning mechanism may reveal character values |
| | `admissions_positioning` | moderate | Earned moments affect memorability assessment |
| | `emotional_topography` | moderate | Earning mechanism is part of emotional progression |
| Earned-ness arrow removed | Same targets | moderate | Emotional progression understanding may need revision |

**North Star changes affect:**

| Mutation | Stale Target | Strength | Reason |
|----------|-------------|----------|--------|
| North Star updated | ALL holistic sections | moderate | North Star reframes how every dimension is interpreted |
| | `cross_dimension_entanglements` | strong | Through-line reinterpretation may invalidate existing entanglements |

**Holistic section changes affect:**

| Mutation | Stale Target | Strength | Reason |
|----------|-------------|----------|--------|
| Holistic section updated | `cross_dimension_entanglements` | moderate | Section change may create or invalidate entanglements |
| | `admissions_positioning` | weak | Positioning synthesis draws from all holistic sections |

**Conversation insight applied:**

| Mutation | Stale Target | Strength | Reason |
|----------|-------------|----------|--------|
| Conversation insight (reinterpretation) | Affected sentences | strong | Student explicitly corrected understanding |
| | Related holistic sections | moderate | Understanding shift may cascade to holistic level |
| Conversation insight (confirmation) | Affected sentences | — | No staleness — confidence boosted, nothing invalidated |
| Conversation insight (new context) | Related holistic sections | moderate | New information may enrich holistic understanding |

### How the Coordinator Uses the Map

After every mutation, the coordinator:

1. Identifies the `MutationType` from the mutator's return value.
2. Looks up the mutation type in the dependency map.
3. For each `StalenessEffect`, calls `stalenessTracker.markStale()` with the target, strength, and reason.
4. The staleness tracker enforces depth limits: if the target is already stale at equal or greater strength, the new marking is a no-op. If the target is stale at weaker strength, it upgrades.
5. The coordinator never computes "what might be affected" dynamically — it reads the static map. This makes staleness propagation deterministic and testable.

**Verification note**: The dependency map in `dependencyMap.ts` MUST contain every row from the tables above. When adding a new mutation type or holistic section, add corresponding staleness entries. Cross-reference every table row against the code implementation to ensure completeness.

---

## 4. Validation (Two Tiers)

Validation catches internal inconsistencies without blocking mutations. Both tiers return results that are logged and available for review — neither throws exceptions nor prevents writes. They exist to detect bugs in mutators (Tier 1) and prompt quality issues (Tier 2).

### Tier 1 — Quick Validation (after every mutation, <1ms target)

Referential integrity checks. These are fast because they traverse known indices, not content.

**Checks:**
- **Index bounds**: All paragraph/sentence indices in understanding, analysis, connections, voice map, and earned-ness map are within range of the actual essay structure.
- **Connection refs**: Every `connectionRef` ID in every sentence points to an existing entry in `connections.all[]`.
- **Connection endpoints**: Every connection's `from` and `to` indices point to existing paragraphs/sentences.
- **Earned-ness arrows**: Every arrow's source and target point to valid paragraph/sentence locations.
- **Voice shift entries**: Every entry references a valid paragraph boundary.
- **No orphaned refs**: No sentence carries a `connectionRef` to a deleted connection.
- **Index consistency**: Paragraph digests array length matches actual paragraph count. Token counts are non-negative.

### Tier 2 — Full Validation (at checkpoints — after L3, after L3.75, after L3.5)

Semantic coherence checks. These read content and cross-reference between domains. More expensive than Tier 1 but still no LLM calls — these are structural cross-checks.

**Checks:**
- **Voice-emotion alignment**: If the voice map records an "intentional shift at P3," does the emotional topography record an emotional transition near P3? Misalignment is a warning, not an error — the shift could be structural rather than emotional.
- **Earned-ness / connection alignment**: If the earned-ness map claims "P1 earns P4," does the connection graph record a P1-to-P4 link? Missing link means the earned-ness map sees a relationship the connection graph missed (or vice versa) — a signal for the next synthesis pass.
- **Evaluative language in understanding**: Scan understanding fields for evaluative words ("effectively," "weakly," "successfully"). Their presence suggests L3 leaked evaluation into understanding — a contamination signal for prompt tuning.
- **Orphaned connection refs**: Sentences with `connectionRefs` pointing to connections where neither endpoint is that sentence.
- **North Star / holistic coherence**: If the North Star's structural roles map labels P4 as "the fulcrum," does narrative strategy's `turningPoint` agree?
- **Profile Index completeness**: All tags present in sentence/paragraph data are reflected in the index. All connections in `connections.all[]` appear in the `connectionGraph`. No stale digests (paragraph digest text roughly matches current understanding).

### Types

```typescript
interface ValidationResult {
  /** Whether all checks passed */
  valid: boolean;
  /** Individual check results */
  checks: ValidationCheck[];
  /** Summary counts */
  summary: {
    passed: number;
    warnings: number;    // Semantic misalignments (Tier 2)
    errors: number;      // Referential integrity violations (Tier 1)
  };
  /** Timestamp */
  validatedAt: number;
  /** Which tier was run */
  tier: 'quick' | 'full';
}

interface ValidationCheck {
  /** Machine-readable check name */
  name: string;          // 'connection_refs_valid', 'voice_emotion_alignment', 'index_completeness'
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  details?: string;      // Human-readable explanation when failed
  /** Where the issue was found */
  locations?: Array<{ paragraph: number; sentence?: number }>;
}
```

**Error handling philosophy**: Quick validation errors are logged as warnings — they indicate a bug in a mutator that should be investigated but should not block the pipeline. Full validation warnings are logged as informational — they indicate potential prompt quality issues that may self-correct in subsequent layers. Neither tier blocks the pipeline or prevents writes.

---

## 5. Readiness Scoring

Four functions, each returns 0-100. Together they compose into the `ReadinessScores` object that feeds improvement phase detection (`detectImprovementPhase()`). These scores are a heuristic proxy for essay quality — they exist to determine the feedback zoom level, not to be shown to students.

### Types

```typescript
interface ReadinessScores {
  essay: number;          // 0-100: thesis + arc + voice + holistic population
  paragraph: number;      // 0-100: paragraph effectiveness distribution
  sentence: number;       // 0-100: sentence effectiveness + problem-free ratio
  word: number;           // 0-100: word-level weakness absence
}
```

### `essayReadiness(profile: EssayProfile): number`

Thesis + arc + voice + holistic population:

| Component | Points | How Scored |
|-----------|--------|-----------|
| Thesis present and confident | 0-30 | `thesisConfidence >= 0.8` = 30, `>= 0.5` = 20, `>= 0.3` = 10, absent = 0 |
| Arc coherent | 0-25 | Narrative strategy identified (10) + turning point exists (10) + arc momentum not 'stalling' (5) |
| Voice map populated with stability regions | 0-20 | Voice signature present (10) + at least one stability region identified (5) + intentionality assessed for all shifts (5) |
| Holistic sections populated | 0-25 | 3-4 points per non-empty holistic section (7 sections, some worth more) |
| Critical essay-level weaknesses | -12 each, max -25 | Red flags in admissions positioning, no coherent thesis after L3, voice entirely inconsistent |

### `paragraphReadiness(profile: EssayProfile): number`

Paragraph effectiveness distribution:

- % of paragraphs with `effectiveness >= 60` maps to 0-70 points (linear)
- Bonus: % of paragraphs with `effectiveness >= 80` maps to 0-30 additional points
- Penalty: each paragraph with `effectiveness < 40` subtracts 5 points (floor at 0)

### `sentenceReadiness(profile: EssayProfile): number`

Sentence health:

- Problem-free ratio (sentences where `isProblem = false`) contributes 70% weight
- Average sentence effectiveness contributes 30% weight
- Formula: `(problemFreeRatio * 70) + (avgEffectiveness / 100 * 30)`

### `wordReadiness(profile: EssayProfile): number`

Word-level weakness absence:

- % of sentences with no word-level weaknesses (no entries in `weaknesses` that reference word/phrase-level issues) x 100

### Calibration Targets

These are starting estimates. The first 20 real essays through the pipeline will calibrate whether the boundaries between Foundation/Architecture/Craft/Polish/Distinction land where they should.

| Essay Quality | Essay | Paragraph | Sentence | Word | Expected Phase |
|--------------|-------|-----------|----------|------|----------------|
| Strong essay, first analysis | ~80 | ~75 | ~70 | ~60 | Craft or Polish |
| Average essay | ~60 | ~50 | ~50 | ~45 | Architecture |
| Weak essay | ~25 | ~40 | ~35 | ~30 | Foundation |
| Near-final polish | ~90 | ~85 | ~80 | ~75 | Polish or Distinction |

---

## 6. Circuit Breaker (review S10)

If the pipeline crashes repeatedly at the same point — malformed essay text causing unparseable Sonnet output, a sentence that consistently produces invalid JSON, a connection that breaks referential integrity on every retry — the system must fail gracefully rather than loop forever.

### Rules

1. **Max 3 retries per checkpoint position.** Each retry restores from the last checkpoint and re-runs the failed step.
2. **After 3 failures at the same point**, the coordinator marks the analysis as `FAILED` with structured error details.
3. **Alert the student**: "We're having trouble analyzing this section of your essay. Our team has been notified."
4. **The walk continues.** If the walk crashed on paragraph 4, paragraphs 1-3's understanding is complete and usable. P5 can still proceed — it will have a gap in P4's understanding, but the walk output for P5 will still add value. P4 keeps L1/L2 understanding with a `walkSkipped: true` flag.
5. **Failed paragraphs preserve what exists.** L1 first impressions and L2 structural cartography are already stored. The failure is only in L3 deep understanding (or L3.5 analysis). The paragraph is not blank — it has shallow understanding.
6. **Manual retry available** after a cooldown period (configurable, default 5 minutes). The cooldown prevents automated retry loops and gives transient API issues time to resolve.

### Types

```typescript
interface CircuitBreakerState {
  /** Number of retries at current checkpoint position */
  retryCount: number;
  /** Maximum retries before tripping */
  maxRetries: 3;
  /** The checkpoint position where failures are occurring */
  failurePoint: string;         // e.g., 'l3_walk_paragraph_4', 'l3_5_analysis_paragraph_2'
  /** Error details from each attempt */
  attempts: Array<{
    timestamp: number;
    error: string;
    /** What the LLM returned (if anything) — for debugging */
    rawOutput?: string;
  }>;
  /** Whether the circuit breaker has tripped */
  tripped: boolean;
  /** When the cooldown expires (null if not tripped) */
  cooldownExpiresAt: number | null;
}

/** Marker on paragraphs that failed during the L3 walk */
interface WalkSkippedMarker {
  /** The paragraph was not deeply understood due to pipeline failure */
  walkSkipped: true;
  /** Which layer failed */
  failedAt: 'l3_understanding' | 'l3_5_analysis';
  /** Error summary */
  errorSummary: string;
  /** Timestamp of failure */
  failedAt_timestamp: number;
  /** Whether manual retry has been requested */
  retryRequested: boolean;
}
```

**Circuit breaker state is persisted with the checkpoint** so that a process restart does not reset the retry count. If the orchestrator restarts and loads a checkpoint with `retryCount: 2`, the next failure trips the breaker rather than starting a fresh count.

---

## 7. Light-Touch Update Pathway

When the student makes edits through the Conversational Edit Workshop (Pathway 1), many profile adjustments are mechanical and do not require LLM intelligence or the full mutation pipeline. These "light-touch" updates bypass the profile-level optimistic lock entirely, using per-sentence row-level updates instead (review M8). This prevents two browser tabs editing different paragraphs from conflicting unnecessarily.

### What Qualifies as Light-Touch

Light-touch updates are strictly mechanical. They never involve analytical judgment.

| Update Type | What Happens | Why No LLM Needed |
|-------------|-------------|-------------------|
| **Text reference updates** | When a sentence's text changes, update the stored `text` field on the sentence entry | The new text is provided by the student; the system is recording, not interpreting |
| **Structural bookkeeping** | Sentence counts per paragraph, sentence index boundaries, paragraph boundary markers | These are derived from the new essay text structure, not from understanding |
| **Index remapping** | When paragraphs are inserted/deleted/reordered, remap all paragraph and sentence indices in understanding, analysis, connections, voice map, earned-ness arrows | Mechanical index shift — old P3 becomes new P4, all references updated |
| **Staleness marker application** | Mark affected sentences, paragraphs, and holistic sections as stale per the dependency map | Staleness propagation is deterministic from the dependency map |
| **Inferred intent updates (from conversation)** | When the student explicitly states intent in conversation ("I meant this sentence to be ironic"), update `inferredIntents` | The student is the authority on their own intent — this is recording, not inferring |

### What Does NOT Qualify as Light-Touch

Any update that involves understanding or evaluation must go through the full coordinator with the optimistic write lock:

- New sentence understanding (what does this sentence do in the essay?)
- Analysis updates (how well does this sentence work?)
- Connection creation or removal (requires understanding of what connects and why)
- Voice map changes (requires reading the actual voice characteristics)
- Earned-ness arrow changes (requires understanding narrative mechanisms)
- Holistic section updates (requires synthesis across the full profile)

### Types

```typescript
interface LightTouchUpdate {
  /** Which type of light-touch update */
  type: 'text_reference' | 'structural_bookkeeping' | 'index_remap' | 'staleness_application' | 'inferred_intent';

  /** For text_reference: the sentences whose text changed */
  textUpdates?: Array<{
    paragraph: number;
    sentence: number;
    newText: string;
  }>;

  /** For structural_bookkeeping: updated paragraph/sentence counts */
  structuralUpdates?: {
    paragraphCount: number;
    sentenceCounts: number[];  // sentenceCounts[paragraphIdx]
  };

  /** For index_remap: the mapping from old indices to new indices */
  indexRemap?: {
    paragraphMap: Map<number, number>;    // oldIdx -> newIdx
    /** Paragraphs that were inserted (have no old index) */
    insertedParagraphs: number[];
    /** Paragraphs that were deleted (have no new index) */
    deletedParagraphs: number[];
  };

  /** For staleness_application: explicit staleness markers to apply */
  stalenessMarkers?: Array<{
    target: StalenessTarget;
    strength: StalenessStrength;
    reason: string;
  }>;

  /** For inferred_intent: student-stated intent updates */
  intentUpdates?: Array<{
    paragraph: number;
    sentence: number;
    /** The student's stated intent — replaces inferredIntents array */
    intents: ObservationEntry[];
    /** Source: the conversation turn where the student stated this */
    source: string;
  }>;
}
```

### Concurrency Model

Light-touch updates use per-sentence row-level updates on `essay_sentence_analyses` in the database. They do NOT touch `essay_profiles.write_version` and therefore do NOT conflict with concurrent coaching or analysis operations. Only the Profile Manager's analytical mutations (understanding/analysis updates that change the profile index) use the optimistic lock.

This means:
- Two browser tabs editing different paragraphs through Pathway 1 will not conflict.
- A coaching conversation (L6) can proceed while light-touch updates are being applied to recently edited sentences.
- If a re-analysis (comprehensive or focused) starts, it acquires the optimistic lock. Light-touch updates continue on individual sentences without blocking. If the re-analysis later touches those same sentences, the re-analysis output supersedes the light-touch updates.

### Pre-Mutation Snapshots for Escalation

When the Edit Understanding pipeline determines that a focused (light-touch) analysis is appropriate, the coordinator snapshots the affected fields before mutation. If the focused analysis later discovers the edit's blast radius is larger than expected and escalates to comprehensive, the snapshot enables cheap rollback.

```typescript
interface PreMutationSnapshot {
  /** Which fields were snapshotted */
  scope: Array<{
    paragraph: number;
    sentence?: number;
    fields: string[];           // ['observedFunctions', 'inferredIntents', ...]
  }>;
  /** Deep copies of the original values */
  values: Map<string, unknown>;   // key = 'p2.s3.observedFunctions', value = original array
  /** Timestamp for staleness comparison */
  takenAt: number;
}
```

**When snapshots are NOT taken**: During the initial pipeline (L1 through L5), there is no escalation scenario — the layers run in sequence and each sees the complete prior state. Snapshots only apply to post-initial-analysis edits through the Edit Understanding pipeline.

---

## 8. Profile Manager API

The complete public interface. Each method maps to exactly one layer or pathway. Internal routing to domain mutators is an implementation detail — callers never interact with mutators directly.

```typescript
class EssayProfileCoordinator {

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a coordinator for a new essay (wraps createInitialProfile).
   * Used by the orchestrator at pipeline start.
   */
  static createNew(input: {
    essayText: string;
    paragraphTexts: string[];
    sentenceTexts: string[][];
    metadata: {
      essayType: 'common_app' | 'supplement' | 'piq';
      wordCount: number;
      promptText?: string;
    };
    checkpointStore: CheckpointStore;
  }): EssayProfileCoordinator;

  /**
   * Create a coordinator from a persisted profile (resume from checkpoint).
   * Used by the orchestrator when resuming a pipeline or starting a new session.
   */
  static fromCheckpoint(
    profile: EssayProfile,
    checkpointStore: CheckpointStore,
  ): EssayProfileCoordinator;

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER-SPECIFIC MUTATION METHODS
  // Each layer calls exactly ONE method. The coordinator routes internally.
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * L1: Seed the profile from Haiku first impressions (parallel per-paragraph).
   * Produces: ParagraphFirstImpression[] from L1 Haiku calls.
   * Mutators: SentenceMutator (sentence stubs), ParagraphMutator (initial roles).
   */
  applyFirstImpressions(impressions: ParagraphFirstImpression[]): void;

  /**
   * L2: Apply structural cartography from Sonnet bird's-eye analysis.
   * Produces: StructuralCartography from L2 Sonnet call.
   * Mutators: ParagraphMutator (structural roles, supersession), HolisticMutator (narrative strategy seed).
   */
  applyStructuralCartography(cartography: StructuralCartography): void;

  /**
   * L2.5: Apply connection scout leads from Haiku parallel scan.
   * Produces: ConnectionScout from L2.5 Haiku call.
   * Mutators: ConnectionMutator (provisional connections), SentenceMutator (scout-tag refs).
   */
  applyScoutLeads(scout: ConnectionScout): void;

  /**
   * L3: Apply one paragraph's understanding walk output.
   * Produces: UnderstandingWalkOutput from L3 Sonnet call (one per paragraph, sequential).
   * Mutators: SentenceMutator (understanding + back-propagation), ConnectionMutator (new connections),
   *           HolisticMutator (incremental holistic evolution).
   * Triggers: Staleness propagation for back-propagated sentences. Index recomputed.
   */
  applyUnderstandingWalkStep(output: UnderstandingWalkOutput): void;

  /**
   * L3.75: Apply holistic synthesis — replaces ALL 7+1 holistic sections.
   * Produces: HolisticSynthesisOutput from L3.75 Sonnet call.
   * Mutators: HolisticMutator (full supersession), VoiceMapMutator (voice map),
   *           EarnednessMutator (earned-ness arrow network).
   * Triggers: Checkpoint (after_l3_75). Index section token counts recomputed.
   */
  applyHolisticSynthesis(synthesis: HolisticSynthesisOutput): void;

  /**
   * L3.5: Apply one paragraph's analysis pass output.
   * Produces: AnalysisPassOutput from L3.5 Sonnet call (parallel per-paragraph).
   * Mutators: SentenceMutator (analysis per sentence), ParagraphMutator (effectiveness),
   *           HolisticMutator (craft assessment strength signatures).
   * Triggers: Index hasStrengths/hasWeaknesses flags updated. Readiness recomputed
   *           after all paragraphs complete. Checkpoint (after_l3_5).
   */
  applyAnalysisPassResult(result: AnalysisPassOutput): void;

  /**
   * L4: Apply North Star crystallization.
   * Produces: NorthStarOutput from L4 Sonnet call.
   * Mutators: NorthStarMutator (five dimensions: through-line map, structural roles,
   *           trajectory, distinctiveness signature, intent bridge).
   * Triggers: Checkpoint (after_l4). Index finalized.
   */
  applyNorthStar(northStar: NorthStarOutput): void;

  /**
   * L6: Apply a conversation insight from coaching interaction.
   * Produces: ConversationInsight from L6 insight extraction.
   * Mutators: InsightMutator (always). Conditionally: SentenceMutator (confirmation/reinterpretation),
   *           ConnectionMutator (new context), VoiceMapMutator (preference/correction).
   * Triggers: Staleness propagated per insight category.
   */
  applyConversationInsight(insight: ConversationInsight): void;

  /**
   * Edit pipeline: Apply light-touch profile updates from Pathway 1 editing.
   * Produces: LightTouchUpdate from the Edit Understanding pipeline's mechanical processing.
   * Mutators: SentenceMutator (text refs, intent), ParagraphMutator (structural bookkeeping).
   * NOTE: Uses per-sentence row-level updates. Does NOT acquire the profile-level optimistic lock.
   * See Section 7 for full specification.
   */
  applyLightTouchUpdate(update: LightTouchUpdate): void;

  /**
   * Edit pipeline: Apply edit understanding from re-analysis (comprehensive or focused).
   * Produces: EditUnderstandingOutput from the Edit Understanding pipeline's Sonnet call.
   * Mutators: Routes to appropriate mutators based on the edit's scope and type.
   * NOTE: Takes pre-mutation snapshot for potential escalation rollback.
   *        Uses the profile-level optimistic lock.
   */
  applyEditUnderstanding(output: EditUnderstandingOutput): void;

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY METHODS (read-only — no mutations, no side effects)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get current profile as a read-only snapshot.
   * Used by the Profile Router for rendering into LLM prompts.
   */
  getProfile(): Readonly<EssayProfile>;

  /**
   * Get current staleness state.
   * Used by the Profile Router to decide what to include in LLM calls,
   * and by the Edit Understanding pipeline for mode selection.
   */
  getStalenessState(): StalenessSnapshot;

  /**
   * Get full staleness report with domain breakdown.
   * Used by the UI to show staleness indicators and re-analysis suggestions.
   */
  getStalenessReport(): StalenessReport;

  /**
   * Compute readiness scores across all four granularity levels.
   * Used by detectImprovementPhase() to determine feedback zoom level.
   */
  computeReadiness(): ReadinessScores;

  /**
   * Run quick validation — referential integrity checks only.
   * Target: <1ms. Run after every mutation.
   */
  validateQuick(): ValidationResult;

  /**
   * Run full validation — semantic coherence checks.
   * More expensive. Run at checkpoints (after L3, L3.75, L3.5).
   */
  validateFull(): ValidationResult;

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Checkpoint to durable storage via the CheckpointStore callback.
   * Called at pipeline boundaries. Runs full validation. Persists circuit breaker state.
   */
  checkpoint(reason: CheckpointReason): Promise<void>;
}
```

### Checkpoint Types

```typescript
interface CheckpointStore {
  /** Save the current profile state. Called by the coordinator at pipeline boundaries. */
  save(profile: EssayProfile, metadata: CheckpointMetadata): Promise<void>;

  /** Load a previously saved profile. Called by the orchestrator before resuming. */
  load(essayId: string): Promise<EssayProfile | null>;
}

interface CheckpointMetadata {
  essayId: string;
  /** Why this checkpoint was taken */
  reason: CheckpointReason;
  /** Which pipeline layer just completed */
  completedLayer: string;
  /** Write version for optimistic concurrency */
  writeVersion: number;
  /** Current staleness state */
  stalenessSnapshot: StalenessSnapshot;
  /** Validation result from quick validation */
  validationResult: ValidationResult;
  /** Cost accumulated so far */
  costSoFar: number;
}

type CheckpointReason =
  | 'after_l1_l2'          // L1 + L2 complete — structural foundation established
  | 'after_l3'             // L3 understanding walk complete — deep understanding done
  | 'after_l3_75'          // L3.75 holistic synthesis complete — full understanding
  | 'after_l3_5'           // L3.5 analysis pass complete — evaluation done
  | 'after_l4'             // L4 North Star crystallization complete
  | 'after_l5'             // L5 feedback generation complete — full pipeline done
  | 'conversation_save'    // Periodic save during L6 conversation
  | 'before_reanalysis'    // Snapshot before re-analysis (rollback point)
  | 'circuit_breaker';     // Save before marking analysis as failed
```

---

## Profile Manager Boundary (CRITICAL)

This boundary must be maintained strictly as the system grows. The Profile Manager is the most-touched module in the system — every layer interacts with it. If synthesis logic, rendering logic, or persistence logic creeps in, the module becomes untestable and unmaintainable.

**The Profile Manager OWNS:**

| Responsibility | What This Means |
|---------------|-----------------|
| **Mutations** | Every write to the EssayProfile goes through the coordinator. No layer modifies the profile directly. |
| **Staleness tracking** | Cross-domain staleness propagation via the declared dependency map. Marks sections as stale, clears staleness after refresh. |
| **Referential integrity** | Connection refs point to existing connections. Earned-ness arrows point to valid locations. Voice shifts reference valid paragraphs. Sentence indices are in range. |
| **Index recomputation** | ProfileIndex always reflects current state. Cheap fields after every mutation, expensive fields at checkpoints. |
| **Checkpointing** | Calls the CheckpointStore callback at pipeline boundaries. Manages circuit breaker state. |
| **Readiness scoring** | Four readiness functions that feed improvement phase detection. |
| **Pre-mutation snapshots** | For focused-mode rollback when escalation is needed. |

**The Profile Manager does NOT own:**

| Not Its Job | Who Owns It | Why |
|-------------|-------------|-----|
| **Synthesis** (L3.75) | Holistic synthesis layer | The manager stores synthesis results, but the LLM decides what the holistic sections say |
| **Evaluation** (L3.5) | Analysis pass layer | The manager stores analysis results, but the LLM decides effectiveness scores and strengths/weaknesses |
| **Crystallization** (L4) | North Star crystallization layer | The manager stores the North Star, but the LLM produces it |
| **Storage / persistence** | Pipeline orchestrator | The manager calls a CheckpointStore callback. It does not know about Supabase, tables, or SQL. |
| **Rendering** | Profile Router | The manager provides the profile data. The router decides how to render it for LLM prompts. |
| **Mode selection** | Edit Understanding pipeline | The manager provides staleness state and readiness scores. The pipeline decides comprehensive vs focused. |
| **Feedback generation** | L5 / L6 layers | Feedback is ephemeral. The manager never stores it. |

---

### Conversation Insight Cascade: How Student Input Propagates Through the Profile

When a student provides input during L6 coaching, the system classifies it into one of 8 insight categories and triggers a **cascade** of profile mutations:

| Category | Mutators Dispatched | Staleness Effect | Example |
|----------|-------------------|------------------|---------|
| confirmation | None | None | "Yes, that's exactly what I meant" |
| reinterpretation | SentenceMutator (updateInferredIntents) | sentence_understanding_updated | "I wasn't showing sadness — I was showing numbness" |
| correction | SentenceMutator (correctInferredIntent) | sentence_understanding_updated | "That's wrong — I didn't mean it ironically" |
| new_context | SentenceMutator (enrichNarrativeContext) | sentence_understanding_updated | "My dad was deployed when this happened" |
| preference | VoiceMapMutator (markIntentional) | voice_intentionality_updated | "I want to keep that informal voice" |
| clarification | SentenceMutator (clarifyObservation) | None (refines without changing meaning) | "When I said 'they', I meant my parents" |
| emotional_reaction | HolisticMutator (enrichEmotionalTopography) | holistic_section_updated | "Reading this back makes me feel anxious" |
| resistance | None | None | "I disagree — I think the metaphor works" |

**Why resistance doesn't mutate**: The student might be wrong about their own essay (a common pattern in writing workshops). The system notes the disagreement and coaching addresses it through dialogue, not by modifying the profile to match the student's self-assessment.

**Why confirmation matters**: Even though it doesn't mutate, a stored confirmation boosts confidence scores in the readiness calculation and may affect improvement phase detection. The insight record itself IS the confirmation.

**Cascade flow**: L6 classifies insight (Haiku) → Coordinator stores via InsightMutator → Coordinator dispatches to domain mutators based on category → Staleness propagates from the mechanical mutations → Index recomputed

### Circuit Breaker Behavior

The circuit breaker prevents infinite retry loops on persistent failures. It is checked at the START of every layer dispatch method (applyFirstImpressions, applyUnderstandingWalkStep, applyHolisticSynthesis, etc.).

**Mechanics:**
- After `maxRetries` (3) failures at the same pipeline position, the breaker **trips**
- Once tripped, all mutations are blocked for a **5-minute cooldown**
- All completed work up to the failure point is preserved at the last checkpoint
- After cooldown expires, the breaker resets and allows retries
- A successful mutation resets the retry counter (allowing recovery from transient errors)

**Three methods:**
- `checkCircuitBreaker(position)` — called at the start of every layer method; throws if tripped and in cooldown
- `recordFailure(position, error)` — called on errors; increments retry count, trips if maxRetries reached
- `recordSuccess()` — called on success; resets retry counter if there were prior failures

---

## File Organization

```
src/services/essayIntelligence/profile/
├── coordinator.ts              // EssayProfileCoordinator class (~300 lines)
├── factory.ts                  // createInitialProfile() (~80 lines)
├── staleness.ts                // StalenessTracker + StalenessDependencyMap (~200 lines)
├── validation.ts               // Quick + full validation (~250 lines)
├── readiness.ts                // Four readiness scoring functions (~150 lines)
├── circuitBreaker.ts           // Circuit breaker state management (~80 lines)
├── types.ts                    // All Profile Manager types (~250 lines)
└── mutators/
    ├── sentenceMutator.ts      // Sentence understanding + analysis mutations (~200 lines)
    ├── paragraphMutator.ts     // Paragraph-level mutations (~100 lines)
    ├── holisticMutator.ts      // All 7+1 holistic sections (~180 lines)
    ├── connectionMutator.ts    // Connection CRUD + referential integrity (~150 lines)
    ├── voiceMapMutator.ts      // Voice shift entries + intentionality (~120 lines)
    ├── earnednessMutator.ts    // Earned-ness arrows + backward traces (~130 lines)
    ├── northStarMutator.ts     // North Star five dimensions (~80 lines)
    └── insightMutator.ts       // Conversation insights + supersession (~120 lines)
```

Total: ~2090 lines across 15 files. The coordinator is the largest single file but stays under 300 lines because domain logic lives in the mutators. Each mutator is focused enough to be fully comprehensible in a single reading.


---

## Database Architecture


Five principles govern every table boundary, column choice, and index decision.

**Principle 1 — One entity, one table.** Every distinct concept gets dedicated storage. Coaching turns updating one sentence shouldn't require loading a 300KB blob. Each concept with its own lifecycle, access pattern, or update cadence earns its own table.

**Principle 2 — JSONB where structure varies, columns where queries need speed.** If we will ever write `WHERE column = ...` or `ORDER BY column`, it is a scalar column. If we only read it as part of loading an entity, it is JSONB. A sentence's `effectiveness` score is scalar (we query "which sentences need work"). The `observedFunctions` array is JSONB (loaded whole, never filtered by individual observations).

**Principle 3 — The profile is assembled, not fetched.** The EssayProfile is a composite assembled from multiple tables by the Profile Router, which decides which tables to query per task. A coaching turn about voice loads the voice section + tagged sentences. Not everything. A full L5 pass loads everything. The schema makes selective loading natural.

**Principle 4 — Write frequency drives table boundaries.** The profile index (updated every layer) is separate from paragraph profiles (updated once per walk). Conversation insights (every coaching turn) are separate from analysis results (once per pass). Two concurrent processes never contend for the same row.

**Principle 5 — Hard ownership.** Every row has a `user_id` (TEXT, Clerk format) with RLS. Service role bypasses for pipeline operations. No table accessible without valid user context or service role.

---

## 6 Domain Modules (~19 Tables)

The schema organizes into 6 domain modules. Each module owns a cluster of tables and can be queried independently. Cross-module joins happen only for assembly (building the full profile) and portfolio aggregation.

| Module | Purpose | Tables |
|--------|---------|--------|
| **Essay Core** | Text, versions, metadata (existing) | `essays`, `essay_revision_history` |
| **Essay Profile** | Multi-resolution understanding map | `essay_profiles`, `essay_holistic_sections`, `essay_paragraph_profiles`, `essay_sentence_analyses`, `essay_connections`, `essay_north_star` |
| **Analysis Lifecycle** | Pipeline audit trail and crash recovery | `analysis_runs`, `analysis_checkpoints` |
| **Conversation & Coaching** | L6 messages, insights, student-durable knowledge | `coaching_sessions`, `coaching_messages`, `conversation_insights`, `student_insights` |
| **Edit Tracking & Version Management** | Change log and rollback | `essay_version_records` |
| **Portfolio Intelligence** | Cross-essay patterns and strategy | `portfolio_essay_index`, `portfolio_cross_patterns` |

Additionally, two supporting structures exist outside the domain modules: `analysis_locks` and `essay_version_snapshots`. Total: **19 tables** (2 existing + 17 new).

---

## Table Specifications

### Module 1: Essay Core (existing)

These tables already exist. The Essay Intelligence System reads from them but does not own them.

**`essays`** — The essay text, type classification, and metadata. One row per essay. The cascade root for all essay-scoped data.

**`essay_revision_history`** — Full text snapshots at each save point. Managed by the existing essay CRUD layer.

---

### Module 2: Essay Profile

The heart of the system. The multi-resolution understanding map decomposed into specialized tables that can be loaded independently.

#### `essay_profiles` — Central Anchor

**Purpose**: One row per essay. The hub that everything else foreign-keys to. Stores the profile index (the always-loaded compact table of contents), overall metadata, and concurrency control fields.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | Standard primary key |
| `essay_id` | UUID, FK → `essays`, UNIQUE | One profile per essay |
| `user_id` | TEXT | Clerk user ID, RLS anchor |
| `profile_index` | JSONB (~200-300 tokens, ~2-4KB) | Paragraph digests, topic tags, connection graph, section token counts, active concerns, improvement phase |
| `confidence_level` | TEXT (enum: initial/developing/deep/comprehensive) | Scalar for fast mode-selection queries |
| `improvement_phase` | JSONB | Current improvement phase and readiness scores |
| `write_version` | INTEGER | Optimistic concurrency lock, incremented on every update |
| `last_analysis_at` | TIMESTAMPTZ, nullable | When last analysis completed |
| `total_cost` | NUMERIC(8,4) | Accumulated analysis cost in USD |
| `staleness_summary` | JSONB, nullable | Which sections are stale and why |
| `legacy_profile` | BOOLEAN, default false | True for profiles migrated from old JSONB — triggers re-analysis to populate new structures (voice map, earned-ness, North Star), ~$0.50-1.00 per essay |
| `created_at` / `updated_at` | TIMESTAMPTZ | Standard timestamps |

**Key relationships**: One-to-one with `essays`. One-to-many parent of `essay_holistic_sections`, `essay_paragraph_profiles`, `essay_connections`, `essay_north_star`, `analysis_runs`, `coaching_sessions`, `essay_version_records`. Deleting a profile cascades to all children.

**Primary query patterns**:
1. Load profile index by essay_id (every API call, <1ms)
2. Check confidence level for analysis mode selection
3. Optimistic concurrency check: `UPDATE ... SET write_version = write_version + 1 WHERE id = $1 AND write_version = $2`

**Update cadence**: Profile index recomputed and written after every layer and every coaching turn that deepens understanding. Write version incremented atomically with each update.

---

#### `essay_holistic_sections` — Voice, Theme, Narrative, Character, Craft, Emotion, Admissions, Entanglements, Voice Map, Earned-ness Map

**Purpose**: Stores each holistic understanding section as a separate row. Allows loading voice identity without loading admissions positioning. Each section has its own update cadence — voice might be updated by a coaching reinterpretation while themes remain stable.

**Section type enum**:

```sql
CREATE TYPE holistic_section_type AS ENUM (
  'voice_identity',
  'voice_map',
  'emotional_topography',
  'earnedness_map',
  'thematic_architecture',
  'narrative_strategy',
  'character_revelation',
  'craft_assessment',
  'admissions_positioning',
  'cross_dimension_entanglements'
);
```

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `essay_profile_id` | UUID, FK → `essay_profiles` | Parent reference |
| `essay_id` | UUID, FK → `essays` | Denormalized for direct essay-scoped queries |
| `section_type` | `holistic_section_type` (enum: 10 values) | See enum above |
| `content` | JSONB | Full typed content per PLAN.md structures |
| `token_estimate` | INTEGER | For Profile Router budgeting (~3.2 chars/token for structured text, per M6) |
| `last_updated_layer` | INTEGER | Which layer last wrote this section |
| `updated_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `essay_profiles`. **Up to 10 rows per essay** (one per section type). Not all essays populate all sections — supplements may omit voice_map and earnedness_map.

**Primary query patterns**:
1. Load specific section(s): `WHERE essay_profile_id = $1 AND section_type IN ('voice_identity', 'thematic_architecture')`
2. Load all sections for comprehensive assembly
3. Token count lookups for budget planning: `SELECT section_type, token_estimate WHERE essay_profile_id = $1`

**Update cadence**: L3.75 holistic synthesis populates the core sections. L6 coaching may update individual sections on reinterpretation. Voice map and earned-ness map are populated by specialized analysis passes.

**Why individual rows instead of 10 JSONB columns on `essay_profiles`**:
1. Individual rows update independently — no read-modify-write on unaffected sections
2. TOAST compression per-row means loading one section never decompresses others
3. Profile Router's selective loading maps directly to `WHERE section_type IN (...)`
4. Adding an 11th section requires only a new enum value, not a schema migration

**Why entanglements is a section**: Entanglements record moments where dimensions intersect ("P2S3's voice shift IS the thematic pivot"). Not storable in voice or theme alone — it is a relationship between dimensions. Same lifecycle as other holistic sections.

---

#### `essay_paragraph_profiles` — Per-Paragraph Understanding + Analysis

**Purpose**: One row per paragraph. Contains paragraph-level understanding (role, function, narrative contribution, emotional register, craft profile) and paragraph-level analysis (effectiveness, verdict). Also holds the paragraph's text and text hash for change detection.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `essay_profile_id` | UUID, FK → `essay_profiles` | Parent reference |
| `essay_id` | UUID, FK → `essays` | Denormalized for direct essay-scoped queries |
| `paragraph_index` | INTEGER | Position in essay (0-based) |
| `paragraph_text` | TEXT | Current paragraph text |
| `text_hash` | TEXT | SHA-256 for fast change detection during re-analysis |
| `understanding` | JSONB | Role, function, narrative contribution, emotional register, craft profile, tags |
| `analysis` | JSONB, nullable | Effectiveness score, verdict. Null until L3.5 runs |
| `tags` | TEXT[] | Denormalized from understanding for array queries |
| `sentence_count` | INTEGER | For bounds validation |
| `updated_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `essay_profiles`. One-to-many parent of `essay_sentence_analyses`. Composite unique constraint on (`essay_profile_id`, `paragraph_index`).

**Primary query patterns**:
1. Load single paragraph: `WHERE essay_profile_id = $1 AND paragraph_index = $2`
2. Load all paragraphs for comprehensive assembly
3. Check text hash for change detection during re-analysis

**Update cadence**: Written once per paragraph during L3 understanding walk, then rarely (only on re-analysis after edits or coaching reinterpretation).

---

#### `essay_sentence_analyses` — Per-Sentence Deep Understanding + Analysis

**Purpose**: One row per sentence. The most granular table — stores the full `SentenceDeepAnalysis` structure with understanding and analysis as separate JSONB sub-objects. This is the highest row-count table (~25 rows per essay for 5 paragraphs x ~5 sentences).

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `essay_profile_id` | UUID, FK → `essay_profiles` | For direct profile-level queries |
| `essay_id` | UUID, FK → `essays` | Denormalized for direct essay-scoped queries |
| `paragraph_profile_id` | UUID, FK → `essay_paragraph_profiles` | Parent paragraph |
| `paragraph_index` | INTEGER | Denormalized for query convenience |
| `sentence_index` | INTEGER | Position within paragraph (0-based) |
| `sentence_text` | TEXT | Current sentence text |
| `understanding` | JSONB | observedFunctions, inferredIntents, rhetoricalFunctions, narrativeContributions, paragraphContribution, rhythmContribution, voiceAlignment, techniques, significantChoices |
| `analysis` | JSONB, nullable | Effectiveness score, effectivenessReasoning, strengths, weaknesses. Null until L3.5 |
| `effectiveness` | SMALLINT, nullable | **Scalar copy** of `analysis.effectiveness` for fast filtering |
| `is_problem` | BOOLEAN, nullable | **Scalar copy** for quick flag queries |
| `is_strength` | BOOLEAN, nullable | **Scalar copy** for quick flag queries |
| `priority` | SMALLINT, nullable | **Scalar copy** for sorting/filtering |
| `tags` | TEXT[] | Denormalized from understanding for array queries and tag-based routing |
| `connection_refs` | TEXT[] | References to `essay_connections.connection_id` — lightweight refs, not embedded descriptions |
| `staleness` | JSONB, nullable | Staleness markers for change detection |
| `updated_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `essay_paragraph_profiles`. Composite unique constraint on (`essay_profile_id`, `paragraph_index`, `sentence_index`).

**Primary query patterns**:
1. Load all sentences for a paragraph: `WHERE essay_profile_id = $1 AND paragraph_index = $2 ORDER BY sentence_index`
2. Load specific sentence: `WHERE essay_profile_id = $1 AND paragraph_index = $2 AND sentence_index = $3`
3. Load problem sentences: `WHERE essay_profile_id = $1 AND is_problem = true ORDER BY effectiveness ASC`
4. Load sentences by tag: `WHERE essay_profile_id = $1 AND tags @> ARRAY['metaphor:diamond']`
5. Load understanding-only (L3.5 analysis pass needs understanding but no prior analysis)

**Update cadence**: Understanding written during L3 walk (one initial write per sentence, plus back-propagation updates from later paragraphs). Analysis written once during L3.5 pass. Scalar copies (`effectiveness`, `is_problem`, `is_strength`, `priority`) written alongside analysis.

**Why individual rows**: Back-propagation from P5 to P1S1 updates one row, not the entire P1 array. Tag/score queries avoid JSONB traversal. Light-touch Pathway 1 updates use per-sentence rows with no profile-level lock needed (per M8).

---

#### `essay_connections` — Cross-Sentence Relationships

**Purpose**: The single canonical store for all cross-paragraph connections. Each connection is stored once. Sentences reference connections by ID (stored in their `connection_refs` TEXT array). This eliminates the duplication problem described in the anti-repetition architecture.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `essay_profile_id` | UUID, FK → `essay_profiles` | Parent reference |
| `essay_id` | UUID, FK → `essays` | Denormalized |
| `connection_id` | TEXT, UNIQUE | Human-readable: "conn_001", "conn_002", etc. |
| `from_paragraph` | INTEGER | Source paragraph index |
| `from_sentence` | INTEGER | Source sentence index |
| `to_paragraph` | INTEGER | Target paragraph index |
| `to_sentence` | INTEGER | Target sentence index |
| `connection_type` | TEXT | callback, echo, contrast, setup_payoff, escalation, thread_continuation, image_recurrence, arc_role, redundancy |
| `description` | TEXT | One canonical description of this connection |
| `discovered_at_layer` | INTEGER | Which layer discovered it |
| `updated_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `essay_profiles`. Referenced by `essay_sentence_analyses` via `connection_refs`.

**Primary query patterns**:
1. Load all connections for a profile (comprehensive assembly)
2. Load connections involving a specific paragraph: `WHERE essay_profile_id = $1 AND (from_paragraph = $2 OR to_paragraph = $2)`
3. Load by type: `WHERE essay_profile_id = $1 AND connection_type = 'image_recurrence'`
4. Load connection graph summary for profile index rebuilding

**Update cadence**: New connections added during L3 understanding walk (one to several per paragraph). Rarely updated after initial creation.

**Why a separate table**: Connections are the most duplication-prone data in the system. Without a canonical store, P1S1 would embed a description of its link to P3S4, and P3S4 would embed a (rephrased) description of the same link. The separate table stores each connection exactly once. Sentences carry only lightweight `connection_refs: ["conn_001"]`. The Profile Router resolves refs when building prompt context.

---

#### `essay_north_star` — Holistic Vision (replaces `essay_dna`)

**Purpose**: The system's understanding of how an essay **means** — the architecture by which individual moments compose into a unified act of self-revelation. Five dimensions stored as JSONB, scaled by essay type. Separate from holistic sections because it is populated by a different layer (L4 vs L3.75) and loaded for different purposes (edit interpretation, portfolio strategy, coaching context vs. per-dimension understanding).

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `essay_profile_id` | UUID, FK → `essay_profiles`, UNIQUE | One North Star per essay |
| `essay_id` | UUID, FK → `essays` | Denormalized |
| `essay_type` | TEXT | personal_statement, piq, supplement — drives dimension scaling |
| `through_line_map` | JSONB, nullable | Central element's transformation arc across the essay |
| `structural_roles_map` | JSONB | What each section IS in the architecture of meaning (fulcrum, frame, catalyst, etc.) |
| `trajectory` | JSONB, nullable | Where the essay IS and where it's TRYING to go. Multiple plausible paths |
| `distinctiveness_signature` | JSONB | What makes this essay non-interchangeable |
| `intent_bridge` | JSONB | Student's stated understanding alongside system's |
| `confidence` | SMALLINT | 0-100 confidence in the North Star |
| `token_estimate` | INTEGER | For Profile Router budgeting (~3.2 chars/token) |
| `updated_at` | TIMESTAMPTZ | |

**Scaling by essay type**: Supplements (<250 words) populate only `structural_roles_map` and `distinctiveness_signature`. PIQs (~350 words) add `trajectory`. Personal statements (~650 words) populate all five dimensions. Unpopulated dimensions are null JSONB, not absent columns.

**Key relationships**: One-to-one with `essay_profiles`.

**Primary query patterns**:
1. Load by essay_profile_id (coaching, edit interpretation, portfolio)
2. Load structural_roles only (edit understanding pipeline — is this the fulcrum?)

**Update cadence**: Crystallized at L4. Refined when L6 conversation populates the intent bridge or shifts trajectory. Full rewrite on comprehensive re-analysis.

**Why separate from holistic sections**: The North Star is populated by L4 (crystallization), while holistic sections are populated by L3.75 (synthesis). The North Star is consumed by completely different systems — edit interpretation, portfolio strategy, coaching orientation — not by per-dimension analysis. Different layer, different consumers, different update cadence.

---

### Module 3: Analysis Lifecycle

#### `analysis_runs` — Pipeline Execution Audit Trail

**Purpose**: One row per analysis execution (initial full pass, comprehensive re-analysis, focused re-analysis). Tracks what layers ran, what they cost, what changed, how long they took.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | Also serves as `run_id` |
| `essay_profile_id` | UUID, FK → `essay_profiles` | Parent reference |
| `essay_id` | UUID, FK → `essays` | Denormalized |
| `user_id` | TEXT | For cost aggregation queries |
| `mode` | TEXT (enum) | comprehensive, focused, edit_understanding |
| `status` | TEXT (enum) | running, completed, failed, cancelled |
| `started_at` | TIMESTAMPTZ | |
| `completed_at` | TIMESTAMPTZ, nullable | |
| `cost` | NUMERIC(8,4) | Total cost in USD |
| `layers_completed` | INTEGER[] | Which layers finished |
| `error_details` | TEXT, nullable | If any layer failed |
| `created_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `essay_profiles`. One-to-many parent of `analysis_checkpoints`.

**Primary query patterns**:
1. Load latest run: `WHERE essay_profile_id = $1 ORDER BY created_at DESC LIMIT 1` (resumption after crash)
2. Aggregate cost per user: `SELECT SUM(cost) WHERE user_id = $1`
3. Performance monitoring: average L3 walk duration, average re-analysis cost

**Update cadence**: One row created per analysis execution. Updated during the run (status transitions). Never modified after completion.

---

#### `analysis_checkpoints` — Crash Recovery Snapshots

**Purpose**: Strategic database saves at natural pipeline boundaries. If the server crashes mid-L3-walk, we resume from the last checkpoint instead of restarting the entire pipeline.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `run_id` | UUID, FK → `analysis_runs` | Parent run |
| `paragraph_index` | INTEGER | Which paragraph this checkpoint is after |
| `profile_snapshot` | JSONB | Profile state at this point — pending back-propagations, completed sections |
| `completed_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `analysis_runs`.

**Primary query patterns**:
1. Load latest checkpoint for an essay (crash recovery)
2. Delete old checkpoints after successful run completion

**Lifecycle**: Ephemeral. After a successful analysis run, all checkpoints for that run can be deleted. Only the most recent run's checkpoints matter. Circuit breaker: max 3 retries per checkpoint. After 3 failures, the run is marked failed with error details.

---

### Module 4: Conversation & Coaching

#### `coaching_sessions` — Conversation Container

**Purpose**: One row per coaching session. A session starts when the student enters the coaching interface and may span many messages.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | Also serves as `session_id` |
| `essay_profile_id` | UUID, FK → `essay_profiles` | |
| `essay_id` | UUID, FK → `essays` | Denormalized |
| `user_id` | TEXT | |
| `started_at` | TIMESTAMPTZ | |
| `ended_at` | TIMESTAMPTZ, nullable | Null while active |
| `turn_count` | INTEGER, default 0 | |
| `total_cost` | NUMERIC(8,4), default 0 | |

**Key relationships**: Many-to-one with `essay_profiles`. One-to-many parent of `coaching_messages` and `conversation_insights`.

**Primary query patterns**:
1. Load active session: `WHERE essay_profile_id = $1 AND ended_at IS NULL`
2. Load session history for a student
3. Aggregate coaching cost per essay

**Update cadence**: Created on session start. `turn_count`, `total_cost` updated per coaching turn. `ended_at` set on session close.

---

#### `coaching_messages` — Conversation History

**Purpose**: Immutable log of every message in a coaching session. Both student messages and system responses. Ordered by turn index within a session.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `session_id` | UUID, FK → `coaching_sessions` | Parent session |
| `turn_index` | INTEGER | Ordering within session |
| `role` | TEXT (enum) | student, coach |
| `content` | TEXT | Message text |
| `focus_detection` | JSONB, nullable | Which paragraph/sentence the student is focused on, which profile sections were loaded |
| `insight_extracted` | BOOLEAN, default false | Whether this turn produced a conversation insight |
| `cost` | NUMERIC(8,4), nullable | Cost of LLM calls for this turn |
| `created_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `coaching_sessions`.

**Primary query patterns**:
1. Load messages for a session in order: `WHERE session_id = $1 ORDER BY turn_index`
2. Load most recent N messages for coaching context
3. Count messages per session

**Update cadence**: Immutable — insert-only. One row per message in the conversation.

---

#### `conversation_insights` — Extracted Student Intent (Essay-Scoped)

**Purpose**: When a student reveals something about their essay's intent — confirming an interpretation, correcting a misunderstanding, providing new context — the insight is extracted and stored here. Each insight has a category, scope, and durability. Scoped to a single essay.

**Insight category enum**:

```sql
CREATE TYPE insight_category AS ENUM (
  'confirmation',
  'reinterpretation',
  'new_context',
  'preference',
  'clarification',
  'correction',
  'emotional_reaction',
  'resistance'
);
```

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | Also serves as `insight_id` |
| `essay_profile_id` | UUID, FK → `essay_profiles` | Essay scope |
| `essay_id` | UUID, FK → `essays` | Denormalized |
| `user_id` | TEXT | |
| `category` | `insight_category` (enum) | See enum above |
| `content` | TEXT | What the system learned |
| `scope` | JSONB | Where this insight applies: `{level: "essay"|"paragraph"|"sentence", paragraph?: int, sentence?: int}` |
| `secondary_attributes` | JSONB, nullable | Additional context that doesn't fit standard columns |
| `durability` | TEXT (enum) | ephemeral, draft_durable, essay_durable |
| `supersedes` | UUID, nullable, FK → self | If this insight replaces a previous one |
| `version_context` | TEXT, nullable | Essay text hash when insight was captured — for staleness detection after edits |
| `created_at` | TIMESTAMPTZ | |
| `invalidated_at` | TIMESTAMPTZ, nullable | When this insight was superseded or invalidated |

**Key relationships**: Many-to-one with `essay_profiles`. Self-referential for supersession chains.

**Primary query patterns**:
1. Load active insights: `WHERE essay_profile_id = $1 AND invalidated_at IS NULL`
2. Load by scope: `WHERE essay_profile_id = $1 AND scope->>'paragraph' = $2`
3. Load by category: `WHERE essay_profile_id = $1 AND category = 'reinterpretation'`

**Update cadence**: Inserted after every significant coaching turn. `invalidated_at` set when superseded. Soft deletes only (supersession chains preserved for audit).

---

#### `student_insights` — Student-Durable Knowledge (Cross-Essay)

**Purpose**: Insights that persist across all essays for a student. "I'm a perfectionist and that's part of what I'm writing about" — this affects every essay, not just the one where it was revealed. Separate from essay-scoped `conversation_insights` because it has no `essay_profile_id` dependency and must survive essay deletion. Durability is always `student_durable` (per C1).

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | Also serves as `insight_id` |
| `user_id` | TEXT | Student-level, not essay-level |
| `content` | TEXT | What the system learned |
| `source_essay_id` | UUID, nullable | Which essay the insight came from (for provenance) |
| `durability` | TEXT | Always 'student_durable' |
| `created_at` | TIMESTAMPTZ | |

**Key relationships**: Belongs to user only. No cascade dependency on essay deletion.

**Primary query patterns**:
1. Load all active student insights: `WHERE user_id = $1`
2. Filter by source essay

**Update cadence**: Rare — only when coaching reveals something student-durable. The re-analysis brief pulls from both essay-level (`conversation_insights`) and student-level (`student_insights`) stores.

---

### Module 5: Edit Tracking & Version Management

#### `essay_version_records` — Running Change Log

**Purpose**: The running change log for the Conversational Edit Workshop (Pathway 1). One row per version checkpoint — tracks what changed, where, and optionally why (if the student discussed it). This is the version record that the re-analysis brief reads.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | Also serves as `version_id` |
| `essay_profile_id` | UUID, FK → `essay_profiles` | |
| `essay_id` | UUID, FK → `essays` | Denormalized |
| `change_entries` | JSONB | Array of `{timestamp, paragraph, sentence, old_text, new_text, change_type, intent_annotation}` |
| `conversation_insights_since_last` | JSONB | Insights captured since the previous version record |
| `light_touch_adjustments` | JSONB | Staleness markers and sentence-level updates since last analysis |
| `essay_text_snapshot` | TEXT | Full essay text at this version point |
| `analysis_run_id` | UUID, nullable, FK → `analysis_runs` | If this version triggered a re-analysis |
| `created_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `essay_profiles`. Optionally references `analysis_runs`.

**Primary query patterns**:
1. Load latest version record: `WHERE essay_profile_id = $1 ORDER BY created_at DESC LIMIT 1`
2. Load version record for re-analysis brief: join with analysis_run to find what changed since last analysis
3. Count changes by significance (for re-analysis suggestion threshold)

**Update cadence**: New row inserted at version checkpoints — when the student finishes an editing session or when re-analysis is triggered. The `change_entries` JSONB accumulates individual edits within a version.

---

### Module 6: Portfolio Intelligence

#### `portfolio_essay_index` — Cross-Essay Lightweight Lookup

**Purpose**: A denormalized, lightweight index of all essays in a student's portfolio. Enables portfolio-level queries without joining through the full profile tables. One row per essay, carrying the North Star fields that matter for cross-essay comparison.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `user_id` | TEXT | Portfolio belongs to user |
| `essay_id` | UUID, FK → `essays` | |
| `essay_profile_id` | UUID, FK → `essay_profiles` | |
| `north_star_summary` | JSONB | Compact summary of through-line, distinctiveness, trajectory |
| `voice_fingerprint` | JSONB | Voice identity signature for cross-essay comparison |
| `thematic_tags` | TEXT[] | Top themes for overlap detection |
| `maturity_level` | TEXT, nullable | Quality tier derived from analysis |
| `updated_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with user. One-to-one with `essays` and `essay_profiles`.

**Primary query patterns**:
1. Load all essays for a user: `WHERE user_id = $1` (portfolio dashboard)
2. Find essays by theme overlap
3. Compare voice signatures across essays

**Update cadence**: Updated whenever an essay's North Star or improvement phase changes.

---

#### `portfolio_cross_patterns` — Cross-Essay Intelligence

**Purpose**: Stores patterns detected across multiple essays in a student's portfolio. Theme repetition, voice consistency, narrative strategy diversity, gap analysis. Updated whenever a new essay is analyzed or an existing essay's profile changes significantly.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `user_id` | TEXT | |
| `pattern_type` | TEXT (enum) | theme_overlap, voice_consistency, strategy_diversity, strength_concentration, gap_identified, portfolio_narrative |
| `description` | TEXT | |
| `essay_ids` | TEXT[] | Which essays participate in this pattern |
| `confidence` | SMALLINT | 0-100 confidence in the pattern |
| `detected_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with user. References multiple essays.

**Primary query patterns**:
1. Load all active patterns: `WHERE user_id = $1`
2. Load patterns involving a specific essay
3. Load patterns by type

**Update cadence**: Recomputed when any essay in the portfolio reaches "deep" confidence level or higher.

---

### Supporting Tables

#### `analysis_locks` — Concurrent Analysis Prevention

**Purpose**: Prevents concurrent full analysis runs on the same essay. Advisory lock semantics with heartbeat.

**Key columns**: `id` (UUID, PK), `essay_profile_id` (UUID, FK, UNIQUE), `analysis_run_id` (UUID), `heartbeat_at` (TIMESTAMPTZ — updated every 10 seconds), `acquired_at` (TIMESTAMPTZ).

**Stale lock detection**: A lock with no heartbeat update in 60+ seconds is considered stale (crashed process). The recovery process can acquire a new lock after clearing the stale one.

**Primary query patterns**: Acquire lock (INSERT), update heartbeat, check for stale locks, release lock (DELETE).

---

#### `essay_version_snapshots` — Pre-Analysis Rollback Point

**Purpose**: Before any re-analysis, the current profile state is captured here. If a re-analysis produces worse results, the snapshot can be restored. Not a full version history — just a single rollback point per essay, overwritten each time.

**Key columns**: `id` (UUID, PK), `essay_profile_id` (UUID, FK, UNIQUE), `profile_snapshot` (JSONB — the complete assembled profile as a monolithic blob, the one place where a monolithic snapshot is appropriate), `text_hash` (TEXT), `created_at` (TIMESTAMPTZ).

**Primary query patterns**: Load snapshot for rollback. Overwrite before each re-analysis.

**Update cadence**: Overwritten before each re-analysis. One row per essay maximum.

---

## Key Table Design Decisions

### Why `essay_holistic_sections` uses individual rows (not JSONB columns)

1. **Independent update cadence.** A coaching reinterpretation may update voice_identity and thematic_architecture without touching narrative_strategy. Individual rows mean individual UPDATE statements with no read-modify-write cycle on unaffected sections.

2. **TOAST compression per-row.** Loading voice_identity (~400 tokens of JSONB) never decompresses admissions_positioning (~300 tokens). With JSONB columns on a single row, PostgreSQL may need to decompress the entire TOAST chunk even if only one column is requested.

3. **Profile Router's selective loading.** "Load voice and themes" maps directly to `WHERE section_type IN ('voice_identity', 'thematic_architecture')`. No application-layer column selection needed.

4. **Schema evolution.** Adding an 11th section type requires only a new enum value, not a schema migration.

### Why `essay_sentence_analyses` uses individual rows (not arrays)

1. **Back-propagation is surgical.** When L3's walk of paragraph 5 deepens understanding of P1S1, the Profile Manager updates exactly one row. With a JSONB array on the paragraph, it would load the entire array, parse it, modify one element, serialize the whole thing, and write it back.

2. **Scalar columns enable fast filtering.** `WHERE is_problem = true ORDER BY effectiveness ASC` returns the weakest sentences without any JSONB traversal. This query powers annotation generation. `effectiveness` and `is_problem` as scalar columns make this possible.

3. **Tag-based queries without JSONB traversal.** Tags promoted to a TEXT[] column enable `WHERE tags @> ARRAY['metaphor:diamond']` with GIN index support.

4. **Light-touch updates during editing are row-level.** Pathway 1 editing updates sentence text references and staleness markers per-sentence, with no profile-level optimistic lock needed (per M8). Two browser tabs editing different paragraphs never contend.

### Why `essay_connections` is a separate table (single canonical store)

Connections are the most duplication-prone data in the system. Without a canonical store, P1S1 would embed a description of its link to P3S4, and P3S4 would embed a (rephrased) description of the same link. The separate table stores each connection exactly once. Sentences carry only lightweight `connection_refs: ["conn_001"]` in their TEXT array column. The Profile Router resolves refs when building prompt context. This eliminates duplication completely.

### Why `essay_north_star` is separate from holistic sections

The North Star is populated by a different layer (L4 crystallization vs L3.75 holistic synthesis) and loaded for different purposes (edit interpretation, portfolio strategy, coaching orientation vs. per-dimension understanding). The five dimensions of the North Star (through-line map, structural roles, trajectory, distinctiveness, intent bridge) represent how an essay **means**, not what individual dimensions say about it. Different layer, different consumers, different update cadence — different table.

---

## Concurrency Model

### Optimistic Concurrency on `essay_profiles.write_version`

Every update to the profile index includes `WHERE write_version = $expected`. If it fails (another process incremented the version), the caller reloads and retries. This handles the common case of two coaching turns racing on the same profile.

### Analysis Locks with Heartbeat

The `analysis_locks` table prevents concurrent full analysis runs on the same essay. The orchestrator acquires a lock before starting; releases it on completion. Heartbeat updated every 10 seconds. Stale lock detection: no heartbeat in 60 seconds means the process crashed. Recovery clears the stale lock and acquires a new one.

### Coaching During Re-Analysis — No Contention

They write to different tables. Coaching writes to `coaching_messages` and `conversation_insights`. Re-analysis writes to `essay_sentence_analyses`, `essay_holistic_sections`, and `essay_paragraph_profiles`. The profile index is updated atomically at analysis completion. The coaching session reads the profile index (read-only during analysis).

At completion, the re-analysis does an optimistic update of `essay_profiles.profile_index`. If the coaching session also updated the profile (e.g., a reinterpretation that changed inferredIntents), the optimistic lock detects the conflict and the later writer retries with merged state.

### Light-Touch Updates (Pathway 1) — No Profile Lock

During active editing (Pathway 1), text reference updates and staleness markers use per-sentence row-level updates on `essay_sentence_analyses`. These do not touch `essay_profiles.write_version` and therefore do not conflict with concurrent coaching or analysis. Only the Profile Manager's analytical mutations (understanding/analysis updates that change the profile index) use the optimistic lock (per M8).

### Circuit Breaker

Max 3 retries per checkpoint. After 3 failures on the same checkpoint label, the analysis run is marked `status = 'failed'` with error details. The student sees: "We're having trouble analyzing this section." No infinite crash-resume loops.

---

## 15 Most Common Queries

These queries drive index design. Listed by frequency, most common first.

| # | Description | Access Pattern |
|---|-------------|---------------|
| 1 | Load profile index for routing | `SELECT profile_index FROM essay_profiles WHERE essay_id = $1` |
| 2 | Load specific holistic section(s) | `SELECT content FROM essay_holistic_sections WHERE essay_profile_id = $1 AND section_type IN ($2, $3)` |
| 3 | Load paragraph understanding for walk | `SELECT understanding FROM essay_paragraph_profiles WHERE essay_profile_id = $1 AND paragraph_index = $2` |
| 4 | Load sentence analysis for feedback | `SELECT * FROM essay_sentence_analyses WHERE essay_profile_id = $1 AND paragraph_index = $2 ORDER BY sentence_index` |
| 5 | Load connections involving a paragraph | `SELECT * FROM essay_connections WHERE essay_profile_id = $1 AND (from_paragraph = $2 OR to_paragraph = $2)` |
| 6 | Update sentence understanding (back-propagation) | `UPDATE essay_sentence_analyses SET understanding = $2 WHERE essay_profile_id = $1 AND paragraph_index = $3 AND sentence_index = $4` |
| 7 | Update holistic section | `UPDATE essay_holistic_sections SET content = $2, token_estimate = $3 WHERE essay_profile_id = $1 AND section_type = $4` |
| 8 | Create/update connection | `INSERT INTO essay_connections (...) ON CONFLICT (connection_id) DO UPDATE SET description = $2` |
| 9 | Load North Star for coaching | `SELECT * FROM essay_north_star WHERE essay_profile_id = $1` |
| 10 | Record coaching turn | `INSERT INTO coaching_messages (session_id, turn_index, role, content, focus_detection, cost, ...)` |
| 11 | Store conversation insight | `INSERT INTO conversation_insights (essay_profile_id, category, content, scope, ...)` |
| 12 | Load version record for re-analysis brief | `SELECT * FROM essay_version_records WHERE essay_profile_id = $1 ORDER BY created_at DESC LIMIT 1` |
| 13 | Query sentences by tag | `SELECT * FROM essay_sentence_analyses WHERE essay_profile_id = $1 AND tags @> ARRAY[$2]` |
| 14 | Query sentences with problems (effectiveness < threshold) | `SELECT * FROM essay_sentence_analyses WHERE essay_profile_id = $1 AND is_problem = true ORDER BY effectiveness ASC` |
| 15 | Load portfolio index for cross-essay analysis | `SELECT * FROM portfolio_essay_index WHERE user_id = $1` |

---

## Indexes

### B-tree Indexes (equality and range lookups)

| Table | Index | Columns | Why |
|-------|-------|---------|-----|
| `essay_profiles` | PK | `id` | Standard |
| `essay_profiles` | UNIQUE | `essay_id` | One profile per essay |
| `essay_profiles` | | `user_id` | RLS + dashboard queries |
| `essay_holistic_sections` | UNIQUE | `(essay_profile_id, section_type)` | Primary access pattern — composite covers both "load specific" and "load all" |
| `essay_paragraph_profiles` | UNIQUE | `(essay_profile_id, paragraph_index)` | Primary access pattern, enforces uniqueness |
| `essay_sentence_analyses` | UNIQUE | `(essay_profile_id, paragraph_index, sentence_index)` | Primary access pattern, covers paragraph-scoped queries |
| `essay_sentence_analyses` | PARTIAL | `(essay_profile_id) WHERE is_problem = true` | Weak sentence queries — partial index keeps it small |
| `essay_sentence_analyses` | | `(essay_profile_id, effectiveness)` | Sorting by effectiveness |
| `essay_connections` | UNIQUE | `connection_id` | Human-readable unique identifier |
| `essay_connections` | | `(essay_profile_id)` | Load all connections for a profile |
| `essay_connections` | | `(essay_profile_id, from_paragraph)` | Paragraph-scoped connection queries |
| `essay_connections` | | `(essay_profile_id, to_paragraph)` | Paragraph-scoped connection queries (reverse direction) |
| `essay_north_star` | UNIQUE | `essay_profile_id` | One-to-one |
| `analysis_runs` | | `(essay_profile_id, created_at DESC)` | Latest run query |
| `analysis_runs` | | `user_id` | Cost aggregation |
| `analysis_checkpoints` | | `(run_id, completed_at DESC)` | Latest checkpoint query |
| `coaching_sessions` | | `(essay_profile_id, ended_at)` | Active session lookup (ended_at IS NULL) |
| `coaching_messages` | | `(session_id, turn_index)` | Ordered message retrieval |
| `conversation_insights` | | `(essay_profile_id, invalidated_at)` | Active insights (invalidated_at IS NULL) |
| `student_insights` | | `user_id` | Student-level insights |
| `essay_version_records` | | `(essay_profile_id, created_at DESC)` | Latest version record |
| `portfolio_essay_index` | | `user_id` | Portfolio dashboard |
| `portfolio_cross_patterns` | | `user_id` | Active patterns |
| `analysis_locks` | UNIQUE | `essay_profile_id` | One lock per essay |

### GIN Indexes (array and JSONB path queries)

| Table | Index | Column | Why |
|-------|-------|--------|-----|
| `essay_sentence_analyses` | GIN | `tags` | Tag-based queries: `tags @> ARRAY['metaphor:diamond']` |
| `essay_sentence_analyses` | GIN | `understanding` using `jsonb_path_ops` | Deep JSONB queries on understanding sub-fields |
| `essay_profiles` | GIN | `profile_index` using `jsonb_path_ops` | Rare but needed for topic tag searches across essays |
| `essay_paragraph_profiles` | GIN | `tags` | Paragraph-level tag queries |

GIN indexes are expensive to maintain on write-heavy columns. The sentence `tags` GIN index is justified because tag-based routing is a high-frequency read path. The profile index GIN is a judgment call — it can be deferred if writes become a bottleneck.

---

## RLS Policy

**Users**: Read-only on their own data across all tables. Every table has `user_id` (either directly or via foreign key chain to `essay_profiles`). Policy: `USING (user_id = auth.uid())` for SELECT. No INSERT/UPDATE/DELETE for users on profile tables.

**Service role**: Full access for pipeline operations. All analysis writes, profile mutations, and insight processing happen server-side under the service role.

**No client-side writes to profile tables**: The client can write to `coaching_messages` (student messages) and can trigger analysis via API endpoints, but never directly writes to `essay_profiles`, `essay_holistic_sections`, `essay_sentence_analyses`, or any profile structure. All mutations go through the Profile Manager on the server.

**Cross-table RLS**: Tables without a direct `user_id` column (e.g., `coaching_messages` which has `session_id`) use a foreign-key-based policy joining to the parent table's `user_id`. PostgreSQL RLS supports this via subquery policies.

---

## Migration Strategy: 3-Phase, Zero Data Loss

### Current State

One table: `essay_understanding` with a single `understanding` JSONB column holding the entire profile as a monolithic blob. Plus extracted scalars (`overall_eqi`, `impression_label`, `readiness_level`).

### Phase A — Additive (no data loss, both schemas live)

1. Create all 17 new tables alongside `essay_understanding`. No drops, no renames.
2. Update the Essay Intelligence service to write to BOTH the old monolithic column AND the new decomposed tables (dual-write).
3. Read from the new tables when they have data, fall back to the old column for legacy data.
4. New features (North Star, student insights, version records) write only to new tables — no backport to old schema.

**Duration**: As long as needed. No urgency to move off Phase A.

### Phase B — Backfill (decompose existing data)

5. Run a migration script that reads each `essay_understanding` row, decomposes its JSONB into the new tables, and marks it as migrated.
6. Verify data integrity: assembled profile from new tables matches the original JSONB blob (field-by-field comparison, not byte-equality since ordering may differ).
7. Set `legacy_profile = true` on migrated profiles. These have the old data decomposed into new tables but lack new structures (voice map, earned-ness map, North Star). They need a re-analysis pass to populate those sections. Estimated cost: ~$0.50-1.00 per essay (per M9).
8. Legacy re-analysis can be done lazily (triggered when the student next opens the essay) or batched (background job during off-peak).

**Duration**: One-time script, runs in minutes for current data volume.

### Phase C — Cutover (switch reads, stop old writes)

9. Switch all reads to the new tables exclusively. Remove the old-table fallback code.
10. Stop writing to the old `understanding` column. Remove dual-write code.
11. After a 1-2 week confidence period with monitoring, drop the `essay_understanding` table.

**Data safety**: No data is lost at any step. Both schemas coexist during migration. The old table is dropped only after verified confidence in the new schema.

---

## Updated Key Design Decision #10

**Old**: "JSONB document, not normalized tables — 200-500KB+ of JSON per essay. One query to load, one to save. Profile Index enables partial retrieval without loading the full document."

**New**: "Split-table architecture with JSONB for complex structures."

The one-table JSONB approach created three problems that could not be resolved within a monolithic schema:

1. **Contention**: Coaching updates lock the whole profile. A coaching reinterpretation that touches voice identity must load, modify, and write back the entire 300KB+ blob — blocking any concurrent analysis or other coaching process writing to the same row.

2. **No selective loading at the DB level**: The Profile Router could select which fields to include in prompts, but PostgreSQL still decompressed the full TOAST blob on every read. Loading voice identity for a quick coaching turn always paid the I/O cost of loading admissions positioning, craft assessment, and every sentence's analysis.

3. **Schema evolution was painful**: Adding a new section (voice map, earned-ness map) meant modifying the shape of a deeply nested JSONB structure. No migration tooling. No ability to add an index on a new field without a GIN index on the entire blob. No ability to query the new structure without full-document traversal.

The split-table architecture solves all three:
- **Surgical updates**: Update one sentence, one holistic section, or one connection without touching anything else.
- **Selective loading**: `WHERE section_type IN ('voice_identity')` loads only voice. The DB never decompresses unneeded sections.
- **Proper indexing**: Scalar columns (`effectiveness`, `is_problem`, `priority`) enable B-tree indexes. Tags as TEXT[] enable GIN arrays. No JSONB path traversal for common queries.
- **Independent concurrency**: Coaching writes to `coaching_messages`. Analysis writes to `essay_sentence_analyses`. Different tables, no contention, no locking conflict.
- **JSONB preserved where it belongs**: Deeply nested structures within each table (sentence understanding, holistic section content, North Star dimensions) remain JSONB — loaded as a unit, never partially queried.

---

## Risks & Mitigations

### Join Overhead (Too Many Tables)

With 19 tables, assembling a full profile requires multiple queries. But we NEVER assemble the full profile in one query — the Profile Router always loads selectively. The most common query (load profile index) is a single-table single-row read. When multiple tables are needed, the Profile Router batches related queries in parallel. Loading "paragraph 2's sentences + their connections" is two parallel queries, not N sequential ones.

### Row Growth Per Sentence

~25 sentences per essay x many essays = many rows. Each row is small (2-5KB of JSONB). PostgreSQL handles millions of rows with the composite index on (`essay_profile_id`, `paragraph_index`, `sentence_index`) providing O(log N) lookups. For a college application platform where each user has at most ~10-15 essays, the total row count stays well within single-digit millions even at scale. If it ever becomes a concern, partition `essay_sentence_analyses` by `essay_profile_id`.

### Stale Profile Index

The profile index in `essay_profiles` is a denormalized cache of the full profile state. If a sentence is updated but the index is not recomputed, tags, concerns, and the connection graph may be stale. The Profile Manager always recomputes the index after any mutation and writes it atomically with the optimistic concurrency check. The index is never independently updated — every index write accompanies a write_version increment.

### Optimistic Retry Storms

If many processes update the same essay simultaneously, optimistic lock retries could cascade. In practice, only 2 processes ever touch the same essay concurrently (coaching + re-analysis), and they write to different tables. The analysis lock prevents concurrent analysis runs. Coaching turns are serialized by the student's typing speed. Maximum expected retries: 1-2.

### JSONB Column Evolution

If the internal structure of a JSONB column changes (e.g., `observedFunctions` gains a new field), old rows have the old shape. The application layer treats JSONB as typed but tolerant — missing fields get defaults at read time. No database-level JSONB schema enforcement. TypeScript interfaces define the canonical shape; the deserializer handles version differences gracefully.

### Token Estimation Drift (Review M6)

The `token_estimate` column on `essay_holistic_sections` uses a ratio of ~3.2 chars/token for structured text (accounting for the ~15-20% overhead from labels and headers). If rendering format changes, the ratio must be recalibrated. Incorrect estimates cause the Profile Router to over- or under-load sections. Mitigation: recalibrate against the actual rendered format, not raw JSONB content.

---

## Modularity & Evolution

The architecture supports organic growth without structural upheaval.

**Adding a new holistic section**: Add a new enum value to `holistic_section_type`. No schema migration beyond the enum update. No existing queries break. The Profile Router adds a new loading rule. The "10 rows per essay" becomes "11 rows per essay."

**Adding a new analysis layer**: Add rows to `analysis_runs` with the new layer in the `layers_completed` array. No schema changes. The orchestrator's checkpoint logic adds a new checkpoint label.

**Extracting a JSONB field to its own table**: If `essay_sentence_analyses.understanding` becomes a bottleneck because we query `observedFunctions` frequently, we can extract `observedFunctions` into its own table (one row per observation entry) without touching any other table. The JSONB-to-table migration is local to one module.

**New portfolio pattern types**: Just new enum values on `portfolio_cross_patterns.pattern_type`. The table structure does not change.

**New insight categories**: New enum values on `insight_category`. The Profile Manager's insight handling extends naturally.


---

## Current Implementation Status

The Essay Intelligence System already has substantial working code in `src/services/essayIntelligence/`:

### What EXISTS (14 files, ~3500+ lines)

| File | Layer | Status | Notes |
|------|-------|--------|-------|
| `types.ts` | All | Needs update | Add ProfileIndex, EssayProfile, SentenceDeepAnalysis (3-way intent), back-propagation types |
| `analysis/analysisOrchestrator.ts` | 1-5 | Needs update | Add L1 Haiku calls, integrate EssayProfile accumulator, selective injection |
| `analysis/sequentialDeepWalk.ts` | 3 | Needs update | Enrich sentence mapping, 3-way intent, back-propagation output, selective profile injection |
| `analysis/crystallizer.ts` | 4 | Minor update | Add tellability, coherence report, consume Profile Index + holistic sections |
| `analysis/deepAnnotationService.ts` | 5 | Minor update | Reference profile for richer annotations |
| `analysis/structuralCartographer.ts` | 2 | Upgrade | Haiku → Sonnet, consume L1 impressions |
| `analysis/runningUnderstandingManager.ts` | 3 | Major update | Become `essayProfileManager.ts`: profile accumulation, back-propagation, index maintenance, selective serialization |
| `analysis/analysisPrompts.ts` | 2-5 | Needs update | Updated prompts for all layers |
| `sentenceAnalyzer.ts` | 1 | Replace | Deterministic → Haiku first impressions |
| `wordAnalyzer.ts` | 1 | Replace | Deterministic → Part of Haiku first impressions |
| `essayUnderstandingService.ts` | 1 | Needs update | BuildInitial uses Haiku, not deterministic |
| `diffEngine.ts` | Inc. | Needs update | Text diffing + structural change detection (insert/delete/reorder) + index remapping |
| `contextBuilder.ts` | 6 | Major update | Index-driven selective routing for ALL consumers |
| `index.ts` | - | Keep | Barrel exports |

### New Files Needed

| File | Layer | Description |
|------|-------|-------------|
| `analysis/firstImpressions.ts` | 1 | Haiku per-paragraph first impression analysis (purely descriptive, no evaluation) |
| `analysis/scoutPass.ts` | 2.5 | Haiku connection scout — cross-paragraph surface connection detection |
| `analysis/holisticSynthesis.ts` | 3.75 | Sonnet holistic synthesis — populates all 10 holistic section types from complete sentence understanding |
| `analysis/analysisPass.ts` | 3.5 | Sonnet parallel analysis pass — evaluation with complete understanding |
| `analysis/profileRouter.ts` | All | Universal selective profile injection — connection-driven routing with proximity fallback |
| `analysis/consistencyValidator.ts` | 4 | Cross-layer consistency checks |
| `analysis/improvementPhaseDetector.ts` | Post-L3.5 | Phase detection from analysis results — drives feedback zoom level |
| `analysis/focusedAnalyzer.ts` | Re-analysis | Focused analysis pipeline for surgical edits against deep profiles |
| `analysis/impactClassifier.ts` | Re-analysis | Haiku-powered impact classification for edit scope assessment |
| `coachingService.ts` | 6 | Phase-aware conversation coaching with profile deepening |

Database: `supabase/migrations/20260304000002_add_essay_understanding.sql` exists — `essay_understanding` table with JSONB, GIN index, RLS. Profile size increase is fine (JSONB handles 200-500KB+).

---

## What Needs To Be Done

### Phase 1: Core Architecture (HIGH PRIORITY)

#### 1A. Layer 1 → Haiku First Impressions

**Why**: Heuristic sentence classification and word flagging lack nuance and context. "walked" might be a weak verb or an intentionally grounded choice — only an LLM can judge in context.

**New file**: `src/services/essayIntelligence/analysis/firstImpressions.ts` (~300 lines)

- Parallel Haiku calls, one per paragraph
- Each call receives: full essay text (context) + target paragraph + basic metrics
- Produces `ParagraphFirstImpression` with per-sentence purpose mapping, notable word/phrase detection, and semantic tags
- Seeds the EssayProfile at every granularity level
- Creates initial Profile Index with paragraph digests and topic tags

**Files to update**:
- `analysisOrchestrator.ts`: Replace deterministic L1 with parallel Haiku first impression calls
- `essayUnderstandingService.ts`: `buildInitial()` triggers Haiku, not deterministic extractors
- `types.ts`: Add `ParagraphFirstImpression`, `SentenceFirstImpression`, `ProfileIndex` types

**Files that become optional/deprecated**:
- `sentenceAnalyzer.ts` — replaced by Haiku sentence analysis
- `wordAnalyzer.ts` — replaced by Haiku word/phrase analysis
- Old deterministic extractors in `src/workshop/scoring/` — can stay for the old "fast mode" pipeline but not used by Essay Intelligence

#### 1B. Upgrade Layer 2 to Sonnet

**File**: `src/services/essayIntelligence/analysis/structuralCartographer.ts`

- Change model to Sonnet (`claude-sonnet-4-5-20250929`)
- Accept L1 first impressions + Profile Index as input (richer context for structural decisions)
- Update `DEFAULT_ANALYSIS_CONFIG.models.structural` in `types.ts`

#### 1C. Add Connection Scout (Layer 2.5)

**New file**: `src/services/essayIntelligence/analysis/scoutPass.ts` (~200 lines)

- Single Haiku call that sees ALL paragraphs simultaneously
- Detects cross-paragraph surface connections: repeated words/phrases, tonal shifts, structural echoes
- Produces `ConnectionScout` — investigation leads for L3, NOT conclusions
- Runs in parallel with Layer 2 (both complete before Layer 3 starts)
- Key value: forward-looking connections (P1→P5) that L3's sequential walk can't discover until P5

**Integration**:
- `analysisOrchestrator.ts`: Run L2 + L2.5 in parallel after L1
- `sequentialDeepWalk.ts`: Accept scout connection leads and inject relevant ones per-paragraph

#### 1D. EssayProfile Accumulator with Profile Index

**Why**: The current `RunningUnderstanding` is too thin — it tracks thesis, themes, voice, and connections but not the multi-resolution detail we need. The EssayProfile tracks understanding + analysis at every level with a smart index for efficient retrieval.

**Files to update**:
- `types.ts`: Add `EssayProfile`, `ProfileIndex`, `ImprovementPhase`, `ParagraphProfile`, `UnderstandingWalkOutput`, `HolisticSynthesisOutput`, `AnalysisPassOutput`, `ConnectionScout`, `SentenceUnderstanding`, `SentenceAnalysis`, `ObservationEntry`, `EditDiff`, `FocusedAnalysisResult`, `ImpactClassification`, `RippleFlags`
- `analysis/runningUnderstandingManager.ts` → rename to `essayProfileManager.ts`:
  - Profile accumulation: understanding from L3, analysis from L3.5 (separate passes)
  - Understanding back-propagation handling
  - Profile Index maintenance (tags, connection graph, section token counts, concerns)
  - Selective serialization (serialize only requested sections for a given prompt)
  - Layer-aware storage: understanding and analysis as separate sub-objects
  - Profile validation
- `sequentialDeepWalk.ts`: Each Sonnet call produces `UnderstandingWalkOutput` (understanding only, no evaluation)

#### 1E. Sentence-Level Multi-Observation Understanding + Separate Analysis

**Why**: Current `ParagraphDeepAnalysis.sentences` has shallow single-string fields. We need multi-observation arrays where a sentence can do MULTIPLE things, and understanding must be separated from analysis.

**File**: `types.ts` — Replace current sentence array with `SentenceDeepAnalysis` containing `.understanding` + `.analysis` sub-objects. Multi-observation fields use `ObservationEntry[]`.

**File**: `sequentialDeepWalk.ts` — Updated prompt instructs Sonnet to:
- Produce `SentenceUnderstanding` for every sentence (understanding ONLY — no evaluation)
- Multiple `observedFunctions`, multiple `inferredIntents`, multiple `narrativeContributions`
- Map word/phrase significance with context-aware reasoning
- Identify connections and produce understanding back-propagations
- Tag every sentence with semantic labels for the Profile Index

#### 1E1.5. Holistic Synthesis (Layer 3.75) — NEW

**New file**: `src/services/essayIntelligence/analysis/holisticSynthesis.ts` (~200 lines)

- Single Sonnet call AFTER L3 understanding walk completes
- Reads complete sentence-level understanding + connections + incremental holistic evolution from walk
- Synthesizes ALL 10 holistic section types: voice identity, voice map, emotional topography, earned-ness map, thematic architecture, narrative strategy, character revelation, craft assessment, admissions positioning, cross-dimension entanglements
- Produces `HolisticSynthesisOutput` — Profile Manager stores directly into holistic profile sections
- The walk's `holisticEvolution` (4 incremental fields) serves as a starting point, NOT the final answer

**Why this is needed**: The walk can't populate character revelation, admissions positioning, emotional undertones, or craft patterns — it's focused on paragraph-level sentence understanding. A dedicated synthesis sees the complete picture and thinks holistically.

**Integration**:
- `analysisOrchestrator.ts`: After L3 walk, run L3.75 synthesis. After that, run L3.5 analysis in parallel.
- `essayProfileManager.ts`: Store holistic synthesis output directly into all 10 holistic section types

#### 1E2. Analysis Pass (Layer 3.5) — NEW

**New file**: `src/services/essayIntelligence/analysis/analysisPass.ts` (~300 lines)

- Parallel Sonnet calls, one per paragraph
- Each call receives: full essay text + COMPLETE understanding profile (sentence-level + holistic from L3.75, prompt-cached) + target paragraph
- Produces `AnalysisPassOutput` with per-sentence effectiveness, strengths[], weaknesses[]
- All calls run in parallel (no inter-paragraph dependency since understanding is complete)
- Profile Manager stores analysis as separate sub-object on each sentence
- Uses observation labels ([U1], [U2]) for concrete referencing of understanding observations

**Integration**:
- `analysisOrchestrator.ts`: After L3.75 holistic synthesis completes, trigger L3.5 analysis pass in parallel
- `essayProfileManager.ts`: Store analysis separately from understanding

#### 1F. Universal Profile Router

**New file**: `src/services/essayIntelligence/analysis/profileRouter.ts` (~250 lines)

The single source of truth for "given a task, what profile sections should be loaded?" Layer-aware — can load understanding only, analysis only, or both.

```typescript
interface ProfileRouterInput {
  task:
    | { type: 'understanding_walk'; paragraphIndex: number }
    | { type: 'holistic_synthesis' }
    | { type: 'analysis_pass'; paragraphIndex: number }
    | { type: 'crystallization' }
    | { type: 'feedback_annotation' }
    | { type: 'coaching'; focus: ConversationFocus }
    | { type: 'inline_edit'; paragraph: number; sentence: number }
    | { type: 're_analysis'; changedParagraphs: number[] }
    | { type: 'focused_understanding'; paragraph: number; sentence: number; changeContext: string }
    | { type: 'focused_analysis'; paragraph: number; sentence: number }
    | { type: 'impact_classification'; changedParagraphs: number[] }
    | { type: 'custom'; requiredSections: string[]; requiredTags?: string[] };
  profileIndex: ProfileIndex;
  tokenBudget: number;           // Maximum tokens for profile context
  layers: ('understanding' | 'analysis')[];  // Which layers to load
}

interface ProfileRouterOutput {
  sectionsToLoad: string[];       // e.g., ["voiceIdentity", "paragraphs[0].sentences", "connections.callbacks"]
  paragraphsFullDetail: number[]; // Load full sentence maps for these paragraphs
  paragraphsDigestOnly: number[]; // Load only digest for these
  specificSentences: Array<[number, number]>; // Load these specific sentences by [para, sent]
  estimatedTokens: number;
}
```

- Used by EVERY API call across the system (L3, L4, L5, L6, inline editor, re-analysis, future services)
- Respects token budgets — won't exceed the limit, prioritizes most relevant content
- Tag-based routing: if the task involves "metaphor", finds all profile entries tagged with metaphor
- Connection-aware: if loading sentence P2S3, also loads sentences that P2S3 connects to

#### 1G. Parallelize Layer 4 + Layer 5

**File**: `src/services/essayIntelligence/analysis/analysisOrchestrator.ts`

- Split `crystallizer.crystallize()` into `buildScoreMatrix()` (from profile data) + `crystallizeNorthStar()` (Sonnet)
- Run `crystallizeNorthStar` + `generateAnnotations` via `Promise.all()`
- Both use Profile Router to load appropriate profile slices

#### 1H. Paragraph-Level Checkpointing + Error Recovery

**File**: `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts`

**Checkpointing:**
- After each successful paragraph, emit checkpoint callback with current EssayProfile (including all back-propagations applied)
- On failure, return partial results with `resumeFromParagraph` indicator
- Cost ceiling check after each paragraph

**Error prevention (primary — prevent errors from happening):**
- Include a concrete JSON example in the system prompt for every output type. The #1 cause of malformed LLM output is ambiguous schema descriptions — a real example eliminates ambiguity.
- Use Anthropic's structured output / tool-use mode to enforce JSON schema compliance at the API level. This prevents most malformed JSON issues before they reach our code.
- Validate paragraph/sentence indices are in range BEFORE sending the call (the prompt should explicitly state: "This essay has 5 paragraphs. P0 has 3 sentences, P1 has 4 sentences..." — prevents out-of-range indices in back-propagations).

**Error recovery (secondary — self-fixing, not blind retry):**
When an L3 walk step produces invalid output:

1. **Validate before applying:** Profile Manager runs structural checks BEFORE applying any output:
   - JSON parses correctly
   - Required fields exist (paragraphUnderstanding, sentenceCount matches actual)
   - Back-propagation indices are in range (paragraph < N, sentence < paragraph's sentence count)
   - Evidence fields are non-empty strings

2. **Self-fix on validation failure:** Instead of retrying the full call (expensive, same prompt = likely same error), send a REPAIR call:
   ```
   Your previous output had the following validation errors:
   [list of specific errors]

   Here is your original output:
   [the malformed output]

   Please fix ONLY the errors listed above. Keep everything else unchanged.
   Output the corrected JSON.
   ```
   This is cheaper than a full retry (smaller prompt, focused task) and more likely to succeed because the LLM can see its own mistake and correct it. Haiku is sufficient for structural repairs — it doesn't need Sonnet's depth to fix a missing field or wrong index.

3. **Graceful degradation on repair failure:** If the repair call also fails (rare — two consecutive failures), skip this paragraph's deep understanding. The paragraph keeps its L1/L2 level understanding and a `walkSkipped: true` flag. The walk continues — P4 can still add value even without P3's deep understanding. L3.5 analysis and L4 crystallization handle the gap gracefully (one paragraph at shallow depth doesn't corrupt the whole profile).

**Why self-fix > blind retry:** A blind retry sends the exact same prompt and often gets the exact same error. The repair call is fundamentally different — it shows the LLM its own output and the specific validation failures. It's targeted surgery, not "try again and hope."

#### 1I. Multi-Block Prompt Caching for Layer 3

**File**: `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts`

Restructure into 3 prompt blocks:
1. System block 1 (static, cached): Analysis instructions + output schema + back-propagation format
2. System block 2 (essay-specific, cached across paragraph calls): Full marked essay + L2 structural map + L1 impressions
3. User prompt (changes per call): Target paragraph + scout connection leads for this paragraph + selectively-loaded profile context (via Profile Router)

#### 1J. Cross-Layer Consistency Validation

**New file**: `src/services/essayIntelligence/analysis/consistencyValidator.ts` (~150 lines)

Checks (logged as warnings, not hard failures):
1. North Star structural roles reference paragraphs that exist in the profile with completed understanding
2. Thematic threads with `strength: 'dominant'` span at least 40% of paragraphs
3. Sentence purposes from L1 first impressions align with L3 deep analysis (contradictions OK if L3 explains the revision via back-propagation)
4. Connection refs are valid (every `connectionRefs` ID on a sentence exists in `connections.all[]`)

#### 1K. Improvement Phase Detection (Progressive Precision)

**File**: `src/services/essayIntelligence/analysis/improvementPhaseDetector.ts` (~200 lines)

- `detectImprovementPhase(profile: EssayProfile): ImprovementPhase` — classifies current phase from L3.5 analysis results
- Computes readiness scores at each granularity (essay, paragraph, sentence, word)
- Hierarchical phase classification: Foundation → Architecture → Craft → Polish → Distinction
- Result stored in `ProfileIndex.improvementPhase`

**Integration**:
- `analysisOrchestrator.ts`: After L3.5 analysis pass completes, run `detectImprovementPhase()`. Store result in ProfileIndex.
- `deepAnnotationService.ts`: L5 annotation prompt receives `improvementPhase` and generates feedback at the correct zoom level
- `coachingService.ts`: L6 coaching prompt receives `improvementPhase` and responds at the correct zoom level
- `essayProfileManager.ts`: Re-compute phase after every re-analysis (comprehensive or focused)

**Files to update**:
- `types.ts`: Add `ImprovementPhase` type, add `improvementPhase` to `ProfileIndex`
- `analysisOrchestrator.ts`: Phase detection wiring after L3.5
- `deepAnnotationService.ts`: Phase-aware annotation prompt
- `coachingService.ts`: Phase-aware coaching prompt

#### 1L. Focused Analysis Mode

**New file**: `src/services/essayIntelligence/analysis/focusedAnalyzer.ts` (~350 lines)

The focused analysis pipeline for surgical edits against a deep profile. Fundamentally different from comprehensive re-analysis — more magnification, narrower aperture, higher depth-per-token.

- `selectAnalysisMode(profile, changes): 'comprehensive' | 'focused'` — mode decision logic
- `runFocusedAnalysis(profile, changes): FocusedAnalysisResult` — the focused pipeline:
  1. Diff detection (character-level)
  2. Impact classification (Haiku call)
  3. Focused understanding update (single Sonnet call)
  4. Focused analysis update (single Sonnet call)
  5. Ripple handling (conditional escalation ladder)
  6. Phase-aware feedback generation

**New file**: `src/services/essayIntelligence/analysis/impactClassifier.ts` (~150 lines)

- Haiku call that assesses the scope of impact for a given edit
- Determines which profile sections are likely affected
- Outputs ripple probability and recommended scope

**Integration**:
- `analysisOrchestrator.ts`: `handleTextChange()` calls `selectAnalysisMode()`. If `'focused'`, delegates to `focusedAnalyzer.runFocusedAnalysis()`. If `'comprehensive'`, uses existing incremental update logic.
- `essayProfileManager.ts`: `applyFocusedUpdate()` — applies focused understanding/analysis updates with minimal profile disturbance
- `diffEngine.ts`: Enhanced diff detection for character-level and word-level change classification

**Files to update**:
- `types.ts`: Add `EditDiff`, `FocusedAnalysisResult`, `ImpactClassification`, `RippleFlags` types
- `analysisOrchestrator.ts`: Mode selection + focused pipeline wiring
- `diffEngine.ts`: Character/word-level diff detection + change ratio computation
- `essayProfileManager.ts`: Focused update application

---

### Phase 2: Integration & Wiring (MEDIUM PRIORITY)

#### 2A. HTTP Routes

**New file**: `src/http/essayIntelligenceRoutes.ts`

```
POST /api/v1/essay-intelligence/analyze       -> Full L1-L5 analysis (comprehensive mode)
POST /api/v1/essay-intelligence/update         -> Re-analysis (auto-selects comprehensive vs focused mode)
GET  /api/v1/essay-intelligence/:essayId       -> Load existing understanding
POST /api/v1/essay-intelligence/:essayId/coach -> Layer 6 coaching turn (phase-aware)
GET  /api/v1/essay-intelligence/:essayId/profile -> Load specific profile sections (RAG)
GET  /api/v1/essay-intelligence/:essayId/index -> Load Profile Index only (includes improvementPhase)
```

**File**: `src/http/routes.ts` — Mount the new router

#### 2B. Layer 6 Coaching Service

**New file**: `src/services/essayIntelligence/coachingService.ts` (~300 lines)

1. Focus detection + message classification (Haiku) — reads Profile Index, classifies focus area + whether student revealed new intent/context
2. Context routing — Profile Router selects relevant sections via connection graph + tags
3. Coaching response (Sonnet) — deep, contextual guidance informed by loaded profile
4. Profile deepening (Haiku for simple confirmations, Sonnet for reinterpretations/new context) — update profile + Profile Index. Sonnet used when the student's input would cascade through connections or holistic sections.

#### 2C. Coexistence with Old Annotation Pipeline

- **Fast mode**: Old pipeline (~$0.03-0.05, ~3-5s) — quick surface feedback
- **Deep mode**: Essay Intelligence System (~$0.40-0.80, ~30-45s) — complete understanding

---

### Phase 3: Testing & Validation (HIGH PRIORITY — parallel with Phase 1)

#### 3A. E2E Test

**New file**: `tests/test-essay-intelligence-e2e.ts`

- Full L1-L3.5-L4-L5 against sample essays (strong, weak, montage)
- Verify EssayProfile grows through layers: L3 understanding → L3.5 analysis → L5 feedback
- Verify understanding/analysis layer separation: understanding has no evaluative language, analysis references understanding observations
- Verify multi-observation arrays: sentences with multiple functions have multiple `ObservationEntry` items
- Verify word-level observations exist
- Verify Profile Index is accurate and complete
- Cost within $0.50-1.00 range

#### 3B. Profile Depth & Back-Propagation Validation

**New file**: `tests/test-essay-profile-depth.ts`

- After full analysis, verify:
  - Every paragraph has understanding.role, understanding.function, understanding.narrativeContribution
  - Every sentence has populated `observedFunctions[]` and `inferredIntents[]` (understanding layer)
  - Every sentence has populated `effectiveness` and `effectivenessReasoning` (analysis layer)
  - Multi-observation: at least 50% of sentences have 2+ `observedFunctions` entries
  - At least 30% of sentences have notable word/phrase observations
  - Cross-paragraph connections exist in `connections.all[]` and both endpoints carry the connection ID in `connectionRefs`
  - Thematic threads span multiple paragraphs
  - P1's understanding has been enriched by back-propagation (not just first-read impressions)
  - P1's analysis evaluated P1 with FULL context (references P5's payoff)
  - Profile Index tags match actual profile content
  - Understanding fields contain NO evaluative language ("good", "effective", "strong")
  - Analysis fields reference understanding observations, don't re-describe

#### 3C. Selective Profile Injection Test

**New file**: `tests/test-profile-routing.ts`

- Create a full profile, then test the Profile Router:
  - Deep walk (P3): verify it loads P2+P3 sentence maps but only P0+P1 digests
  - Coaching (voice question): verify it loads voiceIdentity + voice-tagged sentences
  - Coaching (specific paragraph): verify it loads that paragraph + its connections
  - Token budgets respected: verify output never exceeds specified budget
  - Tag-based routing works: "metaphor" query finds metaphor-tagged entries

#### 3D. Incremental Update Test

**New file**: `tests/test-essay-intelligence-incremental.ts`

- Edit one paragraph, verify only changed + forward paragraphs re-walked
- Verify profile updates propagate correctly
- Verify back-propagations to unchanged paragraphs are preserved
- Verify Profile Index updated (tags, connections, concerns)
- Verify cost significantly lower than full analysis

#### 3E. Prompt Iteration Validation (CRITICAL — quality control calibration)

**New file**: `tests/test-deep-walk-prompt-quality.ts`

- Run the L3 deep walk + L3.5 analysis pass against 3 sample essays (strong, weak, montage)
- Validate output quality:
  - JSON parses correctly
  - All SentenceDeepAnalysis fields populated
  - Back-propagations are specific (not generic "connects to earlier")
  - 3-way intent fields are genuinely distinct (not just rephrased versions of same thing)
  - No repetition of L1 observations
  - Tags are semantic and useful (not generic like "important")
- **Novelty-driven quality controls — EXTRA RIGOROUS testing required:**
  - **Evidence grounding**: Every observation has non-empty `evidence` citing actual essay text
  - **Utility filtering calibration**: Verify the LLM isn't OVER-filtering (suppressing valid depth observations that "wouldn't change teaching") or UNDER-filtering (still producing noise). This is the hardest balance to strike — expect 3-5 prompt iterations specifically on this.
  - **Novelty accuracy**: P1's walk should produce rich output (everything is new). P5's walk should produce focused output (mostly established). Verify the growth curve is natural — not flat (every paragraph equally verbose) or cliff-edge (only P1 produces anything).
  - **Back-propagation quality**: When P3 back-propagates to P1S1, verify the new understanding is genuinely DEEPER, not just DIFFERENT. A correct back-prop: "Grounds reader in physical action that becomes the essay's central metaphor." A bad back-prop: "Mentions a ring" (shallow replacement).
  - **L4 coherence check**: After full walk, verify the crystallizer can produce coherent North Star without contradictions. If contradictions exist, flag them — this indicates the walk produced inconsistent understanding.
- This test drives prompt refinement — expect 3-5 iterations, primarily on the novelty/evidence/utility balance

#### 3F. Progressive Precision Test

**New file**: `tests/test-progressive-precision.ts`

- Run full analysis on a deliberately weak essay (thesis problems + paragraph issues + sentence issues + word issues)
- Verify `detectImprovementPhase()` correctly returns `foundation`
- Verify L5 annotations are essay-level (2-3 annotations about thesis/structure, NOT word-level)
- Simulate: fix thesis problems, re-analyze → verify phase shifts to `architecture`
- Verify L5 annotations shift to paragraph-level focus
- Continue: fix paragraph issues, re-analyze → verify phase shifts to `craft`
- Verify feedback zoom tracks the improvement journey
- Test edge cases:
  - Phase regression: introduce new structural problem → phase moves backward
  - Phase skip: essay that's already strong → starts at `craft` or `polish`
  - Distinction phase: polished essay → feedback about memorability, not correctness
  - Readiness scores: verify `readiness` object accurately reflects essay state at each level
- Verify deferred areas are NOT surfaced in annotations (word-level issues exist but not shown in Foundation phase)
- Verify deferred areas ARE accessible in coaching when student specifically asks

#### 3G. Focused Analysis Mode Test

**New file**: `tests/test-focused-analysis.ts`

- Build a deep profile (full comprehensive analysis on a strong essay)
- Test mode selection:
  - Word change → `selectAnalysisMode()` returns `'focused'`
  - Paragraph rewrite → returns `'comprehensive'`
  - Structural edit → returns `'comprehensive'`
  - Two-word edit with 'deep' profile → returns `'focused'`
  - Same two-word edit with 'developing' profile → returns `'comprehensive'`
- Test focused pipeline end-to-end:
  - Make a word change (e.g., "walked" → "drifted")
  - Verify focused understanding update captures the semantic difference
  - Verify focused analysis update evaluates the new word
  - Verify NO re-walk of other paragraphs (profile changes only touch P2S4)
  - Verify cost significantly lower than comprehensive (~$0.03-0.06 vs ~$0.15-0.35)
- Test ripple detection:
  - Change a thesis-carrying word → verify ripple flagged, escalation to paragraph-level
  - Change a purely stylistic word → verify no ripple, immediate completion
  - Change a word that appears in a connection (e.g., "diamond") → verify connected sentences re-evaluated
- Test escalation ladder:
  - Word change ripples to paragraph → verify paragraph-level re-analysis triggered
  - Paragraph ripple shifts holistic voice → verify section-level re-synthesis
  - Full cascade to comprehensive → verify comprehensive mode kicks in correctly
- Compare output quality: focused vs comprehensive on the same word change
  - Focused should have higher signal-to-noise (concentrated on the change)
  - Focused should preserve existing understanding precisely (no drift)

---

### Phase 4: Frontend Integration (LOWER PRIORITY — after backend solid)

- Paragraph heat map (composite scores from profile)
- Sentence-level inline view (purpose, effectiveness, suggestions)
- Word-level highlights (significant choices, weak spots)
- North Star summary card
- Profile exploration UI (browse holistic sections, follow connections)
- Connection visualization (how sentences link across paragraphs)
- Smart coaching chat with profile-aware context



---

## Edit Intelligence: Understanding, Pathways & Version Tracking

## Section A: Edit Understanding Pipeline

### Vision

The old PLAN.md design had two approaches to edit handling, both wrong in different directions. The original 1D asked a cheap Haiku call to PREDICT impact — unreliable guesswork disconnected from real understanding. The v1 correction swung the other way, making everything deterministic — word count ratios, syntactic pattern matching, mechanical graph traversal. But essay editing is a meaning-making activity. When a student changes one word, the significance depends entirely on context that only an LLM reading the actual words can understand.

The Edit Understanding Pipeline holds the middle: a structured pipeline (Detect -> Understand -> Classify -> Map -> Scope) that provides discipline and predictability, with Sonnet-level LLM intelligence at each interpretive step. The pipeline tells the system WHAT to do at each stage. The LLM brings the judgment of HOW significant, WHAT kind, and HOW FAR the impact reaches.

The key distinction from the old 1D: the Haiku classifier was a separate, shallow prediction call ("what will this change affect?") that guessed without deeply understanding the change itself. The new approach does not predict — it UNDERSTANDS the change first, and the scope FOLLOWS from that understanding. Understanding and scoping happen in the same call, with the same context, by the same model.

### The Pipeline: Detect -> Understand -> Map -> Scope

```
+-----------------------------------------------------------------------------+
| Student edits essay text                                                    |
|                                                                             |
| Step 0: HAIKU PRE-FILTER (~$0.001)                                         |
|   Binary: "trivial mechanical fix or real content change?"                  |
|   Trivial (typo, comma, capitalization) -> log, no profile work, DONE      |
|   Real content change -> proceed to Step 1                                 |
|                                                                             |
| Step 1: CHANGE DETECTION (mechanical, ~10-50ms, free)                      |
|   Paragraph alignment -> sentence alignment -> word-level diff             |
|   Output: hierarchical description of what physically changed               |
|                                                                             |
| Step 2: CHANGE UNDERSTANDING (Sonnet call, ~$0.02-0.05)                    |
|   + Step 3: PROFILE MAPPING (same Sonnet call)                             |
|   + Step 4: SCOPE RECOMMENDATION (same Sonnet call)                        |
|   One integrated call that understands, maps, and scopes                    |
|                                                                             |
| Output: EditUnderstanding -- feeds Pathway 1 workshop OR Pathway 2 brief   |
+-----------------------------------------------------------------------------+
```

#### Step 0: Haiku Pre-Filter

Not every edit deserves a Sonnet call. A Haiku pre-filter prevents unnecessary cost for trivially insignificant edits.

**When Haiku is enough**: The student fixes a typo ("teh" -> "the"), adds a comma, changes capitalization, or corrects a misspelling. Haiku receives the raw diff only (no profile context needed) and classifies: "mechanical correction, no semantic change." No Sonnet call, no profile update. Cost: ~$0.001.

**When Haiku escalates to Sonnet**: Any change to actual content words, sentence structure, added/removed content, or any change to a sentence the ProfileIndex has tagged as structurally important. Haiku's job is binary: "is this a trivial mechanical fix or a real content change?" If real -> hand to Sonnet.

This keeps costs manageable for students who make many trivial fixes while ensuring every meaningful edit gets full LLM understanding.

#### Step 1: Change Detection (Mechanical Pre-Processing)

This is the one step that remains purely mechanical. It produces the raw material the LLM will interpret.

**Paragraph alignment**: Hash each paragraph. Unchanged hashes = paragraph did not change. If paragraphs were inserted, deleted, or reordered, produce a remapping (old P3 -> new P4). This uses the same `remapIndices` logic defined in `essayProfileManager.ts`.

**Sentence alignment within changed paragraphs**: Align sentences between old and new versions. Pair each changed sentence with its most likely counterpart (by position, confirmed by textual overlap). Flag genuinely new sentences and deleted sentences.

**Word-level diff within changed sentences**: For each changed sentence, produce the actual textual difference — old text, new text, which words changed. This is the input the LLM will read.

The output is a complete, hierarchical description: "paragraph 2, sentence 4: old text 'I decided to keep the ring,' new text 'I couldn't let it go.' Also: paragraph 1, sentence 2: new sentence inserted."

This step is fast (~10-50ms), costs nothing, and produces clean structured input for the LLM.

```typescript
interface ChangeDetectionOutput {
  /** Structural changes at the paragraph level */
  structuralChanges: {
    type: 'insertion' | 'deletion' | 'reorder';
    oldIndex?: number;
    newIndex?: number;
  }[];

  /** Content changes within existing paragraphs */
  contentChanges: Array<{
    paragraphIndex: number;

    /** Sentence-level changes within this paragraph */
    sentenceChanges: Array<{
      sentenceIndex: number;
      changeType: 'modified' | 'inserted' | 'deleted';
      oldText?: string;
      newText?: string;
      /** Word-level diff for modified sentences */
      wordDiff?: Array<{
        type: 'unchanged' | 'added' | 'removed';
        text: string;
      }>;
    }>;

    /** Mechanical metrics (useful for the Haiku pre-filter and logging) */
    textChangeRatio: number;   // 0-1: fraction of paragraph text changed
  }>;

  /** Index remapping if structural changes occurred */
  indexRemap?: Map<number, number>;  // old paragraph index -> new paragraph index
}
```

#### Step 2: Change Understanding (Sonnet Call -- The Core Intelligence)

This is the heart of the system. A single Sonnet call receives the raw diff from Step 1 alongside the relevant profile context and produces a nuanced reading of what the edit means.

**Input to the Sonnet call**:
- The raw diff from Step 1 (old text -> new text for each changed sentence)
- The changed sentence's existing profile data (understanding, analysis, tags, connections)
- The paragraph's role and structural context (from ProfileIndex)
- A compact summary from the North Star (the sentence's structural role, through-line relevance)
- If available: conversation insights about the student's intent for this edit

**The LLM produces three layers of output in one integrated call:**

**Significance Assessment**: Not a word count ratio but a contextual judgment. "This is a single word change ('decided' -> 'couldn't') but it's in the fulcrum sentence and shifts the essay's theory of agency. High significance." Or: "Three sentences were rewritten in P3 but the paragraph's role and emotional register are unchanged — the student polished the prose without altering the meaning. Moderate significance."

The assessment considers:
- Where the change is (thesis sentence vs transitional detail vs sensory description)
- What structural role the sentence plays (fulcrum, setup, payoff, bridge, atmosphere)
- Whether the change alters the sentence's function or just its expression
- Whether key meaning-carrying words changed (nouns/verbs) vs modifiers (adjectives/adverbs)
- Whether the change connects to or disconnects from other parts of the essay

**Change Type Classification**: The LLM categorizes the change with nuance that syntactic analysis cannot:

| Change Type | Description | Example (diamond essay) |
|-------------|-------------|------------------------|
| **Refinement** | Same meaning, better execution | "walked" -> "drifted" where drifting serves the essay's dreamlike quality |
| **Deepening** | The sentence now carries more weight | Adding "his practiced fingers" — a sensory detail that grounds the pawnshop scene |
| **Meaning evolution** | The sentence communicates something different | "decided" -> "couldn't" — rational agency to emotional compulsion |
| **Voice/tone shift** | Same content, different register | "The experience was impactful" -> "That moment cracked something open" |
| **Structural reorganization** | Paragraphs moved, split, merged | Student reorders the pawnshop scene to open with the diamond, not the lights |
| **Simplification** | Content removed or compressed | Cutting the grandfather's backstory to a single sentence |
| **Expansion** | New content added | Adding a new paragraph about the grandmother's reaction |

These are not mutually exclusive. A change can be both a deepening and a voice shift. The LLM captures the full character of the change.

**Apparent Purpose**: A tentative inference about WHY the student made this change: "The student seems to be softening the essay's rational framework — three changes in this paragraph all move from analytical language to felt language." This inference is tagged as tentative. If the student discusses the edit in the Conversational Workshop, their stated intent supersedes this inference.

#### Step 3: Profile Mapping (Same Sonnet Call)

With its understanding of the change in hand, the LLM maps the impact to the profile. This happens in the same call as Step 2 — the LLM has all the context it needs.

**Connection impact**: For each connection involving the changed sentence, the LLM judges the effect:
- "The setup-payoff connection to P5S4 is NOT broken — the ring is still being kept. But the NATURE of the payoff changed. The connection transforms rather than breaks."
- "The echo connection to P1S3 is strengthened — 'couldn't' echoes the grandmother's emotional attachment."
- "No impact on the contrast connection to P4S2."

This is qualitatively different from mechanical graph traversal, which can only say "this sentence has 3 connections, therefore check 3 sentences." The LLM understands WHETHER and HOW each connection is affected.

**Paragraph-level impact**: Does the change alter the paragraph's role, emotional register, or structural function? "Paragraph 4's role as the fulcrum is preserved, but its emotional quality shifted from resolve to vulnerability."

**Holistic impact**: Does this ripple into essay-level understanding? "This change affects the thematic architecture — the essay's thesis shifts from 'choosing inherited values' to 'being unable to escape inherited values.' It affects voice identity — the rational register of 'decided' is replaced by the emotional register of 'couldn't.'"

**What does NOT need updating**: Equally important — the LLM identifies what is unaffected. "Paragraph 1's understanding is unaffected. The connection graph structure is intact. The emotional earned-ness map for P4's climax is actually STRENGTHENED."

#### Step 4: Scope Recommendation (Same Sonnet Call, Final Output)

Based on everything above, the LLM recommends the analysis scope with reasoning:

**Sentence-level update**: "This change is well-contained. Update P2S4's understanding and check its two connections. No holistic work needed." -> Cost: ~$0.02-0.04

**Paragraph-level re-analysis**: "The voice shift across three sentences changes how this paragraph functions. Re-walk paragraph 2's understanding." -> Cost: ~$0.05-0.10

**Targeted holistic refresh**: "The meaning evolution in the fulcrum sentence alters the thematic architecture and voice identity. Update the changed sentence, its connections, and refresh those two holistic sections." -> Cost: ~$0.08-0.15

**Comprehensive re-analysis**: "The student inserted a new paragraph and reordered two others. The essay's structural skeleton changed." -> Cost: ~$0.15-0.50

The scope recommendation includes reasoning that gets logged for the double-check loop and future calibration.

### The EditUnderstanding Type

```typescript
interface EditUnderstanding {
  /** Unique ID for this understanding (for version record tracking) */
  id: string;

  /** Timestamp */
  timestamp: number;

  /** The raw diff this understanding was derived from */
  changeDetection: ChangeDetectionOutput;

  /** Step 2: What the change MEANS */
  significance: {
    level: 'trivial' | 'low' | 'moderate' | 'high' | 'critical';
    reasoning: string;
    confidence: number;  // 0-1
  };

  changeTypes: Array<{
    type: 'refinement' | 'deepening' | 'meaning_evolution' | 'voice_shift'
        | 'structural_reorganization' | 'simplification' | 'expansion';
    description: string;
    /** Which specific change(s) this classification applies to */
    appliesTo: Array<{ paragraph: number; sentence: number }>;
  }>;

  apparentPurpose: {
    inference: string;
    confidence: number;  // 0-1
    /** Superseded if student explains their intent via workshop conversation */
    supersededByConversation: boolean;
  };

  /** Step 3: What profile sections are affected */
  profileMapping: {
    /** Direct impact -- always needs updating */
    directImpact: Array<{
      paragraph: number;
      sentence: number;
      impactType: 'understanding_stale' | 'understanding_wrong' | 'analysis_stale';
    }>;

    /** Connection impact -- which connections need verification */
    connectionImpact: Array<{
      connectionId: string;
      impact: 'broken' | 'transformed' | 'strengthened' | 'weakened' | 'unaffected';
      reasoning: string;
    }>;

    /** Paragraph-level impact -- does the paragraph's role/register change? */
    paragraphImpact: Array<{
      paragraphIndex: number;
      affected: boolean;
      description: string;
    }>;

    /** Holistic sections affected */
    holisticImpact: {
      voiceIdentity: boolean;
      thematicArchitecture: boolean;
      narrativeStrategy: boolean;
      emotionalTopography: boolean;
      characterRevelation: boolean;
      craftAssessment: boolean;
      admissionsPositioning: boolean;
      northStar: boolean;
    };

    /** What is explicitly NOT affected (the LLM's "all clear" for these areas) */
    unaffected: string[];
  };

  /** Step 4: Recommended analysis scope */
  scopeRecommendation: {
    scope: 'sentence' | 'paragraph' | 'holistic_refresh' | 'comprehensive';
    reasoning: string;
    /** Specific targets if scope is sentence or paragraph */
    targets?: Array<{ paragraph: number; sentence?: number }>;
    /** Which holistic sections to refresh if scope is holistic_refresh */
    holisticSections?: string[];
  };
}
```

### Cost Model

**Per-edit costs** (the full pipeline):

| Step | Cost | When |
|------|------|------|
| Haiku pre-filter | ~$0.001 | Every edit |
| Sonnet understanding call | ~$0.02-0.05 | Real content changes only |
| **Total per meaningful edit** | **~$0.02-0.05** | -- |

**Session cost estimates** (Edit Understanding pipeline only, not including re-analysis):

| Editing pattern | Haiku cost | Sonnet cost | Total |
|----------------|-----------|-------------|-------|
| 30 edits (20 trivial + 10 meaningful) | ~$0.02 | ~$0.30 | ~$0.32 |
| 50 edits (35 trivial + 15 meaningful) | ~$0.05 | ~$0.50 | ~$0.55 |
| Light session (10 edits, 7 trivial + 3 meaningful) | ~$0.01 | ~$0.10 | ~$0.11 |

**Debounce batching reduces cost further**: Rapid consecutive edits (within 1.5s) are collapsed into one understanding call. The Sonnet call processes the accumulated diff, not each individual keystroke.

**Cost control for very active editors**: After 10+ understanding calls in a session, the system groups subsequent edits into larger batches (5-minute windows) and processes them together. The workshop shifts from per-edit conversation to periodic check-ins: "You've been making a lot of changes to paragraphs 2 and 3 — want to talk about what you're working toward?"

### Escalation During Analysis

The system starts at the scope the Edit Understanding pipeline recommended, but can widen mid-analysis if the actual re-analysis work reveals broader impact than expected:

- A sentence-level update discovers that the meaning shift broke a connection to a thesis-carrying sentence -> escalates to targeted holistic refresh
- A paragraph re-walk produces back-propagations that cross the edit boundary -> escalates to comprehensive
- A holistic refresh reveals that the voice identity shifted fundamentally -> escalates to comprehensive

This is a safety net: the LLM's initial scope judgment is usually right, but when the actual analysis work uncovers surprises, the system widens rather than producing a stale profile.

**Circuit breaker** (review finding S10): If analysis crashes repeatedly on the same section (e.g., malformed Sonnet output), max 3 retries per checkpoint. After 3 failures, mark the analysis as failed with error details and alert the student: "We're having trouble analyzing this section." Do not loop.

### Integration with the Conversational Workshop

The Edit Understanding pipeline's output feeds directly into the workshop's conversational ability. Instead of "you made a change in P4S3," the workshop can say:

"You changed 'decided to keep the ring' to 'couldn't let it go.' That's interesting — 'decided' framed this as a rational choice you made. 'Couldn't' suggests something deeper, like the ring has a hold on you that's beyond reason. Is that what you're going for? Because that shift changes how your whole essay reads — instead of arguing for inherited values, you're showing how inherited attachments work on us even when we don't choose them."

This is the payoff of LLM-powered edit understanding. The workshop does not just notice the edit — it UNDERSTANDS it and can have an intelligent conversation about it.

### Edge Cases & Risks

**Multiple simultaneous changes across paragraphs**: The student makes changes to P1, P3, and P5 in one submission. The understanding call receives all three diffs together and can see cross-paragraph patterns: "All three changes move from analytical to felt language — the student is doing a voice revision, not fixing individual sentences." This holistic view is another advantage of LLM understanding over mechanical per-sentence analysis.

**Over-interpretation risk**: The LLM might read profound significance into a casual word swap. Mitigation: the understanding output includes a confidence level. Low-confidence interpretations are logged but do not trigger escalation unless confirmed by subsequent analysis or the student. The Conversational Workshop can ground-truth by asking the student.

**Under-interpretation risk**: The LLM might miss a subtle but important change buried among many edits. Mitigation: the double-check loop (Section B, Pathway 2) compares the edit understanding's assessment against re-analysis findings. Systematic under-interpretation is caught and calibrated.

**The "not" problem**: No longer a special case. The LLM naturally understands that adding "not" inverts meaning. It does not need a magnitude threshold to tell it this is significant — it reads the words and knows.

---

## Section B: Two-Pathway Edit Handling

### The Paradigm Shift

The old PLAN.md treated every edit as a trigger for analysis. The system was always reacting — detecting a change, classifying its impact, re-walking, re-analyzing. This creates three fundamental problems:

**Waste.** Most edits during active writing are exploratory. The student tries something, decides against it, tries something else. Analyzing each attempt burns cost and latency on versions that will not survive five minutes.

**Blindness.** Without conversation context, re-analysis stares at changed text and has to independently reconstruct what the student was trying to do. This is like reading a diff without the commit message — you can see WHAT changed but not WHY.

**Disruption.** Constant analysis results popping up while the student is actively editing breaks their creative flow.

The new design recognizes that editing an essay is a *process*, not a series of isolated events. Two distinct pathways match how students actually work:

```
+--------------------------------------+    +--------------------------------------+
| PATHWAY 1                            |    | PATHWAY 2                            |
| Conversational Edit Workshop         |    | Version-Based Re-Analysis            |
|                                      |    |                                      |
| Active while student is editing      |    | Triggered deliberately               |
| Light, responsive, conversational    |    | Student says "fresh read" or system  |
| Captures intent, not evaluation      |    | suggests it                          |
| Profile stays structurally sound     |    |                                      |
| Cost: ~$0.03-0.08/session            |    | Uses accumulated context from P1     |
|                                      |    | Full analytical depth                |
| Think: workshop assistant watching   |    | Cost: 20-40% cheaper than blind      |
| you write, asking "what are you      |    | re-analysis because it knows where   |
| going for?"                          |    | to focus and why things changed      |
+--------------------------------------+    +--------------------------------------+
                    |                                        |
                    |         +----------------+             |
                    +-------->| Version Record |<------------+
                              | (shared state) |
                              +----------------+
```

Think of a writing tutor. They do not stop you mid-sentence to analyze your grammar. They watch you write, ask "what are you going for there?" when something interesting happens, and when you put the pen down and say "what do you think?", they give you a considered, informed reading.

### When Does Each Pathway Activate?

| Situation | Pathway | Why |
|-----------|---------|-----|
| Student is actively editing | Pathway 1 automatically | Light-touch companion, does not interrupt flow |
| Student clicks "Get Fresh Analysis" | Pathway 2 | Deliberate request for deep re-read |
| System suggests re-analysis (cumulative changes, structural edits, declining reliability) | Pathway 2 (after student agrees) | Never auto-trigger; always a suggestion |
| Student has not requested analysis but profile is heavily stale | System suggests Pathway 2 | "My understanding is getting thin — a fresh analysis would help" |

The student can always trigger Pathway 2 manually, at any time, for any reason. Pathway 1 runs automatically but respects the student's editing rhythm.

### Pathway 1: Conversational Edit Workshop

The student is in the editor. They change "walked" to "drifted." What happens?

#### Significance Detection (Deterministic -- No LLM)

Per review finding S3, significance detection in Pathway 1 is deterministic, not LLM-based. This keeps the per-edit cost near zero:

1. **Diff ratio**: How much text changed? A single word in a 20-word sentence = low. Three sentences rewritten = high.
2. **ProfileIndex tag lookup**: Does the changed sentence carry structurally important tags? Tags like `thesis`, `fulcrum`, `voice:defining`, `connection:setup-payoff` elevate significance. An unmarked transitional sentence stays low.

The combination produces a significance score. Below threshold -> log silently. Above threshold -> generate a nudge.

**Not every change gets a comment.** Most word swaps in unremarkable sentences are logged silently — the system notes the change in the version record but says nothing. The student is not interrupted.

#### Adaptive Engagement Threshold

The threshold for generating a nudge is adaptive, matching the student's editing rhythm:

- **Early in session** (few changes): Lower threshold — each change is relatively significant
- **During rapid editing** (many changes in short time): Higher threshold — the student is in a flow state and should not be interrupted
- **After student engages** (responds to a nudge, asks follow-up): Lower threshold — the student wants conversation
- **After student ignores** (5+ nudges with no response): Higher threshold — respect the student's preference
- **Session boundary reset** (review finding M3): If the student leaves and returns the next day, the threshold resets. The version record persists, but editing rhythm restarts. A student who left mid-flow-state with a high threshold returns fresh.

#### Nudge Generation (Haiku -- Cheap)

Per review finding S3, nudge generation uses Haiku, not Sonnet. A nudge is a simple conversational question, not deep analysis:

"I noticed you changed the ending of your third paragraph — the one that carries the turn in your narrative. Tell me what you're going for with the new version?"

Haiku generates this from: the sentence's ProfileIndex tags + the change type (from the deterministic classification) + a template. Cost: ~$0.002 per nudge.

#### Response Processing (Sonnet -- When Student Engages)

When the student responds to a nudge, the response goes through Sonnet processing. This is where real intelligence lives:

- **Insight extraction** (review finding S2): Haiku does both L6 classification AND insight taxonomy in a single call. The classification drives Profile Manager action (confirmation, reinterpretation, new context, correction, preference, clarification, emotional reaction, resistance). The insight taxonomy enriches the version record.
- **Workshop conversation**: If the student asks a follow-up or seems uncertain, Sonnet draws on existing profile understanding to help them think through the change. "Your original ending created a sharp contrast with paragraph 4's opening. The new version softens that contrast — which could work if you want a more gradual emotional transition. Does that match what you're going for?"

No scoring, no evaluation in the conversation — just helping the student think.

#### Light-Touch Profile Updates (Minimal, Defensive)

When the student edits through Pathway 1, the essay text has changed but the profile has not been re-analyzed. The conversational pathway makes minimal, defensive adjustments to keep the profile coherent without doing real analysis.

**What gets updated immediately** (mechanical, not analytical):
- **Sentence text references**: If the profile references the text of a changed sentence, the reference is updated to the new text
- **Structural bookkeeping**: If sentences are added or deleted, the paragraph's sentence count and indices are adjusted. Connection references are remapped if their endpoints moved.
- **Staleness markers**: Changed sentences and their connected sentences get flagged as "stale"

**Staleness depth limits** (review finding S1): In well-connected essays, unrestricted staleness propagation marks half the profile stale after a few edits. This degrades fastest for the students who benefit most (strong essays with rich connections). The fix:

| Staleness depth | Strength | Effect on re-analysis suggestion |
|----------------|----------|----------------------------------|
| Direct (the changed sentence) | Strong | Counts toward suggestion threshold |
| 1-hop connection | Moderate | Counted at 0.5x weight |
| 2-hop connection | Weak/informational | Logged but does not count toward threshold |

Re-analysis suggestions trigger on strong-staleness count, not total staleness.

**What gets a light adjustment** (when conversation context exists):
- **Inferred intents**: If the student explained their intent behind a change, the sentence's `inferredIntents` can be updated with the student's own words. The student is the authority on their own intent.
- **Version record notes**: If the workshop detected that a change aligns with or contradicts the essay's existing voice/theme (a cheap check against the ProfileIndex), a note is added to the version record for re-analysis to verify.

**What does NOT get updated**:
- Effectiveness scores, strength/weakness assessments, or any evaluative analysis. These require the LLM to actually read and judge the new text.
- Holistic sections (voice identity, thematic architecture, narrative strategy). These are too interconnected to update partially.
- Connection semantics. If a connection existed based on a shared metaphor and the student changed one endpoint, the system flags the connection as "needs verification" but does not decide whether it still holds.

The philosophy is: **keep the profile structurally sound and honestly marked** (we know what is stale, we know what the student intended), rather than attempting analytical updates that might be wrong. Light-touch adjustments are hypotheses, not conclusions. Re-analysis will verify them.

**Concurrency model** (review finding M8): Light-touch updates (text reference updates, staleness markers) use per-sentence row-level updates on `essay_sentence_analyses` — no profile-level optimistic lock needed. Only Profile Manager analytical mutations (from re-analysis) use the optimistic write lock. This means two browser tabs editing different paragraphs through Pathway 1 will not conflict unnecessarily.

#### Pathway 1 Cost Model (Revised per Review Finding S3)

| Component | Cost | Frequency |
|-----------|------|-----------|
| Significance detection | Free (deterministic) | Every edit |
| Haiku nudge generation | ~$0.002 | ~3-5 per session |
| Sonnet response processing | ~$0.01-0.02 | ~2-3 per session (only when student engages) |
| Haiku insight extraction | ~$0.001 | Per student message |
| **Total per session** | **~$0.03-0.08** | -- |

This is dramatically cheaper than the old "analyze every edit" model, and the student gets a more natural experience.

### Pathway 2: Version-Based Re-Analysis

The student says "I'm ready for a fresh read" — or the system suggests it. By this point, the system has accumulated a rich context of what changed, why, and what the student was trying to achieve. Re-analysis is therefore *cheaper* (it knows where to focus), *better* (it understands the student's intent behind changes), and *more trustworthy* (it can double-check its own light-touch adjustments from Pathway 1).

#### The Re-Analysis Brief

The version record gets distilled into a re-analysis brief — a structured summary injected into the re-analysis prompts. It answers four questions for the LLM:

1. **What changed?** A structured diff at the paragraph and sentence level — not character-by-character, but semantically meaningful. "P2S4: word swap, 'walked' to 'drifted'. P3S5: full sentence rewrite. P1: new sentence inserted after S2."

2. **Why did it change?** The student's stated intents, quoted from conversations. "Student's goal for P3 rewrite: 'I want the reader to feel the weight of the diamond before I talk about what it means.'" Where no intent was captured: "No conversation context — student edited without discussion."

3. **What did we already tentatively assess?** The light-touch adjustments and staleness flags. "P2S4's intent was tentatively updated to 'dreamlike transition.' P3S5 is marked fully stale — no light-touch assessment attempted. The connection between P1S1 and P5S4 is flagged for verification."

4. **What is structurally significant about the changed areas?** (Review finding C3) Populated from the North Star's structural roles map. "P4S3 is the essay's fulcrum — the moment the student chooses to keep the ring. P2S4 bridges the pawnshop scene and the reflection. P1S2 establishes the sensory grounding." This prevents re-analysis from having to rediscover structural significance it already knows.

This brief replaces the blind "here's a changed essay, figure it out" approach. The LLM starts from a position of knowledge, not ignorance.

```typescript
interface ReAnalysisBrief {
  /** What changed since last analysis */
  changes: ChangeEntry[];

  /** Student's stated intents from workshop conversations */
  intents: Array<{
    changeRef: string;        // References a ChangeEntry.id
    studentStatement: string; // Quoted from conversation
    insightCategory: string;  // confirmation, reinterpretation, new_context, etc.
  }>;

  /** Light-touch adjustments made during Pathway 1 */
  lightTouchLog: LightTouchAdjustment[];

  /** Staleness summary -- what parts of the profile are how stale */
  stalenessMap: Array<{
    paragraph: number;
    sentence: number;
    depth: 'direct' | '1-hop' | '2-hop';
    staleSince: number;       // Timestamp
  }>;

  /** North Star structural context for changed areas */
  structuralSignificance: Array<{
    paragraph: number;
    sentence?: number;
    structuralRole: string;   // "fulcrum", "setup", "bridge", "payoff", etc.
    throughLineRelevance: string; // How this relates to the essay's central element
  }>;

  /** Conversation insights collected since last analysis */
  conversationInsights: Array<{
    category: string;
    scope: { paragraph: number; sentence?: number };
    content: string;
    confidence: number;
  }>;
}
```

#### How Accumulated Context Makes Re-Analysis Better

The re-analysis brief is not just cheaper — it is fundamentally more informed:

**Mode selection becomes more precise.** Changes that would have been classified as "ambiguous — default to comprehensive" can now be confidently routed to focused mode because we know from conversation context that the student was working on voice in one paragraph, not restructuring the essay. The conversation context acts as a free impact classifier, often more accurate than any algorithmic classification because it has the student's own words about their intent.

**Focused analysis prompts are better targeted.** Instead of "re-analyze P2," the prompt says "P2S4 changed from 'walked' to 'drifted' — the student said they want a dreamlike quality connecting to the fog imagery in P5. Evaluate whether 'drifted' achieves this and whether it changes the connection to P5S2." The LLM's analysis is surgically precise because it knows what to look for.

**Estimated savings**: 20-40% reduction in re-analysis cost for sessions where the student actively engaged with the conversational workshop.

#### The Double-Check Loop

After re-analysis completes, the system has two readings of the changed areas: the light-touch adjustments from Pathway 1 (quick, conversational, hypothesis-level) and the full re-analysis from Pathway 2 (thorough, LLM-evaluated, authoritative).

The double-check compares them:

**Agreement**: The light-touch adjustment said "P2S4's change strengthens the dreamlike quality" and re-analysis confirmed "drifted creates a dissociative quality that enhances the reflective tone." These align — the light-touch system's judgment was sound.

**Disagreement — light-touch missed something**: Re-analysis discovered that the word change in P2S4 actually broke a subtle rhythmic pattern that connected P2 to P4's pacing. The light-touch system did not catch this because it does not analyze craft at the inter-paragraph level. This is expected — it is exactly why re-analysis exists.

**Disagreement — light-touch was wrong**: The light-touch system flagged P3's rewrite as "likely improves the metaphor's physicality" based on the student's stated intent. Re-analysis found the rewrite actually made the metaphor more abstract — the student's intent did not match their execution. This is valuable feedback both for the student ("you wanted this to be more physical, but the new version moved in the opposite direction") and for system calibration.

Over time, the double-check results reveal patterns in the light-touch system's accuracy — structured comparison records ("light-touch predicted X, re-analysis found Y, delta = Z") that inform threshold tuning and prompt adjustment.

#### When to Suggest Re-Analysis

The student can always trigger re-analysis manually. But the system should also suggest it at the right moments.

**Signal-based suggestions**:
- **Cumulative change volume**: "You've edited 8 sentences across 3 paragraphs since your last analysis. Want a fresh read to see how it all fits together?" The threshold is adaptive per student — a student who typically makes 20 changes before requesting analysis has a higher threshold than one who requests after every 3.
- **Structural change**: "You added a new paragraph — the essay's structure has shifted. A fresh analysis would help me understand how everything flows now." Structural changes almost always warrant re-analysis; the suggestion is a strong nudge.
- **Thesis-area changes**: "You rewrote the sentence I identified as thesis-carrying. That's a significant change — want me to re-read with fresh eyes?" Changes to the essay's most structurally important elements get faster suggestions.
- **Declining profile reliability**: If strong-staleness markers pile up, the system recognizes its own declining reliability: "I've been tracking your changes but my understanding is getting thin. A fresh analysis would give us both a clearer picture."

**Anti-annoyance safeguards**:
- Never suggest more than once per editing session without the student making additional changes
- Never suggest during a rapid editing burst (respect the flow state)
- If the student dismisses a suggestion, wait for at least 5 more changes before suggesting again
- Frame suggestions as helpful, not prescriptive: "When you're ready" not "You should"

### TypeScript Types

```typescript
interface ChangeEntry {
  id: string;
  timestamp: number;

  /** Location of the change */
  location: {
    paragraph: number;
    sentence?: number;  // Undefined for paragraph-level structural changes
  };

  /** The actual change */
  oldText: string;
  newText: string;

  /** Deterministic classification from Pathway 1 significance detection */
  changeCategory: 'word_swap' | 'sentence_rewrite' | 'paragraph_rewrite'
                 | 'insertion' | 'deletion' | 'structural';

  /** Tags from ProfileIndex at time of change (for significance context) */
  sentenceTags?: string[];

  /** Optional: intent annotation from workshop conversation */
  intentAnnotation?: {
    studentStatement: string;
    insightCategory: string;
    conversationTimestamp: number;
  };
}

interface LightTouchAdjustment {
  timestamp: number;

  /** What was adjusted */
  target: {
    paragraph: number;
    sentence: number;
    field: 'text_reference' | 'index_remap' | 'staleness_marker'
         | 'inferred_intent' | 'connection_flag';
  };

  /** What the adjustment was */
  adjustment: string;

  /** Whether this was purely mechanical or based on conversation context */
  basis: 'mechanical' | 'conversation_derived';

  /** For double-check loop -- was this verified by re-analysis? */
  verified?: {
    reAnalysisRunId: string;
    agreement: 'confirmed' | 'missed_additional' | 'contradicted';
    details?: string;
  };
}

interface VersionRecord {
  id: string;

  /** Essay ID this version belongs to */
  essayId: string;

  /** Analysis run IDs that bookend this version */
  previousAnalysisId: string | null;  // null for first version
  nextAnalysisId: string | null;      // null until re-analysis runs

  /** Essay text at the start of this version (checkpoint) */
  baselineText: string;

  /** Running list of changes since baseline */
  changes: ChangeEntry[];

  /** Conversation insights collected during this version */
  conversationInsights: Array<{
    id: string;
    category: string;
    scope: { paragraph: number; sentence?: number };
    content: string;
    confidence: number;
    timestamp: number;
    /** Durability for cross-session persistence */
    durability: 'ephemeral' | 'draft_durable' | 'essay_durable' | 'student_durable';
  }>;

  /** Log of all light-touch profile adjustments */
  lightTouchLog: LightTouchAdjustment[];

  /** Re-analysis brief (populated when Pathway 2 is triggered) */
  reAnalysisBrief?: ReAnalysisBrief;

  /** Version lifecycle */
  createdAt: number;
  closedAt?: number;  // Set when re-analysis completes
  status: 'active' | 'closed' | 'failed';
}
```

---

## Section C: Version Tracking

### What a "Version" Is

A version is not every keystroke, and it is not every save. A version is the accumulated state of the essay between two analysis points — the text the student had when analysis last ran, and the text they have now. But the text is only half the story. A version also carries a changelog with intent annotations — a structured record of what changed and, crucially, why.

Think of it as the space between two commits. The version record is the diff, the commit messages, the PR comments, and the code review notes — everything that happened between the two states.

### What Gets Stored

The version record grows incrementally as the student edits. Each component serves a specific purpose:

| Component | What it captures | Size estimate | Purpose |
|-----------|-----------------|---------------|---------|
| **Baseline text** | Essay text at last analysis checkpoint | ~2-4KB | Enables full diff computation for re-analysis brief |
| **Change entries** | Each edit with timestamp, location, old/new text, type, optional intent | ~200-500 bytes each | The changelog — what physically happened |
| **Conversation insights** | Categorized student statements with scope and confidence | ~100-300 bytes each | The commit messages — why things happened |
| **Light-touch log** | Profile adjustments made during Pathway 1 | ~100-200 bytes each | Hypotheses for the double-check loop |

**Storage size estimate**: Even a student who makes 50 changes between analyses, with 10 conversation exchanges, produces a version record under 20KB. This is negligible — a single essay profile is 50-200KB.

### Version Lifecycle

```
+---------------------------------------------------------------------+
| Analysis Run #1 completes                                           |
|   -> Version V1 CREATED (status: active)                            |
|   -> baselineText = essay text at analysis completion                |
|   -> previousAnalysisId = run #1                                    |
|                                                                     |
| Student edits...                                                    |
|   -> changes[] grows with each edit                                  |
|   -> conversationInsights[] grows with each workshop exchange        |
|   -> lightTouchLog[] grows with each profile adjustment              |
|                                                                     |
| Student requests re-analysis (or system suggests and student agrees) |
|   -> reAnalysisBrief computed from accumulated version data          |
|   -> Analysis Run #2 begins, using the brief                        |
|   -> Analysis Run #2 completes                                      |
|   -> Version V1 CLOSED (status: closed, closedAt set)               |
|   -> nextAnalysisId = run #2                                        |
|   -> Version V2 CREATED (status: active)                            |
|   -> V2.baselineText = essay text at run #2 completion              |
|   -> V2.previousAnalysisId = run #2                                 |
|                                                                     |
| Cycle continues...                                                  |
+---------------------------------------------------------------------+
```

**Cross-session persistence**: Version records persist across sessions. If the student leaves and comes back tomorrow, the active version record is still there with all accumulated changes and insights. The conversational workshop picks up where it left off. The engagement threshold resets (review finding M3), but the version data does not.

**Pruning**: Closed version records are retained for the double-check calibration loop but are not loaded into active memory. After re-analysis verifies light-touch adjustments and produces comparison records, the closed version's raw data is archived. Only the comparison records (for calibration) and conversation insights tagged as `essay_durable` or `student_durable` persist in active storage.

### Version Comparison: Beyond Text Diffs

When re-analysis runs, it does not just compare text. The version record enables a much richer comparison:

**Text diff** (what changed): Computed from baseline text vs current text. The change entries provide the granular history, but the final diff is what matters for re-analysis.

**Intent diff** (why it changed): Which changes have conversation context and which do not. Changes with known intent can be analyzed more precisely — the LLM evaluates whether the execution matches the intent. Changes without intent need independent investigation.

**Profile evolution** (what the profile did): The light-touch log shows how the profile was adjusted during Pathway 1. Re-analysis verifies these adjustments, producing the double-check comparison records.

**Pattern recognition** (how the student worked): The change entries reveal editing patterns:
- All changes in one paragraph -> focused rewrite, rest of essay stable
- Changes concentrated on voice-carrying sentences -> voice revision
- Mix of additions and deletions -> structural experimentation
- Many small word swaps -> polishing pass

These patterns inform mode selection for re-analysis. A focused rewrite in one paragraph -> partial comprehensive for that paragraph, focused for the rest. A polishing pass across the essay -> focused mode for each changed sentence.

### Net Change Computation

The version record captures every individual edit, but re-analysis cares about the NET change. A student who changes a sentence three times (A -> B -> C -> D) creates three change entries, but the re-analysis brief presents the net result: "P2S4 changed from A to D."

**Reverted changes**: If the student changes a sentence and then changes it back (A -> B -> A), the net change is zero. The re-analysis brief notes this: "P2S4 was edited but returned to its original form." The conversation insight ("student considered changing this but decided against it") is still captured and potentially valuable — it reveals something about the student's relationship to that sentence.

**Partially reverted changes**: The student changes "I walked to my desk" -> "I drifted to my desk" -> "I drifted toward my desk." Two change entries, net result: "walked" -> "drifted toward." The re-analysis brief presents the net change, but the version record preserves the intermediate step in case the double-check loop needs the full history.

### Database Storage

Version records map to the `essay_version_records` table (per review finding C1):

```typescript
// Database table: essay_version_records
// One row per change entry -- lightweight, append-only during editing
interface VersionRecordRow {
  id: string;                        // UUID
  essay_id: string;                  // FK to essays
  user_id: string;                   // Clerk user ID (TEXT, not UUID)
  version_id: string;               // Groups rows into a version
  previous_analysis_id: string | null;
  next_analysis_id: string | null;

  // The baseline text is stored once per version (first row or separate table)
  baseline_text?: string;

  // Change entry data
  entry_type: 'change' | 'conversation_insight' | 'light_touch_adjustment';
  paragraph_index: number;
  sentence_index: number | null;
  old_text: string | null;
  new_text: string | null;
  change_category: string | null;
  intent_annotation: object | null;  // JSONB
  insight_data: object | null;       // JSONB (for conversation insights)
  adjustment_data: object | null;    // JSONB (for light-touch log entries)

  // Lifecycle
  created_at: timestamp;
  status: 'active' | 'closed' | 'failed';

  // Double-check verification (populated after re-analysis)
  verification: object | null;       // JSONB
}
```

**Why per-entry rows instead of a single JSONB blob**: Each change entry is appended independently during editing. Per-row storage means no read-modify-write cycle, no contention from concurrent edits (review finding M8), and the ability to query individual changes ("show me all changes to paragraph 2 since last analysis") without loading the entire version record.

**RLS**: Standard user-scoped RLS. `WHERE user_id = auth.uid()` on all queries.

### Edge Cases

**Failed re-analysis**: If re-analysis fails (crashes, timeout, budget exceeded), the version record stays active (`status: 'active'`). The student can continue editing, and the version record continues accumulating. The next re-analysis attempt uses the full accumulated context. The failed attempt is logged but does not close the version.

**Very long versions**: A student who makes 200+ changes without requesting re-analysis produces a large version record. The re-analysis brief summarizes rather than includes every change — grouping by paragraph, presenting net changes, and surfacing the most significant conversation insights. The full change log is available for the double-check loop but does not bloat the re-analysis prompt.

**First analysis**: Before the first analysis, there is no previous analysis and no baseline text. The version record for the first version is created when the student starts editing (baseline = empty or initial text). The first analysis does not use a re-analysis brief — it runs the full pipeline from scratch.

---

## Section D: Analysis Modes -- Comprehensive vs Focused (Updated)

The old Analysis Modes section used a Haiku impact classifier to decide between Comprehensive and Focused modes. That classifier is replaced by the Edit Understanding Pipeline's scope recommendation. The two-pathway model also changes when and how each mode is triggered.

### Why Two Modes (Unchanged Rationale, Updated Mechanism)

As the profile gets deeper, re-analysis should get **narrower but MORE surgical**. A comprehensive profile IS your depth — you do not need to re-earn it every round. You need to LEVERAGE it as the foundation for focused, precise analysis of what actually changed.

The difference from the old design: mode selection is no longer a function of mechanical text change ratios and profile confidence levels alone. The Edit Understanding Pipeline's Sonnet-powered scope recommendation provides genuinely informed mode selection — the system has already UNDERSTOOD the change before deciding how to analyze it.

### Mode Decision Logic (Updated)

```typescript
function selectAnalysisMode(
  profile: EssayProfile,
  editUnderstanding: EditUnderstanding | null,
  versionRecord: VersionRecord | null,
): 'comprehensive' | 'focused' {
  // ── No existing deep profile -> comprehensive (nothing to leverage) ──
  if (profile.index.confidenceLevel === 'initial' ||
      profile.index.confidenceLevel === 'developing') {
    return 'comprehensive';
  }

  // ── No edit understanding (first analysis, or manual trigger without
  //    going through the Edit Understanding Pipeline) -> comprehensive ──
  if (!editUnderstanding) {
    return 'comprehensive';
  }

  // ── Edit Understanding scope recommendation drives the decision ──
  const scope = editUnderstanding.scopeRecommendation.scope;

  // Comprehensive scope recommended by Edit Understanding Pipeline
  if (scope === 'comprehensive') {
    return 'comprehensive';
  }

  // Structural changes always go comprehensive, regardless of scope rec
  // (safety net — the pipeline should already recommend comprehensive,
  //  but structural changes are too important to risk a focused miss)
  if (editUnderstanding.changeDetection.structuralChanges.length > 0) {
    return 'comprehensive';
  }

  // Conversation context can NARROW scope: if the version record has
  // student-stated intents explaining the changes, we can be more
  // confident that focused mode will catch everything
  const hasConversationContext = versionRecord?.conversationInsights
    .some(i => i.confidence > 0.7) ?? false;

  // High-significance changes without conversation context ->
  // default to comprehensive (we don't fully understand the intent)
  if (editUnderstanding.significance.level === 'critical' &&
      !hasConversationContext) {
    return 'comprehensive';
  }

  // Holistic refresh recommended -> comprehensive (but targeted)
  // The re-analysis will use the scope rec's holisticSections list
  // to focus only on affected holistic sections
  if (scope === 'holistic_refresh') {
    // Comprehensive, but the re-analysis brief narrows the actual work
    return 'comprehensive';
  }

  // Sentence or paragraph scope with deep profile -> FOCUSED
  if (scope === 'sentence' || scope === 'paragraph') {
    return 'focused';
  }

  // Default: comprehensive (safe)
  return 'comprehensive';
}
```

**Key change from old design**: The old `selectAnalysisMode` checked `textChangeRatio > 0.30` and counted significant rewrites. Those mechanical thresholds are gone. The Edit Understanding Pipeline has already read the actual words and judged significance contextually. A 50% text change ratio that preserves paragraph function routes to focused mode. A 3% text change ratio that shifts the thesis routes to comprehensive.

### Comprehensive Mode (Updated for Two-Pathway Integration)

Comprehensive mode runs the full pipeline subset appropriate for re-analysis: L1 re-impressions for changed paragraphs, Connection Scout refresh, L3 Understanding re-walk from the edit point, L3.75 Holistic Synthesis refresh, L3.5 Analysis Pass for affected paragraphs, L4+L5 re-crystallization and feedback.

**What is NEW**: The re-analysis brief is injected into every re-analysis prompt. The LLM is not discovering changes from scratch — it knows what changed, why the student changed it (when intent is available), and what structural roles the changed areas play.

**When triggered**:
- First analysis (no prior profile)
- Pathway 2 re-analysis when Edit Understanding recommends comprehensive scope
- Structural edits (insertion, deletion, reorder)
- Critical significance edits without conversation context
- Profile confidence below 'deep'

**Structural edit handling** (from old "Incremental Update" section, updated):

**Paragraph insertion** (e.g., new P3 inserted between old P2 and P3):
1. Remap ALL indices via `essayProfileManager.remapIndices()`
2. New paragraph gets full L1 first impressions
3. Re-run Connection Scout on full essay (new paragraph may connect to anything)
4. RE-WALK from the inserted paragraph forward (new P3 -> P4 -> P5 -> P6)
5. Back-propagations to P1-P2 applied as normal
6. Full L3.5 re-analysis (structural change affects every paragraph's effectiveness)
7. Re-crystallize + re-annotate
8. Re-analysis brief provides: why the student added this paragraph (if discussed), what the surrounding paragraphs' structural roles are

**Paragraph deletion** (e.g., P3 removed):
1. Remove P3's profile entry and all connections with P3 as an endpoint
2. Remap indices via `essayProfileManager.remapIndices()`
3. Re-run Connection Scout (connections through deleted paragraph may be orphaned)
4. RE-WALK from the deletion point forward (new P3 -> P4 -> P5)
5. Full L3.5 re-analysis
6. Re-crystallize + re-annotate (holistic sections likely shifted significantly)
7. Re-analysis brief provides: why the student deleted it (if discussed), what connections are now orphaned

**Paragraph reorder** (e.g., P2 and P4 swapped):
1. Remap all indices, connectionRefs, Profile Index
2. Re-run Connection Scout
3. Full re-walk from the earliest moved paragraph (the sequential understanding is broken)
4. Full L3.5 re-analysis
5. Re-crystallize + re-annotate
6. Cost: nearly equivalent to full analysis (~$0.40-0.80)
7. Re-analysis brief provides: what the student hoped to achieve with the reorder

**Index remapping implementation** (`essayProfileManager.ts`):
```typescript
function remapIndices(profile: EssayProfile, mapping: Map<number, number>): void {
  // Remap connection endpoints
  for (const conn of profile.connections.all) {
    conn.from[0] = mapping.get(conn.from[0]) ?? conn.from[0];
    conn.to[0] = mapping.get(conn.to[0]) ?? conn.to[0];
  }
  // Remap connectionRefs on sentences (IDs don't change, but paragraph indices do)
  // Remap Profile Index paragraphDigest entries
  // Remap holistic section references (pivotPoints, peakMoments, etc.)
  // Remap strengthsFound/weaknessesFound paragraph references
}
```

### Focused Mode (Updated to Use Edit Understanding Pipeline)

Focused mode is NOT "cheaper comprehensive" — it is a fundamentally different analytical lens. **More magnification, narrower aperture.** The LLM's depth-per-token is HIGHER because it is not spreading across the full essay.

**When triggered**: Edit Understanding recommends sentence or paragraph scope AND profile confidence is 'deep' or 'comprehensive'.

**The Focused Mode Pipeline (Updated)**:

```
1. EDIT UNDERSTANDING (already completed -- from Section A)
   The Edit Understanding Pipeline has already run. We have:
   - Significance assessment (contextual, not mechanical)
   - Change type classification (refinement, deepening, meaning_evolution, etc.)
   - Profile mapping (what is affected, what is NOT)
   - Scope recommendation (sentence or paragraph)
   This REPLACES the old Step 2 "Impact Classification (Haiku, ~$0.002)"

2. FOCUSED UNDERSTANDING UPDATE (single Sonnet call, ~$0.02-0.04)
   Input:
   - The changed sentence's CURRENT understanding from the profile
     (observation labels [U1], [U2] rendered for reference)
   - The specific text change (old -> new)
   - The Edit Understanding's significance + change types + apparent purpose
   - Relevant profile context loaded via Profile Router based on the
     Edit Understanding's profile mapping (not generic impact classification):
     paragraph understanding, connected sentences, relevant holistic sections
   - The re-analysis brief (if triggered via Pathway 2)

   Prompt:
   "Here is P2S4's CURRENT understanding from the profile:
    [U1] 'Transitions the reader from the pawnshop to the writing desk'
    [U2] 'Slows the pacing to signal reflection'

    The student changed: 'I walked to my desk' -> 'I drifted to my desk'

    Edit Understanding assessment: Refinement + voice shift. The word
    'drifted' introduces a dreamlike quality that aligns with the fog
    imagery in P5. Moderate significance — the sentence's transitional
    function is preserved but its emotional register changed.

    Student's stated intent (from workshop): 'I wanted it to feel more
    dreamlike, connecting to the fog in paragraph 5.'

    Given the profile context:
    - How does this word change affect P2S4's understanding?
    - Does 'drifted' change any connections, voice reading, or thematic contributions?
    - Does this ripple beyond P2S4? If so, what SPECIFICALLY changes?"

   Output:
   - Updated understanding for the changed sentence (supersession)
   - Ripple flags: { beyondSentence: boolean; beyondParagraph: boolean;
     holisticShift: boolean; specificRipples: string[] }
   - Any new/removed connections

3. FOCUSED ANALYSIS UPDATE (single Sonnet call, ~$0.02-0.04)
   Input:
   - Updated understanding from step 2
   - Previous analysis for the changed sentence
   - Current improvement phase
   - The Edit Understanding's change types (so the analysis knows WHAT
     kind of change to evaluate, not just that something changed)

   Prompt:
   "P2S4's understanding was updated: [new understanding].
    Previous analysis: effectiveness 72, weakness: 'walked is generic.'
    Change type: refinement + voice shift.

    Re-evaluate P2S4 with the new word choice.
    Does the weakness resolve? Any new strengths?
    Does paragraph-level effectiveness shift?"

   Output:
   - Updated analysis for the changed sentence (supersession)
   - Paragraph-level effectiveness delta (if any)

4. RIPPLE HANDLING (conditional -- only if flagged in step 2)
   The escalation ladder. Each step is a DECISION POINT, not automatic:

   +-------------------------------------------------------------------------+
   | Word-level focus (1 sentence) -> no ripple -> DONE                      |
   |                                -> ripple beyond sentence ->              |
   | Paragraph-level focus (1 paragraph re-analysis) -> no broader -> DONE   |
   |                                                  -> holistic shift ->   |
   | Section-level focus (holistic section re-synthesis) -> stable -> DONE   |
   |                                                     -> thesis/voice -> |
   | Comprehensive mode (full re-analysis)                                    |
   +-------------------------------------------------------------------------+

   Most Round 4+ changes resolve at the first step. Occasionally one ripples
   to paragraph level. Rarely to comprehensive. The escalation ladder catches
   the edge cases without paying the comprehensive cost on every edit.

   KEY IMPROVEMENT: The escalation decision is informed by the Edit
   Understanding's profile mapping. If the mapping said "no holistic impact,"
   the escalation is less likely to reach section-level. If it said "thematic
   architecture affected," escalation to section-level is expected.

5. PHASE-AWARE FEEDBACK GENERATION
   Generate feedback at the current improvement phase zoom level.
   Profile preserved; only changed parts updated.
   If the focused analysis changed the phase (e.g., fixing the last
   sentence-level issue shifts Craft -> Polish), update ProfileIndex.
```

### Why Focused Mode Produces BETTER Results for Small Changes

This is counterintuitive but critical: focused mode is not just cheaper — it is actually **higher quality** for surgical edits.

| Dimension | Comprehensive re-analysis | Focused analysis |
|-----------|---------------------------|------------------|
| **Cognitive focus** | Sonnet spreads across entire paragraph (10+ sentences), most unchanged | Sonnet focuses 100% on the changed text + its immediate context |
| **Depth per token** | ~$0.03 per paragraph spread across everything | ~$0.04 concentrated on the change |
| **Context precision** | Generic "re-analyze P2" prompt | Specific "how does 'drifted' differ from 'walked' in this context?" prompt |
| **Change awareness** | LLM might not even notice the word change among 10 sentences | LLM's ENTIRE prompt is about the word change |
| **Existing understanding** | LLM rebuilds understanding from scratch (may drift from prior reading) | LLM STARTS from existing understanding, updates the delta |
| **Edit Understanding context** | No pre-digested understanding of the change | Full significance, classification, apparent purpose, and profile mapping already available |
| **Student intent** | Not available (re-analysis only sees text) | Available from Pathway 1 conversation (when student engaged) |

The last two points are new. The old design could not inject edit understanding or student intent into focused mode because those systems did not exist. The Edit Understanding Pipeline and Pathway 1 conversation together provide focused mode with context that comprehensive mode does not have.

### Risk Mitigation: Focused Mode Missing Secondary Effects

**Risk**: If "drifted" subtly shifts the emotional register of all of P2, a focused call on P2S4 alone might miss that.

**Mitigation (built into the pipeline, updated)**:

1. **Edit Understanding profile mapping** (replaces old impact classification) pre-assesses ripple potential with full contextual understanding. If the changed sentence carries thematic weight or is a voice-defining moment, the Edit Understanding pipeline flags holistic impact from the start — and the mode decision logic routes to comprehensive.

2. **Ripple flags in focused understanding update** (step 2) — the prompt explicitly asks "does this ripple beyond P2S4?" with enough profile context (P2's paragraph understanding, connections, voice reading) for the LLM to detect secondary effects.

3. **Escalation ladder** (step 4) — if ripples are detected, scope widens incrementally. Not to full comprehensive (overkill), but to exactly the scope needed. The Edit Understanding's profile mapping guides escalation: if it flagged "voice identity possibly affected," escalation to section-level voice refresh is a natural next step, not a surprise.

4. **Phase re-computation** — after every focused update, the improvement phase is re-checked. If the phase shifts (unlikely for small changes, but possible), the system adapts.

5. **Double-check loop** (from Pathway 2) — when re-analysis eventually runs, it compares its findings against all focused updates since the last full analysis. Systematic misses are caught and feed back into calibration.

**What could go wrong**: A focused call misses a subtle thematic ripple. Impact: one iteration of feedback is slightly less informed about a secondary effect. Self-correcting: the next time the student edits near that area OR triggers Pathway 2 re-analysis, the comprehensive context catches it. This is acceptable — the alternative (comprehensive re-analysis every time) is both more expensive and lower quality for small changes.

### Interaction: Analysis Modes x Two Pathways x Progressive Precision

These three systems reinforce each other:

```
Round 1: Full pipeline (no pathways yet -- first analysis).
  Mode: Comprehensive | Phase: Foundation
  Cost: ~$0.52-1.00 | Time: 30-45s

  Student works on thesis, restructures P3.
  -> Pathway 1 captures: "Student said thesis was unclear, wants the
    diamond to carry the central question"
  -> Pathway 1 flags: structural change (P3 restructured) + thesis edit

Round 2: Student requests re-analysis.
  Edit Understanding: structural_reorganization + meaning_evolution.
    Scope: comprehensive. Structural roles injected from North Star.
  Mode: Comprehensive (structural change) | Phase: Architecture
  Brief tells re-analysis: "Student restructured P3 to strengthen the
  diamond metaphor. P3's old ending replaced entirely. Student's goal:
  'the reader should feel the weight of the diamond.'"
  Cost: ~$0.25-0.40 (cheaper -- knows where to focus)

  Student improves transitions, rewrites P4.
  -> Pathway 1 captures: "Student wants gradual emotional transition
    between pawnshop and reflection"
  -> Pathway 1 notes: P4 rewrite, but role as fulcrum preserved

Round 3: Student requests re-analysis.
  Edit Understanding: deepening + voice_shift. Scope: paragraph.
    "P4's fulcrum role preserved but emotional register changed."
  Mode: Comprehensive (paragraph-level rewrite) | Phase: Craft
  Brief: focused on P4, knows student's transition goal, knows fulcrum
  is preserved. Re-analysis evaluates whether the new P4 achieves the
  gradual transition the student wanted.
  Cost: ~$0.15-0.30

  Student rewrites 3 specific sentences.
  -> Pathway 1: mostly silent (craft-level edits, low significance)
  -> Pathway 1 captures one nudge response: "I wanted P2S4 to feel
    more dreamlike"

Round 4: Student requests re-analysis.
  Edit Understanding: 3x refinement. Scope: sentence for each.
    One has student intent ("dreamlike"), two without.
  Mode: Focused (sentence-level edits against deep profile) | Phase: Polish
  Brief: 3 sentence changes, one with intent ("dreamlike"), two without.
  3 focused Sonnet calls, word-level feedback.
  Cost: ~$0.06-0.12

Round 5: Student tweaks 2 phrases.
  Edit Understanding: 2x refinement. Scope: sentence.
  Mode: Focused (micro) | Phase: Distinction
  2 focused calls, memorability feedback.
  Cost: ~$0.02-0.04
```

The acceleration curve: as the essay improves, Pathway 1 gets quieter (fewer significant changes to comment on), Pathway 2 gets cheaper (more focused mode, better briefs), and feedback gets more surgical (higher-phase zoom level). The system converges toward perfection through increasingly precise interventions.

---

---

## Appendix: Type Summary

All TypeScript interfaces defined in this document, collected for reference:

- **`ChangeDetectionOutput`** (Section A) -- mechanical diff output
- **`EditUnderstanding`** (Section A) -- the core output of the Edit Understanding Pipeline
- **`ReAnalysisBrief`** (Section B) -- structured context for Pathway 2 re-analysis
- **`ChangeEntry`** (Section B) -- individual change record in the version timeline
- **`LightTouchAdjustment`** (Section B) -- minimal profile adjustments from Pathway 1
- **`VersionRecord`** (Section C) -- accumulated state between two analysis points
- **`VersionRecordRow`** (Section C) -- database schema for version tracking

These types will be implemented in `src/services/essayIntelligence/types.ts` alongside the existing EssayProfile and related types.


---

## Progressive Precision: Improvement Phase Detection

The system gets more surgical as the essay improves. This is not just an optimization — it's pedagogically essential. A student with a broken thesis should not receive word-choice feedback alongside "your structure doesn't work." Why polish a word when the paragraph might get cut? Why refine sentence rhythm when the thesis is unclear?

**Core principle**: Understanding and Analysis ALWAYS evaluate everything at every level. The improvement phase acts as a **filter** on which analysis findings become FEEDBACK. The system always KNOWS about the word-level issues — it just doesn't SURFACE them until the big-picture issues are resolved.

### The Five Improvement Phases

```
┌──────────────┬────────────────────────────────┬───────────────────────────────────┬──────────────────────────────────┐
│    Phase     │         Condition              │       Feedback Focus              │         Deferred                 │
├──────────────┼────────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ Foundation   │ Thesis unclear/weak, arc       │ Thesis clarity, structural arc,   │ Paragraph transitions, sentence  │
│              │ doesn't hold, major structural │ voice coherence, whether each     │ craft, word choice, rhythm       │
│              │ gaps, essay-level critical     │ paragraph belongs                 │                                  │
│              │ weaknesses                     │                                   │                                  │
├──────────────┼────────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ Architecture │ Essay-level is solid.          │ Paragraph roles, transitions,     │ Individual sentence              │
│              │ Paragraph-level issues:        │ pacing, showing vs telling at     │ effectiveness, word choice       │
│              │ paragraphs don't earn place,   │ paragraph level, arc momentum     │                                  │
│              │ weak transitions, arc stalls   │                                   │                                  │
├──────────────┼────────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ Craft        │ Paragraphs all pull weight.    │ Specific sentence rewrites,       │ Individual word choices,         │
│              │ Sentence-level issues: flat    │ showing techniques, rhythm        │ minor phrasing                   │
│              │ sentences, telling not showing,│ variation, sentence-level         │                                  │
│              │ rhythm problems                │ effectiveness                     │                                  │
├──────────────┼────────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ Polish       │ Sentences are effective.       │ Specific word replacements,       │ — (nothing deferred,             │
│              │ Word-level issues: generic     │ image precision, verb strength,   │ everything is fair game)         │
│              │ verbs, vague modifiers,        │ unnecessary qualifiers, word-     │                                  │
│              │ imprecise imagery              │ level rhythm                      │                                  │
├──────────────┼────────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ Distinction  │ Essay is polished. Focus on    │ Voice distinctiveness, admissions │ —                                │
│              │ what makes it MEMORABLE,       │ positioning, what makes THIS      │                                  │
│              │ not just correct               │ essay unforgettable, the 1% that  │                                  │
│              │                                │ separates good from great         │                                  │
└──────────────┴────────────────────────────────┴───────────────────────────────────┴──────────────────────────────────┘
```

### Phase Detection Logic

Computed from L3.5 analysis results. Runs after every analysis pass (initial or re-analysis). Stored in `ProfileIndex.improvementPhase`.

```typescript
function detectImprovementPhase(profile: EssayProfile): ImprovementPhase {
  // ── Gather signals from the analysis layer ──
  const essayLevelIssues = profile.weaknessesFound.filter(w =>
    w.severity === 'critical' && w.sentence === null  // paragraph-level or essay-level
  );

  const paragraphIssues = profile.paragraphs.filter(p =>
    p.analysis && p.analysis.effectiveness < 60
  );

  const sentenceIssues = profile.paragraphs.flatMap(p =>
    p.sentences.filter(s => s.analysis?.isProblem)
  );

  const wordLevelWeaknesses = profile.paragraphs.flatMap(p =>
    p.sentences.flatMap(s => s.analysis?.weaknesses.filter(w =>
      w.observation.toLowerCase().match(/\b(word|vague|cliché|generic|weak verb|qualifier|imprecise)\b/)
    ) ?? [])
  );

  // ── Compute readiness scores ──
  const readiness = {
    essayLevel: computeEssayReadiness(profile),       // thesis + arc + voice coherence
    paragraphLevel: computeParagraphReadiness(profile), // % of paragraphs with effectiveness >= 60
    sentenceLevel: computeSentenceReadiness(profile),   // % of sentences not flagged isProblem
    wordLevel: computeWordReadiness(profile),           // % of sentences with no word-level weaknesses
  };

  // ── Phase classification (hierarchical — check biggest issues first) ──

  // FOUNDATION: Holistic coherence issues block everything else
  if (!profile.thematicArchitecture.centralThesis ||
      profile.thematicArchitecture.thesisConfidence < 0.6 ||
      essayLevelIssues.length > 0 ||
      readiness.essayLevel < 50) {
    return {
      level: 'foundation',
      reasoning: 'Essay-level issues need resolution before paragraph/sentence work is worthwhile',
      focusAreas: essayLevelIssues.map(i => i.quality),
      deferredAreas: ['sentence craft', 'word choice', 'rhythm', 'paragraph transitions'],
      readiness,
    };
  }

  // ARCHITECTURE: Paragraphs not pulling weight
  if (paragraphIssues.length > 1 || readiness.paragraphLevel < 70) {
    return {
      level: 'architecture',
      reasoning: `${paragraphIssues.length} paragraph(s) underperforming — structure needs work before sentence-level polish`,
      focusAreas: paragraphIssues.map(p => `P${p.index}: ${p.analysis?.verdict}`),
      deferredAreas: ['sentence-level effectiveness', 'word choice'],
      readiness,
    };
  }

  // CRAFT: Sentences with problems
  if (sentenceIssues.length > 2 || readiness.sentenceLevel < 75) {
    return {
      level: 'craft',
      reasoning: `${sentenceIssues.length} sentence(s) flagged — sentence-level craft improvements will have the most impact`,
      focusAreas: sentenceIssues.slice(0, 5).map(s =>
        `P${s.analysis?.sentenceIndex}: ${s.analysis?.weaknesses[0]?.observation}`
      ),
      deferredAreas: ['individual word choices'],
      readiness,
    };
  }

  // POLISH: Word-level issues remain
  if (wordLevelWeaknesses.length > 0 || readiness.wordLevel < 85) {
    return {
      level: 'polish',
      reasoning: 'Sentence craft is strong — word-level precision will elevate the writing',
      focusAreas: wordLevelWeaknesses.slice(0, 5).map(w => w.observation),
      deferredAreas: [],
      readiness,
    };
  }

  // DISTINCTION: Everything is strong
  return {
    level: 'distinction',
    reasoning: 'Essay is polished — focus on what makes it memorable and unforgettable',
    focusAreas: ['voice distinctiveness', 'admissions positioning', 'memorability'],
    deferredAreas: [],
    readiness,
  };
}
```

### Where Phase Detection Lives in the Architecture

1. **Computed after L3.5 Analysis Pass** — the first time phases are determined. Stored in `ProfileIndex.improvementPhase`.
2. **Re-computed after every re-analysis** — student fixes thesis → re-analyze → phase shifts Foundation → Architecture → next feedback round zooms in. Phase can also shift BACKWARD if a structural edit introduces new essay-level problems.
3. **L5 annotations consume the phase** — annotation prompt receives `improvementPhase` and generates feedback at that zoom level. Foundation: 2-3 big-picture observations. Polish: 8-12 surgical word-level annotations.
4. **L6 coaching consumes the phase** — when student asks "how can I improve?", coach answers at the current zoom level. Doesn't say "fix your word choice" when the thesis is broken.
5. **Phase is a FILTER, not a limiter** — if a student specifically asks about a deferred area, the coach can address it (the analysis data is always there). The phase determines what's PROACTIVELY surfaced, not what's accessible.

### What Progressive Precision Does NOT Change

- **Understanding is always comprehensive** — every level, every paragraph, every word
- **Analysis always evaluates everything** — every sentence gets effectiveness, strengths, weaknesses
- **The profile always has full data at every granularity** — nothing is skipped or deferred
- **The zoom only affects what FEEDBACK surfaces** — it's a downstream filter on existing analysis

This means the system always KNOWS about the word-level issues in Foundation phase. When the student fixes the thesis and the phase shifts to Architecture, the word-level analysis is already done. **No re-analysis needed for that shift.** The zoom is a filter on existing analysis, not a change in analytical depth.

### The Progressive Journey (Example)

```
Round 1: Full analysis. Phase: Foundation.
  Feedback: "Your thesis is unclear — the essay seems to be about both
  self-worth AND imperfection without committing to either. P3 doesn't
  earn its place."
  → Student clarifies thesis, restructures P3.

Round 2: Re-analysis (comprehensive — structural change). Phase: Architecture.
  Feedback: "Thesis is clear now. P2's transition is abrupt — the reader
  needs a bridge between the pawnshop and your reflection. P4 tells
  instead of showing."
  → Student improves transitions, rewrites P4.

Round 3: Re-analysis (focused — paragraph-level changes). Phase: Craft.
  Feedback: "Paragraphs all pull weight. P2S4 is flat — 'I felt emotional'
  is telling. P3S2 breaks your rhythm pattern. P5S1's metaphor extension
  is unclear."
  → Student rewrites specific sentences.

Round 4: Re-analysis (focused — sentence-level changes). Phase: Polish.
  Feedback: "'walked slowly' in P2S4 — show pace through action, not adverbs.
  'Very' in P3S1 weakens the image. 'thing' in P4S3 — what thing?"
  → Student makes word-level improvements.

Round 5: Re-analysis (focused — word-level changes). Phase: Distinction.
  Feedback: "This essay is polished and effective. What will make an AO
  remember it: your voice in the pawnshop scene is uniquely precise.
  Consider: three consecutive long sentences in P3 — vary the rhythm
  to let the reader breathe. The closing image is strong but could echo
  the opening more directly for maximum callback impact."
```



---

## Key Design Decisions

### Foundational Principles

**1. No heuristics for judgment.** All quality evaluation goes through LLM calls. Haiku for first impressions, classification, and trivial pre-filtering. Sonnet for deep understanding, judgment, synthesis, and crystallization. Deterministic code only for factual text parsing (paragraph splitting, word counting, sentence alignment, diff computation). The single exception: Haiku as a binary pre-filter in the Edit Understanding pipeline ("trivial mechanical fix or real content change?") — and even that errs toward escalation to Sonnet.

**2. LLM output IS the profile data.** L3's understanding output and L3.5's analysis output use the profile's own data structures. There is no "analyze then translate to profile" step — the LLM writes directly into profile format. The Profile Manager's coordinator dispatches to domain mutators that apply the output (supersessions, connection refs, index updates) without transformation. Two cognitive acts (understanding + analysis), two outputs, each stored directly. ZERO translation redundancy.

**3. Multi-resolution mapping.** The profile maps the essay at every level — holistic (8 sections + North Star), paragraph, sentence, word/phrase. Every sentence's purpose is understood. Significant word choices are mapped. Voice is mapped as a spatial field across the essay, not a single score. Emotional moments are traced backward through arrow networks, not flagged with booleans.

**4. 3-way intent distinction.** Every sentence separates observed function (IS doing), inferred intent (TRYING to do), and prescriptive role (SHOULD be doing). Prevents coaching from imposing wrong intent. When conversation reveals student's actual intent, `inferredIntent` is confirmed or corrected — the 3-way split makes this surgical rather than destructive.

**5. Bidirectional profile updates.** When P3's analysis reveals P1's opening is the central metaphor, P1's profile is updated immediately via back-propagation. No separate retrospective pass needed. The SentenceMutator handles back-propagation for sentence-level changes; the coordinator propagates staleness for cross-domain effects.

**6. Profile Index + selective injection.** A compact (~200-300 token) index is always loaded. Full profile sections loaded only when relevant. Tags enable fast semantic routing. Every API call — not just Layer 3 — uses this pattern. The 19-table database architecture makes selective loading natural: load voice data without loading connections, load one paragraph without loading all.

**7. Profile grows deeper, never repeats.** Each layer adds NEW understanding, references existing profile entries, never duplicates. L3 doesn't re-state what L1 already observed — it deepens and contextualizes it. Supersession replaces entire arrays, not appends. Single source of truth for connections (centralized store with ID refs).

### Architectural Decisions

**8. Sequential walk is non-negotiable.** Cross-paragraph connections, voice drifts, thematic thread tracking — these are inherently relational and only discovered through sequential reading with compounding context. L3's paragraph-by-paragraph walk with back-propagation captures emergent patterns that parallel analysis would miss entirely.

**9. Both pipelines coexist.** Old annotation pipeline = "fast mode." Essay Intelligence System = "deep mode." The student chooses or the system auto-selects based on essay investment level. No forced migration.

**10. Split-table database architecture replaces monolithic JSONB.** 19 tables across 6 domain modules, not a single JSONB document. One entity per table. JSONB for variable-structure content (sentence observations, holistic sections). Scalar columns for queryable fields (effectiveness scores, staleness flags, confidence levels). The EssayProfile is assembled from multiple tables by the Profile Router, which decides what to load per task. A coaching turn about voice loads the voice section and tagged sentences. A full L5 pass loads everything. Write-frequency drives table boundaries — high-frequency updates (conversation insights, staleness flags) never contend with low-frequency updates (holistic sections, North Star). See `docs/plan-sections/05-database-architecture.md` for full specification.

**11. No heuristic fallbacks.** If Sonnet/Haiku fails, retry with exponential backoff. If it keeps failing, checkpoint and trip the circuit breaker (max 3 retries per checkpoint position). Never substitute heuristic guesses for LLM judgment. Partial results from completed layers are preserved and usable.

**12. Anti-repetition is structural, not instructional.** Repetition is prevented by three structural defenses — separate API calls (Understanding/Analysis/Feedback can't cross-contaminate), supersession model (entire arrays REPLACED on update, not appended), and single source of truth for connections (centralized store with ID refs). The LLM receives current profile state via Profile Router, produces its current understanding in the profile's own data format, and the Profile Manager applies supersessions. No deduplication logic needed.

### New Concept Decisions

**13. Voice is a map, not a number.** The old `consistencyScore` was a scalar that collapsed a rich spatial phenomenon into one number. The VoiceMap is a 5-dimension spatial field: register, vocabulary fingerprint, sentence rhythm, perspective/distance, and tonal disposition (humor, irony, earnestness, irreverence, solemnity). It maps stability regions and shift points across the essay. Each shift carries an intentionality assessment with confidence (0-1). Below 0.6 confidence, the system presents the shift as a question to the student, not a conclusion. Code-switching events (language, trigger, cultural function) are first-class entries, not anomalies. The VoiceMapMutator owns all voice mutations; the coordinator propagates staleness to emotional topography and thematic architecture when voice data changes.

**14. Earned-ness is a backward-tracing arrow network, not a boolean flag.** The old `isEarned` was a boolean on emotional peaks. The EarnednessMap traces backward from every significant moment — emotional peaks, intellectual realizations, humorous payoffs, subversive turns — to identify 7 mechanism types that earn it: sensory grounding, emotional setup, stakes establishment, character revelation, thematic preparation, intellectual scaffolding, and comedic/subversive setup. Each arrow connects a source passage to the moment it earns, with a typed mechanism and a contribution description. Sparse arrows = unearned (the diagnosis IS the map structure). Dense arrows = earned. No threshold score, no boolean — the arrow density itself communicates earned-ness. The EarnednessMutator owns arrow creation, removal, and typing; the coordinator propagates staleness to character revelation and admissions positioning when arrows change.

**15. North Star is architecture of meaning, not a summary.** L4 produces the North Star — a 5-dimension crystallization that captures what makes this essay THIS essay and no other. Through-Line Map (the central element's journey: surface, submerge, transform, resolve), Structural Roles Map (what each paragraph IS in the architecture — the fulcrum, the setup, the payoff), Trajectory & Potential (where the essay could go — MULTIPLE plausible paths, not a single prescription), Distinctiveness Signature (what makes this essay non-interchangeable, synthesized from cross-dimension entanglements), and Intent Bridge (student's understanding alongside system's). Scaled by essay type: supplements get 2 dimensions, PIQs get 3, personal statements get all 5. The North Star replaces EssayDNA — it's not a fingerprint but an interpretive map that guides every subsequent coaching interaction.

**16. Cross-dimension entanglements are the 8th holistic section.** When P2S3's voice shift from concrete to reflective IS the thematic pivot from transaction to value, that intersection lives in the entanglements section — not inside voice identity, not inside thematic architecture. Entanglements are the evidence layer: specific, located (paragraph/sentence references), with named dimensions that intersect. L4's distinctiveness signature synthesizes across entanglements to produce the global interpretive reading. The HolisticMutator owns all 7 standard sections plus entanglements; they share a single supersession boundary at L3.75.

**17. Two-pathway edit handling.** Student edits flow through the Edit Understanding Pipeline (Haiku pre-filter + Sonnet understanding/mapping/scoping) which produces an EditUnderstanding. Then two pathways diverge based on context. **Pathway 1 (Conversational Edit Workshop)**: real-time companion for students actively editing. The workshop discusses the change, explores implications, teaches — without re-analyzing. Profile updates are "light-touch" (text references, staleness markers). Cheap (~$0.03-0.08 per session). **Pathway 2 (Version-Based Re-Analysis)**: deliberate re-analysis triggered by the student or by staleness accumulation. Builds a 4-section re-analysis brief (version summary, accumulated changes, conversation insights, recommended scope) that enriches the re-analysis prompt with everything learned since the last analysis. More expensive (~$0.12-0.30) but 20-40% cheaper than naive re-analysis because conversation context narrows scope. The two pathways are not mutually exclusive — a workshop session can conclude with a triggered re-analysis.

**18. Edit understanding uses Sonnet, not Haiku.** The old PLAN.md asked Haiku to predict edit impact — a shallow classifier disconnected from real understanding. The new pipeline uses Haiku ONLY as a trivial pre-filter (binary: "mechanical fix or real change?"). ALL interpretive work — significance assessment, change type classification, apparent purpose inference, connection impact mapping, scope recommendation — happens in a single integrated Sonnet call that receives the diff alongside profile context. The pipeline does not predict impact; it UNDERSTANDS the change, and the scope follows from that understanding. Cost: ~$0.02-0.05 per meaningful edit, well justified by the quality difference.

**19. Profile Manager: thin coordinator + 8 domain mutators.** A monolithic Profile Manager would become a god object within a month. The architecture splits into EssayProfileCoordinator (owns the write lock, dispatches mutations, manages cross-domain staleness, triggers index recomputation, handles checkpointing) and 8 focused domain mutators (SentenceMutator, ParagraphMutator, HolisticMutator, ConnectionMutator, VoiceMapMutator, EarnednessMutator, NorthStarMutator, InsightMutator). Each layer calls exactly ONE coordinator method. The coordinator routes internally to the relevant mutators. Each mutator owns its domain's internal referential integrity. The coordinator owns cross-domain staleness propagation via a declared dependency map. Every piece is independently testable — give a mutator a profile, call a method, assert the result. No LLM calls, no database, no rendering.

**20. Staleness propagates with depth limits.** In well-connected essays, unbounded staleness cascation can flag the majority of the profile stale after a few edits — defeating focused mode. Three tiers with bounded propagation: Depth 0 (the changed element itself) = **strong** staleness, must be refreshed before use; Depth 1 (directly connected elements) = **moderate**, included in next relevant LLM call; Depth 2 (two-hop connections) = **weak**, logged but NOT propagated further. Re-analysis suggestions trigger on strong-staleness count (3+ sentences), not total staleness. Moderate staleness accumulates silently and is picked up naturally by the next L3.75 or L3.5 pass.

**21. Conversation insights are durable knowledge, not chat history.** 8 primary categories (intent confirmation/reinterpretation, contextual revelation, preference, emotional significance, audience awareness, structural intention, creative aspiration, correction). Each insight has secondary attributes, 4 durability levels (permanent/stable/contextual/tentative), and partial supersession (a new insight about a sentence's intent supersedes the old one for that sentence, but insights about different sentences coexist). The InsightMutator handles categorization, supersession, and durability management. Insights enrich the re-analysis brief (Pathway 2) and the coaching context (L6), creating a flywheel where conversation makes analysis cheaper and more accurate.

**22. Version tracking accumulates changes between analyses.** Each edit produces a VersionRecord: the changed text, the EditUnderstanding output, conversation insights gathered during the editing session, and an intent annotation. Between two full analyses, the version tracker accumulates these records into a chronological narrative of what changed and why. The Re-Analysis Brief Assembler consumes this accumulated history to build a focused, context-rich brief that tells the re-analysis LLM exactly what to pay attention to — enabling 20-40% cost reduction compared to naive comprehensive re-analysis.

### System Convergence Decisions

**23. Progressive Precision — feedback zooms, analysis doesn't.** Understanding and Analysis ALWAYS evaluate everything at every level. The Improvement Phase determines what FEEDBACK surfaces. This means phase transitions are free — no re-analysis needed when the phase shifts, because the deeper-level analysis is already computed. The zoom is a downstream filter on existing analysis. Five phases: Foundation, Architecture, Craft, Polish, Distinction.

**24. Focused mode is not cheaper comprehensive — it's a different lens.** When the profile is deep and the edit is small, focused analysis produces HIGHER quality results than comprehensive re-analysis. The LLM concentrates 100% on the change instead of spreading across the entire paragraph. Existing understanding is leveraged as context, not rebuilt. The escalation ladder catches edge cases where small changes have outsized ripple effects. Pre-mutation snapshots enable cheap rollback when escalation is needed.

**25. The system converges through the interaction of Progressive Precision x Analysis Modes x Two-Pathway Edit Handling.** Each editing round is simultaneously more surgical (focused mode = narrower analytical aperture), more precise (progressive precision = feedback zoomed to current level), and more informed (conversation insights from Pathway 1 enrich Pathway 2 re-analysis). The cost curve reflects this triple convergence: Round 1 ~$0.75 (full pipeline, no prior knowledge) to Round 5 ~$0.03 (focused, zoomed, informed). The 20-40% cost reduction from conversation context is the payoff for the two-pathway architecture — what the student tells the system in Pathway 1 directly reduces the work needed in Pathway 2.

---

## Progressive Cost Curve

### Per-Event Costs

| Event | Analysis Mode | Cost | Time |
|-------|--------------|------|------|
| First full analysis (L1-L2-L2.5-L3-L3.75-L3.5-L4-L5) | Comprehensive | ~$0.52-1.00 | 30-45s |
| Edit understanding (per meaningful edit) | Sonnet understanding | ~$0.02-0.05 | 1-3s |
| Conversational edit workshop session (Pathway 1) | Real-time companion | ~$0.03-0.08 | — |
| Version-based re-analysis with brief (Pathway 2) | Comprehensive (enriched) | ~$0.12-0.30 | 15-25s |
| Structural edit re-analysis (insert/delete/reorder) | Comprehensive | ~$0.30-0.50 | 20-30s |
| Multiple sentence focused re-analysis | Focused | ~$0.08-0.15 | 8-12s |
| Single sentence focused re-analysis | Focused | ~$0.04-0.08 | 3-5s |
| Word-level focused re-analysis | Focused | ~$0.02-0.04 | 2-3s |
| Conversation turn (L6 coaching) | — | ~$0.01-0.03 | 1-3s |

**Key cost insight — Pathway 2 vs naive re-analysis**: A version-based re-analysis (Pathway 2) costs ~$0.12-0.30 compared to ~$0.30-0.50 for a naive structural re-analysis. The 20-40% savings come from three sources: (1) the re-analysis brief narrows scope based on accumulated EditUnderstandings, (2) conversation insights from Pathway 1 resolve ambiguities the LLM would otherwise spend tokens exploring, and (3) the version tracker identifies which profile sections need updating vs which are still valid. The brief is ~150-300 tokens of focused context that saves ~500-1000 tokens of exploratory analysis.

### The Acceleration Curve (typical editing session)

```
Round 1: Comprehensive. Full pipeline. No prior knowledge.
  Mode: Comprehensive | Phase: Foundation
  Cost: ~$0.52-1.00 | Time: 30-45s                          ████████████████████

Round 2: Student edits P3-P4 while chatting with workshop.
  Pathway 1: Conversational workshop discusses changes       ~$0.05 ██
  + Version-based re-analysis with brief (Pathway 2)
  Mode: Comprehensive (enriched) | Phase: Architecture
  Cost: ~$0.15-0.25 | Time: 15-25s                          ██████████
  Workshop context saved 20-40% vs naive re-analysis.

Round 3: Student rewrites P2S3-S5, improves P4S2.
  Pathway 1: Quick workshop conversation                     ~$0.03 █
  + Focused re-analysis (sentence-level)
  Mode: Focused | Phase: Craft
  Cost: ~$0.08-0.15 | Time: 8-12s                           ████████

Round 4: Student changes 3 words across P2-P3.
  Edit understanding classifies as low-significance
  Mode: Focused (word-level) | Phase: Polish
  Cost: ~$0.03-0.06 | Time: 3-5s                            ███

Round 5: Student tweaks P4S2 phrasing.
  Mode: Focused (micro) | Phase: Distinction
  Cost: ~$0.02-0.04 | Time: 2-3s                            ██

  + 10 coaching turns (L6) across session:                   ~$0.10-0.20
```

### Cumulative Session Cost

| After | Cumulative Cost | Notes |
|-------|----------------|-------|
| Round 1 | ~$0.52-1.00 | Full deep understanding built |
| Round 2 | ~$0.72-1.30 | Workshop conversation + enriched re-analysis (not naive) |
| Round 3 | ~$0.83-1.48 | Sentence-level craft improved, conversation context accumulating |
| Round 4 | ~$0.86-1.54 | Word-level polish, focused mode at near-minimum cost |
| Round 5 + coaching | ~$0.98-1.78 | Essay near-final, total well under $2 ceiling |

Well under the $2 ceiling per essay. The acceleration is dramatic: Round 1 costs ~$0.75 average, Round 5 costs ~$0.03 average — **a 25x reduction**. This comes from three compounding effects:

1. **Focused mode** — the analytical aperture narrows as the profile deepens, so later rounds examine fewer sentences with richer context.
2. **Progressive precision** — feedback zooms to the student's current phase, so the system does less work generating and filtering feedback.
3. **Conversation enrichment** — what the student tells the Pathway 1 workshop directly reduces the work Pathway 2 re-analysis needs. By Round 3-4, the re-analysis brief contains enough conversation context that the LLM can skip exploratory analysis and focus on confirmed changes.

The net effect of the two-pathway architecture: Rounds 2-3 are ~20-40% cheaper than the old design (which ran naive comprehensive re-analysis without conversation context). Rounds 4-5 were already cheap via focused mode. The savings concentrate where the old design was most wasteful — mid-session re-analysis where the student has been actively discussing their changes.

---

## Implementation Order

### Wave A: Type Foundation (Phase 1A-1E groundwork)

The entire system's type contracts come first. Every subsequent wave depends on these types being defined, reviewed, and stable. No implementation code until the types compile cleanly.

1. **Core profile types**: EssayProfile, ProfileIndex, ParagraphProfile, SentenceUnderstanding, SentenceAnalysis, ObservationEntry — the foundational data structures.
2. **Holistic section types**: VoiceIdentity, VoiceMap (5 dimensions, shift points, intentionality assessments, code-switching), EmotionalTopography, EarnednessMap (7 mechanism types, arrow network), ThematicArchitecture, NarrativeStrategy, CharacterRevelation, CraftAssessment, AdmissionsPositioning, CrossDimensionEntanglements.
3. **North Star types**: ThroughLineMap, StructuralRolesMap, TrajectoryAndPotential, DistinctivenessSignature, IntentBridge — all 5 dimensions with essay-type scaling rules.
4. **Conversation and version types**: ConversationInsight (8 categories, secondary attributes, 4 durability levels, supersession), VersionRecord (text snapshots, EditUnderstanding output, intent annotations).
5. **Edit understanding types**: ChangeDetectionOutput, EditUnderstanding, EditSignificance, ChangeType classification, ScopeRecommendation, ReAnalysisBrief.
6. **Profile Manager types**: MutationType, StalenessEffect, StalenessTarget, StalenessEntry, StalenessSnapshot, CheckpointMetadata, CircuitBreakerState, PreMutationSnapshot, ValidationResult, ReadinessScores, ImprovementPhase.
7. **Profile Router**: Universal selective injection with layer awareness — decides which profile sections to load per task based on ProfileIndex tags and staleness state.
8. **Profile Manager coordinator + all 8 mutators**: EssayProfileCoordinator, SentenceMutator, ParagraphMutator, HolisticMutator, ConnectionMutator, VoiceMapMutator, EarnednessMutator, NorthStarMutator, InsightMutator. Plus StalenessTracker (with depth-limited propagation) and Validator (quick + full tiers).
9. **Factory function**: `createInitialProfile()` — produces a properly shaped empty EssayProfile from raw essay text. No LLM calls, just data shaping.

**Exit criteria**: `npx tsc --noEmit` passes. All types are documented with JSDoc. Profile Manager unit tests pass (give mutator a profile, call method, assert result — no LLM, no DB).

### Wave B: Core Pipeline (Phase 1A-1C, L1-L3.75-L3.5)

The analysis pipeline that builds the deep profile from scratch.

1. **L1 Haiku first impressions** (1A): Replace deterministic L1 with Haiku call. Output populates sentence stubs via `applyFirstImpressions()`.
2. **L2 Sonnet structural cartography** (1B): Upgrade to Sonnet. Output populates paragraph roles via `applyStructuralCartography()`.
3. **L2.5 Connection Scout** (1C): Haiku call for surface cross-paragraph connection detection. Output creates provisional connections via `applyScoutLeads()`.
4. **L3 Understanding Walk**: Sequential paragraph-by-paragraph Sonnet calls. Understanding-only output, back-propagation, selective profile injection. Each paragraph processed via `applyUnderstandingWalkStep()`.
5. **L3.75 Holistic Synthesis**: Single Sonnet call producing all 8 holistic sections (voice identity, voice map, emotional topography, earned-ness map, thematic architecture, narrative strategy, character revelation, craft assessment, admissions positioning, cross-dimension entanglements). Applied via `applyHolisticSynthesis()`. **Checkpoint after completion.**
6. **L3.5 Analysis Pass**: Separate parallel Sonnet calls per paragraph. Evaluation with complete understanding + holistic context. Applied via `applyAnalysisPassResult()`. Readiness scores recomputed after all paragraphs complete. **Checkpoint after completion.**
7. **Improvement Phase Detection**: `detectImprovementPhase()` runs after L3.5, stored in ProfileIndex. Five phases: Foundation, Architecture, Craft, Polish, Distinction.

**Exit criteria**: Full pipeline runs on 3+ test essays. Profile depth validated. Back-propagation verified. Voice map populated with shift points. Earned-ness arrows present for all significant moments. Entanglements detected.

### Wave C: Crystallization + Feedback (Phase 1G, 1K)

The output-facing layers that produce what the student actually sees.

1. **L4 North Star crystallization**: Single Sonnet call producing the 5-dimension North Star from complete understanding + holistic profile. Scaled by essay type. Applied via `applyNorthStar()`. **Checkpoint after completion.**
2. **L5 Phase-aware annotations**: Feedback generation using understanding + analysis + North Star context. Improvement phase determines feedback zoom level. Annotations are ephemeral — never stored in the Profile Manager.
3. **L6 Coaching with conversation insight system**: Phase-aware coaching responses. Every coaching turn can produce ConversationInsights (via `applyConversationInsight()`). 8 insight categories, 4 durability levels, partial supersession. Insights enrich future re-analysis briefs and coaching context.

**Exit criteria**: North Star produces meaningful architecture-of-meaning (not summaries). Annotations reference the North Star when discussing essay direction. Coaching responses adapt to improvement phase. Conversation insights are stored and retrievable.

### Wave D: Edit Intelligence (NEW — the two-pathway system)

The complete edit handling system, from detection through re-analysis.

1. **Edit Understanding Pipeline** (`analysis/editUnderstanding.ts`, ~300 lines): Haiku pre-filter (trivial/real binary) + mechanical change detection (paragraph/sentence/word alignment) + integrated Sonnet call (significance, change type, apparent purpose, connection impact, scope recommendation).
2. **Conversational Edit Workshop** (`analysis/conversationalEditWorkshop.ts`, ~250 lines): Pathway 1. Real-time companion that discusses edits with the student. Produces conversation insights. Light-touch profile updates only (text references, staleness markers, via `applyLightTouchUpdate()`).
3. **Version Tracker** (`analysis/versionTracker.ts`, ~200 lines): Accumulates VersionRecords between analyses. Each record: changed text, EditUnderstanding output, conversation insights, intent annotation. Provides chronological narrative for the re-analysis brief.
4. **Re-Analysis Brief Assembler** (`analysis/reanalysisBriefAssembler.ts`, ~150 lines): Builds the 4-section brief: (1) version summary (what changed since last analysis), (2) accumulated changes (from version tracker), (3) conversation insights (what the student revealed), (4) recommended scope (derived from staleness state + EditUnderstanding scoping). The brief is ~150-300 tokens that saves ~500-1000 tokens of exploratory analysis.
5. **Two-pathway orchestration**: Integration in the main orchestrator. Edit triggers Edit Understanding Pipeline. Result feeds Pathway 1 (workshop) and/or Pathway 2 (re-analysis with brief). Staleness accumulation triggers Pathway 2 suggestion when 3+ sentences reach strong staleness.

**Exit criteria**: Trivial edits correctly filtered by Haiku. Meaningful edits understood by Sonnet. Workshop produces conversation insights. Version tracker accumulates correctly. Re-analysis brief demonstrably reduces re-analysis cost by 20-40% vs naive comprehensive. Pre-mutation snapshots enable escalation rollback.

### Wave E: Database + Infrastructure (Phase 1H-1J, 1L)

The persistence, caching, and reliability infrastructure.

1. **19-table migration**: All tables from `docs/plan-sections/05-database-architecture.md`. 6 domain modules: Essay Core (2 existing tables), Essay Profile (6 tables), Analysis Lifecycle (2 tables), Conversation & Coaching (4 tables), Edit Tracking & Version Management (1 table), Portfolio Intelligence (2 tables). Plus supporting structures (analysis locks, version snapshots). 10 holistic section types stored as rows in `essay_holistic_sections` (voice_identity, voice_map, emotional_topography, earnedness_map, thematic_architecture, narrative_strategy, character_revelation, craft_assessment, admissions_positioning, cross_dimension_entanglements). RLS policies on every table. Indexes per the specification.
2. **Prompt caching (3-block strategy)**: Block 1 (static instructions, cached forever), Block 2 (essay-specific context, cached across sequential layer calls), Block 3 (call-specific, not cached). Critical for L3.5 analysis pass where understanding profile is cached across parallel paragraph calls.
3. **Checkpointing + circuit breaker**: CheckpointStore implementation for Supabase. Strategic checkpoint placement (after L1+L2, after L3, after L3.75, after L3.5, after L5, conversation saves, before re-analysis). Circuit breaker: max 3 retries per checkpoint position. Failure preserves everything before the failure point. Cooldown period (5 min default) prevents retry loops.
4. **Consistency validation**: Quick validation (referential integrity, <1ms, after every mutation) + full validation (semantic coherence, at checkpoints). Neither blocks the pipeline — both log results for review.
5. **Focused analysis mode with escalation ladder**: `selectAnalysisMode()` in orchestrator. Diff detection, impact classification, focused understanding/analysis updates, escalation when focused analysis discovers larger blast radius. Pre-mutation snapshots for rollback.

**Exit criteria**: All 19 tables created with RLS. Prompt caching reduces L3.5 cost measurably. Checkpoint/resume works (kill process mid-L3, resume from checkpoint). Circuit breaker trips after 3 failures. Focused mode selects correctly for small/medium/large edits. Escalation rollback works.

### Wave F: Testing + Integration (Phase 2-3)

End-to-end verification and frontend integration. Runs in parallel with later stages of Waves D-E where possible.

1. **E2E test** (3A): Full pipeline on 3+ diverse essays. Profile depth validation. Cost tracking.
2. **Profile depth & back-propagation validation** (3B): Verify P1 is updated when P3 reveals new meaning.
3. **Selective profile injection test** (3C): Verify Profile Router loads correct sections per task.
4. **Incremental update test** (3D): Both comprehensive and focused modes. Two-pathway edit flow.
5. **Prompt iteration validation** (3E): Drive prompt refinement. Expect 3-5 iterations. Especially critical for L3 unified output (paragraph profile + prior sentence updates + connections + holistic evolution) and L3.75 holistic synthesis (voice map + earned-ness + entanglements).
6. **Progressive precision test** (3F): Verify phase detection, phase transitions, feedback zoom level adaptation.
7. **Focused analysis test** (3G): Verify mode selection, focused pipeline, escalation ladder, ripple detection. Pre-mutation snapshot rollback.
8. **Edit intelligence test** (NEW, 3H): Verify Haiku pre-filter accuracy. Verify Sonnet understanding quality. Verify Pathway 1 workshop produces useful insights. Verify Pathway 2 brief reduces re-analysis cost. Verify version tracker accumulation.
9. **HTTP routes** (2A): Including `/analyze` (first analysis), `/update` (auto-selects analysis mode), `/workshop` (Pathway 1), `/reanalyze` (Pathway 2 with brief), `/coach` (L6 conversation).
10. **Coaching service** (2B): Phase-aware coaching responses with conversation insight integration.
11. **Coexistence strategy** (2C): Old annotation pipeline continues as fast mode. Essay Intelligence System as deep mode. Migration path for existing profiles (legacy flag in `essay_profiles` table triggers re-analysis).
12. **Frontend integration** (Phase 4): After all backend waves verified.

**Exit criteria**: All test suites pass. HTTP routes return correct responses. Coaching adapts to phase. Old pipeline continues working. Frontend displays profile data and annotations correctly.

---

### Wave Dependencies

```
Wave A ─────────────────────►  Wave B ──────────► Wave C
  (types, router,                (L1-L3.75-L3.5)    (L4-L5-L6)
   profile manager)                  │                   │
         │                           │                   │
         └──────────────────────► Wave D ◄───────────────┘
                                  (edit intelligence — needs
                                   profile manager + L6 insights)
                                     │
                                     ▼
                                  Wave E
                                  (database, caching,
                                   checkpointing)
                                     │
                                     ▼
                                  Wave F
                                  (testing, integration,
                                   frontend)
```

Waves B and D can partially overlap: Wave D's Edit Understanding Pipeline can be built once Wave A's types are stable and Wave B's L3 is producing real profiles to edit. However, Pathway 1 (Conversational Workshop) requires L6 patterns from Wave C, and Pathway 2 (Re-Analysis Brief) requires the full pipeline from Wave B to have something to re-analyze.

Wave E (database) can start as soon as Wave A types are stable — the 19-table migration derives directly from the type definitions. Prompt caching and checkpointing integration happen after Wave B produces the actual LLM calls to cache and checkpoint.

Wave F runs continuously from Wave B onward. Each wave's exit criteria include tests. The full E2E test (3A) is the final gate before frontend integration.
