/**
 * NARRATIVE ARC LLM ANALYZER
 *
 * Dimension: Narrative Arc & Stakes
 *
 * Evaluates the story structure and pacing:
 * - Does the story have a clear beginning, middle, and end?
 * - Is there tension/conflict?
 * - Is there a clear turning point?
 * - Are the stakes clear (what happens if they fail)?
 * - Does it use scenes (showing) vs summary (telling)?
 *
 * Based on the v4 "Gold Standard" Architecture.
 */
import { callClaude } from '@/lib/llm/claude';
// ============================================================================
// DIMENSION CONFIGURATION
// ============================================================================
const NARRATIVE_ARC_CONFIG = {
    name: 'narrative_arc',
    display_name: 'Narrative Arc',
    definition: 'Does the story have a clear structure with tension, stakes, and a turning point? Does it show vs tell?',
    tiers: {
        1: {
            name: 'Flat',
            score_range: '0-3',
            description: 'List of events or static description. "I did this, then this." No clear problem or conflict. Resume prose.',
        },
        2: {
            name: 'Linear',
            score_range: '4-6',
            description: 'Clear chronological story with a problem and solution. May be summary-heavy ("I struggled then I succeeded"). Predictable but functional.',
        },
        3: {
            name: 'Engaging',
            score_range: '7-8',
            description: 'Clear conflict and distinct turning point. Stakes are clear. Uses some specific details/scenes to show the struggle.',
        },
        4: {
            name: 'Compelling',
            score_range: '9-10',
            description: 'Sophisticated structure (e.g., in media res). High tension. Deep resolution. Reader is emotionally invested. Shows vs Tells.',
        },
    },
    evaluator_prompts: [
        'Is there a clear problem or conflict established early?',
        'Do we understand what is at stake if the student fails?',
        'Is there a distinct turning point or climax?',
        'Does the student use scenes (sensory details, dialogue) or just summary?',
    ],
    writer_prompts: [
        'What was the specific moment when things were hardest?',
        'What would have happened if you failed?',
        'Can you describe the climax in slow motion (sights, sounds)?',
    ],
    warning_signs: [
        'Resume recap (listing achievements)',
        'No conflict or obstacle',
        'Vague "it was hard" without showing the struggle',
        'Resolution feels unearned or abrupt',
    ],
};
// ============================================================================
// LLM ANALYZER
// ============================================================================
export async function analyzeNarrativeArc(essayText) {
    const config = NARRATIVE_ARC_CONFIG;
    const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Narrative Arc & Stakes.

**Definition:** ${config.definition}

**Goal:** Determine if the story is Flat, Linear, Engaging, or Compelling.

**Scoring Tiers:**
1. **Tier 1: Flat (0-3)** - List of events or static description. "I did X, then Y." No clear problem. Resume prose.
2. **Tier 2: Linear (4-6)** - Clear chronological story with a problem and solution. "I had a problem, I fixed it." Predictable structure. May be summary-heavy but tells a cohesive story (not just a list).
3. **Tier 3: Engaging (7-8)** - Clear conflict and distinct turning point. Stakes are clear. Uses some specific scenes/details to show the struggle. The reader wants to know the outcome.
4. **Tier 4: Compelling (9-10)** - Sophisticated structure (e.g., in media res). High tension. Deep resolution. Reader is emotionally invested. Masterful balance of scene and summary.

**Diagnostic Prompts (Reasoning Engine):**
1. **Inciting Incident:** Is there a clear problem that kicks off the story?
2. **Stakes:** Do we know *why* it matters? (Internal or external stakes).
3. **Show vs Tell:** Are there scenes (showing) or just explanation (telling)?
4. **Turning Point:** Is there a distinct moment of change/decision?

**CRITICAL CALIBRATION:**
- **The "Resume Trap":** Listing activities without a central problem = Tier 1 (Flat).
- **The "Summary Story":** A chronological story ("Freshman year was hard, then I learned X") is Tier 2 (Linear), NOT Flat. Flat is for disconnected lists.
- **The "Engaging Threshold":** To reach Tier 3, we must feel the *risk* of failure or the *moment* of decision.
- **The "Stakes Test":** If they failed, would anyone care? If not, stakes are low.

**Output Format:**
{
  "score": <number 0-10>,
  "quality_level": "<compelling|engaging|linear|flat>",
  "tier_evaluation": {
    "current_tier": "<flat|linear|engaging|compelling>",
    "next_tier": "<linear|engaging|compelling|max_tier>",
    "tier_reasoning": "<Succinct explanation>"
  },
  "reasoning": {
    "structure_analysis": "<Chronological, in media res, etc.>",
    "tension_analysis": "<Where does tension come from?>",
    "stakes_analysis": "<What is at risk?>",
    "pacing_analysis": "<Scene vs summary balance>"
  },
  "arc_components": {
    "inciting_incident": { "present": <boolean>, "description": "<desc>" },
    "rising_action": { "present": <boolean>, "description": "<desc>" },
    "climax": { "present": <boolean>, "description": "<desc>" },
    "falling_action": { "present": <boolean>, "description": "<desc>" },
    "resolution": { "present": <boolean>, "description": "<desc>" }
  },
  "pacing_check": {
    "scene_count": <number>,
    "summary_ratio": "<balanced|too_much_summary|too_much_detail>"
  },
  "evidence_quotes": ["<quote>", "<quote>"],
  "evaluator_note": "<1 sentence summary>",
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "strategic_pivot": "<THE INVISIBLE CEILING: Identify the exact flaw. Prescribe the specific fix. e.g., 'You tell us you struggled (Linear/Tier 2). To reach Engaging (Tier 3), write a Scene describing the moment you almost quit.'>",
  "writer_prompts": ["<string>", "<string>"],
  "confidence": <number>
}`;
    const userPrompt = `Analyze this essay for Narrative Arc:

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
        console.error('[Narrative Arc Analyzer] API call failed:', error);
        return {
            score: 0,
            quality_level: 'flat',
            tier_evaluation: {
                current_tier: 'flat',
                next_tier: 'linear',
                tier_reasoning: 'Analysis failed',
            },
            reasoning: {
                structure_analysis: 'Analysis failed',
                tension_analysis: 'Analysis failed',
                stakes_analysis: 'Analysis failed',
                pacing_analysis: 'Analysis failed',
            },
            arc_components: {
                inciting_incident: { present: false, description: 'Error' },
                rising_action: { present: false, description: 'Error' },
                climax: { present: false, description: 'Error' },
                falling_action: { present: false, description: 'Error' },
                resolution: { present: false, description: 'Error' },
            },
            pacing_check: { scene_count: 0, summary_ratio: 'too_much_summary' },
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
//# sourceMappingURL=narrativeArcAnalyzer_llm.js.map