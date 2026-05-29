// ============================================================================
// findCandidateAnchors — Q1 hybrid MEM lookup tests
// ============================================================================
// Validates the pure helper that builds `candidateAnchors[]` for a RewriteGap
// from a CoachingMap priority + MomentEarnednessMap. The LLM picks the best
// anchor at draft time; this helper just enumerates the matches and sorts
// them in essay reading order.

import { describe, it, expect } from 'vitest';

import { findCandidateAnchors } from '../../src/services/essayIntelligence/analysis/rewriteGeneration';
import type {
  CoachingMap,
  MomentEarnednessMap,
  EarnedMoment,
} from '../../src/services/essayIntelligence/profileTypes';

// ───────────────────────────────────────────────────────────────────────────
// Fixtures
// ───────────────────────────────────────────────────────────────────────────

/** Build a minimal CoachingMap priority. */
function makePriority(
  targetParagraphs: number[],
  overrides: Partial<CoachingMap['priorities'][number]> = {},
): CoachingMap['priorities'][number] {
  return {
    priority: overrides.priority ?? 'Bridge the temporal leap',
    target: {
      paragraphs: targetParagraphs,
      description: overrides.target?.description ?? 'between P2 and P3',
    },
    architecturalReason: overrides.architecturalReason ?? 'P2 carries struggle, P3 claims mastery',
    unlocksNext: overrides.unlocksNext ?? 'gift-giving purpose becomes natural',
    expectedImpact: overrides.expectedImpact ?? 'transformative',
    consolidatedFrom: overrides.consolidatedFrom,
  };
}

/** Build a minimal EarnedMoment. */
function makeMoment(
  paragraph: number,
  sentence: number,
  description: string,
  overrides: Partial<EarnedMoment> = {},
): EarnedMoment {
  return {
    location: { paragraph, sentence },
    momentType: overrides.momentType ?? 'intellectual',
    description,
    payload: overrides.payload ?? 'payload',
    mechanisms: overrides.mechanisms ?? [],
    gaps: overrides.gaps ?? [],
  };
}

/** Build a MomentEarnednessMap from a list of moments. */
function makeMEM(moments: EarnedMoment[]): MomentEarnednessMap {
  return { moments, structuralObservation: 'test observation' };
}

// ───────────────────────────────────────────────────────────────────────────
// 1. Real Crochet-shaped case — the canonical scenario
// ───────────────────────────────────────────────────────────────────────────

describe('findCandidateAnchors — Crochet temporal-leap priority', () => {
  // Priority: "Bridge the temporal leap between P2 and P3" → target [2, 3] (0-indexed)
  // MEM has one moment at P4S2 (location.paragraph=3, location.sentence=1) —
  // the mastery claim. That's the anchor the LLM should see as a candidate.
  it('matches the MEM moment at the mastery claim (P4S2 → location.paragraph=3)', () => {
    const priority = makePriority([2, 3]);
    const mem = makeMEM([
      makeMoment(3, 1, "The mastery claim: 'I learned to channel the magic of the crochet hook'", {
        momentType: 'intellectual',
        gaps: ['intellectual_scaffolding—the essay elides the entire learning process'],
      }),
    ]);

    const result = findCandidateAnchors(priority, mem);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      paragraph: 3,
      sentence: 1,
      source: 'mem_moment',
      momentDescription: "The mastery claim: 'I learned to channel the magic of the crochet hook'",
    });
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 2. Empty cases
// ───────────────────────────────────────────────────────────────────────────

describe('findCandidateAnchors — empty cases', () => {
  it('empty memMap.moments returns []', () => {
    const priority = makePriority([2, 3]);
    const mem = makeMEM([]);
    expect(findCandidateAnchors(priority, mem)).toEqual([]);
  });

  it('empty priority.target.paragraphs returns []', () => {
    const priority = makePriority([]);
    const mem = makeMEM([makeMoment(2, 1, 'a moment'), makeMoment(3, 0, 'another moment')]);
    expect(findCandidateAnchors(priority, mem)).toEqual([]);
  });

  it('no paragraph overlap returns []', () => {
    const priority = makePriority([5, 6]);
    const mem = makeMEM([makeMoment(0, 0, 'opening moment'), makeMoment(2, 1, 'middle moment')]);
    expect(findCandidateAnchors(priority, mem)).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 3. Multiple matches in same paragraph (sorted by sentence)
// ───────────────────────────────────────────────────────────────────────────

describe('findCandidateAnchors — multiple moments in same paragraph', () => {
  it('returns all moments in the matched paragraph, sorted by sentence ascending', () => {
    const priority = makePriority([2]);
    const mem = makeMEM([
      makeMoment(2, 5, 'fifth-sentence moment'),
      makeMoment(2, 1, 'first-sentence moment'),
      makeMoment(2, 3, 'third-sentence moment'),
    ]);

    const result = findCandidateAnchors(priority, mem);
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.sentence)).toEqual([1, 3, 5]);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 4. Multiple matches across multiple paragraphs (sorted by paragraph, then sentence)
// ───────────────────────────────────────────────────────────────────────────

describe('findCandidateAnchors — multiple moments across paragraphs', () => {
  it('returns all matched moments, sorted by (paragraph, sentence) ascending', () => {
    const priority = makePriority([1, 2, 3]);
    const mem = makeMEM([
      makeMoment(3, 2, 'P3S2 moment'),
      makeMoment(1, 0, 'P1S0 moment'),
      makeMoment(2, 5, 'P2S5 moment'),
      makeMoment(2, 1, 'P2S1 moment'),
      makeMoment(3, 0, 'P3S0 moment'),
    ]);

    const result = findCandidateAnchors(priority, mem);
    expect(result).toHaveLength(5);
    expect(result.map((c) => `P${c.paragraph}S${c.sentence}`)).toEqual([
      'P1S0',
      'P2S1',
      'P2S5',
      'P3S0',
      'P3S2',
    ]);
  });

  it('does NOT return moments from non-matching paragraphs', () => {
    const priority = makePriority([2]);
    const mem = makeMEM([
      makeMoment(0, 0, 'opening'),
      makeMoment(1, 0, 'second'),
      makeMoment(2, 0, 'matched'),
      makeMoment(3, 0, 'fourth'),
      makeMoment(4, 0, 'closing'),
    ]);

    const result = findCandidateAnchors(priority, mem);
    expect(result).toHaveLength(1);
    expect(result[0].paragraph).toBe(2);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 5. Defensive: duplicate paragraph indices in priority.target.paragraphs
// ───────────────────────────────────────────────────────────────────────────

describe('findCandidateAnchors — duplicate target paragraphs', () => {
  it('does NOT produce duplicate candidates when target.paragraphs has dupes', () => {
    // LLM-emitted target.paragraphs could in theory contain duplicates.
    // The Set-based lookup tolerates this without producing duplicate matches.
    const priority = makePriority([2, 2, 3, 2]);
    const mem = makeMEM([makeMoment(2, 0, 'moment at P2'), makeMoment(3, 1, 'moment at P3')]);

    const result = findCandidateAnchors(priority, mem);
    expect(result).toHaveLength(2);
    expect(result.map((c) => `P${c.paragraph}S${c.sentence}`)).toEqual(['P2S0', 'P3S1']);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 6. Does not filter on moment.gaps — moments without gaps are still anchors
// ───────────────────────────────────────────────────────────────────────────

describe('findCandidateAnchors — gap-agnostic matching', () => {
  it('returns moments with no gaps[] (well-earned moments can still be anchor locations)', () => {
    const priority = makePriority([2]);
    const mem = makeMEM([
      makeMoment(2, 0, 'well-earned moment with no gaps', { gaps: [] }),
      makeMoment(2, 3, 'unearned moment with gaps', {
        gaps: ['sensory_grounding—no scene shows resilience'],
      }),
    ]);

    const result = findCandidateAnchors(priority, mem);
    expect(result).toHaveLength(2);
    // Both included; the LLM picks based on context.
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 7. Output shape contract
// ───────────────────────────────────────────────────────────────────────────

describe('findCandidateAnchors — output shape', () => {
  it('each candidate has exactly four fields: paragraph, sentence, source, momentDescription', () => {
    const priority = makePriority([2]);
    const mem = makeMEM([makeMoment(2, 1, 'the moment')]);
    const result = findCandidateAnchors(priority, mem);

    expect(result[0]).toEqual({
      paragraph: 2,
      sentence: 1,
      source: 'mem_moment',
      momentDescription: 'the moment',
    });
    expect(Object.keys(result[0]).sort()).toEqual([
      'momentDescription',
      'paragraph',
      'sentence',
      'source',
    ]);
  });

  it("source is always the literal 'mem_moment' (typed as a string literal)", () => {
    const priority = makePriority([0, 1, 2, 3, 4]);
    const mem = makeMEM([
      makeMoment(0, 0, 'a'),
      makeMoment(1, 0, 'b'),
      makeMoment(2, 0, 'c'),
    ]);
    const result = findCandidateAnchors(priority, mem);
    for (const c of result) {
      expect(c.source).toBe('mem_moment');
    }
  });
});
