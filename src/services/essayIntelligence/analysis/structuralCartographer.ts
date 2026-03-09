/**
 * Layer 2: Structural Cartographer
 *
 * Single Haiku call that maps the essay's structural architecture.
 * Takes full essay text + Layer 1 deterministic data and produces
 * a StructuralCartography — paragraph roles, transitions, thematic
 * through-line, arc verification, and pacing assessment.
 *
 * Falls back to heuristic construction from Layer 1 data if Haiku fails.
 */

import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import type {
  StructuralCartography,
  EssayUnderstanding,
  TransitionQuality,
} from '../types';
import type { NarrativeArcType, ParagraphFunction } from '../../../workshop/scoring/narrativeAnalyzerTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const TEMPERATURE = 0.2;
const MAX_TOKENS = 2000;

// ============================================================================
// SYSTEM PROMPT (static, cacheable)
// ============================================================================

const SYSTEM_PROMPT = `You are an expert structural analyst for college application essays. You specialize in narrative architecture — understanding how each paragraph contributes to the whole, how transitions connect ideas, and how thematic threads weave through the essay.

Your task: Given an essay with paragraph markers and per-paragraph metrics from a deterministic analysis layer, produce a structural map as JSON.

You MUST return valid JSON matching this exact schema:

{
  "paragraphRoles": [
    {
      "index": <number>,
      "role": "<short label: hook, setup, escalation, turning-point, climax, reflection, resolution, coda, etc.>",
      "narrativeFunction": "<1-sentence: what this paragraph accomplishes in the narrative>",
      "strengthContribution": "<1-sentence: what this paragraph adds to the essay's impact>",
      "weaknessFlag": "<1-sentence issue, or null if no weakness>"
    }
  ],
  "arcType": "<man_in_hole | cinderella | icarus | quest | rags_to_riches | ambiguous>",
  "arcConfidence": <0.0-1.0>,
  "arcVerification": "<1-sentence: whether the heuristic arc detection was accurate and why>",
  "transitions": [
    {
      "fromParagraph": <number>,
      "toParagraph": <number>,
      "quality": "<seamless | functional | abrupt | missing>",
      "mechanism": "<how the transition works: thematic echo, temporal shift, contrast, continuation, etc.>"
    }
  ],
  "centralTheme": "<the essay's core thematic through-line in one sentence>",
  "themeProgression": "<how the theme develops from start to finish>",
  "thematicGaps": ["<any thematic threads introduced but not resolved>"],
  "pacingNotes": "<overall pacing assessment: where the essay rushes, lingers, or stalls>",
  "flatSpots": [<paragraph indices where momentum drops>]
}

Guidelines:
- paragraphRoles MUST have exactly one entry per paragraph, in order by index
- transitions should cover every consecutive paragraph pair (P0→P1, P1→P2, etc.)
- Be specific and evidence-based — reference actual content, not generic observations
- arcType should match one of the six allowed values exactly
- flatSpots should reference paragraph indices where tension/engagement drops
- weaknessFlag should be null for strong paragraphs, not an empty string`;

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

function buildUserPrompt(essayText: string, understanding: EssayUnderstanding): string {
  const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // Build essay text with [P1], [P2], etc. markers
  const markedEssay = paragraphs
    .map((p, i) => `[P${i + 1}] ${p.trim()}`)
    .join('\n\n');

  // Build per-paragraph metrics from Layer 1 data
  const paragraphMetrics = understanding.paragraphs.map((pu, i) => {
    const func = pu.functionAnalysis;
    const funcStr = func
      ? `function=${func.detectedFunction} (confidence=${func.confidence.toFixed(2)})`
      : 'function=unknown';

    const specificityStr = `specificity=${pu.specificityScore}/100`;
    const sceneStr = `scene/summary=${pu.sceneOrSummary}`;

    // Get tension level from narrative analysis if available
    let tensionStr = 'tension=N/A';
    if (understanding.narrativeAnalysis?.tensionCurve) {
      const tensionPara = understanding.narrativeAnalysis.tensionCurve.paragraphs.find(
        tp => tp.index === i
      );
      if (tensionPara) {
        tensionStr = `tension=${tensionPara.tensionLevel}/10 (${tensionPara.trend})`;
      }
    }

    return `  P${i + 1}: ${funcStr}, ${specificityStr}, ${sceneStr}, ${tensionStr}`;
  }).join('\n');

  // Narrative arc from Layer 1
  let arcStr = 'Not detected';
  if (understanding.narrativeAnalysis?.narrativeArc) {
    const arc = understanding.narrativeAnalysis.narrativeArc;
    arcStr = `${arc.detectedArc} (confidence=${arc.confidence.toFixed(2)})`;
  }

  // Emotional journey summary from Layer 1
  let emotionalStr = 'Not analyzed';
  if (understanding.narrativeAnalysis?.emotionalJourney) {
    const ej = understanding.narrativeAnalysis.emotionalJourney;
    const trajectory = ej.trajectory;
    const paraEmotions = ej.paragraphs
      .map(p => `P${p.index + 1}: ${p.dominantEmotions.join('/')} (intensity=${p.intensity.toFixed(2)})`)
      .join(', ');
    emotionalStr = `pattern=${trajectory.pattern}, variety=${trajectory.varietyScore.toFixed(2)}, journey=[${paraEmotions}]`;
  }

  return `ESSAY:
${markedEssay}

LAYER 1 PARAGRAPH METRICS:
${paragraphMetrics}

NARRATIVE ARC (heuristic): ${arcStr}

EMOTIONAL JOURNEY: ${emotionalStr}

Produce the structural map as JSON.`;
}

// ============================================================================
// HEURISTIC FALLBACK
// ============================================================================

function buildHeuristicFallback(essayText: string, understanding: EssayUnderstanding): StructuralCartography {
  const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  // Map paragraph functions to structural roles
  function functionToRole(func: ParagraphFunction, index: number, total: number): string {
    if (index === 0) return 'hook';
    if (index === total - 1) return 'resolution';

    const roleMap: Record<ParagraphFunction, string> = {
      grounding: 'setup',
      characterization: 'characterization',
      escalation: 'escalation',
      intimacy: 'turning-point',
      contrast: 'contrast',
      release: 'resolution',
      reflection: 'reflection',
      transition: 'bridge',
      exposition: 'exposition',
      ambiguous: 'development',
    };
    return roleMap[func] || 'development';
  }

  // Build paragraph roles from Layer 1 function analysis
  const paragraphRoles = understanding.paragraphs.map((pu, i) => {
    const func = pu.functionAnalysis?.detectedFunction ?? 'ambiguous';
    return {
      index: i,
      role: functionToRole(func, i, paragraphCount),
      narrativeFunction: `Serves as ${func} in the narrative sequence`,
      strengthContribution: pu.specificityScore >= 60
        ? 'Contributes concrete detail to the essay'
        : 'Provides necessary narrative scaffolding',
      weaknessFlag: pu.specificityScore < 30
        ? 'Low specificity — paragraph relies on abstract language'
        : null,
    };
  });

  // Build transitions — estimate quality from adjacent paragraph data
  const transitions: StructuralCartography['transitions'] = [];
  for (let i = 0; i < paragraphCount - 1; i++) {
    const fromFunc = understanding.paragraphs[i]?.functionAnalysis?.detectedFunction;
    const toFunc = understanding.paragraphs[i + 1]?.functionAnalysis?.detectedFunction;

    let quality: TransitionQuality = 'functional';
    if (fromFunc === toFunc) {
      quality = 'functional'; // Same function = likely smooth
    } else if (fromFunc === 'transition' || toFunc === 'transition') {
      quality = 'seamless'; // Explicit transition paragraph
    }

    transitions.push({
      fromParagraph: i,
      toParagraph: i + 1,
      quality,
      mechanism: 'continuation',
    });
  }

  // Arc from Layer 1
  const arcType: NarrativeArcType = understanding.narrativeAnalysis?.narrativeArc?.detectedArc ?? 'ambiguous';
  const arcConfidence = understanding.narrativeAnalysis?.narrativeArc?.confidence ?? 0.3;

  // Flat spots from tension curve
  const flatSpots: number[] = [];
  if (understanding.narrativeAnalysis?.tensionCurve) {
    const tc = understanding.narrativeAnalysis.tensionCurve;
    for (const fs of tc.curve.flatSpots) {
      for (let p = fs.startParagraph; p <= fs.endParagraph; p++) {
        flatSpots.push(p);
      }
    }
  }

  return {
    paragraphRoles,
    arcType,
    arcConfidence,
    arcVerification: 'Heuristic fallback — arc type taken directly from Layer 1 detection without LLM verification',
    transitions,
    centralTheme: 'Unable to determine — heuristic fallback',
    themeProgression: 'Unable to determine — heuristic fallback',
    thematicGaps: [],
    pacingNotes: 'Unable to assess — heuristic fallback',
    flatSpots,
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

const VALID_ARC_TYPES: NarrativeArcType[] = [
  'man_in_hole', 'cinderella', 'icarus', 'quest', 'rags_to_riches', 'ambiguous',
];

const VALID_TRANSITION_QUALITIES: TransitionQuality[] = [
  'seamless', 'functional', 'abrupt', 'missing',
];

function validateCartography(
  raw: Record<string, unknown>,
  expectedParagraphCount: number,
): StructuralCartography {
  const roles = raw.paragraphRoles as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(roles)) {
    throw new Error('paragraphRoles is not an array');
  }

  // Validate paragraph roles count
  if (roles.length !== expectedParagraphCount) {
    console.warn(
      `[StructuralCartographer] paragraphRoles count mismatch: got ${roles.length}, expected ${expectedParagraphCount}. Adjusting.`
    );
    // Trim excess or pad missing
    while (roles.length > expectedParagraphCount) {
      roles.pop();
    }
    while (roles.length < expectedParagraphCount) {
      const idx = roles.length;
      roles.push({
        index: idx,
        role: 'development',
        narrativeFunction: 'Continuation of narrative',
        strengthContribution: 'Contributes to overall structure',
        weaknessFlag: null,
      });
    }
  }

  // Normalize paragraph roles
  const validatedRoles = roles.map((r, i) => ({
    index: i,
    role: typeof r.role === 'string' ? r.role : 'development',
    narrativeFunction: typeof r.narrativeFunction === 'string' ? r.narrativeFunction : '',
    strengthContribution: typeof r.strengthContribution === 'string' ? r.strengthContribution : '',
    weaknessFlag: typeof r.weaknessFlag === 'string' && r.weaknessFlag.length > 0
      ? r.weaknessFlag
      : null,
  }));

  // Validate arc type
  let arcType = raw.arcType as NarrativeArcType;
  if (!VALID_ARC_TYPES.includes(arcType)) {
    arcType = 'ambiguous';
  }

  // Validate arc confidence
  let arcConfidence = Number(raw.arcConfidence);
  if (isNaN(arcConfidence) || arcConfidence < 0 || arcConfidence > 1) {
    arcConfidence = 0.5;
  }

  // Validate transitions
  const rawTransitions = raw.transitions as Array<Record<string, unknown>> | undefined;
  const transitions: StructuralCartography['transitions'] = [];
  if (Array.isArray(rawTransitions)) {
    for (const t of rawTransitions) {
      const from = Number(t.fromParagraph);
      const to = Number(t.toParagraph);
      let quality = t.quality as TransitionQuality;
      if (!VALID_TRANSITION_QUALITIES.includes(quality)) {
        quality = 'functional';
      }
      if (!isNaN(from) && !isNaN(to) && from >= 0 && to >= 0) {
        transitions.push({
          fromParagraph: from,
          toParagraph: to,
          quality,
          mechanism: typeof t.mechanism === 'string' ? t.mechanism : 'continuation',
        });
      }
    }
  }

  // Validate flat spots
  const rawFlatSpots = raw.flatSpots;
  const flatSpots: number[] = [];
  if (Array.isArray(rawFlatSpots)) {
    for (const f of rawFlatSpots) {
      const idx = Number(f);
      if (!isNaN(idx) && idx >= 0 && idx < expectedParagraphCount) {
        flatSpots.push(idx);
      }
    }
  }

  // Validate thematic gaps
  const rawGaps = raw.thematicGaps;
  const thematicGaps: string[] = [];
  if (Array.isArray(rawGaps)) {
    for (const g of rawGaps) {
      if (typeof g === 'string' && g.length > 0) {
        thematicGaps.push(g);
      }
    }
  }

  return {
    paragraphRoles: validatedRoles,
    arcType,
    arcConfidence,
    arcVerification: typeof raw.arcVerification === 'string' ? raw.arcVerification : '',
    transitions,
    centralTheme: typeof raw.centralTheme === 'string' ? raw.centralTheme : '',
    themeProgression: typeof raw.themeProgression === 'string' ? raw.themeProgression : '',
    thematicGaps,
    pacingNotes: typeof raw.pacingNotes === 'string' ? raw.pacingNotes : '',
    flatSpots,
  };
}

// ============================================================================
// SERVICE
// ============================================================================

export class StructuralCartographer {
  async analyzeStructure(
    essayText: string,
    understanding: EssayUnderstanding,
  ): Promise<{
    cartography: StructuralCartography;
    cost: number;
    timingMs: number;
    tokenUsage: { inputTokens: number; outputTokens: number };
  }> {
    const startTime = Date.now();
    const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;

    try {
      const userPrompt = buildUserPrompt(essayText, understanding);

      const response: ClaudeResponse<Record<string, unknown>> = await callClaudeWithRetry<Record<string, unknown>>(
        {
          model: HAIKU_MODEL,
          systemPrompt: SYSTEM_PROMPT,
          userPrompt,
          maxTokens: MAX_TOKENS,
          temperature: TEMPERATURE,
          useJsonMode: true,
          cacheSystemPrompt: true,
        },
      );

      const cartography = validateCartography(response.content, paragraphCount);
      const cost = calculateCost(response.usage, HAIKU_MODEL);
      const timingMs = Date.now() - startTime;

      return {
        cartography,
        cost,
        timingMs,
        tokenUsage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      console.warn(
        '[StructuralCartographer] Haiku call failed, using heuristic fallback:',
        error instanceof Error ? error.message : String(error),
      );

      const cartography = buildHeuristicFallback(essayText, understanding);
      const timingMs = Date.now() - startTime;

      return {
        cartography,
        cost: 0,
        timingMs,
        tokenUsage: { inputTokens: 0, outputTokens: 0 },
      };
    }
  }
}

export const structuralCartographer = new StructuralCartographer();
