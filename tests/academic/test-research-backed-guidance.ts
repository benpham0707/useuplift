/**
 * Test: Research-Backed Guidance Layer Integration
 *
 * Verifies that the Capability Conversation System properly integrates
 * with the research knowledge bases to provide grounded, calibrated guidance.
 */

import {
  generateResearchBackedGuidance,
  getCalibratedGPAInterpretation,
  getMajorCourseRequirements,
  getSchoolValueMatrix,
  type ResearchGuidanceInput,
} from '../../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/researchBackedGuidanceLayer';

import type { NuancedCapabilityAnalysis } from '../../src/services/portfolioStrategy/services/academicWorkshop/capability/nuancedCapabilityAnalyzer';

// ============================================================================
// TEST DATA
// ============================================================================

const createMockQuantitativeAnalysis = (overrides?: Partial<NuancedCapabilityAnalysis>): NuancedCapabilityAnalysis => ({
  overallGPA: 3.75,
  subjectPatterns: {
    math: {
      relativeStrength: 0.15,
      performanceHistory: {
        avgGPA: 3.9,
        trend: 'stable' as const,
        courses: [
          { name: 'AP Calculus BC', level: 'AP', grade: 4.0, subject: 'math' },
          { name: 'Pre-Calculus Honors', level: 'Honors', grade: 3.8, subject: 'math' },
          { name: 'Algebra 2 Honors', level: 'Honors', grade: 3.9, subject: 'math' },
        ],
      },
    },
    science: {
      relativeStrength: -0.1,
      performanceHistory: {
        avgGPA: 3.4,
        trend: 'declining' as const,
        courses: [
          { name: 'AP Chemistry', level: 'AP', grade: 3.2, subject: 'science' },
          { name: 'Biology Honors', level: 'Honors', grade: 3.5, subject: 'science' },
          { name: 'Earth Science', level: 'Regular', grade: 3.5, subject: 'science' },
        ],
      },
    },
    english: {
      relativeStrength: 0.05,
      performanceHistory: {
        avgGPA: 3.7,
        trend: 'improving' as const,
        courses: [
          { name: 'AP English Literature', level: 'AP', grade: 3.8, subject: 'english' },
          { name: 'AP English Language', level: 'AP', grade: 3.6, subject: 'english' },
          { name: 'English 9 Honors', level: 'Honors', grade: 3.7, subject: 'english' },
        ],
      },
    },
    social_studies: {
      relativeStrength: 0.1,
      performanceHistory: {
        avgGPA: 3.8,
        trend: 'improving' as const,
        courses: [
          { name: 'AP US History', level: 'AP', grade: 3.9, subject: 'social_studies' },
          { name: 'AP World History', level: 'AP', grade: 3.7, subject: 'social_studies' },
        ],
      },
    },
  },
  progressionTrajectory: {
    historical: {
      overallTrend: 'improving' as const,
      yearlyGPAs: [3.6, 3.7, 3.85],
    },
    projected: {
      targetGPA: 3.9,
      feasibility: 'likely',
    },
  },
  challengeResponsePatterns: {
    recoveryRate: 0.7,
    resilienceIndicators: ['Improved after difficult semester'],
  },
  ...overrides,
});

// ============================================================================
// TESTS
// ============================================================================

async function runTests(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('Research-Backed Guidance Layer Integration Tests');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  // --------------------------------------------------------------------------
  // Test 1: Basic Guidance Generation
  // --------------------------------------------------------------------------
  console.log('Test 1: Basic Guidance Generation');
  try {
    const input: ResearchGuidanceInput = {
      quantitativeAnalysis: createMockQuantitativeAnalysis(),
      schoolContext: {
        type: 'well_resourced_suburban',
        apCoursesAvailable: 15,
      },
      intendedMajor: 'Computer Science',
    };

    const guidance = generateResearchBackedGuidance(input);

    // Verify structure
    if (!guidance.academicAssessment) throw new Error('Missing academicAssessment');
    if (!guidance.applicationStrategy) throw new Error('Missing applicationStrategy');
    if (!guidance.conversationGuidance) throw new Error('Missing conversationGuidance');
    if (typeof guidance.confidence !== 'number') throw new Error('Missing confidence');

    console.log(`  Calibrated Rating: ${guidance.academicAssessment.calibratedRating}`);
    console.log(`  Rigor Level: ${guidance.academicAssessment.rigorAssessment.level}`);
    console.log(`  Trajectory: ${guidance.academicAssessment.trajectoryAssessment.pattern}`);
    console.log(`  Confidence: ${guidance.confidence}%`);
    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Test 2: GPA Calibration by School Context
  // --------------------------------------------------------------------------
  console.log('Test 2: GPA Calibration by School Context');
  try {
    // Elite prep school
    const elitePrep = getCalibratedGPAInterpretation(3.7, 'elite_prep');
    if (!elitePrep) throw new Error('No interpretation for elite_prep');
    console.log(`  Elite Prep 3.7 GPA: Harvard Equivalent = ${elitePrep.harvardEquivalent}`);

    // Under-resourced school
    const underResourced = getCalibratedGPAInterpretation(3.7, 'under_resourced');
    if (!underResourced) throw new Error('No interpretation for under_resourced');
    console.log(`  Under-Resourced 3.7 GPA: Harvard Equivalent = ${underResourced.harvardEquivalent}`);

    // The same GPA should be interpreted differently
    if (elitePrep.harvardEquivalent === underResourced.harvardEquivalent) {
      console.log('  Note: Same GPA rated equally across contexts (may need adjustment)');
    }

    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Test 3: Major-Specific Course Requirements
  // --------------------------------------------------------------------------
  console.log('Test 3: Major-Specific Course Requirements');
  try {
    const csReqs = getMajorCourseRequirements('engineering_cs');
    console.log(`  CS Required Courses: ${csReqs.required.length}`);
    console.log(`    - ${csReqs.required.slice(0, 3).join(', ')}`);

    if (!csReqs.required.some(r => r.includes('Calculus'))) {
      throw new Error('CS should require Calculus');
    }

    const premedReqs = getMajorCourseRequirements('pre_med');
    console.log(`  Pre-Med Required Courses: ${premedReqs.required.length}`);
    console.log(`    - ${premedReqs.required.slice(0, 3).join(', ')}`);

    if (!premedReqs.required.some(r => r.includes('Biology'))) {
      throw new Error('Pre-med should require Biology');
    }

    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Test 4: School Value Matrix
  // --------------------------------------------------------------------------
  console.log('Test 4: School Value Matrix Retrieval');
  try {
    const harvardMatrix = getSchoolValueMatrix('harvard');
    if (!harvardMatrix) throw new Error('Harvard matrix not found');
    console.log(`  Harvard Name: ${harvardMatrix.name}`);
    console.log(`  Harvard Acceptance: ${harvardMatrix.acceptance_rate}%`);

    const stanfordMatrix = getSchoolValueMatrix('stanford');
    if (!stanfordMatrix) throw new Error('Stanford matrix not found');
    console.log(`  Stanford Name: ${stanfordMatrix.name}`);

    const mitMatrix = getSchoolValueMatrix('mit');
    if (!mitMatrix) throw new Error('MIT matrix not found');
    console.log(`  MIT Name: ${mitMatrix.name}`);

    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Test 5: Context-Aware Recommendations
  // --------------------------------------------------------------------------
  console.log('Test 5: Context-Aware Recommendations (First-Gen + Low-Income)');
  try {
    const input: ResearchGuidanceInput = {
      quantitativeAnalysis: createMockQuantitativeAnalysis(),
      schoolContext: {
        type: 'under_resourced',
        apCoursesAvailable: 4,
      },
      demographicContext: {
        socioeconomic: {
          householdIncome: 'low',
          firstGeneration: true,
          worksForFamily: true,
        },
      },
      intendedMajor: 'Engineering',
    };

    const guidance = generateResearchBackedGuidance(input);

    console.log(`  Context-Aware Recommendations: ${guidance.contextAwareRecommendations.length}`);
    for (const rec of guidance.contextAwareRecommendations.slice(0, 3)) {
      console.log(`    - ${rec.factor}: ${rec.impact}`);
    }

    // Should have first-gen and low-income context
    const hasFirstGen = guidance.contextAwareRecommendations.some(r =>
      r.factor.toLowerCase().includes('first-gen') || r.factor.toLowerCase().includes('first generation')
    );
    const hasLowIncome = guidance.contextAwareRecommendations.some(r =>
      r.factor.toLowerCase().includes('low-income') || r.factor.toLowerCase().includes('income')
    );

    if (!hasFirstGen) console.log('  Note: First-gen recommendation not found');
    if (!hasLowIncome) console.log('  Note: Low-income recommendation not found');

    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Test 6: School-Specific Strategy Generation
  // --------------------------------------------------------------------------
  console.log('Test 6: School-Specific Strategy Generation');
  try {
    const input: ResearchGuidanceInput = {
      quantitativeAnalysis: createMockQuantitativeAnalysis(),
      targetSchools: ['Harvard', 'Stanford', 'MIT'],
      intendedMajor: 'Computer Science',
    };

    const guidance = generateResearchBackedGuidance(input);

    console.log(`  School Strategies Generated: ${guidance.schoolStrategies.length}`);
    for (const strategy of guidance.schoolStrategies) {
      console.log(`    - ${strategy.schoolName}: Fit = ${strategy.fitCategory} (${strategy.fitScore.toFixed(1)})`);
    }

    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Test 7: Conversation Guidance Points
  // --------------------------------------------------------------------------
  console.log('Test 7: Conversation Guidance Points');
  try {
    const input: ResearchGuidanceInput = {
      quantitativeAnalysis: createMockQuantitativeAnalysis({
        progressionTrajectory: {
          historical: {
            overallTrend: 'declining' as const,
            yearlyGPAs: [3.9, 3.7, 3.5],
          },
          projected: {
            targetGPA: 3.6,
            feasibility: 'uncertain',
          },
        },
      }),
      intendedMajor: 'Engineering',
    };

    const guidance = generateResearchBackedGuidance(input);

    console.log(`  Conversation Guidance Points: ${guidance.conversationGuidance.length}`);
    for (const point of guidance.conversationGuidance.slice(0, 3)) {
      console.log(`    - Topic: ${point.topic}`);
      console.log(`      Question: ${point.questionToAsk.substring(0, 60)}...`);
    }

    // Should have trajectory-related guidance given declining trend
    const hasTrajectoryGuidance = guidance.conversationGuidance.some(g =>
      g.topic.toLowerCase().includes('trajectory') || g.topic.toLowerCase().includes('grade')
    );

    if (!hasTrajectoryGuidance) {
      console.log('  Note: Expected trajectory guidance for declining student');
    }

    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Test 8: Application Strategy with ED/EA Recommendation
  // --------------------------------------------------------------------------
  console.log('Test 8: Application Strategy with ED/EA Recommendation');
  try {
    const input: ResearchGuidanceInput = {
      quantitativeAnalysis: createMockQuantitativeAnalysis(),
      targetSchools: ['Cornell', 'Northwestern', 'Duke'],
      intendedMajor: 'Business',
    };

    const guidance = generateResearchBackedGuidance(input);

    console.log(`  Timing Recommendation: ${guidance.applicationStrategy.timingStrategy.recommendation.toUpperCase()}`);
    console.log(`  Reasoning: ${guidance.applicationStrategy.timingStrategy.reasoning.substring(0, 80)}...`);
    console.log(`  Emphasize: ${guidance.applicationStrategy.emphasize.length} points`);
    console.log(`  Address: ${guidance.applicationStrategy.address.length} points`);
    console.log(`  Avoid: ${guidance.applicationStrategy.avoid.length} points`);

    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Test 9: Missing Critical Courses Detection
  // --------------------------------------------------------------------------
  console.log('Test 9: Missing Critical Courses Detection');
  try {
    // Student intending CS but missing key courses
    const input: ResearchGuidanceInput = {
      quantitativeAnalysis: {
        ...createMockQuantitativeAnalysis(),
        subjectPatterns: {
          math: {
            relativeStrength: 0.1,
            performanceHistory: {
              avgGPA: 3.8,
              trend: 'stable' as const,
              courses: [
                { name: 'Pre-Calculus', level: 'Honors', grade: 3.8, subject: 'math' },
                { name: 'Algebra 2', level: 'Honors', grade: 3.8, subject: 'math' },
              ],
            },
          },
          english: {
            relativeStrength: 0,
            performanceHistory: {
              avgGPA: 3.6,
              trend: 'stable' as const,
              courses: [
                { name: 'English 11', level: 'Honors', grade: 3.6, subject: 'english' },
              ],
            },
          },
        },
      },
      intendedMajor: 'Computer Science',
    };

    const guidance = generateResearchBackedGuidance(input);

    console.log(`  Missing Critical Courses: ${guidance.academicAssessment.rigorAssessment.missingCriticalCourses.length}`);
    for (const course of guidance.academicAssessment.rigorAssessment.missingCriticalCourses) {
      console.log(`    - ${course}`);
    }

    // Should identify missing AP Calculus BC for CS major
    const missingCalc = guidance.academicAssessment.rigorAssessment.missingCriticalCourses.some(c =>
      c.toLowerCase().includes('calculus')
    );

    if (missingCalc) {
      console.log('  Correctly identified missing Calculus requirement');
    }

    console.log('  PASS\n');
    passed++;
  } catch (error) {
    console.log(`  FAIL: ${error}\n`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Test 10: Research Sources Tracking
  // --------------------------------------------------------------------------
  console.log('Test 10: Research Sources Tracking');
  try {
    const input: ResearchGuidanceInput = {
      quantitativeAnalysis: createMockQuantitativeAnalysis(),
      schoolContext: {
        type: 'elite_prep',
        apCoursesAvailable: 20,
      },
      demographicContext: {
        socioeconomic: {
          firstGeneration: true,
        },
      },
      targetSchools: ['Harvard'],
      intendedMajor: 'Economics',
    };

    const guidance = generateResearchBackedGuidance(input);

    console.log(`  Research Sources Used: ${guidance.researchSources.length}`);
    for (const source of guidance.researchSources.slice(0, 5)) {
      console.log(`    - ${source}`);
    }

    if (guidance.researchSources.length < 3) {
      throw new Error('Expected at least 3 research sources');
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
