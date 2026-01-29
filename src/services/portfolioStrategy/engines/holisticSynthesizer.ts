/**
 * Holistic Profile Synthesizer
 *
 * The heart of the PASS system - combines all component evaluations
 * into a unified profile assessment with coherent narrative and strategy.
 *
 * QUALITY PRINCIPLES:
 * - Weights dynamically adjusted based on profile characteristics
 * - Cross-component coherence analysis
 * - Context-aware adjustments for disadvantaged backgrounds
 * - Archetype detection for application branding
 *
 * This synthesizer creates the "big picture" view of the applicant.
 */

import {
  HolisticProfileSynthesis,
  ProfileTier,
  ApplicationArchetype,
  ComponentWeight,
  PersonalContext,
  GoalsAspirations,
  UniqueValueProposition,
  ApplicationBrand,
  CoherenceAnalysis,
  EssayQualitySummary,
  SynthesisWeightingConfig,
  ArchetypeDetectionConfig,
} from '../types/synthesis';
import { AcademicEvaluation, AcademicTier } from '../types/academic';
import { ActivityPortfolioAnalysis, ActivityTier, SpikeStrength } from '../types/activities';
import { AwardEvaluation } from '../types/awards';
import {
  calculateWeightedScore,
  calculateConfidence,
  generateInputHash,
  WeightedScoreComponent,
} from '../utils/scoring';
import { holisticSynthesisCache, generateHashedCacheKey } from '../utils/caching';

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_BASE_WEIGHTS: SynthesisWeightingConfig['baseWeights'] = {
  academic: 30,
  activities: 30,
  awards: 15,
  essays: 20,
  context: 5,
};

const ARCHETYPE_INDICATORS: ArchetypeDetectionConfig['archetypes'] = [
  {
    archetype: 'the_researcher',
    indicators: [
      { source: 'activities', indicator: 'research_spike', weight: 30 },
      { source: 'awards', indicator: 'research_recognition', weight: 25 },
      { source: 'activities', indicator: 'publications', weight: 20 },
      { source: 'awards', indicator: 'science_fair_success', weight: 15 },
      { source: 'academic', indicator: 'stem_excellence', weight: 10 },
    ],
    minimumScore: 50,
  },
  {
    archetype: 'the_innovator',
    indicators: [
      { source: 'activities', indicator: 'entrepreneurship', weight: 30 },
      { source: 'activities', indicator: 'startup_founding', weight: 25 },
      { source: 'awards', indicator: 'entrepreneurship_award', weight: 20 },
      { source: 'activities', indicator: 'product_creation', weight: 15 },
      { source: 'activities', indicator: 'patents_ip', weight: 10 },
    ],
    minimumScore: 45,
  },
  {
    archetype: 'the_leader',
    indicators: [
      { source: 'activities', indicator: 'leadership_positions', weight: 25 },
      { source: 'activities', indicator: 'organization_founding', weight: 25 },
      { source: 'activities', indicator: 'large_scale_impact', weight: 20 },
      { source: 'awards', indicator: 'leadership_recognition', weight: 15 },
      { source: 'activities', indicator: 'team_management', weight: 15 },
    ],
    minimumScore: 50,
  },
  {
    archetype: 'the_artist',
    indicators: [
      { source: 'activities', indicator: 'arts_dedication', weight: 30 },
      { source: 'awards', indicator: 'arts_recognition', weight: 25 },
      { source: 'activities', indicator: 'creative_portfolio', weight: 20 },
      { source: 'activities', indicator: 'performances_exhibitions', weight: 15 },
      { source: 'activities', indicator: 'arts_instruction', weight: 10 },
    ],
    minimumScore: 50,
  },
  {
    archetype: 'the_athlete',
    indicators: [
      { source: 'activities', indicator: 'varsity_sport', weight: 25 },
      { source: 'awards', indicator: 'athletic_recognition', weight: 30 },
      { source: 'activities', indicator: 'athletic_recruitment', weight: 25 },
      { source: 'activities', indicator: 'sport_leadership', weight: 10 },
      { source: 'activities', indicator: 'sport_commitment', weight: 10 },
    ],
    minimumScore: 55,
  },
  {
    archetype: 'the_advocate',
    indicators: [
      { source: 'activities', indicator: 'social_impact', weight: 30 },
      { source: 'activities', indicator: 'community_service', weight: 20 },
      { source: 'activities', indicator: 'activism', weight: 20 },
      { source: 'awards', indicator: 'service_recognition', weight: 15 },
      { source: 'activities', indicator: 'nonprofit_founding', weight: 15 },
    ],
    minimumScore: 50,
  },
  {
    archetype: 'the_polymath',
    indicators: [
      { source: 'academic', indicator: 'broad_excellence', weight: 25 },
      { source: 'activities', indicator: 'diverse_high_achievement', weight: 30 },
      { source: 'awards', indicator: 'multi_domain_recognition', weight: 25 },
      { source: 'activities', indicator: 'cross_disciplinary', weight: 20 },
    ],
    minimumScore: 60,
  },
  {
    archetype: 'the_specialist',
    indicators: [
      { source: 'activities', indicator: 'deep_focus_single_area', weight: 35 },
      { source: 'awards', indicator: 'specialist_recognition', weight: 30 },
      { source: 'activities', indicator: 'significant_time_investment', weight: 20 },
      { source: 'academic', indicator: 'related_coursework', weight: 15 },
    ],
    minimumScore: 55,
  },
  {
    archetype: 'the_builder',
    indicators: [
      { source: 'activities', indicator: 'engineering_projects', weight: 30 },
      { source: 'activities', indicator: 'robotics', weight: 25 },
      { source: 'awards', indicator: 'stem_competition', weight: 20 },
      { source: 'activities', indicator: 'maker_activities', weight: 15 },
      { source: 'activities', indicator: 'technical_creation', weight: 10 },
    ],
    minimumScore: 50,
  },
  {
    archetype: 'the_connector',
    indicators: [
      { source: 'activities', indicator: 'community_building', weight: 30 },
      { source: 'activities', indicator: 'event_organizing', weight: 25 },
      { source: 'activities', indicator: 'mentorship', weight: 20 },
      { source: 'activities', indicator: 'bridge_building', weight: 15 },
      { source: 'awards', indicator: 'community_recognition', weight: 10 },
    ],
    minimumScore: 45,
  },
  {
    archetype: 'the_overcomer',
    indicators: [
      { source: 'activities', indicator: 'adversity_context', weight: 40 },
      { source: 'activities', indicator: 'family_responsibilities', weight: 25 },
      { source: 'activities', indicator: 'work_obligations', weight: 20 },
      { source: 'activities', indicator: 'achievement_despite_obstacles', weight: 15 },
    ],
    minimumScore: 50,
  },
  {
    archetype: 'the_mentor',
    indicators: [
      { source: 'activities', indicator: 'teaching_tutoring', weight: 35 },
      { source: 'activities', indicator: 'peer_mentorship', weight: 25 },
      { source: 'activities', indicator: 'educational_program_creation', weight: 20 },
      { source: 'awards', indicator: 'teaching_recognition', weight: 10 },
      { source: 'activities', indicator: 'coaching', weight: 10 },
    ],
    minimumScore: 50,
  },
];

// ============================================================================
// PROFILE TIER THRESHOLDS
// ============================================================================

const PROFILE_TIER_THRESHOLDS: Record<ProfileTier, { min: number; max: number }> = {
  exceptional: { min: 90, max: 100 },
  highly_competitive: { min: 78, max: 89 },
  competitive: { min: 65, max: 77 },
  developing: { min: 50, max: 64 },
  building: { min: 0, max: 49 },
};

// ============================================================================
// HOLISTIC SYNTHESIZER CLASS
// ============================================================================

export class HolisticSynthesizer {
  /**
   * Synthesize complete holistic profile
   */
  async synthesize(
    academic: AcademicEvaluation,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    essays: EssayQualitySummary,
    context: PersonalContext,
    goals: GoalsAspirations
  ): Promise<HolisticProfileSynthesis> {
    // Check cache
    const { key, hash } = generateHashedCacheKey('holistic', 'synthesis', {
      academic: academic.inputDataHash,
      activities: activities.inputDataHash,
      awards: awards.inputDataHash,
      essays,
      context,
      goals,
    });
    const cached = holisticSynthesisCache.get(key);
    if (cached) {
      return cached as HolisticProfileSynthesis;
    }

    // Calculate component weights (dynamic based on profile)
    const componentWeights = this.calculateComponentWeights(
      academic, activities, awards, essays, context
    );

    // Calculate score breakdown
    const scoreBreakdown = this.calculateScoreBreakdown(
      academic, activities, awards, essays, context, componentWeights
    );

    // Determine profile tier
    const { tier, tierJustification } = this.determineProfileTier(scoreBreakdown.finalScore, {
      academic, activities, awards
    });

    // Detect application archetype
    const applicationBrand = this.detectApplicationBrand(
      academic, activities, awards, essays, goals
    );

    // Analyze coherence
    const coherenceAnalysis = this.analyzeCoherence(
      academic, activities, awards, essays, goals
    );

    // Generate unique value proposition
    const uniqueValue = this.generateUniqueValue(
      academic, activities, awards, applicationBrand, goals
    );

    // Synthesize strengths and concerns
    const strengthsAndConcerns = this.synthesizeStrengthsAndConcerns(
      academic, activities, awards, essays
    );

    // Generate competitive positioning
    const competitivePositioning = this.generateCompetitivePositioning(
      academic, activities, awards, applicationBrand, tier
    );

    // Generate strategy insights
    const strategyInsights = this.generateStrategyInsights(
      strengthsAndConcerns, competitivePositioning, goals, tier
    );

    // Generate overall narrative
    const profileNarrative = this.generateProfileNarrative(
      tier, applicationBrand, strengthsAndConcerns, competitivePositioning
    );

    // Build synthesis result
    const synthesis: HolisticProfileSynthesis = {
      synthesizedAt: new Date().toISOString(),
      version: '1.0.0',
      profileStrength: {
        overallScore: scoreBreakdown.finalScore,
        tier,
        tierJustification,
        narrative: profileNarrative,
      },
      componentWeights,
      scoreBreakdown,
      personalContext: context,
      uniqueValue,
      applicationBrand,
      coherenceAnalysis,
      strengthsAndConcerns,
      competitivePositioning,
      strategyInsights,
      componentEvaluations: {
        academic,
        activities,
        awards,
        essays,
      },
      inputDataHash: hash,
      confidenceScore: this.calculateConfidenceScore(academic, activities, awards, essays),
    };

    // Cache result
    holisticSynthesisCache.set(key, synthesis, hash);

    return synthesis;
  }

  // ============================================================================
  // COMPONENT WEIGHT CALCULATION
  // ============================================================================

  /**
   * Calculate dynamic component weights based on profile characteristics
   */
  private calculateComponentWeights(
    academic: AcademicEvaluation,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    essays: EssayQualitySummary,
    context: PersonalContext
  ): HolisticProfileSynthesis['componentWeights'] {
    // Start with base weights
    let weights = { ...DEFAULT_BASE_WEIGHTS };

    // Adjust based on academic strength
    if (academic.overallTier === 'exceptional' || academic.overallTier === 'highly_competitive') {
      weights.academic += 5;
      weights.activities -= 3;
      weights.awards -= 2;
    } else if (academic.overallTier === 'developing' || academic.overallTier === 'needs_improvement') {
      weights.academic -= 5;
      weights.activities += 3;
      weights.awards += 2;
    }

    // Adjust based on spike presence
    if (activities.spikeAnalysis.hasClearSpike) {
      weights.activities += 5;
      weights.academic -= 3;
      weights.awards -= 2;
    }

    // Adjust based on award strength
    if (awards.overallStrength === 'exceptional' || awards.overallStrength === 'strong') {
      weights.awards += 5;
      weights.essays -= 3;
      weights.context -= 2;
    }

    // Adjust for context
    if (context.contextBoost.applicable && context.contextBoost.boostAmount >= 10) {
      weights.context += 5;
      weights.academic -= 3;
      weights.awards -= 2;
    }

    // Normalize to sum to 100
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    for (const key of Object.keys(weights) as (keyof typeof weights)[]) {
      weights[key] = Math.round((weights[key] / total) * 100);
    }

    // Ensure we hit 100 (handle rounding)
    const newTotal = Object.values(weights).reduce((a, b) => a + b, 0);
    if (newTotal !== 100) {
      weights.academic += (100 - newTotal);
    }

    // Calculate individual component contributions
    const academicStrength = this.normalizeComponentScore(academic.overallScore);
    const activitiesStrength = this.normalizeComponentScore(activities.overallScore);
    const awardsStrength = this.normalizeComponentScore(awards.overallScore);
    const essaysStrength = essays.hasEssayAnalysis ? (essays.overallEssayScore || 50) : 50;
    const contextStrength = context.contextBoost.applicable ? context.contextBoost.boostAmount * 6 : 30;

    return {
      academic: {
        weight: weights.academic,
        strength: academicStrength,
        contribution: Math.round(weights.academic * academicStrength / 100),
        importance: this.getAcademicImportanceReason(academic),
      },
      activities: {
        weight: weights.activities,
        strength: activitiesStrength,
        contribution: Math.round(weights.activities * activitiesStrength / 100),
        importance: this.getActivitiesImportanceReason(activities),
      },
      awards: {
        weight: weights.awards,
        strength: awardsStrength,
        contribution: Math.round(weights.awards * awardsStrength / 100),
        importance: this.getAwardsImportanceReason(awards),
      },
      essays: {
        weight: weights.essays,
        strength: essaysStrength,
        contribution: Math.round(weights.essays * essaysStrength / 100),
        importance: essays.hasEssayAnalysis
          ? 'Essays provide voice and narrative context'
          : 'Essays not yet analyzed - weight may shift',
      },
      context: {
        weight: weights.context,
        strength: contextStrength,
        contribution: Math.round(weights.context * contextStrength / 100),
        importance: context.contextBoost.applicable
          ? context.contextBoost.justification
          : 'Standard context without significant adjustments',
      },
    };
  }

  /**
   * Normalize component scores to 0-100 scale
   */
  private normalizeComponentScore(score: number): number {
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Get academic importance reason
   */
  private getAcademicImportanceReason(academic: AcademicEvaluation): string {
    if (academic.overallTier === 'exceptional') {
      return 'Exceptional academics carry significant weight, demonstrating readiness for rigorous programs';
    }
    if (academic.overallTier === 'highly_competitive') {
      return 'Strong academics meet threshold for competitive schools; other factors can differentiate';
    }
    if (academic.overallTier === 'competitive') {
      return 'Academics are solid but not distinctive; extracurriculars and essays become more important';
    }
    return 'Academic profile needs strengthening; must compensate with exceptional other components';
  }

  /**
   * Get activities importance reason
   */
  private getActivitiesImportanceReason(activities: ActivityPortfolioAnalysis): string {
    if (activities.spikeAnalysis.hasClearSpike) {
      return `Strong spike in ${activities.spikeAnalysis.spikeArea} makes activities central to application narrative`;
    }
    if (activities.overallStrength === 'exceptional') {
      return 'Exceptional activities provide strong differentiation in applicant pool';
    }
    if (activities.overallStrength === 'competitive') {
      return 'Competitive activities support application but aren\'t the primary differentiator';
    }
    return 'Activity profile needs development; may rely more on other components';
  }

  /**
   * Get awards importance reason
   */
  private getAwardsImportanceReason(awards: AwardEvaluation): string {
    if (awards.overallStrength === 'exceptional') {
      return 'Exceptional awards provide external validation that significantly strengthens application';
    }
    if (awards.overallStrength === 'strong') {
      return 'Strong awards support academic and activity narratives with external recognition';
    }
    if (awards.overallStrength === 'competitive') {
      return 'Competitive awards meet expectations; focus on presentation and context';
    }
    return 'Awards section is not a strength; other components must carry more weight';
  }

  // ============================================================================
  // SCORE CALCULATION
  // ============================================================================

  /**
   * Calculate detailed score breakdown
   */
  private calculateScoreBreakdown(
    academic: AcademicEvaluation,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    essays: EssayQualitySummary,
    context: PersonalContext,
    weights: HolisticProfileSynthesis['componentWeights']
  ): HolisticProfileSynthesis['scoreBreakdown'] {
    // Calculate base score (weighted average)
    const components: WeightedScoreComponent[] = [
      { value: weights.academic.strength, weight: weights.academic.weight / 100 },
      { value: weights.activities.strength, weight: weights.activities.weight / 100 },
      { value: weights.awards.strength, weight: weights.awards.weight / 100 },
      { value: weights.essays.strength, weight: weights.essays.weight / 100 },
      { value: weights.context.strength, weight: weights.context.weight / 100 },
    ];

    const { weightedScore: baseScore } = calculateWeightedScore(components);

    // Calculate context boost
    const contextBoost = context.contextBoost.applicable
      ? Math.min(15, context.contextBoost.boostAmount)
      : 0;

    // Calculate coherence bonus (we'll compute this later, use placeholder for now)
    const coherenceBonus = 0; // Will be updated after coherence analysis

    // Calculate final score
    const finalScore = Math.min(100, Math.round(baseScore + contextBoost + coherenceBonus));

    return {
      baseScore: Math.round(baseScore),
      academicContribution: weights.academic.contribution,
      activitiesContribution: weights.activities.contribution,
      awardsContribution: weights.awards.contribution,
      essaysContribution: weights.essays.contribution,
      contextBoost,
      coherenceBonus,
      finalScore,
      scoreExplanation: this.generateScoreExplanation(
        baseScore, contextBoost, coherenceBonus, finalScore, weights
      ),
    };
  }

  /**
   * Generate score explanation
   */
  private generateScoreExplanation(
    baseScore: number,
    contextBoost: number,
    coherenceBonus: number,
    finalScore: number,
    weights: HolisticProfileSynthesis['componentWeights']
  ): string {
    const contributionParts: string[] = [];

    // Find strongest and weakest contributors
    const sortedWeights = Object.entries(weights)
      .sort((a, b) => b[1].contribution - a[1].contribution);

    const strongest = sortedWeights[0];
    const weakest = sortedWeights[sortedWeights.length - 1];

    contributionParts.push(
      `${strongest[0].charAt(0).toUpperCase() + strongest[0].slice(1)} contributes most (${strongest[1].contribution} points)`
    );

    if (contextBoost > 0) {
      contributionParts.push(`Context boost adds ${contextBoost} points`);
    }

    if (coherenceBonus > 0) {
      contributionParts.push(`Coherence bonus adds ${coherenceBonus} points`);
    }

    return `Score of ${finalScore}: Base score ${Math.round(baseScore)} from weighted components. ` +
           contributionParts.join('. ') + '.';
  }

  // ============================================================================
  // PROFILE TIER DETERMINATION
  // ============================================================================

  /**
   * Determine profile tier from score
   */
  private determineProfileTier(
    score: number,
    components: {
      academic: AcademicEvaluation;
      activities: ActivityPortfolioAnalysis;
      awards: AwardEvaluation;
    }
  ): { tier: ProfileTier; tierJustification: string } {
    // Find tier from score
    let tier: ProfileTier = 'building';
    for (const [tierName, { min, max }] of Object.entries(PROFILE_TIER_THRESHOLDS) as [ProfileTier, { min: number; max: number }][]) {
      if (score >= min && score <= max) {
        tier = tierName;
        break;
      }
    }

    // Adjust tier based on qualitative factors
    // Can bump up if have exceptional spike or major award
    if (tier === 'competitive' || tier === 'highly_competitive') {
      const hasExceptionalElement =
        components.activities.spikeAnalysis.spikeStrength === 'national_level' ||
        components.awards.distribution.summary.tier1Awards >= 2;

      if (hasExceptionalElement && tier === 'competitive') {
        tier = 'highly_competitive';
      } else if (hasExceptionalElement && tier === 'highly_competitive' && score >= 85) {
        tier = 'exceptional';
      }
    }

    // Can bump down if major concern
    if (tier === 'competitive' || tier === 'highly_competitive') {
      const hasCriticalWeakness =
        components.academic.overallTier === 'needs_improvement' ||
        components.activities.overallStrength === 'needs_work';

      if (hasCriticalWeakness && tier === 'highly_competitive') {
        tier = 'competitive';
      }
    }

    const tierJustification = this.generateTierJustification(tier, score, components);

    return { tier, tierJustification };
  }

  /**
   * Generate tier justification
   */
  private generateTierJustification(
    tier: ProfileTier,
    score: number,
    components: {
      academic: AcademicEvaluation;
      activities: ActivityPortfolioAnalysis;
      awards: AwardEvaluation;
    }
  ): string {
    const justifications: Record<ProfileTier, string> = {
      exceptional: `Profile achieves exceptional standing (score: ${score}) with strength across multiple components. The combination of ${components.academic.overallTier} academics, ${components.activities.overallStrength} activities, and ${components.awards.overallStrength} awards creates a compelling application competitive at any institution.`,
      highly_competitive: `Profile is highly competitive (score: ${score}) with clear strengths that distinguish from typical applicants. Well-positioned for T20 admissions with proper presentation and school selection.`,
      competitive: `Profile is competitive (score: ${score}) and meets expectations for selective institutions. Success will depend on school selection, essay quality, and strategic positioning of strengths.`,
      developing: `Profile is developing (score: ${score}) with room for growth before applications. Focus on strengthening weaker components and pursuing standout opportunities.`,
      building: `Profile is in building stage (score: ${score}) and requires significant development. Prioritize academic performance and finding meaningful extracurricular focus.`,
    };

    return justifications[tier];
  }

  // ============================================================================
  // ARCHETYPE DETECTION
  // ============================================================================

  /**
   * Detect application brand/archetype
   */
  private detectApplicationBrand(
    academic: AcademicEvaluation,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    essays: EssayQualitySummary,
    goals: GoalsAspirations
  ): ApplicationBrand {
    // Score each archetype
    const archetypeScores = new Map<ApplicationArchetype, number>();

    for (const archetypeConfig of ARCHETYPE_INDICATORS) {
      let score = 0;

      for (const indicator of archetypeConfig.indicators) {
        const indicatorPresent = this.checkIndicator(
          indicator.source,
          indicator.indicator,
          { academic, activities, awards, essays }
        );
        if (indicatorPresent) {
          score += indicator.weight;
        }
      }

      archetypeScores.set(archetypeConfig.archetype, score);
    }

    // Find primary archetype
    let primaryArchetype: ApplicationArchetype = 'undefined';
    let highestScore = 0;
    let secondaryArchetype: ApplicationArchetype | undefined;
    let secondHighestScore = 0;

    for (const [archetype, score] of archetypeScores) {
      if (score > highestScore) {
        secondaryArchetype = primaryArchetype;
        secondHighestScore = highestScore;
        primaryArchetype = archetype;
        highestScore = score;
      } else if (score > secondHighestScore) {
        secondaryArchetype = archetype;
        secondHighestScore = score;
      }
    }

    // Check if archetype meets minimum threshold
    const config = ARCHETYPE_INDICATORS.find(a => a.archetype === primaryArchetype);
    if (!config || highestScore < config.minimumScore) {
      primaryArchetype = 'undefined';
    }

    // Check secondary threshold
    const secondaryConfig = ARCHETYPE_INDICATORS.find(a => a.archetype === secondaryArchetype);
    if (!secondaryConfig || secondHighestScore < secondaryConfig.minimumScore * 0.8) {
      secondaryArchetype = undefined;
    }

    // Generate brand elements
    const coreNarrative = this.generateCoreNarrative(
      primaryArchetype, activities, awards, goals
    );

    const keyThemes = this.identifyKeyThemes(activities, awards, goals);

    const proofPoints = this.generateProofPoints(academic, activities, awards);

    const brandConsistency = this.assessBrandConsistency(
      primaryArchetype, academic, activities, awards
    );

    return {
      primaryArchetype,
      archetypeConfidence: Math.min(100, Math.round((highestScore / 100) * 100)),
      archetypeJustification: this.generateArchetypeJustification(primaryArchetype, activities, awards),
      secondaryArchetype,
      coreNarrative,
      keyThemes,
      proofPoints,
      brandConsistency,
    };
  }

  /**
   * Check if indicator is present
   */
  private checkIndicator(
    source: 'academic' | 'activities' | 'awards' | 'essays',
    indicator: string,
    components: {
      academic: AcademicEvaluation;
      activities: ActivityPortfolioAnalysis;
      awards: AwardEvaluation;
      essays: EssayQualitySummary;
    }
  ): boolean {
    // This is a simplified check - in production, would be more sophisticated
    switch (source) {
      case 'activities':
        return this.checkActivityIndicator(indicator, components.activities);
      case 'awards':
        return this.checkAwardIndicator(indicator, components.awards);
      case 'academic':
        return this.checkAcademicIndicator(indicator, components.academic);
      case 'essays':
        return this.checkEssayIndicator(indicator, components.essays);
      default:
        return false;
    }
  }

  /**
   * Check activity indicator
   */
  private checkActivityIndicator(indicator: string, activities: ActivityPortfolioAnalysis): boolean {
    switch (indicator) {
      case 'research_spike':
        return activities.spikeAnalysis.spikeArea?.toLowerCase().includes('research') ||
               activities.spikeAnalysis.spikeArea?.toLowerCase().includes('science') || false;
      case 'publications':
        return activities.activityAssessments.some(a =>
          a.activityName.toLowerCase().includes('publish') ||
          a.activityName.toLowerCase().includes('journal'));
      case 'entrepreneurship':
      case 'startup_founding':
        return activities.spikeAnalysis.spikeArea?.toLowerCase().includes('entrepreneur') ||
               activities.activityAssessments.some(a =>
                 a.activityName.toLowerCase().includes('startup') ||
                 a.activityName.toLowerCase().includes('founded'));
      case 'product_creation':
        return activities.activityAssessments.some(a =>
          a.activityName.toLowerCase().includes('created') ||
          a.activityName.toLowerCase().includes('developed app'));
      case 'leadership_positions':
        return activities.leadershipAnalysis.leadershipProfile !== 'none';
      case 'organization_founding':
        return activities.activityAssessments.some(a =>
          a.activityName.toLowerCase().includes('founded') ||
          a.activityName.toLowerCase().includes('started'));
      case 'large_scale_impact':
        return activities.activityAssessments.some(a => a.tier === 1 || a.tier === 2);
      case 'team_management':
        return activities.leadershipAnalysis.leadershipProfile === 'strong_leader' ||
               activities.leadershipAnalysis.leadershipProfile === 'organizational_leader';
      case 'arts_dedication':
        return activities.spikeAnalysis.spikeArea?.toLowerCase().includes('art') ||
               activities.spikeAnalysis.spikeArea?.toLowerCase().includes('music') ||
               activities.spikeAnalysis.spikeArea?.toLowerCase().includes('theater') || false;
      case 'creative_portfolio':
        return activities.activityAssessments.some(a =>
          a.activityName.toLowerCase().includes('portfolio'));
      case 'varsity_sport':
        return activities.activityAssessments.some(a =>
          a.activityName.toLowerCase().includes('varsity'));
      case 'sport_leadership':
        return activities.activityAssessments.some(a =>
          a.activityName.toLowerCase().includes('captain'));
      case 'social_impact':
      case 'community_service':
        return activities.activityAssessments.some(a =>
          a.activityName.toLowerCase().includes('volunteer') ||
          a.activityName.toLowerCase().includes('nonprofit') ||
          a.activityName.toLowerCase().includes('community'));
      case 'activism':
        return activities.activityAssessments.some(a =>
          a.activityName.toLowerCase().includes('advocacy') ||
          a.activityName.toLowerCase().includes('activism'));
      case 'diverse_high_achievement':
        const highTierCount = activities.activityAssessments.filter(a => a.tier <= 2).length;
        const uniqueCategories = new Set(activities.activityAssessments.map(a => a.category));
        return highTierCount >= 3 && uniqueCategories.size >= 4;
      case 'deep_focus_single_area':
        return activities.spikeAnalysis.hasClearSpike &&
               activities.spikeAnalysis.spikeStrength !== 'emerging';
      case 'significant_time_investment':
        return activities.commitmentAnalysis.depthVsBreadth === 'depth_focused';
      case 'engineering_projects':
      case 'robotics':
        return activities.activityAssessments.some(a =>
          a.activityName.toLowerCase().includes('robotics') ||
          a.activityName.toLowerCase().includes('engineering'));
      case 'maker_activities':
        return activities.activityAssessments.some(a =>
          a.activityName.toLowerCase().includes('maker') ||
          a.activityName.toLowerCase().includes('build'));
      case 'community_building':
      case 'event_organizing':
        return activities.activityAssessments.some(a =>
          a.activityName.toLowerCase().includes('organiz') ||
          a.activityName.toLowerCase().includes('event'));
      case 'mentorship':
      case 'teaching_tutoring':
        return activities.activityAssessments.some(a =>
          a.activityName.toLowerCase().includes('tutor') ||
          a.activityName.toLowerCase().includes('mentor') ||
          a.activityName.toLowerCase().includes('teach'));
      case 'adversity_context':
      case 'family_responsibilities':
      case 'work_obligations':
        return activities.activityAssessments.some(a =>
          a.activityName.toLowerCase().includes('work') ||
          a.activityName.toLowerCase().includes('family'));
      default:
        return false;
    }
  }

  /**
   * Check award indicator
   */
  private checkAwardIndicator(indicator: string, awards: AwardEvaluation): boolean {
    switch (indicator) {
      case 'research_recognition':
        return Object.values(awards.awardAssessments).some(a =>
          a.category === 'research_recognition' || a.category === 'science_fair');
      case 'science_fair_success':
        return Object.values(awards.awardAssessments).some(a =>
          a.category === 'science_fair' &&
          ['international', 'national', 'regional'].includes(a.recognitionLevel));
      case 'entrepreneurship_award':
        return Object.values(awards.awardAssessments).some(a =>
          a.category === 'entrepreneurship');
      case 'leadership_recognition':
        return Object.values(awards.awardAssessments).some(a =>
          a.category === 'leadership');
      case 'arts_recognition':
        return Object.values(awards.awardAssessments).some(a =>
          a.category === 'arts_competition');
      case 'athletic_recognition':
        return Object.values(awards.awardAssessments).some(a =>
          a.category === 'athletic' &&
          ['state', 'regional', 'national'].includes(a.recognitionLevel));
      case 'service_recognition':
        return Object.values(awards.awardAssessments).some(a =>
          a.category === 'community_service');
      case 'multi_domain_recognition':
        const categories = new Set(Object.values(awards.awardAssessments).map(a => a.category));
        return categories.size >= 4 && awards.distribution.summary.tier2Awards >= 3;
      case 'specialist_recognition':
        return awards.distribution.summary.tier1Awards >= 1 ||
               awards.distribution.summary.tier2Awards >= 3;
      case 'stem_competition':
        return Object.values(awards.awardAssessments).some(a =>
          a.category === 'stem_competition' || a.category === 'academic_olympiad');
      case 'community_recognition':
        return Object.values(awards.awardAssessments).some(a =>
          a.category === 'community_service' || a.category === 'leadership');
      default:
        return false;
    }
  }

  /**
   * Check academic indicator
   */
  private checkAcademicIndicator(indicator: string, academic: AcademicEvaluation): boolean {
    switch (indicator) {
      case 'stem_excellence':
        // Check if STEM course rigor is high
        return academic.courseRigor.rigorLevel === 'exceptional' ||
               academic.courseRigor.rigorLevel === 'strong';
      case 'broad_excellence':
        return academic.overallTier === 'exceptional' ||
               academic.overallTier === 'highly_competitive';
      case 'related_coursework':
        return academic.courseRigor.rigorLevel !== 'basic';
      default:
        return false;
    }
  }

  /**
   * Check essay indicator
   */
  private checkEssayIndicator(indicator: string, essays: EssayQualitySummary): boolean {
    // Essay indicators would require essay content analysis
    // For now, return false as placeholder
    return false;
  }

  /**
   * Generate core narrative
   */
  private generateCoreNarrative(
    archetype: ApplicationArchetype,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    goals: GoalsAspirations
  ): ApplicationBrand['coreNarrative'] {
    const spike = activities.spikeAnalysis.spikeArea || 'diverse interests';
    const major = goals.intendedMajor || 'their field of interest';

    const archetypeNarratives: Record<ApplicationArchetype, {
      oneLineSummary: string;
      elevatorPitch: string;
      fullNarrative: string;
    }> = {
      the_researcher: {
        oneLineSummary: `Driven researcher pursuing ${major}`,
        elevatorPitch: `A student with genuine intellectual curiosity who has pursued original research in ${spike}, demonstrating the ability to contribute to ${major} at a high level.`,
        fullNarrative: `This applicant is defined by deep intellectual curiosity and commitment to advancing knowledge in ${spike}. Their research demonstrates not just technical ability, but genuine passion for discovery. They approach ${major} not as a career path but as a calling, with the tools and mindset to make meaningful contributions to the field.`,
      },
      the_innovator: {
        oneLineSummary: `Entrepreneurial innovator creating solutions`,
        elevatorPitch: `A creative problem-solver who doesn't just identify issues but builds solutions. Their ventures in ${spike} demonstrate initiative, resilience, and ability to turn ideas into impact.`,
        fullNarrative: `This applicant sees problems as opportunities and has the drive to create solutions. Their entrepreneurial work in ${spike} showcases not just business acumen, but the creativity and persistence needed to build something from nothing. They will bring this builder's mindset to their studies in ${major} and to the campus community.`,
      },
      the_leader: {
        oneLineSummary: `Natural leader driving organizational impact`,
        elevatorPitch: `A leader who inspires others and creates lasting change. Through their work in ${spike}, they've demonstrated ability to organize, motivate, and achieve results through people.`,
        fullNarrative: `This applicant doesn't just participate—they lead. Their leadership in ${spike} has created meaningful impact and developed the skills to inspire and organize others. They bring both the vision to see what's possible and the execution ability to make it happen. In college, they will elevate any organization they join.`,
      },
      the_artist: {
        oneLineSummary: `Creative talent with artistic vision`,
        elevatorPitch: `An artist whose creative work in ${spike} demonstrates not just technical skill but genuine artistic voice. They approach ${major} with the creativity and dedication of a true artist.`,
        fullNarrative: `This applicant expresses themselves through creative work that shows both technical mastery and authentic artistic vision. Their dedication to ${spike} demonstrates the discipline and passion that defines serious artists. They will bring creative perspectives to ${major} and enrich campus artistic life.`,
      },
      the_athlete: {
        oneLineSummary: `Elite athlete with competitive drive`,
        elevatorPitch: `An athlete who has achieved at high levels through dedication, teamwork, and competitive drive. These same qualities will transfer to academic and professional success in ${major}.`,
        fullNarrative: `This applicant has demonstrated what it takes to compete at high levels: discipline, resilience, ability to perform under pressure, and teamwork. Their athletic achievements reflect a competitive drive that extends beyond sports. They will bring this winner's mentality to their studies in ${major} and to campus life.`,
      },
      the_advocate: {
        oneLineSummary: `Passionate advocate for meaningful change`,
        elevatorPitch: `Someone who sees injustice and acts. Their work in ${spike} demonstrates genuine commitment to making the world better, not just building a resume.`,
        fullNarrative: `This applicant is driven by purpose larger than themselves. Their advocacy work in ${spike} shows deep understanding of social issues and the courage to address them. They don't just talk about change—they create it. In college, they will use their platform and education to amplify their impact on causes that matter.`,
      },
      the_polymath: {
        oneLineSummary: `Renaissance student excelling across domains`,
        elevatorPitch: `A rare student who achieves at high levels across multiple domains. This breadth isn't superficial—they bring the same excellence to everything they pursue.`,
        fullNarrative: `This applicant defies specialization, achieving excellence in multiple unrelated areas. Their diverse accomplishments aren't scattered interests but reflect genuine ability and curiosity across domains. They bring unique perspectives that come from connecting different fields, making them valuable contributors to interdisciplinary environments.`,
      },
      the_specialist: {
        oneLineSummary: `Deep specialist in ${spike}`,
        elevatorPitch: `Someone who has gone deeper in ${spike} than most students go in anything. This depth reflects not just interest but the sustained focus that creates expertise.`,
        fullNarrative: `This applicant has achieved unusual depth in ${spike}, demonstrating the focused dedication that distinguishes experts from enthusiasts. Their specialization isn't narrow-mindedness but reflects genuine passion channeled into deep learning. In ${major}, they will bring expertise and commitment that enhances the academic community.`,
      },
      the_builder: {
        oneLineSummary: `Hands-on creator and builder`,
        elevatorPitch: `Someone who creates tangible things. Their work in ${spike} demonstrates the engineering mindset—see a problem, design a solution, build it, iterate.`,
        fullNarrative: `This applicant is a builder at heart. Their projects in ${spike} show the full engineering cycle: identifying problems, designing solutions, and creating real things that work. They don't just theorize—they build. In ${major}, they will bring this maker mentality to both academic work and campus projects.`,
      },
      the_connector: {
        oneLineSummary: `Community builder bringing people together`,
        elevatorPitch: `Someone who builds communities and brings people together. Their work in ${spike} has created spaces and organizations that connect others.`,
        fullNarrative: `This applicant has a gift for building community. Through their work in ${spike}, they've created spaces that bring people together and fostered connections that wouldn't exist otherwise. They understand that real impact often comes through people, not just projects. In college, they will strengthen the campus community.`,
      },
      the_overcomer: {
        oneLineSummary: `Resilient achiever who has overcome obstacles`,
        elevatorPitch: `Someone who has achieved despite significant obstacles. Their accomplishments must be understood in context—they've had to work harder and overcome more than most.`,
        fullNarrative: `This applicant's achievements must be understood in the context of the challenges they've faced. What they've accomplished while navigating significant adversity demonstrates remarkable resilience, resourcefulness, and determination. They bring perspective and strength that comes from overcoming real obstacles—qualities that will serve them well in ${major} and beyond.`,
      },
      the_mentor: {
        oneLineSummary: `Dedicated mentor helping others grow`,
        elevatorPitch: `Someone who finds meaning in helping others develop. Their extensive teaching and mentoring in ${spike} reflects genuine commitment to lifting others up.`,
        fullNarrative: `This applicant is a natural teacher and mentor. Their work helping others in ${spike} isn't resume-building—it's a genuine calling. They understand that teaching deepens your own understanding and find fulfillment in others' growth. In college, they will strengthen academic communities through peer support and mentorship.`,
      },
      undefined: {
        oneLineSummary: `Developing student with diverse interests`,
        elevatorPitch: `A student with varied interests who is still discovering their focus. Their exploration reflects healthy curiosity; the application would benefit from clearer narrative direction.`,
        fullNarrative: `This applicant has explored various interests but hasn't yet developed a clear defining narrative. This isn't necessarily negative—genuine exploration is valuable. However, the application would benefit from identifying which themes and achievements best represent who they are and what they'll contribute. Consider focusing the application around the strongest 2-3 threads.`,
      },
    };

    return archetypeNarratives[archetype];
  }

  /**
   * Identify key themes
   */
  private identifyKeyThemes(
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    goals: GoalsAspirations
  ): ApplicationBrand['keyThemes'] {
    const themes: ApplicationBrand['keyThemes'] = [];

    // Theme from spike
    if (activities.spikeAnalysis.hasClearSpike) {
      themes.push({
        theme: activities.spikeAnalysis.spikeArea || 'Primary focus area',
        evidence: activities.spikeAnalysis.supportingActivities.slice(0, 3),
        strength: activities.spikeAnalysis.spikeStrength === 'national_level' ? 95 :
                  activities.spikeAnalysis.spikeStrength === 'regional_level' ? 80 :
                  activities.spikeAnalysis.spikeStrength === 'local_level' ? 65 : 50,
      });
    }

    // Theme from thematic coherence
    if (activities.thematicCoherence.primaryTheme) {
      themes.push({
        theme: activities.thematicCoherence.primaryTheme,
        evidence: activities.thematicCoherence.supportingActivities.slice(0, 3),
        strength: activities.thematicCoherence.coherenceScore,
      });
    }

    // Theme from leadership if strong
    if (activities.leadershipAnalysis.leadershipProfile === 'strong_leader' ||
        activities.leadershipAnalysis.leadershipProfile === 'organizational_leader') {
      themes.push({
        theme: 'Leadership and organizational impact',
        evidence: activities.leadershipAnalysis.keyLeadershipRoles.slice(0, 3),
        strength: 75,
      });
    }

    // Theme from intended major alignment
    if (goals.intendedMajor) {
      const relevantAwards = Object.values(awards.awardAssessments)
        .filter(a => a.relevanceToMajor === 'high')
        .map(a => a.awardName);

      if (relevantAwards.length >= 2) {
        themes.push({
          theme: `${goals.intendedMajor} excellence`,
          evidence: relevantAwards.slice(0, 3),
          strength: 70,
        });
      }
    }

    return themes.slice(0, 4); // Max 4 themes
  }

  /**
   * Generate proof points
   */
  private generateProofPoints(
    academic: AcademicEvaluation,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation
  ): ApplicationBrand['proofPoints'] {
    const proofPoints: ApplicationBrand['proofPoints'] = [];

    // Academic proof points
    if (academic.overallTier === 'exceptional' || academic.overallTier === 'highly_competitive') {
      proofPoints.push({
        claim: 'Academic excellence and intellectual capability',
        evidence: `${academic.overallTier} academic standing with ${academic.gpa.tier} GPA`,
        source: 'academic',
      });
    }

    // Activity proof points
    for (const assessment of activities.activityAssessments.filter(a => a.tier <= 2).slice(0, 2)) {
      proofPoints.push({
        claim: assessment.impactStatement || 'Significant extracurricular achievement',
        evidence: assessment.activityName,
        source: 'activity',
      });
    }

    // Award proof points
    const topAwards = Object.values(awards.awardAssessments)
      .filter(a => ['international', 'national', 'regional'].includes(a.recognitionLevel))
      .slice(0, 2);

    for (const award of topAwards) {
      proofPoints.push({
        claim: award.narrativeValue.proofPoint,
        evidence: award.awardName,
        source: 'award',
      });
    }

    return proofPoints;
  }

  /**
   * Assess brand consistency
   */
  private assessBrandConsistency(
    archetype: ApplicationArchetype,
    academic: AcademicEvaluation,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation
  ): ApplicationBrand['brandConsistency'] {
    const alignedElements: string[] = [];
    const misalignedElements: string[] = [];
    const recommendations: string[] = [];

    // Check alignment between archetype and components
    if (archetype === 'the_researcher') {
      if (activities.spikeAnalysis.spikeArea?.toLowerCase().includes('research')) {
        alignedElements.push('Activities focus on research');
      }
      if (Object.values(awards.awardAssessments).some(a =>
        a.category === 'research_recognition' || a.category === 'science_fair'
      )) {
        alignedElements.push('Awards validate research ability');
      }
      if (academic.overallTier === 'exceptional' || academic.overallTier === 'highly_competitive') {
        alignedElements.push('Strong academics support researcher narrative');
      } else {
        misalignedElements.push('Academic profile could be stronger for researcher brand');
        recommendations.push('Strengthen academic performance to reinforce researcher identity');
      }
    }

    // Check for general consistency
    if (activities.spikeAnalysis.hasClearSpike) {
      const spikeSupported = Object.values(awards.awardAssessments).some(a =>
        a.relevanceToMajor === 'high'
      );
      if (spikeSupported) {
        alignedElements.push('Spike area validated by awards');
      } else {
        misalignedElements.push('Activity spike not supported by awards');
        recommendations.push('Pursue recognition in your spike area to strengthen narrative');
      }
    }

    // Calculate consistency score
    const alignedCount = alignedElements.length;
    const misalignedCount = misalignedElements.length;
    const totalElements = alignedCount + misalignedCount || 1;
    const score = Math.round((alignedCount / totalElements) * 100);

    return {
      score,
      alignedElements,
      misalignedElements,
      recommendations,
    };
  }

  /**
   * Generate archetype justification
   */
  private generateArchetypeJustification(
    archetype: ApplicationArchetype,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation
  ): string {
    if (archetype === 'undefined') {
      return 'No clear archetype emerges from the profile. Consider focusing application narrative around strongest 2-3 themes.';
    }

    const archetypeDescriptions: Record<ApplicationArchetype, string> = {
      the_researcher: 'Profile shows strong research focus with validated achievements in scientific inquiry.',
      the_innovator: 'Profile demonstrates entrepreneurial spirit with tangible ventures and creative problem-solving.',
      the_leader: 'Profile reveals consistent leadership across organizations with demonstrated impact.',
      the_artist: 'Profile showcases artistic dedication with recognized creative achievements.',
      the_athlete: 'Profile centers on athletic achievement at competitive levels.',
      the_advocate: 'Profile emphasizes social impact and advocacy for meaningful causes.',
      the_polymath: 'Profile demonstrates excellence across multiple unrelated domains.',
      the_specialist: 'Profile shows deep expertise and commitment to a focused area.',
      the_builder: 'Profile features hands-on creation and engineering-minded problem solving.',
      the_connector: 'Profile highlights community building and bringing people together.',
      the_overcomer: 'Profile must be understood in context of significant challenges overcome.',
      the_mentor: 'Profile emphasizes teaching, tutoring, and helping others develop.',
      undefined: 'No clear archetype detected.',
    };

    return archetypeDescriptions[archetype];
  }

  // ============================================================================
  // COHERENCE ANALYSIS
  // ============================================================================

  /**
   * Analyze cross-component coherence
   */
  private analyzeCoherence(
    academic: AcademicEvaluation,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    essays: EssayQualitySummary,
    goals: GoalsAspirations
  ): CoherenceAnalysis {
    const alignments: CoherenceAnalysis['alignments'] = [];
    const disconnects: CoherenceAnalysis['disconnects'] = [];
    const consistencyChecks: CoherenceAnalysis['consistencyChecks'] = [];

    // Check academic-activity alignment
    if (academic.overallTier === 'exceptional' || academic.overallTier === 'highly_competitive') {
      if (activities.overallStrength === 'exceptional' || activities.overallStrength === 'competitive') {
        alignments.push({
          components: ['academic', 'activities'],
          alignment: 'Strong academics supported by strong extracurriculars',
          strength: 'strong',
          narrativeValue: 'Profile shows consistent excellence across domains',
        });
      }
    }

    // Check activity-award alignment
    if (activities.spikeAnalysis.hasClearSpike) {
      const spikeAwardSupport = Object.values(awards.awardAssessments).some(
        a => a.relevanceToMajor === 'high'
      );
      if (spikeAwardSupport) {
        alignments.push({
          components: ['activities', 'awards'],
          alignment: 'Activity spike validated by awards',
          strength: 'strong',
          narrativeValue: 'External recognition validates depth of achievement',
        });
      } else {
        disconnects.push({
          components: ['activities', 'awards'],
          disconnect: 'Strong activity focus not reflected in awards',
          severity: 'notable',
          resolution: 'Pursue formal recognition in your area of focus',
        });
      }
    }

    // Check goal alignment
    if (goals.intendedMajor) {
      const activitiesAligned = activities.thematicCoherence.primaryTheme?.toLowerCase().includes(
        goals.intendedMajor.toLowerCase().split(' ')[0]
      ) || false;
      const awardsAligned = Object.values(awards.awardAssessments).some(
        a => a.relevanceToMajor === 'high'
      );

      consistencyChecks.push({
        check: 'Alignment with intended major',
        result: activitiesAligned && awardsAligned ? 'consistent' :
                activitiesAligned || awardsAligned ? 'partially_consistent' : 'inconsistent',
        details: activitiesAligned && awardsAligned
          ? `Both activities and awards support ${goals.intendedMajor} narrative`
          : `Consider strengthening connection to ${goals.intendedMajor} through focused activities and awards`,
      });
    }

    // Calculate coherence score
    const alignmentScore = alignments.reduce((sum, a) =>
      sum + (a.strength === 'strong' ? 20 : a.strength === 'moderate' ? 10 : 5), 0);
    const disconnectPenalty = disconnects.reduce((sum, d) =>
      sum + (d.severity === 'concerning' ? 20 : d.severity === 'notable' ? 10 : 5), 0);
    const overallCoherenceScore = Math.max(0, Math.min(100,
      50 + alignmentScore - disconnectPenalty
    ));

    // Identify narrative thread
    const narrativeThread = this.identifyNarrativeThread(activities, awards, goals);

    // Generate recommendations
    const coherenceRecommendations = this.generateCoherenceRecommendations(
      disconnects, consistencyChecks, goals
    );

    return {
      overallCoherenceScore,
      alignments,
      disconnects,
      narrativeThread,
      consistencyChecks,
      coherenceRecommendations,
    };
  }

  /**
   * Identify narrative thread
   */
  private identifyNarrativeThread(
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    goals: GoalsAspirations
  ): CoherenceAnalysis['narrativeThread'] {
    // Look for common thread
    const hasSpike = activities.spikeAnalysis.hasClearSpike;
    const hasTheme = activities.thematicCoherence.coherenceScore >= 70;

    if (hasSpike && hasTheme) {
      return {
        exists: true,
        thread: `Consistent focus on ${activities.spikeAnalysis.spikeArea}`,
        supportingEvidence: [
          ...activities.spikeAnalysis.supportingActivities.slice(0, 2),
          ...Object.values(awards.awardAssessments)
            .filter(a => a.relevanceToMajor === 'high')
            .map(a => a.awardName)
            .slice(0, 2),
        ],
        gaps: [],
      };
    }

    if (hasSpike || hasTheme) {
      const thread = hasSpike
        ? activities.spikeAnalysis.spikeArea
        : activities.thematicCoherence.primaryTheme;

      return {
        exists: true,
        thread: `Emerging focus on ${thread}`,
        supportingEvidence: activities.spikeAnalysis.supportingActivities.slice(0, 3),
        gaps: ['Could strengthen with more external validation'],
      };
    }

    return {
      exists: false,
      thread: 'No clear narrative thread identified',
      supportingEvidence: [],
      gaps: [
        'Activities lack unifying theme',
        'Consider which interests to emphasize',
        'Awards don\'t reinforce a primary focus',
      ],
    };
  }

  /**
   * Generate coherence recommendations
   */
  private generateCoherenceRecommendations(
    disconnects: CoherenceAnalysis['disconnects'],
    consistencyChecks: CoherenceAnalysis['consistencyChecks'],
    goals: GoalsAspirations
  ): string[] {
    const recommendations: string[] = [];

    // Address disconnects
    for (const disconnect of disconnects.filter(d => d.severity === 'concerning')) {
      recommendations.push(disconnect.resolution);
    }

    // Address inconsistencies
    for (const check of consistencyChecks.filter(c => c.result === 'inconsistent')) {
      recommendations.push(`Address ${check.check.toLowerCase()}: ${check.details}`);
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push(
        'Profile shows good coherence. Focus on strengthening existing narrative in essays.'
      );
    }

    return recommendations;
  }

  // ============================================================================
  // UNIQUE VALUE PROPOSITION
  // ============================================================================

  /**
   * Generate unique value proposition
   */
  private generateUniqueValue(
    academic: AcademicEvaluation,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    brand: ApplicationBrand,
    goals: GoalsAspirations
  ): UniqueValueProposition {
    // Identify primary differentiator
    const primaryDifferentiator = this.identifyPrimaryDifferentiator(
      activities, awards, brand
    );

    // Identify supporting elements
    const supportingElements = this.identifySupportingElements(
      academic, activities, awards
    );

    // Identify competitive advantages
    const competitiveAdvantages = this.identifyCompetitiveAdvantages(
      activities, awards, goals
    );

    // Identify vulnerabilities
    const vulnerabilities = this.identifyVulnerabilities(
      academic, activities, awards
    );

    // Generate unique combination
    const uniqueCombination = this.generateUniqueCombination(
      primaryDifferentiator, supportingElements, brand
    );

    return {
      primaryDifferentiator,
      supportingElements,
      competitiveAdvantages,
      vulnerabilities,
      uniqueCombination,
    };
  }

  /**
   * Identify primary differentiator
   */
  private identifyPrimaryDifferentiator(
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    brand: ApplicationBrand
  ): UniqueValueProposition['primaryDifferentiator'] {
    // Check for exceptional spike
    if (activities.spikeAnalysis.hasClearSpike &&
        activities.spikeAnalysis.spikeStrength === 'national_level') {
      return {
        what: `National-level achievement in ${activities.spikeAnalysis.spikeArea}`,
        evidence: activities.spikeAnalysis.supportingActivities,
        rarity: 'very_rare',
        strength: 95,
      };
    }

    // Check for major awards
    if (awards.distribution.summary.tier1Awards >= 1) {
      const topAward = Object.values(awards.awardAssessments)
        .find(a => ['international', 'national'].includes(a.recognitionLevel));
      if (topAward) {
        return {
          what: topAward.awardName,
          evidence: [topAward.competitiveContext],
          rarity: 'rare',
          strength: 90,
        };
      }
    }

    // Check for clear archetype
    if (brand.primaryArchetype !== 'undefined' && brand.archetypeConfidence >= 70) {
      return {
        what: `Clear "${brand.primaryArchetype.replace('the_', '').replace('_', ' ')}" profile`,
        evidence: brand.proofPoints.slice(0, 3).map(p => p.evidence),
        rarity: 'uncommon',
        strength: 75,
      };
    }

    // Default to spike if exists
    if (activities.spikeAnalysis.hasClearSpike) {
      return {
        what: `Focused expertise in ${activities.spikeAnalysis.spikeArea}`,
        evidence: activities.spikeAnalysis.supportingActivities,
        rarity: 'uncommon',
        strength: 65,
      };
    }

    // Fallback
    return {
      what: 'Developing unique profile',
      evidence: [],
      rarity: 'common',
      strength: 40,
    };
  }

  /**
   * Identify supporting elements
   */
  private identifySupportingElements(
    academic: AcademicEvaluation,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation
  ): UniqueValueProposition['supportingElements'] {
    const elements: UniqueValueProposition['supportingElements'] = [];

    // Academic support
    if (academic.overallTier === 'exceptional' || academic.overallTier === 'highly_competitive') {
      elements.push({
        element: 'Strong academic foundation',
        evidence: `${academic.overallTier} academics with ${academic.gpa.tier} GPA`,
        howItSupports: 'Demonstrates intellectual capability to succeed in rigorous programs',
      });
    }

    // Leadership support
    if (activities.leadershipAnalysis.leadershipProfile !== 'none' &&
        activities.leadershipAnalysis.leadershipProfile !== 'developing_leader') {
      elements.push({
        element: 'Demonstrated leadership',
        evidence: activities.leadershipAnalysis.keyLeadershipRoles.join(', '),
        howItSupports: 'Shows ability to organize, motivate, and create impact through others',
      });
    }

    // Award validation
    if (awards.overallStrength === 'exceptional' || awards.overallStrength === 'strong') {
      elements.push({
        element: 'External validation through awards',
        evidence: awards.highlights.mostImpressive.award.awardName,
        howItSupports: 'Provides independent confirmation of achievement claims',
      });
    }

    return elements;
  }

  /**
   * Identify competitive advantages
   */
  private identifyCompetitiveAdvantages(
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    goals: GoalsAspirations
  ): UniqueValueProposition['competitiveAdvantages'] {
    const advantages: UniqueValueProposition['competitiveAdvantages'] = [];

    // Spike advantage
    if (activities.spikeAnalysis.hasClearSpike) {
      advantages.push({
        advantage: `Depth in ${activities.spikeAnalysis.spikeArea}`,
        context: 'Applications to programs valuing focused expertise',
        schools: ['Schools strong in this area'],
      });
    }

    // Leadership advantage
    if (activities.leadershipAnalysis.leadershipProfile === 'strong_leader' ||
        activities.leadershipAnalysis.leadershipProfile === 'organizational_leader') {
      advantages.push({
        advantage: 'Proven leadership capability',
        context: 'Schools seeking students who will contribute to campus life',
        schools: ['Schools valuing campus leadership'],
      });
    }

    // Research advantage
    if (Object.values(awards.awardAssessments).some(
      a => a.category === 'research_recognition' || a.category === 'science_fair'
    )) {
      advantages.push({
        advantage: 'Research experience and recognition',
        context: 'Applications to research universities',
        schools: ['MIT', 'Stanford', 'Caltech', 'research-focused schools'],
      });
    }

    return advantages;
  }

  /**
   * Identify vulnerabilities
   */
  private identifyVulnerabilities(
    academic: AcademicEvaluation,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation
  ): UniqueValueProposition['vulnerabilities'] {
    const vulnerabilities: UniqueValueProposition['vulnerabilities'] = [];

    // Academic vulnerability
    if (academic.overallTier === 'developing' || academic.overallTier === 'needs_improvement') {
      vulnerabilities.push({
        vulnerability: 'Academic profile below typical competitive applicants',
        severity: 'significant',
        mitigation: 'Emphasize upward trend, rigor of courses, and extracurricular excellence',
      });
    }

    // Award vulnerability
    if (awards.overallStrength === 'needs_work' || awards.distribution.summary.totalAwards < 3) {
      vulnerabilities.push({
        vulnerability: 'Limited external validation through awards',
        severity: 'moderate',
        mitigation: 'Pursue recognition opportunities; emphasize quality of achievements in essays',
      });
    }

    // Focus vulnerability
    if (!activities.spikeAnalysis.hasClearSpike &&
        activities.thematicCoherence.coherenceScore < 50) {
      vulnerabilities.push({
        vulnerability: 'Lack of clear focus or narrative',
        severity: 'significant',
        mitigation: 'Use essays to create narrative coherence around key themes',
      });
    }

    return vulnerabilities;
  }

  /**
   * Generate unique combination
   */
  private generateUniqueCombination(
    differentiator: UniqueValueProposition['primaryDifferentiator'],
    supportingElements: UniqueValueProposition['supportingElements'],
    brand: ApplicationBrand
  ): UniqueValueProposition['uniqueCombination'] {
    const elements = [
      differentiator.what,
      ...supportingElements.slice(0, 2).map(e => e.element),
    ];

    let rarity = 'uncommon';
    if (differentiator.rarity === 'very_rare' && supportingElements.length >= 2) {
      rarity = 'This combination is rare among applicants';
    } else if (differentiator.rarity === 'rare') {
      rarity = 'This combination distinguishes from typical applicants';
    } else {
      rarity = 'Profile needs further differentiation';
    }

    return {
      elements,
      narrative: brand.coreNarrative.elevatorPitch,
      rarity,
    };
  }

  // ============================================================================
  // STRENGTHS AND CONCERNS
  // ============================================================================

  /**
   * Synthesize strengths and concerns
   */
  private synthesizeStrengthsAndConcerns(
    academic: AcademicEvaluation,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    essays: EssayQualitySummary
  ): HolisticProfileSynthesis['strengthsAndConcerns'] {
    const majorStrengths: HolisticProfileSynthesis['strengthsAndConcerns']['majorStrengths'] = [];
    const minorStrengths: string[] = [];
    const majorConcerns: HolisticProfileSynthesis['strengthsAndConcerns']['majorConcerns'] = [];
    const minorConcerns: string[] = [];

    // Academic strengths/concerns
    if (academic.overallTier === 'exceptional' || academic.overallTier === 'highly_competitive') {
      majorStrengths.push({
        strength: 'Strong academic foundation',
        evidence: [
          `${academic.gpa.tier} GPA`,
          `${academic.courseRigor.rigorLevel} course rigor`,
        ],
        impactOnAdmissions: 'Meets or exceeds academic threshold for competitive schools',
      });
    } else if (academic.overallTier === 'needs_improvement') {
      majorConcerns.push({
        concern: 'Academic profile needs strengthening',
        severity: 'significant',
        mitigation: 'Focus on grade improvement and course rigor; highlight context if applicable',
      });
    }

    // Activity strengths/concerns
    if (activities.spikeAnalysis.hasClearSpike) {
      majorStrengths.push({
        strength: `Clear spike in ${activities.spikeAnalysis.spikeArea}`,
        evidence: activities.spikeAnalysis.supportingActivities.slice(0, 3),
        impactOnAdmissions: 'Provides memorable differentiator and demonstrates depth',
      });
    } else {
      minorConcerns.push('No clear extracurricular spike - consider deepening focus');
    }

    if (activities.leadershipAnalysis.leadershipProfile === 'strong_leader') {
      minorStrengths.push('Strong leadership presence across activities');
    }

    // Award strengths/concerns
    if (awards.distribution.summary.tier1Awards >= 1) {
      majorStrengths.push({
        strength: 'National/International recognition',
        evidence: [awards.highlights.mostImpressive.award.awardName],
        impactOnAdmissions: 'Provides external validation at highest level',
      });
    } else if (awards.distribution.summary.totalAwards < 3) {
      minorConcerns.push('Limited formal recognition - pursue award opportunities');
    }

    return {
      majorStrengths,
      minorStrengths,
      majorConcerns,
      minorConcerns,
    };
  }

  // ============================================================================
  // COMPETITIVE POSITIONING
  // ============================================================================

  /**
   * Generate competitive positioning
   */
  private generateCompetitivePositioning(
    academic: AcademicEvaluation,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    brand: ApplicationBrand,
    tier: ProfileTier
  ): HolisticProfileSynthesis['competitivePositioning'] {
    // Identify strongest areas
    const strongestAreas: string[] = [];
    const weakestAreas: string[] = [];

    if (academic.overallTier === 'exceptional' || academic.overallTier === 'highly_competitive') {
      strongestAreas.push('Academics');
    } else if (academic.overallTier === 'needs_improvement' || academic.overallTier === 'developing') {
      weakestAreas.push('Academics');
    }

    if (activities.overallStrength === 'exceptional' || activities.overallStrength === 'competitive') {
      strongestAreas.push('Extracurricular activities');
    } else if (activities.overallStrength === 'needs_work') {
      weakestAreas.push('Extracurricular activities');
    }

    if (awards.overallStrength === 'exceptional' || awards.overallStrength === 'strong') {
      strongestAreas.push('Awards and recognition');
    } else if (awards.overallStrength === 'needs_work') {
      weakestAreas.push('Awards and recognition');
    }

    // Identify differentiators
    const differentiators: string[] = [];
    if (activities.spikeAnalysis.hasClearSpike) {
      differentiators.push(`Deep expertise in ${activities.spikeAnalysis.spikeArea}`);
    }
    if (brand.primaryArchetype !== 'undefined') {
      differentiators.push(`Clear "${brand.primaryArchetype.replace('the_', '').replace('_', ' ')}" identity`);
    }
    if (awards.distribution.summary.tier1Awards >= 1) {
      differentiators.push('National/international level recognition');
    }

    // Identify risk factors
    const riskFactors: string[] = [];
    if (weakestAreas.length >= 2) {
      riskFactors.push('Multiple weak areas may limit competitiveness');
    }
    if (!activities.spikeAnalysis.hasClearSpike && !activities.thematicCoherence.primaryTheme) {
      riskFactors.push('Lack of clear narrative focus');
    }
    if (brand.brandConsistency.score < 50) {
      riskFactors.push('Inconsistent application narrative');
    }

    // Generate overall assessment
    const overallAssessment = this.generateOverallAssessment(tier, strongestAreas, weakestAreas);

    return {
      strongestAreas,
      weakestAreas,
      differentiators,
      riskFactors,
      overallAssessment,
    };
  }

  /**
   * Generate overall assessment
   */
  private generateOverallAssessment(
    tier: ProfileTier,
    strongestAreas: string[],
    weakestAreas: string[]
  ): string {
    const assessments: Record<ProfileTier, string> = {
      exceptional: `Profile is competitive at any school. ${strongestAreas.join(' and ')} provide foundation; focus on school fit and essay quality.`,
      highly_competitive: `Strong profile competitive for T20. Lead with ${strongestAreas[0] || 'strengths'}; address ${weakestAreas[0] || 'any gaps'} through strategic presentation.`,
      competitive: `Competitive profile for T30-50 schools. ${weakestAreas.length > 0 ? `Work on ${weakestAreas.join(' and ')} while ` : ''}emphasizing unique qualities.`,
      developing: `Profile needs development for competitive admissions. Focus on strengthening ${weakestAreas.join(' and ')} before application season.`,
      building: `Significant work needed. Prioritize ${weakestAreas[0] || 'core areas'} and develop clear extracurricular focus.`,
    };

    return assessments[tier];
  }

  // ============================================================================
  // STRATEGY INSIGHTS
  // ============================================================================

  /**
   * Generate strategy insights
   */
  private generateStrategyInsights(
    strengthsAndConcerns: HolisticProfileSynthesis['strengthsAndConcerns'],
    positioning: HolisticProfileSynthesis['competitivePositioning'],
    goals: GoalsAspirations,
    tier: ProfileTier
  ): HolisticProfileSynthesis['strategyInsights'] {
    // Play to strengths
    const playToStrengths = strengthsAndConcerns.majorStrengths.map(
      s => `Emphasize ${s.strength.toLowerCase()} in application materials`
    );

    // Address weaknesses
    const addressWeaknesses = strengthsAndConcerns.majorConcerns.map(
      c => c.mitigation
    );

    // Narrative focus
    const narrativeFocus = positioning.differentiators.length > 0
      ? `Center application narrative around ${positioning.differentiators[0].toLowerCase()}`
      : 'Develop clear narrative focus through essay brainstorming';

    // School type recommendations
    const schoolTypeRecommendations = this.generateSchoolTypeRecommendations(tier, goals);

    return {
      playToStrengths,
      addressWeaknesses,
      narrativeFocus,
      schoolTypeRecommendations,
    };
  }

  /**
   * Generate school type recommendations
   */
  private generateSchoolTypeRecommendations(tier: ProfileTier, goals: GoalsAspirations): string {
    const recommendations: Record<ProfileTier, string> = {
      exceptional: 'Profile supports applications to any school including most selective. Include 2-3 reaches, 3-4 targets, 2 safeties.',
      highly_competitive: 'Strong fit for T20-30 schools. Include 3-4 reaches, 4-5 targets, 2-3 safeties.',
      competitive: 'Best positioned for T30-50 schools. Include 2-3 ambitious reaches, 5-6 targets, 2-3 safeties.',
      developing: 'Focus on match and safety schools with 1-2 reaches. Prioritize schools where you exceed the median.',
      building: 'Build strong safety list and realistic targets. Consider gap year if significant improvement needed.',
    };

    let rec = recommendations[tier];

    // Add financial aid consideration
    if (goals.financialAidNeed === 'high') {
      rec += ' Prioritize schools meeting full demonstrated need.';
    }

    return rec;
  }

  // ============================================================================
  // PROFILE NARRATIVE
  // ============================================================================

  /**
   * Generate profile narrative
   */
  private generateProfileNarrative(
    tier: ProfileTier,
    brand: ApplicationBrand,
    strengthsAndConcerns: HolisticProfileSynthesis['strengthsAndConcerns'],
    positioning: HolisticProfileSynthesis['competitivePositioning']
  ): string {
    const paragraphs: string[] = [];

    // Opening summary
    paragraphs.push(brand.coreNarrative.fullNarrative);

    // Strengths paragraph
    if (strengthsAndConcerns.majorStrengths.length > 0) {
      const strengthsNarrative = `Key strengths include ${strengthsAndConcerns.majorStrengths
        .map(s => s.strength.toLowerCase())
        .join(', ')}. ${strengthsAndConcerns.majorStrengths[0].impactOnAdmissions}`;
      paragraphs.push(strengthsNarrative);
    }

    // Areas for growth
    if (strengthsAndConcerns.majorConcerns.length > 0) {
      const concernsNarrative = `Areas to address: ${strengthsAndConcerns.majorConcerns
        .map(c => c.concern.toLowerCase())
        .join('; ')}. ${strengthsAndConcerns.majorConcerns[0].mitigation}`;
      paragraphs.push(concernsNarrative);
    }

    return paragraphs.join('\n\n');
  }

  // ============================================================================
  // CONFIDENCE CALCULATION
  // ============================================================================

  /**
   * Calculate confidence score
   */
  private calculateConfidenceScore(
    academic: AcademicEvaluation,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    essays: EssayQualitySummary
  ): number {
    const factors = {
      dataCompleteness: this.assessDataCompleteness(academic, activities, awards, essays),
      knownAwardCoverage: awards.confidenceScore || 0.8,
      consistentData: 0.85,
    };

    return calculateConfidence(factors);
  }

  /**
   * Assess data completeness
   */
  private assessDataCompleteness(
    academic: AcademicEvaluation,
    activities: ActivityPortfolioAnalysis,
    awards: AwardEvaluation,
    essays: EssayQualitySummary
  ): number {
    let completeness = 0;

    // Academic data
    if (academic.confidenceScore > 0.8) completeness += 0.25;
    else if (academic.confidenceScore > 0.6) completeness += 0.15;
    else completeness += 0.1;

    // Activity data
    if (activities.confidenceScore > 0.8) completeness += 0.25;
    else if (activities.confidenceScore > 0.6) completeness += 0.15;
    else completeness += 0.1;

    // Awards data
    if (awards.confidenceScore > 0.8) completeness += 0.25;
    else if (awards.confidenceScore > 0.6) completeness += 0.15;
    else completeness += 0.1;

    // Essay data
    if (essays.hasEssayAnalysis) completeness += 0.25;
    else completeness += 0.1;

    return completeness;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const holisticSynthesizer = new HolisticSynthesizer();
