/**
 * DiagnosticCard — Fused evaluation badge + quest board.
 *
 * Score ring embedded in a pill-shaped tier badge, coach insight with
 * accent border, icon-socket quest tasks with hover glow washes.
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Target,
  PenTool,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DiagnosticActivityCard as DiagnosticCardData } from './diagnosticTransform';

// ============================================================================
// SCORE → COLLEGE TIER CONTEXT
// ============================================================================

function getTierContext(score: number) {
  if (score >= 9.0) return { target: 'Top 10 / Ivy', schools: 'Harvard, MIT', color: 'text-emerald-700', bg: 'bg-emerald-50/50', border: 'border-emerald-200', stroke: '#059669' };
  if (score >= 7.0) return { target: 'Top 25 Selective', schools: 'UCLA, Michigan', color: 'text-blue-700', bg: 'bg-blue-50/50', border: 'border-blue-200', stroke: '#2563eb' };
  if (score >= 5.5) return { target: 'Top 50 Selective', schools: 'Wisconsin, OSU', color: 'text-violet-700', bg: 'bg-violet-50/50', border: 'border-violet-200', stroke: '#7c3aed' };
  return { target: 'Solid Foundation', schools: 'Room to grow', color: 'text-gray-700', bg: 'bg-gray-100/50', border: 'border-gray-200', stroke: '#4b5563' };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface DiagnosticCardProps {
  card: DiagnosticCardData;
  onSelect?: (activityId: string) => void;
}

const DiagnosticCardInner: React.FC<DiagnosticCardProps> = ({ card, onSelect }) => {
  const tierContext = useMemo(() => getTierContext(card.combinedScore), [card.combinedScore]);

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (circumference * (card.combinedScore / 10));

  const projectedUplift = card.expansion.projectedScoreAfterRewrite
    ? +(card.expansion.projectedScoreAfterRewrite - card.combinedScore).toFixed(1)
    : null;

  return (
    <motion.div
      layout
      onClick={() => onSelect?.(card.activityId)}
      className="group/card relative w-full cursor-pointer overflow-hidden rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-violet-200 hover:shadow-[0_8px_30px_-4px_rgba(139,92,246,0.1)]"
    >
      <div className="pointer-events-none absolute -inset-x-0 -top-1/2 h-full w-full bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.04),transparent_50%)] opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" />

      {/* 1. HEADER: Title + Fused Evaluation Badge */}
      <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-black text-gray-400">
            #{String(card.rank).padStart(2, '0')}
          </span>
          <h3 className="truncate text-[22px] font-black tracking-tight text-gray-900">
            {card.title}
          </h3>
        </div>

        <div className={cn(
          'flex items-center gap-3 rounded-full border py-1 pl-1 pr-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-colors',
          tierContext.bg, tierContext.border,
        )}>
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-900/5">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="3" />
              <motion.circle
                cx="20"
                cy="20"
                r={radius}
                fill="none"
                stroke={tierContext.stroke}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeOffset }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[13px] font-black tracking-tighter text-gray-900">
              {card.combinedScore.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1">
              <Trophy className={cn('h-3 w-3', tierContext.color)} />
              <span className={cn('text-[10px] font-black uppercase tracking-widest', tierContext.color)}>
                {tierContext.target}
              </span>
            </div>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-500">
              {tierContext.schools}
            </span>
          </div>
        </div>
      </div>

      {/* 2. COACH'S BRIEF */}
      <div className="relative mt-5 overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4">
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-gray-300 to-gray-200" />
        <div className="mb-1.5 flex items-center gap-1.5 pl-2">
          <Sparkles className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Strategic Assessment
          </span>
        </div>
        <p className="pl-2 text-[13.5px] font-medium leading-relaxed text-gray-700">
          {card.headline || card.title}
        </p>
      </div>

      {/* 3. THE QUEST BOARD: 2x2 Interactive Skill Nodes */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

        {/* List A: Activity Upgrades */}
        {card.expansion.upgradePathway?.steps.slice(0, 2).map((step, idx, arr) => (
          <motion.div
            key={`act-${idx}`}
            whileHover={{ y: -1 }}
            className={cn(
              'group/quest relative flex cursor-pointer items-center justify-between overflow-hidden rounded-xl bg-white p-3 transition-all duration-300',
              'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] ring-1 ring-cyan-900/10',
              'hover:ring-cyan-400/50 hover:shadow-[0_8px_24px_-6px_rgba(6,182,212,0.2)]',
              arr.length === 1 && 'sm:col-span-2',
            )}
          >
            {/* Glowing Left Edge */}
            <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-cyan-400 to-cyan-500 opacity-0 transition-opacity duration-300 group-hover/quest:opacity-100" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-50/40 to-transparent opacity-0 transition-opacity duration-300 group-hover/quest:opacity-100" />

            <div className="relative z-10 flex w-full items-center gap-3">
              {/* Tactile Icon Socket */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-cyan-100/60 transition-all duration-300 group-hover/quest:scale-105 group-hover/quest:bg-cyan-100 group-hover/quest:ring-cyan-300">
                <TrendingUp className="h-4 w-4 text-cyan-600/70 transition-colors duration-300 group-hover/quest:text-cyan-600" />
              </div>

              {/* Restructured Text Stack — score on metadata line, action text full width */}
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <div className="mb-0.5 flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2 pr-2">
                    <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-widest text-cyan-600/60 transition-colors group-hover/quest:text-cyan-600">
                      Activity Upgrade
                    </span>
                    {step.timeframe && (
                      <span className="truncate text-[9px] font-medium text-gray-400 before:mr-2 before:text-gray-200 before:content-['|']">
                        {step.timeframe}
                      </span>
                    )}
                  </div>
                  {projectedUplift != null && (
                    <span className="shrink-0 text-[10px] font-black text-cyan-600">
                      +{projectedUplift}
                    </span>
                  )}
                </div>
                <span className="truncate text-[13px] font-bold text-gray-800 transition-colors group-hover/quest:text-gray-900">
                  {step.action}
                </span>
              </div>

              {/* Naked Interaction Chevron */}
              <ChevronRight className="h-4 w-4 shrink-0 text-cyan-300/80 transition-all duration-300 group-hover/quest:translate-x-0.5 group-hover/quest:text-cyan-500" />
            </div>
          </motion.div>
        ))}

        {/* List B: Description Upgrades */}
        {card.descriptionDiagnostics.slice(0, 2).map((diag, idx, arr) => (
          <motion.div
            key={`desc-${idx}`}
            whileHover={{ y: -1 }}
            className={cn(
              'group/quest relative flex cursor-pointer items-center justify-between overflow-hidden rounded-xl bg-white p-3 transition-all duration-300',
              'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] ring-1 ring-violet-900/10',
              'hover:ring-violet-400/50 hover:shadow-[0_8px_24px_-6px_rgba(139,92,246,0.2)]',
              arr.length === 1 && 'sm:col-span-2',
            )}
          >
            {/* Glowing Left Edge */}
            <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-violet-400 to-violet-500 opacity-0 transition-opacity duration-300 group-hover/quest:opacity-100" />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-50/40 to-transparent opacity-0 transition-opacity duration-300 group-hover/quest:opacity-100" />

            <div className="relative z-10 flex w-full items-center gap-3">
              {/* Tactile Icon Socket */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-violet-100/60 transition-all duration-300 group-hover/quest:-rotate-6 group-hover/quest:scale-105 group-hover/quest:bg-violet-100 group-hover/quest:ring-violet-300">
                <PenTool className="h-4 w-4 text-violet-600/70 transition-colors duration-300 group-hover/quest:text-violet-600" />
              </div>

              {/* Restructured Text Stack — score on metadata line, action text full width */}
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <div className="mb-0.5 flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2 pr-2">
                    <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-widest text-violet-600/60 transition-colors group-hover/quest:text-violet-600">
                      Rewrite Task
                    </span>
                  </div>
                  {projectedUplift != null && (
                    <span className="shrink-0 text-[10px] font-black text-violet-600">
                      +{projectedUplift}
                    </span>
                  )}
                </div>
                <span className="truncate text-[13px] font-bold text-gray-800 transition-colors group-hover/quest:text-gray-900">
                  {diag.tooltip}
                </span>
              </div>

              {/* Naked Interaction Chevron */}
              <ChevronRight className="h-4 w-4 shrink-0 text-violet-300/80 transition-all duration-300 group-hover/quest:translate-x-0.5 group-hover/quest:text-violet-500" />
            </div>
          </motion.div>
        ))}

        {/* Fallback */}
        {card.expansion.upgradePathway == null && card.descriptionDiagnostics.length === 0 && card.diagnosticPills.slice(0, 2).map((pill, idx, arr) => (
          <motion.div
            key={`pill-${idx}`}
            whileHover={{ y: -1 }}
            className={cn(
              'group/quest relative flex cursor-pointer items-center justify-between overflow-hidden rounded-xl bg-white p-3 transition-all duration-300',
              'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] ring-1 ring-gray-900/10',
              'hover:ring-gray-400/50 hover:shadow-md',
              arr.length === 1 && 'sm:col-span-2',
            )}
          >
            <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-gray-300 to-gray-400 opacity-0 transition-opacity duration-300 group-hover/quest:opacity-100" />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50/40 to-transparent opacity-0 transition-opacity duration-300 group-hover/quest:opacity-100" />
            <div className="relative z-10 flex w-full items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-gray-100/60">
                <Target className="h-4 w-4 text-gray-500/70" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  {pill.type.replace('_', ' ')}
                </span>
                <span className="mt-0.5 truncate text-[13px] font-bold text-gray-800">
                  {pill.label}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-300/80 transition-all duration-300 group-hover/quest:translate-x-0.5 group-hover/quest:text-gray-500" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export const DiagnosticCard = React.memo(DiagnosticCardInner);
