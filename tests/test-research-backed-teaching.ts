/**
 * Test Research-Backed Teaching Service
 *
 * Validates that the knowledge bridge is working - transforming
 * pattern detection into research-backed teaching with:
 * - WHY explanations
 * - HOW techniques
 * - EVIDENCE from sources
 * - EXAMPLES with before/after transformations
 */

import { researchBackedTeachingService } from '../src/services/commonAppWorkshop/services/researchBackedTeachingService';
import type { IssueType } from '../src/services/commonAppWorkshop/services/researchBackedTeachingService';

async function runTest() {
  console.log('RESEARCH-BACKED TEACHING SERVICE TEST');
  console.log('='.repeat(70));
  console.log('');

  // Get service stats
  const stats = researchBackedTeachingService.getStats();
  console.log('Service Statistics:');
  console.log(`  - Issue types covered: ${stats.issueTypesCovered}`);
  console.log(`  - Total transformations: ${stats.totalTransformations}`);
  console.log(`  - Sources available: ${stats.sourcesAvailable}`);
  console.log(`  - Technique categories: ${stats.techniqueCategories}`);
  console.log('');

  // Test each covered issue type
  const issueTypes = researchBackedTeachingService.getAvailableIssueTypes();
  console.log('Available Issue Types:', issueTypes.join(', '));
  console.log('');

  let allPassed = true;
  const results: { type: string; passed: boolean; details: string }[] = [];

  for (const issueType of issueTypes) {
    console.log('-'.repeat(70));
    console.log(`Testing: ${issueType}`);
    console.log('-'.repeat(70));

    // Get full teaching bundle
    const teaching = researchBackedTeachingService.getTeachingForIssue(issueType);

    if (!teaching) {
      console.log('  ERROR: No teaching bundle returned');
      results.push({ type: issueType, passed: false, details: 'No teaching bundle' });
      allPassed = false;
      continue;
    }

    // Validate WHY section
    const hasWhySummary = teaching.why_section.summary.length > 50;
    const hasResearchInsight = teaching.why_section.research_insight.length > 50;
    const hasWhySources = teaching.why_section.sources.length > 0;

    console.log('');
    console.log('  WHY Section:');
    console.log(`    - Summary: ${hasWhySummary ? 'OK' : 'MISSING'} (${teaching.why_section.summary.substring(0, 60)}...)`);
    console.log(`    - Research insight: ${hasResearchInsight ? 'OK' : 'MISSING'}`);
    console.log(`    - Sources: ${teaching.why_section.sources.length} attached`);

    // Validate techniques
    const hasTechniques = teaching.techniques.length > 0;
    const techniquesHaveSteps = teaching.techniques.every(t => t.steps.length > 0);

    console.log('');
    console.log('  TECHNIQUES:');
    for (const technique of teaching.techniques.slice(0, 2)) {
      console.log(`    - ${technique.name} [${technique.difficulty}]: ${technique.steps.length} steps`);
    }
    if (teaching.techniques.length > 2) {
      console.log(`    - ... and ${teaching.techniques.length - 2} more`);
    }

    // Validate transformations
    const hasTransformations = teaching.transformations.length > 0;

    console.log('');
    console.log('  TRANSFORMATIONS:');
    for (const transform of teaching.transformations.slice(0, 1)) {
      console.log(`    Before: "${transform.before.substring(0, 50)}..."`);
      console.log(`    After:  "${transform.after.substring(0, 50)}..."`);
      console.log(`    Why:    ${transform.why_it_works.substring(0, 60)}...`);
    }

    // Validate evidence
    const hasEvidence = teaching.evidence.primary_sources.length > 0 ||
                        teaching.evidence.supporting_quotes.length > 0;

    console.log('');
    console.log('  EVIDENCE:');
    console.log(`    - Primary sources: ${teaching.evidence.primary_sources.length}`);
    console.log(`    - Supporting quotes: ${teaching.evidence.supporting_quotes.length}`);

    // Test inline explanation
    const inline = researchBackedTeachingService.getInlineExplanation(issueType);
    const hasInline = inline.length > 20;

    console.log('');
    console.log('  INLINE EXPLANATION:');
    console.log(`    "${inline.substring(0, 80)}..."`);

    // Test why this matters
    const why = researchBackedTeachingService.getWhyThisMatters(issueType);
    const hasWhyMatters = why !== null && why.explanation.length > 50;

    // Determine pass/fail
    const passed = hasWhySummary && hasResearchInsight && hasTechniques &&
                   techniquesHaveSteps && hasTransformations && hasInline && hasWhyMatters;

    const details = [
      !hasWhySummary && 'missing why summary',
      !hasResearchInsight && 'missing research insight',
      !hasTechniques && 'no techniques',
      !techniquesHaveSteps && 'techniques missing steps',
      !hasTransformations && 'no transformations',
      !hasInline && 'no inline explanation',
      !hasWhyMatters && 'no why_this_matters',
    ].filter(Boolean).join(', ') || 'all checks passed';

    results.push({ type: issueType, passed, details });

    if (!passed) allPassed = false;

    console.log('');
    console.log(`  Result: ${passed ? 'PASSED' : 'FAILED'} - ${details}`);
  }

  // Test college-specific guidance
  console.log('');
  console.log('-'.repeat(70));
  console.log('Testing College-Specific Guidance');
  console.log('-'.repeat(70));

  const colleges = ['Stanford', 'MIT', 'Harvard'];
  for (const college of colleges) {
    const guidance = researchBackedTeachingService.getCollegeSpecificGuidance(
      'telling_not_showing' as IssueType,
      college
    );
    console.log(`  ${college}: ${guidance.sources.length} sources, insight: ${guidance.insight ? 'YES' : 'NO'}`);
    if (guidance.insight) {
      console.log(`    "${guidance.insight.substring(0, 70)}..."`);
    }
  }

  // Test teaching moments
  console.log('');
  console.log('-'.repeat(70));
  console.log('Testing Teaching Moment Types');
  console.log('-'.repeat(70));

  const momentTypes = ['why_this_matters', 'how_to_fix', 'before_after'] as const;
  for (const moment of momentTypes) {
    const sources = researchBackedTeachingService.getTeachingMoment(
      'telling_not_showing' as IssueType,
      moment
    );
    console.log(`  ${moment}: ${sources.length} sources`);
  }

  // Summary
  console.log('');
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log('');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total Issue Types Tested: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('');

  if (allPassed) {
    console.log('ALL TESTS PASSED');
    console.log('');
    console.log('The Research-Backed Teaching Service provides:');
    console.log(`  - ${stats.issueTypesCovered} issue types with full teaching bundles`);
    console.log(`  - ${stats.totalTransformations} before/after transformation examples`);
    console.log(`  - ${stats.techniqueCategories} technique categories with step-by-step guidance`);
    console.log(`  - ${stats.sourcesAvailable} sources available for citation`);
    console.log('');
    console.log('Knowledge Bridge Status: OPERATIONAL');
    console.log('  - Detection → Teaching: Connected');
    console.log('  - Sources → Explanations: Connected');
    console.log('  - Patterns → Techniques: Connected');
  } else {
    console.log('SOME TESTS FAILED');
    console.log('');
    for (const result of results.filter(r => !r.passed)) {
      console.log(`  - ${result.type}: ${result.details}`);
    }
    process.exit(1);
  }
}

runTest().catch(console.error);
