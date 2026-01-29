/**
 * Progression Teaching Engine
 *
 * Transforms nuanced capability analysis into actionable, personalized guidance.
 *
 * Philosophy:
 * - Teaching should RESOLVE the analysis, not repeat it
 * - Every recommendation must have a clear "why" and "how"
 * - Guidance should be specific to THIS student's patterns, not generic advice
 * - The goal is empowering the student to make optimal decisions
 *
 * Key Distinction from Analysis:
 * - Analysis: "Your grades drop 0.3 points when moving to AP"
 * - Teaching: "Here's how to decide if AP Calculus makes sense for YOU next year..."
 */

import type { CourseRecord } from '../types';
import {
  NuancedCapabilityAnalysis,
  PerformanceFingerprint,
  SubjectPatternMap,
  SubjectPattern,
  ChallengeResponseAnalysis,
  ProgressionTrajectory,
  PerformanceEnvelope,
  CapabilitySynthesis,
} from './nuancedCapabilityAnalyzer';
import { GPA_TO_GRADE } from './types';

// ============================================================================
// TEACHING OUTPUT TYPES
// ============================================================================

/**
 * Complete progression teaching - the actionable synthesis of all analysis.
 * This is what the student actually receives as guidance.
 */
export interface ProgressionTeaching {
  // The big picture
  strategicOverview: StrategicOverview;

  // Specific semester/year recommendations
  nextSemesterPlan: SemesterPlan;
  futureYearOutlook: FutureYearOutlook;

  // Subject-by-subject guidance
  subjectGuidance: SubjectGuidance[];

  // Decision frameworks for the student
  decisionFrameworks: DecisionFramework[];

  // Warning signs and course corrections
  courseCorrections: CourseCorrectionGuidance;

  // Motivational framing
  motivation: MotivationalFraming;
}

/**
 * The high-level strategic view - what this student should understand about their path.
 */
export interface StrategicOverview {
  /**
   * One sentence summary of their optimal strategy
   */
  coreStrategy: string;

  /**
   * 2-3 sentence expansion of what this means practically
   */
  practicalMeaning: string;

  /**
   * What success looks like for THIS student (specific to their capability profile)
   */
  successDefinition: string;

  /**
   * What to prioritize vs deprioritize
   */
  priorities: {
    prioritize: string[];
    deprioritize: string[];
  };

  /**
   * The key question they should ask before any course decision
   */
  decisionLens: string;
}

/**
 * Concrete plan for the upcoming semester.
 */
export interface SemesterPlan {
  /**
   * Recommended total course load
   */
  recommendedLoad: {
    totalCourses: number;
    apIbCount: { min: number; max: number; ideal: number };
    honorsCount: { min: number; max: number; ideal: number };
    reasoning: string;
  };

  /**
   * Specific course type recommendations
   */
  courseTypeRecommendations: CourseTypeRecommendation[];

  /**
   * Balance guidance - how to think about mixing difficulty
   */
  balanceGuidance: string;

  /**
   * What would be too much for this student
   */
  overloadWarning: string;

  /**
   * Expected GPA outcome if they follow this plan
   */
  expectedOutcome: {
    gpaRange: { low: number; high: number };
    confidence: number;
    reasoning: string;
  };
}

export interface CourseTypeRecommendation {
  courseType: string; // e.g., "math", "science", "english"
  recommendedLevel: 'ap_ib' | 'honors' | 'regular';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  alternativeIfAvailable?: {
    level: 'ap_ib' | 'honors' | 'regular';
    conditions: string;
  };
}

/**
 * Looking ahead - what to aim for in future years.
 */
export interface FutureYearOutlook {
  /**
   * Trajectory they're on
   */
  currentTrajectory: string;

  /**
   * Where they could realistically be by senior year
   */
  seniorYearProjection: {
    expectedGPA: { low: number; high: number };
    expectedRigorLevel: string;
    narrative: string;
  };

  /**
   * Year-by-year progression advice
   */
  yearByYearGuidance: YearGuidance[];

  /**
   * Key milestones to aim for
   */
  milestones: Milestone[];
}

export interface YearGuidance {
  year: string;
  focusAreas: string[];
  rigorRecommendation: string;
  gpaTarget: number;
  keyAdvice: string;
}

export interface Milestone {
  timing: string;
  milestone: string;
  why: string;
  howToAchieve: string;
}

/**
 * Subject-specific guidance - actionable advice for each academic area.
 */
export interface SubjectGuidance {
  subject: string;

  /**
   * Current standing in this subject
   */
  currentStanding: {
    level: string;
    performance: string;
    trend: string;
  };

  /**
   * Recommended next step
   */
  nextStep: {
    recommendation: string;
    level: 'ap_ib' | 'honors' | 'regular';
    reasoning: string;
    expectedOutcome: string;
  };

  /**
   * If they want to push harder
   */
  stretchOption?: {
    option: string;
    risk: string;
    reward: string;
    conditions: string;
  };

  /**
   * If they're struggling
   */
  supportOption?: {
    option: string;
    benefit: string;
    noShame: string;
  };

  /**
   * Long-term path in this subject
   */
  longTermPath: string;
}

/**
 * Decision frameworks - tools for the student to make their own choices.
 */
export interface DecisionFramework {
  name: string;
  description: string;
  questions: string[];
  guidance: string;
}

/**
 * When and how to course correct.
 */
export interface CourseCorrectionGuidance {
  /**
   * Warning signs that the load is too heavy
   */
  warningSignals: string[];

  /**
   * When each signal appears, what to do
   */
  responses: CorrectionResponse[];

  /**
   * Proactive monitoring advice
   */
  proactiveMonitoring: string;

  /**
   * It's okay to adjust
   */
  normalizingMessage: string;
}

export interface CorrectionResponse {
  signal: string;
  response: string;
  timeline: string;
}

/**
 * Framing that motivates rather than discourages.
 */
export interface MotivationalFraming {
  /**
   * Reframe their situation positively
   */
  positiveReframe: string;

  /**
   * What they have going for them
   */
  strengths: string[];

  /**
   * The empowering truth about their path
   */
  empoweringTruth: string;

  /**
   * What admissions officers will see
   */
  admissionsNarrative: string;
}

// ============================================================================
// TEACHING ENGINE CLASS
// ============================================================================

export class ProgressionTeachingEngine {
  /**
   * Generate comprehensive progression teaching from nuanced analysis.
   */
  generateTeaching(
    analysis: NuancedCapabilityAnalysis,
    options: {
      currentYear?: 'freshman' | 'sophomore' | 'junior' | 'senior';
      intendedMajor?: string;
      targetSelectivity?: 'ivy_plus' | 'top_25' | 'top_50' | 'any';
    } = {}
  ): ProgressionTeaching {
    const currentYear = options.currentYear || 'sophomore';
    const targetSelectivity = options.targetSelectivity || 'top_50';

    return {
      strategicOverview: this.generateStrategicOverview(analysis, targetSelectivity),
      nextSemesterPlan: this.generateSemesterPlan(analysis, currentYear),
      futureYearOutlook: this.generateFutureOutlook(analysis, currentYear),
      subjectGuidance: this.generateSubjectGuidance(analysis, options.intendedMajor),
      decisionFrameworks: this.generateDecisionFrameworks(analysis),
      courseCorrections: this.generateCourseCorrectionGuidance(analysis),
      motivation: this.generateMotivationalFraming(analysis, targetSelectivity),
    };
  }

  // ============================================================================
  // STRATEGIC OVERVIEW
  // ============================================================================

  private generateStrategicOverview(
    analysis: NuancedCapabilityAnalysis,
    targetSelectivity: string
  ): StrategicOverview {
    const { performanceFingerprint, challengeResponse, synthesis } = analysis;
    const sweetSpot = performanceFingerprint.sweetSpot;
    const risk = challengeResponse.challengeRiskProfile.riskLevel;

    // Determine core strategy based on their profile
    let coreStrategy: string;
    let practicalMeaning: string;
    let decisionLens: string;

    if (risk < 30 && performanceFingerprint.difficultySensitivity === 'low') {
      // Low risk, can push
      coreStrategy = `Maximize rigor in your strengths while protecting your GPA - you have the track record to do both.`;
      practicalMeaning = `Your grades hold up well when challenged. This means you can take AP/IB courses in subjects where you're strong without significant GPA risk. The key is being strategic about where you push, not pushing everywhere.`;
      decisionLens = `"Can I get an A or A- in this course while being appropriately challenged?"`;
    } else if (risk > 60 || performanceFingerprint.difficultySensitivity === 'high') {
      // High risk, protect GPA
      coreStrategy = `Your GPA is your priority - take the difficulty level that lets you shine.`;
      practicalMeaning = `Your grades are sensitive to difficulty level, which means course selection significantly impacts your GPA. This isn't a weakness - it means you need to be strategic. Taking honors where others take AP, and doing excellent work, is smarter than struggling in AP for the label.`;
      decisionLens = `"At which difficulty level will I achieve my best possible grade?"`;
    } else {
      // Moderate - balanced approach
      coreStrategy = `Balance challenge and achievement - push in your strengths, protect elsewhere.`;
      practicalMeaning = `You can handle increased difficulty in some areas but not across the board. The smart approach is taking AP/IB in 2-3 subjects where you're strongest, and staying at honors or regular elsewhere. This optimizes both your rigor story and your GPA.`;
      decisionLens = `"Is this a subject where I can push, or one where I should protect my GPA?"`;
    }

    // Build priorities
    const priorities = this.buildPriorities(analysis, targetSelectivity);

    // Success definition
    const successDefinition = this.defineSuccess(analysis, sweetSpot, targetSelectivity);

    return {
      coreStrategy,
      practicalMeaning,
      successDefinition,
      priorities,
      decisionLens,
    };
  }

  private buildPriorities(
    analysis: NuancedCapabilityAnalysis,
    targetSelectivity: string
  ): StrategicOverview['priorities'] {
    const prioritize: string[] = [];
    const deprioritize: string[] = [];

    // Always prioritize
    prioritize.push('Maintaining or improving your GPA trajectory');
    prioritize.push('Taking challenging courses in your strongest subjects');

    // Based on profile
    if (analysis.performanceFingerprint.difficultySensitivity === 'high') {
      prioritize.push('Protecting your GPA through strategic course selection');
      deprioritize.push('Taking AP/IB courses just for the label');
    }

    if (analysis.progressionTrajectory.historical.overallTrend === 'improving') {
      prioritize.push('Continuing your upward momentum');
      deprioritize.push('Overloading and risking your trajectory');
    }

    // Add subject-specific
    const strengths = Object.entries(analysis.subjectPatterns)
      .filter(([_, p]) => p.relativeStrength > 0.2)
      .map(([s]) => this.formatSubject(s));

    if (strengths.length > 0) {
      prioritize.push(`Pushing yourself in ${strengths.join(', ')}`);
    }

    const challenges = Object.entries(analysis.subjectPatterns)
      .filter(([_, p]) => p.relativeStrength < -0.2)
      .map(([s]) => this.formatSubject(s));

    if (challenges.length > 0) {
      deprioritize.push(`Overextending in ${challenges.join(', ')}`);
    }

    // Target-specific
    if (targetSelectivity === 'ivy_plus' || targetSelectivity === 'top_25') {
      prioritize.push('Building a compelling academic narrative through depth');
      deprioritize.push('Breadth at the expense of excellence');
    }

    return { prioritize, deprioritize };
  }

  private defineSuccess(
    analysis: NuancedCapabilityAnalysis,
    sweetSpot: PerformanceFingerprint['sweetSpot'],
    targetSelectivity: string
  ): string {
    const expectedGrade = GPA_TO_GRADE(sweetSpot.expectedGPA);
    const trajectory = analysis.progressionTrajectory.historical.overallTrend;

    if (sweetSpot.level === 'ap_ib' && sweetSpot.expectedGPA >= 3.7) {
      return `Success for you means excelling in rigorous AP/IB courses (${expectedGrade} grades) while maintaining an upward trajectory. You're positioned to show both challenge-seeking and achievement.`;
    } else if (sweetSpot.level === 'honors') {
      return `Success for you means strong performance in honors courses (${expectedGrade} grades), with selective AP/IB in your strongest areas. This demonstrates appropriate challenge while maximizing your GPA.`;
    } else {
      return `Success for you means excellent grades (${expectedGrade}) in courses that match your level, with gradual difficulty increases as you build confidence. Strong grades in appropriate courses beat mediocre grades in harder ones.`;
    }
  }

  // ============================================================================
  // SEMESTER PLAN
  // ============================================================================

  private generateSemesterPlan(
    analysis: NuancedCapabilityAnalysis,
    currentYear: string
  ): SemesterPlan {
    const { performanceFingerprint, challengeResponse, performanceEnvelope } = analysis;
    const risk = challengeResponse.challengeRiskProfile.riskLevel;

    // Determine AP/IB count based on profile
    let apCount: { min: number; max: number; ideal: number };
    let honorsCount: { min: number; max: number; ideal: number };

    if (risk < 30) {
      apCount = { min: 2, max: 5, ideal: 3 };
      honorsCount = { min: 1, max: 3, ideal: 2 };
    } else if (risk < 50) {
      apCount = { min: 1, max: 3, ideal: 2 };
      honorsCount = { min: 2, max: 4, ideal: 2 };
    } else if (risk < 70) {
      apCount = { min: 0, max: 2, ideal: 1 };
      honorsCount = { min: 2, max: 4, ideal: 3 };
    } else {
      apCount = { min: 0, max: 1, ideal: 0 };
      honorsCount = { min: 1, max: 3, ideal: 2 };
    }

    // Year-based adjustments
    if (currentYear === 'junior') {
      // Junior year is most important - be strategic but show rigor
      if (apCount.ideal < 2 && risk < 60) apCount.ideal = 2;
    } else if (currentYear === 'senior') {
      // Senior year - maintain rigor but avoid burnout
      apCount.max = Math.max(apCount.max - 1, 0);
    }

    // Generate course type recommendations
    const courseTypeRecommendations = this.generateCourseTypeRecommendations(analysis);

    // Balance guidance
    const balanceGuidance = this.generateBalanceGuidance(analysis, apCount, honorsCount);

    // Overload warning
    const overloadWarning = this.generateOverloadWarning(analysis, apCount);

    // Expected outcome
    const expectedOutcome = this.calculateExpectedOutcome(
      analysis,
      apCount.ideal,
      honorsCount.ideal
    );

    return {
      recommendedLoad: {
        totalCourses: 6,
        apIbCount: apCount,
        honorsCount: honorsCount,
        reasoning: this.explainLoadRecommendation(analysis, apCount, honorsCount),
      },
      courseTypeRecommendations,
      balanceGuidance,
      overloadWarning,
      expectedOutcome,
    };
  }

  private generateCourseTypeRecommendations(
    analysis: NuancedCapabilityAnalysis
  ): CourseTypeRecommendation[] {
    const recommendations: CourseTypeRecommendation[] = [];

    for (const [subject, pattern] of Object.entries(analysis.subjectPatterns)) {
      const rec: CourseTypeRecommendation = {
        courseType: subject,
        recommendedLevel: pattern.recommendedLevel,
        confidence:
          pattern.projectedOutcome.confidence > 70
            ? 'high'
            : pattern.projectedOutcome.confidence > 50
              ? 'medium'
              : 'low',
        reasoning: pattern.levelReasoning,
      };

      // Add stretch option if applicable
      if (pattern.relativeStrength > 0.1 && pattern.recommendedLevel !== 'ap_ib') {
        const nextLevel =
          pattern.recommendedLevel === 'regular' ? 'honors' : ('ap_ib' as const);
        rec.alternativeIfAvailable = {
          level: nextLevel,
          conditions: `If you're feeling confident in ${this.formatSubject(subject)} and your schedule isn't overloaded`,
        };
      }

      recommendations.push(rec);
    }

    return recommendations;
  }

  private generateBalanceGuidance(
    analysis: NuancedCapabilityAnalysis,
    apCount: { min: number; max: number; ideal: number },
    honorsCount: { min: number; max: number; ideal: number }
  ): string {
    const sensitivity = analysis.performanceFingerprint.difficultySensitivity;

    if (sensitivity === 'low') {
      return `Your grades are resilient to difficulty changes, so you have flexibility in how you balance your schedule. A good mix might be ${apCount.ideal} AP/IB courses in your strengths, ${honorsCount.ideal} honors courses, and the rest at regular level. You can adjust based on your interests and workload preferences.`;
    } else if (sensitivity === 'high') {
      return `Because your grades are sensitive to difficulty level, balance is crucial. Limit yourself to ${apCount.ideal} AP/IB courses maximum, ideally in your strongest subject${apCount.ideal > 1 ? 's' : ''}. Fill in with ${honorsCount.ideal} honors courses and keep at least one course at regular level as a "breather" in your schedule.`;
    } else {
      return `Balance means being strategic: ${apCount.ideal} AP/IB courses in subjects where you're strong, ${honorsCount.ideal} honors courses, and regular level elsewhere. Don't feel pressure to maximize rigor everywhere - optimal performance beats maximum difficulty.`;
    }
  }

  private generateOverloadWarning(
    analysis: NuancedCapabilityAnalysis,
    apCount: { min: number; max: number; ideal: number }
  ): string {
    const maxSafe = apCount.max;
    const risk = analysis.challengeResponse.challengeRiskProfile.riskLevel;

    if (risk > 60) {
      return `Taking more than ${maxSafe} AP/IB course${maxSafe > 1 ? 's' : ''} would likely hurt your GPA based on your history. Remember: a B in AP is not better than an A in honors for your transcript.`;
    } else if (risk > 30) {
      return `Going beyond ${maxSafe + 1} AP/IB courses risks spreading yourself too thin. Your past performance shows you can handle challenge, but there's a limit. Leave room for excellence, not just survival.`;
    } else {
      return `While you handle challenge well, even strong students have limits. More than ${maxSafe + 2} AP/IB courses likely means compromising on quality somewhere. Aim for depth over breadth.`;
    }
  }

  private calculateExpectedOutcome(
    analysis: NuancedCapabilityAnalysis,
    apCount: number,
    honorsCount: number
  ): SemesterPlan['expectedOutcome'] {
    const fingerprint = analysis.performanceFingerprint;
    const envelope = analysis.performanceEnvelope;

    // Weight by course mix
    let expectedGPA = 0;
    let totalWeight = 0;

    if (fingerprint.expectedGPAByLevel.ap_ib && apCount > 0) {
      expectedGPA += fingerprint.expectedGPAByLevel.ap_ib.expectedGPA * apCount;
      totalWeight += apCount;
    }

    if (fingerprint.expectedGPAByLevel.honors && honorsCount > 0) {
      expectedGPA += fingerprint.expectedGPAByLevel.honors.expectedGPA * honorsCount;
      totalWeight += honorsCount;
    }

    // Assume remaining courses are regular
    const regularCount = 6 - apCount - honorsCount;
    if (fingerprint.expectedGPAByLevel.regular && regularCount > 0) {
      expectedGPA += fingerprint.expectedGPAByLevel.regular.expectedGPA * regularCount;
      totalWeight += regularCount;
    }

    expectedGPA = totalWeight > 0 ? expectedGPA / totalWeight : envelope.comfortableRange.typicalGPA;

    // Calculate range
    const variance = 0.15; // Typical variance
    const confidence = Math.min(fingerprint.consistencyScore, 85);

    return {
      gpaRange: {
        low: Math.max(2.0, expectedGPA - variance),
        high: Math.min(4.0, expectedGPA + variance * 0.5),
      },
      confidence,
      reasoning: `Based on your historical performance at each difficulty level, with ${apCount} AP/IB and ${honorsCount} honors courses, you can expect grades in the ${GPA_TO_GRADE(expectedGPA - variance)} to ${GPA_TO_GRADE(expectedGPA + variance * 0.5)} range.`,
    };
  }

  private explainLoadRecommendation(
    analysis: NuancedCapabilityAnalysis,
    apCount: { min: number; max: number; ideal: number },
    honorsCount: { min: number; max: number; ideal: number }
  ): string {
    const risk = analysis.challengeResponse.challengeRiskProfile.riskLevel;
    const sensitivity = analysis.performanceFingerprint.difficultySensitivity;

    if (risk < 30) {
      return `Your track record shows you thrive under challenge. ${apCount.ideal} AP/IB courses is aggressive but achievable for you, leaving room for ${honorsCount.ideal} honors courses for balance.`;
    } else if (risk < 50) {
      return `You handle difficulty well in your strengths but should be selective. ${apCount.ideal} AP/IB courses in your best subjects, plus ${honorsCount.ideal} honors courses, balances challenge with GPA protection.`;
    } else if (risk < 70) {
      return `Your grades are sensitive to difficulty, so a lighter rigor load protects your GPA. ${apCount.ideal > 0 ? `${apCount.ideal} AP/IB in your strongest area` : 'Skipping AP/IB this semester'} is strategic, not weak.`;
    } else {
      return `Protecting your GPA should be your priority. ${apCount.ideal > 0 ? `At most ${apCount.ideal} AP/IB course` : 'Staying with honors and regular courses'} lets you achieve your best grades.`;
    }
  }

  // ============================================================================
  // FUTURE YEAR OUTLOOK
  // ============================================================================

  private generateFutureOutlook(
    analysis: NuancedCapabilityAnalysis,
    currentYear: string
  ): FutureYearOutlook {
    const trajectory = analysis.progressionTrajectory;
    const envelope = analysis.performanceEnvelope;

    // Current trajectory description
    const currentTrajectory = this.describeTrajectory(trajectory);

    // Senior year projection
    const seniorYearProjection = this.projectSeniorYear(analysis, currentYear);

    // Year-by-year guidance
    const yearByYearGuidance = this.generateYearByYearGuidance(analysis, currentYear);

    // Milestones
    const milestones = this.generateMilestones(analysis, currentYear);

    return {
      currentTrajectory,
      seniorYearProjection,
      yearByYearGuidance,
      milestones,
    };
  }

  private describeTrajectory(trajectory: ProgressionTrajectory): string {
    const trend = trajectory.historical.overallTrend;
    const projected = trajectory.projected;

    if (trend === 'accelerating') {
      return `You're on an accelerating upward trajectory - your performance is improving faster over time. This is the ideal pattern admissions officers want to see. Keep building momentum.`;
    } else if (trend === 'improving') {
      return `You're showing steady improvement year over year. This upward trend tells a great story - a student who rises to challenges and keeps getting better.`;
    } else if (trend === 'stable' && projected.ceilingEstimate >= 3.7) {
      return `Your performance is consistently strong. While there isn't an upward trend, sustained excellence is its own achievement. Focus on maintaining this level while adding depth.`;
    } else if (trend === 'plateauing') {
      return `You've reached a plateau - your performance has stabilized at your current level. This isn't bad, but there may be room to push further in select areas without risking your base.`;
    } else if (trend === 'declining') {
      return `Recent performance shows a downward trend. This is the most important thing to address - colleges weight recent grades heavily. Focus on stabilization before adding challenge.`;
    } else {
      return `Your performance has been consistent. The next step is identifying where you can show growth without risking what you've built.`;
    }
  }

  private projectSeniorYear(
    analysis: NuancedCapabilityAnalysis,
    currentYear: string
  ): FutureYearOutlook['seniorYearProjection'] {
    const trajectory = analysis.progressionTrajectory;
    const fingerprint = analysis.performanceFingerprint;

    // Project based on trend and capability
    let expectedGPA: { low: number; high: number };
    let rigorLevel: string;
    let narrative: string;

    if (trajectory.historical.overallTrend === 'improving' || trajectory.historical.overallTrend === 'accelerating') {
      expectedGPA = {
        low: Math.min(trajectory.projected.nextYearGPA.expected, 4.0),
        high: Math.min(trajectory.projected.ceilingEstimate, 4.0),
      };
      rigorLevel = fingerprint.sweetSpot.level === 'ap_ib' ? '4-5 AP/IB courses' : '2-3 AP/IB courses with honors';
      narrative = `If you maintain your trajectory, senior year can be your strongest yet. Your pattern suggests you'll be ready for ${rigorLevel} while maintaining ${GPA_TO_GRADE(expectedGPA.low)}-${GPA_TO_GRADE(expectedGPA.high)} grades.`;
    } else if (trajectory.historical.overallTrend === 'declining') {
      const currentGPA = trajectory.historical.gpaByYear[trajectory.historical.gpaByYear.length - 1]?.gpa || 3.0;
      expectedGPA = {
        low: Math.max(currentGPA - 0.2, 2.5),
        high: currentGPA + 0.1,
      };
      rigorLevel = 'appropriate to your demonstrated capability';
      narrative = `Priority one is stabilizing your trend before senior year. Focus on rebuilding momentum now, so senior year can show recovery. Colleges value bounce-back stories.`;
    } else {
      const currentGPA = trajectory.historical.gpaByYear[trajectory.historical.gpaByYear.length - 1]?.gpa || 3.0;
      expectedGPA = {
        low: currentGPA - 0.1,
        high: Math.min(currentGPA + 0.15, 4.0),
      };
      rigorLevel = fingerprint.sweetSpot.level === 'ap_ib' ? '3-4 AP/IB courses' : '2-3 AP/IB courses';
      narrative = `Your stable performance provides a solid foundation. Senior year success means maintaining your level (${GPA_TO_GRADE(currentGPA)} range) with ${rigorLevel}, showing sustained capability.`;
    }

    return { expectedGPA, expectedRigorLevel: rigorLevel, narrative };
  }

  private generateYearByYearGuidance(
    analysis: NuancedCapabilityAnalysis,
    currentYear: string
  ): YearGuidance[] {
    const guidance: YearGuidance[] = [];
    const years = ['freshman', 'sophomore', 'junior', 'senior'];
    const currentIndex = years.indexOf(currentYear);

    for (let i = currentIndex; i < years.length; i++) {
      const year = years[i];
      guidance.push(this.generateYearGuidance(analysis, year, i === currentIndex));
    }

    return guidance;
  }

  private generateYearGuidance(
    analysis: NuancedCapabilityAnalysis,
    year: string,
    isCurrent: boolean
  ): YearGuidance {
    const fingerprint = analysis.performanceFingerprint;
    const risk = analysis.challengeResponse.challengeRiskProfile.riskLevel;

    const yearWeights: Record<string, number> = {
      freshman: 0.2,
      sophomore: 0.25,
      junior: 0.35,
      senior: 0.2,
    };

    const weight = yearWeights[year] || 0.25;
    const sweetSpotGPA = fingerprint.sweetSpot.expectedGPA;

    let focusAreas: string[];
    let rigorRecommendation: string;
    let gpaTarget: number;
    let keyAdvice: string;

    if (year === 'junior') {
      focusAreas = ['Peak rigor in your strongest subjects', 'Maintain or improve GPA', 'Build compelling narrative'];
      rigorRecommendation = risk < 50
        ? 'This is your year to show maximum appropriate rigor - push in your strengths'
        : 'Show rigor strategically - quality over quantity of AP courses';
      gpaTarget = Math.min(sweetSpotGPA + 0.1, 4.0);
      keyAdvice = `Junior year carries ${(weight * 100).toFixed(0)}% of the weight in admissions evaluation. This is when to show what you're capable of - but only in ways that demonstrate excellence, not struggle.`;
    } else if (year === 'senior') {
      focusAreas = ['Maintain rigor level', 'Avoid "senioritis"', 'Strong first semester for applications'];
      rigorRecommendation = 'Maintain junior year rigor level - don\'t drop down, but no need to add more';
      gpaTarget = sweetSpotGPA;
      keyAdvice = `Senior year grades matter for acceptances AND continued enrollment. 22% of rescissions cite senior grade drops. Keep your foot on the gas through May.`;
    } else if (year === 'sophomore') {
      focusAreas = ['Build foundation for rigor', 'Identify your strengths', 'Start selective AP/honors'];
      rigorRecommendation = risk < 40
        ? 'Start building your rigor story with 1-2 AP courses in strong subjects'
        : 'Focus on honors courses with excellent grades - AP can come later';
      gpaTarget = sweetSpotGPA;
      keyAdvice = `Sophomore year is about building momentum. ${isCurrent ? 'Focus on' : 'You should have focused on'} identifying where you excel and setting up for a strong junior year.`;
    } else {
      focusAreas = ['Establish strong foundation', 'Explore subjects', 'Build good habits'];
      rigorRecommendation = 'Focus on foundational excellence before adding difficulty';
      gpaTarget = 3.5;
      keyAdvice = `Freshman year is about building habits and identifying strengths. Strong grades here set up everything that follows.`;
    }

    return { year: this.capitalizeFirst(year), focusAreas, rigorRecommendation, gpaTarget, keyAdvice };
  }

  private generateMilestones(
    analysis: NuancedCapabilityAnalysis,
    currentYear: string
  ): Milestone[] {
    const milestones: Milestone[] = [];
    const fingerprint = analysis.performanceFingerprint;

    // Universal milestones
    milestones.push({
      timing: 'End of each semester',
      milestone: 'Review and adjust',
      why: 'Catch issues early before they compound',
      howToAchieve: 'Look at your grades honestly. If anything is below your target, adjust your approach or schedule for next semester.',
    });

    // Trajectory-specific
    if (analysis.progressionTrajectory.historical.overallTrend === 'improving') {
      milestones.push({
        timing: 'Junior year, first semester',
        milestone: 'Achieve peak GPA',
        why: 'Junior year first semester grades appear on applications',
        howToAchieve: 'This is when everything comes together. Your preparation pays off here.',
      });
    }

    // Subject-specific
    const strongestSubject = Object.entries(analysis.subjectPatterns)
      .sort(([, a], [, b]) => b.relativeStrength - a.relativeStrength)[0];

    if (strongestSubject) {
      milestones.push({
        timing: 'Before senior year',
        milestone: `AP/IB achievement in ${this.formatSubject(strongestSubject[0])}`,
        why: 'Depth in your strongest area tells a compelling story',
        howToAchieve: `If you haven't already, taking AP ${this.formatSubject(strongestSubject[0])} demonstrates mastery of your strength area.`,
      });
    }

    return milestones;
  }

  // ============================================================================
  // SUBJECT GUIDANCE
  // ============================================================================

  private generateSubjectGuidance(
    analysis: NuancedCapabilityAnalysis,
    intendedMajor?: string
  ): SubjectGuidance[] {
    const guidance: SubjectGuidance[] = [];

    for (const [subject, pattern] of Object.entries(analysis.subjectPatterns)) {
      const subjectGuidance = this.generateSingleSubjectGuidance(
        subject,
        pattern,
        analysis,
        intendedMajor
      );
      guidance.push(subjectGuidance);
    }

    // Sort by relevance (major-related first, then by strength)
    return guidance.sort((a, b) => {
      // Major-related subjects first
      if (intendedMajor) {
        const aRelevant = this.isRelevantToMajor(a.subject, intendedMajor);
        const bRelevant = this.isRelevantToMajor(b.subject, intendedMajor);
        if (aRelevant && !bRelevant) return -1;
        if (bRelevant && !aRelevant) return 1;
      }
      return 0; // Keep natural order otherwise
    });
  }

  private generateSingleSubjectGuidance(
    subject: string,
    pattern: SubjectPattern,
    analysis: NuancedCapabilityAnalysis,
    intendedMajor?: string
  ): SubjectGuidance {
    const formattedSubject = this.formatSubject(subject);
    const isStrength = pattern.relativeStrength > 0.1;
    const isChallenge = pattern.relativeStrength < -0.1;
    const isMajorRelevant = intendedMajor ? this.isRelevantToMajor(subject, intendedMajor) : false;

    // Current standing
    const currentStanding = {
      level: this.formatLevel(pattern.recommendedLevel),
      performance: `${GPA_TO_GRADE(pattern.performanceHistory.avgGPA)} average`,
      trend: pattern.performanceHistory.trend === 'improving'
        ? 'Improving'
        : pattern.performanceHistory.trend === 'declining'
          ? 'Declining (needs attention)'
          : 'Stable',
    };

    // Next step recommendation
    const nextStep = {
      recommendation: this.generateNextStepRecommendation(pattern, isStrength, isChallenge, isMajorRelevant),
      level: pattern.recommendedLevel,
      reasoning: pattern.levelReasoning,
      expectedOutcome: `Expected grade: ${pattern.projectedOutcome.expectedGrade} (${pattern.projectedOutcome.confidence}% confidence)`,
    };

    // Stretch option (for non-AP subjects where student is doing well)
    let stretchOption: SubjectGuidance['stretchOption'] | undefined;
    if (pattern.recommendedLevel !== 'ap_ib' && pattern.performanceHistory.avgGPA >= 3.5) {
      const nextLevel = pattern.recommendedLevel === 'regular' ? 'Honors' : 'AP/IB';
      stretchOption = {
        option: `Try ${nextLevel} ${formattedSubject}`,
        risk: this.assessStretchRisk(pattern, analysis),
        reward: isMajorRelevant
          ? `Shows depth in your intended field`
          : `Adds rigor to your transcript`,
        conditions: `Only if your schedule has room and you're confident in ${formattedSubject}`,
      };
    }

    // Support option (for challenge areas or declining trends)
    let supportOption: SubjectGuidance['supportOption'] | undefined;
    if (isChallenge || pattern.performanceHistory.trend === 'declining') {
      supportOption = {
        option: `Consider ${this.formatLevel(this.getLowerLevel(pattern.recommendedLevel))} level`,
        benefit: `Protect your GPA and rebuild confidence in ${formattedSubject}`,
        noShame: `Taking appropriate difficulty is strategic, not giving up. Your best grade at the right level beats a struggle grade at the wrong level.`,
      };
    }

    // Long-term path
    const longTermPath = this.generateLongTermPath(pattern, isStrength, isMajorRelevant, formattedSubject);

    return {
      subject: formattedSubject,
      currentStanding,
      nextStep,
      stretchOption,
      supportOption,
      longTermPath,
    };
  }

  private generateNextStepRecommendation(
    pattern: SubjectPattern,
    isStrength: boolean,
    isChallenge: boolean,
    isMajorRelevant: boolean
  ): string {
    if (isStrength) {
      if (pattern.recommendedLevel === 'ap_ib') {
        return 'Continue at AP/IB level - this is where you shine';
      } else {
        return isMajorRelevant
          ? 'Consider stepping up to show depth in your intended major area'
          : 'Strong foundation - can push higher if schedule allows';
      }
    } else if (isChallenge) {
      return 'Focus on building confidence here - take the level that lets you succeed';
    } else {
      return `Continue at ${this.formatLevel(pattern.recommendedLevel)} - it's your sweet spot here`;
    }
  }

  private assessStretchRisk(pattern: SubjectPattern, analysis: NuancedCapabilityAnalysis): string {
    const sensitivity = analysis.performanceFingerprint.difficultySensitivity;
    const trend = pattern.performanceHistory.trend;

    if (sensitivity === 'low' && trend !== 'declining') {
      return 'Low risk - your grades typically hold up when challenged';
    } else if (sensitivity === 'high' || trend === 'declining') {
      return 'Higher risk - be cautious about stretching here';
    } else {
      return 'Moderate risk - success depends on your preparation and workload';
    }
  }

  private getLowerLevel(level: 'ap_ib' | 'honors' | 'regular'): 'ap_ib' | 'honors' | 'regular' {
    if (level === 'ap_ib') return 'honors';
    if (level === 'honors') return 'regular';
    return 'regular';
  }

  private generateLongTermPath(
    pattern: SubjectPattern,
    isStrength: boolean,
    isMajorRelevant: boolean,
    formattedSubject: string
  ): string {
    if (isStrength && isMajorRelevant) {
      return `${formattedSubject} is both a strength and relevant to your intended path. Build depth here - take the most rigorous courses available and aim for top grades. This becomes part of your application narrative.`;
    } else if (isStrength) {
      return `${formattedSubject} is a strength area. Continue pushing yourself here while maintaining excellence. This adds credibility to your academic profile.`;
    } else if (isMajorRelevant) {
      return `${formattedSubject} is relevant to your intended major, but it's currently a challenge area. Focus on building competence first - solid grades at appropriate difficulty beat struggling at AP level.`;
    } else {
      return `${formattedSubject} isn't central to your path. Take the level that lets you do well without consuming time and energy you need elsewhere.`;
    }
  }

  private isRelevantToMajor(subject: string, intendedMajor: string): boolean {
    const majorLower = intendedMajor.toLowerCase();
    const subjectLower = subject.toLowerCase();

    const relevanceMap: Record<string, string[]> = {
      computer_science: ['math', 'science', 'computer'],
      engineering: ['math', 'science', 'physics'],
      biology: ['science', 'math', 'biology'],
      chemistry: ['science', 'math', 'chemistry'],
      physics: ['science', 'math', 'physics'],
      medicine: ['science', 'biology', 'chemistry', 'math'],
      business: ['math', 'economics', 'social'],
      economics: ['math', 'economics', 'social'],
      psychology: ['science', 'social', 'math'],
      english: ['english', 'writing', 'humanities'],
      history: ['social', 'history', 'humanities'],
      political_science: ['social', 'history', 'economics'],
    };

    // Check if subject matches major's relevant subjects
    for (const [major, relevantSubjects] of Object.entries(relevanceMap)) {
      if (majorLower.includes(major) || major.includes(majorLower)) {
        return relevantSubjects.some(
          (s) => subjectLower.includes(s) || s.includes(subjectLower)
        );
      }
    }

    return false;
  }

  // ============================================================================
  // DECISION FRAMEWORKS
  // ============================================================================

  private generateDecisionFrameworks(analysis: NuancedCapabilityAnalysis): DecisionFramework[] {
    const frameworks: DecisionFramework[] = [];

    // Core decision framework
    frameworks.push({
      name: 'The AP/IB Decision Framework',
      description: 'Use this when deciding whether to take an AP or IB course in a specific subject.',
      questions: [
        'What grade do I realistically expect to get in this AP/IB course?',
        'What grade would I get in the honors or regular version?',
        'Is this a subject where I\'m strong or struggling?',
        'How many other challenging courses am I taking?',
        'Is this subject relevant to my intended major or interests?',
      ],
      guidance: this.generateAPDecisionGuidance(analysis),
    });

    // Workload balancing framework
    frameworks.push({
      name: 'The Schedule Balance Check',
      description: 'Use this to evaluate if your overall course load is sustainable.',
      questions: [
        'Do I have at least one course that feels "easier" or more enjoyable?',
        'Am I taking AP/IB in more than one subject where I struggle?',
        'Do I have time for extracurriculars I care about?',
        'Would this schedule leave me sleep-deprived or burnt out?',
        'What happens to my other grades if I add this course?',
      ],
      guidance: 'A good schedule has challenge AND breathing room. If every course is a struggle, something will give - usually your mental health or your grades.',
    });

    // Major alignment framework
    frameworks.push({
      name: 'The "Does This Matter?" Test',
      description: 'Use this to prioritize which courses deserve your maximum effort.',
      questions: [
        'Is this subject related to my intended major or career?',
        'Is this a "spike" area that differentiates me?',
        'Would dropping a level here free up energy for something more important?',
        'What story does this course tell on my transcript?',
      ],
      guidance: 'Not all A\'s are equal, and not all rigor is equal. An A in AP Calculus matters more for STEM majors than an A in AP Art History. Allocate your effort accordingly.',
    });

    return frameworks;
  }

  private generateAPDecisionGuidance(analysis: NuancedCapabilityAnalysis): string {
    const risk = analysis.challengeResponse.challengeRiskProfile.riskLevel;

    if (risk < 30) {
      return 'Given your track record, if you expect at least a B+ in the AP version and it\'s a strength subject, go for it. Your grades typically hold up under challenge.';
    } else if (risk < 60) {
      return 'Only take AP if: (1) it\'s a strength subject, (2) you\'re confident in at least a B, and (3) your schedule isn\'t already heavy. Otherwise, honors with an A is better than AP with a B.';
    } else {
      return 'Your grades are sensitive to difficulty. Only take AP if you\'re very confident in your ability to get an A- or better. For most subjects, honors or regular with excellent grades is your optimal strategy.';
    }
  }

  // ============================================================================
  // COURSE CORRECTION GUIDANCE
  // ============================================================================

  private generateCourseCorrectionGuidance(
    analysis: NuancedCapabilityAnalysis
  ): CourseCorrectionGuidance {
    const warningSignals = [
      'Grade dropping below B in any course for more than 2 weeks',
      'Feeling consistently overwhelmed or anxious about workload',
      'Regularly pulling all-nighters to keep up',
      'Falling behind in multiple classes simultaneously',
      'Physical symptoms: insomnia, loss of appetite, frequent illness',
      'Losing interest in extracurriculars you used to enjoy',
    ];

    const responses: CorrectionResponse[] = [
      {
        signal: 'One grade dropping',
        response: 'Talk to the teacher immediately. Get tutoring. Dedicate extra study time. Often fixable with focused effort.',
        timeline: 'Address within 1 week',
      },
      {
        signal: 'Multiple grades dropping',
        response: 'Meet with your counselor. Consider dropping one level in your weakest non-essential course. Better to protect 5 grades than lose all 6.',
        timeline: 'Address within 2 weeks',
      },
      {
        signal: 'Consistent overwhelm',
        response: 'Schedule audit needed. Something has to give - either drop a course level, cut an extracurricular, or adjust expectations. This is not sustainable.',
        timeline: 'Address immediately',
      },
      {
        signal: 'Physical/mental symptoms',
        response: 'Your health is more important than any grade. Talk to your parents and counselor. Consider significant schedule changes. Colleges rescind acceptances for fraud, not for being human.',
        timeline: 'Address today',
      },
    ];

    const proactiveMonitoring = `Check your grades weekly, not at the end of the semester. Set a recurring reminder every Friday to review where you stand. Small problems addressed early don't become big problems later.`;

    const normalizingMessage = `Adjusting your schedule mid-year is not failure - it's wisdom. Many successful students have dropped from AP to honors when they recognized the fit wasn't right. Admissions officers would rather see strong grades in appropriate courses than a transcript that shows you drowning. Making smart adjustments is a sign of maturity and self-awareness.`;

    return {
      warningSignals,
      responses,
      proactiveMonitoring,
      normalizingMessage,
    };
  }

  // ============================================================================
  // MOTIVATIONAL FRAMING
  // ============================================================================

  private generateMotivationalFraming(
    analysis: NuancedCapabilityAnalysis,
    targetSelectivity: string
  ): MotivationalFraming {
    const synthesis = analysis.synthesis;
    const fingerprint = analysis.performanceFingerprint;
    const trajectory = analysis.progressionTrajectory.historical.overallTrend;

    // Positive reframe based on their situation
    let positiveReframe: string;
    if (fingerprint.difficultySensitivity === 'high') {
      positiveReframe = `Your grades being sensitive to difficulty isn't a weakness - it's information. It tells you exactly how to optimize: find the level where you can excel, and excel there. Some of the most successful students aren't the ones who took the most APs - they're the ones who knew where they could shine.`;
    } else if (trajectory === 'declining') {
      positiveReframe = `A declining trend is concerning, but it's also the most fixable problem. Colleges love comeback stories. Stabilizing now and showing improvement gives you a narrative of resilience and self-correction that flat "always excellent" students don't have.`;
    } else if (fingerprint.performancePercentile < 60) {
      positiveReframe = `You're building something real. Not everyone starts at the top, and that's okay. What matters is showing growth, effort, and knowing where you can succeed. Your path is your path - and there's a right college for every student who's willing to work.`;
    } else {
      positiveReframe = `Your academic profile is strong. The key now is strategic optimization - not adding more, but making the most of what you have. Every course decision should either showcase a strength or protect your foundation.`;
    }

    // Strengths
    const strengths = synthesis.strengths.map((s) => s.insight);
    if (strengths.length === 0) {
      strengths.push('You have the self-awareness to seek guidance');
      strengths.push('You\'re taking your future seriously');
    }

    // Empowering truth
    const empoweringTruth = `There is no single "right" level of rigor. The right level is the one that lets YOU perform YOUR best. A 4.0 in honors courses tells a better story than a 3.2 in all APs. Admissions officers know this. Your job is to find the level where you can both be challenged AND succeed.`;

    // Admissions narrative
    const admissionsNarrative = this.generateAdmissionsNarrative(analysis, targetSelectivity);

    return {
      positiveReframe,
      strengths,
      empoweringTruth,
      admissionsNarrative,
    };
  }

  private generateAdmissionsNarrative(
    analysis: NuancedCapabilityAnalysis,
    targetSelectivity: string
  ): string {
    const fingerprint = analysis.performanceFingerprint;
    const trajectory = analysis.progressionTrajectory.historical.overallTrend;
    const sweetSpot = fingerprint.sweetSpot;

    const strengths = Object.entries(analysis.subjectPatterns)
      .filter(([_, p]) => p.relativeStrength > 0.2)
      .map(([s]) => this.formatSubject(s));

    let narrative = `What admissions officers will see: `;

    if (trajectory === 'improving' || trajectory === 'accelerating') {
      narrative += `A student on an upward trajectory who's getting better over time. `;
    } else if (trajectory === 'stable' && fingerprint.performancePercentile >= 70) {
      narrative += `A student with consistent strong performance who knows how to maintain excellence. `;
    }

    if (strengths.length > 0) {
      narrative += `Clear strength${strengths.length > 1 ? 's' : ''} in ${strengths.join(' and ')}${strengths.length > 1 ? '' : ' area'} - evidence of depth and passion. `;
    }

    if (sweetSpot.level === 'ap_ib' && sweetSpot.expectedGPA >= 3.7) {
      narrative += `Strong performance in the most rigorous courses available. `;
    } else if (sweetSpot.level === 'honors' && sweetSpot.expectedGPA >= 3.8) {
      narrative += `Excellent grades in challenging courses - someone who finds their level and excels. `;
    }

    narrative += `The key is showing both challenge AND achievement - and your profile supports doing exactly that.`;

    return narrative;
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  private formatSubject(subject: string): string {
    const names: Record<string, string> = {
      math: 'Math',
      science: 'Science',
      english: 'English',
      social_studies: 'Social Studies',
      foreign_language: 'Foreign Language',
      arts: 'Arts',
      computer_science: 'Computer Science',
      other: 'Other',
    };
    return names[subject] || this.capitalizeFirst(subject);
  }

  private formatLevel(level: 'ap_ib' | 'honors' | 'regular'): string {
    if (level === 'ap_ib') return 'AP/IB';
    if (level === 'honors') return 'Honors';
    return 'Regular';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// ============================================================================
// SINGLETON & CONVENIENCE EXPORT
// ============================================================================

export const progressionTeachingEngine = new ProgressionTeachingEngine();

export function generateProgressionTeaching(
  analysis: NuancedCapabilityAnalysis,
  options?: {
    currentYear?: 'freshman' | 'sophomore' | 'junior' | 'senior';
    intendedMajor?: string;
    targetSelectivity?: 'ivy_plus' | 'top_25' | 'top_50' | 'any';
  }
): ProgressionTeaching {
  return progressionTeachingEngine.generateTeaching(analysis, options);
}
