/**
 * Phase 4 — Vapor Scan component.
 *
 * Authority:
 *   - docs/ux_phases/phase_4_loading_state.md §2.4 (vapor-scan spec,
 *     140px tall luminous band, plus-lighter blend)
 *   - docs/ux_phases/phase_4_loading_state.md §3 (240ms fade-in,
 *     320ms fade-out, ~3s drift per pass)
 *   - workshop.css `@keyframes vapor-scan` (authoritative motion
 *     keyframe owned by Workstream A)
 *
 * Visual contract:
 *   - A soft vertical gradient band, ~140px tall, blurred, drifting
 *     top-to-bottom across its container (the editor surface).
 *   - Loops for the duration of the `active` phase.
 *   - Fades in over 240ms (Phase 4 §3 `vaporScanFadeIn`) on mount while
 *     `phase === 'active'`; fades out over 320ms when `phase` becomes
 *     `'done'` (§3 `vaporScanFadeOut`). `'settling'` behaves like
 *     `'active'` visually — the band keeps drifting until the floor
 *     is reached.
 *   - Consumer is responsible for mounting this inside a
 *     `position: relative` container. The scan is absolutely
 *     positioned with `inset-inline: 0` and fills the full vertical
 *     length of that container.
 *
 * prefers-reduced-motion: the drift animation is suppressed and the
 * band becomes a static ~200ms opacity fade on the editor surface.
 * workshop.css enforces the reduced-motion keyframe collapse too, but
 * we gate the `motion/react` animation here so React doesn't produce
 * drift values unnecessarily.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import { DURATION } from '../tokens';

export type VaporScanPhase = 'active' | 'settling' | 'done';

interface VaporScanProps {
  /**
   * Drives fade state:
   *   - `active` / `settling` — visible, drifting.
   *   - `done` — fades out over 320ms.
   *
   * `idle` / `cancelled` consumers should simply unmount this component.
   */
  readonly phase: VaporScanPhase;
  /**
   * Seconds per vertical pass. Phase 4 §1 summary states "~3s per pass".
   * Exposed for tests / alternate timings; defaults to 3.
   */
  readonly cycleSeconds?: number;
  /**
   * Peak opacity. Phase 4 §2.4 uses 0.85 per the CSS spec. We clamp to
   * ~0.18 effective visibility via gradient alphas (see §2.4) — the
   * component opacity acts as a global fade-in/fade-out envelope rather
   * than the final visual opacity, which is dominated by the gradient.
   * Keep at 0.85 unless you have a specific reason.
   */
  readonly peakOpacity?: number;
  readonly className?: string;
}

export function VaporScan({
  phase,
  cycleSeconds = 3,
  peakOpacity = 0.85,
  className,
}: VaporScanProps): JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  // Target opacity: 0 until mounted-then-fade, peak while active/settling,
  // 0 on done.
  // We gate the initial frame behind a microtask so the motion library's
  // tween runs from 0 → peak instead of hard-snapping.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const isVisible = phase === 'active' || phase === 'settling';
  const targetOpacity = !mounted
    ? 0
    : isVisible
      ? peakOpacity
      : 0;

  const fadeDuration =
    isVisible || !mounted
      ? DURATION.vaporScanFadeIn / 1000
      : DURATION.vaporScanFadeOut / 1000;

  // Gradient band — Phase 4 §2.4. `plus-lighter` preserves dark text,
  // additive on light backgrounds. We use the EXCEPTIONAL tier CSS var
  // (teal) so the scan inherits tier semantics.
  const gradient = useMemo(
    () =>
      'linear-gradient(180deg,'
      + ' transparent 0%,'
      + ' hsl(var(--anno-exceptional) / 0.00) 15%,'
      + ' hsl(var(--anno-exceptional) / 0.10) 50%,'
      + ' hsl(var(--anno-exceptional) / 0.00) 85%,'
      + ' transparent 100%)',
    [],
  );

  // Motion behavior:
  //   - Reduced motion: no drift, no oscillation. Just the opacity fade.
  //     The band sits centered and faint as a "processing" indicator.
  //   - Full motion: translate from -140px (fully above the surface) to
  //     the full editor height. We use `animate` with a repeating tween
  //     rather than a keyframe so the consumer's container height is
  //     picked up via the 100% end-position CSS variable below.
  const driftAnimate = prefersReducedMotion
    ? { y: '50%' }
    : { y: ['-140px', 'calc(100% + 0px)'] };

  const driftTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
        y: {
          duration: cycleSeconds,
          ease: 'linear' as const,
          repeat: Infinity,
          repeatType: 'loop' as const,
        },
      };

  return (
    <motion.div
      aria-hidden="true"
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: targetOpacity, ...driftAnimate }}
      transition={{
        opacity: {
          duration: fadeDuration,
          ease: isVisible
            ? ([0.16, 1, 0.3, 1] as const) // ease-out (Phase 4 §3)
            : ([0.4, 0, 1, 1] as const), // ease-in (Phase 4 §3)
        },
        ...driftTransition,
      }}
      style={{
        position: 'absolute',
        insetInline: 0,
        top: 0,
        height: '140px',
        pointerEvents: 'none',
        background: gradient,
        filter: 'blur(14px)',
        mixBlendMode: 'plus-lighter',
        willChange: 'transform, opacity',
      }}
    />
  );
}

export default VaporScan;
