import * as React from 'react';
import { motion } from 'motion/react';
import {
  Anchor,
  User,
  Flame,
  RotateCcw,
  Layers,
  FileText,
  Link,
  Compass,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  MockParagraph,
  MockAnnotation,
  MockConnection,
  AnnotationSeverity,
  StructuralWeight,
} from './mockData';
import { InsightHighlight, SEVERITY_STYLES, SeverityIcon } from './InsightHighlight';
import './workshop.css';

// ═══════════════════════════════════════════
// Icon Resolver
// ═══════════════════════════════════════════

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Anchor,
  User,
  Flame,
  RotateCcw,
  Layers,
  FileText,
  Link,
  Compass,
};

function RoleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} strokeWidth={1.8} />;
}

// ═══════════════════════════════════════════
// Weight Border Styles
// ═══════════════════════════════════════════

interface WeightStyle {
  borderWidth: string;
  borderColor: string;
}

const WEIGHT_STYLES: Record<StructuralWeight, WeightStyle> = {
  load_bearing: {
    borderWidth: '2px',
    borderColor: 'hsla(350, 75%, 65%, 0.5)',
  },
  supporting: {
    borderWidth: '2px',
    borderColor: 'hsla(250, 70%, 60%, 0.3)',
  },
  transitional: {
    borderWidth: '1px',
    borderColor: 'hsla(220, 50%, 60%, 0.2)',
  },
  decorative: {
    borderWidth: '0px',
    borderColor: 'transparent',
  },
};

// ═══════════════════════════════════════════
// Effectiveness Color
// ═══════════════════════════════════════════

function effectivenessColor(score: number): string {
  if (score >= 85) return 'hsl(160, 70%, 55%)';
  if (score >= 70) return 'hsl(80, 60%, 50%)';
  if (score >= 55) return 'hsl(35, 85%, 55%)';
  return 'hsl(350, 75%, 60%)';
}

function effectivenessWidth(score: number): string {
  return `${Math.max(8, score)}%`;
}

// ═══════════════════════════════════════════
// Severity Priority (for gutter dot)
// ═══════════════════════════════════════════

const SEVERITY_PRIORITY: Record<AnnotationSeverity, number> = {
  critical: 4,
  important: 3,
  suggestion: 2,
  strength: 1,
};

function highestSeverity(annotations: MockAnnotation[]): AnnotationSeverity | null {
  if (annotations.length === 0) return null;
  const nonDeferred = annotations.filter((a) => !a.isDeferred);
  if (nonDeferred.length === 0) return null;
  return nonDeferred.reduce((highest, a) =>
    SEVERITY_PRIORITY[a.severity] > SEVERITY_PRIORITY[highest.severity] ? a : highest
  ).severity;
}

// ═══════════════════════════════════════════
// Text Segmentation
// ═══════════════════════════════════════════

interface TextSegment {
  text: string;
  annotation: MockAnnotation | null;
  startOffset: number;
  endOffset: number;
}

/**
 * Splits paragraph text into annotated and non-annotated segments.
 * Handles overlapping annotations by giving priority to higher severity.
 */
function segmentText(text: string, annotations: MockAnnotation[]): TextSegment[] {
  if (annotations.length === 0) {
    return [{ text, annotation: null, startOffset: 0, endOffset: text.length }];
  }

  // Sort annotations by start offset, then by severity priority (desc)
  const sorted = [...annotations].sort((a, b) => {
    if (a.startOffset !== b.startOffset) return a.startOffset - b.startOffset;
    return SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity];
  });

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const ann of sorted) {
    // Clamp to valid text range
    const start = Math.max(ann.startOffset, cursor);
    const end = Math.min(ann.endOffset, text.length);

    if (start >= end) continue;

    // Non-annotated gap before this annotation
    if (cursor < start) {
      segments.push({
        text: text.slice(cursor, start),
        annotation: null,
        startOffset: cursor,
        endOffset: start,
      });
    }

    // Annotated segment
    segments.push({
      text: text.slice(start, end),
      annotation: ann,
      startOffset: start,
      endOffset: end,
    });

    cursor = end;
  }

  // Trailing non-annotated text
  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      annotation: null,
      startOffset: cursor,
      endOffset: text.length,
    });
  }

  return segments;
}

// ═══════════════════════════════════════════
// Connection Badge
// ═══════════════════════════════════════════

function ConnectionBadge({
  targetParagraph,
  label,
  strength,
}: {
  targetParagraph: number;
  label: string;
  strength: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-medium
                 border border-[hsla(250,70%,60%,0.15)] bg-[hsla(250,70%,60%,0.05)]
                 text-[hsl(250,50%,50%)] transition-colors duration-150
                 hover:bg-[hsla(250,70%,60%,0.1)] hover:border-[hsla(250,70%,60%,0.25)]"
      title={label}
      style={{ opacity: 0.5 + strength * 0.5 }}
    >
      <ChevronRight className="h-2.5 w-2.5" strokeWidth={2.5} />
      P{targetParagraph + 1}
    </span>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export interface ParagraphBlockProps {
  paragraph: MockParagraph;
  annotations: MockAnnotation[];
  connections: MockConnection[];
  isIsland: boolean;
  selectedAnnotationId: string | null;
  hoveredAnnotationId: string | null;
  onAnnotationClick: (id: string) => void;
  onAnnotationHover: (id: string | null) => void;
  onParagraphClick: (index: number) => void;
}

export function ParagraphBlock({
  paragraph,
  annotations,
  connections,
  isIsland,
  selectedAnnotationId,
  hoveredAnnotationId,
  onAnnotationClick,
  onAnnotationHover,
  onParagraphClick,
}: ParagraphBlockProps) {
  const weightStyle = WEIGHT_STYLES[paragraph.structuralWeight];
  const topSeverity = highestSeverity(annotations);
  const segments = segmentText(paragraph.text, annotations);
  const effColor = effectivenessColor(paragraph.effectiveness);
  const effWidth = effectivenessWidth(paragraph.effectiveness);

  // Outgoing connections from this paragraph
  const outgoing = connections.filter((c) => c.fromParagraph === paragraph.index);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: paragraph.index * 0.06,
      }}
      className="group/block relative"
    >
      <div
        className={cn(
          'relative flex gap-3 rounded-xl px-4 py-3.5',
          'transition-all duration-200 ease-out',
          'hover:bg-[hsla(250,70%,60%,0.02)]',
        )}
        style={{
          borderLeft: `${weightStyle.borderWidth} solid ${weightStyle.borderColor}`,
        }}
      >
        {/* ── Gutter ── */}
        <div className="flex flex-col items-center gap-1.5 pt-0.5 select-none shrink-0 w-6">
          {/* Paragraph number */}
          <span className="text-[11px] font-mono font-semibold text-[hsl(235,15%,55%)] leading-none">
            {paragraph.index + 1}
          </span>

          {/* Severity dot */}
          {topSeverity && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.2 + paragraph.index * 0.06 }}
              className={cn(
                'h-2 w-2 rounded-full',
                SEVERITY_STYLES[topSeverity].dotColor,
              )}
              style={{
                boxShadow: topSeverity === 'critical'
                  ? `0 0 6px ${SEVERITY_STYLES.critical.glowColor}`
                  : topSeverity === 'strength'
                    ? `0 0 6px ${SEVERITY_STYLES.strength.glowColor}`
                    : 'none',
              }}
            />
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0">
          {/* Role label row */}
          <div className="flex items-center gap-2 mb-1.5">
            <button
              onClick={() => onParagraphClick(paragraph.index)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2 py-0.5',
                'text-[10px] font-bold uppercase tracking-[0.08em] leading-none',
                'transition-all duration-150 ease-out',
                'text-[hsl(235,20%,48%)] hover:text-[hsl(250,70%,55%)]',
                'bg-[hsla(250,70%,60%,0.04)] hover:bg-[hsla(250,70%,60%,0.08)]',
                'border border-transparent hover:border-[hsla(250,70%,60%,0.12)]',
              )}
            >
              <RoleIcon name={paragraph.roleIcon} className="h-3 w-3 opacity-60" />
              {paragraph.structuralRole}
            </button>

            {/* Connection badges */}
            {outgoing.length > 0 && (
              <div className="flex items-center gap-1">
                {outgoing.map((conn) => (
                  <ConnectionBadge
                    key={conn.id}
                    targetParagraph={conn.toParagraph}
                    label={conn.label}
                    strength={conn.strength}
                  />
                ))}
              </div>
            )}

            {/* Island warning */}
            {isIsland && (
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-medium
                           border border-[hsla(35,85%,60%,0.2)] bg-[hsla(35,85%,60%,0.06)]
                           text-[hsl(35,75%,40%)]"
              >
                <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2.5} />
                Island
              </span>
            )}
          </div>

          {/* Effectiveness mini-bar */}
          <div className="relative h-[2px] w-full mb-3 rounded-full overflow-hidden bg-[hsla(235,15%,88%,0.5)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: effWidth }}
              transition={{ type: 'spring', stiffness: 200, damping: 30, delay: 0.3 + paragraph.index * 0.06 }}
              className="absolute top-0 left-0 h-full rounded-full"
              style={{ background: effColor }}
            />
          </div>

          {/* Paragraph text with inline highlights */}
          <p className="text-[15px] leading-[1.8] tracking-[0.01em] text-[hsl(235,20%,15%)]">
            {segments.map((seg, i) => {
              if (!seg.annotation) {
                return <span key={i}>{seg.text}</span>;
              }
              return (
                <InsightHighlight
                  key={seg.annotation.id}
                  text={seg.text}
                  annotation={seg.annotation}
                  isSelected={selectedAnnotationId === seg.annotation.id}
                  isHovered={hoveredAnnotationId === seg.annotation.id}
                  onClick={() => onAnnotationClick(seg.annotation!.id)}
                  onMouseEnter={() => onAnnotationHover(seg.annotation!.id)}
                  onMouseLeave={() => onAnnotationHover(null)}
                />
              );
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
