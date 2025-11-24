/**
 * CRAFT & LANGUAGE LLM ANALYZER
 *
 * Dimension: Craft & Language Quality
 *
 * Evaluates the technical quality and literary sophistication of the writing:
 * - Word Choice: Strong verbs vs weak verbs ("dashed" vs "went").
 * - Sentence Variety: Mix of long/short sentences. Rhythm.
 * - Literary Devices: Metaphor, simile, imagery.
 * - Clarity/Conciseness: No fluff.
 *
 * Based on the v4 "Gold Standard" Architecture.
 */

import { callClaude } from '@/lib/llm/claude';

// ============================================================================
// TYPES
// ============================================================================

export interface CraftAnalysis {
  // Overall assessment
  score: number; // 0-10
  quality_level: 'sophisticated' | 'polished' | 'competent' | 'functional';

  // Deep reasoning (v4 Architecture)
  reasoning: {
    verb_strength: string; // Active vs Passive, Specific vs Generic
    sentence_variety: string; // Rhythm and flow
    literary_devices: string; // Metaphor, imagery
    clarity_conciseness: string; // Economy of language
  };

  // Tier Evaluation (v4 Architecture)
  tier_evaluation: {
    current_tier: 'functional' | 'competent' | 'polished' | 'sophisticated';
    next_tier: 'competent' | 'polished' | 'sophisticated' | 'max_tier';
    tier_reasoning: string;
  };

  // Evidence
  evidence_quotes: string[];
  evaluator_note: string;

  // Detailed analysis
  technical_aspects: {
    strong_verbs_count: number; // Estimate
    cliches_count: number; // Estimate
    sentence_rhythm: 'varied' | 'repetitive' | 'choppy' | 'flowery';
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

const CRAFT_CONFIG = {
  name: 'craft_language',
  display_name: 'Craft & Language Quality',
  definition: 'Evaluates the technical quality and literary sophistication of the writing. Focuses on word choice, sentence rhythm, and imagery.',

  tiers: {
    1: {
      name: 'Functional',
      score_range: '0-3',
      description: 'Communicates facts. Basic vocabulary. Repetitive sentence structure. "I went to the store. I bought milk." Passive voice.',
    },
    2: {
      name: 'Competent',
      score_range: '4-6',
      description: 'Varied sentences. Good grammar. Some "essay speak" or clichés. Functional descriptions. "The store was crowded, but I found milk."',
    },
    3: {
      name: 'Polished',
      score_range: '7-8',
      description: 'Strong verbs. Precise imagery. Good rhythm. No wasted words. "I navigated the crowded aisles, dodging carts until I found the milk."',
    },
    4: {
      name: 'Sophisticated',
      score_range: '9-10',
      description: 'Lyrical quality. Intentional breaking of rules. Unique metaphors. "The milk aisle was a sanctuary of cool air in the sweltering market."',
    },
  },

  evaluator_prompts: [
    'Are the verbs active ("sprinted") or weak ("went")?',
    'Do sentences vary in length and structure?',
    'Are metaphors fresh or clichéd ("rollercoaster of emotions")?',
    'Is the language economical or wordy?',
  ],

  warning_signs: [
    'Overuse of "is/was/were"',
    'Clichés ("rollercoaster", "journey", "stepping stone")',
    'Wordiness ("due to the fact that")',
    'Repetitive sentence starts ("I did...", "I went...", "I saw...")',
  ],
};

// ============================================================================
// LLM ANALYZER
// ============================================================================

export async function analyzeCraft(essayText: string): Promise<CraftAnalysis> {
  const config = CRAFT_CONFIG;

  const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Craft & Language Quality.

**Definition:** ${config.definition}

**Goal:** Determine if the writing is Functional, Competent, Polished, or Sophisticated.

**Scoring Tiers:**
1. **Tier 1: Functional (0-3)** - Communicates facts. Basic vocabulary. Repetitive sentence structure. "I went to the store. I bought milk." Heavy passive voice.
2. **Tier 2: Competent (4-6)** - Standard student writing. Varied sentences. Good grammar. Some "essay speak" or clichés. Functional descriptions. Safe.
3. **Tier 3: Polished (7-8)** - Strong verbs. Precise imagery. Good rhythm. No wasted words. "I navigated the crowded aisles, dodging carts." Professional quality.
4. **Tier 4: Sophisticated (9-10)** - Lyrical quality. Intentional breaking of rules. Unique metaphors. "The milk aisle was a sanctuary of cool air." Literary quality.

**Diagnostic Prompts (Reasoning Engine):**
1. **Verbs:** Are they specific ("trudged", "sprinted") or generic ("walked", "ran")?
2. **Rhythm:** Do sentences flow with variety (Short. Long... Short.) or drone on?
3. **Clichés:** Are metaphors original or tired ("rollercoaster", "journey")?
4. **Economy:** Is every word necessary?

**CRITICAL CALIBRATION:**
- **The "Big Word Trap":** Using "utilize" instead of "use" is Tier 2 (Competent), not Sophisticated. Sophistication comes from precision ("wield"), not length.
- **The "Purple Prose Trap":** Overly flowery language ("The azure sky wept tears of sorrow") is usually Tier 2/3, not Tier 4. Tier 4 is *precise*.
- **The "Passive Trap":** "The ball was kicked by me" = Tier 1.

**Output Format:**
{
  "score": <number 0-10>,
  "quality_level": "<sophisticated|polished|competent|functional>",
  "tier_evaluation": {
    "current_tier": "<functional|competent|polished|sophisticated>",
    "next_tier": "<competent|polished|sophisticated|max_tier>",
    "tier_reasoning": "<Succinct explanation>"
  },
  "reasoning": {
    "verb_strength": "<Analysis of verbs>",
    "sentence_variety": "<Analysis of rhythm>",
    "literary_devices": "<Analysis of imagery/metaphor>",
    "clarity_conciseness": "<Analysis of economy>"
  },
  "technical_aspects": {
    "strong_verbs_count": <number>,
    "cliches_count": <number>,
    "sentence_rhythm": "<varied|repetitive|choppy|flowery>"
  },
  "evidence_quotes": ["<quote>", "<quote>"],
  "evaluator_note": "<1 sentence summary>",
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "strategic_pivot": "<THE INVISIBLE CEILING: Identify the exact flaw. Prescribe the specific fix. e.g., 'You rely on passive voice (Functional/Tier 1). To reach Competent (Tier 2), circle every 'was' and replace it with an action verb.'>",

  "confidence": <number>
}`;

  const userPrompt = `Analyze this essay for Craft & Language:

---

${essayText}

---

Provide your analysis as JSON following the exact format specified.`;

  try {
    const response = await callClaude<CraftAnalysis>(userPrompt, {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt,
      useJsonMode: true,
    });

    return response.content;

  } catch (error) {
    console.error('[Craft Analyzer] API call failed:', error);
    return {
      score: 0,
      quality_level: 'functional',
      tier_evaluation: {
        current_tier: 'functional',
        next_tier: 'competent',
        tier_reasoning: 'Analysis failed',
      },
      reasoning: {
        verb_strength: 'Analysis failed',
        sentence_variety: 'Analysis failed',
        literary_devices: 'Analysis failed',
        clarity_conciseness: 'Analysis failed',
      },
      technical_aspects: {
        strong_verbs_count: 0,
        cliches_count: 0,
        sentence_rhythm: 'choppy',
      },
      evidence_quotes: [],
      evaluator_note: 'Error: Unable to analyze essay due to API failure',
      strengths: [],
      weaknesses: ['Unable to analyze due to technical error'],
      strategic_pivot: 'Analysis failed',

      confidence: 0,
    };
  }
}

