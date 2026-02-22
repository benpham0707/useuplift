/**
 * StrengthsTab — Second tab in InsightDetailView.
 *
 * Wraps the existing WhatsWorking carousel and adds:
 *   - Story fit section (role badge + centrality bar + narrative guidance)
 *   - Narrative threads + elevations
 *   - Essay worthiness callout + unique angles
 *   - School fit badges
 */
import React from 'react';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  TrendingUp,
  FileText,
} from 'lucide-react';
import type { ActivityInsightData } from '../insightTypes';
import {
  getRoleConfig,
  getRoleBadgeClass,
  ELEVATION_STRENGTH_BADGE,
} from '../insightTypes';
import { WhatsWorking } from './WhatsWorking';
import { ParagraphText } from '../RichText';

interface StrengthsTabProps {
  data: ActivityInsightData;
}

export function StrengthsTab({ data }: StrengthsTabProps) {
  const roleCfg = getRoleConfig(data.storyRole);
  const showEssayCallout = data.essayWorthiness === 'excellent' || data.essayWorthiness === 'good';

  return (
    <div className="space-y-5">
      {/* ── What's Working (existing carousel) ── */}
      <WhatsWorking
        greenFlags={data.greenFlags}
        strengthTeaching={data.strengthTeaching}
        accentColor={roleCfg.accent}
      />

      {/* ── Story Fit Section ── */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          How This Fits Your Story
        </h4>
        <div className="space-y-3">
          {/* Story role + centrality bar */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getRoleBadgeClass(data.storyRole)}`}>
              {roleCfg.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${roleCfg.accent}`}
                style={{ width: `${data.centralityScore}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {data.centralityScore}/100
            </span>
          </div>

          {/* Narrative guidance */}
          {data.narrativeGuidance && (
            <div className="rounded-lg bg-muted/40 p-2.5">
              <div className="flex items-start gap-2">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <ParagraphText text={data.narrativeGuidance.howToTalkAboutThis} className="text-xs text-foreground/80 leading-relaxed" />
              </div>
            </div>
          )}

          {/* Narrative threads */}
          {data.narrativeThreads.length > 0 && (
            <div>
              <span className="text-[10px] font-medium text-muted-foreground">
                Narrative threads:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.narrativeThreads.map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Elevations */}
          {data.elevations.length > 0 && (
            <div className="space-y-1.5">
              {data.elevations.map((e, i) => (
                <div key={i} className="rounded-lg border border-dashed p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3 w-3 text-purple-500" />
                    <span className="text-xs font-medium">
                      Elevated by {e.elevatingTitle}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${ELEVATION_STRENGTH_BADGE[e.strength] || ELEVATION_STRENGTH_BADGE.moderate}`}>
                      {e.strength}
                    </span>
                  </div>
                  <ParagraphText text={e.mechanism} className="text-xs text-muted-foreground leading-relaxed" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Essay Worthiness Callout ── */}
      {showEssayCallout && (
        <div className="rounded-lg bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/30 dark:border-violet-800/30 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
              Essay-Worthy Activity
            </span>
          </div>
          {data.uniqueAngles.length > 0 && (
            <div className="mt-2 space-y-1">
              <span className="text-[10px] font-medium text-muted-foreground">Unique angles:</span>
              <ul className="space-y-0.5">
                {data.uniqueAngles.map((angle, i) => (
                  <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                    <span className="text-violet-400 mt-0.5">-</span>
                    {angle}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Narrative Analysis ── */}
      {(data.narrativeStorytelling || data.narrativeEmotionalResonance || data.narrativeGrowthArc) && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Narrative Analysis
          </h4>
          <div className="space-y-2">
            {data.narrativeStorytelling && (
              <div className="rounded-lg bg-muted/30 p-2.5">
                <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">Storytelling Value</span>
                <ParagraphText text={data.narrativeStorytelling} className="text-xs text-foreground/80 leading-relaxed mt-0.5" />
              </div>
            )}
            {data.narrativeEmotionalResonance && (
              <div className="rounded-lg bg-muted/30 p-2.5">
                <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">Emotional Resonance</span>
                <ParagraphText text={data.narrativeEmotionalResonance} className="text-xs text-foreground/80 leading-relaxed mt-0.5" />
              </div>
            )}
            {data.narrativeGrowthArc && (
              <div className="rounded-lg bg-muted/30 p-2.5">
                <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">Growth Arc</span>
                <ParagraphText text={data.narrativeGrowthArc} className="text-xs text-foreground/80 leading-relaxed mt-0.5" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── School Fit Badges ── */}
      {data.bestFitSchoolTypes.length > 0 && (
        <div>
          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            Best fit:
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {data.bestFitSchoolTypes.map((s, i) => (
              <span
                key={i}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              >
                {s}
              </span>
            ))}
          </div>
          {(data.schoolFitAlignedValues?.length > 0 || data.schoolFitConcerns?.length > 0) && (
            <div className="mt-2 space-y-2">
              {data.schoolFitAlignedValues?.length > 0 && (
                <div>
                  <span className="text-[10px] font-medium text-green-600 dark:text-green-400">Values That Align:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {data.schoolFitAlignedValues.map((v, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">{v}</span>
                    ))}
                  </div>
                </div>
              )}
              {data.schoolFitConcerns?.length > 0 && (
                <div>
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">Potential Concerns:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {data.schoolFitConcerns.map((c, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Improvement Paths ── */}
      {data.improvementPaths.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            How to Level Up
          </h4>
          <ol className="space-y-1.5 list-none">
            {data.improvementPaths.map((path, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {path}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Score Assessment ── */}
      {(data.activityOverallRationale || data.combinedScoreRationale) && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Score Assessment
          </h4>
          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            {data.activityOverallRationale && (
              <ParagraphText text={data.activityOverallRationale} className="text-xs text-foreground/80 leading-relaxed" />
            )}
            {data.combinedScoreRationale && data.combinedScoreRationale !== data.activityOverallRationale && (
              <div className="border-t border-border/30 pt-2">
                <ParagraphText text={data.combinedScoreRationale} className="text-xs text-muted-foreground leading-relaxed" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
