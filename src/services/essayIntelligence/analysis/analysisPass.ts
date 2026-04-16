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
import {
  TECHNIQUE_VOCABULARY_PROMPT_BLOCK,
  normalizeTechnique,
} from './techniqueVocabulary';
import { ImprovementCandidateStore } from '../improvements/improvementCandidateStore';
import type { ImprovementCandidate } from '../profileTypes';
import { PipelineError } from '../errors';

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
  /** Which analysis mode was used: essay_level (1 Sonnet call) or paragraph_level (anchor + parallel) */
  analysisMode: 'essay_level' | 'paragraph_level';
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
/**
 * Extract the first complete sentence from a reasoning string.
 *
 * Scope 1 Phase 2 (GAP-3): `buildAnchorContext()` previously truncated
 * `effectivenessReasoning` at 120/150 characters, cutting mid-word and
 * losing the end of the first sentence. R4 flagged this as load-bearing:
 * `effectivenessReasoning` is consumed full-length downstream by coaching
 * (`coachingService.ts:2355` via `profile.activeConcerns`), so the
 * GENERATION must stay uncapped — only the RE-INJECTION into anchor
 * context needs a tighter budget.
 *
 * This helper extracts the first complete sentence (up to the first `.`,
 * `?`, or `!` followed by whitespace or end-of-string) and returns it as-is.
 * If the reasoning has no sentence boundary, returns the full string.
 * This preserves readable context while bounding size to ~120-250 chars
 * (the natural length of a first sentence) instead of mid-word truncation.
 *
 * Exported for testability — tests/test-scope1-phase2-runtime.ts exercises
 * the regex edge cases directly.
 */
export function extractFirstSentence(text: string): string {
  if (!text) return '';
  // Match text up to the first sentence-ending punctuation followed by
  // whitespace or end-of-string. Handles common abbreviations by requiring
  // whitespace after the punctuation (so "P1S2." inside a reference doesn't
  // end the sentence early — but "first claim." followed by " second claim"
  // does).
  const match = text.match(/^[^.?!]*[.?!](?=\s|$)/);
  return match ? match[0].trim() : text.trim();
}

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

  // Anchor scores — extract first complete sentence from each reasoning
  // rather than char-slicing. See extractFirstSentence() doc above.
  lines.push(`ANCHOR SCORES (P${anchorResult.paragraphIndex}):`);
  for (const sa of anchorResult.sentenceAnalyses) {
    const confLevel = sa.confidence?.level ?? 'not assessed';
    const firstSentence = extractFirstSentence(sa.effectivenessReasoning);
    lines.push(`  S${sa.sentenceIndex}: effectiveness=${sa.effectiveness} — "${firstSentence}"`);
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
    lines.push(`    "${extractFirstSentence(strongest.effectivenessReasoning)}"`);
    lines.push(`  WEAKEST in anchor: P${anchorResult.paragraphIndex}S${weakest.sentenceIndex} scored ${weakest.effectiveness}`);
    lines.push(`    "${extractFirstSentence(weakest.effectivenessReasoning)}"`);
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

${TECHNIQUE_VOCABULARY_PROMPT_BLOCK}

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

SCORE 78 (admissions resonance): "That semester my GPA dropped from a 3.8 to a 2.4, and I told no one."
WHY 78: Craft is PLAIN — no imagery, no metaphor, no rhythm. But admissions resonance is exceptional: the specific numbers (3.8 → 2.4) prove this is real, not performed. 'I told no one' reveals isolation, shame, and the gap between public persona and private struggle — an AO learns more about this applicant from this one sentence than from three paragraphs of polished prose. High revelation density compensates for modest craft. This is what it looks like when admissions resonance outweighs pure craft in scoring.

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
   - **Admissions resonance** — does this sentence reveal something about the writer that an admissions officer would REMEMBER? A plain sentence that shows character, values, or growth can outperform a "well-crafted" sentence that reveals nothing.
   - **Revelation density** — how much does this sentence advance the reader's understanding of WHO this person is? High revelation density means the sentence does double duty: it moves the narrative AND reveals the writer. Low revelation density means the sentence serves structure but is interchangeable with any applicant's version.

   **WEIGHT**: In a college admissions essay, admissions resonance and revelation density carry MORE weight than pure craft. A technically plain sentence that reveals genuine character insight (e.g., an honest admission of failure, a specific detail that could only come from THIS writer's life) should score HIGHER than a beautifully crafted sentence that reveals nothing memorable about the applicant. Craft serves revelation, not the other way around.
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

**Inter-essay calibration — expected score distributions by essay quality tier:**

Think about WHERE this essay sits among all the college essays you've read. Different quality tiers produce fundamentally different score distributions:

| Essay Quality Tier | Expected Sentence Average | Typical Range | Signal |
|---------------------|--------------------------|---------------|--------|
| WEAK (undeveloped, confused, generic throughout) | 35-45 | 25-60 | Mostly telling, vague, unearned. Few sentences with any specificity. |
| MEDIOCRE (competent but interchangeable, "could be anyone's essay") | 45-55 | 30-70 | Some functional craft but nothing distinctive. Stock phrases, generic reflections. |
| COMPETENT (solid structure, some good moments, some generic stretches) | 55-65 | 40-80 | Clear thesis, generally effective, but voice is inconsistent. |
| STRONG (distinctive voice, specific imagery, mostly earned moments) | 65-75 | 45-90 | Memorable passages, authentic voice, genuine specificity. |
| EXCEPTIONAL (would make an AO pause, re-read, and remember) | 75-85 | 55-95 | Nearly every sentence earns its place. Distinctive craft throughout. |

**COMPRESSION CHECK**: If most of your sentence scores fall in the 55-75 band regardless of essay quality, you are COMPRESSING. A mediocre essay should NOT average 65 — that score belongs to competent essays with genuine craft moments. A weak essay should NOT average 55 — that's still "functional," and weak essays are below functional.

Before scoring, explicitly classify this essay into one of these tiers and let that classification anchor your scoring range. State your tier classification in the calibrationReflection.

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

## IMPROVEMENT CANDIDATE EMISSION (Scope 2 Phase 5)

For every sentence whose analysis surfaces a CONCRETE, LOCALIZED improvement opportunity, emit an "improvementCandidate" alongside the analysis. This is where your evaluation becomes actionable for downstream consolidation and coaching.

Emit a candidate ONLY when:
- You can articulate a specific change to this sentence (or its immediate neighborhood), not a general area of improvement.
- The suggestedChange is something a student could act on in one edit pass — not an abstract goal like "develop voice more."
- The observation is tied to specific text you cite in effectivenessReasoning, strengths, or weaknesses.

DO NOT emit a candidate when:
- The sentence works well enough that no localized change is worth suggesting (skip — do not force one).
- The needed change is paragraph-wide or essay-wide (that belongs to L3.75, not L3.5).
- You would have to invent fabricated details to describe the change.

Fields (omit the field entirely when not emitting):
- "observation": 1-2 sentences. What's not working, in specific terms. Cite text. Must be grounded in your strengths/weaknesses analysis.
- "suggestedChange": 1-2 sentences. The concrete change. Imperative voice ("Replace 'very difficult' with the specific physical sensation you felt"). No generic advice.
- "technique": one of the technique vocabulary names above, or null. Pick at most one; pick null if none cleanly apply. Case-sensitive.
- "demonstrationSketch": OPTIONAL. A 1-sentence rewrite sketch (leave null — L5 writes the polished rewrite). Emit only if a minimal sketch clarifies the suggestion.
- "coachingValue": one of "critical" | "high" | "medium" | "diagnostic". Critical = load-bearing sentence with a clear flaw. High = significant local improvement. Medium = genuine polish opportunity. Diagnostic = interesting observation, low action urgency.

The orchestrator harvests these into the ImprovementCandidateStore after L3.5 completes. Duplicate IDs are handled automatically — do not worry about collisions with L3 candidates on the same sentence; the store's lifecycle model handles them.

## OUTPUT FORMAT

Respond with a single JSON object matching this schema EXACTLY:

{
  "calibrationReflection": "string — essay-specific, not generic. References actual text. Must identify ceiling moment + score, floor moment + score, this paragraph's expected range.",
  "sentenceRanking": ["brief justification for ranking order — strongest to weakest"],
  "sentenceAnalyses": [
    {
      "sentenceIndex": 0,
      "effectivenessReasoning": "string — WHY this score, referencing understanding (uncapped: this IS your reasoning chain and is consumed by downstream coaching)",
      "effectiveness": 65,
      "strengths": [
        { "observation": "string — what works", "evidence": "string — specific text cited, MAX 10 WORDS", "confidence": 0.9 }
      ],
      "weaknesses": [
        { "observation": "string — what doesn't work", "evidence": "string — specific text cited, MAX 10 WORDS", "confidence": 0.85 }
      ],
      "isStrength": false,
      "isProblem": false,
      "priorityForImprovement": 2,
      "confidence": {
        "reasoning": "string — cite specific text features making you certain or uncertain",
        "level": "high",
        "sensitivityNote": null
      },
      "improvementCandidate": {
        "observation": "string — cites specific text, 1-2 sentences",
        "suggestedChange": "string — concrete imperative change, 1-2 sentences",
        "technique": "SUMMARY-TO-SCENE | ... | null",
        "demonstrationSketch": "string | null",
        "coachingValue": "critical | high | medium | diagnostic"
      }
    }
  ],
  "paragraphEffectiveness": 62,
  "paragraphVerdict": "string — one-sentence assessment of how well this paragraph fulfills its role",
  "comparativeNotes": "string | null — how this paragraph compares to the anchor. Null for the anchor itself.",
  "holisticAnalysisEvolution": {
    "strengthSignatures": [{ "quality": "string", "evidence": "string (MAX 10 WORDS)", "paragraphs": [0] }],
    "growthEdges": [{ "quality": "string", "description": "string", "paragraphs": [0] }],
    "aoTakeaway": "string — what an AO would think after reading this paragraph in context"
  }
}

SCHEMA BREVITY CAPS (Scope 1 Phase 2):
- strengths[].evidence: MAX 10 words — a specific text quote, not commentary
- weaknesses[].evidence: MAX 10 words — same
- strengthSignatures[].evidence: MAX 10 words — same
- effectivenessReasoning: UNCAPPED — this is your load-bearing reasoning chain and is consumed downstream by L4 and coaching. Write it fully.`;
}

// ============================================================================
// PHASE-AWARE COST OPTIMIZATION — Essay-Level vs Paragraph-Level Analysis
// ============================================================================

/**
 * Estimate whether the essay is in an 'early' or 'mature' phase BEFORE running L3.5.
 * Uses signals from L3 understanding + L3.75 holistic synthesis (both available pre-L3.5).
 *
 * 'early' = foundation/architecture phase → use cheap essay-level analysis (1 Sonnet call)
 * 'mature' = craft/polish/distinction phase → use full per-paragraph analysis (anchor + parallel)
 *
 * The estimate is deliberately CONSERVATIVE: defaults to 'early' and requires strong evidence
 * of maturity to unlock the expensive path. This is safe because:
 * - First analysis is almost always 'early' (no prior scores exist)
 * - Subsequent analyses after edits will have prior phase data to guide the decision
 * - If we incorrectly classify as 'early', the essay-level analysis still produces useful
 *   paragraph-level verdicts — the student just doesn't get sentence-level scores yet
 */
function estimatePhaseFromProfile(profile: Readonly<EssayProfile>): 'early' | 'mature' {
  const ns = profile.index.northStarSummary;

  // Signal 1: North Star maturity — a 'full' or 'emerging' north star with a substantive
  // through-line summary indicates the essay has clear structural coherence
  const hasStrongNorthStar = ns.maturity === 'full' ||
    (ns.maturity === 'emerging' && ns.throughLineSummary != null && ns.throughLineSummary.length > 50);

  // Signal 2: Paragraph understanding quality — check structural roles from L3 walk
  const paragraphsWithUnderstanding = profile.paragraphs.filter(
    p => p.understanding && !p.walkSkipped && p.sentences.length > 0,
  );
  if (paragraphsWithUnderstanding.length === 0) return 'early';

  // Signal 3: Check structural roles for indicators of weakness
  // Look for paragraphs whose understanding.role suggests structural problems
  const weakRoleIndicators = ['unclear', 'unfocused', 'missing', 'confused', 'disjointed', 'undeveloped'];
  const strongRoleIndicators = ['anchor', 'fulcrum', 'pivot', 'establishes', 'resolves', 'synthesizes', 'bridges'];

  let weakSignalCount = 0;
  let strongSignalCount = 0;

  for (const para of paragraphsWithUnderstanding) {
    const role = para.understanding!.role.toLowerCase();
    const func = para.understanding!.function.toLowerCase();
    const combined = `${role} ${func}`;

    if (weakRoleIndicators.some(w => combined.includes(w))) weakSignalCount++;
    if (strongRoleIndicators.some(s => combined.includes(s))) strongSignalCount++;
  }

  // Signal 4: Craft assessment quality from L3.75 holistic synthesis
  const hasCraftAssessment = profile.craftAssessment != null;
  const hasVoiceIdentity = profile.voiceIdentity != null;
  const hasNarrativeStrategy = profile.narrativeStrategy != null;

  // Signal 5: Emotional topography quality — real essays with developed emotional arcs
  const hasEmotionalPeaks = (profile.emotionalTopography?.peakMoments?.length ?? 0) > 0;

  // Decision: essay is mature ONLY if MULTIPLE signals align
  // - Strong north star AND no weak structural signals AND holistic sections are rich
  const holisticRichness = [hasCraftAssessment, hasVoiceIdentity, hasNarrativeStrategy, hasEmotionalPeaks]
    .filter(Boolean).length;

  if (
    hasStrongNorthStar &&
    weakSignalCount === 0 &&
    strongSignalCount > paragraphsWithUnderstanding.length * 0.4 &&
    holisticRichness >= 3
  ) {
    return 'mature';
  }

  return 'early';
}

/**
 * Compact system prompt for essay-level analysis (1 Sonnet call for the whole essay).
 *
 * Key differences from the per-paragraph buildSystemPrompt():
 * - NO sentence-scoring calibration table (no per-sentence scores at this phase)
 * - NO anchor paragraph mechanics
 * - NO isStrength/isProblem thresholds
 * - NO per-sentence confidence assessment
 * - FOCUSED on paragraph-level verdicts + essay-level strengths/weaknesses + coaching direction
 *
 * ~2K tokens vs ~4K tokens for the per-paragraph prompt.
 */
function buildEssayLevelSystemPrompt(): string {
  return `You are an expert admissions essay analyst. Your task is to evaluate the essay at the PARAGRAPH level — producing a per-paragraph verdict and an essay-level assessment of strengths, weaknesses, and coaching direction.

## YOUR ROLE

You receive COMPLETE understanding of the essay — holistic synthesis, voice map, earnedness network, thematic architecture, every paragraph's purpose and contribution. Your job is to evaluate EFFECTIVENESS: how well each paragraph achieves its purpose within the essay's architecture.

## PARAGRAPH VERDICT SCALE

For each paragraph, assign one of these verdicts:

| Verdict | Meaning | Effectiveness Score |
|---------|---------|-------------------|
| strong | This paragraph does its job with distinction. Clear purpose, effective execution, would hold up in a competitive applicant pool. | 80 |
| functional | This paragraph serves its purpose adequately but without distinction. Competent but interchangeable — another applicant could have written it. | 65 |
| developing | This paragraph has a clear purpose but doesn't achieve it effectively. Issues with specificity, voice, structure, or emotional grounding. | 50 |
| weak | This paragraph actively harms the essay or fails its structural role. Needs fundamental rework. | 35 |

## EVALUATION CRITERIA

For each paragraph, consider:
- **Structural role fulfillment**: Does it do what it needs to do in the essay's architecture?
- **Specificity vs vagueness**: Real details vs generic language any applicant could write
- **Voice authenticity**: Does the writer's voice come through, or is it performed?
- **Show vs tell**: Physical, sensory grounding vs abstract assertions
- **Admissions resonance**: Would an AO learn something memorable about this applicant?
- **Narrative contribution**: Does it advance the essay's through-line effectively?

## REFERENCING FINDINGS

Findings are labeled [F1], [F2], etc. Reference them by label as your PRIMARY basis for evaluation.

## OUTPUT FORMAT

Respond with a single JSON object:

{
  "essayTierClassification": "weak | mediocre | competent | strong | exceptional",
  "essayTierReasoning": "2-3 sentences explaining this tier classification with specific text references",
  "paragraphVerdicts": [
    {
      "paragraphIndex": 0,
      "verdict": "strong | functional | developing | weak",
      "reasoning": "2-3 sentences explaining why, citing specific text",
      "primaryStrength": "string | null — what this paragraph does best, with text evidence",
      "primaryWeakness": "string | null — what most needs improvement, with description of what better looks like"
    }
  ],
  "essayStrengths": [
    {
      "quality": "string — what works at the essay level",
      "evidence": "string — specific text cited, MAX 10 WORDS",
      "paragraphs": [0, 2]
    }
  ],
  "essayWeaknesses": [
    {
      "quality": "string — what needs improvement at the essay level",
      "description": "string — what improvement looks like",
      "paragraphs": [1, 3]
    }
  ],
  "coachingDirection": "string — 2-3 sentences: what should this writer focus on FIRST to improve this essay? Be specific and actionable."
}`;
}

/**
 * Build a compact essay-level user prompt that includes text + understanding for all paragraphs.
 * Similar to buildProfileContext but more compact — no per-sentence understanding detail.
 */
function buildEssayLevelUserPrompt(
  profile: Readonly<EssayProfile>,
  staleAreaHints?: string[],
  findingContext?: string,
): string {
  const sections: string[] = [];

  // Essay text with paragraph markers (no per-sentence markers for essay-level)
  sections.push('=== ESSAY TEXT ===');
  for (const para of profile.paragraphs) {
    sections.push(`\n[P${para.index}]`);
    for (const sentence of para.sentences) {
      sections.push(`  [P${para.index}S${sentence.index}] ${sentence.text}`);
    }
  }

  // Compact profile summary
  sections.push('\n=== ESSAY UNDERSTANDING ===');
  sections.push(`${profile.index.essayLength.paragraphs} paragraphs, ${profile.index.essayLength.sentences} sentences, ${profile.index.essayLength.words} words`);

  // Holistic synthesis (compact)
  if (profile.voiceIdentity) {
    sections.push(`\nVoice: ${profile.voiceIdentity.signature}`);
    if (profile.voiceIdentity.evolution) sections.push(`Voice evolution: ${profile.voiceIdentity.evolution}`);
  }
  if (profile.emotionalTopography) {
    sections.push(`Emotional arc: ${profile.emotionalTopography.arcTrajectory}`);
  }
  if (profile.thematicArchitecture) {
    sections.push(`Thesis: ${profile.thematicArchitecture.centralThesis} (confidence: ${profile.thematicArchitecture.thesisConfidence})`);
    sections.push(`Theme evolution: ${profile.thematicArchitecture.thesisEvolution}`);
  }
  if (profile.narrativeStrategy) {
    sections.push(`Strategy: ${profile.narrativeStrategy.primaryStrategy}`);
    sections.push(`Pacing: ${profile.narrativeStrategy.pacingAnalysis}`);
  }
  if (profile.characterRevelation) {
    sections.push(`Character: ${profile.characterRevelation.writerPortrait}`);
    sections.push(`Values: ${profile.characterRevelation.valuesRevealed.join(', ')}`);
  }
  if (profile.admissionsPositioning) {
    sections.push(`Admissions: ${profile.admissionsPositioning.tellabilitySummary}`);
  }
  if (profile.craftAssessment) {
    sections.push(`Craft: sentences=${profile.craftAssessment.sentencePatterns}, words=${profile.craftAssessment.wordPatterns}, images=${profile.craftAssessment.imageSystem}`);
  }

  // North star
  const ns = profile.index.northStarSummary;
  if (ns.throughLineSummary) {
    sections.push(`\nThrough-line: ${ns.throughLineSummary}`);
  }

  // Per-paragraph understanding (compact — role + function only)
  sections.push('\n=== PER-PARAGRAPH UNDERSTANDING ===');
  for (const para of profile.paragraphs) {
    if (para.understanding) {
      sections.push(`P${para.index}: Role="${para.understanding.role}" | Function="${para.understanding.function}" | Emotion="${para.understanding.emotionalRegister.dominantEmotion}" (${para.understanding.emotionalRegister.showVsTell})`);
    }
  }

  // Connections (compact)
  const activeConns = profile.connections?.all.filter(c => c.status === 'active') ?? [];
  if (activeConns.length > 0) {
    sections.push('\n=== KEY CONNECTIONS ===');
    for (const conn of activeConns.slice(0, 10)) { // Cap at 10 for token efficiency
      const from = `P${conn.from.paragraph}${conn.from.sentence !== undefined ? 'S' + conn.from.sentence : ''}`;
      const to = `P${conn.to.paragraph}${conn.to.sentence !== undefined ? 'S' + conn.to.sentence : ''}`;
      sections.push(`${from} → ${to}: ${conn.description} [${conn.strengthCategory}]`);
    }
  }

  // Stale area hints
  if (staleAreaHints && staleAreaHints.length > 0) {
    sections.push('\n=== STALE AREAS (re-evaluate carefully) ===');
    for (const hint of staleAreaHints) {
      sections.push(`• ${hint}`);
    }
  }

  // Finding context
  if (findingContext && findingContext.length > 0) {
    sections.push('\n=== FINDINGS ===');
    sections.push(findingContext);
  }

  sections.push('\n=== INSTRUCTIONS ===');
  sections.push(`Evaluate ALL ${profile.paragraphs.length} paragraphs (indices 0 through ${profile.paragraphs.length - 1}).`);
  sections.push('For each paragraph, assign a verdict and reasoning based on how well it fulfills its structural role.');
  sections.push('Then identify essay-level strengths, weaknesses, and coaching direction.');
  sections.push('Produce the JSON output matching the schema in the system prompt.');

  return sections.join('\n');
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

  // Voice map — COMPACT for scoring context (full voice map is in coaching, not needed for scoring)
  // Only include: register baseline + shift count + notable shifts (max 2)
  if (profile.voiceMap) {
    sections.push('\n--- Voice (compact) ---');
    if (profile.voiceMap.register?.baseline) {
      sections.push(`Register: ${profile.voiceMap.register.baseline}`);
    }
    const shiftCount = profile.voiceMap.shifts?.length ?? 0;
    if (shiftCount > 0) {
      sections.push(`Voice shifts: ${shiftCount} detected`);
      // Show only the 2 most significant shifts (highest confidence)
      const topShifts = [...(profile.voiceMap.shifts ?? [])]
        .sort((a, b) => (b.intentionality?.confidence ?? 0) - (a.intentionality?.confidence ?? 0))
        .slice(0, 2);
      for (const shift of topShifts) {
        const loc = shift.location ? `P${shift.location.paragraph}` : '?';
        sections.push(`  ${loc}: ${shift.fromDescription ?? '?'} → ${shift.toDescription ?? '?'} (${shift.intentionality?.assessment ?? '?'})`);
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

  // Moment earnedness — COMPACT for scoring (mechanism count + gaps only, not full contribution text)
  if (profile.momentEarnednessMap && profile.momentEarnednessMap.moments.length > 0) {
    sections.push('\n--- Earned-ness (compact) ---');
    sections.push(`Architecture: ${profile.momentEarnednessMap.structuralObservation}`);
    for (const moment of profile.momentEarnednessMap.moments) {
      const gapNote = moment.gaps.length > 0 ? ` | gaps: ${moment.gaps.length}` : '';
      sections.push(`  P${moment.location.paragraph}S${moment.location.sentence}: ${moment.description} [${moment.mechanisms.length} mechanisms${gapNote}]`);
    }
  }

  // Entanglements — only include count for scoring context (full detail is in coaching)
  const entanglementCount = profile.entanglements?.length ?? 0;
  if (entanglementCount > 0) {
    sections.push(`\nEntanglements: ${entanglementCount} cross-dimension moments detected`);
  }

  // Per-paragraph understanding — COMPACT digests for scoring context.
  // The scored paragraph gets its full detail via Block 3 (buildParagraphPrompt).
  // Other paragraphs only need their role + one-liner function for cross-paragraph calibration.
  sections.push('\n=== PARAGRAPH ROLES ===');
  for (const para of profile.paragraphs) {
    if (para.understanding) {
      sections.push(`P${para.index}: ${para.understanding.role} — ${para.understanding.function}`);
    }
  }

  // Connections — compact topology only (full descriptions are in coaching context, not scoring)
  const activeConns = profile.connections?.all.filter(c => c.status === 'active') ?? [];
  if (activeConns.length > 0) {
    sections.push(`\n=== CONNECTIONS (${activeConns.length} active) ===`);
    // Just show the topology — which paragraphs connect to which
    for (const conn of activeConns) {
      sections.push(`  P${conn.from.paragraph}→P${conn.to.paragraph} [${conn.routingTags.join(',')}] (${conn.strengthCategory})`);
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
 * Scope 2 Phase 5: Parse a raw improvementCandidate blob emitted by the
 * L3.5 analysis prompt into a typed ImprovementCandidate.
 *
 * Returns null when the field is absent, malformed, or missing required
 * string fields. A null return is normal — L3.5 emits candidates only on
 * sentences with actionable localized improvement opportunities.
 *
 * ID is built via `ImprovementCandidateStore.buildId` using paragraph +
 * sentence + observation, so re-runs produce stable IDs and dedupe
 * naturally against any L3 candidate that already exists for the same
 * observation.
 */
function parseImprovementCandidate(
  raw: unknown,
  paragraphIndex: number,
  sentenceIndex: number,
): ImprovementCandidate | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const observation = typeof r.observation === 'string' ? r.observation.trim() : '';
  const suggestedChange = typeof r.suggestedChange === 'string' ? r.suggestedChange.trim() : '';
  if (observation.length === 0 || suggestedChange.length === 0) return null;

  // technique: null OR exact/normalized match to the vocabulary enum
  const rawTechnique =
    typeof r.technique === 'string' ? r.technique : r.technique === null ? null : undefined;
  const technique = rawTechnique === undefined ? null : normalizeTechnique(rawTechnique);

  const demonstrationSketch =
    typeof r.demonstrationSketch === 'string' && r.demonstrationSketch.trim().length > 0
      ? r.demonstrationSketch.trim()
      : null;

  const rawCoachingValue = typeof r.coachingValue === 'string' ? r.coachingValue : 'medium';
  const coachingValue: ImprovementCandidate['coachingValue'] =
    rawCoachingValue === 'critical' || rawCoachingValue === 'high' ||
    rawCoachingValue === 'medium' || rawCoachingValue === 'diagnostic'
      ? rawCoachingValue
      : 'medium';

  const id = ImprovementCandidateStore.buildId('L3.5', paragraphIndex, sentenceIndex, observation);

  return {
    id,
    sourceLayer: 'L3.5',
    paragraph: paragraphIndex,
    sentence: sentenceIndex,
    sourceFindingId: null,
    observation,
    suggestedChange,
    technique,
    demonstrationSketch,
    coachingValue,
    lifecycleState: 'candidate',
    supersededBy: null,
    createdAt: new Date().toISOString(),
  };
}

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

      // Scope 2 Phase 5: parse inline improvement candidate (may be null)
      const improvementCandidate = parseImprovementCandidate(
        rawSA.improvementCandidate,
        paragraphIndex,
        i,
      );

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
        improvementCandidate,
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
        analysisMode: 'paragraph_level',
        failedParagraphs: [],
      };
    }

    // ── Phase-aware cost optimization: route between essay-level and paragraph-level ──
    // Essay-level = 1 Sonnet call (~$0.10-0.15) for foundation/architecture essays
    // Paragraph-level = anchor + parallel calls (~$0.50-0.92) for craft/polish/distinction
    const phaseEstimate = estimatePhaseFromProfile(profile);

    if (phaseEstimate === 'early') {
      console.log(
        `[AnalysisPass] Mode: essay_level (early phase), 1 Sonnet call for ${analyzableParagraphs.length} paragraphs`,
      );
      // Scope 2 Phase 5 fail-fast: essay-level analysis is a single Sonnet
      // call. Previously a catch here returned a "degraded result" with empty
      // paragraphAnalyses + a faked foundation-phase guess. That silently
      // produced a profile that looked successful to coaching but had no
      // scores and no candidates. Doctrine forbids this — rethrow as a
      // PipelineError so the orchestrator surfaces the failure and no downstream
      // layer sees an analysis result that wasn't actually produced.
      try {
        return await this.analyzeEssayLevel(profile, staleAreaHints, findingStore, essayType, startTime);
      } catch (error) {
        const inner = error instanceof Error ? error : new Error(String(error));
        console.error(
          `[AnalysisPass] Essay-level analysis failed: ${inner.message}. Fail-fast — rethrowing as PipelineError.`,
        );
        throw PipelineError.essayLevelAnalysisFailed(inner, analyzableParagraphs.length);
      }
    } else {
      console.log(
        `[AnalysisPass] Mode: paragraph_level (mature phase), anchor + parallel for ${analyzableParagraphs.length} paragraphs`,
      );
    }

    // Build cached context blocks (shared across all parallel calls)
    const systemPrompt = buildSystemPrompt();
    // Smart context: compact shared digest (replaces full profile dump)
    // + pre-computed paragraph relevance for per-call filtering
    const { analysisContextBuilder } = await import('./analysisContextBuilder');
    const relevanceIndex = analysisContextBuilder.buildRelevanceIndex(profile);
    const profileContext = analysisContextBuilder.buildSharedDigest(profile, 'l3_5');

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
        const anchorRelevance = relevanceIndex.get(anchorPara.index);
        const anchorRelevantContext = anchorRelevance
          ? analysisContextBuilder.buildParagraphContext(profile, anchorPara.index, anchorRelevance, 'l3_5')
          : '';
        const anchorResult = await this.analyzeSingleParagraph(
          anchorPara,
          profile.paragraphs.length,
          systemPrompt,
          profileContext,
          staleAreaHints,
          anchorFindingContext || undefined,
          { isAnchor: true, anchorReason: anchor.reason },
          anchorRelevantContext,
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

      const paraRelevance = relevanceIndex.get(para.index);
      const paraRelevantContext = paraRelevance
        ? analysisContextBuilder.buildParagraphContext(profile, para.index, paraRelevance, 'l3_5')
        : '';
      const task = this.analyzeSingleParagraph(
        para,
        profile.paragraphs.length,
        systemPrompt,
        profileContext,
        staleAreaHints,
        paraFindingContext || undefined,
        anchorContextStr ? { isAnchor: false, context: anchorContextStr } : undefined,
        paraRelevantContext,
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
      analysisMode: 'paragraph_level' as const,
      failedParagraphs,
      distributionDiagnostics: diagnostics,
    };
  }

  /**
   * Essay-level analysis — 1 Sonnet call for the whole essay.
   * Used for early-phase essays (foundation/architecture) where sentence-level scoring
   * is noise. Produces paragraph-level verdicts + essay-level strengths/weaknesses.
   *
   * Output is AnalysisPassOutput[]-compatible: each paragraph gets effectiveness + verdict +
   * holisticAnalysisEvolution, but sentenceAnalyses is an EMPTY array.
   */
  private async analyzeEssayLevel(
    profile: Readonly<EssayProfile>,
    staleAreaHints?: string[],
    findingStore?: FindingStore,
    essayType?: EssayType,
    startTime?: number,
  ): Promise<L35AnalysisResult> {
    const start = startTime ?? Date.now();

    // Build finding context for ALL paragraphs (combined)
    let combinedFindingContext: string | undefined;
    if (findingStore) {
      const allContexts: string[] = [];
      for (const para of profile.paragraphs) {
        const ctx = buildAnnotationFindingContext(findingStore, para.index);
        if (ctx && ctx.length > 0) allContexts.push(ctx);
      }
      if (allContexts.length > 0) {
        combinedFindingContext = allContexts.join('\n');
      }
    }

    const systemPrompt = buildEssayLevelSystemPrompt();
    const userPrompt = buildEssayLevelUserPrompt(profile, staleAreaHints, combinedFindingContext);

    const response = await callClaude<string>(
      {
        model: SONNET,
        systemPrompt,
        userPrompt,
        maxTokens: 2000,
        temperature: ANALYSIS_TEMPERATURE,
        // Essay-level call analyzes ALL paragraphs at once — needs more time than a single-paragraph call.
        // 180s (3 min) is generous for a single Sonnet call producing ~1500-2000 output tokens.
        timeoutMs: 180_000,
        // JSON mode for reliable structured output parsing
        useJsonMode: true,
        cacheSystemPrompt: true,
      },
    );

    const cost = calculateCost(response.usage, SONNET);
    console.log(
      `[EssayIntelligence] L3.5 essay-level: ${response.usage.input_tokens.toLocaleString()} input + ` +
      `${response.usage.output_tokens.toLocaleString()} output = $${cost.toFixed(4)}`,
    );

    // Parse the LLM response
    const parsed = parseLlmJsonOutput(response.content, 'L3.5 essay-level analysis');

    // Transform into AnalysisPassOutput[] (compatible with existing downstream)
    const results = this.transformEssayLevelOutput(parsed, profile);

    // Assess improvement phase (still runs — uses whatever analysis data is available)
    const priorPhase = profile.index?.improvementPhase ?? null;
    const phaseResult = await assessPhase({
      analyses: results,
      profile,
      essayType,
      priorPhase: priorPhase.level !== 'foundation' || priorPhase.reasoning !== 'Initial profile — no analysis has been performed yet'
        ? priorPhase
        : null,
    });

    const totalCost = cost + phaseResult.cost;
    const timingMs = Date.now() - start;

    console.log(
      `[AnalysisPass] Complete (essay-level): ${results.length} paragraph verdicts, ` +
      `phase=${phaseResult.phase.level}, cost=$${totalCost.toFixed(4)}, time=${timingMs}ms`,
    );

    return {
      paragraphAnalyses: results,
      improvementPhase: phaseResult.phase,
      cost: totalCost,
      tokenUsage: {
        inputTokens: response.usage.input_tokens + phaseResult.tokenUsage.inputTokens,
        outputTokens: response.usage.output_tokens + phaseResult.tokenUsage.outputTokens,
        cacheReadTokens: (response.usage.cache_read_input_tokens ?? 0) + phaseResult.tokenUsage.cacheReadTokens,
        cacheWriteTokens: (response.usage.cache_creation_input_tokens ?? 0) + phaseResult.tokenUsage.cacheWriteTokens,
      },
      timingMs,
      analysisMode: 'essay_level',
      failedParagraphs: [],
    };
  }

  /**
   * Transform essay-level LLM output into AnalysisPassOutput[] compatible with downstream systems.
   *
   * Maps verdict → effectiveness score:
   * - strong → 80, functional → 65, developing → 50, weak → 35
   *
   * sentenceAnalyses is EMPTY array for each paragraph (no per-sentence data at this phase).
   */
  private transformEssayLevelOutput(
    raw: Record<string, unknown>,
    profile: Readonly<EssayProfile>,
  ): AnalysisPassOutput[] {
    const verdictToScore: Record<string, number> = {
      strong: 80,
      functional: 65,
      developing: 50,
      weak: 35,
    };

    const results: AnalysisPassOutput[] = [];
    const rawVerdicts = Array.isArray(raw.paragraphVerdicts) ? raw.paragraphVerdicts : [];
    const rawStrengths = Array.isArray(raw.essayStrengths) ? raw.essayStrengths : [];
    const rawWeaknesses = Array.isArray(raw.essayWeaknesses) ? raw.essayWeaknesses : [];

    for (const para of profile.paragraphs) {
      // Find this paragraph's verdict
      const rawVerdict = rawVerdicts.find(
        (v: Record<string, unknown>) => Number(v.paragraphIndex) === para.index,
      ) as Record<string, unknown> | undefined;

      const verdictStr = String(rawVerdict?.verdict ?? 'developing').toLowerCase();
      const effectiveness = verdictToScore[verdictStr] ?? 50;
      const reasoning = String(rawVerdict?.reasoning ?? 'No reasoning provided');

      // Build strength signatures from essay-level strengths that reference this paragraph
      const strengthSignatures: Array<{ quality: string; evidence: string; paragraphs: number[] }> = [];
      for (const s of rawStrengths) {
        const obj = s as Record<string, unknown>;
        const paragraphs = Array.isArray(obj.paragraphs) ? obj.paragraphs.map(Number) : [];
        if (paragraphs.includes(para.index) || paragraphs.length === 0) {
          strengthSignatures.push({
            quality: String(obj.quality ?? ''),
            evidence: String(obj.evidence ?? ''),
            paragraphs: paragraphs.length > 0 ? paragraphs : [para.index],
          });
        }
      }

      // Add paragraph-specific strength if present
      if (rawVerdict?.primaryStrength && typeof rawVerdict.primaryStrength === 'string') {
        strengthSignatures.push({
          quality: rawVerdict.primaryStrength,
          evidence: reasoning,
          paragraphs: [para.index],
        });
      }

      // Build growth edges from essay-level weaknesses that reference this paragraph
      const growthEdges: Array<{ quality: string; description: string; paragraphs: number[] }> = [];
      for (const w of rawWeaknesses) {
        const obj = w as Record<string, unknown>;
        const paragraphs = Array.isArray(obj.paragraphs) ? obj.paragraphs.map(Number) : [];
        if (paragraphs.includes(para.index) || paragraphs.length === 0) {
          growthEdges.push({
            quality: String(obj.quality ?? ''),
            description: String(obj.description ?? ''),
            paragraphs: paragraphs.length > 0 ? paragraphs : [para.index],
          });
        }
      }

      // Add paragraph-specific weakness if present
      if (rawVerdict?.primaryWeakness && typeof rawVerdict.primaryWeakness === 'string') {
        growthEdges.push({
          quality: rawVerdict.primaryWeakness,
          description: reasoning,
          paragraphs: [para.index],
        });
      }

      results.push({
        paragraphIndex: para.index,
        sentenceAnalyses: [], // EMPTY — no per-sentence data at essay-level phase
        paragraphEffectiveness: effectiveness,
        paragraphVerdict: reasoning,
        holisticAnalysisEvolution: {
          strengthSignatures: strengthSignatures.length > 0 ? strengthSignatures : undefined,
          growthEdges: growthEdges.length > 0 ? growthEdges : undefined,
          aoTakeaway: typeof raw.coachingDirection === 'string' ? raw.coachingDirection : undefined,
        },
      });
    }

    return results;
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
    paragraphRelevantContext?: string,
  ): Promise<{
    analysis: AnalysisPassOutput;
    cost: number;
    usage: ClaudeResponse['usage'];
  }> {
    const paragraphPrompt = buildParagraphPrompt(para, paragraphCount, staleAreaHints, findingContext, anchorConfig);

    // 3-block prompt caching pattern:
    // Block 1: System prompt (static, cached forever via cacheSystemPrompt)
    // Block 2: Shared digest (essay text + holistic digest + paragraph roles — cached across parallel calls)
    // Block 3: Paragraph-relevant context + paragraph-specific prompt (NOT cached)
    //
    // Block 2 is the COMPACT shared digest (~1200 tokens) instead of the full profile dump (~4000 tokens).
    // Paragraph-relevant holistic data is in Block 3 alongside the paragraph prompt,
    // filtered by the AnalysisContextBuilder to only include dimensions relevant to THIS paragraph.
    const relevantSection = paragraphRelevantContext
      ? `${paragraphRelevantContext}\n\n`
      : '';
    const userPrompt = `${profileContext}\n\n---\n\n${relevantSection}${paragraphPrompt}`;

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
    // Smart context for reanalysis too
    const { analysisContextBuilder } = await import('./analysisContextBuilder');
    const relevanceIndex = analysisContextBuilder.buildRelevanceIndex(profile);
    const profileContext = analysisContextBuilder.buildSharedDigest(profile, 'l3_5');
    const paraRelevance = relevanceIndex.get(paragraphIndex);
    const paraRelevantContext = paraRelevance
      ? analysisContextBuilder.buildParagraphContext(profile, paragraphIndex, paraRelevance, 'l3_5')
      : '';

    // Use prior anchor context for calibration if available and this isn't the anchor itself
    let anchorConfig: { isAnchor: boolean; context?: string } | undefined;
    if (priorAnchorAnalysis && priorAnchorAnalysis.paragraphIndex !== paragraphIndex) {
      anchorConfig = { isAnchor: false, context: buildAnchorContext(priorAnchorAnalysis) };
    }

    return this.analyzeSingleParagraph(
      para, profile.paragraphs.length, systemPrompt, profileContext,
      undefined, undefined, anchorConfig, paraRelevantContext,
    );
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const analysisPassService = new AnalysisPassService();
