// @ts-nocheck
/**
 * Value Alignment Guidance Service
 *
 * **PURPOSE**: Provide college-specific guidance based on VALUE alignment, not program references.
 *
 * **KEY INSIGHT FROM ADMISSIONS ACCURACY TESTING**:
 * - Admissions officers recognize MINDSET, not vocabulary
 * - An essay with zero program mentions can score 85+ if it demonstrates the right values
 * - Name-dropping without substance scores < 50
 * - The primary college-specific layer should be: "What values to emphasize and HOW"
 *
 * **WHAT THIS SERVICE DOES**:
 * 1. Analyzes which college values an essay ALREADY demonstrates
 * 2. Identifies which values are MISSING or WEAK
 * 3. Provides actionable guidance on HOW to demonstrate missing values
 * 4. Gives specific examples of what "good" looks like for each value
 * 5. DOES NOT suggest adding program names - focuses on mindset/approach
 *
 * **ARCHITECTURE**:
 * - Uses semantic value detection from collegeTailoringScoringService
 * - Provides value-specific guidance using IS/IS NOT indicators
 * - Returns actionable, specific suggestions tied to essay content
 */

import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient } from '../../../lib/llm/claude';
import { parseClaudeJSON } from '../utils/jsonParser';
import type { CollegeResearch, CollegeCoreValue } from '../types/collegeResearch';

// ============================================================================
// TYPES
// ============================================================================

export interface ValueAlignmentInput {
  essay_text: string;
  college: CollegeResearch;
  // Optional: Pre-computed values from scoring service
  values_detected?: Array<{
    value_id: string;
    value_name: string;
    strength: 'strong' | 'moderate' | 'weak' | 'absent';
    evidence?: string[];
    semantic_reasoning?: string;
  }>;
}

export interface ValueGuidance {
  value_id: string;
  value_name: string;
  current_strength: 'strong' | 'moderate' | 'weak' | 'absent';
  priority: 'critical' | 'high' | 'medium' | 'low';

  // What the essay currently shows (if anything)
  current_evidence: string[];

  // How to strengthen this value in the essay
  guidance: {
    what_to_add: string;       // Specific addition suggestion
    where_to_add: string;      // Location in essay
    example_phrasing: string;  // How it might sound
    why_this_works: string;    // Connects to IS indicators
  } | null;

  // What NOT to do (common mistakes)
  avoid: string[];
}

export interface CrossCollegeInsight {
  comparison: string;           // "Your essay fits Stanford better than MIT because..."
  stanford_fit_reason?: string;
  mit_fit_reason?: string;
  harvard_fit_reason?: string;
  uchicago_fit_reason?: string;
  adjustment_needed?: string;   // "To better fit [target], consider..."
}

export interface ValueAlignmentOutput {
  college_name: string;
  overall_value_alignment: 'excellent' | 'good' | 'moderate' | 'weak';
  overall_score_estimate: number; // 0-100

  // Primary output: How to improve value alignment
  value_guidance: ValueGuidance[];

  // What the essay already does well
  strengths: string[];

  // Cross-college insight (optional, if multiple colleges analyzed)
  cross_college_insight?: CrossCollegeInsight;

  // Summary action items
  action_items: Array<{
    priority: 'critical' | 'high' | 'medium';
    action: string;
    reason: string;
  }>;

  // Cost tracking
  cost: number;
  tokens_used: {
    input: number;
    output: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';

const SONNET_PRICING = {
  input: 3.0 / 1_000_000,
  output: 15.0 / 1_000_000,
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ValueAlignmentGuidanceService {
  private client: Anthropic;

  constructor() {
    this.client = getAnthropicClient();
  }

  /**
   * Generate value-alignment guidance for an essay
   */
  async generateGuidance(input: ValueAlignmentInput): Promise<ValueAlignmentOutput> {
    const { essay_text, college, values_detected } = input;

    // Get top 5 core values for this college
    const coreValues = college.coreValues?.slice(0, 5) || [];

    if (coreValues.length === 0) {
      throw new Error(`No core values defined for ${college.collegeName}`);
    }

    const prompt = this.buildGuidancePrompt(essay_text, college, coreValues, values_detected);

    try {
      const response = await this.client.messages.create({
        model: SONNET_MODEL,
        max_tokens: 3000,
        temperature: 0.2, // Slight creativity for guidance, but mostly deterministic
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const parsed = parseClaudeJSON<{
        overall_alignment: 'excellent' | 'good' | 'moderate' | 'weak';
        score_estimate: number;
        value_assessments: Array<{
          value_id: string;
          value_name: string;
          current_strength: 'strong' | 'moderate' | 'weak' | 'absent';
          priority: 'critical' | 'high' | 'medium' | 'low';
          current_evidence: string[];
          guidance: {
            what_to_add: string;
            where_to_add: string;
            example_phrasing: string;
            why_this_works: string;
          } | null;
          avoid: string[];
        }>;
        strengths: string[];
        action_items: Array<{
          priority: 'critical' | 'high' | 'medium';
          action: string;
          reason: string;
        }>;
      }>(content.text, 'value alignment guidance');

      // Calculate costs
      const inputTokens = response.usage?.input_tokens || 0;
      const outputTokens = response.usage?.output_tokens || 0;
      const cost = (inputTokens * SONNET_PRICING.input) + (outputTokens * SONNET_PRICING.output);

      return {
        college_name: college.collegeName,
        overall_value_alignment: parsed.overall_alignment,
        overall_score_estimate: parsed.score_estimate,
        value_guidance: parsed.value_assessments,
        strengths: parsed.strengths,
        action_items: parsed.action_items,
        cost,
        tokens_used: {
          input: inputTokens,
          output: outputTokens,
        },
      };
    } catch (error) {
      console.error('[ValueAlignmentGuidanceService] Failed to generate guidance:', error);
      throw error;
    }
  }

  /**
   * Generate cross-college comparison
   */
  async generateCrossCollegeComparison(
    essay_text: string,
    target_college: CollegeResearch,
    comparison_colleges: CollegeResearch[]
  ): Promise<CrossCollegeInsight> {
    const prompt = `You are an expert college admissions counselor analyzing essay FIT across multiple schools.

ESSAY:
${essay_text}

TARGET COLLEGE: ${target_college.collegeName}
Target values: ${target_college.coreValues?.slice(0, 3).map(v => v.valueName).join(', ')}

COMPARISON COLLEGES:
${comparison_colleges.map(c => `- ${c.collegeName}: Values ${c.coreValues?.slice(0, 3).map(v => v.valueName).join(', ')}`).join('\n')}

Analyze which college this essay fits BEST and WHY. Focus on MINDSET, not vocabulary.

Output JSON:
{
  "comparison": "This essay fits [BEST COLLEGE] better than [OTHER COLLEGES] because...",
  "best_fit": "stanford|mit|harvard|uchicago",
  "best_fit_reason": "The essay demonstrates [specific mindset/approach] that aligns with [college]'s value of [value]",
  "target_fit_assessment": "How well does this essay fit the TARGET college?",
  "adjustment_needed": "To better fit [target college], consider [specific guidance]"
}`;

    try {
      const response = await this.client.messages.create({
        model: SONNET_MODEL,
        max_tokens: 1000,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const parsed = parseClaudeJSON<{
        comparison: string;
        best_fit: string;
        best_fit_reason: string;
        target_fit_assessment: string;
        adjustment_needed: string;
      }>(content.text, 'cross-college comparison');

      return {
        comparison: parsed.comparison,
        adjustment_needed: parsed.adjustment_needed,
      };
    } catch (error) {
      console.error('[ValueAlignmentGuidanceService] Cross-college comparison failed:', error);
      throw error;
    }
  }

  /**
   * Build the guidance prompt
   */
  private buildGuidancePrompt(
    essay_text: string,
    college: CollegeResearch,
    coreValues: CollegeCoreValue[],
    values_detected?: Array<{
      value_id: string;
      value_name: string;
      strength: 'strong' | 'moderate' | 'weak' | 'absent';
      evidence?: string[];
      semantic_reasoning?: string;
    }>
  ): string {
    // Build value definitions with IS/IS NOT indicators
    const valueDefinitions = coreValues.map(v => `
### ${v.valueName} (ID: ${v.valueId}) - Weight: ${v.weight}%

**Definition**: ${v.definition}

**Essay Implication**: ${v.essayImplication}

**THIS VALUE IS PRESENT when the essay shows**:
${v.is && v.is.length > 0 ? v.is.map(i => `  ✓ ${i}`).join('\n') : '  (See definition)'}

**THIS VALUE IS ABSENT/WRONG when the essay shows**:
${v.isNot && v.isNot.length > 0 ? v.isNot.map(i => `  ✗ ${i}`).join('\n') : '  (Opposite of above)'}

**Evidence from ${college.collegeName}**:
${v.evidence?.slice(0, 2).map(e => `  "${e.quote}" - ${e.source}`).join('\n') || '  (Official sources support this value)'}
`).join('\n');

    // Include pre-detected values if available
    const detectedSection = values_detected && values_detected.length > 0 ? `
## PRE-DETECTED VALUES (from scoring)

${values_detected.map(v => `- ${v.value_name}: ${v.strength}
  Evidence: ${v.evidence?.join('; ') || 'None detected'}
  Reasoning: ${v.semantic_reasoning || 'N/A'}`).join('\n')}
` : '';

    return `You are an expert ${college.collegeName} admissions counselor providing VALUE-ALIGNMENT guidance.

## CRITICAL PRINCIPLE

Your guidance must focus on HOW TO DEMONSTRATE VALUES, not what programs to mention.

**ABSOLUTELY DO NOT suggest adding:**
- Program names (HAI, SAIL, specific labs, institutes)
- Professor names
- Building/center names
- Course names
- Any college-specific vocabulary or references

**GOOD GUIDANCE**: "Show your intellectual curiosity by describing a specific question that kept you thinking for weeks, and the unexpected connections you discovered"

**BAD GUIDANCE**: "Mention Stanford's HAI institute" (name-dropping)
**BAD GUIDANCE**: "Reference Professor X's work" (still name-dropping)
**BAD GUIDANCE**: "Connect to the d.school's approach" (program reference)

Your job is to teach students HOW TO THINK and WHAT TO SHOW, not what programs to mention.

## ESSAY TO ANALYZE

${essay_text}

## ${college.collegeName.toUpperCase()} CORE VALUES

${valueDefinitions}
${detectedSection}

## YOUR TASK

Analyze this essay against ${college.collegeName}'s values and provide ACTIONABLE guidance.

For EACH core value:
1. Assess current strength (strong/moderate/weak/absent)
2. Cite specific evidence from the essay (or note its absence)
3. If weak/absent AND high priority, provide specific guidance:
   - WHAT to add (behavior/mindset to demonstrate)
   - WHERE to add it (specific location in essay)
   - EXAMPLE phrasing (how it might sound - NOT program names)
   - WHY this works (connects to IS indicators)
4. List what to AVOID (connects to IS NOT indicators)

## PRIORITY RULES

- **Critical**: Top 2 values for ${college.collegeName} that are weak/absent
- **High**: Values with weight > 15% that are weak/absent
- **Medium**: Any value that could be strengthened
- **Low**: Values already demonstrated strongly

## OUTPUT FORMAT (JSON)

{
  "overall_alignment": "excellent|good|moderate|weak",
  "score_estimate": 75,
  "value_assessments": [
    {
      "value_id": "intellectual_vitality",
      "value_name": "Intellectual Vitality",
      "current_strength": "moderate",
      "priority": "critical",
      "current_evidence": ["The essay mentions reading philosophy books"],
      "guidance": {
        "what_to_add": "Show the PROCESS of your curiosity - what question sparked it, where it led you, what unexpected connections you found",
        "where_to_add": "After the sentence about reading philosophy, before the conclusion",
        "example_phrasing": "That one footnote in Singer led me down a three-week rabbit hole into Buddhist ethics, which somehow ended with me building an Arduino sensor. I still don't fully understand the connection, but I can't stop thinking about it.",
        "why_this_works": "Demonstrates 'Questions you can't stop thinking about' and 'Unexpected intellectual rabbit holes' - both IS indicators for Intellectual Vitality"
      },
      "avoid": ["Generic statements about 'loving to learn'", "Listing books without showing engagement", "Claiming curiosity without demonstrating it"]
    },
    {
      "value_id": "authentic_voice",
      "value_name": "Authentic Voice",
      "current_strength": "strong",
      "priority": "low",
      "current_evidence": ["The conversational tone throughout", "Admission of confusion: 'I still don't understand'"],
      "guidance": null,
      "avoid": ["Adding formal language", "Removing the honest uncertainty"]
    }
  ],
  "strengths": [
    "Authentic voice is strong - the conversational tone feels genuine",
    "Shows vulnerability in admitting confusion"
  ],
  "action_items": [
    {
      "priority": "critical",
      "action": "Expand the intellectual journey - show WHERE your curiosity took you, not just THAT you were curious",
      "reason": "Intellectual Vitality is Stanford's #1 value (40% weight) and currently only moderate"
    },
    {
      "priority": "high",
      "action": "Add a specific moment of unexpected discovery or connection",
      "reason": "This distinguishes genuine curiosity from performed curiosity"
    }
  ]
}

Be specific and actionable. Focus on MINDSET and APPROACH, not program references.`;
  }

  /**
   * Generate quick value alignment summary (lighter weight)
   */
  async generateQuickSummary(
    essay_text: string,
    college: CollegeResearch
  ): Promise<{
    alignment: 'excellent' | 'good' | 'moderate' | 'weak';
    top_strength: string;
    top_gap: string;
    one_action: string;
  }> {
    const coreValues = college.coreValues?.slice(0, 3) || [];

    const prompt = `Quick analysis: How well does this essay align with ${college.collegeName}'s values?

ESSAY (first 500 chars):
${essay_text.substring(0, 500)}...

${college.collegeName} TOP VALUES:
${coreValues.map(v => `- ${v.valueName}: ${v.essayImplication}`).join('\n')}

Output JSON:
{
  "alignment": "excellent|good|moderate|weak",
  "top_strength": "One sentence: what value is shown well",
  "top_gap": "One sentence: what key value is missing",
  "one_action": "One specific thing to add (not program names)"
}`;

    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 300,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return parseClaudeJSON<{
      alignment: 'excellent' | 'good' | 'moderate' | 'weak';
      top_strength: string;
      top_gap: string;
      one_action: string;
    }>(content.text, 'quick summary');
  }
}

// Singleton export
export const valueAlignmentGuidanceService = new ValueAlignmentGuidanceService();
