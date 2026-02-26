/**
 * ActivityScoreDashboard — Bento layout with Master-Detail takeover.
 *
 * Layout:
 *   Left (~300px):  Holographic combined score + persona insight (OverallScoreWidget)
 *   Right (flex):   MetricsPanel with grid ↔ detail takeover via layoutId
 *
 * No tabs, no accordions. Both Activity and Description columns are visible
 * simultaneously. Clicking any metric triggers a full-panel focus view.
 */
import React from 'react';
import { motion } from 'motion/react';
import type { ActivityInsightData } from '@/components/portfolio/activity-workshop/insightTypes';
import { OverallScoreWidget } from './OverallScoreWidget';
import { MetricsPanel, type StatItem } from './MetricsPanel';

// ============================================================================
// TYPES
// ============================================================================

interface ActivityScoreDashboardProps {
  data: ActivityInsightData;
}

// ============================================================================
// HELPERS — map ActivityInsightData → StatItem[] with category
// ============================================================================

function buildActivityStats(data: ActivityInsightData): StatItem[] {
  const r = data.activityScoreRationales;

  return [
    {
      id: 'act-tier',
      label: 'Tier Assessment',
      score: data.activityScore.breakdown.tierAssessment.score,
      maxScore: 10,
      category: 'activity',
      description: r?.tierAssessment.rationale ?? '',
      badges: r?.tierAssessment.tier != null ? (
        <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/30 rounded px-1.5 py-0.5">
          Tier {r.tierAssessment.tier}
        </span>
      ) : undefined,
    },
    {
      id: 'act-rec',
      label: 'Recognition',
      score: data.activityScore.breakdown.recognitionLevel.score,
      maxScore: 10,
      category: 'activity',
      description: r?.recognitionLevel.rationale ?? '',
      badges: r?.recognitionLevel.level ? (
        <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/30 rounded px-1.5 py-0.5">
          {r.recognitionLevel.level}
        </span>
      ) : undefined,
    },
    {
      id: 'act-lead',
      label: 'Leadership/Impact',
      score: data.activityScore.breakdown.leadershipImpact.score,
      maxScore: 10,
      category: 'activity',
      description: r?.leadershipImpact.rationale ?? '',
      badges: r?.leadershipImpact ? (
        <div className="flex flex-wrap gap-1">
          {r.leadershipImpact.role && (
            <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/30 rounded px-1.5 py-0.5">
              {r.leadershipImpact.role}
            </span>
          )}
          {r.leadershipImpact.impactScope && (
            <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/30 rounded px-1.5 py-0.5">
              {r.leadershipImpact.impactScope}
            </span>
          )}
          {!r.leadershipImpact.isApplicable && (
            <span className="text-[10px] font-medium text-amber-600/60 dark:text-amber-400/60 bg-amber-500/10 rounded px-1.5 py-0.5">
              N/A for this activity
            </span>
          )}
        </div>
      ) : undefined,
    },
    {
      id: 'act-comm',
      label: 'Community/Character',
      score: data.activityScore.breakdown.communityCharacter.score,
      maxScore: 10,
      category: 'activity',
      description: r?.communityCharacter.rationale ?? '',
      badges: r?.communityCharacter ? (
        <div className="flex flex-wrap gap-1">
          {r.communityCharacter.primaryTrait && (
            <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/30 rounded px-1.5 py-0.5">
              {r.communityCharacter.primaryTrait}
            </span>
          )}
          {r.communityCharacter.authenticitySignal && (
            <span className="text-[10px] font-medium text-green-600/60 dark:text-green-400/60 bg-green-500/10 rounded px-1.5 py-0.5">
              {r.communityCharacter.authenticitySignal.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      ) : undefined,
    },
    {
      id: 'act-commit',
      label: 'Commitment',
      score: data.activityScore.breakdown.commitmentProgression.score,
      maxScore: 10,
      category: 'activity',
      description: r?.commitmentProgression.rationale ?? '',
      badges: r?.commitmentProgression ? (
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/30 rounded px-1.5 py-0.5">
            {r.commitmentProgression.years} year{r.commitmentProgression.years !== 1 ? 's' : ''}
          </span>
          <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 ${
            r.commitmentProgression.showsProgression
              ? 'text-green-600/60 dark:text-green-400/60 bg-green-500/10'
              : 'text-amber-600/60 dark:text-amber-400/60 bg-amber-500/10'
          }`}>
            {r.commitmentProgression.showsProgression ? 'Shows progression' : 'Limited progression'}
          </span>
        </div>
      ) : undefined,
    },
  ];
}

function buildNarrativeStats(data: ActivityInsightData): StatItem[] {
  const r = data.descriptionScoreRationales;

  return [
    {
      id: 'desc-spec',
      label: 'Role Ownership',
      score: data.descriptionScore.breakdown.specificity.score,
      maxScore: 10,
      category: 'narrative',
      description: r?.specificity.rationale ?? '',
    },
    {
      id: 'desc-impact',
      label: 'Evidence of Impact',
      score: data.descriptionScore.breakdown.impactClarity.score,
      maxScore: 10,
      category: 'narrative',
      description: r?.impactClarity.rationale ?? '',
    },
    {
      id: 'desc-auth',
      label: 'Differentiation',
      score: data.descriptionScore.breakdown.authenticityVoice.score,
      maxScore: 10,
      category: 'narrative',
      description: r?.authenticityVoice.rationale ?? '',
    },
    {
      id: 'desc-action',
      label: 'Action Precision',
      score: data.descriptionScore.breakdown.actionLanguage.score,
      maxScore: 10,
      category: 'narrative',
      description: r?.actionLanguage.rationale ?? '',
    },
    {
      id: 'desc-quant',
      label: 'Quantification',
      score: data.descriptionScore.breakdown.quantification.score,
      maxScore: 10,
      category: 'narrative',
      description: r?.quantification.rationale ?? '',
    },
  ];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ActivityScoreDashboard: React.FC<ActivityScoreDashboardProps> = ({ data }) => {
  const activityStats = buildActivityStats(data);
  const narrativeStats = buildNarrativeStats(data);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full flex flex-col lg:flex-row gap-4 items-stretch"
    >
      {/* Left Column: Holographic Score Identity — fixed width, stable during view swaps */}
      <div className="w-full lg:w-[280px] xl:w-[300px] flex-shrink-0">
        <OverallScoreWidget data={data} />
      </div>

      {/* Right Column: Metrics with Master-Detail Takeover */}
      <div className="flex-1 min-w-0">
        <MetricsPanel
          activityStats={activityStats}
          narrativeStats={narrativeStats}
        />
      </div>
    </motion.div>
  );
};
