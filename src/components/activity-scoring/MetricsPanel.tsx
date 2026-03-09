/**
 * MetricsPanel — Tabbed HUD with Master-Detail takeover.
 *
 * Architecture:
 *   Single-column tabbed layout replaces the old 2-column grid.
 *   StatTabs pill selector switches between Activity / Narrative.
 *   Full-width stat rows maximize horizontal real estate.
 *   Detail overlay fades in on click with staggered content entrance.
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, PenTool, ArrowLeft, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParagraphText } from '@/components/portfolio/activity-workshop/RichText';
import { StatTabs, type StatTabType } from './StatTabs';

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
// SCORE THEME — tier-matched gradients + glow
// ============================================================================

function getScoreTheme(score: number, maxScore: number) {
  const ratio = score / maxScore;
  if (ratio >= 0.8) return { gradient: 'from-emerald-400 to-teal-500', glowHex: '#10b981', textClass: 'text-emerald-500 dark:text-emerald-400' };
  if (ratio >= 0.6) return { gradient: 'from-cyan-400 to-blue-500', glowHex: '#0ea5e9', textClass: 'text-cyan-500 dark:text-cyan-400' };
  if (ratio >= 0.4) return { gradient: 'from-amber-400 to-orange-500', glowHex: '#f59e0b', textClass: 'text-amber-500 dark:text-amber-400' };
  return { gradient: 'from-red-500 to-rose-600', glowHex: '#ef4444', textClass: 'text-red-500 dark:text-red-400' };
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
}: {
  stat: StatItem;
  isDetail?: boolean;
}) {
  const percentage = (stat.score / stat.maxScore) * 100;
  const theme = getScoreTheme(stat.score, stat.maxScore);

  return (
    <div className="w-full flex flex-col justify-center">
      <div className="flex items-end justify-between mb-2 w-full gap-6">
        {/* Label — wraps gracefully, no truncation */}
        <div className="flex items-center flex-1 relative pr-6">
          <span
            className={cn(
              'font-semibold leading-tight transition-all duration-300 break-words w-full',
              isDetail
                ? 'text-lg text-foreground'
                : 'text-[14px] text-foreground/80 group-hover:text-foreground group-hover:translate-x-1',
            )}
          >
            {stat.label}
          </span>
          {/* Hover chevron — absolutely positioned, zero structural space */}
          {!isDetail && (
            <ChevronRight className="absolute right-0 w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-foreground/40" />
          )}
        </div>

        {/* Score — pinned right */}
        <div className="flex items-baseline gap-0.5 shrink-0 transition-transform duration-300 group-hover:-translate-x-1">
          <span
            className={cn(
              'font-extrabold tracking-tight tabular-nums',
              theme.textClass,
              isDetail ? 'text-3xl' : 'text-[16px]',
            )}
          >
            {stat.score.toFixed(1)}
          </span>
          <span
            className={cn(
              'font-medium text-foreground/30',
              isDetail ? 'text-sm' : 'text-[11px]',
            )}
          >
            /{stat.maxScore}
          </span>
        </div>
      </div>

      {/* Segmented HUD Energy Bar */}
      <div className={cn('w-full bg-foreground/10 rounded-full overflow-hidden relative z-10', isDetail ? 'h-2.5' : 'h-2')}>
        {/* Universal segmentation overlay — slices through track + fill */}
        <div className="absolute inset-0 z-20 flex pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r-[2px] border-card last:border-0 opacity-80"
            />
          ))}
        </div>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, type: 'spring', bounce: 0.1 }}
          className={cn('h-full relative bg-gradient-to-r z-10', theme.gradient)}
          style={{ boxShadow: `0 0 10px ${theme.glowHex}40` }}
        >
          {/* Energy accumulation at leading edge */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/60 to-transparent mix-blend-overlay" />
          {/* Crisp glowing leading edge spark */}
          <div className="absolute right-0 top-0 bottom-0 w-[1.5px] bg-white shadow-[0_0_8px_1px_rgba(255,255,255,0.9)]" />
        </motion.div>
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
      key="detail-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="absolute inset-0 z-20 p-8 md:p-10 flex flex-col bg-card border border-foreground/10 shadow-2xl rounded-3xl overflow-y-auto"
      style={{ willChange: 'opacity' }}
    >
      {/* Header controls */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.2, ease: 'easeOut' }}
        className="flex items-center justify-between mb-12 flex-shrink-0"
      >
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase text-foreground/50 hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Overview
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full hover:bg-foreground/5 transition-colors text-foreground/50 hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Content */}
      <div className="flex flex-col flex-1 max-w-2xl mx-auto w-full">
        {/* Category badge */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.2, ease: 'easeOut' }}
          className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-foreground/5 border border-foreground/10 text-[10px] font-extrabold uppercase tracking-[0.2em] w-fit"
          style={{ color: CATEGORY_COLOR[stat.category] }}
        >
          {stat.category === 'activity' ? <Zap className="w-3.5 h-3.5" /> : <PenTool className="w-3.5 h-3.5" />}
          {stat.category === 'activity' ? 'Activity Metric' : 'Narrative Metric'}
        </motion.div>

        {/* Enlarged stat bar with badges */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.2, ease: 'easeOut' }}
          className="mb-5"
        >
          <StatBar stat={stat} isDetail />
          {stat.badges && (
            <div className="flex flex-wrap gap-1 items-center mt-3">
              {stat.badges}
            </div>
          )}
        </motion.div>

        {/* Full rationale */}
        {stat.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px bg-gradient-to-r from-foreground/20 to-transparent flex-1" />
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-foreground/40 shrink-0">
                Strategic Analysis
              </h3>
              <div className="h-px bg-gradient-to-l from-foreground/20 to-transparent flex-1" />
            </div>
            <div className="rounded-xl bg-muted/10 dark:bg-muted/5 p-4 border border-border/10">
              <ParagraphText
                text={stat.description}
                className="text-[13px] text-foreground/70 leading-relaxed"
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// STAT COLUMN — rendered at full width for the active tab
// ============================================================================

function StatColumn({
  stats,
  onSelectStat,
}: {
  stats: StatItem[];
  onSelectStat: (stat: StatItem) => void;
}) {
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto">
      {stats.map((stat) => (
        <div
          key={stat.id}
          onClick={() => onSelectStat(stat)}
          className="group cursor-pointer py-[18px] border-b border-foreground/5 last:border-0 relative overflow-hidden w-full"
        >
          <div className="absolute inset-0 bg-foreground/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg -mx-2 pointer-events-none" />
          <StatBar stat={stat} />
        </div>
      ))}
    </div>
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
  const [activeTab, setActiveTab] = useState<StatTabType>('activity');
  const handleClose = useCallback(() => setSelectedStat(null), []);

  return (
    <div className="relative w-full h-full bg-card rounded-3xl p-6 md:p-8 border border-foreground/5 shadow-sm overflow-hidden flex flex-col">
      {/* Subtle tech grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle at center, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── Tab selector + weight annotation ── */}
      <div className="w-full flex flex-col items-center mb-5 relative z-10 gap-2">
        <StatTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <AnimatePresence mode="wait">
          <motion.span
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-[11px] font-semibold text-foreground/35 tabular-nums"
          >
            {activeTab === 'activity' ? '70%' : '30%'} of total score
          </motion.span>
        </AnimatePresence>
      </div>

      {/* ── Active column — full width, animated transitions ── */}
      <div className="flex-1 relative z-[1]">
        <AnimatePresence mode="wait">
          {!selectedStat ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'activity' ? (
                <StatColumn
                  stats={activityStats}
                  onSelectStat={setSelectedStat}
                />
              ) : (
                <StatColumn
                  stats={narrativeStats}
                  onSelectStat={setSelectedStat}
                />
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ── Detail overlay ── */}
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
    </div>
  );
};
