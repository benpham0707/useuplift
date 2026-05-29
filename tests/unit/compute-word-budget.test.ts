// ============================================================================
// computeWordBudget — Q3 length-aware + tier-capped formula tests
// ============================================================================
// Validates the pure helper used by assembleRewriteInputs() to compute the
// `wordBudget` field on each RewriteGap.
//
// Formula (locked Q3):
//   targetDelta.max = max(tierMin, min(tierMax, ⌊paragraphCurrentWords × 0.5⌋))
//   targetDelta.min = tierMin
//
// Tier ranges:
//   transformative  30–50
//   significant     15–30
//   incremental      5–15

import { describe, it, expect } from 'vitest';

import { computeWordBudget } from '../../src/services/essayIntelligence/analysis/rewriteGeneration';

// ───────────────────────────────────────────────────────────────────────────
// 1. The three tiers on a representative mid-length paragraph (95 words)
// ───────────────────────────────────────────────────────────────────────────

describe('computeWordBudget — Crochet P3 (95 words)', () => {
  // Crochet P3 (the struggle scene) is the canonical case: tier-max wins for
  // significant + incremental; length cap wins for transformative (47 < 50).
  const p3Words = 95;
  const essayCur = 491;
  const essayMax = 650;

  it('transformative: length cap (47) below tier-max (50) → max = 47', () => {
    const b = computeWordBudget('transformative', p3Words, essayCur, essayMax);
    expect(b.targetDelta.min).toBe(30);
    expect(b.targetDelta.max).toBe(47);
  });

  it('significant: tier-max (30) below length cap (47) → max = 30', () => {
    const b = computeWordBudget('significant', p3Words, essayCur, essayMax);
    expect(b.targetDelta.min).toBe(15);
    expect(b.targetDelta.max).toBe(30);
  });

  it('incremental: tier-max (15) below length cap (47) → max = 15', () => {
    const b = computeWordBudget('incremental', p3Words, essayCur, essayMax);
    expect(b.targetDelta.min).toBe(5);
    expect(b.targetDelta.max).toBe(15);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 2. Short paragraph: length cap drops below tier-min → both clamp to tier-min
// ───────────────────────────────────────────────────────────────────────────

describe('computeWordBudget — short paragraph (length cap below tier-min)', () => {
  // 40-word paragraph: 50% = 20 words. Below transformative's tier-min (30).
  // Result: min and max collapse to 30 (rewriter told to consider split).
  const shortWords = 40;
  const essayCur = 200;
  const essayMax = 650;

  it('transformative: length cap (20) < tier-min (30) → both = 30', () => {
    const b = computeWordBudget('transformative', shortWords, essayCur, essayMax);
    expect(b.targetDelta.min).toBe(30);
    expect(b.targetDelta.max).toBe(30);
  });

  it('significant: length cap (20) >= tier-min (15) → max = 20 (length cap binding)', () => {
    const b = computeWordBudget('significant', shortWords, essayCur, essayMax);
    expect(b.targetDelta.min).toBe(15);
    expect(b.targetDelta.max).toBe(20);
  });

  it('incremental: length cap (20) >= tier-max (15) → max = 15', () => {
    const b = computeWordBudget('incremental', shortWords, essayCur, essayMax);
    expect(b.targetDelta.min).toBe(5);
    expect(b.targetDelta.max).toBe(15);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 3. Long paragraph: length cap exceeds tier-max → tier-max binds
// ───────────────────────────────────────────────────────────────────────────

describe('computeWordBudget — long paragraph (length cap above tier-max)', () => {
  // 200-word paragraph: 50% = 100 words. Exceeds every tier's max.
  const longWords = 200;
  const essayCur = 491;
  const essayMax = 650;

  it('transformative: length cap (100) > tier-max (50) → max = 50', () => {
    const b = computeWordBudget('transformative', longWords, essayCur, essayMax);
    expect(b.targetDelta.min).toBe(30);
    expect(b.targetDelta.max).toBe(50);
  });

  it('significant: length cap (100) > tier-max (30) → max = 30', () => {
    const b = computeWordBudget('significant', longWords, essayCur, essayMax);
    expect(b.targetDelta.min).toBe(15);
    expect(b.targetDelta.max).toBe(30);
  });

  it('incremental: length cap (100) > tier-max (15) → max = 15', () => {
    const b = computeWordBudget('incremental', longWords, essayCur, essayMax);
    expect(b.targetDelta.min).toBe(5);
    expect(b.targetDelta.max).toBe(15);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 4. Math.floor (not round/ceil) on the length cap
// ───────────────────────────────────────────────────────────────────────────

describe('computeWordBudget — Math.floor on length cap', () => {
  it('95 words × 0.5 = 47.5 → floor → 47 (transformative max)', () => {
    const b = computeWordBudget('transformative', 95, 491, 650);
    expect(b.targetDelta.max).toBe(47);
  });

  it('61 words × 0.5 = 30.5 → floor → 30 (transformative max; happens to equal tier-min)', () => {
    const b = computeWordBudget('transformative', 61, 491, 650);
    expect(b.targetDelta.max).toBe(30);
  });

  it('odd number 99 words × 0.5 = 49.5 → floor → 49 (transformative max)', () => {
    const b = computeWordBudget('transformative', 99, 491, 650);
    expect(b.targetDelta.max).toBe(49);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 5. Edge cases
// ───────────────────────────────────────────────────────────────────────────

describe('computeWordBudget — edge cases', () => {
  it('zero-word paragraph → max collapses to tier-min', () => {
    const b = computeWordBudget('transformative', 0, 0, 650);
    expect(b.targetDelta.min).toBe(30);
    expect(b.targetDelta.max).toBe(30);
  });

  it('negative paragraph words clamped to 0 (defensive)', () => {
    const b = computeWordBudget('significant', -5, 100, 650);
    expect(b.paragraphCurrentWords).toBe(0);
    expect(b.targetDelta.min).toBe(15);
    expect(b.targetDelta.max).toBe(15);
  });

  it('essay-level fields pass through unchanged', () => {
    const b = computeWordBudget('transformative', 95, 491, 650);
    expect(b.essayCurrentWords).toBe(491);
    expect(b.essayMaxWords).toBe(650);
    expect(b.paragraphCurrentWords).toBe(95);
  });

  it('returns four top-level fields (paragraph, essay current, essay max, targetDelta)', () => {
    const b = computeWordBudget('incremental', 50, 200, 250);
    expect(Object.keys(b).sort()).toEqual([
      'essayCurrentWords',
      'essayMaxWords',
      'paragraphCurrentWords',
      'targetDelta',
    ]);
  });

  it('different essay types (PIQ 350, supplement 250) pass through correctly', () => {
    const piq = computeWordBudget('significant', 100, 300, 350);
    expect(piq.essayMaxWords).toBe(350);
    const supp = computeWordBudget('incremental', 60, 200, 250);
    expect(supp.essayMaxWords).toBe(250);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 6. The min-clamp invariant — targetDelta.min always equals tier-min
// ───────────────────────────────────────────────────────────────────────────

describe('computeWordBudget — min-clamp invariant', () => {
  it('transformative: min is always 30 regardless of paragraph length', () => {
    for (const words of [0, 1, 10, 50, 100, 500]) {
      expect(computeWordBudget('transformative', words, 491, 650).targetDelta.min).toBe(30);
    }
  });

  it('significant: min is always 15 regardless of paragraph length', () => {
    for (const words of [0, 1, 10, 50, 100, 500]) {
      expect(computeWordBudget('significant', words, 491, 650).targetDelta.min).toBe(15);
    }
  });

  it('incremental: min is always 5 regardless of paragraph length', () => {
    for (const words of [0, 1, 10, 50, 100, 500]) {
      expect(computeWordBudget('incremental', words, 491, 650).targetDelta.min).toBe(5);
    }
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 7. The max-clamp invariant — targetDelta.max never exceeds tier-max
// ───────────────────────────────────────────────────────────────────────────

describe('computeWordBudget — max-clamp invariant', () => {
  it('transformative: max never exceeds 50 regardless of paragraph length', () => {
    for (const words of [0, 50, 100, 200, 500, 5000]) {
      const max = computeWordBudget('transformative', words, 491, 650).targetDelta.max;
      expect(max).toBeLessThanOrEqual(50);
    }
  });

  it('significant: max never exceeds 30', () => {
    for (const words of [0, 50, 100, 200, 500, 5000]) {
      const max = computeWordBudget('significant', words, 491, 650).targetDelta.max;
      expect(max).toBeLessThanOrEqual(30);
    }
  });

  it('incremental: max never exceeds 15', () => {
    for (const words of [0, 50, 100, 200, 500, 5000]) {
      const max = computeWordBudget('incremental', words, 491, 650).targetDelta.max;
      expect(max).toBeLessThanOrEqual(15);
    }
  });

  it('targetDelta.max is always >= targetDelta.min (no inverted ranges)', () => {
    const tiers = ['transformative', 'significant', 'incremental'] as const;
    for (const tier of tiers) {
      for (const words of [0, 1, 10, 50, 100, 500]) {
        const b = computeWordBudget(tier, words, 491, 650);
        expect(b.targetDelta.max).toBeGreaterThanOrEqual(b.targetDelta.min);
      }
    }
  });
});
