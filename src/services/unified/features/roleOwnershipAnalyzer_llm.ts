/**
 * ROLE CLARITY & OWNERSHIP LLM ANALYZER
 *
 * Dimension: Role Clarity & Ownership (7% weight)
 *
 * Uses LLM-based semantic analysis to detect:
 * - Individual agency vs team credit ambiguity ("I" vs "we")
 * - Specific role descriptions vs title-only mentions
 * - Differentiation of personal contribution from team's work
 * - Ownership of failures (not just successes)
 *
 * Based on the v4 "Gold Standard" Architecture.
 */

import { callClaude } from '@/lib/llm/claude';

// ============================================================================
// TYPES
// ============================================================================

export interface RoleOwnershipAnalysis {
  // Overall assessment
  score: number; // 0-10 (decimals allowed)
  quality_level: 'crystal_clear_agency' | 'strong_clarity' | 'mixed_clarity' | 'ambiguous' | 'no_individual_agency';

  // Deep reasoning (v4 Architecture)
  reasoning: {
    agency_analysis: string; // "I" vs "We" balance and effectiveness
    role_specificity_analysis: string; // Title vs Description
    differentiation_analysis: string; // Me vs Them
    ownership_analysis: string; // Failure/Outcome ownership
  };

  // Tier Evaluation (v4 Architecture)
  tier_evaluation: {
    current_tier: 'passenger' | 'task_owner' | 'outcome_owner' | 'culture_setter';
    next_tier: 'task_owner' | 'outcome_owner' | 'culture_setter' | 'max_tier';
    tier_reasoning: string;
  };

  // Evidence
  evidence_quotes: string[]; // Direct quotes supporting the score
  evaluator_note: string; // 1-2 sentence explanation

  // Detailed analysis
  agency_balance: {
    description: string;
    examples: string[];
  };
  role_description: {
    clarity: 'specific' | 'mentioned' | 'title_only' | 'absent';
    description: string;
  };
  differentiation_from_team: {
    present: boolean;
    description: string;
  };
  failure_ownership: {
    present: boolean;
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

const ROLE_OWNERSHIP_CONFIG = {
  name: 'role_clarity_ownership',
  display_name: 'Role Clarity & Individual Ownership',
  weight: 0.07,
  definition: 'Does the essay clarify the student\'s specific role and differentiate their contributions from the team?',

  tiers: {
    1: {
      name: 'Passenger',
      score_range: '0-3',
      description: 'All "we" statements. "We won state." No individual agency. Student is a passenger in their own story.',
    },
    2: {
      name: 'Task Owner',
      score_range: '4-6',
      description: 'Mix of "I" and "we". Describes tasks but not outcomes. "I was responsible for scheduling." Functional but limited.',
    },
    3: {
      name: 'Outcome Owner',
      score_range: '7-8',
      description: 'Clear "I" agency. Takes responsibility for results. "I reorganized the schedule, which led to X." Owns failures.',
    },
    4: {
      name: 'Culture Setter',
      score_range: '9-10',
      description: 'Defines the team culture. "I realized our culture was toxic, so I..." Differentiates clearly between self and team.',
    },
  },

  evaluator_prompts: [
    'Can you tell exactly what THIS student did vs what the team did?',
    'Is there a specific role description or just a title mention?',
    'Does the student use "I" for their own actions or "we" for everything?',
    'Does the student own failures personally ("I messed up")?',
  ],

  warning_signs: [
    'Dominance of "we" statements',
    'Title-only role mentions',
    'No personal failure ownership',
    'Passive voice ("mistakes were made")',
  ],
};

// ============================================================================
// LLM ANALYZER
// ============================================================================

export async function analyzeRoleOwnership(essayText: string): Promise<RoleOwnershipAnalysis> {
  const config = ROLE_OWNERSHIP_CONFIG;

  const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Role Clarity & Ownership.

**Definition:** ${config.definition}

**Goal:** Determine if the student is a Passenger, Task Owner, Outcome Owner, or Culture Setter.

**Scoring Tiers (The Ladder of Agency):**
1. **Tier 1: Passenger (0-3)** - All "we" statements. "We won state." No individual agency. Vague "helped with".
2. **Tier 2: Task Owner (4-6)** - Mix of "I" and "we". Describes tasks ("I sent emails") but not impact. Functional.
3. **Tier 3: Outcome Owner (7-8)** - Clear "I" agency. Takes responsibility for results. "I reorganized the schedule, which led to X." Owns failures personally.
4. **Tier 4: Culture Setter (9-10)** - Defines/changes team culture. Clear differentiation: "While the team focused on X, I realized we needed Y."

**Diagnostic Prompts (Reasoning Engine):**
1. **The "We" Filter:** If you remove "we" sentences, is there anything left?
2. **Role Specificity:** Do they say "I was President" (Title) or "I managed the $5k budget" (Description)?
3. **Failure Test:** Do they say "We struggled" (Tier 1/2) or "I failed to communicate" (Tier 3/4)?
4. **Outcome Link:** Do they link their specific action to the team's result?

**CRITICAL CALIBRATION:**
- **"We" is okay IF** the individual contribution is clear first. "I built the chassis, and we won."
- **Titles are NOT Descriptions.** "As Captain" means nothing without "I led drills."

**Output Format:**
{
  "score": <number 0-10>,
  "quality_level": "<crystal_clear_agency|strong_clarity|mixed_clarity|ambiguous|no_individual_agency>",
  "tier_evaluation": {
    "current_tier": "<passenger|task_owner|outcome_owner|culture_setter>",
    "next_tier": "<task_owner|outcome_owner|culture_setter|max_tier>",
    "tier_reasoning": "<Succinct explanation of why it's in this tier>"
  },
  "reasoning": {
    "agency_analysis": "<Analyze I vs We balance>",
    "role_specificity_analysis": "<Title vs Description>",
    "differentiation_analysis": "<Me vs Them>",
    "ownership_analysis": "<Failure/Outcome ownership>"
  },
  "evidence_quotes": ["<quote 1>", "<quote 2>"],
  "evaluator_note": "<1 sentence summary>",
  "agency_balance": { "description": "<string>", "examples": ["<string>"] },
  "role_description": { "clarity": "<specific|mentioned|title_only|absent>", "description": "<string>" },
  "differentiation_from_team": { "present": <boolean>, "description": "<string>" },
  "failure_ownership": { "present": <boolean>, "description": "<string>" },
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "strategic_pivot": "<THE INVISIBLE CEILING: Identify the exact flaw. Prescribe the specific fix. e.g., 'You say 'We organized the event' (Passenger/Tier 1). To reach Task Owner (Tier 2), specify exactly what YOU organized—the venue? the speakers? the marketing?'>",

  "confidence": <number 0-1>
}`;

  const userPrompt = `Analyze this essay for Role Clarity:

---

${essayText}

---

Provide your analysis as JSON following the exact format specified.`;

  try {
    const response = await callClaude<RoleOwnershipAnalysis>(userPrompt, {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt,
      useJsonMode: true,
    });

    return response.content;

  } catch (error) {
    console.error('[Role Ownership LLM Analyzer] API call failed:', error);
    return {
      score: 0,
      quality_level: 'no_individual_agency',
      tier_evaluation: {
        current_tier: 'passenger',
        next_tier: 'task_owner',
        tier_reasoning: 'Analysis failed',
      },
      reasoning: {
        agency_analysis: 'Analysis failed',
        role_specificity_analysis: 'Analysis failed',
        differentiation_analysis: 'Analysis failed',
        ownership_analysis: 'Analysis failed',
      },
      evidence_quotes: [],
      evaluator_note: 'Error: Unable to analyze essay due to API failure',
      agency_balance: { description: 'Analysis failed', examples: [] },
      role_description: { clarity: 'absent', description: 'Analysis failed' },
      differentiation_from_team: { present: false, description: 'Analysis failed' },
      failure_ownership: { present: false, description: 'Analysis failed' },
      strengths: [],
      weaknesses: ['Unable to analyze due to technical error'],
      strategic_pivot: 'Analysis failed',

      confidence: 0,
    };
  }
}
