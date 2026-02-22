/**
 * CelebrationTab — First tab in InsightDetailView.
 *
 * Warm welcome: role-gradient celebration banner with headline + strength bullets,
 * ScoreBreakdown component, top strength/improvement mini-cards,
 * collapsible tier explanation, leadership & impact, compact green flags.
 */
import React, { useState, useCallback } from 'react';
import {
  CheckCircle,
  Sparkles,
  Eye,
  Shield,
  ChevronDown,
  TrendingUp,
  Award,
  Users,
  Target,
} from 'lucide-react';
import type { ActivityInsightData } from '../insightTypes';
import { getRoleConfig, TIER_LABELS } from '../insightTypes';
import { ScoreBreakdown } from './ScoreBreakdown';
import { ParagraphText } from '../RichText';

interface CelebrationTabProps {
  data: ActivityInsightData;
}

export function CelebrationTab({ data }: CelebrationTabProps) {
  const roleCfg = getRoleConfig(data.storyRole);
  const headline = data.celebrationHeadline || data.quickCelebration;
  const hasDeepContent = data.teachingDepth !== 'quick';
  const [tierOpen, setTierOpen] = useState(true);

  const toggleTier = useCallback(() => {
    setTierOpen((prev) => !prev);
  }, []);

  return (
    <div className="space-y-5">
      {/* ── Celebration Banner ── */}
      <div className={`rounded-xl px-4 py-4 bg-gradient-to-r ${roleCfg.bannerLight} ${roleCfg.bannerDark}`}>
        {headline && (
          <p className={`text-sm font-semibold ${roleCfg.textAccent}`}>
            {headline}
          </p>
        )}
        {data.archetype && (
          <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 mt-1">
            {data.archetype}
          </span>
        )}
        {data.celebrationStrengths.length > 0 && (
          <ul className="mt-2 space-y-1">
            {data.celebrationStrengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        )}

        {/* Quick celebration fallback */}
        {!headline && data.quickCelebration && (
          <p className="text-sm text-foreground/80">{data.quickCelebration}</p>
        )}

        {/* Empty state */}
        {!headline && !data.quickCelebration && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm">Analysis in progress — celebration details will appear here.</p>
          </div>
        )}
      </div>

      {/* ── Story Essence ── */}
      {data.storyEssence && (
        <div className="rounded-lg bg-muted/20 border-l-4 border-l-indigo-400 px-3 py-2">
          <p className="text-xs text-foreground/70 italic leading-relaxed">
            Who you are: {data.storyEssence}
          </p>
        </div>
      )}

      {/* ── Summary callout ── */}
      {data.summaryOneLiner && (
        <div className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2.5">
          <Eye className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            What admissions officers see: &ldquo;{data.summaryOneLiner}&rdquo;
          </p>
        </div>
      )}

      {/* ── Score Breakdown ── */}
      {hasDeepContent && (
        <ScoreBreakdown
          activityScore={data.activityScore}
          descriptionScore={data.descriptionScore}
          combinedScore={data.combinedScore}
          accentColor={roleCfg.accent}
          activityScoreRationales={data.activityScoreRationales}
          descriptionScoreRationales={data.descriptionScoreRationales}
          tierExplanation={data.tierExplanation}
          activityOverallRationale={data.activityOverallRationale}
          descriptionOverallRationale={data.descriptionOverallRationale}
          combinedScoreRationale={data.combinedScoreRationale}
        />
      )}

      {/* ── Top Strength / Top Improvement Mini-Cards ── */}
      {(data.topStrength || data.topImprovement) && (
        <div className="grid grid-cols-2 gap-2">
          {data.topStrength && (
            <div className="rounded-lg border border-green-200/40 dark:border-green-800/30 bg-green-50/30 dark:bg-green-950/10 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                  Top Strength
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.topStrength}</p>
            </div>
          )}
          {data.topImprovement && (
            <div className="rounded-lg border border-amber-200/40 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-950/10 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="h-3 w-3 text-amber-500 flex-shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Top Improvement
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.topImprovement}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tier Explanation (collapsible) ── */}
      {data.tierExplanation && (data.tierExplanation.whatMakesThisTier || data.tierExplanation.whatWouldChangeIt) && (
        <div className="rounded-lg border overflow-hidden">
          <button
            type="button"
            onClick={toggleTier}
            className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/20 transition-colors"
          >
            <Shield className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
            <span className="text-xs font-semibold flex-1">
              {TIER_LABELS[data.tier] || 'Tier'} Explained
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${tierOpen ? 'rotate-180' : ''}`} />
          </button>

          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: tierOpen ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div className="px-3 pb-3 space-y-3 border-t border-border/40">
                {/* What makes this tier */}
                {data.tierExplanation.whatMakesThisTier && (
                  <div className="pt-2">
                    <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      What makes this tier
                    </h6>
                    <ParagraphText text={data.tierExplanation.whatMakesThisTier} className="text-xs text-foreground/80 leading-relaxed" />
                  </div>
                )}

                {/* Comparison Benchmarks */}
                {data.comparisonBenchmarks && (
                  <div className="pt-2">
                    <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      How You Compare
                    </h6>
                    <div className="space-y-1">
                      <div className="flex items-start gap-2 text-xs">
                        <span className="text-muted-foreground w-16 flex-shrink-0">Similar to:</span>
                        <span className="text-foreground/80">{data.comparisonBenchmarks.similarTo}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <span className="text-green-600 dark:text-green-400 w-16 flex-shrink-0">Above:</span>
                        <span className="text-foreground/80">{data.comparisonBenchmarks.above}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <span className="text-amber-600 dark:text-amber-400 w-16 flex-shrink-0">Below:</span>
                        <span className="text-foreground/80">{data.comparisonBenchmarks.below}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tier Justification */}
                {data.tierJustification && (
                  <div className="pt-2">
                    <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Tier Rationale
                    </h6>
                    <ParagraphText text={data.tierJustification} className="text-xs text-foreground/80 leading-relaxed" />
                  </div>
                )}

                {/* What would change it */}
                {data.tierExplanation.whatWouldChangeIt && (
                  <div className="rounded-md bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30 p-2.5">
                    <h6 className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                      How to move up
                    </h6>
                    <ParagraphText text={data.tierExplanation.whatWouldChangeIt} className="text-xs text-foreground/80 leading-relaxed" />
                  </div>
                )}

                {/* Benchmarks */}
                {data.tierExplanation.benchmarks.length > 0 && (
                  <div>
                    <h6 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Benchmarks
                    </h6>
                    <div className="space-y-1.5">
                      {data.tierExplanation.benchmarks.map((b, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className={`mt-0.5 flex-shrink-0 h-2 w-2 rounded-full ${b.studentMeets ? 'bg-green-500' : 'bg-amber-500'}`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-muted-foreground">
                              T{b.tier}:
                            </span>{' '}
                            <span className="text-foreground/80">{b.benchmark}</span>
                            {b.gap && (
                              <span className="text-amber-600 dark:text-amber-400 ml-1">
                                — {b.gap}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Leadership & Impact ── */}
      {data.leadershipType && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" />
            Leadership & Impact
          </h4>
          <div className="space-y-2">
            {/* Badge row */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {data.leadershipType}
              </span>
              {data.impactScope && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-0.5">
                  <Users className="h-2.5 w-2.5" />
                  {data.impactScope}
                </span>
              )}
              {data.impactType && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {data.impactType}
                </span>
              )}
            </div>

            {/* Impact narrative */}
            {data.impactNarrative && (
              <div className="rounded-lg bg-muted/30 p-2.5">
                <ParagraphText text={data.impactNarrative} className="text-xs text-foreground/80 leading-relaxed" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Green Flags (expanded with evidence + admissions value) ── */}
      {data.greenFlags.length > 0 && (
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Green Flags ({data.greenFlags.length})
          </span>
          <div className="space-y-2">
            {data.greenFlags.map((flag, i) => (
              <div
                key={i}
                className="rounded-lg border border-green-200/40 dark:border-green-800/30 bg-green-50/20 dark:bg-green-950/10 p-2.5"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-medium text-green-700 dark:text-green-300">
                      {flag.flag}
                    </p>
                    {flag.evidence && (
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        {flag.evidence}
                      </p>
                    )}
                    {flag.admissionsValue && (
                      <p className="text-[11px] text-green-600/80 dark:text-green-400/80 leading-relaxed italic">
                        Admissions value: {flag.admissionsValue}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
