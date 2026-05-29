/**
 * QuestionQueueManager — Persistent Question Queue (Gap 2)
 *
 * Manages the persistent question queue across growth cycle iterations.
 * Questions ACCUMULATE with tracked status, priority evolution, and
 * parent→child relationships. Questions are never deleted — they get
 * status transitions (open → resolved | filtered).
 *
 * Pure infrastructure (Rule 6) — no LLM calls, no analytical judgment.
 * The LLM (via L3.75 curation) owns priority assignment and resolution.
 * This manager tracks state and provides query methods.
 */

import type {
  UnderstandingQuestion,
  QuestionCurationOutput,
  DigContext,
} from '../profileTypes';

// ============================================================================
// QUESTION QUEUE MANAGER
// ============================================================================

export class QuestionQueueManager {
  private questions: UnderstandingQuestion[];

  constructor(existingQuestions: UnderstandingQuestion[] = []) {
    this.questions = [...existingQuestions];
  }

  // ── QUERY METHODS ──────────────────────────────────────────────────────

  /** Get all questions (full history — never deleted) */
  getAll(): UnderstandingQuestion[] {
    return [...this.questions];
  }

  /** Get all open questions, sorted by priority then iterationsSurvived (desc) */
  getOpenQuestions(): UnderstandingQuestion[] {
    const priorityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return this.questions
      .filter(q => q.status === 'open')
      .sort((a, b) => {
        const priDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
        if (priDiff !== 0) return priDiff;
        // Higher iterationsSurvived = more important (keeps coming back)
        return b.iterationsSurvived - a.iterationsSurvived;
      });
  }

  /** Get questions that have survived N+ iterations without resolution */
  getStaleQuestions(minIterations: number): UnderstandingQuestion[] {
    return this.questions.filter(
      q => q.status === 'open' && q.iterationsSurvived >= minIterations,
    );
  }

  /** Get a question by ID */
  getById(questionId: string): UnderstandingQuestion | undefined {
    return this.questions.find(q => q.id === questionId);
  }

  // ── MUTATION METHODS ───────────────────────────────────────────────────

  /**
   * Merge curated questions from L3.75 with the persistent queue.
   *
   * - Resolved questions: mark as resolved with answer
   * - Filtered questions: mark as filtered (NOT deleted)
   * - New curated questions: add to queue, link as children if they evolved
   * - Existing open questions not in curation: increment iterationsSurvived
   */
  mergeCuratedOutput(curation: QuestionCurationOutput, iteration: number): void {
    const now = new Date().toISOString();

    // 1. Mark resolved questions
    for (const resolved of curation.resolvedQuestions) {
      const existing = this.questions.find(q => q.id === resolved.questionId);
      if (existing && existing.status === 'open') {
        existing.status = 'resolved';
        existing.resolution = resolved.answer;
        existing.resolvedBy = `synthesis_iter_${iteration}`;
        existing.resolvedAt = now;
      }
    }

    // 2. Mark filtered questions
    for (const filtered of curation.filteredQuestions) {
      const existing = this.questions.find(q => q.id === filtered.questionId);
      if (existing && existing.status === 'open') {
        existing.status = 'filtered';
        existing.resolution = filtered.filterReason;
      }
    }

    // 3. Track which question IDs are in the curated queue
    const curatedIds = new Set(
      curation.curatedQueue.map(cq => cq.question.id),
    );
    const resolvedIds = new Set(
      curation.resolvedQuestions.map(rq => rq.questionId),
    );
    const filteredIds = new Set(
      curation.filteredQuestions.map(fq => fq.questionId),
    );

    // 4. Add new curated questions that aren't already in the queue
    for (const curated of curation.curatedQueue) {
      const existing = this.questions.find(q => q.id === curated.question.id);
      if (!existing) {
        // New question — add with persistent fields
        this.questions.push({
          ...curated.question,
          priority: curated.question.priority ?? 'medium',
          iterationsSurvived: 0,
          spawnedQuestions: curated.question.spawnedQuestions ?? [],
          raisedAt: curated.question.raisedAt || now,
          raisedDuringIteration: curated.question.raisedDuringIteration ?? iteration,
        });
      } else if (existing.status === 'filtered') {
        // Un-filter: L3.75 brought it back
        existing.status = 'open';
        existing.resolution = undefined;
      }
      // If already open, L3.75 kept it — priority may have been re-assigned
      // via the curated question's fields. Respect that.
      if (existing && curated.question.priority) {
        existing.priority = curated.question.priority;
      }
    }

    // 5. Increment iterationsSurvived for all open questions not resolved/filtered this round
    for (const q of this.questions) {
      if (
        q.status === 'open' &&
        !resolvedIds.has(q.id) &&
        !filteredIds.has(q.id)
      ) {
        q.iterationsSurvived++;
      }
    }

    // 6. Auto-promote stale questions: survived 3+ iterations → at least 'high'
    for (const q of this.questions) {
      if (q.status === 'open' && q.iterationsSurvived >= 3 && q.priority !== 'critical') {
        q.priority = 'high';
      }
    }
  }

  /**
   * Mark a question as resolved.
   */
  resolve(questionId: string, resolvedBy: string, resolution: string): void {
    const q = this.questions.find(q => q.id === questionId);
    if (q && q.status === 'open') {
      q.status = 'resolved';
      q.resolution = resolution;
      q.resolvedBy = resolvedBy;
      q.resolvedAt = new Date().toISOString();
    }
  }

  /**
   * Spawn a child question from a parent.
   * Links parent → child bidirectionally.
   */
  spawnChild(
    parentId: string,
    childData: Omit<UnderstandingQuestion, 'parentQuestionId' | 'spawnedQuestions'>,
  ): UnderstandingQuestion {
    const parent = this.questions.find(q => q.id === parentId);

    const child: UnderstandingQuestion = {
      ...childData,
      parentQuestionId: parentId,
      spawnedQuestions: [],
    };

    if (parent) {
      parent.spawnedQuestions.push(child.id);
    }

    this.questions.push(child);
    return child;
  }

  /**
   * Add a question directly (e.g., from maturity gap analysis).
   * If a question with the same ID already exists, skip it.
   */
  addQuestion(question: UnderstandingQuestion): void {
    const existing = this.questions.find(q => q.id === question.id);
    if (!existing) {
      this.questions.push(question);
    }
  }

  /**
   * Increment iterationsSurvived for all open questions.
   * Called at the START of each growth iteration before L3.75 curation.
   */
  advanceIteration(): void {
    for (const q of this.questions) {
      if (q.status === 'open') {
        q.iterationsSurvived++;
      }
    }
  }

  /** Get count of open questions */
  get openCount(): number {
    return this.questions.filter(q => q.status === 'open').length;
  }

  /** Get count of resolved questions */
  get resolvedCount(): number {
    return this.questions.filter(q => q.status === 'resolved').length;
  }

  // ============================================================================
  // [D-2.1 closure 2026-05-01] DIG-FLOW STATE TRANSITIONS
  // ============================================================================
  // Phase 2 D-2.1 contract — `L5_IMPLEMENTATION_PLAN.md` §D-2.1.
  //
  // The new transition methods below handle the dig-flow lifecycle for
  // questions of `source: 'analysis_specifics_gap'` (questions whose
  // resolution requires student input rather than text re-investigation):
  //
  //   open → asked_to_student → student_answered
  //                          ↘ student_declined
  //
  // Legal transitions enforced by these methods:
  //   - markAskedToStudent:  open → asked_to_student
  //                          (only on source === 'analysis_specifics_gap';
  //                           only those questions carry DigContext)
  //   - markStudentAnswered: asked_to_student → student_answered
  //   - markStudentDeclined: asked_to_student → student_declined
  //
  // [round 1.6 retroactive audit MED-4 closure 2026-05-01] Comment trimmed
  // to one statement per concern, per §3 test 3. Ratified deviations
  // (spec signature widening on markStudentAnswered; deliberate non-
  // permission of student_declined → asked_to_student) live in the
  // commit body and L5_IMPLEMENTATION_PLAN.md §D-2.1 spec amendment;
  // future contributors should consult those for the full rationale.
  //
  // Two error shapes the new methods raise:
  //   (a) state-machine illegal transitions → buildIllegalTransitionError
  //       (uniform diagnostic shape for telemetry routing)
  //   (b) emission-time invariant violations (source='analysis_specifics_gap'
  //       arriving without DigContext on .dig) → throw directly with a
  //       producer-pointing message; the issue is upstream of the queue.
  // Don't consolidate these — divergent shapes preserve the diagnostic signal.
  //
  // Existing methods (resolve / mergeCuratedOutput / addQuestion / spawnChild
  // / advanceIteration) silently no-op on guard violations. The new methods
  // throw. Two patterns in one class is intentional; D-2.1 does not refactor
  // the existing methods.

  /**
   * Build the structured error context for an illegal-transition throw.
   * Centralized so every transition method produces identical error shape,
   * which makes the orchestrator's catch path (and any future telemetry
   * consumer) able to route on a stable error contract.
   */
  private buildIllegalTransitionError(
    questionId: string,
    method: 'markAskedToStudent' | 'markStudentAnswered' | 'markStudentDeclined',
    expectedFromStatus: UnderstandingQuestion['status'],
    expectedToStatus: UnderstandingQuestion['status'],
    actualQuestion: UnderstandingQuestion | undefined,
    extraContext?: Record<string, unknown>,
  ): Error {
    const ctx = {
      questionId,
      method,
      expectedFromStatus,
      expectedToStatus,
      actualStatus: actualQuestion?.status ?? '<question-not-found>',
      actualSource: actualQuestion?.source ?? '<question-not-found>',
      ...extraContext,
    };
    return new Error(
      `[QuestionQueueManager] Illegal transition: ${method} requires ` +
      `(status='${expectedFromStatus}'${
        method === 'markAskedToStudent' ? `, source='analysis_specifics_gap'` : ''
      }) → '${expectedToStatus}', but got ${JSON.stringify(ctx)}`,
    );
  }

  /**
   * Mark a question as asked to the student via the Conversator.
   *
   * Transition: `open` → `asked_to_student`.
   *
   * Only legal on questions whose `source === 'analysis_specifics_gap'`
   * (these are the only questions that carry DigContext, per
   * `profileTypes.ts:5736-5776`). Other sources reach resolution through
   * synthesis / curation paths, not through the dig flow.
   *
   * Mutates: `question.status` → `'asked_to_student'`;
   *          `question.dig.askedAt` → ISO now;
   *          `question.dig.conversatorMessageId` → param.
   *
   * Throws on illegal transition. Structured error context names the
   * questionId, attempted transition, current state, and method — so
   * the orchestrator's catch path can surface diagnostic info without
   * a second read of the queue.
   */
  markAskedToStudent(questionId: string, conversatorMessageId: string): void {
    const question = this.questions.find(q => q.id === questionId);
    if (
      !question ||
      question.status !== 'open' ||
      question.source !== 'analysis_specifics_gap'
    ) {
      throw this.buildIllegalTransitionError(
        questionId,
        'markAskedToStudent',
        'open',
        'asked_to_student',
        question,
      );
    }

    // Initialize dig sub-object if it doesn't already carry the optional
    // surfacing fields. The required dig fields (whyAsked, expectedAnswerShape,
    // consumers, populates, framingSeed) MUST already be populated by the
    // analysis layer that emitted the question; this method only adds the
    // surfacing-time fields. If `dig` is absent on a question that claims
    // source='analysis_specifics_gap', the question's emission path was
    // malformed — fail-fast rather than silently fabricate the structure.
    if (!question.dig) {
      throw new Error(
        `[QuestionQueueManager] markAskedToStudent: question ${questionId} ` +
        `has source='analysis_specifics_gap' but no DigContext on the .dig ` +
        `field. The emitting analysis layer must populate dig before the ` +
        `question reaches the queue.`,
      );
    }

    question.status = 'asked_to_student';
    question.dig.askedAt = new Date().toISOString();
    question.dig.conversatorMessageId = conversatorMessageId;
  }

  /**
   * Mark a question as answered by the student. Both raw and structured
   * answer are persisted — raw enables retry-without-re-asking on extraction
   * failure (handled separately in Phase 3); structured drives the
   * downstream layer consumers named in `dig.consumers`.
   *
   * Transition: `asked_to_student` → `student_answered`.
   *
   * Mutates: `question.status` → `'student_answered'`;
   *          `question.dig.studentAnswerRaw` → param;
   *          `question.dig.structuredAnswer` → param.
   */
  markStudentAnswered(
    questionId: string,
    rawAnswer: string,
    structuredAnswer: NonNullable<DigContext['structuredAnswer']>,
  ): void {
    const question = this.questions.find(q => q.id === questionId);
    if (!question || question.status !== 'asked_to_student') {
      throw this.buildIllegalTransitionError(
        questionId,
        'markStudentAnswered',
        'asked_to_student',
        'student_answered',
        question,
      );
    }

    if (!question.dig) {
      // [round 1.6 retroactive audit MED-5 closure 2026-05-01] Plain-
      // language error per §3 test 4: avoid the "invariant-violating"
      // jargon and name what the operator can act on.
      throw new Error(
        `[QuestionQueueManager] markStudentAnswered: question ${questionId} ` +
        `is in status='asked_to_student' but has no DigContext. The state ` +
        `machine should have rejected the markAskedToStudent call earlier; ` +
        `if execution reached this point, the queue is in an inconsistent ` +
        `state — likely from direct mutation or persistence corruption.`,
      );
    }

    question.status = 'student_answered';
    question.dig.studentAnswerRaw = rawAnswer;
    question.dig.structuredAnswer = structuredAnswer;
  }

  /**
   * Mark a question as declined by the student (e.g., "I don't know" /
   * "skip" / explicit refusal).
   *
   * Transition: `asked_to_student` → `student_declined`.
   *
   * Mutates: `question.status` → `'student_declined'`;
   *          `question.resolution` → reason (reusing the existing
   *            `resolution` field that `resolve()` and `mergeCuratedOutput`
   *            use for terminal-state metadata; consistent with the
   *            file's existing pattern);
   *          `question.resolvedAt` → ISO now (for audit-trail timing
   *            of the decline event).
   *
   * NOTE: this transition is terminal under D-2.1's API. The "re-ask
   * differently" path (student_declined → asked_to_student) is NOT
   * permitted by `markAskedToStudent`; if Phase 3 adds that path, it
   * adds a dedicated `reAskAfterDecline()` method rather than relaxing
   * the source-state guard.
   */
  markStudentDeclined(questionId: string, reason: string): void {
    const question = this.questions.find(q => q.id === questionId);
    if (!question || question.status !== 'asked_to_student') {
      throw this.buildIllegalTransitionError(
        questionId,
        'markStudentDeclined',
        'asked_to_student',
        'student_declined',
        question,
      );
    }

    question.status = 'student_declined';
    question.resolution = reason;
    question.resolvedAt = new Date().toISOString();
  }

  /**
   * Get all open questions whose source is `'analysis_specifics_gap'`
   * (i.e., the dig-pathway questions waiting to be surfaced to the
   * student). Sorted by the same priority+iterationsSurvived ordering
   * `getOpenQuestions()` uses, so the Conversator timing policy can
   * pull the highest-priority pending dig.
   *
   * The accessor exists so the Conversator's dig-firing step (Phase 3)
   * doesn't have to filter the full open-questions list; the queue
   * manager owns the filter to keep the logic in one place.
   */
  getOpenAnalysisGapQuestions(): UnderstandingQuestion[] {
    return this.getOpenQuestions().filter(
      q => q.source === 'analysis_specifics_gap',
    );
  }
}
