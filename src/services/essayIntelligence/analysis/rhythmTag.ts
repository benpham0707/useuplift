/**
 * rhythmTag.ts — Runtime validator/normalizer for SentenceCraft.rhythm.
 *
 * Used by:
 *   - sequentialDeepWalk.parseSentenceCraft() (L3 walk output parser)
 *   - Any other consumer that reads rhythm from LLM JSON
 *
 * Why a standalone module: `strict: false` is set in tsconfig, so the
 * `RhythmTag` literal union CANNOT be enforced at compile time — the parser
 * has to do runtime validation. This module centralizes that normalization
 * so two different parsers don't drift.
 *
 * Scope 1 Phase 1: the L3 walk prompt still emits prose rhythm descriptions
 * ("three short clauses building tension") in Phase 1. Phase 2's prompt
 * update switches to enum emission. This normalizer handles both forms:
 * exact enum matches pass through, prose is scanned for enum keywords,
 * and anything unrecognized falls back to '' (uncharacterized).
 */

import type { RhythmTag } from '../profileTypes';

/**
 * Closed set of valid RhythmTag values — must stay in sync with the
 * `RhythmTag` union in `profileTypes.ts:~405`.
 *
 * Order matters for the prose-scan fallback below: longer / more specific
 * tokens MUST come before shorter ones to avoid false matches (e.g.
 * `short_punch` would otherwise match a substring of `short`).
 */
export const VALID_RHYTHM_TAGS: readonly RhythmTag[] = [
  '',
  'short_punch',
  'medium_flow',
  'long_build',
  'fragment',
  'staccato',
  'anaphora_series',
  'parallel_build',
  'subordinate_delay',
];

/**
 * Normalize arbitrary LLM output to a valid RhythmTag.
 *
 * Handles three cases in order:
 *   1. Exact enum match (after lowercasing and `-`/space → `_` substitution).
 *   2. Prose contains a recognizable enum keyword (Phase 1 tolerance for
 *      prompt-mode output like "short_punch — mirrors staccato pattern").
 *   3. Anything else → '' (uncharacterized).
 *
 * After Phase 2 lands the prompt update, Case 1 should hit ~95% of the time
 * and Cases 2/3 become rare fallbacks.
 */
export function normalizeRhythmTag(raw: unknown): RhythmTag {
  if (typeof raw !== 'string' || raw.length === 0) return '';
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');

  // Case 1: exact match against the closed set.
  if ((VALID_RHYTHM_TAGS as readonly string[]).includes(normalized)) {
    return normalized as RhythmTag;
  }

  // Case 2: prose contains an enum keyword. Check longest first to avoid
  // substring ambiguity (e.g., `short_punch` vs `short`).
  const keywordOrder: RhythmTag[] = [
    'subordinate_delay',
    'anaphora_series',
    'parallel_build',
    'medium_flow',
    'short_punch',
    'long_build',
    'fragment',
    'staccato',
  ];
  for (const keyword of keywordOrder) {
    if (normalized.includes(keyword)) return keyword;
  }

  // Case 3: unrecognized → empty
  return '';
}
