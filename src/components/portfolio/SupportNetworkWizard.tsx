import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowRight, ArrowLeft, Users2, Plus, Trash2, Paperclip, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface SupportNetworkData {
  // Educational Support
  counselor: {
    name: string;
    email: string;
  };
  teachers: Array<{
    name: string;
    subject: string;
    relationship: string;
  }>;
  communitySupport: boolean;
  communityOrganizations: Array<{
    name: string;
    advisor: string;
    assistanceType: string;
  }>;
  
  // Documentation & Portfolio
  hasPortfolioItems: boolean;
  portfolioItems: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    category: string;
    attachedFile?: File;
  }>;
  wantsToUploadDocuments: boolean;
  documents: Array<{
    type: string;
    description: string;
  }>;
}

interface Props {
  onComplete: () => void;
  onCancel: () => void;
  onProgressRefresh?: () => void;
}

const STEPS = [
  { id: 1, title: 'Educational Support', description: 'Counselors, teachers, and mentors' },
  { id: 2, title: 'Documentation & Portfolio', description: 'Supporting materials and uploads' }
];

const SupportNetworkWizard: React.FC<Props> = ({ onComplete, onCancel, onProgressRefresh }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [data, setData] = useState<SupportNetworkData>({
    counselor: {
      name: '',
      email: ''
    },
    teachers: [],
    communitySupport: false,
    communityOrganizations: [],
    hasPortfolioItems: false,
    portfolioItems: [],
    wantsToUploadDocuments: false,
    documents: []
  });

  // Prefill from latest saved support_network
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

        const { data: sn } = await supabase
          .from('support_network')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (!sn) return;

        setData((prev) => ({
          ...prev,
          counselor: { name: '', email: '' },
          teachers: [],
          communitySupport: false,
          communityOrganizations: [],
          hasPortfolioItems: false,
          portfolioItems: [],
          wantsToUploadDocuments: false,
          documents: []
        }));
      } catch (_) {
        // ignore prefill errors
      }
    })();
  }, []);

  // Progress across two sections
  const progress = useMemo(() => {
    const educationalSupportComplete =
      (data.counselor.name?.trim().length ?? 0) > 0 ||
      (data.counselor.email?.trim().length ?? 0) > 0 ||
      (Array.isArray(data.teachers) && data.teachers.length > 0) ||
      (data.communitySupport && Array.isArray(data.communityOrganizations) && data.communityOrganizations.length > 0);

    const docsPortfolioComplete =
      (data.hasPortfolioItems && Array.isArray(data.portfolioItems) && data.portfolioItems.length > 0) ||
      (data.wantsToUploadDocuments && Array.isArray(data.documents) && data.documents.length > 0);

    const completed = [educationalSupportComplete, docsPortfolioComplete].filter(Boolean).length;
    const percent = Math.round((completed / 2) * 100);

    return {
      percent,
      sectionComplete: {
        educational: educationalSupportComplete,
        docs: docsPortfolioComplete,
      },
    } as const;
  }, [data]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

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

      // Prepare payload (strip File objects)
      const portfolioItems = (data.hasPortfolioItems ? data.portfolioItems : []).map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { attachedFile, ...rest } = item as any;
        return rest;
      });

      const snPayload = {
        profile_id: profile.id,
        counselor: data.counselor || { name: '', email: '' },
        teachers: data.teachers || [],
        has_community_support: Boolean(data.communitySupport),
        community_organizations: data.communitySupport ? (data.communityOrganizations || []) : [],
        has_portfolio_items: Boolean(data.hasPortfolioItems),
        portfolio_items: portfolioItems,
        wants_to_upload_documents: Boolean(data.wantsToUploadDocuments),
        documents: data.wantsToUploadDocuments ? (data.documents || []) : [],
      } as any;

      const { data: existingSN, error: snFetchErr } = await supabase
        .from('support_network')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();
      if (snFetchErr) throw snFetchErr;

      if (existingSN?.id) {
        const { error: snUpdateErr } = await supabase
          .from('support_network')
          .update(snPayload)
          .eq('id', existingSN.id as string);
        if (snUpdateErr) throw snUpdateErr;
      } else {
        const { error: snInsertErr } = await supabase
          .from('support_network')
          .insert(snPayload);
        if (snInsertErr) throw snInsertErr;
      }

      const newScore = Math.max(Number(profile.completion_score ?? 0), 0.8);
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ completion_score: newScore })
        .eq('id', profile.id);
      if (profileErr) throw profileErr;

      toast({
        title: "Support network information saved!",
        description: "Your support network and resources have been recorded.",
      });

      onComplete();
    } catch (error) {
      console.error('Error saving support network:', error);
      toast({
        title: "Error saving information",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <EducationalSupportStep data={data} setData={setData} />;
      case 2:
        return <DocumentationPortfolioStep data={data} setData={setData} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-[95vh] flex flex-col">
      {/* Header */}
      <div className="text-center flex-shrink-0 px-6 pt-4 pb-2">
        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-2">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-2 ${
                currentStep === step.id ? 'text-primary' : 
                ((step.id === 1 && progress.sectionComplete.educational) || (step.id === 2 && progress.sectionComplete.docs)) ? 'text-green-600' : 'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step.id ? 'bg-primary text-primary-foreground' :
                  ((step.id === 1 && progress.sectionComplete.educational) || (step.id === 2 && progress.sectionComplete.docs)) ? 'bg-green-600 text-white' : 'bg-muted'
                }`}>
                  {step.id}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${
                  ((step.id === 1 && progress.sectionComplete.educational) || (step.id === 2 && progress.sectionComplete.docs)) ? 'bg-green-600' : 'bg-muted'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-3 max-w-md mx-auto">
          <Progress value={progress.percent} className="h-2" />
        </div>
      </div>

      {/* Step Content */}
      <Card className="flex-1 flex flex-col mx-6 min-h-0">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" />
            {STEPS[currentStep - 1]?.title}
          </CardTitle>
          <p className="text-muted-foreground">{STEPS[currentStep - 1]?.description}</p>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto min-h-0 pb-4">
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between p-6 flex-shrink-0">
        <Button 
          variant="outline" 
          onClick={currentStep === 1 ? onCancel : handlePrevious}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
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

                const portfolioItems = (data.hasPortfolioItems ? data.portfolioItems : []).map((item) => {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { attachedFile, ...rest } = item as any;
                  return rest;
                });

                const snPayload = {
                  profile_id: profile.id,
                  counselor: data.counselor || { name: '', email: '' },
                  teachers: data.teachers || [],
                  has_community_support: Boolean(data.communitySupport),
                  community_organizations: data.communitySupport ? (data.communityOrganizations || []) : [],
                  has_portfolio_items: Boolean(data.hasPortfolioItems),
                  portfolio_items: portfolioItems,
                  wants_to_upload_documents: Boolean(data.wantsToUploadDocuments),
                  documents: data.wantsToUploadDocuments ? (data.documents || []) : [],
                } as any;

                const { data: existingSN } = await supabase
                  .from('support_network')
                  .select('id')
                  .eq('profile_id', profile.id)
                  .maybeSingle();
                if (existingSN?.id) {
                  await supabase.from('support_network').update(snPayload).eq('id', existingSN.id);
                } else {
                  await supabase.from('support_network').insert(snPayload);
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

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext}>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Complete'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const EducationalSupportStep: React.FC<{
  data: SupportNetworkData;
  setData: (data: SupportNetworkData) => void;
}> = ({ data, setData }) => {
  
  const addTeacher = () => {
    setData({
      ...data,
      teachers: [...data.teachers, { name: '', subject: '', relationship: '' }]
    });
  };

  const updateTeacher = (index: number, field: string, value: string) => {
    const newTeachers = [...data.teachers];
    newTeachers[index] = { ...newTeachers[index], [field]: value };
    setData({ ...data, teachers: newTeachers });
  };

  const removeTeacher = (index: number) => {
    const newTeachers = data.teachers.filter((_, i) => i !== index);
    setData({ ...data, teachers: newTeachers });
  };

  const addCommunityOrg = () => {
    setData({
      ...data,
      communityOrganizations: [...data.communityOrganizations, { name: '', advisor: '', assistanceType: '' }]
    });
  };

  const updateCommunityOrg = (index: number, field: string, value: string) => {
    const newOrgs = [...data.communityOrganizations];
    newOrgs[index] = { ...newOrgs[index], [field]: value };
    setData({ ...data, communityOrganizations: newOrgs });
  };

  const removeCommunityOrg = (index: number) => {
    const newOrgs = data.communityOrganizations.filter((_, i) => i !== index);
    setData({ ...data, communityOrganizations: newOrgs });
  };

  return (
    <div className="space-y-6">
      {/* School Counselor */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">School Counselor Information</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="counselor-name">Counselor Name (optional)</Label>
            <Input
              id="counselor-name"
              value={data.counselor.name}
              onChange={(e) => setData({
                ...data,
                counselor: { ...data.counselor, name: e.target.value }
              })}
              placeholder="Enter counselor's name"
            />
          </div>
          <div>
            <Label htmlFor="counselor-email">Counselor Email (optional)</Label>
            <Input
              id="counselor-email"
              type="email"
              value={data.counselor.email}
              onChange={(e) => setData({
                ...data,
                counselor: { ...data.counselor, email: e.target.value }
              })}
              placeholder="counselor@school.edu"
            />
          </div>
        </div>
      </div>

      {/* Teachers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">Teachers for Recommendations</h4>
          <Button type="button" variant="outline" size="sm" onClick={addTeacher}>
            <Plus className="h-4 w-4 mr-2" />
            Add Teacher
          </Button>
        </div>
        
        {data.teachers.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Add teachers who might write recommendation letters for you.
          </p>
        )}

        {data.teachers.map((teacher, index) => (
          <Card key={index} className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`teacher-name-${index}`}>Teacher Name</Label>
                <Input
                  id={`teacher-name-${index}`}
                  value={teacher.name}
                  onChange={(e) => updateTeacher(index, 'name', e.target.value)}
                  placeholder="Ms. Smith"
                />
              </div>
              <div>
                <Label htmlFor={`teacher-subject-${index}`}>Subject/Course</Label>
                <Input
                  id={`teacher-subject-${index}`}
                  value={teacher.subject}
                  onChange={(e) => updateTeacher(index, 'subject', e.target.value)}
                  placeholder="AP Biology"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor={`teacher-relationship-${index}`}>Relationship</Label>
                  <Select value={teacher.relationship} onValueChange={(value) => updateTeacher(index, 'relationship', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current_teacher">Current Teacher</SelectItem>
                      <SelectItem value="former_teacher">Former Teacher</SelectItem>
                      <SelectItem value="club_advisor">Club Advisor</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => removeTeacher(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Community Support */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="community-support"
            checked={data.communitySupport}
            onCheckedChange={(checked) => setData({ 
              ...data, 
              communitySupport: checked as boolean 
            })}
          />
          <Label htmlFor="community-support" className="font-medium">
            I have received assistance from community-based organizations
          </Label>
        </div>

        {data.communitySupport && (
          <div className="ml-6 space-y-4 border-l-2 border-muted pl-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Add organizations that have supported your education or development.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={addCommunityOrg}>
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            </div>

            {data.communityOrganizations.map((org, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`org-name-${index}`}>Organization Name</Label>
                      <Input
                        id={`org-name-${index}`}
                        value={org.name}
                        onChange={(e) => updateCommunityOrg(index, 'name', e.target.value)}
                        placeholder="Boys & Girls Club"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`org-advisor-${index}`}>Your Advisor/Contact Person</Label>
                      <Input
                        id={`org-advisor-${index}`}
                        value={org.advisor}
                        onChange={(e) => updateCommunityOrg(index, 'advisor', e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor={`org-assistance-${index}`}>Type of Assistance Received</Label>
                      <Select value={org.assistanceType} onValueChange={(value) => updateCommunityOrg(index, 'assistanceType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assistance type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tutoring">Tutoring/Academic Support</SelectItem>
                          <SelectItem value="mentoring">Mentoring</SelectItem>
                          <SelectItem value="college_prep">College Preparation</SelectItem>
                          <SelectItem value="leadership">Leadership Development</SelectItem>
                          <SelectItem value="career_guidance">Career Guidance</SelectItem>
                          <SelectItem value="financial_support">Financial Support</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeCommunityOrg(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DocumentationPortfolioStep: React.FC<{
  data: SupportNetworkData;
  setData: (data: SupportNetworkData) => void;
}> = ({ data, setData }) => {
  
  const addPortfolioItem = () => {
    setData({
      ...data,
      portfolioItems: [...data.portfolioItems, { 
        id: Date.now().toString(),
        type: '', 
        title: '',
        description: '',
        category: ''
      }]
    });
  };

  const updatePortfolioItem = (index: number, field: string, value: string | File) => {
    const newItems = [...data.portfolioItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setData({ ...data, portfolioItems: newItems });
  };

  const removePortfolioItem = (index: number) => {
    const newItems = data.portfolioItems.filter((_, i) => i !== index);
    setData({ ...data, portfolioItems: newItems });
  };

  const addDocument = () => {
    setData({
      ...data,
      documents: [...data.documents, { type: '', description: '' }]
    });
  };

  const updateDocument = (index: number, field: string, value: string) => {
    const newDocs = [...data.documents];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setData({ ...data, documents: newDocs });
  };

  const removeDocument = (index: number) => {
    const newDocs = data.documents.filter((_, i) => i !== index);
    setData({ ...data, documents: newDocs });
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Items */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="has-portfolio"
            checked={data.hasPortfolioItems}
            onCheckedChange={(checked) => {
              setData({ 
                ...data, 
                hasPortfolioItems: checked as boolean,
                portfolioItems: checked ? data.portfolioItems : []
              });
            }}
          />
          <Label htmlFor="has-portfolio" className="font-medium">
            I have portfolio items to include (art, writing, projects, etc.)
          </Label>
        </div>

        {data.hasPortfolioItems && (
          <div className="ml-6 space-y-4 border-l-2 border-muted pl-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Add your portfolio items like artwork, writing samples, coding projects, etc.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={addPortfolioItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Portfolio Item
              </Button>
            </div>

            {data.portfolioItems.map((item, index) => (
              <Card key={item.id} className="p-4">
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`portfolio-title-${index}`}>Title</Label>
                      <Input
                        id={`portfolio-title-${index}`}
                        value={item.title}
                        onChange={(e) => updatePortfolioItem(index, 'title', e.target.value)}
                        placeholder="My Art Project"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`portfolio-category-${index}`}>Category</Label>
                      <Select value={item.category} onValueChange={(value) => updatePortfolioItem(index, 'category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visual_art">Visual Art</SelectItem>
                          <SelectItem value="writing">Writing</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="coding">Coding Project</SelectItem>
                          <SelectItem value="research">Research</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="photography">Photography</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`portfolio-description-${index}`}>Description</Label>
                    <Textarea
                      id={`portfolio-description-${index}`}
                      value={item.description}
                      onChange={(e) => updatePortfolioItem(index, 'description', e.target.value)}
                      placeholder="Describe your portfolio item, what it represents, techniques used, etc."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm">
                            <Paperclip className="h-4 w-4 mr-2" />
                            Attach File
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Attach File to "{item.title || 'Portfolio Item'}"</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center">
                              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mb-2">
                                Drop files here or click to browse
                              </p>
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp3,.mp4,.mov,.zip"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    updatePortfolioItem(index, 'attachedFile', file);
                                  }
                                }}
                                id={`portfolio-file-${index}`}
                              />
                              <label
                                htmlFor={`portfolio-file-${index}`}
                                className="cursor-pointer text-primary hover:text-primary/80 text-sm font-medium"
                              >
                                Choose file
                              </label>
                            </div>
                            {item.attachedFile && (
                              <p className="text-sm text-green-600">
                                File attached: {item.attachedFile.name}
                              </p>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      {item.attachedFile && (
                        <span className="text-xs text-muted-foreground">
                          {item.attachedFile.name}
                        </span>
                      )}
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removePortfolioItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Supporting Documents */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="upload-documents"
            checked={data.wantsToUploadDocuments}
            onCheckedChange={(checked) => {
              setData({ 
                ...data, 
                wantsToUploadDocuments: checked as boolean,
                documents: checked ? data.documents : []
              });
            }}
          />
          <Label htmlFor="upload-documents" className="font-medium">
            I would like to upload teacher letters of recommendation
          </Label>
        </div>

        {data.wantsToUploadDocuments && (
          <div className="ml-6 space-y-4 border-l-2 border-muted pl-4">
            {/* File Upload Section */}
            <Card className="p-4 border-dashed border-2 border-primary/20">
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Upload Teacher Letters of Recommendation</p>
                  <p className="text-xs text-muted-foreground">Drag and drop files here or click to browse</p>
                </div>
                <Button variant="outline" size="sm">
                  Choose Recommendation Letters
                </Button>
                <p className="text-xs text-muted-foreground">
                  Upload letters of recommendation from teachers, counselors, or mentors (PDF, DOC, DOCX - Max 10MB each)
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportNetworkWizard;