// ============================================================================
// MOCK-LLM TESTING FRAMEWORK (Phase 0 D-0.11)
// ============================================================================
// Spec: INTEGRATED_BUILD_SEQUENCE.md D-0.11 / L5_IMPLEMENTATION_PLAN §2 D-0.11.
// Companion fixtures: tests/fixtures/llm-outputs/ (one JSON file per
// (promptName, fixtureKey) pair).
//
// The framework returns DETERMINISTIC mock responses derived from real
// LLM outputs captured during prior paid runs. Per the contract:
// "the existing fixtures are real LLM output from past paid runs;
// treat them as ground truth. Don't fabricate new mock outputs;
// derive from existing." The fixture extraction script (or hand-curation)
// pulls payloads out of `tests/output/l3-depth-audit-output.json`,
// `tests/output/checkpoint3/`, `tests/calibration/top-tier-reference/`,
// etc., and writes them as one-file-per-mock under
// `tests/fixtures/llm-outputs/`.
//
// Public API:
//   mockLlmCall(promptName, fixtureKey): Promise<MockLlmResponse>
//   mockLlmFailure(promptName, errorKind): Promise<never>
//   registerMock(promptName, fixtureKey, response): void   — for ad-hoc test cases
//   __resetMocksForTesting(): void                           — clear in-memory cache
//
// Failure surface (no-fallback discipline):
//   - mockLlmCall with unknown (promptName, fixtureKey) THROWS, naming the
//     missing fixture. We do not silently return synthetic data.
//   - Fixture file parse failure THROWS (corrupted fixture is a real bug).
//   - registerMock with a name collision THROWS (avoid silent overwrite of
//     a fixture-loaded mock).

import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

// ─── Types ──────────────────────────────────────────────────────────────

/**
 * Shape mirrors `ClaudeResponse<string>` from src/lib/llm/claude.ts so
 * mocks can be drop-in replacements in tests. `content` is the string
 * payload (often JSON the calling code parses); `usage` is the token-
 * usage block; `stopReason` is the Anthropic stop reason.
 */
export interface MockLlmResponse {
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number | null;
    cache_read_input_tokens?: number | null;
  };
  stopReason: string;
}

/**
 * Kinds of failure the framework can inject. Each maps to a realistic
 * Anthropic SDK / claude.ts failure mode that test code might want
 * to exercise.
 *   timeout         — network / API timeout
 *   parse_error     — LLM returned malformed JSON the caller couldn't parse
 *   rate_limit      — 429 from the API
 *   malformed_output — LLM returned a structure that doesn't match schema
 *   overload        — 529 from the API (Anthropic's overloaded signal)
 */
export type MockLlmErrorKind =
  | 'timeout'
  | 'parse_error'
  | 'rate_limit'
  | 'malformed_output'
  | 'overload';

// ─── Module state ──────────────────────────────────────────────────────

/**
 * Map<promptName, Map<fixtureKey, MockLlmResponse>> — the loaded mock cache.
 * Populated lazily on first `mockLlmCall` from disk + any `registerMock`
 * calls.
 */
const mockCache: Map<string, Map<string, MockLlmResponse>> = new Map();
let initialized = false;

/**
 * Resolve the fixture directory path at call time, not module load.
 * This way tests that swap cwd between import and call (e.g., the
 * buildCostLedger isolation pattern) get the right path.
 */
function fixturesPath(): string {
  return resolve(process.cwd(), 'tests/fixtures/llm-outputs');
}

// ─── Init / loading ────────────────────────────────────────────────────

/**
 * Load all fixture files from `tests/fixtures/llm-outputs/`. Files
 * follow the naming convention `<promptName>__<fixtureKey>.json` and
 * each contains a single MockLlmResponse-shaped JSON.
 *
 * Safe to call repeatedly — idempotent. Tests that need a clean cache
 * call `__resetMocksForTesting()`.
 */
function ensureLoaded(): void {
  if (initialized) return;
  const dir = fixturesPath();
  if (!existsSync(dir)) {
    // Empty fixture set is a valid state — registerMock can populate
    // for ad-hoc tests. Don't throw just because no fixtures exist.
    initialized = true;
    return;
  }
  const entries = readdirSync(dir);
  for (const filename of entries) {
    if (!filename.endsWith('.json')) continue;
    const stem = filename.slice(0, -'.json'.length);
    const sepIndex = stem.indexOf('__');
    if (sepIndex === -1) {
      throw new Error(
        `[mockLlm] fixture filename "${filename}" violates naming convention. ` +
          `Expected "<promptName>__<fixtureKey>.json"; the "__" separator is missing.`,
      );
    }
    const promptName = stem.slice(0, sepIndex);
    const fixtureKey = stem.slice(sepIndex + 2);
    const path = resolve(dir, filename);
    let parsed: MockLlmResponse;
    try {
      parsed = JSON.parse(readFileSync(path, 'utf-8')) as MockLlmResponse;
    } catch (err) {
      throw new Error(
        `[mockLlm] failed to parse fixture "${path}": ${(err as Error).message}. ` +
          `Corrupted fixture is a real bug — fix the file or remove it.`,
      );
    }
    validateMockShape(parsed, path);
    insertMock(promptName, fixtureKey, parsed, /* allowOverwrite */ false);
  }
  initialized = true;
}

/**
 * Schema check on a loaded mock. Validates the shape matches MockLlmResponse
 * so a malformed fixture surfaces at load time, not at first read.
 */
function validateMockShape(value: unknown, source: string): void {
  if (!value || typeof value !== 'object') {
    throw new Error(`[mockLlm] fixture at "${source}" is not an object.`);
  }
  const v = value as Record<string, unknown>;
  if (typeof v.content !== 'string') {
    throw new Error(`[mockLlm] fixture at "${source}" missing required string field "content".`);
  }
  if (!v.usage || typeof v.usage !== 'object') {
    throw new Error(`[mockLlm] fixture at "${source}" missing required object field "usage".`);
  }
  const u = v.usage as Record<string, unknown>;
  if (typeof u.input_tokens !== 'number' || typeof u.output_tokens !== 'number') {
    throw new Error(
      `[mockLlm] fixture at "${source}" usage.input_tokens / usage.output_tokens must be numbers.`,
    );
  }
  if (typeof v.stopReason !== 'string') {
    throw new Error(`[mockLlm] fixture at "${source}" missing required string field "stopReason".`);
  }
}

function insertMock(
  promptName: string,
  fixtureKey: string,
  response: MockLlmResponse,
  allowOverwrite: boolean,
): void {
  let bucket = mockCache.get(promptName);
  if (!bucket) {
    bucket = new Map();
    mockCache.set(promptName, bucket);
  }
  if (bucket.has(fixtureKey) && !allowOverwrite) {
    throw new Error(
      `[mockLlm] fixture collision for promptName="${promptName}" fixtureKey="${fixtureKey}". ` +
        `Two fixtures map to the same key — fix the duplicate before continuing.`,
    );
  }
  bucket.set(fixtureKey, response);
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Look up a deterministic mock response for the (promptName, fixtureKey)
 * pair. Auto-loads fixtures on first call.
 *
 * Async to mirror the real `callClaude` signature so tests can swap a
 * real call site for a mock with a one-line change.
 *
 * Throws if no mock is registered. We do not fabricate — per the
 * contract, mocks derive from real LLM output.
 */
export async function mockLlmCall(
  promptName: string,
  fixtureKey: string,
): Promise<MockLlmResponse> {
  ensureLoaded();
  const bucket = mockCache.get(promptName);
  if (!bucket || !bucket.has(fixtureKey)) {
    throw new Error(
      `[mockLlm] no mock registered for promptName="${promptName}" fixtureKey="${fixtureKey}". ` +
        `Either add a fixture file at tests/fixtures/llm-outputs/${promptName}__${fixtureKey}.json ` +
        `(derive from real LLM output — do not fabricate), or call registerMock() in the test setup. ` +
        `Existing prompts: ${Array.from(mockCache.keys()).join(', ') || '(none)'}.`,
    );
  }
  // Return a defensive copy so tests mutating the response don't leak
  // into other tests. The MockLlmResponse shape is shallow enough that
  // a JSON round-trip is a clean clone.
  return JSON.parse(JSON.stringify(bucket.get(fixtureKey)));
}

/**
 * Throw a specific failure. Test code that wants to exercise an error
 * path imports `mockLlmFailure` and either calls it directly (sync
 * throw via Promise.reject) or wires it as the LLM call replacement
 * for the failure case.
 *
 * Each errorKind maps to a structured Error subclass / shape that
 * matches what the real claude.ts adapter would throw, so the calling
 * code's catch logic exercises identically.
 */
export async function mockLlmFailure(
  promptName: string,
  errorKind: MockLlmErrorKind,
): Promise<never> {
  switch (errorKind) {
    case 'timeout':
      throw Object.assign(new Error(`[mockLlm] simulated timeout for "${promptName}"`), {
        name: 'TimeoutError',
        code: 'TIMEOUT',
        promptName,
      });
    case 'parse_error':
      throw Object.assign(
        new Error(`[mockLlm] simulated parse_error for "${promptName}"`),
        { name: 'ParseError', code: 'PARSE_ERROR', promptName },
      );
    case 'rate_limit':
      throw Object.assign(
        new Error(`[mockLlm] simulated rate_limit (429) for "${promptName}"`),
        { name: 'RateLimitError', code: 'RATE_LIMIT', status: 429, promptName },
      );
    case 'malformed_output':
      throw Object.assign(
        new Error(`[mockLlm] simulated malformed_output for "${promptName}"`),
        { name: 'MalformedOutputError', code: 'MALFORMED', promptName },
      );
    case 'overload':
      throw Object.assign(
        new Error(`[mockLlm] simulated overload (529) for "${promptName}"`),
        { name: 'OverloadError', code: 'OVERLOAD', status: 529, promptName },
      );
    default: {
      // Exhaustiveness check — TypeScript catches this at compile time;
      // runtime branch is for safety if a new errorKind is added.
      const _exhaustive: never = errorKind;
      throw new Error(`[mockLlm] unknown errorKind: ${_exhaustive}`);
    }
  }
}

/**
 * Register a mock at runtime, useful for tests with synthetic inputs
 * that don't have a real-world equivalent. Throws on collision unless
 * `allowOverwrite` is explicitly set.
 *
 * Auto-loads disk fixtures first so the collision check sees both
 * sources.
 */
export function registerMock(
  promptName: string,
  fixtureKey: string,
  response: MockLlmResponse,
  options?: { allowOverwrite?: boolean },
): void {
  ensureLoaded();
  validateMockShape(response, `<registerMock(${promptName}, ${fixtureKey})>`);
  insertMock(promptName, fixtureKey, response, options?.allowOverwrite === true);
}

/**
 * List the (promptName, fixtureKey) pairs currently registered. Useful
 * for diagnostic logging in test setup and for the missing-fixture
 * error message.
 */
export function listRegisteredMocks(): Array<{ promptName: string; fixtureKey: string }> {
  ensureLoaded();
  const out: Array<{ promptName: string; fixtureKey: string }> = [];
  for (const [promptName, bucket] of mockCache.entries()) {
    for (const fixtureKey of bucket.keys()) {
      out.push({ promptName, fixtureKey });
    }
  }
  return out;
}

/**
 * Test-only reset. Clears in-memory cache so the next mockLlmCall
 * triggers a fresh disk load.
 */
export function __resetMocksForTesting(): void {
  mockCache.clear();
  initialized = false;
}
