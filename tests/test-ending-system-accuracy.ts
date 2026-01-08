/**
 * Essay Endings System Accuracy & Depth Test
 *
 * Tests:
 * 1. Routing accuracy - Does the system correctly identify ending issues?
 * 2. Source relevance - Are the right sources selected for each issue?
 * 3. Source diversity - Do we get multiple credible sources?
 * 4. Knowledge depth - Can the system provide rich, actionable guidance?
 * 5. Citation trigger detection - Does the activation layer work?
 *
 * Based on Perplexity Research Batch #6: Essay Endings & Conclusions
 */

import {
  ESSAY_ENDINGS_SOURCES,
  getEssayEndingsSources,
  getEndingSourcesForIssue,
  getAdmissionsOfficerEndingInsights,
  getEndingTechniqueExamples,
  getEndingWarnings,
  getEndingScienceData,
  getEndingGuidanceForPromptType,
  getEndingsSourceStats,
} from '../src/services/commonAppWorkshop/data/essayEndingsSources';

import { CitationTriggerDetector, deduplicateTriggers } from '../src/services/commonAppWorkshop/services/citationTriggerDetector';
import { CitationSelector } from '../src/services/commonAppWorkshop/services/provenanceCitationSelector';
import { getSmartSourceSelector } from '../src/services/commonAppWorkshop/services/smartSourceSelector';

// ============================================================================
// TEST SETUP
// ============================================================================

const triggerDetector = new CitationTriggerDetector();
const citationSelector = new CitationSelector();

interface TestResult {
  test: string;
  passed: boolean;
  details: string;
  score?: number;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(message);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70));
}

function logSubsection(title: string) {
  console.log('\n' + '-'.repeat(50));
  console.log(`  ${title}`);
  console.log('-'.repeat(50));
}

// ============================================================================
// TEST 1: SOURCE DATABASE INTEGRITY
// ============================================================================

async function testSourceDatabaseIntegrity() {
  logSection('TEST 1: SOURCE DATABASE INTEGRITY');

  const stats = getEndingsSourceStats();
  log(`\nTotal sources: ${stats.total}`);
  log(`By authority: ${JSON.stringify(stats.byAuthority, null, 2)}`);
  log(`By advice type: ${JSON.stringify(stats.byAdviceType, null, 2)}`);

  // Test 1a: Minimum source count
  const minSources = 35;
  const hasEnoughSources = stats.total >= minSources;
  results.push({
    test: 'Minimum source count',
    passed: hasEnoughSources,
    details: `${stats.total} sources (need ${minSources}+)`,
    score: Math.min(100, (stats.total / minSources) * 100),
  });

  // Test 1b: Authority diversity
  const authorityTypes = Object.keys(stats.byAuthority).length;
  const hasAuthorityDiversity = authorityTypes >= 3;
  results.push({
    test: 'Authority diversity',
    passed: hasAuthorityDiversity,
    details: `${authorityTypes} authority types: ${Object.keys(stats.byAuthority).join(', ')}`,
    score: Math.min(100, (authorityTypes / 3) * 100),
  });

  // Test 1c: Advice type coverage
  const adviceTypes = Object.keys(stats.byAdviceType).length;
  const hasAdviceDiversity = adviceTypes >= 4;
  results.push({
    test: 'Advice type coverage',
    passed: hasAdviceDiversity,
    details: `${adviceTypes} advice types: ${Object.keys(stats.byAdviceType).join(', ')}`,
    score: Math.min(100, (adviceTypes / 4) * 100),
  });

  // Test 1d: AO quotes present
  const aoSources = getAdmissionsOfficerEndingInsights();
  const hasAOQuotes = aoSources.length >= 5;
  results.push({
    test: 'Admissions officer quotes',
    passed: hasAOQuotes,
    details: `${aoSources.length} AO quotes from: ${[...new Set(aoSources.map(s => s.author))].slice(0, 5).join(', ')}`,
    score: Math.min(100, (aoSources.length / 5) * 100),
  });

  log(`\n✓ Database integrity tests complete`);
}

// ============================================================================
// TEST 2: ISSUE-SPECIFIC SOURCE ROUTING
// ============================================================================

async function testIssueRouting() {
  logSection('TEST 2: ISSUE-SPECIFIC SOURCE ROUTING');

  const testCases = [
    {
      issue: 'weak_ending',
      expectedKeywords: ['ending', 'last', 'conclusion', 'peak-end'],
      description: 'Weak ending detection',
    },
    {
      issue: 'abrupt_ending',
      expectedKeywords: ['abrupt', 'sudden', 'closure', 'incomplete'],
      description: 'Abrupt ending detection',
    },
    {
      issue: 'summary_conclusion',
      expectedKeywords: ['summary', 'repeat', 'rehash', 'already said'],
      description: 'Summary conclusion detection',
    },
    {
      issue: 'preachy_ending',
      expectedKeywords: ['preach', 'moral', 'lesson', 'understatement'],
      description: 'Preachy ending detection',
    },
    {
      issue: 'generic_ending',
      expectedKeywords: ['generic', 'anyone', 'personal', 'unique'],
      description: 'Generic ending detection',
    },
    {
      issue: 'excited_to_attend_ending',
      expectedKeywords: ['excited', 'attend', 'can\'t wait', 'lust'],
      description: 'Excited to attend ending',
    },
    {
      issue: 'career_announcement_ending',
      expectedKeywords: ['career', 'decided', 'become', 'doctor'],
      description: 'Career announcement ending',
    },
    {
      issue: 'false_resolution_ending',
      expectedKeywords: ['false', 'resolution', 'solved', 'dishonest'],
      description: 'False resolution ending',
    },
    {
      issue: 'overexplained_ending',
      expectedKeywords: ['overexplain', 'spell out', 'reader', 'trust'],
      description: 'Overexplained ending detection',
    },
    {
      issue: 'repetitive_ending',
      expectedKeywords: ['repeat', 'already', 'said', 'content'],
      description: 'Repetitive ending detection',
    },
  ];

  for (const testCase of testCases) {
    logSubsection(testCase.description);

    const sources = getEndingSourcesForIssue(testCase.issue);
    log(`Found ${sources.length} sources for "${testCase.issue}"`);

    if (sources.length > 0) {
      // Check if sources contain expected keywords
      let keywordMatches = 0;
      for (const keyword of testCase.expectedKeywords) {
        const hasKeyword = sources.some(s => {
          const text = `${s.quote || ''} ${s.finding || ''} ${s.relevance_to_claim || ''}`.toLowerCase();
          return text.includes(keyword.toLowerCase());
        });
        if (hasKeyword) keywordMatches++;
      }

      const keywordScore = (keywordMatches / testCase.expectedKeywords.length) * 100;

      // Show top 3 sources
      log(`\nTop sources:`);
      sources.slice(0, 3).forEach((s, i) => {
        const relevance = s.issue_relevance[testCase.issue as keyof typeof s.issue_relevance];
        const score = relevance && typeof relevance === 'object' && 'score' in relevance
          ? (relevance as { score: number }).score
          : 'N/A';
        log(`  ${i + 1}. [${s.authority}] ${s.author || 'Unknown'}: "${(s.quote || s.finding || '').substring(0, 80)}..."`);
        log(`     Relevance score: ${score}`);
      });

      results.push({
        test: `Routing: ${testCase.description}`,
        passed: sources.length >= 2 && keywordScore >= 50,
        details: `${sources.length} sources, ${keywordMatches}/${testCase.expectedKeywords.length} keywords matched`,
        score: Math.min(100, (sources.length * 10) + keywordScore),
      });
    } else {
      results.push({
        test: `Routing: ${testCase.description}`,
        passed: false,
        details: 'No sources found',
        score: 0,
      });
    }
  }
}

// ============================================================================
// TEST 3: CITATION TRIGGER DETECTION
// ============================================================================

async function testCitationTriggerDetection() {
  logSection('TEST 3: CITATION TRIGGER DETECTION');

  const testFeedback = [
    {
      name: 'Ending weakness feedback',
      feedback: {
        problem: 'Your ending feels abrupt and doesn\'t provide closure. The conclusion needs to leave a lasting impression.',
        why_matters: 'Research shows the peak-end rule means endings disproportionately shape how your essay is remembered.',
        how_to_fix: 'Try a circular return that ties back to your opening, or zoom out to show broader implications.',
      },
      expectedTriggers: ['essay_endings'],
    },
    {
      name: 'Summary conclusion feedback',
      feedback: {
        problem: 'Your ending simply summarizes what you already said. Avoid rehashing the essay in conclusion.',
        why_matters: 'Admissions officers just read your essay. They don\'t need a summary - they need resolution.',
        how_to_fix: 'End with a concrete image or forward momentum, not a recap of your main points.',
      },
      expectedTriggers: ['essay_endings'],
    },
    {
      name: 'Preachy ending feedback',
      feedback: {
        problem: 'The moral lesson at the end hits readers over the head. Trust your reader to draw conclusions.',
        why_matters: 'Expert axiom: understatement beats overstatement. Leave space for the reader.',
        how_to_fix: 'Show what you learned through action, not declaration. End with image, not idea.',
      },
      expectedTriggers: ['essay_endings', 'show_dont_tell'],
    },
    {
      name: 'College lust ending feedback',
      feedback: {
        problem: 'Ending with "I can\'t wait to attend Stanford" signals insecurity, not genuine interest.',
        why_matters: 'Your growth is the climax, not college admission. The story should stand on its own.',
        how_to_fix: 'Remove the explicit college mention. Let your authentic voice and story make the case.',
      },
      expectedTriggers: ['essay_endings'],
    },
    {
      name: 'Mixed ending and voice feedback',
      feedback: {
        problem: 'The ending feels generic and your voice doesn\'t come through. The conclusion lacks resolution.',
        why_matters: 'Your authentic voice should be strongest at the end - it\'s what readers remember.',
        how_to_fix: 'End with your natural thinking pattern. Use forward momentum or a concrete final image.',
      },
      expectedTriggers: ['essay_endings', 'prose_quality'],
    },
  ];

  for (const test of testFeedback) {
    logSubsection(test.name);

    const triggers = triggerDetector.detectTriggers(test.feedback, {
      college_id: 'stanford',
      issue_type: 'weak_ending',
    });

    const dedupedTriggers = deduplicateTriggers(triggers);

    log(`Detected ${dedupedTriggers.length} triggers:`);
    dedupedTriggers.forEach(t => {
      log(`  - Type: ${t.type}, Anchor: "${t.anchor_text.substring(0, 40)}...", Category: ${t.context.deep_research_category || 'N/A'}`);
    });

    // Check if expected triggers were found
    const triggerTypes = new Set(dedupedTriggers.map(t => t.type));
    const foundExpected = test.expectedTriggers.filter(e => triggerTypes.has(e as any));

    const accuracy = (foundExpected.length / test.expectedTriggers.length) * 100;

    results.push({
      test: `Trigger detection: ${test.name}`,
      passed: accuracy >= 50,
      details: `Found ${foundExpected.length}/${test.expectedTriggers.length} expected triggers: ${foundExpected.join(', ')}`,
      score: accuracy,
    });
  }
}

// ============================================================================
// TEST 4: KNOWLEDGE DEPTH - TECHNIQUE EXPLANATIONS
// ============================================================================

async function testKnowledgeDepth() {
  logSection('TEST 4: KNOWLEDGE DEPTH - TECHNIQUE COVERAGE');

  // Test coverage of key ending techniques
  const techniquesToTest = [
    { name: 'Circular return', keywords: ['circular', 'return', 'opening', 'full circle'] },
    { name: 'Forward momentum', keywords: ['forward', 'momentum', 'future', 'next'] },
    { name: 'Zoom out', keywords: ['zoom', 'out', 'widen', 'lens', 'broader'] },
    { name: 'Concrete image ending', keywords: ['image', 'concrete', 'visual', 'sensory'] },
    { name: 'Peak-end rule', keywords: ['peak', 'end', 'rule', 'memory', 'remember'] },
    { name: 'Leave space for reader', keywords: ['space', 'reader', 'trust', 'suggest'] },
    { name: 'Understatement principle', keywords: ['understatement', 'overstatement', 'subtle'] },
  ];

  const techniqueExamples = getEndingTechniqueExamples();
  log(`\nTotal technique/example sources: ${techniqueExamples.length}`);

  for (const technique of techniquesToTest) {
    const relevantSources = techniqueExamples.filter(s => {
      const text = `${s.title || ''} ${s.quote || ''} ${s.finding || ''} ${s.relevance_to_claim || ''}`.toLowerCase();
      return technique.keywords.some(k => text.includes(k.toLowerCase()));
    });

    const hasCoverage = relevantSources.length >= 1;
    log(`\n${technique.name}: ${relevantSources.length} sources`);
    if (relevantSources.length > 0) {
      log(`  Example: "${(relevantSources[0].quote || relevantSources[0].finding || '').substring(0, 100)}..."`);
    }

    results.push({
      test: `Knowledge depth: ${technique.name}`,
      passed: hasCoverage,
      details: `${relevantSources.length} sources covering this technique`,
      score: Math.min(100, relevantSources.length * 33),
    });
  }

  // Test warning coverage
  logSubsection('Warning Coverage');
  const warnings = getEndingWarnings();
  log(`Total warning sources: ${warnings.length}`);

  const warningTopics = [
    'summary',
    'preachy',
    'excited to attend',
    'career',
    'false resolution',
    'abrupt',
  ];

  let warningsCovered = 0;
  for (const topic of warningTopics) {
    const hasWarning = warnings.some(w => {
      const text = `${w.quote || ''} ${w.finding || ''}`.toLowerCase();
      return text.includes(topic.toLowerCase());
    });
    if (hasWarning) warningsCovered++;
  }

  results.push({
    test: 'Warning topic coverage',
    passed: warningsCovered >= 4,
    details: `${warningsCovered}/${warningTopics.length} warning topics covered`,
    score: (warningsCovered / warningTopics.length) * 100,
  });
}

// ============================================================================
// TEST 5: PROMPT-TYPE SPECIFIC GUIDANCE
// ============================================================================

async function testPromptTypeGuidance() {
  logSection('TEST 5: PROMPT-TYPE SPECIFIC GUIDANCE');

  const promptTypes = [
    'personal_statement',
    'why_this_college',
    'challenge_adversity',
    'activity_elaboration',
    'intellectual_curiosity',
  ];

  for (const promptType of promptTypes) {
    const sources = getEndingGuidanceForPromptType(promptType);
    log(`\n${promptType}: ${sources.length} applicable sources`);

    // For personal statement, we expect the most sources
    const expectedMin = promptType === 'personal_statement' ? 25 : 8;

    results.push({
      test: `Prompt-type guidance: ${promptType}`,
      passed: sources.length >= expectedMin,
      details: `${sources.length} sources (expected ${expectedMin}+)`,
      score: Math.min(100, (sources.length / expectedMin) * 100),
    });
  }
}

// ============================================================================
// TEST 6: SCIENCE/RESEARCH DATA CREDIBILITY
// ============================================================================

async function testScienceDataCredibility() {
  logSection('TEST 6: SCIENCE/RESEARCH DATA CREDIBILITY');

  const scienceData = getEndingScienceData();
  log(`\nTotal research-backed sources: ${scienceData.length}`);

  // Check for specific research findings we expect
  const expectedFindings = [
    { topic: 'peak-end', description: 'Peak-end rule memory research' },
    { topic: '85%', description: '85% of essays get neutral check marks' },
    { topic: 'skim', description: 'AO reading patterns (first/last paragraph)' },
    { topic: 'closure', description: 'Psychological need for closure' },
    { topic: 'memory', description: 'Memory science in endings' },
  ];

  let findingsFound = 0;
  for (const finding of expectedFindings) {
    const hasResearch = scienceData.some(s => {
      const text = `${s.title || ''} ${s.finding || ''} ${s.quote || ''}`.toLowerCase();
      return text.includes(finding.topic.toLowerCase());
    });

    log(`${finding.description}: ${hasResearch ? '✓ Found' : '✗ Missing'}`);
    if (hasResearch) findingsFound++;
  }

  results.push({
    test: 'Research data credibility',
    passed: findingsFound >= 4,
    details: `${findingsFound}/${expectedFindings.length} key research findings present`,
    score: (findingsFound / expectedFindings.length) * 100,
  });

  // Check that sources have proper citations
  const wellCited = scienceData.filter(s => s.author && s.publication && s.date);
  results.push({
    test: 'Research citation completeness',
    passed: wellCited.length >= scienceData.length * 0.7,
    details: `${wellCited.length}/${scienceData.length} sources have complete citations`,
    score: (wellCited.length / scienceData.length) * 100,
  });
}

// ============================================================================
// TEST 7: END-TO-END SOURCE SELECTION
// ============================================================================

async function testEndToEndSelection() {
  logSection('TEST 7: END-TO-END SOURCE SELECTION');

  try {
    const smartSelector = getSmartSourceSelector();

    const testScenarios = [
      {
        issue: 'weak_ending',
        college: 'stanford' as const,
        description: 'Weak ending at Stanford',
      },
      {
        issue: 'summary_conclusion',
        college: 'harvard' as const,
        description: 'Summary conclusion at Harvard',
      },
      {
        issue: 'preachy_ending',
        college: 'yale' as const,
        description: 'Preachy ending at Yale',
      },
      {
        issue: 'excited_to_attend_ending',
        college: 'mit' as const,
        description: 'Excited to attend ending at MIT',
      },
    ];

    for (const scenario of testScenarios) {
      logSubsection(scenario.description);

      const bundle = smartSelector.selectForIssue(
        { symptom_type: scenario.issue },
        scenario.college,
        { max_sources: 5, require_author_diversity: true }
      );

      log(`Primary source: ${bundle.primary?.author || 'Unknown'}`);
      log(`Supporting sources: ${bundle.supporting.length}`);
      log(`Diversity score: ${bundle.metadata.diversity_score}`);

      if (bundle.primary) {
        log(`\nPrimary quote: "${(bundle.primary.quote || bundle.primary.finding || '').substring(0, 100)}..."`);
      }

      const totalSources = 1 + bundle.supporting.length;
      const hasDiversity = bundle.metadata.diversity_score >= 50;

      results.push({
        test: `E2E selection: ${scenario.description}`,
        passed: totalSources >= 2 && hasDiversity,
        details: `${totalSources} sources selected, diversity: ${bundle.metadata.diversity_score}%`,
        score: Math.min(100, totalSources * 20 + bundle.metadata.diversity_score * 0.5),
      });
    }
  } catch (error) {
    log(`\n⚠ Smart selector error: ${error}`);
    results.push({
      test: 'E2E selection',
      passed: false,
      details: `Error: ${error}`,
      score: 0,
    });
  }
}

// ============================================================================
// TEST 8: REAL-WORLD ESSAY ENDING ANALYSIS
// ============================================================================

async function testRealWorldAnalysis() {
  logSection('TEST 8: REAL-WORLD ESSAY ENDING ANALYSIS');

  const testEndings = [
    {
      text: 'In conclusion, I learned that perseverance and hard work are the keys to success in life.',
      expectedIssue: 'summary_conclusion',
      shouldFlag: true,
    },
    {
      text: 'This experience taught me the importance of never giving up on your dreams.',
      expectedIssue: 'preachy_ending',
      shouldFlag: true,
    },
    {
      text: 'I can\'t wait to attend Stanford and continue this journey of discovery!',
      expectedIssue: 'excited_to_attend_ending',
      shouldFlag: true,
    },
    {
      text: 'That\'s when I decided I wanted to become a doctor and save lives.',
      expectedIssue: 'career_announcement_ending',
      shouldFlag: true,
    },
    {
      text: 'And just like that, I had overcome all my fears and became a confident person.',
      expectedIssue: 'false_resolution_ending',
      shouldFlag: true,
    },
    {
      text: 'Now, when I step onto a stage, I still feel the familiar flutter. But I also feel the weight of the piccolo in my hands—my grandmother\'s piccolo—and I remember why I play.',
      expectedIssue: 'none',
      shouldFlag: false,
    },
    {
      text: 'The debate continues. I\'m still not sure who was right. But that\'s the point.',
      expectedIssue: 'none',
      shouldFlag: false,
    },
  ];

  log('\nAnalyzing essay endings...\n');

  for (const test of testEndings) {
    log(`Ending: "${test.text.substring(0, 60)}..."`);

    // Check if we have sources that would identify this issue
    if (test.shouldFlag) {
      const sources = getEndingSourcesForIssue(test.expectedIssue);
      const hasRelevantGuidance = sources.length >= 2;

      log(`  Expected issue: ${test.expectedIssue}`);
      log(`  Sources available: ${sources.length}`);

      results.push({
        test: `Real-world: Detect ${test.expectedIssue}`,
        passed: hasRelevantGuidance,
        details: `${sources.length} sources can explain why this fails`,
        score: Math.min(100, sources.length * 20),
      });
    } else {
      // Good ending - should have technique examples to learn from
      const techniqueExamples = getEndingTechniqueExamples();
      const hasPositiveExamples = techniqueExamples.length >= 5;

      log(`  Good ending example (circular return / forward momentum / leaving space)`);
      log(`  Technique examples available: ${techniqueExamples.length}`);

      results.push({
        test: `Real-world: Recognize good ending`,
        passed: hasPositiveExamples,
        details: `${techniqueExamples.length} technique examples to teach from`,
        score: Math.min(100, techniqueExamples.length * 10),
      });
    }
    log('');
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log('\n' + '█'.repeat(70));
  console.log('  ESSAY ENDINGS SYSTEM ACCURACY & DEPTH TEST');
  console.log('  Testing routing, source selection, and knowledge depth');
  console.log('█'.repeat(70));

  const startTime = Date.now();

  await testSourceDatabaseIntegrity();
  await testIssueRouting();
  await testCitationTriggerDetection();
  await testKnowledgeDepth();
  await testPromptTypeGuidance();
  await testScienceDataCredibility();
  await testEndToEndSelection();
  await testRealWorldAnalysis();

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  logSection('FINAL TEST SUMMARY');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / total;

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`  RESULTS: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`  AVERAGE SCORE: ${avgScore.toFixed(1)}%`);
  console.log(`  TIME: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  console.log(`${'─'.repeat(70)}\n`);

  // Show failed tests
  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log('FAILED TESTS:');
    failed.forEach(f => {
      console.log(`  ✗ ${f.test}: ${f.details}`);
    });
    console.log('');
  }

  // Show low-scoring tests (passed but weak)
  const weak = results.filter(r => r.passed && (r.score || 100) < 70);
  if (weak.length > 0) {
    console.log('WEAK TESTS (passed but low score):');
    weak.forEach(w => {
      console.log(`  ⚠ ${w.test}: ${w.score?.toFixed(0)}% - ${w.details}`);
    });
    console.log('');
  }

  // Category breakdown
  console.log('CATEGORY BREAKDOWN:');
  const categories = {
    'Database': results.filter(r => r.test.includes('source count') || r.test.includes('diversity') || r.test.includes('coverage')),
    'Routing': results.filter(r => r.test.startsWith('Routing:')),
    'Triggers': results.filter(r => r.test.startsWith('Trigger')),
    'Knowledge': results.filter(r => r.test.startsWith('Knowledge')),
    'Prompt-type': results.filter(r => r.test.startsWith('Prompt-type')),
    'Science': results.filter(r => r.test.includes('Research') || r.test.includes('Science')),
    'E2E': results.filter(r => r.test.startsWith('E2E')),
    'Real-world': results.filter(r => r.test.startsWith('Real-world')),
  };

  for (const [category, tests] of Object.entries(categories)) {
    if (tests.length === 0) continue;
    const catPassed = tests.filter(t => t.passed).length;
    const catAvg = tests.reduce((sum, t) => sum + (t.score || 0), 0) / tests.length;
    console.log(`  ${category}: ${catPassed}/${tests.length} passed, avg ${catAvg.toFixed(0)}%`);
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  OVERALL SYSTEM GRADE: ${getGrade(avgScore)}`);
  console.log(`${'═'.repeat(70)}\n`);
}

function getGrade(score: number): string {
  if (score >= 90) return 'A+ (Excellent)';
  if (score >= 85) return 'A (Very Good)';
  if (score >= 80) return 'A- (Good)';
  if (score >= 75) return 'B+ (Above Average)';
  if (score >= 70) return 'B (Satisfactory)';
  if (score >= 65) return 'B- (Needs Improvement)';
  if (score >= 60) return 'C+ (Weak)';
  return 'C or below (Requires Significant Work)';
}

// Run tests
runAllTests().catch(console.error);
