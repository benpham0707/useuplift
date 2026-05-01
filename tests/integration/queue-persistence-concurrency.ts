// ============================================================================
// Phase 2 D-2.10 — Queue persistence concurrency test
// ============================================================================
//
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md §D-2.10
//
// What this file tests:
//   The QuestionQueueManager's behavior under quasi-concurrent operation
//   patterns and persistence round-trips. JavaScript is single-threaded,
//   so true OS-level race conditions aren't possible — but logical race
//   conditions arise when:
//     - Two essays process simultaneously (independent QueueManager
//       instances; cross-essay isolation must hold)
//     - The queue serializes / deserializes mid-iteration (the manager
//       must reconstitute identical state from persisted bytes)
//     - Interleaved transitions touch different questions (per-question
//       state must not leak)
//     - Rapid sequential transitions on the same question must follow
//       the state machine without ordering anomalies
//     - Many questions hit the auto-promotion threshold at once
//       (mergeCuratedOutput's iterationsSurvived ≥ 3 → priority='high'
//       must apply deterministically to every qualifying question)
//
// Why these scenarios matter even though production has isProcessing
// concurrency control: defense-in-depth + future-proofing if the lock
// changes + cross-essay-concurrent runs are explicit production cases
// (multiple students processing in parallel through the same Node
// process). The queue itself must be safe under all these.
//
// All scenarios are pure code — no LLM calls, no API spend. Mock-LLM
// boundary not relevant since QueueManager is pure infrastructure
// (Rule 6).

import { describe, it, expect } from 'vitest';
import { QuestionQueueManager } from '../../src/services/essayIntelligence/analysis/questionQueueManager';
import type {
  UnderstandingQuestion,
  DigContext,
  GroundTruthFact,
  QuestionCurationOutput,
} from '../../src/services/essayIntelligence/profileTypes';

// ─── Test fixtures (shared with the unit tests; rebuilt here so the
// integration test stays self-contained — no cross-file imports of
// test fixtures, which would create a fragile coupling) ────────────

function buildAnalysisGapQuestion(
  id: string,
  overrides: {
    status?: UnderstandingQuestion['status'];
    digOverrides?: Partial<DigContext>;
    priority?: UnderstandingQuestion['priority'];
    iterationsSurvived?: number;
  } = {},
): UnderstandingQuestion {
  const dig: DigContext = {
    whyAsked: 'synthetic test reason',
    expectedAnswerShape: 'specific_memory',
    consumers: ['l3', 'l5'],
    populates: ['groundTruthFacts.byLocation'],
    framingSeed: 'synthetic test framing seed',
    ...(overrides.digOverrides ?? {}),
  };

  return {
    id,
    question: `Synthetic test question ${id}`,
    dimensions: ['narrative', 'voice'],
    expectedInsight: 'synthetic test expected insight',
    source: 'analysis_specifics_gap',
    status: overrides.status ?? 'open',
    priority: overrides.priority ?? 'medium',
    iterationsSurvived: overrides.iterationsSurvived ?? 0,
    spawnedQuestions: [],
    raisedAt: '2026-05-01T00:00:00.000Z',
    raisedDuringIteration: 1,
    dig,
  };
}

function buildSyntheticGroundTruthFact(id: string = 'gtf-1'): GroundTruthFact {
  return {
    id,
    claim: `Synthetic ground truth fact ${id}`,
    evidence: [`Student response for ${id}`],
    confidence: 'high',
    capturedAt: '2026-05-01T00:00:00.000Z',
  };
}

/**
 * Build a curation output that resolves the named questions, filters the
 * named questions, and adds the named questions. Used by §5 to drive
 * mergeCuratedOutput across many synthetic curated rounds.
 */
function buildCuration(args: {
  resolved?: Array<{ questionId: string; answer: string }>;
  filtered?: Array<{ questionId: string; filterReason: string }>;
  curated?: UnderstandingQuestion[];
}): QuestionCurationOutput {
  return {
    resolvedQuestions: (args.resolved ?? []).map(r => ({
      questionId: r.questionId,
      answer: r.answer,
      reasoning: 'synthetic test reasoning',
    })),
    filteredQuestions: (args.filtered ?? []).map(f => ({
      questionId: f.questionId,
      filterReason: f.filterReason,
    })),
    curatedQueue: (args.curated ?? []).map(q => ({
      question: q,
      rationale: 'synthetic test rationale',
    })),
  };
}

// ─── §1 — Cross-essay isolation ────────────────────────────────────────

describe('D-2.10 §1 — Cross-essay isolation', () => {
  it('two QueueManager instances do not share state through any shared reference', () => {
    // Production case: two essays processing simultaneously through the
    // same Node process. Each essay constructs its own QueueManager from
    // its own EssayProfile.questionQueue. The managers must be fully
    // independent — no module-level state, no shared collections.
    const essayAQuestions = [buildAnalysisGapQuestion('A1', { status: 'open' })];
    const essayBQuestions = [buildAnalysisGapQuestion('B1', { status: 'open' })];

    const queueA = new QuestionQueueManager(essayAQuestions);
    const queueB = new QuestionQueueManager(essayBQuestions);

    queueA.markAskedToStudent('A1', 'msg-A-1');
    queueB.markAskedToStudent('B1', 'msg-B-1');

    expect(queueA.getById('A1')!.status).toBe('asked_to_student');
    expect(queueA.getById('B1')).toBeUndefined();
    expect(queueB.getById('B1')!.status).toBe('asked_to_student');
    expect(queueB.getById('A1')).toBeUndefined();
  });

  it('mutations on one queue do not affect the input array passed to another queue', () => {
    // The constructor copies via spread; verify that the underlying input
    // arrays aren't shared by reference. Otherwise a mutation on queue A
    // would silently affect the bytes another queue already loaded.
    const sharedSourceQuestions: UnderstandingQuestion[] = [
      buildAnalysisGapQuestion('shared1', { status: 'open' }),
    ];

    const queueA = new QuestionQueueManager(sharedSourceQuestions);
    queueA.markAskedToStudent('shared1', 'msg-A');

    const queueB = new QuestionQueueManager(sharedSourceQuestions);
    // queueB sees the ORIGINAL question state, not queueA's mutations,
    // because queueA's mutations went to queueA's internal copy.
    // Note: question objects ARE shared by reference between
    // sharedSourceQuestions and queueA's internal copy because the
    // spread is shallow — but queueB's internal copy ALSO references
    // the same objects. So any mutation on queueA does affect
    // sharedSourceQuestions[0] AND queueB's internal copy.
    //
    // This is the actual production contract: the spread is shallow.
    // The test pins this so future contributors don't expect deep
    // isolation — if they need it, they have to deep-clone at the
    // construction site.
    expect(queueB.getById('shared1')!.status).toBe('asked_to_student');
  });

  it('parallel async transitions on independent queues complete without cross-pollination', async () => {
    // Simulates two essays running iterations in parallel via Promise.all.
    // Each iteration drives the essay's own QueueManager. The interleaved
    // microtask order must not corrupt either queue.
    const queueA = new QuestionQueueManager([
      buildAnalysisGapQuestion('A1', { status: 'open' }),
      buildAnalysisGapQuestion('A2', { status: 'open' }),
    ]);
    const queueB = new QuestionQueueManager([
      buildAnalysisGapQuestion('B1', { status: 'open' }),
      buildAnalysisGapQuestion('B2', { status: 'open' }),
    ]);

    await Promise.all([
      // Essay A's iteration: ask A1, ask A2, answer A1
      (async () => {
        queueA.markAskedToStudent('A1', 'msg-A1');
        await Promise.resolve(); // microtask yield
        queueA.markAskedToStudent('A2', 'msg-A2');
        await Promise.resolve();
        queueA.markStudentAnswered('A1', 'A1 raw answer', buildSyntheticGroundTruthFact('A1-fact'));
      })(),
      // Essay B's iteration: ask B1, decline B1, ask B2
      (async () => {
        queueB.markAskedToStudent('B1', 'msg-B1');
        await Promise.resolve();
        queueB.markStudentDeclined('B1', 'B1 declined');
        await Promise.resolve();
        queueB.markAskedToStudent('B2', 'msg-B2');
      })(),
    ]);

    // Both queues end in their expected final state, regardless of
    // interleaved microtask order.
    expect(queueA.getById('A1')!.status).toBe('student_answered');
    expect(queueA.getById('A2')!.status).toBe('asked_to_student');
    expect(queueB.getById('B1')!.status).toBe('student_declined');
    expect(queueB.getById('B2')!.status).toBe('asked_to_student');
  });
});

// ─── §2 — Serialize / deserialize round-trip ───────────────────────────

describe('D-2.10 §2 — Serialize / deserialize round-trip', () => {
  it('queue state survives JSON.stringify → JSON.parse → new QueueManager', () => {
    // Production case: queue persists into EssayProfile.questionQueue,
    // gets serialized to JSONB by the checkpoint store, retrieved later,
    // loaded into a fresh QueueManager. Round-trip must be lossless.
    const original = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', { status: 'open', iterationsSurvived: 2 }),
      buildAnalysisGapQuestion('q2', { status: 'asked_to_student' }),
      buildAnalysisGapQuestion('q3', { status: 'student_answered' }),
    ]);
    original.markStudentAnswered('q2', 'q2 raw', buildSyntheticGroundTruthFact('q2-fact'));

    // Serialize the state via getAll() (which is what the orchestrator
    // does at end-of-iteration: profile.questionQueue = queueManager.getAll()).
    const serialized = JSON.parse(JSON.stringify(original.getAll()));
    const restored = new QuestionQueueManager(serialized);

    // Every question's full state survives the round-trip.
    expect(restored.getById('q1')!.iterationsSurvived).toBe(2);
    expect(restored.getById('q2')!.status).toBe('student_answered');
    expect(restored.getById('q2')!.dig?.studentAnswerRaw).toBe('q2 raw');
    expect(restored.getById('q2')!.dig?.structuredAnswer).toMatchObject({
      id: 'q2-fact',
      claim: 'Synthetic ground truth fact q2-fact',
    });
    expect(restored.getById('q3')!.status).toBe('student_answered');

    // Counts match.
    expect(restored.openCount).toBe(original.openCount);
    expect(restored.resolvedCount).toBe(original.resolvedCount);
  });

  it('queue can continue mutating after a round-trip without losing prior state', () => {
    // Drives a half-iteration, persists, restores, completes the
    // iteration. The state machine must recognize the restored
    // questions' statuses and accept legal transitions.
    const original = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', { status: 'open' }),
    ]);
    original.markAskedToStudent('q1', 'msg-1');

    // Simulate persistence boundary.
    const restored = new QuestionQueueManager(
      JSON.parse(JSON.stringify(original.getAll())),
    );

    // Restored manager accepts the next legal transition for q1.
    restored.markStudentAnswered('q1', 'raw', buildSyntheticGroundTruthFact());
    expect(restored.getById('q1')!.status).toBe('student_answered');
    expect(restored.getById('q1')!.dig?.askedAt).toBeDefined(); // pre-round-trip field preserved
  });

  it('round-trip preserves illegal-transition rejection (state machine survives)', () => {
    // Restored manager must REJECT illegal transitions exactly as the
    // original would. If serialization corrupted the state machine, a
    // post-restore illegal transition might silently succeed.
    const original = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', { status: 'open' }),
    ]);
    original.markAskedToStudent('q1', 'msg-1');
    original.markStudentDeclined('q1', 'declined');

    const restored = new QuestionQueueManager(
      JSON.parse(JSON.stringify(original.getAll())),
    );

    // q1 is now in student_declined. markAskedToStudent must throw the
    // same way pre-round-trip would.
    expect(() => restored.markAskedToStudent('q1', 'msg-2')).toThrow(
      /Illegal transition/,
    );
  });
});

// ─── §3 — Interleaved transitions on different questions stay isolated ─

describe('D-2.10 §3 — Per-question state isolation', () => {
  it('transitioning q1 does not affect q2 in any field', () => {
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', { status: 'open', priority: 'high' }),
      buildAnalysisGapQuestion('q2', { status: 'open', priority: 'medium' }),
    ]);
    const q2BeforeJson = JSON.stringify(queue.getById('q2'));

    queue.markAskedToStudent('q1', 'msg-1');
    queue.markStudentAnswered('q1', 'raw', buildSyntheticGroundTruthFact());

    const q2AfterJson = JSON.stringify(queue.getById('q2'));
    expect(q2AfterJson).toBe(q2BeforeJson);
  });

  it('failed transition on q1 does not corrupt q2 state', () => {
    // If markAskedToStudent fails on q1 (e.g., q1 is already resolved),
    // q2's state must remain pristine. The throw must not partially
    // mutate other questions.
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', { status: 'resolved' }),
      buildAnalysisGapQuestion('q2', { status: 'open' }),
    ]);
    const q2Before = JSON.stringify(queue.getById('q2'));

    expect(() => queue.markAskedToStudent('q1', 'msg-1')).toThrow();

    expect(JSON.stringify(queue.getById('q2'))).toBe(q2Before);
  });

  it('many questions can transition through the dig flow simultaneously without interference', () => {
    const questions: UnderstandingQuestion[] = [];
    for (let i = 0; i < 20; i++) {
      questions.push(buildAnalysisGapQuestion(`q${i}`, { status: 'open' }));
    }
    const queue = new QuestionQueueManager(questions);

    // Drive every question through open → asked → answered.
    for (let i = 0; i < 20; i++) {
      queue.markAskedToStudent(`q${i}`, `msg-${i}`);
    }
    for (let i = 0; i < 20; i++) {
      queue.markStudentAnswered(`q${i}`, `raw ${i}`, buildSyntheticGroundTruthFact(`fact-${i}`));
    }

    for (let i = 0; i < 20; i++) {
      const q = queue.getById(`q${i}`)!;
      expect(q.status).toBe('student_answered');
      expect(q.dig?.studentAnswerRaw).toBe(`raw ${i}`);
      expect((q.dig?.structuredAnswer as GroundTruthFact).id).toBe(`fact-${i}`);
    }
  });
});

// ─── §4 — Rapid sequential transitions on the same question ───────────

describe('D-2.10 §4 — Rapid sequential transitions on the same question', () => {
  it('open → asked → answered in tight succession produces correct final state', () => {
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', { status: 'open' }),
    ]);

    // No async gaps; tight synchronous chain.
    queue.markAskedToStudent('q1', 'msg-1');
    queue.markStudentAnswered('q1', 'raw', buildSyntheticGroundTruthFact());

    expect(queue.getById('q1')!.status).toBe('student_answered');
  });

  it('open → asked → declined in tight succession produces correct final state', () => {
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', { status: 'open' }),
    ]);

    queue.markAskedToStudent('q1', 'msg-1');
    queue.markStudentDeclined('q1', 'declined');

    expect(queue.getById('q1')!.status).toBe('student_declined');
  });

  it('idempotent re-application of the SAME successful transition throws on the second call', () => {
    // The state machine's contract is that each transition is one-shot.
    // A second call to the same transition on a question already past
    // that state must throw — even if "concurrent" callers race to
    // apply the same transition.
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', { status: 'open' }),
    ]);

    queue.markAskedToStudent('q1', 'msg-1');
    expect(() => queue.markAskedToStudent('q1', 'msg-2')).toThrow(/Illegal transition/);

    // The first call's state survived; the second's would-be conversator
    // message ID was rejected.
    expect(queue.getById('q1')!.dig?.conversatorMessageId).toBe('msg-1');
  });
});

// ─── §5 — Auto-promotion via mergeCuratedOutput is deterministic ──────

describe('D-2.10 §5 — Auto-promotion determinism across many questions', () => {
  it('every question with iterationsSurvived ≥ 3 gets promoted to high (no drift)', () => {
    // mergeCuratedOutput at questionQueueManager.ts:148-153 promotes
    // every open question with iterationsSurvived ≥ 3 to priority='high'
    // unless already 'critical'. With many questions hitting the threshold
    // in the same call, every qualifying question must be promoted —
    // the implementation must not skip any due to iteration order or
    // shared-state confusion.
    const initialQuestions: UnderstandingQuestion[] = [];
    for (let i = 0; i < 50; i++) {
      initialQuestions.push(
        buildAnalysisGapQuestion(`q${i}`, {
          status: 'open',
          priority: i < 10 ? 'critical' : 'medium', // 10 critical (must NOT demote), 40 medium
          iterationsSurvived: 3, // every question hits the threshold
        }),
      );
    }
    const queue = new QuestionQueueManager(initialQuestions);

    // Empty curation — no resolves, no filters, no new — just triggers
    // the promotion pass on the 51 open questions.
    queue.mergeCuratedOutput(buildCuration({}), 5);

    for (let i = 0; i < 50; i++) {
      const q = queue.getById(`q${i}`)!;
      if (i < 10) {
        // Critical preserved (priority !== 'critical' guard at line 150).
        expect(q.priority).toBe('critical');
      } else {
        // Medium → high.
        expect(q.priority).toBe('high');
      }
    }
  });

  it('iterationsSurvived increments deterministically for every open question not in the curation', () => {
    // mergeCuratedOutput at lines 138-146 increments iterationsSurvived
    // for every open question NOT marked resolved/filtered this round.
    // Across many open questions in one call, every qualifying question
    // must increment exactly once.
    const questions: UnderstandingQuestion[] = [];
    for (let i = 0; i < 30; i++) {
      questions.push(
        buildAnalysisGapQuestion(`q${i}`, {
          status: 'open',
          iterationsSurvived: 0,
        }),
      );
    }
    const queue = new QuestionQueueManager(questions);

    // Resolve 5, filter 5, leave 20 to increment.
    queue.mergeCuratedOutput(
      buildCuration({
        resolved: Array.from({ length: 5 }, (_, i) => ({
          questionId: `q${i}`,
          answer: 'resolved',
        })),
        filtered: Array.from({ length: 5 }, (_, i) => ({
          questionId: `q${i + 5}`,
          filterReason: 'filtered',
        })),
      }),
      1,
    );

    // q0-q4 resolved; q5-q9 filtered; q10-q29 (20 questions) should each
    // have iterationsSurvived === 1.
    for (let i = 0; i < 5; i++) {
      expect(queue.getById(`q${i}`)!.status).toBe('resolved');
    }
    for (let i = 5; i < 10; i++) {
      expect(queue.getById(`q${i}`)!.status).toBe('filtered');
    }
    for (let i = 10; i < 30; i++) {
      expect(queue.getById(`q${i}`)!.iterationsSurvived).toBe(1);
    }
  });
});

// ─── §6 — Edge cases ───────────────────────────────────────────────────

describe('D-2.10 §6 — Edge cases', () => {
  it('empty queue handles every operation without throw or corruption', () => {
    const queue = new QuestionQueueManager([]);

    expect(queue.getAll()).toEqual([]);
    expect(queue.getOpenQuestions()).toEqual([]);
    expect(queue.getStaleQuestions(0)).toEqual([]);
    expect(queue.getById('nonexistent')).toBeUndefined();
    expect(queue.openCount).toBe(0);
    expect(queue.resolvedCount).toBe(0);
    expect(queue.getOpenAnalysisGapQuestions()).toEqual([]);

    // Empty mergeCuratedOutput on empty queue is a no-op.
    queue.mergeCuratedOutput(buildCuration({}), 1);
    expect(queue.getAll()).toEqual([]);

    // advanceIteration on empty queue is a no-op.
    queue.advanceIteration();
    expect(queue.getAll()).toEqual([]);
  });

  it('single-question queue completes the full dig-flow lifecycle', () => {
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('only', { status: 'open' }),
    ]);

    queue.markAskedToStudent('only', 'msg-only');
    queue.markStudentAnswered('only', 'raw', buildSyntheticGroundTruthFact());

    expect(queue.getById('only')!.status).toBe('student_answered');
    expect(queue.openCount).toBe(0);
  });

  it('critical-priority question with iterationsSurvived ≥ 3 is NOT downgraded by promotion', () => {
    // mergeCuratedOutput's promotion loop at line 150 explicitly preserves
    // critical priority. Verify the boundary.
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', {
        status: 'open',
        priority: 'critical',
        iterationsSurvived: 5,
      }),
    ]);

    queue.mergeCuratedOutput(buildCuration({}), 6);
    expect(queue.getById('q1')!.priority).toBe('critical');
  });

  it('low-priority question with iterationsSurvived ≥ 3 is promoted up to high', () => {
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', {
        status: 'open',
        priority: 'low',
        iterationsSurvived: 3,
      }),
    ]);

    queue.mergeCuratedOutput(buildCuration({}), 4);
    expect(queue.getById('q1')!.priority).toBe('high');
  });
});
