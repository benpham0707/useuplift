/**
 * Output Validator - Core Validation Engine (Phase 15)
 *
 * This is the "Quality Gate" that ensures only world-class suggestions escape.
 * Unlike simple regex filters, this uses a hybrid approach:
 * - LLM-based validation for nuanced quality checks
 * - Deterministic checks for known patterns (as a fast pre-filter)
 * - Active Feedback Loop for retry with specific critique
 *
 * Philosophy:
 * - LLMs for nuance (tone, authenticity, teaching quality)
 * - Deterministic for speed (banned terms pre-check)
 * - Always provide specific, actionable feedback
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import type {
  ValidationContext,
  ValidationResult,
  ValidationFailure,
  ValidationRule,
  ValidationConfig,
  ValidationSeverity,
  ValidationCategory
} from './types';
import { DEFAULT_VALIDATION_CONFIG } from './types';

// ============================================================================
// VALIDATION SYSTEM PROMPT
// ============================================================================

const VALIDATION_SYSTEM_PROMPT = `You are a Quality Assurance Specialist ensuring college essay suggestions sound AUTHENTICALLY HUMAN.

**CORE PRINCIPLE:**
The writing should sound like a REAL PERSON processed their own experience and wrote about it themselves.
It should be authentic to THEM - their insights, their character, their unique perspective on what happened.

**THE AUTHENTICITY TEST:**
Ask yourself: "Could this have ONLY been written by this specific person?"
- If yes → authentic
- If anyone could have written it → not authentic

**WHAT MAKES WRITING FEEL AI-GENERATED OR INAUTHENTIC:**

1. **Overused/Cliché Language** - Language that feels templated, AI-generated, or like it came from a "how to write essays" guide. This includes:
   - Flowery/grandiose words that real teenagers don't use naturally
   - Phrases that sound impressive but say nothing specific
   - Language that feels like it's trying too hard to sound profound

2. **Generic Insights** - Realizations that anyone could have:
   - "I learned the value of hard work"
   - "I discovered how to persevere"
   - "This taught me about teamwork"
   - Ask: What did THIS person specifically learn that's unique to their experience?

3. **List-of-Accomplishments Format** - Even with specific details, listing achievements without emotional depth or vulnerability feels like a resume, not a story.

4. **Performed Vulnerability** - Mentioning struggle just as a setup for triumph, without genuine exploration of doubt, confusion, or growth.

5. **Missing the Person** - Writing that describes WHAT happened but not WHO this person is. The character, perspective, and voice should come through.

**WHAT MAKES WRITING FEEL AUTHENTICALLY HUMAN:**

1. **Specific Details Only They Would Know** - Not just "specific" but revealing of character
2. **Unique Angle/Perspective** - A way of seeing the experience that's distinctly theirs
3. **Genuine Reflection** - Not "I learned X" but actual processing of meaning
4. **Voice** - Word choices, rhythm, and tone that feel consistent and personal
5. **Vulnerability Without Performance** - Real uncertainty, doubt, or growth

**RATIONALE QUALITY:**
- Should teach a writing PRINCIPLE, not just describe what changed
- Should use collaborative language ("By doing X, we achieve Y") not editor language ("I changed X")
- Should be educational - the student learns something they can apply elsewhere

**Output Format:**
{
  "isValid": boolean,
  "qualityScore": number (0-100),
  "failures": [
    {
      "category": "ai_language" | "generic_insight" | "list_format" | "performed_vulnerability" | "missing_voice" | "passive_voice" | "rationale_quality" | "inauthenticity",
      "severity": "critical" | "warning" | "suggestion",
      "message": "Clear explanation of why this doesn't feel authentic",
      "evidence": "The specific text that triggered this",
      "suggestion": "How to make it more authentically human"
    }
  ],
  "strengths": ["What feels genuinely human about this"],
  "retryGuidance": "Specific instructions for making it more authentic"
}

**Your job: Protect authenticity. If it doesn't sound like a real person wrote it, flag it.**`;

// ============================================================================
// OUTPUT VALIDATOR CLASS
// ============================================================================

export class OutputValidator {
  private config: ValidationConfig;
  private validationRules: Map<string, ValidationRule>;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
    this.validationRules = new Map();
  }

  /**
   * Register a validation rule
   */
  registerRule(rule: ValidationRule): void {
    this.validationRules.set(rule.id, rule);
  }

  /**
   * Main validation entry point
   * Uses LLM for nuanced quality assessment
   */
  async validate(context: ValidationContext): Promise<ValidationResult> {
    console.log(`🔍 Validating suggestion (attempt ${context.attemptNumber})...`);

    // Step 1: Fast deterministic pre-checks (banned terms)
    const quickFailures = this.runDeterministicChecks(context);
    if (quickFailures.length > 0 && this.config.failOnCritical) {
      console.log(`   ⚠️ Failed deterministic checks (${quickFailures.length} issues)`);
      return this.buildValidationResult(quickFailures, context);
    }

    // Step 2: LLM-based comprehensive validation
    const llmValidation = await this.runLLMValidation(context);

    // Step 3: Combine results
    const allFailures = [...quickFailures, ...llmValidation.failures];

    return this.buildValidationResult(allFailures, context, llmValidation.qualityScore);
  }

  /**
   * Run fast deterministic checks (pre-filter)
   * These are structural/pattern checks, not word lists
   * The LLM handles nuanced authenticity detection
   */
  private runDeterministicChecks(context: ValidationContext): ValidationFailure[] {
    const failures: ValidationFailure[] = [];
    const textLower = context.text.toLowerCase();

    // Check 1: Passive voice patterns (structural, not word-based)
    const passivePatterns = [
      /\bwas\s+\w+ing\b/i,      // "was training", "was working"
      /\bwere\s+\w+ing\b/i,     // "were doing"
      /\bwas\s+\w+ed\b/i,       // "was discovered"
      /\bwere\s+\w+ed\b/i,      // "were found"
      /\bit\s+was\s+\w+ed\b/i,  // "it was learned"
    ];

    for (const pattern of passivePatterns) {
      const match = context.text.match(pattern);
      if (match) {
        failures.push({
          rule: 'passive-voice-pattern',
          category: 'passive_voice',
          severity: 'warning',
          message: 'Passive voice weakens agency - the student should be the actor',
          evidence: match[0],
          suggestion: 'Rewrite with the student as the active subject doing the action.'
        });
        break; // Only flag once
      }
    }

    // Check 2: "This taught me" / "I learned that" summary patterns
    const summaryPatterns = [
      /this\s+(taught|showed|helped)\s+me/i,
      /i\s+learned\s+that/i,
      /from\s+this[,]?\s+i\s+(realized|learned|understood)/i,
      /this\s+experience\s+(taught|showed)/i,
    ];

    for (const pattern of summaryPatterns) {
      const match = context.text.match(pattern);
      if (match) {
        failures.push({
          rule: 'summary-language',
          category: 'generic_insight',
          severity: 'warning',
          message: 'Summary language tells rather than shows - demonstrate the insight through action/detail instead',
          evidence: match[0],
          suggestion: 'Instead of stating what you learned, show the reader through specific moments or changed behavior.'
        });
        break;
      }
    }

    // Check 3: Rationale uses "I changed" (editor voice, not teaching voice)
    if (context.rationale) {
      const rationaleLower = context.rationale.toLowerCase();
      if (rationaleLower.includes('i changed') || rationaleLower.includes('i replaced') || rationaleLower.includes('i added')) {
        failures.push({
          rule: 'editor-voice-rationale',
          category: 'rationale_quality',
          severity: 'warning',
          message: 'Rationale uses editor voice ("I changed") instead of teaching voice ("By doing X, we achieve Y")',
          evidence: context.rationale.substring(0, 100),
          suggestion: 'Reframe to explain the writing principle and why it works, using collaborative "we" language.'
        });
      }

      // Check 4: Rationale is too short to be educational
      const rationaleWords = context.rationale.split(/\s+/).length;
      if (rationaleWords < 20) {
        failures.push({
          rule: 'short-rationale',
          category: 'rationale_quality',
          severity: 'suggestion',
          message: `Rationale is only ${rationaleWords} words - should be 30+ to be truly educational`,
          evidence: context.rationale,
          suggestion: 'Expand rationale to explain the writing principle and its psychological effect on readers.'
        });
      }
    }

    return failures;
  }

  /**
   * Run comprehensive LLM-based validation
   * This catches nuanced issues like tone, authenticity, teaching quality
   */
  private async runLLMValidation(context: ValidationContext): Promise<{
    failures: ValidationFailure[];
    qualityScore: number;
  }> {
    const prompt = this.buildValidationPrompt(context);

    try {
      const response = await callClaudeWithRetry(prompt, {
        systemPrompt: VALIDATION_SYSTEM_PROMPT,
        temperature: 0.1, // Low temperature for consistent validation
        maxTokens: 800,
        useJsonMode: true
      });

      const result = typeof response.content === 'string'
        ? JSON.parse(response.content)
        : response.content;

      // Transform LLM response to our ValidationFailure format
      const failures: ValidationFailure[] = (result.failures || []).map((f: any) => ({
        rule: 'llm-validation',
        category: f.category || 'voice_authenticity',
        severity: f.severity || 'warning',
        message: f.message || 'Quality issue detected',
        evidence: f.evidence || '',
        suggestion: f.suggestion || 'Revise for better quality'
      }));

      return {
        failures,
        qualityScore: result.qualityScore || 50
      };

    } catch (error) {
      console.error('❌ LLM validation failed:', error);
      // Fallback: assume it's okay but log the error
      return {
        failures: [],
        qualityScore: 60 // Mediocre score when validation fails
      };
    }
  }

  /**
   * Build the validation prompt for the LLM
   */
  private buildValidationPrompt(context: ValidationContext): string {
    return `
# VALIDATION REQUEST

## Suggested Text:
"${context.text}"

## Rationale:
"${context.rationale}"

## Context:
- **Type:** ${context.type}
- **Original Text:** "${context.originalText}"
- **Rubric Category:** ${context.rubricCategory}
- **Student Voice:** ${context.voiceTone}
- **Voice Markers:** ${context.voiceMarkers.join(', ')}
- **Attempt Number:** ${context.attemptNumber}

## Previous Failures (if any):
${context.previousFailures ? context.previousFailures.map(f => `- ${f.message}`).join('\n') : 'None (first attempt)'}

---

**Task:** Validate this suggestion against world-class standards. Be strict but fair.

**Focus Areas:**
1. Does the text sound authentic (like a real student, not AI)?
2. Does it avoid banned clichés and generic phrases?
3. Is it specific (concrete nouns, active verbs)?
4. Does the rationale teach a principle (not just describe the change)?
5. Does it match the student's voice markers?

**Return:** JSON with validation result.
`;
  }

  /**
   * Build final validation result
   */
  private buildValidationResult(
    failures: ValidationFailure[],
    context: ValidationContext,
    qualityScore?: number
  ): ValidationResult {
    const criticalCount = failures.filter(f => f.severity === 'critical').length;
    const warningCount = failures.filter(f => f.severity === 'warning').length;
    const suggestionCount = failures.filter(f => f.severity === 'suggestion').length;

    // Start with LLM score or base of 75 (above average)
    // The QA system's job is to find issues - the score should reflect issues found
    let baseScore = qualityScore || 75;

    // Apply penalties for failures found
    // Critical issues are serious problems (e.g., inauthenticity, AI language)
    // Warnings are structural issues (e.g., passive voice, summary language)
    // Suggestions are minor improvements
    const penalizedScore = baseScore - (criticalCount * 25) - (warningCount * 10) - (suggestionCount * 3);

    // Floor at 0, cap at base score (can't improve from failures)
    const score = Math.max(0, Math.min(penalizedScore, baseScore));

    // Determine if valid
    const isValid = (
      (this.config.failOnCritical ? criticalCount === 0 : true) &&
      (this.config.failOnWarning ? warningCount === 0 : true) &&
      score >= this.config.minQualityScore
    );

    // Determine if should retry
    const shouldRetry = !isValid && context.attemptNumber < this.config.maxRetries;

    // Generate retry guidance
    const retryGuidance = shouldRetry ? this.generateRetryGuidance(failures, context) : '';

    return {
      isValid,
      failures,
      score,
      criticalCount,
      warningCount,
      shouldRetry,
      retryGuidance
    };
  }

  /**
   * Generate specific retry guidance based on failures
   */
  private generateRetryGuidance(
    failures: ValidationFailure[],
    context: ValidationContext
  ): string {
    if (failures.length === 0) return '';

    const criticalFailures = failures.filter(f => f.severity === 'critical');
    const warningFailures = failures.filter(f => f.severity === 'warning');

    let guidance = `**VALIDATION FAILED - RETRY WITH CORRECTIONS:**\n\n`;

    if (criticalFailures.length > 0) {
      guidance += `**CRITICAL ISSUES (Must Fix):**\n`;
      criticalFailures.forEach((f, i) => {
        guidance += `${i + 1}. ${f.message}\n`;
        guidance += `   Evidence: "${f.evidence}"\n`;
        guidance += `   Fix: ${f.suggestion}\n\n`;
      });
    }

    if (warningFailures.length > 0) {
      guidance += `**WARNINGS:**\n`;
      warningFailures.forEach((f, i) => {
        guidance += `${i + 1}. ${f.message}\n`;
      });
    }

    // Add escalating constraints for repeated attempts
    if (context.attemptNumber > 1) {
      guidance += `\n**ESCALATED CONSTRAINTS (Attempt ${context.attemptNumber}):**\n`;
      guidance += `- AVOID all generic phrases completely\n`;
      guidance += `- Use ONLY specific, concrete nouns\n`;
      guidance += `- Show actions, not states\n`;
      guidance += `- Make every word count\n`;
    }

    return guidance;
  }
}

// ============================================================================
// HELPER: Simple Validation (for backwards compatibility)
// ============================================================================

/**
 * Simple validation function for quick checks
 * Uses only deterministic rules (no LLM calls)
 */
export function validateQuick(text: string, rationale: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Quick banned terms check
  const BANNED = ['tapestry', 'realm', 'testament', 'showcase', 'delve', 'underscore', 'training my brain', 'gave 110%'];
  const textLower = text.toLowerCase();

  for (const term of BANNED) {
    if (textLower.includes(term)) {
      issues.push(`Contains banned term: "${term}"`);
    }
  }

  // Quick passive voice check
  const passivePatterns = [
    /\bwas\s+\w+ing\b/i,  // "was training"
    /\bwere\s+\w+ing\b/i, // "were doing"
    /\bis\s+being\b/i,    // "is being"
  ];

  for (const pattern of passivePatterns) {
    if (pattern.test(text)) {
      issues.push('Contains passive voice construction');
      break;
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ValidationContext, ValidationResult, ValidationFailure, ValidationConfig };
