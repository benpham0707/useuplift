/**
 * OverviewPanel — "Character Sheet" score card.
 *
 * Single unified card replacing the old two-card layout:
 *   - Spinning conic-gradient scanner border (250% oversized to prevent corner clipping)
 *   - Score ring with score-colored stroke + glow
 *   - Stacked sub-scores (Activity / Narrative)
 *   - RPG "Earned Titles" replacing tacky pills (gradient-clipped tier title + role/hours)
 *   - Hero persona quote as the closing character description
 *
 * No pills, no icons in metadata, no "Officers see", no rationale text.
 */
import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { ActivityInsightData } from '@/components/portfolio/activity-workshop/insightTypes';
import { getRoleConfig } from '@/components/portfolio/activity-workshop/insightTypes';

// ============================================================================
// SCORE HELPERS
// ============================================================================

function scoreColorClass(score: number): string {
  if (score >= 8.0) return 'text-green-500 dark:text-green-400';
  if (score >= 6.0) return 'text-teal-500 dark:text-teal-400';
  if (score >= 4.0) return 'text-amber-500 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

// ============================================================================
// TITLE SYSTEM — RPG "Earned Titles" replacing pills
// ============================================================================

const TIER_TITLES: Record<number, string> = {
  1: 'Tier I Elite',
  2: 'Tier II Achiever',
  3: 'Tier III Contender',
  4: 'Tier IV Starter',
};

// ============================================================================
// COMPONENT
// ============================================================================

interface OverviewPanelProps {
  data: ActivityInsightData;
}

const RING_R = 56;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

/** Returns [startColor, endColor] for the ring gradient based on score tier */
function ringGradientColors(score: number): [string, string] {
  if (score >= 9.0) return ['hsl(185, 80%, 55%)', 'hsl(250, 70%, 60%)']; // cyan → purple (elite)
  if (score >= 8.0) return ['hsl(142, 71%, 45%)', 'hsl(160, 60%, 50%)']; // green tones
  if (score >= 6.0) return ['hsl(168, 64%, 42%)', 'hsl(174, 72%, 56%)']; // teal tones
  if (score >= 4.0) return ['hsl(38, 92%, 50%)', 'hsl(45, 93%, 47%)'];   // amber tones
  return ['hsl(0, 72%, 51%)', 'hsl(15, 75%, 55%)'];                       // red tones
}

export const OverviewPanel: React.FC<OverviewPanelProps> = ({ data }) => {
  const roleCfg = getRoleConfig(data.storyRole);
  const tierTitle = TIER_TITLES[data.tier] || 'Tier IV Starter';
  const scoreOffset =
    RING_CIRCUMFERENCE * (1 - Math.min(data.combinedScore / 10, 1));
  const [ringStart, ringEnd] = ringGradientColors(data.combinedScore);

  return (
    <div className="w-full flex flex-col h-full">
      {/* @property lets us animate the conic-gradient angle via CSS */}
      <style>{`
        @property --scanner-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes scanner-spin {
          to { --scanner-angle: 360deg; }
        }
      `}</style>

      {/* The single "Character Sheet" card.
          Outer div: conic-gradient IS the background, with p-[2px] creating the border gap.
          Inner div: fully opaque bg-background masks everything except the 2px edge. */}
      <div
        className="relative w-full flex-1 rounded-3xl shadow-2xl p-[2px] overflow-hidden"
        style={{
          background: [
            // Top layer: animated scanner glow (soft, blends into the base)
            'conic-gradient(from var(--scanner-angle), transparent 0deg, transparent 335deg, hsl(185 80% 55% / 0.55) 350deg, hsl(250 70% 60% / 0.55) 358deg, transparent 360deg)',
            // Base layer: static gradient border (always visible)
            'linear-gradient(135deg, hsl(250 70% 60% / 0.2), hsl(185 80% 55% / 0.15), hsl(250 70% 60% / 0.2))',
          ].join(', '),
          animation: 'scanner-spin 5s linear infinite',
        }}
      >
        {/* Inner card — fully opaque, masks the gradient except the 2px border */}
        <div className="relative h-full w-full bg-background rounded-[calc(1.5rem-2px)] p-8 flex flex-col items-center">
          {/* ── Score ring ── */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="relative w-36 h-36 flex items-center justify-center mb-6"
          >
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 144 144"
            >
              <defs>
                <linearGradient id="score-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={ringStart} />
                  <stop offset="100%" stopColor={ringEnd} />
                </linearGradient>
                <filter id="ring-glow">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Track */}
              <circle
                cx="72"
                cy="72"
                r={RING_R}
                className="stroke-foreground/5 fill-none"
                strokeWidth="5"
              />
              {/* Score fill — gradient stroke with glow */}
              <motion.circle
                cx="72"
                cy="72"
                r={RING_R}
                fill="none"
                stroke="url(#score-ring-gradient)"
                strokeWidth="6"
                strokeLinecap="round"
                filter="url(#ring-glow)"
                initial={{
                  strokeDasharray: RING_CIRCUMFERENCE,
                  strokeDashoffset: RING_CIRCUMFERENCE,
                }}
                animate={{ strokeDashoffset: scoreOffset }}
                transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="text-center flex flex-col items-center justify-center">
              <span
                className={cn(
                  'text-[2.75rem] leading-none font-extrabold tracking-tight tabular-nums',
                  scoreColorClass(data.combinedScore),
                )}
              >
                {data.combinedScore.toFixed(1)}
              </span>
              <span className="text-[9px] text-foreground/40 font-bold uppercase tracking-[0.25em] mt-1">
                Combined
              </span>
            </div>
          </motion.div>

          {/* ── Sub-scores — stacked columns ── */}
          <div className="flex items-center justify-center w-full mb-8 text-sm">
            <div className="flex flex-col items-center px-6 border-r border-foreground/10">
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-lg text-[hsl(250_70%_60%)]">
                  {data.activityScore.total.toFixed(1)}
                </span>
                <span className="text-[10px] text-foreground/40 font-medium">
                  70%
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-foreground/50 mt-0.5">
                Activity
              </span>
            </div>
            <div className="flex flex-col items-center px-6">
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-lg text-[hsl(185_80%_55%)]">
                  {data.descriptionScore.total.toFixed(1)}
                </span>
                <span className="text-[10px] text-foreground/40 font-medium">
                  30%
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-foreground/50 mt-0.5">
                Narrative
              </span>
            </div>
          </div>

          {/* ── Earned Titles — gradient tier + role/hours ── */}
          <div className="w-full flex flex-col items-center gap-1.5 mb-8">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-[hsl(250_70%_60%)] to-[hsl(185_80%_55%)]">
              {tierTitle}
            </span>
            <div className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40">
              <span>{roleCfg.label}</span>
              <span className="w-1 h-1 rounded-full bg-foreground/20" />
              <span>{data.totalHours.toLocaleString()} Hrs Logged</span>
            </div>
          </div>

          {/* ── Hero persona quote ── */}
          {data.storyEssence && (
            <div className="relative w-full pt-6">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
              <p className="text-center italic text-foreground/80 text-[14px] leading-relaxed font-medium px-2">
                &ldquo;{data.storyEssence}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
