/**
 * VOICE & WRITING STYLE LLM ANALYZER
 *
 * Dimension: Voice & Writing Style (6% weight)
 *
 * Evaluates narrative authenticity and writing quality:
 * - Does this sound like a real person who lived the experience?
 * - Voice integrity: honesty, specificity of perspective, natural cadence
 * - Absence of essay-speak, AI-ish phrasing, corporate jargon
 * - Warmth and clarity over grandiosity
 *
 * Based on the v4 "Gold Standard" Architecture.
 */

import { callClaude } from '@/lib/llm/claude';
import { analyzeVoiceStyle as analyzeVoiceStyleHeuristic } from './voiceStyleAnalyzer';
import { analyzeVoiceStyle as analyzeVoiceStyleHeuristic } from './voiceStyleAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceStyleAnalysis {
  // Overall assessment
  score: number; // 0-10 (decimals allowed)
  quality_level: 'distinctive_voice' | 'authentic_voice' | 'some_personality' | 'flat_correct' | 'essay_speak' | 'ai_generated';

  // Deep reasoning (v4 Architecture)
  reasoning: {
    voice_authenticity: string; // Can I pick this person out of a lineup?
    sentence_cadence: string; // Spoken vs Performed rhythm
    perspective_specificity: string; // Unique lens?
    essay_speak_analysis: string; // Jargon/AI detection
  };

  // Tier Evaluation (v4 Architecture)
  tier_evaluation: {
    current_tier: 'ai_template' | 'resume_prose' | 'emerging_voice' | 'authentic' | 'distinctive';
    next_tier: 'resume_prose' | 'emerging_voice' | 'authentic' | 'distinctive' | 'max_tier';
    tier_reasoning: string;
  };

  // Evidence
  evidence_quotes: string[]; // Direct quotes
  evaluator_note: string; // 1-2 sentence explanation

  // Detailed analysis
  authentic_signals: {
    present: boolean;
    examples: string[];
    description: string;
  };
  manufactured_signals: {
    present: boolean;
    examples: string[]; // Essay-speak, AI phrases
    description: string;
  };
  sensory_details: {
    present: boolean;
    examples: string[];
    description: string;
  };
  distinctive_phrases: {
    present: boolean;
    examples: string[];
    description: string;
  };

  // Guidance
  strengths: string[];
  weaknesses: string[];
  strategic_pivot: string; // (v4) High-level strategy

  // Metadata
  confidence: number; // 0-1
}

// ============================================================================
// DIMENSION CONFIGURATION
// ============================================================================

const VOICE_STYLE_CONFIG = {
  name: 'voice_style',
  display_name: 'Voice & Writing Style',
  weight: 0.06,
  definition: 'Does this sound like a real person? Voice integrity captures honesty, specificity of perspective, and a natural cadence (not corporate or AI-ish).',

  tiers: {
    1: {
      name: 'AI/Template',
      score_range: '0-2',
      description: 'Reads like ChatGPT. "I have always been passionate about X." Zero personality. Flawless but dead.',
    },
    2: {
      name: 'Resume Prose',
      score_range: '3-4',
      description: 'Functional but soulless. "I organized events." Grammatically correct, emotionally flat.',
    },
    3: {
      name: 'Emerging Voice',
      score_range: '5-6',
      description: 'Personality glimpses through formal writing. Some authentic moments mixed with essay-speak. "I learned that..."',
    },
    4: {
      name: 'Authentic',
      score_range: '7-8',
      description: 'Sounds like a specific person. Natural cadence. Avoids essay-speak. "The dishwasher sounded like a jet engine."',
    },
    5: {
      name: 'Distinctive',
      score_range: '9-10',
      description: 'Unmistakable voice. Literary craft. Unique lens. "Most Wednesdays smelled like bleach and citrus."',
    },
  },

  evaluator_prompts: [
    'Could I pick this student\'s voice out of a pile?',
    'Do sentences feel said, not performed?',
    'Is there specificity of perspective that feels authentic?',
    'Does the essay avoid sounding like it was written to impress?',
  ],

  warning_signs: [
    '"passionate about"',
    '"thrilled to"',
    '"leveraged synergies"',
    '"this taught me that..."',
    '"upon reflection"',
    'AI-like phrasing',
  ],
};

// ============================================================================
// LLM ANALYZER
// ============================================================================

export async function analyzeVoiceStyle(essayText: string): Promise<VoiceStyleAnalysis> {
  const config = VOICE_STYLE_CONFIG;

  const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Voice & Writing Style.

**Definition:** ${config.definition}

**Goal:** Distinguish between Real Humans (Authentic) and AI/Templates (Robotic).

**Scoring Tiers (The Ladder of Voice):**
1. **Tier 1: AI/Template (0-2)** - Reads like ChatGPT. "I have always been passionate." Zero personality.
2. **Tier 2: Resume Prose (3-4)** - Functional but soulless. "I organized events." Safe, dry, boring.
3. **Tier 3: Emerging Voice (5-6)** - Personality glimpses. Authentic moments mixed with "essay-speak" ("Through this experience I learned...").
4. **Tier 4: Authentic (7-8)** - Sounds like a specific human. Natural cadence. "The dishwasher sounded like a jet engine."
5. **Tier 5: Distinctive (9-10)** - Unmistakable voice. Literary craft. Unique lens. "Most Wednesdays smelled like bleach and citrus."

**Diagnostic Prompts (Reasoning Engine):**
1. **The "Lunch Test":** Would they say this to a friend at lunch? If not, it's likely Tier 1-3.
2. **The "Swap Test":** Could you paste this into another student's essay? If yes, it's generic.
3. **Sensory Check:** Are there smells, sounds, textures? (Markers of authenticity).
4. **Essay-Speak:** Count phrases like "passionate about", "thrilled to", "upon reflection".

**CRITICAL CALIBRATION:**
- **No Penalty for Informal:** "I messed up" is better than "Mistakes were made."
- **Penalize "Fancy":** Big words used incorrectly ("I utilized my cognition") = Tier 2.
- **Reward Specificity:** "Bleach and citrus" > "Cleaning supplies".

**Output Format:**
{
  "score": <number 0-10>,
  "quality_level": "<distinctive_voice|authentic_voice|some_personality|flat_correct|essay_speak|ai_generated>",
  "tier_evaluation": {
    "current_tier": "<ai_template|resume_prose|emerging_voice|authentic|distinctive>",
    "next_tier": "<resume_prose|emerging_voice|authentic|distinctive|max_tier>",
    "tier_reasoning": "<Succinct explanation of why it's in this tier>"
  },
  "reasoning": {
    "voice_authenticity": "<Could I pick this student out of a lineup?>",
    "sentence_cadence": "<Spoken vs Performed rhythm>",
    "perspective_specificity": "<Unique lens analysis>",
    "essay_speak_analysis": "<Jargon/AI detection>"
  },
  "evidence_quotes": ["<quote 1>", "<quote 2>"],
  "evaluator_note": "<1 sentence summary>",
  "authentic_signals": { "present": <boolean>, "examples": ["<string>"], "description": "<string>" },
  "manufactured_signals": { "present": <boolean>, "examples": ["<string>"], "description": "<string>" },
  "sensory_details": { "present": <boolean>, "examples": ["<string>"], "description": "<string>" },
  "distinctive_phrases": { "present": <boolean>, "examples": ["<string>"], "description": "<string>" },
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "strategic_pivot": "<THE INVISIBLE CEILING: Identify the exact flaw. Prescribe the specific fix. e.g., 'You rely on 'essay-speak' like 'this taught me' (Emerging/Tier 3). To reach Authentic (Tier 4), cut the reflection sentence and instead describe the specific moment you changed your mind.'>",
  "confidence": <number 0-1>
}`;

  const userPrompt = `Analyze this essay for Voice & Writing Style:

---

${essayText}

---

Provide your analysis as JSON following the exact format specified.`;

  try {
    const response = await callClaude<VoiceStyleAnalysis>(userPrompt, {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt,
      useJsonMode: true,
    });

    return response.content;

  } catch (error) {
    console.error('[Voice Style LLM Analyzer] API call failed, falling back to Heuristic Analysis:', error);
    
    // Fallback to Heuristic Analyzer
    const heuristic = analyzeVoiceStyleHeuristic(essayText);
    
    return {
      score: heuristic.voice_score,
      quality_level: mapHeuristicQuality(heuristic.voice_quality),
      tier_evaluation: {
        current_tier: mapScoreToTier(heuristic.voice_score),
        next_tier: 'authentic',
        tier_reasoning: 'Heuristic Analysis: Score based on active voice ratio, essay-speak patterns, and sentence variety.'
      },
      reasoning: {
        voice_authenticity: `Detected ${(heuristic.active_ratio * 100).toFixed(0)}% active voice and ${heuristic.conversational_count} conversational markers.`,
        sentence_cadence: heuristic.has_rhythm_variety ? 'Good sentence variety.' : 'Monotonous sentence structure.',
        perspective_specificity: 'Heuristic analysis cannot determine specificity depth.',
        essay_speak_analysis: `Detected ${heuristic.essay_speak_count} instances of essay-speak.`
      },
      evidence_quotes: heuristic.essay_speak_examples.concat(heuristic.active_examples.slice(0, 2)),
      evaluator_note: 'Heuristic fallback used due to LLM failure.',
      authentic_signals: { 
        present: heuristic.conversational_count > 0, 
        examples: heuristic.conversational_examples, 
        description: 'Conversational markers detected.' 
      },
      manufactured_signals: { 
        present: heuristic.essay_speak_count > 0, 
        examples: heuristic.essay_speak_examples, 
        description: 'Essay-speak phrases detected.' 
      },
      sensory_details: { present: false, examples: [], description: 'Not analyzed by heuristic.' },
      distinctive_phrases: { present: false, examples: [], description: 'Not analyzed by heuristic.' },
      strengths: heuristic.strengths,
      weaknesses: heuristic.weaknesses,
      strategic_pivot: heuristic.quick_wins[0] || 'Review voice for authenticity.',
      confidence: 0.5, // Lower confidence for heuristic
    };
  }
}

function mapHeuristicQuality(q: string): VoiceStyleAnalysis['quality_level'] {
  switch (q) {
    case 'authentic_distinctive': return 'distinctive_voice';
    case 'strong_voice': return 'authentic_voice';
    case 'mixed_voice': return 'some_personality';
    case 'generic_essay': return 'essay_speak';
    default: return 'ai_generated';
  }
}

function mapScoreToTier(score: number): VoiceStyleAnalysis['tier_evaluation']['current_tier'] {
  if (score >= 9) return 'distinctive';
  if (score >= 7) return 'authentic';
  if (score >= 5) return 'emerging_voice';
  if (score >= 3) return 'resume_prose';
  return 'ai_template';
}
