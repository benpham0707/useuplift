// @ts-nocheck
/**
 * Dynamic Technique Selector
 *
 * Uses Sonnet API calls to dynamically determine the most appropriate
 * writing technique for each issue - NO RIGID MAPPINGS.
 *
 * **Why Sonnet instead of Haiku:**
 * Technique selection is a NUANCED JUDGMENT that directly affects feedback quality.
 * Following the codebase pattern where Sonnet is used for "nuanced quality assessment"
 * (see conversationalContextGatherer.ts). Haiku is fast but may not reliably
 * distinguish between similar techniques or understand context deeply enough.
 *
 * **Philosophy:**
 * Rather than hardcoding "shallow_reflection -> reflection_depth",
 * we let the AI analyze the ACTUAL passage and determine what
 * technique would best address the specific problem in context.
 *
 * @version 1.1
 * @date January 2025
 */

import { getAnthropicClient } from '../../../lib/llm/claude';
import type Anthropic from '@anthropic-ai/sdk';
import type { TechniqueCategory } from './techniqueCategories';
import { TECHNIQUE_BUNDLES } from './techniqueCategories';

// ============================================================================
// CONSTANTS
// ============================================================================

// Use Sonnet 4.5 for nuanced technique selection decisions
// Technique selection is a nuanced judgment that directly affects feedback quality
// Sonnet 4.5 provides the best balance of quality and cost for this task
const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const SONNET_PRICING = {
  input: 3.0 / 1_000_000,   // $3.00 per million input tokens
  output: 15.0 / 1_000_000, // $15.00 per million output tokens
};

// ============================================================================
// TYPES
// ============================================================================

export interface TechniqueSelectionContext {
  passage: string;
  surroundingContext: string;
  essayType: string;
  fullEssay: string;
  diagnosedIssue: {
    type: string;
    description: string;
    specificWeakness?: string;
  };
  existingStrengths: TechniqueCategory[];
  voiceFingerprint?: {
    dominantRegister: string;
    voiceQualities: string[];
    authenticPhrases: string[];
  };
}

export interface DynamicTechniqueDecision {
  selectedTechnique: TechniqueCategory;
  confidence: number;
  reasoning: string;
  whyNotStorytelling?: string;
  alternativeTechniques: TechniqueCategory[];
  specificGuidance: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  cost: number;
}

// ============================================================================
// PROMPT: Dynamic Technique Selection
// ============================================================================

const TECHNIQUE_SELECTION_PROMPT = `You are an expert college essay coach determining the BEST writing technique for a specific passage issue.

Your job: Analyze the passage and diagnosed issue, then select the MOST APPROPRIATE technique - NOT defaulting to storytelling.

## THE 8 AVAILABLE TECHNIQUES

1. **storytelling** - Adding vivid scenes, dialogue, sensory details
   - USE WHEN: Pure claims with NO concrete moments at all
   - AVOID WHEN: Essay already has narrative, needs something else

2. **technical_depth** - Demonstrating intellectual substance/expertise
   - USE WHEN: Claims interest without showing actual engagement with field
   - Examples: Showing methodology, process, domain knowledge

3. **evidence_impact** - Quantifying outcomes with specific metrics
   - USE WHEN: Actions described but impact unclear
   - Examples: Numbers, percentages, measurable outcomes

4. **intellectual_character** - Revealing HOW you think, question, engage
   - USE WHEN: Lists activities without showing thought process
   - Examples: Ongoing questions, intellectual personality

5. **reflection_depth** - Going beyond surface lessons to real insight
   - USE WHEN: Conclusions feel generic or unearned
   - Examples: Unexpected realizations, qualified truths

6. **voice_authenticity** - Making writing sound like YOU, not "essay mode"
   - USE WHEN: Writing feels generic, AI-like, or performed
   - Examples: Personal phrases, honest admissions, specific voice

7. **complexity_showcase** - Showing tensions, paradoxes, unresolved questions
   - USE WHEN: Narrative is oversimplified, black-and-white
   - Examples: Both/and thinking, comfortable with ambiguity

8. **connection_specificity** - Naming specific programs, people, opportunities
   - USE WHEN: School references are generic ("great community")
   - Examples: Professor names, specific courses, research labs

## CONTEXT FOR THIS DECISION

**ESSAY TYPE:** {essayType}

**PASSAGE WITH ISSUE:**
"{passage}"

**SURROUNDING CONTEXT:**
{surroundingContext}

**DIAGNOSED ISSUE:**
- Type: {issueType}
- Description: {issueDescription}
- Specific weakness: {specificWeakness}

**VOICE FINGERPRINT:**
{voiceFingerprint}

**TECHNIQUES ALREADY STRONG IN ESSAY:**
{existingStrengths}

## YOUR ANALYSIS

Think carefully:
1. What is the ACTUAL problem with this passage?
2. What would GENUINELY improve it (not just what sounds good)?
3. Is storytelling REALLY the answer, or is something else more appropriate?
4. What technique addresses the ROOT cause, not just symptoms?

## CRITICAL RULES

- DO NOT default to storytelling. Many issues need OTHER techniques.
- If the essay already HAS narrative/story, storytelling is probably NOT the answer.
- Match the technique to the ACTUAL gap, not a generic mapping.
- Consider what's ALREADY working - don't recommend more of the same.
- A "Why Us" essay with generic claims needs connection_specificity, NOT more story.
- An activity essay with no metrics needs evidence_impact, NOT more story.
- A reflection that's shallow needs reflection_depth, NOT more story.

OUTPUT FORMAT (JSON):
{
  "selected_technique": "one of the 8 techniques",
  "confidence": 0.0-1.0,
  "reasoning": "Why this technique is the RIGHT choice for THIS specific passage",
  "why_not_storytelling": "If you didn't select storytelling, explain why story wouldn't help here",
  "alternative_techniques": ["second_best", "third_best"],
  "specific_guidance": "Concrete advice for applying this technique to THIS passage"
}`;

// ============================================================================
// DYNAMIC TECHNIQUE SELECTOR SERVICE
// ============================================================================

export class DynamicTechniqueSelector {
  private _client: Anthropic | null = null;

  private get client(): Anthropic {
    if (!this._client) this._client = getAnthropicClient();
    return this._client;
  }

  /**
   * Dynamically select the best technique using Sonnet API call
   * Sonnet is used (not Haiku) because technique selection is a nuanced judgment
   * that directly affects feedback quality.
   */
  async selectTechnique(
    context: TechniqueSelectionContext
  ): Promise<DynamicTechniqueDecision> {
    // Build the prompt with context
    const prompt = this.buildPrompt(context);

    try {
      const response = await this.client.messages.create({
        model: SONNET_MODEL,
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const inputTokens = response.usage?.input_tokens || 0;
      const outputTokens = response.usage?.output_tokens || 0;
      const cost = this.calculateCost(inputTokens, outputTokens);

      // Parse response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const parsed = this.parseResponse(content.text);

      return {
        ...parsed,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
        },
        cost,
      };
    } catch (error) {
      console.error('[DynamicTechniqueSelector] API call failed:', error);
      // Fallback to heuristic-based selection
      return this.fallbackSelection(context);
    }
  }

  /**
   * Build the prompt with all context
   */
  private buildPrompt(context: TechniqueSelectionContext): string {
    const voiceFingerprintStr = context.voiceFingerprint
      ? `- Register: ${context.voiceFingerprint.dominantRegister}
- Qualities: ${context.voiceFingerprint.voiceQualities.join(', ')}
- Authentic phrases to preserve: ${context.voiceFingerprint.authenticPhrases.slice(0, 3).join(', ')}`
      : 'Not available';

    const existingStrengthsStr = context.existingStrengths.length > 0
      ? context.existingStrengths.join(', ')
      : 'None identified yet';

    return TECHNIQUE_SELECTION_PROMPT
      .replace('{essayType}', context.essayType)
      .replace('{passage}', context.passage)
      .replace('{surroundingContext}', context.surroundingContext || 'Not provided')
      .replace('{issueType}', context.diagnosedIssue.type)
      .replace('{issueDescription}', context.diagnosedIssue.description)
      .replace('{specificWeakness}', context.diagnosedIssue.specificWeakness || 'Not specified')
      .replace('{voiceFingerprint}', voiceFingerprintStr)
      .replace('{existingStrengths}', existingStrengthsStr);
  }

  /**
   * Parse the API response
   */
  private parseResponse(text: string): Omit<DynamicTechniqueDecision, 'tokensUsed' | 'cost'> {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate technique
      const validTechniques: TechniqueCategory[] = [
        'storytelling', 'technical_depth', 'evidence_impact', 'intellectual_character',
        'reflection_depth', 'voice_authenticity', 'complexity_showcase', 'connection_specificity'
      ];

      const selectedTechnique = validTechniques.includes(parsed.selected_technique)
        ? parsed.selected_technique as TechniqueCategory
        : 'reflection_depth'; // Safe default

      return {
        selectedTechnique,
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.7)),
        reasoning: parsed.reasoning || 'Technique selected based on context analysis',
        whyNotStorytelling: parsed.why_not_storytelling,
        alternativeTechniques: (parsed.alternative_techniques || [])
          .filter((t: string) => validTechniques.includes(t as TechniqueCategory))
          .slice(0, 2) as TechniqueCategory[],
        specificGuidance: parsed.specific_guidance || '',
      };
    } catch (error) {
      console.error('[DynamicTechniqueSelector] Parse error:', error);
      return {
        selectedTechnique: 'reflection_depth',
        confidence: 0.5,
        reasoning: 'Fallback selection due to parse error',
        alternativeTechniques: ['voice_authenticity'],
        specificGuidance: 'Apply deeper reflection to this passage',
      };
    }
  }

  /**
   * Fallback to heuristic selection when API fails
   * This is a SOFT fallback, not a rigid mapping
   */
  private fallbackSelection(
    context: TechniqueSelectionContext
  ): DynamicTechniqueDecision {
    // Simple heuristics based on essay type and issue patterns
    // These are SOFT suggestions, not rigid mappings
    let technique: TechniqueCategory = 'reflection_depth';
    let reasoning = 'Heuristic fallback selection';

    const issueType = context.diagnosedIssue.type.toLowerCase();
    const description = context.diagnosedIssue.description.toLowerCase();

    // Essay type hints
    if (context.essayType === 'why_us' || context.essayType === 'why_major') {
      if (description.includes('generic') || description.includes('could apply anywhere')) {
        technique = 'connection_specificity';
        reasoning = 'Why Us/Major essays with generic claims need specific connections';
      }
    }

    // Issue description hints
    if (description.includes('number') || description.includes('quantif') || description.includes('metric')) {
      technique = 'evidence_impact';
      reasoning = 'Passage needs quantifiable evidence';
    } else if (description.includes('generic voice') || description.includes('ai-like') || description.includes('essay mode')) {
      technique = 'voice_authenticity';
      reasoning = 'Passage needs authentic voice';
    } else if (description.includes('oversimplif') || description.includes('black and white')) {
      technique = 'complexity_showcase';
      reasoning = 'Passage needs nuance and complexity';
    } else if (description.includes('no scene') || description.includes('no moment') || description.includes('pure claim')) {
      technique = 'storytelling';
      reasoning = 'Passage has pure claims without any concrete grounding';
    }

    // Don't recommend what's already overused
    const usageCounts = new Map<TechniqueCategory, number>();
    for (const t of context.existingStrengths) {
      usageCounts.set(t, (usageCounts.get(t) || 0) + 1);
    }
    if ((usageCounts.get(technique) || 0) >= 2) {
      // Pick an underused technique
      const alternatives: TechniqueCategory[] = [
        'reflection_depth', 'intellectual_character', 'voice_authenticity'
      ];
      for (const alt of alternatives) {
        if ((usageCounts.get(alt) || 0) < 2) {
          technique = alt;
          reasoning = `Alternative selected because ${technique} is already well-represented`;
          break;
        }
      }
    }

    return {
      selectedTechnique: technique,
      confidence: 0.6,
      reasoning,
      whyNotStorytelling: technique !== 'storytelling'
        ? 'Heuristic fallback: Other technique better matches the issue pattern'
        : undefined,
      alternativeTechniques: ['reflection_depth', 'voice_authenticity'].filter(t => t !== technique) as TechniqueCategory[],
      specificGuidance: TECHNIQUE_BUNDLES[technique]?.corePrinciples?.[0] || 'Apply this technique thoughtfully',
      tokensUsed: { input: 0, output: 0 },
      cost: 0,
    };
  }

  /**
   * Calculate cost
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    return inputTokens * SONNET_PRICING.input + outputTokens * SONNET_PRICING.output;
  }

  /**
   * Batch select techniques for multiple issues
   * More efficient than individual calls
   */
  async selectTechniquesForBatch(
    contexts: TechniqueSelectionContext[]
  ): Promise<DynamicTechniqueDecision[]> {
    // For small batches, parallel individual calls are fine
    if (contexts.length <= 3) {
      return Promise.all(contexts.map(ctx => this.selectTechnique(ctx)));
    }

    // For larger batches, we could implement a single batch prompt
    // For now, use parallel individual calls with rate limiting
    const results: DynamicTechniqueDecision[] = [];
    const batchSize = 3;

    for (let i = 0; i < contexts.length; i += batchSize) {
      const batch = contexts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(ctx => this.selectTechnique(ctx))
      );
      results.push(...batchResults);

      // Small delay between batches to avoid rate limits
      if (i + batchSize < contexts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }
}

// Export singleton
export const dynamicTechniqueSelector = new DynamicTechniqueSelector();

// ============================================================================
// HELPER: Quick technique check without full API call
// Uses the dynamic selector for single-issue decisions
// ============================================================================

export async function selectTechniqueForIssue(
  passage: string,
  issueType: string,
  issueDescription: string,
  essayType: string,
  fullEssay: string,
  existingStrengths: TechniqueCategory[] = []
): Promise<TechniqueCategory> {
  const decision = await dynamicTechniqueSelector.selectTechnique({
    passage,
    surroundingContext: '',
    essayType,
    fullEssay,
    diagnosedIssue: {
      type: issueType,
      description: issueDescription,
    },
    existingStrengths,
  });

  return decision.selectedTechnique;
}
