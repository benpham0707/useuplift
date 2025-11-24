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
    writer_prompts: [
        'If you were telling this story to a friend at lunch, how would you say it?',
        'What line could only you write?',
        'Where does the writing feel stiff or "fancy"?',
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
export async function analyzeVoiceStyle(essayText) {
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
  "writer_prompts": ["<string>", "<string>"],
  "confidence": <number 0-1>
}`;
    const userPrompt = `Analyze this essay for Voice & Writing Style:

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
        console.error('[Voice Style LLM Analyzer] API call failed:', error);
        return {
            score: 0,
            quality_level: 'essay_speak',
            tier_evaluation: {
                current_tier: 'ai_template',
                next_tier: 'resume_prose',
                tier_reasoning: 'Analysis failed',
            },
            reasoning: {
                voice_authenticity: 'Analysis failed',
                sentence_cadence: 'Analysis failed',
                perspective_specificity: 'Analysis failed',
                essay_speak_analysis: 'Analysis failed',
            },
            evidence_quotes: [],
            evaluator_note: 'Error: Unable to analyze essay due to API failure',
            authentic_signals: { present: false, examples: [], description: 'Analysis failed' },
            manufactured_signals: { present: false, examples: [], description: 'Analysis failed' },
            sensory_details: { present: false, examples: [], description: 'Analysis failed' },
            distinctive_phrases: { present: false, examples: [], description: 'Analysis failed' },
            strengths: [],
            weaknesses: ['Unable to analyze due to technical error'],
            strategic_pivot: 'Analysis failed',
            writer_prompts: [],
            confidence: 0,
        };
    }
}
//# sourceMappingURL=voiceStyleAnalyzer_llm.js.map