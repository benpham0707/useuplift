/**
 * Stage 2.3: Climax & Turning Point Analysis Engine
 *
 * Deep dive analysis of essay's climactic moment and turning point.
 * Critical because: Turning points show intellectual/emotional growth and self-awareness.
 *
 * Focus Areas:
 * - Climax identification (peak of tension/conflict)
 * - Turning point detection ("that's when I realized...")
 * - Stakes clarity (what's at risk?)
 * - Vulnerability moments (admitting uncertainty, failure, fear)
 * - Conflict presence and complexity
 *
 * Elite Benchmarks (from 20 top essays):
 * - 85% have 2+ vulnerability moments with specific details
 * - 95% have clear turning point (before → after realization)
 * - Elite essays show stakes explicitly (what could be lost)
 * - Strong essays have internal conflict (not just external challenges)
 * - Top essays use physical/sensory descriptions of emotional moments
 *
 * LLM Configuration:
 * - Temperature: 0.5 (analytical + interpretive for emotional nuance)
 * - Model: Sonnet 4.5
 * - Focus: Vulnerability, growth, transformation
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import { ClimaxTurningPointAnalysis, NarrativeEssayInput } from '../types';

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const CLIMAX_TURNING_POINT_SYSTEM_PROMPT = `You are an expert college essay analyst specializing in climax and turning point detection.

Your expertise: Identifying moments of transformation, vulnerability, and growth based on analysis of elite essays from Harvard, Princeton, Stanford, MIT, Yale, and Berkeley.

Critical insights from 20 elite essays:

**Vulnerability & Growth** (85% of elite essays):
- 2+ specific vulnerability moments: "I scored 19% on my chemistry quiz," "My dreams fell like the Berlin wall"
- Physical descriptions of emotion: "clammy hands," "stomach dropped," "hands shook"
- Honest admissions: "I didn't know," "I was wrong," "I was scared," "I failed"
- NOT generic: "it was challenging" (too vague)

**Turning Points** (95% of elite essays):
- Clear "aha moment": "That's when I realized," "Then I understood," "It hit me"
- Before vs after state clearly shown
- Specific moment, not gradual change
- Intellectual or emotional realization, not just outcome

**Stakes** (what elite essays establish):
- What could be lost: "Six months of research would be worthless"
- Who would be affected: "I'd have to tell Dr. Chen I wasted her grant money"
- Personal cost: "Three votes I had to prove wrong"
- NOT abstract: Must be concrete and specific

**Conflict Types**:
- ELITE: Internal (doubt, fear, misconception) + External (obstacle, failure)
- STRONG: Either internal or external clearly shown
- WEAK: No conflict, just smooth success story

Your task: Detect climax, turning points, vulnerability, and stakes with elite-calibrated precision.

Return valid JSON matching the ClimaxTurningPointAnalysis type exactly.`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildClimaxTurningPointPrompt(
  essayText: string,
  essayType: string
): string {
  // Extract middle 60% where climax usually occurs
  const words = essayText.split(/\s+/);
  const totalWords = words.length;
  const skipFirst = Math.floor(totalWords * 0.2);
  const skipLast = Math.floor(totalWords * 0.2);
  const middleWords = words.slice(skipFirst, totalWords - skipLast);
  const middleSection = middleWords.join(' ');

  return `Analyze this essay for climax, turning points, vulnerability, and stakes.

**Full Essay**:
"""
${essayText}
"""

**Middle Section** (where climax typically occurs):
"""
${middleSection}
"""

**Essay Type**: ${essayType}

---

Provide your analysis as valid JSON with these EXACT fields:

{
  "hasIdentifiableClimax": boolean,
  "climaxLocation": number | null (sentence index, 0-based),
  "climaxDescription": "string - what happens at climax",
  "climaxStrength": number (0-10),

  "hasTurningPoint": boolean,
  "turningPointType": "realization" | "decision" | "event" | "conversation" | "none",
  "turningPointQuote": "string | null - exact quote of turning point moment",
  "turningPointDepth": number (0-10 - how profound is the realization?),

  "stakesPresent": boolean,
  "stakesClarity": number (0-10 - how clear are the stakes?),
  "stakesDescription": "string - what's at risk, who's affected",
  "emotionalInvestment": number (0-10 - will reader care about outcome?),

  "conflictPresent": boolean,
  "conflictType": "internal" | "external" | "both" | "none",
  "conflictComplexity": number (0-10 - superficial vs nuanced),

  "vulnerabilityPresent": boolean,
  "vulnerabilityMoments": [
    {
      "quote": "string - exact quote showing vulnerability",
      "type": "emotional" | "intellectual" | "limitation_admission",
      "depth": number (0-10 - how genuine/specific is it?)
    }
  ],

  "improvementSuggestions": ["array of specific suggestions"],
  "tokensUsed": number (estimated)
}

**Critical Detection Instructions**:

1. **Climax Identification**:
   - Peak moment of tension/conflict before resolution
   - Usually in middle 50-70% of essay
   - Specific event or realization, not abstract summary
   - Quote the exact sentences where climax occurs

2. **Turning Point Detection**:
   - Look for markers: "that's when," "then I realized," "I understood," "it hit me," "for the first time"
   - MUST show before → after transformation
   - Specific moment, not gradual evolution
   - Types:
     * Realization: internal understanding shifts
     * Decision: choosing a path forward
     * Event: external catalyst changes perspective
     * Conversation: dialogue that transforms thinking

3. **Vulnerability Detection** (CRITICAL - must have 2+ for elite tier):
   - Specific admissions: "I scored 19%," "I didn't know," "I was wrong," "I failed"
   - Physical emotion: "clammy hands," "stomach dropped," "throat tight," "hands shook"
   - Fear/uncertainty: "I was scared," "I doubted," "I was lost"
   - NOT generic: "it was challenging" (too vague - doesn't count)
   - Count all instances, provide exact quotes

4. **Stakes Detection**:
   - What could be lost: research time, money, relationships, opportunity
   - Who would be affected: self, mentor, team, community
   - Personal cost: reputation, pride, trust, opportunity
   - Must be SPECIFIC: "six months wasted" not "things might not work out"

5. **Conflict Assessment**:
   - Internal: doubt, fear, misconception, competing values, identity struggle
   - External: obstacle, failure, opposition, resource constraints
   - Both: ideal for elite essays
   - None: red flag - essays need tension

Return ONLY valid JSON, no markdown, no explanation.`;
}

// ============================================================================
// ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze climax and turning point
 */
export async function analyzeClimaxTurningPoint(
  input: NarrativeEssayInput,
  essayType: string
): Promise<ClimaxTurningPointAnalysis> {
  console.log('  → Stage 2.3: Climax & Turning Point Analysis');
  const startTime = Date.now();

  try {
    const prompt = buildClimaxTurningPointPrompt(input.essayText, essayType);

    const response = await callClaudeWithRetry(
      prompt,
      {
        systemPrompt: CLIMAX_TURNING_POINT_SYSTEM_PROMPT,
        temperature: 0.5,
        useJsonMode: true,
        maxTokens: 3000,
      }
    );

    let analysis: ClimaxTurningPointAnalysis;

    if (typeof response.content === 'string') {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in climax analysis response');
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      analysis = response.content as ClimaxTurningPointAnalysis;
    }

    analysis.tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    const duration = Date.now() - startTime;
    console.log(`     ✓ Climax/turning point analyzed (${duration}ms, ${analysis.tokensUsed} tokens)`);
    console.log(`       Climax: ${analysis.hasIdentifiableClimax ? 'Yes' : 'No'} (strength: ${analysis.climaxStrength}/10)`);
    console.log(`       Turning point: ${analysis.hasTurningPoint ? analysis.turningPointType : 'None'} (depth: ${analysis.turningPointDepth}/10)`);
    console.log(`       Vulnerability moments: ${analysis.vulnerabilityMoments.length}`);
    console.log(`       Conflict: ${analysis.conflictType} (complexity: ${analysis.conflictComplexity}/10)`);

    return analysis;

  } catch (error) {
    console.error('     ✗ Climax/turning point analysis failed:', error);
    throw error;
  }
}

// ============================================================================
// DETERMINISTIC CLIMAX/TURNING POINT DETECTION
// ============================================================================

/**
 * Quick deterministic detection (pre-LLM)
 */
export function detectTurningPointsDeterministic(essayText: string): {
  turningPointMarkers: string[];
  vulnerabilityMarkers: string[];
  conflictMarkers: string[];
  flags: string[];
} {
  const text = essayText.toLowerCase();

  // Turning point markers
  const turningPointPatterns = [
    /\bthat'?s when\b/gi,
    /\bthen i (realized|understood|saw|learned|discovered)\b/gi,
    /\bit hit me\b/gi,
    /\bfor the first time\b/gi,
    /\bsuddenly (i|it)\b/gi,
    /\bin that moment\b/gi,
    /\bi came to (realize|understand)\b/gi,
  ];

  const turningPointMarkers: string[] = [];
  turningPointPatterns.forEach(pattern => {
    const matches = essayText.match(pattern) || [];
    turningPointMarkers.push(...matches);
  });

  // Vulnerability markers
  const vulnerabilityPatterns = [
    /\bi (didn'?t know|had no idea|was lost|was scared|was wrong|failed|couldn'?t)\b/gi,
    /\bi (doubted|questioned|wondered if|feared)\b/gi,
    /\bi realized i (didn'?t|couldn'?t|wouldn'?t|had no)\b/gi,
    /\b(clammy hands|hands (shook|trembled)|stomach (dropped|churned)|heart (pounded|sank))\b/gi,
  ];

  const vulnerabilityMarkers: string[] = [];
  vulnerabilityPatterns.forEach(pattern => {
    const matches = essayText.match(pattern) || [];
    vulnerabilityMarkers.push(...matches);
  });

  // Conflict markers
  const conflictPatterns = [
    /\b(but|however|despite|although|yet)\b/gi,
    /\b(failed|struggled|challenged|difficult|hard|impossible)\b/gi,
    /\b(dilemma|problem|issue|obstacle|setback)\b/gi,
  ];

  const conflictMarkers: string[] = [];
  conflictPatterns.forEach(pattern => {
    const matches = essayText.match(pattern) || [];
    conflictMarkers.push(...matches);
  });

  // Flags
  const flags: string[] = [];

  if (turningPointMarkers.length === 0) {
    flags.push('MAJOR: No turning point markers detected');
  }

  if (vulnerabilityMarkers.length === 0) {
    flags.push('CRITICAL: No vulnerability detected (elite essays have 2+ moments)');
  } else if (vulnerabilityMarkers.length < 2) {
    flags.push('MAJOR: Limited vulnerability (elite essays have 2+ moments)');
  }

  if (conflictMarkers.length < 2) {
    flags.push('MAJOR: Minimal conflict markers (need tension for narrative)');
  }

  return {
    turningPointMarkers,
    vulnerabilityMarkers,
    conflictMarkers,
    flags
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract middle section where climax typically occurs
 */
export function extractMiddleSection(essayText: string): string {
  const words = essayText.split(/\s+/);
  const totalWords = words.length;
  const skipFirst = Math.floor(totalWords * 0.2);
  const skipLast = Math.floor(totalWords * 0.2);
  const middleWords = words.slice(skipFirst, totalWords - skipLast);
  return middleWords.join(' ');
}

/**
 * Find sentence containing turning point
 */
export function findTurningPointSentence(essayText: string): {
  found: boolean;
  sentenceIndex: number;
  sentence: string;
} | null {
  const sentences = essayText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

  const turningPointPatterns = [
    /\bthat'?s when\b/i,
    /\bthen i (realized|understood|saw|learned)\b/i,
    /\bit hit me\b/i,
    /\bfor the first time\b/i,
  ];

  for (let i = 0; i < sentences.length; i++) {
    for (const pattern of turningPointPatterns) {
      if (pattern.test(sentences[i])) {
        return {
          found: true,
          sentenceIndex: i,
          sentence: sentences[i]
        };
      }
    }
  }

  return null;
}

