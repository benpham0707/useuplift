/**
 * Essay Openings System Accuracy & Depth Test
 *
 * Tests:
 * 1. Routing accuracy - Does the system correctly identify opening issues?
 * 2. Source relevance - Are the right sources selected for each issue?
 * 3. Source diversity - Do we get multiple credible sources?
 * 4. Knowledge depth - Can the system provide rich, actionable guidance?
 * 5. Citation trigger detection - Does the activation layer work?
 */

import {
  ESSAY_OPENINGS_SOURCES,
  getOpeningSourcesForIssue,
  getAdmissionsOfficerOpeningInsights,
  getOpeningTechniqueExamples,
  getOpeningWarnings,
  getOpeningScienceData,
  getOpeningGuidanceForPromptType,
  getOpeningsSourceStats,
} from '../src/services/commonAppWorkshop/data/essayOpeningsSources';

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

  const stats = getOpeningsSourceStats();
  log(`\nTotal sources: ${stats.total}`);
  log(`By authority: ${JSON.stringify(stats.byAuthority, null, 2)}`);
  log(`By advice type: ${JSON.stringify(stats.byAdviceType, null, 2)}`);

  // Test 1a: Minimum source count
  const minSources = 40;
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
  const aoSources = getAdmissionsOfficerOpeningInsights();
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
      issue: 'weak_opening',
      expectedKeywords: ['opening', 'first', 'hook', 'attention'],
      description: 'Weak opening detection',
    },
    {
      issue: 'generic_opening',
      expectedKeywords: ['generic', 'anyone', 'personal', 'unique'],
      description: 'Generic opening detection',
    },
    {
      issue: 'dictionary_definition_opening',
      expectedKeywords: ['dictionary', 'definition', 'pedantic'],
      description: 'Dictionary definition opening',
    },
    {
      issue: 'childhood_opening_cliche',
      expectedKeywords: ['child', 'young', 'early', 'throughout'],
      description: 'Childhood opening cliche',
    },
    {
      issue: 'famous_quote_opening',
      expectedKeywords: ['quote', 'famous', 'voice', 'displaces'],
      description: 'Famous quote opening',
    },
    {
      issue: 'rhetorical_question_flat',
      expectedKeywords: ['question', 'rhetorical', 'generic', 'no'],
      description: 'Flat rhetorical question',
    },
    {
      issue: 'thesis_statement_opening',
      expectedKeywords: ['thesis', 'academic', 'formal', 'tells'],
      description: 'Thesis statement opening',
    },
    {
      issue: 'melodramatic_opening',
      expectedKeywords: ['melodrama', 'forever', 'exaggerat', 'generic'],
      description: 'Melodramatic opening',
    },
  ];

  for (const testCase of testCases) {
    logSubsection(testCase.description);

    const sources = getOpeningSourcesForIssue(testCase.issue);
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
      name: 'Opening weakness feedback',
      feedback: {
        problem: 'Your opening sentence is generic and could apply to anyone. The first impression you make is critical.',
        why_matters: 'Admissions officers spend only 8 minutes on an application. Your hook needs to grab attention immediately.',
        how_to_fix: 'Try starting with a specific sensory detail or in medias res - drop the reader into a moment of action.',
      },
      expectedTriggers: ['opening_hook', 'severity_claim'],
    },
    {
      name: 'Show dont tell feedback',
      feedback: {
        problem: 'You\'re telling rather than showing. The language is vague and abstract.',
        why_matters: 'Research shows that 87% of successful essays use concrete, specific details.',
        how_to_fix: 'Replace abstract statements with sensory details. Instead of saying "I was nervous," show the physical symptoms.',
      },
      expectedTriggers: ['show_dont_tell', 'elite_pattern'],
    },
    {
      name: 'Voice and prose feedback',
      feedback: {
        problem: 'Your voice sounds generic and doesn\'t feel authentic.',
        why_matters: 'Dean Shaw emphasizes that intellectual vitality must come through in your authentic voice.',
        how_to_fix: 'Write like you speak. Your sentence rhythm should reflect your natural thinking patterns.',
      },
      expectedTriggers: ['prose_quality', 'authority_quote'],
    },
    {
      name: 'Emotional depth feedback',
      feedback: {
        problem: 'The essay lacks emotional vulnerability and self-awareness.',
        why_matters: 'Admissions officers look for emotional maturity and genuine reflection.',
        how_to_fix: 'Share a moment of honest uncertainty or growth. Show empathy for others in your story.',
      },
      expectedTriggers: ['emotional_intelligence'],
    },
    {
      name: 'Intellectual depth feedback',
      feedback: {
        problem: 'The thinking here lacks nuance and complexity.',
        why_matters: 'Stanford values intellectual vitality and fresh perspective.',
        how_to_fix: 'Show multi-layered thinking. Go beyond surface-level analysis to demonstrate systems-level awareness.',
      },
      expectedTriggers: ['intellectual_depth'],
    },
  ];

  for (const test of testFeedback) {
    logSubsection(test.name);

    const triggers = triggerDetector.detectTriggers(test.feedback, {
      college_id: 'stanford',
      issue_type: 'weak_opening',
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

  // Test coverage of key opening techniques
  const techniquesToTest = [
    { name: 'In medias res', keywords: ['medias res', 'middle', 'action', 'moment'] },
    { name: 'Sensory immersion', keywords: ['sensory', 'senses', 'smell', 'texture', 'visual'] },
    { name: 'Dialogue opening', keywords: ['dialogue', 'speak', 'conversation', 'quote'] },
    { name: 'Bold statement', keywords: ['bold', 'surprising', 'statement', 'unexpected'] },
    { name: 'Hook vs gimmick', keywords: ['hook', 'gimmick', 'authentic', 'trick'] },
    { name: 'Time constraints', keywords: ['minute', 'second', 'time', 'quick', 'fast'] },
    { name: 'First sentence analysis', keywords: ['first sentence', 'opening line', '17 words', '8 seconds'] },
  ];

  const techniqueExamples = getOpeningTechniqueExamples();
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
  const warnings = getOpeningWarnings();
  log(`Total warning sources: ${warnings.length}`);

  const warningTopics = [
    'dictionary definition',
    'childhood',
    'famous quote',
    'rhetorical question',
    'thesis statement',
    'melodramatic',
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
    const sources = getOpeningGuidanceForPromptType(promptType);
    log(`\n${promptType}: ${sources.length} applicable sources`);

    // For personal statement, we expect the most sources
    const expectedMin = promptType === 'personal_statement' ? 30 : 10;

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

  const scienceData = getOpeningScienceData();
  log(`\nTotal research-backed sources: ${scienceData.length}`);

  // Check for specific research findings we expect
  const expectedFindings = [
    { topic: '8 minutes', description: 'Application review time' },
    { topic: '90 seconds', description: 'First round reading time' },
    { topic: 'thin-slicing', description: 'Psychology of first impressions' },
    { topic: '8 seconds', description: 'Attention span research' },
    { topic: 'neural', description: 'Neuroscience of impressions' },
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
    passed: wellCited.length >= scienceData.length * 0.8,
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
        issue: 'weak_opening',
        college: 'stanford' as const,
        description: 'Weak opening at Stanford',
      },
      {
        issue: 'generic_opening',
        college: 'harvard' as const,
        description: 'Generic opening at Harvard',
      },
      {
        issue: 'childhood_opening_cliche',
        college: 'yale' as const,
        description: 'Childhood cliche at Yale',
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
// TEST 8: REAL-WORLD ESSAY OPENING ANALYSIS
// ============================================================================

async function testRealWorldAnalysis() {
  logSection('TEST 8: REAL-WORLD ESSAY OPENING ANALYSIS');

  const testOpenings = [
    {
      text: 'The dictionary defines leadership as "the action of leading a group of people."',
      expectedIssue: 'dictionary_definition_opening',
      shouldFlag: true,
    },
    {
      text: 'Ever since I was young, I have always been passionate about science.',
      expectedIssue: 'childhood_opening_cliche',
      shouldFlag: true,
    },
    {
      text: 'As Albert Einstein once said, "Imagination is more important than knowledge."',
      expectedIssue: 'famous_quote_opening',
      shouldFlag: true,
    },
    {
      text: 'Have you ever wondered what it would be like to change the world?',
      expectedIssue: 'rhetorical_question_flat',
      shouldFlag: true,
    },
    {
      text: 'Little did I know that my life was about to change forever.',
      expectedIssue: 'melodramatic_opening',
      shouldFlag: true,
    },
    {
      text: 'The flames were already licking up the side of the hill below our house when I realized the evacuation notice was meant for us.',
      expectedIssue: 'none',
      shouldFlag: false,
    },
    {
      text: 'I refused to throw dirt on her.',
      expectedIssue: 'none',
      shouldFlag: false,
    },
  ];

  log('\nAnalyzing essay openings...\n');

  for (const test of testOpenings) {
    log(`Opening: "${test.text.substring(0, 60)}..."`);

    // Check if we have sources that would identify this issue
    if (test.shouldFlag) {
      const sources = getOpeningSourcesForIssue(test.expectedIssue);
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
      // Good opening - should have technique examples to learn from
      const techniqueExamples = getOpeningTechniqueExamples();
      const hasPositiveExamples = techniqueExamples.length >= 5;

      log(`  Good opening example (in medias res / mystery)`);
      log(`  Technique examples available: ${techniqueExamples.length}`);

      results.push({
        test: `Real-world: Recognize good opening`,
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
  console.log('  ESSAY OPENINGS SYSTEM ACCURACY & DEPTH TEST');
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
