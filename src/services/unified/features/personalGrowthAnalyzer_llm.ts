/**
 * PERSONAL GROWTH LLM ANALYZER
 *
 * Dimension: Personal Growth
 *
 * Evaluates the student's maturity and development:
 * - How has the student matured?
 * - Have they developed self-awareness, resilience, or new perspectives?
 * - Is the growth internal (mindset) or just external (skills)?
 * - Do they demonstrate vulnerability and reflection?
 *
 * Based on the v4 "Gold Standard" Architecture.
 */

import { callClaude } from '@/lib/llm/claude';

// ============================================================================
// TYPES
// ============================================================================

export interface PersonalGrowthAnalysis {
  // Overall assessment
  score: number; // 0-10 (decimals allowed)
  quality_level: 'transformative' | 'reflective' | 'reactive' | 'stagnant';

  // Deep reasoning (v4 Architecture)
  reasoning: {
    initial_state: string; // What was the starting mindset/capability?
    catalyst: string; // What specific event triggered the change?
    internal_process: string; // How did they process the challenge? (Thinking/Feeling)
    outcome_state: string; // What is the new mindset/capability?
  };

  // Tier Evaluation (v4 Architecture)
  tier_evaluation: {
    current_tier: 'stagnant' | 'reactive' | 'reflective' | 'transformative';
    next_tier: 'reactive' | 'reflective' | 'transformative' | 'max_tier';
    tier_reasoning: string;
  };

  // Evidence
  evidence_quotes: string[]; // Direct quotes
  evaluator_note: string; // 1-2 sentence explanation

  // Detailed analysis
  growth_type: {
    type: 'mindset' | 'perspective' | 'skill' | 'none';
    description: string;
  };
  catalyst_quality: {
    type: 'specific_event' | 'general_process' | 'vague';
    description: string;
  };
  reflection_depth: {
    level: 'deep' | 'surface' | 'none';
    description: string;
  };

  // Guidance
  strengths: string[];
  weaknesses: string[];
  strategic_pivot: string; // (v4) High-level strategy to reach next tier

  // Metadata
  confidence: number; // 0-1
}

// ============================================================================
// DIMENSION CONFIGURATION
// ============================================================================

const PERSONAL_GROWTH_CONFIG = {
  name: 'personal_growth',
  display_name: 'Personal Growth',
  definition: 'How has the student matured? Have they developed self-awareness, resilience, or new perspectives? Is the growth internal (mindset) or just external (skills)?',

  // Tiers from PHASE_3_LLM_ANALYZER_ARCHITECTURE.md (Drafted)
  tiers: {
    1: {
      name: 'Stagnant',
      score_range: '0-3',
      description: '"I did this." Focus on events/activities. No internal change mentioned. External metrics only.',
    },
    2: {
      name: 'Reactive',
      score_range: '4-6',
      description: '"I learned time management." Learned a basic lesson/skill. Cliché takeaways. "Hard work pays off."',
    },
    3: {
      name: 'Reflective',
      score_range: '7-8',
      description: '"I realized I was wrong." Shift in perspective. Specific internal change. Emotional maturity.',
    },
    4: {
      name: 'Transformative',
      score_range: '9-10',
      description: '"My fundamental worldview shifted." Deep self-awareness. Vulnerability. Application of growth to other areas.',
    },
  },

  evaluator_prompts: [
    'Does the student just recount events or do they analyze their reaction?',
    'Is the lesson learned generic (e.g., "I learned leadership") or specific?',
    'Do they admit fault, weakness, or previous ignorance?',
    'Is the growth internal (mindset) or external (skills)?',
    'Does the growth extend beyond the specific activity?',
  ],

  warning_signs: [
    'Focusing entirely on external achievements',
    'Cliché lessons ("hard work", "teamwork", "time management")',
    'Lack of vulnerability (trying to look perfect)',
    'Describing the "what" but not the "so what"',
    'Growth feels unearned or sudden',
  ],
};

// ============================================================================
// LLM ANALYZER
// ============================================================================

/**
 * Analyze Personal Growth using LLM semantic understanding
 */
export async function analyzePersonalGrowth(essayText: string): Promise<PersonalGrowthAnalysis> {
  const config = PERSONAL_GROWTH_CONFIG;

  const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Personal Growth.

**Definition:** ${config.definition}

**Goal:** Determine if the student is Stagnant, Reactive, Reflective, or Transformative.

**Scoring Tiers (The Ladder of Growth):**
1. **Tier 1: Stagnant (0-3)** - "I did this." Focus on events, activities, and external metrics. No mention of internal change or reflection. "It was hard but I did it."
2. **Tier 2: Reactive (4-6)** - "I learned X skill." Learned a basic lesson or skill (time management, hard work, teamwork). Takeaways are often clichés. "I learned that hard work pays off."
3. **Tier 3: Reflective (7-8)** - "I realized my assumption was wrong." Shift in perspective. Specific internal change. Emotional maturity. Admits fault or ignorance. Connects growth to specific moments.
4. **Tier 4: Transformative (9-10)** - "My fundamental worldview shifted." Deep self-awareness. Vulnerability. Application of growth to other areas. The student is a different person at the end.

**Diagnostic Prompts (Reasoning Engine):**
1. **Focus:** Is it on the *Event* (Tiers 1-2) or the *Self* (Tier 3+)?
2. **Lesson:** Is it a *Skill* (Tier 2) or a *Mindset* (Tier 3+)?
3. **Vulnerability:** Does the student admit weakness/failure (Tier 3+) or try to look perfect (Tier 1-2)?
4. **Catalyst:** Is the change triggered by a specific moment (High Quality) or a general process (Low Quality)?

**CRITICAL CALIBRATION:**
- **The "Skill Trap":** Learning to code or organize events is *Skill Development*, not necessarily *Personal Growth*. Unless it changed their character, it's Tier 2.
- **The "Cliché Trap":** "I learned the importance of teamwork" is a Tier 2 cliché unless backed by deep, specific introspection.
- **The "Vulnerability Premium":** Essays that admit real failure or ignorance should be rewarded (Tier 3+).
- **The "Show, Don't Tell":** "I grew a lot" (Tier 1) vs describing the moment of change (Tier 3).

**Output Format:**
{
  "score": <number 0-10>,
  "quality_level": "<transformative|reflective|reactive|stagnant>",
  "tier_evaluation": {
    "current_tier": "<stagnant|reactive|reflective|transformative>",
    "next_tier": "<reactive|reflective|transformative|max_tier>",
    "tier_reasoning": "<Succinct explanation of why it's in this tier>"
  },
  "reasoning": {
    "initial_state": "<What was the starting mindset/capability?>",
    "catalyst": "<What specific event triggered the change?>",
    "internal_process": "<How did they process the challenge?>",
    "outcome_state": "<What is the new mindset/capability?>"
  },
  "evidence_quotes": ["<quote 1>", "<quote 2>"],
  "evaluator_note": "<1 sentence summary>",
  "growth_type": {
    "type": "<mindset|perspective|skill|none>",
    "description": "<Description of growth type>"
  },
  "catalyst_quality": {
    "type": "<specific_event|general_process|vague>",
    "description": "<Description of catalyst>"
  },
  "reflection_depth": {
    "level": "<deep|surface|none>",
    "description": "<Description of reflection depth>"
  },
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "strategic_pivot": "<THE INVISIBLE CEILING: Identify the exact flaw keeping this essay in its current tier. Then prescribe the specific action/detail to break through. e.g., 'You focus on learning a skill (Reactive/Tier 2). To reach Reflective (Tier 3), describe the internal moment of doubt you felt when you failed at first, and how that changed your approach to failure itself.'>",

  "confidence": <number 0-1>
}

**CRITICAL:** All quotes must be exact.`;

  const userPrompt = `Analyze this essay for Personal Growth:

---

${essayText}

---

Provide your analysis as JSON following the exact format specified.`;

  try {
    const response = await callClaude<PersonalGrowthAnalysis>(userPrompt, {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt,
      useJsonMode: true,
    });

    return response.content;

  } catch (error) {
    console.error('[Personal Growth LLM Analyzer] API call failed:', error);
    return {
      score: 0,
      quality_level: 'stagnant',
      tier_evaluation: {
        current_tier: 'stagnant',
        next_tier: 'reactive',
        tier_reasoning: 'Analysis failed',
      },
      reasoning: {
        initial_state: 'Analysis failed',
        catalyst: 'Analysis failed',
        internal_process: 'Analysis failed',
        outcome_state: 'Analysis failed',
      },
      evidence_quotes: [],
      evaluator_note: 'Error: Unable to analyze essay due to API failure',
      growth_type: { type: 'none', description: 'Analysis failed' },
      catalyst_quality: { type: 'vague', description: 'Analysis failed' },
      reflection_depth: { level: 'none', description: 'Analysis failed' },
      strengths: [],
      weaknesses: ['Unable to analyze due to technical error'],
      strategic_pivot: 'Analysis failed',

      confidence: 0,
    };
  }
}

