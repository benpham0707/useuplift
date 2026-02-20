/**
 * Stage 3: Portfolio Synthesis Engine
 *
 * Purpose: Synthesize all dimension analyses into cohesive portfolio assessment
 * - Calculate weighted overall score based on UC mode
 * - Determine profile archetype (Scholar, Leader, Well-Rounded, etc.)
 * - Identify dimensional interactions (synergies and tensions)
 * - Generate UC campus alignment recommendations
 * - Provide admissions officer perspective
 *
 * This is the 8th of 9 LLM calls in the pipeline.
 * Receives: Stage 1 holistic + Stage 2 (6 dimensions)
 * Produces: Comprehensive synthesis with UC-specific insights
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  PortfolioData,
  HolisticPortfolioUnderstanding,
  DimensionAnalyses,
  PortfolioSynthesis,
  UCEvaluationMode,
  UCCampus,
  getWeightsForMode,
} from '../types';
import { UC_CAMPUS_PROFILES } from '../constants/ucCalibration';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Stage 3: Synthesis Engine
 */
export async function synthesizePortfolio(
  portfolio: PortfolioData,
  holistic: HolisticPortfolioUnderstanding,
  dimensions: DimensionAnalyses,
  mode: UCEvaluationMode
): Promise<PortfolioSynthesis> {
  // Calculate weighted score first (deterministic)
  const weights = getWeightsForMode(mode);
  const weightedScore = calculateWeightedScore(dimensions, weights);

  const systemPrompt = buildSystemPrompt(mode, weightedScore);
  const userPrompt = buildUserPrompt(portfolio, holistic, dimensions, mode, weightedScore);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.6,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    return parseSynthesisResponse(textContent.text, weightedScore);
  } catch (error) {

    try {
      const retryResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        temperature: 0.6,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const retryText = retryResponse.content.find((block) => block.type === 'text');
      if (!retryText || retryText.type !== 'text') {
        throw new Error('No text content in retry');
      }

      return parseSynthesisResponse(retryText.text, weightedScore);
    } catch (retryError) {
      return generateHeuristicSynthesis(holistic, dimensions, mode, weightedScore);
    }
  }
}

/**
 * Calculate weighted overall score based on UC mode
 */
function calculateWeightedScore(
  dimensions: DimensionAnalyses,
  weights: ReturnType<typeof getWeightsForMode>
): number {
  const academicScore = dimensions.academicExcellence?.score || 5.0;
  const leadershipScore = dimensions.leadershipInitiative?.score || 5.0;
  const intellectualScore = dimensions.intellectualCuriosity?.score || 5.0;
  const communityScore = dimensions.communityImpact?.score || 5.0;
  const authenticityScore = dimensions.authenticityVoice?.score || 5.0;
  const futureScore = dimensions.futureReadiness?.score || 5.0;

  const weightedSum =
    academicScore * weights.academicExcellence +
    leadershipScore * weights.leadershipInitiative +
    intellectualScore * weights.intellectualCuriosity +
    communityScore * weights.communityImpact +
    authenticityScore * weights.authenticityVoice +
    futureScore * weights.futureReadiness;

  // Round to one decimal
  return Math.round(weightedSum * 10) / 10;
}

function buildSystemPrompt(mode: UCEvaluationMode, weightedScore: number): string {
  const weights = getWeightsForMode(mode);
  const campusName = mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System';

  return `You are an expert UC admissions synthesizer creating a **comprehensive portfolio synthesis** for ${campusName}.

**Your role**: Synthesize all dimension analyses into a cohesive narrative that:
1. Tells the student's complete story
2. Identifies their profile archetype
3. Highlights dimensional interactions (synergies and tensions)
4. Provides realistic UC campus fit assessment
5. Offers admissions officer perspective

---

## DIMENSION WEIGHTS FOR ${campusName.toUpperCase()}

The following weights were used to calculate the overall score:

| Dimension | Weight |
|-----------|--------|
| Academic Excellence | ${(weights.academicExcellence * 100).toFixed(0)}% |
| Intellectual Curiosity | ${(weights.intellectualCuriosity * 100).toFixed(0)}% |
| Leadership & Initiative | ${(weights.leadershipInitiative * 100).toFixed(0)}% |
| Community Impact | ${(weights.communityImpact * 100).toFixed(0)}% |
| Authenticity & Voice | ${(weights.authenticityVoice * 100).toFixed(0)}% |
| Future Readiness | ${(weights.futureReadiness * 100).toFixed(0)}% |

**Calculated Weighted Score**: ${weightedScore.toFixed(1)}/10.0

---

## PROFILE ARCHETYPES

Determine which archetype best describes this student:

### Scholar (Berkeley Fit)
- High academics + intellectual curiosity
- Research orientation, deep thinker
- May lack breadth in community/leadership
- **Best for**: Berkeley, UCSD, research-intensive programs

### Leader (UCLA Fit)
- High leadership + community impact
- Strong voice and presence
- Mobilizes others, creates change
- **Best for**: UCLA, schools valuing "whole person"

### Well-Rounded (Versatile Fit)
- Balanced across all dimensions
- No glaring weaknesses
- May lack exceptional spike
- **Best for**: Any UC, versatile applications

### Specialist
- Exceptional in 1-2 dimensions
- Solid but not exceptional in others
- Clear passion area
- **Best for**: Programs matching specialty

### Emerging
- Still developing across dimensions
- Has potential but needs growth
- Appropriate for younger grades (9-10)
- **Best for**: Mid-tier UCs, growth-focused

---

## UC CAMPUS FIT ASSESSMENT

**Top-Tier UCs** (Berkeley, UCLA, UCSD):
- Require exceptional profiles (7.5+ weighted)
- Berkeley: Scholar archetype ideal
- UCLA: Leader/Well-Rounded ideal
- UCSD: Scholar (STEM) ideal

**Mid-Tier UCs** (UCSB, UCI, UCD):
- Competitive for solid profiles (6.5-7.5 weighted)
- Value balance and fit with campus culture
- More holistic, less purely academic

**Lower-Tier UCs** (UCR, UCM, UCSC):
- Accessible for developing profiles (5.5-6.5 weighted)
- Focus on meeting a-g requirements
- Good for students still growing

---

## ADMISSIONS OFFICER PERSPECTIVE

Think like a UC reader who:
- Spends 8-15 minutes per application
- Has read thousands of similar profiles
- Looks for memorable, distinctive elements
- Values authenticity over perfection
- Considers context heavily

Questions to answer:
1. **First 10 seconds**: Would I keep reading with interest?
2. **Memorability**: Will I remember this student in 2 hours?
3. **Fit**: Would this student thrive at ${campusName}?
4. **Likely reaction**: Excited? Interested? Neutral? Skeptical?

---

## OUTPUT FORMAT

Return a JSON object with this exact schema:

\`\`\`json
{
  "overall_score": ${weightedScore.toFixed(1)},

  "profile_archetype": "Scholar" | "Leader" | "Well-Rounded" | "Specialist" | "Emerging",
  "archetype_explanation": "string - Why this archetype? (2-3 sentences)",

  "narrative_summary": "string - 3-4 sentence story of this student",

  "hidden_strengths": [
    {
      "strength": "string",
      "evidence": ["string - Specific evidence"],
      "rarity_factor": "Top 1-5%" | "Top 5-10%" | "Top 15-25%" | "Common",
      "why_it_matters": "string"
    }
  ],

  "dimensional_interactions": {
    "synergies": ["string - Dimensions that reinforce each other"],
    "tensions": ["string - Dimensions that seem inconsistent"],
    "overall_coherence": 7.5
  },

  "comparative_benchmarking": {
    "vs_typical_uc_applicant": "string - Comparison",
    "vs_top_10_percent_uc": "string - Comparison",
    "competitive_advantages": ["string"],
    "competitive_weaknesses": ["string"],
    "percentile_estimate": "Top 1-5%" | "Top 5-10%" | "Top 10-20%" | "Top 25-40%" | "Top 50%"
  },

  "uc_campus_alignment": {
    "top_tier_ucs": {
      "fit_score": 7.0,
      "rationale": "string",
      "specific_campuses": [
        {
          "campus": "UC Berkeley" | "UCLA" | "UC San Diego",
          "fit_score": 7.0,
          "reasoning": "string"
        }
      ]
    },
    "mid_tier_ucs": {
      "fit_score": 8.0,
      "rationale": "string",
      "campuses": ["UCSB", "UCI", "UCD"]
    },
    "all_ucs": {
      "likely_admits": ["string - Campuses"],
      "possible_admits": ["string - Campuses"],
      "reaches": ["string - Campuses"]
    }
  },

  "admissions_officer_perspective": {
    "first_10_seconds": "string - Would reader keep reading with interest?",
    "memorability": "string - Will they remember this student?",
    "likely_reaction": "excited" | "interested" | "neutral" | "skeptical",
    "uc_specific_appeal": "string - What appeals to UC mission/values?"
  },

  "score_breakdown_transparency": {
    "formula_applied": "string - Show the weighted calculation",
    "dimension_contributions": [
      {
        "dimension": "string",
        "raw_score": 8.5,
        "weight": 0.35,
        "contribution": 2.975,
        "rationale": "string - Why this dimension received this score"
      }
    ],
    "overall_calculation": "string - Final calculation shown step by step"
  },

  "key_insights": [
    "string - 3-5 critical insights for the student"
  ],

  "evidence_to_insight_tracing": [
    {
      "data_point": "string - Specific data from portfolio",
      "analysis": "string - How we interpreted it",
      "insight": "string - What it means for UC admissions",
      "weight_in_decision": "critical" | "important" | "supplementary"
    }
  ],

  "confidence": 0.85
}
\`\`\``;
}

function buildUserPrompt(
  portfolio: PortfolioData,
  holistic: HolisticPortfolioUnderstanding,
  dimensions: DimensionAnalyses,
  mode: UCEvaluationMode,
  weightedScore: number
): string {
  const weights = getWeightsForMode(mode);

  return `Synthesize this student's portfolio for **${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'}**.

---

## STAGE 1: HOLISTIC UNDERSTANDING

**Overall First Impression**: ${holistic.overallFirstImpression}

**Central Thread**: ${holistic.centralThread}

**Signature Elements**: ${holistic.signatureElements?.join(', ') || 'None identified'}

**Red Flags**: ${holistic.redFlags?.join(', ') || 'None identified'}

**Authenticity Assessment**: ${holistic.authenticityAssessment}

**Comparative Tier**: ${holistic.comparativeTier}

**Initial Strength Score**: ${holistic.initialStrengthScore}/10

**Key Strengths**: ${holistic.keyStrengths?.join(', ') || 'None'}

**Key Gaps**: ${holistic.keyGaps?.join(', ') || 'None'}

**UC-Specific Assessment**:
- GPA Competitiveness: ${holistic.ucSpecificAssessment?.uc_gpa_competitiveness || 'Not assessed'}
- PIQ Quality Preview: ${holistic.ucSpecificAssessment?.piq_quality_preview || 'Not assessed'}
- Context Factors: ${holistic.ucSpecificAssessment?.context_factors?.join(', ') || 'None'}
- Recommended UC Tier: ${holistic.ucSpecificAssessment?.recommended_uc_tier || 'Not specified'}

---

## STAGE 2: DIMENSION SCORES

| Dimension | Score | Tier | Weight (${mode}) |
|-----------|-------|------|--------|
| Academic Excellence | ${dimensions.academicExcellence?.score?.toFixed(1) || 'N/A'}/10 | ${dimensions.academicExcellence?.tier || 'N/A'} | ${(weights.academicExcellence * 100).toFixed(0)}% |
| Intellectual Curiosity | ${dimensions.intellectualCuriosity?.score?.toFixed(1) || 'N/A'}/10 | ${dimensions.intellectualCuriosity?.tier || 'N/A'} | ${(weights.intellectualCuriosity * 100).toFixed(0)}% |
| Leadership & Initiative | ${dimensions.leadershipInitiative?.score?.toFixed(1) || 'N/A'}/10 | ${dimensions.leadershipInitiative?.tier || 'N/A'} | ${(weights.leadershipInitiative * 100).toFixed(0)}% |
| Community Impact | ${dimensions.communityImpact?.score?.toFixed(1) || 'N/A'}/10 | ${dimensions.communityImpact?.tier || 'N/A'} | ${(weights.communityImpact * 100).toFixed(0)}% |
| Authenticity & Voice | ${dimensions.authenticityVoice?.score?.toFixed(1) || 'N/A'}/10 | ${dimensions.authenticityVoice?.tier || 'N/A'} | ${(weights.authenticityVoice * 100).toFixed(0)}% |
| Future Readiness | ${dimensions.futureReadiness?.score?.toFixed(1) || 'N/A'}/10 | ${dimensions.futureReadiness?.tier || 'N/A'} | ${(weights.futureReadiness * 100).toFixed(0)}% |

**WEIGHTED OVERALL SCORE**: ${weightedScore.toFixed(1)}/10.0

---

## DIMENSION SUMMARIES

### Academic Excellence (${(weights.academicExcellence * 100).toFixed(0)}%)
**Score**: ${dimensions.academicExcellence?.score?.toFixed(1) || 'N/A'}/10
**Tier**: ${dimensions.academicExcellence?.tier || 'N/A'}
**Key Strengths**: ${dimensions.academicExcellence?.strengths?.slice(0, 2).map((s: any) => s.strength).join(', ') || 'None'}
**Key Gaps**: ${dimensions.academicExcellence?.growth_areas?.slice(0, 2).map((g: any) => g.gap).join(', ') || 'None'}
**Strategic Pivot**: ${dimensions.academicExcellence?.strategic_pivot || 'N/A'}

### Intellectual Curiosity (${(weights.intellectualCuriosity * 100).toFixed(0)}%)
**Score**: ${dimensions.intellectualCuriosity?.score?.toFixed(1) || 'N/A'}/10
**Tier**: ${dimensions.intellectualCuriosity?.tier || 'N/A'}
**Key Strengths**: ${dimensions.intellectualCuriosity?.strengths?.slice(0, 2).map((s: any) => s.strength).join(', ') || 'None'}
**Key Gaps**: ${dimensions.intellectualCuriosity?.growth_areas?.slice(0, 2).map((g: any) => g.gap).join(', ') || 'None'}
**Strategic Pivot**: ${dimensions.intellectualCuriosity?.strategic_pivot || 'N/A'}

### Leadership & Initiative (${(weights.leadershipInitiative * 100).toFixed(0)}%)
**Score**: ${dimensions.leadershipInitiative?.score?.toFixed(1) || 'N/A'}/10
**Tier**: ${dimensions.leadershipInitiative?.tier || 'N/A'}
**Key Strengths**: ${dimensions.leadershipInitiative?.strengths?.slice(0, 2).map((s: any) => s.strength).join(', ') || 'None'}
**Key Gaps**: ${dimensions.leadershipInitiative?.growth_areas?.slice(0, 2).map((g: any) => g.gap).join(', ') || 'None'}
**Strategic Pivot**: ${dimensions.leadershipInitiative?.strategic_pivot || 'N/A'}

### Community Impact (${(weights.communityImpact * 100).toFixed(0)}%)
**Score**: ${dimensions.communityImpact?.score?.toFixed(1) || 'N/A'}/10
**Tier**: ${dimensions.communityImpact?.tier || 'N/A'}
**Key Strengths**: ${dimensions.communityImpact?.strengths?.slice(0, 2).map((s: any) => s.strength).join(', ') || 'None'}
**Key Gaps**: ${dimensions.communityImpact?.growth_areas?.slice(0, 2).map((g: any) => g.gap).join(', ') || 'None'}
**Strategic Pivot**: ${dimensions.communityImpact?.strategic_pivot || 'N/A'}

### Authenticity & Voice (${(weights.authenticityVoice * 100).toFixed(0)}%)
**Score**: ${dimensions.authenticityVoice?.score?.toFixed(1) || 'N/A'}/10
**Tier**: ${dimensions.authenticityVoice?.tier || 'N/A'}
**Key Strengths**: ${dimensions.authenticityVoice?.strengths?.slice(0, 2).map((s: any) => s.strength).join(', ') || 'None'}
**Key Gaps**: ${dimensions.authenticityVoice?.growth_areas?.slice(0, 2).map((g: any) => g.gap).join(', ') || 'None'}
**Strategic Pivot**: ${dimensions.authenticityVoice?.strategic_pivot || 'N/A'}

### Future Readiness (${(weights.futureReadiness * 100).toFixed(0)}%)
**Score**: ${dimensions.futureReadiness?.score?.toFixed(1) || 'N/A'}/10
**Tier**: ${dimensions.futureReadiness?.tier || 'N/A'}
**Key Strengths**: ${dimensions.futureReadiness?.strengths?.slice(0, 2).map((s: any) => s.strength).join(', ') || 'None'}
**Key Gaps**: ${dimensions.futureReadiness?.growth_areas?.slice(0, 2).map((g: any) => g.gap).join(', ') || 'None'}
**Strategic Pivot**: ${dimensions.futureReadiness?.strategic_pivot || 'N/A'}

---

## STUDENT CONTEXT

**Grade**: ${portfolio.profile?.grade || 'Unknown'}
**California Resident**: ${portfolio.profile?.is_california_resident ? 'Yes' : 'No'}
**First-Generation**: ${portfolio.personal_context?.background?.first_gen ? 'Yes' : 'No'}
**Low-Income**: ${portfolio.personal_context?.background?.low_income ? 'Yes' : 'No'}
**Target UC Campuses**: ${portfolio.goals?.target_uc_campuses?.join(', ') || 'Not specified'}

---

## YOUR TASK

Create a **comprehensive synthesis** that:
1. **Determines profile archetype** based on dimension scores
2. **Crafts narrative summary** (3-4 sentences telling their story)
3. **Identifies hidden strengths** (rare combinations admissions notices)
4. **Analyzes dimensional interactions** (synergies and tensions)
5. **Benchmarks comparatively** (vs typical UC applicant, vs top 10%)
6. **Assesses UC campus fit** (which campuses match this profile)
7. **Provides AO perspective** (how would a reader react?)

**Use the calculated weighted score of ${weightedScore.toFixed(1)}/10 as the overall score.**

Return ONLY the JSON object (no markdown, no extra text).`;
}

function parseSynthesisResponse(text: string, weightedScore: number): PortfolioSynthesis {
  let jsonText = text.trim();
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonText);

    const result: PortfolioSynthesis = {
      overallScore: weightedScore,
      profileArchetype: parsed.profile_archetype || 'Emerging',
      archetypeExplanation: parsed.archetype_explanation || 'Unable to determine archetype',
      narrativeSummary: parsed.narrative_summary || 'Unable to generate narrative',
      hiddenStrengths: (parsed.hidden_strengths || []).map((hs: any) => ({
        strength: hs.strength || '',
        evidence: hs.evidence || [],
        rarityFactor: hs.rarity_factor || 'Common',
        whyItMatters: hs.why_it_matters || '',
      })),
      dimensionalInteractions: {
        synergies: parsed.dimensional_interactions?.synergies || [],
        tensions: parsed.dimensional_interactions?.tensions || [],
        overallCoherence: parsed.dimensional_interactions?.overall_coherence || 5.0,
      },
      comparativeBenchmarking: {
        vsTypicalUCApplicant: parsed.comparative_benchmarking?.vs_typical_uc_applicant || 'Unknown',
        vsTop10PercentUC: parsed.comparative_benchmarking?.vs_top_10_percent_uc || 'Unknown',
        competitiveAdvantages: parsed.comparative_benchmarking?.competitive_advantages || [],
        competitiveWeaknesses: parsed.comparative_benchmarking?.competitive_weaknesses || [],
        percentileEstimate: parsed.comparative_benchmarking?.percentile_estimate || 'Top 50%',
      },
      ucCampusAlignment: {
        topTierUCs: {
          fitScore: parsed.uc_campus_alignment?.top_tier_ucs?.fit_score || 5.0,
          rationale: parsed.uc_campus_alignment?.top_tier_ucs?.rationale || 'Not assessed',
          specificCampuses: (parsed.uc_campus_alignment?.top_tier_ucs?.specific_campuses || []).map((c: any) => ({
            campus: c.campus as UCCampus,
            fitScore: c.fit_score || 5.0,
            reasoning: c.reasoning || '',
          })),
        },
        midTierUCs: {
          fitScore: parsed.uc_campus_alignment?.mid_tier_ucs?.fit_score || 6.0,
          rationale: parsed.uc_campus_alignment?.mid_tier_ucs?.rationale || 'Not assessed',
          campuses: parsed.uc_campus_alignment?.mid_tier_ucs?.campuses || [],
        },
        allUCs: {
          likelyAdmits: parsed.uc_campus_alignment?.all_ucs?.likely_admits || [],
          possibleAdmits: parsed.uc_campus_alignment?.all_ucs?.possible_admits || [],
          reaches: parsed.uc_campus_alignment?.all_ucs?.reaches || [],
        },
      },
      admissionsOfficerPerspective: {
        first10Seconds: parsed.admissions_officer_perspective?.first_10_seconds || 'Not assessed',
        memorability: parsed.admissions_officer_perspective?.memorability || 'Not assessed',
        likelyReaction: parsed.admissions_officer_perspective?.likely_reaction || 'neutral',
        ucSpecificAppeal: parsed.admissions_officer_perspective?.uc_specific_appeal || 'Not assessed',
      },
      scoreBreakdownTransparency: parsed.score_breakdown_transparency
        ? {
            formulaApplied: parsed.score_breakdown_transparency.formula_applied || '',
            dimensionContributions: (parsed.score_breakdown_transparency.dimension_contributions || []).map(
              (dc: any) => ({
                dimension: dc.dimension || '',
                rawScore: dc.raw_score || 0,
                weight: dc.weight || 0,
                contribution: dc.contribution || 0,
                rationale: dc.rationale || '',
              })
            ),
            overallCalculation: parsed.score_breakdown_transparency.overall_calculation || '',
          }
        : undefined,
      keyInsights: parsed.key_insights || [],
      evidenceToInsightTracing: (parsed.evidence_to_insight_tracing || []).map((eti: any) => ({
        dataPoint: eti.data_point || '',
        analysis: eti.analysis || '',
        insight: eti.insight || '',
        weightInDecision: eti.weight_in_decision || 'supplementary',
      })),
      confidence: parsed.confidence || 0.8,
    };

    return result;
  } catch (error) {
    throw new Error('Invalid JSON from synthesis engine');
  }
}

function generateHeuristicSynthesis(
  holistic: HolisticPortfolioUnderstanding,
  dimensions: DimensionAnalyses,
  mode: UCEvaluationMode,
  weightedScore: number
): PortfolioSynthesis {
  // Determine archetype based on highest dimensions
  const scores = {
    academic: dimensions.academicExcellence?.score || 5,
    intellectual: dimensions.intellectualCuriosity?.score || 5,
    leadership: dimensions.leadershipInitiative?.score || 5,
    community: dimensions.communityImpact?.score || 5,
    authenticity: dimensions.authenticityVoice?.score || 5,
    future: dimensions.futureReadiness?.score || 5,
  };

  let archetype: 'Scholar' | 'Leader' | 'Well-Rounded' | 'Specialist' | 'Emerging' = 'Emerging';

  if (scores.academic >= 8 && scores.intellectual >= 7) {
    archetype = 'Scholar';
  } else if (scores.leadership >= 7 && scores.community >= 7) {
    archetype = 'Leader';
  } else if (Object.values(scores).every((s) => s >= 6)) {
    archetype = 'Well-Rounded';
  } else if (Math.max(...Object.values(scores)) >= 8) {
    archetype = 'Specialist';
  }

  return {
    overallScore: weightedScore,
    profileArchetype: archetype,
    archetypeExplanation: `Based on dimension scores, this student fits the ${archetype} archetype. (Heuristic analysis)`,
    narrativeSummary: holistic.overallFirstImpression || 'Unable to generate narrative in heuristic mode.',
    hiddenStrengths: [],
    dimensionalInteractions: {
      synergies: [],
      tensions: [],
      overallCoherence: 6.0,
    },
    comparativeBenchmarking: {
      vsTypicalUCApplicant: weightedScore >= 7 ? 'Above average' : 'Average',
      vsTop10PercentUC: weightedScore >= 8 ? 'Competitive' : 'Below',
      competitiveAdvantages: [],
      competitiveWeaknesses: [],
      percentileEstimate: weightedScore >= 8 ? 'Top 10-20%' : weightedScore >= 7 ? 'Top 25-40%' : 'Top 50%',
    },
    ucCampusAlignment: {
      topTierUCs: {
        fitScore: Math.min(weightedScore, 7),
        rationale: 'Heuristic assessment based on overall score',
        specificCampuses: [],
      },
      midTierUCs: {
        fitScore: Math.min(weightedScore + 1, 9),
        rationale: 'Heuristic assessment',
        campuses: ['UC Santa Barbara', 'UC Irvine', 'UC Davis'],
      },
      allUCs: {
        likelyAdmits: weightedScore >= 7 ? ['UC Santa Cruz', 'UC Riverside', 'UC Merced'] : ['UC Merced'],
        possibleAdmits: weightedScore >= 6.5 ? ['UC Santa Barbara', 'UC Irvine', 'UC Davis'] : [],
        reaches: ['UC Berkeley', 'UCLA', 'UC San Diego'],
      },
    },
    admissionsOfficerPerspective: {
      first10Seconds: 'Unable to assess in heuristic mode',
      memorability: 'Unable to assess in heuristic mode',
      likelyReaction: 'neutral',
      ucSpecificAppeal: 'Manual review needed',
    },
    confidence: 0.4,
  };
}
