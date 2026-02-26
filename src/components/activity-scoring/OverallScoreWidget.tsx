/**
 * OverallScoreWidget — Holographic circular progress badge with summary.
 *
 * Displays the combined score in an animated SVG ring with GSAP breathing
 * background effect, tier/role badges, and the persona insight card with
 * the "Officers see" callout.
 */
import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Target, Sparkles, Eye } from 'lucide-react';
import gsap from 'gsap';
import type { ActivityInsightData } from '@/components/portfolio/activity-workshop/insightTypes';
import { TIER_LABELS, getRoleBadgeClass, getRoleConfig } from '@/components/portfolio/activity-workshop/insightTypes';
import { TierHoverCard } from '@/components/portfolio/activity-workshop/AdmissionsContextCards';

// ============================================================================
// TYPES
// ============================================================================

interface OverallScoreWidgetProps {
  data: ActivityInsightData;
}

// ============================================================================
// SCORE COLOR
// ============================================================================

function getScoreHex(score: number): string {
  if (score >= 8.0) return '#22c55e';
  if (score >= 6.0) return '#14b8a6';
  if (score >= 4.0) return '#f59e0b';
  return '#ef4444';
}

function scoreColorClass(score: number): string {
  if (score >= 8.0) return 'text-green-500 dark:text-green-400';
  if (score >= 6.0) return 'text-teal-500 dark:text-teal-400';
  if (score >= 4.0) return 'text-amber-500 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

// ============================================================================
// COMPONENT
// ============================================================================

export const OverallScoreWidget: React.FC<OverallScoreWidgetProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const roleCfg = getRoleConfig(data.storyRole);
  const tierLabel = TIER_LABELS[data.tier] || 'T4 Basic';

  const scoreHex = getScoreHex(data.combinedScore);
  const ringSize = 100;
  const strokeWidth = 7;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(data.combinedScore / 10, 1);
  const targetOffset = circumference * (1 - pct);

  // Subtle breathing glow via GSAP
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current.querySelector('.holo-glow-bg');
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.to(el, {
        backgroundPosition: '200% center',
        duration: 15,
        repeat: -1,
        ease: 'linear',
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col gap-4">
      {/* ── Holographic Score Card ── */}
      <div className="holo-surface rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden elev-strong">
        <div className="holo-glow-bg absolute inset-0 opacity-15 bg-[linear-gradient(90deg,hsl(250_70%_60%),hsl(185_80%_55%),hsl(280_90%_65%))] bg-[length:200%_auto]" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Animated score ring */}
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
            className="relative flex items-center justify-center mb-3"
            style={{ width: ringSize, height: ringSize }}
          >
            <svg width={ringSize} height={ringSize} className="-rotate-90">
              {/* Track */}
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                className="stroke-muted/15 dark:stroke-muted/10 fill-none"
                strokeWidth={strokeWidth}
              />
              {/* Arc */}
              <motion.circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke={scoreHex}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: targetOffset }}
                transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
                style={{
                  filter: `drop-shadow(0 0 6px ${scoreHex}80)`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-extrabold tabular-nums leading-none ${scoreColorClass(data.combinedScore)}`}>
                {data.combinedScore.toFixed(1)}
              </span>
              <span className="text-[8px] text-muted-foreground/45 font-medium uppercase tracking-widest mt-0.5">
                Combined
              </span>
            </div>
          </motion.div>

          {/* Sub-scores inline */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground/60 font-medium">Activity</span>
              <span className={`text-xs font-bold tabular-nums ${scoreColorClass(data.activityScore.total)}`}>
                {data.activityScore.total.toFixed(1)}
              </span>
              <span className="text-[8px] text-muted-foreground/30">70%</span>
            </div>
            <div className="w-px h-3 bg-border/20" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground/60 font-medium">Description</span>
              <span className={`text-xs font-bold tabular-nums ${scoreColorClass(data.descriptionScore.total)}`}>
                {data.descriptionScore.total.toFixed(1)}
              </span>
              <span className="text-[8px] text-muted-foreground/30">30%</span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 justify-center mb-3">
            <TierHoverCard tier={data.tier}>
              <span className="px-2 py-0.5 text-[9px] font-medium rounded-full bg-muted text-muted-foreground cursor-help flex items-center gap-1">
                <Target className="w-2.5 h-2.5" />
                {tierLabel}
              </span>
            </TierHoverCard>
            <span className={`px-2 py-0.5 text-[9px] font-medium rounded-full flex items-center gap-1 ${getRoleBadgeClass(data.storyRole)}`}>
              <Sparkles className="w-2.5 h-2.5" />
              {roleCfg.label}
            </span>
            <span className="px-2 py-0.5 text-[9px] text-muted-foreground/50 rounded-full bg-muted/30">
              {data.totalHours.toLocaleString()}h total
            </span>
          </div>

          {/* Combined score rationale */}
          {data.combinedScoreRationale && (
            <p className="text-center text-[11px] font-medium text-foreground/60 leading-snug max-w-[240px]">
              {data.combinedScoreRationale}
            </p>
          )}
        </div>
      </div>

      {/* ── Persona Insight Card ── */}
      {(data.storyEssence || data.summaryOneLiner) && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-card/80 dark:bg-card/60 border border-border/15 p-4"
        >
          {data.storyEssence && (
            <p className="italic text-foreground/60 text-[11px] leading-relaxed mb-2.5">
              {data.storyEssence}
            </p>
          )}
          {data.summaryOneLiner && (
            <div className="bg-muted/15 rounded-lg p-2.5 flex gap-2.5 items-start border border-border/10">
              <Eye className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0 opacity-60" />
              <p className="text-[11px] text-foreground/55 leading-snug">
                <span className="text-foreground/75 font-semibold block mb-0.5 text-[10px]">Officers see:</span>
                &ldquo;{data.summaryOneLiner}&rdquo;
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
