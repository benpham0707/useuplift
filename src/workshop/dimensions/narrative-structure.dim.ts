/**
 * Narrative Structure Dimension — Haiku+Sonnet 2-Stage Pipeline
 *
 * Stage 1 (Haiku): Reads the essay and produces structured paragraph-level observations.
 *   What is each paragraph doing? Where does it come alive? What's weak?
 *
 * Stage 2 (Sonnet): Deep evaluation of craft informed by Haiku's reading.
 *   Intentionality of detail, scene vs summary strategy, show vs tell as craft decision.
 *
 * Heuristic scoring is preserved as a fallback and for heuristic-only mode.
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import { parseStandardLLMResponse, fuseNarrativeScores } from './_shared';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult, LLMScoreResult, FinalDimensionScore } from '../shared/types';
import { analyzeSpecificityGradient, analyzeSceneVsSummary, analyzeShowVsTell } from '../scoring/narrativeAnalyzers';
import { classifyParagraphFunctions } from '../scoring/paragraphFunctionClassifier';
import type { ParagraphFunctionAnalysis } from '../scoring/narrativeAnalyzerTypes';
import {
  cacheStructureInsights,
  simpleHash,
  type NarrativeStructureLLMResponse,
} from '../scoring/narrativeLLMTypes';

const DIMENSION_ID = 'narrative_structure';

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

  // Specificity Gradient (0-35 points) — now function-relative
  const specificity = analyzeSpecificityGradient(text, paragraphFunctions);
  const specificityScore = Math.min(35, specificity.overallScore * 0.35);
  score += specificityScore;
  signals.specificityScore = specificity.overallScore;
  signals.weakestParagraph = specificity.weakestParagraph;
  if (specificity.overallScore < 30) {
    evidence.push('Essay is highly abstract — needs concrete details');
  } else if (specificity.overallScore >= 60) {
    evidence.push('Good specificity with concrete details');
  }

  // Scene vs Summary (0-35 points)
  const sceneAnalysis = analyzeSceneVsSummary(text);
  signals.sceneRatio = sceneAnalysis.sceneRatio;
  signals.isInRange = sceneAnalysis.isInRange;
  if (sceneAnalysis.isInRange) {
    score += 35;
    evidence.push(`Balanced scene/summary ratio (${Math.round(sceneAnalysis.sceneRatio * 100)}% scene)`);
  } else {
    const distance = sceneAnalysis.sceneRatio < 0.5
      ? 0.5 - sceneAnalysis.sceneRatio
      : sceneAnalysis.sceneRatio - 0.75;
    score += Math.max(10, 35 - distance * 100);
    if (sceneAnalysis.recommendation) {
      evidence.push(sceneAnalysis.recommendation);
    }
  }

  // Show vs Tell (0-30 points)
  const showTell = analyzeShowVsTell(text);
  const showScore = Math.min(30, showTell.overallShowRatio * 30);
  score += showScore;
  signals.overallShowRatio = showTell.overallShowRatio;
  signals.tellOpportunityCount = showTell.tellOpportunities.length;
  if (showTell.tellOpportunities.length >= 3) {
    evidence.push(`${showTell.tellOpportunities.length} tell-not-show opportunities found`);
  }
  if (showTell.showExemplars.length > 0) {
    evidence.push(`${showTell.showExemplars.length} strong showing sentence(s) found`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Confidence: lower when ambiguous paragraphs exist
  const signalStrength =
    (specificity.paragraphScores.length > 0 ? 1 : 0) +
    (sceneAnalysis.paragraphs.length > 0 ? 1 : 0) +
    (showTell.paragraphs.length > 0 ? 1 : 0);
  let confidence = Math.min(0.95, 0.7 + signalStrength * 0.08);
  // Ambiguous paragraphs reduce confidence -> more likely to trigger LLM
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

function buildEssayTypeContext(essayType?: string): string {
  switch (essayType) {
    case 'personal_statement':
      return `## ESSAY CONTEXT
Type: Personal Statement (650 words expected)
Expectation: Scenes with concrete detail are the primary vehicle. Summary should bridge, not replace. A clear narrative arc — opening tension, transformation, resolution — is the structural norm. Judge the essay against this standard.`;
    case 'uc_piq':
      return `## ESSAY CONTEXT
Type: UC Personal Insight Question (250-350 words)
Expectation: Short form. Dense reflection is appropriate. Scenes may be compressed or absent entirely — that is NOT a flaw. Judge structure by insight density and efficiency, not by scene/summary ratio. A PIQ that reflects deeply without a single scene can score very high.`;
    case 'activity_to_essay':
      return `## ESSAY CONTEXT
Type: Activity Description / Extracurricular Essay
Expectation: Focus on specificity of impact, not narrative arc. Concrete outcomes, measurable results, and role clarity matter more than storytelling craft. Summary is the expected mode — do NOT penalize lack of scenes.`;
    case 'why_us':
      return `## ESSAY CONTEXT
Type: "Why Us" / School-Specific Essay
Expectation: Argument-driven with personal connection. Structure should weave specific school details with personal fit. Scenes are optional — specificity of research and connection matters more.`;
    case 'challenge_adversity':
      return `## ESSAY CONTEXT
Type: Challenge / Adversity Essay
Expectation: Scenes are critical — the reader must feel the challenge, not just hear about it. But the structure should give equal weight to the response and growth. Over-dramatizing the challenge without earned resolution is a common failure.`;
    case 'community':
      return `## ESSAY CONTEXT
Type: Community Essay
Expectation: Must show specific involvement, not abstract belonging. Scenes of action within the community are stronger than descriptions of the community itself.`;
    case 'identity_background':
      return `## ESSAY CONTEXT
Type: Identity / Background Essay
Expectation: Scenes with sensory grounding anchor abstract identity claims. The structure should move between concrete moments and reflection. Over-abstracting identity without grounding is the main risk.`;
    default:
      return `## ESSAY CONTEXT
Type: College application essay.
Expectation: Evaluate structural choices relative to the essay's apparent purpose and length.`;
  }
}

function buildHeuristicFeedSection(features: ExtractedFeatures): string {
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

These are heuristic classifications based on structural signals (tense ratios, noun density, sentence patterns). Confirm, refine, or disagree based on your reading. "ambiguous" means the classifier couldn't determine the paragraph's role — your judgment is especially needed there.`;
}

function buildPreAnalysisPrompt(text: string, features: ExtractedFeatures): string {
  const essayContext = buildEssayTypeContext(features.essayType);
  const heuristicFeed = buildHeuristicFeedSection(features);

  return `Read this college application essay carefully. Provide a comprehensive structural reading analysis.

${essayContext}

## ESSAY

${formatEssayWithParagraphs(text)}
${heuristicFeed ? `\n${heuristicFeed}\n` : ''}
## YOUR TASK

Read this essay as a skilled, empathetic reader. Analyze FIVE structural dimensions:

### A. PARAGRAPH-LEVEL READING

For each paragraph:
1. **What is this paragraph doing?** Is it establishing a scene? Revealing character through action? Building tension? Reflecting on meaning? Bridging between moments?
2. **What is the strongest sentence or image?** Quote it. Why does it work?
3. **Any concerns?** Does anything feel generic, unearned, or like it's telling instead of showing? Quote the exact text.
4. **How concrete vs abstract is this paragraph?** Does it put the reader in a specific moment, or does it speak in generalities?

### B. TRANSITIONS BETWEEN PARAGRAPHS

For each consecutive pair (P0→P1, P1→P2, etc.):
1. **What type of transition is this?** Temporal (time shift), thematic (idea connection), spatial (place change), emotional (feeling shift), logical (argument step), associative (image/memory link), or none (abrupt jump).
2. **What mechanism connects them?** A repeated image? A time marker? An emotional thread? Or nothing — the writer just starts a new paragraph?
3. **Does the transition feel earned?** Does the reader follow naturally, or do they have to work to understand why the essay moved here?

### C. THEMATIC THROUGH-LINE

1. **What is this essay REALLY about?** Not the surface topic — the deeper theme. What idea or feeling connects everything?
2. **What images, metaphors, or motifs recur?** List each one and note every paragraph where it appears. Does the motif transform or stay static?
3. **Does the theme hold together?** Or does the essay fragment into disconnected moments?

### D. PACING ANALYSIS

For each paragraph:
1. **Does this paragraph move fast or slow?** Is it compressed summary or lingering scene?
2. **Is the pacing proportional to importance?** Does the essay's most meaningful moment get the most words? Or does it rush through what matters and linger on what doesn't?

### E. STRUCTURAL PATTERN

1. **What structural pattern does this essay use?** Chronological? Circular (opening image returns)? In medias res? Montage? Braided timelines? Thematic association? Something else?
2. **Is this pattern a deliberate choice or a default?** Does the structure CREATE meaning, or just organize information?

Return as JSON:
{
  "paragraphs": [
    {
      "index": 0,
      "role": "establishing scene with sensory grounding",
      "strongestSentence": { "text": "exact quote", "why": "why it works" },
      "concerns": [],
      "concreteOrAbstract": "highly concrete"
    }
  ],
  "transitions": [
    {
      "from": 0,
      "to": 1,
      "type": "emotional",
      "mechanism": "The mother's response deepens the established tension — dialogue continues the scene",
      "earned": true
    }
  ],
  "thematicElements": {
    "coreTheme": "one sentence: what this essay is really about at its deepest level",
    "recurringMotifs": [
      {
        "motif": "the kitchen",
        "paragraphs": [0, 6],
        "transformation": "Opens as failure, closes as celebration — same space holds both extremes"
      }
    ]
  },
  "pacingObservations": [
    {
      "paragraphIndex": 5,
      "pace": "compressed — rushes through six months in one paragraph",
      "proportional": false,
      "note": "These months contain the actual transformation but get the least space"
    }
  ],
  "structuralPattern": {
    "identified": "circular framing with chronological middle",
    "isDeliberate": true,
    "note": "Kitchen image bookends the essay — the structure itself embodies transformation"
  },
  "overallObservations": {
    "comesAlive": { "paragraphs": [0, 3], "why": "explanation" },
    "goesFlat": { "paragraphs": [5], "why": "explanation" },
    "tellNotShow": [
      { "text": "exact quote", "paragraphIndex": 6, "assessment": "intentional or missed opportunity" }
    ],
    "structuralArc": "one sentence describing the overall structural movement"
  }
}`;
}

// ============================================================================
// SONNET EVALUATION PROMPT
// ============================================================================

function buildLLMPrompt(text: string, features: ExtractedFeatures): string {
  const haikuReading = features._preAnalysis?.['narrative_structure'] ?? '';

  const haikuSection = haikuReading
    ? `## FIRST READER'S OBSERVATIONS

${haikuReading}`
    : `## NOTE: No pre-analysis available. Evaluate based on your own reading.`;

  return `A skilled colleague has already read this essay and provided their structural observations — including paragraph roles, transitions, thematic through-line, pacing, and structural pattern. Review their reading, then provide your deeper evaluation.

## ESSAY

${formatEssayWithParagraphs(text)}

${haikuSection}

## YOUR EVALUATION: NARRATIVE STRUCTURE

Using both your own reading and the first reader's observations, evaluate the CRAFT of this essay's structure across eight dimensions.

### What to evaluate:

1. **INTENTIONALITY OF DETAIL**: Does every concrete detail serve a narrative purpose? A specific detail only earns its place if it reveals something about the writer that no other detail could. Rate this on a continuum from "every detail earns its place" to "details feel random or decorative."

2. **SCENE & SUMMARY AS STRATEGY**: Are the essay's most important emotional moments rendered as SCENES? Is summary used efficiently to bridge — or does it replace scenes that should exist? Would an admissions officer re-read any passage because it was so vivid?

3. **SHOW VS. TELL AS CRAFT DECISION**: For any tell-not-show flags, evaluate: is the telling a deliberate craft choice (efficient summary, emotional understatement, pacing control) or a failure of imagination?

4. **TRANSITION CRAFT**: Evaluate how each paragraph connects to the next. Are transitions earned — does the reader follow naturally? Or are there abrupt jumps, mechanical connectors ("Furthermore..."), or missing links? The best transitions deepen theme or create momentum. The worst feel like the writer couldn't figure out how to get from A to B.

5. **THEMATIC COHERENCE & THROUGH-LINE**: Does this essay have a clear thematic center — an idea or feeling that connects everything? Do recurring images or motifs deepen with each appearance, or are they decorative? Does the theme HOLD together from opening to closing, or does the essay fragment into unrelated moments? An essay about "resilience" that doesn't track a specific image of resilience across paragraphs scores lower than one that does.

6. **PACING AS ARCHITECTURAL CHOICE**: Does the essay spend words proportional to importance? The most meaningful 30 seconds should get the most space. Rushing through a transformation while lingering on setup is a pacing failure. Compressed summary of a montage is fine — compressed summary of the turning point is not.

7. **STRUCTURAL ORIGINALITY**: What structural pattern does this essay use? Is it a deliberate choice that creates meaning (circular framing that embodies transformation, in medias res that creates mystery) or a default (chronological because the writer didn't consider alternatives, five-paragraph because it's familiar)? Originality alone doesn't score high — an original structure that confuses the reader scores lower than a conventional structure that serves the story perfectly.

8. **STRUCTURAL ARCHITECTURE**: Does the paragraph sequence create meaning beyond chronology? Does the opening set up the essay's central tension? Does the closing resolve, transform, or reframe it? Could you scramble the middle paragraphs without the reader noticing — or does the order matter?

### Rubric (score 0-100):

**85-100** — Every paragraph earns its place. Concrete details reveal WHO this writer is. Transitions between paragraphs create momentum or deepen theme. A clear thematic through-line holds everything together with motifs that transform across the essay. Pacing matches importance — the essay lingers where it matters. The structure itself creates meaning. A reader would remember specific images weeks later.

**70-84** — Most structural choices feel purposeful. Transitions mostly flow naturally with 1-2 that could be smoother. Theme is clear and mostly coherent. Pacing is generally proportional with 1-2 places where it rushes or lingers unnecessarily. Clear forward momentum. The essay would stand out in a stack of 20.

**50-69** — Scenes exist but so do paragraphs that summarize what should be shown. Some transitions are mechanical or unexplained. Theme is present but not tracked through recurring motifs — more stated than woven. Pacing is uneven. Structure follows logical order but doesn't add meaning on its own. Competent but not distinctive.

**30-49** — Heavy reliance on summary. Transitions are mostly temporal markers ("Then...", "After that..."). Theme is generic or fragmented. Pacing doesn't distinguish between important and unimportant moments. The structure is chronological by default, not by design.

**0-29** — Almost entirely telling. No thematic through-line. Transitions are absent or purely mechanical. Template structure: intro -> body -> conclusion. Nothing structural reveals craft or intention.

### CRITICAL — avoid these mistakes:
- DO NOT reward specificity without meaning. Details earn points only when they reveal character.
- DO NOT penalize all telling. Telling between vivid scenes can be powerful.
- DO NOT inflate scores for dialogue or sensory detail alone. They must serve the narrative.
- DO NOT reward structural originality that confuses the reader. Clarity beats cleverness.
- DO NOT penalize conventional structure that works. A chronological essay with earned transitions and strong thematic coherence can score very high.

### DISAGREEMENTS WITH FIRST READER

Note any points where you DISAGREE with the first reader's observations. Include only substantive disagreements.

### Response format:

{
  "score": <0-100>,
  "confidence": <0.0-1.0>,
  "paragraphInsights": [
    {
      "index": 0,
      "verdict": "One sentence: what this paragraph achieves or fails at structurally",
      "strengthOrOpportunity": "strength" | "opportunity"
    }
  ],
  "transitionAnalysis": [
    {
      "from": 0,
      "to": 1,
      "quality": "seamless" | "effective" | "adequate" | "abrupt" | "missing",
      "how": "What mechanism connects these paragraphs",
      "verdict": "Does this transition serve the essay?"
    }
  ],
  "thematicThroughLine": {
    "coreTheme": "One sentence: what this essay is really about at its deepest level",
    "recurringMotifs": [
      {
        "motif": "the kitchen",
        "instances": [
          { "paragraphIndex": 0, "manifestation": "failure — burnt garlic and shame" },
          { "paragraphIndex": 6, "manifestation": "celebration — cooking together" }
        ]
      }
    ],
    "thematicCoherence": "One sentence: does the theme hold together or fragment?"
  },
  "pacingInsights": {
    "overall": "One sentence on the essay's pacing strategy",
    "keyMoments": [
      {
        "paragraphIndex": 5,
        "pacingChoice": "Compresses six months into one paragraph",
        "effectiveness": "serves the essay" | "needs adjustment"
      }
    ]
  },
  "structuralOriginality": {
    "pattern": "Identified structural pattern (e.g. circular framing, chronological, in medias res)",
    "freshness": "original" | "intentional_convention" | "predictable" | "template",
    "verdict": "Does the structure serve the story?"
  },
  "strongestMoment": {
    "paragraphIndex": <N>,
    "quote": "exact text from the essay",
    "why": "Why this works — what craft principle makes it effective"
  },
  "biggestOpportunity": {
    "paragraphIndex": <N>,
    "quote": "exact text",
    "why": "What's wrong and what principle would fix it",
    "teachingQuestion": "A question to ask the writer that would lead them to improve this"
  },
  "whatEssayConveys": "In one sentence: what does a reader understand about this writer from the essay's STRUCTURE (not its content)?",
  "reasoning": "2-3 sentences: overall structural assessment",
  "evidence": ["quote1 — why it matters", "quote2 — why it matters", "quote3 — why it matters"],
  "disagreements": [
    {
      "topic": "e.g. P3 role",
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

interface StructureDisagreement {
  topic: string;
  firstReaderSaid: string;
  yourAssessment: string;
  significance: 'minor' | 'notable' | 'major';
}

function parseNarrativeStructureResponse(raw: string, essayHash?: string): LLMScoreResult {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const parsed: NarrativeStructureLLMResponse & { disagreements?: StructureDisagreement[] } = JSON.parse(jsonMatch[0]);

    // Cache rich response keyed by essay text hash (not response hash).
    // This lets the annotation pipeline look up insights using the same hash.
    if (parsed.paragraphInsights && parsed.strongestMoment) {
      const cacheKey = essayHash ?? simpleHash(raw); // fallback for standalone usage
      cacheStructureInsights(cacheKey, parsed);
    }

    const reasoningParts = [
      parsed.reasoning,
      `Strongest: P${parsed.strongestMoment.paragraphIndex} — ${parsed.strongestMoment.why}`,
      `Opportunity: P${parsed.biggestOpportunity.paragraphIndex} — ${parsed.biggestOpportunity.why}`,
      `Conveys: ${parsed.whatEssayConveys}`,
    ];

    // Include thematic through-line in reasoning when present
    if (parsed.thematicThroughLine?.coreTheme) {
      reasoningParts.push(`Theme: ${parsed.thematicThroughLine.coreTheme}`);
      if (parsed.thematicThroughLine.thematicCoherence) {
        reasoningParts.push(`Coherence: ${parsed.thematicThroughLine.thematicCoherence}`);
      }
    }

    // Include structural originality in reasoning when present
    if (parsed.structuralOriginality?.pattern) {
      reasoningParts.push(
        `Structure: ${parsed.structuralOriginality.pattern} (${parsed.structuralOriginality.freshness}) — ${parsed.structuralOriginality.verdict}`
      );
    }

    // Include transition quality summary when present
    if (Array.isArray(parsed.transitionAnalysis) && parsed.transitionAnalysis.length > 0) {
      const weak = parsed.transitionAnalysis.filter(t => t.quality === 'abrupt' || t.quality === 'missing');
      if (weak.length > 0) {
        reasoningParts.push(
          `Weak transitions: ${weak.map(t => `P${t.from}→P${t.to} (${t.quality})`).join(', ')}`
        );
      }
    }

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

const STRUCTURE_SYSTEM_PROMPT = `You are a master-level writing evaluator — a veteran admissions reader at a top-5 university who has read 10,000+ essays AND teaches graduate-level creative writing. You understand that a 650-word college essay is not a short story; it is a personal revelation where every structural choice either reveals or conceals who the writer truly is.

You evaluate narrative STRUCTURE across eight dimensions: intentionality of detail, scene vs summary strategy, show vs tell as craft decision, transition craft between paragraphs, thematic coherence and through-line, pacing as architectural choice, structural originality, and paragraph architecture. You understand that structure IS meaning — how an essay is built reveals as much about the writer as what it says.`;

const STRUCTURE_PRE_ANALYSIS_SYSTEM_PROMPT = `You are a skilled, empathetic reader of college application essays. Your job is to provide a comprehensive structural reading — not just what each paragraph says, but how the essay is BUILT.

You analyze five structural dimensions: (1) what each paragraph DOES in the essay, (2) how paragraphs connect through transitions, (3) what thematic through-line holds the essay together, (4) how pacing distributes attention across moments, and (5) what structural pattern the essay uses and whether it's deliberate.

You are precise. You quote exact text. You distinguish between intentional craft choices and defaults. Your observations will be reviewed by a senior evaluator, so be thorough and honest.`;

// ============================================================================
// MANIFEST
// ============================================================================

const manifest: DimensionManifest = {
  id: DIMENSION_ID,
  displayName: 'Narrative Structure',
  weight: 0.04,
  scoringTier: 'haiku+sonnet',
  heuristicScore,
  shouldTriggerLLM: () => true, // Always run LLM for haiku+sonnet
  buildPreAnalysisPrompt,
  buildLLMPrompt,
  parseLLMResponse: parseNarrativeStructureResponse,
  fuseScores: (heuristic: HeuristicResult, llm?: LLMScoreResult): FinalDimensionScore =>
    fuseNarrativeScores(DIMENSION_ID, heuristic, llm),
  systemPrompt: STRUCTURE_SYSTEM_PROMPT,
  preAnalysisSystemPrompt: STRUCTURE_PRE_ANALYSIS_SYSTEM_PROMPT,
};

dimensionRegistry.register(manifest);
