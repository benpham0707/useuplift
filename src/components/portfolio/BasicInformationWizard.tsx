import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, User, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Hard coded data values as placeholders for comprehensive personal information structure
// This represents all the personal information fields including basic info, demographics, and family context
interface PersonalInformationData {
  // Basic Info
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: string;
  primaryEmail: string;
  primaryPhone: string;
  secondaryPhone?: string;
  pronouns: string;
  genderIdentity: string;
  permanentAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  alternateAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  placeOfBirth: {
    city: string;
    state: string;
    country: string;
  };

  // Background & Demographics
  hispanicLatino: string;
  hispanicBackground?: string;
  raceEthnicity: string[];
  citizenshipStatus: string;
  primaryLanguage: string;
  otherLanguages: Array<{
    language: string;
    proficiency: string;
  }>;
  yearsInUS?: number;
  formerNames?: string[];

  // Family Context
  livingSituation: string;
  householdSize: string;
  householdIncome: string;
  parentGuardians: Array<{
    relationship: string;
    educationLevel: string;
    occupation: string;
    contactInfo?: string;
  }>;
  numberOfSiblings: number;
  siblingsEducation: string;
  firstGenCollege?: boolean;
}

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Names, contact, and identity information' },
  { id: 2, title: 'Background & Demographics', description: 'Cultural background and languages' },
  { id: 3, title: 'Family Context', description: 'Living situation and family information' }
];

export default function BasicInformationWizard({ onComplete, onCancel }: Props) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock data for demonstration - comprehensive personal information structure
  const [data, setData] = useState<PersonalInformationData>({
    firstName: '',
    lastName: '',
    preferredName: '',
    dateOfBirth: '',
    primaryEmail: '',
    primaryPhone: '',
    secondaryPhone: '',
    pronouns: '',
    genderIdentity: '',
    permanentAddress: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States'
    },
    alternateAddress: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States'
    },
    placeOfBirth: {
      city: '',
      state: '',
      country: 'United States'
    },
    hispanicLatino: '',
    hispanicBackground: '',
    raceEthnicity: [],
    citizenshipStatus: '',
    primaryLanguage: 'English',
    otherLanguages: [],
    yearsInUS: undefined,
    formerNames: [],
    livingSituation: '',
    householdSize: '',
    householdIncome: '',
    parentGuardians: [
      { relationship: '', educationLevel: '', occupation: '', contactInfo: '' },
      { relationship: '', educationLevel: '', occupation: '', contactInfo: '' }
    ],
    numberOfSiblings: 0,
    siblingsEducation: '',
    firstGenCollege: undefined
  });

  const updateData = (updates: Partial<PersonalInformationData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const updateNestedField = (path: string[], value: any) => {
    setData(prev => {
      const updated = { ...prev };
      let current = updated as any;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return updated;
    });
  };

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

      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Create personal information record
      const personalInfoData = {
        profile_id: profile.id,
        first_name: data.firstName,
        last_name: data.lastName,
        preferred_name: data.preferredName,
        date_of_birth: data.dateOfBirth,
        primary_email: data.primaryEmail,
        primary_phone: data.primaryPhone,
        secondary_phone: data.secondaryPhone,
        pronouns: data.pronouns,
        gender_identity: data.genderIdentity,
        permanent_address: data.permanentAddress,
        alternate_address: data.alternateAddress,
        place_of_birth: data.placeOfBirth,
        hispanic_latino: data.hispanicLatino,
        hispanic_background: data.hispanicBackground,
        race_ethnicity: data.raceEthnicity,
        citizenship_status: data.citizenshipStatus,
        primary_language: data.primaryLanguage,
        other_languages: data.otherLanguages,
        years_in_us: data.yearsInUS,
        former_names: data.formerNames,
        living_situation: data.livingSituation,
        household_size: data.householdSize,
        household_income: data.householdIncome,
        parent_guardians: data.parentGuardians,
        siblings: {
          count: data.numberOfSiblings,
          education_status: data.siblingsEducation
        },
        first_gen: data.firstGenCollege
      };

      const { error } = await supabase
        .from('personal_information')
        .upsert(personalInfoData, { 
          onConflict: 'profile_id'
        });

      if (error) throw error;

      // Update profile completion score
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          completion_score: 85
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      toast({
        title: "Personal information saved!",
        description: "Your personal information has been successfully recorded.",
      });

      onComplete();
    } catch (error) {
      console.error('Error saving personal information:', error);
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
        return <BasicInfoStep data={data} updateData={updateData} updateNestedField={updateNestedField} />;
      case 2:
        return <BackgroundDemographicsStep data={data} updateData={updateData} />;
      case 3:
        return <FamilyContextStep data={data} updateData={updateData} updateNestedField={updateNestedField} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <User className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Personal Information</h2>
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
                  {currentStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : step.id}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${currentStep > step.id ? 'bg-green-600' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        
        <Progress value={(currentStep / STEPS.length) * 100} className="h-2 max-w-md mx-auto" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1]?.title}</CardTitle>
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
            {isLoading ? 'Saving...' : 'Complete Personal Information'}
          </Button>
        )}
      </div>
    </div>
  );
}

// Step Components
const BasicInfoStep: React.FC<{ 
  data: PersonalInformationData; 
  updateData: (updates: Partial<PersonalInformationData>) => void;
  updateNestedField: (path: string[], value: any) => void;
}> = ({ data, updateData, updateNestedField }) => (
  <div className="space-y-6">
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="first-name">First Name *</Label>
        <Input
          id="first-name"
          value={data.firstName}
          onChange={(e) => updateData({ firstName: e.target.value })}
          placeholder="Enter your first name"
        />
      </div>
      <div>
        <Label htmlFor="last-name">Last Name *</Label>
        <Input
          id="last-name"
          value={data.lastName}
          onChange={(e) => updateData({ lastName: e.target.value })}
          placeholder="Enter your last name"
        />
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="preferred-name">Preferred Name</Label>
        <Input
          id="preferred-name"
          value={data.preferredName || ''}
          onChange={(e) => updateData({ preferredName: e.target.value })}
          placeholder="If different from legal name"
        />
      </div>
      <div>
        <Label htmlFor="date-birth">Date of Birth *</Label>
        <Input
          id="date-birth"
          type="date"
          value={data.dateOfBirth}
          onChange={(e) => updateData({ dateOfBirth: e.target.value })}
        />
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="primary-email">Primary Email Address *</Label>
        <Input
          id="primary-email"
          type="email"
          value={data.primaryEmail}
          onChange={(e) => updateData({ primaryEmail: e.target.value })}
          placeholder="your.email@example.com"
        />
      </div>
      <div>
        <Label htmlFor="primary-phone">Primary Phone Number *</Label>
        <Input
          id="primary-phone"
          type="tel"
          value={data.primaryPhone}
          onChange={(e) => updateData({ primaryPhone: e.target.value })}
          placeholder="+1 (555) 123-4567"
        />
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="secondary-phone">Secondary Phone Number</Label>
        <Input
          id="secondary-phone"
          type="tel"
          value={data.secondaryPhone || ''}
          onChange={(e) => updateData({ secondaryPhone: e.target.value })}
          placeholder="Optional second number"
        />
      </div>
      <div>
        <Label>Pronouns *</Label>
        <Select value={data.pronouns} onValueChange={(value) => updateData({ pronouns: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select pronouns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="she-her">She/Her</SelectItem>
            <SelectItem value="he-him">He/Him</SelectItem>
            <SelectItem value="they-them">They/Them</SelectItem>
            <SelectItem value="other">Other/Self-describe</SelectItem>
            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div>
      <Label>Gender Identity *</Label>
      <Select value={data.genderIdentity} onValueChange={(value) => updateData({ genderIdentity: value })}>
        <SelectTrigger>
          <SelectValue placeholder="Select gender identity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="female">Female</SelectItem>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="non-binary">Non-binary</SelectItem>
          <SelectItem value="self-describe">Self-describe</SelectItem>
          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <Separator />
    
    <div>
      <h4 className="text-lg font-medium mb-4">Permanent Address</h4>
      <div className="space-y-4">
        <div>
          <Label htmlFor="street">Street *</Label>
          <Input
            id="street"
            value={data.permanentAddress.street}
            onChange={(e) => updateNestedField(['permanentAddress', 'street'], e.target.value)}
            placeholder="123 Main Street"
          />
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={data.permanentAddress.city}
              onChange={(e) => updateNestedField(['permanentAddress', 'city'], e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={data.permanentAddress.state}
              onChange={(e) => updateNestedField(['permanentAddress', 'state'], e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="zip">ZIP Code *</Label>
            <Input
              id="zip"
              value={data.permanentAddress.zip}
              onChange={(e) => updateNestedField(['permanentAddress', 'zip'], e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={data.permanentAddress.country}
              onChange={(e) => updateNestedField(['permanentAddress', 'country'], e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>

    <div>
      <h4 className="text-lg font-medium mb-4">Place of Birth</h4>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="birth-city">City</Label>
          <Input
            id="birth-city"
            value={data.placeOfBirth.city}
            onChange={(e) => updateNestedField(['placeOfBirth', 'city'], e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="birth-state">State</Label>
          <Input
            id="birth-state"
            value={data.placeOfBirth.state}
            onChange={(e) => updateNestedField(['placeOfBirth', 'state'], e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="birth-country">Country</Label>
          <Input
            id="birth-country"
            value={data.placeOfBirth.country}
            onChange={(e) => updateNestedField(['placeOfBirth', 'country'], e.target.value)}
          />
        </div>
      </div>
    </div>
  </div>
);

const BackgroundDemographicsStep: React.FC<{ 
  data: PersonalInformationData; 
  updateData: (updates: Partial<PersonalInformationData>) => void;
}> = ({ data, updateData }) => (
  <div className="space-y-6">
    <div>
      <Label>Are you Hispanic or Latino?</Label>
      <RadioGroup 
        value={data.hispanicLatino} 
        onValueChange={(value) => updateData({ hispanicLatino: value })}
        className="mt-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="yes" id="hispanic-yes" />
          <Label htmlFor="hispanic-yes">Yes</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no" id="hispanic-no" />
          <Label htmlFor="hispanic-no">No</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="prefer-not-to-say" id="hispanic-prefer" />
          <Label htmlFor="hispanic-prefer">Prefer not to say</Label>
        </div>
      </RadioGroup>
    </div>

    {data.hispanicLatino === 'yes' && (
      <div>
        <Label>Hispanic/Latino Background</Label>
        <Select value={data.hispanicBackground || ''} onValueChange={(value) => updateData({ hispanicBackground: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select background" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mexican">Mexican</SelectItem>
            <SelectItem value="cuban">Cuban</SelectItem>
            <SelectItem value="puerto-rican">Puerto Rican</SelectItem>
            <SelectItem value="other">Other Hispanic/Latino</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )}

    <div>
      <Label>Race/Ethnicity (Select all that apply)</Label>
      <div className="mt-2 space-y-2">
        {[
          { value: 'american-indian', label: 'American Indian or Alaska Native' },
          { value: 'asian', label: 'Asian' },
          { value: 'black', label: 'Black or African American' },
          { value: 'native-hawaiian', label: 'Native Hawaiian or Pacific Islander' },
          { value: 'white', label: 'White' },
          { value: 'other', label: 'Other' },
          { value: 'prefer-not-to-say', label: 'Prefer not to say' }
        ].map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox 
              id={`race-${option.value}`}
              checked={data.raceEthnicity.includes(option.value)}
              onCheckedChange={(checked) => {
                if (checked) {
                  updateData({ raceEthnicity: [...data.raceEthnicity, option.value] });
                } else {
                  updateData({ raceEthnicity: data.raceEthnicity.filter(r => r !== option.value) });
                }
              }}
            />
            <Label htmlFor={`race-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </div>
    </div>

    <div>
      <Label>Citizenship Status</Label>
      <Select value={data.citizenshipStatus} onValueChange={(value) => updateData({ citizenshipStatus: value })}>
        <SelectTrigger>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="us-citizen">US Citizen</SelectItem>
          <SelectItem value="permanent-resident">Permanent Resident</SelectItem>
          <SelectItem value="international-student">International Student</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label>Primary Language Spoken at Home</Label>
        <Input
          value={data.primaryLanguage}
          onChange={(e) => updateData({ primaryLanguage: e.target.value })}
          placeholder="English"
        />
      </div>
      <div>
        <Label>Years Lived in United States</Label>
        <Input
          type="number"
          value={data.yearsInUS || ''}
          onChange={(e) => updateData({ yearsInUS: parseInt(e.target.value) || undefined })}
          placeholder="Number of years"
        />
      </div>
    </div>
  </div>
);

const FamilyContextStep: React.FC<{ 
  data: PersonalInformationData; 
  updateData: (updates: Partial<PersonalInformationData>) => void;
  updateNestedField: (path: string[], value: any) => void;
}> = ({ data, updateData, updateNestedField }) => (
  <div className="space-y-6">
    <div>
      <Label>Current Living Situation</Label>
      <Select value={data.livingSituation} onValueChange={(value) => updateData({ livingSituation: value })}>
        <SelectTrigger>
          <SelectValue placeholder="Select living situation" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="both-parents">Both parents</SelectItem>
          <SelectItem value="single-parent">Single parent</SelectItem>
          <SelectItem value="grandparents">Grandparents</SelectItem>
          <SelectItem value="guardian">Guardian</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label>Household Size Range</Label>
        <Select value={data.householdSize} onValueChange={(value) => updateData({ householdSize: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-2">1-2 people</SelectItem>
            <SelectItem value="3-4">3-4 people</SelectItem>
            <SelectItem value="5-6">5-6 people</SelectItem>
            <SelectItem value="7+">7+ people</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Annual Household Income Range</Label>
        <Select value={data.householdIncome} onValueChange={(value) => updateData({ householdIncome: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="<30k">Less than $30,000</SelectItem>
            <SelectItem value="30k-60k">$30,000 - $60,000</SelectItem>
            <SelectItem value="60k-100k">$60,000 - $100,000</SelectItem>
            <SelectItem value="100k-150k">$100,000 - $150,000</SelectItem>
            <SelectItem value=">150k">More than $150,000</SelectItem>
            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <Separator />

    <div>
      <h4 className="text-lg font-medium mb-4">Parent/Guardian Information</h4>
      {[0, 1].map((index) => (
        <div key={index} className="space-y-4 p-4 border rounded-lg mb-4">
          <h5 className="font-medium">Parent/Guardian {index + 1}</h5>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Relationship to you</Label>
              <Input
                value={data.parentGuardians[index]?.relationship || ''}
                onChange={(e) => updateNestedField(['parentGuardians', index.toString(), 'relationship'], e.target.value)}
                placeholder="Mother, Father, Guardian, etc."
              />
            </div>
            <div>
              <Label>Highest Education Level</Label>
              <Select 
                value={data.parentGuardians[index]?.educationLevel || ''} 
                onValueChange={(value) => updateNestedField(['parentGuardians', index.toString(), 'educationLevel'], value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="less-than-high-school">Less than high school</SelectItem>
                  <SelectItem value="high-school">High school diploma/GED</SelectItem>
                  <SelectItem value="some-college">Some college</SelectItem>
                  <SelectItem value="associates">Associate's degree</SelectItem>
                  <SelectItem value="bachelors">Bachelor's degree</SelectItem>
                  <SelectItem value="masters">Master's degree</SelectItem>
                  <SelectItem value="professional">Professional degree</SelectItem>
                  <SelectItem value="doctorate">Doctorate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>General Occupation Category</Label>
              <Input
                value={data.parentGuardians[index]?.occupation || ''}
                onChange={(e) => updateNestedField(['parentGuardians', index.toString(), 'occupation'], e.target.value)}
                placeholder="Healthcare, Education, Business, etc."
              />
            </div>
            <div>
              <Label>Contact Information (optional)</Label>
              <Input
                value={data.parentGuardians[index]?.contactInfo || ''}
                onChange={(e) => updateNestedField(['parentGuardians', index.toString(), 'contactInfo'], e.target.value)}
                placeholder="Email or phone (optional)"
              />
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label>Number of Siblings</Label>
        <Input
          type="number"
          min="0"
          value={data.numberOfSiblings}
          onChange={(e) => updateData({ numberOfSiblings: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div>
        <Label>Siblings' General Education Status</Label>
        <Input
          value={data.siblingsEducation}
          onChange={(e) => updateData({ siblingsEducation: e.target.value })}
          placeholder="High school, college, working, etc."
        />
      </div>
    </div>
  </div>
);