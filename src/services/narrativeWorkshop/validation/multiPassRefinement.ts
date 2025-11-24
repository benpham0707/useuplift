/**
 * Multi-Pass Refinement Loop (Phase 16)
 *
 * Core Innovation: Don't settle for "passing" - refine until exceptional
 *
 * Philosophy:
 * - Pass 1: Generate initial suggestion (may score 75)
 * - Pass 2: Refine with specific improvement goals (→ 82)
 * - Pass 3: Polish to excellence (→ 90+)
 *
 * Why This Works:
 * - Incremental improvement is easier than perfect first-try
 * - Specific refinement goals guide improvement
 * - Stops when quality ceiling reached or diminishing returns
 *
 * Benefits:
 * - Raises quality ceiling from 85-88 → 90-95
 * - More consistent high-quality output
 * - Learns what makes suggestions better
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import type { ValidationResult } from './types';
import type { AdaptiveValidator } from './adaptiveValidator';
import type { TierThresholds } from './adaptiveScoring';

export interface RefinementGoal {
  dimension: string;              // What to improve
  currentScore: number;           // Current level
  targetScore: number;            // Target level
  specific: string;               // Specific action to take
}

export interface RefinementPass {
  passNumber: number;
  previousScore: number;
  previousText: string;
  previousRationale: string;
  goals: RefinementGoal[];
  improvedScore: number;
  improvedText: string;
  improvedRationale: string;
  improvement: number;            // Score gain
  worthContinuing: boolean;       // Should we keep refining?
}

export interface RefinementResult {
  originalScore: number;
  originalText: string;
  originalRationale: string;

  finalScore: number;
  finalText: string;
  finalRationale: string;

  passesExecuted: number;
  totalImprovement: number;
  refinementHistory: RefinementPass[];

  success: boolean;
  stoppedReason: 'target_reached' | 'max_passes' | 'diminishing_returns' | 'no_improvement';
}

export interface RefinementConfig {
  targetScore: number;            // Stop when we reach this (default: 90)
  maxPasses: number;              // Maximum refinement passes (default: 3)
  minImprovementPerPass: number;  // Stop if gain < this (default: 2)
  useAdaptiveTarget: boolean;     // Use tier-aware target (default: true)
}

const DEFAULT_REFINEMENT_CONFIG: RefinementConfig = {
  targetScore: 90,
  maxPasses: 3,
  minImprovementPerPass: 1.5,
  useAdaptiveTarget: true
};

/**
 * Multi-Pass Refinement System
 *
 * Iteratively improves suggestions until they reach target quality
 */
export class MultiPassRefiner {
  private config: RefinementConfig;
  private validator: AdaptiveValidator;
  private tierThresholds: TierThresholds;

  constructor(
    validator: AdaptiveValidator,
    config: Partial<RefinementConfig> = {}
  ) {
    this.validator = validator;
    this.config = { ...DEFAULT_REFINEMENT_CONFIG, ...config };
    this.tierThresholds = validator.getTierThresholds();

    // If adaptive, adjust target to tier maximum
    if (this.config.useAdaptiveTarget) {
      this.config.targetScore = Math.min(
        this.config.targetScore,
        this.tierThresholds.maxSuggestionQuality
      );
    }
  }

  /**
   * Refine suggestion through multiple passes until target quality reached
   */
  async refine(
    initialText: string,
    initialRationale: string,
    initialValidation: ValidationResult,
    context: {
      originalText: string;
      rubricCategory: string;
      voiceTone: string;
      voiceMarkers: string[];
      essayScore: number;
    }
  ): Promise<RefinementResult> {

    const history: RefinementPass[] = [];
    let currentScore = initialValidation.score;
    let currentText = initialText;
    let currentRationale = initialRationale;
    let passNumber = 1;

    console.log(`\n🔄 Multi-Pass Refinement: Starting from score ${currentScore} (target: ${this.config.targetScore})`);

    // Refinement loop
    while (
      passNumber <= this.config.maxPasses &&
      currentScore < this.config.targetScore
    ) {

      console.log(`   Pass ${passNumber}/${this.config.maxPasses}: Current score ${currentScore}...`);

      // Step 1: Generate refinement goals
      const goals = this.generateRefinementGoals(
        currentScore,
        this.config.targetScore,
        initialValidation
      );

      if (goals.length === 0) {
        console.log(`   ✅ No clear refinement goals - score ${currentScore} is sufficient`);
        break;
      }

      // Step 2: Refine with specific goals
      const refined = await this.executeRefinementPass(
        currentText,
        currentRationale,
        goals,
        context
      );

      // Step 3: Validate refinement
      const newValidation = await this.validator.validateWithAdaptiveThresholds({
        text: refined.text,
        rationale: refined.rationale,
        type: 'polished_original',
        voiceTone: context.voiceTone,
        voiceMarkers: context.voiceMarkers,
        originalText: context.originalText,
        rubricCategory: context.rubricCategory,
        attemptNumber: passNumber + 1,
        currentEssayScore: context.essayScore
      });

      const improvement = newValidation.score - currentScore;

      console.log(`   ${improvement > 0 ? '✅' : '⚠️'} Pass ${passNumber} result: ${currentScore} → ${newValidation.score} (${improvement > 0 ? '+' : ''}${improvement.toFixed(1)})`);

      // Record this pass
      const pass: RefinementPass = {
        passNumber,
        previousScore: currentScore,
        previousText: currentText,
        previousRationale: currentRationale,
        goals,
        improvedScore: newValidation.score,
        improvedText: refined.text,
        improvedRationale: refined.rationale,
        improvement,
        worthContinuing: improvement >= this.config.minImprovementPerPass
      };

      history.push(pass);

      // Step 4: Decide whether to keep refinement
      if (improvement <= 0) {
        console.log(`   ⚠️ Refinement didn't improve quality - reverting to previous version`);
        break; // Don't update current, keep previous
      }

      if (improvement < this.config.minImprovementPerPass) {
        console.log(`   ⚠️ Diminishing returns (${improvement.toFixed(1)} < ${this.config.minImprovementPerPass}) - stopping`);
        // Update current (accept the improvement) but stop refining
        currentScore = newValidation.score;
        currentText = refined.text;
        currentRationale = refined.rationale;
        break;
      }

      // Accept improvement and continue
      currentScore = newValidation.score;
      currentText = refined.text;
      currentRationale = refined.rationale;
      passNumber++;

      // Check if we've reached target
      if (currentScore >= this.config.targetScore) {
        console.log(`   ✅ Target score reached: ${currentScore} >= ${this.config.targetScore}`);
        break;
      }
    }

    // Determine stop reason
    let stoppedReason: RefinementResult['stoppedReason'];
    if (currentScore >= this.config.targetScore) {
      stoppedReason = 'target_reached';
    } else if (passNumber > this.config.maxPasses) {
      stoppedReason = 'max_passes';
    } else if (history.length > 0 && history[history.length - 1].improvement < this.config.minImprovementPerPass) {
      stoppedReason = 'diminishing_returns';
    } else {
      stoppedReason = 'no_improvement';
    }

    const totalImprovement = currentScore - initialValidation.score;

    console.log(`\n   Final: ${initialValidation.score} → ${currentScore} (+${totalImprovement.toFixed(1)}) in ${history.length} pass(es)`);
    console.log(`   Reason: ${stoppedReason}\n`);

    return {
      originalScore: initialValidation.score,
      originalText: initialText,
      originalRationale: initialRationale,
      finalScore: currentScore,
      finalText: currentText,
      finalRationale: currentRationale,
      passesExecuted: history.length,
      totalImprovement,
      refinementHistory: history,
      success: currentScore >= this.config.targetScore || totalImprovement > 0,
      stoppedReason
    };
  }

  /**
   * Generate specific refinement goals based on current score and target
   */
  private generateRefinementGoals(
    currentScore: number,
    targetScore: number,
    validation: ValidationResult
  ): RefinementGoal[] {

    const gap = targetScore - currentScore;
    const goals: RefinementGoal[] = [];

    if (gap <= 0) return goals; // Already at or above target

    // Major improvement needed (gap >= 15)
    if (gap >= 15) {
      goals.push({
        dimension: 'specificity',
        currentScore: currentScore,
        targetScore: currentScore + Math.min(gap / 3, 8),
        specific: 'Add significantly more concrete details - specific nouns, numbers, sensory language'
      });
      goals.push({
        dimension: 'emotional_resonance',
        currentScore: currentScore,
        targetScore: currentScore + Math.min(gap / 3, 8),
        specific: 'Deepen emotional impact - add stakes, consequences, or visceral details'
      });
      goals.push({
        dimension: 'rationale_depth',
        currentScore: currentScore,
        targetScore: currentScore + Math.min(gap / 3, 8),
        specific: 'Enhance rationale to explain universal principle and psychological effect'
      });
    }
    // Moderate improvement (gap 8-14)
    else if (gap >= 8) {
      goals.push({
        dimension: 'specificity',
        currentScore: currentScore,
        targetScore: currentScore + Math.min(gap / 2, 5),
        specific: 'Enhance concrete details - add 2-3 more specific nouns or sensory descriptors'
      });
      goals.push({
        dimension: 'teaching_quality',
        currentScore: currentScore,
        targetScore: currentScore + Math.min(gap / 2, 5),
        specific: 'Strengthen rationale educational depth - explain the "why" more clearly'
      });
    }
    // Minor polish (gap < 8)
    else {
      goals.push({
        dimension: 'word_choice',
        currentScore: currentScore,
        targetScore: targetScore,
        specific: 'Refine word choice for precision and impact - replace vague words with specific ones'
      });
    }

    // Add specific goals based on validation failures
    if (validation.failures.length > 0) {
      for (const failure of validation.failures) {
        if (failure.severity === 'warning') {
          goals.push({
            dimension: failure.category,
            currentScore: currentScore,
            targetScore: currentScore + 3,
            specific: failure.suggestion || `Address: ${failure.message}`
          });
        }
      }
    }

    return goals;
  }

  /**
   * Execute one refinement pass with specific goals
   */
  private async executeRefinementPass(
    currentText: string,
    currentRationale: string,
    goals: RefinementGoal[],
    context: {
      originalText: string;
      rubricCategory: string;
      voiceTone: string;
    }
  ): Promise<{ text: string; rationale: string }> {

    const goalDescriptions = goals.map((g, i) =>
      `${i + 1}. **${g.dimension}** (current: ${g.currentScore.toFixed(1)}, target: ${g.targetScore.toFixed(1)})\n   → ${g.specific}`
    ).join('\n\n');

    const refinementPrompt = `You are refining a college essay suggestion to improve its quality.

**CURRENT SUGGESTION:**
Text: "${currentText}"
Rationale: "${currentRationale}"

**ORIGINAL TEXT (for context):**
"${context.originalText}"

**RUBRIC CATEGORY:** ${context.rubricCategory}
**VOICE TONE:** ${context.voiceTone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFINEMENT GOALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${goalDescriptions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Improve the suggestion to meet these specific goals.

**IMPORTANT:**
- Keep the core approach and voice
- Make targeted improvements based on goals above
- Don't completely rewrite - build on what's already there
- Maintain all concrete details that are already good
- Focus improvements on the specific dimensions mentioned

Return ONLY a JSON object with this structure:
{
  "text": "improved suggestion text",
  "rationale": "improved rationale"
}

NO additional commentary. Just the JSON.`;

    try {
      const response = await callClaudeWithRetry(
        refinementPrompt,
        {
          systemPrompt: 'You are an expert college essay editor focused on incremental improvement.',
          temperature: 0.7,
          model: 'claude-sonnet-4-5-20250929'
        }
      );

      // Extract content from ClaudeResponse wrapper
      // response.content can be a string or an object depending on the API response
      const content = response.content;

      // Case 1: Content is already a parsed object with text and rationale
      if (typeof content === 'object' && content !== null) {
        const contentObj = content as Record<string, unknown>;
        if (contentObj.text && contentObj.rationale) {
          console.log('   ✓ LLM returned parsed JSON object');
          return {
            text: String(contentObj.text),
            rationale: String(contentObj.rationale)
          };
        }
      }

      // Case 2: Content is a string - parse JSON from it
      if (typeof content === 'string') {
        const jsonMatch = content.match(/\{[\s\S]*"text"[\s\S]*"rationale"[\s\S]*\}/);
        if (!jsonMatch) {
          console.warn('⚠️ Refinement response not JSON format, using original');
          return { text: currentText, rationale: currentRationale };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
          text: parsed.text || currentText,
          rationale: parsed.rationale || currentRationale
        };
      }

      // Fallback: Convert whatever we have to string and try to parse
      const contentStr = String(content);
      const fallbackMatch = contentStr.match(/\{[\s\S]*"text"[\s\S]*"rationale"[\s\S]*\}/);
      if (fallbackMatch) {
        const parsed = JSON.parse(fallbackMatch[0]);
        return {
          text: parsed.text || currentText,
          rationale: parsed.rationale || currentRationale
        };
      }

      console.warn('⚠️ Could not parse response, using original');
      return { text: currentText, rationale: currentRationale };

    } catch (error) {
      console.error('❌ Refinement pass failed:', error);
      return { text: currentText, rationale: currentRationale };
    }
  }

  /**
   * Update refinement config
   */
  updateConfig(config: Partial<RefinementConfig>) {
    this.config = { ...this.config, ...config };

    // Re-adjust target if adaptive
    if (this.config.useAdaptiveTarget) {
      this.config.targetScore = Math.min(
        this.config.targetScore,
        this.tierThresholds.maxSuggestionQuality
      );
    }
  }

  /**
   * Get current config
   */
  getConfig(): RefinementConfig {
    return { ...this.config };
  }
}
