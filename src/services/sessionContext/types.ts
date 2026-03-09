/**
 * Document Session Context Types
 * Phase 2 implementation — session-aware editing context
 */

import type { EditingCommand } from '../inlineEditor/types';
import type { StudentVoiceProfile } from '../voiceProfile/types';

/** An active document editing session */
export interface DocumentSession {
  sessionId: string;
  userId: string;
  documentType: 'essay' | 'piq' | 'activity_description';
  currentText: string;
  essayType?: string;
  promptText?: string;
  collegeId?: string;
  voiceProfile?: StudentVoiceProfile;
  /** Cached analysis (invalidated on text change) */
  lastAnalysis?: {
    timestamp: string;
    textHash: string;
    scores: Record<string, number>;
    topIssues: string[];
  };
  /** Edit history for this session */
  editHistory: EditRecord[];
  /** Persistence metadata (added for Supabase write-behind) */
  persistence?: SessionPersistenceInfo;
}

/** Record of a single edit operation */
export interface EditRecord {
  timestamp: string;
  command: EditingCommand;
  original: string;
  replacement: string;
  accepted: boolean;
  /** Target dimension (present when edit comes from improvement planner) */
  dimension?: string;
}

/** Persistence metadata (added for Supabase write-behind) */
export interface SessionPersistenceInfo {
  /** When the session was created */
  createdAt: string;
  /** When the session expires (default: 24h from creation) */
  expiresAt: string;
  /** When the session was ended (null if still active) */
  endedAt?: string;
  /** Whether this session has been persisted to Supabase */
  persisted: boolean;
}

/** Input for starting a new editing session */
export interface StartSessionInput {
  userId: string;
  documentType: DocumentSession['documentType'];
  text: string;
  essayType?: string;
  promptText?: string;
  collegeId?: string;
}
