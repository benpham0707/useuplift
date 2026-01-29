/**
 * Academic Teaching Engine (Layer 5)
 *
 * Generates research-backed explanations for academic scores and provides
 * actionable guidance. Unlike simple score displays, this engine helps
 * students UNDERSTAND why they received each score and what they can do.
 *
 * Key principles:
 * - Teaching over telling (explain the WHY)
 * - Research-backed insights (cite admissions research)
 * - Actionable guidance (specific next steps)
 * - Encouraging yet honest tone
 */

import { callUnifiedLLM } from '../../../../../lib/llm/unified';
import type {
  AcademicHistoryInput,
  AcademicDimensionScores,
  AcademicNarrativeAnalysis,
  ContextualPositioning,
  AcademicTeaching,
  TeachingMoment,
  HeuristicFoundation,
} from '../types';

// ============================================================================
// TEACHING PROMPT
// ============================================================================

const TEACHING_PROMPT = `You are an experienced college counselor who excels at explaining complex admissions concepts to students and parents. Your goal is to help students UNDERSTAND their academic positioning and provide ACTIONABLE guidance.

You reference admissions research when helpful, but your primary role is teaching - helping students see what admissions officers see and guiding improvement.

STUDENT ACADEMIC PROFILE:

Narrative Type: {narrativeType}
Narrative Summary: {narrativeSummary}

Dimension Scores:
- Rigor: {rigorScore}/3 - {rigorRationale}
- Performance: {performanceScore}/2.5 - {performanceRationale}
- Intellectual Character: {characterScore}/2.5 - {characterRationale}
- Trajectory: {trajectoryScore}/2 - {trajectoryRationale}

Total Score: {totalScore}/10
Harvard Scale: {harvardScore} ({harvardLabel})

Contextual Positioning:
{positioningSummary}

Character Traits Identified:
{characterTraits}

Red Narratives to Address:
{redNarratives}

---

TEACHING TASK: Generate educational content that helps this student understand and improve.

1. DIMENSION EXPLANATIONS
For each scored dimension, provide a teaching moment that:
- Explains what this dimension measures and why it matters
- Interprets the student's specific score in context
- References relevant admissions research when applicable
- Provides one concrete, actionable piece of advice

Format for each:
{
  "dimension": "rigor|performance|character|trajectory|overall",
  "insight": "What the score reveals about the student",
  "researchBasis": "Relevant admissions research or insight",
  "actionableAdvice": "One specific thing the student can do"
}

2. STRENGTH HIGHLIGHTS
List 2-4 genuine strengths in the academic record that the student should:
- Be proud of
- Emphasize in applications
- Build upon
Keep these specific and evidence-based.

3. IMPROVEMENT AREAS
For each area needing improvement, provide:
- The area/issue
- Why it matters (the "so what")
- 2-3 concrete steps to address it
- Priority level (high/medium/low)

Focus on what's still ACTIONABLE given the student's stage.

4. NARRATIVE ADVICE
Based on the student's narrative type and record, provide 2-3 sentences of advice on how they should frame their academic story in applications. This is about presenting authentic strengths, not spinning weaknesses.

Be encouraging but honest. Students benefit from understanding reality, not false reassurance.

Respond with a JSON object matching this structure:
{
  "dimensionExplanations": [
    {
      "dimension": "string",
      "insight": "string",
      "researchBasis": "string",
      "actionableAdvice": "string"
    }
  ],
  "strengthHighlights": ["string", "string"],
  "improvementAreas": [
    {
      "area": "string",
      "explanation": "string",
      "concreteSteps": ["string", "string"],
      "priority": "high|medium|low"
    }
  ],
  "narrativeAdvice": "string"
}`;

// ============================================================================
// FORMATTER HELPERS
// ============================================================================

function getHarvardLabel(score: number): { harvardScore: number; label: string } {
  if (score >= 9.0) return { harvardScore: 1, label: 'Exceptional' };
  if (score >= 7.5) return { harvardScore: 2, label: 'Excellent' };
  if (score >= 6.0) return { harvardScore: 3, label: 'Good' };
  if (score >= 4.5) return { harvardScore: 4, label: 'Adequate' };
  if (score >= 3.0) return { harvardScore: 5, label: 'Concerning' };
  return { harvardScore: 6, label: 'Problematic' };
}

function formatPositioningSummary(positioning: ContextualPositioning): string {
  return `- Relative Rigor: ${positioning.relativeRigor}
- Relative Performance: ${positioning.relativePerformance}
- Opportunity Utilization: ${positioning.opportunityUtilization}%
- Competitive Context: ${positioning.competitiveContext}`;
}

function formatCharacterTraits(narrative: AcademicNarrativeAnalysis): string {
  if (narrative.characterTraits.length === 0) {
    return 'No specific traits identified.';
  }

  return narrative.characterTraits
    .map((t) => `- ${t.trait} (${t.strength}): ${t.evidence}`)
    .join('\n');
}

function formatRedNarratives(narrative: AcademicNarrativeAnalysis): string {
  if (narrative.redNarratives.length === 0) {
    return 'No significant concerns identified.';
  }

  return narrative.redNarratives
    .map((r) => `- ${r.issue}: ${r.context}`)
    .join('\n');
}

// ============================================================================
// MAIN TEACHING ENGINE
// ============================================================================

export interface TeachingEngineOptions {
  temperature?: number;
  maxRetries?: number;
  includeResearchCitations?: boolean;
}

export interface TeachingEngineResult {
  success: boolean;
  teaching?: AcademicTeaching;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

export class AcademicTeachingEngine {
  private readonly defaultTemperature = 0.7; // Slightly higher for more natural teaching tone
  private readonly maxRetries = 2;

  async generateTeaching(
    scores: AcademicDimensionScores,
    narrative: AcademicNarrativeAnalysis,
    positioning: ContextualPositioning,
    options: TeachingEngineOptions = {}
  ): Promise<TeachingEngineResult> {
    const temperature = options.temperature ?? this.defaultTemperature;
    const maxRetries = options.maxRetries ?? this.maxRetries;

    const { harvardScore, label: harvardLabel } = getHarvardLabel(scores.weightedTotal);

    // Build the prompt
    const prompt = TEACHING_PROMPT
      .replace('{narrativeType}', narrative.narrativeType)
      .replace('{narrativeSummary}', narrative.narrativeSummary)
      .replace('{rigorScore}', scores.rigor.score.toFixed(1))
      .replace('{rigorRationale}', scores.rigor.rationale)
      .replace('{performanceScore}', scores.performance.score.toFixed(1))
      .replace('{performanceRationale}', scores.performance.rationale)
      .replace('{characterScore}', scores.intellectualCharacter.score.toFixed(1))
      .replace('{characterRationale}', scores.intellectualCharacter.rationale)
      .replace('{trajectoryScore}', scores.trajectory.score.toFixed(1))
      .replace('{trajectoryRationale}', scores.trajectory.rationale)
      .replace('{totalScore}', scores.weightedTotal.toFixed(1))
      .replace('{harvardScore}', String(harvardScore))
      .replace('{harvardLabel}', harvardLabel)
      .replace('{positioningSummary}', formatPositioningSummary(positioning))
      .replace('{characterTraits}', formatCharacterTraits(narrative))
      .replace('{redNarratives}', formatRedNarratives(narrative));

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await callUnifiedLLM<AcademicTeaching>(prompt, {
          provider: 'claude',
          model: 'claude-sonnet-4-5-20250514',
          temperature,
          maxTokens: 2500,
          systemPrompt:
            'You are a warm, knowledgeable college counselor. Provide helpful, honest teaching about academic positioning. Be encouraging but truthful. Respond only with valid JSON.',
          useJsonMode: true,
        });

        // Validate and normalize
        const teaching = this.validateAndNormalize(response.content);

        // Calculate cost
        const cost =
          (response.usage.input_tokens * 3) / 1_000_000 +
          (response.usage.output_tokens * 15) / 1_000_000;

        return {
          success: true,
          teaching,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            cost,
          },
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[AcademicTeachingEngine] Attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error during teaching generation',
    };
  }

  private validateAndNormalize(content: unknown): AcademicTeaching {
    if (!content || typeof content !== 'object') {
      throw new Error('Invalid response: not an object');
    }

    const data = content as Record<string, unknown>;

    // Validate dimension explanations
    const validDimensions = ['rigor', 'performance', 'character', 'trajectory', 'overall'];
    const dimensionExplanations: TeachingMoment[] = Array.isArray(data.dimensionExplanations)
      ? data.dimensionExplanations.map((d: unknown) => {
          const exp = d as Record<string, unknown>;
          return {
            dimension: validDimensions.includes(exp.dimension as string)
              ? (exp.dimension as TeachingMoment['dimension'])
              : 'overall',
            insight: String(exp.insight || ''),
            researchBasis: String(exp.researchBasis || ''),
            actionableAdvice: String(exp.actionableAdvice || ''),
          };
        })
      : [];

    // Validate strength highlights
    const strengthHighlights: string[] = Array.isArray(data.strengthHighlights)
      ? data.strengthHighlights.filter((s): s is string => typeof s === 'string')
      : [];

    // Validate improvement areas
    const validPriorities = ['high', 'medium', 'low'] as const;
    const improvementAreas: AcademicTeaching['improvementAreas'] = Array.isArray(
      data.improvementAreas
    )
      ? data.improvementAreas.map((i: unknown) => {
          const area = i as Record<string, unknown>;
          return {
            area: String(area.area || ''),
            explanation: String(area.explanation || ''),
            concreteSteps: Array.isArray(area.concreteSteps)
              ? area.concreteSteps.filter((s): s is string => typeof s === 'string')
              : [],
            priority: validPriorities.includes(area.priority as (typeof validPriorities)[number])
              ? (area.priority as (typeof validPriorities)[number])
              : 'medium',
          };
        })
      : [];

    return {
      dimensionExplanations,
      strengthHighlights,
      improvementAreas,
      narrativeAdvice: String(data.narrativeAdvice || ''),
    };
  }
}

// ============================================================================
// SINGLETON & CONVENIENCE EXPORT
// ============================================================================

export const academicTeachingEngine = new AcademicTeachingEngine();

export async function generateAcademicTeaching(
  scores: AcademicDimensionScores,
  narrative: AcademicNarrativeAnalysis,
  positioning: ContextualPositioning,
  options?: TeachingEngineOptions
): Promise<TeachingEngineResult> {
  return academicTeachingEngine.generateTeaching(scores, narrative, positioning, options);
}

// ============================================================================
// FALLBACK TEACHING (When LLM unavailable)
// ============================================================================

export function generateFallbackTeaching(
  scores: AcademicDimensionScores,
  narrative: AcademicNarrativeAnalysis
): AcademicTeaching {
  const dimensionExplanations: TeachingMoment[] = [
    {
      dimension: 'rigor',
      insight: `Your rigor score of ${scores.rigor.score}/3 reflects the challenge level of your courseload.`,
      researchBasis:
        'Selective colleges consistently cite course rigor as a top factor in admissions decisions.',
      actionableAdvice:
        scores.rigor.score < 2
          ? 'Consider adding more challenging courses where available.'
          : 'Continue maintaining your challenging courseload.',
    },
    {
      dimension: 'performance',
      insight: `Your performance score of ${scores.performance.score}/2.5 reflects how well you performed in your courses.`,
      researchBasis:
        'Strong grades in rigorous courses signal college readiness and academic capability.',
      actionableAdvice:
        scores.performance.score < 1.5
          ? 'Focus on study habits and seek help early when struggling.'
          : 'Maintain your strong performance.',
    },
    {
      dimension: 'character',
      insight: `Your intellectual character score of ${scores.intellectualCharacter.score}/2.5 reflects the depth and passion visible in your record.`,
      researchBasis:
        'Admissions officers look for evidence of genuine intellectual curiosity beyond just grades.',
      actionableAdvice:
        scores.intellectualCharacter.score < 1.5
          ? 'Pursue deeper engagement in subjects you find genuinely interesting.'
          : 'Continue developing your areas of intellectual interest.',
    },
    {
      dimension: 'trajectory',
      insight: `Your trajectory score of ${scores.trajectory.score}/2 reflects the direction of your academic record.`,
      researchBasis: 'An upward trend can positively influence admissions decisions.',
      actionableAdvice:
        scores.trajectory.projectedDirection === 'concerning'
          ? 'Focus on reversing any declining trends immediately.'
          : 'Continue on your current path.',
    },
  ];

  const strengthHighlights: string[] = [];
  if (scores.rigor.score >= 2.5) {
    strengthHighlights.push('Strong course rigor');
  }
  if (scores.performance.score >= 2) {
    strengthHighlights.push('Excellent academic performance');
  }
  if (scores.intellectualCharacter.passionAreas.length > 0) {
    strengthHighlights.push(`Clear interest in ${scores.intellectualCharacter.passionAreas[0]}`);
  }
  if (scores.trajectory.projectedDirection === 'ascending') {
    strengthHighlights.push('Positive upward trajectory');
  }

  const improvementAreas: AcademicTeaching['improvementAreas'] = [];
  if (scores.rigor.score < 2) {
    improvementAreas.push({
      area: 'Course Rigor',
      explanation: 'Your courseload could be more challenging given your school\'s offerings.',
      concreteSteps: [
        'Review available AP/IB courses',
        'Consider dual enrollment options',
        'Talk to your counselor about challenging yourself more',
      ],
      priority: 'high',
    });
  }

  return {
    dimensionExplanations,
    strengthHighlights:
      strengthHighlights.length > 0 ? strengthHighlights : ['Unable to identify specific strengths'],
    improvementAreas,
    narrativeAdvice: `Based on your ${narrative.narrativeType.replace('_', ' ')} profile, focus on presenting your genuine academic journey and growth.`,
  };
}
