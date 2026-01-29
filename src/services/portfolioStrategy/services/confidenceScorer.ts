/**
 * Confidence Scorer Service
 *
 * Calculates confidence levels for academic analysis based on:
 * - Data completeness
 * - Cross-validation consistency
 * - Signal clarity
 *
 * Provides confidence scores and uncertainty ranges for Harvard scores.
 *
 * @version 1.0
 * @date January 2026
 */

import type { AcademicHistoryInput } from './academicHistoryAnalyzer';
import type { TrajectoryAnalysis as DetailedTrajectoryAnalysis } from './trajectoryAnalyzer';
import type { RedFlagReport } from './academicRedFlagDetector';
import type { CommitmentAnalysis } from './courseCommitmentAnalyzer';
import type { MajorAlignmentResult } from './majorAlignmentAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export interface ConfidenceBreakdown {
  // Data completeness (0-100)
  dataCompleteness: {
    score: number;
    components: {
      gradeHistory: { present: boolean; weight: number; contribution: number };
      courses: { present: boolean; count: number; weight: number; contribution: number };
      testScores: { present: boolean; weight: number; contribution: number };
      schoolContext: { present: boolean; weight: number; contribution: number };
      intendedMajor: { present: boolean; weight: number; contribution: number };
      apExams: { present: boolean; weight: number; contribution: number };
    };
    missingCritical: string[];
    missingOptional: string[];
  };

  // Cross-validation consistency (0-100)
  crossValidation: {
    score: number;
    checks: Array<{
      name: string;
      result: 'consistent' | 'minor_discrepancy' | 'major_discrepancy' | 'unable_to_validate';
      description: string;
      weight: number;
      contribution: number;
    }>;
    anomalies: string[];
  };

  // Signal clarity (0-100)
  signalClarity: {
    score: number;
    clearSignals: string[];
    ambiguousSignals: string[];
    conflictingSignals: string[];
  };

  // Overall confidence
  overall: {
    level: 'high' | 'medium' | 'low' | 'insufficient';
    score: number;
    harvardScoreRange: {
      min: number;
      max: number;
      mostLikely: number;
    };
    caveats: string[];
  };
}

// ============================================================================
// CONFIDENCE SCORER CLASS
// ============================================================================

export class ConfidenceScorer {
  /**
   * Calculate comprehensive confidence assessment
   */
  calculate(
    input: AcademicHistoryInput,
    trajectory: DetailedTrajectoryAnalysis,
    redFlags: RedFlagReport,
    commitment: CommitmentAnalysis,
    majorAlignment: MajorAlignmentResult,
    preliminaryHarvardScore: number
  ): ConfidenceBreakdown {
    // Calculate each component
    const dataCompleteness = this.assessDataCompleteness(input);
    const crossValidation = this.assessCrossValidation(input, trajectory, redFlags);
    const signalClarity = this.assessSignalClarity(trajectory, redFlags, commitment, majorAlignment);

    // Calculate overall
    const overallScore = this.calculateOverallScore(dataCompleteness, crossValidation, signalClarity);
    const level = this.determineLevel(overallScore);
    const scoreRange = this.calculateScoreRange(preliminaryHarvardScore, overallScore);
    const caveats = this.generateCaveats(dataCompleteness, crossValidation, signalClarity);

    return {
      dataCompleteness,
      crossValidation,
      signalClarity,
      overall: {
        level,
        score: overallScore,
        harvardScoreRange: scoreRange,
        caveats,
      },
    };
  }

  // ========================================================================
  // DATA COMPLETENESS
  // ========================================================================

  private assessDataCompleteness(input: AcademicHistoryInput): ConfidenceBreakdown['dataCompleteness'] {
    const components: ConfidenceBreakdown['dataCompleteness']['components'] = {
      gradeHistory: {
        present: this.hasGradeHistory(input),
        weight: 25,
        contribution: 0,
      },
      courses: {
        present: input.courses.length > 0,
        count: input.courses.length,
        weight: 20,
        contribution: 0,
      },
      testScores: {
        present: this.hasTestScores(input),
        weight: 15,
        contribution: 0,
      },
      schoolContext: {
        present: this.hasSchoolContext(input),
        weight: 15,
        contribution: 0,
      },
      intendedMajor: {
        present: !!input.intended_major,
        weight: 10,
        contribution: 0,
      },
      apExams: {
        present: (input.test_scores?.ap_exams?.length || 0) > 0,
        weight: 15,
        contribution: 0,
      },
    };

    // Calculate contributions
    if (components.gradeHistory.present) {
      const yearsPresent = this.countGradeHistoryYears(input);
      components.gradeHistory.contribution = (yearsPresent / 4) * components.gradeHistory.weight;
    }

    if (components.courses.present) {
      const courseScore = Math.min(1, input.courses.length / 24); // Expect ~24 courses for 4 years
      components.courses.contribution = courseScore * components.courses.weight;
    }

    if (components.testScores.present) {
      components.testScores.contribution = components.testScores.weight;
    }

    if (components.schoolContext.present) {
      components.schoolContext.contribution = components.schoolContext.weight;
    }

    if (components.intendedMajor.present) {
      components.intendedMajor.contribution = components.intendedMajor.weight;
    }

    if (components.apExams.present) {
      components.apExams.contribution = components.apExams.weight;
    }

    const totalContribution = Object.values(components).reduce((sum, c) => sum + c.contribution, 0);
    const score = Math.round(totalContribution);

    // Identify missing data
    const missingCritical: string[] = [];
    const missingOptional: string[] = [];

    if (!components.gradeHistory.present) {
      missingCritical.push('Grade history by year');
    }
    if (!components.courses.present) {
      missingCritical.push('Course records');
    }
    if (!components.testScores.present) {
      missingOptional.push('SAT/ACT scores');
    }
    if (!components.schoolContext.present) {
      missingOptional.push('School context details');
    }
    if (!components.intendedMajor.present) {
      missingOptional.push('Intended major');
    }
    if (!components.apExams.present) {
      missingOptional.push('AP exam scores');
    }

    return { score, components, missingCritical, missingOptional };
  }

  private hasGradeHistory(input: AcademicHistoryInput): boolean {
    const gh = input.grade_history;
    if (!gh) return false;
    return !!(gh.freshman?.gpa || gh.sophomore?.gpa || gh.junior?.gpa || gh.senior?.gpa);
  }

  private countGradeHistoryYears(input: AcademicHistoryInput): number {
    const gh = input.grade_history;
    if (!gh) return 0;
    let count = 0;
    if (gh.freshman?.gpa !== undefined) count++;
    if (gh.sophomore?.gpa !== undefined) count++;
    if (gh.junior?.gpa !== undefined) count++;
    if (gh.senior?.gpa !== undefined) count++;
    return count;
  }

  private hasTestScores(input: AcademicHistoryInput): boolean {
    return !!(input.test_scores?.sat || input.test_scores?.act);
  }

  private hasSchoolContext(input: AcademicHistoryInput): boolean {
    const sc = input.school_context;
    return !!(sc.tier || sc.ap_courses_offered);
  }

  // ========================================================================
  // CROSS-VALIDATION
  // ========================================================================

  private assessCrossValidation(
    input: AcademicHistoryInput,
    trajectory: DetailedTrajectoryAnalysis,
    redFlags: RedFlagReport
  ): ConfidenceBreakdown['crossValidation'] {
    const checks: ConfidenceBreakdown['crossValidation']['checks'] = [];
    const anomalies: string[] = [];

    // GPA vs Test Score alignment
    const gpaTestCheck = this.checkGPATestAlignment(input);
    checks.push(gpaTestCheck);
    if (gpaTestCheck.result === 'major_discrepancy') {
      anomalies.push(gpaTestCheck.description);
    }

    // Course Grade vs AP Exam alignment
    const gradeExamCheck = this.checkGradeExamAlignment(input);
    checks.push(gradeExamCheck);
    if (gradeExamCheck.result === 'major_discrepancy') {
      anomalies.push(gradeExamCheck.description);
    }

    // Trajectory vs Red Flags consistency
    const trajectoryFlagCheck = this.checkTrajectoryFlagConsistency(trajectory, redFlags);
    checks.push(trajectoryFlagCheck);
    if (trajectoryFlagCheck.result === 'major_discrepancy') {
      anomalies.push(trajectoryFlagCheck.description);
    }

    // Rigor vs School Context
    const rigorContextCheck = this.checkRigorSchoolContext(input, trajectory);
    checks.push(rigorContextCheck);
    if (rigorContextCheck.result === 'major_discrepancy') {
      anomalies.push(rigorContextCheck.description);
    }

    // Calculate score
    const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
    const totalContribution = checks.reduce((sum, c) => sum + c.contribution, 0);
    const score = Math.round((totalContribution / totalWeight) * 100);

    return { score, checks, anomalies };
  }

  private checkGPATestAlignment(input: AcademicHistoryInput): ConfidenceBreakdown['crossValidation']['checks'][0] {
    const gpa = input.gpa.unweighted || input.gpa.weighted;
    const sat = input.test_scores?.sat?.total;
    const act = input.test_scores?.act?.composite;

    if (!gpa || (!sat && !act)) {
      return {
        name: 'GPA vs Test Score',
        result: 'unable_to_validate',
        description: 'Missing GPA or test scores for comparison',
        weight: 25,
        contribution: 12.5, // Neutral
      };
    }

    // Expected SAT range for GPA (simplified)
    let expectedSatMin = 1000;
    let expectedSatMax = 1600;
    if (gpa >= 3.9) { expectedSatMin = 1400; expectedSatMax = 1600; }
    else if (gpa >= 3.7) { expectedSatMin = 1300; expectedSatMax = 1550; }
    else if (gpa >= 3.5) { expectedSatMin = 1200; expectedSatMax = 1500; }
    else if (gpa >= 3.3) { expectedSatMin = 1100; expectedSatMax = 1450; }

    const testScore = sat || (act ? act * 36 : 0); // Rough conversion

    if (testScore >= expectedSatMin && testScore <= expectedSatMax) {
      return {
        name: 'GPA vs Test Score',
        result: 'consistent',
        description: 'GPA and test scores are aligned',
        weight: 25,
        contribution: 25,
      };
    }

    if (testScore < expectedSatMin - 150 || testScore > expectedSatMax + 100) {
      return {
        name: 'GPA vs Test Score',
        result: 'major_discrepancy',
        description: `GPA (${gpa}) doesn't align with test scores (${sat || act})`,
        weight: 25,
        contribution: 5,
      };
    }

    return {
      name: 'GPA vs Test Score',
      result: 'minor_discrepancy',
      description: 'Slight mismatch between GPA and test scores',
      weight: 25,
      contribution: 15,
    };
  }

  private checkGradeExamAlignment(input: AcademicHistoryInput): ConfidenceBreakdown['crossValidation']['checks'][0] {
    const apExams = input.test_scores?.ap_exams || [];
    const apCourses = input.courses.filter(c => c.level === 'ap');

    if (apExams.length === 0 || apCourses.length === 0) {
      return {
        name: 'Course Grade vs AP Exam',
        result: 'unable_to_validate',
        description: 'No AP exam data for comparison',
        weight: 25,
        contribution: 12.5,
      };
    }

    // Check for A grades with low exam scores
    let discrepancies = 0;
    for (const exam of apExams) {
      const course = apCourses.find(c =>
        c.name.toLowerCase().includes(exam.subject.toLowerCase())
      );
      if (course) {
        const gradeValue = this.gradeToNumber(course.grade);
        if (gradeValue >= 3.7 && exam.score <= 2) {
          discrepancies++;
        }
      }
    }

    if (discrepancies >= 2) {
      return {
        name: 'Course Grade vs AP Exam',
        result: 'major_discrepancy',
        description: 'Multiple A grades in AP courses but low exam scores',
        weight: 25,
        contribution: 5,
      };
    }

    if (discrepancies === 1) {
      return {
        name: 'Course Grade vs AP Exam',
        result: 'minor_discrepancy',
        description: 'One mismatch between course grade and AP exam',
        weight: 25,
        contribution: 15,
      };
    }

    return {
      name: 'Course Grade vs AP Exam',
      result: 'consistent',
      description: 'Course grades and AP exam scores are aligned',
      weight: 25,
      contribution: 25,
    };
  }

  private checkTrajectoryFlagConsistency(
    trajectory: DetailedTrajectoryAnalysis,
    redFlags: RedFlagReport
  ): ConfidenceBreakdown['crossValidation']['checks'][0] {
    const trajectoryIsGood = ['strong_ascending', 'moderate_ascending', 'high_plateau'].includes(trajectory.gpa.trajectory_type);
    const hasSerious = redFlags.flags_detected.some(f => f.severity === 'tier1_disqualifying' || f.severity === 'tier2_serious');

    if (trajectoryIsGood && hasSerious) {
      return {
        name: 'Trajectory vs Red Flags',
        result: 'major_discrepancy',
        description: 'Good trajectory but serious red flags detected',
        weight: 25,
        contribution: 10,
      };
    }

    const trajectoryIsBad = ['descending', 'senior_decline', 'junior_dip'].includes(trajectory.gpa.trajectory_type);
    const hasNoFlags = redFlags.flags_detected.length === 0;

    if (trajectoryIsBad && hasNoFlags) {
      return {
        name: 'Trajectory vs Red Flags',
        result: 'minor_discrepancy',
        description: 'Bad trajectory but no flags detected - may be missing context',
        weight: 25,
        contribution: 15,
      };
    }

    return {
      name: 'Trajectory vs Red Flags',
      result: 'consistent',
      description: 'Trajectory and red flag assessments are aligned',
      weight: 25,
      contribution: 25,
    };
  }

  private checkRigorSchoolContext(
    input: AcademicHistoryInput,
    trajectory: DetailedTrajectoryAnalysis
  ): ConfidenceBreakdown['crossValidation']['checks'][0] {
    const apAvailable = input.school_context.ap_courses_offered || 10;
    const apTaken = trajectory.yearData.reduce((sum, y) => sum + y.apCount, 0);
    const utilizationRate = apTaken / apAvailable;

    const schoolTier = input.school_context.tier || 'tier3_well_resourced';

    // Well-resourced schools should have higher utilization
    const isWellResourced = ['tier1_elite_prep', 'tier2_competitive_magnet', 'tier3_well_resourced'].includes(schoolTier);

    if (isWellResourced && utilizationRate < 0.3) {
      return {
        name: 'Rigor vs School Context',
        result: 'major_discrepancy',
        description: 'Low rigor utilization at well-resourced school',
        weight: 25,
        contribution: 8,
      };
    }

    if (!isWellResourced && utilizationRate > 0.6) {
      return {
        name: 'Rigor vs School Context',
        result: 'consistent',
        description: 'High rigor utilization despite limited resources - positive',
        weight: 25,
        contribution: 25,
      };
    }

    return {
      name: 'Rigor vs School Context',
      result: 'consistent',
      description: 'Rigor level matches school context',
      weight: 25,
      contribution: 25,
    };
  }

  private gradeToNumber(grade: string): number {
    const gradeMap: Record<string, number> = {
      'A+': 4.3, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0,
    };
    return gradeMap[grade.toUpperCase()] || 3.0;
  }

  // ========================================================================
  // SIGNAL CLARITY
  // ========================================================================

  private assessSignalClarity(
    trajectory: DetailedTrajectoryAnalysis,
    redFlags: RedFlagReport,
    commitment: CommitmentAnalysis,
    majorAlignment: MajorAlignmentResult
  ): ConfidenceBreakdown['signalClarity'] {
    const clearSignals: string[] = [];
    const ambiguousSignals: string[] = [];
    const conflictingSignals: string[] = [];

    // Trajectory clarity
    if (trajectory.gpa.trajectory_type === 'strong_ascending') {
      clearSignals.push('Clear upward GPA trajectory');
    } else if (trajectory.gpa.trajectory_type === 'erratic') {
      ambiguousSignals.push('Erratic grade pattern - no clear trend');
    }

    // GPA-Rigor interaction clarity
    if (trajectory.gpa_rigor_interaction === 'ideal') {
      clearSignals.push('Ideal GPA-rigor relationship');
    } else if (trajectory.gpa_rigor_interaction === 'suspect_protection') {
      clearSignals.push('Clear GPA protection pattern detected');
    } else if (trajectory.gpa_rigor_interaction === 'neutral') {
      ambiguousSignals.push('Neither positive nor negative GPA-rigor pattern');
    }

    // Red flag clarity
    if (redFlags.overall_risk_level === 'none') {
      clearSignals.push('No red flags detected');
    } else if (redFlags.overall_risk_level === 'critical') {
      clearSignals.push('Critical red flag clearly present');
    }

    // Commitment clarity
    if (commitment.overallCommitmentScore >= 75) {
      clearSignals.push('Strong course commitment signals');
    } else if (commitment.overallCommitmentScore <= 40) {
      clearSignals.push('Low commitment clearly evident');
    } else {
      ambiguousSignals.push('Mixed commitment signals');
    }

    // Major alignment clarity
    if (majorAlignment.alignmentScore >= 80) {
      clearSignals.push('Strong major-course alignment');
    } else if (majorAlignment.alignmentScore <= 40) {
      clearSignals.push('Clear major-course mismatch');
    } else {
      ambiguousSignals.push('Moderate major alignment - neither strong nor weak');
    }

    // Check for conflicts
    const isTrajectoryGood = ['strong_ascending', 'moderate_ascending', 'high_plateau'].includes(trajectory.gpa.trajectory_type);
    const isCommitmentLow = commitment.overallCommitmentScore < 50;

    if (isTrajectoryGood && isCommitmentLow) {
      conflictingSignals.push('Good trajectory but low commitment');
    }

    // Calculate score
    const totalSignals = clearSignals.length + ambiguousSignals.length + conflictingSignals.length;
    const clarityScore = totalSignals > 0
      ? Math.round(((clearSignals.length * 1.0 + ambiguousSignals.length * 0.5) / totalSignals) * 100)
      : 50;

    return {
      score: Math.min(100, clarityScore - conflictingSignals.length * 10),
      clearSignals,
      ambiguousSignals,
      conflictingSignals,
    };
  }

  // ========================================================================
  // OVERALL CALCULATION
  // ========================================================================

  private calculateOverallScore(
    dataCompleteness: ConfidenceBreakdown['dataCompleteness'],
    crossValidation: ConfidenceBreakdown['crossValidation'],
    signalClarity: ConfidenceBreakdown['signalClarity']
  ): number {
    // Weighted average
    const weights = { data: 0.4, validation: 0.35, clarity: 0.25 };
    const score = Math.round(
      dataCompleteness.score * weights.data +
      crossValidation.score * weights.validation +
      signalClarity.score * weights.clarity
    );
    return Math.max(0, Math.min(100, score));
  }

  private determineLevel(score: number): ConfidenceBreakdown['overall']['level'] {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'low';
    return 'insufficient';
  }

  private calculateScoreRange(
    preliminaryScore: number,
    confidenceScore: number
  ): ConfidenceBreakdown['overall']['harvardScoreRange'] {
    // Higher confidence = narrower range
    let range: number;
    if (confidenceScore >= 80) range = 0.5;
    else if (confidenceScore >= 60) range = 1.0;
    else if (confidenceScore >= 40) range = 1.5;
    else range = 2.0;

    return {
      min: Math.max(1, Math.round((preliminaryScore - range) * 2) / 2),
      max: Math.min(6, Math.round((preliminaryScore + range) * 2) / 2),
      mostLikely: preliminaryScore,
    };
  }

  private generateCaveats(
    dataCompleteness: ConfidenceBreakdown['dataCompleteness'],
    crossValidation: ConfidenceBreakdown['crossValidation'],
    signalClarity: ConfidenceBreakdown['signalClarity']
  ): string[] {
    const caveats: string[] = [];

    // Data completeness caveats
    if (dataCompleteness.missingCritical.length > 0) {
      caveats.push(`Missing critical data: ${dataCompleteness.missingCritical.join(', ')}`);
    }

    // Cross-validation caveats
    if (crossValidation.anomalies.length > 0) {
      caveats.push(`Data inconsistencies: ${crossValidation.anomalies[0]}`);
    }

    // Signal clarity caveats
    if (signalClarity.conflictingSignals.length > 0) {
      caveats.push(`Conflicting signals: ${signalClarity.conflictingSignals[0]}`);
    }

    if (signalClarity.ambiguousSignals.length >= 3) {
      caveats.push('Multiple ambiguous signals reduce assessment certainty');
    }

    return caveats;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const confidenceScorer = new ConfidenceScorer();

/**
 * Convenience function for confidence calculation
 */
export function calculateConfidence(
  input: AcademicHistoryInput,
  trajectory: DetailedTrajectoryAnalysis,
  redFlags: RedFlagReport,
  commitment: CommitmentAnalysis,
  majorAlignment: MajorAlignmentResult,
  preliminaryHarvardScore: number
): ConfidenceBreakdown {
  return confidenceScorer.calculate(
    input,
    trajectory,
    redFlags,
    commitment,
    majorAlignment,
    preliminaryHarvardScore
  );
}
