/**
 * Adaptive Validator - Tier-Aware Validation (Phase 16)
 *
 * Extends OutputValidator with adaptive quality thresholds based on essay tier.
 *
 * Key Innovation:
 * - Foundation essays (30-50): Gentle improvements, don't overwhelm
 * - Strong essays (80-90): Push for excellence, sophisticated changes
 * - Masterful essays (95+): Micro-refinements only
 *
 * Prevents:
 * - Overshoot: Suggestions too advanced for student capability
 * - Undershoot: Suggestions too simple for advanced essays
 */

import { OutputValidator } from './outputValidator';
import type {
  ValidationContext,
  ValidationResult,
  ValidationFailure,
  ValidationConfig
} from './types';
import {
  calculateDifficultyMultiplier,
  getDifficultyTier,
  calculateTierThresholds,
  calculateAdaptiveScore,
  type DifficultyTier,
  type TierThresholds,
  type AdaptiveScore
} from './adaptiveScoring';

export interface AdaptiveValidationContext extends ValidationContext {
  currentEssayScore: number;           // Overall essay quality (0-100)
  previousEssayScore?: number;         // For progress tracking
}

export interface AdaptiveValidationResult extends ValidationResult {
  // Adaptive scoring
  adaptiveScore?: AdaptiveScore;
  tierThresholds?: TierThresholds;
  tierFeedback?: string;

  // Tier-specific failures
  tierViolations: ValidationFailure[];
}

export class AdaptiveValidator extends OutputValidator {
  private tierThresholds: TierThresholds;
  private difficultyTier: DifficultyTier;
  private essayScore: number;

  constructor(config: ValidationConfig, essayScore: number) {
    super(config);
    this.essayScore = essayScore;
    this.difficultyTier = getDifficultyTier(essayScore);
    this.tierThresholds = calculateTierThresholds(essayScore);
  }

  /**
   * Validate suggestion with tier-aware thresholds
   */
  async validateWithAdaptiveThresholds(
    context: AdaptiveValidationContext
  ): Promise<AdaptiveValidationResult> {

    // Step 1: Base validation (banned terms, passive voice, etc.)
    const baseValidation = await this.validate(context);

    // Step 2: Tier-specific validation
    const tierViolations = this.validateTierAppropriate(
      baseValidation,
      context
    );

    // Step 3: Calculate adaptive score
    const adaptiveScore = calculateAdaptiveScore(
      baseValidation.score,
      context.previousEssayScore
    );

    // Step 4: Generate tier-specific feedback
    const tierFeedback = this.generateTierFeedback(
      this.difficultyTier,
      baseValidation.score
    );

    // Step 5: Combine results
    const allFailures = [...baseValidation.failures, ...tierViolations];
    const criticalCount = allFailures.filter(f => f.severity === 'critical').length;
    const isValid = baseValidation.isValid && tierViolations.filter(f => f.severity === 'critical').length === 0;

    return {
      ...baseValidation,
      isValid,
      failures: allFailures,
      criticalCount,
      tierViolations,
      adaptiveScore,
      tierThresholds: this.tierThresholds,
      tierFeedback
    };
  }

  /**
   * Validate that suggestion is appropriate for essay tier
   *
   * Checks:
   * 1. Quality not too low (below tier minimum)
   * 2. Quality not too high (overshoots student capability)
   * 3. Complexity appropriate for tier
   * 4. Voice shift within tolerance
   */
  private validateTierAppropriate(
    validation: ValidationResult,
    context: AdaptiveValidationContext
  ): ValidationFailure[] {

    const failures: ValidationFailure[] = [];

    // Check 1: Minimum quality for tier
    if (validation.score < this.tierThresholds.minSuggestionQuality) {
      failures.push({
        rule: 'tier-minimum-quality',
        category: 'tier_appropriateness',
        severity: 'critical',
        message: `Suggestion quality (${validation.score}) below tier minimum (${this.tierThresholds.minSuggestionQuality}) for ${this.difficultyTier} tier`,
        evidence: context.text.substring(0, 100),
        suggestion: `This needs to be more sophisticated for ${this.difficultyTier} tier. Add more concrete details, sensory language, or emotional depth.`
      });
    }

    // Check 2: Maximum quality for tier (don't overshoot)
    if (validation.score > this.tierThresholds.maxSuggestionQuality) {
      failures.push({
        rule: 'tier-maximum-quality',
        category: 'tier_appropriateness',
        severity: 'warning',
        message: `Suggestion quality (${validation.score}) exceeds tier maximum (${this.tierThresholds.maxSuggestionQuality}) for ${this.difficultyTier} tier`,
        evidence: context.text.substring(0, 100),
        suggestion: `This might be too sophisticated for current essay tier. Simplify language while maintaining improvement. Student at ${context.currentEssayScore}/100 may not be ready for ${validation.score}/100 quality.`
      });
    }

    // Check 3: Sentence complexity (rough heuristic)
    const avgSentenceLength = this.calculateAvgSentenceLength(context.text);
    const complexityScore = this.estimateComplexityScore(avgSentenceLength);

    if (complexityScore > this.tierThresholds.maxSentenceComplexity) {
      failures.push({
        rule: 'tier-complexity-limit',
        category: 'tier_appropriateness',
        severity: 'warning',
        message: `Sentence complexity (${complexityScore}) exceeds tier limit (${this.tierThresholds.maxSentenceComplexity})`,
        evidence: `Average sentence length: ${avgSentenceLength} words`,
        suggestion: `Simplify sentence structure for ${this.difficultyTier} tier. Break long sentences into shorter ones.`
      });
    }

    // Check 4: Voice shift tolerance
    if (context.voiceMarkers && context.voiceMarkers.length > 0) {
      const voiceShift = this.estimateVoiceShift(
        context.originalText,
        context.text,
        context.voiceTone
      );

      if (voiceShift > this.tierThresholds.voiceShiftTolerance) {
        failures.push({
          rule: 'tier-voice-shift',
          category: 'tier_appropriateness',
          severity: 'warning',
          message: `Voice shift (${(voiceShift * 100).toFixed(0)}%) exceeds tier tolerance (${(this.tierThresholds.voiceShiftTolerance * 100).toFixed(0)}%)`,
          evidence: 'Voice changed significantly from original',
          suggestion: `Stay closer to original voice for ${this.difficultyTier} tier. Preserve student's authentic tone.`
        });
      }
    }

    return failures;
  }

  /**
   * Generate tier-specific feedback message
   */
  private generateTierFeedback(
    tier: DifficultyTier,
    score: number
  ): string {

    const difficulty = calculateDifficultyMultiplier(score);

    switch (tier) {
      case 'foundation':
        return `Foundation tier: Focus on clarity and concrete details. Score of ${score} is solid progress at ${difficulty}x difficulty.`;

      case 'developing':
        return `Developing tier: Building skills steadily. Score of ${score} shows good growth at ${difficulty}x difficulty.`;

      case 'competent':
        return `Competent tier: Refining craft. Score of ${score} represents quality work at ${difficulty}x difficulty.`;

      case 'strong':
        return `Strong tier: Advanced work. Score of ${score} is impressive at ${difficulty}x difficulty.`;

      case 'exceptional':
        return `Exceptional tier: Elite refinement. Score of ${score} is a remarkable achievement at ${difficulty}x difficulty.`;

      case 'masterful':
        return `Masterful tier: World-class polish. Score of ${score} is extraordinary at ${difficulty}x difficulty.`;
    }
  }

  /**
   * Calculate average sentence length (rough complexity heuristic)
   */
  private calculateAvgSentenceLength(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;

    const totalWords = sentences.reduce((sum, sentence) => {
      return sum + sentence.trim().split(/\s+/).length;
    }, 0);

    return Math.round(totalWords / sentences.length);
  }

  /**
   * Estimate complexity score from sentence length
   *
   * Rough mapping:
   * - 8-12 words: Grade 8 (simple)
   * - 13-17 words: Grade 10 (moderate)
   * - 18-22 words: Grade 12 (complex)
   * - 23+ words: College+ (very complex)
   */
  private estimateComplexityScore(avgSentenceLength: number): number {
    if (avgSentenceLength <= 12) return 8;
    if (avgSentenceLength <= 17) return 10;
    if (avgSentenceLength <= 22) return 12;
    if (avgSentenceLength <= 27) return 14;
    return 16;
  }

  /**
   * Estimate how much voice has shifted (0-1)
   *
   * Heuristic: Look at tone keywords, sentence structure changes
   *
   * 0.0 = identical voice
   * 0.5 = moderate shift
   * 1.0 = completely different voice
   */
  private estimateVoiceShift(
    original: string,
    suggested: string,
    voiceTone: string
  ): number {

    // Simple heuristic: Compare sentence length variance
    const origAvgLength = this.calculateAvgSentenceLength(original);
    const suggAvgLength = this.calculateAvgSentenceLength(suggested);

    const lengthDiff = Math.abs(suggAvgLength - origAvgLength);

    // Normalize: 0-10 word difference → 0-1 shift score
    const lengthShift = Math.min(1.0, lengthDiff / 10);

    // Check for tone keyword changes
    const casualMarkers = ['kinda', 'really', 'just', 'like', 'pretty'];
    const formalMarkers = ['furthermore', 'moreover', 'consequently', 'thus'];

    const origIsCasual = casualMarkers.some(m => original.toLowerCase().includes(m));
    const suggIsCasual = casualMarkers.some(m => suggested.toLowerCase().includes(m));
    const origIsFormal = formalMarkers.some(m => original.toLowerCase().includes(m));
    const suggIsFormal = formalMarkers.some(m => suggested.toLowerCase().includes(m));

    // If tone flipped (casual → formal or vice versa), add 0.3 shift
    const toneFlip = (origIsCasual && suggIsFormal) || (origIsFormal && suggIsCasual) ? 0.3 : 0;

    // Combine
    return Math.min(1.0, lengthShift + toneFlip);
  }

  /**
   * Get tier thresholds (for external use)
   */
  getTierThresholds(): TierThresholds {
    return this.tierThresholds;
  }

  /**
   * Get difficulty tier (for external use)
   */
  getDifficultyTier(): DifficultyTier {
    return this.difficultyTier;
  }
}
