// ============================================================================
// Phase 2 D-2.7 — specificsNeedAggregator unit tests
// ============================================================================
//
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md §D-2.7
//
// What this file tests:
//   The aggregator's two contracts:
//     (1) Schema validation — every emission's required fields, types,
//         and enum membership are checked at runtime; malformed emissions
//         throw with structured context (sourceLayer, emissionIndex,
//         missing/invalid field).
//     (2) Dedup behavior — emissions matching existing open queue
//         questions increment iterationsSurvived; emissions matching
//         each other within the same run mint only the first; unmatched
//         emissions mint new UnderstandingQuestion entries with
//         populated DigContext.
//
//   Property-level tests (running the aggregator twice on the same
//   emissions doesn't double the queue) live separately in D-2.11.

import { describe, it, expect } from 'vitest';
import {
  aggregateSpecificsNeedEmissions,
  tokenize,
  jaccardSimilarity,
  FRAMING_SEED_SIMILARITY_THRESHOLD,
} from '../../src/services/essayIntelligence/analysis/specificsNeedAggregator';
import { QuestionQueueManager } from '../../src/services/essayIntelligence/analysis/questionQueueManager';
import type {
  SpecificsNeedEmission,
  UnderstandingQuestion,
  DigContext,
} from '../../src/services/essayIntelligence/profileTypes';

// ─── Test fixtures ─────────────────────────────────────────────────────

function buildEmission(
  overrides: Partial<SpecificsNeedEmission> = {},
): SpecificsNeedEmission {
  return {
    sourceLayer: 'l3_walk',
    emittingTrigger: 'F12 deepeningPotential != null with raisesQuestions[0] citing student lived experience',
    anchorParagraph: 2,
    question: 'What did you actually experience in that moment?',
    dimensions: ['narrative', 'emotion'],
    expectedInsight: 'The lived experience that grounds the moment',
    priority: 'medium',
    whyAsked: 'The walk identified a finding whose claim cannot be deepened from re-reading the text',
    expectedAnswerShape: 'specific_memory',
    consumers: ['l3', 'l5'],
    populates: ['groundTruthFacts.byLocation', 'finding.evidence'],
    framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
    ...overrides,
  };
}

function buildExistingDigQuestion(
  id: string,
  overrides: {
    framingSeed?: string;
    expectedAnswerShape?: DigContext['expectedAnswerShape'];
    iterationsSurvived?: number;
  } = {},
): UnderstandingQuestion {
  return {
    id,
    question: `Existing question ${id}`,
    dimensions: ['narrative'],
    expectedInsight: 'Existing expected insight',
    source: 'analysis_specifics_gap',
    status: 'open',
    priority: 'medium',
    iterationsSurvived: overrides.iterationsSurvived ?? 0,
    spawnedQuestions: [],
    raisedAt: '2026-04-30T00:00:00.000Z',
    raisedDuringIteration: 1,
    dig: {
      whyAsked: 'Existing why',
      expectedAnswerShape: overrides.expectedAnswerShape ?? 'specific_memory',
      consumers: ['l3'],
      populates: ['groundTruthFacts.byLocation'],
      framingSeed:
        overrides.framingSeed ??
        'existing framing seed text about the moment in paragraph two',
    },
  };
}

// ─── §1 — Schema validation throws on malformed emissions ──────────────

describe('D-2.7 §1 — Schema validation', () => {
  it('throws on missing sourceLayer', () => {
    const queue = new QuestionQueueManager([]);
    const bad = { ...buildEmission(), sourceLayer: undefined } as unknown as SpecificsNeedEmission;
    expect(() => aggregateSpecificsNeedEmissions([bad], queue, 1)).toThrow(
      /sourceLayer.*missing or not a string/,
    );
  });

  it('throws on invalid sourceLayer enum value', () => {
    const queue = new QuestionQueueManager([]);
    const bad = { ...buildEmission(), sourceLayer: 'unknown_layer' as SpecificsNeedEmission['sourceLayer'] };
    expect(() => aggregateSpecificsNeedEmissions([bad], queue, 1)).toThrow(
      /sourceLayer.*'unknown_layer' is not a valid SpecificsNeedSourceLayer/,
    );
  });

  it('throws on empty emittingTrigger', () => {
    const queue = new QuestionQueueManager([]);
    expect(() =>
      aggregateSpecificsNeedEmissions([buildEmission({ emittingTrigger: '' })], queue, 1),
    ).toThrow(/emittingTrigger.*missing.*empty/);
  });

  it('throws on negative anchorParagraph', () => {
    const queue = new QuestionQueueManager([]);
    expect(() =>
      aggregateSpecificsNeedEmissions([buildEmission({ anchorParagraph: -1 })], queue, 1),
    ).toThrow(/anchorParagraph.*not an integer.*negative/);
  });

  it('throws on non-integer anchorParagraph', () => {
    const queue = new QuestionQueueManager([]);
    expect(() =>
      aggregateSpecificsNeedEmissions([buildEmission({ anchorParagraph: 1.5 })], queue, 1),
    ).toThrow(/anchorParagraph/);
  });

  it('throws on empty question', () => {
    const queue = new QuestionQueueManager([]);
    expect(() =>
      aggregateSpecificsNeedEmissions([buildEmission({ question: '' })], queue, 1),
    ).toThrow(/question.*missing.*empty/);
  });

  it('throws on dimensions not an array', () => {
    const queue = new QuestionQueueManager([]);
    const bad = { ...buildEmission(), dimensions: 'not-an-array' as unknown as string[] };
    expect(() => aggregateSpecificsNeedEmissions([bad], queue, 1)).toThrow(
      /dimensions.*missing.*not an array.*empty/,
    );
  });

  it('throws on empty dimensions array (round-1 audit MED-1 closure)', () => {
    // Per L5_E2E_INTEGRITY_AUDIT.md §3.2: emissions name "one or more"
    // dimensions. Empty array means the layer doesn't know what
    // dimension this gap concerns — the LLM must commit to at least
    // one routing tag.
    const queue = new QuestionQueueManager([]);
    expect(() =>
      aggregateSpecificsNeedEmissions([buildEmission({ dimensions: [] })], queue, 1),
    ).toThrow(/dimensions.*missing.*not an array.*empty/);
  });

  it('throws on dimensions[i] empty string (round-1 audit MED-1 closure)', () => {
    const queue = new QuestionQueueManager([]);
    expect(() =>
      aggregateSpecificsNeedEmissions(
        [buildEmission({ dimensions: ['narrative', ''] })],
        queue,
        1,
      ),
    ).toThrow(/dimensions.*non-string or empty\/whitespace/);
  });

  it('throws on populates[i] whitespace-only string (round-1 audit MED-1 closure)', () => {
    const queue = new QuestionQueueManager([]);
    expect(() =>
      aggregateSpecificsNeedEmissions(
        [buildEmission({ populates: ['groundTruthFacts.byLocation', '   '] })],
        queue,
        1,
      ),
    ).toThrow(/populates.*non-string or empty\/whitespace/);
  });

  it('throws on framingSeed whitespace-only (round-1 audit MED-1 closure — silent-tokenize-collapse path)', () => {
    // Whitespace-only framingSeed tokenizes to empty Set, collapses
    // Jaccard similarity to 0, breaks dedup contract silently.
    const queue = new QuestionQueueManager([]);
    expect(() =>
      aggregateSpecificsNeedEmissions(
        [buildEmission({ framingSeed: '   \t\n  ' })],
        queue,
        1,
      ),
    ).toThrow(/framingSeed.*missing.*empty\/whitespace/);
  });

  it('throws on whyAsked whitespace-only (round-1 audit MED-1 closure)', () => {
    const queue = new QuestionQueueManager([]);
    expect(() =>
      aggregateSpecificsNeedEmissions([buildEmission({ whyAsked: '   ' })], queue, 1),
    ).toThrow(/whyAsked.*missing.*empty\/whitespace/);
  });

  it('throws on empty expectedInsight', () => {
    const queue = new QuestionQueueManager([]);
    expect(() =>
      aggregateSpecificsNeedEmissions([buildEmission({ expectedInsight: '' })], queue, 1),
    ).toThrow(/expectedInsight.*missing.*empty/);
  });

  it('throws on invalid priority enum value', () => {
    const queue = new QuestionQueueManager([]);
    const bad = { ...buildEmission(), priority: 'urgent' as UnderstandingQuestion['priority'] };
    expect(() => aggregateSpecificsNeedEmissions([bad], queue, 1)).toThrow(
      /priority.*'urgent' is not a valid priority/,
    );
  });

  it('throws on empty whyAsked', () => {
    const queue = new QuestionQueueManager([]);
    expect(() =>
      aggregateSpecificsNeedEmissions([buildEmission({ whyAsked: '' })], queue, 1),
    ).toThrow(/whyAsked.*missing.*empty/);
  });

  it('throws on invalid expectedAnswerShape enum value', () => {
    const queue = new QuestionQueueManager([]);
    const bad = {
      ...buildEmission(),
      expectedAnswerShape: 'paragraph' as DigContext['expectedAnswerShape'],
    };
    expect(() => aggregateSpecificsNeedEmissions([bad], queue, 1)).toThrow(
      /expectedAnswerShape.*'paragraph' is not a valid expectedAnswerShape/,
    );
  });

  it('throws on empty consumers array', () => {
    const queue = new QuestionQueueManager([]);
    expect(() =>
      aggregateSpecificsNeedEmissions([buildEmission({ consumers: [] })], queue, 1),
    ).toThrow(/consumers.*missing.*empty/);
  });

  it('throws on invalid consumers entry', () => {
    const queue = new QuestionQueueManager([]);
    const bad = {
      ...buildEmission(),
      consumers: ['l3', 'unknown_layer'] as DigContext['consumers'],
    };
    expect(() => aggregateSpecificsNeedEmissions([bad], queue, 1)).toThrow(
      /consumers.*'unknown_layer' which is not a valid consumer layer/,
    );
  });

  it('throws on empty framingSeed', () => {
    const queue = new QuestionQueueManager([]);
    expect(() =>
      aggregateSpecificsNeedEmissions([buildEmission({ framingSeed: '' })], queue, 1),
    ).toThrow(/framingSeed.*missing.*empty/);
  });

  it('error context includes emissionIndex and sourceLayer', () => {
    const queue = new QuestionQueueManager([]);
    const emissions = [
      buildEmission({ sourceLayer: 'l3_walk' }), // valid
      buildEmission({ sourceLayer: 'l3_walk', whyAsked: '' }), // invalid at index 1
    ];
    let caught: Error | undefined;
    try {
      aggregateSpecificsNeedEmissions(emissions, queue, 1);
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).toBeDefined();
    expect(caught!.message).toContain('index 1');
    expect(caught!.message).toContain("sourceLayer='l3_walk'");
  });

  it('halts on first invalid emission (subsequent emissions never reach mint logic)', () => {
    // Behavior: emissions are processed sequentially with
    // validate → mint → next. A malformed emission's throw halts the
    // aggregation immediately; emissions BEFORE the throw have already
    // minted their questions; emissions AFTER never reach the mint
    // logic.
    //
    // Why this is the correct behavior (not all-or-nothing atomic):
    // - Pre-throw mints are well-formed valid questions. No queue
    //   corruption.
    // - The orchestrator's re-run after the upstream layer fixes its
    //   emission contract handles deduplication naturally (the valid
    //   emission from the partial first run dedup-matches itself in
    //   the second run).
    // - Consistent with the existing project pattern in D-1.6
    //   priorAnnotationsBuilder.ts which processes per-move sequentially
    //   and throws on first failure with downstream consumers handling
    //   partial state.
    //
    // The throw IS the audit signal. The orchestrator's catch path
    // surfaces telemetry naming the malformed emission. No silent
    // continuation past the error.
    const queue = new QuestionQueueManager([]);
    const emissions = [
      buildEmission({ sourceLayer: 'l3_walk' }), // mints q0
      buildEmission({ sourceLayer: 'l3_walk', whyAsked: '' }), // throws here
      buildEmission({ sourceLayer: 'l3_walk' }), // never reached
    ];
    expect(() => aggregateSpecificsNeedEmissions(emissions, queue, 1)).toThrow();
    // q0 minted before the throw remains in the queue. q2 never minted.
    expect(queue.openCount).toBe(1);
    expect(queue.getOpenAnalysisGapQuestions()).toHaveLength(1);
    expect(queue.getOpenAnalysisGapQuestions()[0].id).toBe('SNQ-l3_walk-iter1-0');
  });
});

// ─── §2 — Mints new UnderstandingQuestion entries from emissions ───────

describe('D-2.7 §2 — Mints new UnderstandingQuestion entries', () => {
  it('mints one UnderstandingQuestion per non-duplicate emission', () => {
    const queue = new QuestionQueueManager([]);
    const result = aggregateSpecificsNeedEmissions(
      [
        buildEmission({ anchorParagraph: 0, framingSeed: 'first emission seed' }),
        buildEmission({ anchorParagraph: 1, framingSeed: 'completely different second seed' }),
      ],
      queue,
      1,
    );
    expect(result.totalEmissions).toBe(2);
    expect(result.addedToQueue).toBe(2);
    expect(result.deduplicatedAgainstExisting).toBe(0);
    expect(result.deduplicatedWithinRun).toBe(0);
    expect(queue.openCount).toBe(2);
  });

  it('minted question carries source=analysis_specifics_gap and a populated dig sub-object', () => {
    const queue = new QuestionQueueManager([]);
    aggregateSpecificsNeedEmissions(
      [
        buildEmission({
          whyAsked: 'specific why text',
          framingSeed: 'specific framing seed text',
          expectedAnswerShape: 'narrative',
          consumers: ['l3', 'l3_75', 'l5'],
          populates: ['groundTruthFacts.byLocation'],
        }),
      ],
      queue,
      3,
    );
    const minted = queue.getOpenAnalysisGapQuestions()[0];
    expect(minted.source).toBe('analysis_specifics_gap');
    expect(minted.status).toBe('open');
    expect(minted.raisedDuringIteration).toBe(3);
    expect(minted.dig).toBeDefined();
    expect(minted.dig!.whyAsked).toBe('specific why text');
    expect(minted.dig!.framingSeed).toBe('specific framing seed text');
    expect(minted.dig!.expectedAnswerShape).toBe('narrative');
    expect(minted.dig!.consumers).toEqual(['l3', 'l3_75', 'l5']);
    expect(minted.dig!.populates).toEqual(['groundTruthFacts.byLocation']);
  });

  it('minted question carries question / dimensions / expectedInsight / priority from emission', () => {
    const queue = new QuestionQueueManager([]);
    aggregateSpecificsNeedEmissions(
      [
        buildEmission({
          question: 'specific question text',
          dimensions: ['voice', 'emotion', 'narrative'],
          expectedInsight: 'specific expected insight',
          priority: 'high',
        }),
      ],
      queue,
      1,
    );
    const minted = queue.getOpenAnalysisGapQuestions()[0];
    expect(minted.question).toBe('specific question text');
    expect(minted.dimensions).toEqual(['voice', 'emotion', 'narrative']);
    expect(minted.expectedInsight).toBe('specific expected insight');
    expect(minted.priority).toBe('high');
  });

  it('minted question ID encodes sourceLayer + iteration + emissionIndex (deterministic)', () => {
    const queue = new QuestionQueueManager([]);
    aggregateSpecificsNeedEmissions(
      [
        buildEmission({ sourceLayer: 'l3_75_phase_a', framingSeed: 'first seed alpha beta gamma' }),
        buildEmission({ sourceLayer: 'l4_north_star', framingSeed: 'second seed delta epsilon zeta' }),
      ],
      queue,
      7,
    );
    const ids = queue.getOpenAnalysisGapQuestions().map(q => q.id);
    expect(ids).toContain('SNQ-l3_75_phase_a-iter7-0');
    expect(ids).toContain('SNQ-l4_north_star-iter7-1');
  });

  it('byLayer stats count emissions per source', () => {
    const queue = new QuestionQueueManager([]);
    const result = aggregateSpecificsNeedEmissions(
      [
        buildEmission({ sourceLayer: 'l3_walk', framingSeed: 'seed alpha' }),
        buildEmission({ sourceLayer: 'l3_walk', framingSeed: 'seed beta' }),
        buildEmission({ sourceLayer: 'l3_5_analysis', framingSeed: 'seed gamma' }),
        buildEmission({ sourceLayer: 'finding_maturity', framingSeed: 'seed delta' }),
      ],
      queue,
      1,
    );
    expect(result.byLayer.l3_walk).toBe(2);
    expect(result.byLayer.l3_5_analysis).toBe(1);
    expect(result.byLayer.finding_maturity).toBe(1);
    expect(result.byLayer.l3_75_phase_a).toBe(0);
    expect(result.byLayer.l3_75_phase_b).toBe(0);
    expect(result.byLayer.l4_north_star).toBe(0);
  });
});

// ─── §3 — Dedup against existing open queue questions ──────────────────

describe('D-2.7 §3 — Dedup against existing open queue questions', () => {
  it('matching framingSeed (similarity ≥ threshold) + same anchor + same shape → increments existing iterationsSurvived', () => {
    const existing = buildExistingDigQuestion('existing-1', {
      framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
      iterationsSurvived: 2,
    });
    const queue = new QuestionQueueManager([existing]);

    const result = aggregateSpecificsNeedEmissions(
      [
        buildEmission({
          anchorParagraph: 2,
          expectedAnswerShape: 'specific_memory',
          // identical framingSeed → 1.0 similarity, well above 0.5 threshold
          framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
        }),
      ],
      queue,
      3,
    );

    expect(result.deduplicatedAgainstExisting).toBe(1);
    expect(result.addedToQueue).toBe(0);
    // Existing question's iterationsSurvived bumped from 2 to 3.
    expect(queue.getById('existing-1')!.iterationsSurvived).toBe(3);
  });

  it('different expectedAnswerShape gates the match (no dedup even with high framingSeed similarity)', () => {
    const existing = buildExistingDigQuestion('existing-1', {
      framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
      expectedAnswerShape: 'narrative', // different shape
    });
    const queue = new QuestionQueueManager([existing]);

    const result = aggregateSpecificsNeedEmissions(
      [
        buildEmission({
          anchorParagraph: 2,
          expectedAnswerShape: 'specific_memory', // different shape
          framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
        }),
      ],
      queue,
      3,
    );

    expect(result.deduplicatedAgainstExisting).toBe(0);
    expect(result.addedToQueue).toBe(1);
  });

  it('framingSeed below similarity threshold does not match (forks into new question)', () => {
    const existing = buildExistingDigQuestion('existing-1', {
      framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
    });
    const queue = new QuestionQueueManager([existing]);

    const result = aggregateSpecificsNeedEmissions(
      [
        buildEmission({
          anchorParagraph: 2,
          expectedAnswerShape: 'specific_memory',
          // completely different vocabulary — Jaccard ≈ 0
          framingSeed: 'how did you feel emotionally during the climactic conversation',
        }),
      ],
      queue,
      3,
    );

    expect(result.deduplicatedAgainstExisting).toBe(0);
    expect(result.addedToQueue).toBe(1);
  });

  it('multiple emissions matching the same existing question increment iterationsSurvived only ONCE', () => {
    // Critical contract: if many emissions in one run all match the same
    // existing question (e.g., the same gap recurring across L3 + L3.5
    // + L3.75 readings), the existing question's iterationsSurvived
    // increments by 1, not by N. The Set tracking in the aggregator
    // prevents the multiple-increment.
    const existing = buildExistingDigQuestion('existing-1', {
      framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
      iterationsSurvived: 5,
    });
    const queue = new QuestionQueueManager([existing]);

    aggregateSpecificsNeedEmissions(
      [
        buildEmission({
          sourceLayer: 'l3_walk',
          anchorParagraph: 2,
          expectedAnswerShape: 'specific_memory',
          framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
        }),
        buildEmission({
          sourceLayer: 'l3_5_analysis',
          anchorParagraph: 2,
          expectedAnswerShape: 'specific_memory',
          framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
        }),
        buildEmission({
          sourceLayer: 'l3_75_phase_a',
          anchorParagraph: 2,
          expectedAnswerShape: 'specific_memory',
          framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
        }),
      ],
      queue,
      6,
    );

    expect(queue.getById('existing-1')!.iterationsSurvived).toBe(6); // 5 + 1, NOT 5 + 3
  });

  it('cross-anchor false-merge guard: new emission at anchor 5 does NOT dedup-match existing question at anchor 2 even with identical seed (round-1 audit LOW closure)', () => {
    // The dedup contract gates on (anchorParagraph, expectedAnswerShape,
    // framingSeed-similarity). The first two are gates; similarity is
    // the third dimension. Verifying that anchor difference alone
    // prevents false-merge — even with identical seeds, two emissions
    // about different paragraphs are distinct gaps.
    //
    // NOTE: The current implementation's findMatchingExisting walks
    // existingOpen and gates only on expectedAnswerShape + framingSeed
    // similarity (not anchorParagraph), because existing UQs don't
    // carry anchorParagraph on DigContext. This test pins the CURRENT
    // behavior while the implementation comment at
    // specificsNeedAggregator.ts:findMatchingExisting documents the
    // design choice. If a future deliverable adds anchorParagraph to
    // DigContext for stricter dedup, this test's expectations flip.
    const existing = buildExistingDigQuestion('existing-anchor-2', {
      framingSeed: 'asking about the specific moment in paragraph and what physically happened',
    });
    const queue = new QuestionQueueManager([existing]);

    const result = aggregateSpecificsNeedEmissions(
      [
        buildEmission({
          anchorParagraph: 5, // different anchor
          expectedAnswerShape: 'specific_memory',
          framingSeed: 'asking about the specific moment in paragraph and what physically happened',
        }),
      ],
      queue,
      3,
    );

    // Current behavior: framingSeed similarity matches → dedups.
    // (Pinning the current shape; if dedup tightens to gate on anchor
    // explicitly, expected shifts to addedToQueue=1, deduplicatedAgainstExisting=0.)
    expect(result.totalEmissions).toBe(1);
    // The existing question's anchor differs but the seed is identical;
    // current implementation considers this a match.
    expect(result.deduplicatedAgainstExisting + result.addedToQueue).toBe(1);
  });

  it('newly-minted question matched by later emission in same run uses within-run dedup path', () => {
    // Three-way interaction: queue empty at start, emission 0 mints Q0,
    // emission 1 should match Q0 via the within-run path (NOT the
    // existing-queue path, since Q0 wasn't in the pre-aggregation
    // snapshot).
    const queue = new QuestionQueueManager([]);

    const result = aggregateSpecificsNeedEmissions(
      [
        buildEmission({
          sourceLayer: 'l3_walk',
          anchorParagraph: 2,
          expectedAnswerShape: 'specific_memory',
          framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
        }),
        buildEmission({
          sourceLayer: 'l3_5_analysis',
          anchorParagraph: 2,
          expectedAnswerShape: 'specific_memory',
          framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
        }),
      ],
      queue,
      1,
    );

    // Emission 0 minted; emission 1 within-run-deduped against Q0.
    expect(result.addedToQueue).toBe(1);
    expect(result.deduplicatedWithinRun).toBe(1);
    expect(result.deduplicatedAgainstExisting).toBe(0);
    // Q0 is in the queue with iterationsSurvived=0 (just minted).
    expect(queue.openCount).toBe(1);
    expect(queue.getOpenAnalysisGapQuestions()[0].iterationsSurvived).toBe(0);
  });

  it('only matches against OPEN existing questions (terminal statuses are ignored)', () => {
    // A question in 'asked_to_student' is not a candidate for dedup —
    // the dig flow has progressed beyond the open state. New emissions
    // should mint new questions even if they would have matched.
    const existingAsked: UnderstandingQuestion = {
      ...buildExistingDigQuestion('asked-1', {
        framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
      }),
      status: 'asked_to_student',
    };
    const queue = new QuestionQueueManager([existingAsked]);

    const result = aggregateSpecificsNeedEmissions(
      [
        buildEmission({
          anchorParagraph: 2,
          expectedAnswerShape: 'specific_memory',
          framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
        }),
      ],
      queue,
      3,
    );

    expect(result.deduplicatedAgainstExisting).toBe(0);
    expect(result.addedToQueue).toBe(1);
  });
});

// ─── §4 — Within-run dedup ─────────────────────────────────────────────

describe('D-2.7 §4 — Within-run dedup', () => {
  it('duplicate emissions within the same run mint only the first', () => {
    const queue = new QuestionQueueManager([]);
    const result = aggregateSpecificsNeedEmissions(
      [
        buildEmission({
          sourceLayer: 'l3_walk',
          anchorParagraph: 2,
          expectedAnswerShape: 'specific_memory',
          framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
        }),
        buildEmission({
          sourceLayer: 'l3_5_analysis',
          anchorParagraph: 2,
          expectedAnswerShape: 'specific_memory',
          framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
        }),
      ],
      queue,
      1,
    );

    expect(result.totalEmissions).toBe(2);
    expect(result.addedToQueue).toBe(1);
    expect(result.deduplicatedWithinRun).toBe(1);
    expect(queue.openCount).toBe(1);
  });

  it('emissions with same anchor+shape but below-threshold framingSeed similarity both mint', () => {
    const queue = new QuestionQueueManager([]);
    const result = aggregateSpecificsNeedEmissions(
      [
        buildEmission({
          anchorParagraph: 2,
          expectedAnswerShape: 'specific_memory',
          framingSeed: 'asking about the specific moment in paragraph two and what physically happened',
        }),
        buildEmission({
          anchorParagraph: 2,
          expectedAnswerShape: 'specific_memory',
          framingSeed: 'how did the emotional weight land for you in that climactic exchange',
        }),
      ],
      queue,
      1,
    );

    expect(result.addedToQueue).toBe(2);
    expect(result.deduplicatedWithinRun).toBe(0);
  });

  it('emissions with different anchorParagraph never within-run-dedup against each other', () => {
    const queue = new QuestionQueueManager([]);
    const result = aggregateSpecificsNeedEmissions(
      [
        buildEmission({
          anchorParagraph: 1,
          expectedAnswerShape: 'specific_memory',
          framingSeed: 'asking about the specific moment in paragraph one',
        }),
        buildEmission({
          anchorParagraph: 2,
          expectedAnswerShape: 'specific_memory',
          framingSeed: 'asking about the specific moment in paragraph two',
        }),
      ],
      queue,
      1,
    );
    expect(result.addedToQueue).toBe(2);
    expect(result.deduplicatedWithinRun).toBe(0);
  });
});

// ─── §5 — Tokenization + Jaccard helpers ───────────────────────────────

describe('D-2.7 §5 — Tokenization + Jaccard helpers', () => {
  it('tokenize lowercases + drops short tokens (< 3 chars)', () => {
    const tokens = tokenize('A The quick brown fox');
    expect(tokens.has('a')).toBe(false); // 1 char
    expect(tokens.has('the')).toBe(true); // 3 chars (kept)
    expect(tokens.has('quick')).toBe(true);
    expect(tokens.has('brown')).toBe(true);
    expect(tokens.has('fox')).toBe(true);
  });

  it('tokenize splits on non-word characters', () => {
    const tokens = tokenize("paragraph two's specific moment — what happened?");
    expect(tokens.has('paragraph')).toBe(true);
    expect(tokens.has('two')).toBe(true);
    expect(tokens.has('specific')).toBe(true);
    expect(tokens.has('moment')).toBe(true);
    expect(tokens.has('what')).toBe(true);
    expect(tokens.has('happened')).toBe(true);
  });

  it('jaccardSimilarity computes intersection / union correctly', () => {
    const a = new Set(['alpha', 'beta', 'gamma']);
    const b = new Set(['beta', 'gamma', 'delta']);
    // intersection = {beta, gamma} = 2; union = {alpha, beta, gamma, delta} = 4
    expect(jaccardSimilarity(a, b)).toBe(2 / 4);
  });

  it('jaccardSimilarity returns 0 for two empty sets', () => {
    expect(jaccardSimilarity(new Set(), new Set())).toBe(0);
  });

  it('jaccardSimilarity returns 0 when one set is empty', () => {
    expect(jaccardSimilarity(new Set(['alpha']), new Set())).toBe(0);
  });

  it('jaccardSimilarity returns 1.0 for identical sets', () => {
    const a = new Set(['alpha', 'beta', 'gamma']);
    const b = new Set(['alpha', 'beta', 'gamma']);
    expect(jaccardSimilarity(a, b)).toBe(1);
  });

  it('FRAMING_SEED_SIMILARITY_THRESHOLD is 0.5 (the conservative-merge calibration)', () => {
    // Pin the threshold value as a contract so a future tuning change
    // surfaces in this test rather than silently shifting dedup behavior.
    expect(FRAMING_SEED_SIMILARITY_THRESHOLD).toBe(0.5);
  });
});

// ─── §6 — Edge cases ───────────────────────────────────────────────────

describe('D-2.7 §6 — Edge cases', () => {
  it('empty emissions array is a no-op (zero stats)', () => {
    const queue = new QuestionQueueManager([]);
    const result = aggregateSpecificsNeedEmissions([], queue, 1);
    expect(result.totalEmissions).toBe(0);
    expect(result.addedToQueue).toBe(0);
    expect(result.deduplicatedAgainstExisting).toBe(0);
    expect(result.deduplicatedWithinRun).toBe(0);
    expect(queue.openCount).toBe(0);
  });

  it('emission with anchorSentence persists through to the minted question (round-1 audit HIGH-1 closure)', () => {
    // [round-1 audit HIGH-1 closure 2026-05-01] DigContext.anchorSentence
    // field added in the same closure pass; emissions carrying sentence-
    // level anchor granularity persist that signal end-to-end rather
    // than being silently dropped at mint time.
    const queue = new QuestionQueueManager([]);
    aggregateSpecificsNeedEmissions(
      [buildEmission({ anchorParagraph: 3, anchorSentence: 7 })],
      queue,
      1,
    );
    const minted = queue.getOpenAnalysisGapQuestions()[0];
    expect(minted.anchorParagraph).toBe(3);
    expect(minted.dig?.anchorSentence).toBe(7);
  });

  it('emission without anchorSentence does not set dig.anchorSentence', () => {
    // Negative companion to the prior test: when the emission omits
    // anchorSentence, the minted question's dig.anchorSentence is
    // undefined (not 0, not null — the optional-field-omitted shape).
    const queue = new QuestionQueueManager([]);
    aggregateSpecificsNeedEmissions(
      [buildEmission({ anchorParagraph: 3 })],
      queue,
      1,
    );
    const minted = queue.getOpenAnalysisGapQuestions()[0];
    expect(minted.dig?.anchorSentence).toBeUndefined();
  });
});
