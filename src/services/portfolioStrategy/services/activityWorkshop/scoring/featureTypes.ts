/**
 * Feature Extraction Types — Layer 1 of the Cognitive Decomposition Architecture
 *
 * These types represent the RAW FEATURES extracted from activity descriptions
 * and metadata by Haiku. They are FACTS, not judgments. The extraction layer
 * answers "what is present?" — never "how good is it?"
 *
 * Two output types:
 * 1. ExtractedEvidence (defined in types.ts) — feeds into tierClassifier for activity scoring
 * 2. ExtractedDescriptionFeatures (defined here) — feeds into description rule scorer
 *
 * Both are produced by a single Haiku call per activity.
 */

import type { ExtractedEvidence } from './types';

// ============================================================================
// DESCRIPTION-LEVEL FEATURES (for deterministic description scoring)
// ============================================================================

/**
 * A verb extracted from the activity description with its position context.
 */
export interface ExtractedVerb {
  /** The verb as it appears in the description */
  verb: string;
  /** The verb in base/infinitive form for lookup */
  lemma: string;
  /** Brief context: the phrase or clause containing this verb */
  context: string;
  /** Whether this verb describes the student's OWN action (vs team/org) */
  isIndividualAction: boolean;
}

/**
 * A number or metric extracted from the description.
 */
export interface ExtractedNumber {
  /** The raw value as it appears ("200", "$12K", "93%") */
  rawValue: string;
  /** Numeric value for comparison (200, 12000, 93) */
  numericValue: number;
  /** What this number measures ("students", "dollars raised", "improvement rate") */
  unit: string;
  /** Whether the number has meaningful context that explains its significance */
  hasContext: boolean;
  /** Whether this is a meaningful metric vs vanity metric */
  isMeaningful: boolean;
  /** Brief explanation if flagged as vanity ("attended 10 meetings" = vanity) */
  vanityReason?: string;
}

/**
 * Signals about who owns the described actions — the individual or the group.
 */
export interface RoleOwnershipSignals {
  /** Phrases showing individual ownership ("I designed", "Founded", "My research") */
  individualPhrases: string[];
  /** Phrases showing team/org attribution ("We organized", "The club hosted", "Our team") */
  teamPhrases: string[];
  /** Whether the description uses first person pronouns (wastes characters) */
  usesFirstPerson: boolean;
  /** Specific first-person instances found */
  firstPersonInstances: string[];
  /** Whether the student's role is clear without reading the position field */
  roleClearFromDescription: boolean;
}

/**
 * Evidence of impact and cause-effect chains.
 */
export interface ImpactSignals {
  /** Complete cause-effect chains found: "did X → Y happened" */
  causalChains: Array<{
    action: string;
    outcome: string;
    hasExternalValidation: boolean;
  }>;
  /** Impact claims WITHOUT evidence ("made a positive impact", "helped the community") */
  unsupportedClaims: string[];
  /** Whether outcomes are measurable or just described qualitatively */
  hasMeasurableOutcome: boolean;
}

/**
 * Details that make this description unique to this specific student.
 */
export interface DifferentiationSignals {
  /** Specific details only this student could write ("fingerprint moments") */
  uniqueDetails: string[];
  /** Generic phrases that any student in this role could write */
  genericPhrases: string[];
  /** Whether the description passes the "1,000 student test" */
  passesThousandStudentTest: boolean;
  /** Specific thing that makes this stand out (if any) */
  standoutElement?: string;
}

/**
 * Character efficiency analysis for the 150-char constraint.
 */
export interface CharacterEfficiency {
  /** Total characters used */
  totalChars: number;
  /** Character limit for the platform */
  charLimit: number;
  /** Percentage of limit used */
  utilizationRate: number;
  /** Wasted patterns found (full sentences, articles, pronouns, spelled-out words) */
  wastedPatterns: Array<{
    pattern: string;
    example: string;
    charsSaved: number;
  }>;
  /** Whether it uses fragment style (efficient) vs full sentences (wasteful) */
  usesFragments: boolean;
  /** Whether the position/title is redundantly restated in description */
  restatesPosition: boolean;
}

/**
 * Authenticity assessment — overclaiming or underrepresenting.
 */
export interface AuthenticitySignals {
  /** Claims that sound disproportionate to time invested or experience level */
  overclaiming: Array<{
    claim: string;
    reason: string;
  }>;
  /** Signs of genuine, specific experience */
  authenticityMarkers: string[];
  /** Whether description reads as AI-generated resume bullet */
  readsAsAIGenerated: boolean;
}

/**
 * Complete description-level feature extraction.
 * These are FACTS about what's in the text — no scores, no judgments.
 */
export interface ExtractedDescriptionFeatures {
  /** Activity ID this extraction belongs to */
  activityId: string;

  /** All action verbs found in the description */
  verbs: ExtractedVerb[];

  /** All numbers and metrics found */
  numbers: ExtractedNumber[];

  /** Role ownership signals (individual vs team/org) */
  roleOwnership: RoleOwnershipSignals;

  /** Impact and cause-effect evidence */
  impact: ImpactSignals;

  /** Differentiation signals (uniqueness) */
  differentiation: DifferentiationSignals;

  /** Character efficiency analysis */
  characterEfficiency: CharacterEfficiency;

  /** Authenticity signals */
  authenticity: AuthenticitySignals;

  /** Activity type detected from description content (18 canonical categories) */
  detectedActivityType:
    | 'stem_research'
    | 'stem_competition'
    | 'debate_speech'
    | 'performing_arts'
    | 'athletics'
    | 'community_service'
    | 'leadership_government'
    | 'technology'
    | 'writing_journalism'
    | 'entrepreneurship'
    | 'academic_enrichment'
    | 'visual_arts'
    | 'medical_health'
    | 'social_activism'
    | 'work_family'
    | 'religious_cultural'
    | 'international'
    | 'media_digital'
    | 'other';
}

// ============================================================================
// COMBINED EXTRACTION OUTPUT (per activity)
// ============================================================================

/**
 * Complete extraction result for a single activity.
 * Produced by ONE Haiku call, consumed by BOTH scoring pipelines.
 */
export interface ActivityFeatureExtraction {
  /** Activity ID */
  activityId: string;

  /** Activity title (for reference) */
  activityTitle: string;

  /** Description-level features → feeds description rule scorer */
  descriptionFeatures: ExtractedDescriptionFeatures;

  /** Activity-level evidence → feeds tierClassifier (already defined in types.ts) */
  activityEvidence: ExtractedEvidence;

  /** Extraction metadata */
  metadata: {
    extractedAt: string;
    modelUsed: string;
    tokensUsed: { input: number; output: number };
    cost: number;
    /** How much useful signal was in the input (sparse descriptions yield less) */
    signalDensity: 'rich' | 'moderate' | 'sparse';
  };
}

// ============================================================================
// BATCH EXTRACTION TYPES
// ============================================================================

/**
 * Input for batch feature extraction (all activities at once).
 */
export interface BatchFeatureExtractionInput {
  activities: Array<{
    id: string;
    title: string;
    description: string;
    role?: string;
    category?: string;
    organization?: string;
    hoursPerWeek?: number;
    weeksPerYear?: number;
    yearsInvolved?: number;
    gradeLevels?: number[];
    isPaid?: boolean;
    achievements?: Array<{ title: string; level?: string; date?: string }>;
  }>;
  /** Student context enriches extraction (e.g., knowing major helps detect alignment) */
  studentContext?: {
    intendedMajor?: string;
    gradeLevel?: number;
    firstGen?: boolean;
    lowIncome?: boolean;
    rural?: boolean;
    workFamilyObligations?: boolean;
  };
  /** Character limit for the platform (affects efficiency analysis) */
  charLimit?: number;
}

/**
 * Result of batch feature extraction.
 */
export interface BatchFeatureExtractionResult {
  success: boolean;
  /** One extraction per activity, in the same order as input */
  extractions: ActivityFeatureExtraction[];
  /** Total cost across all Haiku calls */
  totalCost: number;
  /** Total tokens used */
  totalTokens: { input: number; output: number };
  /** Time taken in milliseconds */
  durationMs: number;
  /** Any activities that failed extraction (with error details) */
  failures: Array<{ activityId: string; error: string }>;
}
