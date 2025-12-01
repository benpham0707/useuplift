import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Demographics } from '@/schemas/personal';
import { useToast } from '@/hooks/use-toast';

export default function DemographicsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [data, setData] = useState<Demographics>({
    hispanicLatino: 'prefer-not-to-say' as any,
    raceEthnicity: [],
    householdIncome: 'prefer-not-to-say' as any,
    householdSize: '3-4' as any,
    citizenshipStatus: 'us-citizen' as any,
    primaryLanguageHome: 'English',
    otherLanguages: [],
  });

  const [submitting, setSubmitting] = useState(false);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('personalInfoProgress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.demographics) {
          setData({ ...data, ...parsed.demographics });
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
      const updated = { ...parsed, demographics: data };
      localStorage.setItem('personalInfoProgress', JSON.stringify(updated));
    } catch (e) {
      localStorage.setItem('personalInfoProgress', JSON.stringify({ demographics: data }));
    }
  }, [data]);

  const updateField = (field: keyof Demographics, value: any) => {
    setData({ ...data, [field]: value });
  };

  const toggleRaceEthnicity = (value: string) => {
    const current = data.raceEthnicity || [];
    const updated = current.includes(value as any)
      ? current.filter(item => item !== value)
      : [...current, value as any];
    updateField('raceEthnicity', updated);
  };

  const handleSave = async () => {
    setSubmitting(true);
    
    // Mark as completed (demographics is optional so always can save)
    const saved = localStorage.getItem('personalInfoProgress') || '{}';
    try {
      const parsed = JSON.parse(saved);
      const updated = { 
        ...parsed, 
        demographics: data,
        demographicsCompleted: true
      };
      localStorage.setItem('personalInfoProgress', JSON.stringify(updated));
      
      toast({
        title: "Progress Saved",
        description: "Your demographics information has been saved.",
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

  const completedFields = Object.values(data).filter(val => {
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object' && val !== null) {
      return Object.values(val).some(v => v && v.toString().trim().length > 0);
    }
    return val && val.toString().trim().length > 0 && val !== 'prefer-not-to-say';
  }).length;

  const totalFields = Object.keys(data).length;
  const completionProgress = (completedFields / totalFields) * 100;

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
          
          <h1 className="text-3xl font-bold text-foreground mb-2">Demographics & Background</h1>
          <p className="text-muted-foreground mb-4">
            Optional demographic information to help personalize your recommendations
          </p>
          
          <div className="flex items-center gap-4 mb-4">
            <Progress value={completionProgress} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground">
              {Math.round(completionProgress)}% Complete
            </span>
          </div>
        </div>

        <div className="space-y-8">
          {/* Hispanic/Latino Origin */}
          <Card>
            <CardHeader>
              <CardTitle>Hispanic or Latino Origin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Are you Hispanic or Latino?</Label>
                <RadioGroup 
                  value={data.hispanicLatino} 
                  onValueChange={(value) => updateField('hispanicLatino', value)}
                  className="mt-2"
                >
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
                  ].map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`hispanic-${option.value}`} />
                      <Label htmlFor={`hispanic-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                
                {data.hispanicLatino === 'yes' && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label>Background specification</Label>
                      <RadioGroup 
                        value={data.hispanicBackground || ''} 
                        onValueChange={(value) => updateField('hispanicBackground', value)}
                        className="mt-2"
                      >
                        {[
                          { value: 'mexican', label: 'Mexican' },
                          { value: 'cuban', label: 'Cuban' },
                          { value: 'puerto-rican', label: 'Puerto Rican' },
                          { value: 'other', label: 'Other' }
                        ].map(option => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`hispanic-bg-${option.value}`} />
                            <Label htmlFor={`hispanic-bg-${option.value}`}>{option.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                      
                      {data.hispanicBackground === 'other' && (
                        <Input
                          className="mt-2"
                          value={data.hispanicOther || ''}
                          onChange={(e) => updateField('hispanicOther', e.target.value)}
                          placeholder="Please specify"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Race/Ethnicity */}
          <Card>
            <CardHeader>
              <CardTitle>Race/Ethnicity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>Select all that apply (optional)</Label>
              <div className="space-y-2">
                {[
                  { value: 'american-indian-alaska-native', label: 'American Indian or Alaska Native' },
                  { value: 'asian', label: 'Asian' },
                  { value: 'black-african-american', label: 'Black or African American' },
                  { value: 'native-hawaiian-pacific-islander', label: 'Native Hawaiian or Other Pacific Islander' },
                  { value: 'white', label: 'White' },
                  { value: 'other', label: 'Other' },
                  { value: 'prefer-not-to-say', label: 'Prefer not to say' }
                ].map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`race-${option.value}`}
                      checked={data.raceEthnicity?.includes(option.value as any) || false}
                      onCheckedChange={() => toggleRaceEthnicity(option.value)}
                    />
                    <Label htmlFor={`race-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </div>
              
              {data.raceEthnicity?.includes('other' as any) && (
                <Input
                  value={data.raceOther || ''}
                  onChange={(e) => updateField('raceOther', e.target.value)}
                  placeholder="Please specify"
                />
              )}
            </CardContent>
          </Card>

          {/* Household Context */}
          <Card>
            <CardHeader>
              <CardTitle>Household Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Household Income Range</Label>
                  <Select value={data.householdIncome} onValueChange={(value) => updateField('householdIncome', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-30k">Under $30,000</SelectItem>
                      <SelectItem value="30k-60k">$30,000 - $60,000</SelectItem>
                      <SelectItem value="60k-100k">$60,000 - $100,000</SelectItem>
                      <SelectItem value="100k-150k">$100,000 - $150,000</SelectItem>
                      <SelectItem value="over-150k">Over $150,000</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Number of People in Household</Label>
                  <Select value={data.householdSize} onValueChange={(value) => updateField('householdSize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select household size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">1-2 people</SelectItem>
                      <SelectItem value="3-4">3-4 people</SelectItem>
                      <SelectItem value="5-6">5-6 people</SelectItem>
                      <SelectItem value="7-plus">7 or more people</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Citizenship & Language */}
          <Card>
            <CardHeader>
              <CardTitle>Citizenship & Language</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Citizenship Status</Label>
                <Select value={data.citizenshipStatus} onValueChange={(value) => updateField('citizenshipStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us-citizen">U.S. Citizen</SelectItem>
                    <SelectItem value="permanent-resident">Permanent Resident</SelectItem>
                    <SelectItem value="international-student">International Student</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                
                {data.citizenshipStatus === 'other' && (
                  <Input
                    className="mt-2"
                    value={data.citizenshipOther || ''}
                    onChange={(e) => updateField('citizenshipOther', e.target.value)}
                    placeholder="Please specify"
                  />
                )}
              </div>
              
              <div>
                <Label htmlFor="primary-lang">Primary Language Spoken at Home</Label>
                <Input
                  id="primary-lang"
                  value={data.primaryLanguageHome}
                  onChange={(e) => updateField('primaryLanguageHome', e.target.value)}
                  placeholder="English, Spanish, etc."
                />
              </div>
              
              {data.citizenshipStatus !== 'us-citizen' && (
                <div>
                  <Label htmlFor="years-us">Years Living in United States</Label>
                  <Input
                    id="years-us"
                    type="number"
                    min="0"
                    value={data.yearsInUS || ''}
                    onChange={(e) => updateField('yearsInUS', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Enter number of years"
                  />
                </div>
              )}
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
            disabled={submitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}