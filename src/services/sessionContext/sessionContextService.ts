/**
 * Session Context Service
 *
 * Manages in-memory document editing sessions. Tracks current text,
 * edit history, and provides compact context blocks for LLM prompts.
 *
 * Sessions are ephemeral (memory-only) — they live for the duration
 * of the user's editing session and are cleaned up on end.
 */

import { randomUUID } from 'crypto';
import type { DocumentSession, EditRecord, StartSessionInput } from './types';

// ============================================================================
// SERVICE
// ============================================================================

export class SessionContextService {
  /** Active sessions keyed by sessionId */
  private readonly sessions = new Map<string, DocumentSession>();

  /**
   * Start a new document editing session.
   */
  startSession(input: StartSessionInput): DocumentSession {
    const sessionId = randomUUID();
    const session: DocumentSession = {
      sessionId,
      userId: input.userId,
      documentType: input.documentType,
      currentText: input.text,
      essayType: input.essayType,
      promptText: input.promptText,
      collegeId: input.collegeId,
      editHistory: [],
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Update the current document text. Invalidates cached analysis.
   */
  updateDocument(sessionId: string, newText: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[SessionContext] Session not found: ${sessionId}`);
      return;
    }

    session.currentText = newText;
    session.lastAnalysis = undefined;
  }

  /**
   * Build a compact context block (~200-300 tokens) for LLM prompt injection.
   * Summarizes the document state and recent edit history.
   */
  getDocumentContextBlock(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return 'DOCUMENT CONTEXT: Session not found.';
    }

    const wordCount = session.currentText.split(/\s+/).filter(Boolean).length;

    const lines: string[] = [
      'DOCUMENT CONTEXT:',
      `Type: ${session.documentType}`,
    ];

    if (session.essayType) {
      lines.push(`Essay type: ${session.essayType}`);
    }

    lines.push(`Word count: ${wordCount}`);

    // Recent edits (last 3)
    if (session.editHistory.length > 0) {
      const recent = session.editHistory.slice(-3);
      const editSummary = recent.map(e =>
        `${e.command}${e.accepted ? '' : ' (rejected)'}`
      ).join(', ');
      lines.push(`Recent edits: ${editSummary}`);
    }

    // Top issues from last analysis
    if (session.lastAnalysis?.topIssues && session.lastAnalysis.topIssues.length > 0) {
      lines.push(`Top issues: ${session.lastAnalysis.topIssues.slice(0, 3).join('; ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Record an edit operation in the session history.
   */
  recordEdit(sessionId: string, edit: EditRecord): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[SessionContext] Session not found: ${sessionId}`);
      return;
    }

    session.editHistory.push(edit);
  }

  /**
   * Retrieve a session by ID.
   */
  getSession(sessionId: string): DocumentSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * End a session and free its memory.
   */
  endSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

export const sessionContextService = new SessionContextService();
