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
import { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Pencil, Sparkles, User, Eye, Compass, Mic, BookOpen, Heart, Map as MapIcon,
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
import { ChatPanel } from '@/components/chat/ChatPanel';
import { WorkshopHeader } from '@/components/annotation-v2/WorkshopHeader';
import {
  CommonAppPromptSelector,
  DEFAULT_COLLEGE_ID,
  DEFAULT_ESSAY_NUMBER,
} from '@/components/annotation-v2/CommonAppPromptSelector';
import '@/components/annotation-v2/workshop.css';

// ═══════════════════════════════════════════
// Highlight Type Visual Config
// ═══════════════════════════════════════════

interface HighlightStyle {
  label: string;
  icon: React.ReactNode;
  /** Stroke pattern for the underline — color is driven by severity tier, not type. */
  strokePattern: 'solid' | 'dotted' | 'dashed' | 'double' | 'wavy';
  /** Tab label in popup */
  actionLabel: string;
}

const SEVERITY_ICONS: Record<string, React.ReactNode> = {
  critical: <AlertTriangle className="w-3 h-3" />,
  important: <AlertCircle className="w-3 h-3" />,
  suggestion: <Info className="w-3 h-3" />,
  strength: <Star className="w-3 h-3" />,
};

// ─────────────────────────────────────────────
// Color system: 3 tiers, type drives stroke style only.
//
//   needs-work (red)    — critical + important feedback, blocking issues
//   improve    (yellow) — suggestions, opportunities, neutral observations
//   strength   (green)  — earned wins, authentic voice, things working
//
// `highlightType` no longer carries a hue — it carries a *stroke pattern*.
// Same color + different stroke = different kind of insight on the same span.
// ─────────────────────────────────────────────

type SeverityTier = 'needs-work' | 'improve' | 'strength';

interface TierTokens {
  /** Solid hue used for the gutter pill. */
  solid: string;
  /** Strong border color used for hover/active state. */
  borderStrong: string;
  /** Faded border color used for the resting underline. */
  borderFaded: string;
  /** Subtle background tint for hover. */
  hoverBg: string;
  /** Popup accent text. */
  accentText: string;
  /** Popup accent surface. */
  accentBg: string;
}

const TIER_TOKENS: Record<SeverityTier, TierTokens> = {
  'needs-work': {
    solid:         'hsl(355, 75%, 56%)',
    borderStrong:  'hsl(355, 75%, 56%)',
    borderFaded:   'hsla(355, 75%, 56%, 0.42)',
    hoverBg:       'hsla(355, 75%, 56%, 0.07)',
    accentText:    'hsl(355, 70%, 44%)',
    accentBg:      'hsla(355, 75%, 56%, 0.10)',
  },
  improve: {
    solid:         'hsl(42, 92%, 50%)',
    borderStrong:  'hsl(36, 88%, 48%)',
    borderFaded:   'hsla(42, 92%, 50%, 0.45)',
    hoverBg:       'hsla(42, 92%, 50%, 0.08)',
    accentText:    'hsl(32, 88%, 38%)',
    accentBg:      'hsla(42, 92%, 50%, 0.12)',
  },
  strength: {
    solid:         'hsl(160, 65%, 42%)',
    borderStrong:  'hsl(160, 65%, 42%)',
    borderFaded:   'hsla(160, 65%, 42%, 0.40)',
    hoverBg:       'hsla(160, 65%, 42%, 0.07)',
    accentText:    'hsl(160, 60%, 30%)',
    accentBg:      'hsla(160, 65%, 42%, 0.10)',
  },
};

/** Map raw severity + highlight type → 3-tier severity bucket. */
function getSeverityTier(ann: MockAnnotation): SeverityTier {
  // Voice = celebration of authentic writing → strength.
  if (ann.highlightType === 'voice') return 'strength';
  // Coaching feedback uses its severity field directly.
  if (ann.highlightType === 'feedback') {
    if (ann.severity === 'critical' || ann.severity === 'important') return 'needs-work';
    if (ann.severity === 'strength') return 'strength';
    return 'improve';
  }
  // Connection / craft / thematic = neutral observations / opportunities.
  return 'improve';
}

const HIGHLIGHT_STYLES: Record<HighlightType, HighlightStyle> = {
  feedback: {
    label: 'Coaching Feedback',
    icon: <MessageSquare className="w-3 h-3" />,
    strokePattern: 'solid',
    actionLabel: 'Discuss',
  },
  voice: {
    label: 'Authentic Voice',
    icon: <Volume2 className="w-3 h-3" />,
    strokePattern: 'wavy',
    actionLabel: 'See in Profile',
  },
  connection: {
    label: 'Connection',
    icon: <Link2 className="w-3 h-3" />,
    strokePattern: 'dotted',
    actionLabel: 'View Connection',
  },
  craft: {
    label: 'Writing Craft',
    icon: <Palette className="w-3 h-3" />,
    strokePattern: 'dashed',
    actionLabel: 'See in Profile',
  },
  thematic: {
    label: 'Thematic Thread',
    icon: <Layers className="w-3 h-3" />,
    strokePattern: 'double',
    actionLabel: 'See in Profile',
  },
};

/** Border style for an inline annotated span. Hover deepens color; pattern is type-driven. */
function getAnnotationBorder(ann: MockAnnotation, isHovered: boolean): string {
  const tier = getSeverityTier(ann);
  const tokens = TIER_TOKENS[tier];
  const pattern = HIGHLIGHT_STYLES[ann.highlightType].strokePattern;
  const color = isHovered ? tokens.borderStrong : tokens.borderFaded;
  // `double` needs ≥3px to render two stripes; the others render fine at 2px.
  const width = pattern === 'double' ? '3px' : '2px';
  return `${width} ${pattern} ${color}`;
}

/** Hover background tint for a span. */
function getAnnotationHoverBg(ann: MockAnnotation): string {
  return TIER_TOKENS[getSeverityTier(ann)].hoverBg;
}

/** Solid hue used for the gutter pill — driven by severity tier. */
function getAnnotationColor(ann: MockAnnotation): string {
  return TIER_TOKENS[getSeverityTier(ann)].solid;
}

/** Popup accent surface for tier-tinted UI (badges, chips). */
function getAnnotationAccent(ann: MockAnnotation): { text: string; bg: string } {
  const tokens = TIER_TOKENS[getSeverityTier(ann)];
  return { text: tokens.accentText, bg: tokens.accentBg };
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
  const wordLimit = 650;
  const wordProgress = Math.min(wordCount / wordLimit, 1);
  const annotationCount = data.annotations.filter(a => !a.isDeferred).length;

  return (
    <div className="relative z-20 flex items-center justify-between px-5 py-2.5 border-b border-slate-200/40 bg-white/70 backdrop-blur-2xl">
      {/* Animated light sweep */}
      <motion.div
        animate={{ x: ['110%', '-110%'] }}
        transition={{ repeat: Infinity, duration: 14, ease: 'linear' }}
        className="absolute inset-0 z-[-1] pointer-events-none overflow-hidden"
      >
        <div className="absolute -top-1/2 left-0 h-[200%] w-40 bg-gradient-to-r from-transparent via-[hsl(250,70%,60%,0.04)] to-transparent skew-x-[-15deg]" />
      </motion.div>

      {/* Left: Brand + Essay Context */}
      <div className="flex items-center gap-3.5">
        <div className="relative group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(250,70%,60%)] to-[hsl(185,80%,55%)] flex items-center justify-center shadow-md shadow-purple-500/20 transition-shadow group-hover:shadow-purple-500/30">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-purple-400 to-cyan-400 opacity-15 blur-md -z-10" />
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-[13px] font-bold text-slate-800 tracking-tight">Essay Workshop</h1>
            <div className="h-3 w-px bg-slate-200" />
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.1em]">Common App</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 tabular-nums font-medium">{wordCount}<span className="text-slate-300">/{wordLimit}</span></span>
            <div className="w-14 h-[3px] bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${wordProgress * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ background: wordProgress > 0.92 ? 'hsl(350,75%,60%)' : wordProgress > 0.75 ? 'hsl(35,85%,55%)' : 'hsl(185,80%,55%)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Center: Phase + Insights + Confidence */}
      <div className="flex items-center gap-2">
        {/* Phase badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors"
          style={{ background: pc.bg, borderColor: `${pc.dot}25` }}
          title={data.phase.reasoning}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: pc.dot, animation: 'phase-pulse 3s ease-in-out infinite' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: pc.dot }} />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: pc.text }}>
            {data.phase.level}
          </span>
          <span className="text-[9px] font-medium opacity-60" style={{ color: pc.text }}>Phase</span>
        </div>

        <div className="h-4 w-px bg-slate-150" />

        {/* Active annotations */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50/80 border border-slate-100/80">
          <Lightbulb className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] text-slate-600 font-semibold tabular-nums">{annotationCount}</span>
          <span className="text-[10px] text-slate-400 font-medium">insights</span>
        </div>

        {/* Confidence depth */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50/60 border border-purple-100/50">
          <Shield className="w-3 h-3 text-purple-400" />
          <span className="text-[10px] text-purple-600 font-semibold">{data.confidence}</span>
        </div>
      </div>

      {/* Right: EQI Gauge */}
      <div className="flex items-center gap-2.5">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.12em]">EQI</span>
        <div className="relative flex items-center justify-center w-10 h-10">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14.5" fill="none" stroke="hsl(0,0%,93%)" strokeWidth="2.5" />
            <motion.circle
              cx="18" cy="18" r="14.5" fill="none"
              stroke={data.eqi >= 80 ? 'hsl(160,70%,50%)' : data.eqi >= 60 ? 'hsl(35,85%,55%)' : 'hsl(350,75%,60%)'}
              strokeWidth="2.5" strokeLinecap="round"
              initial={{ strokeDasharray: '0 91.1' }}
              animate={{ strokeDasharray: `${(data.eqi / 100) * 91.1} 91.1` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
          </svg>
          <span
            className="relative text-sm font-bold tabular-nums"
            style={{ color: data.eqi >= 80 ? 'hsl(160,70%,32%)' : data.eqi >= 60 ? 'hsl(35,85%,38%)' : 'hsl(350,75%,42%)' }}
          >
            {data.eqi}
          </span>
        </div>
      </div>
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
  const accent = getAnnotationAccent(annotation);
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
  const panelTop = leftPanelRect.top;
  const panelBottom = leftPanelRect.top + leftPanelRect.height;
  const panelPadding = 12; // breathing room from panel edges

  // Horizontal: center on highlight, clamp within left panel
  const centeredLeft = position.left + position.width / 2 - popupWidth / 2;
  const clampedLeft = Math.max(
    leftPanelRect.left + panelPadding,
    Math.min(centeredLeft, leftPanelRect.left + leftPanelRect.width - popupWidth - panelPadding),
  );

  // Vertical: position so the popup OVERLAPS the highlight line (mouse stays inside).
  // The highlight line sits at position.top. We want the popup's bottom edge to
  // overlap with the highlight when showing above, or top edge to overlap when below.
  const highlightLineY = position.top; // top of the highlighted text line
  const highlightBottom = position.top + 24; // approximate bottom of text line

  // Available space
  const spaceAbove = highlightLineY - panelTop - panelPadding;
  const spaceBelow = panelBottom - highlightBottom - panelPadding;

  // Prefer above. Only show below if very little space above AND more space below.
  const showBelow = spaceAbove < 200 && spaceBelow > spaceAbove;

  // Compute position so the popup OVERLAPS the highlight — mouse never falls through a gap.
  // We use bottom-anchoring for "above" popups: set `bottom` style instead of `top + translateY(-100%)`.
  let popupTop: number | undefined;
  let popupBottom: number | undefined;
  let maxH: number;
  if (showBelow) {
    // Popup top edge overlaps highlight bottom by 4px
    popupTop = highlightBottom - 4;
    popupBottom = undefined;
    maxH = panelBottom - popupTop - panelPadding;
  } else {
    // Popup bottom edge overlaps highlight top by 4px.
    // Use `bottom` positioning: distance from viewport bottom to the popup's bottom edge.
    // popup bottom edge = highlightLineY + 4  →  bottom = viewportHeight - (highlightLineY + 4)
    popupTop = undefined;
    popupBottom = window.innerHeight - highlightLineY - 4;
    maxH = highlightLineY + 4 - panelTop - panelPadding;
  }

  // Arrow position (points toward highlight text)
  const arrowLeft = Math.min(
    Math.max(position.left - clampedLeft + position.width / 2 - 8, 24),
    popupWidth - 48,
  );

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

      {/* Popup card */}
      <motion.div
        initial={{ opacity: 0, y: showBelow ? -8 : 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: showBelow ? -4 : 4, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="fixed z-50 pointer-events-auto flex flex-col"
        style={{
          ...(popupTop !== undefined ? { top: popupTop } : {}),
          ...(popupBottom !== undefined ? { bottom: popupBottom } : {}),
          left: clampedLeft,
          width: popupWidth,
          maxHeight: Math.max(maxH, 200),
        }}
      >
        {/* Arrow above card (when popup is BELOW the highlight) */}
        {showBelow && (
          <div className="flex mb-[-1px]" style={{ paddingLeft: arrowLeft }}>
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white" />
          </div>
        )}
        <div
          className="rounded-2xl bg-white border border-slate-200/70 overflow-y-auto"
          style={{ boxShadow: `0 25px 50px -12px ${accent.text}15, 0 0 0 1px ${accent.text}08, 0 10px 25px -5px rgba(0,0,0,0.08)` }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >

          {/* ═══ TIER 1: Type + Context — small, muted, orients the reader ═══ */}
          <div className="flex items-center justify-between px-6 pt-5 pb-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: accent.bg }}>
                <span style={{ color: accent.text }}>{hs.icon}</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent.text }}>
                {hs.label}
              </span>
              {annotation.highlightType === 'feedback' && (
                <span className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full border"
                  style={{ borderColor: `${accent.text}25`, color: accent.text, background: accent.bg }}>
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
              style={{ borderLeftColor: `${accent.text}70` }}>
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
                style={{ background: accent.bg, color: accent.text }}>
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
              style={{ background: accent.bg, color: accent.text, border: `1px solid ${accent.text}20` }}
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

        {/* Arrow below card (when popup is ABOVE the highlight) */}
        {!showBelow && (
          <div className="flex mt-[-1px]" style={{ paddingLeft: arrowLeft }}>
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white" />
          </div>
        )}
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
  selectedCollegeId,
  selectedEssayNumber,
  onPromptChange,
  onMarkerClick,
  onMarkerMouseEnter,
  onMarkerMouseLeave,
}: {
  data: MockEssayData;
  hoveredId: string | null;
  warmingId: string | null;
  selectedCollegeId: string;
  selectedEssayNumber: number;
  onPromptChange: (next: { collegeId: string; essayNumber: number }) => void;
  onMarkerClick: (ann: MockAnnotation, anchorEl: HTMLElement) => void;
  onMarkerMouseEnter: (ann: MockAnnotation, anchorEl: HTMLElement) => void;
  onMarkerMouseLeave: () => void;
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
        <div className="max-w-[680px] mx-auto px-4 py-8">
          <div className="mb-6 pb-4 border-b border-slate-100 pl-10 pr-2">
            <CommonAppPromptSelector
              collegeId={selectedCollegeId}
              essayNumber={selectedEssayNumber}
              onChange={onPromptChange}
            />
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
                  onMarkerClick={onMarkerClick}
                  onMarkerMouseEnter={onMarkerMouseEnter}
                  onMarkerMouseLeave={onMarkerMouseLeave}
                />
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * Left-margin column of indicator pills — one per active annotation, vertically
 * aligned with the first line of its span. Clicking a pill opens the popup for
 * that annotation (anchored to the underlying span, not the pill).
 *
 * The pills live in an absolutely-positioned column so they don't participate
 * in the editable paragraph's DOM — editing the text can't disturb them.
 */
/** Dwell: ms of hover before the popup auto-opens. Pill + text glow ramps over this window. */
const DWELL_MS = 4000;

interface GutterSlot {
  id: string;
  key: string;       // stable key per (annotation, line)
  top: number;       // pill's vertical anchor, relative to paragraph top
  height: number;    // line-box height — used to vertically center the pill
  xOffset: number;   // lateral stack index when multiple annotations share a line
}

function AnnotationGutter({
  annotations,
  paragraphRef,
  spanRefs,
  hoveredId,
  warmingId,
  onMarkerClick,
  onMarkerMouseEnter,
  onMarkerMouseLeave,
}: {
  annotations: MockAnnotation[];
  paragraphRef: React.RefObject<HTMLParagraphElement>;
  spanRefs: React.MutableRefObject<Map<string, HTMLSpanElement>>;
  hoveredId: string | null;
  warmingId: string | null;
  onMarkerClick: (ann: MockAnnotation, anchorEl: HTMLElement) => void;
  onMarkerMouseEnter: (ann: MockAnnotation, anchorEl: HTMLElement) => void;
  onMarkerMouseLeave: () => void;
}) {
  const [slots, setSlots] = useState<GutterSlot[]>([]);

  // Emit one slot per visual line each annotation occupies, then cluster slots
  // by line so overlapping annotations stack horizontally on every shared line
  // (not just the first). Multi-line annotations now show a bar on each line
  // they cover, which mirrors the visual extent of the underline.
  useLayoutEffect(() => {
    function measure() {
      const paraEl = paragraphRef.current;
      if (!paraEl) return;
      const paraTop = paraEl.getBoundingClientRect().top;
      // Dedupe by annotation id up front so the same insight can never produce
      // more than one gutter marker, even if the input array has accidental
      // duplicates or the same span is referenced twice.
      const seen = new Set<string>();
      const raw: Array<{ id: string; lineIdx: number; top: number; height: number }> = [];
      for (const ann of annotations) {
        if (ann.isDeferred) continue;
        if (seen.has(ann.id)) continue;
        seen.add(ann.id);
        const span = spanRefs.current.get(ann.id);
        if (!span) continue;
        const rects = span.getClientRects();
        // Fall back to bounding rect if getClientRects returns nothing (e.g. empty span).
        const lineRects = rects.length > 0 ? Array.from(rects) : [span.getBoundingClientRect()];
        // One marker per annotation: anchor on its first non-empty line rect so
        // multi-line highlights don't get duplicate gutter pills for the same insight.
        const firstRect = lineRects.find((r) => r.height > 0);
        if (!firstRect) continue;
        raw.push({
          id: ann.id,
          lineIdx: 0,
          top: firstRect.top - paraTop,
          height: firstRect.height,
        });
      }
      // Sort by line position first, then preserve annotation order for stable
      // left-to-right stacking within a cluster.
      raw.sort((a, b) => a.top - b.top || a.id.localeCompare(b.id));

      // Cluster by line: anything whose top is within half a line height of the
      // cluster's anchor top is considered the same visual line and gets stacked.
      const LINE_THRESHOLD = 12;
      const next: GutterSlot[] = [];
      let clusterTop = -Infinity;
      let stackIdx = 0;
      for (const item of raw) {
        if (Math.abs(item.top - clusterTop) < LINE_THRESHOLD) {
          stackIdx += 1;
        } else {
          clusterTop = item.top;
          stackIdx = 0;
        }
        next.push({
          id: item.id,
          key: `${item.id}-${item.lineIdx}`,
          top: item.top,
          height: item.height,
          xOffset: stackIdx,
        });
      }
      setSlots(next);
    }
    measure();

    const ro = new ResizeObserver(measure);
    if (paragraphRef.current) ro.observe(paragraphRef.current);
    window.addEventListener('resize', measure);

    // Re-measure after the user edits the paragraph — line breaks may shift.
    const paraEl = paragraphRef.current;
    paraEl?.addEventListener('input', measure);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      paraEl?.removeEventListener('input', measure);
    };
  }, [annotations, paragraphRef, spanRefs]);

  // Imperatively sync inline-text glow with warmingId / hoveredId. Going through
  // DOM side-effect rather than React state so editing the contentEditable <p>
  // doesn't collide with React trying to re-render segments.
  useEffect(() => {
    for (const ann of annotations) {
      if (ann.isDeferred) continue;
      const span = spanRefs.current.get(ann.id);
      if (!span) continue;
      const hoverBg = getAnnotationHoverBg(ann);

      if (ann.id === warmingId) {
        // Ramp up over the full dwell — visually crescendos into the popup.
        span.style.transition = `background-color ${DWELL_MS}ms ease-in`;
        span.style.backgroundColor = hoverBg;
      } else if (ann.id === hoveredId) {
        // Popup is open (or pill is active post-warming) — hold at full bg.
        span.style.transition = 'background-color 150ms ease-out';
        span.style.backgroundColor = hoverBg;
      } else {
        span.style.transition = 'background-color 220ms ease-out';
        span.style.backgroundColor = 'transparent';
      }
    }
  }, [warmingId, hoveredId, annotations, spanRefs]);

  return (
    <div className="absolute left-0 top-0 bottom-0 w-9 pointer-events-none select-none">
      {slots.map((slot) => {
        const ann = annotations.find((a) => a.id === slot.id);
        if (!ann) return null;
        const color = getAnnotationColor(ann);
        const isWarming = warmingId === ann.id;
        const isActive = hoveredId === ann.id || isWarming;

        // Pill fills most of its line-box vertically → alignment tracks the text line.
        const pillWidth = isActive ? 4 : 3;
        const pillHeight = Math.max(slot.height * (isActive ? 0.72 : 0.58), 14);

        return (
          <button
            key={slot.key}
            type="button"
            aria-label={`Open ${HIGHLIGHT_STYLES[ann.highlightType].label} note`}
            title={HIGHLIGHT_STYLES[ann.highlightType].label}
            onClick={(e) => {
              e.preventDefault();
              const span = spanRefs.current.get(ann.id);
              onMarkerClick(ann, span ?? (e.currentTarget as HTMLElement));
            }}
            onMouseEnter={(e) => {
              const span = spanRefs.current.get(ann.id);
              onMarkerMouseEnter(ann, span ?? (e.currentTarget as HTMLElement));
            }}
            onMouseLeave={onMarkerMouseLeave}
            className="absolute pointer-events-auto flex items-center justify-center focus:outline-none"
            style={{
              top: slot.top,
              // Stacked pills shift right by 8px each so overlaps read as separate markers.
              left: 4 + slot.xOffset * 8,
              width: 14,
              height: slot.height,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span
              className="block rounded-full"
              style={{
                width: pillWidth,
                height: pillHeight,
                background: color,
                // Warming ramps saturation + halo across the whole dwell window,
                // so the pill visibly "charges up" until the popup snaps open.
                opacity: isWarming ? 1 : isActive ? 0.95 : 0.55,
                boxShadow: isWarming
                  ? `0 0 0 3px ${color}33, 0 0 14px ${color}99`
                  : isActive
                    ? `0 0 0 2px ${color}22, 0 0 8px ${color}66`
                    : 'none',
                transition: isWarming
                  ? `width ${DWELL_MS}ms ease-in, height ${DWELL_MS}ms ease-in, opacity ${DWELL_MS}ms ease-in, box-shadow ${DWELL_MS}ms ease-in`
                  : 'width 180ms ease-out, height 180ms ease-out, opacity 180ms ease-out, box-shadow 180ms ease-out',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Editable paragraph with colored underlines on annotated ranges + a left gutter
 * of clickable indicators.
 *
 * The paragraph is contentEditable — clicks place the cursor, typing works. The
 * underlined spans are purely visual: they do NOT handle pointer events, so they
 * can't intercept clicks meant for cursor placement. All popup-opening happens
 * via the gutter pills.
 */
function AnnotatedParagraph({
  text,
  annotations,
  hoveredId,
  warmingId,
  onMarkerClick,
  onMarkerMouseEnter,
  onMarkerMouseLeave,
}: {
  text: string;
  annotations: MockAnnotation[];
  hoveredId: string | null;
  warmingId: string | null;
  onMarkerClick: (ann: MockAnnotation, anchorEl: HTMLElement) => void;
  onMarkerMouseEnter: (ann: MockAnnotation, anchorEl: HTMLElement) => void;
  onMarkerMouseLeave: () => void;
}) {
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const spanRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

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
    <div className="relative">
      <AnnotationGutter
        annotations={annotations}
        paragraphRef={paragraphRef}
        spanRefs={spanRefs}
        hoveredId={hoveredId}
        warmingId={warmingId}
        onMarkerClick={onMarkerClick}
        onMarkerMouseEnter={onMarkerMouseEnter}
        onMarkerMouseLeave={onMarkerMouseLeave}
      />
      <p
        ref={paragraphRef}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        className="text-[15px] leading-[1.85] text-slate-700 selection:bg-purple-100/80 outline-none pl-10 pr-2 rounded-sm focus-visible:bg-slate-50/60 transition-colors"
      >
        {segments.map((seg, i) => {
          if (!seg.annotation) return <React.Fragment key={i}>{seg.text}</React.Fragment>;
          const ann = seg.annotation;
          const hs = HIGHLIGHT_STYLES[ann.highlightType];
          const isDeferred = ann.isDeferred;

          // Static underline — intensity does NOT depend on hoveredId so editing
          // the paragraph doesn't re-render when the gutter state changes.
          const borderBottom = isDeferred
            ? '1px dashed hsla(0,0%,60%,0.25)'
            : getAnnotationBorder(ann, false);

          return (
            <span
              key={i}
              ref={(el) => {
                if (el) spanRefs.current.set(ann.id, el);
                else spanRefs.current.delete(ann.id);
              }}
              data-ann-id={ann.id}
              className={cn('rounded-sm', isDeferred && 'opacity-30')}
              style={{
                borderBottom,
                paddingBottom: '1px',
              }}
            >
              {seg.text}
            </span>
          );
        })}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════
// RIGHT: Tabbed Panel
// ═══════════════════════════════════════════

function RightTabBar({ active, onChange }: { active: RightTab; onChange: (t: RightTab) => void }) {
  const tabs: Array<{ id: RightTab; label: string; icon: React.ReactNode }> = [
    { id: 'chat', label: 'Coach', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'insights', label: 'Insights', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'profile', label: 'Profile', icon: <UserCircle className="w-3.5 h-3.5" /> },
    { id: 'roadmap', label: 'Roadmap', icon: <Target className="w-3.5 h-3.5" /> },
  ];
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200/40 bg-white/50 backdrop-blur-sm">
      <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-100/60 ring-1 ring-slate-950/[0.03]">
        {tabs.map((t) => {
          const isActive = t.id === active;
          return (
            <motion.button
              key={t.id}
              onClick={() => onChange(t.id)}
              whileHover={!isActive ? { scale: 1.02 } : undefined}
              className={cn(
                'relative flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[11px] font-semibold tracking-tight transition-colors duration-150',
                isActive ? 'text-white' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="rightTabIndicator"
                  className="absolute inset-0 rounded-[10px] bg-gradient-to-r from-[hsl(250,70%,60%)] to-[hsl(185,80%,55%)] shadow-md shadow-purple-500/20"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
                />
              )}
              <span className={cn('relative z-10 transition-opacity', isActive ? 'opacity-100' : 'opacity-70')}>{t.icon}</span>
              <span className="relative z-10">{t.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Chat Tab ──
// Uses the production chat surface from /chat-demo. Tab bar above acts as header,
// so the ChatPanel's built-in Luna header is suppressed via showHeader={false}.
function ChatTab() {
  return (
    <div className="h-full w-full">
      <ChatPanel
        showHeader={false}
        className="max-w-none rounded-none border-0 shadow-none h-full w-full"
      />
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
              <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-slate-500">
                {hs.icon} {hs.label} · {anns.length}
              </h3>
              <div className="space-y-1.5">
                {anns.map((ann) => {
                  const isExp = expandedId === ann.id;
                  const dotColor = getAnnotationColor(ann);
                  return (
                    <div key={ann.id} className="rounded-lg border border-slate-100 bg-white/80 hover:bg-white transition-all overflow-hidden">
                      <button onClick={() => setExpandedId(isExp ? null : ann.id)} className="w-full text-left flex items-start gap-2.5 p-3">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: dotColor }} />
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

// ── Profile Tab ──
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

function ProfileTab({ data }: { data: MockEssayData }) {
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
        <PortraitSection icon={<MapIcon className="w-3 h-3" />} label="Strategy" accent="amber">
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
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(DEFAULT_COLLEGE_ID);
  const [selectedEssayNumber, setSelectedEssayNumber] = useState<number>(DEFAULT_ESSAY_NUMBER);
  const handlePromptChange = useCallback(
    (next: { collegeId: string; essayNumber: number }) => {
      setSelectedCollegeId(next.collegeId);
      setSelectedEssayNumber(next.essayNumber);
    },
    [],
  );

  // Popup state — lifted to page level so portal renders outside ResizablePanel.
  // `hoveredId` now tracks the active gutter pill / open popup, not inline text hover.
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [popupAnn, setPopupAnn] = useState<MockAnnotation | null>(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0, width: 0 });
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOverPopup = useRef(false);

  const wordCount = useMemo(() => data.essayText.trim().split(/\s+/).filter(Boolean).length, [data.essayText]);

  const handleNavigate = useCallback((tab: RightTab, _annotationId: string) => {
    setRightTab(tab);
    setPopupAnn(null);
    setHoveredId(null);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      if (!isOverPopup.current) {
        setPopupAnn(null);
        setHoveredId(null);
      }
    }, 220);
  }, []);

  // Gutter pill click → open popup anchored to the annotation's inline span.
  const handleMarkerClick = useCallback((ann: MockAnnotation, anchorEl: HTMLElement) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const rect = anchorEl.getBoundingClientRect();
    setPopupPos({ top: rect.top, left: rect.left, width: rect.width });
    setPopupAnn(ann);
    setHoveredId(ann.id);
  }, []);

  const handleMarkerMouseEnter = useCallback((ann: MockAnnotation) => {
    setHoveredId(ann.id);
  }, []);

  const handleMarkerMouseLeave = useCallback(() => {
    // Keep the pill bright while its popup is open; otherwise dim it.
    setHoveredId((current) => (popupAnn && current === popupAnn.id ? current : null));
  }, [popupAnn]);

  const handlePopupMouseEnter = useCallback(() => {
    isOverPopup.current = true;
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const handlePopupMouseLeave = useCallback(() => {
    isOverPopup.current = false;
    scheduleClose();
  }, [scheduleClose]);

  const handlePopupClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    isOverPopup.current = false;
    setPopupAnn(null);
    setHoveredId(null);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white">
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={55} minSize={35}>
            <div ref={leftPanelRef} className="h-full">
            <EssayEditor
              data={data}
              hoveredId={hoveredId}
              warmingId={null}
              selectedCollegeId={selectedCollegeId}
              selectedEssayNumber={selectedEssayNumber}
              onPromptChange={handlePromptChange}
              onMarkerClick={handleMarkerClick}
              onMarkerMouseEnter={handleMarkerMouseEnter}
              onMarkerMouseLeave={handleMarkerMouseLeave}
            />
          </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-slate-100 hover:bg-purple-100/50 transition-colors" />
          <ResizablePanel defaultSize={45} minSize={28}>
            <div className="h-full flex flex-col bg-[#f9f8fd]">
              <WorkshopHeader activeTab={rightTab} onTabChange={setRightTab} essayType="Common App" />
              <div className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                  {rightTab === 'chat' && <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full"><ChatTab /></motion.div>}
                  {rightTab === 'insights' && <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full"><InsightsTab data={data} onNavigate={handleNavigate} /></motion.div>}
                  {rightTab === 'profile' && <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full"><ProfileTab data={data} /></motion.div>}
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

