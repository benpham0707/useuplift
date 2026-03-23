/**
 * Coaching Mode Detection — determines which coaching behavior to use for each turn.
 *
 * Pure code-side detection using existing signals:
 *   1. recentEditContext presence (from processEdit pipeline)
 *   2. Paragraph-level edit count (from VersionTracker)
 *   3. Edit change type (from EditUnderstanding — structural vs content)
 *   4. Edit significance + improvement phase (for polish detection)
 *   5. Student message content analysis (for chat-pasted revisions)
 *
 * No LLM call. Deterministic. Runs before the Sonnet coaching call.
 *
 * Consumed by: ReanalysisOrchestrator.processCoachingTurn() → passes mode
 * to CoachingService.processCoachingTurn() → drives block composition.
 */

import type { CoachingMode, ImprovementPhaseLevel, EditChangeType } from '../profileTypes';

// ============================================================================
// CHAT-PASTED REVISION DETECTION
// ============================================================================

/** Revision language patterns — student describes submitting revised text */
const REVISION_LANGUAGE = /\b(rewrote|revised|changed|updated|reworked|redid|new version|here'?s (my|the) (new|revised|updated|rewritten)|how('?s| is) this( version)?|what do you think (of|about) this|take a look)\b/i;

/** Minimum word count to consider a message as containing pasted prose (not just a question) */
const MIN_PROSE_WORDS = 40;

/**
 * Detect whether the student pasted a revision directly in the chat
 * (bypassing the editor → processEdit pipeline).
 *
 * Conservative: requires BOTH revision language AND substantial prose AND
 * prior edit history. False negatives are safe (fall back to first_encounter).
 */
function detectChatPastedRevision(message: string, hasAnyEdits: boolean): boolean {
  if (!hasAnyEdits) return false;

  const wordCount = message.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < MIN_PROSE_WORDS) return false;

  return REVISION_LANGUAGE.test(message);
}

// ============================================================================
// STRUCTURAL CHANGE DETECTION
// ============================================================================

/** Change types that indicate structural reorganization */
const STRUCTURAL_CHANGE_TYPES: EditChangeType[] = ['structural_reorganization'];

// ============================================================================
// MAIN DETECTION
// ============================================================================

/**
 * Detect the coaching mode for the current turn.
 *
 * Detection cascade (in priority order):
 *   1. Architecture: structural reorg detected (paragraph insert/delete/reorder)
 *   2. Iteration deep: 3+ edits to the focused section
 *   3. Polish: minor edit during polish/distinction phase
 *   4. Revision response: edit context present (standard revision)
 *   5. Chat-pasted revision: revision language + substantial prose in message
 *   6. First encounter: default
 *
 * @param recentEditContext   Present if processEdit() ran before this turn
 * @param editSignificance   From EditUnderstanding.significance (undefined if no edit)
 * @param editCountForFocus  Max edit count across focused paragraphs (from VersionTracker)
 * @param studentMessage     The student's raw chat message
 * @param hasAnyEdits        Whether any edits have ever been recorded (from VersionTracker)
 * @param editChangeType     From EditUnderstanding.changeType (undefined if no edit)
 * @param phase              Current improvement phase level (for polish detection)
 * @returns The coaching mode that drives block composition
 */
export function detectCoachingMode(
  recentEditContext: string | undefined,
  editSignificance: string | undefined,
  editCountForFocus: number,
  studentMessage: string,
  hasAnyEdits: boolean,
  editChangeType?: EditChangeType,
  phase?: ImprovementPhaseLevel,
): CoachingMode {
  // ── Signal 1: Edit pipeline produced context ──
  if (recentEditContext) {
    // Architecture: structural reorganization takes priority
    if (editChangeType && STRUCTURAL_CHANGE_TYPES.includes(editChangeType)) {
      return 'architecture';
    }

    // Iteration deep: 3+ edits to the focused section
    if (editCountForFocus >= 3) {
      return 'iteration_deep';
    }

    // Polish: minor edits during polish/distinction phase
    if (editSignificance === 'minor' && (phase === 'polish' || phase === 'distinction')) {
      return 'polish';
    }

    // Standard revision response
    return 'revision_response';
  }

  // ── Signal 2: Student pasted revision in chat (no processEdit flow) ──
  if (detectChatPastedRevision(studentMessage, hasAnyEdits)) {
    return 'revision_response';
  }

  // ── Default: first encounter / conversation ──
  return 'first_encounter';
}
