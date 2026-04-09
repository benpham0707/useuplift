/**
 * SupabaseCheckpointStore — Durable persistence for EssayProfile checkpoints.
 *
 * Implements the CheckpointStore interface (profileTypes.ts) using the existing
 * essay_understanding table. Stores the full EssayProfile in the `profile_cache`
 * JSONB column, separate from the legacy `understanding` column.
 *
 * The `text_hash` column (already indexed) enables cache validation:
 * on `/start`, hash the essay text and call `loadIfHashMatches()` — if the hash
 * matches, the cached profile is returned and the analysis pipeline is skipped.
 *
 * Save is fire-and-forget at pipeline checkpoints. Load is synchronous on session start.
 */

import { createHash } from 'crypto';
import type {
  EssayProfile,
  CheckpointStore,
  CheckpointMetadata,
} from '../profileTypes';

// Lazy supabase import to avoid pulling DB modules at import time
let _supabaseAdmin: ReturnType<typeof import('@supabase/supabase-js').createClient> | null = null;

async function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const mod = await import('@/supabase/admin');
    _supabaseAdmin = (mod as any).supabaseAdmin;
  }
  return _supabaseAdmin!;
}

/**
 * Compute SHA256 hash of essay text for cache validation.
 */
export function hashEssayText(essayText: string): string {
  return createHash('sha256').update(essayText).digest('hex');
}

export class SupabaseCheckpointStore implements CheckpointStore {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async save(profile: EssayProfile, metadata: CheckpointMetadata): Promise<void> {
    try {
      const supabase = await getSupabaseAdmin();

      // Compute text hash from paragraph texts
      const baselineText = profile.paragraphs.map(p => p.text).join('\n\n');
      const textHash = hashEssayText(baselineText);

      const { error } = await supabase
        .from('essay_understanding')
        .upsert(
          {
            essay_id: metadata.essayId,
            user_id: this.userId,
            essay_type: 'common_app', // Default; overwritten if row exists
            text_hash: textHash,
            profile_cache: profile as unknown as Record<string, unknown>,
            total_cost_usd: metadata.costSoFar,
            version: metadata.writeVersion,
            last_analysis_at: new Date().toISOString(),
          },
          { onConflict: 'essay_id,user_id' },
        );

      if (error) {
        console.error('[SupabaseCheckpointStore] Save failed:', error.message);
      }
    } catch (err) {
      // Fire-and-forget: log but don't throw (don't break the pipeline)
      console.error('[SupabaseCheckpointStore] Save error:', err);
    }
  }

  async load(essayId: string): Promise<EssayProfile | null> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from('essay_understanding')
        .select('profile_cache')
        .eq('essay_id', essayId)
        .eq('user_id', this.userId)
        .single();

      if (error || !data?.profile_cache) return null;
      return data.profile_cache as unknown as EssayProfile;
    } catch (err) {
      console.error('[SupabaseCheckpointStore] Load error:', err);
      return null;
    }
  }

  /**
   * Load cached profile only if the essay text hash matches.
   * Returns null if no cache exists or if the text has changed.
   */
  async loadIfHashMatches(essayId: string, textHash: string): Promise<EssayProfile | null> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from('essay_understanding')
        .select('profile_cache')
        .eq('essay_id', essayId)
        .eq('user_id', this.userId)
        .eq('text_hash', textHash)
        .single();

      if (error || !data?.profile_cache) return null;
      return data.profile_cache as unknown as EssayProfile;
    } catch (err) {
      console.error('[SupabaseCheckpointStore] Hash check error:', err);
      return null;
    }
  }
}
