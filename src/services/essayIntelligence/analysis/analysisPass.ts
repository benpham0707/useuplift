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
  EssayType,
  ParagraphProfile,
  AnalysisPassOutput,
  ObservationEntry,
  ImprovementPhase,
  SentenceAnalysisConfidence,
} from '../profileTypes';
import { assessPhase } from './phaseAssessment';
import { callClaude, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import { parseLlmJsonOutput } from './llmJsonParser';
import type { FindingStore } from '../findings/findingStore';
import { buildAnnotationFindingContext } from '../findings/findingContextBuilder';

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
const CONCURRENCY_LIMIT = 2;

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
  /** Score distribution diagnostics — operational bookkeeping (Rule 6), not analytical judgment */
  distributionDiagnostics?: {
    sentenceScoreStdev: number;
    sentenceScoreRange: number;
    paragraphScoreStdev: number;
    paragraphScoreRange: number;
    lowConfidenceCount: number;
    anchorParagraphIndex: number;
  };
}

// ============================================================================
// ANCHOR PARAGRAPH SELECTION (System routing — Rule 6)
// ============================================================================

/**
 * Select the anchor paragraph for cross-paragraph calibration.
 * System routing decision: selects which paragraph to score first.
 * Does NOT influence scoring judgment — only determines scoring order.
 *
 * Selection priority:
 * 1. NarrativeStrategy.turningPoint paragraph (architecturally significant)
 * 2. Paragraph whose understanding.role contains "fulcrum" or "pivot"
 * 3. Paragraph with highest structural weight from L3.75 pivot points
 * 4. Paragraph with most sentences (more data = better calibration)
 * 5. Ultimate fallback: paragraph index 1 (first body paragraph)
 *
 * @returns { index: number; reason: string } — paragraph index and selection rationale
 */
function selectAnchorParagraph(
  profile: Readonly<EssayProfile>,
  analyzableParagraphIndices: number[],
): { index: number; reason: string } {
  if (analyzableParagraphIndices.length === 0) {
    return { index: 0, reason: 'no analyzable paragraphs — fallback to 0' };
  }

  // Priority 1: NarrativeStrategy.turningPoint
  if (profile.narrativeStrategy?.turningPoint != null) {
    const tpIdx = profile.narrativeStrategy.turningPoint.paragraph;
    if (analyzableParagraphIndices.includes(tpIdx)) {
      return { index: tpIdx, reason: `turning point paragraph (P${tpIdx})` };
    }
  }

  // Priority 2: Paragraph role contains "fulcrum" or "pivot"
  for (const idx of analyzableParagraphIndices) {
    const para = profile.paragraphs[idx];
    const role = para?.understanding?.role?.toLowerCase() ?? '';
    if (role.includes('fulcrum') || role.includes('pivot')) {
      return { index: idx, reason: `structural role contains fulcrum/pivot (P${idx}: "${para?.understanding?.role}")` };
    }
  }

  // Priority 3: Paragraph referenced by most pivot points
  if (profile.narrativeStrategy?.pivotPoints && profile.narrativeStrategy.pivotPoints.length > 0) {
    const pivotCounts = new Map<number, number>();
    for (const pivot of profile.narrativeStrategy.pivotPoints) {
      const pIdx = pivot.location.paragraph;
      if (analyzableParagraphIndices.includes(pIdx)) {
        pivotCounts.set(pIdx, (pivotCounts.get(pIdx) ?? 0) + 1);
      }
    }
    if (pivotCounts.size > 0) {
      let bestIdx = analyzableParagraphIndices[0];
      let bestCount = 0;
      for (const [idx, count] of pivotCounts) {
        if (count > bestCount) {
          bestIdx = idx;
          bestCount = count;
        }
      }
      return { index: bestIdx, reason: `highest pivot point density (P${bestIdx}, ${bestCount} pivots)` };
    }
  }

  // Priority 4: Paragraph with most sentences
  let maxSentences = 0;
  let maxSentencesIdx = analyzableParagraphIndices[0];
  for (const idx of analyzableParagraphIndices) {
    const sentenceCount = profile.paragraphs[idx]?.sentences.length ?? 0;
    if (sentenceCount > maxSentences) {
      maxSentences = sentenceCount;
      maxSentencesIdx = idx;
    }
  }
  if (maxSentences > 0) {
    return { index: maxSentencesIdx, reason: `most sentences (P${maxSentencesIdx}, ${maxSentences} sentences)` };
  }

  // Priority 5: Ultimate fallback — index 1 if available, else first analyzable
  const fallbackIdx = analyzableParagraphIndices.includes(1) ? 1 : analyzableParagraphIndices[0];
  return { index: fallbackIdx, reason: `ultimate fallback (P${fallbackIdx})` };
}

/**
 * Build cross-paragraph calibration context from the anchor paragraph's completed analysis.
 * Extracts the anchor's calibration reflection, strongest/weakest sentences, and scores.
 * Appended to Block 3 for all non-anchor paragraphs.
 */
function buildAnchorContext(anchorResult: AnalysisPassOutput): string {
  const lines: string[] = [];

  lines.push('## CROSS-PARAGRAPH CALIBRATION ANCHOR');
  lines.push('');
  lines.push(`Paragraph P${anchorResult.paragraphIndex} has already been scored as the calibration reference.`);
  lines.push('');

  // Include calibration reflection if available
  if (anchorResult.calibrationReflection) {
    lines.push('ANCHOR CALIBRATION REFLECTION:');
    lines.push(`"${anchorResult.calibrationReflection}"`);
    lines.push('');
  }

  // Anchor scores
  lines.push(`ANCHOR SCORES (P${anchorResult.paragraphIndex}):`);
  for (const sa of anchorResult.sentenceAnalyses) {
    const confLevel = sa.confidence?.level ?? 'not assessed';
    const reasoning = sa.effectivenessReasoning.slice(0, 120);
    lines.push(`  S${sa.sentenceIndex}: effectiveness=${sa.effectiveness} — "${reasoning}${sa.effectivenessReasoning.length > 120 ? '...' : ''}"`);
    lines.push(`  Confidence: ${confLevel}`);
  }
  lines.push(`Paragraph effectiveness: ${anchorResult.paragraphEffectiveness}`);
  lines.push('');

  // Extract strongest and weakest sentences as essay-specific calibration examples
  const sorted = [...anchorResult.sentenceAnalyses].sort((a, b) => b.effectiveness - a.effectiveness);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  if (strongest && weakest) {
    lines.push('ESSAY-SPECIFIC EXAMPLES (from anchor scoring):');
    lines.push(`  STRONGEST in anchor: P${anchorResult.paragraphIndex}S${strongest.sentenceIndex} scored ${strongest.effectiveness}`);
    lines.push(`    "${strongest.effectivenessReasoning.slice(0, 150)}${strongest.effectivenessReasoning.length > 150 ? '...' : ''}"`);
    lines.push(`  WEAKEST in anchor: P${anchorResult.paragraphIndex}S${weakest.sentenceIndex} scored ${weakest.effectiveness}`);
    lines.push(`    "${weakest.effectivenessReasoning.slice(0, 150)}${weakest.effectivenessReasoning.length > 150 ? '...' : ''}"`);
    lines.push('');
  }

  lines.push('YOUR CALIBRATION TASK:');
  lines.push(`- Compare this paragraph's quality to the anchor (P${anchorResult.paragraphIndex}, effectiveness ${anchorResult.paragraphEffectiveness}).`);
  lines.push(`- If this paragraph is overall WEAKER than P${anchorResult.paragraphIndex}, your paragraph effectiveness should be lower than ${anchorResult.paragraphEffectiveness}.`);
  lines.push('- If overall STRONGER, higher.');
  if (strongest && weakest) {
    lines.push(`- For individual sentences: use the anchor's strongest (${strongest.effectiveness}) and weakest (${weakest.effectiveness}) as reference points.`);
  }
  lines.push('- Include a "comparativeNotes" field explaining how this paragraph compares to the anchor.');
  lines.push('');
  lines.push('IMPORTANT: These are calibration REFERENCES, not constraints. If you determine this paragraph is genuinely comparable to the anchor, that is a valid assessment — just explain why in your comparative notes.');

  return lines.join('\n');
}

// ============================================================================
// DISTRIBUTION DIAGNOSTICS (System bookkeeping — Rule 6)
// ============================================================================

/**
 * Compute distribution diagnostics from completed paragraph analyses.
 * Operational bookkeeping: tracks what the LLM produced. Never overrides scores.
 */
function computeDistributionDiagnostics(
  results: AnalysisPassOutput[],
  anchorParagraphIndex: number,
): NonNullable<L35AnalysisResult['distributionDiagnostics']> {
  const allSentenceScores: number[] = [];
  const paragraphScores: number[] = [];
  let lowConfidenceCount = 0;

  for (const r of results) {
    paragraphScores.push(r.paragraphEffectiveness);
    for (const sa of r.sentenceAnalyses) {
      allSentenceScores.push(sa.effectiveness);
      if (sa.confidence?.level === 'low') lowConfidenceCount++;
    }
  }

  const sentenceStdev = computeStdev(allSentenceScores);
  const sentenceRange = allSentenceScores.length > 0
    ? Math.max(...allSentenceScores) - Math.min(...allSentenceScores)
    : 0;
  const paragraphStdev = computeStdev(paragraphScores);
  const paragraphRange = paragraphScores.length > 0
    ? Math.max(...paragraphScores) - Math.min(...paragraphScores)
    : 0;

  return {
    sentenceScoreStdev: Math.round(sentenceStdev * 10) / 10,
    sentenceScoreRange: sentenceRange,
    paragraphScoreStdev: Math.round(paragraphStdev * 10) / 10,
    paragraphScoreRange: paragraphRange,
    lowConfidenceCount,
    anchorParagraphIndex,
  };
}

/** Compute standard deviation of a number array */
function computeStdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
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

**Calibration examples** — internalize these before scoring:

SCORE 38: "From the moment my fingers first danced across the piano keys, I was captivated by the power to create worlds through sound."
WHY 38: 'Fingers danced' is stock phrasing found in thousands of essays. 'Captivated by the power to create worlds' is unearned grandiosity — no sensory detail, no specific memory, no physical grounding. Any applicant could write this sentence without having touched a piano.

SCORE 52: "I spent hours experimenting with chord progressions, fascinated by how minor adjustments transformed a piece's mood."
WHY 52: 'Hours experimenting' gestures at real practice but provides no sensory or temporal specifics. 'Fascinated by' tells us an emotion rather than showing it. However, 'minor adjustments transformed a piece's mood' demonstrates some musical understanding — the concept is real even if the language is generic.

SCORE 72: "Most Wednesdays smelled like bleach and citrus."
WHY 72: Specific day (not 'every day'), specific sensory registers (smell, not sight), grounds the reader physically in a real place. The double scent detail suggests genuine memory. Not 86+ because it's one good craft move, not a structurally complex sentence.

SCORE 88: "I wanted to disappear. For three weeks afterward, I couldn't pick up my violin without my stomach clenching."
WHY 88: 'Wanted to disappear' is emotionally honest without melodrama. 'Three weeks' is precise and devastating — not 'a while' or 'for some time.' 'Stomach clenching' is a physical, involuntary response that proves the emotion rather than asserting it. The sentence earns its emotional weight through bodily specificity.

## REFERENCING FINDINGS (PRIMARY CONTEXT)

Findings are labeled [F1], [F2], etc. They represent the system's STRUCTURED understanding — each carries evidence, scope, maturity, and coaching value. Reference findings by [F] label as your PRIMARY basis for analysis.

GOOD: "Effectiveness: 82. [F3] identifies a vulnerability pattern this sentence delivers on — the admission 'I didn't know what to say' earns its weight through specificity. Challenges [F5]'s reading of emotional avoidance."
BAD: (Analyzing without referencing available findings that directly relate)

## REFERENCING SENTENCE UNDERSTANDING (SUPPLEMENTARY)

Each sentence has a "Primary function" — a one-line architectural summary of what it does — and a "significance" level (pivotal/contributing/transitional). Use these to ground your analysis in what the sentence IS DOING, without re-deriving it.

GOOD: "Effectiveness: 82. This sentence's primary function — grounding the reader through physical transaction imagery — is achieved well: 'slid the ring across the glass counter' does the physical-world anchoring the understanding identifies."
BAD: "This sentence grounds the reader in the scene (re-deriving what the understanding layer already found) and also foreshadows later themes..."

## EVALUATION METHOD

For each sentence, follow this exact sequence:

1. **Reference the understanding** — cite the sentence's primary function and relevant [F] findings for what this sentence's purpose IS, don't re-derive it
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
   - Every strength MUST cite specific text: "the verb 'stumbled' conveys X" — not "the imagery is vivid"
6. **Identify weaknesses** — with SPECIFIC text evidence AND what improvement would look like in context
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

## PRE-SCORING CALIBRATION (mandatory before scoring any sentence)

**Anti-clustering rules:**
- If your scores cluster in the 75-90 range with no differentiation, you have FAILED.
- The strongest and weakest sentences in this paragraph MUST differ by at least 20 points. If you cannot find a 20-point difference, you are not reading critically enough.
- A mediocre essay's sentences should average 50-65, NOT 70-80. Reserve 70+ for sentences that genuinely earn it through specific detail, distinctive voice, or structural mastery.
- Use the FULL range. Cliched openings, unearned claims, and template language belong at 35-50 — not in the "functional" 55-75 band.

**Essay-specific ceiling/floor reflection** — complete BEFORE scoring:

1. CEILING: Identify the single moment (in any paragraph) where this writer's craft is strongest. What makes it strong? What score does it deserve?
2. FLOOR: Identify the single moment where craft is weakest. What makes it weak? What score does it deserve?
3. GAP: The difference between ceiling and floor is the MINIMUM differentiation range. If ceiling=84 and floor=42, use that 42-point span.
4. THIS PARAGRAPH'S POSITION: Where does it sit relative to ceiling and floor? A load-bearing paragraph that falls short scores lower than a transitional paragraph doing its small job well — structural importance amplifies both success and failure.

Output your calibration as a "calibrationReflection" field BEFORE the sentence analyses. It should be 2-4 sentences, essay-specific (not generic), referencing actual text.

BAD calibration (generic): "This essay has some strong and some weak moments. I will use the full scoring range."
GOOD calibration (essay-specific): "This essay's craft ceiling is P4S2's 'I couldn't pick up my violin without my stomach clenching' — embodied, precise, earned through the preceding silence. Score: ~86. The floor is P0S1's 'From the moment my fingers first danced across the piano keys, I was captivated by the power to create worlds through sound' — stock language with zero sensory specificity. Score: ~36. This paragraph (P2) is architecturally load-bearing but historically where this writer retreats from embodied experience to philosophical assertion. Expect wide variation."

## CONFIDENCE ASSESSMENT (required for each sentence)

After scoring each sentence, assess your confidence in that specific score:

"confidence": {
  "reasoning": "WHY you are this confident. Reference specific textual evidence or ambiguity. NOT 'I am fairly confident' — cite the specific text feature that makes you certain or uncertain.",
  "level": "high" | "moderate" | "low",
  "sensitivityNote": "What would change this score? Required for 'low' and 'moderate'. Null for 'high'."
}

CALIBRATION FOR CONFIDENCE LEVELS:
- "high": You would defend this score +/- 5 points. The textual evidence is unambiguous. A specific image that clearly works. A cliché that clearly doesn't.
- "moderate": This score is reasonable. +/- 8-10 points is defensible with different reading emphasis. The sentence has craft features that work AND features that don't.
- "low": Genuine ambiguity. You could see this scoring 15+ points different with additional context or knowledge of writer's intent. The ambiguity itself is diagnostic.

IMPORTANT: "low" confidence is NOT a failure. It is diagnostic information. An ambiguous sentence that could be intentional craft or accidental error SHOULD have low confidence — that ambiguity IS the teaching moment.

## OUTPUT FORMAT

Respond with a single JSON object matching this schema EXACTLY:

{
  "calibrationReflection": "string — essay-specific, not generic. References actual text. Must identify ceiling moment + score, floor moment + score, this paragraph's expected range.",
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
      "priorityForImprovement": 2,
      "confidence": {
        "reasoning": "string — cite specific text features making you certain or uncertain",
        "level": "high",
        "sensitivityNote": null
      }
    }
  ],
  "paragraphEffectiveness": 62,
  "paragraphVerdict": "string — one-sentence assessment of how well this paragraph fulfills its role",
  "comparativeNotes": "string | null — how this paragraph compares to the anchor. Null for the anchor itself.",
  "holisticAnalysisEvolution": {
    "strengthSignatures": [{ "quality": "string", "evidence": "string", "paragraphs": [0] }],
    "growthEdges": [{ "quality": "string", "description": "string", "paragraphs": [0] }],
    "aoTakeaway": "string — what an AO would think after reading this paragraph in context"
  }
}`;
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

  // Voice map (spatial voice tracking — complements voice identity)
  if (profile.voiceMap) {
    sections.push('\n--- Voice Map (spatial voice tracking) ---');
    // Baselines (always show)
    if (profile.voiceMap.register?.baseline) {
      sections.push(`Register baseline: ${profile.voiceMap.register.baseline}`);
    }
    if (profile.voiceMap.vocabularyFingerprint?.baseline) {
      sections.push(`Vocabulary: ${profile.voiceMap.vocabularyFingerprint.baseline}`);
      // Show up to 3 domains
      const domains = profile.voiceMap.vocabularyFingerprint.domains?.slice(0, 3);
      if (domains?.length) {
        sections.push(`  Domains: ${domains.map(d => `${d.domain}: [${d.exampleWords?.slice(0, 4).join(', ') ?? ''}]`).join('; ')}`);
      }
    }
    if (profile.voiceMap.sentenceRhythm?.baseline) {
      sections.push(`Rhythm: ${profile.voiceMap.sentenceRhythm.baseline}`);
    }
    if (profile.voiceMap.perspectiveDistance?.baseline) {
      sections.push(`Perspective: ${profile.voiceMap.perspectiveDistance.baseline}`);
    }
    if (profile.voiceMap.tonalDisposition?.baseline) {
      sections.push(`Tonal disposition: ${profile.voiceMap.tonalDisposition.baseline}`);
    }
    // Stability regions (max 3)
    if (profile.voiceMap.stabilityRegions?.length) {
      sections.push('Stability regions:');
      for (const region of profile.voiceMap.stabilityRegions.slice(0, 3)) {
        sections.push(`  P[${region.paragraphs?.join(',') ?? '?'}]: ${region.voiceCharacter ?? 'unknown'}`);
      }
    }
    // Voice shifts (ALL — most valuable for analysis)
    if (profile.voiceMap.shifts?.length) {
      sections.push('Voice shifts:');
      for (const shift of profile.voiceMap.shifts) {
        const loc = shift.location ? `P${shift.location.paragraph}${shift.location.sentence !== undefined ? 'S' + shift.location.sentence : ''}` : '?';
        const dims = shift.dimensions?.join(', ') ?? '';
        const intentAssessment = shift.intentionality?.assessment ?? '?';
        const intentConf = shift.intentionality?.confidence ?? '?';
        sections.push(`  ${loc} [${dims}]: ${shift.fromDescription ?? '?'} → ${shift.toDescription ?? '?'} (intentional: ${intentAssessment}, conf: ${intentConf})`);
      }
    }
    // Code-switching (max 3)
    if (profile.voiceMap.codeSwitching?.length) {
      sections.push('Code-switching:');
      for (const cs of profile.voiceMap.codeSwitching.slice(0, 3)) {
        const loc = cs.location ? `P${cs.location.paragraph}${cs.location.sentence !== undefined ? 'S' + cs.location.sentence : ''}` : '?';
        sections.push(`  ${loc}: ${cs.language ?? '?'} — ${cs.culturalFunction ?? ''}`);
      }
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
      // Show mechanism count without pre-judging earnedness — let the LLM evaluate the quality
      // of earning based on the mechanisms themselves, not a threshold formula (LLM-first Rule 1)
      sections.push(`  ${moment.momentType} at P${moment.location.paragraph}S${moment.location.sentence}: ${moment.description} [${moment.mechanisms.length} earning mechanism(s)]`);
      if (moment.mechanisms?.length) {
        for (const mech of moment.mechanisms) {
          const loc = mech.location ? `P${mech.location.paragraph}${mech.location.sentence !== undefined ? 'S' + mech.location.sentence : ''}` : '';
          const contribution = mech.contribution ? mech.contribution.substring(0, 120) : '';
          sections.push(`    Mechanism: ${mech.type ?? 'unknown'} from ${loc}: ${contribution}`);
        }
      }
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
  // Phase 2: primaryFunction per sentence + findings (via [F] labels) replace [U] observation labels.
  sections.push('\n=== PER-PARAGRAPH UNDERSTANDING ===');
  sections.push('(Each sentence shows its primary function and significance level. Reference findings by [F] label for deeper context.)');
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
      // Phase 2: primaryFunction is the primary per-sentence understanding
      if (sentence.understanding.primaryFunction) {
        sections.push(`    Primary function: ${sentence.understanding.primaryFunction} [${sentence.understanding.significance ?? 'contributing'}]`);
      } else {
        // Fallback for pre-Phase-1 profiles
        const funcs = sentence.understanding.observedFunctions.map(o => o.observation).join('; ');
        if (funcs) sections.push(`    Functions: ${funcs}`);
      }
      if (sentence.understanding.craft.techniques.length > 0) {
        sections.push(`    Craft: rhythm=${sentence.understanding.craft.rhythm}, techniques=[${sentence.understanding.craft.techniques.join(', ')}]`);
      }
    }
  }

  // Connections
  const activeConns = profile.connections?.all.filter(c => c.status === 'active') ?? [];
  if (activeConns.length > 0) {
    sections.push('\n=== CONNECTIONS ===');
    for (const conn of activeConns) {
      const from = conn.from.sentence !== undefined
        ? `P${conn.from.paragraph}S${conn.from.sentence}`
        : `P${conn.from.paragraph}`;
      const to = conn.to.sentence !== undefined
        ? `P${conn.to.paragraph}S${conn.to.sentence}`
        : `P${conn.to.paragraph}`;
      sections.push(`  ${conn.id}: ${from} → ${to}: ${conn.description} [${conn.routingTags.join(',')}] (${conn.strengthCategory})`);
    }
  }

  return sections.join('\n');
}

/**
 * Filter stale area hints to only include those relevant to a specific paragraph.
 *
 * M4 fix: staleAreaHints were previously broadcast verbatim to ALL paragraphs,
 * wasting tokens and potentially confusing the model for unrelated paragraphs.
 * Now, paragraph-specific hints are only included for the matching paragraph,
 * while global hints (no paragraph reference) are included for all paragraphs.
 *
 * Handles two labeling conventions:
 * - "P1", "P2" etc. (1-based, used in prompt labels and human-authored hints)
 * - "paragraph 0", "paragraph 1" etc. (0-based, from versionTracker.humanizeStaleKey)
 * - "sentence N in paragraph M" (0-based, from versionTracker.humanizeStaleKey)
 */
function filterHintsForParagraph(hints: string[], paragraphIndex: number): string[] {
  return hints.filter(h => {
    // Check for P-label format (1-based: P1, P2, P3)
    const hasPLabel = /\bP\d+\b/.test(h);
    // Check for "paragraph N" format (0-based: paragraph 0, paragraph 1)
    const hasParagraphWord = /\bparagraph\s+\d+\b/i.test(h);

    if (!hasPLabel && !hasParagraphWord) {
      return true; // Global hint (no paragraph reference) — include for all paragraphs
    }

    // Check P-label match (P1 = paragraph index 0)
    if (hasPLabel) {
      const pLabel = `P${paragraphIndex + 1}`;
      if (h.includes(pLabel)) return true;
    }

    // Check "paragraph N" match (0-based index)
    if (hasParagraphWord) {
      const paragraphPattern = new RegExp(`\\bparagraph\\s+${paragraphIndex}\\b`, 'i');
      if (paragraphPattern.test(h)) return true;
    }

    return false; // Paragraph-specific hint that doesn't match this paragraph
  });
}

/**
 * Block 3: Per-paragraph specifics (NOT cached — unique per call).
 *
 * @param anchorContext - Optional anchor configuration:
 *   - isAnchor: true → adds anchor-specific instructions
 *   - anchorReason: why this paragraph was selected as anchor
 *   - context: formatted anchor context string for non-anchor paragraphs
 */
function buildParagraphPrompt(
  para: Readonly<ParagraphProfile>,
  paragraphCount: number,
  staleAreaHints?: string[],
  findingContext?: string,
  anchorConfig?: { isAnchor: boolean; anchorReason?: string; context?: string },
): string {
  const lines: string[] = [];

  if (anchorConfig?.isAnchor) {
    lines.push(`ANALYZE PARAGRAPH ${para.index} (of ${paragraphCount - 1} total, zero-indexed)`);
    lines.push(`THIS IS THE ANCHOR PARAGRAPH — your scores will calibrate all subsequent paragraph analyses.`);
  } else {
    lines.push(`ANALYZE PARAGRAPH ${para.index} (of ${paragraphCount - 1} total, zero-indexed)`);
  }
  lines.push('');
  lines.push(`TEXT:`);
  for (const s of para.sentences) {
    lines.push(`  [S${s.index}] "${s.text}"`);
    // W2.1: Inject per-sentence understanding context (primaryFunction + significance + tags)
    // so the LLM has immediate access to what each sentence IS DOING alongside the text.
    if (s.understanding?.primaryFunction) {
      lines.push(`    [Function: ${s.understanding.primaryFunction}, significance: ${s.understanding.significance ?? 'contributing'}]`);
    }
    if (s.understanding?.tags?.length) {
      lines.push(`    [Tags: ${s.understanding.tags.join(', ')}]`);
    }
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

  if (staleAreaHints && staleAreaHints.length > 0) {
    // M4 fix: Filter hints to only include those relevant to this paragraph.
    // Paragraph-specific hints (e.g., "P3 voice analysis is stale") only go to P3.
    // Global hints (e.g., "overall theme coherence is stale") go to all paragraphs.
    const relevantHints = filterHintsForParagraph(staleAreaHints, para.index);
    if (relevantHints.length > 0) {
      lines.push(`STALE AREAS (re-evaluate carefully — student edits may have addressed or worsened these):`);
      for (const hint of relevantHints) {
        lines.push(`• ${hint}`);
      }
      lines.push('');
    }
  }

  // W1.5: Inject finding context for this paragraph when available
  if (findingContext && findingContext.length > 0) {
    lines.push(findingContext);
    lines.push('');
  }

  // Anchor-specific instructions
  if (anchorConfig?.isAnchor) {
    lines.push(`WHY THIS IS THE ANCHOR:`);
    lines.push(`This paragraph was selected as the calibration anchor because ${anchorConfig.anchorReason ?? 'it is architecturally significant'}. Your scores here establish the baseline that all subsequent paragraph analyses will calibrate against.`);
    lines.push('');
    lines.push(`ANCHOR-SPECIFIC INSTRUCTIONS:`);
    lines.push(`1. Be ESPECIALLY precise in your calibration reflection. Your ceiling and floor identification will be forwarded to all subsequent paragraph analyses as calibration reference points.`);
    lines.push(`2. After scoring, the system will extract your STRONGEST and WEAKEST sentence scores to serve as essay-specific calibration examples for subsequent paragraphs.`);
    lines.push(`3. Your scores should use the FULL range justified by the text. If your strongest sentence is 82 and your weakest is 78, you are not reading this paragraph critically enough.`);
    lines.push('');
  }

  // Non-anchor: inject cross-paragraph calibration context
  if (anchorConfig?.context) {
    lines.push(anchorConfig.context);
    lines.push('');
  }

  lines.push(`INSTRUCTIONS:`);
  lines.push(`1. First, rank all ${para.sentences.length} sentences in this paragraph from strongest to weakest. The ranking informs your thinking — it does NOT force the scores. Two sentences may rank adjacently but score identically if they are genuinely equal.`);
  lines.push(`2. Then evaluate each sentence — reasoning BEFORE score. Let the reasoning determine the score, not the reverse.`);
  lines.push(`3. Ensure genuine differentiation. If all your scores fall within a 15-point band, reconsider whether you are applying the calibration reflection's ceiling and floor honestly.`);
  lines.push(`4. Every strength and weakness must cite specific text from the sentence.`);
  lines.push(`5. Produce the JSON output matching the schema in the system prompt.`);
  lines.push(`6. Remember: clichéd language, template phrasing, and unearned claims belong at 35-50. Only give 70+ to sentences with genuine specificity, voice, or structural craft.`);

  return lines.join('\n');
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

      // Extract confidence metadata — LLM-assessed, system never computes this
      let confidence: SentenceAnalysisConfidence | undefined;
      if (rawSA.confidence && typeof rawSA.confidence === 'object') {
        const rawConf = rawSA.confidence as Record<string, unknown>;
        const level = String(rawConf.level || 'moderate');
        const validLevel = (level === 'high' || level === 'moderate' || level === 'low') ? level : 'moderate';
        confidence = {
          reasoning: String(rawConf.reasoning || 'Confidence not assessed'),
          level: validLevel,
          sensitivityNote: typeof rawConf.sensitivityNote === 'string' ? rawConf.sensitivityNote : null,
        };
      }

      sentenceAnalyses.push({
        sentenceIndex: i,
        effectiveness,
        effectivenessReasoning: String(rawSA.effectivenessReasoning || 'No reasoning provided'),
        strengths: extractObservations(rawSA.strengths),
        weaknesses: extractObservations(rawSA.weaknesses),
        isStrength: typeof rawSA.isStrength === 'boolean' ? rawSA.isStrength : effectiveness >= 76,
        isProblem: typeof rawSA.isProblem === 'boolean' ? rawSA.isProblem : effectiveness < 50,
        priorityForImprovement: clampPriority(Number(rawSA.priorityForImprovement) || 0),
        confidence,
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

  // Extract calibration reflection and comparative notes (anti-clustering metadata)
  const calibrationReflection = typeof raw.calibrationReflection === 'string' && raw.calibrationReflection.length > 0
    ? raw.calibrationReflection
    : undefined;
  const comparativeNotes = typeof raw.comparativeNotes === 'string' && raw.comparativeNotes.length > 0
    ? raw.comparativeNotes
    : null;

  return {
    paragraphIndex,
    sentenceAnalyses,
    paragraphEffectiveness,
    paragraphVerdict,
    calibrationReflection,
    comparativeNotes: comparativeNotes ?? undefined,
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
      return { observation: item, confidence: 0.5, evidence: '' };
    }
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      return {
        observation: String(obj.observation || obj.text || ''),
        confidence: typeof obj.confidence === 'number' ? obj.confidence : 0.5,
        evidence: typeof obj.evidence === 'string' ? obj.evidence : '',
      };
    }
    return { observation: String(item), confidence: 0.5, evidence: '' };
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

// Phase assessment is now handled by phaseAssessment.ts (LLM-assessed via Sonnet).
// The old deterministic computeImprovementPhase, PHASE_THRESHOLDS, computeDimensionPhases,
// dimensionPhaseFromRatio, deriveFocusAreas, isInFuzzyZone, and FUZZY_HALF_WIDTH have been
// removed. See assessPhase() in phaseAssessment.ts.

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
  async analyzeAllParagraphs(
    profile: Readonly<EssayProfile>,
    staleAreaHints?: string[],
    findingStore?: FindingStore,
    essayType?: EssayType,
  ): Promise<L35AnalysisResult> {
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
      const emptyPhaseResult = await assessPhase({ analyses: [], profile, essayType });
      return {
        paragraphAnalyses: [],
        improvementPhase: emptyPhaseResult.phase,
        cost: emptyPhaseResult.cost,
        tokenUsage: emptyPhaseResult.tokenUsage,
        timingMs: Date.now() - startTime,
        failedParagraphs: [],
      };
    }

    // Build cached context blocks (shared across all parallel calls)
    const systemPrompt = buildSystemPrompt();
    const profileContext = buildProfileContext(profile);

    // ── Anchor-then-parallel scoring (anti-clustering) ──
    // Step 1: Select and score the anchor paragraph first (sequential)
    // Step 2: Score remaining paragraphs in parallel with anchor context
    const analyzableIndices = analyzableParagraphs.map(p => p.index);
    const anchor = selectAnchorParagraph(profile, analyzableIndices);
    console.log(
      `[AnalysisPass] Starting L3.5 analysis for ${analyzableParagraphs.length} paragraphs. ` +
      `Anchor: P${anchor.index} (${anchor.reason}). Concurrency: ${CONCURRENCY_LIMIT}`,
    );

    const results: AnalysisPassOutput[] = [];

    // ── Step 1: Score anchor paragraph (sequential) ──
    let anchorContextStr: string | undefined;
    const anchorPara = analyzableParagraphs.find(p => p.index === anchor.index);

    if (anchorPara) {
      // W2.1: Use buildAnnotationFindingContext for [F] label format that matches
      // system prompt's "Reference findings by [F] label" instruction. Also includes
      // essay-level and cross-paragraph findings relevant to this paragraph.
      const anchorFindingContext = findingStore
        ? buildAnnotationFindingContext(findingStore, anchorPara.index)
        : undefined;

      try {
        const anchorResult = await this.analyzeSingleParagraph(
          anchorPara,
          profile.paragraphs.length,
          systemPrompt,
          profileContext,
          staleAreaHints,
          anchorFindingContext || undefined,
          { isAnchor: true, anchorReason: anchor.reason },
        );
        results.push(anchorResult.analysis);
        totalCost += anchorResult.cost;
        totalUsage.inputTokens += anchorResult.usage.input_tokens;
        totalUsage.outputTokens += anchorResult.usage.output_tokens;
        totalUsage.cacheReadTokens += anchorResult.usage.cache_read_input_tokens ?? 0;
        totalUsage.cacheWriteTokens += anchorResult.usage.cache_creation_input_tokens ?? 0;

        // Build anchor context for subsequent parallel calls
        anchorContextStr = buildAnchorContext(anchorResult.analysis);

        // Check anchor confidence — low-confidence anchor weakens calibration
        const anchorLowConf = anchorResult.analysis.sentenceAnalyses
          .filter(sa => sa.confidence?.level === 'low').length;
        if (anchorLowConf > anchorResult.analysis.sentenceAnalyses.length * 0.5) {
          console.warn(
            `[AnalysisPass] Anchor P${anchor.index} scored with predominantly low confidence ` +
            `(${anchorLowConf}/${anchorResult.analysis.sentenceAnalyses.length}) — cross-paragraph calibration may be weakened`,
          );
        }

        console.log(
          `[AnalysisPass] Anchor P${anchor.index} complete: effectiveness=${anchorResult.analysis.paragraphEffectiveness}, ` +
          `score range=${Math.min(...anchorResult.analysis.sentenceAnalyses.map(s => s.effectiveness))}-` +
          `${Math.max(...anchorResult.analysis.sentenceAnalyses.map(s => s.effectiveness))}`,
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[AnalysisPass] Anchor P${anchor.index} failed: ${errorMsg}. Falling back to parallel without anchor context.`);
        failedParagraphs.push({ index: anchor.index, error: errorMsg });
        // anchorContextStr stays undefined — parallel calls proceed without calibration context
      }
    }

    // ── Step 2: Score remaining paragraphs in parallel with anchor context ──
    const remainingParagraphs = analyzableParagraphs.filter(p => p.index !== anchor.index);
    const executing = new Set<Promise<void>>();

    for (const para of remainingParagraphs) {
      // W2.1: Use buildAnnotationFindingContext for [F] label format consistency
      const paraFindingContext = findingStore
        ? buildAnnotationFindingContext(findingStore, para.index)
        : undefined;

      const task = this.analyzeSingleParagraph(
        para,
        profile.paragraphs.length,
        systemPrompt,
        profileContext,
        staleAreaHints,
        paraFindingContext || undefined,
        anchorContextStr ? { isAnchor: false, context: anchorContextStr } : undefined,
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

    // ── Score distribution diagnostics (System bookkeeping — Rule 6) ──
    const diagnostics = computeDistributionDiagnostics(results, anchor.index);

    // Enhanced clustering detection with confidence context
    if (results.length >= 3) {
      const { paragraphScoreStdev: pStdev, paragraphScoreRange: pRange, lowConfidenceCount } = diagnostics;
      const totalSentences = results.reduce((sum, r) => sum + r.sentenceAnalyses.length, 0);

      if (pStdev < 5 && pRange < 15) {
        const highConfidenceCount = results.reduce(
          (sum, r) => sum + r.sentenceAnalyses.filter(sa => sa.confidence?.level === 'high').length, 0,
        );
        const highConfRatio = totalSentences > 0 ? highConfidenceCount / totalSentences : 0;

        if (highConfRatio > 0.7) {
          console.warn(
            `[AnalysisPass] CLUSTERING DETECTED but ${(highConfRatio * 100).toFixed(0)}% high-confidence — may be genuine uniformity. ` +
            `stdev=${pStdev.toFixed(1)}, range=${pRange}`,
          );
        } else {
          console.warn(
            `[AnalysisPass] CLUSTERING DETECTED with ${(highConfRatio * 100).toFixed(0)}% high-confidence — likely scoring laziness. ` +
            `stdev=${pStdev.toFixed(1)}, range=${pRange}, scores=[${results.map(r => r.paragraphEffectiveness).join(',')}]`,
          );
        }
      }

      // Log distribution metrics (useful for calibration tuning)
      const paragraphScores = results.map(r => r.paragraphEffectiveness);
      const mean = paragraphScores.reduce((a, b) => a + b, 0) / paragraphScores.length;
      console.log(
        `[AnalysisPass] Score distribution: mean=${mean.toFixed(1)}, stdev=${pStdev.toFixed(1)}, ` +
        `range=${pRange}, min=${Math.min(...paragraphScores)}, max=${Math.max(...paragraphScores)}, ` +
        `lowConfidence=${lowConfidenceCount}/${totalSentences}`,
      );

      // Sentence-level distribution within each paragraph
      for (const result of results) {
        const sentenceScores = result.sentenceAnalyses.map(sa => sa.effectiveness);
        if (sentenceScores.length >= 3) {
          const sStdev = computeStdev(sentenceScores);
          const sRange = Math.max(...sentenceScores) - Math.min(...sentenceScores);
          if (sStdev < 5 && sRange < 15) {
            console.warn(
              `[AnalysisPass] SENTENCE CLUSTERING in P${result.paragraphIndex}: ` +
              `stdev=${sStdev.toFixed(1)}, range=${sRange}, scores=[${sentenceScores.join(',')}]`,
            );
          }
        }
      }
    }

    // Assess improvement phase via LLM (Sonnet synthesis call)
    const priorPhase = profile.index?.improvementPhase ?? null;
    const phaseResult = await assessPhase({
      analyses: results,
      profile,
      essayType,
      priorPhase: priorPhase.level !== 'foundation' || priorPhase.reasoning !== 'Initial profile — no analysis has been performed yet'
        ? priorPhase
        : null,
    });
    const improvementPhase = phaseResult.phase;

    if (phaseResult.isDegraded) {
      console.warn(`[L3.5] Phase assessment degraded: ${phaseResult.degradationReason ?? 'unknown reason'}. Using fallback phase: ${improvementPhase.level}`);
    }

    // Add phase assessment cost to totals
    totalCost += phaseResult.cost;
    totalUsage.inputTokens += phaseResult.tokenUsage.inputTokens;
    totalUsage.outputTokens += phaseResult.tokenUsage.outputTokens;
    totalUsage.cacheReadTokens += phaseResult.tokenUsage.cacheReadTokens;
    totalUsage.cacheWriteTokens += phaseResult.tokenUsage.cacheWriteTokens;

    // Phase confidence diagnostic: if many scores are low-confidence, log reduced reliability
    if (diagnostics.lowConfidenceCount > 0) {
      const totalSentences = results.reduce((sum, r) => sum + r.sentenceAnalyses.length, 0);
      const lowConfRatio = totalSentences > 0 ? diagnostics.lowConfidenceCount / totalSentences : 0;
      if (lowConfRatio > 0.3) {
        console.log(
          `[AnalysisPass] Phase reliability note: ${(lowConfRatio * 100).toFixed(0)}% of sentence scores are low-confidence — ` +
          `phase assignment (${improvementPhase.level}) has reduced reliability`,
        );
      }
    }

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
      distributionDiagnostics: diagnostics,
    };
  }

  /**
   * Analyze a single paragraph. Used internally by analyzeAllParagraphs
   * and can be called directly for focused re-analysis of a specific paragraph.
   *
   * @param anchorConfig - Optional anchor configuration for anti-clustering calibration:
   *   - isAnchor: true → adds anchor-specific instructions to the prompt
   *   - anchorReason: why this paragraph was selected as anchor
   *   - context: formatted anchor context string (for non-anchor paragraphs)
   */
  async analyzeSingleParagraph(
    para: Readonly<ParagraphProfile>,
    paragraphCount: number,
    systemPrompt: string,
    profileContext: string,
    staleAreaHints?: string[],
    findingContext?: string,
    anchorConfig?: { isAnchor: boolean; anchorReason?: string; context?: string },
  ): Promise<{
    analysis: AnalysisPassOutput;
    cost: number;
    usage: ClaudeResponse['usage'];
  }> {
    const paragraphPrompt = buildParagraphPrompt(para, paragraphCount, staleAreaHints, findingContext, anchorConfig);

    // 3-block prompt caching pattern:
    // Block 1: System prompt (static, cached forever via cacheSystemPrompt)
    // Block 2: Profile context (essay-specific, cached across parallel calls via user message cache_control)
    // Block 3: Paragraph-specific prompt (not cached)
    //
    // We combine Block 2 + Block 3 into the user message, but Block 2 is the
    // same across all calls so Anthropic's automatic prompt prefix caching kicks in.
    const userPrompt = `${profileContext}\n\n---\n\n${paragraphPrompt}`;

    const response = await callClaude<string>(
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
    const parsed = parseLlmJsonOutput(response.content, `L3.5 analysisPass P${para.index}`);
    const analysis = validateAndTransform(parsed, para.index, para.sentences.length);
    const cost = calculateCost(response.usage, SONNET);
    console.log(
      `[EssayIntelligence] L3.5 P${para.index}: ${response.usage.input_tokens.toLocaleString()} input + ${response.usage.output_tokens.toLocaleString()} output = $${cost.toFixed(4)}`,
    );

    return { analysis, cost, usage: response.usage };
  }

  /**
   * Re-analyze a specific paragraph (for focused re-analysis after edits).
   * Builds the full context from the profile and analyzes just one paragraph.
   *
   * When prior comprehensive analysis exists, uses the prior anchor paragraph's
   * scores as calibration context to maintain cross-paragraph consistency.
   *
   * @param priorAnchorAnalysis - Optional: the anchor paragraph's analysis from the
   *   last comprehensive pass. If provided, builds anchor context for calibration.
   */
  async reanalyzeParagraph(
    profile: Readonly<EssayProfile>,
    paragraphIndex: number,
    priorAnchorAnalysis?: AnalysisPassOutput,
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

    // Use prior anchor context for calibration if available and this isn't the anchor itself
    let anchorConfig: { isAnchor: boolean; context?: string } | undefined;
    if (priorAnchorAnalysis && priorAnchorAnalysis.paragraphIndex !== paragraphIndex) {
      anchorConfig = { isAnchor: false, context: buildAnchorContext(priorAnchorAnalysis) };
    }

    return this.analyzeSingleParagraph(
      para, profile.paragraphs.length, systemPrompt, profileContext,
      undefined, undefined, anchorConfig,
    );
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const analysisPassService = new AnalysisPassService();
