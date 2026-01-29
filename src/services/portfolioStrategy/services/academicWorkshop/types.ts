/**
 * Academic Workshop Types
 *
 * Nuanced academic history analysis with multi-dimensional scoring.
 * Architecture: Understanding → Scoring → Teaching → Synthesis
 */

// ============================================================================
// INPUT TYPES (Reuse from existing)
// ============================================================================

import type { AcademicHistoryInput, CourseRecord } from '../academicHistoryAnalyzer';

export type { AcademicHistoryInput, CourseRecord };

// ============================================================================
// LAYER 2: HEURISTIC FOUNDATION TYPES
// ============================================================================

export interface HeuristicFoundation {
  trajectory: {
    gpaTrajectoryType: 'ascending' | 'stable_high' | 'stable_mid' | 'declining' | 'volatile';
    rigorTrajectoryType: 'increasing' | 'sustained' | 'declining' | 'inconsistent';
    yearWeightedGPA: number;
    gpaRigorInteraction: string;
  };
  redFlags: {
    critical: string[];
    warning: string[];
    minor: string[];
  };
  commitment: {
    sustainedSequences: number;
    deepDives: string[];
    concerningDrops: string[];
  };
  majorAlignment: {
    alignmentScore: number;
    requirementsMet: string[];
    gaps: string[];
  };
  rawMetrics: {
    totalCourses: number;
    apCourses: number;
    ibCourses: number;
    honorsCourses: number;
    avgGPA: number;
    yearlyGPAs: { year: string; gpa: number }[];
  };
}

// ============================================================================
// LAYER 3: UNDERSTANDING TYPES
// ============================================================================

export type NarrativeType =
  | 'rising_star'        // Started weaker, now excelling
  | 'consistent_excellence' // Always at the top
  | 'late_bloomer'       // Junior/Senior surge
  | 'struggling_fighter' // Challenges visible, effort evident
  | 'strategic_scholar'  // Calculated, optimized approach
  | 'passion_driven'     // Depth over breadth, clear interests
  | 'unfocused'          // No clear direction or pattern
  | 'gpa_protector';     // Avoiding challenge for grades

export interface KeyMoment {
  year: string;
  event: string;
  significance: string;
}

export interface CharacterTrait {
  trait: string;
  evidence: string;
  strength: 'strong' | 'moderate' | 'weak';
}

export interface PassionSignal {
  subject: string;
  indicators: string[];
  confidence: number; // 0-100
}

export interface RedNarrative {
  issue: string;
  context: string;
  mitigation?: string;
}

export interface AcademicNarrativeAnalysis {
  narrativeType: NarrativeType;
  narrativeSummary: string; // 2-3 sentence summary
  keyMoments: KeyMoment[];
  characterTraits: CharacterTrait[];
  passionSignals: PassionSignal[];
  contextUtilization: 'maximized' | 'good' | 'moderate' | 'underutilized';
  redNarratives: RedNarrative[];
}

export type RelativeRigor = 'top_5%' | 'top_10%' | 'top_25%' | 'top_50%' | 'below_average';
export type RelativePerformance = 'exceptional' | 'strong' | 'solid' | 'mixed' | 'concerning';

export interface ContextualPositioning {
  relativeRigor: RelativeRigor;
  relativePerformance: RelativePerformance;
  opportunityUtilization: number; // 0-100
  competitiveContext: string; // Natural language explanation
  peerComparison: string; // "Among students at similar schools..."
  schoolTierAssessment: string;
  targetSchoolFit: {
    topTier: 'strong' | 'competitive' | 'reach' | 'significant_reach';
    midTier: 'strong' | 'competitive' | 'reach' | 'significant_reach';
    safetyTier: 'strong' | 'competitive' | 'reach' | 'significant_reach';
  };
}

export interface Layer3Understanding {
  narrative: AcademicNarrativeAnalysis;
  positioning: ContextualPositioning;
}

// ============================================================================
// LAYER 4: SCORING TYPES
// ============================================================================

export interface DimensionScore {
  score: number;
  rationale: string;
  keyEvidence: string[];
  benchmarkComparison: string;
}

export interface RigorScore extends DimensionScore {
  score: number; // 0-3
  contextAdjustment: string; // How school context affected score
}

export interface PerformanceScore extends DimensionScore {
  score: number; // 0-2.5
  trajectoryBonus: number; // -0.25 to +0.25
}

export interface IntellectualCharacterScore extends DimensionScore {
  score: number; // 0-2.5
  passionAreas: string[];
}

export interface TrajectoryScore extends DimensionScore {
  score: number; // 0-2
  projectedDirection: 'ascending' | 'stable' | 'concerning';
}

export interface AcademicDimensionScores {
  rigor: RigorScore;
  performance: PerformanceScore;
  intellectualCharacter: IntellectualCharacterScore;
  trajectory: TrajectoryScore;
  rawTotal: number; // 0-10
  weightedTotal: number; // With adjustments applied
}

// ============================================================================
// LAYER 5: TEACHING TYPES
// ============================================================================

export interface TeachingMoment {
  dimension: 'rigor' | 'performance' | 'character' | 'trajectory' | 'overall';
  insight: string;
  researchBasis: string;
  actionableAdvice: string;
  citations?: string[];
}

export interface AcademicTeaching {
  dimensionExplanations: TeachingMoment[];
  strengthHighlights: string[];
  improvementAreas: {
    area: string;
    explanation: string;
    concreteSteps: string[];
    priority: 'high' | 'medium' | 'low';
  }[];
  narrativeAdvice: string; // How to frame their story
}

// ============================================================================
// LAYER 6: SYNTHESIS TYPES
// ============================================================================

export type HarvardScore = 1 | 2 | 3 | 4 | 5 | 6;

export interface HarvardScoreMapping {
  score: HarvardScore;
  label: 'Exceptional' | 'Excellent' | 'Good' | 'Adequate' | 'Concerning' | 'Problematic';
  description: string;
  rawScoreRange: { min: number; max: number };
}

export const HARVARD_SCORE_MAPPINGS: HarvardScoreMapping[] = [
  {
    score: 1,
    label: 'Exceptional',
    description: 'Outstanding academic record demonstrating intellectual excellence, maximum rigor utilization, and clear passion.',
    rawScoreRange: { min: 9.0, max: 10.0 },
  },
  {
    score: 2,
    label: 'Excellent',
    description: 'Very strong academics with high rigor, excellent performance, and evident intellectual curiosity.',
    rawScoreRange: { min: 7.5, max: 8.9 },
  },
  {
    score: 3,
    label: 'Good',
    description: 'Solid academic record with good rigor and performance, meeting competitive expectations.',
    rawScoreRange: { min: 6.0, max: 7.4 },
  },
  {
    score: 4,
    label: 'Adequate',
    description: 'Acceptable academics but with notable gaps in rigor, performance, or demonstrated interest.',
    rawScoreRange: { min: 4.5, max: 5.9 },
  },
  {
    score: 5,
    label: 'Concerning',
    description: 'Below typical competitive standards with significant concerns about preparation or trajectory.',
    rawScoreRange: { min: 3.0, max: 4.4 },
  },
  {
    score: 6,
    label: 'Problematic',
    description: 'Serious academic concerns that would require exceptional circumstances or other factors to overcome.',
    rawScoreRange: { min: 0.0, max: 2.9 },
  },
];

export interface ImprovementPath {
  action: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'this_semester' | 'next_year' | 'long_term';
}

export interface AcademicPortfolioScore {
  harvardScore: HarvardScore;
  harvardLabel: string;
  harvardDescription: string;

  dimensionScores: AcademicDimensionScores;
  narrativeAnalysis: AcademicNarrativeAnalysis;
  positioning: ContextualPositioning;
  teaching: AcademicTeaching;

  strengthsSummary: string[];
  concernsSummary: string[];
  improvementPaths: ImprovementPath[];

  confidenceScore: number; // 0-100 based on data completeness
  analysisMetadata: {
    heuristicsUsed: boolean;
    llmLayersCompleted: ('narrative' | 'positioning' | 'scoring' | 'teaching')[];
    totalCost: number;
    processingTimeMs: number;
  };
}

// ============================================================================
// SCORING RUBRICS (Reference Constants)
// ============================================================================

export const RIGOR_RUBRIC = {
  3.0: 'Exceptional: Maximum available rigor. All possible APs/IBs taken. Created opportunities beyond school.',
  2.5: 'Excellent: Near-maximum rigor. 8+ AP/IB courses. Challenged consistently.',
  2.0: 'Strong: Above-average rigor. 5-7 AP/IB courses. Good challenge-seeking.',
  1.5: 'Solid: Average competitive rigor. 3-4 AP/IB courses. Mix of challenging and standard.',
  1.0: 'Moderate: Below-average rigor. 1-2 AP/IB courses or mostly honors.',
  0.5: 'Limited: Minimal rigor despite availability. Mostly standard courses.',
  0.0: 'Concerning: No rigor despite availability OR intentional avoidance of challenge.',
} as const;

export const PERFORMANCE_RUBRIC = {
  2.5: 'Exceptional: 3.95+ UW GPA in most rigorous track. Top of class. No grade below A-.',
  2.0: 'Excellent: 3.8-3.94 UW. Strong performance in rigorous courses.',
  1.5: 'Strong: 3.6-3.79 UW. Solid in rigorous courses. Some Bs acceptable.',
  1.0: 'Good: 3.4-3.59 UW. Mixed performance. Bs common but no Cs.',
  0.5: 'Moderate: 3.0-3.39 UW. Significant grade variation. Some Cs.',
  0.0: 'Concerning: <3.0 UW or Ds/Fs present OR significant unexplained decline.',
} as const;

export const CHARACTER_RUBRIC = {
  2.5: 'Remarkable: Clear intellectual passion visible. Deep subject expertise. Goes beyond curriculum.',
  2.0: 'Strong: Evident curiosity and depth. Sustained multi-year commitment to subjects.',
  1.5: 'Solid: Good depth in 1-2 areas. Some evidence of intellectual investment.',
  1.0: 'Adequate: Standard progression. Competent but no clear passion signals.',
  0.5: 'Limited: Surface-level engagement. Appears grade-focused.',
  0.0: 'Concerning: Strategic course avoidance. GPA protection over learning.',
} as const;

export const TRAJECTORY_RUBRIC = {
  2.0: 'Ascending: Clear upward trend. Taking on more challenge. Improvement in performance.',
  1.5: 'Stable Strong: Consistently strong throughout. Maintained excellence.',
  1.0: 'Mixed: Some ups and downs. No clear direction.',
  0.5: 'Declining: Downward trend in rigor or grades.',
  0.0: 'Concerning: Sharp decline. Rigor avoidance. Grade collapse.',
} as const;

// ============================================================================
// PIPELINE TYPES
// ============================================================================

export interface PipelineOptions {
  includeTeaching?: boolean; // Default true
  targetSelectivity?: 'top_10' | 'top_25' | 'top_50' | 'any';
  maxCost?: number; // Stop if cost exceeds
  timeout?: number; // Max processing time in ms
  fallbackToHeuristics?: boolean; // Default true
}

export interface PipelineResult {
  success: boolean;
  result?: AcademicPortfolioScore;
  error?: string;
  partialResult?: Partial<AcademicPortfolioScore>;
}

export interface CostTracker {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  callBreakdown: {
    layer: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }[];
}
