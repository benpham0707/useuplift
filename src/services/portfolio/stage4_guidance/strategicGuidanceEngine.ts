/**
 * Stage 4: Strategic Guidance Engine
 *
 * Purpose: Generate actionable, prioritized recommendations
 * - Prioritized recommendations based on dimension gaps
 * - Grade-by-grade roadmap (if applicable)
 * - Timeline-based action items
 * - UC-specific strategic advice
 *
 * This is the 9th and final LLM call in the pipeline.
 * Receives: All previous stages (holistic, dimensions, synthesis)
 * Produces: Actionable guidance for improvement
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  PortfolioData,
  HolisticPortfolioUnderstanding,
  DimensionAnalyses,
  PortfolioSynthesis,
  StrategicGuidance,
  UCEvaluationMode,
  getWeightsForMode,
} from '../types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Stage 4: Strategic Guidance Engine
 */
export async function generateStrategicGuidance(
  portfolio: PortfolioData,
  holistic: HolisticPortfolioUnderstanding,
  dimensions: DimensionAnalyses,
  synthesis: PortfolioSynthesis,
  mode: UCEvaluationMode
): Promise<StrategicGuidance> {
  const systemPrompt = buildSystemPrompt(mode, portfolio.profile?.grade);
  const userPrompt = buildUserPrompt(portfolio, holistic, dimensions, synthesis, mode);

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

    return parseGuidanceResponse(textContent.text);
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

      return parseGuidanceResponse(retryText.text);
    } catch (retryError) {
      return generateHeuristicGuidance(dimensions, synthesis, portfolio.profile?.grade);
    }
  }
}

function buildSystemPrompt(mode: UCEvaluationMode, grade?: number): string {
  const campusName = mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System';
  const weights = getWeightsForMode(mode);

  return `You are an expert UC admissions counselor generating **strategic, actionable guidance** for a student targeting ${campusName}.

**Your role**: Create a prioritized action plan that:
1. Addresses the most impactful gaps first
2. Provides specific, actionable steps (not vague advice)
3. Is realistic given the student's current grade (${grade || 'unknown'})
4. Accounts for UC-specific priorities
5. Includes timeline and expected impact

---

## DIMENSION WEIGHTS FOR ${campusName.toUpperCase()}

When prioritizing recommendations, consider these weights:
- Academic Excellence: ${(weights.academicExcellence * 100).toFixed(0)}%
- Intellectual Curiosity: ${(weights.intellectualCuriosity * 100).toFixed(0)}%
- Leadership & Initiative: ${(weights.leadershipInitiative * 100).toFixed(0)}%
- Community Impact: ${(weights.communityImpact * 100).toFixed(0)}%
- Authenticity & Voice: ${(weights.authenticityVoice * 100).toFixed(0)}%
- Future Readiness: ${(weights.futureReadiness * 100).toFixed(0)}%

**Higher weight = higher priority for recommendations** (impact on overall score)

---

## RECOMMENDATION FRAMEWORK

### Priority 1: Critical (Must Address)
- Gaps in high-weight dimensions (Academic, Intellectual Curiosity for Berkeley; Voice for UCLA)
- Red flags that could sink application
- Missing baseline requirements

### Priority 2: Important (Should Address)
- Moderate gaps in any dimension
- Opportunities to strengthen profile
- Areas that could move from "possible" to "likely" admit

### Priority 3: Helpful (Nice to Have)
- Polish and refinement
- Minor improvements
- "Reach" school optimization

---

## GRADE-SPECIFIC GUIDANCE

${grade === 9 ? `
### Grade 9: Foundation Building
- Focus: Academics, exploration, building habits
- ECs: Join 2-3 activities, find potential spike areas
- Academics: Set strong GPA foundation
- Timeline: 3+ years to develop profile
` : grade === 10 ? `
### Grade 10: Depth Development
- Focus: Deepen involvement, take leadership steps
- ECs: Take on leadership roles, increase commitment
- Academics: Add rigor (first APs), maintain GPA
- Timeline: 2+ years to refine profile
` : grade === 11 ? `
### Grade 11: Critical Year
- Focus: Maximize impact, prepare applications
- ECs: Leadership positions, measurable outcomes
- Academics: Strong junior year grades (most important for UCs)
- PIQs: Begin drafting, reflect on experiences
- Timeline: ~6-12 months before applications
` : `
### Grade 12: Application Season
- Focus: Finalize PIQs, maintain grades
- ECs: Document accomplishments, get recommendations
- Academics: Don't slack! Grades still matter
- PIQs: Multiple revisions, authentic voice
- Timeline: Application deadlines approaching
`}

---

## ACTIONABLE RECOMMENDATIONS CRITERIA

Good recommendations are:
✅ **Specific**: "Join robotics club and aim for regional competition" not "do more ECs"
✅ **Measurable**: "Raise GPA from 3.8 to 4.0" not "improve grades"
✅ **Achievable**: Realistic given time and resources
✅ **Relevant**: Addresses actual gaps, not generic advice
✅ **Time-bound**: Clear timeline ("before end of junior year")

Bad recommendations:
❌ Vague: "Be more authentic"
❌ Unrealistic: "Win a national competition" for a Tier 3 student
❌ Generic: "Get good grades and do activities"
❌ Irrelevant: Advice for wrong grade level

---

## OUTPUT FORMAT

Return a JSON object with this exact schema:

\`\`\`json
{
  "prioritized_recommendations": [
    {
      "priority": 1,
      "dimension": "string - Which dimension this addresses",
      "recommendation": "string - Clear, specific recommendation",
      "rationale": "string - Why this matters (with UC context)",
      "timeline": "string - When to do this",
      "estimated_impact": "string - Expected score/profile improvement",
      "difficulty_level": "easy" | "moderate" | "challenging",
      "specific_steps": [
        "string - Step 1",
        "string - Step 2",
        "string - Step 3"
      ],
      "uc_relevance": "string - Why this matters for UCs specifically",
      "success_metrics": {
        "measurable_goal": "string - Specific, quantifiable target",
        "verification_method": "string - How to track progress",
        "deadline": "string - Specific date or milestone"
      }
    }
  ],

  "grade_by_grade_roadmap": {
    "current_grade": {
      "focus": "string - Main focus for remaining time",
      "key_actions": ["string - 3-5 key actions"]
    },
    "next_grade": {
      "focus": "string - What to focus on",
      "key_actions": ["string - 3-5 key actions"]
    }
  },

  "target_outcomes": {
    "short_term": {
      "timeline": "3-6 months",
      "goals": ["string - Specific, measurable goals"],
      "expected_score_change": "string - e.g., '+0.3 to Academic Excellence'"
    },
    "medium_term": {
      "timeline": "6-12 months",
      "goals": ["string"],
      "expected_score_change": "string"
    },
    "long_term": {
      "timeline": "1-2 years",
      "goals": ["string"],
      "expected_score_change": "string"
    }
  },

  "critical_warnings": [
    "string - Things to avoid or dangers to watch for"
  ],

  "aspirational_target": "string - Best-case scenario if all recommendations implemented"
}
\`\`\`

**Important**: Provide 5-8 recommendations max, sorted by priority and impact.`;
}

function buildUserPrompt(
  portfolio: PortfolioData,
  holistic: HolisticPortfolioUnderstanding,
  dimensions: DimensionAnalyses,
  synthesis: PortfolioSynthesis,
  mode: UCEvaluationMode
): string {
  const weights = getWeightsForMode(mode);

  // Identify biggest gaps (lowest scores in highest-weight dimensions)
  const dimensionGaps = [
    { name: 'Academic Excellence', score: dimensions.academicExcellence?.score || 5, weight: weights.academicExcellence, pivot: dimensions.academicExcellence?.strategic_pivot },
    { name: 'Intellectual Curiosity', score: dimensions.intellectualCuriosity?.score || 5, weight: weights.intellectualCuriosity, pivot: dimensions.intellectualCuriosity?.strategic_pivot },
    { name: 'Leadership & Initiative', score: dimensions.leadershipInitiative?.score || 5, weight: weights.leadershipInitiative, pivot: dimensions.leadershipInitiative?.strategic_pivot },
    { name: 'Community Impact', score: dimensions.communityImpact?.score || 5, weight: weights.communityImpact, pivot: dimensions.communityImpact?.strategic_pivot },
    { name: 'Authenticity & Voice', score: dimensions.authenticityVoice?.score || 5, weight: weights.authenticityVoice, pivot: dimensions.authenticityVoice?.strategic_pivot },
    { name: 'Future Readiness', score: dimensions.futureReadiness?.score || 5, weight: weights.futureReadiness, pivot: dimensions.futureReadiness?.strategic_pivot },
  ].sort((a, b) => (10 - a.score) * a.weight - (10 - b.score) * b.weight); // Sort by weighted gap (largest first)

  return `Generate **strategic guidance** for this student targeting **${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'}**.

---

## STUDENT PROFILE

**Grade**: ${portfolio.profile?.grade || 'Unknown'}
**California Resident**: ${portfolio.profile?.is_california_resident ? 'Yes' : 'No'}
**First-Generation**: ${portfolio.personal_context?.background?.first_gen ? 'Yes' : 'No'}
**Target UC Campuses**: ${portfolio.goals?.target_uc_campuses?.join(', ') || 'Not specified'}

---

## SYNTHESIS SUMMARY

**Overall Score**: ${synthesis.overallScore}/10.0
**Profile Archetype**: ${synthesis.profileArchetype}
**Archetype Explanation**: ${synthesis.archetypeExplanation}

**Narrative Summary**: ${synthesis.narrativeSummary}

**Percentile Estimate**: ${synthesis.comparativeBenchmarking?.percentileEstimate || 'Unknown'}

**Competitive Advantages**:
${synthesis.comparativeBenchmarking?.competitiveAdvantages?.map((a) => `- ${a}`).join('\n') || '- None identified'}

**Competitive Weaknesses**:
${synthesis.comparativeBenchmarking?.competitiveWeaknesses?.map((w) => `- ${w}`).join('\n') || '- None identified'}

**UC Campus Alignment**:
- Top-Tier UCs Fit: ${synthesis.ucCampusAlignment?.topTierUCs?.fitScore || 'N/A'}/10
- Mid-Tier UCs Fit: ${synthesis.ucCampusAlignment?.midTierUCs?.fitScore || 'N/A'}/10
- Likely Admits: ${synthesis.ucCampusAlignment?.allUCs?.likelyAdmits?.join(', ') || 'None'}
- Possible Admits: ${synthesis.ucCampusAlignment?.allUCs?.possibleAdmits?.join(', ') || 'None'}
- Reaches: ${synthesis.ucCampusAlignment?.allUCs?.reaches?.join(', ') || 'None'}

---

## DIMENSION SCORES & GAPS (Sorted by Weighted Impact)

${dimensionGaps.map((d, i) => `
### ${i + 1}. ${d.name}
**Score**: ${d.score.toFixed(1)}/10 | **Weight**: ${(d.weight * 100).toFixed(0)}%
**Weighted Gap**: ${((10 - d.score) * d.weight).toFixed(2)} points potential improvement
**Strategic Pivot from Analysis**: ${d.pivot || 'Not specified'}
`).join('\n')}

---

## HOLISTIC RED FLAGS

${holistic.redFlags?.length > 0 ? holistic.redFlags.map((rf) => `- ⚠️ ${rf}`).join('\n') : '- None identified'}

---

## KEY GAPS FROM HOLISTIC ANALYSIS

${holistic.keyGaps?.length > 0 ? holistic.keyGaps.map((g) => `- ${g}`).join('\n') : '- None identified'}

---

## YOUR TASK

Generate **strategic, actionable guidance** that:

1. **Prioritizes by impact**: Address highest-weight gaps first
2. **Is grade-appropriate**: ${portfolio.profile?.grade === 12 ? 'Focus on application optimization' : portfolio.profile?.grade === 11 ? 'Balance improvement with application prep' : 'Focus on building profile'}
3. **Is specific and actionable**: Not vague advice
4. **Includes UC context**: Why each recommendation matters for ${mode === 'berkeley' ? 'Berkeley' : mode === 'ucla' ? 'UCLA' : 'UCs'}
5. **Has realistic timelines**: Based on grade level
6. **Warns about pitfalls**: What to avoid

**Based on the dimension gaps above, the highest-impact improvements are in**:
1. ${dimensionGaps[0].name} (weighted gap: ${((10 - dimensionGaps[0].score) * dimensionGaps[0].weight).toFixed(2)})
2. ${dimensionGaps[1].name} (weighted gap: ${((10 - dimensionGaps[1].score) * dimensionGaps[1].weight).toFixed(2)})
3. ${dimensionGaps[2].name} (weighted gap: ${((10 - dimensionGaps[2].score) * dimensionGaps[2].weight).toFixed(2)})

Return ONLY the JSON object (no markdown, no extra text).`;
}

function parseGuidanceResponse(text: string): StrategicGuidance {
  let jsonText = text.trim();
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonText);

    const result: StrategicGuidance = {
      prioritizedRecommendations: (parsed.prioritized_recommendations || []).map((rec: any) => ({
        priority: rec.priority || 3,
        dimension: rec.dimension || 'General',
        recommendation: rec.recommendation || '',
        rationale: rec.rationale || '',
        timeline: rec.timeline || '',
        estimatedImpact: rec.estimated_impact || '',
        difficultyLevel: rec.difficulty_level || 'moderate',
        specificSteps: rec.specific_steps || [],
        ucRelevance: rec.uc_relevance || '',
        successMetrics: rec.success_metrics
          ? {
              measurableGoal: rec.success_metrics.measurable_goal || '',
              verificationMethod: rec.success_metrics.verification_method || '',
              deadline: rec.success_metrics.deadline || '',
            }
          : undefined,
      })),
      gradeByGradeRoadmap: parsed.grade_by_grade_roadmap
        ? {
            [`grade${parsed.grade_by_grade_roadmap.current_grade ? 'Current' : '11'}`]: {
              focus: parsed.grade_by_grade_roadmap.current_grade?.focus || '',
              keyActions: parsed.grade_by_grade_roadmap.current_grade?.key_actions || [],
            },
          }
        : undefined,
      targetOutcomes: {
        shortTerm: {
          timeline: parsed.target_outcomes?.short_term?.timeline || '3-6 months',
          goals: parsed.target_outcomes?.short_term?.goals || [],
          expectedScoreChange: parsed.target_outcomes?.short_term?.expected_score_change || '',
        },
        mediumTerm: {
          timeline: parsed.target_outcomes?.medium_term?.timeline || '6-12 months',
          goals: parsed.target_outcomes?.medium_term?.goals || [],
          expectedScoreChange: parsed.target_outcomes?.medium_term?.expected_score_change || '',
        },
        longTerm: {
          timeline: parsed.target_outcomes?.long_term?.timeline || '1-2 years',
          goals: parsed.target_outcomes?.long_term?.goals || [],
          expectedScoreChange: parsed.target_outcomes?.long_term?.expected_score_change || '',
        },
      },
      criticalWarnings: parsed.critical_warnings || [],
      aspirationalTarget: parsed.aspirational_target || 'Unable to determine',
    };

    return result;
  } catch (error) {
    throw new Error('Invalid JSON from guidance engine');
  }
}

function generateHeuristicGuidance(
  dimensions: DimensionAnalyses,
  synthesis: PortfolioSynthesis,
  grade?: number
): StrategicGuidance {
  // Basic recommendations based on lowest scores
  const scores = [
    { dim: 'Academic Excellence', score: dimensions.academicExcellence?.score || 5 },
    { dim: 'Leadership & Initiative', score: dimensions.leadershipInitiative?.score || 5 },
    { dim: 'Intellectual Curiosity', score: dimensions.intellectualCuriosity?.score || 5 },
    { dim: 'Community Impact', score: dimensions.communityImpact?.score || 5 },
    { dim: 'Authenticity & Voice', score: dimensions.authenticityVoice?.score || 5 },
  ].sort((a, b) => a.score - b.score);

  const recommendations = scores.slice(0, 3).map((s, i) => ({
    priority: (i + 1) as 1 | 2 | 3,
    dimension: s.dim,
    recommendation: `Improve ${s.dim} score from ${s.score.toFixed(1)} to ${Math.min(s.score + 1, 10).toFixed(1)}`,
    rationale: `This dimension has a lower score (${s.score.toFixed(1)}) and improvement would strengthen the overall profile.`,
    timeline: grade === 12 ? 'Before applications' : 'Next 6-12 months',
    estimatedImpact: `+${(Math.min(1, 10 - s.score) * 0.15).toFixed(1)} to overall score`,
    difficultyLevel: 'moderate' as const,
    specificSteps: ['Detailed steps require full analysis'],
    ucRelevance: 'All UCs value well-rounded applicants',
  }));

  return {
    prioritizedRecommendations: recommendations,
    targetOutcomes: {
      shortTerm: {
        timeline: '3-6 months',
        goals: ['Address lowest scoring dimensions'],
        expectedScoreChange: '+0.3 to overall score',
      },
      mediumTerm: {
        timeline: '6-12 months',
        goals: ['Build depth in key areas'],
        expectedScoreChange: '+0.5 to overall score',
      },
      longTerm: {
        timeline: '1-2 years',
        goals: ['Achieve target profile for UC applications'],
        expectedScoreChange: '+1.0 to overall score',
      },
    },
    criticalWarnings: [
      'This is heuristic guidance - detailed analysis recommended',
      'Prioritize highest-weight dimensions for target UC',
    ],
    aspirationalTarget: `Move from ${synthesis.comparativeBenchmarking?.percentileEstimate || 'current level'} to next tier with consistent effort.`,
  };
}
