// @ts-nocheck
/**
 * Technique Suggestion Router
 *
 * THE DECISION TREE ARCHITECTURE: This router replaces the one-size-fits-all
 * storytelling approach with a context-aware technique selection system.
 *
 * HOW IT WORKS:
 * 1. Receives an issue bundle (same input as batch generation)
 * 2. Uses TechniqueDecisionTree to decide which technique is MOST appropriate
 * 3. Routes to the technique-specific suggestion generator
 * 4. Returns the same output format (IssueSurgicalTeaching)
 *
 * KEY PRINCIPLES:
 * - INTERCHANGEABLE: Same input/output interface as storytelling system
 * - NOT STACKED: Only ONE technique runs per issue
 * - EQUAL DEPTH: Each technique path has production-grade quality
 * - DECISION BASED: Context determines technique, not defaults
 *
 * @version 1.0
 * @date January 2025
 */

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient } from '../../../lib/llm/claude';
import { parseClaudeJSON } from '../utils/jsonParser';
import type { VoiceFingerprint } from '../types/stage0Types';
import type {
  IssueContextBundle,
  HolisticContext,
  IssueSurgicalTeaching,
  PolishedOriginalSuggestion,
  VoiceAmplifierSuggestion,
  TeachingLayer,
} from './batchGenerationService';
import { techniqueDecisionTree, type TechniqueDecision } from './techniqueDecisionTree';
import { essayElementDetector, type ElementAnalysis } from './essayElementDetector';
import { getSourcesForTechnique } from '../data/techniqueSources';
import { TECHNIQUE_BUNDLES, type TechniqueCategory } from './techniqueCategories';
import type { EnhancedLabeledSource } from '../types/labeledSourceTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const SONNET_PRICING = {
  input: 3.0 / 1_000_000,
  output: 15.0 / 1_000_000,
};

// Banned terms across ALL techniques
const BANNED_TERMS = [
  'tapestry',
  'realm',
  'unwavering',
  'testament',
  'delve',
  'showcase',
  'underscore',
  'journey',
  'toolbox',
  'unlocking potential',
  'transformative experience',
  'profound impact',
  'multifaceted',
];

// ============================================================================
// TYPES
// ============================================================================

/**
 * Extended context bundle with technique decision
 */
export interface TechniqueAwareBundle extends IssueContextBundle {
  technique_decision: TechniqueDecision;
  element_analysis: ElementAnalysis;
  technique_sources: EnhancedLabeledSource[];
}

/**
 * Router output with technique metadata
 */
export interface RoutedSuggestionOutput {
  issue: IssueSurgicalTeaching;
  technique_used: TechniqueCategory;
  technique_reasoning: string;
  alternatives_considered: TechniqueCategory[];
  cost: number;
  tokens_used: {
    input: number;
    output: number;
  };
}

// ============================================================================
// TECHNIQUE-SPECIFIC PROMPT TEMPLATES
// ============================================================================

/**
 * Get the technique-specific prompt based on the decision
 */
function getTechniquePrompt(
  technique: TechniqueCategory,
  bundle: IssueContextBundle,
  voiceFingerprint: VoiceFingerprint,
  sources: EnhancedLabeledSource[],
  teachingBundle: typeof TECHNIQUE_BUNDLES[TechniqueCategory]
): string {
  const sourcesFormatted = sources
    .slice(0, 3) // Top 3 most relevant
    .map(s => `- "${s.quote}" — ${s.author}, ${s.author_title}`)
    .join('\n');

  const transformationsFormatted = (teachingBundle.transformations || [])
    .slice(0, 2)
    .map(t => `BEFORE: "${t.before}"\nAFTER: "${t.after}"\nWHY: ${t.why_it_works}`)
    .join('\n\n');

  const basePrompt = `You are providing surgical teaching for a college admissions essay issue.

═══════════════════════════════════════════════════════════
SELECTED TECHNIQUE: ${technique.toUpperCase().replace(/_/g, ' ')}
═══════════════════════════════════════════════════════════

CORE PRINCIPLE:
${teachingBundle.corePrinciples.join('; ')}

WHY THIS TECHNIQUE (NOT STORYTELLING):
${teachingBundle.whenToUse.join('\n- ')}

═══════════════════════════════════════════════════════════
RESEARCH-BACKED EVIDENCE
═══════════════════════════════════════════════════════════

${sourcesFormatted}

═══════════════════════════════════════════════════════════
EXAMPLE TRANSFORMATIONS
═══════════════════════════════════════════════════════════

${transformationsFormatted}

═══════════════════════════════════════════════════════════
THE ISSUE TO ADDRESS
═══════════════════════════════════════════════════════════

TARGET QUOTE:
"${bundle.quote}"

LOCATION: ${bundle.location}

DIAGNOSIS:
- Problem: ${bundle.diagnosis.diagnosis}
- Specific Weakness: ${bundle.diagnosis.specific_weakness}
- Prescription: ${bundle.diagnosis.prescription}

SURROUNDING CONTEXT:
${bundle.surrounding_context}

═══════════════════════════════════════════════════════════
VOICE FINGERPRINT (PRESERVE)
═══════════════════════════════════════════════════════════

- Register: ${voiceFingerprint.dominant_register}
- Voice Qualities: ${voiceFingerprint.voice_qualities.join(', ')}
- Vocabulary Level: ${voiceFingerprint.vocabulary_level}
- Authentic Phrases to Preserve: ${voiceFingerprint.authentic_phrases.join('; ')}

═══════════════════════════════════════════════════════════
GENERATION REQUIREMENTS
═══════════════════════════════════════════════════════════

Generate 2 DISTINCT suggestions that apply the ${technique.replace(/_/g, ' ')} technique:

1. **POLISHED ORIGINAL** - Safe, incremental improvement
   - Applies ${technique.replace(/_/g, ' ')} technique with minimal risk
   - Maintains original structure while adding depth
   - Best for students wanting reliable improvement

2. **VOICE AMPLIFIER** - Authentic, creative alternative
   - Fully commits to ${technique.replace(/_/g, ' ')} approach
   - Takes creative risks for stronger impact
   - Best for students wanting distinctive voice

CRITICAL:
- Do NOT use storytelling/show-don't-tell unless that was the selected technique
- Apply ${technique.replace(/_/g, ' ')} principles specifically
- Reference the research evidence provided
- NO banned terms: ${BANNED_TERMS.join(', ')}

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════

{
  "polished_original": {
    "type": "polished_original",
    "text": "[refined passage applying ${technique.replace(/_/g, ' ')}]",
    "rationale": "[why this works, citing research]",
    "what_changed": ["[specific change 1]", "[specific change 2]"],
    "voice_preservation": "[how we maintained their voice]",
    "score_impact": {
      "dimension": "[most improved dimension]",
      "before": [1-10],
      "after": [1-10],
      "increase": [difference]
    },
    "evidence_used": {
      "quote": "[research quote used]",
      "source": "[author/source]"
    },
    "when_to_use": "Choose this when...",
    "safety_level": "very_safe|safe|moderate_risk"
  },
  "voice_amplifier": {
    "type": "voice_amplifier",
    "text": "[bold alternative applying ${technique.replace(/_/g, ' ')}]",
    "rationale": "[why this feels more authentic]",
    "what_changed": ["[specific change 1]", "[specific change 2]"],
    "voice_preservation": "[how we amplified their voice]",
    "score_impact": {
      "dimension": "[most improved dimension]",
      "before": [1-10],
      "after": [1-10],
      "increase": [difference]
    },
    "evidence_used": {
      "quote": "[research quote used]",
      "source": "[author/source]"
    },
    "when_to_use": "Choose this when...",
    "risk_level": "low|medium|high",
    "why_authentic": "[what makes this feel real]",
    "spark_moments": ["[phrase that shines]", "[another phrase]"]
  },
  "teaching": {
    "concept_review": "[connection to ${technique.replace(/_/g, ' ')} principle]",
    "why_this_matters": "[impact on admissions]",
    "how_to_choose": {
      "polished_when": "Use polished when...",
      "voice_when": "Use voice amplifier when...",
      "can_combine": "How to use elements of both..."
    },
    "socratic_prompts": [
      "[thought-provoking question 1]",
      "[thought-provoking question 2]"
    ]
  }
}`;

  return basePrompt;
}

// ============================================================================
// MAIN ROUTER CLASS
// ============================================================================

export class TechniqueSuggestionRouter {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = apiKey ? new Anthropic({ apiKey }) : getAnthropicClient();
  }

  /**
   * Route a single issue to the appropriate technique and generate suggestions
   *
   * This is the main entry point - it:
   * 1. Analyzes the issue context
   * 2. Decides which technique to use
   * 3. Generates technique-specific suggestions
   * 4. Returns standard IssueSurgicalTeaching format
   */
  async routeAndGenerate(
    bundle: IssueContextBundle,
    voiceFingerprint: VoiceFingerprint,
    essayType: string,
    fullEssay: string
  ): Promise<RoutedSuggestionOutput> {
    // Step 1: Analyze which element this passage belongs to
    // Calculate passage position in essay
    const passageIndex = fullEssay.indexOf(bundle.quote);
    const passagePosition = this.calculatePassagePosition(passageIndex, fullEssay.length);

    const elementAnalysis = essayElementDetector.detectElement(
      bundle.quote,
      essayType as any,
      { fullEssay, passagePosition }
    );

    // Step 2: Get technique decision from decision tree
    const techniqueDecision = techniqueDecisionTree.decide({
      essayType: essayType as any,
      essay: fullEssay,
      wordCount: fullEssay.split(/\s+/).length,
      existingStrengths: [],
      detectedIssues: [{
        type: bundle.diagnosis.symptom_type,
        severity: 'major',
        location: bundle.location,
        description: bundle.diagnosis.diagnosis,
      }],
    });

    // Step 3: Get sources and teaching bundle for selected technique
    const technique = techniqueDecision.primary.category as TechniqueCategory;
    const sources = getSourcesForTechnique(technique);
    const teachingBundle = TECHNIQUE_BUNDLES[technique];

    if (!teachingBundle) {
      // Fallback to storytelling if technique not found
      console.warn(`No teaching bundle for technique: ${technique}, falling back to storytelling`);
      return this.routeAndGenerate(
        { ...bundle, diagnosis: { ...bundle.diagnosis, symptom_type: 'telling_not_showing' } },
        voiceFingerprint,
        essayType,
        fullEssay
      );
    }

    // Step 4: Generate suggestions using technique-specific prompt
    const prompt = getTechniquePrompt(
      technique,
      bundle,
      voiceFingerprint,
      sources,
      teachingBundle
    );

    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Sonnet');
    }

    // Step 5: Parse and validate response
    const parsed = parseClaudeJSON(content.text, 'TechniqueSuggestionOutput');

    // Step 6: Calculate cost
    const cost =
      response.usage.input_tokens * SONNET_PRICING.input +
      response.usage.output_tokens * SONNET_PRICING.output;

    // Step 7: Build standard output format
    const surgicalTeaching: IssueSurgicalTeaching = {
      issue_number: bundle.issue_number,
      issue_quote: bundle.quote,
      diagnosis_summary: `${bundle.diagnosis.diagnosis} (Technique: ${technique.replace(/_/g, ' ')})`,
      suggestions: {
        polished_original: {
          ...parsed.polished_original,
          type: 'polished_original',
        } as PolishedOriginalSuggestion,
        voice_amplifier: {
          ...parsed.voice_amplifier,
          type: 'voice_amplifier',
        } as VoiceAmplifierSuggestion,
      },
      teaching: parsed.teaching as TeachingLayer,
    };

    return {
      issue: surgicalTeaching,
      technique_used: technique,
      technique_reasoning: techniqueDecision.reasoning,
      alternatives_considered: techniqueDecision.alternatives as TechniqueCategory[],
      cost,
      tokens_used: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  /**
   * Batch route multiple issues - each gets its own optimal technique
   *
   * Unlike the old batch generation which applied the same approach to all issues,
   * this routes each issue to its most appropriate technique independently.
   */
  async batchRouteAndGenerate(
    bundles: IssueContextBundle[],
    voiceFingerprint: VoiceFingerprint,
    essayType: string,
    fullEssay: string,
    holisticContext: HolisticContext
  ): Promise<{
    issues: IssueSurgicalTeaching[];
    technique_breakdown: Record<TechniqueCategory, number>;
    total_cost: number;
    tokens_used: { input: number; output: number };
  }> {
    const results: RoutedSuggestionOutput[] = [];
    const techniqueBreakdown: Record<string, number> = {};

    // Process each issue with its optimal technique
    for (const bundle of bundles) {
      const result = await this.routeAndGenerate(
        bundle,
        voiceFingerprint,
        essayType,
        fullEssay
      );
      results.push(result);

      // Track technique usage
      techniqueBreakdown[result.technique_used] =
        (techniqueBreakdown[result.technique_used] || 0) + 1;
    }

    // Aggregate results
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    const totalInputTokens = results.reduce((sum, r) => sum + r.tokens_used.input, 0);
    const totalOutputTokens = results.reduce((sum, r) => sum + r.tokens_used.output, 0);

    return {
      issues: results.map(r => r.issue),
      technique_breakdown: techniqueBreakdown as Record<TechniqueCategory, number>,
      total_cost: totalCost,
      tokens_used: {
        input: totalInputTokens,
        output: totalOutputTokens,
      },
    };
  }

  /**
   * Calculate passage position in essay (start/early/middle/late/end)
   */
  private calculatePassagePosition(
    passageIndex: number,
    essayLength: number
  ): 'start' | 'early' | 'middle' | 'late' | 'end' {
    if (passageIndex < 0) return 'middle'; // Not found, default to middle
    const ratio = passageIndex / essayLength;
    if (ratio < 0.1) return 'start';
    if (ratio < 0.3) return 'early';
    if (ratio < 0.7) return 'middle';
    if (ratio < 0.9) return 'late';
    return 'end';
  }

  /**
   * Preview which technique would be selected without generating suggestions
   *
   * Useful for debugging and for showing users what approach will be used.
   */
  previewTechniqueSelection(
    bundle: IssueContextBundle,
    essayType: string,
    fullEssay: string
  ): {
    technique: TechniqueCategory;
    reasoning: string;
    alternatives: TechniqueCategory[];
    element_detected: string;
  } {
    const passageIndex = fullEssay.indexOf(bundle.quote);
    const passagePosition = this.calculatePassagePosition(passageIndex, fullEssay.length);

    const elementAnalysis = essayElementDetector.detectElement(
      bundle.quote,
      essayType as any,
      { fullEssay, passagePosition }
    );

    // Use the correct DecisionContext interface
    const decision = techniqueDecisionTree.decide({
      essayType: essayType as any,
      essay: fullEssay,
      wordCount: fullEssay.split(/\s+/).length,
      existingStrengths: [],
      detectedIssues: [{
        type: bundle.diagnosis.symptom_type,
        severity: 'major',
        location: bundle.location,
        description: bundle.diagnosis.diagnosis,
      }],
    });

    return {
      technique: decision.primary.category as TechniqueCategory,
      reasoning: decision.reasoning.whyThisTechnique,
      alternatives: decision.alternatives.map(a => a.category) as TechniqueCategory[],
      element_detected: elementAnalysis.element,
    };
  }

  /**
   * Get statistics about technique routing
   */
  static getTechniqueInfo(technique: TechniqueCategory): {
    name: string;
    description: string;
    best_for: string[];
    sources_available: number;
  } | null {
    const bundle = TECHNIQUE_BUNDLES[technique];
    if (!bundle) return null;

    const sources = getSourcesForTechnique(technique);

    return {
      name: technique.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: bundle.description,
      best_for: bundle.whenToUse,
      sources_available: sources.length,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const techniqueSuggestionRouter = new TechniqueSuggestionRouter();

// Named exports for types
export type { TechniqueAwareBundle, RoutedSuggestionOutput };
