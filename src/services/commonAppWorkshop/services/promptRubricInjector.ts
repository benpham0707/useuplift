// @ts-nocheck
/**
 * Prompt Rubric Injector
 *
 * Extracts prompt-specific rubric criteria based on estimated score band
 * to provide targeted upgrade guidance for suggestion generation.
 *
 * Key Features:
 * - Identifies current performance band (weak/average/good/excellent)
 * - Extracts "whatPreventsHigherScore" as specific upgrade targets
 * - Provides target band criteria for suggestions to aim for
 * - Formats guidance for prompt injection
 *
 * Integration: Inject output into TypeSpecificSuggestionService prompts
 * to make suggestions EXTREMELY targeted to score improvement.
 */

import { getCollegeResearch, getCollegeEssayPrompt } from '../data';
import type { CollegeEssayPrompt } from '../types/collegeResearch';

// ============================================================================
// TYPES
// ============================================================================

export interface RubricBandInfo {
  name: 'weak' | 'average' | 'good' | 'excellent';
  scoreRange: string;
  criteria?: string[];
  typicalElements?: string[];
  criticalFailures?: string[];
  dimensionalPattern?: Record<string, string>;
}

export interface RubricBandGuidance {
  promptId: string;
  promptTitle: string;
  estimatedScore: number;
  currentBand: RubricBandInfo;
  targetBand: RubricBandInfo;
  whatPreventsHigherScore: string | null;
  formattedForPrompt: string;
}

export interface PromptRubricInjectorInput {
  collegeId: string;
  promptId: string;
  estimatedScore: number; // 0-100
}

// ============================================================================
// BAND DETERMINATION
// ============================================================================

type BandName = 'weak' | 'average' | 'good' | 'excellent';

function determineBand(score: number): BandName {
  if (score < 50) return 'weak';
  if (score < 70) return 'average';
  if (score < 90) return 'good';
  return 'excellent';
}

function getTargetBand(currentBand: BandName): BandName {
  switch (currentBand) {
    case 'weak':
      return 'average';
    case 'average':
      return 'good';
    case 'good':
      return 'excellent';
    case 'excellent':
      return 'excellent'; // Already at top
  }
}

// ============================================================================
// PROMPT RUBRIC INJECTOR
// ============================================================================

export class PromptRubricInjector {
  /**
   * Get rubric band guidance for a specific prompt and score
   */
  getRubricGuidance(input: PromptRubricInjectorInput): RubricBandGuidance | null {
    const prompt = getCollegeEssayPrompt(input.collegeId, input.promptId);
    if (!prompt || !prompt.rubric) {
      return null;
    }

    const currentBandName = determineBand(input.estimatedScore);
    const targetBandName = getTargetBand(currentBandName);

    const currentBand = this.extractBandInfo(prompt, currentBandName);
    const targetBand = this.extractBandInfo(prompt, targetBandName);

    // Get whatPreventsHigherScore from current band
    const whatPreventsHigherScore = this.getWhatPreventsHigherScore(prompt, currentBandName);

    const guidance: RubricBandGuidance = {
      promptId: input.promptId,
      promptTitle: prompt.promptTitle,
      estimatedScore: input.estimatedScore,
      currentBand,
      targetBand,
      whatPreventsHigherScore,
      formattedForPrompt: '',
    };

    guidance.formattedForPrompt = this.formatForPrompt(guidance, input.collegeId);

    return guidance;
  }

  /**
   * Extract band info from prompt rubric
   */
  private extractBandInfo(prompt: CollegeEssayPrompt, bandName: BandName): RubricBandInfo {
    const rubricBand = prompt.rubric?.[bandName];

    if (!rubricBand) {
      // Fallback if band not defined
      return {
        name: bandName,
        scoreRange: this.getDefaultScoreRange(bandName),
      };
    }

    return {
      name: bandName,
      scoreRange: rubricBand.scoreRange || this.getDefaultScoreRange(bandName),
      criteria: rubricBand.criteria,
      typicalElements: rubricBand.typicalElements,
      criticalFailures: rubricBand.criticalFailures,
      dimensionalPattern: rubricBand.dimensionalPattern,
    };
  }

  /**
   * Get whatPreventsHigherScore from rubric band
   */
  private getWhatPreventsHigherScore(
    prompt: CollegeEssayPrompt,
    bandName: BandName
  ): string | null {
    const rubricBand = prompt.rubric?.[bandName];
    return rubricBand?.whatPreventsHigherScore || null;
  }

  /**
   * Get default score range for a band
   */
  private getDefaultScoreRange(bandName: BandName): string {
    switch (bandName) {
      case 'weak':
        return 'below 50';
      case 'average':
        return '50-69';
      case 'good':
        return '70-89';
      case 'excellent':
        return '90-100';
    }
  }

  /**
   * Format rubric guidance for prompt injection
   */
  formatForPrompt(guidance: RubricBandGuidance, collegeId?: string): string {
    const collegeName = collegeId
      ? getCollegeResearch(collegeId)?.collegeName || collegeId.toUpperCase()
      : 'THIS COLLEGE';

    let output = `
═══════════════════════════════════════════════════════════
PROMPT-SPECIFIC SCORING GUIDANCE
═══════════════════════════════════════════════════════════

Prompt: "${guidance.promptTitle}"
Estimated Score: ${guidance.estimatedScore}/100

CURRENT PERFORMANCE: ${guidance.currentBand.name.toUpperCase()} Band (${guidance.currentBand.scoreRange})
TARGET PERFORMANCE: ${guidance.targetBand.name.toUpperCase()} Band (${guidance.targetBand.scoreRange})
`;

    // What prevents higher score (most actionable guidance)
    if (guidance.whatPreventsHigherScore) {
      output += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT PREVENTS HIGHER SCORE (address these specifically):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${guidance.whatPreventsHigherScore}
`;
    }

    // Current band issues (if weak or average)
    if (
      guidance.currentBand.criticalFailures &&
      guidance.currentBand.criticalFailures.length > 0 &&
      (guidance.currentBand.name === 'weak' || guidance.currentBand.name === 'average')
    ) {
      output += `
CRITICAL ISSUES IN CURRENT BAND:
${guidance.currentBand.criticalFailures.map((f) => `• ${f}`).join('\n')}
`;
    }

    // Target band criteria (what suggestions should achieve)
    if (guidance.targetBand.criteria && guidance.targetBand.criteria.length > 0) {
      output += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TARGET CRITERIA (suggestions should help achieve these):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${guidance.targetBand.criteria.map((c) => `• ${c}`).join('\n')}
`;
    }

    // Target band typical elements (examples of excellence)
    if (guidance.targetBand.typicalElements && guidance.targetBand.typicalElements.length > 0) {
      output += `
TYPICAL ELEMENTS OF ${guidance.targetBand.name.toUpperCase()} ESSAYS:
${guidance.targetBand.typicalElements.map((e) => `• ${e}`).join('\n')}
`;
    }

    // Dimensional pattern (how dimensions should score)
    if (guidance.targetBand.dimensionalPattern) {
      const patterns = Object.entries(guidance.targetBand.dimensionalPattern);
      if (patterns.length > 0) {
        output += `
DIMENSIONAL TARGETS FOR ${collegeName.toUpperCase()}:
${patterns.map(([dim, pattern]) => `• ${dim}: ${pattern}`).join('\n')}
`;
      }
    }

    output += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Suggestions should move essay from ${guidance.currentBand.name} to ${guidance.targetBand.name} band.
Use the criteria above as specific improvement targets.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    return output;
  }

  /**
   * Get a quick summary of the scoring gap
   */
  getSummary(guidance: RubricBandGuidance): string {
    const gap = guidance.targetBand.name === guidance.currentBand.name ? 0 : 1;

    if (gap === 0) {
      return `Already in ${guidance.currentBand.name} band (${guidance.currentBand.scoreRange}). Focus on polish.`;
    }

    return `Move from ${guidance.currentBand.name} (${guidance.currentBand.scoreRange}) to ${guidance.targetBand.name} (${guidance.targetBand.scoreRange})`;
  }

  /**
   * Get the single most important upgrade action
   */
  getPrimaryUpgradeAction(guidance: RubricBandGuidance): string | null {
    // Priority 1: whatPreventsHigherScore
    if (guidance.whatPreventsHigherScore) {
      // Extract first actionable item
      const firstItem = guidance.whatPreventsHigherScore.split(/[.!?\n]/)[0];
      return firstItem.trim() || guidance.whatPreventsHigherScore;
    }

    // Priority 2: First target criterion
    if (guidance.targetBand.criteria && guidance.targetBand.criteria.length > 0) {
      return `Achieve: ${guidance.targetBand.criteria[0]}`;
    }

    // Priority 3: Address critical failure
    if (guidance.currentBand.criticalFailures && guidance.currentBand.criticalFailures.length > 0) {
      return `Fix: ${guidance.currentBand.criticalFailures[0]}`;
    }

    return null;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const promptRubricInjector = new PromptRubricInjector();

// ============================================================================
// CONVENIENCE FUNCTION
// ============================================================================

/**
 * Quick function to get rubric guidance for a prompt
 */
export function getRubricGuidance(
  collegeId: string,
  promptId: string,
  estimatedScore: number
): RubricBandGuidance | null {
  return promptRubricInjector.getRubricGuidance({ collegeId, promptId, estimatedScore });
}
