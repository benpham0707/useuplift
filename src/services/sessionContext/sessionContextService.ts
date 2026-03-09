/**
 * Session Context Service
 *
 * Manages document editing sessions with in-memory hot cache and
 * Supabase write-behind persistence. The in-memory Map is the
 * source of truth; Supabase provides durability across restarts.
 *
 * Read path:  Map hit → return | Map miss → load from Supabase → cache → return
 * Write path: Update Map immediately → debounced fire-and-forget Supabase write
 */

import { randomUUID } from 'crypto';
import type { DocumentSession, EditRecord, StartSessionInput, SessionPersistenceInfo } from './types';

// ============================================================================
// LAZY SUPABASE IMPORT (avoids circular deps at module load time)
// ============================================================================

let _supabaseAdmin: ReturnType<typeof import('@supabase/supabase-js').createClient> | null = null;

async function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const mod = await import('@/supabase/admin');
    _supabaseAdmin = mod.supabaseAdmin;
  }
  return _supabaseAdmin;
}

// ============================================================================
// SERVICE
// ============================================================================

export class SessionContextService {
  /** Active sessions keyed by sessionId */
  private readonly sessions = new Map<string, DocumentSession>();
  /** Debounce timers for write-behind persistence */
  private readonly updateTimers = new Map<string, NodeJS.Timeout>();
  private readonly DEBOUNCE_MS = 500;
  private readonly EVICTION_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    // Periodic sweep to evict expired sessions and prevent memory leaks
    const timer = setInterval(() => this.evictExpiredSessions(), this.EVICTION_INTERVAL_MS);
    timer.unref(); // Don't prevent Node.js from exiting
  }

  /** Remove sessions that have passed their expiresAt from the in-memory cache */
  private evictExpiredSessions(): void {
    const now = Date.now();
    let evicted = 0;
    for (const [id, session] of this.sessions) {
      if (session.persistence?.expiresAt && new Date(session.persistence.expiresAt).getTime() < now) {
        this.endSession(id);
        evicted++;
      }
    }
    if (evicted > 0) {
      console.log(`[SessionContext] Evicted ${evicted} expired session(s)`);
    }
  }

  /**
   * Start a new document editing session.
   * Creates in memory immediately, persists to Supabase fire-and-forget.
   */
  startSession(input: StartSessionInput): DocumentSession {
    const sessionId = randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const session: DocumentSession = {
      sessionId,
      userId: input.userId,
      documentType: input.documentType,
      currentText: input.text,
      essayType: input.essayType,
      promptText: input.promptText,
      collegeId: input.collegeId,
      editHistory: [],
      persistence: {
        createdAt: now,
        expiresAt,
        persisted: false,
      },
    };

    this.sessions.set(sessionId, session);

    // Fire-and-forget persist
    this.persistNewSession(session).catch(err => {
      console.error('[SessionContext] Failed to persist new session:', err instanceof Error ? err.message : err);
    });

    return session;
  }

  /**
   * Update the current document text. Invalidates cached analysis.
   * Memory update is immediate; Supabase write is debounced.
   */
  updateDocument(sessionId: string, newText: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[SessionContext] Session not found: ${sessionId}`);
      return;
    }

    session.currentText = newText;
    session.lastAnalysis = undefined;

    this.debouncedPersist(sessionId);
  }

  /**
   * Build a compact context block (~200-300 tokens) for LLM prompt injection.
   * Summarizes the document state and recent edit history.
   * Reads from memory only — no Supabase call.
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

      // Word count target by essay type — helps LLM decide compress vs expand
      const wcTargets: Record<string, number> = {
        common_app: 650, personal_statement: 650, piq: 350,
        why_us: 400, activity: 150, additional_info: 650,
      };
      const target = wcTargets[session.essayType];
      if (target) {
        const remaining = target - wordCount;
        lines.push(`Word count: ${wordCount}/${target} (${remaining > 0 ? `${remaining} remaining` : 'AT LIMIT'})`);
      } else {
        lines.push(`Word count: ${wordCount}`);
      }
    } else {
      lines.push(`Word count: ${wordCount}`);
    }

    // Surface the prompt text so the LLM can tailor edits to the actual question
    if (session.promptText) {
      lines.push(`Prompt: ${session.promptText.length > 200 ? session.promptText.slice(0, 200) + '...' : session.promptText}`);
    }

    // Recent edits (last 5) with dimension context
    if (session.editHistory.length > 0) {
      const recent = session.editHistory.slice(-5);
      const editSummary = recent.map(e =>
        `${e.command}${e.dimension ? ` (${e.dimension})` : ''}${e.accepted ? '' : ' [rejected]'}`
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
   * Memory update is immediate; Supabase write is debounced.
   */
  recordEdit(sessionId: string, edit: EditRecord): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[SessionContext] Session not found: ${sessionId}`);
      return;
    }

    session.editHistory.push(edit);

    this.debouncedPersist(sessionId);
  }

  /**
   * Retrieve a session by ID.
   * Checks in-memory cache first; on miss, attempts to load from Supabase.
   */
  async getSession(sessionId: string): Promise<DocumentSession | undefined> {
    // Hot cache hit
    const cached = this.sessions.get(sessionId);
    if (cached) return cached;

    // Read-through: try Supabase
    return this.loadFromSupabase(sessionId);
  }

  /**
   * Synchronous session lookup (memory only, no Supabase fallback).
   * Use this when you need a non-async path (e.g., getDocumentContextBlock).
   */
  getSessionSync(sessionId: string): DocumentSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * End a session and free its memory.
   * Marks ended_at in Supabase fire-and-forget.
   */
  endSession(sessionId: string): void {
    // Clear any pending debounce timer
    const timer = this.updateTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.updateTimers.delete(sessionId);
    }

    const session = this.sessions.get(sessionId);
    this.sessions.delete(sessionId);

    if (session?.persistence) {
      session.persistence.endedAt = new Date().toISOString();
    }

    // Fire-and-forget: mark ended in Supabase
    this.markSessionEnded(sessionId).catch(err => {
      console.error('[SessionContext] Failed to mark session ended:', err instanceof Error ? err.message : err);
    });
  }

  // ==========================================================================
  // PRIVATE — Supabase persistence helpers
  // ==========================================================================

  /**
   * INSERT a new session row into Supabase.
   */
  private async persistNewSession(session: DocumentSession): Promise<void> {
    const supabase = await getSupabaseAdmin();
    const { error } = await supabase.from('editing_sessions').insert({
      session_id: session.sessionId,
      user_id: session.userId,
      document_type: session.documentType,
      current_text: session.currentText,
      essay_type: session.essayType ?? null,
      prompt_text: session.promptText ?? null,
      college_id: session.collegeId ?? null,
      edit_history: session.editHistory,
      last_analysis: session.lastAnalysis ?? null,
      voice_profile_snapshot: session.voiceProfile ?? null,
      expires_at: session.persistence?.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) {
      console.error('[SessionContext] Supabase INSERT failed:', error.message);
      return;
    }

    if (session.persistence) {
      session.persistence.persisted = true;
    }
  }

  /**
   * Schedule a debounced UPDATE to Supabase for the given session.
   * Coalesces rapid writes (e.g., updateDocument during fast typing).
   */
  private debouncedPersist(sessionId: string): void {
    const existing = this.updateTimers.get(sessionId);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this.updateTimers.delete(sessionId);
      this.flushToSupabase(sessionId).catch(err => {
        console.error('[SessionContext] Debounced persist failed:', err instanceof Error ? err.message : err);
      });
    }, this.DEBOUNCE_MS);

    this.updateTimers.set(sessionId, timer);
  }

  /**
   * Flush current in-memory session state to Supabase.
   */
  private async flushToSupabase(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const supabase = await getSupabaseAdmin();
    const { error } = await supabase
      .from('editing_sessions')
      .update({
        current_text: session.currentText,
        edit_history: session.editHistory,
        last_analysis: session.lastAnalysis ?? null,
        voice_profile_snapshot: session.voiceProfile ?? null,
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('[SessionContext] Supabase UPDATE failed:', error.message);
    }
  }

  /**
   * Mark a session as ended in Supabase.
   */
  private async markSessionEnded(sessionId: string): Promise<void> {
    const supabase = await getSupabaseAdmin();
    const { error } = await supabase
      .from('editing_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('session_id', sessionId);

    if (error) {
      console.error('[SessionContext] Supabase end-session UPDATE failed:', error.message);
    }
  }

  /**
   * Load a session from Supabase and populate the in-memory cache.
   * Returns undefined if not found or expired.
   */
  private async loadFromSupabase(sessionId: string): Promise<DocumentSession | undefined> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from('editing_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .is('ended_at', null)
        .single();

      if (error || !data) return undefined;

      // Check expiration
      if (new Date(data.expires_at) < new Date()) return undefined;

      const session: DocumentSession = {
        sessionId: data.session_id,
        userId: data.user_id,
        documentType: data.document_type as DocumentSession['documentType'],
        currentText: data.current_text,
        essayType: data.essay_type ?? undefined,
        promptText: data.prompt_text ?? undefined,
        collegeId: data.college_id ?? undefined,
        editHistory: (data.edit_history as unknown as DocumentSession['editHistory']) ?? [],
        lastAnalysis: data.last_analysis as DocumentSession['lastAnalysis'],
        voiceProfile: data.voice_profile_snapshot as DocumentSession['voiceProfile'],
        persistence: {
          createdAt: data.created_at,
          expiresAt: data.expires_at,
          persisted: true,
        },
      };

      // Warm the cache
      this.sessions.set(sessionId, session);
      return session;
    } catch (err) {
      console.error('[SessionContext] Failed to load from Supabase:', err instanceof Error ? err.message : err);
      return undefined;
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

export const sessionContextService = new SessionContextService();
