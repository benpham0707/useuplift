#!/usr/bin/env node

/**
 * TEST RUNNER FOR MCP ENHANCEMENTS
 *
 * Validates that all enhancements are improvements and work together seamlessly.
 * Tests nuanced intelligence, reality-based analysis, and strategic guidance.
 */

import {
  TEST_SCENARIOS,
  INTEGRATION_TESTS,
  REGRESSION_TESTS,
  PERFORMANCE_BENCHMARKS,
  STUDENT_FIRST_GEN_LEADER,
  STUDENT_CREATIVE_ARTIST,
  STUDENT_STEM_RESEARCHER,
  STUDENT_TITLE_ONLY,
  STUDENT_SERVICE_LEADER
} from './test-scenarios.js';

import { tools } from './src/tools/index.js';

// ============================================================================
// MOCK SUPABASE DATA
// ============================================================================

// Mock database mapping user_id to student profile
const MOCK_STUDENT_DATA: Record<string, any> = {
  'test-001': STUDENT_FIRST_GEN_LEADER,
  'test-002': STUDENT_CREATIVE_ARTIST,
  'test-003': STUDENT_STEM_RESEARCHER,
  'test-004': STUDENT_TITLE_ONLY,
  'test-005': STUDENT_SERVICE_LEADER
};

/**
 * Mock the Supabase client to return test data instead of hitting the database
 */
function mockSupabaseForTesting() {
  // Store original getCompleteStudentContext
  const originalTools = { ...tools };

  // Override tools to use mock data
  (tools as any).get_student_profile = async (input: { user_id: string }) => {
    const mockData = MOCK_STUDENT_DATA[input.user_id];
    if (!mockData) {
      throw new Error(`No mock data for user_id: ${input.user_id}`);
    }

    return {
      profile: mockData.profile || {},
      personal_info: mockData.personal_info || {},
      academic: mockData.academic || {},
      goals: mockData.goals || {},
      family: mockData.family || {},
      personal_growth: mockData.personal_growth || {},
      completion_score: 0.85,
      has_leadership_roles: (mockData.profile?.leadership_roles?.length || 0) > 0,
      is_first_gen: mockData.profile?.first_gen || false,
      has_challenging_circumstances: mockData.profile?.challenging_circumstances || false
    };
  };

  (tools as any).get_extracurriculars = async (input: { user_id: string }) => {
    const mockData = MOCK_STUDENT_DATA[input.user_id];
    if (!mockData) {
      throw new Error(`No mock data for user_id: ${input.user_id}`);
    }

    return {
      extracurriculars: mockData.profile?.extracurriculars || [],
      work_experiences: mockData.profile?.work_experiences || [],
      volunteer_service: mockData.profile?.volunteer_service || [],
      personal_projects: mockData.profile?.personal_projects || [],
      leadership_roles: mockData.profile?.leadership_roles || [],
      total_count: (mockData.profile?.extracurriculars?.length || 0) +
                   (mockData.profile?.work_experiences?.length || 0) +
                   (mockData.profile?.volunteer_service?.length || 0) +
                   (mockData.profile?.personal_projects?.length || 0)
    };
  };

  (tools as any).get_academic_context = async (input: { user_id: string }) => {
    const mockData = MOCK_STUDENT_DATA[input.user_id];
    if (!mockData) {
      throw new Error(`No mock data for user_id: ${input.user_id}`);
    }

    return {
      gpa: mockData.profile?.gpa || 0,
      gpa_scale: 4.0,
      class_rank: mockData.profile?.class_rank || null,
      class_size: mockData.profile?.class_size || null,
      course_rigor: mockData.profile?.course_rigor || 'medium',
      ap_ib_courses: mockData.profile?.ap_ib_courses || [],
      ap_exams: mockData.profile?.ap_exams || [],
      ib_exams: mockData.profile?.ib_exams || [],
      test_scores: mockData.profile?.test_scores || {}
    };
  };

  (tools as any).get_context_circumstances = async (input: { user_id: string }) => {
    const mockData = MOCK_STUDENT_DATA[input.user_id];
    if (!mockData) {
      throw new Error(`No mock data for user_id: ${input.user_id}`);
    }

    return {
      family_responsibilities: {
        types: mockData.profile?.family_responsibility_types || [],
        hours_per_week: mockData.profile?.family_hours_per_week || 0,
        circumstances: mockData.profile?.family_circumstances || []
      },
      challenging_circumstances: mockData.profile?.challenging_circumstances || false,
      first_generation: mockData.profile?.first_gen || false,
      financial_need: mockData.profile?.financial_need || false,
      household_income: mockData.profile?.household_income || null,
      english_proficiency_needed: mockData.profile?.english_learner || false,
      years_in_us: mockData.profile?.years_in_us || null,
      other_context: mockData.profile?.other_context || ''
    };
  };

  return originalTools;
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  error?: string;
  duration_ms?: number;
}

async function runUnitTest(test: any): Promise<TestResult> {
  const startTime = Date.now();

  try {
    // Call the tool
    const toolFunction = (tools as any)[test.tool];
    if (!toolFunction) {
      throw new Error(`Tool ${test.tool} not found`);
    }

    // Build input - use test.input if provided, otherwise default to user_id
    let input: any;
    if (test.input) {
      input = { user_id: test.student.user_id, ...test.input };
    } else {
      input = { user_id: test.student.user_id };
    }

    const result = await toolFunction(input);

    // Run test validation
    await test.test(result);

    const duration = Date.now() - startTime;
    return {
      name: test.name,
      status: 'PASS',
      duration_ms: duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name: test.name,
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
      duration_ms: duration
    };
  }
}

async function runIntegrationTest(test: any): Promise<TestResult> {
  const startTime = Date.now();

  try {
    let prevResult: any = null;

    for (const step of test.steps) {
      const toolFunction = (tools as any)[step.tool];
      if (!toolFunction) {
        throw new Error(`Tool ${step.tool} not found`);
      }

      // Build input
      let input: any;
      if (step.input) {
        input = typeof step.input === 'function' ? step.input(prevResult) : step.input;
        // Add user_id if not already present
        if (!input.user_id && test.student) {
          input.user_id = test.student.user_id;
        }
      } else {
        // Default to test student if available
        input = { user_id: test.student ? test.student.user_id : 'test-001' };
      }

      const result = await toolFunction(input);

      // Validate step
      if (step.validate) {
        prevResult = step.validate(result);
      } else {
        prevResult = result;
      }
    }

    const duration = Date.now() - startTime;
    return {
      name: test.name,
      status: 'PASS',
      duration_ms: duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name: test.name,
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
      duration_ms: duration
    };
  }
}

async function runRegressionTest(test: any): Promise<TestResult> {
  const startTime = Date.now();

  try {
    // Regression tests have a test() function
    await test.test();

    const duration = Date.now() - startTime;
    return {
      name: test.name,
      status: 'PASS',
      duration_ms: duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name: test.name,
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
      duration_ms: duration
    };
  }
}

async function runPerformanceBenchmark(benchmark: any): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const toolFunction = (tools as any)[benchmark.tool];
    if (!toolFunction) {
      throw new Error(`Tool ${benchmark.tool} not found`);
    }

    await toolFunction(benchmark.input);

    const duration = Date.now() - startTime;

    if (duration > benchmark.max_time_ms) {
      throw new Error(`Performance degradation: ${duration}ms > ${benchmark.max_time_ms}ms threshold`);
    }

    return {
      name: benchmark.name,
      status: 'PASS',
      duration_ms: duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name: benchmark.name,
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
      duration_ms: duration
    };
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MCP ENHANCEMENT VALIDATION TEST SUITE');
  console.log('  Testing: Nuanced Intelligence, Reality-Based Analysis');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Mock Supabase
  console.log('🔧 Mocking Supabase with test student profiles...\n');
  const originalTools = mockSupabaseForTesting();

  const allResults: TestResult[] = [];

  // ============================================================================
  // UNIT TESTS
  // ============================================================================

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  UNIT TESTS (${TEST_SCENARIOS.length} scenarios)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const test of TEST_SCENARIOS) {
    process.stdout.write(`Running: ${test.name}... `);
    const result = await runUnitTest(test);
    allResults.push(result);

    if (result.status === 'PASS') {
      console.log(`✅ PASS (${result.duration_ms}ms)`);
    } else {
      console.log(`❌ FAIL`);
      console.log(`   Error: ${result.error}\n`);
    }
  }

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  INTEGRATION TESTS (2 workflows)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const test of INTEGRATION_TESTS) {
    process.stdout.write(`Running: ${test.name}... `);
    const result = await runIntegrationTest(test);
    allResults.push(result);

    if (result.status === 'PASS') {
      console.log(`✅ PASS (${result.duration_ms}ms)`);
    } else {
      console.log(`❌ FAIL`);
      console.log(`   Error: ${result.error}\n`);
    }
  }

  // ============================================================================
  // REGRESSION TESTS
  // ============================================================================

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  REGRESSION TESTS (2 scenarios)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const test of REGRESSION_TESTS) {
    process.stdout.write(`Running: ${test.name}... `);
    const result = await runRegressionTest(test);
    allResults.push(result);

    if (result.status === 'PASS') {
      console.log(`✅ PASS (${result.duration_ms}ms)`);
    } else {
      console.log(`❌ FAIL`);
      console.log(`   Error: ${result.error}\n`);
    }
  }

  // ============================================================================
  // PERFORMANCE BENCHMARKS
  // ============================================================================

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  PERFORMANCE BENCHMARKS (${Object.keys(PERFORMANCE_BENCHMARKS).length} scenarios)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const [toolName, benchmark] of Object.entries(PERFORMANCE_BENCHMARKS)) {
    const benchmarkTest = {
      name: `Performance: ${toolName}`,
      tool: toolName,
      input: { user_id: 'test-001' },
      max_time_ms: (benchmark as any).max_time_ms
    };

    process.stdout.write(`Running: ${benchmarkTest.name}... `);
    const result = await runPerformanceBenchmark(benchmarkTest);
    allResults.push(result);

    if (result.status === 'PASS') {
      console.log(`✅ PASS (${result.duration_ms}ms / ${benchmarkTest.max_time_ms}ms max)`);
    } else {
      console.log(`❌ FAIL`);
      console.log(`   Error: ${result.error}\n`);
    }
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const totalTests = allResults.length;
  const passed = allResults.filter(r => r.status === 'PASS').length;
  const failed = allResults.filter(r => r.status === 'FAIL').length;
  const passRate = ((passed / totalTests) * 100).toFixed(1);

  console.log(`Total Tests:  ${totalTests}`);
  console.log(`Passed:       ${passed} ✅`);
  console.log(`Failed:       ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log(`Pass Rate:    ${passRate}%\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    allResults
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  ❌ ${r.name}`);
        console.log(`     ${r.error}\n`);
      });
  }

  const avgDuration = (allResults.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / totalTests).toFixed(0);
  console.log(`Average Test Duration: ${avgDuration}ms`);

  console.log('\n═══════════════════════════════════════════════════════════════');

  if (failed === 0) {
    console.log('  ✅ ALL TESTS PASSED');
    console.log('  Enhancements validated as improvements building on each other');
    console.log('═══════════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.log('  ❌ SOME TESTS FAILED');
    console.log('  Review failures above');
    console.log('═══════════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error in test runner:', error);
  process.exit(1);
});
