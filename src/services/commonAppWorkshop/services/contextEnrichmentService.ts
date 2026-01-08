/**
 * Context Enrichment Service
 *
 * Formats essay context from Stage 1 for use in:
 * - Stage 2 suggestion prompts (teaching format)
 * - UI score breakdowns (student-facing)
 * - Export reports (comprehensive analysis)
 *
 * This service is the "translator" between raw Stage 1 output
 * and the formatted context that other services need.
 *
 * KEY PRINCIPLE: Build on Stage 1 insights, don't re-discover them.
 */

import type {
  EssayContextPackage,
  HolisticContext,
  DimensionalContext,
  ScoreReasoning
} from '../types';
import type { UnifiedScoringOutput } from './unifiedScoringService';
import type { SemanticClicheAnalysis } from './semanticClicheAnalyzer';

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ContextEnrichmentService {

  /**
   * Extract holistic context from cliché analysis
   *
   * The semantic cliché analyzer already identifies narrative arc, motifs, etc.
   * This method extracts that data in a standardized format.
   *
   * @param clicheAnalysis - Output from semantic cliché analyzer
   * @returns Holistic context or undefined if no cliché analysis available
   */
  extractHolisticContext(
    clicheAnalysis?: SemanticClicheAnalysis
  ): HolisticContext | undefined {
    if (!clicheAnalysis) return undefined;

    // Extract motifs from topic clichés (what themes keep appearing)
    const recurring_motifs: string[] = [];

    if (clicheAnalysis.topic_cliches?.detected_topics) {
      for (const topic of clicheAnalysis.topic_cliches.detected_topics) {
        if (!recurring_motifs.includes(topic)) {
          recurring_motifs.push(topic);
        }
      }
    }

    // Extract narrative arc info
    const arc = clicheAnalysis.narrative_arc;

    if (!arc) {
      // No arc analysis available
      return undefined;
    }

    return {
      recurring_motifs: recurring_motifs.slice(0, 5), // Top 5 motifs
      emotional_arc: arc.detected_arc || 'Not analyzed',
      narrative_thread: arc.arc_critique || 'Not analyzed',
      arc_predictability: arc.predictability_score,
      arc_suggested_subversion: arc.suggested_subversion
    };
  }

  /**
   * Extract dimensional context from semantic scoring
   *
   * Maps principle scores to dimensions with evidence-based
   * strengths and weaknesses.
   *
   * @param scoring - Output from unified scoring service
   * @returns Array of dimensional contexts (empty if no semantic analysis)
   */
  extractDimensionalContext(
    scoring: UnifiedScoringOutput
  ): DimensionalContext[] {
    const contexts: DimensionalContext[] = [];

    if (!scoring.semantic_analysis?.principle_scores) {
      return contexts;
    }

    for (const principle of scoring.semantic_analysis.principle_scores) {
      const dimension = this.mapPrincipleToDimension(principle.principle_id);

      // Determine strength level based on score
      let strength_level: 'STRONG' | 'ADEQUATE' | 'WEAK';
      if (principle.score >= 8) strength_level = 'STRONG';
      else if (principle.score >= 6) strength_level = 'ADEQUATE';
      else strength_level = 'WEAK';

      // Parse evidence from how_achieved and reader_effect
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      if (principle.score >= 7) {
        // High score - how_achieved is a strength
        strengths.push(principle.how_achieved);

        // Reader effect is also positive
        if (principle.reader_effect) {
          strengths.push(`Reader feels: ${principle.reader_effect}`);
        }
      } else if (principle.score >= 5) {
        // Medium score - mixed evidence
        strengths.push(`Partially achieved: ${principle.how_achieved}`);
        weaknesses.push(`Could improve: ${principle.reader_effect}`);
      } else {
        // Low score - how_achieved explains the weakness
        weaknesses.push(principle.how_achieved);

        if (principle.reader_effect) {
          weaknesses.push(`Reader feels: ${principle.reader_effect}`);
        }
      }

      contexts.push({
        dimension,
        current_score: principle.score,
        target_score: 8, // Excellence threshold
        gap: Math.max(0, 8 - principle.score),
        strength_level,
        evidence: {
          strengths,
          weaknesses
        }
      });
    }

    return contexts;
  }

  /**
   * Extract score reasoning (why this score)
   *
   * Packages the "why" explanation from semantic analysis
   * in a format suitable for suggestion prompts and UI.
   *
   * @param scoring - Output from unified scoring service
   * @returns Score reasoning with core strength/weakness and principle breakdown
   */
  extractScoreReasoning(
    scoring: UnifiedScoringOutput
  ): ScoreReasoning {
    return {
      total_score: scoring.total_score,
      quality_tier: scoring.quality_tier,
      core_strength: scoring.semantic_analysis?.core_strength || 'Not analyzed',
      core_weakness: scoring.semantic_analysis?.core_weakness || 'Not analyzed',
      reader_experience: scoring.semantic_analysis?.reader_experience || 'Not analyzed',
      principle_scores: scoring.semantic_analysis?.principle_scores || [],
      type_assessment: scoring.semantic_analysis?.type_assessment
    };
  }

  /**
   * Build complete essay context package
   *
   * This is the main entry point - call this to get everything.
   *
   * Bundles holistic context + dimensional context + score reasoning
   * into a single package for Stage 2 consumption.
   *
   * @param scoring - Output from unified scoring service (required)
   * @param clicheAnalysis - Output from semantic cliché analyzer (optional)
   * @returns Complete essay context package
   */
  buildContextPackage(
    scoring: UnifiedScoringOutput,
    clicheAnalysis?: SemanticClicheAnalysis
  ): EssayContextPackage {
    return {
      holistic_context: this.extractHolisticContext(clicheAnalysis),
      dimensional_context: this.extractDimensionalContext(scoring),
      score_reasoning: this.extractScoreReasoning(scoring),
      word_count_status: scoring.word_count_assessment ? {
        status: scoring.word_count_assessment.status,
        word_count: scoring.word_count_assessment.word_count,
        limit: scoring.word_count_assessment.limit,
        delta: scoring.word_count_assessment.delta,
        severity: scoring.word_count_assessment.severity,
        guidance: scoring.word_count_assessment.guidance
      } : undefined
    };
  }

  /**
   * Format context for student-facing UI (Phase 4)
   *
   * Takes technical context and formats it in friendly language
   * for showing to users (like PIQ workshop score breakdown).
   *
   * This will be fully implemented in Phase 4.
   *
   * @param context - Essay context package
   * @returns Formatted breakdown for UI display
   */
  formatForUI(context: EssayContextPackage): {
    score_breakdown: string;
    dimensional_breakdown: Array<{
      dimension: string;
      score: number;
      explanation: string;
      how_to_improve: string;
    }>;
    overall_guidance: string;
  } {
    // Phase 4 implementation
    // For now, return placeholder structure

    const dimensionalBreakdown = context.dimensional_context?.map(dim => ({
      dimension: dim.dimension,
      score: dim.current_score,
      explanation: dim.evidence.weaknesses[0] || dim.evidence.strengths[0] || 'No analysis available',
      how_to_improve: `Close ${dim.gap}-point gap by addressing: ${dim.evidence.weaknesses.join(', ')}`
    })) || [];

    return {
      score_breakdown: context.score_reasoning
        ? `${context.score_reasoning.total_score}/100 (${context.score_reasoning.quality_tier})`
        : 'No score available',
      dimensional_breakdown: dimensionalBreakdown,
      overall_guidance: context.score_reasoning?.core_weakness
        ? `Primary focus: ${context.score_reasoning.core_weakness}`
        : 'No guidance available'
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Map principle ID to dimension name
   *
   * Principles are the underlying concepts we assess.
   * Dimensions are what we show to users.
   *
   * This mapping translates from semantic analysis (technical)
   * to user-facing dimension names.
   */
  private mapPrincipleToDimension(principleId: string): string {
    const mapping: Record<string, string> = {
      // Core principles
      'clarity_of_thought': 'intellectual_vitality',
      'authentic_voice': 'authenticity',
      'concrete_details': 'specificity',
      'meaningful_reflection': 'insight',
      'emotional_truth': 'vulnerability',
      'narrative_cohesion': 'coherence',

      // Additional mappings
      'reader_engagement': 'engagement',
      'unique_perspective': 'distinctiveness',
      'thematic_depth': 'depth',
      'structural_integrity': 'structure'
    };

    return mapping[principleId] || principleId;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const contextEnrichmentService = new ContextEnrichmentService();
