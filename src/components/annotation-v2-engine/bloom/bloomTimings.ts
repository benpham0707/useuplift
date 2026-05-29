/**
 * bloomTimings.ts — pure constants table for the Phase 5 bloom timeline.
 *
 * Every millisecond landmark below is sourced from
 * `docs/ux_phases/phase_5_first_reveal.md` §2.1 (step-by-step choreography)
 * and §3 (millisecond-by-millisecond timeline table). Duration primitives
 * come from α-A `tokens.ts` (`DURATION.*`). We lift the named landmarks
 * into a single frozen record so `useBloomChoreography` and downstream
 * demos share one authoritative schedule.
 *
 * Authority matrix:
 *   - paragraph-tint deepen (40% → 55%)      → Phase 5 §2.1 step 1, §3 @ t=0
 *   - panel slide-in + overview card fade    → Phase 5 §2.1 step 2, §3 @ t=180
 *   - gutter role label fade stagger         → Phase 5 §2.1 step 3, §3 @ t=400
 *   - strengths wave (STRONG+)               → Phase 5 §2.1 step 4, §3 @ t=600
 *   - header narrative glow                  → Phase 5 §2.1 step 5, §3 @ t=900
 *   - critical wave (CRITICAL / NEEDS WORK)  → Phase 5 §2.1 step 6, §3 @ t=1500
 *   - auto-select settle + panel scroll      → Phase 5 §2.1 step 7, §3 @ t=2200
 *   - "Start here" chip fade-in              → Phase 5 §2.6, §3 @ t=2400
 *   - interactive handoff                    → Phase 5 §2.1 step 8, §3 @ t=2600
 *
 * The table expresses absolute millisecond offsets from t=0 (the
 * `reveal_ready` SSE event / Phase 4 → Phase 5 seam, per §2.1 "cross-lap
 * from Phase 4"). Durations, easings, and staggers live in `tokens.ts`;
 * this file only encodes the *landmark offsets*.
 *
 * NOTE on essay-length variation: Phase 5 §3 allows the wave totals to
 * compress/extend with sentence count, but the landmark offsets here are
 * the "average essay" schedule. Per-sentence timing lives in the editor
 * decoration CSS (α-A `workshop.css`) via `--bloom-order * 35ms` (α-A
 * `DURATION.sentenceBloomStagger`), not here.
 */

import { DURATION } from '../tokens';

/**
 * Phase 5 §3 millisecond landmarks. All offsets are from t=0 (the
 * `reveal_ready` moment / Phase 4 hand-off).
 *
 * The "crossLap" window (t=0 → t=180) corresponds to Phase 5 §2.1 step 1 —
 * the final Phase 4 paragraph tint settles while tint saturation deepens
 * 40% → 55% (α-A `DURATION.paragraphTintDeepen` = 600ms; the *peak visual*
 * is during the crossLap but the animation itself resolves by t≈600).
 *
 * "panelFill" window (t=180 → t=520) — Phase 5 §2.1 step 2 + §3 @ t=180-430
 * panel slide-in (`DURATION.panelSlide` = 250ms), then overview card
 * contents crossfade during the slide (`DURATION.contentCrossfade` = 180ms,
 * resolved by t=430). We round up to 520 to leave room for visual settle
 * before the gutter label stagger begins at t=400 (they overlap by design
 * per Phase 5 §2.8 — "coincide with paragraph-tint deepening").
 */
export const BLOOM_TIMELINE = {
  /** Phase 5 §2.1 step 1 / §3 @ t=0. Cross-lap with Phase 4 begins. */
  crossLapStart: 0,
  /** Phase 5 §2.1 step 1 / §3 @ t=180. Panel begins slide-in. */
  crossLapEnd: 180,

  /** Phase 5 §2.1 step 2 / §3 @ t=180. Panel slide-in begins. */
  panelFillStart: 180,
  /**
   * Phase 5 §3 @ t=430 + visual settle margin. Panel slide-in
   * (250ms @ ease-out-expo) resolves at t=430; overview card
   * crossfade (180ms) overlaps and resolves at t=410. We stamp
   * 520 here to leave headroom before gutter labels finish
   * staggering in. Consumers read this as "panel fully present."
   */
  panelFillEnd: 520,

  /** Phase 5 §2.1 step 3 / §3 @ t=400. First gutter label begins fading. */
  gutterLabelsStart: 400,
  /**
   * Phase 5 §3 @ t=800. "Gutter labels complete" — last label's
   * 180ms fade finishes by t=800 for a 5-paragraph essay
   * (400 + 4×40 stagger + 180 fade ≈ 740, rounded up).
   */
  gutterLabelsEnd: 800,

  /** Phase 5 §2.1 step 4 / §3 @ t=600. Strengths wave begins. */
  strengthsWaveStart: 600,
  /**
   * Phase 5 §2.1 step 4 / §3 @ t=1500. Strengths wave complete
   * for average essay (9 STRONG+ × 35ms stagger + 160ms bloom).
   * Equal to `strengthsWaveStart + DURATION.strengthsWaveTotal`.
   */
  strengthsWaveEnd: 600 + DURATION.strengthsWaveTotal,

  /** Phase 5 §2.1 step 5 / §3 @ t=900. Header narrative fade-in starts. */
  headerNarrativeStart: 900,
  /**
   * Phase 5 §3 @ t=1140 (240ms fade) + settle margin so the full
   * strengths wave is still running when the header lands. We
   * round up to 1800 so header narrative visibility persists
   * through the crossover into the critical wave.
   */
  headerNarrativeEnd: 1800,

  /** Phase 5 §2.1 step 6 / §3 @ t=1500. Critical wave begins. */
  criticalWaveStart: 1500,
  /**
   * Phase 5 §2.1 step 6 / §3 @ t=2400. Critical wave complete
   * (criticalWaveStart + DURATION.criticalWaveTotal = 2400).
   */
  criticalWaveEnd: 1500 + DURATION.criticalWaveTotal,

  /** Phase 5 §2.1 step 7 / §3 @ t=2200. Auto-selection fires. */
  autoSelectStart: 2200,
  /**
   * Phase 5 §2.1 step 7 / §3 @ t=2600. Auto-select pulse
   * completes (autoSelectStart + DURATION.autoSelectPulse).
   */
  autoSelectEnd: 2200 + DURATION.autoSelectPulse,

  /** Phase 5 §2.6 / §3 @ t=2600. Interactive handoff to Phase 6. */
  interactive: 2600,
} as const;

export type BloomLandmark = keyof typeof BLOOM_TIMELINE;

/**
 * Phase 5 §2.1 "`prefers-reduced-motion`: all blooms collapse to a single
 * 220ms crossfade at t=400ms."
 *
 * We expose the reduced-motion total window here so `useBloomChoreography`
 * can drive a single transition instead of stepping through the 10-landmark
 * timeline above. Crossfade duration sourced from
 * α-A `DURATION.reducedMotionCrossfade` (220ms).
 *
 * `reducedMotionFireAt` reflects the spec's "at t=400ms" fire moment —
 * chosen so the reduced-motion crossfade still lags the `reveal_ready`
 * event by enough for screen-readers to queue the "Analysis complete"
 * announcement first (Phase 5 §2.10 a11y).
 */
export const REDUCED_MOTION_TIMELINE = {
  /** Phase 5 §2.1 reduced-motion "at t=400ms". */
  fireAt: 400,
  /** Phase 5 §2.1 — 220ms crossfade, α-A DURATION.reducedMotionCrossfade. */
  crossfadeMs: DURATION.reducedMotionCrossfade,
} as const;
