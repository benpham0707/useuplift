/**
 * Enhanced Workshop API Client (frontend)
 *
 * Client-side service that calls the Express /enhanced/* routes.
 * Uses Clerk JWT for authentication.
 *
 * Usage:
 *   import { useAuth } from '@clerk/clerk-react';
 *   const { getToken } = useAuth();
 *   const token = await getToken();
 *   const session = await startEnhancedSession(token, { ... });
 */

import type {
  EnhancedSession,
  StartEnhancedSessionInput,
  EnhancedInlineEditRequest,
  AuthenticityCheckRequest,
  BuildVoiceProfileRequest,
  SuggestCommandsRequest,
  VersionCompareRequest,
  EnhancedVersionComparison,
  StudentVoiceProfile,
  AIRiskAssessment,
  InlineEditResult,
  CommandSuggestion,
} from './types';

// ============================================================================
// CONFIG
// ============================================================================

const API_BASE = typeof window !== 'undefined'
  ? (import.meta.env.VITE_API_BASE || '')
  : '';

const ENHANCED_PREFIX = `${API_BASE}/api/v1/enhanced`;

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function enhancedFetch<T>(
  path: string,
  token: string,
  body: unknown
): Promise<T> {
  const url = `${ENHANCED_PREFIX}${path}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({})) as ApiResponse<never>;
    throw new Error(errorBody.error || `Request failed with status ${response.status}`);
  }

  const result = await response.json() as ApiResponse<T>;

  if (!result.success) {
    throw new Error(result.error || 'Unknown error');
  }

  return result.data as T;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Start an enhanced editing session.
 * Creates a session, loads/builds voice profile, runs initial authenticity check.
 */
export async function startEnhancedSession(
  token: string,
  input: StartEnhancedSessionInput
): Promise<EnhancedSession> {
  return enhancedFetch<EnhancedSession>('/session/start', token, input);
}

/**
 * End an editing session and persist analytics.
 */
export async function endEnhancedSession(
  token: string,
  sessionId: string
): Promise<{ sessionId: string; editCount: number; acceptedEdits: number; ended: boolean }> {
  return enhancedFetch('/session/end', token, { sessionId });
}

/**
 * Apply an inline editing command to selected text.
 * Automatically injects voice profile and session context.
 */
export async function applyInlineEdit(
  token: string,
  request: EnhancedInlineEditRequest
): Promise<InlineEditResult> {
  return enhancedFetch<InlineEditResult>('/inline-edit', token, request);
}

/**
 * Get 2-3 best editing command suggestions for a text selection.
 */
export async function suggestCommands(
  token: string,
  request: SuggestCommandsRequest
): Promise<CommandSuggestion[]> {
  return enhancedFetch<CommandSuggestion[]>('/suggest-commands', token, request);
}

/**
 * Build or enrich a voice profile from a writing sample.
 * If a profile exists, enriches it; otherwise creates a new one.
 */
export async function buildVoiceProfile(
  token: string,
  request: BuildVoiceProfileRequest
): Promise<StudentVoiceProfile> {
  return enhancedFetch<StudentVoiceProfile>('/voice-profile', token, request);
}

/**
 * Run an authenticity check on text (heuristic, < 50ms).
 */
export async function checkAuthenticity(
  token: string,
  request: AuthenticityCheckRequest
): Promise<AIRiskAssessment> {
  return enhancedFetch<AIRiskAssessment>('/authenticity/check', token, request);
}

/**
 * Compare two scored essay versions.
 */
export async function compareVersions(
  token: string,
  request: VersionCompareRequest
): Promise<EnhancedVersionComparison> {
  return enhancedFetch<EnhancedVersionComparison>('/version-compare', token, request);
}
