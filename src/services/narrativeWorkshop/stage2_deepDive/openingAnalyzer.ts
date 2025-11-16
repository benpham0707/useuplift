/**
 * Stage 2.1: Opening Analysis Engine
 *
 * Deep dive analysis of essay opening (first 1-2 paragraphs or ~100 words).
 * Critical because: First 10 words determine whether AO engages or skims.
 *
 * Focus Areas:
 * - Hook effectiveness (specific scene, dialogue, provocative claim)
 * - Opening scene quality (temporal/spatial anchors, sensory details)
 * - Context establishment without backstory dump
 * - Engagement prediction (will reader keep reading?)
 *
 * Elite Benchmarks (from 20 top essays):
 * - 60% use sensory/visceral opening ("worst stench," "clammy hands")
 * - 0% use generic openings ("ever since I was young")
 * - Strong essays hook in first 10 words
 * - Elite essays establish scene + voice in first paragraph
 *
 * LLM Configuration:
 * - Temperature: 0.5 (analytical with some interpretive flexibility)
 * - Model: Sonnet 4.5
 * - Focus: Opening quality, hook strength, engagement
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import { OpeningAnalysis, NarrativeEssayInput } from '../types';
import { OPENING_PATTERNS } from '../narrativePatterns';

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const OPENING_ANALYZER_SYSTEM_PROMPT = `You are an expert college essay analyst specializing in opening analysis.

Your expertise: Evaluating essay hooks and openings based on analysis of thousands of essays from Harvard, Princeton, Stanford, MIT, Yale, and Berkeley admits.

Critical insights from 20 elite essays:
- 60% use sensory/visceral openings ("worst stench I ever encountered," "clammy hands," "purple nitrite gloves")
- 0% use generic openings ("Ever since I was young," "The dictionary defines," "Throughout my life")
- Strong essays hook readers in first 10 words
- Elite essays establish SCENE (time + place + sensory detail) in first paragraph
- Opening types ranked by effectiveness:
  1. ELITE: Specific scene with sensory detail
  2. ELITE: Dialogue that reveals character/conflict
  3. STRONG: Provocative claim/paradox
  4. WEAK: Question (unless exceptionally specific)
  5. CRITICAL FAILURE: Generic childhood reference or abstract statement

Your task: Analyze the opening with brutal honesty calibrated to elite standards.

Return valid JSON matching the OpeningAnalysis type exactly.`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildOpeningAnalysisPrompt(
  essayText: string,
  essayType: string
): string {
  // Extract opening (first 100 words or first 2 paragraphs, whichever is shorter)
  const paragraphs = essayText.split('\n\n');
  const firstTwoParagraphs = paragraphs.slice(0, 2).join('\n\n');
  const first100Words = essayText.split(/\s+/).slice(0, 100).join(' ');

  const opening = firstTwoParagraphs.length < first100Words.length
    ? firstTwoParagraphs
    : first100Words;

  const firstSentence = essayText.split(/[.!?]/)[0] || '';
  const first10Words = essayText.split(/\s+/).slice(0, 10).join(' ');

  return `Analyze this essay opening with brutal honesty calibrated to elite college essay standards.

**Full Essay Opening** (~first 100 words):
"""
${opening}
"""

**First Sentence**:
"${firstSentence}"

**First 10 Words**:
"${first10Words}"

**Essay Type**: ${essayType}

---

Provide your analysis as valid JSON with these EXACT fields:

{
  "hookType": "scene" | "dialogue" | "provocative_claim" | "question" | "generic" | "none",
  "hookStrength": number (0-10),
  "hookQuote": "string - exact quote of hook (first sentence)",
  "hookAnalysis": "string - 2-3 sentences analyzing hook effectiveness",

  "hasOpeningScene": boolean,
  "sceneVividness": number (0-10),
  "sensoryDetails": ["array of specific sensory details found"],
  "temporalAnchor": "string | null - time marker like '3am', 'junior year'",
  "spatialAnchor": "string | null - place marker like 'lab', 'kitchen table'",

  "contextClarity": number (0-10),
  "missingContext": ["array of strings - what's unclear or missing"],

  "readerEngagement": number (0-10 - will AO keep reading?),
  "improvementSuggestions": ["array of specific, actionable suggestions"],

  "weakExample": "string | null - example of weak opening for comparison",
  "strongExample": "string | null - example of elite opening for comparison",

  "tokensUsed": number (estimated)
}

**Critical Detection Instructions**:

1. **Hook Type Detection**:
   - "scene" = Opens in specific moment with time/place/sensory detail
   - "dialogue" = Opens with quoted speech
   - "provocative_claim" = Bold statement, paradox, or unconventional framing
   - "question" = Opens with question (usually weak unless very specific)
   - "generic" = "Ever since I was young," "The dictionary defines," "I have always been"
   - "none" = No clear hook, just stating facts

2. **Scene Requirements** (hasOpeningScene = true only if ALL present):
   - Temporal anchor (when): time of day, season, grade, year
   - Spatial anchor (where): specific location
   - At least ONE sensory detail (sight, sound, smell, touch, taste)

3. **Engagement Scoring** (readerEngagement):
   - 9-10: Elite hook, AO will definitely keep reading (specific scene + sensory)
   - 7-8: Strong hook, engaging opening
   - 5-6: Functional, clear context but not compelling
   - 3-4: Weak, generic or abstract
   - 0-2: Critical failure (generic childhood reference, dictionary definition)

4. **Improvement Suggestions**:
   - BE SPECIFIC: "Replace 'Ever since I was young' with specific moment: 'Junior year, 3 AM in the robotics lab...'"
   - NOT generic: "Add more details"
   - Include what to keep (if anything is strong)

5. **Examples**:
   - Weak example: Generic opening pattern this essay uses (if applicable)
   - Strong example: Elite opening that demonstrates what this should be

Return ONLY valid JSON, no markdown, no explanation.`;
}

// ============================================================================
// ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze essay opening
 */
export async function analyzeOpening(
  input: NarrativeEssayInput,
  essayType: string
): Promise<OpeningAnalysis> {
  console.log('  → Stage 2.1: Opening Analysis');
  const startTime = Date.now();

  try {
    const prompt = buildOpeningAnalysisPrompt(input.essayText, essayType);

    const response = await callClaudeWithRetry(
      prompt,
      {
        systemPrompt: OPENING_ANALYZER_SYSTEM_PROMPT,
        temperature: 0.5,
        useJsonMode: true,
        maxTokens: 2500,
      }
    );

    let analysis: OpeningAnalysis;

    if (typeof response.content === 'string') {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in opening analysis response');
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      analysis = response.content as OpeningAnalysis;
    }

    analysis.tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    const duration = Date.now() - startTime;
    console.log(`     ✓ Opening analyzed (${duration}ms, ${analysis.tokensUsed} tokens)`);
    console.log(`       Hook: ${analysis.hookType} (${analysis.hookStrength}/10)`);
    console.log(`       Scene: ${analysis.hasOpeningScene ? 'Yes' : 'No'} (vividness: ${analysis.sceneVividness}/10)`);
    console.log(`       Engagement: ${analysis.readerEngagement}/10`);

    return analysis;

  } catch (error) {
    console.error('     ✗ Opening analysis failed:', error);
    throw error;
  }
}

// ============================================================================
// DETERMINISTIC OPENING PATTERN DETECTION
// ============================================================================

/**
 * Detect opening patterns deterministically (before LLM call)
 * This provides fast feedback and can be used for validation
 */
export function detectOpeningPatterns(essayText: string): {
  detectedPatterns: string[];
  redFlags: string[];
  greenFlags: string[];
} {
  const firstParagraph = essayText.split('\n\n')[0] || '';
  const firstSentence = essayText.split(/[.!?]/)[0] || '';
  const first50Words = essayText.split(/\s+/).slice(0, 50).join(' ').toLowerCase();

  const detectedPatterns: string[] = [];
  const redFlags: string[] = [];
  const greenFlags: string[] = [];

  // Check against OPENING_PATTERNS from narrativePatterns.ts
  OPENING_PATTERNS.forEach(pattern => {
    let isDetected = false;

    if (pattern.detectionRegex) {
      isDetected = pattern.detectionRegex.test(first50Words);
    } else if (pattern.detectionFunction) {
      isDetected = pattern.detectionFunction(essayText);
    }

    if (isDetected) {
      detectedPatterns.push(pattern.patternId);

      if (pattern.severity === 'critical') {
        redFlags.push(`${pattern.patternName}: ${pattern.technicalExplanation}`);
      }
    }
  });

  // Green flags (positive patterns)
  if (firstSentence.includes('"')) {
    greenFlags.push('Opens with dialogue');
  }

  if (/\b(smell|sound|taste|looked|felt|cold|hot|bright|dark|loud|quiet)\b/i.test(firstParagraph)) {
    greenFlags.push('Contains sensory details');
  }

  if (/\b\d+/.test(firstSentence)) {
    greenFlags.push('Opens with specific number/detail');
  }

  return { detectedPatterns, redFlags, greenFlags };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract first N words from essay
 */
export function getFirstNWords(text: string, n: number): string {
  return text.split(/\s+/).slice(0, n).join(' ');
}

/**
 * Get opening paragraphs (first 1-2 paragraphs)
 */
export function getOpeningParagraphs(text: string, numParagraphs: number = 2): string {
  const paragraphs = text.split('\n\n');
  return paragraphs.slice(0, numParagraphs).join('\n\n');
}

/**
 * Check if opening is generic (fast deterministic check)
 */
export function isGenericOpening(essayText: string): boolean {
  const firstSentence = essayText.split(/[.!?]/)[0]?.toLowerCase() || '';

  const genericMarkers = [
    'ever since i was',
    'since i was young',
    'from a young age',
    'throughout my life',
    'growing up',
    'the dictionary defines',
    'according to',
    'i have always been'
  ];

  return genericMarkers.some(marker => firstSentence.includes(marker));
}

