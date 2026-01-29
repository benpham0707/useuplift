/**
 * Academic Portfolio Synthesizer (Layer 6)
 *
 * Combines all analysis layers into a final portfolio score with:
 * - Harvard 1-6 scale mapping
 * - Improvement path generation
 * - Confidence scoring
 * - Full synthesis of insights
 */

import type {
  AcademicHistoryInput,
  AcademicDimensionScores,
  AcademicNarrativeAnalysis,
  ContextualPositioning,
  AcademicTeaching,
  AcademicPortfolioScore,
  HarvardScore,
  HeuristicFoundation,
  ImprovementPath,
  HARVARD_SCORE_MAPPINGS,
} from '../types';

// ============================================================================
// HARVARD SCORE MAPPING
// ============================================================================

interface HarvardMapping {
  score: HarvardScore;
  label: string;
  description: string;
}

function mapToHarvardScale(rawScore: number): HarvardMapping {
  // Score thresholds based on 0-10 scale
  if (rawScore >= 9.0) {
    return {
      score: 1,
      label: 'Exceptional',
      description:
        'Outstanding academic record demonstrating intellectual excellence, maximum rigor utilization, and clear passion.',
    };
  }
  if (rawScore >= 7.5) {
    return {
      score: 2,
      label: 'Excellent',
      description:
        'Very strong academics with high rigor, excellent performance, and evident intellectual curiosity.',
    };
  }
  if (rawScore >= 6.0) {
    return {
      score: 3,
      label: 'Good',
      description:
        'Solid academic record with good rigor and performance, meeting competitive expectations.',
    };
  }
  if (rawScore >= 4.5) {
    return {
      score: 4,
      label: 'Adequate',
      description:
        'Acceptable academics but with notable gaps in rigor, performance, or demonstrated interest.',
    };
  }
  if (rawScore >= 3.0) {
    return {
      score: 5,
      label: 'Concerning',
      description:
        'Below typical competitive standards with significant concerns about preparation or trajectory.',
    };
  }
  return {
    score: 6,
    label: 'Problematic',
    description:
      'Serious academic concerns that would require exceptional circumstances or other factors to overcome.',
  };
}

// ============================================================================
// IMPROVEMENT PATH GENERATION
// ============================================================================

function generateImprovementPaths(
  scores: AcademicDimensionScores,
  narrative: AcademicNarrativeAnalysis,
  positioning: ContextualPositioning,
  teaching: AcademicTeaching
): ImprovementPath[] {
  const paths: ImprovementPath[] = [];

  // Rigor improvements
  if (scores.rigor.score < 2.5) {
    const priority = scores.rigor.score < 1.5 ? 'high' : 'medium';
    paths.push({
      action: 'Increase course rigor by enrolling in more AP/IB or dual enrollment courses',
      impact:
        'Higher rigor demonstrates college readiness and can significantly improve admissions odds',
      priority,
      timeframe: scores.rigor.score < 1.5 ? 'immediate' : 'next_year',
    });
  }

  // Performance improvements
  if (scores.performance.score < 2.0) {
    const priority = scores.performance.score < 1.0 ? 'high' : 'medium';
    paths.push({
      action: 'Improve academic performance through study groups, tutoring, or office hours',
      impact: 'Strong grades validate course rigor choices and demonstrate capability',
      priority,
      timeframe: 'immediate',
    });
  }

  // Trajectory improvements
  if (scores.trajectory.projectedDirection === 'concerning') {
    paths.push({
      action: 'Reverse declining trajectory immediately - grades matter most in recent years',
      impact: 'Admissions officers weight recent performance heavily; an upward trend is positive',
      priority: 'high',
      timeframe: 'immediate',
    });
  }

  // Character/passion improvements
  if (scores.intellectualCharacter.score < 1.5) {
    paths.push({
      action: 'Demonstrate intellectual depth by pursuing independent projects, research, or competitions',
      impact: 'Intellectual curiosity distinguishes strong applicants at selective schools',
      priority: 'medium',
      timeframe: 'this_semester',
    });
  }

  // Address red narratives
  for (const redNarrative of narrative.redNarratives) {
    if (!redNarrative.mitigation) {
      paths.push({
        action: `Address the "${redNarrative.issue}" concern - be prepared to explain in applications`,
        impact: 'Proactively addressing concerns shows maturity and self-awareness',
        priority: 'high',
        timeframe: 'long_term',
      });
    }
  }

  // Opportunity utilization
  if (positioning.opportunityUtilization < 70) {
    paths.push({
      action: 'Take fuller advantage of available academic opportunities at your school',
      impact: 'Maximizing available opportunities shows initiative and intellectual ambition',
      priority: positioning.opportunityUtilization < 50 ? 'high' : 'medium',
      timeframe: 'this_semester',
    });
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  paths.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return paths.slice(0, 5); // Limit to top 5 most important
}

// ============================================================================
// SUMMARY GENERATION
// ============================================================================

function generateStrengthsSummary(
  scores: AcademicDimensionScores,
  narrative: AcademicNarrativeAnalysis,
  positioning: ContextualPositioning
): string[] {
  const strengths: string[] = [];

  // Score-based strengths
  if (scores.rigor.score >= 2.5) {
    strengths.push('Exceptional course rigor demonstrating willingness to challenge yourself');
  } else if (scores.rigor.score >= 2.0) {
    strengths.push('Strong course rigor with challenging course selections');
  }

  if (scores.performance.score >= 2.0) {
    strengths.push('Excellent academic performance showing consistent achievement');
  } else if (scores.performance.score >= 1.5) {
    strengths.push('Solid academic performance across courses');
  }

  if (scores.intellectualCharacter.score >= 2.0) {
    strengths.push('Clear intellectual passion and depth visible in coursework');
  }

  if (scores.trajectory.projectedDirection === 'ascending') {
    strengths.push('Positive upward trajectory showing growth and improvement');
  } else if (
    scores.trajectory.projectedDirection === 'stable' &&
    scores.trajectory.score >= 1.5
  ) {
    strengths.push('Consistently strong performance maintained over time');
  }

  // Narrative-based strengths
  if (narrative.narrativeType === 'consistent_excellence') {
    strengths.push('Track record of sustained academic excellence');
  } else if (narrative.narrativeType === 'rising_star') {
    strengths.push('Compelling growth story with demonstrated improvement');
  } else if (narrative.narrativeType === 'passion_driven') {
    strengths.push('Deep intellectual passion evident in course choices');
  }

  // Character traits
  const strongTraits = narrative.characterTraits.filter((t) => t.strength === 'strong');
  for (const trait of strongTraits.slice(0, 2)) {
    strengths.push(`Strong ${trait.trait.toLowerCase()}: ${trait.evidence}`);
  }

  // Positioning strengths
  if (positioning.relativeRigor === 'top_5%' || positioning.relativeRigor === 'top_10%') {
    strengths.push('Course rigor places you among top students at your school');
  }

  if (positioning.opportunityUtilization >= 85) {
    strengths.push('Maximum utilization of available academic opportunities');
  }

  return strengths.slice(0, 5);
}

function generateConcernsSummary(
  scores: AcademicDimensionScores,
  narrative: AcademicNarrativeAnalysis,
  positioning: ContextualPositioning
): string[] {
  const concerns: string[] = [];

  // Score-based concerns
  if (scores.rigor.score < 1.5) {
    concerns.push('Course rigor is below competitive expectations');
  }

  if (scores.performance.score < 1.0) {
    concerns.push('Academic performance needs significant improvement');
  }

  if (scores.trajectory.projectedDirection === 'concerning') {
    concerns.push('Declining trajectory is a red flag for admissions');
  }

  if (scores.intellectualCharacter.score < 1.0) {
    concerns.push('Limited evidence of intellectual passion or depth');
  }

  // Red narratives
  for (const red of narrative.redNarratives.slice(0, 2)) {
    concerns.push(`${red.issue}: ${red.context}`);
  }

  // Narrative type concerns
  if (narrative.narrativeType === 'gpa_protector') {
    concerns.push('Pattern suggests prioritizing grades over challenge');
  } else if (narrative.narrativeType === 'unfocused') {
    concerns.push('Academic record lacks clear direction or purpose');
  }

  // Positioning concerns
  if (positioning.opportunityUtilization < 50) {
    concerns.push('Significant academic opportunities left unutilized');
  }

  return concerns.slice(0, 4);
}

// ============================================================================
// CONFIDENCE SCORING
// ============================================================================

function calculateConfidenceScore(
  input: AcademicHistoryInput,
  heuristics: HeuristicFoundation
): number {
  let confidence = 100;

  // Data completeness penalties
  if (!input.courses || input.courses.length < 10) {
    confidence -= 15; // Limited course data
  }

  if (!input.schoolContext) {
    confidence -= 10; // No school context
  } else {
    if (!input.schoolContext.apCoursesOffered) {
      confidence -= 5; // Unknown AP availability
    }
    if (!input.schoolContext.collegeAttendanceRate) {
      confidence -= 3; // Unknown college rate
    }
  }

  if (heuristics.rawMetrics.yearlyGPAs.length < 3) {
    confidence -= 10; // Limited year data
  }

  // Missing critical data
  const coursesWithGrades = (input.courses || []).filter((c) => c.grade);
  const gradeCoverage = coursesWithGrades.length / Math.max(1, input.courses?.length || 1);
  if (gradeCoverage < 0.8) {
    confidence -= 10; // Many courses missing grades
  }

  // Inconsistencies
  if (heuristics.trajectory.gpaTrajectoryType === 'volatile') {
    confidence -= 5; // Volatile patterns are harder to assess
  }

  return Math.max(40, Math.min(100, confidence));
}

// ============================================================================
// MAIN SYNTHESIZER
// ============================================================================

export interface SynthesizerInput {
  input: AcademicHistoryInput;
  heuristics: HeuristicFoundation;
  narrative: AcademicNarrativeAnalysis;
  positioning: ContextualPositioning;
  scores: AcademicDimensionScores;
  teaching: AcademicTeaching;
  costTracker: {
    totalCost: number;
    processingTimeMs: number;
    layersCompleted: ('narrative' | 'positioning' | 'scoring' | 'teaching')[];
  };
}

export class AcademicPortfolioSynthesizer {
  synthesize(data: SynthesizerInput): AcademicPortfolioScore {
    const { input, heuristics, narrative, positioning, scores, teaching, costTracker } = data;

    // Map to Harvard scale
    const harvard = mapToHarvardScale(scores.weightedTotal);

    // Generate summaries
    const strengthsSummary = generateStrengthsSummary(scores, narrative, positioning);
    const concernsSummary = generateConcernsSummary(scores, narrative, positioning);

    // Generate improvement paths
    const improvementPaths = generateImprovementPaths(scores, narrative, positioning, teaching);

    // Calculate confidence
    const confidenceScore = calculateConfidenceScore(input, heuristics);

    return {
      harvardScore: harvard.score,
      harvardLabel: harvard.label,
      harvardDescription: harvard.description,

      dimensionScores: scores,
      narrativeAnalysis: narrative,
      positioning,
      teaching,

      strengthsSummary,
      concernsSummary,
      improvementPaths,

      confidenceScore,
      analysisMetadata: {
        heuristicsUsed: true,
        llmLayersCompleted: costTracker.layersCompleted,
        totalCost: costTracker.totalCost,
        processingTimeMs: costTracker.processingTimeMs,
      },
    };
  }
}

// ============================================================================
// SINGLETON & CONVENIENCE EXPORT
// ============================================================================

export const academicPortfolioSynthesizer = new AcademicPortfolioSynthesizer();

export function synthesizeAcademicPortfolio(data: SynthesizerInput): AcademicPortfolioScore {
  return academicPortfolioSynthesizer.synthesize(data);
}
