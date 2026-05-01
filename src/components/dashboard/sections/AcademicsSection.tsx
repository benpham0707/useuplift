import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/safeClient';
import { toast } from '@/hooks/use-toast';

interface SectionFormProps {
  profileId: string;
  onSaveComplete: () => void;
}

interface AcademicsData {
  // School Info
  currentSchool: {
    name: string;
    city: string;
    state: string;
  };
  currentGrade: string;
  expectedGradDate: string;
  isBoardingSchool: boolean;
  homeschooled: boolean;
  studiedAbroad: boolean;

  // GPA & Ranking
  gpa: string;
  gpaScale: string;
  gpaType: string;
  classRank: string;
  rankReportingMethod: string;
  classSize: number;

  // Testing
  reportTestScores: boolean;
  standardizedTests: {
    sat?: {
      total: number;
      ebrw: number;
      math: number;
    };
    act?: {
      composite: number;
      english: number;
      math: number;
      reading: number;
      science: number;
    };
  };
  apExams: Array<{
    subject: string;
    score: number;
    year: number;
  }>;
  ibExams: Array<{
    subject: string;
    level: string;
    score: number;
    year: number;
  }>;

  // Coursework
  courseHistory: Array<{
    name: string;
    level: string;
    grade: string;
    year: string;
  }>;
  collegeCourses: Array<{
    name: string;
    institution: string;
    credits: number;
    grade: string;
  }>;
}

export default function AcademicsSection({ profileId, onSaveComplete }: SectionFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<AcademicsData>({
    currentSchool: { name: '', city: '', state: '' },
    currentGrade: '',
    expectedGradDate: '',
    isBoardingSchool: false,
    homeschooled: false,
    studiedAbroad: false,
    gpa: '',
    gpaScale: '4.0',
    gpaType: 'weighted',
    classRank: '',
    rankReportingMethod: 'exact',
    classSize: 0,
    reportTestScores: false,
    standardizedTests: {},
    apExams: [],
    ibExams: [],
    courseHistory: [],
    collegeCourses: []
  });

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get profile data for pre-fill
        const { data: profileData } = await supabase
          .from('profiles')
          .select('school_name, graduation_year, gpa_range')
          .eq('id', profileId)
          .maybeSingle();

        // Get academic_journey data
        const { data: existingData, error } = await supabase
          .from('academic_journey')
          .select('*')
          .eq('profile_id', profileId)
          .maybeSingle();

        if (error) throw error;

        if (existingData) {
          setData({
            currentSchool: existingData.current_school || { name: '', city: '', state: '' },
            currentGrade: existingData.current_grade || '',
            expectedGradDate: existingData.expected_grad_date || '',
            isBoardingSchool: existingData.is_boarding_school || false,
            homeschooled: existingData.homeschooled || false,
            studiedAbroad: existingData.studied_abroad || false,
            gpa: existingData.gpa ? existingData.gpa.toString() : '',
            gpaScale: existingData.gpa_scale || '4.0',
            gpaType: existingData.gpa_type || 'weighted',
            classRank: existingData.class_rank || '',
            rankReportingMethod: existingData.rank_reporting_method || 'exact',
            classSize: existingData.class_size || 0,
            reportTestScores: existingData.report_test_scores || false,
            standardizedTests: existingData.standardized_tests || {},
            apExams: Array.isArray(existingData.ap_exams) ? existingData.ap_exams : [],
            ibExams: Array.isArray(existingData.ib_exams) ? existingData.ib_exams : [],
            courseHistory: Array.isArray(existingData.course_history) ? existingData.course_history : [],
            collegeCourses: Array.isArray(existingData.college_courses) ? existingData.college_courses : []
          });
        } else if (profileData) {
          // Pre-fill from profile data
          setData(prev => ({
            ...prev,
            currentSchool: { ...prev.currentSchool, name: profileData.school_name || '' },
            expectedGradDate: profileData.graduation_year ? `${profileData.graduation_year}-06-01` : ''
          }));
        }
      } catch (err) {
        console.error('[AcademicsSection] Error loading data:', err);
        toast({
          title: 'Error',
          description: 'Failed to load academic data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [profileId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('academic_journey')
        .upsert({
          profile_id: profileId,
          current_school: data.currentSchool,
          current_grade: data.currentGrade,
          expected_grad_date: data.expectedGradDate,
          is_boarding_school: data.isBoardingSchool,
          homeschooled: data.homeschooled,
          studied_abroad: data.studiedAbroad,
          gpa: data.gpa ? parseFloat(data.gpa) : null,
          gpa_scale: data.gpaScale,
          gpa_type: data.gpaType,
          class_rank: data.classRank,
          rank_reporting_method: data.rankReportingMethod,
          class_size: data.classSize,
          report_test_scores: data.reportTestScores,
          standardized_tests: data.standardizedTests,
          ap_exams: data.apExams,
          ib_exams: data.ibExams,
          course_history: data.courseHistory,
          college_courses: data.collegeCourses,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'profile_id'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Academic details saved successfully'
      });

      onSaveComplete();
    } catch (err) {
      console.error('[AcademicsSection] Error saving data:', err);
      toast({
        title: 'Error',
        description: 'Failed to save academic details',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading academic details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Academic Details</h3>
        <p className="text-sm text-gray-600">
          Help us understand your academic background. We've pre-filled some information from your profile — feel free to update or add more detail.
        </p>
      </div>

      {/* School Info */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">School Information</h4>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="text-xs">Current School Name</Label>
            <Input
              value={data.currentSchool.name}
              onChange={e => setData({
                ...data,
                currentSchool: { ...data.currentSchool, name: e.target.value }
              })}
              placeholder="School name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">City</Label>
              <Input
                value={data.currentSchool.city}
                onChange={e => setData({
                  ...data,
                  currentSchool: { ...data.currentSchool, city: e.target.value }
                })}
                placeholder="City"
              />
            </div>
            <div>
              <Label className="text-xs">State</Label>
              <Input
                value={data.currentSchool.state}
                onChange={e => setData({
                  ...data,
                  currentSchool: { ...data.currentSchool, state: e.target.value }
                })}
                placeholder="State"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Current Grade/Year</Label>
              <Select
                value={data.currentGrade}
                onValueChange={value => setData({ ...data, currentGrade: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9th">9th Grade</SelectItem>
                  <SelectItem value="10th">10th Grade</SelectItem>
                  <SelectItem value="11th">11th Grade</SelectItem>
                  <SelectItem value="12th">12th Grade</SelectItem>
                  <SelectItem value="gap_year">Gap Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Expected Graduation Date</Label>
              <Input
                type="date"
                value={data.expectedGradDate}
                onChange={e => setData({ ...data, expectedGradDate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="boarding"
                checked={data.isBoardingSchool}
                onCheckedChange={checked => setData({ ...data, isBoardingSchool: checked === true })}
              />
              <Label htmlFor="boarding" className="text-xs font-normal cursor-pointer">
                I attend a boarding school
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="homeschool"
                checked={data.homeschooled}
                onCheckedChange={checked => setData({ ...data, homeschooled: checked === true })}
              />
              <Label htmlFor="homeschool" className="text-xs font-normal cursor-pointer">
                I am homeschooled
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="abroad"
                checked={data.studiedAbroad}
                onCheckedChange={checked => setData({ ...data, studiedAbroad: checked === true })}
              />
              <Label htmlFor="abroad" className="text-xs font-normal cursor-pointer">
                I have studied abroad
              </Label>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* GPA & Ranking */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">GPA & Class Standing</h4>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs text-blue-900">
            <strong>Key Field:</strong> Your exact GPA helps us provide more accurate college matching and recommendations.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">GPA (exact)</Label>
            <Input
              type="number"
              step="0.01"
              value={data.gpa}
              onChange={e => setData({ ...data, gpa: e.target.value })}
              placeholder="3.85"
            />
          </div>
          <div>
            <Label className="text-xs">GPA Scale</Label>
            <Select
              value={data.gpaScale}
              onValueChange={value => setData({ ...data, gpaScale: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4.0">4.0 Scale</SelectItem>
                <SelectItem value="5.0">5.0 Scale</SelectItem>
                <SelectItem value="100">100-Point Scale</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">GPA Type</Label>
            <Select
              value={data.gpaType}
              onValueChange={value => setData({ ...data, gpaType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weighted">Weighted</SelectItem>
                <SelectItem value="unweighted">Unweighted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Rank Reporting Method</Label>
            <Select
              value={data.rankReportingMethod}
              onValueChange={value => setData({ ...data, rankReportingMethod: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exact">Exact Rank</SelectItem>
                <SelectItem value="decile">Decile</SelectItem>
                <SelectItem value="quartile">Quartile</SelectItem>
                <SelectItem value="quintile">Quintile</SelectItem>
                <SelectItem value="none">School Doesn't Rank</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {data.rankReportingMethod !== 'none' && (
            <>
              <div>
                <Label className="text-xs">Class Rank</Label>
                <Input
                  value={data.classRank}
                  onChange={e => setData({ ...data, classRank: e.target.value })}
                  placeholder="e.g., 15 or Top 10%"
                />
              </div>
              <div>
                <Label className="text-xs">Class Size</Label>
                <Input
                  type="number"
                  value={data.classSize}
                  onChange={e => setData({ ...data, classSize: parseInt(e.target.value) || 0 })}
                  placeholder="500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Testing */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="report-tests"
            checked={data.reportTestScores}
            onCheckedChange={checked => setData({ ...data, reportTestScores: checked === true })}
          />
          <Label htmlFor="report-tests" className="text-sm font-medium cursor-pointer">
            I want to report standardized test scores
          </Label>
        </div>

        {data.reportTestScores && (
          <div className="space-y-4 pl-6 border-l-2 border-gray-200">
            <div className="space-y-3">
              <h5 className="text-xs font-medium text-gray-700">SAT Scores</h5>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Total</Label>
                  <Input
                    type="number"
                    value={data.standardizedTests.sat?.total || ''}
                    onChange={e => setData({
                      ...data,
                      standardizedTests: {
                        ...data.standardizedTests,
                        sat: {
                          ...data.standardizedTests.sat,
                          total: parseInt(e.target.value) || 0,
                          ebrw: data.standardizedTests.sat?.ebrw || 0,
                          math: data.standardizedTests.sat?.math || 0
                        }
                      }
                    })}
                    placeholder="1200"
                  />
                </div>
                <div>
                  <Label className="text-xs">EBRW</Label>
                  <Input
                    type="number"
                    value={data.standardizedTests.sat?.ebrw || ''}
                    onChange={e => setData({
                      ...data,
                      standardizedTests: {
                        ...data.standardizedTests,
                        sat: {
                          total: data.standardizedTests.sat?.total || 0,
                          ebrw: parseInt(e.target.value) || 0,
                          math: data.standardizedTests.sat?.math || 0
                        }
                      }
                    })}
                    placeholder="600"
                  />
                </div>
                <div>
                  <Label className="text-xs">Math</Label>
                  <Input
                    type="number"
                    value={data.standardizedTests.sat?.math || ''}
                    onChange={e => setData({
                      ...data,
                      standardizedTests: {
                        ...data.standardizedTests,
                        sat: {
                          total: data.standardizedTests.sat?.total || 0,
                          ebrw: data.standardizedTests.sat?.ebrw || 0,
                          math: parseInt(e.target.value) || 0
                        }
                      }
                    })}
                    placeholder="600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-medium text-gray-700">ACT Scores</h5>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <Label className="text-xs">Composite</Label>
                  <Input
                    type="number"
                    value={data.standardizedTests.act?.composite || ''}
                    onChange={e => setData({
                      ...data,
                      standardizedTests: {
                        ...data.standardizedTests,
                        act: {
                          ...data.standardizedTests.act,
                          composite: parseInt(e.target.value) || 0,
                          english: data.standardizedTests.act?.english || 0,
                          math: data.standardizedTests.act?.math || 0,
                          reading: data.standardizedTests.act?.reading || 0,
                          science: data.standardizedTests.act?.science || 0
                        }
                      }
                    })}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label className="text-xs">English</Label>
                  <Input
                    type="number"
                    value={data.standardizedTests.act?.english || ''}
                    onChange={e => setData({
                      ...data,
                      standardizedTests: {
                        ...data.standardizedTests,
                        act: { ...data.standardizedTests.act!, english: parseInt(e.target.value) || 0 }
                      }
                    })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Math</Label>
                  <Input
                    type="number"
                    value={data.standardizedTests.act?.math || ''}
                    onChange={e => setData({
                      ...data,
                      standardizedTests: {
                        ...data.standardizedTests,
                        act: { ...data.standardizedTests.act!, math: parseInt(e.target.value) || 0 }
                      }
                    })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Reading</Label>
                  <Input
                    type="number"
                    value={data.standardizedTests.act?.reading || ''}
                    onChange={e => setData({
                      ...data,
                      standardizedTests: {
                        ...data.standardizedTests,
                        act: { ...data.standardizedTests.act!, reading: parseInt(e.target.value) || 0 }
                      }
                    })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Science</Label>
                  <Input
                    type="number"
                    value={data.standardizedTests.act?.science || ''}
                    onChange={e => setData({
                      ...data,
                      standardizedTests: {
                        ...data.standardizedTests,
                        act: { ...data.standardizedTests.act!, science: parseInt(e.target.value) || 0 }
                      }
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-medium text-gray-700">AP Exams</h5>
              {data.apExams.map((exam, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Subject</Label>
                    <Input
                      value={exam.subject}
                      onChange={e => {
                        const updated = [...data.apExams];
                        updated[idx].subject = e.target.value;
                        setData({ ...data, apExams: updated });
                      }}
                      placeholder="AP Calculus BC"
                    />
                  </div>
                  <div className="w-20">
                    <Label className="text-xs">Score</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={exam.score}
                      onChange={e => {
                        const updated = [...data.apExams];
                        updated[idx].score = parseInt(e.target.value) || 0;
                        setData({ ...data, apExams: updated });
                      }}
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Year</Label>
                    <Input
                      type="number"
                      value={exam.year}
                      onChange={e => {
                        const updated = [...data.apExams];
                        updated[idx].year = parseInt(e.target.value) || new Date().getFullYear();
                        setData({ ...data, apExams: updated });
                      }}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setData({
                      ...data,
                      apExams: data.apExams.filter((_, i) => i !== idx)
                    })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData({
                  ...data,
                  apExams: [...data.apExams, { subject: '', score: 0, year: new Date().getFullYear() }]
                })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add AP Exam
              </Button>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-medium text-gray-700">IB Exams</h5>
              {data.ibExams.map((exam, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Subject</Label>
                    <Input
                      value={exam.subject}
                      onChange={e => {
                        const updated = [...data.ibExams];
                        updated[idx].subject = e.target.value;
                        setData({ ...data, ibExams: updated });
                      }}
                      placeholder="IB Math HL"
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Level</Label>
                    <Select
                      value={exam.level}
                      onValueChange={value => {
                        const updated = [...data.ibExams];
                        updated[idx].level = value;
                        setData({ ...data, ibExams: updated });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SL">SL</SelectItem>
                        <SelectItem value="HL">HL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    <Label className="text-xs">Score</Label>
                    <Input
                      type="number"
                      min="1"
                      max="7"
                      value={exam.score}
                      onChange={e => {
                        const updated = [...data.ibExams];
                        updated[idx].score = parseInt(e.target.value) || 0;
                        setData({ ...data, ibExams: updated });
                      }}
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Year</Label>
                    <Input
                      type="number"
                      value={exam.year}
                      onChange={e => {
                        const updated = [...data.ibExams];
                        updated[idx].year = parseInt(e.target.value) || new Date().getFullYear();
                        setData({ ...data, ibExams: updated });
                      }}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setData({
                      ...data,
                      ibExams: data.ibExams.filter((_, i) => i !== idx)
                    })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData({
                  ...data,
                  ibExams: [...data.ibExams, { subject: '', level: 'SL', score: 0, year: new Date().getFullYear() }]
                })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add IB Exam
              </Button>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Coursework - Optional, collapsed by default */}
      <details className="space-y-4">
        <summary className="text-sm font-medium text-gray-900 cursor-pointer hover:text-gray-600">
          Course History (Optional)
        </summary>
        <div className="space-y-4 pl-6 border-l-2 border-gray-200">
          <p className="text-xs text-gray-600">
            You can add specific courses here or skip for now. This is the lowest priority section.
          </p>

          <div className="space-y-3">
            <h5 className="text-xs font-medium text-gray-700">High School Courses</h5>
            {data.courseHistory.map((course, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Course Name</Label>
                  <Input
                    value={course.name}
                    onChange={e => {
                      const updated = [...data.courseHistory];
                      updated[idx].name = e.target.value;
                      setData({ ...data, courseHistory: updated });
                    }}
                    placeholder="AP Biology"
                  />
                </div>
                <div className="w-32">
                  <Label className="text-xs">Level</Label>
                  <Input
                    value={course.level}
                    onChange={e => {
                      const updated = [...data.courseHistory];
                      updated[idx].level = e.target.value;
                      setData({ ...data, courseHistory: updated });
                    }}
                    placeholder="Honors"
                  />
                </div>
                <div className="w-20">
                  <Label className="text-xs">Grade</Label>
                  <Input
                    value={course.grade}
                    onChange={e => {
                      const updated = [...data.courseHistory];
                      updated[idx].grade = e.target.value;
                      setData({ ...data, courseHistory: updated });
                    }}
                    placeholder="A"
                  />
                </div>
                <div className="w-24">
                  <Label className="text-xs">Year</Label>
                  <Input
                    value={course.year}
                    onChange={e => {
                      const updated = [...data.courseHistory];
                      updated[idx].year = e.target.value;
                      setData({ ...data, courseHistory: updated });
                    }}
                    placeholder="2024"
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setData({
                    ...data,
                    courseHistory: data.courseHistory.filter((_, i) => i !== idx)
                  })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setData({
                ...data,
                courseHistory: [...data.courseHistory, { name: '', level: '', grade: '', year: '' }]
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-medium text-gray-700">College Courses (Dual Enrollment)</h5>
            {data.collegeCourses.map((course, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Course Name</Label>
                  <Input
                    value={course.name}
                    onChange={e => {
                      const updated = [...data.collegeCourses];
                      updated[idx].name = e.target.value;
                      setData({ ...data, collegeCourses: updated });
                    }}
                    placeholder="Introduction to Psychology"
                  />
                </div>
                <div className="w-40">
                  <Label className="text-xs">Institution</Label>
                  <Input
                    value={course.institution}
                    onChange={e => {
                      const updated = [...data.collegeCourses];
                      updated[idx].institution = e.target.value;
                      setData({ ...data, collegeCourses: updated });
                    }}
                    placeholder="Local CC"
                  />
                </div>
                <div className="w-20">
                  <Label className="text-xs">Credits</Label>
                  <Input
                    type="number"
                    value={course.credits}
                    onChange={e => {
                      const updated = [...data.collegeCourses];
                      updated[idx].credits = parseInt(e.target.value) || 0;
                      setData({ ...data, collegeCourses: updated });
                    }}
                    placeholder="3"
                  />
                </div>
                <div className="w-20">
                  <Label className="text-xs">Grade</Label>
                  <Input
                    value={course.grade}
                    onChange={e => {
                      const updated = [...data.collegeCourses];
                      updated[idx].grade = e.target.value;
                      setData({ ...data, collegeCourses: updated });
                    }}
                    placeholder="A"
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setData({
                    ...data,
                    collegeCourses: data.collegeCourses.filter((_, i) => i !== idx)
                  })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setData({
                ...data,
                collegeCourses: [...data.collegeCourses, { name: '', institution: '', credits: 0, grade: '' }]
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add College Course
            </Button>
          </div>
        </div>
      </details>

      <div className="pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={isSaving || !data.gpa}
          className="w-full"
        >
          {isSaving ? 'Saving...' : 'Save & Close'}
        </Button>
        {!data.gpa && (
          <p className="text-xs text-red-600 mt-2 text-center">
            GPA is required to save this section
          </p>
        )}
      </div>
    </div>
  );
}
