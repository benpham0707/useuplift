/**
 * RoadmapGuide — Prioritized improvement guide with premium card layout.
 *
 * Shows the transformative insight, ranked priorities with impact levels,
 * and protected strengths. Each priority links to relevant annotations and paragraphs.
 */

import * as React from 'react';
import { motion } from 'motion/react';
import {
  Lightbulb,
  Gem,
  Wrench,
  Zap,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MockRoadmap, ImpactLevel } from './mockData';
import './workshop.css';

// ═══════════════════════════════════════════
// Impact Config
// ═══════════════════════════════════════════

interface ImpactConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
}

const IMPACT_CONFIG: Record<ImpactLevel, ImpactConfig> = {
  transformative: {
    icon: Gem,
    label: 'Transformative',
    color: 'hsl(250, 70%, 55%)',
    bg: 'hsla(250, 70%, 60%, 0.1)',
    border: 'hsla(250, 70%, 60%, 0.2)',
    glow: 'hsla(250, 70%, 60%, 0.12)',
  },
  significant: {
    icon: Wrench,
    label: 'Significant',
    color: 'hsl(35, 85%, 50%)',
    bg: 'hsla(35, 85%, 60%, 0.1)',
    border: 'hsla(35, 85%, 60%, 0.2)',
    glow: 'hsla(35, 85%, 60%, 0.1)',
  },
  incremental: {
    icon: Zap,
    label: 'Incremental',
    color: 'hsl(220, 70%, 55%)',
    bg: 'hsla(220, 70%, 65%, 0.1)',
    border: 'hsla(220, 70%, 65%, 0.2)',
    glow: 'hsla(220, 70%, 65%, 0.1)',
  },
};

// ═══════════════════════════════════════════
// Paragraph Pill
// ═══════════════════════════════════════════

function ParagraphPill({
  index,
  onClick,
}: {
  index: number;
  onClick: (index: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      className={cn(
        'inline-flex items-center justify-center rounded-full px-2 py-0.5',
        'text-[10px] font-bold tabular-nums',
        'bg-[hsla(250,70%,60%,0.08)] text-[hsl(250,60%,50%)]',
        'border border-[hsla(250,70%,60%,0.15)]',
        'hover:bg-[hsla(250,70%,60%,0.15)] hover:border-[hsla(250,70%,60%,0.25)]',
        'transition-all duration-150 cursor-pointer',
      )}
    >
      P{index + 1}
    </button>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

interface RoadmapGuideProps {
  roadmap: MockRoadmap;
  onAnnotationClick: (id: string) => void;
  onParagraphClick: (index: number) => void;
}

export function RoadmapGuide({ roadmap, onAnnotationClick, onParagraphClick }: RoadmapGuideProps) {
  return (
    <div className="space-y-4 pb-6">
      {/* ── 1. Transformative Insight ── */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.05 }}
        className={cn(
          'relative rounded-xl border border-white/60 p-5 overflow-hidden',
          'bg-white/50 backdrop-blur-sm',
        )}
        style={{
          background: 'linear-gradient(135deg, hsla(250, 70%, 60%, 0.06), hsla(250, 70%, 95%, 0.4))',
          boxShadow: `
            0 4px 24px hsla(250, 70%, 60%, 0.1),
            0 1px 4px hsla(235, 20%, 15%, 0.04),
            inset 0 1px 0 hsla(0, 0%, 100%, 0.5)
          `,
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute -top-10 -right-10 h-36 w-36 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsla(250, 70%, 60%, 0.1) 0%, transparent 70%)',
            filter: 'blur(25px)',
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-start gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg shrink-0 bg-[hsla(250,70%,60%,0.12)]">
            <Lightbulb className="h-5 w-5 text-[hsl(250,70%,55%)]" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(250,60%,50%)] block mb-1.5">
              Transformative Insight
            </span>
            <p className="text-[14px] leading-[1.7] text-[hsl(235,20%,15%)] font-medium">
              {roadmap.transformativeInsight}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── 2. Priorities ── */}
      <div className="space-y-3">
        {roadmap.priorities.map((priority) => {
          const impact = IMPACT_CONFIG[priority.impact];
          const ImpactIcon = impact.icon;

          return (
            <motion.div
              key={priority.rank}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                delay: 0.1 + priority.rank * 0.06,
              }}
              className={cn(
                'rounded-xl border border-white/60 p-4',
                'bg-white/50 backdrop-blur-sm',
                'shadow-[0_4px_20px_hsla(235,20%,15%,0.05),0_1px_4px_hsla(235,20%,15%,0.03)]',
                'hover:shadow-[0_6px_24px_hsla(235,20%,15%,0.08)] transition-shadow duration-300',
              )}
            >
              <div className="flex items-start gap-3">
                {/* Rank number */}
                <div
                  className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0 text-[14px] font-bold"
                  style={{
                    background: impact.bg,
                    color: impact.color,
                    border: `1px solid ${impact.border}`,
                  }}
                >
                  {priority.rank}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Impact badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        color: impact.color,
                        background: impact.bg,
                        border: `1px solid ${impact.border}`,
                      }}
                    >
                      <ImpactIcon className="h-3 w-3" />
                      {impact.label}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[13px] leading-relaxed text-[hsl(235,20%,20%)] mb-2.5">
                    {priority.description}
                  </p>

                  {/* Target paragraphs */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(235,10%,50%)]">
                      Target:
                    </span>
                    {priority.targetParagraphs.map((pIdx) => (
                      <ParagraphPill key={pIdx} index={pIdx} onClick={onParagraphClick} />
                    ))}

                    {/* Related annotation links */}
                    {priority.relatedAnnotationIds.length > 0 && (
                      <>
                        <span className="text-[10px] text-[hsl(235,10%,60%)] mx-0.5">|</span>
                        {priority.relatedAnnotationIds.map((annId) => (
                          <button
                            key={annId}
                            type="button"
                            onClick={() => onAnnotationClick(annId)}
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5',
                              'text-[10px] font-medium',
                              'bg-[hsla(185,80%,55%,0.08)] text-[hsl(185,70%,38%)]',
                              'border border-[hsla(185,80%,55%,0.15)]',
                              'hover:bg-[hsla(185,80%,55%,0.15)] hover:border-[hsla(185,80%,55%,0.25)]',
                              'transition-all duration-150 cursor-pointer',
                            )}
                          >
                            {annId}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── 3. Protected Strengths ── */}
      {roadmap.protectedStrengths.length > 0 && (
        <div className="space-y-2.5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.4 }}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(160,60%,40%)] block mb-2">
              Protected Strengths
            </span>
          </motion.div>

          {roadmap.protectedStrengths.map((strength, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                delay: 0.45 + i * 0.05,
              }}
              className={cn(
                'rounded-xl border border-[hsla(160,70%,55%,0.2)] p-3.5',
                'bg-[hsla(160,70%,55%,0.03)] backdrop-blur-sm',
              )}
              style={{
                boxShadow: '0 2px 12px hsla(160, 70%, 55%, 0.05)',
              }}
            >
              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0 bg-[hsla(160,70%,55%,0.1)]">
                  <Shield className="h-3.5 w-3.5 text-[hsl(160,70%,45%)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] leading-relaxed text-[hsl(235,20%,20%)] mb-1.5">
                    {strength.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[hsl(235,10%,50%)]">{strength.location}</span>
                    <ParagraphPill index={strength.paragraphIndex} onClick={onParagraphClick} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
