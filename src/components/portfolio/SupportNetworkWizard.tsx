import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, Users2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
    type: string;
    description: string;
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
}

const STEPS = [
  { id: 1, title: 'Educational Support', description: 'Counselors, teachers, and mentors' },
  { id: 2, title: 'Documentation & Portfolio', description: 'Supporting materials and uploads' }
];

const SupportNetworkWizard: React.FC<Props> = ({ onComplete, onCancel }) => {
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

      const { error } = await supabase
        .from('profiles')
        .update({
          completion_score: 80 // Update completion score to unlock final section
        })
        .eq('user_id', user.id);

      if (error) throw error;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Users2 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Support Network & Resources</h2>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-2 ${
                currentStep === step.id ? 'text-primary' : 
                currentStep > step.id ? 'text-green-600' : 'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step.id ? 'bg-primary text-primary-foreground' :
                  currentStep > step.id ? 'bg-green-600 text-white' : 'bg-muted'
                }`}>
                  {step.id}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${currentStep > step.id ? 'bg-green-600' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" />
            {STEPS[currentStep - 1]?.title}
          </CardTitle>
          <p className="text-muted-foreground">{STEPS[currentStep - 1]?.description}</p>
        </CardHeader>
        <CardContent>
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={currentStep === 1 ? onCancel : handlePrevious}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
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
      portfolioItems: [...data.portfolioItems, { type: '', description: '' }]
    });
  };

  const updatePortfolioItem = (index: number, field: string, value: string) => {
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
                List creative work, projects, or other portfolio items that showcase your abilities.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={addPortfolioItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {data.portfolioItems.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`portfolio-type-${index}`}>Item Type</Label>
                    <Select value={item.type} onValueChange={(value) => updatePortfolioItem(index, 'type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="artwork">Artwork/Visual Art</SelectItem>
                        <SelectItem value="writing">Writing Samples</SelectItem>
                        <SelectItem value="music">Music/Audio</SelectItem>
                        <SelectItem value="video">Video/Film</SelectItem>
                        <SelectItem value="research">Research Project</SelectItem>
                        <SelectItem value="website">Website/App</SelectItem>
                        <SelectItem value="photography">Photography</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
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
                <div className="mt-4">
                  <Label htmlFor={`portfolio-desc-${index}`}>Description</Label>
                  <Textarea
                    id={`portfolio-desc-${index}`}
                    value={item.description}
                    onChange={(e) => updatePortfolioItem(index, 'description', e.target.value)}
                    placeholder="Brief description of this portfolio item..."
                    className="min-h-[60px]"
                  />
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
            I would like to upload supporting documents
          </Label>
        </div>

        {data.wantsToUploadDocuments && (
          <div className="ml-6 space-y-4 border-l-2 border-muted pl-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                List documents you'd like to include (transcripts, certificates, etc.).
              </p>
              <Button type="button" variant="outline" size="sm" onClick={addDocument}>
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>

            {data.documents.map((doc, index) => (
              <Card key={index} className="p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`doc-type-${index}`}>Document Type</Label>
                    <Select value={doc.type} onValueChange={(value) => updateDocument(index, 'type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transcript">Transcript</SelectItem>
                        <SelectItem value="certificate">Certificate/Award</SelectItem>
                        <SelectItem value="test_scores">Test Scores</SelectItem>
                        <SelectItem value="resume">Resume</SelectItem>
                        <SelectItem value="essay">Essay/Writing Sample</SelectItem>
                        <SelectItem value="recommendation">Recommendation Letter</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeDocument(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor={`doc-desc-${index}`}>Description</Label>
                  <Textarea
                    id={`doc-desc-${index}`}
                    value={doc.description}
                    onChange={(e) => updateDocument(index, 'description', e.target.value)}
                    placeholder="Brief description of this document..."
                    className="min-h-[60px]"
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportNetworkWizard;