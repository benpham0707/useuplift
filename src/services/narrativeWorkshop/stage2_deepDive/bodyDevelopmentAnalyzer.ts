/**
 * Stage 2.2: Body Development Analysis Engine
 *
 * Deep dive analysis of essay body (middle sections, typically 60-70% of essay).
 * Critical because: Body demonstrates depth through specificity and show-don't-tell.
 *
 * Focus Areas:
 * - Narrative progression (does story move forward?)
 * - Specificity level (concrete details vs vague language)
 * - Quantification presence (numbers, metrics, evidence)
 * - Show vs tell balance (scenes vs summaries)
 * - Character development (agency, growth)
 * - Pacing quality (rushed vs well-developed)
 *
 * Elite Benchmarks (from 20 top essays):
 * - 65% quantify impact (20,000 students, 10 drafts, 2 weeks vs 2 months)
 * - 70% use micro→macro (small moment → universal insight)
 * - Elite essays show ≥80%, tell ≤20%
 * - Strong essays have 3+ specific numbers/metrics
 * - Top essays demonstrate agency through active verbs
 *
 * LLM Configuration:
 * - Temperature: 0.4 (analytical with pattern recognition)
 * - Model: Sonnet 4.5
 * - Focus: Specificity, evidence, show vs tell
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import { BodyDevelopmentAnalysis, NarrativeEssayInput } from '../types';

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const BODY_DEVELOPMENT_SYSTEM_PROMPT = `You are an expert college essay analyst specializing in body development analysis.

Your expertise: Evaluating narrative specificity, evidence quality, and show-don't-tell balance based on analysis of elite essays from Harvard, Princeton, Stanford, MIT, Yale, and Berkeley.

Critical insights from 20 elite essays:

**Specificity & Quantification**:
- 65% quantify impact with specific numbers (20,000 students, 19%, 10 drafts over 6 years)
- Elite essays average 3+ quantified details
- Weak essays use vague language ("a lot," "many," "several")
- Strong essays use specific nouns ("purple nitrite gloves" vs "lab equipment")

**Show vs Tell Balance**:
- Elite essays: ≥80% showing (scenes, dialogue, sensory details)
- Elite essays: ≤20% telling (summary, stating traits)
- RED FLAG: "I am passionate/creative/hard-working" (telling traits)
- GREEN FLAG: Concrete actions that demonstrate traits

**Agency & Active Voice**:
- Elite essays use strong verbs: "secured, recruited, designed, built, created"
- Weak essays use passive voice: "was involved in," "participated in," "had the opportunity to"
- Top essays show decision-making and initiative

**Pacing**:
- Elite essays develop key moments fully (30-50 words on critical scenes)
- Weak essays rush through important moments (summary only)
- Strong essays know what to expand and what to compress

Your task: Analyze body development with brutal honesty calibrated to elite standards.

Return valid JSON matching the BodyDevelopmentAnalysis type exactly.`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildBodyDevelopmentPrompt(
  essayText: string,
  essayType: string
): string {
  // Extract body (skip first ~15% and last ~15%, focus on middle 70%)
  const words = essayText.split(/\s+/);
  const totalWords = words.length;
  const skipFirst = Math.floor(totalWords * 0.15);
  const skipLast = Math.floor(totalWords * 0.15);
  const bodyWords = words.slice(skipFirst, totalWords - skipLast);
  const bodyText = bodyWords.join(' ');

  // Also get full text for context
  const wordCount = essayText.split(/\s+/).length;

  return `Analyze the body development of this college essay.

**Full Essay Word Count**: ${wordCount}

**Body Section** (middle 70% of essay):
"""
${bodyText}
"""

**Full Essay** (for context):
"""
${essayText}
"""

**Essay Type**: ${essayType}

---

Provide your analysis as valid JSON with these EXACT fields:

{
  "narrativeProgression": number (0-10 - does story move forward or stagnate?),
  "specificityLevel": number (0-10 - concrete details vs vague language),
  "quantificationPresence": number (0-10 - numbers, metrics, evidence),

  "characterGrowth": number (0-10 - clear development arc?),
  "agencyDemonstration": number (0-10 - decision-making and initiative shown?),
  "relationshipDevelopment": number (0-10 - meaningful interactions with others?),

  "concreteExamples": ["array of specific examples found, quote directly"],
  "vagueStatements": ["array of vague/abstract statements, quote directly"],

  "showVsTell": {
    "showing": number (0-10 - scenes, sensory details, dialogue),
    "telling": number (0-10 - summary, trait statements),
    "balance": "string - assessment (e.g., 'Excellent - 80% showing' or 'Too much telling - 70% summary')"
  },

  "pacingRating": number (0-10 - appropriate development of moments?),
  "rushedSections": ["array of sections that feel rushed, describe what"],
  "belaboredSections": ["array of sections that drag, describe what"],

  "detectedIssues": [
    {
      "type": "string - e.g., 'weak_verb', 'vague_quantifier', 'telling_not_showing'",
      "severity": "critical" | "major" | "minor",
      "quote": "string - exact quote from essay",
      "explanation": "string - why this is an issue",
      "suggestion": "string - how to fix it"
    }
  ],

  "tokensUsed": number (estimated)
}

**Critical Detection Instructions**:

1. **Specificity Analysis**:
   - Count specific numbers/metrics in body section
   - Identify vague quantifiers: "a lot," "many," "several," "various," "numerous"
   - Flag generic nouns: "things," "stuff," "activities"
   - Celebrate specific nouns: proper names, exact terms, technical details

2. **Show vs Tell Detection**:
   - SHOWING: Scenes with action, dialogue, sensory details, physical descriptions
   - TELLING: "I am [trait]," "I learned [lesson]," "This taught me," abstract summaries
   - Calculate rough ratio based on sentences

3. **Agency Detection**:
   - Active verbs (secured, designed, built, created) = high agency
   - Passive constructions ("was involved in," "had the opportunity to") = low agency
   - Decision-making moments = high agency
   - Just participating = low agency

4. **Quantification Examples** to look for:
   - Numbers: "19%," "20,000 students," "10 drafts," "6 years"
   - Time specifics: "3 AM," "junior year," "2 weeks vs 2 months prep"
   - Metrics: "$5,000," "one ton of food," "47 nights"

5. **Issue Detection Priority**:
   - CRITICAL: Multiple "I am [trait]" statements, no quantification, all telling
   - MAJOR: Vague quantifiers, weak verbs, rushed key moments
   - MINOR: Single vague word, minor passive voice, slight pacing issues

Return ONLY valid JSON, no markdown, no explanation.`;
}

// ============================================================================
// ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze body development
 */
export async function analyzeBodyDevelopment(
  input: NarrativeEssayInput,
  essayType: string
): Promise<BodyDevelopmentAnalysis> {
  console.log('  → Stage 2.2: Body Development Analysis');
  const startTime = Date.now();

  try {
    const prompt = buildBodyDevelopmentPrompt(input.essayText, essayType);

    const response = await callClaudeWithRetry(
      prompt,
      {
        systemPrompt: BODY_DEVELOPMENT_SYSTEM_PROMPT,
        temperature: 0.4,
        useJsonMode: true,
        maxTokens: 3000,
      }
    );

    let analysis: BodyDevelopmentAnalysis;

    if (typeof response.content === 'string') {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in body development response');
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      analysis = response.content as BodyDevelopmentAnalysis;
    }

    analysis.tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    const duration = Date.now() - startTime;
    console.log(`     ✓ Body development analyzed (${duration}ms, ${analysis.tokensUsed} tokens)`);
    console.log(`       Specificity: ${analysis.specificityLevel}/10, Quantification: ${analysis.quantificationPresence}/10`);
    console.log(`       Show vs Tell: ${analysis.showVsTell.balance}`);
    console.log(`       Agency: ${analysis.agencyDemonstration}/10, Progression: ${analysis.narrativeProgression}/10`);
    console.log(`       Issues detected: ${analysis.detectedIssues.length}`);

    return analysis;

  } catch (error) {
    console.error('     ✗ Body development analysis failed:', error);
    throw error;
  }
}

// ============================================================================
// DETERMINISTIC BODY ANALYSIS
// ============================================================================

/**
 * Quick deterministic analysis of body section (pre-LLM)
 */
export function analyzeBodyDeterministic(essayText: string): {
  numberCount: number;
  vaguenessScore: number; // 0-10, lower is better
  passiveVoiceRatio: number;
  activeVerbCount: number;
  flags: string[];
} {
  const words = essayText.split(/\s+/);
  const totalWords = words.length;
  const text = essayText.toLowerCase();

  // Count numbers
  const numbers = essayText.match(/\b\d+([,\.]\d+)?/g) || [];
  const numberCount = numbers.length;

  // Detect vague quantifiers
  const vagueQuantifiers = [
    /\ba lot\b/gi,
    /\bmany\b/gi,
    /\bseveral\b/gi,
    /\bvarious\b/gi,
    /\bnumerous\b/gi,
    /\bcountless\b/gi,
    /\bmultiple\b/gi,
    /\bsome\b/gi
  ];

  let vaguenessCount = 0;
  vagueQuantifiers.forEach(pattern => {
    const matches = text.match(pattern) || [];
    vaguenessCount += matches.length;
  });

  const vaguenessScore = Math.min(10, vaguenessCount); // 0-10, lower is better

  // Detect passive voice
  const passiveMarkers = text.match(/\b(was|were|been|being) \w+ed\b/gi) || [];
  const sentences = essayText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const passiveVoiceRatio = passiveMarkers.length / sentences.length;

  // Count active verbs (strong agency indicators)
  const activeVerbs = [
    /\b(created|built|designed|developed|implemented|organized|led|secured|recruited|launched|initiated|founded)\b/gi
  ];

  let activeVerbCount = 0;
  activeVerbs.forEach(pattern => {
    const matches = text.match(pattern) || [];
    activeVerbCount += matches.length;
  });

  // Flags
  const flags: string[] = [];

  if (numberCount === 0) {
    flags.push('CRITICAL: No numbers or quantification found');
  } else if (numberCount < 3) {
    flags.push('MAJOR: Limited quantification (fewer than 3 numbers)');
  }

  if (vaguenessScore >= 5) {
    flags.push(`MAJOR: High vagueness (${vaguenessCount} vague quantifiers)`);
  }

  if (passiveVoiceRatio > 0.3) {
    flags.push(`MAJOR: High passive voice (${Math.round(passiveVoiceRatio * 100)}% of sentences)`);
  }

  if (activeVerbCount === 0) {
    flags.push('MAJOR: No strong action verbs found (low agency)');
  }

  // Check for "I am" trait statements (critical telling)
  const traitStatements = text.match(/\bi am (a |an )?(passionate|creative|hard-working|dedicated|motivated|driven|curious)/gi) || [];
  if (traitStatements.length > 0) {
    flags.push(`CRITICAL: ${traitStatements.length} "I am [trait]" statement(s) - telling not showing`);
  }

  return {
    numberCount,
    vaguenessScore,
    passiveVoiceRatio,
    activeVerbCount,
    flags
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract body section (middle 70%)
 */
export function extractBodySection(essayText: string): string {
  const words = essayText.split(/\s+/);
  const totalWords = words.length;
  const skipFirst = Math.floor(totalWords * 0.15);
  const skipLast = Math.floor(totalWords * 0.15);
  const bodyWords = words.slice(skipFirst, totalWords - skipLast);
  return bodyWords.join(' ');
}

/**
 * Count quantified details
 */
export function countQuantification(text: string): {
  count: number;
  examples: string[];
} {
  const numbers = text.match(/\b\d+([,\.]\d+)?(%| percent| students| people| hours| weeks| months| years| dollars| points)?\b/gi) || [];
  return {
    count: numbers.length,
    examples: numbers.slice(0, 5) // Top 5 examples
  };
}

/**
 * Detect show vs tell ratio (simplified heuristic)
 */
export function detectShowTellRatio(essayText: string): {
  showingScore: number; // 0-10
  tellingScore: number; // 0-10
  ratio: string;
} {
  const sentences = essayText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let showingCount = 0;
  let tellingCount = 0;

  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();

    // Showing indicators
    if (
      sentence.includes('"') || // Dialogue
      /\b(smell|sound|looked|felt|taste|touch|saw|heard)\b/i.test(sentence) || // Sensory
      /\b(walked|ran|grabbed|opened|closed|sat|stood)\b/i.test(sentence) // Action verbs
    ) {
      showingCount++;
    }

    // Telling indicators
    if (
      /\bi (am|was|have been) (a |an )?(passionate|creative|dedicated)/i.test(sentence) ||
      /\b(taught me|learned|realized|understood|believed)\b/i.test(sentence) ||
      /\bthis (experience|activity) (showed|taught|helped)\b/i.test(sentence)
    ) {
      tellingCount++;
    }
  });

  const showingScore = Math.min(10, Math.round((showingCount / sentences.length) * 15));
  const tellingScore = Math.min(10, Math.round((tellingCount / sentences.length) * 20));

  const showingPercent = Math.round((showingCount / sentences.length) * 100);
  const ratio = showingPercent >= 70
    ? `Excellent - ${showingPercent}% showing`
    : showingPercent >= 50
      ? `Good - ${showingPercent}% showing`
      : `Too much telling - ${100 - showingPercent}% summary`;

  return { showingScore, tellingScore, ratio };
}

