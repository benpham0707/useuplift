// ============================================================================
// EditProcessResult → HTTP response shaping (D-1.16-prefix F-04 closure)
// ============================================================================
//
// `EditProcessResult.deferReason` is the discriminator added in D-1.12 Commit
// C (close-out of the silent-defer ambiguity that the halt-on-error audit
// surfaced). Pre-D-1.16-prefix the only HTTP consumer at
// `essayCoachingRoutes.ts:637` returned a uniform `success: true` for ALL
// edit outcomes — the caller could not distinguish "policy chose to defer"
// from "an inner layer crashed."
//
// Phase 1 dead-wire audit (2026-04-30) tagged the unread discriminator as
// F-04. This module closes F-04 by providing the response-shape helper
// that branches on the four distinguishable outcomes.
//
// Extracted to its own pure module so:
//   - the four branches are unit-testable without HTTP-level setup OR
//     pulling in the route file's transitive dependencies (supabase admin,
//     credits, narrative bridge, etc.);
//   - failure pinpoints to one of: success / policy_defer / focused_failed
//     / comprehensive_failed by test name alone (per Tue's diagnosability
//     directive 2026-04-30).
//
// Branch mapping:
//
//   1. Success path (`deferReason === undefined`) — focused or comprehensive
//      analysis completed. HTTP 200, success: true. Same as pre-fix.
//
//   2. Policy defer (`deferReason === 'policy_defer'`) — focused recommended
//      escalation but the version tracker policy chose to wait for a higher
//      threshold. This is a HEALTHY outcome. HTTP 200, success: true,
//      `deferred: true` so the UI can show "Queued for full review" rather
//      than the success-path "Done" UX.
//
//   3. Focused failure (`deferReason === 'focused_failed'`) — focused
//      analyzer threw. HTTP 503, success: false, populated `error.layer`,
//      `error.code`, `error.message`. UI surfaces the diagnostic.
//
//   4. Comprehensive failure (`deferReason === 'comprehensive_failed'`) —
//      `triggerReanalysis` threw inside the comprehensive escalation tail.
//      Same HTTP 503 + structured error shape as (3).
//
// Defensive fallbacks (focused_failed / comprehensive_failed without a
// populated `error` object): the response stays well-formed with default
// code (`reanalysis_layer_failed`) and a generic message. Guards against a
// hypothetical producer-side regression where `deferReason` is set without
// `error` — the caller still gets a structured 503 instead of a malformed
// response.

import type { EditProcessResult } from '../services/essayIntelligence/analysis/reanalysisOrchestrator';

export interface EditProcessResponse {
  status: number;
  body: {
    success: boolean;
    code?: string;
    error?: string;
    data: {
      mode: EditProcessResult['mode'];
      reanalysisTriggered: boolean;
      totalCost: number;
      deferReason: EditProcessResult['deferReason'] | null;
      deferred: boolean;
      failedLayer?: NonNullable<EditProcessResult['error']>['layer'];
    };
  };
}

export function buildEditProcessResponse(editResult: EditProcessResult): EditProcessResponse {
  const baseData = {
    mode: editResult.mode,
    reanalysisTriggered: editResult.reanalysisTriggered,
    totalCost: editResult.totalCost,
    deferReason: editResult.deferReason ?? null,
  };

  if (
    editResult.deferReason === 'focused_failed' ||
    editResult.deferReason === 'comprehensive_failed'
  ) {
    return {
      status: 503,
      body: {
        success: false,
        code: editResult.error?.code ?? 'reanalysis_layer_failed',
        error:
          editResult.error?.message ??
          'Edit processing failed inside the analysis pipeline; retry recommended.',
        data: {
          ...baseData,
          deferred: false,
          failedLayer: editResult.error?.layer,
        },
      },
    };
  }

  // Success or policy-defer (both are HTTP 200, success: true).
  // `deferred: true` distinguishes the policy-defer case from the success
  // case for the UI; `deferReason: 'policy_defer'` carries the same signal
  // for any caller that prefers the discriminator field.
  return {
    status: 200,
    body: {
      success: true,
      data: {
        ...baseData,
        deferred: editResult.deferReason === 'policy_defer',
      },
    },
  };
}
