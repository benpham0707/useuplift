/**
 * MetricsPanel — Master-Detail "Inventory Takeover" pattern.
 *
 * Grid View: Dual-column layout (Activity 70% | Narrative 30%) with compact stat bars.
 * Detail View: Clicking a stat crossfades the grid out and reveals a full-panel detail
 *   overlay with staggered content entrance. Grid stays in DOM for height stability.
 *
 * Animation architecture:
 *   Grid layer  — always rendered, instantly hidden via opacity when detail is active
 *   Detail layer — absolute overlay, fades in on top with sequenced content stagger
 *   Fully opaque detail bg — no bleed-through, no backdrop-blur (GPU-friendly)
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, PenTool, ArrowLeft, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParagraphText } from '@/components/portfolio/activity-workshop/RichText';

// ============================================================================
// TYPES
// ============================================================================

export interface StatItem {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  description: string;
  category: 'activity' | 'narrative';
  badges?: React.ReactNode;
}

interface MetricsPanelProps {
  activityStats: StatItem[];
  narrativeStats: StatItem[];
}

// ============================================================================
// SCORE HELPERS
// ============================================================================

function scoreColorClass(score: number): string {
  if (score >= 8.0) return 'text-green-500 dark:text-green-400';
  if (score >= 6.0) return 'text-teal-500 dark:text-teal-400';
  if (score >= 4.0) return 'text-amber-500 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

/**
 * Score-colored bar with progressive glow.
 *
 * Color matches the score tier (green / teal / amber / red) so bar and number
 * feel unified. The bar starts muted on the left and the glow VFX intensifies
 * with percentage — short bars are quiet, long bars radiate.
 *
 * Each tier defines: hue, base saturation/lightness (left edge), and glow RGB.
 */
function barStyle(score: number, pct: number) {
  const t = Math.min(pct / 100, 1);

  // Pick hue family based on score tier (matches scoreColorClass)
  let hue: number, baseSat: number, baseLight: number, glowRgb: string;
  if (score >= 8.0) {
    hue = 142; baseSat = 50; baseLight = 62; glowRgb = '34,197,94';       // green
  } else if (score >= 6.0) {
    hue = 168; baseSat = 50; baseLight = 62; glowRgb = '20,184,166';      // teal
  } else if (score >= 4.0) {
    hue = 38;  baseSat = 60; baseLight = 62; glowRgb = '245,158,11';      // amber
  } else {
    hue = 0;   baseSat = 55; baseLight = 62; glowRgb = '239,68,68';       // red
  }

  // End color: saturation and lightness intensify with bar length
  const endSat = Math.round(baseSat + t * 40);    // e.g. 50% → 90%
  const endLight = Math.round(baseLight - t * 18); // e.g. 62% → 44%

  // Glow: quadratic ramp so short bars barely glow, long bars radiate
  const glowAlpha = (t * t * 0.5).toFixed(2);     // 0 → 0.5
  const glowSpread = Math.round(3 + t * t * 16);  // 3px → 19px

  return {
    background: `linear-gradient(to right, hsl(${hue} ${baseSat}% ${baseLight}%), hsl(${hue} ${endSat}% ${endLight}%))`,
    boxShadow: `0 0 ${glowSpread}px rgba(${glowRgb},${glowAlpha})`,
  };
}

const CATEGORY_COLOR = {
  activity: 'hsl(250,70%,60%)',
  narrative: 'hsl(185,80%,55%)',
} as const;

// ============================================================================
// STAT BAR — shared between grid and detail views
// ============================================================================

function StatBar({
  stat,
  isDetail = false,
  skipEntrance = false,
}: {
  stat: StatItem;
  isDetail?: boolean;
  skipEntrance?: boolean;
}) {
  const pct = Math.min(stat.score / stat.maxScore, 1) * 100;
  const style = barStyle(stat.score, pct);

  return (
    <div className="w-full">
      <div className={cn('flex justify-between', isDetail ? 'items-center mb-2' : 'items-end mb-1.5')}>
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'font-bold transition-colors',
              isDetail
                ? 'text-base text-foreground/90'
                : 'text-[13px] text-foreground/80 group-hover:text-foreground',
            )}
          >
            {stat.label}
          </span>
          {!isDetail && (
            <span className="opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center text-[9px] uppercase tracking-wider font-bold text-muted-foreground/40">
              Inspect <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
            </span>
          )}
          {isDetail && stat.badges && (
            <div className="flex flex-wrap gap-1 items-center">
              {stat.badges}
            </div>
          )}
        </div>
        <span
          className={cn(
            'font-extrabold tabular-nums shrink-0 flex items-baseline gap-0.5',
            isDetail ? 'text-xl' : 'text-[15px]',
            scoreColorClass(stat.score),
          )}
        >
          {stat.score.toFixed(1)}
          <span
            className={cn(
              'font-medium text-foreground/25',
              isDetail ? 'text-base' : 'text-[9px]',
            )}
          >
            /{stat.maxScore}
          </span>
        </span>
      </div>
      <div
        className={cn(
          'w-full rounded-full relative overflow-hidden',
          isDetail ? 'h-2' : 'h-1.5',
        )}
        style={{
          background: 'hsl(var(--foreground) / 0.05)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        <motion.div
          initial={skipEntrance ? false : { width: 0 }}
          animate={{ width: `${Math.max(pct, stat.score > 0 ? 5 : 0)}%` }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.15 }}
          className="h-full rounded-full"
          style={style}
        />
      </div>
    </div>
  );
}

// ============================================================================
// DETAIL OVERLAY — staggered content reveal
// ============================================================================

function DetailOverlay({
  stat,
  onClose,
}: {
  stat: StatItem;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="flex flex-col"
      style={{ willChange: 'opacity' }}
    >
      {/* Header controls */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.2, ease: 'easeOut' }}
        className="flex items-center justify-between mb-5 flex-shrink-0"
      >
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60 hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Overview
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-muted/20 transition-colors text-muted-foreground/40 hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Content — panel sizes to fit */}
      <div className="flex flex-col">
        {/* Category badge */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.2, ease: 'easeOut' }}
          className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/15 border border-border/10 text-[9px] font-extrabold uppercase tracking-[0.15em] w-fit"
          style={{ color: CATEGORY_COLOR[stat.category] }}
        >
          {stat.category === 'activity' ? <Zap className="w-3 h-3" /> : <PenTool className="w-3 h-3" />}
          {stat.category === 'activity' ? 'Activity Metric' : 'Narrative Metric'}
        </motion.div>

        {/* Enlarged stat bar with inline badges */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.2, ease: 'easeOut' }}
          className="mb-5"
        >
          <StatBar stat={stat} isDetail skipEntrance />
        </motion.div>

        {/* Full rationale */}
        {stat.description && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.25, ease: 'easeOut' }}
          >
            <h3 className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
              Strategic Analysis
            </h3>
            <div className="rounded-xl bg-muted/10 dark:bg-muted/5 p-4 border border-border/10">
              <ParagraphText
                text={stat.description}
                className="text-[12px] text-foreground/70 leading-relaxed"
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  activityStats,
  narrativeStats,
}) => {
  const [selectedStat, setSelectedStat] = useState<StatItem | null>(null);
  const handleClose = useCallback(() => setSelectedStat(null), []);

  return (
    <div className="relative w-full h-full glass-card rounded-2xl p-4 md:p-5 border border-border/15 overflow-hidden flex flex-col">
      {/* Subtle tech grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at center, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── Grid layer — collapses when detail is shown ── */}
      <motion.div
        animate={
          selectedStat
            ? { opacity: 0, scale: 0.98, height: 0 }
            : { opacity: 1, scale: 1, height: 'auto' }
        }
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{ willChange: 'opacity, transform' }}
        className={cn('overflow-hidden relative z-[1] flex-1', selectedStat && 'pointer-events-none')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 h-full">
          {/* Activity Column */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-border/10 pb-1.5 mb-0.5">
              <div
                className="flex items-center gap-1.5 font-extrabold tracking-widest uppercase text-[10px]"
                style={{ color: CATEGORY_COLOR.activity }}
              >
                <Zap className="w-3.5 h-3.5" /> Activity Strength
              </div>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground/40 font-bold bg-muted/15 px-1.5 py-0.5 rounded">
                70% Wgt
              </span>
            </div>
            {activityStats.map((stat) => (
              <div
                key={stat.id}
                onClick={() => setSelectedStat(stat)}
                className="group cursor-pointer py-2 px-2.5 -mx-1 rounded-lg hover:bg-foreground/[0.03] border border-transparent hover:border-foreground/10 transition-all duration-200"
              >
                <StatBar stat={stat} />
              </div>
            ))}
          </div>

          {/* Narrative Column */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-border/10 pb-1.5 mb-0.5">
              <div
                className="flex items-center gap-1.5 font-extrabold tracking-widest uppercase text-[10px]"
                style={{ color: CATEGORY_COLOR.narrative }}
              >
                <PenTool className="w-3.5 h-3.5" /> Narrative &amp; Detail
              </div>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground/40 font-bold bg-muted/15 px-1.5 py-0.5 rounded">
                30% Wgt
              </span>
            </div>
            {narrativeStats.map((stat) => (
              <div
                key={stat.id}
                onClick={() => setSelectedStat(stat)}
                className="group cursor-pointer py-2 px-2.5 -mx-1 rounded-lg hover:bg-foreground/[0.03] border border-transparent hover:border-foreground/10 transition-all duration-200"
              >
                <StatBar stat={stat} />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Detail layer — absolute overlay, fades in on top ── */}
      <AnimatePresence>
        {selectedStat && (
          <DetailOverlay
            key={selectedStat.id}
            stat={selectedStat}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
