/**
 * useTierCounts — derives `Record<Tier, number>` from a profile, with
 * optional filter-aware counting.
 *
 * Used by TierHistogram to size the horizontal bars. Phase 11 §2.5
 * mandates counts only (no percentages, no aggregate scores); the
 * histogram's "magnitude-first" rule is preserved by returning raw
 * integers — never ratios.
 *
 * The counter is sentence-keyed: a sentence with three annotations
 * contributes 1 to its tier's count, not 3. This matches the "How
 * many sentences per tier" question students actually ask in
 * planning mode (per Phase 11 §2.5 rationale).
 */

import { useMemo } from 'react';

import type { Tier } from '../tokens';
import type { EssayProfile } from '../types/profile';
import type { FilterState } from '../types/navigation';

const ZERO_COUNTS: Record<Tier, number> = {
  CRITICAL: 0,
  NEEDS_WORK: 0,
  FUNCTIONAL: 0,
  STRONG: 0,
  EXCEPTIONAL: 0,
  MASTERFUL: 0,
};

const STRENGTH_TIERS: ReadonlySet<Tier> = new Set<Tier>([
  'STRONG',
  'EXCEPTIONAL',
  'MASTERFUL',
]);

const CRITICAL_TIERS: ReadonlySet<Tier> = new Set<Tier>([
  'CRITICAL',
  'NEEDS_WORK',
]);

export interface UseTierCountsOptions {
  /**
   * If present, counts only sentences that would survive the given
   * filter. Unreviewed-filter is opaque here — the hook receives just
   * the tier/type signals — so unreviewed is applied by `useListFilter`
   * downstream; we intentionally ignore it in the histogram to keep
   * "how many critical sentences exist" stable regardless of reading
   * progress (Phase 11 §2.5 "magnitude is the load-bearing signal").
   */
  readonly filter?: FilterState;
}

/**
 * Per-tier sentence counts.
 *
 * Only sentences that carry at least one L5 annotation contribute —
 * a FUNCTIONAL sentence with zero annotations is NOT counted, because
 * §4.3 excludes FUNCTIONAL from the histogram (sage/no-underline is
 * not actionable). The hook still returns a numeric entry for every
 * tier (zero for tiers with no sentences) so downstream renderers
 * don't have to guard missing keys.
 */
export function useTierCounts(
  profile: EssayProfile,
  options: UseTierCountsOptions = {},
): Record<Tier, number> {
  const { filter } = options;

  return useMemo<Record<Tier, number>>(() => {
    const counts: Record<Tier, number> = { ...ZERO_COUNTS };

    // Build a set of sentence IDs that carry ≥1 L5 annotation so we
    // only count annotated sentences.
    const annotatedSentenceIds = new Set<string>();
    for (const a of profile.annotations) {
      annotatedSentenceIds.add(a.sentenceId);
    }

    for (const sentence of profile.sentences) {
      if (!annotatedSentenceIds.has(sentence.id)) continue;

      // Filter-aware counting — §2.5 only the magnitude view changes
      // when a filter is active, not the tier labels.
      if (filter) {
        if (filter.critical && !CRITICAL_TIERS.has(sentence.tier)) continue;
        if (filter.strengths && !STRENGTH_TIERS.has(sentence.tier)) continue;
      }

      counts[sentence.tier] += 1;
    }

    return counts;
  }, [profile, filter]);
}
