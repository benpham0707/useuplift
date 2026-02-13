// @ts-nocheck
/**
 * Semantic Context Analyzer
 *
 * **AI-powered context gap detection that understands MEANING, not patterns.**
 *
 * Why this exists:
 * - Regex patterns miss many variations of the same problem
 * - "I overcame a challenge" and "difficulties arose which I navigated" mean the same thing
 * - Only an LLM can understand that both lack concrete details
 *
 * Design principles:
 * 1. Use Haiku for speed and cost (≈$0.001 per analysis)
 * 2. Structured output for reliability
 * 3. Type-aware analysis (what matters for THIS essay type)
 * 4. Quality scoring that understands semantic richness
 *
 * This replaces hardcoded regex patterns with semantic understanding.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';
import type { IssueContext } from './typeSpecificSuggestionService';

// ============================================================================
// TYPES
// ============================================================================

/**
 * What kind of context is missing (semantic categories)
 */
export type SemanticGapType =
  | 'missing_concrete_scene'      // No vivid moment with who/what/when/where
  | 'missing_sensory_detail'      // No sights/sounds/feelings
  | 'missing_specific_insight'    // Generic wisdom instead of personal realization
  | 'missing_struggle_detail'     // Claims difficulty without showing it
  | 'missing_research_evidence'   // Surface-level research mention
  | 'missing_person_detail'       // Generic role without memorable traits
  | 'missing_personal_stake'      // Why THEY care isn't clear
  | 'performative_authenticity';  // Signals passion without demonstrating it

/**
 * A detected context gap with semantic understanding
 */
export interface SemanticContextGap {
  gap_type: SemanticGapType;
  quote: string;                   // The problematic text
  diagnosis: string;               // What's wrong (in plain English)
  what_would_fix_it: string;       // What we need from the student
  impact: 'critical' | 'high' | 'medium' | 'low';
  question_to_ask: string;         // The gathering question
}

/**
 * Quality assessment of student-provided context
 */
export interface SemanticQualityScore {
  overall: number;                 // 1-5 scale
  dimensions: {
    concreteness: number;          // Has specific details?
    uniqueness: number;            // Specific to THIS student?
    vividness: number;             // Creates a mental image?
    usability: number;             // Can we weave this in?
  };
  assessment: string;              // Plain English assessment
  is_acceptable: boolean;          // Good enough to use?
  follow_up_needed?: string;       // If not acceptable, what to ask
}

/**
 * Complete analysis result
 */
export interface SemanticAnalysisResult {
  should_gather_context: boolean;
  priority: 'high' | 'medium' | 'low' | 'none';
  reason: string;
  gaps: SemanticContextGap[];
  questions_to_ask: string[];      // Prioritized questions
  cost: number;
}

// ============================================================================
// TYPE-SPECIFIC GUIDANCE
// ============================================================================

/**
 * What matters most for each essay type
 * This guides the AI's analysis priorities
 */
const TYPE_PRIORITIES: Record<SupplementalType, {
  critical_elements: string[];
  less_important: string[];
  example_good: string;
  example_bad: string;
}> = {
  why_us: {
    critical_elements: [
      'Specific research/program details that show real investigation',
      'Evidence of understanding what makes this school unique',
      'Connection between your interests and specific offerings'
    ],
    less_important: ['Vivid personal scenes', 'Emotional reactions'],
    example_good: 'Professor Chen\'s lab uses contrastive learning on unlabeled medical images, achieving 94% accuracy with just 50 labeled examples—the efficiency that drew me to her work.',
    example_bad: 'Professor Chen\'s research on AI is really interesting and innovative.'
  },
  why_major: {
    critical_elements: [
      'Specific moment that sparked interest',
      'Evidence of genuine engagement (projects, reading, experimentation)',
      'Understanding of what the field actually involves'
    ],
    less_important: ['Research professor names', 'Future career plans'],
    example_good: 'At 2am debugging my classifier, I realized the 96% accuracy meant nothing—it still couldn\'t tell my grandmother\'s walker from a chair.',
    example_bad: 'I\'ve always been passionate about computer science and want to make a difference.'
  },
  challenge: {
    critical_elements: [
      'The specific struggle (what made it hard, what failed)',
      'Concrete moment of difficulty',
      'What specifically changed in you (not generic "I grew stronger")'
    ],
    less_important: ['Resolution details', 'External validation'],
    example_good: 'I spent three hours staring at the same paragraph, deleting and rewriting. My hands shook when I finally sent the email.',
    example_bad: 'I faced many challenges but overcame them through perseverance.'
  },
  community: {
    critical_elements: [
      'Specific scene showing your role in the community',
      'Details about actual people (not generic "members")',
      'Concrete impact or contribution'
    ],
    less_important: ['Statistics', 'Awards received'],
    example_good: 'Every Thursday, Maria saves me the corner seat. She says my jokes are terrible, but she laughs anyway.',
    example_bad: 'I am an active member of my community and help many people.'
  },
  diversity: {
    critical_elements: [
      'Specific experience that illustrates your perspective',
      'How your background shapes how you see things',
      'Concrete example of bringing this perspective somewhere'
    ],
    less_important: ['Demographics', 'Statistics about your group'],
    example_good: 'When my classmates debated immigration policy, I thought about my uncle hiding in a truck bed for three days.',
    example_bad: 'As a first-generation student, I bring a unique perspective to discussions.'
  },
  intellectual: {
    critical_elements: [
      'The specific question or problem that fascinates you',
      'Your unique angle or approach',
      'Evidence of actual exploration (not just interest)'
    ],
    less_important: ['Vivid scenes', 'Emotional content'],
    example_good: 'Most optimization assumes you know the objective function. But what if you don\'t? That question led me down a three-month rabbit hole.',
    example_bad: 'I find quantum physics fascinating because it challenges our understanding of reality.'
  },
  extracurricular: {
    critical_elements: [
      'Specific moment that captures your involvement',
      'What you actually DO (not just your title)',
      'Evidence of genuine investment'
    ],
    less_important: ['Hours logged', 'Position held'],
    example_good: 'At 6am on Saturdays, I\'m first to the robotics lab. Last March, our bot\'s arm snapped mid-competition—I spent 47 minutes rewiring it.',
    example_bad: 'As president of the robotics club, I\'ve learned valuable leadership skills.'
  },
  leadership: {
    critical_elements: [
      'Specific interaction with people you led',
      'Actual dialogue or decisions made',
      'Impact on real individuals'
    ],
    less_important: ['Titles', 'Scope of responsibility'],
    example_good: 'I asked Jen why she\'d been missing practice. She started crying. I sat with her for an hour.',
    example_bad: 'I led a team of 15 members and improved our performance by 30%.'
  },
  creative: {
    critical_elements: [
      'Specific moment in the creative process',
      'Sensory details of creation',
      'Your unique creative voice or approach'
    ],
    less_important: ['Recognition received', 'Technique names'],
    example_good: 'The clay kept collapsing. Three hours in, I finally stopped fighting the weight and let it slump. That became the piece.',
    example_bad: 'Art allows me to express myself and explore my creativity.'
  },
  values: {
    critical_elements: [
      'Specific moment that revealed or tested the value',
      'Concrete action driven by the value',
      'Evidence of the value in practice'
    ],
    less_important: ['Abstract philosophy', 'General statements'],
    example_good: 'I could have taken the shortcut—no one would have known. I stayed two extra hours to do it right.',
    example_bad: 'Integrity is one of my core values that guides everything I do.'
  },
  future_goals: {
    critical_elements: [
      'Specific connection between past experience and future goal',
      'Evidence of informed understanding of the field',
      'Why YOU specifically'
    ],
    less_important: ['Detailed career timeline', 'Salary expectations'],
    example_good: 'Watching my grandmother give up on her phone after a week—that\'s why I want to build accessible technology.',
    example_bad: 'I hope to work in tech and make a positive impact on society.'
  },
  additional_info: {
    critical_elements: [
      'Specific context that explains something',
      'Concrete facts or situations',
      'Clear relevance to application'
    ],
    less_important: ['Elaborate storytelling', 'Emotional appeals'],
    example_good: 'My grades dropped sophomore year because I was working 30 hours a week to help with rent after my dad\'s accident.',
    example_bad: 'There are circumstances that affected my academic performance.'
  },
  short_answer: {
    critical_elements: [
      'Efficient, direct answer',
      'Specific over general when possible'
    ],
    less_important: ['Elaborate detail', 'Storytelling'],
    example_good: 'Sunday mornings: hiking the trail behind my house with my dog, watching the fog lift.',
    example_bad: 'I enjoy many activities in my free time that help me relax and grow.'
  },
  optional: {
    critical_elements: [
      'Clear reason why this is worth including',
      'Specific information not covered elsewhere',
      'Adds meaningful dimension to application'
    ],
    less_important: ['Length', 'Elaborate prose'],
    example_good: 'My transcript doesn\'t show that I taught myself Python to automate my family\'s restaurant inventory.',
    example_bad: 'I wanted to add some additional information about myself.'
  }
};

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class SemanticContextAnalyzer {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  /**
   * Analyze an essay for context gaps using semantic understanding
   *
   * Uses Haiku for fast, cheap analysis (≈$0.001 per call)
   */
  async analyzeContextGaps(
    essayDraft: string,
    essayType: SupplementalType,
    issues: IssueContext[] = []
  ): Promise<SemanticAnalysisResult> {
    const startTime = Date.now();
    const typePriority = TYPE_PRIORITIES[essayType];

    const systemPrompt = `You are an expert college admissions essay analyst. Your job is to identify "context gaps" - places where the essay CLAIMS something without SHOWING it with concrete details.

A context gap is NOT the same as a writing flaw. It's a place where gathering more information from the student would make the suggestion better than inventing details.

You understand that:
- "I realized the importance of persistence" is a gap (no specific insight shown)
- "After my fifth failed attempt, I understood that the error wasn't in my code—it was in my assumptions" has no gap (specific insight demonstrated)

Be precise. Only flag genuine gaps where specificity is missing.`;

    const userPrompt = `Analyze this ${essayType} essay for context gaps.

ESSAY TYPE PRIORITIES FOR ${essayType.toUpperCase()}:
Critical elements needed:
${typePriority.critical_elements.map(e => `- ${e}`).join('\n')}

Less important for this type:
${typePriority.less_important.map(e => `- ${e}`).join('\n')}

EXAMPLE OF GOOD (has concrete details):
"${typePriority.example_good}"

EXAMPLE OF BAD (has context gap):
"${typePriority.example_bad}"

${issues.length > 0 ? `\nKNOWN ISSUES (already detected):
${issues.map(i => `- "${i.quote}" - ${i.diagnosis.problem}`).join('\n')}` : ''}

ESSAY TO ANALYZE:
"""
${essayDraft}
"""

Respond with JSON:
{
  "gaps": [
    {
      "gap_type": "missing_concrete_scene" | "missing_sensory_detail" | "missing_specific_insight" | "missing_struggle_detail" | "missing_research_evidence" | "missing_person_detail" | "missing_personal_stake" | "performative_authenticity",
      "quote": "exact text that has the gap",
      "diagnosis": "what's missing in plain English",
      "what_would_fix_it": "what we need from the student",
      "impact": "critical" | "high" | "medium" | "low",
      "question_to_ask": "the question to ask the student"
    }
  ],
  "overall_assessment": {
    "should_gather_context": true/false,
    "priority": "high" | "medium" | "low" | "none",
    "reason": "explanation"
  }
}

IMPORTANT:
- Only flag GENUINE gaps where concrete details are missing
- Don't flag things that are already specific
- Prioritize gaps that matter for THIS essay type
- "critical" = would require inventing major details to fix
- "high" = would significantly improve with real context
- "medium" = would be better but not essential
- "low" = minor improvement opportunity`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        system: systemPrompt
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // Parse JSON response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const gaps: SemanticContextGap[] = parsed.gaps || [];
      const assessment = parsed.overall_assessment || {};

      // Calculate cost
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const cost = (inputTokens * 0.001 + outputTokens * 0.005) / 1000;

      // Build prioritized questions
      const questions = gaps
        .sort((a, b) => {
          const order = { critical: 0, high: 1, medium: 2, low: 3 };
          return order[a.impact] - order[b.impact];
        })
        .slice(0, 3)
        .map(g => g.question_to_ask);

      return {
        should_gather_context: assessment.should_gather_context ?? gaps.some(g => g.impact === 'critical' || g.impact === 'high'),
        priority: assessment.priority ?? (gaps.some(g => g.impact === 'critical') ? 'high' : gaps.some(g => g.impact === 'high') ? 'medium' : 'low'),
        reason: assessment.reason ?? `Found ${gaps.length} context gaps`,
        gaps,
        questions_to_ask: questions,
        cost
      };

    } catch (error) {
      console.error('[SemanticContextAnalyzer] Analysis failed:', error);
      // Return safe default
      return {
        should_gather_context: false,
        priority: 'none',
        reason: 'Analysis failed - proceeding without context gathering',
        gaps: [],
        questions_to_ask: [],
        cost: 0
      };
    }
  }

  /**
   * Score the quality of student-provided context
   *
   * Determines if the gathered context is good enough to use,
   * or if we need to ask for more detail.
   */
  async scoreContextQuality(
    studentResponse: string,
    originalGap: SemanticContextGap,
    essayType: SupplementalType
  ): Promise<SemanticQualityScore> {
    const typePriority = TYPE_PRIORITIES[essayType];

    const prompt = `You're evaluating whether a student's response provides good enough context to improve their essay.

ORIGINAL GAP:
"${originalGap.quote}"
Problem: ${originalGap.diagnosis}
We asked: ${originalGap.question_to_ask}

STUDENT'S RESPONSE:
"${studentResponse}"

WHAT GOOD CONTEXT LOOKS LIKE FOR ${essayType.toUpperCase()}:
"${typePriority.example_good}"

Score this response on a 1-5 scale for each dimension:

1. CONCRETENESS (has specific details - names, times, places, numbers)
2. UNIQUENESS (specific to THIS student, not generic)
3. VIVIDNESS (creates a mental image, sensory details)
4. USABILITY (can be woven into the essay, appropriate length)

Respond with JSON:
{
  "dimensions": {
    "concreteness": 1-5,
    "uniqueness": 1-5,
    "vividness": 1-5,
    "usability": 1-5
  },
  "overall": 1-5,
  "assessment": "plain English explanation",
  "is_acceptable": true/false,
  "follow_up_needed": "if not acceptable, what specific follow-up question to ask" or null
}

SCORING GUIDE:
5 = Excellent, ready to use
4 = Good, minor improvements possible
3 = Acceptable, usable as-is
2 = Weak, needs follow-up question
1 = Too vague/generic to use`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [
          { role: 'user', content: prompt }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        overall: parsed.overall ?? 3,
        dimensions: parsed.dimensions ?? { concreteness: 3, uniqueness: 3, vividness: 3, usability: 3 },
        assessment: parsed.assessment ?? 'Unable to assess',
        is_acceptable: parsed.is_acceptable ?? (parsed.overall >= 3),
        follow_up_needed: parsed.follow_up_needed ?? undefined
      };

    } catch (error) {
      console.error('[SemanticContextAnalyzer] Quality scoring failed:', error);
      // Conservative default - ask for follow-up
      return {
        overall: 2,
        dimensions: { concreteness: 2, uniqueness: 2, vividness: 2, usability: 2 },
        assessment: 'Unable to assess quality',
        is_acceptable: false,
        follow_up_needed: 'Can you add more specific details?'
      };
    }
  }

  /**
   * Quick check if an essay likely needs context gathering
   * Uses comprehensive heuristics first, only calls AI if uncertain
   *
   * This provides a fast path for essays that clearly do/don't need gathering
   */
  quickCheck(
    essayDraft: string,
    essayType: SupplementalType
  ): { likely_needs_context: boolean; confidence: 'high' | 'low'; reason: string } {
    const wordCount = essayDraft.split(/\s+/).length;
    const lowerEssay = essayDraft.toLowerCase();

    // Short answer type rarely needs context gathering
    if (essayType === 'short_answer') {
      return {
        likely_needs_context: false,
        confidence: 'high',
        reason: 'Short answers prioritize efficiency over detail'
      };
    }

    // =========================================================================
    // POSITIVE SPECIFICITY INDICATORS (essay is already specific)
    // =========================================================================

    // Time references
    const hasTimeReference = /\d{1,2}(?::\d{2})?\s*(?:am|pm)/i.test(essayDraft);
    const hasDuration = /\d+\s+(?:hours?|minutes?|days?|weeks?|months?)/i.test(essayDraft);

    // Dialogue
    const hasDialogue = /(?:said|asked|told|whispered|replied|shouted)[,\s]+["']/i.test(essayDraft);
    const hasQuotes = /"[^"]{5,}"/.test(essayDraft);

    // Specific numbers
    const hasSpecificNumbers = /\d+\s+(?:times?|people|students|members|pages)/i.test(essayDraft);
    const hasPercentage = /\d+%/.test(essayDraft);

    // Specific places
    const hasSpecificPlace = /(?:my|the|her|his)\s+(?:room|bedroom|desk|lab|kitchen|car|office|house|dorm|apartment)/i.test(essayDraft);

    // Physical/sensory details
    const hasSensory = /(?:smell(?:ed)?|sound(?:ed)?|felt|tast(?:ed?)|look(?:ed)?)\s+(?:like|of)/i.test(essayDraft);
    const hasPhysical = /(?:hands?\s+(?:shook|trembled)|heart\s+(?:raced|pounded)|tears?|sweat)/i.test(essayDraft);

    // Specific actions in past tense with detail
    const hasSpecificAction = /I\s+(?:sat|stood|walked|ran|typed|clicked|pressed|grabbed|held|picked up)/i.test(essayDraft);

    const specificityIndicators = [
      hasTimeReference, hasDuration, hasDialogue, hasQuotes,
      hasSpecificNumbers, hasPercentage, hasSpecificPlace,
      hasSensory, hasPhysical, hasSpecificAction
    ];
    const specificityScore = specificityIndicators.filter(Boolean).length;

    // High specificity = no context needed
    if (specificityScore >= 4) {
      return {
        likely_needs_context: false,
        confidence: 'high',
        reason: `Essay has ${specificityScore} concrete details (time, dialogue, place, sensory)`
      };
    }

    // =========================================================================
    // NEGATIVE INDICATORS (essay needs context)
    // =========================================================================

    // Performative authenticity patterns
    const performativePatterns = [
      /(?:blew|changed|transformed)\s+my\s+(?:mind|life|perspective)/i,
      /not for (?:a class|school|credit|grades?)/i,
      /on my own (?:time|initiative)/i,
      /sparked (?:my|a)\s+(?:passion|interest|curiosity)/i,
      /I(?:'m| am) passionate about/i,
      /(?:taught|showed)\s+me\s+(?:a lot|so much|that|how)/i,
      /opened my eyes/i,
      /I\s+(?:realized|discovered|learned)\s+that/i,
      /made me (?:realize|understand|see)/i
    ];

    // Generic claim patterns
    const genericClaimPatterns = [
      /this experience (?:taught|showed|made)/i,
      /(?:meaningful|valuable|important)\s+(?:experience|lesson)/i,
      /I(?:'ve| have) (?:always|developed|grown)/i,
      /(?:helped|allowed) me to (?:grow|develop|learn)/i,
      /(?:exciting|interesting|fascinating)\s+(?:research|work|opportunity)/i,
      /I (?:believe|feel|think) (?:that )?I would/i,
      /(?:appeals|attracted|drew)\s+(?:to me|me)/i
    ];

    // Vague challenge patterns
    const vagueChallengePatterns = [
      /(?:faced|overcame|dealt with)\s+(?:a|an|the|many)\s+(?:challenge|obstacle|difficulty)/i,
      /(?:difficult|challenging|hard)\s+(?:time|period|experience)/i,
      /through (?:perseverance|resilience|determination)/i,
      /(?:navigat(?:ed|ing)|handl(?:ed|ing))\s+(?:the|this|these)/i
    ];

    const performativeCount = performativePatterns.filter(p => p.test(essayDraft)).length;
    const genericCount = genericClaimPatterns.filter(p => p.test(essayDraft)).length;
    const vagueCount = vagueChallengePatterns.filter(p => p.test(essayDraft)).length;

    const negativeScore = performativeCount + genericCount + vagueCount;

    // High negative score = definitely needs context
    if (negativeScore >= 3) {
      return {
        likely_needs_context: true,
        confidence: 'high',
        reason: `Found ${negativeScore} vague/performative patterns without concrete details`
      };
    }

    // =========================================================================
    // COMBINED ANALYSIS
    // =========================================================================

    // Low specificity + some negative patterns = needs context
    if (specificityScore <= 1 && negativeScore >= 2) {
      return {
        likely_needs_context: true,
        confidence: 'high',
        reason: 'Few concrete details + multiple generic claims'
      };
    }

    // Good specificity + few negative patterns = doesn't need context
    if (specificityScore >= 3 && negativeScore <= 1) {
      return {
        likely_needs_context: false,
        confidence: 'high',
        reason: 'Has concrete details despite some generic language'
      };
    }

    // =========================================================================
    // TYPE-SPECIFIC CHECKS
    // =========================================================================

    // why_us: Check for specific research/program mentions
    if (essayType === 'why_us') {
      const hasSpecificResearch = /(?:lab|center|institute|program)\s+(?:on|for|in)/i.test(essayDraft);
      const hasSpecificCourse = /(?:course|class|seminar)\s+(?:on|in|about)/i.test(essayDraft);
      const hasTechnicalDetail = /\d+\s*%|using\s+\w+(?:ing)?|method|approach|framework/i.test(essayDraft);

      if (!hasSpecificResearch && !hasSpecificCourse && !hasTechnicalDetail) {
        return {
          likely_needs_context: true,
          confidence: 'high',
          reason: 'Why_us essay lacks specific research/program details'
        };
      }
    }

    // challenge: Check for specific struggle
    if (essayType === 'challenge') {
      const hasSpecificStruggle = hasPhysical || hasSensory ||
        /(?:failed|couldn't|didn't work|broke|crashed)/i.test(essayDraft);

      if (!hasSpecificStruggle && vagueCount >= 1) {
        return {
          likely_needs_context: true,
          confidence: 'high',
          reason: 'Challenge essay describes difficulty without specific struggle moment'
        };
      }
    }

    // Uncertain - needs AI analysis
    return {
      likely_needs_context: specificityScore < 2,
      confidence: 'low',
      reason: `Specificity: ${specificityScore}, Negative: ${negativeScore} - Need semantic analysis`
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const semanticContextAnalyzer = new SemanticContextAnalyzer();
