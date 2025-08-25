import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, ArrowRight, ArrowLeft, GraduationCap, X, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AcademicJourneyData {
  // Current School
  schoolName: string;
  schoolType: string;
  schoolCity: string;
  schoolState: string;
  schoolCountry: string;
  currentGrade: string;
  expectedGraduation: string;
  willGraduateFromSchool: boolean;
  isBoardingSchool: boolean;
  
  // Academic Performance
  cumulativeGPA: string;
  gpaScale: string;
  gpaType: string;
  schoolRanksStudents: string;
  classRank: string;
  totalClassSize: string;
  
  // Other Schools
  otherSchoolsAttended: number;
  previousSchools: Array<{
    id: string;
    name: string;
    cityState: string;
    startDate: string;
    endDate: string;
    reasonForLeaving: string;
  }>;
  studiedAbroad: boolean;
  beenHomeschooled: boolean;
  
  // Course History - Restructured to match reference
  academicYears: Array<{
    id: string;
    year: string; // e.g., "2022 - 2023"
    gradeLevel: string; // e.g., "9th", "10th"
    subjects: {
      [subjectName: string]: {
        courses: Array<{
          name: string;
          honorsType: string; // AP, IB, Honors, NH (No Honors)
          selected: boolean;
          grade1?: string;
          grade2?: string;
        }>;
      };
    };
    tookSummerCourses: boolean;
  }>;
  tookMathEarly: boolean;
  tookLanguageEarly: boolean;
  
  // College Coursework
  collegeCoursesTaken: number;
  collegeCoursework: Array<{
    id: string;
    college: string;
    setting: string;
    courseName: string;
    termYear: string;
    grade: string;
    courseType: string;
  }>;
  
  // Standardized Testing
  reportTestScores: boolean;
  sat: {
    readingWriting: string;
    math: string;
    total: string;
    testDate: string;
    timesTaken: number;
  };
  act: {
    english: string;
    math: string;
    reading: string;
    science: string;
    composite: string;
    testDate: string;
    timesTaken: number;
  };
  
  // AP Exams
  takingAPExams: boolean;
  apExams: Array<{
    id: string;
    subject: string;
    date: string;
    score: string;
  }>;
  
  // IB Programme
  inIBProgramme: boolean;
  ibExams: Array<{
    id: string;
    subject: string;
    level: string;
    score: string;
    examDate: string;
  }>;
  
  // English Proficiency
  needEnglishProficiency: boolean;
  englishProficiency: {
    testType: string;
    testDate: string;
    scores: string;
    planToRetake: boolean;
  };
}

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, title: 'Current School', description: 'Basic school information and graduation plans' },
  { id: 2, title: 'Academic Performance', description: 'GPA, class rank, and academic standing' },
  { id: 3, title: 'Other Schools Attended', description: 'Previous schools and study abroad experience' },
  { id: 4, title: 'Course History', description: 'Current and completed coursework by subject' },
  { id: 5, title: 'College Coursework', description: 'College courses taken during high school' },
  { id: 6, title: 'Standardized Testing', description: 'SAT, ACT, and other test scores' },
  { id: 7, title: 'AP Exams', description: 'Advanced Placement exam scores' },
  { id: 8, title: 'IB Programme', description: 'International Baccalaureate coursework and scores' },
  { id: 9, title: 'English Proficiency', description: 'English proficiency test scores (if applicable)' }
];

const AcademicJourneyWizard: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock data for demonstration - replace with actual form state management
  const [data, setData] = useState<AcademicJourneyData>({
    schoolName: '',
    schoolType: '',
    schoolCity: '',
    schoolState: '',
    schoolCountry: 'United States',
    currentGrade: '',
    expectedGraduation: '',
    willGraduateFromSchool: true,
    isBoardingSchool: false,
    cumulativeGPA: '',
    gpaScale: '4.0',
    gpaType: 'weighted',
    schoolRanksStudents: 'none',
    classRank: '',
    totalClassSize: '',
    otherSchoolsAttended: 0,
    previousSchools: [],
    studiedAbroad: false,
    beenHomeschooled: false,
    academicYears: [],
    tookMathEarly: false,
    tookLanguageEarly: false,
    collegeCoursesTaken: 0,
    collegeCoursework: [],
    reportTestScores: false,
    sat: {
      readingWriting: '',
      math: '',
      total: '',
      testDate: '',
      timesTaken: 0
    },
    act: {
      english: '',
      math: '',
      reading: '',
      science: '',
      composite: '',
      testDate: '',
      timesTaken: 0
    },
    takingAPExams: false,
    apExams: [],
    inIBProgramme: false,
    ibExams: [],
    needEnglishProficiency: false,
    englishProficiency: {
      testType: '',
      testDate: '',
      scores: '',
      planToRetake: false
    }
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

      // Create a lightweight academic summary
      const academicSummary = `Grade: ${data.currentGrade}, School: ${data.schoolName}, GPA: ${data.cumulativeGPA || 'N/A'}`;
      
      // Update profiles with minimal data to avoid timeouts
      const { error } = await supabase
        .from('profiles')
        .update({
          // Store just essential info to avoid timeout
          narrative_summary: academicSummary,
          completion_score: 30 // Update completion score
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Academic journey saved!",
        description: "Your academic information has been successfully recorded.",
      });

      onComplete();
    } catch (error) {
      console.error('Error saving academic journey:', error);
      toast({
        title: "Error saving academic journey",
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
        return <CurrentSchoolStep data={data} setData={setData} />;
      case 2:
        return <AcademicPerformanceStep data={data} setData={setData} />;
      case 3:
        return <OtherSchoolsStep data={data} setData={setData} />;
      case 4:
        return <CourseHistoryStep data={data} setData={setData} />;
      case 5:
        return <CollegeCourseworkStep data={data} setData={setData} />;
      case 6:
        return <StandardizedTestingStep data={data} setData={setData} />;
      case 7:
        return <APExamsStep data={data} setData={setData} />;
      case 8:
        return <IBProgrammeStep data={data} setData={setData} />;
      case 9:
        return <EnglishProficiencyStep data={data} setData={setData} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Academic Journey</h2>
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
            {isLoading ? 'Saving...' : 'Complete Academic Journey'}
          </Button>
        )}
      </div>
    </div>
  );
};

// Step Components
const CurrentSchoolStep: React.FC<{ data: AcademicJourneyData; setData: (data: AcademicJourneyData) => void }> = ({ data, setData }) => (
  <div className="space-y-6">
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="school-name">School Name *</Label>
        <Input
          id="school-name"
          value={data.schoolName}
          onChange={(e) => setData({ ...data, schoolName: e.target.value })}
          placeholder="Enter your school name"
        />
      </div>
      <div>
        <Label htmlFor="school-type">School Type *</Label>
        <Select value={data.schoolType} onValueChange={(value) => setData({ ...data, schoolType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select school type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="charter">Charter</SelectItem>
            <SelectItem value="homeschool">Homeschool</SelectItem>
            <SelectItem value="international">International</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="grid md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="school-city">City *</Label>
        <Input
          id="school-city"
          value={data.schoolCity}
          onChange={(e) => setData({ ...data, schoolCity: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="school-state">State *</Label>
        <Input
          id="school-state"
          value={data.schoolState}
          onChange={(e) => setData({ ...data, schoolState: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="school-country">Country *</Label>
        <Input
          id="school-country"
          value={data.schoolCountry}
          onChange={(e) => setData({ ...data, schoolCountry: e.target.value })}
        />
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="current-grade">Current Grade Level *</Label>
        <Select value={data.currentGrade} onValueChange={(value) => setData({ ...data, currentGrade: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="9th">9th Grade</SelectItem>
            <SelectItem value="10th">10th Grade</SelectItem>
            <SelectItem value="11th">11th Grade</SelectItem>
            <SelectItem value="12th">12th Grade</SelectItem>
            <SelectItem value="post-graduate">Post-Graduate</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="graduation-date">Expected Graduation (Month/Year) *</Label>
        <Input
          id="graduation-date"
          type="month"
          value={data.expectedGraduation}
          onChange={(e) => setData({ ...data, expectedGraduation: e.target.value })}
        />
      </div>
    </div>

    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="will-graduate"
          checked={data.willGraduateFromSchool}
          onCheckedChange={(checked) => setData({ ...data, willGraduateFromSchool: checked as boolean })}
        />
        <Label htmlFor="will-graduate">I will graduate from this school</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="boarding-school"
          checked={data.isBoardingSchool}
          onCheckedChange={(checked) => setData({ ...data, isBoardingSchool: checked as boolean })}
        />
        <Label htmlFor="boarding-school">This is a boarding school</Label>
      </div>
    </div>
  </div>
);

const AcademicPerformanceStep: React.FC<{ data: AcademicJourneyData; setData: (data: AcademicJourneyData) => void }> = ({ data, setData }) => (
  <div className="space-y-6">
    <div className="grid md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="gpa">Current Cumulative GPA</Label>
        <Input
          id="gpa"
          type="number"
          step="0.01"
          value={data.cumulativeGPA}
          onChange={(e) => setData({ ...data, cumulativeGPA: e.target.value })}
          placeholder="e.g., 3.75"
        />
      </div>
      <div>
        <Label htmlFor="gpa-scale">GPA Scale</Label>
        <Select value={data.gpaScale} onValueChange={(value) => setData({ ...data, gpaScale: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select scale" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4.0">4.0 Scale</SelectItem>
            <SelectItem value="5.0">5.0 Scale</SelectItem>
            <SelectItem value="100">100-point Scale</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="gpa-type">GPA Type</Label>
        <Select value={data.gpaType} onValueChange={(value) => setData({ ...data, gpaType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weighted">Weighted</SelectItem>
            <SelectItem value="unweighted">Unweighted</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div>
      <Label htmlFor="school-ranking">Does your school rank students?</Label>
      <Select value={data.schoolRanksStudents} onValueChange={(value) => setData({ ...data, schoolRanksStudents: value })}>
        <SelectTrigger>
          <SelectValue placeholder="Select ranking type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="exact">Exact Rank</SelectItem>
          <SelectItem value="decile">Decile</SelectItem>
          <SelectItem value="quartile">Quartile</SelectItem>
          <SelectItem value="quintile">Quintile</SelectItem>
          <SelectItem value="none">No Ranking</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {data.schoolRanksStudents !== 'none' && (
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="class-rank">Your Class Rank</Label>
          <Input
            id="class-rank"
            value={data.classRank}
            onChange={(e) => setData({ ...data, classRank: e.target.value })}
            placeholder="e.g., 15 or Top 10%"
          />
        </div>
        <div>
          <Label htmlFor="class-size">Total Class Size</Label>
          <Input
            id="class-size"
            type="number"
            value={data.totalClassSize}
            onChange={(e) => setData({ ...data, totalClassSize: e.target.value })}
            placeholder="Number of students in graduating class"
          />
        </div>
      </div>
    )}
  </div>
);

// Additional step components would follow similar patterns...
// For brevity, I'm including placeholders for the remaining steps

const OtherSchoolsStep: React.FC<{ data: AcademicJourneyData; setData: (data: AcademicJourneyData) => void }> = ({ data, setData }) => {
  const addPreviousSchool = () => {
    const newSchool = {
      id: Date.now().toString(),
      name: '',
      cityState: '',
      startDate: '',
      endDate: '',
      reasonForLeaving: ''
    };
    setData({ ...data, previousSchools: [...data.previousSchools, newSchool] });
  };

  const updatePreviousSchool = (id: string, field: string, value: string) => {
    const updatedSchools = data.previousSchools.map(school =>
      school.id === id ? { ...school, [field]: value } : school
    );
    setData({ ...data, previousSchools: updatedSchools });
  };

  const removePreviousSchool = (id: string) => {
    setData({ ...data, previousSchools: data.previousSchools.filter(school => school.id !== id) });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Have you attended other high schools?</Label>
        <Select value={data.otherSchoolsAttended.toString()} onValueChange={(value) => setData({ ...data, otherSchoolsAttended: parseInt(value) })}>
          <SelectTrigger>
            <SelectValue placeholder="Select number" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0</SelectItem>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.otherSchoolsAttended > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Previous Schools</h4>
            <Button type="button" onClick={addPreviousSchool} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add School
            </Button>
          </div>

          {data.previousSchools.map((school, index) => (
            <Card key={school.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="font-medium">Previous School {index + 1}</h5>
                    <Button type="button" onClick={() => removePreviousSchool(school.id)} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>School Name</Label>
                      <Input
                        value={school.name}
                        onChange={(e) => updatePreviousSchool(school.id, 'name', e.target.value)}
                        placeholder="Previous school name"
                      />
                    </div>
                    <div>
                      <Label>City/State</Label>
                      <Input
                        value={school.cityState}
                        onChange={(e) => updatePreviousSchool(school.id, 'cityState', e.target.value)}
                        placeholder="City, State"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="month"
                        value={school.startDate}
                        onChange={(e) => updatePreviousSchool(school.id, 'startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="month"
                        value={school.endDate}
                        onChange={(e) => updatePreviousSchool(school.id, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Reason for Leaving</Label>
                    <Textarea
                      value={school.reasonForLeaving}
                      onChange={(e) => updatePreviousSchool(school.id, 'reasonForLeaving', e.target.value)}
                      placeholder="Explain why you left this school"
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="studied-abroad"
            checked={data.studiedAbroad}
            onCheckedChange={(checked) => setData({ ...data, studiedAbroad: checked as boolean })}
          />
          <Label htmlFor="studied-abroad">I have studied abroad during high school</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="been-homeschooled"
            checked={data.beenHomeschooled}
            onCheckedChange={(checked) => setData({ ...data, beenHomeschooled: checked as boolean })}
          />
          <Label htmlFor="been-homeschooled">I have been homeschooled at any point</Label>
        </div>
      </div>
    </div>
  );
};

// Mock data for demonstration - represents predefined course options
const PREDEFINED_COURSES = {
  'History/Social Science': [
    { name: 'AP European History (AP)', honorsType: 'AP' },
    { name: 'AP Government and Politics Comparative (AP)', honorsType: 'AP' },
    { name: 'AP Government and Politics United States (AP)', honorsType: 'AP' },
    { name: 'AP Human Geography (AP)', honorsType: 'AP' },
    { name: 'AP United States History (AP)', honorsType: 'AP' },
    { name: 'AP World History (AP)', honorsType: 'AP' },
    { name: 'Modern World History', honorsType: 'NH' },
    { name: 'Modern World History APEX', honorsType: 'NH' },
    { name: 'Modern World History Accelerated', honorsType: 'NH' },
    { name: 'US Government', honorsType: 'NH' },
    { name: 'US Government APEX', honorsType: 'NH' },
    { name: 'US Government Accelerated', honorsType: 'NH' },
    { name: 'US History', honorsType: 'NH' },
    { name: 'US History APEX', honorsType: 'NH' },
  ],
  'English': [
    { name: 'AP English Language and Composition (AP)', honorsType: 'AP' },
    { name: 'AP English Literature and Composition (AP)', honorsType: 'AP' },
    { name: 'AP Seminar (AP)', honorsType: 'AP' },
    { name: 'CSU Expository Reading and Writing (CSU)', honorsType: 'NH' },
    { name: 'Diverse Voices and Media Literacy', honorsType: 'NH' },
    { name: 'Linked Learning Student Ambassadors', honorsType: 'NH' },
  ],
  'Mathematics': [
    { name: 'AP Calculus AB (AP)', honorsType: 'AP' },
    { name: 'AP Calculus BC (AP)', honorsType: 'AP' },
    { name: 'AP Statistics (AP)', honorsType: 'AP' },
    { name: 'Algebra I', honorsType: 'NH' },
    { name: 'Algebra II', honorsType: 'NH' },
    { name: 'Geometry', honorsType: 'NH' },
    { name: 'Pre-Calculus', honorsType: 'NH' },
    { name: 'Trigonometry', honorsType: 'NH' },
  ],
  'Science': [
    { name: 'AP Biology (AP)', honorsType: 'AP' },
    { name: 'AP Chemistry (AP)', honorsType: 'AP' },
    { name: 'AP Environmental Science (AP)', honorsType: 'AP' },
    { name: 'AP Physics 1 (AP)', honorsType: 'AP' },
    { name: 'AP Physics 2 (AP)', honorsType: 'AP' },
    { name: 'AP Physics C: Electricity and Magnetism (AP)', honorsType: 'AP' },
    { name: 'AP Physics C: Mechanics (AP)', honorsType: 'AP' },
    { name: 'Biology', honorsType: 'NH' },
    { name: 'Chemistry', honorsType: 'NH' },
    { name: 'Earth Science', honorsType: 'NH' },
    { name: 'Physics', honorsType: 'NH' },
  ],
  'Language Other Than English': [
    { name: 'AP Spanish Language and Culture (AP)', honorsType: 'AP' },
    { name: 'AP Spanish Literature and Culture (AP)', honorsType: 'AP' },
    { name: 'AP French Language and Culture (AP)', honorsType: 'AP' },
    { name: 'AP German Language and Culture (AP)', honorsType: 'AP' },
    { name: 'Spanish I', honorsType: 'NH' },
    { name: 'Spanish II', honorsType: 'NH' },
    { name: 'Spanish III', honorsType: 'NH' },
    { name: 'Spanish IV', honorsType: 'NH' },
    { name: 'French I', honorsType: 'NH' },
    { name: 'French II', honorsType: 'NH' },
  ],
  'Visual and Performing Arts': [
    { name: 'AP Art History (AP)', honorsType: 'AP' },
    { name: 'AP Music Theory (AP)', honorsType: 'AP' },
    { name: 'AP Studio Art 2-D Design (AP)', honorsType: 'AP' },
    { name: 'AP Studio Art 3-D Design (AP)', honorsType: 'AP' },
    { name: 'AP Studio Art Drawing (AP)', honorsType: 'AP' },
    { name: 'Art I', honorsType: 'NH' },
    { name: 'Art II', honorsType: 'NH' },
    { name: 'Drama', honorsType: 'NH' },
    { name: 'Music', honorsType: 'NH' },
    { name: 'Photography', honorsType: 'NH' },
  ],
  'College-Prep Electives': [
    { name: 'AP Computer Science A (AP)', honorsType: 'AP' },
    { name: 'AP Computer Science Principles (AP)', honorsType: 'AP' },
    { name: 'AP Psychology (AP)', honorsType: 'AP' },
    { name: 'Computer Science', honorsType: 'NH' },
    { name: 'Psychology', honorsType: 'NH' },
    { name: 'Journalism', honorsType: 'NH' },
    { name: 'Business', honorsType: 'NH' },
    { name: 'Health', honorsType: 'NH' },
  ]
};

const CourseHistoryStep: React.FC<{ data: AcademicJourneyData; setData: (data: AcademicJourneyData) => void }> = ({ data, setData }) => {
  const [openSubjects, setOpenSubjects] = useState<{ [key: string]: boolean }>({});

  const addAcademicYear = () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const yearString = `${currentYear} - ${nextYear}`;
    
    // Initialize subjects with predefined courses
    const subjects: { [key: string]: any } = {};
    Object.entries(PREDEFINED_COURSES).forEach(([subjectName, courses]) => {
      subjects[subjectName] = {
        courses: courses.map(course => ({
          ...course,
          selected: false,
          grade1: '',
          grade2: ''
        }))
      };
    });

    const newYear = {
      id: Date.now().toString(),
      year: yearString,
      gradeLevel: '9th', // Default, user can change
      subjects,
      tookSummerCourses: false
    };

    setData({ 
      ...data, 
      academicYears: [...data.academicYears, newYear] 
    });
  };

  const updateAcademicYear = (yearId: string, field: string, value: any) => {
    const updatedYears = data.academicYears.map(year =>
      year.id === yearId ? { ...year, [field]: value } : year
    );
    setData({ ...data, academicYears: updatedYears });
  };

  const removeAcademicYear = (yearId: string) => {
    setData({ 
      ...data, 
      academicYears: data.academicYears.filter(year => year.id !== yearId) 
    });
  };

  const updateCourseSelection = (yearId: string, subjectName: string, courseIndex: number, field: string, value: any) => {
    const updatedYears = data.academicYears.map(year => {
      if (year.id === yearId) {
        const updatedSubjects = { ...year.subjects };
        // Add safety check for courses array
        if (updatedSubjects[subjectName]?.courses) {
          const updatedCourses = [...updatedSubjects[subjectName].courses];
          if (updatedCourses[courseIndex]) {
            updatedCourses[courseIndex] = { 
              ...updatedCourses[courseIndex], 
              [field]: value 
            };
            updatedSubjects[subjectName] = {
              ...updatedSubjects[subjectName],
              courses: updatedCourses
            };
          }
        }
        return { ...year, subjects: updatedSubjects };
      }
      return year;
    });
    setData({ ...data, academicYears: updatedYears });
  };

  const toggleSubject = (yearId: string, subjectName: string) => {
    const key = `${yearId}-${subjectName}`;
    setOpenSubjects(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isSubjectOpen = (yearId: string, subjectName: string) => {
    return openSubjects[`${yearId}-${subjectName}`] || false;
  };

  return (
    <div className="space-y-6 w-full overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Academic Course History</h3>
          <p className="text-sm text-muted-foreground">
            Please indicate the academic year and grade that you attended this high school.
          </p>
        </div>
        <Button type="button" onClick={addAcademicYear} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add another grade
        </Button>
      </div>

      <div className="space-y-6">
        {(data.academicYears || []).map((academicYear, yearIndex) => (
          <Card key={academicYear.id} className="w-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-semibold">{academicYear.year} academic year</h4>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`grade-${academicYear.id}`}>Grade *</Label>
                      <Select 
                        value={academicYear.gradeLevel} 
                        onValueChange={(value) => updateAcademicYear(academicYear.id, 'gradeLevel', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="-- select --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="9th">9th</SelectItem>
                          <SelectItem value="10th">10th</SelectItem>
                          <SelectItem value="11th">11th</SelectItem>
                          <SelectItem value="12th">12th</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id={`summer-${academicYear.id}`}
                        checked={academicYear.tookSummerCourses}
                        onCheckedChange={(checked) => 
                          updateAcademicYear(academicYear.id, 'tookSummerCourses', checked)
                        }
                      />
                      <Label htmlFor={`summer-${academicYear.id}`}>I took summer courses after this grade</Label>
                    </div>
                  </div>
                </div>
                <Button 
                  type="button" 
                  onClick={() => removeAcademicYear(academicYear.id)} 
                  size="sm" 
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(academicYear.subjects || {}).map(([subjectName, subjectData]) => {
                const isOpen = isSubjectOpen(academicYear.id, subjectName);
                // Add safety check for courses array
                const courses = subjectData?.courses || [];
                const selectedCourses = courses.filter((course: any) => course.selected);
                
                return (
                  <div key={subjectName} className="border rounded-lg">
                    <Collapsible 
                      open={isOpen} 
                      onOpenChange={() => toggleSubject(academicYear.id, subjectName)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-4 h-auto font-medium text-left hover:bg-muted/50"
                        >
                          <span>{academicYear.gradeLevel} {subjectName}</span>
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {courses.map((course: any, courseIndex: number) => (
                            <div key={courseIndex}>
                              <div className="flex items-center justify-between py-2">
                                <div className="flex items-center space-x-3 flex-1">
                                  <Checkbox
                                    id={`course-${academicYear.id}-${subjectName}-${courseIndex}`}
                                    checked={course.selected}
                                    onCheckedChange={(checked) =>
                                      updateCourseSelection(
                                        academicYear.id,
                                        subjectName,
                                        courseIndex,
                                        'selected',
                                        checked
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`course-${academicYear.id}-${subjectName}-${courseIndex}`}
                                    className="flex-1 cursor-pointer"
                                  >
                                    {course.name}
                                  </Label>
                                </div>
                                <div className="text-sm text-muted-foreground min-w-[40px] text-right">
                                  {course.honorsType}
                                </div>
                              </div>
                              
                              {course.selected && (
                                <div className="ml-6 flex gap-4 mt-2">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Grade 1</Label>
                                    <Select
                                      value={course.grade1 || ''}
                                      onValueChange={(value) =>
                                        updateCourseSelection(
                                          academicYear.id,
                                          subjectName,
                                          courseIndex,
                                          'grade1',
                                          value
                                        )
                                      }
                                    >
                                      <SelectTrigger className="w-16 h-8">
                                        <SelectValue placeholder="--" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="A+">A+</SelectItem>
                                        <SelectItem value="A">A</SelectItem>
                                        <SelectItem value="A-">A-</SelectItem>
                                        <SelectItem value="B+">B+</SelectItem>
                                        <SelectItem value="B">B</SelectItem>
                                        <SelectItem value="B-">B-</SelectItem>
                                        <SelectItem value="C+">C+</SelectItem>
                                        <SelectItem value="C">C</SelectItem>
                                        <SelectItem value="C-">C-</SelectItem>
                                        <SelectItem value="D+">D+</SelectItem>
                                        <SelectItem value="D">D</SelectItem>
                                        <SelectItem value="F">F</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Grade 2</Label>
                                    <Select
                                      value={course.grade2 || ''}
                                      onValueChange={(value) =>
                                        updateCourseSelection(
                                          academicYear.id,
                                          subjectName,
                                          courseIndex,
                                          'grade2',
                                          value
                                        )
                                      }
                                    >
                                      <SelectTrigger className="w-16 h-8">
                                        <SelectValue placeholder="--" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="A+">A+</SelectItem>
                                        <SelectItem value="A">A</SelectItem>
                                        <SelectItem value="A-">A-</SelectItem>
                                        <SelectItem value="B+">B+</SelectItem>
                                        <SelectItem value="B">B</SelectItem>
                                        <SelectItem value="B-">B-</SelectItem>
                                        <SelectItem value="C+">C+</SelectItem>
                                        <SelectItem value="C">C</SelectItem>
                                        <SelectItem value="C-">C-</SelectItem>
                                        <SelectItem value="D+">D+</SelectItem>
                                        <SelectItem value="D">D</SelectItem>
                                        <SelectItem value="F">F</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id={`no-courses-${academicYear.id}`}
                  />
                  <Label htmlFor={`no-courses-${academicYear.id}`} className="text-sm">
                    I don't see my courses.
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Early Math/Language */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="math-early"
            checked={data.tookMathEarly}
            onCheckedChange={(checked) => setData({ ...data, tookMathEarly: checked as boolean })}
          />
          <Label htmlFor="math-early">I took high school-level math in 7th or 8th grade</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="language-early"
            checked={data.tookLanguageEarly}
            onCheckedChange={(checked) => setData({ ...data, tookLanguageEarly: checked as boolean })}
          />
          <Label htmlFor="language-early">I took language other than English in 7th or 8th grade</Label>
        </div>
      </div>
    </div>
  );
};

const CollegeCourseworkStep: React.FC<{ data: AcademicJourneyData; setData: (data: AcademicJourneyData) => void }> = ({ data, setData }) => {
  const addCollegeCourse = () => {
    const newCourse = {
      id: Date.now().toString(),
      college: '',
      setting: '',
      courseName: '',
      termYear: '',
      grade: '',
      courseType: ''
    };
    setData({ ...data, collegeCoursework: [...data.collegeCoursework, newCourse] });
  };

  const updateCollegeCourse = (id: string, field: string, value: string) => {
    const updatedCourses = data.collegeCoursework.map(course =>
      course.id === id ? { ...course, [field]: value } : course
    );
    setData({ ...data, collegeCoursework: updatedCourses });
  };

  const removeCollegeCourse = (id: string) => {
    setData({ ...data, collegeCoursework: data.collegeCoursework.filter(course => course.id !== id) });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Have you taken college courses while in high school?</Label>
        <Select value={data.collegeCoursesTaken.toString()} onValueChange={(value) => setData({ ...data, collegeCoursesTaken: parseInt(value) })}>
          <SelectTrigger>
            <SelectValue placeholder="Select number" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0</SelectItem>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.collegeCoursesTaken > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">College Courses</h4>
            <Button type="button" onClick={addCollegeCourse} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>

          {data.collegeCoursework.map((course, index) => (
            <Card key={course.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="font-medium">College Course {index + 1}</h5>
                    <Button type="button" onClick={() => removeCollegeCourse(course.id)} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>College/University Name</Label>
                      <Input
                        value={course.college}
                        onChange={(e) => updateCollegeCourse(course.id, 'college', e.target.value)}
                        placeholder="College or university name"
                      />
                    </div>
                    <div>
                      <Label>Course Setting</Label>
                      <Select value={course.setting} onValueChange={(value) => updateCollegeCourse(course.id, 'setting', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select setting" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dual-enrollment">Dual enrollment through HS</SelectItem>
                          <SelectItem value="summer-program">Summer program</SelectItem>
                          <SelectItem value="independent">Independent enrollment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Course Name</Label>
                      <Input
                        value={course.courseName}
                        onChange={(e) => updateCollegeCourse(course.id, 'courseName', e.target.value)}
                        placeholder="e.g., Introduction to Psychology"
                      />
                    </div>
                    <div>
                      <Label>Term/Year Taken</Label>
                      <Input
                        value={course.termYear}
                        onChange={(e) => updateCollegeCourse(course.id, 'termYear', e.target.value)}
                        placeholder="e.g., Fall 2023"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Grade/Credit Received</Label>
                      <Input
                        value={course.grade}
                        onChange={(e) => updateCollegeCourse(course.id, 'grade', e.target.value)}
                        placeholder="e.g., A, 3.5, Pass"
                      />
                    </div>
                    <div>
                      <Label>Course Type</Label>
                      <Select value={course.courseType} onValueChange={(value) => updateCollegeCourse(course.id, 'courseType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="for-credit">For credit</SelectItem>
                          <SelectItem value="audit">Audit</SelectItem>
                          <SelectItem value="non-credit">Non-credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const StandardizedTestingStep: React.FC<{ data: AcademicJourneyData; setData: (data: AcademicJourneyData) => void }> = ({ data, setData }) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-2">
      <Checkbox 
        id="report-test-scores"
        checked={data.reportTestScores}
        onCheckedChange={(checked) => setData({ ...data, reportTestScores: checked as boolean })}
      />
      <Label htmlFor="report-test-scores">I want to report standardized test scores</Label>
    </div>
    
    {data.reportTestScores && (
      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-4">SAT Scores</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sat-reading">Evidence-Based Reading & Writing</Label>
              <Input
                id="sat-reading"
                type="number"
                min="200"
                max="800"
                value={data.sat.readingWriting}
                onChange={(e) => setData({ ...data, sat: { ...data.sat, readingWriting: e.target.value } })}
                placeholder="200-800"
              />
            </div>
            <div>
              <Label htmlFor="sat-math">Math</Label>
              <Input
                id="sat-math"
                type="number"
                min="200"
                max="800"
                value={data.sat.math}
                onChange={(e) => setData({ ...data, sat: { ...data.sat, math: e.target.value } })}
                placeholder="200-800"
              />
            </div>
            <div>
              <Label htmlFor="sat-total">Total Score</Label>
              <Input
                id="sat-total"
                type="number"
                min="400"
                max="1600"
                value={data.sat.total}
                onChange={(e) => setData({ ...data, sat: { ...data.sat, total: e.target.value } })}
                placeholder="400-1600"
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="font-medium mb-4">ACT Scores</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="act-english">English</Label>
              <Input
                id="act-english"
                type="number"
                min="1"
                max="36"
                value={data.act.english}
                onChange={(e) => setData({ ...data, act: { ...data.act, english: e.target.value } })}
                placeholder="1-36"
              />
            </div>
            <div>
              <Label htmlFor="act-math">Math</Label>
              <Input
                id="act-math"
                type="number"
                min="1"
                max="36"
                value={data.act.math}
                onChange={(e) => setData({ ...data, act: { ...data.act, math: e.target.value } })}
                placeholder="1-36"
              />
            </div>
            <div>
              <Label htmlFor="act-composite">Composite</Label>
              <Input
                id="act-composite"
                type="number"
                min="1"
                max="36"
                value={data.act.composite}
                onChange={(e) => setData({ ...data, act: { ...data.act, composite: e.target.value } })}
                placeholder="1-36"
              />
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

const APExamsStep: React.FC<{ data: AcademicJourneyData; setData: (data: AcademicJourneyData) => void }> = ({ data, setData }) => {
  const addAPExam = () => {
    const newExam = {
      id: Date.now().toString(),
      subject: '',
      date: '',
      score: ''
    };
    setData({ ...data, apExams: [...data.apExams, newExam] });
  };

  const updateAPExam = (id: string, field: string, value: string) => {
    const updatedExams = data.apExams.map(exam =>
      exam.id === id ? { ...exam, [field]: value } : exam
    );
    setData({ ...data, apExams: updatedExams });
  };

  const removeAPExam = (id: string) => {
    setData({ ...data, apExams: data.apExams.filter(exam => exam.id !== id) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="taking-ap"
          checked={data.takingAPExams}
          onCheckedChange={(checked) => setData({ ...data, takingAPExams: checked as boolean })}
        />
        <Label htmlFor="taking-ap">I have taken or plan to take AP exams</Label>
      </div>

      {data.takingAPExams && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">AP Exams</h4>
            <Button type="button" onClick={addAPExam} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add AP Exam
            </Button>
          </div>

          {data.apExams.map((exam, index) => (
            <Card key={exam.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="font-medium">AP Exam {index + 1}</h5>
                    <Button type="button" onClick={() => removeAPExam(exam.id)} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Subject</Label>
                      <Input
                        value={exam.subject}
                        onChange={(e) => updateAPExam(exam.id, 'subject', e.target.value)}
                        placeholder="e.g., AP Biology"
                      />
                    </div>
                    <div>
                      <Label>Exam Date (or planned date)</Label>
                      <Input
                        type="month"
                        value={exam.date}
                        onChange={(e) => updateAPExam(exam.id, 'date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Score</Label>
                      <Select value={exam.score} onValueChange={(value) => updateAPExam(exam.id, 'score', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select score" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="planned">Planned/Not yet taken</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const IBProgrammeStep: React.FC<{ data: AcademicJourneyData; setData: (data: AcademicJourneyData) => void }> = ({ data, setData }) => {
  const addIBExam = () => {
    const newExam = {
      id: Date.now().toString(),
      subject: '',
      level: '',
      score: '',
      examDate: ''
    };
    setData({ ...data, ibExams: [...data.ibExams, newExam] });
  };

  const updateIBExam = (id: string, field: string, value: string) => {
    const updatedExams = data.ibExams.map(exam =>
      exam.id === id ? { ...exam, [field]: value } : exam
    );
    setData({ ...data, ibExams: updatedExams });
  };

  const removeIBExam = (id: string) => {
    setData({ ...data, ibExams: data.ibExams.filter(exam => exam.id !== id) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="in-ib"
          checked={data.inIBProgramme}
          onCheckedChange={(checked) => setData({ ...data, inIBProgramme: checked as boolean })}
        />
        <Label htmlFor="in-ib">I am in the IB Diploma Programme</Label>
      </div>

      {data.inIBProgramme && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">IB Exams</h4>
            <Button type="button" onClick={addIBExam} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add IB Exam
            </Button>
          </div>

          {data.ibExams.map((exam, index) => (
            <Card key={exam.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="font-medium">IB Exam {index + 1}</h5>
                    <Button type="button" onClick={() => removeIBExam(exam.id)} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Subject</Label>
                      <Input
                        value={exam.subject}
                        onChange={(e) => updateIBExam(exam.id, 'subject', e.target.value)}
                        placeholder="e.g., IB Biology HL"
                      />
                    </div>
                    <div>
                      <Label>Level</Label>
                      <Select value={exam.level} onValueChange={(value) => updateIBExam(exam.id, 'level', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="higher">Higher Level (HL)</SelectItem>
                          <SelectItem value="standard">Standard Level (SL)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Score</Label>
                      <Select value={exam.score} onValueChange={(value) => updateIBExam(exam.id, 'score', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select score" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="predicted">Predicted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Exam Date</Label>
                      <Input
                        type="month"
                        value={exam.examDate}
                        onChange={(e) => updateIBExam(exam.id, 'examDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const EnglishProficiencyStep: React.FC<{ data: AcademicJourneyData; setData: (data: AcademicJourneyData) => void }> = ({ data, setData }) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-2">
      <Checkbox 
        id="need-english-proficiency"
        checked={data.needEnglishProficiency}
        onCheckedChange={(checked) => setData({ ...data, needEnglishProficiency: checked as boolean })}
      />
      <Label htmlFor="need-english-proficiency">I need to report English proficiency test scores</Label>
    </div>
    
    {data.needEnglishProficiency && (
      <div className="space-y-4">
        <div>
          <Label htmlFor="english-test-type">Test Type</Label>
          <Select value={data.englishProficiency.testType} onValueChange={(value) => setData({ ...data, englishProficiency: { ...data.englishProficiency, testType: value } })}>
            <SelectTrigger>
              <SelectValue placeholder="Select test type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toefl">TOEFL iBT</SelectItem>
              <SelectItem value="ielts">IELTS</SelectItem>
              <SelectItem value="duolingo">Duolingo English Test</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )}
  </div>
);

export default AcademicJourneyWizard;
