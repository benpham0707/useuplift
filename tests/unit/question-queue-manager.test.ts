// ============================================================================
// Phase 2 D-2.1 — QuestionQueueManager dig-flow state-transition tests
// ============================================================================
//
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md §D-2.1
//
// What this file tests:
//   The new dig-flow state-transition methods + accessor added to
//   QuestionQueueManager:
//     - markAskedToStudent(id, conversatorMessageId)
//     - markStudentAnswered(id, rawAnswer, structuredAnswer)
//     - markStudentDeclined(id, reason)
//     - getOpenAnalysisGapQuestions()
//
//   D-2.1's contract: every legal transition succeeds; every illegal
//   transition throws with structured error context. Pre-existing queue
//   behavior preserved (mergeCuratedOutput, resolve, spawnChild,
//   addQuestion, advanceIteration, openCount, resolvedCount —
//   touched by D-2.1 only via the new methods, not refactored).
//
// Test surfaces:
//   §1 — Legal transitions per method (one test per method)
//   §2 — Illegal transitions per method (every illegal source-state +
//        wrong-source + missing-dig case)
//   §3 — getOpenAnalysisGapQuestions accessor (filters correctly,
//        preserves priority ordering from getOpenQuestions())
//   §4 — Pre-existing queue behavior preserved (smoke that the new
//        methods don't break the existing API)

import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionQueueManager } from '../../src/services/essayIntelligence/analysis/questionQueueManager';
import type {
  UnderstandingQuestion,
  DigContext,
  GroundTruthFact,
} from '../../src/services/essayIntelligence/profileTypes';

// ─── Test fixtures ─────────────────────────────────────────────────────

/**
 * Build a synthetic UnderstandingQuestion of source='analysis_specifics_gap'
 * with a fully-populated DigContext. Optional overrides for the dig fields
 * the tests need to vary. The required dig fields (whyAsked,
 * expectedAnswerShape, consumers, populates, framingSeed) are populated
 * with realistic-but-synthetic values — these would be set by the
 * analysis layer that emits the question (D-2.2 / D-2.3 / D-2.4 / D-2.5
 * / D-2.6) at production time.
 */
function buildAnalysisGapQuestion(
  id: string,
  overrides: {
    status?: UnderstandingQuestion['status'];
    digOverrides?: Partial<DigContext>;
    digMissing?: boolean;
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
    ...(overrides.digMissing ? {} : { dig }),
  };
}

/**
 * Build a non-dig question (source !== 'analysis_specifics_gap') for
 * testing the source-guard on markAskedToStudent.
 */
function buildNonDigQuestion(
  id: string,
  status: UnderstandingQuestion['status'] = 'open',
): UnderstandingQuestion {
  return {
    id,
    question: `Synthetic non-dig question ${id}`,
    dimensions: ['narrative'],
    expectedInsight: 'synthetic non-dig expected insight',
    source: 'walk',
    status,
    priority: 'medium',
    iterationsSurvived: 0,
    spawnedQuestions: [],
    raisedAt: '2026-05-01T00:00:00.000Z',
    raisedDuringIteration: 1,
  };
}

/** A representative GroundTruthFact for `markStudentAnswered` tests. */
function buildSyntheticGroundTruthFact(): GroundTruthFact {
  return {
    id: 'gtf-test-1',
    claim: 'Synthetic ground truth fact',
    evidence: ['Student response 1', 'Student response 2'],
    confidence: 'high',
    capturedAt: '2026-05-01T00:00:00.000Z',
  };
}

// ─── §1 — Legal transitions ────────────────────────────────────────────

describe('D-2.1 §1 — Legal transitions', () => {
  it('markAskedToStudent: open → asked_to_student (sets askedAt + conversatorMessageId)', () => {
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', { status: 'open' }),
    ]);

    queue.markAskedToStudent('q1', 'msg-abc-123');

    const q = queue.getById('q1')!;
    expect(q.status).toBe('asked_to_student');
    expect(q.dig?.askedAt).toBeDefined();
    // ISO timestamp: parses as a valid date.
    expect(Number.isFinite(Date.parse(q.dig!.askedAt!))).toBe(true);
    expect(q.dig?.conversatorMessageId).toBe('msg-abc-123');
  });

  it('markStudentAnswered: asked_to_student → student_answered (sets rawAnswer + structuredAnswer)', () => {
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', { status: 'asked_to_student' }),
    ]);
    const fact = buildSyntheticGroundTruthFact();

    queue.markStudentAnswered('q1', 'I picked the moment with the steel hook', fact);

    const q = queue.getById('q1')!;
    expect(q.status).toBe('student_answered');
    expect(q.dig?.studentAnswerRaw).toBe('I picked the moment with the steel hook');
    expect(q.dig?.structuredAnswer).toEqual(fact);
  });

  it('markStudentDeclined: asked_to_student → student_declined (sets resolution + resolvedAt)', () => {
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', { status: 'asked_to_student' }),
    ]);

    queue.markStudentDeclined('q1', 'student replied "not sure"');

    const q = queue.getById('q1')!;
    expect(q.status).toBe('student_declined');
    expect(q.resolution).toBe('student replied "not sure"');
    expect(q.resolvedAt).toBeDefined();
    expect(Number.isFinite(Date.parse(q.resolvedAt!))).toBe(true);
  });

  it('full happy-path: open → asked_to_student → student_answered', () => {
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', { status: 'open' }),
    ]);

    queue.markAskedToStudent('q1', 'msg-1');
    expect(queue.getById('q1')!.status).toBe('asked_to_student');

    queue.markStudentAnswered('q1', 'raw text', buildSyntheticGroundTruthFact());
    expect(queue.getById('q1')!.status).toBe('student_answered');
  });

  it('full decline-path: open → asked_to_student → student_declined', () => {
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', { status: 'open' }),
    ]);

    queue.markAskedToStudent('q1', 'msg-1');
    queue.markStudentDeclined('q1', 'I don\'t want to answer');
    expect(queue.getById('q1')!.status).toBe('student_declined');
  });
});

// ─── §2 — Illegal transitions throw with structured context ────────────

describe('D-2.1 §2 — Illegal transitions throw', () => {
  describe('markAskedToStudent illegal sources', () => {
    it('throws when question is in status=resolved', () => {
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'resolved' }),
      ]);
      expect(() => queue.markAskedToStudent('q1', 'msg-1')).toThrow(
        /Illegal transition.*markAskedToStudent.*open.*asked_to_student/,
      );
    });

    it('throws when question is in status=filtered', () => {
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'filtered' }),
      ]);
      expect(() => queue.markAskedToStudent('q1', 'msg-1')).toThrow(
        /Illegal transition.*markAskedToStudent/,
      );
    });

    it('throws when question is in status=asked_to_student (re-ask attempt)', () => {
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'asked_to_student' }),
      ]);
      expect(() => queue.markAskedToStudent('q1', 'msg-1')).toThrow(
        /Illegal transition.*markAskedToStudent/,
      );
    });

    it('throws when question is in status=student_answered', () => {
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'student_answered' }),
      ]);
      expect(() => queue.markAskedToStudent('q1', 'msg-1')).toThrow(
        /Illegal transition.*markAskedToStudent/,
      );
    });

    it('throws when question is in status=student_declined (re-ask after decline NOT permitted)', () => {
      // The re-ask differently path is explicitly NOT permitted by D-2.1.
      // If Phase 3 wants this path, it adds a dedicated reAskAfterDecline()
      // method rather than relaxing markAskedToStudent's validation.
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'student_declined' }),
      ]);
      expect(() => queue.markAskedToStudent('q1', 'msg-1')).toThrow(
        /Illegal transition.*markAskedToStudent/,
      );
    });

    it('throws when question source is not analysis_specifics_gap (only those carry DigContext)', () => {
      const queue = new QuestionQueueManager([
        buildNonDigQuestion('q1', 'open'),
      ]);
      expect(() => queue.markAskedToStudent('q1', 'msg-1')).toThrow(
        /Illegal transition.*markAskedToStudent/,
      );
    });

    it('error context surfaces actual non-dig source on wrong-source case', () => {
      // Round-1 audit MED closure 2026-05-01 (Agent 1 F6): the wrong-source
      // throw must include actualSource in the structured error context so
      // operators can distinguish "queue out of sync" (status mismatch) from
      // "wrong method on this source" (source mismatch).
      const queue = new QuestionQueueManager([
        buildNonDigQuestion('q1', 'open'),
      ]);
      let caught: Error | undefined;
      try {
        queue.markAskedToStudent('q1', 'msg-1');
      } catch (e) {
        caught = e as Error;
      }
      expect(caught).toBeDefined();
      expect(caught!.message).toContain('"actualSource":"walk"');
      expect(caught!.message).toContain('"actualStatus":"open"');
    });

    it('throws when question does not exist', () => {
      const queue = new QuestionQueueManager([]);
      expect(() => queue.markAskedToStudent('nonexistent', 'msg-1')).toThrow(
        /Illegal transition.*markAskedToStudent.*nonexistent/,
      );
    });

    it('throws when source=analysis_specifics_gap but DigContext is missing', () => {
      // Invariant violation: the emitting layer was supposed to populate
      // dig before the question reached the queue. Fail-fast rather than
      // silently fabricating the dig structure.
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'open', digMissing: true }),
      ]);
      expect(() => queue.markAskedToStudent('q1', 'msg-1')).toThrow(
        /no DigContext on the .dig field/,
      );
    });

    it('error context includes questionId, method, expected/actual statuses, source', () => {
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'resolved' }),
      ]);
      let caught: Error | undefined;
      try {
        queue.markAskedToStudent('q1', 'msg-1');
      } catch (e) {
        caught = e as Error;
      }
      expect(caught).toBeDefined();
      expect(caught!.message).toContain('"questionId":"q1"');
      expect(caught!.message).toContain('"method":"markAskedToStudent"');
      expect(caught!.message).toContain('"expectedFromStatus":"open"');
      expect(caught!.message).toContain('"expectedToStatus":"asked_to_student"');
      expect(caught!.message).toContain('"actualStatus":"resolved"');
      expect(caught!.message).toContain('"actualSource":"analysis_specifics_gap"');
    });
  });

  describe('markStudentAnswered illegal sources', () => {
    it('throws when question is in status=open', () => {
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'open' }),
      ]);
      expect(() =>
        queue.markStudentAnswered('q1', 'raw', buildSyntheticGroundTruthFact()),
      ).toThrow(/Illegal transition.*markStudentAnswered.*asked_to_student.*student_answered/);
    });

    it('throws when question is in status=resolved', () => {
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'resolved' }),
      ]);
      expect(() =>
        queue.markStudentAnswered('q1', 'raw', buildSyntheticGroundTruthFact()),
      ).toThrow(/Illegal transition.*markStudentAnswered/);
    });

    it('throws when question is in status=student_declined', () => {
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'student_declined' }),
      ]);
      expect(() =>
        queue.markStudentAnswered('q1', 'raw', buildSyntheticGroundTruthFact()),
      ).toThrow(/Illegal transition.*markStudentAnswered/);
    });

    it('throws when question is already in status=student_answered (idempotency violation)', () => {
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'student_answered' }),
      ]);
      expect(() =>
        queue.markStudentAnswered('q1', 'raw', buildSyntheticGroundTruthFact()),
      ).toThrow(/Illegal transition.*markStudentAnswered/);
    });

    it('throws when question does not exist', () => {
      const queue = new QuestionQueueManager([]);
      expect(() =>
        queue.markStudentAnswered('nonexistent', 'raw', buildSyntheticGroundTruthFact()),
      ).toThrow(/Illegal transition.*markStudentAnswered/);
    });

    it('throws when status=asked_to_student but DigContext is missing (invariant violation)', () => {
      // Round-1 audit LOW closure 2026-05-01 (Agent 2 F5): the dig-missing
      // path is reachable here only via direct mutation or persistence
      // corruption. The markAskedToStudent invariant check should have
      // caught this earlier; if execution reaches this point, the queue is
      // in an invariant-violating state and we fail-fast.
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'asked_to_student', digMissing: true }),
      ]);
      expect(() =>
        queue.markStudentAnswered('q1', 'raw', buildSyntheticGroundTruthFact()),
      ).toThrow(/no DigContext/);
    });
  });

  describe('markStudentDeclined illegal sources', () => {
    it('throws when question is in status=open', () => {
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'open' }),
      ]);
      expect(() => queue.markStudentDeclined('q1', 'reason')).toThrow(
        /Illegal transition.*markStudentDeclined.*asked_to_student.*student_declined/,
      );
    });

    it('throws when question is in status=resolved', () => {
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'resolved' }),
      ]);
      expect(() => queue.markStudentDeclined('q1', 'reason')).toThrow(
        /Illegal transition.*markStudentDeclined/,
      );
    });

    it('throws when question is in status=student_answered', () => {
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'student_answered' }),
      ]);
      expect(() => queue.markStudentDeclined('q1', 'reason')).toThrow(
        /Illegal transition.*markStudentDeclined/,
      );
    });

    it('throws when question is already in status=student_declined (idempotency violation)', () => {
      const queue = new QuestionQueueManager([
        buildAnalysisGapQuestion('q1', { status: 'student_declined' }),
      ]);
      expect(() => queue.markStudentDeclined('q1', 'reason')).toThrow(
        /Illegal transition.*markStudentDeclined/,
      );
    });
  });
});

// ─── §3 — getOpenAnalysisGapQuestions accessor ─────────────────────────

describe('D-2.1 §3 — getOpenAnalysisGapQuestions accessor', () => {
  it('returns only open questions with source=analysis_specifics_gap', () => {
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('q1', { status: 'open' }),
      buildAnalysisGapQuestion('q2', { status: 'asked_to_student' }), // not open
      buildAnalysisGapQuestion('q3', { status: 'open' }),
      buildNonDigQuestion('q4', 'open'), // not analysis_specifics_gap
      buildAnalysisGapQuestion('q5', { status: 'resolved' }), // not open
    ]);

    const result = queue.getOpenAnalysisGapQuestions();
    const ids = result.map(q => q.id).sort();
    expect(ids).toEqual(['q1', 'q3']);
  });

  it('preserves the priority+iterationsSurvived ordering from getOpenQuestions()', () => {
    const queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('q-low-fresh', {
        status: 'open',
        priority: 'low',
        iterationsSurvived: 0,
      }),
      buildAnalysisGapQuestion('q-critical', {
        status: 'open',
        priority: 'critical',
        iterationsSurvived: 0,
      }),
      buildAnalysisGapQuestion('q-medium-stale', {
        status: 'open',
        priority: 'medium',
        iterationsSurvived: 5,
      }),
      buildAnalysisGapQuestion('q-medium-fresh', {
        status: 'open',
        priority: 'medium',
        iterationsSurvived: 0,
      }),
    ]);

    const result = queue.getOpenAnalysisGapQuestions();
    // Expected: critical first; then medium-stale (iterations=5) before
    // medium-fresh; then low last.
    expect(result.map(q => q.id)).toEqual([
      'q-critical',
      'q-medium-stale',
      'q-medium-fresh',
      'q-low-fresh',
    ]);
  });

  it('returns empty array when no analysis_specifics_gap questions are open', () => {
    const queue = new QuestionQueueManager([
      buildNonDigQuestion('q1', 'open'),
      buildNonDigQuestion('q2', 'open'),
    ]);
    expect(queue.getOpenAnalysisGapQuestions()).toEqual([]);
  });

  it('returns empty array on empty queue', () => {
    const queue = new QuestionQueueManager([]);
    expect(queue.getOpenAnalysisGapQuestions()).toEqual([]);
  });
});

// ─── §4 — Pre-existing queue behavior preserved ────────────────────────

describe('D-2.1 §4 — Pre-existing queue behavior preserved', () => {
  let queue: QuestionQueueManager;

  beforeEach(() => {
    queue = new QuestionQueueManager([
      buildAnalysisGapQuestion('gap1', { status: 'open' }),
      buildNonDigQuestion('walk1', 'open'),
    ]);
  });

  it('getAll still returns all questions', () => {
    expect(queue.getAll()).toHaveLength(2);
  });

  it('getOpenQuestions still returns all open questions regardless of source', () => {
    const open = queue.getOpenQuestions();
    expect(open.map(q => q.id).sort()).toEqual(['gap1', 'walk1']);
  });

  it('addQuestion still works (does not throw on dig-flow questions)', () => {
    queue.addQuestion(buildAnalysisGapQuestion('gap2', { status: 'open' }));
    expect(queue.getById('gap2')).toBeDefined();
  });

  it('resolve still works on questions in status=open (no D-2.1 interference)', () => {
    queue.resolve('walk1', 'test', 'synthetic resolution');
    expect(queue.getById('walk1')!.status).toBe('resolved');
  });

  it('resolve still silently no-ops on questions NOT in status=open (matches pre-D-2.1 behavior)', () => {
    // The new dig-flow methods throw on illegal transitions per the spec;
    // the existing methods continue to silently no-op per their existing
    // contract. Both patterns coexist in this class. D-2.1 does NOT
    // refactor the existing methods.
    queue.resolve('walk1', 'test', 'first resolution');
    expect(queue.getById('walk1')!.status).toBe('resolved');
    queue.resolve('walk1', 'test', 'second attempt'); // already resolved
    expect(queue.getById('walk1')!.status).toBe('resolved'); // unchanged, no throw
    expect(queue.getById('walk1')!.resolution).toBe('first resolution'); // unchanged
  });

  it('advanceIteration still increments iterationsSurvived for open questions', () => {
    queue.advanceIteration();
    expect(queue.getById('gap1')!.iterationsSurvived).toBe(1);
    expect(queue.getById('walk1')!.iterationsSurvived).toBe(1);
  });

  it('openCount and resolvedCount still report correctly with dig-flow statuses present', () => {
    expect(queue.openCount).toBe(2);
    expect(queue.resolvedCount).toBe(0);

    queue.markAskedToStudent('gap1', 'msg-1');
    // asked_to_student is NOT open and NOT resolved, so both counts go to 1/0.
    expect(queue.openCount).toBe(1); // walk1 still open
    expect(queue.resolvedCount).toBe(0);

    queue.markStudentAnswered('gap1', 'raw', buildSyntheticGroundTruthFact());
    // student_answered is also NOT open and NOT resolved.
    expect(queue.openCount).toBe(1);
    expect(queue.resolvedCount).toBe(0);

    queue.resolve('walk1', 'test', 'resolution');
    expect(queue.openCount).toBe(0);
    expect(queue.resolvedCount).toBe(1);
  });
});
