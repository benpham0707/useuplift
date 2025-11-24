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
 * This analyzer uses Claude API for dynamic, semantic understanding
 * rather than rigid pattern matching. It follows the v4 "Gold Standard"
 * architecture.
 */

import { callClaude } from '@/lib/llm/claude';
import { analyzeRoleOwnership as analyzeRoleHeuristic } from './roleOwnershipAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export interface RoleClarityAnalysis {
  // Overall assessment
  score: number; // 0-10 (decimals allowed)
  quality_level: 'culture_setter' | 'outcome_owner' | 'task_owner' | 'passenger';

  // Reasoning (v4 Architecture)
  reasoning: {
    context_analysis: string; // What was the team/group context?
    action_analysis: string; // "I" vs "We" balance and specificity
    impact_analysis: string; // Did they own the result or just the task?
    voice_analysis: string; // Authentic agency vs vague participation
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
    description: string; // "80% I statements, clear individual agency" or "Dominated by 'we' language"
    examples: string[]; // Quotes showing agency or lack thereof
  };
  role_description: {
    clarity: 'specific' | 'mentioned' | 'title_only' | 'absent';
    description: string; // What role clarity looks like in this essay
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
  strategic_pivot: string; // (formerly quick_wins) High-level narrative strategy

  // Metadata
  confidence: number; // 0-1 confidence in scoring
}

// ============================================================================
// DIMENSION CONFIGURATION
// ============================================================================

const ROLE_CLARITY_CONFIG = {
  name: 'role_clarity_ownership',
  display_name: 'Role Clarity & Ownership',
  weight: 0.07,
  definition: 'Does the student understand their specific contribution relative to the group? Do they take ownership of outcomes, or just tasks?',

  // Tiers from PHASE_3_LLM_ANALYZER_ARCHITECTURE.md
  tiers: {
    1: {
      name: 'Passenger',
      score_range: '0-3',
      description: '"We did X." Vague about personal contribution. Hides behind "we."',
    },
    2: {
      name: 'Task Owner',
      score_range: '4-6',
      description: '"I was responsible for Y." Clear duties, but defined by others.',
    },
    3: {
      name: 'Outcome Owner',
      score_range: '7-8',
      description: '"I ensured Y succeeded by doing Z." Takes responsibility for the result, not just the effort. Stepped in when others failed.',
    },
    4: {
      name: 'Culture Setter',
      score_range: '9-10',
      description: '"I defined *how* we work." Defined the role for future generations. Elevates the standard for everyone.',
    },
  },

  evaluator_prompts: [
    'Can you tell exactly what THIS student did vs what the team/others did?',
    'Is there a specific role description or just a title mention?',
    'Does the student use "I" for their own actions or "we" for everything?',
    'Does the student own failures personally ("I messed up") or deflect to team ("we struggled")?',
    'Are there vague phrases like "helped with", "was part of", "contributed to" without specifics?',
    'Do we see strong individual agency verbs (I led, I created, I decided) or passive/vague language?',
  ],

  warning_signs: [
    '"We" soup (cannot find "I" in the essay)',
    'List of titles without descriptions of specific actions',
    'Blaming others for failures vs. owning the solution',
    '"I helped" (weak auxiliary verb) vs "I drove/built/fixed"',
    'Passive voice: "It was decided", "The team needed"',
  ],
};

// ============================================================================
// LLM ANALYZER
// ============================================================================

/**
 * Analyze Role Clarity & Ownership using LLM semantic understanding
 */
export async function analyzeRoleClarity(essayText: string): Promise<RoleClarityAnalysis> {
  const config = ROLE_CLARITY_CONFIG;

  const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Role Clarity & Ownership.

**Definition:** ${config.definition}

**Goal:** Determine if the student was a Passenger, Task Owner, Outcome Owner, or Culture Setter.

**Scoring Tiers (The Ladder of Ownership):**
1. **Tier 1: Passenger (0-3)** - "We did X." Vague about personal contribution. Hides behind "we."
2. **Tier 2: Task Owner (4-6)** - "I was responsible for Y." Clear duties, but defined by others.
3. **Tier 3: Outcome Owner (7-8)** - "I ensured Y succeeded by doing Z." Takes responsibility for the *result*, not just the effort. Stepped in when others failed.
4. **Tier 4: Culture Setter (9-10)** - "I defined *how* we work." Defined the role for future generations. Elevates the standard for everyone.

**Diagnostic Prompts (Reasoning Engine):**
1. **Agency Balance:** Count the "I" vs "We" statements for *actions*. "We decided" = Passenger. "I convinced the team" = Owner.
2. **Role Specificity:** Does the title match the work? Or is it a "Resume Dump" (President, VP, Treasurer) with no details?
3. **Outcome Ownership:** If the project failed, who is to blame? If it succeeded, who drove it?
4. **Narrative Evidence:** Do they show the *moment* of taking charge? Or just list duties?

**CRITICAL CALIBRATION:**
- **Ignore Robotic Templates:** "I realized that leadership is about..." = NO CREDIT.
- **"We" Trap:** If an essay is >50% "We" statements for core actions, it CANNOT exceed Tier 2 (Score 6).
- **Vague Verbs:** "Helped", "Assisted", "Participated" are Tier 1 verbs. "Built", "Negotiated", "Overhauled" are Tier 3 verbs.

**Output Format:**
{
  "score": <number 0-10>,
  "quality_level": "<culture_setter|outcome_owner|task_owner|passenger>",
  "tier_evaluation": {
    "current_tier": "<passenger|task_owner|outcome_owner|culture_setter>",
    "next_tier": "<task_owner|outcome_owner|culture_setter|max_tier>",
    "tier_reasoning": "<Succinct explanation of why it's in this tier>"
  },
  "reasoning": {
    "context_analysis": "<Analyze the team/group context>",
    "action_analysis": "<Analyze the I vs We balance and specificity of actions>",
    "impact_analysis": "<Analyze if they owned the result or just the task>",
    "voice_analysis": "<Analyze the authenticity of agency>"
  },
  "evidence_quotes": ["<quote 1>", "<quote 2>"],
  "evaluator_note": "<1 sentence summary>",
  "agency_balance": {
    "description": "<Describe I vs we ratio>",
    "examples": ["<quote>"]
  },
  "role_description": {
    "clarity": "<specific|mentioned|title_only|absent>",
    "description": "<What role clarity looks like>"
  },
  "differentiation_from_team": {
    "present": <boolean>,
    "description": "<Can you tell student's work vs team's work?>"
  },
  "failure_ownership": {
    "present": <boolean>,
    "description": "<Does student own failures personally?>"
  },
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "strategic_pivot": "<THE INVISIBLE CEILING: Identify the exact narrative or structural flaw keeping this essay in its current tier. Then prescribe the specific 'counter-factual' action to break through. e.g., 'You list titles but not actions. To reach Outcome Owner (Tier 3), describe a specific moment where you stepped in to solve a crisis that others missed.'>",
  "confidence": <number 0-1>
}

**CRITICAL:** All quotes must be exact.`;

  const userPrompt = `Analyze this essay for Role Clarity & Ownership:

---

${essayText}

---

Provide your analysis as JSON following the exact format specified in the system prompt.`;

  try {
    const response = await callClaude<RoleClarityAnalysis>(userPrompt, {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt,
      useJsonMode: true,
    });

    return response.content;

  } catch (error) {
    console.error('[Role Clarity LLM Analyzer] API call failed, falling back to Heuristic Analysis:', error);
    
    const heuristic = analyzeRoleHeuristic(essayText);

    return {
      score: heuristic.role_score,
      quality_level: mapHeuristicQuality(heuristic.role_quality),
      reasoning: {
        context_analysis: heuristic.has_role_description ? 'Role defined.' : 'Role undefined.',
        action_analysis: `Agency ratio: ${heuristic.agency_ratio}.`,
        impact_analysis: heuristic.differentiates_from_team ? 'Differentiates contribution.' : 'Team/Group focused.',
        voice_analysis: heuristic.agency_ratio > 0.6 ? 'Strong agency voice.' : 'Passive/Team voice.'
      },
      tier_evaluation: {
        current_tier: mapScoreToTier(heuristic.role_score),
        next_tier: 'task_owner',
        tier_reasoning: 'Heuristic Analysis: Score based on I/We ratio, role specificity, and differentiation.'
      },
      evidence_quotes: heuristic.i_examples.concat(heuristic.role_examples),
      evaluator_note: 'Heuristic fallback used due to LLM failure.',
      agency_balance: { 
        description: `Ratio: ${heuristic.agency_ratio}`, 
        examples: heuristic.i_examples 
      },
      role_description: { 
        clarity: heuristic.role_clarity, 
        description: heuristic.has_role_description ? 'Role mentioned.' : 'Absent.' 
      },
      differentiation_from_team: { 
        present: heuristic.differentiates_from_team, 
        description: 'Heuristic detection.' 
      },
      failure_ownership: { 
        present: heuristic.owns_failures, 
        description: 'Heuristic detection.' 
      },
      strengths: heuristic.strengths,
      weaknesses: heuristic.weaknesses,
      strategic_pivot: heuristic.quick_wins[0] || 'Clarify your role.',
      confidence: 0.5,
    };
  }
}

function mapHeuristicQuality(q: string): RoleClarityAnalysis['quality_level'] {
  switch (q) {
    case 'crystal_clear_agency': return 'culture_setter';
    case 'strong_clarity': return 'outcome_owner';
    case 'mixed_clarity': return 'task_owner';
    default: return 'passenger';
  }
}

function mapScoreToTier(score: number): RoleClarityAnalysis['tier_evaluation']['current_tier'] {
  if (score >= 9) return 'culture_setter';
  if (score >= 7) return 'outcome_owner';
  if (score >= 4) return 'task_owner';
  return 'passenger';
}

