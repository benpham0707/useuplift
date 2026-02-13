// @ts-nocheck
/**
 * PASS Context Accumulator
 *
 * Manages the progressive context accumulation between stages.
 * Each stage receives context from previous stages and produces
 * context for subsequent stages.
 *
 * KEY PRINCIPLE: Later stages build on earlier findings without
 * repeating the same analysis. Context is compressed and focused
 * to stay within token limits while preserving critical insights.
 */

import { AnalysisStage, HarvardScoreDecimal } from '../types';
import { PASSSessionManager, AccumulatedContext } from './sessionManager';

// ============================================================================
// CONTEXT BUILDING TYPES
// ============================================================================

export interface StageContext {
  // What this stage needs to know from previous stages
  previousFindings: string[];
  // Key scores and classifications to reference
  scores: Record<string, number>;
  // Warnings or concerns to address
  warningsToConsider: string[];
  // Specific areas to emphasize
  emphasisAreas: string[];
  // Citations to reference
  relevantCitations: Array<{ source: string; reference: string }>;
}

export interface ContextSummary {
  // One-paragraph summary for prompt injection
  narrativeSummary: string;
  // Bullet points of key findings
  keyPoints: string[];
  // Numerical data
  metrics: Record<string, number | string>;
  // Token count of this context
  tokenEstimate: number;
}

// ============================================================================
// STAGE DEPENDENCIES
// ============================================================================

/**
 * Defines what context each stage needs from previous stages
 */
export const STAGE_DEPENDENCIES: Record<AnalysisStage, AnalysisStage[]> = {
  profile_classification: [], // Stage 0: No dependencies
  activity_diagnosis: ['profile_classification'],
  academic_diagnosis: ['profile_classification'],
  essay_diagnosis: ['profile_classification'],
  character_analysis: ['profile_classification', 'activity_diagnosis', 'academic_diagnosis', 'essay_diagnosis'],
  school_fit: ['character_analysis'],
  strategic_guidance: ['character_analysis', 'school_fit'],
  verification: ['character_analysis', 'school_fit', 'strategic_guidance'],
};

/**
 * Maximum context tokens to pass to each stage
 * Prevents prompt bloat while ensuring sufficient context
 */
export const STAGE_CONTEXT_LIMITS: Record<AnalysisStage, number> = {
  profile_classification: 0, // No prior context
  activity_diagnosis: 500,
  academic_diagnosis: 500,
  essay_diagnosis: 500,
  character_analysis: 2000, // Needs comprehensive context
  school_fit: 1500,
  strategic_guidance: 2500, // Needs most context for synthesis
  verification: 1000,
};

// ============================================================================
// CONTEXT ACCUMULATOR CLASS
// ============================================================================

export class ContextAccumulator {
  private sessionManager: PASSSessionManager;

  constructor(sessionManager: PASSSessionManager) {
    this.sessionManager = sessionManager;
  }

  /**
   * Build context for a specific stage based on accumulated results
   */
  buildContextForStage(
    sessionId: string,
    targetStage: AnalysisStage
  ): StageContext {
    const accumulated = this.sessionManager.getAccumulatedContext(sessionId);
    const dependencies = STAGE_DEPENDENCIES[targetStage];
    const tokenLimit = STAGE_CONTEXT_LIMITS[targetStage];

    const context: StageContext = {
      previousFindings: [],
      scores: {},
      warningsToConsider: [],
      emphasisAreas: [],
      relevantCitations: [],
    };

    if (dependencies.length === 0) {
      return context;
    }

    // Build context based on what's accumulated
    switch (targetStage) {
      case 'activity_diagnosis':
      case 'academic_diagnosis':
      case 'essay_diagnosis':
        this.addStage0Context(context, accumulated);
        break;

      case 'character_analysis':
        this.addStage0Context(context, accumulated);
        this.addStage1Context(context, accumulated);
        break;

      case 'school_fit':
        this.addStage2Context(context, accumulated);
        break;

      case 'strategic_guidance':
        this.addStage2Context(context, accumulated);
        this.addStage3Context(context, accumulated);
        break;

      case 'verification':
        this.addStage2Context(context, accumulated);
        this.addStage3Context(context, accumulated);
        this.addStage4Context(context, accumulated);
        break;
    }

    // Add relevant citations
    context.relevantCitations = accumulated.citations
      .filter(c => dependencies.includes(c.stage as AnalysisStage))
      .slice(0, 10); // Limit citations

    return context;
  }

  /**
   * Generate a compressed narrative summary for prompt injection
   */
  generateContextSummary(
    sessionId: string,
    targetStage: AnalysisStage
  ): ContextSummary {
    const stageContext = this.buildContextForStage(sessionId, targetStage);
    const tokenLimit = STAGE_CONTEXT_LIMITS[targetStage];

    // Build narrative summary
    const narrativeParts: string[] = [];
    const keyPoints: string[] = [];
    const metrics: Record<string, number | string> = {};

    // Add scores to metrics
    for (const [key, value] of Object.entries(stageContext.scores)) {
      metrics[key] = value;
      keyPoints.push(`${key}: ${value}`);
    }

    // Add findings as narrative
    if (stageContext.previousFindings.length > 0) {
      narrativeParts.push(
        'Based on prior analysis: ' +
        stageContext.previousFindings.slice(0, 5).join('. ') + '.'
      );
    }

    // Add warnings
    if (stageContext.warningsToConsider.length > 0) {
      narrativeParts.push(
        'Key considerations: ' +
        stageContext.warningsToConsider.join('; ') + '.'
      );
    }

    // Add emphasis areas
    if (stageContext.emphasisAreas.length > 0) {
      narrativeParts.push(
        'Areas requiring attention: ' +
        stageContext.emphasisAreas.join(', ') + '.'
      );
    }

    const narrativeSummary = narrativeParts.join(' ');

    // Estimate tokens (rough approximation: 1 token ≈ 4 chars)
    const tokenEstimate = Math.ceil(narrativeSummary.length / 4);

    // Truncate if over limit
    let finalNarrative = narrativeSummary;
    if (tokenEstimate > tokenLimit && tokenLimit > 0) {
      const charLimit = tokenLimit * 4;
      finalNarrative = narrativeSummary.substring(0, charLimit) + '...';
    }

    return {
      narrativeSummary: finalNarrative,
      keyPoints,
      metrics,
      tokenEstimate: Math.ceil(finalNarrative.length / 4),
    };
  }

  /**
   * Format context for prompt injection
   */
  formatContextForPrompt(sessionId: string, targetStage: AnalysisStage): string {
    const summary = this.generateContextSummary(sessionId, targetStage);

    if (!summary.narrativeSummary && Object.keys(summary.metrics).length === 0) {
      return '';
    }

    const parts: string[] = [];

    // Add metrics section
    if (Object.keys(summary.metrics).length > 0) {
      parts.push('<prior_analysis_metrics>');
      for (const [key, value] of Object.entries(summary.metrics)) {
        parts.push(`  ${key}: ${value}`);
      }
      parts.push('</prior_analysis_metrics>');
    }

    // Add narrative section
    if (summary.narrativeSummary) {
      parts.push('<prior_analysis_context>');
      parts.push(summary.narrativeSummary);
      parts.push('</prior_analysis_context>');
    }

    return parts.join('\n');
  }

  // ==========================================================================
  // PRIVATE CONTEXT BUILDERS
  // ==========================================================================

  private addStage0Context(context: StageContext, accumulated: AccumulatedContext): void {
    if (accumulated.studentArchetype) {
      context.previousFindings.push(
        `Student archetype: ${accumulated.studentArchetype}`
      );
    }

    if (accumulated.contextFlags && accumulated.contextFlags.length > 0) {
      context.warningsToConsider.push(
        ...accumulated.contextFlags.map(f => `Context flag: ${f}`)
      );
    }

    if (accumulated.preliminaryTiers) {
      for (const [activity, tier] of Object.entries(accumulated.preliminaryTiers)) {
        context.scores[`preliminary_tier_${activity}`] = tier;
      }
    }
  }

  private addStage1Context(context: StageContext, accumulated: AccumulatedContext): void {
    // Activity diagnosis
    if (accumulated.activityDiagnosis) {
      const diag = accumulated.activityDiagnosis;

      if (diag.spikeDetected) {
        context.previousFindings.push(
          `Spike detected in: ${diag.spikeAreas.join(', ')}`
        );
        context.emphasisAreas.push('Has demonstrated spike - emphasize depth');
      } else {
        context.warningsToConsider.push('No clear spike identified');
      }

      if (diag.gaps.length > 0) {
        context.warningsToConsider.push(
          `Activity gaps: ${diag.gaps.join(', ')}`
        );
      }

      // Add tier classifications
      for (const item of diag.tierClassifications) {
        context.scores[`activity_tier_${item.name.replace(/\s+/g, '_')}`] = item.tier;
      }
    }

    // Academic diagnosis
    if (accumulated.academicDiagnosis) {
      const diag = accumulated.academicDiagnosis;
      context.previousFindings.push(
        `Academic rigor: ${diag.rigorLevel}, Trajectory: ${diag.trajectoryDirection}`
      );
      context.scores['academic_rigor'] = diag.rigorLevel;
      context.scores['grade_trajectory'] = diag.trajectoryDirection;
    }

    // Essay diagnosis
    if (accumulated.essayDiagnosis) {
      const diag = accumulated.essayDiagnosis;
      context.scores['voice_strength'] = diag.voiceStrength;

      if (diag.overlaps.length > 0) {
        context.warningsToConsider.push(
          `Essay topic overlaps detected: ${diag.overlaps.join(', ')}`
        );
      }
    }
  }

  private addStage2Context(context: StageContext, accumulated: AccumulatedContext): void {
    // Character scores
    if (accumulated.characterScores) {
      for (const [dimension, score] of Object.entries(accumulated.characterScores)) {
        context.scores[`character_${dimension}`] = score;
      }
    }

    // Narrative coherence
    if (accumulated.narrativeCoherence !== undefined) {
      context.scores['narrative_coherence'] = accumulated.narrativeCoherence;
    }

    // Harvard score
    if (accumulated.harvardScore !== undefined) {
      context.scores['harvard_score'] = accumulated.harvardScore;
      context.previousFindings.push(
        `Harvard equivalent score: ${accumulated.harvardScore}/6`
      );
    }

    // Key strengths and development areas
    if (accumulated.keyStrengths && accumulated.keyStrengths.length > 0) {
      context.previousFindings.push(
        `Key strengths: ${accumulated.keyStrengths.slice(0, 3).join(', ')}`
      );
      context.emphasisAreas.push(...accumulated.keyStrengths.slice(0, 3));
    }

    if (accumulated.developmentAreas && accumulated.developmentAreas.length > 0) {
      context.warningsToConsider.push(
        `Development areas: ${accumulated.developmentAreas.slice(0, 3).join(', ')}`
      );
    }
  }

  private addStage3Context(context: StageContext, accumulated: AccumulatedContext): void {
    if (accumulated.schoolFitScores) {
      for (const [school, score] of Object.entries(accumulated.schoolFitScores)) {
        context.scores[`fit_${school.replace(/\s+/g, '_')}`] = score;
      }

      // Identify best and worst fits
      const sorted = Object.entries(accumulated.schoolFitScores)
        .sort(([, a], [, b]) => b - a);

      if (sorted.length > 0) {
        context.previousFindings.push(
          `Best fit schools: ${sorted.slice(0, 3).map(([s]) => s).join(', ')}`
        );
      }
    }
  }

  private addStage4Context(context: StageContext, accumulated: AccumulatedContext): void {
    if (accumulated.strategicRecommendations) {
      context.previousFindings.push(
        `Strategic recommendations: ${accumulated.strategicRecommendations.slice(0, 5).join('; ')}`
      );
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createContextAccumulator(
  sessionManager: PASSSessionManager
): ContextAccumulator {
  return new ContextAccumulator(sessionManager);
}
