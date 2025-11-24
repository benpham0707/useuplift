/**
 * Phase 14-15 Complete System Test
 *
 * This test validates the complete Phase 14-15 Redux implementation:
 * - Enhanced Teaching Protocol (Phase 14)
 * - Output Validation with Active Feedback Loop (Phase 15)
 *
 * Test Strategy:
 * 1. Run surgical editor with validation system
 * 2. Measure rationale quality (length, educational depth)
 * 3. Verify no AI clichés escape
 * 4. Compare before/after quality metrics
 */

import { generateSurgicalFixes } from '../src/services/narrativeWorkshop/surgicalEditor_v2';
import { analyzeVoiceFingerprint } from '../src/services/narrativeWorkshop/analyzers/voiceFingerprintAnalyzer';
import { analyzeHolisticUnderstanding } from '../src/services/narrativeWorkshop/stage1_holisticUnderstanding';
import { DetectedLocator } from '../src/services/narrativeWorkshop/analyzers/locatorAnalyzers';
import { NarrativeEssayInput } from '../src/services/narrativeWorkshop/types';
import * as fs from 'fs';

// ============================================================================
// TEST ESSAY (LEGO/CS Essay)
// ============================================================================

const LEGO_ESSAY = `I was always captivated by puzzles throughout my life. When I was about seven years old, I would regularly challenge myself with lego sets for ages fourteen years and up or the 1000 piece puzzle sets. The three-dimensional Lego Ninjago set I received for my eighth birthday quickly became an intergalactic spacecraft with the addition of a few more pieces and my young imagination. As I matured, I lost interest in toys, eventually stashing my whole realm of imagination and inventiveness in the pathetic environment of my garage. However, my passion for problem solving and puzzles lingered.

In freshman year of high school, I was tasked with constructing a website. All the limitless functionality that computers possessed got me enthralled with modern technology. After brainstorming for a couple of hours, I decided I was going to make a shoe-selling website because of my interest in sneakers, which I would consider as the "legos" for young adults. Throughout the whole process of creating this website, I encountered many incidences of syntax errors and code malfunctions. However, the obstacles didn't seize my creativity from taking hold of me. Although I had not possessed the best knowledge of HTML yet, an endless flow of ideas surged through my mind. Having successfully finished the website and receiving 100% for my grade, I was confident there would be much more I can accomplish in the future. I believe inventiveness is a must have quality in the field of Computer Science because there's not strictly one way to solve a problem. Similar to each block in a lego set, each line of code that goes into a program serves a role in making sure the structure of the program is sound.`;

// ============================================================================
// TEST CASES
// ============================================================================

const TEST_LOCATORS: DetectedLocator[] = [
  {
    startIndex: 0,
    endIndex: 45,
    quote: 'I was always captivated by puzzles throughout my life.',
    problem: 'Abstract opening with generic emotion',
    whyItMatters: 'Opening lacks power and specificity',
    rubricCategory: 'opening_power_scene_entry',
    severity: 'critical'
  },
  {
    startIndex: 490,
    endIndex: 610,
    quote: 'As I matured, I lost interest in toys, eventually stashing my whole realm of imagination and inventiveness in the pathetic environment of my garage.',
    problem: 'Uses AI cliché "realm" and passive language',
    whyItMatters: 'AI-sounding language breaks authenticity',
    rubricCategory: 'narrative_arc_stakes_turn',
    severity: 'critical'
  },
  {
    startIndex: 810,
    endIndex: 900,
    quote: 'Throughout the whole process of creating this website, I encountered many incidences of syntax errors and code malfunctions.',
    problem: 'Summary language, no specific moment',
    whyItMatters: 'Tells struggle instead of showing it',
    rubricCategory: 'show_dont_tell_craft',
    severity: 'warning'
  },
  {
    startIndex: 1050,
    endIndex: 1105,
    quote: 'Although I had not possessed the best knowledge of HTML yet',
    problem: 'Awkward passive construction',
    whyItMatters: 'Passive voice masks agency',
    rubricCategory: 'character_interiority_vulnerability',
    severity: 'warning'
  }
];

// ============================================================================
// VALIDATION METRICS
// ============================================================================

interface QualityMetrics {
  rationale: {
    averageLength: number;
    minLength: number;
    maxLength: number;
    hasEducationalKeywords: number; // count
    usesIChanged: number; // count
    usesVagueLanguage: number; // count
  };
  suggestions: {
    containsBannedTerms: number;
    containsPassiveVoice: number;
    containsGenericDetermination: number;
    averageQualityScore: number;
  };
  retries: {
    totalAttempts: number;
    successfulFirstTry: number;
    requiredRetry: number;
    failedAllAttempts: number;
  };
}

function analyzeRationaleQuality(rationale: string): {
  length: number;
  hasEducationalKeywords: boolean;
  usesIChanged: boolean;
  usesVagueLanguage: boolean;
} {
  const words = rationale.split(/\s+/).length;

  const educationalKeywords = [
    /\bprinciple\b/i,
    /\bessence\b/i,
    /\breaders?\b/i,
    /\bexperience\b/i,
    /\bshow don't tell\b/i,
    /\bactive voice\b/i,
    /\bspecificity\b/i,
    /\bby .+, we\b/i
  ];

  const hasEducational = educationalKeywords.some(pattern => pattern.test(rationale));
  const usesIChanged = /\b[Ii]\s+changed\b/.test(rationale);
  const usesVague = /\b(more specific|better|improved|enhanced)\b/i.test(rationale);

  return {
    length: words,
    hasEducationalKeywords: hasEducational,
    usesIChanged,
    usesVagueLanguage: usesVague
  };
}

function analyzeTextQuality(text: string): {
  hasBannedTerms: boolean;
  hasPassiveVoice: boolean;
  hasGenericDetermination: boolean;
} {
  const textLower = text.toLowerCase();

  const bannedTerms = ['tapestry', 'realm', 'testament', 'showcase', 'delve', 'underscore'];
  const hasBanned = bannedTerms.some(term => textLower.includes(term));

  const passivePatterns = [/\bwas\s+\w+ing\b/i, /\bwere\s+\w+ing\b/i];
  const hasPassive = passivePatterns.some(pattern => pattern.test(text));

  const genericDetermination = ['gave 110%', 'my determination', 'training my brain'];
  const hasGeneric = genericDetermination.some(phrase => textLower.includes(phrase));

  return {
    hasBannedTerms: hasBanned,
    hasPassiveVoice: hasPassive,
    hasGenericDetermination: hasGeneric
  };
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function runPhase14_15_Test() {
  console.log('='.repeat(80));
  console.log('PHASE 14-15 COMPLETE SYSTEM TEST');
  console.log('='.repeat(80));
  console.log();

  // Step 1: Analyze essay context
  console.log('📝 Step 1: Analyzing essay context...');
  const essayInput: NarrativeEssayInput = {
    essayText: LEGO_ESSAY,
    essayType: 'uc_piq'
  };

  const voice = await analyzeVoiceFingerprint(LEGO_ESSAY);
  const holistic = await analyzeHolisticUnderstanding(essayInput);

  console.log(`   Voice: ${voice.tone}`);
  console.log(`   Theme: ${holistic.centralTheme}`);
  console.log();

  // Step 2: Test each locator
  console.log('🔧 Step 2: Testing surgical fixes with validation...');
  console.log();

  const results: any[] = [];
  const metrics: QualityMetrics = {
    rationale: {
      averageLength: 0,
      minLength: Infinity,
      maxLength: 0,
      hasEducationalKeywords: 0,
      usesIChanged: 0,
      usesVagueLanguage: 0
    },
    suggestions: {
      containsBannedTerms: 0,
      containsPassiveVoice: 0,
      containsGenericDetermination: 0,
      averageQualityScore: 0
    },
    retries: {
      totalAttempts: 0,
      successfulFirstTry: 0,
      requiredRetry: 0,
      failedAllAttempts: 0
    }
  };

  for (let i = 0; i < TEST_LOCATORS.length; i++) {
    const locator = TEST_LOCATORS[i];

    console.log(`\n[${ i + 1}/${TEST_LOCATORS.length}] Testing: "${locator.quote.substring(0, 50)}..."`);
    console.log(`    Category: ${locator.rubricCategory}`);

    const workshopItem = await generateSurgicalFixes(
      locator,
      voice,
      LEGO_ESSAY,
      holistic,
      50 // medium score
    );

    console.log(`    Generated ${workshopItem.suggestions.length} suggestions`);

    // Analyze each suggestion
    workshopItem.suggestions.forEach((suggestion, idx) => {
      console.log(`\n    Suggestion ${idx + 1} [${suggestion.type}]:`);
      console.log(`      Text: "${suggestion.text.substring(0, 60)}..."`);

      const rationaleAnalysis = analyzeRationaleQuality(suggestion.rationale);
      const textAnalysis = analyzeTextQuality(suggestion.text);

      console.log(`      Rationale Length: ${rationaleAnalysis.length} words`);
      console.log(`      Educational: ${rationaleAnalysis.hasEducationalKeywords ? '✅' : '❌'}`);
      console.log(`      Uses "I changed": ${rationaleAnalysis.usesIChanged ? '❌' : '✅'}`);
      console.log(`      Text Quality: ${!textAnalysis.hasBannedTerms && !textAnalysis.hasGenericDetermination ? '✅' : '⚠️'}`);

      // Update metrics
      metrics.rationale.averageLength += rationaleAnalysis.length;
      metrics.rationale.minLength = Math.min(metrics.rationale.minLength, rationaleAnalysis.length);
      metrics.rationale.maxLength = Math.max(metrics.rationale.maxLength, rationaleAnalysis.length);

      if (rationaleAnalysis.hasEducationalKeywords) metrics.rationale.hasEducationalKeywords++;
      if (rationaleAnalysis.usesIChanged) metrics.rationale.usesIChanged++;
      if (rationaleAnalysis.usesVagueLanguage) metrics.rationale.usesVagueLanguage++;

      if (textAnalysis.hasBannedTerms) metrics.suggestions.containsBannedTerms++;
      if (textAnalysis.hasPassiveVoice) metrics.suggestions.containsPassiveVoice++;
      if (textAnalysis.hasGenericDetermination) metrics.suggestions.containsGenericDetermination++;
    });

    results.push({
      locator: locator.quote.substring(0, 50),
      workshopItem
    });
  }

  // Calculate final metrics
  const totalSuggestions = results.reduce((sum, r) => sum + r.workshopItem.suggestions.length, 0);
  metrics.rationale.averageLength = metrics.rationale.averageLength / totalSuggestions;

  // Step 3: Display final report
  console.log();
  console.log('='.repeat(80));
  console.log('QUALITY METRICS REPORT');
  console.log('='.repeat(80));
  console.log();

  console.log('📊 RATIONALE QUALITY:');
  console.log(`   Average Length: ${metrics.rationale.averageLength.toFixed(1)} words`);
  console.log(`   Min/Max Length: ${metrics.rationale.minLength} / ${metrics.rationale.maxLength} words`);
  console.log(`   Educational: ${metrics.rationale.hasEducationalKeywords}/${totalSuggestions} (${(metrics.rationale.hasEducationalKeywords/totalSuggestions*100).toFixed(0)}%)`);
  console.log(`   Uses "I changed": ${metrics.rationale.usesIChanged}/${totalSuggestions} (${(metrics.rationale.usesIChanged/totalSuggestions*100).toFixed(0)}%)`);
  console.log(`   Uses vague language: ${metrics.rationale.usesVagueLanguage}/${totalSuggestions} (${(metrics.rationale.usesVagueLanguage/totalSuggestions*100).toFixed(0)}%)`);
  console.log();

  console.log('🎯 SUGGESTION QUALITY:');
  console.log(`   Contains banned terms: ${metrics.suggestions.containsBannedTerms}/${totalSuggestions} (${(metrics.suggestions.containsBannedTerms/totalSuggestions*100).toFixed(0)}%)`);
  console.log(`   Contains passive voice: ${metrics.suggestions.containsPassiveVoice}/${totalSuggestions} (${(metrics.suggestions.containsPassiveVoice/totalSuggestions*100).toFixed(0)}%)`);
  console.log(`   Contains generic determination: ${metrics.suggestions.containsGenericDetermination}/${totalSuggestions} (${(metrics.suggestions.containsGenericDetermination/totalSuggestions*100).toFixed(0)}%)`);
  console.log();

  // Success criteria
  console.log('✅ SUCCESS CRITERIA:');
  const criteriaResults = [
    {
      criteria: 'Average rationale length >= 30 words',
      passed: metrics.rationale.averageLength >= 30,
      value: `${metrics.rationale.averageLength.toFixed(1)} words`
    },
    {
      criteria: 'Educational rationales >= 80%',
      passed: (metrics.rationale.hasEducationalKeywords / totalSuggestions) >= 0.8,
      value: `${(metrics.rationale.hasEducationalKeywords/totalSuggestions*100).toFixed(0)}%`
    },
    {
      criteria: 'No "I changed" language',
      passed: metrics.rationale.usesIChanged === 0,
      value: `${metrics.rationale.usesIChanged}/${totalSuggestions}`
    },
    {
      criteria: 'No banned terms in suggestions',
      passed: metrics.suggestions.containsBannedTerms === 0,
      value: `${metrics.suggestions.containsBannedTerms}/${totalSuggestions}`
    },
    {
      criteria: 'Minimal passive voice (<20%)',
      passed: (metrics.suggestions.containsPassiveVoice / totalSuggestions) < 0.2,
      value: `${(metrics.suggestions.containsPassiveVoice/totalSuggestions*100).toFixed(0)}%`
    }
  ];

  criteriaResults.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`   ${icon} ${result.criteria}: ${result.value}`);
  });

  const allPassed = criteriaResults.every(r => r.passed);
  console.log();
  console.log(`Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  console.log();

  // Save detailed results
  const outputPath = 'TEST_OUTPUT_PHASE_14_15.json';
  fs.writeFileSync(outputPath, JSON.stringify({ results, metrics, criteriaResults }, null, 2));
  console.log(`📄 Detailed results saved to: ${outputPath}`);
  console.log();
}

// Run the test
runPhase14_15_Test().catch(console.error);
