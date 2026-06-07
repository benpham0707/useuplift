/**
 * Phase Assessment — LLM-Assessed Improvement Phase Detection
 *
 * Replaces the deterministic `computeImprovementPhase()` with a single Sonnet synthesis
 * call that sees all paragraph scores + holistic context and produces a qualitative,
 * per-dimension phase assessment with coaching lens guidance.
 *
 * Key design decisions:
 * - Sonnet (not Haiku) for nuanced qualitative judgment (~$0.02-0.03 per call)
 * - LLM selects which dimensions matter for THIS essay (not all 8 always)
 * - Coaching lens: 2-4 sentence directive injected into L5/L6 prompts
 * - Phase transition detection when priorPhase is available
 * - legacyReadiness computed deterministically from level for backward compat
 *
 * Spec: Improvement 9 in docs/specs/PLAN.md
 */

import type {
  EssayProfile,
  EssayType,
  AnalysisPassOutput,
  ImprovementPhase,
  ImprovementPhaseLevel,
} from '../profileTypes';
import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import { parseLlmJsonOutput } from './llmJsonParser';
import {
  isCorpusRetrievalEnabled,
  createTelemetry,
  retrievePhaseArchetypes,
  buildPhaseArchetypesBlock,
  estimateBlockTokens,
} from './corpusRetrievalBlocks';
import { buildCorpusTelemetryRecord, persistCorpusTelemetry } from './corpusTelemetryPersistence';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';

// ============================================================================
// INPUT / OUTPUT TYPES
// ============================================================================

export interface PhaseAssessmentInput {
  analyses: AnalysisPassOutput[];
  profile: Readonly<EssayProfile>;
  essayType?: EssayType;
  priorPhase?: ImprovementPhase | null;
  /** Optional essayId — used only for Phase 3B telemetry persistence. */
  essayId?: string;
}

export interface PhaseAssessmentResult {
  phase: ImprovementPhase;
  cost: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  timingMs: number;
  /** True if the phase was determined via fallback rather than LLM assessment */
  isDegraded: boolean;
  /** Reason for degradation — present only when isDegraded is true */
  degradationReason?: string;
}

// ============================================================================
// LEGACY READINESS LOOKUP
// ============================================================================

/**
 * Deterministic lookup from phase level to numeric readiness values.
 * Used ONLY for backward-compat logging — not for any analytical judgment.
 */
function computeLegacyReadiness(level: ImprovementPhaseLevel): ImprovementPhase['legacyReadiness'] {
  switch (level) {
    case 'foundation':
      return { essayLevel: 20, paragraphLevel: 25, sentenceLevel: 20, wordLevel: 0 };
    case 'architecture':
      return { essayLevel: 45, paragraphLevel: 50, sentenceLevel: 40, wordLevel: 15 };
    case 'craft':
      return { essayLevel: 65, paragraphLevel: 70, sentenceLevel: 60, wordLevel: 35 };
    case 'polish':
      return { essayLevel: 80, paragraphLevel: 85, sentenceLevel: 75, wordLevel: 60 };
    case 'distinction':
      return { essayLevel: 90, paragraphLevel: 92, sentenceLevel: 88, wordLevel: 85 };
  }
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

function buildPhaseSystemPrompt(): string {
  return `You are an expert essay assessment engine. Your job is to determine the IMPROVEMENT PHASE of a college admissions essay based on completed paragraph-level scoring and holistic understanding.

THE 5 IMPROVEMENT PHASES (ordered from earliest to most advanced):

1. FOUNDATION — The essay has fundamental structural or clarity problems. The thesis is unclear or absent, multiple paragraphs lack purpose, or a significant portion of sentences are problematic. Feedback should focus on overall structure, thesis clarity, and narrative arc before anything else.

2. ARCHITECTURE — The basic structure exists but paragraph roles need sharpening. The essay has a discernible thesis and general direction, but transitions are weak, some paragraphs don't earn their place, or the narrative arc has gaps. Feedback should focus on paragraph-level effectiveness and structural connections.

3. CRAFT — Structure is solid; sentence-level craft needs attention. Paragraphs serve clear roles and the arc works, but many sentences rely on clichés, template phrasing, or lack the specificity that makes writing memorable. Feedback should focus on sentence-level effectiveness, voice authenticity, and showing vs telling.

4. POLISH — Craft is strong; word-level refinement will elevate the essay. Most sentences are effective and the essay reads well, but there are opportunities for more precise word choices, subtle rhythm improvements, and micro-level craft that separates good from excellent. Feedback should target specific word choices and micro-craft.

5. DISTINCTION — The essay is polished and effective. The focus is on the 1-2% of changes that could make it truly unforgettable — a more striking opening image, a more resonant closing line, a moment where the voice could be even more distinctively the writer's own.

YOUR TASK:
Given the paragraph scoring results and holistic context, produce a JSON assessment with:
- Overall phase level and reasoning
- Which dimensions (of voice, emotion, theme, narrative, character, craft, structure, admissions) are most relevant to THIS essay, with per-dimension phase levels
- A coaching lens: 2-4 sentences that tell downstream feedback/coaching systems HOW to approach this student
- A readiness assessment: prose description of where the essay stands
- Focus areas and deferred areas
- If a prior phase is provided, assess whether the transition is genuine

DIMENSION SELECTION:
You do NOT need to assess all 8 dimensions. Choose 3-6 that are most meaningful for THIS specific essay. Skip dimensions where the essay provides insufficient signal or where the dimension isn't particularly relevant.

DIMENSION DIVERGENCE CHECK (mandatory):
Before assigning dimension phases, ask: "Are there dimensions at DIFFERENT developmental levels?" An essay can have authentic voice (craft phase) but broken structure (foundation phase). If your dimension phases are all the same level, reconsider whether you are reading the holistic context carefully. Uniform dimension phases are valid for some essays but rare — most essays have uneven development across dimensions. Cite specific holistic evidence for each dimension's level.

NARRATIVE vs ARGUMENTATIVE CALIBRATION (mandatory):
Check the holistic context for arc type and primary strategy. If the essay is NARRATIVE (memoir, reflective, montage, bracket, chronological, or similar):

- "Thesis" manifests as an EMERGENT THEME woven through scenes and moments — not a stated argument. A narrative essay at Architecture phase may have a powerful through-line but no explicit thesis statement. This is BY DESIGN, not a weakness.
- A narrative essay with a clear emotional arc, specific scenes, and an emergent theme should NOT be placed at Foundation phase simply because it lacks an explicit thesis. Foundation phase for narratives means: no discernible through-line, scenes that don't accumulate toward meaning, or fundamentally confused storytelling.
- For narrative essays, evaluate "structural coherence" through narrative arc and scene progression, NOT through topic sentences and argument structure.
- A narrative essay's "pivot points" serve the same structural role as an argumentative essay's "thesis + evidence" — they are how the essay builds its case through SHOWING rather than TELLING.

If the essay is ARGUMENTATIVE (thesis-driven, analytical):
- Standard phase criteria apply. Thesis clarity, evidence structure, and logical progression are the primary structural signals.
- An argumentative essay at Foundation phase legitimately lacks a clear thesis or has incoherent evidence organization.

COACHING LENS:
This is the most important output. It's a 2-4 sentence directive that will be injected into feedback and coaching prompts. It should capture:
- The student's current developmental stage as a writer
- What kind of feedback will be most productive right now
- Any sensitivities to be aware of (e.g., "this student's voice is authentic but fragile — don't suggest changes that would homogenize it")

OUTPUT FORMAT (strict JSON, no markdown wrapping):
{
  "level": "foundation" | "architecture" | "craft" | "polish" | "distinction",
  "reasoning": "2-3 sentences explaining why this phase",
  "focusAreas": ["specific area 1 with evidence", "specific area 2 with evidence"],
  "deferredAreas": ["area to defer with reason"],
  "readinessAssessment": "2-3 sentence prose assessment of where the essay stands",
  "dimensionPhases": [
    {
      "dimension": "voice" | "emotion" | "theme" | "narrative" | "character" | "craft" | "structure" | "admissions",
      "level": "foundation" | "architecture" | "craft" | "polish" | "distinction",
      "reasoning": "why this dimension is at this level",
      "coachingApproach": "how to approach feedback for this dimension"
    }
  ],
  "coachingLens": "2-4 sentence coaching directive",
  "nearBoundary": true | false,
  "transition": null | {
    "priorLevel": "the prior phase level",
    "isGenuineShift": true | false,
    "transitionReasoning": "why the shift is/isn't genuine",
    "celebratoryLine": "string OR null — see PHASE-UP CELEBRATORY LINE below"
  }
}

PHASE-UP CELEBRATORY LINE (only relevant when transition.isGenuineShift = true)

When you have determined the phase shift is genuine, also produce a 15-40
word line that will be shown to the student inside a celebratory modal
AFTER they re-analyze. Set transition.celebratoryLine to this string.

The line must:
- Reference at least one specific move, scene, choice, image, or pattern
  unique to THIS essay (no generic phrasing).
- Acknowledge what the crossing means — what kind of work is now done,
  and what kind of work is now possible.
- Stay in third-person observational register. The modal already says
  "You moved from {prior} to {new}" — your line is the MEANING of the
  move, not another announcement of it.
- Avoid: metrics, scores, "great job", "way to go", "you leveled up",
  any second-person command, any praise that would read identically for
  another essay.

Calibration test: read your line and ask "could I paste this under any
other essay's phase-up beat?" If yes, rewrite with more specificity. The
line should feel hand-written by a counselor who read THIS draft three
times.

Set celebratoryLine = null when:
  - transition.isGenuineShift is false.
  - The essay's moves don't warrant a celebratory beat (e.g., the phase
    shifted because of a structural deletion that fixed a problem but
    didn't add craft).
  - You cannot meet the calibration test above without generic copy.

Better to emit null than a generic line — the UI has a fallback registry
for null cases. Never emit a template-interpolated line.`;
}

function buildScoringDigest(analyses: AnalysisPassOutput[]): string {
  if (analyses.length === 0) return 'No paragraph analyses available.';

  const lines: string[] = ['PARAGRAPH SCORING RESULTS:'];

  let totalSentences = 0;
  let problemCount = 0;
  let strengthCount = 0;
  const allScores: number[] = [];

  for (const a of analyses) {
    const sentenceScores = a.sentenceAnalyses.map(sa => sa.effectiveness);
    const min = Math.min(...sentenceScores);
    const max = Math.max(...sentenceScores);
    const problems = a.sentenceAnalyses.filter(sa => sa.isProblem).length;
    const strengths = a.sentenceAnalyses.filter(sa => sa.isStrength).length;

    lines.push(
      `  P${a.paragraphIndex}: effectiveness=${a.paragraphEffectiveness}, ` +
      `${a.sentenceAnalyses.length} sentences (range ${min}-${max}), ` +
      `${strengths} strong, ${problems} problematic` +
      (a.paragraphVerdict ? ` — "${a.paragraphVerdict}"` : ''),
    );

    totalSentences += a.sentenceAnalyses.length;
    problemCount += problems;
    strengthCount += strengths;
    allScores.push(...sentenceScores);
  }

  const avgParagraph = analyses.reduce((s, a) => s + a.paragraphEffectiveness, 0) / analyses.length;
  const avgSentence = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

  lines.push('');
  lines.push(`SUMMARY: ${analyses.length} paragraphs, ${totalSentences} sentences`);
  lines.push(`  Avg paragraph effectiveness: ${avgParagraph.toFixed(1)}`);
  lines.push(`  Avg sentence effectiveness: ${avgSentence.toFixed(1)}`);
  lines.push(`  Problem ratio: ${totalSentences > 0 ? ((problemCount / totalSentences) * 100).toFixed(0) : 0}% (${problemCount}/${totalSentences})`);
  lines.push(`  Strength ratio: ${totalSentences > 0 ? ((strengthCount / totalSentences) * 100).toFixed(0) : 0}% (${strengthCount}/${totalSentences})`);

  return lines.join('\n');
}

function buildHolisticDigest(profile: Readonly<EssayProfile>): string {
  const lines: string[] = ['HOLISTIC CONTEXT:'];

  // Thesis confidence
  if (profile.thematicArchitecture) {
    const ta = profile.thematicArchitecture;
    if (typeof ta.thesisConfidence === 'number') {
      lines.push(`  Thesis confidence: ${(ta.thesisConfidence * 100).toFixed(0)}%`);
    }
    if (ta.thesis) lines.push(`  Thesis: "${ta.thesis}"`);
    if (Array.isArray(ta.threads) && ta.threads.length > 0) {
      lines.push(`  Thematic threads: ${ta.threads.map(t => `${t.name} (${t.strength})`).join(', ')}`);
    }
  }

  // Voice
  if (profile.voiceIdentity) {
    const vi = profile.voiceIdentity;
    if (vi.signature) lines.push(`  Voice signature: ${vi.signature}`);
    if (vi.register) lines.push(`  Voice register: ${vi.register}`);
  }

  // Narrative strategy
  if (profile.narrativeStrategy) {
    const ns = profile.narrativeStrategy;
    if (ns.arcType) lines.push(`  Arc type: ${ns.arcType}`);
    if (ns.primaryStrategy) lines.push(`  Primary strategy: ${ns.primaryStrategy}`);
    if (ns.arcMomentum) lines.push(`  Arc momentum: ${ns.arcMomentum}`);
    if (Array.isArray(ns.pivotPoints)) {
      lines.push(`  Pivot points: ${ns.pivotPoints.length}`);
    }
    if (ns.turningPoint != null) lines.push(`  Turning point: present`);
  }

  // Craft assessment
  if (profile.craftAssessment) {
    const ca = profile.craftAssessment;
    if (Array.isArray(ca.strengthSignatures)) {
      lines.push(`  Strength signatures: ${ca.strengthSignatures.length}`);
    }
    if (Array.isArray(ca.growthEdges)) {
      lines.push(`  Growth edges: ${ca.growthEdges.length}`);
    }
  }

  // Character revelation
  if (profile.characterRevelation) {
    const cr = profile.characterRevelation;
    if (Array.isArray(cr.valuesRevealed)) {
      lines.push(`  Values revealed: ${cr.valuesRevealed.length}`);
    }
    if (cr.growthArc != null) {
      lines.push(`  Growth arc: ${cr.growthArc.length > 0 ? 'present' : 'absent'}`);
    }
  }

  // Admissions positioning
  if (profile.admissionsPositioning) {
    const ap = profile.admissionsPositioning;
    if (Array.isArray(ap.distinctivenessFactors)) {
      lines.push(`  Distinctiveness factors: ${ap.distinctivenessFactors.length}`);
    }
    if (Array.isArray(ap.redFlags)) {
      lines.push(`  Red flags: ${ap.redFlags.length}`);
    }
  }

  // Emotional topography
  if (profile.emotionalTopography) {
    const et = profile.emotionalTopography;
    if (Array.isArray(et.showVsTell) && et.showVsTell.length > 0) {
      const shown = et.showVsTell.filter(s => s.assessment === 'shown').length;
      lines.push(`  Show vs tell: ${shown}/${et.showVsTell.length} shown`);
    }
  }

  return lines.join('\n');
}

function buildPhaseUserPrompt(
  input: PhaseAssessmentInput,
  corpusArchetypeBlock?: string,
): string {
  const { analyses, profile, essayType, priorPhase } = input;

  const lines: string[] = [];

  // Essay type context with type-appropriate phase calibration
  if (essayType) {
    lines.push(`ESSAY TYPE: ${essayType}`);
    if (essayType === 'supplement') {
      lines.push('NOTE: Supplements (150-250 words) have simpler structural expectations. A supplement at Architecture phase may only need 2-3 clear sections, not the complex multi-paragraph development expected of a personal statement. Adjust phase expectations proportionally to essay length and scope.');
    } else if (essayType === 'piq') {
      lines.push('NOTE: PIQs (~350 words) should demonstrate moderate structural development. Phase expectations should reflect PIQ-appropriate scope — one well-developed insight is often stronger than scattered breadth.');
    }
    lines.push('');
  }

  // Scoring digest
  lines.push(buildScoringDigest(analyses));
  lines.push('');

  // Holistic digest
  lines.push(buildHolisticDigest(profile));
  lines.push('');

  // Wave-3a Phase 3A: corpus archetype anchors (injected after holistic digest,
  // before prior-phase context). Skipped silently when the feature flag is off
  // or retrieval returned nothing.
  if (corpusArchetypeBlock && corpusArchetypeBlock.length > 0) {
    lines.push(corpusArchetypeBlock);
    lines.push('');
  }

  // Prior phase for transition detection
  if (priorPhase) {
    lines.push('PRIOR PHASE ASSESSMENT:');
    lines.push(`  Level: ${priorPhase.level}`);
    lines.push(`  Reasoning: ${priorPhase.reasoning}`);
    lines.push(`  Focus areas: ${priorPhase.focusAreas.join(', ')}`);
    lines.push('');
    lines.push('Assess whether the current scoring data represents a GENUINE phase shift from the prior assessment, or whether the difference is within normal variation. Set transition.isGenuineShift accordingly.');
  } else {
    lines.push('This is the FIRST phase assessment for this essay. Set transition to null.');
  }

  lines.push('');
  lines.push('Produce your assessment as a single JSON object. No markdown wrapping.');

  return lines.join('\n');
}

// ============================================================================
// VALIDATION
// ============================================================================

const VALID_LEVELS: Set<string> = new Set(['foundation', 'architecture', 'craft', 'polish', 'distinction']);
const VALID_DIMENSIONS: Set<string> = new Set(['voice', 'emotion', 'theme', 'narrative', 'character', 'craft', 'structure', 'admissions']);

function validatePhaseOutput(raw: Record<string, unknown>, priorPhase?: ImprovementPhase | null): ImprovementPhase {
  // Level
  const level = VALID_LEVELS.has(String(raw.level))
    ? String(raw.level) as ImprovementPhaseLevel
    : 'foundation';

  // Reasoning
  const reasoning = typeof raw.reasoning === 'string' && raw.reasoning.length > 0
    ? raw.reasoning
    : `Phase assessed as ${level}`;

  // Focus/deferred areas
  const focusAreas = Array.isArray(raw.focusAreas)
    ? raw.focusAreas.filter((a): a is string => typeof a === 'string' && a.length > 0)
    : [];
  const deferredAreas = Array.isArray(raw.deferredAreas)
    ? raw.deferredAreas.filter((a): a is string => typeof a === 'string' && a.length > 0)
    : [];

  // Readiness assessment
  const readinessAssessment = typeof raw.readinessAssessment === 'string' && raw.readinessAssessment.length > 0
    ? raw.readinessAssessment
    : `Essay is at ${level} phase.`;

  // Dimension phases
  const dimensionPhases: ImprovementPhase['dimensionPhases'] = [];
  if (Array.isArray(raw.dimensionPhases)) {
    for (const dp of raw.dimensionPhases) {
      if (typeof dp === 'object' && dp !== null) {
        const d = dp as Record<string, unknown>;
        const dim = String(d.dimension || '');
        const dimLevel = String(d.level || '');
        if (VALID_DIMENSIONS.has(dim) && VALID_LEVELS.has(dimLevel)) {
          dimensionPhases.push({
            dimension: dim,
            level: dimLevel as ImprovementPhaseLevel,
            reasoning: typeof d.reasoning === 'string' ? d.reasoning : '',
            coachingApproach: typeof d.coachingApproach === 'string' ? d.coachingApproach : '',
          });
        }
      }
    }
  }

  // Coaching lens
  const coachingLens = typeof raw.coachingLens === 'string' && raw.coachingLens.length > 0
    ? raw.coachingLens
    : `This essay is at the ${level} phase. Focus feedback on ${focusAreas[0] || 'overall quality'}.`;

  // Near boundary
  const nearBoundary = typeof raw.nearBoundary === 'boolean' ? raw.nearBoundary : undefined;

  // Transition
  let transition: ImprovementPhase['transition'] = null;
  if (priorPhase && raw.transition && typeof raw.transition === 'object') {
    const t = raw.transition as Record<string, unknown>;
    const priorLevel = VALID_LEVELS.has(String(t.priorLevel))
      ? String(t.priorLevel) as ImprovementPhaseLevel
      : priorPhase.level;
    const isGenuineShift = typeof t.isGenuineShift === 'boolean'
      ? t.isGenuineShift
      : level !== priorPhase.level;
    // §11.5 celebratory line: only meaningful on a genuine shift. Coerce to
    // null on a non-genuine shift even if the LLM emitted a line, and on any
    // non-string/empty value — null is the explicit "use registry" signal.
    const celebratoryLine =
      isGenuineShift && typeof t.celebratoryLine === 'string' && t.celebratoryLine.trim().length > 0
        ? t.celebratoryLine.trim()
        : null;
    transition = {
      priorLevel,
      isGenuineShift,
      transitionReasoning: typeof t.transitionReasoning === 'string' ? t.transitionReasoning : '',
      celebratoryLine,
    };
  }

  return {
    level,
    reasoning,
    focusAreas,
    deferredAreas,
    readinessAssessment,
    legacyReadiness: computeLegacyReadiness(level),
    dimensionPhases,
    coachingLens,
    transition,
    nearBoundary: nearBoundary || undefined,
  };
}

// ============================================================================
// CORE FUNCTION
// ============================================================================

/**
 * Assess the improvement phase using a single Sonnet synthesis call.
 *
 * Replaces the deterministic `computeImprovementPhase()` with LLM judgment.
 * Sees all paragraph scores + holistic context → qualitative phase assessment.
 *
 * Cost: ~$0.02-0.03 per call. Latency: ~2-3s.
 */
export async function assessPhase(input: PhaseAssessmentInput): Promise<PhaseAssessmentResult> {
  const startTime = Date.now();

  // Edge case: no analyses available — return foundation default without API call
  if (input.analyses.length === 0) {
    return {
      phase: {
        level: 'foundation',
        reasoning: 'No paragraph analyses available — defaulting to foundation phase',
        focusAreas: ['Thesis clarity', 'Basic narrative arc', 'Structural coherence'],
        deferredAreas: ['Sentence-level craft', 'Word choice', 'Polish'],
        readinessAssessment: 'The essay has not yet been analyzed at the paragraph level. Full analysis is needed before phase assessment can be determined.',
        legacyReadiness: computeLegacyReadiness('foundation'),
        dimensionPhases: [],
        coachingLens: 'This essay needs initial analysis. Focus on understanding the essay\'s structure and thesis before providing targeted feedback.',
        transition: null,
      },
      cost: 0,
      tokenUsage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
      timingMs: Date.now() - startTime,
      isDegraded: true,
      degradationReason: 'No paragraph analyses available',
    };
  }

  const systemPrompt = buildPhaseSystemPrompt();

  // Wave-3a Phase 3A: retrieve corpus archetype anchors for this essay's
  // thematic+narrative signature. Feature-flag-gated; degrades to empty string
  // silently when disabled or on retrieval error.
  // Wave-3a Phase 3B: persist phase-level telemetry separately from L3.5's
  // record so downstream aggregation can slice by layer.
  let corpusArchetypeBlock: string | undefined;
  if (isCorpusRetrievalEnabled()) {
    const phaseRunStart = Date.now();
    const phaseTelemetry = createTelemetry();
    const archetypes = await retrievePhaseArchetypes(input.profile, phaseTelemetry);
    corpusArchetypeBlock = buildPhaseArchetypesBlock(archetypes) || undefined;
    phaseTelemetry.corpusBlockTokens += estimateBlockTokens(corpusArchetypeBlock ?? '');
    phaseTelemetry.totalLatencyMs = Date.now() - phaseRunStart;
    const attempt = phaseTelemetry.attempts[0];
    if (attempt) {
      console.log(
        `[PhaseAssessment/corpus] archetypes=${attempt.resultCount}, ` +
        `latency=${attempt.latencyMs}ms, injected=${attempt.injected}` +
        (attempt.error ? `, error=${attempt.error}` : ''),
      );
    }
    const phaseRecord = buildCorpusTelemetryRecord({
      essayId: input.essayId ?? 'unknown',
      layer: 'phase-assessment',
      telemetry: phaseTelemetry,
    });
    void persistCorpusTelemetry(phaseRecord);
  }

  const userPrompt = buildPhaseUserPrompt(input, corpusArchetypeBlock);

  try {
    const response = await callClaudeWithRetry<string>({
      model: SONNET,
      systemPrompt,
      userPrompt,
      maxTokens: 1500,
      temperature: 0.3,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });

    const cost = calculateCost(response.usage, SONNET);
    const timingMs = Date.now() - startTime;

    // Parse and validate
    const parsed = parseLlmJsonOutput(response.content, 'PhaseAssessment');
    const phase = validatePhaseOutput(parsed, input.priorPhase);

    console.log(
      `[PhaseAssessment] Phase=${phase.level}, dimensions=${phase.dimensionPhases.length}, ` +
      `cost=$${cost.toFixed(4)}, time=${timingMs}ms` +
      (phase.transition ? ` transition=${phase.transition.priorLevel}→${phase.level} (genuine=${phase.transition.isGenuineShift})` : ''),
    );

    return {
      phase,
      cost,
      tokenUsage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      },
      timingMs,
      isDegraded: false,
    };
  } catch (error) {
    // On LLM failure, fall back to foundation phase with error context
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[PhaseAssessment] Sonnet call failed: ${errorMsg}. Falling back to foundation phase.`);

    return {
      phase: {
        level: 'foundation',
        reasoning: `Phase assessment failed (${errorMsg}) — defaulting to foundation phase for safety`,
        focusAreas: ['Thesis clarity', 'Structural coherence'],
        deferredAreas: ['Sentence-level craft', 'Word choice'],
        readinessAssessment: 'Phase assessment could not be completed. Defaulting to foundation-level feedback.',
        legacyReadiness: computeLegacyReadiness('foundation'),
        dimensionPhases: [],
        coachingLens: 'Phase assessment failed. Provide foundation-level feedback focusing on structure and clarity.',
        transition: null,
      },
      cost: 0,
      tokenUsage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
      timingMs: Date.now() - startTime,
      isDegraded: true,
      degradationReason: errorMsg,
    };
  }
}
