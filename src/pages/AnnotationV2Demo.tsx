/**
 * AnnotationV2Demo — Essay Workshop with writing-first UX.
 *
 * LEFT  — Clean essay editor with multi-type highlights + hover popups
 * RIGHT — Tabbed panel: Chat | Insights | Portrait | Roadmap
 *
 * Highlight types:
 *   feedback   — coaching feedback (severity-colored underlines)
 *   voice      — authentic voice moments (purple shimmer)
 *   connection — links between paragraphs (cyan dotted + arrow)
 *   craft      — writing techniques (indigo dashed)
 *   thematic   — theme appearances (teal background)
 */

import * as React from 'react';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Pencil, Sparkles, User, Eye, Compass, Mic, BookOpen, Heart, Map,
  GraduationCap, Shield, ChevronDown, ChevronRight, Gem, Wrench, Zap,
  Send, History, Lightbulb, MessageSquare, UserCircle, Target,
  ArrowRight, Link2, Palette, Layers, Volume2, AlertTriangle, AlertCircle,
  Star, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MOCK_ESSAY_DATA,
  type MockAnnotation,
  type MockEssayData,
  type HighlightType,
  type RightTab,
} from '@/components/annotation-v2/mockData';
import '@/components/annotation-v2/workshop.css';

// ═══════════════════════════════════════════
// Highlight Type Visual Config
// ═══════════════════════════════════════════

interface HighlightStyle {
  label: string;
  icon: React.ReactNode;
  /** CSS for the inline span border-bottom */
  borderStyle: (isHovered: boolean) => string;
  /** CSS background on hover */
  hoverBg: string;
  /** Popup accent color */
  accentColor: string;
  /** Popup accent bg */
  accentBg: string;
  /** Tab label in popup */
  actionLabel: string;
}

const SEVERITY_ICONS: Record<string, React.ReactNode> = {
  critical: <AlertTriangle className="w-3 h-3" />,
  important: <AlertCircle className="w-3 h-3" />,
  suggestion: <Info className="w-3 h-3" />,
  strength: <Star className="w-3 h-3" />,
};

const HIGHLIGHT_STYLES: Record<HighlightType, HighlightStyle> = {
  feedback: {
    label: 'Coaching Feedback',
    icon: <MessageSquare className="w-3 h-3" />,
    borderStyle: (h) => h ? '2px solid hsl(250, 70%, 60%)' : '2px solid hsla(250, 70%, 60%, 0.35)',
    hoverBg: 'hsla(250, 70%, 60%, 0.06)',
    accentColor: 'hsl(250, 70%, 50%)',
    accentBg: 'hsla(250, 70%, 60%, 0.08)',
    actionLabel: 'Discuss',
  },
  voice: {
    label: 'Authentic Voice',
    icon: <Volume2 className="w-3 h-3" />,
    borderStyle: (h) => h ? '2px solid hsl(280, 65%, 60%)' : '2px solid hsla(280, 65%, 60%, 0.3)',
    hoverBg: 'hsla(280, 65%, 60%, 0.06)',
    accentColor: 'hsl(280, 65%, 50%)',
    accentBg: 'hsla(280, 65%, 60%, 0.08)',
    actionLabel: 'See in Portrait',
  },
  connection: {
    label: 'Connection',
    icon: <Link2 className="w-3 h-3" />,
    borderStyle: (h) => h ? '2px dotted hsl(185, 80%, 42%)' : '2px dotted hsla(185, 80%, 42%, 0.35)',
    hoverBg: 'hsla(185, 80%, 50%, 0.06)',
    accentColor: 'hsl(185, 80%, 38%)',
    accentBg: 'hsla(185, 80%, 50%, 0.08)',
    actionLabel: 'View Connection',
  },
  craft: {
    label: 'Writing Craft',
    icon: <Palette className="w-3 h-3" />,
    borderStyle: (h) => h ? '2px dashed hsl(230, 60%, 55%)' : '2px dashed hsla(230, 60%, 55%, 0.3)',
    hoverBg: 'hsla(230, 60%, 55%, 0.05)',
    accentColor: 'hsl(230, 60%, 45%)',
    accentBg: 'hsla(230, 60%, 55%, 0.08)',
    actionLabel: 'See in Portrait',
  },
  thematic: {
    label: 'Thematic Thread',
    icon: <Layers className="w-3 h-3" />,
    borderStyle: (h) => h ? '2px solid hsl(170, 60%, 42%)' : '2px solid hsla(170, 60%, 42%, 0.25)',
    hoverBg: 'hsla(170, 60%, 50%, 0.06)',
    accentColor: 'hsl(170, 60%, 35%)',
    accentBg: 'hsla(170, 60%, 50%, 0.08)',
    actionLabel: 'See in Portrait',
  },
};

// Override feedback border with severity-specific colors
function getFeedbackBorder(severity: string, isHovered: boolean): string {
  const colors: Record<string, [string, string]> = {
    critical: ['hsl(350, 75%, 60%)', 'hsla(350, 75%, 60%, 0.4)'],
    important: ['hsl(35, 85%, 55%)', 'hsla(35, 85%, 55%, 0.35)'],
    suggestion: ['hsl(220, 70%, 60%)', 'hsla(220, 70%, 60%, 0.3)'],
    strength: ['hsl(160, 70%, 45%)', 'hsla(160, 70%, 45%, 0.3)'],
  };
  const [solid, faded] = colors[severity] ?? colors.suggestion;
  const style = severity === 'suggestion' ? 'dotted' : severity === 'critical' ? 'wavy' : 'solid';
  return `2px ${style} ${isHovered ? solid : faded}`;
}

function getFeedbackHoverBg(severity: string): string {
  const bgs: Record<string, string> = {
    critical: 'hsla(350, 75%, 60%, 0.06)',
    important: 'hsla(35, 85%, 55%, 0.06)',
    suggestion: 'hsla(220, 70%, 60%, 0.05)',
    strength: 'hsla(160, 70%, 45%, 0.06)',
  };
  return bgs[severity] ?? bgs.suggestion;
}

// ═══════════════════════════════════════════
// Toolbar
// ═══════════════════════════════════════════

const PHASE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  foundation: { bg: 'hsla(35, 85%, 60%, 0.12)', text: 'hsl(35, 85%, 38%)', dot: 'hsl(35, 85%, 60%)' },
  architecture: { bg: 'hsla(220, 70%, 65%, 0.12)', text: 'hsl(220, 70%, 42%)', dot: 'hsl(220, 70%, 65%)' },
  craft: { bg: 'hsla(250, 70%, 60%, 0.12)', text: 'hsl(250, 70%, 42%)', dot: 'hsl(250, 70%, 60%)' },
  polish: { bg: 'hsla(160, 70%, 55%, 0.12)', text: 'hsl(160, 70%, 32%)', dot: 'hsl(160, 70%, 55%)' },
  distinction: { bg: 'hsla(350, 75%, 65%, 0.12)', text: 'hsl(350, 75%, 42%)', dot: 'hsl(350, 75%, 65%)' },
};

function Toolbar({ wordCount, data }: { wordCount: number; data: MockEssayData }) {
  const pc = PHASE_COLORS[data.phase.level] ?? PHASE_COLORS.craft;
  return (
    <div className="flex items-center justify-between px-5 py-2 border-b border-slate-200/60 bg-white/80 backdrop-blur-2xl z-20 relative">
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-sm">
            <span className="text-white text-[10px] font-bold">U</span>
          </div>
          <span className="text-sm font-semibold text-slate-800">Essay Workshop</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <span className="text-xs text-slate-500 tabular-nums">{wordCount} words</span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: pc.bg, color: pc.text }} title={data.phase.reasoning}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: pc.dot, animation: 'phase-pulse 3s ease-in-out infinite' }} />
          {data.phase.level}
        </div>
      </div>
      <span className="text-xs text-slate-500">
        EQI <span className="font-bold tabular-nums px-1.5 py-0.5 rounded"
          style={{ background: data.eqi >= 80 ? 'hsla(160,70%,55%,0.1)' : 'hsla(35,85%,60%,0.1)', color: data.eqi >= 80 ? 'hsl(160,70%,32%)' : 'hsl(35,85%,38%)' }}>
          {data.eqi}
        </span>
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════
// Hover Popup Card — the navigation hub
// ═══════════════════════════════════════════

function HoverPopup({
  annotation,
  position,
  paragraphs,
  leftPanelRect,
  onNavigate,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: {
  annotation: MockAnnotation;
  position: { top: number; left: number; width: number };
  paragraphs: MockEssayData['paragraphs'];
  leftPanelRect: { top: number; left: number; width: number; height: number };
  onNavigate: (tab: RightTab, annotationId: string) => void;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const hs = HIGHLIGHT_STYLES[annotation.highlightType];
  const para = paragraphs.find((p) => p.index === annotation.paragraphIndex);
  const quotedText = para ? para.text.slice(annotation.startOffset, Math.min(annotation.endOffset, para.text.length)) : '';

  const modeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
    awareness: { icon: <Eye className="w-3 h-3" />, label: 'Understanding what\'s happening' },
    consequence: { icon: <AlertTriangle className="w-3 h-3" />, label: 'Why this matters to the reader' },
    connection: { icon: <Link2 className="w-3 h-3" />, label: 'How this connects to other parts' },
    action: { icon: <ArrowRight className="w-3 h-3" />, label: 'A concrete next step' },
  };
  const mode = modeConfig[annotation.teachingMode] ?? modeConfig.awareness;

  const popupWidth = 460;
  const centeredLeft = position.left + position.width / 2 - popupWidth / 2;
  const clampedLeft = Math.max(24, Math.min(centeredLeft, leftPanelRect.width - popupWidth + leftPanelRect.left - 8));

  return (
    <>
      {/* Backdrop blur — ONLY the left panel essay area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="fixed z-40 pointer-events-auto"
        style={{
          top: leftPanelRect.top,
          left: leftPanelRect.left,
          width: leftPanelRect.width,
          height: leftPanelRect.height,
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          background: 'rgba(255,255,255,0.2)',
        }}
        onClick={onClose}
      />

      {/* Popup card — clean hierarchy with breathing room */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="fixed z-50 pointer-events-auto"
        style={{
          top: position.top - 16,
          left: clampedLeft,
          transform: 'translateY(-100%)',
          width: popupWidth,
        }}
      >
        <div
          className="rounded-2xl bg-white border border-slate-200/70 overflow-hidden"
          style={{ boxShadow: `0 25px 50px -12px ${hs.accentColor}15, 0 0 0 1px ${hs.accentColor}08, 0 10px 25px -5px rgba(0,0,0,0.08)` }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >

          {/* ═══ TIER 1: Type + Context — small, muted, orients the reader ═══ */}
          <div className="flex items-center justify-between px-6 pt-5 pb-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: hs.accentBg }}>
                <span style={{ color: hs.accentColor }}>{hs.icon}</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: hs.accentColor }}>
                {hs.label}
              </span>
              {annotation.highlightType === 'feedback' && (
                <span className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full border"
                  style={{ borderColor: `${hs.accentColor}25`, color: hs.accentColor, background: hs.accentBg }}>
                  {annotation.severity}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              P{annotation.paragraphIndex + 1}{para ? ` · ${para.structuralRole}` : ''}
            </span>
          </div>

          {/* ═══ TIER 2: Title — the hook, largest text, draws the eye ═══ */}
          <div className="px-6 pt-2 pb-4">
            <h3 className="text-[17px] font-semibold text-slate-900 leading-snug tracking-[-0.01em]">
              {annotation.title}
            </h3>
          </div>

          {/* ═══ TIER 3: Quoted text — grounds in the essay, italic for distinction ═══ */}
          {quotedText && (
            <div className="mx-6 mb-4 pl-4 py-3 border-l-[3px] rounded-r-lg bg-slate-50/60"
              style={{ borderLeftColor: `${hs.accentColor}70` }}>
              <p className="text-[13px] text-slate-500 italic leading-relaxed pr-4">
                &ldquo;{quotedText.length > 140 ? quotedText.slice(0, 140) + '...' : quotedText}&rdquo;
              </p>
            </div>
          )}

          {/* ═══ TIER 4: Insight — the substance, comfortable reading width ═══ */}
          <div className="px-6 pb-4">
            <p className="text-[14px] text-slate-700 leading-[1.75]">{annotation.insight}</p>
          </div>

          {/* ═══ TIER 5: Connection / Teaching mode — contextual metadata ═══ */}
          <div className="px-6 pb-4 flex flex-wrap items-center gap-3">
            {annotation.connectionLabel && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium"
                style={{ background: hs.accentBg, color: hs.accentColor }}>
                <Link2 className="w-3 h-3" />
                {annotation.connectionLabel}
                {annotation.connectedParagraph !== undefined && (
                  <span className="opacity-60">→ P{annotation.connectedParagraph + 1}</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              {mode.icon}
              <span>{mode.label}</span>
            </div>
          </div>

          {/* ═══ TIER 6: Actions — clear separation, prominent buttons ═══ */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/40">
            <button
              onClick={() => onNavigate(annotation.navigateTo, annotation.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:shadow-md active:scale-[0.98]"
              style={{ background: hs.accentBg, color: hs.accentColor, border: `1px solid ${hs.accentColor}20` }}
            >
              {hs.icon}
              {hs.actionLabel}
              <ArrowRight className="w-3 h-3 opacity-40" />
            </button>
            <button
              onClick={() => onNavigate('chat', annotation.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:shadow-md active:scale-[0.98] ml-auto bg-gradient-to-r from-purple-500 to-purple-600 text-white"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Ask Coach
            </button>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex mt-[-1px]"
          style={{ paddingLeft: Math.min(Math.max(position.left - clampedLeft + position.width / 2 - 8, 24), popupWidth - 48) }}>
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white" />
        </div>
      </motion.div>
    </>
  );
}

// ═══════════════════════════════════════════
// LEFT: Essay Editor with Multi-Type Highlights
// ═══════════════════════════════════════════

function EssayEditor({
  data,
  hoveredId,
  warmingId,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  data: MockEssayData;
  hoveredId: string | null;
  warmingId: string | null;
  onMouseEnter: (ann: MockAnnotation, e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick: (ann: MockAnnotation, e: React.MouseEvent) => void;
}) {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center gap-2 px-6 py-2 border-b border-slate-100 bg-slate-50/50">
        <Pencil className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-500 font-medium">Personal Statement Draft</span>
        <div className="flex-1" />
        <span className="text-[10px] text-slate-400">Auto-saved</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-[640px] mx-auto px-8 py-8">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h1 className="text-xl font-semibold text-slate-800 outline-none" contentEditable suppressContentEditableWarning>
              The Architecture of Understanding
            </h1>
            <p className="text-[11px] text-slate-400 mt-1.5">Common Application · 650 word limit</p>
          </div>

          <div className="space-y-5">
            {data.paragraphs.map((para) => {
              const paraAnns = data.annotations.filter((a) => a.paragraphIndex === para.index);
              return (
                <AnnotatedParagraph
                  key={para.index}
                  text={para.text}
                  annotations={paraAnns}
                  hoveredId={hoveredId}
                  warmingId={warmingId}
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                  onClick={onClick}
                />
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function AnnotatedParagraph({
  text,
  annotations,
  hoveredId,
  warmingId,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  text: string;
  annotations: MockAnnotation[];
  hoveredId: string | null;
  warmingId: string | null;
  onMouseEnter: (ann: MockAnnotation, e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick: (ann: MockAnnotation, e: React.MouseEvent) => void;
}) {
  const segments = useMemo(() => {
    if (annotations.length === 0) return [{ text, annotation: null as MockAnnotation | null }];
    const sorted = [...annotations].sort((a, b) => a.startOffset - b.startOffset);
    const result: Array<{ text: string; annotation: MockAnnotation | null }> = [];
    let cursor = 0;
    for (const ann of sorted) {
      const start = Math.max(ann.startOffset, cursor);
      const end = Math.min(ann.endOffset, text.length);
      if (start > cursor) result.push({ text: text.slice(cursor, start), annotation: null });
      if (end > start) result.push({ text: text.slice(start, end), annotation: ann });
      cursor = end;
    }
    if (cursor < text.length) result.push({ text: text.slice(cursor), annotation: null });
    return result;
  }, [text, annotations]);

  return (
    <p className="text-[15px] leading-[1.85] text-slate-700 selection:bg-purple-100/80">
      {segments.map((seg, i) => {
        if (!seg.annotation) return <React.Fragment key={i}>{seg.text}</React.Fragment>;
        const ann = seg.annotation;
        const hs = HIGHLIGHT_STYLES[ann.highlightType];
        const isHovered = hoveredId === ann.id;
        const isWarming = warmingId === ann.id;
        const isDeferred = ann.isDeferred;

        // Border: full intensity when hovered/popup open, default is subtle
        const borderBottom = ann.highlightType === 'feedback'
          ? getFeedbackBorder(ann.severity, isHovered)
          : hs.borderStyle(isHovered);

        const hoverBg = ann.highlightType === 'feedback'
          ? getFeedbackHoverBg(ann.severity)
          : hs.hoverBg;

        // Warming state: gradually increase background opacity over 800ms
        // CSS transition handles the smooth ramp-up
        let bgColor = 'transparent';
        if (isDeferred) {
          bgColor = 'transparent';
        } else if (isHovered && !isWarming) {
          // Popup is open — full highlight
          bgColor = hoverBg;
        } else if (isWarming) {
          // Actively warming — CSS transition will animate TO this
          bgColor = hoverBg;
        }

        return (
          <span
            key={i}
            role="button"
            tabIndex={0}
            onClick={(e) => { e.preventDefault(); onClick(ann, e); }}
            onMouseEnter={(e) => onMouseEnter(ann, e)}
            onMouseLeave={onMouseLeave}
            className={cn(
              'cursor-pointer rounded-sm relative',
              isDeferred && 'opacity-30',
            )}
            style={{
              // Warming uses a slow 700ms ease-in for the satisfying glow-up
              // Normal hover/unhover uses a quick 150ms transition
              transition: isWarming
                ? 'background-color 700ms ease-in, border-color 700ms ease-in'
                : 'background-color 150ms ease-out, border-color 150ms ease-out',
              backgroundColor: bgColor,
              borderBottom: isDeferred ? '1px dashed hsla(0,0%,60%,0.25)' : borderBottom,
              paddingBottom: '1px',
            }}
          >
            {seg.text}
          </span>
        );
      })}
    </p>
  );
}

// ═══════════════════════════════════════════
// RIGHT: Tabbed Panel
// ═══════════════════════════════════════════

function RightTabBar({ active, onChange }: { active: RightTab; onChange: (t: RightTab) => void }) {
  const tabs: Array<{ id: RightTab; label: string; icon: React.ReactNode }> = [
    { id: 'chat', label: 'Coach', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'insights', label: 'Insights', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'portrait', label: 'Portrait', icon: <UserCircle className="w-3.5 h-3.5" /> },
    { id: 'roadmap', label: 'Roadmap', icon: <Target className="w-3.5 h-3.5" /> },
  ];
  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-white/40 bg-white/30 backdrop-blur-sm">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
            active === t.id ? 'bg-white/80 shadow-sm text-slate-800 border border-white/80' : 'text-slate-500 hover:text-slate-700 hover:bg-white/40')}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

// ── Chat Tab ──
const MOCK_CHAT = [
  { id: '1', role: 'assistant' as const, content: "I've read your essay closely. The structural insight — from translator of language to translator of systems — is genuinely powerful. Your essay scores well on voice and specificity, but there are craft-level opportunities that could make this unforgettable." },
  { id: '2', role: 'user' as const, content: 'What should I focus on first?' },
  { id: '3', role: 'assistant' as const, content: "Paragraph 4's thesis — \"understanding isn't just linguistic, it's structural\" — currently tells the reader what to think. But your entire essay has been showing this. Trust your scenes. Try rewriting that line as a moment: what were you doing when you first realized the system was structural?" },
  { id: '4', role: 'user' as const, content: "I think it was when I realized the insurance forms didn't have a box for 'single parent who works nights.'" },
  { id: '5', role: 'assistant' as const, content: "That's it. That specific absence — no box for your family's reality — is more powerful than any thesis statement. Put that moment in paragraph 4 and let the reader arrive at the structural insight themselves. The missing checkbox IS the structural argument." },
];

function ChatTab() {
  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#f8faff]">
        <motion.div animate={{ y: [0, -15, 0], opacity: [0.2, 0.35, 0.2] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[10%] left-[5%] w-[300px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(192,132,252,0.1) 0%, transparent 60%)', filter: 'blur(35px)' }} />
        <motion.div animate={{ y: [0, 18, 0], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 60%)', filter: 'blur(35px)' }} />
      </div>
      <ScrollArea className="flex-1 z-10 relative">
        <div className="px-4 py-4 space-y-3 pb-4">
          {MOCK_CHAT.map((msg, i) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.35 }}
              className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
                msg.role === 'assistant' ? 'bg-gradient-to-br from-cyan-100 to-purple-100 border border-white shadow-sm'
                : 'bg-gradient-to-br from-purple-100 to-pink-100 border border-white shadow-sm')}>
                {msg.role === 'assistant' ? <Sparkles className="w-3 h-3 text-cyan-600" /> : <User className="w-3 h-3 text-purple-600" />}
              </div>
              <div className={cn('rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed max-w-[82%]',
                msg.role === 'assistant' ? 'bg-white/80 backdrop-blur-sm border border-white/70 text-slate-700 shadow-sm'
                : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md')}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
      <div className="relative z-20 px-3 pb-3 pt-1 bg-gradient-to-t from-white/80 to-transparent">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-cyan-400/10 rounded-xl blur-sm opacity-60 group-hover:opacity-100 transition duration-500" />
          <div className="relative flex items-center gap-1 p-1 bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm rounded-full">
            <input type="text" placeholder="Ask about your essay..."
              className="flex-1 min-h-[30px] px-3 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-purple-400/40 font-medium" />
            <button className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.25)] hover:scale-105 transition-transform">
              <Send className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Insights Tab ──
function InsightsTab({ data, onNavigate }: { data: MockEssayData; onNavigate: (tab: RightTab, id: string) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const active = data.annotations.filter((a) => !a.isDeferred);

  return (
    <ScrollArea className="h-full">
      <div className="px-4 py-5 space-y-5">
        <div className="rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/60 p-4">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 mb-1">Key Insight</h3>
              <p className="text-[13px] text-slate-700 leading-relaxed">{data.roadmap.transformativeInsight}</p>
            </div>
          </div>
        </div>

        {/* Group by highlight type */}
        {(['feedback', 'voice', 'connection', 'craft', 'thematic'] as HighlightType[]).map((type) => {
          const anns = active.filter((a) => a.highlightType === type);
          if (anns.length === 0) return null;
          const hs = HIGHLIGHT_STYLES[type];
          return (
            <div key={type}>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                style={{ color: hs.accentColor }}>
                {hs.icon} {hs.label} · {anns.length}
              </h3>
              <div className="space-y-1.5">
                {anns.map((ann) => {
                  const isExp = expandedId === ann.id;
                  return (
                    <div key={ann.id} className="rounded-lg border border-slate-100 bg-white/80 hover:bg-white transition-all overflow-hidden">
                      <button onClick={() => setExpandedId(isExp ? null : ann.id)} className="w-full text-left flex items-start gap-2.5 p-3">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: hs.accentColor }} />
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] text-slate-400">P{ann.paragraphIndex + 1}</span>
                          <p className="text-[13px] text-slate-700 leading-snug">{ann.title}</p>
                        </div>
                        {isExp ? <ChevronDown className="w-3 h-3 text-slate-400 mt-1.5" /> : <ChevronRight className="w-3 h-3 text-slate-400 mt-1.5" />}
                      </button>
                      <AnimatePresence>
                        {isExp && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                            <div className="px-3 pb-3 ml-4 border-t border-slate-50 pt-2">
                              <p className="text-xs text-slate-600 leading-relaxed">{ann.insight}</p>
                              <button onClick={(e) => { e.stopPropagation(); onNavigate('chat', ann.id); }}
                                className="mt-2 text-[11px] text-purple-600 hover:text-purple-700 inline-flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Ask coach
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ── Portrait Tab ──
function PortraitSection({ icon, label, children, accent = 'purple' }: { icon: React.ReactNode; label: string; children: React.ReactNode; accent?: string }) {
  const c: Record<string, [string, string]> = { purple: ['text-purple-600', 'bg-purple-50'], cyan: ['text-cyan-600', 'bg-cyan-50'], amber: ['text-amber-600', 'bg-amber-50'], rose: ['text-rose-600', 'bg-rose-50'], emerald: ['text-emerald-600', 'bg-emerald-50'] };
  const [tc, bg] = c[accent] ?? c.purple;
  return (
    <div className="rounded-lg border border-slate-100 bg-white/70 p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', bg)}><span className={tc}>{icon}</span></div>
        <h4 className={cn('text-[10px] font-semibold uppercase tracking-wider', tc)}>{label}</h4>
      </div>
      <div className="text-[13px] text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}

function PortraitTab({ data }: { data: MockEssayData }) {
  const [showDeeper, setShowDeeper] = useState(false);
  const p = data.portrait;
  return (
    <ScrollArea className="h-full">
      <div className="px-4 py-5 space-y-3">
        <div className="rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/60 p-4">
          <div className="flex items-start gap-2.5">
            <Compass className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 mb-1.5">Central Tension</h3>
              <p className="text-[14px] text-slate-800 italic leading-relaxed">{p.centralTension}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border-l-2 border-cyan-300 bg-white/60 px-4 py-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-cyan-600 mb-1.5 flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> The System's Reading
          </h4>
          {p.essayUnderstandingProse.split('\n\n').map((para, i) => (
            <p key={i} className="text-[13px] text-slate-700 leading-relaxed mb-2.5 last:mb-0">{para}</p>
          ))}
        </div>
        <PortraitSection icon={<Mic className="w-3 h-3" />} label="Voice" accent="purple">{p.voiceSignature}</PortraitSection>
        <PortraitSection icon={<User className="w-3 h-3" />} label="Writer" accent="cyan">{p.writerPortrait}</PortraitSection>
        <PortraitSection icon={<Map className="w-3 h-3" />} label="Strategy" accent="amber">
          <p>{p.narrativeStrategy}</p>
          <span className="inline-block mt-1.5 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">{p.arcType}</span>
        </PortraitSection>
        <PortraitSection icon={<Heart className="w-3 h-3" />} label="Emotional Arc" accent="rose">{p.emotionalArc}</PortraitSection>
        <button onClick={() => setShowDeeper(!showDeeper)} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors">
          {showDeeper ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />} Deeper Intelligence
        </button>
        <AnimatePresence>
          {showDeeper && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden space-y-3">
              <PortraitSection icon={<GraduationCap className="w-3 h-3" />} label="Memorability" accent="emerald">{p.memorability}</PortraitSection>
              <div className="rounded-lg border border-slate-100 bg-white/70 p-3.5">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 mb-2">Distinctiveness</h4>
                <div className="flex flex-wrap gap-1">{p.distinctivenessFactors.map((f, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100/60">{f}</span>
                ))}</div>
              </div>
              {p.archetype && (
                <div className="rounded-lg border border-amber-100 bg-amber-50/30 p-3.5">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-1">{p.archetype.name}</h4>
                  <p className="text-[11px] text-slate-600">{p.archetype.poolDensity}</p>
                  <p className="text-[11px] text-slate-700 mt-1 font-medium">{p.archetype.differentiator}</p>
                </div>
              )}
              <div className="rounded-lg border border-slate-100 bg-white/70 p-3.5">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Thematic Threads</h4>
                {p.thematicThreads.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-[13px] mb-1 last:mb-0">
                    <span className={cn('w-1.5 h-1.5 rounded-full', t.strength === 'dominant' ? 'bg-emerald-500' : t.strength === 'supporting' ? 'bg-blue-400' : 'bg-slate-300')} />
                    <span className="text-slate-700">{t.theme}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}

// ── Roadmap Tab ──
function RoadmapTab({ data }: { data: MockEssayData }) {
  return (
    <ScrollArea className="h-full">
      <div className="px-4 py-5 space-y-4">
        <div className="rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/60 p-4">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 mb-1">Core Direction</h3>
              <p className="text-[13px] text-slate-700 leading-relaxed">{data.roadmap.transformativeInsight}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {data.roadmap.priorities.map((p, i) => {
            const Icon = p.impact === 'transformative' ? Gem : p.impact === 'significant' ? Wrench : Zap;
            const ic = p.impact === 'transformative' ? 'text-purple-600' : p.impact === 'significant' ? 'text-amber-600' : 'text-blue-500';
            return (
              <div key={i} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-white/70 p-3">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-slate-500">{p.rank}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-slate-700 leading-snug">{p.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Icon className={cn('w-3 h-3', ic)} />
                    <span className={cn('text-[9px] font-medium uppercase tracking-wider', ic)}>{p.impact}</span>
                    {p.targetParagraphs.map((pi) => (
                      <span key={pi} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">P{pi + 1}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-500" /> Protected Strengths
          </h3>
          {data.roadmap.protectedStrengths.map((s, i) => (
            <div key={i} className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-3 mb-1.5">
              <p className="text-[13px] text-slate-700">{s.description}</p>
              <p className="text-[9px] text-emerald-600 mt-0.5">{s.location}</p>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ═══════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════

export default function AnnotationV2Demo() {
  const data = MOCK_ESSAY_DATA;
  const [rightTab, setRightTab] = useState<RightTab>('chat');

  // Popup state — lifted to page level so portal renders outside ResizablePanel
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [popupAnn, setPopupAnn] = useState<MockAnnotation | null>(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0, width: 0 });
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const wordCount = useMemo(() => data.essayText.trim().split(/\s+/).filter(Boolean).length, [data.essayText]);

  const handleNavigate = useCallback((tab: RightTab, _annotationId: string) => {
    setRightTab(tab);
    setPopupAnn(null);
    setHoveredId(null);
  }, []);

  // Dwell-based hover: highlight gradually warms up, popup appears after ~800ms.
  // "warming" = hovering but popup not yet shown (highlight intensifies via CSS).
  // Once popup is open, it stays as long as mouse is over highlight OR popup.
  const [warmingId, setWarmingId] = useState<string | null>(null); // which highlight is warming up
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOverPopup = useRef(false);
  const isOverHighlight = useRef(false);

  const clearAllTimers = useCallback(() => {
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      if (!isOverPopup.current && !isOverHighlight.current) {
        setPopupAnn(null);
        setHoveredId(null);
        setWarmingId(null);
      }
    }, 300);
  }, []);

  const handleMouseEnter = useCallback((ann: MockAnnotation, e: React.MouseEvent) => {
    isOverHighlight.current = true;
    if (closeTimer.current) clearTimeout(closeTimer.current);

    // If popup is already open for this annotation, just keep it
    if (popupAnn?.id === ann.id) return;

    // Start warming — highlight begins to glow
    setHoveredId(ann.id);
    setWarmingId(ann.id);

    // After dwell, show the popup
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    const el = e.currentTarget as HTMLElement;
    dwellTimer.current = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setPopupPos({ top: rect.top, left: rect.left, width: rect.width });
      setPopupAnn(ann);
      setWarmingId(null); // no longer warming, now fully open
    }, 800);
  }, [popupAnn]);

  const handleClick = useCallback((ann: MockAnnotation, e: React.MouseEvent) => {
    e.preventDefault();
    // Click skips the dwell — opens immediately
    clearAllTimers();
    isOverHighlight.current = true;
    setWarmingId(null);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopupPos({ top: rect.top, left: rect.left, width: rect.width });
    setPopupAnn(ann);
    setHoveredId(ann.id);
  }, [clearAllTimers]);

  const handleMouseLeave = useCallback(() => {
    isOverHighlight.current = false;
    // Cancel any in-progress dwell
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    setWarmingId(null);
    // If popup is open, give grace period to reach it
    if (popupAnn) {
      scheduleClose();
    } else {
      setHoveredId(null);
    }
  }, [popupAnn, scheduleClose]);

  const handlePopupMouseEnter = useCallback(() => {
    isOverPopup.current = true;
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const handlePopupMouseLeave = useCallback(() => {
    isOverPopup.current = false;
    scheduleClose();
  }, [scheduleClose]);

  const handlePopupClose = useCallback(() => {
    clearAllTimers();
    isOverPopup.current = false;
    isOverHighlight.current = false;
    setPopupAnn(null);
    setHoveredId(null);
    setWarmingId(null);
  }, [clearAllTimers]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white">
      <Toolbar wordCount={wordCount} data={data} />
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={55} minSize={35}>
            <div ref={leftPanelRef} className="h-full">
            <EssayEditor
              data={data}
              hoveredId={hoveredId}
              warmingId={warmingId}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
            />
          </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-slate-100 hover:bg-purple-100/50 transition-colors" />
          <ResizablePanel defaultSize={45} minSize={28}>
            <div className="h-full flex flex-col bg-[#f9f8fd]">
              <RightTabBar active={rightTab} onChange={setRightTab} />
              <div className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                  {rightTab === 'chat' && <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full"><ChatTab /></motion.div>}
                  {rightTab === 'insights' && <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full"><InsightsTab data={data} onNavigate={handleNavigate} /></motion.div>}
                  {rightTab === 'portrait' && <motion.div key="portrait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full"><PortraitTab data={data} /></motion.div>}
                  {rightTab === 'roadmap' && <motion.div key="roadmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full"><RoadmapTab data={data} /></motion.div>}
                </AnimatePresence>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Popup rendered via portal at document body — escapes all overflow:hidden ancestors */}
      {createPortal(
        <AnimatePresence>
          {popupAnn && (
            <HoverPopup
              key={popupAnn.id}
              annotation={popupAnn}
              position={popupPos}
              paragraphs={data.paragraphs}
              leftPanelRect={
                leftPanelRef.current
                  ? leftPanelRef.current.getBoundingClientRect()
                  : { top: 0, left: 0, width: window.innerWidth * 0.55, height: window.innerHeight }
              }
              onNavigate={handleNavigate}
              onClose={handlePopupClose}
              onMouseEnter={handlePopupMouseEnter}
              onMouseLeave={handlePopupMouseLeave}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
