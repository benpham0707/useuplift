/**
 * Portfolio Strategy Data
 *
 * Central export for all PASS system reference data.
 * This data is sourced from deep research and admissions expertise.
 */

// ============================================================================
// COLLEGE ADMISSIONS DATA
// ============================================================================

export {
  COLLEGE_PROFILES,
  getCollegeProfile,
  getAllCollegeProfiles,
  getCollegesWithEDAdvantage,
  getCollegesbySelectivity,
  type CollegeProfileRecord,
} from './collegeAdmissionsData';

// ============================================================================
// ACADEMIC STANDARDS
// ============================================================================

export {
  GPA_THRESHOLDS,
  COURSE_RIGOR_EXPECTATIONS,
  SAT_SCORE_RANGES,
  ACT_SCORE_RANGES,
  TEST_SCORE_EVALUATION,
  TEST_OPTIONAL_GUIDANCE,
  GRADE_TREND_EVALUATION,
  ADMISSIONS_MODEL,
  evaluateGPATier,
  evaluateRigorTier,
  evaluateTestScoreTier,
  shouldSubmitTestScores,
} from './academicStandards';

// ============================================================================
// ACTIVITY EVALUATION STANDARDS
// ============================================================================

export {
  ACTIVITY_TIER_RUBRICS,
  SPIKE_DETECTION_CRITERIA,
  LEADERSHIP_ASSESSMENT,
  IMPACT_INDICATORS,
  CATEGORY_EVALUATION_FRAMEWORKS,
  evaluateActivityTier,
  detectSpike,
  assessLeadership,
} from './activityEvaluationStandards';
