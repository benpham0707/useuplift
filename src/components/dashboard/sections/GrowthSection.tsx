import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SectionFormProps {
  profileId: string;
  onSaveComplete: () => void;
}

interface MeaningfulExperiences {
  challenge_overcome?: string;
  world_changing_experience?: string;
  proudest_non_academic?: string;
}

interface AdditionalContext {
  colleges_should_know?: string;
  academic_circumstances?: string;
}

interface PersonalGrowthData {
  meaningful_experiences: MeaningfulExperiences;
  additional_context: AdditionalContext;
}

export default function GrowthSection({ profileId, onSaveComplete }: SectionFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [meaningfulExperiences, setMeaningfulExperiences] = useState<MeaningfulExperiences>({
    challenge_overcome: '',
    world_changing_experience: '',
    proudest_non_academic: ''
  });

  const [additionalContext, setAdditionalContext] = useState<AdditionalContext>({
    colleges_should_know: '',
    academic_circumstances: ''
  });

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('personal_growth')
          .select('*')
          .eq('profile_id', profileId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Load meaningful experiences
          if (data.meaningful_experiences && typeof data.meaningful_experiences === 'object') {
            const experiences = data.meaningful_experiences as MeaningfulExperiences;
            setMeaningfulExperiences({
              challenge_overcome: experiences.challenge_overcome || '',
              world_changing_experience: experiences.world_changing_experience || '',
              proudest_non_academic: experiences.proudest_non_academic || ''
            });
          }

          // Load additional context
          if (data.additional_context && typeof data.additional_context === 'object') {
            const context = data.additional_context as AdditionalContext;
            setAdditionalContext({
              colleges_should_know: context.colleges_should_know || '',
              academic_circumstances: context.academic_circumstances || ''
            });
          }
        }
      } catch (err) {
        console.error('[GrowthSection] Error loading data:', err);
        toast({
          title: 'Error',
          description: 'Failed to load personal growth data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [profileId, toast]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const growthData: PersonalGrowthData = {
        meaningful_experiences: meaningfulExperiences,
        additional_context: additionalContext
      };

      const { error } = await supabase
        .from('personal_growth')
        .upsert({
          profile_id: profileId,
          ...growthData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'profile_id'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Personal growth reflections saved successfully'
      });

      onSaveComplete();
    } catch (err) {
      console.error('[GrowthSection] Error saving:', err);
      toast({
        title: 'Error',
        description: 'Failed to save personal growth data',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        These responses become the raw material for your personal statements and essays. Think of it as brainstorming — nothing here needs to be polished.
      </div>

      {/* Meaningful Experiences */}
      <Card className="p-4 space-y-6">
        <div>
          <h3 className="font-medium mb-2">Meaningful Experiences</h3>
          <p className="text-sm text-muted-foreground">
            A paragraph or two is perfect. You can always come back and add more.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="challenge-overcome">
              Describe a challenge you've overcome and what you learned from it
            </Label>
            <Textarea
              id="challenge-overcome"
              value={meaningfulExperiences.challenge_overcome}
              onChange={(e) =>
                setMeaningfulExperiences({
                  ...meaningfulExperiences,
                  challenge_overcome: e.target.value
                })
              }
              placeholder="Tell us about a difficult situation you faced and how you grew from it..."
              rows={6}
              className="resize-y"
            />
            {meaningfulExperiences.challenge_overcome && (
              <div className="text-xs text-muted-foreground text-right">
                {meaningfulExperiences.challenge_overcome.split(/\s+/).filter(Boolean).length} words
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="world-changing">
              What's an experience that changed how you see the world?
            </Label>
            <Textarea
              id="world-changing"
              value={meaningfulExperiences.world_changing_experience}
              onChange={(e) =>
                setMeaningfulExperiences({
                  ...meaningfulExperiences,
                  world_changing_experience: e.target.value
                })
              }
              placeholder="Share a moment, conversation, or realization that shifted your perspective..."
              rows={6}
              className="resize-y"
            />
            {meaningfulExperiences.world_changing_experience && (
              <div className="text-xs text-muted-foreground text-right">
                {meaningfulExperiences.world_changing_experience.split(/\s+/).filter(Boolean).length} words
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="proudest">
              What are you most proud of that isn't on your transcript?
            </Label>
            <Textarea
              id="proudest"
              value={meaningfulExperiences.proudest_non_academic}
              onChange={(e) =>
                setMeaningfulExperiences({
                  ...meaningfulExperiences,
                  proudest_non_academic: e.target.value
                })
              }
              placeholder="This could be a personal achievement, something you created, or how you've helped others..."
              rows={6}
              className="resize-y"
            />
            {meaningfulExperiences.proudest_non_academic && (
              <div className="text-xs text-muted-foreground text-right">
                {meaningfulExperiences.proudest_non_academic.split(/\s+/).filter(Boolean).length} words
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Additional Context */}
      <Card className="p-4 space-y-6">
        <div>
          <h3 className="font-medium mb-2">Additional Context</h3>
          <p className="text-sm text-muted-foreground">
            Optional information that provides important context for your application.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="colleges-should-know">
              Is there anything else colleges should know about you?
            </Label>
            <Textarea
              id="colleges-should-know"
              value={additionalContext.colleges_should_know}
              onChange={(e) =>
                setAdditionalContext({
                  ...additionalContext,
                  colleges_should_know: e.target.value
                })
              }
              placeholder="Unique circumstances, special interests, or anything that helps admissions understand who you are..."
              rows={6}
              className="resize-y"
            />
            {additionalContext.colleges_should_know && (
              <div className="text-xs text-muted-foreground text-right">
                {additionalContext.colleges_should_know.split(/\s+/).filter(Boolean).length} words
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="academic-circumstances">
              Are there circumstances that affected your academic performance?
            </Label>
            <Textarea
              id="academic-circumstances"
              value={additionalContext.academic_circumstances}
              onChange={(e) =>
                setAdditionalContext({
                  ...additionalContext,
                  academic_circumstances: e.target.value
                })
              }
              placeholder="If there were challenges (health, family, school changes, etc.) that impacted your grades or coursework, you can explain them here..."
              rows={6}
              className="resize-y"
            />
            {additionalContext.academic_circumstances && (
              <div className="text-xs text-muted-foreground text-right">
                {additionalContext.academic_circumstances.split(/\s+/).filter(Boolean).length} words
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save & Close'
          )}
        </Button>
      </div>
    </div>
  );
}
