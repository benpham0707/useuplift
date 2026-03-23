/**
 * InsightPanel — Right panel container for the annotation workshop.
 *
 * A zoom-navigating state machine with premium glassmorphism. Renders
 * the active view (portrait, paragraph, annotation, roadmap, coaching)
 * with smooth slide transitions via framer-motion AnimatePresence.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { MockEssayData, MockAnnotation, MockParagraph } from './mockData';
import { EssayPortrait } from './EssayPortrait';
import { InsightCard } from './InsightCard';
import { RoadmapGuide } from './RoadmapGuide';
import './workshop.css';

// ═══════════════════════════════════════════
// Panel View State Machine
// ═══════════════════════════════════════════

export type PanelView =
  | { type: 'portrait' }
  | { type: 'paragraph'; paragraphIndex: number }
  | { type: 'annotation'; annotationId: string }
  | { type: 'roadmap' }
  | { type: 'coaching'; annotationId?: string };

// ═══════════════════════════════════════════
// View depth for slide direction calculation
// ═══════════════════════════════════════════

function viewDepth(view: PanelView): number {
  switch (view.type) {
    case 'portrait': return 0;
    case 'paragraph': return 1;
    case 'annotation': return 2;
    case 'roadmap': return 1;
    case 'coaching': return 3;
  }
}

// ═══════════════════════════════════════════
// Paragraph Detail (Inline View)
// ═══════════════════════════════════════════

interface ParagraphDetailProps {
  paragraph: MockParagraph;
  annotations: MockAnnotation[];
  onAnnotationClick: (id: string) => void;
}

function ParagraphDetail({ paragraph, annotations }: ParagraphDetailProps) {
  const paraAnnotations = annotations.filter((a) => a.paragraphIndex === paragraph.index);
  const severityCounts = paraAnnotations.reduce(
    (acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      {/* Role + Weight */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.05 }}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(250,60%,50%)] block mb-1">
          Structural Role
        </span>
        <p className="text-[14px] font-semibold text-[hsl(235,20%,20%)]">
          {paragraph.structuralRole}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
              paragraph.structuralWeight === 'load_bearing'
                ? 'bg-[hsla(350,75%,65%,0.1)] text-[hsl(350,65%,48%)] border border-[hsla(350,75%,65%,0.15)]'
                : paragraph.structuralWeight === 'supporting'
                  ? 'bg-[hsla(250,70%,60%,0.08)] text-[hsl(250,55%,48%)] border border-[hsla(250,70%,60%,0.12)]'
                  : paragraph.structuralWeight === 'transitional'
                    ? 'bg-[hsla(220,50%,60%,0.08)] text-[hsl(220,50%,48%)] border border-[hsla(220,50%,60%,0.12)]'
                    : 'bg-[hsla(235,10%,50%,0.06)] text-[hsl(235,10%,50%)] border border-[hsla(235,10%,50%,0.1)]',
            )}
          >
            {paragraph.structuralWeight.replace('_', ' ')}
          </span>
          <span className="text-[11px] text-[hsl(235,10%,45%)]">
            Effectiveness: {paragraph.effectiveness}%
          </span>
        </div>
      </motion.div>

      {/* Annotations summary */}
      {paraAnnotations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.15 }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(235,15%,45%)] block mb-2">
            Annotations ({paraAnnotations.length})
          </span>
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(severityCounts).map(([sev, count]) => (
              <span
                key={sev}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  sev === 'critical' && 'bg-[hsla(350,75%,65%,0.1)] text-[hsl(350,65%,48%)]',
                  sev === 'important' && 'bg-[hsla(35,85%,60%,0.1)] text-[hsl(35,75%,42%)]',
                  sev === 'suggestion' && 'bg-[hsla(220,70%,65%,0.1)] text-[hsl(220,60%,45%)]',
                  sev === 'strength' && 'bg-[hsla(160,70%,55%,0.1)] text-[hsl(160,60%,38%)]',
                )}
              >
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    sev === 'critical' && 'bg-[hsl(350,75%,65%)]',
                    sev === 'important' && 'bg-[hsl(35,85%,60%)]',
                    sev === 'suggestion' && 'bg-[hsl(220,70%,65%)]',
                    sev === 'strength' && 'bg-[hsl(160,70%,55%)]',
                  )}
                />
                {count} {sev}
              </span>
            ))}
          </div>

          {/* Annotation cards list */}
          <div className="space-y-2">
            {paraAnnotations.map((ann) => (
              <div
                key={ann.id}
                className={cn(
                  'rounded-lg border border-white/50 p-3',
                  'bg-white/40 backdrop-blur-sm',
                  'hover:bg-white/60 hover:border-white/70',
                  'transition-all duration-200 cursor-pointer',
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      ann.severity === 'critical' && 'bg-[hsl(350,75%,65%)]',
                      ann.severity === 'important' && 'bg-[hsl(35,85%,60%)]',
                      ann.severity === 'suggestion' && 'bg-[hsl(220,70%,65%)]',
                      ann.severity === 'strength' && 'bg-[hsl(160,70%,55%)]',
                    )}
                  />
                  <span className="text-[11px] font-semibold text-[hsl(235,20%,25%)]">
                    {ann.title}
                  </span>
                  {ann.isDeferred && (
                    <span className="text-[9px] font-medium text-[hsl(235,10%,55%)] ml-auto">
                      deferred
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-[hsl(235,10%,45%)] line-clamp-2">
                  {ann.insight}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Mock Coaching Chat
// ═══════════════════════════════════════════

function CoachingChat({ annotationId }: { annotationId?: string }) {
  const [messages] = React.useState([
    {
      role: 'assistant' as const,
      text: annotationId
        ? `I see you want to discuss annotation ${annotationId}. I'm your writing coach — ask me anything about this insight, and I'll help you understand how to apply it to your essay.`
        : 'Welcome to coaching mode. Ask me anything about your essay — how to improve specific sections, what an admissions officer would notice, or how to deepen your narrative.',
    },
  ]);
  const [input, setInput] = React.useState('');

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 space-y-3">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, delay: i * 0.1 }}
            className={cn(
              'rounded-xl p-3.5',
              msg.role === 'assistant'
                ? 'bg-[hsla(250,70%,60%,0.06)] border border-[hsla(250,70%,60%,0.12)]'
                : 'bg-white/50 border border-white/60 ml-6',
            )}
          >
            {msg.role === 'assistant' && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="h-3 w-3 text-[hsl(250,70%,55%)]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(250,60%,50%)]">
                  Coach
                </span>
              </div>
            )}
            <p className="text-[13px] leading-relaxed text-[hsl(235,20%,20%)]">{msg.text}</p>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="mt-4 pt-3 border-t border-[hsla(235,15%,88%,0.5)]">
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border border-white/60 px-3 py-2',
            'bg-white/50 backdrop-blur-sm',
            'focus-within:border-[hsla(250,70%,60%,0.3)] focus-within:shadow-[0_0_12px_hsla(250,70%,60%,0.08)]',
            'transition-all duration-200',
          )}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach..."
            className={cn(
              'flex-1 bg-transparent border-none outline-none',
              'text-[13px] text-[hsl(235,20%,15%)]',
              'placeholder:text-[hsl(235,10%,60%)]',
            )}
          />
          <button
            type="button"
            className={cn(
              'flex items-center justify-center h-7 w-7 rounded-lg',
              'bg-[hsl(250,70%,60%)] text-white',
              'hover:bg-[hsl(250,70%,55%)]',
              'transition-colors duration-150',
              'disabled:opacity-40',
            )}
            disabled={!input.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Breadcrumb
// ═══════════════════════════════════════════

interface BreadcrumbProps {
  view: PanelView;
  data: MockEssayData;
  onNavigate: (view: PanelView) => void;
}

function Breadcrumb({ view, data, onNavigate }: BreadcrumbProps) {
  const segments: { label: string; view: PanelView }[] = [
    { label: 'Portrait', view: { type: 'portrait' } },
  ];

  if (view.type === 'paragraph' || view.type === 'annotation' || view.type === 'coaching') {
    const pIdx = view.type === 'paragraph'
      ? view.paragraphIndex
      : view.type === 'annotation'
        ? data.annotations.find((a) => a.id === view.annotationId)?.paragraphIndex ?? 0
        : (view.annotationId
            ? data.annotations.find((a) => a.id === view.annotationId)?.paragraphIndex ?? 0
            : -1);

    if (pIdx >= 0) {
      const para = data.paragraphs[pIdx];
      segments.push({
        label: `P${pIdx + 1}: ${para?.structuralRole ?? 'Paragraph'}`,
        view: { type: 'paragraph', paragraphIndex: pIdx },
      });
    }
  }

  if (view.type === 'annotation') {
    segments.push({ label: 'Annotation', view });
  }

  if (view.type === 'roadmap') {
    segments.push({ label: 'Improvement Guide', view });
  }

  if (view.type === 'coaching') {
    segments.push({ label: 'Coach', view });
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const isClickable = !isLast;

        return (
          <React.Fragment key={`${seg.view.type}-${i}`}>
            {i > 0 && (
              <ChevronRight className="h-3 w-3 text-[hsl(235,10%,60%)] shrink-0" />
            )}
            <button
              type="button"
              onClick={isClickable ? () => onNavigate(seg.view) : undefined}
              disabled={!isClickable}
              className={cn(
                'text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors duration-150',
                isLast
                  ? 'text-[hsl(235,20%,25%)] font-semibold cursor-default'
                  : 'text-[hsl(235,10%,50%)] hover:text-[hsl(250,70%,55%)] cursor-pointer',
              )}
            >
              {seg.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

interface InsightPanelProps {
  view: PanelView;
  data: MockEssayData;
  selectedAnnotationId: string | null;
  onBack: () => void;
  onNavigate: (view: PanelView) => void;
  onAnnotationClick: (id: string) => void;
  onParagraphClick: (index: number) => void;
}

export function InsightPanel({
  view,
  data,
  onBack,
  onNavigate,
  onAnnotationClick,
  onParagraphClick,
}: InsightPanelProps) {
  const prevViewRef = React.useRef<PanelView>(view);
  const slideDirection = React.useMemo(() => {
    const prevDepth = viewDepth(prevViewRef.current);
    const currentDepth = viewDepth(view);
    return currentDepth >= prevDepth ? 1 : -1; // 1 = slide left (zoom in), -1 = slide right (zoom out)
  }, [view]);

  React.useEffect(() => {
    prevViewRef.current = view;
  }, [view]);

  const showBackButton = view.type !== 'portrait';

  // Find annotation + paragraph for detail views
  const selectedAnnotation = view.type === 'annotation'
    ? data.annotations.find((a) => a.id === view.annotationId) ?? null
    : null;

  const selectedParagraph = view.type === 'paragraph'
    ? data.paragraphs[view.paragraphIndex] ?? null
    : selectedAnnotation
      ? data.paragraphs[selectedAnnotation.paragraphIndex] ?? null
      : null;

  return (
    <div className="h-full flex flex-col bg-white/40 backdrop-blur-2xl">
      {/* ── Header ── */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3 flex-shrink-0',
          'border-b border-[hsla(235,15%,88%,0.5)]',
          'bg-white/60 backdrop-blur-xl',
        )}
      >
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-7 w-7 p-0 hover:bg-[hsla(250,70%,60%,0.06)]"
          >
            <ArrowLeft className="h-4 w-4 text-[hsl(235,15%,40%)]" />
          </Button>
        )}
        <Breadcrumb view={view} data={data} onNavigate={onNavigate} />
      </div>

      {/* ── Content Area ── */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${view.type}-${'paragraphIndex' in view ? view.paragraphIndex : ''}${'annotationId' in view ? view.annotationId : ''}`}
              initial={{
                opacity: 0,
                x: slideDirection * 40,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: slideDirection * -40,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 35,
              }}
            >
              {/* Portrait */}
              {view.type === 'portrait' && (
                <EssayPortrait
                  data={data}
                  onShowRoadmap={() => onNavigate({ type: 'roadmap' })}
                  onParagraphClick={onParagraphClick}
                />
              )}

              {/* Paragraph Detail */}
              {view.type === 'paragraph' && selectedParagraph && (
                <ParagraphDetail
                  paragraph={selectedParagraph}
                  annotations={data.annotations}
                  onAnnotationClick={onAnnotationClick}
                />
              )}

              {/* Annotation Detail */}
              {view.type === 'annotation' && selectedAnnotation && (
                <InsightCard
                  annotation={selectedAnnotation}
                  paragraphRole={selectedParagraph?.structuralRole}
                  paragraphVerdict={undefined}
                  onAskCoach={() =>
                    onNavigate({ type: 'coaching', annotationId: selectedAnnotation.id })
                  }
                  onBack={onBack}
                />
              )}

              {/* Roadmap */}
              {view.type === 'roadmap' && (
                <RoadmapGuide
                  roadmap={data.roadmap}
                  onAnnotationClick={onAnnotationClick}
                  onParagraphClick={onParagraphClick}
                />
              )}

              {/* Coaching */}
              {view.type === 'coaching' && (
                <CoachingChat annotationId={view.annotationId} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
