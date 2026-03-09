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

export interface ClaudeCallOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    useJsonMode?: boolean;
    cacheSystemPrompt?: boolean;
    timeoutMs?: number;
}

export interface ClaudeMessageInput {
    model: string;
    system?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    maxTokens?: number;
    temperature?: number;
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
 * Extends Error so existing catch patterns continue to work.
 */
export declare class ClaudeAPIError extends Error {
    readonly status: number | undefined;
    readonly isRateLimit: boolean;
    readonly isServerError: boolean;
    readonly isTimeout: boolean;
    readonly isOverloaded: boolean;
    readonly retryable: boolean;
    constructor(message: string, options?: { status?: number; cause?: unknown });
}

/**
 * Get a lazily-initialized Anthropic client.
 */
export declare function getAnthropicClient(): Anthropic;

/**
 * Make a call to Claude API with timeout handling and graceful degradation.
 */
export declare function callClaude<T = any>(
    promptOrInput: string | ClaudeMessageInput,
    options?: ClaudeCallOptions
): Promise<ClaudeResponse<T>>;

/**
 * Make a call to Claude with automatic retries for transient errors.
 */
export declare function callClaudeWithRetry<T = any>(
    promptOrInput: string | ClaudeMessageInput,
    options?: ClaudeCallOptions,
    maxRetries?: number
): Promise<ClaudeResponse<T>>;

/**
 * Batch multiple Claude calls in parallel with concurrency limit
 */
export declare function batchCallClaude<T = any>(prompts: {
    prompt: string;
    options?: ClaudeCallOptions;
}[], concurrencyLimit?: number): Promise<ClaudeResponse<T>[]>;

/**
 * Call Claude with graceful degradation on timeout or error.
 */
export declare function callClaudeWithFallback<T = any>(
    input: ClaudeMessageInput,
    options?: {
        timeoutMs?: number;
        onTimeout?: () => void;
        onError?: (error: Error) => void;
    }
): Promise<ClaudeResponse<T> | null>;

/**
 * Estimate token count (rough approximation)
 */
export declare function estimateTokens(text: string): number;

/**
 * Per-model pricing (USD per 1M tokens). Feb 2026 rates.
 */
export declare const MODEL_PRICING: Record<string, {
    input: number;
    output: number;
    cacheWrite: number;
    cacheRead: number;
}>;

/**
 * Calculate cost for API call.
 * @param model Optional model ID for model-specific pricing. Defaults to Sonnet.
 */
export declare function calculateCost(usage: ClaudeResponse['usage'], model?: string): number;
