/**
 * Stage 1: Holistic Understanding Engine
 *
 * This is the FIRST pass at the essay - a comprehensive overview that establishes
 * baseline understanding before deep-dive analysis.
 *
 * Purpose:
 * - Grasp the essay as a whole
 * - Identify central theme, narrative thread, voice
 * - Detect key structural elements
 * - Flag initial impressions and red flags
 * - Provide context for subsequent stages
 *
 * LLM Configuration:
 * - Temperature: 0.4 (moderate creativity for interpretation but still analytical)
 * - Model: Sonnet 4.5 (best balance of analysis + nuance)
 * - Single comprehensive prompt
 *
 * Based on elite essay patterns from 20 Harvard/Princeton/Stanford/MIT/Yale/Berkeley admits.
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import {
  NarrativeEssayInput,
  HolisticUnderstanding
} from './types';
import { inferEssayType, ESSAY_TYPE_PROFILES } from './essayTypeCalibration';

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const HOLISTIC_UNDERSTANDING_SYSTEM_PROMPT = `You are an expert college essay analyst who has reviewed thousands of essays for Harvard, Princeton, Stanford, MIT, Yale, and Berkeley admissions.

Your task: Provide a comprehensive holistic understanding of this essay in a single analytical pass.

Your analysis must be:
1. **Accurate**: Based on what's actually in the essay, not what should be there
2. **Specific**: Quote exact phrases, identify concrete patterns
3. **Calibrated to elite standards**: Compare to what top 10% of essays demonstrate
4. **Insightful**: Go beyond surface observations
5. **Structured**: Follow the exact JSON format provided

Critical context from analysis of 20 elite admitted student essays:

**Elite Essay Patterns (90-100 EQI)**:
- 85% have 2+ specific vulnerability moments ("19% on chemistry quiz," "my dreams fell like Berlin wall")
- 70% use micro→macro structure (small moment → universal insight)
- 65% quantify impact (20,000 students, 10 drafts over 6 years, 2 weeks vs 2 months prep)
- 60% use sensory/visceral opening ("worst stench," "clammy hands," "purple nitrite gloves")
- 0% use generic openings ("ever since I was young," "the dictionary defines")
- 0% maintain perfectionism facade (all show vulnerability)

**Voice Authenticity Markers**:
- Honest words: "honestly," "turns out," "actually"
- Physical emotion: "hands shook" vs "I was nervous"
- Specific nouns: "purple nitrite gloves" vs "lab equipment"
- Active verbs: "secured, recruited, designed" vs "was involved in"

**Red Flags to Detect**:
- Generic openings, essay-speak ("passion," "journey"), passive voice dominance
- No vulnerability, no conflict, no turning point
- Telling > showing, vague language, abstract reflection only
- Could be written by anyone (no cultural/personal markers)

Your response MUST be valid JSON matching the HolisticUnderstanding type exactly.`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildHolisticUnderstandingPrompt(input: NarrativeEssayInput): string {
  const { essayText, essayType, promptText, maxWords, studentContext } = input;

  const wordCount = essayText.split(/\s+/).length;
  const essayTypeInferred = essayType || inferEssayType(promptText, wordCount, essayText);
  const profile = ESSAY_TYPE_PROFILES[essayTypeInferred];

  return `Analyze this college essay holistically and provide comprehensive understanding.

**Essay Text**:
"""
${essayText}
"""

**Essay Metadata**:
- Type: ${essayTypeInferred} (${profile.typicalWordCount} words typical)
- Actual Word Count: ${wordCount}
${promptText ? `- Prompt: ${promptText}` : ''}
${maxWords ? `- Max Words: ${maxWords}` : ''}
${studentContext?.intendedMajor ? `- Intended Major: ${studentContext.intendedMajor}` : ''}

**Essay Type Expectations** (${essayTypeInferred}):
Primary Goal: ${profile.primaryGoal}
Must Have: ${profile.mustHave.join(', ')}

---

Provide your analysis as a JSON object with these EXACT fields (no markdown, no explanation, just the JSON object):

{
  "centralTheme": "string - What is the main idea/message in one sentence?",
  "narrativeThread": "string - Story arc summary in 2-3 sentences",
  "primaryVoice": "conversational" | "reflective" | "analytical" | "poetic" | "matter-of-fact",
  "voiceConsistency": number (0-10),

  "essayStructure": "chronological" | "thematic" | "moment-focused" | "montage" | "circular" | "unclear",
  "numberOfDistinctSections": number,
  "transitionQuality": number (0-10),

  "keyMoments": [
    {
      "type": "opening" | "conflict" | "turning_point" | "reflection" | "conclusion",
      "sentenceRange": [startSentenceNumber, endSentenceNumber],
      "description": "string - What happens in this moment",
      "effectiveness": number (0-10)
    }
  ],

  "identifiedThemes": ["string array - e.g., resilience, intellectual curiosity, community impact"],
  "emotionalArc": "string - Description of emotional journey",
  "universalInsight": "string | null - Big takeaway if present",

  "overallCoherence": number (0-10),
  "authenticitySignals": ["string array - What feels genuine, e.g., 'physical emotion descriptions', 'cultural specificity'"],
  "redFlags": ["string array - What feels problematic, e.g., 'generic opening', 'no vulnerability'"],
  "firstImpression": "string - Raw first-read impression",

  "estimatedStrengthTier": "exceptional" | "strong" | "competent" | "developing" | "weak",
  "comparisonToTypicalEssay": "string - How this compares to average vs elite",

  "analyzedAt": "ISO timestamp",
  "tokensUsed": number (estimated)
}

**Important Instructions**:
1. Quote exact phrases from essay in your analysis
2. Be brutally honest about weaknesses
3. Compare to elite standards (Harvard/Princeton/Stanford admits)
4. Identify specific patterns (vulnerability moments, quantification, sensory details)
5. Return ONLY the JSON object, no additional text or markdown

Begin your analysis:`;
}

// ============================================================================
// ANALYSIS FUNCTION
// ============================================================================

/**
 * Perform Stage 1: Holistic Understanding analysis
 */
export async function analyzeHolisticUnderstanding(
  input: NarrativeEssayInput
): Promise<HolisticUnderstanding> {
  console.log('\n' + '='.repeat(80));
  console.log('STAGE 1: HOLISTIC UNDERSTANDING');
  console.log('='.repeat(80) + '\n');

  const startTime = Date.now();

  try {
    // Build prompt
    const prompt = buildHolisticUnderstandingPrompt(input);

    console.log('📝 Calling Claude API for holistic analysis...');
    console.log(`   Essay length: ${input.essayText.split(/\s+/).length} words`);
    console.log(`   Essay type: ${input.essayType || 'inferred'}\n`);

    // Call Claude
    const response = await callClaudeWithRetry(
      prompt,
      {
        systemPrompt: HOLISTIC_UNDERSTANDING_SYSTEM_PROMPT,
        temperature: 0.4,
        useJsonMode: true,
        maxTokens: 4000,
      }
    );

    // Parse response
    let analysis: HolisticUnderstanding;

    if (typeof response.content === 'string') {
      // Extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      analysis = JSON.parse(jsonMatch[0]);
    } else if (typeof response.content === 'object') {
      analysis = response.content as HolisticUnderstanding;
    } else {
      throw new Error('Unexpected response format');
    }

    // Add metadata
    analysis.analyzedAt = new Date().toISOString();
    analysis.tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    const duration = Date.now() - startTime;

    console.log('✅ Holistic understanding complete');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Tokens used: ${analysis.tokensUsed}`);
    console.log(`   Central theme: ${analysis.centralTheme}`);
    console.log(`   Strength tier: ${analysis.estimatedStrengthTier}`);
    console.log(`   Voice: ${analysis.primaryVoice} (consistency: ${analysis.voiceConsistency}/10)`);
    console.log(`   Structure: ${analysis.essayStructure}`);
    console.log(`   Key moments identified: ${analysis.keyMoments.length}`);
    console.log(`   Authenticity signals: ${analysis.authenticitySignals.length}`);
    console.log(`   Red flags: ${analysis.redFlags.length}`);

    if (analysis.redFlags.length > 0) {
      console.log('\n⚠️  Red Flags Detected:');
      analysis.redFlags.forEach((flag, i) => {
        console.log(`   ${i + 1}. ${flag}`);
      });
    }

    if (analysis.authenticitySignals.length > 0) {
      console.log('\n✨ Authenticity Signals:');
      analysis.authenticitySignals.slice(0, 3).forEach((signal, i) => {
        console.log(`   ${i + 1}. ${signal}`);
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');

    return analysis;

  } catch (error) {
    console.error('❌ Error in holistic understanding analysis:', error);

    // Return fallback analysis on error
    const fallbackAnalysis: HolisticUnderstanding = {
      centralTheme: 'Error: Unable to analyze',
      narrativeThread: 'Analysis failed due to technical error',
      primaryVoice: 'matter-of-fact',
      voiceConsistency: 0,
      essayStructure: 'unclear',
      numberOfDistinctSections: 0,
      transitionQuality: 0,
      keyMoments: [],
      identifiedThemes: [],
      emotionalArc: 'Unable to determine',
      universalInsight: null,
      overallCoherence: 0,
      authenticitySignals: [],
      redFlags: ['Technical error in analysis'],
      firstImpression: 'Analysis failed',
      estimatedStrengthTier: 'weak',
      comparisonToTypicalEssay: 'Unable to compare due to error',
      analyzedAt: new Date().toISOString(),
      tokensUsed: 0
    };

    throw error; // Re-throw to allow retry logic
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract sentences from essay text
 */
function extractSentences(essayText: string): string[] {
  return essayText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Get sentence by index
 */
function getSentenceByIndex(essayText: string, index: number): string | null {
  const sentences = extractSentences(essayText);
  return sentences[index] || null;
}

/**
 * Get sentences in range
 */
function getSentencesInRange(
  essayText: string,
  startIndex: number,
  endIndex: number
): string[] {
  const sentences = extractSentences(essayText);
  return sentences.slice(startIndex, endIndex + 1);
}

// Export helper functions and constants
export {
  extractSentences,
  getSentenceByIndex,
  getSentencesInRange,
  HOLISTIC_UNDERSTANDING_SYSTEM_PROMPT,
};
