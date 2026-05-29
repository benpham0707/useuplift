/**
 * TierHistogram — compact horizontal-bar distribution above the filter
 * chips.
 *
 * Phase 11 §2.5 authority:
 *   - Counts only; NO aggregate score, NO percentage, NO letter grade.
 *   - One row per tier that has at least one member (FUNCTIONAL still
 *     rendered but de-emphasized per §4.3).
 *   - Bar width = proportional to the max count so magnitude is the
 *     load-bearing signal (not ratio-to-whole).
 *   - Bar growth animates on filter change (motion/react width
 *     transition, 420ms per §3.8).
 *   - Under prefers-reduced-motion, the bar snaps to its new width
 *     instantly (spec §3.10).
 *
 * Accessibility:
 *   - `role="img"` with a prose aria-label summarizing the distribution
 *     (not per-bar labels — one summary beats seven duplicates).
 */

import { motion } from 'motion/react';

import {
  EASING,
  TIER_CSS_VAR,
  TIER_META,
  TYPOGRAPHY,
  type Tier,
} from '../tokens';

export interface TierHistogramProps {
  readonly counts: Record<Tier, number>;
  readonly totalSentences: number;
  readonly reducedMotion: boolean;
}

// Phase 11 §4.3 — FUNCTIONAL is excluded from the histogram entirely
// (sage/no-underline is not actionable; no count to surface). All
// other tiers render in severity order.
const HISTOGRAM_TIERS: readonly Tier[] = [
  'CRITICAL',
  'NEEDS_WORK',
  'STRONG',
  'EXCEPTIONAL',
  'MASTERFUL',
];

export function TierHistogram({
  counts,
  totalSentences,
  reducedMotion,
}: TierHistogramProps) {
  // Scale bar widths to the largest non-FUNCTIONAL count. This matches
  // §2.5 — "bar length proportional to count within the currently-
  // filtered set". A totally empty histogram (all zeros) falls back to
  // max=1 so the track still renders at a visible height without
  // runaway widths.
  const maxCount = Math.max(
    1,
    ...HISTOGRAM_TIERS.map((t) => counts[t] ?? 0),
  );

  // A11y summary — e.g. "Tier distribution: 4 critical, 7 needs work,
  // 1 strong, 0 exceptional, 0 masterful." Per §3.13.
  const a11yLabel = `Tier distribution: ${HISTOGRAM_TIERS.map((t) => {
    const n = counts[t] ?? 0;
    return `${n} ${TIER_META[t].label.toLowerCase()}`;
  }).join(', ')}. ${totalSentences} sentences total.`;

  return (
    <div
      role="img"
      aria-label={a11yLabel}
      style={{
        padding: `8px ${TYPOGRAPHY.panelPaddingX} 16px`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {HISTOGRAM_TIERS.map((tier) => {
        const count = counts[tier] ?? 0;
        // Width percentage — 0 count renders a 0% bar (the track still
        // shows, giving the student a visual "zero" without rendering
        // a stray dot).
        const widthPct = (count / maxCount) * 100;
        return (
          <HistogramRow
            key={tier}
            tier={tier}
            count={count}
            widthPct={widthPct}
            reducedMotion={reducedMotion}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HistogramRow
// ---------------------------------------------------------------------------

interface HistogramRowProps {
  readonly tier: Tier;
  readonly count: number;
  readonly widthPct: number;
  readonly reducedMotion: boolean;
}

function HistogramRow({
  tier,
  count,
  widthPct,
  reducedMotion,
}: HistogramRowProps) {
  const meta = TIER_META[tier];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '96px 1fr 32px',
        alignItems: 'center',
        gap: 10,
        height: 16,
        fontFamily: TYPOGRAPHY.families.sans,
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: 500,
          color: `hsl(var(${TIER_CSS_VAR[tier]}))`,
          letterSpacing: TYPOGRAPHY.tracking.tierWord,
          whiteSpace: 'nowrap',
        }}
      >
        {meta.label}
      </span>
      <div
        style={{
          position: 'relative',
          height: 10,
          borderRadius: 2,
          background: 'hsl(220 15% 94%)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={false}
          animate={{ width: `${widthPct}%` }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : {
                  duration: 0.42,
                  ease: EASING.contentCrossfade,
                }
          }
          style={{
            height: '100%',
            borderRadius: 2,
            background: `hsl(var(${TIER_CSS_VAR[tier]}) / 0.7)`,
          }}
        />
      </div>
      <span
        style={{
          textAlign: 'right',
          fontSize: '12px',
          fontWeight: 500,
          color: 'hsl(220 15% 30%)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count}
      </span>
    </div>
  );
}
