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
    // Vitest-compatible tests are explicitly enumerated. The repo has
    // many legacy *.test.ts files written for the tsx-based runner
    // (`tests/unit/run-all.ts`) that don't import from 'vitest' — those
    // shouldn't be loaded here. Phase 1+ test deliverables append to
    // this list as new vitest-compatible tests land.
    include: [
      'tests/unit/build-cost-ledger.test.ts',
      'tests/unit/mock-llm.test.ts',
      'tests/unit/no-silent-fallback.test.ts',
      'tests/unit/iteration-ledger-accessor.test.ts',
      'tests/unit/taught-move-builder.test.ts',
      'tests/unit/landing-detector.test.ts',
      'tests/unit/prior-annotations-builder.test.ts',
      'tests/unit/paragraph-remap-builder.test.ts',
      'tests/unit/carry-forward-synthesis.test.ts',
      // D-1.16-prefix F-04 closure (2026-04-30) — buildEditProcessResponse
      // pure-helper branching test for EditProcessResult.deferReason.
      'tests/unit/edit-process-response.test.ts',
      'tests/integration/phase0-types-migrations.test.ts',
      'tests/integration/d1-8-prior-annotations-wireup.test.ts',
      'tests/integration/d1-10-iteration-bracket.test.ts',
      'tests/integration/d1-11-decisions.test.ts',
      // D-1.15.1 harness foundation smoke test (2026-04-30).
      'tests/integration/d1-15-harness.test.ts',
      // D-1.15 mock-LLM iteration ledger integration test (no .test.ts
      // suffix per spec — separate test category, matching D-1.13/D-1.14
      // property test convention).
      'tests/integration/phase1-iteration-ledger.ts',
      // D-1.16 failure-injection test for every error boundary
      // (no .test.ts suffix per spec; matches D-1.13/14/15 convention).
      'tests/integration/phase1-failure-injection.ts',
      // D-1.15 deferred-item closure (2026-04-30) — Item 6: brief→editScope
      // translation. Pure-function tests on buildEditScopeFromBrief plus
      // live-derivation chain tests (computeEditDiff → constructed brief →
      // buildEditScopeFromBrief → editScope).
      'tests/integration/d1-15-brief-editscope-translation.test.ts',
      // D-1.15 Item 6 sibling closure (2026-04-30) — analyzeEdit-brief-
      // fidelity. Drives editUnderstandingService.understandEdit (real
      // production code, mocked LLM boundary) → versionTracker →
      // ReanalysisBrief → editScope as a unit. Closes the gap honestly
      // named at d1-15-brief-editscope-translation.test.ts:13-44 where
      // Item 6's tests synthesize the brief in-test rather than driving
      // production. Default (CI): captured-fixture replay; gated real-
      // API path via env RUN_ANALYZE_EDIT_FIDELITY=1.
      'tests/integration/d1-15-analyze-edit-brief-fidelity.test.ts',
      // D-1.15 deferred-item closure (2026-04-30) — Item 5: iter-2
      // IterationRecord fidelity. Drives analyzeEssay through the L2-abort
      // seam so the REAL commitIterationRecord runs and every IterationRecord
      // field is asserted to flow honestly from PipelineInput / costTracker /
      // telemetry buffer / recentDecisions, replacing D-1.15.x's manually-
      // pushed hard-coded record.
      'tests/integration/d1-15-iter2-iteration-record-fidelity.test.ts',
      // tests/property/ — D-1.13 onward. Spec uses literal filenames
      // without the `.test.ts` suffix (separate test category from
      // unit/integration); they're enumerated explicitly here so vitest
      // picks them up.
      'tests/property/taughtMoveIdStability.ts',
      'tests/property/iterationLedgerAppendOnly.ts',
    ],
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
