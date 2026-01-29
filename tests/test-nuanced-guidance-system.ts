/**
 * Test: Nuanced Guidance System
 *
 * Tests the new context-aware technique recommendation system that goes
 * beyond defaulting to storytelling. Verifies that:
 *
 * 1. Essay elements are correctly detected
 * 2. Technique recommendations vary by essay type and element
 * 3. Storytelling is NOT recommended when overused
 * 4. Non-narrative techniques are properly recommended
 * 5. Decision tree produces actionable guidance
 */

import {
  essayElementDetector,
  techniqueDecisionTree,
  getRecommendedTechnique,
  isStorytellingOverused,
  getMissingTechniques,
  TECHNIQUE_BUNDLES,
  TECHNIQUE_PRIORITIES_BY_TYPE,
} from '../src/services/commonAppWorkshop/services';
import type {
  TechniqueCategory,
  EssayElement,
} from '../src/services/commonAppWorkshop/services';
import { detectPhrasePatterns } from '../src/services/commonAppWorkshop/rubrics/issueDetectionPatterns';

// ============================================================================
// TEST DATA
// ============================================================================

const SAMPLE_ESSAYS = {
  // Over-narrated extracurricular essay - has story, lacks evidence
  over_narrated_ec: `The gym doors swung open and the smell of sweat hit me. I walked in nervous but determined.
My coach stood there with arms crossed. "You're late," she said. I apologized and joined the warmup.
That practice changed everything. The weights felt heavier than ever. My muscles screamed.
But I kept pushing. Rep after rep. Set after set. Until finally, I collapsed on the mat.
My teammate helped me up. "That was intense," she said with a grin. I grinned back.
This is why I love fitness - the community, the challenge, the growth.`,

  // Why Us essay missing specificity - generic fit claims
  generic_why_us: `I want to attend Stanford because of its excellent reputation and world-class faculty.
The collaborative environment would help me grow as a student and person.
I've always been impressed by the research opportunities and the beautiful campus.
The diverse student body would expose me to new perspectives.
I believe Stanford is the perfect fit for my academic and personal goals.
I hope to contribute to the vibrant community and learn from the best professors.`,

  // Why Major essay with passion but no technical depth
  no_technical_depth: `I am passionate about computer science because technology fascinates me.
Ever since I was young, I have loved using computers and learning about how they work.
I want to study computer science to create programs that help people.
The field is growing rapidly and offers many career opportunities.
I enjoy problem-solving and believe coding is like a puzzle to be solved.
I look forward to learning more about artificial intelligence and software development.`,

  // Shallow reflection essay - generic lessons
  shallow_reflection: `This experience taught me the importance of hard work and perseverance.
I learned that teamwork is essential for success and that I should never give up.
It showed me that anything is possible if you believe in yourself.
The experience made me a better person and helped me appreciate what I have.
I realized the value of dedication and the importance of helping others.
Through this, I learned to follow my dreams and work together with my team.`,

  // Good balanced essay for comparison
  well_balanced: `The Western blot failed for the third time. I stared at the empty bands where protein should have been.
My mentor suggested I try a different antibody concentration - our protocol was optimized for rat, not mouse tissue.
Recalibrating took two weeks, but it also taught me something unexpected: protocols need validation, not just replication.
That insight changed how I approach any experimental procedure. I now question what I'm told works.
This skepticism led me to discover that 40% of our lab's archived data had been collected with suboptimal conditions.
I proposed a systematic review, which three other undergrads have now joined. We've flagged 23 experiments for re-evaluation.`,
};

// ============================================================================
// TEST HELPERS
// ============================================================================

function logTestResult(name: string, passed: boolean, details?: string) {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}${details ? ` - ${details}` : ''}`);
}

function assertNotStorytelling(technique: TechniqueCategory, context: string): boolean {
  const isStorytelling = technique === 'storytelling';
  if (isStorytelling) {
    console.log(`   ⚠️  Got 'storytelling' when non-narrative expected (${context})`);
  }
  return !isStorytelling;
}

// ============================================================================
// TESTS
// ============================================================================

async function testEssayElementDetection() {
  console.log('\n📍 TEST: Essay Element Detection\n');

  const essay = SAMPLE_ESSAYS.well_balanced;

  // Test opening detection
  const openingPassage = essay.split('.')[0] + '.';
  const openingAnalysis = essayElementDetector.detectElement(
    openingPassage,
    'extracurricular',
    { fullEssay: essay, passagePosition: 'start' }
  );

  logTestResult(
    'Opening detected as opening_hook or context_setup',
    ['opening_hook', 'context_setup', 'action_body'].includes(openingAnalysis.element),
    `Got: ${openingAnalysis.element} (confidence: ${openingAnalysis.confidence.toFixed(2)})`
  );

  // Test reflection detection
  const reflectionPassage = 'That insight changed how I approach any experimental procedure. I now question what I\'m told works.';
  const reflectionAnalysis = essayElementDetector.detectElement(
    reflectionPassage,
    'extracurricular',
    { fullEssay: essay, passagePosition: 'middle' }
  );

  logTestResult(
    'Reflection passage detected correctly',
    ['reflection_moment', 'insight_revelation'].includes(reflectionAnalysis.element),
    `Got: ${reflectionAnalysis.element}`
  );

  // Test evidence detection
  const evidencePassage = 'We\'ve flagged 23 experiments for re-evaluation.';
  const evidenceAnalysis = essayElementDetector.detectElement(
    evidencePassage,
    'extracurricular',
    { fullEssay: essay, passagePosition: 'late' }
  );

  logTestResult(
    'Evidence passage detected correctly',
    ['evidence_section', 'action_body'].includes(evidenceAnalysis.element),
    `Got: ${evidenceAnalysis.element}`
  );
}

async function testFullStructureAnalysis() {
  console.log('\n📊 TEST: Full Structure Analysis\n');

  // Analyze over-narrated essay
  const overNarratedStructure = essayElementDetector.analyzeFullStructure(
    SAMPLE_ESSAYS.over_narrated_ec,
    'extracurricular'
  );

  logTestResult(
    'Over-narrated essay detected as narrative_heavy or front_loaded',
    ['narrative_heavy', 'front_loaded', 'balanced'].includes(overNarratedStructure.overallPattern),
    `Got pattern: ${overNarratedStructure.overallPattern}`
  );

  logTestResult(
    'High storytelling percentage detected',
    overNarratedStructure.balanceAnalysis.storytellingPercent >= 40,
    `Storytelling: ${overNarratedStructure.balanceAnalysis.storytellingPercent}%`
  );

  // Check recommendations
  const hasEvidenceRec = overNarratedStructure.recommendations.some(
    r => r.recommendedApproach.includes('evidence') || r.recommendedApproach.includes('metrics')
  );

  logTestResult(
    'Recommends adding evidence to over-narrated essay',
    hasEvidenceRec,
    `Recommendations: ${overNarratedStructure.recommendations.map(r => r.recommendedApproach).join(', ')}`
  );

  // Analyze well-balanced essay
  const balancedStructure = essayElementDetector.analyzeFullStructure(
    SAMPLE_ESSAYS.well_balanced,
    'extracurricular'
  );

  logTestResult(
    'Well-balanced essay has fewer critical gaps',
    balancedStructure.recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length <= 2,
    `High-priority recs: ${balancedStructure.recommendations.filter(r => r.priority === 'high').length}`
  );
}

async function testStorytellingOveruseDetection() {
  console.log('\n🔄 TEST: Storytelling Overuse Detection\n');

  // Test with heavy storytelling existing techniques
  const heavyStorytelling: TechniqueCategory[] = ['storytelling', 'storytelling', 'storytelling'];

  logTestResult(
    'Detects storytelling overuse with 3x storytelling',
    isStorytellingOverused(heavyStorytelling, 'extracurricular'),
    `isStorytellingOverused: ${isStorytellingOverused(heavyStorytelling, 'extracurricular')}`
  );

  // Test with mixed techniques
  const mixedTechniques: TechniqueCategory[] = ['storytelling', 'evidence_impact', 'reflection_depth'];

  logTestResult(
    'Does NOT flag mixed techniques as overused',
    !isStorytellingOverused(mixedTechniques, 'extracurricular'),
    `isStorytellingOverused: ${isStorytellingOverused(mixedTechniques, 'extracurricular')}`
  );

  // Test essay-type specific thresholds
  const whyUsStorytelling: TechniqueCategory[] = ['storytelling', 'storytelling'];

  logTestResult(
    'Flags lower threshold for why_us essays',
    isStorytellingOverused(whyUsStorytelling, 'why_us'),
    `why_us with 2x storytelling: ${isStorytellingOverused(whyUsStorytelling, 'why_us')}`
  );
}

async function testTechniqueRecommendations() {
  console.log('\n🎯 TEST: Technique Recommendations\n');

  // Test 1: Why Us essay should NOT default to storytelling
  const whyUsRec = getRecommendedTechnique(
    'why_us',
    'connection_bridge',
    ['storytelling']
  );

  logTestResult(
    'Why Us connection_bridge recommends specificity, not storytelling',
    assertNotStorytelling(whyUsRec.category, 'why_us connection_bridge'),
    `Recommended: ${whyUsRec.category}`
  );

  // Test 2: Intellectual essay should recommend intellectual_character
  const intellectualRec = getRecommendedTechnique(
    'intellectual',
    'opening_hook',
    []
  );

  logTestResult(
    'Intellectual essay opening recommends intellectual_character',
    ['intellectual_character', 'voice_authenticity'].includes(intellectualRec.category),
    `Recommended: ${intellectualRec.category}`
  );

  // Test 3: Extracurricular with existing story should recommend evidence
  const ecWithStoryRec = getRecommendedTechnique(
    'extracurricular',
    'action_body',
    ['storytelling', 'storytelling']
  );

  logTestResult(
    'EC with existing stories recommends evidence or technical depth',
    ['evidence_impact', 'technical_depth', 'reflection_depth'].includes(ecWithStoryRec.category),
    `Recommended: ${ecWithStoryRec.category}`
  );

  // Test 4: Evidence section should NOT recommend more storytelling
  const evidenceSectionRec = getRecommendedTechnique(
    'leadership',
    'evidence_section',
    []
  );

  logTestResult(
    'Evidence section recommends evidence_impact',
    evidenceSectionRec.category === 'evidence_impact',
    `Recommended: ${evidenceSectionRec.category}`
  );
}

async function testDecisionTreeDecisions() {
  console.log('\n🌳 TEST: Decision Tree Full Decisions\n');

  // Test 1: Over-narrated extracurricular essay
  const overNarratedDecision = techniqueDecisionTree.decide({
    essayType: 'extracurricular',
    essay: SAMPLE_ESSAYS.over_narrated_ec,
    wordCount: SAMPLE_ESSAYS.over_narrated_ec.split(/\s+/).length,
    existingStrengths: ['storytelling', 'storytelling', 'voice_authenticity'],
    detectedIssues: [
      { type: 'over_narrated', severity: 'major', location: 'throughout', description: 'Heavy narrative, light evidence' }
    ],
  });

  logTestResult(
    'Over-narrated EC gets non-storytelling primary recommendation',
    assertNotStorytelling(overNarratedDecision.primary.category, 'over-narrated EC'),
    `Primary: ${overNarratedDecision.primary.category}`
  );

  logTestResult(
    'Decision includes reasoning about storytelling',
    overNarratedDecision.reasoning.whyNotStorytelling !== undefined ||
    overNarratedDecision.reasoning.keyFactors.some(f => f.includes('storytelling')),
    `Has storytelling reasoning: ${overNarratedDecision.reasoning.whyNotStorytelling ? 'yes' : 'no'}`
  );

  // Test 2: Generic Why Us essay
  const genericWhyUsDecision = techniqueDecisionTree.decide({
    essayType: 'why_us',
    essay: SAMPLE_ESSAYS.generic_why_us,
    wordCount: SAMPLE_ESSAYS.generic_why_us.split(/\s+/).length,
    existingStrengths: [],
    detectedIssues: [
      { type: 'SWAP_TEST_FAIL', severity: 'critical', location: 'throughout', description: 'No specific school details' }
    ],
  });

  logTestResult(
    'Generic Why Us gets connection_specificity recommendation',
    genericWhyUsDecision.primary.category === 'connection_specificity',
    `Primary: ${genericWhyUsDecision.primary.category}`
  );

  // Test 3: Why Major without technical depth
  const noTechDepthDecision = techniqueDecisionTree.decide({
    essayType: 'why_major',
    essay: SAMPLE_ESSAYS.no_technical_depth,
    wordCount: SAMPLE_ESSAYS.no_technical_depth.split(/\s+/).length,
    existingStrengths: [],
    detectedIssues: [
      { type: 'MISSING_TECHNICAL_DEPTH', severity: 'major', location: 'throughout', description: 'Passion without depth' }
    ],
  });

  logTestResult(
    'Why Major without depth gets technical_depth or intellectual_character',
    ['technical_depth', 'intellectual_character'].includes(noTechDepthDecision.primary.category),
    `Primary: ${noTechDepthDecision.primary.category}`
  );

  // Test 4: Actionable guidance is provided
  logTestResult(
    'Decisions include actionable guidance with whatToDo',
    overNarratedDecision.actionableGuidance.whatToDo.length >= 2,
    `whatToDo items: ${overNarratedDecision.actionableGuidance.whatToDo.length}`
  );

  logTestResult(
    'Decisions include whatToAvoid',
    overNarratedDecision.actionableGuidance.whatToAvoid.length >= 2,
    `whatToAvoid items: ${overNarratedDecision.actionableGuidance.whatToAvoid.length}`
  );

  logTestResult(
    'Decisions include reflection question',
    overNarratedDecision.actionableGuidance.questionToAsk.length > 10,
    `Question: "${overNarratedDecision.actionableGuidance.questionToAsk.substring(0, 50)}..."`
  );
}

async function testNewIssuePatternDetection() {
  console.log('\n🔍 TEST: New Non-Narrative Issue Pattern Detection\n');

  // Test SHALLOW_REFLECTION detection
  const shallowPatterns = detectPhrasePatterns(SAMPLE_ESSAYS.shallow_reflection);

  logTestResult(
    'Shallow reflection essay triggers SHALLOW_REFLECTION',
    shallowPatterns.includes('SHALLOW_REFLECTION'),
    `Detected: ${shallowPatterns.filter(p => p.includes('SHALLOW') || p.includes('GENERIC')).join(', ')}`
  );

  logTestResult(
    'Shallow reflection essay triggers MISSING_UNIQUE_INSIGHT',
    shallowPatterns.includes('MISSING_UNIQUE_INSIGHT'),
    `Detected: ${shallowPatterns.filter(p => p.includes('UNIQUE') || p.includes('INSIGHT')).join(', ')}`
  );

  // Test MISSING_TECHNICAL_DEPTH detection
  const noTechPatterns = detectPhrasePatterns(SAMPLE_ESSAYS.no_technical_depth, 'why_major');

  logTestResult(
    'No-depth essay triggers MISSING_TECHNICAL_DEPTH',
    noTechPatterns.includes('MISSING_TECHNICAL_DEPTH'),
    `Detected: ${noTechPatterns.filter(p => p.includes('TECHNICAL') || p.includes('PASSION')).join(', ')}`
  );

  // Test that good essay doesn't trigger false positives
  const goodEssayPatterns = detectPhrasePatterns(SAMPLE_ESSAYS.well_balanced, 'extracurricular');
  const falsePositives = goodEssayPatterns.filter(p =>
    p.includes('SHALLOW') || p.includes('MISSING_UNIQUE') || p.includes('MISSING_TECHNICAL')
  );

  logTestResult(
    'Good essay does NOT trigger shallow/missing patterns',
    falsePositives.length === 0,
    `False positives: ${falsePositives.length > 0 ? falsePositives.join(', ') : 'none'}`
  );
}

async function testMissingTechniqueIdentification() {
  console.log('\n📋 TEST: Missing Technique Identification\n');

  // Test extracurricular missing evidence
  const ecMissing = getMissingTechniques(
    ['storytelling', 'voice_authenticity'],
    'extracurricular'
  );

  logTestResult(
    'EC missing evidence identifies evidence_impact',
    ecMissing.includes('evidence_impact'),
    `Missing: ${ecMissing.join(', ')}`
  );

  // Test why_us missing specificity
  const whyUsMissing = getMissingTechniques(
    ['storytelling'],
    'why_us'
  );

  logTestResult(
    'Why Us missing identifies connection_specificity first',
    whyUsMissing[0] === 'connection_specificity' || whyUsMissing.includes('connection_specificity'),
    `Missing: ${whyUsMissing.join(', ')}`
  );

  // Test intellectual missing intellectual character
  const intellectualMissing = getMissingTechniques(
    ['storytelling', 'reflection_depth'],
    'intellectual'
  );

  logTestResult(
    'Intellectual missing identifies intellectual_character',
    intellectualMissing.includes('intellectual_character'),
    `Missing: ${intellectualMissing.join(', ')}`
  );
}

async function testTechniqueBundleCompleteness() {
  console.log('\n📦 TEST: Technique Bundle Completeness\n');

  const categories: TechniqueCategory[] = [
    'storytelling', 'technical_depth', 'evidence_impact', 'intellectual_character',
    'reflection_depth', 'voice_authenticity', 'complexity_showcase', 'connection_specificity'
  ];

  for (const category of categories) {
    const bundle = TECHNIQUE_BUNDLES[category];

    logTestResult(
      `${category} has complete bundle`,
      bundle &&
      bundle.corePrinciples.length >= 3 &&
      bundle.whenToUse.length >= 2 &&
      bundle.whenToAvoid.length >= 1 &&
      bundle.antiPatterns.length >= 2,
      `Principles: ${bundle?.corePrinciples.length}, WhenToUse: ${bundle?.whenToUse.length}`
    );
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  NUANCED GUIDANCE SYSTEM - Test Suite');
  console.log('  Testing context-aware technique recommendations beyond storytelling');
  console.log('═══════════════════════════════════════════════════════════════');

  try {
    await testEssayElementDetection();
    await testFullStructureAnalysis();
    await testStorytellingOveruseDetection();
    await testTechniqueRecommendations();
    await testDecisionTreeDecisions();
    await testNewIssuePatternDetection();
    await testMissingTechniqueIdentification();
    await testTechniqueBundleCompleteness();

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  TEST SUITE COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
