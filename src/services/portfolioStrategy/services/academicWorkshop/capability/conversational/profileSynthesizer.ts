// @ts-nocheck
/**
 * Profile Synthesizer
 *
 * Combines quantitative capability analysis with qualitative conversation insights.
 *
 * CRITICAL DESIGN PRINCIPLE:
 * ═══════════════════════════════════════════════════════════════════════════════
 * SCORES are from the AO PERSPECTIVE - they see only what's on paper.
 * GUIDANCE uses our FULL UNDERSTANDING - including context they can't see.
 *
 * We NEVER adjust scores based on qualitative data because:
 * - AOs don't know about bad teachers
 * - AOs don't know about family circumstances
 * - AOs only see grades, transcripts, and what fits in the application
 *
 * Instead, we use qualitative data to:
 * - Provide smarter course recommendations
 * - Identify what to address in Additional Info
 * - Understand hidden potential for guidance
 * - Detect where reality differs from paper record
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { callClaude } from '../../../../../../lib/llm/claude';
import type { NuancedCapabilityAnalysis, SubjectPattern } from '../nuancedCapabilityAnalyzer';
import type { ProgressionTeaching, SubjectGuidance } from '../progressionTeachingEngine';
import type { SubjectArea } from '../types';
import { GPA_TO_GRADE } from '../types';

import type {
  QualitativeInsights,
  SubjectInsight,
  CourseAnnotation,
  ExtractedInsight,
  StudentSelfAwareness,
} from './types';

// ============================================================================
// CORE TYPES - SEPARATION OF CONCERNS
// ============================================================================

/**
 * What Admissions Officers will see - NEVER adjusted by qualitative data.
 * This is the paper record, pure and simple.
 */
export interface AOPerception {
  /** Subject relative strength as calculated from grades alone */
  relativeStrength: number;

  /** GPA in this subject */
  subjectGPA: number;

  /** Course rigor level */
  rigorLevel: 'ap_heavy' | 'honors_heavy' | 'mixed' | 'regular_heavy';

  /** Trend visible on transcript */
  visibleTrend: 'improving' | 'stable' | 'declining';

  /** What AOs will likely conclude */
  likelyImpression: string;

  /** Red flags visible on paper */
  visibleRedFlags: string[];

  /** Strengths visible on paper */
  visibleStrengths: string[];
}

/**
 * What WE know that AOs don't - used for guidance only, NEVER affects scores.
 */
export interface InternalUnderstanding {
  /** Our estimate of true capability vs what grades show */
  trueCapabilityEstimate: 'higher_than_grades' | 'matches_grades' | 'lower_than_grades';

  /** Why we think this */
  capabilityReasoning: string;

  /** Effort level student reported */
  reportedEffort: number; // 0-100

  /** External factors that affected grades */
  externalFactors: ExternalFactorSummary[];

  /** Teacher quality issues that affected specific courses */
  teacherQualityIssues: TeacherIssue[];

  /** Student's confidence vs their actual performance */
  confidenceCalibration: 'overconfident' | 'accurate' | 'underconfident';

  /** Student's genuine interest level */
  interestLevel: number; // 0-100

  /** Hidden potential we've identified */
  hiddenPotential: HiddenPotential | null;

  /** Circumstances that may have affected grades */
  relevantCircumstances: string[];
}

export interface ExternalFactorSummary {
  factor: string;
  impact: 'major' | 'moderate' | 'minor';
  timeframe: string;
  affectedSubjects: SubjectArea[];
}

export interface TeacherIssue {
  course: string;
  subject: SubjectArea;
  issue: string;
  gradeImpact: 'significant' | 'moderate' | 'minor';
}

export interface HiddenPotential {
  description: string;
  evidence: string[];
  confidence: number;
}

/**
 * Actionable strategy for the application itself.
 */
export interface ApplicationStrategy {
  /** Should this be addressed in Additional Info? */
  additionalInfoRecommendation: AdditionalInfoItem | null;

  /** What to communicate to counselor for their letter */
  counselorLetterPoints: string[];

  /** Interview talking points if asked */
  interviewTalkingPoints: string[];

  /** Course selection implications */
  courseSelectionGuidance: string;

  /** Risk assessment for future courses */
  riskAssessment: 'can_push_harder' | 'maintain_current' | 'protect_gpa';
}

export interface AdditionalInfoItem {
  shouldAddress: boolean;
  whatToExplain: string;
  howToFrame: string;
  doNotMention: string[];
}

/**
 * Complete subject analysis with clear separation.
 */
export interface SubjectAnalysisWithContext {
  subject: SubjectArea;

  /** What AOs see - NEVER adjusted */
  aoPerception: AOPerception;

  /** What we know - for guidance only */
  internalUnderstanding: InternalUnderstanding;

  /** Actionable application strategy */
  applicationStrategy: ApplicationStrategy;

  /** Where perception and reality differ */
  perceptionRealityGap: PerceptionRealityGap | null;
}

export interface PerceptionRealityGap {
  /** What paper shows */
  paperShows: string;

  /** What reality is */
  realityIs: string;

  /** Why this matters for guidance */
  guidanceImplication: string;

  /** How to potentially address this gap in application */
  addressingStrategy: string | null;
}

// ============================================================================
// SYNTHESIZED PROFILE (REFACTORED)
// ============================================================================

/**
 * The complete synthesized capability profile with clear separation.
 */
export interface SynthesizedCapabilityProfile {
  /** Original quantitative analysis - SCORES NEVER CHANGE */
  quantitativeAnalysis: NuancedCapabilityAnalysis;

  /** Qualitative insights from conversation */
  qualitativeInsights: QualitativeInsights;

  /** Per-subject analysis with clear separation */
  subjectAnalyses: Map<SubjectArea, SubjectAnalysisWithContext>;

  /** Global application strategy */
  globalApplicationStrategy: GlobalApplicationStrategy;

  /** Self-awareness assessment */
  selfAwareness: StudentSelfAwareness | null;

  /** Key insights combining both sources */
  keyInsights: SynthesizedInsight[];

  /** Perception vs Reality gaps across all subjects */
  perceptionRealityGaps: PerceptionRealityGap[];

  /** Overall synthesis confidence */
  synthesisConfidence: number;

  /** Metadata */
  metadata: {
    synthesizedAt: Date;
    quantitativeDataPoints: number;
    qualitativeDataPoints: number;
    conversationTurns: number;
  };

  // -------------------------------------------------------------------------
  // DEPRECATED - Kept for backwards compatibility, but should not be used
  // -------------------------------------------------------------------------

  /** @deprecated Use subjectAnalyses instead. Scores should never be adjusted. */
  adjustedSubjectStrengths: Map<SubjectArea, AdjustedSubjectStrength>;

  /** @deprecated Use keyInsights instead */
  synthesizedInsights: SynthesizedInsight[];

  /** @deprecated Use perceptionRealityGaps instead */
  mismatches: SourceMismatch[];

  /** @deprecated Use keyInsights and applicationStrategy instead */
  adjustments: QualitativeAdjustment[];
}

/**
 * Global application strategy across all subjects.
 */
export interface GlobalApplicationStrategy {
  /** Overall narrative to convey */
  overallNarrative: string;

  /** Key strengths to emphasize */
  keyStrengthsToEmphasize: string[];

  /** Areas where explanation may help */
  areasNeedingExplanation: string[];

  /** Global Additional Info recommendations */
  additionalInfoStrategy: {
    shouldUse: boolean;
    topics: string[];
    framingAdvice: string;
  };

  /** Counselor communication points */
  counselorBriefing: string[];

  /** Course selection strategy going forward */
  courseSelectionStrategy: {
    subjectsToChallenge: SubjectArea[];
    subjectsToProtect: SubjectArea[];
    reasoning: string;
  };

  /** NEW: Cross-subject patterns identified */
  crossSubjectPatterns: CrossSubjectInsight[];

  /** NEW: Specific essay topic suggestions with reasoning */
  supplementalEssayTopics: EssayTopicSuggestion[];

  /** NEW: Specific counselor letter bullet points */
  counselorLetterBullets: CounselorLetterPoint[];

  /** NEW: Interview preparation - specific topics */
  interviewPreparation: InterviewPrepPoint[];
}

/**
 * Cross-subject pattern insight.
 */
export interface CrossSubjectInsight {
  pattern: string;
  subjectsInvolved: SubjectArea[];
  evidenceFromConversation: string;
  applicationImplication: string;
  confidenceLevel: number;
}

/**
 * Specific essay topic suggestion with reasoning.
 */
export interface EssayTopicSuggestion {
  topic: string;
  whyThisWorks: string;
  whatToEmphasize: string[];
  whatToAvoid: string[];
  relevantQuotes?: string[];
}

/**
 * Specific counselor letter point.
 */
export interface CounselorLetterPoint {
  point: string;
  supportingEvidence: string;
  howToPhrase: string;
  priority: 'must_include' | 'strongly_recommend' | 'optional';
}

/**
 * Interview preparation point.
 */
export interface InterviewPrepPoint {
  likelyQuestion: string;
  recommendedApproach: string;
  keyPointsToMake: string[];
  pitfallsToAvoid: string[];
}

// ============================================================================
// LEGACY TYPES (for backwards compatibility)
// ============================================================================

/** @deprecated Use PerceptionRealityGap instead */
export interface SourceMismatch {
  subject: SubjectArea;
  aspect: string;
  quantitativeSays: string;
  qualitativeSays: string;
  resolution: string;
  confidenceInResolution: number;
}

/** @deprecated Scores should never be adjusted */
export interface AdjustedSubjectStrength {
  subject: SubjectArea;
  originalRelativeStrength: number;
  confidenceAdjustment: number;
  effortAdjustment: number;
  interestAdjustment: number;
  circumstanceAdjustment: number;
  adjustedRelativeStrength: number;
  adjustmentReasoning: string;
  adjustmentConfidence: number;
}

/** @deprecated Use ApplicationStrategy instead */
export interface QualitativeAdjustment {
  type: AdjustmentType;
  target: string;
  direction: 'increase' | 'decrease' | 'flag';
  magnitude: number;
  reasoning: string;
  confidence: number;
  sourceInsights: string[];
}

export type AdjustmentType =
  | 'strength_adjustment'
  | 'ceiling_adjustment'
  | 'floor_adjustment'
  | 'risk_adjustment'
  | 'confidence_adjustment'
  | 'recommendation_adjustment';

export interface SynthesizedInsight {
  category: 'strength' | 'challenge' | 'opportunity' | 'risk' | 'pattern' | 'mismatch';
  subject?: SubjectArea;
  insight: string;
  quantitativeEvidence: string;
  qualitativeEvidence: string;
  sourcesAlign: boolean;
  confidence: number;
  recommendationImpact: string;
}

// ============================================================================
// MAIN SYNTHESIZER CLASS
// ============================================================================

export class ProfileSynthesizer {
  /**
   * Synthesize quantitative and qualitative data with clear separation.
   *
   * IMPORTANT: This method NEVER adjusts scores. Scores reflect what AOs see.
   * Qualitative data is used for guidance and application strategy only.
   */
  synthesize(
    quantitativeAnalysis: NuancedCapabilityAnalysis,
    qualitativeInsights: QualitativeInsights
  ): SynthesizedCapabilityProfile {
    // Build per-subject analyses with clear separation
    const subjectAnalyses = this.buildSubjectAnalyses(
      quantitativeAnalysis,
      qualitativeInsights
    );

    // Generate key insights
    const keyInsights = this.generateKeyInsights(
      quantitativeAnalysis,
      qualitativeInsights,
      subjectAnalyses
    );

    // Collect perception-reality gaps
    const perceptionRealityGaps: PerceptionRealityGap[] = [];
    for (const analysis of subjectAnalyses.values()) {
      if (analysis.perceptionRealityGap) {
        perceptionRealityGaps.push(analysis.perceptionRealityGap);
      }
    }

    // Build global application strategy
    const globalApplicationStrategy = this.buildGlobalStrategy(
      quantitativeAnalysis,
      qualitativeInsights,
      subjectAnalyses,
      perceptionRealityGaps
    );

    // Calculate synthesis confidence
    const synthesisConfidence = this.calculateSynthesisConfidence(
      qualitativeInsights,
      perceptionRealityGaps
    );

    // Build legacy structures for backwards compatibility
    const legacyStructures = this.buildLegacyStructures(
      quantitativeAnalysis,
      qualitativeInsights,
      subjectAnalyses
    );

    return {
      quantitativeAnalysis,
      qualitativeInsights,
      subjectAnalyses,
      globalApplicationStrategy,
      selfAwareness: qualitativeInsights.selfAwarenessAssessment,
      keyInsights,
      perceptionRealityGaps,
      synthesisConfidence,
      metadata: {
        synthesizedAt: new Date(),
        quantitativeDataPoints: Object.keys(quantitativeAnalysis.subjectPatterns).length * 5,
        qualitativeDataPoints: qualitativeInsights.allExtractedInsights.length,
        conversationTurns: qualitativeInsights.conversationHistory.length,
      },
      // Legacy (deprecated) fields
      adjustedSubjectStrengths: legacyStructures.adjustedStrengths,
      synthesizedInsights: keyInsights,
      mismatches: legacyStructures.mismatches,
      adjustments: legacyStructures.adjustments,
    };
  }

  // -------------------------------------------------------------------------
  // SUBJECT ANALYSIS BUILDING
  // -------------------------------------------------------------------------

  private buildSubjectAnalyses(
    quant: NuancedCapabilityAnalysis,
    qual: QualitativeInsights
  ): Map<SubjectArea, SubjectAnalysisWithContext> {
    const analyses = new Map<SubjectArea, SubjectAnalysisWithContext>();

    for (const [subject, pattern] of Object.entries(quant.subjectPatterns)) {
      const subjectArea = subject as SubjectArea;
      const qualInsight = qual.subjectInsights.get(subjectArea);
      const courseAnnotations = Array.from(qual.courseAnnotations.values())
        .filter((a) => a.subject === subjectArea);

      analyses.set(subjectArea, {
        subject: subjectArea,
        aoPerception: this.buildAOPerception(pattern, subjectArea),
        internalUnderstanding: this.buildInternalUnderstanding(
          pattern,
          qualInsight,
          courseAnnotations,
          qual.globalCircumstances
        ),
        applicationStrategy: this.buildApplicationStrategy(
          pattern,
          qualInsight,
          courseAnnotations
        ),
        perceptionRealityGap: this.detectPerceptionRealityGap(
          pattern,
          qualInsight,
          courseAnnotations
        ),
      });
    }

    return analyses;
  }

  private buildAOPerception(pattern: SubjectPattern, subject: SubjectArea): AOPerception {
    const avgGPA = pattern.performanceHistory.avgGPA;
    const courses = pattern.performanceHistory.courses;

    // Determine rigor level
    const apCount = courses.filter((c) =>
      c.level.toLowerCase().includes('ap') || c.level.toLowerCase().includes('ib')
    ).length;
    const honorsCount = courses.filter((c) =>
      c.level.toLowerCase().includes('honors')
    ).length;
    const totalCourses = courses.length;

    let rigorLevel: AOPerception['rigorLevel'];
    if (apCount > totalCourses * 0.5) rigorLevel = 'ap_heavy';
    else if (honorsCount > totalCourses * 0.5) rigorLevel = 'honors_heavy';
    else if (apCount + honorsCount > totalCourses * 0.3) rigorLevel = 'mixed';
    else rigorLevel = 'regular_heavy';

    // Visible trend
    const visibleTrend = pattern.performanceHistory.trend;

    // Build impression
    const likelyImpression = this.buildAOImpression(
      pattern,
      subject,
      avgGPA,
      rigorLevel,
      visibleTrend
    );

    // Identify visible red flags and strengths
    const visibleRedFlags: string[] = [];
    const visibleStrengths: string[] = [];

    if (visibleTrend === 'declining') {
      visibleRedFlags.push('Declining grades in this subject');
    }
    if (avgGPA < 3.0 && rigorLevel === 'ap_heavy') {
      visibleRedFlags.push('Struggling with AP coursework');
    }
    if (avgGPA > 3.7 && rigorLevel === 'ap_heavy') {
      visibleStrengths.push('Excelling in rigorous coursework');
    }
    if (visibleTrend === 'improving') {
      visibleStrengths.push('Showing growth over time');
    }

    return {
      relativeStrength: pattern.relativeStrength,
      subjectGPA: avgGPA,
      rigorLevel,
      visibleTrend,
      likelyImpression,
      visibleRedFlags,
      visibleStrengths,
    };
  }

  private buildAOImpression(
    pattern: SubjectPattern,
    subject: SubjectArea,
    avgGPA: number,
    rigorLevel: AOPerception['rigorLevel'],
    trend: string
  ): string {
    const subjectName = formatSubject(subject);
    const grade = GPA_TO_GRADE(avgGPA);

    if (avgGPA > 3.7 && rigorLevel === 'ap_heavy') {
      return `Strong ${subjectName} student - handles rigorous coursework well (${grade} average in AP/IB)`;
    }
    if (avgGPA > 3.5 && rigorLevel === 'honors_heavy') {
      return `Solid ${subjectName} performance at honors level (${grade} average)`;
    }
    if (trend === 'improving') {
      return `Growth mindset visible in ${subjectName} - grades trending upward`;
    }
    if (trend === 'declining') {
      return `${subjectName} may be a concern - declining performance pattern`;
    }
    if (avgGPA < 3.0) {
      return `${subjectName} appears to be a challenge area (${grade} average)`;
    }

    return `Average ${subjectName} performance (${grade})`;
  }

  private buildInternalUnderstanding(
    pattern: SubjectPattern,
    qualInsight: SubjectInsight | undefined,
    courseAnnotations: CourseAnnotation[],
    globalCircumstances: QualitativeInsights['globalCircumstances']
  ): InternalUnderstanding {
    // Default values when no qualitative data
    if (!qualInsight && courseAnnotations.length === 0) {
      return {
        trueCapabilityEstimate: 'matches_grades',
        capabilityReasoning: 'No qualitative context available - grades represent best estimate',
        reportedEffort: 50,
        externalFactors: [],
        teacherQualityIssues: [],
        confidenceCalibration: 'accurate',
        interestLevel: 50,
        hiddenPotential: null,
        relevantCircumstances: [],
      };
    }

    // Analyze effort vs grades
    const reportedEffort = qualInsight?.overallEffort ?? 50;
    const avgGPA = pattern.performanceHistory.avgGPA;

    // =========================================================================
    // NUANCED CAPABILITY ESTIMATION
    // Uses heuristic rules as foundation, with consideration for multiple factors
    // =========================================================================
    let trueCapabilityEstimate: InternalUnderstanding['trueCapabilityEstimate'];
    let capabilityReasoning: string;

    // Gather all relevant context for nuanced analysis
    const hasTeacherIssues = courseAnnotations.some(
      (a) => a.teacherQuality === 'poor' || a.teacherQuality === 'terrible'
    );
    const hasExternalCircumstances = courseAnnotations.some(
      (a) => a.externalCircumstances.some((c) => c.impact === 'major_negative')
    ) || globalCircumstances.some((c) => c.impact === 'major_negative');
    const hasHighInterest = qualInsight?.overallInterest && qualInsight.overallInterest > 70;
    const hasLowInterest = qualInsight?.overallInterest && qualInsight.overallInterest < 30;
    const consistentHighPerformance = pattern.performanceHistory.avgGPA > 3.7 &&
      pattern.performanceHistory.trend !== 'declining';
    const strugglingDespiteEffort = reportedEffort > 70 && avgGPA < 3.0;
    const easySuccessLowEffort = reportedEffort < 35 && avgGPA > 3.5;

    // Nuanced multi-factor analysis (replaces simple thresholds)
    if (easySuccessLowEffort) {
      // Clear signal: minimal effort + good grades = higher potential
      trueCapabilityEstimate = 'higher_than_grades';
      capabilityReasoning = `Low effort (${reportedEffort}%) with high grades (${GPA_TO_GRADE(avgGPA)}) indicates significant untapped potential`;
    } else if (hasTeacherIssues && hasHighInterest && avgGPA < 3.5) {
      // Teacher issues + genuine interest = grades underrepresent
      trueCapabilityEstimate = 'higher_than_grades';
      capabilityReasoning = `Strong interest despite teacher quality issues suggests grades don't reflect true capability`;
    } else if (hasExternalCircumstances && avgGPA < 3.5) {
      // External circumstances explain lower grades
      trueCapabilityEstimate = 'higher_than_grades';
      capabilityReasoning = `External circumstances (${globalCircumstances[0]?.description || 'reported issues'}) likely affected performance`;
    } else if (strugglingDespiteEffort && !hasTeacherIssues && !hasExternalCircumstances) {
      // High effort + low grades + no external factors = near ceiling
      trueCapabilityEstimate = 'lower_than_grades';
      capabilityReasoning = `High effort (${reportedEffort}%) needed for ${GPA_TO_GRADE(avgGPA)} suggests grades may reflect current ceiling`;
    } else if (reportedEffort > 80 && avgGPA > 3.5 && hasLowInterest) {
      // High effort + good grades + low interest = effort-driven, not natural
      trueCapabilityEstimate = 'matches_grades';
      capabilityReasoning = `Good grades achieved through high effort rather than natural aptitude - grades accurately reflect capability`;
    } else if (consistentHighPerformance && reportedEffort > 50 && reportedEffort < 80) {
      // Consistently high + moderate effort = true strength
      trueCapabilityEstimate = 'matches_grades';
      capabilityReasoning = `Consistent strong performance with moderate effort suggests grades accurately reflect capability`;
    } else {
      // Default: grades match capability
      trueCapabilityEstimate = 'matches_grades';
      capabilityReasoning = 'Effort-grade relationship suggests grades accurately reflect current capability';
    }

    // Collect external factors
    const externalFactors: ExternalFactorSummary[] = [];
    for (const circ of globalCircumstances) {
      if (circ.impact === 'major_negative' || circ.impact === 'minor_negative') {
        externalFactors.push({
          factor: circ.description,
          impact: circ.impact === 'major_negative' ? 'major' : 'moderate',
          timeframe: circ.timeframe,
          affectedSubjects: circ.affectedSubjects === 'all'
            ? ['math', 'science', 'english', 'social_studies', 'foreign_language']
            : circ.affectedSubjects,
        });
      }
    }

    // Collect teacher issues
    const teacherQualityIssues: TeacherIssue[] = [];
    for (const annotation of courseAnnotations) {
      if (annotation.teacherQuality === 'poor' || annotation.teacherQuality === 'terrible') {
        teacherQualityIssues.push({
          course: annotation.courseName,
          subject: annotation.subject,
          issue: `${annotation.teacherQuality} teacher quality reported`,
          gradeImpact: annotation.teacherQuality === 'terrible' ? 'significant' : 'moderate',
        });
      }
    }

    // Determine confidence calibration
    let confidenceCalibration: InternalUnderstanding['confidenceCalibration'] = 'accurate';
    if (qualInsight) {
      if (qualInsight.overallConfidence > 70 && pattern.relativeStrength < -0.1) {
        confidenceCalibration = 'overconfident';
      } else if (qualInsight.overallConfidence < 40 && pattern.relativeStrength > 0.1) {
        confidenceCalibration = 'underconfident';
      }
    }

    // Identify hidden potential
    let hiddenPotential: HiddenPotential | null = null;
    if (trueCapabilityEstimate === 'higher_than_grades' ||
        teacherQualityIssues.length > 0 ||
        externalFactors.some((f) => f.impact === 'major')) {
      const evidence: string[] = [];
      if (reportedEffort < 40) evidence.push('Low effort achieving high grades');
      if (teacherQualityIssues.length > 0) evidence.push('Teacher quality affected learning');
      if (externalFactors.length > 0) evidence.push('External circumstances impacted performance');

      hiddenPotential = {
        description: 'Grades may underrepresent true capability',
        evidence,
        confidence: Math.min(70 + evidence.length * 10, 90),
      };
    }

    return {
      trueCapabilityEstimate,
      capabilityReasoning,
      reportedEffort,
      externalFactors,
      teacherQualityIssues,
      confidenceCalibration,
      interestLevel: qualInsight?.overallInterest ?? 50,
      hiddenPotential,
      relevantCircumstances: externalFactors.map((f) => f.factor),
    };
  }

  private buildApplicationStrategy(
    pattern: SubjectPattern,
    qualInsight: SubjectInsight | undefined,
    courseAnnotations: CourseAnnotation[]
  ): ApplicationStrategy {
    const avgGPA = pattern.performanceHistory.avgGPA;
    const trend = pattern.performanceHistory.trend;

    // Determine if Additional Info is warranted
    let additionalInfoRecommendation: AdditionalInfoItem | null = null;

    const hasExternalFactors = courseAnnotations.some(
      (a) => a.externalCircumstances.some((c) => c.impact === 'major_negative')
    );
    const hasTeacherIssues = courseAnnotations.some(
      (a) => a.teacherQuality === 'poor' || a.teacherQuality === 'terrible'
    );
    const hasSignificantDip = trend === 'declining' && avgGPA < 3.3;

    if (hasExternalFactors || (hasTeacherIssues && avgGPA < 3.5) || hasSignificantDip) {
      const doNotMention: string[] = [];

      // Don't blame teachers directly
      if (hasTeacherIssues) {
        doNotMention.push('Do not directly blame or criticize teachers');
      }

      additionalInfoRecommendation = {
        shouldAddress: true,
        whatToExplain: hasExternalFactors
          ? 'Context around circumstances that affected academic performance'
          : hasSignificantDip
            ? 'Context around grade dip and recovery efforts'
            : 'Challenges faced in this subject area',
        howToFrame: 'Focus on growth, what was learned, and how you overcame challenges. Be brief and factual.',
        doNotMention,
      };
    }

    // Build counselor letter points
    const counselorLetterPoints: string[] = [];
    if (qualInsight?.overallInterest && qualInsight.overallInterest > 70) {
      counselorLetterPoints.push(`Genuine enthusiasm for ${formatSubject(pattern.performanceHistory.courses[0]?.subject || 'this subject')}`);
    }
    if (hasExternalFactors) {
      counselorLetterPoints.push('Resilience in face of challenges');
    }
    if (trend === 'improving') {
      counselorLetterPoints.push('Notable growth trajectory');
    }

    // Build interview talking points
    const interviewTalkingPoints: string[] = [];
    if (qualInsight?.intrinsicInterest) {
      interviewTalkingPoints.push('Genuine interest in the subject matter');
    }
    // Check if any course annotation has high engagement or enjoyment
    if (
      courseAnnotations.some(
        (a) =>
          (a.engagementLevel && a.engagementLevel >= 4) ||
          (a.enjoymentLevel && a.enjoymentLevel >= 4) ||
          a.intrinsicInterest === true
      )
    ) {
      interviewTalkingPoints.push('Specific memorable learning experiences');
    }

    // Determine risk assessment for future courses
    let riskAssessment: ApplicationStrategy['riskAssessment'];
    const effort = qualInsight?.overallEffort ?? 50;

    if (effort < 40 && avgGPA > 3.5) {
      riskAssessment = 'can_push_harder';
    } else if (effort > 70 && avgGPA < 3.3) {
      riskAssessment = 'protect_gpa';
    } else {
      riskAssessment = 'maintain_current';
    }

    // Course selection guidance
    let courseSelectionGuidance: string;
    if (riskAssessment === 'can_push_harder') {
      courseSelectionGuidance = 'Room to take on more challenge - consider stepping up difficulty';
    } else if (riskAssessment === 'protect_gpa') {
      courseSelectionGuidance = 'Focus on maintaining or improving current performance - avoid overloading';
    } else {
      courseSelectionGuidance = 'Current trajectory is sustainable - can maintain or slightly increase rigor';
    }

    return {
      additionalInfoRecommendation,
      counselorLetterPoints,
      interviewTalkingPoints,
      courseSelectionGuidance,
      riskAssessment,
    };
  }

  private detectPerceptionRealityGap(
    pattern: SubjectPattern,
    qualInsight: SubjectInsight | undefined,
    courseAnnotations: CourseAnnotation[]
  ): PerceptionRealityGap | null {
    if (!qualInsight) return null;

    const avgGPA = pattern.performanceHistory.avgGPA;
    const effort = qualInsight.overallEffort;

    // Check for untapped potential gap
    if (effort < 40 && avgGPA > 3.5) {
      return {
        paperShows: `Strong grades (${GPA_TO_GRADE(avgGPA)}) in ${formatSubject(pattern.performanceHistory.courses[0]?.subject || 'this subject')}`,
        realityIs: `Student reports low effort (${effort}%) - true capability likely higher`,
        guidanceImplication: 'Can recommend more challenging courses with confidence',
        addressingStrategy: null, // No need to address - grades are good
      };
    }

    // Check for hidden struggle gap
    if (effort > 75 && avgGPA < 3.3) {
      return {
        paperShows: `Average grades (${GPA_TO_GRADE(avgGPA)})`,
        realityIs: `Student working very hard (${effort}% effort) for these results`,
        guidanceImplication: 'Recommend protecting GPA - near current ceiling',
        addressingStrategy: 'Consider mentioning growth/effort in Additional Info if relevant to narrative',
      };
    }

    // Check for teacher impact gap
    const teacherIssues = courseAnnotations.filter(
      (a) => a.teacherQuality === 'poor' || a.teacherQuality === 'terrible'
    );
    if (teacherIssues.length > 0 && avgGPA < 3.5) {
      return {
        paperShows: `Lower grades in specific courses`,
        realityIs: `Teacher quality issues affected learning experience`,
        guidanceImplication: 'Grades may not reflect true subject ability',
        addressingStrategy: 'Counselor letter can provide context without directly blaming teachers',
      };
    }

    // Check for confidence mismatch
    if (qualInsight.overallConfidence < 40 && pattern.relativeStrength > 0.1) {
      return {
        paperShows: `Strong performance relative to other subjects`,
        realityIs: `Student lacks confidence despite good results`,
        guidanceImplication: 'May need encouragement to pursue this area further',
        addressingStrategy: null,
      };
    }

    return null;
  }

  // -------------------------------------------------------------------------
  // GLOBAL STRATEGY BUILDING
  // -------------------------------------------------------------------------

  private buildGlobalStrategy(
    quant: NuancedCapabilityAnalysis,
    qual: QualitativeInsights,
    subjectAnalyses: Map<SubjectArea, SubjectAnalysisWithContext>,
    gaps: PerceptionRealityGap[]
  ): GlobalApplicationStrategy {
    // Identify key strengths
    const keyStrengthsToEmphasize: string[] = [];
    const areasNeedingExplanation: string[] = [];
    const subjectsToChallenge: SubjectArea[] = [];
    const subjectsToProtect: SubjectArea[] = [];

    for (const [subject, analysis] of subjectAnalyses) {
      if (analysis.aoPerception.relativeStrength > 0.1) {
        keyStrengthsToEmphasize.push(
          `${formatSubject(subject)}: ${analysis.aoPerception.likelyImpression}`
        );
      }

      if (analysis.perceptionRealityGap?.addressingStrategy) {
        areasNeedingExplanation.push(
          `${formatSubject(subject)}: ${analysis.perceptionRealityGap.addressingStrategy}`
        );
      }

      if (analysis.applicationStrategy.riskAssessment === 'can_push_harder') {
        subjectsToChallenge.push(subject);
      } else if (analysis.applicationStrategy.riskAssessment === 'protect_gpa') {
        subjectsToProtect.push(subject);
      }
    }

    // Build overall narrative
    const overallNarrative = this.buildOverallNarrative(quant, qual, gaps);

    // Determine Additional Info strategy
    const shouldUseAdditionalInfo = gaps.some((g) => g.addressingStrategy !== null) ||
      qual.globalCircumstances.some((c) => c.impact === 'major_negative');

    const additionalInfoTopics: string[] = [];
    if (qual.globalCircumstances.some((c) => c.impact === 'major_negative')) {
      additionalInfoTopics.push('External circumstances that affected academic performance');
    }
    for (const gap of gaps) {
      if (gap.addressingStrategy) {
        additionalInfoTopics.push(gap.realityIs);
      }
    }

    // Counselor briefing
    const counselorBriefing: string[] = [];
    if (qual.globalCircumstances.length > 0) {
      counselorBriefing.push('Student faced significant circumstances during high school');
    }
    if (gaps.some((g) => g.guidanceImplication.includes('true capability'))) {
      counselorBriefing.push('Grades in some areas may not fully represent capability');
    }

    // NEW: Detect cross-subject patterns
    const crossSubjectPatterns = this.detectCrossSubjectPatterns(
      quant, qual, subjectAnalyses
    );

    // NEW: Generate specific essay topic suggestions
    const supplementalEssayTopics = this.generateEssayTopicSuggestions(
      quant, qual, subjectAnalyses, crossSubjectPatterns
    );

    // NEW: Generate specific counselor letter points
    const counselorLetterBullets = this.generateCounselorLetterPoints(
      quant, qual, subjectAnalyses, gaps, crossSubjectPatterns
    );

    // NEW: Generate interview preparation points
    const interviewPreparation = this.generateInterviewPrepPoints(
      quant, qual, subjectAnalyses, crossSubjectPatterns
    );

    return {
      overallNarrative,
      keyStrengthsToEmphasize,
      areasNeedingExplanation,
      additionalInfoStrategy: {
        shouldUse: shouldUseAdditionalInfo,
        topics: additionalInfoTopics,
        framingAdvice: 'Focus on resilience, growth, and what you learned. Keep it brief and forward-looking.',
      },
      counselorBriefing,
      courseSelectionStrategy: {
        subjectsToChallenge,
        subjectsToProtect,
        reasoning: `Based on effort-grade analysis: push harder in ${subjectsToChallenge.map(formatSubject).join(', ') || 'none'}, protect GPA in ${subjectsToProtect.map(formatSubject).join(', ') || 'none'}`,
      },
      crossSubjectPatterns,
      supplementalEssayTopics,
      counselorLetterBullets,
      interviewPreparation,
    };
  }

  // -------------------------------------------------------------------------
  // CROSS-SUBJECT PATTERN DETECTION
  // -------------------------------------------------------------------------

  private detectCrossSubjectPatterns(
    quant: NuancedCapabilityAnalysis,
    qual: QualitativeInsights,
    subjectAnalyses: Map<SubjectArea, SubjectAnalysisWithContext>
  ): CrossSubjectInsight[] {
    const patterns: CrossSubjectInsight[] = [];

    // Pattern 1: Consistent effort pattern across subjects
    const effortLevels: Array<{ subject: SubjectArea; effort: number }> = [];
    for (const [subject, insight] of qual.subjectInsights) {
      if (insight.overallEffort !== undefined) {
        effortLevels.push({ subject, effort: insight.overallEffort });
      }
    }

    if (effortLevels.length >= 2) {
      const avgEffort = effortLevels.reduce((sum, e) => sum + e.effort, 0) / effortLevels.length;

      if (avgEffort > 75) {
        patterns.push({
          pattern: 'High effort across the board - strong work ethic',
          subjectsInvolved: effortLevels.map(e => e.subject),
          evidenceFromConversation: `Reported average ${avgEffort.toFixed(0)}% effort across subjects`,
          applicationImplication: 'Highlight work ethic in essays; counselor can emphasize dedication',
          confidenceLevel: 80,
        });
      } else if (avgEffort < 40) {
        patterns.push({
          pattern: 'Low effort with good grades - natural ability',
          subjectsInvolved: effortLevels.filter(e => e.effort < 40).map(e => e.subject),
          evidenceFromConversation: `Low effort (${avgEffort.toFixed(0)}%) while maintaining grades`,
          applicationImplication: 'Has room to grow with increased challenge; can push harder',
          confidenceLevel: 75,
        });
      }
    }

    // Pattern 2: Teacher impact pattern
    const teacherIssues: Array<{ subject: SubjectArea; course: string }> = [];
    for (const [, annotation] of qual.courseAnnotations) {
      if (annotation.teacherQuality === 'poor' || annotation.teacherQuality === 'terrible') {
        teacherIssues.push({ subject: annotation.subject, course: annotation.courseName });
      }
    }

    if (teacherIssues.length >= 2) {
      const subjects = [...new Set(teacherIssues.map(t => t.subject))];
      patterns.push({
        pattern: 'Multiple teacher quality challenges',
        subjectsInvolved: subjects,
        evidenceFromConversation: `Teacher issues in: ${teacherIssues.map(t => t.course).join(', ')}`,
        applicationImplication: 'Counselor letter can address systemic teaching challenges without blaming individuals',
        confidenceLevel: 70,
      });
    }

    // Pattern 3: Interest vs performance disconnect
    const interestPerformanceGaps: Array<{ subject: SubjectArea; interest: number; gpa: number }> = [];
    for (const [subject, analysis] of subjectAnalyses) {
      const interest = analysis.internalUnderstanding.interestLevel;
      const gpa = analysis.aoPerception.subjectGPA;

      if (interest > 70 && gpa < 3.3) {
        interestPerformanceGaps.push({ subject, interest, gpa });
      } else if (interest < 40 && gpa > 3.5) {
        interestPerformanceGaps.push({ subject, interest, gpa });
      }
    }

    if (interestPerformanceGaps.length > 0) {
      const highInterestLowGrade = interestPerformanceGaps.filter(g => g.interest > 70);
      const lowInterestHighGrade = interestPerformanceGaps.filter(g => g.interest < 40);

      if (highInterestLowGrade.length > 0) {
        patterns.push({
          pattern: 'Passionate but struggling - external factors likely',
          subjectsInvolved: highInterestLowGrade.map(g => g.subject),
          evidenceFromConversation: `High interest (${highInterestLowGrade[0].interest}%) with lower grades`,
          applicationImplication: 'Essay opportunity: genuine passion for subject despite challenges',
          confidenceLevel: 75,
        });
      }

      if (lowInterestHighGrade.length > 0) {
        patterns.push({
          pattern: 'Performing well without passion - dutiful student',
          subjectsInvolved: lowInterestHighGrade.map(g => g.subject),
          evidenceFromConversation: `Good grades despite low interest (${lowInterestHighGrade[0].interest}%)`,
          applicationImplication: 'Shows discipline; focus application on areas of genuine passion',
          confidenceLevel: 70,
        });
      }
    }

    // Pattern 4: Improvement trajectory pattern
    const improvingSubjects: SubjectArea[] = [];
    const decliningSubjects: SubjectArea[] = [];

    for (const [subject, analysis] of subjectAnalyses) {
      if (analysis.aoPerception.visibleTrend === 'improving') {
        improvingSubjects.push(subject);
      } else if (analysis.aoPerception.visibleTrend === 'declining') {
        decliningSubjects.push(subject);
      }
    }

    if (improvingSubjects.length >= 2) {
      patterns.push({
        pattern: 'Growth trajectory across multiple subjects',
        subjectsInvolved: improvingSubjects,
        evidenceFromConversation: `Improving trends in: ${improvingSubjects.map(formatSubject).join(', ')}`,
        applicationImplication: 'Strong narrative of growth and improvement for application',
        confidenceLevel: 85,
      });
    }

    // Pattern 5: Circumstance impact across subjects
    if (qual.globalCircumstances.length > 0) {
      const majorCircumstances = qual.globalCircumstances.filter(c => c.impact === 'major_negative');
      if (majorCircumstances.length > 0) {
        const affectedSubjects = majorCircumstances.flatMap(c =>
          c.affectedSubjects === 'all'
            ? Array.from(subjectAnalyses.keys())
            : c.affectedSubjects
        );

        patterns.push({
          pattern: 'External circumstances impacted academic performance',
          subjectsInvolved: [...new Set(affectedSubjects)] as SubjectArea[],
          evidenceFromConversation: majorCircumstances.map(c => c.description).join('; '),
          applicationImplication: 'Should be addressed in Additional Info section; counselor letter critical',
          confidenceLevel: 90,
        });
      }
    }

    return patterns;
  }

  // -------------------------------------------------------------------------
  // ESSAY TOPIC SUGGESTIONS
  // -------------------------------------------------------------------------

  private generateEssayTopicSuggestions(
    quant: NuancedCapabilityAnalysis,
    qual: QualitativeInsights,
    subjectAnalyses: Map<SubjectArea, SubjectAnalysisWithContext>,
    crossPatterns: CrossSubjectInsight[]
  ): EssayTopicSuggestion[] {
    const suggestions: EssayTopicSuggestion[] = [];

    // Get memorable quotes from conversation
    const quotes = qual.allExtractedInsights
      .filter(i => i.supportingQuote)
      .map(i => i.supportingQuote!)
      .slice(0, 5);

    // Suggestion 1: Growth/improvement story
    const improvingSubjects: SubjectArea[] = [];
    for (const [subject, analysis] of subjectAnalyses) {
      if (analysis.aoPerception.visibleTrend === 'improving') {
        improvingSubjects.push(subject);
      }
    }

    if (improvingSubjects.length > 0) {
      const bestSubject = improvingSubjects[0];
      const analysis = subjectAnalyses.get(bestSubject);
      const insight = qual.subjectInsights.get(bestSubject);

      suggestions.push({
        topic: `Growth in ${formatSubject(bestSubject)}: From struggle to success`,
        whyThisWorks: `Shows growth mindset and resilience - AOs love improvement narratives`,
        whatToEmphasize: [
          'The specific moment you realized you needed to change approach',
          'What strategies you developed',
          'How this changed your perspective on learning',
        ],
        whatToAvoid: [
          'Blaming teachers or external factors',
          'Making it sound like success came easily',
          'Generic statements about "working harder"',
        ],
        relevantQuotes: insight?.keyStatements || [],
      });
    }

    // Suggestion 2: Overcoming circumstance
    if (qual.globalCircumstances.length > 0) {
      const circumstance = qual.globalCircumstances[0];

      suggestions.push({
        topic: `Resilience through challenge: ${circumstance.description.split(' ').slice(0, 4).join(' ')}...`,
        whyThisWorks: `Demonstrates maturity and ability to handle adversity`,
        whatToEmphasize: [
          'What you learned about yourself',
          'How it changed your priorities',
          'The silver lining or growth that came from it',
        ],
        whatToAvoid: [
          'Making it a sob story or asking for sympathy',
          'Dwelling on the negative aspects',
          'Making excuses for grades',
        ],
        relevantQuotes: quotes.filter(q =>
          q.toLowerCase().includes('hard') ||
          q.toLowerCase().includes('challenge') ||
          q.toLowerCase().includes('difficult')
        ),
      });
    }

    // Suggestion 3: Interest contrast story
    const contrastPattern = crossPatterns.find(p =>
      p.pattern.includes('passionate') || p.pattern.includes('interest')
    );

    if (contrastPattern) {
      suggestions.push({
        topic: `Why I pursue ${formatSubject(contrastPattern.subjectsInvolved[0])} despite the challenges`,
        whyThisWorks: `Shows genuine intellectual curiosity and authentic passion`,
        whatToEmphasize: [
          'What specifically fascinates you about this subject',
          'Concrete examples of going beyond the classroom',
          'Your vision for how you\'ll pursue this in college',
        ],
        whatToAvoid: [
          'Just saying "I love it" without specifics',
          'Focusing on career or financial benefits',
          'Making it sound like a recent discovery',
        ],
        relevantQuotes: quotes.filter(q =>
          q.toLowerCase().includes('love') ||
          q.toLowerCase().includes('fascinate') ||
          q.toLowerCase().includes('passion')
        ),
      });
    }

    // Suggestion 4: Self-awareness story (if they have good self-reflection)
    if (qual.selfAwarenessAssessment && qual.selfAwarenessAssessment.selfPerceptionAccuracy > 60) {
      const blindSpot = qual.selfAwarenessAssessment.blindSpots[0];

      if (blindSpot) {
        suggestions.push({
          topic: `Discovering my blind spot: How I learned to ${blindSpot.area.toLowerCase()}`,
          whyThisWorks: `Shows rare self-awareness and capacity for growth`,
          whatToEmphasize: [
            'The specific realization moment',
            'How your behavior changed as a result',
            'What you still want to improve',
          ],
          whatToAvoid: [
            'Being too self-critical',
            'Making it sound like you\'ve "fixed" yourself completely',
            'Generic self-improvement language',
          ],
        });
      }
    }

    return suggestions;
  }

  // -------------------------------------------------------------------------
  // COUNSELOR LETTER POINTS
  // -------------------------------------------------------------------------

  private generateCounselorLetterPoints(
    quant: NuancedCapabilityAnalysis,
    qual: QualitativeInsights,
    subjectAnalyses: Map<SubjectArea, SubjectAnalysisWithContext>,
    gaps: PerceptionRealityGap[],
    crossPatterns: CrossSubjectInsight[]
  ): CounselorLetterPoint[] {
    const points: CounselorLetterPoint[] = [];

    // Point 1: Address external circumstances (if any)
    if (qual.globalCircumstances.length > 0) {
      const majorCirc = qual.globalCircumstances.find(c => c.impact === 'major_negative');

      if (majorCirc) {
        points.push({
          point: 'Address external circumstances affecting performance',
          supportingEvidence: majorCirc.description,
          howToPhrase: `[Student name] faced significant challenges during [timeframe] that affected their academic performance. Despite [brief description], they demonstrated remarkable resilience by [specific achievement or maintenance of performance].`,
          priority: 'must_include',
        });
      }
    }

    // Point 2: Highlight hidden potential
    for (const [subject, analysis] of subjectAnalyses) {
      if (analysis.internalUnderstanding.hiddenPotential) {
        points.push({
          point: `Highlight hidden potential in ${formatSubject(subject)}`,
          supportingEvidence: analysis.internalUnderstanding.hiddenPotential.evidence.join('; '),
          howToPhrase: `While [student name]'s grades in ${formatSubject(subject)} may not fully reflect their capability, I have observed [specific evidence of potential]. They have the foundation to excel in more challenging coursework.`,
          priority: 'strongly_recommend',
        });
        break; // Only include one hidden potential point
      }
    }

    // Point 3: Work ethic observation
    const avgEffort = this.calculateAverageEffort(qual);
    if (avgEffort > 70) {
      points.push({
        point: 'Strong work ethic and dedication',
        supportingEvidence: `Reported ${avgEffort.toFixed(0)}% average effort across subjects`,
        howToPhrase: `[Student name] is one of the hardest-working students I've encountered. They approach their coursework with consistent dedication, often going beyond what is required.`,
        priority: 'strongly_recommend',
      });
    }

    // Point 4: Growth trajectory
    const growthPattern = crossPatterns.find(p => p.pattern.includes('Growth trajectory'));
    if (growthPattern) {
      points.push({
        point: 'Demonstrate growth trajectory',
        supportingEvidence: growthPattern.evidenceFromConversation,
        howToPhrase: `[Student name] has shown consistent improvement throughout high school. Their trajectory in [subjects] demonstrates their capacity to rise to challenges and their commitment to growth.`,
        priority: 'strongly_recommend',
      });
    }

    // Point 5: Teacher quality context (diplomatic framing)
    const teacherPattern = crossPatterns.find(p => p.pattern.includes('teacher quality'));
    if (teacherPattern) {
      points.push({
        point: 'Context for specific course performance',
        supportingEvidence: teacherPattern.evidenceFromConversation,
        howToPhrase: `Some of [student name]'s courses during [timeframe] presented unique teaching and learning environments. Their performance in these classes does not fully represent their capability in these subject areas.`,
        priority: 'optional',
      });
    }

    // Point 6: Self-awareness and maturity
    if (qual.selfAwarenessAssessment &&
        qual.selfAwarenessAssessment.selfPerceptionAccuracy > 70 &&
        qual.selfAwarenessAssessment.estimationTendency !== 'overestimates') {
      points.push({
        point: 'Exceptional self-awareness and maturity',
        supportingEvidence: `Self-perception accuracy: ${qual.selfAwarenessAssessment.selfPerceptionAccuracy}%`,
        howToPhrase: `[Student name] demonstrates a level of self-awareness that is rare among high school students. They have a realistic understanding of their strengths and areas for growth, which positions them well for college.`,
        priority: 'optional',
      });
    }

    return points;
  }

  private calculateAverageEffort(qual: QualitativeInsights): number {
    const efforts: number[] = [];
    for (const [, insight] of qual.subjectInsights) {
      if (insight.overallEffort !== undefined) {
        efforts.push(insight.overallEffort);
      }
    }
    return efforts.length > 0
      ? efforts.reduce((a, b) => a + b, 0) / efforts.length
      : 50;
  }

  // -------------------------------------------------------------------------
  // INTERVIEW PREPARATION POINTS
  // -------------------------------------------------------------------------

  private generateInterviewPrepPoints(
    quant: NuancedCapabilityAnalysis,
    qual: QualitativeInsights,
    subjectAnalyses: Map<SubjectArea, SubjectAnalysisWithContext>,
    crossPatterns: CrossSubjectInsight[]
  ): InterviewPrepPoint[] {
    const points: InterviewPrepPoint[] = [];

    // Likely question 1: About struggles or lower grades
    const challengeSubjects: SubjectArea[] = [];
    for (const [subject, analysis] of subjectAnalyses) {
      if (analysis.aoPerception.relativeStrength < -0.1) {
        challengeSubjects.push(subject);
      }
    }

    if (challengeSubjects.length > 0) {
      const subject = challengeSubjects[0];
      const analysis = subjectAnalyses.get(subject)!;

      points.push({
        likelyQuestion: `Tell me about your experience with ${formatSubject(subject)}. I noticed your grades were lower there.`,
        recommendedApproach: 'Be honest and forward-looking. Acknowledge the challenge, explain what you learned, and show what you\'d do differently.',
        keyPointsToMake: [
          'Acknowledge that it was challenging for you',
          analysis.internalUnderstanding.externalFactors.length > 0
            ? `Briefly mention context: ${analysis.internalUnderstanding.externalFactors[0].factor}`
            : 'Describe what made it difficult',
          'Share specific strategies you developed',
          'Express genuine interest in improving',
        ],
        pitfallsToAvoid: [
          'Blaming the teacher explicitly',
          'Making excuses without showing growth',
          'Dismissing the subject as unimportant',
          'Claiming it was just a "bad semester"',
        ],
      });
    }

    // Likely question 2: About strengths
    const strengthSubjects: SubjectArea[] = [];
    for (const [subject, analysis] of subjectAnalyses) {
      if (analysis.aoPerception.relativeStrength > 0.1) {
        strengthSubjects.push(subject);
      }
    }

    if (strengthSubjects.length > 0) {
      const subject = strengthSubjects[0];
      const insight = qual.subjectInsights.get(subject);

      points.push({
        likelyQuestion: `What subject are you most passionate about and why?`,
        recommendedApproach: 'Be specific and personal. Share a concrete story or moment that illustrates your passion.',
        keyPointsToMake: [
          `Lead with ${formatSubject(subject)} as your strongest area`,
          insight?.keyStatements?.[0] || 'Share a specific memorable moment',
          'Connect to future goals or interests',
          'Show intellectual curiosity beyond the classroom',
        ],
        pitfallsToAvoid: [
          'Saying "I\'ve always loved it" without specifics',
          'Focusing only on grades or achievements',
          'Being too rehearsed or generic',
          'Mentioning a subject just because it looks good',
        ],
      });
    }

    // Likely question 3: About circumstances (if relevant)
    if (qual.globalCircumstances.length > 0) {
      points.push({
        likelyQuestion: `Is there anything that affected your high school experience that you\'d like to share?`,
        recommendedApproach: 'Be brief, factual, and focus on growth. Don\'t seek sympathy - show resilience.',
        keyPointsToMake: [
          'Briefly state what happened (1-2 sentences)',
          'Focus on what you learned from it',
          'Share how it changed your perspective',
          'End on what you\'re looking forward to',
        ],
        pitfallsToAvoid: [
          'Going into too much detail about the difficulty',
          'Making it the central focus of your identity',
          'Appearing to make excuses',
          'Getting emotional in a way that makes the interviewer uncomfortable',
        ],
      });
    }

    // Likely question 4: About future academic plans
    const intendedMajorContext = qual.allExtractedInsights.find(i =>
      i.type === 'future_intention' && i.values.intendedMajor
    );

    points.push({
      likelyQuestion: `Why do you want to study [your intended major]?`,
      recommendedApproach: 'Connect your academic experiences to your interest. Be specific about what draws you to the field.',
      keyPointsToMake: [
        'Reference a specific class, project, or moment that sparked interest',
        strengthSubjects.length > 0
          ? `Connect to your strength in ${formatSubject(strengthSubjects[0])}`
          : 'Share what you find intellectually exciting about the field',
        'Show awareness of what the major actually involves',
        'Have a question ready about their specific program',
      ],
      pitfallsToAvoid: [
        'Mentioning career prospects or salary as primary motivation',
        'Being vague about why you\'re interested',
        'Claiming certainty about a career path you haven\'t explored',
        'Not knowing basics about the field',
      ],
    });

    return points;
  }

  private buildOverallNarrative(
    quant: NuancedCapabilityAnalysis,
    qual: QualitativeInsights,
    gaps: PerceptionRealityGap[]
  ): string {
    const trajectory = quant.progressionTrajectory.historical.overallTrend;
    const hasCircumstances = qual.globalCircumstances.length > 0;
    const hasHiddenPotential = gaps.some((g) => g.realityIs.includes('capability likely higher'));

    if (trajectory === 'improving' || trajectory === 'accelerating') {
      return 'Student demonstrates growth mindset with improving academic trajectory';
    }
    if (hasCircumstances && trajectory !== 'declining') {
      return 'Student shows resilience maintaining performance despite challenges';
    }
    if (hasHiddenPotential) {
      return 'Academic record solid; internal context suggests room for growth with increased challenge';
    }

    return 'Consistent academic performance across subjects';
  }

  // -------------------------------------------------------------------------
  // KEY INSIGHTS GENERATION
  // -------------------------------------------------------------------------

  private generateKeyInsights(
    quant: NuancedCapabilityAnalysis,
    qual: QualitativeInsights,
    subjectAnalyses: Map<SubjectArea, SubjectAnalysisWithContext>
  ): SynthesizedInsight[] {
    const insights: SynthesizedInsight[] = [];

    for (const [subject, analysis] of subjectAnalyses) {
      const pattern = quant.subjectPatterns[subject];
      const qualInsight = qual.subjectInsights.get(subject);

      if (!pattern) continue;

      // Strength insights
      if (analysis.aoPerception.relativeStrength > 0.1) {
        const sourcesAlign = !qualInsight ||
          qualInsight.selfAssessedStrength ||
          qualInsight.overallConfidence > 60;

        insights.push({
          category: 'strength',
          subject,
          insight: sourcesAlign
            ? `${formatSubject(subject)} is a clear strength - AOs will see this`
            : `${formatSubject(subject)} shows strong grades but student lacks confidence`,
          quantitativeEvidence: `${GPA_TO_GRADE(pattern.performanceHistory.avgGPA)} average, ${(pattern.relativeStrength * 100).toFixed(0)}% above their norm`,
          qualitativeEvidence: qualInsight
            ? `Self-confidence: ${qualInsight.overallConfidence}%`
            : 'No qualitative data',
          sourcesAlign,
          confidence: 80,
          recommendationImpact: 'Can challenge further in this area',
        });
      }

      // Challenge insights
      if (analysis.aoPerception.relativeStrength < -0.1) {
        insights.push({
          category: 'challenge',
          subject,
          insight: `${formatSubject(subject)} is a visible challenge area on transcript`,
          quantitativeEvidence: `${GPA_TO_GRADE(pattern.performanceHistory.avgGPA)} average`,
          qualitativeEvidence: analysis.internalUnderstanding.capabilityReasoning,
          sourcesAlign: true,
          confidence: 80,
          recommendationImpact: analysis.applicationStrategy.riskAssessment === 'protect_gpa'
            ? 'Recommend protecting GPA here'
            : 'May have room for improvement with different approach',
        });
      }

      // Opportunity insights (hidden potential)
      if (analysis.internalUnderstanding.hiddenPotential) {
        insights.push({
          category: 'opportunity',
          subject,
          insight: `Hidden potential in ${formatSubject(subject)}: ${analysis.internalUnderstanding.hiddenPotential.description}`,
          quantitativeEvidence: `Current: ${GPA_TO_GRADE(pattern.performanceHistory.avgGPA)}`,
          qualitativeEvidence: analysis.internalUnderstanding.hiddenPotential.evidence.join('; '),
          sourcesAlign: false,
          confidence: analysis.internalUnderstanding.hiddenPotential.confidence,
          recommendationImpact: 'Consider pushing harder - internal data suggests more capability',
        });
      }
    }

    // Add self-awareness insights
    if (qual.selfAwarenessAssessment) {
      const sa = qual.selfAwarenessAssessment;
      if (sa.estimationTendency !== 'accurate') {
        insights.push({
          category: 'pattern',
          insight: sa.estimationTendency === 'overestimates'
            ? 'Student tends to overestimate abilities - be cautious with challenge recommendations'
            : 'Student underestimates abilities - may be capable of more than they think',
          quantitativeEvidence: `Self-perception accuracy: ${sa.selfPerceptionAccuracy}%`,
          qualitativeEvidence: `Blind spots in: ${sa.blindSpots.map((b) => b.area).join(', ')}`,
          sourcesAlign: false,
          confidence: sa.selfPerceptionAccuracy,
          recommendationImpact: sa.estimationTendency === 'overestimates'
            ? 'Calibrate recommendations downward'
            : 'Encourage more stretch than they request',
        });
      }
    }

    return insights;
  }

  // -------------------------------------------------------------------------
  // LEGACY STRUCTURE BUILDING (for backwards compatibility)
  // -------------------------------------------------------------------------

  private buildLegacyStructures(
    quant: NuancedCapabilityAnalysis,
    qual: QualitativeInsights,
    subjectAnalyses: Map<SubjectArea, SubjectAnalysisWithContext>
  ): {
    adjustedStrengths: Map<SubjectArea, AdjustedSubjectStrength>;
    mismatches: SourceMismatch[];
    adjustments: QualitativeAdjustment[];
  } {
    // Build legacy adjusted strengths (DEPRECATED - scores should never change)
    const adjustedStrengths = new Map<SubjectArea, AdjustedSubjectStrength>();

    for (const [subject, analysis] of subjectAnalyses) {
      const pattern = quant.subjectPatterns[subject];
      if (!pattern) continue;

      // NOTE: In the new design, we DON'T adjust the strength
      // We keep the same value but populate the structure for backwards compat
      adjustedStrengths.set(subject, {
        subject,
        originalRelativeStrength: pattern.relativeStrength,
        confidenceAdjustment: 0,
        effortAdjustment: 0,
        interestAdjustment: 0,
        circumstanceAdjustment: 0,
        adjustedRelativeStrength: pattern.relativeStrength, // NO CHANGE
        adjustmentReasoning: 'Scores not adjusted - qualitative data used for guidance only',
        adjustmentConfidence: 100,
      });
    }

    // Build legacy mismatches
    const mismatches: SourceMismatch[] = [];
    for (const [subject, analysis] of subjectAnalyses) {
      if (analysis.perceptionRealityGap) {
        mismatches.push({
          subject,
          aspect: 'perception_reality',
          quantitativeSays: analysis.perceptionRealityGap.paperShows,
          qualitativeSays: analysis.perceptionRealityGap.realityIs,
          resolution: analysis.perceptionRealityGap.guidanceImplication,
          confidenceInResolution: 70,
        });
      }
    }

    // Build legacy adjustments (empty - we don't adjust scores anymore)
    const adjustments: QualitativeAdjustment[] = [];

    return { adjustedStrengths, mismatches, adjustments };
  }

  // -------------------------------------------------------------------------
  // CONFIDENCE CALCULATION
  // -------------------------------------------------------------------------

  private calculateSynthesisConfidence(
    qual: QualitativeInsights,
    gaps: PerceptionRealityGap[]
  ): number {
    let confidence = 70;

    // More conversation data = higher confidence
    const turnBonus = Math.min(qual.conversationHistory.length * 2, 15);
    confidence += turnBonus;

    // More insights = higher confidence
    const insightBonus = Math.min(qual.allExtractedInsights.length * 1.5, 10);
    confidence += insightBonus;

    // Completeness bonus
    confidence += qual.completeness.overallCompleteness * 0.1;

    // More gaps found = we understand the situation better
    confidence += gaps.length * 2;

    return Math.max(30, Math.min(95, confidence));
  }
}

// ============================================================================
// RECOMMENDATION ADJUSTMENT
// ============================================================================

/**
 * Adjust progression teaching based on synthesized profile.
 *
 * NOTE: This adjusts RECOMMENDATIONS, not scores.
 * The qualitative data helps us give better advice, not change grades.
 */
export function adjustTeachingRecommendations(
  originalTeaching: ProgressionTeaching,
  synthesizedProfile: SynthesizedCapabilityProfile
): ProgressionTeaching {
  const adjusted: ProgressionTeaching = JSON.parse(JSON.stringify(originalTeaching));

  // Apply insights to recommendations (NOT to scores)
  for (const [subject, analysis] of synthesizedProfile.subjectAnalyses) {
    const subjectGuidance = adjusted.subjectGuidance.find(
      (sg) => sg.subject.toLowerCase() === formatSubject(subject).toLowerCase()
    );

    if (subjectGuidance) {
      // Add context based on internal understanding
      if (analysis.internalUnderstanding.trueCapabilityEstimate === 'higher_than_grades') {
        subjectGuidance.nextStep.recommendation +=
          ' (Based on your reported effort level, you likely have more capability here than your grades suggest)';
      } else if (analysis.internalUnderstanding.trueCapabilityEstimate === 'lower_than_grades') {
        subjectGuidance.nextStep.recommendation +=
          ' (Given your effort level, this may be near your current ceiling - consider protecting your GPA)';
      }

      // Add stretch option adjustments
      if (subjectGuidance.stretchOption) {
        if (analysis.applicationStrategy.riskAssessment === 'can_push_harder') {
          subjectGuidance.stretchOption.risk =
            'Lower than grades alone suggest - your profile indicates more potential';
        } else if (analysis.applicationStrategy.riskAssessment === 'protect_gpa') {
          subjectGuidance.stretchOption.risk =
            'Higher than it may appear - consider maintaining current level';
        }
      }
    }
  }

  // Add global insights
  const strategy = synthesizedProfile.globalApplicationStrategy;

  if (strategy.subjectsToChallenge.length > 0) {
    adjusted.motivation.strengths.push(
      `Room to push harder in: ${strategy.subjectsToChallenge.map(formatSubject).join(', ')}`
    );
  }

  if (strategy.subjectsToProtect.length > 0) {
    adjusted.motivation.strengths.push(
      `Focus on maintaining: ${strategy.subjectsToProtect.map(formatSubject).join(', ')}`
    );
  }

  return adjusted;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatSubject(subject: string): string {
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
  return names[subject] || subject;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const profileSynthesizer = new ProfileSynthesizer();

export function synthesizeProfile(
  quantitativeAnalysis: NuancedCapabilityAnalysis,
  qualitativeInsights: QualitativeInsights
): SynthesizedCapabilityProfile {
  return profileSynthesizer.synthesize(quantitativeAnalysis, qualitativeInsights);
}

// ============================================================================
// LLM-ENHANCED SYNTHESIS (Optional - for deeper analysis)
// ============================================================================

/**
 * Perform LLM-enhanced capability analysis for a specific subject.
 * This provides more nuanced reasoning than heuristic rules alone.
 *
 * Use this when:
 * - The heuristic analysis is ambiguous
 * - The student's situation is complex
 * - You need detailed reasoning for guidance
 *
 * Falls back to heuristic analysis if LLM fails.
 */
export async function synthesizeCapabilityWithLLM(
  subject: SubjectArea,
  quantPattern: SubjectPattern,
  qualInsight: SubjectInsight | undefined,
  courseAnnotations: CourseAnnotation[],
  globalCircumstances: QualitativeInsights['globalCircumstances']
): Promise<{
  estimate: InternalUnderstanding['trueCapabilityEstimate'];
  reasoning: string;
  confidence: number;
  factors: string[];
}> {
  // Build context for LLM
  const avgGPA = quantPattern.performanceHistory.avgGPA;
  const trend = quantPattern.performanceHistory.trend;
  const courses = quantPattern.performanceHistory.courses;

  const contextLines: string[] = [
    `Subject: ${formatSubject(subject)}`,
    `Average GPA: ${GPA_TO_GRADE(avgGPA)} (${avgGPA.toFixed(2)})`,
    `Trend: ${trend}`,
    `Relative Strength: ${quantPattern.relativeStrength > 0 ? '+' : ''}${(quantPattern.relativeStrength * 100).toFixed(0)}%`,
    '',
    'Courses:',
    ...courses.map(c => `  - ${c.name} (${c.level}): ${GPA_TO_GRADE(c.grade)}`),
  ];

  if (qualInsight) {
    contextLines.push('');
    contextLines.push('Student\'s Self-Report:');
    contextLines.push(`  - Effort level: ${qualInsight.overallEffort}%`);
    contextLines.push(`  - Interest level: ${qualInsight.overallInterest}%`);
    contextLines.push(`  - Confidence: ${qualInsight.overallConfidence}%`);
    contextLines.push(`  - Self-assessed as strength: ${qualInsight.selfAssessedStrength}`);
    contextLines.push(`  - Self-assessed as challenge: ${qualInsight.selfAssessedChallenge}`);
    if (qualInsight.keyStatements.length > 0) {
      contextLines.push(`  - Key statements: "${qualInsight.keyStatements.join('", "')}"`);
    }
  }

  if (courseAnnotations.length > 0) {
    contextLines.push('');
    contextLines.push('Course-Specific Context:');
    for (const ann of courseAnnotations) {
      if (ann.teacherQuality) {
        contextLines.push(`  - ${ann.courseName}: Teacher quality = ${ann.teacherQuality}`);
      }
      if (ann.externalCircumstances.length > 0) {
        contextLines.push(`  - ${ann.courseName}: External factors = ${ann.externalCircumstances.map(c => c.description).join(', ')}`);
      }
      if (ann.effortLevel !== null) {
        contextLines.push(`  - ${ann.courseName}: Effort = ${ann.effortLevel}/5`);
      }
    }
  }

  if (globalCircumstances.length > 0) {
    contextLines.push('');
    contextLines.push('Global Circumstances Affecting All Subjects:');
    for (const circ of globalCircumstances) {
      contextLines.push(`  - ${circ.description} (${circ.timeframe}, impact: ${circ.impact})`);
    }
  }

  try {
    const systemPrompt = `You are an expert academic counselor analyzing a student's capability in a subject.

Your task is to determine whether the student's TRUE CAPABILITY is:
1. HIGHER than their grades suggest (grades underrepresent ability)
2. MATCHES their grades (grades accurately reflect capability)
3. LOWER than their grades suggest (grades may overrepresent ability due to easy courses, grade inflation, etc.)

Consider ALL factors holistically:
- Effort level vs grades achieved
- Teacher quality issues
- External circumstances (family, health, etc.)
- Interest level and engagement
- Grade trends over time
- Self-assessment accuracy

Be nuanced - avoid simple thresholds. A student with 70% effort and B average might have higher capability if they had terrible teachers, OR might be at their ceiling if conditions were ideal.`;

    const response = await callClaude({
      model: 'claude-haiku-4-5-20251001',
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Analyze this student's capability:

${contextLines.join('\n')}

Respond with JSON:
{
  "estimate": "higher_than_grades" | "matches_grades" | "lower_than_grades",
  "reasoning": "2-3 sentences explaining your assessment",
  "confidence": 0-100,
  "key_factors": ["factor1", "factor2", ...]
}

Return ONLY valid JSON.`
      }],
      maxTokens: 500,
      temperature: 0.1,
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        estimate: result.estimate as InternalUnderstanding['trueCapabilityEstimate'],
        reasoning: result.reasoning || 'LLM analysis completed',
        confidence: result.confidence || 70,
        factors: result.key_factors || [],
      };
    }
  } catch (error) {
    console.warn('[ProfileSynthesizer] LLM capability analysis failed, using heuristics:', error);
  }

  // Fallback to heuristic analysis
  const reportedEffort = qualInsight?.overallEffort ?? 50;
  const hasTeacherIssues = courseAnnotations.some(
    (a) => a.teacherQuality === 'poor' || a.teacherQuality === 'terrible'
  );
  const hasExternalCircumstances = globalCircumstances.some(
    (c) => c.impact === 'major_negative'
  );

  if (reportedEffort < 40 && avgGPA > 3.5) {
    return {
      estimate: 'higher_than_grades',
      reasoning: `Low effort (${reportedEffort}%) with high grades suggests untapped potential`,
      confidence: 70,
      factors: ['low_effort', 'high_grades'],
    };
  } else if (reportedEffort > 75 && avgGPA < 3.3 && !hasTeacherIssues && !hasExternalCircumstances) {
    return {
      estimate: 'lower_than_grades',
      reasoning: `High effort needed for these grades suggests near current ceiling`,
      confidence: 60,
      factors: ['high_effort', 'moderate_grades'],
    };
  } else if (hasTeacherIssues || hasExternalCircumstances) {
    return {
      estimate: 'higher_than_grades',
      reasoning: `External factors (teacher quality or circumstances) likely affected grades`,
      confidence: 65,
      factors: hasTeacherIssues ? ['teacher_issues'] : ['external_circumstances'],
    };
  }

  return {
    estimate: 'matches_grades',
    reasoning: 'Grades appear to accurately reflect current capability',
    confidence: 60,
    factors: ['balanced_indicators'],
  };
}

/**
 * Generate a comprehensive capability synthesis using LLM.
 * This provides holistic analysis across all subjects.
 */
export async function generateHolisticCapabilitySynthesis(
  quantitativeAnalysis: NuancedCapabilityAnalysis,
  qualitativeInsights: QualitativeInsights
): Promise<{
  overallAssessment: string;
  hiddenStrengths: string[];
  hiddenChallenges: string[];
  keyInsights: string[];
  recommendedFocus: string[];
}> {
  // Build comprehensive context
  const subjectSummaries: string[] = [];

  for (const [subject, pattern] of Object.entries(quantitativeAnalysis.subjectPatterns)) {
    const qualInsight = qualitativeInsights.subjectInsights.get(subject as SubjectArea);
    subjectSummaries.push(
      `${formatSubject(subject)}: ` +
      `GPA ${GPA_TO_GRADE(pattern.performanceHistory.avgGPA)}, ` +
      `${pattern.performanceHistory.trend} trend, ` +
      `effort ${qualInsight?.overallEffort ?? 'unknown'}%, ` +
      `interest ${qualInsight?.overallInterest ?? 'unknown'}%`
    );
  }

  try {
    const systemPrompt = `You are an expert academic counselor providing holistic analysis of a student's academic profile.

Focus on patterns that span subjects and provide actionable insights:
- Where does this student truly shine vs struggle?
- What hidden potential or challenges might not be obvious from grades alone?
- What should they focus on to strengthen their profile?

Be specific and actionable. Avoid generic advice.`;

    const prompt = `Analyze this student's complete academic profile:

SUBJECT PERFORMANCE:
${subjectSummaries.join('\n')}

GLOBAL CIRCUMSTANCES:
${qualitativeInsights.globalCircumstances.map(c =>
  `- ${c.description} (${c.timeframe}, ${c.impact})`
).join('\n') || 'None reported'}

OVERALL TRAJECTORY: ${quantitativeAnalysis.progressionTrajectory.historical.overallTrend}

Provide a holistic synthesis as JSON:
{
  "overallAssessment": "2-3 sentence summary of this student's academic profile",
  "hiddenStrengths": ["strength not obvious from grades", ...],
  "hiddenChallenges": ["challenge that grades might mask", ...],
  "keyInsights": ["insight about their academic journey", ...],
  "recommendedFocus": ["specific action to strengthen profile", ...]
}

Return ONLY valid JSON.`;

    const response = await callClaude({
      model: 'claude-haiku-4-5-20251001',
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 800,
      temperature: 0.3,
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.warn('[ProfileSynthesizer] Holistic synthesis failed:', error);
  }

  // Fallback
  return {
    overallAssessment: 'Analysis based on available quantitative and qualitative data.',
    hiddenStrengths: [],
    hiddenChallenges: [],
    keyInsights: [],
    recommendedFocus: [],
  };
}
