// ============================================================================
// D-2.12 — Phase 2 Aggregator Spine Integration Test (mock-LLM, zero API)
// ============================================================================
//
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md
//   §D-2.12 — "Mock-LLM integration test for Phase 2 spine. Drive
//   `runSpecificsNeedAggregationWithTelemetry` with synthetic layer outputs;
//   assert queue mutations + telemetry shape + dig-flow state machine
//   end-to-end. Zero API."
//
// Filename: literal `phase2-aggregator-spine.ts` per the spec convention
// (no `.test.ts` suffix — separate test category, matching D-1.13/14/15
// established for property/integration tests).
//
// ─── Architectural decision ──────────────────────────────────────────────
//
// D-2.12 tests at the **Phase 5.6 integration seam** — the boundary where
// per-layer emissions become questionQueue mutations + telemetry events.
// We do NOT drive `analyzeEssay` end-to-end because:
//
//   (i) The D-2.2-D-2.6 prompts that produce emissions haven't shipped
//       yet. Mocking the LLM boundary would yield empty emissions arrays
//       (the layers don't yet plumb LLM JSON into `specificsNeedEmissions`).
//
//   (ii) The contracts D-2.12 actually asserts (queue state machine
//        extensions from D-2.1, aggregator dedup contract from D-2.7,
//        emit/log behavior from D-2.8) ALL live at the
//        `runSpecificsNeedAggregationWithTelemetry` seam. Mocking layers
//        above that seam adds noise without diagnostic value.
//
//   (iii) Layer-level integration becomes natural when D-2.2-D-2.6 ship —
//         their prompts will populate `specificsNeedEmissions` from LLM
//         JSON, and downstream test deliverables will exercise the full
//         path. D-2.12's job is the spine.
//
// What we DO test:
//   §1 — Single-layer emit → queue mutated + success telemetry shape
//   §2 — Multi-layer emit → byLayer breakdown correct
//   §3 — Dedup against existing queue → existing-match increment + telemetry
//   §4 — Within-run dedup → first-wins + telemetry
//   §5 — Silence is signal → zero telemetry events
//   §6 — Schema-invalid emission → 'failed' event, no throw past the seam
//   §7 — Dig-flow state machine on aggregator-minted questions
//   §8 — Multi-iteration idempotency
//
// Telemetry buffer inspection: `flushEventsForIteration(essayId, iteration)`
// returns events the seam emitted; `__resetTelemetryForTesting()` between
// tests prevents cross-test pollution. Both are existing utilities from
// `iterationTelemetry.ts`.
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  runSpecificsNeedAggregationWithTelemetry,
  PHASE_5_6_STEP_NAME,
} from '../../src/services/essayIntelligence/analysis/specificsNeedAggregatorIntegration';
import { QuestionQueueManager } from '../../src/services/essayIntelligence/analysis/questionQueueManager';
import {
  flushEventsForIteration,
  __resetTelemetryForTesting,
} from '../../src/services/essayIntelligence/telemetry/iterationTelemetry';
import type {
  EssayProfile,
  SpecificsNeedEmission,
  UnderstandingQuestion,
  IterationTelemetryEvent,
} from '../../src/services/essayIntelligence/profileTypes';

// ─── Test fixtures ─────────────────────────────────────────────────────────

const ESSAY_ID = 'phase2-aggregator-spine-essay-id';

let emissionCounter = 0;

function buildEmission(
  overrides: Partial<SpecificsNeedEmission> = {},
): SpecificsNeedEmission {
  emissionCounter++;
  return {
    sourceLayer: 'l3_walk',
    emittingTrigger: `concrete trigger context-${emissionCounter} naming what surfaced the gap`,
    anchorParagraph: 0,
    question: `What did you actually experience in that moment ${emissionCounter}?`,
    dimensions: ['narrative', 'emotion'],
    expectedInsight: `The lived experience that grounds the moment ${emissionCounter}`,
    priority: 'medium',
    whyAsked: `walk identified a finding whose claim cannot be deepened from text alone — case ${emissionCounter}`,
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

function buildExistingDigQuestion(opts: {
  id: string;
  framingSeed?: string;
  expectedAnswerShape?: SpecificsNeedEmission['expectedAnswerShape'];
  iterationsSurvived?: number;
  anchorParagraph?: number;
}): UnderstandingQuestion {
  return {
    id: opts.id,
    question: `Existing question ${opts.id}`,
    dimensions: ['narrative'],
    expectedInsight: 'Existing expected insight',
    source: 'analysis_specifics_gap',
    status: 'open',
    priority: 'medium',
    iterationsSurvived: opts.iterationsSurvived ?? 0,
    spawnedQuestions: [],
    raisedAt: '2026-04-30T00:00:00.000Z',
    raisedDuringIteration: 1,
    dig: {
      whyAsked: 'Existing why',
      expectedAnswerShape: opts.expectedAnswerShape ?? 'specific_memory',
      consumers: ['l3'],
      populates: ['groundTruthFacts.byLocation'],
      framingSeed:
        opts.framingSeed ??
        'existing framing seed text about the moment in paragraph two',
      anchorParagraph: opts.anchorParagraph ?? 2,
    },
  };
}

function readSpineEvents(
  essayId: string,
  iteration: number,
): IterationTelemetryEvent[] {
  return flushEventsForIteration(essayId, iteration).filter(
    (e) => e.step === PHASE_5_6_STEP_NAME,
  );
}

beforeEach(() => {
  __resetTelemetryForTesting();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── §1 — Single-layer emit ────────────────────────────────────────────────

describe('D-2.12 §1 — Single-layer emit produces correct queue + telemetry', () => {
  it('walk emission → 1 mint, success telemetry with byLayer.l3_walk=1', () => {
    const profile = makeProfile({
      paragraphs: [{ walkEmissions: [buildEmission({ sourceLayer: 'l3_walk' })] }],
    });
    const result = runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID);
    expect(result?.hadEmissions).toBe(true);
    expect(profile.questionQueue.length).toBe(1);

    const events = readSpineEvents(ESSAY_ID, 1);
    expect(events.length).toBe(1);
    expect(events[0].status).toBe('succeeded');
    const md = events[0].metadata as Record<string, unknown>;
    expect(md.totalEmissions).toBe(1);
    expect(md.addedToQueue).toBe(1);
    expect((md.byLayer as Record<string, number>).l3_walk).toBe(1);
  });

  it('holistic emission → success telemetry with byLayer.l3_75_phase_a=1', () => {
    const profile = makeProfile({
      holisticEmissions: [buildEmission({ sourceLayer: 'l3_75_phase_a' })],
    });
    runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID);

    const events = readSpineEvents(ESSAY_ID, 1);
    const md = events[0].metadata as Record<string, unknown>;
    expect((md.byLayer as Record<string, number>).l3_75_phase_a).toBe(1);
  });

  it('northStar emission → success telemetry with byLayer.l4_north_star=1', () => {
    const profile = makeProfile({
      northStarEmissions: [buildEmission({ sourceLayer: 'l4_north_star' })],
    });
    runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID);

    const events = readSpineEvents(ESSAY_ID, 1);
    const md = events[0].metadata as Record<string, unknown>;
    expect((md.byLayer as Record<string, number>).l4_north_star).toBe(1);
  });
});

// ─── §2 — Multi-layer emit ─────────────────────────────────────────────────

describe('D-2.12 §2 — Multi-layer emit produces correct byLayer breakdown', () => {
  it('all four layers → telemetry metadata pins every counter', () => {
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
    runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID);

    const events = readSpineEvents(ESSAY_ID, 1);
    expect(events.length).toBe(1);
    const md = events[0].metadata as Record<string, unknown>;
    expect(md.totalEmissions).toBe(4);
    expect(md.addedToQueue).toBe(4);
    expect(md.deduplicatedAgainstExisting).toBe(0);
    expect(md.deduplicatedWithinRun).toBe(0);
    const byLayer = md.byLayer as Record<string, number>;
    expect(byLayer.l3_walk).toBe(1);
    expect(byLayer.l3_5_analysis).toBe(1);
    expect(byLayer.l3_75_phase_a).toBe(1);
    expect(byLayer.l4_north_star).toBe(1);
  });

  it('telemetry metadata shape matches D-2.8 contract (F2 follow-up pin)', () => {
    const profile = makeProfile({
      paragraphs: [{ walkEmissions: [buildEmission()] }],
    });
    runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID);

    const events = readSpineEvents(ESSAY_ID, 1);
    const md = events[0].metadata as Record<string, unknown>;
    expect(Object.keys(md).sort()).toEqual([
      'addedToQueue',
      'byLayer',
      'deduplicatedAgainstExisting',
      'deduplicatedWithinRun',
      'totalEmissions',
    ]);
  });
});

// ─── §3 — Dedup against existing queue ─────────────────────────────────────

describe('D-2.12 §3 — Dedup against existing queue', () => {
  it('emission matching existing → existing-match increment + addedToQueue=0', () => {
    const sharedSeed = 'asking about the specific moment in paragraph two and what physically happened';
    const existing = buildExistingDigQuestion({
      id: 'EXISTING-1',
      framingSeed: sharedSeed,
      expectedAnswerShape: 'specific_memory',
      anchorParagraph: 2,
    });
    const profile = makeProfile({
      paragraphs: [
        {
          walkEmissions: [
            buildEmission({
              sourceLayer: 'l3_walk',
              anchorParagraph: 2,
              expectedAnswerShape: 'specific_memory',
              framingSeed: sharedSeed,
            }),
          ],
        },
      ],
      questionQueue: [existing],
    });

    runSpecificsNeedAggregationWithTelemetry(profile, 2, ESSAY_ID);

    const events = readSpineEvents(ESSAY_ID, 2);
    const md = events[0].metadata as Record<string, unknown>;
    expect(md.totalEmissions).toBe(1);
    expect(md.addedToQueue).toBe(0);
    expect(md.deduplicatedAgainstExisting).toBe(1);
    // The existing question's iterationsSurvived incremented once.
    expect(profile.questionQueue.length).toBe(1);
    expect(profile.questionQueue[0].id).toBe('EXISTING-1');
    expect(profile.questionQueue[0].iterationsSurvived).toBe(1);
  });

  it('three matching emissions in same call → existing increments exactly once (single-increment-per-existing-match)', () => {
    const sharedSeed = 'asking about the specific moment in paragraph two and what physically happened';
    const existing = buildExistingDigQuestion({
      id: 'EXISTING-1',
      framingSeed: sharedSeed,
      expectedAnswerShape: 'specific_memory',
      anchorParagraph: 2,
      iterationsSurvived: 0,
    });
    const profile = makeProfile({
      paragraphs: [
        {
          walkEmissions: [
            buildEmission({
              sourceLayer: 'l3_walk',
              anchorParagraph: 2,
              framingSeed: sharedSeed,
            }),
          ],
          analysisEmissions: [
            buildEmission({
              sourceLayer: 'l3_5_analysis',
              anchorParagraph: 2,
              framingSeed: sharedSeed,
            }),
          ],
        },
      ],
      holisticEmissions: [
        buildEmission({
          sourceLayer: 'l3_75_phase_a',
          anchorParagraph: 2,
          framingSeed: sharedSeed,
        }),
      ],
      questionQueue: [existing],
    });

    runSpecificsNeedAggregationWithTelemetry(profile, 2, ESSAY_ID);
    expect(profile.questionQueue[0].iterationsSurvived).toBe(1);

    const events = readSpineEvents(ESSAY_ID, 2);
    const md = events[0].metadata as Record<string, unknown>;
    expect(md.deduplicatedAgainstExisting).toBe(3);
  });
});

// ─── §4 — Within-run dedup ─────────────────────────────────────────────────

describe('D-2.12 §4 — Within-run dedup (first-emission-wins)', () => {
  it('two emissions same anchor+shape+seed → first mints, second folds', () => {
    const sharedSeed = 'shared seed phrase across two emissions in the same run';
    const e1 = buildEmission({
      sourceLayer: 'l3_walk',
      anchorParagraph: 0,
      framingSeed: sharedSeed,
    });
    const e2 = buildEmission({
      sourceLayer: 'l3_5_analysis',
      anchorParagraph: 0,
      framingSeed: sharedSeed,
    });
    const profile = makeProfile({
      paragraphs: [{ walkEmissions: [e1], analysisEmissions: [e2] }],
    });

    runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID);
    expect(profile.questionQueue.length).toBe(1);
    // Walk wins (collected first in stable order)
    expect(profile.questionQueue[0].question).toBe(e1.question);

    const events = readSpineEvents(ESSAY_ID, 1);
    const md = events[0].metadata as Record<string, unknown>;
    expect(md.totalEmissions).toBe(2);
    expect(md.addedToQueue).toBe(1);
    expect(md.deduplicatedWithinRun).toBe(1);
  });
});

// ─── §5 — Silence is signal ────────────────────────────────────────────────

describe('D-2.12 §5 — Silence is the audit signal', () => {
  it('no emissions anywhere → zero telemetry events emitted', () => {
    const profile = makeProfile({ paragraphs: [{}, {}, {}] });
    const result = runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID);
    expect(result?.hadEmissions).toBe(false);

    const events = readSpineEvents(ESSAY_ID, 1);
    expect(events.length).toBe(0);
  });

  it('empty arrays on every layer → still zero telemetry events', () => {
    const profile = makeProfile({
      paragraphs: [{ walkEmissions: [], analysisEmissions: [] }],
      holisticEmissions: [],
      northStarEmissions: [],
    });
    runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID);
    const events = readSpineEvents(ESSAY_ID, 1);
    expect(events.length).toBe(0);
  });

  it('console.log not called when no emissions (silent path emits nothing)', () => {
    const logSpy = vi.spyOn(console, 'log');
    logSpy.mockClear();
    const profile = makeProfile({ paragraphs: [{}] });
    runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID);
    // No "Phase 5.6 specifics-need aggregation complete" log line on silence.
    const phaseLogs = logSpy.mock.calls.filter((call) =>
      String(call[0]).includes('Phase 5.6'),
    );
    expect(phaseLogs.length).toBe(0);
  });
});

// ─── §6 — Schema-invalid emission (failure path) ───────────────────────────

describe('D-2.12 §6 — Schema-invalid emission produces failed telemetry', () => {
  it('malformed emission → failed event with code + downstreamBehavior context', () => {
    const bad = buildEmission({ question: '' });
    const profile = makeProfile({ paragraphs: [{ walkEmissions: [bad] }] });

    // Must NOT throw past the seam.
    expect(() =>
      runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID),
    ).not.toThrow();

    const events = readSpineEvents(ESSAY_ID, 1);
    expect(events.length).toBe(1);
    expect(events[0].status).toBe('failed');
    expect(events[0].error?.code).toBe('specifics_need_aggregation_failed');
    expect(events[0].error?.context?.downstreamBehavior).toBeTruthy();
    expect(typeof events[0].error?.context?.downstreamBehavior).toBe('string');
  });

  it('returns null on caught failure (callers consult telemetry buffer)', () => {
    const bad = buildEmission({ whyAsked: '   ' });
    const profile = makeProfile({ northStarEmissions: [bad] });
    const result = runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID);
    expect(result).toBeNull();
  });
});

// ─── §7 — Dig-flow state machine on aggregator-minted questions (D-2.1 + D-2.8) ─

describe('D-2.12 §7 — Dig-flow state machine on aggregator-minted questions', () => {
  it('aggregator-minted question can transition open → asked_to_student → student_answered', () => {
    const profile = makeProfile({
      paragraphs: [{ walkEmissions: [buildEmission()] }],
    });
    runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID);

    expect(profile.questionQueue.length).toBe(1);
    const minted = profile.questionQueue[0];
    expect(minted.source).toBe('analysis_specifics_gap');
    expect(minted.status).toBe('open');

    // Re-construct the QueueManager from the post-aggregation queue and
    // exercise the dig-flow transitions (D-2.1 contract).
    const qm = new QuestionQueueManager(profile.questionQueue);
    expect(() => qm.markAskedToStudent(minted.id)).not.toThrow();
    expect(qm.getById(minted.id)?.status).toBe('asked_to_student');

    expect(() =>
      qm.markStudentAnswered(minted.id, 'I remember the smell of ozone before the storm.', {
        groundTruthFacts: ['smell of ozone before storm'],
      }),
    ).not.toThrow();
    expect(qm.getById(minted.id)?.status).toBe('student_answered');
  });

  it('getOpenAnalysisGapQuestions surfaces aggregator-minted questions', () => {
    // Distinct anchorParagraph values so the two emissions don't share an
    // anchor key (otherwise dedup would fold them via shared default seed
    // tokens at Jaccard > 0.5).
    const profile = makeProfile({
      paragraphs: [
        { walkEmissions: [buildEmission({ anchorParagraph: 0 })] },
        {
          analysisEmissions: [
            buildEmission({ sourceLayer: 'l3_5_analysis', anchorParagraph: 1 }),
          ],
        },
      ],
    });
    runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID);

    const qm = new QuestionQueueManager(profile.questionQueue);
    const open = qm.getOpenAnalysisGapQuestions();
    expect(open.length).toBe(2);
    expect(open.every((q) => q.source === 'analysis_specifics_gap')).toBe(true);
    expect(open.every((q) => q.status === 'open')).toBe(true);
  });
});

// ─── §8 — Multi-iteration idempotency ──────────────────────────────────────

describe('D-2.12 §8 — Multi-iteration idempotency', () => {
  it('iter 1 mints; iter 2 with unchanged profile dedupes against existing', () => {
    const profile = makeProfile({
      paragraphs: [{ walkEmissions: [buildEmission()] }],
    });

    // Iter 1: mint
    runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID);
    expect(profile.questionQueue.length).toBe(1);
    const md1 = readSpineEvents(ESSAY_ID, 1)[0].metadata as Record<string, unknown>;
    expect(md1.addedToQueue).toBe(1);

    // Iter 2: same emission, fold against existing
    runSpecificsNeedAggregationWithTelemetry(profile, 2, ESSAY_ID);
    expect(profile.questionQueue.length).toBe(1); // queue stable
    const md2 = readSpineEvents(ESSAY_ID, 2)[0].metadata as Record<string, unknown>;
    expect(md2.addedToQueue).toBe(0);
    expect(md2.deduplicatedAgainstExisting).toBe(1);
    // iterationsSurvived incremented (post-iter-1 it was 0; now 1)
    expect(profile.questionQueue[0].iterationsSurvived).toBe(1);
  });

  it('iter 3 with same emission again increments iterationsSurvived to 2', () => {
    const profile = makeProfile({
      paragraphs: [{ walkEmissions: [buildEmission()] }],
    });
    runSpecificsNeedAggregationWithTelemetry(profile, 1, ESSAY_ID);
    runSpecificsNeedAggregationWithTelemetry(profile, 2, ESSAY_ID);
    runSpecificsNeedAggregationWithTelemetry(profile, 3, ESSAY_ID);
    expect(profile.questionQueue[0].iterationsSurvived).toBe(2);
  });
});
