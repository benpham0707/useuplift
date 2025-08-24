import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { AcademicJourneyData } from '../types';

interface AcademicJourneyStepProps {
  data: AcademicJourneyData;
  onChange: (data: AcademicJourneyData) => void;
}

const SCHOOL_TYPES = [
  'Public',
  'Private (non-religious)',
  'Private (religious)',
  'Charter',
  'Magnet',
  'Homeschool',
  'Online',
  'Other'
];

const GPA_SCALES = ['4.0', '5.0', '6.0', '100', 'Other'];

export default function AcademicJourneyStep({ data, onChange }: AcademicJourneyStepProps) {
  const [activeTab, setActiveTab] = useState('school');

  const updateField = (field: keyof AcademicJourneyData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateNestedField = (parent: keyof AcademicJourneyData, field: string, value: any) => {
    onChange({
      ...data,
      [parent]: {
        ...(data[parent] as any),
        [field]: value
      }
    });
  };

  const addCourse = (type: 'apCourses' | 'ibCourses' | 'dualEnrollment' | 'honors') => {
    const courses = data.coursework[type];
    updateNestedField('coursework', type, [...courses, '']);
  };

  const updateCourse = (type: 'apCourses' | 'ibCourses' | 'dualEnrollment' | 'honors', index: number, value: string) => {
    const courses = [...data.coursework[type]];
    courses[index] = value;
    updateNestedField('coursework', type, courses);
  };

  const removeCourse = (type: 'apCourses' | 'ibCourses' | 'dualEnrollment' | 'honors', index: number) => {
    const courses = data.coursework[type].filter((_, i) => i !== index);
    updateNestedField('coursework', type, courses);
  };

  const addSubjectTest = () => {
    const newTest = { subject: '', score: '', date: '' };
    updateNestedField('testScores', 'subjectTests', [...data.testScores.subjectTests, newTest]);
  };

  const updateSubjectTest = (index: number, field: string, value: string) => {
    const tests = [...data.testScores.subjectTests];
    tests[index] = { ...tests[index], [field]: value };
    updateNestedField('testScores', 'subjectTests', tests);
  };

  const removeSubjectTest = (index: number) => {
    const tests = data.testScores.subjectTests.filter((_, i) => i !== index);
    updateNestedField('testScores', 'subjectTests', tests);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Tell us about your academic background, including your school, grades, coursework, and test scores.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="school">Current School</TabsTrigger>
          <TabsTrigger value="grades">Grades & Ranking</TabsTrigger>
          <TabsTrigger value="coursework">Coursework</TabsTrigger>
          <TabsTrigger value="tests">Test Scores</TabsTrigger>
        </TabsList>

        <TabsContent value="school" className="space-y-4">
          <h3 className="text-lg font-semibold">Current School Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="schoolName">School Name *</Label>
              <Input
                id="schoolName"
                value={data.currentSchool.name}
                onChange={(e) => updateNestedField('currentSchool', 'name', e.target.value)}
                placeholder="Enter your school's full name"
              />
            </div>
            
            <div>
              <Label htmlFor="schoolType">School Type</Label>
              <Select
                value={data.currentSchool.type}
                onValueChange={(value) => updateNestedField('currentSchool', 'type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select school type" />
                </SelectTrigger>
                <SelectContent>
                  {SCHOOL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ceebCode">CEEB Code (Optional)</Label>
              <Input
                id="ceebCode"
                value={data.currentSchool.ceebCode || ''}
                onChange={(e) => updateNestedField('currentSchool', 'ceebCode', e.target.value)}
                placeholder="e.g., 123456"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your school's 6-digit College Entrance Examination Board code
              </p>
            </div>

            <div>
              <Label htmlFor="schoolCity">City</Label>
              <Input
                id="schoolCity"
                value={data.currentSchool.city || ''}
                onChange={(e) => updateNestedField('currentSchool', 'city', e.target.value)}
                placeholder="School city"
              />
            </div>

            <div>
              <Label htmlFor="schoolState">State/Province</Label>
              <Input
                id="schoolState"
                value={data.currentSchool.state || ''}
                onChange={(e) => updateNestedField('currentSchool', 'state', e.target.value)}
                placeholder="School state/province"
              />
            </div>

            <div>
              <Label htmlFor="schoolCountry">Country</Label>
              <Select
                value={data.currentSchool.country}
                onValueChange={(value) => updateNestedField('currentSchool', 'country', value)}
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
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <h3 className="text-lg font-semibold">Academic Performance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GPA Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Grade Point Average (GPA)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="gpaValue">Current GPA</Label>
                  <Input
                    id="gpaValue"
                    type="number"
                    step="0.01"
                    value={data.gpa.value || ''}
                    onChange={(e) => updateNestedField('gpa', 'value', e.target.value)}
                    placeholder="e.g., 3.75"
                  />
                </div>

                <div>
                  <Label htmlFor="gpaScale">GPA Scale</Label>
                  <Select
                    value={data.gpa.scale}
                    onValueChange={(value) => updateNestedField('gpa', 'scale', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GPA_SCALES.map((scale) => (
                        <SelectItem key={scale} value={scale}>
                          {scale}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weightedGPA"
                    checked={data.gpa.weighted || false}
                    onCheckedChange={(checked) => updateNestedField('gpa', 'weighted', checked)}
                  />
                  <Label htmlFor="weightedGPA" className="text-sm">
                    This is a weighted GPA
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Class Rank Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Class Rank</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="classRank">Your Rank</Label>
                  <Input
                    id="classRank"
                    type="number"
                    value={data.classRank.rank || ''}
                    onChange={(e) => updateNestedField('classRank', 'rank', e.target.value)}
                    placeholder="e.g., 15"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank if your school doesn't rank
                  </p>
                </div>

                <div>
                  <Label htmlFor="classSize">Class Size</Label>
                  <Input
                    id="classSize"
                    type="number"
                    value={data.classRank.classSize || ''}
                    onChange={(e) => updateNestedField('classRank', 'classSize', e.target.value)}
                    placeholder="e.g., 250"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coursework" className="space-y-4">
          <h3 className="text-lg font-semibold">Advanced Coursework</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AP Courses */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">AP Courses</CardTitle>
                  <Button onClick={() => addCourse('apCourses')} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.coursework.apCourses.map((course, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={course}
                      onChange={(e) => updateCourse('apCourses', index, e.target.value)}
                      placeholder="e.g., AP Calculus BC"
                    />
                    <Button
                      onClick={() => removeCourse('apCourses', index)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {data.coursework.apCourses.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No AP courses added
                  </p>
                )}
              </CardContent>
            </Card>

            {/* IB Courses */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">IB Courses</CardTitle>
                  <Button onClick={() => addCourse('ibCourses')} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.coursework.ibCourses.map((course, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={course}
                      onChange={(e) => updateCourse('ibCourses', index, e.target.value)}
                      placeholder="e.g., IB Mathematics HL"
                    />
                    <Button
                      onClick={() => removeCourse('ibCourses', index)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {data.coursework.ibCourses.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No IB courses added
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Dual Enrollment */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Dual Enrollment</CardTitle>
                  <Button onClick={() => addCourse('dualEnrollment')} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.coursework.dualEnrollment.map((course, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={course}
                      onChange={(e) => updateCourse('dualEnrollment', index, e.target.value)}
                      placeholder="e.g., College Algebra"
                    />
                    <Button
                      onClick={() => removeCourse('dualEnrollment', index)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {data.coursework.dualEnrollment.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No dual enrollment courses added
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Honors Courses */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Honors Courses</CardTitle>
                  <Button onClick={() => addCourse('honors')} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.coursework.honors.map((course, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={course}
                      onChange={(e) => updateCourse('honors', index, e.target.value)}
                      placeholder="e.g., Honors Chemistry"
                    />
                    <Button
                      onClick={() => removeCourse('honors', index)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {data.coursework.honors.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No honors courses added
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <h3 className="text-lg font-semibold">Standardized Test Scores</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SAT Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SAT</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="satScore">Composite Score</Label>
                  <Input
                    id="satScore"
                    type="number"
                    min="400"
                    max="1600"
                    value={data.testScores.sat?.score || ''}
                    onChange={(e) => updateNestedField('testScores', 'sat', { 
                      ...data.testScores.sat, 
                      score: e.target.value 
                    })}
                    placeholder="e.g., 1450"
                  />
                </div>
                <div>
                  <Label htmlFor="satDate">Test Date</Label>
                  <Input
                    id="satDate"
                    type="month"
                    value={data.testScores.sat?.date || ''}
                    onChange={(e) => updateNestedField('testScores', 'sat', { 
                      ...data.testScores.sat, 
                      date: e.target.value 
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ACT Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ACT</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="actScore">Composite Score</Label>
                  <Input
                    id="actScore"
                    type="number"
                    min="1"
                    max="36"
                    value={data.testScores.act?.score || ''}
                    onChange={(e) => updateNestedField('testScores', 'act', { 
                      ...data.testScores.act, 
                      score: e.target.value 
                    })}
                    placeholder="e.g., 32"
                  />
                </div>
                <div>
                  <Label htmlFor="actDate">Test Date</Label>
                  <Input
                    id="actDate"
                    type="month"
                    value={data.testScores.act?.date || ''}
                    onChange={(e) => updateNestedField('testScores', 'act', { 
                      ...data.testScores.act, 
                      date: e.target.value 
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Tests */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">SAT Subject Tests</CardTitle>
                <Button onClick={addSubjectTest} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject Test
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.testScores.subjectTests.map((test, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>Subject</Label>
                    <Input
                      value={test.subject}
                      onChange={(e) => updateSubjectTest(index, 'subject', e.target.value)}
                      placeholder="e.g., Math Level 2"
                    />
                  </div>
                  <div>
                    <Label>Score</Label>
                    <Input
                      type="number"
                      min="200"
                      max="800"
                      value={test.score}
                      onChange={(e) => updateSubjectTest(index, 'score', e.target.value)}
                      placeholder="e.g., 750"
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="month"
                      value={test.date}
                      onChange={(e) => updateSubjectTest(index, 'date', e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => removeSubjectTest(index)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {data.testScores.subjectTests.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No subject tests added
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}