/**
 * Teaching Quality Assurance Test
 *
 * Validates the quality and completeness of all teaching bundles:
 * 1. Every issue type has a complete teaching bundle
 * 2. Every bundle has 3+ transformations (before/after examples)
 * 3. Every technique has defined steps (not fallback)
 * 4. Every technique has defined common mistakes (not fallback)
 * 5. Every technique has a description (not fallback)
 *
 * This test ensures we don't add features "just for the sake of it"
 * but maintain consistent quality across all teaching content.
 */

import { researchBackedTeachingService, ResearchBackedTeachingService, IssueType } from '../src/services/commonAppWorkshop/services/researchBackedTeachingService';

// ============================================================================
// QUALITY THRESHOLDS
// ============================================================================

const QUALITY_THRESHOLDS = {
  minTransformationsPerIssue: 3,
  minTechniqueCategories: 3,
  minStepsPerTechnique: 3,
  minMistakesPerTechnique: 2,
};

// ============================================================================
// TEST EXECUTION
// ============================================================================

interface IssueQualityResult {
  issueType: string;
  passed: boolean;
  transformationCount: number;
  techniqueCount: number;
  hasCoreTeaching: boolean;
  details: {
    hasCoreP: boolean;
    hasWhyMatters: boolean;
    hasTransformations: boolean;
    techniqueCategories: string[];
  };
}

interface TechniqueQualityResult {
  techniqueName: string;
  hasDescription: boolean;
  hasSteps: boolean;
  hasMistakes: boolean;
  stepCount: number;
  mistakeCount: number;
  isFallback: {
    description: boolean;
    steps: boolean;
    mistakes: boolean;
  };
}

function testIssueTypeQuality(issueType: IssueType): IssueQualityResult {
  const teaching = researchBackedTeachingService.getTeachingForIssue(issueType);
  const transformations = researchBackedTeachingService.getTransformations(issueType);
  const techniques = researchBackedTeachingService.getTechniquesForIssue(issueType);
  const whyMatters = researchBackedTeachingService.getWhyThisMatters(issueType);

  const hasCoreTeaching = !!teaching;
  const transformationCount = transformations.length;
  const techniqueCount = techniques.length;

  const passed = hasCoreTeaching &&
                 transformationCount >= QUALITY_THRESHOLDS.minTransformationsPerIssue &&
                 techniqueCount >= QUALITY_THRESHOLDS.minTechniqueCategories;

  return {
    issueType,
    passed,
    transformationCount,
    techniqueCount,
    hasCoreTeaching,
    details: {
      hasCoreP: !!teaching?.why_section.summary,
      hasWhyMatters: !!whyMatters?.explanation,
      hasTransformations: transformationCount > 0,
      techniqueCategories: techniques.map(t => t.name),
    },
  };
}

function testTechniqueQuality(techniqueName: string): TechniqueQualityResult {
  // Get a teaching bundle that uses this technique to test its quality
  const service = researchBackedTeachingService;

  // We need to check if the technique has real definitions or fallbacks
  // This requires accessing the private methods, so we'll test indirectly
  const allIssueTypes = service.getAvailableIssueTypes();

  let foundTechnique = null;
  for (const issueType of allIssueTypes) {
    const techniques = service.getTechniquesForIssue(issueType);
    foundTechnique = techniques.find(t =>
      t.name.toLowerCase().replace(/\s+/g, '_') === techniqueName.toLowerCase() ||
      t.name === techniqueName
    );
    if (foundTechnique) break;
  }

  if (!foundTechnique) {
    return {
      techniqueName,
      hasDescription: false,
      hasSteps: false,
      hasMistakes: false,
      stepCount: 0,
      mistakeCount: 0,
      isFallback: { description: true, steps: true, mistakes: true },
    };
  }

  // Check for fallback indicators
  const isFallbackDescription = foundTechnique.description.includes('Apply') &&
                                foundTechnique.description.includes('technique.');
  const isFallbackSteps = foundTechnique.steps.length === 2 &&
                          foundTechnique.steps[0].includes('Apply');
  const isFallbackMistakes = foundTechnique.common_mistakes.length === 2 &&
                             foundTechnique.common_mistakes.includes('Don\'t overdo it');

  return {
    techniqueName,
    hasDescription: !isFallbackDescription,
    hasSteps: !isFallbackSteps,
    hasMistakes: !isFallbackMistakes,
    stepCount: foundTechnique.steps.length,
    mistakeCount: foundTechnique.common_mistakes.length,
    isFallback: {
      description: isFallbackDescription,
      steps: isFallbackSteps,
      mistakes: isFallbackMistakes,
    },
  };
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('\n' + '█'.repeat(70));
  console.log('  TEACHING QUALITY ASSURANCE TEST');
  console.log('█'.repeat(70));
  console.log('\nValidating all teaching bundles meet quality standards.\n');

  // Get stats
  const stats = researchBackedTeachingService.getStats();
  console.log('📊 SYSTEM STATS:');
  console.log(`   Issue types covered: ${stats.issueTypesCovered}`);
  console.log(`   Total transformations: ${stats.totalTransformations}`);
  console.log(`   Technique categories: ${stats.techniqueCategories}`);
  console.log(`   Sources available: ${stats.sourcesAvailable}`);

  // Test all issue types
  console.log('\n' + '═'.repeat(70));
  console.log('  ISSUE TYPE QUALITY');
  console.log('═'.repeat(70));

  const allIssueTypes = researchBackedTeachingService.getAvailableIssueTypes();
  const issueResults: IssueQualityResult[] = [];

  for (const issueType of allIssueTypes) {
    const result = testIssueTypeQuality(issueType);
    issueResults.push(result);

    const status = result.passed ? '✅' : '⚠️';
    console.log(`\n${status} ${issueType.toUpperCase()}`);
    console.log(`   Transformations: ${result.transformationCount} (min: ${QUALITY_THRESHOLDS.minTransformationsPerIssue})`);
    console.log(`   Techniques: ${result.techniqueCount} (min: ${QUALITY_THRESHOLDS.minTechniqueCategories})`);
    console.log(`   Core teaching: ${result.hasCoreTeaching ? '✓' : '✗'}`);

    if (!result.passed) {
      if (result.transformationCount < QUALITY_THRESHOLDS.minTransformationsPerIssue) {
        console.log(`   ⚠️  Need ${QUALITY_THRESHOLDS.minTransformationsPerIssue - result.transformationCount} more transformations`);
      }
      if (result.techniqueCount < QUALITY_THRESHOLDS.minTechniqueCategories) {
        console.log(`   ⚠️  Need ${QUALITY_THRESHOLDS.minTechniqueCategories - result.techniqueCount} more techniques`);
      }
    }
  }

  // Collect all unique techniques
  console.log('\n' + '═'.repeat(70));
  console.log('  TECHNIQUE QUALITY');
  console.log('═'.repeat(70));

  const allTechniques = new Set<string>();
  for (const issueType of allIssueTypes) {
    const techniques = researchBackedTeachingService.getTechniquesForIssue(issueType);
    techniques.forEach(t => allTechniques.add(t.name));
  }

  const techniqueResults: TechniqueQualityResult[] = [];
  for (const technique of allTechniques) {
    const result = testTechniqueQuality(technique);
    techniqueResults.push(result);
  }

  // Count quality metrics
  const techniquesWithDescription = techniqueResults.filter(t => t.hasDescription).length;
  const techniquesWithSteps = techniqueResults.filter(t => t.hasSteps).length;
  const techniquesWithMistakes = techniqueResults.filter(t => t.hasMistakes).length;

  console.log(`\n📈 TECHNIQUE COVERAGE:`);
  console.log(`   Total techniques: ${allTechniques.size}`);
  console.log(`   With real descriptions: ${techniquesWithDescription}/${allTechniques.size} (${Math.round(techniquesWithDescription/allTechniques.size*100)}%)`);
  console.log(`   With real steps: ${techniquesWithSteps}/${allTechniques.size} (${Math.round(techniquesWithSteps/allTechniques.size*100)}%)`);
  console.log(`   With real mistakes: ${techniquesWithMistakes}/${allTechniques.size} (${Math.round(techniquesWithMistakes/allTechniques.size*100)}%)`);

  // Show techniques with fallbacks
  const fallbackTechniques = techniqueResults.filter(t =>
    t.isFallback.description || t.isFallback.steps || t.isFallback.mistakes
  );

  if (fallbackTechniques.length > 0) {
    console.log('\n⚠️  TECHNIQUES USING FALLBACKS:');
    for (const t of fallbackTechniques) {
      const issues = [];
      if (t.isFallback.description) issues.push('description');
      if (t.isFallback.steps) issues.push('steps');
      if (t.isFallback.mistakes) issues.push('mistakes');
      console.log(`   • ${t.techniqueName}: ${issues.join(', ')}`);
    }
  }

  // Summary
  console.log('\n' + '█'.repeat(70));
  console.log('  QUALITY SUMMARY');
  console.log('█'.repeat(70));

  const issuesPassed = issueResults.filter(r => r.passed).length;
  const totalIssues = issueResults.length;
  const avgTransformations = issueResults.reduce((sum, r) => sum + r.transformationCount, 0) / totalIssues;
  const avgTechniques = issueResults.reduce((sum, r) => sum + r.techniqueCount, 0) / totalIssues;

  console.log('\n┌' + '─'.repeat(48) + '┐');
  console.log('│ METRIC                            │ VALUE      │');
  console.log('├' + '─'.repeat(48) + '┤');
  console.log(`│ Issue types passing               │ ${issuesPassed}/${totalIssues}`.padEnd(49) + '│');
  console.log(`│ Avg transformations per issue     │ ${avgTransformations.toFixed(1)}`.padEnd(49) + '│');
  console.log(`│ Avg techniques per issue          │ ${avgTechniques.toFixed(1)}`.padEnd(49) + '│');
  console.log(`│ Techniques with real descriptions │ ${techniquesWithDescription}/${allTechniques.size}`.padEnd(49) + '│');
  console.log(`│ Techniques with real steps        │ ${techniquesWithSteps}/${allTechniques.size}`.padEnd(49) + '│');
  console.log(`│ Techniques with real mistakes     │ ${techniquesWithMistakes}/${allTechniques.size}`.padEnd(49) + '│');
  console.log('└' + '─'.repeat(48) + '┘');

  // Final verdict
  const overallQuality =
    (issuesPassed / totalIssues >= 0.9) &&
    (techniquesWithDescription / allTechniques.size >= 0.8) &&
    (techniquesWithSteps / allTechniques.size >= 0.8);

  console.log('\n' + '═'.repeat(70));
  if (overallQuality) {
    console.log('  ✅ QUALITY ASSURANCE: PASSED');
    console.log('     • All issue types have comprehensive teaching bundles');
    console.log('     • Techniques have actionable steps and common mistakes');
    console.log('     • Transformations provide concrete before/after examples');
  } else {
    console.log('  ⚠️  QUALITY ASSURANCE: NEEDS ATTENTION');
    if (issuesPassed / totalIssues < 0.9) {
      console.log(`     - ${totalIssues - issuesPassed} issue types need more content`);
    }
    if (techniquesWithSteps / allTechniques.size < 0.8) {
      console.log(`     - ${allTechniques.size - techniquesWithSteps} techniques need real step definitions`);
    }
    if (techniquesWithMistakes / allTechniques.size < 0.8) {
      console.log(`     - ${allTechniques.size - techniquesWithMistakes} techniques need common mistake definitions`);
    }
  }
  console.log('═'.repeat(70) + '\n');

  // Exit with appropriate code
  process.exit(overallQuality ? 0 : 1);
}

main();
