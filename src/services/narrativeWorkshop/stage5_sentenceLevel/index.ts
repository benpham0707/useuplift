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
  console.log('\n' + '='.repeat(80));
  console.log('STAGE 5: SENTENCE-LEVEL INSIGHT GENERATION');
  console.log('='.repeat(80) + '\n');

  const startTime = Date.now();

  try {
    console.log('  → Parsing essay into sentences...');
    const sentences = parseEssayIntoSentences(input.essayText);
    console.log(`     ✓ Parsed ${sentences.length} sentences`);

    console.log('  → Matching issues to specific sentences...');
    const matches = matchIssuesToSentences(sentences, stage2, stage3, synthesis);
    console.log(`     ✓ Found ${matches.length} issue matches`);

    console.log('  → Generating detailed insights...');
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
    console.log(`     ✓ Generated ${sentenceLevelInsights.length} sentence-level insights`);

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
    console.log('  → Generating general insights...');
    const generalInsights = generateGeneralInsights(synthesis);
    console.log(`     ✓ Generated ${generalInsights.length} general insights`);

    // Prioritize insights
    console.log('  → Prioritizing insights by impact...');
    const prioritizedInsights = prioritizeInsights(
      sentenceLevelInsights,
      synthesis.dimensionScores
    ).slice(0, 10); // Top 10
    console.log(`     ✓ Top 10 prioritized insights selected`);

    const duration = Date.now() - startTime;

    const result: SpecificInsights = {
      sentenceLevelInsights,
      generalInsights,
      bySection,
      bySeverity,
      byDimension,
      prioritizedInsights
    };

    console.log('\n✅ Specific insights generation complete');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Total sentence-level insights: ${sentenceLevelInsights.length}`);
    console.log(`   Critical: ${bySeverity.critical.length}`);
    console.log(`   Major: ${bySeverity.major.length}`);
    console.log(`   Minor: ${bySeverity.minor.length}`);
    console.log(`   Opening: ${bySection.opening.length}`);
    console.log(`   Body: ${bySection.body.length}`);
    console.log(`   Climax: ${bySection.climax.length}`);
    console.log(`   Conclusion: ${bySection.conclusion.length}`);
    console.log('\n' + '='.repeat(80) + '\n');

    return result;

  } catch (error) {
    console.error('❌ Specific insights generation failed:', error);
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
