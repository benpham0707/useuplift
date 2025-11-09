/**
 * Workshop API Mock Implementation
 *
 * Provides realistic mock data for development until backend is connected.
 * Returns properly structured AnalysisResult matching the backend types.
 */

import type {
  AnalysisResult,
  AnalysisReport,
  RubricCategoryScore,
  RubricCategory,
  AuthenticityAnalysis,
  ElitePatternAnalysis,
  LiterarySophisticationAnalysis,
  CoachingOutput,
} from './backendTypes';
import type { ExtracurricularItem } from '../ExtracurricularCard';

// Helper to generate realistic scores
function generateCategoryScore(
  category: RubricCategory,
  baseScore: number
): RubricCategoryScore {
  const score = baseScore + (Math.random() * 2 - 1); // Add some variance
  const maxScore = 10;

  return {
    category,
    score: Math.max(0, Math.min(maxScore, score)),
    maxScore,
    comments: [
      `This ${category.split('_').join(' ')} shows promise but has room for improvement.`,
      'The foundation is solid, but more specificity would strengthen it.'
    ],
    evidence: ['Example excerpt from your essay...'],
    suggestions: [
      `Add more concrete details to strengthen your ${category.split('_').join(' ')}.`,
      'Consider adding specific examples or metrics.',
      'Show more depth in this dimension.'
    ]
  };
}

export async function analyzeEntryMock(
  description: string,
  activity: ExtracurricularItem
): Promise<AnalysisResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const wordCount = description.split(/\s+/).length;
  const baseScore = Math.min(8, 5 + (wordCount / 100)); // Score based on length

  // Generate 11 category scores
  const categories: RubricCategoryScore[] = [
    generateCategoryScore('voice_integrity', baseScore + 1),
    generateCategoryScore('specificity_evidence', baseScore - 1),
    generateCategoryScore('transformative_impact', baseScore - 0.5),
    generateCategoryScore('role_clarity_ownership', baseScore + 0.5),
    generateCategoryScore('narrative_arc_stakes', baseScore),
    generateCategoryScore('initiative_leadership', baseScore + 0.5),
    generateCategoryScore('community_collaboration', baseScore - 0.5),
    generateCategoryScore('reflection_meaning', baseScore - 1),
    generateCategoryScore('craft_language_quality', baseScore + 0.5),
    generateCategoryScore('fit_trajectory', baseScore),
    generateCategoryScore('time_investment_consistency', baseScore + 1),
  ];

  // Calculate NQI (weighted average)
  const weights: Record<string, number> = {
    voice_integrity: 0.10,
    specificity_evidence: 0.09,
    transformative_impact: 0.12,
    role_clarity_ownership: 0.08,
    narrative_arc_stakes: 0.10,
    initiative_leadership: 0.10,
    community_collaboration: 0.08,
    reflection_meaning: 0.12,
    craft_language_quality: 0.07,
    fit_trajectory: 0.07,
    time_investment_consistency: 0.07,
  };

  let nqi = 0;
  categories.forEach((cat) => {
    nqi += (cat.score / cat.maxScore) * 100 * (weights[cat.category] || 0.09);
  });

  const analysis: AnalysisReport = {
    id: `analysis-${Date.now()}`,
    entry_id: activity.id,
    rubric_version: '1.0.0',
    created_at: new Date().toISOString(),
    categories,
    weights,
    narrative_quality_index: Math.round(nqi),
    reader_impression_label: nqi >= 85 ? 'outstanding' : nqi >= 75 ? 'strong' : nqi >= 65 ? 'solid_needs_polish' : 'needs_work',
    flags: nqi < 70 ? ['Needs more specificity', 'Add concrete examples'] : [],
    suggested_fixes_ranked: [
      'Add specific metrics and numbers',
      'Show vulnerability or challenges faced',
      'Include dialogue or direct quotes',
      'Demonstrate community transformation',
      'Deepen your reflection on meaning'
    ],
    analysis_depth: 'comprehensive',
  };

  const authenticity: AuthenticityAnalysis = {
    authenticity_score: Math.max(6, Math.min(10, baseScore + 1)),
    voice_type: 'conversational',
    red_flags: wordCount < 100 ? ['Essay may be too brief'] : [],
    green_flags: ['Natural voice', 'Authentic tone'],
    manufactured_signals: [],
    authenticity_markers: ['Personal perspective', 'Genuine experience'],
    assessment: 'Voice feels authentic and personal',
  };

  const elitePatterns: ElitePatternAnalysis = {
    overallScore: Math.round(nqi * 0.8), // Elite patterns slightly lower than NQI
    tier: nqi >= 85 ? 1 : nqi >= 75 ? 2 : 3,
    vulnerability: {
      score: Math.max(0, Math.min(10, baseScore - 1)),
      hasPhysicalSymptoms: false,
      hasNamedEmotions: false,
      hasBeforeAfter: false,
      examples: [],
    },
    dialogue: {
      score: Math.max(0, Math.min(10, baseScore - 2)),
      hasDialogue: false,
      isConversational: true,
      revealsCharacter: false,
      examples: [],
    },
    communityTransformation: {
      score: Math.max(0, Math.min(10, baseScore - 1)),
      hasContrast: false,
      hasBefore: false,
      hasAfter: false,
    },
    quantifiedImpact: {
      score: Math.max(0, Math.min(10, baseScore)),
      hasMetrics: wordCount > 150,
      metrics: [],
      plausibilityScore: 7,
    },
    microToMacro: {
      score: Math.max(0, Math.min(10, baseScore - 2)),
      hasUniversalInsight: false,
      transcendsActivity: false,
    },
    strengths: ['Authentic voice', 'Clear activity description'],
    gaps: ['Add specific metrics', 'Show vulnerability', 'Demonstrate transformation'],
  };

  const literarySophistication: LiterarySophisticationAnalysis = {
    overallScore: Math.round(nqi * 0.7),
    extendedMetaphor: {
      score: Math.max(0, Math.min(10, baseScore - 2)),
      hasMetaphor: false,
      isExtended: false,
      examples: [],
    },
    structuralInnovation: {
      score: Math.max(0, Math.min(10, baseScore - 1)),
      structure: 'standard',
      isInnovative: false,
    },
    sentenceRhythm: {
      score: Math.max(0, Math.min(10, baseScore)),
      hasVariation: true,
      examples: [],
    },
    sensoryImmersion: {
      score: Math.max(0, Math.min(10, baseScore - 1)),
      hasSensoryDetails: false,
      examples: [],
    },
    activeVoice: {
      score: Math.max(0, Math.min(10, baseScore + 1)),
      percentage: 75,
      passiveExamples: [],
    },
  };

  const coaching: CoachingOutput = {
    prioritized_issues: [
      {
        issue_id: 'issue-1',
        category: 'specificity_evidence',
        severity: 'critical',
        title: 'Add Quantified Impact',
        problem: 'Missing specific metrics',
        impact: 'Costing you 3-5 points',
        suggestions: ['Add specific numbers', 'Include measurable outcomes'],
      },
      {
        issue_id: 'issue-2',
        category: 'reflection_meaning',
        severity: 'major',
        title: 'Deepen Reflection',
        problem: 'Surface-level meaning',
        impact: 'Costing you 2-4 points',
        suggestions: ['Show what you learned', 'Explain how it changed you'],
      },
    ],
    quick_wins: [
      {
        issue_id: 'issue-1',
        estimated_minutes: 10,
        potential_gain: '+3-5 points',
      },
    ],
    strategic_guidance: {
      focus_areas: ['specificity_evidence', 'reflection_meaning'],
      estimated_time_minutes: 30,
      potential_nqi_gain: 8,
    },
  };

  return {
    analysis,
    coaching,
    authenticity,
    elite_patterns: elitePatterns,
    literary_sophistication: literarySophistication,
  };
}
