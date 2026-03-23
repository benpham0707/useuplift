import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Eye,
  GitBranch,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MockAnnotation, AnnotationSeverity, TeachingMode } from './mockData';
import './workshop.css';

// ═══════════════════════════════════════════
// Severity Design Tokens
// ═══════════════════════════════════════════

interface SeverityStyle {
  bg: string;
  bgHover: string;
  border: string;
  borderStyle: string;
  glowColor: string;
  ring: string;
  text: string;
  dotColor: string;
  shimmer: boolean;
  glowAnim: string | null;
}

const SEVERITY_STYLES: Record<AnnotationSeverity, SeverityStyle> = {
  critical: {
    bg: 'hsla(350, 75%, 65%, 0.07)',
    bgHover: 'hsla(350, 75%, 65%, 0.13)',
    border: 'hsla(350, 75%, 65%, 0.6)',
    borderStyle: 'solid',
    glowColor: 'hsla(350, 75%, 65%, 0.2)',
    ring: 'ring-[hsla(350,75%,65%,0.35)]',
    text: 'hsl(350, 65%, 45%)',
    dotColor: 'bg-[hsl(350,75%,65%)]',
    shimmer: false,
    glowAnim: 'glow-critical 3s ease-in-out infinite',
  },
  important: {
    bg: 'hsla(35, 85%, 60%, 0.07)',
    bgHover: 'hsla(35, 85%, 60%, 0.13)',
    border: 'hsla(35, 85%, 60%, 0.55)',
    borderStyle: 'solid',
    glowColor: 'hsla(35, 85%, 60%, 0.18)',
    ring: 'ring-[hsla(35,85%,60%,0.35)]',
    text: 'hsl(35, 75%, 40%)',
    dotColor: 'bg-[hsl(35,85%,60%)]',
    shimmer: false,
    glowAnim: null,
  },
  suggestion: {
    bg: 'hsla(220, 70%, 65%, 0.06)',
    bgHover: 'hsla(220, 70%, 65%, 0.12)',
    border: 'hsla(220, 70%, 65%, 0.45)',
    borderStyle: 'dotted',
    glowColor: 'hsla(220, 70%, 65%, 0.15)',
    ring: 'ring-[hsla(220,70%,65%,0.35)]',
    text: 'hsl(220, 60%, 45%)',
    dotColor: 'bg-[hsl(220,70%,65%)]',
    shimmer: false,
    glowAnim: null,
  },
  strength: {
    bg: 'hsla(160, 70%, 55%, 0.06)',
    bgHover: 'hsla(160, 70%, 55%, 0.12)',
    border: 'hsla(160, 70%, 55%, 0.55)',
    borderStyle: 'solid',
    glowColor: 'hsla(160, 70%, 55%, 0.2)',
    ring: 'ring-[hsla(160,70%,55%,0.35)]',
    text: 'hsl(160, 60%, 35%)',
    dotColor: 'bg-[hsl(160,70%,55%)]',
    shimmer: true,
    glowAnim: 'glow-strength 3s ease-in-out infinite',
  },
};

// ═══════════════════════════════════════════
// Teaching Mode Config
// ═══════════════════════════════════════════

interface TeachingModeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  bg: string;
}

const TEACHING_MODES: Record<TeachingMode, TeachingModeConfig> = {
  awareness: {
    label: 'Awareness',
    icon: Eye,
    color: 'hsl(250, 70%, 60%)',
    bg: 'hsla(250, 70%, 60%, 0.1)',
  },
  consequence: {
    label: 'Consequence',
    icon: Zap,
    color: 'hsl(35, 85%, 55%)',
    bg: 'hsla(35, 85%, 60%, 0.1)',
  },
  connection: {
    label: 'Connection',
    icon: GitBranch,
    color: 'hsl(185, 80%, 45%)',
    bg: 'hsla(185, 80%, 55%, 0.1)',
  },
  action: {
    label: 'Action',
    icon: ArrowRight,
    color: 'hsl(220, 70%, 58%)',
    bg: 'hsla(220, 70%, 65%, 0.1)',
  },
};

// ═══════════════════════════════════════════
// Severity Icon
// ═══════════════════════════════════════════

function SeverityIcon({
  severity,
  className,
}: {
  severity: AnnotationSeverity;
  className?: string;
}) {
  const iconClass = cn('h-3.5 w-3.5', className);
  switch (severity) {
    case 'critical':
      return <AlertTriangle className={iconClass} />;
    case 'important':
      return <Lightbulb className={iconClass} />;
    case 'suggestion':
      return <MessageCircle className={iconClass} />;
    case 'strength':
      return <Sparkles className={iconClass} />;
  }
}

// ═══════════════════════════════════════════
// Hover Tooltip Card
// ═══════════════════════════════════════════

function InsightTooltip({
  annotation,
  severity,
}: {
  annotation: MockAnnotation;
  severity: AnnotationSeverity;
}) {
  const style = SEVERITY_STYLES[severity];
  const mode = TEACHING_MODES[annotation.teachingMode];
  const ModeIcon = mode.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 pointer-events-none"
      style={{ filter: `drop-shadow(0 4px 20px ${style.glowColor})` }}
    >
      <div
        className="rounded-xl border border-white/50 p-3.5 backdrop-blur-xl"
        style={{
          background: `linear-gradient(135deg, hsla(0, 0%, 100%, 0.88) 0%, hsla(0, 0%, 100%, 0.78) 100%)`,
          boxShadow: `
            0 8px 32px hsla(235, 20%, 15%, 0.08),
            0 2px 8px hsla(235, 20%, 15%, 0.04),
            inset 0 1px 0 hsla(0, 0%, 100%, 0.5)
          `,
        }}
      >
        {/* Header — severity + teaching mode */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center justify-center h-5 w-5 rounded-md"
              style={{ background: style.bg, color: style.text }}
            >
              <SeverityIcon severity={severity} className="h-3 w-3" />
            </div>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: style.text }}
            >
              {severity}
            </span>
          </div>
          <div
            className="flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{ background: mode.bg }}
          >
            <ModeIcon
              className="h-3 w-3"
              strokeWidth={2}
            />
            <span
              className="text-[10px] font-medium"
              style={{ color: mode.color }}
            >
              {mode.label}
            </span>
          </div>
        </div>

        {/* Title */}
        <p className="text-[13px] font-semibold leading-snug text-[hsl(235,20%,15%)] mb-1.5">
          {annotation.title}
        </p>

        {/* Insight preview (2-line clamp) */}
        <p className="text-[12px] leading-relaxed text-[hsl(235,15%,40%)] line-clamp-2">
          {annotation.insight}
        </p>

        {/* Click hint */}
        <div className="mt-2 flex items-center gap-1 text-[10px] text-[hsl(235,15%,55%)]">
          <span className="inline-block h-1 w-1 rounded-full bg-[hsl(250,70%,60%)]" />
          Click to explore
        </div>
      </div>

      {/* Arrow pointing down */}
      <div className="flex justify-center -mt-px">
        <div
          className="h-2 w-2 rotate-45 border-r border-b border-white/50"
          style={{
            background: 'hsla(0, 0%, 100%, 0.85)',
          }}
        />
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export interface InsightHighlightProps {
  text: string;
  annotation: MockAnnotation;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function InsightHighlight({
  text,
  annotation,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: InsightHighlightProps) {
  const style = SEVERITY_STYLES[annotation.severity];
  const isDeferred = annotation.isDeferred;

  // Determine dynamic styles
  const bgColor = isHovered && !isDeferred ? style.bgHover : style.bg;
  const borderColor = isDeferred ? `${style.border.replace(/[\d.]+\)$/, '0.25)')}` : style.border;
  const borderWidth = annotation.severity === 'critical' ? '2.5px' : '2px';
  const opacity = isDeferred ? 0.35 : 1;

  return (
    <span className="relative inline" style={{ opacity }}>
      {/* The annotated text span */}
      <span
        role="button"
        tabIndex={0}
        onClick={!isDeferred ? onClick : undefined}
        onMouseEnter={!isDeferred ? onMouseEnter : undefined}
        onMouseLeave={!isDeferred ? onMouseLeave : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isDeferred) onClick();
          }
        }}
        className={cn(
          'relative inline rounded-sm transition-all duration-200 ease-out',
          !isDeferred && 'cursor-pointer',
          isDeferred && 'cursor-default',
          isSelected && !isDeferred && `ring-2 ${style.ring}`,
        )}
        style={{
          background: bgColor,
          borderBottom: `${borderWidth} ${isDeferred ? 'dashed' : style.borderStyle} ${borderColor}`,
          boxShadow: isSelected && !isDeferred
            ? `0 2px 12px ${style.glowColor}, 0 1px 4px hsla(235, 20%, 15%, 0.06)`
            : isHovered && !isDeferred
              ? `0 1px 8px ${style.glowColor}`
              : 'none',
          paddingBottom: '1px',
          // Inline animation for critical and strength glows
          animation:
            !isDeferred && isSelected && style.glowAnim
              ? style.glowAnim
              : undefined,
        }}
      >
        {/* Shimmer overlay for strengths */}
        {style.shimmer && !isDeferred && (
          <span
            className="absolute inset-0 pointer-events-none rounded-sm workshop-shimmer-layer"
            aria-hidden="true"
            style={{
              background: `linear-gradient(
                105deg,
                transparent 38%,
                hsla(160, 70%, 70%, 0.08) 44%,
                hsla(0, 0%, 100%, 0.14) 50%,
                hsla(160, 70%, 70%, 0.06) 56%,
                transparent 62%
              )`,
              backgroundSize: '200% 100%',
              animation: 'workshop-shimmer 5s ease-in-out infinite',
            }}
          />
        )}

        {/* Critical glow underline */}
        {annotation.severity === 'critical' && !isDeferred && (
          <span
            className="absolute bottom-0 left-0 right-0 h-[2.5px] pointer-events-none rounded-full"
            aria-hidden="true"
            style={{
              background: `linear-gradient(90deg,
                hsla(350, 75%, 65%, 0.3) 0%,
                hsla(350, 75%, 65%, 0.6) 50%,
                hsla(350, 75%, 65%, 0.3) 100%
              )`,
              filter: 'blur(0.5px)',
            }}
          />
        )}

        {/* Text */}
        <span className="relative z-[1]">{text}</span>
      </span>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {isHovered && !isDeferred && (
          <InsightTooltip annotation={annotation} severity={annotation.severity} />
        )}
      </AnimatePresence>
    </span>
  );
}

// Re-export for use in ParagraphBlock
export { SEVERITY_STYLES, SeverityIcon };
