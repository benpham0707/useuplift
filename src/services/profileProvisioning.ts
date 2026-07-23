import type { SupabaseClient } from '@supabase/supabase-js';

export interface ProvisionedProfile {
  id: string;
  created: boolean;
}

/**
 * The only profile INSERT path. Browser clients must wait for this idempotent
 * server-side reconciliation instead of creating profiles or issuing credits.
 */
export async function provisionProfile(
  db: SupabaseClient<any>,
  clerkUserId: string,
): Promise<ProvisionedProfile> {
  const { data: existing, error: lookupError } = await db
    .from('profiles').select('id').eq('user_id', clerkUserId).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing?.id) return { id: existing.id, created: false };

  const { data: created, error: createError } = await db
    .from('profiles')
    .insert({ user_id: clerkUserId, user_context: 'high_school_11th', has_completed_assessment: false, status: 'initial' })
    .select('id')
    .single();

  if (createError) {
    // A concurrent webhook/reconciliation won the unique user_id race.
    const { data: raced, error: racedError } = await db
      .from('profiles').select('id').eq('user_id', clerkUserId).maybeSingle();
    if (racedError || !raced?.id) throw createError;
    return { id: raced.id, created: false };
  }

  const { error: grantError } = await db.from('credit_transactions').insert({
    user_id: clerkUserId,
    amount: 10,
    type: 'bonus',
    description: 'Initial Uplift signup credits',
    idempotency_key: `signup:${clerkUserId}`,
  });
  if (grantError) throw grantError;
  return { id: created.id, created: true };
}
