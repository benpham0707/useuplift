// @ts-nocheck
/**
 * Nuanced Academic Analysis Pipeline
 *
 * Orchestrates the full academic analysis flow:
 * Layer 1: Data Normalization (sync)
 * Layer 2: Heuristic Foundation (sync, no LLM)
 * Layer 3: Deep Understanding (LLM - Sonnet)
 *          - Narrative Analysis
 *          - Contextual Positioning
 * Layer 4: Multi-Dimensional Scoring (LLM - Sonnet)
 * Layer 5: Teaching Generation (LLM - Sonnet)
 * Layer 6: Portfolio Synthesis (sync)
 *
 * Features:
 * - Parallel LLM calls where possible
 * - Cost tracking
 * - Fallback handling
 * - Timeout management
 */

import type {
  AcademicHistoryInput,
  AcademicPortfolioScore,
  HeuristicFoundation,
  AcademicNarrativeAnalysis,
  ContextualPositioning,
  AcademicDimensionScores,
  AcademicTeaching,
  PipelineOptions,
  PipelineResult,
} from '../types';

import { buildHeuristicFoundation } from '../understanding/heuristicFoundation';
import {
  analyzeAcademicNarrative,
  NarrativeAnalyzerResult,
} from '../understanding/academicNarrativeAnalyzer';
import {
  analyzeContextualPosition,
  PositionerResult,
} from '../understanding/contextualPositioner';
import {
  scoreAcademicDimensions,
  ScorerResult,
} from '../scoring/multiDimensionalScorer';
import {
  generateAcademicTeaching,
  generateFallbackTeaching,
  TeachingEngineResult,
} from '../teaching/academicTeachingEngine';
import { synthesizeAcademicPortfolio } from '../scoring/academicPortfolioSynthesizer';

// ============================================================================
// FALLBACK GENERATORS
// ============================================================================

function generateFallbackNarrative(heuristics: HeuristicFoundation): AcademicNarrativeAnalysis {
  // Infer narrative type from heuristics
  let narrativeType: AcademicNarrativeAnalysis['narrativeType'] = 'unfocused';

  const trajectory = heuristics.trajectory.gpaTrajectoryType;
  const avgGPA = heuristics.rawMetrics.avgGPA;
  const apCount = heuristics.rawMetrics.apCourses;

  if (trajectory === 'ascending') {
    narrativeType = 'rising_star';
  } else if (trajectory === 'stable_high' && avgGPA >= 3.8 && apCount >= 6) {
    narrativeType = 'consistent_excellence';
  } else if (trajectory === 'declining') {
    narrativeType = 'struggling_fighter';
  } else if (heuristics.commitment.sustainedSequences >= 2) {
    narrativeType = 'passion_driven';
  }

  // Check for GPA protection patterns
  if (
    avgGPA >= 3.8 &&
    apCount <= 2 &&
    heuristics.rawMetrics.honorsCourses <= 3 &&
    (heuristics.schoolContext?.apCoursesOffered || 0) >= 10
  ) {
    narrativeType = 'gpa_protector';
  }

  return {
    narrativeType,
    narrativeSummary: `Based on heuristic analysis, this appears to be a ${narrativeType.replace('_', ' ')} profile with a ${trajectory} GPA trajectory.`,
    keyMoments: [],
    characterTraits: [],
    passionSignals: heuristics.commitment.deepDives.map((subject) => ({
      subject,
      indicators: ['Multi-year commitment detected'],
      confidence: 60,
    })),
    contextUtilization:
      heuristics.majorAlignment.alignmentScore >= 75
        ? 'good'
        : heuristics.majorAlignment.alignmentScore >= 50
          ? 'moderate'
          : 'underutilized',
    redNarratives: heuristics.redFlags.critical.map((flag) => ({
      issue: flag,
      context: 'Detected by heuristic analysis',
    })),
  };
}

function generateFallbackPositioning(
  heuristics: HeuristicFoundation
): ContextualPositioning {
  const apCount = heuristics.rawMetrics.apCourses;
  const avgGPA = heuristics.rawMetrics.avgGPA;

  // Estimate relative rigor based on AP count
  let relativeRigor: ContextualPositioning['relativeRigor'] = 'top_50%';
  if (apCount >= 10) {
    relativeRigor = 'top_5%';
  } else if (apCount >= 7) {
    relativeRigor = 'top_10%';
  } else if (apCount >= 4) {
    relativeRigor = 'top_25%';
  } else if (apCount <= 1) {
    relativeRigor = 'below_average';
  }

  // Estimate relative performance based on GPA
  let relativePerformance: ContextualPositioning['relativePerformance'] = 'solid';
  if (avgGPA >= 3.9) {
    relativePerformance = 'exceptional';
  } else if (avgGPA >= 3.7) {
    relativePerformance = 'strong';
  } else if (avgGPA >= 3.4) {
    relativePerformance = 'solid';
  } else if (avgGPA >= 3.0) {
    relativePerformance = 'mixed';
  } else {
    relativePerformance = 'concerning';
  }

  return {
    relativeRigor,
    relativePerformance,
    opportunityUtilization: heuristics.majorAlignment.alignmentScore,
    competitiveContext: 'Heuristic-based positioning. LLM analysis unavailable.',
    peerComparison: 'is comparable to other competitive applicants.',
    schoolTierAssessment: 'School context could not be fully evaluated.',
    targetSchoolFit: {
      topTier: avgGPA >= 3.8 && apCount >= 6 ? 'competitive' : 'reach',
      midTier: avgGPA >= 3.6 ? 'competitive' : 'reach',
      safetyTier: avgGPA >= 3.4 ? 'strong' : 'competitive',
    },
  };
}

function generateFallbackScores(
  heuristics: HeuristicFoundation,
  narrative: AcademicNarrativeAnalysis,
  positioning: ContextualPositioning
): AcademicDimensionScores {
  const apCount = heuristics.rawMetrics.apCourses;
  const avgGPA = heuristics.rawMetrics.avgGPA;
  const trajectory = heuristics.trajectory.gpaTrajectoryType;

  // Rigor score (0-3)
  let rigorScore = 1.5;
  if (apCount >= 10) rigorScore = 3.0;
  else if (apCount >= 7) rigorScore = 2.5;
  else if (apCount >= 4) rigorScore = 2.0;
  else if (apCount >= 2) rigorScore = 1.5;
  else if (apCount >= 1) rigorScore = 1.0;
  else rigorScore = 0.5;

  // Performance score (0-2.5)
  let performanceScore = 1.25;
  if (avgGPA >= 3.95) performanceScore = 2.5;
  else if (avgGPA >= 3.8) performanceScore = 2.0;
  else if (avgGPA >= 3.6) performanceScore = 1.5;
  else if (avgGPA >= 3.4) performanceScore = 1.0;
  else if (avgGPA >= 3.0) performanceScore = 0.5;
  else performanceScore = 0.0;

  // Trajectory bonus
  let trajectoryBonus = 0;
  if (trajectory === 'ascending') trajectoryBonus = 0.25;
  else if (trajectory === 'declining') trajectoryBonus = -0.25;

  // Intellectual character (0-2.5) - based on commitment depth
  let characterScore = 1.0;
  if (heuristics.commitment.sustainedSequences >= 3) characterScore = 2.0;
  else if (heuristics.commitment.sustainedSequences >= 2) characterScore = 1.5;
  else if (heuristics.commitment.sustainedSequences >= 1) characterScore = 1.0;

  if (narrative.narrativeType === 'gpa_protector') {
    characterScore = Math.min(characterScore, 0.5);
  }

  // Trajectory score (0-2)
  let trajectoryScore = 1.0;
  if (trajectory === 'ascending') trajectoryScore = 2.0;
  else if (trajectory === 'stable_high') trajectoryScore = 1.5;
  else if (trajectory === 'stable_mid') trajectoryScore = 1.0;
  else if (trajectory === 'declining') trajectoryScore = 0.5;
  else if (trajectory === 'volatile') trajectoryScore = 0.5;

  const rawTotal = rigorScore + performanceScore + characterScore + trajectoryScore;

  return {
    rigor: {
      score: rigorScore,
      rationale: `Based on ${apCount} AP courses taken.`,
      keyEvidence: [`${apCount} AP courses`],
      benchmarkComparison: 'Heuristic-based scoring',
      contextAdjustment: 'School context not fully evaluated',
    },
    performance: {
      score: performanceScore,
      rationale: `Based on ${avgGPA.toFixed(2)} GPA.`,
      keyEvidence: [`${avgGPA.toFixed(2)} GPA`],
      benchmarkComparison: 'Heuristic-based scoring',
      trajectoryBonus,
    },
    intellectualCharacter: {
      score: characterScore,
      rationale: `Based on ${heuristics.commitment.sustainedSequences} sustained sequences.`,
      keyEvidence: heuristics.commitment.deepDives,
      benchmarkComparison: 'Heuristic-based scoring',
      passionAreas: heuristics.commitment.deepDives,
    },
    trajectory: {
      score: trajectoryScore,
      rationale: `${trajectory} trajectory detected.`,
      keyEvidence: [trajectory],
      benchmarkComparison: 'Heuristic-based scoring',
      projectedDirection:
        trajectory === 'ascending'
          ? 'ascending'
          : trajectory === 'declining'
            ? 'concerning'
            : 'stable',
    },
    rawTotal,
    weightedTotal: rawTotal + trajectoryBonus,
  };
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

export class NuancedAcademicPipeline {
  async analyze(
    input: AcademicHistoryInput,
    options: PipelineOptions = {}
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const {
      includeTeaching = true,
      targetSelectivity = 'top_25',
      maxCost = 0.15, // ~$0.15 budget
      fallbackToHeuristics = true,
    } = options;

    let totalCost = 0;
    const layersCompleted: ('narrative' | 'positioning' | 'scoring' | 'teaching')[] = [];

    try {
      // ========================================
      // LAYER 2: Heuristic Foundation (sync)
      // ========================================
      const heuristicResult = buildHeuristicFoundation(input);
      if (!heuristicResult.success || !heuristicResult.foundation) {
        return {
          success: false,
          error: heuristicResult.error || 'Failed to build heuristic foundation',
        };
      }
      const heuristics = heuristicResult.foundation;

      // ========================================
      // LAYER 3: Deep Understanding (parallel LLM)
      // ========================================
      let narrative: AcademicNarrativeAnalysis;
      let positioning: ContextualPositioning;

      // Run narrative and positioning in parallel
      const [narrativeResult, positioningResult] = await Promise.all([
        analyzeAcademicNarrative(input, heuristics).catch((err): NarrativeAnalyzerResult => {
          console.error('[Pipeline] Narrative analysis failed:', err);
          return { success: false, error: err.message };
        }),
        analyzeContextualPosition(input, heuristics, { targetSelectivity }).catch(
          (err): PositionerResult => {
            console.error('[Pipeline] Positioning analysis failed:', err);
            return { success: false, error: err.message };
          }
        ),
      ]);

      // Handle narrative result
      if (narrativeResult.success && narrativeResult.analysis) {
        narrative = narrativeResult.analysis;
        layersCompleted.push('narrative');
        if (narrativeResult.usage) {
          totalCost += narrativeResult.usage.cost;
        }
      } else if (fallbackToHeuristics) {
        console.warn('[Pipeline] Using fallback narrative');
        narrative = generateFallbackNarrative(heuristics);
      } else {
        return {
          success: false,
          error: narrativeResult.error || 'Narrative analysis failed',
        };
      }

      // Handle positioning result
      if (positioningResult.success && positioningResult.positioning) {
        positioning = positioningResult.positioning;
        layersCompleted.push('positioning');
        if (positioningResult.usage) {
          totalCost += positioningResult.usage.cost;
        }
      } else if (fallbackToHeuristics) {
        console.warn('[Pipeline] Using fallback positioning');
        positioning = generateFallbackPositioning(heuristics);
      } else {
        return {
          success: false,
          error: positioningResult.error || 'Positioning analysis failed',
        };
      }

      // Check cost budget
      if (totalCost > maxCost) {
        console.warn(`[Pipeline] Cost budget exceeded: $${totalCost.toFixed(4)} > $${maxCost}`);
      }

      // ========================================
      // LAYER 4: Multi-Dimensional Scoring (LLM)
      // ========================================
      let scores: AcademicDimensionScores;

      const scoringResult = await scoreAcademicDimensions(
        input,
        heuristics,
        narrative,
        positioning
      ).catch((err): ScorerResult => {
        console.error('[Pipeline] Scoring failed:', err);
        return { success: false, error: err.message };
      });

      if (scoringResult.success && scoringResult.scores) {
        scores = scoringResult.scores;
        layersCompleted.push('scoring');
        if (scoringResult.usage) {
          totalCost += scoringResult.usage.cost;
        }
      } else if (fallbackToHeuristics) {
        console.warn('[Pipeline] Using fallback scoring');
        scores = generateFallbackScores(heuristics, narrative, positioning);
      } else {
        return {
          success: false,
          error: scoringResult.error || 'Scoring failed',
        };
      }

      // ========================================
      // LAYER 5: Teaching (LLM, optional)
      // ========================================
      let teaching: AcademicTeaching;

      if (includeTeaching && totalCost < maxCost * 0.9) {
        const teachingResult = await generateAcademicTeaching(
          scores,
          narrative,
          positioning
        ).catch((err): TeachingEngineResult => {
          console.error('[Pipeline] Teaching generation failed:', err);
          return { success: false, error: err.message };
        });

        if (teachingResult.success && teachingResult.teaching) {
          teaching = teachingResult.teaching;
          layersCompleted.push('teaching');
          if (teachingResult.usage) {
            totalCost += teachingResult.usage.cost;
          }
        } else {
          console.warn('[Pipeline] Using fallback teaching');
          teaching = generateFallbackTeaching(scores, narrative);
        }
      } else {
        teaching = generateFallbackTeaching(scores, narrative);
      }

      // ========================================
      // LAYER 6: Synthesis (sync)
      // ========================================
      const processingTimeMs = Date.now() - startTime;

      const result = synthesizeAcademicPortfolio({
        input,
        heuristics,
        narrative,
        positioning,
        scores,
        teaching,
        costTracker: {
          totalCost,
          processingTimeMs,
          layersCompleted,
        },
      });

      return {
        success: true,
        result,
      };
    } catch (error) {
      console.error('[Pipeline] Unexpected error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown pipeline error',
      };
    }
  }
}

// ============================================================================
// SINGLETON & CONVENIENCE EXPORT
// ============================================================================

export const nuancedAcademicPipeline = new NuancedAcademicPipeline();

export async function analyzeAcademicsWithDepth(
  input: AcademicHistoryInput,
  options?: PipelineOptions
): Promise<PipelineResult> {
  return nuancedAcademicPipeline.analyze(input, options);
}
