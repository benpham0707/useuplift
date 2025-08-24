import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2 } from 'lucide-react';
import type { AwardsRecognitionData, Award } from '../types';

interface AwardsRecognitionStepProps {
  data: AwardsRecognitionData;
  onChange: (data: AwardsRecognitionData) => void;
}

const AWARD_CATEGORIES = [
  'Award or honor',
  'Athletic recognition',
  'Community service award',
  'Leadership award',
  'Academic honor',
  'Art/Creative award',
  'Music award',
  'Publication',
  'Research recognition',
  'Scholarship',
  'Other'
];

const RECOGNITION_LEVELS = [
  'School',
  'City / Community',
  'State',
  'Regional',
  'National',
  'International'
];

const GRADE_OPTIONS = ['9th grade', '10th grade', '11th grade', '12th grade', 'After 12th grade'];

export default function AwardsRecognitionStep({ data, onChange }: AwardsRecognitionStepProps) {
  const addAward = () => {
    const newAward: Award = {
      id: Date.now().toString(),
      name: '',
      category: '',
      levelOfRecognition: [],
      type: 'academic',
      gradeReceived: [],
      eligibilityRequirements: '',
      description: ''
    };
    onChange({
      ...data,
      awards: [...data.awards, newAward]
    });
  };

  const updateAward = (id: string, field: keyof Award, value: any) => {
    onChange({
      ...data,
      awards: data.awards.map(award =>
        award.id === id ? { ...award, [field]: value } : award
      )
    });
  };

  const removeAward = (id: string) => {
    onChange({
      ...data,
      awards: data.awards.filter(award => award.id !== id)
    });
  };

  const handleRecognitionLevelChange = (awardId: string, level: string, checked: boolean) => {
    const award = data.awards.find(a => a.id === awardId);
    if (!award) return;

    const newLevels = checked
      ? [...award.levelOfRecognition, level]
      : award.levelOfRecognition.filter(l => l !== level);
    
    updateAward(awardId, 'levelOfRecognition', newLevels);
  };

  const handleGradeChange = (awardId: string, grade: string, checked: boolean) => {
    const award = data.awards.find(a => a.id === awardId);
    if (!award) return;

    const newGrades = checked
      ? [...award.gradeReceived, grade]
      : award.gradeReceived.filter(g => g !== grade);
    
    updateAward(awardId, 'gradeReceived', newGrades);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          List any honors, awards, or recognition you have received during high school or after. 
          Include academic honors, athletic awards, community service recognition, and any other achievements.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Awards & Recognition</h3>
        <Button onClick={addAward} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Award
        </Button>
      </div>

      {data.awards.map((award, index) => (
        <Card key={award.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Award/Honor #{index + 1}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeAward(award.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select
                  value={award.category}
                  onValueChange={(value) => updateAward(award.id, 'category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {AWARD_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Award/Honor Name *</Label>
                <Input
                  value={award.name}
                  onChange={(e) => updateAward(award.id, 'name', e.target.value)}
                  placeholder="What's the name of the award or honor?"
                />
              </div>
            </div>

            {/* Level of Recognition */}
            <div>
              <Label className="text-base font-medium mb-3 block">Level of recognition *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {RECOGNITION_LEVELS.map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${award.id}-level-${level}`}
                      checked={award.levelOfRecognition.includes(level)}
                      onCheckedChange={(checked) => handleRecognitionLevelChange(award.id, level, checked as boolean)}
                    />
                    <Label htmlFor={`${award.id}-level-${level}`} className="text-sm">
                      {level}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Type of Award */}
            <div>
              <Label className="text-base font-medium mb-3 block">Type of award or honor *</Label>
              <RadioGroup
                value={award.type}
                onValueChange={(value) => updateAward(award.id, 'type', value as 'academic' | 'non-academic')}
              >
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="academic" id={`${award.id}-academic`} className="mt-1" />
                    <div>
                      <Label htmlFor={`${award.id}-academic`} className="text-sm font-medium">
                        Academic
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Honor societies, academic competitions & programs, grade-based & department awards
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="non-academic" id={`${award.id}-non-academic`} className="mt-1" />
                    <div>
                      <Label htmlFor={`${award.id}-non-academic`} className="text-sm font-medium">
                        Non-academic
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Athletics, leadership, volunteering/community service
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* When Received */}
            <div>
              <Label className="text-base font-medium mb-3 block">When did you receive it? *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                If you received an award during the summer, select the grade you were in before that summer.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {GRADE_OPTIONS.map((grade) => (
                  <div key={grade} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${award.id}-grade-${grade}`}
                      checked={award.gradeReceived.includes(grade)}
                      onCheckedChange={(checked) => handleGradeChange(award.id, grade, checked as boolean)}
                    />
                    <Label htmlFor={`${award.id}-grade-${grade}`} className="text-sm">
                      {grade}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Eligibility Requirements */}
            <div>
              <Label>What are the eligibility requirements for this award or honor? *</Label>
              <p className="text-sm text-muted-foreground mb-2">
                For example: How are award recipients chosen? How many people are selected to receive the award? 
                Is there an application or nomination for the award?
              </p>
              <Textarea
                value={award.eligibilityRequirements || ''}
                onChange={(e) => updateAward(award.id, 'eligibilityRequirements', e.target.value)}
                placeholder="Describe the eligibility requirements and selection process..."
                rows={3}
              />
            </div>

            {/* Additional Description */}
            <div>
              <Label>Additional Details (Optional)</Label>
              <Textarea
                value={award.description || ''}
                onChange={(e) => updateAward(award.id, 'description', e.target.value)}
                placeholder="Provide any additional context about this award or honor..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {data.awards.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No awards or recognition added yet. Click "Add Award" to get started.</p>
          <p className="text-sm mt-2">
            Don't worry if you don't have any awards yet - this section is optional and you can always add them later.
          </p>
        </div>
      )}
    </div>
  );
}