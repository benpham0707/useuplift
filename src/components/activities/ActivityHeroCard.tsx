/**
 * ActivityHeroCard — "Holo-Surface" card with 3D tilt, kinetic stagger,
 * and rich metadata for the activity insights list view.
 *
 * Replaces the flat InsightSummaryCard with a trophy-room aesthetic.
 * Accepts the canonical ActivityInsightData so it plugs directly into
 * the existing pipeline data flow.
 */
import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ActivityRankOrb } from "./ActivityRankOrb";
import {
  Clock,
  Sparkles,
  CheckCircle,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityInsightData } from "../portfolio/activity-workshop/insightTypes";
import {
  getRoleConfig,
  getRoleBadgeClass,
  TIER_LABELS,
} from "../portfolio/activity-workshop/insightTypes";

interface ActivityHeroCardProps {
  data: ActivityInsightData;
  index: number;
  onSelect?: (activityId: string) => void;
}

const ActivityHeroCardInner = ({ data, index, onSelect }: ActivityHeroCardProps) => {
  const roleCfg = getRoleConfig(data.storyRole);
  const tierLabel = TIER_LABELS[data.tier] || "T4 Basic";
  const shortTier = `T${data.tier}`;
  const headline =
    data.celebrationHeadline || data.quickCelebration || data.summaryOneLiner;
  const showEssayBadge =
    data.essayWorthiness === "excellent" || data.essayWorthiness === "good";

  // --- 3D tilt on mouse move ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100, damping: 16 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="group relative cursor-pointer"
      onClick={() => onSelect?.(data.activityId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.(data.activityId);
      }}
    >
      <div className="holo-surface glass-card p-6 rounded-3xl border border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden">
        {/* Background decorative blur */}
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

        <div className="relative z-10 flex items-start justify-between gap-6">
          <div className="flex-1 space-y-4 min-w-0">
            {/* ── Header: rank + title + badges ── */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-black text-muted-foreground/40 italic font-mono">
                #{String(data.rank).padStart(2, "0")}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                {data.title}
              </h3>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase tracking-tighter flex-shrink-0">
                {tierLabel}
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider flex-shrink-0",
                  getRoleBadgeClass(data.storyRole)
                )}
              >
                {roleCfg.label}
              </span>
            </div>

            {/* ── Insight quote ── */}
            {headline && (
              <p
                className={cn(
                  "text-sm leading-relaxed line-clamp-2 italic font-medium max-w-2xl",
                  roleCfg.textAccent,
                  "opacity-80"
                )}
              >
                &ldquo;{headline}&rdquo;
              </p>
            )}

            {/* ── Power Bar: stat pills ── */}
            <div className="flex items-center gap-5 pt-1 flex-wrap">
              {/* Hours */}
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <div className="p-1.5 rounded-lg bg-muted text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Clock size={14} />
                </div>
                <span>{data.totalHours.toLocaleString()}h</span>
              </div>

              {/* Essay badge */}
              {showEssayBadge && (
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <div className="p-1.5 rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <Sparkles size={14} />
                  </div>
                  <span>Essay</span>
                </div>
              )}

              {/* Separator */}
              <span className="text-border/50">|</span>

              {/* Green flags / strengths */}
              {data.greenFlags.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400">
                  <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <CheckCircle size={14} />
                  </div>
                  <span>{data.greenFlags.length}</span>
                </div>
              )}

              {/* Improvement suggestions */}
              {data.improvementTeaching.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Lightbulb size={14} />
                  </div>
                  <span>{data.improvementTeaching.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Right column: score orb + arrow ── */}
          <div className="flex flex-col items-end gap-4 flex-shrink-0">
            <ActivityRankOrb score={data.combinedScore} tier={shortTier} />
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-2xl bg-muted/60 border border-border/40 text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm"
            >
              <ChevronRight size={20} strokeWidth={3} />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const ActivityHeroCard = React.memo(ActivityHeroCardInner);
