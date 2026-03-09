/**
 * Essay Intelligence System — Profile Type Definitions (V2)
 *
 * This file defines the complete type system for the EssayProfile: a multi-resolution
 * semantic map that represents the system's understanding of an essay at every
 * granularity level — from holistic thesis down to individual word choices.
 *
 * The profile separates three layers that must never be confused:
 * - Understanding (descriptive): what the essay IS — persistent, deepens every layer
 * - Analysis (evaluative): how well it works — persistent, refined over time
 * - Feedback (prescriptive): what to do about it — EPHEMERAL, generated fresh per context
 *
 * Supersession model: when arrays are updated (e.g., observedFunctions, inferredIntents),
 * the entire array is REPLACED, never appended. This ensures consistency — a later
 * paragraph's walk output that deepens understanding of P1S1 replaces P1S1's
 * observedFunctions array wholesale with a richer set of observations.
 *
 * Consumed by: all essayIntelligence/* modules, profile manager, profile router,
 *              coaching service, edit understanding, annotation pipeline
 *
 * Authoritative spec: docs/plan-sections/01-essay-profile-types.md (1,779 lines)
 * Profile Manager spec: docs/plan-sections/04-profile-manager.md
 */

// ============================================================================
// ENUMS & UNION TYPES
// ============================================================================

/**
 * The 8 holistic dimensions of essay understanding.
 * Used for cross-dimension entanglements, staleness tracking, and connection classification.
 */
export type HolisticDimension =
  | 'voice'
  | 'emotion'
  | 'theme'
  | 'narrative'
  | 'character'
  | 'craft'
  | 'admissions'
  | 'structure';

/**
 * Holistic section types — matches the `holistic_section_type` DB enum exactly.
 * Used by the Profile Manager for staleness tracking and section-level operations.
 *
 * 10 values: the 7 primary holistic sections + voice_map + moment_earnedness_map
 * + cross_dimension_entanglements.
 */
export type HolisticSectionType =
  | 'voice_identity'
  | 'voice_map'
  | 'emotional_topography'
  | 'moment_earnedness_map'
  | 'thematic_architecture'
  | 'narrative_strategy'
  | 'character_revelation'
  | 'craft_assessment'
  | 'cross_dimension_entanglements'
  | 'admissions_positioning';

/**
 * Essay type classification — drives North Star scaling.
 * Matches the essay_type DB enum.
 */
export type EssayType = 'common_app' | 'supplement' | 'piq';

/**
 * Insight categories — matches the `insight_category` DB enum (8 values).
 * Each maps to specific Profile Manager behavior.
 */
export type InsightCategory =
  | 'confirmation'
  | 'reinterpretation'
  | 'new_context'
  | 'correction'
  | 'preference'
  | 'clarification'
  | 'emotional_reaction'
  | 'resistance';

/**
 * Improvement phase level — drives progressive precision in feedback.
 * Understanding + Analysis always evaluate everything at every level.
 * The phase determines what FEEDBACK surfaces to the student right now.
 */
export type ImprovementPhaseLevel =
  | 'foundation'
  | 'architecture'
  | 'craft'
  | 'polish'
  | 'distinction';

/**
 * Profile confidence level — how deep the system's understanding has grown.
 */
export type ConfidenceLevel = 'initial' | 'developing' | 'deep' | 'comprehensive';

/**
 * North Star confidence — includes student confirmation as highest tier.
 */
export type NorthStarConfidence = 'hypothesis' | 'emerging' | 'full' | 'student_confirmed';

/**
 * North Star active scale — driven by essay length.
 * Supplements get 2 dimensions, PIQs get 3, personal statements get all 5.
 */
export type NorthStarScale = 'supplement' | 'piq' | 'personal_statement';

/**
 * Tonal quality — the emotional coloring of the narrator's stance.
 * Not the content's emotion, but HOW the writer positions themselves toward the content.
 */
export type TonalQuality =
  | 'humor'
  | 'irony'
  | 'earnestness'
  | 'irreverence'
  | 'solemnity'
  | 'self_awareness'
  | 'detachment'
  | 'tenderness'
  | 'defiance';

/** The five voice dimensions tracked in VoiceMap */
export type VoiceDimension =
  | 'register'
  | 'vocabulary'
  | 'rhythm'
  | 'perspective'
  | 'tonal_disposition';

/**
 * Types of narrative mechanisms that earn significant moments.
 * 7 types covering emotional, intellectual, and humorous payoffs.
 */
export type EarningMechanismType =
  | 'sensory_grounding'
  | 'emotional_setup'
  | 'stakes_establishment'
  | 'character_revelation'
  | 'thematic_preparation'
  | 'intellectual_scaffolding'
  | 'comedic_subversive_setup';

/**
 * Edit change type — classified with nuance that syntactic analysis cannot achieve.
 */
export type EditChangeType =
  | 'word_refinement'
  | 'meaning_evolution'
  | 'tonal_voice_shift'
  | 'content_expansion'
  | 'content_reduction'
  | 'structural_reorganization';

/**
 * Thematic thread strength.
 */
export type ThreadStrength = 'dominant' | 'supporting' | 'hinted' | 'dropped';

/**
 * Narrative move in the through-line journey.
 */
export type NarrativeMove =
  | 'introduction'
  | 'development'
  | 'submersion'
  | 'resurfacing'
  | 'transformation'
  | 'resolution'
  | 'complication'
  | 'echo';

/**
 * Element type in through-line map.
 */
export type ThroughLineElementType =
  | 'image'
  | 'question'
  | 'tension'
  | 'metaphor'
  | 'relationship'
  | 'idea';

/**
 * Structural role weight — determines edit sensitivity.
 */
export type StructuralWeight = 'load_bearing' | 'supporting' | 'transitional' | 'decorative';

/**
 * Staleness strength — three tiers with bounded propagation.
 */
export type StalenessStrength = 'strong' | 'moderate' | 'weak';

/**
 * Mutation types — 13 values used by the staleness dependency map.
 * Each maps to a set of staleness effects on other profile sections.
 */
export type MutationType =
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

/**
 * Checkpoint reason — when and why the coordinator saves state.
 */
export type CheckpointReason =
  | 'after_l1_l2'
  | 'after_l3'
  | 'after_l3_75'
  | 'after_l3_5'
  | 'after_l4'
  | 'after_l5'
  | 'conversation_save'
  | 'before_reanalysis'
  | 'circuit_breaker';

// ============================================================================
// CORE BUILDING BLOCKS
// ============================================================================

/**
 * ObservationEntry — the multi-observation unit used everywhere for fields
 * where a single sentence/element can have multiple distinct observations.
 *
 * Supersession model: entire arrays of ObservationEntry are replaced on update,
 * never appended. Back-propagation from later paragraphs replaces the ENTIRE
 * observedFunctions array with a deeper set of observations.
 */
export interface ObservationEntry {
  /** The observation text */
  observation: string;
  /** Confidence in this observation (0-1). Higher = more certain. */
  confidence?: number;
  /** Text evidence supporting this observation */
  evidence?: string;
}

/**
 * Location reference used throughout the profile for paragraph/sentence positions.
 */
export interface ParagraphLocation {
  paragraph: number;
  sentence?: number;
  sentenceRange?: [number, number];
}

// ============================================================================
// SENTENCE-LEVEL TYPES
// ============================================================================

/**
 * SentenceUnderstanding — descriptive layer: what the sentence IS doing.
 * Populated by L3 understanding walk. Back-propagated as later paragraphs
 * reveal new context about earlier sentences.
 *
 * Supersession model: entire array fields (observedFunctions, inferredIntents,
 * narrativeContributions) are REPLACED on update, never appended.
 */
export interface SentenceUnderstanding {
  /**
   * What the sentence IS doing — can be MULTIPLE things (factual observation).
   * Example: [{observation: "Grounds reader in pawnshop scene through physical action"},
   *           {observation: "Introduces the diamond as the essay's central symbol"}]
   */
  observedFunctions: ObservationEntry[];

  /**
   * What the writer is TRYING to achieve (interpretive).
   * Refined in L6 when the student reveals their actual thinking.
   */
  inferredIntents: ObservationEntry[];

  /**
   * How this sentence advances the narrative — can advance arc + carry thread + set up callback.
   */
  narrativeContributions: ObservationEntry[];

  /** Rhetorical functions: scene-setting, symbol-introduction, argument, etc. */
  rhetoricalFunctions: string[];

  /** How this sentence serves THIS paragraph's goal */
  paragraphContribution: string;

  /** Craft observations for this sentence */
  craft: SentenceCraft;

  /**
   * Notable words/phrases with their significance.
   * No isStrength — evaluation belongs in the analysis layer.
   */
  significantChoices: Array<{
    word: string;
    significance: string;
  }>;

  /** IDs into the centralized connections store */
  connectionRefs: string[];

  /** Semantic tags for fast lookup and routing */
  tags: string[];
}

/**
 * SentenceCraft — craft-level observations about a sentence.
 */
export interface SentenceCraft {
  /** Rhythm classification: short_punch, medium_flow, long_build, etc. */
  rhythm: string;
  /** How well voice aligns with the essay's dominant voice */
  voiceAlignment: string;
  /** Specific craft techniques used */
  techniques: string[];
}

/**
 * SentenceAnalysis — evaluative layer: how well the sentence is working.
 * Populated by L3.5 analysis pass (separate API call from understanding).
 * The LLM sees COMPLETE understanding when producing analysis.
 */
export interface SentenceAnalysis {
  /** Effectiveness score (0-100) */
  effectiveness: number;
  /** WHY this effectiveness — references understanding observations */
  effectivenessReasoning: string;
  /** Multiple things can work well */
  strengths: ObservationEntry[];
  /** Multiple issues can exist */
  weaknesses: ObservationEntry[];
  /** Whether this sentence is a strength of the essay */
  isStrength: boolean;
  /** Whether this sentence has a problem that should be addressed */
  isProblem: boolean;
  /** Priority for improvement (0 = fine, 5 = urgent) */
  priorityForImprovement: number;
}

/**
 * SentenceProfile — per-sentence container for understanding + analysis.
 * Nested under ParagraphProfile.
 */
export interface SentenceProfile {
  /** Sentence index within the paragraph */
  index: number;
  /** The sentence text (populated at load time from essay text, NOT stored in JSONB) */
  text: string;

  /** L3 understanding (descriptive) — null until L3 walk reaches this sentence */
  understanding: SentenceUnderstanding | null;
  /** L3.5 analysis (evaluative) — null until L3.5 pass completes */
  analysis: SentenceAnalysis | null;
}

// ============================================================================
// PARAGRAPH-LEVEL TYPES
// ============================================================================

/**
 * ParagraphUnderstanding — descriptive layer for a paragraph.
 * What this paragraph DOES in the essay.
 */
export interface ParagraphUnderstanding {
  /** What the paragraph does: the core function in the essay's architecture */
  role: string;
  /** What the paragraph is trying to achieve */
  function: string;
  /** How it advances the thesis, serves the emotional arc, carries thematic threads */
  narrativeContribution: string;
  /** Emotional register: dominant emotion, depth, authenticity */
  emotionalRegister: {
    dominantEmotion: string;
    depth: string;
    authenticity: string;
    showVsTell: string;
    strongestMoment: string | null;
  };
  /** Craft profile at paragraph level */
  craftProfile: {
    rhythmPattern: string;
    imageUsage: string;
    voiceConsistency: string;
    standoutMoment: string | null;
    weaknessMoment: string | null;
  };
}

/**
 * ParagraphAnalysis — evaluative layer for a paragraph.
 * How well this paragraph fulfills its role.
 */
export interface ParagraphAnalysis {
  /** Overall paragraph effectiveness (0-100) */
  effectiveness: number;
  /** Single-sentence assessment */
  verdict: string;
  /** What this paragraph does well */
  strengthSignatures: Array<{
    quality: string;
    evidence: string;
  }>;
  /** Where this paragraph has room to grow */
  growthEdges: Array<{
    quality: string;
    description: string;
  }>;
}

/**
 * ParagraphProfile — per-paragraph container for understanding + analysis + sentences.
 * The paragraph map is the second resolution level of the EssayProfile.
 */
export interface ParagraphProfile {
  /** Paragraph index in the essay */
  index: number;
  /** The paragraph text (populated at load time) */
  text: string;

  /** Tags for routing and lookup */
  tags: string[];

  /** L3 understanding (descriptive) — null until L3 walk reaches this paragraph */
  understanding: ParagraphUnderstanding | null;
  /** L3.5 analysis (evaluative) — null until L3.5 pass completes */
  analysis: ParagraphAnalysis | null;

  /** Sentence-level profiles (ordered by index) */
  sentences: SentenceProfile[];

  /** Walk skip marker if pipeline failed on this paragraph */
  walkSkipped?: WalkSkippedMarker;
}

// ============================================================================
// HOLISTIC SECTION TYPES (8 sections + entanglements)
// ============================================================================

/**
 * VoiceIdentity — holistic voice summary.
 * Describes WHAT the voice sounds like. Complements VoiceMap which describes
 * WHERE the voice lives and HOW it moves.
 *
 * NO consistencyScore — replaced by VoiceMap's spatial, dimensional tracking.
 */
export interface VoiceIdentity {
  /** One-paragraph description of the writer's voice */
  signature: string;
  /** Primary register */
  register: string;
  /** What makes this voice distinctive */
  distinctivePatterns: string[];
  /** How voice evolves through the essay — narrative of voice movement */
  evolution: string;
  /**
   * Moments that feel genuinely the writer's vs. moments that feel performed.
   * Location is [paragraph, sentence].
   */
  authenticVsPerformed: Array<{
    location: [number, number];
    assessment: 'authentic' | 'performed';
    reasoning: string;
  }>;
}

/**
 * VoiceMap — five-dimensional tracking of voice across the essay.
 *
 * NOT a replacement for VoiceIdentity. VoiceIdentity describes WHAT the voice is
 * (holistic summary). VoiceMap describes WHERE the voice is and HOW it moves
 * (structured spatial map). They complement each other.
 *
 * Dimensions are spatial: observations per passage location.
 */
export interface VoiceMap {
  /** Register: formality and distance — the most audible dimension */
  register: VoiceMapDimension;
  /** Vocabulary Fingerprint: recurring word families, domain-specific vocabulary */
  vocabularyFingerprint: VoiceMapDimensionWithDomains;
  /** Sentence Rhythm: cadence patterns */
  sentenceRhythm: VoiceMapDimension;
  /** Perspective and Distance: how close the narrator stands to events */
  perspectiveDistance: VoiceMapDimension;
  /** Tonal Disposition: emotional coloring of the narrator's stance */
  tonalDisposition: VoiceMapDimensionWithQualities;

  /** Recorded voice shifts — where one or more voice dimensions change */
  shifts: VoiceShift[];

  /** Code-switching events — language/register shifts with cultural roots */
  codeSwitching: CodeSwitchEvent[];
}

/** Base voice map dimension with baseline and observations */
export interface VoiceMapDimension {
  /** The essay's dominant characteristic for this dimension */
  baseline: string;
  /** Per-passage observations where this dimension is notable or shifts */
  observations: VoiceObservation[];
}

/** Voice map dimension with domain tracking (vocabulary fingerprint) */
export interface VoiceMapDimensionWithDomains extends VoiceMapDimension {
  /** Specific vocabulary domains identified */
  domains: Array<{
    domain: string;
    exampleWords: string[];
    paragraphs: number[];
  }>;
}

/** Voice map dimension with tonal quality tracking */
export interface VoiceMapDimensionWithQualities extends VoiceMapDimension {
  /** Dominant tonal qualities detected across the essay */
  dominantQualities: TonalQuality[];
}

/**
 * VoiceObservation — a single observation about voice at a specific location.
 */
export interface VoiceObservation {
  /** Which passage this observation covers */
  location: {
    paragraph: number;
    sentenceRange?: [number, number];
  };
  /** What the voice is doing at this location */
  observation: string;
  /** Which dimension(s) this observation primarily concerns */
  dimensions: VoiceDimension[];
}

/**
 * VoiceShift — a recorded voice shift with intentionality assessment.
 * The intentionality assessment is the map's most critical annotation:
 * it determines whether the shift is a strength (intentional variation)
 * or a weakness (unintentional drift).
 */
export interface VoiceShift {
  /** Where the shift occurs */
  location: {
    paragraph: number;
    sentence?: number;
    boundary: 'paragraph_boundary' | 'mid_paragraph' | 'sentence_boundary';
  };
  /** Which dimensions shift */
  dimensions: VoiceDimension[];
  /** Description of what voice was before */
  fromDescription: string;
  /** Description of what voice became */
  toDescription: string;
  /**
   * Intentionality assessment — the critical distinction.
   * Below 0.6 confidence, present as question to student, not assertion.
   */
  intentionality: {
    assessment: 'intentional' | 'unintentional' | 'ambiguous';
    confidence: number;
    reasoning: string;
  };
  /** What the shift serves (for intentional shifts) */
  servesFunction?: string;
  /** Cross-dimension entanglement reference if this shift IS a thematic/emotional move */
  entanglementRef?: string;
}

/**
 * CodeSwitchEvent — a language/register shift with cultural roots.
 * Tracked separately because code-switching carries cultural weight that
 * generic "voice shift" notation cannot capture.
 */
export interface CodeSwitchEvent {
  location: { paragraph: number; sentence: number };
  /** The language or register being switched to */
  language: string;
  /** What triggered the switch */
  trigger: string;
  /** The cultural function the switch serves */
  culturalFunction: string;
  /** Text of the code-switched passage */
  text: string;
}

/**
 * EmotionalTopography — maps the essay's emotional landscape.
 * NO isEarned — replaced by MomentEarnednessMap's backward-tracing network.
 */
export interface EmotionalTopography {
  /** The essay's emotional arc — how emotion moves from opening to close */
  arcTrajectory: string;
  /** Peak emotional moments — WHAT and WHERE */
  peakMoments: Array<{
    location: [number, number];
    emotion: string;
    intensity: 'low' | 'moderate' | 'high' | 'peak';
  }>;
  /** Undertones — emotions felt but not stated */
  undertones: string[];
  /** How emotion shifts paragraph to paragraph */
  emotionalProgression: Array<{
    paragraph: number;
    register: string;
    shift: string;
  }>;
  /** Show vs tell assessment — where emotions are embodied vs asserted */
  showVsTell: Array<{
    location: [number, number];
    assessment: 'shown' | 'told' | 'mixed';
    detail: string;
  }>;
}

/**
 * MomentEarnednessMap — backward-tracing network for significant moments.
 *
 * For each significant moment in the essay (emotional, intellectual, humorous),
 * traces backward through the narrative to identify specific earlier passages
 * that make it work (or the specific gaps that make it fall flat).
 *
 * Uses arrow networks, not booleans. The DENSITY of arrows is the diagnosis:
 * many arrows converging = well-earned, sparse arrows = unearned.
 */
export interface MomentEarnednessMap {
  /**
   * Each significant moment with its backward-tracing network.
   * "Significant" is determined by L3.75 holistic synthesis.
   */
  moments: EarnedMoment[];

  /**
   * Essay-level summary of earned-ness patterns.
   * NOT a score — a structural observation about the essay's setup-payoff architecture.
   */
  structuralObservation: string;
}

/**
 * EarnedMoment — a single significant moment with its earned-ness network.
 */
export interface EarnedMoment {
  /** Where the moment occurs */
  location: { paragraph: number; sentence: number };
  /** What kind of moment this is */
  momentType: 'emotional' | 'intellectual' | 'humorous' | 'subversive';
  /** Description of the moment */
  description: string;
  /** The emotion, idea, or effect the moment carries */
  payload: string;
  /**
   * The narrative mechanisms that earn this moment.
   * DENSITY of this array is the diagnosis: many = well-earned, few = unearned.
   */
  mechanisms: EarningMechanism[];
  /**
   * What is MISSING when the moment is unearned.
   * Populated when mechanisms array is sparse — identifies the gap.
   */
  gaps: string[];
}

/**
 * EarningMechanism — a specific earlier passage that contributes to
 * a significant moment's impact.
 */
export interface EarningMechanism {
  /** The type of narrative work this passage does for the moment */
  type: EarningMechanismType;
  /** Where the earning passage is */
  location: ParagraphLocation;
  /** How this passage contributes to the moment's impact */
  contribution: string;
  /** Connection reference if this mechanism corresponds to a tracked connection */
  connectionRef?: string;
}

/**
 * ThematicArchitecture — central thesis, threads, subtext, contradictions.
 */
export interface ThematicArchitecture {
  /** The essay's central thesis (may evolve through layers) */
  centralThesis: string;
  /** How confident the system is in the thesis reading (0-1) */
  thesisConfidence: number;
  /** How the thesis emerges and crystallizes through the essay */
  thesisEvolution: string;
  /** Thematic threads with paragraph spans */
  threads: Array<{
    thread: string;
    introducedAt: { paragraph: number; sentence?: number };
    appearances: Array<{ paragraph: number; sentence?: number }>;
    strength: ThreadStrength;
  }>;
  /** Subtext — implied but never stated */
  subtext: string;
  /** Productive contradictions/tensions that drive the essay */
  contradictions: string[];
}

/**
 * NarrativeStrategy — primary strategy, pivot points, pacing, structural choices.
 */
export interface NarrativeStrategy {
  /** The primary narrative strategy and WHY it serves this story */
  primaryStrategy: string;
  /** Rationale for this strategy */
  strategyRationale: string;
  /** Pivot points in the narrative */
  pivotPoints: Array<{
    location: { paragraph: number; sentence?: number };
    description: string;
  }>;
  /** Pacing analysis */
  pacingAnalysis: string;
  /** Structural choices and their effects */
  structuralChoices: string[];
}

/**
 * CharacterRevelation — who the writer is behind the words.
 */
export interface CharacterRevelation {
  /** Who is this writer (the person behind the words) */
  writerPortrait: string;
  /** Values revealed — shown, not told */
  valuesRevealed: string[];
  /** Growth arc detected in the essay */
  growthArc: string;
  /** Intellectual fingerprint — how this person thinks */
  intellectualFingerprint: string;
  /** Blind spots they might not see */
  blindSpots: string[];
}

/**
 * CraftAssessment — strength signatures, growth edges, image system, patterns.
 */
export interface CraftAssessment {
  /** Strength signatures with evidence */
  strengthSignatures: Array<{
    quality: string;
    evidence: string;
    paragraphs: number[];
  }>;
  /** Growth edges with reasoning */
  growthEdges: Array<{
    quality: string;
    description: string;
    paragraphs: number[];
  }>;
  /** Image/metaphor system analysis */
  imageSystem: string;
  /** Sentence-level patterns */
  sentencePatterns: string;
  /** Word-level patterns */
  wordPatterns: string;
}

/**
 * CrossDimensionEntanglement — moments where 2+ dimensions intersect meaningfully.
 *
 * Sits as the 8th holistic section. NOT redundant with individual dimension sections.
 * Each dimension section describes what that dimension does in isolation.
 * Entanglements describe what happens at the INTERSECTION.
 *
 * Entanglements are the evidence layer that the distinctiveness signature synthesizes from.
 * Staleness cascades from entanglements to distinctiveness, not the reverse.
 */
export interface CrossDimensionEntanglement {
  /** Unique ID for reference from other sections (e.g., distinctiveness signature) */
  id: string;
  /** The dimensions that intersect at this moment */
  dimensions: HolisticDimension[];
  /** Where in the essay this entanglement occurs */
  location: ParagraphLocation;
  /** Description of the entanglement — what happens at the intersection */
  description: string;
  /** Which dimension sections this entanglement should be cross-referenced in */
  crossRefs: HolisticDimension[];
}

/**
 * AdmissionsPositioning — how this essay positions the student for admissions.
 */
export interface AdmissionsPositioning {
  /** 30-second AO pitch */
  tellabilitySummary: string;
  /** What makes this essay distinctive for admissions */
  distinctivenessFactors: string[];
  /** Institutional fit signals */
  institutionalFit: string;
  /** Red flags for admissions readers */
  redFlags: string[];
  /** Memorability assessment */
  memorability: string;
  /** How this essay positions within a portfolio */
  portfolioPosition: string;
}

// ============================================================================
// NORTH STAR TYPES (architecture of meaning — replaces EssayDNA)
// ============================================================================

/**
 * EssayNorthStar — the architecture of meaning.
 *
 * Five conceptual dimensions that together describe HOW the essay means,
 * not what it says or how well. Built progressively through layers.
 *
 * Scaled by essay length:
 * - Supplements (<250 words): 2 dims (structuralRolesMap + distinctivenessSignature)
 * - PIQs (~350 words): 3 dims (+ trajectory)
 * - Personal statements (~650 words): all 5 dims
 */
export interface EssayNorthStar {
  /** Which dimensions are active for this essay (driven by essay length) */
  activeScale: NorthStarScale;

  /**
   * DIMENSION 1: Through-Line Map (personal statements only — null for supplements and PIQs).
   * Traces the essay's central element where it surfaces, submerges, transforms, resolves.
   * CRITICAL: This is INTERPRETATION, not data. Connection graph = raw data,
   * through-line map = meaning interpretation.
   */
  throughLineMap: ThroughLineMap | null;

  /**
   * DIMENSION 2: Structural Roles Map (all essay types).
   * What each section IS in the architecture of meaning — structural necessity, not topic.
   */
  structuralRolesMap: StructuralRole[];

  /**
   * DIMENSION 3: Trajectory & Potential (PIQs and personal statements — null for supplements).
   * Where the essay IS and where it COULD go — MULTIPLE plausible paths.
   */
  trajectory: EssayTrajectory | null;

  /**
   * DIMENSION 4: Distinctiveness Signature (all essay types).
   * What makes this essay NON-INTERCHANGEABLE.
   * READS FROM entanglements — entanglements are evidence, distinctiveness is synthesis.
   */
  distinctivenessSignature: DistinctivenessSignature;

  /**
   * DIMENSION 5: Intent Bridge (personal statements only — null for supplements and PIQs).
   * Student's stated understanding alongside the system's.
   * Populated primarily through L6 conversation.
   */
  intentBridge: IntentBridge | null;

  /** Confidence level of the North Star overall */
  confidence: NorthStarConfidence;
  /** Which layer last updated the North Star */
  lastUpdatedBy: string;
}

/**
 * ThroughLineMap — traces the essay's central element through the narrative.
 */
export interface ThroughLineMap {
  /** The central element being traced */
  centralElement: string;
  /** What kind of element it is */
  elementType: ThroughLineElementType;
  /** The transformation the element undergoes — the MEANING journey */
  transformation: string;
  /** Where the element surfaces, submerges, transforms across the essay */
  journey: Array<{
    location: { paragraph: number; sentence?: number };
    /** What the element means at this point in the journey */
    meaningAtPoint: string;
    /** What narrative move happens to the element here */
    narrativeMove: NarrativeMove;
  }>;
  /** Connection references from the connection graph that constitute this through-line */
  connectionRefs: string[];
}

/**
 * StructuralRole — what a section IS in the architecture of meaning.
 */
export interface StructuralRole {
  /** Which paragraph(s) this role covers (often 1, can span multiple) */
  paragraphs: number[];
  /** The structural role: "frame_of_risk", "value_system", "fulcrum", "resolution", etc. */
  role: string;
  /** WHY this role matters to the essay's architecture */
  significance: string;
  /** How load-bearing this section is — determines edit sensitivity */
  weight: StructuralWeight;
}

/**
 * EssayTrajectory — where the essay IS and where it COULD go.
 * Always presents MULTIPLE plausible paths. The student decides, the system maps options.
 */
export interface EssayTrajectory {
  /** Current state assessment */
  currentState: string;
  /**
   * Multiple plausible paths the essay could take from here.
   * ALWAYS plural — the student decides, the system maps options.
   */
  plausiblePaths: Array<{
    description: string;
    /** How much the current text supports this path (not how "good" it would be) */
    textSupport: 'strong' | 'moderate' | 'speculative';
    /** What would need to change or be added to realize this path */
    requirements: string[];
  }>;
  /** Unrealized connections — things the text contains that could be threaded more deeply */
  unrealizedConnections: Array<{
    description: string;
    locations: Array<[number, number]>;
  }>;
}

/**
 * DistinctivenessSignature — what makes this essay non-interchangeable.
 */
export interface DistinctivenessSignature {
  /** The core distinctiveness articulation — one paragraph, not a label */
  articulation: string;
  /** The entanglement references this distinctiveness draws from */
  entanglementRefs: string[];
  /** What makes it non-interchangeable — specific, not categorical */
  nonInterchangeableFactors: string[];
}

/**
 * IntentBridge — student's stated understanding alongside the system's.
 */
export interface IntentBridge {
  /** What the student says the essay is about / trying to do */
  studentIntent: string | null;
  /** What the system reads the essay as doing */
  systemReading: string;
  /** How they align or diverge — the divergence is coaching fuel */
  alignments: Array<{
    aspect: string;
    alignment: 'confirmed' | 'partial' | 'divergent' | 'student_unaware';
    detail: string;
  }>;
  /** Session insights that informed the bridge — traceable to specific conversations */
  sourceInsightIds: string[];
}

// ============================================================================
// CONNECTIONS TYPES
// ============================================================================

/**
 * ProfileConnections — centralized connection store. Single source of truth.
 * Sentences reference by ID (connectionRefs), never embed descriptions.
 */
export interface ProfileConnections {
  /** All connections stored ONCE with unique ID */
  all: Connection[];
  /** Image/metaphor recurrences across paragraphs */
  imageRecurrences: Array<{
    image: string;
    locations: Array<[number, number]>;
  }>;
  /** Narrative arc map: which sentences play which arc role */
  narrativeArcMap: Array<{
    role: string;
    location: [number, number];
  }>;
  /** Redundancies and gaps */
  redundancies: Array<{
    paragraphs: number[];
    overlappingContent: string;
  }>;
}

/**
 * Connection — a single cross-paragraph connection.
 */
export interface Connection {
  /** Unique connection ID */
  id: string;
  /** Source location [paragraph, sentence] */
  from: [number, number];
  /** Target location [paragraph, sentence] */
  to: [number, number];
  /** Connection type */
  type: string;
  /** Description of what connects these locations */
  description: string;
  /** Confidence in this connection (0-1) */
  confidence: number;
  /** Which layer discovered this connection */
  discoveredByLayer: string;
}

// ============================================================================
// CONVERSATION INSIGHT TYPES
// ============================================================================

/**
 * ConversationInsight (V2) — a single piece of understanding extracted from
 * a student's message during L6 coaching.
 *
 * The taxonomy is layered: primary category drives mechanical behavior (Profile Manager),
 * secondary attributes drive nuanced response (coach adaptation).
 *
 * 8 categories and 4 durability levels.
 */
export interface ConversationInsight {
  /** Unique ID */
  id: string;
  /** When extracted */
  timestamp: string;
  /** The student's original words that produced this insight */
  sourceText: string;

  // -- PRIMARY CATEGORY (drives Profile Manager action) --
  category: InsightCategory;

  // -- SECONDARY ATTRIBUTES (modulates nuance) --

  /** Emotional valence of the insight */
  emotionalValence: 'positive' | 'negative' | 'neutral' | 'mixed';
  /** How confident the student seems in what they're saying */
  studentConfidence: 'high' | 'moderate' | 'low' | 'uncertain';
  /** How explicitly the insight was stated */
  explicitness: 'explicit' | 'implicit' | 'inferred';
  /** How certain we are about the scope */
  scopeCertainty: 'high' | 'moderate' | 'low';
  /** How novel this insight is relative to existing understanding */
  novelty: 'high' | 'moderate' | 'low';

  // -- SCOPE (probability distribution, not point estimate) --
  scope: InsightScope;

  // -- SUPERSESSION --
  /**
   * Partial supersession support. The original is marked as partially superseded,
   * preserving confirmed portions while revising the framing.
   */
  partiallySupersedes?: {
    insightId: string;
    confirmedPortion: string;
    revisedPortion: string;
  };

  // -- DURABILITY --
  /**
   * How long this insight survives changes to the essay.
   * - ephemeral: tied to specific text, invalidated by edits to that text
   * - draft_durable: survives minor edits, invalidated by structural rewrites
   * - essay_durable: persists as long as this essay is being worked on
   * - student_durable: persists across ALL essays (copied to user-level store)
   */
  durability: 'ephemeral' | 'draft_durable' | 'essay_durable' | 'student_durable';

  /** Which essay version this insight was generated against */
  essayVersion: number;
}

/**
 * InsightScope — scope as a probability distribution across the essay's hierarchy.
 * Supports multi-scope insights (e.g., connecting two paragraphs).
 */
export interface InsightScope {
  /** Probability this insight applies to the entire essay */
  essayProbability: number;
  /** Paragraph-level probabilities */
  paragraphs: Array<{ index: number; probability: number }>;
  /** Sentence-level probabilities */
  sentences: Array<{ paragraph: number; sentence: number; probability: number }>;
}

/**
 * PatternInsight — meta-observations about the coaching process.
 * Stored separately so they inform coaching strategy without polluting the essay profile.
 */
export interface PatternInsight {
  id: string;
  /** Description of the observed pattern */
  pattern: string;
  /** Specific instances that constitute the pattern */
  evidence: string[];
  /** What this means for coaching strategy */
  implication: string;
  /** Timestamps */
  firstObservedAt: string;
  lastObservedAt: string;
  /** Number of instances that constitute this pattern */
  instanceCount: number;
}

// ============================================================================
// EDIT UNDERSTANDING TYPES
// ============================================================================

/**
 * EditDiff — mechanical pre-processing output. What physically changed
 * between two versions. No judgment, no significance assessment.
 */
export interface EditDiff {
  /** Essay-level structural changes */
  structural: {
    paragraphsAdded: number[];
    paragraphsRemoved: number[];
    paragraphsReordered: boolean;
    paragraphDelta: number;
  };
  /** Per-paragraph changes */
  paragraphChanges: Array<{
    paragraphIndex: number;
    changeType: 'modified' | 'added' | 'removed';
    sentenceChanges: Array<{
      sentenceIndex: number;
      changeType: 'modified' | 'added' | 'removed' | 'unchanged';
      oldText?: string;
      newText?: string;
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
    changeRatio: number;
  };
}

/**
 * EditUnderstanding — the LLM's nuanced reading of what an edit means
 * in the context of the essay's profile.
 */
export interface EditUnderstanding {
  /** How significant is this change (nuanced, not just word count) */
  significance: 'minor' | 'moderate' | 'significant' | 'transformative';
  /** Reasoning behind significance assessment */
  significanceReasoning: string;
  /** What kind of change is this */
  changeType: EditChangeType;
  /** Apparent purpose — the LLM infers likely intent (tentative, confirmable by student) */
  apparentPurpose: string;
  /** Confidence in the apparent purpose (0-1) */
  purposeConfidence: number;
  /** How this change maps to the profile */
  profileImpact: {
    directImpact: string;
    connectionImpact: Array<{
      connectionId: string;
      effect: 'altered' | 'strengthened' | 'weakened' | 'broken' | 'unchanged';
      reasoning: string;
    }>;
    paragraphImpact: string | null;
    holisticImpact: string | null;
  };
  /** Recommended analysis scope */
  scopeRecommendation: {
    scope: 'sentence_update' | 'paragraph_reanalysis' | 'targeted_holistic_refresh' | 'comprehensive';
    reasoning: string;
    targets?: string[];
  };
}

/**
 * VersionRecord — accumulated changes between two analysis points.
 * NOT a rollback backup — a running change log with intent annotations.
 */
export interface VersionRecord {
  /** Version identifier (incremented at each analysis checkpoint) */
  version: number;
  /** Essay text at this version's analysis checkpoint */
  snapshotText: string;
  /** Timestamp of the analysis checkpoint */
  analyzedAt: string;
  /** All changes that occurred between the previous version and this one */
  changes: Array<{
    timestamp: string;
    location: { paragraph: number; sentence?: number };
    oldText: string;
    newText: string;
    understanding?: EditUnderstanding;
    intentAnnotation?: string;
  }>;
  /** Conversation insights collected since the previous version (insight IDs) */
  insightsSinceLastVersion: string[];
  /** Light-touch adjustments applied during this version */
  lightTouchAdjustments: Array<{
    field: string;
    adjustment: string;
    source: 'conversation' | 'edit_workshop';
  }>;
}

// ============================================================================
// IMPROVEMENT PHASE
// ============================================================================

/**
 * ImprovementPhase — drives progressive precision in feedback.
 * Understanding + Analysis always evaluate everything at every level.
 * The phase determines what FEEDBACK surfaces to the student right now.
 *
 * Computed from L3.5 analysis results. Stored in ProfileIndex so every
 * subsequent call (L5 annotations, L6 coaching) knows the zoom level.
 * Re-computed after every re-analysis (phase can shift up OR down).
 */
export interface ImprovementPhase {
  level: ImprovementPhaseLevel;
  /** Why this phase was chosen */
  reasoning: string;
  /** Specific things to address at this level */
  focusAreas: string[];
  /** Things that exist but aren't worth surfacing yet */
  deferredAreas: string[];
  /** Rough percentage of essay that's "solid" at each granularity */
  readiness: {
    essayLevel: number;
    paragraphLevel: number;
    sentenceLevel: number;
    wordLevel: number;
  };
}

// ============================================================================
// PROFILE INDEX (compact table of contents — always loaded)
// ============================================================================

/**
 * ProfileIndex — compact (~250-350 token) table of contents.
 * ALWAYS loaded into every API call. Tells the AI what understanding EXISTS
 * without requiring it to read the full profile.
 */
export interface ProfileIndex {
  /** Essay length summary */
  essayLength: { paragraphs: number; sentences: number; words: number };
  /** How deep the system's understanding has grown */
  confidenceLevel: ConfidenceLevel;

  /** Global topics present in the essay */
  essayTopics: string[];

  /** One-liner per paragraph — scannable */
  paragraphDigest: Array<{
    index: number;
    roleSummary: string;
    tags: string[];
    themes: string[];
    sentenceCount: number;
    hasStrengths: boolean;
    hasWeaknesses: boolean;
    connectionCount: number;
    improvementPriority: number;
  }>;

  /** Approximate token count per profile section (for token budgeting) */
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
    paragraphs: number[];
  };

  /** Connection graph: which paragraphs/sentences link to each other */
  connectionGraph: Array<{
    from: [number, number];
    to: [number, number];
    type: string;
  }>;

  /** Compact North Star summary — structural significance without full North Star */
  northStarSummary: {
    throughLineSummary: string | null;
    structuralRoles: Array<{
      paragraphIndex: number;
      role: string;
      significance: 'load_bearing' | 'supporting' | 'transitional';
    }>;
    maturity: 'absent' | 'sketch' | 'emerging' | 'full';
  };

  /** Staleness tracking — which sections need refreshing */
  staleness: {
    strongStale: string[];
    moderateStale: string[];
    weakStale: string[];
    lastChangeAt: string | null;
  };

  /** Active concerns — what needs attention */
  activeConcerns: Array<{
    location: [number, number | null];
    concern: string;
    severity: 'critical' | 'significant' | 'minor';
  }>;

  /** Improvement phase — determines feedback zoom level */
  improvementPhase: ImprovementPhase;

  /** Number of full analysis passes completed (drives comprehensive→focused transition) */
  fullAnalysisCount: number;
  /** Timestamp of last comprehensive analysis */
  lastComprehensiveAt: string | null;
}

// ============================================================================
// THE ROOT TYPE: EssayProfile
// ============================================================================

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
export interface EssayProfile {
  /** Profile Index (always loaded — ~250-350 tokens) */
  index: ProfileIndex;

  // -- HOLISTIC UNDERSTANDING (essay-level — 8 sections) --

  /** Voice description — WHAT the voice sounds like (holistic summary) */
  voiceIdentity: VoiceIdentity;
  /** Voice map — WHERE the voice lives and HOW it moves (structured spatial map) */
  voiceMap: VoiceMap;
  /** Emotional arc, peaks, undertones, progression */
  emotionalTopography: EmotionalTopography;
  /** Backward-tracing network for significant moments */
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

  // -- NORTH STAR (architecture of meaning — replaces EssayDNA) --

  /** How the essay MEANS — through-line, structural roles, trajectory,
   *  distinctiveness, intent bridge. Scaled by essay length. */
  northStar: EssayNorthStar;

  // -- PARAGRAPH MAP (per-paragraph understanding + analysis) --
  paragraphs: ParagraphProfile[];

  // -- CROSS-ESSAY CONNECTIONS (centralized — single source of truth) --
  connections: ProfileConnections;

  // -- EDIT UNDERSTANDING (version tracking + change comprehension) --
  editHistory: VersionRecord[];

  // -- CONVERSATION INSIGHTS (L6-sourced student revelations) --
  conversationInsights: ConversationInsight[];
  patternInsights: PatternInsight[];

  // -- PROFILE METADATA --
  metadata: {
    confidenceLevel: ConfidenceLevel;
    lastUpdatedLayer: number;
    paragraphsCovered: number[];
    conversationInsightsCount: number;
    totalAnalysisCost: number;
    createdAt: string;
    lastMutatedAt: string;
    /** Whether this was migrated from the legacy system (needs re-analysis) */
    legacyProfile: boolean;
  };
}

// ============================================================================
// LAYER OUTPUT TYPES
// ============================================================================

/**
 * ParagraphFirstImpression — L1 output per paragraph.
 * Haiku-produced first-read observations. Purely descriptive.
 */
export interface ParagraphFirstImpression {
  paragraphIndex: number;
  /** Initial sentence-level observations */
  sentences: Array<{
    index: number;
    /** First-impression functions (what this sentence appears to do) */
    observedFunctions: ObservationEntry[];
    /** Initial intent guesses */
    inferredIntents: ObservationEntry[];
    /** Initial tags */
    tags: string[];
  }>;
  /** Initial paragraph role assessment */
  roleSummary: string;
  /** Initial tags at paragraph level */
  tags: string[];
}

/**
 * StructuralCartographyOutput — L2 output (extends existing StructuralCartography).
 * Reuses the existing StructuralCartography type from types.ts — imported by consumers.
 * This alias makes the layer output naming consistent.
 */
export type StructuralCartographyOutput = import('./types').StructuralCartography;

/**
 * ConnectionScoutOutput — L2.5 output. Scout leads for L3 to investigate.
 * Provisional cross-paragraph connections detected by Haiku parallel scan.
 */
export interface ConnectionScoutOutput {
  /** Provisional connections — low-confidence leads for L3 to confirm or reject */
  leads: Array<{
    from: [number, number];
    to: [number, number];
    type: string;
    description: string;
    /** Scout confidence — typically lower than L3-confirmed connections */
    confidence: number;
  }>;
  /** Surface-level observations that don't rise to connection level */
  observations: Array<{
    location: [number, number];
    observation: string;
  }>;
}

/**
 * UnderstandingWalkOutput — L3 output per paragraph.
 * Understanding ONLY — no evaluation, no judgment.
 *
 * Supersession model: priorSentenceUpdates replace entire arrays, never append.
 */
export interface UnderstandingWalkOutput {
  /** This paragraph's understanding (no evaluation) */
  paragraphUnderstanding: ParagraphUnderstanding;
  /** Sentence-level understanding for each sentence in this paragraph */
  sentenceUnderstandings: Array<{
    index: number;
    understanding: SentenceUnderstanding;
  }>;

  /**
   * Holistic understanding evolution — only fields that changed.
   * Captures INCREMENTAL holistic shifts during the walk.
   * The FULL holistic profile comes from L3.75 Holistic Synthesis.
   */
  holisticEvolution: {
    centralThesis?: string;
    thesisConfidence?: number;
    voiceSignature?: string;
    arcMomentum?: string;
  };

  /**
   * Prior sentence understanding updates — back-propagation.
   * When this paragraph revealed something new about a PRIOR sentence's
   * PURPOSE or MEANING (understanding only — not evaluation).
   *
   * Supersession model: entire arrays REPLACED, never appended.
   */
  priorSentenceUpdates: Array<{
    paragraph: number;
    sentence: number;
    observedFunctions?: ObservationEntry[];
    inferredIntents?: ObservationEntry[];
    narrativeContributions?: ObservationEntry[];
    newTags?: string[];
  }>;

  /** Cross-paragraph links discovered. Each gets a unique ID in the connection store. */
  newConnections: Array<{
    from: [number, number];
    to: [number, number];
    type: string;
    description: string;
  }>;
}

/**
 * HolisticSynthesisOutput — L3.75 output.
 * Single Sonnet call after walk. Reads all sentence-level understanding,
 * synthesizes ALL holistic sections including voice map and earnedness map.
 */
export interface HolisticSynthesisOutput {
  voiceIdentity: VoiceIdentity;
  voiceMap: VoiceMap;
  emotionalTopography: EmotionalTopography;
  momentEarnednessMap: MomentEarnednessMap;
  thematicArchitecture: ThematicArchitecture;
  narrativeStrategy: NarrativeStrategy;
  characterRevelation: CharacterRevelation;
  craftAssessment: CraftAssessment;
  entanglements: CrossDimensionEntanglement[];
  admissionsPositioning: AdmissionsPositioning;
}

/**
 * AnalysisPassOutput — L3.5 output per paragraph.
 * Evaluation with COMPLETE understanding (including holistic context from L3.75).
 */
export interface AnalysisPassOutput {
  paragraphIndex: number;

  /** Per-sentence analysis */
  sentenceAnalyses: Array<{
    sentenceIndex: number;
    effectiveness: number;
    effectivenessReasoning: string;
    strengths: ObservationEntry[];
    weaknesses: ObservationEntry[];
    isStrength: boolean;
    isProblem: boolean;
    priorityForImprovement: number;
  }>;

  /** Paragraph-level analysis */
  paragraphEffectiveness: number;
  paragraphVerdict: string;

  /** Essay-level evaluative insights that emerged from analyzing this paragraph */
  holisticAnalysisEvolution: {
    strengthSignatures?: Array<{ quality: string; evidence: string; paragraphs: number[] }>;
    growthEdges?: Array<{ quality: string; description: string; paragraphs: number[] }>;
    aoTakeaway?: string;
  };
}

/**
 * NorthStarOutput — L4 output. The five North Star dimensions.
 */
export type NorthStarOutput = EssayNorthStar;

// ============================================================================
// PROFILE MANAGER TYPES
// ============================================================================

/**
 * StalenessTracker — tracks which profile sections need refreshing.
 */
export interface StalenessTracker {
  /** All currently stale entries, keyed by location string */
  entries: Map<string, StalenessEntry>;

  /** Mark an element as stale */
  markStale(target: StalenessTarget, strength: StalenessStrength, reason: string, trigger: MutationType, depth?: 0 | 1 | 2): void;
  /** Clear staleness for an element */
  clearStaleness(target: StalenessTarget): void;
  /** Clear all staleness of a given strength or weaker */
  clearByStrength(maxStrength: StalenessStrength): void;
  /** Get count of strong-stale entries */
  getStrongStaleCount(): number;
  /** Get staleness snapshot (for Profile Router) */
  getSnapshot(): StalenessSnapshot;
  /** Get full report (for UI, debugging) */
  getReport(): StalenessReport;
}

/**
 * StalenessEntry — a single stale element.
 */
export interface StalenessEntry {
  target: StalenessTarget;
  strength: StalenessStrength;
  reason: string;
  /** When this staleness was recorded */
  markedAt: number;
  /** Which mutation caused this staleness */
  triggeredBy: MutationType;
  /** Propagation depth: 0 = changed element, 1 = direct connection, 2 = two-hop */
  depth: 0 | 1 | 2;
}

/**
 * StalenessTarget — what section/element is stale.
 */
export type StalenessTarget =
  | { type: 'holistic'; section: HolisticSectionType }
  | { type: 'paragraph'; index: number }
  | { type: 'sentence'; paragraph: number; sentence: number }
  | { type: 'connections'; connectionIds: string[] }
  | { type: 'north_star' }
  | { type: 'entanglements' };

/**
 * StalenessSnapshot — compact view for the Profile Router.
 */
export interface StalenessSnapshot {
  strongCount: number;
  moderateCount: number;
  weakCount: number;
  /** Strong-stale entries, for the Profile Router to prioritize */
  strongEntries: StalenessEntry[];
  /** Moderate-stale entries, for inclusion when token budget allows */
  moderateEntries: StalenessEntry[];
}

/**
 * StalenessReport — full report for external consumers (UI, debugging).
 */
export interface StalenessReport {
  snapshot: StalenessSnapshot;
  weakEntries: StalenessEntry[];
  /** Whether re-analysis is suggested (strong count >= 3) */
  reanalysisSuggested: boolean;
  /** Total staleness by domain */
  byDomain: Record<string, { strong: number; moderate: number; weak: number }>;
  /** When staleness was last cleared */
  lastClearedAt: number | null;
}

/**
 * StalenessEffect — declares which mutations affect which profile sections.
 */
export interface StalenessEffect {
  target: StalenessTarget;
  strength: StalenessStrength;
  reason: string;
}

/**
 * StalenessDependencyMap — static configuration declaring cross-domain dependencies.
 * The coordinator reads this after every mutation to propagate staleness.
 */
export type StalenessDependencyMap = Record<MutationType, StalenessEffect[]>;

/**
 * SessionBoundaryState — manages engagement threshold resets across sessions.
 */
export interface SessionBoundaryState {
  /** Timestamp of the last mutation */
  lastMutationAt: number;
  /** Current engagement threshold — strong-stale entries before suggesting re-analysis */
  reanalysisThreshold: number;
  /** Default threshold (restored at session boundary) */
  defaultThreshold: 3;
  /** Whether the current session is the first since profile creation */
  isFirstSession: boolean;
}

/**
 * ValidationResult — output from quick or full validation.
 */
export interface ValidationResult {
  /** Whether all checks passed */
  valid: boolean;
  /** Individual check results */
  checks: ValidationCheck[];
  /** Summary counts */
  summary: {
    passed: number;
    warnings: number;
    errors: number;
  };
  /** Timestamp */
  validatedAt: number;
  /** Which tier was run */
  tier: 'quick' | 'full';
}

/**
 * ValidationCheck — a single validation check result.
 */
export interface ValidationCheck {
  /** Machine-readable check name */
  name: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  /** Human-readable explanation when failed */
  details?: string;
  /** Where the issue was found */
  locations?: Array<{ paragraph: number; sentence?: number }>;
}

/**
 * ReadinessScores — four granularity levels feeding improvement phase detection.
 */
export interface ReadinessScores {
  /** 0-100: thesis + arc + voice + holistic population */
  essay: number;
  /** 0-100: paragraph effectiveness distribution */
  paragraph: number;
  /** 0-100: sentence effectiveness + problem-free ratio */
  sentence: number;
  /** 0-100: word-level weakness absence */
  word: number;
}

/**
 * CircuitBreakerState — prevents infinite retry loops on persistent failures.
 */
export interface CircuitBreakerState {
  /** Number of retries at current checkpoint position */
  retryCount: number;
  /** Maximum retries before tripping */
  maxRetries: 3;
  /** The checkpoint position where failures are occurring */
  failurePoint: string;
  /** Error details from each attempt */
  attempts: Array<{
    timestamp: number;
    error: string;
    rawOutput?: string;
  }>;
  /** Whether the circuit breaker has tripped */
  tripped: boolean;
  /** When the cooldown expires (null if not tripped) */
  cooldownExpiresAt: number | null;
}

/**
 * WalkSkippedMarker — marker on paragraphs that failed during the L3 walk.
 */
export interface WalkSkippedMarker {
  walkSkipped: true;
  failedAt: 'l3_understanding' | 'l3_5_analysis';
  errorSummary: string;
  failedAtTimestamp: number;
  retryRequested: boolean;
}

/**
 * CheckpointStore — persistence interface for profile checkpointing.
 * The coordinator calls this at pipeline boundaries. Implementation provided
 * by the orchestrator — the coordinator never imports database modules.
 */
export interface CheckpointStore {
  save(profile: EssayProfile, metadata: CheckpointMetadata): Promise<void>;
  load(essayId: string): Promise<EssayProfile | null>;
}

/**
 * CheckpointMetadata — metadata saved alongside each checkpoint.
 */
export interface CheckpointMetadata {
  essayId: string;
  reason: CheckpointReason;
  completedLayer: string;
  writeVersion: number;
  stalenessSnapshot: StalenessSnapshot;
  validationResult: ValidationResult;
  costSoFar: number;
}

/**
 * LightTouchUpdate — mechanical profile updates that bypass the full mutation pipeline.
 * These never involve analytical judgment — strictly mechanical operations.
 */
export interface LightTouchUpdate {
  /** Which type of light-touch update */
  type: 'text_reference' | 'structural_bookkeeping' | 'index_remap' | 'staleness_application' | 'inferred_intent';

  /** For text_reference: sentences whose text changed */
  textUpdates?: Array<{
    paragraph: number;
    sentence: number;
    newText: string;
  }>;

  /** For structural_bookkeeping: updated paragraph/sentence counts */
  structuralUpdates?: {
    paragraphCount: number;
    sentenceCounts: number[];
  };

  /** For index_remap: old-to-new index mapping */
  indexRemap?: {
    paragraphMap: Map<number, number>;
    insertedParagraphs: number[];
    deletedParagraphs: number[];
  };

  /** For staleness_application: explicit staleness markers */
  stalenessMarkers?: Array<{
    target: StalenessTarget;
    strength: StalenessStrength;
    reason: string;
  }>;

  /** For inferred_intent: student-stated intent updates */
  intentUpdates?: Array<{
    paragraph: number;
    sentence: number;
    intents: ObservationEntry[];
    source: string;
  }>;
}

/**
 * PreMutationSnapshot — snapshot of affected fields before focused analysis,
 * enabling cheap rollback if escalation to comprehensive is needed.
 */
export interface PreMutationSnapshot {
  /** Which fields were snapshotted */
  scope: Array<{
    paragraph: number;
    sentence?: number;
    fields: string[];
  }>;
  /** Deep copies of the original values */
  values: Map<string, unknown>;
  /** Timestamp for staleness comparison */
  takenAt: number;
}

/**
 * EditUnderstandingOutput — wrapper for EditUnderstanding results
 * used by the coordinator's applyEditUnderstanding method.
 */
export interface EditUnderstandingOutput {
  /** The mechanical diff */
  diff: EditDiff;
  /** The LLM's understanding of what the edit means */
  understanding: EditUnderstanding;
  /** Pre-computed staleness effects based on the edit */
  stalenessEffects: StalenessEffect[];
  /** Whether this edit triggered from focused or comprehensive analysis */
  analysisMode: 'focused' | 'comprehensive';
}
