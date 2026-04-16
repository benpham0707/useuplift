/**
 * voiceEvolution.ts — Phase 2b derived signals.
 *
 * Consumes the Phase 1 ProfileSnapshot chain (voiceIdentitySnapshot per
 * snapshot) plus the current EssayProfile to compute:
 *   - markersLostSincePrior / markersGainedSincePrior (set diff)
 *   - registerStabilityTrend ('improving' | 'stable' | 'regressing' | 'unknown')
 *   - vividnessTrajectory  ('sharpening' | 'maintained' | 'flattening' | 'unknown')
 *   - overRevisionWarning (sticky across calls until vividness recovers)
 *   - intentionalShift  (takes precedence over over-revision warning)
 *   - summaryForCoach (2–4 sentence deterministic summary)
 *
 * ZERO LLM calls. Pure computation.
 *
 * Over-revision detection requires >=2 consecutive flattening transitions,
 * which means >=3 snapshots' worth of vividness signal are needed (prior
 * transition + current transition). Single-session flattening does NOT
 * trigger the warning.
 *
 * Stickiness: once the warning has fired for a profile, subsequent recomputes
 * keep `triggered: true` until vividness recovers to 'vivid' or 'balanced'.
 * The sticky path reads the PRIOR value from `currentProfile.voiceEvolution`
 * — which the coordinator attaches AFTER the previous recompute. On the
 * first-ever compute for a profile the field is absent, so stickiness is a
 * no-op there.
 */

import type {
  EssayProfile,
  VoiceEvolutionSignals,
} from '../profileTypes';
import {
  extractSnapshot,
  hashEssayText,
  type ProfileSnapshot,
  type VividnessSignal,
} from './profileSnapshot';

// ============================================================================
// PUBLIC ENTRY POINT
// ============================================================================

/**
 * Compute cross-session voice evolution signals.
 *
 * @param currentProfile The live profile we're evaluating this session.
 * @param history        Prior snapshots, oldest→newest. Typically produced
 *                       by `readRecentSnapshots(profile.revisionHistory, 10)`
 *                       BEFORE this session's write.
 * @returns              null when history.length < 2 (no basis for trend).
 */
export function computeVoiceEvolution(
  currentProfile: EssayProfile,
  history: ProfileSnapshot[],
): VoiceEvolutionSignals | null {
  if (!history || history.length < 2) return null;

  // Extract a snapshot-shape voice slice of the CURRENT profile so all
  // comparisons use one schema. The hardcoded sessionId/version do not
  // persist anywhere — this snapshot is never written.
  const currentSnap = extractSnapshot(currentProfile, '__voiceEvo_current__', -1);
  const currentVoice = currentSnap.voiceIdentitySnapshot;

  // Strip the current-session snapshot from the chain (matched by essay
  // hash). This keeps us from reading the current profile as if it were
  // its own prior — the trajectory comparison depends on an EARLIER
  // snapshot, not the just-written one.
  const priorSnapshots = splitPriorsFromCurrent(history, currentProfile);
  if (priorSnapshots.length === 0) return null;
  const priorVoice = priorSnapshots[priorSnapshots.length - 1].voiceIdentitySnapshot;

  // ── marker diff ─────────────────────────────────────────────────────────
  const priorMarkers = new Set(priorVoice.voiceMarkers ?? []);
  const currentMarkers = new Set(currentVoice.voiceMarkers ?? []);
  const markersLostSincePrior = [...priorMarkers].filter((m) => !currentMarkers.has(m));
  const markersGainedSincePrior = [...currentMarkers].filter((m) => !priorMarkers.has(m));

  // ── register stability trend ────────────────────────────────────────────
  // Timeline: prior snapshots oldest→newest, then current (appended once).
  const registerCounts: number[] = [
    ...priorSnapshots.map((s) => (s.voiceIdentitySnapshot.registerShifts ?? []).length),
    (currentVoice.registerShifts ?? []).length,
  ];
  const registerStabilityTrend = computeRegisterTrend(registerCounts);

  // ── vividness trajectory (most-recent transition) ───────────────────────
  const vividnessTrajectory = computeVividnessTransition(
    priorVoice.vividnessSignal,
    currentVoice.vividnessSignal,
  );

  // ── intentional shift (takes precedence over over-revision warning) ─────
  // Fold in vividness trajectory so the trimming-without-swap branch can
  // gate on it — deliberate trimming is only intentional when vividness is
  // NOT flattening. Computed ahead of the full transitions series below so
  // both branches see the same signal.
  const intentional = detectIntentionalShift(
    markersLostSincePrior,
    markersGainedSincePrior,
    registerStabilityTrend,
    vividnessTrajectory,
  );

  // ── over-revision warning ───────────────────────────────────────────────
  // Fires when >=2 consecutive flattening transitions. Transitions live
  // between consecutive PRIOR snapshots, plus the current-profile trailing
  // step.
  const vividnessSeries: VividnessSignal[] = [
    ...priorSnapshots.map((s) => s.voiceIdentitySnapshot.vividnessSignal),
    currentVoice.vividnessSignal,
  ];
  const transitions: Array<ReturnType<typeof computeVividnessTransition>> = [];
  for (let i = 1; i < vividnessSeries.length; i++) {
    transitions.push(computeVividnessTransition(vividnessSeries[i - 1], vividnessSeries[i]));
  }

  let overRevisionTriggered = false;
  let overRevisionReasoning: string | null = null;
  let overRevisionFraming: string | null = null;

  if (transitions.length >= 2) {
    const lastTwo = transitions.slice(-2);
    if (lastTwo[0] === 'flattening' && lastTwo[1] === 'flattening') {
      overRevisionTriggered = true;
      overRevisionReasoning =
        markersLostSincePrior.length > 0
          ? `Vividness has flattened across two consecutive transitions; signature markers lost: ${markersLostSincePrior.join(', ')}.`
          : `Vividness has flattened across two consecutive transitions; voice markers are thinning even though no single marker has fully disappeared this session.`;
      const markerPhrase =
        markersLostSincePrior.length > 0
          ? markersLostSincePrior.join(', ')
          : 'distinctive voice markers';
      overRevisionFraming =
        `Your earlier drafts had ${markerPhrase} as signature moves — this version has removed them. ` +
        `Was this a voice evolution or a voice loss? Polishing the life out of an essay is a known failure mode.`;
    }
  }

  // Stickiness: if the PRIOR compute fired the warning, preserve it until
  // vividness recovers to 'vivid' or 'balanced'.
  const priorWarning = currentProfile.voiceEvolution?.overRevisionWarning;
  if (
    priorWarning &&
    priorWarning.triggered &&
    currentVoice.vividnessSignal !== 'vivid' &&
    currentVoice.vividnessSignal !== 'balanced'
  ) {
    overRevisionTriggered = true;
    // Preserve the prior reasoning / framing if we don't have a fresh one.
    if (!overRevisionReasoning) overRevisionReasoning = priorWarning.reasoning;
    if (!overRevisionFraming) overRevisionFraming = priorWarning.framingForCoach;
  }

  // Intentional shift precedence: if detected, suppress the over-revision
  // warning. Intentional voice swaps with stable register are NOT the
  // failure mode the warning is meant to catch.
  if (intentional.detected) {
    overRevisionTriggered = false;
    overRevisionReasoning = null;
    overRevisionFraming = null;
  }

  // ── summary ─────────────────────────────────────────────────────────────
  const summaryForCoach = composeSummary({
    markersLostSincePrior,
    markersGainedSincePrior,
    registerStabilityTrend,
    vividnessTrajectory,
    overRevisionTriggered,
    intentional,
  });

  return {
    markersLostSincePrior,
    markersGainedSincePrior,
    registerStabilityTrend,
    vividnessTrajectory,
    overRevisionWarning: {
      triggered: overRevisionTriggered,
      reasoning: overRevisionReasoning,
      framingForCoach: overRevisionFraming,
    },
    intentionalShift: intentional,
    summaryForCoach,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Reconstruct essay text the same way Agent A's snapshot extractor does.
 * Ensures hash-match when we attempt to strip the current-session snapshot.
 */
function reconstructEssayText(profile: EssayProfile): string {
  return (profile.paragraphs ?? [])
    .map((p) => (typeof p.text === 'string' ? p.text : ''))
    .join('\n\n');
}

/**
 * Strip the trailing current-session snapshot from `history` when its
 * essay-text hash matches the current profile. See revisionIntelligence
 * for the same pattern — both modules read history as "possibly includes
 * the current session at the end" and normalize here.
 */
function splitPriorsFromCurrent(
  history: ProfileSnapshot[],
  currentProfile: EssayProfile,
): ProfileSnapshot[] {
  if (history.length === 0) return [];
  const currentHash = hashEssayText(reconstructEssayText(currentProfile));
  if (history[history.length - 1].essayTextHash === currentHash) {
    return history.slice(0, -1);
  }
  return [...history];
}

/**
 * Register stability trend from the per-snapshot registerShifts[] count
 * series, oldest→newest including the current profile as the trailing entry.
 *
 *   - 2 entries only: compare delta directly — equal = 'stable',
 *     decreased = 'improving' (fewer shifts = more control), increased
 *     = 'regressing'.
 *   - 3+ entries: require monotonic non-increasing (improving if final <
 *     initial) OR monotonic non-decreasing (regressing if final > initial).
 *     Non-monotonic → 'unknown'.
 *   - All equal → 'stable'.
 */
function computeRegisterTrend(
  counts: number[],
): VoiceEvolutionSignals['registerStabilityTrend'] {
  if (counts.length < 2) return 'unknown';

  const first = counts[0];
  const last = counts[counts.length - 1];
  const allEqual = counts.every((c) => c === first);
  if (allEqual) return 'stable';

  // Monotonicity check
  let monotonicDown = true;
  let monotonicUp = true;
  for (let i = 1; i < counts.length; i++) {
    if (counts[i] > counts[i - 1]) monotonicDown = false;
    if (counts[i] < counts[i - 1]) monotonicUp = false;
  }

  if (monotonicDown && last < first) return 'improving';
  if (monotonicUp && last > first) return 'regressing';
  if (counts.length === 2) {
    // Only two points and they differ — treat as trend (covered above).
    // Reaching here means counts[1] !== counts[0] yet neither monotonic
    // branch matched, which can't happen for length 2; fallthrough safety:
    return 'unknown';
  }
  return 'unknown';
}

/**
 * Classify a single vividness transition from prior to current. See schema
 * docstring for the full mapping.
 */
function computeVividnessTransition(
  prior: VividnessSignal | undefined,
  current: VividnessSignal | undefined,
): VoiceEvolutionSignals['vividnessTrajectory'] {
  if (!prior || !current) return 'unknown';
  if (prior === current) return 'maintained';
  if (prior === 'vivid' && current === 'flattened') return 'flattening';
  if (prior === 'flattened' && current === 'vivid') return 'sharpening';
  // Balanced transitions: direction toward flattened = flattening, toward
  // vivid = sharpening.
  if (prior === 'balanced' && current === 'flattened') return 'flattening';
  if (prior === 'balanced' && current === 'vivid') return 'sharpening';
  if (prior === 'flattened' && current === 'balanced') return 'sharpening';
  if (prior === 'vivid' && current === 'balanced') return 'flattening';
  return 'unknown';
}

/**
 * Intentional shift covers two authentic voice moves that would otherwise
 * read as erosion:
 *
 *   1. SWAP — markers lost AND markers gained, register stable/improving.
 *      A deliberate exchange of one signature move for another. Always
 *      intentional; vividness is permitted to dip during a swap because the
 *      student is mid-retooling.
 *
 *   2. DELIBERATE TRIMMING (new) — markers lost, NONE gained, register
 *      stable/improving, vividness NOT flattening. This is the "tightening
 *      the voice" move: a student drops noisy markers without adding new
 *      ones while the essay still reads as vivid/maintained. The vividness
 *      gate is load-bearing: if vividness IS flattening while markers are
 *      being dropped with nothing in return, that IS over-revision and the
 *      warning must be allowed to fire — so this branch DELIBERATELY
 *      excludes the flattening case.
 *
 * When either branch fires, the caller suppresses the over-revision
 * warning (see `overRevisionTriggered = false` right after `intentional.detected`).
 */
function detectIntentionalShift(
  lost: string[],
  gained: string[],
  registerTrend: VoiceEvolutionSignals['registerStabilityTrend'],
  vividnessTrajectory: VoiceEvolutionSignals['vividnessTrajectory'],
): VoiceEvolutionSignals['intentionalShift'] {
  const registerOK =
    registerTrend === 'stable' || registerTrend === 'improving';

  // Branch 1 — SWAP
  if (lost.length > 0 && gained.length > 0 && registerOK) {
    return {
      detected: true,
      reasoning: `Voice markers swapped intentionally (lost: ${lost.join(', ')}; gained: ${gained.join(', ')}) while register stayed ${registerTrend}.`,
    };
  }

  // Branch 2 — DELIBERATE TRIMMING
  if (
    lost.length > 0 &&
    gained.length === 0 &&
    registerOK &&
    vividnessTrajectory !== 'flattening'
  ) {
    return {
      detected: true,
      reasoning: `Controlled trimming: ${lost.length} voice marker${lost.length === 1 ? '' : 's'} removed (${lost.join(', ')}) with nothing new added while register stayed ${registerTrend} and vividness did not flatten.`,
    };
  }

  return { detected: false, reasoning: null };
}

// ============================================================================
// SUMMARY
// ============================================================================

interface VoiceSummaryInputs {
  markersLostSincePrior: string[];
  markersGainedSincePrior: string[];
  registerStabilityTrend: VoiceEvolutionSignals['registerStabilityTrend'];
  vividnessTrajectory: VoiceEvolutionSignals['vividnessTrajectory'];
  overRevisionTriggered: boolean;
  intentional: VoiceEvolutionSignals['intentionalShift'];
}

/**
 * 2–4 sentence deterministic summary. Priority:
 *   1. Over-revision warning (most urgent)
 *   2. Intentional shift (positive signal worth crediting)
 *   3. Vividness trajectory when non-trivial
 *   4. Register trend when non-trivial
 *
 * Empty string when no signal is worth surfacing.
 */
function composeSummary(inputs: VoiceSummaryInputs): string {
  const sentences: string[] = [];

  if (inputs.overRevisionTriggered) {
    sentences.push(
      `Voice vividness has flattened across multiple consecutive revisions.`,
    );
  }

  if (inputs.intentional.detected) {
    sentences.push(
      `Voice markers were swapped deliberately while register stayed controlled.`,
    );
  }

  if (
    inputs.vividnessTrajectory === 'flattening' &&
    !inputs.overRevisionTriggered
  ) {
    sentences.push(`Vividness has flattened since the last revision.`);
  } else if (inputs.vividnessTrajectory === 'sharpening') {
    sentences.push(`Vividness has sharpened since the last revision.`);
  }

  if (
    inputs.registerStabilityTrend === 'improving' &&
    sentences.length < 4
  ) {
    sentences.push(`Register control has improved across revisions.`);
  } else if (
    inputs.registerStabilityTrend === 'regressing' &&
    sentences.length < 4
  ) {
    sentences.push(`Register shifts are increasing — control is slipping.`);
  }

  // Marker-swap color if we haven't surfaced intentional shift already.
  if (
    !inputs.intentional.detected &&
    sentences.length < 4 &&
    inputs.markersLostSincePrior.length > 0 &&
    inputs.markersGainedSincePrior.length === 0
  ) {
    sentences.push(
      `${inputs.markersLostSincePrior.length} voice marker${inputs.markersLostSincePrior.length === 1 ? '' : 's'} lost since the prior revision.`,
    );
  }

  if (sentences.length === 0) return '';
  const capped = sentences.slice(0, 4);
  const terminated = capped.map((s) =>
    /[.?!]$/.test(s.trim()) ? s : s.replace(/\s*$/, '.'),
  );
  return terminated.join(' ');
}
