/**
 * Workshop System — Shared Type Definitions
 *
 * Types for the registry-based writing workshop architecture.
 * Used by command, dimension, and essay profile registries,
 * as well as the hybrid scoring pipeline and strategy selector.
 */

// ============================================================================
// ENUMS & UNION TYPES
// ============================================================================

/** Command families — categorize editing commands by purpose */
export type CommandFamily =
  | 'analytical'
  | 'narrative'
  | 'tonal'
  | 'precision'
  | 'structural'
  | 'rhetorical'
  | 'meta';

/** Essay types the workshop system handles */
export type WorkshopEssayType =
  | 'personal_statement'
  | 'uc_piq'
  | 'why_us'
  | 'community'
  | 'challenge_adversity'
  | 'intellectual_vitality'
  | 'activity_to_essay'
  | 'identity_background'
  | 'analytical'
  | 'other';

/** Scoring tier — determines how a dimension is scored */
export type ScoringTier = 'heuristic' | 'heuristic+haiku' | 'heuristic+sonnet';

/** Impression label bands for EQI */
export type ImpressionLabel =
  | 'arresting_deeply_human'
  | 'compelling_clear_voice'
  | 'competent_needs_texture'
  | 'readable_but_generic'
  | 'template_like_rebuild';

// ============================================================================
// FEATURE EXTRACTION TYPES
// ============================================================================

/** Extracted features from deterministic text analysis (~50ms) */
export interface ExtractedFeatures {
  /** Word-level stats */
  wordCount: number;
  uniqueWordCount: number;
  avgWordLength: number;
  vocabularyRichness: number; // type-token ratio

  /** Sentence-level stats */
  sentenceCount: number;
  avgSentenceLength: number;
  sentenceLengthVariance: number;
  shortSentenceRatio: number; // sentences < 8 words
  longSentenceRatio: number; // sentences > 25 words

  /** Paragraph-level stats */
  paragraphCount: number;
  avgParagraphLength: number; // in sentences

  /** Structural patterns */
  hasOpeningScene: boolean;
  hasDialogue: boolean;
  dialogueCount: number;
  hasQuestions: boolean;
  questionCount: number;
  transitionWordCount: number;
  paragraphTransitionQuality: number; // 0-1

  /** Keyword/phrase detection */
  sensoryDetailCount: number;
  emotionWordCount: number;
  vulnerabilityMarkerCount: number;
  achievementMarkerCount: number;
  reflectionMarkerCount: number;
  clicheCount: number;
  bannedTermCount: number;
  fillerPhraseCount: number;

  /** Syntactic features */
  passiveVoiceRatio: number; // 0-1
  clauseDepthAvg: number;
  sentenceVarietyScore: number; // 0-1, diversity of sentence structures

  /** Rhetorical features */
  claimCount: number; // thesis-like assertions
  evidenceCount: number; // supporting detail markers
  counterpointCount: number; // concession/qualification markers
  rhetoricalDeviceCount: number; // anaphora, parallelism, etc.

  /** Voice/tone features */
  formalityScore: number; // 0-1 (0 = casual, 1 = formal)
  firstPersonRate: number; // 0-1
  contractionRate: number; // 0-1

  /** Growth/curiosity markers */
  growthLanguageCount: number;
  curiosityMarkerCount: number;
  researchReferenceCount: number;

  /** Raw text for LLM fallback */
  rawText: string;
}

// ============================================================================
// SCORING TYPES
// ============================================================================

/** Result from a heuristic scoring function */
export interface HeuristicResult {
  /** Score 0-100 for this dimension */
  score: number;

  /** Confidence in the heuristic score (0-1). Low confidence triggers LLM. */
  confidence: number;

  /** Evidence supporting the score */
  evidence: string[];

  /** Specific signals detected */
  signals: Record<string, number | boolean | string>;
}

/** Result from an LLM scoring call */
export interface LLMScoreResult {
  /** Score 0-100 for this dimension */
  score: number;

  /** Confidence from LLM (0-1) */
  confidence: number;

  /** LLM's reasoning */
  reasoning: string;

  /** Specific evidence cited by LLM */
  evidence: string[];

  /** Token usage for cost tracking */
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/** Final fused score for a single dimension */
export interface FinalDimensionScore {
  /** Dimension ID */
  dimensionId: string;

  /** Final score 0-100 */
  score: number;

  /** How the score was derived */
  source: 'heuristic_only' | 'heuristic_dominant' | 'llm_dominant' | 'llm_only';

  /** Heuristic sub-result */
  heuristicResult: HeuristicResult;

  /** LLM sub-result (only if triggered) */
  llmResult?: LLMScoreResult;

  /** Evidence summary */
  evidence: string[];
}

/** Complete scoring result for an essay */
export interface ScoringResult {
  /** All dimension scores */
  dimensionScores: FinalDimensionScore[];

  /** Essay Quality Index (0-100) */
  eqi: number;

  /** Impression label */
  impressionLabel: ImpressionLabel;

  /** Weighted scores per dimension */
  weightedScores: Record<string, number>;

  /** Cost tracking */
  cost: {
    llmCallCount: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCostUSD: number;
  };

  /** Timing */
  timingMs: {
    featureExtraction: number;
    heuristicScoring: number;
    llmScoring: number;
    fusion: number;
    total: number;
  };
}

// ============================================================================
// COMMAND MANIFEST
// ============================================================================

/** Defines a single editing command that can be applied to essay text */
export interface CommandManifest {
  /** Unique command ID, e.g. 'sharpen_claim' */
  id: string;

  /** Which family this command belongs to */
  family: CommandFamily;

  /** Human-readable name */
  displayName: string;

  /** What this command does */
  description: string;

  /** Which essay types this command is useful for */
  applicableEssayTypes: WorkshopEssayType[];

  /** The full Sonnet prompt for inline editing */
  detailedPrompt: string;

  /** Terms to avoid in generated output */
  bannedTerms?: string[];

  /** Expected output format description */
  outputFormat: string;

  /** Implementation priority: 1 = build first, 2 = build later */
  tier: 1 | 2;
}

// ============================================================================
// DIMENSION MANIFEST
// ============================================================================

/** Defines a single scoring dimension with hybrid heuristic+LLM scoring */
export interface DimensionManifest {
  /** Unique dimension ID, e.g. 'argument_rhetorical_craft' */
  id: string;

  /** Human-readable name */
  displayName: string;

  /** Weight in EQI calculation (all weights must sum to 1.00) */
  weight: number;

  /** How this dimension is scored */
  scoringTier: ScoringTier;

  /** Deterministic heuristic scorer */
  heuristicScore: (features: ExtractedFeatures) => HeuristicResult;

  /** Should we call LLM for a deeper score? Based on heuristic confidence. */
  shouldTriggerLLM: (heuristic: HeuristicResult) => boolean;

  /** Build the LLM prompt for deep scoring */
  buildLLMPrompt: (text: string, features: ExtractedFeatures) => string;

  /** Parse the LLM response into a score */
  parseLLMResponse: (raw: string) => LLMScoreResult;

  /** Fuse heuristic and optional LLM scores into final score */
  fuseScores: (heuristic: HeuristicResult, llm?: LLMScoreResult) => FinalDimensionScore;
}

// ============================================================================
// MACRO STRATEGY
// ============================================================================

/** A named sequence of commands for a specific improvement goal */
export interface MacroStrategy {
  /** Unique strategy ID */
  id: string;

  /** Human-readable name, e.g. 'Strengthen Argument' */
  name: string;

  /** Ordered list of command IDs to execute */
  commands: string[];

  /** What this strategy does */
  description: string;

  /** Which essay types this strategy works best for */
  bestFor: WorkshopEssayType[];
}

// ============================================================================
// ESSAY PROFILE MANIFEST
// ============================================================================

/** Defines essay-type-specific scoring and command configuration */
export interface EssayProfileManifest {
  /** Essay type ID */
  id: WorkshopEssayType;

  /** Human-readable name */
  displayName: string;

  /** Override default dimension weights for this essay type.
   *  Only specified dimensions are overridden; others keep defaults.
   *  Overrides are normalized so they still sum to 1.00. */
  dimensionWeightOverrides: Partial<Record<string, number>>;

  /** Ordered list of command IDs to prioritize for this essay type */
  preferredCommands: string[];

  /** Named command sequences for this essay type */
  macroStrategies: MacroStrategy[];

  /** Common mistakes specific to this essay type */
  antiPatterns: string[];

  /** Teaching tone adjustments */
  teachingTone?: {
    formality: 'casual' | 'balanced' | 'formal';
    encouragement: 'high' | 'moderate' | 'low';
    directness: 'direct' | 'gentle' | 'socratic';
  };
}

// ============================================================================
// EQI CALCULATOR TYPES
// ============================================================================

/** Input for EQI calculation */
export interface EQIInput {
  dimensionId: string;
  score: number; // 0-100
  weight: number; // 0-1, must sum to 1.00 across all inputs
}

/** Result of EQI calculation */
export interface EQIResult {
  /** Essay Quality Index (0-100) */
  eqi: number;

  /** Per-dimension weighted scores */
  weightedScores: Record<string, number>;

  /** Impression label */
  impressionLabel: ImpressionLabel;

  /** Whether essay-type overrides were applied */
  overridesApplied: boolean;
}

// ============================================================================
// PIPELINE TYPES
// ============================================================================

/** Configuration for the hybrid scoring pipeline */
export interface HybridScoringConfig {
  /** Confidence threshold for Haiku LLM trigger (default: 0.7) */
  haikuConfidenceThreshold: number;

  /** Confidence threshold for Sonnet LLM trigger (default: 0.8) */
  sonnetConfidenceThreshold: number;

  /** Maximum concurrent LLM calls */
  maxConcurrentLLMCalls: number;

  /** Essay type for profile-aware scoring */
  essayType?: WorkshopEssayType;

  /** Enable cost tracking */
  trackCosts: boolean;
}

/** Default pipeline configuration */
export const DEFAULT_SCORING_CONFIG: HybridScoringConfig = {
  haikuConfidenceThreshold: 0.7,
  sonnetConfidenceThreshold: 0.8,
  maxConcurrentLLMCalls: 4,
  trackCosts: true,
};
