import { supabase } from './client';

export type CanonicalProfileTable =
  | 'personal_information'
  | 'academic_journey'
  | 'goals_aspirations'
  | 'experiences_activities';

/** One row per profile is enforced in the database for every supported table. */
export async function upsertCanonicalProfileRow(
  table: CanonicalProfileTable,
  profileId: string,
  values: Record<string, unknown>,
) {
  const { error } = await (supabase.from(table) as any).upsert(
    { profile_id: profileId, ...values },
    { onConflict: 'profile_id' },
  );
  if (error) throw error;
}

export async function getCurrentProfileId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) {
    throw new Error('Your profile is still being set up. Please retry in a moment.');
  }
  return (data as { id: string }).id;
}
