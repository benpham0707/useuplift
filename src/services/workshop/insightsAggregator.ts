/**
 * Insights Aggregator & Orchestrator
 *
 * Main service that orchestrates the complete insights pipeline:
 * 1. Transform CoachingIssue[] → InsightCard[]
 * 2. Detect strengths and opportunities
 * 3. Group insights by dimension with gap analysis
 * 4. Generate portfolio contribution insights
 * 5. Create complete InsightsState
 *
 * This is the primary entry point for generating all insights.
 */

import type {
  InsightCard,
  DimensionSummary,
  StrengthInsight,
  OpportunityInsight,
  PortfolioContributionInsights,
  InsightsState,
} from './insightTypes';

import type {
  CoachingOutput,
  CoachingIssue,
  RubricCategory,
  RubricCategoryScore,
} from '@/components/portfolio/extracurricular/workshop/backendTypes';

import { transformIssueToInsight } from './insightsTransformer';
import { detectStrengths, detectOpportunities } from './strengthOpportunityDetector';
import { PATTERN_GROUPS, getPatternsForDimension } from './issuePatterns';

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Generate complete insights from CoachingOutput
 */
export function generateCompleteInsights(
  coachingOutput: CoachingOutput,
  draftText: string,
  context?: {
    activityCategory?: string;
    studentMajorInterest?: string;
    culturalContext?: string;
  }
): InsightsState {
  const { current_nqi_0_to_100, rubric_scores, prioritized_issues } = coachingOutput;

  // 1. Transform issues → insights
  const insightCards = transformIssuesToInsights(
    prioritized_issues,
    draftText,
    rubric_scores,
    current_nqi_0_to_100,
    context
  );

  // 2. Detect strengths
  const strengths = detectStrengths(draftText, rubric_scores);

  // 3. Detect opportunities
  const opportunities = detectOpportunities(draftText, rubric_scores);

  // 4. Group by dimension
  const dimensionSummaries = groupInsightsByDimension(
    insightCards,
    strengths,
    opportunities,
    rubric_scores
  );

  // 5. Generate portfolio contribution insights
  const portfolioInsights = generatePortfolioContributionInsights(
    coachingOutput,
    draftText,
    insightCards,
    strengths,
    opportunities,
    dimensionSummaries
  );

  // 6. Calculate overall progress metrics
  const completedCount = insightCards.filter(i => i.isCompleted).length;
  const totalCount = insightCards.length;

  return {
    currentNQI: current_nqi_0_to_100,
    initialNQI: current_nqi_0_to_100, // TODO: track initial from first analysis
    targetNQI: calculateTargetNQI(current_nqi_0_to_100, insightCards),
    potentialGain: calculatePotentialGain(insightCards),
    dimensions: dimensionSummaries,
    allInsights: insightCards,
    issues: insightCards,
    strengths,
    opportunities,
    portfolioInsights,
    filters: {
      severity: 'all',
      dimension: 'all',
      type: 'all',
      status: 'all',
    },
    sortBy: 'priority',
    selectedInsight: null,
    showDetailView: false,
    completedCount,
    totalCount,
    completionPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
  };
}

// ============================================================================
// ISSUE TRANSFORMATION
// ============================================================================

/**
 * Transform all coaching issues to insight cards
 */
function transformIssuesToInsights(
  issues: CoachingIssue[],
  draftText: string,
  dimensionScores: RubricCategoryScore[],
  overallNQI: number,
  context?: {
    activityCategory?: string;
    studentMajorInterest?: string;
    culturalContext?: string;
  }
): InsightCard[] {
  const insights: InsightCard[] = [];

  issues.forEach(issue => {
    // Find dimension score for this issue's category
    const dimensionScore = dimensionScores.find(d => d.name === issue.category);
    if (!dimensionScore) return;

    const insight = transformIssueToInsight(
      issue,
      draftText,
      dimensionScore,
      overallNQI,
      context
    );
    insights.push(insight);
  });

  return insights;
}

// ============================================================================
// DIMENSION GROUPING & ANALYSIS
// ============================================================================

/**
 * Group insights by dimension with gap analysis
 */
function groupInsightsByDimension(
  insights: InsightCard[],
  strengths: StrengthInsight[],
  opportunities: OpportunityInsight[],
  dimensionScores: RubricCategoryScore[]
): DimensionSummary[] {
  const summaries: DimensionSummary[] = [];

  // For each rubric dimension
  PATTERN_GROUPS.forEach(group => {
    const dimension = group.dimension;
    const dimensionScore = dimensionScores.find(d => d.name === dimension);
    if (!dimensionScore) return;

    // Filter insights for this dimension
    const dimensionInsights = insights.filter(i => i.dimension === dimension);
    const dimensionStrengths = strengths.filter(s => s.dimension === dimension);
    const dimensionOpportunities = opportunities.filter(o => o.dimension === dimension);

    // Count by severity
    const issueCount = {
      critical: dimensionInsights.filter(i => i.severity === 'critical').length,
      major: dimensionInsights.filter(i => i.severity === 'major').length,
      minor: dimensionInsights.filter(i => i.severity === 'minor').length,
      total: dimensionInsights.length,
    };

    // Calculate potential gain
    const potentialGain = calculateDimensionPotentialGain(
      dimensionInsights,
      dimensionScore.weight
    );

    // Generate interpretation
    const interpretation = generateDimensionInterpretation(
      dimensionScore.score_0_to_10,
      issueCount,
      dimensionStrengths.length,
      dimension
    );

    // Determine status
    const status = determineDimensionStatus(dimensionScore.score_0_to_10, issueCount);

    const summary: DimensionSummary = {
      dimension,
      name: group.displayName,
      description: getDimensionDescription(dimension),
      score: dimensionScore.score_0_to_10,
      maxScore: 10,
      percentage: Math.round((dimensionScore.score_0_to_10 / 10) * 100),
      weight: dimensionScore.weight,
      status,
      issueCount,
      strengthCount: dimensionStrengths.length,
      opportunityCount: dimensionOpportunities.length,
      potentialGain,
      interpretation,
      insights: dimensionInsights,
      completedIssues: dimensionInsights.filter(i => i.isCompleted).length,
      totalIssues: dimensionInsights.length,
      isExpanded: false,
    };

    summaries.push(summary);
  });

  // Sort by weight (highest first) then score (lowest first for same weight)
  return summaries.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.score - b.score;
  });
}

/**
 * Calculate potential gain for a dimension
 */
function calculateDimensionPotentialGain(
  insights: InsightCard[],
  weight: number
): { min: number; max: number; display: string; confidence: 'high' | 'medium' | 'low' } {
  let totalMinGain = 0;
  let totalMaxGain = 0;

  insights.forEach(insight => {
    // Parse point impact strings
    const potentialString = insight.technical.pointImpact.potential;
    const match = potentialString.match(/\+(\d+)\s+to\s+\+(\d+)/);
    if (match) {
      totalMinGain += parseInt(match[1], 10);
      totalMaxGain += parseInt(match[2], 10);
    } else {
      const singleMatch = potentialString.match(/\+(\d+)/);
      if (singleMatch) {
        const gain = parseInt(singleMatch[1], 10);
        totalMinGain += gain;
        totalMaxGain += gain;
      }
    }
  });

  // Cap at reasonable maximum
  totalMinGain = Math.min(totalMinGain, 15);
  totalMaxGain = Math.min(totalMaxGain, 20);

  // Confidence based on issue count and severity
  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const confidence: 'high' | 'medium' | 'low' =
    criticalCount >= 2 ? 'high' :
    insights.length >= 3 ? 'medium' : 'low';

  return {
    min: totalMinGain,
    max: totalMaxGain,
    display: totalMaxGain > totalMinGain ? `+${totalMinGain} to +${totalMaxGain} points` : `+${totalMaxGain} points`,
    confidence,
  };
}

/**
 * Generate interpretation for dimension
 */
function generateDimensionInterpretation(
  score: number,
  issueCount: { critical: number; major: number; minor: number; total: number },
  strengthCount: number,
  dimension: RubricCategory
): {
  currentLevel: string;
  targetLevel: string;
  gapAnalysis: string;
  keyPriority: string;
} {
  // Current level assessment
  const currentLevel =
    score >= 8.5 ? 'Exceptional and distinctive' :
    score >= 7.5 ? 'Strong with minor gaps' :
    score >= 6.0 ? 'Solid but needs refinement' :
    score >= 4.5 ? 'Developing but weak' :
    'Needs significant work';

  // Target level
  const targetLevel =
    score >= 8.5 ? 'Maintain excellence' :
    score >= 7.5 ? 'Polish to exceptional' :
    'Strengthen to highly competitive';

  // Gap analysis
  const gapAnalysis = generateGapAnalysis(score, issueCount, strengthCount, dimension);

  // Key priority
  const keyPriority =
    issueCount.critical > 0 ? `Fix ${issueCount.critical} critical issue${issueCount.critical > 1 ? 's' : ''} first` :
    issueCount.major > 0 ? `Address ${issueCount.major} major issue${issueCount.major > 1 ? 's' : ''}` :
    issueCount.minor > 0 ? `Polish ${issueCount.minor} minor detail${issueCount.minor > 1 ? 's' : ''}` :
    strengthCount > 0 ? 'Maintain and amplify strengths' :
    'Look for opportunities to elevate further';

  return {
    currentLevel,
    targetLevel,
    gapAnalysis,
    keyPriority,
  };
}

/**
 * Generate gap analysis
 */
function generateGapAnalysis(
  score: number,
  issueCount: { critical: number; major: number; minor: number },
  strengthCount: number,
  dimension: RubricCategory
): string {
  if (score >= 8.5) {
    return strengthCount > 0
      ? `This is a standout strength. ${strengthCount} element${strengthCount > 1 ? 's' : ''} working exceptionally well.`
      : 'Strong performance with few issues detected.';
  }

  if (score >= 7.5) {
    return issueCount.critical > 0
      ? `Solid foundation but ${issueCount.critical} critical gap${issueCount.critical > 1 ? 's' : ''} holding back from excellence.`
      : `Close to exceptional. ${issueCount.major} refinement${issueCount.major > 1 ? 's' : ''} needed.`;
  }

  if (score >= 6.0) {
    return `Competent but missing key elements that distinguish top essays in ${dimension.replace(/_/g, ' ')}.`;
  }

  if (score >= 4.5) {
    return `${issueCount.critical + issueCount.major} significant issues weakening this dimension. High-leverage improvement opportunity.`;
  }

  return `Critical dimension needing substantial strengthening. Focus here for maximum NQI gain.`;
}

/**
 * Determine dimension status
 */
function determineDimensionStatus(
  score: number,
  issueCount: { critical: number; major: number }
): 'critical' | 'needs_work' | 'good' | 'excellent' {
  if (issueCount.critical >= 2 || score < 5) return 'critical';
  if (issueCount.critical >= 1 || issueCount.major >= 3 || score < 6.5) return 'needs_work';
  if (score >= 8.5) return 'excellent';
  return 'good';
}

/**
 * Get dimension description
 */
function getDimensionDescription(dimension: RubricCategory): string {
  const descriptions: Record<RubricCategory, string> = {
    voice_integrity: 'Authentic, natural voice free from manufactured college essay language',
    specificity_evidence: 'Concrete numbers, specific details, and quantified evidence',
    transformative_impact: 'Visible personal growth and genuine transformation through experience',
    role_clarity_ownership: 'Clear articulation of your unique contribution vs team efforts',
    narrative_arc_stakes: 'Compelling story with conflict, obstacles, and emotional stakes',
    initiative_leadership: 'Proactive problem-spotting and independent action',
    community_collaboration: 'Measurable impact on others with specific behavioral change evidence',
    reflection_meaning: 'Universal insights and transferable wisdom extracted from experience',
    craft_language_quality: 'Literary sophistication through dialogue, scene, and varied rhythm',
    fit_trajectory: 'Clear connection between past experience and future academic/career goals',
    time_investment_consistency: 'Specific duration and frequency demonstrating sustained commitment',
  };
  return descriptions[dimension] || 'Dimension of narrative quality assessment';
}

// ============================================================================
// PORTFOLIO CONTRIBUTION INSIGHTS
// ============================================================================

/**
 * Generate holistic portfolio contribution insights
 */
function generatePortfolioContributionInsights(
  coachingOutput: CoachingOutput,
  draftText: string,
  insights: InsightCard[],
  strengths: StrengthInsight[],
  opportunities: OpportunityInsight[],
  dimensions: DimensionSummary[]
): PortfolioContributionInsights {
  const nqi = coachingOutput.current_nqi_0_to_100;

  // Determine tier
  const tier = determineTier(nqi);
  const percentile = determinePercentile(nqi);

  // Strategic positioning
  const positioning = {
    recommendedUse: determineRecommendedUse(nqi, strengths),
    narrativeStrength: assessNarrativeStrength(dimensions),
    impactCredibility: assessImpactCredibility(dimensions, draftText),
    differentiationPotential: assessDifferentiation(strengths, dimensions),
  };

  // Key insights
  const keyInsights = {
    strengths: strengths.slice(0, 3).map(s => s.title),
    criticalGaps: insights
      .filter(i => i.severity === 'critical')
      .slice(0, 3)
      .map(i => i.title),
    biggestOpportunity: identifyBiggestOpportunity(opportunities, dimensions),
    strategicAdvice: generateStrategicAdvice(nqi, strengths, insights),
  };

  // Comparative context
  const comparative = {
    vsTypicalApplicant: generateTypicalComparison(nqi),
    vsTopApplicants: generateTopComparison(nqi, dimensions),
    competitiveAdvantage: strengths.slice(0, 3).map(s => s.whyItMatters),
    competitiveWeakness: insights
      .filter(i => i.severity === 'critical')
      .slice(0, 2)
      .map(i => i.technical.whyThisMatters),
  };

  // Officer perspective
  const officerPerspective = {
    firstImpression: generateFirstImpression(draftText, strengths),
    credibilityAssessment: assessCredibility(dimensions, draftText),
    memorabilityFactor: assessMemorability(strengths, dimensions),
    flagsTriggers: identifyFlags(insights),
    positiveSignals: identifyPositiveSignals(strengths, dimensions),
  };

  // Improvement roadmap
  const roadmap = {
    quickWins: identifyQuickWins(insights),
    strategicMoves: identifyStrategicMoves(opportunities, dimensions),
    aspirationalTarget: generateAspirationalTarget(nqi, strengths, dimensions),
  };

  return {
    overallScore: nqi,
    tier,
    percentile,
    positioning,
    keyInsights,
    comparative,
    officerPerspective,
    roadmap,
  };
}

// Portfolio contribution helper functions
function determineTier(nqi: number): string {
  if (nqi >= 85) return 'Exceptional (Tier 1)';
  if (nqi >= 75) return 'Highly Competitive (Tier 2)';
  if (nqi >= 65) return 'Competitive (Tier 3)';
  if (nqi >= 55) return 'Solid (Tier 4)';
  return 'Needs Strengthening (Tier 5)';
}

function determinePercentile(nqi: number): string {
  if (nqi >= 90) return 'Top 1-3%';
  if (nqi >= 85) return 'Top 5-10%';
  if (nqi >= 80) return 'Top 10-15%';
  if (nqi >= 75) return 'Top 15-25%';
  if (nqi >= 70) return 'Top 25-35%';
  if (nqi >= 65) return 'Top 35-50%';
  return 'Below median';
}

function determineRecommendedUse(nqi: number, strengths: StrengthInsight[]): string {
  if (nqi >= 85 && strengths.length >= 3) {
    return 'Centerpiece Activity - Lead with this in your application';
  }
  if (nqi >= 75) {
    return 'Strong Supporting Activity - Showcase in top 3';
  }
  if (nqi >= 65) {
    return 'Supporting Activity - Include but not centerpiece';
  }
  return 'Consider strengthening before highlighting prominently';
}

function assessNarrativeStrength(dimensions: DimensionSummary[]): string {
  const narrativeDim = dimensions.find(d => d.dimension === 'narrative_arc_stakes');
  const voiceDim = dimensions.find(d => d.dimension === 'voice_integrity');

  const avgScore = narrativeDim && voiceDim ? (narrativeDim.score + voiceDim.score) / 2 : 0;

  if (avgScore >= 8.5) return 'Exceptional storytelling that commands attention';
  if (avgScore >= 7.5) return 'Strong narrative with clear arc and authentic voice';
  if (avgScore >= 6.5) return 'Solid narrative but room for more compelling storytelling';
  return 'Narrative needs significant strengthening';
}

function assessImpactCredibility(dimensions: DimensionSummary[], draftText: string): string {
  const specificityDim = dimensions.find(d => d.dimension === 'specificity_evidence');
  const communityDim = dimensions.find(d => d.dimension === 'community_collaboration');

  const hasNumbers = (draftText.match(/\d+/g) || []).length >= 5;
  const avgScore = specificityDim && communityDim ? (specificityDim.score + communityDim.score) / 2 : 0;

  if (avgScore >= 8 && hasNumbers) {
    return 'Highly credible with strong quantified evidence';
  }
  if (avgScore >= 7) {
    return 'Credible impact with some supporting evidence';
  }
  return 'Impact claims need stronger evidence for credibility';
}

function assessDifferentiation(strengths: StrengthInsight[], dimensions: DimensionSummary[]): string {
  if (strengths.length >= 3) {
    return 'Multiple distinctive elements create unique profile';
  }
  if (strengths.length >= 1) {
    return 'Some differentiation but could be more distinctive';
  }
  return 'Limited differentiation from typical applicants';
}

function identifyBiggestOpportunity(opportunities: OpportunityInsight[], dimensions: DimensionSummary[]): string {
  if (opportunities.length === 0) {
    return 'Continue refining existing strengths';
  }
  // Return highest-weighted opportunity
  return opportunities[0].title;
}

function generateStrategicAdvice(nqi: number, strengths: StrengthInsight[], insights: InsightCard[]): string {
  if (nqi >= 85) {
    return 'Polish minor details and ensure narrative stays authentic and specific';
  }
  if (nqi >= 75) {
    return 'Fix critical gaps while maintaining existing strengths to reach exceptional tier';
  }
  if (strengths.length >= 2) {
    return 'Amplify your existing strengths while addressing critical weaknesses';
  }
  return 'Focus on addressing critical issues first for maximum NQI gain';
}

function generateTypicalComparison(nqi: number): string {
  if (nqi >= 85) return 'Significantly stronger than typical applicant. Top essays show this level of sophistication.';
  if (nqi >= 75) return 'Stronger than average applicant but not yet at top tier.';
  if (nqi >= 65) return 'Competitive with average admitted student but needs elevation for top schools.';
  return 'Below typical admitted student at selective institutions.';
}

function generateTopComparison(nqi: number, dimensions: DimensionSummary[]): string {
  if (nqi >= 85) return 'Competitive with top 10% of applicants. Continue refining.';
  if (nqi >= 75) return 'Within striking distance of top tier. Address critical gaps to reach top 10%.';
  return 'Significant gap from top applicants. Focus on critical dimensions for biggest improvement.';
}

function generateFirstImpression(draftText: string, strengths: StrengthInsight[]): string {
  if (strengths.some(s => s.dimension === 'voice_integrity')) {
    return 'Authentic voice likely captures attention immediately';
  }
  if (strengths.some(s => s.dimension === 'narrative_arc_stakes')) {
    return 'Compelling opening and narrative arc create strong first impression';
  }
  return 'First impression solid but not immediately distinctive';
}

function assessCredibility(dimensions: DimensionSummary[], draftText: string): string {
  const specificity = dimensions.find(d => d.dimension === 'specificity_evidence');
  if (!specificity) return 'Credibility unclear';

  if (specificity.score >= 8) return 'Highly credible - claims backed by specific evidence';
  if (specificity.score >= 6.5) return 'Generally credible with some vague areas';
  return 'Credibility concerns - claims need stronger evidence';
}

function assessMemorability(strengths: StrengthInsight[], dimensions: DimensionSummary[]): string {
  const craftDim = dimensions.find(d => d.dimension === 'craft_language_quality');
  const hasCraft = craftDim && craftDim.score >= 7.5;
  const hasStrengths = strengths.length >= 2;

  if (hasCraft && hasStrengths) {
    return 'Highly memorable - distinctive content and strong craft';
  }
  if (hasStrengths) {
    return 'Moderately memorable - some distinctive elements';
  }
  return 'Forgettable - blends with typical essays';
}

function identifyFlags(insights: InsightCard[]): string[] {
  return insights
    .filter(i => i.severity === 'critical')
    .slice(0, 3)
    .map(i => i.title);
}

function identifyPositiveSignals(strengths: StrengthInsight[], dimensions: DimensionSummary[]): string[] {
  return strengths.slice(0, 4).map(s => s.whatWorking);
}

function identifyQuickWins(insights: InsightCard[]): Array<{ action: string; impact: string; time: string }> {
  return insights
    .filter(i => i.solutions.difficulty === 'easy')
    .slice(0, 3)
    .map(i => ({
      action: i.solutions.approaches[0].description,
      impact: i.solutions.approaches[0].estimatedImpact,
      time: i.solutions.approaches[0].estimatedTime,
    }));
}

function identifyStrategicMoves(
  opportunities: OpportunityInsight[],
  dimensions: DimensionSummary[]
): Array<{ goal: string; approach: string; timeframe: string }> {
  return opportunities.slice(0, 3).map(opp => ({
    goal: opp.title,
    approach: opp.howToCapture,
    timeframe: '20-30 minutes',
  }));
}

function generateAspirationalTarget(
  nqi: number,
  strengths: StrengthInsight[],
  dimensions: DimensionSummary[]
): string {
  const targetNQI = Math.min(95, nqi + 15);
  const topDimensions = dimensions
    .filter(d => d.score >= 8.5)
    .map(d => d.name)
    .slice(0, 2);

  if (topDimensions.length >= 2) {
    return `Target NQI ${targetNQI}+: Centerpiece activity showcasing ${topDimensions.join(' and ')} at exceptional level across all dimensions.`;
  }

  return `Target NQI ${targetNQI}+: Transform into highly competitive activity by addressing critical gaps and amplifying strengths.`;
}

// ============================================================================
// OVERALL CALCULATIONS
// ============================================================================

/**
 * Calculate target NQI based on potential improvements
 */
function calculateTargetNQI(currentNQI: number, insights: InsightCard[]): number {
  const potentialGain = calculatePotentialGain(insights);
  return Math.min(100, Math.round(currentNQI + potentialGain));
}

/**
 * Calculate total potential gain from all insights
 */
function calculatePotentialGain(insights: InsightCard[]): number {
  let totalGain = 0;

  insights.forEach(insight => {
    // Parse max potential gain
    const potentialString = insight.technical.pointImpact.potential;
    const match = potentialString.match(/\+(\d+)\s+to\s+\+(\d+)/);
    if (match) {
      totalGain += parseInt(match[2], 10); // Use max gain
    } else {
      const singleMatch = potentialString.match(/\+(\d+)/);
      if (singleMatch) {
        totalGain += parseInt(singleMatch[1], 10);
      }
    }
  });

  // Cap at reasonable maximum (20 points)
  return Math.min(totalGain, 20);
}

export {
  generateCompleteInsights,
  groupInsightsByDimension,
  generatePortfolioContributionInsights,
  calculateTargetNQI,
  calculatePotentialGain,
};
