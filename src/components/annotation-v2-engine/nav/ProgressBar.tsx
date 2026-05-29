/**
 * ProgressBar — Phase 10 §2.3 3px tier-gradient progress strip.
 *
 * Rules enforced:
 *   - height: 3px from `--anno-progress-bar-height`.
 *   - fill: `--anno-progress-bar-gradient` (red→amber→sage→green→teal).
 *   - fraction animates width over DURATION.progressBarAdvance (280ms)
 *     with ease-out, per §3.4 motion table. The progress fill LAGS the
 *     panel crossfade so it reads as *consequence of* advancing.
 *   - prefers-reduced-motion: collapses to instant width.
 *   - aria: `role="progressbar"` + aria-valuenow/max + verbose valuetext.
 *   - optional `N / M` label as sibling (Phase 10 §2.3 "bar + count" — both
 *     are present because each serves a different perceptual channel).
 *
 * Living in PanelShell.progressBarSlot (§2.3 "in the header, nowhere else").
 */

import { memo, useMemo } from 'react';
import { motion } from 'motion/react';

import { DURATION, TYPOGRAPHY } from '../tokens';

export interface ProgressBarProps {
  readonly viewedCount: number;
  readonly totalCount: number;
  readonly reducedMotion: boolean;
  /** Pass `false` to suppress the "3 / 12" label; defaults to `true`. */
  readonly showLabel?: boolean;
}

function ProgressBarImpl({
  viewedCount,
  totalCount,
  reducedMotion,
  showLabel = true,
}: ProgressBarProps) {
  // Guard against /0 — empty-order essays render the bar at 0% not NaN%.
  const fraction = useMemo(() => {
    if (totalCount <= 0) return 0;
    const raw = viewedCount / totalCount;
    // Clamp to [0, 1] in case viewedCount briefly exceeds totalCount
    // during a re-analysis insertion (§2.10).
    return Math.max(0, Math.min(1, raw));
  }, [viewedCount, totalCount]);

  const ariaValueText =
    totalCount <= 0
      ? 'No annotations to review.'
      : `${viewedCount} of ${totalCount} annotations reviewed`;

  const transition = reducedMotion
    ? { duration: 0 }
    : {
        duration: DURATION.progressBarAdvance / 1000,
        ease: 'easeOut' as const,
      };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        width: '100%',
      }}
    >
      {showLabel ? (
        <div
          aria-hidden="true"
          style={{
            fontFamily: TYPOGRAPHY.families.sans,
            fontSize: TYPOGRAPHY.size.meta,
            fontWeight: TYPOGRAPHY.weight.medium,
            letterSpacing: TYPOGRAPHY.tracking.meta,
            lineHeight: TYPOGRAPHY.lineHeight.sans,
            color: 'hsl(220 10% 45%)',
          }}
        >
          {totalCount > 0 ? `${viewedCount} / ${totalCount}` : '0 / 0'}
        </div>
      ) : null}

      <div
        role="progressbar"
        aria-valuenow={viewedCount}
        aria-valuemin={0}
        aria-valuemax={Math.max(totalCount, 0)}
        aria-valuetext={ariaValueText}
        style={{
          position: 'relative',
          width: '100%',
          height: 'var(--anno-progress-bar-height, 3px)',
          background: 'hsl(220 15% 92%)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        {/* Animated fill. width animates via motion; gradient comes from
            the token-defined CSS variable so A's calibration of the
            5-stop gradient is the single source of truth. */}
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{ width: `${fraction * 100}%` }}
          transition={transition}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--anno-progress-bar-gradient)',
            borderRadius: 999,
            // Subtle drop to make the gradient read against a light bg
            // without becoming a chart element.
            opacity: 0.95,
          }}
        />
      </div>
    </div>
  );
}

export const ProgressBar = memo(ProgressBarImpl);
