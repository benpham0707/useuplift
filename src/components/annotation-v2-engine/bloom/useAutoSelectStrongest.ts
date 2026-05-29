/**
 * useAutoSelectStrongest — resolves the two sentence-id anchors
 * that drive Phase 5's auto-selection and "Start here" chip.
 *
 * Authority:
 *   - docs/ux_phases/phase_5_first_reveal.md §2.6 "First Auto-Selection"
 *     and §6 copy deck (which confirms "Start here" targets the top
 *     CRITICAL / NEEDS WORK annotation).
 *   - docs/ux_phases/phase_5_first_reveal.md §2.6 tie-break rules:
 *     "highest-effectiveness-score STRONG+ sentence. Tie-break:
 *      earliest in essay (simpler to locate). Second tie-break:
 *      longest sentence."
 *
 * Returns `null` for either anchor when the essay lacks the relevant
 * tier inhabitants. Phase 5 §2.6 spec fallback: if `strongestSentenceId`
 * is null, auto-selection is skipped and the "Start here" chip is
 * promoted; `useBloomChoreography` owns that branching.
 */

import { useMemo } from 'react';

import type { EssayProfile, SentenceProfile } from '../types/profile';
import type { Tier } from '../tokens';

// Phase 5 §2.6 — STRONG+ tier set for strongest-sentence resolution.
// FUNCTIONAL is intentionally excluded (it's not a strength, just "working").
const STRONG_PLUS_TIERS: ReadonlySet<Tier> = new Set<Tier>([
  'STRONG',
  'EXCEPTIONAL',
  'MASTERFUL',
]);

// Phase 5 §6 copy deck #14 — "Start with the top thing to try" targets
// the top-priority unresolved CRITICAL / NEEDS_WORK annotation. Matches
// `topThingsToTry[0].sentenceId` when present, but we resolve from the
// raw annotations so the chip still works if the overview list is empty.
const CRITICAL_TIERS: ReadonlySet<Tier> = new Set<Tier>([
  'CRITICAL',
  'NEEDS_WORK',
]);

/**
 * Phase 5 §2.6 tier priority for tie-breaking on *equal* effectiveness
 * scores. Higher value = higher preference (MASTERFUL > EXCEPTIONAL > STRONG).
 * Non-strength tiers stamped 0 for exhaustiveness; they never compete here
 * because the candidate-filter gate (STRONG_PLUS_TIERS) excludes them first.
 */
const TIER_PREFERENCE: Record<Tier, number> = {
  CRITICAL: 0,
  NEEDS_WORK: 0,
  FUNCTIONAL: 0,
  STRONG: 1,
  EXCEPTIONAL: 2,
  MASTERFUL: 3,
};

export interface AutoSelectResult {
  /**
   * Phase 5 §2.6 — the single highest-effectiveness STRONG+ sentence.
   * Null when the essay contains no STRONG+ sentences (the "no STRONG+
   * exists" edge case; Phase 5 §2.6 fallback applies).
   */
  readonly strongestSentenceId: string | null;
  /**
   * Phase 5 §2.6 — the top-priority unresolved CRITICAL / NEEDS_WORK
   * annotation's sentence id. Null when no such annotation exists.
   * This is the "Start here" chip's click target.
   */
  readonly topCriticalSentenceId: string | null;
}

function chooseStrongest(
  sentences: readonly SentenceProfile[],
): string | null {
  let best: SentenceProfile | null = null;

  for (const s of sentences) {
    if (!STRONG_PLUS_TIERS.has(s.tier)) continue;

    if (best === null) {
      best = s;
      continue;
    }

    // Phase 5 §2.6 primary: highest effectiveness.
    if (s.effectiveness > best.effectiveness) {
      best = s;
      continue;
    }
    if (s.effectiveness < best.effectiveness) continue;

    // Tie on effectiveness — apply §2.6 tie-break ladder.

    // (a) Prefer higher tier. Spec says "earliest in essay" as primary
    // tie-break, but "MASTERFUL > EXCEPTIONAL > STRONG" is the explicit
    // task-spec tie-break we were asked to honor (and is editorially
    // correct — a MASTERFUL score of 97 should win over a STRONG 97).
    const sPref = TIER_PREFERENCE[s.tier];
    const bestPref = TIER_PREFERENCE[best.tier];
    if (sPref > bestPref) {
      best = s;
      continue;
    }
    if (sPref < bestPref) continue;

    // (b) Same effectiveness + same tier preference — fall through to
    // §2.6's "earliest in essay" rule. Sentences are assumed to be in
    // document order; earlier paragraphIndex wins, then
    // indexWithinParagraph.
    if (
      s.paragraphIndex < best.paragraphIndex ||
      (s.paragraphIndex === best.paragraphIndex &&
        s.indexWithinParagraph < best.indexWithinParagraph)
    ) {
      best = s;
      continue;
    }

    // (c) Final fallback per §2.6 — "longest sentence (more to teach from)".
    if (
      s.paragraphIndex === best.paragraphIndex &&
      s.indexWithinParagraph === best.indexWithinParagraph
    ) {
      // Identical position (shouldn't happen for distinct IDs, defensive).
      if (s.text.length > best.text.length) best = s;
    }
  }

  return best ? best.id : null;
}

function chooseTopCritical(
  profile: EssayProfile,
): string | null {
  // Phase 5 §6 / §2.3: `topThingsToTry` is the pre-sorted admin choice.
  // If populated, the zeroth entry is authoritative.
  if (profile.overview.topThingsToTry.length > 0) {
    const candidate = profile.overview.topThingsToTry[0];
    // Defensive: only accept if the referenced sentence's tier is
    // actually CRITICAL / NEEDS_WORK (the spec category for "Start here").
    const sentence = profile.sentences.find(
      (s) => s.id === candidate.sentenceId,
    );
    if (sentence && CRITICAL_TIERS.has(sentence.tier)) {
      return candidate.sentenceId;
    }
  }

  // Fallback: scan annotations, prefer lowest priority number
  // (Phase 8 §2.8 "0 = highest priority"), break ties by earliest
  // document position, prefer CRITICAL over NEEDS_WORK.
  let bestId: string | null = null;
  let bestPriority = Number.POSITIVE_INFINITY;
  let bestTierRank = Number.POSITIVE_INFINITY;
  let bestPos = Number.POSITIVE_INFINITY;

  for (const ann of profile.annotations) {
    const sentence = profile.sentences.find((s) => s.id === ann.sentenceId);
    if (!sentence) continue;
    if (!CRITICAL_TIERS.has(sentence.tier)) continue;

    const tierRank = sentence.tier === 'CRITICAL' ? 0 : 1;
    const pos =
      sentence.paragraphIndex * 1000 + sentence.indexWithinParagraph;

    if (
      ann.priority < bestPriority ||
      (ann.priority === bestPriority && tierRank < bestTierRank) ||
      (ann.priority === bestPriority &&
        tierRank === bestTierRank &&
        pos < bestPos)
    ) {
      bestId = ann.sentenceId;
      bestPriority = ann.priority;
      bestTierRank = tierRank;
      bestPos = pos;
    }
  }

  return bestId;
}

export function useAutoSelectStrongest(
  profile: EssayProfile,
): AutoSelectResult {
  // Profile is static per-session (the demo mutates `profile` only via
  // explicit prop swaps), so the memo key is the profile identity.
  return useMemo(
    () => ({
      strongestSentenceId: chooseStrongest(profile.sentences),
      topCriticalSentenceId: chooseTopCritical(profile),
    }),
    [profile],
  );
}
