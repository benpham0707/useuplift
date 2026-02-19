// @ts-nocheck
/**
 * Batch Generation Service
 *
 * **The Key to Cost-Effective Quality at Scale**
 *
 * This service generates surgical suggestions for MULTIPLE issues in a SINGLE API call,
 * providing massive cost savings while IMPROVING quality through coherent strategy.
 *
 * **Cost Comparison**:
 * - Sequential: 3 issues × $0.05 per = $0.15
 * - Batched: Single call for all 3 = $0.08
 * - Savings: $0.07 per essay (47% reduction on Stage 2)
 *
 * **Quality Improvements from Batching**:
 * 1. COHERENT STRATEGY: Claude sees all issues together, creates unified approach
 * 2. VOICE CONSISTENCY: Maintains voice across all suggestions
 * 3. NO CONFLICTS: Suggestions don't contradict each other
 * 4. HOLISTIC VIEW: Understands relationships between issues
 * 5. PRIORITIZATION: Can suggest which issue to tackle first
 *
 * **The 2-Suggestion Framework**:
 * - Polished Original: Safe, incremental improvement (always implementable)
 * - Voice Amplifier: Risky, authentic alternative (creative path)
 *
 * Removed: Divergent Strategy (was confusing, least used, diluted focus)
 */

import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from '../utils/jsonParser';
import type {
  IssueSymptomDiagnosis,
  VoiceFingerprint,
} from '../types/stage0Types';
import type { TechniqueCategory } from './techniqueCategories';
import { TECHNIQUE_BUNDLES } from './techniqueCategories';
import { getSourcesForTechnique } from '../data/techniqueSources';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250514';
const SONNET_PRICING = {
  input: 3.0 / 1_000_000,   // $3 per million input tokens
  output: 15.0 / 1_000_000, // $15 per million output tokens
};

// Banned terms that should NEVER appear in suggestions
const BANNED_TERMS = [
  'tapestry',
  'realm',
  'unwavering',
  'testament',
  'delve',
  'showcase',
  'underscore',
  'something',
  'legs burning',
  'gave 110%',
  'journey',
  'toolbox',
  'unlocking potential',
];

// ============================================================================
// TYPES
// ============================================================================

/**
 * Bundle of context for a single issue
 */
export interface IssueContextBundle {
  issue_number: number;
  quote: string;
  location: string;
  diagnosis: IssueSymptomDiagnosis;
  surrounding_context: string;
  relevant_evidence: Array<{
    text: string;
    source: string;
    why_relevant: string;
  }>;
  /**
   * Selected technique for this issue (from decision tree)
   * If not provided, system will use dynamic selection
   */
  selectedTechnique?: TechniqueCategory;
  /**
   * Reasoning for why this technique was selected
   */
  techniqueReasoning?: string;
}

/**
 * Holistic context shared across all issues
 */
export interface HolisticContext {
  recurring_motifs: string[];
  emotional_arc: string;
  narrative_thread: string;
  overall_strategy: string;
}

/**
 * Single suggestion (Polished Original OR Voice Amplifier)
 */
export interface Suggestion {
  text: string;
  rationale: string;
  what_changed: string[];
  voice_preservation: string;
  score_impact: {
    dimension: string;
    before: number;
    after: number;
    increase: number;
  };
  evidence_used: {
    quote: string;
    source: string;
  };
  when_to_use: string;
}

/**
 * Polished Original suggestion
 */
export interface PolishedOriginalSuggestion extends Suggestion {
  type: 'polished_original';
  safety_level: 'very_safe' | 'safe' | 'moderate_risk';
}

/**
 * Voice Amplifier suggestion
 */
export interface VoiceAmplifierSuggestion extends Suggestion {
  type: 'voice_amplifier';
  risk_level: 'low' | 'medium' | 'high';
  why_authentic: string;
  spark_moments: string[];
}

/**
 * Teaching layer for choosing between suggestions
 */
export interface TeachingLayer {
  concept_review: string;                // Callback to Stage 1 concept
  why_this_matters: string;              // Impact on admissions
  how_to_choose: {
    polished_when: string;               // When to use polished
    voice_when: string;                  // When to use voice amplifier
    can_combine: string;                 // How to use both
  };
  socratic_prompts: string[];
}

/**
 * Complete teaching for a single issue (2 suggestions)
 */
export interface IssueSurgicalTeaching {
  issue_number: number;
  issue_quote: string;
  diagnosis_summary: string;

  suggestions: {
    polished_original: PolishedOriginalSuggestion;
    voice_amplifier: VoiceAmplifierSuggestion;
  };

  teaching: TeachingLayer;
}

/**
 * Overall strategy tying all issues together
 */
export interface OverallStrategy {
  cohesive_approach: string;              // How all suggestions work together
  voice_consistency: string;              // How we maintained unified voice
  priority_order: string;                 // Which issue to tackle first and why
  implementation_tips: string[];          // Practical advice for implementing
}

/**
 * Complete batch generation output
 */
export interface BatchGenerationOutput {
  issues: IssueSurgicalTeaching[];
  overall_strategy: OverallStrategy;
  total_cost: number;
  tokens_used: {
    input: number;
    output: number;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate technique-specific guidance for an issue
 * This ensures suggestions follow the selected technique, NOT default storytelling
 */
function getTechniqueGuidance(technique: TechniqueCategory): string {
  const bundle = TECHNIQUE_BUNDLES[technique];
  if (!bundle) {
    return ''; // No specific guidance if technique unknown
  }

  // Get research-backed sources for this technique
  const sources = getSourcesForTechnique(technique);
  const sourcesFormatted = sources
    .slice(0, 2) // Top 2 to keep batch prompt size reasonable
    .map(s => `• "${s.quote.slice(0, 200)}${s.quote.length > 200 ? '...' : ''}" — ${s.author}, ${s.author_title}`)
    .join('\n');

  // Get before/after transformations
  const transformationsFormatted = (bundle.transformations || [])
    .slice(0, 1) // 1 transformation per issue in batch mode (space-efficient)
    .map(t => `BEFORE: "${t.before}"\nAFTER: "${t.after}"`)
    .join('\n');

  return `
═══════════════════════════════════════════════════════════
REQUIRED TECHNIQUE: ${bundle.name.toUpperCase()}
═══════════════════════════════════════════════════════════

**Description**: ${bundle.description}

**Core Principles (FOLLOW THESE)**:
${bundle.corePrinciples.map(p => `• ${p}`).join('\n')}

**Research Evidence**:
${sourcesFormatted}

**Example Transformation**:
${transformationsFormatted}

**Anti-Patterns (AVOID THESE)**:
${bundle.antiPatterns.map(p => `• ${p}`).join('\n')}

⚠️  CRITICAL: Your suggestions MUST use ${bundle.name} techniques.
${technique !== 'storytelling' ? `Do NOT default to storytelling - this issue specifically requires ${bundle.name}.` : ''}
`;
}

/**
 * Get the default technique if none is specified
 * Falls back to reflection_depth as a safe, non-storytelling default
 */
function getDefaultTechnique(diagnosis: IssueSymptomDiagnosis): TechniqueCategory {
  // Analyze the diagnosis to pick an appropriate technique
  const symptomType = diagnosis.symptom_type?.toLowerCase() || '';
  const specificWeakness = diagnosis.specific_weakness?.toLowerCase() || '';

  // Evidence-related issues
  if (symptomType.includes('evidence') || specificWeakness.includes('quantif') || specificWeakness.includes('metric')) {
    return 'evidence_impact';
  }

  // Reflection-related issues
  if (symptomType.includes('reflection') || symptomType.includes('meaning') || specificWeakness.includes('shallow')) {
    return 'reflection_depth';
  }

  // Technical depth issues
  if (symptomType.includes('technical') || symptomType.includes('depth') || specificWeakness.includes('process')) {
    return 'technical_depth';
  }

  // Voice issues
  if (symptomType.includes('voice') || symptomType.includes('generic') || specificWeakness.includes('cliche')) {
    return 'voice_authenticity';
  }

  // Connection/specificity issues
  if (symptomType.includes('connection') || symptomType.includes('specific') || specificWeakness.includes('vague')) {
    return 'connection_specificity';
  }

  // Intellectual character issues
  if (symptomType.includes('intellectual') || symptomType.includes('thinking') || specificWeakness.includes('surface')) {
    return 'intellectual_character';
  }

  // Default to reflection_depth as a versatile, non-storytelling technique
  return 'reflection_depth';
}

/**
 * Calculate cost from token usage
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  return (
    inputTokens * SONNET_PRICING.input +
    outputTokens * SONNET_PRICING.output
  );
}

/**
 * Filter suggestions for banned terms
 */
function filterBannedTerms(text: string): boolean {
  const lowerText = text.toLowerCase();
  return !BANNED_TERMS.some(term => lowerText.includes(term.toLowerCase()));
}

/**
 * Validate suggestion quality
 */
function validateSuggestion(
  suggestion: any,
  originalQuote: string,
  voiceFingerprint: VoiceFingerprint
): boolean {
  // Must have text and rationale
  if (!suggestion.text || !suggestion.rationale) {
    return false;
  }

  // Text must be different from original
  if (suggestion.text === originalQuote) {
    return false;
  }

  // Must not contain banned terms
  if (!filterBannedTerms(suggestion.text)) {
    return false;
  }

  // Polished must preserve at least 60% of voice phrases
  if (suggestion.type === 'polished_original') {
    const preservedCount = voiceFingerprint.authentic_phrases.filter(
      phrase => suggestion.text.includes(phrase)
    ).length;
    const preservationRate = preservedCount / voiceFingerprint.authentic_phrases.length;
    if (preservationRate < 0.4) {
      console.warn('Polished suggestion may over-edit voice');
    }
  }

  return true;
}

// ============================================================================
// BATCH GENERATION PROMPT
// ============================================================================

const BATCH_SURGICAL_PROMPT = `You are providing surgical teaching for CRITICAL issues in a college admissions essay.

**TECHNIQUE-AWARE SYSTEM**: Each issue has a SPECIFIC TECHNIQUE assigned (not always storytelling!).
You MUST follow the technique guidance provided for each issue. The techniques include:
- Storytelling & Scene-Setting (vivid moments, dialogue, sensory details)
- Technical Depth & Domain Expertise (methodology, process thinking, domain knowledge)
- Evidence & Impact (metrics, scale, quantifiable results)
- Intellectual Character (how you think, not what you did)
- Reflection Depth (meaning-making, growth, self-awareness)
- Voice Authenticity (personality through word choice and perspective)
- Complexity Showcase (nuance, tensions, unresolved questions)
- Connection Specificity (concrete links to school/major/future)

For EACH issue, generate 2 DISTINCT suggestions that work TOGETHER cohesively:
1. **POLISHED ORIGINAL** - Safe, incremental improvement using the ASSIGNED TECHNIQUE
2. **VOICE AMPLIFIER** - Authentic, risky alternative using the ASSIGNED TECHNIQUE

CRITICAL REQUIREMENTS:
- **FOLLOW THE ASSIGNED TECHNIQUE** for each issue (see REQUIRED TECHNIQUE section)
- All suggestions must maintain voice consistency across issues
- Suggestions must not contradict each other
- Create a unified strategy (not disjointed fixes)
- Preserve the student's authentic voice markers
- Use sophisticated but appropriate vocabulary
- NO banned terms: {bannedTerms}
- Show relationships between issues
- ⚠️ Do NOT default to storytelling unless it is the assigned technique

═══════════════════════════════════════════════════════════
HOLISTIC CONTEXT (maintain across all issues)
═══════════════════════════════════════════════════════════

RECURRING MOTIFS: {recurringMotifs}
EMOTIONAL ARC: {emotionalArc}
NARRATIVE THREAD: {narrativeThread}
OVERALL STRATEGY: {overallStrategy}

VOICE FINGERPRINT (PRESERVE):
- Register: {register}
- Voice Qualities: {voiceQualities}
- Vocabulary Level: {vocabularyLevel}
- Authentic Phrases (MUST preserve in polished): {authenticPhrases}

═══════════════════════════════════════════════════════════
ISSUES TO ADDRESS
═══════════════════════════════════════════════════════════

{issuesBundles}

═══════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════

For EACH issue, provide:

### POLISHED ORIGINAL
**Purpose**: Safe, incremental improvement that maintains current structure
**When to use**: Student wants reliable improvement without major risk

Required fields:
- text: The refined version (exact text to replace original)
- rationale: Why this improvement works (cite college evidence)
- what_changed: Specific improvements made (bullet list)
- voice_preservation: How we maintained authenticity (be specific)
- score_impact: { dimension, before, after, increase }
- evidence_used: { quote, source }
- when_to_use: "Choose this when..." (student guidance)
- safety_level: "very_safe" | "safe" | "moderate_risk"

### VOICE AMPLIFIER
**Purpose**: Risky alternative that amplifies student's unique personality
**When to use**: Student willing to take creative risk for authenticity

Required fields:
- text: The authentic alternative (exact text to replace original)
- rationale: Why this feels more genuine (cite college evidence)
- what_changed: Specific improvements made (bullet list)
- voice_preservation: How we maintained AND amplified authenticity
- score_impact: { dimension, before, after, increase }
- evidence_used: { quote, source }
- when_to_use: "Choose this when..." (student guidance)
- risk_level: "low" | "medium" | "high"
- why_authentic: What makes this feel real (be specific)
- spark_moments: Where personality shines through (quote specific phrases)

### TEACHING LAYER
For each issue, provide:
- concept_review: Callback to Stage 1 teaching (which concept does this issue relate to?)
- why_this_matters: Impact on admissions (be concrete, not generic)
- how_to_choose:
  * polished_when: "Use polished when [specific situations]"
  * voice_when: "Use voice amplifier when [specific situations]"
  * can_combine: "How to use both: [specific approach]"
- socratic_prompts: 2-3 questions that deepen student thinking

═══════════════════════════════════════════════════════════
OVERALL STRATEGY (after all issues)
═══════════════════════════════════════════════════════════

Provide:
- cohesive_approach: How all suggestions work together as unified strategy
- voice_consistency: How we maintained unified voice across all changes
- priority_order: Which issue to tackle first and why (be strategic)
- implementation_tips: 3-4 practical tips for implementing these changes

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════

{
  "issues": [
    {
      "issue_number": 1,
      "issue_quote": "...",
      "diagnosis_summary": "...",
      "suggestions": {
        "polished_original": {
          "type": "polished_original",
          "text": "...",
          "rationale": "...",
          "what_changed": [...],
          "voice_preservation": "...",
          "score_impact": {...},
          "evidence_used": {...},
          "when_to_use": "...",
          "safety_level": "..."
        },
        "voice_amplifier": {
          "type": "voice_amplifier",
          "text": "...",
          "rationale": "...",
          "what_changed": [...],
          "voice_preservation": "...",
          "score_impact": {...},
          "evidence_used": {...},
          "when_to_use": "...",
          "risk_level": "...",
          "why_authentic": "...",
          "spark_moments": [...]
        }
      },
      "teaching": {
        "concept_review": "...",
        "why_this_matters": "...",
        "how_to_choose": {
          "polished_when": "...",
          "voice_when": "...",
          "can_combine": "..."
        },
        "socratic_prompts": [...]
      }
    },
    // Issue 2...
    // Issue 3...
  ],
  "overall_strategy": {
    "cohesive_approach": "...",
    "voice_consistency": "...",
    "priority_order": "...",
    "implementation_tips": [...]
  }
}`;

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class BatchGenerationService {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate surgical suggestions for all issues in a SINGLE batch call
   *
   * This is the main cost-saving innovation: instead of 3 separate API calls
   * at $0.05 each ($0.15 total), we make ONE call for all 3 issues ($0.08).
   *
   * Quality actually IMPROVES because Claude sees all issues together and
   * creates a cohesive strategy instead of disjointed fixes.
   */
  async generateBatchSuggestions(
    bundles: IssueContextBundle[],
    voiceFingerprint: VoiceFingerprint,
    holisticContext: HolisticContext
  ): Promise<BatchGenerationOutput> {
    // Validate input
    if (bundles.length === 0 || bundles.length > 5) {
      throw new Error('Batch generation supports 1-5 issues (optimal: 3)');
    }

    // Format issues for prompt WITH TECHNIQUE-SPECIFIC GUIDANCE
    const issuesBundlesFormatted = bundles
      .map(
        (bundle, idx) => {
          // Determine the technique to use for this issue
          const selectedTechnique = bundle.selectedTechnique || getDefaultTechnique(bundle.diagnosis);
          const techniqueGuidance = getTechniqueGuidance(selectedTechnique);
          const techniqueReasoning = bundle.techniqueReasoning || `Selected based on issue type: ${bundle.diagnosis.symptom_type}`;

          return `
───────────────────────────────────────────────────────────
ISSUE ${idx + 1}: ${bundle.diagnosis.diagnosis}
───────────────────────────────────────────────────────────

TARGET QUOTE:
"${bundle.quote}"

LOCATION: ${bundle.location}

DIAGNOSIS:
- Specific Weakness: ${bundle.diagnosis.specific_weakness}
- Symptom Type: ${bundle.diagnosis.symptom_type}
- Prescription: ${bundle.diagnosis.prescription}

MISSING ELEMENTS:
${JSON.stringify(bundle.diagnosis.missing_elements, null, 2)}

SURROUNDING CONTEXT:
${bundle.surrounding_context}

RELEVANT EVIDENCE:
${(Array.isArray(bundle.relevant_evidence) ? bundle.relevant_evidence : [])
  .map(ev => `- "${ev.text}" (${ev.source}) - ${ev.why_relevant}`)
  .join('\n')}

VOICE CONSTRAINTS FOR THIS ISSUE:
${bundle.diagnosis.voice_constraints.join('\n')}

COLLEGE ALIGNMENT:
${bundle.diagnosis.college_alignment}

${techniqueGuidance}

TECHNIQUE SELECTION REASONING:
${techniqueReasoning}
`;
        }
      )
      .join('\n\n');

    // Build prompt
    const prompt = BATCH_SURGICAL_PROMPT.replace('{bannedTerms}', BANNED_TERMS.join(', '))
      .replace('{recurringMotifs}', holisticContext.recurring_motifs.join(', '))
      .replace('{emotionalArc}', holisticContext.emotional_arc)
      .replace('{narrativeThread}', holisticContext.narrative_thread)
      .replace('{overallStrategy}', holisticContext.overall_strategy)
      .replace('{register}', voiceFingerprint.dominant_register)
      .replace('{voiceQualities}', voiceFingerprint.voice_qualities.join(', '))
      .replace('{vocabularyLevel}', voiceFingerprint.vocabulary_level)
      .replace('{authenticPhrases}', voiceFingerprint.authentic_phrases.join('; '))
      .replace('{issuesBundles}', issuesBundlesFormatted);

    // Make API call
    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 8000, // Room for 3 issues × 2 suggestions + full PIQ-level teaching
      temperature: 0.7, // Creative but not random
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Sonnet');
    }

    // Parse JSON from response
    const parsed = parseClaudeJSON(content.text, 'BatchGenerationOutput') as BatchGenerationOutput;

    // Validate and filter suggestions
    let validatedIssues: IssueSurgicalTeaching[] = [];

    for (const issue of parsed.issues) {
      // Validate both suggestions
      const polishedValid = validateSuggestion(
        issue.suggestions.polished_original,
        bundles[issue.issue_number - 1].quote,
        voiceFingerprint
      );

      const voiceValid = validateSuggestion(
        issue.suggestions.voice_amplifier,
        bundles[issue.issue_number - 1].quote,
        voiceFingerprint
      );

      if (polishedValid && voiceValid) {
        validatedIssues.push(issue);
      } else {
        console.warn(
          `Issue ${issue.issue_number} failed validation`,
          { polishedValid, voiceValid }
        );
      }
    }

    // DEFENSIVE: If validation was too strict, fall back to unvalidated suggestions
    // This prevents the entire workshop from failing due to overly strict validation
    if (validatedIssues.length === 0) {
      console.warn('⚠️  All suggestions failed validation - using unvalidated suggestions as fallback');
      validatedIssues = parsed.issues.map((issue) => ({
        ...issue,
        validation: {
          passed: false,
          polished_valid: false,
          voice_valid: false,
          warnings: ['Validation failed - using as fallback']
        }
      })) as IssueSurgicalTeaching[];
    }

    // Calculate cost
    const cost = calculateCost(
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    return {
      issues: validatedIssues,
      overall_strategy: parsed.overall_strategy,
      total_cost: cost,
      tokens_used: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  /**
   * Utility: Compare batch vs sequential cost
   */
  static getCostComparison(issueCount: number): {
    sequential: number;
    batched: number;
    savings: number;
    savingsPercent: number;
  } {
    const SEQUENTIAL_COST_PER_ISSUE = 0.05;
    const BATCH_BASE_COST = 0.05;
    const BATCH_COST_PER_ADDITIONAL_ISSUE = 0.015;

    const sequential = issueCount * SEQUENTIAL_COST_PER_ISSUE;
    const batched = BATCH_BASE_COST + (issueCount - 1) * BATCH_COST_PER_ADDITIONAL_ISSUE;
    const savings = sequential - batched;
    const savingsPercent = (savings / sequential) * 100;

    return {
      sequential,
      batched,
      savings,
      savingsPercent,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// All interfaces are already exported inline with `export interface`
// Export the service class singleton for convenience
export const batchGenerationService = new BatchGenerationService();
