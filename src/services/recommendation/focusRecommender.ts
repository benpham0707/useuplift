
import { EssayAnalysisResult } from '../orchestrator/types';
import { PIQPromptType } from '../../piq/types';

export interface RecommendedFocus {
  focusArea: 'hook' | 'pivot_moment' | 'growth_development' | 'reflection' | 'full_rewrite';
  reason: string;
  strategy: string;
  priority: number; // 1 = Highest Priority
}

export class FocusRecommender {
  /**
   * Analyzes the diagnostic report to recommend the best entry point for the workshop.
   * Maps signals to specific NarrativeGenerator focus areas.
   */
  static recommend(analysis: EssayAnalysisResult): RecommendedFocus[] {
    const recommendations: RecommendedFocus[] = [];

    // 1. Check Opening Hook
    if (analysis.opening_hook && analysis.opening_hook.score < 7.0) {
      recommendations.push({
        focusArea: 'hook',
        reason: `Opening Hook score is low (${analysis.opening_hook.score}/10).`,
        strategy: "Replace generic opening with 'In Medias Res' scene or Paradox.",
        priority: 1
      });
    }

    // 2. Check Narrative Arc / Climax
    if (analysis.narrative_arc) {
      const climaxQuality = analysis.narrative_arc.climax_quality;
      if (climaxQuality === 'weak' || climaxQuality === 'summary' || climaxQuality === 'absent') {
        recommendations.push({
          focusArea: 'pivot_moment',
          reason: `Climax is identified as '${climaxQuality}'.`,
          strategy: "Convert summary of success into a specific scene of struggle and realization.",
          priority: 2
        });
      }
    }

    // 3. Check Voice / Full Rewrite (Refined for "Freshness")
    if (analysis.voice && analysis.voice.score < 5.0) {
      const isGeneric = analysis.voice.quality_level === 'cliche' || analysis.voice.quality_level === 'robot';
      
      recommendations.push({
        focusArea: 'full_rewrite',
        reason: `Voice score is critical (${analysis.voice.score}/10).`,
        strategy: isGeneric 
          ? "Use the 'Freshness Engine' to pivot to a new specific moment, as the current content is generic." 
          : "Elevate voice to Tier 5 using Radical Specificity and Sensory Details.",
        priority: 1 // Critical issue overrides others
      });
    }

    // 4. Check Reflection / Thematic Coherence
    if (analysis.thematic_coherence && analysis.thematic_coherence.score < 6.5) {
      recommendations.push({
        focusArea: 'reflection',
        reason: `Thematic Coherence is weak (${analysis.thematic_coherence.score}/10).`,
        strategy: "Rewrite the reflection to connect the ending back to the opening motif.",
        priority: 3
      });
    }

    // 5. Check Growth / Primary Dimensions
    // Aggregate score of primary dimensions
    let primaryScoreSum = 0;
    let primaryCount = 0;
    if (analysis.primary_dimensions) {
      Object.values(analysis.primary_dimensions).forEach(dim => {
        if (dim && typeof dim.score === 'number') {
          primaryScoreSum += dim.score;
          primaryCount++;
        }
      });
    }

    if (primaryCount > 0) {
      const avgScore = primaryScoreSum / primaryCount;
      if (avgScore < 6.0) {
        recommendations.push({
          focusArea: 'growth_development',
          reason: `Core dimension scores are low (Avg: ${avgScore.toFixed(1)}).`,
          strategy: "Connect the initial interest to current expertise (The Montage).",
          priority: 3
        });
      }
    }

    // Sort by priority (asc)
    return recommendations.sort((a, b) => a.priority - b.priority);
  }
}

