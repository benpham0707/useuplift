/**
 * InsightCard — Premium annotation detail card for the right panel.
 *
 * Shows full annotation detail with severity badge, teaching mode,
 * quoted text, insight, suggestion, rewrite example, north star connection,
 * and action buttons. All with glassmorphism + staggered framer-motion animations.
 */

import * as React from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Compass,
  Copy,
  Check,
  MessageSquare,
  ArrowDown,
  Eye,
  Zap,
  GitBranch,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { MockAnnotation, AnnotationSeverity, TeachingMode } from './mockData';
import './workshop.css';

// ═══════════════════════════════════════════
// Severity Tokens
// ═══════════════════════════════════════════

interface SeverityConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  glow: string;
}

const SEVERITY_CONFIG: Record<AnnotationSeverity, SeverityConfig> = {
  critical: {
    label: 'Critical',
    icon: AlertTriangle,
    color: 'hsl(350, 75%, 55%)',
    bg: 'hsla(350, 75%, 65%, 0.1)',
    border: 'hsla(350, 75%, 65%, 0.25)',
    glow: 'hsla(350, 75%, 65%, 0.15)',
  },
  important: {
    label: 'Important',
    icon: Lightbulb,
    color: 'hsl(35, 85%, 50%)',
    bg: 'hsla(35, 85%, 60%, 0.1)',
    border: 'hsla(35, 85%, 60%, 0.25)',
    glow: 'hsla(35, 85%, 60%, 0.15)',
  },
  suggestion: {
    label: 'Suggestion',
    icon: MessageCircle,
    color: 'hsl(220, 70%, 55%)',
    bg: 'hsla(220, 70%, 65%, 0.1)',
    border: 'hsla(220, 70%, 65%, 0.25)',
    glow: 'hsla(220, 70%, 65%, 0.15)',
  },
  strength: {
    label: 'Strength',
    icon: Sparkles,
    color: 'hsl(160, 70%, 45%)',
    bg: 'hsla(160, 70%, 55%, 0.1)',
    border: 'hsla(160, 70%, 55%, 0.25)',
    glow: 'hsla(160, 70%, 55%, 0.15)',
  },
};

// ═══════════════════════════════════════════
// Teaching Mode Tokens
// ═══════════════════════════════════════════

interface TeachingConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

const TEACHING_CONFIG: Record<TeachingMode, TeachingConfig> = {
  awareness: {
    label: 'Awareness',
    icon: Eye,
    color: 'hsl(250, 70%, 55%)',
    bg: 'hsla(250, 70%, 60%, 0.1)',
  },
  consequence: {
    label: 'Consequence',
    icon: Zap,
    color: 'hsl(35, 85%, 50%)',
    bg: 'hsla(35, 85%, 60%, 0.1)',
  },
  connection: {
    label: 'Connection',
    icon: GitBranch,
    color: 'hsl(185, 80%, 42%)',
    bg: 'hsla(185, 80%, 55%, 0.1)',
  },
  action: {
    label: 'Action',
    icon: ArrowRight,
    color: 'hsl(220, 70%, 55%)',
    bg: 'hsla(220, 70%, 65%, 0.1)',
  },
};

// ═══════════════════════════════════════════
// Priority Dots
// ═══════════════════════════════════════════

function PriorityDots({ count, maxDots = 5 }: { count: number; maxDots?: number }) {
  return (
    <div className="flex items-center gap-0.5" title={`Priority ${count}/${maxDots}`}>
      {Array.from({ length: maxDots }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-colors',
            i < count ? 'bg-[hsl(250,70%,60%)]' : 'bg-[hsla(235,15%,85%,0.6)]',
          )}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

interface InsightCardProps {
  annotation: MockAnnotation;
  paragraphRole?: string;
  paragraphVerdict?: string;
  onAskCoach: () => void;
  onBack: () => void;
}

export function InsightCard({ annotation, paragraphRole, paragraphVerdict, onAskCoach }: InsightCardProps) {
  const [copied, setCopied] = React.useState(false);
  const severity = SEVERITY_CONFIG[annotation.severity];
  const teaching = TEACHING_CONFIG[annotation.teachingMode];
  const SeverityIcon = severity.icon;
  const TeachingIcon = teaching.icon;

  // Find the rewrite example — we use the insight field for annotations that don't have
  // a dedicated rewrite field in the existing mock data shape
  const hasRewrite = 'rewriteExample' in annotation && (annotation as Record<string, unknown>).rewriteExample;
  const rewriteText = hasRewrite ? String((annotation as Record<string, unknown>).rewriteExample) : null;

  const hasNorthStar = 'northStarConnection' in annotation && (annotation as Record<string, unknown>).northStarConnection;
  const northStarText = hasNorthStar ? String((annotation as Record<string, unknown>).northStarConnection) : null;

  const copyRewrite = React.useCallback(async () => {
    if (!rewriteText) return;
    try {
      await navigator.clipboard.writeText(rewriteText);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = rewriteText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [rewriteText]);

  // Compute span text to show — the existing mock data uses startOffset/endOffset within paragraph
  // but we also support an explicit spanText field
  const spanText = 'spanText' in annotation
    ? String((annotation as Record<string, unknown>).spanText)
    : annotation.title;

  return (
    <div className="space-y-4">
      {/* ── Header: Severity + Teaching Mode + Priority ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.05 }}
        className="flex items-center gap-2 flex-wrap"
      >
        {/* Severity badge */}
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold
                     backdrop-blur-sm"
          style={{
            color: severity.color,
            background: `linear-gradient(135deg, ${severity.bg}, hsla(0, 0%, 100%, 0.6))`,
            border: `1px solid ${severity.border}`,
            boxShadow: `0 2px 8px ${severity.glow}`,
          }}
        >
          <SeverityIcon className="h-3 w-3" />
          {severity.label}
        </div>

        {/* Teaching mode badge */}
        <div
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            color: teaching.color,
            background: teaching.bg,
          }}
        >
          <TeachingIcon className="h-3 w-3" />
          {teaching.label}
        </div>

        {/* Priority dots */}
        <PriorityDots count={annotation.isDeferred ? 1 : 3} />
      </motion.div>

      {/* ── Paragraph context banner ── */}
      {paragraphRole && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.1 }}
          className={cn(
            'rounded-lg border border-white/50 px-3 py-2',
            'bg-white/40 backdrop-blur-sm',
            'text-[11px] text-[hsl(235,15%,40%)]',
          )}
        >
          <span className="font-semibold text-[hsl(235,20%,25%)]">
            P{annotation.paragraphIndex + 1}: {paragraphRole}
          </span>
          {paragraphVerdict && (
            <span className="block mt-0.5 text-[hsl(235,10%,50%)]">{paragraphVerdict}</span>
          )}
        </motion.div>
      )}

      {/* ── Quoted text ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.15 }}
        className={cn(
          'rounded-lg px-3.5 py-2.5',
          'bg-[hsla(235,15%,95%,0.5)] border border-[hsla(235,15%,88%,0.4)]',
          'border-l-2',
        )}
        style={{ borderLeftColor: `${severity.color}55` }}
      >
        <p className="text-[13px] text-[hsl(235,10%,40%)] italic leading-relaxed line-clamp-4">
          &ldquo;{spanText}&rdquo;
        </p>
      </motion.div>

      {/* ── Insight section ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.2 }}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <div
            className="h-1 w-1 rounded-full"
            style={{ background: severity.color }}
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(235,15%,45%)]">
            What I Notice
          </span>
        </div>
        <div
          className="pl-3 border-l-2"
          style={{ borderColor: `${severity.color}30` }}
        >
          <p className="text-[13px] leading-relaxed text-[hsl(235,20%,20%)]">
            {annotation.insight}
          </p>
        </div>
      </motion.div>

      {/* ── Suggestion section ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.25 }}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="h-1 w-1 rounded-full bg-[hsl(220,70%,65%)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(235,15%,45%)]">
            Direction
          </span>
        </div>
        <p className="text-[13px] leading-relaxed text-[hsl(235,15%,30%)] pl-3">
          {annotation.title !== annotation.insight ? annotation.title : 'Consider the alternative approaches shown above.'}
        </p>
      </motion.div>

      {/* ── Rewrite card ── */}
      {rewriteText && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.3 }}
          className={cn(
            'rounded-xl border border-[hsla(160,70%,55%,0.2)] p-3.5',
            'bg-[hsla(160,70%,55%,0.04)] backdrop-blur-sm',
          )}
          style={{
            boxShadow: '0 2px 12px hsla(160, 70%, 55%, 0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[hsl(160,70%,45%)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(160,60%,40%)]">
                Suggested Rewrite
              </span>
            </div>
            <button
              type="button"
              onClick={copyRewrite}
              className={cn(
                'flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all duration-200',
                copied
                  ? 'bg-[hsla(160,70%,55%,0.15)] text-[hsl(160,60%,35%)]'
                  : 'bg-white/50 text-[hsl(235,10%,45%)] hover:bg-white/70 hover:text-[hsl(235,15%,30%)]',
              )}
            >
              {copied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
            </button>
          </div>
          <p className="text-[13px] leading-relaxed text-[hsl(235,20%,20%)] font-medium">
            {rewriteText}
          </p>
        </motion.div>
      )}

      {/* ── North Star Connection ── */}
      {northStarText && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.35 }}
          className={cn(
            'rounded-xl border border-[hsla(250,70%,60%,0.2)] p-3.5',
            'bg-[hsla(250,70%,60%,0.04)] backdrop-blur-sm',
          )}
          style={{
            boxShadow: '0 2px 12px hsla(250, 70%, 60%, 0.06)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Compass className="h-3.5 w-3.5 text-[hsl(250,70%,55%)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(250,60%,50%)]">
              Architectural Significance
            </span>
          </div>
          <p className="text-[12px] leading-relaxed text-[hsl(235,15%,30%)] italic">
            {northStarText}
          </p>
        </motion.div>
      )}

      {/* ── Action Buttons ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.4 }}
        className="flex items-center gap-2 pt-1"
      >
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-1.5 text-[12px] rounded-lg h-8',
            'border-white/60 bg-white/40 backdrop-blur-sm',
            'hover:bg-white/60 hover:border-[hsla(250,70%,60%,0.25)]',
            'text-[hsl(235,15%,35%)]',
          )}
        >
          <ArrowDown className="h-3 w-3" />
          Go Deeper
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onAskCoach}
          className={cn(
            'gap-1.5 text-[12px] rounded-lg h-8',
            'border-white/60 bg-white/40 backdrop-blur-sm',
            'hover:bg-[hsla(250,70%,60%,0.06)] hover:border-[hsla(250,70%,60%,0.25)]',
            'text-[hsl(250,70%,55%)]',
          )}
        >
          <MessageSquare className="h-3 w-3" />
          Ask Coach
        </Button>
      </motion.div>
    </div>
  );
}
