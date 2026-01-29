/**
 * Activity Portfolio Analyzer
 *
 * Comprehensive assessment of extracurricular activities including:
 * - Tier classification (1-4) based on recognition, leadership, impact
 * - Spike detection (area of exceptional depth)
 * - Thematic coherence analysis
 * - Leadership profile assessment
 * - Commitment pattern analysis
 * - Strategic upgrade recommendations
 *
 * DATA STATUS: Core logic complete. Specific tier classification rubrics
 * pending deep research (Prompt C1).
 *
 * QUALITY PRINCIPLE: Recognize genuine achievement, not just titles.
 */

import {
  ActivitiesInputData,
  ActivityInputData,
  ActivityPortfolioAnalysis,
  ActivityTier,
  ActivityTierAssessment,
  SpikeAnalysis,
  ThematicCoherenceAnalysis,
  CommitmentAnalysis,
  LeadershipAnalysis,
  ActivityUpgradeRecommendation,
  NewActivitySuggestion,
  ActivityCategory,
  LeadershipType,
  RecognitionLevel,
  ImpactType,
  SpikeStrength,
  DepthBreadthProfile,
  ACTIVITY_TIER_DESCRIPTIONS,
} from '../types';

import {
  calculateWeightedScore,
  calculateTier,
  calculateConfidence,
  generateInputHash,
  TierLabel,
} from '../utils';

// ============================================================================
// ACTIVITY TIER CLASSIFICATION DATA
// ============================================================================

/**
 * Tier classification criteria
 * NOTE: These are baseline criteria. Deep research (Prompt C1) will refine specifics.
 */
const TIER_CRITERIA = {
  tier1: {
    description: ACTIVITY_TIER_DESCRIPTIONS[1],
    minimumScore: 90,
    requirements: [
      'National or international recognition',
      'Top 1% achievement in field',
      'Founded successful organization with significant impact',
      'Published research or creative work',
      'Olympic/national-level athletics',
    ],
    recognitionLevels: ['international', 'national'] as RecognitionLevel[],
    leadershipRequired: true,
    timeCommitmentMin: 10, // hours/week
    yearCommitmentMin: 2,
  },
  tier2: {
    description: ACTIVITY_TIER_DESCRIPTIONS[2],
    minimumScore: 70,
    requirements: [
      'State or regional recognition',
      'Significant leadership with documented impact',
      'Published work (school publications, local media)',
      'Sustained high-level achievement over multiple years',
    ],
    recognitionLevels: ['regional', 'state'] as RecognitionLevel[],
    leadershipRequired: true,
    timeCommitmentMin: 7,
    yearCommitmentMin: 2,
  },
  tier3: {
    description: ACTIVITY_TIER_DESCRIPTIONS[3],
    minimumScore: 50,
    requirements: [
      'School-level leadership or recognition',
      'Consistent multi-year commitment',
      'Demonstrated local impact',
      'Growth and progression within activity',
    ],
    recognitionLevels: ['district', 'school', 'local'] as RecognitionLevel[],
    leadershipRequired: false,
    timeCommitmentMin: 3,
    yearCommitmentMin: 1,
  },
  tier4: {
    description: ACTIVITY_TIER_DESCRIPTIONS[4],
    minimumScore: 0,
    requirements: [
      'General participation',
      'Membership without distinction',
      'Limited time commitment',
      'No leadership or recognition',
    ],
    recognitionLevels: ['none'] as RecognitionLevel[],
    leadershipRequired: false,
    timeCommitmentMin: 0,
    yearCommitmentMin: 0,
  },
};

/**
 * Category-specific evaluation adjustments
 */
const CATEGORY_WEIGHTS: Record<ActivityCategory, {
  recognitionWeight: number;
  leadershipWeight: number;
  impactWeight: number;
  timeWeight: number;
}> = {
  academic_competition: { recognitionWeight: 0.40, leadershipWeight: 0.10, impactWeight: 0.30, timeWeight: 0.20 },
  research: { recognitionWeight: 0.30, leadershipWeight: 0.15, impactWeight: 0.35, timeWeight: 0.20 },
  stem_project: { recognitionWeight: 0.25, leadershipWeight: 0.20, impactWeight: 0.35, timeWeight: 0.20 },
  arts_performance: { recognitionWeight: 0.35, leadershipWeight: 0.15, impactWeight: 0.25, timeWeight: 0.25 },
  arts_visual: { recognitionWeight: 0.35, leadershipWeight: 0.10, impactWeight: 0.35, timeWeight: 0.20 },
  arts_literary: { recognitionWeight: 0.35, leadershipWeight: 0.15, impactWeight: 0.30, timeWeight: 0.20 },
  athletics: { recognitionWeight: 0.40, leadershipWeight: 0.20, impactWeight: 0.15, timeWeight: 0.25 },
  community_service: { recognitionWeight: 0.15, leadershipWeight: 0.25, impactWeight: 0.40, timeWeight: 0.20 },
  leadership_governance: { recognitionWeight: 0.20, leadershipWeight: 0.45, impactWeight: 0.25, timeWeight: 0.10 },
  entrepreneurship: { recognitionWeight: 0.20, leadershipWeight: 0.30, impactWeight: 0.35, timeWeight: 0.15 },
  work_experience: { recognitionWeight: 0.10, leadershipWeight: 0.25, impactWeight: 0.25, timeWeight: 0.40 },
  family_responsibilities: { recognitionWeight: 0.05, leadershipWeight: 0.15, impactWeight: 0.30, timeWeight: 0.50 },
  cultural_heritage: { recognitionWeight: 0.20, leadershipWeight: 0.25, impactWeight: 0.35, timeWeight: 0.20 },
  religious_faith: { recognitionWeight: 0.15, leadershipWeight: 0.25, impactWeight: 0.35, timeWeight: 0.25 },
  special_interest: { recognitionWeight: 0.25, leadershipWeight: 0.15, impactWeight: 0.35, timeWeight: 0.25 },
  internship: { recognitionWeight: 0.20, leadershipWeight: 0.20, impactWeight: 0.35, timeWeight: 0.25 },
  summer_program: { recognitionWeight: 0.35, leadershipWeight: 0.15, impactWeight: 0.30, timeWeight: 0.20 },
  other: { recognitionWeight: 0.25, leadershipWeight: 0.25, impactWeight: 0.25, timeWeight: 0.25 },
};

// ============================================================================
// ACTIVITY ANALYZER CLASS
// ============================================================================

export class ActivityAnalyzer {
  private version = '1.0.0';

  /**
   * Perform complete activity portfolio analysis
   */
  async analyze(
    input: ActivitiesInputData,
    intendedMajor?: string,
    careerInterests?: string[]
  ): Promise<ActivityPortfolioAnalysis> {
    // Classify each activity into tiers
    const activityAssessments: Record<string, ActivityTierAssessment> = {};
    const tierBreakdown: ActivityPortfolioAnalysis['tierBreakdown'] = {
      tier1: [],
      tier2: [],
      tier3: [],
      tier4: [],
    };

    for (const activity of input.activities) {
      const assessment = this.classifyActivity(activity, intendedMajor);
      activityAssessments[activity.id] = assessment;

      // Add to tier breakdown
      tierBreakdown[`tier${assessment.assignedTier}` as keyof typeof tierBreakdown].push(assessment);
    }

    // Calculate tier summary
    const tierSummary = this.calculateTierSummary(tierBreakdown);

    // Analyze spike
    const spikeAnalysis = this.analyzeSpike(input.activities, activityAssessments, intendedMajor);

    // Analyze thematic coherence
    const thematicCoherence = this.analyzeThematicCoherence(input.activities, activityAssessments);

    // Analyze commitment
    const commitmentAnalysis = this.analyzeCommitment(input.activities);

    // Analyze leadership
    const leadershipAnalysis = this.analyzeLeadership(input.activities);

    // Generate recommendations
    const { upgrades, newActivities, positioningAdvice, timeAllocation } = this.generateRecommendations(
      input.activities,
      activityAssessments,
      spikeAnalysis,
      intendedMajor,
      careerInterests
    );

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      tierSummary,
      spikeAnalysis,
      thematicCoherence,
      commitmentAnalysis,
      leadershipAnalysis
    );

    // Generate overall narrative
    const portfolioNarrative = this.generatePortfolioNarrative(
      tierSummary,
      spikeAnalysis,
      thematicCoherence,
      leadershipAnalysis
    );

    // Generate Common App optimization
    const commonAppOptimization = this.optimizeForCommonApp(input.activities, activityAssessments);

    // Calculate confidence
    const confidence = calculateConfidence({
      dataCompleteness: this.calculateDataCompleteness(input),
      dataQuality: 0.85,
    });

    return {
      evaluatedAt: new Date().toISOString(),
      version: this.version,
      overallScore,
      overallStrength: this.scoreToStrength(overallScore),
      overallNarrative: portfolioNarrative.oneLineSummary,
      tierBreakdown,
      tierSummary,
      activityAssessments,
      spikeAnalysis,
      thematicCoherence,
      commitmentAnalysis,
      leadershipAnalysis,
      portfolioNarrative,
      commonAppOptimization,
      recommendations: {
        upgrades,
        newActivities,
        positioningAdvice,
        timeAllocation,
      },
      inputDataHash: generateInputHash(input),
      confidenceScore: confidence,
    };
  }

  // ============================================================================
  // ACTIVITY TIER CLASSIFICATION
  // ============================================================================

  private classifyActivity(activity: ActivityInputData, intendedMajor?: string): ActivityTierAssessment {
    const weights = CATEGORY_WEIGHTS[activity.category];

    // Score each factor
    const recognitionScore = this.scoreRecognition(activity);
    const leadershipScore = this.scoreLeadership(activity);
    const impactScore = this.scoreImpact(activity);
    const timeScore = this.scoreTimeCommitment(activity);
    const uniquenessScore = this.scoreUniqueness(activity);
    const progressionScore = this.scoreProgression(activity);

    // Calculate weighted score
    const result = calculateWeightedScore([
      { name: 'Recognition', score: recognitionScore.score, weight: weights.recognitionWeight * 100 },
      { name: 'Leadership', score: leadershipScore.score, weight: weights.leadershipWeight * 100 },
      { name: 'Impact', score: impactScore.score, weight: weights.impactWeight * 100 },
      { name: 'Time', score: timeScore.score, weight: weights.timeWeight * 100 },
    ]);

    // Determine tier
    const assignedTier = this.scoreToTier(result.finalScore);
    const tierConfidence = this.calculateTierConfidence(result.finalScore, assignedTier);

    // Generate upgrade pathway if not Tier 1
    const upgradePathway = assignedTier > 1
      ? this.generateUpgradePathway(activity, assignedTier, recognitionScore, leadershipScore, impactScore)
      : undefined;

    // Generate Common App positioning
    const commonAppPositioning = this.generateCommonAppPositioning(activity, assignedTier);

    // Assess narrative value
    const narrativeValue = this.assessNarrativeValue(activity, intendedMajor);

    return {
      activityId: activity.id,
      activityName: activity.name,
      category: activity.category,
      assignedTier,
      tierConfidence,
      tierJustification: this.generateTierJustification(assignedTier, recognitionScore, leadershipScore, impactScore),
      tierFactors: {
        recognitionLevel: recognitionScore,
        leadershipQuality: leadershipScore,
        impactDemonstrated: impactScore,
        timeCommitment: timeScore,
        uniqueness: { score: uniquenessScore, weight: 0.1 },
        progression: { score: progressionScore, weight: 0.1 },
      },
      upgradePathway,
      commonAppPositioning,
      narrativeValue,
    };
  }

  private scoreRecognition(activity: ActivityInputData): {
    level: RecognitionLevel;
    score: number;
    weight: number;
  } {
    // Find highest recognition level from achievements
    let highestLevel: RecognitionLevel = 'none';
    const levelHierarchy: RecognitionLevel[] = [
      'international', 'national', 'regional', 'state', 'district', 'school', 'local', 'none',
    ];

    for (const achievement of activity.achievements) {
      const idx = levelHierarchy.indexOf(achievement.level);
      const currentIdx = levelHierarchy.indexOf(highestLevel);
      if (idx < currentIdx) {
        highestLevel = achievement.level;
      }
    }

    // Score based on level
    const levelScores: Record<RecognitionLevel, number> = {
      international: 100,
      national: 90,
      regional: 75,
      state: 65,
      district: 50,
      school: 35,
      local: 25,
      none: 10,
    };

    return {
      level: highestLevel,
      score: levelScores[highestLevel],
      weight: CATEGORY_WEIGHTS[activity.category].recognitionWeight,
    };
  }

  private scoreLeadership(activity: ActivityInputData): {
    type: LeadershipType;
    score: number;
    weight: number;
  } {
    // Find highest leadership type
    let highestType: LeadershipType = 'none';
    const typeHierarchy: LeadershipType[] = [
      'founder', 'president_captain', 'executive_board', 'team_lead',
      'elected_representative', 'appointed_leader', 'mentor_teacher',
      'committee_chair', 'informal_leader', 'none',
    ];

    for (const position of activity.leadershipPositions) {
      const idx = typeHierarchy.indexOf(position.type);
      const currentIdx = typeHierarchy.indexOf(highestType);
      if (idx < currentIdx) {
        highestType = position.type;
      }
    }

    // Score based on type
    const typeScores: Record<LeadershipType, number> = {
      founder: 100,
      president_captain: 90,
      executive_board: 75,
      team_lead: 70,
      elected_representative: 80,
      appointed_leader: 65,
      mentor_teacher: 70,
      committee_chair: 60,
      informal_leader: 40,
      none: 10,
    };

    return {
      type: highestType,
      score: typeScores[highestType],
      weight: CATEGORY_WEIGHTS[activity.category].leadershipWeight,
    };
  }

  private scoreImpact(activity: ActivityInputData): {
    type: ImpactType;
    score: number;
    weight: number;
  } {
    // Analyze impact description
    const impact = activity.impact?.toLowerCase() || '';
    const description = activity.description.toLowerCase();
    const combined = `${impact} ${description}`;

    // Check for quantifiable impact
    const hasNumbers = /\d+/.test(combined);
    const hasDollarAmounts = /\$[\d,]+/.test(combined);
    const hasPercentages = /\d+%/.test(combined);

    // Determine impact type
    let type: ImpactType = 'unclear';
    let score = 30;

    if (hasDollarAmounts || (hasNumbers && /raised|donated|funded|grant/.test(combined))) {
      type = 'quantifiable';
      score = 90;
    } else if (/started|founded|created|launched|built/.test(combined)) {
      type = 'organizational';
      score = 85;
    } else if (/community|helped|served|volunteer|impact/.test(combined) && hasNumbers) {
      type = 'community';
      score = 75;
    } else if (/won|award|place|medal|recognition/.test(combined)) {
      type = 'competitive_success';
      score = 70;
    } else if (/taught|mentored|coached|trained/.test(combined) && hasNumbers) {
      type = 'mentorship';
      score = 70;
    } else if (/published|exhibition|performance|showcase/.test(combined)) {
      type = 'creative_output';
      score = 65;
    } else if (/grew|improved|learned|developed/.test(combined)) {
      type = 'personal_growth';
      score = 45;
    } else if (/skill|proficient|expert/.test(combined)) {
      type = 'skill_development';
      score = 40;
    }

    return {
      type,
      score,
      weight: CATEGORY_WEIGHTS[activity.category].impactWeight,
    };
  }

  private scoreTimeCommitment(activity: ActivityInputData): {
    score: number;
    weight: number;
  } {
    const tc = activity.timeCommitment;

    // Score based on hours/week and years
    let score = 0;

    // Hours per week contribution (max 50 points)
    if (tc.hoursPerWeek >= 15) score += 50;
    else if (tc.hoursPerWeek >= 10) score += 40;
    else if (tc.hoursPerWeek >= 7) score += 30;
    else if (tc.hoursPerWeek >= 4) score += 20;
    else score += 10;

    // Years involved contribution (max 50 points)
    if (tc.yearsInvolved >= 4) score += 50;
    else if (tc.yearsInvolved >= 3) score += 40;
    else if (tc.yearsInvolved >= 2) score += 30;
    else score += 15;

    // Year-round bonus
    if (tc.isYearRound) score += 10;

    return {
      score: Math.min(100, score),
      weight: CATEGORY_WEIGHTS[activity.category].timeWeight,
    };
  }

  private scoreUniqueness(activity: ActivityInputData): number {
    // Heuristic uniqueness scoring based on category rarity and description
    const commonCategories = ['community_service', 'athletics', 'leadership_governance'];
    const uncommonCategories = ['research', 'entrepreneurship', 'arts_literary'];
    const rareCategories = ['special_interest', 'cultural_heritage'];

    let baseScore = 50;

    if (rareCategories.includes(activity.category)) {
      baseScore = 80;
    } else if (uncommonCategories.includes(activity.category)) {
      baseScore = 65;
    } else if (commonCategories.includes(activity.category)) {
      baseScore = 40;
    }

    // Boost for unique descriptions
    const description = activity.description.toLowerCase();
    if (description.length > 100) baseScore += 10; // More detail suggests more substance
    if (/only|first|unique|pioneered|invented/.test(description)) baseScore += 15;

    return Math.min(100, baseScore);
  }

  private scoreProgression(activity: ActivityInputData): number {
    // Check for progression through leadership positions
    const positions = activity.leadershipPositions;
    if (positions.length === 0) return 40;

    // Look for title progression
    let hasProgression = false;
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      // Check if position changed over time (progression)
      if (prev.title !== curr.title) {
        hasProgression = true;
        break;
      }
    }

    if (hasProgression) return 85;

    // Check grade level progression
    const gradeLevels = activity.timeCommitment.gradeLevels;
    if (gradeLevels.length >= 3) return 70;
    if (gradeLevels.length >= 2) return 55;

    return 40;
  }

  private scoreToTier(score: number): ActivityTier {
    if (score >= TIER_CRITERIA.tier1.minimumScore) return 1;
    if (score >= TIER_CRITERIA.tier2.minimumScore) return 2;
    if (score >= TIER_CRITERIA.tier3.minimumScore) return 3;
    return 4;
  }

  private calculateTierConfidence(score: number, tier: ActivityTier): number {
    // Higher confidence when score is further from boundaries
    const boundaries = [90, 70, 50, 0];
    const tierIdx = tier - 1;
    const upperBound = tierIdx > 0 ? boundaries[tierIdx - 1] : 100;
    const lowerBound = boundaries[tierIdx];

    const distanceFromBoundary = Math.min(
      score - lowerBound,
      upperBound - score
    );

    // Scale confidence: 0-20 points from boundary = 50-100 confidence
    return Math.min(100, 50 + distanceFromBoundary * 2.5);
  }

  private generateTierJustification(
    tier: ActivityTier,
    recognition: { level: RecognitionLevel; score: number },
    leadership: { type: LeadershipType; score: number },
    impact: { type: ImpactType; score: number }
  ): string {
    const factors: string[] = [];

    if (recognition.score >= 65) {
      factors.push(`${recognition.level}-level recognition`);
    }
    if (leadership.score >= 70) {
      factors.push(`${leadership.type.replace('_', ' ')} leadership`);
    }
    if (impact.score >= 65) {
      factors.push(`${impact.type.replace('_', ' ')} impact`);
    }

    if (factors.length === 0) {
      return `Tier ${tier} based on participation-level involvement without significant distinction.`;
    }

    return `Tier ${tier} based on ${factors.join(', ')}.`;
  }

  private generateUpgradePathway(
    activity: ActivityInputData,
    currentTier: ActivityTier,
    recognition: { score: number },
    leadership: { score: number },
    impact: { score: number }
  ): ActivityTierAssessment['upgradePathway'] {
    const targetTier = (currentTier - 1) as ActivityTier;
    const steps: string[] = [];

    // Identify weakest area to improve
    const scores = [
      { area: 'recognition', score: recognition.score },
      { area: 'leadership', score: leadership.score },
      { area: 'impact', score: impact.score },
    ].sort((a, b) => a.score - b.score);

    for (const { area, score } of scores) {
      if (score < 70) {
        if (area === 'recognition') {
          steps.push('Seek state/regional level competitions or recognition');
          steps.push('Apply for awards or contests in this area');
        } else if (area === 'leadership') {
          steps.push('Take on formal leadership role (officer, captain, lead)');
          steps.push('Start a new initiative within the organization');
        } else if (area === 'impact') {
          steps.push('Document and quantify your contributions');
          steps.push('Expand scope of your impact (more people, larger reach)');
        }
      }
    }

    // Assess feasibility
    const feasibility: 'high' | 'medium' | 'low' =
      activity.timeCommitment.isCurrent && activity.timeCommitment.yearsInvolved >= 2
        ? 'high'
        : activity.timeCommitment.isCurrent
        ? 'medium'
        : 'low';

    return {
      targetTier,
      steps: steps.slice(0, 3),
      feasibility,
      timeRequired: feasibility === 'high' ? '3-6 months' : '6-12 months',
    };
  }

  private generateCommonAppPositioning(
    activity: ActivityInputData,
    tier: ActivityTier
  ): ActivityTierAssessment['commonAppPositioning'] {
    // Generate optimized 150-character description
    const suggestedDescription = this.optimizeDescription(activity.description, activity);

    return {
      suggestedActivityType: this.categoryToCommonAppType(activity.category),
      suggestedPosition: activity.leadershipPositions[0]?.title || activity.role,
      suggestedOrganization: activity.organization || '',
      suggestedDescription,
      orderPriority: tier, // Lower tier number = higher priority
    };
  }

  private optimizeDescription(original: string, activity: ActivityInputData): string {
    // Keep to 150 characters while maximizing impact
    let description = original;

    // Prioritize quantifiable achievements
    const numbers = activity.impact?.match(/\d+/g) || [];
    const achievements = activity.achievements.slice(0, 1);

    // Build optimized description
    const parts: string[] = [];

    // Start with leadership if founder
    const hasFounder = activity.leadershipPositions.some((p) => p.type === 'founder');
    if (hasFounder) {
      parts.push('Founded');
    }

    // Add impact with numbers
    if (numbers.length > 0 && activity.impact) {
      parts.push(activity.impact.substring(0, 60));
    } else {
      parts.push(original.substring(0, 80));
    }

    // Add top achievement
    if (achievements.length > 0) {
      parts.push(`${achievements[0].level} recognition`);
    }

    description = parts.join('. ');

    // Trim to 150 characters
    if (description.length > 150) {
      description = description.substring(0, 147) + '...';
    }

    return description;
  }

  private categoryToCommonAppType(category: ActivityCategory): string {
    const mapping: Record<ActivityCategory, string> = {
      academic_competition: 'Academic',
      research: 'Academic',
      stem_project: 'Science/Math',
      arts_performance: 'Art',
      arts_visual: 'Art',
      arts_literary: 'Journalism/Publication',
      athletics: 'Athletics: Club',
      community_service: 'Community Service (Volunteer)',
      leadership_governance: 'School Spirit',
      entrepreneurship: 'Other Club/Activity',
      work_experience: 'Work (Paid)',
      family_responsibilities: 'Family Responsibilities',
      cultural_heritage: 'Cultural',
      religious_faith: 'Religious',
      special_interest: 'Other Club/Activity',
      internship: 'Internship',
      summer_program: 'Academic',
      other: 'Other Club/Activity',
    };

    return mapping[category] || 'Other Club/Activity';
  }

  private assessNarrativeValue(
    activity: ActivityInputData,
    intendedMajor?: string
  ): ActivityTierAssessment['narrativeValue'] {
    // Determine theme contributions
    const themes: string[] = [];
    const category = activity.category;

    if (['academic_competition', 'research', 'stem_project'].includes(category)) {
      themes.push('Intellectual Curiosity');
    }
    if (['community_service', 'cultural_heritage'].includes(category)) {
      themes.push('Community Impact');
    }
    if (['leadership_governance', 'entrepreneurship'].includes(category)) {
      themes.push('Leadership');
    }
    if (['arts_performance', 'arts_visual', 'arts_literary'].includes(category)) {
      themes.push('Creative Expression');
    }
    if (intendedMajor) {
      themes.push(`${intendedMajor}-related`);
    }

    // Assess storytelling potential
    const description = activity.description.toLowerCase();
    let storytellingPotential: 'high' | 'medium' | 'low' = 'low';

    if (
      activity.achievements.length > 0 ||
      activity.leadershipPositions.some((p) => p.type === 'founder') ||
      /overcome|challenge|grew|transformed|discovered/.test(description)
    ) {
      storytellingPotential = 'high';
    } else if (
      activity.timeCommitment.yearsInvolved >= 3 ||
      activity.leadershipPositions.length > 0
    ) {
      storytellingPotential = 'medium';
    }

    // Find unique aspect
    let uniqueAspect = 'Demonstrates commitment and involvement';
    if (activity.leadershipPositions.some((p) => p.type === 'founder')) {
      uniqueAspect = 'Shows initiative and entrepreneurial spirit';
    } else if (activity.achievements.some((a) => a.level === 'national' || a.level === 'international')) {
      uniqueAspect = 'Exceptional achievement at highest levels';
    } else if (activity.timeCommitment.yearsInvolved >= 4) {
      uniqueAspect = 'Deep, sustained commitment over entire high school career';
    }

    return {
      contributesToTheme: themes,
      uniqueAspect,
      storytellingPotential,
    };
  }

  // ============================================================================
  // SPIKE ANALYSIS
  // ============================================================================

  private analyzeSpike(
    activities: ActivityInputData[],
    assessments: Record<string, ActivityTierAssessment>,
    intendedMajor?: string
  ): SpikeAnalysis {
    // Group activities by theme/category
    const themeClusters = this.identifyThemeClusters(activities, assessments);

    // Find the strongest cluster (potential spike)
    const sortedClusters = themeClusters.sort((a, b) => b.coherenceScore - a.coherenceScore);

    if (sortedClusters.length === 0) {
      return {
        hasSpike: false,
        spikeStrength: 'none',
        spikeRecommendations: {
          mostPromising: {
            area: intendedMajor || 'your strongest interest area',
            currentStrength: 'Not yet developed',
            pathToSpike: [
              'Identify 2-3 activities in your area of interest',
              'Pursue deeper involvement (leadership, competitions)',
              'Seek external recognition or validation',
            ],
          },
          alternativeStrategies: [
            'Well-rounded profile can work if activities are strong across multiple areas',
            'Consider developing a unique combination that tells a cohesive story',
          ],
        },
        spikeRelevance: {},
      };
    }

    const primaryCluster = sortedClusters[0];
    const secondaryCluster = sortedClusters[1];

    // Determine spike strength
    const spikeStrength = this.determineSpikeStrength(primaryCluster, assessments);

    // Check if spike exists
    const hasSpike = spikeStrength !== 'none' && primaryCluster.tier1Count > 0;

    // Build spike analysis
    const primarySpike = hasSpike
      ? this.buildSpikeDetail(primaryCluster, activities, assessments)
      : undefined;

    const secondarySpike =
      secondaryCluster && secondaryCluster.tier1Count > 0
        ? {
            area: secondaryCluster.theme,
            activities: secondaryCluster.activities,
            strength: this.determineSpikeStrength(secondaryCluster, assessments),
          }
        : undefined;

    return {
      hasSpike,
      spikeStrength,
      primarySpike,
      secondarySpike,
      spikeRecommendations: hasSpike
        ? undefined
        : {
            mostPromising: {
              area: primaryCluster.theme,
              currentStrength: `${primaryCluster.tier1Count} Tier 1 activities`,
              pathToSpike: this.generateSpikePathway(primaryCluster, assessments),
            },
            alternativeStrategies: [
              'Seek national/state recognition in your strongest area',
              'Connect disparate activities through a unifying narrative',
            ],
          },
      spikeRelevance: this.assessSpikeRelevance(primaryCluster, intendedMajor),
    };
  }

  private identifyThemeClusters(
    activities: ActivityInputData[],
    assessments: Record<string, ActivityTierAssessment>
  ): Array<{
    theme: string;
    themeCategory: string;
    activities: string[];
    totalTierScore: number;
    averageTier: number;
    tier1Count: number;
    tier2Count: number;
    externalValidation: string[];
    coherenceScore: number;
  }> {
    // Define theme categories
    const themeMapping: Record<string, ActivityCategory[]> = {
      STEM: ['academic_competition', 'research', 'stem_project'],
      Arts: ['arts_performance', 'arts_visual', 'arts_literary'],
      Leadership: ['leadership_governance', 'entrepreneurship'],
      'Social Impact': ['community_service', 'cultural_heritage', 'religious_faith'],
      Athletics: ['athletics'],
      'Professional Development': ['work_experience', 'internship'],
    };

    const clusters: Map<string, {
      theme: string;
      activities: string[];
      tiers: number[];
      recognitions: string[];
    }> = new Map();

    for (const activity of activities) {
      // Find theme category
      let themeCategory = 'Other';
      for (const [theme, categories] of Object.entries(themeMapping)) {
        if (categories.includes(activity.category)) {
          themeCategory = theme;
          break;
        }
      }

      if (!clusters.has(themeCategory)) {
        clusters.set(themeCategory, {
          theme: themeCategory,
          activities: [],
          tiers: [],
          recognitions: [],
        });
      }

      const cluster = clusters.get(themeCategory)!;
      cluster.activities.push(activity.id);
      cluster.tiers.push(assessments[activity.id].assignedTier);

      // Collect recognitions
      for (const achievement of activity.achievements) {
        if (achievement.level !== 'none' && achievement.level !== 'local') {
          cluster.recognitions.push(`${achievement.achievement} (${achievement.level})`);
        }
      }
    }

    // Convert to array and calculate metrics
    return Array.from(clusters.values()).map((cluster) => {
      const totalTierScore = cluster.tiers.reduce((sum, t) => sum + t, 0);
      const averageTier = totalTierScore / cluster.tiers.length;
      const tier1Count = cluster.tiers.filter((t) => t === 1).length;
      const tier2Count = cluster.tiers.filter((t) => t === 2).length;

      // Calculate coherence score (lower average tier + more activities = higher score)
      const coherenceScore = ((5 - averageTier) * 25) + (cluster.activities.length * 10) + (tier1Count * 20);

      return {
        theme: cluster.theme,
        themeCategory: cluster.theme,
        activities: cluster.activities,
        totalTierScore,
        averageTier,
        tier1Count,
        tier2Count,
        externalValidation: cluster.recognitions,
        coherenceScore,
      };
    });
  }

  private determineSpikeStrength(
    cluster: { tier1Count: number; tier2Count: number; externalValidation: string[] },
    assessments: Record<string, ActivityTierAssessment>
  ): SpikeStrength {
    if (cluster.tier1Count >= 2) return 'national';
    if (cluster.tier1Count === 1 && cluster.tier2Count >= 2) return 'regional';
    if (cluster.tier1Count === 1 || cluster.tier2Count >= 2) return 'local';
    if (cluster.tier2Count >= 1) return 'emerging';
    return 'none';
  }

  private buildSpikeDetail(
    cluster: { theme: string; activities: string[]; tier1Count: number; externalValidation: string[] },
    activities: ActivityInputData[],
    assessments: Record<string, ActivityTierAssessment>
  ): SpikeAnalysis['primarySpike'] {
    const tier1Activities = cluster.activities.filter(
      (id) => assessments[id]?.assignedTier === 1
    );

    return {
      area: cluster.theme,
      description: `Strong ${cluster.theme} focus with ${cluster.tier1Count} nationally recognized activities`,
      activities: cluster.activities,
      tier1Activities,
      recognition: cluster.externalValidation,
      narrative: `Your ${cluster.theme} spike demonstrates exceptional depth and achievement, with ${cluster.tier1Count} activities reaching the highest tier of recognition.`,
      admissionsImpact: 'Spike-level achievement in this area significantly strengthens your application, particularly for programs valuing this expertise.',
    };
  }

  private generateSpikePathway(
    cluster: { theme: string; activities: string[] },
    assessments: Record<string, ActivityTierAssessment>
  ): string[] {
    const steps: string[] = [];

    steps.push(`Deepen involvement in your ${cluster.theme} activities`);
    steps.push('Pursue regional/state level competitions or recognition');
    steps.push('Seek leadership roles that amplify your impact');
    steps.push('Connect activities through a unifying project or initiative');

    return steps;
  }

  private assessSpikeRelevance(
    cluster: { theme: string },
    intendedMajor?: string
  ): Record<string, { schoolId: string; relevance: 'high' | 'medium' | 'low'; explanation: string }> {
    const relevance: Record<string, { schoolId: string; relevance: 'high' | 'medium' | 'low'; explanation: string }> = {};

    // Example relevance assessments (would be expanded with actual school data)
    const schoolRelevance: Record<string, Record<string, 'high' | 'medium' | 'low'>> = {
      STEM: { mit: 'high', stanford: 'high', harvard: 'medium', yale: 'medium' },
      Arts: { yale: 'high', stanford: 'medium', harvard: 'medium', mit: 'low' },
      Leadership: { harvard: 'high', yale: 'high', stanford: 'high', mit: 'medium' },
      'Social Impact': { harvard: 'high', princeton: 'high', yale: 'high', stanford: 'medium' },
    };

    const themeRelevance = schoolRelevance[cluster.theme] || {};

    for (const [schoolId, rel] of Object.entries(themeRelevance)) {
      relevance[schoolId] = {
        schoolId,
        relevance: rel,
        explanation: `${cluster.theme} activities are ${rel === 'high' ? 'highly valued' : rel === 'medium' ? 'valued' : 'less emphasized'} at this institution`,
      };
    }

    return relevance;
  }

  // ============================================================================
  // THEMATIC COHERENCE ANALYSIS
  // ============================================================================

  private analyzeThematicCoherence(
    activities: ActivityInputData[],
    assessments: Record<string, ActivityTierAssessment>
  ): ThematicCoherenceAnalysis {
    // Identify themes from narrative value assessments
    const themeCount: Map<string, string[]> = new Map();

    for (const activity of activities) {
      const assessment = assessments[activity.id];
      for (const theme of assessment.narrativeValue.contributesToTheme) {
        if (!themeCount.has(theme)) {
          themeCount.set(theme, []);
        }
        themeCount.get(theme)!.push(activity.id);
      }
    }

    // Sort themes by activity count
    const sortedThemes = Array.from(themeCount.entries()).sort((a, b) => b[1].length - a[1].length);

    // Calculate overall coherence
    const primaryThemeActivities = sortedThemes[0]?.[1].length || 0;
    const totalActivities = activities.length;
    const primaryThemeConcentration = totalActivities > 0 ? primaryThemeActivities / totalActivities : 0;

    // Coherence score: higher if activities cluster around fewer themes
    const uniqueThemes = sortedThemes.length;
    const coherenceScore = Math.round(
      (primaryThemeConcentration * 60) + (Math.max(0, 5 - uniqueThemes) * 8)
    );

    // Build primary theme
    const primaryTheme = sortedThemes[0]
      ? {
          theme: sortedThemes[0][0],
          activities: sortedThemes[0][1],
          strength: Math.round((sortedThemes[0][1].length / totalActivities) * 100),
          narrative: `Your ${sortedThemes[0][0]} theme emerges through ${sortedThemes[0][1].length} activities.`,
        }
      : {
          theme: 'Undetermined',
          activities: [],
          strength: 0,
          narrative: 'No clear primary theme identified.',
        };

    // Build secondary theme
    const secondaryTheme = sortedThemes[1]
      ? {
          theme: sortedThemes[1][0],
          activities: sortedThemes[1][1],
          strength: Math.round((sortedThemes[1][1].length / totalActivities) * 100),
          connectionToPrimary: this.findThemeConnection(sortedThemes[0][0], sortedThemes[1][0]),
        }
      : undefined;

    // Identify disconnected activities
    const disconnectedActivities = activities
      .filter((a) => assessments[a.id].narrativeValue.contributesToTheme.length === 0)
      .map((a) => a.id);

    // Theme distribution
    const themeDistribution: Record<string, number> = {};
    for (const [theme, actIds] of sortedThemes) {
      themeDistribution[theme] = actIds.length;
    }

    // Suggest archetype
    const suggestedArchetype = this.suggestArchetype(primaryTheme.theme, secondaryTheme?.theme);

    return {
      overallCoherenceScore: coherenceScore,
      primaryTheme,
      secondaryTheme,
      themeDistribution,
      coherenceInsights: {
        narrativeThread: this.generateNarrativeThread(primaryTheme.theme, secondaryTheme?.theme),
        disconnectedActivities,
        strengtheningOpportunities: this.identifyCoherenceOpportunities(
          primaryTheme.theme,
          disconnectedActivities.length > 0
        ),
      },
      brandAlignment: {
        suggestedArchetype,
        archetypeStrength: coherenceScore,
        supportingActivities: primaryTheme.activities,
      },
    };
  }

  private findThemeConnection(primary: string, secondary: string): string {
    // Map common theme combinations
    const connections: Record<string, Record<string, string>> = {
      'Intellectual Curiosity': {
        Leadership: 'Leading in intellectual pursuits',
        'Community Impact': 'Applying knowledge to help others',
        'Creative Expression': 'Creative exploration of ideas',
      },
      Leadership: {
        'Community Impact': 'Leading positive change',
        'Intellectual Curiosity': 'Academic leadership',
      },
      'Community Impact': {
        Leadership: 'Service leadership',
        'Creative Expression': 'Arts for social good',
      },
    };

    return connections[primary]?.[secondary] || `Combining ${primary.toLowerCase()} with ${secondary.toLowerCase()}`;
  }

  private generateNarrativeThread(primary: string, secondary?: string): string {
    if (!secondary) {
      return `Your activities consistently demonstrate ${primary.toLowerCase()}, creating a focused and coherent profile.`;
    }
    return `Your activities weave together ${primary.toLowerCase()} and ${secondary.toLowerCase()}, creating a multidimensional but coherent story.`;
  }

  private identifyCoherenceOpportunities(primaryTheme: string, hasDisconnected: boolean): string[] {
    const opportunities: string[] = [];

    if (hasDisconnected) {
      opportunities.push('Consider how disconnected activities might connect to your primary theme');
    }
    opportunities.push(`Seek leadership roles in ${primaryTheme}-related activities`);
    opportunities.push('Create projects that combine multiple interests under one umbrella');

    return opportunities;
  }

  private suggestArchetype(primary: string, secondary?: string): string {
    const archetypeMapping: Record<string, string> = {
      'Intellectual Curiosity': 'The Researcher',
      Leadership: 'The Leader',
      'Community Impact': 'The Advocate',
      'Creative Expression': 'The Artist',
      Athletics: 'The Athlete',
    };

    if (primary === 'Intellectual Curiosity' && secondary === 'Leadership') {
      return 'The Innovator';
    }
    if (primary === 'Community Impact' && secondary === 'Leadership') {
      return 'The Changemaker';
    }
    if (primary === 'Leadership' && secondary === 'Community Impact') {
      return 'The Servant Leader';
    }

    return archetypeMapping[primary] || 'The Polymath';
  }

  // ============================================================================
  // COMMITMENT ANALYSIS
  // ============================================================================

  private analyzeCommitment(activities: ActivityInputData[]): CommitmentAnalysis {
    const totalWeeklyHours = activities.reduce(
      (sum, a) => sum + a.timeCommitment.hoursPerWeek,
      0
    );
    const averageHours = activities.length > 0 ? totalWeeklyHours / activities.length : 0;

    // Count sustained and deep commitments
    const sustainedCommitments = activities.filter(
      (a) => a.timeCommitment.yearsInvolved >= 2
    ).length;
    const deepCommitments = activities.filter(
      (a) => a.timeCommitment.hoursPerWeek >= 10
    ).length;

    // Count activities showing progression
    const progressionShown = activities.filter(
      (a) => a.leadershipPositions.length > 1 ||
            a.timeCommitment.gradeLevels.length >= 3
    ).length;

    // Determine depth vs breadth profile
    const depthVsBreadth = this.assessDepthBreadth(
      activities.length,
      averageHours,
      sustainedCommitments,
      deepCommitments
    );

    // Time distribution by category
    const timeDistribution = this.calculateTimeDistribution(activities);

    // Find most dedicated and longest commitment
    const mostDedicated = activities.reduce(
      (max, a) => (a.timeCommitment.hoursPerWeek > (max?.timeCommitment.hoursPerWeek || 0) ? a : max),
      activities[0]
    );
    const longestCommitment = activities.reduce(
      (max, a) => (a.timeCommitment.yearsInvolved > (max?.timeCommitment.yearsInvolved || 0) ? a : max),
      activities[0]
    );

    // Generate recommendations
    const recommendations: string[] = [];
    if (activities.length > 10) {
      recommendations.push('Consider focusing on fewer activities with greater depth');
    }
    if (sustainedCommitments < 3) {
      recommendations.push('Admissions values sustained commitment - maintain activities over multiple years');
    }
    if (deepCommitments < 2) {
      recommendations.push('Consider increasing hours in your most meaningful activities');
    }

    return {
      totalWeeklyHours,
      averageHoursPerActivity: Math.round(averageHours * 10) / 10,
      sustainedCommitments,
      deepCommitments,
      progressionShown,
      depthVsBreadth,
      depthBreadthExplanation: this.explainDepthBreadth(depthVsBreadth),
      timeDistribution,
      insights: {
        mostDedicated: mostDedicated?.name || 'N/A',
        longestCommitment: longestCommitment?.name || 'N/A',
        balanceAssessment: this.assessBalance(activities.length, sustainedCommitments, deepCommitments),
      },
      recommendations,
    };
  }

  private assessDepthBreadth(
    activityCount: number,
    averageHours: number,
    sustained: number,
    deep: number
  ): DepthBreadthProfile {
    // Deep spike: 1-3 activities with significant depth
    if (activityCount <= 4 && deep >= 2 && sustained >= 2) {
      return 'deep_spike';
    }

    // Depth focused: 4-6 activities with clear depth
    if (activityCount <= 6 && deep >= 2) {
      return 'depth_focused';
    }

    // Balanced: Good mix
    if (activityCount <= 8 && sustained >= 3 && averageHours >= 4) {
      return 'balanced';
    }

    // Broad engaged: Many activities, moderate depth
    if (activityCount <= 10 && sustained >= 2) {
      return 'broad_engaged';
    }

    // Spread thin
    return 'spread_thin';
  }

  private explainDepthBreadth(profile: DepthBreadthProfile): string {
    const explanations: Record<DepthBreadthProfile, string> = {
      deep_spike: 'Your profile shows exceptional depth in a focused area - the "spike" approach valued by admissions.',
      depth_focused: 'You demonstrate meaningful depth across a focused set of activities - a strong profile.',
      balanced: 'Your activities show a healthy balance of depth and breadth.',
      broad_engaged: 'You\'re engaged across many areas with moderate depth - consider deepening focus in key activities.',
      spread_thin: 'Your involvement spans many activities but may lack the depth admissions officers value. Consider focusing on fewer, more impactful activities.',
    };
    return explanations[profile];
  }

  private calculateTimeDistribution(activities: ActivityInputData[]): Array<{
    category: ActivityCategory;
    hours: number;
    percentage: number;
  }> {
    const byCategory: Map<ActivityCategory, number> = new Map();
    let totalHours = 0;

    for (const activity of activities) {
      const hours = activity.timeCommitment.hoursPerWeek * activity.timeCommitment.weeksPerYear;
      const current = byCategory.get(activity.category) || 0;
      byCategory.set(activity.category, current + hours);
      totalHours += hours;
    }

    return Array.from(byCategory.entries())
      .map(([category, hours]) => ({
        category,
        hours: Math.round(hours),
        percentage: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0,
      }))
      .sort((a, b) => b.hours - a.hours);
  }

  private assessBalance(activityCount: number, sustained: number, deep: number): string {
    if (sustained >= 3 && deep >= 2) {
      return 'Well-balanced with strong commitment signals';
    }
    if (sustained >= 2 || deep >= 1) {
      return 'Adequate commitment pattern - consider deepening involvement';
    }
    return 'Commitment pattern could be stronger - prioritize sustained, deep involvement';
  }

  // ============================================================================
  // LEADERSHIP ANALYSIS
  // ============================================================================

  private analyzeLeadership(activities: ActivityInputData[]): LeadershipAnalysis {
    // Count leadership types
    let formalPositions = 0;
    let founderInitiatives = 0;
    let electedPositions = 0;
    let teamLeadership = 0;
    let mentorshipRoles = 0;

    const allPositions: Array<{ type: LeadershipType; activity: string; title: string }> = [];

    for (const activity of activities) {
      for (const position of activity.leadershipPositions) {
        allPositions.push({
          type: position.type,
          activity: activity.name,
          title: position.title,
        });

        switch (position.type) {
          case 'founder':
            founderInitiatives++;
            formalPositions++;
            break;
          case 'president_captain':
          case 'executive_board':
            formalPositions++;
            break;
          case 'elected_representative':
            electedPositions++;
            formalPositions++;
            break;
          case 'team_lead':
          case 'committee_chair':
            teamLeadership++;
            formalPositions++;
            break;
          case 'mentor_teacher':
            mentorshipRoles++;
            break;
        }
      }
    }

    // Calculate overall leadership score
    const overallScore = Math.min(100,
      (formalPositions * 15) +
      (founderInitiatives * 25) +
      (electedPositions * 10) +
      (mentorshipRoles * 10)
    );

    // Assess leadership quality
    const leadershipQuality = this.assessLeadershipQuality(
      formalPositions,
      founderInitiatives,
      new Set(activities.map((a) => a.category)).size
    );

    // Generate leadership narrative
    const leadershipNarrative = this.generateLeadershipNarrative(
      allPositions,
      founderInitiatives,
      formalPositions
    );

    // Identify leadership style
    const leadershipStyle = this.identifyLeadershipStyle(allPositions);

    // Generate gaps and recommendations
    const { gaps, recommendations } = this.identifyLeadershipGaps(
      formalPositions,
      founderInitiatives,
      mentorshipRoles
    );

    return {
      overallLeadershipScore: overallScore,
      formalPositions,
      founderInitiatives,
      electedPositions,
      teamLeadership,
      mentorshipRoles,
      leadershipQuality,
      leadershipNarrative,
      leadershipStyle,
      gaps,
      recommendations,
    };
  }

  private assessLeadershipQuality(
    formal: number,
    founder: number,
    categoryBreadth: number
  ): LeadershipAnalysis['leadershipQuality'] {
    // Depth assessment
    let depth: 'exceptional' | 'strong' | 'moderate' | 'limited';
    if (founder >= 2 || formal >= 5) depth = 'exceptional';
    else if (founder >= 1 || formal >= 3) depth = 'strong';
    else if (formal >= 1) depth = 'moderate';
    else depth = 'limited';

    // Breadth assessment
    let breadth: 'diverse' | 'focused' | 'narrow';
    if (categoryBreadth >= 4) breadth = 'diverse';
    else if (categoryBreadth >= 2) breadth = 'focused';
    else breadth = 'narrow';

    // Impact assessment (rough heuristic)
    let impact: 'transformative' | 'significant' | 'moderate' | 'limited';
    if (founder >= 2) impact = 'transformative';
    else if (founder >= 1 || formal >= 4) impact = 'significant';
    else if (formal >= 2) impact = 'moderate';
    else impact = 'limited';

    return { depth, breadth, impact };
  }

  private generateLeadershipNarrative(
    positions: Array<{ type: LeadershipType; activity: string; title: string }>,
    founderCount: number,
    formalCount: number
  ): LeadershipAnalysis['leadershipNarrative'] {
    if (founderCount >= 2) {
      return {
        headline: 'Entrepreneurial Leader',
        story: `Founded ${founderCount} initiatives, demonstrating ability to identify needs and create solutions from scratch.`,
        keyExamples: positions.filter((p) => p.type === 'founder').map((p) => `${p.title} at ${p.activity}`),
      };
    }

    if (formalCount >= 4) {
      return {
        headline: 'Proven Leader',
        story: `Held ${formalCount} leadership positions across activities, showing consistent ability to lead and organize.`,
        keyExamples: positions.slice(0, 3).map((p) => `${p.title} at ${p.activity}`),
      };
    }

    if (formalCount >= 2) {
      return {
        headline: 'Emerging Leader',
        story: 'Demonstrated leadership in key areas with room to expand impact.',
        keyExamples: positions.slice(0, 2).map((p) => `${p.title} at ${p.activity}`),
      };
    }

    return {
      headline: 'Leadership Potential',
      story: 'Opportunities exist to develop formal leadership roles.',
      keyExamples: positions.length > 0 ? [positions[0].title] : [],
    };
  }

  private identifyLeadershipStyle(
    positions: Array<{ type: LeadershipType; activity: string }>
  ): LeadershipAnalysis['leadershipStyle'] {
    // Count leadership types
    const types = positions.map((p) => p.type);
    const hasFounder = types.includes('founder');
    const hasElected = types.includes('elected_representative');
    const hasMentor = types.includes('mentor_teacher');
    const hasTeamLead = types.includes('team_lead');

    let primary: string;
    const characteristics: string[] = [];
    const evidence: string[] = [];

    if (hasFounder) {
      primary = 'Initiative-taker';
      characteristics.push('Creates rather than joins', 'Identifies gaps and fills them');
      evidence.push('Founded organizations/initiatives');
    } else if (hasElected) {
      primary = 'Representative Leader';
      characteristics.push('Trusted by peers', 'Advocates for others');
      evidence.push('Elected to leadership positions');
    } else if (hasMentor) {
      primary = 'Mentor';
      characteristics.push('Develops others', 'Shares knowledge');
      evidence.push('Teaching and mentorship roles');
    } else if (hasTeamLead) {
      primary = 'Team Builder';
      characteristics.push('Coordinates groups', 'Drives execution');
      evidence.push('Led teams and committees');
    } else {
      primary = 'Emerging';
      characteristics.push('Developing leadership presence');
      evidence.push('Participated in group activities');
    }

    return { primary, characteristics, evidence };
  }

  private identifyLeadershipGaps(
    formal: number,
    founder: number,
    mentorship: number
  ): { gaps: string[]; recommendations: string[] } {
    const gaps: string[] = [];
    const recommendations: string[] = [];

    if (formal === 0) {
      gaps.push('No formal leadership positions');
      recommendations.push('Seek officer positions in existing activities');
    }

    if (founder === 0 && formal < 3) {
      recommendations.push('Consider starting a club, project, or initiative');
    }

    if (mentorship === 0) {
      recommendations.push('Look for opportunities to mentor or teach others');
    }

    if (formal > 0 && founder === 0) {
      recommendations.push('Demonstrate initiative by creating something new');
    }

    return { gaps, recommendations };
  }

  // ============================================================================
  // RECOMMENDATION GENERATION
  // ============================================================================

  private generateRecommendations(
    activities: ActivityInputData[],
    assessments: Record<string, ActivityTierAssessment>,
    spike: SpikeAnalysis,
    intendedMajor?: string,
    careerInterests?: string[]
  ): {
    upgrades: ActivityUpgradeRecommendation[];
    newActivities: NewActivitySuggestion[];
    positioningAdvice: string[];
    timeAllocation: string[];
  } {
    const upgrades: ActivityUpgradeRecommendation[] = [];
    const newActivities: NewActivitySuggestion[] = [];
    const positioningAdvice: string[] = [];
    const timeAllocation: string[] = [];

    // Generate upgrade recommendations for Tier 2-4 activities
    for (const activity of activities) {
      const assessment = assessments[activity.id];
      if (assessment.assignedTier > 1 && assessment.upgradePathway) {
        upgrades.push({
          activityId: activity.id,
          activityName: activity.name,
          currentTier: assessment.assignedTier,
          potentialTier: assessment.upgradePathway.targetTier,
          upgradeSteps: assessment.upgradePathway.steps,
          resources: [],
          feasibility: assessment.upgradePathway.feasibility,
          impactIfAchieved: `Moving to Tier ${assessment.upgradePathway.targetTier} would significantly strengthen your profile`,
        });
      }
    }

    // Sort upgrades by feasibility
    upgrades.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.feasibility] - order[b.feasibility];
    });

    // Generate new activity suggestions based on gaps
    if (!spike.hasSpike && intendedMajor) {
      newActivities.push({
        suggestion: `Research project in ${intendedMajor}`,
        category: 'research',
        rationale: 'Demonstrates depth in intended major area',
        fitWithProfile: `Aligns with your ${intendedMajor} interests`,
        potentialTier: 2,
        timeRequired: '5-10 hours/week',
        howToStart: [
          'Reach out to local university professors',
          'Look for summer research programs',
          'Start an independent project with faculty mentor',
        ],
      });
    }

    // Positioning advice
    if (spike.hasSpike) {
      positioningAdvice.push(`Lead with your ${spike.primarySpike?.area} spike in applications`);
      positioningAdvice.push('Organize activities list to highlight depth in primary area');
    } else {
      positioningAdvice.push('Create a narrative thread connecting diverse activities');
      positioningAdvice.push('Emphasize sustained commitment and growth over time');
    }

    // Time allocation advice
    const currentHours = activities.reduce((sum, a) => sum + a.timeCommitment.hoursPerWeek, 0);
    if (currentHours > 25) {
      timeAllocation.push('Consider reducing involvement in lower-tier activities to deepen focus');
    }
    if (upgrades.length > 0) {
      timeAllocation.push(`Prioritize time for upgrading: ${upgrades[0].activityName}`);
    }

    return {
      upgrades: upgrades.slice(0, 5),
      newActivities: newActivities.slice(0, 3),
      positioningAdvice,
      timeAllocation,
    };
  }

  // ============================================================================
  // COMMON APP OPTIMIZATION
  // ============================================================================

  private optimizeForCommonApp(
    activities: ActivityInputData[],
    assessments: Record<string, ActivityTierAssessment>
  ): ActivityPortfolioAnalysis['commonAppOptimization'] {
    // Sort activities by tier and then by uniqueness
    const sorted = [...activities].sort((a, b) => {
      const tierDiff = assessments[a.id].assignedTier - assessments[b.id].assignedTier;
      if (tierDiff !== 0) return tierDiff;
      return assessments[b.id].tierFactors.uniqueness.score - assessments[a.id].tierFactors.uniqueness.score;
    });

    const suggestedOrder = sorted.map((a) => a.id);
    const top5 = sorted.slice(0, 5);

    return {
      suggestedOrder,
      activitiesToHighlight: top5.map((a) => a.id),
      activitiesToDeemphasize: sorted.slice(-2).map((a) => a.id),
      narrativeStrategy: this.generateNarrativeStrategy(sorted, assessments),
    };
  }

  private generateNarrativeStrategy(
    sortedActivities: ActivityInputData[],
    assessments: Record<string, ActivityTierAssessment>
  ): string {
    const top = sortedActivities[0];
    if (!top) return 'Focus on quality over quantity in your activities list.';

    const topAssessment = assessments[top.id];
    const topThemes = topAssessment.narrativeValue.contributesToTheme;

    return `Lead with ${top.name} (Tier ${topAssessment.assignedTier}) to establish your ${topThemes[0] || 'primary'} focus. Follow with activities that reinforce this theme while showing breadth.`;
  }

  // ============================================================================
  // OVERALL SCORING
  // ============================================================================

  private calculateOverallScore(
    tierSummary: ActivityPortfolioAnalysis['tierSummary'],
    spike: SpikeAnalysis,
    coherence: ThematicCoherenceAnalysis,
    commitment: CommitmentAnalysis,
    leadership: LeadershipAnalysis
  ): number {
    const result = calculateWeightedScore([
      { name: 'Tier Quality', score: this.calculateTierScore(tierSummary), weight: 35 },
      { name: 'Spike', score: spike.hasSpike ? 90 : 50, weight: 25 },
      { name: 'Coherence', score: coherence.overallCoherenceScore, weight: 15 },
      { name: 'Leadership', score: leadership.overallLeadershipScore, weight: 15 },
      { name: 'Commitment', score: this.commitmentToScore(commitment.depthVsBreadth), weight: 10 },
    ]);

    return result.finalScore;
  }

  private calculateTierScore(summary: ActivityPortfolioAnalysis['tierSummary']): number {
    // Weight tiers: T1=40, T2=30, T3=20, T4=5 (max)
    const score = (summary.tier1Count * 40) +
                  (summary.tier2Count * 30) +
                  (summary.tier3Count * 20) +
                  (summary.tier4Count * 5);
    // Normalize to 0-100
    return Math.min(100, score / 2);
  }

  private commitmentToScore(profile: DepthBreadthProfile): number {
    const scores: Record<DepthBreadthProfile, number> = {
      deep_spike: 95,
      depth_focused: 85,
      balanced: 75,
      broad_engaged: 55,
      spread_thin: 35,
    };
    return scores[profile];
  }

  private calculateTierSummary(tierBreakdown: ActivityPortfolioAnalysis['tierBreakdown']): ActivityPortfolioAnalysis['tierSummary'] {
    const counts = {
      tier1Count: tierBreakdown.tier1.length,
      tier2Count: tierBreakdown.tier2.length,
      tier3Count: tierBreakdown.tier3.length,
      tier4Count: tierBreakdown.tier4.length,
    };

    const total = counts.tier1Count + counts.tier2Count + counts.tier3Count + counts.tier4Count;
    const weightedSum = (counts.tier1Count * 1) + (counts.tier2Count * 2) + (counts.tier3Count * 3) + (counts.tier4Count * 4);
    const averageTier = total > 0 ? weightedSum / total : 4;

    let assessment: string;
    if (counts.tier1Count >= 2) {
      assessment = 'Exceptional activity portfolio with multiple nationally competitive achievements';
    } else if (counts.tier1Count >= 1 && counts.tier2Count >= 2) {
      assessment = 'Strong portfolio with spike activity and solid supporting achievements';
    } else if (counts.tier2Count >= 3) {
      assessment = 'Solid portfolio with multiple strong activities - consider pursuing higher recognition';
    } else if (counts.tier2Count >= 1 && counts.tier3Count >= 3) {
      assessment = 'Developing portfolio with room for growth - focus on deepening key activities';
    } else {
      assessment = 'Portfolio needs strengthening - prioritize quality over quantity';
    }

    return {
      ...counts,
      averageTier: Math.round(averageTier * 10) / 10,
      tierDistributionAssessment: assessment,
    };
  }

  private generatePortfolioNarrative(
    tierSummary: ActivityPortfolioAnalysis['tierSummary'],
    spike: SpikeAnalysis,
    coherence: ThematicCoherenceAnalysis,
    leadership: LeadershipAnalysis
  ): ActivityPortfolioAnalysis['portfolioNarrative'] {
    // Generate headline based on strongest aspect
    let headline: string;
    if (spike.hasSpike && spike.spikeStrength === 'national') {
      headline = `National-level ${spike.primarySpike?.area || 'achievement'} spike`;
    } else if (leadership.overallLeadershipScore >= 80) {
      headline = `Strong leadership profile with ${leadership.formalPositions} positions`;
    } else if (tierSummary.tier1Count > 0) {
      headline = `Tier 1 achievement with focused profile`;
    } else {
      headline = `Developing portfolio with ${coherence.primaryTheme.theme} focus`;
    }

    // Build summary
    const oneLineSummary = `${tierSummary.tier1Count} nationally competitive, ${tierSummary.tier2Count} regionally competitive activities. ${spike.hasSpike ? `Clear ${spike.primarySpike?.area} spike.` : 'No clear spike yet.'}`;

    // Collect strengths
    const strengths: string[] = [];
    if (tierSummary.tier1Count > 0) strengths.push(`${tierSummary.tier1Count} Tier 1 activity(ies)`);
    if (spike.hasSpike) strengths.push(`Clear spike in ${spike.primarySpike?.area}`);
    if (leadership.founderInitiatives > 0) strengths.push('Founded initiatives');
    if (coherence.overallCoherenceScore >= 70) strengths.push('Strong thematic coherence');

    // Collect concerns
    const concerns: string[] = [];
    if (tierSummary.tier1Count === 0) concerns.push('No nationally competitive activities');
    if (!spike.hasSpike) concerns.push('No clear spike area');
    if (leadership.formalPositions === 0) concerns.push('Limited formal leadership');
    if (coherence.overallCoherenceScore < 50) concerns.push('Activities lack coherent theme');

    // Unique aspects
    const uniqueAspects: string[] = [];
    if (leadership.founderInitiatives >= 2) uniqueAspects.push('Serial founder');
    if (coherence.primaryTheme.strength >= 60) uniqueAspects.push(`Strong ${coherence.primaryTheme.theme} focus`);

    // Competitive advantages
    const competitiveAdvantages: string[] = [];
    if (spike.hasSpike) competitiveAdvantages.push(`${spike.primarySpike?.area} expertise`);
    if (leadership.leadershipQuality.depth === 'exceptional') {
      competitiveAdvantages.push('Proven leadership track record');
    }

    return {
      headline,
      oneLineSummary,
      strengths,
      concerns,
      uniqueAspects,
      competitiveAdvantages,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private scoreToStrength(score: number): 'exceptional' | 'strong' | 'competitive' | 'developing' | 'needs_work' {
    if (score >= 85) return 'exceptional';
    if (score >= 70) return 'strong';
    if (score >= 55) return 'competitive';
    if (score >= 40) return 'developing';
    return 'needs_work';
  }

  private calculateDataCompleteness(input: ActivitiesInputData): number {
    if (input.activities.length === 0) return 0;

    let complete = 0;
    let total = 0;

    for (const activity of input.activities) {
      // Check key fields
      total += 6;
      if (activity.name) complete++;
      if (activity.description && activity.description.length > 20) complete++;
      if (activity.timeCommitment.hoursPerWeek > 0) complete++;
      if (activity.timeCommitment.yearsInvolved > 0) complete++;
      if (activity.achievements.length > 0 || activity.leadershipPositions.length > 0) complete++;
      if (activity.category) complete++;
    }

    return total > 0 ? complete / total : 0;
  }
}

// Export singleton
export const activityAnalyzer = new ActivityAnalyzer();
