// ============================================================================
// BUILD COST LEDGER — halt mechanism test (D-0.10)
// ============================================================================
// Per the D-0.10 contract: "test the halt mechanism end-to-end before any
// real API call." This test exercises the cap halt with an isolated
// ledger file so the production BUILD_COST_LEDGER.md is not touched.
//
// What's tested:
//   1. Fresh init: ledger file is created with header; cumulative = 0.
//   2. recordCost: appends a row; cumulative updates.
//   3. checkCapBeforeCall throws BuildCostCapExceededError when
//      cumulative >= HARD_CAP_USD.
//   4. State recovery: re-init reads the ledger and recovers cumulative.
//   5. Warn threshold: warning logged once when WARN_THRESHOLD crossed.
//
// Tests use a temp ledger by mutating the module's LEDGER_PATH constant
// is not feasible (it's `const`). Instead, we run each test by
// pre-cleaning the production ledger file path inside a temp shadow
// directory — see `tmpLedgerSetup`. For real isolation, we monkey-patch
// the path via a separate test-helper module that sets `process.cwd()`
// to a tmp dir; the module's `resolve(process.cwd(), ...)` then lands
// in tmp. This is the cleanest way without adding a setter for LEDGER_PATH.

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

// We use `vi.resetModules` + dynamic re-import so each test gets a
// fresh module-level state. The cwd-swap via process.chdir() points
// the module's resolve() at our tmp ledger.

describe('buildCostLedger — halt mechanism', () => {
  const originalCwd = process.cwd();
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'build-cost-ledger-test-'));
    process.chdir(tmpDir);
    vi.resetModules();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates the ledger file with header on fresh init', async () => {
    const mod = await import('../../src/services/essayIntelligence/telemetry/buildCostLedger');
    expect(mod.getCumulativeCost()).toBe(0);
    const path = join(tmpDir, 'BUILD_COST_LEDGER.md');
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('# Build Cost Ledger');
    expect(content).toContain('| timestamp | deliverable |');
  });

  it('recordCost appends a row and updates cumulative', async () => {
    const mod = await import('../../src/services/essayIntelligence/telemetry/buildCostLedger');
    mod.recordCost({
      deliverableId: 'D-test',
      model: 'claude-haiku-4-5-20251001',
      promptName: 'unit-test',
      inputTokens: 100,
      outputTokens: 50,
      costUsd: 0.5,
    });
    expect(mod.getCumulativeCost()).toBeCloseTo(0.5, 4);
    const path = join(tmpDir, 'BUILD_COST_LEDGER.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toMatch(/D-test/);
    expect(content).toMatch(/0\.5000/);
  });

  it('checkCapBeforeCall throws BuildCostCapExceededError when cumulative >= cap', async () => {
    const mod = await import('../../src/services/essayIntelligence/telemetry/buildCostLedger');
    // Seed cumulative to exactly the cap by recording one entry at the cap.
    mod.recordCost({
      deliverableId: 'D-test-overrun',
      model: 'claude-sonnet-4-5-20250929',
      inputTokens: 1000,
      outputTokens: 500,
      costUsd: mod.HARD_CAP_USD,
    });
    expect(mod.getCumulativeCost()).toBeGreaterThanOrEqual(mod.HARD_CAP_USD);
    expect(() => mod.checkCapBeforeCall()).toThrow(mod.BuildCostCapExceededError);
  });

  it('checkCapBeforeCall does not throw below the cap', async () => {
    const mod = await import('../../src/services/essayIntelligence/telemetry/buildCostLedger');
    mod.recordCost({
      deliverableId: 'D-test-under',
      model: 'claude-haiku-4-5-20251001',
      inputTokens: 100,
      outputTokens: 50,
      costUsd: mod.HARD_CAP_USD - 0.01,
    });
    expect(() => mod.checkCapBeforeCall()).not.toThrow();
  });

  it('recovers cumulative state from the on-disk ledger across module reload', async () => {
    // First module load: write some entries.
    const first = await import('../../src/services/essayIntelligence/telemetry/buildCostLedger');
    first.recordCost({
      deliverableId: 'D-test-recover-1',
      model: 'claude-haiku-4-5-20251001',
      inputTokens: 100,
      outputTokens: 50,
      costUsd: 1.5,
    });
    first.recordCost({
      deliverableId: 'D-test-recover-2',
      model: 'claude-haiku-4-5-20251001',
      inputTokens: 200,
      outputTokens: 100,
      costUsd: 2.25,
    });
    expect(first.getCumulativeCost()).toBeCloseTo(3.75, 4);

    // Reset the module and re-import — simulates a process restart.
    vi.resetModules();
    const second = await import('../../src/services/essayIntelligence/telemetry/buildCostLedger');
    expect(second.getCumulativeCost()).toBeCloseTo(3.75, 4);
  });

  it('emits a warning the first time cumulative crosses WARN_THRESHOLD', async () => {
    const mod = await import('../../src/services/essayIntelligence/telemetry/buildCostLedger');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      mod.recordCost({
        deliverableId: 'D-test-warn',
        model: 'claude-haiku-4-5-20251001',
        inputTokens: 100,
        outputTokens: 50,
        costUsd: mod.WARN_THRESHOLD_USD + 0.01,
      });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/WARN threshold crossed/);

      // Second crossing-equivalent call: warn must NOT re-fire.
      mod.recordCost({
        deliverableId: 'D-test-warn-2',
        model: 'claude-haiku-4-5-20251001',
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.1,
      });
      expect(warnSpy).toHaveBeenCalledTimes(1);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('throws on init when ledger has a malformed cost cell', async () => {
    // Pre-seed the ledger with a corrupted row.
    const path = join(tmpDir, 'BUILD_COST_LEDGER.md');
    writeFileSync(
      path,
      `# Build Cost Ledger\n\n| timestamp | deliverable | model | prompt | fixture | input_tokens | output_tokens | cache_read | cache_write | cost_usd | quality_note | cumulative_usd |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| 2026-04-26T00:00:00Z | D-x | claude-haiku-4-5-20251001 |   |   | 100 | 50 |   |   | NOT_A_NUMBER |   | 0.0 |\n`,
      'utf-8',
    );
    const mod = await import('../../src/services/essayIntelligence/telemetry/buildCostLedger');
    expect(() => mod.getCumulativeCost()).toThrow(/failed to parse cost_usd cell/);
  });
});
