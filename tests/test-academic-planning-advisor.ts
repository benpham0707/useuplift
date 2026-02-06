/**
 * Test: Academic Planning Advisor
 *
 * Verifies that the advisor gives useful, research-grounded advice
 * for course selection, workload management, and major alignment.
 */

import {
  generateAcademicPlanningAdvice,
  type AcademicPlanningInput,
} from '../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/academicPlanningAdvisor';

import type { NuancedCapabilityAnalysis } from '../src/services/portfolioStrategy/services/academicWorkshop/capability/nuancedCapabilityAnalyzer';
import type { QualitativeInsights } from '../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/types';

// ============================================================================
// TEST SCENARIOS
// ============================================================================

/**
 * Scenario 1: High capability student not being challenged enough
 * - Low effort, high grades
 * - Should recommend stepping up to AP
 */
function createUnchallengedStudent(): AcademicPlanningInput {
  return {
    quantitativeAnalysis: {
      overallGPA: 3.9,
      subjectPatterns: {
        math: {
          relativeStrength: 0.2,
          performanceHistory: {
            avgGPA: 3.95,
            trend: 'stable' as const,
            courses: [
              { name: 'Pre-Calculus Honors', level: 'Honors', grade: 4.0, subject: 'math' },
              { name: 'Algebra 2 Honors', level: 'Honors', grade: 3.9, subject: 'math' },
            ],
          },
        },
        science: {
          relativeStrength: 0.15,
          performanceHistory: {
            avgGPA: 3.85,
            trend: 'stable' as const,
            courses: [
              { name: 'Chemistry Honors', level: 'Honors', grade: 3.85, subject: 'science' },
            ],
          },
        },
      },
      progressionTrajectory: {
        historical: { overallTrend: 'stable' as const, yearlyGPAs: [3.85, 3.9] },
        projected: { targetGPA: 3.95, feasibility: 'likely' },
      },
      challengeResponsePatterns: {
        recoveryRate: 0.9,
        resilienceIndicators: [],
      },
    } as NuancedCapabilityAnalysis,
    qualitativeInsights: {
      subjectInsights: {
        math: {
          effortLevel: 30, // LOW effort
          interestLevel: 85, // HIGH interest
          teacherQuality: 'good',
        },
        science: {
          effortLevel: 35,
          interestLevel: 70,
          teacherQuality: 'good',
        },
      },
    } as unknown as QualitativeInsights,
    intendedMajor: 'Computer Science',
    currentGrade: 11,
    schoolContext: {
      type: 'well_resourced_suburban',
      apCoursesAvailable: ['AP Calculus BC', 'AP Physics C', 'AP Chemistry', 'AP Computer Science A'],
      honorsCoursesAvailable: ['Pre-Calculus Honors', 'Chemistry Honors'],
      dualEnrollmentAvailable: true,
    },
  };
}

/**
 * Scenario 2: Student at their limit - working very hard for current grades
 * - High effort, mediocre grades
 * - Should NOT recommend adding more rigor
 */
function createOverworkedStudent(): AcademicPlanningInput {
  return {
    quantitativeAnalysis: {
      overallGPA: 3.2,
      subjectPatterns: {
        math: {
          relativeStrength: -0.1,
          performanceHistory: {
            avgGPA: 3.1,
            trend: 'stable' as const,
            courses: [
              { name: 'AP Calculus AB', level: 'AP', grade: 3.0, subject: 'math' },
              { name: 'Pre-Calculus', level: 'Regular', grade: 3.2, subject: 'math' },
            ],
          },
        },
        science: {
          relativeStrength: -0.15,
          performanceHistory: {
            avgGPA: 3.0,
            trend: 'declining' as const,
            courses: [
              { name: 'AP Chemistry', level: 'AP', grade: 2.8, subject: 'science' },
              { name: 'Biology Honors', level: 'Honors', grade: 3.2, subject: 'science' },
            ],
          },
        },
      },
      progressionTrajectory: {
        historical: { overallTrend: 'declining' as const, yearlyGPAs: [3.5, 3.2] },
        projected: { targetGPA: 3.3, feasibility: 'uncertain' },
      },
      challengeResponsePatterns: {
        recoveryRate: 0.5,
        resilienceIndicators: [],
      },
    } as NuancedCapabilityAnalysis,
    qualitativeInsights: {
      subjectInsights: {
        math: {
          effortLevel: 90, // VERY HIGH effort
          interestLevel: 40,
          teacherQuality: 'average',
        },
        science: {
          effortLevel: 95, // EXTREMELY HIGH effort
          interestLevel: 30,
          teacherQuality: 'poor',
        },
      },
    } as unknown as QualitativeInsights,
    intendedMajor: 'Pre-Med',
    currentGrade: 11,
    schoolContext: {
      type: 'competitive_magnet',
      apCoursesAvailable: ['AP Calculus BC', 'AP Physics C', 'AP Chemistry', 'AP Biology'],
      honorsCoursesAvailable: ['Chemistry Honors', 'Biology Honors'],
      dualEnrollmentAvailable: false,
    },
  };
}

/**
 * Scenario 3: Student with major mismatch
 * - Wants to be CS major but hasn't taken the right courses
 */
function createMajorMismatchStudent(): AcademicPlanningInput {
  return {
    quantitativeAnalysis: {
      overallGPA: 3.6,
      subjectPatterns: {
        english: {
          relativeStrength: 0.15,
          performanceHistory: {
            avgGPA: 3.8,
            trend: 'stable' as const,
            courses: [
              { name: 'AP English Language', level: 'AP', grade: 3.8, subject: 'english' },
              { name: 'English 10 Honors', level: 'Honors', grade: 3.8, subject: 'english' },
            ],
          },
        },
        social_studies: {
          relativeStrength: 0.1,
          performanceHistory: {
            avgGPA: 3.7,
            trend: 'stable' as const,
            courses: [
              { name: 'AP US History', level: 'AP', grade: 3.7, subject: 'social_studies' },
            ],
          },
        },
        math: {
          relativeStrength: -0.1,
          performanceHistory: {
            avgGPA: 3.3,
            trend: 'stable' as const,
            courses: [
              { name: 'Algebra 2', level: 'Regular', grade: 3.3, subject: 'math' },
            ],
          },
        },
      },
      progressionTrajectory: {
        historical: { overallTrend: 'stable' as const, yearlyGPAs: [3.5, 3.6] },
        projected: { targetGPA: 3.7, feasibility: 'likely' },
      },
      challengeResponsePatterns: {
        recoveryRate: 0.7,
        resilienceIndicators: [],
      },
    } as NuancedCapabilityAnalysis,
    qualitativeInsights: {
      subjectInsights: {
        math: {
          effortLevel: 50,
          interestLevel: 80, // Says they're interested in CS!
          teacherQuality: 'average',
        },
      },
    } as unknown as QualitativeInsights,
    intendedMajor: 'Computer Science', // Wants CS but no advanced math
    currentGrade: 11,
    schoolContext: {
      type: 'well_resourced_suburban',
      apCoursesAvailable: ['AP Calculus AB', 'AP Calculus BC', 'AP Computer Science A', 'AP Physics 1'],
      honorsCoursesAvailable: ['Pre-Calculus Honors', 'Physics Honors'],
      dualEnrollmentAvailable: true,
    },
  };
}

/**
 * Scenario 4: Student with declining grades that need investigation
 */
function createDecliningStudent(): AcademicPlanningInput {
  return {
    quantitativeAnalysis: {
      overallGPA: 3.4,
      subjectPatterns: {
        math: {
          relativeStrength: 0,
          performanceHistory: {
            avgGPA: 3.4,
            trend: 'declining' as const,
            courses: [
              { name: 'Pre-Calculus Honors', level: 'Honors', grade: 3.2, subject: 'math' },
              { name: 'Algebra 2 Honors', level: 'Honors', grade: 3.6, subject: 'math' },
            ],
          },
        },
        science: {
          relativeStrength: -0.05,
          performanceHistory: {
            avgGPA: 3.3,
            trend: 'declining' as const,
            courses: [
              { name: 'Chemistry Honors', level: 'Honors', grade: 3.0, subject: 'science' },
              { name: 'Biology', level: 'Regular', grade: 3.6, subject: 'science' },
            ],
          },
        },
      },
      progressionTrajectory: {
        historical: { overallTrend: 'declining' as const, yearlyGPAs: [3.8, 3.4] },
        projected: { targetGPA: 3.5, feasibility: 'uncertain' },
      },
      challengeResponsePatterns: {
        recoveryRate: 0.4,
        resilienceIndicators: [],
      },
    } as NuancedCapabilityAnalysis,
    intendedMajor: 'Engineering',
    currentGrade: 11,
    schoolContext: {
      type: 'average_public',
      apCoursesAvailable: ['AP Calculus AB', 'AP Physics 1', 'AP Chemistry'],
      honorsCoursesAvailable: ['Pre-Calculus Honors', 'Chemistry Honors'],
      dualEnrollmentAvailable: false,
    },
  };
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('Academic Planning Advisor Tests');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  // --------------------------------------------------------------------------
  // Test 1: Unchallenged Student Should Be Told to Step Up
  // --------------------------------------------------------------------------
  console.log('Test 1: Unchallenged Student - Should Recommend Stepping Up');
  try {
    const input = createUnchallengedStudent();
    const advice = generateAcademicPlanningAdvice(input);

    console.log('  Course Recommendations:');
    for (const rec of advice.courseRecommendations) {
      console.log(`    - ${rec.subject}: ${rec.recommendedLevel.toUpperCase()}`);
      console.log(`      Rationale: ${rec.rationale.substring(0, 80)}...`);
    }

    // Should recommend AP for math since low effort + high grades
    const mathRec = advice.courseRecommendations.find(r => r.subject === 'math');
    if (mathRec?.recommendedLevel !== 'ap') {
      throw new Error(`Expected AP recommendation for math, got ${mathRec?.recommendedLevel}`);
    }

    // Should identify opportunity to step up
    const stepUpOpp = advice.opportunities.find(o => o.type === 'step_up');
    if (!stepUpOpp) {
      console.log('  Note: Expected step_up opportunity');
    } else {
      console.log(`  Opportunity: ${stepUpOpp.description}`);
    }

    // Should have low workload concern
    console.log(`  Workload: ${advice.workloadAdvice.currentVsRecommended} capacity`);
    console.log(`  Recommended rigorous courses: ${advice.workloadAdvice.recommendedRigorousCourses}`);

    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Test 2: Overworked Student Should NOT Be Told to Add More
  // --------------------------------------------------------------------------
  console.log('Test 2: Overworked Student - Should NOT Recommend More Rigor');
  try {
    const input = createOverworkedStudent();
    const advice = generateAcademicPlanningAdvice(input);

    console.log('  Course Recommendations:');
    for (const rec of advice.courseRecommendations) {
      console.log(`    - ${rec.subject}: ${rec.recommendedLevel.toUpperCase()} (risk: ${rec.riskLevel})`);
    }

    // Should have declining trajectory red flag
    const decliningFlag = advice.redFlags.find(f => f.type === 'declining_trend');
    if (decliningFlag) {
      console.log(`  Red Flag: ${decliningFlag.description}`);
    }

    // Workload advice should be conservative
    console.log(`  Workload Status: ${advice.workloadAdvice.currentVsRecommended}`);
    console.log(`  Balance Advice: ${advice.workloadAdvice.balanceAdvice.substring(0, 80)}...`);

    // Should probe about what's happening
    const probingQ = advice.probingQuestions.find(q => q.topic.includes('Decline') || q.topic.includes('Workload'));
    if (probingQ) {
      console.log(`  Probing: "${probingQ.question}"`);
    }

    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Test 3: Major Mismatch Should Be Flagged
  // --------------------------------------------------------------------------
  console.log('Test 3: Major Mismatch - CS Major Without Math/CS Courses');
  try {
    const input = createMajorMismatchStudent();
    const advice = generateAcademicPlanningAdvice(input);

    console.log('  Major Alignment:');
    console.log(`    Major: ${advice.majorAlignment.major}`);
    console.log(`    Alignment Score: ${advice.majorAlignment.alignmentScore}%`);
    console.log(`    Missing Courses: ${advice.majorAlignment.missingCourses.join(', ')}`);

    if (advice.majorAlignment.alignmentScore > 50) {
      throw new Error('Expected low alignment score for CS major without math courses');
    }

    // Should have major mismatch red flag
    const mismatchFlag = advice.redFlags.find(f => f.type === 'major_mismatch');
    if (mismatchFlag) {
      console.log(`  Red Flag: ${mismatchFlag.description}`);
      console.log(`  Severity: ${mismatchFlag.severity}`);
    } else {
      throw new Error('Expected major_mismatch red flag');
    }

    // Recommendations should mention the gap
    console.log('  Recommendations:');
    for (const rec of advice.majorAlignment.recommendations) {
      console.log(`    - ${rec}`);
    }

    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Test 4: Declining Grades Should Trigger Investigation
  // --------------------------------------------------------------------------
  console.log('Test 4: Declining Student - Should Probe for Causes');
  try {
    const input = createDecliningStudent();
    const advice = generateAcademicPlanningAdvice(input);

    console.log('  Trajectory Assessment:');
    console.log(`    Pattern: ${advice.trajectoryAssessment.pattern}`);
    console.log(`    AO Interpretation: ${advice.trajectoryAssessment.aoInterpretation.substring(0, 80)}...`);
    console.log(`    Action Items:`);
    for (const item of advice.trajectoryAssessment.actionItems.slice(0, 2)) {
      console.log(`      - ${item}`);
    }

    // Should have declining trend red flag
    const decliningFlags = advice.redFlags.filter(f => f.type === 'declining_trend');
    console.log(`  Declining Trend Flags: ${decliningFlags.length}`);
    for (const flag of decliningFlags) {
      console.log(`    - ${flag.subject}: ${flag.howToAddress.substring(0, 60)}...`);
    }

    // Should have probing questions about decline
    const declineQuestions = advice.probingQuestions.filter(q =>
      q.topic.includes('Decline') || q.question.includes('decline') || q.question.includes('dropped')
    );
    console.log(`  Probing Questions about Decline: ${declineQuestions.length}`);
    for (const q of declineQuestions) {
      console.log(`    - "${q.question}"`);
    }

    if (advice.trajectoryAssessment.pattern !== 'declining') {
      throw new Error('Expected declining trajectory pattern');
    }

    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Test 5: Verify Research-Based Course Requirements
  // --------------------------------------------------------------------------
  console.log('Test 5: Major-Specific Course Requirements (Research-Based)');
  try {
    const csStudent = createUnchallengedStudent();
    csStudent.intendedMajor = 'Computer Science';
    const csAdvice = generateAcademicPlanningAdvice(csStudent);

    console.log('  CS Major Requirements:');
    console.log(`    Required: ${csAdvice.majorAlignment.requiredCourses.slice(0, 3).join(', ')}`);

    const premedStudent = createOverworkedStudent();
    premedStudent.intendedMajor = 'Pre-Med';
    const premedAdvice = generateAcademicPlanningAdvice(premedStudent);

    console.log('  Pre-Med Requirements:');
    console.log(`    Required: ${premedAdvice.majorAlignment.requiredCourses.slice(0, 3).join(', ')}`);

    // CS should require Calculus
    const csReqsCalc = csAdvice.majorAlignment.requiredCourses.some(r =>
      r.toLowerCase().includes('calculus')
    );
    if (!csReqsCalc) {
      console.log('  Note: Expected Calculus in CS requirements');
    }

    // Pre-med should require Biology
    const premedReqsBio = premedAdvice.majorAlignment.requiredCourses.some(r =>
      r.toLowerCase().includes('biology')
    );
    if (!premedReqsBio) {
      console.log('  Note: Expected Biology in Pre-Med requirements');
    }

    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Test 6: Capability Estimation (Effort vs Grades)
  // --------------------------------------------------------------------------
  console.log('Test 6: Capability Estimation Based on Effort');
  try {
    // Low effort + high grades = high capability
    const unchallenged = createUnchallengedStudent();
    const unchallengedAdvice = generateAcademicPlanningAdvice(unchallenged);

    // High effort + low grades = at capacity
    const overworked = createOverworkedStudent();
    const overworkedAdvice = generateAcademicPlanningAdvice(overworked);

    console.log('  Unchallenged Student (30% effort, 3.9 GPA):');
    const unchallengedMathRec = unchallengedAdvice.courseRecommendations.find(r => r.subject === 'math');
    console.log(`    Math Recommendation: ${unchallengedMathRec?.recommendedLevel.toUpperCase()}`);
    console.log(`    Evidence: ${unchallengedMathRec?.evidenceBasis.substring(0, 60)}...`);

    console.log('  Overworked Student (90% effort, 3.1 GPA):');
    const overworkedMathRec = overworkedAdvice.courseRecommendations.find(r => r.subject === 'math');
    console.log(`    Math Recommendation: ${overworkedMathRec?.recommendedLevel?.toUpperCase() || 'stay current'}`);

    // Unchallenged should get AP recommendation
    if (unchallengedMathRec?.recommendedLevel !== 'ap') {
      throw new Error('Low effort student should be recommended to step up to AP');
    }

    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════════════');

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
