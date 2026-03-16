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
import { jsonrepair } from 'jsonrepair';
import dotenv from 'dotenv';
import path from 'path';

// Single-key policy: only use ANTHROPIC_API_KEY (paid/subscription credits).
// CLAUDE_CODE_KEY is no longer considered.
// Check if we're in browser (Vite) or Node.js environment
// We need to check for actual browser indicators (window, document) to distinguish
// from Node.js environments. Note: Node.js 24+ has navigator.userAgent = "Node.js/X"
// so we check for real browser user agents (Mozilla, Chrome, Safari, etc.)
const isBrowser = typeof window !== 'undefined'
  && typeof document !== 'undefined'
  && typeof navigator !== 'undefined'
  && typeof navigator.userAgent === 'string'
  && navigator.userAgent.length > 0
  && !navigator.userAgent.startsWith('Node.js')
  && (navigator.userAgent.includes('Mozilla') || navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Safari') || navigator.userAgent.includes('AppleWebKit'));

// Ensure dotenv is loaded — idempotent, safe to call multiple times.
// This eliminates import-order bugs where services are loaded before
// the entry point has called dotenv.config().
let _envLoaded = false;
function ensureEnvLoaded(): void {
  if (_envLoaded || isBrowser) return;
  _envLoaded = true;

  // Find project root by looking for package.json
  // Use __dirname in CJS or process.cwd() as fallback for ESM
  let dir: string = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  for (let i = 0; i < 10; i++) {
    try {
      require.resolve(path.join(dir, 'package.json'));
      break;
    } catch {
      dir = path.dirname(dir);
    }
  }

  // Load .env.local first (higher priority), then .env
  dotenv.config({ path: path.resolve(dir, '.env.local'), override: false });
  dotenv.config({ path: path.resolve(dir, '.env'), override: false });
}

// Function to get API key - allows for runtime updates
function getApiKey(): string | null {
  // Don't throw in browser context - just return null
  if (isBrowser) {
    return null;
  }

  // Ensure env vars are loaded before reading the key
  ensureEnvLoaded();

  // Sanitize: take only the first line and trim whitespace
  // Handles .env files with duplicate keys or malformed multi-line values
  const rawKey = process.env.ANTHROPIC_API_KEY?.split('\n')[0]?.trim();

  if (!rawKey) {
    return null;
  }

  return rawKey;
}

// Singleton client instance - lazily initialized
let clientInstance: Anthropic | null = null;

/**
 * Get or create the Anthropic client
 *
 * This function lazily initializes the client, which allows:
 * 1. dotenv to be loaded before first use
 * 2. API key to be set after module import
 *
 * @returns Anthropic client instance or null if no API key
 */
function getClient(): Anthropic | null {
  if (clientInstance) return clientInstance;

  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  clientInstance = new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: false // Never allow browser usage
  });

  return clientInstance;
}

/**
 * Get a lazily-initialized Anthropic client
 *
 * USE THIS INSTEAD OF `new Anthropic()` in services!
 *
 * Benefits:
 * - Ensures dotenv is loaded before client creation
 * - Centralizes API key management
 * - Provides consistent error handling
 *
 * @throws Error if no API key is available
 * @returns Anthropic client instance
 */
export function getAnthropicClient(): Anthropic {
  const client = getClient();
  if (!client) {
    throw new Error(
      'Anthropic API key not found. ' +
      'For tests: ensure dotenv.config() is called BEFORE importing services. ' +
      'Set ANTHROPIC_API_KEY in your .env file.'
    );
  }
  return client;
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
  /**
   * Optional timeout in milliseconds. If not provided, uses default based on maxTokens.
   * Default: 45s for <2000 tokens, 90s for 2000-3000 tokens, 120s for >3000 tokens.
   */
  timeoutMs?: number;
}

/**
 * Alternative input format for Claude calls using messages array.
 * This interface is preferred for multi-turn conversations.
 */
export interface ClaudeMessageInput {
  model: string;
  system?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  temperature?: number;
  /**
   * Optional timeout in milliseconds. If not provided, uses default based on maxTokens.
   * Default: 45s for <2000 tokens, 90s for 2000-3000 tokens, 120s for >3000 tokens.
   */
  timeoutMs?: number;
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

/**
 * Structured error class for Claude API errors.
 *
 * Extends Error so existing `catch (e) { if (e instanceof Error) }` patterns
 * continue to work. Adds structured fields for status code and error classification,
 * so callers don't need to import the Anthropic SDK to inspect errors.
 */
export class ClaudeAPIError extends Error {
  /** HTTP status code from the API (undefined for timeouts/network errors) */
  readonly status: number | undefined;
  /** True for 429 Too Many Requests */
  readonly isRateLimit: boolean;
  /** True for 5xx server errors */
  readonly isServerError: boolean;
  /** True for timeout errors (our client-side timeout or Anthropic's 408/504) */
  readonly isTimeout: boolean;
  /** True for 529 Overloaded */
  readonly isOverloaded: boolean;
  /** True if the error is worth retrying (429, 5xx, timeouts) */
  readonly retryable: boolean;

  constructor(message: string, options: {
    status?: number;
    cause?: unknown;
  } = {}) {
    super(message);
    this.name = 'ClaudeAPIError';
    this.status = options.status;
    if (options.cause) {
      this.cause = options.cause;
    }

    this.isRateLimit = this.status === 429;
    this.isServerError = this.status !== undefined && this.status >= 500;
    this.isTimeout = this.status === 408 || this.status === 504
      || message.includes('timed out');
    this.isOverloaded = this.status === 529;
    this.retryable = this.isRateLimit || this.isServerError || this.isTimeout;
  }
}

/**
 * Structured error report for essay intelligence pipeline failures.
 * Attached to every layer failure so the orchestrator knows exactly
 * what happened, where, and how much was already billed.
 */
export interface LayerError {
  /** Pipeline layer that failed */
  layer: string;
  /** Which paragraph failed (for per-paragraph layers) */
  paragraphIndex?: number;
  /** Classified error type */
  errorType: 'rate_limit' | 'timeout' | 'server_error' | 'parse_error' | 'unknown';
  /** HTTP status code from the API (undefined for client-side errors) */
  httpStatus?: number;
  /** Human-readable error message */
  message: string;
  /** Tokens already billed before the error (across successful calls in this layer) */
  tokensBilled: number;
  /** Dollar cost already incurred before the error */
  costBilled: number;
  /** ISO timestamp of the failure */
  timestamp: string;
}

/**
 * Classify a caught error into a LayerError errorType.
 */
export function classifyError(error: unknown): { errorType: LayerError['errorType']; httpStatus?: number } {
  if (error instanceof ClaudeAPIError) {
    if (error.isRateLimit) return { errorType: 'rate_limit', httpStatus: error.status };
    if (error.isTimeout) return { errorType: 'timeout', httpStatus: error.status };
    if (error.isServerError || error.isOverloaded) return { errorType: 'server_error', httpStatus: error.status };
    return { errorType: 'unknown', httpStatus: error.status };
  }
  if (error instanceof Error && error.message.includes('parse')) {
    return { errorType: 'parse_error' };
  }
  return { errorType: 'unknown' };
}

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'; // Sonnet 4.5
const DEFAULT_MAX_TOKENS = 4096;

// ============================================================================
// TIMEOUT UTILITIES
// ============================================================================

/**
 * Attempt to repair truncated JSON (common when Claude hits maxTokens).
 * Strategy: find the last complete array element and close the array.
 * Works for both arrays-of-objects `[{...}, {...}]` and standalone objects.
 */
function repairTruncatedJSON(text: string): unknown {
  let s = text.trim();

  // Strip markdown code block wrapper if present (common in Claude responses)
  const codeBlockMatch = s.match(/```(?:json)?\s*([\s\S]*)/);
  if (codeBlockMatch) {
    s = codeBlockMatch[1].trim();
    // Remove trailing ``` if present
    if (s.endsWith('```')) {
      s = s.slice(0, -3).trim();
    }
  }

  // Find the start of JSON content (skip any preamble text)
  const firstBracket = s.indexOf('[');
  const firstBrace = s.indexOf('{');
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket <= firstBrace)) {
    s = s.substring(firstBracket);
  } else if (firstBrace !== -1) {
    s = s.substring(firstBrace);
  }

  // Track positions of complete top-level array elements
  // Walk through the string tracking nesting depth
  let inString = false;
  let escape = false;
  let depth = 0;
  let arrayDepth = -1;
  const elementEndPositions: number[] = [];

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '[') {
      if (depth === 0) arrayDepth = i;
      depth++;
    } else if (ch === ']') {
      depth--;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      // If we just closed a top-level array element (depth back to 1 = inside outer array)
      if (depth === 1 && arrayDepth !== -1) {
        elementEndPositions.push(i);
      }
      // If we just closed the only top-level object (not in an array)
      if (depth === 0 && arrayDepth === -1) {
        elementEndPositions.push(i);
      }
    }
  }

  console.warn(`[JSONRepair] Text length: ${s.length}, element end positions: ${elementEndPositions.length}, arrayDepth: ${arrayDepth}`);

  // Try the full string first (shouldn't work if we're here, but just in case)
  // Then try truncating to the last complete element
  for (let attempt = elementEndPositions.length - 1; attempt >= 0; attempt--) {
    const endPos = elementEndPositions[attempt];
    let candidate = s.substring(0, endPos + 1);

    // Close the outer array if needed
    if (arrayDepth !== -1) {
      candidate += ']';
    }

    // Clean trailing commas before closing bracket
    candidate = candidate.replace(/,(\s*[\]}])/g, '$1');

    try {
      return JSON.parse(candidate);
    } catch (e) {
      if (attempt === elementEndPositions.length - 1) {
        console.warn(`[JSONRepair] Last element attempt failed:`, (e as Error).message.substring(0, 100));
        console.warn(`[JSONRepair] Candidate ends with: ...${candidate.slice(-80)}`);
      }
      // Try next earlier element
    }
  }

  throw new Error('JSON repair failed');
}

/**
 * Calculate appropriate timeout based on expected response size.
 */
function calculateTimeout(maxTokens: number, customTimeout?: number): number {
  if (customTimeout) return customTimeout;
  // Default timeouts based on expected response size
  // Larger responses need more time
  if (maxTokens >= 3000) return 120000; // 2 minutes
  if (maxTokens >= 2000) return 90000;  // 1.5 minutes
  if (maxTokens >= 1000) return 60000;  // 1 minute
  return 45000; // 45 seconds for quick responses
}

/**
 * Create a timeout promise that rejects after the specified time.
 */
function createTimeoutPromise(timeoutMs: number): { promise: Promise<never>; cancel: () => void } {
  let timeoutId: NodeJS.Timeout;
  const promise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Claude API call timed out after ${timeoutMs / 1000} seconds`));
    }, timeoutMs);
  });
  return {
    promise,
    cancel: () => clearTimeout(timeoutId),
  };
}

// ============================================================================
// CLAUDE API CALL
// ============================================================================

/**
 * Extended input format for Claude calls with userPrompt/systemPrompt.
 * This is a simpler alternative to the messages array format.
 */
interface ClaudeSimpleInput {
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  useJsonMode?: boolean;
  cacheSystemPrompt?: boolean;
}

/**
 * Make a call to Claude API with timeout handling and graceful degradation.
 *
 * Supports three call signatures:
 * 1. callClaude(userPrompt, options) - Simple string prompt with options
 * 2. callClaude({ model, system, messages, ... }) - Message-based input (multi-turn conversations)
 * 3. callClaude({ model, systemPrompt, userPrompt, ... }) - Simple object input (single-turn)
 */
export async function callClaude<T = any>(
  promptOrInput: string | ClaudeMessageInput | ClaudeSimpleInput,
  options?: ClaudeCallOptions
): Promise<ClaudeResponse<T>> {
  // Determine which interface is being used
  const isObject = typeof promptOrInput !== 'string';
  const hasMessages = isObject && 'messages' in (promptOrInput as ClaudeMessageInput);
  const hasUserPrompt = isObject && 'userPrompt' in (promptOrInput as ClaudeSimpleInput);

  let model: string;
  let temperature: number;
  let maxTokens: number;
  let systemParam: string | undefined;
  let messages: Anthropic.Messages.MessageParam[];
  let useJsonMode: boolean;
  let customTimeout: number | undefined;
  let cacheSystemPrompt = false;

  if (isObject && hasMessages) {
    // Message-based interface: callClaude({ model, system, messages, ... })
    const input = promptOrInput as ClaudeMessageInput;
    model = input.model || DEFAULT_MODEL;
    temperature = input.temperature ?? 0.7;
    maxTokens = input.maxTokens ?? DEFAULT_MAX_TOKENS;
    systemParam = input.system;
    customTimeout = input.timeoutMs;
    useJsonMode = false; // Message-based calls typically parse JSON manually

    // Convert simple message format to Anthropic format
    messages = input.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: [{ type: 'text' as const, text: msg.content }],
    }));
  } else if (isObject && hasUserPrompt) {
    // Simple object interface: callClaude({ model, systemPrompt, userPrompt, ... })
    const input = promptOrInput as ClaudeSimpleInput;
    model = input.model || DEFAULT_MODEL;
    temperature = input.temperature ?? 0.7;
    maxTokens = input.maxTokens ?? DEFAULT_MAX_TOKENS;
    systemParam = input.systemPrompt;
    customTimeout = input.timeoutMs;
    useJsonMode = input.useJsonMode ?? false;
    cacheSystemPrompt = input.cacheSystemPrompt ?? false;

    messages = [
      {
        role: 'user' as const,
        content: [{ type: 'text' as const, text: input.userPrompt }],
      },
    ];
  } else {
    // String-based interface: callClaude(userPrompt, options)
    const opts = options ?? {};
    model = opts.model ?? DEFAULT_MODEL;
    temperature = opts.temperature ?? 0.7;
    maxTokens = opts.maxTokens ?? DEFAULT_MAX_TOKENS;
    systemParam = opts.systemPrompt;
    useJsonMode = opts.useJsonMode ?? false;
    customTimeout = opts.timeoutMs;
    cacheSystemPrompt = opts.cacheSystemPrompt ?? false;

    messages = [
      {
        role: 'user' as const,
        content: [{ type: 'text' as const, text: promptOrInput as string }],
      },
    ];
  }

  try {
    // Build system parameter — use cache_control when caching requested
    const systemForRequest = systemParam
      ? cacheSystemPrompt
        ? [{ type: 'text' as const, text: systemParam, cache_control: { type: 'ephemeral' as const } }]
        : systemParam
      : undefined;

    // Build request parameters
    const requestParams: Anthropic.Messages.MessageCreateParams = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages,
      ...(systemForRequest ? { system: systemForRequest } : {}),
    };

    // Get client
    const client = getClient();
    if (!client) {
      // More helpful error message that explains the actual issue
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error(
          'ANTHROPIC_API_KEY not found in environment. ' +
          'For tests: add `import * as dotenv from "dotenv"; dotenv.config();` at the top of your test file. ' +
          'For production: ensure the environment variable is set.'
        );
      }
      throw new Error('Claude API client initialization failed. Check API key validity.');
    }

    // Make API call with explicit timeout
    const timeoutMs = calculateTimeout(maxTokens, customTimeout);
    const timeout = createTimeoutPromise(timeoutMs);

    try {
      const response = await Promise.race([
        client.messages.create(requestParams).then(res => {
          timeout.cancel();
          return res;
        }),
        timeout.promise,
      ]) as Anthropic.Messages.Message;

      // Extract content
      let content: any;
      if (response.content[0].type === 'text') {
        const textContent = response.content[0].text;

        if (useJsonMode) {
          // Parse JSON from response
          let jsonString = textContent.trim();
          try {

            // 1. Try extracting from code blocks
            const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              jsonString = jsonMatch[1].trim();
            } else {
              // 2. Fallback: Find outermost JSON structure (object or array)
              const firstBrace = jsonString.indexOf('{');
              const lastBrace = jsonString.lastIndexOf('}');
              const firstBracket = jsonString.indexOf('[');
              const lastBracket = jsonString.lastIndexOf(']');

              // Determine whether response is an array or object based on which delimiter comes first
              const braceValid = firstBrace !== -1 && lastBrace > firstBrace;
              const bracketValid = firstBracket !== -1 && lastBracket > firstBracket;

              if (bracketValid && (!braceValid || firstBracket < firstBrace)) {
                jsonString = jsonString.substring(firstBracket, lastBracket + 1);
              } else if (braceValid) {
                jsonString = jsonString.substring(firstBrace, lastBrace + 1);
              }
            }

            content = JSON.parse(jsonString);
          } catch (parseError) {
            // Fallback 1: Use jsonrepair library (handles unescaped chars, trailing commas, etc.)
            try {
              const repaired = jsonrepair(jsonString);
              content = JSON.parse(repaired);
              console.warn('[Claude] jsonrepair library succeeded — response had malformed JSON');
            } catch {
              // Fallback 2: Custom truncation repair (handles responses cut off by maxTokens)
              try {
                content = repairTruncatedJSON(textContent);
                console.warn('[Claude] Truncation repair succeeded — response was truncated');
              } catch {
                throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
              }
            }
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
      // Ensure timeout is cancelled even on error
      timeout.cancel();
      throw error;
    }

  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      // Preserve status code and classification in a structured error.
      // Message format "Claude API error: 429 - ..." is kept for backward
      // compat with callers that do string matching on error.message.
      throw new ClaudeAPIError(
        `Claude API error: ${error.status} - ${error.message}`,
        { status: error.status, cause: error }
      );
    }
    // Wrap timeout errors from createTimeoutPromise as ClaudeAPIError
    if (error instanceof Error && error.message.includes('timed out')) {
      throw new ClaudeAPIError(error.message, { cause: error });
    }
    throw error;
  }
}

/**
 * Make a call to Claude with automatic retries for transient errors.
 *
 * Retries on:
 * - 429 (rate limit)
 * - 5xx (server errors, including 529 overloaded)
 * - Timeout errors
 *
 * Uses exponential backoff with jitter to prevent thundering herd.
 * Accepts the same input types as callClaude (string, ClaudeMessageInput, ClaudeSimpleInput).
 */
export async function callClaudeWithRetry<T = any>(
  promptOrInput: string | ClaudeMessageInput | ClaudeSimpleInput,
  options: ClaudeCallOptions = {},
  maxRetries = 0
): Promise<ClaudeResponse<T>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callClaude<T>(promptOrInput, options);
    } catch (error) {
      lastError = error as Error;

      // Determine if the error is retryable
      let shouldRetry = false;
      if (error instanceof ClaudeAPIError) {
        shouldRetry = error.retryable;
      } else if (error instanceof Error) {
        // Fallback: string matching for errors not wrapped as ClaudeAPIError
        shouldRetry = error.message.includes('429')
          || error.message.includes('timed out')
          || error.message.includes('500')
          || error.message.includes('502')
          || error.message.includes('503')
          || error.message.includes('529');
      }

      if (shouldRetry && attempt < maxRetries - 1) {
        // Exponential backoff with jitter: base * 2^attempt + random(0..base)
        const baseMs = 1000;
        const waitTime = baseMs * Math.pow(2, attempt) + Math.random() * baseMs;
        console.warn(
          `[Claude] Retry ${attempt + 1}/${maxRetries} after ${Math.round(waitTime)}ms — ${lastError.message.substring(0, 100)}`
        );
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Non-retryable or final attempt — throw
      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Batch multiple Claude calls in parallel with concurrency limit.
 *
 * Uses a sliding-window approach: up to `concurrencyLimit` calls run
 * simultaneously. When one completes, the next starts immediately.
 */
export async function batchCallClaude<T = any>(
  prompts: { prompt: string; options?: ClaudeCallOptions }[],
  concurrencyLimit = 3
): Promise<ClaudeResponse<T>[]> {
  const results: ClaudeResponse<T>[] = [];
  const executing = new Set<Promise<void>>();

  for (let i = 0; i < prompts.length; i++) {
    const { prompt, options } = prompts[i];

    const task = callClaudeWithRetry<T>(prompt, options)
      .then(result => {
        results[i] = result;
      })
      .finally(() => {
        executing.delete(task);
      });

    executing.add(task);

    if (executing.size >= concurrencyLimit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Call Claude with graceful degradation on timeout or error.
 * Returns the LLM response if successful, or null if it fails,
 * allowing the caller to fall back to heuristics.
 *
 * This is preferred for conversation flows where LLM is optional
 * and heuristic fallback is acceptable.
 */
export async function callClaudeWithFallback<T = any>(
  input: ClaudeMessageInput,
  options: {
    timeoutMs?: number;
    onTimeout?: () => void;
    onError?: (error: Error) => void;
  } = {}
): Promise<ClaudeResponse<T> | null> {
  const { timeoutMs, onTimeout, onError } = options;

  try {
    return await callClaude<T>({
      ...input,
      timeoutMs: timeoutMs ?? input.timeoutMs,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Check if it's a timeout — prefer structured check, fall back to string match
    const isTimeout = (err instanceof ClaudeAPIError && err.isTimeout)
      || err.message.includes('timed out');

    if (isTimeout) {
      console.warn('[Claude] LLM call timed out, falling back to heuristics');
      onTimeout?.();
    } else {
      console.warn('[Claude] LLM call failed, falling back to heuristics:', err.message);
      onError?.(err);
    }

    return null;
  }
}

/**
 * Estimate token count (rough approximation)
 * ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Per-model pricing (USD per 1M tokens). Feb 2026 rates.
 * Exported so services can consolidate duplicated local pricing constants.
 */
export const MODEL_PRICING: Record<string, {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}> = {
  // Sonnet 4.5
  'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00, cacheWrite: 3.75, cacheRead: 0.30 },
  // Haiku 4.5
  'claude-haiku-4-5-20251001': { input: 1.00, output: 5.00, cacheWrite: 1.25, cacheRead: 0.10 },
};

/** Default pricing (Sonnet) used when model is not specified */
const DEFAULT_PRICING = MODEL_PRICING['claude-sonnet-4-5-20250929'];

/**
 * Calculate cost for API call.
 *
 * @param usage  Token usage from ClaudeResponse
 * @param model  Optional model ID. When provided, uses that model's pricing.
 *               Defaults to Sonnet pricing (backward compatible for all 27 callers).
 */
export function calculateCost(usage: ClaudeResponse['usage'], model?: string): number {
  const pricing = (model && MODEL_PRICING[model]) || DEFAULT_PRICING;

  let cost = 0;

  // Input tokens
  cost += (usage.input_tokens / 1_000_000) * pricing.input;

  // Output tokens
  cost += (usage.output_tokens / 1_000_000) * pricing.output;

  // Cache tokens
  if (usage.cache_creation_input_tokens) {
    cost += (usage.cache_creation_input_tokens / 1_000_000) * pricing.cacheWrite;
  }
  if (usage.cache_read_input_tokens) {
    cost += (usage.cache_read_input_tokens / 1_000_000) * pricing.cacheRead;
  }

  return Math.round(cost * 10000) / 10000; // Round to 4 decimal places
}
