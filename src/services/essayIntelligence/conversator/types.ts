// ============================================================================
// CONVERSATOR TYPES (Phase 0 D-0.4)
// ============================================================================
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_E2E_INTEGRITY_AUDIT.md
//   §4 (Conversator full design), §4.6 (persistence shape — chat session log
//   on EssayProfile root), §4.7 (continuous-chat handler routes).
// Contract (D-0.4): the ConversatorSessionEntry shape — one record per
// chat turn, persisted in `EssayProfile.conversatorSessionLog[]`
// (added at D-0.5) and mirrored to the `essay_chat_conversations` table
// JSONB (D-0.6). The compact log on the profile root is a recent-session
// snapshot; the full log lives in the table.
//
// `ChatRoute` is intentionally a `string` placeholder here — Phase 3
// D-3.3 (the chat intent classifier) will narrow it to a closed union
// once the classifier's 6 routes are designed. Keeping the field
// strongly-named without pre-committing to a taxonomy honors the
// "don't introduce abstractions beyond what the task requires" rule.

/**
 * The route the continuous-chat handler classifier picked for a system
 * response. Populated only for entries with `sender === 'system'`.
 *
 * Refined by Phase 3 D-3.3 (chat intent classifier). Until then, treat
 * as opaque string — the classifier hasn't been built. Routes named in
 * `L5_E2E_INTEGRITY_AUDIT.md` §4.7 (clarification, substantive engagement,
 * correction-of-fact, frustration, surface-anchor question, etc.) are
 * the design's starting point, but the closed union belongs to D-3.3.
 */
export type ChatRoute = string;

/**
 * One chat turn in the Conversator session log.
 *
 * The entry is the unit the persistence layer writes per turn. The
 * compact recent log lives on `EssayProfile.conversatorSessionLog[]`
 * (D-0.5); the full log lives in the `essay_chat_conversations` table
 * (D-0.6). Capture happens at D-3.10 (continuousChatHandler.ts) for
 * student turns and the corresponding system response.
 *
 * Producer:
 *   - `conversatorPersistence.ts` (Phase 3 D-3.2) writes one entry per
 *     student message and one per system response.
 *   - For dig answers, `digQuestionId` links into the queue's
 *     `UnderstandingQuestion.dig` sub-object.
 *   - For successful extraction, `structuredAnswerRef` links into the
 *     captured `GroundTruthFact` / `StoryFragment` / `IntentSignal`.
 * Consumers:
 *   - The continuous-chat handler reads recent entries as conversational
 *     context (the chat thread).
 *   - The dig answer extractor (Phase 3 D-3.7) reads the (question,
 *     answer, clarifying turns) thread for context.
 *   - L6 / Conversator cross-iteration coaching reads to surface
 *     "have we worked on this before?" continuity.
 */
export interface ConversatorSessionEntry {
  /** Stable record ID. */
  id: string;
  /** ISO timestamp of the turn. */
  timestamp: string;
  /** Who sent the message. */
  sender: 'student' | 'system';
  /** The full message text. */
  messageContent: string;
  /**
   * Dig question ID — populated when this turn was either a dig question
   * surfaced to the student (system) or the student's answer to a dig
   * (student). Links into the queue's `UnderstandingQuestion.dig`.
   */
  digQuestionId?: string;
  /**
   * Focus item ID — populated when the message references a specific item
   * on the L5 focus surface (a focus card / annotation / move). Allows the
   * handler to compose responses anchored to that item.
   */
  focusItemRef?: string;
  /**
   * Which route the classifier picked. Populated only for system
   * responses. See `ChatRoute` for the placeholder note (D-3.3 refines).
   */
  route?: ChatRoute;
  /**
   * Reference to a structured-answer record this turn captured. Populated
   * when extraction succeeded — points to the `GroundTruthFact`,
   * `StoryFragment`, or `IntentSignal` ID. Spontaneous corrections (per
   * §4.7) also flow through this field.
   */
  structuredAnswerRef?: string;
}
