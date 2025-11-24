/**
 * Voice Fingerprint Analyzer
 *
 * Analyzes the student's unique voice, tone, cadence, and stylistic markers.
 * This fingerprint is used to ensure that the "Surgical Editor" generates
 * fixes that sound authentically like the student.
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import { VoiceFingerprint } from '../types';

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const VOICE_FINGERPRINT_SYSTEM_PROMPT = `You are an expert writing coach specializing in voice analysis for elite college admissions.
Your task is to analyze the "Voice Fingerprint" of a student's essay.
We need to capture their unique style so that any edits we suggest sound exactly like them.

Analyze the text provided and output a JSON object with the following fields:

1. tone: string describing the emotional quality (e.g., "Earnest, self-deprecating", "Analytical and precise", "Warm and nostalgic", "Fast-paced and energetic").
   - AVOID generic labels like "Formal" or "Informal". Be specific to the writer's character.
2. cadence: string describing the rhythm and flow (e.g., "Short, punchy sentences", "Long, flowing complex sentences", "Varied rhythm with staccato emphasis").
3. vocabulary: string describing word choice level (e.g., "Simple, conversational", "Sophisticated and academic", "Rich with sensory details", "Uses technical jargon naturally").
4. markers: string[] array of specific stylistic habits that define their voice.
   - Examples: "Uses dashes often", "Starts sentences with And/But", "Uses rhetorical questions", "Uses specific proper nouns", "Uses humor/irony", "Uses dialogue fragments".
5. sampleSentences: string[] array of 3 exact sentences from the text that BEST exemplify this voice.
   - These will be used as "style transfer" references. Pick the most distinct, flavorful sentences.

Your goal is to create a "style guide" for this specific student that captures their AUTHENTICITY.
The output must be valid JSON matching the VoiceFingerprint interface.
`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildVoiceFingerprintPrompt(essayText: string): string {
  return `Analyze the voice fingerprint of this essay. Focus on what makes this writer unique.

"""
${essayText}
"""

Return ONLY the JSON object representing the VoiceFingerprint.`;
}

// ============================================================================
// ANALYZER FUNCTION
// ============================================================================

/**
 * Analyzes the voice fingerprint of an essay.
 */
export async function analyzeVoiceFingerprint(essayText: string): Promise<VoiceFingerprint> {
  console.log('🔍 Analyzing Voice Fingerprint...');
  const startTime = Date.now();

  try {
    const prompt = buildVoiceFingerprintPrompt(essayText);

    const response = await callClaudeWithRetry(
      prompt,
      {
        systemPrompt: VOICE_FINGERPRINT_SYSTEM_PROMPT,
        temperature: 0.2, // Low temperature for consistent analysis
        useJsonMode: true,
        maxTokens: 1000,
      }
    );

    let fingerprint: VoiceFingerprint;

    if (typeof response.content === 'string') {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      fingerprint = JSON.parse(jsonMatch[0]);
    } else if (typeof response.content === 'object') {
      fingerprint = response.content as VoiceFingerprint;
    } else {
      throw new Error('Unexpected response format');
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Voice Fingerprint Analysis complete (${duration}ms)`);
    console.log(`   Tone: ${fingerprint.tone}`);
    console.log(`   Cadence: ${fingerprint.cadence}`);
    console.log(`   Markers: ${fingerprint.markers.join(', ')}`);

    return fingerprint;

  } catch (error) {
    console.error('❌ Error in Voice Fingerprint Analysis:', error);
    // Return fallback
    return {
      tone: 'Neutral',
      cadence: 'Standard',
      vocabulary: 'Standard',
      markers: []
    };
  }
}
