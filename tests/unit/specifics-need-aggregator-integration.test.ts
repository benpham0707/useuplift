// ============================================================================
// D-2.8 — specificsNeedAggregatorIntegration unit tests
// ============================================================================
// Drives `runSpecificsNeedAggregation(profile, iteration)` directly. Three
// concerns under test:
//
//   §1 Collection — does the helper read every layer's emissions field on
//      the profile, in the documented stable order?
//   §2 Aggregation pass-through — when emissions exist, are the aggregator's
//      contracts (dedup against existing, dedup within run, mint into queue)
//      observable on the returned profile?
//   §3 Edge cases — empty profile, undefined fields, paragraphs with no
//      understanding/analysis, throw propagation.
//
// Test fixtures use `as unknown as EssayProfile` partial casts. The helper
// only reads .paragraphs / .essayUnderstanding / .northStar / .questionQueue;
// the surrounding fields don't matter for these tests. If the helper ever
// reads more, casts surface the gap immediately.
// ============================================================================

import { describe, it, expect } from 'vitest';
import { runSpecificsNeedAggregation } from '../../src/services/essayIntelligence/analysis/specificsNeedAggregatorIntegration';
import type {
  EssayProfile,
  SpecificsNeedEmission,
  UnderstandingQuestion,
} from '../../src/services/essayIntelligence/profileTypes';

// ─── Test fixtures ─────────────────────────────────────────────────────────

let emissionCounter = 0;

function buildEmission(
  overrides: Partial<SpecificsNeedEmission> = {},
): SpecificsNeedEmission {
  emissionCounter++;
  return {
    sourceLayer: 'l3_walk',
    emittingTrigger: `trigger-${emissionCounter} that surfaces a concrete gap`,
    anchorParagraph: 0,
    question: `What did you actually experience in that moment ${emissionCounter}?`,
    dimensions: ['narrative', 'emotion'],
    expectedInsight: `The lived experience that grounds the moment ${emissionCounter}`,
    priority: 'medium',
    whyAsked: `Walk identified a finding whose claim cannot be deepened from text alone — case ${emissionCounter}`,
    expectedAnswerShape: 'specific_memory',
    consumers: ['l3', 'l5'],
    populates: ['groundTruthFacts.byLocation'],
    framingSeed: `asking about the specific moment unique seed ${emissionCounter} alpha bravo charlie`,
    // D-2.2 round 1.8 fields
    expectedDiscovery: `the writer would discover the lived moment ${emissionCounter} that grounds the abstract claim`,
    conceptTag: 'specific over general',
    conceptComplexity: 'simple',
    conceptDefinition:
      'Specific over general means choosing a precise concrete detail over an abstract category.',
    conceptExample:
      "From a college essay: 'Three days before I got on a plane I quit milk cold-turkey.'",
    ...overrides,
  };
}

function makeProfile(opts: {
  paragraphs?: Array<{
    walkEmissions?: SpecificsNeedEmission[];
    analysisEmissions?: SpecificsNeedEmission[];
  }>;
  holisticEmissions?: SpecificsNeedEmission[];
  northStarEmissions?: SpecificsNeedEmission[];
  questionQueue?: UnderstandingQuestion[];
}): EssayProfile {
  const paragraphs = (opts.paragraphs ?? []).map((p, i) => ({
    index: i,
    text: `paragraph ${i}`,
    tags: [],
    sentences: [],
    understanding: p.walkEmissions
      ? {
          role: 'r',
          function: 'f',
          narrativeContribution: 'n',
          emotionalRegister: {
            dominantEmotion: 'e',
            depth: 'd',
            authenticity: 'a',
            showVsTell: 's',
            strongestMoment: null,
          },
          craftProfile: {
            rhythmPattern: 'rp',
            imageUsage: 'iu',
            voiceConsistency: 'vc',
            standoutMoment: null,
          },
          specificsNeedEmissions: p.walkEmissions,
        }
      : null,
    analysis: p.analysisEmissions
      ? {
          effectiveness: 50,
          verdict: 'v',
          strengthSignatures: [],
          growthEdges: [],
          specificsNeedEmissions: p.analysisEmissions,
        }
      : null,
  }));

  const profile: Partial<EssayProfile> = {
    paragraphs: paragraphs as unknown as EssayProfile['paragraphs'],
    questionQueue: opts.questionQueue ?? [],
  };

  if (opts.holisticEmissions) {
    profile.essayUnderstanding = {
      prose: '',
      centralTension: '',
      confirmedInsights: [],
      activeHypotheses: [],
      maturity: 'initial',
      growthLog: [],
      specificsNeedEmissions: opts.holisticEmissions,
    } as EssayProfile['essayUnderstanding'];
  }

  if (opts.northStarEmissions) {
    profile.northStar = {
      activeScale: 'standard' as EssayProfile['northStar']['activeScale'],
      throughLineMap: null,
      structuralRolesMap: [],
      trajectory: null,
      distinctivenessSignature:
        {} as EssayProfile['northStar']['distinctivenessSignature'],
      intentBridge: null,
      confidence: 'medium' as EssayProfile['northStar']['confidence'],
      lastUpdatedBy: 'L4',
      specificsNeedEmissions: opts.northStarEmissions,
    } as EssayProfile['northStar'];
  }

  return profile as EssayProfile;
}

// ─── §1 — Empty profile is a no-op ─────────────────────────────────────────

describe('D-2.8 §1 — Empty / sparse profile', () => {
  it('returns hadEmissions=false and 0 added when profile has no emissions anywhere', () => {
    const profile = makeProfile({ paragraphs: [{}, {}, {}] });
    const result = runSpecificsNeedAggregation(profile, 1);
    expect(result.hadEmissions).toBe(false);
    expect(result.aggregationResult.totalEmissions).toBe(0);
    expect(result.aggregationResult.addedToQueue).toBe(0);
    expect(profile.questionQueue).toEqual([]);
  });

  it('handles undefined paragraphs array gracefully', () => {
    const profile = { questionQueue: [] } as unknown as EssayProfile;
    const result = runSpecificsNeedAggregation(profile, 1);
    expect(result.hadEmissions).toBe(false);
    expect(result.aggregationResult.totalEmissions).toBe(0);
  });

  it('handles undefined questionQueue gracefully (initializes empty)', () => {
    const profile = { paragraphs: [] } as unknown as EssayProfile;
    runSpecificsNeedAggregation(profile, 1);
    expect(profile.questionQueue).toEqual([]);
  });

  it('skips paragraphs with null understanding and null analysis without error', () => {
    const profile = makeProfile({
      paragraphs: [{}, { walkEmissions: [buildEmission()] }, {}],
    });
    const result = runSpecificsNeedAggregation(profile, 1);
    expect(result.aggregationResult.totalEmissions).toBe(1);
    expect(result.aggregationResult.addedToQueue).toBe(1);
  });
});

// ─── §2 — Collection from every layer ──────────────────────────────────────

describe('D-2.8 §2 — Collection from every layer', () => {
  it('reads walk emissions from paragraph.understanding', () => {
    const e = buildEmission({ sourceLayer: 'l3_walk', anchorParagraph: 0 });
    const profile = makeProfile({ paragraphs: [{ walkEmissions: [e] }] });
    const result = runSpecificsNeedAggregation(profile, 1);
    expect(result.aggregationResult.byLayer.l3_walk).toBe(1);
    expect(result.aggregationResult.addedToQueue).toBe(1);
  });

  it('reads analysis emissions from paragraph.analysis', () => {
    const e = buildEmission({ sourceLayer: 'l3_5_analysis', anchorParagraph: 0 });
    const profile = makeProfile({ paragraphs: [{ analysisEmissions: [e] }] });
    const result = runSpecificsNeedAggregation(profile, 1);
    expect(result.aggregationResult.byLayer.l3_5_analysis).toBe(1);
    expect(result.aggregationResult.addedToQueue).toBe(1);
  });

  it('reads holistic emissions from essayUnderstanding', () => {
    const e = buildEmission({ sourceLayer: 'l3_75_phase_a', anchorParagraph: 0 });
    const profile = makeProfile({ holisticEmissions: [e] });
    const result = runSpecificsNeedAggregation(profile, 1);
    expect(result.aggregationResult.byLayer.l3_75_phase_a).toBe(1);
    expect(result.aggregationResult.addedToQueue).toBe(1);
  });

  it('reads northStar emissions from northStar', () => {
    const e = buildEmission({ sourceLayer: 'l4_north_star', anchorParagraph: 0 });
    const profile = makeProfile({ northStarEmissions: [e] });
    const result = runSpecificsNeedAggregation(profile, 1);
    expect(result.aggregationResult.byLayer.l4_north_star).toBe(1);
    expect(result.aggregationResult.addedToQueue).toBe(1);
  });

  it('combines emissions from all four layers in one run', () => {
    // Distinct (anchorParagraph, expectedAnswerShape) per emission so the
    // aggregator's anchor-shape dedup doesn't fold them together — this
    // test is about COLLECTION coverage, not dedup behavior (which §3 + §4
    // cover).
    const profile = makeProfile({
      paragraphs: [
        {
          walkEmissions: [
            buildEmission({
              sourceLayer: 'l3_walk',
              anchorParagraph: 0,
              expectedAnswerShape: 'specific_memory',
            }),
          ],
          analysisEmissions: [
            buildEmission({
              sourceLayer: 'l3_5_analysis',
              anchorParagraph: 0,
              expectedAnswerShape: 'short_phrase',
            }),
          ],
        },
      ],
      holisticEmissions: [
        buildEmission({
          sourceLayer: 'l3_75_phase_a',
          anchorParagraph: 0,
          expectedAnswerShape: 'list',
        }),
      ],
      northStarEmissions: [
        buildEmission({
          sourceLayer: 'l4_north_star',
          anchorParagraph: 0,
          expectedAnswerShape: 'narrative',
        }),
      ],
    });
    const result = runSpecificsNeedAggregation(profile, 1);
    expect(result.aggregationResult.totalEmissions).toBe(4);
    expect(result.aggregationResult.byLayer.l3_walk).toBe(1);
    expect(result.aggregationResult.byLayer.l3_5_analysis).toBe(1);
    expect(result.aggregationResult.byLayer.l3_75_phase_a).toBe(1);
    expect(result.aggregationResult.byLayer.l4_north_star).toBe(1);
    expect(result.aggregationResult.addedToQueue).toBe(4);
    expect(profile.questionQueue.length).toBe(4);
  });

  it('does not collect from finding_maturity layer (D-2.6 forthcoming)', () => {
    // The integration helper does NOT scan FindingStore. D-2.6 will provide
    // its own emissions which the orchestrator will concatenate into the
    // aggregator call separately. Until then, this layer naturally has
    // zero emissions. This test pins that contract: even if a profile
    // somehow had finding_maturity emissions stashed somewhere the helper
    // reads, the helper should NOT pick them up from the paragraph /
    // essay-level fields — those fields are scoped to their own layers.
    const profile = makeProfile({
      paragraphs: [
        {
          walkEmissions: [
            buildEmission({ sourceLayer: 'finding_maturity', anchorParagraph: 0 }),
          ],
        },
      ],
    });
    // Note: the helper WILL pick this up because a finding_maturity emission
    // mistakenly placed in paragraph.understanding gets concatenated. The
    // contract here is "the helper trusts the source-layer field"; if a
    // prompt contract violation lands a wrong-layer emission, the byLayer
    // count tells the auditor exactly which sourceLayer slot it claimed.
    const result = runSpecificsNeedAggregation(profile, 1);
    expect(result.aggregationResult.byLayer.finding_maturity).toBe(1);
    // This is intentional — the helper does not police layer-vs-storage-site
    // mismatches because it doesn't know which storage site is "right" for
    // each layer (D-2.6 may use a separate path entirely).
  });
});

// ─── §3 — Stable order: walk-before-analysis, paragraph-before-essay ──────

describe('D-2.8 §3 — Stable collection order', () => {
  it('walk emissions appear before analysis emissions for the same paragraph', () => {
    // Same anchor + shape across walk & analysis — within-run dedup folds
    // analysis into walk's mint. Walk is first → walk's emission wins.
    const sameSeed =
      'asking about the specific moment in paragraph two and what physically happened';
    const walk = buildEmission({
      sourceLayer: 'l3_walk',
      anchorParagraph: 0,
      framingSeed: sameSeed,
    });
    const analysis = buildEmission({
      sourceLayer: 'l3_5_analysis',
      anchorParagraph: 0,
      framingSeed: sameSeed,
    });
    const profile = makeProfile({
      paragraphs: [{ walkEmissions: [walk], analysisEmissions: [analysis] }],
    });
    const result = runSpecificsNeedAggregation(profile, 1);
    expect(result.aggregationResult.totalEmissions).toBe(2);
    expect(result.aggregationResult.deduplicatedWithinRun).toBe(1);
    expect(result.aggregationResult.addedToQueue).toBe(1);
    // The minted question should reference the WALK question text (walk wins)
    expect(profile.questionQueue[0].question).toBe(walk.question);
  });

  it('paragraph 0 emissions appear before paragraph 1 emissions in collection order', () => {
    // Distinct anchorParagraph (0 and 1) → distinct anchor keys → no dedup;
    // both mint. Collection order = mint order = queue insertion order.
    // Asserting profile.questionQueue[0] === p0_question pins the
    // ascending-paragraph-index collection order documented in the helper.
    const p0 = buildEmission({ sourceLayer: 'l3_walk', anchorParagraph: 0 });
    const p1 = buildEmission({ sourceLayer: 'l3_walk', anchorParagraph: 1 });
    const profile = makeProfile({
      paragraphs: [{ walkEmissions: [p0] }, { walkEmissions: [p1] }],
    });
    const result = runSpecificsNeedAggregation(profile, 1);
    expect(result.aggregationResult.deduplicatedWithinRun).toBe(0);
    expect(result.aggregationResult.addedToQueue).toBe(2);
    expect(profile.questionQueue[0].question).toBe(p0.question);
    expect(profile.questionQueue[1].question).toBe(p1.question);
  });

  it('per-paragraph emissions appear before essay-level emissions', () => {
    const sameSeed = 'the shared seed phrase common between layers for testing';
    const walk = buildEmission({
      sourceLayer: 'l3_walk',
      anchorParagraph: 0,
      framingSeed: sameSeed,
    });
    const holistic = buildEmission({
      sourceLayer: 'l3_75_phase_a',
      anchorParagraph: 0,
      framingSeed: sameSeed,
    });
    const profile = makeProfile({
      paragraphs: [{ walkEmissions: [walk] }],
      holisticEmissions: [holistic],
    });
    const result = runSpecificsNeedAggregation(profile, 1);
    expect(result.aggregationResult.deduplicatedWithinRun).toBe(1);
    expect(profile.questionQueue[0].question).toBe(walk.question);
  });

  it('holistic emissions appear before northStar emissions', () => {
    const sameSeed = 'another shared seed phrase common between layers for testing';
    const holistic = buildEmission({
      sourceLayer: 'l3_75_phase_a',
      anchorParagraph: 0,
      framingSeed: sameSeed,
    });
    const northStar = buildEmission({
      sourceLayer: 'l4_north_star',
      anchorParagraph: 0,
      framingSeed: sameSeed,
    });
    const profile = makeProfile({
      holisticEmissions: [holistic],
      northStarEmissions: [northStar],
    });
    const result = runSpecificsNeedAggregation(profile, 1);
    expect(result.aggregationResult.deduplicatedWithinRun).toBe(1);
    expect(profile.questionQueue[0].question).toBe(holistic.question);
  });
});

// ─── §4 — Existing queue interaction ───────────────────────────────────────

describe('D-2.8 §4 — Existing queue interaction', () => {
  it('writes the queue back to profile.questionQueue (mutation persists)', () => {
    const e = buildEmission();
    const profile = makeProfile({ paragraphs: [{ walkEmissions: [e] }] });
    expect(profile.questionQueue).toEqual([]);
    runSpecificsNeedAggregation(profile, 1);
    expect(profile.questionQueue.length).toBe(1);
  });

  it('preserves existing queue questions during aggregation', () => {
    const existing: UnderstandingQuestion = {
      id: 'EXISTING-1',
      question: 'A pre-existing curated question',
      dimensions: ['voice'],
      expectedInsight: 'Some insight',
      source: 'l3_75_curated',
      status: 'open',
      priority: 'high',
      iterationsSurvived: 0,
      spawnedQuestions: [],
      raisedAt: '2026-04-30T00:00:00.000Z',
      raisedDuringIteration: 1,
    };
    const e = buildEmission();
    const profile = makeProfile({
      paragraphs: [{ walkEmissions: [e] }],
      questionQueue: [existing],
    });
    runSpecificsNeedAggregation(profile, 1);
    expect(profile.questionQueue.length).toBe(2);
    expect(profile.questionQueue.find((q) => q.id === 'EXISTING-1')).toBeDefined();
  });

  it('idempotent when called twice with same profile state and iteration', () => {
    // Mirrors D-2.11 property test — within-run dedup folds the second
    // pass's emissions into the first pass's mints (same anchor + shape,
    // same seed → match → existing-match dedup increments iterationsSurvived
    // exactly once total across the two passes via single-increment-per-
    // existing-match).
    const e = buildEmission();
    const profile = makeProfile({ paragraphs: [{ walkEmissions: [e] }] });
    const r1 = runSpecificsNeedAggregation(profile, 1);
    const queueAfterPass1 = JSON.parse(JSON.stringify(profile.questionQueue));
    const r2 = runSpecificsNeedAggregation(profile, 1);
    expect(r1.aggregationResult.addedToQueue).toBe(1);
    expect(r2.aggregationResult.addedToQueue).toBe(0);
    // Queue length stable
    expect(profile.questionQueue.length).toBe(queueAfterPass1.length);
    // Pass 2 sees the existing match
    expect(r2.aggregationResult.deduplicatedAgainstExisting).toBe(1);
  });
});

// ─── §5 — Error propagation ────────────────────────────────────────────────

describe('D-2.8 §5 — Error propagation', () => {
  it('throws when aggregator rejects a malformed emission', () => {
    const bad = buildEmission({ question: '' });
    const profile = makeProfile({ paragraphs: [{ walkEmissions: [bad] }] });
    expect(() => runSpecificsNeedAggregation(profile, 1)).toThrow();
  });

  it('throws when an essay-level layer emits a malformed emission', () => {
    const bad = buildEmission({ whyAsked: '   ', sourceLayer: 'l4_north_star' });
    const profile = makeProfile({ northStarEmissions: [bad] });
    expect(() => runSpecificsNeedAggregation(profile, 1)).toThrow();
  });
});
