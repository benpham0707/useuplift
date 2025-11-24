/**
 * SPECIFICITY LLM ANALYZER
 *
 * Dimension: Specificity & Evidence
 *
 * Evaluates the use of concrete details to build credibility and immersion:
 * - Does the student use numbers, names, and specific examples?
 * - Do they "Show" (sensory details, scenes) or just "Tell" (summary)?
 * - Is the language precise or vague?
 *
 * Based on the v4 "Gold Standard" Architecture.
 */
import { callClaude } from '@/lib/llm/claude';
// ============================================================================
// DIMENSION CONFIGURATION
// ============================================================================
const SPECIFICITY_CONFIG = {
    name: 'specificity',
    display_name: 'Specificity & Evidence',
    definition: 'Does the student use concrete details (numbers, names, sensory details) to build credibility and immersion? Do they show vs tell?',
    tiers: {
        1: {
            name: 'Vague',
            score_range: '0-3',
            description: 'Abstract language. "Many challenges", "various activities", "learned a lot". No grounding in reality.',
        },
        2: {
            name: 'General',
            score_range: '4-6',
            description: 'Some details but not precise. "I led the club", "We raised money". Functional but dry. "Telling" not "Showing".',
        },
        3: {
            name: 'Specific',
            score_range: '7-8',
            description: 'Concrete numbers and examples. "I led 20 members", "We raised $500". Credible evidence of impact.',
        },
        4: {
            name: 'Vivid',
            score_range: '9-10',
            description: 'Sensory immersion. "We sold 200 boxes of Krispy Kremes in the rain." Combines quantitative impact with qualitative richness.',
        },
    },
    evaluator_prompts: [
        'Are there specific numbers ($, %, hours, people)?',
        'Are there proper nouns (names of people, places, organizations)?',
        'Does the student describe specific tools, methods, or actions?',
        'Are there sensory details (sights, sounds, smells)?',
    ],
    writer_prompts: [
        'How many people? How much money? How many hours?',
        'What specific tools or software did you use?',
        'What did the room look/smell/sound like?',
        'Can you name the specific person you helped?',
    ],
    warning_signs: [
        'Words like "many", "various", "numerous", "a lot"',
        'Generic verbs like "helped", "worked", "participated"',
        'Lack of proper nouns',
        'No numbers to back up claims',
    ],
};
// ============================================================================
// LLM ANALYZER
// ============================================================================
export async function analyzeSpecificity(essayText) {
    const config = SPECIFICITY_CONFIG;
    const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Specificity & Evidence.

**Definition:** ${config.definition}

**Goal:** Determine if the writing is Vague, General, Specific, or Vivid.

**Scoring Tiers:**
1. **Tier 1: Vague (0-3)** - Abstract language. "Many challenges", "various activities", "learned a lot", "helping people". No specific activity named. Reader doesn't know what you actually *did*.
2. **Tier 2: General (4-6)** - Functional description. "I planted trees", "We recycled paper", "I tutored math". We know *what* happened, but not the *scale* (how many?) or *texture*. Tells the events clearly but lacks data/sensory.
3. **Tier 3: Specific (7-8)** - Concrete numbers and examples. "I planted 12 oaks", "We recycled 500lbs", "I led 20 members". Credible evidence of impact. Uses proper nouns.
4. **Tier 4: Vivid (9-10)** - Sensory immersion + Hard Data. "We sold 200 boxes of Krispy Kremes in the rain." Combines quantitative impact with qualitative richness.

**Diagnostic Prompts (Reasoning Engine):**
1. **Action Clarity:** Can we picture the general activity? (Planting trees vs "Doing service"). If yes -> at least Tier 2.
2. **Metrics:** Are there hard numbers? ($, %, #) If yes -> Tier 3+.
3. **Nouns:** Are there specific names? (Mr. Jones, Java, distinct tools)
4. **Senses:** Can we see/hear/smell the scene? If yes -> Tier 4.

**CRITICAL CALIBRATION:**
- **The "General vs Vague":** "I volunteered at a hospital" is Tier 2 (General) because we know the location type. "I did service work" is Tier 1 (Vague).
- **The "Metric Threshold":** Without numbers/names, cap at Tier 2 (6/10). With numbers, move to Tier 3.
- **The "Vivid Premium":** Specificity isn't just numbers; it's texture. "The smell of antiseptic" is as valuable as "$500".

**Output Format:**
{
  "score": <number 0-10>,
  "quality_level": "<vivid|specific|general|vague>",
  "tier_evaluation": {
    "current_tier": "<vague|general|specific|vivid>",
    "next_tier": "<general|specific|vivid|max_tier>",
    "tier_reasoning": "<Succinct explanation>"
  },
  "reasoning": {
    "quantitative_analysis": "<Analysis of numbers/metrics>",
    "qualitative_analysis": "<Analysis of names/places/senses>",
    "showing_vs_telling_analysis": "<Scene vs Summary>",
    "precision_analysis": "<Word choice quality>"
  },
  "details": {
    "metrics_count": <number>,
    "proper_nouns_count": <number>,
    "sensory_details_count": <number>
  },
  "evidence_quotes": ["<quote>", "<quote>"],
  "evaluator_note": "<1 sentence summary>",
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "strategic_pivot": "<THE INVISIBLE CEILING: Identify the exact flaw. Prescribe the specific fix. e.g., 'You say you helped 'many students' (Vague/Tier 1). To reach Specific (Tier 3), tell us exactly how many students and what specific subject you taught them.'>",
  "writer_prompts": ["<string>", "<string>"],
  "confidence": <number>
}`;
    const userPrompt = `Analyze this essay for Specificity:

---

${essayText}

---

Provide your analysis as JSON following the exact format specified.`;
    try {
        const response = await callClaude(userPrompt, {
            model: 'claude-sonnet-4-20250514',
            temperature: 0.3,
            maxTokens: 2048,
            systemPrompt,
            useJsonMode: true,
        });
        return response.content;
    }
    catch (error) {
        console.error('[Specificity Analyzer] API call failed:', error);
        return {
            score: 0,
            quality_level: 'vague',
            tier_evaluation: {
                current_tier: 'vague',
                next_tier: 'general',
                tier_reasoning: 'Analysis failed',
            },
            reasoning: {
                quantitative_analysis: 'Analysis failed',
                qualitative_analysis: 'Analysis failed',
                showing_vs_telling_analysis: 'Analysis failed',
                precision_analysis: 'Analysis failed',
            },
            details: {
                metrics_count: 0,
                proper_nouns_count: 0,
                sensory_details_count: 0,
            },
            evidence_quotes: [],
            evaluator_note: 'Error: Unable to analyze essay due to API failure',
            strengths: [],
            weaknesses: ['Unable to analyze due to technical error'],
            strategic_pivot: 'Analysis failed',
            writer_prompts: [],
            confidence: 0,
        };
    }
}
//# sourceMappingURL=specificityAnalyzer_llm.js.map