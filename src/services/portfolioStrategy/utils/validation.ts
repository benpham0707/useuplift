/**
 * Portfolio Strategy Input Validation
 *
 * Comprehensive validation for all PASS system inputs.
 * Ensures data integrity and provides helpful error messages.
 *
 * QUALITY PRINCIPLES:
 * - Fail fast with clear messages
 * - Validate at boundaries (API input)
 * - Sanitize before processing
 */

import {
  AcademicInputData,
  ActivitiesInputData,
  AwardsInputData,
  StudentProfileInput,
  GPAData,
  StandardizedTestScores,
  CourseEntry,
  ActivityInputData,
  AwardInputData,
} from '../types';

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  sanitizedData?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

// ============================================================================
// GPA VALIDATION
// ============================================================================

/**
 * Validate GPA data
 */
export function validateGPA(gpa: GPAData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check GPA value range based on scale
  const maxByScale: Record<string, number> = {
    '4.0': 4.0,
    '5.0': 5.0,
    '6.0': 6.0,
    '100': 100,
  };

  const max = maxByScale[gpa.scale] || 4.0;

  if (gpa.value < 0) {
    errors.push({
      field: 'gpa.value',
      message: 'GPA cannot be negative',
      code: 'GPA_NEGATIVE',
    });
  }

  if (gpa.value > max) {
    errors.push({
      field: 'gpa.value',
      message: `GPA ${gpa.value} exceeds maximum for ${gpa.scale} scale (${max})`,
      code: 'GPA_EXCEEDS_SCALE',
    });
  }

  // Weighted GPA should have weighted type
  if (gpa.isWeighted && gpa.type === 'unweighted') {
    warnings.push({
      field: 'gpa.type',
      message: 'GPA marked as weighted but type is "unweighted"',
      suggestion: 'Update type to "weighted" or set isWeighted to false',
    });
  }

  // Suspiciously high GPA for unweighted
  if (!gpa.isWeighted && gpa.scale === '4.0' && gpa.value > 4.0) {
    errors.push({
      field: 'gpa.value',
      message: 'Unweighted GPA cannot exceed 4.0 on a 4.0 scale',
      code: 'UNWEIGHTED_GPA_TOO_HIGH',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// TEST SCORE VALIDATION
// ============================================================================

/**
 * Validate standardized test scores
 */
export function validateTestScores(scores: StandardizedTestScores): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // SAT validation
  if (scores.sat) {
    if (scores.sat.total < 400 || scores.sat.total > 1600) {
      errors.push({
        field: 'testScores.sat.total',
        message: `SAT total ${scores.sat.total} is outside valid range (400-1600)`,
        code: 'SAT_OUT_OF_RANGE',
      });
    }

    if (scores.sat.math < 200 || scores.sat.math > 800) {
      errors.push({
        field: 'testScores.sat.math',
        message: `SAT Math ${scores.sat.math} is outside valid range (200-800)`,
        code: 'SAT_MATH_OUT_OF_RANGE',
      });
    }

    if (scores.sat.ebrw < 200 || scores.sat.ebrw > 800) {
      errors.push({
        field: 'testScores.sat.ebrw',
        message: `SAT EBRW ${scores.sat.ebrw} is outside valid range (200-800)`,
        code: 'SAT_EBRW_OUT_OF_RANGE',
      });
    }

    // Check sum matches
    const expectedSum = scores.sat.math + scores.sat.ebrw;
    if (Math.abs(scores.sat.total - expectedSum) > 10) {
      warnings.push({
        field: 'testScores.sat.total',
        message: `SAT total (${scores.sat.total}) doesn't match sum of sections (${expectedSum})`,
        suggestion: 'Verify section scores are correct',
      });
    }

    // Superscore validation
    if (scores.sat.superscoreTotal) {
      if (scores.sat.superscoreTotal < scores.sat.total) {
        warnings.push({
          field: 'testScores.sat.superscoreTotal',
          message: 'Superscore is lower than single-sitting score',
          suggestion: 'Superscore should be the best combination across all attempts',
        });
      }
    }
  }

  // ACT validation
  if (scores.act) {
    if (scores.act.composite < 1 || scores.act.composite > 36) {
      errors.push({
        field: 'testScores.act.composite',
        message: `ACT composite ${scores.act.composite} is outside valid range (1-36)`,
        code: 'ACT_OUT_OF_RANGE',
      });
    }

    const sections = ['english', 'math', 'reading', 'science'] as const;
    for (const section of sections) {
      const score = scores.act[section];
      if (score < 1 || score > 36) {
        errors.push({
          field: `testScores.act.${section}`,
          message: `ACT ${section} ${score} is outside valid range (1-36)`,
          code: `ACT_${section.toUpperCase()}_OUT_OF_RANGE`,
        });
      }
    }

    // Verify composite is approximately average of sections
    const avg = (scores.act.english + scores.act.math + scores.act.reading + scores.act.science) / 4;
    if (Math.abs(scores.act.composite - Math.round(avg)) > 1) {
      warnings.push({
        field: 'testScores.act.composite',
        message: `ACT composite (${scores.act.composite}) doesn't match section average (${Math.round(avg)})`,
        suggestion: 'ACT composite is typically the rounded average of sections',
      });
    }
  }

  // AP exam validation
  if (scores.subjectTests) {
    for (let i = 0; i < scores.subjectTests.length; i++) {
      const test = scores.subjectTests[i];
      if (test.score < 200 || test.score > 800) {
        errors.push({
          field: `testScores.subjectTests[${i}].score`,
          message: `Subject test score ${test.score} is outside valid range (200-800)`,
          code: 'SUBJECT_TEST_OUT_OF_RANGE',
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// COURSE VALIDATION
// ============================================================================

/**
 * Validate course history
 */
export function validateCourses(courses: CourseEntry[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (courses.length === 0) {
    warnings.push({
      field: 'courses',
      message: 'No courses provided',
      suggestion: 'Add course history for accurate rigor assessment',
    });
  }

  // Check for required subjects
  const subjects = new Set(courses.map((c) => c.subject.toLowerCase()));
  const requiredSubjects = ['english', 'math', 'science', 'history'];
  const missingSubjects = requiredSubjects.filter((s) => !subjects.has(s));

  if (missingSubjects.length > 0) {
    warnings.push({
      field: 'courses',
      message: `Missing core subjects: ${missingSubjects.join(', ')}`,
      suggestion: 'Add courses for all core academic subjects',
    });
  }

  // Check for valid grade levels
  const validYears = ['9', '10', '11', '12', 'freshman', 'sophomore', 'junior', 'senior'];
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const year = course.year.toLowerCase();
    if (!validYears.some((v) => year.includes(v))) {
      warnings.push({
        field: `courses[${i}].year`,
        message: `Unrecognized year format: ${course.year}`,
        suggestion: 'Use grade level (9-12) or class name (freshman-senior)',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// ACTIVITY VALIDATION
// ============================================================================

/**
 * Validate single activity
 */
export function validateActivity(activity: ActivityInputData, index: number): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!activity.name || activity.name.trim().length === 0) {
    errors.push({
      field: `activities[${index}].name`,
      message: 'Activity name is required',
      code: 'ACTIVITY_NAME_REQUIRED',
    });
  }

  if (!activity.description || activity.description.trim().length === 0) {
    warnings.push({
      field: `activities[${index}].description`,
      message: 'Activity description is empty',
      suggestion: 'Add a description to help assess impact and significance',
    });
  }

  // Time commitment validation
  if (activity.timeCommitment) {
    const tc = activity.timeCommitment;

    if (tc.hoursPerWeek < 0) {
      errors.push({
        field: `activities[${index}].timeCommitment.hoursPerWeek`,
        message: 'Hours per week cannot be negative',
        code: 'HOURS_NEGATIVE',
      });
    }

    if (tc.hoursPerWeek > 80) {
      warnings.push({
        field: `activities[${index}].timeCommitment.hoursPerWeek`,
        message: `${tc.hoursPerWeek} hours/week seems unusually high`,
        suggestion: 'Verify this is accurate - this exceeds typical weekly commitment',
      });
    }

    if (tc.weeksPerYear > 52) {
      errors.push({
        field: `activities[${index}].timeCommitment.weeksPerYear`,
        message: 'Weeks per year cannot exceed 52',
        code: 'WEEKS_EXCEED_YEAR',
      });
    }

    if (tc.yearsInvolved > 10) {
      warnings.push({
        field: `activities[${index}].timeCommitment.yearsInvolved`,
        message: `${tc.yearsInvolved} years seems unusually long`,
        suggestion: 'Typically count only high school years (4 max)',
      });
    }

    // Grade levels validation
    for (const grade of tc.gradeLevels) {
      if (grade < 9 || grade > 12) {
        warnings.push({
          field: `activities[${index}].timeCommitment.gradeLevels`,
          message: `Grade ${grade} is outside typical high school range (9-12)`,
          suggestion: 'Focus on high school involvement',
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate full activities input
 */
export function validateActivities(activities: ActivitiesInputData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!activities.activities || activities.activities.length === 0) {
    warnings.push({
      field: 'activities',
      message: 'No activities provided',
      suggestion: 'Add extracurricular activities for portfolio analysis',
    });
    return { isValid: true, errors, warnings };
  }

  // Common App allows 10 activities
  if (activities.activities.length > 10) {
    warnings.push({
      field: 'activities',
      message: `${activities.activities.length} activities exceed Common App limit of 10`,
      suggestion: 'The Common App only allows 10 activities - prioritize the most impactful',
    });
  }

  // Validate each activity
  for (let i = 0; i < activities.activities.length; i++) {
    const result = validateActivity(activities.activities[i], i);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  // Total weekly hours check
  const totalHours = activities.activities.reduce(
    (sum, a) => sum + (a.timeCommitment?.hoursPerWeek || 0),
    0
  );
  if (totalHours > 60) {
    warnings.push({
      field: 'activities.totalWeeklyHours',
      message: `Total weekly commitment (${totalHours}h) seems high`,
      suggestion: 'Ensure hours don\'t overlap and are sustainable alongside academics',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// AWARD VALIDATION
// ============================================================================

/**
 * Validate single award
 */
export function validateAward(award: AwardInputData, index: number): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!award.name || award.name.trim().length === 0) {
    errors.push({
      field: `awards[${index}].name`,
      message: 'Award name is required',
      code: 'AWARD_NAME_REQUIRED',
    });
  }

  // Check for potentially inflated recognition
  const suspiciousPatterns = [
    /national\s*society\s*of\s*high\s*school\s*scholars/i,
    /who.*who/i,
    /international.*honor/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(award.name)) {
      warnings.push({
        field: `awards[${index}].name`,
        message: `Award "${award.name}" may be a pay-to-play organization`,
        suggestion: 'Verify legitimacy - some "honors" are purchased rather than earned',
      });
    }
  }

  // Grade level validation
  if (award.gradeLevel < 9 || award.gradeLevel > 12) {
    warnings.push({
      field: `awards[${index}].gradeLevel`,
      message: `Grade ${award.gradeLevel} is outside typical high school range`,
      suggestion: 'Focus on high school awards (grades 9-12)',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate full awards input
 */
export function validateAwards(awards: AwardsInputData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const allAwards = [
    ...(awards.academicHonors || []),
    ...(awards.formalRecognition || []),
    ...(awards.competitionResults || []),
    ...(awards.publications || []),
  ];

  if (allAwards.length === 0) {
    warnings.push({
      field: 'awards',
      message: 'No awards provided',
      suggestion: 'Add any academic honors, competition results, or recognitions',
    });
    return { isValid: true, errors, warnings };
  }

  // Validate each award
  for (let i = 0; i < allAwards.length; i++) {
    const result = validateAward(allAwards[i], i);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// FULL PROFILE VALIDATION
// ============================================================================

/**
 * Validate complete student profile input
 */
export function validateStudentProfile(profile: StudentProfileInput): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!profile.userId) {
    errors.push({
      field: 'userId',
      message: 'User ID is required',
      code: 'USER_ID_REQUIRED',
    });
  }

  // Validate academic data
  if (profile.academic) {
    const gpaResult = validateGPA(profile.academic.gpa);
    errors.push(...gpaResult.errors);
    warnings.push(...gpaResult.warnings);

    if (profile.academic.testScores) {
      const testResult = validateTestScores(profile.academic.testScores);
      errors.push(...testResult.errors);
      warnings.push(...testResult.warnings);
    }

    if (profile.academic.courseHistory) {
      const courseResult = validateCourses(profile.academic.courseHistory);
      errors.push(...courseResult.errors);
      warnings.push(...courseResult.warnings);
    }
  } else {
    errors.push({
      field: 'academic',
      message: 'Academic data is required',
      code: 'ACADEMIC_REQUIRED',
    });
  }

  // Validate activities
  if (profile.activities) {
    const activitiesResult = validateActivities(profile.activities);
    errors.push(...activitiesResult.errors);
    warnings.push(...activitiesResult.warnings);
  } else {
    warnings.push({
      field: 'activities',
      message: 'No activities data provided',
      suggestion: 'Add activities for complete portfolio analysis',
    });
  }

  // Validate awards
  if (profile.awards) {
    const awardsResult = validateAwards(profile.awards);
    errors.push(...awardsResult.errors);
    warnings.push(...awardsResult.warnings);
  }

  // Validate goals
  if (!profile.goals) {
    warnings.push({
      field: 'goals',
      message: 'No goals/aspirations provided',
      suggestion: 'Add intended major and target schools for school fit analysis',
    });
  } else {
    if (!profile.goals.intendedMajor) {
      warnings.push({
        field: 'goals.intendedMajor',
        message: 'No intended major specified',
        suggestion: 'Adding intended major improves activity relevance scoring',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// ACADEMIC INPUT VALIDATION
// ============================================================================

/**
 * Validate academic input data specifically
 */
export function validateAcademicInput(academic: AcademicInputData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // GPA validation
  const gpaResult = validateGPA(academic.gpa);
  errors.push(...gpaResult.errors);
  warnings.push(...gpaResult.warnings);

  // Test scores validation (if provided)
  if (academic.testScores) {
    const testResult = validateTestScores(academic.testScores);
    errors.push(...testResult.errors);
    warnings.push(...testResult.warnings);
  }

  // Course validation
  const courseResult = validateCourses(academic.courseHistory);
  errors.push(...courseResult.errors);
  warnings.push(...courseResult.warnings);

  // School context validation
  if (!academic.schoolContext) {
    errors.push({
      field: 'schoolContext',
      message: 'School context is required for accurate evaluation',
      code: 'SCHOOL_CONTEXT_REQUIRED',
    });
  } else {
    if (!academic.schoolContext.name) {
      warnings.push({
        field: 'schoolContext.name',
        message: 'School name not provided',
        suggestion: 'Add school name for counselor report context',
      });
    }
  }

  // Current grade validation
  if (academic.currentGrade < 9 || academic.currentGrade > 12) {
    errors.push({
      field: 'currentGrade',
      message: `Current grade ${academic.currentGrade} is outside high school range (9-12)`,
      code: 'INVALID_GRADE',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// SANITIZATION UTILITIES
// ============================================================================

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  return input.trim().replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: unknown, defaultValue: number = 0): number {
  if (typeof input === 'number' && !isNaN(input)) return input;
  if (typeof input === 'string') {
    const parsed = parseFloat(input);
    if (!isNaN(parsed)) return parsed;
  }
  return defaultValue;
}

/**
 * Sanitize GPA specifically
 */
export function sanitizeGPA(gpa: GPAData): GPAData {
  return {
    ...gpa,
    value: Math.max(0, Math.min(6, sanitizeNumber(gpa.value, 0))),
    scale: gpa.scale || '4.0',
    type: gpa.type || 'unweighted',
    isWeighted: Boolean(gpa.isWeighted),
  };
}

/**
 * Clamp a value to a range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
