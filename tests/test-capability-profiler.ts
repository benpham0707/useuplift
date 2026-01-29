/**
 * Test: Capability Profiler
 *
 * Tests the academic capability profiling system that analyzes a student's
 * complete course history to build a reusable profile of their demonstrated
 * abilities and provide personalized course recommendations.
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-capability-profiler.ts
 */

import {
  buildCapabilityProfile,
  type CapabilityProfileInput,
} from '../src/services/portfolioStrategy/services/academicWorkshop/capability';

// ============================================================================
// TEST DATA: Sample Student Profiles
// ============================================================================

const highAchieverProfile: CapabilityProfileInput = {
  courses: [
    // Freshman Year (Year 9)
    { name: 'Honors English 9', subject: 'english', level: 'honors', grade: 'A-', year: 9 },
    { name: 'Honors Geometry', subject: 'math', level: 'honors', grade: 'A', year: 9 },
    { name: 'Honors Biology', subject: 'science', level: 'honors', grade: 'A', year: 9 },
    { name: 'Honors World History', subject: 'social_studies', level: 'honors', grade: 'A-', year: 9 },
    { name: 'Spanish 2', subject: 'foreign_language', level: 'regular', grade: 'A', year: 9 },

    // Sophomore Year (Year 10)
    { name: 'Honors English 10', subject: 'english', level: 'honors', grade: 'A', year: 10 },
    { name: 'Honors Pre-Calculus', subject: 'math', level: 'honors', grade: 'A', year: 10 },
    { name: 'Honors Chemistry', subject: 'science', level: 'honors', grade: 'B-', year: 10 },
    { name: 'AP European History', subject: 'social_studies', level: 'ap', grade: 'A-', year: 10 },
    { name: 'Spanish 3 Honors', subject: 'foreign_language', level: 'honors', grade: 'B+', year: 10 },

    // Junior Year (Year 11)
    { name: 'AP English Language', subject: 'english', level: 'ap', grade: 'A-', year: 11 },
    { name: 'AP Calculus BC', subject: 'math', level: 'ap', grade: 'A', year: 11 },
    { name: 'AP Chemistry', subject: 'science', level: 'ap', grade: 'A-', year: 11 },
    { name: 'AP Physics C Mechanics', subject: 'science', level: 'ap', grade: 'A-', year: 11 },
    { name: 'AP US History', subject: 'social_studies', level: 'ap', grade: 'A-', year: 11 },
    { name: 'AP Computer Science A', subject: 'other', level: 'ap', grade: 'A', year: 11 },
    { name: 'Spanish 4', subject: 'foreign_language', level: 'regular', grade: 'B+', year: 11 },

    // Senior Year (Year 12) - in progress
    { name: 'AP English Literature', subject: 'english', level: 'ap', grade: 'A-', year: 12 },
    { name: 'Multivariable Calculus', subject: 'math', level: 'dual_enrollment', grade: 'A-', year: 12 },
    { name: 'AP Physics C E&M', subject: 'science', level: 'ap', grade: 'B+', year: 12 },
    { name: 'AP Government', subject: 'social_studies', level: 'ap', grade: 'A', year: 12 },
  ],
  gradeHistory: {
    freshman: { gpa: 3.72, courses: 5 },
    sophomore: { gpa: 3.81, courses: 5 },
    junior: { gpa: 3.95, courses: 7 },
    senior: { gpa: 3.92, courses: 4 },
  },
  schoolContext: {
    apCoursesOffered: 22,
    type: 'public',
  },
  intendedMajor: 'Computer Science',
  currentYear: 'senior',
};

const solidPerformerProfile: CapabilityProfileInput = {
  courses: [
    // Freshman Year
    { name: 'English 9', subject: 'english', level: 'regular', grade: 'A', year: 9 },
    { name: 'Algebra 2', subject: 'math', level: 'regular', grade: 'A', year: 9 },
    { name: 'Biology', subject: 'science', level: 'regular', grade: 'A-', year: 9 },
    { name: 'World History', subject: 'social_studies', level: 'regular', grade: 'A', year: 9 },

    // Sophomore Year
    { name: 'Honors English 10', subject: 'english', level: 'honors', grade: 'B+', year: 10 },
    { name: 'Honors Pre-Calculus', subject: 'math', level: 'honors', grade: 'B+', year: 10 },
    { name: 'Chemistry', subject: 'science', level: 'regular', grade: 'A', year: 10 },
    { name: 'US History', subject: 'social_studies', level: 'regular', grade: 'A', year: 10 },

    // Junior Year
    { name: 'AP English Language', subject: 'english', level: 'ap', grade: 'B', year: 11 },
    { name: 'AP Calculus AB', subject: 'math', level: 'ap', grade: 'B+', year: 11 },
    { name: 'AP Biology', subject: 'science', level: 'ap', grade: 'B+', year: 11 },
    { name: 'Honors US Government', subject: 'social_studies', level: 'honors', grade: 'A-', year: 11 },
  ],
  gradeHistory: {
    freshman: { gpa: 3.9, courses: 4 },
    sophomore: { gpa: 3.5, courses: 4 },
    junior: { gpa: 3.3, courses: 4 },
  },
  schoolContext: {
    apCoursesOffered: 15,
    type: 'public',
  },
  intendedMajor: 'Business',
  currentYear: 'junior',
};

const challengeSensitiveProfile: CapabilityProfileInput = {
  courses: [
    // Strong in regular courses
    { name: 'English 9', subject: 'english', level: 'regular', grade: 'A', year: 9 },
    { name: 'Geometry', subject: 'math', level: 'regular', grade: 'A', year: 9 },
    { name: 'Biology', subject: 'science', level: 'regular', grade: 'A', year: 9 },

    // Struggled when moving to honors
    { name: 'Honors English 10', subject: 'english', level: 'honors', grade: 'B-', year: 10 },
    { name: 'Honors Algebra 2', subject: 'math', level: 'honors', grade: 'C+', year: 10 },
    { name: 'Honors Chemistry', subject: 'science', level: 'honors', grade: 'B-', year: 10 },

    // Recovered somewhat
    { name: 'Honors English 11', subject: 'english', level: 'honors', grade: 'B+', year: 11 },
    { name: 'Pre-Calculus', subject: 'math', level: 'regular', grade: 'A-', year: 11 },
    { name: 'Honors Physics', subject: 'science', level: 'honors', grade: 'B', year: 11 },
  ],
  gradeHistory: {
    freshman: { gpa: 4.0, courses: 3 },
    sophomore: { gpa: 2.9, courses: 3 },
    junior: { gpa: 3.4, courses: 3 },
  },
  schoolContext: {
    apCoursesOffered: 10,
    type: 'public',
  },
  intendedMajor: 'Psychology',
  currentYear: 'junior',
};

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runTests() {
  console.log('='.repeat(80));
  console.log('CAPABILITY PROFILER TEST SUITE');
  console.log('='.repeat(80));
  console.log();

  // Test 1: High Achiever Profile
  console.log('TEST 1: HIGH ACHIEVER PROFILE');
  console.log('-'.repeat(80));
  const highAchieverResult = buildCapabilityProfile(highAchieverProfile);

  if (highAchieverResult.success && highAchieverResult.profile) {
    const profile = highAchieverResult.profile;
    console.log('✓ Profile built successfully');
    console.log();

    console.log('OVERALL CAPABILITY:');
    console.log(`  Capability Tier: ${profile.overallCapability.capabilityTier}`);
    console.log(`  Summary: ${profile.overallCapability.capabilitySummary}`);
    console.log();

    console.log('PERFORMANCE BY DIFFICULTY:');
    if (profile.overallCapability.performanceByDifficulty.ap_ib) {
      console.log(`  AP/IB: Avg ${profile.overallCapability.performanceByDifficulty.ap_ib.avgGrade.toFixed(2)} (${profile.overallCapability.performanceByDifficulty.ap_ib.sampleSize} courses)`);
    }
    if (profile.overallCapability.performanceByDifficulty.honors) {
      console.log(`  Honors: Avg ${profile.overallCapability.performanceByDifficulty.honors.avgGrade.toFixed(2)} (${profile.overallCapability.performanceByDifficulty.honors.sampleSize} courses)`);
    }
    console.log();

    console.log('OPTIMAL STRETCH POINT:');
    console.log(`  Level: ${profile.overallCapability.optimalStretchPoint.recommendedDifficultyLevel}`);
    console.log(`  Expected GPA: ${profile.overallCapability.optimalStretchPoint.expectedGPA.toFixed(2)}`);
    console.log(`  Rationale: ${profile.overallCapability.optimalStretchPoint.rationale}`);
    console.log();

    console.log('CHALLENGE TOLERANCE:');
    console.log(`  Level: ${profile.challengeTolerance.toleranceLevel}`);
    console.log(`  Typical Grade Drop: ${profile.challengeTolerance.levelTransitionPattern.typicalGradeDrop.toFixed(2)}`);
    console.log(`  Summary: ${profile.challengeTolerance.summary}`);
    console.log();

    console.log('SUBJECT CAPABILITIES:');
    for (const [subject, cap] of Object.entries(profile.subjectCapabilities)) {
      console.log(`  ${subject}: ${cap.capabilityLevel} | Trend: ${cap.trend} | Recommended: ${cap.recommendedNextLevel}`);
    }
    console.log();

    console.log('OPTIMAL DIFFICULTY RECOMMENDATIONS:');
    console.log(`  Recommended AP Count: ${profile.optimalDifficultyLevel.recommendedAPCount.optimal} (min: ${profile.optimalDifficultyLevel.recommendedAPCount.minimum}, max: ${profile.optimalDifficultyLevel.recommendedAPCount.maximum})`);
    console.log(`  Projected GPA: ${profile.optimalDifficultyLevel.projectedGPA.expected.toFixed(2)} (${profile.optimalDifficultyLevel.projectedGPA.conservative.toFixed(2)}-${profile.optimalDifficultyLevel.projectedGPA.optimistic.toFixed(2)})`);
    console.log();

    console.log('GUIDING PRINCIPLES:');
    for (const principle of profile.optimalDifficultyLevel.guidingPrinciples) {
      console.log(`  - ${principle}`);
    }
    console.log();

    if (highAchieverResult.progressionAdvice) {
      console.log('PROGRESSION ADVICE:');
      console.log(`  ${highAchieverResult.progressionAdvice.overallGuidance}`);
      console.log();

      console.log('  WHAT TO AVOID:');
      for (const item of highAchieverResult.progressionAdvice.whatToAvoid.slice(0, 3)) {
        console.log(`    - ${item}`);
      }
    }
  } else {
    console.log('✗ Failed to build profile:', highAchieverResult.error);
  }

  console.log();
  console.log('='.repeat(80));
  console.log();

  // Test 2: Solid Performer Profile
  console.log('TEST 2: SOLID PERFORMER PROFILE');
  console.log('-'.repeat(80));
  const solidResult = buildCapabilityProfile(solidPerformerProfile);

  if (solidResult.success && solidResult.profile) {
    const profile = solidResult.profile;
    console.log('✓ Profile built successfully');
    console.log();

    console.log('OVERALL CAPABILITY:');
    console.log(`  Capability Tier: ${profile.overallCapability.capabilityTier}`);
    console.log(`  Summary: ${profile.overallCapability.capabilitySummary}`);
    console.log();

    console.log('PERFORMANCE BY DIFFICULTY:');
    if (profile.overallCapability.performanceByDifficulty.ap_ib) {
      console.log(`  AP/IB: Avg ${profile.overallCapability.performanceByDifficulty.ap_ib.avgGrade.toFixed(2)} (${profile.overallCapability.performanceByDifficulty.ap_ib.sampleSize} courses)`);
    }
    if (profile.overallCapability.performanceByDifficulty.honors) {
      console.log(`  Honors: Avg ${profile.overallCapability.performanceByDifficulty.honors.avgGrade.toFixed(2)} (${profile.overallCapability.performanceByDifficulty.honors.sampleSize} courses)`);
    }
    if (profile.overallCapability.performanceByDifficulty.regular) {
      console.log(`  Regular: Avg ${profile.overallCapability.performanceByDifficulty.regular.avgGrade.toFixed(2)} (${profile.overallCapability.performanceByDifficulty.regular.sampleSize} courses)`);
    }
    console.log();

    console.log('OPTIMAL STRETCH POINT:');
    console.log(`  Level: ${profile.overallCapability.optimalStretchPoint.recommendedDifficultyLevel}`);
    console.log(`  Rationale: ${profile.overallCapability.optimalStretchPoint.rationale}`);
    console.log();

    console.log('CHALLENGE TOLERANCE:');
    console.log(`  Level: ${profile.challengeTolerance.toleranceLevel}`);
    console.log(`  Summary: ${profile.challengeTolerance.summary}`);
    console.log();

    console.log('OPTIMAL DIFFICULTY RECOMMENDATIONS:');
    console.log(`  Recommended AP Count: ${profile.optimalDifficultyLevel.recommendedAPCount.optimal}`);
    console.log();

    console.log('GUIDING PRINCIPLES:');
    for (const principle of profile.optimalDifficultyLevel.guidingPrinciples) {
      console.log(`  - ${principle}`);
    }
  } else {
    console.log('✗ Failed to build profile:', solidResult.error);
  }

  console.log();
  console.log('='.repeat(80));
  console.log();

  // Test 3: Challenge Sensitive Profile
  console.log('TEST 3: CHALLENGE SENSITIVE PROFILE');
  console.log('-'.repeat(80));
  const sensitiveResult = buildCapabilityProfile(challengeSensitiveProfile);

  if (sensitiveResult.success && sensitiveResult.profile) {
    const profile = sensitiveResult.profile;
    console.log('✓ Profile built successfully');
    console.log();

    console.log('OVERALL CAPABILITY:');
    console.log(`  Capability Tier: ${profile.overallCapability.capabilityTier}`);
    console.log(`  Summary: ${profile.overallCapability.capabilitySummary}`);
    console.log();

    console.log('PERFORMANCE BY DIFFICULTY:');
    if (profile.overallCapability.performanceByDifficulty.honors) {
      console.log(`  Honors: Avg ${profile.overallCapability.performanceByDifficulty.honors.avgGrade.toFixed(2)} (${profile.overallCapability.performanceByDifficulty.honors.sampleSize} courses)`);
    }
    if (profile.overallCapability.performanceByDifficulty.regular) {
      console.log(`  Regular: Avg ${profile.overallCapability.performanceByDifficulty.regular.avgGrade.toFixed(2)} (${profile.overallCapability.performanceByDifficulty.regular.sampleSize} courses)`);
    }
    console.log();

    console.log('OPTIMAL STRETCH POINT:');
    console.log(`  Level: ${profile.overallCapability.optimalStretchPoint.recommendedDifficultyLevel}`);
    console.log(`  Rationale: ${profile.overallCapability.optimalStretchPoint.rationale}`);
    console.log();

    console.log('CHALLENGE TOLERANCE:');
    console.log(`  Level: ${profile.challengeTolerance.toleranceLevel}`);
    console.log(`  Typical Grade Drop: ${profile.challengeTolerance.levelTransitionPattern.typicalGradeDrop.toFixed(2)}`);
    console.log(`  Summary: ${profile.challengeTolerance.summary}`);
    console.log();

    console.log('LEARNING PATTERNS:');
    console.log(`  Recovery Pattern: ${profile.learningPatterns.recoveryPattern}`);
    console.log(`  Growth Pattern: ${profile.learningPatterns.overallGrowthPattern}`);
    console.log();

    console.log('OPTIMAL DIFFICULTY RECOMMENDATIONS:');
    console.log(`  Recommended AP Count: ${profile.optimalDifficultyLevel.recommendedAPCount.optimal}`);
    console.log();

    console.log('GUIDING PRINCIPLES:');
    for (const principle of profile.optimalDifficultyLevel.guidingPrinciples) {
      console.log(`  - ${principle}`);
    }
    console.log();

    if (sensitiveResult.progressionAdvice) {
      console.log('GPA PROTECTION STRATEGIES:');
      for (const strategy of sensitiveResult.progressionAdvice.gpaProtectionStrategies.slice(0, 3)) {
        console.log(`  - ${strategy}`);
      }
      console.log();

      console.log('WARNING SIGNS TO WATCH:');
      for (const sign of sensitiveResult.progressionAdvice.warningSignsToWatch.slice(0, 3)) {
        console.log(`  - ${sign}`);
      }
    }
  } else {
    console.log('✗ Failed to build profile:', sensitiveResult.error);
  }

  console.log();
  console.log('='.repeat(80));
  console.log('ALL TESTS COMPLETED');
  console.log('='.repeat(80));
}

// Run tests
runTests().catch(console.error);
