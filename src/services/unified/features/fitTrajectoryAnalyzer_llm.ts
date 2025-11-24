/**
 * FIT & TRAJECTORY LLM ANALYZER
 *
 * Dimension: Fit & Trajectory (Why Major?) (6% weight)
 *
 * Evaluates the alignment between the student's stated goals/major
 * and their actual activities/intellectual vitality.
 *
 * - Does the student have a clear "North Star"?
 * - Do their activities align with their stated goals?
 * - Is the "Why Major" argument convincing and evidence-based?
 *
 * Based on the v4 "Gold Standard" Architecture.
 */

import { callClaude } from '@/lib/llm/claude';
import { analyzeFitTrajectory as analyzeFitHeuristic } from './fitTrajectoryAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export interface FitTrajectoryAnalysis {
  // Overall assessment
  score: number; // 0-10 (decimals allowed)
  quality_level: 'alignment' | 'pursuit' | 'interest' | 'disconnect';

  // Deep reasoning (v4 Architecture)
  reasoning: {
    goal_analysis: string; // Is the goal specific ("Neuroscience") or vague ("Help people")?
    alignment_analysis: string; // Do activities match the goal?
    vitality_analysis: string; // Is there evidence of self-directed learning/curiosity?
    trajectory_analysis: string; // Is there a logical past -> present -> future arc?
  };

  // Tier Evaluation (v4 Architecture)
  tier_evaluation: {
    current_tier: 'disconnect' | 'interest' | 'pursuit' | 'alignment';
    next_tier: 'interest' | 'pursuit' | 'alignment' | 'max_tier';
    tier_reasoning: string;
  };

  // Evidence
  evidence_quotes: string[]; // Direct quotes
  evaluator_note: string; // 1-2 sentence explanation

  // Detailed analysis
  major_goal: {
    identified: boolean;
    specificity: 'specific' | 'broad' | 'vague' | 'absent';
    topic: string; // e.g., "Computer Science", "Medicine"
    description: string;
  };
  activity_alignment: {
    aligned: boolean;
    strength: 'strong' | 'moderate' | 'weak' | 'none';
    examples: string[];
    description: string;
  };
  intellectual_vitality: {
    present: boolean;
    level: 'high' | 'moderate' | 'low' | 'none';
    examples: string[]; // e.g., "Self-taught Python", "Read research papers"
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

const FIT_TRAJECTORY_CONFIG = {
  name: 'fit_trajectory',
  display_name: 'Fit & Trajectory',
  weight: 0.06,
  definition: 'Does the student have a clear "North Star"? Do their activities align with their stated goals? Is the "Why Major" argument convincing?',

  // Tiers from PHASE_3_LLM_ANALYZER_ARCHITECTURE.md
  tiers: {
    1: {
      name: 'Disconnect',
      score_range: '0-3',
      description: 'Stated goal has zero relation to activities. "I want to be a doctor" but only does Debate. Or generic "I want to help people".',
    },
    2: {
      name: 'Interest',
      score_range: '4-6',
      description: '"I like X". Participation in clubs. Surface-level engagement. "I joined the Coding Club."',
    },
    3: {
      name: 'Pursuit',
      score_range: '7-8',
      description: '"I explore X". Independent projects, depth, self-study. Goes beyond school curriculum. "I built a Python app."',
    },
    4: {
      name: 'Alignment',
      score_range: '9-10',
      description: '"I am X". Intellectual vitality. Activities prove the passion. Clear trajectory from past → present → future. "I identified a gap in X, built Y, and now research Z."',
    },
  },

  evaluator_prompts: [
    'What is the student\'s stated major or goal?',
    'Do the activities listed actually support this goal?',
    'Is the interest passive (joining a club) or active (building/creating)?',
    'Is there evidence of "Intellectual Vitality" (learning outside class)?',
    'Does the student treat the major as a checklist (Pre-med) or a passion?',
    'Is the trajectory logical (Experience A led to Interest B)?',
  ],

  warning_signs: [
    '"I want to help people" (too vague)',
    'Listing unrelated activities to look "well-rounded"',
    'No intellectual curiosity shown outside of class',
    '"Pre-med" syndrome (doing it for the status, not the science)',
    'Using "passion" without evidence',
    'Disconnect between "what I did" and "what I want to do"',
  ],
};

// ============================================================================
// LLM ANALYZER
// ============================================================================

/**
 * Analyze Fit & Trajectory using LLM semantic understanding
 */
export async function analyzeFitTrajectory(essayText: string, intendedMajor?: string): Promise<FitTrajectoryAnalysis> {
  const config = FIT_TRAJECTORY_CONFIG;

  // Optional: Inject the intended major from the profile if available
  const majorContext = intendedMajor 
    ? `\n**CONTEXT FROM PROFILE:** The student's intended major is **"${intendedMajor}"**. \nCritically evaluate if the essay supports THIS specific major. If the essay talks about a different field without connecting it, penalize for Disconnect.`
    : '';

  const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Fit & Trajectory (Why Major?).

**Definition:** ${config.definition}

**Goal:** Determine if the student is Disconnected, Interested, Pursuing, or Aligned.

**Scoring Tiers (The Ladder of Fit):**
1. **Tier 1: Disconnect (0-3)** - Stated goal has zero relation to activities. "I want to be a doctor" but only does Debate. Or generic "I want to help people" with no specifics.
2. **Tier 2: Interest (4-6)** - "I like X". Participation in clubs. Surface-level engagement. "I joined the Coding Club." Passive consumption of interest.
3. **Tier 3: Pursuit (7-8)** - "I explore X". Independent projects, depth, self-study. Goes beyond school curriculum. "I built a Python app." Active exploration.
4. **Tier 4: Alignment (9-10)** - "I am X". Intellectual vitality. Activities prove the passion. Clear trajectory from past → present → future. "I identified a gap in X, built Y, and now research Z."

**Diagnostic Prompts (Reasoning Engine):**
1. **Goal Specificity:** Is it "Science" (Vague) or "Computational Biology" (Specific)?
2. **Activity Alignment:** Do they just say they like it, or do they DO it?
3. **Intellectual Vitality:** Did they learn something they weren't assigned? (Books, side projects, research).
4. **Trajectory Logic:** Does the story flow logically? (Curiosity -> Action -> Deepening Interest).

**CRITICAL CALIBRATION:**
- **The "Pre-Med Check":** If they say "I want to be a doctor" but show NO shadowing/bio/chem outside class, cap at Tier 1.
- **The "Club vs Creator":** Joining a club = Tier 2. Founding a club = Tier 2 (unless impactful). Creating a project/research = Tier 3+.
- **The "Vague Altruism":** "I want to help people" is NOT a major. It's a Tier 1 goal unless grounded in specific skills (e.g., "Help people through Policy").${majorContext ? '\n- **The "Major Check":** ' + majorContext : ''}

**Output Format:**
{
  "score": <number 0-10>,
  "quality_level": "<alignment|pursuit|interest|disconnect>",
  "tier_evaluation": {
    "current_tier": "<disconnect|interest|pursuit|alignment>",
    "next_tier": "<interest|pursuit|alignment|max_tier>",
    "tier_reasoning": "<Succinct explanation of why it's in this tier>"
  },
  "reasoning": {
    "goal_analysis": "<Is the goal specific or vague?>",
    "alignment_analysis": "<Do activities match the goal?>",
    "vitality_analysis": "<Evidence of self-directed learning?>",
    "trajectory_analysis": "<Is the arc logical?>"
  },
  "evidence_quotes": ["<quote 1>", "<quote 2>"],
  "evaluator_note": "<1 sentence summary>",
  "major_goal": {
    "identified": <boolean>,
    "specificity": "<specific|broad|vague|absent>",
    "topic": "<topic string>",
    "description": "<Description of goal>"
  },
  "activity_alignment": {
    "aligned": <boolean>,
    "strength": "<strong|moderate|weak|none>",
    "examples": ["<activity 1>"],
    "description": "<How activities match>"
  },
  "intellectual_vitality": {
    "present": <boolean>,
    "level": "<high|moderate|low|none>",
    "examples": ["<example 1>"],
    "description": "<Evidence of curiosity>"
  },
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "strategic_pivot": "<THE INVISIBLE CEILING: Identify the exact flaw keeping this essay in its current tier. Then prescribe the specific action/detail to break through. e.g., 'You mention joining the Coding Club (Interest/Tier 2), but don't show independent work. To reach Pursuit (Tier 3), describe the specific SIDE PROJECT you built outside of club hours.'>",
  "confidence": <number 0-1>
}

**CRITICAL:** All quotes must be exact.`;

  const userPrompt = `Analyze this essay for Fit & Trajectory:

---

${essayText}

---

Provide your analysis as JSON following the exact format specified.`;

  try {
    const response = await callClaude<FitTrajectoryAnalysis>(userPrompt, {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt,
      useJsonMode: true,
    });

    return response.content;

  } catch (error) {
    console.error('[Fit & Trajectory LLM Analyzer] API call failed, falling back to Heuristic Analysis:', error);
    
    const heuristic = analyzeFitHeuristic(essayText);

    return {
      score: heuristic.fit_score,
      quality_level: mapHeuristicQuality(heuristic.fit_quality),
      tier_evaluation: {
        current_tier: mapScoreToTier(heuristic.fit_score),
        next_tier: 'pursuit',
        tier_reasoning: 'Heuristic Analysis: Score based on future connection, trajectory clarity, and continued commitment.'
      },
      reasoning: {
        goal_analysis: heuristic.has_future_connection ? `Goal: ${heuristic.future_connection_type.join(', ')}` : 'No clear goal.',
        alignment_analysis: heuristic.shows_continued_commitment ? 'Continued commitment shown.' : 'No alignment evidence.',
        vitality_analysis: 'Heuristic analysis cannot determine intellectual vitality depth.',
        trajectory_analysis: heuristic.has_logical_trajectory ? `Trajectory strength: ${heuristic.trajectory_strength}` : 'No trajectory.'
      },
      evidence_quotes: heuristic.future_connection_examples.concat(heuristic.trajectory_examples),
      evaluator_note: 'Heuristic fallback used due to LLM failure.',
      major_goal: { 
        identified: heuristic.has_future_connection, 
        specificity: heuristic.has_future_connection ? 'specific' : 'absent', 
        topic: heuristic.future_connection_type.join(', '), 
        description: 'Heuristic detection.' 
      },
      activity_alignment: { 
        aligned: heuristic.shows_continued_commitment, 
        strength: heuristic.shows_continued_commitment ? 'moderate' : 'none', 
        examples: heuristic.commitment_examples, 
        description: 'Heuristic detection.' 
      },
      intellectual_vitality: { 
        present: false, 
        level: 'none', 
        examples: [], 
        description: 'Not analyzed by heuristic.' 
      },
      strengths: heuristic.strengths,
      weaknesses: heuristic.weaknesses,
      strategic_pivot: heuristic.quick_wins[0] || 'Connect experience to future goals.',
      confidence: 0.5,
    };
  }
}

function mapHeuristicQuality(q: string): FitTrajectoryAnalysis['quality_level'] {
  switch (q) {
    case 'clear_trajectory': return 'alignment';
    case 'strong_connection': return 'pursuit';
    case 'some_connection': return 'interest';
    default: return 'disconnect';
  }
}

function mapScoreToTier(score: number): FitTrajectoryAnalysis['tier_evaluation']['current_tier'] {
  if (score >= 9) return 'alignment';
  if (score >= 7) return 'pursuit';
  if (score >= 4) return 'interest';
  return 'disconnect';
}
