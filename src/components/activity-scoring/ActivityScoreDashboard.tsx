/**
 * ActivityScoreDashboard — Bento layout with Master-Detail takeover.
 *
 * Layout:
 *   Left (~340px):  Holographic scanner card + persona insight (OverviewPanel)
 *   Right (flex):   MetricsPanel with grid ↔ detail takeover
 *
 * No tabs, no accordions. Both Activity and Description columns are visible
 * simultaneously. Clicking any metric triggers a full-panel focus view.
 */
import React from 'react';
import { motion } from 'motion/react';
import type { ActivityInsightData } from '@/components/portfolio/activity-workshop/insightTypes';
import { OverviewPanel } from './OverviewPanel';
import { MetricsPanel, type StatItem } from './MetricsPanel';

// ============================================================================
// TYPES
// ============================================================================

interface ActivityScoreDashboardProps {
  data: ActivityInsightData;
}

// ============================================================================
// BADGE COLOR HELPERS — quality-coded pills
// ============================================================================

const PILL = 'text-[10px] font-semibold rounded-full px-2 py-0.5 border' as const;

/** Tier 1 = signature gradient glow, T2 = green, T3 = amber, T4 = red */
function TierBadge({ tier }: { tier: number }) {
  if (tier === 1) {
    return (
      <span
        className={`${PILL} text-white/95 border-transparent`}
        style={{
          background: 'linear-gradient(135deg, hsl(250 70% 55%), hsl(280 80% 60%), hsl(185 75% 50%))',
          boxShadow: '0 0 8px rgba(139,92,246,0.35), 0 0 4px rgba(34,211,238,0.25)',
        }}
      >
        Tier 1
      </span>
    );
  }
  const cls: Record<number, string> = {
    2: 'text-green-700 dark:text-green-300 bg-green-500/12 border-green-500/20',
    3: 'text-amber-700 dark:text-amber-300 bg-amber-500/12 border-amber-500/20',
    4: 'text-red-700 dark:text-red-300 bg-red-500/12 border-red-500/20',
  };
  return (
    <span className={`${PILL} ${cls[tier] ?? cls[4]}`}>
      Tier {tier}
    </span>
  );
}

/** Score-based pill: ≥8 green, ≥6 teal, ≥4 amber, <4 red */
function scorePillClass(score: number): string {
  if (score >= 8) return 'text-green-700 dark:text-green-300 bg-green-500/12 border-green-500/20';
  if (score >= 6) return 'text-teal-700 dark:text-teal-300 bg-teal-500/12 border-teal-500/20';
  if (score >= 4) return 'text-amber-700 dark:text-amber-300 bg-amber-500/12 border-amber-500/20';
  return 'text-red-700 dark:text-red-300 bg-red-500/12 border-red-500/20';
}

/** Years-based pill: 4+ green, 2-3 teal, 1 amber */
function yearsPillClass(years: number): string {
  if (years >= 4) return 'text-green-700 dark:text-green-300 bg-green-500/12 border-green-500/20';
  if (years >= 2) return 'text-teal-700 dark:text-teal-300 bg-teal-500/12 border-teal-500/20';
  return 'text-amber-700 dark:text-amber-300 bg-amber-500/12 border-amber-500/20';
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
        <TierBadge tier={r.tierAssessment.tier} />
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
        <span className={`${PILL} ${scorePillClass(data.activityScore.breakdown.recognitionLevel.score)}`}>
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
            <span className={`${PILL} ${scorePillClass(data.activityScore.breakdown.leadershipImpact.score)}`}>
              {r.leadershipImpact.role}
            </span>
          )}
          {r.leadershipImpact.impactScope && (
            <span className={`${PILL} ${scorePillClass(data.activityScore.breakdown.leadershipImpact.score)}`}>
              {r.leadershipImpact.impactScope}
            </span>
          )}
          {!r.leadershipImpact.isApplicable && (
            <span className={`${PILL} text-amber-700 dark:text-amber-300 bg-amber-500/12 border-amber-500/20`}>
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
            <span className={`${PILL} ${scorePillClass(data.activityScore.breakdown.communityCharacter.score)}`}>
              {r.communityCharacter.primaryTrait}
            </span>
          )}
          {r.communityCharacter.authenticitySignal && (
            <span className={`${PILL} text-green-700 dark:text-green-300 bg-green-500/12 border-green-500/20`}>
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
          <span className={`${PILL} ${yearsPillClass(r.commitmentProgression.years)}`}>
            {r.commitmentProgression.years} year{r.commitmentProgression.years !== 1 ? 's' : ''}
          </span>
          <span className={`${PILL} ${
            r.commitmentProgression.showsProgression
              ? 'text-green-700 dark:text-green-300 bg-green-500/12 border-green-500/20'
              : 'text-amber-700 dark:text-amber-300 bg-amber-500/12 border-amber-500/20'
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
      className="w-full flex flex-col lg:flex-row gap-4 lg:items-stretch"
    >
      {/* Left Column: Holographic Score Card — fixed width, sets the row height */}
      <div className="w-full lg:w-[340px] flex-shrink-0 lg:h-auto flex">
        <OverviewPanel data={data} />
      </div>

      {/* Right Column: Metrics — stretches to match left panel height */}
      <div className="flex-1 min-w-0 flex">
        <MetricsPanel
          activityStats={activityStats}
          narrativeStats={narrativeStats}
        />
      </div>
    </motion.div>
  );
};
