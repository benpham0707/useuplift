/**
 * Rubric Analysis Service
 *
 * Calls LLM to score the 12 dimensions of Rubric v1.0.1.
 * Returns raw scores and evidence which are then processed by the
 * deterministic RubricScorer (interaction rules, etc.).
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import { ESSAY_RUBRIC_V1_0_1 } from '@/core/essay/rubrics/v1.0.1';
import { RubricDimensionDefinition } from '@/core/essay/types/rubric';
import { NarrativeEssayInput, HolisticUnderstanding } from '../types';

export interface DimensionRawScore {
  dimension_name: string;
  score: number;
  evidence: {
    quotes: string[];
    justification: string;
    anchors_met: number[];
  };
}

// ============================================================================
// BATCHING STRATEGY (12 dimensions -> 3 calls of 4)
// ============================================================================

// Group similar dimensions to help LLM focus
const BATCHES = {
  narrative: [
    'opening_power_scene_entry',
    'narrative_arc_stakes_turn',
    'character_interiority_vulnerability',
    'structure_pacing_coherence'
  ],
  craft: [
    'show_dont_tell_craft',
    'word_economy_craft',
    'originality_specificity_voice',
    'craft_language_quality' // Wait, is this in v1.0.1?
  ],
  content: [
    'reflection_meaning_making',
    'intellectual_vitality_curiosity',
    'context_constraints_disclosure',
    'ethical_awareness_humility',
    'school_program_fit' // Conditional, but we'll include for completeness or handle separately
  ]
};

// Let's double check the dimensions against v1.0.1 export
const ALL_DIMENSIONS = ESSAY_RUBRIC_V1_0_1.dimensions.map(d => d.name);

// Re-organize batches dynamically to ensure we cover everything in v1.0.1
function getBatches() {
  const dims = [...ESSAY_RUBRIC_V1_0_1.dimensions];
  const batches: RubricDimensionDefinition[][] = [];
  const batchSize = 4;

  for (let i = 0; i < dims.length; i += batchSize) {
    batches.push(dims.slice(i, i + batchSize));
  }
  return batches;
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

function buildSystemPrompt(dimensions: RubricDimensionDefinition[]): string {
  return `You are an expert college admissions evaluator.
Your task: Score the following essay dimensions based on the provided Rubric v1.0.1.

**Scoring Philosophy:**
- **Fair but Rigorous:** Evaluate the essay based on high school standards, not published literature.
- **Baseline is 5:** A standard, competent high school essay starts at 5/10.
- **Deduct for Weakness:** Scores go down for cliches, vagueness, or poor execution.
- **Reward for Strength:** Scores go up for unique voice, specific details, and genuine vulnerability.
- **Evidence is mandatory:** You must quote the text to support your score.

**Dimensions to Score:**

${dimensions.map(d => `
### ${d.display_name} (${d.name})
*Definition:* ${d.definition}

*Anchors:*
- 0: ${d.anchors.find(a => a.score === 0)?.text}
- 5: ${d.anchors.find(a => a.score === 5)?.text}
- 10: ${d.anchors.find(a => a.score === 10)?.text}

*Warning Signs:* ${d.warning_signs.join(', ')}
`).join('\n\n')}

**Output Format:**
Return a JSON object with a "scores" array. Each item:
{
  "dimension_name": "string (must match exact ID)",
  "score": number (0-10, use 0.5 increments),
  "evidence": {
    "quotes": ["exact quote 1", "exact quote 2"],
    "justification": "Detailed explanation of why this score was given. Reference specific anchors met or missed.",
    "constructive_feedback": "One specific, actionable tip to improve this score. Be encouraging but direct.",
    "anchors_met": [numbers of anchors met, e.g. 5]
  }
}
`;
}

function buildUserPrompt(
  essayText: string,
  holisticContext?: HolisticUnderstanding
): string {
  let prompt = `**Essay Text:**\n"""\n${essayText}\n"""\n`;

  if (holisticContext) {
    prompt += `\n**Context:**
- Essay Type: ${holisticContext.estimatedStrengthTier} strength
- Theme: ${holisticContext.centralTheme}
`;
  }

  return prompt;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function getRubricScores(
  input: NarrativeEssayInput,
  holisticContext?: HolisticUnderstanding
): Promise<DimensionRawScore[]> {
  console.log('📊 Running Rubric Analysis (v1.0.1)...');
  
  const batches = getBatches();
  const promises = batches.map(async (batch) => {
    const systemPrompt = buildSystemPrompt(batch);
    const userPrompt = buildUserPrompt(input.essayText, holisticContext);

    const response = await callClaudeWithRetry(
      userPrompt,
      {
        systemPrompt,
        temperature: 0.2, // Low temp for rigorous scoring
        useJsonMode: true,
        maxTokens: 2000
      }
    );

    // Parse response
    if (typeof response.content === 'string') {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.scores as DimensionRawScore[];
        }
    } else if (typeof response.content === 'object') {
        return (response.content as any).scores as DimensionRawScore[];
    }
    
    return [];
  });

  const results = await Promise.all(promises);
  const allScores = results.flat();

  // Validate we got all scores
  const missing = ALL_DIMENSIONS.filter(
    d => !allScores.find(s => s.dimension_name === d)
  );

  if (missing.length > 0) {
    console.warn(`⚠️ Missing scores for dimensions: ${missing.join(', ')}`);
    // Fill with zeros to prevent crashes
    missing.forEach(d => {
        allScores.push({
            dimension_name: d,
            score: 0,
            evidence: {
                quotes: [],
                justification: "Scoring failed for this dimension.",
                anchors_met: []
            }
        });
    });
  }

  console.log(`✅ Scored ${allScores.length} dimensions.`);
  return allScores;
}

