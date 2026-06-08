// ============================================================================
// D-1.16-prefix F-04 closure — buildEditProcessResponse branching test
// ============================================================================
// Spec: docs/archived/audit/d1-15-mock-llm-integration.md (forthcoming) + Phase 1
// dead-wire audit (2026-04-30) F-04 finding.
//
// EditProcessResult.deferReason is the discriminator added in D-1.12 Commit
// C. Pre-D-1.16-prefix the only HTTP consumer (essayCoachingRoutes.ts:637)
// returned a uniform `success: true` for ALL outcomes — caller could not
// distinguish "policy chose to defer" from "an inner layer crashed."
//
// `buildEditProcessResponse` is the extracted pure helper that branches the
// response shape on the four distinguishable outcomes. Pure-function shape
// makes the four branches unit-testable without HTTP-level setup; when a
// branch fails, the test name pinpoints the broken case.
//
// Diagnosability principle (per Tue's 2026-04-30 directive): each test
// asserts ONE thing about ONE branch. Failure → test name → broken branch.

import { describe, it, expect } from 'vitest';
import { buildEditProcessResponse } from '../../src/http/editProcessResponse';
import type { EditProcessResult } from '../../src/services/essayIntelligence/analysis/reanalysisOrchestrator';

// ─── Fixture builders ───────────────────────────────────────────────────

function baseSuccess(overrides: Partial<EditProcessResult> = {}): EditProcessResult {
  return {
    editOutput: {} as unknown as EditProcessResult['editOutput'],
    mode: 'focused',
    reanalysisTriggered: false,
    totalCost: 0.0123,
    costBreakdown: [],
    ...overrides,
  };
}

// ─── Branch 1: success path (no deferReason) ───────────────────────────

describe('D-1.16-prefix F-04 — buildEditProcessResponse: success path (deferReason=undefined)', () => {
  it('focused mode that completed → 200 success, deferred=false, deferReason=null', () => {
    const result = baseSuccess({ mode: 'focused', reanalysisTriggered: false });

    const { status, body } = buildEditProcessResponse(result);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.error).toBeUndefined();
    expect(body.code).toBeUndefined();
    expect(body.data.mode).toBe('focused');
    expect(body.data.reanalysisTriggered).toBe(false);
    expect(body.data.deferred).toBe(false);
    expect(body.data.deferReason).toBeNull();
  });

  it('comprehensive mode that completed (reanalysisTriggered=true) → 200 success, deferred=false', () => {
    const result = baseSuccess({ mode: 'comprehensive', reanalysisTriggered: true });

    const { status, body } = buildEditProcessResponse(result);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.mode).toBe('comprehensive');
    expect(body.data.reanalysisTriggered).toBe(true);
    expect(body.data.deferred).toBe(false);
    expect(body.data.deferReason).toBeNull();
  });
});

// ─── Branch 2: policy_defer ─────────────────────────────────────────────

describe('D-1.16-prefix F-04 — buildEditProcessResponse: policy_defer (healthy outcome)', () => {
  it('policy_defer → 200 success, deferred=true, deferReason=policy_defer, no error', () => {
    const result = baseSuccess({
      mode: 'comprehensive',
      reanalysisTriggered: false,
      deferReason: 'policy_defer',
    });

    const { status, body } = buildEditProcessResponse(result);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.error).toBeUndefined();
    expect(body.code).toBeUndefined();
    expect(body.data.deferred).toBe(true);
    expect(body.data.deferReason).toBe('policy_defer');
    // Still surface mode/reanalysisTriggered so the UI knows what was
    // intended (caller may want to display "your edit will be processed
    // when the threshold is reached").
    expect(body.data.mode).toBe('comprehensive');
    expect(body.data.reanalysisTriggered).toBe(false);
  });

  it('policy_defer with focused mode → 200 success, deferred=true', () => {
    // Less common but possible — focused result was returned with policy
    // defer attached (the policy decision was made AFTER focused completed).
    const result = baseSuccess({
      mode: 'focused',
      deferReason: 'policy_defer',
    });

    const { status, body } = buildEditProcessResponse(result);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deferred).toBe(true);
  });
});

// ─── Branch 3: focused_failed ───────────────────────────────────────────

describe('D-1.16-prefix F-04 — buildEditProcessResponse: focused_failed (focused analyzer threw)', () => {
  it('focused_failed with structured error → 503, success=false, populated error fields', () => {
    const result = baseSuccess({
      mode: 'deferred',
      reanalysisTriggered: false,
      deferReason: 'focused_failed',
      error: {
        layer: 'focusedAnalyzer',
        message: 'focused analyzer threw: malformed L3.5 delta',
        code: 'focused_analyzer_threw',
      },
    });

    const { status, body } = buildEditProcessResponse(result);

    expect(status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.code).toBe('focused_analyzer_threw');
    expect(body.error).toBe('focused analyzer threw: malformed L3.5 delta');
    expect(body.data.deferReason).toBe('focused_failed');
    expect(body.data.deferred).toBe(false);
    expect(body.data.failedLayer).toBe('focusedAnalyzer');
  });

  it('focused_failed with missing error → 503 with default code/message (defensive)', () => {
    // Defensive: even if the producer somehow set deferReason without
    // populating error, the response shape stays well-formed. This guards
    // against a hypothetical future producer-side regression.
    const result = baseSuccess({
      mode: 'deferred',
      deferReason: 'focused_failed',
      // error intentionally omitted
    });

    const { status, body } = buildEditProcessResponse(result);

    expect(status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.code).toBe('reanalysis_layer_failed');
    expect(body.error).toMatch(/Edit processing failed/i);
    expect(body.data.failedLayer).toBeUndefined();
  });
});

// ─── Branch 4: comprehensive_failed ─────────────────────────────────────

describe('D-1.16-prefix F-04 — buildEditProcessResponse: comprehensive_failed (triggerReanalysis threw)', () => {
  it('comprehensive_failed with structured error → 503, populated error.layer=triggerReanalysis', () => {
    const result = baseSuccess({
      mode: 'comprehensive',
      reanalysisTriggered: false,
      deferReason: 'comprehensive_failed',
      error: {
        layer: 'triggerReanalysis',
        message: 'triggerReanalysis threw: pipeline halt at L3 partial',
        code: 'trigger_reanalysis_threw',
      },
    });

    const { status, body } = buildEditProcessResponse(result);

    expect(status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.code).toBe('trigger_reanalysis_threw');
    expect(body.error).toBe('triggerReanalysis threw: pipeline halt at L3 partial');
    expect(body.data.deferReason).toBe('comprehensive_failed');
    expect(body.data.deferred).toBe(false);
    expect(body.data.failedLayer).toBe('triggerReanalysis');
  });
});

// ─── Diagnostic property: deferReason ALWAYS surfaced on the wire ──────

describe('D-1.16-prefix F-04 — buildEditProcessResponse: deferReason discriminator always wire-visible', () => {
  it('every branch surfaces deferReason in the response data — caller never has to infer from mode alone', () => {
    // Closes a subtle dead-wire risk: if any future variant returned a
    // body that did NOT include deferReason, callers would silently fall
    // back to the pre-D-1.12 "infer from mode" approach and lose the
    // discriminator's value. This test exhaustively asserts every branch
    // surfaces the discriminator.
    const variants: Array<{ name: string; result: EditProcessResult; expected: string | null }> = [
      { name: 'success-focused', result: baseSuccess({ mode: 'focused' }), expected: null },
      { name: 'success-comprehensive', result: baseSuccess({ mode: 'comprehensive', reanalysisTriggered: true }), expected: null },
      { name: 'policy_defer', result: baseSuccess({ deferReason: 'policy_defer' }), expected: 'policy_defer' },
      {
        name: 'focused_failed',
        result: baseSuccess({
          mode: 'deferred',
          deferReason: 'focused_failed',
          error: { layer: 'focusedAnalyzer', message: 'x', code: 'y' },
        }),
        expected: 'focused_failed',
      },
      {
        name: 'comprehensive_failed',
        result: baseSuccess({
          mode: 'comprehensive',
          deferReason: 'comprehensive_failed',
          error: { layer: 'triggerReanalysis', message: 'x', code: 'y' },
        }),
        expected: 'comprehensive_failed',
      },
    ];

    for (const variant of variants) {
      const { body } = buildEditProcessResponse(variant.result);
      expect(body.data.deferReason, `variant ${variant.name}: deferReason in response.data`).toBe(
        variant.expected,
      );
    }
  });
});
