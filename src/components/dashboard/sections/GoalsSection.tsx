import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface GoalsSectionProps {
  profileId: string;
  onSaveComplete: () => void;
}

interface GoalsData {
  intended_major: string | null;
  career_interests: string[];
  highest_degree: string | null;
  college_environment: string[];
  applying_to_uc: string | null;
  using_common_app: string | null;
  start_date: string | null;
  geographic_preferences: string[];
  need_based_aid: string | null;
  merit_scholarships: string | null;
}

const HIGHEST_DEGREE_OPTIONS = [
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'phd', label: 'PhD' },
  { value: 'md', label: 'MD (Medical Doctor)' },
  { value: 'jd', label: 'JD (Law Degree)' },
  { value: 'other_professional', label: 'Other Professional Degree' },
  { value: 'undecided', label: 'Undecided' }
];

const COLLEGE_ENVIRONMENT_OPTIONS = [
  'Small classes',
  'Research opportunities',
  'Urban campus',
  'Suburban campus',
  'Rural campus',
  'Strong athletics',
  'Diverse student body',
  'Study abroad programs',
  'Strong career services',
  'Active campus life'
];

const START_DATE_OPTIONS = [
  { value: 'fall_2025', label: 'Fall 2025' },
  { value: 'spring_2026', label: 'Spring 2026' },
  { value: 'fall_2026', label: 'Fall 2026' },
  { value: 'gap_year', label: 'Taking a gap year' },
  { value: 'undecided', label: 'Undecided' }
];

const GEOGRAPHIC_REGIONS = [
  'West Coast',
  'East Coast',
  'Midwest',
  'South',
  'Southwest',
  'Mountain West',
  'International',
  'No preference'
];

export default function GoalsSection({ profileId, onSaveComplete }: GoalsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<GoalsData>({
    intended_major: '',
    career_interests: [],
    highest_degree: null,
    college_environment: [],
    applying_to_uc: null,
    using_common_app: null,
    start_date: null,
    geographic_preferences: [],
    need_based_aid: null,
    merit_scholarships: null
  });
  const [careerInput, setCareerInput] = useState('');

  useEffect(() => {
    loadData();
  }, [profileId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load existing goals_aspirations data
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals_aspirations')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (goalsError) throw goalsError;

      // Pre-seed career_interests from profiles.interest_areas if available
      if (!goalsData) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('interest_areas')
          .eq('id', profileId)
          .single();

        if (profileData?.interest_areas && Array.isArray(profileData.interest_areas)) {
          setFormData(prev => ({
            ...prev,
            career_interests: profileData.interest_areas
          }));
        }
      } else {
        setFormData({
          intended_major: goalsData.intended_major || '',
          career_interests: goalsData.career_interests || [],
          highest_degree: goalsData.highest_degree,
          college_environment: goalsData.college_environment || [],
          applying_to_uc: goalsData.applying_to_uc,
          using_common_app: goalsData.using_common_app,
          start_date: goalsData.start_date,
          geographic_preferences: goalsData.geographic_preferences || [],
          need_based_aid: goalsData.need_based_aid,
          merit_scholarships: goalsData.merit_scholarships
        });
      }
    } catch (error) {
      console.error('[GoalsSection] Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your goals data. Please try again.',
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
        .from('goals_aspirations')
        .upsert({
          profile_id: profileId,
          intended_major: formData.intended_major || null,
          career_interests: formData.career_interests,
          highest_degree: formData.highest_degree,
          college_environment: formData.college_environment,
          applying_to_uc: formData.applying_to_uc,
          using_common_app: formData.using_common_app,
          start_date: formData.start_date,
          geographic_preferences: formData.geographic_preferences,
          need_based_aid: formData.need_based_aid,
          merit_scholarships: formData.merit_scholarships,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'profile_id'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your goals and aspirations have been saved!'
      });

      onSaveComplete();
    } catch (error) {
      console.error('[GoalsSection] Error saving:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your goals. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEnvironment = (env: string) => {
    setFormData(prev => ({
      ...prev,
      college_environment: prev.college_environment.includes(env)
        ? prev.college_environment.filter(e => e !== env)
        : [...prev.college_environment, env]
    }));
  };

  const toggleGeographic = (region: string) => {
    setFormData(prev => ({
      ...prev,
      geographic_preferences: prev.geographic_preferences.includes(region)
        ? prev.geographic_preferences.filter(r => r !== region)
        : [...prev.geographic_preferences, region]
    }));
  };

  const addCareerInterest = () => {
    if (careerInput.trim() && !formData.career_interests.includes(careerInput.trim())) {
      setFormData(prev => ({
        ...prev,
        career_interests: [...prev.career_interests, careerInput.trim()]
      }));
      setCareerInput('');
    }
  };

  const removeCareerInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      career_interests: prev.career_interests.filter(i => i !== interest)
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
      {/* Academic Direction */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Academic Direction</h3>

        <div className="space-y-2">
          <Label htmlFor="intended_major">Intended Major</Label>
          <Input
            id="intended_major"
            value={formData.intended_major || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, intended_major: e.target.value }))}
            placeholder="e.g., Computer Science, Biology, Undecided"
          />
          <p className="text-xs text-muted-foreground">
            It's okay if you're not sure yet. You can always update this later.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="highest_degree">Highest Degree You Plan to Pursue</Label>
          <Select
            value={formData.highest_degree || ''}
            onValueChange={(value) => setFormData(prev => ({ ...prev, highest_degree: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select highest degree" />
            </SelectTrigger>
            <SelectContent>
              {HIGHEST_DEGREE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Career Interests */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Career Interests</h3>

        <div className="space-y-2">
          <Label htmlFor="career_input">Add Career Interests</Label>
          <div className="flex gap-2">
            <Input
              id="career_input"
              value={careerInput}
              onChange={(e) => setCareerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCareerInterest();
                }
              }}
              placeholder="e.g., Software Engineering, Medicine, Teaching"
            />
            <Button type="button" onClick={addCareerInterest}>Add</Button>
          </div>

          {formData.career_interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.career_interests.map(interest => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeCareerInterest(interest)}
                    className="hover:text-primary/80"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* College Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">College Preferences</h3>

        <div className="space-y-2">
          <Label>What kind of college environment are you looking for?</Label>
          <div className="grid grid-cols-2 gap-2">
            {COLLEGE_ENVIRONMENT_OPTIONS.map(env => (
              <button
                key={env}
                type="button"
                onClick={() => toggleEnvironment(env)}
                className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                  formData.college_environment.includes(env)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-input'
                }`}
              >
                {env}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Applying to UC system?</Label>
            <Select
              value={formData.applying_to_uc || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, applying_to_uc: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="maybe">Maybe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Using Common App?</Label>
            <Select
              value={formData.using_common_app || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, using_common_app: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="maybe">Maybe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>When do you plan to start college?</Label>
          <Select
            value={formData.start_date || ''}
            onValueChange={(value) => setFormData(prev => ({ ...prev, start_date: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select start date" />
            </SelectTrigger>
            <SelectContent>
              {START_DATE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location & Financial */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Location & Financial</h3>

        <div className="space-y-2">
          <Label>Where would you like to go to college?</Label>
          <div className="grid grid-cols-2 gap-2">
            {GEOGRAPHIC_REGIONS.map(region => (
              <button
                key={region}
                type="button"
                onClick={() => toggleGeographic(region)}
                className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                  formData.geographic_preferences.includes(region)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-input'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Need-based financial aid?</Label>
            <Select
              value={formData.need_based_aid || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, need_based_aid: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="unsure">Unsure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Interested in merit scholarships?</Label>
            <Select
              value={formData.merit_scholarships || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, merit_scholarships: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="unsure">Unsure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

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
