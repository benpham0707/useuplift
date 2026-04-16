/**
 * PhaseBadge — Animated improvement phase indicator with glassmorphism tooltip.
 *
 * Shows the current improvement phase as a premium pill with a subtle glow animation.
 * Hover reveals a floating glassmorphism card with reasoning, focus areas, and deferred areas.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import type { MockPhase, PhaseLevel } from './mockData';
import './workshop.css';

// ═══════════════════════════════════════════
// Phase Color Config
// ═══════════════════════════════════════════

interface PhaseConfig {
  label: string;
  color: string;
  bg: string;
  glow: string;
  border: string;
}

const PHASE_CONFIG: Record<PhaseLevel, PhaseConfig> = {
  foundation: {
    label: 'Foundation',
    color: 'hsl(35, 85%, 50%)',
    bg: 'hsla(35, 85%, 60%, 0.12)',
    glow: 'hsla(35, 85%, 60%, 0.25)',
    border: 'hsla(35, 85%, 60%, 0.25)',
  },
  architecture: {
    label: 'Architecture',
    color: 'hsl(220, 70%, 55%)',
    bg: 'hsla(220, 70%, 65%, 0.12)',
    glow: 'hsla(220, 70%, 65%, 0.25)',
    border: 'hsla(220, 70%, 65%, 0.25)',
  },
  craft: {
    label: 'Craft',
    color: 'hsl(250, 70%, 55%)',
    bg: 'hsla(250, 70%, 60%, 0.12)',
    glow: 'hsla(250, 70%, 60%, 0.25)',
    border: 'hsla(250, 70%, 60%, 0.25)',
  },
  polish: {
    label: 'Polish',
    color: 'hsl(160, 70%, 45%)',
    bg: 'hsla(160, 70%, 55%, 0.12)',
    glow: 'hsla(160, 70%, 55%, 0.25)',
    border: 'hsla(160, 70%, 55%, 0.25)',
  },
  distinction: {
    label: 'Distinction',
    color: 'hsl(350, 75%, 55%)',
    bg: 'hsla(350, 75%, 65%, 0.12)',
    glow: 'hsla(350, 75%, 65%, 0.25)',
    border: 'hsla(350, 75%, 65%, 0.25)',
  },
};

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

interface PhaseBadgeProps {
  phase: MockPhase;
}

export function PhaseBadge({ phase }: PhaseBadgeProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const config = PHASE_CONFIG[phase.level];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Badge pill */}
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
          'text-[11px] font-semibold uppercase tracking-wider',
          'backdrop-blur-sm cursor-default',
          'transition-shadow duration-300',
        )}
        style={{
          color: config.color,
          background: `linear-gradient(135deg, ${config.bg}, hsla(0, 0%, 100%, 0.6))`,
          border: `1px solid ${config.border}`,
          boxShadow: `0 0 12px ${config.glow}`,
          '--phase-glow': config.glow,
          animation: 'phase-pulse 3s ease-in-out infinite',
        } as React.CSSProperties}
      >
        <motion.span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: config.color }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {config.label}
      </div>

      {/* Tooltip card */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-72 pointer-events-none"
          >
            <div
              className="rounded-xl border border-white/50 p-4 backdrop-blur-2xl"
              style={{
                background: 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.88), hsla(0, 0%, 100%, 0.78))',
                boxShadow: `
                  0 8px 32px hsla(235, 20%, 15%, 0.1),
                  0 2px 8px hsla(235, 20%, 15%, 0.05),
                  inset 0 1px 0 hsla(0, 0%, 100%, 0.5),
                  0 0 20px ${config.glow}
                `,
              }}
            >
              {/* Phase label */}
              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: config.color, boxShadow: `0 0 8px ${config.glow}` }}
                />
                <span
                  className="text-[12px] font-bold uppercase tracking-wider"
                  style={{ color: config.color }}
                >
                  {config.label} Phase
                </span>
              </div>

              {/* Reasoning */}
              <p className="text-[12px] leading-relaxed text-[hsl(235,15%,35%)] mb-3">
                {phase.reasoning}
              </p>

              {/* Focus areas */}
              {phase.focusAreas.length > 0 && (
                <div className="mb-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(160,60%,40%)] mb-1 block">
                    Focus Areas
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {phase.focusAreas.map((area) => (
                      <span
                        key={area}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium
                                   bg-[hsla(160,70%,55%,0.1)] text-[hsl(160,55%,35%)] border border-[hsla(160,70%,55%,0.15)]"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Deferred areas */}
              {phase.deferredAreas.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(235,10%,55%)] mb-1 block">
                    Deferred
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {phase.deferredAreas.map((area) => (
                      <span
                        key={area}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium
                                   bg-[hsla(235,10%,50%,0.06)] text-[hsl(235,10%,55%)] border border-[hsla(235,10%,50%,0.1)]"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Arrow */}
            <div className="flex justify-center -mt-px">
              <div
                className="h-2 w-2 rotate-45 border-r border-b border-white/50"
                style={{ background: 'hsla(0, 0%, 100%, 0.85)' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
