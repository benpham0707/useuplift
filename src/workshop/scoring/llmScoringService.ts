/**
 * LLM Scoring Service
 *
 * Wraps the Claude API integration layer for the hybrid scoring pipeline.
 * Provides Haiku and Sonnet calls with:
 * - Prompt caching on system prompts
 * - 1 retry with exponential backoff on 429/5xx errors
 * - Token usage tracking per call
 * - Batched concurrent calls with configurable concurrency
 */

import {
  callClaude,
  ClaudeAPIError,
  type ClaudeResponse,
} from '../../lib/llm/claude';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-5-20250929';

/** Default concurrency limit for batchCall */
const DEFAULT_CONCURRENCY = 4;

/** Max retries for transient errors (1 retry = 2 total attempts) */
const MAX_RETRIES = 1;

// ============================================================================
// TYPES
// ============================================================================

export interface LLMCallResult {
  raw: string;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface BatchCallInput {
  tier: 'haiku' | 'sonnet';
  systemPrompt: string;
  userPrompt: string;
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determine whether an error is retryable (429 rate limit or 5xx server errors).
 */
function isRetryable(error: unknown): boolean {
  if (error instanceof ClaudeAPIError) {
    return error.isRateLimit || error.isServerError || error.isOverloaded;
  }
  if (error instanceof Error) {
    return error.message.includes('429')
      || error.message.includes('500')
      || error.message.includes('502')
      || error.message.includes('503')
      || error.message.includes('529');
  }
  return false;
}

/**
 * Call Claude with a single retry on transient errors.
 * Uses exponential backoff: 1s base * 2^attempt + jitter.
 */
async function callWithRetry(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<LLMCallResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response: ClaudeResponse<string> = await callClaude({
        model,
        systemPrompt,
        userPrompt,
        cacheSystemPrompt: true,
        temperature: 0.3,
        maxTokens: 2048,
      });

      return {
        raw: typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content),
        tokenUsage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (isRetryable(error) && attempt < MAX_RETRIES) {
        const baseMs = 1000;
        const waitTime = baseMs * Math.pow(2, attempt) + Math.random() * baseMs;
        console.warn(
          `[LLMScoringService] Retry ${attempt + 1}/${MAX_RETRIES} after ${Math.round(waitTime)}ms — ${lastError.message.substring(0, 100)}`
        );
        await sleep(waitTime);
        continue;
      }

      // Non-retryable or final attempt
      throw lastError;
    }
  }

  // Should not reach here, but TypeScript needs it
  throw lastError || new Error('[LLMScoringService] Max retries exceeded');
}

// ============================================================================
// SERVICE
// ============================================================================

class LLMScoringService {
  /**
   * Call Haiku for heuristic+haiku dimensions.
   * System prompt is cached for efficiency across repeated calls.
   */
  async callHaiku(systemPrompt: string, userPrompt: string): Promise<LLMCallResult> {
    return callWithRetry(HAIKU_MODEL, systemPrompt, userPrompt);
  }

  /**
   * Call Sonnet for heuristic+sonnet dimensions.
   * System prompt is cached for efficiency across repeated calls.
   */
  async callSonnet(systemPrompt: string, userPrompt: string): Promise<LLMCallResult> {
    return callWithRetry(SONNET_MODEL, systemPrompt, userPrompt);
  }

  /**
   * Batch multiple LLM calls with a sliding-window concurrency limit.
   *
   * Calls are dispatched in order; up to `concurrency` calls run
   * simultaneously. When one completes, the next starts immediately.
   * If any call fails, its error propagates (fail-fast per slot).
   */
  async batchCall(
    calls: BatchCallInput[],
    concurrency: number = DEFAULT_CONCURRENCY
  ): Promise<LLMCallResult[]> {
    if (calls.length === 0) return [];

    const results: LLMCallResult[] = new Array(calls.length);
    const executing = new Set<Promise<void>>();

    for (let i = 0; i < calls.length; i++) {
      const { tier, systemPrompt, userPrompt } = calls[i];

      const task = (tier === 'haiku'
        ? this.callHaiku(systemPrompt, userPrompt)
        : this.callSonnet(systemPrompt, userPrompt)
      )
        .then(result => {
          results[i] = result;
        })
        .finally(() => {
          executing.delete(task);
        });

      executing.add(task);

      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }
    }

    // Wait for remaining in-flight calls
    await Promise.all(executing);
    return results;
  }
}

/** Singleton instance */
export const llmScoringService = new LLMScoringService();
export { LLMScoringService };
