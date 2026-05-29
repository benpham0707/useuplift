// ============================================================================
// L5 TOP-N RANKER — unit test
// ============================================================================
// Validates the rankAndSurfaceAnnotations() deterministic post-processor
// against the 20-30 surfaced lock + diversity + per-paragraph ACTION floors.
// No LLM calls.
//
// Design: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_TOPN_RANKER_DESIGN.md
// Locked target: 20 ≤ surfaced ≤ 30 per essay, ≥3 of 4 teachingMode,
// ≥1 ACTION+rewriteExample per paragraph with eligible candidates.

import { beforeEach, describe, it, expect } from 'vitest';

import type {
  L5Annotation,
  ParagraphAnnotations,
} from '../../src/services/essayIntelligence/analysis/deepAnnotationService';
import {
  rankAndSurfaceAnnotations,
  L5_SURFACED_TARGET,
} from '../../src/services/essayIntelligence/analysis/deepAnnotationService';
import type { L5TeachingMode } from '../../src/services/essayIntelligence/profileTypes';

let nextId = 0;
function ann(
  partial: Partial<L5Annotation> & {
    paragraphIndex: number;
    teachingMode: L5TeachingMode;
    priority: number;
  },
): L5Annotation {
  nextId++;
  return {
    id: `A-${nextId}`,
    location: {
      paragraphIndex: partial.paragraphIndex,
      sentenceIndex: 0,
      spanText: 'span',
    },
    type: 'growth',
    teachingIntent: 'intent',
    teachingMode: partial.teachingMode,
    content: 'content content content',
    teachingRationale: 'rationale',
    northStarConnection: 'ns',
    stakes: 'stakes',
    priority: partial.priority,
    phase: 'craft',
    rewriteExample: partial.rewriteExample ?? null,
    wordEconomyCut: null,
    antiPatternExample: null,
    transferablePrinciple: null,
    confidence: partial.confidence ?? 0.8,
    crossParagraphRefs: partial.crossParagraphRefs ?? [],
    capacityBuildingNote: null,
    surfaced: true, // default; ranker overwrites
    ...partial,
  };
}

function group(paragraphs: number, perPara: number, modeOffset = 0): ParagraphAnnotations[] {
  const modes: L5TeachingMode[] = ['awareness', 'consequence', 'connection', 'action'];
  const out: ParagraphAnnotations[] = [];
  for (let p = 0; p < paragraphs; p++) {
    const annotations: L5Annotation[] = [];
    for (let i = 0; i < perPara; i++) {
      const mode = modes[(i + modeOffset) % modes.length];
      annotations.push(
        ann({
          paragraphIndex: p,
          teachingMode: mode,
          priority: 1 + (i % 5),
          rewriteExample: mode === 'action' ? 'rewrite' : null,
        }),
      );
    }
    out.push({ paragraphIndex: p, annotations });
  }
  return out;
}

function countSurfaced(
  paragraphs: ParagraphAnnotations[],
  essayLevel: L5Annotation[],
  cross: L5Annotation[],
): number {
  let n = 0;
  for (const pa of paragraphs) for (const a of pa.annotations) if (a.surfaced) n++;
  for (const a of essayLevel) if (a.surfaced) n++;
  for (const a of cross) if (a.surfaced) n++;
  return n;
}

function distinctSurfacedModes(
  paragraphs: ParagraphAnnotations[],
  essayLevel: L5Annotation[],
  cross: L5Annotation[],
): Set<L5TeachingMode> {
  const s = new Set<L5TeachingMode>();
  for (const pa of paragraphs) for (const a of pa.annotations) if (a.surfaced) s.add(a.teachingMode);
  for (const a of essayLevel) if (a.surfaced) s.add(a.teachingMode);
  for (const a of cross) if (a.surfaced) s.add(a.teachingMode);
  return s;
}

describe('L5 Top-N ranker — surface band + diversity + floors', () => {
  beforeEach(() => {
    nextId = 0;
  });

  it('surfaces nothing when the pool is empty', () => {
    const r = rankAndSurfaceAnnotations([], [], []);
    expect(r.surfacedCount).toBe(0);
    expect(r.totalCount).toBe(0);
  });

  it('caps surfaced count at 30 for an over-large pool', () => {
    // 7 paragraphs × 10 candidates = 70 in pool, only 30 should surface.
    const paragraphs = group(7, 10);
    const r = rankAndSurfaceAnnotations(paragraphs, [], []);
    expect(r.totalCount).toBe(70);
    expect(r.surfacedCount).toBe(L5_SURFACED_TARGET.max);
    expect(countSurfaced(paragraphs, [], [])).toBe(L5_SURFACED_TARGET.max);
  });

  it('surfaces everything when pool is under the min floor', () => {
    // 3 paragraphs × 4 candidates = 12 < 20.
    const paragraphs = group(3, 4);
    const r = rankAndSurfaceAnnotations(paragraphs, [], []);
    expect(r.totalCount).toBe(12);
    expect(r.surfacedCount).toBe(12);
    for (const pa of paragraphs) for (const a of pa.annotations) expect(a.surfaced).toBe(true);
  });

  it('surfaces all when pool exactly hits the min', () => {
    // 5 paragraphs × 4 candidates = 20.
    const paragraphs = group(5, 4);
    const r = rankAndSurfaceAnnotations(paragraphs, [], []);
    expect(r.surfacedCount).toBe(20);
  });

  it('preserves every annotation in the result (nothing deleted)', () => {
    const paragraphs = group(7, 10);
    const totalBefore = paragraphs.reduce((s, p) => s + p.annotations.length, 0);
    rankAndSurfaceAnnotations(paragraphs, [], []);
    const totalAfter = paragraphs.reduce((s, p) => s + p.annotations.length, 0);
    expect(totalAfter).toBe(totalBefore);
    // And some are surfaced=false (the trimmed tail).
    const unsurfaced = paragraphs
      .flatMap((p) => p.annotations)
      .filter((a) => !a.surfaced).length;
    expect(unsurfaced).toBeGreaterThan(0);
  });

  it('promotes every paragraph that has an ACTION+rewrite candidate', () => {
    // 8 paragraphs × 5 candidates each, including an ACTION+rewrite per para.
    const paragraphs = group(8, 5);
    const r = rankAndSurfaceAnnotations(paragraphs, [], []);
    expect(r.surfacedCount).toBeLessThanOrEqual(L5_SURFACED_TARGET.max);
    for (const pa of paragraphs) {
      const hasActionRewriteInPool = pa.annotations.some(
        (a) => a.teachingMode === 'action' && a.rewriteExample,
      );
      if (!hasActionRewriteInPool) continue;
      const surfacedAction = pa.annotations.some(
        (a) => a.teachingMode === 'action' && a.rewriteExample && a.surfaced,
      );
      expect(surfacedAction).toBe(true);
    }
  });

  it('ensures ≥3 distinct teachingModes are surfaced when the pool has them', () => {
    const paragraphs = group(7, 10); // pool spans all 4 modes
    rankAndSurfaceAnnotations(paragraphs, [], []);
    const modes = distinctSurfacedModes(paragraphs, [], []);
    expect(modes.size).toBeGreaterThanOrEqual(3);
  });

  it('respects priority ordering — the highest-priority items always surface', () => {
    // Build a pool where 5 priority-1 annotations exist; all should surface.
    const high: ParagraphAnnotations[] = [
      {
        paragraphIndex: 0,
        annotations: [
          ann({ paragraphIndex: 0, teachingMode: 'awareness', priority: 1 }),
          ann({ paragraphIndex: 0, teachingMode: 'consequence', priority: 1 }),
          ann({ paragraphIndex: 0, teachingMode: 'connection', priority: 1 }),
          ann({ paragraphIndex: 0, teachingMode: 'action', priority: 1, rewriteExample: 'r' }),
          ann({ paragraphIndex: 0, teachingMode: 'awareness', priority: 1 }),
        ],
      },
    ];
    // Pad with low-priority filler to push pool above min.
    const filler = group(5, 6, 1).map((g) => ({
      ...g,
      annotations: g.annotations.map((a) => ({ ...a, priority: 5 })),
    }));
    const all = [...high, ...filler];
    rankAndSurfaceAnnotations(all, [], []);
    for (const a of high[0].annotations) expect(a.surfaced).toBe(true);
  });

  it('treats essay-level + cross-paragraph annotations as part of the same pool', () => {
    const paragraphs = group(6, 4); // 24 pool
    const essayLevel: L5Annotation[] = [
      ann({ paragraphIndex: 0, teachingMode: 'awareness', priority: 1 }),
      ann({ paragraphIndex: 0, teachingMode: 'consequence', priority: 1 }),
    ];
    const cross: L5Annotation[] = [
      ann({
        paragraphIndex: 0,
        teachingMode: 'connection',
        priority: 1,
        crossParagraphRefs: [1, 2],
      }),
    ];
    const r = rankAndSurfaceAnnotations(paragraphs, essayLevel, cross);
    expect(r.totalCount).toBe(27);
    expect(r.surfacedCount).toBeLessThanOrEqual(L5_SURFACED_TARGET.max);
    // High-priority essay-level + cross-paragraph annotations must be surfaced.
    expect(essayLevel.every((a) => a.surfaced)).toBe(true);
    expect(cross.every((a) => a.surfaced)).toBe(true);
  });

  it('is idempotent — second call on the same pool produces identical surfaced set', () => {
    const paragraphs = group(7, 10);
    const r1 = rankAndSurfaceAnnotations(paragraphs, [], []);
    const snapshot1 = paragraphs.flatMap((p) => p.annotations).map((a) => a.surfaced);
    const r2 = rankAndSurfaceAnnotations(paragraphs, [], []);
    const snapshot2 = paragraphs.flatMap((p) => p.annotations).map((a) => a.surfaced);
    expect(r2.surfacedCount).toBe(r1.surfacedCount);
    expect(snapshot2).toEqual(snapshot1);
  });
});
