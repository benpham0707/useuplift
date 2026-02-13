// @ts-nocheck
/**
 * Capability Profiler
 *
 * Analyzes a student's complete academic history to build a reusable profile
 * of their demonstrated capabilities, strengths, and optimal challenge level.
 *
 * Philosophy: Don't assume "rigor over GPA" is always right. Instead, analyze
 * each student's track record to understand what difficulty level allows them
 * to achieve their best outcomes.
 *
 * This is a HEURISTIC-FIRST system - fast, synchronous analysis that builds
 * the foundation for LLM-enhanced insights.
 */

import type { CourseRecord } from '../types';
import type {
  AcademicCapabilityProfile,
  CapabilityProfileInput,
  CapabilityProfileResult,
  CapabilityTier,
  ChallengeTolerance,
  ChallengeEvent,
  CourseOutlier,
  DataCompleteness,
  DifficultyRecommendation,
  GrowthPattern,
  LearningPatterns,
  LevelTransitionPattern,
  OptimalDifficultyLevel,
  OptimalStretchPoint,
  OverallCapabilityAssessment,
  PerformanceByDifficulty,
  PerformanceConsistency,
  ProgressionAdvice,
  SubjectArea,
  SubjectCapability,
  SubjectCapabilityLevel,
  SubjectCapabilityMap,
  ToleranceLevel,
} from './types';

import { GRADE_TO_GPA, GPA_TO_GRADE } from './types';

// ============================================================================
// MAIN CAPABILITY PROFILER
// ============================================================================

export class CapabilityProfiler {
  /**
   * Build a complete capability profile from the student's academic history
   */
  buildProfile(input: CapabilityProfileInput): CapabilityProfileResult {
    try {
      // Step 1: Assess data completeness
      const dataCompleteness = this.assessDataCompleteness(input);

      if (dataCompleteness.confidenceLevel === 'insufficient') {
        return {
          success: false,
          error: 'Insufficient data to build a reliable capability profile. Need at least 6 courses with grades.',
        };
      }

      // Step 2: Calculate performance by difficulty level
      const performanceByDifficulty = this.calculatePerformanceByDifficulty(input.courses);

      // Step 3: Build subject-specific capabilities
      const subjectCapabilities = this.buildSubjectCapabilities(input.courses);

      // Step 4: Assess challenge tolerance
      const challengeTolerance = this.assessChallengeTolerance(input.courses, input.gradeHistory);

      // Step 5: Identify learning patterns
      const learningPatterns = this.identifyLearningPatterns(input.courses, input.gradeHistory);

      // Step 6: Determine overall capability tier
      const capabilityTier = this.determineCapabilityTier(performanceByDifficulty);

      // Step 7: Calculate optimal stretch point
      const optimalStretchPoint = this.calculateOptimalStretchPoint(
        performanceByDifficulty,
        challengeTolerance
      );

      // Step 8: Assess performance consistency
      const performanceConsistency = this.assessPerformanceConsistency(input.courses);

      // Step 9: Build overall capability assessment
      const overallCapability: OverallCapabilityAssessment = {
        capabilityTier,
        performanceByDifficulty,
        optimalStretchPoint,
        performanceConsistency,
        capabilitySummary: this.generateCapabilitySummary(
          capabilityTier,
          performanceByDifficulty,
          optimalStretchPoint
        ),
      };

      // Step 10: Determine optimal difficulty level
      const optimalDifficultyLevel = this.determineOptimalDifficultyLevel(
        overallCapability,
        subjectCapabilities,
        challengeTolerance,
        input.intendedMajor
      );

      // Step 11: Generate progression advice
      const progressionAdvice = this.generateProgressionAdvice(
        overallCapability,
        subjectCapabilities,
        optimalDifficultyLevel,
        challengeTolerance,
        input
      );

      // Build the complete profile
      const profile: AcademicCapabilityProfile = {
        profileId: this.generateProfileId(),
        generatedAt: new Date(),
        dataCompleteness,
        overallCapability,
        subjectCapabilities,
        challengeTolerance,
        learningPatterns,
        optimalDifficultyLevel,
        confidence: this.calculateOverallConfidence(dataCompleteness, input.courses.length),
        lastUpdated: new Date(),
        courseCount: input.courses.length,
        yearsAnalyzed: dataCompleteness.yearsWithData.length,
      };

      return {
        success: true,
        profile,
        progressionAdvice,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error building capability profile',
      };
    }
  }

  // ============================================================================
  // DATA COMPLETENESS
  // ============================================================================

  private assessDataCompleteness(input: CapabilityProfileInput): DataCompleteness {
    const yearsWithData: ('freshman' | 'sophomore' | 'junior' | 'senior')[] = [];
    const subjectCounts: Record<string, number> = {};

    // Check which years have data
    for (const course of input.courses) {
      const year = this.normalizeYear(course.year);
      if (year && !yearsWithData.includes(year)) {
        yearsWithData.push(year);
      }

      // Count subjects
      const subject = course.subject || 'other';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    }

    // Identify subjects with multiple data points
    const subjectsWithMultipleDataPoints = Object.entries(subjectCounts)
      .filter(([_, count]) => count >= 2)
      .map(([subject]) => subject);

    // Calculate overall score
    let score = 0;
    score += yearsWithData.length * 15; // Up to 60 points for years
    score += Math.min(input.courses.length * 2, 30); // Up to 30 points for courses
    score += input.gradeHistory ? 10 : 0;
    score = Math.min(score, 100);

    // Determine confidence level
    let confidenceLevel: 'high' | 'medium' | 'low' | 'insufficient';
    if (input.courses.length < 6) {
      confidenceLevel = 'insufficient';
    } else if (yearsWithData.length >= 3 && input.courses.length >= 15) {
      confidenceLevel = 'high';
    } else if (yearsWithData.length >= 2 && input.courses.length >= 10) {
      confidenceLevel = 'medium';
    } else {
      confidenceLevel = 'low';
    }

    return {
      overallScore: score,
      yearsWithData,
      subjectsWithMultipleDataPoints,
      hasGradeHistory: !!input.gradeHistory,
      hasCourseRecords: input.courses.length > 0,
      hasSchoolContext: !!input.schoolContext,
      confidenceLevel,
    };
  }

  // ============================================================================
  // PERFORMANCE BY DIFFICULTY
  // ============================================================================

  private calculatePerformanceByDifficulty(courses: CourseRecord[]): PerformanceByDifficulty {
    const apIbGrades: { grade: number; subject: string; course: string }[] = [];
    const honorsGrades: { grade: number; subject: string; course: string }[] = [];
    const regularGrades: { grade: number; subject: string; course: string }[] = [];

    for (const course of courses) {
      const gpa = this.gradeToGPA(course.grade);
      if (gpa === null) continue;

      const entry = { grade: gpa, subject: course.subject, course: course.name };
      const level = (course.level || '').toLowerCase();

      if (level.includes('ap') || level.includes('ib') || level === 'ap' || level === 'ib_hl') {
        apIbGrades.push(entry);
      } else if (level.includes('honors') || level.includes('advanced') || level === 'honors') {
        honorsGrades.push(entry);
      } else {
        regularGrades.push(entry);
      }
    }

    const calculateStats = (grades: typeof apIbGrades) => {
      if (grades.length === 0) return null;
      const gpas = grades.map((g) => g.grade);
      return {
        avgGrade: gpas.reduce((a, b) => a + b, 0) / gpas.length,
        sampleSize: grades.length,
        gradeRange: { min: Math.min(...gpas), max: Math.max(...gpas) },
        subjects: [...new Set(grades.map((g) => g.subject))],
      };
    };

    return {
      ap_ib: calculateStats(apIbGrades),
      honors: calculateStats(honorsGrades),
      regular: calculateStats(regularGrades),
    };
  }

  // ============================================================================
  // SUBJECT CAPABILITIES
  // ============================================================================

  private buildSubjectCapabilities(courses: CourseRecord[]): SubjectCapabilityMap {
    const subjectData: Record<
      string,
      { courses: Array<{ name: string; level: string; grade: number; year: number }> }
    > = {};

    // Group courses by subject
    for (const course of courses) {
      const subject = this.normalizeSubject(course.subject);
      const gpa = this.gradeToGPA(course.grade);
      if (gpa === null) continue;

      if (!subjectData[subject]) {
        subjectData[subject] = { courses: [] };
      }

      subjectData[subject].courses.push({
        name: course.name,
        level: course.level || 'regular',
        grade: gpa,
        year: typeof course.year === 'number' ? course.year : this.yearToNumber(course.year),
      });
    }

    // Build capability for each subject
    const capabilities: SubjectCapabilityMap = {};

    for (const [subject, data] of Object.entries(subjectData)) {
      if (data.courses.length === 0) continue;

      // Calculate performance by level
      const performanceByLevel: SubjectCapability['performanceByLevel'] = {};
      const apIbCourses = data.courses.filter(
        (c) => c.level.includes('ap') || c.level.includes('ib')
      );
      const honorsCourses = data.courses.filter(
        (c) => c.level.includes('honors') || c.level.includes('advanced')
      );
      const regularCourses = data.courses.filter(
        (c) => !c.level.includes('ap') && !c.level.includes('ib') && !c.level.includes('honors')
      );

      if (apIbCourses.length > 0) {
        performanceByLevel.ap_ib = {
          avgGrade: apIbCourses.reduce((a, b) => a + b.grade, 0) / apIbCourses.length,
          courses: apIbCourses.map((c) => c.name),
        };
      }
      if (honorsCourses.length > 0) {
        performanceByLevel.honors = {
          avgGrade: honorsCourses.reduce((a, b) => a + b.grade, 0) / honorsCourses.length,
          courses: honorsCourses.map((c) => c.name),
        };
      }
      if (regularCourses.length > 0) {
        performanceByLevel.regular = {
          avgGrade: regularCourses.reduce((a, b) => a + b.grade, 0) / regularCourses.length,
          courses: regularCourses.map((c) => c.name),
        };
      }

      // Determine capability level
      const capabilityLevel = this.determineSubjectCapabilityLevel(performanceByLevel);

      // Determine trend
      const sortedByYear = [...data.courses].sort((a, b) => a.year - b.year);
      const trend = this.calculateTrend(sortedByYear.map((c) => c.grade));

      // Determine proven success level
      let provenSuccessLevel: 'ap_ib' | 'honors' | 'regular' | 'none' = 'none';
      if (performanceByLevel.ap_ib && performanceByLevel.ap_ib.avgGrade >= 3.7) {
        provenSuccessLevel = 'ap_ib';
      } else if (performanceByLevel.honors && performanceByLevel.honors.avgGrade >= 3.7) {
        provenSuccessLevel = 'honors';
      } else if (performanceByLevel.regular && performanceByLevel.regular.avgGrade >= 3.7) {
        provenSuccessLevel = 'regular';
      }

      // Determine recommended next level
      const recommendedNextLevel = this.recommendNextLevel(
        performanceByLevel,
        provenSuccessLevel,
        trend
      );

      // Generate insight
      const insight = this.generateSubjectInsight(
        subject as SubjectArea,
        capabilityLevel,
        performanceByLevel,
        trend
      );

      capabilities[subject as SubjectArea] = {
        capabilityLevel,
        trend,
        provenSuccessLevel,
        performanceByLevel,
        recommendedNextLevel,
        confidence: Math.min(data.courses.length * 20, 100),
        insight,
      };
    }

    return capabilities;
  }

  private determineSubjectCapabilityLevel(
    performanceByLevel: SubjectCapability['performanceByLevel']
  ): SubjectCapabilityLevel {
    // Check AP/IB performance first
    if (performanceByLevel.ap_ib) {
      if (performanceByLevel.ap_ib.avgGrade >= 3.7) return 'exceptional';
      if (performanceByLevel.ap_ib.avgGrade >= 3.0) return 'strong';
      return 'competent';
    }

    // Then honors
    if (performanceByLevel.honors) {
      if (performanceByLevel.honors.avgGrade >= 3.7) return 'strong';
      if (performanceByLevel.honors.avgGrade >= 3.0) return 'competent';
      return 'developing';
    }

    // Then regular
    if (performanceByLevel.regular) {
      if (performanceByLevel.regular.avgGrade >= 3.7) return 'competent';
      if (performanceByLevel.regular.avgGrade >= 3.0) return 'developing';
      return 'challenged';
    }

    return 'developing';
  }

  private recommendNextLevel(
    performanceByLevel: SubjectCapability['performanceByLevel'],
    provenSuccessLevel: 'ap_ib' | 'honors' | 'regular' | 'none',
    trend: 'improving' | 'stable' | 'declining'
  ): 'ap_ib' | 'honors' | 'regular' {
    // If declining, recommend current proven level or below
    if (trend === 'declining') {
      if (provenSuccessLevel === 'ap_ib') return 'ap_ib';
      if (provenSuccessLevel === 'honors') return 'honors';
      return 'regular';
    }

    // If improving and has proven success, recommend stepping up
    if (trend === 'improving') {
      if (provenSuccessLevel === 'honors' && performanceByLevel.honors!.avgGrade >= 3.5) {
        return 'ap_ib';
      }
      if (provenSuccessLevel === 'regular' && performanceByLevel.regular!.avgGrade >= 3.5) {
        return 'honors';
      }
    }

    // If stable, stay at proven level
    if (provenSuccessLevel === 'ap_ib') return 'ap_ib';
    if (provenSuccessLevel === 'honors') return 'honors';
    return 'regular';
  }

  private generateSubjectInsight(
    subject: SubjectArea,
    level: SubjectCapabilityLevel,
    performanceByLevel: SubjectCapability['performanceByLevel'],
    trend: 'improving' | 'stable' | 'declining'
  ): string {
    const subjectName = this.formatSubjectName(subject);

    if (level === 'exceptional') {
      return `You excel in ${subjectName} and have proven you can handle the most challenging courses while maintaining strong grades. Continue pushing yourself at the AP/IB level.`;
    }

    if (level === 'strong') {
      const hasAPData = !!performanceByLevel.ap_ib;
      if (hasAPData) {
        return `You perform well in ${subjectName} at the AP/IB level. Your grades show you can handle the challenge while maintaining solid performance.`;
      }
      return `You show strong capability in ${subjectName} at the honors level. You're likely ready to step up to AP/IB if you want to push yourself.`;
    }

    if (level === 'competent') {
      if (trend === 'improving') {
        return `Your ${subjectName} skills are solid and improving. Consider stepping up the difficulty level next year, but be prepared for an adjustment period.`;
      }
      return `You're competent in ${subjectName}. To maximize your GPA, staying at your current level is wise unless you have a particular passion for this subject.`;
    }

    if (level === 'developing') {
      return `You're still building your foundation in ${subjectName}. Focus on solidifying your understanding at your current level before increasing difficulty.`;
    }

    return `${subjectName} appears to be a challenging area. Consider additional support or tutoring before attempting more advanced coursework.`;
  }

  // ============================================================================
  // CHALLENGE TOLERANCE
  // ============================================================================

  private assessChallengeTolerance(
    courses: CourseRecord[],
    gradeHistory?: CapabilityProfileInput['gradeHistory']
  ): ChallengeTolerance {
    const challengeEvents: ChallengeEvent[] = [];
    const transitions: LevelTransitionPattern['transitions'] = [];

    // Group courses by subject and year to find level transitions
    const coursesBySubjectYear: Record<string, Record<number, CourseRecord[]>> = {};
    for (const course of courses) {
      const subject = course.subject;
      const year = typeof course.year === 'number' ? course.year : this.yearToNumber(course.year);

      if (!coursesBySubjectYear[subject]) {
        coursesBySubjectYear[subject] = {};
      }
      if (!coursesBySubjectYear[subject][year]) {
        coursesBySubjectYear[subject][year] = [];
      }
      coursesBySubjectYear[subject][year].push(course);
    }

    // Find level transitions
    for (const [subject, yearCourses] of Object.entries(coursesBySubjectYear)) {
      const years = Object.keys(yearCourses)
        .map(Number)
        .sort();

      for (let i = 0; i < years.length - 1; i++) {
        const thisYear = years[i];
        const nextYear = years[i + 1];

        const thisYearCourse = yearCourses[thisYear][0];
        const nextYearCourse = yearCourses[nextYear][0];

        const thisLevel = this.normalizeLevel(thisYearCourse.level);
        const nextLevel = this.normalizeLevel(nextYearCourse.level);

        const thisGrade = this.gradeToGPA(thisYearCourse.grade);
        const nextGrade = this.gradeToGPA(nextYearCourse.grade);

        if (thisGrade === null || nextGrade === null) continue;

        // Check if this is a level increase
        if (this.isLevelIncrease(thisLevel, nextLevel)) {
          const gradeChange = nextGrade - thisGrade;

          let outcome: 'thrived' | 'adapted' | 'struggled' | 'withdrew';
          if (gradeChange >= 0) {
            outcome = 'thrived';
          } else if (gradeChange >= -0.3) {
            outcome = 'adapted';
          } else {
            outcome = 'struggled';
          }

          challengeEvents.push({
            year: this.numberToYear(nextYear),
            event: `Moved from ${thisLevel} to ${nextLevel} in ${subject}`,
            outcome,
            gradeImpact: gradeChange,
          });

          transitions.push({
            from: thisLevel,
            to: nextLevel,
            gradeBefore: thisGrade,
            gradeAfter: nextGrade,
            semester: this.numberToYear(nextYear),
          });
        }
      }
    }

    // Calculate typical grade drop and adaptation pattern
    const gradeDrops = transitions.map((t) => t.gradeBefore - t.gradeAfter);
    const typicalGradeDrop =
      gradeDrops.length > 0 ? gradeDrops.reduce((a, b) => a + b, 0) / gradeDrops.length : 0;

    // Determine tolerance level
    let toleranceLevel: ToleranceLevel = 'unknown';
    if (challengeEvents.length >= 2) {
      const thrivedOrAdapted = challengeEvents.filter(
        (e) => e.outcome === 'thrived' || e.outcome === 'adapted'
      ).length;
      const ratio = thrivedOrAdapted / challengeEvents.length;

      if (ratio >= 0.8 && typicalGradeDrop <= 0.3) {
        toleranceLevel = 'high';
      } else if (ratio >= 0.5) {
        toleranceLevel = 'moderate';
      } else {
        toleranceLevel = 'sensitive';
      }
    }

    // Calculate simultaneous challenge capacity
    const apCountByYear: Record<number, number> = {};
    for (const course of courses) {
      const year = typeof course.year === 'number' ? course.year : this.yearToNumber(course.year);
      const level = this.normalizeLevel(course.level);
      if (level === 'ap_ib') {
        apCountByYear[year] = (apCountByYear[year] || 0) + 1;
      }
    }
    const maxSimultaneous = Math.max(...Object.values(apCountByYear), 0);

    // Identify overload indicators
    const overloadIndicators: string[] = [];
    if (typicalGradeDrop > 0.5) {
      overloadIndicators.push('Significant grade drops when difficulty increases');
    }
    if (toleranceLevel === 'sensitive') {
      overloadIndicators.push('Performance notably suffers under increased challenge');
    }

    const levelTransitionPattern: LevelTransitionPattern = {
      typicalGradeDrop,
      adaptationPattern: typicalGradeDrop <= 0.2 ? 'quick' : typicalGradeDrop <= 0.4 ? 'gradual' : 'prolonged',
      transitions,
    };

    return {
      toleranceLevel,
      challengeHistory: challengeEvents,
      levelTransitionPattern,
      simultaneousChallengeCapacity: maxSimultaneous,
      overloadIndicators,
      summary: this.generateChallengeToleranceSummary(toleranceLevel, typicalGradeDrop, maxSimultaneous),
    };
  }

  private generateChallengeToleranceSummary(
    level: ToleranceLevel,
    typicalDrop: number,
    maxSimultaneous: number
  ): string {
    if (level === 'high') {
      return `You handle increased challenge well. When moving to harder courses, your grades typically drop by only ${(typicalDrop * 100).toFixed(0)}% of a letter grade. You've successfully managed ${maxSimultaneous} AP/IB courses simultaneously.`;
    }
    if (level === 'moderate') {
      return `You can handle increased challenge with some adjustment time. Expect about a ${(typicalDrop * 100).toFixed(0)}% letter grade drop initially when moving up in difficulty. Build up gradually rather than taking on too much at once.`;
    }
    if (level === 'sensitive') {
      return `Your grades are sensitive to difficulty increases. When moving to harder courses, you've seen drops of about ${(typicalDrop * 100).toFixed(0)}% of a letter grade. Consider being selective about where you increase difficulty.`;
    }
    return `We don't have enough transition data yet to assess your challenge tolerance. Consider starting with one new challenging course to see how you adapt.`;
  }

  // ============================================================================
  // LEARNING PATTERNS
  // ============================================================================

  private identifyLearningPatterns(
    courses: CourseRecord[],
    gradeHistory?: CapabilityProfileInput['gradeHistory']
  ): LearningPatterns {
    // Analyze semester pattern (if data available)
    const fallGrades: number[] = [];
    const springGrades: number[] = [];

    for (const course of courses) {
      const gpa = this.gradeToGPA(course.grade);
      if (gpa === null) continue;

      if (course.semester === 'fall') {
        fallGrades.push(gpa);
      } else if (course.semester === 'spring') {
        springGrades.push(gpa);
      }
    }

    let semesterPattern: 'fall_strong' | 'spring_strong' | 'consistent' | 'unknown' = 'unknown';
    if (fallGrades.length >= 3 && springGrades.length >= 3) {
      const fallAvg = fallGrades.reduce((a, b) => a + b, 0) / fallGrades.length;
      const springAvg = springGrades.reduce((a, b) => a + b, 0) / springGrades.length;
      const diff = fallAvg - springAvg;

      if (Math.abs(diff) < 0.1) {
        semesterPattern = 'consistent';
      } else if (diff > 0.1) {
        semesterPattern = 'fall_strong';
      } else {
        semesterPattern = 'spring_strong';
      }
    }

    // Analyze overall growth pattern
    const overallGrowthPattern = this.analyzeGrowthPattern(gradeHistory);

    // Recovery pattern (look for dips and recoveries)
    const recoveryPattern = this.analyzeRecoveryPattern(courses, gradeHistory);

    return {
      semesterPattern,
      schedulePreference: null, // Would need schedule data
      withinYearTrajectory: 'consistent', // Would need semester-level data
      courseTypeStrengths: {
        testHeavy: false, // Would need course type data
        projectBased: false,
        writingIntensive: false,
        labBased: false,
      },
      recoveryPattern,
      overallGrowthPattern,
    };
  }

  private analyzeGrowthPattern(
    gradeHistory?: CapabilityProfileInput['gradeHistory']
  ): GrowthPattern {
    if (!gradeHistory) return 'linear';

    const gpas: number[] = [];
    if (gradeHistory.freshman) gpas.push(gradeHistory.freshman.gpa);
    if (gradeHistory.sophomore) gpas.push(gradeHistory.sophomore.gpa);
    if (gradeHistory.junior) gpas.push(gradeHistory.junior.gpa);
    if (gradeHistory.senior) gpas.push(gradeHistory.senior.gpa);

    if (gpas.length < 2) return 'linear';

    // Calculate year-over-year changes
    const changes: number[] = [];
    for (let i = 1; i < gpas.length; i++) {
      changes.push(gpas[i] - gpas[i - 1]);
    }

    // Analyze pattern
    const allPositive = changes.every((c) => c > 0);
    const allNegative = changes.every((c) => c < 0);
    const accelerating = changes.length >= 2 && changes[changes.length - 1] > changes[0];

    if (allPositive && accelerating) return 'accelerating';
    if (allPositive) return 'linear';
    if (allNegative) return 'declining';

    // Check for plateau (minimal change)
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    if (Math.abs(avgChange) < 0.05) return 'plateaued';

    return 'cyclical';
  }

  private analyzeRecoveryPattern(
    courses: CourseRecord[],
    gradeHistory?: CapabilityProfileInput['gradeHistory']
  ): 'quick_bounce' | 'gradual_recovery' | 'persistent_impact' | 'unknown' {
    if (!gradeHistory) return 'unknown';

    const gpas: number[] = [];
    if (gradeHistory.freshman) gpas.push(gradeHistory.freshman.gpa);
    if (gradeHistory.sophomore) gpas.push(gradeHistory.sophomore.gpa);
    if (gradeHistory.junior) gpas.push(gradeHistory.junior.gpa);
    if (gradeHistory.senior) gpas.push(gradeHistory.senior.gpa);

    if (gpas.length < 3) return 'unknown';

    // Look for dips (year significantly lower than surrounding years)
    for (let i = 1; i < gpas.length - 1; i++) {
      const prevYear = gpas[i - 1];
      const thisYear = gpas[i];
      const nextYear = gpas[i + 1];

      // Is this a dip?
      if (thisYear < prevYear - 0.1 && thisYear < nextYear - 0.1) {
        // It's a dip - how fast was recovery?
        const recoveryAmount = nextYear - thisYear;
        const dropAmount = prevYear - thisYear;

        if (recoveryAmount >= dropAmount) {
          return 'quick_bounce';
        } else if (recoveryAmount >= dropAmount * 0.5) {
          return 'gradual_recovery';
        } else {
          return 'persistent_impact';
        }
      }
    }

    return 'unknown';
  }

  // ============================================================================
  // OVERALL CAPABILITY TIER
  // ============================================================================

  private determineCapabilityTier(performance: PerformanceByDifficulty): CapabilityTier {
    // Check AP/IB performance first
    if (performance.ap_ib && performance.ap_ib.sampleSize >= 2) {
      if (performance.ap_ib.avgGrade >= 3.7) return 'elite';
      if (performance.ap_ib.avgGrade >= 3.3) return 'high_achiever';
      if (performance.ap_ib.avgGrade >= 2.7) return 'solid_performer';
      return 'steady_builder';
    }

    // Check honors performance
    if (performance.honors && performance.honors.sampleSize >= 2) {
      if (performance.honors.avgGrade >= 3.7) return 'high_achiever';
      if (performance.honors.avgGrade >= 3.3) return 'solid_performer';
      if (performance.honors.avgGrade >= 2.7) return 'steady_builder';
      return 'needs_support';
    }

    // Check regular performance
    if (performance.regular && performance.regular.sampleSize >= 2) {
      if (performance.regular.avgGrade >= 3.7) return 'solid_performer';
      if (performance.regular.avgGrade >= 3.0) return 'steady_builder';
      return 'needs_support';
    }

    return 'steady_builder';
  }

  // ============================================================================
  // OPTIMAL STRETCH POINT
  // ============================================================================

  private calculateOptimalStretchPoint(
    performance: PerformanceByDifficulty,
    challengeTolerance: ChallengeTolerance
  ): OptimalStretchPoint {
    // Goal: Find the difficulty level where student can achieve A-/B+ or better
    const targetGPA = 3.5; // B+ to A- range

    // Check each level from hardest to easiest
    if (performance.ap_ib && performance.ap_ib.avgGrade >= targetGPA) {
      return {
        recommendedDifficultyLevel: 'ap_ib',
        expectedGPA: performance.ap_ib.avgGrade,
        confidence: Math.min(performance.ap_ib.sampleSize * 20, 90),
        rationale: `You achieve strong grades (${GPA_TO_GRADE(performance.ap_ib.avgGrade)}) at the AP/IB level. This is your optimal challenge point.`,
      };
    }

    if (performance.honors && performance.honors.avgGrade >= targetGPA) {
      // Check if they could potentially handle AP
      const shouldStretchToAP =
        performance.honors.avgGrade >= 3.7 &&
        challengeTolerance.toleranceLevel !== 'sensitive' &&
        challengeTolerance.levelTransitionPattern.typicalGradeDrop <= 0.4;

      if (shouldStretchToAP && !performance.ap_ib) {
        return {
          recommendedDifficultyLevel: 'ap_ib',
          expectedGPA: performance.honors.avgGrade - 0.3, // Estimated drop
          confidence: 60, // Lower confidence since we're projecting
          rationale: `You excel at honors (${GPA_TO_GRADE(performance.honors.avgGrade)}) and your challenge tolerance is ${challengeTolerance.toleranceLevel}. You're likely ready to try AP/IB courses.`,
        };
      }

      return {
        recommendedDifficultyLevel: 'honors',
        expectedGPA: performance.honors.avgGrade,
        confidence: Math.min(performance.honors.sampleSize * 20, 90),
        rationale: `Honors courses are your sweet spot. You achieve strong grades (${GPA_TO_GRADE(performance.honors.avgGrade)}) while being appropriately challenged.`,
      };
    }

    if (performance.regular && performance.regular.avgGrade >= targetGPA) {
      // Check if they could handle honors
      const shouldStretchToHonors =
        performance.regular.avgGrade >= 3.7 && challengeTolerance.toleranceLevel !== 'sensitive';

      if (shouldStretchToHonors && !performance.honors) {
        return {
          recommendedDifficultyLevel: 'honors',
          expectedGPA: performance.regular.avgGrade - 0.3,
          confidence: 60,
          rationale: `You do well in regular courses (${GPA_TO_GRADE(performance.regular.avgGrade)}). Consider stepping up to honors to push yourself while maintaining strong grades.`,
        };
      }

      return {
        recommendedDifficultyLevel: 'regular',
        expectedGPA: performance.regular.avgGrade,
        confidence: Math.min(performance.regular.sampleSize * 20, 90),
        rationale: `Regular courses allow you to achieve your best grades (${GPA_TO_GRADE(performance.regular.avgGrade)}). Focus on mastery at this level.`,
      };
    }

    // Default fallback
    return {
      recommendedDifficultyLevel: 'regular',
      expectedGPA: 3.0,
      confidence: 30,
      rationale: 'Focus on building a strong foundation before increasing difficulty.',
    };
  }

  // ============================================================================
  // PERFORMANCE CONSISTENCY
  // ============================================================================

  private assessPerformanceConsistency(courses: CourseRecord[]): PerformanceConsistency {
    const grades = courses
      .map((c) => this.gradeToGPA(c.grade))
      .filter((g): g is number => g !== null);

    if (grades.length === 0) {
      return {
        consistencyLevel: 'unpredictable',
        gradeVariance: 0,
        primaryVarianceFactor: 'balanced',
        outliers: [],
      };
    }

    // Calculate variance
    const mean = grades.reduce((a, b) => a + b, 0) / grades.length;
    const variance = grades.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / grades.length;
    const stdDev = Math.sqrt(variance);

    // Determine consistency level
    let consistencyLevel: PerformanceConsistency['consistencyLevel'];
    if (stdDev <= 0.3) {
      consistencyLevel = 'highly_consistent';
    } else if (stdDev <= 0.5) {
      consistencyLevel = 'mostly_consistent';
    } else if (stdDev <= 0.7) {
      consistencyLevel = 'variable';
    } else {
      consistencyLevel = 'unpredictable';
    }

    // Find outliers (grades > 1 std dev from mean)
    const outliers: CourseOutlier[] = [];
    for (const course of courses) {
      const gpa = this.gradeToGPA(course.grade);
      if (gpa === null) continue;

      const deviation = Math.abs(gpa - mean);
      if (deviation > stdDev) {
        outliers.push({
          courseName: course.name,
          subject: course.subject,
          level: course.level || 'regular',
          grade: gpa,
          expectedGrade: mean,
          deviation,
          likelyExplanation: gpa > mean ? 'Strong subject affinity' : 'Subject or difficulty mismatch',
        });
      }
    }

    // Determine primary variance factor
    // Group by subject and by level, compare variances
    const subjectVariances: Record<string, number[]> = {};
    const levelVariances: Record<string, number[]> = {};

    for (const course of courses) {
      const gpa = this.gradeToGPA(course.grade);
      if (gpa === null) continue;

      if (!subjectVariances[course.subject]) subjectVariances[course.subject] = [];
      subjectVariances[course.subject].push(gpa);

      const level = this.normalizeLevel(course.level);
      if (!levelVariances[level]) levelVariances[level] = [];
      levelVariances[level].push(gpa);
    }

    // Calculate within-group variance for each grouping
    const calcWithinGroupVar = (groups: Record<string, number[]>) => {
      let totalVar = 0;
      let count = 0;
      for (const grades of Object.values(groups)) {
        if (grades.length < 2) continue;
        const groupMean = grades.reduce((a, b) => a + b, 0) / grades.length;
        const groupVar = grades.reduce((sum, g) => sum + Math.pow(g - groupMean, 2), 0) / grades.length;
        totalVar += groupVar;
        count++;
      }
      return count > 0 ? totalVar / count : 0;
    };

    const subjectVar = calcWithinGroupVar(subjectVariances);
    const levelVar = calcWithinGroupVar(levelVariances);

    let primaryVarianceFactor: 'subject' | 'difficulty' | 'balanced';
    if (subjectVar > levelVar * 1.5) {
      primaryVarianceFactor = 'subject';
    } else if (levelVar > subjectVar * 1.5) {
      primaryVarianceFactor = 'difficulty';
    } else {
      primaryVarianceFactor = 'balanced';
    }

    return {
      consistencyLevel,
      gradeVariance: stdDev,
      primaryVarianceFactor,
      outliers: outliers.slice(0, 5), // Limit to top 5
    };
  }

  // ============================================================================
  // OPTIMAL DIFFICULTY LEVEL
  // ============================================================================

  private determineOptimalDifficultyLevel(
    overallCapability: OverallCapabilityAssessment,
    subjectCapabilities: SubjectCapabilityMap,
    challengeTolerance: ChallengeTolerance,
    intendedMajor?: string
  ): OptimalDifficultyLevel {
    // Overall recommendation
    const overall = this.createOverallRecommendation(overallCapability, challengeTolerance);

    // Subject-specific recommendations
    const bySubject: OptimalDifficultyLevel['bySubject'] = {};
    for (const [subject, capability] of Object.entries(subjectCapabilities)) {
      bySubject[subject as SubjectArea] = this.createSubjectRecommendation(
        capability,
        challengeTolerance,
        subject === this.getMajorSubject(intendedMajor)
      );
    }

    // Recommended AP count
    const apCount = this.calculateRecommendedAPCount(
      overallCapability.capabilityTier,
      challengeTolerance.simultaneousChallengeCapacity
    );

    // Projected GPA
    const projectedGPA = this.calculateProjectedGPA(overall, bySubject);

    return {
      overall,
      bySubject,
      recommendedAPCount: apCount,
      projectedGPA,
      guidingPrinciples: this.generateGuidingPrinciples(overallCapability, challengeTolerance),
    };
  }

  private createOverallRecommendation(
    capability: OverallCapabilityAssessment,
    tolerance: ChallengeTolerance
  ): DifficultyRecommendation {
    const stretch = capability.optimalStretchPoint;

    return {
      level: stretch.recommendedDifficultyLevel,
      confidence: stretch.confidence,
      rationale: stretch.rationale,
      expectedGrade: GPA_TO_GRADE(stretch.expectedGPA),
      stretchCondition:
        tolerance.toleranceLevel === 'high'
          ? 'You can stretch above this in subjects you love'
          : tolerance.toleranceLevel === 'moderate'
          ? 'Stretch selectively in your strongest subjects only'
          : null,
      backoffTriggers: [
        'Grade drops below B in any course',
        'Feeling overwhelmed or burning out',
        'Significant decline in extracurricular engagement',
      ],
    };
  }

  private createSubjectRecommendation(
    capability: SubjectCapability,
    tolerance: ChallengeTolerance,
    isMajorRelevant: boolean
  ): DifficultyRecommendation {
    let level = capability.recommendedNextLevel;
    let expectedGrade: number;

    // Calculate expected grade at recommended level
    const perfAtLevel = capability.performanceByLevel[level];
    if (perfAtLevel) {
      expectedGrade = perfAtLevel.avgGrade;
    } else {
      // Estimate based on lower level minus typical drop
      const dropAmount = tolerance.levelTransitionPattern.typicalGradeDrop;
      if (level === 'ap_ib' && capability.performanceByLevel.honors) {
        expectedGrade = capability.performanceByLevel.honors.avgGrade - dropAmount;
      } else if (level === 'honors' && capability.performanceByLevel.regular) {
        expectedGrade = capability.performanceByLevel.regular.avgGrade - dropAmount;
      } else {
        expectedGrade = 3.5; // Default estimate
      }
    }

    // Boost recommendation for major-relevant subjects if student can handle it
    if (isMajorRelevant && tolerance.toleranceLevel !== 'sensitive') {
      if (level === 'honors' && capability.capabilityLevel !== 'challenged') {
        level = 'ap_ib';
        expectedGrade -= tolerance.levelTransitionPattern.typicalGradeDrop;
      }
    }

    return {
      level,
      confidence: capability.confidence,
      rationale: capability.insight,
      expectedGrade: GPA_TO_GRADE(expectedGrade),
      stretchCondition: isMajorRelevant
        ? 'For your intended major, pushing yourself here shows commitment'
        : null,
      backoffTriggers: [
        'Grade drops below B+',
        'Falling behind on assignments',
        'Needing excessive tutoring to keep up',
      ],
    };
  }

  private calculateRecommendedAPCount(
    tier: CapabilityTier,
    maxSimultaneous: number
  ): OptimalDifficultyLevel['recommendedAPCount'] {
    const baseRecommendations: Record<CapabilityTier, { min: number; opt: number; max: number }> = {
      elite: { min: 4, opt: 5, max: 7 },
      high_achiever: { min: 3, opt: 4, max: 5 },
      solid_performer: { min: 2, opt: 3, max: 4 },
      steady_builder: { min: 1, opt: 2, max: 3 },
      needs_support: { min: 0, opt: 1, max: 2 },
    };

    const base = baseRecommendations[tier];

    // Adjust based on proven simultaneous capacity
    const adjust = maxSimultaneous > 0 ? Math.min(maxSimultaneous, base.max) : base.opt;

    return {
      minimum: Math.max(0, base.min),
      optimal: Math.min(adjust, base.opt),
      maximum: Math.min(maxSimultaneous + 1, base.max),
    };
  }

  private calculateProjectedGPA(
    overall: DifficultyRecommendation,
    bySubject: OptimalDifficultyLevel['bySubject']
  ): OptimalDifficultyLevel['projectedGPA'] {
    const overallGPA = this.gradeToGPA(overall.expectedGrade) || 3.5;

    // Calculate variance from subject recommendations
    const subjectGPAs = Object.values(bySubject)
      .map((r) => this.gradeToGPA(r.expectedGrade))
      .filter((g): g is number => g !== null);

    const avgSubjectGPA =
      subjectGPAs.length > 0 ? subjectGPAs.reduce((a, b) => a + b, 0) / subjectGPAs.length : overallGPA;

    return {
      conservative: Math.max(avgSubjectGPA - 0.2, 2.0),
      expected: avgSubjectGPA,
      optimistic: Math.min(avgSubjectGPA + 0.2, 4.0),
    };
  }

  private generateGuidingPrinciples(
    capability: OverallCapabilityAssessment,
    tolerance: ChallengeTolerance
  ): string[] {
    const principles: string[] = [];

    // Core principle based on capability tier
    if (capability.capabilityTier === 'elite') {
      principles.push('Challenge yourself - you thrive under difficulty');
    } else if (capability.capabilityTier === 'high_achiever') {
      principles.push('Balance challenge with success - take on harder courses strategically');
    } else if (capability.capabilityTier === 'solid_performer') {
      principles.push('Prioritize understanding over appearance - master content at your level');
    } else {
      principles.push('Build a strong foundation - grades matter more than difficulty labels');
    }

    // Consistency principle
    if (capability.performanceConsistency.consistencyLevel === 'variable') {
      principles.push('Focus on consistency - better to be reliably good than occasionally great');
    }

    // Challenge tolerance principle
    if (tolerance.toleranceLevel === 'sensitive') {
      principles.push('Be selective about difficulty increases - your grades are sensitive to challenge');
    }

    // Always include GPA priority
    principles.push('GPA is king - admissions officers prioritize grades over course labels');
    principles.push('Choose difficulty that allows you to achieve A or A- grades');

    return principles;
  }

  // ============================================================================
  // PROGRESSION ADVICE
  // ============================================================================

  private generateProgressionAdvice(
    capability: OverallCapabilityAssessment,
    subjectCapabilities: SubjectCapabilityMap,
    optimalDifficulty: OptimalDifficultyLevel,
    tolerance: ChallengeTolerance,
    input: CapabilityProfileInput
  ): ProgressionAdvice {
    const courseRecommendations: ProgressionAdvice['courseRecommendations'] = [];

    // Generate course recommendations by subject
    for (const [subject, subjectCap] of Object.entries(subjectCapabilities)) {
      const diffRec = optimalDifficulty.bySubject[subject as SubjectArea];
      if (!diffRec) continue;

      courseRecommendations.push({
        subject: subject as SubjectArea,
        recommendedLevel: diffRec.level,
        rationale: diffRec.rationale,
        expectedOutcome: `Expected grade: ${diffRec.expectedGrade}`,
        alternativeIfStruggling:
          diffRec.level === 'ap_ib'
            ? 'Drop to honors if grade falls below B'
            : diffRec.level === 'honors'
            ? 'Consider regular level if consistently below B+'
            : 'Seek additional support or tutoring',
      });
    }

    // Generate overall guidance
    const overallGuidance = this.generateOverallGuidance(capability, tolerance, input);

    // What to avoid
    const whatToAvoid = this.generateWhatToAvoid(capability, tolerance);

    // GPA protection strategies
    const gpaProtection = this.generateGPAProtectionStrategies(capability, tolerance);

    // Challenge opportunities
    const challengeOpportunities = this.generateChallengeOpportunities(capability, subjectCapabilities);

    // Success factors
    const successFactors = this.generateSuccessFactors(capability, tolerance);

    // Warning signs
    const warningSignsToWatch = this.generateWarningSignsToWatch(tolerance);

    return {
      overallGuidance,
      courseRecommendations,
      whatToAvoid,
      gpaProtectionStrategies: gpaProtection,
      challengeOpportunities,
      successFactors,
      warningSignsToWatch,
    };
  }

  private generateOverallGuidance(
    capability: OverallCapabilityAssessment,
    tolerance: ChallengeTolerance,
    input: CapabilityProfileInput
  ): string {
    const tier = capability.capabilityTier;
    const stretch = capability.optimalStretchPoint;

    if (tier === 'elite') {
      return `You have demonstrated exceptional academic capability, achieving strong grades even in the most challenging courses. Continue taking AP/IB courses - your track record shows you can handle them while maintaining high grades. Focus on ${optimalDifficulty.recommendedAPCount.optimal}-${optimalDifficulty.recommendedAPCount.maximum} AP courses next year.`;
    }

    if (tier === 'high_achiever') {
      return `You perform well in challenging courses with some expected grade adjustment. Your optimal strategy is to take ${stretch.recommendedDifficultyLevel} courses where you can achieve ${GPA_TO_GRADE(stretch.expectedGPA)} grades. Be strategic about where you increase difficulty.`;
    }

    if (tier === 'solid_performer') {
      return `Your strength is consistent, solid performance. Rather than chasing course labels, focus on courses at the ${stretch.recommendedDifficultyLevel} level where you can achieve ${GPA_TO_GRADE(stretch.expectedGPA)} grades. A strong GPA in honors courses is better than struggling in AP.`;
    }

    if (tier === 'steady_builder') {
      return `Your academic profile shows you're building foundational skills. Focus on mastery at your current level before increasing difficulty. A 3.8 GPA in regular courses is more valuable than a 3.0 in AP courses.`;
    }

    return `Focus on building strong foundations and seeking support where needed. Grades matter more than course difficulty at this stage.`;
  }

  private generateWhatToAvoid(
    capability: OverallCapabilityAssessment,
    tolerance: ChallengeTolerance
  ): string[] {
    const avoid: string[] = [];

    if (tolerance.toleranceLevel === 'sensitive') {
      avoid.push('Taking more than one new AP course in a single year');
      avoid.push('Increasing difficulty in multiple subjects simultaneously');
    }

    if (capability.performanceConsistency.primaryVarianceFactor === 'difficulty') {
      avoid.push('Mixing too many difficulty levels in one semester');
    }

    // Universal advice
    avoid.push('Overloading your schedule to the point where all grades suffer');
    avoid.push('Taking AP courses just for the label if your grades will significantly drop');
    avoid.push('Ignoring early warning signs of struggling');

    return avoid;
  }

  private generateGPAProtectionStrategies(
    capability: OverallCapabilityAssessment,
    tolerance: ChallengeTolerance
  ): string[] {
    const strategies: string[] = [];

    strategies.push('Front-load easier classes in semesters with more AP courses');

    if (tolerance.toleranceLevel !== 'high') {
      strategies.push('Limit AP courses to subjects where you have proven strong performance');
      strategies.push('Balance each AP course with a lighter elective');
    }

    strategies.push('Monitor your grades weekly and adjust study strategies early');
    strategies.push('Seek help (tutoring, office hours) at the first sign of struggle');
    strategies.push('Consider dropping to a lower level if mid-semester grades are below B');

    return strategies;
  }

  private generateChallengeOpportunities(
    capability: OverallCapabilityAssessment,
    subjectCapabilities: SubjectCapabilityMap
  ): string[] {
    const opportunities: string[] = [];

    // Find subjects where student excels
    for (const [subject, cap] of Object.entries(subjectCapabilities)) {
      if (cap.capabilityLevel === 'exceptional' || cap.capabilityLevel === 'strong') {
        if (cap.trend === 'improving') {
          opportunities.push(
            `${this.formatSubjectName(subject as SubjectArea)} - your strongest area with improving trend`
          );
        }
      }
    }

    if (capability.capabilityTier === 'elite' || capability.capabilityTier === 'high_achiever') {
      opportunities.push('Consider dual enrollment for college-level courses in your strongest subjects');
    }

    return opportunities;
  }

  private generateSuccessFactors(
    capability: OverallCapabilityAssessment,
    tolerance: ChallengeTolerance
  ): string[] {
    const factors: string[] = [];

    factors.push('Consistent study habits and time management');
    factors.push('Early intervention when grades start slipping');

    if (tolerance.levelTransitionPattern.adaptationPattern === 'gradual') {
      factors.push('Patience during adjustment periods - your grades typically recover');
    }

    factors.push('Balance between challenge and achievable success');
    factors.push('Focus on learning, not just grades - understanding leads to better performance');

    return factors;
  }

  private generateWarningSignsToWatch(tolerance: ChallengeTolerance): string[] {
    const signs = [
      'Grade dropping below B in any course',
      'Falling behind on homework or assignments',
      'Feeling consistently stressed or overwhelmed',
      'Sacrificing sleep regularly for schoolwork',
      'Dropping extracurriculars to keep up with classes',
    ];

    if (tolerance.overloadIndicators.length > 0) {
      signs.push(...tolerance.overloadIndicators);
    }

    return signs;
  }

  // ============================================================================
  // CAPABILITY SUMMARY GENERATION
  // ============================================================================

  private generateCapabilitySummary(
    tier: CapabilityTier,
    performance: PerformanceByDifficulty,
    stretch: OptimalStretchPoint
  ): string {
    const tierDescriptions: Record<CapabilityTier, string> = {
      elite: 'You consistently excel in the most challenging courses.',
      high_achiever: 'You perform well in challenging courses with strong results.',
      solid_performer: 'You achieve solid grades across moderate difficulty levels.',
      steady_builder: 'You perform best with foundational courses.',
      needs_support: 'You benefit from additional support and foundational work.',
    };

    const base = tierDescriptions[tier];

    let perfDetail = '';
    if (performance.ap_ib) {
      perfDetail = ` Your AP/IB average is ${GPA_TO_GRADE(performance.ap_ib.avgGrade)}.`;
    } else if (performance.honors) {
      perfDetail = ` Your honors average is ${GPA_TO_GRADE(performance.honors.avgGrade)}.`;
    }

    return `${base}${perfDetail} Your optimal difficulty level is ${stretch.recommendedDifficultyLevel}, where you can expect to achieve ${GPA_TO_GRADE(stretch.expectedGPA)} grades.`;
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  private gradeToGPA(grade: string | undefined): number | null {
    if (!grade) return null;
    const normalized = grade.toUpperCase().trim();
    return GRADE_TO_GPA[normalized] ?? null;
  }

  private normalizeYear(
    year: number | string | undefined
  ): 'freshman' | 'sophomore' | 'junior' | 'senior' | null {
    if (!year) return null;

    if (typeof year === 'number') {
      if (year === 9) return 'freshman';
      if (year === 10) return 'sophomore';
      if (year === 11) return 'junior';
      if (year === 12) return 'senior';
    }

    const str = String(year).toLowerCase();
    if (str.includes('fresh') || str.includes('9')) return 'freshman';
    if (str.includes('soph') || str.includes('10')) return 'sophomore';
    if (str.includes('jun') || str.includes('11')) return 'junior';
    if (str.includes('sen') || str.includes('12')) return 'senior';

    return null;
  }

  private yearToNumber(year: number | string | undefined): number {
    if (typeof year === 'number') return year;
    const normalized = this.normalizeYear(year);
    if (normalized === 'freshman') return 9;
    if (normalized === 'sophomore') return 10;
    if (normalized === 'junior') return 11;
    if (normalized === 'senior') return 12;
    return 0;
  }

  private numberToYear(year: number): string {
    if (year === 9) return 'Freshman';
    if (year === 10) return 'Sophomore';
    if (year === 11) return 'Junior';
    if (year === 12) return 'Senior';
    return `Year ${year}`;
  }

  private normalizeSubject(subject: string | undefined): SubjectArea {
    if (!subject) return 'other';

    const lower = subject.toLowerCase();
    if (lower.includes('math') || lower.includes('calc') || lower.includes('algebra') || lower.includes('geometry')) {
      return 'math';
    }
    if (lower.includes('science') || lower.includes('bio') || lower.includes('chem') || lower.includes('physics')) {
      return 'science';
    }
    if (lower.includes('english') || lower.includes('lit') || lower.includes('writing')) {
      return 'english';
    }
    if (lower.includes('history') || lower.includes('social') || lower.includes('gov') || lower.includes('econ')) {
      return 'social_studies';
    }
    if (lower.includes('spanish') || lower.includes('french') || lower.includes('foreign') || lower.includes('language')) {
      return 'foreign_language';
    }
    if (lower.includes('art') || lower.includes('music') || lower.includes('drama') || lower.includes('theater')) {
      return 'arts';
    }
    if (lower.includes('computer') || lower.includes('cs') || lower.includes('programming')) {
      return 'computer_science';
    }

    return subject as SubjectArea;
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

  private calculateTrend(grades: number[]): 'improving' | 'stable' | 'declining' {
    if (grades.length < 2) return 'stable';

    const firstHalf = grades.slice(0, Math.ceil(grades.length / 2));
    const secondHalf = grades.slice(Math.ceil(grades.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (diff > 0.15) return 'improving';
    if (diff < -0.15) return 'declining';
    return 'stable';
  }

  private formatSubjectName(subject: SubjectArea): string {
    const names: Record<SubjectArea, string> = {
      math: 'Mathematics',
      science: 'Science',
      english: 'English',
      social_studies: 'Social Studies',
      foreign_language: 'Foreign Language',
      arts: 'Arts',
      computer_science: 'Computer Science',
    };
    return names[subject] || subject;
  }

  private getMajorSubject(major: string | undefined): SubjectArea | null {
    if (!major) return null;

    const lower = major.toLowerCase();
    if (
      lower.includes('comput') ||
      lower.includes('software') ||
      lower.includes('data') ||
      lower.includes('cs')
    ) {
      return 'computer_science';
    }
    if (lower.includes('math') || lower.includes('stat')) return 'math';
    if (
      lower.includes('bio') ||
      lower.includes('chem') ||
      lower.includes('physics') ||
      lower.includes('engineering')
    ) {
      return 'science';
    }
    if (lower.includes('english') || lower.includes('journal') || lower.includes('commun')) {
      return 'english';
    }
    if (
      lower.includes('history') ||
      lower.includes('poli') ||
      lower.includes('econ') ||
      lower.includes('psych')
    ) {
      return 'social_studies';
    }

    return null;
  }

  private generateProfileId(): string {
    return `cap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private calculateOverallConfidence(dataCompleteness: DataCompleteness, courseCount: number): number {
    let confidence = 0;

    // Data completeness contribution (up to 50)
    confidence += dataCompleteness.overallScore * 0.5;

    // Course count contribution (up to 30)
    confidence += Math.min(courseCount * 2, 30);

    // Years with data contribution (up to 20)
    confidence += dataCompleteness.yearsWithData.length * 5;

    return Math.min(confidence, 100);
  }
}

// ============================================================================
// SINGLETON & CONVENIENCE EXPORTS
// ============================================================================

export const capabilityProfiler = new CapabilityProfiler();

export function buildCapabilityProfile(input: CapabilityProfileInput): CapabilityProfileResult {
  return capabilityProfiler.buildProfile(input);
}

// Make optimalDifficulty available for the guidance generator
const optimalDifficulty = { recommendedAPCount: { optimal: 0, maximum: 0 } };
