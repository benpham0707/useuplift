/**
 * EssayPortrait — The portrait-first dashboard, the "WOW" component.
 *
 * Replaces score-first dashboard with a flowing, card-based portrait
 * that tells the student who they are as a writer. Premium glassmorphism
 * aesthetic with staggered framer-motion animations.
 */

import * as React from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  BookOpen,
  Mic,
  User,
  Map,
  Heart,
  GraduationCap,
  Sparkles,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { MockEssayData, ThematicStrength } from './mockData';
import { PhaseBadge } from './PhaseBadge';
import './workshop.css';

// ═══════════════════════════════════════════
// Glass Card Wrapper
// ═══════════════════════════════════════════

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
  delay?: number;
}

function GlassCard({ children, className, accentColor, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay,
      }}
      whileHover={{
        scale: 1.01,
        boxShadow: accentColor
          ? `0 8px 30px ${accentColor}, 0 2px 8px hsla(235, 20%, 15%, 0.06)`
          : '0 8px 30px hsla(235, 20%, 15%, 0.08), 0 2px 8px hsla(235, 20%, 15%, 0.04)',
      }}
      className={cn(
        'rounded-xl border border-white/60 p-4',
        'bg-white/50 backdrop-blur-sm',
        'shadow-[0_4px_20px_hsla(235,20%,15%,0.05),0_1px_4px_hsla(235,20%,15%,0.03)]',
        'transition-shadow duration-300',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// Intelligence Card — Icon + Label + Content
// ═══════════════════════════════════════════

interface IntelligenceCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  accentColor: string;
  accentBg: string;
  children: React.ReactNode;
  delay?: number;
}

function IntelligenceCard({ icon: Icon, label, accentColor, accentBg, children, delay = 0 }: IntelligenceCardProps) {
  return (
    <GlassCard accentColor={accentBg} delay={delay}>
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
          style={{ background: accentBg }}
        >
          <Icon className="h-4 w-4" style={{ color: accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.08em] block mb-1"
            style={{ color: accentColor }}
          >
            {label}
          </span>
          <div className="text-[13px] leading-relaxed text-[hsl(235,20%,25%)]">
            {children}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════
// Thematic Thread Chip
// ═══════════════════════════════════════════

const STRENGTH_DOT: Record<ThematicStrength, string> = {
  dominant: 'bg-[hsl(160,70%,55%)]',
  supporting: 'bg-[hsl(220,70%,65%)]',
  hinted: 'bg-[hsl(235,10%,65%)]',
};

// ═══════════════════════════════════════════
// Score Bar (inline, simplified)
// ═══════════════════════════════════════════

function ScoreBar({ label, score, maxScore }: { label: string; score: number; maxScore: number }) {
  const pct = (score / maxScore) * 100;
  const color =
    pct >= 85 ? 'hsl(160, 70%, 55%)' :
    pct >= 70 ? 'hsl(80, 60%, 50%)' :
    pct >= 55 ? 'hsl(35, 85%, 55%)' :
    'hsl(350, 75%, 60%)';

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-[hsl(235,10%,45%)] w-32 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-[5px] rounded-full bg-[hsla(235,15%,90%,0.6)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 30, delay: 0.1 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-[11px] font-semibold text-[hsl(235,20%,25%)] w-8 text-right tabular-nums">
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

interface EssayPortraitProps {
  data: MockEssayData;
  onShowRoadmap: () => void;
  onParagraphClick: (index: number) => void;
}

export function EssayPortrait({ data, onShowRoadmap, onParagraphClick }: EssayPortraitProps) {
  const { portrait, phase, eqi, confidence, scores } = data;
  const [showDeeper, setShowDeeper] = React.useState(false);
  const [showScores, setShowScores] = React.useState(false);
  const [showProse, setShowProse] = React.useState(true);

  return (
    <div className="space-y-4 pb-6">
      {/* ── 1. Central Tension Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.05 }}
        className={cn(
          'relative rounded-xl border border-white/60 p-5',
          'bg-white/50 backdrop-blur-sm overflow-hidden',
        )}
        style={{
          borderLeft: '4px solid hsl(250, 70%, 60%)',
          boxShadow: `
            0 4px 24px hsla(250, 70%, 60%, 0.08),
            0 1px 4px hsla(235, 20%, 15%, 0.04),
            inset 0 1px 0 hsla(0, 0%, 100%, 0.4)
          `,
        }}
      >
        {/* Subtle purple glow */}
        <div
          className="absolute -top-8 -left-8 h-32 w-32 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsla(250, 70%, 60%, 0.08) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
          aria-hidden="true"
        />
        <div className="relative flex items-start gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0 bg-[hsla(250,70%,60%,0.1)]">
            <Compass className="h-4 w-4 text-[hsl(250,70%,60%)]" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(250,70%,55%)] block mb-1.5">
              Central Tension
            </span>
            <p className="text-[15px] leading-relaxed text-[hsl(235,20%,15%)] italic font-medium">
              {portrait.centralTension}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── 2. Phase + EQI + Confidence Row ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.12 }}
        className="flex items-center gap-3 flex-wrap"
      >
        <PhaseBadge phase={phase} />

        {/* EQI badge */}
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1',
            'bg-white/60 backdrop-blur-sm border border-white/50',
            'text-[12px] font-semibold text-[hsl(235,20%,25%)]',
          )}
        >
          <div className="relative h-5 w-5">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="hsla(235, 15%, 88%, 0.6)"
                strokeWidth="3"
              />
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke={eqi >= 75 ? 'hsl(160, 70%, 55%)' : eqi >= 50 ? 'hsl(35, 85%, 55%)' : 'hsl(350, 75%, 60%)'}
                strokeWidth="3"
                strokeDasharray={`${eqi} ${100 - eqi}`}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span>EQI {eqi}</span>
        </div>

        {/* Confidence badge */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
            'bg-white/60 backdrop-blur-sm border border-white/50',
            'text-[11px] font-medium text-[hsl(235,10%,45%)]',
          )}
        >
          <div className="flex gap-0.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  confidence === 'Deep' || (confidence === 'Moderate' && i <= 2) || (confidence === 'Surface' && i <= 1)
                    ? 'bg-[hsl(250,70%,60%)]'
                    : 'bg-[hsla(235,15%,85%,0.6)]',
                )}
              />
            ))}
          </div>
          {confidence}
        </div>
      </motion.div>

      {/* ── 3. Understanding Prose ── */}
      <GlassCard delay={0.18}>
        <button
          onClick={() => setShowProse((v) => !v)}
          className="flex items-center gap-2 w-full text-left group"
        >
          <div className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0 bg-[hsla(185,80%,55%,0.1)]">
            <BookOpen className="h-3.5 w-3.5 text-[hsl(185,80%,45%)]" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[hsl(185,70%,40%)] flex-1">
            The System's Reading
          </span>
          {showProse ? (
            <ChevronUp className="h-4 w-4 text-[hsl(235,10%,55%)] group-hover:text-[hsl(185,80%,45%)] transition-colors" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[hsl(235,10%,55%)] group-hover:text-[hsl(185,80%,45%)] transition-colors" />
          )}
        </button>
        {showProse && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="mt-3 pl-2 border-l-2 border-[hsla(185,80%,55%,0.25)]"
          >
            {portrait.essayUnderstandingProse.split('\n\n').map((para, i) => (
              <p
                key={i}
                className="text-[13px] leading-[1.7] text-[hsl(235,15%,30%)] mb-3 last:mb-0"
              >
                {para}
              </p>
            ))}
          </motion.div>
        )}
      </GlassCard>

      {/* ── 4. Core Intelligence Cards ── */}
      <div className="grid gap-3">
        <IntelligenceCard
          icon={Mic}
          label="Voice"
          accentColor="hsl(250, 70%, 55%)"
          accentBg="hsla(250, 70%, 60%, 0.1)"
          delay={0.24}
        >
          {portrait.voiceSignature}
        </IntelligenceCard>

        <IntelligenceCard
          icon={User}
          label="Writer"
          accentColor="hsl(185, 80%, 42%)"
          accentBg="hsla(185, 80%, 55%, 0.1)"
          delay={0.28}
        >
          {portrait.writerPortrait}
        </IntelligenceCard>

        <IntelligenceCard
          icon={Map}
          label="Strategy"
          accentColor="hsl(35, 85%, 48%)"
          accentBg="hsla(35, 85%, 60%, 0.1)"
          delay={0.32}
        >
          <p>{portrait.narrativeStrategy}</p>
          <span
            className="inline-flex items-center mt-2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold
                       bg-[hsla(35,85%,60%,0.1)] text-[hsl(35,75%,40%)] border border-[hsla(35,85%,60%,0.2)]"
          >
            {portrait.arcType}
          </span>
        </IntelligenceCard>

        <IntelligenceCard
          icon={Heart}
          label="Emotional Arc"
          accentColor="hsl(350, 75%, 55%)"
          accentBg="hsla(350, 75%, 65%, 0.1)"
          delay={0.36}
        >
          {portrait.emotionalArc}
        </IntelligenceCard>
      </div>

      {/* ── 5. Deeper Intelligence (Collapsible) ── */}
      <GlassCard delay={0.4}>
        <button
          onClick={() => setShowDeeper((v) => !v)}
          className="flex items-center gap-2 w-full text-left group"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[hsl(235,15%,45%)] flex-1">
            Deeper Intelligence
          </span>
          {showDeeper ? (
            <ChevronUp className="h-4 w-4 text-[hsl(235,10%,55%)] group-hover:text-[hsl(250,70%,55%)] transition-colors" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[hsl(235,10%,55%)] group-hover:text-[hsl(250,70%,55%)] transition-colors" />
          )}
        </button>

        {showDeeper && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="mt-4 space-y-4"
          >
            {/* AO Memorability */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0 bg-[hsla(250,70%,60%,0.08)]">
                <GraduationCap className="h-3.5 w-3.5 text-[hsl(250,70%,55%)]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(250,60%,50%)] block mb-1">
                  AO Memorability
                </span>
                <p className="text-[12px] leading-relaxed text-[hsl(235,15%,30%)]">{portrait.memorability}</p>
              </div>
            </div>

            {/* Distinctiveness */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0 bg-[hsla(185,80%,55%,0.08)]">
                <Sparkles className="h-3.5 w-3.5 text-[hsl(185,80%,45%)]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(185,70%,40%)] block mb-1.5">
                  Distinctiveness
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {portrait.distinctivenessFactors.map((factor) => (
                    <span
                      key={factor}
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium
                                 bg-[hsla(185,80%,55%,0.08)] text-[hsl(185,60%,35%)] border border-[hsla(185,80%,55%,0.15)]"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tellability */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0 bg-[hsla(35,85%,60%,0.08)]">
                <Lightbulb className="h-3.5 w-3.5 text-[hsl(35,85%,50%)]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(35,75%,40%)] block mb-1">
                  Tellability
                </span>
                <p className="text-[12px] leading-relaxed text-[hsl(235,15%,30%)]">{portrait.tellability}</p>
              </div>
            </div>

            {/* Archetype */}
            <div
              className="rounded-lg border border-[hsla(250,70%,60%,0.12)] bg-[hsla(250,70%,60%,0.03)] p-3"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(250,60%,50%)] block mb-1.5">
                Archetype: {portrait.archetype.name}
              </span>
              <p className="text-[11px] leading-relaxed text-[hsl(235,10%,45%)] mb-1">
                <span className="font-semibold text-[hsl(235,15%,35%)]">Pool Density:</span> {portrait.archetype.poolDensity}
              </p>
              <p className="text-[11px] leading-relaxed text-[hsl(235,10%,45%)]">
                <span className="font-semibold text-[hsl(235,15%,35%)]">Differentiator:</span> {portrait.archetype.differentiator}
              </p>
            </div>

            {/* Values */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(235,15%,45%)] block mb-1.5">
                Core Values
              </span>
              <div className="flex flex-wrap gap-1.5">
                {portrait.values.map((value) => (
                  <span
                    key={value}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold
                               bg-[hsla(250,70%,60%,0.08)] text-[hsl(250,55%,48%)] border border-[hsla(250,70%,60%,0.15)]"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>

            {/* Thematic Threads */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(235,15%,45%)] block mb-2">
                Thematic Threads
              </span>
              <div className="space-y-2">
                {portrait.thematicThreads.map((thread) => (
                  <div key={thread.theme} className="flex items-start gap-2">
                    <div className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', STRENGTH_DOT[thread.strength])} />
                    <div>
                      <span className="text-[11px] font-semibold text-[hsl(235,20%,25%)]">{thread.theme}</span>
                      <p className="text-[11px] leading-relaxed text-[hsl(235,10%,45%)]">{thread.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Through-line */}
            {portrait.throughLine && (
              <div
                className="rounded-lg border border-[hsla(185,80%,55%,0.15)] bg-[hsla(185,80%,55%,0.04)] p-3"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(185,70%,40%)] block mb-1">
                  Through-Line
                </span>
                <p className="text-[12px] leading-relaxed text-[hsl(235,15%,30%)] italic">
                  {portrait.throughLine}
                </p>
              </div>
            )}

            {/* Red Flags */}
            {portrait.redFlags && portrait.redFlags.length > 0 && (
              <div
                className="rounded-lg border border-[hsla(350,75%,65%,0.2)] bg-[hsla(350,75%,65%,0.04)] p-3"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-[hsl(350,75%,55%)]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(350,65%,50%)]">
                    Red Flags
                  </span>
                </div>
                {portrait.redFlags.map((flag) => (
                  <p key={flag} className="text-[12px] leading-relaxed text-[hsl(350,60%,40%)]">
                    {flag}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </GlassCard>

      {/* ── 6. Action Buttons ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.44 }}
        className="flex flex-col gap-2 pt-1"
      >
        <Button
          onClick={onShowRoadmap}
          className={cn(
            'w-full justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold',
            'bg-[hsl(250,70%,60%)] hover:bg-[hsl(250,70%,55%)] text-white',
            'shadow-[0_4px_16px_hsla(250,70%,60%,0.25)]',
            'transition-all duration-200',
          )}
        >
          <ArrowRight className="h-4 w-4" />
          View Improvement Guide
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowScores((v) => !v)}
          className={cn(
            'w-full justify-center gap-2 h-9 rounded-xl text-[12px] font-medium',
            'border-white/60 bg-white/40 backdrop-blur-sm',
            'hover:bg-white/60 hover:border-white/70',
            'text-[hsl(235,15%,40%)]',
          )}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          {showScores ? 'Hide Scores' : 'View Scores'}
        </Button>
      </motion.div>

      {/* ── Inline Scores ── */}
      {showScores && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <GlassCard delay={0}>
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(235,15%,45%)] block mb-3">
              Dimension Scores
            </span>
            <div className="space-y-2">
              {scores.map((s) => (
                <ScoreBar key={s.dimensionId} label={s.label} score={s.score} maxScore={s.maxScore} />
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}
