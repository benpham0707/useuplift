/**
 * API Retry Utility
 *
 * Provides robust retry logic for Anthropic API calls with:
 * - Exponential backoff
 * - Rate limit detection and handling
 * - Overload error recovery
 * - Detailed logging for debugging
 *
 * Cost: No additional API cost (retries are free)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Initial delay between retries in ms (default: 1000) */
  initialDelayMs: number;
  /** Maximum delay between retries in ms (default: 30000) */
  maxDelayMs: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier: number;
  /** Whether to add jitter to prevent thundering herd (default: true) */
  addJitter: boolean;
  /** Operation name for logging */
  operationName?: string;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDelayMs: number;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  addJitter: true,
  operationName: 'API call',
};

// ============================================================================
// ERROR DETECTION
// ============================================================================

/**
 * Determine if an error is retryable
 *
 * Retryable errors:
 * - Rate limit errors (429)
 * - Server overload errors (529)
 * - Temporary server errors (500, 502, 503, 504)
 * - Network timeouts
 *
 * Non-retryable errors:
 * - Authentication errors (401)
 * - Bad request errors (400)
 * - Not found errors (404)
 * - Invalid API key
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Check for specific Anthropic errors
    if (message.includes('rate_limit') || message.includes('rate limit')) {
      return true;
    }
    if (message.includes('overloaded') || message.includes('overload')) {
      return true;
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return true;
    }
    if (message.includes('econnreset') || message.includes('econnrefused')) {
      return true;
    }
    if (message.includes('503') || message.includes('502') || message.includes('504')) {
      return true;
    }
    if (message.includes('500') && !message.includes('invalid')) {
      return true;
    }

    // Check error name
    if (name.includes('timeout') || name.includes('abort')) {
      return true;
    }

    // Non-retryable errors
    if (message.includes('401') || message.includes('authentication')) {
      return false;
    }
    if (message.includes('400') || message.includes('invalid request')) {
      return false;
    }
    if (message.includes('invalid_api_key') || message.includes('invalid api key')) {
      return false;
    }
  }

  // Check for HTTP-like error objects
  if (typeof error === 'object' && error !== null) {
    const httpError = error as { status?: number; statusCode?: number };
    const status = httpError.status || httpError.statusCode;
    if (status) {
      // Retry on rate limit, overload, and server errors
      return status === 429 || status === 529 || (status >= 500 && status < 600);
    }
  }

  // Default: don't retry unknown errors
  return false;
}

/**
 * Get recommended delay from error headers (if available)
 */
function getRetryAfterMs(error: unknown): number | null {
  if (typeof error === 'object' && error !== null) {
    const httpError = error as {
      headers?: { 'retry-after'?: string; 'x-ratelimit-reset'?: string };
    };

    if (httpError.headers) {
      // Check Retry-After header
      const retryAfter = httpError.headers['retry-after'];
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds)) {
          return seconds * 1000;
        }
      }

      // Check rate limit reset header
      const resetTime = httpError.headers['x-ratelimit-reset'];
      if (resetTime) {
        const resetMs = parseInt(resetTime, 10) * 1000;
        const now = Date.now();
        if (resetMs > now) {
          return resetMs - now;
        }
      }
    }
  }

  return null;
}

// ============================================================================
// MAIN RETRY FUNCTION
// ============================================================================

/**
 * Execute a function with retry logic
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration (optional)
 * @returns Promise with the function result
 * @throws Last error if all retries fail
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => anthropic.messages.create({ ... }),
 *   { operationName: 'SemanticClicheAnalyzer.analyze' }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const { maxRetries, initialDelayMs, maxDelayMs, backoffMultiplier, addJitter, operationName } =
    fullConfig;

  let lastError: Error | undefined;
  let currentDelay = initialDelayMs;
  let totalDelay = 0;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if this is the last attempt
      if (attempt > maxRetries) {
        console.error(
          `[${operationName}] All ${maxRetries} retries failed. Last error:`,
          lastError.message
        );
        throw lastError;
      }

      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.error(`[${operationName}] Non-retryable error:`, lastError.message);
        throw lastError;
      }

      // Calculate delay
      let delayMs = currentDelay;

      // Check for server-recommended delay
      const retryAfter = getRetryAfterMs(error);
      if (retryAfter !== null && retryAfter > 0) {
        delayMs = Math.min(retryAfter, maxDelayMs);
        console.log(`[${operationName}] Using server-recommended delay: ${delayMs}ms`);
      }

      // Add jitter to prevent thundering herd
      if (addJitter) {
        const jitter = Math.random() * 0.3 * delayMs; // Up to 30% jitter
        delayMs = Math.floor(delayMs + jitter);
      }

      // Cap at max delay
      delayMs = Math.min(delayMs, maxDelayMs);

      console.log(
        `[${operationName}] Attempt ${attempt}/${maxRetries + 1} failed: ${lastError.message}. ` +
          `Retrying in ${delayMs}ms...`
      );

      // Wait before retry
      await sleep(delayMs);
      totalDelay += delayMs;

      // Update delay for next retry (exponential backoff)
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error('Unknown error during retry');
}

/**
 * Execute a function with retry, returning detailed result instead of throwing
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration (optional)
 * @returns Promise with detailed retry result
 *
 * @example
 * ```typescript
 * const result = await withRetryDetailed(
 *   () => anthropic.messages.create({ ... }),
 *   { operationName: 'SemanticClicheAnalyzer.analyze' }
 * );
 *
 * if (result.success) {
 *   console.log('Success after', result.attempts, 'attempts');
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts:', result.error);
 * }
 * ```
 */
export async function withRetryDetailed<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const { maxRetries, initialDelayMs, maxDelayMs, backoffMultiplier, addJitter, operationName } =
    fullConfig;

  let lastError: Error | undefined;
  let currentDelay = initialDelayMs;
  let totalDelay = 0;
  let attempts = 0;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    attempts = attempt;

    try {
      const result = await fn();
      return {
        success: true,
        result,
        attempts,
        totalDelayMs: totalDelay,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if this is the last attempt
      if (attempt > maxRetries) {
        return {
          success: false,
          error: lastError,
          attempts,
          totalDelayMs: totalDelay,
        };
      }

      // Check if error is retryable
      if (!isRetryableError(error)) {
        return {
          success: false,
          error: lastError,
          attempts,
          totalDelayMs: totalDelay,
        };
      }

      // Calculate delay
      let delayMs = currentDelay;

      const retryAfter = getRetryAfterMs(error);
      if (retryAfter !== null && retryAfter > 0) {
        delayMs = Math.min(retryAfter, maxDelayMs);
      }

      if (addJitter) {
        const jitter = Math.random() * 0.3 * delayMs;
        delayMs = Math.floor(delayMs + jitter);
      }

      delayMs = Math.min(delayMs, maxDelayMs);

      console.log(
        `[${operationName}] Attempt ${attempt}/${maxRetries + 1} failed. Retrying in ${delayMs}ms...`
      );

      await sleep(delayMs);
      totalDelay += delayMs;

      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
    }
  }

  return {
    success: false,
    error: lastError || new Error('Unknown error'),
    attempts,
    totalDelayMs: totalDelay,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a pre-configured retry function for a specific service
 *
 * @example
 * ```typescript
 * const retry = createRetryFunction('SemanticClicheAnalyzer');
 *
 * const result = await retry(() => this.anthropic.messages.create({ ... }));
 * ```
 */
export function createRetryFunction(
  serviceName: string,
  defaultConfig: Partial<RetryConfig> = {}
): <T>(fn: () => Promise<T>, config?: Partial<RetryConfig>) => Promise<T> {
  return <T>(fn: () => Promise<T>, config?: Partial<RetryConfig>) => {
    return withRetry(fn, {
      ...defaultConfig,
      ...config,
      operationName: config?.operationName || serviceName,
    });
  };
}
