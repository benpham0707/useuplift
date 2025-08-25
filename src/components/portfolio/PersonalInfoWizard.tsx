import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BasicInfo, Demographics, FamilyContext, Communications, PersonalCompleteSchema } from '@/schemas/personal';
import { useToast } from '@/hooks/use-toast';

const STEPS = [
  { id: 1, title: "Basic Information", required: true },
  { id: 2, title: "Demographics & Background", required: false },
  { id: 3, title: "Family Context", required: true },
  { id: 4, title: "Communications & Consent", required: true }
];

export default function PersonalInfoWizard({ onComplete }: { onComplete?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = STEPS.length;
  const progress = useMemo(() => (step / totalSteps) * 100, [step]);

  // Initialize state with proper defaults
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    legalFirstName: '',
    legalLastName: '',
    dateOfBirth: '',
    primaryEmail: user?.email || '',
    primaryPhone: '',
    permanentAddress: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA',
    },
    genderIdentity: 'prefer-not-to-say' as any,
    pronouns: 'prefer-not-to-say' as any,
  });

  const [demographics, setDemographics] = useState<Demographics>({
    hispanicLatino: 'prefer-not-to-say' as any,
    raceEthnicity: [],
    householdIncome: 'prefer-not-to-say' as any,
    householdSize: '3-4' as any,
    citizenshipStatus: 'us-citizen' as any,
    primaryLanguageHome: 'English',
    otherLanguages: [],
  });

  const [familyContext, setFamilyContext] = useState<FamilyContext>({
    livingSituation: 'both-parents' as any,
    parent1: {
      relationship: '',
      educationLevel: 'unknown' as any,
      occupationCategory: 'other' as any,
    },
  });

  const [communications, setCommunications] = useState<Communications>({
    contactPreference: 'none',
    marketingOptIn: false,
    consentAcknowledged: false,
  });

  const [submitting, setSubmitting] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('personalInfoProgress');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.basicInfo) setBasicInfo({ ...basicInfo, ...data.basicInfo });
        if (data.demographics) setDemographics({ ...demographics, ...data.demographics });
        if (data.familyContext) setFamilyContext({ ...familyContext, ...data.familyContext });
        if (data.communications) setCommunications({ ...communications, ...data.communications });
        if (data.step) setStep(data.step);
      }
    } catch (e) {
      console.warn('Could not load saved progress');
    }
  }, []);

  // Auto-save progress
  useEffect(() => {
    const saveData = {
      basicInfo,
      demographics, 
      familyContext,
      communications,
      step
    };
    localStorage.setItem('personalInfoProgress', JSON.stringify(saveData));
  }, [basicInfo, demographics, familyContext, communications, step]);

  // Update email when user changes
  useEffect(() => {
    if (user?.email) {
      setBasicInfo(prev => ({ ...prev, primaryEmail: user.email! }));
    }
  }, [user?.email]);

  const validateCurrentStep = () => {
    try {
      if (step === 1) {
        const required = {
          legalFirstName: basicInfo.legalFirstName,
          legalLastName: basicInfo.legalLastName,
          dateOfBirth: basicInfo.dateOfBirth,
          primaryEmail: basicInfo.primaryEmail,
          primaryPhone: basicInfo.primaryPhone,
          permanentAddress: basicInfo.permanentAddress,
          genderIdentity: basicInfo.genderIdentity,
          pronouns: basicInfo.pronouns,
        };
        
        return Object.values(required).every(val => {
          if (typeof val === 'object') {
            return Object.values(val).every(v => v && v.trim().length > 0);
          }
          return val && val.toString().trim().length > 0;
        });
      } else if (step === 2) {
        return true; // Demographics is optional
      } else if (step === 3) {
        return familyContext.livingSituation && 
               familyContext.parent1?.relationship &&
               familyContext.parent1?.educationLevel &&
               familyContext.parent1?.occupationCategory;
      } else if (step === 4) {
        return communications.consentAcknowledged;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  const canNext = validateCurrentStep();

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before submitting.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        basicInfo,
        demographics,
        familyContext,
        communications
      };

      // Validate complete schema
      PersonalCompleteSchema.parse(payload);

      // Try API first
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      
      const resp = await fetch('/api/v1/personal/complete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) 
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!resp.ok) throw new Error('server_unavailable');

      // Clear saved progress
      localStorage.removeItem('personalInfoProgress');
      
      toast({
        title: "Personal Information Saved",
        description: "Your information has been successfully saved.",
      });

      onComplete?.();
      navigate('/portfolio-scanner');
    } catch (e) {
      // Client-side fallback
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user?.id;
        
        if (!uid) throw new Error('not_authenticated');

        // Save to profiles table
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, demographics, completion_details, completion_score')
          .eq('user_id', uid)
          .single();

        if (!prof) throw new Error('profile_not_found');

        const updatedDemographics = { 
          ...(prof.demographics as any ?? {}), 
          personalInfo: { basicInfo, demographics, familyContext, communications }
        };
        
        const details = (prof.completion_details as any) ?? { 
          overall: 0, 
          sections: { basic: 0, goals: 0, academic: 0, enrichment: 0, experience: 0 } 
        };
        
        const nextDetails = { 
          ...details, 
          sections: { ...details.sections, basic: 1 } 
        };
        
        const nextScore = Math.max(Number(prof.completion_score ?? 0), 0.6);

        await supabase
          .from('profiles')
          .update({ 
            demographics: updatedDemographics, 
            completion_details: nextDetails, 
            completion_score: nextScore 
          })
          .eq('id', prof.id);

        // Clear saved progress
        localStorage.removeItem('personalInfoProgress');

        toast({
          title: "Personal Information Saved",
          description: "Your information has been successfully saved.",
        });

        onComplete?.();
        navigate('/portfolio-scanner');
      } catch (err) {
        console.error('Save error:', err);
        toast({
          title: "Save Error",
          description: "Could not save personal info. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Personal Information</h1>
          <p className="text-lg text-muted-foreground">
            Complete your profile to unlock personalized insights and recommendations
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>Step {step} of {totalSteps}: {STEPS[step - 1]?.title}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-3" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {s.id}
                </div>
                <span className={`text-xs mt-1 ${s.required ? 'font-medium' : ''}`}>
                  {s.title}
                  {s.required && <span className="text-destructive">*</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">
              {STEPS[step - 1]?.title}
              {STEPS[step - 1]?.required && <span className="text-destructive ml-1">*</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <BasicInfoStep 
                data={basicInfo} 
                onChange={setBasicInfo} 
              />
            )}
            {step === 2 && (
              <DemographicsStep 
                data={demographics} 
                onChange={setDemographics} 
              />
            )}
            {step === 3 && (
              <FamilyContextStep 
                data={familyContext} 
                onChange={setFamilyContext} 
              />
            )}
            {step === 4 && (
              <CommunicationsStep 
                data={communications} 
                onChange={setCommunications} 
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setStep(s => Math.max(1, s - 1))} 
            disabled={step === 1 || submitting}
          >
            Previous
          </Button>
          
          {step < totalSteps ? (
            <Button 
              onClick={() => canNext && setStep(s => Math.min(totalSteps, s + 1))} 
              disabled={!canNext || submitting}
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={!canNext || submitting}
            >
              {submitting ? 'Saving...' : 'Complete Personal Info'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
function BasicInfoStep({ data, onChange }: { data: BasicInfo; onChange: (data: BasicInfo) => void }) {
  const updateField = (field: keyof BasicInfo, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateAddress = (field: keyof BasicInfo['permanentAddress'], value: string) => {
    onChange({ 
      ...data, 
      permanentAddress: { ...data.permanentAddress, [field]: value } 
    });
  };

  return (
    <div className="space-y-8">
        {/* Core Required Fields */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Core Information
          <span className="text-destructive">*</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="legal-first">First Name *</Label>
            <Input
              id="legal-first"
              value={data.legalFirstName}
              onChange={(e) => updateField('legalFirstName', e.target.value)}
              placeholder="Enter your legal first name"
            />
          </div>
          <div>
            <Label htmlFor="legal-last">Last Name *</Label>
            <Input
              id="legal-last"
              value={data.legalLastName}
              onChange={(e) => updateField('legalLastName', e.target.value)}
              placeholder="Enter your legal last name"
            />
          </div>
          <div>
            <Label htmlFor="preferred-name">Preferred Name</Label>
            <Input
              id="preferred-name"
              value={data.preferredName || ''}
              onChange={(e) => updateField('preferredName', e.target.value)}
              placeholder="If different from legal name"
            />
          </div>
          <div>
            <Label htmlFor="former-names">Former Legal Names</Label>
            <Input
              id="former-names"
              value={data.formerLegalNames || ''}
              onChange={(e) => updateField('formerLegalNames', e.target.value)}
              placeholder="Any previous legal names"
            />
          </div>
          <div>
            <Label htmlFor="dob">Date of Birth *</Label>
            <Input
              id="dob"
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => updateField('dateOfBirth', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primary-email">Primary Email *</Label>
            <Input
              id="primary-email"
              type="email"
              value={data.primaryEmail}
              onChange={(e) => updateField('primaryEmail', e.target.value)}
              placeholder="your.email@example.com"
            />
          </div>
          <div>
            <Label htmlFor="primary-phone">Primary Phone *</Label>
            <Input
              id="primary-phone"
              type="tel"
              value={data.primaryPhone}
              onChange={(e) => updateField('primaryPhone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="secondary-phone">Secondary Phone</Label>
            <Input
              id="secondary-phone"
              type="tel"
              value={data.secondaryPhone || ''}
              onChange={(e) => updateField('secondaryPhone', e.target.value)}
              placeholder="Optional second phone number"
            />
          </div>
        </div>
      </div>

      {/* Permanent Address */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Permanent Address
          <span className="text-destructive">*</span>
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="street">Street Address *</Label>
            <Input
              id="street"
              value={data.permanentAddress.street}
              onChange={(e) => updateAddress('street', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={data.permanentAddress.city}
                onChange={(e) => updateAddress('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={data.permanentAddress.state}
                onChange={(e) => updateAddress('state', e.target.value)}
                placeholder="State"
              />
            </div>
            <div>
              <Label htmlFor="zip">ZIP Code *</Label>
              <Input
                id="zip"
                value={data.permanentAddress.zip}
                onChange={(e) => updateAddress('zip', e.target.value)}
                placeholder="12345"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={data.permanentAddress.country}
              onChange={(e) => updateAddress('country', e.target.value)}
              placeholder="Country"
            />
          </div>
        </div>
      </div>

      {/* Identity */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Identity
          <span className="text-destructive">*</span>
        </h3>
        <div className="space-y-6">
          <div>
            <Label>Gender Identity *</Label>
            <RadioGroup 
              value={data.genderIdentity} 
              onValueChange={(value) => updateField('genderIdentity', value)}
              className="mt-2"
            >
              {[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
                { value: 'non-binary', label: 'Non-binary' },
                { value: 'self-describe', label: 'Self-describe' },
                { value: 'prefer-not-to-say', label: 'Prefer not to say' }
              ].map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`gender-${option.value}`} />
                  <Label htmlFor={`gender-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {data.genderIdentity === 'self-describe' && (
              <Input
                className="mt-2"
                value={data.genderSelfDescribe || ''}
                onChange={(e) => updateField('genderSelfDescribe', e.target.value)}
                placeholder="Please specify"
              />
            )}
          </div>

          <div>
            <Label>Pronouns *</Label>
            <RadioGroup 
              value={data.pronouns} 
              onValueChange={(value) => updateField('pronouns', value)}
              className="mt-2"
            >
              {[
                { value: 'she-her', label: 'She/Her' },
                { value: 'he-him', label: 'He/Him' },
                { value: 'they-them', label: 'They/Them' },
                { value: 'other', label: 'Other/Self-describe' },
                { value: 'prefer-not-to-say', label: 'Prefer not to say' }
              ].map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`pronouns-${option.value}`} />
                  <Label htmlFor={`pronouns-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {data.pronouns === 'other' && (
              <Input
                className="mt-2"
                value={data.pronounsSelfDescribe || ''}
                onChange={(e) => updateField('pronounsSelfDescribe', e.target.value)}
                placeholder="Please specify your pronouns"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DemographicsStep({ data, onChange }: { data: Demographics; onChange: (data: Demographics) => void }) {
  const updateField = (field: keyof Demographics, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const toggleRaceEthnicity = (value: string) => {
    const current = data.raceEthnicity || [];
    const updated = current.includes(value as any)
      ? current.filter(item => item !== value)
      : [...current, value as any];
    updateField('raceEthnicity', updated);
  };

  return (
    <div className="space-y-8">
      {/* Hispanic/Latino */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Hispanic or Latino Origin</h3>
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
            <div className="mt-4">
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
          )}
        </div>
      </div>

      {/* Race/Ethnicity */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Race/Ethnicity</h3>
        <Label>Select all that apply (optional)</Label>
        <div className="mt-2 space-y-2">
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
            className="mt-2"
            value={data.raceOther || ''}
            onChange={(e) => updateField('raceOther', e.target.value)}
            placeholder="Please specify"
          />
        )}
      </div>

      {/* Household Context */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Household Context</h3>
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
      </div>

      {/* Citizenship & Language */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Citizenship & Language</h3>
        <div className="space-y-4">
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
        </div>
      </div>
    </div>
  );
}

function FamilyContextStep({ data, onChange }: { data: FamilyContext; onChange: (data: FamilyContext) => void }) {
  const updateField = (field: keyof FamilyContext, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateParent = (parentNum: 1 | 2, field: string, value: any) => {
    const parentKey = `parent${parentNum}` as keyof FamilyContext;
    const currentParent = data[parentKey] as any || {};
    onChange({
      ...data,
      [parentKey]: { ...currentParent, [field]: value }
    });
  };

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
    { value: 'architecture-engineering', label: 'Architecture & Engineering' },
    { value: 'life-physical-social-science', label: 'Life, Physical & Social Science' },
    { value: 'community-social-service', label: 'Community & Social Service' },
    { value: 'legal', label: 'Legal' },
    { value: 'education-training-library', label: 'Education, Training & Library' },
    { value: 'arts-design-entertainment-sports-media', label: 'Arts, Design, Entertainment, Sports & Media' },
    { value: 'healthcare-practitioners-technical', label: 'Healthcare Practitioners & Technical' },
    { value: 'healthcare-support', label: 'Healthcare Support' },
    { value: 'protective-service', label: 'Protective Service' },
    { value: 'food-preparation-serving', label: 'Food Preparation & Serving' },
    { value: 'building-grounds-cleaning-maintenance', label: 'Building & Grounds Cleaning & Maintenance' },
    { value: 'personal-care-service', label: 'Personal Care & Service' },
    { value: 'sales-related', label: 'Sales & Related' },
    { value: 'office-administrative-support', label: 'Office & Administrative Support' },
    { value: 'farming-fishing-forestry', label: 'Farming, Fishing & Forestry' },
    { value: 'construction-extraction', label: 'Construction & Extraction' },
    { value: 'installation-maintenance-repair', label: 'Installation, Maintenance & Repair' },
    { value: 'production', label: 'Production' },
    { value: 'transportation-material-moving', label: 'Transportation & Material Moving' },
    { value: 'military-specific', label: 'Military Specific' },
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'retired', label: 'Retired' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="space-y-8">
      {/* Living Situation */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Current Living Situation
          <span className="text-destructive">*</span>
        </h3>
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
            className="mt-2"
            value={data.livingSituationOther || ''}
            onChange={(e) => updateField('livingSituationOther', e.target.value)}
            placeholder="Please specify your living situation"
          />
        )}
      </div>

      {/* Parent/Guardian 1 */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Parent/Guardian 1
          <span className="text-destructive">*</span>
        </h3>
        <div className="space-y-4">
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
        </div>
      </div>

      {/* Parent/Guardian 2 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Parent/Guardian 2 (Optional)</h3>
        <div className="space-y-4">
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
        </div>
      </div>

      {/* Family Enrichment */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Family Background (Optional)</h3>
        <div className="grid md:grid-cols-2 gap-4">
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
        </div>
        
        <div className="mt-4">
          <Label htmlFor="siblings-education">Siblings' Education Status</Label>
          <Textarea
            id="siblings-education"
            value={data.siblingsEducation || ''}
            onChange={(e) => updateField('siblingsEducation', e.target.value)}
            placeholder="Brief description of siblings' education levels (e.g., 'One brother in college, one sister graduated high school')"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

function CommunicationsStep({ data, onChange }: { data: Communications; onChange: (data: Communications) => void }) {
  const updateField = (field: keyof Communications, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-8">
      {/* Contact Preferences */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Contact Preferences</h3>
        <div>
          <Label>How would you prefer to be contacted?</Label>
          <RadioGroup 
            value={data.contactPreference} 
            onValueChange={(value) => updateField('contactPreference', value)}
            className="mt-2"
          >
            {[
              { value: 'email', label: 'Email' },
              { value: 'sms', label: 'SMS/Text' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'none', label: 'No communications' }
            ].map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`contact-${option.value}`} />
                <Label htmlFor={`contact-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* Marketing Opt-in */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Updates & Information</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="marketing-opt"
            checked={data.marketingOptIn}
            onCheckedChange={(checked) => updateField('marketingOptIn', checked)}
          />
          <Label htmlFor="marketing-opt">
            I'd like to receive occasional updates about college opportunities, deadlines, and helpful resources
          </Label>
        </div>
      </div>

      {/* Consent */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Consent & Privacy
          <span className="text-destructive">*</span>
        </h3>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Data Privacy Notice</h4>
            <p className="text-sm text-muted-foreground mb-3">
              By continuing, you acknowledge that:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Your information will be used to provide personalized college guidance and recommendations</li>
              <li>• We will not share your personal information with third parties without your consent</li>
              <li>• You can request to update or delete your information at any time</li>
              <li>• All data is encrypted and stored securely</li>
            </ul>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="consent"
              checked={data.consentAcknowledged}
              onCheckedChange={(checked) => updateField('consentAcknowledged', checked)}
            />
            <Label htmlFor="consent" className="leading-relaxed">
              I acknowledge and agree to the data privacy notice above and consent to the collection and use of my information as described. *
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}