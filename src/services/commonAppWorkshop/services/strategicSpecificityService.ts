/**
 * Strategic Specificity Service
 *
 * **Not all specifics are created equal.**
 *
 * This service determines:
 * 1. WHERE specificity has the highest impact in an essay
 * 2. WHAT KIND of specificity is needed (concrete moment vs. insight vs. research depth)
 * 3. HOW GOOD the student's context is (scoring before acceptance)
 * 4. WHETHER to ask for more or work with what we have
 *
 * **Core Principle**: Word count is precious. Every detail should earn its place.
 *
 * **Impact Zones** (from highest to lowest):
 * 1. ANCHOR MOMENT - The one vivid scene that makes the essay memorable
 * 2. UNIQUE INSIGHT - What YOU specifically learned/realized (not generic wisdom)
 * 3. PROOF OF DEPTH - Evidence you've gone beyond surface (for research-based essays)
 * 4. SUPPORTING DETAIL - Adds texture but isn't essential
 * 5. TRANSITIONAL - Just needs to flow, specifics would waste words
 *
 * **Context Quality Scoring**:
 * - Concreteness: Does it have who/what/when/where?
 * - Uniqueness: Is this specific to THIS student or could anyone say it?
 * - Usability: Can we actually weave this into the essay?
 * - Efficiency: Does it convey a lot in few words?
 */

import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';
import type { IssueContext } from './typeSpecificSuggestionService';

// ============================================================================
// IMPACT ZONE TYPES
// ============================================================================

/**
 * Impact zones ranked by importance
 * Higher impact = more ROI on specificity
 */
export type SpecificityImpactZone =
  | 'anchor_moment'      // THE vivid scene - highest impact
  | 'unique_insight'     // What YOU specifically learned
  | 'proof_of_depth'     // Evidence of real engagement
  | 'supporting_detail'  // Adds texture, not essential
  | 'transitional'       // Just needs to flow - specifics waste words
  | 'already_specific';  // No improvement needed

/**
 * What kind of specificity is needed
 */
export type SpecificityType =
  | 'concrete_scene'        // Who/what/when/where - visual
  | 'sensory_detail'        // What you saw/heard/felt
  | 'authentic_insight'     // What YOU learned (not generic)
  | 'research_evidence'     // Proof you've gone deep
  | 'person_detail'         // Memorable detail about someone
  | 'failure_or_struggle'   // What didn't work
  | 'none_needed';          // Specificity would waste words here

/**
 * Analysis of where specificity is needed
 */
export interface SpecificityNeed {
  location: {
    text: string;           // The text that needs improvement
    paragraph: number;
    sentence_start: number;
  };
  impact_zone: SpecificityImpactZone;
  specificity_type: SpecificityType;

  // Why this matters
  reasoning: {
    why_high_impact: string;
    what_it_would_achieve: string;
    word_budget: 'invest_heavily' | 'invest_moderately' | 'keep_lean';
  };

  // What to ask for
  question_focus: string;  // The key thing to extract
}

/**
 * Essay-level specificity analysis
 */
export interface SpecificityAnalysis {
  essay_type: SupplementalType;

  // High-impact opportunities (worth asking about)
  high_impact_needs: SpecificityNeed[];

  // Already good - don't touch
  already_specific: string[];

  // Low-impact - don't waste words here
  keep_lean: string[];

  // Overall assessment
  assessment: {
    has_anchor_moment: boolean;
    has_unique_insight: boolean;
    has_proof_of_depth: boolean;
    primary_gap: SpecificityType | 'none';
    words_to_invest: number;  // How many more words to use on specifics
  };
}

// ============================================================================
// CONTEXT QUALITY SCORING
// ============================================================================

/**
 * Quality dimensions for gathered context
 */
export interface ContextQualityScore {
  // Individual scores (1-5)
  concreteness: number;     // Has specific details (names, times, places)
  uniqueness: number;       // Specific to THIS student
  usability: number;        // Can be woven into essay
  efficiency: number;       // Conveys a lot in few words
  memorability: number;     // Would stick with a reader

  // Composite
  overall: number;          // Weighted average

  // Assessment
  quality_tier: 'excellent' | 'good' | 'usable' | 'weak' | 'unusable';

  // Feedback
  feedback: {
    strengths: string[];
    improvements_needed: string[];
    should_accept: boolean;
    follow_up_question?: string;
  };
}

/**
 * Minimum quality thresholds
 */
const QUALITY_THRESHOLDS = {
  anchor_moment: 4.0,      // Need excellent for the key moment
  unique_insight: 3.5,     // Need good for insights
  proof_of_depth: 3.0,     // Usable is fine for research evidence
  supporting_detail: 2.5,  // Lower bar for supporting details
};

// ============================================================================
// TYPE-SPECIFIC IMPACT MAPPING
// ============================================================================

/**
 * Which impact zones matter most for each essay type
 * This determines where we invest word count
 */
const TYPE_IMPACT_PRIORITIES: Record<SupplementalType, {
  must_have: SpecificityImpactZone[];
  nice_to_have: SpecificityImpactZone[];
  skip: SpecificityImpactZone[];
  primary_specificity_type: SpecificityType;
}> = {
  why_us: {
    must_have: ['proof_of_depth', 'unique_insight'],
    nice_to_have: ['supporting_detail'],
    skip: ['anchor_moment'],  // Why_us doesn't need vivid scenes
    primary_specificity_type: 'research_evidence'
  },
  why_major: {
    must_have: ['anchor_moment', 'unique_insight'],
    nice_to_have: ['proof_of_depth'],
    skip: ['transitional'],
    primary_specificity_type: 'authentic_insight'
  },
  community: {
    must_have: ['anchor_moment', 'supporting_detail'],
    nice_to_have: ['unique_insight'],
    skip: ['proof_of_depth'],  // Community essays need stories, not research
    primary_specificity_type: 'concrete_scene'
  },
  diversity: {
    must_have: ['anchor_moment', 'unique_insight'],
    nice_to_have: ['supporting_detail'],
    skip: ['proof_of_depth'],
    primary_specificity_type: 'concrete_scene'
  },
  intellectual: {
    must_have: ['unique_insight', 'proof_of_depth'],
    nice_to_have: ['anchor_moment'],
    skip: ['supporting_detail'],  // Intellectual essays should be lean
    primary_specificity_type: 'authentic_insight'
  },
  extracurricular: {
    must_have: ['anchor_moment', 'unique_insight'],
    nice_to_have: ['supporting_detail'],
    skip: ['proof_of_depth'],
    primary_specificity_type: 'concrete_scene'
  },
  challenge: {
    must_have: ['anchor_moment', 'unique_insight'],
    nice_to_have: ['supporting_detail'],
    skip: ['proof_of_depth'],
    primary_specificity_type: 'failure_or_struggle'
  },
  leadership: {
    must_have: ['anchor_moment', 'person_detail'],
    nice_to_have: ['unique_insight'],
    skip: ['proof_of_depth'],
    primary_specificity_type: 'concrete_scene'
  },
  creative: {
    must_have: ['anchor_moment', 'unique_insight'],
    nice_to_have: ['sensory_detail'],
    skip: ['proof_of_depth'],
    primary_specificity_type: 'sensory_detail'
  },
  values: {
    must_have: ['anchor_moment', 'unique_insight'],
    nice_to_have: ['supporting_detail'],
    skip: ['proof_of_depth'],
    primary_specificity_type: 'concrete_scene'
  },
  future_goals: {
    must_have: ['unique_insight', 'proof_of_depth'],
    nice_to_have: ['anchor_moment'],
    skip: ['supporting_detail'],  // Future goals should be concise
    primary_specificity_type: 'authentic_insight'
  },
  additional_info: {
    must_have: ['anchor_moment'],
    nice_to_have: ['unique_insight'],
    skip: ['proof_of_depth', 'supporting_detail'],  // Additional info must be efficient
    primary_specificity_type: 'concrete_scene'
  },
  short_answer: {
    must_have: [],  // Short answers need efficiency, not specificity
    nice_to_have: ['anchor_moment'],
    skip: ['proof_of_depth', 'supporting_detail', 'unique_insight'],
    primary_specificity_type: 'none_needed'
  },
  optional: {
    must_have: ['unique_insight'],
    nice_to_have: ['anchor_moment'],
    skip: ['supporting_detail'],  // Optional essays must justify their existence
    primary_specificity_type: 'authentic_insight'
  }
};

// ============================================================================
// SPECIFICITY INDICATORS (What signals need for specificity)
// ============================================================================

/**
 * Patterns that indicate specificity is NEEDED
 */
const NEEDS_SPECIFICITY_PATTERNS: {
  pattern: RegExp;
  impact_zone: SpecificityImpactZone;
  specificity_type: SpecificityType;
  reasoning: string;
}[] = [
  // ANCHOR MOMENT gaps
  {
    pattern: /when I (?:first|finally|suddenly|unexpectedly)/i,
    impact_zone: 'anchor_moment',
    specificity_type: 'concrete_scene',
    reasoning: 'Claims a pivotal moment - this should be THE vivid scene'
  },
  {
    pattern: /the moment (?:I|when|that)/i,
    impact_zone: 'anchor_moment',
    specificity_type: 'concrete_scene',
    reasoning: 'Explicitly references a moment - needs visual detail'
  },
  {
    pattern: /I remember (?:when|the|a)/i,
    impact_zone: 'anchor_moment',
    specificity_type: 'concrete_scene',
    reasoning: 'Starts a memory - perfect anchor moment opportunity'
  },

  // UNIQUE INSIGHT gaps
  {
    pattern: /I (?:realized|learned|understood|discovered) (?:that|how)/i,
    impact_zone: 'unique_insight',
    specificity_type: 'authentic_insight',
    reasoning: 'Claims an insight - must be unique to this student'
  },
  {
    pattern: /this (?:taught|showed|made) me/i,
    impact_zone: 'unique_insight',
    specificity_type: 'authentic_insight',
    reasoning: 'Claims learning - needs specific personal takeaway'
  },

  // PROOF OF DEPTH gaps (for research-based essays)
  {
    pattern: /(?:research|work|studies|focus(?:es|ing)?) (?:on|in)/i,
    impact_zone: 'proof_of_depth',
    specificity_type: 'research_evidence',
    reasoning: 'References research - needs evidence of real engagement'
  },
  {
    pattern: /(?:Professor|Dr\.)\s+[A-Z]/i,
    impact_zone: 'proof_of_depth',
    specificity_type: 'research_evidence',
    reasoning: 'Name-drops researcher - needs proof of actual understanding'
  },

  // FAILURE/STRUGGLE gaps (for challenge essays)
  {
    pattern: /(?:faced|overcame|dealt with)\s+(?:a|an|the)\s+(?:challenge|obstacle|difficulty|struggle)/i,
    impact_zone: 'anchor_moment',
    specificity_type: 'failure_or_struggle',
    reasoning: 'Claims facing challenge without describing the specific struggle'
  },
  {
    pattern: /it (?:was|felt)\s+(?:hard|difficult|challenging|tough)/i,
    impact_zone: 'anchor_moment',
    specificity_type: 'failure_or_struggle',
    reasoning: 'Claims difficulty without showing what made it hard'
  },
  {
    pattern: /(?:taught|showed)\s+me\s+(?:a lot|so much|that)/i,
    impact_zone: 'unique_insight',
    specificity_type: 'authentic_insight',
    reasoning: 'Claims learning without the specific takeaway'
  },
  {
    pattern: /(?:became|grew)\s+(?:stronger|better|more resilient)/i,
    impact_zone: 'unique_insight',
    specificity_type: 'authentic_insight',
    reasoning: 'Claims growth without evidence of what changed'
  },
  {
    pattern: /(?:pushed|forced)\s+me\s+(?:to|out of)/i,
    impact_zone: 'anchor_moment',
    specificity_type: 'failure_or_struggle',
    reasoning: 'Claims being pushed without the specific pressure moment'
  },
];

/**
 * Patterns that indicate specificity is NOT needed (keep lean)
 */
const KEEP_LEAN_PATTERNS: {
  pattern: RegExp;
  reasoning: string;
}[] = [
  {
    pattern: /in addition|furthermore|moreover|also/i,
    reasoning: 'Transitional phrase - just needs to flow'
  },
  {
    pattern: /I look forward to|I am excited to|I hope to/i,
    reasoning: 'Future-facing statement - specificity adds little value'
  },
  {
    pattern: /beyond (?:academics|the classroom|just)/i,
    reasoning: 'Transition to new topic - keep it brief'
  },
  {
    pattern: /not only .* but also/i,
    reasoning: 'Structural phrase - specificity is bloat here'
  },
];

/**
 * Patterns that indicate ALREADY SPECIFIC (don't touch)
 */
const ALREADY_SPECIFIC_PATTERNS: RegExp[] = [
  /\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)/,      // Time mentioned
  /\d+\s+(?:hours?|minutes?|days?|weeks?)/,    // Duration mentioned
  /(?:my|the)\s+\w+\s+(?:said|asked|told)/,    // Dialogue present
  /[A-Z][a-z]+(?:'s)?\s+(?:desk|office|lab|room|house|car)/, // Specific place
  /\$\d+|\d+%|\d+\s+(?:people|students|members)/, // Numbers present
];

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class StrategicSpecificityService {

  /**
   * Analyze an essay for strategic specificity opportunities
   *
   * Returns:
   * - Where specificity is HIGH IMPACT (worth gathering)
   * - Where it's ALREADY GOOD (don't touch)
   * - Where it's LOW IMPACT (keep lean)
   */
  analyzeSpecificityNeeds(
    essayDraft: string,
    essayType: SupplementalType,
    issues: IssueContext[]
  ): SpecificityAnalysis {
    const typeConfig = TYPE_IMPACT_PRIORITIES[essayType];
    const paragraphs = essayDraft.split(/\n\n+/);

    const highImpactNeeds: SpecificityNeed[] = [];
    const alreadySpecific: string[] = [];
    const keepLean: string[] = [];

    // Track what we've found
    let hasAnchorMoment = false;
    let hasUniqueInsight = false;
    let hasProofOfDepth = false;

    // Analyze each paragraph
    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const paragraph = paragraphs[pIdx];
      const sentences = paragraph.split(/(?<=[.!?])\s+/);

      for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
        const sentence = sentences[sIdx];

        // Check if already specific
        if (this.isAlreadySpecific(sentence)) {
          alreadySpecific.push(sentence.substring(0, 80));

          // Mark what we found
          if (NEEDS_SPECIFICITY_PATTERNS.some(p =>
            p.pattern.test(sentence) && p.impact_zone === 'anchor_moment'
          )) hasAnchorMoment = true;
          if (NEEDS_SPECIFICITY_PATTERNS.some(p =>
            p.pattern.test(sentence) && p.impact_zone === 'unique_insight'
          )) hasUniqueInsight = true;
          if (NEEDS_SPECIFICITY_PATTERNS.some(p =>
            p.pattern.test(sentence) && p.impact_zone === 'proof_of_depth'
          )) hasProofOfDepth = true;

          continue;
        }

        // Check if should keep lean
        const leanMatch = KEEP_LEAN_PATTERNS.find(p => p.pattern.test(sentence));
        if (leanMatch) {
          keepLean.push(sentence.substring(0, 80));
          continue;
        }

        // Check for specificity needs
        for (const pattern of NEEDS_SPECIFICITY_PATTERNS) {
          if (pattern.pattern.test(sentence)) {
            // Only add if this impact zone matters for this essay type
            if (typeConfig.skip.includes(pattern.impact_zone)) {
              keepLean.push(sentence.substring(0, 80));
              continue;
            }

            const isMustHave = typeConfig.must_have.includes(pattern.impact_zone);

            highImpactNeeds.push({
              location: {
                text: sentence,
                paragraph: pIdx + 1,
                sentence_start: sIdx
              },
              impact_zone: pattern.impact_zone,
              specificity_type: pattern.specificity_type,
              reasoning: {
                why_high_impact: pattern.reasoning,
                what_it_would_achieve: this.getAchievement(pattern.impact_zone, essayType),
                word_budget: isMustHave ? 'invest_heavily' : 'invest_moderately'
              },
              question_focus: this.getQuestionFocus(pattern.specificity_type)
            });
            break;  // One pattern match per sentence
          }
        }
      }
    }

    // Determine primary gap
    let primaryGap: SpecificityType | 'none' = 'none';
    if (!hasAnchorMoment && typeConfig.must_have.includes('anchor_moment')) {
      primaryGap = 'concrete_scene';
    } else if (!hasUniqueInsight && typeConfig.must_have.includes('unique_insight')) {
      primaryGap = 'authentic_insight';
    } else if (!hasProofOfDepth && typeConfig.must_have.includes('proof_of_depth')) {
      primaryGap = 'research_evidence';
    }

    // Calculate word budget for specifics
    const wordCount = essayDraft.split(/\s+/).length;
    const wordsToInvest = this.calculateWordBudget(
      highImpactNeeds.length,
      alreadySpecific.length,
      wordCount,
      essayType
    );

    return {
      essay_type: essayType,
      high_impact_needs: this.prioritizeNeeds(highImpactNeeds, typeConfig),
      already_specific: alreadySpecific,
      keep_lean: keepLean,
      assessment: {
        has_anchor_moment: hasAnchorMoment,
        has_unique_insight: hasUniqueInsight,
        has_proof_of_depth: hasProofOfDepth,
        primary_gap: primaryGap,
        words_to_invest: wordsToInvest
      }
    };
  }

  /**
   * Score the quality of context provided by a student
   *
   * Returns a score that determines:
   * - Whether to accept this context
   * - Whether to ask for more
   * - What specific improvement is needed
   */
  scoreContextQuality(
    studentResponse: string,
    requestedType: SpecificityType,
    impactZone: SpecificityImpactZone
  ): ContextQualityScore {
    const scores = {
      concreteness: this.scoreConcreteness(studentResponse),
      uniqueness: this.scoreUniqueness(studentResponse),
      usability: this.scoreUsability(studentResponse),
      efficiency: this.scoreEfficiency(studentResponse),
      memorability: this.scoreMemorability(studentResponse, requestedType)
    };

    // Weighted average based on what matters for this type
    const weights = this.getWeightsForType(requestedType);
    const overall = (
      scores.concreteness * weights.concreteness +
      scores.uniqueness * weights.uniqueness +
      scores.usability * weights.usability +
      scores.efficiency * weights.efficiency +
      scores.memorability * weights.memorability
    ) / (weights.concreteness + weights.uniqueness + weights.usability +
         weights.efficiency + weights.memorability);

    // Determine tier
    const qualityTier = this.getTier(overall);

    // Get threshold for this impact zone
    const threshold = QUALITY_THRESHOLDS[impactZone] || 3.0;
    const shouldAccept = overall >= threshold;

    // Generate feedback
    const feedback = this.generateFeedback(scores, requestedType, shouldAccept);

    return {
      ...scores,
      overall,
      quality_tier: qualityTier,
      feedback
    };
  }

  /**
   * Determine if we should ask for context at all
   * Some essays/issues don't need more specificity
   */
  shouldGatherContext(
    analysis: SpecificityAnalysis,
    currentWordCount: number,
    wordLimit: number
  ): {
    should_gather: boolean;
    reason: string;
    priority: 'high' | 'medium' | 'low' | 'none';
    max_questions: number;
  } {
    const wordsRemaining = wordLimit - currentWordCount;
    const mustHaveGaps = analysis.high_impact_needs.filter(n =>
      n.reasoning.word_budget === 'invest_heavily'
    );

    // Already have what we need
    if (analysis.assessment.primary_gap === 'none') {
      return {
        should_gather: false,
        reason: 'Essay already has sufficient specificity in key areas',
        priority: 'none',
        max_questions: 0
      };
    }

    // No room for more words
    if (wordsRemaining < 20) {
      return {
        should_gather: false,
        reason: 'Word count at limit - focus on improving existing content',
        priority: 'none',
        max_questions: 0
      };
    }

    // Short answer types - specificity often wastes words
    if (analysis.essay_type === 'short_answer') {
      return {
        should_gather: false,
        reason: 'Short answers prioritize efficiency over specificity',
        priority: 'none',
        max_questions: 0
      };
    }

    // High priority: Multiple must-have gaps
    if (mustHaveGaps.length >= 2) {
      return {
        should_gather: true,
        reason: `Missing ${mustHaveGaps.length} high-impact specificity opportunities`,
        priority: 'high',
        max_questions: Math.min(mustHaveGaps.length, 3)
      };
    }

    // Medium priority: One must-have gap
    if (mustHaveGaps.length === 1) {
      return {
        should_gather: true,
        reason: `Missing key ${analysis.assessment.primary_gap} - would significantly improve essay`,
        priority: 'medium',
        max_questions: 1
      };
    }

    // Low priority: Only nice-to-have gaps
    if (analysis.high_impact_needs.length > 0) {
      return {
        should_gather: wordsRemaining > 50,  // Only if we have room
        reason: 'Optional specificity could enhance essay',
        priority: 'low',
        max_questions: 1
      };
    }

    return {
      should_gather: false,
      reason: 'Current specificity level is sufficient',
      priority: 'none',
      max_questions: 0
    };
  }

  // ============================================================================
  // SCORING HELPERS
  // ============================================================================

  private scoreConcreteness(response: string): number {
    let score = 2;  // Base score

    // Boost for specific details
    if (/\d{1,2}(?::\d{2})?\s*(?:am|pm)/i.test(response)) score += 1;  // Time
    if (/\d+\s+(?:hours?|minutes?|days?|weeks?|years?)/i.test(response)) score += 0.5;  // Duration
    if (/[A-Z][a-z]+(?:'s)?\s+(?:desk|office|room|house|car|lab)/i.test(response)) score += 1;  // Place
    if (/(?:said|asked|told|whispered|yelled)[\s,]/i.test(response)) score += 1;  // Dialogue
    if (/\$\d+|\d+%/i.test(response)) score += 0.5;  // Numbers

    // Penalty for vagueness
    if (/(?:some|many|a lot|various|several)\s+(?:things?|people|times?)/i.test(response)) score -= 1;
    if (/it was (?:really|very|so|quite)/i.test(response)) score -= 0.5;

    return Math.max(1, Math.min(5, score));
  }

  private scoreUniqueness(response: string): number {
    let score = 3;  // Base score

    // Boost for personal details
    if (/my (?:grandmother|grandfather|mom|dad|sister|brother)/i.test(response)) score += 0.5;
    if (/I (?:always|never|used to|still)/i.test(response)) score += 0.5;

    // Penalty for generic phrases
    const genericPatterns = [
      /it was (?:amazing|incredible|transformative)/i,
      /I learned (?:a lot|so much|that)/i,
      /opened my eyes/i,
      /changed my perspective/i,
      /taught me that/i
    ];
    for (const pattern of genericPatterns) {
      if (pattern.test(response)) score -= 0.5;
    }

    return Math.max(1, Math.min(5, score));
  }

  private scoreUsability(response: string): number {
    const words = response.split(/\s+/).length;

    // Ideal length: 20-60 words
    if (words < 10) return 2;   // Too short
    if (words > 100) return 2;  // Too long to integrate
    if (words >= 20 && words <= 60) return 5;  // Perfect length
    return 3.5;  // Usable
  }

  private scoreEfficiency(response: string): number {
    const words = response.split(/\s+/).length;
    const concreteDetails = (response.match(/\d|\b[A-Z][a-z]+(?:'s)?\b/g) || []).length;

    // Ratio of concrete details to total words
    const ratio = concreteDetails / words;

    if (ratio > 0.15) return 5;  // Very efficient
    if (ratio > 0.10) return 4;
    if (ratio > 0.05) return 3;
    return 2;
  }

  private scoreMemorability(response: string, type: SpecificityType): number {
    let score = 3;

    // Type-specific memorable elements
    if (type === 'concrete_scene') {
      if (/(?:sound|smell|felt|saw|heard|tasted)/i.test(response)) score += 1;
      if (/(?:cold|warm|bright|dark|loud|quiet)/i.test(response)) score += 0.5;
    }

    if (type === 'authentic_insight') {
      if (/(?:I used to think|before I|now I)/i.test(response)) score += 1;
      if (/(?:but|however|actually|turns out)/i.test(response)) score += 0.5;
    }

    if (type === 'failure_or_struggle') {
      if (/(?:didn't work|failed|broke|wrong|mistake)/i.test(response)) score += 1;
      if (/(?:frustrated|confused|lost|stuck)/i.test(response)) score += 0.5;
    }

    // Universal memorable elements
    if (/['"]/i.test(response)) score += 0.5;  // Quoted speech
    if (/\d{1,2}(?::\d{2})?\s*(?:am|pm)/i.test(response)) score += 0.5;  // Specific time

    return Math.max(1, Math.min(5, score));
  }

  private getWeightsForType(type: SpecificityType): Record<string, number> {
    switch (type) {
      case 'concrete_scene':
        return { concreteness: 2, uniqueness: 1, usability: 1, efficiency: 1, memorability: 2 };
      case 'authentic_insight':
        return { concreteness: 1, uniqueness: 2, usability: 1, efficiency: 1.5, memorability: 1.5 };
      case 'research_evidence':
        return { concreteness: 2, uniqueness: 1.5, usability: 1.5, efficiency: 1, memorability: 1 };
      case 'failure_or_struggle':
        return { concreteness: 1.5, uniqueness: 1, usability: 1, efficiency: 1, memorability: 2 };
      default:
        return { concreteness: 1, uniqueness: 1, usability: 1, efficiency: 1, memorability: 1 };
    }
  }

  private getTier(score: number): ContextQualityScore['quality_tier'] {
    if (score >= 4.5) return 'excellent';
    if (score >= 3.5) return 'good';
    if (score >= 2.5) return 'usable';
    if (score >= 1.5) return 'weak';
    return 'unusable';
  }

  private generateFeedback(
    scores: Record<string, number>,
    type: SpecificityType,
    shouldAccept: boolean
  ): ContextQualityScore['feedback'] {
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Analyze each dimension
    if (scores.concreteness >= 4) strengths.push('Good concrete details');
    else if (scores.concreteness < 3) improvements.push('Add specific details (time, place, names)');

    if (scores.uniqueness >= 4) strengths.push('Clearly personal to you');
    else if (scores.uniqueness < 3) improvements.push('Make it more specific to YOUR experience');

    if (scores.usability >= 4) strengths.push('Easy to work with');
    else if (scores.usability < 3) improvements.push('Make it more concise or more complete');

    if (scores.memorability >= 4) strengths.push('Memorable and vivid');
    else if (scores.memorability < 3) improvements.push('Add sensory details or a striking image');

    // Follow-up question if not accepting
    let followUp: string | undefined;
    if (!shouldAccept) {
      if (scores.concreteness < 3) {
        followUp = 'Can you give me a specific moment? Where exactly were you, what time was it?';
      } else if (scores.uniqueness < 3) {
        followUp = 'What makes this YOUR specific experience, not something anyone could say?';
      } else if (scores.memorability < 3) {
        followUp = 'What would I see or hear if I was there? Any specific image that sticks with you?';
      }
    }

    return {
      strengths,
      improvements_needed: improvements,
      should_accept: shouldAccept,
      follow_up_question: followUp
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private isAlreadySpecific(sentence: string): boolean {
    return ALREADY_SPECIFIC_PATTERNS.some(p => p.test(sentence));
  }

  private getAchievement(zone: SpecificityImpactZone, type: SupplementalType): string {
    const achievements: Record<SpecificityImpactZone, string> = {
      anchor_moment: 'Creates a vivid scene readers remember',
      unique_insight: 'Shows what YOU specifically learned',
      proof_of_depth: 'Demonstrates real engagement beyond surface level',
      supporting_detail: 'Adds texture and authenticity',
      transitional: 'Improves flow',
      already_specific: 'N/A'
    };
    return achievements[zone];
  }

  private getQuestionFocus(type: SpecificityType): string {
    const focuses: Record<SpecificityType, string> = {
      concrete_scene: 'The specific moment - where, when, what you saw',
      sensory_detail: 'What you physically perceived - sights, sounds, feelings',
      authentic_insight: 'What YOU specifically learned that others might not',
      research_evidence: 'Specific details that show you\'ve gone deep',
      person_detail: 'One memorable thing about this person',
      failure_or_struggle: 'What specifically went wrong or didn\'t work',
      none_needed: 'N/A'
    };
    return focuses[type];
  }

  private prioritizeNeeds(
    needs: SpecificityNeed[],
    typeConfig: typeof TYPE_IMPACT_PRIORITIES[SupplementalType]
  ): SpecificityNeed[] {
    return needs.sort((a, b) => {
      // Must-have zones first
      const aIsMustHave = typeConfig.must_have.includes(a.impact_zone);
      const bIsMustHave = typeConfig.must_have.includes(b.impact_zone);

      if (aIsMustHave && !bIsMustHave) return -1;
      if (!aIsMustHave && bIsMustHave) return 1;

      // Then by impact zone priority
      const zoneOrder: SpecificityImpactZone[] = [
        'anchor_moment', 'unique_insight', 'proof_of_depth',
        'supporting_detail', 'transitional', 'already_specific'
      ];
      return zoneOrder.indexOf(a.impact_zone) - zoneOrder.indexOf(b.impact_zone);
    });
  }

  private calculateWordBudget(
    highImpactCount: number,
    alreadySpecificCount: number,
    currentWordCount: number,
    essayType: SupplementalType
  ): number {
    // Base budget based on essay type
    const typeConfig = TYPE_IMPACT_PRIORITIES[essayType];
    const baseBudget = typeConfig.must_have.length * 25;  // ~25 words per high-impact area

    // Adjust based on what's already there
    const adjustment = alreadySpecificCount * -15;  // Save words if already specific

    // Cap based on what's reasonable
    return Math.max(0, Math.min(baseBudget + adjustment, 100));
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const strategicSpecificityService = new StrategicSpecificityService();
