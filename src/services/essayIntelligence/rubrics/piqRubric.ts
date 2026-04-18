/**
 * Port A3 — PIQ 13-Dimension Rubric at L3.5 + L4
 *
 * Conditionally activated when `EssayProfile.index.essayType === 'piq'` and
 * `EssayProfile.index.piqPromptType` is set. Gated so non-PIQ essays are
 * unaffected (cache preserved, output schema unchanged on non-PIQ path).
 *
 * Per Verdict §3 Port A3 and §5 (rejected: decimal weight overrides):
 *   - Re-export the 13-dimension catalog from src/services/piq/rubric.ts.
 *   - Derive PRIMARY_DIMENSIONS_BY_PIQ from `emphasis === 'high'` entries
 *     in PIQ_WEIGHT_PROFILES (prose-level primary-dim guidance).
 *   - Do NOT port decimal weight tables — hand-tuned without a calibration
 *     fingerprint; Sonnet zero-shot outperforms.
 *
 * Authoring convention (Wave-1b.5):
 *   Prompt body constants are tagged `// @prompt-block A3_PIQ_RUBRIC` on the
 *   line immediately above the template literal so the descriptive-contract
 *   lint can discover them. A3_PIQ_RUBRIC is declared `evaluative` level in
 *   PROMPT_BLOCK_DECLARATIONS — forbidden vocabulary is permitted (this is
 *   L3.5 / L4 evaluative territory).
 *
 * Ref: docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §3 Port A3 + §5 rejections.
 */

import type { PIQRubricDimension, PIQPromptType } from '../../piq/types';
import { PIQ_RUBRIC_DIMENSIONS } from '../../piq/rubric';
import {
  PIQ_WEIGHT_PROFILES,
  getHighEmphasisDimensions,
} from '../../piq/weights/dimensionWeights';
import { withPromptBlockVersion } from '../../../lib/llm/promptBlockVersions';

// Re-export for downstream consumers (analysisPass, crystallizer, tests).
export { PIQ_RUBRIC_DIMENSIONS };
export type { PIQRubricDimension, PIQPromptType };

// ---------------------------------------------------------------------------
// PRIMARY_DIMENSIONS_BY_PIQ — derived from emphasis='high' entries
// ---------------------------------------------------------------------------
// Prose-level primary-dim guidance (NOT a decimal weight override). For each
// PIQ prompt, the 3-5 dimensions flagged as 'high' emphasis in
// PIQ_WEIGHT_PROFILES are surfaced as "primary dimensions". Sonnet reasons
// from this list rather than from a decimal-weight distribution that would
// pre-determine scoring.
//
// Derived lazily-at-module-load via Object.fromEntries so a future weight-
// profile edit automatically propagates here without a second source of truth.

export const PRIMARY_DIMENSIONS_BY_PIQ: Record<PIQPromptType, PIQRubricDimension[]> =
  Object.fromEntries(
    (Object.keys(PIQ_WEIGHT_PROFILES) as PIQPromptType[]).map((pt) => [
      pt,
      getHighEmphasisDimensions(pt),
    ]),
  ) as Record<PIQPromptType, PIQRubricDimension[]>;

// ---------------------------------------------------------------------------
// Dimension short-description catalog (for the L3.5 prompt body)
// ---------------------------------------------------------------------------
// Each dimension gets a one-line definition derived from PIQ_RUBRIC_DIMENSIONS
// metadata. The L3.5 prompt injects this list when PIQ_MODE is active.

function dimensionCatalogLines(): string {
  return PIQ_RUBRIC_DIMENSIONS
    .map((d) => `- ${d.dimension} (${d.name}) — ${d.description}`)
    .join('\n');
}

function primaryDimensionsLine(pt: PIQPromptType): string {
  const primary = PRIMARY_DIMENSIONS_BY_PIQ[pt];
  if (!primary || primary.length === 0) {
    return `Primary dimensions for ${pt}: [none flagged high-emphasis — evaluate all 13 equally].`;
  }
  return `Primary dimensions for ${pt}: [${primary.join(', ')}].`;
}

function promptName(pt: PIQPromptType): string {
  return PIQ_WEIGHT_PROFILES[pt]?.promptName ?? pt;
}

// ---------------------------------------------------------------------------
// PIQ_MODE block body — authored with a block-version marker
// ---------------------------------------------------------------------------
// This is the content that gets injected into L3.5's system prompt when the
// essay is a PIQ. The body is EVALUATIVE (L3.5 territory) so forbidden
// vocabulary (e.g. "effective", "compelling") is permitted — the block is
// declared `evaluative` in PROMPT_BLOCK_DECLARATIONS.

// @prompt-block A3_PIQ_RUBRIC
const PIQ_MODE_BODY_TEMPLATE = (pt: PIQPromptType) => `## PIQ_MODE ACTIVE

This essay is a UC Personal Insight Question — prompt **${pt}** (${promptName(pt)}).

Evaluate each sentence against the 13-dimension PIQ rubric in addition to the generic effectiveness score. Emit a \`piqDimensions\` object per sentence: \`{ dimension_key: score_0_to_10 }\` for the subset of dimensions the sentence meaningfully contributes to (0 = dimension not applicable or entirely absent from this sentence; higher = stronger evidence for that dimension). Use integer scores 0-10. If a sentence doesn't fit any of the 13 dimensions and you need to describe its contribution in free-text, emit that description in \`piqDimensionsOpen\` — this is the LLM-first escape hatch (OpenEnum convention).

### 13 PIQ rubric dimensions

${dimensionCatalogLines()}

### Prompt-specific emphasis

${primaryDimensionsLine(pt)}

Weight these primary dimensions more heavily when assessing effectiveness — an essay that executes the prompt-specific dimensions well can earn a higher effectiveness score even when less-emphasized dimensions are only competent. An essay that misses its primary dimensions cannot reach the top band regardless of polish elsewhere.

### Anti-clustering for PIQ_MODE (extends the generic anti-clustering rules)

In addition to the per-paragraph 20-point sentence spread required by the generic rules, your per-sentence \`piqDimensions\` scores MUST also spread across the paragraph's sentences: for each dimension the sentence scores on, the high and low across all sentences in the paragraph must differ by at least 3 points (on the 0-10 dimension scale). A paragraph where every sentence scores the same 7 on \`vulnerability_authenticity\` has failed dimension-wise differentiation — use dimension-specific evidence to justify spread. If a paragraph genuinely executes one dimension uniformly, document that in \`calibrationReflection\`.`;

/**
 * Build the A3 PIQ_MODE prompt block for a specific PIQ prompt type, wrapped
 * with block-version markers for cache-key divergence on bump.
 *
 * Returns empty string when piqPromptType is null/undefined — caller should
 * gate on `essayType === 'piq'` BEFORE calling this, so a null here indicates
 * a PIQ essay whose prompt couldn't be detected. In that case we skip the
 * block rather than inject a block with placeholder primary dimensions.
 */
export function buildPiqModeBlock(piqPromptType: PIQPromptType | null | undefined): string {
  if (!piqPromptType) return '';
  const body = PIQ_MODE_BODY_TEMPLATE(piqPromptType);
  return withPromptBlockVersion(body, 'A3_PIQ_RUBRIC');
}

/**
 * Extension to the L3.5 anti-clustering PROTOCOL section. Returns the
 * dimension-wise clause that's appended to the existing cross-paragraph
 * anti-clustering rules when PIQ_MODE is active.
 *
 * Kept as a separate export rather than folded into PIQ_MODE_BODY_TEMPLATE so
 * the main analysisPass.ts author can decide placement (inside PRE-SCORING
 * CALIBRATION vs as a standalone appended section) without having to carve
 * the template string.
 */
export function piqModeAntiClusteringClause(): string {
  return `**PIQ dimension-wise differentiation:** For each dimension that appears in \`piqDimensions\` across multiple sentences in this paragraph, the range between the highest and lowest dimension score (on the 0-10 scale) MUST be at least 3 points. If every sentence scores identically on a dimension, you are not discriminating on the prompt-specific axis — re-read with dimension-specific evidence.`;
}
