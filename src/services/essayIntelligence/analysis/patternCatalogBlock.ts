/**
 * Port B1 — L3.5 Pattern Catalog Prompt Block
 *
 * Wraps the taxonomy index (`taxonomies/issuePatternIndex.ts`) into a
 * block-tagged prompt body for injection into the L3.5 analysis pass.
 * Kept separate from `analysisPass.ts` so the descriptive-contract lint's
 * `@prompt-block B1_PATTERN_LIBRARY` anchor binds to a small, auditable
 * template literal rather than being buried inside a 2000-line prompt
 * builder.
 *
 * Gating:
 *   - essayType === 'piq' → PIQ-pool catalog (top-15)
 *   - essayType === 'common_app' → Common-App-pool catalog (top-15)
 *   - essayType === 'supplement' → supplement-pool catalog (currently
 *     re-uses Common App pool; top-15)
 *   - essayType null/undefined → empty string (no catalog injected,
 *     baseline cache preserved for callers without an essayType hint)
 *
 * Output budget: ~900 tokens (15 catalog lines × ~60 tokens). Block lives
 * inside the cached system prompt — one block per essayType per deploy,
 * served from Anthropic's prompt cache across all paragraph calls.
 *
 * B1_PATTERN_LIBRARY is declared `evaluative` in PROMPT_BLOCK_DECLARATIONS
 * (L3.5 territory). Forbidden vocabulary is PERMITTED inside the block.
 *
 * Ref: docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §3 Port B1.
 */

import type { EssayType } from '../profileTypes';
import {
  getFilteredCatalog,
  renderCatalogLines,
  PATTERN_INDEX,
  isKnownPatternId,
  type PatternSummary,
} from '../taxonomies/issuePatternIndex';
import { withPromptBlockVersion } from '../../../lib/llm/promptBlockVersions';

// Re-export so analysisPass.ts can validate patternIds at parse time without
// a second import path.
export { PATTERN_INDEX, isKnownPatternId };
export type { PatternSummary };

/**
 * Top-N slice size per verdict §3 Port B1 (15 entries × ~60 tokens ≈ 900
 * tokens cached per essayType). Exposed so tests can assert the budget.
 */
export const PATTERN_CATALOG_TOP_N = 15;

/**
 * Build the L3.5 pattern-catalog block body for an essayType. Returns empty
 * string when no catalog should be injected (non-PIQ / non-CommonApp /
 * non-supplement essay, or no essayType hint). Callers compose this into
 * the cached system prompt via `buildSystemPrompt()`.
 *
 * The returned string is wrapped with block-version markers by
 * `withPromptBlockVersion(..., 'B1_PATTERN_LIBRARY')` so Anthropic's prompt
 * cache re-keys on version bumps without invalidating the surrounding
 * cached prompt.
 */
export function buildPatternCatalogBlock(
  essayType: EssayType | null | undefined,
): string {
  if (!essayType) return '';
  if (essayType !== 'piq' && essayType !== 'common_app' && essayType !== 'supplement') {
    return '';
  }

  const summaries = getFilteredCatalog(essayType, PATTERN_CATALOG_TOP_N);
  if (summaries.length === 0) return '';

  const catalogLines = renderCatalogLines(summaries);
  const poolLabel =
    essayType === 'piq'
      ? 'PIQ (UC Personal Insight Question)'
      : essayType === 'supplement'
      ? 'Supplement (re-uses Common App pool)'
      : 'Common App personal statement';

  // @prompt-block B1_PATTERN_LIBRARY
  const body = `## KNOWN PATTERN CATALOG (reference only — emit ID + quote text; say \`open\` if none fit)

Essay type: ${poolLabel}.
The following named failure patterns come from the R&D issue-pattern library. Use them for DIAGNOSIS CROSS-REFERENCE only — they extend (not replace) your own reading of each sentence. When a sentence matches a pattern, emit its namespaced ID plus a quoted evidence span. When a real failure doesn't fit any listed pattern, use the \`open\` escape hatch with a free-text description and leave \`patternId\` null.

**Scope discipline (mandatory):**
- Sentence-local matches (one sentence's language triggers the pattern) → emit on that sentence's \`patternMatches[]\`.
- Architectural-scope matches (hook/arc/coherence patterns spanning multiple sentences) → emit once on the paragraph's \`paragraphPatternMatches[]\`, NOT per sentence.
- Do NOT duplicate a pattern across sentences for the same underlying architectural issue — choose the single most representative sentence or promote to paragraph scope.

**Emission rules:**
- \`patternId\` — namespaced catalog ID verbatim (e.g. \`piq:hook-weak-generic\`) when a listed pattern fits. Leave null when emitting via \`open\`.
- \`open\` — free-text description (≤120 chars) when no listed pattern fits. Leave null when emitting via \`patternId\`.
- \`evidence\` — quoted text span from the sentence/paragraph that triggered the match (MAX 15 words).
- \`confidence\` — 0.0 to 1.0, your certainty this match applies in THIS essay's context.
- \`severity\` — your read of severity IN CONTEXT ('critical' | 'major' | 'minor' | null). The library-level severity is a default; a critical-tier pattern may land as 'minor' when the surrounding essay offsets the failure.
- At least one of \`patternId\` or \`open\` MUST be non-null per match entry. Entries with both null are discarded.

**Do not:**
- Do not emit a match just because a trigger phrase appears — only emit when the pattern's semantic failure mode is actually present. A sentence containing "I have always" that earns its voice through specific detail is NOT \`piq:hook-weak-generic\`.
- Do not enumerate every catalog entry for every sentence. Most sentences will have zero pattern matches. Mediocre essays should surface 3-8 matches total across all paragraphs, not 40.
- Do not use this catalog as a replacement for the effectiveness score or the weaknesses observation array. patternMatches is a SUPPLEMENT to those fields, not a substitute.

**Catalog (top ${summaries.length} by severity, dimension-balanced):**

${catalogLines}

If a real failure mode recurs across essays and doesn't fit any listed pattern, emit it via \`open\` — recurring \`open\` values are the feedback loop for library expansion.`;

  return withPromptBlockVersion(body, 'B1_PATTERN_LIBRARY');
}
