import React, { useEffect, useMemo, useState } from 'react';
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
import { Progress } from '@/components/ui/progress';

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
  onProgressRefresh?: () => void;
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

const AcademicJourneyWizard: React.FC<Props> = ({ onComplete, onCancel, onProgressRefresh }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  
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

  // Progress calculation (required-only essence similar to Basic Info)
  const progress = useMemo(() => {
    const isFilled = (v: any) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.toString().trim().length > 0;
      if (typeof v === 'number') return !Number.isNaN(v);
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return Object.values(v).some((x) => isFilled(x));
      return Boolean(v);
    };

    const step1 = [data.schoolName, data.currentGrade, data.expectedGraduation];
    const step2 = [data.cumulativeGPA, data.gpaScale];
    const step3 = [data.otherSchoolsAttended === 0 || data.previousSchools.length > 0 || data.studiedAbroad || data.beenHomeschooled];
    const step4 = [(data.academicYears || []).length > 0];
    const step5 = [data.collegeCoursesTaken === 0 || (data.collegeCoursework || []).length > 0];
    const step6 = [!data.reportTestScores || isFilled(data.sat.total) || isFilled(data.act.composite)];
    const step7 = [!data.takingAPExams || (data.apExams || []).length > 0];
    const step8 = [!data.inIBProgramme || (data.ibExams || []).length > 0];
    const step9 = [!data.needEnglishProficiency || isFilled(data.englishProficiency?.testType)];

    const required = [...step1, ...step2, ...step6, ...step9];
    const completed = required.filter(isFilled).length;
    const total = required.length || 1;
    const percent = Math.round((completed / total) * 100);

    const sectionComplete = {
      step_1: step1.every(isFilled),
      step_2: step2.every(isFilled),
      step_3: step3.every(Boolean),
      step_4: step4.every(Boolean),
      step_5: step5.every(Boolean),
      step_6: step6.every(Boolean),
      step_7: step7.every(Boolean),
      step_8: step8.every(Boolean),
      step_9: step9.every(Boolean),
    } as const;

    return { percent, sectionComplete } as any;
  }, [data]);

  // Prefill academic_journey for current user
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!profile?.id) return;
        setProfileId(profile.id);

        const { data: aj } = await supabase
          .from('academic_journey')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (!aj) return;

        const schoolData = aj.current_school as any;
        const otherSchoolsData = aj.other_schools as any;
        const testScoresData = aj.standardized_tests as any;
        
        setData((prev) => ({
          ...prev,
          schoolName: schoolData?.name || '',
          schoolType: schoolData?.type || '',
          schoolCity: schoolData?.city || '',
          schoolState: schoolData?.state || '',
          schoolCountry: schoolData?.country || 'United States',
          currentGrade: aj.current_grade || '',
          expectedGraduation: (aj.expected_grad_date as string)?.slice(0, 7) || '',
          willGraduateFromSchool: Boolean((aj as any).will_graduate_from_school),
          isBoardingSchool: Boolean((aj as any).is_boarding_school),

          cumulativeGPA: aj.gpa == null ? '' : String(aj.gpa),
          gpaScale: aj.gpa_scale || '4.0',
          gpaType: aj.gpa_type || 'weighted',
          schoolRanksStudents: (aj as any).rank_reporting_method || 'none',
          classRank: aj.class_rank || '',
          totalClassSize: aj.class_size == null ? '' : String(aj.class_size),

          otherSchoolsAttended: otherSchoolsData?.count || 0,
          previousSchools: otherSchoolsData?.previous_schools || [],
          studiedAbroad: Boolean((aj as any).studied_abroad),
          beenHomeschooled: Boolean((aj as any).homeschooled),

          academicYears: (aj.course_history as any[]) || [],
          tookMathEarly: Boolean((aj as any).took_math_early),
          tookLanguageEarly: Boolean((aj as any).took_language_early),

          collegeCoursesTaken: Array.isArray(aj.college_courses) ? ((aj.college_courses as any[])?.length || 0) : 0,
          collegeCoursework: (aj.college_courses as any[]) || [],

          reportTestScores: Boolean((aj as any).report_test_scores),
          sat: testScoresData?.sat || { readingWriting: '', math: '', total: '', testDate: '', timesTaken: 0 },
          act: testScoresData?.act || { english: '', math: '', reading: '', science: '', composite: '', testDate: '', timesTaken: 0 },

          takingAPExams: Boolean((aj as any).taking_ap_exams),
          apExams: (aj.ap_exams as any[]) || [],
          inIBProgramme: Boolean((aj as any).in_ib_programme),
          ibExams: (aj.ib_exams as any[]) || [],

          needEnglishProficiency: Boolean((aj as any).english_proficiency),
          englishProficiency: (aj.english_proficiency as any) || { testType: '', testDate: '', scores: '', planToRetake: false },
        }));
      } catch (e) {
        // ignore prefill errors
      }
    })();
  }, []);

  const mapStateToDb = (pid: string) => {
    const expected = data.expectedGraduation ? `${data.expectedGraduation}-01` : null;
    const gpaNumeric = data.cumulativeGPA ? parseFloat(data.cumulativeGPA) : null;
    const classSizeInt = data.totalClassSize ? parseInt(data.totalClassSize) : null;
    const otherSchools = {
      count: data.otherSchoolsAttended || 0,
      previous_schools: data.previousSchools || []
    } as any;
    const standardized = data.reportTestScores ? { sat: data.sat, act: data.act } : {};

    return {
      profile_id: pid,
      current_school: {
        name: data.schoolName || null,
        type: data.schoolType || null,
        city: data.schoolCity || null,
        state: data.schoolState || null,
        country: data.schoolCountry || null,
      },
      current_grade: data.currentGrade || null,
      expected_grad_date: expected,
      gpa: gpaNumeric,
      gpa_scale: data.gpaScale || null,
      gpa_type: data.gpaType || null,
      class_rank: data.classRank || null,
      class_size: classSizeInt,
      rank_reporting_method: data.schoolRanksStudents || null,

      will_graduate_from_school: Boolean(data.willGraduateFromSchool),
      is_boarding_school: Boolean(data.isBoardingSchool),

      other_schools: otherSchools,
      studied_abroad: Boolean(data.studiedAbroad),
      homeschooled: Boolean(data.beenHomeschooled),

      course_history: data.academicYears || [],
      took_math_early: Boolean(data.tookMathEarly),
      took_language_early: Boolean(data.tookLanguageEarly),

      college_courses: data.collegeCoursework || [],

      report_test_scores: Boolean(data.reportTestScores),
      standardized_tests: standardized,

      taking_ap_exams: Boolean(data.takingAPExams),
      ap_exams: data.apExams || [],
      in_ib_programme: Boolean(data.inIBProgramme),
      ib_exams: data.ibExams || [],

      need_english_proficiency: Boolean(data.needEnglishProficiency),
      english_proficiency: data.needEnglishProficiency ? data.englishProficiency : {},
    } as any;
  };

  const upsertJourney = async (isFinal: boolean) => {
    if (!profileId) throw new Error('Profile not loaded');
    const payload = mapStateToDb(profileId);

    const { data: existing, error: fetchErr } = await supabase
      .from('academic_journey')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;

    if (existing?.id) {
      const { error } = await supabase
        .from('academic_journey')
        .update(payload)
        .eq('id', existing.id as string);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('academic_journey')
        .insert(payload);
      if (error) throw error;
    }

    const bump = isFinal ? 0.7 : 0.4;
    await supabase.from('profiles').update({ completion_score: bump }).eq('id', profileId);
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
      if (!profileId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (!profile?.id) throw new Error('Profile not found');
        setProfileId(profile.id);
      }

      await upsertJourney(true);

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

  const handleSaveQuit = async () => {
    setIsLoading(true);
    try {
      if (!profileId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (!profile?.id) throw new Error('Profile not found');
        setProfileId(profile.id);
      }

      await upsertJourney(false);
      toast({ title: 'Progress saved', description: 'You can come back anytime.' });
      onProgressRefresh?.();
    } catch (e) {
      toast({ title: 'Save failed', description: 'Try again later.', variant: 'destructive' });
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
        
        <Progress value={progress.percent} className="h-2 max-w-md mx-auto" />

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-2 ${
                currentStep === step.id
                  ? 'text-primary'
                  : (progress.sectionComplete[`step_${step.id}` as keyof typeof progress.sectionComplete])
                  ? 'text-green-600'
                  : 'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : (progress.sectionComplete[`step_${step.id}` as keyof typeof progress.sectionComplete])
                    ? 'bg-green-600 text-white'
                    : 'bg-muted'
                }`}>
                  {progress.sectionComplete[`step_${step.id}` as keyof typeof progress.sectionComplete] ? '✓' : step.id}
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

        <div className="flex items-center gap-2">
          <Button 
            variant="secondary"
            onClick={handleSaveQuit}
            disabled={isLoading}
          >
            Save & Quit
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

// Comprehensive course catalog by grade - predefined course options
const PREDEFINED_COURSES = {
  '9th': {
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
      { name: 'CSU Expository Reading and Writing (CSU)', honorsType: 'CSU' },
      { name: 'Diverse Voices and Media Literacy', honorsType: 'NH' },
      { name: 'English 1-2', honorsType: 'NH' },
      { name: 'English 1-2 APEX', honorsType: 'NH' },
      { name: 'English 1-2 Accelerated', honorsType: 'NH' },
      { name: 'English 3-4', honorsType: 'NH' },
      { name: 'English 3-4 APEX', honorsType: 'NH' },
      { name: 'English 3-4 Accelerated', honorsType: 'NH' },
      { name: 'English 5-6', honorsType: 'NH' },
      { name: 'English 5-6 APEX', honorsType: 'NH' },
      { name: 'English 7-8 APEX', honorsType: 'NH' },
      { name: 'Linked Learning Student Ambassadors', honorsType: 'NH' },
    ],
    'Mathematics': [
      { name: 'AP Calculus AB (AP)', honorsType: 'AP' },
      { name: 'AP Calculus BC (AP)', honorsType: 'AP' },
      { name: 'AP Computer Science A (AP)', honorsType: 'AP' },
      { name: 'AP Statistics (AP)', honorsType: 'AP' },
      { name: 'Algebra 1', honorsType: 'NH' },
      { name: 'Algebra 1 APEX', honorsType: 'NH' },
      { name: 'Algebra 2', honorsType: 'NH' },
      { name: 'Algebra 2 APEX', honorsType: 'NH' },
      { name: 'Algebra 2 Accelerated', honorsType: 'NH' },
      { name: 'Algebra AB', honorsType: 'NH' },
      { name: 'Algebra CD', honorsType: 'NH' },
      { name: 'Finite Math', honorsType: 'NH' },
      { name: 'Functions/Statistics/Trigonometry', honorsType: 'NH' },
      { name: 'Geometry', honorsType: 'NH' },
      { name: 'Geometry APEX', honorsType: 'NH' },
      { name: 'Geometry Accelerated', honorsType: 'NH' },
      { name: 'Intensified Algebra', honorsType: 'NH' },
      { name: 'Introduction to Data Science AB (Center X)', honorsType: 'NH' },
      { name: 'Pre Calculus', honorsType: 'NH' },
      { name: 'Pre Calculus Honors', honorsType: 'HL' },
    ],
    'Science': [
      { name: 'AP Biology (AP)', honorsType: 'AP' },
      { name: 'AP Chemistry (AP)', honorsType: 'AP' },
      { name: 'AP Computer Science Principles (AP)', honorsType: 'AP' },
      { name: 'AP Environmental Science (AP)', honorsType: 'AP' },
      { name: 'AP Physics 1 (AP)', honorsType: 'AP' },
      { name: 'AP Physics C: Mechanics (AP)', honorsType: 'AP' },
      { name: 'Anatomy/Physiology Honors', honorsType: 'HL' },
      { name: 'Biology 1-2 APEX', honorsType: 'NH' },
      { name: 'Biology: The Living Earth', honorsType: 'NH' },
      { name: 'Biology: The Living Earth APEX', honorsType: 'NH' },
      { name: 'Biomedical Research', honorsType: 'NH' },
      { name: 'Chemistry 1-2 APEX', honorsType: 'NH' },
      { name: 'Chemistry 1-2 Honors', honorsType: 'HL' },
      { name: 'Chemistry in the Earth System', honorsType: 'NH' },
      { name: 'Chemistry in the Earth System APEX', honorsType: 'NH' },
      { name: 'Earth Science 1-2 APEX', honorsType: 'NH' },
      { name: 'Environmental Geoscience', honorsType: 'NH' },
      { name: 'Honors PLTW Civil Engineering and Architecture (PLTW)', honorsType: 'PLTW' },
      { name: 'Honors PLTW Cybersecurity (PLTW)', honorsType: 'PLTW' },
      { name: 'Honors PLTW Engineering Design and Development (PLTW)', honorsType: 'PLTW' },
      { name: 'Marine Biology 1-2', honorsType: 'NH' },
      { name: 'Medical Biology 1-2', honorsType: 'NH' },
      { name: 'Medical Chemistry 1-2', honorsType: 'NH' },
      { name: 'PLTW Civil Engineering and Architecture (PLTW)', honorsType: 'PLTW' },
      { name: 'PLTW Computer Science Essentials (PLTW)', honorsType: 'PLTW' },
      { name: 'PLTW Engineering Design and Development (PLTW)', honorsType: 'PLTW' },
      { name: 'Physics 1-2 APEX', honorsType: 'NH' },
      { name: 'Physics of the Universe', honorsType: 'NH' },
    ],
    'Language Other Than English': [
      { name: 'AP Chinese Language and Culture (AP)', honorsType: 'AP' },
      { name: 'AP French Language and Culture (AP)', honorsType: 'AP' },
      { name: 'AP Japanese Language and Culture (AP)', honorsType: 'AP' },
      { name: 'AP Spanish Language and Culture (AP)', honorsType: 'AP' },
      { name: 'Chinese 1-2', honorsType: 'NH' },
      { name: 'Chinese 3-4', honorsType: 'NH' },
      { name: 'Chinese 5-6', honorsType: 'NH' },
      { name: 'Chinese 7-8', honorsType: 'NH' },
      { name: 'French 1-2', honorsType: 'NH' },
      { name: 'French 3-4', honorsType: 'NH' },
      { name: 'French 5-6', honorsType: 'NH' },
      { name: 'French I', honorsType: 'NH' },
      { name: 'French II', honorsType: 'NH' },
      { name: 'Japanese 1-2', honorsType: 'NH' },
      { name: 'Japanese 3-4', honorsType: 'NH' },
      { name: 'Japanese 5-6', honorsType: 'NH' },
      { name: 'Japanese 5-6 Honors', honorsType: 'HL' },
      { name: 'Japanese 7-8', honorsType: 'NH' },
      { name: 'Spanish 1-2', honorsType: 'NH' },
      { name: 'Spanish 1-2 APEX', honorsType: 'NH' },
      { name: 'Spanish 3-4', honorsType: 'NH' },
      { name: 'Spanish 3-4 APEX', honorsType: 'NH' },
      { name: 'Spanish 5-6', honorsType: 'NH' },
      { name: 'Spanish 5-6 APEX', honorsType: 'NH' },
      { name: 'Spanish for Spanish 1-2', honorsType: 'NH' },
      { name: 'Spanish for Spanish 3-4', honorsType: 'NH' },
      { name: 'Spanish for Spanish 5-6', honorsType: 'NH' },
    ],
    'Visual and Performing Arts': [
      { name: 'AP 2D Art and Design (AP)', honorsType: 'AP' },
      { name: 'AP 3D Art and Design (AP)', honorsType: 'AP' },
      { name: 'AP Art History (AP)', honorsType: 'AP' },
      { name: 'AP Drawing (AP)', honorsType: 'AP' },
      { name: 'Advanced Chamber Orchestra 3-8', honorsType: 'NH' },
      { name: 'Advanced Contemporary Video', honorsType: 'NH' },
      { name: 'Advanced Stage Technology', honorsType: 'NH' },
      { name: 'Advanced Theatre Arts', honorsType: 'NH' },
      { name: 'Art 1-2: Foundations', honorsType: 'NH' },
      { name: 'Art 3-4: Drawing & Painting', honorsType: 'NH' },
      { name: 'Art 3-4: Three-Dimensional Art', honorsType: 'NH' },
      { name: 'Art 5-6: Drawing & Painting', honorsType: 'NH' },
      { name: 'Art 5-6: Three-Dimensional Art', honorsType: 'NH' },
      { name: 'Art 7-8: Drawing & Painting', honorsType: 'NH' },
      { name: 'Band 1-2', honorsType: 'NH' },
      { name: 'Band 3-8', honorsType: 'NH' },
      { name: 'Cecilian Singers 1-2', honorsType: 'NH' },
      { name: 'Cecilian Singers 3-8', honorsType: 'NH' },
      { name: 'Chorus/Voice 1-2', honorsType: 'NH' },
      { name: 'Chorus/Voice 3-8', honorsType: 'NH' },
      { name: 'Contemporary Video', honorsType: 'NH' },
      { name: 'Dance 5-6', honorsType: 'NH' },
      { name: 'Dance 7-8', honorsType: 'NH' },
      { name: 'Digital Art & Imaging 1-2', honorsType: 'NH' },
      { name: 'Digital Art & Imaging 3-4', honorsType: 'NH' },
      { name: 'Digital Art & Imaging 5-6', honorsType: 'NH' },
      { name: 'Exploring Art 1-2 APEX', honorsType: 'NH' },
      { name: 'Graphic Design and Printmaking 1-2', honorsType: 'NH' },
      { name: 'Instruments 1-2', honorsType: 'NH' },
      { name: 'Intermediate String Orchestra', honorsType: 'NH' },
      { name: 'Intermediate Theatre Arts', honorsType: 'NH' },
      { name: 'Introduction to Design 1, 2 (PLTW)', honorsType: 'PLTW' },
      { name: 'Introduction to Songwriting', honorsType: 'NH' },
      { name: 'Introduction to Theatre Arts', honorsType: 'NH' },
      { name: 'Jazz Band 1-2', honorsType: 'NH' },
      { name: 'Jazz Band 3-8', honorsType: 'NH' },
      { name: 'Music Appreciation APEX', honorsType: 'NH' },
      { name: 'Orchestra 1-2', honorsType: 'NH' },
      { name: 'Orchestra 3-4', honorsType: 'NH' },
      { name: 'Orchestra 5-6', honorsType: 'NH' },
      { name: 'Orchestra 7-8', honorsType: 'NH' },
      { name: 'Photo and Video 1-2', honorsType: 'NH' },
      { name: 'Play Production 1-2', honorsType: 'NH' },
      { name: 'Studio Vocal Jazz Singers 1-2', honorsType: 'NH' },
      { name: 'Studio Vocal Jazz Singers 3-4', honorsType: 'NH' },
      { name: 'Studio Vocal Jazz Singers 5-6', honorsType: 'NH' },
      { name: 'Studio Vocal Jazz Singers 7-8', honorsType: 'NH' },
      { name: 'Symphonic Winds 1-2', honorsType: 'NH' },
      { name: 'Symphonic Winds 3-8', honorsType: 'NH' },
      { name: 'Varsity Chorale 3-8', honorsType: 'NH' },
      { name: 'Vocal Ensemble/Chamber Singers 1-2', honorsType: 'NH' },
      { name: 'Vocal Ensemble/Chamber Singers 3-8', honorsType: 'NH' },
    ],
    'College-Prep Electives': [
      { name: 'AP Macroeconomics (AP)', honorsType: 'AP' },
      { name: 'AP Microeconomics (AP)', honorsType: 'AP' },
      { name: 'AP Psychology (AP)', honorsType: 'AP' },
      { name: 'AP Research (AP)', honorsType: 'AP' },
      { name: 'Advanced Journalism: Edit, Design, Manage', honorsType: 'NH' },
      { name: 'Applied Medical Occupations and Terminology', honorsType: 'NH' },
      { name: 'Automotive and Transportation Technology 1-2', honorsType: 'NH' },
      { name: 'Automotive and Transportation Technology 3-4', honorsType: 'NH' },
      { name: 'Computer Applications', honorsType: 'NH' },
      { name: 'Creative Writing 1-2', honorsType: 'NH' },
      { name: 'Creative Writing 1-2 APEX', honorsType: 'NH' },
      { name: 'Criminal/Civil Law', honorsType: 'NH' },
      { name: 'Developing Future Mental and Behavioral Health Professionals Through Mentorships and Internships (UCCI)', honorsType: 'UCCI' },
      { name: 'Digital Media', honorsType: 'NH' },
      { name: 'Economics', honorsType: 'NH' },
      { name: 'Economics APEX', honorsType: 'NH' },
      { name: 'Economics Accelerated', honorsType: 'NH' },
      { name: 'Elements of Journalism', honorsType: 'NH' },
      { name: 'Elements of Oral Communication', honorsType: 'NH' },
      { name: 'Environmental Science APEX', honorsType: 'NH' },
      { name: 'Ethnic and Identity Studies', honorsType: 'NH' },
      { name: 'Forensic Science', honorsType: 'NH' },
      { name: 'Geography', honorsType: 'NH' },
      { name: 'Health and Career Exploration', honorsType: 'NH' },
      { name: 'Healthcare Administrative Technology', honorsType: 'NH' },
      { name: 'International Business', honorsType: 'NH' },
      { name: 'International Marketing', honorsType: 'NH' },
      { name: 'International Relations', honorsType: 'NH' },
      { name: 'Introduction to Entrepreneurship', honorsType: 'NH' },
      { name: 'Introduction to Psychology', honorsType: 'NH' },
      { name: 'Introduction to Sociology', honorsType: 'NH' },
      { name: 'Journalism: Production/Management', honorsType: 'NH' },
      { name: 'Medical Administrative Assistant', honorsType: 'NH' },
      { name: 'Medical/Clerical Occupations', honorsType: 'NH' },
      { name: 'Model United Nations', honorsType: 'NH' },
      { name: 'Psychology', honorsType: 'NH' },
      { name: 'Senior Capstone Business', honorsType: 'NH' },
      { name: 'Social Work and Health Advocacy in Action (UCCI)', honorsType: 'UCCI' },
    ]
  },
  '10th': {
    'History/Social Science': [
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
      { name: 'Advanced ELD', honorsType: 'NH' },
      { name: 'CSU Expository Reading and Writing (CSU)', honorsType: 'CSU' },
      { name: 'Diverse Voices and Media Literacy', honorsType: 'NH' },
      { name: 'English 1-2', honorsType: 'NH' },
      { name: 'English 1-2 APEX', honorsType: 'NH' },
      { name: 'English 1-2 Accelerated', honorsType: 'NH' },
      { name: 'English 3-4', honorsType: 'NH' },
      { name: 'English 3-4 APEX', honorsType: 'NH' },
      { name: 'English 3-4 Accelerated', honorsType: 'NH' },
      { name: 'English 5-6', honorsType: 'NH' },
      { name: 'English 5-6 APEX', honorsType: 'NH' },
      { name: 'English 7-8 APEX', honorsType: 'NH' },
      { name: 'Pathway Ambassadors 1-2', honorsType: 'NH' },
    ],
    'Mathematics': [
      { name: 'AP Calculus AB (AP)', honorsType: 'AP' },
      { name: 'AP Calculus BC (AP)', honorsType: 'AP' },
      { name: 'AP Computer Science A (AP)', honorsType: 'AP' },
      { name: 'AP Precalculus (AP)', honorsType: 'AP' },
      { name: 'AP Statistics (AP)', honorsType: 'AP' },
      { name: 'Algebra 1', honorsType: 'NH' },
      { name: 'Algebra 1 APEX', honorsType: 'NH' },
      { name: 'Algebra 2', honorsType: 'NH' },
      { name: 'Algebra 2 APEX', honorsType: 'NH' },
      { name: 'Algebra 2 Accelerated', honorsType: 'NH' },
      { name: 'Algebra AB', honorsType: 'NH' },
      { name: 'Algebra CD', honorsType: 'NH' },
      { name: 'Finite Math', honorsType: 'NH' },
      { name: 'Functions/Statistics/Trigonometry', honorsType: 'NH' },
      { name: 'Geometry', honorsType: 'NH' },
      { name: 'Geometry APEX', honorsType: 'NH' },
      { name: 'Geometry Accelerated', honorsType: 'NH' },
      { name: 'Intensified Algebra', honorsType: 'NH' },
      { name: 'Introduction to Data Science AB (Center X)', honorsType: 'NH' },
      { name: 'Pre Calculus', honorsType: 'NH' },
    ],
    'Science': [
      { name: 'AP Biology (AP)', honorsType: 'AP' },
      { name: 'AP Chemistry (AP)', honorsType: 'AP' },
      { name: 'AP Computer Science Principles (AP)', honorsType: 'AP' },
      { name: 'AP Environmental Science (AP)', honorsType: 'AP' },
      { name: 'AP Physics 1 (AP)', honorsType: 'AP' },
      { name: 'AP Physics C: Mechanics (AP)', honorsType: 'AP' },
      { name: 'Anatomy/Physiology', honorsType: 'NH' },
      { name: 'Anatomy/Physiology Honors', honorsType: 'HL' },
      { name: 'Biology 1-2 APEX', honorsType: 'NH' },
      { name: 'Biology: The Living Earth', honorsType: 'NH' },
      { name: 'Biology: The Living Earth APEX', honorsType: 'NH' },
      { name: 'Biomedical Research', honorsType: 'NH' },
      { name: 'Chemistry 1-2 APEX', honorsType: 'NH' },
      { name: 'Chemistry 1-2 Honors', honorsType: 'HL' },
      { name: 'Chemistry in the Earth System', honorsType: 'NH' },
      { name: 'Chemistry in the Earth System APEX', honorsType: 'NH' },
      { name: 'Earth Science 1-2 APEX', honorsType: 'NH' },
      { name: 'Environmental Geoscience', honorsType: 'NH' },
      { name: 'Food Science', honorsType: 'NH' },
      { name: 'Honors PLTW Civil Engineering and Architecture (PLTW)', honorsType: 'PLTW' },
      { name: 'Honors PLTW Cybersecurity (PLTW)', honorsType: 'PLTW' },
      { name: 'Honors PLTW Engineering Design and Development (PLTW)', honorsType: 'PLTW' },
      { name: 'Marine Biology 1-2', honorsType: 'NH' },
      { name: 'Medical Biology 1-2', honorsType: 'NH' },
      { name: 'Medical Chemistry 1-2', honorsType: 'NH' },
      { name: 'PLTW Civil Engineering and Architecture (PLTW)', honorsType: 'PLTW' },
      { name: 'PLTW Computer Science Essentials (PLTW)', honorsType: 'PLTW' },
      { name: 'PLTW Engineering Design and Development (PLTW)', honorsType: 'PLTW' },
      { name: 'Physical Oceanography', honorsType: 'NH' },
      { name: 'Physics 1-2 APEX', honorsType: 'NH' },
      { name: 'Physics of the Universe', honorsType: 'NH' },
    ],
    'Language Other Than English': [
      { name: 'AP Chinese Language and Culture (AP)', honorsType: 'AP' },
      { name: 'AP French Language and Culture (AP)', honorsType: 'AP' },
      { name: 'AP Japanese Language and Culture (AP)', honorsType: 'AP' },
      { name: 'AP Spanish Language and Culture (AP)', honorsType: 'AP' },
      { name: 'Chinese 1-2', honorsType: 'NH' },
      { name: 'Chinese 3-4', honorsType: 'NH' },
      { name: 'Chinese 5-6', honorsType: 'NH' },
      { name: 'Chinese 7-8', honorsType: 'NH' },
      { name: 'French 1-2', honorsType: 'NH' },
      { name: 'French 3-4', honorsType: 'NH' },
      { name: 'French 5-6', honorsType: 'NH' },
      { name: 'French I', honorsType: 'NH' },
      { name: 'French II', honorsType: 'NH' },
      { name: 'Japanese 1-2', honorsType: 'NH' },
      { name: 'Japanese 3-4', honorsType: 'NH' },
      { name: 'Japanese 5-6', honorsType: 'NH' },
      { name: 'Japanese 5-6 Honors', honorsType: 'HL' },
      { name: 'Japanese 7-8', honorsType: 'NH' },
      { name: 'Spanish 1-2', honorsType: 'NH' },
      { name: 'Spanish 1-2 APEX', honorsType: 'NH' },
      { name: 'Spanish 3-4', honorsType: 'NH' },
      { name: 'Spanish 3-4 APEX', honorsType: 'NH' },
      { name: 'Spanish 5-6', honorsType: 'NH' },
      { name: 'Spanish 5-6 APEX', honorsType: 'NH' },
      { name: 'Spanish for Spanish 1-2', honorsType: 'NH' },
      { name: 'Spanish for Spanish 3-4', honorsType: 'NH' },
      { name: 'Spanish for Spanish 5-6', honorsType: 'NH' },
    ],
    'Visual and Performing Arts': [
      { name: 'AP 2D Art and Design (AP)', honorsType: 'AP' },
      { name: 'AP 3D Art and Design (AP)', honorsType: 'AP' },
      { name: 'AP Art History (AP)', honorsType: 'AP' },
      { name: 'AP Drawing (AP)', honorsType: 'AP' },
      { name: 'AP Music Theory (AP)', honorsType: 'AP' },
      { name: 'Advanced Chamber Orchestra 3-8', honorsType: 'NH' },
      { name: 'Advanced Contemporary Video', honorsType: 'NH' },
      { name: 'Advanced Stage Technology', honorsType: 'NH' },
      { name: 'Advanced Theatre Arts', honorsType: 'NH' },
      { name: 'Art 1-2: Foundations', honorsType: 'NH' },
      { name: 'Art 3-4: Ceramics', honorsType: 'NH' },
      { name: 'Art 3-4: Drawing & Painting', honorsType: 'NH' },
      { name: 'Art 3-4: Three-Dimensional Art', honorsType: 'NH' },
      { name: 'Art 5-6: Drawing & Painting', honorsType: 'NH' },
      { name: 'Art 5-6: Three-Dimensional Art', honorsType: 'NH' },
      { name: 'Art 7-8: Drawing & Painting', honorsType: 'NH' },
      { name: 'Band 1-2', honorsType: 'NH' },
      { name: 'Band 3-8', honorsType: 'NH' },
      { name: 'Cecilian Singers 1-2', honorsType: 'NH' },
      { name: 'Cecilian Singers 3-8', honorsType: 'NH' },
      { name: 'Chorus/Voice 1-2', honorsType: 'NH' },
      { name: 'Chorus/Voice 3-8', honorsType: 'NH' },
      { name: 'Contemporary Video', honorsType: 'NH' },
      { name: 'Dance 5-6', honorsType: 'NH' },
      { name: 'Dance 7-8', honorsType: 'NH' },
      { name: 'Digital Art & Imaging 1-2', honorsType: 'NH' },
      { name: 'Digital Art & Imaging 3-4', honorsType: 'NH' },
      { name: 'Digital Art & Imaging 5-6', honorsType: 'NH' },
      { name: 'Exploring Art 1-2 APEX', honorsType: 'NH' },
      { name: 'Graphic Design and Printmaking 1-2', honorsType: 'NH' },
      { name: 'Instruments 1-2', honorsType: 'NH' },
      { name: 'Intermediate String Orchestra', honorsType: 'NH' },
      { name: 'Intermediate Theatre Arts', honorsType: 'NH' },
      { name: 'Introduction to Design & Engineering', honorsType: 'NH' },
      { name: 'Introduction to Songwriting', honorsType: 'NH' },
      { name: 'Introduction to Theatre Arts', honorsType: 'NH' },
      { name: 'Jazz Band 1-2', honorsType: 'NH' },
      { name: 'Jazz Band 3-8', honorsType: 'NH' },
      { name: 'Music Appreciation APEX', honorsType: 'NH' },
      { name: 'Orchestra 1-2', honorsType: 'NH' },
      { name: 'Orchestra 3-4', honorsType: 'NH' },
      { name: 'Orchestra 5-6', honorsType: 'NH' },
      { name: 'Orchestra 7-8', honorsType: 'NH' },
      { name: 'Photo and Video 1-2', honorsType: 'NH' },
      { name: 'Photo and Video 3-4', honorsType: 'NH' },
      { name: 'Play Production 1-2', honorsType: 'NH' },
      { name: 'Studio Vocal Jazz Singers 1-2', honorsType: 'NH' },
      { name: 'Studio Vocal Jazz Singers 3-4', honorsType: 'NH' },
      { name: 'Studio Vocal Jazz Singers 5-6', honorsType: 'NH' },
      { name: 'Studio Vocal Jazz Singers 7-8', honorsType: 'NH' },
      { name: 'Symphonic Winds 1-2', honorsType: 'NH' },
      { name: 'Symphonic Winds 3-8', honorsType: 'NH' },
      { name: 'Varsity Chorale 3-8', honorsType: 'NH' },
      { name: 'Vocal Ensemble/Chamber Singers 1-2', honorsType: 'NH' },
      { name: 'Vocal Ensemble/Chamber Singers 3-8', honorsType: 'NH' },
    ],
    'College-Prep Electives': [
      { name: 'AP Macroeconomics (AP)', honorsType: 'AP' },
      { name: 'AP Microeconomics (AP)', honorsType: 'AP' },
      { name: 'AP Psychology (AP)', honorsType: 'AP' },
      { name: 'AP Research (AP)', honorsType: 'AP' },
      { name: 'Advanced Journalism: Edit, Design, Manage', honorsType: 'NH' },
      { name: 'Applied Medical Occupations and Terminology', honorsType: 'NH' },
      { name: 'Automotive and Transportation Technology 1-2', honorsType: 'NH' },
      { name: 'Automotive and Transportation Technology 3-4', honorsType: 'NH' },
      { name: 'Computer Applications', honorsType: 'NH' },
      { name: 'Creative Writing 1-2', honorsType: 'NH' },
      { name: 'Creative Writing 1-2 APEX', honorsType: 'NH' },
      { name: 'Criminal/Civil Law', honorsType: 'NH' },
      { name: 'Developing Future Mental and Behavioral Health Professionals Through Mentorships and Internships (UCCI)', honorsType: 'UCCI' },
      { name: 'Digital Design and Yearbook Publication 1-2', honorsType: 'NH' },
      { name: 'Digital Design and Yearbook Publication 3-8', honorsType: 'NH' },
      { name: 'Digital Media', honorsType: 'NH' },
      { name: 'Economics', honorsType: 'NH' },
      { name: 'Economics APEX', honorsType: 'NH' },
      { name: 'Economics Accelerated', honorsType: 'NH' },
      { name: 'Elements of Journalism', honorsType: 'NH' },
      { name: 'Elements of Oral Communication', honorsType: 'NH' },
      { name: 'Environmental Science APEX', honorsType: 'NH' },
      { name: 'Ethnic Studies APEX', honorsType: 'NH' },
      { name: 'Ethnic and Identity Studies', honorsType: 'NH' },
      { name: 'Forensic Science', honorsType: 'NH' },
      { name: 'Geography', honorsType: 'NH' },
      { name: 'Health and Career Exploration', honorsType: 'NH' },
      { name: 'Healthcare Administrative Technology', honorsType: 'NH' },
      { name: 'History of Rock & Roll', honorsType: 'NH' },
      { name: 'International Business', honorsType: 'NH' },
      { name: 'International Marketing', honorsType: 'NH' },
      { name: 'International Relations', honorsType: 'NH' },
      { name: 'Introduction to Entrepreneurship', honorsType: 'NH' },
      { name: 'Introduction to Psychology', honorsType: 'NH' },
      { name: 'Introduction to Sociology', honorsType: 'NH' },
      { name: 'Journalism: Production/Management', honorsType: 'NH' },
      { name: 'Medical Administrative Assistant', honorsType: 'NH' },
      { name: 'Medical/Clerical Occupations', honorsType: 'NH' },
      { name: 'Model United Nations', honorsType: 'NH' },
      { name: 'Model United Nations II / Leadership', honorsType: 'NH' },
      { name: 'Pathway Ambassadors 3-4', honorsType: 'NH' },
      { name: 'Psychology', honorsType: 'NH' },
      { name: 'Senior Capstone Business', honorsType: 'NH' },
      { name: 'Senior Project', honorsType: 'NH' },
      { name: 'Social Work and Health Advocacy in Action (UCCI)', honorsType: 'UCCI' },
    ]
  },
  '11th': {
    "History/Social Science": [
      { name: "AP African American Studies", honors: "AP" },
      { name: "AP Government and Politics Comparative", honors: "AP" },
      { name: "AP Government and Politics United States", honors: "AP" },
      { name: "AP Human Geography", honors: "AP" },
      { name: "AP United States History", honors: "AP" },
      { name: "AP World History", honors: "AP" },
      { name: "Modern World History", honors: "NH" },
      { name: "Modern World History APEX", honors: "NH" },
      { name: "Modern World History Accelerated", honors: "HL" },
      { name: "US Government", honors: "NH" },
      { name: "US Government APEX", honors: "NH" },
      { name: "US Government Accelerated", honors: "HL" },
      { name: "US History", honors: "NH" },
      { name: "US History APEX", honors: "NH" },
    ],
    "English": [
      { name: "AP English Language and Composition", honors: "AP" },
      { name: "AP English Literature and Composition", honors: "AP" },
      { name: "AP Seminar", honors: "AP" },
      { name: "Advanced ELD", honors: "HL" },
      { name: "CSU Expository Reading and Writing", honors: "CSU" },
      { name: "Diverse Voices and Media Literacy", honors: "NH" },
      { name: "English 1-2", honors: "NH" },
      { name: "English 1-2 APEX", honors: "NH" },
      { name: "English 1-2 Accelerated", honors: "HL" },
      { name: "English 3-4", honors: "NH" },
      { name: "English 3-4 APEX", honors: "NH" },
      { name: "English 3-4 Accelerated", honors: "HL" },
      { name: "English 5-6", honors: "NH" },
      { name: "English 5-6 APEX", honors: "NH" },
      { name: "English 7-8 APEX", honors: "NH" },
      { name: "Pathway Ambassadors 1-2", honors: "NH" },
    ],
    "Mathematics": [
      { name: "AP Calculus AB", honors: "AP" },
      { name: "AP Calculus BC", honors: "AP" },
      { name: "AP Computer Science A", honors: "AP" },
      { name: "AP Precalculus", honors: "AP" },
      { name: "AP Statistics", honors: "AP" },
      { name: "Algebra 1", honors: "NH" },
      { name: "Algebra 1 APEX", honors: "NH" },
      { name: "Algebra 2", honors: "NH" },
      { name: "Algebra 2 APEX", honors: "NH" },
      { name: "Algebra 2 Accelerated", honors: "HL" },
      { name: "Algebra AB", honors: "NH" },
      { name: "Algebra CD", honors: "NH" },
      { name: "Functions/Statistics/Trigonometry", honors: "NH" },
      { name: "Geometry", honors: "NH" },
      { name: "Geometry APEX", honors: "NH" },
      { name: "Geometry Accelerated", honors: "HL" },
      { name: "Introduction to Data Science AB (Center X)", honors: "NH" },
      { name: "Pre Calculus", honors: "NH" },
    ],
    "Science": [
      { name: "AP Biology", honors: "AP" },
      { name: "AP Chemistry", honors: "AP" },
      { name: "AP Computer Science Principles", honors: "AP" },
      { name: "AP Environmental Science", honors: "AP" },
      { name: "AP Physics 1", honors: "AP" },
      { name: "AP Physics C: Mechanics", honors: "AP" },
      { name: "Anatomy/Physiology", honors: "NH" },
      { name: "Anatomy/Physiology Honors", honors: "HL" },
      { name: "Biology 1-2 APEX", honors: "NH" },
      { name: "Biology: The Living Earth", honors: "NH" },
      { name: "Biology: The Living Earth APEX", honors: "NH" },
      { name: "Biomedical Research", honors: "NH" },
      { name: "Chemistry 1-2 APEX", honors: "NH" },
      { name: "Chemistry 1-2 Honors", honors: "HL" },
      { name: "Chemistry in the Earth System", honors: "NH" },
      { name: "Chemistry in the Earth System APEX", honors: "NH" },
      { name: "Earth Science 1-2 APEX", honors: "NH" },
      { name: "Environmental Geoscience", honors: "NH" },
      { name: "Food Science", honors: "NH" },
      { name: "Honors PLTW Civil Engineering and Architecture", honors: "PLTW" },
      { name: "Honors PLTW Cybersecurity", honors: "PLTW" },
      { name: "Honors PLTW Engineering Design and Development", honors: "PLTW" },
      { name: "Marine Biology 1-2", honors: "NH" },
      { name: "Medical Biology 1-2", honors: "NH" },
      { name: "Medical Chemistry 1-2", honors: "NH" },
      { name: "PLTW Computer Science Essentials", honors: "PLTW" },
      { name: "Physical Oceanography", honors: "NH" },
      { name: "Physics 1-2 APEX", honors: "NH" },
      { name: "Physics of the Universe", honors: "NH" },
      { name: "Physics of the Universe APEX", honors: "NH" },
    ],
    "Language Other Than English": [
      { name: "AP Chinese Language and Culture", honors: "AP" },
      { name: "AP French Language and Culture", honors: "AP" },
      { name: "AP Japanese Language and Culture", honors: "AP" },
      { name: "AP Spanish Language and Culture", honors: "AP" },
      { name: "Chinese 1-2", honors: "NH" },
      { name: "Chinese 3-4", honors: "NH" },
      { name: "Chinese 5-6", honors: "NH" },
      { name: "Chinese 7-8", honors: "NH" },
      { name: "French 1-2", honors: "NH" },
      { name: "French 3-4", honors: "NH" },
      { name: "French 5-6", honors: "NH" },
      { name: "French I", honors: "NH" },
      { name: "French II", honors: "NH" },
      { name: "Japanese 1-2", honors: "NH" },
      { name: "Japanese 3-4", honors: "NH" },
      { name: "Japanese 5-6", honors: "NH" },
      { name: "Japanese 5-6 Honors", honors: "HL" },
      { name: "Japanese 7-8", honors: "NH" },
      { name: "Khmer For Khmer Speakers 1-2", honors: "NH" },
      { name: "Spanish 1-2", honors: "NH" },
      { name: "Spanish 1-2 APEX", honors: "NH" },
      { name: "Spanish 3-4", honors: "NH" },
      { name: "Spanish 3-4 APEX", honors: "NH" },
      { name: "Spanish 5-6", honors: "NH" },
      { name: "Spanish 5-6 APEX", honors: "NH" },
      { name: "Spanish for Spanish 1-2", honors: "NH" },
      { name: "Spanish for Spanish 3-4", honors: "NH" },
      { name: "Spanish for Spanish 5-6", honors: "NH" },
    ],
    "Visual and Performing Arts": [
      { name: "AP 2D Art and Design", honors: "AP" },
      { name: "AP 3D Art and Design", honors: "AP" },
      { name: "AP Art History", honors: "AP" },
      { name: "AP Drawing", honors: "AP" },
      { name: "AP Music Theory", honors: "AP" },
      { name: "Advanced Chamber Orchestra 3-8", honors: "HL" },
      { name: "Advanced Stage Technology", honors: "HL" },
      { name: "Advanced Theatre Arts", honors: "HL" },
      { name: "Art 1-2: Foundations", honors: "NH" },
      { name: "Art 3-4: Ceramics", honors: "NH" },
      { name: "Art 3-4: Drawing & Painting", honors: "NH" },
      { name: "Art 3-4: Three-Dimensional Art", honors: "NH" },
      { name: "Art 5-6: Ceramics", honors: "NH" },
      { name: "Art 5-6: Drawing & Painting", honors: "NH" },
      { name: "Art 5-6: Three-Dimensional Art", honors: "NH" },
      { name: "Art 7-8: Drawing & Painting", honors: "NH" },
      { name: "Band 1-2", honors: "NH" },
      { name: "Band 3-8", honors: "NH" },
      { name: "Cecilian Singers 1-2", honors: "NH" },
      { name: "Cecilian Singers 3-8", honors: "NH" },
      { name: "Chorus/Voice 1-2", honors: "NH" },
      { name: "Chorus/Voice 3-8", honors: "NH" },
      { name: "Contemporary Video", honors: "NH" },
      { name: "Dance 5-6", honors: "NH" },
      { name: "Dance 7-8", honors: "NH" },
      { name: "Digital Art & Imaging 1-2", honors: "NH" },
      { name: "Digital Art & Imaging 3-4", honors: "NH" },
      { name: "Digital Art & Imaging 5-6", honors: "NH" },
      { name: "Exploring Art 1-2 APEX", honors: "NH" },
      { name: "Global Art Studies ELD", honors: "NH" },
      { name: "Instruments 1-2", honors: "NH" },
      { name: "Intermediate String Orchestra", honors: "NH" },
      { name: "Intermediate Theatre Arts", honors: "NH" },
      { name: "Introduction to Design & Engineering", honors: "NH" },
      { name: "Introduction to Songwriting", honors: "NH" },
      { name: "Introduction to Theatre Arts", honors: "NH" },
      { name: "Jazz Band 1-2", honors: "NH" },
      { name: "Jazz Band 3-8", honors: "NH" },
      { name: "Music Appreciation APEX", honors: "NH" },
      { name: "Orchestra 1-2", honors: "NH" },
      { name: "Orchestra 3-4", honors: "NH" },
      { name: "Orchestra 5-6", honors: "NH" },
      { name: "Orchestra 7-8", honors: "NH" },
      { name: "Photo and Video 1-2", honors: "NH" },
      { name: "Photo and Video 3-4", honors: "NH" },
      { name: "Photo and Video 5-6", honors: "NH" },
      { name: "Play Production 1-2", honors: "NH" },
      { name: "Studio Vocal Jazz Singers 1-2", honors: "NH" },
      { name: "Studio Vocal Jazz Singers 3-4", honors: "NH" },
      { name: "Studio Vocal Jazz Singers 5-6", honors: "NH" },
      { name: "Studio Vocal Jazz Singers 7-8", honors: "NH" },
      { name: "Symphonic Winds 1-2", honors: "NH" },
      { name: "Symphonic Winds 3-8", honors: "NH" },
      { name: "Varsity Chorale 3-8", honors: "NH" },
      { name: "Vocal Ensemble/Chamber Singers 1-2", honors: "NH" },
      { name: "Vocal Ensemble/Chamber Singers 3-8", honors: "NH" },
    ],
    "College-Prep Electives": [
      { name: "AP Macroeconomics", honors: "AP" },
      { name: "AP Microeconomics", honors: "AP" },
      { name: "AP Psychology", honors: "AP" },
      { name: "AP Research", honors: "AP" },
      { name: "Advanced Journalism: Edit, Design, Manage", honors: "HL" },
      { name: "Applied Medical Occupations and Terminology", honors: "NH" },
      { name: "Automotive and Transportation Technology 1-2", honors: "NH" },
      { name: "Automotive and Transportation Technology 3-4", honors: "NH" },
      { name: "Computer Applications", honors: "NH" },
      { name: "Creative Writing 1-2", honors: "NH" },
      { name: "Creative Writing 1-2 APEX", honors: "NH" },
      { name: "Criminal/Civil Law", honors: "NH" },
      { name: "Developing Future Mental and Behavioral Health Professionals Through Mentorships and Internships", honors: "UCCI" },
      { name: "Digital Design and Yearbook Publication 1-2", honors: "NH" },
      { name: "Digital Design and Yearbook Publication 3-8", honors: "NH" },
      { name: "Digital Literacy for Career and College Readiness", honors: "NH" },
      { name: "Digital Media", honors: "NH" },
      { name: "Economics", honors: "NH" },
      { name: "Economics APEX", honors: "NH" },
      { name: "Economics Accelerated", honors: "HL" },
      { name: "Elements of Journalism", honors: "NH" },
      { name: "Elements of Oral Communication", honors: "NH" },
      { name: "Environmental Science APEX", honors: "NH" },
      { name: "Ethnic Studies APEX", honors: "NH" },
      { name: "Ethnic and Identity Studies", honors: "NH" },
      { name: "Forensic Science", honors: "NH" },
      { name: "Geography", honors: "NH" },
      { name: "Health and Career Exploration", honors: "NH" },
      { name: "Healthcare Administrative Technology", honors: "NH" },
      { name: "History of Rock & Roll", honors: "NH" },
      { name: "International Business", honors: "NH" },
      { name: "International Marketing", honors: "NH" },
      { name: "International Relations", honors: "NH" },
      { name: "Introduction to Entrepreneurship", honors: "NH" },
      { name: "Introduction to Psychology", honors: "NH" },
      { name: "Introduction to Sociology", honors: "NH" },
      { name: "Journalism: Production/Management", honors: "NH" },
      { name: "Medical Administrative Assistant", honors: "NH" },
      { name: "Medical/Clerical Occupations", honors: "NH" },
      { name: "Model United Nations", honors: "NH" },
      { name: "Model United Nations II / Leadership", honors: "NH" },
      { name: "Pathway Ambassadors 3-4", honors: "NH" },
      { name: "Psychology", honors: "NH" },
      { name: "Senior Capstone Business", honors: "NH" },
      { name: "Senior Project", honors: "NH" },
      { name: "Social Work and Health Advocacy in Action", honors: "UCCI" },
    ]
  },
  '12th': {
    'History/Social Science': [
      { name: 'AP African American Studies (AP)', honorsType: 'AP' },
      { name: 'AP Government and Politics Comparative (AP)', honorsType: 'AP' },
      { name: 'AP Government and Politics United States (AP)', honorsType: 'AP' },
      { name: 'AP Human Geography (AP)', honorsType: 'AP' },
      { name: 'AP United States History (AP)', honorsType: 'AP' },
      { name: 'AP World History (AP)', honorsType: 'AP' },
      { name: 'Ethnic Studies: Our American Histories', honorsType: 'NH' },
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
      { name: 'Advanced ELD', honorsType: 'NH' },
      { name: 'CSU Expository Reading and Writing (CSU)', honorsType: 'CSU' },
      { name: 'Diverse Voices and Media Literacy', honorsType: 'NH' },
      { name: 'English 1-2', honorsType: 'NH' },
      { name: 'English 1-2 APEX', honorsType: 'NH' },
      { name: 'English 1-2 Accelerated', honorsType: 'NH' },
      { name: 'English 3-4', honorsType: 'NH' },
      { name: 'English 3-4 APEX', honorsType: 'NH' },
      { name: 'English 3-4 Accelerated', honorsType: 'NH' },
      { name: 'English 5-6', honorsType: 'NH' },
      { name: 'English 5-6 APEX', honorsType: 'NH' },
      { name: 'English 7-8 APEX', honorsType: 'NH' },
      { name: 'Pathway Ambassadors 1-2', honorsType: 'NH' },
    ],
    'Mathematics': [
      { name: 'AP Calculus AB (AP)', honorsType: 'AP' },
      { name: 'AP Calculus BC (AP)', honorsType: 'AP' },
      { name: 'AP Computer Science A (AP)', honorsType: 'AP' },
      { name: 'AP Precalculus (AP)', honorsType: 'AP' },
      { name: 'AP Statistics (AP)', honorsType: 'AP' },
      { name: 'Algebra 1', honorsType: 'NH' },
      { name: 'Algebra 1 APEX', honorsType: 'NH' },
      { name: 'Algebra 2', honorsType: 'NH' },
      { name: 'Algebra 2 APEX', honorsType: 'NH' },
      { name: 'Algebra 2 Accelerated', honorsType: 'NH' },
      { name: 'Algebra AB', honorsType: 'NH' },
      { name: 'Algebra CD', honorsType: 'NH' },
      { name: 'Functions/Statistics/Trigonometry', honorsType: 'NH' },
      { name: 'Geometry', honorsType: 'NH' },
      { name: 'Geometry APEX', honorsType: 'NH' },
      { name: 'Geometry Accelerated', honorsType: 'NH' },
      { name: 'Introduction to Data Science AB (Center X)', honorsType: 'NH' },
      { name: 'Pre Calculus', honorsType: 'NH' },
    ],
    'Science': [
      { name: 'AP Biology (AP)', honorsType: 'AP' },
      { name: 'AP Chemistry (AP)', honorsType: 'AP' },
      { name: 'AP Computer Science Principles (PLTW)', honorsType: 'PLTW' },
      { name: 'AP Environmental Science (AP)', honorsType: 'AP' },
      { name: 'AP Physics 1 (AP)', honorsType: 'AP' },
      { name: 'AP Physics C: Mechanics (AP)', honorsType: 'AP' },
      { name: 'Anatomy/Physiology', honorsType: 'NH' },
      { name: 'Anatomy/Physiology Honors', honorsType: 'HL' },
      { name: 'Biology 1-2 APEX', honorsType: 'NH' },
      { name: 'Biology: The Living Earth', honorsType: 'NH' },
      { name: 'Biology: The Living Earth APEX', honorsType: 'NH' },
      { name: 'Biomedical Research', honorsType: 'NH' },
      { name: 'Chemistry 1-2 APEX', honorsType: 'NH' },
      { name: 'Chemistry 1-2 Honors', honorsType: 'HL' },
      { name: 'Chemistry in the Earth System', honorsType: 'NH' },
      { name: 'Chemistry in the Earth System APEX', honorsType: 'NH' },
      { name: 'Earth Science 1-2 APEX', honorsType: 'NH' },
      { name: 'Environmental Geoscience', honorsType: 'NH' },
      { name: 'Food Science', honorsType: 'NH' },
      { name: 'Honors PLTW Civil Engineering and Architecture (PLTW)', honorsType: 'PLTW' },
      { name: 'Honors PLTW Cybersecurity (PLTW)', honorsType: 'PLTW' },
      { name: 'Honors PLTW Engineering Design and Development (PLTW)', honorsType: 'PLTW' },
      { name: 'Marine Biology 1-2', honorsType: 'NH' },
      { name: 'Medical Biology 1-2', honorsType: 'NH' },
      { name: 'Medical Chemistry 1-2', honorsType: 'NH' },
      { name: 'PLTW Capstone Course (PLTW)', honorsType: 'PLTW' },
      { name: 'PLTW Computer Science Essentials (PLTW)', honorsType: 'PLTW' },
      { name: 'Physical Oceanography', honorsType: 'NH' },
      { name: 'Physics 1-2 APEX', honorsType: 'NH' },
      { name: 'Physics of the Universe', honorsType: 'NH' },
      { name: 'Physics of the Universe APEX', honorsType: 'NH' },
      { name: 'The Science of Green Energy', honorsType: 'NH' },
    ],
    'Language Other Than English': [
      { name: 'AP Chinese Language and Culture (AP)', honorsType: 'AP' },
      { name: 'AP French Language and Culture (AP)', honorsType: 'AP' },
      { name: 'AP Japanese Language and Culture (AP)', honorsType: 'AP' },
      { name: 'AP Spanish Language and Culture (AP)', honorsType: 'AP' },
      { name: 'AP Spanish Literature and Culture (AP)', honorsType: 'AP' },
      { name: 'Chinese 1-2', honorsType: 'NH' },
      { name: 'Chinese 3-4', honorsType: 'NH' },
      { name: 'Chinese 5-6', honorsType: 'NH' },
      { name: 'Chinese 7-8', honorsType: 'NH' },
      { name: 'French 1-2', honorsType: 'NH' },
      { name: 'French 3-4', honorsType: 'NH' },
      { name: 'French 5-6', honorsType: 'NH' },
      { name: 'French I', honorsType: 'NH' },
      { name: 'French II', honorsType: 'NH' },
      { name: 'Japanese 1-2', honorsType: 'NH' },
      { name: 'Japanese 3-4', honorsType: 'NH' },
      { name: 'Japanese 5-6', honorsType: 'NH' },
      { name: 'Japanese 5-6 Honors', honorsType: 'HL' },
      { name: 'Japanese 7-8', honorsType: 'NH' },
      { name: 'Khmer For Khmer Speakers 1-2', honorsType: 'NH' },
      { name: 'Khmer For Khmer Speakers 3-4', honorsType: 'NH' },
      { name: 'Spanish 1-2', honorsType: 'NH' },
      { name: 'Spanish 1-2 APEX', honorsType: 'NH' },
      { name: 'Spanish 3-4', honorsType: 'NH' },
      { name: 'Spanish 3-4 APEX', honorsType: 'NH' },
      { name: 'Spanish 5-6', honorsType: 'NH' },
      { name: 'Spanish 5-6 APEX', honorsType: 'NH' },
      { name: 'Spanish for Spanish 1-2', honorsType: 'NH' },
      { name: 'Spanish for Spanish 3-4', honorsType: 'NH' },
      { name: 'Spanish for Spanish 5-6', honorsType: 'NH' },
    ],
    'Visual and Performing Arts': [
      { name: 'AP 2D Art and Design (AP)', honorsType: 'AP' },
      { name: 'AP 3D Art and Design (AP)', honorsType: 'AP' },
      { name: 'AP Art History (AP)', honorsType: 'AP' },
      { name: 'AP Drawing (AP)', honorsType: 'AP' },
      { name: 'AP Music Theory (AP)', honorsType: 'AP' },
      { name: 'Advanced Chamber Orchestra 3-8', honorsType: 'NH' },
      { name: 'Advanced Stage Technology', honorsType: 'NH' },
      { name: 'Advanced Theatre Arts', honorsType: 'NH' },
      { name: 'Art 1-2: Foundations', honorsType: 'NH' },
      { name: 'Art 3-4: Ceramics', honorsType: 'NH' },
      { name: 'Art 3-4: Drawing & Painting', honorsType: 'NH' },
      { name: 'Art 3-4: Three-Dimensional Art', honorsType: 'NH' },
      { name: 'Art 5-6: Ceramics', honorsType: 'NH' },
      { name: 'Art 5-6: Drawing & Painting', honorsType: 'NH' },
      { name: 'Art 5-6: Three-Dimensional Art', honorsType: 'NH' },
      { name: 'Art 7-8: Drawing & Painting', honorsType: 'NH' },
      { name: 'Ballet Folklorico', honorsType: 'NH' },
      { name: 'Band 1-2', honorsType: 'NH' },
      { name: 'Band 3-8', honorsType: 'NH' },
      { name: 'Cecilian Singers 1-2', honorsType: 'NH' },
      { name: 'Cecilian Singers 3-8', honorsType: 'NH' },
      { name: 'Chorus/Voice 1-2', honorsType: 'NH' },
      { name: 'Chorus/Voice 3-8', honorsType: 'NH' },
      { name: 'Contemporary Video', honorsType: 'NH' },
      { name: 'Dance 5-6', honorsType: 'NH' },
      { name: 'Dance 7-8', honorsType: 'NH' },
      { name: 'Digital Art & Imaging 1-2', honorsType: 'NH' },
      { name: 'Digital Art & Imaging 3-4', honorsType: 'NH' },
      { name: 'Digital Art & Imaging 5-6', honorsType: 'NH' },
      { name: 'Exploring Art 1-2 APEX', honorsType: 'NH' },
      { name: 'Global Art Studies ELD', honorsType: 'NH' },
      { name: 'Instruments 1-2', honorsType: 'NH' },
      { name: 'Intermediate Songwriting', honorsType: 'NH' },
      { name: 'Intermediate String Orchestra', honorsType: 'NH' },
      { name: 'Intermediate Theatre Arts', honorsType: 'NH' },
      { name: 'Introduction to Design & Engineering', honorsType: 'NH' },
      { name: 'Introduction to Songwriting', honorsType: 'NH' },
      { name: 'Introduction to Theatre Arts', honorsType: 'NH' },
      { name: 'Jazz Band 1-2', honorsType: 'NH' },
      { name: 'Jazz Band 3-8', honorsType: 'NH' },
      { name: 'Music Appreciation APEX', honorsType: 'NH' },
      { name: 'Orchestra 1-2', honorsType: 'NH' },
      { name: 'Orchestra 3-4', honorsType: 'NH' },
      { name: 'Orchestra 5-6', honorsType: 'NH' },
      { name: 'Orchestra 7-8', honorsType: 'NH' },
      { name: 'Photo and Video 1-2', honorsType: 'NH' },
      { name: 'Photo and Video 3-4', honorsType: 'NH' },
      { name: 'Photo and Video 5-6', honorsType: 'NH' },
      { name: 'Piano 1-2', honorsType: 'NH' },
      { name: 'Play Production 1-2', honorsType: 'NH' },
      { name: 'Studio Vocal Jazz Singers 1-2', honorsType: 'NH' },
      { name: 'Studio Vocal Jazz Singers 3-4', honorsType: 'NH' },
      { name: 'Studio Vocal Jazz Singers 5-6', honorsType: 'NH' },
      { name: 'Studio Vocal Jazz Singers 7-8', honorsType: 'NH' },
      { name: 'Symphonic Winds 1-2', honorsType: 'NH' },
      { name: 'Symphonic Winds 3-8', honorsType: 'NH' },
      { name: 'Varsity Chorale 3-8', honorsType: 'NH' },
      { name: 'Vocal Ensemble/Chamber Singers 1-2', honorsType: 'NH' },
      { name: 'Vocal Ensemble/Chamber Singers 3-8', honorsType: 'NH' },
    ],
    'College-Prep Electives': [
      { name: 'AP Macroeconomics (AP)', honorsType: 'AP' },
      { name: 'AP Microeconomics (AP)', honorsType: 'AP' },
      { name: 'AP Psychology (AP)', honorsType: 'AP' },
      { name: 'AP Research (AP)', honorsType: 'AP' },
      { name: 'Advanced Journalism: Edit, Design, Manage', honorsType: 'NH' },
      { name: 'Applied Medical Occupations and Terminology', honorsType: 'NH' },
      { name: 'Automotive and Transportation Technology 1-2', honorsType: 'NH' },
      { name: 'Automotive and Transportation Technology 3-4', honorsType: 'NH' },
      { name: 'Computer Applications', honorsType: 'NH' },
      { name: 'Creative Writing 1-2', honorsType: 'NH' },
      { name: 'Creative Writing 1-2 APEX', honorsType: 'NH' },
      { name: 'Criminal/Civil Law', honorsType: 'NH' },
      { name: 'Developing Future Mental and Behavioral Health Professionals Through Mentorships and Internships (UCCI)', honorsType: 'UCCI' },
      { name: 'Digital Design and Yearbook Publication 1-2', honorsType: 'NH' },
      { name: 'Digital Design and Yearbook Publication 3-8', honorsType: 'NH' },
      { name: 'Digital Literacy for Career and College Readiness', honorsType: 'NH' },
      { name: 'Digital Media', honorsType: 'NH' },
      { name: 'Economics', honorsType: 'NH' },
      { name: 'Economics APEX', honorsType: 'NH' },
      { name: 'Economics Accelerated', honorsType: 'NH' },
      { name: 'Elements of Journalism', honorsType: 'NH' },
      { name: 'Elements of Oral Communication', honorsType: 'NH' },
      { name: 'Environmental Science APEX', honorsType: 'NH' },
      { name: 'Ethnic Studies APEX', honorsType: 'NH' },
      { name: 'Ethnic and Identity Studies', honorsType: 'NH' },
      { name: 'Forensic Science', honorsType: 'NH' },
      { name: 'Geography', honorsType: 'NH' },
      { name: 'Health and Career Exploration', honorsType: 'NH' },
      { name: 'Healthcare Administrative Technology', honorsType: 'NH' },
      { name: 'History of Rock & Roll', honorsType: 'NH' },
      { name: 'International Business', honorsType: 'NH' },
      { name: 'International Marketing', honorsType: 'NH' },
      { name: 'International Relations', honorsType: 'NH' },
      { name: 'Introduction to Entrepreneurship', honorsType: 'NH' },
      { name: 'Introduction to Psychology', honorsType: 'NH' },
      { name: 'Introduction to Sociology', honorsType: 'NH' },
      { name: 'Journalism: Production/Management', honorsType: 'NH' },
      { name: 'Medical Administrative Assistant', honorsType: 'NH' },
      { name: 'Medical/Clerical Occupations', honorsType: 'NH' },
      { name: 'Model United Nations', honorsType: 'NH' },
      { name: 'Model United Nations II / Leadership', honorsType: 'NH' },
      { name: 'Pathway Ambassadors 3-4', honorsType: 'NH' },
      { name: 'Psychology', honorsType: 'NH' },
      { name: 'Senior Capstone Business', honorsType: 'NH' },
      { name: 'Senior Project', honorsType: 'NH' },
      { name: 'Social Work and Health Advocacy in Action (UCCI)', honorsType: 'UCCI' },
      { name: 'The Green Future of Energy and Transportation', honorsType: 'NH' },
    ]
  }
};

const CourseHistoryStep: React.FC<{ data: AcademicJourneyData; setData: (data: AcademicJourneyData) => void }> = ({ data, setData }) => {
  const [openSubjects, setOpenSubjects] = useState<{ [key: string]: boolean }>({});
  const [showYearForm, setShowYearForm] = useState(false);
  const [newYearData, setNewYearData] = useState({ startYear: '', endYear: '', gradeLevel: '9th' });

  const addAcademicYear = () => {
    if (showYearForm && newYearData.startYear && newYearData.endYear) {
      const yearString = `${newYearData.startYear} - ${newYearData.endYear}`;
      
      // Initialize subjects with predefined courses based on selected grade
      const subjects: { [key: string]: any } = {};
      const coursesForGrade = PREDEFINED_COURSES[newYearData.gradeLevel] || PREDEFINED_COURSES['9th'];
      
      Object.entries(coursesForGrade).forEach(([subjectName, courses]) => {
        subjects[subjectName] = {
          courses: (courses as any[]).map(course => ({
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
        gradeLevel: newYearData.gradeLevel,
        subjects,
        tookSummerCourses: false
      };

      setData({ 
        ...data, 
        academicYears: [...data.academicYears, newYear] 
      });
      
      // Reset form
      setShowYearForm(false);
      setNewYearData({ startYear: '', endYear: '', gradeLevel: '9th' });
    } else {
      setShowYearForm(true);
    }
  };

  const cancelAddYear = () => {
    setShowYearForm(false);
    setNewYearData({ startYear: '', endYear: '', gradeLevel: '9th' });
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
          Add Academic Year
        </Button>
      </div>

      <div className="space-y-6">
        {showYearForm && (
          <Card className="w-full border-dashed">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">Add Academic Year</h4>
                <Button type="button" onClick={cancelAddYear} size="sm" variant="outline">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="startYear">Start Year *</Label>
                  <Input
                    id="startYear"
                    type="number"
                    placeholder="2020"
                    value={newYearData.startYear}
                    onChange={(e) => setNewYearData({...newYearData, startYear: e.target.value})}
                    min="1990"
                    max="2050"
                  />
                </div>
                <div>
                  <Label htmlFor="endYear">End Year *</Label>
                  <Input
                    id="endYear"
                    type="number"
                    placeholder="2021"
                    value={newYearData.endYear}
                    onChange={(e) => setNewYearData({...newYearData, endYear: e.target.value})}
                    min="1990"
                    max="2050"
                  />
                </div>
                <div>
                  <Label htmlFor="gradeLevel">Grade Level *</Label>
                  <Select 
                    value={newYearData.gradeLevel} 
                    onValueChange={(value) => setNewYearData({...newYearData, gradeLevel: value})}
                  >
                    <SelectTrigger>
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
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" onClick={cancelAddYear} variant="outline">
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={addAcademicYear}
                  disabled={!newYearData.startYear || !newYearData.endYear}
                >
                  Add Year
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
