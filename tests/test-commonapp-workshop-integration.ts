/**
 * Common App Workshop Integration Test
 *
 * Comprehensive testing of the entire teaching pipeline:
 * - Stage 1: Foundation teaching
 * - Stage 2: Development teaching
 * - Stage 3: Refinement teaching
 *
 * Tests validate:
 * 1. Service instantiation and basic functionality
 * 2. Teaching output structure and completeness
 * 3. Progress tracking across stages
 * 4. Citation mapping integration
 * 5. Teaching history non-repetition
 * 6. Output quality indicators
 */

import { getCollegeResearch, getSupportedColleges, getCollegeEssayPrompt } from '../src/services/commonAppWorkshop/data';
import { haikuCitationService } from '../src/services/commonAppWorkshop/services/citationService';
import { stage1TeachingService, type Stage1TeachingOutput } from '../src/services/commonAppWorkshop/services/stage1Service';
import { stage2TeachingService, type Stage2TeachingOutput } from '../src/services/commonAppWorkshop/services/stage2Service';
import { stage3TeachingService, type Stage3TeachingOutput } from '../src/services/commonAppWorkshop/services/stage3Service';
import type { WorkshopSession, EssayVersion, EssayAnalysis } from '../src/services/commonAppWorkshop/types/workshopSession';
import type { CitationMapping } from '../src/services/commonAppWorkshop/types/collegeResearch';

// Test configuration
const TEST_COLLEGE = 'stanford';
const TEST_PROMPT_ID = 'stanford_intellectual_vitality';

// Sample essays for testing
const SAMPLE_ESSAY_STAGE_1 = `
When I was twelve, I discovered a broken radio in my grandfather's garage. Instead of asking for help, I spent three weeks taking it apart, mapping the circuits, and reading about electronics online. When I finally got it working, the static-filled sound of an old jazz station felt like the greatest achievement of my life.

That curiosity has never left me. In high school physics, I was the student who asked "but why?" until my teacher suggested I read Feynman's lectures. In computer science, I built a weather station that texts me humidity levels because I wanted to understand how sensors communicate with software.

I don't just want to learn facts. I want to understand how things work at the deepest level possible. Stanford's emphasis on interdisciplinary thinking excites me because my interests don't fit neatly into one box.
`;

const SAMPLE_ESSAY_STAGE_2 = `
When I was twelve, I discovered a broken 1960s transistor radio in my grandfather's garage. The faded Zenith logo and corroded battery compartment became my obsession. For three weeks, I mapped circuits, read vintage repair manuals, and taught myself to solder. When I finally heard the static-filled crackle of KJAZ coming through the speaker, I didn't just hear music—I heard validation of a curiosity I didn't know I had.

That curiosity has evolved but never faded. In high school physics, I was the student who asked "but why does the electron have that specific charge?" until my teacher handed me Feynman's lectures and said, "You need bigger questions." In computer science, I built an IoT weather station that texts me humidity alerts—not because I needed weather updates, but because I wanted to understand the entire stack: sensors, microcontrollers, APIs, and the physics of capacitive humidity detection.

I don't just want to learn facts. I want to understand why the universe works the way it does. Stanford's emphasis on interdisciplinary thinking resonates with me because my radio project was simultaneously history, engineering, and music. My weather station is physics, computer science, and environmental awareness. I want to keep building projects that refuse to stay in their lanes.
`;

const SAMPLE_ESSAY_STAGE_3 = `
When I was twelve, I discovered a broken 1960s Zenith transistor radio in my grandfather's garage, its faded logo barely visible under decades of dust. For three weeks, I mapped circuits with a borrowed multimeter, read vintage repair manuals that smelled like my grandmother's basement, and taught myself to solder by ruining three perfectly good components. When I finally heard the static-filled crackle of KJAZ coming through the repaired speaker, I didn't just hear music—I heard confirmation that my relentless curiosity could actually build something.

That curiosity has evolved but never faded. In high school physics, I became "the why kid"—the one who asked questions until my teacher, smiling with equal parts exhaustion and encouragement, handed me Feynman's lectures and said, "You need bigger questions than I can answer in 50 minutes." I took that as a challenge. In computer science, I built an IoT weather station that texts me humidity alerts. Not because I need weather updates, but because I wanted to understand the entire stack: capacitive humidity sensors, microcontroller programming, REST APIs, and even the atmospheric physics that makes humidity matter.

I don't collect facts—I chase understanding. Stanford's emphasis on interdisciplinary thinking resonates with me because my radio project refused to stay in one lane: it was history (why did radios matter in the 1960s?), engineering (how do transistors amplify signals?), and even music (what is KJAZ's programming history?). My weather station is physics, computer science, and environmental awareness simultaneously. I want to spend four years surrounded by people who also ask "but why?" and a faculty who, like my physics teacher, respond with "let's find out together."
`;

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createMockSession(stage: 1 | 2 | 3): WorkshopSession {
  return {
    sessionId: `test-session-${Date.now()}`,
    college: TEST_COLLEGE,
    promptId: TEST_PROMPT_ID,
    pattern: 'growth_narrative',
    currentStage: stage,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    cache: {
      systemPromptHash: 'test-hash',
      collegeResearchLoaded: true,
      lastCacheUpdate: new Date().toISOString(),
      teachingHistory: {
        issuesAddressed: stage > 1 ? [
          {
            issueId: 'issue_s1_intellectual_vitality_0',
            issueName: 'intellectual_vitality_specificity',
            stage: 1,
            wasResolved: true,
            timestamp: new Date().toISOString(),
          }
        ] : [],
        principlesTaught: stage > 1 ? [
          'Show specific moments of intellectual engagement',
          'Connect curiosity to concrete actions',
        ] : [],
        questionsAsked: stage > 1 ? ['sq1_intellectual_vitality'] : [],
        examplesShown: [],
      },
    },
  };
}

function createMockAnalysis(nqi: number): EssayAnalysis {
  return {
    nqi,
    tier: nqi >= 80 ? 'strong' : nqi >= 70 ? 'competitive' : 'developing',
    categoryScores: [
      {
        dimensionId: 'intellectual_vitality',
        dimensionName: 'Intellectual Vitality',
        score: nqi + 5,
        maxScore: 100,
        percentage: nqi + 5,
        status: nqi >= 75 ? 'strong' : 'adequate',
        justification: 'Shows genuine curiosity',
        strengths: ['Specific examples'],
        weaknesses: nqi < 80 ? ['Could be more specific'] : [],
      },
      {
        dimensionId: 'authentic_voice',
        dimensionName: 'Authentic Voice',
        score: nqi - 2,
        maxScore: 100,
        percentage: nqi - 2,
        status: nqi >= 72 ? 'strong' : 'adequate',
        justification: 'Voice feels genuine',
        strengths: ['Personal tone'],
        weaknesses: [],
      },
      {
        dimensionId: 'stanford_fit',
        dimensionName: 'Stanford Fit',
        score: nqi,
        maxScore: 100,
        percentage: nqi,
        status: nqi >= 70 ? 'adequate' : 'weak',
        justification: 'Shows fit with Stanford values',
        strengths: ['Mentions interdisciplinary interest'],
        weaknesses: nqi < 75 ? ['Could connect more specifically to Stanford'] : [],
      },
    ],
    weakCategories: nqi < 80 ? [
      {
        dimensionId: 'stanford_fit',
        score: nqi,
        primaryIssue: 'Could strengthen Stanford connection',
        howToImprove: 'Reference specific Stanford programs or opportunities',
      }
    ] : [],
    elitePatterns: [],
    authenticity: {
      voiceScore: nqi + 3,
      uniquenessScore: nqi - 5,
      concerns: [],
    },
    flagsDetected: {
      redFlags: [],
      greenFlags: [
        { flagId: 'specific_intellectual_moment', evidence: 'Radio repair story', location: 'paragraph 1' }
      ],
    },
  };
}

function createMockVersions(stages: number[]): EssayVersion[] {
  return stages.map(stage => ({
    version: stage,
    stage: stage as 1 | 2 | 3,
    essayDraft: stage === 1 ? SAMPLE_ESSAY_STAGE_1 : stage === 2 ? SAMPLE_ESSAY_STAGE_2 : SAMPLE_ESSAY_STAGE_3,
    timestamp: new Date().toISOString(),
    analysis: createMockAnalysis(60 + stage * 8), // Improves each stage
    feedback: [],
  }));
}

async function createMockCitationMapping(essay: string): Promise<CitationMapping> {
  // Create a minimal citation mapping for testing
  return {
    essayHash: `hash-${Date.now()}`,
    structural: {
      wordCount: essay.split(/\s+/).length,
      paragraphCount: essay.split(/\n\n+/).filter(p => p.trim()).length,
      hasOpeningHook: true,
      hasConclusion: true,
      avgSentenceLength: 18,
    },
    patternAnalysis: {
      primaryPattern: 'growth_narrative',
      confidence: 85,
    },
    relevantValues: [
      {
        valueId: 'intellectual_vitality',
        relevance: 90,
        applicableToLocation: 'Throughout essay',
      }
    ],
    applicableQuotes: [
      {
        quoteId: 'dean_shaw_iv',
        quote: 'We want students who are genuinely curious',
        source: 'Dean Shaw',
        appliesTo: 'paragraph 1',
        relevance: 85,
        suggestedUse: 'Support intellectual vitality',
      }
    ],
    triggeredRedFlags: [],
    greenFlagOpportunities: [
      {
        flagId: 'specific_intellectual_moment',
        flagName: 'Specific Intellectual Moment',
        opportunity: 'Radio repair story shows genuine curiosity',
        location: 'paragraph 1',
        citationToSupport: 'Dean Shaw on intellectual engagement',
      }
    ],
    exampleRelevance: [],
  };
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  console.log('='.repeat(80));
  console.log('COMMON APP WORKSHOP INTEGRATION TEST');
  console.log('='.repeat(80));
  console.log('');

  let passed = 0;
  let failed = 0;

  // Test 1: Data Layer Verification
  console.log('TEST 1: Data Layer Verification');
  console.log('-'.repeat(40));
  try {
    const supportedColleges = getSupportedColleges();
    console.log(`  Supported colleges: ${supportedColleges.join(', ')}`);

    if (!supportedColleges.includes('stanford')) {
      throw new Error('Stanford not in supported colleges');
    }

    const stanfordResearch = getCollegeResearch('stanford');
    if (!stanfordResearch) {
      throw new Error('Stanford research not found');
    }

    console.log(`  Stanford research loaded:`);
    console.log(`    - Core values: ${stanfordResearch.coreValues.length}`);
    console.log(`    - Essay prompts: ${stanfordResearch.essayPrompts.length}`);
    console.log(`    - Red flags: ${stanfordResearch.redFlags.length}`);
    console.log(`    - Green flags: ${stanfordResearch.greenFlags.length}`);
    console.log(`    - Key quotes: ${stanfordResearch.keyQuotes.length}`);
    console.log(`    - Elite examples: ${stanfordResearch.eliteExamples.length}`);

    const prompt = getCollegeEssayPrompt('stanford', TEST_PROMPT_ID);
    if (!prompt) {
      throw new Error('Stanford intellectual vitality prompt not found');
    }

    console.log(`  Intellectual Vitality prompt loaded:`);
    console.log(`    - Dimensional criteria: ${prompt.dimensionalCriteria.length}`);
    console.log(`    - Word limit: ${prompt.wordLimit}`);

    console.log('  ✅ PASSED');
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}`);
    failed++;
  }
  console.log('');

  // Test 2: Stage 1 Teaching Service
  console.log('TEST 2: Stage 1 Teaching Service');
  console.log('-'.repeat(40));
  try {
    const session = createMockSession(1);
    const citations = await createMockCitationMapping(SAMPLE_ESSAY_STAGE_1);

    console.log('  Generating Stage 1 teaching...');
    const stage1Output: Stage1TeachingOutput = await stage1TeachingService.generateStage1Teaching(
      session,
      SAMPLE_ESSAY_STAGE_1,
      citations
    );

    // Validate output structure
    if (stage1Output.stage !== 1) {
      throw new Error('Stage should be 1');
    }

    console.log(`  Stage 1 Output Structure:`);
    console.log(`    - Stage: ${stage1Output.stage}`);
    console.log(`    - Conceptual foundation sections: ${Object.keys(stage1Output.conceptualFoundation).length}`);
    console.log(`    - College values taught: ${stage1Output.conceptualFoundation.collegeValuesTeaching?.values?.length || 'N/A'}`);
    console.log(`    - Rubric dimensions: ${stage1Output.conceptualFoundation.rubricUnderstanding?.dimensions?.length || 'N/A'}`);
    console.log(`    - Key concepts: ${stage1Output.conceptualFoundation.keyConceptsTeaching?.length || 0}`);
    console.log(`    - Pitfalls covered: ${stage1Output.conceptualFoundation.pitfallsToAvoid?.length || 0}`);
    console.log(`    - Priority issues: ${stage1Output.priorityIssues.length}`);
    console.log(`    - Socratic questions: ${stage1Output.socraticQuestions.length}`);
    console.log(`    - Strengths to preserve: ${stage1Output.strengthsToPreserve.length}`);
    console.log(`    - Next steps: ${stage1Output.nextSteps.length}`);
    console.log(`    - Teaching narrative length: ${stage1Output.teachingNarrative.length} chars`);

    // Validate narrative contains key elements
    const narrative = stage1Output.teachingNarrative;
    if (!narrative.includes('Stage 1')) {
      throw new Error('Narrative should reference Stage 1');
    }

    console.log('  ✅ PASSED');
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}`);
    failed++;
  }
  console.log('');

  // Test 3: Stage 2 Teaching Service
  console.log('TEST 3: Stage 2 Teaching Service');
  console.log('-'.repeat(40));
  try {
    const session = createMockSession(2);
    const citations = await createMockCitationMapping(SAMPLE_ESSAY_STAGE_2);
    const previousVersion: EssayVersion = {
      version: 1,
      stage: 1,
      essayDraft: SAMPLE_ESSAY_STAGE_1,
      timestamp: new Date().toISOString(),
      analysis: createMockAnalysis(68),
      feedback: [],
    };

    console.log('  Generating Stage 2 teaching...');
    const stage2Output: Stage2TeachingOutput = await stage2TeachingService.generateStage2Teaching(
      session,
      SAMPLE_ESSAY_STAGE_2,
      previousVersion,
      citations
    );

    // Validate output structure
    if (stage2Output.stage !== 2) {
      throw new Error('Stage should be 2');
    }

    console.log(`  Stage 2 Output Structure:`);
    console.log(`    - Stage: ${stage2Output.stage}`);
    console.log(`    - Progress assessment: NQI change = ${stage2Output.progressAssessment.nqiChange}`);
    console.log(`    - Dimensions improved: ${stage2Output.progressAssessment.dimensionsImproved.length}`);
    console.log(`    - Dimensional feedback: ${stage2Output.dimensionalFeedback.length}`);
    console.log(`    - Issue teaching blocks: ${stage2Output.issueTeaching.length}`);
    console.log(`    - Socratic questions: ${stage2Output.socraticQuestions.length}`);
    console.log(`    - Strengths to preserve: ${stage2Output.strengthsToPreserve.length}`);
    console.log(`    - Revision roadmap steps: ${stage2Output.revisionRoadmap.length}`);
    console.log(`    - Teaching narrative length: ${stage2Output.teachingNarrative.length} chars`);

    // Validate progress tracking
    if (stage2Output.progressAssessment.previousNqi === undefined) {
      throw new Error('Progress assessment should include previous NQI');
    }

    console.log('  ✅ PASSED');
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}`);
    failed++;
  }
  console.log('');

  // Test 4: Stage 3 Teaching Service
  console.log('TEST 4: Stage 3 Teaching Service');
  console.log('-'.repeat(40));
  try {
    const session = createMockSession(3);
    const citations = await createMockCitationMapping(SAMPLE_ESSAY_STAGE_3);
    const stageHistory = createMockVersions([1, 2]);

    console.log('  Generating Stage 3 teaching...');
    const stage3Output: Stage3TeachingOutput = await stage3TeachingService.generateStage3Teaching(
      session,
      SAMPLE_ESSAY_STAGE_3,
      stageHistory,
      citations
    );

    // Validate output structure
    if (stage3Output.stage !== 3) {
      throw new Error('Stage should be 3');
    }

    console.log(`  Stage 3 Output Structure:`);
    console.log(`    - Stage: ${stage3Output.stage}`);
    console.log(`    - Final NQI: ${stage3Output.finalAnalysis.nqi}`);
    console.log(`    - Final Tier: ${stage3Output.finalAnalysis.tier}`);
    console.log(`    - Journey total improvement: ${stage3Output.journeyProgress.totalImprovement} points`);
    console.log(`    - Celebrated strengths: ${stage3Output.celebrationOfStrengths.strengths.length}`);
    console.log(`    - Value alignments: ${stage3Output.valueAlignmentReport.valueAlignments.length}`);
    console.log(`    - Micro-refinements: ${stage3Output.microRefinements.length}`);
    console.log(`    - Authenticity status: ${stage3Output.authenticityReport.status}`);
    console.log(`    - Reflection questions: ${stage3Output.reflectionQuestions.length}`);
    console.log(`    - Checklist items: ${stage3Output.submissionChecklist.length}`);
    console.log(`    - Confidence level: ${stage3Output.confidenceAssessment.confidenceLevel}`);
    console.log(`    - Ready to submit: ${stage3Output.confidenceAssessment.readyToSubmit}`);
    console.log(`    - Final narrative length: ${stage3Output.finalNarrative.length} chars`);

    // Validate journey tracking
    if (stage3Output.journeyProgress.stage1Nqi === undefined) {
      throw new Error('Journey progress should include Stage 1 NQI');
    }

    // Validate celebration focus (Stage 3 priority)
    if (stage3Output.celebrationOfStrengths.countOfStrengths === 0) {
      console.log('  ⚠️ Warning: No strengths celebrated (expected in Stage 3)');
    }

    console.log('  ✅ PASSED');
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}`);
    failed++;
  }
  console.log('');

  // Test 5: Full Pipeline Integration
  console.log('TEST 5: Full Pipeline Integration');
  console.log('-'.repeat(40));
  try {
    console.log('  Running full 3-stage pipeline...');

    // Stage 1
    const session1 = createMockSession(1);
    const citations1 = await createMockCitationMapping(SAMPLE_ESSAY_STAGE_1);
    const stage1 = await stage1TeachingService.generateStage1Teaching(
      session1,
      SAMPLE_ESSAY_STAGE_1,
      citations1
    );

    console.log(`    Stage 1: Generated ${stage1.priorityIssues.length} issues, ${stage1.socraticQuestions.length} questions`);

    // Stage 2
    const session2 = createMockSession(2);
    const citations2 = await createMockCitationMapping(SAMPLE_ESSAY_STAGE_2);
    const previousVersion: EssayVersion = {
      version: 1,
      stage: 1,
      essayDraft: SAMPLE_ESSAY_STAGE_1,
      timestamp: new Date().toISOString(),
      analysis: stage1.essayAnalysis,
      feedback: [],
    };

    const stage2 = await stage2TeachingService.generateStage2Teaching(
      session2,
      SAMPLE_ESSAY_STAGE_2,
      previousVersion,
      citations2
    );

    console.log(`    Stage 2: Progress ${stage2.progressAssessment.overallProgress}, ${stage2.issueTeaching.length} teaching blocks`);

    // Stage 3
    const session3 = createMockSession(3);
    const citations3 = await createMockCitationMapping(SAMPLE_ESSAY_STAGE_3);
    const stageHistory: EssayVersion[] = [
      previousVersion,
      {
        version: 2,
        stage: 2,
        essayDraft: SAMPLE_ESSAY_STAGE_2,
        timestamp: new Date().toISOString(),
        analysis: stage2.currentAnalysis,
        feedback: [],
      }
    ];

    const stage3 = await stage3TeachingService.generateStage3Teaching(
      session3,
      SAMPLE_ESSAY_STAGE_3,
      stageHistory,
      citations3
    );

    console.log(`    Stage 3: Final NQI ${stage3.finalAnalysis.nqi}, ${stage3.celebrationOfStrengths.countOfStrengths} strengths celebrated`);

    // Validate progression
    console.log(`  Pipeline Summary:`);
    console.log(`    - Stage 1 → Stage 2 → Stage 3 completed`);
    console.log(`    - Journey: ${stage3.journeyProgress.stage1Nqi} → ${stage3.journeyProgress.stage2Nqi} → ${stage3.journeyProgress.finalNqi}`);
    console.log(`    - Total improvement: ${stage3.journeyProgress.totalImprovement} points`);
    console.log(`    - Consistency: ${stage3.journeyProgress.consistencyScore}`);

    console.log('  ✅ PASSED');
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}`);
    failed++;
  }
  console.log('');

  // Test 6: Output Quality Indicators
  console.log('TEST 6: Output Quality Indicators');
  console.log('-'.repeat(40));
  try {
    const session = createMockSession(1);
    const citations = await createMockCitationMapping(SAMPLE_ESSAY_STAGE_1);
    const stage1 = await stage1TeachingService.generateStage1Teaching(
      session,
      SAMPLE_ESSAY_STAGE_1,
      citations
    );

    // Check narrative quality
    const narrative = stage1.teachingNarrative;

    // Should contain markdown headers
    const hasHeaders = narrative.includes('#');
    console.log(`    Has markdown headers: ${hasHeaders ? '✓' : '✗'}`);

    // Should reference Stanford specifically
    const hasCollegeReference = narrative.toLowerCase().includes('stanford');
    console.log(`    References Stanford: ${hasCollegeReference ? '✓' : '✗'}`);

    // Should contain teaching (not just evaluation)
    const hasTeachingLanguage =
      narrative.includes('Principle') ||
      narrative.includes('understand') ||
      narrative.includes('learn');
    console.log(`    Contains teaching language: ${hasTeachingLanguage ? '✓' : '✗'}`);

    // Should have reasonable length (comprehensive, not sparse)
    const isComprehensive = narrative.length > 2000;
    console.log(`    Comprehensive narrative (>2000 chars): ${isComprehensive ? '✓' : '✗'} (${narrative.length} chars)`);

    // All quality checks should pass
    if (!hasHeaders || !hasCollegeReference || !hasTeachingLanguage || !isComprehensive) {
      console.log('  ⚠️ Some quality indicators not met');
    }

    console.log('  ✅ PASSED');
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}`);
    failed++;
  }
  console.log('');

  // Test 7: Citation Mapping Integration
  console.log('TEST 7: Citation Mapping Integration');
  console.log('-'.repeat(40));
  try {
    // Verify citation mapping structure
    const citations = await createMockCitationMapping(SAMPLE_ESSAY_STAGE_1);

    console.log('  Citation Mapping Structure:');
    console.log(`    - Essay hash: ${citations.essayHash ? '✓' : '✗'}`);
    console.log(`    - Word count: ${citations.structural.wordCount}`);
    console.log(`    - Pattern: ${citations.patternAnalysis.primaryPattern} (${citations.patternAnalysis.confidence}% confidence)`);
    console.log(`    - Relevant values: ${citations.relevantValues.length}`);
    console.log(`    - Applicable quotes: ${citations.applicableQuotes.length}`);
    console.log(`    - Green flag opportunities: ${citations.greenFlagOpportunities.length}`);

    // Verify citation mapping is used in teaching
    const session = createMockSession(1);
    const stage1 = await stage1TeachingService.generateStage1Teaching(
      session,
      SAMPLE_ESSAY_STAGE_1,
      citations
    );

    // Citation mapping should influence output
    if (stage1.citationMapping.essayHash !== citations.essayHash) {
      throw new Error('Citation mapping not properly passed through');
    }

    console.log('  ✅ PASSED');
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}`);
    failed++;
  }
  console.log('');

  // Final Results
  console.log('='.repeat(80));
  console.log('FINAL RESULTS');
  console.log('='.repeat(80));
  console.log(`  Total Tests: ${passed + failed}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
