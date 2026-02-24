// @ts-nocheck
/**
 * Enhanced Award Evaluator
 *
 * Integrates tier classification, authenticity detection, and research-backed
 * insights into a comprehensive award analysis system.
 *
 * Architecture follows PIQ workshop pattern:
 * - Phase 1: Tier Classification (parallel per-award)
 * - Phase 2: Authenticity Detection (parallel per-award)
 * - Phase 3: Context & School-Specific Analysis
 * - Phase 4: Portfolio Synthesis & Recommendations
 *
 * @module enhancedAwardEvaluator
 */

import { AwardCategory, CommonAppHonorLevel } from '../types/awards';
import {
  AwardTier,
  EnhancedAwardInput,
  EnhancedAwardsInput,
  EnhancedAwardAssessment,
  EnhancedAwardEvaluation,
  AwardPortfolioPatterns,
  AwardContextAssessment,
  AwardAuthenticityAssessment,
  ResearchCitation,
  ResearchBackedInsight,
  SCHOOL_AWARD_PREFERENCES,
  TIER_POINTS,
} from '../types/awardsEnhanced';
import { awardKnowledgeBase } from '../knowledge/awardKnowledgeBase';
import { awardTierEngine } from './awardTierEngine';
import { awardAuthenticityEngine } from './awardAuthenticityEngine';

// ============================================================================
// ENHANCED AWARD EVALUATOR
// ============================================================================

/**
 * Enhanced Award Evaluator Service
 */
export class EnhancedAwardEvaluator {
  constructor() {}

  // ============================================================================
  // MAIN EVALUATION METHOD
  // ============================================================================

  /**
   * Perform comprehensive award evaluation
   */
  async evaluate(input: EnhancedAwardsInput): Promise<EnhancedAwardEvaluation> {
    const startTime = Date.now();

    // Phase 1: Tier Classification (parallel)
    const tierClassifications = this.runTierClassification(input);

    // Phase 2: Authenticity Detection (parallel)
    const authenticityAssessments = this.runAuthenticityDetection(input);

    // Phase 3: Build Individual Award Assessments
    const awardAssessments = this.buildAwardAssessments(
      input,
      tierClassifications,
      authenticityAssessments
    );

    // Phase 4: Portfolio Pattern Analysis
    const portfolioPatterns = this.analyzePortfolioPatterns(input, awardAssessments);

    // Phase 5: School-Specific Evaluation
    const schoolSpecificEvaluation = this.evaluateForSchools(
      input,
      awardAssessments,
      input.targetSchools
    );

    // Phase 6: Synthesize Results
    const evaluation = this.synthesizeEvaluation(
      input,
      awardAssessments,
      portfolioPatterns,
      schoolSpecificEvaluation,
      authenticityAssessments
    );

    return evaluation;
  }

  // ============================================================================
  // PHASE 1: TIER CLASSIFICATION
  // ============================================================================

  /**
   * Run tier classification for all awards
   */
  private runTierClassification(input: EnhancedAwardsInput): Map<string, AwardContextAssessment> {
    return awardTierEngine.classifyAwards(input.awards, {
      state: input.studentContext.state,
      isFirstGen: input.studentContext.isFirstGen,
      isLowIncome: input.studentContext.isLowIncome,
      isRural: input.studentContext.isRural,
    });
  }

  // ============================================================================
  // PHASE 2: AUTHENTICITY DETECTION
  // ============================================================================

  /**
   * Run authenticity detection for all awards
   */
  private runAuthenticityDetection(
    input: EnhancedAwardsInput
  ): Map<string, AwardAuthenticityAssessment> {
    const assessments = new Map<string, AwardAuthenticityAssessment>();

    for (const award of input.awards) {
      const assessment = awardAuthenticityEngine.assessAuthenticity(
        award,
        input.relatedActivities || [],
        input.awards
      );
      assessments.set(award.id, assessment);
    }

    return assessments;
  }

  // ============================================================================
  // PHASE 3: BUILD INDIVIDUAL ASSESSMENTS
  // ============================================================================

  /**
   * Build comprehensive assessment for each award
   */
  private buildAwardAssessments(
    input: EnhancedAwardsInput,
    tierClassifications: Map<string, AwardContextAssessment>,
    authenticityAssessments: Map<string, AwardAuthenticityAssessment>
  ): Map<string, EnhancedAwardAssessment> {
    const assessments = new Map<string, EnhancedAwardAssessment>();

    for (const award of input.awards) {
      const tierContext = tierClassifications.get(award.id)!;
      const authenticity = authenticityAssessments.get(award.id)!;

      const assessment = this.buildSingleAwardAssessment(
        award,
        tierContext,
        authenticity,
        input.studentContext.intendedMajor,
        input.targetSchools
      );

      assessments.set(award.id, assessment);
    }

    return assessments;
  }

  /**
   * Build assessment for a single award
   */
  private buildSingleAwardAssessment(
    award: EnhancedAwardInput,
    tierContext: AwardContextAssessment,
    authenticity: AwardAuthenticityAssessment,
    intendedMajor?: string,
    targetSchools?: string[]
  ): EnhancedAwardAssessment {
    const knownAward = awardKnowledgeBase.lookupAward(award.name);

    // Calculate selectivity score
    const selectivityScore = this.calculateSelectivityScore(tierContext.effectiveTier);

    // Determine relevance to major
    const relevanceInfo = this.assessRelevanceToMajor(award, intendedMajor);

    // Assess narrative value
    const narrativeValue = this.assessNarrativeValue(award, tierContext.effectiveTier);

    // Build Common App optimization
    const commonAppOptimization = this.buildCommonAppOptimization(
      award,
      tierContext.effectiveTier,
      knownAward
    );

    // Calculate school-specific scores
    const schoolSpecificScores = this.calculateSchoolScores(award, tierContext, targetSchools);

    // Get research insights
    const researchInsights = this.getResearchInsights(award, tierContext);

    // Determine admissions impact
    const admissionsImpact = awardTierEngine.getAdmissionsImpact(tierContext.effectiveTier);

    const tierLabels: Record<AwardTier, 'exceptional' | 'outstanding' | 'strong' | 'baseline'> = {
      1: 'exceptional',
      2: 'outstanding',
      3: 'strong',
      4: 'baseline',
    };

    return {
      // Base assessment fields
      awardId: award.id,
      awardName: award.name,
      category: award.category,
      recognitionLevel: award.recognitionLevel,
      selectivity: this.tierToSelectivity(tierContext.effectiveTier),
      selectivityScore,
      relevanceToMajor: relevanceInfo.relevance,
      relevanceExplanation: relevanceInfo.explanation,
      narrativeValue,
      commonAppOptimization,
      competitiveContext: this.generateCompetitiveContext(tierContext, knownAward),
      admissionsImpact: admissionsImpact.impact,

      // Enhanced fields
      tier: tierContext.effectiveTier,
      tierLabel: tierLabels[tierContext.effectiveTier],
      tierPoints: TIER_POINTS[tierContext.effectiveTier],
      contextAssessment: tierContext,
      authenticityAssessment: authenticity,
      schoolSpecificScores,
      researchInsights,
    };
  }

  /**
   * Calculate selectivity score from tier
   */
  private calculateSelectivityScore(tier: AwardTier): number {
    const tierScores: Record<AwardTier, number> = {
      1: 95,
      2: 75,
      3: 55,
      4: 30,
    };
    return tierScores[tier];
  }

  /**
   * Convert tier to selectivity category
   */
  private tierToSelectivity(
    tier: AwardTier
  ): 'highly_selective' | 'selective' | 'competitive' | 'merit_based' | 'participation' {
    const mapping: Record<
      AwardTier,
      'highly_selective' | 'selective' | 'competitive' | 'merit_based' | 'participation'
    > = {
      1: 'highly_selective',
      2: 'selective',
      3: 'competitive',
      4: 'merit_based',
    };
    return mapping[tier];
  }

  /**
   * Assess relevance to intended major
   */
  private assessRelevanceToMajor(
    award: EnhancedAwardInput,
    intendedMajor?: string
  ): { relevance: 'high' | 'medium' | 'low' | 'not_applicable'; explanation: string } {
    if (!intendedMajor) {
      return { relevance: 'not_applicable', explanation: 'No intended major specified' };
    }

    const majorLower = intendedMajor.toLowerCase();
    const categoryMajorMap: Record<AwardCategory, string[]> = {
      academic_olympiad: ['math', 'physics', 'chemistry', 'biology', 'computer', 'science'],
      academic_competition: ['academic', 'stem'],
      science_fair: ['science', 'research', 'biology', 'chemistry', 'physics', 'engineering'],
      research_recognition: ['research', 'science', 'engineering', 'biology', 'chemistry', 'physics'],
      standardized_test: [], // Relevant to all
      academic_honor: [], // Relevant to all
      scholarship: [], // Relevant to all
      arts_competition: ['art', 'music', 'theater', 'design', 'creative', 'film'],
      athletic: ['sports', 'physical', 'kinesiology'],
      leadership: ['business', 'management', 'public policy', 'political'],
      community_service: ['social', 'public', 'non-profit', 'social work'],
      entrepreneurship: ['business', 'entrepreneurship', 'economics', 'management'],
      debate_speech: ['law', 'political', 'communications', 'public policy'],
      journalism_writing: ['journalism', 'communications', 'english', 'writing', 'media'],
      stem_competition: ['engineering', 'computer', 'robotics', 'tech'],
      summer_program_selection: [], // Depends on program
      other: [],
    };

    const relevantMajors = categoryMajorMap[award.category] || [];

    if (relevantMajors.length === 0) {
      return { relevance: 'medium', explanation: 'General academic achievement applicable to all fields' };
    }

    const isHighlyRelevant = relevantMajors.some((major) => majorLower.includes(major));
    if (isHighlyRelevant) {
      return {
        relevance: 'high',
        explanation: `Directly supports ${intendedMajor} application with relevant achievement`,
      };
    }

    return {
      relevance: 'low',
      explanation: `Award category (${award.category}) not directly related to ${intendedMajor}`,
    };
  }

  /**
   * Assess narrative value of an award
   */
  private assessNarrativeValue(
    award: EnhancedAwardInput,
    tier: AwardTier
  ): {
    storytellingPotential: 'high' | 'medium' | 'low';
    uniqueness: 'very_unique' | 'somewhat_unique' | 'common';
    proofPoint: string;
  } {
    // Higher tier = better story potential
    const storytellingPotential: 'high' | 'medium' | 'low' =
      tier === 1 ? 'high' : tier === 2 ? 'medium' : 'low';

    // Uniqueness based on category and tier
    const commonCategories: AwardCategory[] = ['academic_honor', 'standardized_test'];
    const uniqueness: 'very_unique' | 'somewhat_unique' | 'common' =
      tier === 1
        ? 'very_unique'
        : commonCategories.includes(award.category)
          ? 'common'
          : 'somewhat_unique';

    // Generate proof point
    const proofPoints: Record<AwardCategory, string> = {
      academic_olympiad: 'exceptional problem-solving and intellectual depth',
      academic_competition: 'competitive academic excellence',
      science_fair: 'original research ability and scientific inquiry',
      research_recognition: 'research capability and scientific potential',
      standardized_test: 'strong academic fundamentals',
      academic_honor: 'consistent academic achievement',
      scholarship: 'recognized merit and potential',
      arts_competition: 'creative talent and artistic vision',
      athletic: 'discipline, teamwork, and physical excellence',
      leadership: 'ability to lead and inspire others',
      community_service: 'commitment to serving others',
      entrepreneurship: 'innovation and initiative',
      debate_speech: 'communication and critical thinking skills',
      journalism_writing: 'writing ability and storytelling',
      stem_competition: 'technical skills and problem-solving',
      summer_program_selection: 'recognized potential by selective programs',
      other: 'notable achievement',
    };

    return {
      storytellingPotential,
      uniqueness,
      proofPoint: `Demonstrates ${proofPoints[award.category]}`,
    };
  }

  /**
   * Build Common App honors optimization
   */
  private buildCommonAppOptimization(
    award: EnhancedAwardInput,
    tier: AwardTier,
    knownAward: import('../types/awardsEnhanced').EnhancedKnownAwardProfile | null
  ): EnhancedAwardAssessment['commonAppOptimization'] {
    // Determine suggested level
    const levelMapping: Record<AwardTier, CommonAppHonorLevel> = {
      1: 'international',
      2: 'national',
      3: 'state_regional',
      4: 'school',
    };
    const suggestedLevel =
      knownAward?.suggestedLevel || levelMapping[tier] || levelMapping[award.recognitionLevel === 'international' ? 1 : tier];

    // Generate optimized description (max 100 chars)
    const optimizedDescription = knownAward?.suggestedDescription || this.generateOptimizedDescription(award, tier);

    // Determine if should include
    const shouldInclude = tier <= 3 || award.category !== 'academic_honor';

    // Calculate priority rank (lower tier = higher priority)
    const priorityRank = tier;

    return {
      suggestedLevel,
      optimizedDescription: optimizedDescription.substring(0, 100),
      shouldInclude,
      priorityRank,
    };
  }

  /**
   * Generate optimized description for Common App
   */
  private generateOptimizedDescription(award: EnhancedAwardInput, tier: AwardTier): string {
    const name = award.name;
    const placement = award.specificPlacement;

    if (placement) {
      return `${placement}, ${name}`;
    }

    if (award.selectivityInfo) {
      return `${name} (${award.selectivityInfo})`;
    }

    return name;
  }

  /**
   * Generate competitive context description
   */
  private generateCompetitiveContext(
    tierContext: AwardContextAssessment,
    knownAward: import('../types/awardsEnhanced').EnhancedKnownAwardProfile | null
  ): string {
    if (knownAward) {
      return knownAward.howAdmissionsViewIt;
    }

    const tierDescriptions: Record<AwardTier, string> = {
      1: 'Elite achievement that significantly differentiates the applicant. Among the most impressive credentials at this level.',
      2: 'Strong achievement demonstrating excellence. Competitive among top applicants.',
      3: 'Solid achievement supporting application narrative. Expected among competitive applicants.',
      4: 'Baseline achievement. Confirms participation but does not differentiate.',
    };

    return tierDescriptions[tierContext.effectiveTier];
  }

  /**
   * Calculate school-specific scores
   */
  private calculateSchoolScores(
    award: EnhancedAwardInput,
    tierContext: AwardContextAssessment,
    targetSchools?: string[]
  ): Record<string, { score: number; explanation: string }> {
    const scores: Record<string, { score: number; explanation: string }> = {};
    const schools = targetSchools || SCHOOL_AWARD_PREFERENCES.map((s) => s.schoolId);

    for (const schoolId of schools) {
      const prefs = SCHOOL_AWARD_PREFERENCES.find((s) => s.schoolId === schoolId);
      if (!prefs) continue;

      const categoryValue = prefs.categoryPreferences[award.category] || 3;
      const baseScore = (5 - tierContext.effectiveTier) * 20 + 20; // 20-80 based on tier
      const adjustedScore = Math.min(100, baseScore * (categoryValue / 3));

      const isHighValue = prefs.highValueAwards.some(
        (hv) => award.name.toLowerCase().includes(hv.toLowerCase())
      );

      scores[schoolId] = {
        score: isHighValue ? Math.min(100, adjustedScore + 15) : adjustedScore,
        explanation: isHighValue
          ? `Particularly valued at ${prefs.schoolName}`
          : `${prefs.schoolName} ${categoryValue >= 4 ? 'values' : categoryValue >= 3 ? 'moderately values' : 'places less emphasis on'} ${award.category} awards`,
      };
    }

    return scores;
  }

  /**
   * Get research-backed insights for an award
   */
  private getResearchInsights(
    award: EnhancedAwardInput,
    tierContext: AwardContextAssessment
  ): ResearchBackedInsight[] {
    const insights: ResearchBackedInsight[] = [];

    // Tier-based insight
    if (tierContext.effectiveTier === 1) {
      insights.push({
        insight: 'Tier 1 awards can "tip" borderline applications from competitive to admit.',
        confidence: 'high',
        citations: [awardKnowledgeBase.generateCitation('2.1', 'Admissions Impact')],
        applicability: ['tier_assessment', 'competitive_context'],
      });
    }

    // Category-specific insights
    const categoryInsight = awardKnowledgeBase.getInsight(award.category);
    if (categoryInsight) {
      insights.push(categoryInsight);
    }

    return insights;
  }

  // ============================================================================
  // PHASE 4: PORTFOLIO PATTERN ANALYSIS
  // ============================================================================

  /**
   * Analyze patterns across the award portfolio
   */
  private analyzePortfolioPatterns(
    input: EnhancedAwardsInput,
    assessments: Map<string, EnhancedAwardAssessment>
  ): AwardPortfolioPatterns {
    const thematicCoherence = this.analyzeThematicCoherence(input, assessments);
    const paddingIndicators = this.detectPadding(assessments);
    const trajectory = this.analyzeTrajectory(input.awards, assessments);
    const spikeAlignment = this.analyzeSpikeAlignment(input, assessments);

    return {
      thematicCoherence,
      paddingIndicators,
      paddingRisk: this.calculatePaddingRisk(paddingIndicators),
      trajectory,
      spikeAlignment,
    };
  }

  /**
   * Analyze thematic coherence across awards
   */
  private analyzeThematicCoherence(
    input: EnhancedAwardsInput,
    assessments: Map<string, EnhancedAwardAssessment>
  ): AwardPortfolioPatterns['thematicCoherence'] {
    // Count awards by category
    const categoryCounts: Record<string, number> = {};
    for (const [, assessment] of assessments) {
      categoryCounts[assessment.category] = (categoryCounts[assessment.category] || 0) + 1;
    }

    // Find primary theme
    const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    const primaryTheme = sortedCategories[0]?.[0] || 'mixed';
    const supportingThemes = sortedCategories.slice(1, 3).map(([cat]) => cat);

    // Find disconnected awards (categories with only 1 award that don't align)
    const disconnectedAwards: string[] = [];
    const primaryCategories = new Set([primaryTheme, ...supportingThemes]);

    for (const [id, assessment] of assessments) {
      if (!primaryCategories.has(assessment.category) && categoryCounts[assessment.category] === 1) {
        disconnectedAwards.push(id);
      }
    }

    // Calculate coherence score
    const totalAwards = assessments.size;
    const coherentAwards = totalAwards - disconnectedAwards.length;
    const score = totalAwards > 0 ? (coherentAwards / totalAwards) * 100 : 0;

    return {
      score,
      primaryTheme,
      supportingThemes,
      disconnectedAwards,
      explanation:
        score >= 80
          ? 'Awards demonstrate strong thematic coherence'
          : score >= 60
            ? 'Awards show moderate thematic alignment with some diversity'
            : 'Awards are scattered across many categories without clear focus',
    };
  }

  /**
   * Detect potential padding patterns
   */
  private detectPadding(
    assessments: Map<string, EnhancedAwardAssessment>
  ): AwardPortfolioPatterns['paddingIndicators'] {
    let tier4Count = 0;
    let totalCount = 0;

    for (const assessment of assessments.values()) {
      totalCount++;
      if (assessment.tier === 4) tier4Count++;
    }

    const lowTierOverload = totalCount > 3 && tier4Count / totalCount > 0.6;
    const quantityOverQuality = totalCount >= 8 && tier4Count >= 5;
    const lacksDepth = totalCount >= 5 && !Array.from(assessments.values()).some((a) => a.tier <= 2);

    return {
      lowTierOverload,
      quantityOverQuality,
      lacksDepth,
      suspiciousPattern: lowTierOverload && quantityOverQuality,
    };
  }

  /**
   * Calculate padding risk level
   */
  private calculatePaddingRisk(
    indicators: AwardPortfolioPatterns['paddingIndicators']
  ): 'none' | 'low' | 'medium' | 'high' {
    const activeIndicators = Object.values(indicators).filter(Boolean).length;
    if (activeIndicators >= 3) return 'high';
    if (activeIndicators >= 2) return 'medium';
    if (activeIndicators >= 1) return 'low';
    return 'none';
  }

  /**
   * Analyze award trajectory over time
   */
  private analyzeTrajectory(
    awards: EnhancedAwardInput[],
    assessments: Map<string, EnhancedAwardAssessment>
  ): AwardPortfolioPatterns['trajectory'] {
    // Group by grade level
    const byGrade: Record<number, { award: EnhancedAwardInput; tier: AwardTier }[]> = {};

    for (const award of awards) {
      const assessment = assessments.get(award.id);
      if (!assessment) continue;

      if (!byGrade[award.gradeLevel]) {
        byGrade[award.gradeLevel] = [];
      }
      byGrade[award.gradeLevel].push({ award, tier: assessment.tier });
    }

    // Analyze progression
    const grades = Object.keys(byGrade)
      .map(Number)
      .sort();
    const milestones: { year: number; award: string; significance: string }[] = [];

    let pattern: 'ascending' | 'consistent' | 'descending' | 'erratic' | 'late_burst' = 'consistent';

    if (grades.length >= 2) {
      const firstGradeAvgTier = this.avgTier(byGrade[grades[0]]);
      const lastGradeAvgTier = this.avgTier(byGrade[grades[grades.length - 1]]);
      const lastGradeCount = byGrade[grades[grades.length - 1]]?.length || 0;

      if (lastGradeCount >= 5 && grades.length <= 2) {
        pattern = 'late_burst';
      } else if (lastGradeAvgTier < firstGradeAvgTier - 0.5) {
        pattern = 'ascending';
      } else if (lastGradeAvgTier > firstGradeAvgTier + 0.5) {
        pattern = 'descending';
      }
    }

    // Find key milestones
    for (const grade of grades) {
      const tier1Awards = byGrade[grade].filter((a) => a.tier === 1);
      for (const t1 of tier1Awards) {
        milestones.push({
          year: grade,
          award: t1.award.name,
          significance: 'Tier 1 achievement',
        });
      }
    }

    return {
      pattern,
      naturalProgression: pattern !== 'late_burst' && pattern !== 'erratic',
      keyMilestones: milestones.slice(0, 5),
    };
  }

  /**
   * Calculate average tier
   */
  private avgTier(awards: { tier: AwardTier }[]): number {
    if (awards.length === 0) return 3;
    return awards.reduce((sum, a) => sum + a.tier, 0) / awards.length;
  }

  /**
   * Analyze spike alignment
   */
  private analyzeSpikeAlignment(
    input: EnhancedAwardsInput,
    assessments: Map<string, EnhancedAwardAssessment>
  ): AwardPortfolioPatterns['spikeAlignment'] {
    const spikeArea = input.studentContext.spikeArea || input.studentContext.intendedMajor || 'none';

    if (spikeArea === 'none') {
      return {
        aligned: true,
        spikeArea: 'Not specified',
        supportingAwards: [],
        contradictingAwards: [],
      };
    }

    const spikeCategories = this.getSpikeCategories(spikeArea);
    const supporting: string[] = [];
    const contradicting: string[] = [];

    for (const [id, assessment] of assessments) {
      if (spikeCategories.includes(assessment.category)) {
        supporting.push(id);
      } else if (assessment.tier <= 2) {
        // Only flag high-tier awards outside spike as potentially contradicting
        contradicting.push(id);
      }
    }

    return {
      aligned: supporting.length > contradicting.length,
      spikeArea,
      supportingAwards: supporting,
      contradictingAwards: contradicting,
    };
  }

  /**
   * Get categories aligned with spike area
   */
  private getSpikeCategories(spikeArea: string): AwardCategory[] {
    const spikeLower = spikeArea.toLowerCase();

    if (spikeLower.includes('stem') || spikeLower.includes('science') || spikeLower.includes('engineering')) {
      return ['academic_olympiad', 'science_fair', 'research_recognition', 'stem_competition', 'summer_program_selection'];
    }
    if (spikeLower.includes('art') || spikeLower.includes('music') || spikeLower.includes('creative')) {
      return ['arts_competition', 'journalism_writing'];
    }
    if (spikeLower.includes('business') || spikeLower.includes('entrepreneur')) {
      return ['entrepreneurship', 'leadership'];
    }
    if (spikeLower.includes('debate') || spikeLower.includes('law') || spikeLower.includes('politic')) {
      return ['debate_speech', 'leadership'];
    }
    if (spikeLower.includes('service') || spikeLower.includes('community')) {
      return ['community_service', 'leadership'];
    }

    return [];
  }

  // ============================================================================
  // PHASE 5: SCHOOL-SPECIFIC EVALUATION
  // ============================================================================

  /**
   * Evaluate portfolio for specific schools
   */
  private evaluateForSchools(
    input: EnhancedAwardsInput,
    assessments: Map<string, EnhancedAwardAssessment>,
    targetSchools?: string[]
  ): EnhancedAwardEvaluation['schoolSpecificEvaluation'] {
    const evaluation: EnhancedAwardEvaluation['schoolSpecificEvaluation'] = {};
    const schools = targetSchools || SCHOOL_AWARD_PREFERENCES.map((s) => s.schoolId);

    for (const schoolId of schools) {
      const prefs = SCHOOL_AWARD_PREFERENCES.find((s) => s.schoolId === schoolId);
      if (!prefs) continue;

      // Calculate school-specific score
      let totalScore = 0;
      let count = 0;
      const topAwards: string[] = [];

      for (const [id, assessment] of assessments) {
        const schoolScore = assessment.schoolSpecificScores[schoolId];
        if (schoolScore) {
          totalScore += schoolScore.score;
          count++;
          if (schoolScore.score >= 70) {
            topAwards.push(assessment.awardName);
          }
        }
      }

      const overallScore = count > 0 ? totalScore / count : 50;

      const strength: 'exceptional' | 'strong' | 'competitive' | 'below_average' =
        overallScore >= 80 ? 'exceptional' :
        overallScore >= 65 ? 'strong' :
        overallScore >= 50 ? 'competitive' :
        'below_average';

      evaluation[schoolId] = {
        schoolId,
        overallScore,
        strength,
        topAwards: topAwards.slice(0, 3),
        explanation: `${prefs.schoolName}: ${prefs.valueStatement}`,
      };
    }

    return evaluation;
  }

  // ============================================================================
  // PHASE 6: SYNTHESIS
  // ============================================================================

  /**
   * Synthesize final evaluation
   */
  private synthesizeEvaluation(
    input: EnhancedAwardsInput,
    awardAssessments: Map<string, EnhancedAwardAssessment>,
    portfolioPatterns: AwardPortfolioPatterns,
    schoolSpecificEvaluation: EnhancedAwardEvaluation['schoolSpecificEvaluation'],
    authenticityAssessments: Map<string, AwardAuthenticityAssessment>
  ): EnhancedAwardEvaluation {
    // Build tier distribution
    const tierDistribution = this.buildTierDistribution(awardAssessments);

    // Calculate overall scores
    const overallScore = this.calculateOverallScore(awardAssessments, portfolioPatterns);
    const overallTierScore = tierDistribution.summary.totalPoints;
    const overallStrength = this.determineOverallStrength(overallScore);

    // Calculate authenticity summary
    const authenticitySummary = this.summarizeAuthenticity(authenticityAssessments);

    // Generate narrative
    const narrative = this.generateNarrative(
      input,
      awardAssessments,
      portfolioPatterns,
      tierDistribution
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      input,
      awardAssessments,
      portfolioPatterns,
      schoolSpecificEvaluation
    );

    return {
      evaluatedAt: new Date().toISOString(),
      version: '2.0.0',
      analysisPhase: 'synthesis',
      overallScore,
      overallTierScore,
      overallStrength,
      authenticityScore: 100 - authenticitySummary.flaggedAwards.length * 20,
      tierDistribution,
      awardAssessments: Object.fromEntries(awardAssessments),
      portfolioPatterns,
      authenticitySummary,
      schoolSpecificEvaluation,
      narrative,
      recommendations,
      confidenceScore: this.calculateConfidence(awardAssessments),
      inputDataHash: this.hashInput(input),
      researchModulesUsed: ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7'],
    };
  }

  /**
   * Build tier distribution
   */
  private buildTierDistribution(
    assessments: Map<string, EnhancedAwardAssessment>
  ): EnhancedAwardEvaluation['tierDistribution'] {
    const tier1: EnhancedAwardAssessment[] = [];
    const tier2: EnhancedAwardAssessment[] = [];
    const tier3: EnhancedAwardAssessment[] = [];
    const tier4: EnhancedAwardAssessment[] = [];

    for (const assessment of assessments.values()) {
      switch (assessment.tier) {
        case 1:
          tier1.push(assessment);
          break;
        case 2:
          tier2.push(assessment);
          break;
        case 3:
          tier3.push(assessment);
          break;
        case 4:
          tier4.push(assessment);
          break;
      }
    }

    const totalPoints =
      tier1.length * 4 + tier2.length * 3 + tier3.length * 2 + tier4.length * 1;
    const totalCount = tier1.length + tier2.length + tier3.length + tier4.length;

    return {
      tier1,
      tier2,
      tier3,
      tier4,
      summary: {
        tier1Count: tier1.length,
        tier2Count: tier2.length,
        tier3Count: tier3.length,
        tier4Count: tier4.length,
        totalPoints,
        averageTier: totalCount > 0 ? totalPoints / totalCount : 0,
      },
    };
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(
    assessments: Map<string, EnhancedAwardAssessment>,
    patterns: AwardPortfolioPatterns
  ): number {
    let baseScore = 0;
    let count = 0;

    for (const assessment of assessments.values()) {
      baseScore += assessment.selectivityScore;
      count++;
    }

    const avgSelectivity = count > 0 ? baseScore / count : 0;

    // Adjust for patterns
    let adjustment = 0;
    if (patterns.thematicCoherence.score >= 80) adjustment += 5;
    if (patterns.paddingRisk === 'high') adjustment -= 10;
    if (patterns.trajectory.naturalProgression) adjustment += 5;
    if (!patterns.spikeAlignment.aligned) adjustment -= 5;

    return Math.max(0, Math.min(100, avgSelectivity + adjustment));
  }

  /**
   * Determine overall strength
   */
  private determineOverallStrength(
    score: number
  ): 'exceptional' | 'strong' | 'competitive' | 'developing' | 'needs_work' {
    if (score >= 85) return 'exceptional';
    if (score >= 70) return 'strong';
    if (score >= 55) return 'competitive';
    if (score >= 40) return 'developing';
    return 'needs_work';
  }

  /**
   * Summarize authenticity across portfolio
   */
  private summarizeAuthenticity(
    assessments: Map<string, AwardAuthenticityAssessment>
  ): EnhancedAwardEvaluation['authenticitySummary'] {
    const flaggedAwards: string[] = [];
    const recommendations: string[] = [];
    let highestRisk: 'none' | 'low' | 'medium' | 'high' | 'severe' = 'none';

    const riskOrder = ['none', 'low', 'medium', 'high', 'severe'];

    for (const [id, assessment] of assessments) {
      if (assessment.riskLevel !== 'none' && assessment.riskLevel !== 'low') {
        flaggedAwards.push(id);
      }

      if (riskOrder.indexOf(assessment.riskLevel) > riskOrder.indexOf(highestRisk)) {
        highestRisk = assessment.riskLevel;
      }

      if (assessment.recommendation === 'exclude') {
        recommendations.push(`Remove "${assessment.awardName}" - identified as ${assessment.riskLevel} risk`);
      } else if (assessment.recommendation === 'investigate') {
        recommendations.push(`Verify "${assessment.awardName}" before including`);
      }
    }

    return {
      overallRisk: highestRisk,
      flaggedAwards,
      recommendations,
    };
  }

  /**
   * Generate narrative for evaluation
   */
  private generateNarrative(
    input: EnhancedAwardsInput,
    assessments: Map<string, EnhancedAwardAssessment>,
    patterns: AwardPortfolioPatterns,
    tierDistribution: EnhancedAwardEvaluation['tierDistribution']
  ): EnhancedAwardEvaluation['narrative'] {
    const { tier1Count, tier2Count } = tierDistribution.summary;

    // Headline
    let headline: string;
    if (tier1Count >= 2) {
      headline = 'Exceptional award portfolio with multiple elite recognitions';
    } else if (tier1Count >= 1) {
      headline = 'Strong portfolio anchored by standout achievement';
    } else if (tier2Count >= 2) {
      headline = 'Solid portfolio with notable state/regional recognitions';
    } else {
      headline = 'Developing portfolio with room for stronger achievements';
    }

    // Strengths with citations
    const strengthsWithCitations: { strength: string; citation: ResearchCitation }[] = [];
    if (tier1Count >= 1) {
      strengthsWithCitations.push({
        strength: `${tier1Count} Tier 1 award(s) demonstrating exceptional achievement`,
        citation: awardKnowledgeBase.generateCitation('2.1', 'Tier 1 Impact'),
      });
    }
    if (patterns.thematicCoherence.score >= 70) {
      strengthsWithCitations.push({
        strength: `Strong thematic coherence in ${patterns.thematicCoherence.primaryTheme}`,
        citation: awardKnowledgeBase.generateCitation('2.1', 'Portfolio Coherence'),
      });
    }

    // Concerns with citations
    const concernsWithCitations: { concern: string; citation: ResearchCitation }[] = [];
    if (patterns.paddingRisk === 'high') {
      concernsWithCitations.push({
        concern: 'Portfolio shows signs of potential padding with many low-tier awards',
        citation: awardKnowledgeBase.generateCitation('2.7', 'Red Flag Detection'),
      });
    }

    return {
      headline,
      strengthsWithCitations,
      concernsWithCitations,
      strategicPositioning: this.generateStrategicPositioning(patterns, tierDistribution),
      admissionsOfficerPerspective: this.generateAOPerspective(tierDistribution, patterns),
    };
  }

  /**
   * Generate strategic positioning advice
   */
  private generateStrategicPositioning(
    patterns: AwardPortfolioPatterns,
    tierDistribution: EnhancedAwardEvaluation['tierDistribution']
  ): string {
    if (tierDistribution.summary.tier1Count >= 1) {
      return 'Lead with your Tier 1 achievement(s) - these are your strongest differentiators. Ensure they are prominently featured in your Common App honors section.';
    }
    if (tierDistribution.summary.tier2Count >= 2) {
      return 'Your Tier 2 awards provide solid credentialing. Focus on the narrative they tell about your interests and abilities.';
    }
    return 'Focus on quality over quantity. Consider pursuing higher-impact recognition in your primary area of interest.';
  }

  /**
   * Generate admissions officer perspective
   */
  private generateAOPerspective(
    tierDistribution: EnhancedAwardEvaluation['tierDistribution'],
    patterns: AwardPortfolioPatterns
  ): string {
    const { tier1Count, tier2Count, totalPoints } = tierDistribution.summary;

    if (tier1Count >= 2) {
      return 'An admissions officer would view this portfolio as exceptional. Multiple elite achievements are rare and indicate outstanding ability.';
    }
    if (tier1Count >= 1 || tier2Count >= 3) {
      return 'An admissions officer would view this portfolio favorably. The achievements demonstrate genuine excellence in specific areas.';
    }
    if (patterns.paddingRisk === 'high') {
      return 'An admissions officer might view the quantity of lower-tier awards skeptically. Focus on fewer, more meaningful achievements.';
    }
    return 'An admissions officer would see a developing profile. The awards are solid but not distinctive at the T20 level.';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    input: EnhancedAwardsInput,
    assessments: Map<string, EnhancedAwardAssessment>,
    patterns: AwardPortfolioPatterns,
    schoolSpecific: EnhancedAwardEvaluation['schoolSpecificEvaluation']
  ): EnhancedAwardEvaluation['recommendations'] {
    // Common App strategy
    const sortedAwards = Array.from(assessments.values())
      .filter((a) => a.authenticityAssessment.recommendation !== 'exclude')
      .sort((a, b) => a.tier - b.tier);

    const top5 = sortedAwards.slice(0, 5).map((a) => a.awardId);
    const alternates = sortedAwards.slice(5, 8).map((a) => a.awardId);

    // Level distribution
    const levelDistribution: Record<CommonAppHonorLevel, number> = {
      international: 0,
      national: 0,
      state_regional: 0,
      school: 0,
    };
    for (const a of sortedAwards.slice(0, 5)) {
      levelDistribution[a.commonAppOptimization.suggestedLevel]++;
    }

    // Improvements
    const improvements: EnhancedAwardEvaluation['recommendations']['improvements'] = [];

    if (patterns.paddingRisk !== 'none') {
      improvements.push({
        priority: 'high',
        recommendation: 'Reduce quantity of lower-tier awards and focus on quality',
        rationale: 'Too many Tier 4 awards can appear as resume padding',
        researchBacking: [awardKnowledgeBase.generateCitation('2.7', 'Padding Detection')],
      });
    }

    if (!patterns.spikeAlignment.aligned && input.studentContext.spikeArea) {
      improvements.push({
        priority: 'medium',
        recommendation: `Pursue awards aligned with your spike area (${input.studentContext.spikeArea})`,
        rationale: 'Awards should reinforce your application narrative',
        researchBacking: [awardKnowledgeBase.generateCitation('2.1', 'Spike Alignment')],
      });
    }

    // School-specific recommendations
    const schoolRecs: Record<string, string[]> = {};
    for (const [schoolId, evaluation] of Object.entries(schoolSpecific)) {
      if (evaluation.strength === 'below_average') {
        const prefs = SCHOOL_AWARD_PREFERENCES.find((s) => s.schoolId === schoolId);
        if (prefs) {
          schoolRecs[schoolId] = [
            `Consider pursuing awards in categories ${prefs.schoolName} values: ${Object.entries(prefs.categoryPreferences)
              .filter(([, v]) => v >= 4)
              .map(([k]) => k)
              .slice(0, 3)
              .join(', ')}`,
          ];
        }
      }
    }

    return {
      commonAppStrategy: {
        top5,
        alternates,
        ordering: 'Order by tier (highest first), then by relevance to intended major',
        levelDistribution,
      },
      improvements,
      schoolSpecific: schoolRecs,
    };
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(assessments: Map<string, EnhancedAwardAssessment>): number {
    let knownCount = 0;
    let totalCount = 0;

    for (const assessment of assessments.values()) {
      totalCount++;
      if (assessment.authenticityAssessment.verificationStatus.isKnownAward) {
        knownCount++;
      }
    }

    // Higher confidence when more awards are from known database
    const knownRatio = totalCount > 0 ? knownCount / totalCount : 0;
    return Math.round(60 + knownRatio * 40);
  }

  /**
   * Generate input hash for caching
   */
  private hashInput(input: EnhancedAwardsInput): string {
    const str = JSON.stringify({
      awards: input.awards.map((a) => a.id + a.name),
      context: input.studentContext,
      schools: input.targetSchools,
    });
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const enhancedAwardEvaluator = new EnhancedAwardEvaluator();
