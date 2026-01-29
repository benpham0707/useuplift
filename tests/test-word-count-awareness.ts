/**
 * Test Word Count Awareness
 *
 * Tests that AI coach properly handles word count constraints:
 * - Suggests cuts when near/over limit
 * - Calculates trade-offs (add X, cut Y)
 * - Shows the math explicitly
 */

import 'dotenv/config';
import { buildPIQChatContext } from './src/services/piqWorkshop/piqChatContext';
import { sendPIQChatMessage } from './src/services/piqWorkshop/piqChatService';
import fs from 'fs/promises';

// ============================================================================
// TEST ESSAYS WITH DIFFERENT WORD COUNTS
// ============================================================================

const OVER_LIMIT_ESSAY = {
  promptId: 'piq1',
  promptTitle: 'Leadership Experience',
  promptText: 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time.',
  draft: `I have always been incredibly passionate about making a real difference in my community through volunteer work and leadership opportunities. During my junior year, I founded the Environmental Action Club at my school with just three members who shared my vision for creating positive change. Initially, our beach cleanups attracted only a handful of students who were interested in environmental issues, but I knew we needed to think bigger and reach more people.

I spent weeks researching plastic pollution data and environmental statistics, crafting a comprehensive proposal for the school administration. The breakthrough came when I presented to the school board, armed with compelling statistics showing our campus generated over 2,000 plastic bottles weekly. My voice shook with nervousness, but I pushed through with determination. The board approved funding for water refill stations across all buildings, which was a great victory.

Within one semester, we successfully reduced single-use plastic waste by 47% and grew our club membership to 45 active members. More importantly, I learned that leadership isn't about having all the answers—it's about channeling collective passion into measurable change. This experience taught me valuable lessons about perseverance, communication, and the importance of environmental stewardship that I will carry forward into my future endeavors at college and beyond.`, // 213 words but let's say 365 for testing
  nqi: 72,
  initialNqi: 65,
  wordCount: 365, // Manually set for testing
};

const NEAR_LIMIT_ESSAY = {
  promptId: 'piq1',
  promptTitle: 'Leadership Experience',
  promptText: 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time.',
  draft: `During my junior year, I founded the Environmental Action Club at my school with just three members. Initially, our beach cleanups attracted only a handful of students, but I knew we needed to think bigger. I spent weeks researching plastic pollution data and crafting a proposal for the administration.

The breakthrough came when I presented to the school board, armed with statistics showing our campus generated over 2,000 plastic bottles weekly. My voice shook, but I pushed through. The board approved funding for water refill stations across all buildings.

Within one semester, we reduced single-use plastic waste by 47% and grew our club to 45 active members. More importantly, I learned that leadership isn't about having all the answers—it's about channeling collective passion into measurable change that outlasts your involvement.`, // ~110 words but let's say 342 for testing
  nqi: 75,
  initialNqi: 68,
  wordCount: 342, // Manually set - near limit
};

const PLENTY_OF_ROOM_ESSAY = {
  promptId: 'piq1',
  promptTitle: 'Leadership Experience',
  promptText: 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time.',
  draft: `I founded the Environmental Action Club at my school with three members. Our beach cleanups attracted only a handful of students at first. I researched plastic pollution data and presented to the school board. They approved funding for water refill stations.

We reduced plastic waste by 47% and grew to 45 members. I learned that leadership means channeling collective passion into measurable change.`, // ~60 words but let's say 280 for testing
  nqi: 68,
  initialNqi: 62,
  wordCount: 280, // Plenty of room
};

// ============================================================================
// MOCK ANALYSIS
// ============================================================================

function createMockAnalysis(essay: typeof OVER_LIMIT_ESSAY) {
  return {
    analysis: {
      narrative_quality_index: essay.nqi,
    },
    voiceFingerprint: {
      sentenceStructure: {
        pattern: 'Formal essay structure with complex sentences',
        example: 'I have always been incredibly passionate about making a real difference.',
      },
      vocabulary: {
        level: 'Formal academic with some generic phrases',
        signatureWords: ['passionate', 'comprehensive', 'compelling', 'endeavors'],
      },
      pacing: {
        speed: 'Measured',
        rhythm: 'Even, methodical',
      },
      tone: {
        primary: 'Earnest',
        secondary: 'Formal',
      },
    },
    experienceFingerprint: {
      uniqueElements: {},
      antiPatternFlags: {
        followsTypicalArc: true,
        hasGenericInsight: true,
        hasManufacturedBeat: false,
        hasCrowdPleaser: false,
        warnings: ['Contains generic phrases that could be cut'],
      },
      divergenceRequirements: {
        mustInclude: [],
        mustAvoid: ['Generic enthusiasm', 'Throat-clearing phrases'],
        uniqueAngle: '',
        authenticTension: '',
      },
      qualityAnchors: [],
      confidenceScore: 6.5,
    },
    rubricDimensionDetails: [],
    workshopItems: [],
  };
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

async function runTest(
  essay: typeof OVER_LIMIT_ESSAY,
  question: string,
  testName: string
) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST: ${testName}`);
  console.log(`${'='.repeat(80)}\n`);

  const analysisResult = createMockAnalysis(essay) as any;

  // Override word count in draft for testing
  const testDraft = essay.draft;

  const context = buildPIQChatContext(
    essay.promptId,
    essay.promptText,
    essay.promptTitle,
    testDraft,
    analysisResult,
    {
      currentScore: essay.nqi,
      initialScore: essay.initialNqi,
      hasUnsavedChanges: false,
      needsReanalysis: false,
    }
  );

  // Manually override word count for testing
  context.currentState.wordCount = essay.wordCount;

  try {
    const response = await sendPIQChatMessage({
      userMessage: question,
      context,
      conversationHistory: [],
    });

    console.log(`WORD COUNT: ${essay.wordCount}/350\n`);
    console.log(`QUESTION: "${question}"\n`);
    console.log(`RESPONSE:\n${response.message.content}\n`);
    console.log(`${'─'.repeat(80)}\n`);

    return {
      testName,
      wordCount: essay.wordCount,
      question,
      response: response.message.content,
    };
  } catch (error) {
    console.error(`❌ Test failed:`, error);
    return {
      testName,
      wordCount: essay.wordCount,
      question,
      response: `ERROR: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log('\n🧪 TESTING WORD COUNT AWARENESS\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ No ANTHROPIC_API_KEY found in environment');
    process.exit(1);
  }

  const results = [];

  // Test 1: Over limit - requesting additions
  results.push(
    await runTest(
      OVER_LIMIT_ESSAY,
      "I want to add more specific details about the school board presentation. What should I add?",
      'Test 1: Over Limit (365) - Requesting Additions'
    )
  );

  // Test 2: Over limit - general improvement
  results.push(
    await runTest(
      OVER_LIMIT_ESSAY,
      "How can I make this stronger?",
      'Test 2: Over Limit (365) - General Improvement'
    )
  );

  // Test 3: Near limit - requesting additions
  results.push(
    await runTest(
      NEAR_LIMIT_ESSAY,
      "Should I add dialogue to make this more engaging?",
      'Test 3: Near Limit (342) - Requesting Dialogue'
    )
  );

  // Test 4: Near limit - specific scene
  results.push(
    await runTest(
      NEAR_LIMIT_ESSAY,
      "I want to add a specific moment showing my voice shaking. Will that fit?",
      'Test 4: Near Limit (342) - Specific Addition'
    )
  );

  // Test 5: Plenty of room - requesting additions
  results.push(
    await runTest(
      PLENTY_OF_ROOM_ESSAY,
      "This feels too short. What should I add?",
      'Test 5: Plenty of Room (280) - Requesting Additions'
    )
  );

  // Test 6: Plenty of room - specific expansion
  results.push(
    await runTest(
      PLENTY_OF_ROOM_ESSAY,
      "Can I add more about how I presented to the board?",
      'Test 6: Plenty of Room (280) - Specific Expansion'
    )
  );

  // Save results to file
  const markdown = generateMarkdownReport(results);
  await fs.writeFile('WORD_COUNT_TEST_RESULTS.md', markdown);

  console.log('\n✅ All tests complete!');
  console.log('📄 Results saved to: WORD_COUNT_TEST_RESULTS.md\n');
}

function generateMarkdownReport(results: any[]) {
  let md = `# Word Count Awareness Test Results\n\n`;
  md += `**Test Date**: ${new Date().toISOString()}\n`;
  md += `**System Enhancement**: Word count awareness with strategic cuts\n\n`;
  md += `---\n\n`;

  results.forEach((result, idx) => {
    md += `## ${result.testName}\n\n`;
    md += `**Word Count**: ${result.wordCount}/350 ${result.wordCount > 350 ? '⚠️ OVER LIMIT' : result.wordCount >= 340 ? '⚠️ NEAR LIMIT' : '✅ ROOM AVAILABLE'}\n\n`;
    md += `**Student Question**:\n> ${result.question}\n\n`;
    md += `**AI Coach Response**:\n${result.response}\n\n`;

    // Analysis
    const hasCalculation = result.response.includes('words') && (result.response.includes('→') || result.response.includes('adding') || result.response.includes('cut'));
    const suggestsCuts = result.response.toLowerCase().includes('cut') || result.response.toLowerCase().includes('remove') || result.response.toLowerCase().includes('delete');
    const showsMath = result.response.includes('→') || result.response.match(/\d+\s*words/);

    md += `**✅ Quality Checks**:\n`;
    md += `- ${hasCalculation ? '✅' : '❌'} References word count\n`;
    md += `- ${suggestsCuts && result.wordCount >= 340 ? '✅' : result.wordCount < 340 ? '✅' : '❌'} Suggests cuts when needed\n`;
    md += `- ${showsMath ? '✅' : '❌'} Shows the math\n\n`;

    md += `---\n\n`;
  });

  return md;
}

// Run tests
runAllTests().catch(console.error);
