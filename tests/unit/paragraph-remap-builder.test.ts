// ============================================================================
// PARAGRAPH REMAP BUILDER — synthetic fixture tests (D-1.7)
// ============================================================================
// Per the D-1.7 contract: "Synthetic fixtures simulating each edit type
// (reorder, insert, delete, multi-paragraph) — assert the remapped Map for
// each."
//
// Covers fixtures F1–F18 from the D-1.7 plan. The helper is pure (no API,
// no mocks needed). For each fixture: hand-author old/new paragraph arrays,
// derive the EditDiff structural fields by running the actual diff service,
// and assert the remap.
//
// We use the actual computeEditDiff path (via editUnderstandingService) to
// generate the cross-validation `diff` argument for most fixtures, both to
// keep the test honest (the helper and the diff computer agree on real
// inputs) and to avoid reimplementing diff logic in test code. F18
// hand-authors a tampered diff to exercise the cross-validation throw.

import { describe, it, expect } from 'vitest';

import {
  buildParagraphRemap,
  isDropped,
  type ParagraphRemap,
  type ParagraphRemapEntry,
} from '../../src/services/essayIntelligence/analysis/paragraphRemapBuilder';
import { computeEditDiff } from '../../src/services/essayIntelligence/analysis/editUnderstandingService';
import type { EditDiff } from '../../src/services/essayIntelligence/profileTypes';

// ─── Fixture helpers ───────────────────────────────────────────────────

/**
 * Build a minimal EditDiff structural shape consistent with the given old
 * and new paragraph arrays. Computes paragraphsRemoved as the set of OLD
 * indices whose hash doesn't appear in NEW (phase-1-complement semantics
 * matching computeEditDiff). Other structural fields are stubbed with
 * sensible values; only `paragraphsRemoved` matters for cross-validation.
 */
function makeStructural(
  oldParas: readonly string[],
  newParas: readonly string[],
): Pick<EditDiff, 'structural'> {
  // Mirror computeEditDiff's hash-pair logic to derive paragraphsRemoved.
  const oldHashToIndices = new Map<number, number[]>();
  for (let oi = 0; oi < oldParas.length; oi++) {
    const h = hashStringTest(oldParas[oi]);
    const bucket = oldHashToIndices.get(h);
    if (bucket) bucket.push(oi);
    else oldHashToIndices.set(h, [oi]);
  }
  const newHashes = newParas.map(hashStringTest);
  const consumed = new Set<number>();
  for (let ni = 0; ni < newParas.length; ni++) {
    const candidates = oldHashToIndices.get(newHashes[ni]);
    if (!candidates) continue;
    const available = candidates.filter((oi) => !consumed.has(oi));
    if (available.length === 0) continue;
    const best = available.reduce((prev, curr) =>
      Math.abs(curr - ni) < Math.abs(prev - ni) ? curr : prev,
    );
    consumed.add(best);
  }
  const paragraphsRemoved: number[] = [];
  for (let oi = 0; oi < oldParas.length; oi++) {
    if (!consumed.has(oi)) paragraphsRemoved.push(oi);
  }
  const paragraphsAdded: number[] = [];
  const consumedNew = new Set<number>();
  // (re-derive consumed new indices for paragraphsAdded; symmetric pass)
  const oldHashesSet = new Set(oldParas.map(hashStringTest));
  for (let ni = 0; ni < newParas.length; ni++) {
    if (!oldHashesSet.has(newHashes[ni])) {
      paragraphsAdded.push(ni);
      consumedNew.add(ni);
    }
  }
  return {
    structural: {
      paragraphsAdded,
      paragraphsRemoved,
      paragraphsReordered: false,
      paragraphDelta: newParas.length - oldParas.length,
    },
  };
}

/**
 * Mirror of editUnderstandingService.hashString — used only to compute the
 * test fixture's expected `paragraphsRemoved`. Production code imports the
 * real exported helper.
 */
function hashStringTest(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

/** Assert that remap entry equals an expected number (not dropped). */
function expectMapped(entry: ParagraphRemapEntry | undefined, expected: number): void {
  expect(entry).toBe(expected);
}

/** Assert that remap entry is a drop with the given reason. */
function expectDropped(
  entry: ParagraphRemapEntry | undefined,
  reason: 'paragraph_deleted' | 'ambiguous_remap_no_unique_target',
): void {
  expect(entry).toBeDefined();
  expect(isDropped(entry as ParagraphRemapEntry)).toBe(true);
  if (isDropped(entry as ParagraphRemapEntry)) {
    expect((entry as { dropped: true; reason: string }).reason).toBe(reason);
  }
}

/** Assert remap covers all old indices in [0, n) exactly once. */
function expectFullDomainCoverage(remap: ParagraphRemap, oldLen: number): void {
  expect(remap.size).toBe(oldLen);
  for (let oi = 0; oi < oldLen; oi++) {
    expect(remap.has(oi)).toBe(true);
  }
}

// Build a remap from old/new paragraph arrays using the REAL computeEditDiff
// to derive the full EditDiff (structural + paragraphChanges). This couples
// the fixtures to the real diff source so phase-5b cross-validation
// (paragraphChanges paired-modifications check) is exercised on every
// fixture — the helper produces the same inputs production does.
function buildFromTexts(
  oldParas: readonly string[],
  newParas: readonly string[],
): ParagraphRemap {
  const diff = computeEditDiff(oldParas.join('\n\n'), newParas.join('\n\n'));
  return buildParagraphRemap({
    oldParagraphTexts: oldParas,
    newParagraphTexts: newParas,
    diff,
  });
}

// ─── F1: identity, no change ───────────────────────────────────────────

describe('D-1.7 paragraphRemap — F1: identity_no_change', () => {
  it('maps every old index to itself', () => {
    const remap = buildFromTexts(['A', 'B', 'C'], ['A', 'B', 'C']);
    expectFullDomainCoverage(remap, 3);
    expectMapped(remap.get(0), 0);
    expectMapped(remap.get(1), 1);
    expectMapped(remap.get(2), 2);
  });
});

// ─── F2: pure swap (P2↔P3) ─────────────────────────────────────────────

describe('D-1.7 paragraphRemap — F2: pure_swap_p2_p3', () => {
  it('swaps the two innermost positions', () => {
    const remap = buildFromTexts(['A', 'B', 'C', 'D'], ['A', 'B', 'D', 'C']);
    expectFullDomainCoverage(remap, 4);
    expectMapped(remap.get(0), 0);
    expectMapped(remap.get(1), 1);
    expectMapped(remap.get(2), 3); // OLD C at idx 2 → NEW C at idx 3
    expectMapped(remap.get(3), 2); // OLD D at idx 3 → NEW D at idx 2
  });
});

// ─── F3: cyclic rotation ───────────────────────────────────────────────

describe('D-1.7 paragraphRemap — F3: cyclic_rotation', () => {
  it('rotates A→tail, BC up by one', () => {
    const remap = buildFromTexts(['A', 'B', 'C'], ['B', 'C', 'A']);
    expectFullDomainCoverage(remap, 3);
    expectMapped(remap.get(0), 2);
    expectMapped(remap.get(1), 0);
    expectMapped(remap.get(2), 1);
  });
});

// ─── F4: insert at head ────────────────────────────────────────────────

describe('D-1.7 paragraphRemap — F4: insert_head', () => {
  it('shifts every old index up by one', () => {
    const remap = buildFromTexts(['A', 'B', 'C'], ['X', 'A', 'B', 'C']);
    expectFullDomainCoverage(remap, 3);
    expectMapped(remap.get(0), 1);
    expectMapped(remap.get(1), 2);
    expectMapped(remap.get(2), 3);
  });
});

// ─── F5: insert middle ─────────────────────────────────────────────────

describe('D-1.7 paragraphRemap — F5: insert_middle', () => {
  it('shifts post-insertion indices but not pre-insertion', () => {
    const remap = buildFromTexts(
      ['A', 'B', 'C', 'D'],
      ['A', 'B', 'X', 'C', 'D'],
    );
    expectFullDomainCoverage(remap, 4);
    expectMapped(remap.get(0), 0);
    expectMapped(remap.get(1), 1);
    expectMapped(remap.get(2), 3);
    expectMapped(remap.get(3), 4);
  });
});

// ─── F6: insert tail ───────────────────────────────────────────────────

describe('D-1.7 paragraphRemap — F6: insert_tail', () => {
  it('leaves existing entries unchanged', () => {
    const remap = buildFromTexts(['A', 'B'], ['A', 'B', 'X']);
    expectFullDomainCoverage(remap, 2);
    expectMapped(remap.get(0), 0);
    expectMapped(remap.get(1), 1);
  });
});

// ─── F7: delete head ───────────────────────────────────────────────────

describe('D-1.7 paragraphRemap — F7: delete_head', () => {
  it('drops OLD 0 and shifts the rest down', () => {
    const remap = buildFromTexts(['A', 'B', 'C'], ['B', 'C']);
    expectFullDomainCoverage(remap, 3);
    expectDropped(remap.get(0), 'paragraph_deleted');
    expectMapped(remap.get(1), 0);
    expectMapped(remap.get(2), 1);
  });
});

// ─── F8: delete middle ─────────────────────────────────────────────────

describe('D-1.7 paragraphRemap — F8: delete_middle', () => {
  it('drops OLD 1 and shifts later indices down', () => {
    const remap = buildFromTexts(['A', 'B', 'C', 'D'], ['A', 'C', 'D']);
    expectFullDomainCoverage(remap, 4);
    expectMapped(remap.get(0), 0);
    expectDropped(remap.get(1), 'paragraph_deleted');
    expectMapped(remap.get(2), 1);
    expectMapped(remap.get(3), 2);
  });
});

// ─── F9: delete tail ───────────────────────────────────────────────────

describe('D-1.7 paragraphRemap — F9: delete_tail', () => {
  it('drops the last old index, leaves prefix intact', () => {
    const remap = buildFromTexts(['A', 'B', 'C'], ['A', 'B']);
    expectFullDomainCoverage(remap, 3);
    expectMapped(remap.get(0), 0);
    expectMapped(remap.get(1), 1);
    expectDropped(remap.get(2), 'paragraph_deleted');
  });
});

// ─── F10: modified-only (overlap pairing) ──────────────────────────────

describe('D-1.7 paragraphRemap — F10: modified_only', () => {
  it('treats high-overlap modified paragraph as the same identity (identity remap)', () => {
    // B and B' share >>30% overlap (most words identical, one phrase changed).
    const oldB =
      'Mom watched the stove. The kettle whistled while she folded laundry on the chair.';
    const newB =
      'Mom watched the stove. The kettle whistled while she folded laundry on the table.';
    const remap = buildFromTexts(['A', oldB, 'C'], ['A', newB, 'C']);
    expectFullDomainCoverage(remap, 3);
    expectMapped(remap.get(0), 0);
    expectMapped(remap.get(1), 1); // overlap-paired
    expectMapped(remap.get(2), 2);
  });
});

// ─── F11: modified + reorder ───────────────────────────────────────────

describe('D-1.7 paragraphRemap — F11: modified_plus_reorder', () => {
  it('pairs B with B\' across the swap (1→2 via overlap)', () => {
    const oldB =
      'Mom watched the stove. The kettle whistled while she folded laundry on the chair.';
    const newBPrime =
      'Mom watched the stove. The kettle whistled while she folded laundry on the table.';
    const remap = buildFromTexts(['A', oldB, 'C'], ['A', 'C', newBPrime]);
    expectFullDomainCoverage(remap, 3);
    expectMapped(remap.get(0), 0);
    expectMapped(remap.get(1), 2); // B (OLD 1) overlap-pairs with B' (NEW 2)
    expectMapped(remap.get(2), 1); // C unchanged-pairs with NEW 1
  });
});

// ─── F12: modified below threshold → drop ──────────────────────────────

describe('D-1.7 paragraphRemap — F12: modified_below_threshold_dropped', () => {
  it('treats <30% overlap as deletion+addition (drop, not pair)', () => {
    // B vs Z: completely different content; overlap < 0.30.
    const oldB = 'The kettle whistled in the kitchen.';
    const newZ = 'Elephants stomped through the dense forest.';
    const remap = buildFromTexts(['A', oldB, 'C'], ['A', newZ, 'C']);
    expectFullDomainCoverage(remap, 3);
    expectMapped(remap.get(0), 0);
    expectDropped(remap.get(1), 'paragraph_deleted');
    expectMapped(remap.get(2), 2);
  });
});

// ─── F13: multi-edit (insert + delete + reorder) ───────────────────────

describe('D-1.7 paragraphRemap — F13: multi_insert_delete_reorder', () => {
  it('handles compound structural change correctly', () => {
    // OLD [A,B,C,D] → NEW [X,D,A]: insert X, delete B, delete C, move D up, A to tail.
    const remap = buildFromTexts(['A', 'B', 'C', 'D'], ['X', 'D', 'A']);
    expectFullDomainCoverage(remap, 4);
    expectMapped(remap.get(0), 2); // A: NEW idx 2
    expectDropped(remap.get(1), 'paragraph_deleted'); // B gone
    expectDropped(remap.get(2), 'paragraph_deleted'); // C gone
    expectMapped(remap.get(3), 1); // D: NEW idx 1
  });
});

// ─── F14: duplicate content, positional preference ─────────────────────

describe('D-1.7 paragraphRemap — F14: duplicate_content_positional', () => {
  it('positional-closest tiebreak resolves which duplicate pairs with which', () => {
    // OLD [A,B,A,C] → NEW [A,A,B,C]
    // NEW 0 (A): candidates OLD 0,2; closest to 0 is OLD 0 → 0→0.
    // NEW 1 (A): only OLD 2 left → 2→1.
    // NEW 2 (B): OLD 1 → 1→2.
    // NEW 3 (C): OLD 3 → 3→3.
    const remap = buildFromTexts(['A', 'B', 'A', 'C'], ['A', 'A', 'B', 'C']);
    expectFullDomainCoverage(remap, 4);
    expectMapped(remap.get(0), 0);
    expectMapped(remap.get(1), 2);
    expectMapped(remap.get(2), 1);
    expectMapped(remap.get(3), 3);
  });
});

// ─── F15: empty old ────────────────────────────────────────────────────

describe('D-1.7 paragraphRemap — F15: empty_old', () => {
  it('returns an empty Map when there are no old paragraphs', () => {
    const remap = buildFromTexts([], ['A']);
    expect(remap.size).toBe(0);
  });
});

// ─── F16: empty new (essay deleted) ────────────────────────────────────

describe('D-1.7 paragraphRemap — F16: empty_new', () => {
  it('drops every old paragraph as deleted', () => {
    const remap = buildFromTexts(['A', 'B'], []);
    expectFullDomainCoverage(remap, 2);
    expectDropped(remap.get(0), 'paragraph_deleted');
    expectDropped(remap.get(1), 'paragraph_deleted');
  });
});

// ─── F17: ambiguous duplicate-to-single ────────────────────────────────

describe('D-1.7 paragraphRemap — F17: ambiguous_duplicate_to_single', () => {
  it('picks one duplicate by positional preference, drops the other with ambiguous reason', () => {
    // OLD [A,A] → NEW [A]. NEW 0 picks OLD 0 (closer). OLD 1 has same hash
    // but no remaining target → dropped with ambiguous reason.
    const remap = buildFromTexts(['A', 'A'], ['A']);
    expectFullDomainCoverage(remap, 2);
    expectMapped(remap.get(0), 0);
    expectDropped(remap.get(1), 'ambiguous_remap_no_unique_target');
  });
});

// ─── F18: cross-validation throws on tampered diff ─────────────────────

describe('D-1.7 paragraphRemap — F18: cross_validation_throws (phase-1 helper drift)', () => {
  it('throws when diff.structural.paragraphsRemoved disagrees with computed phase-1 set', () => {
    // OLD [A,B] === NEW [A,B] → no removals. Tamper: claim P1 was removed.
    const tampered: EditDiff = {
      structural: {
        paragraphsAdded: [],
        paragraphsRemoved: [1], // wrong on purpose
        paragraphsReordered: false,
        paragraphDelta: 0,
      },
      paragraphChanges: [],
      stats: { totalSentencesChanged: 0, totalWordsChanged: 0, changeRatio: 0 },
    };
    expect(() =>
      buildParagraphRemap({
        oldParagraphTexts: ['A', 'B'],
        newParagraphTexts: ['A', 'B'],
        diff: tampered,
      }),
    ).toThrow(/paragraphRemap mismatch with diff\.structural\.paragraphsRemoved/);
  });
});

// ─── F19: phase-2 cross-validation throws (audit fix 2) ────────────────

describe('D-1.7 paragraphRemap — F19: phase-2 cross_validation_throws (overlap drift)', () => {
  it('throws when diff.paragraphChanges flags a "modified" NEW idx that has no remap pairing', () => {
    // OLD `['A', 'B']`, NEW `['A', 'B']` — no real changes; both helpers
    // would normally agree. Tamper: claim NEW idx 1 is a 'modified' pairing
    // when in fact phase-1 already paired it as identity (so phase-2 made
    // no pairings). The remap won't have an OLD→NEW=1 pairing from phase-2,
    // and the cross-validation should catch the inconsistency.
    const tampered: EditDiff = {
      structural: {
        paragraphsAdded: [],
        paragraphsRemoved: [],
        paragraphsReordered: false,
        paragraphDelta: 0,
      },
      paragraphChanges: [
        {
          paragraphIndex: 1,
          changeType: 'modified',
          sentenceChanges: [],
        },
      ],
      stats: { totalSentencesChanged: 0, totalWordsChanged: 0, changeRatio: 0 },
    };
    // Note: the current production code's phase-1 picks NEW 1 → OLD 1 by
    // hash-equal. So remap = {0:0, 1:1}. The tampered diff says NEW 1 is
    // a phase-2 'modified' pair, but remap shows it was phase-1. The
    // cross-validation should fire because the diff's claim implies
    // phase-2 pairing happened, but remap shows otherwise. HOWEVER: the
    // current invariant only checks that the NEW idx is somewhere in
    // remap.values() — and here it IS (via phase-1). So this fixture
    // does NOT trigger the throw under the current invariant strictness.
    //
    // To trigger, we must claim a NEW idx that's NOT in remap.values().
    // Use OLD `[X]`, NEW `[Y]` with overlap < 0.30: phase-1 finds no
    // identity match, phase-2 finds no overlap pair, so remap = {0: dropped}
    // and remap.values() has no number — claiming NEW 0 is 'modified'
    // hits the missing-pairing branch.
    void tampered;

    const oldParas = ['Mom watched the kettle whistle.'];
    const newParas = ['Elephants stomped through dense jungle.'];
    const realDiff = computeEditDiff(oldParas.join('\n\n'), newParas.join('\n\n'));
    // Real diff treats this as deletion+addition (overlap < 0.30). Now
    // tamper: claim NEW 0 was 'modified' (phase-2 paired) — drift signal.
    const tamperedPhase2: EditDiff = {
      ...realDiff,
      paragraphChanges: [
        ...realDiff.paragraphChanges.filter((pc) => pc.changeType !== 'added'),
        {
          paragraphIndex: 0,
          changeType: 'modified',
          sentenceChanges: [],
        },
      ],
    };
    expect(() =>
      buildParagraphRemap({
        oldParagraphTexts: oldParas,
        newParagraphTexts: newParas,
        diff: tamperedPhase2,
      }),
    ).toThrow(/phase-2 cross-validation failed.*'modified'.*remap does not contain/);
  });
});

// ─── Domain integrity: every remap entry has exactly one image ────────

describe('D-1.7 paragraphRemap — domain integrity (function, not multi-map)', () => {
  it('no two old indices map to the same new index', () => {
    // Use the most demanding fixture — multi-edit — and assert injectivity
    // on the non-dropped entries.
    const remap = buildFromTexts(['A', 'B', 'C', 'D'], ['X', 'D', 'A']);
    const newIndicesSeen = new Set<number>();
    for (const [, entry] of remap) {
      if (typeof entry === 'number') {
        expect(newIndicesSeen.has(entry)).toBe(false);
        newIndicesSeen.add(entry);
      }
    }
  });
});

// ─── Input validation ─────────────────────────────────────────────────

describe('D-1.7 paragraphRemap — input validation', () => {
  it('rejects missing input', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buildParagraphRemap(undefined as any),
    ).toThrow(/input is missing/);
  });

  it('rejects non-array oldParagraphTexts', () => {
    expect(() =>
      buildParagraphRemap({
        oldParagraphTexts: 'oops' as unknown as string[],
        newParagraphTexts: [],
        diff: { structural: { paragraphsAdded: [], paragraphsRemoved: [], paragraphsReordered: false, paragraphDelta: 0 } },
      }),
    ).toThrow(/oldParagraphTexts must be an array/);
  });

  it('rejects non-string entries in newParagraphTexts', () => {
    expect(() =>
      buildParagraphRemap({
        oldParagraphTexts: [],
        newParagraphTexts: [42 as unknown as string],
        diff: { structural: { paragraphsAdded: [], paragraphsRemoved: [], paragraphsReordered: false, paragraphDelta: 0 } },
      }),
    ).toThrow(/newParagraphTexts\[0\] must be a string/);
  });

  it('rejects missing diff.structural', () => {
    expect(() =>
      buildParagraphRemap({
        oldParagraphTexts: ['A'],
        newParagraphTexts: ['A'],
        diff: {} as Pick<EditDiff, 'structural'>,
      }),
    ).toThrow(/diff\.structural is missing/);
  });

  it('rejects non-array diff.structural.paragraphsRemoved', () => {
    expect(() =>
      buildParagraphRemap({
        oldParagraphTexts: ['A'],
        newParagraphTexts: ['A'],
        diff: { structural: { paragraphsAdded: [], paragraphsRemoved: 'oops' as unknown as number[], paragraphsReordered: false, paragraphDelta: 0 } },
      }),
    ).toThrow(/paragraphsRemoved must be an array/);
  });
});
