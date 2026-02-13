// @ts-nocheck
/**
 * College-Type Integration Service
 *
 * **The Bridge Between Universal Types and College-Specific Requirements**
 *
 * This service integrates:
 * 1. 14 Universal Essay Type Rubrics (from typeWeightMatrices.ts)
 * 2. College-Specific Overlays (from college data like stanford.ts)
 * 3. Issue Detection Patterns (from issueDetectionPatterns.ts)
 *
 * **What It Does**:
 * - Maps college values to relevant dimensions for each type
 * - Creates college-specific excellence requirements per type
 * - Generates type-aware citation recommendations
 * - Builds integrated rubric (type weights + college weights)
 *
 * **Key Innovation**:
 * A "Why Us" essay for Stanford weights differently than for MIT.
 * Stanford emphasizes "intellectual vitality" while MIT emphasizes "hands-on making."
 * This service creates that college-specific type configuration.
 *
 * **Example Usage**:
 * ```typescript
 * const config = service.getIntegratedConfig('why_us', stanfordResearch);
 * // Returns type rubric weighted by Stanford's values
 * ```
 */

import type { SupplementalDimension } from '../rubrics';
import {
  TYPE_WEIGHT_CONFIGS,
  getCriticalDimensions,
  getExcellenceRequirements,
  getTopDimensions,
  type TypeWeightConfig
} from '../rubrics/typeWeightMatrices';
import { DIMENSION_DEFINITIONS } from '../rubrics/universalSupplementalRubric';
import type { CollegeResearch, CollegeCoreValue, CollegeKeyQuote } from '../types/collegeResearch';
import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Mapping from college value to dimensions
 */
export interface ValueDimensionMapping {
  value_name: string;
  relevant_dimensions: SupplementalDimension[];
  weight_boost: number; // 0-10 additional weight for these dimensions
  demonstration_guidance: string;
  evidence_quote: string;
  citation_trigger: string; // When to cite this value
}

/**
 * College-specific excellence requirement
 */
export interface CollegeExcellenceRequirement {
  requirement: string;
  type_original: boolean; // Is this from the type rubric?
  college_specific: boolean; // Is this college-specific?
  aligned_value?: string; // Which college value this relates to
  demonstration_example: string;
}

/**
 * Integrated rubric for a specific type + college combination
 */
export interface IntegratedTypeRubric {
  // Type context
  essay_type: SupplementalType;
  type_name: string;
  word_range: { min: number; max: number };

  // College context
  college_name: string;
  college_personality: string; // Brief description of what this college values

  // Integrated weights (type weights adjusted by college values)
  integrated_weights: Record<SupplementalDimension, {
    base_weight: number; // From type rubric
    college_boost: number; // Added by college overlay
    final_weight: number; // base + boost (normalized)
    explanation: string; // Why this weight
  }>;

  // Critical dimensions (union of type critical + college emphasis)
  critical_dimensions: SupplementalDimension[];

  // Excellence requirements (merged from type + college)
  excellence_requirements: CollegeExcellenceRequirement[];

  // Value-dimension mappings
  value_mappings: ValueDimensionMapping[];

  // Citation recommendations
  citation_guide: {
    dimension: SupplementalDimension;
    when_to_cite: string;
    recommended_quote: CollegeKeyQuote | null;
    citation_phrase: string;
  }[];

  // Type-specific red flags for this college
  red_flags: string[];

  // Type-specific green flags for this college
  green_flags: string[];
}

/**
 * Citation recommendation based on essay content
 */
export interface CitationRecommendation {
  trigger_phrase: string; // Phrase in essay that triggers citation
  dimension: SupplementalDimension;
  suggested_quote: CollegeKeyQuote;
  integration_guidance: string;
  natural_placement: string; // Where to place in essay
}

// ============================================================================
// VALUE-TO-DIMENSION MAPPINGS
// ============================================================================

/**
 * Maps common college value names to relevant dimensions
 */
const VALUE_DIMENSION_MAP: Record<string, SupplementalDimension[]> = {
  // Intellectual values
  'intellectual vitality': ['reflection_insight', 'research_depth', 'specificity_evidence'],
  'intellectual curiosity': ['reflection_insight', 'research_depth', 'authenticity_voice'],
  'academic excellence': ['specificity_evidence', 'research_depth', 'reflection_insight'],
  'innovation': ['authenticity_voice', 'impact_memorability', 'personal_connection'],
  'creativity': ['authenticity_voice', 'impact_memorability', 'personal_connection'],
  'critical thinking': ['reflection_insight', 'narrative_clarity', 'specificity_evidence'],

  // Community values
  'community': ['fit_demonstration', 'personal_connection', 'strategic_coherence'],
  'collaboration': ['fit_demonstration', 'personal_connection', 'growth_transformation'],
  'diversity': ['authenticity_voice', 'personal_connection', 'vulnerability_balance'],
  'inclusion': ['authenticity_voice', 'personal_connection', 'vulnerability_balance'],
  'service': ['personal_connection', 'growth_transformation', 'impact_memorability'],
  'citizenship': ['fit_demonstration', 'personal_connection', 'reflection_insight'],

  // Character values
  'resilience': ['growth_transformation', 'vulnerability_balance', 'narrative_clarity'],
  'integrity': ['authenticity_voice', 'vulnerability_balance', 'reflection_insight'],
  'leadership': ['specificity_evidence', 'growth_transformation', 'impact_memorability'],
  'humility': ['vulnerability_balance', 'authenticity_voice', 'reflection_insight'],
  'curiosity': ['reflection_insight', 'research_depth', 'authenticity_voice'],
  'passion': ['authenticity_voice', 'personal_connection', 'impact_memorability'],

  // Achievement values
  'impact': ['specificity_evidence', 'impact_memorability', 'growth_transformation'],
  'entrepreneurship': ['specificity_evidence', 'authenticity_voice', 'impact_memorability'],
  'research': ['research_depth', 'specificity_evidence', 'reflection_insight'],
  'hands-on': ['specificity_evidence', 'personal_connection', 'authenticity_voice'],
  'practical': ['specificity_evidence', 'fit_demonstration', 'strategic_coherence'],
};

/**
 * Get dimensions relevant to a college value
 */
function getValueDimensions(valueName: string): SupplementalDimension[] {
  const normalized = valueName.toLowerCase();

  // Exact match
  if (VALUE_DIMENSION_MAP[normalized]) {
    return VALUE_DIMENSION_MAP[normalized];
  }

  // Partial match
  for (const [key, dimensions] of Object.entries(VALUE_DIMENSION_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return dimensions;
    }
  }

  // Default to general dimensions
  return ['authenticity_voice', 'personal_connection', 'reflection_insight'];
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class CollegeTypeIntegrationService {
  /**
   * Get integrated rubric for a type + college combination
   *
   * This is the main function that creates a college-specific type rubric.
   */
  getIntegratedRubric(
    essayType: SupplementalType,
    college: CollegeResearch
  ): IntegratedTypeRubric {
    const typeConfig = TYPE_WEIGHT_CONFIGS[essayType];

    // Step 1: Map college values to dimensions
    const valueMappings = this.mapCollegeValues(college);

    // Step 2: Calculate integrated weights
    const integratedWeights = this.calculateIntegratedWeights(
      typeConfig,
      valueMappings
    );

    // Step 3: Merge critical dimensions
    const criticalDimensions = this.mergeCriticalDimensions(
      essayType,
      valueMappings
    );

    // Step 4: Merge excellence requirements
    const excellenceRequirements = this.mergeExcellenceRequirements(
      essayType,
      college,
      valueMappings
    );

    // Step 5: Build citation guide
    const citationGuide = this.buildCitationGuide(
      essayType,
      college,
      valueMappings
    );

    // Step 6: Generate type-specific flags
    const { redFlags, greenFlags } = this.generateTypeFlags(
      essayType,
      college
    );

    return {
      essay_type: essayType,
      type_name: typeConfig.name,
      word_range: typeConfig.word_range,

      college_name: college.collegeName,
      college_personality: this.summarizeCollegePersonality(college),

      integrated_weights: integratedWeights,
      critical_dimensions: criticalDimensions,
      excellence_requirements: excellenceRequirements,
      value_mappings: valueMappings,
      citation_guide: citationGuide,
      red_flags: redFlags,
      green_flags: greenFlags
    };
  }

  /**
   * Map college values to dimensions
   */
  private mapCollegeValues(college: CollegeResearch): ValueDimensionMapping[] {
    const values = college.coreValues || [];

    return values.map((value: CollegeCoreValue) => {
      const relevantDimensions = getValueDimensions(value.valueName);

      return {
        value_name: value.valueName,
        relevant_dimensions: relevantDimensions,
        weight_boost: value.weight >= 30 ? 5 : value.weight >= 15 ? 3 : 1, // Use weight instead of priority
        demonstration_guidance: value.essayImplication,
        evidence_quote: value.evidence?.[0]?.quote || '',
        citation_trigger: `When discussing ${value.valueName.toLowerCase()}`
      };
    });
  }

  /**
   * Calculate integrated weights (type weights + college boosts)
   */
  private calculateIntegratedWeights(
    typeConfig: TypeWeightConfig,
    valueMappings: ValueDimensionMapping[]
  ): IntegratedTypeRubric['integrated_weights'] {
    const baseWeights = typeConfig.weights;
    const boosts: Record<SupplementalDimension, number> = {} as Record<SupplementalDimension, number>;

    // Initialize boosts to 0
    for (const dim of Object.keys(baseWeights) as SupplementalDimension[]) {
      boosts[dim] = 0;
    }

    // Add boosts from college values
    for (const mapping of valueMappings) {
      for (const dim of mapping.relevant_dimensions) {
        boosts[dim] = (boosts[dim] || 0) + mapping.weight_boost;
      }
    }

    // Calculate total boost to normalize
    const totalBoost = Object.values(boosts).reduce((a, b) => a + b, 0);
    const boostScale = totalBoost > 0 ? 20 / totalBoost : 0; // Max 20% boost total

    // Build integrated weights
    const result: IntegratedTypeRubric['integrated_weights'] = {} as IntegratedTypeRubric['integrated_weights'];

    for (const [dim, baseWeight] of Object.entries(baseWeights)) {
      const dimension = dim as SupplementalDimension;
      const scaledBoost = Math.round(boosts[dimension] * boostScale);
      const finalWeight = baseWeight + scaledBoost;

      // Find which values contribute to this dimension
      const contributingValues = valueMappings
        .filter(m => m.relevant_dimensions.includes(dimension))
        .map(m => m.value_name);

      result[dimension] = {
        base_weight: baseWeight,
        college_boost: scaledBoost,
        final_weight: finalWeight,
        explanation: scaledBoost > 0
          ? `Base ${baseWeight}% + ${scaledBoost}% boost from ${contributingValues.join(', ')}`
          : `Base ${baseWeight}% (no college boost for this dimension)`
      };
    }

    // Normalize so weights sum to 100
    const totalWeight = Object.values(result).reduce((sum, w) => sum + w.final_weight, 0);
    if (totalWeight !== 100) {
      const scale = 100 / totalWeight;
      for (const dim of Object.keys(result) as SupplementalDimension[]) {
        result[dim].final_weight = Math.round(result[dim].final_weight * scale);
      }
    }

    return result;
  }

  /**
   * Merge critical dimensions from type and college values
   */
  private mergeCriticalDimensions(
    essayType: SupplementalType,
    valueMappings: ValueDimensionMapping[]
  ): SupplementalDimension[] {
    const typeCritical = getCriticalDimensions(essayType);

    // Get dimensions with high college boost
    const collegeCritical = valueMappings
      .filter(m => m.weight_boost >= 5)
      .flatMap(m => m.relevant_dimensions)
      .filter((dim, idx, arr) => arr.indexOf(dim) === idx); // Unique

    // Merge, prioritizing type critical
    const merged = [...typeCritical];
    for (const dim of collegeCritical) {
      if (!merged.includes(dim)) {
        merged.push(dim);
      }
    }

    return merged.slice(0, 5); // Max 5 critical dimensions
  }

  /**
   * Merge excellence requirements from type and college
   */
  private mergeExcellenceRequirements(
    essayType: SupplementalType,
    college: CollegeResearch,
    valueMappings: ValueDimensionMapping[]
  ): CollegeExcellenceRequirement[] {
    const typeRequirements = getExcellenceRequirements(essayType);
    const requirements: CollegeExcellenceRequirement[] = [];

    // Add type-specific requirements
    for (const req of typeRequirements) {
      requirements.push({
        requirement: req,
        type_original: true,
        college_specific: false,
        demonstration_example: `Example: ${req.substring(0, 50)}...`
      });
    }

    // Add college-specific requirements based on values
    for (const mapping of valueMappings.slice(0, 3)) { // Top 3 values
      const collegeReq = this.generateCollegeRequirement(essayType, mapping, college);
      if (collegeReq) {
        requirements.push({
          requirement: collegeReq.requirement,
          type_original: false,
          college_specific: true,
          aligned_value: mapping.value_name,
          demonstration_example: collegeReq.example
        });
      }
    }

    return requirements;
  }

  /**
   * Generate a college-specific requirement based on value and type
   */
  private generateCollegeRequirement(
    essayType: SupplementalType,
    mapping: ValueDimensionMapping,
    college: CollegeResearch
  ): { requirement: string; example: string } | null {
    const templates: Record<SupplementalType, (value: string, college: string) => { requirement: string; example: string }> = {
      why_us: (v, c) => ({
        requirement: `Demonstrates ${c}'s "${v}" through specific program/resource connection`,
        example: `Connect your interests to a specific ${c} resource that embodies ${v}`
      }),
      why_major: (v, c) => ({
        requirement: `Shows how your intellectual interests align with ${c}'s approach to ${v}`,
        example: `Explain how your passion connects to ${c}'s emphasis on ${v}`
      }),
      community: (v, c) => ({
        requirement: `Shows how you'll contribute to ${c}'s culture of ${v}`,
        example: `Describe specific ways you'll engage with ${c}'s ${v}-focused community`
      }),
      diversity: (v, c) => ({
        requirement: `Demonstrates how your perspective enriches ${c}'s commitment to ${v}`,
        example: `Show how your background adds to ${c}'s ${v} environment`
      }),
      intellectual: (v, c) => ({
        requirement: `Shows ${c}-style ${v} in your intellectual exploration`,
        example: `Demonstrate the type of ${v} that ${c} students embody`
      }),
      extracurricular: (v, c) => ({
        requirement: `Connects your activity to ${c}'s value of ${v}`,
        example: `Show how your activity demonstrates ${v} in ways ${c} values`
      }),
      challenge: (v, c) => ({
        requirement: `Shows resilience aligned with ${c}'s expectation of ${v}`,
        example: `Demonstrate growth through challenge in a ${v}-aligned way`
      }),
      leadership: (v, c) => ({
        requirement: `Demonstrates ${c}-style ${v} in leadership`,
        example: `Show leadership that embodies ${c}'s ${v} culture`
      }),
      creative: (v, c) => ({
        requirement: `Shows creativity aligned with ${c}'s ${v} ethos`,
        example: `Connect your creative work to ${c}'s emphasis on ${v}`
      }),
      values: (v, c) => ({
        requirement: `Your values align with ${c}'s emphasis on ${v}`,
        example: `Show shared values with ${c}'s ${v} culture`
      }),
      future_goals: (v, c) => ({
        requirement: `Future goals connect to ${c}'s ${v}-focused mission`,
        example: `Link your aspirations to ${c}'s commitment to ${v}`
      }),
      additional_info: (v, c) => ({
        requirement: `Additional context demonstrates ${v} valued by ${c}`,
        example: `Frame context in terms of ${v}`
      }),
      short_answer: (v, c) => ({
        requirement: `Brief response captures ${c}'s ${v} essence`,
        example: `Pack ${v} into concise answer`
      }),
      optional: (v, c) => ({
        requirement: `Optional essay adds ${c}-relevant ${v} dimension`,
        example: `Show ${v} not covered elsewhere`
      })
    };

    const template = templates[essayType];
    if (!template) return null;

    return template(mapping.value_name, college.collegeName);
  }

  /**
   * Build citation guide for type + college
   */
  private buildCitationGuide(
    essayType: SupplementalType,
    college: CollegeResearch,
    valueMappings: ValueDimensionMapping[]
  ): IntegratedTypeRubric['citation_guide'] {
    const topDimensions = getTopDimensions(essayType, 5);
    const quotes = college.keyQuotes || [];
    const guide: IntegratedTypeRubric['citation_guide'] = [];

    for (const dim of topDimensions) {
      // Find a value mapping for this dimension
      const relevantMapping = valueMappings.find(m =>
        m.relevant_dimensions.includes(dim)
      );

      // Find a quote that relates to this value
      let recommendedQuote: CollegeKeyQuote | null = null;
      if (relevantMapping) {
        recommendedQuote = quotes.find((q: CollegeKeyQuote) =>
          q.useCases?.some(uc => uc.dimension?.toLowerCase().includes(relevantMapping.value_name.toLowerCase()))
        ) || null;
      }

      const def = DIMENSION_DEFINITIONS[dim];

      guide.push({
        dimension: dim,
        when_to_cite: relevantMapping?.citation_trigger || `When demonstrating ${def.name.toLowerCase()}`,
        recommended_quote: recommendedQuote,
        citation_phrase: recommendedQuote
          ? `As ${college.collegeName} emphasizes, "${recommendedQuote.quote.substring(0, 50)}..."`
          : `${college.collegeName}'s commitment to ${def.name.toLowerCase()}`
      });
    }

    return guide;
  }

  /**
   * Generate type-specific red/green flags for this college
   */
  private generateTypeFlags(
    essayType: SupplementalType,
    college: CollegeResearch
  ): { redFlags: string[]; greenFlags: string[] } {
    const redFlags: string[] = [];
    const greenFlags: string[] = [];

    // Type-specific red flags
    const typeRedFlags: Record<SupplementalType, string[]> = {
      why_us: [
        `Could swap ${college.collegeName} for any other college`,
        'Only mentions rankings or prestige',
        'Lists generic resources without personal connection'
      ],
      why_major: [
        'Only mentions career outcomes, not intellectual curiosity',
        'Generic "I\'ve always loved" opening'
      ],
      community: [
        'Plans to "take" from community without "giving"',
        'Generic volunteer claims'
      ],
      diversity: [
        'Victim narrative without agency',
        'Identity as only defining feature'
      ],
      intellectual: [
        'Surface-level curiosity (Wikipedia depth)',
        'Name-dropping without understanding'
      ],
      extracurricular: [
        'Resume recitation',
        'Numbers without meaning'
      ],
      challenge: [
        'Problem is 80% of essay, growth is 20%',
        'Instant transformation without struggle'
      ],
      leadership: [
        'Titles without actions',
        'No mention of failures or learning'
      ],
      creative: [
        'Describes product, not process',
        'No emotional connection to work'
      ],
      values: [
        'States values without demonstrating them',
        'Preachy or moralistic tone'
      ],
      future_goals: [
        'Vague "make a difference" goals',
        'No connection to past experiences'
      ],
      additional_info: [
        'Makes excuses instead of providing context',
        'Repeats information from elsewhere'
      ],
      short_answer: [
        'Wastes words on filler',
        'Generic response'
      ],
      optional: [
        'Doesn\'t add new information',
        'Low quality compared to required essays'
      ]
    };

    // Type-specific green flags
    const typeGreenFlags: Record<SupplementalType, string[]> = {
      why_us: [
        `Names specific ${college.collegeName} resources by name`,
        'Shows mutual fit (what you give AND receive)'
      ],
      why_major: [
        'Shows self-directed exploration',
        'Asks meaningful questions about the field'
      ],
      community: [
        'Specific past evidence predicts future involvement',
        'Demonstrates community awareness'
      ],
      diversity: [
        'Identity → perspective → contribution arc',
        'Shows agency and resilience'
      ],
      intellectual: [
        'Shows progression of thinking over time',
        'Connects ideas across domains'
      ],
      extracurricular: [
        'Deep dive into ONE activity',
        'Shows impact on others, not just self'
      ],
      challenge: [
        '20% problem, 80% response',
        'Multiple attempts before success'
      ],
      leadership: [
        'Collaborative leadership style',
        'Learns from failures'
      ],
      creative: [
        'Reveals creative process, not just product',
        'Connects creativity to identity'
      ],
      values: [
        'Shows values through actions/stories',
        'Demonstrates nuance and self-awareness'
      ],
      future_goals: [
        'Specific, achievable goals',
        'Clear past → future connection'
      ],
      additional_info: [
        'Adds genuinely new information',
        'Provides context without excuses'
      ],
      short_answer: [
        'Every word earns its place',
        'Shows personality in limited space'
      ],
      optional: [
        'Fills clear gap in application',
        'High quality that adds value'
      ]
    };

    redFlags.push(...(typeRedFlags[essayType] || []));
    greenFlags.push(...(typeGreenFlags[essayType] || []));

    // Add college-specific flags based on values
    const topValue = college.coreValues?.[0];
    if (topValue) {
      redFlags.push(`Fails to demonstrate ${college.collegeName}'s emphasis on ${topValue.valueName}`);
      greenFlags.push(`Strong demonstration of ${topValue.valueName}`);
    }

    return { redFlags, greenFlags };
  }

  /**
   * Summarize college personality
   */
  private summarizeCollegePersonality(college: CollegeResearch): string {
    const values = college.coreValues?.slice(0, 3).map((v: CollegeCoreValue) => v.valueName) || [];

    if (values.length === 0) {
      return college.collegeName;
    }

    return `${college.collegeName} values ${values.join(', ')}`;
  }

  /**
   * Get citation recommendations based on essay content
   */
  getCitationRecommendations(
    essayDraft: string,
    integratedRubric: IntegratedTypeRubric
  ): CitationRecommendation[] {
    const recommendations: CitationRecommendation[] = [];

    for (const mapping of integratedRubric.value_mappings) {
      // Check if essay mentions or relates to this value
      const trigger = mapping.citation_trigger.toLowerCase();
      const essayLower = essayDraft.toLowerCase();

      // Look for trigger phrases
      const valueName = mapping.value_name.toLowerCase();
      if (essayLower.includes(valueName) || essayLower.includes(trigger)) {
        // Find corresponding quote from citation guide
        const guideEntry = integratedRubric.citation_guide.find(g =>
          mapping.relevant_dimensions.includes(g.dimension)
        );

        if (guideEntry?.recommended_quote) {
          recommendations.push({
            trigger_phrase: mapping.citation_trigger,
            dimension: mapping.relevant_dimensions[0],
            suggested_quote: guideEntry.recommended_quote,
            integration_guidance: `When discussing ${mapping.value_name}, cite ${integratedRubric.college_name}'s perspective`,
            natural_placement: `After mentioning concepts related to ${mapping.value_name}`
          });
        }
      }
    }

    return recommendations;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ValueDimensionMapping,
  CollegeExcellenceRequirement,
  IntegratedTypeRubric,
  CitationRecommendation
};
