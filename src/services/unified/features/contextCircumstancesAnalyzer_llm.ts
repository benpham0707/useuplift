/**
 * CONTEXT & CIRCUMSTANCES LLM ANALYZER
 *
 * Dimension: Context & Circumstances (6% weight)
 *
 * Evaluates how students contextualize their experiences:
 * - Obstacles, constraints, or unique circumstances
 * - Resourcefulness and creative problem-solving
 * - Avoiding victimhood while acknowledging challenges
 * - Awareness of privilege/advantages vs. constraints
 *
 * This dimension is PIQ-specific (not in extracurricular workshop)
 * but follows the same depth and rigor standards.
 */

import { callClaude } from '@/lib/llm/claude';
import { analyzeContextCircumstances as analyzeContextHeuristic } from './contextCircumstancesAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export interface ContextCircumstancesAnalysis {
  // Overall assessment
  score: number; // 0-10 (decimals allowed)
  quality_level: 'alchemist' | 'navigator' | 'survivor' | 'victim_bystander';

  // Deep reasoning (v4 Architecture)
  reasoning: {
    context_analysis: string; // What was the status quo/constraint?
    action_analysis: string; // Was it reactive (endurance) or proactive (resourcefulness)?
    impact_analysis: string; // Did they just survive or transform the situation?
    voice_analysis: string; // Is it authentic or "trauma dumping"/manufactured?
  };

  // Tier Evaluation (v4 Architecture)
  tier_evaluation: {
    current_tier: 'victim_bystander' | 'survivor' | 'navigator' | 'alchemist';
    next_tier: 'survivor' | 'navigator' | 'alchemist' | 'max_tier';
    tier_reasoning: string;
  };

  // Evidence
  evidence_quotes: string[]; // Direct quotes
  evaluator_note: string; // 1-2 sentence explanation

  // Detailed analysis
  obstacles_constraints: {
    present: boolean;
    types: string[]; // "financial", "family", "systemic", "time", "resources", "health", "immigration", "language"
    specificity: 'specific' | 'mentioned' | 'generic' | 'absent';
    examples: string[];
    description: string;
  };
  resourcefulness: {
    present: boolean;
    examples: string[]; // Creative solutions, workarounds, self-teaching
    description: string;
  };
  tone_assessment: {
    victimhood: boolean; // Blaming without agency
    agency: boolean; // Owns story despite constraints
    privilege_awareness: boolean; // Acknowledges advantages
    description: string;
  };

  // Guidance
  strengths: string[];
  weaknesses: string[];
  strategic_pivot: string; // (v4) High-level contextualization strategy to reach next tier

  // Metadata
  confidence: number; // 0-1
}

// ============================================================================
// DIMENSION CONFIGURATION
// ============================================================================

const CONTEXT_CIRCUMSTANCES_CONFIG = {
  name: 'context_circumstances',
  display_name: 'Context & Circumstances',
  weight: 0.06,
  definition: 'Does the essay provide context about obstacles, constraints, or unique circumstances that shaped the experience? Shows resourcefulness while maintaining agency.',

  // Tiers from PHASE_3_LLM_ANALYZER_ARCHITECTURE.md
  tiers: {
    1: {
      name: 'Victim/Bystander',
      score_range: '0-3',
      description: '"Things happened to me." Passive. Blames circumstances or provides no context (privilege-blind).',
    },
    2: {
      name: 'Survivor',
      score_range: '4-6',
      description: '"I got through it." Resilience. Endured hardship but didn\'t leverage it. Generic "it was hard".',
    },
    3: {
      name: 'Navigator',
      score_range: '7-8',
      description: '"I found a way." Resourcefulness. Creative solutions to specific obstacles. Turned limits into opportunities.',
    },
    4: {
      name: 'Alchemist',
      score_range: '9-10',
      description: '"I transformed the disadvantage." Institutional awareness. Deep reflection on opportunity cost. The context *is* the superpower.',
    },
  },

  evaluator_prompts: [
    'What specific obstacles or constraints did the student face?',
    'Is there evidence of resourcefulness or creative problem-solving?',
    'Does the essay avoid victimhood while acknowledging challenges?',
    'Can I understand how circumstances shaped (not just limited) this experience?',
    'Is there awareness of both constraints AND advantages?',
    'Does context add meaning, or is it just complaint?',
  ],

  warning_signs: [
    'generic hardship without specifics',
    'victimhood tone (blaming without agency)',
    'privilege-blind (no awareness of advantages)',
    'listing obstacles without showing how they were navigated',
    'using hardship as excuse for lack of achievement',
    'trauma dumping without narrative purpose',
    'manufactured sympathy',
  ],
};

// ============================================================================
// LLM ANALYZER
// ============================================================================

/**
 * Analyze Context & Circumstances using LLM semantic understanding
 */
export async function analyzeContextCircumstances(essayText: string): Promise<ContextCircumstancesAnalysis> {
  const config = CONTEXT_CIRCUMSTANCES_CONFIG;

  const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Context & Circumstances.

**Definition:** ${config.definition}

**Goal:** Determine if the student is a Victim/Bystander, Survivor, Navigator, or Alchemist.

**Scoring Tiers (The Ladder of Context):**
1. **Tier 1: Victim/Bystander (0-3)** - "Things happened to me." Passive. Blames circumstances ("The system held me back") or provides no context (privilege-blind).
2. **Tier 2: Survivor (4-6)** - "I got through it." Resilience. Endured hardship but didn't leverage it. Often generic ("it was hard"). "I worked hard despite X."
3. **Tier 3: Navigator (7-8)** - "I found a way." Resourcefulness. Creative solutions to *specific* obstacles. "I couldn't afford X, so I built Y."
4. **Tier 4: Alchemist (9-10)** - "I transformed the disadvantage." Institutional awareness. Deep reflection on opportunity cost. The context *is* the superpower. "Navigating bureaucracy became my skill."

**Diagnostic Prompts (Reasoning Engine):**
1. **Context Analysis:** Are obstacles concrete ("$12/hr cash") or generic ("financial struggles")?
2. **Action Analysis:** Did they just endure (Survivor) or problem-solve (Navigator)?
3. **Impact Analysis:** Did the context limit them, or did it shape a unique strength?
4. **Voice Analysis:** Is it authentic, or is it "trauma dumping" / manufactured sympathy?

**CRITICAL CALIBRATION:**
- **The "Specificity Test":** Generic hardship ("I faced many challenges") CANNOT exceed Tier 2 (Score 6). Must be specific.
- **The "Agency Test":** Any victimhood tone ("I couldn't succeed because...") caps at Tier 1 (Score 3).
- **The "Privilege Test":** Zero awareness of advantages/context caps at Tier 1 (Score 3).
- **Resourcefulness:** "I worked hard" is NOT resourcefulness (Tier 2). "I hacked the system/found a workaround" IS resourcefulness (Tier 3+).

**Output Format:**
{
  "score": <number 0-10>,
  "quality_level": "<alchemist|navigator|survivor|victim_bystander>",
  "tier_evaluation": {
    "current_tier": "<victim_bystander|survivor|navigator|alchemist>",
    "next_tier": "<survivor|navigator|alchemist|max_tier>",
    "tier_reasoning": "<Succinct explanation of why it's in this tier>"
  },
  "reasoning": {
    "context_analysis": "<Analyze specific vs generic obstacles>",
    "action_analysis": "<Analyze endurance vs resourcefulness>",
    "impact_analysis": "<Analyze how context shaped the outcome>",
    "voice_analysis": "<Analyze authenticity and victimhood tone>"
  },
  "evidence_quotes": ["<quote 1>", "<quote 2>"],
  "evaluator_note": "<1 sentence summary>",
  "obstacles_constraints": {
    "present": <boolean>,
    "types": ["<financial|family|systemic|time|resources|health|immigration|language>"],
    "specificity": "<specific|mentioned|generic|absent>",
    "examples": ["<obstacle 1>"],
    "description": "<Description of constraints>"
  },
  "resourcefulness": {
    "present": <boolean>,
    "examples": ["<solution 1>"],
    "description": "<Description of solutions>"
  },
  "tone_assessment": {
    "victimhood": <boolean>,
    "agency": <boolean>,
    "privilege_awareness": <boolean>,
    "description": "<Tone analysis>"
  },
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "strategic_pivot": "<THE INVISIBLE CEILING: Identify the exact flaw keeping this essay in its current tier. Then prescribe the specific detail to break through. e.g., 'You say 'it was hard', which is Generic (Tier 2). To reach Navigator (Tier 3), you need to describe the SPECIFIC workaround you created when you couldn't afford the textbook.'>",

  "confidence": <number 0-1>
}

**CRITICAL:** All quotes must be exact.`;

  const userPrompt = `Analyze this essay for Context & Circumstances:

---

${essayText}

---

Provide your analysis as JSON following the exact format specified.`;

  try {
    const response = await callClaude<ContextCircumstancesAnalysis>(userPrompt, {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt,
      useJsonMode: true,
    });

    return response.content;

  } catch (error) {
    console.error('[Context Circumstances LLM Analyzer] API call failed, falling back to Heuristic Analysis:', error);
    
    const heuristic = analyzeContextHeuristic(essayText);

    return {
      score: heuristic.context_score,
      quality_level: mapHeuristicQuality(heuristic.context_quality),
      tier_evaluation: {
        current_tier: mapScoreToTier(heuristic.context_score),
        next_tier: 'navigator',
        tier_reasoning: 'Heuristic Analysis: Score based on detected obstacles, resourcefulness, and resilience patterns.'
      },
      reasoning: {
        context_analysis: heuristic.has_specific_obstacles ? `Obstacles: ${heuristic.obstacle_types.join(', ')}` : 'No specific obstacles detected.',
        action_analysis: heuristic.shows_resourcefulness ? 'Resourcefulness detected.' : 'No resourcefulness detected.',
        impact_analysis: heuristic.has_causal_connection ? 'Causal connection shown.' : 'No causal connection detected.',
        voice_analysis: heuristic.victimhood_tone ? 'Victimhood tone detected.' : 'Resilient tone.'
      },
      evidence_quotes: heuristic.obstacle_examples.concat(heuristic.resourcefulness_examples),
      evaluator_note: 'Heuristic fallback used due to LLM failure.',
      obstacles_constraints: { 
        present: heuristic.has_specific_obstacles, 
        types: heuristic.obstacle_types, 
        specificity: heuristic.has_specific_obstacles ? 'specific' : 'absent', 
        examples: heuristic.obstacle_examples, 
        description: 'Heuristic detection.' 
      },
      resourcefulness: { 
        present: heuristic.shows_resourcefulness, 
        examples: heuristic.resourcefulness_examples, 
        description: 'Heuristic detection.' 
      },
      tone_assessment: { 
        victimhood: heuristic.victimhood_tone, 
        agency: heuristic.shows_resilience, 
        privilege_awareness: false, 
        description: 'Heuristic detection.' 
      },
      strengths: heuristic.strengths,
      weaknesses: heuristic.weaknesses,
      strategic_pivot: heuristic.quick_wins[0] || 'Add specific context.',

      confidence: 0.5,
    };
  }
}

function mapHeuristicQuality(q: string): ContextCircumstancesAnalysis['quality_level'] {
  switch (q) {
    case 'resourceful_resilience': return 'alchemist';
    case 'strong_navigation': return 'navigator';
    case 'mixed_context': return 'survivor';
    default: return 'victim_bystander';
  }
}

function mapScoreToTier(score: number): ContextCircumstancesAnalysis['tier_evaluation']['current_tier'] {
  if (score >= 9) return 'alchemist';
  if (score >= 7) return 'navigator';
  if (score >= 4) return 'survivor';
  return 'victim_bystander';
}
