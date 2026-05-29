// ============================================================================
// MOCK-LLM FRAMEWORK — self-test (D-0.11)
// ============================================================================
// Per the D-0.11 contract: "A self-test of the mock framework: spin up
// a mock, assert it returns the expected response, assert it throws
// the expected error."
//
// Each test that needs filesystem isolation uses a tmp dir + cwd swap
// + vi.resetModules so the mockLlm module re-resolves the fixture
// path against the tmp dir. The same pattern as the buildCostLedger
// test — proven approach.
//
// One test (the "real fixture" case) runs against the actual repo
// fixture at tests/fixtures/llm-outputs/l1.firstImpressions__piano-essay-p0.json,
// which was extracted from a real prior paid LLM run.

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

const ORIG_CWD = process.cwd();

describe('mockLlm framework — basic API (against repo fixtures)', () => {
  beforeEach(async () => {
    // Reset module-level state so each test sees a clean cache.
    vi.resetModules();
  });

  it('mockLlmCall returns the canned response for the seeded L1 fixture', async () => {
    const { mockLlmCall } = await import('../test-helpers/mockLlm');
    const response = await mockLlmCall('l1.firstImpressions', 'piano-essay-p0');
    expect(response.stopReason).toBe('end_turn');
    expect(response.usage.input_tokens).toBeGreaterThan(0);
    expect(response.usage.output_tokens).toBeGreaterThan(0);
    // Content is JSON-stringified L1 ParagraphFirstImpression. Parse
    // and verify it has the expected fields, proving the fixture is
    // real LLM output (not synthetic).
    const parsed = JSON.parse(response.content);
    expect(parsed).toHaveProperty('paragraphIndex');
    expect(parsed).toHaveProperty('apparentPurpose');
    expect(parsed).toHaveProperty('craftNotices');
    expect(Array.isArray(parsed.craftNotices)).toBe(true);
  });

  it('mockLlmCall throws an informative error for unknown (prompt, fixture)', async () => {
    const { mockLlmCall } = await import('../test-helpers/mockLlm');
    await expect(mockLlmCall('nonexistent.prompt', 'no-such-fixture')).rejects.toThrow(
      /no mock registered for promptName="nonexistent\.prompt" fixtureKey="no-such-fixture"/,
    );
  });

  it('returned response is a defensive copy — mutation does not leak across calls', async () => {
    const { mockLlmCall } = await import('../test-helpers/mockLlm');
    const first = await mockLlmCall('l1.firstImpressions', 'piano-essay-p0');
    first.content = 'mutated';
    first.usage.input_tokens = 0;
    const second = await mockLlmCall('l1.firstImpressions', 'piano-essay-p0');
    expect(second.content).not.toBe('mutated');
    expect(second.usage.input_tokens).toBeGreaterThan(0);
  });

  it('listRegisteredMocks reports the seeded L1 fixture', async () => {
    const { listRegisteredMocks } = await import('../test-helpers/mockLlm');
    const mocks = listRegisteredMocks();
    const found = mocks.find(
      (m) => m.promptName === 'l1.firstImpressions' && m.fixtureKey === 'piano-essay-p0',
    );
    expect(found).toBeDefined();
  });
});

describe('mockLlmFailure — all errorKinds', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('throws TimeoutError on errorKind=timeout', async () => {
    const { mockLlmFailure } = await import('../test-helpers/mockLlm');
    await expect(mockLlmFailure('any', 'timeout')).rejects.toMatchObject({
      name: 'TimeoutError',
      code: 'TIMEOUT',
    });
  });

  it('throws ParseError on errorKind=parse_error', async () => {
    const { mockLlmFailure } = await import('../test-helpers/mockLlm');
    await expect(mockLlmFailure('any', 'parse_error')).rejects.toMatchObject({
      name: 'ParseError',
      code: 'PARSE_ERROR',
    });
  });

  it('throws RateLimitError with status=429 on errorKind=rate_limit', async () => {
    const { mockLlmFailure } = await import('../test-helpers/mockLlm');
    await expect(mockLlmFailure('any', 'rate_limit')).rejects.toMatchObject({
      name: 'RateLimitError',
      status: 429,
    });
  });

  it('throws MalformedOutputError on errorKind=malformed_output', async () => {
    const { mockLlmFailure } = await import('../test-helpers/mockLlm');
    await expect(mockLlmFailure('any', 'malformed_output')).rejects.toMatchObject({
      name: 'MalformedOutputError',
      code: 'MALFORMED',
    });
  });

  it('throws OverloadError with status=529 on errorKind=overload', async () => {
    const { mockLlmFailure } = await import('../test-helpers/mockLlm');
    await expect(mockLlmFailure('any', 'overload')).rejects.toMatchObject({
      name: 'OverloadError',
      status: 529,
    });
  });
});

describe('mockLlm framework — isolated tmp fixture dir', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'mock-llm-test-'));
    mkdirSync(join(tmpDir, 'tests', 'fixtures', 'llm-outputs'), { recursive: true });
    process.chdir(tmpDir);
    vi.resetModules();
  });

  afterEach(() => {
    process.chdir(ORIG_CWD);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads a fixture file written to the tmp fixtures dir', async () => {
    const fixture = {
      content: '{"answer":"42"}',
      usage: { input_tokens: 100, output_tokens: 50 },
      stopReason: 'end_turn',
    };
    writeFileSync(
      join(tmpDir, 'tests', 'fixtures', 'llm-outputs', 'test.prompt__test-fixture.json'),
      JSON.stringify(fixture),
      'utf-8',
    );
    const { mockLlmCall } = await import('../test-helpers/mockLlm');
    const response = await mockLlmCall('test.prompt', 'test-fixture');
    expect(response.content).toBe('{"answer":"42"}');
  });

  it('throws on a fixture file that violates the naming convention', async () => {
    writeFileSync(
      join(tmpDir, 'tests', 'fixtures', 'llm-outputs', 'no-separator-here.json'),
      '{}',
      'utf-8',
    );
    const { mockLlmCall } = await import('../test-helpers/mockLlm');
    await expect(mockLlmCall('any', 'any')).rejects.toThrow(
      /violates naming convention/,
    );
  });

  it('throws on a malformed JSON fixture', async () => {
    writeFileSync(
      join(tmpDir, 'tests', 'fixtures', 'llm-outputs', 'bad.prompt__bad-fixture.json'),
      'NOT_VALID_JSON{{',
      'utf-8',
    );
    const { mockLlmCall } = await import('../test-helpers/mockLlm');
    await expect(mockLlmCall('any', 'any')).rejects.toThrow(/failed to parse fixture/);
  });

  it('throws on a fixture missing required usage fields', async () => {
    writeFileSync(
      join(tmpDir, 'tests', 'fixtures', 'llm-outputs', 'incomplete.prompt__incomplete-fixture.json'),
      JSON.stringify({ content: 'x', usage: {}, stopReason: 'end_turn' }),
      'utf-8',
    );
    const { mockLlmCall } = await import('../test-helpers/mockLlm');
    await expect(mockLlmCall('any', 'any')).rejects.toThrow(
      /usage\.input_tokens \/ usage\.output_tokens must be numbers/,
    );
  });

  it('registerMock adds a runtime mock', async () => {
    const { registerMock, mockLlmCall } = await import('../test-helpers/mockLlm');
    registerMock('runtime.prompt', 'runtime-fixture', {
      content: 'runtime',
      usage: { input_tokens: 1, output_tokens: 1 },
      stopReason: 'end_turn',
    });
    const response = await mockLlmCall('runtime.prompt', 'runtime-fixture');
    expect(response.content).toBe('runtime');
  });

  it('registerMock throws on collision unless allowOverwrite', async () => {
    const { registerMock } = await import('../test-helpers/mockLlm');
    const fixture = {
      content: 'first',
      usage: { input_tokens: 1, output_tokens: 1 },
      stopReason: 'end_turn',
    };
    registerMock('collide.prompt', 'collide-fixture', fixture);
    expect(() =>
      registerMock('collide.prompt', 'collide-fixture', { ...fixture, content: 'second' }),
    ).toThrow(/fixture collision/);
    // With allowOverwrite, succeeds:
    expect(() =>
      registerMock(
        'collide.prompt',
        'collide-fixture',
        { ...fixture, content: 'second' },
        { allowOverwrite: true },
      ),
    ).not.toThrow();
  });

  it('returns empty mocks list when fixture dir does not exist (no throw on init)', async () => {
    rmSync(join(tmpDir, 'tests', 'fixtures', 'llm-outputs'), { recursive: true, force: true });
    const { listRegisteredMocks, registerMock, mockLlmCall } = await import('../test-helpers/mockLlm');
    expect(listRegisteredMocks()).toEqual([]);
    // Can still register a runtime mock and use it.
    registerMock('lazy.prompt', 'lazy-fixture', {
      content: 'lazy',
      usage: { input_tokens: 1, output_tokens: 1 },
      stopReason: 'end_turn',
    });
    const response = await mockLlmCall('lazy.prompt', 'lazy-fixture');
    expect(response.content).toBe('lazy');
  });
});
