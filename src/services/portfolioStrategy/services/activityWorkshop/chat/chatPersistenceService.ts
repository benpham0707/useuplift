/**
 * Chat Persistence Service
 *
 * Provides database persistence for activity profiles and chat conversations.
 * Uses the supabaseAdmin client (service_role) for server-side operations,
 * bypassing RLS since the server already authenticates via Clerk middleware.
 *
 * DESIGN:
 * - All methods return { success, data/error } pattern
 * - Upsert for profiles (idempotent saves)
 * - Conversation history capped at 20 turns to limit JSONB size
 * - Simple string hash for description staleness detection
 */

import { supabaseAdmin } from '@/supabase/admin';
import { ActivityProfile } from '../profile/types';
import { ConversationState } from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Summary of a conversation for listing purposes
 */
export interface ConversationListItem {
  conversationId: string;
  activityId: string;
  activityTitle: string;
  phase: string;
  totalTurns: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Row shape for the activity_profiles table
 */
interface ActivityProfileRow {
  id: string;
  profile_id: string;
  activity_id: string;
  activity_title: string;
  profile_data: Record<string, unknown>;
  data_completeness: number;
  profile_version: number;
  description_hash: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Row shape for the activity_chat_conversations table
 */
interface ConversationRow {
  id: string;
  profile_id: string;
  activity_id: string;
  conversation_state: Record<string, unknown>;
  phase: string;
  total_turns: number;
  is_active: boolean;
  token_usage: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum conversation turns to persist (keeps JSONB size reasonable) */
const MAX_PERSISTED_TURNS = 20;

const LOG_PREFIX = '[ChatPersistenceService]';

// ============================================================================
// HASH UTILITY
// ============================================================================

/**
 * Simple string hash for staleness detection.
 * Not cryptographic — just a fast fingerprint to detect description changes.
 * Uses djb2 algorithm for speed and reasonable distribution.
 */
function simpleHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    // hash * 33 + charCode
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    // Convert to unsigned 32-bit
    hash = hash >>> 0;
  }
  return hash.toString(16);
}

// ============================================================================
// CONVERSATION STATE HELPERS
// ============================================================================

/**
 * Trim conversation state to keep only the latest N turns.
 * Preserves all non-turn data (phase, profile, metadata, etc.)
 */
function trimConversationState(state: ConversationState): ConversationState {
  const trimmed = { ...state };

  if (trimmed.responsesReceived && trimmed.responsesReceived.length > MAX_PERSISTED_TURNS) {
    trimmed.responsesReceived = trimmed.responsesReceived.slice(-MAX_PERSISTED_TURNS);
  }

  if (trimmed.questionsAsked && trimmed.questionsAsked.length > MAX_PERSISTED_TURNS) {
    trimmed.questionsAsked = trimmed.questionsAsked.slice(-MAX_PERSISTED_TURNS);
  }

  return trimmed;
}

/**
 * Serialize ConversationState dynamics Map to a plain object for JSONB storage.
 * Maps are not JSON-serializable, so we convert them.
 */
function serializeConversationState(state: ConversationState): Record<string, unknown> {
  const serializable = { ...state } as Record<string, unknown>;

  // Convert dynamics.modeEffectiveness Map to a plain object
  if (state.dynamics?.modeEffectiveness) {
    const dynamicsCopy = { ...state.dynamics };
    const modeEffObj: Record<string, { attempts: number; improvements: number }> = {};
    state.dynamics.modeEffectiveness.forEach((value, key) => {
      modeEffObj[key] = value;
    });
    (dynamicsCopy as Record<string, unknown>).modeEffectiveness = modeEffObj;
    serializable.dynamics = dynamicsCopy;
  }

  return serializable;
}

/**
 * Deserialize stored JSONB back into a ConversationState.
 * Restores the modeEffectiveness Map from a plain object.
 */
function deserializeConversationState(data: Record<string, unknown>): ConversationState {
  const state = data as unknown as ConversationState;

  // Restore dynamics.modeEffectiveness as a Map
  if (state.dynamics && state.dynamics.modeEffectiveness && !(state.dynamics.modeEffectiveness instanceof Map)) {
    const modeEffObj = state.dynamics.modeEffectiveness as unknown as Record<string, { attempts: number; improvements: number }>;
    const modeEffMap = new Map<string, { attempts: number; improvements: number }>();
    for (const [key, value] of Object.entries(modeEffObj)) {
      modeEffMap.set(key, value);
    }
    state.dynamics.modeEffectiveness = modeEffMap as ConversationState['dynamics'] extends undefined ? never : NonNullable<ConversationState['dynamics']>['modeEffectiveness'];
  }

  return state;
}

// ============================================================================
// SERVICE
// ============================================================================

export class ChatPersistenceService {

  // ==========================================================================
  // PROFILE OPERATIONS
  // ==========================================================================

  /**
   * Save (upsert) an activity profile.
   * Uses INSERT ON CONFLICT UPDATE to handle both creation and updates.
   *
   * @param profileId - The user's profile UUID (from profiles table)
   * @param activityId - The activity identifier
   * @param activityTitle - Display title for the activity
   * @param profile - The full ActivityProfile object
   * @param descriptionText - Optional current description text for hash-based staleness detection
   */
  async saveProfile(
    profileId: string,
    activityId: string,
    activityTitle: string,
    profile: ActivityProfile,
    descriptionText?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const descriptionHash = descriptionText ? simpleHash(descriptionText) : null;

      const { error } = await supabaseAdmin
        .from('activity_profiles')
        .upsert(
          {
            profile_id: profileId,
            activity_id: activityId,
            activity_title: activityTitle,
            profile_data: profile as unknown as Record<string, unknown>,
            data_completeness: profile.dataCompleteness ?? 0,
            profile_version: profile.profileVersion ?? 1,
            description_hash: descriptionHash,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'profile_id,activity_id',
          }
        );

      if (error) {
        console.error(`${LOG_PREFIX} saveProfile failed:`, error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${LOG_PREFIX} saveProfile exception:`, message);
      return { success: false, error: message };
    }
  }

  /**
   * Load an activity profile by user profile ID and activity ID.
   */
  async loadProfile(
    profileId: string,
    activityId: string
  ): Promise<{ success: boolean; profile?: ActivityProfile; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('activity_profiles')
        .select('profile_data')
        .eq('profile_id', profileId)
        .eq('activity_id', activityId)
        .maybeSingle();

      if (error) {
        console.error(`${LOG_PREFIX} loadProfile failed:`, error.message);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: true }; // No profile found — not an error
      }

      const row = data as unknown as Pick<ActivityProfileRow, 'profile_data'>;
      return {
        success: true,
        profile: row.profile_data as unknown as ActivityProfile,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${LOG_PREFIX} loadProfile exception:`, message);
      return { success: false, error: message };
    }
  }

  /**
   * Load all activity profiles for a user, keyed by activityId.
   */
  async loadAllProfiles(
    profileId: string
  ): Promise<{ success: boolean; profiles?: Record<string, ActivityProfile>; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('activity_profiles')
        .select('activity_id, profile_data')
        .eq('profile_id', profileId);

      if (error) {
        console.error(`${LOG_PREFIX} loadAllProfiles failed:`, error.message);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: true, profiles: {} };
      }

      const profiles: Record<string, ActivityProfile> = {};
      for (const row of data as unknown as Pick<ActivityProfileRow, 'activity_id' | 'profile_data'>[]) {
        profiles[row.activity_id] = row.profile_data as unknown as ActivityProfile;
      }

      return { success: true, profiles };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${LOG_PREFIX} loadAllProfiles exception:`, message);
      return { success: false, error: message };
    }
  }

  /**
   * Delete an activity profile.
   */
  async deleteProfile(
    profileId: string,
    activityId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('activity_profiles')
        .delete()
        .eq('profile_id', profileId)
        .eq('activity_id', activityId);

      if (error) {
        console.error(`${LOG_PREFIX} deleteProfile failed:`, error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${LOG_PREFIX} deleteProfile exception:`, message);
      return { success: false, error: message };
    }
  }

  // ==========================================================================
  // CONVERSATION OPERATIONS
  // ==========================================================================

  /**
   * Save (upsert) a conversation.
   * The conversation ID is the Supabase row ID.
   * Trims conversation history to MAX_PERSISTED_TURNS before storing.
   */
  async saveConversation(
    profileId: string,
    conversationId: string,
    activityId: string,
    state: ConversationState
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const trimmedState = trimConversationState(state);
      const serializedState = serializeConversationState(trimmedState);

      const tokenUsage = state.tokenUsage ?? {};

      const { error } = await supabaseAdmin
        .from('activity_chat_conversations')
        .upsert(
          {
            id: conversationId,
            profile_id: profileId,
            activity_id: activityId,
            conversation_state: serializedState,
            phase: state.phase,
            total_turns: state.totalTurns,
            is_active: state.phase !== 'complete',
            token_usage: tokenUsage as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'id',
          }
        );

      if (error) {
        console.error(`${LOG_PREFIX} saveConversation failed:`, error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${LOG_PREFIX} saveConversation exception:`, message);
      return { success: false, error: message };
    }
  }

  /**
   * Load a conversation by its ID, scoped to the owning profile.
   * The profileId filter prevents IDOR — users can only load their own conversations.
   */
  async loadConversation(
    conversationId: string,
    profileId: string
  ): Promise<{ success: boolean; state?: ConversationState; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('activity_chat_conversations')
        .select('conversation_state')
        .eq('id', conversationId)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) {
        console.error(`${LOG_PREFIX} loadConversation failed:`, error.message);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: true }; // Not found — not an error
      }

      const row = data as unknown as Pick<ConversationRow, 'conversation_state'>;
      const state = deserializeConversationState(row.conversation_state);
      return { success: true, state };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${LOG_PREFIX} loadConversation exception:`, message);
      return { success: false, error: message };
    }
  }

  /**
   * Load the most recent active conversation for a given user + activity.
   * Returns undefined if no active conversation exists.
   */
  async loadActiveConversation(
    profileId: string,
    activityId: string
  ): Promise<{ success: boolean; state?: ConversationState; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('activity_chat_conversations')
        .select('conversation_state')
        .eq('profile_id', profileId)
        .eq('activity_id', activityId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(`${LOG_PREFIX} loadActiveConversation failed:`, error.message);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: true }; // No active conversation — not an error
      }

      const row = data as unknown as Pick<ConversationRow, 'conversation_state'>;
      const state = deserializeConversationState(row.conversation_state);
      return { success: true, state };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${LOG_PREFIX} loadActiveConversation exception:`, message);
      return { success: false, error: message };
    }
  }

  /**
   * Mark a conversation as complete (no longer active).
   */
  async markConversationComplete(
    conversationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('activity_chat_conversations')
        .update({
          is_active: false,
          phase: 'complete',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        console.error(`${LOG_PREFIX} markConversationComplete failed:`, error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${LOG_PREFIX} markConversationComplete exception:`, message);
      return { success: false, error: message };
    }
  }

  /**
   * List conversations for a user, optionally filtered by activity.
   * Returns summary items (not full conversation state).
   */
  async listConversations(
    profileId: string,
    activityId?: string
  ): Promise<{ success: boolean; conversations?: ConversationListItem[]; error?: string }> {
    try {
      let query = supabaseAdmin
        .from('activity_chat_conversations')
        .select('id, activity_id, phase, total_turns, is_active, created_at, updated_at')
        .eq('profile_id', profileId)
        .order('updated_at', { ascending: false });

      if (activityId) {
        query = query.eq('activity_id', activityId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`${LOG_PREFIX} listConversations failed:`, error.message);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: true, conversations: [] };
      }

      // We need activity titles — fetch from activity_profiles for each unique activityId
      const activityIds = [...new Set((data as { activity_id: string }[]).map(r => r.activity_id))];
      const { data: profileRows } = await supabaseAdmin
        .from('activity_profiles')
        .select('activity_id, activity_title')
        .eq('profile_id', profileId)
        .in('activity_id', activityIds);

      const titleMap: Record<string, string> = {};
      if (profileRows) {
        for (const row of profileRows as unknown as Pick<ActivityProfileRow, 'activity_id' | 'activity_title'>[]) {
          titleMap[row.activity_id] = row.activity_title;
        }
      }

      const conversations: ConversationListItem[] = (data as unknown as Array<{
        id: string;
        activity_id: string;
        phase: string;
        total_turns: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      }>).map(row => ({
        conversationId: row.id,
        activityId: row.activity_id,
        activityTitle: titleMap[row.activity_id] ?? 'Unknown Activity',
        phase: row.phase,
        totalTurns: row.total_turns,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return { success: true, conversations };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${LOG_PREFIX} listConversations exception:`, message);
      return { success: false, error: message };
    }
  }

  // ==========================================================================
  // UTILITY
  // ==========================================================================

  /**
   * Check if a description has changed since the profile was last built.
   * Returns true if the description has changed or no hash exists.
   */
  async isDescriptionStale(
    profileId: string,
    activityId: string,
    currentDescription: string
  ): Promise<{ success: boolean; isStale?: boolean; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('activity_profiles')
        .select('description_hash')
        .eq('profile_id', profileId)
        .eq('activity_id', activityId)
        .maybeSingle();

      if (error) {
        console.error(`${LOG_PREFIX} isDescriptionStale failed:`, error.message);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: true, isStale: true }; // No profile = stale
      }

      const row = data as unknown as Pick<ActivityProfileRow, 'description_hash'>;
      const currentHash = simpleHash(currentDescription);
      return { success: true, isStale: row.description_hash !== currentHash };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${LOG_PREFIX} isDescriptionStale exception:`, message);
      return { success: false, error: message };
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const chatPersistenceService = new ChatPersistenceService();
