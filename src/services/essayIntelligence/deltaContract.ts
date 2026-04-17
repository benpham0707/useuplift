/**
 * deltaContract.ts — Orphan-diagnostic enforcement for the Essay Intelligence
 * pipeline.
 *
 * The Delta Contract is a single, load-bearing invariant: every diagnostic the
 * system produces MUST bind to either (a) a specific essay edit or (b) a
 * specific change in coach behaviour. Diagnostics that bind to neither are
 * "orphans" — they cost tokens to produce but never reach the student. The
 * April 14 audit found ~41% of output was orphaned. This module makes orphans
 * impossible to ship silently by failing at the point of creation.
 *
 * Responsibilities
 *  - `validateDelta`        — the core predicate: essayChange OR coachingChange
 *  - `assertNoOrphans`      — batch validator that throws `DeltaContractViolation`
 *                             with the full list of offenders attached
 *  - `improvementEntryToDelta` — adapter wrapping the legacy ImprovementEntry
 *                             as a Delta so existing manifest builders can be
 *                             validated without a rewrite
 *  - `summarizeOrphans`     — human-readable diagnostic for console warnings
 *  - `DeltaContractViolation` — thrown by `assertNoOrphans`; carries offenders
 *
 * The adapter is intentionally permissive: it does NOT guess an essayChange
 * or coachingChange when the underlying entry lacks the information. If an
 * ImprovementEntry has no `action`, no `demonstration`, and no `technique`,
 * the adapter returns a Delta with `essayChange: null, coachingChange: null`,
 * which the validator then rejects. That failure path is the point — it's
 * how we surface manifest bugs at build time instead of delivery time.
 */

import type { Delta, ImprovementEntry } from './profileTypes';

/**
 * Custom error thrown by `assertNoOrphans` when one or more deltas fail the
 * essayChange/coachingChange binding invariant. `orphanDeltas` lets callers
 * produce rich diagnostics without re-scanning the input.
 */
export class DeltaContractViolation extends Error {
  public readonly orphanDeltas: Delta[];

  constructor(orphanDeltas: Delta[], message?: string) {
    super(
      message ??
        `Delta Contract violation: ${orphanDeltas.length} orphan diagnostic(s) ` +
          `had neither an essayChange nor a coachingChange.`,
    );
    this.name = 'DeltaContractViolation';
    this.orphanDeltas = orphanDeltas;
    // Restore prototype chain (TS emits a downcasted constructor on ES5 targets).
    Object.setPrototypeOf(this, DeltaContractViolation.prototype);
  }
}

/**
 * Validate a single Delta against the Contract's binding invariant.
 *
 * Throws `DeltaContractViolation` if the delta is an orphan (both
 * `essayChange` and `coachingChange` are null). Accepts deltas that bind to
 * only one side — they're not orphans, they're prescriptions of one kind or
 * the other. Throws with the single offending delta attached, so callers can
 * surface context-rich errors.
 */
export function validateDelta(d: Delta): void {
  if (d.essayChange === null && d.coachingChange === null) {
    throw new DeltaContractViolation(
      [d],
      `Delta Contract violation: orphan diagnostic "${truncate(d.observation, 100)}" ` +
        `from ${d.sourceLayer} has neither an essayChange nor a coachingChange. ` +
        `Every diagnostic must bind to an essay edit or a coach prompt injection.`,
    );
  }
}

/**
 * Batch validator. Scans all deltas, collects every orphan, and throws once
 * with the full list attached. Non-orphans are passed silently.
 *
 * Using a batch throw (instead of fail-fast on the first orphan) gives the
 * caller the complete picture of what's wrong with the manifest — useful
 * when debugging why a layer is systematically emitting orphans.
 */
export function assertNoOrphans(deltas: Delta[]): void {
  const orphans: Delta[] = [];
  for (const d of deltas) {
    if (d.essayChange === null && d.coachingChange === null) {
      orphans.push(d);
    }
  }
  if (orphans.length > 0) {
    throw new DeltaContractViolation(orphans);
  }
}

/**
 * Adapter: wrap a legacy `ImprovementEntry` as a `Delta`. This is the bridge
 * that lets `buildImprovementManifest` emit ImprovementEntry[] (as it does
 * today) while the Delta Contract validator can still enforce the invariant.
 *
 * Mapping:
 *   entry.action        → coachingChange.promptInjection
 *   entry.technique     → coachingChange.gateName = 'technique_fire'
 *                         (when technique is populated; otherwise we use a
 *                         layer-specific default gate)
 *   entry.demonstration → essayChange.after (with `kind: 'rewrite_paragraph'`)
 *                         (essay-specific demo from L5 is preferred)
 *   entry.surfaceByTurn → delta.surfaceByTurn (default 99 — effectively no
 *                         deadline — when unset)
 *   entry.source === 'red_flag' → forceSurface: true
 *
 * Orphan production is intentional. If an entry has:
 *   - action = ''          (no coaching prescription)
 *   - demonstration = null (no essay edit prescription)
 *   - essaySpecificDemo = null
 *   - technique = null     (no gate to route through)
 * then there is literally nothing the downstream coach can act on, and we
 * return a delta with both bindings null. The validator then surfaces the
 * upstream bug at manifest-build time.
 */
export function improvementEntryToDelta(
  entry: ImprovementEntry,
  sourceLayer: string,
): Delta {
  // ── essayChange derivation ────────────────────────────────────────────
  // Prefer the L5-generated essay-specific demo (in the student's voice,
  // grounded in their actual material) over the research-DB generic
  // boilerplate. Both land in `demonstration`-shaped fields on the entry.
  const essaySpecific = entry.essaySpecificDemo ?? null;
  const genericDemo = entry.demonstration ?? null;
  const chosenAfter = essaySpecific ?? genericDemo;

  const essayChange: Delta['essayChange'] = chosenAfter
    ? {
        paragraph: entry.paragraph,
        before: '', // pre-edit text not captured at the ImprovementEntry layer
        after: chosenAfter,
        kind: 'rewrite_paragraph',
      }
    : null;

  // ── coachingChange derivation ─────────────────────────────────────────
  // Require a non-empty action string. Whitespace-only action is treated as
  // "no prescription" and produces a null coachingChange. Without SOME gate
  // name we can't hook this delta into the test pyramid, so an entry with
  // action but no technique falls back to a layer-specific default gate.
  const actionTrimmed = (entry.action ?? '').trim();
  let coachingChange: Delta['coachingChange'] = null;
  if (actionTrimmed.length > 0) {
    const gateName = entry.technique
      ? 'technique_fire'
      : defaultGateForLayer(sourceLayer);
    if (gateName !== null) {
      coachingChange = {
        promptInjection: actionTrimmed,
        gateName,
      };
    }
  }

  return {
    observation: entry.observation ?? '',
    essayChange,
    coachingChange,
    studentTakeaway: deriveStudentTakeaway(entry),
    // ImprovementEntry.surfaceByTurn is optional; unset means "no deadline".
    // Represent that as a large sentinel so the rotation logic can compare
    // numerically without special-casing undefined.
    surfaceByTurn: entry.surfaceByTurn ?? 99,
    // red_flag (howlers, AO critical flags) always bypass rotation —
    // that's the whole point of the red_flag classification.
    forceSurface: entry.source === 'red_flag',
    killCriteria: deriveKillCriteria(entry),
    sourceLayer,
    sourceRef: entry.sourceRef ?? null,
  };
}

/**
 * Produce a human-readable multi-line diagnostic of which deltas failed
 * validation and why. Used by the build-time assertion in
 * `analysisOrchestrator.buildImprovementManifest` to log orphans without
 * blowing up the pipeline when strict mode is off.
 */
export function summarizeOrphans(deltas: Delta[]): string {
  const orphans = deltas.filter(
    (d) => d.essayChange === null && d.coachingChange === null,
  );
  if (orphans.length === 0) return '(no orphans)';
  return orphans
    .map((d, i) => {
      const why = diagnoseWhyOrphan(d);
      return (
        `  [${i + 1}] sourceLayer=${d.sourceLayer} sourceRef=${d.sourceRef ?? 'null'}\n` +
        `      observation: "${truncate(d.observation, 140)}"\n` +
        `      reason: ${why}`
      );
    })
    .join('\n');
}

// ─────────────────────────────────────────────────────────────────────────
// Internal helpers (not exported — treat as implementation detail)
// ─────────────────────────────────────────────────────────────────────────

/**
 * When an entry lacks a named craft technique but still has a valid action,
 * route the delta through a layer-appropriate default gate so it can still
 * fire through the coach rotation.
 */
function defaultGateForLayer(sourceLayer: string): string | null {
  switch (sourceLayer) {
    case 'howler':
    case 'red_flag':
      return 'howler_surface';
    case 'ao_first_read':
      return 'ao_first_read_surface';
    case 'l4_priority':
    case 'L4':
      return 'priority_surface';
    case 'l5_annotation':
    case 'L5':
      return 'annotation_surface';
    case 'l35_finding':
    case 'L3.5':
      return 'finding_surface';
    case 'l3_observation':
    case 'L3':
      return 'observation_surface';
    case 'l375_growth_edge':
    case 'L3.75':
      return 'growth_edge_surface';
    default:
      // Unknown layer with no technique → we can't classify the gate.
      // Returning null makes the coachingChange null, which — combined with
      // a missing demonstration — produces an orphan. That's the correct
      // failure mode: a diagnostic the system can't route shouldn't ship.
      return null;
  }
}

/**
 * Best-effort extraction of the transferable craft idea. For legacy entries
 * we don't have a dedicated field; we synthesize a compact phrase from the
 * technique name (most meaningful) or the first clause of the action. ≤25
 * words enforced by truncation.
 */
function deriveStudentTakeaway(entry: ImprovementEntry): string {
  if (entry.technique) {
    return truncateWords(`Practice ${entry.technique}.`, 25);
  }
  const action = (entry.action ?? '').trim();
  if (action.length > 0) {
    return truncateWords(action, 25);
  }
  return '';
}

/**
 * Derive a kill-criteria string: the condition under which this delta
 * becomes stale. For howlers/red flags the criterion is that the evidence
 * phrase has been removed from the essay. For structural priorities it's
 * that the paragraph role has changed. We encode these as prose for the
 * downstream rotation logic to interpret.
 */
function deriveKillCriteria(entry: ImprovementEntry): string {
  if (entry.source === 'red_flag') {
    return 'Evidence phrase no longer present in the essay.';
  }
  if (entry.source === 'l4_priority') {
    return `Paragraph ${entry.paragraph + 1} no longer exhibits the observed issue.`;
  }
  return 'Student has addressed the action in-essay.';
}

function diagnoseWhyOrphan(d: Delta): string {
  const parts: string[] = [];
  if (d.essayChange === null) parts.push('no demonstration/essaySpecificDemo');
  if (d.coachingChange === null) parts.push('no action or untrusted source layer');
  return parts.join(' AND ');
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}

function truncateWords(s: string, n: number): string {
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length <= n) return s.trim();
  return words.slice(0, n).join(' ') + '…';
}
