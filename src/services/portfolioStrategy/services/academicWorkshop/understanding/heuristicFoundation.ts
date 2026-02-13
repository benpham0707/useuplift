// @ts-nocheck
/**
 * Heuristic Foundation (Layer 2)
 *
 * Fast, synchronous extraction of basic patterns from academic data.
 * Uses existing analyzers to build a foundation for LLM layers.
 * No LLM calls - pure computation for speed and reliability.
 */

import type { AcademicHistoryInput, HeuristicFoundation } from '../types';
import { analyzeTrajectory } from '../../trajectoryAnalyzer';
import { detectAcademicRedFlags } from '../../academicRedFlagDetector';
import { analyzeCommitment } from '../../courseCommitmentAnalyzer';
import { analyzeMajorAlignment } from '../../majorAlignmentAnalyzer';

// ============================================================================
// METRIC EXTRACTION
// ============================================================================

function calculateRawMetrics(
  input: AcademicHistoryInput
): HeuristicFoundation['rawMetrics'] {
  const courses = input.courses || [];

  let apCourses = 0;
  let ibCourses = 0;
  let honorsCourses = 0;

  for (const course of courses) {
    const level = (course.level || '').toLowerCase();
    if (level.includes('ap') || level === 'ap') {
      apCourses++;
    } else if (level.includes('ib') || level === 'ib') {
      ibCourses++;
    } else if (level.includes('honors') || level.includes('advanced') || level === 'honors') {
      honorsCourses++;
    }
  }

  // Calculate GPA from courses
  const gradeToGPA: Record<string, number> = {
    'A+': 4.0,
    A: 4.0,
    'A-': 3.7,
    'B+': 3.3,
    B: 3.0,
    'B-': 2.7,
    'C+': 2.3,
    C: 2.0,
    'C-': 1.7,
    'D+': 1.3,
    D: 1.0,
    'D-': 0.7,
    F: 0.0,
  };

  let totalGPA = 0;
  let gradeCount = 0;
  const yearlyGPAs: { year: string; gpa: number }[] = [];
  const yearGrades: Record<string, { total: number; count: number }> = {};

  for (const course of courses) {
    const grade = course.grade?.toUpperCase() || '';
    const gpaValue = gradeToGPA[grade];
    if (gpaValue !== undefined) {
      totalGPA += gpaValue;
      gradeCount++;

      const year = course.year || 'Unknown';
      if (!yearGrades[year]) {
        yearGrades[year] = { total: 0, count: 0 };
      }
      yearGrades[year].total += gpaValue;
      yearGrades[year].count++;
    }
  }

  // Sort years and calculate yearly GPAs
  const yearOrder = ['Freshman', 'Sophomore', 'Junior', 'Senior', '9th', '10th', '11th', '12th'];
  const sortedYears = Object.keys(yearGrades).sort((a, b) => {
    const aIndex = yearOrder.findIndex((y) => a.toLowerCase().includes(y.toLowerCase()));
    const bIndex = yearOrder.findIndex((y) => b.toLowerCase().includes(y.toLowerCase()));
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  for (const year of sortedYears) {
    const data = yearGrades[year];
    yearlyGPAs.push({
      year,
      gpa: data.count > 0 ? data.total / data.count : 0,
    });
  }

  return {
    totalCourses: courses.length,
    apCourses,
    ibCourses,
    honorsCourses,
    avgGPA: gradeCount > 0 ? totalGPA / gradeCount : 0,
    yearlyGPAs,
  };
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

export interface HeuristicFoundationResult {
  success: boolean;
  foundation?: HeuristicFoundation;
  error?: string;
}

export class HeuristicFoundationBuilder {
  build(input: AcademicHistoryInput): HeuristicFoundationResult {
    try {
      // Get raw metrics
      const rawMetrics = calculateRawMetrics(input);

      // Analyze trajectory (reuse existing analyzer)
      const trajectoryResult = analyzeTrajectory(input);

      // Detect red flags (reuse existing analyzer)
      const redFlagResult = detectAcademicRedFlags(input);

      // Analyze commitment (reuse existing analyzer)
      const commitmentResult = analyzeCommitment(input);

      // Analyze major alignment (reuse existing analyzer)
      const majorResult = analyzeMajorAlignment(input);

      // Build foundation object
      const foundation: HeuristicFoundation = {
        trajectory: {
          gpaTrajectoryType: this.mapTrajectoryType(trajectoryResult.gpa?.trajectory_type),
          rigorTrajectoryType: this.mapRigorTrajectoryType(trajectoryResult.rigor?.trajectory_type),
          yearWeightedGPA: trajectoryResult.gpa?.year_weighted_gpa || rawMetrics.avgGPA,
          gpaRigorInteraction: trajectoryResult.gpa_rigor_interaction || 'unknown',
        },
        redFlags: {
          critical: redFlagResult.flags
            .filter((f) => f.severity === 'critical')
            .map((f) => f.flag),
          warning: redFlagResult.flags
            .filter((f) => f.severity === 'warning')
            .map((f) => f.flag),
          minor: redFlagResult.flags.filter((f) => f.severity === 'minor').map((f) => f.flag),
        },
        commitment: {
          sustainedSequences: commitmentResult.sustainedSequences?.length || 0,
          deepDives: commitmentResult.sustainedSequences?.map((s) => s.subject) || [],
          concerningDrops: commitmentResult.concerningDrops?.map((d) => d.subject) || [],
        },
        majorAlignment: {
          alignmentScore: majorResult.alignmentScore || 0,
          requirementsMet: majorResult.requirementsMet || [],
          gaps: majorResult.gaps || [],
        },
        rawMetrics,
      };

      return {
        success: true,
        foundation,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error building heuristic foundation',
      };
    }
  }

  private mapTrajectoryType(
    type: string | undefined
  ): HeuristicFoundation['trajectory']['gpaTrajectoryType'] {
    const mapping: Record<string, HeuristicFoundation['trajectory']['gpaTrajectoryType']> = {
      ascending: 'ascending',
      stable_high: 'stable_high',
      stable_mid: 'stable_mid',
      stable: 'stable_mid',
      declining: 'declining',
      volatile: 'volatile',
      fluctuating: 'volatile',
    };
    return mapping[type?.toLowerCase() || ''] || 'stable_mid';
  }

  private mapRigorTrajectoryType(
    type: string | undefined
  ): HeuristicFoundation['trajectory']['rigorTrajectoryType'] {
    const mapping: Record<string, HeuristicFoundation['trajectory']['rigorTrajectoryType']> = {
      increasing: 'increasing',
      sustained: 'sustained',
      sustained_high: 'sustained',
      declining: 'declining',
      inconsistent: 'inconsistent',
      variable: 'inconsistent',
    };
    return mapping[type?.toLowerCase() || ''] || 'sustained';
  }
}

// ============================================================================
// SINGLETON & CONVENIENCE EXPORT
// ============================================================================

export const heuristicFoundationBuilder = new HeuristicFoundationBuilder();

export function buildHeuristicFoundation(
  input: AcademicHistoryInput
): HeuristicFoundationResult {
  return heuristicFoundationBuilder.build(input);
}
