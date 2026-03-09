/**
 * Narrative Dynamics Dimension — Haiku+Sonnet 2-Stage Pipeline
 *
 * Stage 1 (Haiku): Reads the essay focusing on emotional movement.
 *   What does the reader FEEL at each stage? Where does authenticity shine or falter?
 *
 * Stage 2 (Sonnet): Deep evaluation of emotional arc, tension, and what the essay conveys.
 *   Emotional authenticity, transformation specificity, reader takeaway.
 *
 * Heuristic scoring is preserved as a fallback and for heuristic-only mode.
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import { parseStandardLLMResponse, fuseNarrativeScores } from './_shared';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult, LLMScoreResult, FinalDimensionScore } from '../shared/types';
import { analyzeNarrativeArc, analyzeEmotionalJourney, analyzeTensionCurve, analyzeInformationDensity } from '../scoring/narrativeAnalyzers';
import { classifyParagraphFunctions } from '../scoring/paragraphFunctionClassifier';
import type { ParagraphFunctionAnalysis } from '../scoring/narrativeAnalyzerTypes';
import {
  cacheDynamicsInsights,
  simpleHash,
  type NarrativeDynamicsLLMResponse,
} from '../scoring/narrativeLLMTypes';

const DIMENSION_ID = 'narrative_dynamics';

// ============================================================================
// HEURISTIC SCORER (unchanged — fallback + heuristic-only mode)
// ============================================================================

function heuristicScore(features: ExtractedFeatures): HeuristicResult {
  const text = features.rawText;
  let score = 0;
  const evidence: string[] = [];
  const signals: Record<string, number | boolean | string> = {};

  // Use precomputed paragraph functions from pipeline (avoids redundant computation).
  // Falls back to running classifier if features weren't prepared by pipeline.
  const paragraphFunctions = features.paragraphFunctionAnalysis ?? classifyParagraphFunctions(text);
  const ambiguousParagraphs = paragraphFunctions.filter(p => p.detectedFunction === 'ambiguous').length;
  signals.ambiguousParagraphs = ambiguousParagraphs;

  // Narrative Arc (0-25 points)
  const arc = analyzeNarrativeArc(text);
  signals.detectedArc = arc.detectedArc;
  signals.arcConfidence = arc.confidence;
  if (arc.detectedArc !== 'ambiguous') {
    score += Math.min(25, arc.confidence * 25);
    evidence.push(`Detected ${arc.detectedArc.replace(/_/g, ' ')} arc (${Math.round(arc.confidence * 100)}% confidence)`);
  } else {
    score += 5;
    evidence.push('No clear narrative arc detected');
  }
  if (arc.structuralNotes.hasConflict) {
    score += 5;
    signals.hasConflict = true;
  }

  // Emotional Journey (0-25 points)
  const journey = analyzeEmotionalJourney(text);
  const journeyScore = Math.min(25, journey.trajectory.varietyScore * 25);
  score += journeyScore;
  signals.emotionalVarietyScore = journey.trajectory.varietyScore;
  signals.trajectoryPattern = journey.trajectory.pattern;
  signals.isEngaging = journey.evaluation.isEngaging;
  signals.isAuthentic = journey.evaluation.isAuthentic;
  if (journey.evaluation.isEngaging) {
    evidence.push('Engaging emotional trajectory with variety');
  }
  if (journey.evaluation.isAuthentic) {
    evidence.push('Authentic vulnerability detected');
    score += 5;
  }

  // Tension Curve (0-25 points)
  const tension = analyzeTensionCurve(text);
  signals.overallEngagement = tension.evaluation.overallEngagement;
  signals.hasStrongHook = tension.evaluation.hasStrongHook;
  signals.hasClimacticPeak = tension.evaluation.hasClimacticPeak;

  const engagementPoints: Record<string, number> = { high: 25, good: 20, moderate: 12, low: 5 };
  score += engagementPoints[tension.evaluation.overallEngagement] || 5;

  if (tension.evaluation.hasStrongHook) evidence.push('Strong opening hook');
  if (tension.evaluation.flatSpotCount > 0) {
    evidence.push(`${tension.evaluation.flatSpotCount} flat spot(s) in tension curve`);
  }

  // Information Density (0-15 points)
  const density = analyzeInformationDensity(text);
  const densityScore = Math.min(15, density.overallDensityScore * 0.15);
  score += densityScore;
  signals.overallDensityScore = density.overallDensityScore;
  signals.redundancyFlagCount = density.redundancyFlags.length;
  if (density.redundancyFlags.length >= 3) {
    evidence.push('Multiple paragraphs repeat earlier content');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Confidence: lower when ambiguous paragraphs or weak arc
  const signalStrength =
    (arc.detectedArc !== 'ambiguous' ? 1 : 0) +
    (journey.evaluation.isEngaging ? 1 : 0) +
    (tension.evaluation.hasStrongHook ? 1 : 0);
  let confidence = Math.min(0.95, 0.7 + signalStrength * 0.08);
  confidence -= ambiguousParagraphs * 0.05;
  confidence = Math.max(0.3, confidence);

  return { score, confidence, evidence, signals };
}

// ============================================================================
// HAIKU PRE-ANALYSIS PROMPT
// ============================================================================

function formatEssayWithParagraphs(text: string): string {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  return paragraphs.map((p, i) => `[Paragraph ${i}]\n${p.trim()}`).join('\n\n');
}

function buildDynamicsEssayTypeContext(essayType?: string): string {
  switch (essayType) {
    case 'personal_statement':
      return `## ESSAY CONTEXT
Type: Personal Statement (650 words expected)
Expectation: Emotional transformation is central. Look for a genuine arc — not just chronological progression but a real shift in how the writer sees themselves. Vulnerability should feel earned through specific moments.`;
    case 'uc_piq':
      return `## ESSAY CONTEXT
Type: UC Personal Insight Question (250-350 words)
Expectation: Short form. Emotional movement may be compressed into a single shift rather than a full arc. Dense reflection can carry emotional weight even without vivid scenes. Do NOT penalize compressed emotional range — judge whether the insight feels genuinely felt.`;
    case 'activity_to_essay':
      return `## ESSAY CONTEXT
Type: Activity Description / Extracurricular Essay
Expectation: Emotional dynamics are secondary to impact clarity. Passion and authenticity matter, but the essay is not expected to create an emotional journey. Judge whether the writer's investment feels genuine, not whether the reader is moved.`;
    case 'challenge_adversity':
      return `## ESSAY CONTEXT
Type: Challenge / Adversity Essay
Expectation: Emotional authenticity is paramount. The reader must FEEL the challenge, not just understand it. Watch for performative suffering vs. genuine vulnerability. The transformation must be specific — "I grew stronger" is not enough.`;
    case 'community':
      return `## ESSAY CONTEXT
Type: Community Essay
Expectation: Emotional movement comes from connection — the writer's relationship to a group or place. Look for specificity of belonging rather than dramatic emotional arcs.`;
    case 'identity_background':
      return `## ESSAY CONTEXT
Type: Identity / Background Essay
Expectation: Emotional authenticity is central. Identity essays that perform identity rather than revealing it should score lower. Look for moments where the writer's relationship to their identity is complicated, not just celebrated.`;
    default:
      return `## ESSAY CONTEXT
Type: College application essay.
Expectation: Evaluate emotional dynamics relative to the essay's apparent purpose and length.`;
  }
}

function buildDynamicsHeuristicFeedSection(features: ExtractedFeatures): string {
  // Use precomputed full analysis from pipeline (has confidence + uncertainties).
  // Falls back to running classifier if not available.
  const classifications: ParagraphFunctionAnalysis[] =
    features.paragraphFunctionAnalysis ?? classifyParagraphFunctions(features.rawText);

  if (classifications.length === 0) return '';

  const lines = classifications.map(c =>
    `P${c.index}: ${c.detectedFunction} (confidence: ${c.confidence.toFixed(2)})${c.uncertainties.length > 0 ? ` [also possibly: ${c.uncertainties.join('; ')}]` : ''}`
  );

  return `## PRELIMINARY ANALYSIS (deterministic classifier)
${lines.join('\n')}

These are heuristic classifications based on structural signals. For emotional dynamics, pay special attention to: escalation (tension-building), intimacy (vulnerability), contrast (emotional shifts), and release (resolution). Confirm, refine, or disagree based on your reading.`;
}

function buildPreAnalysisPrompt(text: string, features: ExtractedFeatures): string {
  const essayContext = buildDynamicsEssayTypeContext(features.essayType);
  const heuristicFeed = buildDynamicsHeuristicFeedSection(features);

  return `Read this college application essay carefully. Analyze its emotional movement and reader experience.

${essayContext}

## ESSAY

${formatEssayWithParagraphs(text)}
${heuristicFeed ? `\n${heuristicFeed}\n` : ''}
## YOUR TASK

Read this essay focusing on how it MOVES emotionally — not what happens, but what the reader FEELS at each stage.

For each paragraph:
1. **What emotion does this paragraph create in the reader?** Not what emotion the writer claims to feel — what does the READER feel while reading this?
2. **Does this paragraph move the emotional needle?** Does it shift the reader's feeling from the previous paragraph, or does it stay in the same emotional territory?
3. **Tension level**: On a scale of 1-10, how much does the reader want to keep reading after this paragraph? What creates or deflates that pull?
4. **Authenticity check**: Does this paragraph feel LIVED or PERFORMED? Is the writer sharing genuine experience or crafting an impression?

Then overall:
5. **Emotional arc**: What is the emotional journey from opening to closing? Describe it in one sentence.
6. **Turning point**: Is there a specific moment where the essay shifts — where you realize what it's really about?
7. **What does this essay CONVEY about the writer?** Not the surface story. What does the reader understand about who this person IS after reading?
8. **Does the essay linger?** After reading, does a specific image or moment stay with you? Or does it evaporate?
9. **Pacing**: Does the essay spend time proportional to importance? Where should it slow down? Speed up?

Return as JSON:
{
  "paragraphs": [
    {
      "index": 0,
      "readerEmotion": "what the reader feels",
      "emotionalShift": "how it changes from previous",
      "tensionLevel": 7,
      "tensionReason": "what creates or deflates the pull",
      "authenticityAssessment": "lived or performed — with evidence"
    }
  ],
  "overallObservations": {
    "emotionalArc": "one sentence describing the emotional journey",
    "turningPoint": { "paragraphIndex": 4, "what": "what shifts and why" },
    "whatItConveys": "what the reader understands about this person",
    "lingeringMoment": "what stays with the reader",
    "pacingNotes": "where to slow down or speed up"
  }
}`;
}

// ============================================================================
// SONNET EVALUATION PROMPT
// ============================================================================

function buildLLMPrompt(text: string, features: ExtractedFeatures): string {
  const haikuReading = features._preAnalysis?.['narrative_dynamics'] ?? '';

  const haikuSection = haikuReading
    ? `## FIRST READER'S EMOTIONAL ANALYSIS

${haikuReading}`
    : `## NOTE: No pre-analysis available. Evaluate based on your own reading.`;

  return `A skilled colleague has already read this essay and noted its emotional movement. Review their reading, then provide your deeper evaluation.

## ESSAY

${formatEssayWithParagraphs(text)}

${haikuSection}

## YOUR EVALUATION: NARRATIVE DYNAMICS

Using both your own reading and the first reader's analysis, evaluate how this essay MOVES.

### What to evaluate:

1. **EMOTIONAL AUTHENTICITY**: For each moment flagged as emotional — is it LIVED or PERFORMED? Earned vulnerability feels specific ("my mother's back was rigid" — you can't fake that detail). Performed vulnerability feels generic ("I was devastated by the news"). The key test: could someone who didn't live this experience have written this sentence?

2. **ARC AS TRANSFORMATION**: Does this essay trace a genuine change in how the writer sees themselves or the world? Is the transformation SPECIFIC to this person (only they could have had this realization) or GENERIC ("I learned the value of hard work")? Does the ending EARN its insight, or does the insight arrive by fiat — stated without having been demonstrated?

3. **TENSION AS READER EXPERIENCE**: At each paragraph, what is the reader WAITING FOR? Is there a specific question pulling them forward — or are they reading out of politeness? Where tension drops: is the essay actually losing the reader there, or is it creating purposeful breathing room?

4. **PACING AS MEANING**: The essay's most important 30 seconds should get the most words. Is that true here? Where does the essay rush through what matters and linger on what doesn't?

5. **WHAT THE READER TAKES AWAY**: After reading this essay, what ONE thing does the admissions officer know about this person that they could never learn from a transcript, resume, or recommendation? Would they bring up this essay at the committee meeting? Would they remember it a week later?

### Rubric (score 0-100):

**85-100** — The reader undergoes a parallel emotional journey. Vulnerability is earned through specific moments. The arc traces a transformation that could only happen to THIS writer. Tension builds toward genuine revelation — a moment where the reader sees the writer differently. The essay lingers. An admissions officer would talk about this essay.

**70-84** — Clear emotional movement with authentic moments. 1-2 places where emotion feels slightly performed or pacing is off. The arc is clear and specific — the reader understands a real change happened. Would be remembered in a committee discussion.

**50-69** — The essay moves chronologically but the reader doesn't feel pulled forward. Emotions are present but some feel labeled rather than evoked. The arc follows a recognizable pattern (challenge -> growth) without making it specific enough to be memorable. The reader understands what happened but doesn't feel it.

**30-49** — The essay tells the reader what to feel. "I was devastated" without any detail that would devastate the reader. The arc is generic. The reader could summarize it but couldn't quote a single sentence.

**0-29** — A list of events with stated emotions. No forward pull. No transformation. The reader learns facts but nothing about who this person IS.

### CRITICAL — avoid these mistakes:
- DO NOT confuse dramatic events with dynamic writing. Tragedy told flatly scores low; breakfast shown vividly scores high.
- DO NOT reward emotional vocabulary. More emotion words does not equal more emotional power.
- DO NOT penalize negative emotions. Fear, shame, confusion often produce the most dynamic writing.
- DO NOT reward neat resolution. "I learned to appreciate what I have" after hardship should score LOWER than sitting with ambiguity. AOs see through moral tidy-ups.
- DO NOT inflate for initial hooks. A dramatic opening means nothing if the essay can't sustain engagement.

### DISAGREEMENTS WITH FIRST READER

After scoring, note any points where you DISAGREE with the first reader's emotional analysis. Disagreement is valuable — it highlights genuine ambiguity in the writing or calibration differences in reading emotional cues. Include only substantive disagreements, not minor wording differences.

### Response format:

{
  "score": <0-100>,
  "confidence": <0.0-1.0>,
  "paragraphInsights": [
    {
      "index": 0,
      "verdict": "One sentence: how this paragraph contributes to (or detracts from) the essay's emotional movement",
      "emotionalAuthenticity": "high" | "moderate" | "low",
      "tensionContribution": "one phrase: what it does to reader engagement"
    }
  ],
  "emotionalArc": {
    "summary": "One sentence describing the emotional journey",
    "turningPoint": {
      "paragraphIndex": <N>,
      "what": "What shifts and why it matters"
    },
    "isTransformationEarned": true | false,
    "transformationSpecificity": "One sentence: is this transformation unique to this writer or could anyone claim it?"
  },
  "strongestMoment": {
    "paragraphIndex": <N>,
    "quote": "exact text",
    "why": "Why this moment works — what the reader feels"
  },
  "biggestOpportunity": {
    "paragraphIndex": <N>,
    "quote": "exact text",
    "why": "What's missing and what would make it land",
    "teachingQuestion": "A question to lead the writer to improve (not a rewrite)"
  },
  "whatEssayConveysAboutWriter": "In one sentence: what does the reader KNOW about this person after reading?",
  "readerTakeaway": "In one sentence: what FEELING does the reader carry away?",
  "reasoning": "2-3 sentences: overall dynamics assessment",
  "evidence": ["quote1 — emotional impact", "quote2 — emotional impact", "quote3 — emotional impact"],
  "disagreements": [
    {
      "topic": "e.g. P2 emotional authenticity",
      "firstReaderSaid": "what the first reader observed",
      "yourAssessment": "your differing reading",
      "significance": "minor" | "notable" | "major"
    }
  ]
}`;
}

// ============================================================================
// RESPONSE PARSER
// ============================================================================

interface DynamicsDisagreement {
  topic: string;
  firstReaderSaid: string;
  yourAssessment: string;
  significance: 'minor' | 'notable' | 'major';
}

function parseNarrativeDynamicsResponse(raw: string, essayHash?: string): LLMScoreResult {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const parsed: NarrativeDynamicsLLMResponse & { disagreements?: DynamicsDisagreement[] } = JSON.parse(jsonMatch[0]);

    // Cache rich response keyed by essay text hash (not response hash).
    // This lets the annotation pipeline look up insights using the same hash.
    if (parsed.paragraphInsights && parsed.emotionalArc) {
      const cacheKey = essayHash ?? simpleHash(raw); // fallback for standalone usage
      cacheDynamicsInsights(cacheKey, parsed);
    }

    const reasoningParts = [
      parsed.reasoning,
      `Arc: ${parsed.emotionalArc.summary}`,
      `Turning point: P${parsed.emotionalArc.turningPoint.paragraphIndex} — ${parsed.emotionalArc.turningPoint.what}`,
      `Strongest: P${parsed.strongestMoment.paragraphIndex} — ${parsed.strongestMoment.why}`,
      `Opportunity: P${parsed.biggestOpportunity.paragraphIndex} — ${parsed.biggestOpportunity.why}`,
      `Conveys: ${parsed.whatEssayConveysAboutWriter}`,
      `Takeaway: ${parsed.readerTakeaway}`,
    ];

    // Include disagreements in reasoning when present
    if (Array.isArray(parsed.disagreements) && parsed.disagreements.length > 0) {
      const notable = parsed.disagreements.filter(d => d.significance !== 'minor');
      if (notable.length > 0) {
        reasoningParts.push(
          `Disagreements with first reader: ${notable.map(d => `[${d.significance}] ${d.topic}: first reader said "${d.firstReaderSaid}", evaluator assessed "${d.yourAssessment}"`).join('; ')}`
        );
      }
    }

    const reasoning = reasoningParts.join('\n');

    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.7)),
      reasoning,
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence.map(String) : [],
      tokenUsage: { inputTokens: 0, outputTokens: 0 },
      richResponse: parsed as unknown as Record<string, unknown>,
    };
  } catch {
    return parseStandardLLMResponse(raw);
  }
}

// ============================================================================
// SYSTEM PROMPTS (cacheable across calls)
// ============================================================================

const DYNAMICS_SYSTEM_PROMPT = `You are a master evaluator of narrative dynamics — how writing MOVES a reader. You are a veteran admissions reader at a top-5 university who has learned that the most powerful essays don't describe dramatic events — they create emotional transformation through accumulation of precisely felt moments. You know that a quiet essay about making breakfast can be more dynamic than a loud essay about tragedy.

You evaluate: emotional authenticity (lived vs performed), arc as transformation (specific vs generic), tension as reader experience (forward pull), pacing as meaning (time proportional to importance), and what the reader ultimately takes away about who this person IS.`;

const DYNAMICS_PRE_ANALYSIS_SYSTEM_PROMPT = `You are an emotionally perceptive reader of college application essays. Your job is to track the EMOTIONAL MOVEMENT of an essay — not what happens, but what the reader FEELS at each stage. You distinguish between what the writer claims to feel and what the reader actually experiences.

You are honest about authenticity. You identify moments that feel lived (specific, un-fakeable detail) versus performed (generic emotional vocabulary). Your observations will be reviewed by a senior evaluator, so be precise about tensions levels, emotional shifts, and pacing.`;

// ============================================================================
// MANIFEST
// ============================================================================

const manifest: DimensionManifest = {
  id: DIMENSION_ID,
  displayName: 'Narrative Dynamics',
  weight: 0.04,
  scoringTier: 'haiku+sonnet',
  heuristicScore,
  shouldTriggerLLM: () => true, // Always run LLM for haiku+sonnet
  buildPreAnalysisPrompt,
  buildLLMPrompt,
  parseLLMResponse: parseNarrativeDynamicsResponse,
  fuseScores: (heuristic: HeuristicResult, llm?: LLMScoreResult): FinalDimensionScore =>
    fuseNarrativeScores(DIMENSION_ID, heuristic, llm),
  systemPrompt: DYNAMICS_SYSTEM_PROMPT,
  preAnalysisSystemPrompt: DYNAMICS_PRE_ANALYSIS_SYSTEM_PROMPT,
};

dimensionRegistry.register(manifest);
