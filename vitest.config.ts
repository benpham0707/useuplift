// ============================================================================
// VITEST CONFIG — Phase 0 D-0.13
// ============================================================================
// Coverage tooling for the integrated build per L5_IMPLEMENTATION_PLAN
// §2 D-0.13. Target: 100% line coverage on new code in
// `src/services/essayIntelligence/conversator/` and
// `src/services/essayIntelligence/telemetry/` plus any new file added
// during the build. Existing-code coverage is informational only — the
// gate doesn't fail when legacy code is uncovered (per the contract).
//
// Run:
//   npm run test:vitest         — runs *.test.ts files (no coverage)
//   npm run test:coverage       — runs with c8 coverage report
//
// `tests/unit/run-all.ts` (the existing tsx-based runner) is preserved
// for the legacy *.ts test scripts. Vitest is the new path for tests
// that benefit from describe / it / spies (e.g.,
// tests/unit/build-cost-ledger.test.ts).

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run only *.test.ts under tests/unit/ + tests/integration/ (the
    // legacy tsx runner covers the rest of tests/integration/ that
    // doesn't end in .test.ts). The path-based include lets the two
    // test runners coexist without the legacy scripts being picked up
    // by vitest.
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    // Node environment — these are unit tests of business logic, not
    // browser components.
    environment: 'node',
    // Use the `forks` pool so tests can use process.chdir() for
    // filesystem isolation. The default `threads` pool runs tests in
    // worker_threads which block chdir (ERR_WORKER_UNSUPPORTED_OPERATION).
    // The buildCostLedger and mockLlm tests both use cwd-swap for
    // isolated fixture / ledger paths.
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      // Per the D-0.13 contract: 100% line coverage on new build-phase
      // files. Existing-code coverage is informational only.
      include: [
        'src/services/essayIntelligence/conversator/**',
        'src/services/essayIntelligence/telemetry/**',
        // Per-deliverable additions land here as Phase 1+ ships.
      ],
      // Gate at 100% lines for the included paths. Functions/branches
      // not gated (some are hard to drive on every code path; lines
      // are the contract's chosen metric).
      thresholds: {
        lines: 100,
      },
    },
  },
});
