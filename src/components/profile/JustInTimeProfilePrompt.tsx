import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCurrentProfileId, upsertCanonicalProfileRow } from '@/integrations/supabase/canonicalProfile';
import { supabase } from '@/integrations/supabase/client';

export function CollegeMatchProfilePrompt() {
  const { user } = useAuth();
  const [major, setMajor] = useState('');
  const [environment, setEnvironment] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const save = async () => {
    if (!user || !major.trim()) return;
    setSaving(true); setMessage(null);
    try {
      const profileId = await getCurrentProfileId(user.id);
      await upsertCanonicalProfileRow('goals_aspirations', profileId, {
        intended_major: major.trim(),
        college_environment: environment.split(',').map(x => x.trim()).filter(Boolean),
      });
      setMessage('Saved — your college recommendations can now use these preferences.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save preferences.'); }
    finally { setSaving(false); }
  };
  return <section className="mb-6 rounded-lg border bg-card p-4"><h2 className="font-semibold">Improve your college matches</h2><p className="mt-1 text-sm text-muted-foreground">Share only what helps us recommend schools that fit.</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><Input value={major} onChange={e => setMajor(e.target.value)} placeholder="Intended major" /><Input value={environment} onChange={e => setEnvironment(e.target.value)} placeholder="Campus preferences, comma-separated" /></div><div className="mt-3 flex gap-2"><Button size="sm" disabled={saving || !major.trim()} onClick={save}>{saving ? 'Saving…' : 'Save preferences'}</Button><Button size="sm" variant="ghost" onClick={() => setMessage('You can add preferences later whenever you want better matches.')}>Not now</Button></div>{message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}</section>;
}

export function PIQActivitiesPrompt() {
  const { user } = useAuth();
  const [activity, setActivity] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const save = async () => {
    if (!user || !activity.trim()) return;
    setSaving(true); setMessage(null);
    try {
      const profileId = await getCurrentProfileId(user.id);
      const { data, error } = await supabase.from('experiences_activities')
        .select('extracurriculars').eq('profile_id', profileId).maybeSingle();
      if (error) throw error;
      const existing = Array.isArray(data?.extracurriculars) ? data.extracurriculars : [];
      await upsertCanonicalProfileRow('experiences_activities', profileId, { extracurriculars: [...existing, { name: activity.trim() }] });
      setMessage('Saved — we’ll use this activity when helping you find PIQ stories.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save activity.'); }
    finally { setSaving(false); }
  };
  return <section className="mx-auto mb-4 max-w-5xl rounded-lg border bg-card p-4"><h2 className="font-semibold">Find stronger PIQ stories</h2><p className="mt-1 text-sm text-muted-foreground">Add one activity now, or skip it and keep writing.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input value={activity} onChange={e => setActivity(e.target.value)} placeholder="An activity, responsibility, or project" /><Button size="sm" disabled={saving || !activity.trim()} onClick={save}>{saving ? 'Saving…' : 'Save activity'}</Button><Button size="sm" variant="ghost" onClick={() => setMessage('You can add activities later.')}>Not now</Button></div>{message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}</section>;
}
