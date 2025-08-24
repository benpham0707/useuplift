import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PersonalBasicsData } from '../types';

interface PersonalBasicsStepProps {
  data: PersonalBasicsData;
  onChange: (data: PersonalBasicsData) => void;
}

const ETHNICITY_OPTIONS = [
  'American Indian or Alaska Native',
  'Asian',
  'Black or African American',
  'Hispanic/Latino',
  'Native Hawaiian or Other Pacific Islander',
  'White',
  'Other'
];

const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to answer',
  'Prefer to self-describe'
];

export default function PersonalBasicsStep({ data, onChange }: PersonalBasicsStepProps) {
  const updateField = (field: keyof PersonalBasicsData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateNestedField = (parent: keyof PersonalBasicsData, field: string, value: any) => {
    onChange({
      ...data,
      [parent]: {
        ...(data[parent] as any),
        [field]: value
      }
    });
  };

  const handleEthnicityChange = (ethnicity: string, checked: boolean) => {
    const currentEthnicity = data.demographics.ethnicity;
    const newEthnicity = checked
      ? [...currentEthnicity, ethnicity]
      : currentEthnicity.filter(e => e !== ethnicity);
    
    updateNestedField('demographics', 'ethnicity', newEthnicity);
  };

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={data.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={data.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              placeholder="Enter your last name"
            />
          </div>
          <div>
            <Label htmlFor="preferredName">Preferred Name</Label>
            <Input
              id="preferredName"
              value={data.preferredName || ''}
              onChange={(e) => updateField('preferredName', e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label htmlFor="pronouns">Pronouns</Label>
            <Input
              id="pronouns"
              value={data.pronouns || ''}
              onChange={(e) => updateField('pronouns', e.target.value)}
              placeholder="e.g., they/them, she/her, he/him"
            />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={data.dateOfBirth || ''}
              onChange={(e) => updateField('dateOfBirth', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={data.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="your.email@example.com"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={data.address.street || ''}
              onChange={(e) => updateNestedField('address', 'street', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={data.address.city || ''}
              onChange={(e) => updateNestedField('address', 'city', e.target.value)}
              placeholder="Enter city"
            />
          </div>
          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={data.address.state || ''}
              onChange={(e) => updateNestedField('address', 'state', e.target.value)}
              placeholder="Enter state/province"
            />
          </div>
          <div>
            <Label htmlFor="zip">ZIP/Postal Code</Label>
            <Input
              id="zip"
              value={data.address.zip || ''}
              onChange={(e) => updateNestedField('address', 'zip', e.target.value)}
              placeholder="12345"
            />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Select
              value={data.address.country}
              onValueChange={(value) => updateNestedField('address', 'country', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USA">United States</SelectItem>
                <SelectItem value="CAN">Canada</SelectItem>
                <SelectItem value="MEX">Mexico</SelectItem>
                <SelectItem value="GBR">United Kingdom</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Demographics (Optional)</h3>
        
        {/* Ethnicity */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">Race/Ethnicity</Label>
          <p className="text-sm text-muted-foreground mb-3">
            You may select one or more categories below. This information is used for statistical purposes and will not affect admission decisions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ETHNICITY_OPTIONS.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`ethnicity-${option}`}
                  checked={data.demographics.ethnicity.includes(option)}
                  onCheckedChange={(checked) => handleEthnicityChange(option, checked as boolean)}
                />
                <Label htmlFor={`ethnicity-${option}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">Gender</Label>
          <RadioGroup
            value={data.demographics.gender || ''}
            onValueChange={(value) => updateNestedField('demographics', 'gender', value)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {GENDER_OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`gender-${option}`} />
                  <Label htmlFor={`gender-${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* LGBTQ+ */}
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="lgbtq"
              checked={data.demographics.lgbtq || false}
              onCheckedChange={(checked) => updateNestedField('demographics', 'lgbtq', checked)}
            />
            <Label htmlFor="lgbtq" className="text-sm">
              I identify as a member of the LGBTQIA+ community (optional)
            </Label>
          </div>
        </div>

        {/* First Generation */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">First-Generation College Student</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Will you be the first in your family to attend college?
          </p>
          <RadioGroup
            value={data.demographics.firstGen}
            onValueChange={(value) => updateNestedField('demographics', 'firstGen', value as 'yes' | 'no' | 'unsure')}
          >
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="firstgen-yes" />
                <Label htmlFor="firstgen-yes" className="text-sm">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="firstgen-no" />
                <Label htmlFor="firstgen-no" className="text-sm">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unsure" id="firstgen-unsure" />
                <Label htmlFor="firstgen-unsure" className="text-sm">Unsure</Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Languages */}
        <div>
          <Label htmlFor="languages" className="text-base font-medium">Languages Spoken</Label>
          <p className="text-sm text-muted-foreground mb-2">
            List all languages you speak (separate with commas)
          </p>
          <Input
            id="languages"
            value={data.demographics.languages.join(', ')}
            onChange={(e) => updateNestedField('demographics', 'languages', 
              e.target.value.split(',').map(lang => lang.trim()).filter(Boolean)
            )}
            placeholder="e.g., English, Spanish, Mandarin"
          />
        </div>
      </div>
    </div>
  );
}