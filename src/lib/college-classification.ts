/**
 * College Classification Logic
 *
 * Determines whether a college is a Reach, Match, or Safety for a student
 * based on their GPA and test scores compared to the college's admission statistics.
 *
 * Algorithm based on acceptance rate and statistical thresholds defined in
 * docs/specs/COLLEGE_DATABASE.md lines 508-631
 */

import type { College, CollegeCategory, ClassificationThresholds } from './types/college';

// Classification thresholds (tunable based on user feedback)
export const CLASSIFICATION_THRESHOLDS: ClassificationThresholds = {
  highly_selective: {
    acceptance_rate: 20,
    match_gpa_buffer: 0.2,
    match_sat_buffer: 100,
  },
  moderate_selective: {
    acceptance_rate_min: 20,
    acceptance_rate_max: 50,
    match_gpa_buffer: 0.3,
    match_sat_buffer: 100,
    match_act_buffer: 2,
    safety_gpa_buffer: 0.5,
    safety_sat_buffer: 150,
    safety_act_buffer: 4,
  },
  high_acceptance: {
    acceptance_rate: 50,
    match_gpa_buffer: 0.4,
    match_sat_buffer: 150,
    match_act_buffer: 3,
  },
};

/**
 * Classifies a college as Reach, Match, or Safety based on user stats
 *
 * @param college - The college to classify
 * @param userGPA - User's GPA (on 4.0 scale, normalized)
 * @param userSAT - User's SAT score (400-1600)
 * @param userACT - User's ACT score (1-36)
 * @returns 'reach' | 'match' | 'safety' | null (null if insufficient data)
 */
export function classifyCollege(
  college: College,
  userGPA: number | null,
  userSAT: number | null,
  userACT: number | null
): CollegeCategory {
  // No user data → cannot classify
  if (!userGPA && !userSAT && !userACT) {
    return null;
  }

  const acceptanceRate = college.acceptance_rate;
  if (!acceptanceRate) {
    // Cannot classify without acceptance rate
    return null;
  }

  const thresholds = CLASSIFICATION_THRESHOLDS;

  // ============================================================================
  // HIGHLY SELECTIVE (< 20% acceptance)
  // ============================================================================
  if (acceptanceRate < thresholds.highly_selective.acceptance_rate) {
    // Highly selective schools are usually Reach, but can be Match if user
    // stats are significantly above college averages
    const isAboveAverage =
      (userGPA &&
        college.avg_gpa_max &&
        userGPA > college.avg_gpa_max + thresholds.highly_selective.match_gpa_buffer) ||
      (userSAT &&
        college.avg_sat_max &&
        userSAT > college.avg_sat_max + thresholds.highly_selective.match_sat_buffer);

    return isAboveAverage ? 'match' : 'reach';
  }

  // ============================================================================
  // MODERATE SELECTIVITY (20-50% acceptance)
  // ============================================================================
  if (
    acceptanceRate >= thresholds.moderate_selective.acceptance_rate_min &&
    acceptanceRate <= thresholds.moderate_selective.acceptance_rate_max
  ) {
    // Check if it's a Match (within GPA/SAT/ACT buffer)
    const isMatchByGPA =
      userGPA &&
      college.avg_gpa_min &&
      college.avg_gpa_max &&
      userGPA >= college.avg_gpa_min - thresholds.moderate_selective.match_gpa_buffer &&
      userGPA <= college.avg_gpa_max + thresholds.moderate_selective.match_gpa_buffer;

    const isMatchBySAT =
      userSAT &&
      college.avg_sat_min &&
      college.avg_sat_max &&
      userSAT >= college.avg_sat_min - thresholds.moderate_selective.match_sat_buffer &&
      userSAT <= college.avg_sat_max + thresholds.moderate_selective.match_sat_buffer;

    const isMatchByACT =
      userACT &&
      college.avg_act_min &&
      college.avg_act_max &&
      userACT >= college.avg_act_min - thresholds.moderate_selective.match_act_buffer &&
      userACT <= college.avg_act_max + thresholds.moderate_selective.match_act_buffer;

    if (isMatchByGPA || isMatchBySAT || isMatchByACT) {
      return 'match';
    }

    // Check if it's a Safety (significantly above college averages)
    const isSafetyByGPA =
      userGPA &&
      college.avg_gpa_max &&
      userGPA >= college.avg_gpa_max + thresholds.moderate_selective.safety_gpa_buffer;

    const isSafetyBySAT =
      userSAT &&
      college.avg_sat_max &&
      userSAT >= college.avg_sat_max + thresholds.moderate_selective.safety_sat_buffer;

    const isSafetyByACT =
      userACT &&
      college.avg_act_max &&
      userACT >= college.avg_act_max + thresholds.moderate_selective.safety_act_buffer;

    if (isSafetyByGPA || isSafetyBySAT || isSafetyByACT) {
      return 'safety';
    }

    // Below match thresholds = Reach
    return 'reach';
  }

  // ============================================================================
  // HIGH ACCEPTANCE (> 50%)
  // ============================================================================
  if (acceptanceRate > thresholds.high_acceptance.acceptance_rate) {
    // Check if it's a Match (within more generous buffer)
    const isMatchByGPA =
      userGPA &&
      college.avg_gpa_min &&
      userGPA >= college.avg_gpa_min - thresholds.high_acceptance.match_gpa_buffer;

    const isMatchBySAT =
      userSAT &&
      college.avg_sat_min &&
      userSAT >= college.avg_sat_min - thresholds.high_acceptance.match_sat_buffer;

    const isMatchByACT =
      userACT &&
      college.avg_act_min &&
      userACT >= college.avg_act_min - thresholds.high_acceptance.match_act_buffer;

    if (isMatchByGPA || isMatchBySAT || isMatchByACT) {
      return 'match'; // High-acceptance schools are usually Match or Safety, rarely Reach
    }

    return 'safety'; // If stats are close to college avg, it's a Safety
  }

  // Fallback
  return null;
}

/**
 * Normalize GPA to 4.0 scale
 *
 * @param gpa - The GPA value
 * @param scale - The GPA scale ('4.0', '5.0', '100')
 * @returns Normalized GPA on 4.0 scale
 */
export function normalizeGPA(gpa: number, scale: string): number {
  switch (scale) {
    case '4.0':
      return gpa;
    case '5.0':
      // Convert 5.0 scale to 4.0 scale
      return (gpa / 5.0) * 4.0;
    case '100':
      // Convert 100-point scale to 4.0 scale
      // 90-100 = 4.0, 80-89 = 3.0, 70-79 = 2.0, 60-69 = 1.0, < 60 = 0.0
      if (gpa >= 90) return 4.0;
      if (gpa >= 80) return 3.0 + ((gpa - 80) / 10) * 1.0;
      if (gpa >= 70) return 2.0 + ((gpa - 70) / 10) * 1.0;
      if (gpa >= 60) return 1.0 + ((gpa - 60) / 10) * 1.0;
      return 0.0;
    default:
      return gpa; // Assume 4.0 scale if unknown
  }
}

/**
 * Batch classify colleges for a user
 *
 * Useful for recalculating categories when user updates their GPA/test scores
 *
 * @param colleges - Array of colleges to classify
 * @param userGPA - User's GPA (normalized to 4.0 scale)
 * @param userSAT - User's SAT score
 * @param userACT - User's ACT score
 * @returns Map of college_id -> category
 */
export function batchClassifyColleges(
  colleges: College[],
  userGPA: number | null,
  userSAT: number | null,
  userACT: number | null
): Map<string, CollegeCategory> {
  const classifications = new Map<string, CollegeCategory>();

  for (const college of colleges) {
    const category = classifyCollege(college, userGPA, userSAT, userACT);
    classifications.set(college.id, category);
  }

  return classifications;
}

/**
 * Get a suggested category for a college when user saves it
 *
 * This is a convenience wrapper around classifyCollege that returns
 * a human-readable suggestion string for the UI
 *
 * @returns Object with category and suggestion message
 */
export function getSuggestedCategory(
  college: College,
  userGPA: number | null,
  userSAT: number | null,
  userACT: number | null
): {
  category: CollegeCategory;
  message: string;
} {
  const category = classifyCollege(college, userGPA, userSAT, userACT);

  if (!category) {
    return {
      category: null,
      message: 'Add your GPA and test scores to get a Reach/Match/Safety suggestion.',
    };
  }

  const messages = {
    reach: `Based on your stats, ${college.name} is a Reach school.`,
    match: `Based on your stats, ${college.name} is a Match school.`,
    safety: `Based on your stats, ${college.name} is a Safety school.`,
  };

  return {
    category,
    message: messages[category] || '',
  };
}
