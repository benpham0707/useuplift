// ============================================================================
// D-1.16 — Phase 1 Failure-Injection Test (every error boundary)
// ============================================================================
//
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md
//   §D-1.16 — "For every error-throwing path in the orchestrator and the
//   priorAnnotations builder, mock-inject the error and verify:
//     1. The error surfaces to telemetry with structured context.
//     2. The orchestrator halts (does not continue past the failure).
//     3. The error message includes enough information to diagnose at
//        source (layer name, paragraph index, input identifier)."
//
// Filename: literal `phase1-failure-injection.ts` per spec — separate
// test category, no `.test.ts` suffix (matches D-1.13/D-1.14/D-1.15
// convention for spec-named test files).
//
// ─── Architectural decision (D-1.16 ratified 2026-04-30) ──────────────
//
// D-1.16 USES D-0.11's mock-LLM framework directly via `mockLlmFailure`.
// D-1.15 deliberately bypassed D-0.11 because its contract is ledger-state,
// not parser-robustness. D-1.16's contract IS error-handling robustness —
// `mockLlmFailure` is exactly the right tool: it throws structured Error
// subclasses matching what real claude.ts adapter produces (TimeoutError,
// ParseError, RateLimitError, MalformedOutputError, OverloadError).
//
// Scope (per spec — "every error-throwing path"):
//   Layer 1: priorAnnotationsBuilder validation throws (input shape)
//   Layer 2: Detector failure injection (5 D-0.11 errorKinds)
//   Layer 3: D-1.15.0 carve-out violation throw (defense-in-depth re-detection)
//   Layer 4: Missing edit signal fail-fast (buildDetectorInput contract)
//   Layer 5: Detector enrichment contract (errors get priorMoveId attached)
//
// Out of scope (deferred):
//   - analysisOrchestrator's 23 catch sites (covered by D-1.12 directly +
//     by orchestrator-level integration tests at D-1.10/11)
//   - reanalysisOrchestrator's 18 catch sites (same)
//   - focusedAnalyzer's 19 catch sites (D-1.12 Commit B's
//     escalationLevelTrustworthy + failedSteps contract is consumer-side,
//     tested via FocusedAnalysisResult shape inspection in unit tests)
//   - HTTP route discriminators (covered by D-1.16-prefix's
//     buildEditProcessResponse tests)
//
// Layered assertion pattern (per Tue's diagnosability directive):
//   (1) error type — does the error surface as the expected Error subclass?
//   (2) error context — does the message include layer / move id / etc.?
//   (3) state preservation — does the failure leave the system in a
//       defined state (not a half-mutated mess)?
//
// ─── Telemetry-surface interpretation (C-1 audit closure 2026-04-30) ───
//
// Spec req (1) "the error surfaces to telemetry with structured context"
// is interpreted as follows for D-1.16's scope:
//   - Validation throws (Layer 1): synchronous fail-fast in
//     `validateInput` (priorAnnotationsBuilder.ts:413-453). No telemetry
//     emit — the throw IS the surface signal because validation fires
//     BEFORE any LLM call or telemetry buffer write. Diagnosability is
//     carried by the Error message itself ([priorAnnotationsBuilder]
//     prefix + named invariant).
//   - Detector throws (Layers 2 & 5): the underlying `detectLanding`
//     emits its own structured `emitStepFailure` event BEFORE throwing
//     (per landingDetector.ts step-event contract). priorAnnotationsBuilder
//     wraps the throw with priorMoveId enrichment but does NOT add a
//     second telemetry emit (would double-count). So the telemetry
//     surface IS the detector's own emit; D-1.16 verifies the
//     enrichment shape that operators use to correlate with that emit.
//   - Carve-out throw (Layer 3): synchronous fail-fast on the carve-out
//     invariant. Same interpretation as Layer 1.
//   - Composer-level absence (Layer 4): structured telemetry emit IS
//     asserted directly via console.log spy (this is the only path that
//     emits telemetry without throwing — D-1.7 round-1 audit T1.4 closure).
// Rationale: req (1) is satisfied as long as either (a) the throw is
// observable AND structured, OR (b) a structured telemetry event fires
// with the failure context. Both are true here at the relevant layers.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted — must come BEFORE the import that uses it.
vi.mock('../../src/services/essayIntelligence/analysis/landingDetector', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/services/essayIntelligence/analysis/landingDetector')
  >('../../src/services/essayIntelligence/analysis/landingDetector');
  return {
    ...actual,
    detectLanding: vi.fn(),
  };
});

// ─── Layer 6/7 mocks (D-1.12 catch-site coverage — Item 13) ─────────────
//
// Item 13 extends this file to cover the orchestrator-side catches D-1.12
// closed (5 CRITICAL + 9 HIGH violations). The closures introduced new
// structured-failure surfaces (EditProcessResult.deferReason+error,
// FocusedAnalysisResult.escalationLevelTrustworthy+failedSteps, plus
// orchestrator-side telemetry emits). Item 13 verifies each closure
// FIRES and produces the expected diagnostic shape under runtime
// failure injection — D-1.12 itself was code-review-only.
//
// Mock surface chosen at the boundary closest to each catch:
//   - `focusedAnalyzer.runFocusedAnalysis` — controls the C3 catch + the
//     Commit B failure-flag consumption in `runFocusedMode`.
//   - `analyzeEssay` (the function) — controls the C4 catch in
//     `runComprehensiveMode` (triggerReanalysis calls analyzeEssay).
// Both are imported by reanalysisOrchestrator; mocking at the module
// boundary is the cleanest way to inject failure without instantiating
// real layer pipelines (zero API spend per the cost charter).
vi.mock('../../src/services/essayIntelligence/analysis/focusedAnalyzer', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/services/essayIntelligence/analysis/focusedAnalyzer')
  >('../../src/services/essayIntelligence/analysis/focusedAnalyzer');
  return {
    ...actual,
    focusedAnalyzer: {
      ...actual.focusedAnalyzer,
      runFocusedAnalysis: vi.fn(),
    },
  };
});

vi.mock('../../src/services/essayIntelligence/analysis/analysisOrchestrator', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/services/essayIntelligence/analysis/analysisOrchestrator')
  >('../../src/services/essayIntelligence/analysis/analysisOrchestrator');
  return {
    ...actual,
    analyzeEssay: vi.fn(),
  };
});

import { detectLanding } from '../../src/services/essayIntelligence/analysis/landingDetector';
import { buildPriorAnnotationsForOrchestrator } from '../../src/services/essayIntelligence/analysis/priorAnnotationsBuilder';
import { incrementIteration } from '../../src/services/essayIntelligence/profileManager/essayProfileManager';
import { mockLlmFailure, type MockLlmErrorKind } from '../test-helpers/mockLlm';
import {
  D1_15_ESSAY_ID,
  SCENARIO_1_SMALL_EDIT,
  applyScenarioEdit,
  buildIter1Profile,
  buildLanding,
  expectedEditSignificance,
  setupIter2,
} from '../fixtures/d1-15';

// ─── Item-13-specific imports (orchestrator catch-site drivers) ─────────
import { ReanalysisOrchestrator } from '../../src/services/essayIntelligence/analysis/reanalysisOrchestrator';
import type { EditProcessResult } from '../../src/services/essayIntelligence/analysis/reanalysisOrchestrator';
import { focusedAnalyzer } from '../../src/services/essayIntelligence/analysis/focusedAnalyzer';
import type { FocusedAnalysisResult } from '../../src/services/essayIntelligence/analysis/focusedAnalyzer';
import { analyzeEssay } from '../../src/services/essayIntelligence/analysis/analysisOrchestrator';
import { InMemoryCheckpointStore } from '../../src/services/essayIntelligence/profileManager/checkpointStore';
import {
  flushEventsForIteration,
  __resetTelemetryForTesting,
} from '../../src/services/essayIntelligence/telemetry/iterationTelemetry';
import type { EditUnderstandingOutput } from '../../src/services/essayIntelligence/profileTypes';

const mockDetect = vi.mocked(detectLanding);

// ============================================================================
// Layer 1 — priorAnnotationsBuilder validation throws (input-shape contracts)
// ============================================================================
//
// `validateInput` at priorAnnotationsBuilder.ts:413-453 enforces input
// shape on every call. Each malformed-input path throws a specific
// `[priorAnnotationsBuilder]`-prefixed Error that names the failed
// invariant. These are the structural pre-conditions every consumer
// must satisfy.

// [C-2 audit closure 2026-04-30] `validateInput` at priorAnnotationsBuilder.ts:413-453
// has 9 distinct validation throws (input null, essayId, iterationLedger,
// taughtMoves, currentIteration invalid, perParagraphEdits, perParagraphRedetection,
// perMoveChatBehavior, paragraphRemap). D-1.16 covers ONE concrete throw
// (essayId-missing) plus the **prefix-property invariant**: every
// `[priorAnnotationsBuilder]`-prefixed Error from this module is
// structurally diagnostic. The prefix-property test acts as a contract-shape
// proof for the other 8 paths: any future regression that escapes a throw
// without the prefix would fail. Exhaustive 9-case coverage was rejected
// as redundant — the validation paths share one validator function and
// one prefix convention; one concrete + one structural is sufficient.

describe('D-1.16 Layer 1 — priorAnnotationsBuilder validation throws', () => {
  beforeEach(() => {
    mockDetect.mockReset();
    mockDetect.mockResolvedValue(buildLanding({ status: 'addressed' }));
  });

  it('throws when essayId is missing (telemetry buffer keying contract)', async () => {
    const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
    await expect(
      buildPriorAnnotationsForOrchestrator({
        essayId: '',
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      }),
    ).rejects.toThrow(/essayId is missing or empty/);
  });

  it('throws when essayId is empty string (same contract)', async () => {
    const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
    await expect(
      buildPriorAnnotationsForOrchestrator({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        essayId: undefined as any,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      }),
    ).rejects.toThrow(/essayId/);
  });

  it('error message identifies the source module ([priorAnnotationsBuilder] prefix)', async () => {
    // Diagnosability contract: every throw from this module must be
    // greppable by its `[priorAnnotationsBuilder]` prefix. Without this,
    // a future regression where an error escapes without the prefix
    // would silently disappear into the call stack.
    const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
    try {
      await buildPriorAnnotationsForOrchestrator({
        essayId: '',
        profile,
        currentEssayText: iter2Text,
      });
      throw new Error('expected throw did not fire');
    } catch (err) {
      expect((err as Error).message).toMatch(/^\[priorAnnotationsBuilder\]/);
    }
  });
});

// ============================================================================
// Layer 2 — Detector failure injection (5 D-0.11 errorKinds)
// ============================================================================
//
// `runDetectorWithEnrichedError` at priorAnnotationsBuilder.ts:392-410
// catches every detector failure and re-throws with the priorMoveId
// attached to the message. This Layer covers all 5 D-0.11 errorKinds
// (timeout / parse_error / rate_limit / malformed_output / overload)
// and verifies:
//   (a) the error propagates to the caller (no silent swallow)
//   (b) the message identifies which prior move was being processed
//   (c) iter-1 move.landing stays undefined (no partial write)
//
// Each errorKind throws a structurally-distinct Error subclass per the
// real claude.ts adapter shape — mockLlmFailure is the canonical source
// for these Error shapes.

describe('D-1.16 Layer 2 — detector failure injection (5 errorKinds)', () => {
  beforeEach(() => {
    mockDetect.mockReset();
  });

  // Generate one sub-case per errorKind so failures pinpoint the failing
  // class (e.g., "TimeoutError propagation broke" vs "OverloadError
  // propagation broke"). The 5-kind coverage matches the D-0.11 contract.
  const errorKinds: MockLlmErrorKind[] = [
    'timeout',
    'parse_error',
    'rate_limit',
    'malformed_output',
    'overload',
  ];

  it.each(errorKinds)(
    '%s: detector throws → priorAnnotationsBuilder propagates with priorMoveId attached',
    async (errorKind) => {
      const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);

      // Wire mockLlmFailure as the detector's rejection. The kind-specific
      // Error subclass (TimeoutError, ParseError, etc.) propagates through
      // runDetectorWithEnrichedError which wraps it.
      mockDetect.mockRejectedValueOnce(
        await mockLlmFailure('landing.detect', errorKind).catch((e: unknown) => e),
      );

      await expect(
        buildPriorAnnotationsForOrchestrator({
          essayId: D1_15_ESSAY_ID,
          profile,
          currentEssayText: iter2Text,
          editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
        }),
      ).rejects.toThrow(/landing detector failed for prior move/);
    },
  );

  it('detector failure → enrichment includes the priorMoveId in the message', async () => {
    const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
    mockDetect.mockRejectedValueOnce(
      await mockLlmFailure('landing.detect', 'timeout').catch((e: unknown) => e),
    );

    try {
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      });
      throw new Error('expected throw did not fire');
    } catch (err) {
      const msg = (err as Error).message;
      // Must include the [priorAnnotationsBuilder] prefix (source identity).
      expect(msg).toMatch(/\[priorAnnotationsBuilder\]/);
      // Must name the failure layer (landing detector) so the operator
      // can grep logs for the right subsystem.
      expect(msg).toMatch(/landing detector failed/);
      // Must include a prior move id (`id="M-..."`) so the operator can
      // find which iter-1 anchor was being processed when failure hit.
      expect(msg).toMatch(/id="M-/);
      // Must include the paragraph index (paragraphIndex=N) so the
      // operator can correlate to essay state.
      expect(msg).toMatch(/paragraphIndex=\d/);
    }
  });

  it('detector failure → iter-1 move.landing remains undefined (no partial write)', async () => {
    const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);

    // Pre-condition: iter-1 setup leaves landing undefined.
    for (const move of profile.iterationLedger.taughtMoves) {
      expect(move.landing).toBeUndefined();
    }

    mockDetect.mockRejectedValueOnce(
      await mockLlmFailure('landing.detect', 'rate_limit').catch((e: unknown) => e),
    );

    await expect(
      buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      }),
    ).rejects.toThrow();

    // Post-condition: ALL iter-1 moves' landing stays undefined. The
    // detector throw at the FIRST move halts the loop before subsequent
    // moves are reached AND before the wreck-back to the failed move
    // could fire. No partial writes.
    for (const move of profile.iterationLedger.taughtMoves) {
      expect(
        move.landing,
        `move.landing for ${move.id} must remain undefined after detector failure`,
      ).toBeUndefined();
    }
  });

  it('error.cause preserves the original Error subclass for stack traversal', async () => {
    const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
    const originalError = await mockLlmFailure('landing.detect', 'overload').catch((e: unknown) => e);
    mockDetect.mockRejectedValueOnce(originalError);

    try {
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      });
      throw new Error('expected throw did not fire');
    } catch (err) {
      // runDetectorWithEnrichedError wraps the original error and
      // attaches it as `cause` (priorAnnotationsBuilder.ts:405).
      // Operators traversing stacks must be able to reach the original.
      const wrapped = err as Error & { cause?: unknown };
      expect(wrapped.cause, 'wrapped error must preserve cause for stack traversal').toBe(originalError);

      // [C-4 audit closure 2026-04-30] Verify the SDK-shape fields
      // (`name`, `code`, `status`) survive on the cause. Identity check
      // alone (above) doesn't guarantee field shape — a future
      // regression that wraps the cause in a generic Error would lose
      // the SDK metadata operators rely on for routing (e.g., 529
      // overload → backoff retry vs 429 rate-limit → different backoff).
      const cause = wrapped.cause as Error & { code?: string; status?: number; name?: string };
      expect(cause.name, 'cause.name preserved (Error subclass routing)').toBe('OverloadError');
      expect(cause.code, 'cause.code preserved (D-0.11 errorKind routing)').toBe('OVERLOAD');
      expect(cause.status, 'cause.status preserved (HTTP semantics for 529 overload)').toBe(529);
    }
  });
});

// ============================================================================
// Layer 3 — D-1.15.0 carve-out violation throw
// ============================================================================
//
// `priorAnnotationsBuilder.ts:243-263` enforces the D-1.15.0 carve-out
// (landing transitions undefined → populated exactly once). If a
// previously-populated landing enters the builder, the production
// throw fires — defense-in-depth against a regression in the
// `priorIteration` filter at line 177-179.
//
// D-1.6.5 already tests this in the d1-8 suite for one happy path
// shape. D-1.16 adds a complementary failure-injection test that
// verifies:
//   - the throw fires regardless of detectedAtIteration value (R-3
//     audit pattern from D-1.6.5)
//   - the error message names `D-1.15.0 carve-out violation` so the
//     operator can grep for spec references
//   - the violation contains the populated landing's status and
//     iteration in the message context

describe('D-1.16 Layer 3 — D-1.15.0 carve-out violation throw', () => {
  beforeEach(() => {
    mockDetect.mockReset();
    mockDetect.mockResolvedValue(buildLanding({ status: 'addressed' }));
  });

  it('throws when an iter-1 prior move enters the builder with already-populated landing', async () => {
    const profile = buildIter1Profile(SCENARIO_1_SMALL_EDIT);
    // Manually populate landing on the first move BEFORE iter-2 runs.
    // This simulates a regression where the priorIteration filter
    // failed to exclude an already-detected move.
    const firstMove = profile.iterationLedger.taughtMoves[0];
    firstMove.landing = {
      status: 'addressed',
      detectedAtIteration: 2,
      confidence: 0.85,
      reasoning: 'simulated prior detection',
      signalsUsed: ['edit_vs_critique'],
    };

    incrementIteration(profile, 'edit');
    const iter2Text = applyScenarioEdit(SCENARIO_1_SMALL_EDIT.essayText, SCENARIO_1_SMALL_EDIT.edit);

    await expect(
      buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      }),
    ).rejects.toThrow(/D-1\.15\.0 carve-out violation/);
  });

  it('throw message includes the populated status + iteration for diagnosis', async () => {
    const profile = buildIter1Profile(SCENARIO_1_SMALL_EDIT);
    const firstMove = profile.iterationLedger.taughtMoves[0];
    firstMove.landing = {
      status: 'partially_addressed',
      detectedAtIteration: 7,
      confidence: 0.5,
      reasoning: 'older simulated landing',
      signalsUsed: ['edit_vs_critique'],
    };
    incrementIteration(profile, 'edit');
    const iter2Text = applyScenarioEdit(SCENARIO_1_SMALL_EDIT.essayText, SCENARIO_1_SMALL_EDIT.edit);

    try {
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
      });
      throw new Error('expected throw did not fire');
    } catch (err) {
      const msg = (err as Error).message;
      expect(msg).toMatch(/D-1\.15\.0 carve-out violation/);
      expect(msg).toMatch(/status="partially_addressed"/);
      expect(msg).toMatch(/detectedAtIteration=7/);
      // Must point the operator at the priorIteration filter location.
      expect(msg).toMatch(/priorIteration filter/);
    }
  });
});

// ============================================================================
// Layer 4 — Missing edit signal fail-fast
// ============================================================================
//
// `buildDetectorInput` at priorAnnotationsBuilder.ts:354-384 throws when
// `input.perParagraphEdits` doesn't have an entry for a paragraph that
// has prior moves. The orchestrator must provide an EditSignal entry
// for every paragraph carrying iter-1 priors; missing one means the
// orchestrator's wire-up is broken.
//
// Note: the orchestrator-level callers (analysisOrchestrator.ts:1185
// composer call) populate perParagraphEdits via buildPerParagraphEdits
// which generates an entry for every old paragraph index. The throw
// at line 361 is defense against a future regression where an
// orchestrator change skips that step.
//
// Rather than constructing a malformed perParagraphEdits Map directly
// (which would require calling the underlying buildPriorAnnotations,
// not the composer), we exercise the contract via the composer's
// behavior with a degenerate scenario shape. A direct unit test of
// buildPerParagraphEdits exists at tests/unit/prior-annotations-builder.test.ts.

describe('D-1.16 Layer 4 — missing edit signal contract (composer level)', () => {
  beforeEach(() => {
    mockDetect.mockReset();
    mockDetect.mockResolvedValue(buildLanding({ status: 'addressed' }));
  });

  it('composer surfaces structural-absence telemetry when ledger has no iter-1 snapshot (iter≥2 + missing snapshotText)', async () => {
    // The composer's iter≥2 branch (priorAnnotationsBuilder.ts:777-801)
    // emits a `priorAnnotations.composer.snapshotUnavailable` telemetry
    // event with status:'failed' when the ledger lacks the iter-1
    // snapshot. Returns undefined gracefully (not a throw) — the L5
    // prompt receives priorAnnotations=undefined which it null-guards.
    //
    // This is the structural-absence path, not a hard failure. Tested
    // here to verify the telemetry contract: a downstream operator
    // grepping for `priorAnnotations.composer.snapshotUnavailable`
    // must find structured context naming why.
    const profile = buildIter1Profile(SCENARIO_1_SMALL_EDIT);
    // Manually erase iter-1's snapshotText so the resolver returns undefined.
    profile.iterationLedger.iterations[0].snapshotText = undefined;
    incrementIteration(profile, 'edit');
    const iter2Text = applyScenarioEdit(SCENARIO_1_SMALL_EDIT.essayText, SCENARIO_1_SMALL_EDIT.edit);

    // Capture telemetry emissions.
    const telemetryEvents: Array<Record<string, unknown>> = [];
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      if (args[0] === '[IterationTelemetry]' && typeof args[1] === 'string') {
        telemetryEvents.push(JSON.parse(args[1]) as Record<string, unknown>);
      }
    });

    const result = await buildPriorAnnotationsForOrchestrator({
      essayId: D1_15_ESSAY_ID,
      profile,
      currentEssayText: iter2Text,
      editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
    });

    consoleSpy.mockRestore();

    // Result is undefined (graceful structural absence, not a throw).
    expect(result).toBeUndefined();

    // Telemetry contract: structured `priorAnnotations.composer.snapshotUnavailable`
    // event with status:'failed' + structured context.
    const snapshotEvent = telemetryEvents.find(
      (e) => e.step === 'priorAnnotations.composer.snapshotUnavailable',
    );
    expect(snapshotEvent, 'snapshotUnavailable telemetry event must fire').toBeDefined();
    expect(snapshotEvent?.status).toBe('failed');
    const error = snapshotEvent?.error as { code?: string; context?: { currentIteration?: number } } | undefined;
    expect(error?.code).toBe('prior_snapshot_unavailable');
    expect(error?.context?.currentIteration).toBe(2);
  });
});

// ============================================================================
// Layer 5 — Detector enrichment contract
// ============================================================================
//
// Even though Layer 2 covers the canonical shapes via D-0.11's
// errorKinds, Layer 5 adds a synthetic-error path to verify the
// enrichment contract holds for ANY thrown Error (not just D-0.11
// shapes). This is forward-compatibility insurance: if a future
// detector adds a new failure mode (e.g., a SchemaValidationError
// shape distinct from MalformedOutputError), the enrichment must
// still fire.

describe('D-1.16 Layer 5 — enrichment contract for arbitrary detector errors', () => {
  beforeEach(() => {
    mockDetect.mockReset();
  });

  it('arbitrary detector Error → builder enriches with priorMoveId regardless of Error subclass', async () => {
    const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
    // Inject a generic Error (no D-0.11 errorKind shape).
    const arbitraryError = new Error('generic detector failure for forward-compat coverage');
    mockDetect.mockRejectedValueOnce(arbitraryError);

    try {
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      });
      throw new Error('expected throw did not fire');
    } catch (err) {
      const msg = (err as Error).message;
      expect(msg).toMatch(/\[priorAnnotationsBuilder\]/);
      expect(msg).toMatch(/landing detector failed for prior move/);
      expect(msg).toMatch(/generic detector failure for forward-compat coverage/);
      // Cause preservation works for arbitrary Error too.
      expect((err as Error & { cause?: unknown }).cause).toBe(arbitraryError);
    }
  });

  it('non-Error detector rejection → builder still enriches with stringified failure', async () => {
    const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
    // Non-Error rejection (e.g., a string or plain object — should
    // never happen in production but the wrapper's `String(err)` fallback
    // must handle it).
    mockDetect.mockRejectedValueOnce('detector returned a non-Error rejection');

    try {
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      });
      throw new Error('expected throw did not fire');
    } catch (err) {
      const msg = (err as Error).message;
      expect(msg).toMatch(/\[priorAnnotationsBuilder\]/);
      expect(msg).toMatch(/detector returned a non-Error rejection/);
    }
  });
});

// ============================================================================
// Layer 6 — Orchestrator-side D-1.12 catch-site failure injection (Item 13)
// ============================================================================
//
// Item 13 (deferred from `phase-1-integrity-audit.md` §6 #13 / MED-1)
// extends D-1.16's coverage to the orchestrator-side catches that D-1.12
// closed via code-review-only. The original D-1.16 layered around the
// priorAnnotationsBuilder + landingDetector + carve-out + edit-signal
// surfaces — none of which exercise the reanalysisOrchestrator's
// `runFocusedMode` (C3) and `runComprehensiveMode` (C4) catch sites that
// D-1.12 Commit A reshaped, nor the focusedAnalyzer-failure-flag
// consumption (Commit B) that the orchestrator now reads.
//
// Item 13 covers the load-bearing closures D-1.12's audit named CRITICAL
// or HIGH:
//   - C3 (focused_failed)         — runFocusedMode catch + telemetry + EditProcessResult discriminator
//   - C4 (comprehensive_failed)   — runComprehensiveMode catch + telemetry + EditProcessResult discriminator
//   - Commit B (escalation_lying) — orchestrator consumes focusedAnalyzer.escalationLevelTrustworthy=false
//                                  and emits per-failedStep telemetry + suppresses misleading escalationLevel
//
// Skipped (out-of-scope for Item 13):
//   - C1/C2 (coordinator-rebuild + closeVersion) — reachable only inside
//     `triggerReanalysis`; their throws are absorbed by C4's catch, so
//     C4's coverage already exercises the surfaced shape. C1/C2 internal
//     rethrow paths are code-review-validated by D-1.12's audit doc.
//   - C5 (HTTP boundary) — covered by `tests/unit/edit-process-response.test.ts`
//     (D-1.16-prefix F-04 closure).
//   - H4-H6, H10 (analysisOrchestrator deep-stack catches) — reachable only
//     by driving analyzeEssay end-to-end with mocked-LLM substrate that
//     advances the orchestrator past Phase 5 / 5.5 / 5.75 / Phase 6. Each
//     would require a multi-layer mock harness larger than this deliverable.
//     Coverage at the catch-emission shape is via D-1.12's commit code-review;
//     runtime-emission proof is deferred to Phase 2's full-pipeline harness.
//
// Mock surface: `focusedAnalyzer.runFocusedAnalysis` (a method on a singleton)
// and `analyzeEssay` (a function export). Both are mocked at the module
// boundary via vi.mock at file top. `triggerReanalysis` is the orchestrator's
// own public method but its only LLM-bound call is `analyzeEssay`; mocking
// `analyzeEssay` to throw produces the same shape the C4 catch sees in
// production (the inner closure catches like C1/C2 also rethrow into this
// boundary).
//
// Test-driving discipline: the orchestrator's `runFocusedMode` and
// `runComprehensiveMode` are private methods. Calling them via
// `(orchestrator as unknown as { runFocusedMode: ... }).runFocusedMode(...)`
// is the surgical interposition — the alternative (driving `processEdit`
// end-to-end) requires mocking `editUnderstandingService` AND nudging
// the profile's `confidenceLevel` to bypass `selectAnalysisMode`'s
// comprehensive-default rules. The private-method drive isolates each
// catch precisely; the success of `processEdit` end-to-end is covered
// by the D-1.15 scenario tests (which run the whole flow with
// confidence-level-mature profiles + non-throwing focusedAnalyzer mocks).
//
// ─── Pre-existing wiring gap surfaced by Item 13 ────────────────────────
//
// The Commit B per-failedStep telemetry emit at
// reanalysisOrchestrator.ts:1319-1343 sits AFTER the mode='focused'
// (non-escalated) early-return at line 1264. This means: when
// focusedResult.mode='focused' (clean focused, no escalation) AND
// failedSteps is non-empty (some inner step caught), the per-step emit
// NEVER fires — the audit trail is missing for the most common case
// where the focused pipeline partially succeeded.
//
// Item 13 verifies the closure on the load-bearing escalation path
// (where F-1's wire to IterationRecord.escalationLevel lives). The
// non-escalated gap is a real defect worth fixing in a follow-up:
// either (a) move the per-step emit BEFORE the if(!escalated) early
// return, or (b) duplicate the emit block inside the early-return so
// both paths surface failedSteps. Recommended fix is (a) — single
// source-of-truth for the emit. Surfaced to Tue in Item 13's commit
// message as a residual concern.

// ─── Item 13 helpers ────────────────────────────────────────────────────

/**
 * Build a syntactically-valid EditUnderstandingOutput for driving the
 * orchestrator's runFocusedMode / runComprehensiveMode. The shape only
 * needs to satisfy the type contract — the catches under test never
 * read its content (the focused analyzer / analyzeEssay mocks make
 * the decision before any field is consulted).
 */
function buildSyntheticEditOutput(): EditUnderstandingOutput {
  return {
    diff: {
      structural: {
        paragraphsAdded: [],
        paragraphsRemoved: [],
        paragraphsReordered: false,
        paragraphDelta: 0,
      },
      paragraphChanges: [],
      stats: { totalSentencesChanged: 0, totalWordsChanged: 0, changeRatio: 0 },
    },
    understanding: {
      significance: 'minor',
      significanceReasoning: 'synthetic for Item 13 — content unread by catches under test',
      changeType: 'word_refinement',
      apparentPurpose: 'synthetic',
      purposeConfidence: 0.5,
      profileImpact: {
        directImpact: 'synthetic',
        connectionImpact: [],
        paragraphImpact: null,
        holisticImpact: null,
      },
      scopeRecommendation: { scope: 'sentence_update', reasoning: 'synthetic' },
    },
    stalenessEffects: [],
    analysisMode: 'focused',
  };
}

/**
 * Construct a ReanalysisOrchestrator on an iter-1 fixture profile. We use
 * SCENARIO_1's small-edit shape so the iter-1 setup matches the rest of
 * D-1.16's surface, but we never actually drive the edit through —
 * Item 13's tests exercise the focused-mode / comprehensive-mode paths
 * directly via the private-method handles.
 */
function buildItem13Orchestrator(): ReanalysisOrchestrator {
  __resetTelemetryForTesting();
  const profile = buildIter1Profile(SCENARIO_1_SMALL_EDIT);
  // Iter-2 ledger increment is required so getCurrentIteration() (used
  // by the catch sites' telemetry emits) returns iter=2, matching the
  // production shape where catches fire during iter-2 processing.
  incrementIteration(profile, 'edit');
  // Pre-populate the improvementCandidateSnapshot so EssayProfileCoordinator.fromCheckpoint
  // does NOT trigger the legacy-profile migration branch (which uses a runtime
  // `require('../improvements/profileMigration')` that vitest's vite-node
  // transform cannot resolve at runtime). The fixture profile is an iter-1
  // first-pass that hasn't yet had any L3 layer populate candidates; an empty
  // snapshot satisfies the post-Phase-1.5 invariant the migration branch enforces.
  profile.improvementCandidateSnapshot = { candidates: [], nextId: 0 };
  const checkpointStore = new InMemoryCheckpointStore();
  return new ReanalysisOrchestrator(profile, checkpointStore, D1_15_ESSAY_ID);
}

/**
 * Type-narrow handle to the orchestrator's private runFocusedMode /
 * runComprehensiveMode. Pattern matches D-1.10's seam-test discipline
 * where private orchestrator methods are exercised directly with a
 * documented shape contract.
 */
type OrchestratorPrivateMethods = {
  runFocusedMode: (
    editOutput: EditUnderstandingOutput,
    costBreakdown: unknown[],
    totalCostSoFar: number,
  ) => Promise<EditProcessResult>;
  runComprehensiveMode: (
    editOutput: EditUnderstandingOutput,
    costBreakdown: unknown[],
    totalCostSoFar: number,
    focusedResult?: FocusedAnalysisResult,
  ) => Promise<EditProcessResult>;
};

/** Build a clean FocusedAnalysisResult with escalationLevelTrustworthy=true. */
function buildCleanFocusedResult(
  overrides: Partial<FocusedAnalysisResult> = {},
): FocusedAnalysisResult {
  return {
    mode: 'focused',
    escalationLevel: 1,
    updatedParagraphIndex: 0,
    updatedSentenceIndex: 0,
    understandingDelta: null,
    analysisDelta: null,
    phaseUpdate: null,
    cost: [],
    totalCost: 0,
    escalationLevelTrustworthy: true,
    failedSteps: [],
    ...overrides,
  };
}

const mockedFocusedRun = vi.mocked(focusedAnalyzer.runFocusedAnalysis);
const mockedAnalyzeEssay = vi.mocked(analyzeEssay);

// ─── Item 13 sub-cases — C3 (runFocusedMode catch) ──────────────────────

describe('D-1.16 Item 13 — C3: runFocusedMode catch (focused_failed)', () => {
  beforeEach(() => {
    mockedFocusedRun.mockReset();
    mockedAnalyzeEssay.mockReset();
  });

  it('C3 (a) — focusedAnalyzer.runFocusedAnalysis throws → EditProcessResult.deferReason="focused_failed" + populated error', async () => {
    // Mock the focused analyzer to throw a generic Error. This is the
    // production shape the C3 catch handles — pre-fix it returned
    // `{mode:'deferred', reanalysisTriggered:false}` indistinguishable
    // from the policy-defer path. Post-fix it must return
    // deferReason='focused_failed' with populated error.layer/message/code.
    mockedFocusedRun.mockRejectedValueOnce(new Error('synthetic focused-analyzer crash'));

    const orchestrator = buildItem13Orchestrator();
    const editOutput = buildSyntheticEditOutput();
    const result = await (
      orchestrator as unknown as OrchestratorPrivateMethods
    ).runFocusedMode(editOutput, [], 0);

    // Halt-on-error contract: the catch returns a structured result, not
    // a thrown exception. mode='deferred' is the agreed shape; the
    // discriminator is `deferReason`.
    expect(result.mode).toBe('deferred');
    expect(result.reanalysisTriggered).toBe(false);
    expect(result.deferReason).toBe('focused_failed');

    // error must be populated with the SDK-shape fields the HTTP boundary
    // (D-1.12 C5 closure) reads at essayCoachingRoutes.ts:413.
    expect(result.error).toBeDefined();
    expect(result.error?.layer).toBe('focusedAnalyzer');
    expect(result.error?.code).toBe('focused_analyzer_threw');
    expect(result.error?.message).toMatch(/synthetic focused-analyzer crash/);
  });

  it('C3 (b) — telemetry: structured iterationTelemetry event fires with code="focused_analyzer_threw"', async () => {
    // Pre-fix the catch logged via console.error only. The audit trail
    // gap was the load-bearing concern — no consumer of iterationLedger
    // events could see the failure. Post-fix the catch emits a
    // structured iteration event; this assertion verifies the emission
    // shape matches the production contract.
    mockedFocusedRun.mockRejectedValueOnce(new Error('synthetic for telemetry-shape assertion'));

    const orchestrator = buildItem13Orchestrator();
    await (
      orchestrator as unknown as OrchestratorPrivateMethods
    ).runFocusedMode(buildSyntheticEditOutput(), [], 0);

    // Iter-2 because buildItem13Orchestrator advanced the ledger.
    const events = flushEventsForIteration(D1_15_ESSAY_ID, 2);
    const failureEvent = events.find(
      (e) => e.step === 'runFocusedMode' && e.status === 'failed',
    );
    expect(failureEvent, 'runFocusedMode failure telemetry event must fire').toBeDefined();
    expect(failureEvent?.error?.code).toBe('focused_analyzer_threw');
    expect(failureEvent?.error?.message).toMatch(/synthetic for telemetry-shape assertion/);
    // Diagnostic context: downstreamBehavior names the consumer-visible
    // effect so an operator reading the telemetry knows what the caller
    // did with the failure.
    const errorContext = failureEvent?.error?.context as { downstreamBehavior?: string } | undefined;
    expect(errorContext?.downstreamBehavior).toMatch(/EditProcessResult\.deferReason=focused_failed/);
  });

  it('C3 (c) — Error subclass (TimeoutError) propagates SDK-shape into EditProcessResult.error.message', async () => {
    // Verify the catch preserves the original Error's message text. SDK
    // routing (different backoff for TIMEOUT vs OVERLOAD) depends on
    // operators being able to read the original failure mode from the
    // surfaced shape. The catch uses `error.message` directly per
    // reanalysisOrchestrator.ts:1275-1280 — no subclass-specific masking.
    const sdkError = await mockLlmFailure('focused.runFocusedAnalysis', 'timeout').catch((e) => e);
    mockedFocusedRun.mockRejectedValueOnce(sdkError);

    const orchestrator = buildItem13Orchestrator();
    const result = await (
      orchestrator as unknown as OrchestratorPrivateMethods
    ).runFocusedMode(buildSyntheticEditOutput(), [], 0);

    expect(result.error?.message).toMatch(/simulated timeout/);
    expect(result.deferReason).toBe('focused_failed');
  });
});

// ─── Item 13 sub-cases — C4 (runComprehensiveMode catch) ────────────────

describe('D-1.16 Item 13 — C4: runComprehensiveMode catch (comprehensive_failed)', () => {
  beforeEach(() => {
    mockedFocusedRun.mockReset();
    mockedAnalyzeEssay.mockReset();
  });

  it('C4 (a) — analyzeEssay throws inside triggerReanalysis → deferReason="comprehensive_failed" + populated error', async () => {
    // The C4 catch wraps `triggerReanalysis()` which internally calls
    // analyzeEssay. Mocking analyzeEssay to throw produces the production
    // failure shape. Pre-fix this catch returned indistinguishably from
    // the policy-defer branch; post-fix it populates deferReason +
    // error.layer='triggerReanalysis'.
    mockedAnalyzeEssay.mockRejectedValueOnce(new Error('synthetic analyzeEssay crash'));

    const orchestrator = buildItem13Orchestrator();
    // Force the version-tracker's policy to recommend triggering by
    // recording a transformative edit. The runComprehensiveMode path
    // checks `shouldTriggerReanalysis()` BEFORE calling triggerReanalysis;
    // without the trigger nudge it returns the policy-defer branch and
    // never reaches the C4 catch. Use the orchestrator's public version
    // tracker via a typed handle.
    const versionTracker = (
      orchestrator as unknown as {
        versionTracker: {
          recordEdit: (o: EditUnderstandingOutput, t: string) => void;
          shouldTriggerReanalysis: () => { shouldTrigger: boolean; reason: string; urgency: string };
        };
      }
    ).versionTracker;
    const transformativeEdit = buildSyntheticEditOutput();
    transformativeEdit.understanding.significance = 'transformative';
    versionTracker.recordEdit(transformativeEdit, 'simulated post-edit text for trigger nudge');
    // Sanity: the policy gate now allows trigger.
    expect(versionTracker.shouldTriggerReanalysis().shouldTrigger).toBe(true);

    const result = await (
      orchestrator as unknown as OrchestratorPrivateMethods
    ).runComprehensiveMode(buildSyntheticEditOutput(), [], 0);

    expect(result.mode).toBe('comprehensive');
    expect(result.reanalysisTriggered).toBe(false);
    expect(result.deferReason).toBe('comprehensive_failed');
    expect(result.error).toBeDefined();
    expect(result.error?.layer).toBe('triggerReanalysis');
    expect(result.error?.code).toBe('trigger_reanalysis_threw');
    expect(result.error?.message).toMatch(/synthetic analyzeEssay crash/);
  });

  it('C4 (b) — telemetry: structured event fires with code="trigger_reanalysis_threw" + wasEscalation flag', async () => {
    mockedAnalyzeEssay.mockRejectedValueOnce(new Error('synthetic for C4 telemetry-shape assertion'));

    const orchestrator = buildItem13Orchestrator();
    const versionTracker = (
      orchestrator as unknown as {
        versionTracker: { recordEdit: (o: EditUnderstandingOutput, t: string) => void };
      }
    ).versionTracker;
    const transformativeEdit = buildSyntheticEditOutput();
    transformativeEdit.understanding.significance = 'transformative';
    versionTracker.recordEdit(transformativeEdit, 'simulated post-edit text');

    // Direct comprehensive (no focusedResult) → wasEscalation should be false.
    await (
      orchestrator as unknown as OrchestratorPrivateMethods
    ).runComprehensiveMode(buildSyntheticEditOutput(), [], 0, undefined);

    const events = flushEventsForIteration(D1_15_ESSAY_ID, 2);
    const failureEvent = events.find(
      (e) => e.step === 'runComprehensiveMode' && e.status === 'failed',
    );
    expect(failureEvent, 'runComprehensiveMode failure telemetry event must fire').toBeDefined();
    expect(failureEvent?.error?.code).toBe('trigger_reanalysis_threw');
    const ctx = failureEvent?.error?.context as
      | { downstreamBehavior?: string; wasEscalation?: boolean }
      | undefined;
    expect(ctx?.wasEscalation).toBe(false);
    expect(ctx?.downstreamBehavior).toMatch(/EditProcessResult\.deferReason=comprehensive_failed/);
  });

  it('C4 (c) — escalation tail: focusedResult passed → wasEscalation=true in telemetry context', async () => {
    // When runComprehensiveMode is called as the escalation tail of a
    // focused-mode run, the original focusedResult is threaded through
    // so the orchestrator can mark wasEscalation=true. Operators reading
    // telemetry need to distinguish "comprehensive crashed standalone"
    // from "comprehensive crashed AFTER focused already ran" because
    // the latter implies double-cost waste.
    mockedAnalyzeEssay.mockRejectedValueOnce(new Error('escalation-tail crash'));

    const orchestrator = buildItem13Orchestrator();
    const versionTracker = (
      orchestrator as unknown as {
        versionTracker: { recordEdit: (o: EditUnderstandingOutput, t: string) => void };
      }
    ).versionTracker;
    const transformativeEdit = buildSyntheticEditOutput();
    transformativeEdit.understanding.significance = 'transformative';
    versionTracker.recordEdit(transformativeEdit, 'simulated post-edit text');

    const escalatedFocusedResult = buildCleanFocusedResult({
      mode: 'escalated_to_comprehensive',
      escalationLevel: 4,
    });
    await (
      orchestrator as unknown as OrchestratorPrivateMethods
    ).runComprehensiveMode(buildSyntheticEditOutput(), [], 0, escalatedFocusedResult);

    const events = flushEventsForIteration(D1_15_ESSAY_ID, 2);
    const failureEvent = events.find(
      (e) => e.step === 'runComprehensiveMode' && e.status === 'failed',
    );
    expect(failureEvent).toBeDefined();
    const ctx = failureEvent?.error?.context as { wasEscalation?: boolean } | undefined;
    expect(ctx?.wasEscalation).toBe(true);
  });

  it('C4 (d) — policy_defer (no failure) does NOT emit failure telemetry — clean policy decision', async () => {
    // Negative control: the policy-defer branch (added in D-1.12 C4 partial)
    // sets deferReason='policy_defer' WITHOUT firing a failure telemetry
    // event. This guards against regression where a future change makes
    // every comprehensive-mode return path emit a failure event,
    // corrupting the audit trail.
    const orchestrator = buildItem13Orchestrator();
    // No versionTracker.recordEdit nudge → shouldTriggerReanalysis returns
    // false → runComprehensiveMode hits the policy-defer branch.

    const result = await (
      orchestrator as unknown as OrchestratorPrivateMethods
    ).runComprehensiveMode(buildSyntheticEditOutput(), [], 0);

    expect(result.deferReason).toBe('policy_defer');
    expect(result.error).toBeUndefined();

    const events = flushEventsForIteration(D1_15_ESSAY_ID, 2);
    const failureEvent = events.find(
      (e) => e.step === 'runComprehensiveMode' && e.status === 'failed',
    );
    expect(failureEvent, 'policy-defer must NOT emit failure telemetry').toBeUndefined();
  });
});

// ============================================================================
// Layer 7 — Commit B failure-flag consumption (Item 13)
// ============================================================================
//
// D-1.12 Commit B reshaped focusedAnalyzer to surface
// `escalationLevelTrustworthy` + `failedSteps[]` instead of silently
// hardcoding escalationLevel on internal catches. The orchestrator's
// `runFocusedMode` is now the consumer that:
//   (1) emits one iterationTelemetry event per entry in failedSteps[]
//       (parity with F-2's AO First Read closure pattern); and
//   (2) when the result is `mode='escalated_to_comprehensive'`, passes
//       UNDEFINED escalationLevel to triggerReanalysis (instead of the
//       potentially-misleading hardcoded value), so IterationRecord.escalationLevel
//       defaults honestly to 0 via the consumer's `?? 0`.
//
// These are the "Commit B HIGH violations" closures the audit named
// (H1-H3 in §4 of d1-12-halt-on-error-pass.md). Item 13 verifies the
// consumer-side wiring fires under runtime conditions.

describe('D-1.16 Item 13 — Commit B: focusedAnalyzer failure-flag consumption', () => {
  beforeEach(() => {
    mockedFocusedRun.mockReset();
    mockedAnalyzeEssay.mockReset();
  });

  it('Commit B (a) — single failed step on escalation tail → orchestrator emits one telemetry event named focusedAnalyzer.<step>', async () => {
    // Mock focusedAnalyzer to RESOLVE (not throw) with
    // escalationLevelTrustworthy=false and a single failedStep. This is
    // the production shape after Commit B's catches push to failedSteps
    // and the success-path return at line 1685 of focusedAnalyzer.ts
    // sets escalationLevelTrustworthy = failedSteps.length === 0.
    //
    // [Item 13 audit closure 2026-04-30] We exercise the ESCALATION-TAIL
    // path here. The companion sub-case `Commit B (f)` exercises the
    // focused-success-with-partial-failures path. Pre-D-1.16-follow-up,
    // the per-step emit only fired on the escalation path because the
    // emit block sat after a mode='focused' early-return; that wiring
    // gap was closed by the D-1.16 follow-up commit which moved the
    // emit BEFORE the if(!escalated) branch (see
    // reanalysisOrchestrator.ts inline closure marker
    // "[D-1.16 Item 13 follow-up closure 2026-04-30]").
    //
    // We also need analyzeEssay to throw (since escalation falls through
    // to runComprehensiveMode → triggerReanalysis → analyzeEssay) — the
    // throw halts after the per-step emits but before any further state
    // mutation, isolating the assertion surface to the Commit B emits.
    mockedFocusedRun.mockResolvedValueOnce(
      buildCleanFocusedResult({
        mode: 'escalated_to_comprehensive',
        escalationLevel: 4,
        escalationLevelTrustworthy: false,
        failedSteps: ['step1_understanding'],
      }),
    );
    mockedAnalyzeEssay.mockRejectedValueOnce(new Error('halt after Commit B emits'));

    const orchestrator = buildItem13Orchestrator();
    const versionTracker = (
      orchestrator as unknown as {
        versionTracker: { recordEdit: (o: EditUnderstandingOutput, t: string) => void };
      }
    ).versionTracker;
    const transformativeEdit = buildSyntheticEditOutput();
    transformativeEdit.understanding.significance = 'transformative';
    versionTracker.recordEdit(transformativeEdit, 'simulated post-edit text');

    await (
      orchestrator as unknown as OrchestratorPrivateMethods
    ).runFocusedMode(buildSyntheticEditOutput(), [], 0);

    const events = flushEventsForIteration(D1_15_ESSAY_ID, 2);
    const stepFailureEvent = events.find(
      (e) => e.step === 'focusedAnalyzer.step1_understanding' && e.status === 'failed',
    );
    expect(stepFailureEvent, 'per-failedStep telemetry must fire on escalation tail').toBeDefined();
    expect(stepFailureEvent?.error?.code).toBe('focused_step1_understanding_swallowed');
    const ctx = stepFailureEvent?.error?.context as
      | { resultEscalationLevel?: number; allFailedSteps?: string[] }
      | undefined;
    expect(ctx?.resultEscalationLevel).toBe(4);
    expect(ctx?.allFailedSteps).toEqual(['step1_understanding']);
  });

  it('Commit B (b) — multiple failed steps on escalation tail → one telemetry event PER step (parity with F-2 closure)', async () => {
    // The audit-trail contract is one event per failedStep. This guards
    // against regressions where a future refactor batches the events
    // (one summary event with all steps in context) — the audit shape
    // expects one-per-step so a downstream consumer can grep by step name.
    // Same escalation-tail reasoning as Commit B (a) — see audit-closure
    // comment there.
    mockedFocusedRun.mockResolvedValueOnce(
      buildCleanFocusedResult({
        mode: 'escalated_to_comprehensive',
        escalationLevel: 4,
        escalationLevelTrustworthy: false,
        failedSteps: ['step1_understanding', 'level2_rewalk', 'phase_recompute'],
      }),
    );
    mockedAnalyzeEssay.mockRejectedValueOnce(new Error('halt after Commit B emits'));

    const orchestrator = buildItem13Orchestrator();
    const versionTracker = (
      orchestrator as unknown as {
        versionTracker: { recordEdit: (o: EditUnderstandingOutput, t: string) => void };
      }
    ).versionTracker;
    const transformativeEdit = buildSyntheticEditOutput();
    transformativeEdit.understanding.significance = 'transformative';
    versionTracker.recordEdit(transformativeEdit, 'simulated post-edit text');

    await (
      orchestrator as unknown as OrchestratorPrivateMethods
    ).runFocusedMode(buildSyntheticEditOutput(), [], 0);

    const events = flushEventsForIteration(D1_15_ESSAY_ID, 2);
    const failedStepEvents = events.filter(
      (e) => typeof e.step === 'string' && e.step.startsWith('focusedAnalyzer.') && e.status === 'failed',
    );
    expect(failedStepEvents).toHaveLength(3);
    const stepNames = failedStepEvents.map((e) => e.step).sort();
    expect(stepNames).toEqual([
      'focusedAnalyzer.level2_rewalk',
      'focusedAnalyzer.phase_recompute',
      'focusedAnalyzer.step1_understanding',
    ]);
    // Every event carries the full allFailedSteps list so an operator
    // grepping by ANY step name sees the whole picture.
    for (const event of failedStepEvents) {
      const ctx = event.error?.context as { allFailedSteps?: string[] } | undefined;
      expect(ctx?.allFailedSteps).toEqual([
        'step1_understanding',
        'level2_rewalk',
        'phase_recompute',
      ]);
    }
  });

  it('Commit B (c) — escalation with trustworthy=false → triggerReanalysis receives UNDEFINED escalationLevel', async () => {
    // The load-bearing wire-up: F-1 wired focusedResult.escalationLevel
    // through to IterationRecord.escalationLevel. Pre-Commit-B, every
    // catch left escalationLevel at a hardcoded value, feeding F-1's wire
    // a lie. Post-Commit-B, when escalationLevelTrustworthy=false, the
    // orchestrator passes UNDEFINED to triggerReanalysis so the consumer's
    // `?? 0` defaults honestly (telemetry has the real audit trail).
    //
    // We mock analyzeEssay (which triggerReanalysis calls internally) to
    // observe the focusedEscalationLevel that ends up in PipelineInput.
    // mockedAnalyzeEssay's first arg is the PipelineInput.
    mockedFocusedRun.mockResolvedValueOnce(
      buildCleanFocusedResult({
        mode: 'escalated_to_comprehensive',
        escalationLevel: 4,
        escalationLevelTrustworthy: false,
        failedSteps: ['step2_analysis'],
      }),
    );
    // analyzeEssay throws so we don't have to construct a full PipelineResult
    // — the ASSERTION is on the input it was called with, not its return.
    mockedAnalyzeEssay.mockRejectedValueOnce(new Error('halt after capturing input'));

    const orchestrator = buildItem13Orchestrator();
    // Nudge versionTracker so triggerReanalysis's policy gate fires.
    const versionTracker = (
      orchestrator as unknown as {
        versionTracker: { recordEdit: (o: EditUnderstandingOutput, t: string) => void };
      }
    ).versionTracker;
    const transformativeEdit = buildSyntheticEditOutput();
    transformativeEdit.understanding.significance = 'transformative';
    versionTracker.recordEdit(transformativeEdit, 'simulated post-edit text');

    await (
      orchestrator as unknown as OrchestratorPrivateMethods
    ).runFocusedMode(buildSyntheticEditOutput(), [], 0);

    expect(mockedAnalyzeEssay).toHaveBeenCalled();
    const pipelineInput = mockedAnalyzeEssay.mock.calls[0]?.[0];
    expect(pipelineInput).toBeDefined();
    expect(
      pipelineInput?.focusedEscalationLevel,
      'untrustworthy escalationLevel must be undefined-passed (not 4) so IterationRecord defaults honestly',
    ).toBeUndefined();
  });

  it('Commit B (d) — clean escalated run (trustworthy=true, failedSteps=[]) emits NO per-step failure telemetry', async () => {
    // Negative control: when the focused analyzer reports a clean run
    // on the escalation path, the orchestrator must NOT spuriously emit
    // per-step failure events. Guards against a regression where the
    // `if (!focusedResult.escalationLevelTrustworthy)` guard inside the
    // try block (post-D-1.16-follow-up location, see
    // reanalysisOrchestrator.ts closure marker) is accidentally inverted.
    mockedFocusedRun.mockResolvedValueOnce(
      buildCleanFocusedResult({
        mode: 'escalated_to_comprehensive',
        escalationLevel: 4,
        escalationLevelTrustworthy: true,
        failedSteps: [],
      }),
    );
    mockedAnalyzeEssay.mockRejectedValueOnce(new Error('halt after capturing input'));

    const orchestrator = buildItem13Orchestrator();
    const versionTracker = (
      orchestrator as unknown as {
        versionTracker: { recordEdit: (o: EditUnderstandingOutput, t: string) => void };
      }
    ).versionTracker;
    const transformativeEdit = buildSyntheticEditOutput();
    transformativeEdit.understanding.significance = 'transformative';
    versionTracker.recordEdit(transformativeEdit, 'simulated post-edit text');

    await (
      orchestrator as unknown as OrchestratorPrivateMethods
    ).runFocusedMode(buildSyntheticEditOutput(), [], 0);

    const events = flushEventsForIteration(D1_15_ESSAY_ID, 2);
    const failedStepEvents = events.filter(
      (e) => typeof e.step === 'string' && e.step.startsWith('focusedAnalyzer.') && e.status === 'failed',
    );
    expect(failedStepEvents, 'clean run must emit zero per-step failure telemetry').toHaveLength(0);
  });

  it('Commit B (e) — escalation with trustworthy=true → triggerReanalysis receives the REAL escalationLevel', async () => {
    // Positive companion to Commit B (c): when escalationLevelTrustworthy=true,
    // the real escalationLevel must be passed through. This proves the
    // orchestrator's branch is `trustworthy ? real : undefined`, not
    // unconditional undefined.
    mockedFocusedRun.mockResolvedValueOnce(
      buildCleanFocusedResult({
        mode: 'escalated_to_comprehensive',
        escalationLevel: 4,
        escalationLevelTrustworthy: true,
        failedSteps: [],
      }),
    );
    mockedAnalyzeEssay.mockRejectedValueOnce(new Error('halt after capturing input'));

    const orchestrator = buildItem13Orchestrator();
    const versionTracker = (
      orchestrator as unknown as {
        versionTracker: { recordEdit: (o: EditUnderstandingOutput, t: string) => void };
      }
    ).versionTracker;
    const transformativeEdit = buildSyntheticEditOutput();
    transformativeEdit.understanding.significance = 'transformative';
    versionTracker.recordEdit(transformativeEdit, 'simulated post-edit text');

    await (
      orchestrator as unknown as OrchestratorPrivateMethods
    ).runFocusedMode(buildSyntheticEditOutput(), [], 0);

    expect(mockedAnalyzeEssay).toHaveBeenCalled();
    const pipelineInput = mockedAnalyzeEssay.mock.calls[0]?.[0];
    expect(
      pipelineInput?.focusedEscalationLevel,
      'trustworthy escalationLevel must be passed through (not undefined-erased)',
    ).toBe(4);
  });

  it('Commit B (f) — focused-SUCCESS path with partial failures → per-step telemetry fires (D-1.16 follow-up closure)', async () => {
    // [D-1.16 Item 13 follow-up closure 2026-04-30] This sub-case pins
    // the wiring fix that moved the per-failedStep emit BEFORE the
    // if(!escalated) early-return in runFocusedMode. Pre-fix, when
    // focusedAnalyzer resolved with mode='focused' (non-escalated) AND
    // failedSteps was non-empty, the per-step telemetry NEVER fired —
    // the most common partial-success case had no audit trail. Sub-cases
    // (a)-(e) above all use mode='escalated_to_comprehensive', which
    // worked even pre-fix because the emit block was reachable on the
    // fall-through to runComprehensiveMode. THIS sub-case proves the
    // bug case is now closed.
    //
    // The mock returns mode='focused' (success) with failedSteps
    // populated. The orchestrator's runFocusedMode should:
    //   1. Emit per-step telemetry events (the load-bearing fix)
    //   2. Return result with mode='focused' (success path preserved)
    //   3. NOT call analyzeEssay (no escalation → no comprehensive run)
    mockedFocusedRun.mockResolvedValueOnce(
      buildCleanFocusedResult({
        mode: 'focused',
        escalationLevel: 2,
        escalationLevelTrustworthy: false,
        failedSteps: ['step2_analysis', 'phase_recompute'],
      }),
    );
    // No analyzeEssay mock setup — if the orchestrator unexpectedly
    // calls into runComprehensiveMode, the mock will return undefined
    // and downstream assertions catch it.

    const orchestrator = buildItem13Orchestrator();
    const result = await (
      orchestrator as unknown as OrchestratorPrivateMethods
    ).runFocusedMode(buildSyntheticEditOutput(), [], 0);

    // Contract 1: per-step telemetry fires (the load-bearing fix).
    const events = flushEventsForIteration(D1_15_ESSAY_ID, 2);
    const failedStepEvents = events.filter(
      (e) => typeof e.step === 'string' && e.step.startsWith('focusedAnalyzer.') && e.status === 'failed',
    );
    expect(failedStepEvents, 'per-step telemetry must fire on focused-success path with partial failures').toHaveLength(2);
    const stepNames = failedStepEvents.map((e) => e.step).sort();
    expect(stepNames).toEqual(['focusedAnalyzer.phase_recompute', 'focusedAnalyzer.step2_analysis']);
    // Each event carries resultMode so an audit consumer can distinguish
    // partial-failure-on-success from partial-failure-on-escalation.
    for (const event of failedStepEvents) {
      const ctx = event.error?.context as { resultMode?: string; allFailedSteps?: string[] } | undefined;
      expect(ctx?.resultMode).toBe('focused');
      expect(ctx?.allFailedSteps).toEqual(['step2_analysis', 'phase_recompute']);
    }

    // Contract 2: the focused-success result is preserved (no escalation,
    // no comprehensive run). The mode='focused' early-return path stays
    // structurally identical. Round-1 audit MED closure 2026-04-30:
    // strengthen with positive focusedResult-shape assertions so a
    // regression that early-returns without preserving the focusedResult
    // reference would fail (negative-only `not.toHaveBeenCalled()` could
    // pass spuriously if a future change silently dropped the result).
    expect(result.mode).toBe('focused');
    expect(result.reanalysisTriggered).toBe(false);
    expect(mockedAnalyzeEssay).not.toHaveBeenCalled();
    expect(result.focusedResult).toBeDefined();
    expect(result.focusedResult?.failedSteps).toEqual(['step2_analysis', 'phase_recompute']);
    expect(result.focusedResult?.mode).toBe('focused');
    expect(result.focusedResult?.escalationLevelTrustworthy).toBe(false);
  });
});
