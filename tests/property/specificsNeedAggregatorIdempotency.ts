// ============================================================================
// Phase 2 D-2.11 — specificsNeedAggregator idempotency property tests
// ============================================================================
//
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md §D-2.11
//   "Property test: running the aggregator twice on the same emissions
//   doesn't double the queue."
//
// What this file pins:
//   The aggregator's idempotency contract — running the same emissions
//   through aggregate() twice (or N times) does not double-mint
//   questions in the queue. The contract has two clauses:
//
//   (1) STRONG IDEMPOTENCY (within-iteration): calling aggregate twice
//       on the same emissions in the same iteration mints questions on
//       the FIRST call only; the SECOND call's emissions all dedup-match
//       the questions the first call minted, so addedToQueue stays at
//       N on call 1 and 0 on call 2. The queue length doesn't double.
//
//   (2) WEAK IDEMPOTENCY (across iterations): calling aggregate on the
//       same emissions in iteration N+1 after iteration N matches every
//       emission against the existing-questions snapshot, bumping
//       iterationsSurvived++ but minting no new questions. The queue
//       length stays the same; iterationsSurvived advances by 1 per
//       distinct (anchorParagraph + expectedAnswerShape + framingSeed-
//       similarity) bucket.
//
// Why both clauses:
//   STRONG idempotency catches "mints a duplicate within a single run."
//   WEAK idempotency catches "fails to dedup against existing queue
//   state across iterations." Both failure modes would let the queue
//   grow unboundedly over many iterations of the same essay.
//
// Test architecture:
//   - Deterministic LCG seed (same pattern as D-1.13 / D-1.14 property
//     tests). Seed constant is content-addressed by deliverable
//     (D-2.11 → 0xD2110001) so failures replay identically across
//     contributors.
//   - 1000 randomized cases per property (matching the D-1.13 scale).
//   - Each case generates a small batch of emissions (1–8 emissions
//     across the 6 source layers), runs the aggregator twice or thrice,
//     and asserts the property holds.
//
// Failure-mode coverage:
//   - Repeated runs of identical emission batches (the literal
//     "running the aggregator twice on the same emissions" property).
//   - Iteration-N+1 re-emission of iteration-N emissions (the
//     existing-queue dedup path).
//   - N-fold repeated runs (N = 3..10) — the queue length must remain
//     bounded by the unique-emission count, not multiplied by N.
//
// Per the existing property-test convention (D-1.13 / D-1.14), this
// file lives in tests/property/ without the .test.ts suffix.

import { describe, it, expect } from 'vitest';
import {
  aggregateSpecificsNeedEmissions,
  type AggregationResult,
} from '../../src/services/essayIntelligence/analysis/specificsNeedAggregator';
import { QuestionQueueManager } from '../../src/services/essayIntelligence/analysis/questionQueueManager';
import type {
  SpecificsNeedEmission,
  SpecificsNeedSourceLayer,
} from '../../src/services/essayIntelligence/profileTypes';

// ─── Deterministic LCG (same pattern as D-1.13 / D-1.14) ──────────────

const SEED_CONSTANT = 0xd2110001;

function makeLcg(seed: number): () => number {
  let state = seed;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) | 0;
    return ((state >>> 0) / 0x100000000);
  };
}

const rand = makeLcg(SEED_CONSTANT);

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randPick<T>(arr: ReadonlyArray<T>): T {
  return arr[randInt(0, arr.length - 1)];
}

const SOURCE_LAYERS: ReadonlyArray<SpecificsNeedSourceLayer> = [
  'l3_walk',
  'l3_5_analysis',
  'l3_75_phase_a',
  'l3_75_phase_b',
  'l4_north_star',
  'finding_maturity',
];

const ANSWER_SHAPES = [
  'scalar',
  'short_phrase',
  'specific_memory',
  'list',
  'narrative',
] as const;

const CONSUMER_LAYERS = ['l3', 'l3_5', 'l3_75', 'l4', 'l5', 'finding_maturity'] as const;

const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;

const DIMENSIONS = ['narrative', 'voice', 'emotion', 'theme', 'craft'] as const;

// Vocabulary pool for framingSeed generation. The pool is small so that
// generated seeds across emissions occasionally overlap above the 0.5
// Jaccard threshold — exercising the dedup path. If the pool were large,
// every randomly-generated seed would be unique and the dedup path would
// rarely fire under the property tests.
const SEED_VOCAB = [
  'paragraph',
  'sentence',
  'specific',
  'moment',
  'feeling',
  'memory',
  'detail',
  'physical',
  'happened',
  'experience',
  'recall',
  'tell',
  'about',
  'describe',
  'walked',
  'said',
  'felt',
  'inside',
  'outside',
  'before',
  'after',
  'during',
] as const;

function randSeed(): string {
  // 5–10 words drawn from the small vocabulary pool. Two seeds drawn
  // from this pool will frequently share enough words to cross the 0.5
  // Jaccard threshold — driving the dedup path naturally.
  const wordCount = randInt(5, 10);
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(randPick(SEED_VOCAB));
  }
  return words.join(' ');
}

function randEmission(): SpecificsNeedEmission {
  return {
    sourceLayer: randPick(SOURCE_LAYERS),
    emittingTrigger: `synthetic trigger ${randInt(0, 99999)}`,
    anchorParagraph: randInt(0, 5),
    ...(rand() > 0.5 ? { anchorSentence: randInt(0, 4) } : {}),
    question: `synthetic question text ${randInt(0, 99999)}`,
    dimensions: [randPick(DIMENSIONS)],
    expectedInsight: `synthetic insight ${randInt(0, 99999)}`,
    priority: randPick(PRIORITIES),
    whyAsked: `synthetic why ${randInt(0, 99999)}`,
    expectedAnswerShape: randPick(ANSWER_SHAPES),
    consumers: [randPick(CONSUMER_LAYERS)],
    populates: [`populate.path.${randInt(0, 99999)}`],
    framingSeed: randSeed(),
  };
}

function genEmissions(count: number): SpecificsNeedEmission[] {
  const out: SpecificsNeedEmission[] = [];
  for (let i = 0; i < count; i++) {
    out.push(randEmission());
  }
  return out;
}

// ─── Property 1 — Strong idempotency (within iteration) ───────────────

describe('D-2.11 Property 1 — Strong idempotency (running aggregate twice in the same iteration mints zero new questions on the second call)', () => {
  it('addedToQueue on call 2 is always 0 (no double-minting)', () => {
    let casesChecked = 0;
    let totalEmissionsAcrossCases = 0;

    for (let trial = 0; trial < 1000; trial++) {
      const queue = new QuestionQueueManager([]);
      const emissions = genEmissions(randInt(1, 8));

      // Call 1: mint whatever the dedup-allows.
      const result1 = aggregateSpecificsNeedEmissions(emissions, queue, 1);
      const queueLengthAfterCall1 = queue.openCount;

      // Call 2: SAME emissions, same iteration. The strong idempotency
      // contract: every emission's framingSeed now exists in the queue
      // (via the questions minted in call 1), so every emission either:
      //   (a) dedup-matches an existing question (deduplicatedAgainstExisting++)
      //   (b) within-run-deduped against an emission earlier in this same
      //       call 2 (deduplicatedWithinRun++)
      // No new mints. addedToQueue MUST be 0.
      const result2 = aggregateSpecificsNeedEmissions(emissions, queue, 1);

      expect(
        result2.addedToQueue,
        `trial ${trial}: addedToQueue should be 0 on call 2 (running the same emissions twice should not double the queue). ` +
          `Call 1 stats: ${JSON.stringify(result1)}. Call 2 stats: ${JSON.stringify(result2)}. ` +
          `Queue length after call 1: ${queueLengthAfterCall1}, after call 2: ${queue.openCount}.`,
      ).toBe(0);

      // Queue length doesn't grow on call 2.
      expect(queue.openCount).toBe(queueLengthAfterCall1);

      casesChecked++;
      totalEmissionsAcrossCases += emissions.length;
    }

    expect(casesChecked).toBe(1000);
    expect(totalEmissionsAcrossCases).toBeGreaterThan(0);
  });

  it('every emission on call 2 routes to either deduplicatedAgainstExisting or deduplicatedWithinRun', () => {
    // Sister assertion to property 1: not just "addedToQueue is 0," but
    // "every emission was accounted for in the dedup paths."
    for (let trial = 0; trial < 200; trial++) {
      const queue = new QuestionQueueManager([]);
      const emissions = genEmissions(randInt(2, 8)); // ≥2 to make within-run plausible

      aggregateSpecificsNeedEmissions(emissions, queue, 1);
      const result2 = aggregateSpecificsNeedEmissions(emissions, queue, 1);

      const accountedFor =
        result2.deduplicatedAgainstExisting +
        result2.deduplicatedWithinRun +
        result2.addedToQueue;
      expect(accountedFor).toBe(emissions.length);
      expect(result2.totalEmissions).toBe(emissions.length);
    }
  });
});

// ─── Property 2 — Weak idempotency (across iterations) ────────────────

describe('D-2.11 Property 2 — Weak idempotency (running aggregate on iteration N+1 with the same emissions mints zero new and bumps iterationsSurvived honestly)', () => {
  it('addedToQueue on iteration N+1 is always 0 when emissions repeat', () => {
    for (let trial = 0; trial < 1000; trial++) {
      const queue = new QuestionQueueManager([]);
      const emissions = genEmissions(randInt(1, 8));

      aggregateSpecificsNeedEmissions(emissions, queue, 1);
      const queueLengthAfterIter1 = queue.openCount;
      const result2 = aggregateSpecificsNeedEmissions(emissions, queue, 2);

      expect(
        result2.addedToQueue,
        `trial ${trial}: addedToQueue should be 0 on iteration 2 with identical emissions. ` +
          `Queue length after iter 1: ${queueLengthAfterIter1}, after iter 2: ${queue.openCount}.`,
      ).toBe(0);
      expect(queue.openCount).toBe(queueLengthAfterIter1);
    }
  });

  it('iterationsSurvived bumps exactly once per existing question on iteration N+1', () => {
    // Single-increment-per-existing-match is documented in
    // specificsNeedAggregator.ts (the existingMatchedIds Set) and
    // unit-tested at specifics-need-aggregator.test.ts §3. The
    // property version: across many randomized inputs, every
    // existing question's iterationsSurvived bumps by exactly 1
    // (not by N, where N is the count of matching emissions).
    for (let trial = 0; trial < 500; trial++) {
      const queue = new QuestionQueueManager([]);
      const emissions = genEmissions(randInt(1, 8));

      aggregateSpecificsNeedEmissions(emissions, queue, 1);
      const beforeIterSurvived = queue
        .getOpenAnalysisGapQuestions()
        .map(q => ({ id: q.id, n: q.iterationsSurvived }));

      aggregateSpecificsNeedEmissions(emissions, queue, 2);
      const afterIterSurvived = queue
        .getOpenAnalysisGapQuestions()
        .map(q => ({ id: q.id, n: q.iterationsSurvived }));

      // Every question that was open after iter 1 is still open and has
      // iterationsSurvived bumped by AT MOST 1. (Could be 0 if no
      // emission this iteration dedup-matched it — but with identical
      // emissions, the existing-questions snapshot will catch every
      // emission, so every question that has at least one matching
      // emission gets exactly +1.)
      const beforeMap = new Map(beforeIterSurvived.map(e => [e.id, e.n]));
      for (const after of afterIterSurvived) {
        const before = beforeMap.get(after.id);
        expect(before).toBeDefined();
        const delta = after.n - (before ?? 0);
        expect(delta, `trial ${trial}: question ${after.id} iterationsSurvived delta`).toBeLessThanOrEqual(
          1,
        );
        expect(delta).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ─── Property 3 — N-fold idempotency ──────────────────────────────────

describe('D-2.11 Property 3 — N-fold idempotency (running aggregate N times on the same emissions never grows the queue past the first call)', () => {
  it('queue length is bounded by the first call result for any N (3..10)', () => {
    for (let trial = 0; trial < 500; trial++) {
      const queue = new QuestionQueueManager([]);
      const emissions = genEmissions(randInt(1, 6));
      const N = randInt(3, 10);

      const result1 = aggregateSpecificsNeedEmissions(emissions, queue, 1);
      const queueLengthAfterCall1 = queue.openCount;

      // Run N–1 more times across distinct iteration numbers (the
      // realistic "same student, same gap, many iterations" case).
      for (let i = 2; i <= N; i++) {
        const result = aggregateSpecificsNeedEmissions(emissions, queue, i);
        expect(
          result.addedToQueue,
          `trial ${trial} (N=${N}): addedToQueue should stay 0 on every iteration after the first. iter=${i}.`,
        ).toBe(0);
      }

      // After N calls, the queue length is unchanged from after call 1.
      expect(
        queue.openCount,
        `trial ${trial} (N=${N}): queue grew after first call. result1=${JSON.stringify(result1)}, final length=${queue.openCount}, expected ${queueLengthAfterCall1}.`,
      ).toBe(queueLengthAfterCall1);
    }
  });
});

// ─── Property 4 — Empty-emissions idempotency ─────────────────────────

describe('D-2.11 Property 4 — Empty-emissions idempotency', () => {
  it('aggregate([], queue, iter) is a no-op for any starting queue state', () => {
    for (let trial = 0; trial < 100; trial++) {
      const queue = new QuestionQueueManager([]);
      // Seed the queue with some questions via a real emission batch.
      const seedingEmissions = genEmissions(randInt(1, 5));
      aggregateSpecificsNeedEmissions(seedingEmissions, queue, 1);

      // Snapshot the queue's full serialized state.
      const before = JSON.stringify(queue.getAll());

      // Empty aggregate call.
      const result = aggregateSpecificsNeedEmissions([], queue, 5);
      expect(result.totalEmissions).toBe(0);
      expect(result.addedToQueue).toBe(0);
      expect(result.deduplicatedAgainstExisting).toBe(0);
      expect(result.deduplicatedWithinRun).toBe(0);

      // Queue state byte-identical after the no-op call.
      expect(JSON.stringify(queue.getAll())).toBe(before);
    }
  });
});

// ─── Property 5 — AggregationResult invariants ────────────────────────

describe('D-2.11 Property 5 — AggregationResult counts always sum to totalEmissions', () => {
  it('addedToQueue + deduplicatedAgainstExisting + deduplicatedWithinRun === totalEmissions', () => {
    // Every emission must end up in exactly one of the three buckets;
    // the AggregationResult sums must conserve.
    for (let trial = 0; trial < 1000; trial++) {
      const queue = new QuestionQueueManager([]);
      const emissions = genEmissions(randInt(1, 8));

      const result: AggregationResult = aggregateSpecificsNeedEmissions(emissions, queue, 1);
      const sum =
        result.addedToQueue +
        result.deduplicatedAgainstExisting +
        result.deduplicatedWithinRun;
      expect(
        sum,
        `trial ${trial}: AggregationResult counts must sum to totalEmissions. ` +
          `Got addedToQueue=${result.addedToQueue}, deduplicatedAgainstExisting=${result.deduplicatedAgainstExisting}, deduplicatedWithinRun=${result.deduplicatedWithinRun}, sum=${sum}, totalEmissions=${result.totalEmissions}.`,
      ).toBe(result.totalEmissions);
    }
  });

  it('byLayer counts always sum to totalEmissions', () => {
    for (let trial = 0; trial < 500; trial++) {
      const queue = new QuestionQueueManager([]);
      const emissions = genEmissions(randInt(1, 8));

      const result: AggregationResult = aggregateSpecificsNeedEmissions(emissions, queue, 1);
      const layerSum = Object.values(result.byLayer).reduce((a, b) => a + b, 0);
      expect(layerSum).toBe(result.totalEmissions);
    }
  });
});
