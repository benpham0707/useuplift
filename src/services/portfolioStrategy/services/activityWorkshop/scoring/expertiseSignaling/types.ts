/**
 * Expertise Signaling Library — Type Definitions
 *
 * A static, pre-built knowledge base providing field-specific expertise patterns
 * for scoring and teaching. Distinguishes "real expertise" from "name-dropping"
 * across all activity domains.
 *
 * Key insight: Every word in a 150-character description must communicate to the
 * ACTUAL reader (an admissions officer, not a domain expert). Technology names,
 * competition acronyms, and jargon cost characters and communicate nothing unless
 * they ARE the achievement.
 *
 * Cost: $0.00 (pure data, no LLM calls)
 * Integration: Feature extractor, description rule scorer, nuance calibration, teaching prompts
 *
 * Sources: Sara Harberson, MIT/Stanford/Harvard admissions blogs, NACAC surveys,
 * published AO insights, IEC best practices, real admissions committee behavior.
 */

// ============================================================================
// CORE EXPERTISE SIGNAL TYPES
// ============================================================================

/**
 * A pattern that signals real expertise in a field.
 * These are language patterns that prove genuine depth — things only someone
 * who actually DID the work would write.
 */
export interface ExpertiseSignal {
  /** Unique identifier for this signal */
  id: string;

  /** The pattern category (e.g., "methodology_reference", "failure_learning") */
  pattern: string;

  /** Human-readable description of what this pattern looks like */
  description: string;

  /** Why this signals real expertise (for teaching explanations) */
  whyItWorks: string;

  /** Concrete examples of this pattern in real descriptions */
  examples: string[];

  /** How strongly this signal indicates real expertise */
  signalStrength: 'strong' | 'moderate' | 'weak';

  /** Which scoring dimension this primarily affects */
  affectsDimension: 'authenticity' | 'specificity' | 'impact' | 'differentiation';

  /** Keywords that help detect this pattern in extracted features */
  detectionKeywords: string[];
}

/**
 * A name-drop trap — impressive-sounding words that are actually filler.
 * These cost characters and communicate nothing meaningful to AOs.
 */
export interface NameDropTrap {
  /** Unique identifier for this trap */
  id: string;

  /** The name-drop pattern (e.g., "Python/pandas", "CRISPR-Cas9") */
  pattern: string;

  /** Why students include this (so teaching can address the misconception) */
  whyStudentsUseIt: string;

  /** Why it doesn't work with AOs */
  whyItFails: string;

  /** What to say instead — the transformation principle */
  betterAlternative: string;

  /** Concrete before/after example */
  example: {
    /** The name-drop version */
    nameDrop: string;
    /** The improved version */
    improved: string;
    /** What changed and why */
    whatChanged: string;
  };

  /** How common this trap is among applicants */
  prevalence: 'very_common' | 'common' | 'occasional';

  /** Characters typically wasted by this name-drop */
  typicalCharWaste: number;

  /** Keywords to detect this trap in descriptions */
  detectionKeywords: string[];
}

/**
 * A proof-of-work pattern — what genuine involvement looks like in this field.
 * These are the "fingerprint moments" that only someone who actually did the
 * work would know to include.
 */
export interface ProofOfWorkPattern {
  /** Unique identifier */
  id: string;

  /** What genuine involvement looks like */
  pattern: string;

  /** Why this proves real involvement (not resume padding) */
  whyItProves: string;

  /** Concrete examples */
  examples: string[];

  /** Level of expertise this indicates */
  expertiseLevel: 'novice' | 'intermediate' | 'advanced' | 'expert';

  /** How AOs interpret this signal */
  aoInterpretation: string;
}

/**
 * A field-specific description transformation.
 * Shows how to convert name-drops or generic language into
 * impact-driven descriptions that AOs actually value.
 */
export interface DescriptionTransform {
  /** Unique identifier */
  id: string;

  /** Category of transformation */
  transformType:
    | 'name_drop_to_impact'    // "Used Python" → "Automated 200-record analysis"
    | 'generic_to_specific'    // "Did research" → "Analyzed 50K patient records"
    | 'passive_to_active'      // "Was involved in" → "Led 15-person team"
    | 'claim_to_evidence'      // "Made an impact" → "Reduced errors by 40%"
    | 'jargon_to_outcome'      // "Applied ML algorithms" → "Predicted outcomes with 94% accuracy"
    | 'duty_to_achievement';   // "Responsible for..." → "Increased retention 25%"

  /** The before text (what students typically write) */
  before: string;

  /** The after text (what they should write) */
  after: string;

  /** Why the transformation works */
  explanation: string;

  /** Character count: before */
  charsBefore: number;

  /** Character count: after */
  charsAfter: number;

  /** Which field-specific principle this demonstrates */
  principle: string;
}

/**
 * Field-specific verb hierarchy.
 * Different fields value different action verbs.
 * "Designed" is power-tier in engineering but standard in art.
 */
export interface VerbTier {
  /** Verb category */
  tier: 'power' | 'standard' | 'weak';

  /** Verbs in this tier for this specific field */
  verbs: string[];

  /** Why these verbs are at this tier in this field */
  context: string;

  /** Example usage in a description */
  exampleUsage?: string;
}

/**
 * Role-specific expertise expectations.
 * What AOs expect to see from someone in this role,
 * and what would be surprising/impressive.
 */
export interface RoleExpertise {
  /** Role title (e.g., "Lab Research Assistant", "Club President") */
  role: string;

  /** What AOs expect to see from this role (minimum bar) */
  expectedSignals: string[];

  /** What would be surprising/impressive from this role (tier differentiator) */
  differentiators: string[];

  /** Red flags — claiming too much for this role */
  overclaimingRisks: string[];

  /** Typical description patterns that are authentic for this role */
  authenticPatterns: string[];
}

/**
 * What admissions officers actually look for in this field.
 * Based on published AO insights, Sara Harberson, and NACAC data.
 */
export interface AOExpectations {
  /** What registers with admissions officers reading this type of activity */
  whatRegisters: string[];

  /** What AOs immediately see through as filler or padding */
  whatAOsSeeThrough: string[];

  /** The golden question AOs ask about activities in this field */
  goldenQuestion: string;

  /** How long AOs spend reading each activity (context for character efficiency) */
  readingTimeContext: string;

  /** What AOs compare this activity to (competitive landscape) */
  competitiveContext: string;
}

/**
 * The exception rule — when the technology/jargon IS the achievement.
 * Sometimes naming the specific tool or method IS what makes the activity impressive.
 */
export interface JargonException {
  /** When naming the technology IS impressive */
  pattern: string;

  /** Why it's the exception (the technology itself demonstrates the achievement) */
  whyItsTheException: string;

  /** Example */
  example: string;
}

// ============================================================================
// DOMAIN-LEVEL TYPES
// ============================================================================

/**
 * Complete expertise domain definition.
 * One per activity category (stem_research, athletics, etc.)
 */
export interface ExpertiseDomain {
  /** Domain identifier matching detected activity type in featureTypes.ts */
  domainId: string;

  /** Display name */
  label: string;

  /** Brief description of this domain's expertise landscape */
  overview: string;

  /** What AOs actually look for in this field */
  aoExpectations: AOExpectations;

  /** Real expertise signals — language patterns that prove depth */
  realExpertiseSignals: ExpertiseSignal[];

  /** Name-drop traps — impressive-sounding filler */
  nameDropTraps: NameDropTrap[];

  /** Proof-of-work patterns — what genuine involvement looks like */
  proofOfWorkPatterns: ProofOfWorkPattern[];

  /** Field-specific description transformations */
  descriptionTransforms: DescriptionTransform[];

  /** Field-specific verb hierarchy */
  verbHierarchy: VerbTier[];

  /** Role-specific expertise expectations */
  roleExpertise: RoleExpertise[];

  /** Exceptions where jargon/technology IS the achievement */
  jargonExceptions: JargonException[];
}

// ============================================================================
// LOOKUP & MATCHING RESULT TYPES
// ============================================================================

/**
 * Result of matching a description against the expertise signaling library.
 * Used by the description rule scorer and nuance calibration service.
 */
export interface ExpertiseMatchResult {
  /** Domain that was matched */
  domainId: string;

  /** Match confidence */
  confidence: 'high' | 'medium' | 'low';

  /** Expertise signals detected in the description */
  detectedSignals: Array<{
    signal: ExpertiseSignal;
    matchedKeywords: string[];
    matchStrength: number; // 0-1
  }>;

  /** Name-drop traps detected in the description */
  detectedTraps: Array<{
    trap: NameDropTrap;
    matchedKeywords: string[];
    charWaste: number;
  }>;

  /** Proof-of-work patterns detected */
  detectedProofs: Array<{
    proof: ProofOfWorkPattern;
    matchedKeywords: string[];
  }>;

  /** Relevant transformations for this description */
  applicableTransforms: DescriptionTransform[];

  /** Overall expertise assessment */
  assessment: {
    /** Net expertise signal (positive = real expertise, negative = name-dropping) */
    expertiseScore: number; // -5 to +5
    /** Summary of expertise vs name-dropping balance */
    summary: string;
    /** Recommended scoring adjustments */
    scoringAdjustments: {
      authenticityModifier: number;    // -1 to +1
      differentiationModifier: number; // -1 to +1
      specificityModifier: number;     // -1 to +1
    };
  };
}

// ============================================================================
// IMPRESSIVENESS ANALYSIS TYPES
// ============================================================================

/**
 * Structured alignment between an activity domain and an intended major.
 * Replaces flat keyword-based major relevance with rich context.
 */
export interface MajorAlignmentEntry {
  /** Relevance category — 'complementary' added between supporting and unrelated */
  relevance: 'critical' | 'core' | 'supporting' | 'complementary' | 'unrelated';
  /** Numeric boost factor in [0, 1] for scoring context */
  boostFactor: number;
  /** Human-readable rationale for the alignment */
  rationale: string;
  /** Which specific aspects of the activity matter for this major */
  relevantAspects?: string[];
}

/**
 * A structured alignment matrix entry mapping an activity domain to multiple majors.
 */
export interface DomainMajorAlignment {
  /** Domain ID matching ExpertiseDomain.domainId */
  domainId: string;
  /** Alignments keyed by major name (lowercase) */
  alignments: Record<string, MajorAlignmentEntry>;
  /** Default alignment for majors not explicitly listed */
  defaultAlignment: MajorAlignmentEntry;
}

/**
 * Technical depth marker detected in a description.
 * Signals field-specific expertise that admissions officers recognize
 * even without domain knowledge.
 */
export interface TechnicalDepthMarker {
  /** What was detected (e.g., "IRB approval", "peer review", "patent filing") */
  marker: string;
  /** Why it's significant (e.g., "Rare for high school students") */
  significance: string;
  /** Rarity level among HS applicants */
  rarity: 'very_rare' | 'rare' | 'uncommon' | 'common';
}

/**
 * Result of impressiveness analysis for a single activity.
 * Provides rich context for nuance calibration and teaching.
 *
 * Cost: $0.00 (deterministic, uses evidence + tier + expertise signals)
 */
export interface ImpressionAnalysisResult {
  /** Level explanation — where this activity sits relative to applicant pool */
  levelExplanation: string;
  /** Percentile range among applicants at target school tier */
  percentileRange: string;

  /** Major alignment assessment */
  majorAlignment: MajorAlignmentEntry;

  /** Technical depth markers detected in the description */
  technicalDepthMarkers: TechnicalDepthMarker[];

  /** Summary suitable for prompt injection (1-3 sentences) */
  promptSummary: string;
}

/**
 * Pre-built exemplar description for a field/tier combination.
 * Used for teaching prompt injection instead of LLM-generated examples.
 */
export interface Exemplar {
  /** Domain this exemplar belongs to */
  domainId: string;
  /** Tier level this exemplar represents */
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  /** The exemplar description text (150 chars or less) */
  description: string;
  /** Why this exemplar works (for teaching) */
  whyItWorks: string;
  /** Key techniques demonstrated */
  techniques: string[];
}

/**
 * Teaching context assembled from the expertise signaling library.
 * Injected into teaching prompts for field-specific guidance.
 */
export interface ExpertiseTeachingContext {
  /** Domain matched */
  domainId: string;
  domainLabel: string;

  /** AO expectations for this field (for prompt injection) */
  aoExpectations: AOExpectations;

  /** Name-drop traps found (teach the student to avoid these) */
  trapsToAvoid: Array<{
    trap: NameDropTrap;
    inStudentDescription: boolean;
  }>;

  /** Relevant transforms (show student how to improve) */
  relevantTransforms: DescriptionTransform[];

  /** Power verbs for this field */
  powerVerbs: string[];

  /** What AOs expect from the student's role */
  roleExpectations?: RoleExpertise;

  /** Proof-of-work patterns the student should demonstrate */
  proofPatterns: ProofOfWorkPattern[];
}
