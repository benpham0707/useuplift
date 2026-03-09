/**
 * Strategy Selector — Selects the best macro-strategy for an essay
 *
 * Uses essay type + pre-analysis results (weakest dimensions) to
 * recommend the most impactful improvement strategy.
 */

import type { MacroStrategy, WorkshopEssayType, ScoringResult } from '../shared/types';
import { essayProfileRegistry } from '../registry/essayProfileRegistry';
import { MACRO_STRATEGIES, getStrategiesForEssayType } from './macroStrategies';

export interface StrategyRecommendation {
  strategy: MacroStrategy;
  score: number; // 0-100 relevance score
  rationale: string;
}

class StrategySelector {
  /**
   * Select the best strategies for an essay based on type and scoring results.
   *
   * @param essayType - The essay type
   * @param scoringResult - Pre-analysis scoring result (optional)
   * @returns Ordered list of strategy recommendations (best first)
   */
  selectStrategies(
    essayType: WorkshopEssayType,
    scoringResult?: ScoringResult
  ): StrategyRecommendation[] {
    // Get strategies applicable to this essay type
    let candidates = getStrategiesForEssayType(essayType);

    // If no type-specific strategies, fall back to all
    if (candidates.length === 0) {
      candidates = MACRO_STRATEGIES;
    }

    // Score each candidate
    const recommendations: StrategyRecommendation[] = candidates.map(strategy => {
      let score = 50; // baseline
      let rationale = '';

      if (scoringResult) {
        const { dimensionScores } = scoringResult;

        // Score based on how well the strategy targets weak dimensions
        const weakDims = dimensionScores
          .sort((a, b) => a.score - b.score)
          .slice(0, 3)
          .map(d => d.dimensionId);

        // Map strategies to the dimensions they improve
        const strategyTargets = this.getStrategyTargetDimensions(strategy.id);
        const overlap = weakDims.filter(d => strategyTargets.includes(d));

        score += overlap.length * 15;
        if (overlap.length > 0) {
          rationale = `Targets weak dimensions: ${overlap.join(', ')}`;
        }

        // Bonus if EQI suggests the strategy's improvement area
        if (scoringResult.eqi < 50 && strategy.id === 'deepen_scene') {
          score += 10; // Low EQI essays often need fundamental scene work
        }
        if (scoringResult.eqi >= 70 && strategy.id === 'polish_prose') {
          score += 10; // High EQI essays benefit from polish
        }
      }

      // Essay type affinity bonus
      const profile = essayProfileRegistry.getProfile(essayType);
      if (profile) {
        const profileStrategies = profile.macroStrategies.map(s => s.id);
        if (profileStrategies.includes(strategy.id)) {
          score += 10;
          rationale += (rationale ? '; ' : '') + 'Recommended by essay profile';
        }
      }

      if (!rationale) {
        rationale = `Applicable to ${essayType} essays`;
      }

      return { strategy, score, rationale };
    });

    // Sort by score descending
    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Get the top recommended strategy.
   */
  selectBest(essayType: WorkshopEssayType, scoringResult?: ScoringResult): StrategyRecommendation | undefined {
    const recs = this.selectStrategies(essayType, scoringResult);
    return recs[0];
  }

  /**
   * Map strategy IDs to the dimensions they primarily improve.
   */
  private getStrategyTargetDimensions(strategyId: string): string[] {
    const mapping: Record<string, string[]> = {
      strengthen_argument: ['argument_rhetorical_craft', 'thematic_depth_reflection', 'intellectual_vitality_curiosity'],
      deepen_scene: ['narrative_craft_storytelling', 'emotional_resonance_vulnerability', 'authenticity_specificity_detail'],
      polish_prose: ['word_economy_craft', 'structural_coherence_flow', 'tonal_sophistication'],
      emotional_arc_repair: ['emotional_resonance_vulnerability', 'tonal_sophistication', 'closing_impact_resolution'],
      ao_ready_polish: ['argument_rhetorical_craft', 'authenticity_specificity_detail', 'word_economy_craft'],
      why_us_overhaul: ['argument_rhetorical_craft', 'authenticity_specificity_detail', 'intellectual_vitality_curiosity'],
    };
    return mapping[strategyId] || [];
  }
}

/** Singleton strategy selector */
export const strategySelector = new StrategySelector();
export { StrategySelector };
