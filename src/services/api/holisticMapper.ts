import { HolisticAnalysis, EssayAnalysisResult } from '../../services/orchestrator/types';
import { HolisticSummary, OverarchingInsight } from '../../components/portfolio/portfolioInsightsData';

/**
 * Maps the Orchestrator's HolisticAnalysis output to the Frontend's HolisticSummary format.
 * This bridges the gap between the MCP/Backend and the React UI.
 */
export function mapHolisticAnalysisToSummary(
  analysis: HolisticAnalysis,
  essayResults: EssayAnalysisResult[] = [] // Optional: if we have individual essay scores
): HolisticSummary {
  
  // 1. Map Overarching Insight (Direct mapping)
  const overarchingInsight: OverarchingInsight = {
    verdictOptions: {
      spine: analysis.narrative_quality.spine,
      spike: analysis.narrative_quality.spike,
      lift: analysis.narrative_quality.lift,
      blind_spots: analysis.narrative_quality.blind_spots
    },
    storyTellingOptions: analysis.brand_archetype.candidates,
    storyCoherencePercent: analysis.narrative_quality.coherence_score,
    storyCoherenceLine: {
      text: "Your narrative coherence is strong, but could be tighter around your core theme.",
      details: ["Coherence is calculated based on the alignment between your spine and your activities."]
    },
    
    // These fields might need more data or be optional in the UI logic
    impactData: undefined, 
    recognitionData: undefined,
    extracurricularOverview: undefined,
    recognitionOverview: undefined,
    extracurricularItems: undefined,
    recognitionItems: undefined
  };

  // 2. Calculate Overall Score
  // Use coherence score as base, or average of essays if available
  let overallScore = analysis.narrative_quality.coherence_score / 10; // Convert 0-100 to 0-10
  if (overallScore > 10) overallScore = 10; // Cap just in case

  // 3. Determine Tier
  const tierName = getTierName(overallScore);
  const tierPercentile = getTierPercentile(overallScore);

  return {
    overallScore,
    tierName,
    tierPercentile,
    achievements: [], // Populate from profile.awards if available
    schoolComparisons: [], // Populate if we have school data
    overarchingInsight
  };
}

// Helpers
function getTierName(score: number): string {
  if (score >= 9.5) return 'Ivy League Contender';
  if (score >= 8.5) return 'Top Tier Strong';
  if (score >= 7.5) return 'Competitive';
  return 'Developing';
}

function getTierPercentile(score: number): number {
  // Rough mapping
  if (score >= 9.8) return 99;
  if (score >= 9.5) return 95;
  if (score >= 9.0) return 90;
  if (score >= 8.5) return 85;
  if (score >= 8.0) return 75;
  if (score >= 7.0) return 60;
  return 50;
}

