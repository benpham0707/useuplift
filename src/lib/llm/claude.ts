/**
 * Claude API Integration Layer
 *
 * Handles all interactions with Anthropic's Claude API including:
 * - Structured JSON output for analysis
 * - Prompt caching for efficiency
 * - Rate limiting and retries
 * - Token usage tracking
 */

import Anthropic from '@anthropic-ai/sdk';

// Single-key policy: only use ANTHROPIC_API_KEY (paid/subscription credits).
// CLAUDE_CODE_KEY is no longer considered.
// Check if we're in browser (Vite) or Node.js environment
const isBrowser = typeof import.meta !== 'undefined' && import.meta.env;

// Function to get API key - allows for runtime updates
function getApiKey(): string {
  const key = isBrowser
    ? import.meta.env.VITE_ANTHROPIC_API_KEY
    : process.env.ANTHROPIC_API_KEY;

  if (!key) {
    throw new Error('ANTHROPIC_API_KEY not found in environment variables. Please add it to your .env file.');
  }

  console.log(`[Claude API] Using API key: ${key.substring(0, 20)}...${key.substring(key.length - 4)}`);
  return key;
}

// Singleton client instance
let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (clientInstance) return clientInstance;

  clientInstance = new Anthropic({
  apiKey: getApiKey(),
  dangerouslyAllowBrowser: true // Required for client-side usage
});

  return clientInstance;
}

// ============================================================================
// TYPES
// ============================================================================

export interface ClaudeCallOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  useJsonMode?: boolean;
  cacheSystemPrompt?: boolean;
}

export interface ClaudeResponse<T = any> {
  content: T;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  stopReason: string;
}

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 4096;

// ============================================================================
// CLAUDE API CALL
// ============================================================================

/**
 * Make a call to Claude API with retry logic
 */
export async function callClaude<T = any>(
  userPrompt: string,
  options: ClaudeCallOptions = {}
): Promise<ClaudeResponse<T>> {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = DEFAULT_MAX_TOKENS,
    systemPrompt,
    useJsonMode = false,
    cacheSystemPrompt = false,
  } = options;

  try {
    // Build system prompt (SDK accepts a plain string)
    const systemParam = systemPrompt ? String(systemPrompt) : undefined;

    // Build request parameters
    const requestParams: Anthropic.Messages.MessageCreateParams = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
      ...(systemParam ? { system: systemParam } : {}),
    };

    // Make API call with timeout (30 seconds for chat, 120 seconds for deep analysis)
    console.log('[Claude API] Starting API call...');
    const timeoutMs = maxTokens >= 3000 ? 120000 : maxTokens >= 2000 ? 90000 : 45000; // Increased for reliability
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        console.log(`[Claude API] Timeout triggered after ${timeoutMs}ms`);
        reject(new Error(`Claude API call timed out after ${timeoutMs/1000} seconds`));
      }, timeoutMs);
    });

    const client = getClient();
    const response = await Promise.race([
      client.messages.create(requestParams).then(res => {
        console.log('[Claude API] Call completed successfully');
        clearTimeout(timeoutId);
        return res;
      }),
      timeoutPromise
    ]) as Anthropic.Messages.Message;

    // Extract content
    let content: any;
    if (response.content[0].type === 'text') {
      const textContent = response.content[0].text;

      if (useJsonMode) {
        // Parse JSON from response
        try {
          let jsonString = textContent.trim();
          
          // 1. Try extracting from code blocks
          const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonString = jsonMatch[1].trim();
          } else {
            // 2. Fallback: Find first '{' and last '}'
            const firstBrace = jsonString.indexOf('{');
            const lastBrace = jsonString.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              jsonString = jsonString.substring(firstBrace, lastBrace + 1);
            }
          }

          content = JSON.parse(jsonString);
        } catch (parseError) {
          console.error('[Claude API] JSON Parse Error:', parseError);
          console.error('[Claude API] Failed Content Snippet:', textContent.substring(0, 500));
          throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
      } else {
        content = textContent;
      }
    } else {
      throw new Error(`Unexpected content type: ${response.content[0].type}`);
    }

    // Return structured response
    return {
      content,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        cache_creation_input_tokens: response.usage.cache_creation_input_tokens,
        cache_read_input_tokens: response.usage.cache_read_input_tokens,
      },
      stopReason: response.stop_reason || 'unknown',
    };

  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Claude API error: ${error.status} - ${error.message}`);
    }
    throw error;
  }
}

/**
 * Make a call to Claude with automatic retries for rate limits
 */
export async function callClaudeWithRetry<T = any>(
  userPrompt: string,
  options: ClaudeCallOptions = {},
  maxRetries = 3
): Promise<ClaudeResponse<T>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callClaude<T>(userPrompt, options);
    } catch (error) {
      lastError = error as Error;

      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('429')) {
        // Exponential backoff: 1s, 2s, 4s
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`Rate limited, retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Batch multiple Claude calls in parallel with concurrency limit
 */
export async function batchCallClaude<T = any>(
  prompts: { prompt: string; options?: ClaudeCallOptions }[],
  concurrencyLimit = 3
): Promise<ClaudeResponse<T>[]> {
  const results: ClaudeResponse<T>[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < prompts.length; i++) {
    const { prompt, options } = prompts[i];

    const promise = callClaudeWithRetry<T>(prompt, options)
      .then(result => {
        results[i] = result;
      });

    executing.push(promise);

    if (executing.length >= concurrencyLimit) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Estimate token count (rough approximation)
 * ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost for API call
 * Prices as of 2025 for Claude Sonnet 3.5
 */
export function calculateCost(usage: ClaudeResponse['usage']): number {
  const INPUT_PRICE_PER_1M = 3.00; // $3 per 1M input tokens
  const OUTPUT_PRICE_PER_1M = 15.00; // $15 per 1M output tokens
  const CACHE_WRITE_PRICE_PER_1M = 3.75; // $3.75 per 1M cache write tokens
  const CACHE_READ_PRICE_PER_1M = 0.30; // $0.30 per 1M cache read tokens

  let cost = 0;

  // Input tokens
  cost += (usage.input_tokens / 1_000_000) * INPUT_PRICE_PER_1M;

  // Output tokens
  cost += (usage.output_tokens / 1_000_000) * OUTPUT_PRICE_PER_1M;

  // Cache tokens
  if (usage.cache_creation_input_tokens) {
    cost += (usage.cache_creation_input_tokens / 1_000_000) * CACHE_WRITE_PRICE_PER_1M;
  }
  if (usage.cache_read_input_tokens) {
    cost += (usage.cache_read_input_tokens / 1_000_000) * CACHE_READ_PRICE_PER_1M;
  }

  return Math.round(cost * 10000) / 10000; // Round to 4 decimal places
}
