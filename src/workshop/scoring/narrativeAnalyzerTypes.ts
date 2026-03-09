/**
 * Narrative Analyzer Types — Shared interfaces for all 7 deterministic analyzers
 *
 * These types define the structured output of each analyzer function.
 * All analyzers are pure, deterministic code (no LLM calls).
 *
 * Consumed by:
 * - Dimension wrappers (narrative-structure.dim.ts, narrative-dynamics.dim.ts)
 * - Annotation pipeline prompt builder
 * - Future brainstorming system (Swarm A)
 */

import type { ExtractedFeatures } from '../shared/types';

// ============================================================================
// PARAGRAPH FUNCTION CLASSIFICATION
// ============================================================================

/** What role this paragraph plays in the narrative */
export type ParagraphFunction =
  | 'grounding'         // Establishes setting, time, place
  | 'characterization'  // Reveals who someone is through action/detail
  | 'escalation'        // Raises stakes, deepens conflict
  | 'intimacy'          // Vulnerability, inner thought, emotional closeness
  | 'contrast'          // Juxtaposes two states (before/after)
  | 'release'           // Resolves tension — insight, acceptance
  | 'reflection'        // Steps back to interpret meaning
  | 'transition'        // Bridges narrative moments
  | 'exposition'        // Background information
  | 'ambiguous';        // Unclear — defer to LLM

/** Signal counts for each function type */
export interface FunctionSignals {
  groundingSignals: number;
  characterizationSignals: number;
  escalationSignals: number;
  intimacySignals: number;
  contrastSignals: number;
  releaseSignals: number;
  reflectionSignals: number;
}

/** Per-paragraph function classification */
export interface ParagraphFunctionAnalysis {
  index: number;
  detectedFunction: ParagraphFunction;
  confidence: number; // 0-1, based on signal separation
  signals: FunctionSignals;
  uncertainties: string[]; // What this paragraph could also be
}

/** Cross-paragraph narrative flow */
export interface NarrativeFlowAnalysis {
  functionSequence: ParagraphFunction[];
  narrativeCycles: number; // How many tension-release cycles
  missingFunctions: ParagraphFunction[]; // Functions not represented
  functionRepetition: number; // Consecutive same-function paragraphs
  functionDiversity: number; // 0-1, unique functions / total possible
}

// ============================================================================
// TEACHING PRINCIPLES (replaces EMOTION_PHYSICAL_MAP suggestions)
// ============================================================================

/** A teaching principle referenced by tell opportunities */
export interface TeachingPrinciple {
  name: string;
  concept: string;
  questionToWriter: string;
}

// ============================================================================
// ANALYZER 1: SPECIFICITY GRADIENT
// ============================================================================

/** How concrete vs abstract each paragraph is */
export type SpecificityLevel =
  | 'highly_concrete'
  | 'concrete'
  | 'moderate'
  | 'abstract'
  | 'highly_abstract';

export interface SpecificityGradient {
  paragraphScores: Array<{
    index: number;
    score: number; // 0-100
    level: SpecificityLevel;
    signals: {
      sensoryWords: number;
      namedEntities: string[];
      quantities: string[];
      specificLocations: string[];
      genericPhrases: string[];
    };
  }>;
  overallScore: number; // Average of paragraph scores
  weakestParagraph: number; // Index of most abstract paragraph
  strongestParagraph: number; // Index of most concrete paragraph
}

// ============================================================================
// ANALYZER 2: SCENE VS SUMMARY RATIO
// ============================================================================

export type ParagraphClassification = 'scene' | 'summary' | 'mixed';

export interface SceneVsSummaryAnalysis {
  sceneRatio: number; // 0-1
  summaryRatio: number; // 0-1
  idealRange: { min: number; max: number }; // 0.6-0.7 for personal statements
  isInRange: boolean;
  paragraphs: Array<{
    index: number;
    classification: ParagraphClassification;
    confidence: number; // 0-1
    sceneSignalCount: number;
    summarySignalCount: number;
  }>;
  longestSummaryStretch: number; // Consecutive summary paragraphs
  recommendation?: string;
}

// ============================================================================
// ANALYZER 3: SHOW VS TELL DETECTION
// ============================================================================

export interface ShowVsTellAnalysis {
  overallShowRatio: number; // 0-1
  paragraphs: Array<{
    index: number;
    showCount: number;
    tellCount: number;
    showRatio: number;
  }>;
  tellOpportunities: Array<{
    sentenceText: string;
    paragraphIndex: number;
    toldEmotion: string; // The "told" emotion
    tellPattern: string; // Which pattern matched
    principle: string;        // Teaching principle name (not a rewrite)
    llmQuestion: string;      // What the LLM should evaluate
  }>;
  showExemplars: Array<{
    sentenceText: string;
    paragraphIndex: number;
    showSignals: string[]; // What makes it good showing
  }>;
}

// ============================================================================
// ANALYZER 4: NARRATIVE ARC HEURISTIC
// ============================================================================

export type NarrativeArcType =
  | 'man_in_hole'
  | 'cinderella'
  | 'icarus'
  | 'quest'
  | 'rags_to_riches'
  | 'ambiguous';

export interface NarrativeArcAnalysis {
  detectedArc: NarrativeArcType;
  confidence: number; // 0-1
  quarterValences: [number, number, number, number]; // -1 to +1 per quarter
  acts: Array<{
    quarterIndex: number;
    paragraphRange: [number, number]; // Start/end paragraph indices
    emotionalValence: number; // -1 to +1
    dominantSignals: string[]; // Top 3 signal types
    keyMoments: string[]; // Strongest signal sentences
  }>;
  alternativeArcs: Array<{
    arc: NarrativeArcType;
    confidence: number;
  }>;
  structuralNotes: {
    hasSetup: boolean;
    hasConflict: boolean;
    hasClimaxOrTurningPoint: boolean;
    hasResolution: boolean;
    hasDenouement: boolean;
  };
}

// ============================================================================
// ANALYZER 5: EMOTIONAL JOURNEY TYPING
// ============================================================================

export type EmotionalCategory =
  | 'joy'
  | 'sadness'
  | 'fear'
  | 'anger'
  | 'surprise'
  | 'trust'
  | 'anticipation'
  | 'pride'
  | 'vulnerability'
  | 'determination'
  | 'confusion'
  | 'shame';

export type EmotionalTrajectoryPattern =
  | 'monotone'
  | 'ascending_variety'
  | 'valley_peak'
  | 'oscillating'
  | 'building';

export interface EmotionalJourneyAnalysis {
  paragraphs: Array<{
    index: number;
    dominantEmotions: EmotionalCategory[]; // Top 1-2
    emotionWordCount: number;
    intensity: number; // 0-1 (emotion density)
    emotionWords: Array<{ word: string; category: EmotionalCategory }>;
  }>;
  trajectory: {
    pattern: EmotionalTrajectoryPattern;
    uniqueEmotionCount: number;
    transitions: Array<{
      from: EmotionalCategory;
      to: EmotionalCategory;
      atParagraph: number;
    }>;
    monotoneStretches: Array<{
      emotion: EmotionalCategory;
      startParagraph: number;
      length: number;
    }>;
    varietyScore: number; // 0-1
  };
  evaluation: {
    isEngaging: boolean;
    isAuthentic: boolean;
    strongestMoment: {
      paragraph: number;
      emotion: EmotionalCategory;
      intensity: number;
    };
    weakestMoment: { paragraph: number; reason: string };
  };
}

// ============================================================================
// ANALYZER 6: INFORMATION DENSITY PER PARAGRAPH
// ============================================================================

export type DensityLevel = 'high_density' | 'moderate' | 'low_density' | 'redundant';

export interface InformationDensityAnalysis {
  paragraphs: Array<{
    index: number;
    densityScore: number; // 0-100
    typeTokenRatio: number;
    novelConceptCount: number;
    repeatedPhrases: string[]; // Phrases also found in earlier paragraphs
    entropy: number;
    level: DensityLevel;
  }>;
  mostRedundantParagraph: number; // Index
  mostInformativeParagraph: number; // Index
  overallDensityScore: number; // Average
  redundancyFlags: Array<{
    paragraphIndex: number;
    repeatedFrom: number; // Which earlier paragraph it repeats
    repeatedPhrase: string;
  }>;
}

// ============================================================================
// ANALYZER 7: TENSION CURVE MAPPING
// ============================================================================

export type TensionTrend = 'rising' | 'flat' | 'falling';
export type EngagementLevel = 'high' | 'good' | 'moderate' | 'low';

export interface TensionCurveAnalysis {
  paragraphs: Array<{
    index: number;
    tensionLevel: number; // 1-10
    trend: TensionTrend;
    sources: {
      vulnerability: number;
      conflict: number;
      stakes: number;
      questions: number;
      pacing: number;
      immersion: number;
    };
    penalties: {
      abstractSummary: number;
      cliche: number;
      repetition: number;
    };
  }>;
  curve: {
    peakParagraph: number;
    peakTension: number;
    flatSpots: Array<{
      startParagraph: number;
      endParagraph: number;
      avgTension: number;
    }>;
    hookStrength: number; // Tension of paragraph 0
    closingStrength: number; // Tension of final paragraph
  };
  evaluation: {
    overallEngagement: EngagementLevel;
    hasStrongHook: boolean;
    hasClimacticPeak: boolean;
    hasSatisfyingClose: boolean;
    flatSpotCount: number;
    suggestions: string[];
  };
}

// ============================================================================
// UNIFIED RESULT
// ============================================================================

export type NarrativeIssueSeverity = 'critical' | 'important' | 'minor';

export interface NarrativeAnalysisResult {
  specificity: SpecificityGradient;
  sceneVsSummary: SceneVsSummaryAnalysis;
  showVsTell: ShowVsTellAnalysis;
  narrativeArc: NarrativeArcAnalysis;
  emotionalJourney: EmotionalJourneyAnalysis;
  informationDensity: InformationDensityAnalysis;
  tensionCurve: TensionCurveAnalysis;
  /** Per-paragraph function classifications */
  paragraphFunctions: ParagraphFunctionAnalysis[];
  /** Cross-paragraph narrative flow analysis */
  narrativeFlow: NarrativeFlowAnalysis;
  /** Explicit list of what heuristics couldn't determine — for LLM evaluation */
  llmEvaluationNeeded: string[];
  /** Aggregate score 0-100, weighted combination of all analyzers */
  overallNarrativeScore: number;
  /** Top issues across all analyzers, sorted by severity */
  topIssues: Array<{
    analyzer: string;
    issue: string;
    severity: NarrativeIssueSeverity;
  }>;
}

// ============================================================================
// FUNCTION SIGNATURE (implemented in narrativeAnalyzers.ts)
// ============================================================================

/** Metadata for context-aware analysis */
export interface NarrativeAnalysisMetadata {
  essayType?: string;
  targetWordCount?: number;
}
