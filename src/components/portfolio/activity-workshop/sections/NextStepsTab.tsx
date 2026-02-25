/**
 * NextStepsTab — Fourth tab in InsightDetailView.
 *
 * Priority-sorted improvement cards with expandable teaching,
 * narrative guidance section, interview tips, red flags.
 * Falls back to quickTip for non-deep activities.
 */
import React, { useState, useCallback } from 'react';
import {
  Target,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  BookOpen,
  Quote,
  Compass,
  BarChart3,
  Eye,
  TrendingUp,
  CheckCircle,
  Brain,
  FlaskConical,
  Diff,
} from 'lucide-react';
import type { ActivityInsightData } from '../insightTypes';
import { PRIORITY_BADGE, getScoreTheme } from '../insightTypes';
import { TierHoverCard } from '../AdmissionsContextCards';
import { ParagraphText, CollapsibleText } from '../RichText';

interface NextStepsTabProps {
  data: ActivityInsightData;
}

/** Priority sort order */
const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

/** Description quality dimension labels */
const DESC_DIMENSION_LABELS: Record<string, string> = {
  specificity: 'Role Ownership',
  impactClarity: 'Evidence of Impact',
  authenticityVoice: 'Differentiation',
  actionLanguage: 'Action Precision',
  quantification: 'Quantification',
};

function NextStepsTabInner({ data }: NextStepsTabProps) {
  // First improvement card expanded by default
  const [expandedIssue, setExpandedIssue] = useState<number | null>(0);

  const toggleIssue = useCallback((idx: number) => {
    setExpandedIssue((prev) => (prev === idx ? null : idx));
  }, []);

  const sortedImprovements = [...data.improvementTeaching].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
  );

  const hasImprovements = sortedImprovements.length > 0;
  const hasNarrativeGuidance = data.narrativeGuidance && (
    data.narrativeGuidance.uniqueAngle ||
    data.narrativeGuidance.connectionToStory ||
    data.narrativeGuidance.howToTalkAboutThis
  );
  const hasInterviewTips = (data.narrativeGuidance?.interviewTips?.length ?? 0) > 0;
  const hasRedFlags = data.redFlags.length > 0;

  // Quick tip fallback for non-deep activities
  if (!hasImprovements && !hasNarrativeGuidance && !hasInterviewTips) {
    return (
      <div className="space-y-4">
        {data.quickTip ? (
          <div className="rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30 p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-foreground/80 leading-relaxed">{data.quickTip}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-6 text-center">
            <Compass className="h-5 w-5 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No specific improvements needed — this activity is in great shape!
            </p>
          </div>
        )}
      </div>
    );
  }

  // Build description dimension entries for the quality bars
  const descBreakdown = data.descriptionScore.breakdown;
  const descDimensions = Object.entries(descBreakdown).map(([key, val]) => ({
    key,
    label: DESC_DIMENSION_LABELS[key] || key,
    score: val.score,
    rationale: data.descriptionScoreRationales?.[key as keyof typeof data.descriptionScoreRationales]?.rationale ?? '',
  }));
  const hasDescBreakdown = descDimensions.some((d) => d.score > 0);

  return (
    <div className="space-y-5">
      {/* ── Portfolio Context ── */}
      {data.descriptionOverallRationale && (
        <div className="flex items-start gap-2 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30 px-3 py-2.5">
          <Eye className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Why This Matters
            </span>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">
              {data.descriptionOverallRationale}
            </p>
          </div>
        </div>
      )}

      {/* ── Description Quality Breakdown ── */}
      {hasDescBreakdown && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Where Your Description Needs Work
          </h4>
          <div className="space-y-3">
            {descDimensions.map((dim) => {
              const theme = getScoreTheme(dim.score);
              const needsWork = dim.score < 7;

              return (
                <div key={dim.key} className={`rounded-lg border p-2.5 ${needsWork ? 'border-amber-200/40 dark:border-amber-800/30 bg-amber-50/10 dark:bg-amber-950/5' : 'border-border/30'}`}>
                  {/* Score bar */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[11px] font-semibold w-32 flex-shrink-0 ${needsWork ? 'text-amber-700 dark:text-amber-300' : 'text-foreground/80'}`}>
                      {dim.label}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${theme.barClass}`}
                        style={{ width: `${Math.min(dim.score * 10, 100)}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-bold tabular-nums w-8 text-right ${theme.textClass}`}>
                      {dim.score}/10
                    </span>
                  </div>
                  {/* Rationale always visible */}
                  {dim.rationale && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {dim.rationale}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Description Strengths ── */}
      {data.descriptionStrengths?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1.5">
            What Your Description Does Well
          </h4>
          <ul className="space-y-0.5">
            {data.descriptionStrengths.map((s, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Improvement Cards ── */}
      {hasImprovements && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Improvements
          </h4>
          <div className="space-y-2">
            {sortedImprovements.map((imp, i) => {
              const priorityCfg = PRIORITY_BADGE[imp.priority] || PRIORITY_BADGE.medium;
              const isExpanded = expandedIssue === i;

              return (
                <div key={i} className="rounded-lg border overflow-hidden">
                  {/* Collapsed header */}
                  <button
                    type="button"
                    onClick={() => toggleIssue(i)}
                    className="w-full flex items-center gap-1.5 p-2.5 text-left hover:bg-muted/20 transition-colors"
                  >
                    <Target className="h-3 w-3 text-amber-500 flex-shrink-0" />
                    <span className="text-sm font-medium flex-1 min-w-0 truncate">{imp.issue}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${priorityCfg.className}`}>
                      {priorityCfg.label}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expanded teaching content */}
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-3 pb-3 space-y-3 border-t border-border/40">
                        {/* Why it matters */}
                        <div className="pt-2">
                          <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            Why this matters
                          </h6>
                          <CollapsibleText
                            text={imp.whyItMatters}
                            previewParagraphs={2}
                            className="text-xs text-foreground/80"
                          />
                        </div>

                        {/* Admissions Psychology — conditional subsection */}
                        {imp.whyItMattersPsychology && (
                          <div>
                            <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                              <Brain className="h-3 w-3 text-purple-500" />
                              Admissions Psychology
                            </h6>
                            <div className="border-l-2 border-purple-500/30 pl-3 py-1.5 bg-purple-500/[0.03] dark:bg-purple-500/[0.05] rounded-r-md">
                              <CollapsibleText
                                text={imp.whyItMattersPsychology}
                                previewParagraphs={2}
                                className="text-xs text-foreground/80"
                              />
                            </div>
                          </div>
                        )}

                        {/* Research Evidence — conditional subsection */}
                        {imp.whyItMattersResearch && (
                          <div>
                            <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                              <FlaskConical className="h-3 w-3 text-blue-500" />
                              Research Evidence
                            </h6>
                            <div className="bg-blue-50/30 dark:bg-blue-950/15 rounded-md px-3 py-2">
                              <ParagraphText text={imp.whyItMattersResearch} className="text-xs text-foreground/80" />
                            </div>
                          </div>
                        )}

                        {/* How to fix */}
                        <div>
                          <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            How to fix
                          </h6>
                          <ParagraphText text={imp.howToFix} className="text-xs text-foreground/80" />
                        </div>

                        {/* Before / After */}
                        {(imp.exampleBefore || imp.exampleAfter) && (
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
                                  {imp.exampleBefore}
                                </p>
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-3" />
                              <div className="flex-1 min-w-0">
                                <span className="text-[9px] font-medium uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                                  After
                                </span>
                                <p className="text-xs text-foreground leading-relaxed mt-0.5 font-medium">
                                  {imp.exampleAfter}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Transformation Analysis — conditional subsection */}
                        {imp.transformationAnalysis && (
                          <div>
                            <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                              <Diff className="h-3 w-3 text-emerald-500" />
                              Transformation Analysis
                            </h6>
                            <div className="rounded-md bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-200/20 dark:border-emerald-800/20 px-3 py-2">
                              <CollapsibleText
                                text={imp.transformationAnalysis}
                                previewParagraphs={2}
                                className="text-xs text-foreground/80"
                              />
                            </div>
                          </div>
                        )}

                        {/* Expert quote */}
                        {imp.whyItMattersQuote && (
                          <div className="flex items-start gap-2 rounded-md bg-muted/30 p-2.5">
                            <Quote className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-xs text-foreground/70 leading-relaxed italic">
                                {imp.whyItMattersQuote}
                              </p>
                              {imp.whyItMattersQuoteSource && (
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  &mdash; {imp.whyItMattersQuoteSource}
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
            })}
          </div>
        </div>
      )}

      {/* ── Description Improvements ── */}
      {data.descriptionImprovements?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
            What to Fix
          </h4>
          <ul className="space-y-0.5">
            {data.descriptionImprovements.map((s, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                <Target className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Upgrade Pathway ── */}
      {data.upgradePathway && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Upgrade Pathway:{' '}
            <TierHoverCard tier={data.upgradePathway.currentTier as 1 | 2 | 3 | 4}>
              <span className="cursor-help">Tier {data.upgradePathway.currentTier}</span>
            </TierHoverCard>
            {' \u2192 '}
            <TierHoverCard tier={data.upgradePathway.targetTier as 1 | 2 | 3 | 4}>
              <span className="cursor-help">Tier {data.upgradePathway.targetTier}</span>
            </TierHoverCard>
          </h4>
          <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Feasibility: {data.upgradePathway.feasibility}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Est. {data.upgradePathway.timeRequired}
              </span>
            </div>
            <ol className="space-y-2">
              {data.upgradePathway.steps.map((step) => (
                <li key={step.step} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step.step}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground/90">{step.action}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{step.milestone} — {step.timeframe}</p>
                  </div>
                </li>
              ))}
            </ol>
            {data.upgradePathway.successIndicators.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">Success indicators:</span>
                <ul className="mt-0.5 space-y-0.5">
                  {data.upgradePathway.successIndicators.map((s, i) => (
                    <li key={i} className="text-[10px] text-foreground/70 flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Narrative Guidance ── */}
      {hasNarrativeGuidance && data.narrativeGuidance && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Narrative Guidance
          </h4>
          <div className="rounded-lg bg-muted/30 p-3 space-y-2">
            {data.narrativeGuidance.uniqueAngle && (
              <div>
                <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">Unique Angle</span>
                <ParagraphText text={data.narrativeGuidance.uniqueAngle} className="text-xs text-foreground/80 mt-0.5" />
              </div>
            )}
            {data.narrativeGuidance.connectionToStory && (
              <div>
                <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">Connection to Story</span>
                <ParagraphText text={data.narrativeGuidance.connectionToStory} className="text-xs text-foreground/80 mt-0.5" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Interview Tips ── */}
      {hasInterviewTips && data.narrativeGuidance && (
        <div className="rounded-lg bg-muted/40 p-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
            <Lightbulb className="h-3 w-3" />
            Interview Tips
          </span>
          <ul className="space-y-0.5">
            {data.narrativeGuidance.interviewTips.map((tip, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                <span className="text-muted-foreground mt-0.5">-</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Red Flags ── */}
      {hasRedFlags && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Red Flags ({data.redFlags.length})
          </h4>
          <div className="space-y-2">
            {data.redFlags.map((flag, i) => (
              <div key={i} className="rounded-lg border border-red-200/40 dark:border-red-800/30 bg-red-50/30 dark:bg-red-950/10 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-red-700 dark:text-red-300">{flag.flag}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                    {flag.severity}
                  </span>
                </div>
                {flag.evidence && (
                  <p className="text-xs text-foreground/70 leading-relaxed mb-1">
                    {flag.evidence}
                  </p>
                )}
                {flag.implication && (
                  <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed italic">
                    Impact: {flag.implication}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick tip for non-deep activities with some improvements */}
      {data.quickTip && !hasImprovements && (
        <div className="rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30 p-2.5">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-foreground/80 leading-relaxed">{data.quickTip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export const NextStepsTab = React.memo(NextStepsTabInner);
