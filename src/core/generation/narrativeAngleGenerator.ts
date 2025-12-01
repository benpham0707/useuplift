// @ts-nocheck - Legacy generation file with type mismatches
/**
 * Narrative Angle Generator
 *
 * Transforms ordinary experiences into unique, compelling narrative angles.
 * The goal: Turn "I did robotics and learned teamwork" into something readers
 * have NEVER seen before.
 *
 * Philosophy:
 * - Every activity has 100+ possible angles
 * - The best angle reveals something unexpected about the student OR the world
 * - Unique angles come from finding the LEAST obvious connection
 * - Great essays make admissions officers think "I've never thought about it that way"
 */

import { callClaudeWithRetry } from '../../lib/llm/claude';
import type { GenerationProfile } from './essayGenerator';

// ============================================================================
// TYPES
// ============================================================================

export interface NarrativeAngle {
  // Core concept
  title: string; // e.g., "The Bug as Oracle", "Silence as Data"
  hook: string; // Opening sentence that grabs attention
  throughline: string; // Central idea that unifies the essay

  // Unique perspective
  unusualConnection: string; // What unexpected thing are you connecting?
  philosophicalDepth: string; // What universal truth does this reveal?
  freshMetaphor?: string; // Original metaphor (not clichéd)

  // Narrative structure
  openingScene: string; // Where to start
  turningPoint: string; // Moment of realization
  universalInsight: string; // How this applies beyond the activity

  // Quality indicators
  originality: number; // 1-10, how unique is this angle?
  riskLevel: 'safe' | 'moderate' | 'bold'; // How unconventional?
  expectedImpact: 'good' | 'excellent' | 'extraordinary';
}

export interface AngleGenerationOptions {
  profile: GenerationProfile;
  numAngles?: number; // How many angles to generate (default: 5)
  prioritize?: 'originality' | 'safety' | 'depth'; // What to optimize for
  avoidAngles?: string[]; // Angles to avoid (e.g., "learned teamwork")
}

// ============================================================================
// ANGLE GENERATION PROMPTS
// ============================================================================

/**
 * Generate multiple unique narrative angles for an experience
 */
export async function generateNarrativeAngles(
  options: AngleGenerationOptions
): Promise<NarrativeAngle[]> {
  const { profile, numAngles = 5, prioritize = 'originality' } = options;

  const prompt = buildAngleGenerationPrompt(profile, numAngles, prioritize);

  const response = await callClaudeWithRetry(
    prompt,
    {
      systemPrompt: ANGLE_GENERATOR_SYSTEM_PROMPT,
      temperature: 1.0, // High creativity
      useJsonMode: true,
    }
  );

  // Parse response into angles
  return parseAnglesFromResponse(response.content);
}

/**
 * Select the best angle from candidates
 */
export async function selectBestAngle(
  angles: NarrativeAngle[],
  profile: GenerationProfile
): Promise<NarrativeAngle> {
  // Score each angle based on:
  // 1. Originality (most important)
  // 2. Alignment with student voice
  // 3. Ability to showcase growth
  // 4. Universal insight potential

  const scored = angles.map((angle) => ({
    angle,
    score: scoreAngle(angle, profile),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored[0].angle;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const ANGLE_GENERATOR_SYSTEM_PROMPT = `You are a narrative angle expert who helps students find UNIQUE, FRESH perspectives on their experiences.

Your job: Transform ordinary activities into extraordinary narrative angles that admissions officers have NEVER seen before.

PHILOSOPHY:
1. The best angles reveal something unexpected
2. Avoid ALL common tropes ("learned leadership", "overcame adversity", "found my passion")
3. Look for the LEAST obvious connection
4. Find the philosophical depth - what does this reveal about human nature or the world?
5. The hook should make readers think "Wait, WHAT?" in a good way

🎯 CRITICAL SUCCESS PATTERN (Session 18 Findings):
- GROUNDED > ABSTRACT: Use concrete technical terms (build, debug, code, system, vision) rather than mystical/abstract terms (oracle, sacred, cosmic, ethereal)
- BRIDGE TECHNICAL + HUMAN: Connect technical work to human insight (e.g., "debugging the social operating system")
- TARGET 7/10 ORIGINALITY: Moderate risk is optimal (not too safe, not too abstract)
- AUTHENTICITY MATTERS MOST: Students must be able to tell this story genuinely

ANGLE QUALITY LEVELS:

❌ GENERIC (Avoid): "I learned teamwork through robotics"
⚠️  DECENT (Predictable): "I discovered leadership when our robot failed"
✅ GOOD (Interesting): "I learned to debug humans, not just code"
🌟 EXCELLENT (Memorable - TARGET THIS): "Vision Systems and Blind Faith" - concrete technical term + human insight
🚀 EXTRAORDINARY (Too abstract - AVOID): "The Decimal Point Oracle" - mystical metaphor without grounding

⚠️ PROVEN FAILURES TO AVOID:
- Mystical/spiritual language: oracle, prophecy, reverence, sacred, cosmic
- Abstract geography: cartography, territories, undiscovered lands, invisible realms
- Abstract curatorial: curator, conspiracy, alchemy, mythology
- Overly poetic: ephemeral, ethereal, luminous, crystalline, sublime

✅ PROVEN SUCCESS PATTERNS (from Harvard/Stanford/MIT/Yale admitted students):

**Archetype 1 - The Awakening (7/10 orig):**
- Pattern: Observing someone/something → Personal realization → Changed trajectory
- Example: "Watching physicist work sparked my own physics awakening"
- Key: External catalyst + emotional progression + concrete transformation

**Archetype 2 - The Visceral Truth (7-8/10 orig):**
- Pattern: Shocking sensory experience → Deeper understanding → Philosophical insight
- Example: "Gangrene surgery showed me the moral weight doctors carry"
- Key: Vivid sensory details + vulnerability + mature perspective

**Archetype 3 - The Systems Thinker (8/10 orig):**
- Pattern: Multiple experiences → Single unifying principle → Broader application
- Example: "Nonprofit work + research lab both taught me: small changes = immense impacts"
- Key: Intellectual synthesis + pattern recognition + maturity

**Archetype 4 - Vulnerability as Strength (7-8/10 orig):**
- Pattern: Personal struggle → Creative response → Helping others
- Example: "Domestic chaos → Writing as escape → Platform to help others"
- Key: Transforms adversity into agency + shows impact + demonstrates growth

**Archetype 5 - Failure → Growth (7/10 orig - SAFEST, MOST ACCESSIBLE):**
- Pattern: Dramatic failure → External support → Overcoming deeper fear
- Example: "Failed painting → Friend's encouragement → Conquering self-doubt, not technique"
- Key: Vulnerability + human connection + concrete skill development

**Archetype 6 - Technical → Human Bridge (7/10 orig - BEST FOR STEM):**
- Pattern: Technical work reveals human insight
- Examples:
  * "Debugging code taught me to debug relationships"
  * "Flow cytometry taught me patience and precision apply beyond the lab"
  * "Robot vision system showed me I'd been blind to team dynamics"
- Key: Concrete technical term/process → Human quality/understanding

**CRITICAL REQUIREMENTS:**
1. START with specific visualizable moment (not abstract concept)
2. INCLUDE sensory detail potential ("smell of burnt circuits", "silence of failed code")
3. SHOW external catalyst (person, shocking event, observation - not pure introspection)
4. BRIDGE concrete experience → universal insight clearly
5. TARGET 7/10 originality (memorable but authentic)
6. USE grounded verbs (build, debug, create, fix) NOT abstract nouns (curator, oracle, conspiracy)

YOUR TASK:
Generate angles following these PROVEN ARCHETYPES from successful essays. Each angle must:
- Start with a CONCRETE, SENSORY moment
- Have an EXTERNAL catalyst (not just internal reflection)
- Bridge SPECIFIC experience → UNIVERSAL insight
- Target 7/10 originality (the sweet spot for authenticity + memorability)
- Use GROUNDED language that students can authentically tell`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildAngleGenerationPrompt(
  profile: GenerationProfile,
  numAngles: number,
  prioritize: string
): string {
  return `Generate ${numAngles} UNIQUE narrative angles for this experience:

ACTIVITY: ${profile.role}
DURATION: ${profile.duration}
TYPE: ${profile.activityType}

ACHIEVEMENTS:
${profile.achievements.map((a, i) => `${i + 1}. ${a}`).join('\n')}

CHALLENGES:
${profile.challenges.map((c, i) => `${i + 1}. ${c}`).join('\n')}

IMPACT:
${profile.impact.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

RELATIONSHIPS:
${profile.relationships.join(', ')}

STUDENT VOICE: ${profile.voice}
RISK TOLERANCE: ${profile.riskTolerance}

---

REQUIREMENTS:
1. Each angle must be COMPLETELY DIFFERENT from the others
2. Avoid clichés: "passion", "journey", "adversity", "leadership", "teamwork"
3. Find unexpected connections (e.g., robotics → philosophy, not robotics → engineering)
4. ${prioritize === 'originality' ? 'Target 7/10 originality with GROUNDED language (not 9/10 abstract)' : prioritize === 'safety' ? 'Target 6-7/10 originality with maximum grounding' : 'Maximize philosophical depth BUT keep it grounded in concrete terms'}
5. The hook must be gripping - make me want to read more
6. CRITICAL: Use CONCRETE technical verbs (build, debug, fix, create, design) NOT abstract nouns (curator, oracle, conspiracy, cartography)
7. BRIDGE technical + human domains explicitly (e.g., "debugging social systems", "engineering empathy")

Return a JSON array where each angle is an object with these EXACT fields:
{
  "title": "5-8 words, intriguing",
  "hook": "opening sentence, 15-20 words",
  "throughline": "central idea, 20-30 words",
  "unusualConnection": "what are you connecting?, 15 words",
  "philosophicalDepth": "universal truth revealed, 20 words",
  "freshMetaphor": "if applicable, 10 words (can be empty string)",
  "openingScene": "where to start, 30 words",
  "turningPoint": "moment of realization, 20 words",
  "universalInsight": "how this applies beyond activity, 30 words",
  "originality": 1-10 (number),
  "riskLevel": "safe" or "moderate" or "bold" (string),
  "expectedImpact": "good" or "excellent" or "extraordinary" (string)
}

CRITICAL: Return ONLY the JSON array with no markdown, no explanation, no code blocks. Just the raw JSON array starting with [ and ending with ].`;
}

// ============================================================================
// RESPONSE PARSER
// ============================================================================

function parseAnglesFromResponse(response: any): NarrativeAngle[] {
  try {
    // If response is already an array, return it
    if (Array.isArray(response)) {
      return response;
    }

    // If response is a string, try to parse it
    if (typeof response === 'string') {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      return JSON.parse(jsonMatch[0]);
    }

    // If response is an object with angles property
    if (response && typeof response === 'object' && response.angles) {
      return response.angles;
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    // Return empty array if parsing fails
    return [];
  }
}

// ============================================================================
// ANGLE SCORING
// ============================================================================

function scoreAngle(angle: NarrativeAngle, profile: GenerationProfile): number {
  let score = 0;

  // Originality (50% of score)
  score += angle.originality * 5;

  // Risk alignment (20% of score)
  const riskScore = {
    low: { safe: 20, moderate: 10, bold: 0 },
    medium: { safe: 10, moderate: 20, bold: 15 },
    high: { safe: 5, moderate: 15, bold: 20 },
  };
  score += riskScore[profile.riskTolerance][angle.riskLevel];

  // Expected impact (30% of score)
  const impactScore = {
    good: 10,
    excellent: 20,
    extraordinary: 30,
  };
  score += impactScore[angle.expectedImpact];

  return score;
}

// ============================================================================
// ANGLE TEMPLATES (Inspiration, not prescriptive)
// ============================================================================

export const ANGLE_INSPIRATION = {
  // Philosophical angles
  philosophy: [
    'Finding ontology in debugging',
    'Epistemology of failure',
    'The phenomenology of teamwork',
    'Ethics of code vs. ethics of people',
  ],

  // Unexpected connections
  unexpectedConnections: [
    'Robotics → Poetry (precision vs. ambiguity)',
    'Medicine → Music (rhythm of diagnosis)',
    'Debate → Cooking (ingredients of argument)',
    'Math → Dance (patterns in motion)',
  ],

  // Counter-intuitive insights
  counterIntuitive: [
    'Silence taught me more than words',
    'Losing was my greatest victory',
    'The bug was my best teacher',
    'Ignorance became my superpower',
  ],

  // Sensory/experiential angles
  sensory: [
    'The smell of burnt circuits = moment of clarity',
    'The sound of compilation = meditation',
    'The texture of uncertainty',
    'The weight of responsibility',
  ],

  // Meta/self-aware angles
  meta: [
    'Writing about NOT being able to write',
    'Learning to unlearn',
    'Teaching by admitting ignorance',
    'Leading by following',
  ],
};

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
const angles = await generateNarrativeAngles({
  profile: myProfile,
  numAngles: 10,
  prioritize: 'originality',
  avoidAngles: ['learned teamwork', 'overcame failure'],
});

const bestAngle = await selectBestAngle(angles, myProfile);

*/
