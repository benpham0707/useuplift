/**
 * Retry Orchestrator - Active Feedback Loop (Phase 15)
 *
 * This component implements the "Active Feedback Loop" that:
 * 1. Detects failing suggestions
 * 2. Generates specific critique
 * 3. Retries generation with enhanced constraints
 * 4. Tracks retry history for learning
 *
 * Philosophy:
 * - Never give up on the first try
 * - Always provide specific, actionable feedback
 * - Escalate constraints on each retry
 * - Learn from repeated failures
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import { OutputValidator } from './outputValidator';
import {
  ValidationContext,
  ValidationResult,
  ValidationFailure,
  RetryResult
} from './types';

// ============================================================================
// RETRY ORCHESTRATOR
// ============================================================================

export class RetryOrchestrator {
  private validator: OutputValidator;
  private maxRetries: number;

  constructor(validator: OutputValidator, maxRetries: number = 2) {
    this.validator = validator;
    this.maxRetries = maxRetries;
  }

  /**
   * Main orchestration: Try generation -> validate -> retry if needed
   *
   * @param generateFn - Function that generates a suggestion
   * @param baseContext - Base validation context
   * @returns Retry result with final suggestion or failure info
   */
  async orchestrate(
    generateFn: (retryGuidance?: string, attemptNumber?: number) => Promise<any>,
    baseContext: Omit<ValidationContext, 'attemptNumber' | 'previousFailures'>
  ): Promise<RetryResult> {
    const retryHistory: Array<{
      attempt: number;
      failures: ValidationFailure[];
      guidance: string;
    }> = [];

    let attemptNumber = 1;
    let previousFailures: ValidationFailure[] = [];
    let lastValidation: ValidationResult | null = null;

    while (attemptNumber <= this.maxRetries + 1) {
      console.log(`   🔄 Generation attempt ${attemptNumber}/${this.maxRetries + 1}`);

      // Step 1: Generate suggestion
      const retryGuidance = attemptNumber > 1 ? lastValidation?.retryGuidance : undefined;
      const suggestion = await generateFn(retryGuidance, attemptNumber);

      if (!suggestion || !suggestion.text) {
        console.error(`   ❌ Generation failed on attempt ${attemptNumber}`);
        attemptNumber++;
        continue;
      }

      // Step 2: Build validation context
      const validationContext: ValidationContext = {
        ...baseContext,
        text: suggestion.text,
        rationale: suggestion.rationale || '',
        attemptNumber,
        previousFailures: attemptNumber > 1 ? previousFailures : undefined
      };

      // Step 3: Validate
      lastValidation = await this.validator.validate(validationContext);

      // Step 4: Record history
      retryHistory.push({
        attempt: attemptNumber,
        failures: lastValidation.failures,
        guidance: lastValidation.retryGuidance
      });

      // Step 5: Check if valid
      if (lastValidation.isValid) {
        console.log(`   ✅ Validation passed on attempt ${attemptNumber} (score: ${lastValidation.score})`);
        return {
          success: true,
          suggestion,
          attemptsMade: attemptNumber,
          finalValidation: lastValidation,
          retryHistory
        };
      }

      // Step 6: Check if should retry
      if (!lastValidation.shouldRetry) {
        console.log(`   ⚠️ Validation failed, no more retries (attempt ${attemptNumber})`);
        break;
      }

      // Step 7: Prepare for retry
      console.log(`   ⚠️ Validation failed (${lastValidation.criticalCount} critical, ${lastValidation.warningCount} warnings)`);
      console.log(`   🔁 Retrying with specific guidance...`);

      previousFailures = lastValidation.failures;
      attemptNumber++;
    }

    // All retries exhausted
    console.error(`   ❌ All ${attemptNumber - 1} attempts failed validation`);

    return {
      success: false,
      suggestion: null,
      attemptsMade: attemptNumber - 1,
      finalValidation: lastValidation!,
      retryHistory
    };
  }

  /**
   * Generate enhanced prompt for retry
   * This injects specific critique into the generation context
   */
  buildEnhancedPrompt(
    originalPrompt: string,
    retryGuidance: string,
    attemptNumber: number
  ): string {
    let enhancedPrompt = originalPrompt;

    // Inject retry guidance at the top
    enhancedPrompt = `
${retryGuidance}

---

${originalPrompt}
`;

    // Add escalating constraints
    if (attemptNumber >= 2) {
      enhancedPrompt += `

---

**ESCALATED QUALITY REQUIREMENTS (Attempt ${attemptNumber}):**
- You MUST avoid all AI clichés (tapestry, realm, testament, showcase, delve)
- You MUST use active voice (avoid "was doing", "were being")
- You MUST use specific, concrete nouns (not "things", "aspects", "stuff")
- You MUST show actions, not summarize effort
- Your rationale MUST explain principles, not just describe changes
`;
    }

    if (attemptNumber >= 3) {
      enhancedPrompt += `

**FINAL ATTEMPT - MAXIMUM STRICTNESS:**
- Every sentence must have a specific noun (not abstract concepts)
- Every verb must be active and concrete
- No generic motivation language whatsoever
- Rationale must be educational and uplifting
`;
    }

    return enhancedPrompt;
  }
}

// ============================================================================
// HELPER: Integrate Retry into Generation Flow
// ============================================================================

/**
 * Wrapper function that adds retry logic to any generation function
 *
 * Example usage:
 * ```typescript
 * const result = await withRetry(
 *   async (guidance, attempt) => await generateSuggestion(...),
 *   validationContext,
 *   validator
 * );
 * ```
 */
export async function withRetry(
  generateFn: (retryGuidance?: string, attemptNumber?: number) => Promise<any>,
  baseContext: Omit<ValidationContext, 'attemptNumber' | 'previousFailures'>,
  validator: OutputValidator,
  maxRetries: number = 2
): Promise<RetryResult> {
  const orchestrator = new RetryOrchestrator(validator, maxRetries);
  return await orchestrator.orchestrate(generateFn, baseContext);
}
