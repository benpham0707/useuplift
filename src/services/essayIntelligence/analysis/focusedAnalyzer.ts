/**
 * Focused Analyzer — Surgical Re-analysis for Small Edits
 *
 * Runs a 4-step focused pipeline when a small change doesn't warrant full pipeline re-run.
 * The key innovation is delta-reasoning: instead of re-analyzing from scratch, the model
 * computes a DIFFERENTIAL from the existing understanding — what was GAINED, LOST, CONFIRMED,
 * or INVALIDATED by the edit.
 *
 * 4-Step Pipeline:
 * 1. Focused Understanding Update (Sonnet, ~$0.02-0.04): delta-reasoning on changed sentence
 * 2. Focused Analysis Update (Sonnet, ~$0.02-0.04): re-evaluate based on updated understanding
 * 3. Escalation Ladder: conditional ripple handling (paragraph → holistic → comprehensive)
 * 4. Phase Re-computation: update improvement phase if paragraph analysis changed
 *
 * Cost acceleration: Round 1 ~$0.75 → Round 5 ~$0.03 (focused pipeline = 10x cheaper)
 *
 * Spec: docs/specs/PLAN.md (Phase 1L — Focused Analysis Mode)
 */

import type {
  EssayProfile,
  EditUnderstandingOutput,
  ImprovementPhase,
  AnalysisPassOutput,
  ReanalysisBrief,
  FindingMaturity,
  DeltaSynthesisRequest,
  HolisticSectionType,
} from '../profileTypes';

import type { ProfileRouter, AssembledProfileContext } from '../profileManager/profileRouter';
import type { EssayProfileCoordinator } from '../profileManager/essayProfileManager';

import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import { jsonrepair } from 'jsonrepair';

import { sequentialDeepWalkService } from './sequentialDeepWalk';
import { holisticSynthesisService } from './holisticSynthesis';
import { assessPhase } from './phaseAssessment';
import type { LayerCost, TokenUsage } from './analysisOrchestrator';
import { buildParagraphFindingContext, buildAnnotationFindingContext } from '../findings/findingContextBuilder';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';
const FOCUSED_TEMPERATURE = 0.3;
const FOCUSED_MAX_TOKENS = 3000;
const FOCUSED_TIMEOUT_MS = 90_000;

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * Delta for the focused understanding update (Step 1).
 * Phase 2: primaryFunction + findings replace observation arrays.
 * Represents what changed in the understanding, not the full new understanding.
 */
export interface FocusedUnderstandingDelta {
  /** Updated primaryFunction — null if unchanged by the edit */
  updatedPrimaryFunction: string | null;
  /** Updated significance — null if unchanged */
  updatedSignificance: 'pivotal' | 'contributing' | 'transitional' | null;
  /** Ripple flags: does this change propagate beyond the sentence? */
  rippleFlags: {
    /** Does the change affect anything beyond this sentence? */
    beyondSentence: boolean;
    /** Does the change affect the broader paragraph structure? */
    beyondParagraph: boolean;
    /** Does the change shift holistic understanding? */
    holisticShift: boolean;
    /** Specific ripple targets identified (connection IDs, paragraph indices, etc.) */
    specificRipples: string[];
    /** Evidence for the ripple assessment — must cite specific mechanism */
    rippleEvidence: string;
  };
  /** Updated paragraph contribution summary */
  updatedParagraphContribution: string;
  /** Tensions between student intent and text evidence */
  tensions: string[];
  /** Finding evolutions triggered by this edit (confirmed, deepened, superseded) */
  findingEvolutions?: Array<{
    findingId: string;
    newMaturity: FindingMaturity;
    reasoning: string;
    supersedes?: string;
  }>;
  /** New findings revealed by this edit — genuinely new insights not captured elsewhere */
  newFindings?: Array<{
    claim: string;
    scope: { type: string; paragraph: number; sentences?: number[] };
    maturity: string;
    maturityReasoning?: string;
    dimensions: string[];
    evidence: Array<{ text: string; location?: { paragraph: number; sentence?: number } }>;
    deepeningPotential: string | null;
    raisesQuestions: string[];
  }>;
}

/**
 * Delta for the focused analysis update (Step 2).
 * How effectiveness scores and assessments change.
 */
export interface FocusedAnalysisDelta {
  /** Updated effectiveness score (0-100) */
  effectiveness: number;
  /** Change in effectiveness score (positive = improved, negative = regressed) */
  effectivenessDelta: number;
  /** Updated strength description */
  strengthUpdate: string;
  /** Updated weakness description */
  weaknessUpdate: string;
  /** Change in paragraph-level effectiveness (derived from sentence changes) */
  paragraphEffectivenessDelta: number;
  /** Dimension-specific updates (sparse — only dimensions that changed) */
  dimensionUpdates: Record<string, number>;
}

/**
 * Complete result from a focused analysis run.
 */
export interface FocusedAnalysisResult {
  /** Whether the focused pipeline completed or had to escalate to comprehensive */
  mode: 'focused' | 'escalated_to_comprehensive';
  /**
   * Escalation level reached:
   * 1 = sentence-only update (no ripple)
   * 2 = paragraph re-walk triggered
   * 3 = targeted holistic refresh triggered
   * 4 = escalated to comprehensive (signal for orchestrator)
   */
  escalationLevel: 1 | 2 | 3 | 4;
  /** Which paragraph was updated */
  updatedParagraphIndex: number;
  /** Which sentence was updated */
  updatedSentenceIndex: number;
  /** Step 1 result: what changed in understanding (null if LLM failed) */
  understandingDelta: FocusedUnderstandingDelta | null;
  /** Step 2 result: how effectiveness changed (null if no understanding change or LLM failed) */
  analysisDelta: FocusedAnalysisDelta | null;
  /** Phase update if the improvement phase shifted (null if no change) */
  phaseUpdate: ImprovementPhase | null;
  /** Cost breakdown — one entry per LLM call made */
  cost: LayerCost[];
  /** Total cost across all calls */
  totalCost: number;

  /**
   * [D-1.12 Commit B closure 2026-04-29] True iff every step of the
   * focused pipeline that was attempted completed cleanly. False when
   * any step (Step 1 understanding, Step 2 analysis, Level 2 re-walk,
   * Level 3 holistic refresh, Level 2→3 upgrade synthesis, snapshot
   * creation, delta application) caught an error.
   *
   * Pre-fix: each catch left `escalationLevel` at the value the success
   * path WOULD have set, with no signal to the caller. F-1 had just
   * wired `escalationLevel` through reanalysisOrchestrator → PipelineInput
   * → IterationRecord.escalationLevel — a load-bearing audit field. The
   * catches therefore fed a load-bearing field with hardcoded/stale
   * values indistinguishable from real success outcomes.
   *
   * Post-fix: the caller reads this flag. When false, the caller MUST
   * NOT pass escalationLevel into IterationRecord (it must pass
   * undefined so the consumer's `?? 0` defaults honestly). The caller
   * is also responsible for emitting iteration telemetry for each
   * entry in `failedSteps` — focusedAnalyzer does not have essayId in
   * scope and would need a signature change to emit telemetry directly,
   * so the orchestrator (which has essayId) is the emitter.
   *
   * Default true; set to false on any catch path.
   */
  escalationLevelTrustworthy: boolean;
  /**
   * Names of every step that caught an error. Empty when the run
   * completed cleanly. Sorted in execution order. The orchestrator
   * iterates this list to emit one iterationTelemetry event per
   * failed step (parity with F-2's AO First Read closure pattern).
   */
  failedSteps: Array<
    | 'step1_understanding'
    | 'step2_analysis'
    | 'level2_rewalk'
    | 'level3_holistic'
    | 'l2_to_l3_upgrade'
    | 'snapshot_creation'
    | 'understanding_delta_apply'
    | 'understanding_delta_restore'
    | 'analysis_delta_apply'
    | 'analysis_delta_restore'
    | 'phase_recompute'
    | 'w54c_delta_synthesis'
  >;
}

// ============================================================================
// RAW LLM RESPONSE TYPES (for parsing)
// ============================================================================

/**
 * Raw LLM output for focused understanding update.
 * Parsed from JSON, then validated before use.
 */
interface RawUnderstandingDelta {
  updatedPrimaryFunction?: unknown;
  updatedSignificance?: unknown;
  rippleFlags?: {
    beyondSentence?: unknown;
    beyondParagraph?: unknown;
    holisticShift?: unknown;
    specificRipples?: unknown;
    rippleEvidence?: unknown;
  };
  updatedParagraphContribution?: unknown;
  tensions?: unknown;
  findingEvolutions?: unknown;
  newFindings?: unknown;
}

/**
 * Raw LLM output for focused analysis update.
 */
interface RawAnalysisDelta {
  effectiveness?: unknown;
  effectivenessDelta?: unknown;
  strengthUpdate?: unknown;
  weaknessUpdate?: unknown;
  paragraphEffectivenessDelta?: unknown;
  dimensionUpdates?: unknown;
}

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

const FOCUSED_UNDERSTANDING_SYSTEM_PROMPT = `You are an essay intelligence system performing a DELTA UPDATE on an existing sentence understanding.

CRITICAL RULE: You are NOT re-analyzing from scratch. You are computing a DIFFERENTIAL — what the new text changes relative to the existing understanding.

Your job is to determine:
1. Whether the sentence's PRIMARY FUNCTION changed (its architectural role in the essay)
2. Whether its SIGNIFICANCE level changed (pivotal/contributing/transitional)
3. Whether any existing FINDINGS are confirmed, deepened, or invalidated by the edit
4. Whether the change RIPPLES beyond this sentence (with evidence, not speculation)

EVIDENCE REQUIREMENT: Every claim must cite specific text from the new version. No abstract claims.

RIPPLE ANTI-FABRICATION: If you cannot cite a specific mechanism (e.g., a connection ID that links this sentence to another), say the change is contained. A false ripple costs $0.05-0.40 in unnecessary escalation.

Respond with a JSON object matching the exact schema provided.`;

const FOCUSED_ANALYSIS_SYSTEM_PROMPT = `You are an essay intelligence system performing a DELTA RE-EVALUATION of sentence effectiveness.

CRITICAL RULE: You are NOT scoring from scratch. You are computing HOW MUCH the score should change given the updated understanding.

CALIBRATION ANCHORS — how much should effectiveness shift?
- word_refinement that resolves a weakness → +3 to +8 points
- meaning_evolution that introduces new depth → +5 to +15 points
- tonal_voice_shift consistent with voice map → +3 to +10 points
- content_reduction that improves clarity → +2 to +8 points
- content_expansion that adds depth → +5 to +12 points
- structural_reorganization that improves flow → +4 to +12 points
- tone_shift that aligns with voice → +3 to +9 points
- addition that fills a gap → +4 to +10 points
- deletion that removes dead weight → +2 to +7 points
- change that introduces new weakness → -3 to -12 points

CALIBRATION FAILURE: A word refinement that shifts the score by 20+ points is a calibration error.

EVIDENCE REQUIREMENT: Every change to assessment must cite specific text or an observation label.

Respond with a JSON object matching the exact schema provided.`;

// ============================================================================
// JSON PARSING — 4-LEVEL DEFENSIVE PARSING
// ============================================================================

/**
 * 4-level defensive JSON parsing:
 * 1. Direct JSON.parse
 * 2. Extract from code blocks then parse
 * 3. jsonrepair then parse
 * 4. Regex extraction then parse
 */
function parseJson<T>(rawText: string, context: string): T {
  const text = rawText.trim();

  // Level 1: Direct parse
  try {
    return JSON.parse(text) as T;
  } catch {
    // continue
  }

  // Level 2: Extract from code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    } catch {
      // continue
    }
  }

  // Level 3: jsonrepair
  try {
    const repaired = jsonrepair(text);
    return JSON.parse(repaired) as T;
  } catch {
    // continue
  }

  // Level 4: Regex extraction — find outermost JSON object
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const extracted = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(extracted) as T;
    } catch {
      // Try jsonrepair on extracted
      try {
        const repaired = jsonrepair(extracted);
        return JSON.parse(repaired) as T;
      } catch {
        // fall through
      }
    }
  }

  throw new Error(`[FocusedAnalyzer] Failed to parse JSON for ${context}. Raw text length: ${text.length}`);
}

// ============================================================================
// RESPONSE PARSERS
// ============================================================================

function parseUnderstandingDelta(raw: RawUnderstandingDelta): FocusedUnderstandingDelta {
  const safeStringArray = (val: unknown): string[] => {
    if (!Array.isArray(val)) return [];
    return val.filter((x): x is string => typeof x === 'string');
  };

  const ripple = raw.rippleFlags ?? {};

  const validSignificance = ['pivotal', 'contributing', 'transitional'];

  // W2.5: Parse new findings from LLM output
  const newFindings = (() => {
    if (!Array.isArray(raw.newFindings)) return undefined;
    const parsed = (raw.newFindings as Array<Record<string, unknown>>)
      .filter((f): f is Record<string, unknown> =>
        f !== null && typeof f === 'object' && typeof f['claim'] === 'string' && (f['claim'] as string).length > 0
      )
      .map((f) => ({
        claim: String(f['claim']),
        scope: (f['scope'] && typeof f['scope'] === 'object')
          ? {
              type: String((f['scope'] as Record<string, unknown>)['type'] ?? 'sentence'),
              paragraph: Number((f['scope'] as Record<string, unknown>)['paragraph'] ?? 0),
              sentences: Array.isArray((f['scope'] as Record<string, unknown>)['sentences'])
                ? ((f['scope'] as Record<string, unknown>)['sentences'] as unknown[]).map(Number)
                : undefined,
            }
          : { type: 'sentence', paragraph: 0 },
        maturity: typeof f['maturity'] === 'string' ? f['maturity'] : 'hypothesis',
        maturityReasoning: typeof f['maturityReasoning'] === 'string' ? f['maturityReasoning'] : undefined,
        dimensions: Array.isArray(f['dimensions']) ? (f['dimensions'] as unknown[]).map(String) : [],
        evidence: Array.isArray(f['evidence'])
          ? (f['evidence'] as Array<Record<string, unknown>>).map((e) => ({
              text: String(e?.['text'] ?? ''),
              location: (e?.['location'] && typeof e['location'] === 'object')
                ? {
                    paragraph: Number((e['location'] as Record<string, unknown>)['paragraph'] ?? 0),
                    sentence: (e['location'] as Record<string, unknown>)['sentence'] !== undefined
                      ? Number((e['location'] as Record<string, unknown>)['sentence'])
                      : undefined,
                  }
                : undefined,
            }))
          : [],
        deepeningPotential: typeof f['deepeningPotential'] === 'string' ? f['deepeningPotential'] : null,
        raisesQuestions: Array.isArray(f['raisesQuestions']) ? (f['raisesQuestions'] as unknown[]).map(String) : [],
      }));
    return parsed.length > 0 ? parsed : undefined;
  })();

  return {
    updatedPrimaryFunction:
      typeof raw.updatedPrimaryFunction === 'string' && raw.updatedPrimaryFunction.length > 0
        ? raw.updatedPrimaryFunction
        : null,
    updatedSignificance:
      typeof raw.updatedSignificance === 'string' && validSignificance.includes(raw.updatedSignificance)
        ? raw.updatedSignificance as 'pivotal' | 'contributing' | 'transitional'
        : null,
    rippleFlags: {
      beyondSentence: ripple.beyondSentence === true,
      beyondParagraph: ripple.beyondParagraph === true,
      holisticShift: ripple.holisticShift === true,
      specificRipples: safeStringArray(ripple.specificRipples),
      rippleEvidence: typeof ripple.rippleEvidence === 'string' ? ripple.rippleEvidence : '',
    },
    updatedParagraphContribution:
      typeof raw.updatedParagraphContribution === 'string'
        ? raw.updatedParagraphContribution
        : '',
    tensions: safeStringArray(raw.tensions),
    findingEvolutions: parseFindingEvolutions(raw.findingEvolutions),
    newFindings,
  };
}

/**
 * W1.6: Parse finding evolutions from raw LLM output.
 * Validates maturity levels and returns only well-formed entries.
 */
function parseFindingEvolutions(
  raw: unknown,
): FocusedUnderstandingDelta['findingEvolutions'] {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;

  const validMaturities = new Set<string>(['hypothesis', 'developing', 'confirmed', 'deepened', 'superseded']);

  const parsed = raw
    .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
    .map((x) => ({
      findingId: typeof x['findingId'] === 'string' ? x['findingId'] : '',
      newMaturity: typeof x['newMaturity'] === 'string' && validMaturities.has(x['newMaturity'])
        ? x['newMaturity'] as FindingMaturity
        : 'developing' as FindingMaturity,
      reasoning: typeof x['reasoning'] === 'string' ? x['reasoning'] : '',
      supersedes: typeof x['supersedes'] === 'string' ? x['supersedes'] : undefined,
    }))
    .filter((e) => e.findingId.length > 0 && e.reasoning.length > 0);

  return parsed.length > 0 ? parsed : undefined;
}

function parseAnalysisDelta(raw: RawAnalysisDelta): FocusedAnalysisDelta {
  const safeNumber = (val: unknown, fallback: number): number => {
    if (typeof val === 'number' && isFinite(val)) return val;
    return fallback;
  };

  const safeDimensionUpdates = (val: unknown): Record<string, number> => {
    if (!val || typeof val !== 'object' || Array.isArray(val)) return {};
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (typeof v === 'number' && isFinite(v)) {
        result[k] = v;
      }
    }
    return result;
  };

  return {
    effectiveness: Math.max(0, Math.min(100, safeNumber(raw.effectiveness, 50))),
    effectivenessDelta: safeNumber(raw.effectivenessDelta, 0),
    strengthUpdate: typeof raw.strengthUpdate === 'string' ? raw.strengthUpdate : '',
    weaknessUpdate: typeof raw.weaknessUpdate === 'string' ? raw.weaknessUpdate : '',
    paragraphEffectivenessDelta: safeNumber(raw.paragraphEffectivenessDelta, 0),
    dimensionUpdates: safeDimensionUpdates(raw.dimensionUpdates),
  };
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

/**
 * Build the focused understanding update prompt.
 * The EXISTING STATE → CHANGE → DELTA TASK structure forces delta-reasoning.
 */
function buildFocusedUnderstandingPrompt(
  editOutput: EditUnderstandingOutput,
  profile: EssayProfile,
  paragraphIndex: number,
  sentenceIndex: number,
  assembledContext: AssembledProfileContext,
  reanalysisBrief?: ReanalysisBrief,
  findingContext?: string,
): string {
  const para = profile.paragraphs[paragraphIndex];
  const sentence = para?.sentences[sentenceIndex];
  const currentUnderstanding = sentence?.understanding;

  // Phase 2: Show existing primaryFunction + significance instead of observation arrays
  const existingFunction = currentUnderstanding?.primaryFunction ?? '(not yet analyzed)';
  const existingSignificance = currentUnderstanding?.significance ?? 'contributing';

  // Find the changed sentence in the diff
  const paraChange = editOutput.diff.paragraphChanges.find(
    (pc) => pc.paragraphIndex === paragraphIndex,
  );
  const sentenceChange = paraChange?.sentenceChanges.find(
    (sc) => sc.sentenceIndex === sentenceIndex,
  );

  const oldText = sentenceChange?.oldText ?? '[not available]';
  const newText = sentenceChange?.newText ?? '[not available]';

  // Get connection graph context for ripple reasoning
  const connectionsForSentence = profile.index.connectionGraph.filter(
    (entry) =>
      entry.status === 'active' && (
        (entry.from.paragraph === paragraphIndex && entry.from.sentence === sentenceIndex) ||
        (entry.to.paragraph === paragraphIndex && entry.to.sentence === sentenceIndex)
      ),
  );

  const connectionContext =
    connectionsForSentence.length > 0
      ? connectionsForSentence
          .map((c) => {
            const from = c.from.sentence !== undefined ? `P${c.from.paragraph}S${c.from.sentence}` : `P${c.from.paragraph}`;
            const to = c.to.sentence !== undefined ? `P${c.to.paragraph}S${c.to.sentence}` : `P${c.to.paragraph}`;
            return `- ${c.id}: ${from} → ${to} [${c.routingTags.join(',')}] (${c.strengthCategory})`;
          })
          .join('\n')
      : 'No established connections for this sentence.';

  // Conversation context for student intent integration
  const conversationContext = reanalysisBrief?.conversationContext
    ? `\nSTUDENT CONTEXT: "${reanalysisBrief.conversationContext}"\nFactor this into your understanding update. If student intent conflicts with text evidence, flag as TENSIONED.`
    : '';

  // Profile context sections
  const contextSections = assembledContext.sections
    .map((s) => `=== ${s.name.toUpperCase()} ===\n${JSON.stringify(s.content, null, 2)}`)
    .join('\n\n');

  return `${contextSections}

---

FOCUSED UNDERSTANDING UPDATE: P${paragraphIndex}S${sentenceIndex}

EXISTING STATE:
Current primary function: "${existingFunction}" [${existingSignificance}]
Paragraph contribution: "${currentUnderstanding?.paragraphContribution ?? ''}"

CHANGE:
OLD: "${oldText}"
NEW: "${newText}"
Change type: ${editOutput.understanding.changeType}
Change significance: ${editOutput.understanding.significance}
Apparent student purpose: ${editOutput.understanding.apparentPurpose}
${conversationContext}

CONNECTION CONTEXT (for ripple reasoning):
${connectionContext}
${findingContext ? `\nFINDING CONTEXT:\n${findingContext}\nIf the edit confirms, challenges, or deepens any of these findings, include "findingEvolutions" in your output.\n` : ''}
YOUR TASK — DELTA REASONING:
1. Does the edit change this sentence's PRIMARY FUNCTION (its architectural role)? If so, what is the new function?
2. Does the edit change the sentence's SIGNIFICANCE level (pivotal/contributing/transitional)?
3. Which existing FINDINGS ([F] labels above) are confirmed, deepened, or invalidated by the edit?
4. Does the change RIPPLE beyond this sentence? (cite specific connection or mechanism)

BAD EXAMPLE (DO NOT DO THIS):
"This sentence establishes a contemplative tone."
(Fresh analysis — ignores existing understanding, not a delta)

GOOD EXAMPLE:
"The change from 'walked' to 'drifted' shifts the primary function: the sentence no longer
establishes deliberate agency but instead conveys passive drift. [F2]'s claim about the
narrator's relationship to choice is challenged — this version suggests the situation
carried the narrator, not the reverse."

RIPPLE REASONING GUIDE:
For each potential ripple, cite a SPECIFIC mechanism:
- If the connection graph shows a connection affected by the change AND the change alters the connection's basis → beyondSentence: true, cite the connection
- If you cannot cite a specific mechanism in the profile → beyondSentence: false
Anti-fabrication: "If the change is genuinely contained to this sentence with no structural ripple, SAY SO. A false ripple costs $0.05-0.40 in unnecessary escalation."

OUTPUT FORMAT (JSON only, no prose):
{
  "updatedPrimaryFunction": "The new architectural function of this sentence, or null if unchanged",
  "updatedSignificance": "pivotal | contributing | transitional, or null if unchanged",
  "rippleFlags": {
    "beyondSentence": false,
    "beyondParagraph": false,
    "holisticShift": false,
    "specificRipples": [],
    "rippleEvidence": "The change is contained — no connections from this sentence reference the altered element."
  },
  "updatedParagraphContribution": "How this sentence now serves its paragraph's goal...",
  "tensions": [],
  "findingEvolutions": [
    {"findingId": "F1", "newMaturity": "confirmed", "reasoning": "The edit strengthens the evidence for this finding...", "supersedes": null}
  ],
  "newFindings": [
    {
      "claim": "A referenceable claim about the essay revealed by this edit",
      "scope": { "type": "sentence", "paragraph": 0, "sentences": [0] },
      "maturity": "hypothesis",
      "dimensions": ["craft"],
      "evidence": [{ "text": "quoted text from the essay", "location": { "paragraph": 0, "sentence": 0 } }],
      "deepeningPotential": "what further investigation could reveal, or null if self-contained",
      "raisesQuestions": []
    }
  ]
}

IMPORTANT: "newFindings" is OPTIONAL. Only include it if the edit reveals a NEW insight about the essay's architecture, voice, narrative strategy, or craft that was not previously captured. Only include findings that are genuinely new — not restatements of the updated primaryFunction.`;
}

/**
 * Build the focused analysis update prompt.
 * Starts from previous analysis, computes delta based on updated understanding.
 */
function buildFocusedAnalysisPrompt(
  editOutput: EditUnderstandingOutput,
  profile: EssayProfile,
  paragraphIndex: number,
  sentenceIndex: number,
  understandingDelta: FocusedUnderstandingDelta,
  assembledContext: AssembledProfileContext,
  previousAnalysis?: AnalysisPassOutput,
  findingContext?: string,
): string {
  // Get previous sentence analysis
  const prevSentenceAnalysis = previousAnalysis?.sentenceAnalyses.find(
    (sa) => sa.sentenceIndex === sentenceIndex,
  );

  const prevEffectiveness = prevSentenceAnalysis?.effectiveness ?? 50;
  const prevStrength = prevSentenceAnalysis?.strengths.map((s) => s.observation).join('; ') ?? 'None identified';
  const prevWeakness = prevSentenceAnalysis?.weaknesses.map((w) => w.observation).join('; ') ?? 'None identified';
  const prevParagraphEffectiveness = previousAnalysis?.paragraphEffectiveness ?? 50;

  // Profile context sections
  const contextSections = assembledContext.sections
    .map((s) => `=== ${s.name.toUpperCase()} ===\n${JSON.stringify(s.content, null, 2)}`)
    .join('\n\n');

  // Phase 2: Format understanding delta with primaryFunction + findings
  const deltaDescription = [
    understandingDelta.updatedPrimaryFunction
      ? `PRIMARY FUNCTION CHANGED: "${understandingDelta.updatedPrimaryFunction}"`
      : null,
    understandingDelta.updatedSignificance
      ? `SIGNIFICANCE CHANGED TO: ${understandingDelta.updatedSignificance}`
      : null,
    understandingDelta.findingEvolutions && understandingDelta.findingEvolutions.length > 0
      ? `FINDING EVOLUTIONS: ${understandingDelta.findingEvolutions.map((fe) => `${fe.findingId} → ${fe.newMaturity} (${fe.reasoning})`).join('; ')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `${contextSections}

---

FOCUSED ANALYSIS UPDATE: P${paragraphIndex}S${sentenceIndex}

PREVIOUS ANALYSIS:
effectiveness: ${prevEffectiveness}/100
strengths: "${prevStrength}"
weaknesses: "${prevWeakness}"
paragraph effectiveness: ${prevParagraphEffectiveness}/100

UPDATED UNDERSTANDING (from Step 1):
${deltaDescription || 'No understanding changes — understanding is stable.'}
Updated paragraph contribution: "${understandingDelta.updatedParagraphContribution}"

Change type: ${editOutput.understanding.changeType}
Change significance: ${editOutput.understanding.significance}
${findingContext ? `\n${findingContext}\n` : ''}
RE-EVALUATE based on the updated understanding:

CALIBRATION ANCHORS:
- word_refinement that resolves a weakness → +3 to +8 points
- meaning_evolution that introduces new depth → +5 to +15 points
- tonal_voice_shift consistent with voice map → +3 to +10 points
- content_reduction that improves clarity → +2 to +8 points
- content_expansion that adds depth → +5 to +12 points
- structural_reorganization that improves flow → +4 to +12 points
- tone_shift that aligns with voice → +3 to +9 points
- addition that fills a gap → +4 to +10 points
- deletion that removes dead weight → +2 to +7 points
- change that introduces new weakness → -3 to -12 points

CALIBRATION FAILURE: A word refinement shifting score by 20+ points is an error.

EVIDENCE REQUIREMENT: Every assessment change must cite specific text or observation label.

OUTPUT FORMAT (JSON only, no prose):
{
  "effectiveness": 75,
  "effectivenessDelta": 3,
  "strengthUpdate": "Specific strength observed in new text...",
  "weaknessUpdate": "Updated weakness assessment (or 'Resolved: [previous weakness]')...",
  "paragraphEffectivenessDelta": 2,
  "dimensionUpdates": {}
}`;
}

// ============================================================================
// COST TRACKING HELPER
// ============================================================================

function buildLayerCost(
  layer: string,
  response: ClaudeResponse<unknown>,
  startTime: number,
): LayerCost {
  const cost = calculateCost(response.usage, SONNET);
  const tokenUsage: TokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
  };
  return {
    layer,
    cost,
    tokenUsage,
    timingMs: Date.now() - startTime,
  };
}

// ============================================================================
// FOCUSED ANALYZER CLASS
// ============================================================================

export class FocusedAnalyzer {
  // ─────────────────────────────────────────────────────────────────────────
  // MODE SELECTION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Select whether to run focused or comprehensive re-analysis.
   *
   * Decision logic (first matching condition wins):
   * 1. initial confidence → comprehensive (no profile to leverage)
   * 2. developing confidence → comprehensive (profile too thin for focused)
   * 3. paragraphs reordered → comprehensive (full re-walk needed)
   * 4. paragraphs added or removed → comprehensive (new/deleted paragraphs need full pipeline)
   * 5. transformative significance → comprehensive
   * 6. scope recommendation = comprehensive → comprehensive
   * 7. Otherwise → focused
   *
   * Key insight: A 50% text change that preserves paragraph function → focused.
   * A 3% change that shifts thesis → comprehensive.
   */
  static selectAnalysisMode(
    editOutput: EditUnderstandingOutput,
    profile: EssayProfile,
  ): 'focused' | 'comprehensive' {
    const { confidenceLevel } = profile.index;
    const { diff, understanding } = editOutput;

    // Rule 1: No profile to leverage
    if (confidenceLevel === 'initial') {
      console.log('[FocusedAnalyzer] Mode: comprehensive — confidence=initial (no profile to leverage)');
      return 'comprehensive';
    }

    // Rule 2: Profile too thin
    if (confidenceLevel === 'developing') {
      console.log('[FocusedAnalyzer] Mode: comprehensive — confidence=developing (profile too thin for focused)');
      return 'comprehensive';
    }

    // Rule 3: Structural reorder = full re-walk needed
    if (diff.structural.paragraphsReordered) {
      console.log('[FocusedAnalyzer] Mode: comprehensive — paragraphs reordered');
      return 'comprehensive';
    }

    // Rule 4: New or deleted paragraphs need full pipeline
    if (
      diff.structural.paragraphsAdded.length > 0 ||
      diff.structural.paragraphsRemoved.length > 0
    ) {
      console.log(
        `[FocusedAnalyzer] Mode: comprehensive — paragraphs added (${diff.structural.paragraphsAdded.length}) or removed (${diff.structural.paragraphsRemoved.length})`,
      );
      return 'comprehensive';
    }

    // Rule 5: Transformative change, guarded by structural scope.
    // LLM sometimes over-labels a small same-paragraph rewrite as
    // transformative (piano-essay: P1 replaced with a new scene; 7→7
    // paragraphs; role unchanged). Rules 3-4 already caught reorder /
    // add / remove, so we know structural shape is preserved here. When
    // ≤2 paragraphs actually changed, trust the diff over the LLM label
    // and route to focused — the Level 3 escalation ladder handles the
    // rare case where a small transformative edit genuinely needs a
    // comprehensive rebuild.
    if (understanding.significance === 'transformative') {
      const changedCount = diff.paragraphChanges.length;
      if (changedCount > 0 && changedCount <= 2) {
        console.log(
          `[FocusedAnalyzer] Mode: focused — significance=transformative but only ${changedCount} paragraph(s) changed (guardrail)`,
        );
        return 'focused';
      }
      console.log('[FocusedAnalyzer] Mode: comprehensive — significance=transformative');
      return 'comprehensive';
    }

    // Rule 6: Scope recommendation says comprehensive
    if (understanding.scopeRecommendation.scope === 'comprehensive') {
      console.log('[FocusedAnalyzer] Mode: comprehensive — scope recommendation=comprehensive');
      return 'comprehensive';
    }

    // Rule 6b: Targeted holistic refresh → focused (Level 3 escalation path handles holistic refresh)
    // Returning 'comprehensive' would bypass the escalation ladder that is specifically designed
    // for this case; only truly comprehensive-scope edits should return 'comprehensive'.
    if (understanding.scopeRecommendation.scope === 'targeted_holistic_refresh') {
      console.log(
        '[FocusedAnalyzer] Mode: focused — scope recommendation=targeted_holistic_refresh (Level 3 escalation will handle holistic refresh)',
      );
      return 'focused';
    }

    // Rule 7: Default to focused
    console.log(
      `[FocusedAnalyzer] Mode: focused — confidence=${confidenceLevel}, significance=${understanding.significance}, scope=${understanding.scopeRecommendation.scope}`,
    );
    return 'focused';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN ENTRY POINT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Run the 4-step focused analysis pipeline.
   *
   * Step 1: Focused Understanding Update (Sonnet, delta-reasoning)
   * Step 2: Focused Analysis Update (Sonnet, change-type-aware calibration)
   * Step 3: Escalation Ladder (conditional ripple handling)
   * Step 4: Phase Re-computation (if paragraph analysis changed)
   */
  async runFocusedAnalysis(
    editOutput: EditUnderstandingOutput,
    profile: EssayProfile,
    coordinator: EssayProfileCoordinator,
    router: ProfileRouter,
    reanalysisBrief?: ReanalysisBrief,
  ): Promise<FocusedAnalysisResult> {
    const overallStart = Date.now();
    const costs: LayerCost[] = [];

    // [D-1.12 Commit B 2026-04-29] failedSteps + escalationLevelTrustworthy
    // are populated as catches fire. Default trustworthy=true; set to
    // false on any catch path. The orchestrator reads these and emits
    // telemetry per failed step (it has essayId in scope; this layer
    // does not).
    const failedSteps: FocusedAnalysisResult['failedSteps'] = [];

    // Identify all changed sentences from the diff; use the most impactful (first) for focused pipeline
    const changedSentences = this.identifyChangedSentences(editOutput);
    const { paragraphIndex, sentenceIndex } = changedSentences[0] ?? { paragraphIndex: 0, sentenceIndex: 0 };

    console.log(
      `[FocusedAnalyzer] Starting focused analysis — P${paragraphIndex}S${sentenceIndex}, ` +
        `changeType=${editOutput.understanding.changeType}, significance=${editOutput.understanding.significance}`,
    );

    // ───────────────────────────────────────────────────────────────────────
    // STEP 1: Focused Understanding Update
    // ───────────────────────────────────────────────────────────────────────

    let understandingDelta: FocusedUnderstandingDelta | null = null;

    try {
      const step1Start = Date.now();

      // Assemble context via router
      const understandingContext = router.assembleContext(profile, {
        rule: 'focused_understanding',
        paragraphIndex,
        sentenceIndex,
        editContext: {
          diff: editOutput.diff,
          changedParagraphs: editOutput.diff.paragraphChanges.map((pc) => pc.paragraphIndex),
          stalenessSnapshot: {
            strongCount: profile.index.stalenessSnapshot.strongStale.length,
            moderateCount: profile.index.stalenessSnapshot.moderateStale.length,
            weakCount: profile.index.stalenessSnapshot.weakStale.length,
            strongEntries: [],
            moderateEntries: [],
          },
        },
      });

      // W1.6: Build finding context for the affected paragraph when coordinator has findings
      const findingContextForPrompt = coordinator.getFindingStore().size > 0
        ? buildParagraphFindingContext(coordinator.getFindingStore(), paragraphIndex)
        : undefined;

      const understandingPrompt = buildFocusedUnderstandingPrompt(
        editOutput,
        profile,
        paragraphIndex,
        sentenceIndex,
        understandingContext,
        reanalysisBrief,
        findingContextForPrompt || undefined,
      );

      console.log(`[FocusedAnalyzer] Step 1: Calling Sonnet for understanding delta (~${Math.round(understandingPrompt.length / 4)} estimated input tokens)`);

      const step1Response: ClaudeResponse<string> = await callClaudeWithRetry<string>(
        {
          model: SONNET,
          systemPrompt: FOCUSED_UNDERSTANDING_SYSTEM_PROMPT,
          userPrompt: understandingPrompt,
          maxTokens: FOCUSED_MAX_TOKENS,
          temperature: FOCUSED_TEMPERATURE,
          timeoutMs: FOCUSED_TIMEOUT_MS,
          useJsonMode: false,
          cacheSystemPrompt: true,
        },
      );

      const step1Cost = buildLayerCost('focused_understanding', step1Response, step1Start);
      costs.push(step1Cost);

      console.log(
        `[FocusedAnalyzer] Step 1 complete — $${step1Cost.cost.toFixed(4)}, ${step1Cost.timingMs}ms`,
      );

      // Parse the understanding delta
      const rawText =
        typeof step1Response.content === 'string'
          ? step1Response.content
          : JSON.stringify(step1Response.content);

      const rawDelta = parseJson<RawUnderstandingDelta>(rawText, 'understanding delta');
      understandingDelta = parseUnderstandingDelta(rawDelta);

      console.log(
        `[FocusedAnalyzer] Understanding delta — ` +
          `primaryFunction: ${understandingDelta.updatedPrimaryFunction ? 'changed' : 'unchanged'}, ` +
          `significance: ${understandingDelta.updatedSignificance ?? 'unchanged'}, ` +
          `findingEvolutions: ${understandingDelta.findingEvolutions?.length ?? 0}, ` +
          `beyondSentence: ${understandingDelta.rippleFlags.beyondSentence}`,
      );

      // W1.6: Process finding evolutions through the coordinator's FindingStore
      if (understandingDelta.findingEvolutions && understandingDelta.findingEvolutions.length > 0) {
        const findingStore = coordinator.getFindingStore();
        for (const evo of understandingDelta.findingEvolutions) {
          try {
            if (findingStore.has(evo.findingId)) {
              findingStore.updateMaturity(
                evo.findingId,
                evo.newMaturity,
                evo.reasoning,
                `focused_edit_P${paragraphIndex}S${sentenceIndex}`,
                evo.supersedes,
              );
              console.log(
                `[FocusedAnalyzer] Finding evolution: ${evo.findingId} → ${evo.newMaturity}`,
              );
            } else {
              console.warn(
                `[FocusedAnalyzer] Finding evolution skipped — ${evo.findingId} not found in store`,
              );
            }
          } catch (err) {
            console.error(
              `[FocusedAnalyzer] Finding evolution failed for ${evo.findingId}:`,
              err instanceof Error ? err.message : String(err),
            );
          }
        }
      }

      // W2.5: Process new findings through FindingStore
      if (understandingDelta.newFindings && understandingDelta.newFindings.length > 0) {
        const findingStore = coordinator.getFindingStore();
        let addedCount = 0;
        for (const nf of understandingDelta.newFindings) {
          try {
            const id = findingStore.generateId();
            const now = new Date().toISOString();

            // Map scope type string to FindingScope type union
            const scopeType = (['word', 'sentence', 'sentence_group', 'paragraph', 'cross_paragraph', 'essay_level'] as const)
              .find((t) => t === nf.scope.type) ?? 'sentence';

            findingStore.add({
              id,
              claim: nf.claim,
              scope: {
                type: scopeType,
                paragraph: nf.scope.paragraph,
                sentences: nf.scope.sentences,
                textEvidence: nf.evidence.map((e) => ({
                  text: e.text,
                  location: e.location ?? { paragraph: nf.scope.paragraph },
                })),
              },
              maturity: (['hypothesis', 'developing', 'confirmed', 'deepened', 'superseded'] as const)
                .find((m) => m === nf.maturity) ?? 'hypothesis',
              maturityReasoning: nf.maturityReasoning ?? `New finding from edit reanalysis at P${paragraphIndex}S${sentenceIndex}`,
              coachingValue: 'medium',
              dimensions: nf.dimensions.filter((d): d is import('../profileTypes').HolisticDimension =>
                ['voice', 'emotion', 'theme', 'narrative', 'character', 'craft', 'admissions', 'structure'].includes(d),
              ),
              evidence: nf.evidence.map((e) => ({
                text: e.text,
                location: e.location,
                type: 'present' as const,
              })),
              deepeningPotential: nf.deepeningPotential,
              raisesQuestions: nf.raisesQuestions,
              source: 'edit_reanalysis',
              lineage: [],
              buildsOn: [],
              relatedTo: [],
              createdAt: now,
              lastUpdated: now,
            });
            addedCount++;
          } catch (e) {
            console.warn(
              `[FocusedAnalyzer] Failed to add new finding: ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        }
        if (addedCount > 0) {
          console.log(`[FocusedAnalyzer] Added ${addedCount} new findings from edit reanalysis`);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[FocusedAnalyzer] Step 1 (understanding delta) failed: ${errorMsg}`);
      // [D-1.12 Commit B 2026-04-29] Pre-fix this catch hardcoded
      // escalationLevel: 1 (semantically "no ripple") — indistinguishable
      // from a real "Step 1 succeeded with no ripple" outcome. F-1 had
      // just wired this field into IterationRecord, so the catch was
      // feeding a load-bearing audit field with a hardcoded lie. Now we
      // mark the result untrustworthy so the orchestrator passes
      // undefined (not 1) to triggerReanalysis, and emits telemetry.
      failedSteps.push('step1_understanding');
      return {
        mode: 'focused',
        escalationLevel: 1,
        updatedParagraphIndex: paragraphIndex,
        updatedSentenceIndex: sentenceIndex,
        understandingDelta: null,
        analysisDelta: null,
        phaseUpdate: null,
        cost: costs,
        totalCost: costs.reduce((acc, c) => acc + c.cost, 0),
        escalationLevelTrustworthy: false,
        failedSteps,
      };
    }

    // ───────────────────────────────────────────────────────────────────────
    // STEP 2: Focused Analysis Update
    // Only runs if Step 1 produced understanding changes
    // ───────────────────────────────────────────────────────────────────────

    let analysisDelta: FocusedAnalysisDelta | null = null;

    const hasUnderstandingChanges =
      understandingDelta.updatedPrimaryFunction !== null ||
      understandingDelta.updatedSignificance !== null ||
      (understandingDelta.findingEvolutions && understandingDelta.findingEvolutions.length > 0) ||
      understandingDelta.updatedParagraphContribution.length > 0;

    if (hasUnderstandingChanges) {
      try {
        const step2Start = Date.now();

        // Assemble context via router
        const analysisContext = router.assembleContext(profile, {
          rule: 'focused_analysis',
          paragraphIndex,
          editContext: {
            diff: editOutput.diff,
            changedParagraphs: editOutput.diff.paragraphChanges.map((pc) => pc.paragraphIndex),
            stalenessSnapshot: {
              strongCount: profile.index.stalenessSnapshot.strongStale.length,
              moderateCount: profile.index.stalenessSnapshot.moderateStale.length,
              weakCount: profile.index.stalenessSnapshot.weakStale.length,
              strongEntries: [],
              moderateEntries: [],
            },
          },
        });

        // W2.5: Build finding context for the analysis prompt
        const analysisFindingContext = coordinator.getFindingStore().size > 0
          ? buildAnnotationFindingContext(coordinator.getFindingStore(), paragraphIndex)
          : undefined;

        const analysisPrompt = buildFocusedAnalysisPrompt(
          editOutput,
          profile,
          paragraphIndex,
          sentenceIndex,
          understandingDelta,
          analysisContext,
          reanalysisBrief?.previousAnalysis,
          analysisFindingContext || undefined,
        );

        console.log(`[FocusedAnalyzer] Step 2: Calling Sonnet for analysis delta (~${Math.round(analysisPrompt.length / 4)} estimated input tokens)`);

        const step2Response: ClaudeResponse<string> = await callClaudeWithRetry<string>(
          {
            model: SONNET,
            systemPrompt: FOCUSED_ANALYSIS_SYSTEM_PROMPT,
            userPrompt: analysisPrompt,
            maxTokens: FOCUSED_MAX_TOKENS,
            temperature: FOCUSED_TEMPERATURE,
            timeoutMs: FOCUSED_TIMEOUT_MS,
            useJsonMode: false,
            cacheSystemPrompt: true,
          },
        );

        const step2Cost = buildLayerCost('focused_analysis', step2Response, step2Start);
        costs.push(step2Cost);

        console.log(
          `[FocusedAnalyzer] Step 2 complete — $${step2Cost.cost.toFixed(4)}, ${step2Cost.timingMs}ms`,
        );

        // Parse the analysis delta
        const rawText =
          typeof step2Response.content === 'string'
            ? step2Response.content
            : JSON.stringify(step2Response.content);

        const rawDelta = parseJson<RawAnalysisDelta>(rawText, 'analysis delta');
        analysisDelta = parseAnalysisDelta(rawDelta);

        console.log(
          `[FocusedAnalyzer] Analysis delta — effectiveness: ${analysisDelta.effectiveness} (Δ${analysisDelta.effectivenessDelta > 0 ? '+' : ''}${analysisDelta.effectivenessDelta}), ` +
            `paragraph Δ${analysisDelta.paragraphEffectivenessDelta > 0 ? '+' : ''}${analysisDelta.paragraphEffectivenessDelta}`,
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[FocusedAnalyzer] Step 2 (analysis delta) failed: ${errorMsg}`);
        // [D-1.12 Commit B 2026-04-29] Pre-fix returned escalationLevel: 1
        // (hardcoded), indistinguishable from "no understanding changes
        // detected, skipped Step 2". Now: mark untrustworthy, signal the
        // orchestrator to emit telemetry + pass undefined to the
        // IterationRecord wire.
        failedSteps.push('step2_analysis');
        return {
          mode: 'focused',
          escalationLevel: 1,
          updatedParagraphIndex: paragraphIndex,
          updatedSentenceIndex: sentenceIndex,
          understandingDelta,
          analysisDelta: null,
          phaseUpdate: null,
          cost: costs,
          totalCost: costs.reduce((acc, c) => acc + c.cost, 0),
          escalationLevelTrustworthy: false,
          failedSteps,
        };
      }
    } else {
      console.log('[FocusedAnalyzer] Step 2 skipped — no understanding changes detected');
    }

    // ───────────────────────────────────────────────────────────────────────
    // STEP 3: Escalation Ladder
    //
    // Each level executes its work, then RE-EVALUATES ripple flags from the
    // actual result (not the original delta) to decide if upgrade is needed.
    // This prevents dead-code inner checks that are always false.
    // ───────────────────────────────────────────────────────────────────────

    let escalationLevel: 1 | 2 | 3 | 4 = 1;
    // Guard against double holistic synthesis across Level 3 branch and Level 2→3 upgrade block
    let synthesisCompleted = false;

    // Level 1: No ripple — done
    if (!understandingDelta.rippleFlags.beyondSentence) {
      console.log('[FocusedAnalyzer] Escalation: Level 1 — change contained to sentence');
      escalationLevel = 1;
    }
    // Level 2: Ripple beyond sentence → paragraph re-walk
    else if (!understandingDelta.rippleFlags.beyondParagraph) {
      escalationLevel = 2;
      console.log(
        `[FocusedAnalyzer] Escalation: Level 2 — paragraph re-walk for P${paragraphIndex}. ` +
          `Evidence: ${understandingDelta.rippleFlags.rippleEvidence}`,
      );

      try {
        const level2Start = Date.now();
        // Re-walk the affected paragraph — capture result to track cost and check new ripple flags
        const walkResult = await sequentialDeepWalkService.walkEssay(
          this.buildEssayTextFromProfile(profile),
          profile,
          this.buildMinimalStructuralMap(profile),
          null,
          [],
          { startFromParagraph: paragraphIndex },
        );
        const level2Ms = Date.now() - level2Start;
        console.log(
          `[FocusedAnalyzer] Level 2 re-walk complete — ${level2Ms}ms, cost=$${walkResult.cost.toFixed(4)}`,
        );

        // Track walk cost
        costs.push({
          layer: 'focused_escalation_l2_walk',
          cost: walkResult.cost,
          tokenUsage: walkResult.tokenUsage,
          timingMs: level2Ms,
        });

        // Re-evaluate from walk result: if walk revealed new cross-paragraph connections,
        // upgrade to Level 3. The walk mutates profile in-place, so we check whether
        // holistic synthesis now needs updating (evidenced by holisticEvolution changes).
        const newBeyondParagraph =
          (walkResult.holisticEvolution.centralThesis !== undefined) ||
          (walkResult.backPropagations.some((bp) => bp.paragraph !== paragraphIndex));
        const newHolisticShift = walkResult.skippedParagraphs.length === 0 &&
          Object.values(walkResult.holisticEvolution).some((v) => v !== undefined);

        if (newBeyondParagraph || newHolisticShift) {
          // Upgrade to Level 3 — holistic refresh needed
          escalationLevel = 3;
          console.log('[FocusedAnalyzer] Level 2→3 upgrade — re-walk revealed beyond-paragraph ripple');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[FocusedAnalyzer] Level 2 paragraph re-walk failed: ${errorMsg}`);
        // [D-1.12 Commit B] Pre-fix this catch left escalationLevel at 2
        // with stale walk data — IterationRecord would then claim "Level 2
        // re-walk completed" when it actually crashed mid-flight. Mark
        // untrustworthy. Caller passes undefined to the audit field.
        failedSteps.push('level2_rewalk');
      }
    }
    // Level 3: Ripple beyond paragraph → targeted holistic refresh
    else if (!understandingDelta.rippleFlags.holisticShift) {
      escalationLevel = 3;
      console.log(
        `[FocusedAnalyzer] Escalation: Level 3 — targeted holistic refresh. ` +
          `Evidence: ${understandingDelta.rippleFlags.rippleEvidence}`,
      );

      try {
        const level3Start = Date.now();
        // Run targeted holistic refresh for affected sections
        const essayText = this.buildEssayTextFromProfile(profile);
        const synthesisResult = await holisticSynthesisService.synthesize({
          essayText,
          profile,
          holisticEvolution: {
            centralThesis: undefined,
            thesisConfidence: undefined,
            voiceSignature: undefined,
            arcMomentum: undefined,
          },
        });
        synthesisCompleted = true;

        // W0.1 FIX: Apply synthesis result to coordinator BEFORE escalation check.
        // Previously this was dead code — synthesis ran but result was discarded.
        coordinator.applyHolisticSynthesis(synthesisResult.synthesis);

        const level3Ms = Date.now() - level3Start;
        console.log(
          `[FocusedAnalyzer] Level 3 holistic refresh complete — ${level3Ms}ms, cost=$${synthesisResult.cost.toFixed(4)}`,
        );

        // Track synthesis cost
        costs.push({
          layer: 'focused_escalation_l3_holistic',
          cost: synthesisResult.cost,
          tokenUsage: synthesisResult.tokenUsage,
          timingMs: level3Ms,
        });

        // Re-evaluate from synthesis result: if synthesis indicates the holistic shift
        // is significant enough to warrant a full re-pass, upgrade to Level 4.
        const newHolisticShift = !synthesisResult.isComplete || synthesisResult.missingSections.length > 0;
        if (newHolisticShift) {
          escalationLevel = 4;
          console.log('[FocusedAnalyzer] Level 3→4 upgrade — synthesis incomplete, signaling comprehensive re-analysis');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[FocusedAnalyzer] Level 3 holistic refresh failed: ${errorMsg}`);
        // [D-1.12 Commit B] Same shape as Level 2 — escalationLevel stays
        // at 3 with no synthesis applied. Mark untrustworthy.
        failedSteps.push('level3_holistic');
      }
    }
    // Level 4: Holistic shift from initial delta → escalate to comprehensive immediately
    else {
      escalationLevel = 4;
      console.log(
        '[FocusedAnalyzer] Escalation: Level 4 — holistic shift detected, signaling comprehensive re-analysis',
      );
    }

    // If Level 2 was executed but then upgraded to Level 3 during the re-evaluation,
    // run the Level 3 holistic refresh now (if we haven't yet).
    if (escalationLevel === 3 && understandingDelta.rippleFlags.beyondSentence && !understandingDelta.rippleFlags.beyondParagraph) {
      // We arrived here from a Level 2 upgrade — run holistic synthesis only if not already done
      if (!synthesisCompleted) {
        console.log('[FocusedAnalyzer] Escalation: Level 3 (from Level 2 upgrade) — running holistic refresh');
        try {
          const level3UpgradeStart = Date.now();
          const essayText = this.buildEssayTextFromProfile(profile);
          const synthesisResult = await holisticSynthesisService.synthesize({
            essayText,
            profile,
            holisticEvolution: {
              centralThesis: undefined,
              thesisConfidence: undefined,
              voiceSignature: undefined,
              arcMomentum: undefined,
            },
          });
          synthesisCompleted = true;

          // W0.1 FIX: Apply synthesis result to coordinator (Level 2→3 upgrade path).
          coordinator.applyHolisticSynthesis(synthesisResult.synthesis);

          const level3UpgradeMs = Date.now() - level3UpgradeStart;
          costs.push({
            layer: 'focused_escalation_l3_upgrade_holistic',
            cost: synthesisResult.cost,
            tokenUsage: synthesisResult.tokenUsage,
            timingMs: level3UpgradeMs,
          });
          console.log(`[FocusedAnalyzer] Level 3 upgrade holistic refresh complete — ${level3UpgradeMs}ms`);
          if (!synthesisResult.isComplete || synthesisResult.missingSections.length > 0) {
            escalationLevel = 4;
            console.log('[FocusedAnalyzer] Level 3→4 upgrade (from L2 path) — synthesis incomplete');
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[FocusedAnalyzer] Level 3 upgrade holistic refresh failed: ${errorMsg}`);
          // [D-1.12 Commit B] Level 2→3 upgrade synthesis catch.
          failedSteps.push('l2_to_l3_upgrade');
        }
      } else {
        console.log('[FocusedAnalyzer] Level 3 (from Level 2 upgrade) — holistic synthesis already completed, skipping duplicate call');
      }
    }

    // ───────────────────────────────────────────────────────────────────────
    // PRE-MUTATION SNAPSHOT
    //
    // Before applying any deltas, snapshot the affected sentence/paragraph
    // state. If the escalation ladder later promotes us from Level 2→3→4,
    // the comprehensive pipeline will rebuild from scratch anyway. But if
    // a delta application fails mid-way through, we can restore the snapshot
    // to prevent the profile from being left in an inconsistent state.
    // ───────────────────────────────────────────────────────────────────────

    const preMutationSnapshot = escalationLevel < 4
      ? (() => {
          try {
            const para = profile.paragraphs[paragraphIndex];
            const sentence = para?.sentences[sentenceIndex];
            return {
              sentenceUnderstanding: sentence?.understanding
                ? JSON.parse(JSON.stringify(sentence.understanding)) as typeof sentence.understanding
                : null,
              paragraphUnderstanding: para?.understanding
                ? JSON.parse(JSON.stringify(para.understanding)) as typeof para.understanding
                : null,
              paragraphAnalysis: para?.analysis
                ? JSON.parse(JSON.stringify(para.analysis)) as typeof para.analysis
                : null,
              sentenceAnalysis: sentence?.analysis
                ? JSON.parse(JSON.stringify(sentence.analysis)) as typeof sentence.analysis
                : null,
            };
          } catch {
            console.warn('[FocusedAnalyzer] Failed to create pre-mutation snapshot — proceeding without rollback safety');
            // [D-1.12 Commit B] Pre-mutation snapshot disabled silently;
            // subsequent restore branches will skip with no signal. Mark
            // failed so orchestrator knows rollback safety was lost.
            failedSteps.push('snapshot_creation');
            return null;
          }
        })()
      : null;

    // ───────────────────────────────────────────────────────────────────────
    // APPLY DELTAS TO COORDINATOR
    //
    // The understanding delta contains new/confirmed/invalidated observations
    // for the edited sentence. The analysis delta contains updated effectiveness
    // scores and strength/weakness assessments. Both must be applied to the
    // coordinator so the profile reflects the focused re-analysis results.
    //
    // We only apply when NOT escalating to comprehensive (Level 4), because
    // comprehensive re-analysis will rebuild the entire profile from scratch.
    // ───────────────────────────────────────────────────────────────────────

    if (escalationLevel < 4) {
      // Apply understanding delta: update sentence-level observations on the profile
      // and use coordinator.applyLightTouchUpdate() to trigger staleness + index recomputation.
      //
      // We don't use coordinator.applyUnderstandingWalkStep() here because focused mode
      // produces a DELTA (partial observation updates), not a full walk output. The coordinator
      // expects a complete UnderstandingWalkOutput with full supersession semantics.
      // Instead, we directly merge the delta into the profile's sentence understanding
      // (the profile object is the same reference the coordinator wraps) and then signal
      // the coordinator via applyLightTouchUpdate to propagate staleness + reindex.
      if (understandingDelta !== null) {
        try {
          const para = profile.paragraphs[paragraphIndex];
          const sentence = para?.sentences[sentenceIndex];
          if (sentence) {
            // Phase 2: Apply primaryFunction + significance updates directly
            if (!sentence.understanding) {
              sentence.understanding = {
                observedFunctions: [],
                inferredIntents: [],
                narrativeContributions: [],
                rhetoricalFunctions: [],
                paragraphContribution: '',
                craft: { rhythm: '', techniques: [] },
                significantChoices: [],
                connectionRefs: [],
                findingRefs: [],
                tags: [],
              };
            }

            if (understandingDelta.updatedPrimaryFunction !== null) {
              sentence.understanding.primaryFunction = understandingDelta.updatedPrimaryFunction;
              // Bridge: update observedFunctions for consumers not yet migrated
              sentence.understanding.observedFunctions = [{
                observation: understandingDelta.updatedPrimaryFunction,
                confidence: 1.0,
                evidence: '(derived from primaryFunction)',
              }];
              sentence.understanding.paragraphContribution = understandingDelta.updatedPrimaryFunction;
            }
            if (understandingDelta.updatedSignificance !== null) {
              sentence.understanding.significance = understandingDelta.updatedSignificance;
            }
            if (understandingDelta.updatedParagraphContribution) {
              sentence.understanding.paragraphContribution = understandingDelta.updatedParagraphContribution;
            }

            // Update paragraph-level narrativeContribution if the delta provides one
            if (understandingDelta.updatedParagraphContribution && para.understanding) {
              para.understanding.narrativeContribution = understandingDelta.updatedParagraphContribution;
            }

            // Signal the coordinator to propagate staleness and recompute the index.
            // The 'staleness_application' type triggers recomputeIndex() and marks
            // downstream sections as needing refresh (holistic, analysis, etc.)
            coordinator.applyLightTouchUpdate({
              type: 'staleness_application',
              stalenessMarkers: [{
                target: { type: 'sentence', paragraph: paragraphIndex, sentence: sentenceIndex },
                strength: understandingDelta.rippleFlags.beyondParagraph ? 'strong' : 'moderate',
                reason: `Focused understanding delta: primaryFunction=${understandingDelta.updatedPrimaryFunction ? 'changed' : 'unchanged'}, findingEvolutions=${understandingDelta.findingEvolutions?.length ?? 0}`,
              }],
            });

            console.log(
              `[FocusedAnalyzer] Applied understanding delta to coordinator: ` +
                `P${paragraphIndex}S${sentenceIndex} — ` +
                `functions=${mergedFunctions.length}, intents=${mergedIntents.length}, ` +
                `narrative=${mergedNarrative.length}, invalidated=${invalidatedIndices.size}`,
            );
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[FocusedAnalyzer] Failed to apply understanding delta to coordinator: ${errorMsg}`);
          // [D-1.12 Commit B] Profile mutation failed; result claims a
          // delta was produced but coordinator state may not reflect it.
          failedSteps.push('understanding_delta_apply');
          // Restore pre-mutation snapshot to prevent inconsistent profile state
          if (preMutationSnapshot) {
            try {
              const para = profile.paragraphs[paragraphIndex];
              const sentence = para?.sentences[sentenceIndex];
              if (sentence && preMutationSnapshot.sentenceUnderstanding) {
                sentence.understanding = preMutationSnapshot.sentenceUnderstanding;
              }
              if (para && preMutationSnapshot.paragraphUnderstanding) {
                para.understanding = preMutationSnapshot.paragraphUnderstanding;
              }
              console.log('[FocusedAnalyzer] Restored pre-mutation snapshot after understanding delta failure');
            } catch (restoreErr) {
              console.error('[FocusedAnalyzer] Failed to restore snapshot:', restoreErr);
              // [D-1.12 Commit B] Doubly-broken state silently swallowed.
              failedSteps.push('understanding_delta_restore');
            }
          }
        }
      }

      // Apply analysis delta via coordinator.applyAnalysisPassResult()
      // This method takes an explicit paragraphIndex and handles staleness + index recomputation.
      if (analysisDelta !== null) {
        try {
          const existingSentence = profile.paragraphs[paragraphIndex]?.sentences[sentenceIndex];
          const existingAnalysis = existingSentence?.analysis;
          const existingParagraphAnalysis = profile.paragraphs[paragraphIndex]?.analysis;

          // Build sentence analysis entry for the affected sentence
          const sentenceAnalysisEntry = {
            sentenceIndex,
            effectiveness: analysisDelta.effectiveness,
            effectivenessReasoning: existingAnalysis?.effectivenessReasoning ?? '',
            strengths: analysisDelta.strengthUpdate
              ? [{ observation: analysisDelta.strengthUpdate, evidence: '', confidence: 0.8 } as ObservationEntry]
              : (existingAnalysis?.strengths ?? []),
            weaknesses: analysisDelta.weaknessUpdate
              ? [{ observation: analysisDelta.weaknessUpdate, evidence: '', confidence: 0.8 } as ObservationEntry]
              : (existingAnalysis?.weaknesses ?? []),
            isStrength: analysisDelta.effectiveness >= 70,
            isProblem: analysisDelta.effectiveness < 40,
            priorityForImprovement: existingAnalysis?.priorityForImprovement ?? (analysisDelta.effectiveness < 50 ? 3 : 1),
          };

          // Compute updated paragraph effectiveness by applying the delta
          const baseParagraphEffectiveness = existingParagraphAnalysis?.effectiveness ?? 50;
          const updatedParagraphEffectiveness = Math.max(
            0,
            Math.min(100, baseParagraphEffectiveness + analysisDelta.paragraphEffectivenessDelta),
          );

          const syntheticAnalysisOutput: AnalysisPassOutput = {
            paragraphIndex,
            sentenceAnalyses: [sentenceAnalysisEntry],
            paragraphEffectiveness: updatedParagraphEffectiveness,
            paragraphVerdict: existingParagraphAnalysis?.verdict ?? '',
            holisticAnalysisEvolution: {},
          };

          coordinator.applyAnalysisPassResult(syntheticAnalysisOutput);

          console.log(
            `[FocusedAnalyzer] Applied analysis delta to coordinator: ` +
              `P${paragraphIndex}S${sentenceIndex} — ` +
              `effectiveness=${analysisDelta.effectiveness}, ` +
              `paragraphΔ=${analysisDelta.paragraphEffectivenessDelta > 0 ? '+' : ''}${analysisDelta.paragraphEffectivenessDelta}`,
          );
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[FocusedAnalyzer] Failed to apply analysis delta to coordinator: ${errorMsg}`);
          // [D-1.12 Commit B] Same shape as understanding-delta-apply.
          failedSteps.push('analysis_delta_apply');
          // Restore pre-mutation snapshot to prevent inconsistent profile state
          if (preMutationSnapshot) {
            try {
              const para = profile.paragraphs[paragraphIndex];
              const sentence = para?.sentences[sentenceIndex];
              if (sentence && preMutationSnapshot.sentenceAnalysis) {
                sentence.analysis = preMutationSnapshot.sentenceAnalysis;
              }
              if (para && preMutationSnapshot.paragraphAnalysis) {
                para.analysis = preMutationSnapshot.paragraphAnalysis;
              }
              console.log('[FocusedAnalyzer] Restored pre-mutation snapshot after analysis delta failure');
            } catch (restoreErr) {
              console.error('[FocusedAnalyzer] Failed to restore snapshot:', restoreErr);
              failedSteps.push('analysis_delta_restore');
            }
          }
        }
      }
    }

    // ───────────────────────────────────────────────────────────────────────
    // STEP 4: Phase Re-computation
    // Only if paragraph analysis changed and we have sufficient data
    // ───────────────────────────────────────────────────────────────────────

    let phaseUpdate: ImprovementPhase | null = null;

    if (analysisDelta !== null && escalationLevel < 4) {
      try {
        // Collect all current paragraph analyses from the profile
        const paragraphAnalyses = this.collectCurrentAnalyses(profile, paragraphIndex, analysisDelta);

        if (paragraphAnalyses.length > 0) {
          // Phase assessment uses LLM-assessed assessPhase() from phaseAssessment.ts.
          // We use the profile's existing analyses with the updated delta applied.
          const currentPhase = profile.index.improvementPhase;

          // Build a synthetic result to check if phase would change
          // We use the existing analyses with the updated paragraph's delta applied
          const syntheticResult = await this.computeUpdatedPhase(profile, paragraphIndex, analysisDelta);

          if (syntheticResult && syntheticResult.level !== currentPhase.level) {
            phaseUpdate = syntheticResult;
            console.log(
              `[FocusedAnalyzer] Phase shift detected: ${currentPhase.level} → ${syntheticResult.level}`,
            );
          } else {
            console.log('[FocusedAnalyzer] Phase unchanged after focused analysis');
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`[FocusedAnalyzer] Phase re-computation failed (non-fatal): ${errorMsg}`);
        // [D-1.12 Commit B] Phase drives feedback zoom per L1K design.
        // Stale phase silently kept = soft fallback masquerading as
        // non-fatal. Mark failed so orchestrator emits telemetry.
        failedSteps.push('phase_recompute');
      }
    }

    // ───────────────────────────────────────────────────────────────────────
    // W5.4c: Delta Synthesis for beyondParagraph Ripple (Level 2)
    //
    // If the understanding delta showed beyondParagraph ripple and we stayed
    // at escalation Level 2 (paragraph re-walked, but NO full holistic
    // synthesis was run), trigger a delta synthesis for the holistic sections
    // most likely affected by the cross-paragraph change. This fills the gap
    // between "paragraph-only change" and "full holistic refresh" cheaply.
    //
    // Cap: 1 delta synthesis per focused analysis run (via synthesisCompleted guard).
    // ───────────────────────────────────────────────────────────────────────

    if (
      escalationLevel === 2 &&
      understandingDelta !== null &&
      understandingDelta.rippleFlags.beyondParagraph &&
      !synthesisCompleted
    ) {
      try {
        // Derive affected sections from the ripple evidence
        const affectedSections: HolisticSectionType[] = [
          'thematic_architecture',
          'narrative_strategy',
        ];
        // If the ripple specifically mentions voice or emotion, include those
        const rippleEv = understandingDelta.rippleFlags.rippleEvidence.toLowerCase();
        if (rippleEv.includes('voice') || rippleEv.includes('tone') || rippleEv.includes('register')) {
          affectedSections.push('voice_identity');
        }
        if (rippleEv.includes('emotion') || rippleEv.includes('feel')) {
          affectedSections.push('emotional_topography');
        }

        const deltaRequest: DeltaSynthesisRequest = {
          targetSections: affectedSections,
          trigger: 'focused_analysis_ripple',
          evidence: `BeyondParagraph ripple from P${paragraphIndex}S${sentenceIndex}: ${understandingDelta.rippleFlags.rippleEvidence}`,
        };

        const deltaResult = await holisticSynthesisService.deltaSynthesize(
          deltaRequest,
          profile,
        );

        coordinator.applySectionLevelSynthesis(deltaResult.output);

        costs.push({
          layer: 'focused_delta_synthesis_ripple',
          cost: deltaResult.cost,
          tokenUsage: deltaResult.tokenUsage,
          timingMs: deltaResult.timingMs,
        });

        console.log(
          `[FocusedAnalyzer] W5.4c: Delta synthesis for beyondParagraph ripple — ` +
          `sections=[${affectedSections.join(', ')}], ` +
          `isSubstantive=${deltaResult.output.isSubstantive}, ` +
          `cost=$${deltaResult.cost.toFixed(4)}`,
        );
      } catch (error) {
        // [D-1.12 Commit B] Delta synthesis failure means cross-paragraph
        // ripple isn't reflected in the holistic sections. Mark failed
        // so the orchestrator emits telemetry; result is still returned
        // since holistic carry-forward is genuinely non-fatal.
        console.error(
          '[FocusedAnalyzer] W5.4c: Delta synthesis failed (non-fatal but tracked):',
          error instanceof Error ? error.message : String(error),
        );
        failedSteps.push('w54c_delta_synthesis');
      }
    }

    const totalCost = costs.reduce((acc, c) => acc + c.cost, 0);
    const totalTime = Date.now() - overallStart;

    console.log(
      `[FocusedAnalyzer] Complete — escalationLevel=${escalationLevel}, ` +
        `cost=$${totalCost.toFixed(4)}, time=${totalTime}ms, ` +
        `phaseUpdate=${phaseUpdate ? phaseUpdate.level : 'none'}`,
    );

    return {
      mode: escalationLevel === 4 ? 'escalated_to_comprehensive' : 'focused',
      escalationLevel,
      updatedParagraphIndex: paragraphIndex,
      updatedSentenceIndex: sentenceIndex,
      understandingDelta,
      analysisDelta,
      phaseUpdate,
      cost: costs,
      totalCost,
      // [D-1.12 Commit B 2026-04-29] escalationLevelTrustworthy is true
      // iff every step that was attempted completed cleanly. The catches
      // throughout this method push to failedSteps; if the array is
      // empty here, no catch fired and the escalation level is honest.
      escalationLevelTrustworthy: failedSteps.length === 0,
      failedSteps,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Identify ALL changed sentences from the diff.
   * Returns every modified/added sentence location, ordered by paragraph then sentence index.
   * Callers typically use [0] (the first/most impactful change) for the focused pipeline,
   * but multi-location edits (find-and-replace) expose all changes for full coverage.
   */
  private identifyChangedSentences(
    editOutput: EditUnderstandingOutput,
  ): Array<{ paragraphIndex: number; sentenceIndex: number }> {
    const changed: Array<{ paragraphIndex: number; sentenceIndex: number }> = [];

    for (const paraChange of editOutput.diff.paragraphChanges) {
      if (paraChange.changeType === 'modified') {
        for (const sentChange of paraChange.sentenceChanges) {
          if (sentChange.changeType === 'modified' || sentChange.changeType === 'added') {
            changed.push({
              paragraphIndex: paraChange.paragraphIndex,
              sentenceIndex: sentChange.sentenceIndex,
            });
          }
        }
        // If paragraph was modified but no sentence-level changes found, include first sentence
        if (
          changed.length === 0 ||
          !changed.some((c) => c.paragraphIndex === paraChange.paragraphIndex)
        ) {
          if (paraChange.sentenceChanges.length > 0) {
            changed.push({
              paragraphIndex: paraChange.paragraphIndex,
              sentenceIndex: paraChange.sentenceChanges[0].sentenceIndex,
            });
          }
        }
      }
    }

    // Final fallback — first changed paragraph, first sentence
    if (changed.length === 0 && editOutput.diff.paragraphChanges.length > 0) {
      const firstChange = editOutput.diff.paragraphChanges[0];
      changed.push({
        paragraphIndex: firstChange.paragraphIndex,
        sentenceIndex: firstChange.sentenceChanges[0]?.sentenceIndex ?? 0,
      });
    }

    // Guarantee at least one result
    if (changed.length === 0) {
      changed.push({ paragraphIndex: 0, sentenceIndex: 0 });
    }

    return changed;
  }

  /**
   * Build a rough essay text from the profile's paragraph data.
   * Used for escalation-level services that need the essay text.
   */
  private buildEssayTextFromProfile(profile: EssayProfile): string {
    // Reconstruct essay text from paragraph sentence texts
    return profile.paragraphs
      .map((para, i) => {
        const sentences = para.sentences.map((s) => s.text ?? '').join(' ');
        return `[P${i}]\n${sentences}`;
      })
      .join('\n\n');
  }

  /**
   * Build a structural map for walkEssay calls.
   * Derives paragraph roles and structural data from the profile's existing understanding.
   * The profile does not store the L2 StructuralCartography directly, so we reconstruct
   * a valid object from the paragraph understanding data already available.
   */
  private buildMinimalStructuralMap(profile: EssayProfile): import('../types').StructuralCartography {
    // Derive paragraph roles from existing paragraph understanding (L3 data)
    const paragraphRoles = profile.paragraphs.map((para) => ({
      index: para.index,
      role: para.understanding?.role ?? 'paragraph',
      narrativeFunction: para.understanding?.function ?? 'advances the essay',
      strengthContribution: para.understanding?.narrativeContribution ?? '',
      weaknessFlag: para.analysis
        ? (para.analysis.growthEdges[0]?.quality ?? null)
        : null,
    }));

    // Derive transitions from consecutive paragraph pairs
    const transitions = profile.paragraphs.slice(0, -1).map((_, i) => ({
      fromParagraph: i,
      toParagraph: i + 1,
      quality: 'functional' as const,
      mechanism: 'sequential progression',
    }));

    // Use thematic architecture from the profile for theme data
    const centralTheme = profile.thematicArchitecture?.centralThesis ?? '';

    return {
      paragraphRoles,
      arcType: 'quest',   // Default — walkEssay uses this as context only, not truth
      arcConfidence: 0.5,
      arcVerification: 'Derived from profile understanding for focused re-walk context',
      transitions,
      centralTheme,
      themeProgression: 'continuing',
      thematicGaps: [],
      pacingNotes: '',
      flatSpots: [],
    };
  }

  /**
   * Collect current analyses from the profile to feed into phase computation.
   * Applies the focused delta to the affected paragraph.
   *
   * Field mapping note:
   *   - para.analysis is ParagraphAnalysis: has `effectiveness` and `verdict` (not paragraphEffectiveness/paragraphVerdict)
   *   - Sentence analyses live on para.sentences[i].analysis (SentenceAnalysis), NOT on para.analysis
   *   - para.analysis has no `holisticAnalysisEvolution` field — omitted from output
   */
  private collectCurrentAnalyses(
    profile: EssayProfile,
    updatedParagraphIndex: number,
    analysisDelta: FocusedAnalysisDelta,
  ): AnalysisPassOutput[] {
    const analyses: AnalysisPassOutput[] = [];

    for (const para of profile.paragraphs) {
      if (!para.analysis) continue;

      // Sentence analyses come from per-sentence SentenceProfile.analysis, not para.analysis
      const sentenceAnalyses = para.sentences
        .map((s) => s.analysis)
        .filter((a): a is NonNullable<typeof a> => a !== null)
        .map((sa, idx) => ({
          sentenceIndex: para.sentences.findIndex((s) => s.analysis === sa) !== -1
            ? para.sentences.findIndex((s) => s.analysis === sa)
            : idx,
          effectiveness: sa.effectiveness,
          effectivenessReasoning: sa.effectivenessReasoning,
          strengths: sa.strengths,
          weaknesses: sa.weaknesses,
          isStrength: sa.isStrength,
          isProblem: sa.isProblem,
          priorityForImprovement: sa.priorityForImprovement,
        }));

      // Apply delta to the updated paragraph
      if (para.index === updatedParagraphIndex) {
        // para.analysis.effectiveness is the correct field (NOT paragraphEffectiveness)
        const baseEffectiveness = para.analysis.effectiveness;
        const updatedParagraphEffectiveness = Math.max(
          0,
          Math.min(100, baseEffectiveness + analysisDelta.paragraphEffectivenessDelta),
        );

        // NaN guard: field mapping bug would produce NaN here — fail loudly
        if (isNaN(updatedParagraphEffectiveness)) {
          throw new Error(
            '[FocusedAnalyzer] Phase computation received NaN — field mapping broken in collectCurrentAnalyses. ' +
            `baseEffectiveness=${baseEffectiveness}, delta=${analysisDelta.paragraphEffectivenessDelta}`,
          );
        }

        analyses.push({
          paragraphIndex: para.index,
          sentenceAnalyses,
          paragraphEffectiveness: updatedParagraphEffectiveness,
          // para.analysis.verdict is the correct field (NOT paragraphVerdict)
          paragraphVerdict: para.analysis.verdict ?? '',
          holisticAnalysisEvolution: {},
        });
      } else {
        // Use existing analysis as-is
        const paragraphEffectiveness = para.analysis.effectiveness;

        // NaN guard for existing paragraphs too
        if (isNaN(paragraphEffectiveness)) {
          throw new Error(
            `[FocusedAnalyzer] Phase computation received NaN for P${para.index} — para.analysis.effectiveness is not a number`,
          );
        }

        analyses.push({
          paragraphIndex: para.index,
          sentenceAnalyses,
          paragraphEffectiveness,
          paragraphVerdict: para.analysis.verdict ?? '',
          holisticAnalysisEvolution: {},
        });
      }
    }

    return analyses;
  }

  /**
   * Compute an updated improvement phase using existing analyses with the delta applied.
   * Uses LLM-assessed phase detection (Sonnet synthesis call) via assessPhase().
   * Passes the prior phase for transition detection.
   */
  private async computeUpdatedPhase(
    profile: EssayProfile,
    updatedParagraphIndex: number,
    analysisDelta: FocusedAnalysisDelta,
  ): Promise<ImprovementPhase | null> {
    const analyses = this.collectCurrentAnalyses(profile, updatedParagraphIndex, analysisDelta);
    if (analyses.length === 0) return null;

    // Build a minimal updated profile to pass to assessPhase.
    // We override the relevant paragraph's analysis with the delta applied.
    // Note: ParagraphAnalysis uses `effectiveness` (not `paragraphEffectiveness`).
    const updatedProfile: EssayProfile = {
      ...profile,
      paragraphs: profile.paragraphs.map((para) => {
        if (para.index !== updatedParagraphIndex || !para.analysis) return para;
        return {
          ...para,
          analysis: {
            ...para.analysis,
            effectiveness: Math.max(
              0,
              Math.min(100, para.analysis.effectiveness + analysisDelta.paragraphEffectivenessDelta),
            ),
          },
        };
      }),
    };

    // Use LLM-assessed phase detection with transition detection from prior phase.
    const priorPhase = profile.index.improvementPhase;
    const phaseResult = await assessPhase({
      analyses,
      profile: updatedProfile,
      priorPhase,
    });
    return phaseResult.phase;
  }

}


// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const focusedAnalyzer = new FocusedAnalyzer();
