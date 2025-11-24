/**
 * CLAIM VALIDATION UTILITY
 *
 * Validates essay claims against student's actual data (activities, academic records, etc.)
 */

import type { Activity, ExperiencesActivities, AcademicJourney } from '../database/types.js';
import { findClaimInText } from './textAnalysis.js';

export interface ValidationResult {
  is_valid: boolean;
  confidence: number;  // 0-1
  evidence_found: string[];
  suggestion: string;
}

/**
 * Validate leadership claim against activities
 */
export function validateLeadershipClaim(
  claim: string,
  activities: ExperiencesActivities | null
): ValidationResult {
  if (!activities) {
    return {
      is_valid: false,
      confidence: 0,
      evidence_found: [],
      suggestion: 'Add your extracurricular activities to validate this claim'
    };
  }

  const evidenceFound: string[] = [];

  // Check extracurriculars for leadership roles
  const extracurriculars = activities.extracurriculars || [];
  for (const activity of extracurriculars) {
    if (activity.leadership_role) {
      evidenceFound.push(`${activity.role || 'Member'} of ${activity.name}`);
    }
  }

  // Check dedicated leadership_roles array
  const leadershipRoles = activities.leadership_roles as any[] || [];
  for (const role of leadershipRoles) {
    if (role.name || role.title) {
      evidenceFound.push(role.name || role.title);
    }
  }

  // Extract claimed roles from text
  const leadershipKeywords = ['president', 'captain', 'leader', 'founder', 'chair', 'director', 'head'];
  const claimLower = claim.toLowerCase();
  const hasLeadershipKeyword = leadershipKeywords.some(kw => claimLower.includes(kw));

  if (!hasLeadershipKeyword) {
    return {
      is_valid: true,
      confidence: 0.5,
      evidence_found: evidenceFound,
      suggestion: 'Claim is vague - be more specific about your leadership role'
    };
  }

  if (evidenceFound.length === 0) {
    return {
      is_valid: false,
      confidence: 0,
      evidence_found: [],
      suggestion: 'You claim leadership experience, but your activity list shows no leadership roles. Either add your leadership roles to your activity list, or revise this claim.'
    };
  }

  // Check if claim matches actual roles (bidirectional fuzzy matching)
  // Check both: does claim contain evidence, OR does evidence contain claim keywords
  const claimMatchesEvidence = evidenceFound.some(evidence => {
    // Try both directions with lower threshold for better matching
    return findClaimInText(claim, evidence, 0.3) ||  // Does evidence appear in claim?
           findClaimInText(evidence, claim, 0.6);     // Do most evidence words appear in claim?
  });

  if (!claimMatchesEvidence) {
    return {
      is_valid: false,
      confidence: 0.3,
      evidence_found: evidenceFound,
      suggestion: `Your claimed role doesn't match your activity list. You have: ${evidenceFound.join(', ')}. Update your claim to match one of these roles.`
    };
  }

  return {
    is_valid: true,
    confidence: 0.9,
    evidence_found: evidenceFound,
    suggestion: `Validated! You have ${evidenceFound.length} leadership role(s) on record.`
  };
}

/**
 * Validate activity claim
 */
export function validateActivityClaim(
  claim: string,
  activities: ExperiencesActivities | null
): ValidationResult {
  if (!activities) {
    return {
      is_valid: false,
      confidence: 0,
      evidence_found: [],
      suggestion: 'Add your activities to validate this claim'
    };
  }

  const evidenceFound: string[] = [];

  // Search all activity types
  const allActivities = [
    ...(activities.extracurriculars || []),
    ...(activities.work_experiences as any[] || []),
    ...(activities.volunteer_service as any[] || []),
    ...(activities.personal_projects as any[] || [])
  ];

  for (const activity of allActivities) {
    const activityText = `${activity.name || ''} ${activity.description || ''} ${activity.role || ''}`;
    if (findClaimInText(claim, activityText, 0.5)) {
      evidenceFound.push(activity.name || 'Unnamed activity');
    }
  }

  if (evidenceFound.length === 0) {
    return {
      is_valid: false,
      confidence: 0,
      evidence_found: [],
      suggestion: 'This activity is not in your activity list. Add it to your profile or choose a different story.'
    };
  }

  return {
    is_valid: true,
    confidence: 0.8,
    evidence_found: evidenceFound,
    suggestion: `Found ${evidenceFound.length} matching activit${evidenceFound.length > 1 ? 'ies' : 'y'}`
  };
}

/**
 * Validate achievement/honor claim
 */
export function validateAchievementClaim(
  claim: string,
  activities: ExperiencesActivities | null
): ValidationResult {
  if (!activities) {
    return {
      is_valid: false,
      confidence: 0,
      evidence_found: [],
      suggestion: 'Add your achievements to validate this claim'
    };
  }

  const evidenceFound: string[] = [];

  // Check academic honors
  const honors = activities.academic_honors as any[] || [];
  for (const honor of honors) {
    const honorText = `${honor.name || ''} ${honor.description || ''}`;
    if (findClaimInText(claim, honorText, 0.5)) {
      evidenceFound.push(honor.name || 'Academic honor');
    }
  }

  // Check formal recognition
  const recognition = activities.formal_recognition as any[] || [];
  for (const recog of recognition) {
    const recogText = `${recog.name || ''} ${recog.description || ''}`;
    if (findClaimInText(claim, recogText, 0.5)) {
      evidenceFound.push(recog.name || 'Recognition');
    }
  }

  if (evidenceFound.length === 0) {
    return {
      is_valid: false,
      confidence: 0,
      evidence_found: [],
      suggestion: 'This achievement is not in your honors/awards list. Add it to your profile or provide more context.'
    };
  }

  return {
    is_valid: true,
    confidence: 0.85,
    evidence_found: evidenceFound,
    suggestion: `Validated against ${evidenceFound.length} honor(s)/award(s)`
  };
}

/**
 * Validate academic claim (GPA, courses, test scores)
 */
export function validateAcademicClaim(
  claim: string,
  academic: AcademicJourney | null
): ValidationResult {
  if (!academic) {
    return {
      is_valid: false,
      confidence: 0,
      evidence_found: [],
      suggestion: 'Add your academic information to validate this claim'
    };
  }

  const evidenceFound: string[] = [];
  const claimLower = claim.toLowerCase();

  // Check GPA claims
  if (claimLower.includes('gpa') || claimLower.includes('grade')) {
    if (academic.gpa) {
      evidenceFound.push(`GPA: ${academic.gpa}/${academic.gpa_scale || '4.0'}`);
    } else {
      return {
        is_valid: false,
        confidence: 0,
        evidence_found: [],
        suggestion: 'You claim a GPA but have no GPA in your profile. Add your GPA or remove this claim.'
      };
    }
  }

  // Check AP/IB claims
  if (claimLower.includes('ap') || claimLower.includes('advanced placement')) {
    const apExams = academic.ap_exams as any[] || [];
    if (apExams.length > 0) {
      evidenceFound.push(`${apExams.length} AP exam(s) recorded`);
    }
  }

  if (claimLower.includes('ib') || claimLower.includes('international baccalaureate')) {
    const ibExams = academic.ib_exams as any[] || [];
    if (ibExams.length > 0) {
      evidenceFound.push(`${ibExams.length} IB exam(s) recorded`);
    }
  }

  // Check test score claims
  if (claimLower.includes('sat') || claimLower.includes('act')) {
    const tests = academic.standardized_tests as any || {};
    if (tests.sat || tests.act) {
      evidenceFound.push('Test scores on record');
    }
  }

  // Check course rigor
  if (claimLower.includes('rigorous') || claimLower.includes('challenging courses')) {
    const courseHistory = academic.course_history as any[] || [];
    const apCourses = courseHistory.filter((c: any) => c.level === 'AP' || c.level === 'IB');
    if (apCourses.length > 0) {
      evidenceFound.push(`${apCourses.length} advanced course(s)`);
    }
  }

  if (evidenceFound.length === 0) {
    return {
      is_valid: false,
      confidence: 0.3,
      evidence_found: [],
      suggestion: 'Could not validate this academic claim. Add relevant academic data to your profile.'
    };
  }

  return {
    is_valid: true,
    confidence: 0.8,
    evidence_found: evidenceFound,
    suggestion: 'Academic claim validated'
  };
}

/**
 * Main validation function - routes to appropriate validator
 */
export function validateClaim(
  claim: string,
  claimType: 'leadership' | 'activity' | 'achievement' | 'academic',
  activities: ExperiencesActivities | null,
  academic: AcademicJourney | null
): ValidationResult {
  switch (claimType) {
    case 'leadership':
      return validateLeadershipClaim(claim, activities);
    case 'activity':
      return validateActivityClaim(claim, activities);
    case 'achievement':
      return validateAchievementClaim(claim, activities);
    case 'academic':
      return validateAcademicClaim(claim, academic);
    default:
      return {
        is_valid: false,
        confidence: 0,
        evidence_found: [],
        suggestion: 'Unknown claim type'
      };
  }
}
