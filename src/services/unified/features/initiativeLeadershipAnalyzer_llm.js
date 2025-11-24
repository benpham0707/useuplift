/**
 * INITIATIVE & LEADERSHIP LLM ANALYZER
 *
 * Dimension: Initiative & Leadership (7% weight)
 *
 * Uses LLM-based semantic analysis to detect:
 * - Proactive problem identification (spotting gaps others miss)
 * - Self-directed learning and risk-taking
 * - Creating opportunities vs joining existing ones
 * - Evidence of independent action vs reactive participation
 * - Implicit/Narrative initiative (showing not just telling)
 *
 * Based on the v4 "Gold Standard" Architecture.
 */
import { callClaude } from '@/lib/llm/claude';
// ============================================================================
// DIMENSION CONFIGURATION
// ============================================================================
const INITIATIVE_LEADERSHIP_CONFIG = {
    name: 'initiative_leadership',
    display_name: 'Initiative & Leadership',
    weight: 0.07,
    definition: 'Does the essay show proactive initiative, problem-identification, or self-directed action?',
    tiers: {
        1: {
            name: 'Participant',
            score_range: '0-3',
            description: 'Reacts to external prompts. Performs assigned duties. "I was assigned..."',
        },
        2: {
            name: 'Contributor',
            score_range: '4-6',
            description: 'Improves existing systems (efficiency). Takes ownership of tasks. "I organized the files..."',
        },
        3: {
            name: 'Transformer',
            score_range: '7-8',
            description: 'Identifies systemic gaps. Teaches self new skills to solve them. "I noticed X was broken, so I built Y..."',
        },
        4: {
            name: 'Visionary',
            score_range: '9-10',
            description: 'Intellectual risk + Institutional impact. Changes culture or systems permanently. "I created a new paradigm for..."',
        },
    },
    evaluator_prompts: [
        'Did the student identify a problem or gap before taking action?',
        'Is there evidence of self-directed learning or risk-taking?',
        'Did they create something from scratch vs joining an existing program?',
        'Do we see proactive language ("I noticed", "I realized") vs reactive ("I was told")?',
    ],
    writer_prompts: [
        'What specific problem did you see that no one else was fixing?',
        'What is the scariest decision you made in this process?',
        'If you hadn\'t been there, what would have happened?',
    ],
    warning_signs: [
        'Reactive language ("I was assigned")',
        'No problem identification',
        'Participation without creation',
        'Generic leadership claims',
    ],
};
// ============================================================================
// LLM ANALYZER
// ============================================================================
export async function analyzeInitiativeLeadership(essayText) {
    const config = INITIATIVE_LEADERSHIP_CONFIG;
    const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Initiative & Leadership.

**Definition:** ${config.definition}

**Goal:** Identify the *depth* and *quality* of initiative. Distinguish between "doing tasks" and "solving problems."

**Scoring Tiers (The Ladder of Initiative):**
1. **Tier 1: Participant (0-3)** - Reacts to external prompts. Performs assigned duties. "I joined the club."
2. **Tier 2: Contributor (4-6)** - Improves existing systems (efficiency). Takes ownership. "I organized the spreadsheet."
3. **Tier 3: Transformer (7-8)** - Identifies systemic gaps. Teaches self new skills to solve them. "I noticed X was broken, so I taught myself Python to build Y."
4. **Tier 4: Visionary (9-10)** - Intellectual risk + Institutional impact + Elite narrative. "I changed the culture of the organization."

**Diagnostic Prompts (Reasoning Engine):**
1. **Status Quo Friction:** Did the student feel the pain of the problem? Or did they just see a task list?
2. **Autodidactic Drive:** Did they learn something *hard* on their own?
3. **Systemic Ripple:** Did the solution survive them? Did it change how others work?
4. **Narrative Evidence:** Are there *scenes* of the problem? Or just *summaries* of the solution?

**CRITICAL CALIBRATION:**
- **Ignore Robotic Templates:** "I decided," "I founded" = NO CREDIT. Look for *actions*.
- **Busy-ness != Initiative:** Doing more hours of work is Tier 1/2. Changing *how* work is done is Tier 3.

**Output Format:**
{
  "score": <number 0-10>,
  "quality_level": "<exceptional_initiative|strong_proactivity|some_initiative|reactive|pure_participation>",
  "tier_evaluation": {
    "current_tier": "<participant|contributor|transformer|visionary>",
    "next_tier": "<contributor|transformer|visionary|max_tier>",
    "tier_reasoning": "<Succinct explanation of why it's in this tier>"
  },
  "reasoning": {
    "context_analysis": "<Analyze the status quo/problem environment>",
    "action_analysis": "<Analyze the nature of the intervention - reactive vs self-directed>",
    "impact_analysis": "<Analyze the scale and sustainability of the result>",
    "voice_analysis": "<Analyze the narrative quality - show vs tell>"
  },
  "evidence_quotes": ["<quote 1>", "<quote 2>"],
  "evaluator_note": "<1 sentence summary>",
  "problem_identification": { "present": <boolean>, "description": "<string>" },
  "self_directed_action": { "present": <boolean>, "description": "<string>" },
  "risk_taking": { "present": <boolean>, "description": "<string>" },
  "opportunity_creation": { "present": <boolean>, "description": "<string>" },
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "strategic_pivot": "<THE INVISIBLE CEILING: Identify the exact narrative or structural flaw keeping this essay in its current tier. Then prescribe the specific 'counter-factual' action to break through. e.g., 'You describe the solution (Contributor/Tier 2). To reach Transformer (Tier 3), describe the moment you realized the old system was broken and the specific skill you learned to fix it.'>",
  "writer_prompts": ["<string>", "<string>"],
  "confidence": <number 0-1>
}`;
    const userPrompt = `Analyze this essay for Initiative & Leadership:

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
        console.error('[Initiative LLM Analyzer] API call failed:', error);
        return {
            score: 0,
            quality_level: 'pure_participation',
            tier_evaluation: {
                current_tier: 'participant',
                next_tier: 'contributor',
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
            problem_identification: { present: false, description: 'Analysis failed' },
            self_directed_action: { present: false, description: 'Analysis failed' },
            risk_taking: { present: false, description: 'Analysis failed' },
            opportunity_creation: { present: false, description: 'Analysis failed' },
            strengths: [],
            weaknesses: ['Unable to analyze due to technical error'],
            strategic_pivot: 'Analysis failed',
            writer_prompts: [],
            confidence: 0,
        };
    }
}
//# sourceMappingURL=initiativeLeadershipAnalyzer_llm.js.map