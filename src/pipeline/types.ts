/**
 * Unified Annotation Pipeline — Type Definitions
 *
 * Core data contracts for the annotation-based essay analysis system.
 * This pipeline replaces 5+ separate multi-stage workshop pipelines with
 * a single Sonnet call that produces inline text annotations.
 *
 * Consumed by: annotationPipeline, promptBuilder, scoreDeriver,
 * deepDiveService, reanalysisService, batchActivityPipeline,
 * and all frontend annotation components.
 */

import type {
  WorkshopEssayType,
  ImpressionLabel,
  ExtractedFeatures,
  FinalDimensionScore,
  PatternManifest,
  StrategyManifest,
} from '../workshop/shared/types';
import type { NarrativeAnalysisResult } from '../workshop/scoring/narrativeAnalyzerTypes';
import type { DeepContentAnalysis } from './contentAnalysisTypes';
// ============================================================================
// TEXT ANCHORING
// ============================================================================

/** Anchors an annotation to a specific span of essay text */
export interface TextSpan {
  /** Exact quoted substring for re-matching after edits */
  text: string;
  /** Character offset (0-indexed) from start of essay */
  startOffset: number;
  /** Character offset end (exclusive) */
  endOffset: number;
  /** Paragraph index for coarse fallback (0-indexed) */
  paragraphIndex: number;
}

// ============================================================================
// ANNOTATION TYPES
// ============================================================================

/** Severity levels for annotations, ordered from most to least urgent */
export type AnnotationSeverity = 'critical' | 'important' | 'suggestion' | 'strength';

/** A single annotation anchored to essay text */
export interface EssayAnnotation {
  /** Unique annotation ID (generated server-side) */
  id: string;

  /** Where this annotation attaches to the essay text */
  span: TextSpan;

  /** Which of the 13 dimensions this annotation relates to */
  dimensionId: string;

  /** How urgent this feedback is */
  severity: AnnotationSeverity;

  /** Whether this annotation highlights a strength (vs. an issue) */
  isStrength: boolean;

  /**
   * What the AI observes + why it matters.
   * Natural mentor voice, NOT templated sections. 1-3 sentences.
   */
  insight: string;

  /**
   * Concrete direction to improve. 1-2 sentences.
   * For strengths, this explains why it works and how to build on it.
   */
  suggestion: string;

  /** Optional concrete rewrite demonstrating the suggestion */
  rewriteExample?: string;

  /** Command ID for potential edit action (maps to CommandManifest.id) */
  applicableCommand?: string;

  /** AI confidence in this annotation (0-1) */
  confidence: number;

  /** Set true when user edits the anchored text (needs re-analysis) */
  stale: boolean;
}

// ============================================================================
// DERIVED SCORING
// ============================================================================

/** Score derived from annotations + heuristics for a single dimension */
export interface DerivedDimensionScore {
  /** Dimension ID (matches DimensionManifest.id) */
  dimensionId: string;
  /** Human-readable dimension name */
  displayName: string;
  /** Final fused score 0-100 */
  score: number;
  /** Score from feature extractor heuristics alone */
  heuristicScore: number;
  /** Annotation-derived signal for this dimension */
  annotationSignal: {
    /** Total annotations for this dimension */
    count: number;
    /** Annotations that are strengths */
    strengthCount: number;
    /** Annotations that are issues (critical + important + suggestion) */
    issueCount: number;
  };
  /** IDs of annotations that informed this score */
  annotationIds: string[];
  /** Weight after profile overrides (0-1) */
  effectiveWeight: number;
}

// ============================================================================
// PIPELINE RESULT
// ============================================================================

/** Complete result from the annotation pipeline (Phases 1-4) */
export interface AnnotatedAnalysisResult {
  /** Unique analysis ID */
  analysisId: string;
  /** The essay text that was analyzed */
  text: string;
  /** SHA-256 hash of the analyzed text (for stale detection) */
  textHash: string;
  /** Essay type used for analysis */
  essayType: WorkshopEssayType;
  /** All annotations produced by Phase 3 */
  annotations: EssayAnnotation[];
  /** Per-dimension scores derived in Phase 4 */
  dimensionScores: DerivedDimensionScore[];
  /** Essay Quality Index (0-100) */
  eqi: number;
  /** Human-readable impression label */
  impressionLabel: ImpressionLabel;
  /** High-level summary */
  summary: {
    /** Top 3 strengths identified */
    strengths: string[];
    /** Top 3 areas for improvement */
    improvements: string[];
    /** 2-3 sentence overall assessment */
    overallInsight: string;
  };
  /** Prioritized improvement roadmap */
  roadmap: ImprovementRoadmap;
  /** Cost, timing, and token metadata */
  meta: {
    costUSD: number;
    timing: Record<string, number>;
    tokens: Record<string, number>;
  };
}

// ============================================================================
// DEEP DIVE (ON-DEMAND)
// ============================================================================

/** Result from a Phase 5 deep dive into a specific annotation */
export interface DeepDiveResult {
  /** Which annotation this deep dive expands */
  annotationId: string;
  /** 3-5 sentences of deeper explanation */
  expandedTeaching: string;
  /** Alternative rewrites with tradeoff explanations */
  alternatives: Array<{ text: string; tradeoff: string }>;
  /** Optional exemplar from elite essays */
  exemplar?: { text: string; whyItWorks: string };
  /** Optional craft principle with before/after */
  craftPrinciple?: {
    name: string;
    explanation: string;
    beforeAfter: { before: string; after: string };
  };
  /** Cost of this deep dive call */
  costUSD: number;
}

// ============================================================================
// PIPELINE CONFIGURATION
// ============================================================================

/** Configuration for a single annotation pipeline run */
export interface AnnotationPipelineConfig {
  /** Essay type (determines profile, weights, teaching tone) */
  essayType: WorkshopEssayType;
  /** Maximum annotations to produce (default: 12) */
  maxAnnotations?: number;
  /** Include strength annotations (default: true) */
  includeStrengths?: boolean;
  /** Activity context for activity_to_essay type */
  activityContext?: {
    title: string;
    role: string;
    category: string;
    intendedMajor?: string;
  };
  /** College context for why_us type */
  collegeContext?: {
    collegeName: string;
    coreValues?: string[];
    specificPrograms?: string[];
  };
  /** Teaching sophistication level (auto-detected if not provided) */
  teachingSophistication?: 'foundational' | 'intermediate' | 'advanced';
}

/** Configuration for batch activity analysis */
export interface BatchActivityConfig {
  /** Array of activities to analyze */
  activities: Array<{
    id: string;
    title: string;
    role: string;
    category: string;
    description: string;
    intendedMajor?: string;
  }>;
  /** Student context for portfolio-level analysis */
  studentContext?: {
    intendedMajor?: string;
    targetSelectivity?: string;
  };
  /** Maximum annotations per activity (default: 6) */
  maxAnnotationsPerActivity?: number;
}

/** Result from batch activity analysis */
export interface BatchActivityResult {
  /** Per-activity annotation results */
  activities: Array<{
    activityId: string;
    annotations: EssayAnnotation[];
    dimensionScores: DerivedDimensionScore[];
    eqi: number;
    impressionLabel: ImpressionLabel;
  }>;
  /** Cross-activity portfolio patterns */
  portfolioPatterns: {
    strengths: string[];
    gaps: string[];
    recommendations: string[];
  };
  /** Aggregate metadata */
  meta: {
    costUSD: number;
    timing: Record<string, number>;
    tokens: Record<string, number>;
  };
}

// ============================================================================
// RE-ANALYSIS
// ============================================================================

/** Tracks text changes for selective re-analysis */
export interface ReanalysisRequest {
  /** Original analysis ID to update */
  analysisId: string;
  /** New essay text after edits */
  newText: string;
  /** Previous analysis result (for diff detection) */
  previousResult: AnnotatedAnalysisResult;
}

/** Result of re-analysis after text edit */
export interface ReanalysisResult {
  /** Updated analysis result */
  result: AnnotatedAnalysisResult;
  /** Which annotations were preserved vs. regenerated */
  changeReport: {
    preserved: string[];
    regenerated: string[];
    removed: string[];
    added: string[];
  };
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/** POST /api/v1/annotate/analyze request body */
export interface AnalyzeRequest {
  text: string;
  config: AnnotationPipelineConfig;
}

/** POST /api/v1/annotate/deep-dive request body */
export interface DeepDiveRequest {
  analysisId: string;
  annotationId: string;
  /** The annotation and its surrounding context (sent from client) */
  annotation: EssayAnnotation;
  essayText: string;
  essayType: WorkshopEssayType;
}

/** POST /api/v1/annotate/reanalyze request body */
export interface ReanalyzeRequest {
  analysisId: string;
  newText: string;
  previousResult: AnnotatedAnalysisResult;
}

/** POST /api/v1/annotate/batch-activities request body */
export interface BatchActivitiesRequest {
  config: BatchActivityConfig;
}

/** Standard API response wrapper */
export interface AnnotationApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// IMPROVEMENT ROADMAP
// ============================================================================

/** A single actionable improvement step derived from annotations */
export interface ImprovementStep {
  /** ID of the source annotation */
  annotationId: string;
  /** Priority rank (1 = highest) */
  priority: number;
  /** Category: quick text changes, structural rework, or sentence-level polish */
  category: 'quick_win' | 'deep_work' | 'polish';
  /** Estimated EQI points this fix could recover */
  estimatedEqiImpact: number;
  /** Which dimension this step improves */
  dimensionId: string;
  /** Human-readable description of what to do */
  description: string;
}

/** Prioritized improvement roadmap generated from annotations + scores */
export interface ImprovementRoadmap {
  /** All steps in priority order */
  steps: ImprovementStep[];
  /** High-impact, focused text changes (easy fixes) */
  quickWins: ImprovementStep[];
  /** Structural, thematic, or character-level rework */
  deepWork: ImprovementStep[];
  /** Sentence-level craft refinements */
  polish: ImprovementStep[];
}

// ============================================================================
// SCORE CALIBRATION
// ============================================================================

/** Per-dimension calibration weights for the score deriver */
export interface ScoreCalibrationConfig {
  /** Heuristic vs annotation signal weight (default 0.4 / 0.6) */
  heuristicWeight: number;
  annotationWeight: number;
  /** Per-dimension overrides for annotation signal weight.
   *  Dimensions with richer annotation evidence (e.g. authenticity) should lean heavier on annotations.
   *  Dimensions with strong heuristics (e.g. word_economy) can lean heavier on heuristics. */
  dimensionSignalWeights?: Partial<Record<string, { heuristic: number; annotation: number }>>;
}

// ============================================================================
// INTERNAL PIPELINE TYPES
// ============================================================================

/** Internal: assembled prompt parts before Sonnet call */
export interface AssembledPrompt {
  systemPrompt: string;
  userPrompt: string;
  estimatedTokens: {
    system: number;
    user: number;
    expectedOutput: number;
  };
}

/** Internal: raw LLM annotation before validation/enrichment */
export interface RawLLMAnnotation {
  span: {
    text: string;
    startOffset: number;
    endOffset: number;
    paragraphIndex: number;
  };
  dimensionId: string;
  severity: AnnotationSeverity;
  isStrength: boolean;
  insight: string;
  suggestion: string;
  rewriteExample?: string;
  applicableCommand?: string;
  confidence: number;
}

/** Internal: feature extraction + expertise signals combined */
export interface EnrichedFeatures {
  features: ExtractedFeatures;
  /** Expertise signals (activity descriptions only) */
  expertiseSignals?: {
    detectedNameDrops: string[];
    proofOfWork: string[];
    expertiseDomain?: string;
    impressivenessLevel?: string;
  };
  /** Narrative analysis results (deterministic, injected into Sonnet prompt) */
  narrativeAnalysis?: NarrativeAnalysisResult;
  /** Deep content analysis — structure, theme, character, insight (Wave 2) */
  deepContentAnalysis?: DeepContentAnalysis;
  /** Detected essay patterns from pattern registry (Wave 3) */
  detectedPatterns?: PatternManifest[];
  /** Detected writing strategy from structure analysis (Wave 3) */
  detectedStrategy?: StrategyManifest;
}

/** Internal: Phase 4 score derivation input */
export interface ScoreDerivationInput {
  annotations: EssayAnnotation[];
  features: ExtractedFeatures;
  essayType: WorkshopEssayType;
  /** Optional heuristic results from existing dimension scorers */
  existingHeuristics?: FinalDimensionScore[];
}
