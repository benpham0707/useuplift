import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CommunityFamilyData } from '../types';

interface CommunityFamilyStepProps {
  data: CommunityFamilyData;
  onChange: (data: CommunityFamilyData) => void;
}

const EDUCATION_LEVELS = [
  'No formal education',
  'Some high school',
  'High school diploma/GED',
  'Some college',
  'Associate degree',
  'Bachelor\'s degree',
  'Master\'s degree',
  'Doctoral degree',
  'Professional degree (JD, MD, etc.)',
  'Unknown/Prefer not to answer'
];

export default function CommunityFamilyStep({ data, onChange }: CommunityFamilyStepProps) {
  const updateNestedField = (parent: keyof CommunityFamilyData, field: string, value: any) => {
    onChange({
      ...data,
      [parent]: {
        ...(data[parent] as any),
        [field]: value
      }
    });
  };

  const updateDeeplyNestedField = (parent: keyof CommunityFamilyData, nested: string, field: string, value: any) => {
    onChange({
      ...data,
      [parent]: {
        ...(data[parent] as any),
        [nested]: {
          ...((data[parent] as any)[nested] as any),
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-muted-foreground">
          This information helps colleges understand your family background and any circumstances that may have affected your academic journey.
        </p>
      </div>

      {/* Family Information */}
      <Card>
        <CardHeader>
          <CardTitle>Family Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Parent Education */}
          <div>
            <h4 className="text-base font-semibold mb-4">Parent/Guardian Education</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Parent 1 */}
              <div className="space-y-4">
                <h5 className="text-sm font-medium text-muted-foreground">Parent/Guardian 1</h5>
                
                <div>
                  <Label>Highest Level of Education</Label>
                  <Select
                    value={data.family.parentEducation.parent1.degree || ''}
                    onValueChange={(value) => updateDeeplyNestedField('family', 'parentEducation', 'parent1', {
                      ...data.family.parentEducation.parent1,
                      degree: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>College/University Attended (if applicable)</Label>
                  <Input
                    value={data.family.parentEducation.parent1.college || ''}
                    onChange={(e) => updateDeeplyNestedField('family', 'parentEducation', 'parent1', {
                      ...data.family.parentEducation.parent1,
                      college: e.target.value
                    })}
                    placeholder="Name of institution"
                  />
                </div>
              </div>

              {/* Parent 2 */}
              <div className="space-y-4">
                <h5 className="text-sm font-medium text-muted-foreground">Parent/Guardian 2</h5>
                
                <div>
                  <Label>Highest Level of Education</Label>
                  <Select
                    value={data.family.parentEducation.parent2.degree || ''}
                    onValueChange={(value) => updateDeeplyNestedField('family', 'parentEducation', 'parent2', {
                      ...data.family.parentEducation.parent2,
                      degree: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>College/University Attended (if applicable)</Label>
                  <Input
                    value={data.family.parentEducation.parent2.college || ''}
                    onChange={(e) => updateDeeplyNestedField('family', 'parentEducation', 'parent2', {
                      ...data.family.parentEducation.parent2,
                      college: e.target.value
                    })}
                    placeholder="Name of institution"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Household Information */}
          <div>
            <h4 className="text-base font-semibold mb-4">Household Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Household Size</Label>
                <Input
                  type="number"
                  min="1"
                  value={data.family.householdSize || ''}
                  onChange={(e) => updateNestedField('family', 'householdSize', e.target.value)}
                  placeholder="Number of people in household"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Include yourself and all people supported by your family's income
                </p>
              </div>

              <div>
                <Label>Number of Dependents</Label>
                <Input
                  type="number"
                  min="0"
                  value={data.family.dependents || ''}
                  onChange={(e) => updateNestedField('family', 'dependents', e.target.value)}
                  placeholder="Number of dependents"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  People supported by your family (excluding parents)
                </p>
              </div>

              <div>
                <Label>Annual Family Income Range (Optional)</Label>
                <Select
                  value={data.family.income || ''}
                  onValueChange={(value) => updateNestedField('family', 'income', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_30k">Under $30,000</SelectItem>
                    <SelectItem value="30k_60k">$30,000 - $60,000</SelectItem>
                    <SelectItem value="60k_100k">$60,000 - $100,000</SelectItem>
                    <SelectItem value="100k_150k">$100,000 - $150,000</SelectItem>
                    <SelectItem value="150k_plus">Over $150,000</SelectItem>
                    <SelectItem value="prefer_not_to_answer">Prefer not to answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Circumstances */}
      <Card>
        <CardHeader>
          <CardTitle>Special Circumstances</CardTitle>
          <p className="text-sm text-muted-foreground">
            Check any that apply to your situation. This information helps colleges understand any challenges you may have faced.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fosterCare"
                checked={data.circumstances.fosterCare || false}
                onCheckedChange={(checked) => updateNestedField('circumstances', 'fosterCare', checked)}
              />
              <Label htmlFor="fosterCare" className="text-sm">
                I have been in foster care
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="homeless"
                checked={data.circumstances.homeless || false}
                onCheckedChange={(checked) => updateNestedField('circumstances', 'homeless', checked)}
              />
              <Label htmlFor="homeless" className="text-sm">
                I have experienced homelessness
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ward"
                checked={data.circumstances.ward || false}
                onCheckedChange={(checked) => updateNestedField('circumstances', 'ward', checked)}
              />
              <Label htmlFor="ward" className="text-sm">
                I am/was a ward of the court
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="refugee"
                checked={data.circumstances.refugee || false}
                onCheckedChange={(checked) => updateNestedField('circumstances', 'refugee', checked)}
              />
              <Label htmlFor="refugee" className="text-sm">
                I am a refugee or asylum seeker
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="military"
                checked={data.circumstances.military || false}
                onCheckedChange={(checked) => updateNestedField('circumstances', 'military', checked)}
              />
              <Label htmlFor="military" className="text-sm">
                I am a military dependent/veteran
              </Label>
            </div>
          </div>

          <div>
            <Label>Additional Information</Label>
            <Textarea
              value={data.circumstances.additionalInfo || ''}
              onChange={(e) => updateNestedField('circumstances', 'additionalInfo', e.target.value)}
              placeholder="Describe any other circumstances that have significantly impacted your academic journey or personal development..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This could include family responsibilities, health challenges, economic hardship, or other significant life events.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}