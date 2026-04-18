/**
 * Port G3 — Few-shot calibration for L3.5 PIQ dimension scoring (0-10 scale).
 *
 * A3's PIQ_MODE block defines the 13 PIQ rubric dimensions and instructs
 * the model to emit per-sentence `piqDimensions: { dimension_key: 0-10 }`,
 * but carries NO concrete text examples showing what a score 3 vs 6 vs 9
 * looks like for any specific dimension. Without anchored examples on the
 * 0-10 axis, models compress into a 5-7 band across all dimensions — the
 * exact failure mode A3's anti-clustering clause tries to prevent.
 *
 * This block adds 3 sentence-level exemplars on
 * `vulnerability_authenticity` (the highest-weight PIQ dimension at 12%
 * baseline), spanning the 0-10 range. Deliberately picks one dimension to
 * avoid prompt bloat — the model generalizes the calibration pattern to
 * the other 12 dimensions.
 *
 * Only injected when PIQ_MODE is active (essayType === 'piq'). Non-PIQ
 * path unchanged.
 *
 * Block slot: G3_FEW_SHOT_CALIBRATION @ v1.0.0 (evaluative — lint exempt).
 *
 * Ref: docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §3 Port G3.
 */

import { withPromptBlockVersion } from '../../../lib/llm/promptBlockVersions';

// @prompt-block G3_FEW_SHOT_CALIBRATION
const PIQ_DIMENSION_ANCHORS_BODY = `PIQ DIMENSION ANCHOR EXEMPLARS — 0-10 SCALE CALIBRATION (\`vulnerability_authenticity\`)

The 0-10 dimension scale in \`piqDimensions\` is NOT a simplified 0-100 — score 7 does not equal 70. These anchors calibrate what the dimension-specific bands actually look like. The same logic applies to all 13 dimensions; these three examples use \`vulnerability_authenticity\` because it's the highest-weight dimension (12% baseline) and the easiest to miscalibrate via performed vulnerability.

SCORE 3 (\`vulnerability_authenticity\`): "Overcoming that challenge taught me the importance of resilience and believing in myself."
WHY 3: Manufactured-vulnerability template — the sentence names the emotional frame (overcoming, taught me, resilience) without any specific emotional evidence. Score 3 is not "no vulnerability" (that would be 0-1); it's "vulnerability-shaped language without vulnerable content". Sentences at this band tend to be where the writer was told vulnerability is important and reached for the closest-available phrase.

SCORE 6 (\`vulnerability_authenticity\`): "I wanted to call my mom but I didn't want her to worry, so I sat in the car for twenty minutes before going inside."
WHY 6: Real specific emotional moment (the twenty-minute pause in the car) paired with a concrete interpersonal constraint (not wanting mom to worry). Evidence of genuine emotional difficulty without the full payoff — the sentence shows the hesitation but doesn't land on what was at stake. Score 6 is where most competent PIQ sentences land on this dimension: real, but not yet distinctive.

SCORE 9 (\`vulnerability_authenticity\`): "I did not tell anyone for four months, not because I was ashamed of the diagnosis, but because I was ashamed that I had waited three weeks to get tested."
WHY 9: Earned vulnerability through self-correction. The sentence first proposes one emotional reading (ashamed of diagnosis) then revises it to a more uncomfortable truth (ashamed of the delay). The revision IS the vulnerability — the writer is letting the reader see their own emotional shape more precisely than they might see it themselves. Score 9 requires BOTH specific evidence AND a move that makes the reader trust the writer's self-perception.

CALIBRATION RULE FOR 0-10 SCORING:
- 0-2: Dimension not present OR actively absent (e.g., scoring \`vulnerability_authenticity\` on a factual logistical sentence).
- 3-4: Dimension-shaped but hollow — the language matches the dimension but the content doesn't earn it.
- 5-7: Genuine dimension-contribution, functional, not distinctive.
- 8-9: Dimension-distinctive — the sentence does something specific for this dimension that another writer couldn't easily swap in.
- 10: Reserved for rare dimension-defining moments (the sentence an AO would remember as an example of THIS dimension).

Apply this calibration pattern to the other 12 dimensions: a score of 7 on \`specificity_evidence\` is a sentence that cites concrete detail functionally (Tuesday, the blue folder, $47), not one that reaches for vivid imagery abstractly. A score of 7 on \`reflection_insight\` is a sentence that articulates something true about the experience without yet rephrasing it into a transferable lesson.

When scoring all 13 dimensions, resist the compression to 5-7 across the board. The same sentence can legitimately score 3 on \`reflection_insight\` and 8 on \`specificity_evidence\` — differentiated dimension scores are diagnostic information, not a scoring inconsistency.`;

/**
 * Build the G3 PIQ-dimension anchors block. Intended to be concatenated
 * after A3's PIQ_MODE block at L3.5 `buildSystemPrompt` so the concrete
 * 0-10 examples sit adjacent to the dimension catalog that references them.
 */
export function buildPiqDimensionAnchorsBlock(): string {
  return withPromptBlockVersion(PIQ_DIMENSION_ANCHORS_BODY, 'G3_FEW_SHOT_CALIBRATION');
}
