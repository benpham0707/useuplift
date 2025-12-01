/**
 * Stage 5: Sentence-Level Insight Generation - Main Orchestrator
 *
 * The precision layer that maps all detected issues to specific sentences
 * and generates actionable, targeted feedback with weak vs strong examples.
 *
 * Outputs:
 * - Sentence-level insights (specific to each problematic sentence)
 * - General insights (essay-wide patterns)
 * - Organized by section, severity, and dimension
 * - Prioritized by impact (top 10 most important)
 *
 * This makes analysis truly actionable at the sentence level.
 */

import {
  NarrativeEssayInput,
  HolisticUnderstanding,
  DeepDiveAnalyses,
  GrammarStyleAnalysis,
  SynthesizedInsights,
  SpecificInsights,
  SentenceLevelInsight,
  GeneralInsight
} from '../types';
import {
  parseEssayIntoSentences,
  matchIssuesToSentences,
  prioritizeInsights
} from './patternMatcher';
import { generateSentenceLevelInsight } from './insightGenerator';

/**
 * Generate all sentence-level and general insights
 */
async function generateSpecificInsights(
  input: NarrativeEssayInput,
  stage1: HolisticUnderstanding,
  stage2: DeepDiveAnalyses,
  stage3: GrammarStyleAnalysis,
  synthesis: SynthesizedInsights
): Promise<SpecificInsights> {

  const startTime = Date.now();

  try {
    const sentences = parseEssayIntoSentences(input.essayText);

    const matches = matchIssuesToSentences(sentences, stage2, stage3, synthesis);

    const sentenceLevelInsights: SentenceLevelInsight[] = matches.map(match =>
      generateSentenceLevelInsight(
        match.sentence,
        match.issueType,
        match.issueCategory,
        match.severity,
        match.evidence,
        match.patternId,
        sentences
      )
    );

    // Organize by section
    const bySection = {
      opening: sentenceLevelInsights.filter(i => i.essaySection === 'opening'),
      body: sentenceLevelInsights.filter(i => i.essaySection === 'body'),
      climax: sentenceLevelInsights.filter(i => i.essaySection === 'climax'),
      conclusion: sentenceLevelInsights.filter(i => i.essaySection === 'conclusion')
    };

    // Organize by severity
    const bySeverity = {
      critical: sentenceLevelInsights.filter(i => i.severity === 'critical'),
      major: sentenceLevelInsights.filter(i => i.severity === 'major'),
      minor: sentenceLevelInsights.filter(i => i.severity === 'minor')
    };

    // Organize by dimension
    const byDimension: Record<string, SentenceLevelInsight[]> = {};
    sentenceLevelInsights.forEach(insight => {
      if (!byDimension[insight.issueCategory]) {
        byDimension[insight.issueCategory] = [];
      }
      byDimension[insight.issueCategory].push(insight);
    });

    // Generate general insights from synthesis
    const generalInsights = generateGeneralInsights(synthesis);

    // Prioritize insights
    const prioritizedInsights = prioritizeInsights(
      sentenceLevelInsights,
      synthesis.dimensionScores
    ).slice(0, 10); // Top 10

    const duration = Date.now() - startTime;

    const result: SpecificInsights = {
      sentenceLevelInsights,
      generalInsights,
      bySection,
      bySeverity,
      byDimension,
      prioritizedInsights
    };

    return result;

  } catch (error) {
    throw error;
  }
}

// ============================================================================
// GENERAL INSIGHTS GENERATION
// ============================================================================

/**
 * Generate general (essay-wide) insights from synthesis
 */
function generateGeneralInsights(synthesis: SynthesizedInsights): GeneralInsight[] {
  const insights: GeneralInsight[] = [];

  // Generate insights from top strengths
  synthesis.topStrengths.forEach((strength, index) => {
    insights.push({
      insightId: `strength_${index}_${Date.now()}`,
      insightType: 'strength',
      title: strength.strength,
      description: strength.whyItMatters,
      evidence: strength.evidence,
      impactAssessment: `Competitive advantage: ${strength.rarityFactor}`,
      rarityFactor: strength.rarityFactor,
      actionableSteps: [
        'Maintain this strength throughout revisions',
        'Consider highlighting similar moments elsewhere in essay',
        'Use this as template for other essays'
      ],
      estimatedImpact: 'Maintains competitive edge'
    });
  });

  // Generate insights from critical gaps
  synthesis.criticalGaps.forEach((gap, index) => {
    insights.push({
      insightId: `gap_${index}_${Date.now()}`,
      insightType: 'gap',
      title: gap.gap,
      description: gap.impact,
      evidence: gap.evidence,
      impactAssessment: gap.impact,
      fixComplexity: gap.fixComplexity,
      actionableSteps: [
        'Review sentences flagged in this category',
        'Study strong examples from elite essays',
        'Implement fixes starting with highest-impact changes'
      ],
      estimatedImpact: 'Addresses major weakness'
    });
  });

  // Generate insights from opportunities
  synthesis.opportunities.forEach((opp, index) => {
    insights.push({
      insightId: `opportunity_${index}_${Date.now()}`,
      insightType: 'opportunity',
      title: opp.opportunity,
      description: `Current: ${opp.currentState}\nPotential: ${opp.potentialState}`,
      evidence: [],
      impactAssessment: `Estimated impact: +${opp.estimatedImpact} points`,
      actionableSteps: [opp.captureStrategy],
      estimatedImpact: `+${opp.estimatedImpact} points to overall score`
    });
  });

  return insights;
}

// Export components
export { generateSpecificInsights };
export { parseEssayIntoSentences, matchIssuesToSentences } from './patternMatcher';
export { generateSentenceLevelInsight } from './insightGenerator';
