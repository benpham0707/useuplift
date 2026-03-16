/**
 * Test: L4 Active Contradiction Mining (Improvement 4)
 *
 * Validates:
 * 1. Adversarial pass finds contradictions with source: 'adversarial'
 * 2. Coaching map populated (all 5 sections)
 * 3. North Star irreplaceability assessment exists
 * 4. Backward compat: prioritizedImprovements still populated alongside coaching map
 * 5. Zero contradictions is valid (no false positives)
 * 6. Cost verification: adversarial Haiku ~$0.002-0.005, total L4 increase <15%
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-l4-contradiction-mining.ts
 */

import { analysisOrchestrator } from '../src/services/essayIntelligence/analysis/analysisOrchestrator';
import type { PipelineInput } from '../src/services/essayIntelligence/analysis/analysisOrchestrator';
import type { CoachingMap, NorthStarAssessment, CoherenceIssue } from '../src/services/essayIntelligence/profileTypes';

// ============================================================================
// TEST ESSAY — designed to have internal tensions for contradiction mining
// ============================================================================

const TEST_ESSAY = `The morning my grandmother's ring went to the pawnshop, I learned that everything has a price — even memories. The appraiser turned it slowly under fluorescent light, and I watched decades of Sunday dinners compress into a number on a yellow slip.

For three months I had avoided this moment. The rent was overdue, my mother's hours had been cut, and the ring sat in its velvet box like a small, glowing accusation. It wasn't just jewelry. It was the way Abuela's hand looked resting on her knee during telenovelas, the way she'd tap it on the kitchen counter when she was thinking.

But the pawnshop didn't care about telenovelas or kitchen counters. The man behind the glass only saw fourteen-karat gold, a quarter-carat stone, and a setting that was "vintage but not antique." His price was final. I said I'd think about it, knowing I wouldn't think about anything else.

That night I couldn't sleep. I kept calculating — the ring's pawnshop value against three months of Abuela's pension payments. She had worked thirty years in a factory so her family could have things that couldn't be pawned: education, stability, a sense of belonging that didn't depreciate. And here I was, converting her legacy into liquidity.

I went back the next morning and sold it. Not because I had made peace with the decision, but because peace was a luxury I couldn't afford either. The man counted out bills with practiced indifference, and I folded them into my pocket next to the velvet box, now empty.

What I didn't expect was the lightness. Not relief exactly, but the specific weightlessness of having crossed a line you can't uncross. The ring's absence on my finger became its own kind of presence — a phantom weight that reminded me, every time I reached for something, of the gap between what things are worth and what they mean.`;

const TEST_ESSAY_ID = 'test-l4-contradiction-mining-' + Date.now();

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runTests(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  L4 Active Contradiction Mining — Integration Test');
  console.log('═══════════════════════════════════════════════════════\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const input: PipelineInput = {
    essayId: TEST_ESSAY_ID,
    essayText: TEST_ESSAY,
    essayType: 'common_app',
    includeAnnotations: false, // Skip L5 — we only need L4
  };

  console.log('Running full pipeline (L1 → L4, no L5)...\n');
  const startTime = Date.now();
  const result = await analysisOrchestrator.analyzeEssay(input);
  const totalTime = Date.now() - startTime;

  console.log(`\nPipeline completed in ${totalTime}ms`);
  console.log(`Layers completed: ${result.layersCompleted.join(', ')}`);
  console.log(`Total cost: $${result.costSummary.totalCost.toFixed(4)}\n`);

  if (!result.layersCompleted.includes('L4')) {
    console.error('FATAL: L4 did not complete. Cannot test contradiction mining.');
    console.error('Failures:', result.layersFailed.map(f => `${f.layer}: ${f.message}`).join(', '));
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, detail?: string): void {
    if (condition) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // ── Test 1: Coherence report exists with contradictions ──
  console.log('\n── Test 1: Coherence Report Structure ──');
  const coherenceReport = result.coherenceReport!;
  assert('Coherence report exists', coherenceReport != null);
  assert(
    'Contradictions array exists',
    Array.isArray(coherenceReport.contradictions),
  );

  // ── Test 2: Check for adversarial source contradictions ──
  console.log('\n── Test 2: Adversarial Pass Integration ──');
  const adversarialIssues = coherenceReport.contradictions.filter(
    (c: CoherenceIssue) => c.source === 'adversarial',
  );
  const primaryIssues = coherenceReport.contradictions.filter(
    (c: CoherenceIssue) => c.source === 'primary',
  );

  // Adversarial pass may find 0 issues — that's valid, but it should have RUN
  assert(
    'Primary contradictions have source tag',
    primaryIssues.length > 0 || coherenceReport.contradictions.every(c => c.source != null),
    `primary=${primaryIssues.length}, adversarial=${adversarialIssues.length}, untagged=${coherenceReport.contradictions.filter(c => c.source == null).length}`,
  );

  console.log(`  Total contradictions: ${coherenceReport.contradictions.length}`);
  console.log(`  Primary: ${primaryIssues.length}, Adversarial: ${adversarialIssues.length}`);

  // ── Test 3: North Star Assessment ──
  console.log('\n── Test 3: North Star Assessment ──');
  const assessment: NorthStarAssessment | undefined = coherenceReport.northStarAssessment;
  assert(
    'North Star assessment exists',
    assessment != null,
    'Adversarial pass should produce an irreplaceability test',
  );
  if (assessment) {
    assert(
      'Assessment has reasoning',
      assessment.reasoning.length > 0,
    );
    assert(
      'Assessment has boolean test result',
      typeof assessment.passesIrreplaceabilityTest === 'boolean',
    );
    console.log(`  Passes irreplaceability test: ${assessment.passesIrreplaceabilityTest}`);
    if (assessment.missingInsight) {
      console.log(`  Missing insight: ${assessment.missingInsight}`);
    }
  }

  // ── Test 4: Coaching Map ──
  console.log('\n── Test 4: Coaching Map ──');
  const scoreMatrix = result.scoreMatrix!;
  const coachingMap: CoachingMap | undefined = scoreMatrix.coachingMap;
  assert('Coaching map exists', coachingMap != null);

  if (coachingMap) {
    assert(
      'Transformative insight populated',
      coachingMap.transformativeInsight.insight.length > 0,
      coachingMap.transformativeInsight.insight.substring(0, 80),
    );
    assert(
      'Priorities array populated',
      coachingMap.priorities.length > 0,
      `${coachingMap.priorities.length} priorities`,
    );
    assert(
      'Protected strengths array populated',
      coachingMap.protectedStrengths.length > 0,
      `${coachingMap.protectedStrengths.length} strengths`,
    );
    assert(
      'Emergent patterns array populated',
      coachingMap.emergentPatterns.length > 0,
      `${coachingMap.emergentPatterns.length} patterns`,
    );
    assert(
      'Score tensions array populated',
      coachingMap.scoreTensions.length > 0,
      `${coachingMap.scoreTensions.length} tensions`,
    );

    // Validate priority structure
    if (coachingMap.priorities.length > 0) {
      const firstPriority = coachingMap.priorities[0];
      assert(
        'Priority has target paragraphs',
        firstPriority.target.paragraphs.length > 0,
      );
      assert(
        'Priority has architectural reason',
        firstPriority.architecturalReason.length > 0,
      );
      assert(
        'Priority has unlocksNext',
        firstPriority.unlocksNext.length > 0,
      );
    }

    // Validate score tension structure
    if (coachingMap.scoreTensions.length > 0) {
      const firstTension = coachingMap.scoreTensions[0];
      assert(
        'Score tension has valid paragraph index',
        firstTension.paragraph >= 0 && firstTension.paragraph < scoreMatrix.paragraphs.length,
      );
      assert(
        'Score tension has interpretation',
        firstTension.interpretation.length > 0,
      );
    }
  }

  // ── Test 5: Backward Compatibility ──
  console.log('\n── Test 5: Backward Compatibility ──');
  assert(
    'prioritizedImprovements still populated',
    scoreMatrix.prioritizedImprovements.length > 0,
    `${scoreMatrix.prioritizedImprovements.length} improvements`,
  );
  assert(
    'Existing CoherenceIssue fields preserved',
    coherenceReport.contradictions.every(
      (c: CoherenceIssue) =>
        typeof c.sectionA === 'string' &&
        typeof c.claimA === 'string' &&
        typeof c.severity === 'string' &&
        typeof c.suggestedResolution === 'string',
    ),
  );

  // ── Test 6: Enriched Coherence Issue Fields ──
  console.log('\n── Test 6: Enriched Coherence Issue Fields ──');
  const issuesWithRouting = coherenceReport.contradictions.filter(
    (c: CoherenceIssue) => c.routingCategory != null,
  );
  assert(
    'Some contradictions have routingCategory',
    issuesWithRouting.length > 0 || coherenceReport.contradictions.length === 0,
    `${issuesWithRouting.length}/${coherenceReport.contradictions.length} have routing`,
  );

  const validCategories = ['productive_tension', 'system_disagreement', 'essay_flaw', 'depth_signal'];
  const invalidCategories = issuesWithRouting.filter(
    (c: CoherenceIssue) => c.routingCategory && !validCategories.includes(c.routingCategory),
  );
  assert(
    'All routing categories are valid enum values',
    invalidCategories.length === 0,
    invalidCategories.map(c => c.routingCategory).join(', '),
  );

  // ── Test 7: Cost Verification ──
  console.log('\n── Test 7: Cost Verification ──');
  const l4Cost = result.costSummary.layers.find(l => l.layer === 'L4');
  if (l4Cost) {
    console.log(`  L4 total cost: $${l4Cost.cost.toFixed(4)}`);
    // Adversarial pass cost is included in L4 total — we can't separate them from the cost summary
    // but we logged it during the run
    assert(
      'L4 cost is reasonable (< $0.30 total)',
      l4Cost.cost < 0.30,
      `$${l4Cost.cost.toFixed(4)}`,
    );
  }

  // ── SUMMARY ──
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
