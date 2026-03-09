/**
 * Analysis Pass — Layer 3.5: Parallel Per-Paragraph Evaluation
 *
 * The FIRST layer that gets to JUDGE. All prior layers (L1-L3.75) were purely descriptive.
 * L3.5 makes parallel Sonnet calls per paragraph, evaluating HOW WELL each sentence
 * and paragraph work, with COMPLETE understanding context (including L3.75 holistic synthesis).
 *
 * Key architectural advantages:
 * - P1's analysis sees P5's payoff (complete understanding first, then evaluation)
 * - Honest scoring calibration (explicit anchors, reasoning-first, forced ranking)
 * - Evidence-backed strengths/weaknesses (every observation cites text)
 * - Prompt caching across parallel calls (essay + understanding profile = Block 2)
 *
 * After all paragraph analyses complete, computes the ImprovementPhase — the zoom level
 * that L5 (feedback) uses to determine what to surface.
 *
 * Input: EssayProfile with completed L3 understanding + L3.75 holistic synthesis
 * Output: AnalysisPassOutput[] (per-paragraph) + ImprovementPhase
 *
 * Consumed by: EssayProfileManager.applyAnalysisPassResult(), analysisOrchestrator
 * Spec: docs/plan-sections/02-layer-specs.md (L3.5 section)
 */

import type {
  EssayProfile,
  ParagraphProfile,
  AnalysisPassOutput,
  ObservationEntry,
  ImprovementPhase,
  ImprovementPhaseLevel,
} from '../profileTypes';
import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import { jsonrepair } from 'jsonrepair';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';

/**
 * Max tokens for per-paragraph analysis output.
 * A paragraph with 5-7 sentences needs ~800-1200 tokens for detailed analysis.
 * Paragraphs with 10+ sentences may need more.
 */
const MAX_OUTPUT_TOKENS = 4096;

/**
 * Temperature for analysis calls. Low for consistent, calibrated scoring.
 * Not zero — we want some variability in reasoning, but scores should be stable.
 */
const ANALYSIS_TEMPERATURE = 0.3;

/**
 * Concurrency limit for parallel paragraph analysis calls.
 * Anthropic rate limits: 5 concurrent Sonnet calls is safe.
 */
const CONCURRENCY_LIMIT = 5;

/**
 * Timeout per paragraph analysis call (ms).
 * Large context + detailed output = needs breathing room.
 */
const PER_PARAGRAPH_TIMEOUT_MS = 90_000;

// ============================================================================
// RESULT TYPE
// ============================================================================

/**
 * Complete L3.5 analysis result — per-paragraph analyses + improvement phase.
 */
export interface L35AnalysisResult {
  paragraphAnalyses: AnalysisPassOutput[];
  improvementPhase: ImprovementPhase;
  cost: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  timingMs: number;
  /** Paragraphs that failed analysis (partial success — others still returned) */
  failedParagraphs: Array<{ index: number; error: string }>;
}

// ============================================================================
// PROMPT CONSTRUCTION
// ============================================================================

/**
 * Block 1: Static system prompt with scoring calibration.
 * Cached across ALL paragraph calls via cache_control.
 */
function buildSystemPrompt(): string {
  return `You are an expert admissions essay analyst. Your task is to EVALUATE how effectively each sentence and paragraph work — not to describe what they do (understanding is already complete), but to JUDGE how well they do it.

## YOUR ROLE

You receive COMPLETE understanding of the essay — holistic synthesis, voice map, earnedness network, thematic architecture, every sentence's purpose and contribution. Your job is to evaluate EFFECTIVENESS: how well each element achieves its purpose within the essay's architecture.

## SCORING CALIBRATION — READ THIS CAREFULLY

LLMs default to inflated scores. You MUST resist this. Use these concrete anchors:

| Score Range | Meaning | Frequency in a decent essay |
|-------------|---------|---------------------------|
| 96-100 | MASTERFUL. This sentence alone would make an AO pause and re-read. Published-quality craft, irreplaceable in the essay. | Extremely rare (0-1 per essay) |
| 86-95 | EXCEPTIONAL. I would remember this sentence after reading 50 essays today. Distinctive voice, precise imagery, structural mastery. | Rare (1-2 per essay) |
| 76-85 | GENUINELY STRONG. Does its job with distinction. Better than competent — has texture, specificity, voice. | Several per strong essay |
| 55-75 | FUNCTIONAL. Does its job without distinction. A competent writer wrote this. Not memorable, not problematic. | MOST sentences in a decent essay |
| 40-54 | WEAK BUT FUNCTIONAL. Gets the point across but with issues — vague language, telling not showing, generic phrasing. | Several per developing essay |
| Below 40 | PROBLEMATIC. Actively harms the essay — confusing, contradictory, cliched, or structurally broken. | Rare in submitted work |

**Critical**: If your scores cluster in the 75-90 range with no differentiation, you have FAILED. A well-calibrated analysis reveals the essay's topology — genuine peaks, functional stretches, and real valleys.

## EVALUATION METHOD

For each sentence, follow this exact sequence:

1. **Reference the understanding** — state what this sentence's purpose IS (from the understanding layer), don't re-derive it
2. **Rank sentences** — before scoring ANY sentence, mentally rank all sentences in this paragraph from strongest to weakest
3. **Reason about effectiveness** — HOW WELL does this sentence achieve its stated purpose? Consider:
   - Specificity vs. vagueness
   - Show vs. tell
   - Voice authenticity vs. performed voice
   - Structural contribution vs. filler
   - Earned emotional moments vs. asserted emotions
   - Memorable craft vs. generic competence
4. **Assign the score** — AFTER reasoning, not before. The reasoning determines the score.
5. **Identify strengths** — with SPECIFIC text evidence ("the image of X does Y because Z")
6. **Identify weaknesses** — with SPECIFIC text evidence AND what improvement would look like in context

## EVIDENCE REQUIREMENTS

- Every strength MUST cite specific text: "the verb 'stumbled' conveys X" — not "the imagery is vivid"
- Every weakness MUST explain what specificity would look like: "Instead of 'it was difficult', show the specific difficulty — what did it feel like, what happened?" — not "could be more specific"
- If you cannot cite specific text for an observation, the observation is too vague. Delete it.

## PARAGRAPH-LEVEL EVALUATION

After evaluating all sentences:
- **Effectiveness**: Weighted by structural importance (load-bearing sentences count more than decorative ones)
- **Verdict**: ONE sentence capturing how well this paragraph fulfills its structural role
- **Strength signatures**: What this paragraph does WELL (with evidence)
- **Growth edges**: Where this paragraph has room to improve (with description)
- **Holistic evolution**: Any essay-level evaluative insights that emerged from analyzing THIS paragraph

## isStrength / isProblem THRESHOLDS

- **isStrength**: effectiveness >= 76 AND the sentence makes a distinctive contribution
- **isProblem**: effectiveness < 50 OR the sentence actively harms the essay despite higher effectiveness

## priorityForImprovement (0-5)

Not just local quality — structural importance in the essay:
- 5: Load-bearing sentence with a problem (thesis statement that's vague, fulcrum that doesn't land)
- 4: Important sentence with significant issues (opening/closing, transition at a pivot point)
- 3: Supporting sentence with clear room for improvement
- 2: Functional sentence that could be stronger but isn't urgently needed
- 1: Minor refinement opportunity
- 0: This sentence is fine — improving it would not meaningfully improve the essay

## OUTPUT FORMAT

Respond with a single JSON object matching this schema EXACTLY:

{
  "sentenceRanking": ["brief justification for ranking order — strongest to weakest"],
  "sentenceAnalyses": [
    {
      "sentenceIndex": 0,
      "effectivenessReasoning": "string — WHY this score, referencing understanding",
      "effectiveness": 65,
      "strengths": [
        { "observation": "string — what works", "evidence": "string — specific text cited", "confidence": 0.9 }
      ],
      "weaknesses": [
        { "observation": "string — what doesn't work", "evidence": "string — specific text cited", "confidence": 0.85 }
      ],
      "isStrength": false,
      "isProblem": false,
      "priorityForImprovement": 2
    }
  ],
  "paragraphEffectiveness": 62,
  "paragraphVerdict": "string — one-sentence assessment of how well this paragraph fulfills its role",
  "holisticAnalysisEvolution": {
    "strengthSignatures": [{ "quality": "string", "evidence": "string", "paragraphs": [0] }],
    "growthEdges": [{ "quality": "string", "description": "string", "paragraphs": [0] }],
    "aoTakeaway": "string — what an AO would think after reading this paragraph in context"
  }
}

IMPORTANT: "sentenceRanking" is for your reasoning process — rank sentences BEFORE scoring them. This forces honest differentiation.`;
}

/**
 * Block 2: Essay text + complete understanding profile.
 * Cached across ALL parallel paragraph calls — major cost savings.
 */
function buildProfileContext(profile: Readonly<EssayProfile>): string {
  const sections: string[] = [];

  // Essay text with paragraph/sentence markers
  sections.push('=== ESSAY TEXT ===');
  for (const para of profile.paragraphs) {
    sections.push(`\n[P${para.index}]`);
    for (const sentence of para.sentences) {
      sections.push(`  [P${para.index}S${sentence.index}] ${sentence.text}`);
    }
  }

  // Profile Index summary
  sections.push('\n=== PROFILE INDEX ===');
  sections.push(`Essay: ${profile.index.essayLength.paragraphs} paragraphs, ${profile.index.essayLength.sentences} sentences, ${profile.index.essayLength.words} words`);
  sections.push(`Confidence: ${profile.index.confidenceLevel}`);
  for (const digest of profile.index.paragraphDigest) {
    sections.push(`P${digest.index}: ${digest.roleSummary} [themes: ${digest.themes.join(', ')}] [connections: ${digest.connectionCount}]`);
  }

  // Holistic understanding — the complete picture
  sections.push('\n=== HOLISTIC UNDERSTANDING (from L3.75 synthesis) ===');

  // Voice
  if (profile.voiceIdentity) {
    sections.push('\n--- Voice Identity ---');
    sections.push(`Signature: ${profile.voiceIdentity.signature}`);
    sections.push(`Register: ${profile.voiceIdentity.register}`);
    sections.push(`Evolution: ${profile.voiceIdentity.evolution}`);
    if (profile.voiceIdentity.distinctivePatterns.length > 0) {
      sections.push(`Distinctive: ${profile.voiceIdentity.distinctivePatterns.join('; ')}`);
    }
  }

  // Emotional topography
  if (profile.emotionalTopography) {
    sections.push('\n--- Emotional Topography ---');
    sections.push(`Arc: ${profile.emotionalTopography.arcTrajectory}`);
    if (profile.emotionalTopography.peakMoments.length > 0) {
      for (const peak of profile.emotionalTopography.peakMoments) {
        sections.push(`  Peak at P${peak.location[0]}S${peak.location[1]}: ${peak.emotion} (${peak.intensity})`);
      }
    }
    if (profile.emotionalTopography.undertones.length > 0) {
      sections.push(`Undertones: ${profile.emotionalTopography.undertones.join(', ')}`);
    }
  }

  // Thematic architecture
  if (profile.thematicArchitecture) {
    sections.push('\n--- Thematic Architecture ---');
    sections.push(`Central thesis: ${profile.thematicArchitecture.centralThesis} (confidence: ${profile.thematicArchitecture.thesisConfidence})`);
    sections.push(`Evolution: ${profile.thematicArchitecture.thesisEvolution}`);
    for (const thread of profile.thematicArchitecture.threads) {
      sections.push(`  Thread "${thread.thread}": ${thread.strength}, introduced P${thread.introducedAt.paragraph}`);
    }
    if (profile.thematicArchitecture.subtext) {
      sections.push(`Subtext: ${profile.thematicArchitecture.subtext}`);
    }
  }

  // Narrative strategy
  if (profile.narrativeStrategy) {
    sections.push('\n--- Narrative Strategy ---');
    sections.push(`Strategy: ${profile.narrativeStrategy.primaryStrategy}`);
    sections.push(`Rationale: ${profile.narrativeStrategy.strategyRationale}`);
    sections.push(`Pacing: ${profile.narrativeStrategy.pacingAnalysis}`);
    for (const pivot of profile.narrativeStrategy.pivotPoints) {
      sections.push(`  Pivot at P${pivot.location.paragraph}${pivot.location.sentence !== undefined ? `S${pivot.location.sentence}` : ''}: ${pivot.description}`);
    }
  }

  // Character revelation
  if (profile.characterRevelation) {
    sections.push('\n--- Character Revelation ---');
    sections.push(`Portrait: ${profile.characterRevelation.writerPortrait}`);
    sections.push(`Values: ${profile.characterRevelation.valuesRevealed.join(', ')}`);
    sections.push(`Growth: ${profile.characterRevelation.growthArc}`);
    if (profile.characterRevelation.blindSpots.length > 0) {
      sections.push(`Blind spots: ${profile.characterRevelation.blindSpots.join(', ')}`);
    }
  }

  // Craft assessment
  if (profile.craftAssessment) {
    sections.push('\n--- Craft Assessment ---');
    sections.push(`Sentence patterns: ${profile.craftAssessment.sentencePatterns}`);
    sections.push(`Word patterns: ${profile.craftAssessment.wordPatterns}`);
    sections.push(`Image system: ${profile.craftAssessment.imageSystem}`);
  }

  // Admissions positioning
  if (profile.admissionsPositioning) {
    sections.push('\n--- Admissions Positioning ---');
    sections.push(`Tellability: ${profile.admissionsPositioning.tellabilitySummary}`);
    sections.push(`Distinctiveness: ${profile.admissionsPositioning.distinctivenessFactors.join('; ')}`);
    sections.push(`AO takeaway: ${profile.admissionsPositioning.portfolioPosition}`);
    if (profile.admissionsPositioning.redFlags.length > 0) {
      sections.push(`Red flags: ${profile.admissionsPositioning.redFlags.join('; ')}`);
    }
  }

  // Moment earnedness map
  if (profile.momentEarnednessMap && profile.momentEarnednessMap.moments.length > 0) {
    sections.push('\n--- Moment Earnedness ---');
    sections.push(`Structural observation: ${profile.momentEarnednessMap.structuralObservation}`);
    for (const moment of profile.momentEarnednessMap.moments) {
      const earned = moment.mechanisms.length >= 2 ? 'EARNED' : 'UNEARNED';
      sections.push(`  ${moment.momentType} at P${moment.location.paragraph}S${moment.location.sentence}: ${moment.description} [${earned}, ${moment.mechanisms.length} mechanisms]`);
      if (moment.gaps.length > 0) {
        sections.push(`    Gaps: ${moment.gaps.join('; ')}`);
      }
    }
  }

  // Cross-dimension entanglements
  if (profile.entanglements && profile.entanglements.length > 0) {
    sections.push('\n--- Cross-Dimension Entanglements ---');
    for (const e of profile.entanglements) {
      sections.push(`  [${e.dimensions.join('+')}] at P${e.location.paragraph}${e.location.sentence !== undefined ? `S${e.location.sentence}` : ''}: ${e.description}`);
    }
  }

  // Per-paragraph understanding (ALL paragraphs — the LLM needs complete context)
  sections.push('\n=== PER-PARAGRAPH UNDERSTANDING ===');
  for (const para of profile.paragraphs) {
    sections.push(`\n--- P${para.index} Understanding ---`);
    if (para.understanding) {
      sections.push(`Role: ${para.understanding.role}`);
      sections.push(`Function: ${para.understanding.function}`);
      sections.push(`Narrative contribution: ${para.understanding.narrativeContribution}`);
      sections.push(`Emotional register: ${para.understanding.emotionalRegister.dominantEmotion} (${para.understanding.emotionalRegister.depth}, ${para.understanding.emotionalRegister.authenticity})`);
      sections.push(`Show vs tell: ${para.understanding.emotionalRegister.showVsTell}`);
    }

    for (const sentence of para.sentences) {
      if (!sentence.understanding) continue;
      sections.push(`  P${para.index}S${sentence.index}:`);
      if (sentence.understanding.observedFunctions.length > 0) {
        sections.push(`    Functions: ${sentence.understanding.observedFunctions.map(o => o.observation).join(' | ')}`);
      }
      if (sentence.understanding.inferredIntents.length > 0) {
        sections.push(`    Intents: ${sentence.understanding.inferredIntents.map(o => o.observation).join(' | ')}`);
      }
      if (sentence.understanding.narrativeContributions.length > 0) {
        sections.push(`    Narrative: ${sentence.understanding.narrativeContributions.map(o => o.observation).join(' | ')}`);
      }
      if (sentence.understanding.craft.techniques.length > 0) {
        sections.push(`    Craft: rhythm=${sentence.understanding.craft.rhythm}, techniques=[${sentence.understanding.craft.techniques.join(', ')}]`);
      }
    }
  }

  // Connections
  if (profile.connections && profile.connections.all.length > 0) {
    sections.push('\n=== CONNECTIONS ===');
    for (const conn of profile.connections.all) {
      sections.push(`  P${conn.from[0]}S${conn.from[1]} → P${conn.to[0]}S${conn.to[1]}: ${conn.type} — ${conn.description} (${conn.confidence})`);
    }
  }

  return sections.join('\n');
}

/**
 * Block 3: Per-paragraph specifics (NOT cached — unique per call).
 */
function buildParagraphPrompt(
  para: Readonly<ParagraphProfile>,
  paragraphCount: number,
): string {
  const lines: string[] = [];

  lines.push(`ANALYZE PARAGRAPH ${para.index} (of ${paragraphCount - 1} total, zero-indexed)`);
  lines.push('');
  lines.push(`TEXT:`);
  for (const s of para.sentences) {
    lines.push(`  [S${s.index}] "${s.text}"`);
  }
  lines.push('');
  lines.push(`This paragraph has ${para.sentences.length} sentences. You MUST produce analysis for each sentence index 0 through ${para.sentences.length - 1}.`);
  lines.push('');

  if (para.understanding) {
    lines.push(`UNDERSTANDING SUMMARY (already established — evaluate against this, don't redescribe):`);
    lines.push(`  Role: ${para.understanding.role}`);
    lines.push(`  Function: ${para.understanding.function}`);
    lines.push(`  Narrative contribution: ${para.understanding.narrativeContribution}`);
    lines.push('');
  }

  lines.push(`INSTRUCTIONS:`);
  lines.push(`1. First, rank all ${para.sentences.length} sentences in this paragraph from strongest to weakest.`);
  lines.push(`2. Then evaluate each sentence — reasoning BEFORE score.`);
  lines.push(`3. Ensure your scores show genuine differentiation (avoid clustering in 70-85).`);
  lines.push(`4. Every strength and weakness must cite specific text from the sentence.`);
  lines.push(`5. Produce the JSON output matching the schema in the system prompt.`);

  return lines.join('\n');
}

// ============================================================================
// JSON PARSING
// ============================================================================

/**
 * Robust JSON parsing with fallback chain:
 * 1. Direct parse
 * 2. Extract from code blocks
 * 3. jsonrepair library
 * 4. Manual extraction of outermost JSON object
 */
function parseAnalysisJSON(raw: string): Record<string, unknown> {
  let text = raw.trim();

  // 1. Try direct parse
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch { /* continue */ }

  // 2. Extract from code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as Record<string, unknown>;
    } catch { /* continue */ }
  }

  // 3. jsonrepair
  try {
    const repaired = jsonrepair(text);
    return JSON.parse(repaired) as Record<string, unknown>;
  } catch { /* continue */ }

  // 4. Find outermost { ... }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const extracted = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(extracted) as Record<string, unknown>;
    } catch {
      try {
        const repaired = jsonrepair(extracted);
        return JSON.parse(repaired) as Record<string, unknown>;
      } catch { /* continue */ }
    }
  }

  throw new Error('Failed to parse analysis JSON after all fallback attempts');
}

// ============================================================================
// RESPONSE VALIDATION & TRANSFORMATION
// ============================================================================

/**
 * Validate and transform a raw LLM response into a typed AnalysisPassOutput.
 * Defensive: fills in defaults for missing fields rather than crashing.
 */
function validateAndTransform(
  raw: Record<string, unknown>,
  paragraphIndex: number,
  expectedSentenceCount: number,
): AnalysisPassOutput {
  const sentenceAnalyses: AnalysisPassOutput['sentenceAnalyses'] = [];

  // Extract sentence analyses
  const rawSentences = Array.isArray(raw.sentenceAnalyses) ? raw.sentenceAnalyses : [];

  for (let i = 0; i < expectedSentenceCount; i++) {
    // Find the analysis for this sentence index (may be out of order)
    const rawSA = rawSentences.find(
      (sa: Record<string, unknown>) => (sa as { sentenceIndex?: number }).sentenceIndex === i
    ) as Record<string, unknown> | undefined;

    if (rawSA) {
      const effectiveness = clampScore(Number(rawSA.effectiveness) || 60);
      sentenceAnalyses.push({
        sentenceIndex: i,
        effectiveness,
        effectivenessReasoning: String(rawSA.effectivenessReasoning || 'No reasoning provided'),
        strengths: extractObservations(rawSA.strengths),
        weaknesses: extractObservations(rawSA.weaknesses),
        isStrength: typeof rawSA.isStrength === 'boolean' ? rawSA.isStrength : effectiveness >= 76,
        isProblem: typeof rawSA.isProblem === 'boolean' ? rawSA.isProblem : effectiveness < 50,
        priorityForImprovement: clampPriority(Number(rawSA.priorityForImprovement) || 0),
      });
    } else {
      // Missing sentence — fill with a conservative default
      console.warn(`[AnalysisPass] Missing analysis for P${paragraphIndex}S${i}, filling default`);
      sentenceAnalyses.push({
        sentenceIndex: i,
        effectiveness: 60,
        effectivenessReasoning: 'Analysis for this sentence was not returned by the LLM',
        strengths: [],
        weaknesses: [],
        isStrength: false,
        isProblem: false,
        priorityForImprovement: 1,
      });
    }
  }

  // Paragraph-level analysis
  const paragraphEffectiveness = clampScore(Number(raw.paragraphEffectiveness) || computeParagraphEffectiveness(sentenceAnalyses));
  const paragraphVerdict = String(raw.paragraphVerdict || 'No verdict provided');

  // Holistic evolution
  const rawHolistic = (raw.holisticAnalysisEvolution || {}) as Record<string, unknown>;
  const holisticAnalysisEvolution: AnalysisPassOutput['holisticAnalysisEvolution'] = {};

  if (Array.isArray(rawHolistic.strengthSignatures) && rawHolistic.strengthSignatures.length > 0) {
    holisticAnalysisEvolution.strengthSignatures = rawHolistic.strengthSignatures.map(
      (ss: Record<string, unknown>) => ({
        quality: String(ss.quality || ''),
        evidence: String(ss.evidence || ''),
        paragraphs: Array.isArray(ss.paragraphs) ? ss.paragraphs.map(Number) : [paragraphIndex],
      })
    );
  }

  if (Array.isArray(rawHolistic.growthEdges) && rawHolistic.growthEdges.length > 0) {
    holisticAnalysisEvolution.growthEdges = rawHolistic.growthEdges.map(
      (ge: Record<string, unknown>) => ({
        quality: String(ge.quality || ''),
        description: String(ge.description || ''),
        paragraphs: Array.isArray(ge.paragraphs) ? ge.paragraphs.map(Number) : [paragraphIndex],
      })
    );
  }

  if (typeof rawHolistic.aoTakeaway === 'string' && rawHolistic.aoTakeaway.length > 0) {
    holisticAnalysisEvolution.aoTakeaway = rawHolistic.aoTakeaway;
  }

  return {
    paragraphIndex,
    sentenceAnalyses,
    paragraphEffectiveness,
    paragraphVerdict,
    holisticAnalysisEvolution,
  };
}

/**
 * Extract ObservationEntry[] from raw LLM output.
 * Handles both { observation, evidence, confidence } and plain string arrays.
 */
function extractObservations(raw: unknown): ObservationEntry[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item: unknown) => {
    if (typeof item === 'string') {
      return { observation: item };
    }
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      return {
        observation: String(obj.observation || obj.text || ''),
        evidence: typeof obj.evidence === 'string' ? obj.evidence : undefined,
        confidence: typeof obj.confidence === 'number' ? obj.confidence : undefined,
      };
    }
    return { observation: String(item) };
  }).filter(o => o.observation.length > 0);
}

/** Clamp effectiveness score to 0-100 */
function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Clamp priority to 0-5 */
function clampPriority(n: number): number {
  return Math.max(0, Math.min(5, Math.round(n)));
}

/**
 * Compute paragraph effectiveness from sentence analyses when the LLM doesn't provide one.
 * Uses a weighted average: sentences with higher priority get more weight.
 */
function computeParagraphEffectiveness(
  sentenceAnalyses: AnalysisPassOutput['sentenceAnalyses'],
): number {
  if (sentenceAnalyses.length === 0) return 50;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const sa of sentenceAnalyses) {
    // Higher priority = higher weight in the paragraph score
    const weight = 1 + (sa.priorityForImprovement * 0.5);
    weightedSum += sa.effectiveness * weight;
    totalWeight += weight;
  }

  return Math.round(weightedSum / totalWeight);
}

// ============================================================================
// IMPROVEMENT PHASE COMPUTATION
// ============================================================================

/**
 * Compute ImprovementPhase from completed L3.5 analysis results.
 *
 * The phase determines what FEEDBACK L5 surfaces — not what L3.5 evaluates.
 * Understanding + Analysis are always comprehensive; the phase is a filter.
 *
 * Signals considered:
 * - Average paragraph effectiveness
 * - Problem sentence ratio
 * - Thesis clarity (from thematic architecture)
 * - Structural coherence (from paragraph verdicts)
 * - Strength sentence ratio (high-craft sentences)
 */
function computeImprovementPhase(
  analyses: AnalysisPassOutput[],
  profile: Readonly<EssayProfile>,
): ImprovementPhase {
  if (analyses.length === 0) {
    return {
      level: 'foundation',
      reasoning: 'No paragraph analyses available — defaulting to foundation phase',
      focusAreas: ['Thesis clarity', 'Basic narrative arc', 'Structural coherence'],
      deferredAreas: ['Sentence-level craft', 'Word choice', 'Polish'],
      readiness: { essayLevel: 0, paragraphLevel: 0, sentenceLevel: 0, wordLevel: 0 },
    };
  }

  // Gather metrics
  const allSentenceScores: number[] = [];
  const paragraphScores: number[] = [];
  let problemCount = 0;
  let strengthCount = 0;
  let totalSentences = 0;

  for (const analysis of analyses) {
    paragraphScores.push(analysis.paragraphEffectiveness);
    for (const sa of analysis.sentenceAnalyses) {
      allSentenceScores.push(sa.effectiveness);
      totalSentences++;
      if (sa.isProblem) problemCount++;
      if (sa.isStrength) strengthCount++;
    }
  }

  const avgParagraph = paragraphScores.reduce((a, b) => a + b, 0) / paragraphScores.length;
  const avgSentence = totalSentences > 0
    ? allSentenceScores.reduce((a, b) => a + b, 0) / totalSentences
    : 50;
  const problemRatio = totalSentences > 0 ? problemCount / totalSentences : 0;
  const strengthRatio = totalSentences > 0 ? strengthCount / totalSentences : 0;

  // Check thesis clarity
  const thesisConfidence = profile.thematicArchitecture?.thesisConfidence ?? 0;
  const hasUnclearThesis = thesisConfidence < 0.5;

  // Determine level using cascading thresholds
  let level: ImprovementPhaseLevel;
  let reasoning: string;
  let focusAreas: string[];
  let deferredAreas: string[];
  let readiness: ImprovementPhase['readiness'];

  if (avgParagraph < 55 || hasUnclearThesis || problemRatio > 0.3) {
    level = 'foundation';
    const reasons: string[] = [];
    if (hasUnclearThesis) reasons.push(`thesis confidence is low (${(thesisConfidence * 100).toFixed(0)}%)`);
    if (avgParagraph < 55) reasons.push(`average paragraph effectiveness is ${avgParagraph.toFixed(0)}/100`);
    if (problemRatio > 0.3) reasons.push(`${(problemRatio * 100).toFixed(0)}% of sentences are problematic`);
    reasoning = `Foundation phase: ${reasons.join(', ')}. The essay needs structural work before sentence-level refinement.`;
    focusAreas = ['Thesis clarity and direction', 'Narrative arc coherence', 'Paragraph purpose alignment', 'Structural problems'];
    deferredAreas = ['Sentence-level craft', 'Word choice refinement', 'Voice polish', 'Memorability factors'];
    readiness = {
      essayLevel: Math.round(Math.min(avgParagraph, thesisConfidence * 100)),
      paragraphLevel: Math.round(avgParagraph),
      sentenceLevel: Math.round(avgSentence),
      wordLevel: 0,
    };
  } else if (avgParagraph < 68 || problemRatio > 0.15) {
    level = 'architecture';
    reasoning = `Architecture phase: paragraph average is ${avgParagraph.toFixed(0)}/100 with ${(problemRatio * 100).toFixed(0)}% problematic sentences. Structure is emerging but paragraph roles need sharpening.`;
    focusAreas = ['Paragraph role clarity', 'Transitions and pacing', 'Show vs. tell improvements', 'Structural balance'];
    deferredAreas = ['Fine sentence craft', 'Word-level precision', 'Voice refinement'];
    readiness = {
      essayLevel: Math.round(Math.min(avgParagraph + 10, 75)),
      paragraphLevel: Math.round(avgParagraph),
      sentenceLevel: Math.round(avgSentence),
      wordLevel: Math.round(Math.max(0, avgSentence - 20)),
    };
  } else if (avgParagraph < 78 || strengthRatio < 0.3) {
    level = 'craft';
    reasoning = `Craft phase: structure is solid (${avgParagraph.toFixed(0)}/100 average) but only ${(strengthRatio * 100).toFixed(0)}% of sentences are genuinely strong. Sentence-level craft needs attention.`;
    focusAreas = ['Sentence effectiveness', 'Imagery and specificity', 'Voice consistency', 'Rhetorical precision'];
    deferredAreas = ['Word-level polish', 'Memorability optimization'];
    readiness = {
      essayLevel: Math.round(Math.min(avgParagraph + 5, 85)),
      paragraphLevel: Math.round(avgParagraph),
      sentenceLevel: Math.round(avgSentence),
      wordLevel: Math.round(Math.max(0, avgSentence - 10)),
    };
  } else if (avgParagraph < 88) {
    level = 'polish';
    reasoning = `Polish phase: craft is strong (${avgParagraph.toFixed(0)}/100 average, ${(strengthRatio * 100).toFixed(0)}% strong sentences). Word-level refinement will elevate the essay.`;
    focusAreas = ['Word choice precision', 'Rhythm and cadence', 'Image refinement', 'Transition smoothing'];
    deferredAreas = ['Structural changes (risk destabilizing a strong essay)'];
    readiness = {
      essayLevel: Math.round(Math.min(avgParagraph + 5, 95)),
      paragraphLevel: Math.round(avgParagraph),
      sentenceLevel: Math.round(avgSentence),
      wordLevel: Math.round(avgSentence - 5),
    };
  } else {
    level = 'distinction';
    reasoning = `Distinction phase: essay is polished (${avgParagraph.toFixed(0)}/100 average, ${(strengthRatio * 100).toFixed(0)}% strong). Focus on the 1% that separates good from unforgettable.`;
    focusAreas = ['What makes this essay unforgettable', 'Voice uniqueness', 'The sentence an AO would quote', 'Distinctiveness amplification'];
    deferredAreas = ['Major structural changes (would harm an already strong essay)'];
    readiness = {
      essayLevel: Math.round(avgParagraph),
      paragraphLevel: Math.round(avgParagraph),
      sentenceLevel: Math.round(avgSentence),
      wordLevel: Math.round(avgSentence),
    };
  }

  return { level, reasoning, focusAreas, deferredAreas, readiness };
}

// ============================================================================
// CORE SERVICE
// ============================================================================

export class AnalysisPassService {
  /**
   * Run the L3.5 analysis pass across all paragraphs in parallel.
   *
   * @param profile - EssayProfile with completed L3 understanding + L3.75 holistic synthesis
   * @returns L35AnalysisResult with per-paragraph analyses and improvement phase
   */
  async analyzeAllParagraphs(profile: Readonly<EssayProfile>): Promise<L35AnalysisResult> {
    const startTime = Date.now();
    const totalUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    };
    let totalCost = 0;
    const failedParagraphs: Array<{ index: number; error: string }> = [];

    // Filter to paragraphs that have understanding (skip any that L3 failed on)
    const analyzableParagraphs = profile.paragraphs.filter(
      (para) => para.understanding && !para.walkSkipped && para.sentences.length > 0,
    );

    if (analyzableParagraphs.length === 0) {
      console.warn('[AnalysisPass] No analyzable paragraphs found — all skipped or missing understanding');
      return {
        paragraphAnalyses: [],
        improvementPhase: computeImprovementPhase([], profile),
        cost: 0,
        tokenUsage: totalUsage,
        timingMs: Date.now() - startTime,
        failedParagraphs: [],
      };
    }

    console.log(
      `[AnalysisPass] Starting L3.5 analysis for ${analyzableParagraphs.length} paragraphs (${CONCURRENCY_LIMIT} concurrent)`,
    );

    // Build cached context blocks (shared across all parallel calls)
    const systemPrompt = buildSystemPrompt();
    const profileContext = buildProfileContext(profile);

    // Run paragraph analyses in parallel with concurrency limit
    const results: AnalysisPassOutput[] = [];
    const executing = new Set<Promise<void>>();

    for (const para of analyzableParagraphs) {
      const task = this.analyzeSingleParagraph(
        para,
        profile.paragraphs.length,
        systemPrompt,
        profileContext,
      )
        .then((result) => {
          results.push(result.analysis);
          totalCost += result.cost;
          totalUsage.inputTokens += result.usage.input_tokens;
          totalUsage.outputTokens += result.usage.output_tokens;
          totalUsage.cacheReadTokens += result.usage.cache_read_input_tokens ?? 0;
          totalUsage.cacheWriteTokens += result.usage.cache_creation_input_tokens ?? 0;
        })
        .catch((error) => {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[AnalysisPass] Failed for P${para.index}: ${errorMsg}`);
          failedParagraphs.push({ index: para.index, error: errorMsg });
        })
        .finally(() => {
          executing.delete(task);
        });

      executing.add(task);

      if (executing.size >= CONCURRENCY_LIMIT) {
        await Promise.race(executing);
      }
    }

    // Wait for all remaining tasks
    await Promise.all(executing);

    // Sort results by paragraph index for deterministic ordering
    results.sort((a, b) => a.paragraphIndex - b.paragraphIndex);

    // Compute improvement phase from all completed analyses
    const improvementPhase = computeImprovementPhase(results, profile);

    const timingMs = Date.now() - startTime;
    console.log(
      `[AnalysisPass] Complete: ${results.length}/${analyzableParagraphs.length} paragraphs analyzed, ` +
      `${failedParagraphs.length} failed, phase=${improvementPhase.level}, ` +
      `cost=$${totalCost.toFixed(4)}, time=${timingMs}ms`,
    );

    return {
      paragraphAnalyses: results,
      improvementPhase,
      cost: totalCost,
      tokenUsage: totalUsage,
      timingMs,
      failedParagraphs,
    };
  }

  /**
   * Analyze a single paragraph. Used internally by analyzeAllParagraphs
   * and can be called directly for focused re-analysis of a specific paragraph.
   */
  async analyzeSingleParagraph(
    para: Readonly<ParagraphProfile>,
    paragraphCount: number,
    systemPrompt: string,
    profileContext: string,
  ): Promise<{
    analysis: AnalysisPassOutput;
    cost: number;
    usage: ClaudeResponse['usage'];
  }> {
    const paragraphPrompt = buildParagraphPrompt(para, paragraphCount);

    // 3-block prompt caching pattern:
    // Block 1: System prompt (static, cached forever via cacheSystemPrompt)
    // Block 2: Profile context (essay-specific, cached across parallel calls via user message cache_control)
    // Block 3: Paragraph-specific prompt (not cached)
    //
    // We combine Block 2 + Block 3 into the user message, but Block 2 is the
    // same across all calls so Anthropic's automatic prompt prefix caching kicks in.
    const userPrompt = `${profileContext}\n\n---\n\n${paragraphPrompt}`;

    const response = await callClaudeWithRetry<string>(
      {
        model: SONNET,
        systemPrompt,
        userPrompt,
        maxTokens: MAX_OUTPUT_TOKENS,
        temperature: ANALYSIS_TEMPERATURE,
        timeoutMs: PER_PARAGRAPH_TIMEOUT_MS,
        useJsonMode: false, // Parse manually for better error recovery
        cacheSystemPrompt: true,
      },
    );

    // Parse and validate the response
    const rawText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    let parsed: Record<string, unknown>;
    try {
      parsed = parseAnalysisJSON(rawText);
    } catch (parseError) {
      throw new Error(
        `JSON parse failed for P${para.index}: ${parseError instanceof Error ? parseError.message : String(parseError)}. ` +
        `Raw response starts with: "${rawText.substring(0, 200)}..."`,
      );
    }

    const analysis = validateAndTransform(parsed, para.index, para.sentences.length);
    const cost = calculateCost(response.usage, SONNET);

    return { analysis, cost, usage: response.usage };
  }

  /**
   * Re-analyze a specific paragraph (for focused re-analysis after edits).
   * Builds the full context from the profile and analyzes just one paragraph.
   */
  async reanalyzeParagraph(
    profile: Readonly<EssayProfile>,
    paragraphIndex: number,
  ): Promise<{
    analysis: AnalysisPassOutput;
    cost: number;
    usage: ClaudeResponse['usage'];
  }> {
    const para = profile.paragraphs[paragraphIndex];
    if (!para) {
      throw new Error(`Paragraph ${paragraphIndex} not found in profile`);
    }
    if (!para.understanding) {
      throw new Error(`Paragraph ${paragraphIndex} has no understanding — L3 walk must complete first`);
    }

    const systemPrompt = buildSystemPrompt();
    const profileContext = buildProfileContext(profile);

    return this.analyzeSingleParagraph(para, profile.paragraphs.length, systemPrompt, profileContext);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const analysisPassService = new AnalysisPassService();
