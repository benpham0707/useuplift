import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, ArrowLeft, BookOpen, Lightbulb, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface PersonalGrowthData {
  meaningfulExperiences: {
    significantChallenge: string;
    leadershipExample: string;
    academicExcitement: string;
    creativity: string;
    greatestTalent: string;
    communityImpact: string;
    uniqueQualities: string;
    educationalOpportunity: string;
  };
  additionalContext: {
    backgroundIdentity: string;
    academicCircumstances: string;
    educationalDisruptions: string;
    schoolCommunityContext: string;
    additionalInfo: string;
  };
}

interface Props {
  onComplete: () => void;
  onCancel: () => void;
  onProgressRefresh?: () => void;
}

const ESSAY_PROMPTS = [
  {
    key: 'significantChallenge',
    title: 'Overcoming Challenges',
    prompt: 'Describe a significant challenge you\'ve overcome and what you learned from it',
    wordLimit: 350,
    placeholder: 'Think about obstacles you\'ve faced - academic, personal, financial, or social. What did this experience teach you about yourself and how did it help you grow?'
  },
  {
    key: 'leadershipExample',
    title: 'Leadership & Influence',
    prompt: 'Share an example of your leadership experience or how you\'ve positively influenced others',
    wordLimit: 350,
    placeholder: 'Leadership doesn\'t always mean holding a title. Consider times when you took initiative, helped others, or made a positive difference in your community.'
  },
  {
    key: 'academicExcitement',
    title: 'Academic Passion',
    prompt: 'What academic subject or intellectual topic excites you most and why?',
    wordLimit: 350,
    placeholder: 'What subject makes you lose track of time? What questions do you love exploring? Why does this area of study fascinate you?'
  },
  {
    key: 'creativity',
    title: 'Creative Expression',
    prompt: 'How do you express your creativity?',
    wordLimit: 300,
    placeholder: 'Creativity can be expressed through art, music, writing, problem-solving, cooking, or any other medium. What\'s your creative outlet and what does it mean to you?'
  },
  {
    key: 'greatestTalent',
    title: 'Personal Talents',
    prompt: 'What would you consider your greatest talent or skill, and how have you developed it?',
    wordLimit: 300,
    placeholder: 'This could be academic, artistic, athletic, social, or any other skill. How did you discover it and what have you done to nurture it?'
  },
  {
    key: 'communityImpact',
    title: 'Community Contribution',
    prompt: 'What have you done to make your school or community a better place?',
    wordLimit: 350,
    placeholder: 'Consider both formal activities and informal ways you\'ve contributed. How have you helped others or worked to improve your environment?'
  },
  {
    key: 'uniqueQualities',
    title: 'What Makes You Unique',
    prompt: 'Beyond what\'s already in your application, what do you believe makes you unique?',
    wordLimit: 350,
    placeholder: 'Think about your perspective, experiences, interests, or qualities that set you apart. What would your friends say is special about you?'
  },
  {
    key: 'educationalOpportunity',
    title: 'Educational Growth',
    prompt: 'Describe an educational opportunity you\'ve taken advantage of or barrier you\'ve overcome',
    wordLimit: 350,
    placeholder: 'This could be a summer program, independent study, research project, or overcoming obstacles to your education. What did you learn?'
  }
];

const ADDITIONAL_CONTEXT_PROMPTS = [
  {
    key: 'backgroundIdentity',
    title: 'Background & Identity',
    prompt: 'Is there anything else about your background, identity, or experiences that you\'d like to share?',
    placeholder: 'Consider aspects of your cultural background, family history, personal identity, or life experiences that provide important context about who you are.'
  },
  {
    key: 'academicCircumstances',
    title: 'Academic Context',
    prompt: 'Have there been any circumstances that significantly affected your academic performance?',
    placeholder: 'Think about any challenges that may have impacted your grades, test scores, or academic opportunities - family situations, health issues, school changes, etc.'
  },
  {
    key: 'educationalDisruptions',
    title: 'Educational Disruptions',
    prompt: 'Have you experienced educational disruptions (school closures, natural disasters, etc.)?',
    placeholder: 'Consider any events that disrupted your normal schooling - pandemic impacts, natural disasters, family moves, school changes, etc.'
  },
  {
    key: 'schoolCommunityContext',
    title: 'School & Community Context',
    prompt: 'Are there any unique aspects of your high school or community that provide important context?',
    placeholder: 'Think about your school\'s resources, location, community characteristics, or other factors that help explain your educational experience.'
  },
  {
    key: 'additionalInfo',
    title: 'Additional Information',
    prompt: 'Is there anything else you want colleges to know that hasn\'t been covered elsewhere?',
    placeholder: 'This is your opportunity to share anything important that doesn\'t fit in other sections - future goals, special circumstances, or other relevant information.'
  }
];

const PersonalGrowthWizard: React.FC<Props> = ({ onComplete, onCancel, onProgressRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('experiences');
  
  const [data, setData] = useState<PersonalGrowthData>({
    meaningfulExperiences: {
      significantChallenge: '',
      leadershipExample: '',
      academicExcitement: '',
      creativity: '',
      greatestTalent: '',
      communityImpact: '',
      uniqueQualities: '',
      educationalOpportunity: ''
    },
    additionalContext: {
      backgroundIdentity: '',
      academicCircumstances: '',
      educationalDisruptions: '',
      schoolCommunityContext: '',
      additionalInfo: ''
    }
  });

  // Prefill from latest saved personal_growth
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!profile?.id) return;

        const { data: pg } = await supabase
          .from('personal_growth')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (!pg) return;

        setData((prev) => ({
          meaningfulExperiences: {
            significantChallenge: '',
            leadershipExample: '',
            academicExcitement: '',
            creativity: '',
            greatestTalent: '',
            communityImpact: '',
            uniqueQualities: '',
            educationalOpportunity: ''
          },
          additionalContext: {
            backgroundIdentity: '',
            academicCircumstances: '',
            educationalDisruptions: '',
            schoolCommunityContext: '',
            additionalInfo: ''
          }
        }));
      } catch (_) {
        // ignore prefill errors
      }
    })();
  }, []);

  // Progress: based on any content in each tab section
  const progress = useMemo(() => {
    const meValues = Object.values(data.meaningfulExperiences || {});
    const acValues = Object.values(data.additionalContext || {});
    const essaysComplete = meValues.some(v => (v || '').trim().length > 0);
    const contextComplete = acValues.some(v => (v || '').trim().length > 0);
    const completed = [essaysComplete, contextComplete].filter(Boolean).length;
    const percent = Math.round((completed / 2) * 100);
    return { percent, sectionComplete: { essays: essaysComplete, context: contextComplete } } as const;
  }, [data]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, completion_score')
        .eq('user_id', user.id)
        .single();
      if (!profile) throw new Error('Profile not found');

      // Upsert into personal_growth
      const pgPayload = {
        profile_id: profile.id,
        meaningful_experiences: data.meaningfulExperiences,
        additional_context: data.additionalContext,
      } as any;

      const { data: existingPG, error: pgFetchErr } = await supabase
        .from('personal_growth')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();
      if (pgFetchErr) throw pgFetchErr;

      if (existingPG?.id) {
        const { error: pgUpdateErr } = await supabase
          .from('personal_growth')
          .update(pgPayload)
          .eq('id', existingPG.id as string);
        if (pgUpdateErr) throw pgUpdateErr;
      } else {
        const { error: pgInsertErr } = await supabase
          .from('personal_growth')
          .insert(pgPayload);
        if (pgInsertErr) throw pgInsertErr;
      }

      // Create a concise narrative summary
      const meaningfulStories = Object.values(data.meaningfulExperiences)
        .filter(story => (story || '').trim().length > 0)
        .slice(0, 3)
        .join('. ');

      const newScore = Math.max(Number(profile.completion_score ?? 0), 1.0);
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          narrative_summary: meaningfulStories.substring(0, 1000),
          completion_score: newScore
        })
        .eq('id', profile.id);
      if (profileErr) throw profileErr;

      toast({
        title: "Personal growth stories saved!",
        description: "Your essays and personal reflections have been recorded.",
      });

      onComplete();
    } catch (error) {
      console.error('Error saving personal growth:', error);
      toast({
        title: "Error saving stories",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateMeaningfulExperience = (key: string, value: string) => {
    setData({
      ...data,
      meaningfulExperiences: {
        ...data.meaningfulExperiences,
        [key]: value
      }
    });
  };

  const updateAdditionalContext = (key: string, value: string) => {
    setData({
      ...data,
      additionalContext: {
        ...data.additionalContext,
        [key]: value
      }
    });
  };

  const getWordCount = (text: string): number => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Personal Growth & Stories</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This is your opportunity to share your unique story, experiences, and perspective. 
          These responses help colleges understand who you are beyond grades and test scores.
        </p>
        <div className="max-w-md mx-auto mt-3">
          <Progress value={progress.percent} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="experiences" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Meaningful Experiences
          </TabsTrigger>
          <TabsTrigger value="context" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Additional Context
          </TabsTrigger>
        </TabsList>

        <TabsContent value="experiences" className="space-y-6 mt-6">
          <div className="grid gap-6">
            {ESSAY_PROMPTS.map((prompt) => {
              const currentText = data.meaningfulExperiences[prompt.key as keyof typeof data.meaningfulExperiences];
              const wordCount = getWordCount(currentText);
              const isOverLimit = wordCount > prompt.wordLimit;

              return (
                <Card key={prompt.key} className="hover-lift">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{prompt.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{prompt.prompt}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={wordCount === 0 ? "secondary" : isOverLimit ? "destructive" : "default"}>
                          {wordCount}/{prompt.wordLimit} words
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Textarea
                        placeholder={prompt.placeholder}
                        value={currentText}
                        onChange={(e) => updateMeaningfulExperience(prompt.key, e.target.value)}
                        className="min-h-[120px] resize-none"
                      />
                      {isOverLimit && (
                        <p className="text-sm text-destructive">
                          Consider shortening your response to meet the word limit.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="context" className="space-y-6 mt-6">
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold">Additional Context & Circumstances</h3>
            <p className="text-sm text-muted-foreground">
              Use this section to provide important context about your background, circumstances, 
              or experiences that help colleges understand your story.
            </p>
          </div>

          <div className="grid gap-6">
            {ADDITIONAL_CONTEXT_PROMPTS.map((prompt) => {
              const currentText = data.additionalContext[prompt.key as keyof typeof data.additionalContext];
              const wordCount = getWordCount(currentText);

              return (
                <Card key={prompt.key} className="hover-lift">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{prompt.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{prompt.prompt}</p>
                      </div>
                      <Badge variant={wordCount === 0 ? "secondary" : "default"}>
                        {wordCount} words
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={prompt.placeholder}
                      value={currentText}
                      onChange={(e) => updateAdditionalContext(prompt.key, e.target.value)}
                      className="min-h-[100px] resize-none"
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Writing Tips */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Writing Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Be Authentic</h4>
              <p className="text-muted-foreground">
                Write in your own voice and share genuine experiences that matter to you.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Show, Don't Tell</h4>
              <p className="text-muted-foreground">
                Use specific examples and stories to illustrate your points rather than making general statements.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Focus on Growth</h4>
              <p className="text-muted-foreground">
                Emphasize what you learned, how you changed, or how experiences shaped your perspective.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Be Specific</h4>
              <p className="text-muted-foreground">
                Include concrete details, names, dates, and outcomes to make your stories more compelling.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>

        <div className="flex items-center gap-2">
          <Button 
            variant="secondary"
            onClick={async () => {
              setIsLoading(true);
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('id, completion_score')
                  .eq('user_id', user.id)
                  .single();
                if (!profile) throw new Error('Profile not found');

                const pgPayload = {
                  profile_id: profile.id,
                  meaningful_experiences: data.meaningfulExperiences,
                  additional_context: data.additionalContext,
                } as any;

                const { data: existingPG } = await supabase
                  .from('personal_growth')
                  .select('id')
                  .eq('profile_id', profile.id)
                  .maybeSingle();
                if (existingPG?.id) {
                  await supabase.from('personal_growth').update(pgPayload).eq('id', existingPG.id);
                } else {
                  await supabase.from('personal_growth').insert(pgPayload);
                }

                await supabase
                  .from('profiles')
                  .update({ completion_score: Math.max(Number(profile.completion_score ?? 0), 0.3) })
                  .eq('id', profile.id);

                toast({ title: 'Progress saved', description: 'You can come back anytime.' });
                onProgressRefresh?.();
              } catch (error) {
                toast({ title: 'Save failed', description: 'Try again later.', variant: 'destructive' });
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            Save & Quit
          </Button>

          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Complete Personal Growth'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PersonalGrowthWizard;