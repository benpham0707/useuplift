/**
 * Stage 1A Integration
 *
 * Bridges the new Activity Workshop system with the existing Stage 1A analysis.
 * Provides utilities to:
 * 1. Convert between data formats
 * 2. Enhance Stage 1A output with workshop citations
 * 3. Use workshop diagnosis to accelerate Stage 1A
 */

import {
  ActivityWorkshopInput,
  ActivityWorkshopSessionInput,
  PortfolioDiagnosis,
  ActivityDiagnosis,
} from './types';

import { ComprehensiveStudentInput } from '../../types';
import { Stage1AOutput } from '../../stages/stage1AActivityAnalysis';
import { activityCitationService } from './activityCitationService';
import { ActivityTier } from '../../types';

// ============================================================================
// FORMAT CONVERSION
// ============================================================================

/**
 * Convert ComprehensiveStudentInput activities to ActivityWorkshopInput format
 */
export function convertToWorkshopFormat(input: ComprehensiveStudentInput): ActivityWorkshopSessionInput {
  const activities = input.activities?.activities || [];

  const workshopActivities: ActivityWorkshopInput[] = activities.map((activity, index) => {
    // Map category
    let category: 'work' | 'volunteer' | 'school_activity' | 'project' = 'school_activity';
    if (activity.category?.toLowerCase().includes('work') || activity.category?.toLowerCase().includes('intern')) {
      category = 'work';
    } else if (
      activity.category?.toLowerCase().includes('volunteer') ||
      activity.category?.toLowerCase().includes('service')
    ) {
      category = 'volunteer';
    } else if (
      activity.category?.toLowerCase().includes('project') ||
      activity.category?.toLowerCase().includes('research')
    ) {
      category = 'project';
    }

    // Extract achievements
    const achievements =
      activity.achievements?.map((a) => ({
        title: a.description,
        level: a.recognitionLevel || undefined,
      })) || [];

    // Add leadership positions as achievements
    if (activity.leadershipPositions) {
      for (const pos of activity.leadershipPositions) {
        achievements.push({
          title: pos.title,
          level: 'school',
        });
      }
    }

    return {
      id: `activity_${index}`,
      title: activity.name,
      organization: activity.organization,
      role: activity.leadershipPositions?.[0]?.title || activity.role,
      category,
      description: activity.description || `${activity.name} - ${activity.category || 'activity'}`,
      hoursPerWeek: activity.hoursPerWeek || 0,
      weeksPerYear: activity.weeksPerYear || 0,
      yearsInvolved: activity.yearsInvolved || 1,
      gradeLevels: activity.gradeLevels || [],
      isPaid: activity.isPaid || false,
      achievements,
    };
  });

  return {
    activities: workshopActivities,
    studentContext: {
      intendedMajor: input.intendedMajors?.[0],
      targetSchools: input.targetSchools?.map((s) => (typeof s === 'string' ? s : s.name)) || [],
      gradeLevel: input.gradeLevel,
      firstGen: input.demographics?.isFirstGeneration,
      lowIncome: input.demographics?.familyIncome ? input.demographics.familyIncome < 65000 : undefined,
    },
  };
}

/**
 * Convert Stage1A output to PortfolioDiagnosis format
 */
export function convertStage1AToWorkshopDiagnosis(stage1AOutput: Stage1AOutput): Partial<PortfolioDiagnosis> {
  return {
    tierDistribution: stage1AOutput.portfolioAssessment.tierDistribution,
    spikeDetection: {
      hasSpike: stage1AOutput.spikeAnalysis.spikeStrength !== 'none',
      spikeStrength: stage1AOutput.spikeAnalysis.spikeStrength === 'strong'
        ? 'national'
        : stage1AOutput.spikeAnalysis.spikeStrength === 'moderate'
          ? 'regional'
          : stage1AOutput.spikeAnalysis.spikeStrength === 'weak'
            ? 'local'
            : 'none',
      spikeActivities: stage1AOutput.spikeAnalysis.activitiesThatBuildSpike,
      spikeEvidence: stage1AOutput.spikeAnalysis.spikeEvidence,
    },
    coherenceScore: stage1AOutput.portfolioAssessment.thematicCoherence.score,
    coherenceAssessment:
      stage1AOutput.portfolioAssessment.thematicCoherence.score >= 85
        ? 'exceptional'
        : stage1AOutput.portfolioAssessment.thematicCoherence.score >= 70
          ? 'strong'
          : stage1AOutput.portfolioAssessment.thematicCoherence.score >= 50
            ? 'moderate'
            : stage1AOutput.portfolioAssessment.thematicCoherence.score >= 30
              ? 'weak'
              : 'scattered',
    themesCovered: [
      stage1AOutput.portfolioAssessment.thematicCoherence.primaryTheme,
      ...stage1AOutput.portfolioAssessment.thematicCoherence.supportingThemes,
    ],
    keyStrengths: stage1AOutput.competitivePositioning.strengthsToEmphasize,
    criticalGaps: stage1AOutput.upgradeStrategies.gapsFilled.length > 0
      ? stage1AOutput.upgradeStrategies.gapsFilled
      : stage1AOutput.spikeAnalysis.gapsInSpike,
  };
}

// ============================================================================
// CITATION ENHANCEMENT
// ============================================================================

/**
 * Enhance Stage 1A output with citations from knowledge databases
 */
export function enhanceStage1AWithCitations(
  stage1AOutput: Stage1AOutput,
  workshopActivities: ActivityWorkshopInput[]
): Stage1AOutput & { citations: Record<string, ReturnType<typeof activityCitationService.getAllCitations>> } {
  const citations: Record<string, ReturnType<typeof activityCitationService.getAllCitations>> = {};

  // Add citations for each activity classification
  for (const classification of stage1AOutput.activityClassifications) {
    const activity = workshopActivities[classification.activityIndex];
    if (activity) {
      citations[classification.activityName] = activityCitationService.getAllCitations(
        activity,
        classification.tier as ActivityTier,
        classification.concerns,
        classification.standoutFactors
      );
    }
  }

  return {
    ...stage1AOutput,
    citations,
  };
}

// ============================================================================
// DIAGNOSIS ACCELERATION
// ============================================================================

/**
 * Use workshop diagnosis to create Stage 1A context (saves tokens in Stage 1A prompt)
 */
export function createStage1AContextFromWorkshop(
  workshopDiagnosis: PortfolioDiagnosis,
  workshopActivities: ActivityWorkshopInput[]
): string {
  const activitySummaries = workshopActivities.map((activity) => {
    const diagnosis = workshopDiagnosis.activities[activity.id];
    if (!diagnosis) return '';

    return `
Activity: ${activity.title}
- Workshop Tier: ${diagnosis.preliminaryTier} (${diagnosis.tierConfidence} confidence)
- Category: ${diagnosis.detectedCategory}
- Recognition: ${diagnosis.detectedRecognition}
- Leadership: ${diagnosis.detectedLeadership}
- Red Flags: ${diagnosis.redFlags.map((f) => f.flag).join(', ') || 'None'}
- Green Flags: ${diagnosis.greenFlags.map((f) => f.flag).join(', ') || 'None'}
`;
  }).join('\n');

  return `
<workshop_diagnosis_context>
Prior Analysis from Activity Workshop (Haiku-powered fast diagnosis):

PORTFOLIO OVERVIEW:
- Tier Distribution: T1=${workshopDiagnosis.tierDistribution.tier1}, T2=${workshopDiagnosis.tierDistribution.tier2}, T3=${workshopDiagnosis.tierDistribution.tier3}, T4=${workshopDiagnosis.tierDistribution.tier4}
- Spike: ${workshopDiagnosis.spikeDetection.hasSpike ? `Yes - ${workshopDiagnosis.spikeDetection.spikeType} (${workshopDiagnosis.spikeDetection.spikeStrength})` : 'No clear spike'}
- Coherence: ${workshopDiagnosis.coherenceScore}/100 (${workshopDiagnosis.coherenceAssessment})
- Overall Strength: ${workshopDiagnosis.overallStrength}

ACTIVITY DIAGNOSES:
${activitySummaries}

KEY STRENGTHS: ${workshopDiagnosis.keyStrengths.join(', ') || 'None identified'}
CRITICAL GAPS: ${workshopDiagnosis.criticalGaps.join(', ') || 'None identified'}

PRIORITY ISSUES:
${workshopDiagnosis.priorityIssues.map((i) => `- [${i.severity}] ${i.issue}: ${i.recommendation}`).join('\n') || 'None'}
</workshop_diagnosis_context>
`;
}

// ============================================================================
// COMBINED ANALYSIS
// ============================================================================

interface CombinedAnalysisResult {
  workshopDiagnosis: PortfolioDiagnosis;
  stage1AOutput: Stage1AOutput;
  combinedInsights: {
    agreedTierClassifications: number;
    disagreedClassifications: Array<{
      activity: string;
      workshopTier: number;
      stage1ATier: number;
      resolution: string;
    }>;
    synthesizedStrengths: string[];
    synthesizedGaps: string[];
    citations: Record<string, ReturnType<typeof activityCitationService.getAllCitations>>;
  };
}

/**
 * Compare and combine workshop diagnosis with Stage 1A for quality validation
 */
export function combineAnalyses(
  workshopDiagnosis: PortfolioDiagnosis,
  stage1AOutput: Stage1AOutput,
  workshopActivities: ActivityWorkshopInput[]
): CombinedAnalysisResult['combinedInsights'] {
  let agreedTierClassifications = 0;
  const disagreedClassifications: CombinedAnalysisResult['combinedInsights']['disagreedClassifications'] = [];

  // Compare tier classifications
  for (const classification of stage1AOutput.activityClassifications) {
    const workshopActivity = workshopActivities[classification.activityIndex];
    if (workshopActivity) {
      const workshopActivityDiagnosis = workshopDiagnosis.activities[workshopActivity.id];
      if (workshopActivityDiagnosis) {
        if (workshopActivityDiagnosis.preliminaryTier === classification.tier) {
          agreedTierClassifications++;
        } else {
          // Determine resolution (prefer Stage 1A as it uses Sonnet with more context)
          disagreedClassifications.push({
            activity: classification.activityName,
            workshopTier: workshopActivityDiagnosis.preliminaryTier,
            stage1ATier: classification.tier,
            resolution:
              Math.abs(workshopActivityDiagnosis.preliminaryTier - classification.tier) <= 1
                ? 'Within acceptable variance'
                : 'Use Stage 1A classification (Sonnet with full context)',
          });
        }
      }
    }
  }

  // Synthesize strengths (combine unique values)
  const allStrengths = new Set([
    ...workshopDiagnosis.keyStrengths,
    ...stage1AOutput.competitivePositioning.strengthsToEmphasize,
  ]);

  // Synthesize gaps (combine unique values)
  const allGaps = new Set([
    ...workshopDiagnosis.criticalGaps,
    ...stage1AOutput.spikeAnalysis.gapsInSpike,
    ...stage1AOutput.competitivePositioning.weaknessesToMitigate,
  ]);

  // Generate citations
  const citations = enhanceStage1AWithCitations(stage1AOutput, workshopActivities).citations;

  return {
    agreedTierClassifications,
    disagreedClassifications,
    synthesizedStrengths: Array.from(allStrengths),
    synthesizedGaps: Array.from(allGaps),
    citations,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const stage1AIntegration = {
  convertToWorkshopFormat,
  convertStage1AToWorkshopDiagnosis,
  enhanceStage1AWithCitations,
  createStage1AContextFromWorkshop,
  combineAnalyses,
};
