/**
 * DescriptionOptimization — Stacked before/after description comparison with
 * highlighted changes linked to expandable issues.
 *
 * Layout: Original description (top) → Optimized description (bottom) →
 * Issues & Improvements list (bottom). Highlighted spans in the descriptions
 * are clickable and smooth-scroll to the corresponding issue.
 */
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Quote,
  AlertTriangle,
  Info,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { ParagraphText, CollapsibleText } from '../RichText';

// ============================================================================
// TYPES
// ============================================================================

interface IssueReference {
  quotedText: string;
  type: string;
  label: string;
}

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
  references: Array<IssueReference>;
}

export interface DescriptionOptimizationProps {
  optimization: {
    original: string;
    optimized: string;
    originalCharCount: number;
    optimizedCharCount: number;
    changes: Array<{ change: string; reason: string }>;
  };
  improvementTeaching?: ImprovementIssue[];
  accentColor: string;
  // New props
  descriptionAlternatives?: string[];
  suggestedRewrite?: string;
  scoreProjection?: { projectedScore: number; improvingComponents: string[]; rationale: string } | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CHAR_LIMIT = 150;

/** Issue color palette — rotates for visual distinction */
const ISSUE_COLORS = [
  {
    bg: 'bg-rose-100/50 dark:bg-rose-900/30',
    border: 'border-rose-400 dark:border-rose-600',
    text: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    ring: 'ring-rose-400/30 dark:ring-rose-600/30',
    dot: 'bg-rose-500',
    hover: 'hover:bg-rose-200/60 dark:hover:bg-rose-800/40',
  },
  {
    bg: 'bg-amber-100/50 dark:bg-amber-900/30',
    border: 'border-amber-400 dark:border-amber-600',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    ring: 'ring-amber-400/30 dark:ring-amber-600/30',
    dot: 'bg-amber-500',
    hover: 'hover:bg-amber-200/60 dark:hover:bg-amber-800/40',
  },
  {
    bg: 'bg-blue-100/50 dark:bg-blue-900/30',
    border: 'border-blue-400 dark:border-blue-600',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    ring: 'ring-blue-400/30 dark:ring-blue-600/30',
    dot: 'bg-blue-500',
    hover: 'hover:bg-blue-200/60 dark:hover:bg-blue-800/40',
  },
  {
    bg: 'bg-violet-100/50 dark:bg-violet-900/30',
    border: 'border-violet-400 dark:border-violet-600',
    text: 'text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
    ring: 'ring-violet-400/30 dark:ring-violet-600/30',
    dot: 'bg-violet-500',
    hover: 'hover:bg-violet-200/60 dark:hover:bg-violet-800/40',
  },
] as const;

function getIssueColor(index: number) {
  return ISSUE_COLORS[index % ISSUE_COLORS.length];
}

const PRIORITY_CONFIG: Record<string, { label: string; icon: typeof AlertTriangle; className: string }> = {
  high: {
    label: 'High',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  medium: {
    label: 'Medium',
    icon: AlertCircle,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  low: {
    label: 'Low',
    icon: Info,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
};

// ============================================================================
// HIGHLIGHTING ENGINE
// ============================================================================

interface HighlightSegment {
  text: string;
  issueIndex: number | null; // null = normal text
}

/**
 * Parse description text into segments of normal text and highlighted spans.
 * Each highlighted span corresponds to a `references[].quotedText` from an issue.
 * Issues are matched case-insensitively. Overlapping highlights are handled by
 * first-match-wins (earlier issues take priority).
 */
function buildHighlightSegments(
  text: string,
  issues: ImprovementIssue[],
): HighlightSegment[] {
  if (!text || issues.length === 0) {
    return [{ text, issueIndex: null }];
  }

  // Collect all references with their issue index and find positions
  const matches: Array<{ start: number; end: number; issueIndex: number }> = [];
  const textLower = text.toLowerCase();

  issues.forEach((issue, issueIdx) => {
    if (!issue.references) return;
    issue.references.forEach((ref) => {
      if (!ref.quotedText) return;
      const refLower = ref.quotedText.toLowerCase();
      const pos = textLower.indexOf(refLower);
      if (pos !== -1) {
        matches.push({ start: pos, end: pos + ref.quotedText.length, issueIndex: issueIdx });
      }
    });
  });

  if (matches.length === 0) {
    return [{ text, issueIndex: null }];
  }

  // Sort by start position, then by length (longer match first for ties)
  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  // Remove overlapping matches (first-match-wins)
  const filtered: typeof matches = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  // Build segments
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const m of filtered) {
    if (m.start > cursor) {
      segments.push({ text: text.slice(cursor, m.start), issueIndex: null });
    }
    segments.push({ text: text.slice(m.start, m.end), issueIndex: m.issueIndex });
    cursor = m.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), issueIndex: null });
  }

  return segments;
}

// ============================================================================
// HELPERS
// ============================================================================

function getCharColor(count: number): { bar: string; text: string } {
  if (count > CHAR_LIMIT) {
    return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' };
  }
  if (count >= 140) {
    return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
  }
  return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
}

function charPercent(count: number): number {
  return Math.min((count / CHAR_LIMIT) * 100, 100);
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Compact character count progress bar */
function CharacterBar({ count }: { count: number }) {
  const colors = getCharColor(count);
  const pct = charPercent(count);

  return (
    <div className="flex items-center gap-2.5 mt-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-medium tabular-nums whitespace-nowrap ${colors.text}`}>
        {count}/{CHAR_LIMIT}
      </span>
    </div>
  );
}

/** Copy-to-clipboard button with "Copied!" feedback */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`
        flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md
        transition-all duration-200
        ${copied
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
        }
      `}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
}

/** Rendered highlighted description text */
function HighlightedText({
  segments,
  onHighlightClick,
}: {
  segments: HighlightSegment[];
  onHighlightClick: (issueIndex: number) => void;
}) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.issueIndex === null) {
          return <React.Fragment key={i}>{seg.text}</React.Fragment>;
        }
        const colors = getIssueColor(seg.issueIndex);
        return (
          <span
            key={i}
            role="button"
            tabIndex={0}
            onClick={() => onHighlightClick(seg.issueIndex as number)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onHighlightClick(seg.issueIndex as number);
              }
            }}
            className={`
              ${colors.bg} border-b-2 ${colors.border}
              cursor-pointer rounded-sm px-0.5 -mx-0.5
              transition-all duration-150
              ${colors.hover}
            `}
            title={`Issue ${seg.issueIndex + 1} — click to see details`}
          >
            {seg.text}
          </span>
        );
      })}
    </>
  );
}

/** Single expandable issue item */
function IssueItem({
  issue,
  index,
  isExpanded,
  onToggle,
  issueRef,
}: {
  issue: ImprovementIssue;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  issueRef: React.RefObject<HTMLDivElement | null>;
}) {
  const colors = getIssueColor(index);
  const priorityCfg = PRIORITY_CONFIG[issue.priority?.toLowerCase()] ?? PRIORITY_CONFIG.medium;
  const PriorityIcon = priorityCfg.icon;

  return (
    <div
      ref={issueRef}
      id={`issue-${index}`}
      className={`
        rounded-lg border transition-all duration-200
        ${isExpanded
          ? `${colors.border} ring-1 ${colors.ring}`
          : 'border-border/60 hover:border-border'
        }
      `}
    >
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 p-3 text-left"
      >
        {/* Issue number badge */}
        <span
          className={`
            flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
            text-[10px] font-bold text-white ${colors.dot}
          `}
        >
          {index + 1}
        </span>

        {/* Issue title */}
        <span className="flex-1 text-sm font-medium text-foreground min-w-0 truncate">
          {issue.issue}
        </span>

        {/* Priority badge */}
        <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityCfg.className}`}>
          <PriorityIcon className="h-2.5 w-2.5 inline mr-0.5 -mt-px" />
          {priorityCfg.label}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expandable detail panel */}
      <div
        className="grid transition-all duration-200 ease-out"
        style={{
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
        }}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 space-y-3">
            {/* Separator */}
            <div className="border-t border-border/40" />

            {/* Why it matters */}
            <div>
              <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Why this matters
              </h6>
              <CollapsibleText text={issue.whyItMatters} previewParagraphs={2} className="text-xs text-foreground/80" />
            </div>

            {/* How to fix */}
            <div>
              <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                How to fix
              </h6>
              <ParagraphText text={issue.howToFix} className="text-xs text-foreground/80 leading-relaxed" />
            </div>

            {/* Before → After comparison */}
            {(issue.exampleBefore || issue.exampleAfter) && (
              <div className="rounded-md bg-muted/40 p-2.5 space-y-2">
                <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Example
                </h6>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-red-500 dark:text-red-400">
                      Before
                    </span>
                    <p className="text-xs text-foreground/60 leading-relaxed mt-0.5 line-through decoration-red-300/50">
                      {issue.exampleBefore}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-3" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                      After
                    </span>
                    <p className="text-xs text-foreground leading-relaxed mt-0.5 font-medium">
                      {issue.exampleAfter}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Expert insight quote */}
            {issue.whyItMattersQuote && (
              <div className="flex items-start gap-2 rounded-md bg-muted/30 p-2.5">
                <Quote className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-foreground/70 leading-relaxed italic">
                    &ldquo;{issue.whyItMattersQuote}&rdquo;
                  </p>
                  {issue.whyItMattersQuoteSource && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      — {issue.whyItMattersQuoteSource}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DescriptionOptimization({
  optimization,
  improvementTeaching = [],
  accentColor,
  descriptionAlternatives = [],
  suggestedRewrite = '',
  scoreProjection = null,
}: DescriptionOptimizationProps) {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const issueRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

  // Build highlight segments for both descriptions
  const originalSegments = useMemo(
    () => buildHighlightSegments(optimization.original, improvementTeaching),
    [optimization.original, improvementTeaching],
  );

  // For the optimized description, we don't have reference-based highlights,
  // so show it as plain text (the changes are described in the issues section)
  const hasIssues = improvementTeaching.length > 0;

  // Scroll to and expand a specific issue
  const scrollToIssue = useCallback((issueIndex: number) => {
    setExpandedIssue((prev) => (prev === issueIndex ? null : issueIndex));

    // Small delay to let the DOM update, then scroll
    requestAnimationFrame(() => {
      const el = issueRefs.current.get(issueIndex);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }, []);

  const toggleIssue = useCallback((index: number) => {
    setExpandedIssue((prev) => (prev === index ? null : index));
  }, []);

  // Create stable refs for each issue
  const getIssueRef = useCallback(
    (index: number) => ({
      current: issueRefs.current.get(index) ?? null,
      set current(el: HTMLDivElement | null) {
        if (el) {
          issueRefs.current.set(index, el);
        } else {
          issueRefs.current.delete(index);
        }
      },
    }),
    [],
  );

  return (
    <div className="space-y-3">
      {/* Section header */}
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Description Optimization
      </h4>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ORIGINAL DESCRIPTION                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/20">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Your Current Description
          </span>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground/85">
            <HighlightedText segments={originalSegments} onHighlightClick={scrollToIssue} />
          </p>
          <CharacterBar count={optimization.originalCharCount} />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* OPTIMIZED DESCRIPTION                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-emerald-300/50 dark:border-emerald-700/40 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-200/30 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/20">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Optimized Version
          </span>
          <CopyButton text={optimization.optimized} />
        </div>
        <div className="px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground font-medium">
            {optimization.optimized}
          </p>
          <CharacterBar count={optimization.optimizedCharCount} />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ISSUES & IMPROVEMENTS                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {hasIssues && (
        <div className="space-y-2">
          <h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Issues & Improvements
          </h5>
          <div className="space-y-2">
            {improvementTeaching.map((issue, i) => (
              <IssueItem
                key={i}
                issue={issue}
                index={i}
                isExpanded={expandedIssue === i}
                onToggle={() => toggleIssue(i)}
                issueRef={getIssueRef(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ALTERNATIVE VERSIONS                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {descriptionAlternatives && descriptionAlternatives.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Alternative Versions
          </h5>
          {descriptionAlternatives.map((alt, i) => (
            <div key={i} className="rounded-xl border border-blue-200/40 dark:border-blue-800/30 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-blue-200/30 dark:border-blue-800/30 bg-blue-50/30 dark:bg-blue-950/20">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Alternative {i + 1}
                </span>
                <CopyButton text={alt} />
              </div>
              <div className="px-4 py-3">
                <p className="text-sm leading-relaxed text-foreground/85">{alt}</p>
                <CharacterBar count={alt.length} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SUGGESTED REWRITE (from scoring)                                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {suggestedRewrite && (
        <div className="rounded-xl border border-purple-200/40 dark:border-purple-800/30 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-purple-200/30 dark:border-purple-800/30 bg-purple-50/30 dark:bg-purple-950/20">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Scoring-Based Rewrite
            </span>
            <CopyButton text={suggestedRewrite} />
          </div>
          <div className="px-4 py-3">
            <p className="text-sm leading-relaxed text-foreground font-medium">{suggestedRewrite}</p>
            <CharacterBar count={suggestedRewrite.length} />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SCORE IMPROVEMENT PROJECTION                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {scoreProjection && (
        <div className="rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/30 p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Projected Score: {scoreProjection.projectedScore.toFixed(1)}
            </span>
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
