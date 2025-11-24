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
    writer_prompts: [
        'What obstacle did you have to navigate that others might not?',
        'How did you get resourceful when resources were limited?',
        'What system did you have to learn to navigate?',
        'What advantage did you have that helped you succeed?',
        'How did your specific circumstances shape your approach?',
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
export async function analyzeContextCircumstances(essayText) {
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
  "writer_prompts": ["<question 1>", "<question 2>"],
  "confidence": <number 0-1>
}

**CRITICAL:** All quotes must be exact.`;
    const userPrompt = `Analyze this essay for Context & Circumstances:

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
        console.error('[Context Circumstances LLM Analyzer] API call failed:', error);
        return {
            score: 0,
            quality_level: 'victim_bystander',
            tier_evaluation: {
                current_tier: 'victim_bystander',
                next_tier: 'survivor',
                tier_reasoning: 'Analysis failed',
            },
            reasoning: {
                context_analysis: 'Analysis failed',
                action_analysis: 'Analysis failed',
                impact_analysis: 'Analysis failed',
                voice_analysis: 'Analysis failed',
            },
            evidence_quotes: [],
            evaluator_note: 'Error: Unable to analyze essay due to API failure',
            obstacles_constraints: { present: false, types: [], specificity: 'absent', examples: [], description: 'Analysis failed' },
            resourcefulness: { present: false, examples: [], description: 'Analysis failed' },
            tone_assessment: { victimhood: false, agency: false, privilege_awareness: false, description: 'Analysis failed' },
            strengths: [],
            weaknesses: ['Unable to analyze due to technical error'],
            strategic_pivot: 'Analysis failed',
            writer_prompts: [],
            confidence: 0,
        };
    }
}
//# sourceMappingURL=contextCircumstancesAnalyzer_llm.js.map