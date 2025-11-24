/**
 * THEMATIC COHERENCE LLM ANALYZER
 *
 * Dimension: Thematic Coherence
 *
 * Evaluates how well the essay connects its parts:
 * - Is there a clear "Throughline" or central theme?
 * - Do paragraphs transition logically?
 * - Does the conclusion connect back to the introduction (Circle Back)?
 * - Is the essay focused or scattered?
 *
 * Based on the v4 "Gold Standard" Architecture.
 */

import { callClaude } from '@/lib/llm/claude';

// ============================================================================
// TYPES
// ============================================================================

export interface ThematicCoherenceAnalysis {
  // Overall assessment
  score: number; // 0-10
  quality_level: 'unified' | 'coherent' | 'loose' | 'fragmented';

  // Deep reasoning (v4 Architecture)
  reasoning: {
    core_theme: string; // The central idea identified
    flow_analysis: string; // How paragraphs connect
    circle_back_analysis: string; // Intro/Conclusion connection
    cohesion_analysis: string; // Do details support the theme?
  };

  // Tier Evaluation (v4 Architecture)
  tier_evaluation: {
    current_tier: 'fragmented' | 'loose' | 'coherent' | 'unified';
    next_tier: 'loose' | 'coherent' | 'unified' | 'max_tier';
    tier_reasoning: string;
  };

  // Evidence
  evidence_quotes: string[];
  evaluator_note: string;

  // Detailed analysis
  structure: {
    has_clear_theme: boolean;
    has_logical_transitions: boolean;
    has_circle_back: boolean; // Ending connects to beginning
    paragraph_count: number;
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

const COHERENCE_CONFIG = {
  name: 'thematic_coherence',
  display_name: 'Thematic Coherence',
  definition: 'Does the essay have a central theme that connects all parts? Do paragraphs flow logically? Does the ending resonate with the beginning?',

  tiers: {
    1: {
      name: 'Fragmented',
      score_range: '0-3',
      description: 'Random paragraphs. No connection between ideas. Feels like different essays pasted together.',
    },
    2: {
      name: 'Loose',
      score_range: '4-6',
      description: 'Connected by broad topic (e.g., "My Life") but no central argument. "And then" transitions. Wandering focus.',
    },
    3: {
      name: 'Coherent',
      score_range: '7-8',
      description: 'Clear theme connects all examples. Paragraphs transition logically. Ending reflects the beginning.',
    },
    4: {
      name: 'Unified',
      score_range: '9-10',
      description: 'Masterful weaving. Every detail serves the theme. The "Golden Thread" is visible throughout. Ending elevates the beginning.',
    },
  },

  evaluator_prompts: [
    'What is the single central message of this essay?',
    'Do the paragraphs follow a logical sequence (Cause->Effect, Chronological, Thematic)?',
    'Does the conclusion resolve the question posed in the introduction?',
    'Are there jarring shifts in topic or tone?',
  ],

  warning_signs: [
    'Topic jumping',
    'Conclusion introduces completely new ideas',
    'Introduction promises one thing, body delivers another',
    'Paragraphs could be reordered without changing the meaning',
  ],
};

// ============================================================================
// LLM ANALYZER
// ============================================================================

export async function analyzeThematicCoherence(essayText: string): Promise<ThematicCoherenceAnalysis> {
  const config = COHERENCE_CONFIG;

  const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Thematic Coherence.

**Definition:** ${config.definition}

**Goal:** Determine if the essay is Fragmented, Loose, Coherent, or Unified.

**Scoring Tiers:**
1. **Tier 1: Fragmented (0-3)** - Random paragraphs or jarring shifts. "I like soccer. Also I like math. Also my grandma is nice." No logical flow or structure.
2. **Tier 2: Loose (4-6)** - Connected by a broad topic (e.g., "My Activities") or list structure ("First, Second, Finally"). Paragraphs make sense individually, but there's no central argument driving the connections. It feels like a list.
3. **Tier 3: Coherent (7-8)** - Clear theme connects all examples. "I value curiosity. Here is how I showed curiosity in science. Here is how I showed it in art." Logical transitions (A leads to B). Ending connects to beginning.
4. **Tier 4: Unified (9-10)** - Masterful weaving. "The Golden Thread." Every detail serves the theme. The structure itself reinforces the meaning. Ending elevates the introduction.

**Diagnostic Prompts (Reasoning Engine):**
1. **The Thread:** Is there one core idea that runs through everything?
2. **Transitions:** Do paragraphs link (A leads to B) or just list (A, then B)?
3. **Circle Back:** Does the conclusion revisit the intro's image or question with new insight?
4. **Focus:** Is everything necessary?

**CRITICAL CALIBRATION:**
- **The "List Trap":** A clear list ("First I did X, then Y") is **Tier 2 (Loose)**, NOT Tier 1. It has structure, just not *thematic* structure.
- **The "Chronological Trap":** Just following time is Tier 2 unless the *growth* is the theme.
- **The "Fragmented Threshold":** Tier 1 is for essays that jump topics *without* structure or transition.

**Output Format:**
{
  "score": <number 0-10>,
  "quality_level": "<unified|coherent|loose|fragmented>",
  "tier_evaluation": {
    "current_tier": "<fragmented|loose|coherent|unified>",
    "next_tier": "<loose|coherent|unified|max_tier>",
    "tier_reasoning": "<Succinct explanation>"
  },
  "reasoning": {
    "core_theme": "<Identify the central theme>",
    "flow_analysis": "<How paragraphs connect>",
    "circle_back_analysis": "<Intro/Conclusion connection>",
    "cohesion_analysis": "<Detail support>"
  },
  "structure": {
    "has_clear_theme": <boolean>,
    "has_logical_transitions": <boolean>,
    "has_circle_back": <boolean>,
    "paragraph_count": <number>
  },
  "evidence_quotes": ["<quote>", "<quote>"],
  "evaluator_note": "<1 sentence summary>",
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "strategic_pivot": "<THE INVISIBLE CEILING: Identify the exact flaw. Prescribe the specific fix. e.g., 'You have three separate stories about soccer, math, and baking (Loose/Tier 2). To reach Coherent (Tier 3), find the shared trait—like 'precision'—and rewrite the transitions to highlight that connection.'>",

  "confidence": <number>
}`;

  const userPrompt = `Analyze this essay for Thematic Coherence:

---

${essayText}

---

Provide your analysis as JSON following the exact format specified.`;

  try {
    const response = await callClaude<ThematicCoherenceAnalysis>(userPrompt, {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt,
      useJsonMode: true,
    });

    return response.content;

  } catch (error) {
    console.error('[Thematic Coherence Analyzer] API call failed:', error);
    return {
      score: 0,
      quality_level: 'fragmented',
      tier_evaluation: {
        current_tier: 'fragmented',
        next_tier: 'loose',
        tier_reasoning: 'Analysis failed',
      },
      reasoning: {
        core_theme: 'Analysis failed',
        flow_analysis: 'Analysis failed',
        circle_back_analysis: 'Analysis failed',
        cohesion_analysis: 'Analysis failed',
      },
      structure: {
        has_clear_theme: false,
        has_logical_transitions: false,
        has_circle_back: false,
        paragraph_count: 0,
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

