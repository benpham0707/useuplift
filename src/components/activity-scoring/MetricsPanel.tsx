/**
 * MetricsPanel — Master-Detail "Inventory Takeover" pattern.
 *
 * Grid View: Dual-column layout (Activity 70% | Narrative 30%) with compact stat bars.
 * Detail View: Clicking a stat morphs it (via motion layoutId) to fill the entire panel,
 *   fading out other stats and showing the full rationale + context badges at 100% focus.
 *
 * Inspired by game UI inspect patterns (Destiny 2, Valorant) — not an accordion.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { Zap, PenTool, ArrowLeft, X } from 'lucide-react';
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

/** Category-based bar gradient + glow */
function barStyle(category: 'activity' | 'narrative') {
  return category === 'activity'
    ? {
        background: 'linear-gradient(135deg, hsl(250 70% 60%), hsl(280 90% 65%))',
        boxShadow: '0 0 10px rgba(139,92,246,0.3), 0 0 4px rgba(139,92,246,0.15)',
      }
    : {
        background: 'linear-gradient(135deg, hsl(185 80% 55%), hsl(200 75% 65%))',
        boxShadow: '0 0 10px rgba(34,211,238,0.3), 0 0 4px rgba(34,211,238,0.15)',
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
}: {
  stat: StatItem;
  isDetail?: boolean;
}) {
  const pct = Math.min(stat.score / stat.maxScore, 1) * 100;
  const style = barStyle(stat.category);

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <span
          className={cn(
            'font-medium transition-colors',
            isDetail
              ? 'text-base font-bold text-foreground/90'
              : 'text-[11px] font-bold text-foreground/75 group-hover:text-foreground/90',
          )}
        >
          {stat.label}
        </span>
        <span
          className={cn(
            'font-extrabold tabular-nums',
            isDetail ? 'text-xl' : 'text-xs',
            scoreColorClass(stat.score),
          )}
        >
          {stat.score.toFixed(1)}
          <span
            className={cn(
              'font-semibold text-muted-foreground/40',
              isDetail ? 'text-sm' : 'text-[9px]',
            )}
          >
            /{stat.maxScore}
          </span>
        </span>
      </div>
      {/* Pill track */}
      <div
        className={cn(
          'w-full rounded-[999px] relative overflow-hidden',
          isDetail ? 'h-3 p-[2.5px]' : 'h-[12px] p-[2px]',
        )}
        style={{
          background: 'hsl(var(--muted) / 0.3)',
          boxShadow:
            'inset 1px 1px 3px rgba(0,0,0,0.04), inset -1px -1px 2px rgba(255,255,255,0.5)',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pct, stat.score > 0 ? 5 : 0)}%` }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.15 }}
          className="h-full rounded-[999px]"
          style={style}
        />
      </div>
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

  return (
    <LayoutGroup>
      <div className="relative w-full min-h-[420px] glass-card rounded-2xl p-4 md:p-6 border border-border/15 overflow-hidden flex flex-col">
        <AnimatePresence mode="popLayout">
          {!selectedStat ? (
            /* ══════════════════════════════════════
               GRID VIEW — dual-column stat overview
               ══════════════════════════════════════ */
            <motion.div
              key="grid-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97, filter: 'blur(3px)' }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-5">
                <h2 className="text-sm font-bold text-foreground/85 tracking-tight">
                  Metrics Breakdown
                </h2>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                  Select a metric to dive deep into strategic feedback.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Activity Column */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-border/10 pb-1.5">
                    <div className="flex items-center gap-1.5 font-bold tracking-wide uppercase text-[10px]" style={{ color: CATEGORY_COLOR.activity }}>
                      <Zap className="w-3.5 h-3.5" /> Activity Strength
                    </div>
                    <span className="text-[9px] text-muted-foreground/40 font-medium">70% Weight</span>
                  </div>
                  {activityStats.map((stat) => (
                    <motion.div
                      layoutId={`card-${stat.id}`}
                      key={stat.id}
                      onClick={() => setSelectedStat(stat)}
                      className="group cursor-pointer p-2.5 -mx-1 rounded-xl hover:bg-muted/15 dark:hover:bg-muted/8 border border-transparent hover:border-border/15 transition-all"
                    >
                      <StatBar stat={stat} />
                    </motion.div>
                  ))}
                </div>

                {/* Narrative Column */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-border/10 pb-1.5">
                    <div className="flex items-center gap-1.5 font-bold tracking-wide uppercase text-[10px]" style={{ color: CATEGORY_COLOR.narrative }}>
                      <PenTool className="w-3.5 h-3.5" /> Narrative &amp; Detail
                    </div>
                    <span className="text-[9px] text-muted-foreground/40 font-medium">30% Weight</span>
                  </div>
                  {narrativeStats.map((stat) => (
                    <motion.div
                      layoutId={`card-${stat.id}`}
                      key={stat.id}
                      onClick={() => setSelectedStat(stat)}
                      className="group cursor-pointer p-2.5 -mx-1 rounded-xl hover:bg-muted/15 dark:hover:bg-muted/8 border border-transparent hover:border-border/15 transition-all"
                    >
                      <StatBar stat={stat} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            /* ══════════════════════════════════════
               DETAIL VIEW — full-panel takeover
               ══════════════════════════════════════ */
            <motion.div
              key={`detail-${selectedStat.id}`}
              layoutId={`card-${selectedStat.id}`}
              initial={{ borderRadius: 16 }}
              className="absolute inset-0 z-10 p-4 md:p-6 flex flex-col bg-card/95 dark:bg-card/90 backdrop-blur-xl border border-border/15 rounded-2xl"
            >
              {/* Header controls */}
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedStat(null)}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60 hover:text-foreground transition-colors group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  Back to Overview
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStat(null)}
                  className="p-1.5 rounded-full hover:bg-muted/20 transition-colors text-muted-foreground/40 hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Focused Content */}
              <div className="flex flex-col flex-1 max-w-2xl w-full overflow-y-auto">
                {/* Category pill */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/20 border border-border/10 text-[9px] font-bold uppercase tracking-wider w-fit"
                  style={{ color: CATEGORY_COLOR[selectedStat.category] }}
                >
                  {selectedStat.category === 'activity' ? (
                    <Zap className="w-3 h-3" />
                  ) : (
                    <PenTool className="w-3 h-3" />
                  )}
                  {selectedStat.category === 'activity'
                    ? 'Activity Metric'
                    : 'Narrative Metric'}
                </motion.div>

                {/* Enlarged stat bar */}
                <div className="mb-6">
                  <StatBar stat={selectedStat} isDetail />
                </div>

                {/* Context badges */}
                {selectedStat.badges && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-1.5 mb-4"
                  >
                    {selectedStat.badges}
                  </motion.div>
                )}

                {/* Full rationale */}
                {selectedStat.description && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                  >
                    <h3 className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
                      Strategic Analysis
                    </h3>
                    <div className="rounded-xl bg-muted/10 dark:bg-muted/5 p-4 border border-border/10">
                      <ParagraphText
                        text={selectedStat.description}
                        className="text-[12px] text-foreground/70 leading-relaxed"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
};
