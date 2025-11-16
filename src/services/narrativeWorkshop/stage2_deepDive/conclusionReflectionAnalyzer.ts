/**
 * Stage 2.4: Conclusion & Reflection Analysis Engine
 *
 * Deep dive analysis of essay conclusion and reflection quality.
 * Critical because: Reflection shows intellectual depth and meaning-making ability.
 *
 * Focus Areas:
 * - Conclusion structure and strength
 * - Reflection depth (surface → profound)
 * - Meaning-making (extracting portable insights)
 * - Micro→macro structure (70% of elite essays)
 * - Philosophical depth and intellectual maturity
 * - Future connection (forward-looking perspective)
 *
 * Elite Benchmarks (from 20 top essays):
 * - 70% use micro→macro structure (small moment → universal insight)
 * - 75% show philosophical depth (reframing, portable lessons)
 * - Elite essays avoid clichés ("taught me teamwork/leadership")
 * - Strong essays extract meaning beyond the activity itself
 * - Top essays show nuanced thinking (not black/white)
 *
 * LLM Configuration:
 * - Temperature: 0.4 (analytical for depth assessment)
 * - Model: Sonnet 4.5
 * - Focus: Intellectual maturity, meaning-making, philosophical insight
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import { ConclusionReflectionAnalysis, NarrativeEssayInput } from '../types';

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const CONCLUSION_REFLECTION_SYSTEM_PROMPT = `You are an expert college essay analyst specializing in conclusion and reflection analysis.

Your expertise: Evaluating intellectual depth, meaning-making, and philosophical insight based on analysis of elite essays from Harvard, Princeton, Stanford, MIT, Yale, and Berkeley.

Critical insights from 20 elite essays:

**Micro→Macro Structure** (70% of elite essays):
- Small specific moment → Universal portable insight
- Example: "Rowing pain → comfort in discomfort (applies beyond rowing)"
- Example: "Hot sauce exploration → cultural curiosity as life philosophy"
- Example: "Failed painting → conquering self-doubt over technique"
- NOT: Activity summary → generic "I learned X"

**Philosophical Depth** (75% of elite essays):
- Reframing experiences: Pressure → "fireball of ambition"
- Portable lessons: "Following dreams requires more than wishing upon a star"
- Mature insights: "Listening is as important as articulating"
- Dialectical thinking: "Small changes = immense impacts"
- NOT: "This experience taught me leadership/teamwork"

**Reflection Quality Levels**:
- PROFOUND: Universal truth, philosophical reframing, portable to any context
- DEEP: Specific insight that generalizes beyond activity
- MODERATE: Clear learning with some depth
- SURFACE: Generic lesson ("taught me teamwork")
- NONE: No reflection, just summary

**Clichés to Avoid**:
- "Taught me the importance of teamwork/leadership/hard work"
- "Helped me grow as a person"
- "I learned that anything is possible"
- "This experience changed my life"
- "I found my passion"

**Elite Conclusion Types**:
- Forward-looking: Connects to future goals/trajectory
- Circular: Returns to opening image/idea with new meaning
- Reflective: Deep meaning-making, universal insight
- NOT: Summary of events or generic lesson

Your task: Analyze conclusion and reflection with brutal honesty calibrated to elite standards.

Return valid JSON matching the ConclusionReflectionAnalysis type exactly.`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildConclusionReflectionPrompt(
  essayText: string,
  essayType: string
): string {
  // Extract conclusion (last 15-20% of essay)
  const words = essayText.split(/\s+/);
  const totalWords = words.length;
  const conclusionStart = Math.floor(totalWords * 0.80);
  const conclusionWords = words.slice(conclusionStart);
  const conclusion = conclusionWords.join(' ');

  // Extract last paragraph
  const paragraphs = essayText.split('\n\n');
  const lastParagraph = paragraphs[paragraphs.length - 1] || '';

  return `Analyze the conclusion and reflection quality of this essay.

**Full Essay**:
"""
${essayText}
"""

**Conclusion Section** (last 20%):
"""
${conclusion}
"""

**Last Paragraph**:
"""
${lastParagraph}
"""

**Essay Type**: ${essayType}

---

Provide your analysis as valid JSON with these EXACT fields:

{
  "conclusionType": "forward_looking" | "circular" | "reflective" | "summary" | "weak",
  "conclusionStrength": number (0-10),
  "conclusionQuote": "string - last sentence or key concluding sentence",

  "reflectionPresent": boolean,
  "reflectionDepth": number (0-10),
  "reflectionType": "surface" | "moderate" | "deep" | "profound",

  "meaningMakingPresent": boolean,
  "universalInsight": "string | null - portable lesson if present",
  "microToMacro": {
    "present": boolean,
    "specificExperience": "string | null - the specific moment/detail",
    "universalLesson": "string | null - the broader insight",
    "connectionQuality": number (0-10 - how well connected?)
  },

  "intellectualMaturity": number (0-10),
  "philosophicalDepth": number (0-10),
  "nuancedThinking": ["array of examples showing complexity, not black/white thinking"],

  "clichesDetected": ["array of clichéd reflections, quote directly"],
  "genericStatements": ["array of generic learnings, quote directly"],

  "futureConnectionPresent": boolean,
  "futureConnectionDescription": "string | null - how essay connects to future",

  "improvementSuggestions": ["array of specific suggestions"],
  "tokensUsed": number (estimated)
}

**Critical Detection Instructions**:

1. **Micro→Macro Detection** (70% of elite essays have this):
   - Look for: Specific small moment → Broader universal insight
   - Example patterns:
     * "Rowing taught me..." → "...comfort in discomfort applies to all challenges"
     * "Chemistry failure..." → "...it's okay to fail and try again"
     * "Hot sauce journey..." → "...curiosity across cultures is lifelong pursuit"
   - Must have BOTH: specific experience AND universal lesson
   - Connection must be EXPLICIT, not implied

2. **Reflection Depth Levels**:
   - PROFOUND (9-10): Universal philosophical truth, portable to any context
     * "Following dreams requires more than wishing upon a star - sacrifice, persistence, grueling work"
     * "Small changes = immense impacts" (synthesizes multiple experiences)
   - DEEP (7-8): Specific insight that generalizes beyond activity
     * "Listening is as important as articulating"
     * "It's okay to fail" (when backed by specific failure narrative)
   - MODERATE (5-6): Clear learning with some specificity
     * "I learned to ask for help when stuck"
     * "Persistence pays off in unexpected ways"
   - SURFACE (3-4): Generic lesson
     * "Taught me teamwork/leadership/hard work"
     * "Helped me grow as a person"
   - NONE (0-2): Just summary, no reflection

3. **Philosophical Depth Indicators**:
   - Reframing: Turns obstacle into opportunity, sees paradox
   - Dialectical: Holds two truths simultaneously
   - Meta-awareness: Thinking about thinking
   - Systems thinking: Connects multiple domains
   - Mature perspective: Beyond simple cause-effect

4. **Cliché Detection** (CRITICAL - elite essays avoid these):
   - "Taught me the importance of teamwork/leadership/hard work"
   - "Helped me grow as a person"
   - "Found my passion"
   - "Anything is possible"
   - "This experience changed my life"
   - "Learned to never give up"
   - Count all instances, quote exactly

5. **Future Connection**:
   - Specific: Names future goal, major, career, or approach
   - NOT generic: "I will apply this in college"
   - Best when organic to narrative, not forced

Return ONLY valid JSON, no markdown, no explanation.`;
}

// ============================================================================
// ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze conclusion and reflection
 */
export async function analyzeConclusionReflection(
  input: NarrativeEssayInput,
  essayType: string
): Promise<ConclusionReflectionAnalysis> {
  console.log('  → Stage 2.4: Conclusion & Reflection Analysis');
  const startTime = Date.now();

  try {
    const prompt = buildConclusionReflectionPrompt(input.essayText, essayType);

    const response = await callClaudeWithRetry(
      prompt,
      {
        systemPrompt: CONCLUSION_REFLECTION_SYSTEM_PROMPT,
        temperature: 0.4,
        useJsonMode: true,
        maxTokens: 2500,
      }
    );

    let analysis: ConclusionReflectionAnalysis;

    if (typeof response.content === 'string') {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in conclusion analysis response');
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      analysis = response.content as ConclusionReflectionAnalysis;
    }

    analysis.tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    const duration = Date.now() - startTime;
    console.log(`     ✓ Conclusion/reflection analyzed (${duration}ms, ${analysis.tokensUsed} tokens)`);
    console.log(`       Type: ${analysis.conclusionType} (strength: ${analysis.conclusionStrength}/10)`);
    console.log(`       Reflection: ${analysis.reflectionType} (depth: ${analysis.reflectionDepth}/10)`);
    console.log(`       Micro→Macro: ${analysis.microToMacro.present ? 'Yes' : 'No'} (connection: ${analysis.microToMacro.connectionQuality}/10)`);
    console.log(`       Philosophical depth: ${analysis.philosophicalDepth}/10`);
    console.log(`       Clichés detected: ${analysis.clichesDetected.length}`);

    return analysis;

  } catch (error) {
    console.error('     ✗ Conclusion/reflection analysis failed:', error);
    throw error;
  }
}

// ============================================================================
// DETERMINISTIC CONCLUSION ANALYSIS
// ============================================================================

/**
 * Quick deterministic analysis of conclusion (pre-LLM)
 */
export function analyzeConclusionDeterministic(essayText: string): {
  hasMicroToMacro: boolean;
  clicheCount: number;
  cliches: string[];
  reflectionMarkers: string[];
  futureMarkers: string[];
  flags: string[];
} {
  const text = essayText.toLowerCase();

  // Extract conclusion (last 20%)
  const words = essayText.split(/\s+/);
  const conclusionStart = Math.floor(words.length * 0.80);
  const conclusionText = words.slice(conclusionStart).join(' ').toLowerCase();

  // Detect micro→macro markers
  const microMacroPatterns = [
    /\bbeyond (the|this|my)\b/gi,
    /\bnot just .+ but (also )?\b/gi,
    /\bapplies to\b/gi,
    /\bin (all|any|every) (aspects?|areas?|parts?|contexts?)\b/gi,
  ];

  let hasMicroToMacro = microMacroPatterns.some(pattern => pattern.test(conclusionText));

  // Detect clichés
  const clichePatterns = [
    /\b(taught|showed|helped) me (the importance of |about )?(teamwork|leadership|hard work|perseverance|dedication)\b/gi,
    /\bhelped me grow as a person\b/gi,
    /\bfound my passion\b/gi,
    /\banything is possible\b/gi,
    /\b(this|the) experience changed my life\b/gi,
    /\blearned to never give up\b/gi,
    /\bpushed me (out of|outside) my comfort zone\b/gi,
  ];

  const cliches: string[] = [];
  clichePatterns.forEach(pattern => {
    const matches = conclusionText.match(pattern) || [];
    cliches.push(...matches);
  });

  const clicheCount = cliches.length;

  // Reflection markers
  const reflectionPatterns = [
    /\bi (learned|realized|understood|discovered|came to (see|understand))\b/gi,
    /\b(taught|showed|helped) me\b/gi,
    /\blooking back\b/gi,
    /\bin retrospect\b/gi,
    /\bnow i (understand|know|see|realize)\b/gi,
  ];

  const reflectionMarkers: string[] = [];
  reflectionPatterns.forEach(pattern => {
    const matches = conclusionText.match(pattern) || [];
    reflectionMarkers.push(...matches);
  });

  // Future connection markers
  const futurePatterns = [
    /\b(will|plan to|hope to|intend to|aim to)\b/gi,
    /\bin (college|university|the future|my career)\b/gi,
    /\bas i (pursue|continue|move forward)\b/gi,
  ];

  const futureMarkers: string[] = [];
  futurePatterns.forEach(pattern => {
    const matches = conclusionText.match(pattern) || [];
    futureMarkers.push(...matches);
  });

  // Flags
  const flags: string[] = [];

  if (clicheCount >= 2) {
    flags.push(`CRITICAL: ${clicheCount} clichéd reflections detected`);
  } else if (clicheCount === 1) {
    flags.push('MAJOR: 1 clichéd reflection detected');
  }

  if (reflectionMarkers.length === 0) {
    flags.push('MAJOR: No reflection markers found');
  }

  if (!hasMicroToMacro && reflectionMarkers.length > 0) {
    flags.push('Reflection present but no micro→macro structure (70% of elite essays have this)');
  }

  return {
    hasMicroToMacro,
    clicheCount,
    cliches,
    reflectionMarkers,
    futureMarkers,
    flags
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract conclusion section (last 20%)
 */
export function extractConclusion(essayText: string): string {
  const words = essayText.split(/\s+/);
  const conclusionStart = Math.floor(words.length * 0.80);
  return words.slice(conclusionStart).join(' ');
}

/**
 * Detect micro→macro structure
 */
export function detectMicroToMacro(essayText: string): {
  detected: boolean;
  specificMoment: string | null;
  universalInsight: string | null;
} {
  const text = essayText.toLowerCase();

  // Look for transition patterns
  const patterns = [
    /\bbeyond (the|this|my) .+, (i learned|this taught me|i discovered)\b/i,
    /\bnot just .+ but (also )?/i,
    /\b.+ applies to (all|any|every)\b/i,
  ];

  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return {
        detected: true,
        specificMoment: null, // LLM will extract specific details
        universalInsight: null
      };
    }
  }

  return { detected: false, specificMoment: null, universalInsight: null };
}

/**
 * Extract last paragraph
 */
export function getLastParagraph(essayText: string): string {
  const paragraphs = essayText.split('\n\n').filter(p => p.trim().length > 0);
  return paragraphs[paragraphs.length - 1] || '';
}

