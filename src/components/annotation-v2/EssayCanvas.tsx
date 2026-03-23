import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MockParagraph, MockAnnotation, MockConnection } from './mockData';
import { ParagraphBlock } from './ParagraphBlock';
import './workshop.css';

// ═══════════════════════════════════════════
// Connection Indicator Between Paragraphs
// ═══════════════════════════════════════════

interface ConnectionIndicatorProps {
  connections: MockConnection[];
  fromIndex: number;
  toIndex: number;
}

/**
 * Renders a thin vertical line with animated dot between two consecutive paragraphs
 * when they share a direct connection.
 */
function ConnectionIndicator({ connections, fromIndex, toIndex }: ConnectionIndicatorProps) {
  // Find connections that link these two adjacent paragraphs
  const direct = connections.filter(
    (c) =>
      (c.fromParagraph === fromIndex && c.toParagraph === toIndex) ||
      (c.fromParagraph === toIndex && c.toParagraph === fromIndex),
  );

  // Also show a subtle line if either paragraph is a *source* connecting to something farther
  const throughConnections = connections.filter(
    (c) =>
      (c.fromParagraph === fromIndex && c.toParagraph > toIndex) ||
      (c.fromParagraph < fromIndex && c.toParagraph === toIndex),
  );

  const hasConnection = direct.length > 0 || throughConnections.length > 0;

  if (!hasConnection) {
    // No connection — just a subtle spacer
    return <div className="h-3" />;
  }

  const maxStrength = Math.max(
    ...direct.map((c) => c.strength),
    ...throughConnections.map((c) => c.strength * 0.5),
  );

  return (
    <div className="relative flex items-center justify-center h-6 my-0.5">
      {/* Vertical line */}
      <div
        className="absolute left-[27px] h-full w-px rounded-full"
        style={{
          background: `hsla(250, 70%, 60%, ${0.08 + maxStrength * 0.12})`,
        }}
      />

      {/* Animated dot for direct connections */}
      {direct.length > 0 && (
        <motion.div
          className="absolute left-[25px] h-1.5 w-1.5 rounded-full"
          style={{
            background: `hsla(250, 70%, 60%, ${0.25 + maxStrength * 0.35})`,
            boxShadow: `0 0 6px hsla(250, 70%, 60%, ${maxStrength * 0.2})`,
          }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Through-connection whisker — thinner, muted */}
      {direct.length === 0 && throughConnections.length > 0 && (
        <div
          className="absolute left-[26px] h-1 w-1 rounded-full"
          style={{
            background: `hsla(250, 70%, 60%, ${0.12 + maxStrength * 0.15})`,
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Atmospheric Floating Orb
// ═══════════════════════════════════════════

interface OrbProps {
  color: string;
  size: number;
  top: string;
  left: string;
  delay: number;
  duration: number;
}

function FloatingOrb({ color, size, top, left, delay, duration }: OrbProps) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none workshop-float-orb"
      style={{
        width: size,
        height: size,
        top,
        left,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }}
      animate={{
        y: [-20, 20, -10, 20, -20],
        x: [0, 15, -10, 5, 0],
        scale: [1, 1.08, 0.95, 1.04, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      aria-hidden="true"
    />
  );
}

// ═══════════════════════════════════════════
// Phase Level Badge
// ═══════════════════════════════════════════

const PHASE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  foundation: {
    label: 'Foundation',
    color: 'hsl(350, 75%, 55%)',
    bg: 'hsla(350, 75%, 65%, 0.08)',
  },
  architecture: {
    label: 'Architecture',
    color: 'hsl(35, 85%, 50%)',
    bg: 'hsla(35, 85%, 60%, 0.08)',
  },
  craft: {
    label: 'Craft',
    color: 'hsl(250, 70%, 55%)',
    bg: 'hsla(250, 70%, 60%, 0.08)',
  },
  polish: {
    label: 'Polish',
    color: 'hsl(185, 80%, 45%)',
    bg: 'hsla(185, 80%, 55%, 0.08)',
  },
  distinction: {
    label: 'Distinction',
    color: 'hsl(160, 70%, 45%)',
    bg: 'hsla(160, 70%, 55%, 0.08)',
  },
};

function PhaseBadge({ phase }: { phase: string }) {
  const config = PHASE_CONFIG[phase] ?? PHASE_CONFIG.foundation;
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
      style={{
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}22`,
      }}
    >
      <motion.span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: config.color }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {config.label} Phase
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export interface EssayCanvasProps {
  paragraphs: MockParagraph[];
  annotations: MockAnnotation[];
  connections: MockConnection[];
  essayText: string;
  selectedAnnotationId: string | null;
  hoveredAnnotationId: string | null;
  phaseLevel: string;
  structuralIslands: number[];
  onAnnotationClick: (id: string) => void;
  onAnnotationHover: (id: string | null) => void;
  onParagraphClick: (index: number) => void;
}

export function EssayCanvas({
  paragraphs,
  annotations,
  connections,
  selectedAnnotationId,
  hoveredAnnotationId,
  phaseLevel,
  structuralIslands,
  onAnnotationClick,
  onAnnotationHover,
  onParagraphClick,
}: EssayCanvasProps) {
  // Group annotations by paragraph index for efficient lookup
  const annotationsByParagraph = React.useMemo(() => {
    const map = new Map<number, MockAnnotation[]>();
    for (const ann of annotations) {
      const existing = map.get(ann.paragraphIndex) ?? [];
      existing.push(ann);
      map.set(ann.paragraphIndex, existing);
    }
    return map;
  }, [annotations]);

  // Connections involving each paragraph
  const connectionsByParagraph = React.useMemo(() => {
    const map = new Map<number, MockConnection[]>();
    for (const conn of connections) {
      for (const idx of [conn.fromParagraph, conn.toParagraph]) {
        const existing = map.get(idx) ?? [];
        existing.push(conn);
        map.set(idx, existing);
      }
    }
    return map;
  }, [connections]);

  return (
    <div className="relative h-full flex flex-col bg-gradient-to-br from-[hsla(250,30%,98%,1)] via-[hsla(220,25%,97%,1)] to-[hsla(185,20%,97%,1)]">
      {/* ── Atmospheric Orbs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <FloatingOrb
          color="hsla(250, 70%, 75%, 0.12)"
          size={280}
          top="8%"
          left="-5%"
          delay={0}
          duration={18}
        />
        <FloatingOrb
          color="hsla(185, 80%, 70%, 0.1)"
          size={220}
          top="55%"
          left="70%"
          delay={2}
          duration={22}
        />
        <FloatingOrb
          color="hsla(250, 60%, 80%, 0.08)"
          size={180}
          top="85%"
          left="15%"
          delay={4}
          duration={20}
        />
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[hsla(235,20%,90%,0.5)]">
        <div className="flex items-center gap-3">
          <h2 className="text-[14px] font-semibold text-[hsl(235,20%,25%)] tracking-tight">
            Essay Canvas
          </h2>
          <span className="text-[11px] text-[hsl(235,15%,55%)] font-medium">
            {paragraphs.length} paragraphs
          </span>
          <span className="text-[11px] text-[hsl(235,15%,60%)]">
            {annotations.filter((a) => !a.isDeferred).length} insights
          </span>
        </div>
        <PhaseBadge phase={phaseLevel} />
      </div>

      {/* ── Scrollable Essay Body ── */}
      <ScrollArea className="relative z-10 flex-1">
        <div className="px-6 py-6 max-w-[720px] mx-auto">
          {paragraphs.map((paragraph, i) => {
            const paraAnnotations = annotationsByParagraph.get(paragraph.index) ?? [];
            const paraConnections = connectionsByParagraph.get(paragraph.index) ?? [];
            const isIsland = structuralIslands.includes(paragraph.index);

            return (
              <React.Fragment key={paragraph.index}>
                <ParagraphBlock
                  paragraph={paragraph}
                  annotations={paraAnnotations}
                  connections={paraConnections}
                  isIsland={isIsland}
                  selectedAnnotationId={selectedAnnotationId}
                  hoveredAnnotationId={hoveredAnnotationId}
                  onAnnotationClick={onAnnotationClick}
                  onAnnotationHover={onAnnotationHover}
                  onParagraphClick={onParagraphClick}
                />

                {/* Connection indicator between paragraphs */}
                {i < paragraphs.length - 1 && (
                  <ConnectionIndicator
                    connections={connections}
                    fromIndex={paragraph.index}
                    toIndex={paragraphs[i + 1].index}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Bottom breathing room */}
          <div className="h-16" />
        </div>
      </ScrollArea>

      {/* ── Bottom ambient glow ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-[5]"
        style={{
          background: 'linear-gradient(to top, hsla(250, 30%, 98%, 0.9), transparent)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
