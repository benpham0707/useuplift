import { motion } from 'motion/react';
import { AcademicPath, GPARange, OnboardingFormData } from '@/types/onboarding';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AcademicDetailsStepProps {
  academicPath: AcademicPath;
  formData: OnboardingFormData;
  onChange: (updates: Partial<OnboardingFormData>) => void;
}

const GPA_OPTIONS: { value: GPARange; label: string }[] = [
  { value: 'below_2.5', label: 'Below 2.5' },
  { value: '2.5_3.0', label: '2.5 – 3.0' },
  { value: '3.0_3.5', label: '3.0 – 3.5' },
  { value: '3.5_4.0', label: '3.5 – 4.0' },
  { value: '4.0_plus', label: '4.0+' },
];

const CURRENT_YEAR = new Date().getFullYear();
const GRADUATION_YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR + i);

const HIGHEST_EDUCATION_OPTIONS = [
  'High school diploma',
  'Some college',
  "Associate's degree",
  "Bachelor's degree",
  "Master's degree",
  'Doctorate',
];

const YEARS_EXPERIENCE_OPTIONS = ['0-1 years', '1-3 years', '3-5 years', '5+ years'];

const ACTIVITY_OPTIONS = [
  'Working',
  'Volunteering',
  'Traveling',
  'Self-studying',
  'Exploring options',
];

const COLLEGE_PLANS_OPTIONS = [
  'Yes, within a year',
  'Maybe eventually',
  'Not sure',
];

export const AcademicDetailsStep = ({
  academicPath,
  formData,
  onChange,
}: AcademicDetailsStepProps) => {
  const [selectedActivities, setSelectedActivities] = useState<string[]>(
    formData.current_activities || []
  );

  const handleActivityToggle = (activity: string) => {
    const newActivities = selectedActivities.includes(activity)
      ? selectedActivities.filter(a => a !== activity)
      : [...selectedActivities, activity];
    setSelectedActivities(newActivities);
    onChange({ current_activities: newActivities });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold"
        >
          {formData.first_name ? `Welcome, ${formData.first_name}!` : 'Welcome!'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xl md:text-2xl text-muted-foreground"
        >
          Tell us a bit about your academics.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        {/* High School Student Fields */}
        {academicPath === 'high_school' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="school_name">School Name</Label>
              <Input
                id="school_name"
                placeholder="Enter your school name"
                value={formData.school_name || ''}
                onChange={e => onChange({ school_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="graduation_year">Expected Graduation Year</Label>
              <Select
                value={formData.graduation_year?.toString()}
                onValueChange={value => onChange({ graduation_year: parseInt(value) })}
              >
                <SelectTrigger id="graduation_year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {GRADUATION_YEARS.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>GPA Range</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GPA_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => onChange({ gpa_range: option.value })}
                    className={cn(
                      'px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all',
                      formData.gpa_range === option.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Have you taken the SAT or ACT?</Label>
              <div className="flex gap-3">
                <button
                  onClick={() => onChange({ has_test_scores: true })}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all',
                    formData.has_test_scores === true
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  Yes
                </button>
                <button
                  onClick={() => onChange({ has_test_scores: false, test_score_range: undefined })}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all',
                    formData.has_test_scores === false
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  No
                </button>
              </div>
            </div>

            {formData.has_test_scores && (
              <div className="space-y-2">
                <Label htmlFor="test_score_range">Score Range (Optional)</Label>
                <Input
                  id="test_score_range"
                  placeholder="e.g., 1200-1300 SAT or 25-28 ACT"
                  value={formData.test_score_range || ''}
                  onChange={e => onChange({ test_score_range: e.target.value })}
                />
              </div>
            )}
          </>
        )}

        {/* College Student Fields */}
        {academicPath === 'college' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="school_name">School Name</Label>
              <Input
                id="school_name"
                placeholder="Enter your college/university name"
                value={formData.school_name || ''}
                onChange={e => onChange({ school_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="graduation_year">Expected Graduation Year</Label>
              <Select
                value={formData.graduation_year?.toString()}
                onValueChange={value => onChange({ graduation_year: parseInt(value) })}
              >
                <SelectTrigger id="graduation_year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {GRADUATION_YEARS.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                placeholder="Enter your major or 'Undeclared'"
                value={formData.major || ''}
                onChange={e => onChange({ major: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <Label>GPA Range</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GPA_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => onChange({ gpa_range: option.value })}
                    className={cn(
                      'px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all',
                      formData.gpa_range === option.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Professional Fields */}
        {academicPath === 'professional' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="highest_education">Highest Education Completed</Label>
              <Select
                value={formData.highest_education}
                onValueChange={value => onChange({ highest_education: value })}
              >
                <SelectTrigger id="highest_education">
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  {HIGHEST_EDUCATION_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="years_experience">Years of Work Experience</Label>
              <Select
                value={formData.years_experience}
                onValueChange={value => onChange({ years_experience: value })}
              >
                <SelectTrigger id="years_experience">
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS_EXPERIENCE_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_field">Current Field/Industry</Label>
              <Input
                id="current_field"
                placeholder="e.g., Software, Healthcare, Education"
                value={formData.current_field || ''}
                onChange={e => onChange({ current_field: e.target.value })}
              />
            </div>
          </>
        )}

        {/* Gap Year Fields */}
        {academicPath === 'gap_year' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="school_name">Last School Attended (Optional)</Label>
              <Input
                id="school_name"
                placeholder="Enter school name"
                value={formData.school_name || ''}
                onChange={e => onChange({ school_name: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <Label>What are you currently doing? (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITY_OPTIONS.map(activity => (
                  <button
                    key={activity}
                    onClick={() => handleActivityToggle(activity)}
                    className={cn(
                      'px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all',
                      selectedActivities.includes(activity)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {activity}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="college_plans">Planning to enroll in college?</Label>
              <Select
                value={formData.college_plans}
                onValueChange={value => onChange({ college_plans: value })}
              >
                <SelectTrigger id="college_plans">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {COLLEGE_PLANS_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
