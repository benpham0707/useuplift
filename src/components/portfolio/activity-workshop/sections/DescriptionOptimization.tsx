/**
 * DescriptionOptimization — Unified before/after card with word-level diff
 * highlighting and a collapsible issue list.
 *
 * Uses LCS-based word diff to highlight ONLY the words that changed between
 * original and optimized descriptions. Common/unchanged words stay plain.
 * Each diff region is color-coded to the best-matching issue. Clicking or
 * hovering any highlight cross-links to the corresponding issue card.
 *
 * Expanded issues show: Why it matters → How to fix (the color-coded
 * diff highlights in the main card visually connect rationale to changes).
 */
import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ArrowDown,
  ArrowRight,
  Quote,
  AlertTriangle,
  Info,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { ParagraphText, CollapsibleText } from '../RichText';
import ScoreRing from '../ScoreRing';

// ============================================================================
// TYPES
// ============================================================================

interface ImprovementIssue {
  issue: string;
  whyItMatters: string;
  whyItMattersPsychology?: string;
  whyItMattersResearch?: string;
  whyItMattersQuote?: string;
  whyItMattersQuoteSource?: string;
  howToFix: string;
  exampleBefore: string;
  exampleAfter: string;
  transformationAnalysis?: string;
  priority: string;
  references: Array<{ quotedText: string; type: string; label: string }>;
}

interface TransformationData {
  currentScore: number;
  revisionLevel: string;
  principle: { name: string; whyItMatters: string; applicationToActivity: string };
  rewrite: {
    original: string;
    suggested: string;
    characterCount: number;
    changesApplied: Array<{ element: string; original: string; transformed: string; rationale: string }>;
  };
  alternatives: Array<{ angle: string; rewrite: string; whenToUse: string }>;
  citations: Array<{ source: string; sourceName: string; insight: string; application: string }>;
  expectedScoreImprovement: { projectedScore: number; improvingComponents: string[]; rationale: string };
}

export interface DescriptionOptimizationProps {
  optimization: {
    original: string;
    optimized: string;
    originalCharCount: number;
    optimizedCharCount: number;
    changes: Array<{ change: string; reason?: string }>;
  };
  improvementTeaching?: ImprovementIssue[];
  accentColor: string;
  descriptionAlternatives?: string[];
  suggestedRewrite?: string;
  scoreProjection?: { projectedScore: number; improvingComponents: string[]; rationale: string } | null;
  transformation?: TransformationData | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CHAR_LIMIT = 150;

/** One color per issue — used for before highlights, after highlights, and annotation cards */
const ISSUE_COLORS = [
  {
    bg: 'bg-rose-100/60 dark:bg-rose-900/35',
    bgHover: 'bg-rose-200/70 dark:bg-rose-800/45',
    border: 'border-rose-400 dark:border-rose-500',
    dot: 'bg-rose-600 dark:bg-rose-500',
    ring: 'ring-rose-300/50 dark:ring-rose-600/40',
    leftBorder: 'border-l-rose-500 dark:border-l-rose-400',
    annotationBg: 'bg-rose-50/50 dark:bg-rose-950/20',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  },
  {
    bg: 'bg-amber-100/60 dark:bg-amber-900/35',
    bgHover: 'bg-amber-200/70 dark:bg-amber-800/45',
    border: 'border-amber-400 dark:border-amber-500',
    dot: 'bg-amber-600 dark:bg-amber-500',
    ring: 'ring-amber-300/50 dark:ring-amber-600/40',
    leftBorder: 'border-l-amber-500 dark:border-l-amber-400',
    annotationBg: 'bg-amber-50/50 dark:bg-amber-950/20',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  },
  {
    bg: 'bg-blue-100/60 dark:bg-blue-900/35',
    bgHover: 'bg-blue-200/70 dark:bg-blue-800/45',
    border: 'border-blue-400 dark:border-blue-500',
    dot: 'bg-blue-600 dark:bg-blue-500',
    ring: 'ring-blue-300/50 dark:ring-blue-600/40',
    leftBorder: 'border-l-blue-500 dark:border-l-blue-400',
    annotationBg: 'bg-blue-50/50 dark:bg-blue-950/20',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },
  {
    bg: 'bg-violet-100/60 dark:bg-violet-900/35',
    bgHover: 'bg-violet-200/70 dark:bg-violet-800/45',
    border: 'border-violet-400 dark:border-violet-500',
    dot: 'bg-violet-600 dark:bg-violet-500',
    ring: 'ring-violet-300/50 dark:ring-violet-600/40',
    leftBorder: 'border-l-violet-500 dark:border-l-violet-400',
    annotationBg: 'bg-violet-50/50 dark:bg-violet-950/20',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  },
  {
    bg: 'bg-teal-100/60 dark:bg-teal-900/35',
    bgHover: 'bg-teal-200/70 dark:bg-teal-800/45',
    border: 'border-teal-400 dark:border-teal-500',
    dot: 'bg-teal-600 dark:bg-teal-500',
    ring: 'ring-teal-300/50 dark:ring-teal-600/40',
    leftBorder: 'border-l-teal-500 dark:border-l-teal-400',
    annotationBg: 'bg-teal-50/50 dark:bg-teal-950/20',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
  },
] as const;

function getIssueColor(index: number) {
  return ISSUE_COLORS[index % ISSUE_COLORS.length];
}

const PRIORITY_CONFIG: Record<string, { label: string; icon: typeof AlertTriangle; className: string }> = {
  high: { label: 'High', icon: AlertTriangle, className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  medium: { label: 'Medium', icon: AlertCircle, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  low: { label: 'Low', icon: Info, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
};

// ============================================================================
// HIGHLIGHTING ENGINE — word-level diff
//
// Compares original and optimized descriptions word-by-word using LCS.
// Only the CHANGED words get highlighted — common words stay plain.
// Each diff region is assigned to the best-matching issue by word overlap.
// ============================================================================

interface HighlightSegment {
  text: string;
  issueIndex: number | null;
}

interface WordToken {
  word: string;
  norm: string;   // lowercased, punctuation-stripped (for comparison)
  start: number;  // char offset in original string
  end: number;
}

/** Split text into word tokens preserving character positions. */
function tokenize(text: string): WordToken[] {
  const tokens: WordToken[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    tokens.push({
      word: m[0],
      norm: m[0].toLowerCase().replace(/[.,;:!?'"()[\]]+$/g, '').replace(/^['"([\]]+/g, ''),
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return tokens;
}

/**
 * Longest Common Subsequence on word arrays (by normalized form).
 * Returns sets of indices in a[] and b[] that are part of the LCS.
 */
function wordLCS(a: string[], b: string[]): { aSet: Set<number>; bSet: Set<number> } {
  const M = a.length;
  const N = b.length;
  const dp: number[][] = Array.from({ length: M + 1 }, () => Array(N + 1).fill(0));

  for (let i = 1; i <= M; i++) {
    for (let j = 1; j <= N; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack to recover which indices belong to the LCS
  const aSet = new Set<number>();
  const bSet = new Set<number>();
  let i = M;
  let j = N;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      aSet.add(i - 1);
      bSet.add(j - 1);
      i--; j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return { aSet, bSet };
}

/**
 * Merge adjacent diff-word tokens into contiguous character ranges.
 * Words within `gap` characters of each other are merged.
 */
function mergeWordRanges(
  tokens: WordToken[],
  diffIndices: number[],
  gap = 2,
): Array<{ start: number; end: number }> {
  if (diffIndices.length === 0) return [];

  const ranges: Array<{ start: number; end: number }> = [];
  let curStart = tokens[diffIndices[0]].start;
  let curEnd = tokens[diffIndices[0]].end;

  for (let k = 1; k < diffIndices.length; k++) {
    const tok = tokens[diffIndices[k]];
    if (tok.start - curEnd <= gap) {
      curEnd = tok.end;
    } else {
      ranges.push({ start: curStart, end: curEnd });
      curStart = tok.start;
      curEnd = tok.end;
    }
  }
  ranges.push({ start: curStart, end: curEnd });
  return ranges;
}

/**
 * Assign each diff range to the best-matching issue by word overlap
 * with that issue's exampleBefore / exampleAfter.
 */
function assignRangesToIssues(
  ranges: Array<{ start: number; end: number }>,
  fullText: string,
  issues: ImprovementIssue[],
  side: 'before' | 'after',
): Array<{ start: number; end: number; issueIndex: number }> {
  if (issues.length === 0) return [];
  if (issues.length === 1) return ranges.map((r) => ({ ...r, issueIndex: 0 }));

  // Build word sets from each issue's example text
  const issueWordSets = issues.map((issue) => {
    const src = side === 'before' ? issue.exampleBefore : issue.exampleAfter;
    if (!src) return new Set<string>();
    return new Set(src.toLowerCase().split(/\W+/).filter((w) => w.length >= 3));
  });

  return ranges.map((r) => {
    const rangeWords = fullText.slice(r.start, r.end).toLowerCase().split(/\W+/).filter((w) => w.length >= 3);

    let bestIdx = 0;
    let bestScore = 0;
    for (let k = 0; k < issues.length; k++) {
      const overlap = rangeWords.filter((w) => issueWordSets[k].has(w)).length;
      if (overlap > bestScore) { bestScore = overlap; bestIdx = k; }
    }
    return { ...r, issueIndex: bestIdx };
  });
}

/** Convert assigned ranges into a HighlightSegment array. */
function rangestoSegments(
  text: string,
  assigned: Array<{ start: number; end: number; issueIndex: number }>,
): HighlightSegment[] {
  if (assigned.length === 0) return [{ text, issueIndex: null }];

  const sorted = [...assigned].sort((a, b) => a.start - b.start);
  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const r of sorted) {
    if (r.start > cursor) segments.push({ text: text.slice(cursor, r.start), issueIndex: null });
    segments.push({ text: text.slice(r.start, r.end), issueIndex: r.issueIndex });
    cursor = r.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), issueIndex: null });
  return segments;
}

/**
 * Build diff-based highlight segments for both before and after text.
 * Only words that CHANGED between original → optimized get highlighted.
 * Each highlighted region is color-coded to the best-matching issue.
 */
function buildDiffHighlights(
  original: string,
  optimized: string,
  issues: ImprovementIssue[],
): { beforeSegments: HighlightSegment[]; afterSegments: HighlightSegment[] } {
  const noHighlight = {
    beforeSegments: [{ text: original || '', issueIndex: null }] as HighlightSegment[],
    afterSegments: [{ text: optimized || '', issueIndex: null }] as HighlightSegment[],
  };

  if (!original || !optimized || issues.length === 0) return noHighlight;

  const origTokens = tokenize(original);
  const optTokens = tokenize(optimized);

  const { aSet, bSet } = wordLCS(
    origTokens.map((t) => t.norm),
    optTokens.map((t) => t.norm),
  );

  // Non-LCS indices = words that were removed/changed (before) or added/changed (after)
  const origDiffIdx = origTokens.map((_, idx) => idx).filter((idx) => !aSet.has(idx));
  const optDiffIdx = optTokens.map((_, idx) => idx).filter((idx) => !bSet.has(idx));

  if (origDiffIdx.length === 0 && optDiffIdx.length === 0) return noHighlight;

  // Merge adjacent diff words into contiguous character ranges
  const origRanges = mergeWordRanges(origTokens, origDiffIdx);
  const optRanges = mergeWordRanges(optTokens, optDiffIdx);

  // Assign each range to the best-matching issue
  const origAssigned = assignRangesToIssues(origRanges, original, issues, 'before');
  const optAssigned = assignRangesToIssues(optRanges, optimized, issues, 'after');

  return {
    beforeSegments: rangestoSegments(original, origAssigned),
    afterSegments: rangestoSegments(optimized, optAssigned),
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function getCharColor(count: number): { bar: string; text: string } {
  if (count > CHAR_LIMIT) return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' };
  if (count >= 140) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function InlineCharCount({ count }: { count: number }) {
  const colors = getCharColor(count);
  const pct = Math.min((count / CHAR_LIMIT) * 100, 100);
  return (
    <span className="inline-flex items-center gap-1.5 ml-1.5">
      <span className="w-10 h-1 rounded-full bg-muted overflow-hidden inline-block align-middle">
        <span className={`block h-full rounded-full transition-[width] duration-500 ease-out ${colors.bar}`} style={{ width: `${pct}%` }} />
      </span>
      <span className={`text-[10px] font-medium tabular-nums ${colors.text}`}>{count}/{CHAR_LIMIT}</span>
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors duration-200 ${
        copied
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {copied ? <><Check className="h-3 w-3" />Copied!</> : <><Copy className="h-3 w-3" />Copy</>}
    </button>
  );
}

/** Rendered text with issue-colored highlights — used for both before and after */
function IssueHighlightedText({
  segments,
  hoveredIssueIndex,
  onIssueHover,
  onIssueClick,
}: {
  segments: HighlightSegment[];
  hoveredIssueIndex: number | null;
  onIssueHover: (index: number | null) => void;
  onIssueClick?: (issueIndex: number) => void;
}) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.issueIndex === null) return <React.Fragment key={i}>{seg.text}</React.Fragment>;
        const colors = getIssueColor(seg.issueIndex);
        const isHovered = hoveredIssueIndex === seg.issueIndex;
        return (
          <span
            key={i}
            role={onIssueClick ? 'button' : undefined}
            tabIndex={onIssueClick ? 0 : undefined}
            onClick={onIssueClick ? () => onIssueClick(seg.issueIndex as number) : undefined}
            onKeyDown={onIssueClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onIssueClick(seg.issueIndex as number); } } : undefined}
            onMouseEnter={() => onIssueHover(seg.issueIndex)}
            onMouseLeave={() => onIssueHover(null)}
            className={`
              rounded-sm px-0.5 -mx-0.5 border-b-2 transition-all duration-150
              ${onIssueClick ? 'cursor-pointer' : 'cursor-default'}
              ${isHovered ? `${colors.bgHover} ${colors.border} ring-1 ${colors.ring}` : `${colors.bg} ${colors.border}`}
            `}
          >
            {seg.text}
          </span>
        );
      })}
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function DescriptionOptimizationInner({
  optimization,
  improvementTeaching = [],
  scoreProjection = null,
  transformation = null,
}: DescriptionOptimizationProps) {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [hoveredIssueIndex, setHoveredIssueIndex] = useState<number | null>(null);
  const issueRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

  const hasIssues = improvementTeaching.length > 0;

  // Word-level diff: only the CHANGED words get highlighted
  const { beforeSegments, afterSegments } = useMemo(
    () => buildDiffHighlights(optimization.original, optimization.optimized, improvementTeaching),
    [optimization.original, optimization.optimized, improvementTeaching],
  );

  const scrollToIssue = useCallback((issueIndex: number) => {
    setExpandedIssue((prev) => {
      const next = prev === issueIndex ? null : issueIndex;
      setHoveredIssueIndex(next);
      return next;
    });
    requestAnimationFrame(() => {
      const el = issueRefs.current.get(issueIndex);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

  const toggleIssue = useCallback((index: number) => {
    setExpandedIssue((prev) => {
      const next = prev === index ? null : index;
      setHoveredIssueIndex(next);
      return next;
    });
  }, []);

  const getIssueRef = useCallback(
    (index: number) => ({
      current: issueRefs.current.get(index) ?? null,
      set current(el: HTMLDivElement | null) {
        if (el) issueRefs.current.set(index, el);
        else issueRefs.current.delete(index);
      },
    }),
    [],
  );

  return (
    <div className="space-y-3">
      {/* ── UNIFIED BEFORE/AFTER CARD ── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">

        {/* BEFORE */}
        <div className="px-4 pt-3 pb-2.5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Before</span>
            <InlineCharCount count={optimization.originalCharCount} />
          </div>
          <p className="text-[13px] leading-relaxed text-foreground/55 line-through decoration-red-300/30 dark:decoration-red-500/20 decoration-1">
            <IssueHighlightedText
              segments={beforeSegments}
              hoveredIssueIndex={hoveredIssueIndex}
              onIssueHover={setHoveredIssueIndex}
              onIssueClick={scrollToIssue}
            />
          </p>
        </div>

        {/* Arrow */}
        <div className="relative px-4 my-0.5">
          <div className="border-t border-border/30" />
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-card px-2">
            <ArrowDown className="h-3 w-3 text-muted-foreground/50" />
          </div>
        </div>

        {/* AFTER — optimized description with issue-colored highlights */}
        <div className="px-4 pt-2.5 pb-3 bg-emerald-50/20 dark:bg-emerald-950/10">
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Suggested
              </span>
              <InlineCharCount count={optimization.optimizedCharCount} />
            </div>
            <CopyButton text={optimization.optimized} />
          </div>
          <p className="text-[13px] leading-relaxed text-foreground font-medium">
            <IssueHighlightedText
              segments={afterSegments}
              hoveredIssueIndex={hoveredIssueIndex}
              onIssueHover={setHoveredIssueIndex}
              onIssueClick={scrollToIssue}
            />
          </p>
        </div>

        {/* ── ISSUE LIST (collapsible per issue) ── */}
        {hasIssues && (
          <div className="border-t border-border/40">
            <div className="px-4 py-2.5 space-y-0">
              {improvementTeaching.map((issue, i) => {
                const color = getIssueColor(i);
                const isHovered = hoveredIssueIndex === i;
                const isExpanded = expandedIssue === i;
                const priorityCfg = PRIORITY_CONFIG[issue.priority?.toLowerCase()] ?? PRIORITY_CONFIG.medium;
                const PriorityIcon = priorityCfg.icon;

                return (
                  <div
                    key={i}
                    ref={getIssueRef(i)}
                    className={`
                      rounded-lg border-l-[3px] transition-all duration-150
                      ${isHovered ? `${color.annotationBg} ${color.leftBorder}` : color.leftBorder}
                    `}
                    onMouseEnter={() => setHoveredIssueIndex(i)}
                    onMouseLeave={() => setHoveredIssueIndex(null)}
                  >
                    {/* Collapsed: title + priority */}
                    <button
                      type="button"
                      onClick={() => toggleIssue(i)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left group"
                    >
                      <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${color.dot}`}>
                        {i + 1}
                      </span>
                      <span className="flex-1 text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors min-w-0 truncate">
                        {issue.issue}
                      </span>
                      <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${priorityCfg.className}`}>
                        <PriorityIcon className="h-2 w-2 inline mr-0.5 -mt-px" />
                        {priorityCfg.label}
                      </span>
                      <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Expanded: Why → Fix → Before/After (color-coded) */}
                    <div
                      className="grid transition-[grid-template-rows] duration-200 ease-out"
                      style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                    >
                      <div className="overflow-hidden">
                        <div className="px-3 pb-3 pl-9 space-y-3">
                          {/* Why */}
                          <div>
                            <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Why this matters</h6>
                            <CollapsibleText text={issue.whyItMatters} previewParagraphs={2} className="text-xs text-foreground/80 leading-relaxed" />
                          </div>

                          {/* Fix */}
                          <div>
                            <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">How to fix</h6>
                            <ParagraphText text={issue.howToFix} className="text-xs text-foreground/80 leading-relaxed" />
                          </div>

                          {/* Transformation breakdown (if available) */}
                          {issue.transformationAnalysis && (
                            <div>
                              <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Transformation breakdown</h6>
                              <CollapsibleText text={issue.transformationAnalysis} previewParagraphs={2} className="text-xs text-foreground/80 leading-relaxed" />
                            </div>
                          )}

                          {/* Quote */}
                          {issue.whyItMattersQuote && (
                            <div className="flex items-start gap-2 rounded-md bg-muted/30 p-2.5">
                              <Quote className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-xs text-foreground/70 leading-relaxed italic">&ldquo;{issue.whyItMattersQuote}&rdquo;</p>
                                {issue.whyItMattersQuoteSource && (
                                  <p className="text-[10px] text-muted-foreground mt-1">— {issue.whyItMattersQuoteSource}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── SCORE PROJECTION ── */}
      {scoreProjection && (
        <div className="rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/30 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            {transformation?.currentScore != null ? (
              <>
                <ScoreRing score={transformation.currentScore} size={34} strokeWidth={2.5} />
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <ScoreRing score={scoreProjection.projectedScore} size={34} strokeWidth={2.5} />
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500 ml-1" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  +{(scoreProjection.projectedScore - transformation.currentScore).toFixed(1)} projected
                </span>
              </>
            ) : (
              <>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Projected Score: {scoreProjection.projectedScore.toFixed(1)}
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{scoreProjection.rationale}</p>
          {scoreProjection.improvingComponents.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {scoreProjection.improvingComponents.map((c, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{c}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const DescriptionOptimization = React.memo(DescriptionOptimizationInner);
