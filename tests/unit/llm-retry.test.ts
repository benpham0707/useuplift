/**
 * llm-retry.test.ts — Unit tests for callClaudeWithRetry.
 *
 * Validates the retry / error-classification behavior of the Claude API wrapper
 * in src/lib/llm/claude.ts. Pure unit test — no real Anthropic API calls.
 *
 * Strategy:
 *   - Set ANTHROPIC_API_KEY to a fake value so `getAnthropicClient()` succeeds.
 *   - Lazily realize the singleton client, then monkey-patch
 *     `client.messages.create` to return scripted responses / throw scripted errors.
 *   - Monkey-patch `global.setTimeout` to fire immediately so exponential
 *     backoff doesn't slow the test (keeps suite under 1s).
 *
 * Cases:
 *   1. 429 on attempt 1 → success on attempt 2 (2 calls, 1 retry warn, data returned).
 *   2. 400 (non-retryable) → throws on attempt 1 (1 call).
 *   3. 429 × 3 → throws ClaudeAPIError after retries exhausted (3 calls).
 *   4. 529 (overloaded) on attempt 1 → success on attempt 2 (2 calls).
 *
 * Run: npx tsx tests/unit/llm-retry.test.ts
 * Exit 0 = pass, 1 = fail.
 */

// ─── Test harness setup (must run before importing the module under test) ────

// Ensure a non-empty API key so getAnthropicClient() returns a real client.
// The client is never actually used for a real request — we monkey-patch it.
process.env.ANTHROPIC_API_KEY = 'sk-test-fake-key-for-unit-test-do-not-use';

// Fast backoff: skip real timer delays so 429 retries don't add seconds.
// `callClaudeWithRetry` uses `setTimeout(resolve, waitTime)` for backoff; we
// fire the callback immediately to keep the test under 1s.
const realSetTimeout = global.setTimeout;
const patchedSetTimeout = ((cb: (...args: unknown[]) => void, _ms?: number, ...args: unknown[]) => {
  // Run the callback on the next microtask tick so the async/await chain
  // continues. Returning a harmless NodeJS.Timeout-like value keeps types happy.
  return realSetTimeout(cb as (...a: unknown[]) => void, 0, ...args);
}) as unknown as typeof global.setTimeout;
(patchedSetTimeout as unknown as { __promisify__: unknown }).__promisify__ = (realSetTimeout as unknown as { __promisify__: unknown }).__promisify__;
global.setTimeout = patchedSetTimeout;

// eslint-disable-next-line @typescript-eslint/no-var-requires
import Anthropic from '@anthropic-ai/sdk';
import {
  callClaudeWithRetry,
  ClaudeAPIError,
  getAnthropicClient,
} from '../../src/lib/llm/claude';

// ─── Assertion helpers ───────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string): void {
  if (cond) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}`);
  }
}

function assertEq<T>(actual: T, expected: T, label: string): void {
  if (actual === expected) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}\n        expected: ${String(expected)}\n        actual:   ${String(actual)}`);
  }
}

// ─── Client stub ─────────────────────────────────────────────────────────────

const SUCCESS_RESPONSE = {
  content: [{ type: 'text', text: 'ok' }],
  usage: { input_tokens: 10, output_tokens: 5 },
  stop_reason: 'end_turn',
};

/**
 * Replace the singleton client's `messages.create` with a scripted stub.
 *
 * The stub returns/throws the next value from `script` on each call.
 * Returns an array that records every call for assertion.
 */
function installClientStub(script: Array<() => Promise<unknown>>): { callCount: () => number } {
  const client = getAnthropicClient();
  let idx = 0;
  const calls: number[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client.messages as any).create = async (_params: unknown): Promise<unknown> => {
    calls.push(Date.now());
    if (idx >= script.length) {
      throw new Error(`[test stub] Unexpected extra call (#${idx + 1}); script has ${script.length} entries`);
    }
    const step = script[idx++];
    return step();
  };
  return { callCount: () => calls.length };
}

/** Build a real Anthropic.APIError instance with the given status. */
function makeApiError(status: number, message: string): Error {
  // The SDK's APIError constructor: (status, error, message, headers)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (Anthropic as any).APIError(status, undefined, message, new Headers());
}

// ─── Test cases ──────────────────────────────────────────────────────────────

async function testRetryOn429(): Promise<void> {
  console.log('\n[1] 429 on attempt 1 → success on attempt 2');
  const stub = installClientStub([
    () => { throw makeApiError(429, 'rate limited'); },
    () => Promise.resolve(SUCCESS_RESPONSE),
  ]);

  // Capture the retry warning so we can assert on it.
  const origWarn = console.warn;
  const warnings: string[] = [];
  console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')); };

  try {
    const result = await callClaudeWithRetry('hello');
    assertEq(stub.callCount(), 2, '429-then-success: 2 total API calls');
    assertEq(result.content, 'ok', '429-then-success: returns text content from 2nd call');
    assert(
      warnings.some(w => w.includes('Retry 1/3')),
      '429-then-success: logs a retry warning',
    );
  } catch (err) {
    failed++;
    console.error(`  FAIL  429-then-success: threw unexpectedly: ${(err as Error).message}`);
  } finally {
    console.warn = origWarn;
  }
}

async function testNonRetryable400(): Promise<void> {
  console.log('\n[2] 400 (non-retryable) → throws immediately');
  const stub = installClientStub([
    () => { throw makeApiError(400, 'bad request'); },
  ]);

  try {
    await callClaudeWithRetry('hello');
    failed++;
    console.error('  FAIL  400: expected throw, got success');
  } catch (err) {
    assert(err instanceof ClaudeAPIError, '400: throws ClaudeAPIError');
    assertEq((err as ClaudeAPIError).status, 400, '400: error.status is 400');
    assertEq((err as ClaudeAPIError).retryable, false, '400: error.retryable is false');
    assertEq(stub.callCount(), 1, '400: only 1 API call (no retries)');
  }
}

async function testExhaustedRetries(): Promise<void> {
  console.log('\n[3] 429 × 3 → throws after retries exhausted');
  const stub = installClientStub([
    () => { throw makeApiError(429, 'rate limited #1'); },
    () => { throw makeApiError(429, 'rate limited #2'); },
    () => { throw makeApiError(429, 'rate limited #3'); },
  ]);

  // Silence retry warn log during this test.
  const origWarn = console.warn;
  console.warn = () => { /* noop */ };

  try {
    await callClaudeWithRetry('hello');
    failed++;
    console.error('  FAIL  exhausted: expected throw, got success');
  } catch (err) {
    assert(err instanceof ClaudeAPIError, 'exhausted: throws ClaudeAPIError');
    assertEq((err as ClaudeAPIError).status, 429, 'exhausted: final status is 429');
    assertEq((err as ClaudeAPIError).isRateLimit, true, 'exhausted: isRateLimit=true');
    assertEq(stub.callCount(), 3, 'exhausted: exactly 3 API calls');
  } finally {
    console.warn = origWarn;
  }
}

async function testRetryOn529(): Promise<void> {
  console.log('\n[4] 529 (overloaded) on attempt 1 → success on attempt 2');
  const stub = installClientStub([
    () => { throw makeApiError(529, 'overloaded'); },
    () => Promise.resolve(SUCCESS_RESPONSE),
  ]);

  const origWarn = console.warn;
  console.warn = () => { /* noop */ };

  try {
    const result = await callClaudeWithRetry('hello');
    assertEq(stub.callCount(), 2, '529-then-success: 2 total API calls');
    assertEq(result.content, 'ok', '529-then-success: returns content from 2nd call');
  } catch (err) {
    failed++;
    console.error(`  FAIL  529-then-success: threw unexpectedly: ${(err as Error).message}`);
  } finally {
    console.warn = origWarn;
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('LLM RETRY — Unit Tests for callClaudeWithRetry');
  console.log('═══════════════════════════════════════════════════════════════════');

  await testRetryOn429();
  await testNonRetryable400();
  await testExhaustedRetries();
  await testRetryOn529();

  console.log('\n───────────────────────────────────────────────────────────────────');
  console.log(`Summary: ${passed} passed · ${failed} failed`);

  // Restore setTimeout for good citizenship (doesn't matter at exit).
  global.setTimeout = realSetTimeout;

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('llm-retry.test.ts crashed:', err);
  process.exit(1);
});
