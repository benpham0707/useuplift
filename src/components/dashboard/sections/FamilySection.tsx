import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface FamilySectionProps {
  profileId: string;
  onSaveComplete: () => void;
}

interface FamilyData {
  responsibilities: string[];
  hours_per_week: number;
  other_responsibilities: string;
  challenging_circumstances: boolean;
  circumstances: string[];
  other_circumstances: string;
}

const RESPONSIBILITY_OPTIONS = [
  'Childcare (siblings or relatives)',
  'Elder care (grandparents or relatives)',
  'Cooking and meal preparation',
  'Household cleaning and maintenance',
  'Transportation (driving family members)',
  'Translation/interpretation for family',
  'Financial contribution (part-time work)',
  'Managing family affairs/paperwork'
];

const CIRCUMSTANCE_OPTIONS = [
  'Serious illness in family',
  'Financial hardship',
  'Housing instability',
  'Parent/guardian deployment (military)',
  'Parent/guardian incarceration',
  'Family separation or displacement',
  'Caring for family member with disability',
  'Food insecurity'
];

export default function FamilySection({ profileId, onSaveComplete }: FamilySectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FamilyData>({
    responsibilities: [],
    hours_per_week: 0,
    other_responsibilities: '',
    challenging_circumstances: false,
    circumstances: [],
    other_circumstances: ''
  });

  useEffect(() => {
    loadData();
  }, [profileId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('family_responsibilities')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
          hours_per_week: data.hours_per_week || 0,
          other_responsibilities: data.other_responsibilities || '',
          challenging_circumstances: data.challenging_circumstances || false,
          circumstances: Array.isArray(data.circumstances) ? data.circumstances : [],
          other_circumstances: data.other_circumstances || ''
        });
      }
    } catch (error) {
      console.error('[FamilySection] Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load family context data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate hours_per_week is within constraint (0-168)
      const validatedHours = Math.max(0, Math.min(168, formData.hours_per_week));

      const { error } = await supabase
        .from('family_responsibilities')
        .upsert({
          profile_id: profileId,
          responsibilities: formData.responsibilities,
          hours_per_week: validatedHours,
          other_responsibilities: formData.other_responsibilities || '',
          challenging_circumstances: formData.challenging_circumstances,
          circumstances: formData.challenging_circumstances ? formData.circumstances : [],
          other_circumstances: formData.challenging_circumstances ? formData.other_circumstances : '',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'profile_id'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your family context has been saved!'
      });

      onSaveComplete();
    } catch (error) {
      console.error('[FamilySection] Error saving:', error);
      toast({
        title: 'Error',
        description: 'Failed to save family context. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleResponsibility = (responsibility: string) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.includes(responsibility)
        ? prev.responsibilities.filter(r => r !== responsibility)
        : [...prev.responsibilities, responsibility]
    }));
  };

  const toggleCircumstance = (circumstance: string) => {
    setFormData(prev => ({
      ...prev,
      circumstances: prev.circumstances.includes(circumstance)
        ? prev.circumstances.filter(c => c !== circumstance)
        : [...prev.circumstances, circumstance]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Many students juggle responsibilities beyond school. Telling us about yours helps us give you credit for
          everything you manage and adjust our recommendations to your real schedule.
        </p>
      </div>

      {/* Family Responsibilities */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Family Responsibilities</h3>
          <p className="text-sm text-muted-foreground">Select all that apply</p>
        </div>

        <div className="space-y-2">
          {RESPONSIBILITY_OPTIONS.map(responsibility => (
            <label key={responsibility} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-muted/50">
              <input
                type="checkbox"
                checked={formData.responsibilities.includes(responsibility)}
                onChange={() => toggleResponsibility(responsibility)}
                className="rounded border-input"
              />
              <span className="text-sm">{responsibility}</span>
            </label>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="other_responsibilities">Other Responsibilities</Label>
          <Textarea
            id="other_responsibilities"
            value={formData.other_responsibilities}
            onChange={(e) => setFormData(prev => ({ ...prev, other_responsibilities: e.target.value }))}
            placeholder="Describe any other family responsibilities not listed above..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours_per_week">
            Hours per week spent on family responsibilities
          </Label>
          <Input
            id="hours_per_week"
            type="number"
            min="0"
            max="168"
            value={formData.hours_per_week}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              hours_per_week: parseInt(e.target.value) || 0
            }))}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            An estimate is fine. This helps us understand your time commitments.
          </p>
        </div>
      </div>

      {/* Challenging Circumstances */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            id="challenging_circumstances"
            type="checkbox"
            checked={formData.challenging_circumstances}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              challenging_circumstances: e.target.checked,
              circumstances: e.target.checked ? prev.circumstances : [],
              other_circumstances: e.target.checked ? prev.other_circumstances : ''
            }))}
            className="rounded border-input"
          />
          <Label htmlFor="challenging_circumstances" className="cursor-pointer">
            I have experienced challenging family circumstances
          </Label>
        </div>

        {formData.challenging_circumstances && (
          <div className="space-y-4 pl-6 border-l-2 border-primary/20">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Select all that apply. This information is confidential and helps admissions understand your context.
              </p>

              <div className="space-y-2">
                {CIRCUMSTANCE_OPTIONS.map(circumstance => (
                  <label key={circumstance} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={formData.circumstances.includes(circumstance)}
                      onChange={() => toggleCircumstance(circumstance)}
                      className="rounded border-input"
                    />
                    <span className="text-sm">{circumstance}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="other_circumstances">Additional Details (Optional)</Label>
              <Textarea
                id="other_circumstances"
                value={formData.other_circumstances}
                onChange={(e) => setFormData(prev => ({ ...prev, other_circumstances: e.target.value }))}
                placeholder="You can provide more context here if you'd like. This is completely optional."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Only share what you're comfortable with. This stays confidential and is only used to provide you with appropriate resources and support.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* No Responsibilities Note */}
      {formData.responsibilities.length === 0 && !formData.challenging_circumstances && (
        <div className="bg-muted/30 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Nothing to add? No problem. Hit <strong>Save & Close</strong> below.
          </p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save & Close
        </Button>
      </div>
    </div>
  );
}
