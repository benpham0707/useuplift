/**
 * Research-Backed Extracurricular Profiler
 *
 * A comprehensive, research-validated system for analyzing extracurricular profiles
 * based on actual elite college admissions criteria and expert counselor insights.
 *
 * Research Sources:
 * - Harvard's 1-6 scoring system (revealed in admissions lawsuit documents)
 * - Stanford Dean Richard H. Shaw's "depth over breadth" philosophy
 * - Sara Harberson's (former Penn Dean of Admissions) point system
 * - CollegeVine tier system analysis
 * - Pre-med advisor consensus on clinical/research hours
 * - MIT admissions officer interviews on STEM evaluation
 *
 * Key Principles Implemented:
 * 1. Grade-level weighting (Junior > Sophomore > Freshman)
 * 2. Duration commitment scoring (3-5 years = ideal)
 * 3. Spike detection over well-roundedness
 * 4. Total portfolio time realism
 * 5. Red flag detection for manufactured activities
 * 6. Major-specific expectations
 * 7. Clear reasoning chains for every assessment
 *
 * @module researchBackedProfiler
 */

import { MajorCategory } from '../knowledge/majorActivityAlignment';
import { ActivityCategory, ActivityTier } from '../types/activities';
import {
  NuancedProfilingInput,
  FieldExpectations,
  DescriptionQualityAnalysis,
  TimeCommitmentAnalysis,
  AuthenticityAnalysis,
  MajorAlignmentAnalysis,
  PortfolioInterconnectionAnalysis,
} from '../types/nuancedProfiling';
import { getFieldExpectations, normalizeMajor } from '../knowledge/fieldSpecificExpectations';

// ============================================================================
// RESEARCH-BACKED CONSTANTS
// ============================================================================

/**
 * Grade-level importance weights based on admissions research
 * Source: CollegeVine analysis + PrepScholar research
 *
 * Junior year is the "academic centerpiece" - final full year seen before application
 * Sophomore year shows you're "no longer adjusting"
 * Freshman year is "transition year" - least weight
 */
export const GRADE_LEVEL_WEIGHTS = {
  9: 0.7, // Freshman - transition year, least important
  10: 0.85, // Sophomore - building foundation
  11: 1.0, // Junior - MOST important (final full year)
  12: 0.95, // Senior - important but incomplete at application time
} as const;

/**
 * Duration commitment scoring (Sara Harberson model)
 * Source: Sara Harberson (former Penn Dean of Admissions)
 *
 * "Top universities specifically recommend focusing on two to three activities
 * with long-term commitments of three to five years"
 */
export const DURATION_SCORES = {
  years4Plus: { score: 4, label: 'Exceptional commitment', description: 'Full high school dedication' },
  years3: { score: 3, label: 'Strong commitment', description: 'Sustained multi-year involvement' },
  years2: { score: 2, label: 'Moderate commitment', description: 'Building dedication' },
  years1: { score: 1, label: 'Brief involvement', description: 'New or exploratory' },
} as const;

/**
 * Harvard's extracurricular rating system (1-6)
 * Source: Harvard admissions lawsuit documents
 *
 * 1 = National/international distinction with potential for future growth
 * 2 = Statewide/regional distinction with high involvement
 * 3 = Deep participation but no particular distinction
 * 4 = Participation with some commitment
 * 5 = Minimal participation
 * 6 = No meaningful extracurricular involvement
 */
export const HARVARD_RATING_MAP = {
  1: { tier: 1, description: 'National/international distinction with growth potential' },
  2: { tier: 2, description: 'Statewide/regional distinction, high involvement' },
  3: { tier: 3, description: 'Deep participation without distinction' },
  4: { tier: 4, description: 'Participation with some commitment' },
  5: { tier: 4, description: 'Minimal participation' },
  6: { tier: 4, description: 'No meaningful involvement' },
} as const;

/**
 * Realistic weekly time budgets for high school students
 * Source: Multiple admissions counselor interviews
 *
 * "It doesn't make sense that you somehow volunteered at a community library
 * 20 hours per week—while being a part of the school choir that goes on
 * regional competitions while taking four AP classes on top of being the
 * main player for the football team."
 */
export const TIME_REALISM_THRESHOLDS = {
  // Maximum sustainable weekly extracurricular hours
  maxTotalWeeklyHours: 35, // Beyond this is implausible for most students
  suspiciousWeeklyHours: 25, // Above this warrants scrutiny
  normalWeeklyHours: 20, // Typical for involved students

  // Per-activity maximums by category
  maxPerActivityByCategory: {
    athletics: 25, // Varsity sport during season
    performing_arts: 20, // Serious musician/actor
    research: 15, // Lab work during school year
    entrepreneurship: 20, // Running actual business
    community_service: 15, // Outside of service trips
    academic_competition: 10, // Competition prep
    leadership_governance: 8, // Student government
    default: 12,
  } as Record<string, number>,
} as const;

/**
 * Spike vs. Breadth evaluation criteria
 * Source: Stanford admissions philosophy
 *
 * "Stanford prefers applicants with well-developed specialties rather than
 * well-rounded students... they are more interested in looking at the depth
 * of a student's achievements in a specific area rather than breadth"
 */
export const SPIKE_CRITERIA = {
  // Minimum activities in primary interest area for "spike"
  minActivitiesForSpike: 3,

  // Minimum tier average for "spike" area
  minTierAverageForSpike: 2.5, // At least Tier 2-3 average

  // Maximum number of "orphan" activities (unrelated to spike)
  maxOrphanActivities: 2,

  // Minimum percentage of time in spike area
  minTimePercentageForSpike: 0.5, // 50% of time in primary area
} as const;

// ============================================================================
// REASONING CHAIN TYPES
// ============================================================================

/**
 * Structured reasoning that explains every assessment
 */
export interface ReasoningStep {
  factor: string;
  observation: string;
  implication: string;
  weight: number; // How much this affects final score
}

export interface AssessmentReasoning {
  conclusion: string;
  confidence: number;
  steps: ReasoningStep[];
  comparisons: {
    vsTypical: string;
    vsTopApplicant: string;
    fieldSpecific: string;
  };
  admissionsOfficerPerspective: string;
}

// ============================================================================
// ENHANCED ACTIVITY INPUT
// ============================================================================

export interface EnhancedActivityInput {
  id: string;
  name: string;
  organization?: string;
  category: ActivityCategory;
  description: string;
  role: string;
  hoursPerWeek: number;
  weeksPerYear: number;
  yearsInvolved: number;
  gradeLevels: number[]; // [9, 10, 11, 12]
  isPaid?: boolean;
  achievements?: {
    name: string;
    level: 'international' | 'national' | 'state' | 'regional' | 'school' | 'local';
    date?: string;
  }[];
  progression?: {
    grade: number;
    role: string;
    hoursPerWeek: number;
  }[];
}

// ============================================================================
// ENHANCED PROFILE OUTPUT
// ============================================================================

export interface EnhancedActivityAssessment {
  activityId: string;
  activityName: string;

  // Core classification with confidence
  tier: ActivityTier;
  harvardRating: 1 | 2 | 3 | 4 | 5 | 6;
  tierConfidence: number;

  // Sara Harberson scoring
  harbersonScore: {
    durationPoints: number; // 1-4 based on years
    leadershipPoints: number; // 0-3 based on role
    majorAlignmentPoints: number; // 0-2 based on field relevance
    hoursPoints: number; // 0-2 based on commitment level
    totalPoints: number;
    ranking: number; // Suggested order in Common App (1 = top)
  };

  // Grade-level analysis
  gradeLevelAnalysis: {
    yearsActive: number[];
    weightedScore: number; // Accounts for junior year importance
    startedEarly: boolean; // Freshman/sophomore start
    sustainedThroughJunior: boolean;
    progressionPattern: 'increasing' | 'stable' | 'decreasing' | 'late_start' | 'gap';
  };

  // Time credibility
  timeCredibility: {
    score: number;
    level: 'highly_credible' | 'credible' | 'questionable' | 'implausible';
    weeklyHours: number;
    totalHours: number;
    categoryMax: number;
    redFlags: string[];
    reasoning: string;
  };

  // Authenticity assessment
  authenticity: {
    score: number;
    level: 'highly_authentic' | 'authentic' | 'neutral' | 'questionable' | 'likely_manufactured';
    positiveSignals: string[];
    concernSignals: string[];
    verificationIndicators: string[];
    reasoning: string;
  };

  // Major alignment
  majorAlignment: {
    score: number;
    type: 'core' | 'supporting' | 'complementary' | 'neutral' | 'misaligned';
    reasoning: string;
    fieldSpecificNotes: string;
  };

  // Description quality
  descriptionQuality: {
    score: number;
    level: 'exceptional' | 'strong' | 'adequate' | 'weak' | 'problematic';
    strengths: string[];
    issues: string[];
    suggestedImprovement: string;
  };

  // Complete reasoning chain
  reasoning: AssessmentReasoning;

  // Priority improvements
  priorityImprovements: string[];
}

export interface SpikeAnalysis {
  hasSpike: boolean;
  spikeArea: string | null;
  spikeStrength: 'exceptional' | 'strong' | 'moderate' | 'weak' | 'none';
  spikeActivities: string[];
  orphanActivities: string[];
  breadthVsDepth: 'depth_focused' | 'balanced' | 'breadth_scattered';
  reasoning: string;
  admissionsImplication: string;
}

export interface PortfolioTimeRealism {
  totalWeeklyHours: number;
  isRealistic: boolean;
  level: 'highly_credible' | 'credible' | 'questionable' | 'implausible';
  concerningActivities: string[];
  reasoning: string;
}

export interface EnhancedPortfolioAssessment {
  // Metadata
  evaluatedAt: string;
  version: string;

  // Student context
  studentContext: {
    intendedMajor: MajorCategory;
    majorCertainty: 'certain' | 'likely' | 'exploring' | 'undecided';
    gradeLevel: number;
  };

  // Individual activity assessments
  activityAssessments: EnhancedActivityAssessment[];

  // Portfolio-level analysis
  portfolioAnalysis: {
    // Spike analysis (Stanford model)
    spikeAnalysis: SpikeAnalysis;

    // Time realism
    timeRealism: PortfolioTimeRealism;

    // Major alignment
    majorAlignment: {
      overallScore: number;
      level: 'exceptional' | 'strong' | 'adequate' | 'weak' | 'misaligned';
      coreActivities: string[];
      gaps: string[];
      redFlags: string[];
      competitivePosition: string;
    };

    // Overall tier distribution
    tierDistribution: {
      tier1Count: number;
      tier2Count: number;
      tier3Count: number;
      tier4Count: number;
      harvardRatingAverage: number;
    };

    // Narrative coherence
    narrativeCoherence: {
      score: number;
      primaryTheme: string;
      supportingThemes: string[];
      orphanActivities: string[];
      storyPotential: string;
    };
  };

  // Common App ordering recommendation
  commonAppOrdering: {
    order: string[]; // Activity IDs in recommended order
    reasoning: string[];
    topFiveStrategy: string;
  };

  // Comprehensive recommendations
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    descriptionOptimizations: {
      activityId: string;
      current: string;
      suggested: string;
      improvement: string;
    }[];
    narrativeAdvice: string;
  };

  // Overall assessment
  overallAssessment: {
    competitiveLevel: 'highly_competitive' | 'competitive' | 'developing' | 'needs_work';
    harvardRatingEstimate: 1 | 2 | 3 | 4 | 5 | 6;
    strengthSummary: string;
    weaknessSummary: string;
    admissionsOfficerPerspective: string;
  };

  // Confidence and caveats
  analysisConfidence: {
    overallConfidence: number;
    caveats: string[];
    areasNeedingMoreInfo: string[];
  };
}

// ============================================================================
// MAIN PROFILER CLASS
// ============================================================================

export class ResearchBackedProfiler {
  /**
   * Analyze a complete extracurricular profile with research-backed methodology
   */
  async analyzeProfile(input: NuancedProfilingInput): Promise<EnhancedPortfolioAssessment> {
    const normalizedMajor = normalizeMajor(input.studentContext.intendedMajor);
    const fieldExpectations = getFieldExpectations(normalizedMajor);

    // Analyze each activity
    const activityAssessments = input.activities.map((activity) =>
      this.analyzeActivity(
        {
          ...activity,
          achievements: activity.achievements?.map((a) => ({
            name: a.title,
            level: a.level,
            date: a.date,
          })),
        },
        normalizedMajor,
        fieldExpectations,
        input.activities
      )
    );

    // Sort by Harberson score for ordering
    activityAssessments.sort((a, b) => b.harbersonScore.totalPoints - a.harbersonScore.totalPoints);

    // Assign rankings
    activityAssessments.forEach((assessment, index) => {
      assessment.harbersonScore.ranking = index + 1;
    });

    // Portfolio-level analysis
    const spikeAnalysis = this.analyzeSpikeVsBreadth(activityAssessments, normalizedMajor);
    const timeRealism = this.analyzePortfolioTimeRealism(input.activities);
    const majorAlignment = this.analyzePortfolioMajorAlignment(
      activityAssessments,
      normalizedMajor,
      fieldExpectations
    );
    const tierDistribution = this.calculateTierDistribution(activityAssessments);
    const narrativeCoherence = this.analyzeNarrativeCoherence(activityAssessments, normalizedMajor);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      activityAssessments,
      spikeAnalysis,
      majorAlignment,
      fieldExpectations
    );

    // Overall assessment
    const overallAssessment = this.generateOverallAssessment(
      activityAssessments,
      spikeAnalysis,
      majorAlignment,
      tierDistribution,
      normalizedMajor
    );

    return {
      evaluatedAt: new Date().toISOString(),
      version: '2.0.0-research-backed',

      studentContext: {
        intendedMajor: normalizedMajor,
        majorCertainty: input.studentContext.majorCertainty || 'exploring',
        gradeLevel: input.studentContext.gradeLevel,
      },

      activityAssessments,

      portfolioAnalysis: {
        spikeAnalysis,
        timeRealism,
        majorAlignment,
        tierDistribution,
        narrativeCoherence,
      },

      commonAppOrdering: {
        order: activityAssessments.map((a) => a.activityId),
        reasoning: this.generateOrderingReasoning(activityAssessments),
        topFiveStrategy: this.generateTopFiveStrategy(activityAssessments, normalizedMajor),
      },

      recommendations,

      overallAssessment,

      analysisConfidence: {
        overallConfidence: this.calculateConfidence(input, activityAssessments),
        caveats: this.generateCaveats(input),
        areasNeedingMoreInfo: this.identifyMissingInfo(input),
      },
    };
  }

  /**
   * Analyze a single activity with full reasoning chain
   */
  private analyzeActivity(
    activity: EnhancedActivityInput,
    major: MajorCategory,
    fieldExpectations: FieldExpectations,
    allActivities: EnhancedActivityInput[]
  ): EnhancedActivityAssessment {
    const reasoningSteps: ReasoningStep[] = [];

    // 1. Calculate Harberson score
    const harbersonScore = this.calculateHarbersonScore(activity, major, fieldExpectations);

    // 2. Grade-level analysis
    const gradeLevelAnalysis = this.analyzeGradeLevels(activity);
    reasoningSteps.push({
      factor: 'Grade Level Distribution',
      observation: `Active in grades ${activity.gradeLevels.join(', ')}`,
      implication: gradeLevelAnalysis.sustainedThroughJunior
        ? 'Shows sustained commitment through critical junior year'
        : gradeLevelAnalysis.startedEarly
          ? 'Early start shows genuine interest'
          : 'Late start may raise authenticity questions',
      weight: 0.15,
    });

    // 3. Time credibility
    const timeCredibility = this.analyzeTimeCredibility(activity, allActivities);
    reasoningSteps.push({
      factor: 'Time Commitment Credibility',
      observation: `Claims ${activity.hoursPerWeek} hrs/week for ${activity.weeksPerYear} weeks/year`,
      implication: timeCredibility.level === 'highly_credible' || timeCredibility.level === 'credible'
        ? 'Time commitment appears realistic and sustainable'
        : 'Time claims warrant scrutiny',
      weight: 0.1,
    });

    // 4. Authenticity assessment
    const authenticity = this.assessAuthenticity(activity, gradeLevelAnalysis);
    reasoningSteps.push({
      factor: 'Authenticity Signals',
      observation: `${authenticity.positiveSignals.length} positive signals, ${authenticity.concernSignals.length} concerns`,
      implication: authenticity.reasoning,
      weight: 0.2,
    });

    // 5. Major alignment
    const majorAlignment = this.assessMajorAlignment(activity, major, fieldExpectations);
    reasoningSteps.push({
      factor: 'Major Alignment',
      observation: `${majorAlignment.type} activity for ${major}`,
      implication: majorAlignment.fieldSpecificNotes,
      weight: 0.25,
    });

    // 6. Description quality
    const descriptionQuality = this.assessDescriptionQuality(activity, fieldExpectations);
    reasoningSteps.push({
      factor: 'Description Quality',
      observation: `${descriptionQuality.level} description (${descriptionQuality.score}/100)`,
      implication: descriptionQuality.issues.length > 0
        ? `Issues: ${descriptionQuality.issues.slice(0, 2).join('; ')}`
        : 'Well-crafted description with specific details',
      weight: 0.15,
    });

    // 7. Determine tier
    const { tier, harvardRating, tierConfidence } = this.determineTier(
      activity,
      harbersonScore,
      majorAlignment,
      authenticity,
      gradeLevelAnalysis
    );
    reasoningSteps.push({
      factor: 'Overall Tier Assessment',
      observation: `Tier ${tier} (Harvard Rating: ${harvardRating})`,
      implication: HARVARD_RATING_MAP[harvardRating].description,
      weight: 0.15,
    });

    // Generate complete reasoning
    const reasoning = this.generateAssessmentReasoning(
      activity,
      tier,
      harvardRating,
      reasoningSteps,
      major,
      fieldExpectations
    );

    // Generate priority improvements
    const priorityImprovements = this.generatePriorityImprovements(
      activity,
      tier,
      descriptionQuality,
      majorAlignment,
      authenticity,
      major
    );

    return {
      activityId: activity.id,
      activityName: activity.name,
      tier,
      harvardRating,
      tierConfidence,
      harbersonScore,
      gradeLevelAnalysis,
      timeCredibility,
      authenticity,
      majorAlignment,
      descriptionQuality,
      reasoning,
      priorityImprovements,
    };
  }

  /**
   * Calculate Sara Harberson's point system for activity ordering
   *
   * Source: Sara Harberson, former Penn Dean of Admissions
   * "For criteria #1, number of years the student has participated in the activity,
   * assign points based on involvement: 4 points if activity has been done all four years of high school."
   */
  private calculateHarbersonScore(
    activity: EnhancedActivityInput,
    major: MajorCategory,
    fieldExpectations: FieldExpectations
  ): EnhancedActivityAssessment['harbersonScore'] {
    // Duration points (1-4)
    let durationPoints = 0;
    if (activity.yearsInvolved >= 4) durationPoints = 4;
    else if (activity.yearsInvolved >= 3) durationPoints = 3;
    else if (activity.yearsInvolved >= 2) durationPoints = 2;
    else durationPoints = 1;

    // Leadership points (0-3)
    let leadershipPoints = 0;
    const roleLower = activity.role.toLowerCase();
    if (
      roleLower.includes('founder') ||
      roleLower.includes('president') ||
      roleLower.includes('captain') ||
      roleLower.includes('editor-in-chief') ||
      roleLower.includes('director')
    ) {
      leadershipPoints = 3;
    } else if (
      roleLower.includes('vice') ||
      roleLower.includes('officer') ||
      roleLower.includes('lead') ||
      roleLower.includes('head') ||
      roleLower.includes('coordinator')
    ) {
      leadershipPoints = 2;
    } else if (
      roleLower.includes('secretary') ||
      roleLower.includes('treasurer') ||
      roleLower.includes('manager') ||
      roleLower.includes('editor')
    ) {
      leadershipPoints = 1;
    }

    // Major alignment points (0-2)
    let majorAlignmentPoints = 0;
    const isCoreActivity = this.isCoreActivityForMajor(activity, major, fieldExpectations);
    const isSupportingActivity = this.isSupportingActivityForMajor(activity, major);
    if (isCoreActivity) majorAlignmentPoints = 2;
    else if (isSupportingActivity) majorAlignmentPoints = 1;

    // Hours points (0-2)
    let hoursPoints = 0;
    const weeklyHours = activity.hoursPerWeek;
    if (weeklyHours >= 10) hoursPoints = 2;
    else if (weeklyHours >= 5) hoursPoints = 1;

    const totalPoints = durationPoints + leadershipPoints + majorAlignmentPoints + hoursPoints;

    return {
      durationPoints,
      leadershipPoints,
      majorAlignmentPoints,
      hoursPoints,
      totalPoints,
      ranking: 0, // Will be assigned after sorting
    };
  }

  /**
   * Analyze grade-level distribution and progression
   */
  private analyzeGradeLevels(activity: EnhancedActivityInput): EnhancedActivityAssessment['gradeLevelAnalysis'] {
    const yearsActive = [...activity.gradeLevels].sort();
    const startedEarly = yearsActive.includes(9) || yearsActive.includes(10);
    const sustainedThroughJunior = yearsActive.includes(11);

    // Calculate weighted score - multiply by years to reward duration
    let weightedScore = 0;
    for (const grade of yearsActive) {
      const weight = GRADE_LEVEL_WEIGHTS[grade as keyof typeof GRADE_LEVEL_WEIGHTS] || 0.8;
      weightedScore += weight;
    }
    // Normalize but keep higher for more years (max around 3.5 for all 4 years)
    weightedScore = weightedScore; // Keep cumulative to reward duration

    // Determine progression pattern
    let progressionPattern: 'increasing' | 'stable' | 'decreasing' | 'late_start' | 'gap' = 'stable';

    if (yearsActive.length === 1 && yearsActive[0] >= 11) {
      progressionPattern = 'late_start';
    } else if (yearsActive.length > 1) {
      // Check for gaps
      for (let i = 1; i < yearsActive.length; i++) {
        if (yearsActive[i] - yearsActive[i - 1] > 1) {
          progressionPattern = 'gap';
          break;
        }
      }
    }

    // If progression data exists, analyze it
    if (activity.progression && activity.progression.length > 1) {
      const firstHours = activity.progression[0].hoursPerWeek;
      const lastHours = activity.progression[activity.progression.length - 1].hoursPerWeek;
      if (lastHours > firstHours * 1.3) progressionPattern = 'increasing';
      else if (lastHours < firstHours * 0.7) progressionPattern = 'decreasing';
    }

    return {
      yearsActive,
      weightedScore,
      startedEarly,
      sustainedThroughJunior,
      progressionPattern,
    };
  }

  /**
   * Analyze time commitment credibility
   *
   * Source: Admissions counselor consensus
   * "Admissions officers advise students not to exaggerate volunteer, work, or
   * extracurricular experience, nor the number of weekly hours spent in such activities."
   */
  private analyzeTimeCredibility(
    activity: EnhancedActivityInput,
    allActivities: EnhancedActivityInput[]
  ): EnhancedActivityAssessment['timeCredibility'] {
    const redFlags: string[] = [];
    let score = 100;

    const weeklyHours = activity.hoursPerWeek;
    const totalHours = weeklyHours * activity.weeksPerYear * activity.yearsInvolved;

    // Get category maximum
    const categoryMax =
      TIME_REALISM_THRESHOLDS.maxPerActivityByCategory[activity.category] ||
      TIME_REALISM_THRESHOLDS.maxPerActivityByCategory.default;

    // Check individual activity time
    if (weeklyHours > categoryMax * 1.5) {
      redFlags.push(`Weekly hours (${weeklyHours}) significantly exceed typical for ${activity.category}`);
      score -= 30;
    } else if (weeklyHours > categoryMax) {
      redFlags.push(`Weekly hours (${weeklyHours}) above typical for ${activity.category}`);
      score -= 15;
    }

    // Check for implausible hours
    if (weeklyHours > 40) {
      redFlags.push('Weekly hours exceed full-time job (40+ hours)');
      score -= 40;
    } else if (weeklyHours > 30) {
      redFlags.push('Very high weekly hours (30+) - needs strong justification');
      score -= 20;
    }

    // Check weeks per year
    if (activity.weeksPerYear > 50 && weeklyHours > 15) {
      redFlags.push('Year-round high commitment - verify sustainability');
      score -= 10;
    }

    // Check against portfolio total
    const totalPortfolioHours = allActivities.reduce((sum, a) => sum + a.hoursPerWeek, 0);
    if (totalPortfolioHours > TIME_REALISM_THRESHOLDS.maxTotalWeeklyHours) {
      redFlags.push(`Portfolio total (${totalPortfolioHours} hrs/wk) exceeds sustainable limit`);
      score -= 15;
    }

    // Determine level
    let level: 'highly_credible' | 'credible' | 'questionable' | 'implausible' = 'highly_credible';
    if (score < 50) level = 'implausible';
    else if (score < 70) level = 'questionable';
    else if (score < 90) level = 'credible';

    const reasoning = redFlags.length > 0
      ? `Time commitment raises concerns: ${redFlags.join('; ')}`
      : `Time commitment of ${weeklyHours} hrs/wk for ${activity.category} is realistic and within typical range`;

    return {
      score: Math.max(0, score),
      level,
      weeklyHours,
      totalHours,
      categoryMax,
      redFlags,
      reasoning,
    };
  }

  /**
   * Assess authenticity of activity
   *
   * Source: Multiple admissions counselor interviews
   * "Admissions officers are highly trained at spotting inconsistencies"
   */
  private assessAuthenticity(
    activity: EnhancedActivityInput,
    gradeLevelAnalysis: EnhancedActivityAssessment['gradeLevelAnalysis']
  ): EnhancedActivityAssessment['authenticity'] {
    const positiveSignals: string[] = [];
    const concernSignals: string[] = [];
    const verificationIndicators: string[] = [];
    let score = 70; // Start neutral

    // Positive signals
    if (gradeLevelAnalysis.startedEarly) {
      positiveSignals.push('Early start (freshman/sophomore year) suggests genuine interest');
      score += 10;
    }

    if (activity.yearsInvolved >= 3) {
      positiveSignals.push(`Sustained ${activity.yearsInvolved}-year commitment shows dedication`);
      score += 10;
    }

    if (gradeLevelAnalysis.progressionPattern === 'increasing') {
      positiveSignals.push('Increasing involvement over time shows deepening commitment');
      score += 5;
    }

    if (activity.achievements && activity.achievements.length > 0) {
      const externalValidation = activity.achievements.filter(
        (a) => a.level !== 'school' && a.level !== 'local'
      );
      if (externalValidation.length > 0) {
        positiveSignals.push(`External validation through ${externalValidation.length} achievement(s)`);
        verificationIndicators.push(`${externalValidation.length} externally verifiable achievements`);
        score += 10;
      }
    }

    // Concern signals
    if (gradeLevelAnalysis.progressionPattern === 'late_start') {
      concernSignals.push('Activity started only in junior/senior year - common resume padding signal');
      score -= 20;
    }

    const roleLower = activity.role.toLowerCase();
    if (
      (roleLower.includes('founder') || roleLower.includes('ceo') || roleLower.includes('president')) &&
      activity.yearsInvolved <= 1
    ) {
      concernSignals.push('Inflated title (Founder/CEO/President) with brief involvement');
      score -= 15;
    }

    if (activity.hoursPerWeek > 30 && (!activity.achievements || activity.achievements.length === 0)) {
      concernSignals.push('Very high hours claimed without corresponding achievements');
      score -= 10;
    }

    // Check for buzzword-heavy description without substance
    const descLower = activity.description.toLowerCase();
    const buzzwords = ['passionate', 'innovative', 'revolutionary', 'groundbreaking', 'world-changing'];
    const buzzwordCount = buzzwords.filter((b) => descLower.includes(b)).length;
    if (buzzwordCount >= 2 && activity.description.length < 100) {
      concernSignals.push('Buzzword-heavy description without specific substance');
      score -= 10;
    }

    // Verification indicators
    if (activity.organization) {
      verificationIndicators.push(`Organization: ${activity.organization} can verify involvement`);
    }

    // Determine level
    let level: EnhancedActivityAssessment['authenticity']['level'] = 'authentic';
    if (score >= 85) level = 'highly_authentic';
    else if (score >= 70) level = 'authentic';
    else if (score >= 55) level = 'neutral';
    else if (score >= 40) level = 'questionable';
    else level = 'likely_manufactured';

    const reasoning =
      score >= 70
        ? `Activity shows ${positiveSignals.length} positive authenticity signals indicating genuine involvement`
        : `Activity has ${concernSignals.length} concern(s) that may warrant scrutiny: ${concernSignals.slice(0, 2).join('; ')}`;

    return {
      score: Math.max(0, Math.min(100, score)),
      level,
      positiveSignals,
      concernSignals,
      verificationIndicators,
      reasoning,
    };
  }

  /**
   * Assess major alignment
   */
  private assessMajorAlignment(
    activity: EnhancedActivityInput,
    major: MajorCategory,
    fieldExpectations: FieldExpectations
  ): EnhancedActivityAssessment['majorAlignment'] {
    const isCore = this.isCoreActivityForMajor(activity, major, fieldExpectations);
    const isSupporting = this.isSupportingActivityForMajor(activity, major);

    let score = 0;
    let type: 'core' | 'supporting' | 'complementary' | 'neutral' | 'misaligned' = 'neutral';

    if (isCore) {
      score = 5;
      type = 'core';
    } else if (isSupporting) {
      score = 3;
      type = 'supporting';
    } else {
      // Check for complementary
      const isComplementary = this.isComplementaryActivity(activity, major);
      if (isComplementary) {
        score = 2;
        type = 'complementary';
      } else {
        score = 1;
        type = 'neutral';
      }
    }

    // Check for warning signals
    const warningSignals = fieldExpectations.tierExpectations.warningSignals;
    const descLower = activity.description.toLowerCase();
    const matchedWarnings = warningSignals.filter((w) => descLower.includes(w.toLowerCase().split(' ')[0]));
    if (matchedWarnings.length > 0) {
      score = Math.max(0, score - 1);
      if (score === 0) type = 'misaligned';
    }

    // Generate field-specific notes
    let fieldSpecificNotes = '';
    switch (major) {
      case 'computer_science':
        if (type === 'core') fieldSpecificNotes = 'Core CS activity - admissions will expect technical depth';
        else if (type === 'neutral')
          fieldSpecificNotes = "Activity doesn't demonstrate CS skills - consider highlighting technical aspects";
        break;
      case 'pre_med':
        if (type === 'core')
          fieldSpecificNotes = 'Core pre-med activity - shows clinical exposure or research commitment';
        else if (type === 'neutral')
          fieldSpecificNotes = "Activity doesn't show healthcare interest - consider linking to service aspect";
        break;
      case 'business_economics':
        if (type === 'core')
          fieldSpecificNotes = 'Core business activity - demonstrates entrepreneurial or analytical skills';
        break;
      default:
        fieldSpecificNotes = `${type === 'core' ? 'Strongly aligned' : type === 'supporting' ? 'Supports' : 'Not directly related to'} ${major} major`;
    }

    const reasoning = `Activity is ${type} for ${major}: ${fieldSpecificNotes}`;

    return {
      score,
      type,
      reasoning,
      fieldSpecificNotes,
    };
  }

  /**
   * Assess description quality
   */
  private assessDescriptionQuality(
    activity: EnhancedActivityInput,
    fieldExpectations: FieldExpectations
  ): EnhancedActivityAssessment['descriptionQuality'] {
    const strengths: string[] = [];
    const issues: string[] = [];
    let score = 50; // Start neutral

    const desc = activity.description;
    const descLower = desc.toLowerCase();

    // Check for quantification
    const hasNumbers = /\d+/.test(desc);
    if (hasNumbers) {
      strengths.push('Includes specific numbers/metrics');
      score += 15;
    } else {
      issues.push('Missing quantifiable metrics - add specific numbers');
      score -= 10;
    }

    // Check for action verbs
    const strongVerbs = fieldExpectations.descriptionExpectations.actionVerbs;
    const usedStrongVerbs = strongVerbs.filter((v) => descLower.includes(v.toLowerCase()));
    if (usedStrongVerbs.length >= 2) {
      strengths.push(`Uses strong action verbs: ${usedStrongVerbs.slice(0, 3).join(', ')}`);
      score += 10;
    } else if (usedStrongVerbs.length === 0) {
      issues.push('Uses passive language - add active verbs');
      score -= 10;
    }

    // Check for field-specific terms
    const keyTerms = fieldExpectations.descriptionExpectations.keyTerms;
    const usedKeyTerms = keyTerms.filter((t) => descLower.includes(t.toLowerCase()));
    if (usedKeyTerms.length >= 2) {
      strengths.push('Demonstrates field knowledge with appropriate terminology');
      score += 10;
    }

    // Check for avoid terms
    const avoidTerms = fieldExpectations.descriptionExpectations.avoidTerms;
    const usedAvoidTerms = avoidTerms.filter((t) => descLower.includes(t.toLowerCase()));
    if (usedAvoidTerms.length > 0) {
      issues.push(`Uses weak/generic phrasing: "${usedAvoidTerms[0]}"`);
      score -= 15;
    }

    // Check length
    if (desc.length < 50) {
      issues.push('Description too brief - expand with specifics');
      score -= 10;
    } else if (desc.length > 140 && desc.length <= 150) {
      strengths.push('Maximizes character limit effectively');
      score += 5;
    }

    // Check for specific impact
    const impactPatterns = ['increased', 'reduced', 'improved', 'raised', 'saved', 'grew'];
    const hasImpact = impactPatterns.some((p) => descLower.includes(p));
    if (hasImpact) {
      strengths.push('Shows measurable impact');
      score += 10;
    } else {
      issues.push("Missing clear impact statement - add 'what changed because of you'");
      score -= 5;
    }

    // Determine level
    let level: EnhancedActivityAssessment['descriptionQuality']['level'] = 'adequate';
    if (score >= 85) level = 'exceptional';
    else if (score >= 70) level = 'strong';
    else if (score >= 55) level = 'adequate';
    else if (score >= 40) level = 'weak';
    else level = 'problematic';

    // Generate improvement suggestion
    let suggestedImprovement = '';
    if (issues.length > 0) {
      suggestedImprovement = issues[0].split(' - ')[1] || issues[0];
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      level,
      strengths,
      issues,
      suggestedImprovement,
    };
  }

  /**
   * Determine final tier and Harvard rating
   */
  private determineTier(
    activity: EnhancedActivityInput,
    harbersonScore: EnhancedActivityAssessment['harbersonScore'],
    majorAlignment: EnhancedActivityAssessment['majorAlignment'],
    authenticity: EnhancedActivityAssessment['authenticity'],
    gradeLevelAnalysis: EnhancedActivityAssessment['gradeLevelAnalysis']
  ): { tier: ActivityTier; harvardRating: 1 | 2 | 3 | 4 | 5 | 6; tierConfidence: number } {
    let tier: ActivityTier = 4;
    let harvardRating: 1 | 2 | 3 | 4 | 5 | 6 = 4;
    let tierConfidence = 70;

    // Check for Tier 1 indicators
    const hasTier1Achievement = activity.achievements?.some(
      (a) => a.level === 'international' || a.level === 'national'
    );

    const roleLower = activity.role.toLowerCase();
    const isFounderWithTraction =
      (roleLower.includes('founder') || roleLower.includes('ceo')) &&
      activity.yearsInvolved >= 2 &&
      authenticity.score >= 70;

    if (hasTier1Achievement || isFounderWithTraction) {
      tier = 1;
      harvardRating = 1;
      tierConfidence = 85;
    }
    // Check for Tier 2
    else if (
      activity.achievements?.some((a) => a.level === 'state' || a.level === 'regional') ||
      (harbersonScore.leadershipPoints >= 2 && harbersonScore.durationPoints >= 3)
    ) {
      tier = 2;
      harvardRating = 2;
      tierConfidence = 80;
    }
    // Check for Tier 3
    else if (harbersonScore.totalPoints >= 6 || (majorAlignment.type === 'core' && activity.yearsInvolved >= 2)) {
      tier = 3;
      harvardRating = 3;
      tierConfidence = 75;
    }
    // Default to Tier 4
    else {
      tier = 4;
      harvardRating = 4;
      tierConfidence = 70;
    }

    // Adjust confidence based on authenticity
    if (authenticity.level === 'questionable' || authenticity.level === 'likely_manufactured') {
      tierConfidence -= 20;
    }

    return { tier, harvardRating, tierConfidence };
  }

  /**
   * Generate complete assessment reasoning
   */
  private generateAssessmentReasoning(
    activity: EnhancedActivityInput,
    tier: ActivityTier,
    harvardRating: 1 | 2 | 3 | 4 | 5 | 6,
    steps: ReasoningStep[],
    major: MajorCategory,
    fieldExpectations: FieldExpectations
  ): AssessmentReasoning {
    const conclusion = `"${activity.name}" is evaluated as Tier ${tier} (Harvard Rating ${harvardRating}) based on ${steps.length} assessment factors.`;

    const confidence = steps.reduce((acc, step) => acc + step.weight * 100, 0) / steps.length;

    const comparisons = {
      vsTypical: tier <= 2
        ? 'Above typical applicant - this activity distinguishes you'
        : tier === 3
          ? 'At par with competitive applicants - depth or achievement needed to stand out'
          : 'Common participation level - consider how to deepen involvement',
      vsTopApplicant: tier === 1
        ? 'Competitive with top applicants'
        : tier === 2
          ? 'Strong but top applicants may have higher achievements'
          : 'Top applicants typically have more impressive credentials in this area',
      fieldSpecific:
        major === 'computer_science'
          ? tier <= 2
            ? 'For CS, this demonstrates the technical depth MIT/Stanford expect'
            : 'For CS applicants, technical projects with measurable impact are expected'
          : major === 'pre_med'
            ? tier <= 2
              ? 'Shows the clinical/research commitment expected for pre-med'
              : 'Pre-med applicants typically need 200+ clinical hours and research experience'
            : `For ${major}, this ${tier <= 2 ? 'meets' : 'falls short of'} typical expectations`,
    };

    const admissionsOfficerPerspective =
      tier === 1
        ? 'An admissions officer would recognize this as a distinguishing achievement that demonstrates exceptional capability.'
        : tier === 2
          ? 'An admissions officer would see this as strong involvement worthy of attention, though not rare.'
          : tier === 3
            ? 'An admissions officer would view this as solid participation but would look for distinguishing factors.'
            : 'An admissions officer would note participation but this alone would not differentiate the application.';

    return {
      conclusion,
      confidence,
      steps,
      comparisons,
      admissionsOfficerPerspective,
    };
  }

  /**
   * Generate priority improvements for an activity
   */
  private generatePriorityImprovements(
    activity: EnhancedActivityInput,
    tier: ActivityTier,
    descriptionQuality: EnhancedActivityAssessment['descriptionQuality'],
    majorAlignment: EnhancedActivityAssessment['majorAlignment'],
    authenticity: EnhancedActivityAssessment['authenticity'],
    major: MajorCategory
  ): string[] {
    const improvements: string[] = [];

    // Description improvements
    if (descriptionQuality.issues.length > 0) {
      improvements.push(`Description: ${descriptionQuality.issues[0]}`);
    }

    // Tier elevation suggestions
    if (tier === 4 || tier === 3) {
      if (activity.yearsInvolved < 2) {
        improvements.push('Continue involvement to show sustained commitment');
      }
      if (!activity.achievements || activity.achievements.length === 0) {
        improvements.push('Seek competitive recognition or external validation');
      }
    }

    // Major alignment suggestions
    if (majorAlignment.type === 'neutral' || majorAlignment.type === 'misaligned') {
      improvements.push(`Highlight aspects relevant to ${major} in description`);
    }

    // Authenticity concerns
    if (authenticity.concernSignals.length > 0) {
      improvements.push('Address authenticity by emphasizing specific contributions and outcomes');
    }

    return improvements.slice(0, 3); // Return top 3
  }

  // ============================================================================
  // PORTFOLIO-LEVEL ANALYSIS METHODS
  // ============================================================================

  /**
   * Analyze spike vs. breadth (Stanford model)
   */
  private analyzeSpikeVsBreadth(
    assessments: EnhancedActivityAssessment[],
    major: MajorCategory
  ): SpikeAnalysis {
    // Group activities by alignment to major
    const coreActivities = assessments.filter((a) => a.majorAlignment.type === 'core');
    const supportingActivities = assessments.filter((a) => a.majorAlignment.type === 'supporting');
    const orphanActivities = assessments.filter(
      (a) => a.majorAlignment.type === 'neutral' || a.majorAlignment.type === 'misaligned'
    );

    const spikeActivities = [...coreActivities, ...supportingActivities];
    const hasSpike = spikeActivities.length >= SPIKE_CRITERIA.minActivitiesForSpike;

    // Calculate average tier of spike activities
    const spikeTierAverage =
      spikeActivities.length > 0
        ? spikeActivities.reduce((sum, a) => sum + a.tier, 0) / spikeActivities.length
        : 4;

    // Calculate time percentage in spike area
    const totalHours = assessments.reduce((sum, a) => sum + a.timeCredibility.weeklyHours, 0);
    const spikeHours = spikeActivities.reduce((sum, a) => sum + a.timeCredibility.weeklyHours, 0);
    const spikeTimePercentage = totalHours > 0 ? spikeHours / totalHours : 0;

    // Determine spike strength
    let spikeStrength: SpikeAnalysis['spikeStrength'] = 'none';
    if (hasSpike && spikeTierAverage <= 2 && spikeTimePercentage >= 0.6) {
      spikeStrength = 'exceptional';
    } else if (hasSpike && spikeTierAverage <= 2.5 && spikeTimePercentage >= 0.5) {
      spikeStrength = 'strong';
    } else if (hasSpike && spikeTierAverage <= 3) {
      spikeStrength = 'moderate';
    } else if (hasSpike) {
      spikeStrength = 'weak';
    }

    // Determine breadth vs depth
    let breadthVsDepth: SpikeAnalysis['breadthVsDepth'] = 'balanced';
    if (spikeActivities.length >= 4 && orphanActivities.length <= 2) {
      breadthVsDepth = 'depth_focused';
    } else if (orphanActivities.length > spikeActivities.length) {
      breadthVsDepth = 'breadth_scattered';
    }

    const reasoning = hasSpike
      ? `Profile shows a ${spikeStrength} spike in ${major}-related activities with ${spikeActivities.length} aligned activities. ` +
        `${Math.round(spikeTimePercentage * 100)}% of time invested in primary interest area.`
      : `Profile lacks a clear spike - activities are distributed across multiple unrelated areas. ` +
        `Consider deepening involvement in ${major}-related activities.`;

    const admissionsImplication =
      spikeStrength === 'exceptional' || spikeStrength === 'strong'
        ? 'Stanford and MIT admissions would view this favorably - clear passion and depth demonstrated.'
        : spikeStrength === 'moderate'
          ? 'Admissions officers would see interest but may look for deeper achievement in primary area.'
          : 'Profile appears "well-rounded" rather than "spiked" - elite schools increasingly prefer depth.';

    return {
      hasSpike,
      spikeArea: hasSpike ? major : null,
      spikeStrength,
      spikeActivities: spikeActivities.map((a) => a.activityId),
      orphanActivities: orphanActivities.map((a) => a.activityId),
      breadthVsDepth,
      reasoning,
      admissionsImplication,
    };
  }

  /**
   * Analyze portfolio-level time realism
   */
  private analyzePortfolioTimeRealism(activities: EnhancedActivityInput[]): PortfolioTimeRealism {
    const totalWeeklyHours = activities.reduce((sum, a) => sum + a.hoursPerWeek, 0);

    const concerningActivities: string[] = [];
    for (const activity of activities) {
      if (activity.hoursPerWeek > 20) {
        concerningActivities.push(`${activity.name}: ${activity.hoursPerWeek} hrs/wk`);
      }
    }

    let level: PortfolioTimeRealism['level'] = 'highly_credible';
    let isRealistic = true;

    if (totalWeeklyHours > TIME_REALISM_THRESHOLDS.maxTotalWeeklyHours) {
      level = 'implausible';
      isRealistic = false;
    } else if (totalWeeklyHours > TIME_REALISM_THRESHOLDS.suspiciousWeeklyHours) {
      level = 'questionable';
      isRealistic = false;
    } else if (totalWeeklyHours > TIME_REALISM_THRESHOLDS.normalWeeklyHours) {
      level = 'credible';
    }

    const reasoning =
      level === 'highly_credible'
        ? `Total ${totalWeeklyHours} hrs/wk is within typical range for an involved student.`
        : level === 'credible'
          ? `Total ${totalWeeklyHours} hrs/wk is high but feasible for a very active student.`
          : `Total ${totalWeeklyHours} hrs/wk raises questions - admissions officers may find this implausible alongside academics.`;

    return {
      totalWeeklyHours,
      isRealistic,
      level,
      concerningActivities,
      reasoning,
    };
  }

  /**
   * Analyze portfolio major alignment
   */
  private analyzePortfolioMajorAlignment(
    assessments: EnhancedActivityAssessment[],
    major: MajorCategory,
    fieldExpectations: FieldExpectations
  ): EnhancedPortfolioAssessment['portfolioAnalysis']['majorAlignment'] {
    const coreActivities = assessments.filter((a) => a.majorAlignment.type === 'core');
    const supportingActivities = assessments.filter((a) => a.majorAlignment.type === 'supporting');

    // Calculate overall score
    let overallScore = 0;
    for (const assessment of assessments) {
      overallScore += assessment.majorAlignment.score * 20; // Convert 0-5 to 0-100
    }
    overallScore = assessments.length > 0 ? overallScore / assessments.length : 0;

    // Identify gaps
    const gaps: string[] = [];
    const expectations = fieldExpectations.tierExpectations.expectedActivities;

    // Check for missing expected activities
    for (const expected of expectations.slice(0, 3)) {
      // Check top 3 expected activities
      const hasRelated = assessments.some(
        (a) => a.descriptionQuality.strengths.some((s) => s.toLowerCase().includes(expected.toLowerCase().split(' ')[0]))
      );
      if (!hasRelated) {
        gaps.push(`Consider adding: ${expected}`);
      }
    }

    // Identify red flags
    const redFlags: string[] = [];
    for (const assessment of assessments) {
      if (assessment.authenticity.level === 'questionable' || assessment.authenticity.level === 'likely_manufactured') {
        redFlags.push(`${assessment.activityName}: Authenticity concerns`);
      }
    }

    // Determine level
    let level: 'exceptional' | 'strong' | 'adequate' | 'weak' | 'misaligned' = 'adequate';
    if (overallScore >= 80 && coreActivities.length >= 2) level = 'exceptional';
    else if (overallScore >= 60 && coreActivities.length >= 1) level = 'strong';
    else if (overallScore >= 40) level = 'adequate';
    else if (overallScore >= 20) level = 'weak';
    else level = 'misaligned';

    const competitivePosition =
      level === 'exceptional'
        ? `Profile strongly aligned with ${major} - competitive with top applicants`
        : level === 'strong'
          ? `Good alignment with ${major} - solid foundation for application`
          : `Alignment with ${major} needs strengthening - consider focusing activities`;

    return {
      overallScore,
      level,
      coreActivities: coreActivities.map((a) => a.activityId),
      gaps,
      redFlags,
      competitivePosition,
    };
  }

  /**
   * Calculate tier distribution
   */
  private calculateTierDistribution(
    assessments: EnhancedActivityAssessment[]
  ): EnhancedPortfolioAssessment['portfolioAnalysis']['tierDistribution'] {
    const tier1Count = assessments.filter((a) => a.tier === 1).length;
    const tier2Count = assessments.filter((a) => a.tier === 2).length;
    const tier3Count = assessments.filter((a) => a.tier === 3).length;
    const tier4Count = assessments.filter((a) => a.tier === 4).length;

    const harvardRatingAverage =
      assessments.length > 0
        ? assessments.reduce((sum, a) => sum + a.harvardRating, 0) / assessments.length
        : 4;

    return {
      tier1Count,
      tier2Count,
      tier3Count,
      tier4Count,
      harvardRatingAverage,
    };
  }

  /**
   * Analyze narrative coherence
   */
  private analyzeNarrativeCoherence(
    assessments: EnhancedActivityAssessment[],
    major: MajorCategory
  ): EnhancedPortfolioAssessment['portfolioAnalysis']['narrativeCoherence'] {
    const coreActivities = assessments.filter((a) => a.majorAlignment.type === 'core');
    const orphanActivities = assessments.filter(
      (a) => a.majorAlignment.type === 'neutral' || a.majorAlignment.type === 'misaligned'
    );

    // Calculate coherence score
    const alignedPercentage = (assessments.length - orphanActivities.length) / assessments.length;
    const score = Math.round(alignedPercentage * 100);

    // Identify primary theme
    const primaryTheme =
      coreActivities.length >= 2
        ? `${major}-focused with ${coreActivities.length} core activities`
        : assessments.length > 0
          ? assessments[0].activityName
          : 'No clear theme';

    // Identify supporting themes
    const supportingThemes: string[] = [];
    const categories = new Set(assessments.map((a) => a.majorAlignment.type));
    if (categories.has('supporting')) supportingThemes.push('Supporting activities present');
    if (categories.has('complementary')) supportingThemes.push('Complementary interests shown');

    const storyPotential =
      score >= 80
        ? 'Strong narrative potential - activities tell a cohesive story'
        : score >= 60
          ? 'Moderate narrative potential - some connections exist'
          : 'Weak narrative potential - activities appear disconnected';

    return {
      score,
      primaryTheme,
      supportingThemes,
      orphanActivities: orphanActivities.map((a) => a.activityId),
      storyPotential,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    assessments: EnhancedActivityAssessment[],
    spikeAnalysis: SpikeAnalysis,
    majorAlignment: EnhancedPortfolioAssessment['portfolioAnalysis']['majorAlignment'],
    fieldExpectations: FieldExpectations
  ): EnhancedPortfolioAssessment['recommendations'] {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const descriptionOptimizations: EnhancedPortfolioAssessment['recommendations']['descriptionOptimizations'] = [];

    // Immediate: Description improvements
    for (const assessment of assessments) {
      if (assessment.descriptionQuality.issues.length > 0) {
        descriptionOptimizations.push({
          activityId: assessment.activityId,
          current: 'Current description has issues',
          suggested: assessment.descriptionQuality.suggestedImprovement,
          improvement: assessment.descriptionQuality.issues[0],
        });
        immediate.push(`Improve ${assessment.activityName} description: ${assessment.descriptionQuality.issues[0]}`);
      }
    }

    // Short-term: Spike development
    if (spikeAnalysis.spikeStrength === 'weak' || !spikeAnalysis.hasSpike) {
      shortTerm.push('Deepen involvement in primary interest area activities');
      shortTerm.push(`Focus on: ${fieldExpectations.tierExpectations.expectedActivities[0]}`);
    }

    // Address gaps
    for (const gap of majorAlignment.gaps.slice(0, 2)) {
      shortTerm.push(gap);
    }

    const narrativeAdvice =
      spikeAnalysis.hasSpike
        ? `Lead with your ${spikeAnalysis.spikeArea} spike. Order activities to highlight depth in this area.`
        : 'Develop a clearer theme by focusing on 2-3 related activities. Elite schools prefer depth over breadth.';

    return {
      immediate: immediate.slice(0, 3),
      shortTerm: shortTerm.slice(0, 3),
      descriptionOptimizations: descriptionOptimizations.slice(0, 5),
      narrativeAdvice,
    };
  }

  /**
   * Generate overall assessment
   */
  private generateOverallAssessment(
    assessments: EnhancedActivityAssessment[],
    spikeAnalysis: SpikeAnalysis,
    majorAlignment: EnhancedPortfolioAssessment['portfolioAnalysis']['majorAlignment'],
    tierDistribution: EnhancedPortfolioAssessment['portfolioAnalysis']['tierDistribution'],
    major: MajorCategory
  ): EnhancedPortfolioAssessment['overallAssessment'] {
    // Determine competitive level
    let competitiveLevel: EnhancedPortfolioAssessment['overallAssessment']['competitiveLevel'] = 'developing';
    if (tierDistribution.tier1Count >= 2 || (tierDistribution.tier1Count >= 1 && tierDistribution.tier2Count >= 2)) {
      competitiveLevel = 'highly_competitive';
    } else if (tierDistribution.tier1Count >= 1 || tierDistribution.tier2Count >= 2) {
      competitiveLevel = 'competitive';
    } else if (tierDistribution.tier2Count >= 1) {
      competitiveLevel = 'developing';
    } else {
      competitiveLevel = 'needs_work';
    }

    // Estimate Harvard rating
    let harvardRatingEstimate: 1 | 2 | 3 | 4 | 5 | 6 = Math.round(tierDistribution.harvardRatingAverage) as
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6;
    if (harvardRatingEstimate < 1) harvardRatingEstimate = 1;
    if (harvardRatingEstimate > 6) harvardRatingEstimate = 6;

    const strengthSummary =
      tierDistribution.tier1Count > 0
        ? `${tierDistribution.tier1Count} exceptional (Tier 1) achievement(s) - nationally/internationally competitive`
        : tierDistribution.tier2Count > 0
          ? `${tierDistribution.tier2Count} strong (Tier 2) activities with regional/state distinction`
          : 'Participation demonstrated but lacking distinguishing achievements';

    const weaknessSummary =
      majorAlignment.gaps.length > 0
        ? `Key gaps: ${majorAlignment.gaps.slice(0, 2).join('; ')}`
        : spikeAnalysis.orphanActivities.length > 2
          ? 'Activities lack coherent theme - consider focusing on primary interest'
          : 'Continue deepening current involvement for stronger profile';

    const admissionsOfficerPerspective =
      competitiveLevel === 'highly_competitive'
        ? `This profile would receive strong consideration at elite schools. The ${tierDistribution.tier1Count + tierDistribution.tier2Count} high-tier activities demonstrate exceptional capability.`
        : competitiveLevel === 'competitive'
          ? 'This profile shows promise and would be competitive at many selective schools. Elite schools may look for additional distinction.'
          : competitiveLevel === 'developing'
            ? 'This profile demonstrates involvement but needs more distinguishing achievements for top-tier schools.'
            : 'This profile needs significant development to be competitive at selective schools.';

    return {
      competitiveLevel,
      harvardRatingEstimate,
      strengthSummary,
      weaknessSummary,
      admissionsOfficerPerspective,
    };
  }

  /**
   * Generate ordering reasoning
   */
  private generateOrderingReasoning(assessments: EnhancedActivityAssessment[]): string[] {
    return assessments.slice(0, 5).map((assessment, index) => {
      const position = index + 1;
      const reason = `#${position}: ${assessment.activityName} - Harberson score ${assessment.harbersonScore.totalPoints} (${assessment.harbersonScore.durationPoints} duration + ${assessment.harbersonScore.leadershipPoints} leadership + ${assessment.harbersonScore.majorAlignmentPoints} major alignment + ${assessment.harbersonScore.hoursPoints} hours)`;
      return reason;
    });
  }

  /**
   * Generate top 5 strategy
   */
  private generateTopFiveStrategy(assessments: EnhancedActivityAssessment[], major: MajorCategory): string {
    const topFive = assessments.slice(0, 5);
    const coreInTopFive = topFive.filter((a) => a.majorAlignment.type === 'core').length;
    const tier1or2InTopFive = topFive.filter((a) => a.tier <= 2).length;

    if (coreInTopFive >= 3 && tier1or2InTopFive >= 2) {
      return `Strong top 5: ${coreInTopFive} core ${major} activities and ${tier1or2InTopFive} high-tier achievements. This order highlights your spike effectively.`;
    } else if (coreInTopFive >= 2) {
      return `Good top 5: ${coreInTopFive} core activities show ${major} interest. Consider elevating more major-aligned activities if possible.`;
    } else {
      return `Top 5 lacks clear ${major} focus. Consider reordering to lead with major-aligned activities.`;
    }
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(input: NuancedProfilingInput, assessments: EnhancedActivityAssessment[]): number {
    let confidence = 70; // Base confidence

    // More activities = more data = higher confidence
    if (input.activities.length >= 8) confidence += 10;
    else if (input.activities.length >= 5) confidence += 5;

    // Complete data increases confidence
    const activitiesWithAchievements = input.activities.filter((a) => a.achievements && a.achievements.length > 0);
    if (activitiesWithAchievements.length >= 3) confidence += 10;

    // Consistent authenticity increases confidence
    const lowAuthenticityCount = assessments.filter((a) => a.authenticity.score < 50).length;
    if (lowAuthenticityCount === 0) confidence += 5;

    return Math.min(95, confidence);
  }

  /**
   * Generate caveats
   */
  private generateCaveats(input: NuancedProfilingInput): string[] {
    const caveats: string[] = [];

    if (input.activities.length < 5) {
      caveats.push('Limited activities provided - full profile may differ');
    }

    const activitiesWithoutAchievements = input.activities.filter(
      (a) => !a.achievements || a.achievements.length === 0
    );
    if (activitiesWithoutAchievements.length > 3) {
      caveats.push('Several activities lack achievement data - tiers may be underestimated');
    }

    return caveats;
  }

  /**
   * Identify missing info
   */
  private identifyMissingInfo(input: NuancedProfilingInput): string[] {
    const missing: string[] = [];

    for (const activity of input.activities) {
      if (!activity.achievements || activity.achievements.length === 0) {
        missing.push(`${activity.name}: Missing achievements/awards data`);
      }
      if (!activity.organization) {
        missing.push(`${activity.name}: Missing organization name`);
      }
    }

    return missing.slice(0, 5);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private isCoreActivityForMajor(
    activity: EnhancedActivityInput,
    major: MajorCategory,
    fieldExpectations: FieldExpectations
  ): boolean {
    const descLower = activity.description.toLowerCase();
    const nameLower = activity.name.toLowerCase();
    const categoryLower = activity.category.toLowerCase();

    switch (major) {
      case 'computer_science':
        return (
          categoryLower.includes('stem') ||
          categoryLower.includes('academic_competition') ||
          categoryLower.includes('research') ||
          categoryLower.includes('entrepreneurship') ||
          nameLower.includes('coding') ||
          nameLower.includes('programming') ||
          nameLower.includes('usaco') ||
          nameLower.includes('hackathon') ||
          nameLower.includes('app') ||
          nameLower.includes('software') ||
          nameLower.includes('cs ') || // "CS Club"
          nameLower.includes(' cs') || // "AP CS"
          nameLower.includes('computer') ||
          nameLower.includes('tech') ||
          nameLower.includes('startup') ||
          nameLower.includes('ml ') ||
          nameLower.includes('ai ') ||
          nameLower.includes('research') ||
          descLower.includes('code') ||
          descLower.includes('coding') ||
          descLower.includes('develop') ||
          descLower.includes('algorithm') ||
          descLower.includes('python') ||
          descLower.includes('javascript') ||
          descLower.includes('programming') ||
          descLower.includes('software') ||
          descLower.includes('tech') ||
          descLower.includes('users') ||
          descLower.includes('app')
        );

      case 'pre_med':
        return (
          nameLower.includes('research') ||
          nameLower.includes('clinical') ||
          nameLower.includes('hospital') ||
          nameLower.includes('emt') ||
          nameLower.includes('medical') ||
          nameLower.includes('health') ||
          descLower.includes('patient') ||
          descLower.includes('clinical') ||
          descLower.includes('lab')
        );

      case 'business_economics':
        return (
          categoryLower.includes('entrepreneurship') ||
          categoryLower.includes('academic_competition') ||
          nameLower.includes('deca') ||
          nameLower.includes('fbla') ||
          nameLower.includes('business') ||
          nameLower.includes('entrepreneur') ||
          nameLower.includes('investment') ||
          nameLower.includes('startup') ||
          nameLower.includes('financial') ||
          nameLower.includes('finance') ||
          nameLower.includes('economic') ||
          nameLower.includes('resale') ||
          descLower.includes('revenue') ||
          descLower.includes('profit') ||
          descLower.includes('marketing') ||
          descLower.includes('financial') ||
          descLower.includes('business') ||
          descLower.includes('entrepreneurial') ||
          descLower.includes('portfolio') ||
          descLower.includes('return') ||
          descLower.includes('inventory')
        );

      default:
        // Check against expected activities
        const expected = fieldExpectations.tierExpectations.expectedActivities;
        return expected.some(
          (e) => nameLower.includes(e.toLowerCase().split(' ')[0]) || descLower.includes(e.toLowerCase().split(' ')[0])
        );
    }
  }

  private isSupportingActivityForMajor(activity: EnhancedActivityInput, major: MajorCategory): boolean {
    const categoryLower = activity.category.toLowerCase();

    switch (major) {
      case 'computer_science':
        return categoryLower.includes('research') || categoryLower.includes('math');
      case 'pre_med':
        return categoryLower.includes('community_service') || categoryLower.includes('academic');
      case 'business_economics':
        return categoryLower.includes('leadership') || categoryLower.includes('community');
      default:
        return categoryLower.includes('academic') || categoryLower.includes('leadership');
    }
  }

  private isComplementaryActivity(activity: EnhancedActivityInput, major: MajorCategory): boolean {
    // Leadership and service are complementary for most majors
    const categoryLower = activity.category.toLowerCase();
    return categoryLower.includes('leadership') || categoryLower.includes('service');
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const researchBackedProfiler = new ResearchBackedProfiler();
