/**
 * Output Validation Types
 *
 * Type definitions for the Phase 15 Output Validation Layer.
 * This system ensures that only world-class suggestions escape the Surgical Editor.
 *
 * Architecture:
 * - ValidationRule: Individual quality check (e.g., banned terms, passive voice)
 * - ValidationResult: Outcome of running validation
 * - ValidationContext: Input data for validation
 * - RetryStrategy: How to improve on validation failure
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Severity of a validation failure
 * - critical: Must be fixed (e.g., banned AI clichés)
 * - warning: Should be fixed (e.g., weak verb usage)
 * - suggestion: Nice to fix (e.g., could be more specific)
 */
export type ValidationSeverity = 'critical' | 'warning' | 'suggestion';

/**
 * Category of validation failure
 * Used for organizing failures and generating targeted critiques
 */
export type ValidationCategory =
  | 'banned_terms'          // AI clichés (tapestry, realm, testament)
  | 'passive_voice'         // Passive constructions
  | 'abstract_openers'      // "It is...", "There are..."
  | 'cliche_metaphor'       // Overused comparisons
  | 'generic_determination' // Weak motivation language
  | 'weak_belief_statement' // "I believe" without substance
  | 'summary_language'      // "This taught me..."
  | 'rationale_quality'     // Teaching protocol violations
  | 'word_economy'          // Unnecessary wordiness
  | 'voice_authenticity'    // Doesn't match student voice
  | 'tier_appropriateness'; // Phase 16: Score appropriate for essay tier

/**
 * Result of a single validation rule execution
 */
export interface ValidationFailure {
  rule: string;              // Rule identifier (e.g., "banned-terms")
  category: ValidationCategory;
  severity: ValidationSeverity;
  message: string;           // Human-readable explanation
  evidence: string;          // The problematic text
  suggestion: string;        // How to fix it
  location?: {               // Optional: where in the text
    start: number;
    end: number;
  };
}

/**
 * Overall validation result for a suggestion
 */
export interface ValidationResult {
  isValid: boolean;          // Overall pass/fail
  failures: ValidationFailure[];
  score: number;             // 0-100 quality score
  criticalCount: number;     // Number of critical failures
  warningCount: number;      // Number of warnings

  // For retry logic
  shouldRetry: boolean;      // Should we retry generation?
  retryGuidance: string;     // Specific instructions for retry
}

/**
 * Context provided to validation rules
 */
export interface ValidationContext {
  text: string;              // The suggestion text to validate
  rationale: string;         // The rationale to validate
  type: 'polished_original' | 'voice_amplifier' | 'divergent_strategy';

  // Student context
  voiceTone: string;         // e.g., "Earnest and reflective"
  voiceMarkers: string[];    // e.g., ["Uses dashes", "Short sentences"]

  // Original context
  originalText: string;      // What we're replacing
  rubricCategory: string;    // e.g., "show_dont_tell_craft"

  // Metadata
  attemptNumber: number;     // 1st try, 2nd try, etc.
  previousFailures?: ValidationFailure[]; // From previous attempts
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Interface for validation rules
 * Each rule implements a specific quality check
 */
export interface ValidationRule {
  id: string;                // Unique identifier
  name: string;              // Human-readable name
  description: string;       // What this rule checks for
  category: ValidationCategory;
  severity: ValidationSeverity;

  /**
   * Execute the validation check
   * @param context - The validation context
   * @returns Array of failures (empty if passes)
   */
  validate(context: ValidationContext): ValidationFailure[];

  /**
   * Generate specific retry guidance for this rule
   * @param failures - The failures detected
   * @returns Specific instructions for retry
   */
  generateRetryGuidance(failures: ValidationFailure[]): string;
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Strategy for retry attempts
 */
export interface RetryStrategy {
  maxAttempts: number;       // Maximum retry attempts (default: 2)
  escalate: boolean;         // Escalate constraints on each retry?

  /**
   * Build enhanced prompt for retry
   * @param originalPrompt - The original generation prompt
   * @param failures - What failed in previous attempt
   * @param attemptNumber - Which retry this is (1, 2, etc.)
   * @returns Enhanced prompt with specific corrections
   */
  buildRetryPrompt(
    originalPrompt: string,
    failures: ValidationFailure[],
    attemptNumber: number
  ): string;
}

/**
 * Result of retry orchestration
 */
export interface RetryResult {
  success: boolean;          // Did we get a valid suggestion?
  suggestion: any;           // The final suggestion (if success)
  attemptsMade: number;      // How many tries
  finalValidation: ValidationResult;
  retryHistory: Array<{
    attempt: number;
    failures: ValidationFailure[];
    guidance: string;
  }>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration for the validation system
 */
export interface ValidationConfig {
  // Which rules to enable
  enabledRules: string[];    // Rule IDs to use

  // Severity thresholds
  failOnCritical: boolean;   // Fail validation if critical issues found
  failOnWarning: boolean;    // Fail validation if warnings found

  // Retry configuration
  enableRetry: boolean;      // Enable retry loop
  maxRetries: number;        // Max retry attempts
  escalateConstraints: boolean; // Escalate on each retry

  // Quality thresholds
  minQualityScore: number;   // Minimum quality score (0-100)

  // Logging
  logFailures: boolean;      // Log validation failures
  logRetries: boolean;       // Log retry attempts
}

/**
 * Default configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  enabledRules: [
    'banned-terms',
    'passive-voice',
    'abstract-openers',
    'cliche-metaphor',
    'generic-determination',
    'rationale-quality'
  ],
  failOnCritical: true,
  failOnWarning: false,
  enableRetry: true,
  maxRetries: 2,
  escalateConstraints: true,
  minQualityScore: 70,
  logFailures: true,
  logRetries: true
};

// ============================================================================
// METRICS
// ============================================================================

/**
 * Validation metrics for tracking quality over time
 */
export interface ValidationMetrics {
  totalValidations: number;
  passedFirstTry: number;
  passedAfterRetry: number;
  failedAll: number;

  // By category
  failuresByCategory: Record<ValidationCategory, number>;

  // By severity
  criticalFailures: number;
  warningFailures: number;

  // Retry statistics
  averageRetries: number;
  maxRetriesHit: number;

  // Quality scores
  averageQualityScore: number;
  qualityScoreDistribution: {
    excellent: number;  // 90-100
    good: number;       // 70-89
    fair: number;       // 50-69
    poor: number;       // 0-49
  };
}
