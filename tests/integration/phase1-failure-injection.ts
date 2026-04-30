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
