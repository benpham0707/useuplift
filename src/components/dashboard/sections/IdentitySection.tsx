import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface IdentitySectionProps {
  profileId: string;
  onSaveComplete: () => void;
}

interface IdentityData {
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  date_of_birth: string | null;
  pronouns: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  secondary_phone: string | null;
  gender_identity: string | null;
  hispanic_latino: string | null;
  hispanic_background: string | null;
  race_ethnicity: string[];
  citizenship_status: string | null;
  primary_language: string | null;
  other_languages: Record<string, boolean> | null;
  living_situation: string | null;
  household_size: string | null;
  household_income: string | null;
  first_gen: boolean | null;
  parent_guardians: Record<string, unknown> | null;
  siblings: Record<string, unknown> | null;
}

const PRONOUN_OPTIONS = [
  'he/him',
  'she/her',
  'they/them',
  'he/they',
  'she/they',
  'prefer not to say',
  'other'
];

const RACE_ETHNICITY_OPTIONS = [
  'American Indian or Alaska Native',
  'Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Native Hawaiian or Other Pacific Islander',
  'White',
  'Two or more races',
  'Prefer not to say'
];

const HOUSEHOLD_SIZE_OPTIONS = [
  '1-2',
  '3-4',
  '5-6',
  '7+'
];

const HOUSEHOLD_INCOME_OPTIONS = [
  'Under $25,000',
  '$25,000 - $50,000',
  '$50,000 - $75,000',
  '$75,000 - $100,000',
  '$100,000 - $150,000',
  'Over $150,000',
  'Prefer not to say'
];

export default function IdentitySection({ profileId, onSaveComplete }: IdentitySectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<IdentityData>({
    first_name: '',
    last_name: '',
    preferred_name: null,
    date_of_birth: null,
    pronouns: null,
    primary_email: null,
    primary_phone: null,
    secondary_phone: null,
    gender_identity: null,
    hispanic_latino: null,
    hispanic_background: null,
    race_ethnicity: [],
    citizenship_status: null,
    primary_language: null,
    other_languages: null,
    living_situation: null,
    household_size: null,
    household_income: null,
    first_gen: null,
    parent_guardians: null,
    siblings: null
  });

  useEffect(() => {
    loadData();
  }, [profileId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load existing personal_information data
      const { data: personalInfo, error: personalError } = await supabase
        .from('personal_information')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (personalError) throw personalError;

      // Pre-fill first_name from profiles if personal_information doesn't exist
      if (!personalInfo) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', profileId)
          .single();

        if (profileData?.first_name) {
          setFormData(prev => ({
            ...prev,
            first_name: profileData.first_name
          }));
        }
      } else {
        setFormData({
          first_name: personalInfo.first_name || '',
          last_name: personalInfo.last_name || '',
          preferred_name: personalInfo.preferred_name,
          date_of_birth: personalInfo.date_of_birth,
          pronouns: personalInfo.pronouns,
          primary_email: personalInfo.primary_email,
          primary_phone: personalInfo.primary_phone,
          secondary_phone: personalInfo.secondary_phone,
          gender_identity: personalInfo.gender_identity,
          hispanic_latino: personalInfo.hispanic_latino,
          hispanic_background: personalInfo.hispanic_background,
          race_ethnicity: personalInfo.race_ethnicity || [],
          citizenship_status: personalInfo.citizenship_status,
          primary_language: personalInfo.primary_language,
          other_languages: personalInfo.other_languages,
          living_situation: personalInfo.living_situation,
          household_size: personalInfo.household_size,
          household_income: personalInfo.household_income,
          first_gen: personalInfo.first_gen,
          parent_guardians: personalInfo.parent_guardians,
          siblings: personalInfo.siblings
        });
      }

      // Get primary email from auth if not set
      if (!personalInfo?.primary_email && user?.primaryEmailAddress?.emailAddress) {
        setFormData(prev => ({
          ...prev,
          primary_email: user.primaryEmailAddress.emailAddress
        }));
      }
    } catch (error) {
      console.error('[IdentitySection] Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your personal information. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('personal_information')
        .upsert({
          profile_id: profileId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          preferred_name: formData.preferred_name,
          date_of_birth: formData.date_of_birth,
          pronouns: formData.pronouns,
          primary_email: formData.primary_email,
          primary_phone: formData.primary_phone,
          secondary_phone: formData.secondary_phone,
          gender_identity: formData.gender_identity,
          hispanic_latino: formData.hispanic_latino,
          hispanic_background: formData.hispanic_background,
          race_ethnicity: formData.race_ethnicity,
          citizenship_status: formData.citizenship_status,
          primary_language: formData.primary_language,
          other_languages: formData.other_languages,
          living_situation: formData.living_situation,
          household_size: formData.household_size,
          household_income: formData.household_income,
          first_gen: formData.first_gen,
          parent_guardians: formData.parent_guardians,
          siblings: formData.siblings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'profile_id'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your personal information has been saved!'
      });

      onSaveComplete();
    } catch (error) {
      console.error('[IdentitySection] Error saving:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your information. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRaceEthnicity = (option: string) => {
    setFormData(prev => ({
      ...prev,
      race_ethnicity: prev.race_ethnicity.includes(option)
        ? prev.race_ethnicity.filter(r => r !== option)
        : [...prev.race_ethnicity, option]
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
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              placeholder="First name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              placeholder="Last name"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferred_name">Preferred Name (optional)</Label>
          <Input
            id="preferred_name"
            value={formData.preferred_name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, preferred_name: e.target.value || null }))}
            placeholder="If different from first name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value || null }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Pronouns</Label>
            <Select
              value={formData.pronouns || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, pronouns: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pronouns" />
              </SelectTrigger>
              <SelectContent>
                {PRONOUN_OPTIONS.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>

        <div className="space-y-2">
          <Label htmlFor="primary_email">Primary Email</Label>
          <Input
            id="primary_email"
            type="email"
            value={formData.primary_email || ''}
            readOnly
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">This is your account email and cannot be changed here.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary_phone">Primary Phone</Label>
            <Input
              id="primary_phone"
              type="tel"
              value={formData.primary_phone || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, primary_phone: e.target.value || null }))}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_phone">Secondary Phone (optional)</Label>
            <Input
              id="secondary_phone"
              type="tel"
              value={formData.secondary_phone || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, secondary_phone: e.target.value || null }))}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Background (Optional) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Background (Optional)</h3>
          <p className="text-sm text-muted-foreground">
            This helps us find scholarships and programs designed for students like you. Everything is optional.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender_identity">Gender Identity</Label>
          <Input
            id="gender_identity"
            value={formData.gender_identity || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, gender_identity: e.target.value || null }))}
            placeholder="Optional"
          />
        </div>

        <div className="space-y-2">
          <Label>Are you Hispanic or Latino?</Label>
          <Select
            value={formData.hispanic_latino || ''}
            onValueChange={(value) => setFormData(prev => ({ ...prev, hispanic_latino: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.hispanic_latino === 'yes' && (
          <div className="space-y-2">
            <Label htmlFor="hispanic_background">Hispanic Background</Label>
            <Input
              id="hispanic_background"
              value={formData.hispanic_background || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, hispanic_background: e.target.value || null }))}
              placeholder="e.g., Mexican, Puerto Rican, Cuban"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Race/Ethnicity (select all that apply)</Label>
          <div className="space-y-2">
            {RACE_ETHNICITY_OPTIONS.map(option => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.race_ethnicity.includes(option)}
                  onChange={() => toggleRaceEthnicity(option)}
                  className="rounded border-input"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="citizenship_status">Citizenship Status</Label>
            <Input
              id="citizenship_status"
              value={formData.citizenship_status || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, citizenship_status: e.target.value || null }))}
              placeholder="e.g., US Citizen, Permanent Resident"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_language">Primary Language</Label>
            <Input
              id="primary_language"
              value={formData.primary_language || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, primary_language: e.target.value || null }))}
              placeholder="e.g., English, Spanish"
            />
          </div>
        </div>
      </div>

      {/* Family Context Brief */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Family Context (Brief)</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="living_situation">Living Situation</Label>
            <Input
              id="living_situation"
              value={formData.living_situation || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, living_situation: e.target.value || null }))}
              placeholder="e.g., With both parents, Single parent"
            />
          </div>

          <div className="space-y-2">
            <Label>Household Size</Label>
            <Select
              value={formData.household_size || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, household_size: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {HOUSEHOLD_SIZE_OPTIONS.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Household Income Range</Label>
          <Select
            value={formData.household_income || ''}
            onValueChange={(value) => setFormData(prev => ({ ...prev, household_income: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {HOUSEHOLD_INCOME_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Used only for financial aid program matching. We never share this.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Are you a first-generation college student?</Label>
          <Select
            value={formData.first_gen === null ? '' : formData.first_gen ? 'yes' : 'no'}
            onValueChange={(value) => setFormData(prev => ({
              ...prev,
              first_gen: value === 'yes' ? true : value === 'no' ? false : null
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Neither parent/guardian has a 4-year college degree
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isSaving || !formData.first_name || !formData.last_name}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save & Close
        </Button>
      </div>
    </div>
  );
}
