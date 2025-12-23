/**
 * Full Workshop Pipeline Test
 *
 * Tests the complete EvolvedWorkshopOrchestrator pipeline:
 * - Stage 0: Voice Excavation
 * - Stage 1: Holistic Scoring (UnifiedScoringService)
 * - Stage 2: Surgical Suggestions
 * - Stage 3: Excellence Check
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-workshop-pipeline.ts
 */

import { EvolvedWorkshopOrchestrator } from '../src/services/commonAppWorkshop/services/evolvedWorkshopOrchestrator';
import { stanfordResearch } from '../src/services/commonAppWorkshop/data/stanford';
import type { SupplementalType } from '../src/data/commonAppSupplementalTypes';

// ============================================================================
// TEST ESSAYS
// ============================================================================

interface TestEssay {
  id: string;
  type: SupplementalType;
  essay: string;
  wordLimit: number;
  expectedTier: 'weak' | 'needs_work' | 'strong' | 'excellent';
  description: string;
}

const TEST_ESSAYS: TestEssay[] = [
  {
    id: 'why_us_weak',
    type: 'why_us',
    essay: `Stanford is one of the best universities in the world. I have always dreamed of attending a prestigious school like Stanford. The campus is beautiful and the professors are world-renowned. I believe Stanford will help me achieve my dreams and become successful. The opportunities at Stanford are amazing and I know I will thrive there. Stanford's reputation speaks for itself. I want to go to Stanford because it will look great on my resume.`,
    wordLimit: 250,
    expectedTier: 'weak',
    description: 'Performative, generic, swap-test fail'
  },
  {
    id: 'why_us_strong',
    type: 'why_us',
    essay: `Stanford's approach to interdisciplinary learning excites me. When I discovered Dr. Fei-Fei Li's work on ImageNet and her focus on democratizing AI, I realized Stanford bridges technical innovation with ethical consideration. My experience building a computer vision app to help my visually impaired grandmother navigate our home showed me AI's power lies in human applications.

I want to join the Human-Centered AI Institute and take CS229 to deepen my understanding of the mathematical foundations I've been teaching myself. Beyond academics, I'd contribute to Stanford Women in Machine Learning, sharing resources I wish I'd had access to earlier. The d.school's approach to design thinking could help me prototype more accessible AI interfaces.

Stanford isn't just where I want to learn—it's where I want to contribute to making AI more human.`,
    wordLimit: 250,
    expectedTier: 'strong',
    description: 'Specific, mutual fit, clear contribution'
  },
  {
    id: 'challenge_weak',
    type: 'challenge',
    essay: `My biggest challenge was when my parents got divorced. It was really hard for me and my family. I felt sad and confused for a long time. My grades dropped and I stopped hanging out with friends. It was a difficult time. But eventually I learned that hard work pays off and that family is important. This experience taught me to be resilient and never give up. I am stronger now because of what I went through. It made me who I am today.`,
    wordLimit: 350,
    expectedTier: 'weak',
    description: 'Generic clichés, no specifics, essay-speak'
  },
  {
    id: 'challenge_excellent',
    type: 'challenge',
    essay: `The morning after my father's stroke, I found his chess clock sitting on the kitchen table. For three weeks, we'd played every evening—his way of rebuilding neural pathways. That morning, for the first time, he remembered how to castle.

But I wasn't home that morning. I was at a coding competition I'd insisted on attending despite his condition worsening. When I returned to find my mother crying in the hallway, my first thought wasn't about my father—it was relief that I'd won third place.

That guilt reshaped how I understood success. I started spending mornings at the hospital, reading programming articles aloud to my father even when I wasn't sure he understood. When he finally responded to a joke about JavaScript callbacks, I realized presence matters more than achievement.

Now I code differently. Every project includes accessibility features. I volunteer teaching seniors to video call their grandchildren. My definition of "winning" expanded: it includes being somewhere when you're needed, not just when you're rewarded.

My father still can't beat me at chess. But every Tuesday, we play anyway.`,
    wordLimit: 350,
    expectedTier: 'excellent',
    description: 'Specific scene, authentic growth, behavioral change'
  }
];

// ============================================================================
// TEST RUNNER
// ============================================================================

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

async function runTest(orchestrator: EvolvedWorkshopOrchestrator, testEssay: TestEssay) {
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}TEST: ${testEssay.id}${RESET}`);
  console.log(`Type: ${testEssay.type}`);
  console.log(`Description: ${testEssay.description}`);
  console.log(`Expected Tier: ${testEssay.expectedTier}`);
  console.log('═'.repeat(70));

  const startTime = Date.now();

  try {
    const result = await orchestrator.runWorkshop({
      essayDraft: testEssay.essay,
      essayType: testEssay.type,
      college: testEssay.type === 'why_us' ? stanfordResearch : undefined,
      useDeepAnalysis: false, // Use hybrid mode for cost optimization
      maxIssues: 3
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Validate results
    const tierMatch = result.summary.initial_tier === testEssay.expectedTier;
    const projectedScore = result.summary.projected_score;
    const improvement = result.summary.improvement_potential;

    console.log('\n📊 RESULTS:');
    console.log(`  Initial Score: ${result.summary.initial_score}/100 (${result.summary.initial_tier})`);
    console.log(`  Projected Score: ${projectedScore}/100 (${result.summary.projected_tier})`);
    console.log(`  Improvement Potential: +${improvement} points`);
    console.log(`  Tier Match: ${tierMatch ? GREEN + '✓ YES' : RED + '✗ NO'} (expected: ${testEssay.expectedTier})${RESET}`);
    console.log(`  Excellence Met: ${result.summary.excellence_met ? GREEN + '✓' : YELLOW + '✗'}${RESET}`);

    console.log('\n🔍 STAGE OUTPUTS:');
    console.log(`  Stage 0: ${result.stage0.authentic_phrases.length} authentic phrases`);
    console.log(`  Stage 1: ${result.stage1.priority_issues.length} issues, ${result.stage1.critical_gaps.length} gaps`);
    console.log(`  Stage 2: ${result.stage2.issue_count} issues addressed`);
    console.log(`  Stage 3: ${result.stage3.requirements_met}/${result.stage3.requirements_total} requirements`);

    console.log('\n📝 TOP PRIORITIES:');
    for (const priority of result.summary.top_3_priorities.slice(0, 3)) {
      console.log(`  • ${priority.substring(0, 80)}${priority.length > 80 ? '...' : ''}`);
    }

    if (result.stage3.missing_requirements.length > 0) {
      console.log('\n⚠️ MISSING REQUIREMENTS:');
      for (const req of result.stage3.missing_requirements.slice(0, 3)) {
        console.log(`  • ${req.substring(0, 80)}${req.length > 80 ? '...' : ''}`);
      }
    }

    console.log('\n💰 COST:');
    console.log(`  Stage 0: $${result.cost.stage0.toFixed(4)}`);
    console.log(`  Stage 1: $${result.cost.stage1.toFixed(4)}`);
    console.log(`  Stage 2: $${result.cost.stage2.toFixed(4)}`);
    console.log(`  Stage 3: $${result.cost.stage3.toFixed(4)}`);
    console.log(`  Total: $${result.cost.total.toFixed(4)}`);
    console.log(`  Time: ${elapsed}s`);

    return {
      id: testEssay.id,
      passed: tierMatch,
      score: result.summary.initial_score,
      expectedTier: testEssay.expectedTier,
      actualTier: result.summary.initial_tier,
      projectedScore,
      improvement,
      cost: result.cost.total,
      time: parseFloat(elapsed),
      issuesFound: result.stage1.priority_issues.length,
      suggestionsGenerated: result.stage2.issue_count * 2,
      excellenceMet: result.summary.excellence_met
    };

  } catch (error) {
    console.log(`\n${RED}ERROR: ${error}${RESET}`);
    return {
      id: testEssay.id,
      passed: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function main() {
  console.log('\n' + '█'.repeat(70));
  console.log('  FULL WORKSHOP PIPELINE TEST');
  console.log('  Testing EvolvedWorkshopOrchestrator (Stage 0 → 3)');
  console.log('█'.repeat(70));

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`\n${RED}ERROR: ANTHROPIC_API_KEY not set${RESET}`);
    console.log('Please set your API key:');
    console.log('  export ANTHROPIC_API_KEY="sk-..."');
    console.log('  npx tsx tests/test-workshop-pipeline.ts');
    console.log('\nOr run inline:');
    console.log('  ANTHROPIC_API_KEY="sk-..." npx tsx tests/test-workshop-pipeline.ts\n');
    process.exit(1);
  }

  console.log(`\n${GREEN}✓ API Key found${RESET}`);

  const orchestrator = new EvolvedWorkshopOrchestrator();
  const results: any[] = [];

  for (const testEssay of TEST_ESSAYS) {
    const result = await runTest(orchestrator, testEssay);
    results.push(result);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n\n' + '█'.repeat(70));
  console.log('  SUMMARY');
  console.log('█'.repeat(70));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
  const totalTime = results.reduce((sum, r) => sum + (r.time || 0), 0);

  console.log(`\n📊 OVERALL RESULTS: ${passed}/${total} tests passed`);
  console.log(`💰 TOTAL COST: $${totalCost.toFixed(4)}`);
  console.log(`⏱️ TOTAL TIME: ${totalTime.toFixed(1)}s`);

  console.log('\n📋 DETAILED RESULTS:');
  console.log('┌─────────────────────┬───────┬──────────┬──────────┬───────────┬───────┐');
  console.log('│ Essay               │ Score │ Expected │ Actual   │ Projected │ Pass  │');
  console.log('├─────────────────────┼───────┼──────────┼──────────┼───────────┼───────┤');

  for (const r of results) {
    const status = r.passed ? GREEN + '✓' : RED + '✗';
    const id = r.id.padEnd(19).substring(0, 19);
    const score = (r.score?.toString() || 'ERR').padStart(5);
    const expected = (r.expectedTier || 'ERR').padEnd(8);
    const actual = (r.actualTier || 'ERR').padEnd(8);
    const projected = (r.projectedScore?.toString() || 'ERR').padStart(9);

    console.log(`│ ${id} │ ${score} │ ${expected} │ ${actual} │ ${projected} │ ${status}${RESET}     │`);
  }

  console.log('└─────────────────────┴───────┴──────────┴──────────┴───────────┴───────┘');

  // Check for errors
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    console.log(`\n${RED}ERRORS:${RESET}`);
    for (const e of errors) {
      console.log(`  ${e.id}: ${e.error}`);
    }
  }

  // Improvement potential analysis
  console.log('\n📈 IMPROVEMENT ANALYSIS:');
  for (const r of results) {
    if (r.improvement) {
      const bar = '█'.repeat(Math.min(20, Math.round(r.improvement / 5)));
      console.log(`  ${r.id.padEnd(20)}: +${r.improvement.toString().padStart(2)} points ${bar}`);
    }
  }

  console.log('\n');

  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

main();
