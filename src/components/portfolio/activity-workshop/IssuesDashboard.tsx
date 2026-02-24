/**
 * IssuesDashboard — Cross-activity issues aggregation panel.
 *
 * Renders above the activity card list when no activity is selected.
 * Collapsible. Sections:
 *   1. Description Readiness Tracker
 *   2. All Issues (aggregated from all activities' improvementTeaching)
 *   3. Competitive Gaps
 *   4. Strategic Summary
 */
import React, { useState, useCallback } from 'react';
import {
  ChevronDown,
  CheckCircle,
  XCircle,
  Target,
  AlertTriangle,
  Compass,
  TrendingUp,
  ArrowRight,
  Quote,
  LayoutDashboard,
} from 'lucide-react';
import type { ActivityWorkshopPipelineResult } from '../../../services/portfolioStrategy/services/activityWorkshop/types';
import type { ActivityInsightData } from './insightTypes';
import { PRIORITY_BADGE } from './insightTypes';
import { activityTitles } from './mockData';

interface IssuesDashboardProps {
  data: ActivityWorkshopPipelineResult;
  insights: ActivityInsightData[];
}

/** Priority sort order */
const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

const SEVERITY_BADGE: Record<string, { className: string; label: string }> = {
  critical: { className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300', label: 'Critical' },
  significant: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', label: 'Significant' },
  minor: { className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', label: 'Minor' },
  moderate: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', label: 'Moderate' },
};

export function IssuesDashboard({ data, insights }: IssuesDashboardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  const toggleOpen = useCallback(() => setIsOpen((p) => !p), []);
  const toggleIssue = useCallback((idx: number) => {
    setExpandedIssue((prev) => (prev === idx ? null : idx));
  }, []);

  // ── Data extraction ──

  // 1. Description readiness
  const readiness = data.stage1.commonAppReadiness.descriptionReadiness;
  const readyCount = readiness.filter((r) => r.ready).length;
  const totalCount = readiness.length;

  // 2. Aggregated issues from all activities
  const allIssues = insights.flatMap((insight) =>
    insight.improvementTeaching.map((imp) => ({
      activityId: insight.activityId,
      activityTitle: insight.title,
      ...imp,
    }))
  ).sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));

  // 3. Competitive gaps
  const gaps = data.stage1.gapsIdentified;

  // 4. Strategic summary
  const portfolio = data.stage2.portfolioTeaching;
  const teachingNeeds = data.stage1.portfolioTeachingNeeds;

  const hasContent = readiness.length > 0 || allIssues.length > 0 || gaps.length > 0;
  if (!hasContent) return null;

  return (
    <div className="rounded-xl border bg-card/90 backdrop-blur-sm overflow-hidden mb-3">
      {/* ── Collapsible Header ── */}
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <LayoutDashboard className="h-4 w-4 text-indigo-500 flex-shrink-0" />
        <span className="text-sm font-semibold flex-1">Issues Dashboard</span>
        <span className="text-[10px] text-muted-foreground">
          {allIssues.length} issue{allIssues.length !== 1 ? 's' : ''} across {insights.filter((i) => i.improvementTeaching.length > 0).length} activities
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Collapsible Body ── */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-5 border-t border-border/40">

            {/* ── 1. Description Readiness Tracker ── */}
            {readiness.length > 0 && (
              <div className="pt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Description Readiness
                </h4>

                {/* Progress bar */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        readyCount === totalCount
                          ? 'bg-green-500'
                          : readyCount > 0
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${totalCount > 0 ? (readyCount / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                    {readyCount} of {totalCount} ready
                  </span>
                </div>

                {/* Per-activity rows */}
                <div className="space-y-1">
                  {readiness.map((r) => (
                    <div key={r.activityId} className="flex items-center gap-2 text-xs">
                      {r.ready ? (
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                      )}
                      <span className="font-medium truncate flex-1 min-w-0">
                        {activityTitles[r.activityId] || r.activityId}
                      </span>
                      {!r.ready && r.issues.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {r.issues.slice(0, 2).map((issue, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                              {issue}
                            </span>
                          ))}
                          {r.issues.length > 2 && (
                            <span className="text-[9px] text-muted-foreground">
                              +{r.issues.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 2. All Issues (aggregated) ── */}
            {allIssues.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  All Issues
                </h4>
                <div className="space-y-1.5">
                  {allIssues.map((issue, i) => {
                    const priorityCfg = PRIORITY_BADGE[issue.priority] || PRIORITY_BADGE.medium;
                    const isExpanded = expandedIssue === i;

                    return (
                      <div key={i} className="rounded-lg border overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleIssue(i)}
                          className="w-full flex items-center gap-1.5 p-2 text-left hover:bg-muted/20 transition-colors"
                        >
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex-shrink-0 truncate max-w-[100px]">
                            {issue.activityTitle}
                          </span>
                          <span className="text-xs font-medium flex-1 min-w-0 truncate">{issue.issue}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${priorityCfg.className}`}>
                            {priorityCfg.label}
                          </span>
                          <ChevronDown className={`h-3 w-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Expanded teaching */}
                        <div
                          className="grid transition-[grid-template-rows] duration-300 ease-out"
                          style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                        >
                          <div className="overflow-hidden">
                            <div className="px-3 pb-2.5 space-y-2 border-t border-border/40">
                              {issue.whyItMatters && (
                                <div className="pt-2">
                                  <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                                    Why this matters
                                  </h6>
                                  <p className="text-xs text-foreground/80 leading-relaxed">{issue.whyItMatters}</p>
                                </div>
                              )}
                              {issue.howToFix && (
                                <div>
                                  <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                                    How to fix
                                  </h6>
                                  <p className="text-xs text-foreground/80 leading-relaxed">{issue.howToFix}</p>
                                </div>
                              )}
                              {(issue.exampleBefore || issue.exampleAfter) && (
                                <div className="rounded-md bg-muted/40 p-2 space-y-1.5">
                                  <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Example</h6>
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[9px] font-medium uppercase tracking-wider text-red-500">Before</span>
                                      <p className="text-xs text-foreground/60 leading-relaxed mt-0.5 line-through decoration-red-300/50">{issue.exampleBefore}</p>
                                    </div>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-3" />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[9px] font-medium uppercase tracking-wider text-emerald-500">After</span>
                                      <p className="text-xs text-foreground leading-relaxed mt-0.5 font-medium">{issue.exampleAfter}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {issue.whyItMattersQuote && (
                                <div className="flex items-start gap-2 rounded-md bg-muted/30 p-2">
                                  <Quote className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <p className="text-xs text-foreground/70 leading-relaxed italic">
                                      &ldquo;{issue.whyItMattersQuote}&rdquo;
                                    </p>
                                    {issue.whyItMattersQuoteSource && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5">
                                        &mdash; {issue.whyItMattersQuoteSource}
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

            {/* ── 3. Competitive Gaps ── */}
            {gaps.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Competitive Gaps
                </h4>
                <div className="space-y-2">
                  {gaps.map((g, i) => {
                    const sevCfg = SEVERITY_BADGE[g.severity] || SEVERITY_BADGE.minor;
                    return (
                      <div key={i} className="rounded-lg border p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-medium flex-1 min-w-0">{g.gap}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${sevCfg.className}`}>
                            {sevCfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{g.impactOnApplication}</p>
                        {g.affectedSchools.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {g.affectedSchools.map((s, j) => (
                              <span key={j} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── 4. Strategic Summary ── */}
            {(teachingNeeds || portfolio) && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5" />
                  Strategic Summary
                </h4>
                <div className="rounded-lg bg-muted/30 p-3 space-y-2.5">
                  {/* Primary issue */}
                  {teachingNeeds?.primaryIssue && (
                    <div className="flex items-start gap-2">
                      <Target className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">{teachingNeeds.primaryIssue}</span>
                          {teachingNeeds.primaryIssueSeverity && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                              (SEVERITY_BADGE[teachingNeeds.primaryIssueSeverity] || SEVERITY_BADGE.minor).className
                            }`}>
                              {teachingNeeds.primaryIssueSeverity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Strategic direction */}
                  {portfolio?.strategicDirection && (
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-foreground/80 leading-relaxed">{portfolio.strategicDirection}</p>
                    </div>
                  )}

                  {/* Strengths to highlight */}
                  {teachingNeeds?.strengthsToHighlight && teachingNeeds.strengthsToHighlight.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {teachingNeeds.strengthsToHighlight.map((s, i) => (
                        <span key={i} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                          {s}
                        </span>
                      ))}
                    </div>
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
