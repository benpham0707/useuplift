// @ts-nocheck
/**
 * Academic Planning Advisor
 *
 * PURPOSE: Help students plan courses based on their ACTUAL capabilities,
 * not just their grades. Uses research data to provide grounded guidance on:
 *
 * 1. COURSE SELECTION - What classes should they take next?
 * 2. RIGOR CALIBRATION - Can they handle AP/IB level?
 * 3. WORKLOAD MANAGEMENT - How many rigorous courses can they manage?
 * 4. MAJOR ALIGNMENT - What courses do colleges expect for their major?
 * 5. TRAJECTORY OPTIMIZATION - How to show improvement over time?
 *
 * This is fundamentally different from application strategy (ED/EA timing,
 * school fit scores, etc.). This is about ACADEMIC PLANNING.
 */

import {
  COURSE_RIGOR_BENCHMARKS,
  GPA_CALIBRATION,
  GRADE_TRAJECTORY_ANALYSIS,
} from '../../../../knowledge/academicDatabase';

import type { SubjectArea } from '../types';
import type { NuancedCapabilityAnalysis, SubjectPattern } from '../nuancedCapabilityAnalyzer';
import type { QualitativeInsights, SubjectInsight } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface AcademicPlanningInput {
  /** Quantitative analysis of current performance */
  quantitativeAnalysis: NuancedCapabilityAnalysis;

  /** Qualitative insights from conversation (effort, interest, challenges) */
  qualitativeInsights?: QualitativeInsights;

  /** Student's intended major (affects course recommendations) */
  intendedMajor?: string;

  /** Current grade level (9, 10, 11, 12) */
  currentGrade: number;

  /** School context affects what's available and expected */
  schoolContext: {
    type: 'elite_prep' | 'competitive_magnet' | 'well_resourced_suburban' | 'average_public' | 'under_resourced' | 'rural_remote';
    apCoursesAvailable: string[]; // Specific APs available
    honorsCoursesAvailable: string[];
    dualEnrollmentAvailable: boolean;
  };

  /** Courses already planned/committed for next year (if any) */
  plannedCourses?: string[];
}

export interface AcademicPlanningAdvice {
  /** Overall assessment of current trajectory */
  trajectoryAssessment: TrajectoryAssessment;

  /** Specific course recommendations by subject */
  courseRecommendations: CourseRecommendation[];

  /** Workload analysis and recommendations */
  workloadAdvice: WorkloadAdvice;

  /** Major-specific guidance */
  majorAlignment: MajorAlignmentAdvice;

  /** Red flags to address */
  redFlags: AcademicRedFlag[];

  /** Opportunities to strengthen profile */
  opportunities: AcademicOpportunity[];

  /** Questions to ask in conversation to refine advice */
  probingQuestions: ProbingQuestion[];
}

export interface TrajectoryAssessment {
  /** Current trajectory pattern */
  pattern: 'ascending' | 'steady_strong' | 'steady_average' | 'declining' | 'erratic';

  /** How AOs will interpret this */
  aoInterpretation: string;

  /** What needs to happen to improve */
  recommendation: string;

  /** Specific actions to take */
  actionItems: string[];
}

export interface CourseRecommendation {
  subject: SubjectArea;

  /** What we recommend */
  recommendedLevel: 'ap' | 'honors' | 'regular' | 'remedial';
  specificCourse?: string;

  /** Why this recommendation */
  rationale: string;

  /** Evidence from their performance */
  evidenceBasis: string;

  /** Risk assessment */
  riskLevel: 'low' | 'medium' | 'high';
  riskExplanation?: string;

  /** Alternative if they can't handle recommended level */
  fallbackOption?: string;

  /** Questions to confirm this is right */
  confirmationQuestions: string[];
}

export interface WorkloadAdvice {
  /** Recommended number of rigorous courses */
  recommendedRigorousCourses: number;

  /** Maximum they could potentially handle */
  maxRigorousCourses: number;

  /** Current rigor level vs recommendation */
  currentVsRecommended: 'below' | 'at' | 'above';

  /** Basis for this recommendation */
  rationale: string;

  /** Specific balance recommendation */
  balanceAdvice: string;

  /** Warning signs to watch for */
  warningSignsOfOverload: string[];
}

export interface MajorAlignmentAdvice {
  /** Intended major (if specified) */
  major: string;

  /** Required courses for this major */
  requiredCourses: string[];

  /** Currently missing required courses */
  missingCourses: string[];

  /** Strong signal courses they should take */
  strongSignalCourses: string[];

  /** Current alignment score (0-100) */
  alignmentScore: number;

  /** Specific recommendations */
  recommendations: string[];

  /** Red flags for this major */
  redFlagsForMajor: string[];
}

export interface AcademicRedFlag {
  type: 'declining_trend' | 'missing_rigor' | 'major_mismatch' | 'inconsistent_effort' | 'avoiding_challenge';

  subject?: SubjectArea;

  description: string;

  /** How serious this is */
  severity: 'critical' | 'concerning' | 'minor';

  /** How to address */
  howToAddress: string;

  /** Whether this needs explanation in application */
  needsExplanation: boolean;
}

export interface AcademicOpportunity {
  type: 'step_up' | 'hidden_strength' | 'trajectory_boost' | 'major_alignment';

  description: string;

  /** Specific action to take */
  action: string;

  /** Expected benefit */
  benefit: string;

  /** Evidence this would work */
  evidenceBasis: string;
}

export interface ProbingQuestion {
  /** Topic area */
  topic: string;

  /** The question to ask */
  question: string;

  /** Why this matters for planning */
  whyItMatters: string;

  /** How the answer affects recommendations */
  howAnswerAffectsAdvice: string;
}

// ============================================================================
// CAPABILITY ESTIMATION
// ============================================================================

interface CapabilityEstimate {
  subject: SubjectArea;

  /** Estimated true capability (1-10 scale) */
  trueCapability: number;

  /** Confidence in this estimate (0-100) */
  confidence: number;

  /** Grade suggests vs capability suggests */
  gradeVsCapabilityGap: 'underperforming' | 'matches' | 'overperforming';

  /** Key evidence for this estimate */
  evidence: string[];

  /** Can handle AP level? */
  canHandleAP: boolean;
  apConfidence: number;

  /** Optimal rigor level */
  optimalLevel: 'ap' | 'honors' | 'regular';
}

/**
 * Estimate true capability in a subject based on grades + qualitative data.
 * This is the core insight: grades don't tell the whole story.
 */
function estimateCapability(
  subject: SubjectArea,
  pattern: SubjectPattern,
  qualitativeInsight?: SubjectInsight
): CapabilityEstimate {
  const avgGPA = pattern.performanceHistory.avgGPA;
  const trend = pattern.performanceHistory.trend;
  const courses = pattern.performanceHistory.courses;

  // Start with grade-based estimate
  let baseCapability = avgGPA / 4.0 * 10; // 0-10 scale

  const evidence: string[] = [];
  let confidence = 50; // Start at 50% confidence

  // Adjust based on qualitative data (if available)
  if (qualitativeInsight) {
    const effort = qualitativeInsight.effortLevel;
    const interest = qualitativeInsight.interestLevel;

    // LOW EFFORT + HIGH GRADES = Higher true capability
    if (effort !== undefined && effort < 40 && avgGPA >= 3.5) {
      baseCapability += 1.5;
      evidence.push(`Low effort (${effort}%) with high grades suggests untapped potential`);
      confidence += 15;
    }

    // HIGH EFFORT + LOWER GRADES = This might be their ceiling
    if (effort !== undefined && effort > 80 && avgGPA < 3.3) {
      baseCapability -= 0.5;
      evidence.push(`High effort (${effort}%) needed for current grades suggests at capacity`);
      confidence += 15;
    }

    // HIGH INTEREST = More likely to push through challenges
    if (interest !== undefined && interest > 70) {
      baseCapability += 0.5;
      evidence.push(`High interest (${interest}%) suggests motivation to succeed at higher level`);
      confidence += 10;
    }

    // Teacher issues = grades underrepresent capability
    if (qualitativeInsight.teacherQuality === 'poor' || qualitativeInsight.teacherQuality === 'terrible') {
      baseCapability += 1.0;
      evidence.push('Poor teacher quality likely suppressed grades');
      confidence += 10;
    }

    // External circumstances affected performance
    if (qualitativeInsight.externalCircumstances && qualitativeInsight.externalCircumstances.length > 0) {
      const significantCircumstances = qualitativeInsight.externalCircumstances.filter(
        c => c.impact === 'severe' || c.impact === 'significant'
      );
      if (significantCircumstances.length > 0) {
        baseCapability += 0.5 * significantCircumstances.length;
        evidence.push(`External circumstances (${significantCircumstances.map(c => c.type).join(', ')}) likely affected performance`);
        confidence += 10;
      }
    }
  } else {
    evidence.push('Limited qualitative data - estimate based primarily on grades');
  }

  // Adjust based on trajectory
  if (trend === 'improving' || trend === 'accelerating') {
    baseCapability += 0.5;
    evidence.push('Improving trajectory suggests capability is higher than recent grades show');
    confidence += 10;
  } else if (trend === 'declining') {
    // Declining could mean many things - don't adjust capability, but note it
    evidence.push('Declining trend needs investigation - may be workload, interest, or external factors');
    confidence -= 10;
  }

  // Adjust based on course rigor already taken
  const hasAP = courses.some(c => c.level.toLowerCase().includes('ap') || c.level.toLowerCase().includes('ib'));
  const hasHonors = courses.some(c => c.level.toLowerCase().includes('honors'));

  if (hasAP && avgGPA >= 3.3) {
    evidence.push('Already succeeding in AP coursework');
    confidence += 15;
  } else if (!hasAP && !hasHonors && avgGPA >= 3.7) {
    evidence.push('Strong grades in regular courses - ready for more challenge');
    baseCapability += 0.5;
  }

  // Bound capability
  baseCapability = Math.max(3, Math.min(10, baseCapability));
  confidence = Math.max(20, Math.min(95, confidence));

  // Determine if they can handle AP
  const canHandleAP = baseCapability >= 7;
  const apConfidence = canHandleAP
    ? Math.min(confidence, baseCapability >= 8 ? 85 : 65)
    : Math.max(100 - confidence, 30);

  // Determine optimal level
  let optimalLevel: 'ap' | 'honors' | 'regular';
  if (baseCapability >= 8) optimalLevel = 'ap';
  else if (baseCapability >= 6) optimalLevel = 'honors';
  else optimalLevel = 'regular';

  // Determine grade vs capability gap
  const gradeBasedCapability = avgGPA / 4.0 * 10;
  let gap: 'underperforming' | 'matches' | 'overperforming';
  if (baseCapability > gradeBasedCapability + 0.8) gap = 'underperforming';
  else if (baseCapability < gradeBasedCapability - 0.8) gap = 'overperforming';
  else gap = 'matches';

  return {
    subject,
    trueCapability: Math.round(baseCapability * 10) / 10,
    confidence,
    gradeVsCapabilityGap: gap,
    evidence,
    canHandleAP,
    apConfidence,
    optimalLevel,
  };
}

// ============================================================================
// COURSE RECOMMENDATION ENGINE
// ============================================================================

/**
 * Generate course recommendations based on capability estimates.
 */
function generateCourseRecommendations(
  input: AcademicPlanningInput,
  capabilityEstimates: Map<SubjectArea, CapabilityEstimate>
): CourseRecommendation[] {
  const recommendations: CourseRecommendation[] = [];

  for (const [subject, estimate] of capabilityEstimates) {
    const pattern = input.quantitativeAnalysis.subjectPatterns[subject];
    if (!pattern) continue;

    const currentLevel = getCurrentLevel(pattern);
    const qualInsight = input.qualitativeInsights?.subjectInsights?.[subject];

    // Determine recommendation based on capability + context
    let recommendedLevel = estimate.optimalLevel;
    let rationale = '';
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let riskExplanation: string | undefined;
    const confirmationQuestions: string[] = [];

    // CASE 1: Capability suggests stepping up
    if (estimate.gradeVsCapabilityGap === 'underperforming' && currentLevel !== 'ap') {
      recommendedLevel = estimate.optimalLevel;
      rationale = `Your ${estimate.evidence[0]}. This suggests you could handle a more challenging course.`;

      if (estimate.apConfidence < 70) {
        riskLevel = 'medium';
        riskExplanation = `While we think you can handle this, your ${estimate.confidence}% confidence score suggests some uncertainty.`;
        confirmationQuestions.push(`How do you feel about taking on more challenge in ${formatSubject(subject)}?`);
        confirmationQuestions.push(`What was your experience like in the harder parts of your current ${formatSubject(subject)} class?`);
      }
    }

    // CASE 2: Currently struggling - should they step down?
    else if (estimate.gradeVsCapabilityGap === 'overperforming' && currentLevel === 'ap') {
      if (qualInsight?.effortLevel && qualInsight.effortLevel > 85) {
        recommendedLevel = 'honors';
        rationale = `You're working extremely hard (${qualInsight.effortLevel}% effort) to maintain your current grades. This workload may not be sustainable.`;
        riskLevel = 'low';
        confirmationQuestions.push(`Is the current workload in ${formatSubject(subject)} affecting other areas of your life?`);
        confirmationQuestions.push(`If you could take back time spent on ${formatSubject(subject)}, where would you put it?`);
      } else {
        recommendedLevel = currentLevel as 'ap' | 'honors' | 'regular';
        rationale = `You're managing well, but this is near your optimal challenge level.`;
      }
    }

    // CASE 3: Aligned - stay the course or optimize
    else {
      recommendedLevel = estimate.optimalLevel;
      if (currentLevel === estimate.optimalLevel) {
        rationale = `Your current level is well-matched to your capability. Continue at this level.`;
      } else {
        rationale = `Based on your performance and effort patterns, ${estimate.optimalLevel} level would be optimal.`;
      }
    }

    // Check if recommended course is available
    const isAvailable = isCourseAvailable(subject, recommendedLevel, input.schoolContext);
    let fallbackOption: string | undefined;

    if (!isAvailable) {
      fallbackOption = getAlternativeCourse(subject, recommendedLevel, input.schoolContext);
      rationale += ` Note: ${recommendedLevel.toUpperCase()} ${formatSubject(subject)} may not be available at your school. Consider ${fallbackOption}.`;
    }

    // Add major-specific context if relevant
    const majorReq = getMajorRelevance(subject, input.intendedMajor);
    if (majorReq.isRequired) {
      rationale += ` For your intended major (${input.intendedMajor}), strong ${formatSubject(subject)} performance is ${majorReq.importance}.`;
      if (recommendedLevel !== 'ap' && majorReq.importance === 'critical') {
        riskLevel = 'high';
        riskExplanation = `${input.intendedMajor} programs expect AP-level ${formatSubject(subject)}. Not taking AP may raise questions.`;
      }
    }

    recommendations.push({
      subject,
      recommendedLevel,
      specificCourse: getSpecificCourseName(subject, recommendedLevel, input.currentGrade),
      rationale,
      evidenceBasis: estimate.evidence.join('. '),
      riskLevel,
      riskExplanation,
      fallbackOption,
      confirmationQuestions,
    });
  }

  return recommendations;
}

// ============================================================================
// WORKLOAD ADVISOR
// ============================================================================

/**
 * Recommend appropriate workload based on capability and current performance.
 */
function generateWorkloadAdvice(
  input: AcademicPlanningInput,
  capabilityEstimates: Map<SubjectArea, CapabilityEstimate>
): WorkloadAdvice {
  // Count current rigorous courses
  let currentRigorousCourses = 0;
  for (const pattern of Object.values(input.quantitativeAnalysis.subjectPatterns)) {
    for (const course of pattern.performanceHistory.courses) {
      if (course.level.toLowerCase().includes('ap') || course.level.toLowerCase().includes('ib')) {
        currentRigorousCourses++;
        break; // Count subject once
      }
    }
  }

  // Calculate average effort across subjects
  let totalEffort = 0;
  let effortCount = 0;
  if (input.qualitativeInsights?.subjectInsights) {
    for (const insight of Object.values(input.qualitativeInsights.subjectInsights)) {
      if (insight.effortLevel !== undefined) {
        totalEffort += insight.effortLevel;
        effortCount++;
      }
    }
  }
  const avgEffort = effortCount > 0 ? totalEffort / effortCount : 50;

  // Calculate average capability
  let totalCapability = 0;
  for (const estimate of capabilityEstimates.values()) {
    totalCapability += estimate.trueCapability;
  }
  const avgCapability = capabilityEstimates.size > 0 ? totalCapability / capabilityEstimates.size : 7;

  // Determine recommended rigorous courses based on grade level and capability
  const gradeExpectations = {
    9: { min: 1, standard: 2, max: 3 },
    10: { min: 2, standard: 3, max: 5 },
    11: { min: 3, standard: 4, max: 6 },
    12: { min: 3, standard: 4, max: 5 }, // Senior year often lighter
  };

  const gradeExp = gradeExpectations[input.currentGrade as keyof typeof gradeExpectations] || gradeExpectations[11];

  // Adjust based on capability and effort
  let recommended = gradeExp.standard;
  let max = gradeExp.max;

  if (avgCapability >= 8.5 && avgEffort < 60) {
    // High capability, low current effort = can handle more
    recommended = Math.min(gradeExp.max, recommended + 1);
    max = gradeExp.max + 1;
  } else if (avgCapability < 6.5 || avgEffort > 80) {
    // Lower capability or already working hard = be conservative
    recommended = Math.max(gradeExp.min, recommended - 1);
    max = gradeExp.standard;
  }

  // School context adjustment
  const schoolAdj = {
    'elite_prep': 1,
    'competitive_magnet': 1,
    'well_resourced_suburban': 0,
    'average_public': -1,
    'under_resourced': -1,
    'rural_remote': -1,
  };

  const adj = schoolAdj[input.schoolContext.type] || 0;
  recommended = Math.max(1, recommended + adj);
  max = Math.max(2, max + adj);

  // Determine current vs recommended
  let currentVsRecommended: 'below' | 'at' | 'above';
  if (currentRigorousCourses < recommended - 1) currentVsRecommended = 'below';
  else if (currentRigorousCourses > max) currentVsRecommended = 'above';
  else currentVsRecommended = 'at';

  // Build rationale
  let rationale = '';
  if (avgEffort > 75) {
    rationale = `Your current effort level (${Math.round(avgEffort)}%) suggests you're already working hard. `;
  } else if (avgEffort < 40) {
    rationale = `Your relatively low effort (${Math.round(avgEffort)}%) with good grades suggests room for more challenge. `;
  }

  rationale += `For a ${input.currentGrade}th grader at a ${input.schoolContext.type.replace(/_/g, ' ')} school, `;
  rationale += `${recommended} rigorous courses is typical for students at your capability level.`;

  // Build balance advice
  let balanceAdvice = '';
  if (currentVsRecommended === 'below') {
    balanceAdvice = `You could likely handle ${recommended - currentRigorousCourses} more rigorous course(s). This would strengthen your transcript without overwhelming you.`;
  } else if (currentVsRecommended === 'above') {
    balanceAdvice = `You're taking more rigorous courses than recommended. Consider whether you can maintain quality across all of them. It's better to excel in ${recommended} APs than struggle in ${currentRigorousCourses}.`;
  } else {
    balanceAdvice = `Your current course load is well-balanced for your capability level. Focus on excelling in what you have.`;
  }

  return {
    recommendedRigorousCourses: recommended,
    maxRigorousCourses: max,
    currentVsRecommended,
    rationale,
    balanceAdvice,
    warningSignsOfOverload: [
      'Sleeping less than 6 hours regularly',
      'Dropping extracurricular activities',
      'Grades declining across multiple subjects',
      'Feeling overwhelmed or anxious about schoolwork',
      'No time for things you enjoy',
    ],
  };
}

// ============================================================================
// MAJOR ALIGNMENT ADVISOR
// ============================================================================

/**
 * Assess alignment between current coursework and intended major.
 */
function generateMajorAlignmentAdvice(
  input: AcademicPlanningInput,
  capabilityEstimates: Map<SubjectArea, CapabilityEstimate>
): MajorAlignmentAdvice {
  const major = input.intendedMajor || 'Undecided';

  // Default for undecided
  if (!input.intendedMajor) {
    return {
      major: 'Undecided',
      requiredCourses: [],
      missingCourses: [],
      strongSignalCourses: [],
      alignmentScore: 100, // Can't be misaligned if undecided
      recommendations: [
        'Focus on exploring subjects to find your interests',
        'Take rigorous courses in areas where you show capability',
        'Keep options open by maintaining balance across subjects',
      ],
      redFlagsForMajor: [],
    };
  }

  // Get major-specific requirements from research
  const majorKey = getMajorKey(input.intendedMajor);
  const majorReqs = majorKey ? COURSE_RIGOR_BENCHMARKS.major_specific_rigor[majorKey] : null;

  if (!majorReqs) {
    return {
      major,
      requiredCourses: [],
      missingCourses: [],
      strongSignalCourses: [],
      alignmentScore: 70,
      recommendations: [`We don't have specific course requirements for ${major}. Focus on relevant subjects.`],
      redFlagsForMajor: [],
    };
  }

  // Get all courses student has taken
  const takenCourses = new Set<string>();
  for (const pattern of Object.values(input.quantitativeAnalysis.subjectPatterns)) {
    for (const course of pattern.performanceHistory.courses) {
      takenCourses.add(course.name.toLowerCase());
    }
  }

  // Add planned courses
  if (input.plannedCourses) {
    for (const course of input.plannedCourses) {
      takenCourses.add(course.toLowerCase());
    }
  }

  // Check required courses
  const requiredCourses = majorReqs.required_signals || [];
  const missingCourses: string[] = [];

  for (const required of requiredCourses) {
    const requiredLower = required.toLowerCase();
    // Check if any taken course matches (partial match for flexibility)
    const hasCourse = Array.from(takenCourses).some(c =>
      c.includes(requiredLower.replace('ap ', '').replace('(not just ab)', '').trim())
    );
    if (!hasCourse) {
      missingCourses.push(required);
    }
  }

  // Check strong signal courses
  const strongSignalCourses = majorReqs.strong_signals || [];
  const missingStrongSignals: string[] = [];

  for (const signal of strongSignalCourses) {
    const signalLower = signal.toLowerCase();
    const hasCourse = Array.from(takenCourses).some(c => c.includes(signalLower.replace('ap ', '')));
    if (!hasCourse) {
      missingStrongSignals.push(signal);
    }
  }

  // Check red flags
  const redFlags = majorReqs.red_flags || [];
  const activeRedFlags: string[] = [];

  for (const flag of redFlags) {
    const flagLower = flag.toLowerCase();
    // Red flags are things they SHOULDN'T have done
    if (flagLower.includes('no ')) {
      const courseName = flagLower.replace('no ', '').replace('ap ', '').trim();
      const hasCourse = Array.from(takenCourses).some(c => c.includes(courseName));
      if (!hasCourse) {
        activeRedFlags.push(flag);
      }
    } else if (flagLower.includes('stopped at')) {
      // Check if they stopped at a lower level when higher was expected
      // This would need more detailed course progression analysis
    }
  }

  // Calculate alignment score
  let alignmentScore = 100;
  alignmentScore -= missingCourses.length * 15; // -15 per missing required course
  alignmentScore -= missingStrongSignals.length * 5; // -5 per missing strong signal
  alignmentScore -= activeRedFlags.length * 20; // -20 per red flag
  alignmentScore = Math.max(0, Math.min(100, alignmentScore));

  // Generate recommendations
  const recommendations: string[] = [];

  if (missingCourses.length > 0) {
    recommendations.push(`CRITICAL: For ${major}, you need: ${missingCourses.slice(0, 3).join(', ')}`);
  }

  if (missingStrongSignals.length > 0 && alignmentScore > 50) {
    recommendations.push(`To strengthen your ${major} application, consider: ${missingStrongSignals.slice(0, 2).join(', ')}`);
  }

  if (alignmentScore >= 80) {
    recommendations.push(`Your coursework aligns well with ${major}. Continue on this path.`);
  } else if (alignmentScore >= 50) {
    recommendations.push(`Your coursework partially aligns with ${major}. Address the gaps to strengthen your application.`);
  } else {
    recommendations.push(`Your coursework doesn't strongly align with ${major}. Either add required courses or reconsider your intended major.`);
  }

  return {
    major,
    requiredCourses,
    missingCourses,
    strongSignalCourses: missingStrongSignals,
    alignmentScore,
    recommendations,
    redFlagsForMajor: activeRedFlags,
  };
}

// ============================================================================
// RED FLAGS AND OPPORTUNITIES
// ============================================================================

/**
 * Identify academic red flags that need addressing.
 */
function identifyRedFlags(
  input: AcademicPlanningInput,
  capabilityEstimates: Map<SubjectArea, CapabilityEstimate>,
  majorAlignment: MajorAlignmentAdvice
): AcademicRedFlag[] {
  const redFlags: AcademicRedFlag[] = [];

  // Check for declining trends
  for (const [subject, pattern] of Object.entries(input.quantitativeAnalysis.subjectPatterns)) {
    if (pattern.performanceHistory.trend === 'declining') {
      redFlags.push({
        type: 'declining_trend',
        subject: subject as SubjectArea,
        description: `Your grades in ${formatSubject(subject as SubjectArea)} are declining over time.`,
        severity: 'concerning',
        howToAddress: 'Identify what changed - workload, teaching quality, or interest? Address root cause.',
        needsExplanation: true,
      });
    }
  }

  // Check for missing rigor (capable but not challenged)
  for (const [subject, estimate] of capabilityEstimates) {
    const pattern = input.quantitativeAnalysis.subjectPatterns[subject];
    if (!pattern) continue;

    const currentLevel = getCurrentLevel(pattern);
    if (estimate.canHandleAP && estimate.apConfidence > 70 && currentLevel !== 'ap') {
      redFlags.push({
        type: 'missing_rigor',
        subject,
        description: `You have the capability for AP ${formatSubject(subject)} but aren't taking it.`,
        severity: 'concerning',
        howToAddress: 'Consider stepping up to AP level if available. If not available, pursue dual enrollment or self-study.',
        needsExplanation: false,
      });
    }
  }

  // Check major misalignment
  if (majorAlignment.missingCourses.length > 0) {
    redFlags.push({
      type: 'major_mismatch',
      description: `Missing critical courses for ${majorAlignment.major}: ${majorAlignment.missingCourses.join(', ')}`,
      severity: majorAlignment.missingCourses.length > 2 ? 'critical' : 'concerning',
      howToAddress: 'Prioritize adding these courses. If not possible, prepare to explain gaps.',
      needsExplanation: true,
    });
  }

  // Check for inconsistent effort patterns
  if (input.qualitativeInsights?.subjectInsights) {
    const efforts = Object.entries(input.qualitativeInsights.subjectInsights)
      .filter(([, insight]) => insight.effortLevel !== undefined)
      .map(([subject, insight]) => ({ subject, effort: insight.effortLevel! }));

    if (efforts.length >= 2) {
      const maxEffort = Math.max(...efforts.map(e => e.effort));
      const minEffort = Math.min(...efforts.map(e => e.effort));

      if (maxEffort - minEffort > 50) {
        const lowEffortSubject = efforts.find(e => e.effort === minEffort)?.subject;
        redFlags.push({
          type: 'inconsistent_effort',
          subject: lowEffortSubject as SubjectArea,
          description: `You're putting significantly less effort into ${lowEffortSubject} compared to other subjects.`,
          severity: 'minor',
          howToAddress: 'Consider whether this reflects your true interests. Colleges prefer consistent engagement.',
          needsExplanation: false,
        });
      }
    }
  }

  return redFlags;
}

/**
 * Identify opportunities to strengthen academic profile.
 */
function identifyOpportunities(
  input: AcademicPlanningInput,
  capabilityEstimates: Map<SubjectArea, CapabilityEstimate>,
  workloadAdvice: WorkloadAdvice
): AcademicOpportunity[] {
  const opportunities: AcademicOpportunity[] = [];

  // Opportunity: Step up where capable
  for (const [subject, estimate] of capabilityEstimates) {
    if (estimate.gradeVsCapabilityGap === 'underperforming' && estimate.canHandleAP) {
      opportunities.push({
        type: 'step_up',
        description: `Your capability in ${formatSubject(subject)} exceeds your current course level`,
        action: `Move to ${estimate.optimalLevel.toUpperCase()} ${formatSubject(subject)}`,
        benefit: 'Demonstrate academic ambition and true capability',
        evidenceBasis: estimate.evidence[0] || 'Performance suggests higher capability',
      });
    }
  }

  // Opportunity: Add rigor if room
  if (workloadAdvice.currentVsRecommended === 'below') {
    opportunities.push({
      type: 'trajectory_boost',
      description: `You can handle ${workloadAdvice.recommendedRigorousCourses - workloadAdvice.recommendedRigorousCourses} more rigorous course(s)`,
      action: 'Add an AP or Honors course in your strongest area',
      benefit: 'Strengthen transcript without overwhelming yourself',
      evidenceBasis: workloadAdvice.rationale,
    });
  }

  // Opportunity: Hidden strength
  for (const [subject, estimate] of capabilityEstimates) {
    if (estimate.confidence > 75 && estimate.trueCapability >= 8 && estimate.gradeVsCapabilityGap === 'underperforming') {
      opportunities.push({
        type: 'hidden_strength',
        description: `${formatSubject(subject)} appears to be a hidden strength`,
        action: 'Consider pursuing this subject more seriously - competitions, research, or advanced coursework',
        benefit: 'Could become a "spike" that distinguishes your application',
        evidenceBasis: estimate.evidence.join('. '),
      });
    }
  }

  return opportunities;
}

// ============================================================================
// PROBING QUESTIONS
// ============================================================================

/**
 * Generate questions to ask in conversation to refine advice.
 */
function generateProbingQuestions(
  input: AcademicPlanningInput,
  capabilityEstimates: Map<SubjectArea, CapabilityEstimate>,
  redFlags: AcademicRedFlag[]
): ProbingQuestion[] {
  const questions: ProbingQuestion[] = [];

  // Question for subjects where we're uncertain
  for (const [subject, estimate] of capabilityEstimates) {
    if (estimate.confidence < 60) {
      questions.push({
        topic: `${formatSubject(subject)} Capability`,
        question: `Tell me more about your experience in ${formatSubject(subject)}. How much effort did it take to get your grades?`,
        whyItMatters: 'Effort level helps us understand if grades reflect capability or hard work',
        howAnswerAffectsAdvice: 'High effort + lower grades suggests at capacity. Low effort + high grades suggests room to step up.',
      });
    }
  }

  // Questions for red flags
  for (const flag of redFlags.filter(f => f.needsExplanation)) {
    if (flag.type === 'declining_trend') {
      questions.push({
        topic: `${formatSubject(flag.subject!)} Decline`,
        question: `Your grades in ${formatSubject(flag.subject!)} dropped over time. What happened?`,
        whyItMatters: 'Understanding the cause helps determine if you can recover',
        howAnswerAffectsAdvice: 'External factors = can highlight context. Lost interest = may inform major choice.',
      });
    }
  }

  // Question about workload capacity
  questions.push({
    topic: 'Workload Capacity',
    question: 'How do you typically feel about your current workload? Manageable, challenging, or overwhelming?',
    whyItMatters: 'Helps calibrate how many rigorous courses to recommend',
    howAnswerAffectsAdvice: 'Feeling overwhelmed = fewer APs. Feeling bored = more challenge needed.',
  });

  // Question about future goals
  if (!input.intendedMajor) {
    questions.push({
      topic: 'Intended Major',
      question: 'Do you have an idea of what you might want to study in college?',
      whyItMatters: 'Major-specific course requirements vary significantly',
      howAnswerAffectsAdvice: 'CS needs Calc BC and Physics C. Pre-med needs all sciences. Humanities needs AP English and History.',
    });
  }

  return questions.slice(0, 5); // Limit to 5 questions
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

export class AcademicPlanningAdvisor {
  /**
   * Generate comprehensive academic planning advice based on capability
   * assessment and research data.
   */
  generateAdvice(input: AcademicPlanningInput): AcademicPlanningAdvice {
    // 1. Estimate true capability for each subject
    const capabilityEstimates = new Map<SubjectArea, CapabilityEstimate>();

    for (const [subject, pattern] of Object.entries(input.quantitativeAnalysis.subjectPatterns)) {
      const qualInsight = input.qualitativeInsights?.subjectInsights?.[subject as SubjectArea];
      const estimate = estimateCapability(subject as SubjectArea, pattern, qualInsight);
      capabilityEstimates.set(subject as SubjectArea, estimate);
    }

    // 2. Generate trajectory assessment
    const trajectoryAssessment = this.assessTrajectory(input);

    // 3. Generate course recommendations
    const courseRecommendations = generateCourseRecommendations(input, capabilityEstimates);

    // 4. Generate workload advice
    const workloadAdvice = generateWorkloadAdvice(input, capabilityEstimates);

    // 5. Generate major alignment advice
    const majorAlignment = generateMajorAlignmentAdvice(input, capabilityEstimates);

    // 6. Identify red flags
    const redFlags = identifyRedFlags(input, capabilityEstimates, majorAlignment);

    // 7. Identify opportunities
    const opportunities = identifyOpportunities(input, capabilityEstimates, workloadAdvice);

    // 8. Generate probing questions
    const probingQuestions = generateProbingQuestions(input, capabilityEstimates, redFlags);

    return {
      trajectoryAssessment,
      courseRecommendations,
      workloadAdvice,
      majorAlignment,
      redFlags,
      opportunities,
      probingQuestions,
    };
  }

  private assessTrajectory(input: AcademicPlanningInput): TrajectoryAssessment {
    const trend = input.quantitativeAnalysis.progressionTrajectory.historical.overallTrend;

    // Map to our patterns
    let pattern: TrajectoryAssessment['pattern'];
    switch (trend) {
      case 'accelerating': pattern = 'ascending'; break;
      case 'improving': pattern = 'ascending'; break;
      case 'stable': pattern = 'steady_strong'; break;
      case 'declining': pattern = 'declining'; break;
      case 'fluctuating': pattern = 'erratic'; break;
      default: pattern = 'steady_average';
    }

    // Get research-based interpretation
    const patternKey = pattern === 'ascending' ? 'ascending_strong' :
                       pattern === 'steady_strong' ? 'consistently_excellent' :
                       pattern === 'declining' ? 'descending' :
                       pattern === 'erratic' ? 'erratic' : 'consistently_excellent';

    const researchPattern = GRADE_TRAJECTORY_ANALYSIS.patterns[patternKey];

    const actionItems: string[] = [];
    if (pattern === 'declining') {
      actionItems.push('Identify what caused the decline and address it');
      actionItems.push('Focus on stabilizing grades before adding more rigor');
      actionItems.push('Consider addressing this in Additional Information');
    } else if (pattern === 'ascending') {
      actionItems.push('Maintain the upward trajectory');
      actionItems.push('Consider stepping up rigor if capable');
      actionItems.push('This narrative will help your application');
    } else if (pattern === 'erratic') {
      actionItems.push('Work on consistency across semesters');
      actionItems.push('Identify what causes the fluctuations');
    }

    return {
      pattern,
      aoInterpretation: researchPattern.ao_interpretation,
      recommendation: researchPattern.notes || '',
      actionItems,
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatSubject(subject: SubjectArea): string {
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

function getCurrentLevel(pattern: SubjectPattern): 'ap' | 'honors' | 'regular' {
  const latestCourse = pattern.performanceHistory.courses[0];
  if (!latestCourse) return 'regular';

  const level = latestCourse.level.toLowerCase();
  if (level.includes('ap') || level.includes('ib')) return 'ap';
  if (level.includes('honors')) return 'honors';
  return 'regular';
}

function isCourseAvailable(
  subject: SubjectArea,
  level: 'ap' | 'honors' | 'regular',
  schoolContext: AcademicPlanningInput['schoolContext']
): boolean {
  if (level === 'regular') return true;
  if (level === 'honors') {
    return schoolContext.honorsCoursesAvailable.some(c =>
      c.toLowerCase().includes(subject.replace('_', ' '))
    );
  }
  return schoolContext.apCoursesAvailable.some(c =>
    c.toLowerCase().includes(subject.replace('_', ' '))
  );
}

function getAlternativeCourse(
  subject: SubjectArea,
  level: 'ap' | 'honors' | 'regular',
  schoolContext: AcademicPlanningInput['schoolContext']
): string {
  if (schoolContext.dualEnrollmentAvailable) {
    return `Dual Enrollment ${formatSubject(subject)} at local college`;
  }
  if (level === 'ap') {
    return `Honors ${formatSubject(subject)} + self-study for AP exam`;
  }
  return `Regular ${formatSubject(subject)} + enrichment activities`;
}

function getMajorRelevance(subject: SubjectArea, intendedMajor?: string): {
  isRequired: boolean;
  importance: 'critical' | 'important' | 'helpful' | 'neutral';
} {
  if (!intendedMajor) return { isRequired: false, importance: 'neutral' };

  const majorLower = intendedMajor.toLowerCase();

  if (majorLower.includes('engineer') || majorLower.includes('cs') || majorLower.includes('computer')) {
    if (subject === 'math') return { isRequired: true, importance: 'critical' };
    if (subject === 'science') return { isRequired: true, importance: 'critical' };
    if (subject === 'computer_science') return { isRequired: true, importance: 'critical' };
  }

  if (majorLower.includes('med') || majorLower.includes('bio')) {
    if (subject === 'science') return { isRequired: true, importance: 'critical' };
    if (subject === 'math') return { isRequired: true, importance: 'important' };
  }

  if (majorLower.includes('english') || majorLower.includes('history') || majorLower.includes('philosophy')) {
    if (subject === 'english') return { isRequired: true, importance: 'critical' };
    if (subject === 'social_studies') return { isRequired: true, importance: 'important' };
  }

  if (majorLower.includes('business') || majorLower.includes('econ')) {
    if (subject === 'math') return { isRequired: true, importance: 'important' };
    if (subject === 'social_studies') return { isRequired: true, importance: 'helpful' };
  }

  return { isRequired: false, importance: 'neutral' };
}

function getSpecificCourseName(subject: SubjectArea, level: 'ap' | 'honors' | 'regular', grade: number): string {
  const gradeSpecific: Record<SubjectArea, Record<number, Record<string, string>>> = {
    math: {
      11: { ap: 'AP Calculus AB/BC', honors: 'Pre-Calculus Honors', regular: 'Pre-Calculus' },
      12: { ap: 'AP Calculus BC or AP Statistics', honors: 'Calculus Honors', regular: 'Calculus' },
    },
    science: {
      11: { ap: 'AP Physics 1 or AP Chemistry', honors: 'Chemistry Honors', regular: 'Chemistry' },
      12: { ap: 'AP Physics C or AP Biology', honors: 'Physics Honors', regular: 'Physics' },
    },
    english: {
      11: { ap: 'AP English Language', honors: 'English 11 Honors', regular: 'English 11' },
      12: { ap: 'AP English Literature', honors: 'English 12 Honors', regular: 'English 12' },
    },
    social_studies: {
      11: { ap: 'AP US History', honors: 'US History Honors', regular: 'US History' },
      12: { ap: 'AP Government or AP Economics', honors: 'Government Honors', regular: 'Government' },
    },
    foreign_language: {
      11: { ap: 'AP Spanish/French/etc.', honors: 'Spanish 4 Honors', regular: 'Spanish 4' },
      12: { ap: 'AP Spanish Literature', honors: 'Spanish 5 Honors', regular: 'Spanish 5' },
    },
    computer_science: {
      11: { ap: 'AP Computer Science A', honors: 'Computer Science Honors', regular: 'Intro to CS' },
      12: { ap: 'AP Computer Science Principles', honors: 'Data Structures', regular: 'Programming' },
    },
    arts: {
      11: { ap: 'AP Art History or AP Music Theory', honors: 'Art History Honors', regular: 'Art History' },
      12: { ap: 'AP Studio Art', honors: 'Advanced Art', regular: 'Art' },
    },
    other: {
      11: { ap: 'AP Course', honors: 'Honors Course', regular: 'Course' },
      12: { ap: 'AP Course', honors: 'Honors Course', regular: 'Course' },
    },
  };

  return gradeSpecific[subject]?.[grade]?.[level] || `${level.toUpperCase()} ${formatSubject(subject)}`;
}

function getMajorKey(major: string): keyof typeof COURSE_RIGOR_BENCHMARKS.major_specific_rigor | null {
  const majorLower = major.toLowerCase();

  if (majorLower.includes('engineer') || majorLower.includes('computer') || majorLower.includes('cs')) {
    return 'engineering_cs';
  }
  if (majorLower.includes('med') || majorLower.includes('bio') || majorLower.includes('pre-med')) {
    return 'pre_med';
  }
  if (majorLower.includes('english') || majorLower.includes('history') || majorLower.includes('philosophy') || majorLower.includes('literature')) {
    return 'humanities';
  }
  if (majorLower.includes('business') || majorLower.includes('econ')) {
    return 'business_economics';
  }

  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const academicPlanningAdvisor = new AcademicPlanningAdvisor();

export function generateAcademicPlanningAdvice(input: AcademicPlanningInput): AcademicPlanningAdvice {
  return academicPlanningAdvisor.generateAdvice(input);
}
