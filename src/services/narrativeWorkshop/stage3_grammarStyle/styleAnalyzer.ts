/**
 * Stage 3.2: Writing Style Analyzer (LLM-based)
 *
 * Deep analysis of writing style, voice, and aesthetic qualities using LLM.
 * Complements deterministic grammar analysis with nuanced interpretation.
 *
 * Focus Areas:
 * - Formality level (casual ↔ academic)
 * - Energy level (flat ↔ dynamic)
 * - Warmth (cold ↔ warm)
 * - Confidence (uncertain ↔ assured)
 * - Rhythm & flow quality
 * - Imagery & sensory detail strength
 * - Metaphor quality
 * - Originality markers
 *
 * Elite Benchmarks (from 20 top essays):
 * - Formality: Conversational-formal (not too casual, not too academic)
 * - Energy: Dynamic without being frantic
 * - Warmth: Present but not saccharine
 * - Confidence: Assured without arrogance
 * - Rhythm: Varied, intentional pacing
 * - Imagery: Specific and sensory (not generic)
 * - Metaphors: Fresh, not overused
 * - Originality: Distinctive voice, memorable phrases
 *
 * LLM Configuration:
 * - Temperature: 0.3 (analytical for style assessment)
 * - Model: Sonnet 4.5
 * - Focus: Voice authenticity, aesthetic quality, memorability
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import { WritingStyleAnalysis, NarrativeEssayInput } from '../types';

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const STYLE_SYSTEM_PROMPT = `You are an expert writing style analyst specializing in college essay voice and aesthetic evaluation.

Your expertise: Evaluating voice authenticity, stylistic choices, and memorability based on analysis of elite essays from Harvard, Princeton, Stanford, MIT, Yale, and Berkeley.

Critical insights from 20 elite essays:

**Formality Balance**:
- ELITE: Conversational-formal (accessible but intelligent)
- Examples: "The worst stench I've ever smelled" (conversational), "I questioned the paradigm" (formal)
- NOT too casual: "like, totally crazy" (too informal)
- NOT too academic: "Subsequently, one must extrapolate" (too stiff)
- Sweet spot: Natural teenage voice with intellectual depth

**Energy & Dynamism**:
- ELITE: Varied pacing - fast moments (short sentences, urgency) + slow moments (reflection)
- Dynamic verbs, sensory language, specific details = high energy
- NOT flat: All same pace, no variation
- NOT frantic: All short sentences, feels rushed

**Warmth & Personality**:
- ELITE: Reader feels connection to narrator
- Achieved through: Vulnerability, humor, specific observations, quirks
- NOT cold: Clinical, detached, no personality
- NOT saccharine: Over-emotional, trying too hard

**Confidence Level**:
- ELITE: Assured but not arrogant
- Shows through: Specific claims, direct language, owning experiences
- NOT uncertain: "maybe," "I think," "kind of," excessive hedging
- NOT arrogant: "I'm the best," superiority, dismissing others

**Rhythm & Flow**:
- ELITE: Intentional pacing - knows when to speed up/slow down
- Sentence variety creates musicality
- Transitions feel natural, not mechanical
- Paragraph breaks strategic

**Imagery & Sensory Detail**:
- ELITE: Specific visuals, sounds, smells, tactile sensations
- Examples: "purple nitrite gloves," "3 AM fluorescent hum," "clammy hands"
- NOT generic: "beautiful sunset," "nice feeling," "looked good"
- Sensory details = immersion

**Metaphor Quality**:
- ELITE: Fresh, organic to narrative
- Examples: "dreams fell like the Berlin wall," "fireball of ambition"
- NOT forced: Metaphor for sake of metaphor
- NOT clichéd: "light at end of tunnel," "journey of life"

**Originality Markers**:
- Unique phrases that stick with reader
- Unexpected word combinations
- Distinctive perspective on common experiences
- Memorable opening/closing lines

Your task: Analyze writing style with elite-calibrated precision for voice and memorability.

Return valid JSON matching the StyleAnalysis type exactly.`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildStylePrompt(essayText: string, essayType: string): string {
  const wordCount = essayText.split(/\s+/).length;

  // Extract opening and closing for voice consistency check
  const words = essayText.split(/\s+/);
  const opening50 = words.slice(0, 50).join(' ');
  const closing50 = words.slice(-50).join(' ');

  return `Analyze the writing style and voice of this college essay.

**Full Essay**:
"""
${essayText}
"""

**Opening (first 50 words)**:
"""
${opening50}
"""

**Closing (last 50 words)**:
"""
${closing50}
"""

**Essay Type**: ${essayType}
**Word Count**: ${wordCount}

---

Provide your analysis as valid JSON with these EXACT fields:

{
  "formalityLevel": number (1-10: 1=very casual, 5=conversational-formal, 10=academic),
  "formalityAssessment": "string - is level appropriate for college essay?",

  "energyLevel": number (1-10: 1=flat, 5=moderate, 10=dynamic),
  "energyDescription": "string - how essay creates or lacks energy",

  "warmth": number (1-10: 1=cold/clinical, 5=balanced, 10=very warm),
  "warmthDescription": "string - how personality comes through",

  "confidence": number (1-10: 1=uncertain, 5=appropriately assured, 10=arrogant),
  "confidenceMarkers": ["array of examples showing confidence level"],

  "rhythmQuality": number (0-10 - intentional pacing?),
  "rhythmDescription": "string - assessment of sentence rhythm and flow",
  "pacingVariation": "varied" | "mostly_steady" | "monotonous",

  "imageryStrength": number (0-10 - specific, sensory details?),
  "imageryExamples": [
    {
      "quote": "string - sensory detail from essay",
      "type": "visual" | "auditory" | "tactile" | "olfactory" | "gustatory",
      "effectiveness": number (0-10)
    }
  ],

  "metaphorPresent": boolean,
  "metaphorQuality": number (0-10 - if present, how effective?),
  "metaphorExamples": ["array of metaphors/similes found"],
  "metaphorFreshness": "fresh_original" | "adequate" | "cliched" | "n/a",

  "originalityScore": number (0-10 - memorable, distinctive voice?),
  "memorablePhrases": ["array of unique/striking phrases"],
  "voiceDistinctiveness": "highly_distinctive" | "clear_personality" | "generic" | "trying_too_hard",

  "voiceConsistency": number (0-10 - same voice throughout?),
  "voiceInconsistencies": ["array of places where voice shifts oddly"],

  "overallStyleScore": number (0-10),
  "styleStrengths": ["array of what works well"],
  "styleWeaknesses": ["array of what needs improvement"],

  "tokensUsed": number (estimated)
}

**Critical Assessment Instructions**:

1. **Formality Calibration**:
   - Check for teenage authenticity (not adult resume voice)
   - Look for conversational markers: contractions, natural rhythm, accessible language
   - Check for intellectual depth: sophisticated ideas, nuanced thinking
   - Red flag: "This experience taught me" (robotic adult voice)
   - Green flag: Natural teen voice with depth

2. **Energy Detection**:
   - HIGH: Short punchy sentences, action verbs, specific sensory details, urgency
   - LOW: All same length, passive voice, abstract language, no variation
   - Look at sentence variety, verb strength, detail specificity
   - Check pacing: Does essay know when to speed up/slow down?

3. **Warmth Assessment**:
   - Warmth = personality, vulnerability, humor, quirks, specific observations
   - NOT warmth = generic positivity, forced enthusiasm
   - Check: Can you "hear" a specific person? Feel connection to narrator?

4. **Confidence Markers**:
   - CONFIDENT: Direct statements, specific claims, owns experiences
   - UNCERTAIN: "maybe," "I think," "kind of," "sort of," excessive hedging
   - ARROGANT: Superiority, dismissing others, "I'm the best"
   - Find balance: assured but humble

5. **Imagery Quality**:
   - EXCELLENT: "purple nitrite gloves," "3 AM fluorescent hum," "clammy hands"
   - GOOD: "dimly lit lab," "morning sunlight," "rough texture"
   - WEAK: "beautiful," "nice," "good," "looked pretty"
   - Count sensory details, evaluate specificity

6. **Metaphor Evaluation**:
   - FRESH: Unexpected comparison, organic to narrative
   - ADEQUATE: Clear comparison, serves purpose
   - CLICHÉD: "light at end of tunnel," "tip of iceberg," "journey"
   - FORCED: Doesn't fit narrative, trying too hard to be poetic

7. **Originality Assessment**:
   - Memorable phrases that stick with reader
   - Unique perspective on common experiences
   - Unexpected word combinations
   - Distinctive voice - could only be this writer
   - NOT generic: could be anyone's essay

Return ONLY valid JSON, no markdown, no explanation.`;
}

// ============================================================================
// ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze writing style using LLM
 */
export async function analyzeStyle(
  input: NarrativeEssayInput,
  essayType: string
): Promise<WritingStyleAnalysis> {
  console.log('  → Stage 3.2: Writing Style Analysis (LLM)');
  const startTime = Date.now();

  try {
    const prompt = buildStylePrompt(input.essayText, essayType);

    const response = await callClaudeWithRetry(
      prompt,
      {
        systemPrompt: STYLE_SYSTEM_PROMPT,
        temperature: 0.3,
        useJsonMode: true,
        maxTokens: 3000,
      }
    );

    let analysis: WritingStyleAnalysis;

    if (typeof response.content === 'string') {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in style analysis response');
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      analysis = response.content as WritingStyleAnalysis;
    }

    analysis.tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    const duration = Date.now() - startTime;
    console.log(`     ✓ Style analyzed (${duration}ms, ${analysis.tokensUsed} tokens)`);
    console.log(`       Formality: ${analysis.formalityLevel}/10, Energy: ${analysis.energyLevel}/10`);
    console.log(`       Warmth: ${analysis.warmth}/10, Confidence: ${analysis.confidence}/10`);
    console.log(`       Imagery: ${analysis.imageryStrength}/10, Originality: ${analysis.originalityScore}/10`);
    console.log(`       Voice distinctiveness: ${analysis.voiceDistinctiveness}`);
    console.log(`       Overall style: ${analysis.overallStyleScore}/10`);

    return analysis;

  } catch (error) {
    console.error('     ✗ Style analysis failed:', error);
    throw error;
  }
}

