/**
 * INTELLECTUAL VITALITY LLM ANALYZER
 *
 * Dimension: Intellectual Vitality (8% weight)
 *
 * Evaluates the depth of intellectual curiosity, self-directed learning,
 * and engagement with ideas beyond the classroom.
 *
 * - Does the student "geek out" about ideas?
 * - Is learning self-directed or assigned?
 * - Do they ask questions or just answer them?
 * - Are they consumers of knowledge or producers?
 *
 * Based on the v4 "Gold Standard" Architecture and the 5-Level Intellectual Depth Pyramid.
 */

import { callClaude } from '@/lib/llm/claude';

// ============================================================================
// TYPES
// ============================================================================

export interface IntellectualVitalityAnalysis {
  // Overall assessment
  score: number; // 0-10 (decimals allowed)
  quality_level: 'scholar' | 'explorer' | 'learner' | 'student';

  // Deep reasoning (v4 Architecture)
  reasoning: {
    curiosity_analysis: string; // Is curiosity active (self-directed) or passive (assigned)?
    depth_analysis: string; // Does it go beyond the syllabus?
    synthesis_analysis: string; // Does it connect ideas across fields?
    vitality_signals: string; // Specific evidence of "geeking out"
  };

  // Tier Evaluation (v4 Architecture)
  tier_evaluation: {
    current_tier: 'student' | 'learner' | 'explorer' | 'scholar';
    next_tier: 'learner' | 'explorer' | 'scholar' | 'max_tier';
    tier_reasoning: string;
  };

  // Evidence
  evidence_quotes: string[]; // Direct quotes
  evaluator_note: string; // 1-2 sentence explanation

  // Detailed analysis
  curiosity_type: {
    type: 'active' | 'passive' | 'absent';
    examples: string[];
    description: string;
  };
  self_directed_learning: {
    present: boolean;
    examples: string[]; // e.g., "Read 20 papers", "Built a reactor"
    description: string;
  };
  intellectual_depth: {
    level: 'high' | 'moderate' | 'low'; // Corresponds to Depth Pyramid levels
    concepts_cited: string[]; // Specific theories, authors, concepts
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

const INTELLECTUAL_VITALITY_CONFIG = {
  name: 'intellectual_vitality',
  display_name: 'Intellectual Vitality',
  weight: 0.08,
  definition: 'Does the student demonstrate curiosity beyond the classroom? Do they "geek out" about ideas? Is learning self-directed or assigned?',

  // Tiers from PHASE_3_LLM_ANALYZER_ARCHITECTURE.md
  tiers: {
    1: {
      name: 'Student',
      score_range: '0-3',
      description: '"I get good grades." Passive learner. Only does what is assigned. "I took AP Bio."',
    },
    2: {
      name: 'Learner',
      score_range: '4-6',
      description: '"I joined the club." Participates in structured learning. "I went to Math Camp."',
    },
    3: {
      name: 'Explorer',
      score_range: '7-8',
      description: '"I went down the rabbit hole." Independent research, side projects, reading beyond the syllabus. "I read 20 papers on X."',
    },
    4: {
      name: 'Scholar',
      score_range: '9-10',
      description: '"I contributed to knowledge." Original synthesis, novel application, or deep expertise. "I combined X and Y to build Z."',
    },
  },

  evaluator_prompts: [
    'Does the student ask questions or just answer them?',
    'Is the learning self-directed (books, side projects) or assigned (homework, grades)?',
    'Does the student mention specific theories, concepts, or authors?',
    'Is there evidence of "going down the rabbit hole" on a topic?',
    'Does the student synthesize ideas from different fields?',
    'Is the tone one of genuine curiosity ("geeking out") or resume padding?',
  ],

  warning_signs: [
    'Citing grades/AP scores as proof of curiosity',
    '"I love learning" (telling not showing)',
    'Only listing school-sponsored activities',
    'Lack of specific books, theories, or concepts',
    'Transactional learning (learning for the test)',
    'Vague "passion" without depth',
  ],
};

// ============================================================================
// LLM ANALYZER
// ============================================================================

/**
 * Analyze Intellectual Vitality using LLM semantic understanding
 */
export async function analyzeIntellectualVitality(essayText: string): Promise<IntellectualVitalityAnalysis> {
  const config = INTELLECTUAL_VITALITY_CONFIG;

  const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Intellectual Vitality.

**Definition:** ${config.definition}

**Goal:** Determine if the student is a Student, Learner, Explorer, or Scholar.

**Scoring Tiers (The Ladder of Vitality):**
1. **Tier 1: Student (0-3)** - "I get good grades." Passive learner. Only does what is assigned. Cites AP scores/GPA as proof of intellect. "I took AP Bio and got an A."
2. **Tier 2: Learner (4-6)** - "I joined the club." Participates in structured learning activities (camps, clubs, competitions). "I went to Math Camp to learn more."
3. **Tier 3: Explorer (7-8)** - "I went down the rabbit hole." Independent research, side projects, reading beyond the syllabus. Self-directed. "I read 20 papers on X because I was curious."
4. **Tier 4: Scholar (9-10)** - "I contributed to knowledge." Original synthesis, novel application, or deep expertise. Cross-disciplinary thinking. "I combined game theory and psychology to analyze X."

**Diagnostic Prompts (Reasoning Engine):**
1. **Curiosity Source:** Is it external (assigned/required) or internal (self-directed)?
2. **Depth of Engagement:** Does it stop at the "what" or go to the "why" and "how"?
3. **Specifics:** Does the student name specific theories, concepts, authors, or problems?
4. **Synthesis:** Does the student connect disparate ideas?

**CRITICAL CALIBRATION:**
- **The "Grade Trap":** Mentioning grades/scores is neutral, but relying on them as the ONLY proof of curiosity = Tier 1.
- **The "Club Trap":** Membership is Tier 2. Leading a workshop on a specific niche topic is Tier 3.
- **The "Rabbit Hole":** Evidence of getting "lost" in a topic is the key to Tier 3.
- **The "Scholar":** Must show original thought or synthesis, not just consumption of information.

**Output Format:**
{
  "score": <number 0-10>,
  "quality_level": "<scholar|explorer|learner|student>",
  "tier_evaluation": {
    "current_tier": "<student|learner|explorer|scholar>",
    "next_tier": "<learner|explorer|scholar|max_tier>",
    "tier_reasoning": "<Succinct explanation of why it's in this tier>"
  },
  "reasoning": {
    "curiosity_analysis": "<Active vs passive curiosity>",
    "depth_analysis": "<Depth of engagement>",
    "synthesis_analysis": "<Connections made>",
    "vitality_signals": "<Specific evidence>"
  },
  "evidence_quotes": ["<quote 1>", "<quote 2>"],
  "evaluator_note": "<1 sentence summary>",
  "curiosity_type": {
    "type": "<active|passive|absent>",
    "examples": ["<example 1>"],
    "description": "<Description of curiosity>"
  },
  "self_directed_learning": {
    "present": <boolean>,
    "examples": ["<example 1>"],
    "description": "<Description of self-directed work>"
  },
  "intellectual_depth": {
    "level": "<high|moderate|low>",
    "concepts_cited": ["<concept 1>"],
    "description": "<Description of depth>"
  },
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "strategic_pivot": "<THE INVISIBLE CEILING: Identify the exact flaw keeping this essay in its current tier. Then prescribe the specific action/detail to break through. e.g., 'You mention attending a coding camp (Learner/Tier 2). To reach Explorer (Tier 3), describe the specific SIDE PROJECT you built afterwards because you couldn't stop thinking about the problem.'>",
  "confidence": <number 0-1>
}

**CRITICAL:** All quotes must be exact.`;

  const userPrompt = `Analyze this essay for Intellectual Vitality:

---

${essayText}

---

Provide your analysis as JSON following the exact format specified.`;

  try {
    const response = await callClaude<IntellectualVitalityAnalysis>(userPrompt, {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt,
      useJsonMode: true,
    });

    return response.content;

  } catch (error) {
    console.error('[Intellectual Vitality LLM Analyzer] API call failed:', error);
    return {
      score: 0,
      quality_level: 'student',
      tier_evaluation: {
        current_tier: 'student',
        next_tier: 'learner',
        tier_reasoning: 'Analysis failed',
      },
      reasoning: {
        curiosity_analysis: 'Analysis failed',
        depth_analysis: 'Analysis failed',
        synthesis_analysis: 'Analysis failed',
        vitality_signals: 'Analysis failed',
      },
      evidence_quotes: [],
      evaluator_note: 'Error: Unable to analyze essay due to API failure',
      curiosity_type: { type: 'absent', examples: [], description: 'Analysis failed' },
      self_directed_learning: { present: false, examples: [], description: 'Analysis failed' },
      intellectual_depth: { level: 'low', concepts_cited: [], description: 'Analysis failed' },
      strengths: [],
      weaknesses: ['Unable to analyze due to technical error'],
      strategic_pivot: 'Analysis failed',
      confidence: 0,
    };
  }
}

