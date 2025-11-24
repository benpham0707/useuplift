/**
 * IDENTITY & SELF-DISCOVERY LLM ANALYZER
 *
 * Dimension: Identity & Self-Discovery
 *
 * Evaluates how well the essay reveals the student's core self:
 * - Does it reveal *who* the student is (values, traits, personality)?
 * - Is the identity complex (nuanced) or simple (one-note)?
 * - Is the self-concept told ("I am a leader") or shown through choices?
 *
 * Based on the v4 "Gold Standard" Architecture.
 */
import { callClaude } from '@/lib/llm/claude';
// ============================================================================
// DIMENSION CONFIGURATION
// ============================================================================
const IDENTITY_CONFIG = {
    name: 'identity_discovery',
    display_name: 'Identity & Self-Discovery',
    definition: 'Does the essay reveal who the student is through their choices, values, and internal conflicts? Is the identity complex or one-dimensional?',
    tiers: {
        1: {
            name: 'Invisible',
            score_range: '0-3',
            description: 'Activity report. "I did this." We know what they did, not who they are. The student is a ghost in their own essay.',
        },
        2: {
            name: 'Surface',
            score_range: '4-6',
            description: 'Declared identity. "I am a leader." "I am hard-working." Tells us the trait directly but lacks depth or proof.',
        },
        3: {
            name: 'Emerging',
            score_range: '7-8',
            description: 'Shown identity. Through actions/decisions, we see values (e.g., prioritizing team over self). Clear personality shines through.',
        },
        4: {
            name: 'Deep',
            score_range: '9-10',
            description: 'Nuanced self-portrait. Conflicting values, internal contradictions, growth. "I am a perfectionist learning to let go." Distinctive voice.',
        },
    },
    evaluator_prompts: [
        'What three adjectives describe this student based ONLY on this essay?',
        'Do they explicitly state their traits ("I am diligent") or demonstrate them?',
        'Is there any internal conflict or complexity shown?',
        'Could anyone else have written this essay?',
    ],
    writer_prompts: [
        'If a stranger read this, would they feel like they met you?',
        'What value were you defending in the climax of your story?',
        'What is a contradiction in your personality (e.g., "impatient but thorough")?',
    ],
    warning_signs: [
        'Focusing entirely on the activity, not the self',
        'Generic adjectives ("hardworking", "passionate")',
        'Trying to be what they think colleges want (The "Perfect Student")',
        'No personal voice',
    ],
};
// ============================================================================
// LLM ANALYZER
// ============================================================================
export async function analyzeIdentity(essayText) {
    const config = IDENTITY_CONFIG;
    const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Identity & Self-Discovery.

**Definition:** ${config.definition}

**Goal:** Determine if the identity is Invisible, Surface, Emerging, or Deep.

**Scoring Tiers:**
1. **Tier 1: Invisible (0-3)** - Activity report or Club Brochure. "The club meets on Tuesdays." Focuses on logistics, facts, and external events. The student is a ghost.
2. **Tier 2: Surface (4-6)** - Declared identity. "I am a leader." "I am hard-working." The student *claims* traits but doesn't prove them. Focuses on adjectives and self-praise without evidence. "Resume in prose."
3. **Tier 3: Emerging (7-8)** - Shown identity. Through actions/decisions, we see values. We get a sense of personality. "I stayed late to help the freshman" (Shows care).
4. **Tier 4: Deep (9-10)** - Nuanced self-portrait. Conflicting values, internal contradictions, growth. "I am a perfectionist learning to let go." Uniquely them.

**Diagnostic Prompts (Reasoning Engine):**
1. **The "Who" Test:** After reading, do I know this person or just their resume?
2. **Show vs Tell:** Do they claim traits ("I am passionate" -> Tier 2) or prove them (Tier 3)?
3. **Subject:** Is the subject "The Club/Activity" (Tier 1) or "Me" (Tier 2+)?
4. **Complexity:** Is the identity one-note (The Leader) or multi-dimensional (The anxious Leader who learned trust)?

**CRITICAL CALIBRATION:**
- **The "Adjective Trap":** Using big words to describe oneself ("tenacious", "visionary") is **Tier 2 (Surface)**, NOT Invisible. They are trying to show identity, just poorly.
- **The "Brochure Trap":** Describing what the club does ("We build robots") is **Tier 1 (Invisible)**.
- **The "Vulnerability Premium":** Admitting flaws usually deepens identity (Tier 3/4).

**Output Format:**
{
  "score": <number 0-10>,
  "quality_level": "<deep|emerging|surface|invisible>",
  "tier_evaluation": {
    "current_tier": "<invisible|surface|emerging|deep>",
    "next_tier": "<surface|emerging|deep|max_tier>",
    "tier_reasoning": "<Succinct explanation>"
  },
  "reasoning": {
    "core_values": ["<Value 1>", "<Value 2>"],
    "identity_complexity": "<Nuance analysis>",
    "show_vs_tell_identity": "<Demonstrated vs Stated>",
    "authenticity_check": "<Does it feel real?>"
  },
  "traits": {
    "dominant_trait": "<string>",
    "supporting_traits": ["<string>", "<string>"],
    "contradictions": ["<string>", "<string>"]
  },
  "evidence_quotes": ["<quote>", "<quote>"],
  "evaluator_note": "<1 sentence summary>",
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "strategic_pivot": "<THE INVISIBLE CEILING: Identify the exact flaw. Prescribe the specific fix. e.g., 'You tell us you are 'passionate' (Surface/Tier 2). To reach Emerging (Tier 3), delete the word 'passionate' and describe the Saturday night you spent organizing the library purely for fun.'>",
  "writer_prompts": ["<string>", "<string>"],
  "confidence": <number>
}`;
    const userPrompt = `Analyze this essay for Identity & Self-Discovery:

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
        console.error('[Identity Analyzer] API call failed:', error);
        return {
            score: 0,
            quality_level: 'invisible',
            tier_evaluation: {
                current_tier: 'invisible',
                next_tier: 'surface',
                tier_reasoning: 'Analysis failed',
            },
            reasoning: {
                core_values: [],
                identity_complexity: 'Analysis failed',
                show_vs_tell_identity: 'Analysis failed',
                authenticity_check: 'Analysis failed',
            },
            traits: {
                dominant_trait: 'Unknown',
                supporting_traits: [],
                contradictions: [],
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
//# sourceMappingURL=identityAnalyzer_llm.js.map