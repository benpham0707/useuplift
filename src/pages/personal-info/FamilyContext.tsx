import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FamilyContext } from '@/schemas/personal';
import { useToast } from '@/hooks/use-toast';

export default function FamilyContextPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [data, setData] = useState<FamilyContext>({
    livingSituation: 'both-parents' as any,
    parent1: {
      relationship: '',
      educationLevel: 'unknown' as any,
      occupationCategory: 'other' as any,
    },
  });

  const [submitting, setSubmitting] = useState(false);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('personalInfoProgress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.familyContext) {
          setData({ ...data, ...parsed.familyContext });
        }
      } catch (e) {
      }
    }
  }, []);

  // Auto-save
  useEffect(() => {
    const saved = localStorage.getItem('personalInfoProgress') || '{}';
    try {
      const parsed = JSON.parse(saved);
      const updated = { ...parsed, familyContext: data };
      localStorage.setItem('personalInfoProgress', JSON.stringify(updated));
    } catch (e) {
      localStorage.setItem('personalInfoProgress', JSON.stringify({ familyContext: data }));
    }
  }, [data]);

  const updateField = (field: keyof FamilyContext, value: any) => {
    setData({ ...data, [field]: value });
  };

  const updateParent = (parentNum: 1 | 2, field: string, value: any) => {
    const parentKey = `parent${parentNum}` as keyof FamilyContext;
    const currentParent = data[parentKey] as any || {};
    setData({
      ...data,
      [parentKey]: { ...currentParent, [field]: value }
    });
  };

  const validateForm = () => {
    return data.livingSituation && 
           data.parent1?.relationship &&
           data.parent1?.educationLevel &&
           data.parent1?.occupationCategory;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    const saved = localStorage.getItem('personalInfoProgress') || '{}';
    try {
      const parsed = JSON.parse(saved);
      const updated = { 
        ...parsed, 
        familyContext: data,
        familyCompleted: true
      };
      localStorage.setItem('personalInfoProgress', JSON.stringify(updated));
      
      toast({
        title: "Progress Saved",
        description: "Your family context information has been saved.",
      });
      
      navigate('/personal-info');
    } catch (e) {
      toast({
        title: "Save Error", 
        description: "Could not save progress. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canContinue = validateForm();

  const completedFields = [
    data.livingSituation,
    data.parent1?.relationship,
    data.parent1?.educationLevel, 
    data.parent1?.occupationCategory,
    data.parent2?.relationship,
    data.numberOfSiblings,
  ].filter(Boolean).length;

  const totalFields = 6;
  const completionProgress = (completedFields / totalFields) * 100;

  const educationLevels = [
    { value: 'less-than-high-school', label: 'Less than high school' },
    { value: 'high-school-diploma', label: 'High school diploma' },
    { value: 'some-college', label: 'Some college' },
    { value: 'associates-degree', label: 'Associates degree' },
    { value: 'bachelors-degree', label: 'Bachelor\'s degree' },
    { value: 'masters-degree', label: 'Master\'s degree' },
    { value: 'doctoral-degree', label: 'Doctoral degree' },
    { value: 'professional-degree', label: 'Professional degree' },
    { value: 'unknown', label: 'Unknown' }
  ];

  const occupationCategories = [
    { value: 'management', label: 'Management' },
    { value: 'business-financial', label: 'Business & Financial' },
    { value: 'computer-mathematical', label: 'Computer & Mathematical' },
    { value: 'healthcare-practitioners-technical', label: 'Healthcare Practitioners & Technical' },
    { value: 'education-training-library', label: 'Education, Training & Library' },
    { value: 'legal', label: 'Legal' },
    { value: 'arts-design-entertainment-sports-media', label: 'Arts, Design, Entertainment, Sports & Media' },
    { value: 'sales-related', label: 'Sales & Related' },
    { value: 'office-administrative-support', label: 'Office & Administrative Support' },
    { value: 'construction-extraction', label: 'Construction & Extraction' },
    { value: 'production', label: 'Production' },
    { value: 'transportation-material-moving', label: 'Transportation & Material Moving' },
    { value: 'food-preparation-serving', label: 'Food Preparation & Serving' },
    { value: 'protective-service', label: 'Protective Service' },
    { value: 'building-grounds-cleaning-maintenance', label: 'Building & Grounds Cleaning & Maintenance' },
    { value: 'personal-care-service', label: 'Personal Care & Service' },
    { value: 'military-specific', label: 'Military Specific' },
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'retired', label: 'Retired' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/personal-info')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">Family Context</h1>
          <p className="text-muted-foreground mb-4">
            Information about your family background and living situation
          </p>
          
          <div className="flex items-center gap-4 mb-4">
            <Progress value={completionProgress} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground">
              {Math.round(completionProgress)}% Complete
            </span>
          </div>
        </div>

        <div className="space-y-8">
          {/* Living Situation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Current Living Situation
                <span className="text-destructive">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup 
                value={data.livingSituation} 
                onValueChange={(value) => updateField('livingSituation', value)}
                className="space-y-2"
              >
                {[
                  { value: 'both-parents', label: 'Both parents' },
                  { value: 'single-parent', label: 'Single parent' },
                  { value: 'grandparents', label: 'Grandparents' },
                  { value: 'guardian', label: 'Guardian' },
                  { value: 'other', label: 'Other' }
                ].map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`living-${option.value}`} />
                    <Label htmlFor={`living-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
              
              {data.livingSituation === 'other' && (
                <Input
                  value={data.livingSituationOther || ''}
                  onChange={(e) => updateField('livingSituationOther', e.target.value)}
                  placeholder="Please specify your living situation"
                />
              )}
            </CardContent>
          </Card>

          {/* Parent/Guardian 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Parent/Guardian 1
                <span className="text-destructive">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="parent1-relationship">Relationship *</Label>
                <Input
                  id="parent1-relationship"
                  value={data.parent1?.relationship || ''}
                  onChange={(e) => updateParent(1, 'relationship', e.target.value)}
                  placeholder="Mother, Father, Guardian, etc."
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Education Level *</Label>
                  <Select 
                    value={data.parent1?.educationLevel || ''} 
                    onValueChange={(value) => updateParent(1, 'educationLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Occupation Category *</Label>
                  <Select 
                    value={data.parent1?.occupationCategory || ''} 
                    onValueChange={(value) => updateParent(1, 'occupationCategory', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select occupation" />
                    </SelectTrigger>
                    <SelectContent>
                      {occupationCategories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parent1-email">Contact Email</Label>
                  <Input
                    id="parent1-email"
                    type="email"
                    value={data.parent1?.contactEmail || ''}
                    onChange={(e) => updateParent(1, 'contactEmail', e.target.value)}
                    placeholder="Optional contact email"
                  />
                </div>
                <div>
                  <Label htmlFor="parent1-phone">Contact Phone</Label>
                  <Input
                    id="parent1-phone"
                    type="tel"
                    value={data.parent1?.contactPhone || ''}
                    onChange={(e) => updateParent(1, 'contactPhone', e.target.value)}
                    placeholder="Optional contact phone"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parent/Guardian 2 */}
          <Card>
            <CardHeader>
              <CardTitle>Parent/Guardian 2 (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="parent2-relationship">Relationship</Label>
                <Input
                  id="parent2-relationship"
                  value={data.parent2?.relationship || ''}
                  onChange={(e) => updateParent(2, 'relationship', e.target.value)}
                  placeholder="Mother, Father, Guardian, etc."
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Education Level</Label>
                  <Select 
                    value={data.parent2?.educationLevel || ''} 
                    onValueChange={(value) => updateParent(2, 'educationLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Occupation Category</Label>
                  <Select 
                    value={data.parent2?.occupationCategory || ''} 
                    onValueChange={(value) => updateParent(2, 'occupationCategory', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select occupation" />
                    </SelectTrigger>
                    <SelectContent>
                      {occupationCategories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parent2-email">Contact Email</Label>
                  <Input
                    id="parent2-email"
                    type="email"
                    value={data.parent2?.contactEmail || ''}
                    onChange={(e) => updateParent(2, 'contactEmail', e.target.value)}
                    placeholder="Optional contact email"
                  />
                </div>
                <div>
                  <Label htmlFor="parent2-phone">Contact Phone</Label>
                  <Input
                    id="parent2-phone"
                    type="tel"
                    value={data.parent2?.contactPhone || ''}
                    onChange={(e) => updateParent(2, 'contactPhone', e.target.value)}
                    placeholder="Optional contact phone"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Family Background */}
          <Card>
            <CardHeader>
              <CardTitle>Family Background (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siblings">Number of Siblings</Label>
                <Input
                  id="siblings"
                  type="number"
                  min="0"
                  value={data.numberOfSiblings || ''}
                  onChange={(e) => updateField('numberOfSiblings', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="siblings-education">Siblings' Education Status</Label>
                <Textarea
                  id="siblings-education"
                  value={data.siblingsEducation || ''}
                  onChange={(e) => updateField('siblingsEducation', e.target.value)}
                  placeholder="Brief description of siblings' education levels (e.g., 'One brother in college, one sister graduated high school')"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/personal-info')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={!canContinue || submitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}