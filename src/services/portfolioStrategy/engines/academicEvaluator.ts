/**
 * Academic Evaluation Engine
 *
 * Comprehensive assessment of student academic profile including:
 * - GPA strength relative to elite school benchmarks
 * - Course rigor evaluation with context adjustment
 * - Standardized testing analysis with submission recommendations
 * - Grade trend analysis
 * - Class rank positioning
 * - School-specific fit assessment
 *
 * DATA SOURCES: academicStandards.ts (from Perplexity Deep Research)
 * QUALITY PRINCIPLE: Context-adjusted evaluation with transparent scoring
 */

import {
  AcademicInputData,
  AcademicEvaluation,
  AcademicTier,
  GPAStrengthAssessment,
  CourseRigorAssessment,
  TestingStrengthAssessment,
  GradeTrendAnalysis,
  ClassRankAnalysis,
  SchoolAcademicFit,
  CourseRigorLevel,
  GradeTrend,
  CourseEntry,
} from '../types';

import {
  GPA_THRESHOLDS,
  COURSE_RIGOR_EXPECTATIONS,
  SAT_SCORE_RANGES,
  ACT_SCORE_RANGES,
  TEST_SCORE_EVALUATION,
  TEST_OPTIONAL_GUIDANCE,
  GRADE_TREND_EVALUATION,
  ADMISSIONS_MODEL,
  evaluateGPATier,
  evaluateRigorTier,
  evaluateTestScoreTier,
  shouldSubmitTestScores,
} from '../data/academicStandards';

import { COLLEGE_PROFILES, getCollegeProfile } from '../data/collegeAdmissionsData';

import {
  calculateWeightedScore,
  calculateTier,
  calculateConfidence,
  applyContextAdjustments,
  calculatePercentile,
  generateInputHash,
  TierLabel,
  ContextAdjustment,
} from '../utils';

// ============================================================================
// ACADEMIC EVALUATOR CLASS
// ============================================================================

export class AcademicEvaluator {
  private version = '1.0.0';

  /**
   * Perform complete academic evaluation
   */
  async evaluate(input: AcademicInputData, targetSchools?: string[]): Promise<AcademicEvaluation> {
    // Evaluate each component
    const gpaStrength = this.evaluateGPA(input);
    const courseRigor = this.evaluateCourseRigor(input);
    const testingStrength = this.evaluateTestScores(input, targetSchools);
    const gradeTrend = this.analyzeGradeTrend(input);
    const classRank = this.analyzeClassRank(input);

    // Calculate overall score using weighted components
    const overallResult = calculateWeightedScore([
      { name: 'GPA', score: gpaStrength.score, weight: 35 },
      { name: 'Course Rigor', score: courseRigor.score, weight: 30 },
      { name: 'Testing', score: testingStrength.score, weight: 25 },
      { name: 'Trend', score: this.trendToScore(gradeTrend.direction), weight: 10 },
    ]);

    // Apply context adjustments based on school resources
    const contextAdjustments = this.calculateContextAdjustments(input);
    const { adjustedScore } = applyContextAdjustments(overallResult.finalScore, contextAdjustments);

    // Calculate school-specific fit
    const schoolFit = this.calculateSchoolFit(input, targetSchools || []);

    // Generate synthesized narrative
    const academicNarrative = this.generateAcademicNarrative(
      gpaStrength,
      courseRigor,
      testingStrength,
      gradeTrend
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      gpaStrength,
      courseRigor,
      testingStrength,
      gradeTrend,
      input
    );

    // Calculate confidence
    const confidence = calculateConfidence({
      dataCompleteness: this.calculateDataCompleteness(input),
      dataQuality: 0.9, // Assume high quality for structured input
    });

    return {
      evaluatedAt: new Date().toISOString(),
      version: this.version,
      overallScore: adjustedScore,
      overallTier: this.scoreToTier(adjustedScore),
      overallNarrative: this.generateOverallNarrative(adjustedScore, academicNarrative),
      gpaStrength,
      courseRigor,
      testingStrength,
      gradeTrend,
      classRank,
      schoolFit,
      academicNarrative,
      recommendations,
      inputDataHash: generateInputHash(input),
      confidenceScore: confidence,
    };
  }

  // ============================================================================
  // GPA EVALUATION
  // ============================================================================

  private evaluateGPA(input: AcademicInputData): GPAStrengthAssessment {
    const { gpa, schoolContext } = input;

    // Normalize to 4.0 scale for comparison
    const unweightedEquivalent = this.normalizeGPATo4Scale(gpa.value, gpa.scale, gpa.isWeighted);

    // Evaluate against thresholds
    const gpaTier = evaluateGPATier(unweightedEquivalent);

    // Calculate raw score based on tier
    let baseScore: number;
    switch (gpaTier) {
      case 'exceptional':
        baseScore = 95;
        break;
      case 'strong':
        baseScore = 82;
        break;
      case 'competitive':
        baseScore = 68;
        break;
      case 'belowThreshold':
        baseScore = 45;
        break;
      case 'unlikely':
        baseScore = 25;
        break;
      default:
        baseScore = 50;
    }

    // Context adjustment for school difficulty
    let schoolContextAdjustment = 0;
    if (schoolContext.isCompetitive) {
      schoolContextAdjustment = 5; // Known competitive school gets boost
    }
    if (schoolContext.type === 'magnet') {
      schoolContextAdjustment += 3;
    }

    const adjustedScore = Math.min(100, baseScore + schoolContextAdjustment);

    // Generate context and benchmarks
    const tier = this.scoreToTier(adjustedScore);
    const context = this.generateGPAContext(unweightedEquivalent, gpaTier, schoolContext);
    const benchmarkComparison = this.generateGPABenchmark(unweightedEquivalent);

    // Identify strengths and concerns
    const strengths: string[] = [];
    const concerns: string[] = [];

    if (unweightedEquivalent >= 3.95) {
      strengths.push('GPA meets or exceeds the median at T20 institutions');
    }
    if (unweightedEquivalent >= 3.75) {
      strengths.push('GPA above the effective floor for elite admissions (3.75)');
    }
    if (schoolContext.isCompetitive && unweightedEquivalent >= 3.8) {
      strengths.push('Strong performance at a competitive high school');
    }

    if (unweightedEquivalent < 3.75) {
      concerns.push('GPA below the typical floor for T20 admission (3.75 unweighted)');
    }
    if (unweightedEquivalent < 3.6) {
      concerns.push('Significant GPA gap requires exceptional circumstances or achievements to overcome');
    }

    return {
      score: adjustedScore,
      tier,
      unweightedEquivalent,
      weightedEquivalent: gpa.isWeighted ? gpa.value : undefined,
      context,
      benchmarkComparison,
      schoolContextAdjustment,
      strengths,
      concerns,
    };
  }

  private normalizeGPATo4Scale(value: number, scale: string, isWeighted: boolean): number {
    let normalized: number;

    switch (scale) {
      case '4.0':
        normalized = value;
        break;
      case '5.0':
        // Weighted 5.0 scale - adjust to unweighted
        normalized = isWeighted ? Math.min(4.0, (value / 5.0) * 4.0 + 0.3) : (value / 5.0) * 4.0;
        break;
      case '6.0':
        normalized = (value / 6.0) * 4.0;
        break;
      case '100':
        // Percentage scale
        if (value >= 97) normalized = 4.0;
        else if (value >= 93) normalized = 3.9;
        else if (value >= 90) normalized = 3.7;
        else if (value >= 87) normalized = 3.5;
        else if (value >= 83) normalized = 3.3;
        else if (value >= 80) normalized = 3.0;
        else normalized = (value / 100) * 4.0;
        break;
      default:
        normalized = Math.min(4.0, value);
    }

    // If weighted on 4.0+ scale, estimate unweighted
    if (isWeighted && scale === '4.0' && value > 4.0) {
      // Rough estimate: weighted 4.5 ≈ unweighted 3.9
      normalized = Math.min(4.0, 3.5 + (value - 4.0) * 0.8);
    }

    return Math.round(normalized * 100) / 100;
  }

  private generateGPAContext(gpa: number, tier: string, schoolContext: { isCompetitive: boolean; type: string }): string {
    const tierDescriptions: Record<string, string> = {
      exceptional: `A ${gpa.toFixed(2)} GPA places you among the strongest academic candidates. ${GPA_THRESHOLDS.exceptional.notes}`,
      strong: `A ${gpa.toFixed(2)} GPA is solidly competitive at T20 institutions. ${GPA_THRESHOLDS.strong.notes}`,
      competitive: `A ${gpa.toFixed(2)} GPA meets the effective floor for elite admissions. ${GPA_THRESHOLDS.competitive.notes}`,
      belowThreshold: `A ${gpa.toFixed(2)} GPA is below the typical threshold for T20 admission. ${GPA_THRESHOLDS.belowThreshold.notes}`,
      unlikely: `A ${gpa.toFixed(2)} GPA presents significant challenges for T20 admission without exceptional circumstances.`,
    };

    let context = tierDescriptions[tier] || `A ${gpa.toFixed(2)} GPA on a 4.0 scale.`;

    if (schoolContext.isCompetitive) {
      context += ' Your competitive high school context adds value to this GPA.';
    }

    return context;
  }

  private generateGPABenchmark(gpa: number): string {
    if (gpa >= 4.0) {
      return 'At or above 75th percentile at Harvard (74% of admits have 4.0 GPA)';
    }
    if (gpa >= 3.95) {
      return 'Near the median at T5 institutions';
    }
    if (gpa >= 3.85) {
      return 'Between 50th and 75th percentile at most T20 schools';
    }
    if (gpa >= 3.75) {
      return 'Near the 25th percentile at T20 - competitive but not a strength';
    }
    return 'Below 25th percentile at T20 institutions';
  }

  // ============================================================================
  // COURSE RIGOR EVALUATION
  // ============================================================================

  private evaluateCourseRigor(input: AcademicInputData): CourseRigorAssessment {
    const { courseHistory, schoolContext } = input;

    // Count course types
    const counts = this.countCourseTypes(courseHistory);
    const totalAdvanced = counts.ap + counts.ib + counts.honors + counts.dualEnrollment;

    // Determine max available based on school context
    const maxAvailable = schoolContext.apCoursesOffered || (schoolContext.ibProgram ? 15 : 20);

    // Calculate utilization rate
    const utilizationRate = maxAvailable > 0 ? (totalAdvanced / maxAvailable) * 100 : 0;

    // Evaluate rigor tier
    const hasAPs = schoolContext.apCoursesOffered !== undefined && schoolContext.apCoursesOffered > 0;
    const rigorTier = evaluateRigorTier(counts.ap, hasAPs);

    // Calculate score based on tier and utilization
    let baseScore: number;
    switch (rigorTier) {
      case 'exceptional':
        baseScore = 95;
        break;
      case 'strong':
        baseScore = 80;
        break;
      case 'competitive':
        baseScore = 65;
        break;
      case 'belowExpectations':
        baseScore = 40;
        break;
      default:
        baseScore = 50;
    }

    // Adjust for utilization if school offers fewer courses
    if (!hasAPs || (schoolContext.apCoursesOffered && schoolContext.apCoursesOffered < 10)) {
      // Under-resourced school - adjust based on utilization
      baseScore = Math.max(baseScore, utilizationRate * 0.9);
    }

    // Evaluate core subject rigor
    const coreSubjectRigor = this.evaluateCoreSubjectRigor(courseHistory);

    // Generate level description
    const level = this.rigorTierToLevel(rigorTier);

    // Context
    const context = this.generateRigorContext(counts, rigorTier, schoolContext);

    // Strengths and gaps
    const { strengths, gaps, recommendations } = this.analyzeRigorStrengthsGaps(
      counts,
      coreSubjectRigor,
      schoolContext
    );

    return {
      score: Math.round(baseScore),
      level,
      apCourseCount: counts.ap,
      ibCourseCount: counts.ib,
      honorsCourseCount: counts.honors,
      dualEnrollmentCount: counts.dualEnrollment,
      totalAdvancedCourses: totalAdvanced,
      maxAvailableAdvanced: maxAvailable,
      rigorUtilizationRate: Math.round(utilizationRate),
      coreSubjectRigor,
      context,
      strengths,
      gaps,
      recommendations,
    };
  }

  private countCourseTypes(courses: CourseEntry[]): {
    ap: number;
    ib: number;
    honors: number;
    dualEnrollment: number;
    regular: number;
  } {
    return courses.reduce(
      (counts, course) => {
        switch (course.level) {
          case 'ap':
            counts.ap++;
            break;
          case 'ib_sl':
          case 'ib_hl':
            counts.ib++;
            break;
          case 'honors':
            counts.honors++;
            break;
          case 'dual_enrollment':
          case 'college':
            counts.dualEnrollment++;
            break;
          default:
            counts.regular++;
        }
        return counts;
      },
      { ap: 0, ib: 0, honors: 0, dualEnrollment: 0, regular: 0 }
    );
  }

  private evaluateCoreSubjectRigor(courses: CourseEntry[]): {
    english: CourseRigorLevel;
    math: CourseRigorLevel;
    science: CourseRigorLevel;
    socialStudies: CourseRigorLevel;
    foreignLanguage: CourseRigorLevel;
  } {
    const subjectMapping: Record<string, string> = {
      english: 'english',
      language: 'english',
      literature: 'english',
      composition: 'english',
      math: 'math',
      calculus: 'math',
      algebra: 'math',
      geometry: 'math',
      statistics: 'math',
      science: 'science',
      biology: 'science',
      chemistry: 'science',
      physics: 'science',
      environmental: 'science',
      history: 'socialStudies',
      government: 'socialStudies',
      economics: 'socialStudies',
      psychology: 'socialStudies',
      sociology: 'socialStudies',
      spanish: 'foreignLanguage',
      french: 'foreignLanguage',
      chinese: 'foreignLanguage',
      german: 'foreignLanguage',
      japanese: 'foreignLanguage',
      latin: 'foreignLanguage',
    };

    const subjectMaxLevel: Record<string, CourseRigorLevel> = {
      english: 'low',
      math: 'low',
      science: 'low',
      socialStudies: 'low',
      foreignLanguage: 'low',
    };

    for (const course of courses) {
      const lowerSubject = course.subject.toLowerCase();
      let mappedSubject: string | undefined;

      for (const [keyword, subject] of Object.entries(subjectMapping)) {
        if (lowerSubject.includes(keyword)) {
          mappedSubject = subject;
          break;
        }
      }

      if (!mappedSubject) continue;

      const levelOrder: CourseRigorLevel[] = ['low', 'moderate', 'high', 'very_high', 'maximum'];
      const currentLevel = subjectMaxLevel[mappedSubject];
      const courseLevel = this.courseToRigorLevel(course.level);

      if (levelOrder.indexOf(courseLevel) > levelOrder.indexOf(currentLevel)) {
        subjectMaxLevel[mappedSubject] = courseLevel;
      }
    }

    return {
      english: subjectMaxLevel.english,
      math: subjectMaxLevel.math,
      science: subjectMaxLevel.science,
      socialStudies: subjectMaxLevel.socialStudies,
      foreignLanguage: subjectMaxLevel.foreignLanguage,
    };
  }

  private courseToRigorLevel(level: string): CourseRigorLevel {
    switch (level) {
      case 'ap':
      case 'ib_hl':
        return 'maximum';
      case 'ib_sl':
      case 'dual_enrollment':
      case 'college':
        return 'very_high';
      case 'honors':
        return 'high';
      default:
        return 'moderate';
    }
  }

  private rigorTierToLevel(tier: string): CourseRigorLevel {
    switch (tier) {
      case 'exceptional':
        return 'maximum';
      case 'strong':
        return 'very_high';
      case 'competitive':
        return 'high';
      default:
        return 'moderate';
    }
  }

  private generateRigorContext(
    counts: { ap: number; ib: number; honors: number; dualEnrollment: number },
    tier: string,
    schoolContext: { apCoursesOffered?: number; ibProgram?: boolean }
  ): string {
    const total = counts.ap + counts.ib;

    if (tier === 'exceptional') {
      return `${total} AP/IB courses demonstrates maximum academic challenge. ${COURSE_RIGOR_EXPECTATIONS.wellResourcedSchools.exceptional.notes}`;
    }
    if (tier === 'strong') {
      return `${total} AP/IB courses shows strong commitment to rigor. ${COURSE_RIGOR_EXPECTATIONS.wellResourcedSchools.strong.notes}`;
    }
    if (tier === 'competitive') {
      return `${total} AP/IB courses is at the lower end for T20 competitiveness. ${COURSE_RIGOR_EXPECTATIONS.wellResourcedSchools.competitive.notes}`;
    }
    if (!schoolContext.apCoursesOffered || schoolContext.apCoursesOffered < 5) {
      return `Course rigor evaluated in context of limited offerings at your school. ${COURSE_RIGOR_EXPECTATIONS.limitedResourceSchools.expectation}`;
    }
    return `${total} AP/IB courses is below expectations for well-resourced schools. Consider additional advanced coursework.`;
  }

  private analyzeRigorStrengthsGaps(
    counts: { ap: number; ib: number; honors: number; dualEnrollment: number },
    coreRigor: Record<string, CourseRigorLevel>,
    schoolContext: { apCoursesOffered?: number }
  ): { strengths: string[]; gaps: string[]; recommendations: string[] } {
    const strengths: string[] = [];
    const gaps: string[] = [];
    const recommendations: string[] = [];

    const total = counts.ap + counts.ib;

    // Analyze strengths
    if (total >= 8) {
      strengths.push('Strong AP/IB course load meets elite school expectations');
    }
    if (counts.dualEnrollment > 0) {
      strengths.push(`Dual enrollment courses (${counts.dualEnrollment}) show initiative beyond high school offerings`);
    }

    // Check core subject rigor
    const weakSubjects = Object.entries(coreRigor)
      .filter(([_, level]) => level === 'low' || level === 'moderate')
      .map(([subject]) => subject);

    if (weakSubjects.length > 0) {
      gaps.push(`Limited rigor in: ${weakSubjects.join(', ')}`);
      recommendations.push(`Consider taking AP/Honors courses in: ${weakSubjects.join(', ')}`);
    }

    // AP count recommendations
    if (total < 6 && (schoolContext.apCoursesOffered || 20) >= 10) {
      gaps.push('AP/IB course count below typical T20 expectation');
      recommendations.push('Add more AP courses in remaining semesters if possible');
    }

    if (total >= 6 && total < 8) {
      recommendations.push('Consider adding 1-2 more AP courses to strengthen rigor');
    }

    return { strengths, gaps, recommendations };
  }

  // ============================================================================
  // TEST SCORE EVALUATION
  // ============================================================================

  private evaluateTestScores(input: AcademicInputData, targetSchools?: string[]): TestingStrengthAssessment {
    const { testScores, apExams } = input;

    const hasSAT = !!testScores?.sat;
    const hasACT = !!testScores?.act;

    // If no test scores, return basic assessment
    if (!hasSAT && !hasACT) {
      return this.createNoTestScoresAssessment(input);
    }

    // Evaluate which test is stronger
    const strongerTest = this.determineStrongerTest(testScores);

    // Calculate overall testing score
    const { score, tier } = this.calculateTestingScore(testScores);

    // Build individual test analyses
    const satAnalysis = hasSAT ? this.analyzeSAT(testScores!.sat!) : undefined;
    const actAnalysis = hasACT ? this.analyzeACT(testScores!.act!) : undefined;

    // Analyze AP exams if present
    const apExamsAnalysis = apExams && apExams.length > 0 ? this.analyzeAPExams(apExams) : undefined;

    // Generate overall strategy
    const overallStrategy = this.generateTestingStrategy(
      testScores,
      targetSchools,
      strongerTest
    );

    // Context
    const context = this.generateTestingContext(score, tier, strongerTest);

    return {
      score,
      tier: this.scoreToTier(score),
      hasSAT,
      hasACT,
      strongerTest,
      satAnalysis,
      actAnalysis,
      apExamsAnalysis,
      overallTestingStrategy: overallStrategy,
      context,
    };
  }

  private createNoTestScoresAssessment(input: AcademicInputData): TestingStrengthAssessment {
    return {
      score: 50, // Neutral - no test scores
      tier: 'competitive',
      hasSAT: false,
      hasACT: false,
      overallTestingStrategy: 'Test-optional: Focus on other application strengths. Consider whether taking tests could strengthen your application.',
      context: 'No standardized test scores provided. Many elite schools are test-optional, but submitting strong scores can enhance your application.',
    };
  }

  private determineStrongerTest(scores?: { sat?: { total: number }; act?: { composite: number } }): 'sat' | 'act' | 'comparable' {
    if (!scores) return 'comparable';
    if (!scores.sat && !scores.act) return 'comparable';
    if (!scores.sat) return 'act';
    if (!scores.act) return 'sat';

    // Compare using concordance
    const satEquivalent = scores.sat.total;
    const actEquivalent = this.actToSAT(scores.act.composite);

    if (satEquivalent > actEquivalent + 30) return 'sat';
    if (actEquivalent > satEquivalent + 30) return 'act';
    return 'comparable';
  }

  private actToSAT(actScore: number): number {
    const concordance: Record<number, number> = {
      36: 1590, 35: 1540, 34: 1500, 33: 1460, 32: 1430,
      31: 1400, 30: 1370, 29: 1340, 28: 1310, 27: 1280,
      26: 1240, 25: 1210, 24: 1180, 23: 1140, 22: 1110,
    };
    return concordance[Math.round(actScore)] || 1000;
  }

  private calculateTestingScore(scores?: { sat?: { total: number }; act?: { composite: number } }): {
    score: number;
    tier: TierLabel;
  } {
    if (!scores) return { score: 50, tier: 'competitive' };

    let bestScore = 50;

    if (scores.sat) {
      const satTier = evaluateTestScoreTier(scores.sat.total, null, 'T20');
      if (satTier === 'strength') bestScore = Math.max(bestScore, 90);
      else if (satTier === 'neutral') bestScore = Math.max(bestScore, 70);
      else if (satTier === 'weakness') bestScore = Math.max(bestScore, 45);
    }

    if (scores.act) {
      const actTier = evaluateTestScoreTier(null, scores.act.composite, 'T20');
      if (actTier === 'strength') bestScore = Math.max(bestScore, 90);
      else if (actTier === 'neutral') bestScore = Math.max(bestScore, 70);
      else if (actTier === 'weakness') bestScore = Math.max(bestScore, 45);
    }

    return {
      score: bestScore,
      tier: calculateTier(bestScore),
    };
  }

  private analyzeSAT(sat: {
    total: number;
    math: number;
    ebrw: number;
    superscoreTotal?: number;
  }): TestingStrengthAssessment['satAnalysis'] {
    // Calculate percentile position relative to T20 ranges
    const harvardRange = SAT_SCORE_RANGES.harvard;
    const { exactPercentile } = calculatePercentile(
      sat.total,
      harvardRange.percentile25,
      harvardRange.percentile50,
      harvardRange.percentile75
    );

    return {
      total: sat.total,
      percentile: Math.round(exactPercentile),
      mathStrength: sat.math >= 780 ? 'strong' : sat.math >= 700 ? 'average' : 'weak',
      ebrwStrength: sat.ebrw >= 760 ? 'strong' : sat.ebrw >= 700 ? 'average' : 'weak',
      superscoreAdvice: sat.superscoreTotal && sat.superscoreTotal > sat.total
        ? `Superscore (${sat.superscoreTotal}) is stronger than single sitting - submit to schools that superscore`
        : undefined,
      retakeRecommendation: sat.total < 1500
        ? 'Consider retaking - potential to reach competitive threshold'
        : undefined,
    };
  }

  private analyzeACT(act: {
    composite: number;
    english: number;
    math: number;
    reading: number;
    science: number;
  }): TestingStrengthAssessment['actAnalysis'] {
    const sections = [
      { name: 'English', score: act.english },
      { name: 'Math', score: act.math },
      { name: 'Reading', score: act.reading },
      { name: 'Science', score: act.science },
    ];

    return {
      composite: act.composite,
      percentile: this.actToPercentile(act.composite),
      strengthAreas: sections.filter((s) => s.score >= 34).map((s) => s.name),
      weakAreas: sections.filter((s) => s.score < 30).map((s) => s.name),
      retakeRecommendation: act.composite < 33
        ? 'Consider retaking - potential to reach competitive threshold (33+)'
        : undefined,
    };
  }

  private actToPercentile(composite: number): number {
    // Approximate percentile mapping
    if (composite >= 36) return 99;
    if (composite >= 35) return 98;
    if (composite >= 34) return 95;
    if (composite >= 33) return 92;
    if (composite >= 32) return 88;
    if (composite >= 31) return 84;
    if (composite >= 30) return 80;
    return Math.max(1, composite * 2);
  }

  private analyzeAPExams(apExams: Array<{ subject: string; score: number }>): TestingStrengthAssessment['apExamsAnalysis'] {
    const fives = apExams.filter((e) => e.score === 5);
    const fours = apExams.filter((e) => e.score === 4);
    const threesOrBelow = apExams.filter((e) => e.score <= 3);

    const averageScore = apExams.reduce((sum, e) => sum + e.score, 0) / apExams.length;

    return {
      totalExams: apExams.length,
      fivesCount: fives.length,
      foursCount: fours.length,
      threesOrBelowCount: threesOrBelow.length,
      averageScore: Math.round(averageScore * 10) / 10,
      strengthSubjects: fives.map((e) => e.subject),
      concernSubjects: threesOrBelow.map((e) => e.subject),
    };
  }

  private generateTestingStrategy(
    scores: AcademicInputData['testScores'],
    targetSchools?: string[],
    strongerTest?: 'sat' | 'act' | 'comparable'
  ): string {
    if (!scores || (!scores.sat && !scores.act)) {
      return 'Test-optional: Focus on strengthening other parts of your application. If you can achieve scores above the 50th percentile at target schools, consider taking tests.';
    }

    const strategies: string[] = [];

    // Determine submit/withhold recommendation
    const primaryScore = scores.sat?.total || this.actToSAT(scores.act?.composite || 0);

    if (primaryScore >= 1540) {
      strategies.push('Submit scores to all schools - your scores are competitive at every institution.');
    } else if (primaryScore >= 1500) {
      strategies.push('Submit to most T20 schools. Consider withholding from T5 unless other factors are exceptional.');
    } else if (primaryScore >= 1470) {
      strategies.push('Selective submission recommended. Submit to schools where you\'re at or above 50th percentile.');
    } else {
      strategies.push('Consider test-optional for T20 schools. Focus on other strengths.');
    }

    // Test preference
    if (strongerTest === 'sat') {
      strategies.push('SAT is your stronger test - prioritize SAT submission.');
    } else if (strongerTest === 'act') {
      strategies.push('ACT is your stronger test - prioritize ACT submission.');
    }

    return strategies.join(' ');
  }

  private generateTestingContext(score: number, tier: TierLabel, strongerTest?: 'sat' | 'act' | 'comparable'): string {
    if (tier === 'exceptional') {
      return 'Your test scores are a significant strength, placing you among the most competitive applicants.';
    }
    if (tier === 'strong') {
      return 'Your test scores are solid and will support your application at selective schools.';
    }
    if (tier === 'competitive') {
      return 'Your test scores are adequate but not a distinguishing factor. Other application elements should be emphasized.';
    }
    return 'Test scores are a weakness. Consider test-optional where available and focus on other strengths.';
  }

  // ============================================================================
  // GRADE TREND ANALYSIS
  // ============================================================================

  private analyzeGradeTrend(input: AcademicInputData): GradeTrendAnalysis {
    const { courseHistory } = input;

    // Extract GPA by year
    const gradesByYear = this.extractGradesByYear(courseHistory);

    // Calculate year GPAs
    const yearGPAs = {
      freshman: this.calculateYearGPA(gradesByYear['9'] || gradesByYear['freshman'] || []),
      sophomore: this.calculateYearGPA(gradesByYear['10'] || gradesByYear['sophomore'] || []),
      junior: this.calculateYearGPA(gradesByYear['11'] || gradesByYear['junior'] || []),
      senior: this.calculateYearGPA(gradesByYear['12'] || gradesByYear['senior'] || []),
    };

    // Determine trend direction
    const direction = this.determineTrendDirection(yearGPAs);

    // Create trajectory array
    const trajectory = [yearGPAs.freshman, yearGPAs.sophomore, yearGPAs.junior, yearGPAs.senior]
      .filter((gpa) => gpa !== undefined) as number[];

    // Generate implications and narrative
    const implications = this.generateTrendImplications(direction, yearGPAs);
    const narrative = this.generateTrendNarrative(direction, yearGPAs);
    const admissionsImpact = this.assessTrendImpact(direction);
    const recommendations = this.generateTrendRecommendations(direction, input.currentGrade);

    return {
      direction,
      freshmanGPA: yearGPAs.freshman,
      sophomoreGPA: yearGPAs.sophomore,
      juniorGPA: yearGPAs.junior,
      seniorGPA: yearGPAs.senior,
      trajectory,
      implications,
      narrative,
      admissionsImpact,
      recommendations,
    };
  }

  private extractGradesByYear(courses: CourseEntry[]): Record<string, CourseEntry[]> {
    const byYear: Record<string, CourseEntry[]> = {};

    for (const course of courses) {
      const year = course.year.toLowerCase();
      let key: string;

      if (year.includes('9') || year.includes('freshman')) key = '9';
      else if (year.includes('10') || year.includes('sophomore')) key = '10';
      else if (year.includes('11') || year.includes('junior')) key = '11';
      else if (year.includes('12') || year.includes('senior')) key = '12';
      else continue;

      if (!byYear[key]) byYear[key] = [];
      byYear[key].push(course);
    }

    return byYear;
  }

  private calculateYearGPA(courses: CourseEntry[]): number | undefined {
    if (courses.length === 0) return undefined;

    const gradePoints: Record<string, number> = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0,
    };

    let totalPoints = 0;
    let validGrades = 0;

    for (const course of courses) {
      const points = course.gradePoints ?? gradePoints[course.grade.toUpperCase()];
      if (points !== undefined) {
        totalPoints += points;
        validGrades++;
      }
    }

    if (validGrades === 0) return undefined;
    return Math.round((totalPoints / validGrades) * 100) / 100;
  }

  private determineTrendDirection(yearGPAs: {
    freshman?: number;
    sophomore?: number;
    junior?: number;
    senior?: number;
  }): GradeTrend {
    const gpas = [yearGPAs.freshman, yearGPAs.sophomore, yearGPAs.junior, yearGPAs.senior]
      .filter((g) => g !== undefined) as number[];

    if (gpas.length < 2) return 'stable';

    // Calculate overall slope
    const first = gpas[0];
    const last = gpas[gpas.length - 1];
    const change = last - first;

    // Check for consistent direction
    let increasing = 0;
    let decreasing = 0;
    for (let i = 1; i < gpas.length; i++) {
      if (gpas[i] > gpas[i - 1]) increasing++;
      else if (gpas[i] < gpas[i - 1]) decreasing++;
    }

    if (change >= 0.3 && increasing >= gpas.length - 2) return 'strong_upward';
    if (change >= 0.1 && increasing > decreasing) return 'upward';
    if (change <= -0.3 && decreasing >= gpas.length - 2) return 'strong_downward';
    if (change <= -0.1 && decreasing > increasing) return 'downward';
    return 'stable';
  }

  private generateTrendImplications(direction: GradeTrend, yearGPAs: Record<string, number | undefined>): string {
    const implications: Record<GradeTrend, string> = {
      strong_upward: 'Strong upward trend demonstrates growth, maturity, and increasing academic capability. This can partially offset a weaker start.',
      upward: 'Upward trend shows positive academic trajectory and adaptability.',
      stable: 'Consistent academic performance demonstrates reliability and sustained effort.',
      downward: 'Downward trend may raise concerns about motivation or ability to handle increasing difficulty.',
      strong_downward: 'Significant downward trend is a red flag that admissions officers will notice and question.',
    };

    return implications[direction];
  }

  private generateTrendNarrative(direction: GradeTrend, yearGPAs: Record<string, number | undefined>): string {
    if (direction === 'stable' && yearGPAs.junior && yearGPAs.junior >= 3.9) {
      return `${GRADE_TREND_EVALUATION.yalePerspective.quote} Your consistent strong performance meets this expectation.`;
    }

    if (direction === 'upward' || direction === 'strong_upward') {
      return `${GRADE_TREND_EVALUATION.upwardTrends.source} Your improving grades demonstrate this quality.`;
    }

    if (direction === 'downward' || direction === 'strong_downward') {
      return 'A declining trend requires explanation. Use the Additional Information section to address circumstances if applicable.';
    }

    return 'Your grades show consistency across high school, which admissions officers view favorably.';
  }

  private assessTrendImpact(direction: GradeTrend): 'positive' | 'neutral' | 'negative' {
    if (direction === 'strong_upward' || direction === 'upward') return 'positive';
    if (direction === 'stable') return 'neutral';
    return 'negative';
  }

  private generateTrendRecommendations(direction: GradeTrend, currentGrade: number): string[] {
    const recommendations: string[] = [];

    if (direction === 'downward' || direction === 'strong_downward') {
      recommendations.push('Prioritize improving current semester grades');
      recommendations.push('Address any underlying causes (workload, health, motivation)');
      recommendations.push('Consider explaining circumstances in Additional Information section');
    }

    if (currentGrade === 12) {
      recommendations.push('Maintain strong grades through senior year - rescissions happen');
      recommendations.push(`${SENIOR_YEAR_EVALUATION.officialWarning.quote}`);
    }

    if (direction === 'upward' && currentGrade <= 11) {
      recommendations.push('Continue upward trajectory - this pattern strengthens your application');
    }

    return recommendations;
  }

  // ============================================================================
  // CLASS RANK ANALYSIS
  // ============================================================================

  private analyzeClassRank(input: AcademicInputData): ClassRankAnalysis {
    const { classRank } = input;

    if (!classRank || classRank.reportingMethod === 'none') {
      return {
        hasRank: false,
        context: 'Class rank not reported by your school. This is common and not a disadvantage.',
        competitiveContext: 'Many elite high schools do not report class rank. Admissions officers evaluate GPA and rigor directly.',
        recommendations: ['Focus on maintaining strong GPA and course rigor'],
      };
    }

    // Calculate percentile from available data
    let percentile: number | undefined;

    if (classRank.rank && classRank.classSize) {
      percentile = Math.round(((classRank.classSize - classRank.rank) / classRank.classSize) * 100);
    } else if (classRank.decile) {
      percentile = (10 - classRank.decile) * 10 + 5; // Middle of decile
    } else if (classRank.quartile) {
      percentile = (4 - classRank.quartile) * 25 + 12.5;
    }

    const tier = this.percentileToRankTier(percentile);

    return {
      hasRank: true,
      percentile,
      tier,
      context: this.generateRankContext(percentile, classRank.reportingMethod),
      competitiveContext: this.generateRankCompetitiveContext(percentile),
      recommendations: this.generateRankRecommendations(percentile),
    };
  }

  private percentileToRankTier(percentile?: number): 'top_1' | 'top_5' | 'top_10' | 'top_25' | 'top_50' | 'bottom_50' | undefined {
    if (!percentile) return undefined;
    if (percentile >= 99) return 'top_1';
    if (percentile >= 95) return 'top_5';
    if (percentile >= 90) return 'top_10';
    if (percentile >= 75) return 'top_25';
    if (percentile >= 50) return 'top_50';
    return 'bottom_50';
  }

  private generateRankContext(percentile?: number, method?: string): string {
    if (!percentile) return 'Class rank position could not be determined.';

    if (percentile >= 95) {
      return `Top ${100 - Math.floor(percentile)}% class rank is excellent. 94.4% of Princeton admits were in top 10% of their class.`;
    }
    if (percentile >= 90) {
      return `Top 10% class rank is competitive at elite schools.`;
    }
    if (percentile >= 75) {
      return `Top 25% class rank is acceptable but not a strength at T20 schools.`;
    }
    return `Class rank below top 25% may be a concern at highly selective institutions.`;
  }

  private generateRankCompetitiveContext(percentile?: number): string {
    if (!percentile) return 'Unable to assess competitive position without rank data.';

    if (percentile >= 99) {
      return 'Valedictorian or salutatorian - among the strongest academic credentials.';
    }
    if (percentile >= 95) {
      return 'Top 5% places you among typical admits at T10 schools.';
    }
    if (percentile >= 90) {
      return 'Top 10% meets the profile of most T20 admits.';
    }
    return 'Rank below top 10% is below typical T20 admit profile. Other factors must compensate.';
  }

  private generateRankRecommendations(percentile?: number): string[] {
    const recs: string[] = [];

    if (!percentile) {
      recs.push('Focus on GPA and course rigor as your academic indicators');
      return recs;
    }

    if (percentile < 90) {
      recs.push('Consider whether your school is particularly competitive - this context matters');
      recs.push('Emphasize rigor and GPA over rank in application narrative');
    }

    if (percentile >= 99) {
      recs.push('Highlight valedictorian/salutatorian status in application');
    }

    return recs;
  }

  // ============================================================================
  // SCHOOL FIT CALCULATION
  // ============================================================================

  private calculateSchoolFit(
    input: AcademicInputData,
    targetSchools: string[]
  ): Record<string, SchoolAcademicFit> {
    const fits: Record<string, SchoolAcademicFit> = {};

    // Use provided schools or default to top 10
    const schools = targetSchools.length > 0
      ? targetSchools
      : ['harvard', 'stanford', 'mit', 'yale', 'princeton'];

    const unweightedGPA = this.normalizeGPATo4Scale(
      input.gpa.value,
      input.gpa.scale,
      input.gpa.isWeighted
    );

    for (const schoolId of schools) {
      const profile = getCollegeProfile(schoolId);
      if (!profile) continue;

      const benchmarks = profile.academicBenchmarks;

      // Calculate GPA percentile at this school
      const gpaPosition = calculatePercentile(
        unweightedGPA,
        benchmarks.gpa.percentile25,
        benchmarks.gpa.percentile50,
        benchmarks.gpa.percentile75
      );

      // Calculate test percentile if available
      let testPosition: ReturnType<typeof calculatePercentile> | undefined;
      if (input.testScores?.sat && benchmarks.sat) {
        testPosition = calculatePercentile(
          input.testScores.sat.total,
          benchmarks.sat.percentile25,
          benchmarks.sat.percentile50,
          benchmarks.sat.percentile75
        );
      }

      // Determine competitiveness
      const academicCompetitiveness = this.determineAcademicCompetitiveness(
        gpaPosition.position,
        testPosition?.position
      );

      // Generate gap analysis and recommendations
      const gapAnalysis = this.generateSchoolGapAnalysis(
        unweightedGPA,
        input.testScores?.sat?.total,
        benchmarks
      );

      fits[schoolId] = {
        schoolId,
        schoolName: profile.collegeName,
        meetsBenchmark: gpaPosition.position !== 'below_25th',
        gpaPercentile: gpaPosition.position,
        testPercentile: testPosition?.position,
        academicCompetitiveness,
        gapAnalysis,
        recommendation: this.generateSchoolRecommendation(academicCompetitiveness, profile.collegeName),
      };
    }

    return fits;
  }

  private determineAcademicCompetitiveness(
    gpaPosition: string,
    testPosition?: string
  ): 'very_competitive' | 'competitive' | 'below_average' | 'significantly_below' {
    // Weight GPA more heavily
    if (gpaPosition === 'above_75th' || gpaPosition === '50th_to_75th') {
      if (!testPosition || testPosition === 'above_75th' || testPosition === '50th_to_75th') {
        return gpaPosition === 'above_75th' ? 'very_competitive' : 'competitive';
      }
    }

    if (gpaPosition === '25th_to_50th') {
      return 'below_average';
    }

    return 'significantly_below';
  }

  private generateSchoolGapAnalysis(
    gpa: number,
    satTotal: number | undefined,
    benchmarks: { gpa: { percentile50: number }; sat?: { percentile50: number } }
  ): string {
    const gaps: string[] = [];

    const gpaGap = benchmarks.gpa.percentile50 - gpa;
    if (gpaGap > 0.1) {
      gaps.push(`GPA ${gpaGap.toFixed(2)} below median`);
    }

    if (satTotal && benchmarks.sat) {
      const satGap = benchmarks.sat.percentile50 - satTotal;
      if (satGap > 30) {
        gaps.push(`SAT ${satGap} points below median`);
      }
    }

    return gaps.length > 0
      ? gaps.join('; ')
      : 'Academic profile meets or exceeds school benchmarks';
  }

  private generateSchoolRecommendation(
    competitiveness: string,
    schoolName: string
  ): string {
    if (competitiveness === 'very_competitive') {
      return `Academics are a strength for ${schoolName}. Focus on demonstrating fit through essays and activities.`;
    }
    if (competitiveness === 'competitive') {
      return `Academically qualified for ${schoolName}. Strong extracurriculars and essays are essential.`;
    }
    if (competitiveness === 'below_average') {
      return `Academics are a challenge for ${schoolName}. Need exceptional achievements elsewhere to compete.`;
    }
    return `${schoolName} is a significant reach academically. Consider whether application is strategic.`;
  }

  // ============================================================================
  // NARRATIVE & RECOMMENDATION GENERATION
  // ============================================================================

  private generateAcademicNarrative(
    gpa: GPAStrengthAssessment,
    rigor: CourseRigorAssessment,
    testing: TestingStrengthAssessment,
    trend: GradeTrendAnalysis
  ): AcademicEvaluation['academicNarrative'] {
    // Combine all strengths
    const allStrengths = [...gpa.strengths, ...rigor.strengths];
    if (testing.tier === 'exceptional' || testing.tier === 'strong') {
      allStrengths.push('Competitive standardized test scores');
    }
    if (trend.admissionsImpact === 'positive') {
      allStrengths.push('Positive grade trajectory');
    }

    // Combine all concerns
    const allConcerns = [...gpa.concerns, ...rigor.gaps];
    if (testing.tier === 'developing' || testing.tier === 'needs_work') {
      allConcerns.push('Test scores below competitive threshold');
    }
    if (trend.admissionsImpact === 'negative') {
      allConcerns.push('Declining grade trend');
    }

    // Identify unique aspects
    const uniqueAspects: string[] = [];
    if (rigor.dualEnrollmentCount > 2) {
      uniqueAspects.push('Significant dual enrollment demonstrates initiative');
    }
    if (testing.apExamsAnalysis && testing.apExamsAnalysis.fivesCount >= 5) {
      uniqueAspects.push(`${testing.apExamsAnalysis.fivesCount} perfect AP exam scores`);
    }

    // Generate headline
    const headline = this.generateHeadline(gpa.tier, rigor.level, testing.tier);

    return {
      headline,
      strengths: allStrengths.slice(0, 5),
      concerns: allConcerns.slice(0, 3),
      uniqueAspects,
    };
  }

  private generateHeadline(gpaTier: AcademicTier, rigorLevel: CourseRigorLevel, testingTier: AcademicTier): string {
    if (gpaTier === 'exceptional' && rigorLevel === 'maximum') {
      return 'Exceptional academic profile with maximum rigor';
    }
    if (gpaTier === 'strong' || gpaTier === 'exceptional') {
      return 'Strong academic foundation with competitive credentials';
    }
    if (gpaTier === 'competitive') {
      return 'Solid academics meeting threshold requirements';
    }
    return 'Academic profile has areas requiring attention';
  }

  private generateRecommendations(
    gpa: GPAStrengthAssessment,
    rigor: CourseRigorAssessment,
    testing: TestingStrengthAssessment,
    trend: GradeTrendAnalysis,
    input: AcademicInputData
  ): AcademicEvaluation['recommendations'] {
    const immediate: string[] = [];
    const courseSelection: string[] = [];
    const testingRecs: string[] = [];
    const positioning: string[] = [];

    // Course selection recommendations
    courseSelection.push(...rigor.recommendations);

    // Testing recommendations
    if (testing.satAnalysis?.retakeRecommendation) {
      testingRecs.push(testing.satAnalysis.retakeRecommendation);
    }
    if (testing.actAnalysis?.retakeRecommendation) {
      testingRecs.push(testing.actAnalysis.retakeRecommendation);
    }

    // Positioning recommendations
    if (gpa.tier === 'exceptional') {
      positioning.push('Lead with academic strength in application narrative');
    }
    if (input.schoolContext.isCompetitive) {
      positioning.push('Highlight competitive high school context in school description');
    }
    if (trend.admissionsImpact === 'positive') {
      positioning.push('Address early academic challenges in Additional Information, emphasizing growth');
    }

    // Immediate actions based on current grade
    if (input.currentGrade === 11) {
      immediate.push('Prioritize junior year grades - most heavily weighted');
      if (rigor.apCourseCount < 8) {
        immediate.push('Consider adding AP courses for senior year');
      }
    }
    if (input.currentGrade === 12) {
      immediate.push('Maintain grades through senior year - rescissions are real');
    }

    return {
      immediate,
      courseSelection,
      testing: testingRecs,
      positioning,
    };
  }

  private generateOverallNarrative(score: number, narrative: AcademicEvaluation['academicNarrative']): string {
    const tier = this.scoreToTier(score);

    const tierNarratives: Record<TierLabel, string> = {
      exceptional: 'Your academic profile is among the strongest, meeting or exceeding benchmarks at all selective institutions.',
      strong: 'Your academic credentials are solid and will support your application at highly selective schools.',
      competitive: 'Your academics meet threshold requirements. Strong extracurriculars and essays will be important differentiators.',
      developing: 'Your academic profile has room for improvement. Focus on strengthening weak areas while highlighting existing strengths.',
      needs_work: 'Significant academic gaps exist. Consider whether highly selective schools are realistic targets, or focus intensively on improvement.',
    };

    return `${tierNarratives[tier]} ${narrative.headline}.`;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private scoreToTier(score: number): AcademicTier {
    const tier = calculateTier(score);
    // Map TierLabel to AcademicTier
    const mapping: Record<TierLabel, AcademicTier> = {
      exceptional: 'exceptional',
      strong: 'strong',
      competitive: 'competitive',
      developing: 'developing',
      needs_work: 'needs_work',
    };
    return mapping[tier];
  }

  private trendToScore(trend: GradeTrend): number {
    const scores: Record<GradeTrend, number> = {
      strong_upward: 90,
      upward: 80,
      stable: 70,
      downward: 45,
      strong_downward: 25,
    };
    return scores[trend];
  }

  private calculateContextAdjustments(input: AcademicInputData): ContextAdjustment[] {
    const adjustments: ContextAdjustment[] = [];

    if (input.schoolContext.isCompetitive) {
      adjustments.push({
        factor: 'Competitive High School',
        adjustment: 5,
        reasoning: 'Known competitive high school increases GPA difficulty',
      });
    }

    if (input.schoolContext.type === 'magnet') {
      adjustments.push({
        factor: 'Magnet School',
        adjustment: 3,
        reasoning: 'Magnet school admission indicates academic strength',
      });
    }

    if (input.schoolContext.type === 'homeschool') {
      adjustments.push({
        factor: 'Homeschool Context',
        adjustment: 0,
        reasoning: 'Homeschool - evaluated based on course content and external validation',
      });
    }

    return adjustments;
  }

  private calculateDataCompleteness(input: AcademicInputData): number {
    let complete = 0;
    let total = 0;

    // GPA - required
    total += 1;
    if (input.gpa && input.gpa.value > 0) complete += 1;

    // Course history
    total += 1;
    if (input.courseHistory && input.courseHistory.length > 0) complete += 1;

    // Test scores - optional but valuable
    total += 1;
    if (input.testScores && (input.testScores.sat || input.testScores.act)) complete += 1;

    // School context
    total += 1;
    if (input.schoolContext && input.schoolContext.name) complete += 1;

    return complete / total;
  }
}

// Export singleton
export const academicEvaluator = new AcademicEvaluator();

// Also export types used externally
export { SENIOR_YEAR_EVALUATION } from '../data/academicStandards';
