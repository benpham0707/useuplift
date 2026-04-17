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
    // Round 7 P0 (D4-H1): validate essayId up-front — the Supabase column is
    // `essay_id UUID NOT NULL REFERENCES essays(id)`, so an empty string or
    // malformed UUID causes an insert error that the old catch-and-log
    // wrapper hid. Fail-fast so the coordinator can surface telemetry.
    if (!metadata.essayId || metadata.essayId.trim() === '') {
      throw new Error(
        `[SupabaseCheckpointStore] Cannot save checkpoint: essayId is empty. ` +
        `This indicates a regression of D4-H1 — every caller of ` +
        `EssayProfileCoordinator.createNew / fromCheckpoint MUST provide a ` +
        `valid UUID.`,
      );
    }

    const supabase = await getSupabaseAdmin();

    // Compute text hash from paragraph texts
    const baselineText = profile.paragraphs.map(p => p.text).join('\n\n');
    const textHash = hashEssayText(baselineText);

    // Scope 3 Phase 7: strip transient Scope 3 fields before persisting.
    // `improvementManifest._enriched` is the session-local idempotency
    // flag for research enrichment — persisting it would permanently
    // short-circuit enrichment when the student switches collegeId
    // mid-thread or the research DB is updated. The JSON-replacer
    // pattern scales if more keys need to be stripped later.
    const sanitizedProfile = JSON.parse(
      JSON.stringify(profile, (key, value) => {
        if (key === '_enriched') return undefined;
        return value;
      }),
    );

    // Round 7 P0 (D4-L3): essay_type threaded from metadata — previously
    // hardcoded to 'common_app', which flipped PIQ / supplement rows to
    // common_app on every save (even when the upsert succeeded).
    const { error } = await supabase
      .from('essay_understanding')
      .upsert(
        {
          essay_id: metadata.essayId,
          user_id: this.userId,
          essay_type: metadata.essayType,
          text_hash: textHash,
          profile_cache: sanitizedProfile as Record<string, unknown>,
          total_cost_usd: metadata.costSoFar,
          version: metadata.writeVersion,
          last_analysis_at: new Date().toISOString(),
        },
        { onConflict: 'essay_id,user_id' },
      );

    if (error) {
      // Round 7 P0 (Plan §2.5): THROW on persistence failure instead of
      // silently logging. The coordinator's `checkpoint()` catches + logs
      // + rethrows so telemetry surfaces it. Previously, FK / constraint
      // violations (notably D4-H1 empty-string essayId) were swallowed
      // here and no Round-7 signal ever reached the DB.
      const msg = `[SupabaseCheckpointStore] Upsert failed: ${error.message} ` +
        `(essayId=${metadata.essayId}, userId=${this.userId}, reason=${metadata.reason})`;
      console.error(msg);
      throw new Error(msg);
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
