/**
 * ActivityInsightsList — Renders ordered activity insight cards from pipeline data.
 *
 * Merges data from ALL pipeline stages into per-activity insights:
 *   stage0 — story roles, narrative threads
 *   stage1 — analysis (leadership, impact, narrative potential, school fit)
 *   stage2 — teaching (celebration, improvement, description optimization, narrative guidance)
 *   stage3 — ordered activities, final descriptions
 *   scoring — activity scores, description scores, summary data
 *   finalNarrative — threads, elevations
 *
 * Master-detail pattern: list view (summary cards) → detail view (tabbed sections).
 */

import React, { useState, useCallback } from 'react';
import type { ActivityInsightData } from './insightTypes';
import { InsightSummaryCard } from './InsightSummaryCard';
import { InsightDetailView } from './InsightDetailView';
// IssuesDashboard removed from list view — per-activity context is now in InsightDetailView
import type { ActivityWorkshopPipelineResult } from '../../../services/portfolioStrategy/services/activityWorkshop/types';
import { activityTitles } from './mockData';

interface ActivityInsightsListProps {
  data: ActivityWorkshopPipelineResult;
}

function getTeachingDepth(
  activityId: string,
  candidates: { deepTeachingIds: string[]; mediumTeachingIds: string[]; quickEncouragementIds: string[] }
): 'deep' | 'medium' | 'quick' {
  if (candidates.deepTeachingIds.includes(activityId)) return 'deep';
  if (candidates.mediumTeachingIds.includes(activityId)) return 'medium';
  return 'quick';
}

function buildInsights(data: ActivityWorkshopPipelineResult): ActivityInsightData[] {
  const { stage0, stage1, stage2, stage3, scoring, finalNarrative } = data;

  return stage3.orderedActivities.map((ordered) => {
    const id = ordered.activityId;
    const s1 = stage1.activities[id];
    const storyRole = stage0.activityStoryRoles.find((r) => r.activityId === id);
    const scoreData = scoring?.activityScores.find((s) => s.activityId === id);

    // Stage 2: Teaching data
    const teachingEntry = stage2.teachingDelivered.find((t) => t.activityId === id);
    const teaching = teachingEntry?.teaching;
    const quickEnc = stage2.quickEncouragements.find((q) => q.activityId === id);

    // Final narrative: threads and elevations for this activity
    const threads = (finalNarrative?.threads ?? []).filter((t) => t.activityIds.includes(id));
    const elevations = (finalNarrative?.elevations ?? []).filter(
      (e) => e.elevatedActivityId === id
    );

    // Description optimization
    const descOpt = teaching?.descriptionOptimization
      ? {
          original: teaching.descriptionOptimization.originalDescription,
          optimized: teaching.descriptionOptimization.optimizedDescription,
          originalCharCount: teaching.descriptionOptimization.originalDescription.length,
          optimizedCharCount: teaching.descriptionOptimization.characterCount,
          changes: teaching.descriptionOptimization.changesExplained.map((c) => ({
            change: c.change,
            reason: c.reason,
          })),
        }
      : null;

    // Narrative guidance
    const narGuidance = teaching?.narrativeGuidance
      ? {
          howToTalkAboutThis: teaching.narrativeGuidance.howToTalkAboutThis?.text ?? '',
          uniqueAngle: teaching.narrativeGuidance.uniqueAngle ?? '',
          connectionToStory: teaching.narrativeGuidance.connectionToStory ?? '',
          interviewTips: teaching.narrativeGuidance.interviewTips ?? [],
        }
      : null;

    return {
      activityId: id,
      title: activityTitles[id] || scoreData?.activityTitle || id,
      rank: ordered.rank,
      combinedScore: scoreData?.combinedScore.total ?? 0,
      activityScore: scoreData?.activityScore ?? {
        total: 0,
        breakdown: {
          tierAssessment: { score: 0, weight: 0.3 },
          recognitionLevel: { score: 0, weight: 0.25 },
          commitmentProgression: { score: 0, weight: 0.175 },
          communityCharacter: { score: 0, weight: 0.15 },
          leadershipImpact: { score: 0, weight: 0.125 },
        },
      },
      descriptionScore: scoreData?.descriptionScore ?? {
        total: 0,
        breakdown: {
          specificity: { score: 0 },
          impactClarity: { score: 0 },
          authenticityVoice: { score: 0 },
          actionLanguage: { score: 0 },
          quantification: { score: 0 },
        },
      },
      tier: s1?.classification.tier ?? 4,
      totalHours: s1?.timeInvestment.totalHours ?? 0,
      greenFlags: (s1?.greenFlags ?? []).map((f) => ({
        flag: f.flag,
        strength: f.strength ?? '',
        evidence: f.evidence ?? '',
        admissionsValue: f.admissionsValue ?? '',
      })),
      redFlags: (s1?.redFlags ?? []).map((f) => ({
        flag: f.flag,
        severity: f.severity ?? 'minor',
        evidence: f.evidence ?? '',
        implication: f.implication ?? '',
      })),
      storyRole: storyRole?.storyRole ?? 'exploration',
      centralityScore: storyRole?.centralityScore ?? 0,
      teachingDepth: getTeachingDepth(id, stage1.teachingCandidates),

      // Strength teaching (from stage2 — rich coaching data)
      strengthTeaching: (teaching?.strengthTeaching ?? []).map((st) => ({
        strength: st.strength,
        whyItMatters: st.whyItMatters?.text ?? '',
        theProblem: st.theProblem ?? '',
        psychology: st.whyItMatters?.psychology,
        research: st.whyItMatters?.research,
        quote: st.whyItMatters?.quote,
        quoteSource: st.whyItMatters?.quoteSource,
        howToLeverage: st.howToLeverage ?? '',
        inApplications: st.inApplications ?? '',
        references: (st.references ?? []).map((r) => ({
          quotedText: r.quotedText ?? '',
          type: r.type ?? '',
          label: r.label ?? '',
        })),
      })),

      // Celebration & Teaching (from stage2)
      celebrationHeadline: teaching?.celebration?.headline ?? '',
      celebrationStrengths: teaching?.celebration?.strengths ?? [],
      improvementTeaching: (teaching?.improvementTeaching ?? []).map((imp) => ({
        issue: imp.issue,
        whyItMatters: imp.whyItMatters?.text ?? '',
        whyItMattersPsychology: imp.whyItMatters?.psychology,
        whyItMattersResearch: imp.whyItMatters?.research,
        whyItMattersQuote: imp.whyItMatters?.quote,
        whyItMattersQuoteSource: imp.whyItMatters?.quoteSource,
        howToFix: imp.howToFix,
        exampleBefore: imp.exampleBefore,
        exampleAfter: imp.exampleAfter,
        transformationAnalysis: imp.transformationAnalysis,
        priority: imp.priority,
        references: (imp.references ?? []).map((r) => ({
          quotedText: r.quotedText ?? '',
          type: r.type ?? '',
          label: r.label ?? '',
        })),
      })),
      descriptionOptimization: descOpt,
      narrativeGuidance: narGuidance,

      // Scoring detail
      summaryOneLiner: scoreData?.summary?.oneLiner ?? '',
      topStrength: scoreData?.summary?.topStrength ?? '',
      topImprovement: scoreData?.summary?.topImprovement ?? '',
      improvementPaths: scoreData?.activityScore?.improvementPaths ?? [],

      // Narrative potential (from stage1)
      essayWorthiness: s1?.narrativePotential?.essayWorthiness ?? 'unlikely',
      uniqueAngles: s1?.narrativePotential?.uniqueAngles ?? [],

      // Leadership & Impact (from stage1)
      leadershipType: s1?.leadership?.type ?? '',
      impactScope: s1?.leadership?.impactScope ?? '',
      impactType: s1?.impact?.type ?? '',
      impactNarrative: s1?.impact?.impactNarrative ?? '',

      // School fit (from stage1)
      bestFitSchoolTypes: s1?.schoolFit?.bestFitSchoolTypes ?? [],

      // Narrative connections (from finalNarrative)
      narrativeThreads: threads.map((t) => ({ name: t.name, activityIds: t.activityIds })),
      elevations: elevations.map((e) => ({
        elevatingActivityId: e.elevatingActivityId,
        elevatingTitle:
          activityTitles[e.elevatingActivityId] || e.elevatingActivityId,
        mechanism: e.mechanism,
        strength: e.strength,
      })),

      // Quick encouragement (for non-deep-teaching activities)
      quickCelebration: quickEnc?.celebration ?? null,
      quickTip: quickEnc?.quickTip ?? null,

      // Per-activity readiness
      descriptionReady: stage1.commonAppReadiness.descriptionReadiness.find((r) => r.activityId === id)?.ready ?? false,
      descriptionIssues: stage1.commonAppReadiness.descriptionReadiness.find((r) => r.activityId === id)?.issues ?? [],

      // Score rationale data (from scoring pipeline)
      activityScoreRationales: scoreData?.activityScore?.breakdown
        ? {
            tierAssessment: {
              rationale: scoreData.activityScore.breakdown.tierAssessment.rationale,
              tier: scoreData.activityScore.breakdown.tierAssessment.tier,
            },
            recognitionLevel: {
              rationale: scoreData.activityScore.breakdown.recognitionLevel.rationale,
              level: scoreData.activityScore.breakdown.recognitionLevel.level,
            },
            leadershipImpact: {
              rationale: scoreData.activityScore.breakdown.leadershipImpact.rationale,
              isApplicable: scoreData.activityScore.breakdown.leadershipImpact.isApplicable,
              role: scoreData.activityScore.breakdown.leadershipImpact.role,
              impactScope: scoreData.activityScore.breakdown.leadershipImpact.impactScope,
            },
            communityCharacter: {
              rationale: scoreData.activityScore.breakdown.communityCharacter.rationale,
              primaryTrait: scoreData.activityScore.breakdown.communityCharacter.primaryTrait,
              authenticitySignal: scoreData.activityScore.breakdown.communityCharacter.authenticitySignal,
            },
            commitmentProgression: {
              rationale: scoreData.activityScore.breakdown.commitmentProgression.rationale,
              years: scoreData.activityScore.breakdown.commitmentProgression.years,
              showsProgression: scoreData.activityScore.breakdown.commitmentProgression.showsProgression,
            },
          }
        : null,
      descriptionScoreRationales: scoreData?.descriptionScore?.breakdown
        ? {
            specificity: { rationale: scoreData.descriptionScore.breakdown.specificity.rationale },
            impactClarity: { rationale: scoreData.descriptionScore.breakdown.impactClarity.rationale },
            authenticityVoice: { rationale: scoreData.descriptionScore.breakdown.authenticityVoice.rationale },
            actionLanguage: { rationale: scoreData.descriptionScore.breakdown.actionLanguage.rationale },
            quantification: { rationale: scoreData.descriptionScore.breakdown.quantification.rationale },
          }
        : null,
      tierExplanation: teaching?.tierExplanation
        ? {
            explanation: teaching.tierExplanation.explanation?.text ?? '',
            whatMakesThisTier: teaching.tierExplanation.whatMakesThisTier?.text ?? '',
            whatWouldChangeIt: teaching.tierExplanation.whatWouldChangeIt?.text ?? '',
            benchmarks: (teaching.tierExplanation.benchmarksUsed ?? []).map((b) => ({
              tier: b.tier,
              benchmark: b.benchmark,
              source: b.source,
              studentMeets: b.studentMeets,
              gap: b.gap ?? undefined,
              evidence: b.evidence,
            })),
          }
        : null,
      activityOverallRationale: scoreData?.activityScore?.overallRationale ?? '',
      descriptionOverallRationale: scoreData?.descriptionScore?.overallRationale ?? '',
      combinedScoreRationale: scoreData?.combinedScore?.rationale ?? '',

      // Stage 0: Story context
      storyEssence: stage0?.narrativeIdentity?.storyEssence ?? '',
      archetype: stage0?.narrativeIdentity?.archetype ?? '',
      roleExplanation: storyRole?.roleExplanation ?? '',

      // Stage 1: Richer analysis
      recognition: scoreData?.activityScore?.breakdown?.recognitionLevel?.level ?? '',
      narrativeStorytelling: s1?.narrativePotential?.storytellingValue ?? '',
      narrativeEmotionalResonance: s1?.narrativePotential?.emotionalResonance ?? '',
      narrativeGrowthArc: s1?.narrativePotential?.growthArc ?? '',
      schoolFitAlignedValues: s1?.schoolFit?.alignedValues ?? [],
      schoolFitConcerns: s1?.schoolFit?.potentialConcerns ?? [],

      // Scoring: richer per-activity data
      tierJustification: scoreData?.activityScore?.tierJustification ?? '',
      comparisonBenchmarks: scoreData?.activityScore?.comparisonBenchmarks ?? null,
      descriptionStrengths: scoreData?.descriptionScore?.strengths ?? [],
      descriptionImprovements: scoreData?.descriptionScore?.improvements ?? [],
      suggestedRewrite: scoreData?.descriptionScore?.suggestedRewrite ?? '',

      // Teaching: upgrade pathway
      upgradePathway: teaching?.upgradePathway ?? null,

      // Teaching: essay potential
      essayPotential: teaching?.narrativeGuidance?.essayPotential ?? null,

      // Teaching: description alternatives
      descriptionAlternatives: teaching?.descriptionOptimization?.alternativeVersions ?? [],

      // Scoring teaching transformation
      transformation: (() => {
        const t = data.stage2?.scoringTeaching?.activityTransformations?.find(t => t.activityId === id);
        if (!t) return null;
        return {
          currentScore: t.currentScore ?? 0,
          revisionLevel: t.revisionLevel ?? '',
          principle: t.principle ?? { name: '', whyItMatters: '', applicationToActivity: '' },
          rewrite: t.rewrite ?? { original: '', suggested: '', characterCount: 0, changesApplied: [] },
          alternatives: t.alternatives ?? [],
          citations: t.citations ?? [],
          expectedScoreImprovement: t.expectedScoreImprovement ?? { projectedScore: 0, improvingComponents: [], rationale: '' },
        };
      })(),
    };
  });
}

export function ActivityInsightsList({ data }: ActivityInsightsListProps) {
  const insights = buildInsights(data);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => {
    setSelectedActivityId(id);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedActivityId(null);
  }, []);

  // Detail view — single selected activity
  const selectedInsight = selectedActivityId
    ? insights.find((i) => i.activityId === selectedActivityId) ?? null
    : null;

  if (selectedActivityId && selectedInsight) {
    return <InsightDetailView data={selectedInsight} onBack={handleBack} />;
  }

  // List view — summary cards
  return (
    <div className="space-y-2">
      {insights.map((item) => (
        <InsightSummaryCard
          key={item.activityId}
          data={item}
          onClick={() => handleSelect(item.activityId)}
        />
      ))}
    </div>
  );
}
