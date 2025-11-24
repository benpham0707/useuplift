/**
 * COMMUNITY IMPACT LLM ANALYZER
 *
 * Dimension: Community Impact (7% weight)
 *
 * Evaluates the tangible difference the student made:
 * - Did they identify a specific need and address it?
 * - Did they mobilize others or go it alone?
 * - Does the impact last beyond their presence?
 * - Who specifically benefited?
 *
 * Based on the v4 "Gold Standard" Architecture.
 */

import { callClaude } from '@/lib/llm/claude';

// ============================================================================
// TYPES
// ============================================================================

export interface CommunityImpactAnalysis {
  // Overall assessment
  score: number; // 0-10 (decimals allowed)
  quality_level: 'changemaker' | 'leader' | 'contributor' | 'participant';

  // Deep reasoning (v4 Architecture)
  reasoning: {
    need_identification: string; // Did they solve a real problem or just "volunteer"?
    beneficiary_analysis: string; // Who benefited? (Specific group vs "the community")
    scale_analysis: string; // Individual effort vs mobilized group vs systemic change
    longevity_analysis: string; // Does the impact last?
  };

  // Tier Evaluation (v4 Architecture)
  tier_evaluation: {
    current_tier: 'participant' | 'contributor' | 'leader' | 'changemaker';
    next_tier: 'contributor' | 'leader' | 'changemaker' | 'max_tier';
    tier_reasoning: string;
  };

  // Evidence
  evidence_quotes: string[]; // Direct quotes
  evaluator_note: string; // 1-2 sentence explanation

  // Detailed analysis
  impact_scope: {
    type: 'systemic' | 'group' | 'individual' | 'unclear';
    description: string;
  };
  beneficiary_clarity: {
    specific: boolean; // True if "5th graders with dyslexia", False if "the community"
    identified_group: string;
  };
  sustainability: {
    lasting: boolean; // True if impact outlasts student
    mechanism: string; // e.g., "New curriculum adopted", "Club constitution"
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

const COMMUNITY_IMPACT_CONFIG = {
  name: 'community_impact',
  display_name: 'Community Impact',
  weight: 0.07,
  definition: 'Did the student make a tangible difference? Did they identify a specific need and address it? Does the impact last?',

  // Tiers from PHASE_3_LLM_ANALYZER_ARCHITECTURE.md
  tiers: {
    1: {
      name: 'Participant',
      score_range: '0-3',
      description: '"I volunteered." Passive participation. Hours logged. No specific beneficiary named. "I volunteered at the library."',
    },
    2: {
      name: 'Contributor',
      score_range: '4-6',
      description: '"I helped X group." Direct service. Clear beneficiary. Immediate but limited impact. "I tutored 5 students."',
    },
    3: {
      name: 'Leader',
      score_range: '7-8',
      description: '"I organized Y project." Scale. Mobilized others. Impact measured or clearly described. "I organized a book drive collecting 500 books."',
    },
    4: {
      name: 'Changemaker',
      score_range: '9-10',
      description: '"I changed the system." Legacy. Solved a root cause. Impact outlasts their presence. "I created a peer-tutoring system that the school adopted permanently."',
    },
  },

  evaluator_prompts: [
    'Who specifically benefited from this work?',
    'Did the student just show up, or did they create/lead something?',
    'Is the impact measured (numbers) or described (stories)?',
    'Did they address a root cause or just a symptom?',
    'Will this initiative continue after the student graduates?',
    'Did they mobilize others to help?',
  ],

  warning_signs: [
    'Focusing on hours served rather than outcomes',
    'Vague "helping the community" statements',
    '"Voluntourism" (brief, superficial trips)',
    'Lack of interaction with the people served',
    'Savior complex ("I saved them")',
    'No clear beneficiary identified',
  ],
};

// ============================================================================
// LLM ANALYZER
// ============================================================================

/**
 * Analyze Community Impact using LLM semantic understanding
 */
export async function analyzeCommunityImpact(essayText: string): Promise<CommunityImpactAnalysis> {
  const config = COMMUNITY_IMPACT_CONFIG;

  const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Community Impact.

**Definition:** ${config.definition}

**Goal:** Determine if the student is a Participant, Contributor, Leader, or Changemaker.

**Scoring Tiers (The Ladder of Impact):**
1. **Tier 1: Participant (0-3)** - "I volunteered." Passive participation. Hours logged. No specific beneficiary named. "I volunteered at the library." Focus is on *attendance*.
2. **Tier 2: Contributor (4-6)** - "I helped X group." Direct service. Clear beneficiary. Immediate but limited impact. "I tutored 5 students." Focus is on *effort*.
3. **Tier 3: Leader (7-8)** - "I organized Y project." Scale. Mobilized others. Impact measured or clearly described. "I organized a book drive collecting 500 books." Focus is on *outcome*.
4. **Tier 4: Changemaker (9-10)** - "I changed the system." Legacy. Solved a root cause. Impact outlasts their presence. "I created a peer-tutoring system that the school adopted permanently." Focus is on *legacy*.

**Diagnostic Prompts (Reasoning Engine):**
1. **Scope:** Is it individual effort (Tiers 1-2) or mobilized group (Tier 3+)?
2. **Beneficiary:** Is it "the community" (Vague) or "5th graders with dyslexia" (Specific)?
3. **Sustainability:** Does the work end when the student leaves, or is there a system in place?
4. **Initiative:** Did they join an existing program (Participant/Contributor) or build something new (Leader/Changemaker)?

**CRITICAL CALIBRATION:**
- **The "Hours Trap":** "I did 100 hours of service" is Tier 1/2 unless outcomes are shown.
- **The "Founder Trap":** Founding a club that does nothing is Tier 2. Founding a club that solves a problem is Tier 3+.
- **The "Legacy Test":** If they leave tomorrow, does the impact disappear? If yes, cap at Tier 3.
- **The "Savior Complex":** Penalize language that implies superiority over those served.

**Output Format:**
{
  "score": <number 0-10>,
  "quality_level": "<changemaker|leader|contributor|participant>",
  "tier_evaluation": {
    "current_tier": "<participant|contributor|leader|changemaker>",
    "next_tier": "<contributor|leader|changemaker|max_tier>",
    "tier_reasoning": "<Succinct explanation of why it's in this tier>"
  },
  "reasoning": {
    "need_identification": "<Did they find a real need?>",
    "beneficiary_analysis": "<Who benefited?>",
    "scale_analysis": "<Individual vs Systemic>",
    "longevity_analysis": "<Does it last?>"
  },
  "evidence_quotes": ["<quote 1>", "<quote 2>"],
  "evaluator_note": "<1 sentence summary>",
  "impact_scope": {
    "type": "<systemic|group|individual|unclear>",
    "description": "<Description of scope>"
  },
  "beneficiary_clarity": {
    "specific": <boolean>,
    "identified_group": "<group name>",
  },
  "sustainability": {
    "lasting": <boolean>,
    "mechanism": "<mechanism string or 'none'>"
  },
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "strategic_pivot": "<THE INVISIBLE CEILING: Identify the exact flaw keeping this essay in its current tier. Then prescribe the specific action/detail to break through. e.g., 'You describe tutoring individual students (Contributor/Tier 2). To reach Leader (Tier 3), describe how you recruited other tutors or created a curriculum guide that others now use.'>",

  "confidence": <number 0-1>
}

**CRITICAL:** All quotes must be exact.`;

  const userPrompt = `Analyze this essay for Community Impact:

---

${essayText}

---

Provide your analysis as JSON following the exact format specified.`;

  try {
    const response = await callClaude<CommunityImpactAnalysis>(userPrompt, {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt,
      useJsonMode: true,
    });

    return response.content;

  } catch (error) {
    console.error('[Community Impact LLM Analyzer] API call failed:', error);
    return {
      score: 0,
      quality_level: 'participant',
      tier_evaluation: {
        current_tier: 'participant',
        next_tier: 'contributor',
        tier_reasoning: 'Analysis failed',
      },
      reasoning: {
        need_identification: 'Analysis failed',
        beneficiary_analysis: 'Analysis failed',
        scale_analysis: 'Analysis failed',
        longevity_analysis: 'Analysis failed',
      },
      evidence_quotes: [],
      evaluator_note: 'Error: Unable to analyze essay due to API failure',
      impact_scope: { type: 'unclear', description: 'Analysis failed' },
      beneficiary_clarity: { specific: false, identified_group: 'None' },
      sustainability: { lasting: false, mechanism: 'none' },
      strengths: [],
      weaknesses: ['Unable to analyze due to technical error'],
      strategic_pivot: 'Analysis failed',

      confidence: 0,
    };
  }
}

