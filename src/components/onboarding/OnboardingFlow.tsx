import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOnboardingForm } from '@/hooks/useOnboardingForm';
import type { ApplicationStage, OnboardingFormData } from '@/types/onboarding';

const stages: Array<{ value: ApplicationStage; title: string; description: string }> = [
  { value: 'exploring', title: 'Exploring colleges', description: 'Find options and learn what fits you.' },
  { value: 'mid_application', title: 'Working on applications', description: 'Organize deadlines, essays, and next steps.' },
  { value: 'almost_done', title: 'Almost ready to submit', description: 'Finish strong and keep every requirement on track.' },
];

interface OnboardingFlowProps { initialData: OnboardingFormData; initialStep: number; }

export const OnboardingFlow = ({ initialData }: OnboardingFlowProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData, completeOnboarding, isSaving } = useOnboardingForm(initialData);
  const [firstName, setFirstName] = useState(initialData.first_name ?? '');
  const [stage, setStage] = useState<ApplicationStage | null>(initialData.application_stage ?? null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!firstName.trim() || !stage) return;
    setError(null);
    const saved = await updateFormData({ first_name: firstName.trim(), application_stage: stage }, 1);
    if (!saved.success) { setError(saved.error ?? 'We could not save your onboarding. Please retry.'); return; }
    const completed = await completeOnboarding();
    if (!completed.success) { setError(completed.error ?? 'We could not finish onboarding. Please retry.'); return; }
    navigate('/dashboard', { replace: true });
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-2xl space-y-8">
        <header className="space-y-2 text-center">
          <p className="text-sm font-medium text-primary">Welcome to Uplift</p>
          <h1 className="text-3xl font-bold tracking-tight">Let’s make college applications feel manageable.</h1>
          <p className="text-muted-foreground">Two quick questions, then we’ll guide your next best step.</p>
        </header>
        <div className="space-y-3">
          <label htmlFor="first-name" className="text-sm font-medium">What should we call you?</label>
          <Input id="first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" />
        </div>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Where are you in the process?</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {stages.map((item) => (
              <button key={item.value} type="button" onClick={() => setStage(item.value)}
                className={`rounded-lg border p-4 text-left transition ${stage === item.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}>
                <span className="block font-medium">{item.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{item.description}</span>
              </button>
            ))}
          </div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button size="lg" className="w-full" onClick={submit} disabled={isSaving || !firstName.trim() || !stage}>
          {isSaving ? 'Saving…' : 'Start my plan'}
        </Button>
      </section>
    </main>
  );
};
