/**
 * Improvement Planner — LLM-Powered, ROI-Informed Enhancement Actions
 *
 * HYBRID ARCHITECTURE:
 * 1. Computational layer (generateRevisionPriorities) determines WHICH dimensions
 *    have the highest marginal utility — pure math, <1ms, deterministic.
 * 2. LLM layer (Haiku) reads the actual essay and determines WHERE and HOW to
 *    improve — reading comprehension, context-aware, ~1s, ~$0.002.
 *
 * The computational layer tells the LLM "focus on narrative_arc and reflection."
 * The LLM reads the essay and says "this specific passage about the robotics
 * competition needs add_stakes because the reader doesn't know what was at risk."
 *
 * A human writing coach works the same way: they know which rubric areas matter
 * most (the math), but they READ the essay to decide which passages need work
 * and what kind of work (the nuance).
 *
 * NO FALLBACKS: If the Haiku call fails, we throw. Static mapping is gone.
 * The whole point is that a human coach wouldn't fall back to a lookup table.
 *
 * PERFORMANCE: ~1-2s (Haiku LLM call), ~$0.002/call
 *
 * Dependencies:
 *   - generateRevisionPriorities() — marginal utility ranking (computational)
 *   - callClaude() — LLM call with JSON mode
 *   - calculateCost() — token cost tracking
 */

import { generateRevisionPriorities } from '@/core/analysis/scoring/scoringScience/diminishingReturns';
import { callClaude, calculateCost } from '@/lib/llm/claude';
import type { EditingCommand } from '../inlineEditor/types';
import type { EssaySnapshot, ImprovementAction, ImprovementPlan } from './types';

// ============================================================================
// NEW PIPELINE SUPPORT (lazy-loaded to avoid circular deps)
// ============================================================================

let _newRubricWeights: Record<string, number> | null = null;
let _expandedValidCommands: ReadonlySet<string> | null = null;

async function getNewRubricWeights(): Promise<Record<string, number>> {
  if (!_newRubricWeights) {
    const { getNewRubricWeights: fn } = await import('./workshopBridge');
    _newRubricWeights = fn();
  }
  return _newRubricWeights;
}

async function getExpandedValidCommands(): Promise<ReadonlySet<string>> {
  if (!_expandedValidCommands) {
    const { getExpandedValidCommands: fn } = await import('./workshopBridge');
    _expandedValidCommands = fn();
  }
  return _expandedValidCommands;
}

async function getProfileContext(essayType?: string): Promise<string> {
  if (!essayType) return '';
  const { buildProfileContext } = await import('./workshopBridge');
  return buildProfileContext(essayType);
}

// ============================================================================
// RUBRIC WEIGHTS (v1.0.1)
// ============================================================================

const RUBRIC_WEIGHTS: Record<string, number> = {
  opening_power_scene_entry: 0.10,
  narrative_arc_stakes_turn: 0.12,
  character_interiority_vulnerability: 0.12,
  show_dont_tell_craft: 0.10,
  reflection_meaning_making: 0.12,
  intellectual_vitality_curiosity: 0.08,
  originality_specificity_voice: 0.08,
  structure_pacing_coherence: 0.06,
  word_economy_craft: 0.06,
  context_constraints_disclosure: 0.08,
  school_program_fit: 0.06,
  ethical_awareness_humility: 0.06,
};

// ============================================================================
// VALID EDITING COMMANDS
// ============================================================================

/** All valid editing commands — used for LLM output validation. */
const VALID_COMMANDS: ReadonlySet<string> = new Set<EditingCommand>([
  'make_concrete',
  'show_dont_tell',
  'clarify_learning',
  'add_stakes',
  'strengthen_voice',
  'cut_filler',
  'add_evidence',
  'deepen_vulnerability',
  'connect_to_theme',
  'fix_hook',
  'sharpen_ending',
  'expand_moment',
  'compress',
  'add_dialogue',
  'remove_cliche',
]);

// ============================================================================
// LLM SYSTEM PROMPT
// ============================================================================

const PLANNING_SYSTEM_PROMPT = `You are a college admissions essay writing coach analyzing an essay to recommend targeted improvements.

## Your Role
Read the essay carefully and identify specific passages that need improvement. For each passage, choose the single most effective editing command based on what that passage actually needs — not based on a generic lookup table.

## Admissions Officer Reality (inform every recommendation)
- AOs spend 8-15 SECONDS on an opening paragraph. If the hook doesn't work, the rest barely matters. Weight opening improvements heavily.
- The "Committee Pitch Test": after reading, can the AO say in one sentence what makes this student memorable? If not, the essay needs MORE specificity, not more polish.
- AUTHENTICITY > POLISH. A rough but genuine voice always beats a polished but generic one. Never recommend changes that sand down authentic voice in favor of "better" writing.
- AOs read 30-50 essays per day. They notice patterns: the "ever since I was young" opener, the challenge→growth→lesson arc, the gratitude conclusion. Flag and fix these.
- Specificity is the #1 differentiator. "I organized a food drive" loses to "I convinced 47 restaurant owners to donate leftover bread every Tuesday."

## Available Editing Commands
Each command is a targeted text transformation. Choose the one that best fits what the passage needs:

- make_concrete: Replace vague, abstract language with specific, tangible details. Use when a passage says "I learned a lot" instead of describing what specifically changed.
- show_dont_tell: Convert declarative statements into vivid scenes with action, dialogue, or sensory detail. Use when the writer TELLS the reader how they felt instead of SHOWING it through a moment.
- clarify_learning: Deepen the reflection or insight — move past surface-level takeaways to genuine intellectual or personal growth. Use when reflection is shallow or generic.
- add_stakes: Raise the tension — make the reader understand what was at risk, what could have been lost, why it mattered. Use when events feel low-consequence.
- strengthen_voice: Make the writing sound more authentically like the student — their natural rhythms, word choices, humor, perspective. Use when the passage sounds generic or AI-written.
- cut_filler: Remove unnecessary words, redundant phrases, or padding that dilutes the impact. Use when the passage is bloated.
- add_evidence: Insert specific metrics, results, data, or concrete proof of claims. Use when the writer claims impact without backing it up.
- deepen_vulnerability: Move past surface emotion into genuine, uncomfortable honesty about fears, failures, or uncertainties. Use when the writer is playing it safe emotionally.
- connect_to_theme: Strengthen the link between this passage and the essay's central theme or argument. Use when a section feels disconnected from the whole.
- fix_hook: Strengthen the opening to grab the reader immediately — start in a moment, with tension, or with a surprising detail. Use only for the first 1-2 sentences.
- sharpen_ending: Strengthen the conclusion to leave a lasting impression — circle back, land a final insight, or end on resonance. Use only for the final sentences.
- expand_moment: Slow down and expand a key moment that is being rushed. Use when a pivotal experience is summarized in one sentence but deserves a full paragraph.
- compress: Say the same thing in fewer words without losing meaning. Use when a passage takes 3 sentences to say what could be said in 1.
- add_dialogue: Convert narrative summary into a scene with actual dialogue between people. Use when the writer describes a conversation instead of showing it.
- remove_cliche: Replace overused phrases with fresh, specific language. Use when the passage relies on stock phrases like "passionate about" or "made me who I am."

## Rules
1. QUOTE the exact passage from the essay. Your targetPassage MUST be a verbatim substring of the essay text — no paraphrasing, no ellipses, no modifications.
2. Each action targets a DIFFERENT passage. Do not recommend two commands for the same passage.
3. Choose the single best command for each passage. If a passage could use multiple commands, pick the one with the highest impact.
4. Focus on the dimensions with the highest ROI (provided in the priority ranking). Don't spread recommendations across too many dimensions.
5. Your rationale should explain WHY this specific passage needs this specific command — reference what you observed in the text.
6. Keep targetPassage to 1-3 sentences. Don't quote entire paragraphs.
7. PROTECT strong dimensions. If a passage is working well (contributes to a dimension scoring 7+), do NOT target it unless another dimension desperately needs it.
8. Prioritize the opening if it scores poorly — AOs decide in 8-15 seconds whether to read carefully.

## Output Format
Return a JSON array of objects, each with these fields:
- dimension (string): The rubric dimension this action improves
- command (string): One of the editing commands listed above
- targetPassage (string): EXACT quote from the essay text
- rationale (string): 1-2 sentences explaining why this passage needs this command

Do NOT include expectedGain, difficulty, or rank — those are computed separately.`;

// ============================================================================
// LLM RESPONSE TYPE
// ============================================================================

/** Shape of each action returned by the LLM (before computational enrichment). */
interface LLMPlanningAction {
  dimension: string;
  command: string;
  targetPassage: string;
  rationale: string;
}

// ============================================================================
// PASSAGE VALIDATION
// ============================================================================

/**
 * Validate that a targetPassage is an exact substring of the essay text.
 *
 * Tries exact match first, then trimmed whitespace match, then
 * normalized whitespace match (collapse runs of whitespace to single space).
 *
 * @returns The matched passage as it appears in the essay text, or null if no match.
 */
function validatePassage(essayText: string, targetPassage: string): string | null {
  // Exact match
  if (essayText.includes(targetPassage)) {
    return targetPassage;
  }

  // Trimmed whitespace match
  const trimmed = targetPassage.trim();
  if (trimmed.length > 0 && essayText.includes(trimmed)) {
    return trimmed;
  }

  // Normalized whitespace: collapse all whitespace runs to single space in both
  const normalizeWs = (s: string) => s.replace(/\s+/g, ' ').trim();
  const normalizedEssay = normalizeWs(essayText);
  const normalizedPassage = normalizeWs(targetPassage);

  if (normalizedPassage.length > 0 && normalizedEssay.includes(normalizedPassage)) {
    // Find the original text that corresponds to this normalized match.
    // We know it's in there after normalization, so extract the original form.
    // Strategy: find the start position in normalized text, then map back.
    const startIdx = normalizedEssay.indexOf(normalizedPassage);
    if (startIdx !== -1) {
      // Walk through the original text to find the span that covers
      // characters startIdx..startIdx+normalizedPassage.length in normalized form.
      let origStart = -1;
      let origEnd = -1;
      let normIdx = 0;
      let inWhitespaceRun = false;

      for (let i = 0; i < essayText.length && normIdx <= startIdx + normalizedPassage.length; i++) {
        const ch = essayText[i];
        const isWs = /\s/.test(ch);

        if (isWs) {
          if (!inWhitespaceRun) {
            // First whitespace in a run corresponds to the single space in normalized
            if (normIdx === startIdx && origStart === -1) origStart = i;
            normIdx++;
            inWhitespaceRun = true;
          }
          // Subsequent whitespace in the run: skip (doesn't advance normIdx)
        } else {
          inWhitespaceRun = false;
          if (normIdx === startIdx && origStart === -1) origStart = i;
          normIdx++;
        }

        if (normIdx === startIdx + normalizedPassage.length && origEnd === -1) {
          origEnd = i + 1;
        }
      }

      if (origStart !== -1 && origEnd !== -1) {
        return essayText.substring(origStart, origEnd);
      }
    }

    // If mapping failed, return the trimmed version as best effort
    return trimmed;
  }

  // No match found
  return null;
}

// ============================================================================
// USER PROMPT BUILDER
// ============================================================================

/**
 * Build the user prompt that includes the essay, scores, and ROI priorities.
 */
function buildUserPrompt(
  snapshot: EssaySnapshot,
  priorities: ReturnType<typeof generateRevisionPriorities>,
  options: {
    essayType?: string;
    maxActions?: number;
    focusDimensions?: string[];
  }
): string {
  const { essayType, maxActions = 5, focusDimensions } = options;

  // Format dimension scores with human-readable labels
  const scoreEntries = Object.entries(snapshot.dimensionScores)
    .sort(([, a], [, b]) => a - b); // Weakest first
  const scoreLines = scoreEntries
    .map(([dim, score]) => {
      const label = score <= 3 ? 'WEAK' : score <= 5 ? 'Below Average' : score <= 7 ? 'Good' : 'Strong';
      const weight = RUBRIC_WEIGHTS[dim];
      const weightPct = weight ? `(weight: ${(weight * 100).toFixed(0)}%)` : '';
      return `  ${dim}: ${score.toFixed(1)}/10 [${label}] ${weightPct}`;
    })
    .join('\n');

  // Identify strong dimensions to PROTECT (score >= 7)
  const strongDimensions = scoreEntries
    .filter(([, score]) => score >= 7)
    .map(([dim, score]) => `${dim} (${score.toFixed(1)})`)
    .join(', ');

  // Format ROI priorities
  const priorityLines = priorities.ranked_dimensions
    .slice(0, 8) // Top 8 for context
    .map((d, i) => {
      const rec = priorities.top_recommendations.find(r => r.dimension === d.dimension);
      const recNote = rec
        ? ` → Target: ${rec.target.toFixed(1)}, expected gain: +${rec.expected_quality_gain.toFixed(1)} QI`
        : '';
      return `  ${i + 1}. ${d.dimension} (score: ${d.current_score.toFixed(1)}, marginal utility: ${d.marginal_utility_next_point.toFixed(3)}, difficulty: ${d.difficulty})${recNote}`;
    })
    .join('\n');

  // Format deprioritized dimensions
  const deprioritizedLines = priorities.deprioritized.length > 0
    ? `\nDeprioritized (low ROI — avoid these):\n${priorities.deprioritized.map(d => `  - ${d.dimension}: ${d.reason}`).join('\n')}`
    : '';

  // Focus dimensions constraint
  const focusNote = focusDimensions && focusDimensions.length > 0
    ? `\n\nFOCUS CONSTRAINT: Only recommend actions for these dimensions: ${focusDimensions.join(', ')}`
    : '';

  // Essay type context with word count targets
  let essayTypeNote = '';
  if (essayType) {
    const wordCountTargets: Record<string, { target: number; label: string }> = {
      'common_app': { target: 650, label: 'Common App (max 650)' },
      'personal_statement': { target: 650, label: 'Personal Statement (max 650)' },
      'piq': { target: 350, label: 'UC PIQ (max 350)' },
      'why_us': { target: 400, label: '"Why Us" Supplement (typically 250-400)' },
      'activity': { target: 150, label: 'Activity Description (max 150)' },
      'additional_info': { target: 650, label: 'Additional Information (max 650)' },
    };
    const wcTarget = wordCountTargets[essayType];
    const wcNote = wcTarget
      ? `\nWord Count Target: ${wcTarget.label}. Current: ${snapshot.wordCount}/${wcTarget.target} (${snapshot.wordCount >= wcTarget.target ? 'AT LIMIT — prefer compress/cut_filler' : `${wcTarget.target - snapshot.wordCount} words remaining`}).`
      : '';
    essayTypeNote = `\nEssay Type: ${essayType}${wcNote}\nConsider what matters most for this type of essay. "Why Us" essays need school_program_fit, not vulnerability. Common App essays need narrative_arc and reflection. PIQs need conciseness and specificity.`;
  }

  // Strengths to protect
  const strengthsNote = strongDimensions
    ? `\n\n## STRENGTHS TO PROTECT (do NOT degrade these)\n${strongDimensions}\nThese dimensions are working well. Your improvements MUST NOT sacrifice these strengths.`
    : '';

  return `## Essay to Analyze
${snapshot.text}

## Current Quality Assessment
EQI (Essay Quality Index): ${snapshot.eqi.toFixed(1)}/100
Overall Impression: ${snapshot.impressionLabel}
Word Count: ${snapshot.wordCount}
Weakest Dimensions: ${snapshot.weakestDimensions.join(', ')}
${snapshot.flags.length > 0 ? `Flags: ${snapshot.flags.join(', ')}` : ''}
${essayTypeNote}${strengthsNote}

## Dimension Scores
${scoreLines}

## ROI-Ranked Priorities (highest improvement value first)
${priorityLines}
${deprioritizedLines}
${focusNote}

## Task
Recommend exactly ${maxActions} improvement actions. Focus on the highest-ROI dimensions. For each action, quote the EXACT passage from the essay and choose the most appropriate editing command.

Return a JSON array of ${maxActions} action objects.`;
}

// ============================================================================
// MAIN PLANNER
// ============================================================================

/**
 * Generate an LLM-powered, ROI-ranked improvement plan from an essay snapshot.
 *
 * The computational layer (generateRevisionPriorities) determines which dimensions
 * have the highest marginal utility. The LLM (Haiku) reads the essay and determines
 * which specific passages need which specific commands.
 *
 * The LLM provides: dimension, command, targetPassage, rationale.
 * The computational layer provides: expectedGain, difficulty, rank.
 *
 * @param snapshot - Pre-analysis result with essay text and dimension scores
 * @param options - Planning options (essayType, focusDimensions, maxActions)
 * @returns Promise<ImprovementPlan> — ROI-ranked list of context-aware actions
 * @throws Error if the LLM call fails (no fallback to static mapping)
 */
export async function planImprovements(
  snapshot: EssaySnapshot,
  options: {
    essayType?: string;
    focusDimensions?: string[];
    maxActions?: number;
    useNewScoringPipeline?: boolean;
  } = {}
): Promise<ImprovementPlan> {
  const { maxActions = 5, useNewScoringPipeline = true } = options;

  // ── Step 1: Computational layer — ROI ranking (<1ms) ──────────────────

  // Use new 13-dim weights or legacy 12-dim weights
  const weights = useNewScoringPipeline
    ? await getNewRubricWeights()
    : RUBRIC_WEIGHTS;

  const priorities = generateRevisionPriorities(
    snapshot.dimensionScores,
    weights,
    snapshot.wordCount
  );

  // Build a lookup for computational data by dimension name.
  // We use this to enrich LLM actions with expectedGain and difficulty.
  const dimensionAnalysis = new Map(
    priorities.ranked_dimensions.map(d => [d.dimension, d])
  );
  const recommendationLookup = new Map(
    priorities.top_recommendations.map(r => [r.dimension, r])
  );

  // ── Step 2: LLM layer — context-aware planning (~1s) ─────────────────

  const userPrompt = buildUserPrompt(snapshot, priorities, options);

  // In new pipeline mode, inject essay profile context into the system prompt
  let systemPrompt = PLANNING_SYSTEM_PROMPT;
  if (useNewScoringPipeline) {
    const profileContext = await getProfileContext(options.essayType);
    if (profileContext) {
      systemPrompt = systemPrompt + '\n\n' + profileContext;
    }
  }

  const response = await callClaude<LLMPlanningAction[]>({
    systemPrompt,
    userPrompt,
    model: 'claude-haiku-4-5-20251001',
    temperature: 0.3,
    maxTokens: 2000,
    useJsonMode: true,
    cacheSystemPrompt: true,
  });

  const cost = calculateCost(response.usage);
  const rawActions: LLMPlanningAction[] = Array.isArray(response.content)
    ? response.content
    : [];

  // ── Step 3: Validate and enrich LLM output ────────────────────────────

  // Use expanded command set in new pipeline mode
  const validCommands = useNewScoringPipeline
    ? await getExpandedValidCommands()
    : VALID_COMMANDS;

  const actions: ImprovementAction[] = [];
  const usedPassages = new Set<string>();

  for (const raw of rawActions) {
    if (actions.length >= maxActions) break;

    // Validate command is a known EditingCommand
    if (!validCommands.has(raw.command)) {
      console.warn(`[ImprovementPlanner] LLM returned unknown command "${raw.command}" — skipping action`);
      continue;
    }

    // Validate targetPassage is an exact substring of the essay
    const validatedPassage = validatePassage(snapshot.text, raw.targetPassage);
    if (!validatedPassage) {
      console.warn(
        `[ImprovementPlanner] LLM passage not found in essay — skipping action. ` +
        `Passage preview: "${raw.targetPassage.substring(0, 80)}..."`
      );
      continue;
    }

    // Skip duplicate passages (the LLM occasionally targets the same text twice)
    if (usedPassages.has(validatedPassage)) {
      continue;
    }
    usedPassages.add(validatedPassage);

    // Enrich with computational data
    const analysis = dimensionAnalysis.get(raw.dimension);
    const rec = recommendationLookup.get(raw.dimension);

    // expectedGain: use the recommendation's expected_quality_gain if available,
    // otherwise estimate from marginal utility
    const expectedGain = rec
      ? rec.expected_quality_gain
      : analysis
        ? analysis.marginal_utility_next_point * 10
        : 1.0;

    // difficulty: always from computational layer
    const difficulty = analysis?.difficulty ?? 'moderate';

    actions.push({
      dimension: raw.dimension,
      command: raw.command as EditingCommand,
      targetPassage: validatedPassage,
      rationale: raw.rationale,
      expectedGain,
      difficulty,
      rank: actions.length + 1,
    });
  }

  // ── Step 4: Assemble the plan ─────────────────────────────────────────

  const topDims = actions.slice(0, 3).map(a => a.dimension.replace(/_/g, ' '));
  const summary = actions.length > 0
    ? `Focus on ${topDims.join(', ')} for maximum EQI improvement. ` +
      `Current EQI: ${snapshot.eqi.toFixed(1)}. ` +
      `${actions.length} context-aware actions planned (LLM cost: $${cost.toFixed(4)}).`
    : 'Essay is already scoring well across all dimensions. Minor refinements possible.';

  return {
    snapshot,
    actions,
    summary,
  };
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const improvementPlanner = { planImprovements };
