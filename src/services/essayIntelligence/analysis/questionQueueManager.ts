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
}
