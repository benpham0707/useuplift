/**
 * Nuanced Capability Analyzer
 *
 * Moves beyond discrete capability tiers to provide continuous, personalized
 * understanding of a student's academic patterns and potential.
 *
 * Philosophy:
 * - Every student has a unique capability profile, not a tier label
 * - Performance patterns reveal more than averages
 * - The goal is finding THEIR optimal path, not fitting them into boxes
 * - Teaching should emerge naturally from the analysis, not repeat it
 *
 * Key Insight: Instead of saying "you're a high achiever" or "you're a solid performer",
 * we analyze the specific patterns in their history to understand:
 * - What difficulty level lets them shine?
 * - Which subjects are their strengths/challenges?
 * - How do they respond to increased difficulty?
 * - What's their realistic ceiling? Their floor?
 * - What progression makes sense for THEM specifically?
 */

import type { CourseRecord } from '../types';
import { GRADE_TO_GPA, GPA_TO_GRADE } from './types';

// ============================================================================
// NUANCED CAPABILITY PROFILE
// ============================================================================

/**
 * A continuous, nuanced understanding of the student's academic capability.
 * No tier labels - just specific patterns and personalized insights.
 */
export interface NuancedCapabilityAnalysis {
  // Core Performance Patterns
  performanceFingerprint: PerformanceFingerprint;

  // Subject-Specific Patterns
  subjectPatterns: SubjectPatternMap;

  // Challenge Response Analysis
  challengeResponse: ChallengeResponseAnalysis;

  // Progression Trajectory
  progressionTrajectory: ProgressionTrajectory;

  // Personalized Ceiling/Floor Analysis
  performanceEnvelope: PerformanceEnvelope;

  // Synthesis
  synthesis: CapabilitySynthesis;
}

// ============================================================================
// PERFORMANCE FINGERPRINT
// ============================================================================

/**
 * A detailed fingerprint of the student's performance patterns.
 * Not a tier - a continuous profile of how they perform.
 */
export interface PerformanceFingerprint {
  /**
   * Expected GPA at each difficulty level based on historical performance.
   * This is the core insight - what grade can they realistically expect?
   */
  expectedGPAByLevel: {
    ap_ib: ExpectedPerformance | null;
    honors: ExpectedPerformance | null;
    regular: ExpectedPerformance | null;
  };

  /**
   * The "sweet spot" - difficulty level that maximizes outcomes.
   * Could be AP for some subjects, honors for others.
   */
  sweetSpot: {
    level: 'ap_ib' | 'honors' | 'regular';
    expectedGPA: number;
    confidence: number;
    reasoning: string;
  };

  /**
   * Performance consistency measure (0-100).
   * High = predictable results, Low = variable results.
   */
  consistencyScore: number;

  /**
   * How much does difficulty level affect their performance?
   * Some students maintain grades regardless, others are highly sensitive.
   */
  difficultySensitivity: 'low' | 'moderate' | 'high';
  difficultySensitivityDetail: string;

  /**
   * Overall performance position (continuous 0-100, not a tier).
   * This considers both achievement and context.
   */
  performancePercentile: number;
}

export interface ExpectedPerformance {
  expectedGPA: number;
  range: { low: number; high: number };
  confidence: number;
  sampleSize: number;
  trend: 'improving' | 'stable' | 'declining';
}

// ============================================================================
// SUBJECT PATTERNS
// ============================================================================

export type SubjectPatternMap = {
  [subject: string]: SubjectPattern;
};

export interface SubjectPattern {
  /**
   * Historical performance in this subject (continuous, not tiered).
   */
  performanceHistory: {
    avgGPA: number;
    trend: 'improving' | 'stable' | 'declining';
    bestGrade: number;
    worstGrade: number;
    courses: CoursePerformance[];
  };

  /**
   * Performance at different difficulty levels in this subject.
   */
  byDifficulty: {
    ap_ib?: { avgGPA: number; courses: string[] };
    honors?: { avgGPA: number; courses: string[] };
    regular?: { avgGPA: number; courses: string[] };
  };

  /**
   * Is this a relative strength or challenge for this student?
   * Measured against THEIR OWN average, not arbitrary benchmarks.
   */
  relativeStrength: number; // -1 (challenge) to +1 (strength)
  strengthAssessment: string;

  /**
   * What level should they take next in this subject?
   * Considers their specific performance pattern, not a generic rule.
   */
  recommendedLevel: 'ap_ib' | 'honors' | 'regular';
  levelReasoning: string;

  /**
   * Expected outcome if they follow the recommendation.
   */
  projectedOutcome: {
    expectedGrade: string;
    confidence: number;
    reasoning: string;
  };
}

export interface CoursePerformance {
  name: string;
  level: string;
  grade: number;
  year: number;
}

// ============================================================================
// CHALLENGE RESPONSE ANALYSIS
// ============================================================================

/**
 * Detailed analysis of how the student responds to increased difficulty.
 * This is crucial for progression recommendations.
 */
export interface ChallengeResponseAnalysis {
  /**
   * When they move up a difficulty level, what happens?
   * Based on actual observed transitions in their history.
   */
  transitionAnalysis: {
    observedTransitions: DifficultyTransition[];
    typicalImpact: number; // Average grade change
    adaptationSpeed: 'quick' | 'gradual' | 'slow' | 'unknown';
    recoveryPattern: 'full_recovery' | 'partial_recovery' | 'persistent_impact' | 'unknown';
  };

  /**
   * Risk assessment for taking on more challenge.
   * Personalized to their specific patterns.
   */
  challengeRiskProfile: {
    riskLevel: number; // 0-100, continuous
    riskFactors: string[];
    protectiveFactors: string[];
    recommendation: string;
  };

  /**
   * What conditions need to be true for them to succeed at higher difficulty?
   */
  successConditions: string[];

  /**
   * Warning signs that suggest they should back off.
   */
  warningIndicators: string[];
}

export interface DifficultyTransition {
  subject: string;
  from: string;
  to: string;
  gradeBefore: number;
  gradeAfter: number;
  year: string;
  outcome: 'thrived' | 'adapted' | 'struggled';
}

// ============================================================================
// PROGRESSION TRAJECTORY
// ============================================================================

/**
 * Analysis of how the student has progressed over time
 * and projection of where they're heading.
 */
export interface ProgressionTrajectory {
  /**
   * Historical trajectory (what's happened).
   */
  historical: {
    gpaByYear: { year: string; gpa: number; rigorLevel: number }[];
    overallTrend: 'accelerating' | 'improving' | 'stable' | 'plateauing' | 'declining';
    trendStrength: number; // How strong is the trend? 0-100
    inflectionPoints: InflectionPoint[];
  };

  /**
   * Projected trajectory (where they're heading).
   */
  projected: {
    nextYearGPA: { expected: number; range: { low: number; high: number } };
    ceilingEstimate: number; // What's the highest GPA they can realistically achieve?
    trajectory: 'upward' | 'stable' | 'at_ceiling' | 'declining';
    confidence: number;
  };

  /**
   * What would change their trajectory?
   */
  trajectoryLevers: TrajectoryLever[];
}

export interface InflectionPoint {
  year: string;
  event: string;
  impact: 'positive' | 'negative';
  description: string;
}

export interface TrajectoryLever {
  lever: string;
  impact: 'positive' | 'negative';
  magnitude: 'small' | 'moderate' | 'significant';
  description: string;
}

// ============================================================================
// PERFORMANCE ENVELOPE
// ============================================================================

/**
 * The student's realistic performance range - their floor and ceiling.
 * This helps set appropriate expectations.
 */
export interface PerformanceEnvelope {
  /**
   * Their demonstrated ceiling (best sustainable performance).
   */
  ceiling: {
    gpa: number;
    conditions: string; // Under what conditions did they achieve this?
    isRepeatable: boolean;
    howToReach: string;
  };

  /**
   * Their demonstrated floor (worst performance when challenged).
   */
  floor: {
    gpa: number;
    conditions: string; // What led to this?
    warningSignsThatPrecedeIt: string[];
    howToAvoid: string;
  };

  /**
   * Their comfortable operating range.
   */
  comfortableRange: {
    low: number;
    high: number;
    typicalGPA: number;
    description: string;
  };

  /**
   * Key insight: Where should they aim?
   */
  optimalTarget: {
    gpa: number;
    reasoning: string;
    tradeoffs: string;
  };
}

// ============================================================================
// CAPABILITY SYNTHESIS
// ============================================================================

/**
 * The synthesis of all analysis into clear, actionable understanding.
 * This is NOT a tier label - it's a personalized profile.
 */
export interface CapabilitySynthesis {
  /**
   * One-paragraph summary of their academic capability profile.
   * Written to them directly, specific to their patterns.
   */
  profileSummary: string;

  /**
   * Key strengths (specific, not generic).
   */
  strengths: SynthesisInsight[];

  /**
   * Key challenges (specific, not generic).
   */
  challenges: SynthesisInsight[];

  /**
   * The core insight about their capability.
   */
  coreInsight: string;

  /**
   * What makes them unique (their specific pattern).
   */
  uniquePattern: string;
}

export interface SynthesisInsight {
  insight: string;
  evidence: string;
  implication: string;
}

// ============================================================================
// MAIN ANALYZER CLASS
// ============================================================================

export class NuancedCapabilityAnalyzer {
  analyze(
    courses: CourseRecord[],
    gradeHistory?: { [year: string]: { gpa: number; courses: number } }
  ): NuancedCapabilityAnalysis {
    // Build performance fingerprint
    const performanceFingerprint = this.buildPerformanceFingerprint(courses);

    // Analyze subject patterns
    const subjectPatterns = this.analyzeSubjectPatterns(courses, performanceFingerprint);

    // Analyze challenge response
    const challengeResponse = this.analyzeChallengeResponse(courses);

    // Build progression trajectory
    const progressionTrajectory = this.buildProgressionTrajectory(courses, gradeHistory);

    // Calculate performance envelope
    const performanceEnvelope = this.calculatePerformanceEnvelope(
      courses,
      performanceFingerprint,
      challengeResponse
    );

    // Synthesize all insights
    const synthesis = this.synthesize(
      performanceFingerprint,
      subjectPatterns,
      challengeResponse,
      progressionTrajectory,
      performanceEnvelope
    );

    return {
      performanceFingerprint,
      subjectPatterns,
      challengeResponse,
      progressionTrajectory,
      performanceEnvelope,
      synthesis,
    };
  }

  // ============================================================================
  // PERFORMANCE FINGERPRINT BUILDER
  // ============================================================================

  private buildPerformanceFingerprint(courses: CourseRecord[]): PerformanceFingerprint {
    // Group by difficulty level
    const byLevel = this.groupByDifficultyLevel(courses);

    // Calculate expected performance at each level
    const expectedGPAByLevel = {
      ap_ib: this.calculateExpectedPerformance(byLevel.ap_ib),
      honors: this.calculateExpectedPerformance(byLevel.honors),
      regular: this.calculateExpectedPerformance(byLevel.regular),
    };

    // Find the sweet spot
    const sweetSpot = this.findSweetSpot(expectedGPAByLevel);

    // Calculate consistency
    const allGrades = courses
      .map((c) => this.gradeToGPA(c.grade))
      .filter((g): g is number => g !== null);
    const consistencyScore = this.calculateConsistency(allGrades);

    // Calculate difficulty sensitivity
    const { sensitivity, detail } = this.calculateDifficultySensitivity(expectedGPAByLevel);

    // Calculate performance percentile
    const performancePercentile = this.calculatePerformancePercentile(
      expectedGPAByLevel,
      courses.length
    );

    return {
      expectedGPAByLevel,
      sweetSpot,
      consistencyScore,
      difficultySensitivity: sensitivity,
      difficultySensitivityDetail: detail,
      performancePercentile,
    };
  }

  private groupByDifficultyLevel(
    courses: CourseRecord[]
  ): Record<'ap_ib' | 'honors' | 'regular', CoursePerformance[]> {
    const groups: Record<'ap_ib' | 'honors' | 'regular', CoursePerformance[]> = {
      ap_ib: [],
      honors: [],
      regular: [],
    };

    for (const course of courses) {
      const gpa = this.gradeToGPA(course.grade);
      if (gpa === null) continue;

      const level = this.normalizeLevel(course.level);
      const entry: CoursePerformance = {
        name: course.name,
        level: course.level || 'regular',
        grade: gpa,
        year: typeof course.year === 'number' ? course.year : 0,
      };

      groups[level].push(entry);
    }

    return groups;
  }

  private calculateExpectedPerformance(courses: CoursePerformance[]): ExpectedPerformance | null {
    if (courses.length === 0) return null;

    const grades = courses.map((c) => c.grade);
    const avgGPA = grades.reduce((a, b) => a + b, 0) / grades.length;
    const sortedGrades = [...grades].sort((a, b) => a - b);

    // Calculate trend by year
    const byYear = new Map<number, number[]>();
    for (const course of courses) {
      if (!byYear.has(course.year)) byYear.set(course.year, []);
      byYear.get(course.year)!.push(course.grade);
    }
    const yearlyAvgs = Array.from(byYear.entries())
      .map(([year, grades]) => ({
        year,
        avg: grades.reduce((a, b) => a + b, 0) / grades.length,
      }))
      .sort((a, b) => a.year - b.year);

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (yearlyAvgs.length >= 2) {
      const firstHalf = yearlyAvgs.slice(0, Math.ceil(yearlyAvgs.length / 2));
      const secondHalf = yearlyAvgs.slice(Math.ceil(yearlyAvgs.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b.avg, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b.avg, 0) / secondHalf.length;
      const diff = secondAvg - firstAvg;
      if (diff > 0.15) trend = 'improving';
      else if (diff < -0.15) trend = 'declining';
    }

    // Calculate confidence based on sample size and variance
    const variance =
      grades.reduce((sum, g) => sum + Math.pow(g - avgGPA, 2), 0) / grades.length;
    const sampleConfidence = Math.min(courses.length * 15, 70);
    const varianceConfidence = Math.max(0, 30 - variance * 20);
    const confidence = Math.min(sampleConfidence + varianceConfidence, 95);

    return {
      expectedGPA: avgGPA,
      range: {
        low: Math.max(0, avgGPA - Math.sqrt(variance) * 1.5),
        high: Math.min(4.0, avgGPA + Math.sqrt(variance) * 1.5),
      },
      confidence,
      sampleSize: courses.length,
      trend,
    };
  }

  private findSweetSpot(
    expectedByLevel: PerformanceFingerprint['expectedGPAByLevel']
  ): PerformanceFingerprint['sweetSpot'] {
    // Priority: Find the highest difficulty level where they can maintain A-/B+ or better
    const targetGPA = 3.5; // B+/A- threshold

    // Check AP/IB first
    if (expectedByLevel.ap_ib && expectedByLevel.ap_ib.expectedGPA >= targetGPA) {
      return {
        level: 'ap_ib',
        expectedGPA: expectedByLevel.ap_ib.expectedGPA,
        confidence: expectedByLevel.ap_ib.confidence,
        reasoning: `You've demonstrated you can achieve ${GPA_TO_GRADE(expectedByLevel.ap_ib.expectedGPA)} grades in AP/IB courses. This is your optimal challenge level.`,
      };
    }

    // Check Honors
    if (expectedByLevel.honors && expectedByLevel.honors.expectedGPA >= targetGPA) {
      // If they have AP data but it's below target, honors is their sweet spot
      if (expectedByLevel.ap_ib && expectedByLevel.ap_ib.expectedGPA < targetGPA) {
        return {
          level: 'honors',
          expectedGPA: expectedByLevel.honors.expectedGPA,
          confidence: expectedByLevel.honors.confidence,
          reasoning: `Your performance drops when you move to AP/IB (${GPA_TO_GRADE(expectedByLevel.ap_ib.expectedGPA)}). Honors courses (${GPA_TO_GRADE(expectedByLevel.honors.expectedGPA)}) are where you do your best work while still being challenged.`,
        };
      }
      // If no AP data, honors might be ready for stretch
      const couldStretch = expectedByLevel.honors.expectedGPA >= 3.7;
      return {
        level: couldStretch ? 'ap_ib' : 'honors',
        expectedGPA: couldStretch
          ? expectedByLevel.honors.expectedGPA - 0.3
          : expectedByLevel.honors.expectedGPA,
        confidence: couldStretch ? 60 : expectedByLevel.honors.confidence,
        reasoning: couldStretch
          ? `Your strong honors performance (${GPA_TO_GRADE(expectedByLevel.honors.expectedGPA)}) suggests you could try AP/IB courses. Expect some adjustment - estimate ${GPA_TO_GRADE(expectedByLevel.honors.expectedGPA - 0.3)}.`
          : `Honors courses (${GPA_TO_GRADE(expectedByLevel.honors.expectedGPA)}) are your current sweet spot.`,
      };
    }

    // Check Regular
    if (expectedByLevel.regular && expectedByLevel.regular.expectedGPA >= targetGPA) {
      const couldStretch = expectedByLevel.regular.expectedGPA >= 3.8;
      return {
        level: couldStretch ? 'honors' : 'regular',
        expectedGPA: couldStretch
          ? expectedByLevel.regular.expectedGPA - 0.25
          : expectedByLevel.regular.expectedGPA,
        confidence: couldStretch ? 55 : expectedByLevel.regular.confidence,
        reasoning: couldStretch
          ? `Your excellent regular course performance (${GPA_TO_GRADE(expectedByLevel.regular.expectedGPA)}) suggests you could handle honors. Estimate ${GPA_TO_GRADE(expectedByLevel.regular.expectedGPA - 0.25)}.`
          : `Regular courses (${GPA_TO_GRADE(expectedByLevel.regular.expectedGPA)}) allow you to perform your best. Focus on mastery here.`,
      };
    }

    // Default
    return {
      level: 'regular',
      expectedGPA: expectedByLevel.regular?.expectedGPA || 3.0,
      confidence: 50,
      reasoning: 'Focus on building strong foundations before increasing difficulty.',
    };
  }

  private calculateConsistency(grades: number[]): number {
    if (grades.length < 3) return 50; // Not enough data

    const mean = grades.reduce((a, b) => a + b, 0) / grades.length;
    const variance = grades.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / grades.length;
    const stdDev = Math.sqrt(variance);

    // Convert to 0-100 scale (lower variance = higher consistency)
    // stdDev of 0 = 100, stdDev of 1.0 = 0
    return Math.max(0, Math.min(100, 100 - stdDev * 100));
  }

  private calculateDifficultySensitivity(
    expectedByLevel: PerformanceFingerprint['expectedGPAByLevel']
  ): { sensitivity: 'low' | 'moderate' | 'high'; detail: string } {
    const levels: { level: string; gpa: number }[] = [];
    if (expectedByLevel.ap_ib) levels.push({ level: 'AP/IB', gpa: expectedByLevel.ap_ib.expectedGPA });
    if (expectedByLevel.honors) levels.push({ level: 'Honors', gpa: expectedByLevel.honors.expectedGPA });
    if (expectedByLevel.regular) levels.push({ level: 'Regular', gpa: expectedByLevel.regular.expectedGPA });

    if (levels.length < 2) {
      return {
        sensitivity: 'moderate',
        detail: 'Not enough data across difficulty levels to assess sensitivity.',
      };
    }

    // Calculate the spread between levels
    const gpas = levels.map((l) => l.gpa);
    const spread = Math.max(...gpas) - Math.min(...gpas);

    if (spread < 0.2) {
      return {
        sensitivity: 'low',
        detail: `Your grades stay consistent (within ${(spread * 100).toFixed(0)}% of a letter grade) regardless of difficulty level. This means you can take on challenge without significantly risking your GPA.`,
      };
    } else if (spread < 0.5) {
      return {
        sensitivity: 'moderate',
        detail: `Your grades vary by about ${(spread * 100).toFixed(0)}% of a letter grade across difficulty levels. Be strategic about where you increase difficulty.`,
      };
    } else {
      return {
        sensitivity: 'high',
        detail: `Your grades vary significantly (${(spread * 100).toFixed(0)}% of a letter grade) across difficulty levels. Your GPA is sensitive to course difficulty - be selective about taking on challenge.`,
      };
    }
  }

  private calculatePerformancePercentile(
    expectedByLevel: PerformanceFingerprint['expectedGPAByLevel'],
    courseCount: number
  ): number {
    // Estimate percentile based on performance at highest difficulty level attempted
    let basePercentile = 50;

    if (expectedByLevel.ap_ib && expectedByLevel.ap_ib.sampleSize >= 2) {
      // AP/IB performance is the gold standard
      const apGPA = expectedByLevel.ap_ib.expectedGPA;
      if (apGPA >= 3.7) basePercentile = 90 + (apGPA - 3.7) * 30; // 90-99
      else if (apGPA >= 3.3) basePercentile = 75 + (apGPA - 3.3) * 37.5; // 75-90
      else if (apGPA >= 3.0) basePercentile = 60 + (apGPA - 3.0) * 50; // 60-75
      else basePercentile = 40 + (apGPA - 2.0) * 20; // 40-60
    } else if (expectedByLevel.honors && expectedByLevel.honors.sampleSize >= 2) {
      const honorsGPA = expectedByLevel.honors.expectedGPA;
      if (honorsGPA >= 3.7) basePercentile = 75 + (honorsGPA - 3.7) * 30; // 75-84
      else if (honorsGPA >= 3.3) basePercentile = 60 + (honorsGPA - 3.3) * 37.5; // 60-75
      else basePercentile = 40 + (honorsGPA - 2.5) * 25; // 40-60
    } else if (expectedByLevel.regular && expectedByLevel.regular.sampleSize >= 2) {
      const regularGPA = expectedByLevel.regular.expectedGPA;
      if (regularGPA >= 3.8) basePercentile = 60; // High regular = 60th
      else if (regularGPA >= 3.5) basePercentile = 50;
      else basePercentile = 30 + (regularGPA - 2.5) * 20;
    }

    // Adjust for data completeness
    const dataAdjustment = Math.min(courseCount * 0.5, 5);
    return Math.min(99, Math.max(1, basePercentile + dataAdjustment));
  }

  // ============================================================================
  // SUBJECT PATTERN ANALYZER
  // ============================================================================

  private analyzeSubjectPatterns(
    courses: CourseRecord[],
    fingerprint: PerformanceFingerprint
  ): SubjectPatternMap {
    const patterns: SubjectPatternMap = {};

    // Group courses by subject
    const bySubject: Record<string, CourseRecord[]> = {};
    for (const course of courses) {
      const subject = course.subject || 'other';
      if (!bySubject[subject]) bySubject[subject] = [];
      bySubject[subject].push(course);
    }

    // Calculate overall average for relative strength calculation
    const allGrades = courses
      .map((c) => this.gradeToGPA(c.grade))
      .filter((g): g is number => g !== null);
    const overallAvg = allGrades.length > 0 ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length : 3.0;

    // Analyze each subject
    for (const [subject, subjectCourses] of Object.entries(bySubject)) {
      const grades = subjectCourses
        .map((c) => ({ ...c, gpa: this.gradeToGPA(c.grade) }))
        .filter((c): c is typeof c & { gpa: number } => c.gpa !== null);

      if (grades.length === 0) continue;

      const avgGPA = grades.reduce((a, b) => a + b.gpa, 0) / grades.length;
      const sortedByYear = [...grades].sort((a, b) => {
        const yearA = typeof a.year === 'number' ? a.year : 0;
        const yearB = typeof b.year === 'number' ? b.year : 0;
        return yearA - yearB;
      });

      // Calculate trend
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (sortedByYear.length >= 2) {
        const first = sortedByYear[0].gpa;
        const last = sortedByYear[sortedByYear.length - 1].gpa;
        if (last - first > 0.2) trend = 'improving';
        else if (last - first < -0.2) trend = 'declining';
      }

      // Performance by difficulty
      const byDifficulty: SubjectPattern['byDifficulty'] = {};
      const apCourses = grades.filter((c) => this.normalizeLevel(c.level) === 'ap_ib');
      const honorsCourses = grades.filter((c) => this.normalizeLevel(c.level) === 'honors');
      const regularCourses = grades.filter((c) => this.normalizeLevel(c.level) === 'regular');

      if (apCourses.length > 0) {
        byDifficulty.ap_ib = {
          avgGPA: apCourses.reduce((a, b) => a + b.gpa, 0) / apCourses.length,
          courses: apCourses.map((c) => c.name),
        };
      }
      if (honorsCourses.length > 0) {
        byDifficulty.honors = {
          avgGPA: honorsCourses.reduce((a, b) => a + b.gpa, 0) / honorsCourses.length,
          courses: honorsCourses.map((c) => c.name),
        };
      }
      if (regularCourses.length > 0) {
        byDifficulty.regular = {
          avgGPA: regularCourses.reduce((a, b) => a + b.gpa, 0) / regularCourses.length,
          courses: regularCourses.map((c) => c.name),
        };
      }

      // Relative strength (-1 to +1)
      const relativeStrength = Math.max(-1, Math.min(1, (avgGPA - overallAvg) * 2));
      const strengthAssessment = this.assessStrength(subject, relativeStrength, avgGPA, trend);

      // Recommended level and reasoning
      const { level, reasoning } = this.recommendLevelForSubject(
        subject,
        byDifficulty,
        relativeStrength,
        trend,
        fingerprint
      );

      // Projected outcome
      const projectedOutcome = this.projectOutcome(level, byDifficulty, fingerprint);

      patterns[subject] = {
        performanceHistory: {
          avgGPA,
          trend,
          bestGrade: Math.max(...grades.map((g) => g.gpa)),
          worstGrade: Math.min(...grades.map((g) => g.gpa)),
          courses: grades.map((g) => ({
            name: g.name,
            level: g.level || 'regular',
            grade: g.gpa,
            year: typeof g.year === 'number' ? g.year : 0,
          })),
        },
        byDifficulty,
        relativeStrength,
        strengthAssessment,
        recommendedLevel: level,
        levelReasoning: reasoning,
        projectedOutcome,
      };
    }

    return patterns;
  }

  private assessStrength(
    subject: string,
    relativeStrength: number,
    avgGPA: number,
    trend: 'improving' | 'stable' | 'declining'
  ): string {
    const subjectName = this.formatSubjectName(subject);

    if (relativeStrength > 0.3) {
      return `${subjectName} is one of your strongest areas - you perform ${(relativeStrength * 50).toFixed(0)}% better here than your average.${trend === 'improving' ? ' And you\'re still improving.' : ''}`;
    } else if (relativeStrength > 0.1) {
      return `${subjectName} is a relative strength for you.${trend === 'improving' ? ' Your performance is trending upward.' : ''}`;
    } else if (relativeStrength > -0.1) {
      return `${subjectName} is in line with your overall performance.${trend === 'declining' ? ' Watch for declining trend.' : ''}`;
    } else if (relativeStrength > -0.3) {
      return `${subjectName} is slightly below your average performance.${trend === 'improving' ? ' Good news: you\'re improving here.' : ''}`;
    } else {
      return `${subjectName} is a challenge area for you - be selective about difficulty here to protect your GPA.${trend === 'improving' ? ' You are making progress though.' : ''}`;
    }
  }

  private recommendLevelForSubject(
    subject: string,
    byDifficulty: SubjectPattern['byDifficulty'],
    relativeStrength: number,
    trend: 'improving' | 'stable' | 'declining',
    fingerprint: PerformanceFingerprint
  ): { level: 'ap_ib' | 'honors' | 'regular'; reasoning: string } {
    const subjectName = this.formatSubjectName(subject);
    const isStrength = relativeStrength > 0.1;
    const isChallenge = relativeStrength < -0.1;
    const isImproving = trend === 'improving';

    // If they have AP data in this subject
    if (byDifficulty.ap_ib) {
      if (byDifficulty.ap_ib.avgGPA >= 3.5) {
        return {
          level: 'ap_ib',
          reasoning: `You've achieved ${GPA_TO_GRADE(byDifficulty.ap_ib.avgGPA)} in AP/IB ${subjectName}. Continue at this level.`,
        };
      } else if (byDifficulty.ap_ib.avgGPA >= 3.0 && isStrength) {
        return {
          level: 'ap_ib',
          reasoning: `Your ${GPA_TO_GRADE(byDifficulty.ap_ib.avgGPA)} in AP/IB ${subjectName} is solid. As a strength area, staying at AP makes sense.`,
        };
      } else {
        return {
          level: 'honors',
          reasoning: `Your AP/IB ${subjectName} performance (${GPA_TO_GRADE(byDifficulty.ap_ib.avgGPA)}) suggests honors level would better protect your GPA.`,
        };
      }
    }

    // If they have honors data
    if (byDifficulty.honors) {
      const honorsGPA = byDifficulty.honors.avgGPA;
      if (honorsGPA >= 3.7 && isStrength && isImproving) {
        return {
          level: 'ap_ib',
          reasoning: `Your strong honors ${subjectName} performance (${GPA_TO_GRADE(honorsGPA)}) combined with an improving trend suggests you could try AP/IB here.`,
        };
      } else if (honorsGPA >= 3.5) {
        return {
          level: isStrength && fingerprint.difficultySensitivity === 'low' ? 'ap_ib' : 'honors',
          reasoning:
            isStrength && fingerprint.difficultySensitivity === 'low'
              ? `${subjectName} is a strength (${GPA_TO_GRADE(honorsGPA)}) and your grades don't drop much with difficulty. Try AP/IB.`
              : `Honors ${subjectName} (${GPA_TO_GRADE(honorsGPA)}) is your sweet spot here.`,
        };
      } else {
        return {
          level: isChallenge ? 'regular' : 'honors',
          reasoning: isChallenge
            ? `${subjectName} is a challenge area. Consider regular level to protect your GPA.`
            : `Stay at honors for ${subjectName} - your ${GPA_TO_GRADE(honorsGPA)} shows you're handling it.`,
        };
      }
    }

    // Only regular data
    if (byDifficulty.regular) {
      const regularGPA = byDifficulty.regular.avgGPA;
      if (regularGPA >= 3.8 && isStrength) {
        return {
          level: 'honors',
          reasoning: `Your excellent ${subjectName} performance (${GPA_TO_GRADE(regularGPA)}) suggests you could try honors here.`,
        };
      } else if (regularGPA >= 3.5 && isImproving) {
        return {
          level: 'honors',
          reasoning: `Your ${subjectName} is improving - consider honors as a stretch next year.`,
        };
      } else {
        return {
          level: 'regular',
          reasoning: `Stay at regular ${subjectName} to maximize your grade here.`,
        };
      }
    }

    // Default
    return {
      level: 'regular',
      reasoning: `Not enough data in ${subjectName}. Start at regular and see how you do.`,
    };
  }

  private projectOutcome(
    level: 'ap_ib' | 'honors' | 'regular',
    byDifficulty: SubjectPattern['byDifficulty'],
    fingerprint: PerformanceFingerprint
  ): SubjectPattern['projectedOutcome'] {
    // Use fingerprint's expected performance at this level
    const expected = fingerprint.expectedGPAByLevel[level];

    if (expected) {
      return {
        expectedGrade: GPA_TO_GRADE(expected.expectedGPA),
        confidence: expected.confidence,
        reasoning: `Based on your overall performance at this level.`,
      };
    }

    // Estimate based on adjacent levels
    if (level === 'ap_ib' && fingerprint.expectedGPAByLevel.honors) {
      const honorsGPA = fingerprint.expectedGPAByLevel.honors.expectedGPA;
      return {
        expectedGrade: GPA_TO_GRADE(honorsGPA - 0.3),
        confidence: 55,
        reasoning: `Estimated from your honors performance with typical AP adjustment.`,
      };
    }

    if (level === 'honors' && fingerprint.expectedGPAByLevel.regular) {
      const regularGPA = fingerprint.expectedGPAByLevel.regular.expectedGPA;
      return {
        expectedGrade: GPA_TO_GRADE(regularGPA - 0.25),
        confidence: 55,
        reasoning: `Estimated from your regular performance with typical honors adjustment.`,
      };
    }

    return {
      expectedGrade: 'B+',
      confidence: 40,
      reasoning: `Estimated - not enough data for high confidence.`,
    };
  }

  // ============================================================================
  // CHALLENGE RESPONSE ANALYZER
  // ============================================================================

  private analyzeChallengeResponse(courses: CourseRecord[]): ChallengeResponseAnalysis {
    const transitions = this.findDifficultyTransitions(courses);
    const typicalImpact =
      transitions.length > 0
        ? transitions.reduce((sum, t) => sum + (t.gradeAfter - t.gradeBefore), 0) / transitions.length
        : 0;

    // Analyze adaptation speed and recovery
    const { adaptationSpeed, recoveryPattern } = this.analyzeAdaptation(transitions);

    // Calculate risk profile
    const riskProfile = this.calculateChallengeRiskProfile(transitions, typicalImpact);

    // Generate success conditions and warning indicators
    const successConditions = this.generateSuccessConditions(transitions, typicalImpact);
    const warningIndicators = this.generateWarningIndicators(transitions);

    return {
      transitionAnalysis: {
        observedTransitions: transitions,
        typicalImpact,
        adaptationSpeed,
        recoveryPattern,
      },
      challengeRiskProfile: riskProfile,
      successConditions,
      warningIndicators,
    };
  }

  private findDifficultyTransitions(courses: CourseRecord[]): DifficultyTransition[] {
    const transitions: DifficultyTransition[] = [];

    // Group by subject and year
    const bySubject: Record<string, CourseRecord[]> = {};
    for (const course of courses) {
      const subject = course.subject || 'other';
      if (!bySubject[subject]) bySubject[subject] = [];
      bySubject[subject].push(course);
    }

    for (const [subject, subjectCourses] of Object.entries(bySubject)) {
      // Sort by year
      const sorted = [...subjectCourses].sort((a, b) => {
        const yearA = typeof a.year === 'number' ? a.year : 0;
        const yearB = typeof b.year === 'number' ? b.year : 0;
        return yearA - yearB;
      });

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        const currentLevel = this.normalizeLevel(current.level);
        const nextLevel = this.normalizeLevel(next.level);

        // Check if this is a level increase
        if (this.isLevelIncrease(currentLevel, nextLevel)) {
          const gradeBefore = this.gradeToGPA(current.grade);
          const gradeAfter = this.gradeToGPA(next.grade);

          if (gradeBefore !== null && gradeAfter !== null) {
            const change = gradeAfter - gradeBefore;
            let outcome: 'thrived' | 'adapted' | 'struggled';
            if (change >= 0) outcome = 'thrived';
            else if (change >= -0.3) outcome = 'adapted';
            else outcome = 'struggled';

            transitions.push({
              subject,
              from: currentLevel,
              to: nextLevel,
              gradeBefore,
              gradeAfter,
              year: this.yearToString(next.year),
              outcome,
            });
          }
        }
      }
    }

    return transitions;
  }

  private analyzeAdaptation(
    transitions: DifficultyTransition[]
  ): { adaptationSpeed: ChallengeResponseAnalysis['transitionAnalysis']['adaptationSpeed']; recoveryPattern: ChallengeResponseAnalysis['transitionAnalysis']['recoveryPattern'] } {
    if (transitions.length === 0) {
      return { adaptationSpeed: 'unknown', recoveryPattern: 'unknown' };
    }

    const outcomes = transitions.map((t) => t.outcome);
    const thrivedOrAdapted = outcomes.filter((o) => o === 'thrived' || o === 'adapted').length;
    const ratio = thrivedOrAdapted / outcomes.length;

    let adaptationSpeed: ChallengeResponseAnalysis['transitionAnalysis']['adaptationSpeed'];
    if (ratio >= 0.8) adaptationSpeed = 'quick';
    else if (ratio >= 0.5) adaptationSpeed = 'gradual';
    else adaptationSpeed = 'slow';

    // Recovery pattern based on struggle outcomes
    const struggled = transitions.filter((t) => t.outcome === 'struggled');
    let recoveryPattern: ChallengeResponseAnalysis['transitionAnalysis']['recoveryPattern'] = 'unknown';

    if (struggled.length === 0) {
      recoveryPattern = 'full_recovery'; // Never struggled
    } else {
      const avgStruggledDrop = struggled.reduce((sum, t) => sum + (t.gradeAfter - t.gradeBefore), 0) / struggled.length;
      if (Math.abs(avgStruggledDrop) < 0.3) recoveryPattern = 'full_recovery';
      else if (Math.abs(avgStruggledDrop) < 0.5) recoveryPattern = 'partial_recovery';
      else recoveryPattern = 'persistent_impact';
    }

    return { adaptationSpeed, recoveryPattern };
  }

  private calculateChallengeRiskProfile(
    transitions: DifficultyTransition[],
    typicalImpact: number
  ): ChallengeResponseAnalysis['challengeRiskProfile'] {
    const riskFactors: string[] = [];
    const protectiveFactors: string[] = [];

    // Calculate base risk level (0-100)
    let riskLevel = 50;

    if (transitions.length === 0) {
      riskLevel = 50;
      riskFactors.push('No data on how you respond to difficulty increases');
    } else {
      const struggleRate = transitions.filter((t) => t.outcome === 'struggled').length / transitions.length;
      riskLevel = struggleRate * 100;

      if (struggleRate > 0.5) {
        riskFactors.push('History of struggling when difficulty increases');
      }
      if (typicalImpact < -0.4) {
        riskFactors.push('Significant grade drops when moving up difficulty levels');
        riskLevel += 15;
      }
      if (typicalImpact >= 0) {
        protectiveFactors.push('Grades typically maintain or improve with increased difficulty');
        riskLevel -= 20;
      }
      if (transitions.filter((t) => t.outcome === 'thrived').length > transitions.length / 2) {
        protectiveFactors.push('Often thrives under increased challenge');
        riskLevel -= 15;
      }
    }

    riskLevel = Math.max(10, Math.min(90, riskLevel));

    const recommendation =
      riskLevel < 30
        ? 'You can take on additional challenge with confidence.'
        : riskLevel < 50
          ? 'Be selective about where you increase difficulty - focus on your strengths.'
          : riskLevel < 70
            ? 'Approach difficulty increases cautiously - one at a time, in your best subjects.'
            : 'Prioritize GPA protection over difficulty labels. Increase challenge only in your strongest areas.';

    return { riskLevel, riskFactors, protectiveFactors, recommendation };
  }

  private generateSuccessConditions(
    transitions: DifficultyTransition[],
    typicalImpact: number
  ): string[] {
    const conditions: string[] = [];

    if (transitions.length === 0) {
      conditions.push('Start with one new challenging course to understand your adaptation pattern');
      conditions.push('Choose a subject where you have strong foundational performance');
      conditions.push('Have support systems in place (tutoring, study groups)');
    } else {
      const strongSubjects = transitions.filter((t) => t.outcome === 'thrived').map((t) => t.subject);
      if (strongSubjects.length > 0) {
        conditions.push(`Increase difficulty in subjects where you've succeeded: ${[...new Set(strongSubjects)].join(', ')}`);
      }

      if (typicalImpact >= -0.2) {
        conditions.push('Your track record supports taking on more challenge');
      } else {
        conditions.push('Only increase difficulty in one subject at a time');
        conditions.push('Maintain strong study habits and seek help early');
      }
    }

    conditions.push('Monitor grades weekly and adjust early if needed');
    conditions.push('Balance challenging courses with courses where you can succeed comfortably');

    return conditions;
  }

  private generateWarningIndicators(transitions: DifficultyTransition[]): string[] {
    const warnings = [
      'Grade dropping below B in any course',
      'Falling behind on assignments consistently',
      'Feeling overwhelmed or losing sleep regularly',
    ];

    const struggledSubjects = transitions.filter((t) => t.outcome === 'struggled').map((t) => t.subject);
    if (struggledSubjects.length > 0) {
      warnings.push(`Past difficulty in: ${[...new Set(struggledSubjects)].join(', ')} - be cautious here`);
    }

    return warnings;
  }

  // ============================================================================
  // PROGRESSION TRAJECTORY BUILDER
  // ============================================================================

  private buildProgressionTrajectory(
    courses: CourseRecord[],
    gradeHistory?: { [year: string]: { gpa: number; courses: number } }
  ): ProgressionTrajectory {
    // Build historical data
    const gpaByYear = this.calculateGPAByYear(courses, gradeHistory);

    // Analyze trend
    const { trend, strength } = this.analyzeTrend(gpaByYear);

    // Find inflection points
    const inflectionPoints = this.findInflectionPoints(gpaByYear);

    // Project future
    const projected = this.projectFuture(gpaByYear, trend, strength);

    // Identify trajectory levers
    const trajectoryLevers = this.identifyTrajectoryLevers(trend, gpaByYear, courses);

    return {
      historical: {
        gpaByYear,
        overallTrend: trend,
        trendStrength: strength,
        inflectionPoints,
      },
      projected,
      trajectoryLevers,
    };
  }

  private calculateGPAByYear(
    courses: CourseRecord[],
    gradeHistory?: { [year: string]: { gpa: number; courses: number } }
  ): ProgressionTrajectory['historical']['gpaByYear'] {
    const result: ProgressionTrajectory['historical']['gpaByYear'] = [];

    // Use grade history if available
    if (gradeHistory) {
      const years = ['freshman', 'sophomore', 'junior', 'senior'];
      for (const year of years) {
        if (gradeHistory[year]) {
          result.push({
            year: this.capitalizeFirst(year),
            gpa: gradeHistory[year].gpa,
            rigorLevel: this.calculateRigorLevel(courses, year),
          });
        }
      }
    } else {
      // Calculate from courses
      const byYear: Record<number, { grades: number[]; rigor: number[] }> = {};
      for (const course of courses) {
        const year = typeof course.year === 'number' ? course.year : 0;
        const gpa = this.gradeToGPA(course.grade);
        if (gpa === null) continue;

        if (!byYear[year]) byYear[year] = { grades: [], rigor: [] };
        byYear[year].grades.push(gpa);
        byYear[year].rigor.push(this.levelToRigorScore(course.level));
      }

      for (const [year, data] of Object.entries(byYear)) {
        result.push({
          year: this.yearToString(parseInt(year)),
          gpa: data.grades.reduce((a, b) => a + b, 0) / data.grades.length,
          rigorLevel: data.rigor.reduce((a, b) => a + b, 0) / data.rigor.length,
        });
      }
    }

    return result.sort((a, b) => this.yearOrder(a.year) - this.yearOrder(b.year));
  }

  private analyzeTrend(
    gpaByYear: ProgressionTrajectory['historical']['gpaByYear']
  ): { trend: ProgressionTrajectory['historical']['overallTrend']; strength: number } {
    if (gpaByYear.length < 2) {
      return { trend: 'stable', strength: 0 };
    }

    const changes: number[] = [];
    for (let i = 1; i < gpaByYear.length; i++) {
      changes.push(gpaByYear[i].gpa - gpaByYear[i - 1].gpa);
    }

    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    const allPositive = changes.every((c) => c > 0);
    const allNegative = changes.every((c) => c < 0);
    const recentChange = changes[changes.length - 1];

    let trend: ProgressionTrajectory['historical']['overallTrend'];
    let strength: number;

    if (allPositive && recentChange > avgChange) {
      trend = 'accelerating';
      strength = Math.min(avgChange * 200, 100);
    } else if (avgChange > 0.05) {
      trend = 'improving';
      strength = Math.min(avgChange * 150, 80);
    } else if (avgChange < -0.05) {
      trend = 'declining';
      strength = Math.min(Math.abs(avgChange) * 150, 80);
    } else if (Math.abs(recentChange) < 0.05 && gpaByYear[gpaByYear.length - 1].gpa > 3.5) {
      trend = 'plateauing';
      strength = 30;
    } else {
      trend = 'stable';
      strength = 10;
    }

    return { trend, strength };
  }

  private findInflectionPoints(
    gpaByYear: ProgressionTrajectory['historical']['gpaByYear']
  ): InflectionPoint[] {
    const points: InflectionPoint[] = [];

    for (let i = 1; i < gpaByYear.length; i++) {
      const prev = gpaByYear[i - 1];
      const curr = gpaByYear[i];
      const change = curr.gpa - prev.gpa;

      if (Math.abs(change) > 0.15) {
        points.push({
          year: curr.year,
          event: change > 0 ? 'Significant improvement' : 'Significant decline',
          impact: change > 0 ? 'positive' : 'negative',
          description:
            change > 0
              ? `GPA improved by ${(change * 100).toFixed(0)}% of a letter grade`
              : `GPA dropped by ${(Math.abs(change) * 100).toFixed(0)}% of a letter grade`,
        });
      }

      // Check for rigor change
      if (curr.rigorLevel - prev.rigorLevel > 1) {
        points.push({
          year: curr.year,
          event: 'Major rigor increase',
          impact: change >= -0.1 ? 'positive' : 'negative',
          description:
            change >= -0.1
              ? 'Successfully handled increased difficulty'
              : 'Grades impacted by difficulty increase',
        });
      }
    }

    return points;
  }

  private projectFuture(
    gpaByYear: ProgressionTrajectory['historical']['gpaByYear'],
    trend: ProgressionTrajectory['historical']['overallTrend'],
    trendStrength: number
  ): ProgressionTrajectory['projected'] {
    if (gpaByYear.length === 0) {
      return {
        nextYearGPA: { expected: 3.5, range: { low: 3.0, high: 4.0 } },
        ceilingEstimate: 4.0,
        trajectory: 'stable',
        confidence: 30,
      };
    }

    const lastGPA = gpaByYear[gpaByYear.length - 1].gpa;
    const peakGPA = Math.max(...gpaByYear.map((y) => y.gpa));

    // Calculate projected next year
    let expectedNext = lastGPA;
    if (trend === 'accelerating' || trend === 'improving') {
      expectedNext = Math.min(4.0, lastGPA + 0.1);
    } else if (trend === 'declining') {
      expectedNext = Math.max(2.0, lastGPA - 0.1);
    }

    // Estimate ceiling
    let ceilingEstimate = peakGPA;
    if (trend === 'accelerating') {
      ceilingEstimate = Math.min(4.0, peakGPA + 0.15);
    } else if (lastGPA >= peakGPA - 0.05) {
      ceilingEstimate = Math.min(4.0, peakGPA + 0.1);
    }

    // Determine trajectory label
    let trajectory: ProgressionTrajectory['projected']['trajectory'];
    if (lastGPA >= 3.9 && trend !== 'declining') {
      trajectory = 'at_ceiling';
    } else if (trend === 'accelerating' || trend === 'improving') {
      trajectory = 'upward';
    } else if (trend === 'declining') {
      trajectory = 'declining';
    } else {
      trajectory = 'stable';
    }

    return {
      nextYearGPA: {
        expected: expectedNext,
        range: { low: Math.max(2.0, expectedNext - 0.2), high: Math.min(4.0, expectedNext + 0.15) },
      },
      ceilingEstimate,
      trajectory,
      confidence: Math.min(gpaByYear.length * 20 + trendStrength / 2, 85),
    };
  }

  private identifyTrajectoryLevers(
    trend: ProgressionTrajectory['historical']['overallTrend'],
    gpaByYear: ProgressionTrajectory['historical']['gpaByYear'],
    courses: CourseRecord[]
  ): TrajectoryLever[] {
    const levers: TrajectoryLever[] = [];

    if (trend === 'declining' || trend === 'stable') {
      levers.push({
        lever: 'Reduce course difficulty in weaker subjects',
        impact: 'positive',
        magnitude: 'moderate',
        description: 'Taking appropriate difficulty levels improves GPA without sacrificing learning',
      });
    }

    if (trend === 'accelerating' || trend === 'improving') {
      levers.push({
        lever: 'Maintain current approach',
        impact: 'positive',
        magnitude: 'moderate',
        description: 'Your current strategy is working - continue it',
      });
    }

    // Check for rigor opportunities
    const latestYear = gpaByYear[gpaByYear.length - 1];
    if (latestYear && latestYear.gpa >= 3.7 && latestYear.rigorLevel < 2) {
      levers.push({
        lever: 'Strategic rigor increase in strength areas',
        impact: 'positive',
        magnitude: 'small',
        description: 'Your strong grades suggest you could handle more challenge in select subjects',
      });
    }

    // General levers
    levers.push({
      lever: 'Focus on junior year performance',
      impact: 'positive',
      magnitude: 'significant',
      description: 'Junior year carries the most weight (35%) - make it your best year',
    });

    levers.push({
      lever: 'Avoid senior year decline',
      impact: 'negative',
      magnitude: 'significant',
      description: '22% of college rescissions cite senior grade drops - maintain effort',
    });

    return levers;
  }

  // ============================================================================
  // PERFORMANCE ENVELOPE CALCULATOR
  // ============================================================================

  private calculatePerformanceEnvelope(
    courses: CourseRecord[],
    fingerprint: PerformanceFingerprint,
    challengeResponse: ChallengeResponseAnalysis
  ): PerformanceEnvelope {
    const grades = courses
      .map((c) => this.gradeToGPA(c.grade))
      .filter((g): g is number => g !== null);

    if (grades.length === 0) {
      return {
        ceiling: { gpa: 4.0, conditions: 'Unknown', isRepeatable: false, howToReach: 'Build more academic history' },
        floor: { gpa: 2.0, conditions: 'Unknown', warningSignsThatPrecedeIt: [], howToAvoid: 'Maintain consistent effort' },
        comfortableRange: { low: 3.0, high: 3.5, typicalGPA: 3.25, description: 'Estimated range' },
        optimalTarget: { gpa: 3.5, reasoning: 'Aim for solid performance', tradeoffs: 'Unknown without more data' },
      };
    }

    const maxGrade = Math.max(...grades);
    const minGrade = Math.min(...grades);
    const avgGrade = grades.reduce((a, b) => a + b, 0) / grades.length;

    // Find conditions for ceiling
    const ceilingCourse = courses.find((c) => this.gradeToGPA(c.grade) === maxGrade);
    const ceilingConditions = ceilingCourse
      ? `Achieved in ${ceilingCourse.name} (${ceilingCourse.level || 'regular'})`
      : 'Best performance observed';

    // Find conditions for floor
    const floorCourse = courses.find((c) => this.gradeToGPA(c.grade) === minGrade);
    const floorConditions = floorCourse
      ? `Occurred in ${floorCourse.name} (${floorCourse.level || 'regular'})`
      : 'Lowest performance observed';

    // Comfortable range
    const sortedGrades = [...grades].sort((a, b) => a - b);
    const p25 = sortedGrades[Math.floor(sortedGrades.length * 0.25)];
    const p75 = sortedGrades[Math.floor(sortedGrades.length * 0.75)];

    // Optimal target
    const sweetSpotGPA = fingerprint.sweetSpot.expectedGPA;
    const optimalTarget = Math.min(4.0, (sweetSpotGPA + avgGrade + maxGrade) / 3);

    return {
      ceiling: {
        gpa: maxGrade,
        conditions: ceilingConditions,
        isRepeatable: fingerprint.consistencyScore > 70,
        howToReach: `Focus on your strengths and maintain consistent effort. Your ceiling is achievable when ${ceilingConditions.toLowerCase()}.`,
      },
      floor: {
        gpa: minGrade,
        conditions: floorConditions,
        warningSignsThatPrecedeIt: challengeResponse.warningIndicators,
        howToAvoid: 'Monitor grades weekly, seek help early, and don\'t overload your schedule.',
      },
      comfortableRange: {
        low: p25,
        high: p75,
        typicalGPA: avgGrade,
        description: `You typically perform between ${GPA_TO_GRADE(p25)} and ${GPA_TO_GRADE(p75)}. Your average is ${GPA_TO_GRADE(avgGrade)}.`,
      },
      optimalTarget: {
        gpa: optimalTarget,
        reasoning: `Based on your sweet spot (${GPA_TO_GRADE(sweetSpotGPA)}) and demonstrated range, aim for ${GPA_TO_GRADE(optimalTarget)}.`,
        tradeoffs:
          fingerprint.difficultySensitivity === 'high'
            ? 'Achieving this may require staying at moderate difficulty levels.'
            : 'You have flexibility in difficulty selection while maintaining this target.',
      },
    };
  }

  // ============================================================================
  // SYNTHESIS
  // ============================================================================

  private synthesize(
    fingerprint: PerformanceFingerprint,
    subjectPatterns: SubjectPatternMap,
    challengeResponse: ChallengeResponseAnalysis,
    trajectory: ProgressionTrajectory,
    envelope: PerformanceEnvelope
  ): CapabilitySynthesis {
    // Build profile summary
    const profileSummary = this.buildProfileSummary(fingerprint, trajectory, envelope);

    // Extract strengths
    const strengths = this.extractStrengths(fingerprint, subjectPatterns, challengeResponse);

    // Extract challenges
    const challenges = this.extractChallenges(fingerprint, subjectPatterns, challengeResponse);

    // Core insight
    const coreInsight = this.generateCoreInsight(fingerprint, challengeResponse, trajectory);

    // Unique pattern
    const uniquePattern = this.identifyUniquePattern(fingerprint, subjectPatterns, trajectory);

    return {
      profileSummary,
      strengths,
      challenges,
      coreInsight,
      uniquePattern,
    };
  }

  private buildProfileSummary(
    fingerprint: PerformanceFingerprint,
    trajectory: ProgressionTrajectory,
    envelope: PerformanceEnvelope
  ): string {
    const sweetSpot = fingerprint.sweetSpot;
    const trendDesc = trajectory.historical.overallTrend;
    const sensitivity = fingerprint.difficultySensitivity;

    let summary = `Your optimal difficulty level is ${this.formatLevel(sweetSpot.level)} courses, where you can expect ${GPA_TO_GRADE(sweetSpot.expectedGPA)} grades. `;

    if (trendDesc === 'accelerating' || trendDesc === 'improving') {
      summary += `Your performance has been improving over time, which is excellent. `;
    } else if (trendDesc === 'declining') {
      summary += `Your recent trend shows some decline - focusing on fundamentals may help. `;
    } else {
      summary += `Your performance has been consistent. `;
    }

    if (sensitivity === 'low') {
      summary += `Your grades are stable across difficulty levels, giving you flexibility in course selection.`;
    } else if (sensitivity === 'high') {
      summary += `Your grades are sensitive to difficulty level - be strategic about where you increase challenge.`;
    } else {
      summary += `Be thoughtful about difficulty selection to maximize your outcomes.`;
    }

    return summary;
  }

  private extractStrengths(
    fingerprint: PerformanceFingerprint,
    subjectPatterns: SubjectPatternMap,
    challengeResponse: ChallengeResponseAnalysis
  ): SynthesisInsight[] {
    const strengths: SynthesisInsight[] = [];

    // Consistency
    if (fingerprint.consistencyScore > 70) {
      strengths.push({
        insight: 'Consistent performance',
        evidence: `Your grades stay within a predictable range (${fingerprint.consistencyScore.toFixed(0)}% consistency)`,
        implication: 'You can confidently predict your outcomes, which helps with course planning',
      });
    }

    // Low difficulty sensitivity
    if (fingerprint.difficultySensitivity === 'low') {
      strengths.push({
        insight: 'Resilient to difficulty increases',
        evidence: fingerprint.difficultySensitivityDetail,
        implication: 'You can take on challenge without significantly risking your GPA',
      });
    }

    // Subject strengths
    for (const [subject, pattern] of Object.entries(subjectPatterns)) {
      if (pattern.relativeStrength > 0.2) {
        strengths.push({
          insight: `Strong in ${this.formatSubjectName(subject)}`,
          evidence: pattern.strengthAssessment,
          implication: `You can push yourself here - consider ${pattern.recommendedLevel.toUpperCase()} level`,
        });
      }
    }

    // Challenge response
    if (challengeResponse.transitionAnalysis.observedTransitions.length > 0) {
      const thrived = challengeResponse.transitionAnalysis.observedTransitions.filter((t) => t.outcome === 'thrived');
      if (thrived.length > 0) {
        strengths.push({
          insight: 'Thrives under increased challenge',
          evidence: `Successfully handled difficulty increases in ${thrived.map((t) => t.subject).join(', ')}`,
          implication: 'Your track record supports taking on more challenge in your strength areas',
        });
      }
    }

    return strengths;
  }

  private extractChallenges(
    fingerprint: PerformanceFingerprint,
    subjectPatterns: SubjectPatternMap,
    challengeResponse: ChallengeResponseAnalysis
  ): SynthesisInsight[] {
    const challenges: SynthesisInsight[] = [];

    // High difficulty sensitivity
    if (fingerprint.difficultySensitivity === 'high') {
      challenges.push({
        insight: 'Grades sensitive to difficulty level',
        evidence: fingerprint.difficultySensitivityDetail,
        implication: 'Prioritize appropriate difficulty selection to protect your GPA',
      });
    }

    // Subject challenges
    for (const [subject, pattern] of Object.entries(subjectPatterns)) {
      if (pattern.relativeStrength < -0.2) {
        challenges.push({
          insight: `Challenge area: ${this.formatSubjectName(subject)}`,
          evidence: pattern.strengthAssessment,
          implication: pattern.levelReasoning,
        });
      }
    }

    // Past struggles
    const struggled = challengeResponse.transitionAnalysis.observedTransitions.filter((t) => t.outcome === 'struggled');
    if (struggled.length > 0) {
      challenges.push({
        insight: 'Past difficulty with level transitions',
        evidence: `Struggled when increasing difficulty in ${[...new Set(struggled.map((t) => t.subject))].join(', ')}`,
        implication: 'Be cautious about increasing difficulty in these subjects',
      });
    }

    return challenges;
  }

  private generateCoreInsight(
    fingerprint: PerformanceFingerprint,
    challengeResponse: ChallengeResponseAnalysis,
    trajectory: ProgressionTrajectory
  ): string {
    const level = fingerprint.sweetSpot.level;
    const expectedGrade = GPA_TO_GRADE(fingerprint.sweetSpot.expectedGPA);
    const risk = challengeResponse.challengeRiskProfile.riskLevel;

    if (risk < 30 && trajectory.historical.overallTrend !== 'declining') {
      return `You can confidently push yourself - your track record shows you handle challenge well while maintaining strong grades (${expectedGrade} at ${this.formatLevel(level)} level).`;
    } else if (risk > 60) {
      return `Your GPA is your priority - focus on courses at the ${this.formatLevel(level)} level where you can achieve ${expectedGrade}. Being strategic about difficulty is smarter than overloading.`;
    } else {
      return `Balance challenge with success - your sweet spot is ${this.formatLevel(level)} courses (${expectedGrade}). Push yourself in your strengths, protect your GPA elsewhere.`;
    }
  }

  private identifyUniquePattern(
    fingerprint: PerformanceFingerprint,
    subjectPatterns: SubjectPatternMap,
    trajectory: ProgressionTrajectory
  ): string {
    const patterns: string[] = [];

    // Check for "starts slow, finishes strong"
    if (trajectory.historical.overallTrend === 'accelerating' || trajectory.historical.overallTrend === 'improving') {
      patterns.push('your upward trajectory');
    }

    // Check for specific subject patterns
    const strongSubjects = Object.entries(subjectPatterns)
      .filter(([_, p]) => p.relativeStrength > 0.2)
      .map(([s]) => this.formatSubjectName(s));

    if (strongSubjects.length > 0) {
      patterns.push(`particular strength in ${strongSubjects.join(' and ')}`);
    }

    // Check for consistency pattern
    if (fingerprint.consistencyScore > 80) {
      patterns.push('remarkable consistency across your courses');
    }

    // Check for difficulty resilience
    if (fingerprint.difficultySensitivity === 'low') {
      patterns.push('ability to maintain grades regardless of difficulty level');
    }

    if (patterns.length === 0) {
      return 'You have a balanced academic profile - focus on strategic course selection to maximize your outcomes.';
    }

    return `What makes you unique: ${patterns.join(', ')}. These are patterns to build on.`;
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  private gradeToGPA(grade: string | undefined): number | null {
    if (!grade) return null;
    return GRADE_TO_GPA[grade.toUpperCase().trim()] ?? null;
  }

  private normalizeLevel(level: string | undefined): 'ap_ib' | 'honors' | 'regular' {
    if (!level) return 'regular';
    const lower = level.toLowerCase();
    if (lower.includes('ap') || lower.includes('ib')) return 'ap_ib';
    if (lower.includes('honors') || lower.includes('advanced')) return 'honors';
    return 'regular';
  }

  private isLevelIncrease(from: string, to: string): boolean {
    const levels = ['regular', 'honors', 'ap_ib'];
    return levels.indexOf(to) > levels.indexOf(from);
  }

  private formatLevel(level: 'ap_ib' | 'honors' | 'regular'): string {
    if (level === 'ap_ib') return 'AP/IB';
    if (level === 'honors') return 'Honors';
    return 'Regular';
  }

  private formatSubjectName(subject: string): string {
    const names: Record<string, string> = {
      math: 'Mathematics',
      science: 'Science',
      english: 'English',
      social_studies: 'Social Studies',
      foreign_language: 'Foreign Language',
      arts: 'Arts',
      computer_science: 'Computer Science',
      other: 'Other',
    };
    return names[subject] || subject;
  }

  private yearToString(year: number | string): string {
    if (typeof year === 'string') return year;
    if (year === 9) return 'Freshman';
    if (year === 10) return 'Sophomore';
    if (year === 11) return 'Junior';
    if (year === 12) return 'Senior';
    return `Year ${year}`;
  }

  private yearOrder(year: string): number {
    const lower = year.toLowerCase();
    if (lower.includes('fresh') || lower.includes('9')) return 9;
    if (lower.includes('soph') || lower.includes('10')) return 10;
    if (lower.includes('jun') || lower.includes('11')) return 11;
    if (lower.includes('sen') || lower.includes('12')) return 12;
    return 0;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private calculateRigorLevel(courses: CourseRecord[], year: string): number {
    const yearCourses = courses.filter((c) => {
      const courseYear = typeof c.year === 'number' ? this.yearToString(c.year) : c.year;
      return courseYear.toLowerCase().includes(year.toLowerCase());
    });

    if (yearCourses.length === 0) return 1;
    const rigorScores = yearCourses.map((c) => this.levelToRigorScore(c.level));
    return rigorScores.reduce((a, b) => a + b, 0) / rigorScores.length;
  }

  private levelToRigorScore(level: string | undefined): number {
    const normalized = this.normalizeLevel(level);
    if (normalized === 'ap_ib') return 3;
    if (normalized === 'honors') return 2;
    return 1;
  }
}

// ============================================================================
// SINGLETON & CONVENIENCE EXPORT
// ============================================================================

export const nuancedCapabilityAnalyzer = new NuancedCapabilityAnalyzer();

export function analyzeCapabilityNuanced(
  courses: CourseRecord[],
  gradeHistory?: { [year: string]: { gpa: number; courses: number } }
): NuancedCapabilityAnalysis {
  return nuancedCapabilityAnalyzer.analyze(courses, gradeHistory);
}
