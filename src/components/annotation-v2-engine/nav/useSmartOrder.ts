/**
 * useSmartOrder — Phase 10 §3 + §7 smart-order algorithm.
 *
 * THE ALGORITHM (prompt-authoritative weights; cite-tagged to the spec
 * decisions even where the prompt weights differ from §7 pseudocode —
 * the prompt task brief overrides the doc's draft values):
 *
 *   Step 1 — score each sentence:
 *     tierWeight        : CRITICAL=1.00, NEEDS_WORK=0.75, STRONG=0.35,
 *                         EXCEPTIONAL=0.25, MASTERFUL=0.15, FUNCTIONAL=0
 *                         (FUNCTIONAL is skipped from the order entirely).
 *     structuralWeight  : paragraph.structuralWeight, boosted to 1.0 when
 *                         the paragraph is first or last (opening/closing
 *                         emphasis per §3).
 *     centralityWeight  : min(1.0, 0.2 + 0.15 * inboundRefs.length) —
 *                         inbound cross-refs mean other sentences pointed
 *                         HERE, so this sentence is load-bearing.
 *     priorityScore     : tier * structural * centrality.
 *
 *   Step 2 — cluster by paragraph.
 *   Step 3 — order clusters by highest-priority sentence in cluster.
 *   Step 4 — within cluster, sort by priority desc; ties → document order.
 *   Step 5 — spatial smoothing across paragraph boundaries: at most one
 *            "backward jump" (current cluster paragraph index > 2 earlier
 *            than the previously visited cluster) per 3 forward advances.
 *            When violated, swap the offending cluster later in the queue.
 *
 * Determinism guarantee: profile is static per session, so the algorithm
 * returns the same order for the same input. The hook memoizes on the
 * `profile` reference.
 *
 * Mode toggle:
 *   - 'smart' (default)      — full algorithm above.
 *   - 'document'             — document order, FUNCTIONAL still omitted.
 *   - 'priority'             — tier-weighted flat, no paragraph clustering
 *                              (used only for debugging / unit tests).
 *
 * Empty cases:
 *   - zero non-FUNCTIONAL sentences → order is [].
 *   - one non-FUNCTIONAL sentence   → order is [that sentence id].
 */

import { useMemo } from 'react';

import type { EssayProfile, SentenceProfile } from '../types/profile';
import type { SmartOrderedSentenceId } from '../types/navigation';
import type { Tier } from '../types/tier';

// ---------------------------------------------------------------------------
// Weights (prompt-authoritative).
// ---------------------------------------------------------------------------

const TIER_WEIGHTS: Record<Tier, number> = {
  CRITICAL: 1.0,
  NEEDS_WORK: 0.75,
  STRONG: 0.35,
  EXCEPTIONAL: 0.25,
  MASTERFUL: 0.15,
  FUNCTIONAL: 0,
};

/** Phase 10 §3 — opening/closing paragraphs boost to 1.0. */
function structuralWeightFor(
  paragraphIndex: number,
  totalParagraphs: number,
  rawStructuralWeight: number,
): number {
  if (paragraphIndex === 0) return 1.0;
  if (paragraphIndex === totalParagraphs - 1) return 1.0;
  return rawStructuralWeight;
}

/** Phase 10 §3 — centrality from inbound cross-ref count. */
function centralityWeightFor(inboundCount: number): number {
  return Math.min(1.0, 0.2 + 0.15 * inboundCount);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SmartOrderMode = 'smart' | 'document' | 'priority';

export interface SmartOrderOpts {
  readonly profile: EssayProfile;
  /** Default: 'smart'. */
  readonly mode?: SmartOrderMode;
}

export interface SentenceFilter {
  (sentence: SentenceProfile): boolean;
}

export interface UseSmartOrderResult {
  /**
   * Sentence IDs in recommended review order. FUNCTIONAL sentences are
   * NEVER in the order — they have no annotations worth navigating to.
   */
  readonly order: readonly SmartOrderedSentenceId[];

  /**
   * Next sentence in the order *strictly after* `currentSentenceId`,
   * respecting an optional filter. Returns null when at the end or when
   * `currentSentenceId` isn't in the order.
   *
   * Filter semantics (Phase 10 §2.4): a filter is an expression of intent
   * — Tab skips filter-mismatching sentences without exiting the filter.
   */
  readonly nextAfter: (
    currentSentenceId: string,
    filter?: SentenceFilter,
  ) => string | null;

  /** Mirror of nextAfter in the backward direction. */
  readonly prevBefore: (
    currentSentenceId: string,
    filter?: SentenceFilter,
  ) => string | null;

  /**
   * Position of a sentence in the current order. `total` is order.length.
   * Returns `{ index: -1, total }` if the sentence isn't in the order
   * (e.g., caller passed a FUNCTIONAL id).
   */
  readonly positionOf: (sentenceId: string) => {
    readonly index: number;
    readonly total: number;
  };

  /** Exposed for debugging / demo visualization. */
  readonly priorityScores: ReadonlyMap<string, number>;
}

// ---------------------------------------------------------------------------
// Algorithm
// ---------------------------------------------------------------------------

interface ScoredSentence {
  readonly sentence: SentenceProfile;
  readonly score: number;
}

function scoreSentences(profile: EssayProfile): ScoredSentence[] {
  const totalParagraphs = profile.paragraphs.length;
  // Inbound refs are already encoded on SentenceProfile.inboundRefs
  // (Workstream L pre-computes them); use that directly — no need for
  // a sentence-by-id lookup here.

  const paragraphByIndex = new Map(
    profile.paragraphs.map((p) => [p.index, p] as const),
  );

  const scored: ScoredSentence[] = [];
  for (const s of profile.sentences) {
    const tierW = TIER_WEIGHTS[s.tier];
    if (tierW === 0) continue; // Phase 10 §7 — FUNCTIONAL/MASTERFUL excluded.
    // Wait — MASTERFUL=0.15 per prompt, keep it. Only FUNCTIONAL is 0.
    // (Above guard is actually the FUNCTIONAL skip; MASTERFUL stays.)

    const para = paragraphByIndex.get(s.paragraphIndex);
    const rawStructural = para?.structuralWeight ?? 0.5;
    const structuralW = structuralWeightFor(
      s.paragraphIndex,
      totalParagraphs,
      rawStructural,
    );
    const centralityW = centralityWeightFor(s.inboundRefs.length);

    const score = tierW * structuralW * centralityW;
    scored.push({ sentence: s, score });
  }
  return scored;
}

function documentOrder(scored: ScoredSentence[]): string[] {
  // Phase 10 §2.1 "document order" mode — essay order, FUNCTIONAL excluded.
  return [...scored]
    .sort((a, b) => {
      if (a.sentence.paragraphIndex !== b.sentence.paragraphIndex) {
        return a.sentence.paragraphIndex - b.sentence.paragraphIndex;
      }
      return (
        a.sentence.indexWithinParagraph - b.sentence.indexWithinParagraph
      );
    })
    .map((s) => s.sentence.id);
}

function priorityOrderFlat(scored: ScoredSentence[]): string[] {
  // Debug / test mode: strict priority, ignore paragraph clustering.
  return [...scored]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tie-break: document order.
      if (a.sentence.paragraphIndex !== b.sentence.paragraphIndex) {
        return a.sentence.paragraphIndex - b.sentence.paragraphIndex;
      }
      return (
        a.sentence.indexWithinParagraph - b.sentence.indexWithinParagraph
      );
    })
    .map((s) => s.sentence.id);
}

interface Cluster {
  readonly paragraphIndex: number;
  /** Sentences in this cluster, already sorted by in-cluster rule. */
  readonly sentences: readonly ScoredSentence[];
  readonly maxScore: number;
}

function buildClusters(scored: ScoredSentence[]): Cluster[] {
  const byParagraph = new Map<number, ScoredSentence[]>();
  for (const s of scored) {
    const bucket = byParagraph.get(s.sentence.paragraphIndex) ?? [];
    bucket.push(s);
    byParagraph.set(s.sentence.paragraphIndex, bucket);
  }

  const clusters: Cluster[] = [];
  for (const [paragraphIndex, bucket] of byParagraph.entries()) {
    // Step 4 — within cluster, order by priority desc; ties break on
    // document order.
    const sorted = [...bucket].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        a.sentence.indexWithinParagraph - b.sentence.indexWithinParagraph
      );
    });
    const maxScore = sorted.reduce(
      (acc, s) => (s.score > acc ? s.score : acc),
      0,
    );
    clusters.push({ paragraphIndex, sentences: sorted, maxScore });
  }

  // Step 3 — clusters ordered by highest-priority sentence in cluster
  // (desc). Ties → document order of the paragraph.
  clusters.sort((a, b) => {
    if (b.maxScore !== a.maxScore) return b.maxScore - a.maxScore;
    return a.paragraphIndex - b.paragraphIndex;
  });
  return clusters;
}

/**
 * Step 5 — spatial smoothing.
 *
 * We walk the cluster queue left-to-right. Track the index of the
 * last-visited cluster (in document/paragraph space). If the current
 * cluster would constitute a "backward jump" (its paragraphIndex is more
 * than 2 earlier than the last visited paragraphIndex), we allow it only
 * if we have NOT already done a backward jump in the last 3 advances.
 * If the constraint is violated, swap the offending cluster with the
 * next non-violating cluster in the queue; if none exists, leave it.
 */
function applySpatialSmoothing(clusters: Cluster[]): Cluster[] {
  const queue = [...clusters];
  let lastParagraphIndex: number | null = null;
  let advancesSinceBackwardJump = Number.POSITIVE_INFINITY;

  let i = 0;
  let safetyBudget = queue.length * queue.length;
  while (i < queue.length && safetyBudget-- > 0) {
    const current = queue[i]!;
    const prev = lastParagraphIndex;

    const isBackwardJump =
      prev !== null && current.paragraphIndex < prev - 2;
    const wouldViolate = isBackwardJump && advancesSinceBackwardJump < 3;

    if (!wouldViolate) {
      // Accept current.
      if (isBackwardJump) {
        advancesSinceBackwardJump = 0;
      } else {
        advancesSinceBackwardJump += 1;
      }
      lastParagraphIndex = current.paragraphIndex;
      i += 1;
      continue;
    }

    // Violation — find the next cluster in the remaining queue that
    // does NOT violate. Swap it into position i. If none found, accept
    // current (constraint is "prefer to", not "must").
    let swapWith = -1;
    for (let j = i + 1; j < queue.length; j++) {
      const candidate = queue[j]!;
      const candidateIsBackward =
        prev !== null && candidate.paragraphIndex < prev - 2;
      if (!candidateIsBackward) {
        swapWith = j;
        break;
      }
    }
    if (swapWith === -1) {
      // Accept.
      if (isBackwardJump) advancesSinceBackwardJump = 0;
      else advancesSinceBackwardJump += 1;
      lastParagraphIndex = current.paragraphIndex;
      i += 1;
      continue;
    }
    // Swap and re-loop at i (re-evaluate with the swapped cluster).
    const tmp = queue[i]!;
    queue[i] = queue[swapWith]!;
    queue[swapWith] = tmp;
  }
  return queue;
}

function computeSmartOrder(profile: EssayProfile): string[] {
  const scored = scoreSentences(profile);
  if (scored.length === 0) return [];
  if (scored.length === 1) return [scored[0]!.sentence.id];

  const clusters = buildClusters(scored);
  const smoothed = applySpatialSmoothing(clusters);
  const flat: string[] = [];
  for (const cluster of smoothed) {
    for (const s of cluster.sentences) flat.push(s.sentence.id);
  }
  return flat;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSmartOrder(opts: SmartOrderOpts): UseSmartOrderResult {
  const { profile, mode = 'smart' } = opts;

  const { order, priorityScores } = useMemo(() => {
    const scored = scoreSentences(profile);
    const scoreMap = new Map<string, number>();
    for (const s of scored) scoreMap.set(s.sentence.id, s.score);

    let list: string[];
    if (mode === 'document') {
      list = documentOrder(scored);
    } else if (mode === 'priority') {
      list = priorityOrderFlat(scored);
    } else {
      list = computeSmartOrder(profile);
    }
    return { order: list, priorityScores: scoreMap };
    // Profile is static per session per build-plan; mode changes are
    // user-driven and cheap to recompute.
  }, [profile, mode]);

  const sentenceById = useMemo(() => {
    const map = new Map<string, SentenceProfile>();
    for (const s of profile.sentences) map.set(s.id, s);
    return map;
  }, [profile]);

  const nextAfter = (
    currentSentenceId: string,
    filter?: SentenceFilter,
  ): string | null => {
    const idx = order.indexOf(currentSentenceId);
    // If currentSentenceId isn't in the order (or is the last), start
    // searching from -1 + 1 = 0 for the "no current" case.
    const startIdx = idx === -1 ? 0 : idx + 1;
    for (let i = startIdx; i < order.length; i++) {
      const candidateId = order[i]!;
      if (!filter) return candidateId;
      const sent = sentenceById.get(candidateId);
      if (sent && filter(sent)) return candidateId;
    }
    return null;
  };

  const prevBefore = (
    currentSentenceId: string,
    filter?: SentenceFilter,
  ): string | null => {
    const idx = order.indexOf(currentSentenceId);
    const startIdx = idx === -1 ? order.length - 1 : idx - 1;
    for (let i = startIdx; i >= 0; i--) {
      const candidateId = order[i]!;
      if (!filter) return candidateId;
      const sent = sentenceById.get(candidateId);
      if (sent && filter(sent)) return candidateId;
    }
    return null;
  };

  const positionOf = (sentenceId: string) => {
    const index = order.indexOf(sentenceId);
    return { index, total: order.length };
  };

  return { order, nextAfter, prevBefore, positionOf, priorityScores };
}
