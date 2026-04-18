/**
 * AI-Risk Signal Block — Port F2 (Wave-1b fillers)
 *
 * Builds the F2_AI_RISK_SIGNAL block that is prepended to L3.75 Phase A's
 * user prompt when `profile.index.aiRiskSignal` has been populated by the
 * orchestrator (gated on ENABLE_AI_RISK_SIGNAL). V1 shipped a standalone
 * `aiRiskScorer` runtime service that was never actually wired into the
 * essay-intelligence pipeline. Port F2 threads it in as a DIAGNOSTIC PRIOR
 * for L3.75's INTENTIONALITY CALIBRATION — not ground truth, not a label,
 * not a gate. The signal travels alongside the sentence-level evidence and
 * L3.75 is reminded that the evidence wins.
 *
 * CONTRACT: Purely descriptive. The block is tagged with
 *   // @prompt-block F2_AI_RISK_SIGNAL
 * and declared at level 'descriptive' in PROMPT_BLOCK_DECLARATIONS. The
 * descriptive-contract lint scans the template literal below for the
 * FORBIDDEN_WORDS vocabulary (effective / compelling / masterful /
 * heartfelt / …) and fails the build if any leak in. Framing must be
 * observational, not evaluative:
 *
 *   GOOD: "risk score: 0.73"
 *   BAD:  "this essay reads inauthentic"        (evaluative claim)
 *   GOOD: "convergence phrasing present"
 *   BAD:  "AI-like text detected"                (label, not observation)
 *   GOOD: "ESL cohort shows elevated FP rate"
 *   BAD:  "the scorer is inaccurate on ESL"     (evaluative judgment)
 *
 * DESIGN: The prior is an INPUT to the descriptive L3.75 machinery. L3.75
 * continues to compute voiceIdentity / authenticVsPerformed / intentionality
 * from the current essay's sentence-level evidence. The prior provides
 * context — when the heuristic score converges or diverges with what the
 * text shows, the model can note the convergence/divergence; when they
 * disagree, the text wins. ESL false-positive risk is named explicitly so
 * the model does not overweight a high score.
 *
 * INJECTION POINT: user prompt (per-request), not system prompt (cached).
 * Rationale matches Port A2: the signal is per-essay, putting it in the
 * cached system prompt would fragment the cache across every essay. The
 * Wave-1b.5 block-version seam keeps lint scanning + cache divergence
 * working regardless of injection point.
 *
 * MUTATION: This module is read-only. It renders a prompt fragment from an
 * already-computed `aiRiskSignal`. The orchestrator owns the compute call
 * (via `aiRiskScorer.assessRisk()`) and writes the result into
 * `profile.index.aiRiskSignal`.
 *
 * Ref: docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §3 Port F2,
 *      docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §2 row 38 (feasibility arbitration),
 *      docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §6 Q6 (ESL A/B gate),
 *      docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §8 (preservation checklist).
 */

import { withPromptBlockVersion } from '../../../lib/llm/promptBlockVersions';

// ---------------------------------------------------------------------------
// Signal shape — structural alias of ProfileIndex['aiRiskSignal']
// ---------------------------------------------------------------------------
// Re-declared locally so this module has no cyclic type dependency on
// profileTypes.ts. Kept structurally compatible: any value satisfying
// ProfileIndex['aiRiskSignal'] (when non-null) satisfies this alias.

export interface AiRiskSignalInput {
  score: number;
  notes: string;
  confidence: number;
  open: string | null;
}

// ---------------------------------------------------------------------------
// Block body authoring
// ---------------------------------------------------------------------------
// The descriptive-contract lint binds `// @prompt-block F2_AI_RISK_SIGNAL`
// to the NEXT template literal. Every sentence in the body is observational
// — the block carries a number and a note and names the scorer limitation,
// and it explicitly reminds the model that the text evidence wins.
//
// WORD CHOICE: The FORBIDDEN_WORDS list in the descriptive-contract lint
// forbids evaluative vocabulary (effective, compelling, masterful,
// heartfelt, poorly-crafted, fails to, would benefit from, …). This body
// carefully avoids all of them. The phrase "not ground truth" is a frame,
// not an evaluation. The phrase "elevated false-positive rates" is a
// statistical observation about a scorer, not a judgment about an essay.

// @prompt-block F2_AI_RISK_SIGNAL
const F2_BODY_TEMPLATE = `DIAGNOSTIC PRIOR (from external aiRiskScorer — not ground truth):
score: {{SCORE}}
notes: {{NOTES}}
confidence: {{CONFIDENCE}}
open: {{OPEN}}

This is an external signal computed before L3.75, intended as context. The L3.75 authentic-vs-performed assessment remains based on textual evidence; use this signal only when it converges or diverges meaningfully from what the text shows. Known limitation: this scorer has elevated false-positive rates on non-native English speakers; do not treat a high score as dispositive.`;

// ---------------------------------------------------------------------------
// Body builder
// ---------------------------------------------------------------------------

/**
 * Render the F2 block body from a non-null aiRiskSignal.
 *
 * Returned string is the UNWRAPPED body (without version markers) so tests
 * can assert on content directly. Callers who want the full wrapped block
 * use `buildAiRiskSignalBlock()` instead.
 *
 * Numeric fields are rendered with bounded precision (score/confidence to
 * 2 decimals) to keep the prompt stable across minor recomputations — a
 * 0.7301 -> 0.7299 change should not invalidate the prompt cache slice.
 */
export function renderAiRiskSignalBody(signal: AiRiskSignalInput): string {
  const score = signal.score.toFixed(2);
  const confidence = signal.confidence.toFixed(2);
  const notes = signal.notes.trim().length > 0 ? signal.notes.trim() : '(none)';
  const open = signal.open && signal.open.trim().length > 0 ? signal.open.trim() : '(none)';

  return F2_BODY_TEMPLATE
    .replace('{{SCORE}}', score)
    .replace('{{NOTES}}', notes)
    .replace('{{CONFIDENCE}}', confidence)
    .replace('{{OPEN}}', open);
}

/**
 * Build the complete, version-wrapped F2_AI_RISK_SIGNAL block for injection
 * into the L3.75 user prompt.
 *
 * Returns an empty string when the signal is null / undefined — callers
 * should just concatenate the return value unconditionally, which produces
 * the pre-port-identical prompt when the scorer is disabled or unavailable.
 *
 * This matches the `buildPriorVoiceBlock` (Port A2) pattern: no "signal
 * absent" framing, just absent.
 */
export function buildAiRiskSignalBlock(
  signal: AiRiskSignalInput | null | undefined,
): string {
  if (!signal) return '';
  const body = renderAiRiskSignalBody(signal);
  return withPromptBlockVersion(body, 'F2_AI_RISK_SIGNAL');
}
