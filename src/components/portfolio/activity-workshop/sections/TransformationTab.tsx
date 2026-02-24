/**
 * TransformationTab — Fifth tab in InsightDetailView (conditional).
 *
 * Renders the scoring teaching layer: research-backed transformation guidance
 * including revision level badge, transformation principle, concrete rewrite
 * with changes-applied detail, alternative angles, research citations,
 * and score improvement projection.
 *
 * Only rendered when `data.transformation !== null`.
 */
import React, { useState, useCallback } from 'react';
import {
  Wand2,
  ArrowRight,
  BookOpen,
  Quote,
  ChevronDown,
  TrendingUp,
  Copy,
  Check,
} from 'lucide-react';
import type { ActivityInsightData } from '../insightTypes';
import { getScoreColor, getScoreTextColor } from '../insightTypes';
import { ParagraphText } from '../RichText';

interface TransformationTabProps {
  data: ActivityInsightData;
}

/** Revision level color mapping */
const REVISION_BADGE: Record<string, { className: string; label: string }> = {
  minor_polish: {
    className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    label: 'Minor Polish',
  },
  moderate_revision: {
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    label: 'Moderate Revision',
  },
  major_overhaul: {
    className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    label: 'Major Overhaul',
  },
  strategic_rethink: {
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    label: 'Strategic Rethink',
  },
};

/** Small score ring for projection display */
function MiniScoreRing({ score, label }: { score: number; label: string }) {
  const size = 40;
  const radius = (size - 5) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 10, 1);
  const offset = circumference * (1 - pct);
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={2.5} className="text-muted/20" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={2.5} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-[stroke-dashoffset] duration-[800ms] ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold tabular-nums ${getScoreTextColor(score)}`}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>
      <span className="text-[9px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

/** Copy button */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [text]);

  return (
    <button type="button" onClick={handleCopy} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function TransformationTab({ data }: TransformationTabProps) {
  const t = data.transformation;
  if (!t) return null;

  const [changesOpen, setChangesOpen] = useState(false);
  const [citationsOpen, setCitationsOpen] = useState(false);

  const revBadge = REVISION_BADGE[t.revisionLevel] || REVISION_BADGE.moderate_revision;

  return (
    <div className="space-y-5">
      {/* ── Header: Score Projection + Revision Level ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MiniScoreRing score={t.currentScore} label="Current" />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <MiniScoreRing score={t.expectedScoreImprovement.projectedScore} label="Projected" />
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${revBadge.className}`}>
          {revBadge.label}
        </span>
      </div>

      {/* ── Projection Rationale ── */}
      {t.expectedScoreImprovement.rationale && (
        <div className="rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/30 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Score Improvement
            </span>
          </div>
          <ParagraphText text={t.expectedScoreImprovement.rationale} className="text-xs text-foreground/80 leading-relaxed" />
          {t.expectedScoreImprovement.improvingComponents.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {t.expectedScoreImprovement.improvingComponents.map((c, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Transformation Principle ── */}
      {t.principle.name && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Wand2 className="h-3.5 w-3.5" />
            Guiding Principle
          </h4>
          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <p className="text-sm font-semibold text-foreground">{t.principle.name}</p>
            <ParagraphText text={t.principle.whyItMatters} className="text-xs text-foreground/80 leading-relaxed" />
            {t.principle.applicationToActivity && (
              <div className="rounded-md bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30 p-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Applied to Your Activity
                </span>
                <ParagraphText text={t.principle.applicationToActivity} className="text-xs text-foreground/80 leading-relaxed mt-0.5" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Concrete Rewrite ── */}
      {t.rewrite.suggested && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Suggested Rewrite
          </h4>
          <div className="space-y-2">
            {/* Original */}
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <div className="px-4 py-2 border-b border-border/40 bg-muted/20">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Original</span>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm leading-relaxed text-foreground/60 line-through decoration-red-300/50">
                  {t.rewrite.original}
                </p>
              </div>
            </div>

            {/* Suggested */}
            <div className="rounded-xl border border-emerald-300/50 dark:border-emerald-700/40 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-200/30 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/20">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Transformed
                </span>
                <CopyButton text={t.rewrite.suggested} />
              </div>
              <div className="px-4 py-3">
                <p className="text-sm leading-relaxed text-foreground font-medium">
                  {t.rewrite.suggested}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{t.rewrite.characterCount} characters</span>
                  {t.rewrite.characterCount > 150 && (
                    <span className="text-amber-500">Over 150 char limit</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Changes Applied (collapsible) */}
          {t.rewrite.changesApplied.length > 0 && (
            <div className="rounded-lg border overflow-hidden mt-2">
              <button
                type="button"
                onClick={() => setChangesOpen(!changesOpen)}
                className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-muted/20 transition-colors"
              >
                <span className="text-xs font-medium flex-1">
                  {t.rewrite.changesApplied.length} Change{t.rewrite.changesApplied.length !== 1 ? 's' : ''} Applied
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${changesOpen ? 'rotate-180' : ''}`} />
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: changesOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2 border-t border-border/40">
                    {t.rewrite.changesApplied.map((change, i) => (
                      <div key={i} className="pt-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {change.element}
                        </span>
                        <div className="flex items-start gap-2 mt-1">
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-medium uppercase tracking-wider text-red-500 dark:text-red-400">Before</span>
                            <p className="text-xs text-foreground/60 leading-relaxed mt-0.5 line-through decoration-red-300/50">
                              {change.original}
                            </p>
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-3" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-medium uppercase tracking-wider text-emerald-500 dark:text-emerald-400">After</span>
                            <p className="text-xs text-foreground leading-relaxed mt-0.5 font-medium">
                              {change.transformed}
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 italic">{change.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Alternative Angles ── */}
      {t.alternatives.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Alternative Approaches
          </h4>
          <div className="space-y-2">
            {t.alternatives.map((alt, i) => (
              <div key={i} className="rounded-lg border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20">
                  <span className="text-[10px] font-semibold text-foreground/80">
                    {alt.angle}
                  </span>
                  <CopyButton text={alt.rewrite} />
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-xs text-foreground/85 leading-relaxed">{alt.rewrite}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 italic">Best when: {alt.whenToUse}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Research Citations (collapsible) ── */}
      {t.citations.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <button
            type="button"
            onClick={() => setCitationsOpen(!citationsOpen)}
            className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-muted/20 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-medium flex-1">
              Research Citations ({t.citations.length})
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${citationsOpen ? 'rotate-180' : ''}`} />
          </button>
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: citationsOpen ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div className="px-3 pb-3 space-y-2 border-t border-border/40">
                {t.citations.map((cit, i) => (
                  <div key={i} className="flex items-start gap-2 pt-2">
                    <Quote className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground/80">{cit.sourceName}</p>
                      <ParagraphText text={cit.insight} className="text-xs text-foreground/70 leading-relaxed mt-0.5 italic" />
                      <ParagraphText text={cit.application} className="text-[10px] text-muted-foreground mt-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
